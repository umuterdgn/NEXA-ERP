/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Nexa ERP - Şantiye Personeli & Şoför Arka Plan GPS Canlı Takip Görevi
 *
 * Şoför "Sürüşe Başla" dediğinde veya personel şantiyeye check-in yaptığında başlar.
 * Uygulama arka plandayken veya telefon kilitliyken bile her 10 saniyede bir
 * veya 50 metre yer değiştirmede merkeze (/api/location/update) kesintisiz koordinat aktarır.
 */

import * as TaskManager from "expo-task-manager";
import * as Location from "expo-location";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { api } from "../lib/api";
import { locationSocket } from "../services/LocationSocket";

export const BACKGROUND_LOCATION_TASK = "BACKGROUND_LOCATION_TASK";
export const ATTENDANCE_TRACKING_KEY = "@nexa_attendance_tracking_active";
export const LAST_ATTENDANCE_LOCATION_KEY = "@nexa_last_attendance_location";
export const DRIVER_TRACKING_KEY = "@nexa_driver_tracking_active";

export interface AttendanceTrackingSession {
  isActive: boolean;
  userId?: string;
  userName?: string;
  personelId?: string;
  projectId?: string;
  projectName?: string;
  checkInTime?: string;
  lastLat?: number;
  lastLng?: number;
  lastUpdated?: string;
}

export interface DriverTrackingSession {
  isDriving: boolean;
  driverId?: string;
  driverName?: string;
  plate?: string;
  destinationSite?: string;
  startedAt?: string;
  stoppedAt?: string;
}

let isTaskRegistered = false;

/**
 * Arka Plan Görev (Task) Tanımlaması
 * TaskManager.defineTask('BACKGROUND_LOCATION_TASK', ...)
 */
export function registerBackgroundLocationTask() {
  if (isTaskRegistered) return;
  try {
    if (!TaskManager.isTaskDefined(BACKGROUND_LOCATION_TASK)) {
      TaskManager.defineTask(BACKGROUND_LOCATION_TASK, async ({ data, error }) => {
        if (error) {
          console.error("[BackgroundLocationTask] Arka plan GPS hatası:", error.message);
          return;
        }

        if (data) {
          const { locations } = data as { locations: Location.LocationObject[] };

          if (!locations || locations.length === 0) {
            return;
          }

          const latest = locations[locations.length - 1];
          const { latitude, longitude, accuracy, speed, altitude, heading } = latest.coords;
          const timestamp = latest.timestamp;

          try {
            // Aktif şoför veya personel oturumunu kontrol et
            let driverSession: DriverTrackingSession | null = null;
            try {
              const drvStr = await AsyncStorage.getItem(DRIVER_TRACKING_KEY);
              if (drvStr) driverSession = JSON.parse(drvStr);
            } catch {}

            let attendanceSession: AttendanceTrackingSession | null = null;
            try {
              const attStr = await AsyncStorage.getItem(ATTENDANCE_TRACKING_KEY);
              if (attStr) attendanceSession = JSON.parse(attStr);
            } catch {}

            const isDriving = !!driverSession?.isDriving;
            const userId = driverSession?.driverId || attendanceSession?.userId || "drv_01";
            const userName = driverSession?.driverName || attendanceSession?.userName || "Şoför";
            const plate = driverSession?.plate || "34 NXA 789";

            // Son konumu yerel depoya kaydet
            await AsyncStorage.setItem(
              LAST_ATTENDANCE_LOCATION_KEY,
              JSON.stringify({
                latitude,
                longitude,
                accuracy: accuracy ? Math.round(accuracy) : null,
                speed: speed ? Math.round(speed * 3.6) : 0,
                altitude: altitude ? Math.round(altitude) : null,
                heading: heading || null,
                timestamp,
                isDriving,
              })
            );

            // 1. Backend /api/location/update çağrısı (Her 10s veya 50m)
            await api
              .post("/location/update", {
                driverId: userId,
                driverName: userName,
                plate,
                latitude,
                longitude,
                speed: speed ? Math.round(speed * 3.6) : 0,
                heading: heading || 0,
                accuracy: accuracy ? Math.round(accuracy) : 5,
                timestamp,
                isDriving,
              })
              .catch((httpErr) => {
                console.warn("[BackgroundLocationTask] /api/location/update fallback:", httpErr?.message);
              });

            // 2. Real-time Socket.io yayını
            locationSocket.emitLocation({
              userId,
              lat: latitude,
              lng: longitude,
              accuracy: accuracy ? Math.round(accuracy) : null,
              speed: speed ? Math.round(speed * 3.6) : null,
              altitude: altitude ? Math.round(altitude) : null,
              timestamp,
            });

            console.log(
              `[BackgroundLocationTask] 🛰️ Konum iletildi: [${latitude.toFixed(5)}, ${longitude.toFixed(
                5
              )}] | Hız: ${speed ? Math.round(speed * 3.6) : 0} km/h | Sürüş: ${isDriving ? "EVET" : "HAYIR"}`
            );
          } catch (reqErr: any) {
            console.warn("[BackgroundLocationTask] Hata:", reqErr?.message || reqErr);
          }
        }
      });
      isTaskRegistered = true;
      console.log("[BackgroundLocationTask] Arka plan GPS görevi başarıyla tanımlandı.");
    } else {
      isTaskRegistered = true;
    }
  } catch (err: any) {
    console.warn("[BackgroundLocationTask] TaskManager tanımlama hatası:", err?.message || err);
  }
}

