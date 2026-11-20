/**
 * © 2026 NXA Software. All rights reserved.
 * Nexa ERP Mobil - Offline-First Senkronizasyon Motoru
 * Çevrimdışı yazma işlemlerini AsyncStorage kuyruğuna alır; internet geldiğinde
 * POST /api/mobile/sync/batch veya doğrudan ilgili uçlar üzerinden eşitler.
 */

import AsyncStorage from "@react-native-async-storage/async-storage";
import NetInfo from "@react-native-community/netinfo";
import type {
  OfflineBatchAction,
  OfflineMutationRecord,
  SyncBatchItem,
  SyncBatchResponse,
} from "../types/api";

const OFFLINE_QUEUE_KEY = "@nexa_offline_sync_queue_v2";

export type QueueExecutor = {
  sendBatch: (items: SyncBatchItem[]) => Promise<SyncBatchResponse>;
  sendDirect: (
    endpoint: string,
    method: "POST" | "PUT" | "PATCH",
    payload: Record<string, any>
  ) => Promise<any>;
};

type QueueListener = (records: OfflineMutationRecord[]) => void;

function generateMutationId(): string {
  const rand = Math.random().toString(36).slice(2, 10);
  return `mut_${Date.now()}_${rand}`;
}

class OfflineSyncService {
  private queue: OfflineMutationRecord[] = [];
  private listeners = new Set<QueueListener>();
  private initialized = false;
  private isSyncing = false;
  private netInfoUnsubscribe: (() => void) | null = null;
  private wasConnected = true;

