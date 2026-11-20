/**
 * © 2026 NXA Software. All rights reserved.
 * Nexa ERP Mobil - Karot & Beton Numune QR Takip Zinciri (GET/POST/PATCH /api/mobile/samples)
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
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../context/AuthContext";
import { extractErrorMessage, mobileApi } from "../services/apiClient";
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
import type { CoreSampleItem } from "../types/api";

export default function SamplesScreen({
  embeddedInTab = false,
}: {
  embeddedInTab?: boolean;
}) {
  const { activeProject } = useAuth();
  const [samples, setSamples] = useState<CoreSampleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [showScanner, setShowScanner] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [qrCode, setQrCode] = useState("");
  const [location, setLocation] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Kırım Sonucu Modalı
  const [editTarget, setEditTarget] = useState<CoreSampleItem | null>(null);
  const [strengthInput, setStrengthInput] = useState("");
  const [nextStatus, setNextStatus] = useState("PASSED");
  const [updating, setUpdating] = useState(false);

  const loadSamples = useCallback(
    async (isRefresh = false) => {
      try {
        if (isRefresh) setRefreshing(true);
        else setLoading(true);
        const res = await mobileApi.samples.list({
          projectId: activeProject?.id,
        });
        setSamples(res.samples || []);
      } catch (err: any) {
        Alert.alert("Numuneler Alınamadı", extractErrorMessage(err));
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [activeProject?.id]
  );

  useEffect(() => {
    loadSamples(false);
  }, [loadSamples]);

  const handleQrScanned = (scannedData: string) => {
    const existing = samples.find(
      (s) => s.qrCode.toLowerCase() === scannedData.trim().toLowerCase()
    );
    if (existing) {
      setEditTarget(existing);
      setStrengthInput(
        existing.strengthResult != null ? String(existing.strengthResult) : ""
      );
      setNextStatus(existing.status === "WAITING_TEST" ? "IN_LAB" : existing.status);
    } else {
      setQrCode(scannedData.trim());
      setLocation("Mikser Başı / Saha Numunesi");
      setShowCreateModal(true);
    }
  };

  const handleCreateSample = async () => {
    if (!location.trim()) {
      Alert.alert("Eksik Bilgi", "Numunenin alındığı lokasyon zorunludur.");
      return;
    }
    try {
      setSubmitting(true);
      const res = await mobileApi.samples.create({
        projectId: activeProject?.id,
        qrCode: qrCode.trim() || undefined,
        location: location.trim(),
      });
      setShowCreateModal(false);
      setQrCode("");
      setLocation("");
      if (!res.offlineQueued) await loadSamples(true);
      Alert.alert("Numune Kaydedildi", res.message || "QR numune eklendi.");
    } catch (err: any) {
      Alert.alert("Hata", extractErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateSample = async () => {
    if (!editTarget) return;
    try {
      setUpdating(true);
      const val = strengthInput.trim() ? Number(strengthInput) : undefined;
      const res = await mobileApi.samples.update({
        id: editTarget.id,
        status: val != null ? undefined : nextStatus,
        strengthResult: val,
      });
      setEditTarget(null);
      if (!res.offlineQueued) await loadSamples(true);
      Alert.alert("Güncellendi", res.message || "Numune durumu güncellendi.");
    } catch (err: any) {
      Alert.alert("Hata", extractErrorMessage(err));
    } finally {
      setUpdating(false);
    }
  };

  if (showScanner) {
    return (
      <QRScanner
        title="Karot / Numune QR Tarayıcı"
        subtitle="Numune tüpü veya laboratuvar karekodunu okutun"
        onScan={handleQrScanned}
        onClose={() => setShowScanner(false)}
      />
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      {embeddedInTab ? (
        <AppHeader title="Karot & Numune QR" />
      ) : (
        <ScreenHeader
          title="Karot & Beton Numuneleri"
          subtitle={activeProject?.name || "QR Takip & Lab Kırım Sonuçları"}
        />
      )}

      <View style={styles.actionsBar}>
        <TouchableOpacity
          style={[styles.topBtn, { backgroundColor: "#30B0C7" }]}
          onPress={() => setShowScanner(true)}
        >
          <Ionicons name="qr-code" size={18} color="#FFFFFF" />
          <Text style={styles.topBtnText}>QR Okut / Kabul</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.topBtn, { backgroundColor: iosColors.systemBlue }]}
          onPress={() => {
            setQrCode("");
            setLocation("");
            setShowCreateModal(true);
          }}
        >
          <Ionicons name="add-circle" size={18} color="#FFFFFF" />
          <Text style={styles.topBtnText}>Yeni Numune</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadSamples(true)}
            tintColor={iosColors.systemBlue}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <SkeletonList count={3} />
        ) : samples.length === 0 ? (
          <EmptyState
            icon="flask-outline"
            title="Kayıtlı Numune Yok"
            subtitle="QR okutarak veya manuel yeni taze beton / karot numunesi ekleyin."
            actionLabel="Numune Ekle"
            onAction={() => setShowCreateModal(true)}
          />
        ) : (
          samples.map((s) => (
            <TouchableOpacity
              key={s.id}
              activeOpacity={0.82}
              onPress={() => {
                setEditTarget(s);
                setStrengthInput(
                  s.strengthResult != null ? String(s.strengthResult) : ""
                );
                setNextStatus(s.status === "WAITING_TEST" ? "IN_LAB" : s.status);
              }}
            >
              <GlassCard style={styles.card}>
                <View style={styles.rowBetween}>
                  <Text style={styles.qrTitle}>QR: {s.qrCode}</Text>
                  <StatusBadge status={s.status} />
                </View>
                <Text style={styles.locText}>{s.location}</Text>
                <View style={styles.rowBetween}>
                  <Text style={styles.metaText}>
                    {s.project || activeProject?.name || "Proje"}
                  </Text>
                  <Text style={styles.strengthText}>
                    {s.strengthResult != null
                      ? `${s.strengthResult} MPa`
                      : "Kırım Bekliyor"}
                  </Text>
                </View>
              </GlassCard>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      {/* YENİ NUMUNE MODALI */}
      <Modal
        visible={showCreateModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCreateModal(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalSheet}>
            <View style={styles.rowBetween}>
              <Text style={styles.modalTitle}>Yeni Beton / Karot Numunesi</Text>
              <TouchableOpacity onPress={() => setShowCreateModal(false)}>
                <Ionicons name="close" size={22} color="#8E8E93" />
              </TouchableOpacity>
            </View>
            <Text style={styles.label}>QR Etiket Kodu (Boş bırakılırsa otomatik)</Text>
            <TextInput
              style={styles.input}
              value={qrCode}
              onChangeText={setQrCode}
              placeholder="QR-2026-001"
              placeholderTextColor="#636366"
            />
            <Text style={styles.label}>Alındığı Eleman / Kat *</Text>
            <TextInput
              style={styles.input}
              value={location}
              onChangeText={setLocation}
              placeholder="Örn: B Blok Zemin Kat Kolonları (C35)"
              placeholderTextColor="#636366"
            />
            <TouchableOpacity
              style={styles.submitBtn}
              onPress={handleCreateSample}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.submitBtnText}>Numuneyi Kaydet</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* LAB KABUL / KIRIM SONUCU MODALI */}
      <Modal
        visible={Boolean(editTarget)}
        transparent
        animationType="slide"
        onRequestClose={() => setEditTarget(null)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalSheet}>
            <View style={styles.rowBetween}>
              <Text style={styles.modalTitle}>Numune Lab & Kırım İşlemi</Text>
              <TouchableOpacity onPress={() => setEditTarget(null)}>
                <Ionicons name="close" size={22} color="#8E8E93" />
              </TouchableOpacity>
            </View>
            {editTarget && (
              <>
                <Text style={styles.qrTitle}>
                  {editTarget.qrCode} • {editTarget.location}
                </Text>
                <Text style={styles.label}>Laboratuvar Durumu</Text>
                <View style={{ flexDirection: "row", gap: 8 }}>
                  {["IN_LAB", "PASSED", "FAILED"].map((st) => (
                    <TouchableOpacity
                      key={st}
                      style={[
                        styles.statusChip,
                        nextStatus === st && styles.statusChipActive,
                      ]}
                      onPress={() => setNextStatus(st)}
                    >
                      <Text style={styles.statusChipText}>{st}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={styles.label}>
                  Basınç Dayanımı Sonucu (MPa - Opsiyonel)
                </Text>
                <TextInput
                  style={styles.input}
                  value={strengthInput}
                  onChangeText={setStrengthInput}
                  keyboardType="numeric"
                  placeholder="Örn: 36.4"
                  placeholderTextColor="#636366"
                />

                <TouchableOpacity
                  style={styles.submitBtn}
                  onPress={handleUpdateSample}
                  disabled={updating}
                >
                  {updating ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text style={styles.submitBtnText}>Güncelle</Text>
                  )}
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
  actionsBar: { flexDirection: "row", gap: 10, paddingHorizontal: 16, paddingTop: 12 },
  topBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    paddingVertical: 12,
    borderRadius: 12,
  },
  topBtnText: { color: "#FFFFFF", fontSize: 13, fontWeight: "800" },
  scrollContent: { padding: 16, paddingBottom: 110, gap: 12 },
  card: { gap: 7 },
  rowBetween: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 8 },
  qrTitle: { fontSize: 14, fontWeight: "800", color: "#5CE1E6" },
  locText: { fontSize: 14, fontWeight: "700", color: "#FFFFFF" },
  metaText: { fontSize: 11, color: iosColors.labelMuted },
  strengthText: { fontSize: 13, fontWeight: "800", color: "#34C759" },
  modalBackdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.78)", justifyContent: "flex-end" },
  modalSheet: {
    backgroundColor: "#111827",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    gap: 10,
  },
  modalTitle: { fontSize: 17, fontWeight: "800", color: "#FFFFFF" },
  label: { fontSize: 11, fontWeight: "700", color: "#8E8E93", marginTop: 4 },
  input: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    borderRadius: 11,
    padding: 12,
    color: "#FFFFFF",
    fontSize: 13,
  },
  statusChip: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    alignItems: "center",
  },
  statusChipActive: { borderColor: iosColors.systemBlue, backgroundColor: "rgba(10,122,255,0.2)" },
  statusChipText: { color: "#FFFFFF", fontSize: 12, fontWeight: "700" },
  submitBtn: {
    backgroundColor: iosColors.systemBlue,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 8,
  },
  submitBtnText: { color: "#FFFFFF", fontSize: 14, fontWeight: "800" },
});

