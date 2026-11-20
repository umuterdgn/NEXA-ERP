/**
 * © 2026 NXA Software. All rights reserved.
 * Nexa ERP Mobil - Canlı GPS Telemetri & Geofence Motoru
 * Expo Go uyumlu ön plan konum izleme (locationTrackingMode'a göre dinamik).
 */

import * as Location from "expo-location";
import { mobileApi } from "./apiClient";
import type { AssignedProject, LocationTrackingMode } from "../types/api";

export interface GeofenceStatus {
  isInside: boolean;
  distanceMeters: number;
  projectName?: string;
}

type GeofenceCallback = (status: GeofenceStatus) => void;

let activeSubscription: Location.LocationSubscription | null = null;
let lastSentTimestamp = 0;

export function calculateDistanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function stopLocationTracking(): void {
  try {
    activeSubscription?.remove();
  } catch {}
  activeSubscription = null;
}

export async function getCurrentGpsFix(): Promise<{
  latitude: number;
  longitude: number;
} | null> {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") return null;
    const pos = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });
    return {
      latitude: pos.coords.latitude,
      longitude: pos.coords.longitude,
    };
  } catch {
    return null;
  }
}

export async function startLocationTracking(opts: {
  mode: LocationTrackingMode;
  project: AssignedProject | null;
  onGeofenceChange?: GeofenceCallback;
}): Promise<void> {
  stopLocationTracking();

  const { mode, project, onGeofenceChange } = opts;

  if (!mode || mode === "OFF" || mode === "PRIVACY_RESTRICTED") {
    return;
  }

  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      return;
    }

    const isRouteLive =
      mode === "ROUTE_LIVE" || mode === "OFFSITE_DISPATCH";
    const intervalMs = isRouteLive ? 15000 : 30000;
    const distanceM = isRouteLive ? 10 : 20;

    const pushSample = async (coords: Location.LocationObjectCoords) => {
      const now = Date.now();
      if (now - lastSentTimestamp < intervalMs - 2000) return;
      lastSentTimestamp = now;

      let localInside = true;
      let localDistance = 0;

      if (project?.latitude != null && project?.longitude != null) {
        localDistance = Math.round(
          calculateDistanceMeters(
            coords.latitude,
            coords.longitude,
            project.latitude,
            project.longitude
          )
        );
        const radius = project.radius || 150;
        localInside = localDistance <= radius;
      }

      try {
        const res = await mobileApi.telemetry.sendLocation({
          lat: coords.latitude,
          lng: coords.longitude,
          latitude: coords.latitude,
          longitude: coords.longitude,
          speed: coords.speed != null && coords.speed >= 0 ? coords.speed : 0,
          heading: coords.heading != null && coords.heading >= 0 ? coords.heading : 0,
          accuracy: coords.accuracy ?? null,
          source: isRouteLive ? "GPS_ROUTE_LIVE" : "GPS_SITE_LIVE",
          projectId: project?.id,
        });

        const serverInside =
          typeof res.isInsideGeofence === "boolean"
            ? res.isInsideGeofence
            : localInside;
        onGeofenceChange?.({
          isInside: isRouteLive ? true : serverInside,
          distanceMeters: localDistance,
          projectName: project?.name,
        });
      } catch {
        onGeofenceChange?.({
          isInside: isRouteLive ? true : localInside,
          distanceMeters: localDistance,
          projectName: project?.name,
        });
      }
    };

    const initial = await Location.getCurrentPositionAsync({
      accuracy: isRouteLive ? Location.Accuracy.High : Location.Accuracy.Balanced,
    }).catch(() => null);
    if (initial) {
      await pushSample(initial.coords);
    }

    activeSubscription = await Location.watchPositionAsync(
      {
        accuracy: isRouteLive ? Location.Accuracy.High : Location.Accuracy.Balanced,
        timeInterval: intervalMs,
        distanceInterval: distanceM,
      },
      (loc) => {
        pushSample(loc.coords).catch(() => {});
      }
    );
  } catch (err) {
    console.warn("[locationTracker] Konum izleme başlatılamadı:", err);
  }
}

