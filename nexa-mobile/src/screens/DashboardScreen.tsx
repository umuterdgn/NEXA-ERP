/**
 * © 2026 NXA Software. All rights reserved.
 * Nexa ERP Mobil - Dinamik Canlı Ana Sayfa (GET /api/mobile/dashboard)
 * Sıfır mock veri: Tüm metrikler, görevler, hava durumu ve duyurular sunucudan gelir.
 */

import React, { useCallback, useEffect, useState } from "react";
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useAuth } from "../context/AuthContext";
import { extractErrorMessage, mobileApi } from "../services/apiClient";
import {
  AppHeader,
  EmptyState,
  GlassCard,
  SkeletonList,
  StatusBadge,
} from "../components/ui/NexaUI";
import {
  getAuthorizedModules,
  type IoniconName,
} from "../config/navigationConfig";
import { iosColors } from "../theme/iosTheme";
import type { DashboardResponse } from "../types/api";

function decodeWmoWeather(code?: number): { label: string; icon: IoniconName } {
  if (code == null) return { label: "Açık", icon: "sunny" };
  if (code === 0) return { label: "Açık & Güneşli", icon: "sunny" };
  if (code <= 3) return { label: "Parçalı Bulutlu", icon: "partly-sunny" };
  if (code <= 48) return { label: "Sisli", icon: "cloud" };
  if (code <= 67) return { label: "Yağmurlu", icon: "rainy" };
  if (code <= 77) return { label: "Kar Yağışlı", icon: "snow" };
  if (code <= 82) return { label: "Sağanak", icon: "rainy" };
  return { label: "Fırtınalı", icon: "thunderstorm" };
}

