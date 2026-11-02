import { useState, useEffect, useRef, useCallback } from "react";
import * as Network from "expo-network";
import { OfflineQueue, OfflineTask } from "../services/OfflineQueue";

export interface NetworkSyncState {
  isConnected: boolean;
  isInternetReachable: boolean;
  isSyncing: boolean;
  queueCount: number;
  pendingTasks: OfflineTask[];
  lastSyncResult: {
    processedCount: number;
    successCount: number;
    failedCount: number;
  } | null;
  syncNow: () => Promise<void>;
  checkNetwork: () => Promise<boolean>;
}

/**
 * Nexa ERP - Çevrimdışı Senkronizasyon ve Ağ Durumu Hook'u
 * Network.getNetworkStateAsync() ile internet bağlantısını denetler.
 * isConnected: true olduğunda otomatik olarak OfflineQueue.processQueue() tetikler.
 */
export function useNetworkSync(): NetworkSyncState {
  const [isConnected, setIsConnected] = useState<boolean>(true);
  const [isInternetReachable, setIsInternetReachable] = useState<boolean>(true);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [queueCount, setQueueCount] = useState<number>(0);
  const [pendingTasks, setPendingTasks] = useState<OfflineTask[]>([]);
  const [lastSyncResult, setLastSyncResult] = useState<{
    processedCount: number;
    successCount: number;
    failedCount: number;
  } | null>(null);

  const prevConnectedRef = useRef<boolean>(true);

  // Manuel veya otomatik senkronizasyon tetikleyici
  const syncNow = useCallback(async () => {
    try {
      const netState = await Network.getNetworkStateAsync();
      const online = Boolean(netState.isConnected);

      if (!online) {
        console.log("[useNetworkSync] İnternet bağlantısı yok, senkronizasyon bekletiliyor.");
        return;
      }

      setIsSyncing(true);
      const result = await OfflineQueue.processQueue();
      setLastSyncResult(result);

      const remaining = await OfflineQueue.getQueue();
      setPendingTasks(remaining);
      setQueueCount(remaining.length);
    } catch (err) {
      console.warn("[useNetworkSync] Senkronizasyon çalıştırma hatası:", err);
    } finally {
      setIsSyncing(false);
    }
  }, []);

  // Ağ durumunu sorgula ve bağlantı geldiğinde otomatik sync yap
  const checkNetwork = useCallback(async (): Promise<boolean> => {
    try {
      const state = await Network.getNetworkStateAsync();
      const connected = Boolean(state.isConnected);
      const reachable = state.isInternetReachable ?? connected;

      setIsConnected(connected);
      setIsInternetReachable(reachable);

      // Bağlantı yeniden kurulduysa (Örn: Bodrum kattan zemin kata çıkıldığında)
      if (connected && !prevConnectedRef.current) {
        console.log(
          "[useNetworkSync] 🌐 İnternet bağlantısı geri geldi! Otomatik senkronizasyon başlatılıyor..."
        );
        await syncNow();
      } else if (connected && queueCount > 0 && !isSyncing) {
        // Zaten bağlı ama bekleyen görev varsa çalıştır
        await syncNow();
      }

      prevConnectedRef.current = connected;
      return connected;
    } catch (error) {
      console.warn("[useNetworkSync] Ağ durumu kontrol hatası:", error);
      return false;
    }
  }, [queueCount, isSyncing, syncNow]);

  useEffect(() => {
    // 1. İlk açılışta kuyruğu ve ağ durumunu yükle
    OfflineQueue.getQueue().then((q) => {
      setPendingTasks(q);
      setQueueCount(q.length);
    });

    // 2. Kuyruktaki değişiklikleri dinle
    const unsubscribe = OfflineQueue.subscribe((updatedQueue) => {
      setPendingTasks(updatedQueue);
      setQueueCount(updatedQueue.length);
    });

    // 3. İlk ağ kontrolü
    checkNetwork();

    // 4. Periyodik ağ durumu denetleyicisi (Her 7 saniyede bir kontrol et)
    const interval = setInterval(() => {
      checkNetwork();
    }, 7000);

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, [checkNetwork]);

  return {
    isConnected,
    isInternetReachable,
    isSyncing,
    queueCount,
    pendingTasks,
    lastSyncResult,
    syncNow,
    checkNetwork,
  };
}

export default useNetworkSync;
