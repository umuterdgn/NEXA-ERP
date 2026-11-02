/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Nexa ERP - Şantiye Personeli Arka Plan GPS Canlı Takip Görevi
 *
 * Personel şantiyeye giriş (Check-in) yaptığı anda başlar ve çıkış (Check-out)
 * yapana kadar uygulama arka planda veya telefon kilitliyken bile
 * merkeze (OHS / İSG izleme) düzenli koordinat aktarır.
 */

import * as TaskManager from "expo-task-manager";
import * as Location from "expo-location";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { api } from "../lib/api";

export const BACKGROUND_LOCATION_TASK = "BACKGROUND_LOCATION_TASK";
export const ATTENDANCE_TRACKING_KEY = "@nexa_attendance_tracking_active";
export const LAST_ATTENDANCE_LOCATION_KEY = "@nexa_last_attendance_location";

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

/**
 * ADIM 1: Arka Plan Görev (Task) Tanımlaması
 * TaskManager.defineTask ile uygulamanın kök seviyesinde arka plan görevi kaydedilir.
 */
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
      // AsyncStorage'dan aktif puantaj oturumunu oku
      let userId = "usr_personel_01";
      let personelId = "PRS-2026-001";
      let projectId = "PRJ-2026-A";

      const sessionStr = await AsyncStorage.getItem(ATTENDANCE_TRACKING_KEY);
      if (sessionStr) {
        const session: AttendanceTrackingSession = JSON.parse(sessionStr);
        if (session.userId) userId = session.userId;
        if (session.personelId) personelId = session.personelId;
        if (session.projectId) projectId = session.projectId;
      }

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
        })
      );

      // Backend API rotasına Axios ile gönder: /api/location/live-update
      await api.post("/location/live-update", {
        userId,
        personelId,
        projectId,
        lat: latitude,
        lng: longitude,
        latitude,
        longitude,
        accuracy: accuracy ? Math.round(accuracy) : null,
        speed: speed ? Math.round(speed * 3.6) : null,
        altitude: altitude ? Math.round(altitude) : null,
        timestamp,
        source: "ATTENDANCE_BACKGROUND_GEOFENCE",
      });

      console.log(
        `[BackgroundLocationTask] Canlı İSG konumu merkeze iletildi: ${latitude.toFixed(
          5
        )}, ${longitude.toFixed(5)} (Hassasiyet: ±${accuracy ? Math.round(accuracy) : 5}m)`
      );
    } catch (reqErr: any) {
      console.warn(
        "[BackgroundLocationTask] Konum merkeze iletilemedi (Ağ veya sunucu):",
        reqErr?.message || reqErr
      );
    }
  }
});

/**
 * ADIM 2: Puantaj Giriş (Check-in) yapıldığında arka plan konum takibini başlatır.
 * Pili korumak için 10 metrede bir veya 15 saniyede bir günceller.
 */
export async function startAttendanceLocationTracking(params?: {
  userId?: string;
  userName?: string;
  personelId?: string;
  projectId?: string;
  projectName?: string;
}): Promise<boolean> {
  try {
    // 1. Ön Plan Konum İzni Kontrolü
    const { status: fgStatus } = await Location.requestForegroundPermissionsAsync();
    if (fgStatus !== "granted") {
      console.warn("[BackgroundLocationTask] Ön plan konum izni verilmedi.");
      return false;
    }

    // 2. Arka Plan Konum İzni Kontrolü
    const { status: bgStatus } = await Location.requestBackgroundPermissionsAsync();
    if (bgStatus !== "granted") {
      console.warn(
        "[BackgroundLocationTask] Arka plan konum izni verilmedi, ancak ön plan izinli."
      );
    }

    // 3. Görev zaten çalışıyor mu?
    const isStarted = await Location.hasStartedLocationUpdatesAsync(
      BACKGROUND_LOCATION_TASK
    );

    if (isStarted) {
      console.log("[BackgroundLocationTask] Görev zaten aktif.");
    } else {
      // ADIM 2 Parametreleri: accuracy: Balanced, distanceInterval: 10, deferredUpdatesInterval: 15000
      await Location.startLocationUpdatesAsync(BACKGROUND_LOCATION_TASK, {
        accuracy: Location.Accuracy.Balanced,
        distanceInterval: 10, // 10 metrede bir
        deferredUpdatesInterval: 15000, // 15 saniyede bir
        showsBackgroundLocationIndicator: true, // iOS mavi durum çubuğu
        pausesUpdatesAutomatically: false,
        foregroundService: {
          notificationTitle: "Nexa ERP - Şantiye Güvenlik Takibi",
          notificationBody: "Şantiye mesai saatinde İSG ve acil durum konumunuz takip ediliyor.",
          notificationColor: "#2563EB",
        },
      });
      console.log("[BackgroundLocationTask] Arka plan İSG konum takibi başlatıldı.");
    }

    // Aktif oturum bilgisini AsyncStorage'a kaydet
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
    console.error("[BackgroundLocationTask] Takip başlatma hatası:", error);
    return false;
  }
}

/**
 * ADIM 2: Puantaj Çıkış (Check-out) yapıldığında arka plan konum takibini tamamen durdurur.
 */
export async function stopAttendanceLocationTracking(): Promise<boolean> {
  try {
    const isStarted = await Location.hasStartedLocationUpdatesAsync(
      BACKGROUND_LOCATION_TASK
    );

    if (isStarted) {
      await Location.stopLocationUpdatesAsync(BACKGROUND_LOCATION_TASK);
      console.log("[BackgroundLocationTask] Arka plan İSG konum takibi durduruldu.");
    }

    // Depodan aktif oturumu güncelle / kaldır
    const existing = await AsyncStorage.getItem(ATTENDANCE_TRACKING_KEY);
    if (existing) {
      const session: AttendanceTrackingSession = JSON.parse(existing);
      session.isActive = false;
      await AsyncStorage.setItem(ATTENDANCE_TRACKING_KEY, JSON.stringify(session));
    }

    return true;
  } catch (error) {
    console.error("[BackgroundLocationTask] Takip durdurma hatası:", error);
    return false;
  }
}

/**
 * Mevcut takip durumunu sorgular
 */
export async function isAttendanceLocationTrackingActive(): Promise<boolean> {
  try {
    return await Location.hasStartedLocationUpdatesAsync(BACKGROUND_LOCATION_TASK);
  } catch {
    return false;
  }
}