  async init(): Promise<OfflineMutationRecord[]> {
    if (this.initialized) return this.queue;
    try {
      const raw = await AsyncStorage.getItem(OFFLINE_QUEUE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          this.queue = parsed;
        }
      }
    } catch (err) {
      console.warn("[offlineSync] Kuyruk okuma uyarısı:", err);
    }
    this.initialized = true;
    this.notify();
    return this.queue;
  }

  private async persist(): Promise<void> {
    try {
      await AsyncStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(this.queue));
    } catch (err) {
      console.warn("[offlineSync] Kuyruk yazma uyarısı:", err);
    }
    this.notify();
  }

  private notify(): void {
    const snapshot = [...this.queue];
    this.listeners.forEach((cb) => {
      try {
        cb(snapshot);
      } catch {}
    });
  }

  subscribe(cb: QueueListener): () => void {
    this.listeners.add(cb);
    cb([...this.queue]);
    return () => {
      this.listeners.delete(cb);
    };
  }

  async getQueue(): Promise<OfflineMutationRecord[]> {
    if (!this.initialized) await this.init();
    return [...this.queue];
  }

  getPendingCount(): number {
    return this.queue.filter((q) => q.status === "PENDING").length;
  }

  async enqueue(input: {
    endpoint: string;
    method: "POST" | "PUT" | "PATCH";
    payload: Record<string, any>;
    label: string;
    batchAction?: OfflineBatchAction;
  }): Promise<OfflineMutationRecord> {
    if (!this.initialized) await this.init();

    const record: OfflineMutationRecord = {
      clientMutationId: generateMutationId(),
      endpoint: input.endpoint,
      method: input.method,
      payload: input.payload,
      batchAction: input.batchAction,
      label: input.label,
      createdAt: new Date().toISOString(),
      status: "PENDING",
    };

    // En fazla 300 kayıt tut
    this.queue = [record, ...this.queue].slice(0, 300);
    await this.persist();
    return record;
  }

  async removeItem(clientMutationId: string): Promise<void> {
    this.queue = this.queue.filter((q) => q.clientMutationId !== clientMutationId);
    await this.persist();
  }

  async clearSynced(): Promise<void> {
    this.queue = this.queue.filter((q) => q.status !== "SYNCED");
    await this.persist();
  }

  async resetAll(): Promise<void> {
    this.queue = [];
    await this.persist();
  }

  startAutoSyncListener(executor: QueueExecutor): () => void {
    if (this.netInfoUnsubscribe) {
      this.netInfoUnsubscribe();
    }

    this.netInfoUnsubscribe = NetInfo.addEventListener((state) => {
      const online = Boolean(state.isConnected && state.isInternetReachable !== false);
      if (online && !this.wasConnected && this.getPendingCount() > 0) {
        this.syncNow(executor).catch(() => {});
      }
      this.wasConnected = online;
    });

    return () => {
      this.netInfoUnsubscribe?.();
      this.netInfoUnsubscribe = null;
    };
  }

  async syncNow(executor: QueueExecutor): Promise<{
    total: number;
    synced: number;
    conflicts: number;
    errors: number;
  }> {
    if (!this.initialized) await this.init();
    if (this.isSyncing) {
      return { total: 0, synced: 0, conflicts: 0, errors: 0 };
    }

    const net = await NetInfo.fetch();
    if (!net.isConnected || net.isInternetReachable === false) {
      return { total: 0, synced: 0, conflicts: 0, errors: 0 };
    }

    const pending = this.queue.filter((q) => q.status === "PENDING");
    if (pending.length === 0) {
      return { total: 0, synced: 0, conflicts: 0, errors: 0 };
    }

    this.isSyncing = true;
    let synced = 0;
    let conflicts = 0;
    let errors = 0;

    try {
      // 1. /api/mobile/sync/batch destekleyen eylemleri toplu gönder
      const batchSupported = pending.filter(
        (p) =>
          p.batchAction &&
          ["TASK_UPDATE", "ATTENDANCE", "DEFICIENCY", "LOCATION_LOG"].includes(p.batchAction)
      );

      if (batchSupported.length > 0) {
        const batchPayload: SyncBatchItem[] = batchSupported.map((item) => ({
          id: item.clientMutationId,
          action: item.batchAction!,
          payload: item.payload,
          clientTimestamp: item.createdAt,
        }));

        try {
          const res = await executor.sendBatch(batchPayload);
          const resultMap = new Map(res.results.map((r) => [r.id, r]));

          this.queue = this.queue.map((q) => {
            const match = resultMap.get(q.clientMutationId);
            if (!match) return q;
            if (match.status === "SYNCED") synced++;
            else if (match.status === "CONFLICT") conflicts++;
            else errors++;
            return {
              ...q,
              status: match.status,
              error: match.error,
            };
          });
          await this.persist();
        } catch (err: any) {
          console.warn("[offlineSync] Batch sync hatası:", err?.message || err);
        }
      }

      // 2. Doğrudan API ucu gerektiren diğer bekleyen yazma işlemlerini sırayla gönder
      const directPending = this.queue.filter(
        (q) =>
          q.status === "PENDING" &&
          (!q.batchAction ||
            !["TASK_UPDATE", "ATTENDANCE", "DEFICIENCY", "LOCATION_LOG"].includes(q.batchAction))
      );

      for (const item of directPending.reverse()) {
        try {
          await executor.sendDirect(item.endpoint, item.method, item.payload);
          synced++;
          this.queue = this.queue.map((q) =>
            q.clientMutationId === item.clientMutationId
              ? { ...q, status: "SYNCED", error: undefined }
              : q
          );
        } catch (err: any) {
          const status = err?.response?.status;
          const errMsg =
            err?.response?.data?.error || err?.message || "Sunucu eşitleme hatası";
          if (status === 403 || status === 409) {
            conflicts++;
            this.queue = this.queue.map((q) =>
              q.clientMutationId === item.clientMutationId
                ? { ...q, status: "CONFLICT", error: errMsg }
                : q
            );
          } else if (status) {
            errors++;
            this.queue = this.queue.map((q) =>
              q.clientMutationId === item.clientMutationId
                ? { ...q, status: "ERROR", error: errMsg }
                : q
            );
          }
        }
        await this.persist();
      }
    } finally {
      this.isSyncing = false;
    }

    return {
      total: pending.length,
      synced,
      conflicts,
      errors,
    };
  }
}

export const offlineSync = new OfflineSyncService();

