/**
 * © 2026 NXA Software. All rights reserved.
 * Nexa ERP Mobil - Saha Kusur (Snagging) & DÖF/NCR Ekranı (GET/POST/PATCH /api/mobile/deficiencies)
 */

import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
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
import type { DeficiencyItem } from "../types/api";

export default function DeficienciesScreen({
  embeddedInTab = false,
}: {
  embeddedInTab?: boolean;
}) {
  const { activeProject } = useAuth();
  const [items, setItems] = useState<DeficiencyItem[]>([]);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [element, setElement] = useState("");
  const [floor, setFloor] = useState("Zemin Kat");
  const [category, setCategory] = useState("Genel Kusur");
  const [priority, setPriority] = useState<"LOW" | "MEDIUM" | "HIGH" | "CRITICAL">("HIGH");
  const [description, setDescription] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const loadData = useCallback(
    async (isRefresh = false) => {
      try {
        if (isRefresh) setRefreshing(true);
        else setLoading(true);
        const res = await mobileApi.deficiencies.list({
          projectId: activeProject?.id,
          status: statusFilter,
        });
        setItems(res.deficiencies || []);
      } catch (err: any) {
        Alert.alert("Kusurlar Alınamadı", extractErrorMessage(err));
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [activeProject?.id, statusFilter]
  );

  useEffect(() => {
    loadData(false);
  }, [loadData]);

  const handlePhoto = async (source: "camera" | "gallery") => {
    const res = await captureAndResolvePhotoUrl({
      source,
      sourceModule: "DEFICIENCY",
      projectId: activeProject?.id,
    });
    if (res) setPhotoUrl(res.photoUrl);
  };

  const handleCreate = async () => {
    if (!description.trim()) {
      Alert.alert("Eksik Alan", "Lütfen kusur / uygunsuzluk açıklaması giriniz.");
      return;
    }
    try {
      setSubmitting(true);
      const res = await mobileApi.deficiencies.create({
        projectId: activeProject?.id,
        element: element.trim() || "Genel Eleman",
        floor: floor.trim() || "Zemin",
        category: category.trim() || "Genel Kusur",
        priority,
        description: description.trim(),
        photoUrl: photoUrl || undefined,
      });
      setShowModal(false);
      setElement("");
      setDescription("");
      setPhotoUrl("");
      if (!res.offlineQueued) await loadData(true);
      Alert.alert("Kaydedildi", res.message || "Saha kusuru oluşturuldu.");
    } catch (err: any) {
      Alert.alert("Hata", extractErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleTransition = async (
    id: string,
    status: "IN_PROGRESS" | "CLOSED"
  ) => {
    try {
      const res = await mobileApi.deficiencies.update({ id, status });
      if (!res.offlineQueued) await loadData(true);
    } catch (err: any) {
      Alert.alert("Güncellenemedi", extractErrorMessage(err));
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      {embeddedInTab ? (
        <AppHeader title="Kusur & DÖF (Snagging)" />
      ) : (
        <ScreenHeader
          title="Saha Kusurları & DÖF"
          subtitle={activeProject?.name || "Uygunsuzluk & Punch List"}
        />
      )}

      <View style={styles.topControls}>
        <TouchableOpacity
          style={styles.createBtn}
          onPress={() => setShowModal(true)}
          activeOpacity={0.85}
        >
          <Ionicons name="warning" size={18} color="#FFFFFF" />
          <Text style={styles.createBtnText}>Fotoğraflı Kusur / DÖF Aç</Text>
        </TouchableOpacity>

        <View style={styles.filterRow}>
          {[
            { k: "ALL", label: "Tümü" },
            { k: "OPEN", label: "Açık" },
            { k: "IN_PROGRESS", label: "Gideriliyor" },
            { k: "CLOSED", label: "Kapatılan" },
          ].map((f) => {
            const active = statusFilter === f.k;
            return (
              <TouchableOpacity
                key={f.k}
                style={[styles.filterPill, active && styles.filterPillActive]}
                onPress={() => setStatusFilter(f.k)}
              >
                <Text style={[styles.filterText, active && styles.filterTextActive]}>
                  {f.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
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
            icon="warning-outline"
            title="Açık Kusur Bulunmuyor"
            subtitle="Seçili proje ve durumda saha kusuru kaydı yok."
            actionLabel="Yeni Kusur Ekle"
            onAction={() => setShowModal(true)}
          />
        ) : (
          items.map((d) => (
            <GlassCard key={d.id} style={styles.card}>
              <View style={styles.rowBetween}>
                <Text style={styles.elemTitle} numberOfLines={1}>
                  {d.element} • {d.floor}
                </Text>
                <View style={{ flexDirection: "row", gap: 6 }}>
                  <StatusBadge status={d.priority} />
                  <StatusBadge status={d.status} />
                </View>
              </View>

              {d.photoUrl && /^https?:|^data:image/i.test(d.photoUrl) ? (
                <Image
                  source={{ uri: d.photoUrl }}
                  style={styles.defectImg}
                  resizeMode="cover"
                />
              ) : null}

              <Text style={styles.descText}>{d.description}</Text>

              {d.status !== "CLOSED" && (
                <View style={{ flexDirection: "row", gap: 8, marginTop: 4 }}>
                  {d.status === "OPEN" && (
                    <TouchableOpacity
                      style={[styles.miniBtn, { borderColor: "#FF9500" }]}
                      onPress={() => handleTransition(d.id, "IN_PROGRESS")}
                    >
                      <Text style={{ color: "#FFB340", fontSize: 11, fontWeight: "700" }}>
                        İşleme Al
                      </Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity
                    style={[styles.miniBtn, { borderColor: "#34C759", backgroundColor: "rgba(52,199,89,0.14)" }]}
                    onPress={() => handleTransition(d.id, "CLOSED")}
                  >
                    <Text style={{ color: "#34C759", fontSize: 11, fontWeight: "800" }}>
                      Kapat / Çözüldü
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
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
          <ScrollView contentContainerStyle={styles.modalSheet}>
            <View style={styles.rowBetween}>
              <Text style={styles.modalTitle}>Yeni Saha Kusuru / DÖF</Text>
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <Ionicons name="close" size={22} color="#8E8E93" />
              </TouchableOpacity>
            </View>

            <View style={styles.photoBtnRow}>
              <TouchableOpacity
                style={styles.photoBtn}
                onPress={() => handlePhoto("camera")}
              >
                <Ionicons name="camera" size={18} color="#58A6FF" />
                <Text style={styles.photoBtnText}>Fotoğraf Çek</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.photoBtn}
                onPress={() => handlePhoto("gallery")}
              >
                <Ionicons name="images" size={18} color="#58A6FF" />
                <Text style={styles.photoBtnText}>Galeriden Seç</Text>
              </TouchableOpacity>
            </View>
            {photoUrl ? (
              <Image
                source={{ uri: photoUrl }}
                style={styles.defectImg}
                resizeMode="cover"
              />
            ) : null}

            <Text style={styles.label}>Eleman / Mahal</Text>
            <TextInput
              style={styles.input}
              value={element}
              onChangeText={setElement}
              placeholder="Örn: C3 Kolonu veya Giriş Vitrin Camı"
              placeholderTextColor="#636366"
            />
            <View style={{ flexDirection: "row", gap: 10 }}>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>Kat</Text>
                <TextInput
                  style={styles.input}
                  value={floor}
                  onChangeText={setFloor}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>Kategori</Text>
                <TextInput
                  style={styles.input}
                  value={category}
                  onChangeText={setCategory}
                />
              </View>
            </View>

            <Text style={styles.label}>Öncelik</Text>
            <View style={styles.filterRow}>
              {(["LOW", "MEDIUM", "HIGH", "CRITICAL"] as const).map((pr) => (
                <TouchableOpacity
                  key={pr}
                  style={[styles.filterPill, priority === pr && styles.filterPillActive]}
                  onPress={() => setPriority(pr)}
                >
                  <Text
                    style={[styles.filterText, priority === pr && styles.filterTextActive]}
                  >
                    {pr}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>Kusur Açıklaması *</Text>
            <TextInput
              style={[styles.input, { minHeight: 80, textAlignVertical: "top" }]}
              value={description}
              onChangeText={setDescription}
              multiline
              placeholder="Tespit edilen uygunsuzluğu yazınız..."
              placeholderTextColor="#636366"
            />

            <TouchableOpacity
              style={styles.submitBtn}
              onPress={handleCreate}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.submitBtnText}>Kusur Kaydını Aç</Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: iosColors.background },
  topControls: { paddingHorizontal: 16, paddingTop: 12, gap: 10 },
  createBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#FF3B30",
    paddingVertical: 12,
    borderRadius: 12,
  },
  createBtnText: { color: "#FFFFFF", fontSize: 13, fontWeight: "800" },
  filterRow: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  filterPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  filterPillActive: { backgroundColor: "rgba(10,122,255,0.2)", borderColor: iosColors.systemBlue },
  filterText: { fontSize: 11, fontWeight: "700", color: "#8E8E93" },
  filterTextActive: { color: "#58A6FF" },
  scrollContent: { padding: 16, paddingBottom: 110, gap: 12 },
  card: { gap: 8 },
  rowBetween: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 8 },
  elemTitle: { flex: 1, fontSize: 14, fontWeight: "800", color: "#FFFFFF" },
  defectImg: { width: "100%", height: 155, borderRadius: 12, backgroundColor: "#1F2937" },
  descText: { fontSize: 12, color: "#D1D5DB", lineHeight: 18 },
  miniBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 9,
    borderWidth: 1,
    alignItems: "center",
  },
  modalBackdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.78)", justifyContent: "flex-end" },
  modalSheet: {
    backgroundColor: "#111827",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    gap: 10,
  },
  modalTitle: { fontSize: 17, fontWeight: "800", color: "#FFFFFF" },
  photoBtnRow: { flexDirection: "row", gap: 10 },
  photoBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: "rgba(10,122,255,0.14)",
    borderWidth: 1,
    borderColor: "rgba(10,122,255,0.3)",
  },
  photoBtnText: { color: "#58A6FF", fontSize: 12, fontWeight: "700" },
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
  submitBtn: {
    backgroundColor: iosColors.systemBlue,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 8,
  },
  submitBtnText: { color: "#FFFFFF", fontSize: 14, fontWeight: "800" },
});

