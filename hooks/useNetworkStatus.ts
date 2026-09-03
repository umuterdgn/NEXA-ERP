/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * This code is the property of NXA Software.
 */

import { useState, useEffect, useCallback } from "react";
import { syncOfflineQueue, offlineQueue } from "@/utils/offlineQueue";

export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);

  const handleSync = useCallback(async () => {
    if (typeof window === 'undefined') return;
    
    const queueCount = offlineQueue.getCount();
    if (queueCount === 0) return;

    setIsSyncing(true);
    try {
      const result = await syncOfflineQueue();
      
      if (result.synced > 0) {
        // Trigger notification for successful sync
        if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
          new Notification('Senkronizasyon Tamamlandı', {
            body: `🟢 ${result.synced} çevrimdışı kayıt başarıyla sunucuya senkronize edildi`,
            icon: '/icon-192x192.png',
          });
        }
      }
    } catch (error) {
      console.error("Sync error:", error);
    } finally {
      setIsSyncing(false);
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    // Set initial state
    setIsOnline(navigator.onLine);

    // Event listeners for online/offline
    const handleOnline = () => {
      setIsOnline(true);
      handleSync();
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Cleanup
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [handleSync]);

  const queueCount = typeof window !== 'undefined' ? offlineQueue.getCount() : 0;
  return { isOnline, isSyncing, queueCount };
}
