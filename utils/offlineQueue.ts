/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * This code is the property of NXA Software.
 */

interface OfflineInspectionData {
  id: string;
  yibfId: string;
  photoUrl: string;
  gpsLocation: { lat: number; lng: number } | null;
  classification: {
    category: string;
    section: string;
    result: "PASS" | "FAIL";
    description: string;
  };
  timestamp: number;
}

const QUEUE_KEY = "offline_inspection_queue";

export const offlineQueue = {
  // Add inspection to queue
  add: (data: OfflineInspectionData): void => {
    try {
      const queue = offlineQueue.getAll();
      queue.push(data);
      localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
    } catch (error) {
      console.error("Error adding to offline queue:", error);
    }
  },

  // Get all queued inspections
  getAll: (): OfflineInspectionData[] => {
    try {
      const queueJson = localStorage.getItem(QUEUE_KEY);
      return queueJson ? JSON.parse(queueJson) : [];
    } catch (error) {
      console.error("Error reading offline queue:", error);
      return [];
    }
  },

  // Remove inspection from queue
  remove: (id: string): void => {
    try {
      const queue = offlineQueue.getAll();
      const filteredQueue = queue.filter((item) => item.id !== id);
      localStorage.setItem(QUEUE_KEY, JSON.stringify(filteredQueue));
    } catch (error) {
      console.error("Error removing from offline queue:", error);
    }
  },

  // Clear all queued inspections
  clear: (): void => {
    try {
      localStorage.removeItem(QUEUE_KEY);
    } catch (error) {
      console.error("Error clearing offline queue:", error);
    }
  },

  // Get queue count
  getCount: (): number => {
    return offlineQueue.getAll().length;
  },
};

// Sync queue with server
export async function syncOfflineQueue() {
  const queue = offlineQueue.getAll();
  const syncedItems: string[] = [];
  const failedItems: string[] = [];

  for (const item of queue) {
    try {
      // Import saveInspection action dynamically to avoid circular dependencies
      const { saveInspection } = await import("@/app/(inspection)/field/actions");
      
      const result = await saveInspection({
        yibfId: item.yibfId,
        photoUrl: item.photoUrl,
        gpsLocation: item.gpsLocation,
        classification: item.classification,
      });

      if (result.success) {
        syncedItems.push(item.id);
        offlineQueue.remove(item.id);
      } else {
        failedItems.push(item.id);
      }
    } catch (error) {
      console.error("Error syncing item:", item.id, error);
      failedItems.push(item.id);
    }
  }

  return {
    synced: syncedItems.length,
    failed: failedItems.length,
    total: queue.length,
  };
}
