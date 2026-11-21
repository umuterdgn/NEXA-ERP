/**
 * © 2026 NXA Software. All rights reserved.
 * Nexa ERP Mobil - Zimmetli BLE Yakınlık & Ekipman Radarı Ekranı
 * - Yalnızca sunucudan (GET /api/mobile/ble/devices) dönen zimmetli etiketleri gösterir.
 * - Expo Go içinde native BLE modülü yoksa güvenli bilgilendirme kartıyla çalışır.
 * - "Ekipman / Baret Bul" sıcak-soğuk RSSI mesafe ölçer ve son GPS konumunu açma.
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Easing,
  Linking,
  Modal,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useAuth } from "../context/AuthContext";
import { extractErrorMessage, mobileApi } from "../services/apiClient";
import {
  bleProximity,
  checkBleSupport,
  type BleTrackedDeviceState,
} from "../services/bleProximity";
import {
  AppHeader,
  EmptyState,
  GlassCard,
  ScreenHeader,
  SkeletonList,
  StatusBadge,
} from "../components/ui/NexaUI";
import { iosColors } from "../theme/iosTheme";
import type { BleDeviceItem, BleProximityZone } from "../types/api";

function getZoneUi(zone: BleProximityZone | "UNKNOWN") {
  switch (zone) {
    case "IMMEDIATE":
      return { label: "ÇOK YAKIN (0-1.5m)", color: "#34C759", status: "ACTIVE" };
    case "NEAR":
      return { label: "YAKIN (1.5-5m)", color: "#0A7AFF", status: "INFO" };
    case "FAR":
      return { label: "UZAK (5-20m)", color: "#FF9F0A", status: "PENDING" };
    case "LOST":
      return { label: "SİNYAL KAYIP", color: "#FF453A", status: "FAILED" };
    default:
      return { label: "TARAMA BEKLİYOR", color: "#8E8E93", status: "INFO" };
  }
}

function rssiToWarmthPercent(rssi: number | null): number {
  if (rssi == null) return 0;
  const clamped = Math.max(-100, Math.min(-42, rssi));
  return Math.round(((clamped + 100) / 58) * 100);
}

export default function BleRadarScreen({
  embeddedInTab = false,
}: {
  embeddedInTab?: boolean;
}) {
  const { activeProject } = useAuth();
  const support = useMemo(() => checkBleSupport(), []);

  const [rawDevices, setRawDevices] = useState<BleDeviceItem[]>([]);
  const [tracked, setTracked] = useState<BleTrackedDeviceState[]>([]);
  const [scope, setScope] = useState<"PERSONAL" | "PROJECT">("PERSONAL");
  const [isScanning, setIsScanning] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Ekipman / Baret Bul modalı
  const [finderId, setFinderId] = useState<string | null>(null);

  // Radar Pulse Animasyonu
  const pulseAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(pulseAnim, {
        toValue: 1,
        duration: 2200,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      })
    );
    if (isScanning) {
      loop.start();
    } else {
      loop.stop();
      pulseAnim.setValue(0);
    }
    return () => loop.stop();
  }, [isScanning, pulseAnim]);

  const loadDevices = useCallback(
    async (isRefresh = false) => {
      try {
        if (isRefresh) setRefreshing(true);
        else setLoading(true);
        const res = await mobileApi.ble.listDevices(activeProject?.id);
        setScope(res.scope);
        const list = res.devices || [];
        setRawDevices(list);
        bleProximity.seedDevices(list);
      } catch (err: any) {
        Alert.alert("BLE Cihaz Listesi Alınamadı", extractErrorMessage(err));
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [activeProject?.id]
  );

  useEffect(() => {
    loadDevices(false);
    return () => {
      bleProximity.stop();
    };
  }, [loadDevices]);

  const handleToggleScan = async () => {
    if (isScanning) {
      bleProximity.stop();
      setIsScanning(false);
      return;
    }

    const res = await bleProximity.startScan(
      rawDevices,
      (states, meta) => {
        setTracked(states);
        setIsScanning(meta.isScanning);
        setScanError(meta.error || null);
      },
      activeProject?.id
    );

    if (!res.started && res.error) {
      setScanError(res.error);
    }
  };

  // Seed ilk veri geldiğinde listener kayıtlı değilse gösterim listesi rawDevices üzerinden kurulur
  const displayRows: BleTrackedDeviceState[] = useMemo(() => {
    if (tracked.length > 0) return tracked;
    return rawDevices.map((d) => ({
      device: d,
      rssiHistory: [],
      smoothedRssi: d.lastRssi ?? null,
      estimatedDistanceMeters: null,
      proximityZone:
        d.status === "LOST"
          ? "LOST"
          : (d.proximityZone as any) || "UNKNOWN",
      lastPacketAt: d.lastSeenAt ? new Date(d.lastSeenAt).getTime() : null,
      signalLostAlertSent: d.status === "LOST",
    }));
  }, [tracked, rawDevices]);

  const finderDevice = useMemo(
    () => displayRows.find((r) => r.device.id === finderId) || null,
    [displayRows, finderId]
  );

  useEffect(() => {
    if (
      finderDevice &&
      (finderDevice.proximityZone === "IMMEDIATE" ||
        finderDevice.proximityZone === "NEAR")
    ) {
      Haptics.impactAsync(
        finderDevice.proximityZone === "IMMEDIATE"
          ? Haptics.ImpactFeedbackStyle.Heavy
          : Haptics.ImpactFeedbackStyle.Light
      ).catch(() => {});
    }
  }, [finderDevice?.smoothedRssi, finderDevice?.proximityZone]);

  const openLastGpsInMaps = async (lat?: number | null, lng?: number | null, title?: string) => {
    if (lat == null || lng == null) {
      Alert.alert("Konum Kaydı Yok", "Bu etiket için henüz son görülen GPS koordinatı kaydedilmedi.");
      return;
    }
    const coords = `${lat},${lng}`;
    const q = encodeURIComponent(title || "Son BLE Konumu");
    const url =
      Platform.OS === "ios"
        ? `http://maps.apple.com/?ll=${coords}&q=${q}`
        : `https://www.google.com/maps/search/?api=1&query=${coords}`;
    await Linking.openURL(url).catch(() => {});
  };

  const ringScale = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.4, 1.8],
  });
  const ringOpacity = pulseAnim.interpolate({
    inputRange: [0, 0.8, 1],
    outputRange: [0.65, 0.15, 0],
  });

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      {embeddedInTab ? (
        <AppHeader title="Zimmetli BLE Yakınlık Radarı" />
      ) : (
        <ScreenHeader
          title="BLE Yakınlık & Ekipman Radarı"
          subtitle={
            scope === "PROJECT"
              ? `${activeProject?.name || "Şantiye"} • Tüm Ekip & Ekipman`
              : "Kişisel Zimmetli Baret / Kart Takibi"
          }
        />
      )}

      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadDevices(true)}
            tintColor="#0A7AFF"
          />
        }
      >
        {/* Expo Go / Native BLE Bilgi Kartı */}
        {!support.supported && (
          <GlassCard style={styles.expoNoticeCard}>
            <Ionicons name="bluetooth-outline" size={22} color="#FF9F0A" />
            <View style={{ flex: 1 }}>
              <Text style={styles.expoNoticeTitle}>Donanım Modu Bilgisi</Text>
              <Text style={styles.expoNoticeText}>
                {support.reason ||
                  "Canlı Bluetooth (BLE) taraması için Android Test APK / Dev Build gereklidir."}
              </Text>
            </View>
          </GlassCard>
        )}

        {scanError && support.supported ? (
          <GlassCard style={styles.expoNoticeCard}>
            <Ionicons name="alert-circle" size={20} color="#FF453A" />
            <Text style={[styles.expoNoticeText, { flex: 1 }]}>{scanError}</Text>
          </GlassCard>
        ) : null}

        {/* Canlı Radar Görselleştirmesi */}
        <GlassCard style={styles.radarCard}>
          <View style={styles.radarCenterArea}>
            <Animated.View
              style={[
                styles.radarPulseRing,
                {
                  transform: [{ scale: ringScale }],
                  opacity: isScanning ? ringOpacity : 0,
                },
              ]}
            />
            <View style={styles.radarStaticOuter}>
              <View style={styles.radarStaticInner}>
                <Ionicons
                  name="bluetooth"
                  size={30}
                  color={isScanning ? "#34C759" : "#3B9EFF"}
                />
              </View>
            </View>
          </View>

          <Text style={styles.radarTitle}>
            {isScanning
              ? "Zimmetli Etiketler Taranıyor..."
              : `${displayRows.length} Zimmetli BLE Etiketi Hazır`}
          </Text>
          <Text style={styles.radarSub}>
            60 saniye sinyal kaybında son GPS ile yöneticilere otomatik uyarı iletilir.
          </Text>

          <TouchableOpacity
            style={[
              styles.scanBtn,
              isScanning && { backgroundColor: "#FF453A" },
              !support.supported && { opacity: 0.55 },
            ]}
            onPress={handleToggleScan}
            activeOpacity={0.85}
          >
            <Ionicons
              name={isScanning ? "stop-circle" : "radio"}
              size={18}
              color="#FFFFFF"
            />
            <Text style={styles.scanBtnTxt}>
              {isScanning ? "BLE Taramasını Durdur" : "Canlı BLE Taramayı Başlat"}
            </Text>
          </TouchableOpacity>
        </GlassCard>

        <Text style={styles.sectionTitle}>
          CANLI ZİMMETLİ CİHAZ LİSTESİ ({displayRows.length})
        </Text>

        {loading ? (
          <SkeletonList count={3} />
        ) : displayRows.length === 0 ? (
          <EmptyState
            icon="bluetooth-outline"
            title="Zimmetli BLE Etiketi Yok"
            subtitle="Üzerinize veya şantiyenize atanmış akıllı baret/yaka kartı/ekipman BLE kaydı bulunmuyor."
          />
        ) : (
          displayRows.map((row) => {
            const zoneUi = getZoneUi(row.proximityZone);
            return (
              <GlassCard key={row.device.id} style={styles.deviceCard}>
                <View style={styles.rowBetween}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.devTitle}>{row.device.name}</Text>
                    <Text style={styles.devMeta}>
                      {row.device.type} • MAC: {row.device.macAddress}
                    </Text>
                    {row.device.assignedToName ? (
                      <Text style={styles.devMeta}>
                        Zimmetli: {row.device.assignedToName}
                      </Text>
                    ) : null}
                  </View>
                  <StatusBadge status={zoneUi.status} label={zoneUi.label} />
                </View>

                <View style={styles.metricsRow}>
                  <View style={styles.metricPill}>
                    <Text style={styles.metricLabel}>Ort. RSSI</Text>
                    <Text style={styles.metricVal}>
                      {row.smoothedRssi != null ? `${row.smoothedRssi} dBm` : "--"}
                    </Text>
                  </View>
                  <View style={styles.metricPill}>
                    <Text style={styles.metricLabel}>Tahmini Mesafe</Text>
                    <Text style={styles.metricVal}>
                      {row.estimatedDistanceMeters != null
                        ? `${row.estimatedDistanceMeters} m`
                        : "--"}
                    </Text>
                  </View>
                  <View style={styles.metricPill}>
                    <Text style={styles.metricLabel}>Etiket Pili</Text>
                    <Text style={styles.metricVal}>
                      {row.device.batteryLevel != null
                        ? `%${row.device.batteryLevel}`
                        : "--"}
                    </Text>
                  </View>
                </View>

                <View style={styles.row2}>
                  <TouchableOpacity
                    style={styles.findBtn}
                    onPress={() => setFinderId(row.device.id)}
                  >
                    <Ionicons name="locate" size={16} color="#FFFFFF" />
                    <Text style={styles.findBtnTxt}>Ekipman / Baret Bul</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.gpsBtn}
                    onPress={() =>
                      openLastGpsInMaps(
                        row.device.lastLat,
                        row.device.lastLng,
                        row.device.name
                      )
                    }
                  >
                    <Ionicons name="map-outline" size={16} color="#3B9EFF" />
                    <Text style={styles.gpsBtnTxt}>Son GPS</Text>
                  </TouchableOpacity>
                </View>
              </GlassCard>
            );
          })
        )}
      </ScrollView>

      {/* Ekipman / Baret Bul Sıcak-Soğuk Radar Modalı */}
      <Modal
        visible={Boolean(finderDevice)}
        transparent
        animationType="slide"
        onRequestClose={() => setFinderId(null)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.rowBetween}>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalEyebrow}>SICAK-SOĞUK SİNYAL ARAMA</Text>
                <Text style={styles.modalTitle}>
                  {finderDevice?.device.name || "Cihaz"}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setFinderId(null)}>
                <Ionicons name="close" size={24} color="#8E8E93" />
              </TouchableOpacity>
            </View>

            {finderDevice && (
              <>
                <View style={styles.finderReadout}>
                  <Text style={styles.finderDistance}>
                    {finderDevice.estimatedDistanceMeters != null
                      ? `${finderDevice.estimatedDistanceMeters} m`
                      : "Sinyal Bekleniyor"}
                  </Text>
                  <Text style={styles.finderSub}>
                    {getZoneUi(finderDevice.proximityZone).label} •{" "}
                    {finderDevice.smoothedRssi != null
                      ? `${finderDevice.smoothedRssi} dBm`
                      : "RSSI yok"}
                  </Text>
                </View>

                <View style={styles.warmthTrack}>
                  <View
                    style={[
                      styles.warmthFill,
                      {
                        width: `${rssiToWarmthPercent(finderDevice.smoothedRssi)}%`,
                        backgroundColor: getZoneUi(finderDevice.proximityZone).color,
                      },
                    ]}
                  />
                </View>
                <View style={styles.warmthLabels}>
                  <Text style={styles.warmthTxt}>Soğuk (Uzak)</Text>
                  <Text style={styles.warmthTxt}>Sıcak (Çok Yakın)</Text>
                </View>

                <Text style={styles.lastSeenTxt}>
                  Son Sinyal:{" "}
                  {finderDevice.lastPacketAt
                    ? new Date(finderDevice.lastPacketAt).toLocaleString("tr-TR")
                    : finderDevice.device.lastSeenAt
                    ? new Date(finderDevice.device.lastSeenAt).toLocaleString("tr-TR")
                    : "Henüz yok"}
                </Text>

                {!isScanning && support.supported && (
                  <TouchableOpacity
                    style={styles.scanBtn}
                    onPress={handleToggleScan}
                  >
                    <Ionicons name="radio" size={18} color="#FFFFFF" />
                    <Text style={styles.scanBtnTxt}>Canlı Taramayı Başlat</Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  style={styles.gpsFullBtn}
                  onPress={() =>
                    openLastGpsInMaps(
                      finderDevice.device.lastLat,
                      finderDevice.device.lastLng,
                      finderDevice.device.name
                    )
                  }
                >
                  <Ionicons name="location" size={16} color="#3B9EFF" />
                  <Text style={styles.gpsBtnTxt}>Son GPS Konumunu Haritada Göster</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: iosColors.background },
  scroll: { padding: 16, paddingBottom: 120, gap: 12 },
  expoNoticeCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "rgba(255,149,0,0.12)",
    borderColor: "rgba(255,149,0,0.35)",
  },
  expoNoticeTitle: { color: "#FFFFFF", fontSize: 13, fontWeight: "800" },
  expoNoticeText: { color: "#FFD60A", fontSize: 12, marginTop: 2, lineHeight: 17 },
  radarCard: { alignItems: "center", gap: 10, paddingVertical: 18 },
  radarCenterArea: {
    width: 112,
    height: 112,
    alignItems: "center",
    justifyContent: "center",
  },
  radarPulseRing: {
    position: "absolute",
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    borderColor: "#34C759",
    backgroundColor: "rgba(52,199,89,0.16)",
  },
  radarStaticOuter: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: "rgba(10,122,255,0.15)",
    borderWidth: 1,
    borderColor: "rgba(10,122,255,0.35)",
    alignItems: "center",
    justifyContent: "center",
  },
  radarStaticInner: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: "rgba(10,122,255,0.22)",
    alignItems: "center",
    justifyContent: "center",
  },
  radarTitle: { color: "#FFFFFF", fontSize: 16, fontWeight: "800" },
  radarSub: { color: "#8E8E93", fontSize: 12, textAlign: "center" },
  scanBtn: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#0A7AFF",
    borderRadius: 12,
    paddingVertical: 13,
    marginTop: 4,
  },
  scanBtnTxt: { color: "#FFFFFF", fontSize: 14, fontWeight: "800" },
  sectionTitle: {
    color: "#8E8E93",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.7,
    marginTop: 4,
  },
  deviceCard: { gap: 10 },
  rowBetween: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 8,
  },
  devTitle: { color: "#FFFFFF", fontSize: 15, fontWeight: "700" },
  devMeta: { color: "#8E8E93", fontSize: 12, marginTop: 2 },
  metricsRow: { flexDirection: "row", gap: 8 },
  metricPill: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: 10,
    padding: 8,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
  },
  metricLabel: { color: "#8E8E93", fontSize: 10, fontWeight: "600" },
  metricVal: { color: "#FFFFFF", fontSize: 13, fontWeight: "800", marginTop: 2 },
  row2: { flexDirection: "row", gap: 8 },
  findBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "#0A7AFF",
    borderRadius: 10,
    paddingVertical: 10,
  },
  findBtnTxt: { color: "#FFFFFF", fontSize: 13, fontWeight: "700" },
  gpsBtn: {
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "rgba(10,122,255,0.14)",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(10,122,255,0.3)",
  },
  gpsBtnTxt: { color: "#3B9EFF", fontSize: 13, fontWeight: "700" },
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
    gap: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  modalEyebrow: { color: "#3B9EFF", fontSize: 11, fontWeight: "800", letterSpacing: 0.7 },
  modalTitle: { color: "#FFFFFF", fontSize: 18, fontWeight: "800", marginTop: 2 },
  finderReadout: { alignItems: "center", paddingVertical: 8 },
  finderDistance: { color: "#FFFFFF", fontSize: 34, fontWeight: "900" },
  finderSub: { color: "#98A2B3", fontSize: 13, fontWeight: "600", marginTop: 4 },
  warmthTrack: {
    height: 16,
    borderRadius: 8,
    backgroundColor: "rgba(255,255,255,0.08)",
    overflow: "hidden",
  },
  warmthFill: { height: "100%", borderRadius: 8 },
  warmthLabels: { flexDirection: "row", justifyContent: "space-between" },
  warmthTxt: { color: "#8E8E93", fontSize: 11, fontWeight: "600" },
  lastSeenTxt: { color: "#98A2B3", fontSize: 12, textAlign: "center" },
  gpsFullBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: "rgba(10,122,255,0.14)",
    borderWidth: 1,
    borderColor: "rgba(10,122,255,0.3)",
  },
});

