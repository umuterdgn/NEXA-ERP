/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * In-Memory Cache for Live Logistics Fleet GPS Tracking (Shared across API and Pages)
 */

export interface LiveShipmentPing {
  trackingCode: string;
  latitude: number;
  longitude: number;
  speed?: number | null;
  heading?: number | null;
  accuracy?: number | null;
  status: string; // PREPARING, ON_THE_WAY, ARRIVED, DELIVERED
  vehiclePlate?: string;
  driverPhone?: string;
  materialName?: string;
  projectName?: string;
  updatedAt: string;
}

// In-Memory Cache across Next.js invocations (stored on globalThis)
const globalStore = globalThis as unknown as {
  __liveLogisticsPings?: Map<string, LiveShipmentPing>;
};

if (!globalStore.__liveLogisticsPings) {
  globalStore.__liveLogisticsPings = new Map<string, LiveShipmentPing>();
}

export const liveLogisticsCache = globalStore.__liveLogisticsPings;
