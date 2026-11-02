import * as TaskManager from "expo-task-manager";
import * as Location from "expo-location";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { api } from "../lib/api";

/**
 * Nexa ERP - Şoför Arka Plan GPS Canlı Takip Görevi
 * Telefon kilitli veya uygulama arka planda olsa bile koordinatları Merkez'e iletir.
 */

export const LOCATION_TRACKING_TASK_NAME = "NEXA_BACKGROUND_LOCATION_TRACKING";
export const TRACKING_STORAGE_KEY = "@nexa_active_delivery_tracking";
export const LAST_COORDS_STORAGE_KEY = "@nexa_last_driver_coords";

export interface DeliveryTrackingState {
  isActive: boolean;
  deliveryId?: string;
  driverId?: string;
  driverName?: string;
  waybillNo?: string;
  startedAt?: string;
  stoppedAt?: string;
  lastLat?: number;
  lastLng?: number;
  lastUpdate?: string;
}

/**
 * 1. Arka Planda Çalışacak TaskManager Tanımı
 * (Uygulama açılır açılmaz dosya seviyesinde defineTask çağrılmalıdır)
 */
TaskManager.defineTask(LOCATION_TRACKING_TASK_NAME, async ({ data, error }) => {
  if (error) {
    console.error("[LocationTask] Arka plan GPS hatası:", error.message);
    return;
  }

  if (data) {
    const { locations } = data as { locations: Location.LocationObject[] };

    if (!locations || locations.length === 0) {
      return;
    }

    const latest = locations[locations.length - 1];
    const { latitude, longitude, speed, heading, accuracy } = latest.coords;
    const timestamp = latest.timestamp;

    // Aktif teslimat ve şoför bilgilerini AsyncStorage'dan oku
    try {
      let driverId = "usr_driver_01";
      let deliveryId = "DEL-2026-98421";

      const storedSession = await AsyncStorage.getItem(TRACKING_STORAGE_KEY);
      if (storedSession) {
        const parsed: DeliveryTrackingState = JSON.parse(storedSession);
        if (parsed.driverId) driverId = parsed.driverId;
        if (parsed.deliveryId) deliveryId = parsed.deliveryId;
      }

      // Son konumu yerel önbelleğe kaydet
      await AsyncStorage.setItem(
        LAST_COORDS_STORAGE_KEY,
        JSON.stringify({
          latitude,
          longitude,
          speed: speed ? Math.round(speed * 3.6) : 0, // km/h
          heading,
          accuracy,
          timestamp,
        })
      );

      // Backend API'ye anlık koordinatları gönder (Axios isteği)
      await api.post("/location/track", {
        driverId,
        personelId: driverId,
        deliveryId,
        lat: latitude,
        lng: longitude,
        latitude,
        longitude,
        speed: speed ? Math.round(speed * 3.6) : null,
        heading: heading || null,
        accuracy: accuracy ? Math.round(accuracy) : null,
        timestamp,
      });

      console.log(
        `[LocationTask] Canlı konum merkeze iletildi: ${latitude.toFixed(5)}, ${longitude.toFixed(5)} (Hız: ${
          speed ? Math.round(speed * 3.6) : 0
        } km/h)`
      );
    } catch (reqErr: any) {
      console.warn(
        "[LocationTask] Merkeze konum iletme hatası (Ağ veya sunucu):",
        reqErr?.message || reqErr
      );
    }
  }
});

/**
 * 2. Arka Plan Konum Takibini Başlat
 */
