/**
 * © 2026 NXA Software. All rights reserved.
 * Nexa ERP Mobil - Taşeron İş Kanıtı & 2 Kademeli Onay (work-proofs + review)
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
import type { WorkProofItem } from "../types/api";

const REVIEWER_ROLES = [
  "ADMIN",
  "SUPER_ADMIN",
  "PROJECT_MANAGER",
  "SITE_MANAGER",
  "ENGINEER",
  "ARCHITECT",
  "FITOUT_SUPERVISOR",
];

export default function WorkProofsScreen({
  embeddedInTab = false,
}: {
  embeddedInTab?: boolean;
}) {
  const { role, activeProject } = useAuth();
  const canReview = REVIEWER_ROLES.includes(role);

  const [proofs, setProofs] = useState<WorkProofItem[]>([]);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Yeni İş Kanıtı Modalı
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [claimedQuantity, setClaimedQuantity] = useState("");
  const [boqItemId, setBoqItemId] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // İnceleme / Onay Modalı
  const [reviewTarget, setReviewTarget] = useState<WorkProofItem | null>(null);
  const [approvedQty, setApprovedQty] = useState("");
  const [reviewNotes, setReviewNotes] = useState("");
  const [reviewing, setReviewing] = useState(false);

  const loadProofs = useCallback(
    async (isRefresh = false) => {
      try {
        if (isRefresh) setRefreshing(true);
        else setLoading(true);
        const res = await mobileApi.workProofs.list({
          projectId: activeProject?.id,
          status: statusFilter,
        });
        setProofs(res.proofs || []);
      } catch (err: any) {
        Alert.alert("İş Kanıtları Alınamadı", extractErrorMessage(err));
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [activeProject?.id, statusFilter]
  );

  useEffect(() => {
    loadProofs(false);
  }, [loadProofs]);

  const handlePickPhoto = async (source: "camera" | "gallery") => {
    const res = await captureAndResolvePhotoUrl({
      source,
      sourceModule: "WORK_PROOF",
      projectId: activeProject?.id,
    });
    if (res) {
      setPhotoUrl(res.photoUrl);
    }
  };

  const handleCreate = async () => {
    if (!title.trim() || !photoUrl.trim()) {
      Alert.alert(
        "Eksik Bilgi",
        "İmalat başlığı ve şantiye fotoğrafı zorunludur."
      );
      return;
    }

    try {
      setSubmitting(true);
      const gps = await getCurrentGpsFix();
      const res = await mobileApi.workProofs.create({
        projectId: activeProject?.id,
        title: title.trim(),
        description: description.trim() || undefined,
        photoUrl: photoUrl.trim(),
        claimedQuantity: Number(claimedQuantity) || 0,
        boqItemId: boqItemId.trim() || undefined,
        gpsLatitude: gps?.latitude ?? null,
        gpsLongitude: gps?.longitude ?? null,
      });

      setShowCreateModal(false);
      setTitle("");
      setDescription("");
      setClaimedQuantity("");
      setBoqItemId("");
      setPhotoUrl("");

      if (!res.offlineQueued) await loadProofs(true);
      Alert.alert("Başarılı", res.message || "İş kanıtı onay kuyruğuna eklendi.");
    } catch (err: any) {
      Alert.alert("Hata", extractErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleReview = async (action: "APPROVE" | "REJECT") => {
    if (!reviewTarget) return;
    if (action === "REJECT" && !reviewNotes.trim()) {
      Alert.alert("Gerekçe Gerekli", "Ret işleminde lütfen açıklama giriniz.");
      return;
    }

    try {
      setReviewing(true);
      const qtyNum = Number(approvedQty);
      const res = await mobileApi.workProofs.review(reviewTarget.id, {
        action,
        approvedQuantity: !isNaN(qtyNum) ? qtyNum : reviewTarget.claimedQuantity,
        notes: reviewNotes.trim() || undefined,
      });
      setReviewTarget(null);
      setReviewNotes("");
      if (!res.offlineQueued) await loadProofs(true);
      Alert.alert(
        "İşlem Tamam",
        res.message || `İş kanıtı ${action === "APPROVE" ? "onaylandı" : "reddedildi"}.`
      );
    } catch (err: any) {
      Alert.alert("Onay Hatası", extractErrorMessage(err));
    } finally {
      setReviewing(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      {embeddedInTab ? (
        <AppHeader title="Taşeron İş Kanıtları" />
      ) : (
        <ScreenHeader
          title="İş Kanıtı & Onay"
          subtitle={activeProject?.name || "Fotoğraflı Hakediş Kanıtları"}
        />
      )}

      <View style={styles.topControls}>
        <TouchableOpacity
          style={styles.uploadBtn}
          onPress={() => setShowCreateModal(true)}
          activeOpacity={0.85}
        >
          <Ionicons name="camera" size={18} color="#FFFFFF" />
          <Text style={styles.uploadBtnText}>Yeni İş Kanıtı Yükle</Text>
        </TouchableOpacity>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterRow}
        >
          {[
            { k: "ALL", label: "Tümü" },
            { k: "PENDING", label: "Onay Bekleyen" },
            { k: "APPROVED", label: "Onaylanan" },
            { k: "REJECTED", label: "Reddedilen" },
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
        </ScrollView>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadProofs(true)}
            tintColor={iosColors.systemBlue}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <SkeletonList count={3} />
        ) : proofs.length === 0 ? (
          <EmptyState
            icon="camera-outline"
            title="İş Kanıtı Bulunamadı"
            subtitle="Bu filtre için kayıtlı taşeron iş kanıtı bulunmuyor."
            actionLabel="Kanıt Yükle"
            onAction={() => setShowCreateModal(true)}
          />
        ) : (
          proofs.map((p) => (
            <GlassCard key={p.id} style={styles.proofCard}>
              <View style={styles.rowBetween}>
                <Text style={styles.proofTitle} numberOfLines={1}>
                  {p.title}
                </Text>
                <StatusBadge status={p.status} />
              </View>

              {p.photoUrl && /^https?:|^data:image/i.test(p.photoUrl) ? (
                <Image
                  source={{ uri: p.photoUrl }}
                  style={styles.proofImage}
                  resizeMode="cover"
                />
              ) : null}

              {p.description ? (
                <Text style={styles.proofDesc}>{p.description}</Text>
              ) : null}

              <View style={styles.metaGrid}>
                <Text style={styles.metaItem}>🏢 {p.subcontractor || "Taşeron"}</Text>
                <Text style={styles.metaItem}>
                  📐 Beyan: {p.claimedQuantity} {p.unit || "m²"}
                </Text>
                {p.approvedQuantity != null && (
                  <Text style={[styles.metaItem, { color: "#34C759" }]}>
                    ✅ Onaylanan: {p.approvedQuantity} {p.unit || "m²"}
                  </Text>
                )}
                {p.gpsLatitude != null && p.gpsLongitude != null && (
                  <Text style={styles.metaItem}>
                    📍 {p.gpsLatitude.toFixed(4)}, {p.gpsLongitude.toFixed(4)}
                  </Text>
                )}
              </View>

              {canReview && p.status === "PENDING" && (
                <TouchableOpacity
                  style={styles.reviewTriggerBtn}
                  onPress={() => {
                    setReviewTarget(p);
                    setApprovedQty(String(p.claimedQuantity));
                    setReviewNotes("");
                  }}
                >
                  <Ionicons name="checkmark-done" size={16} color="#FFFFFF" />
                  <Text style={styles.reviewTriggerText}>
                    İncele / Metraj Onayla veya Reddet
                  </Text>
                </TouchableOpacity>
              )}
            </GlassCard>
          ))
        )}
      </ScrollView>

      {/* YENİ İŞ KANITI MODALI */}
      <Modal
        visible={showCreateModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCreateModal(false)}
      >
        <View style={styles.modalBackdrop}>
          <ScrollView contentContainerStyle={styles.modalSheet}>
            <View style={styles.rowBetween}>
              <Text style={styles.modalTitle}>Yeni İş Kanıtı Yükle</Text>
              <TouchableOpacity onPress={() => setShowCreateModal(false)}>
                <Ionicons name="close" size={22} color="#8E8E93" />
              </TouchableOpacity>
            </View>

            <View style={styles.photoBtnRow}>
              <TouchableOpacity
                style={styles.photoBtn}
                onPress={() => handlePickPhoto("camera")}
              >
                <Ionicons name="camera" size={18} color="#58A6FF" />
                <Text style={styles.photoBtnText}>Kamerayla Çek</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.photoBtn}
                onPress={() => handlePickPhoto("gallery")}
              >
                <Ionicons name="images" size={18} color="#58A6FF" />
                <Text style={styles.photoBtnText}>Galeriden Seç</Text>
              </TouchableOpacity>
            </View>

            {photoUrl ? (
              <Image
                source={{ uri: photoUrl }}
                style={styles.previewImg}
                resizeMode="cover"
              />
            ) : null}

            <Text style={styles.label}>İmalat Başlığı *</Text>
            <TextInput
              style={styles.input}
              value={title}
              onChangeText={setTitle}
              placeholder="Örn: A Blok 2. Kat Kalıp & Donatı İmalatı"
              placeholderTextColor="#636366"
            />

            <View style={{ flexDirection: "row", gap: 10 }}>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>İddia Edilen Metraj *</Text>
                <TextInput
                  style={styles.input}
                  value={claimedQuantity}
                  onChangeText={setClaimedQuantity}
                  keyboardType="numeric"
                  placeholder="120"
                  placeholderTextColor="#636366"
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>BoQ Poz ID (Opsiyonel)</Text>
                <TextInput
                  style={styles.input}
                  value={boqItemId}
                  onChangeText={setBoqItemId}
                  placeholder="Poz ID"
                  placeholderTextColor="#636366"
                />
              </View>
            </View>

            <Text style={styles.label}>Açıklama</Text>
            <TextInput
              style={[styles.input, { minHeight: 75, textAlignVertical: "top" }]}
              value={description}
              onChangeText={setDescription}
              multiline
              placeholder="İmalat bölgesi ve teknik detaylar..."
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
                <Text style={styles.submitBtnText}>GPS ile Kanıtı Gönder</Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>

      {/* ONAY / RED MODALI */}
      <Modal
        visible={Boolean(reviewTarget)}
        transparent
        animationType="slide"
        onRequestClose={() => setReviewTarget(null)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalSheet}>
            <View style={styles.rowBetween}>
              <Text style={styles.modalTitle}>İş Kanıtı Değerlendirme</Text>
              <TouchableOpacity onPress={() => setReviewTarget(null)}>
                <Ionicons name="close" size={22} color="#8E8E93" />
              </TouchableOpacity>
            </View>
            {reviewTarget && (
              <>
                <Text style={styles.proofTitle}>{reviewTarget.title}</Text>
                <Text style={styles.label}>
                  Onaylanan Metraj (Beyan: {reviewTarget.claimedQuantity})
                </Text>
                <TextInput
                  style={styles.input}
                  value={approvedQty}
                  onChangeText={setApprovedQty}
                  keyboardType="numeric"
                />
                <Text style={styles.label}>Mühendis / Şef Notu</Text>
                <TextInput
                  style={[styles.input, { minHeight: 70, textAlignVertical: "top" }]}
                  value={reviewNotes}
                  onChangeText={setReviewNotes}
                  multiline
                  placeholder="Onay veya metraj kırpma/ret gerekçesi..."
                  placeholderTextColor="#636366"
                />
                <View style={{ flexDirection: "row", gap: 10, marginTop: 6 }}>
                  <TouchableOpacity
                    style={[styles.actionBtn, { backgroundColor: "rgba(255,59,48,0.2)", borderColor: "#FF453A" }]}
                    disabled={reviewing}
                    onPress={() => handleReview("REJECT")}
                  >
                    <Text style={{ color: "#FF6961", fontWeight: "800" }}>Reddet</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionBtn, { backgroundColor: "#34C759", borderColor: "#34C759" }]}
                    disabled={reviewing}
                    onPress={() => handleReview("APPROVE")}
                  >
                    <Text style={{ color: "#FFFFFF", fontWeight: "800" }}>Onayla</Text>
                  </TouchableOpacity>
                </View>
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
  topControls: { paddingHorizontal: 16, paddingTop: 12, gap: 10 },
  uploadBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: iosColors.systemBlue,
    paddingVertical: 12,
    borderRadius: 12,
  },
  uploadBtnText: { color: "#FFFFFF", fontSize: 13, fontWeight: "800" },
  filterRow: { gap: 8, paddingBottom: 4 },
  filterPill: {
    paddingHorizontal: 13,
    paddingVertical: 7,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  filterPillActive: {
    backgroundColor: "rgba(10, 122, 255, 0.2)",
    borderColor: iosColors.systemBlue,
  },
  filterText: { fontSize: 12, fontWeight: "700", color: "#8E8E93" },
  filterTextActive: { color: "#58A6FF" },
  scrollContent: { padding: 16, paddingBottom: 110, gap: 12 },
  proofCard: { gap: 10 },
  rowBetween: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  proofTitle: { flex: 1, fontSize: 15, fontWeight: "800", color: "#FFFFFF" },
  proofImage: { width: "100%", height: 170, borderRadius: 12, backgroundColor: "#1F2937" },
  proofDesc: { fontSize: 12, color: "#D1D5DB", lineHeight: 18 },
  metaGrid: { gap: 4 },
  metaItem: { fontSize: 12, color: iosColors.labelMuted, fontWeight: "600" },
  reviewTriggerBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    backgroundColor: "rgba(52, 199, 89, 0.18)",
    borderWidth: 1,
    borderColor: "rgba(52, 199, 89, 0.45)",
    paddingVertical: 10,
    borderRadius: 10,
  },
  reviewTriggerText: { color: "#34C759", fontSize: 12, fontWeight: "800" },
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
    paddingVertical: 11,
    borderRadius: 11,
    backgroundColor: "rgba(10, 122, 255, 0.14)",
    borderWidth: 1,
    borderColor: "rgba(10, 122, 255, 0.35)",
  },
  photoBtnText: { color: "#58A6FF", fontSize: 12, fontWeight: "700" },
  previewImg: { width: "100%", height: 150, borderRadius: 12 },
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
  actionBtn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
  },
});

