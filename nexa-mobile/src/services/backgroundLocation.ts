/**
 * © 2026 NXA Software. All rights reserved.
 * Nexa ERP Mobil - Arka Plan GPS Telemetrisi (expo-task-manager + expo-location)
 * Dosya top-level scope'unda NEXA_BG_LOCATION_TASK kaydeder.
 * Expo Go içinde güvenli fallback ile ön plan watchPositionAsync moduna geçer.
 */

import * as Location from "expo-location";
import * as TaskManager from "expo-task-manager";
import * as Battery from "expo-battery";
import Constants, { ExecutionEnvironment } from "expo-constants";
import NetInfo from "@react-native-community/netinfo";
import { Platform } from "react-native";
import {
  getActiveProjectHeader,
  loadSecureTokens,
  mobileApi,
} from "./apiClient";
import { offlineSync } from "./offlineSync";
import {
  calculateDistanceMeters,
  startLocationTracking,
  stopLocationTracking,
  type GeofenceStatus,
} from "./locationTracker";
import type { AssignedProject, LocationTrackingMode } from "../types/api";

export const NEXA_BG_LOCATION_TASK = "NEXA_BG_LOCATION_TASK";

let cachedActiveProject: AssignedProject | null = null;
let bgLastDispatchedMs = 0;

export function isRunningInExpoGo(): boolean {
  try {
    return (
      Constants.executionEnvironment === ExecutionEnvironment.StoreClient ||
      (Constants as any).appOwnership === "expo"
    );
  } catch {
    return false;
  }
}

async function readBatteryPercentSafe(): Promise<number | null> {
  try {
    const level = await Battery.getBatteryLevelAsync();
    if (typeof level === "number" && level >= 0 && level <= 1) {
      return Math.round(level * 100);
    }
    return null;
  } catch {
    return null;
  }
}

// Headless Android / iOS arka plan konum görevi (TOP-LEVEL SCOPE)
try {
  if (!TaskManager.isTaskDefined(NEXA_BG_LOCATION_TASK)) {
    TaskManager.defineTask(NEXA_BG_LOCATION_TASK, async ({ data, error }) => {
      if (error || !data) return;

      const payloadData = data as { locations?: Location.LocationObject[] };
      const locations = payloadData?.locations;
      if (!Array.isArray(locations) || locations.length === 0) return;

      const latest = locations[locations.length - 1];
      const now = Date.now();
      if (now - bgLastDispatchedMs < 12000) return;
      bgLastDispatchedMs = now;

      const { accessToken } = await loadSecureTokens();
      if (!accessToken) return;

      const [projectId, batteryLevel, netState] = await Promise.all([
        getActiveProjectHeader().catch(() => null),
        readBatteryPercentSafe(),
        NetInfo.fetch().catch(() => null),
      ]);

      const resolvedProjectId = projectId || cachedActiveProject?.id || undefined;
      const telemetryBody = {
        lat: latest.coords.latitude,
        lng: latest.coords.longitude,
        latitude: latest.coords.latitude,
        longitude: latest.coords.longitude,
        speed:
          latest.coords.speed != null && latest.coords.speed >= 0
            ? Number((latest.coords.speed * 3.6).toFixed(1))
            : 0,
        heading:
          latest.coords.heading != null && latest.coords.heading >= 0
            ? Math.round(latest.coords.heading)
            : 0,
        accuracy: latest.coords.accuracy ?? null,
        batteryLevel,
        source: "GPS_BACKGROUND",
        projectId: resolvedProjectId,
      };

      const online = Boolean(
        netState?.isConnected && netState?.isInternetReachable !== false
      );

      if (!online) {
        await offlineSync.enqueue({
          endpoint: "/api/mobile/telemetry/location",
          method: "POST",
          payload: telemetryBody,
          label: "Arka Plan GPS Telemetrisi",
          batchAction: "LOCATION_LOG",
        });
        return;
      }

      try {
        await mobileApi.telemetry.sendLocation(telemetryBody);
      } catch {
        await offlineSync.enqueue({
          endpoint: "/api/mobile/telemetry/location",
          method: "POST",
          payload: telemetryBody,
          label: "Arka Plan GPS Telemetrisi",
          batchAction: "LOCATION_LOG",
        });
      }
    });
  }
} catch (err) {
  console.warn("[backgroundLocation] Task tanımı uyarısı:", err);
}

export async function stopBackgroundLocationTask(): Promise<void> {
  try {
    const started = await Location.hasStartedLocationUpdatesAsync(
      NEXA_BG_LOCATION_TASK
    ).catch(() => false);
    if (started) {
      await Location.stopLocationUpdatesAsync(NEXA_BG_LOCATION_TASK).catch(
        () => {}
      );
    }
  } catch {}
}

export async function stopAdaptiveLocationTracking(): Promise<void> {
  stopLocationTracking();
  await stopBackgroundLocationTask();
}

export async function startAdaptiveLocationTracking(opts: {
  mode: LocationTrackingMode;
  project: AssignedProject | null;
  onGeofenceChange?: (status: GeofenceStatus) => void;
}): Promise<{ activeMode: "BACKGROUND" | "FOREGROUND" | "OFF" }> {
  const { mode, project, onGeofenceChange } = opts;
  cachedActiveProject = project;

  await stopAdaptiveLocationTracking();

  if (!mode || mode === "OFF" || mode === "PRIVACY_RESTRICTED") {
    return { activeMode: "OFF" };
  }

  const isDispatchMode =
    mode === "OFFSITE_DISPATCH" || mode === "ROUTE_LIVE";

  if (isDispatchMode && !isRunningInExpoGo() && Platform.OS !== "web") {
    try {
      const fgPerm = await Location.requestForegroundPermissionsAsync();
      if (fgPerm.status === "granted") {
        const bgPerm = await Location.requestBackgroundPermissionsAsync();
        if (bgPerm.status === "granted") {
          await Location.startLocationUpdatesAsync(NEXA_BG_LOCATION_TASK, {
            accuracy: Location.Accuracy.High,
            timeInterval: 15000,
            distanceInterval: 25,
            deferredUpdatesInterval: 15000,
            showsBackgroundLocationIndicator: true,
            pausesUpdatesAutomatically: false,
            foregroundService: {
              notificationTitle: "Nexa Canlı Rota Takibi Aktif",
              notificationBody:
                "Canlı güzergah ve saha konum telemetrisi arka planda çalışıyor.",
              notificationColor: "#0A7AFF",
            },
          });

          // Ön plan geofence bilgisini ilk konumla güncelle
          if (project?.latitude != null && project?.longitude != null && onGeofenceChange) {
            const fix = await Location.getCurrentPositionAsync({
              accuracy: Location.Accuracy.Balanced,
            }).catch(() => null);
            if (fix) {
              const dist = Math.round(
                calculateDistanceMeters(
                  fix.coords.latitude,
                  fix.coords.longitude,
                  project.latitude,
                  project.longitude
                )
              );
              onGeofenceChange({
                isInside: true,
                distanceMeters: dist,
                projectName: project.name,
              });
            }
          }

          return { activeMode: "BACKGROUND" };
        }
      }
    } catch (err) {
      console.warn(
        "[backgroundLocation] Arka plan GPS başlatılamadı, ön plan izlemeye geçiliyor:",
        err
      );
    }
  }

  // Expo Go veya SITE_LIVE / GEOFENCE_STATIONARY modu: güvenli ön plan takibi
  await startLocationTracking({
    mode,
    project,
    onGeofenceChange,
  });
  return { activeMode: "FOREGROUND" };
}

