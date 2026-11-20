/**
 * © 2026 NXA Software. All rights reserved.
 * Nexa ERP Mobil - Yapı Denetim & Kalite Vize Ekranı (GET/POST /api/mobile/inspections)
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
import { getCurrentGpsFix } from "../services/locationTracker";
import {
  AppHeader,
  EmptyState,
  GlassCard,
  ScreenHeader,
  SkeletonList,
  StatusBadge,
} from "../components/ui/NexaUI";
import { iosColors } from "../theme/iosTheme";
import type { InspectionItem } from "../types/api";

const TYPES = ["ALL", "DONATI", "KALIP", "TEMEL", "BETON", "TESISAT"];

export default function InspectionsScreen({
  embeddedInTab = false,
}: {
  embeddedInTab?: boolean;
}) {
  const { activeProject } = useAuth();
  const [items, setItems] = useState<InspectionItem[]>([]);
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [vizeType, setVizeType] = useState("DONATI");
  const [floor, setFloor] = useState("1. Kat");
  const [vizeStatus, setVizeStatus] = useState<"APPROVED" | "REJECTED">("APPROVED");
  const [submitting, setSubmitting] = useState(false);

  const loadData = useCallback(
    async (isRefresh = false) => {
      try {
        if (isRefresh) setRefreshing(true);
        else setLoading(true);
        const res = await mobileApi.inspections.list({
          projectId: activeProject?.id,
          type: typeFilter,
        });
        setItems(res.inspections || []);
      } catch (err: any) {
        Alert.alert("Denetimler Alınamadı", extractErrorMessage(err));
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [activeProject?.id, typeFilter]
  );

  useEffect(() => {
    loadData(false);
  }, [loadData]);

  const handleCreate = async () => {
    if (!floor.trim()) {
      Alert.alert("Eksik Alan", "Kat / blok bilgisi zorunludur.");
      return;
    }
    try {
      setSubmitting(true);
      const gps = await getCurrentGpsFix();
      const res = await mobileApi.inspections.create({
        projectId: activeProject?.id,
        type: vizeType,
        floor: floor.trim(),
        status: vizeStatus,
        gpsLocation: gps
          ? `${gps.latitude.toFixed(5)},${gps.longitude.toFixed(5)}`
          : undefined,
      });
      setShowModal(false);
      if (!res.offlineQueued) await loadData(true);
      Alert.alert("Denetim Kaydedildi", res.message || "Vize tutanağı işlendi.");
    } catch (err: any) {
      Alert.alert("Hata", extractErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      {embeddedInTab ? (
        <AppHeader title="Yapı Denetim & Vizeler" />
      ) : (
        <ScreenHeader
          title="Denetim Tutanak & Vize"
          subtitle={activeProject?.name || "YİBF & Demir/Kalıp Kontrolü"}
        />
      )}

      <View style={styles.topWrap}>
        <TouchableOpacity
          style={styles.createBtn}
          onPress={() => setShowModal(true)}
          activeOpacity={0.85}
        >
          <Ionicons name="shield-checkmark" size={18} color="#FFFFFF" />
          <Text style={styles.createBtnText}>Yeni Denetim Vizesi Oluştur</Text>
        </TouchableOpacity>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipRow}
        >
          {TYPES.map((t) => {
            const active = typeFilter === t;
            return (
              <TouchableOpacity
                key={t}
                style={[styles.chip, active && styles.chipActive]}
                onPress={() => setTypeFilter(t)}
              >
                <Text style={[styles.chipText, active && styles.chipTextActive]}>
                  {t === "ALL" ? "Tümü" : t}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadData(true)}
            tintColor={iosColors.systemBlue}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <SkeletonList count={3} />
        ) : items.length === 0 ? (
          <EmptyState
            icon="shield-checkmark-outline"
            title="Denetim Kaydı Yok"
            subtitle="Seçili proje ve filtre için kayıtlı denetim tutanağı bulunamadı."
            actionLabel="Vize Oluştur"
            onAction={() => setShowModal(true)}
          />
        ) : (
          items.map((ins) => (
            <GlassCard key={ins.id} style={styles.card}>
              <View style={styles.rowBetween}>
                <Text style={styles.typeTitle}>{ins.type} Kontrolü</Text>
                <StatusBadge status={ins.status} />
              </View>
              <Text style={styles.projectText}>
                {ins.project || activeProject?.name} • {ins.floor}
              </Text>
              <View style={styles.rowBetween}>
                <Text style={styles.metaText}>👷 {ins.inspector || "Denetçi"}</Text>
                <Text style={styles.metaText}>
                  {new Date(ins.inspectionDate).toLocaleDateString("tr-TR")}
                </Text>
              </View>
            </GlassCard>
          ))
        )}
      </ScrollView>

      <Modal
        visible={showModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalSheet}>
            <View style={styles.rowBetween}>
              <Text style={styles.modalTitle}>Yeni Denetim Vizesi</Text>
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <Ionicons name="close" size={22} color="#8E8E93" />
              </TouchableOpacity>
            </View>

            <Text style={styles.label}>Kontrol Türü</Text>
            <View style={styles.wrapRow}>
              {TYPES.filter((t) => t !== "ALL").map((t) => (
                <TouchableOpacity
                  key={t}
                  style={[styles.chip, vizeType === t && styles.chipActive]}
                  onPress={() => setVizeType(t)}
                >
                  <Text style={[styles.chipText, vizeType === t && styles.chipTextActive]}>
                    {t}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>Kat / Blok</Text>
            <TextInput
              style={styles.input}
              value={floor}
              onChangeText={setFloor}
              placeholder="Örn: A Blok 2. Kat Tabliye"
              placeholderTextColor="#636366"
            />

            <Text style={styles.label}>Vize Sonucu</Text>
            <View style={{ flexDirection: "row", gap: 10 }}>
              <TouchableOpacity
                style={[
                  styles.statusBtn,
                  vizeStatus === "APPROVED" && { backgroundColor: "rgba(52,199,89,0.22)", borderColor: "#34C759" },
                ]}
                onPress={() => setVizeStatus("APPROVED")}
              >
                <Text style={{ color: "#34C759", fontWeight: "800" }}>UYGUN (ONAY)</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.statusBtn,
                  vizeStatus === "REJECTED" && { backgroundColor: "rgba(255,59,48,0.22)", borderColor: "#FF453A" },
                ]}
                onPress={() => setVizeStatus("REJECTED")}
              >
                <Text style={{ color: "#FF6961", fontWeight: "800" }}>UYGUNSUZ</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.submitBtn}
              onPress={handleCreate}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.submitBtnText}>Tutanağı Kaydet</Text>
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
  topWrap: { paddingHorizontal: 16, paddingTop: 12, gap: 10 },
  createBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#AF52DE",
    paddingVertical: 12,
    borderRadius: 12,
  },
  createBtnText: { color: "#FFFFFF", fontSize: 13, fontWeight: "800" },
  chipRow: { gap: 8 },
  wrapRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.09)",
  },
  chipActive: { backgroundColor: "rgba(10,122,255,0.2)", borderColor: iosColors.systemBlue },
  chipText: { fontSize: 12, fontWeight: "700", color: "#8E8E93" },
  chipTextActive: { color: "#58A6FF" },
  scrollContent: { padding: 16, paddingBottom: 110, gap: 12 },
  card: { gap: 8 },
  rowBetween: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 8 },
  typeTitle: { fontSize: 15, fontWeight: "800", color: "#FFFFFF" },
  projectText: { fontSize: 13, color: "#E5E7EB", fontWeight: "600" },
  metaText: { fontSize: 11, color: iosColors.labelMuted },
  modalBackdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.78)", justifyContent: "flex-end" },
  modalSheet: {
    backgroundColor: "#111827",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    gap: 12,
  },
  modalTitle: { fontSize: 17, fontWeight: "800", color: "#FFFFFF" },
  label: { fontSize: 11, fontWeight: "700", color: "#8E8E93" },
  input: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    borderRadius: 11,
    padding: 12,
    color: "#FFFFFF",
    fontSize: 13,
  },
  statusBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    alignItems: "center",
  },
  submitBtn: {
    backgroundColor: iosColors.systemBlue,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 6,
  },
  submitBtnText: { color: "#FFFFFF", fontSize: 14, fontWeight: "800" },
});

