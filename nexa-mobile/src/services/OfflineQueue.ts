import AsyncStorage from "@react-native-async-storage/async-storage";
import { api } from "../lib/api";

/**
 * Nexa ERP - Çevrimdışı Senkronizasyon Görevi (Offline Task) Arayüzü
 */
export interface OfflineTask {
  id: string;
  endpoint: string;
  payload: any;
  method: "POST" | "PATCH" | "PUT" | "DELETE" | "GET";
  type?: "JOURNAL" | "SIGNATURE" | "QR" | "INSPECTION" | "OTHER";
  title?: string;
  createdAt: string;
  attempts?: number;
  lastError?: string;
}

export const OFFLINE_STORAGE_KEY = "OFFLINE_TASKS";

class OfflineQueueService {
  private isProcessing = false;
  private listeners: Array<(queue: OfflineTask[]) => void> = [];

  /**
   * Kuyruktaki tüm görevleri döner
   */
  async getQueue(): Promise<OfflineTask[]> {
    try {
      const stored = await AsyncStorage.getItem(OFFLINE_STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (err) {
      console.error("[OfflineQueue] Kuyruk okunurken hata:", err);
    }
    return [];
  }

  /**
   * Kuyruk sayısını döner
   */
  async getQueueCount(): Promise<number> {
    const queue = await this.getQueue();
    return queue.length;
  }

  /**
   * ADIM 2: İnternet yoksa isteği AsyncStorage üzerindeki OFFLINE_TASKS kuyruğuna ekle
   */
  async addToQueue(
    endpoint: string,
    payload: any,
    method: "POST" | "PATCH" | "PUT" | "DELETE" | "GET" = "POST",
    options?: {
      type?: "JOURNAL" | "SIGNATURE" | "QR" | "INSPECTION" | "OTHER";
      title?: string;
    }
  ): Promise<OfflineTask> {
    const queue = await this.getQueue();

    const newTask: OfflineTask = {
      id: `task_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      endpoint,
      payload,
      method,
      type: options?.type || "OTHER",
      title: options?.title || "Çevrimdışı İstek",
      createdAt: new Date().toISOString(),
      attempts: 0,
    };

    const updatedQueue = [...queue, newTask];
    await AsyncStorage.setItem(
      OFFLINE_STORAGE_KEY,
      JSON.stringify(updatedQueue)
    );

    console.log(
      `[OfflineQueue] Görev kuyruğa eklendi: [${method}] ${endpoint} (Kuyruk Boyutu: ${updatedQueue.length})`
    );

    this.notifyListeners(updatedQueue);
    return newTask;
  }

  /**
   * ADIM 2: Kuyruktaki tüm istekleri sırayla Axios ile backend'e at, başarılı olanları kuyruktan sil
   */
  async processQueue(): Promise<{
    processedCount: number;
    successCount: number;
    failedCount: number;
  }> {
    if (this.isProcessing) {
      console.log("[OfflineQueue] Senkronizasyon işlemi zaten devam ediyor.");
      return { processedCount: 0, successCount: 0, failedCount: 0 };
    }

    const currentQueue = await this.getQueue();
    if (currentQueue.length === 0) {
      return { processedCount: 0, successCount: 0, failedCount: 0 };
    }

    this.isProcessing = true;
    console.log(
      `[OfflineQueue] Otomatik senkronizasyon başladı: ${currentQueue.length} görev işlenecek...`
    );

    let successCount = 0;
    let failedCount = 0;
    const remainingTasks: OfflineTask[] = [];

    for (const task of currentQueue) {
      try {
        console.log(`[OfflineQueue] Görev işleniyor: [${task.method}] ${task.endpoint}`);

        // Axios isteğini tetikle
        switch (task.method) {
          case "PATCH":
            await api.patch(task.endpoint, task.payload);
            break;
          case "PUT":
            await api.put(task.endpoint, task.payload);
            break;
          case "DELETE":
            await api.delete(task.endpoint, { data: task.payload });
            break;
          case "GET":
            await api.get(task.endpoint, { params: task.payload });
            break;
          case "POST":
          default:
            await api.post(task.endpoint, task.payload);
            break;
        }

        console.log(`[OfflineQueue] Görev başarıyla gönderildi ve kuyruktan kaldırıldı: ${task.id}`);
        successCount++;
      } catch (error: any) {
        console.warn(
          `[OfflineQueue] Görev gönderilemedi (${task.id}):`,
          error?.response?.data || error?.message || error
        );

        // Ağ hatası veya sunucu geçici hatası: Kuyrukta tutmaya devam et
        remainingTasks.push({
          ...task,
          attempts: (task.attempts || 0) + 1,
          lastError: error?.message || "Ağ hatası",
        });
        failedCount++;
      }
    }

    // Başarıyla iletilenler hariç, kalan görevleri kaydet
    await AsyncStorage.setItem(
      OFFLINE_STORAGE_KEY,
      JSON.stringify(remainingTasks)
    );

    this.isProcessing = false;
    this.notifyListeners(remainingTasks);

    console.log(
      `[OfflineQueue] Senkronizasyon tamamlandı: ${successCount} başarılı, ${failedCount} kalan.`
    );

    return {
      processedCount: currentQueue.length,
      successCount,
      failedCount,
    };
  }

  /**
   * Kuyruğu tamamen temizler (Test / Sıfırlama için)
   */
  async clearQueue(): Promise<void> {
    await AsyncStorage.removeItem(OFFLINE_STORAGE_KEY);
    this.notifyListeners([]);
  }

  /**
   * Kuyruk değişikliklerini dinleyen aboneleri haberdar et
   */
  subscribe(listener: (queue: OfflineTask[]) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notifyListeners(queue: OfflineTask[]) {
    for (const listener of this.listeners) {
      try {
        listener(queue);
      } catch (err) {
        console.warn("[OfflineQueue] Listener çağrılırken hata:", err);
      }
    }
  }
}

// Singleton Dışa Aktarımı
export const OfflineQueue = new OfflineQueueService();
export default OfflineQueue;