export default function DashboardScreen({ showHeader = true }: { showHeader?: boolean }) {
  const router = useRouter();
  const {
    role,
    tenantType,
    allowedModules,
    activeProject,
    hasModule,
  } = useAuth();

  const [data, setData] = useState<DashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const loadDashboard = useCallback(
    async (isRefresh = false) => {
      try {
        if (isRefresh) setRefreshing(true);
        else setLoading(true);
        setErrorMsg(null);
        const res = await mobileApi.dashboard.get(activeProject?.id);
        setData(res);
      } catch (err: any) {
        setErrorMsg(extractErrorMessage(err, "Ana sayfa verileri yüklenemedi."));
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [activeProject?.id]
  );

  useEffect(() => {
    loadDashboard(false);
  }, [loadDashboard]);

  const weatherMeta = decodeWmoWeather(data?.weather?.weatherCode);
  const quickModules = getAuthorizedModules(role, allowedModules).slice(0, 4);

  const visibleMetrics = (data?.metrics || []).filter((m) => {
    if (m.key === "deficiencies") return hasModule("deficiencies", "ncr_dof");
    if (m.key === "attendance") return hasModule("my_attendance_qr", "attendance");
    if (m.key === "tasks") return hasModule("tasks_work_orders");
    return true;
  });

  const openNativeScreen = (screenId: string, params?: Record<string, string>) => {
    router.push({
      pathname: "/screen/[moduleId]",
      params: { moduleId: screenId, ...(params || {}) },
    });
  };

  const openSsoPath = (targetRoute: string, title: string) => {
    router.push({
      pathname: "/sso",
      params: {
        targetRoute,
        title,
        projectId: activeProject?.id || "",
      },
    });
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      {showHeader && <AppHeader />}

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadDashboard(true)}
            tintColor={iosColors.systemBlue}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {loading && !data ? (
          <SkeletonList count={4} />
        ) : errorMsg && !data ? (
          <EmptyState
            icon="cloud-offline-outline"
            title="Canlı Veri Alınamadı"
            subtitle={errorMsg}
            actionLabel="Tekrar Dene"
            onAction={() => loadDashboard(false)}
          />
        ) : (
          <>
            {/* Proje & Open-Meteo Canlı Hava Durumu Kartı */}
            <GlassCard style={styles.heroCard}>
              <View style={styles.heroTop}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.heroEyebrow}>
                    {data?.project
                      ? [data.project.district, data.project.city]
                          .filter(Boolean)
                          .join(", ") || "Aktif Çalışma Alanı"
                      : "Aktif Proje"}
                  </Text>
                  <Text style={styles.heroProjectTitle} numberOfLines={2}>
                    {data?.project?.name || activeProject?.name || "Atanmış Proje Bulunmuyor"}
                  </Text>
                </View>
                {data?.weather && (
                  <View style={styles.weatherPill}>
                    <Ionicons name={weatherMeta.icon} size={22} color="#FFB340" />
                    <View>
                      <Text style={styles.weatherTemp}>
                        {data.weather.temperature}°C
                      </Text>
                      <Text style={styles.weatherDesc} numberOfLines={1}>
                        {data.weather.description || weatherMeta.label}
                      </Text>
                    </View>
                  </View>
                )}
              </View>

              {data?.project && (
                <View style={styles.progressWrap}>
                  <View style={styles.progressLabelRow}>
                    <Text style={styles.progressLabel}>Genel İlerleme</Text>
                    <Text style={styles.progressValue}>{data.project.progress || 0}%</Text>
                  </View>
                  <View style={styles.progressTrack}>
                    <View
                      style={[
                        styles.progressFill,
                        { width: `${Math.min(100, Math.max(0, data.project.progress || 0))}%` },
                      ]}
                    />
                  </View>
                </View>
              )}

              {/* 3D BIM WebView Kısayolu */}
              {hasModule("bim_3d") && data?.project && (
                <TouchableOpacity
                  style={styles.bimBtn}
                  activeOpacity={0.8}
                  onPress={() => {
                    const target =
                      tenantType === "INSPECTION"
                        ? "/tr/inspection/bim"
                        : tenantType === "FRANCHISE"
                        ? "/tr/franchise/bim"
                        : `/tr/admin/projects/${data.project!.id}?tab=bim`;
                    openSsoPath(target, "3D BIM & X-Ray");
                  }}
                >
                  <Ionicons name="layers" size={17} color="#00E5FF" />
                  <Text style={styles.bimBtnText}>
                    3D BIM & X-Ray Görüntüleyiciyi Aç
                  </Text>
                  <Ionicons name="open-outline" size={15} color="#00E5FF" />
                </TouchableOpacity>
              )}
            </GlassCard>

            {/* Dinamik Metrik Kartları */}
            {visibleMetrics.length > 0 && (
              <View style={styles.metricsGrid}>
                {visibleMetrics.map((m) => (
                  <GlassCard key={m.key} style={styles.metricCard}>
                    <Text style={styles.metricTitle} numberOfLines={1}>
                      {m.title}
                    </Text>
                    <Text style={styles.metricVal} numberOfLines={1}>
                      {String(m.value)}
                    </Text>
                  </GlassCard>
                ))}
              </View>
            )}

            {/* Hızlı Yetkili Modül Kısayolları */}
            {quickModules.length > 0 && (
              <View style={styles.sectionBlock}>
                <View style={styles.sectionHeaderRow}>
                  <Text style={styles.sectionTitle}>Hızlı Erişim</Text>
                  <TouchableOpacity onPress={() => router.push("/(tabs)/modules")}>
                    <Text style={styles.sectionLink}>Tümünü Gör</Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.quickGrid}>
                  {quickModules.map((mod) => (
                    <TouchableOpacity
                      key={mod.id}
                      style={styles.quickCard}
                      activeOpacity={0.8}
                      onPress={() => {
                        if (mod.kind === "SSO" && mod.ssoPath) {
                          openSsoPath(
                            mod.ssoPath(tenantType, activeProject?.id),
                            mod.title
                          );
                        } else if (mod.screenId) {
                          openNativeScreen(mod.screenId, mod.screenParams);
                        }
                      }}
                    >
                      <View
                        style={[
                          styles.quickIconCircle,
                          { backgroundColor: `${mod.color}24` },
                        ]}
                      >
                        <Ionicons name={mod.icon} size={20} color={mod.color} />
                      </View>
                      <Text style={styles.quickLabel} numberOfLines={2}>
                        {mod.title}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {/* Bugünkü Mesai Durumu */}
            {hasModule("my_attendance_qr", "attendance") && (
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => openNativeScreen("attendance")}
              >
                <GlassCard style={styles.attendanceCard}>
                  <View style={styles.rowBetween}>
                    <View style={styles.rowGap10}>
                      <View style={[styles.smallIconBox, { backgroundColor: "rgba(52, 199, 89, 0.16)" }]}>
                        <Ionicons name="qr-code" size={18} color="#34C759" />
                      </View>
                      <View>
                        <Text style={styles.cardHeading}>Bugünkü Puantaj</Text>
                        <Text style={styles.cardSub}>
                          {data?.todayAttendance?.checkIn
                            ? `Giriş: ${new Date(data.todayAttendance.checkIn).toLocaleTimeString("tr-TR", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}`
                            : "Henüz giriş kaydı oluşturulmadı"}
                        </Text>
                      </View>
                    </View>
                    <StatusBadge
                      status={data?.todayAttendance?.checkIn ? "PRESENT" : "PENDING"}
                      label={data?.todayAttendance?.checkIn ? "MESAİDE" : "GİRİŞ YOK"}
                    />
                  </View>
                </GlassCard>
              </TouchableOpacity>
            )}

            {/* Açık Görevlerim */}
            {hasModule("tasks_work_orders") && (
              <View style={styles.sectionBlock}>
                <View style={styles.sectionHeaderRow}>
                  <Text style={styles.sectionTitle}>Bekleyen Görevler</Text>
                  <TouchableOpacity onPress={() => openNativeScreen("tasks")}>
                    <Text style={styles.sectionLink}>Görevlere Git</Text>
                  </TouchableOpacity>
                </View>
                {!data?.pendingTasks || data.pendingTasks.length === 0 ? (
                  <EmptyState
                    icon="checkmark-done-circle-outline"
                    title="Bekleyen Görev Yok"
                    subtitle="Seçili projede açık iş emri bulunmuyor."
                  />
                ) : (
                  <View style={{ gap: 10 }}>
                    {data.pendingTasks.map((t) => (
                      <TouchableOpacity
                        key={t.id}
                        activeOpacity={0.8}
                        onPress={() => openNativeScreen("tasks")}
                      >
                        <GlassCard style={styles.listItemCard}>
                          <View style={styles.rowBetween}>
                            <Text style={styles.listItemTitle} numberOfLines={1}>
                              {t.title}
                            </Text>
                            <StatusBadge status={t.status} />
                          </View>
                          {t.description ? (
                            <Text style={styles.listItemDesc} numberOfLines={2}>
                              {t.description}
                            </Text>
                          ) : null}
                        </GlassCard>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
            )}

            {/* Aktif Sevkiyatlar */}
            {hasModule("driver_deliveries", "logistics_appointments", "gate_security", "goods_receiving") &&
              data?.activeDeliveries &&
              data.activeDeliveries.length > 0 && (
                <View style={styles.sectionBlock}>
                  <View style={styles.sectionHeaderRow}>
                    <Text style={styles.sectionTitle}>Aktif Sevkiyatlar</Text>
                    <TouchableOpacity onPress={() => openNativeScreen("logistics")}>
                      <Text style={styles.sectionLink}>Lojistik</Text>
                    </TouchableOpacity>
                  </View>
                  <View style={{ gap: 8 }}>
                    {data.activeDeliveries.map((d) => (
                      <GlassCard key={d.id} style={styles.listItemCard}>
                        <View style={styles.rowBetween}>
                          <Text style={styles.listItemTitle} numberOfLines={1}>
                            {d.title || d.type || "Sevkiyat"} {d.vehiclePlate ? `• ${d.vehiclePlate}` : ""}
                          </Text>
                          <StatusBadge status={d.status} />
                        </View>
                        <Text style={styles.listItemDesc}>
                          Şoför: {d.driverName || "Belirtilmedi"}
                        </Text>
                      </GlassCard>
                    ))}
                  </View>
                </View>
              )}

            {/* Kurumsal Duyurular */}
            {data?.recentAnnouncements && data.recentAnnouncements.length > 0 && (
              <View style={styles.sectionBlock}>
                <Text style={styles.sectionTitle}>Kurumsal Duyurular</Text>
                <View style={{ gap: 8 }}>
                  {data.recentAnnouncements.map((ann) => (
                    <GlassCard key={ann.id} style={styles.listItemCard}>
                      <View style={styles.rowBetween}>
                        <Text style={styles.listItemTitle} numberOfLines={1}>
                          {ann.title}
                        </Text>
                        {ann.severity ? <StatusBadge status={ann.severity} /> : null}
                      </View>
                      <Text style={styles.listItemDesc} numberOfLines={3}>
                        {ann.content}
                      </Text>
                    </GlassCard>
                  ))}
                </View>
              </View>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: iosColors.background,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 110,
    gap: 16,
  },
  heroCard: {
    backgroundColor: "rgba(10, 122, 255, 0.08)",
    borderColor: "rgba(10, 122, 255, 0.25)",
    gap: 14,
  },
  heroTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
  },
  heroEyebrow: {
    fontSize: 11,
    fontWeight: "700",
    color: "#58A6FF",
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  heroProjectTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#FFFFFF",
    marginTop: 3,
  },
  weatherPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(255, 255, 255, 0.06)",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  weatherTemp: {
    fontSize: 15,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  weatherDesc: {
    fontSize: 10,
    color: iosColors.labelMuted,
    maxWidth: 92,
  },
  progressWrap: {
    gap: 6,
  },
  progressLabelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  progressLabel: {
    fontSize: 11,
    color: iosColors.labelMuted,
    fontWeight: "600",
  },
  progressValue: {
    fontSize: 12,
    color: "#34C759",
    fontWeight: "800",
  },
  progressTrack: {
    height: 7,
    borderRadius: 4,
    backgroundColor: "rgba(255,255,255,0.08)",
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#34C759",
    borderRadius: 4,
  },
  bimBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "rgba(0, 199, 190, 0.14)",
    borderWidth: 1,
    borderColor: "rgba(0, 199, 190, 0.35)",
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  bimBtnText: {
    color: "#5CE1E6",
    fontSize: 12,
    fontWeight: "800",
  },
  metricsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  metricCard: {
    width: "48%",
    gap: 4,
  },
  metricTitle: {
    fontSize: 11,
    color: iosColors.labelMuted,
    fontWeight: "600",
  },
  metricVal: {
    fontSize: 19,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  sectionBlock: {
    gap: 10,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  sectionLink: {
    fontSize: 12,
    fontWeight: "700",
    color: iosColors.systemBlue,
  },
  quickGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  quickCard: {
    width: "48%",
    backgroundColor: iosColors.glassCard,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: iosColors.glassBorder,
    padding: 13,
    gap: 8,
  },
  quickIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },
  quickLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#FFFFFF",
    lineHeight: 16,
  },
  attendanceCard: {
    padding: 14,
  },
  rowBetween: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  rowGap10: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  smallIconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  cardHeading: {
    fontSize: 14,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  cardSub: {
    fontSize: 11,
    color: iosColors.labelMuted,
    marginTop: 2,
  },
  listItemCard: {
    gap: 6,
  },
  listItemTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  listItemDesc: {
    fontSize: 12,
    color: iosColors.labelMuted,
    lineHeight: 17,
  },
});