export async function startBackgroundLocationTracking(params?: {
  deliveryId?: string;
  driverId?: string;
  driverName?: string;
  waybillNo?: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    // 1. Ön Plan (Foreground) Konum İzni İste
    const { status: fgStatus } =
      await Location.requestForegroundPermissionsAsync();
    if (fgStatus !== "granted") {
      return {
        success: false,
        error:
          "Ön plan konum izni verilmedi. Lütfen uygulama ayarlarından konum erişimini etkinleştirin.",
      };
    }

    // 2. Arka Plan (Background) Konum İzni İste
    const { status: bgStatus } =
      await Location.requestBackgroundPermissionsAsync();
    if (bgStatus !== "granted") {
      return {
        success: false,
        error:
          "Telefon kilitliyken ve arka plandayken canlı takip için 'Her Zaman İzin Ver' (Allow all the time) yetkisi gereklidir.",
      };
    }

    // 3. Görevin önceden çalışıp çalışmadığını kontrol et
    const isStarted = await Location.hasStartedLocationUpdatesAsync(
      LOCATION_TRACKING_TASK_NAME
    );

    if (isStarted) {
      await Location.stopLocationUpdatesAsync(LOCATION_TRACKING_TASK_NAME);
    }

    // 4. Arka plan servis oturumunu kaydet
    const trackingState: DeliveryTrackingState = {
      isActive: true,
      deliveryId: params?.deliveryId || "DEL-2026-98421",
      driverId: params?.driverId || "usr_driver_01",
      driverName: params?.driverName || "Mehmet Demir",
      waybillNo: params?.waybillNo || "IRS-98421",
      startedAt: new Date().toISOString(),
    };
    await AsyncStorage.setItem(
      TRACKING_STORAGE_KEY,
      JSON.stringify(trackingState)
    );

    // 5. Arka Plan Lokasyon Güncellemelerini Başlat
    await Location.startLocationUpdatesAsync(LOCATION_TRACKING_TASK_NAME, {
      accuracy: Location.Accuracy.High,
      timeInterval: 5000, // 5 saniyede bir
      distanceInterval: 10, // En az 10 metre hareket edince tetikle
      deferredUpdatesInterval: 5000,
      showsBackgroundLocationIndicator: true, // iOS üst barda mavi konum ikonu
      foregroundService: {
        notificationTitle: "🚚 Nexa ERP - Canlı Sevkiyat Takibi",
        notificationBody:
          "Merkez ile canlı konum paylaşılıyor (Telefon kilitli modda aktif)",
        notificationColor: "#2563EB",
      },
      pausesUpdatesAutomatically: false,
    });

    return { success: true };
  } catch (err: any) {
    console.error("[startBackgroundLocationTracking] Hata:", err);
    return {
      success: false,
      error: err?.message || "Arka plan konumu başlatılamadı.",
    };
  }
}

/**
 * 3. Arka Plan Konum Takibini Durdur
 */
export async function stopBackgroundLocationTracking(): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const isStarted = await Location.hasStartedLocationUpdatesAsync(
      LOCATION_TRACKING_TASK_NAME
    );

    if (isStarted) {
      await Location.stopLocationUpdatesAsync(LOCATION_TRACKING_TASK_NAME);
    }

    // AsyncStorage durumunu güncelle
    const stored = await AsyncStorage.getItem(TRACKING_STORAGE_KEY);
    if (stored) {
      const parsed: DeliveryTrackingState = JSON.parse(stored);
      parsed.isActive = false;
      parsed.stoppedAt = new Date().toISOString();
      await AsyncStorage.setItem(
        TRACKING_STORAGE_KEY,
        JSON.stringify(parsed)
      );
    }

    return { success: true };
  } catch (err: any) {
    console.error("[stopBackgroundLocationTracking] Hata:", err);
    return {
      success: false,
      error: err?.message || "Arka plan takibi durdurulamadı.",
    };
  }
}

/**
 * 4. Mevcut Takip Durumunu Sorgula
 */
export async function isLocationTrackingActive(): Promise<boolean> {
  try {
    return await Location.hasStartedLocationUpdatesAsync(
      LOCATION_TRACKING_TASK_NAME
    );
  } catch {
    return false;
  }
}

/**
 * 5. Kayıtlı Teslimat Bilgisini Oku
 */
export async function getActiveDeliveryTracking(): Promise<DeliveryTrackingState | null> {
  try {
    const stored = await AsyncStorage.getItem(TRACKING_STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch {
    // Yok sayılır
  }
  return null;
}
