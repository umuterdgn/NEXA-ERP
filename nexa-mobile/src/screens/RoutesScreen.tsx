/**
 * © 2026 NXA Software. All rights reserved.
 * Nexa ERP Mobil - Şoför, Denetçi, Lab Teknisyeni & Bölge Müdürü Canlı Güzergah Haritası
 * - Google Maps API Key gerektirmeyen Leaflet + OpenStreetMap interaktif WebView haritası
 * - OSRM gerçek yol güzergahı + mesafe/süre hesaplama (erişilemezse düz çizgi fallback)
 * - GPS doğrulamalı Durak Varış / Tamamla (POST /api/mobile/routes/checkin)
 * - Sıfır mock durak ve sıfir sahte koordinat
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  Modal,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { WebView } from "react-native-webview";
import { useAuth } from "../context/AuthContext";
import { extractErrorMessage, mobileApi } from "../services/apiClient";
import {
  calculateDistanceMeters,
  getCurrentGpsFix,
} from "../services/locationTracker";
import { captureAndResolvePhotoUrl } from "../services/mediaHelper";
import { QRScanner } from "../components/scanner/QRScanner";
import {
  AppHeader,
  EmptyState,
  GlassCard,
  ScreenHeader,
  SkeletonList,
  StatusBadge,
} from "../components/ui/NexaUI";
import { iosColors } from "../theme/iosTheme";
import type { RouteStop } from "../types/api";

const NativeWebView = WebView as unknown as React.ComponentType<any>;

interface OSRMRouteSummary {
  coordinates: [number, number][]; // [lat, lng]
  distanceKm: number;
  durationMin: number;
  fromOsrm: boolean;
}

function buildLeafletHtml(params: {
  stops: RouteStop[];
  userFix: { latitude: number; longitude: number } | null;
  polyline: [number, number][];
}): string {
  const validStops = params.stops.filter(
    (s) => typeof s.lat === "number" && typeof s.lng === "number"
  );
  const stopsJson = JSON.stringify(
    validStops.map((s) => ({
      order: s.order,
      title: s.title,
      address: s.address || "",
      status: s.status,
      lat: s.lat,
      lng: s.lng,
    }))
  );
  const userJson = JSON.stringify(params.userFix);
  const polyJson = JSON.stringify(params.polyline);

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>
    html, body, #map { margin: 0; padding: 0; width: 100%; height: 100%; background: #0A0F1C; }
    .stop-pin {
      width: 28px; height: 28px; border-radius: 14px;
      background: #0A7AFF; color: #fff; font-family: sans-serif;
      font-size: 13px; font-weight: 800; display: flex;
      align-items: center; justify-content: center;
      border: 2px solid #ffffff; box-shadow: 0 2px 8px rgba(0,0,0,0.45);
    }
    .stop-pin.done { background: #34C759; }
    .user-pin {
      width: 16px; height: 16px; border-radius: 8px;
      background: #34C759; border: 3px solid #fff;
      box-shadow: 0 0 0 6px rgba(52,199,89,0.28);
    }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    (function() {
      var stops = ${stopsJson};
      var userFix = ${userJson};
      var poly = ${polyJson};
      var center = stops.length > 0
        ? [stops[0].lat, stops[0].lng]
        : (userFix ? [userFix.latitude, userFix.longitude] : [39.92, 32.85]);

      var map = L.map("map", { zoomControl: true, attributionControl: false }).setView(center, 12);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19 }).addTo(map);

      var bounds = [];
      if (userFix) {
        var uIcon = L.divIcon({ className: "", html: '<div class="user-pin"></div>', iconSize: [16, 16], iconAnchor: [8, 8] });
        L.marker([userFix.latitude, userFix.longitude], { icon: uIcon })
          .addTo(map)
          .bindPopup("Mevcut Konumunuz");
        bounds.push([userFix.latitude, userFix.longitude]);
      }

      stops.forEach(function(st) {
        var isDone = ["DELIVERED", "COMPLETED", "APPROVED", "BOŞALTILDI"].indexOf(String(st.status || "").toUpperCase()) >= 0;
        var icon = L.divIcon({
          className: "",
          html: '<div class="stop-pin ' + (isDone ? 'done' : '') + '">' + st.order + '</div>',
          iconSize: [28, 28],
          iconAnchor: [14, 14]
        });
        L.marker([st.lat, st.lng], { icon: icon })
          .addTo(map)
          .bindPopup("<b>#" + st.order + " " + st.title + "</b><br/>" + st.address);
        bounds.push([st.lat, st.lng]);
      });

      if (poly && poly.length >= 2) {
        L.polyline(poly, { color: "#0A7AFF", weight: 4, opacity: 0.9 }).addTo(map);
      } else if (bounds.length >= 2) {
        L.polyline(bounds, { color: "#0A7AFF", weight: 3, dashArray: "6,6", opacity: 0.8 }).addTo(map);
      }

      if (bounds.length > 1) {
        map.fitBounds(bounds, { padding: [36, 36] });
      } else if (bounds.length === 1) {
        map.setView(bounds[0], 14);
      }
    })();
  </script>
</body>
</html>`;
}

function getRoleWorkflowMeta(stop: RouteStop): {
  label: string;
  screenPath: string;
  icon: keyof typeof Ionicons.glyphMap;
} {
  const st = String(stop.stopType || stop.type || "").toUpperCase();
  if (st === "DELIVERY") {
    return {
      label: "İrsaliye QR / Tesellüm",
      screenPath: "/screen/logistics",
      icon: "cube-outline",
    };
  }
  if (st === "SAMPLE_PICKUP") {
    return {
      label: "Numune QR Al",
      screenPath: "/screen/samples",
      icon: "flask-outline",
    };
  }
  if (st === "BRANCH_AUDIT") {
    return {
      label: "Şube Kontrolüne Geç",
      screenPath: "/screen/deficiencies",
      icon: "business-outline",
    };
  }
  return {
    label: "Denetime Başla",
    screenPath: "/screen/inspections",
    icon: "shield-checkmark-outline",
  };
}

export default function RoutesScreen({
  embeddedInTab = false,
}: {
  embeddedInTab?: boolean;
}) {
  const router = useRouter();
  const { locationTrackingMode, activeProject, setActiveProject, assignedProjects } =
    useAuth();

  const [stops, setStops] = useState<RouteStop[]>([]);
  const [userFix, setUserFix] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [routeSummary, setRouteSummary] = useState<OSRMRouteSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Check-in Modalı
  const [checkinTarget, setCheckinTarget] = useState<RouteStop | null>(null);
  const [notes, setNotes] = useState("");
  const [qrCode, setQrCode] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  const [showQrScanner, setShowQrScanner] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const webViewRef = useRef<any>(null);

  const resolveOsrmPolyline = useCallback(
    async (
      stopList: RouteStop[],
      gps: { latitude: number; longitude: number } | null
    ) => {
      const geoPoints: [number, number][] = [];
      if (gps) {
        geoPoints.push([gps.longitude, gps.latitude]); // OSRM lon,lat
      }
      for (const s of stopList) {
        if (typeof s.lat === "number" && typeof s.lng === "number") {
          geoPoints.push([s.lng, s.lat]);
        }
      }

      if (geoPoints.length < 2) {
        setRouteSummary(null);
        return;
      }

      const fallbackCoords: [number, number][] = geoPoints.map(([lng, lat]) => [
        lat,
        lng,
      ]);

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 6000);
      try {
        const coordString = geoPoints
          .map(([lng, lat]) => `${lng},${lat}`)
          .join(";");
        const url = `https://router.project-osrm.org/route/v1/driving/${coordString}?overview=full&geometries=geojson`;
        const resp = await fetch(url, { signal: controller.signal });
        if (!resp.ok) throw new Error("OSRM HTTP hatası");
        const json = await resp.json();
        const best = json?.routes?.[0];
        if (!best?.geometry?.coordinates?.length) {
          throw new Error("OSRM boş rota");
        }
        const latLngPoly: [number, number][] = best.geometry.coordinates.map(
          ([lng, lat]: [number, number]) => [lat, lng]
        );
        setRouteSummary({
          coordinates: latLngPoly,
          distanceKm: Math.round((best.distance / 1000) * 10) / 10,
          durationMin: Math.max(1, Math.round(best.duration / 60)),
          fromOsrm: true,
        });
      } catch {
        // OSRM erişilemezse gerçek durak koordinatları arası düz çizgi fallback
        let totalM = 0;
        for (let i = 1; i < fallbackCoords.length; i++) {
          totalM += calculateDistanceMeters(
            fallbackCoords[i - 1][0],
            fallbackCoords[i - 1][1],
            fallbackCoords[i][0],
            fallbackCoords[i][1]
          );
        }
        setRouteSummary({
          coordinates: fallbackCoords,
          distanceKm: Math.round((totalM / 1000) * 10) / 10,
          durationMin: Math.max(1, Math.round((totalM / 1000 / 45) * 60)),
          fromOsrm: false,
        });
      } finally {
        clearTimeout(timeout);
      }
    },
    []
  );

  const loadRoutes = useCallback(
    async (isRefresh = false) => {
      try {
        if (isRefresh) setRefreshing(true);
        else setLoading(true);
        const [res, gps] = await Promise.all([
          mobileApi.routes.list(),
          getCurrentGpsFix(),
        ]);
        const fetchedStops = res.stops || [];
        setStops(fetchedStops);
        setUserFix(gps);
        await resolveOsrmPolyline(fetchedStops, gps);
      } catch (err: any) {
        Alert.alert("Güzergah Yüklenemedi", extractErrorMessage(err));
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [resolveOsrmPolyline]
  );

  useEffect(() => {
    loadRoutes(false);
  }, [loadRoutes]);

  const coordStopsCount = useMemo(
    () =>
      stops.filter((s) => typeof s.lat === "number" && typeof s.lng === "number")
        .length,
    [stops]
  );

  const mapHtml = useMemo(
    () =>
      buildLeafletHtml({
        stops,
        userFix,
        polyline: routeSummary?.coordinates || [],
      }),
    [stops, userFix, routeSummary]
  );

  const openNativeNavigation = async (stop: RouteStop) => {
    if (typeof stop.lat !== "number" || typeof stop.lng !== "number") {
      Alert.alert(
        "Koordinat Eksik",
        "Bu durak veya şantiye için veritabanında enlem/boylam koordinatı tanımlanmamış."
      );
      return;
    }
    const label = encodeURIComponent(stop.title || "Nexa Durağı");
    const coords = `${stop.lat},${stop.lng}`;
    const url =
      Platform.OS === "ios"
        ? `http://maps.apple.com/?daddr=${coords}&q=${label}`
        : `https://www.google.com/maps/dir/?api=1&destination=${coords}&travelmode=driving`;

    try {
      await Linking.openURL(url);
    } catch {
      Alert.alert("Harita Açılamadı", `Hedef Koordinat: ${coords}`);
    }
  };

  const handleCheckin = async (action: "ARRIVED" | "COMPLETED") => {
    if (!checkinTarget) return;
    setSubmitting(true);
    try {
      const gps = await getCurrentGpsFix();
      const lat = gps?.latitude ?? userFix?.latitude;
      const lng = gps?.longitude ?? userFix?.longitude;
      if (lat == null || lng == null) {
        Alert.alert(
          "GPS Alınamadı",
          "Durak check-in için cihaz konum iznini açıp tekrar deneyin."
        );
        setSubmitting(false);
        return;
      }

      const res = await mobileApi.routes.checkin({
        stopId: checkinTarget.stopId || checkinTarget.id,
        projectId: checkinTarget.projectId || activeProject?.id,
        action,
        stopType: checkinTarget.stopType || checkinTarget.type,
        lat,
        lng,
        notes: notes.trim() || undefined,
        qrCode: qrCode.trim() || undefined,
        photoUrl: photoUrl || undefined,
      });

      if (res.offlineQueued) {
        Alert.alert(
          "Çevrimdışı Kuyruğa Eklendi",
          "İnternet geldiğinde durak güncellemesi sunucuya gönderilecektir."
        );
      } else {
        Alert.alert(
          action === "COMPLETED" ? "Durak Tamamlandı" : "Durağa Varış Kaydedildi",
          res.message ||
            (res.distanceMeters != null
              ? `Hedefe mesafe: ${res.distanceMeters} m`
              : "Durak statüsü güncellendi.")
        );
      }

      setCheckinTarget(null);
      setNotes("");
      setQrCode("");
      setPhotoUrl("");
      if (!res.offlineQueued) await loadRoutes(true);
    } catch (err: any) {
      Alert.alert("Check-In Başarısız", extractErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleRoleQuickWorkflow = async (stop: RouteStop) => {
    const meta = getRoleWorkflowMeta(stop);
    if (stop.projectId) {
      const matched = assignedProjects.find((p) => p.id === stop.projectId);
      if (matched && matched.id !== activeProject?.id) {
        await setActiveProject(matched);
      }
    }
    const gps = await getCurrentGpsFix();
    if (gps) {
      mobileApi.routes
        .checkin({
          stopId: stop.stopId || stop.id,
          projectId: stop.projectId,
          action: "ARRIVED",
          stopType: stop.stopType || stop.type,
          lat: gps.latitude,
          lng: gps.longitude,
          notes: `${meta.label} akışı başlatıldı`,
        })
        .catch(() => {});
    }
    router.push(meta.screenPath as any);
  };

  const handleCapturePhoto = async () => {
    const res = await captureAndResolvePhotoUrl({
      source: "camera",
      sourceModule: "ROUTE_CHECKIN",
      projectId: checkinTarget?.projectId || activeProject?.id,
    });
    if (res?.photoUrl) setPhotoUrl(res.photoUrl);
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      {embeddedInTab ? (
        <AppHeader title="Canlı Güzergah & Rota" />
      ) : (
        <ScreenHeader
          title="Sıralı Duraklar & Harita"
          subtitle="OpenStreetMap & OSRM Canlı Rota Takibi"
        />
      )}

      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadRoutes(true)}
            tintColor="#0A7AFF"
          />
        }
      >
        {/* Telemetri & OSRM Özet Kartı */}
        <GlassCard style={styles.telemetryCard}>
          <Ionicons name="navigate-circle" size={24} color="#34C759" />
          <View style={{ flex: 1 }}>
            <Text style={styles.telemetryTitle}>
              Arka Plan GPS Telemetri: {locationTrackingMode}
            </Text>
            <Text style={styles.telemetrySub}>
              {stops.length} durak ({coordStopsCount} koordinatlı)
              {routeSummary
                ? ` • ${routeSummary.distanceKm} km (~${routeSummary.durationMin} dk${
                    routeSummary.fromOsrm ? " OSRM" : ""
                  })`
                : ""}
            </Text>
          </View>
        </GlassCard>

        {/* İnteraktif Leaflet OpenStreetMap Haritası */}
        {(coordStopsCount > 0 || userFix) && (
          <View style={styles.mapFrame}>
            <NativeWebView
              ref={webViewRef}
              source={{ html: mapHtml }}
              style={styles.mapWebView}
              javaScriptEnabled
              domStorageEnabled
              originWhitelist={["*"]}
            />
          </View>
        )}

        {stops.length > 0 && coordStopsCount === 0 && (
          <GlassCard style={styles.warnCard}>
            <Ionicons name="location-outline" size={18} color="#FF9F0A" />
            <Text style={styles.warnTxt}>
              Duraklar için proje enlem/boylam koordinatları henüz girilmemiş. Web
              panelinden şantiye GPS koordinatı tanımlandığında harita çizimi otomatik
              açılır.
            </Text>
          </GlassCard>
        )}

        {loading ? (
          <SkeletonList count={4} />
        ) : stops.length === 0 ? (
          <EmptyState
            icon="map-outline"
            title="Atanmış Güzergah Bulunmuyor"
            subtitle="Bugün için planlı sevkiyat, denetim, numune veya şube ziyaret durağınız görünmüyor."
          />
        ) : (
          stops.map((stop) => {
            const roleAction = getRoleWorkflowMeta(stop);
            const hasCoords =
              typeof stop.lat === "number" && typeof stop.lng === "number";
            const liveDist =
              hasCoords && userFix
                ? Math.round(
                    calculateDistanceMeters(
                      userFix.latitude,
                      userFix.longitude,
                      stop.lat!,
                      stop.lng!
                    )
                  )
                : null;

            return (
              <GlassCard key={stop.id} style={styles.stopCard}>
                <View style={styles.stopHeader}>
                  <View style={styles.orderBadge}>
                    <Text style={styles.orderText}>{stop.order}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.stopTitle}>{stop.title}</Text>
                    <Text style={styles.stopDesc}>{stop.description}</Text>
                  </View>
                  <StatusBadge status={stop.status} />
                </View>

                <View style={styles.metaRow}>
                  {stop.plateNumber ? (
                    <Text style={styles.metaChip}>Plaka: {stop.plateNumber}</Text>
                  ) : null}
                  {stop.eta ? (
                    <Text style={styles.metaChip}>
                      ETA:{" "}
                      {new Date(stop.eta).toLocaleTimeString("tr-TR", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </Text>
                  ) : null}
                  {liveDist !== null ? (
                    <Text style={styles.metaChip}>
                      Mesafe:{" "}
                      {liveDist >= 1000
                        ? `${(liveDist / 1000).toFixed(1)} km`
                        : `${liveDist} m`}
                    </Text>
                  ) : null}
                  {stop.address ? (
                    <Text style={styles.metaChip} numberOfLines={1}>
                      {stop.address}
                    </Text>
                  ) : null}
                </View>

                <View style={styles.actionsRow}>
                  <TouchableOpacity
                    style={[
                      styles.navBtn,
                      !hasCoords && { backgroundColor: "rgba(255,255,255,0.08)" },
                    ]}
                    onPress={() => openNativeNavigation(stop)}
                    activeOpacity={0.85}
                  >
                    <Ionicons name="navigate" size={16} color="#FFFFFF" />
                    <Text style={styles.navBtnTxt}>Navigasyonu Başlat</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.checkinBtn}
                    onPress={() => setCheckinTarget(stop)}
                    activeOpacity={0.85}
                  >
                    <Ionicons name="checkmark-circle" size={16} color="#FFFFFF" />
                    <Text style={styles.checkinBtnTxt}>Durağa Vardım / Tamamla</Text>
                  </TouchableOpacity>
                </View>

                <TouchableOpacity
                  style={styles.roleWorkflowBtn}
                  onPress={() => handleRoleQuickWorkflow(stop)}
                >
                  <Ionicons name={roleAction.icon} size={16} color="#3B9EFF" />
                  <Text style={styles.roleWorkflowTxt}>{roleAction.label}</Text>
                  <Ionicons name="chevron-forward" size={15} color="#3B9EFF" />
                </TouchableOpacity>
              </GlassCard>
            );
          })
        )}
      </ScrollView>

      {/* Durak Check-In & Tesellüm Modalı */}
      <Modal
        visible={Boolean(checkinTarget)}
        transparent
        animationType="slide"
        onRequestClose={() => setCheckinTarget(null)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.stopHeader}>
              <Text style={styles.modalTitle} numberOfLines={2}>
                {checkinTarget?.title}
              </Text>
              <TouchableOpacity onPress={() => setCheckinTarget(null)}>
                <Ionicons name="close" size={22} color="#8E8E93" />
              </TouchableOpacity>
            </View>

            <Text style={styles.label}>İrsaliye / Numune QR Kodu (Opsiyonel)</Text>
            <View style={styles.actionsRow}>
              <TextInput
                style={[styles.input, { flex: 1 }]}
                value={qrCode}
                onChangeText={setQrCode}
                placeholder="QR kod veya irsaliye no"
                placeholderTextColor="#6E6E73"
              />
              <TouchableOpacity
                style={styles.qrPickBtn}
                onPress={() => setShowQrScanner(true)}
              >
                <Ionicons name="qr-code-outline" size={20} color="#3B9EFF" />
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.photoBtn} onPress={handleCapturePhoto}>
              <Ionicons name="camera-outline" size={18} color="#3B9EFF" />
              <Text style={styles.photoBtnTxt}>
                {photoUrl ? "Teslimat Fotoğrafı Eklendi" : "Kanıt Fotoğrafı Çek (Opsiyonel)"}
              </Text>
            </TouchableOpacity>
            {photoUrl ? (
              <Image
                source={{ uri: photoUrl }}
                style={styles.previewImg}
                resizeMode="cover"
              />
            ) : null}

            <Text style={styles.label}>Durak Notu</Text>
            <TextInput
              style={[styles.input, { minHeight: 68, textAlignVertical: "top" }]}
              value={notes}
              onChangeText={setNotes}
              multiline
              placeholder="İrsaliye, boşaltma veya saha gözlem notu..."
              placeholderTextColor="#6E6E73"
            />

            <View style={styles.actionsRow}>
              <TouchableOpacity
                style={styles.arrivedBtn}
                onPress={() => handleCheckin("ARRIVED")}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.actionBtnTxt}>Durağa Vardım</Text>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.completeBtn}
                onPress={() => handleCheckin("COMPLETED")}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.actionBtnTxt}>Tamamla</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showQrScanner}
        animationType="slide"
        onRequestClose={() => setShowQrScanner(false)}
      >
        <QRScanner
          title="İrsaliye / Durak QR Okuyucu"
          subtitle="Teslimat veya numune QR kodunu çerçeveye getirin"
          onScan={(code) => {
            setShowQrScanner(false);
            setQrCode(code.trim());
          }}
          onClose={() => setShowQrScanner(false)}
        />
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: iosColors.background },
  scroll: { padding: 16, paddingBottom: 120, gap: 12 },
  telemetryCard: { flexDirection: "row", alignItems: "center", gap: 12 },
  telemetryTitle: { color: "#FFFFFF", fontSize: 13, fontWeight: "700" },
  telemetrySub: { color: "#8E8E93", fontSize: 12, marginTop: 2 },
  mapFrame: {
    height: 250,
    borderRadius: 18,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    backgroundColor: "#0A0F1C",
  },
  mapWebView: { flex: 1, backgroundColor: "#0A0F1C" },
  warnCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "rgba(255,149,0,0.12)",
    borderColor: "rgba(255,149,0,0.35)",
  },
  warnTxt: { flex: 1, color: "#FF9F0A", fontSize: 12, lineHeight: 17 },
  stopCard: { gap: 10 },
  stopHeader: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  orderBadge: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#0A7AFF",
    alignItems: "center",
    justifyContent: "center",
  },
  orderText: { color: "#FFFFFF", fontSize: 14, fontWeight: "800" },
  stopTitle: { color: "#FFFFFF", fontSize: 15, fontWeight: "700" },
  stopDesc: { color: "#98A2B3", fontSize: 12, marginTop: 2 },
  metaRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  metaChip: {
    color: "rgba(235,235,245,0.75)",
    fontSize: 11,
    backgroundColor: "rgba(255,255,255,0.06)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  actionsRow: { flexDirection: "row", gap: 8 },
  navBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "#0A7AFF",
    borderRadius: 12,
    paddingVertical: 11,
  },
  navBtnTxt: { color: "#FFFFFF", fontSize: 12, fontWeight: "700" },
  checkinBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "#34C759",
    borderRadius: 12,
    paddingVertical: 11,
    paddingHorizontal: 6,
  },
  checkinBtnTxt: { color: "#FFFFFF", fontSize: 12, fontWeight: "700", textAlign: "center" },
  roleWorkflowBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: "rgba(10,122,255,0.12)",
    borderWidth: 1,
    borderColor: "rgba(10,122,255,0.28)",
  },
  roleWorkflowTxt: { flex: 1, color: "#3B9EFF", fontSize: 12, fontWeight: "700" },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.75)",
    justifyContent: "flex-end",
  },
  modalCard: {
    backgroundColor: "#111827",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    gap: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  modalTitle: { flex: 1, color: "#FFFFFF", fontSize: 17, fontWeight: "800" },
  label: { color: "#98A2B3", fontSize: 12, fontWeight: "700" },
  input: {
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    borderRadius: 12,
    padding: 12,
    color: "#FFFFFF",
    fontSize: 14,
  },
  qrPickBtn: {
    width: 48,
    borderRadius: 12,
    backgroundColor: "rgba(10,122,255,0.16)",
    borderWidth: 1,
    borderColor: "rgba(10,122,255,0.35)",
    alignItems: "center",
    justifyContent: "center",
  },
  photoBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 11,
    borderRadius: 12,
    backgroundColor: "rgba(10,122,255,0.12)",
    borderWidth: 1,
    borderColor: "rgba(10,122,255,0.3)",
  },
  photoBtnTxt: { color: "#3B9EFF", fontSize: 13, fontWeight: "700" },
  previewImg: { width: "100%", height: 110, borderRadius: 10 },
  arrivedBtn: {
    flex: 1,
    backgroundColor: "#FF9500",
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: "center",
  },
  completeBtn: {
    flex: 1,
    backgroundColor: "#34C759",
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: "center",
  },
  actionBtnTxt: { color: "#FFFFFF", fontSize: 14, fontWeight: "800" },
});
