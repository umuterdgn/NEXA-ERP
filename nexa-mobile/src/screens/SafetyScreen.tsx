/**
 * © 2026 NXA Software. All rights reserved.
 * Nexa ERP Mobil - İSG Radar, Kırmızı SOS Acil Durum Sireni & Ramak Kala Bildirimi (GET/POST /api/mobile/isg)
 */

import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useAuth } from "../context/AuthContext";
import { extractErrorMessage, mobileApi } from "../services/apiClient";
import { getCurrentGpsFix } from "../services/locationTracker";
import { captureAndResolvePhotoUrl } from "../services/mediaHelper";
import {
  AppHeader,
  EmptyState,
  GlassCard,
  ScreenHeader,
  SkeletonList,
  StatusBadge,
} from "../components/ui/NexaUI";
import { iosColors } from "../theme/iosTheme";
import type { IsgResponse } from "../types/api";

export default function SafetyScreen({
  initialTab = "near_miss",
  embeddedInTab = false,
}: {
  initialTab?: "near_miss" | "sos";
  embeddedInTab?: boolean;
}) {
  const { activeProject, hasModule } = useAuth();
  const canSos = hasModule("sos_alarm", "isg_dashboard");
  const canNearMiss = hasModule("near_miss", "isg_dashboard");

  const [sectionTab, setSectionTab] = useState<"near_miss" | "sos">(
    initialTab === "sos" && canSos ? "sos" : "near_miss"
  );
  const [data, setData] = useState<IsgResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // SOS basılı tutma (2 saniye) state
  const [holdingSos, setHoldingSos] = useState(false);
  const [sendingSos, setSendingSos] = useState(false);
  const sosTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Ramak Kala Modalı
  const [showNearMissModal, setShowNearMissModal] = useState(false);
  const [title, setTitle] = useState("");
  const [location, setLocation] = useState("");
  const [severity, setSeverity] = useState<"LOW" | "MEDIUM" | "HIGH" | "CRITICAL">(
    "MEDIUM"
  );
  const [description, setDescription] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [imageUrl, setImageUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const loadIsg = useCallback(
    async (isRefresh = false) => {
      try {
        if (isRefresh) setRefreshing(true);
        else setLoading(true);
        const res = await mobileApi.isg.get(activeProject?.id);
        setData(res);
      } catch (err: any) {
        Alert.alert("İSG Verileri Alınamadı", extractErrorMessage(err));
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [activeProject?.id]
  );

  useEffect(() => {
    loadIsg(false);
    return () => {
      if (sosTimerRef.current) clearTimeout(sosTimerRef.current);
    };
  }, [loadIsg]);

  const executeSosAlert = async () => {
    setHoldingSos(false);
    setSendingSos(true);
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(
        () => {}
      );
      const gps = await getCurrentGpsFix();
      const res = await mobileApi.isg.triggerSos({
        lat: gps?.latitude,
        lng: gps?.longitude,
        projectId: activeProject?.id,
      });
      Alert.alert(
        "ACİL DURUM SOS İLETİLDİ",
        res.message ||
          "Canlı konumunuz İSG uzmanına ve proje yöneticisine acil alarm olarak gönderildi."
      );
      await loadIsg(true);
    } catch (err: any) {
      Alert.alert("SOS Gönderilemedi", extractErrorMessage(err));
    } finally {
      setSendingSos(false);
    }
  };

  const handleSosPressIn = () => {
    if (!canSos || sendingSos) return;
    setHoldingSos(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {});
    if (sosTimerRef.current) clearTimeout(sosTimerRef.current);
    sosTimerRef.current = setTimeout(() => {
      executeSosAlert();
    }, 2000);
  };

  const handleSosPressOut = () => {
    if (sosTimerRef.current) {
      clearTimeout(sosTimerRef.current);
      sosTimerRef.current = null;
    }
    setHoldingSos(false);
  };

  const handleCapturePhoto = async (source: "camera" | "gallery") => {
    const res = await captureAndResolvePhotoUrl({
      source,
      sourceModule: "ISG_NEAR_MISS",
      projectId: activeProject?.id,
    });
    if (res?.photoUrl) setImageUrl(res.photoUrl);
  };

  const handleCreateNearMiss = async () => {
    if (!title.trim() || !location.trim() || !description.trim()) {
      Alert.alert("Eksik Bilgi", "Başlık, konum ve tehlike açıklaması zorunludur.");
      return;
    }
    setSubmitting(true);
    try {
      const gps = await getCurrentGpsFix();
      const res = await mobileApi.isg.reportNearMiss({
        projectId: activeProject?.id,
        title: title.trim(),
        location: location.trim(),
        severity,
        description: description.trim(),
        imageUrl: imageUrl || undefined,
        isAnonymous,
        lat: gps?.latitude,
        lng: gps?.longitude,
        latitude: gps?.latitude,
        longitude: gps?.longitude,
      });
      Alert.alert("Bildirim Alındı", res.message || "Ramak kala kaydınız açıldı.");
      setShowNearMissModal(false);
      setTitle("");
      setLocation("");
      setDescription("");
      setImageUrl("");
      setIsAnonymous(false);
      await loadIsg(true);
    } catch (err: any) {
      Alert.alert("Bildirim Gönderilemedi", extractErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const activeSosAlerts = data?.activeSosAlerts || [];
  const nearMisses = data?.nearMisses || [];

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      {embeddedInTab ? (
        <AppHeader title="İSG & Acil Durum" />
      ) : (
        <ScreenHeader
          title="İSG Radar & SOS"
          subtitle={activeProject?.name || "İş Sağlığı ve Güvenliği"}
        />
      )}

      <View style={styles.topControls}>
        <View style={styles.tabRow}>
          <TouchableOpacity
            style={[
              styles.tabPill,
              sectionTab === "near_miss" && styles.tabPillActive,
            ]}
            onPress={() => setSectionTab("near_miss")}
          >
            <Text
              style={[
                styles.tabText,
                sectionTab === "near_miss" && styles.tabTextActive,
              ]}
            >
              Ramak Kala ({nearMisses.length})
            </Text>
          </TouchableOpacity>

          {canSos && (
            <TouchableOpacity
              style={[
                styles.tabPill,
                sectionTab === "sos" && styles.tabPillSosActive,
              ]}
              onPress={() => setSectionTab("sos")}
            >
              <Text
                style={[
                  styles.tabText,
                  sectionTab === "sos" && { color: "#FF453A" },
                ]}
              >
                Acil SOS ({activeSosAlerts.length})
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadIsg(true)}
            tintColor="#0A7AFF"
          />
        }
      >
        {/* Aktif SOS Banner */}
        {activeSosAlerts.length > 0 && (
          <GlassCard style={styles.alertBanner}>
            <View style={styles.alertHeader}>
              <Ionicons name="warning" size={20} color="#FF453A" />
              <Text style={styles.alertTitle}>
                AKTİF ACİL DURUM ALARMI ({activeSosAlerts.length})
              </Text>
            </View>
            {activeSosAlerts.map((sos) => (
              <View key={sos.id} style={styles.sosItem}>
                <Text style={styles.sosName}>
                  {sos.userName || "Saha Personeli"} •{" "}
                  {sos.userPhone || "Telefon Yok"}
                </Text>
                <Text style={styles.sosMeta}>
                  {sos.latitude != null && sos.longitude != null
                    ? `GPS: ${sos.latitude.toFixed(5)}, ${sos.longitude.toFixed(5)}`
                    : "GPS bekleniyor"}{" "}
                  •{" "}
                  {new Date(sos.createdAt).toLocaleTimeString("tr-TR", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </Text>
              </View>
            ))}
          </GlassCard>
        )}

        {sectionTab === "sos" && canSos && (
          <GlassCard style={styles.sosPanel}>
            <Text style={styles.sosEyebrow}>ACİL DURUM MÜDAHALE</Text>
            <Text style={styles.sosHeading}>Kırmızı SOS Alarmı</Text>
            <Text style={styles.sosDesc}>
              İş kazası, göçük veya hayati tehlike durumunda aşağıdaki butona 2
              saniye basılı tutun. GPS koordinatınız anında tüm yetkililere
              iletilir.
            </Text>

            <TouchableOpacity
              style={[
                styles.sosButton,
                holdingSos && styles.sosButtonHolding,
              ]}
              onPressIn={handleSosPressIn}
              onPressOut={handleSosPressOut}
              activeOpacity={0.9}
              disabled={sendingSos}
            >
              {sendingSos ? (
                <ActivityIndicator color="#FFFFFF" size="large" />
              ) : (
                <>
                  <Ionicons name="medkit" size={44} color="#FFFFFF" />
                  <Text style={styles.sosButtonLabel}>
                    {holdingSos ? "GÖNDERİLİYOR..." : "SOS (2 SN BASILI TUT)"}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </GlassCard>
        )}

        {canNearMiss && (
          <TouchableOpacity
            style={styles.reportBtn}
            onPress={() => setShowNearMissModal(true)}
            activeOpacity={0.85}
          >
            <Ionicons name="alert-circle" size={18} color="#FFFFFF" />
            <Text style={styles.reportBtnTxt}>Yeni Ramak Kala / İSG Tehlikesi Bildir</Text>
          </TouchableOpacity>
        )}

        <Text style={styles.sectionTitle}>SON RAMAK KALA & OLAY KAYITLARI</Text>

        {loading ? (
          <SkeletonList count={3} />
        ) : nearMisses.length === 0 ? (
          <EmptyState
            icon="shield-checkmark-outline"
            title="Açık Ramak Kala Kaydı Yok"
            subtitle="Şantiyede raporlanmış ramak kala veya güvensiz durum bulunmuyor."
          />
        ) : (
          nearMisses.map((nm) => (
            <GlassCard key={nm.id} style={styles.card}>
              <View style={styles.rowBetween}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardTitle}>{nm.title}</Text>
                  <Text style={styles.cardSub}>
                    {nm.location} •{" "}
                    {new Date(nm.incidentDate).toLocaleDateString("tr-TR")}
                  </Text>
                </View>
                <View style={{ alignItems: "flex-end", gap: 4 }}>
                  <StatusBadge status={nm.severity} />
                  <StatusBadge status={nm.status} />
                </View>
              </View>
              <Text style={styles.cardBody}>{nm.description}</Text>
              {nm.imageUrl ? (
                <Image
                  source={{ uri: nm.imageUrl }}
                  style={styles.thumbImg}
                  resizeMode="cover"
                />
              ) : null}
            </GlassCard>
          ))
        )}
      </ScrollView>

      {/* Ramak Kala Modalı */}
      <Modal
        visible={showNearMissModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowNearMissModal(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.rowBetween}>
              <Text style={styles.modalTitle}>Ramak Kala Bildirimi</Text>
              <TouchableOpacity onPress={() => setShowNearMissModal(false)}>
                <Ionicons name="close" size={22} color="#8E8E93" />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={{ gap: 12 }}>
              <Text style={styles.label}>Başlık</Text>
              <TextInput
                style={styles.input}
                value={title}
                onChangeText={setTitle}
                placeholder="Örn: B Blok 3. Kat Korkuluk Eksikliği"
                placeholderTextColor="#6E6E73"
              />

              <Text style={styles.label}>Konum / Blok / Kat</Text>
              <TextInput
                style={styles.input}
                value={location}
                onChangeText={setLocation}
                placeholder="Örn: A Blok İskele Çevresi"
                placeholderTextColor="#6E6E73"
              />

              <Text style={styles.label}>Risk Seviyesi</Text>
              <View style={styles.chipRow}>
                {(["LOW", "MEDIUM", "HIGH", "CRITICAL"] as const).map((lvl) => (
                  <TouchableOpacity
                    key={lvl}
                    style={[styles.chip, severity === lvl && styles.chipActive]}
                    onPress={() => setSeverity(lvl)}
                  >
                    <Text
                      style={[
                        styles.chipTxt,
                        severity === lvl && { color: "#FFFFFF" },
                      ]}
                    >
                      {lvl === "LOW"
                        ? "Düşük"
                        : lvl === "MEDIUM"
                        ? "Orta"
                        : lvl === "HIGH"
                        ? "Yüksek"
                        : "Kritik"}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.anonRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.anonTitle}>Anonim İSG Bildirimi</Text>
                  <Text style={styles.anonSub}>
                    Kimliğiniz diğer saha personeline gizli tutulur.
                  </Text>
                </View>
                <Switch
                  value={isAnonymous}
                  onValueChange={setIsAnonymous}
                  trackColor={{ false: "#334155", true: "#0A7AFF" }}
                  thumbColor="#FFFFFF"
                />
              </View>

              <Text style={styles.label}>Tehlike Fotoğrafı (Opsiyonel)</Text>
              <View style={styles.row2}>
                <TouchableOpacity
                  style={styles.photoBtn}
                  onPress={() => handleCapturePhoto("camera")}
                >
                  <Ionicons name="camera" size={18} color="#0A7AFF" />
                  <Text style={styles.photoBtnTxt}>Kamera</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.photoBtn}
                  onPress={() => handleCapturePhoto("gallery")}
                >
                  <Ionicons name="image" size={18} color="#34C759" />
                  <Text style={[styles.photoBtnTxt, { color: "#34C759" }]}>
                    Galeri
                  </Text>
                </TouchableOpacity>
              </View>
              {imageUrl ? (
                <Image
                  source={{ uri: imageUrl }}
                  style={styles.thumbImg}
                  resizeMode="cover"
                />
              ) : null}

              <Text style={styles.label}>Açıklama</Text>
              <TextInput
                style={[styles.input, { minHeight: 76, textAlignVertical: "top" }]}
                value={description}
                onChangeText={setDescription}
                multiline
                placeholder="Gözlemlenen tehlikeyi ve alınması gereken önlemi yazın..."
                placeholderTextColor="#6E6E73"
              />
            </ScrollView>

            <TouchableOpacity
              style={[styles.submitBtn, submitting && { opacity: 0.65 }]}
              onPress={handleCreateNearMiss}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.submitBtnTxt}>Bildirimi Kaydet</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: iosColors.background },
  topControls: { paddingHorizontal: 16, paddingTop: 10 },
  tabRow: { flexDirection: "row", gap: 8 },
  tabPill: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
  },
  tabPillActive: {
    backgroundColor: "rgba(255,149,0,0.18)",
    borderColor: "#FF9500",
  },
  tabPillSosActive: {
    backgroundColor: "rgba(255,59,48,0.18)",
    borderColor: "#FF3B30",
  },
  tabText: { color: "#8E8E93", fontSize: 12, fontWeight: "700" },
  tabTextActive: { color: "#FFFFFF" },
  scroll: { padding: 16, paddingBottom: 120, gap: 12 },
  alertBanner: {
    backgroundColor: "rgba(255,59,48,0.15)",
    borderColor: "rgba(255,59,48,0.45)",
    gap: 8,
  },
  alertHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
  alertTitle: { color: "#FF453A", fontSize: 13, fontWeight: "800" },
  sosItem: {
    backgroundColor: "rgba(0,0,0,0.25)",
    padding: 10,
    borderRadius: 10,
  },
  sosName: { color: "#FFFFFF", fontSize: 13, fontWeight: "700" },
  sosMeta: { color: "rgba(255,255,255,0.75)", fontSize: 12, marginTop: 2 },
  sosPanel: { alignItems: "center", gap: 10, paddingVertical: 20 },
  sosEyebrow: {
    color: "#FF453A",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1,
  },
  sosHeading: { color: "#FFFFFF", fontSize: 20, fontWeight: "800" },
  sosDesc: {
    color: "rgba(235,235,245,0.72)",
    fontSize: 13,
    textAlign: "center",
    lineHeight: 19,
  },
  sosButton: {
    marginTop: 8,
    width: 170,
    height: 170,
    borderRadius: 85,
    backgroundColor: "#FF3B30",
    borderWidth: 6,
    borderColor: "rgba(255,59,48,0.38)",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  sosButtonHolding: {
    transform: [{ scale: 0.94 }],
    backgroundColor: "#DC2626",
    borderColor: "#FFFFFF",
  },
  sosButtonLabel: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "900",
    textAlign: "center",
    paddingHorizontal: 10,
  },
  reportBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#FF9500",
    borderRadius: 12,
    paddingVertical: 13,
  },
  reportBtnTxt: { color: "#FFFFFF", fontSize: 14, fontWeight: "800" },
  sectionTitle: {
    color: "#8E8E93",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.7,
    marginTop: 4,
  },
  card: { gap: 8 },
  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 8,
  },
  cardTitle: { color: "#FFFFFF", fontSize: 15, fontWeight: "700" },
  cardSub: { color: "#8E8E93", fontSize: 12, marginTop: 2 },
  cardBody: { color: "rgba(235,235,245,0.8)", fontSize: 13, lineHeight: 18 },
  thumbImg: { width: "100%", height: 135, borderRadius: 10 },
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
    maxHeight: "90%",
    gap: 14,
  },
  modalTitle: { color: "#FFFFFF", fontSize: 18, fontWeight: "800" },
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
  chipRow: { flexDirection: "row", gap: 6 },
  chip: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.06)",
    alignItems: "center",
  },
  chipActive: { backgroundColor: "#0A7AFF" },
  chipTxt: { color: "#98A2B3", fontSize: 12, fontWeight: "700" },
  anonRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.04)",
    padding: 12,
    borderRadius: 12,
    gap: 10,
  },
  anonTitle: { color: "#FFFFFF", fontSize: 13, fontWeight: "700" },
  anonSub: { color: "#8E8E93", fontSize: 11, marginTop: 2 },
  row2: { flexDirection: "row", gap: 10 },
  photoBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 11,
    borderRadius: 12,
    backgroundColor: "rgba(10,122,255,0.12)",
    borderWidth: 1,
    borderColor: "rgba(10,122,255,0.3)",
  },
  photoBtnTxt: { color: "#3B9EFF", fontSize: 13, fontWeight: "700" },
  submitBtn: {
    backgroundColor: "#FF9500",
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
  },
  submitBtnTxt: { color: "#FFFFFF", fontSize: 15, fontWeight: "800" },
});
