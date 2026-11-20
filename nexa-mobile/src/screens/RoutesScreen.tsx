/**
 * © 2026 NXA Software. All rights reserved.
 * Nexa ERP Mobil - Şoför Sevkiyat / Denetçi / Bölge Müdürü Canlı Güzergah Rotası (GET /api/mobile/routes)
 */

import React, { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Linking,
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
import { useAuth } from "../context/AuthContext";
import { extractErrorMessage, mobileApi } from "../services/apiClient";
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

export default function RoutesScreen({
  embeddedInTab = false,
}: {
  embeddedInTab?: boolean;
}) {
  const { locationTrackingMode } = useAuth();
  const [stops, setStops] = useState<RouteStop[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadRoutes = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      const res = await mobileApi.routes.list();
      setStops(res.stops || []);
    } catch (err: any) {
      Alert.alert("Güzergah Yüklenemedi", extractErrorMessage(err));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadRoutes(false);
  }, [loadRoutes]);

  const openNativeNavigation = async (stop: RouteStop) => {
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

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      {embeddedInTab ? (
        <AppHeader title="Güzergah & Rota Takibi" />
      ) : (
        <ScreenHeader
          title="Sıralı Duraklar & Navigasyon"
          subtitle="Canlı Teslimat / Denetim / Şube Rotası"
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
        <GlassCard style={styles.telemetryCard}>
          <Ionicons name="navigate-circle" size={22} color="#34C759" />
          <View style={{ flex: 1 }}>
            <Text style={styles.telemetryTitle}>
              Canlı GPS Telemetrisi: {locationTrackingMode}
            </Text>
            <Text style={styles.telemetrySub}>
              Toplam {stops.length} aktif durak sunucudan sıralandı.
            </Text>
          </View>
        </GlassCard>

        {loading ? (
          <SkeletonList count={4} />
        ) : stops.length === 0 ? (
          <EmptyState
            icon="map-outline"
            title="Atanmış Güzergah Bulunmuyor"
            subtitle="Bugün için planlı sevkiyat, denetim veya şube ziyaret durağınız görünmüyor."
          />
        ) : (
          stops.map((stop) => (
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
                    ETA: {new Date(stop.eta).toLocaleTimeString("tr-TR", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </Text>
                ) : null}
                {stop.address ? (
                  <Text style={styles.metaChip} numberOfLines={1}>
                    {stop.address}
                  </Text>
                ) : null}
              </View>

              <TouchableOpacity
                style={styles.navBtn}
                onPress={() => openNativeNavigation(stop)}
                activeOpacity={0.85}
              >
                <Ionicons name="navigate" size={16} color="#FFFFFF" />
                <Text style={styles.navBtnTxt}>Haritada Yol Tarifi Başlat</Text>
              </TouchableOpacity>
            </GlassCard>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: iosColors.background },
  scroll: { padding: 16, paddingBottom: 120, gap: 12 },
  telemetryCard: { flexDirection: "row", alignItems: "center", gap: 12 },
  telemetryTitle: { color: "#FFFFFF", fontSize: 13, fontWeight: "700" },
  telemetrySub: { color: "#8E8E93", fontSize: 12, marginTop: 2 },
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
  navBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#0A7AFF",
    borderRadius: 12,
    paddingVertical: 11,
  },
  navBtnTxt: { color: "#FFFFFF", fontSize: 13, fontWeight: "700" },
});