/**
 * Şoförler İçin Sürüş Takibini Başlatma (10s veya 50m yer değiştirme)
 */
export async function startDriverLocationTracking(params?: {
  driverId?: string;
  driverName?: string;
  plate?: string;
  destinationSite?: string;
}): Promise<boolean> {
  try {
    registerBackgroundLocationTask();

    // 1. Ön Plan İzni
    const { status: fgStatus } = await Location.requestForegroundPermissionsAsync();
    if (fgStatus !== "granted") {
      console.warn("[DriverLocation] Ön plan konum izni verilmedi");
      return false;
    }

    // 2. Arka Plan İzni (Cihaz kilitliyken dinlemek için)
    try {
      const { status: bgStatus } = await Location.requestBackgroundPermissionsAsync();
      if (bgStatus !== "granted") {
        console.warn("[DriverLocation] Arka plan izni kısıtlı, ön plan devrede.");
      }
    } catch (bgErr) {
      console.warn("[DriverLocation] Arka plan izin isteği:", bgErr);
    }

    // 3. Location.startLocationUpdatesAsync ile arka plan dinleme
    const isStarted = await Location.hasStartedLocationUpdatesAsync(BACKGROUND_LOCATION_TASK);
    if (!isStarted) {
      await Location.startLocationUpdatesAsync(BACKGROUND_LOCATION_TASK, {
        accuracy: Location.Accuracy.High,
        timeInterval: 10000, // 10 saniyede bir
        distanceInterval: 50, // 50 metre yer değiştirmede
        deferredUpdatesInterval: 10000,
        deferredUpdatesDistance: 50,
        showsBackgroundLocationIndicator: true,
        pausesUpdatesAutomatically: false,
        foregroundService: {
          notificationTitle: "Nexa Lojistik - Sürüş Takibi Aktif",
          notificationBody: `${params?.plate || "34 NXA 789"} ile şantiyeye teslimat rotası izleniyor.`,
          notificationColor: "#34C759",
        },
      });
    }

    // Oturumu kaydet
    const session: DriverTrackingSession = {
      isDriving: true,
      driverId: params?.driverId || "drv_01",
      driverName: params?.driverName || "Ahmet Şoför",
      plate: params?.plate || "34 NXA 789",
      destinationSite: params?.destinationSite || "Kadıköy Merkez Rezidans",
      startedAt: new Date().toISOString(),
    };
    await AsyncStorage.setItem(DRIVER_TRACKING_KEY, JSON.stringify(session));

    return true;
  } catch (error) {
    console.error("[DriverLocation] Sürüş takibi başlatma hatası:", error);
    return false;
  }
}

