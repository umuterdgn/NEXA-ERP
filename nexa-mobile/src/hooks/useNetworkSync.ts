/**
 * © 2026 NXA Software. All rights reserved.
 * Nexa ERP Mobil - Çevrimdışı (Offline-First) Senkronizasyon & Ağ Durumu Hook'u
 *
 * - @react-native-community/netinfo ile internet bağlantısını anlık ve olay bazlı (event-driven) dinler.
 * - İnternet geri geldiğinde arka planda OfflineQueue.processQueue() fonksiyonunu otomatik çalıştırır.
 */

import { useState, useEffect, useRef, useCallback } from "react";
import NetInfo, { NetInfoState } from "@react-native-community/netinfo";
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
      const state = await NetInfo.fetch();
      const online = Boolean(state.isConnected && state.isInternetReachable !== false);

      if (!online) {
        console.log("[useNetworkSync] İnternet yok, senkronizasyon ertelendi.");
        return;
      }

      setIsSyncing(true);
      const result = await OfflineQueue.processQueue();
      setLastSyncResult(result);

      const remaining = await OfflineQueue.getQueue();
      setPendingTasks(remaining);
      setQueueCount(remaining.length);
    } catch (err) {
      console.warn("[useNetworkSync] Senkronizasyon hatası:", err);
    } finally {
      setIsSyncing(false);
    }
  }, []);

  // Ağ durumunu denetle
  const checkNetwork = useCallback(async (): Promise<boolean> => {
    try {
      const state = await NetInfo.fetch();
      const connected = Boolean(state.isConnected);
      const reachable = Boolean(state.isInternetReachable ?? connected);

      setIsConnected(connected);
      setIsInternetReachable(reachable);

      if (connected && !prevConnectedRef.current) {
        console.log(
          "[useNetworkSync] 🌐 İnternet bağlantısı geri geldi! Taslaklar otomatik sunucuya iletiliyor..."
        );
        await syncNow();
      }

      prevConnectedRef.current = connected;
      return connected;
    } catch (error) {
      console.warn("[useNetworkSync] NetInfo kontrol hatası:", error);
      return false;
    }
  }, [syncNow]);

  useEffect(() => {
    // 1. İlk açılışta kuyruktaki taslakları yükle
    OfflineQueue.getQueue().then((q) => {
      setPendingTasks(q);
      setQueueCount(q.length);
    });

    // 2. Kuyruk değişikliklerini dinle
    const unsubscribeQueue = OfflineQueue.subscribe((updatedQueue) => {
      setPendingTasks(updatedQueue);
      setQueueCount(updatedQueue.length);
    });

    // 3. @react-native-community/netinfo ile ağ bağlantısını anlık dinle
    const unsubscribeNetInfo = NetInfo.addEventListener((state: NetInfoState) => {
      const connected = Boolean(state.isConnected);
      const reachable = Boolean(state.isInternetReachable ?? connected);

      setIsConnected(connected);
      setIsInternetReachable(reachable);

      // Bağlantı koptuktan sonra tekrar geldiyse
      if (connected && !prevConnectedRef.current) {
        console.log("[useNetworkSync] 🌐 İnternet bağlantısı sağlandı, kuyruk işleniyor...");
        syncNow();
      }

      prevConnectedRef.current = connected;
    });

    return () => {
      unsubscribeQueue();
      unsubscribeNetInfo();
    };
  }, [syncNow]);

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
