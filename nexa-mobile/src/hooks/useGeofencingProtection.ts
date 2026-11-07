/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Nexa ERP - Geofencing & İSG Riskli Alan Koruma Hook'u
 * 
 * expo-location ile canlı GPS verisini web panelinden çizilen poligonlarla (DANGER_ZONE)
 * gerçek zamanlı çarpıştırır. Riskli alana girildiğinde titreşimli bildirim ve
 * İSG Güvenlik Uyarısı fırlatır.
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { Alert, Vibration, Platform } from "react-native";
import * as Location from "expo-location";
import * as Notifications from "expo-notifications";
import {
  LatLng,
  MobileGeofence,
  isPointInPolygon,
  normalizeCoordinates,
} from "../lib/geofencing";
import { geofencesApi } from "../../apiClient";

export interface UseGeofencingProtectionOptions {
  projectId?: string;
  enabled?: boolean;
}

export function useGeofencingProtection(options: UseGeofencingProtectionOptions = {}) {
  const { projectId, enabled = true } = options;

  const [geofences, setGeofences] = useState<MobileGeofence[]>([]);
  const [userLocation, setUserLocation] = useState<LatLng | null>(null);
  const [activeDangerZone, setActiveDangerZone] = useState<MobileGeofence | null>(null);
  const [isInsideDangerZone, setIsInsideDangerZone] = useState<boolean>(false);

  const lastBreachTimeRef = useRef<{ [zoneId: string]: number }>({});
  const locationSubRef = useRef<Location.LocationSubscription | null>(null);

  // 1. Sanal Çitleri (Geofences) Yükle
  const loadGeofences = useCallback(async () => {
    try {
      const data = await geofencesApi.getGeofences(projectId);
      if (Array.isArray(data)) {
        const parsed: MobileGeofence[] = data.map((item: any) => ({
          id: item.id || `gf-${Math.random()}`,
          name: item.name || item.title || "Şantiye Çiti",
          type: item.type || item.zoneType || "MAIN_SITE",
          coordinates: normalizeCoordinates(item.coordinates || item.polygonCoordinates),
          projectId: item.projectId,
          isActive: item.isActive !== false,
        }));
        setGeofences(parsed);
      }
    } catch (err) {
      console.warn("[useGeofencingProtection] loadGeofences warn:", err);
    }
  }, [projectId]);

  // 2. Canlı GPS Takibi & Çarpışma Testi
  useEffect(() => {
    if (!enabled) return;

    loadGeofences();

    let isMounted = true;

    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          console.warn("[useGeofencingProtection] Foreground permission denied");
          return;
        }

        // Bildirim İzni
        try {
          await Notifications.requestPermissionsAsync();
        } catch {}

        // Anlık İlk Konum
        const initialLoc = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });

        if (isMounted && initialLoc?.coords) {
          const point: LatLng = {
            latitude: initialLoc.coords.latitude,
            longitude: initialLoc.coords.longitude,
          };
          setUserLocation(point);
          checkBreaches(point, geofences);
        }

        // Sürekli GPS İzleme (3 saniye veya 4 metre değişim)
        locationSubRef.current = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.High,
            timeInterval: 3000,
            distanceInterval: 4,
          },
          (loc) => {
            if (!isMounted || !loc?.coords) return;
            const currentPoint: LatLng = {
              latitude: loc.coords.latitude,
              longitude: loc.coords.longitude,
            };
            setUserLocation(currentPoint);
            checkBreaches(currentPoint, geofences);
          }
        );
      } catch (e) {
        console.warn("[useGeofencingProtection] GPS watch error:", e);
      }
    })();

    return () => {
      isMounted = false;
      if (locationSubRef.current) {
        locationSubRef.current.remove();
        locationSubRef.current = null;
      }
    };
  }, [enabled, loadGeofences]);

  // 3. Riskli Alan (DANGER_ZONE) Çarpışma Kontrolü
  const checkBreaches = useCallback(
    (point: LatLng, currentGeofences: MobileGeofence[]) => {
      if (!currentGeofences || currentGeofences.length === 0) return;

      const dangerZones = currentGeofences.filter(
        (g) => g.type === "DANGER_ZONE" && g.coordinates.length >= 3
      );

      let foundDangerZone: MobileGeofence | null = null;

      for (const zone of dangerZones) {
        const inside = isPointInPolygon(point, zone.coordinates);
        if (inside) {
          foundDangerZone = zone;
          break;
        }
      }

      if (foundDangerZone) {
        setIsInsideDangerZone(true);
        setActiveDangerZone(foundDangerZone);

        const now = Date.now();
        const lastBreach = lastBreachTimeRef.current[foundDangerZone.id] || 0;

        // 45 saniyelik bildirim soğuma süresi (cooldown)
        if (now - lastBreach > 45000) {
          lastBreachTimeRef.current[foundDangerZone.id] = now;

          // Titreşim (Uzun ritmik uyarı)
          if (Platform.OS !== "web") {
            Vibration.vibrate([0, 500, 200, 500]);
          }

          // Push / Yerel Bildirim
          try {
            Notifications.scheduleNotificationAsync({
              content: {
                title: "⚠️ İSG Tehlike Uyarısı!",
                body: "⚠️ Uyarı: Riskli alana giriş yaptınız! Baret ve KKD kontrolü yapın.",
                data: { zoneId: foundDangerZone.id, zoneName: foundDangerZone.name },
                sound: true,
              },
              trigger: null,
            }).catch(() => null);
          } catch {}

          // Ekran Bildirimi (Alert)
          Alert.alert(
            "⚠️ İSG KRİTİK GÜVENLİK UYARISI",
            `⚠️ Uyarı: Riskli alana giriş yaptınız!\n[${foundDangerZone.name}]\n\nLütfen baret, yelek ve KKD kontrollerinizi derhal tamamlayınız!`,
            [
              {
                text: "Anladım, KKD Kontrolü Yaptım",
                style: "default",
                onPress: () => {},
              },
            ],
            { cancelable: false }
          );
        }
      } else {
        setIsInsideDangerZone(false);
        setActiveDangerZone(null);
      }
    },
    []
  );

  return {
    userLocation,
    geofences,
    isInsideDangerZone,
    activeDangerZone,
    reloadGeofences: loadGeofences,
  };
}

