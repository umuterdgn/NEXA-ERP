/**
 * © 2026 NXA Software. All rights reserved.
 * Nexa ERP Mobil - Canlı QR / GPS / NFC Puantaj & Mesai Takibi (GET/POST /api/mobile/attendance)
 */

import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
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
import { getCurrentGpsFix } from "../services/locationTracker";
import { checkNfcAvailability, type NfcCheckResult } from "../services/nfcHelper";
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
import type { AttendanceRecordItem } from "../types/api";

export default function AttendanceScreen({
  embeddedInTab = false,
}: {
  embeddedInTab?: boolean;
}) {
  const { activeProject, geofenceStatus, assignedProjects, setActiveProject } = useAuth();
  const [records, setRecords] = useState<AttendanceRecordItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showQrScanner, setShowQrScanner] = useState(false);
  const [nfcInfo, setNfcInfo] = useState<NfcCheckResult>({ supported: false });

  const loadAttendance = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      const res = await mobileApi.attendance.list();
      setRecords(res.records || []);
    } catch (err: any) {
      Alert.alert("Puantaj Alınamadı", extractErrorMessage(err));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadAttendance(false);
    checkNfcAvailability().then(setNfcInfo).catch(() => {});
  }, [loadAttendance]);

  const submitAttendanceToggle = async (targetProjectId?: string) => {
    setSubmitting(true);
    try {
      const gps = await getCurrentGpsFix();
      const res = await mobileApi.attendance.toggle({
        lat: gps?.latitude,
        lng: gps?.longitude,
        latitude: gps?.latitude,
        longitude: gps?.longitude,
        projectId: targetProjectId || activeProject?.id,
      });

      if (res.offlineQueued) {
        Alert.alert(
          "Çevrimdışı Kuyruğa Eklendi",
          "İnternet bağlantısı sağlandığında mesai kaydınız otomatik senkronize edilecektir."
        );
      } else {
        Alert.alert("Mesai Kaydı", res.message || "Puantaj kaydınız işlendi.");
        await loadAttendance(true);
      }
    } catch (err: any) {
      Alert.alert("Mesai İşlenemedi", extractErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleQrScanned = async (rawData: string) => {
    setShowQrScanner(false);
    const cleaned = rawData.trim();
    // Eğer QR kodu içinde atanmış bir proje ID'si veya slug'ı varsa o projeyi eşle
    const matchedProject = assignedProjects.find(
      (p) =>
        cleaned.includes(p.id) ||
        cleaned.toLowerCase().includes(p.name.toLowerCase())
    );
    if (matchedProject && matchedProject.id !== activeProject?.id) {
      await setActiveProject(matchedProject);
    }
    await submitAttendanceToggle(matchedProject?.id || activeProject?.id);
  };

  const todayIso = new Date().toISOString().slice(0, 10);
  const todayRecord = records.find((r) => String(r.date).slice(0, 10) === todayIso);
  const isCheckedIn = Boolean(todayRecord?.checkIn && !todayRecord?.checkOut);
  const isCompletedToday = Boolean(todayRecord?.checkIn && todayRecord?.checkOut);

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      {embeddedInTab ? (
        <AppHeader title="Canlı Puantaj & Mesai" />
      ) : (
        <ScreenHeader
          title="QR & GPS Puantaj"
          subtitle={activeProject?.name || "Günlük Giriş / Çıkış Doğrulama"}
        />
      )}

      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadAttendance(true)}
            tintColor="#0A7AFF"
          />
        }
      >
        {/* Bugünkü Durum ve Hızlı Eylem Kartı */}
        <GlassCard style={styles.heroCard}>
          <View style={styles.heroTopRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.heroEyebrow}>BUGÜNKÜ MESAİ DURUMU</Text>
              <Text style={styles.heroStatus}>
                {isCompletedToday
                  ? "Mesai Tamamlandı"
                  : isCheckedIn
                  ? "Şantiyede / Mesai Aktif"
                  : "Henüz Giriş Yapılmadı"}
              </Text>
            </View>
            <StatusBadge
              status={
                isCompletedToday
                  ? "COMPLETED"
                  : isCheckedIn
                  ? "PRESENT"
                  : "PENDING"
              }
              label={
                isCompletedToday
                  ? "ÇIKIŞ YAPILDI"
                  : isCheckedIn
                  ? "MESAİDE"
                  : "BEKLİYOR"
              }
            />
          </View>

          <View style={styles.timeGrid}>
            <View style={styles.timeBox}>
              <Text style={styles.timeLabel}>Giriş Saati</Text>
              <Text style={styles.timeValue}>
                {todayRecord?.checkIn
                  ? new Date(todayRecord.checkIn).toLocaleTimeString("tr-TR", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  : "--:--"}
              </Text>
            </View>
            <View style={styles.timeBox}>
              <Text style={styles.timeLabel}>Çıkış Saati</Text>
              <Text style={styles.timeValue}>
                {todayRecord?.checkOut
                  ? new Date(todayRecord.checkOut).toLocaleTimeString("tr-TR", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  : "--:--"}
              </Text>
            </View>
            <View style={styles.timeBox}>
              <Text style={styles.timeLabel}>Bölge / Geofence</Text>
              <Text
                style={[
                  styles.timeValue,
                  {
                    fontSize: 13,
                    color:
                      geofenceStatus?.isInside === false ? "#FF9F0A" : "#34C759",
                  },
                ]}
              >
                {geofenceStatus?.isInside === false
                  ? `Dışarıda (${geofenceStatus.distanceMeters}m)`
                  : "Saha İçinde"}
              </Text>
            </View>
          </View>

          <View style={styles.actionRow}>
            <TouchableOpacity
              style={[
                styles.primaryActionBtn,
                isCheckedIn && { backgroundColor: "#FF9500" },
                isCompletedToday && { backgroundColor: "rgba(255,255,255,0.12)" },
              ]}
              onPress={() => submitAttendanceToggle()}
              disabled={submitting || isCompletedToday}
              activeOpacity={0.85}
            >
              {submitting ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <>
                  <Ionicons
                    name={isCheckedIn ? "log-out-outline" : "location-outline"}
                    size={19}
                    color="#FFFFFF"
                  />
                  <Text style={styles.primaryActionText}>
                    {isCompletedToday
                      ? "Bugün Tamamlandı"
                      : isCheckedIn
                      ? "GPS ile Mesai Çıkışı"
                      : "GPS ile Mesai Girişi"}
                  </Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.qrBtn}
              onPress={() => setShowQrScanner(true)}
              disabled={submitting || isCompletedToday}
              activeOpacity={0.85}
            >
              <Ionicons name="qr-code-outline" size={20} color="#0A7AFF" />
              <Text style={styles.qrBtnText}>QR Okut</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.nfcBanner}>
            <Ionicons
              name={nfcInfo.supported ? "radio-outline" : "shield-checkmark-outline"}
              size={14}
              color={nfcInfo.supported ? "#34C759" : "#8E8E93"}
            />
            <Text style={styles.nfcText}>
              {nfcInfo.supported
                ? "Cihaz NFC kart okuyucu aktif — QR veya NFC kapı turnikesi kullanılabilir."
                : nfcInfo.reason || "Expo Go güvenli mod: QR ve GPS doğrulaması aktif."}
            </Text>
          </View>
        </GlassCard>

        <Text style={styles.sectionTitle}>SON 30 GÜN PUANTAJ GEÇMİŞİ</Text>

        {loading ? (
          <SkeletonList count={4} />
        ) : records.length === 0 ? (
          <EmptyState
            icon="calendar-outline"
            title="Puantaj Kaydı Bulunmuyor"
            subtitle="İlk mesai girişinizi yukarıdaki GPS veya QR okuma butonlarıyla yapabilirsiniz."
          />
        ) : (
          records.map((rec) => (
            <GlassCard key={rec.id} style={styles.recordCard}>
              <View style={styles.recordRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.recordDate}>
                    {new Date(rec.date).toLocaleDateString("tr-TR", {
                      weekday: "short",
                      day: "2-digit",
                      month: "long",
                      year: "numeric",
                    })}
                  </Text>
                  <Text style={styles.recordSub}>
                    {rec.project || activeProject?.name || "Saha"} •{" "}
                    {rec.method || "GPS/QR"}
                  </Text>
                </View>
                <StatusBadge status={rec.status} />
              </View>
              <View style={styles.recordTimes}>
                <Text style={styles.recordTimeTxt}>
                  Giriş:{" "}
                  {rec.checkIn
                    ? new Date(rec.checkIn).toLocaleTimeString("tr-TR", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : "-"}
                </Text>
                <Text style={styles.recordTimeTxt}>
                  Çıkış:{" "}
                  {rec.checkOut
                    ? new Date(rec.checkOut).toLocaleTimeString("tr-TR", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : "-"}
                </Text>
              </View>
            </GlassCard>
          ))
        )}
      </ScrollView>

      <Modal
        visible={showQrScanner}
        animationType="slide"
        onRequestClose={() => setShowQrScanner(false)}
      >
        <QRScanner
          title="Şantiye Kapı / Turnike QR"
          subtitle="Proje girişindeki puantaj QR kodunu kamera çerçevesine ortalayın"
          onScan={handleQrScanned}
          onClose={() => setShowQrScanner(false)}
        />
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: iosColors.background,
  },
  scroll: {
    padding: 16,
    paddingBottom: 120,
    gap: 12,
  },
  heroCard: {
    gap: 14,
  },
  heroTopRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 10,
  },
  heroEyebrow: {
    color: "#8E8E93",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.7,
  },
  heroStatus: {
    color: "#FFFFFF",
    fontSize: 19,
    fontWeight: "800",
    marginTop: 4,
  },
  timeGrid: {
    flexDirection: "row",
    gap: 8,
  },
  timeBox: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    borderRadius: 12,
    padding: 10,
  },
  timeLabel: {
    color: "#8E8E93",
    fontSize: 11,
    fontWeight: "600",
  },
  timeValue: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
    marginTop: 4,
  },
  actionRow: {
    flexDirection: "row",
    gap: 10,
  },
  primaryActionBtn: {
    flex: 1,
    backgroundColor: "#0A7AFF",
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  primaryActionText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
  qrBtn: {
    backgroundColor: "rgba(10,122,255,0.14)",
    borderWidth: 1,
    borderColor: "rgba(10,122,255,0.35)",
    borderRadius: 14,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  qrBtnText: {
    color: "#3B9EFF",
    fontSize: 14,
    fontWeight: "700",
  },
  nfcBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(255,255,255,0.03)",
    borderRadius: 10,
    padding: 10,
  },
  nfcText: {
    flex: 1,
    color: "rgba(235,235,245,0.65)",
    fontSize: 12,
    lineHeight: 16,
  },
  sectionTitle: {
    color: "#8E8E93",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.7,
    marginTop: 6,
  },
  recordCard: {
    gap: 8,
  },
  recordRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  recordDate: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
  recordSub: {
    color: "#8E8E93",
    fontSize: 12,
    marginTop: 2,
  },
  recordTimes: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.07)",
    paddingTop: 8,
  },
  recordTimeTxt: {
    color: "rgba(235,235,245,0.82)",
    fontSize: 13,
    fontWeight: "600",
  },
});