/**
 * Şoför Sürüş Takibini Bitirme
 */
export async function stopDriverLocationTracking(): Promise<boolean> {
  try {
    const isStarted = await Location.hasStartedLocationUpdatesAsync(BACKGROUND_LOCATION_TASK);
    if (isStarted) {
      await Location.stopLocationUpdatesAsync(BACKGROUND_LOCATION_TASK);
    }

    const session: DriverTrackingSession = {
      isDriving: false,
      stoppedAt: new Date().toISOString(),
    };
    await AsyncStorage.setItem(DRIVER_TRACKING_KEY, JSON.stringify(session));
    return true;
  } catch (error) {
    console.error("[DriverLocation] Sürüş takibi durdurma hatası:", error);
    return false;
  }
}

/**
 * Şoför Sürüş Takibi Aktif mi?
 */
export async function isDriverTrackingActive(): Promise<boolean> {
  try {
    const str = await AsyncStorage.getItem(DRIVER_TRACKING_KEY);
    if (!str) return false;
    const session: DriverTrackingSession = JSON.parse(str);
    return !!session.isDriving;
  } catch {
    return false;
  }
}

/**
 * Personel Puantaj Arka Plan Takibi Başlatma
 */
export async function startAttendanceLocationTracking(params?: {
  userId?: string;
  userName?: string;
  personelId?: string;
  projectId?: string;
  projectName?: string;
}): Promise<boolean> {
  try {
    registerBackgroundLocationTask();

    const { status: fgStatus } = await Location.requestForegroundPermissionsAsync();
    if (fgStatus !== "granted") return false;

    const isStarted = await Location.hasStartedLocationUpdatesAsync(BACKGROUND_LOCATION_TASK);
    if (!isStarted) {
      await Location.startLocationUpdatesAsync(BACKGROUND_LOCATION_TASK, {
        accuracy: Location.Accuracy.Balanced,
        distanceInterval: 10,
        deferredUpdatesInterval: 15000,
        showsBackgroundLocationIndicator: true,
        pausesUpdatesAutomatically: false,
        foregroundService: {
          notificationTitle: "Nexa ERP - Şantiye Güvenlik Takibi",
          notificationBody: "Şantiye mesai saatinde İSG ve acil durum konumunuz takip ediliyor.",
          notificationColor: "#2563EB",
        },
      });
    }

    const session: AttendanceTrackingSession = {
      isActive: true,
      userId: params?.userId || "usr_personel_01",
      userName: params?.userName || "Personel",
      personelId: params?.personelId || "PRS-2026-001",
      projectId: params?.projectId || "PRJ-2026-A",
      projectName: params?.projectName || "Kadıköy Rezidans",
      checkInTime: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
    };
    await AsyncStorage.setItem(ATTENDANCE_TRACKING_KEY, JSON.stringify(session));

    return true;
  } catch (error) {
    console.error("[AttendanceLocation] Takip başlatma hatası:", error);
    return false;
  }
}

export async function stopAttendanceLocationTracking(): Promise<boolean> {
  try {
    const isStarted = await Location.hasStartedLocationUpdatesAsync(BACKGROUND_LOCATION_TASK);
    if (isStarted) {
      await Location.stopLocationUpdatesAsync(BACKGROUND_LOCATION_TASK);
    }
    const existing = await AsyncStorage.getItem(ATTENDANCE_TRACKING_KEY);
    if (existing) {
      const session: AttendanceTrackingSession = JSON.parse(existing);
      session.isActive = false;
      await AsyncStorage.setItem(ATTENDANCE_TRACKING_KEY, JSON.stringify(session));
    }
    return true;
  } catch (error) {
    console.error("[AttendanceLocation] Takip durdurma hatası:", error);
    return false;
  }
}

export async function isAttendanceLocationTrackingActive(): Promise<boolean> {
  try {
    return await Location.hasStartedLocationUpdatesAsync(BACKGROUND_LOCATION_TASK);
  } catch {
    return false;
  }
}
