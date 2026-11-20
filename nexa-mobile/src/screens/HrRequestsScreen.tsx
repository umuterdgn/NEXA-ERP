/**
 * © 2026 NXA Software. All rights reserved.
 * Nexa ERP Mobil - İzin, Avans & Fişli Masraf Talepleri (GET/POST/PATCH /api/mobile/hr/requests)
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
import type {
  AdvanceRequestItem,
  ExpenseClaimItem,
  LeaveRequestItem,
} from "../types/api";

type RequestTab = "LEAVE" | "ADVANCE" | "EXPENSE";

const APPROVER_ROLES = new Set([
  "SUPER_ADMIN",
  "ADMIN",
  "PROJECT_MANAGER",
  "SITE_MANAGER",
  "HR_MANAGER",
  "FINANCE_MANAGER",
  "INSPECTION_ADMIN",
  "INSPECTION_FINANCE",
  "FRANCHISE_ADMIN",
  "REGIONAL_MANAGER",
  "BRANCH_MANAGER",
]);

export default function HrRequestsScreen({
  embeddedInTab = false,
}: {
  embeddedInTab?: boolean;
}) {
  const { activeProject, role, hasModule } = useAuth();
  const canApprove =
    hasModule("approvals") || APPROVER_ROLES.has(String(role || "").toUpperCase());

  const [tab, setTab] = useState<RequestTab>("LEAVE");
  const [leaves, setLeaves] = useState<LeaveRequestItem[]>([]);
  const [advances, setAdvances] = useState<AdvanceRequestItem[]>([]);
  const [expenses, setExpenses] = useState<ExpenseClaimItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Yeni Talep Modalı
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Leave state
  const [leaveType, setLeaveType] = useState("Yıllık İzin");
  const [startDate, setStartDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [endDate, setEndDate] = useState(() => new Date().toISOString().slice(0, 10));

  // Advance & Expense shared state
  const [amount, setAmount] = useState("");
  const [deductMonth, setDeductMonth] = useState(() =>
    new Date().toISOString().slice(0, 7)
  );
  const [expenseType, setExpenseType] = useState("Saha Malzeme / Fiş");
  const [receiptUrl, setReceiptUrl] = useState("");
  const [reason, setReason] = useState("");

  const loadRequests = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      const res = await mobileApi.hr.getRequests("ALL");
      setLeaves(res.leaves || []);
      setAdvances(res.advances || []);
      setExpenses(res.expenses || []);
    } catch (err: any) {
      Alert.alert("Talepler Alınamadı", extractErrorMessage(err));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadRequests(false);
  }, [loadRequests]);

  const handleCaptureReceipt = async (source: "camera" | "gallery") => {
    const res = await captureAndResolvePhotoUrl({
      source,
      sourceModule: "HR_EXPENSE_RECEIPT",
      projectId: activeProject?.id,
    });
    if (res?.photoUrl) {
      setReceiptUrl(res.photoUrl);
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      if (tab === "LEAVE") {
        const res = await mobileApi.hr.createRequest({
          requestType: "LEAVE",
          leaveType,
          startDate,
          endDate,
          reason: reason.trim() || undefined,
          projectId: activeProject?.id,
        });
        if (!res.offlineQueued) await loadRequests(true);
      } else if (tab === "ADVANCE") {
        const parsed = parseFloat(amount.replace(",", "."));
        if (isNaN(parsed) || parsed <= 0) {
          Alert.alert("Geçersiz Tutar", "Lütfen sıfırdan büyük bir avans tutarı girin.");
          setSubmitting(false);
          return;
        }
        const res = await mobileApi.hr.createRequest({
          requestType: "ADVANCE",
          amount: parsed,
          deductMonth,
          reason: reason.trim() || undefined,
          projectId: activeProject?.id,
        });
        if (!res.offlineQueued) await loadRequests(true);
      } else {
        const parsed = parseFloat(amount.replace(",", "."));
        if (isNaN(parsed) || parsed <= 0) {
          Alert.alert("Geçersiz Tutar", "Lütfen sıfırdan büyük bir masraf tutarı girin.");
          setSubmitting(false);
          return;
        }
        const res = await mobileApi.hr.createRequest({
          requestType: "EXPENSE",
          expenseType,
          amount: parsed,
          receiptUrl: receiptUrl || undefined,
          description: reason.trim() || undefined,
          projectId: activeProject?.id,
        });
        if (!res.offlineQueued) await loadRequests(true);
      }

      setShowCreateModal(false);
      setAmount("");
      setReason("");
      setReceiptUrl("");
    } catch (err: any) {
      Alert.alert("Talep Gönderilemedi", extractErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleReview = async (
    requestType: RequestTab,
    id: string,
    action: "APPROVE" | "REJECT"
  ) => {
    try {
      await mobileApi.hr.reviewRequest({ requestType, id, action });
      await loadRequests(true);
    } catch (err: any) {
      Alert.alert("İşlem Yapılamadı", extractErrorMessage(err));
    }
  };

  const activeCount =
    tab === "LEAVE"
      ? leaves.length
      : tab === "ADVANCE"
      ? advances.length
      : expenses.length;

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      {embeddedInTab ? (
        <AppHeader title="İK Talepleri & Onaylar" />
      ) : (
        <ScreenHeader
          title="İzin, Avans & Masraf"
          subtitle={canApprove ? "Talep Oluştur & Yönetici Onayları" : "Kişisel İK Talepleriniz"}
        />
      )}

      <View style={styles.topControls}>
        <View style={styles.tabRow}>
          {(
            [
              { key: "LEAVE", label: `İzin (${leaves.length})` },
              { key: "ADVANCE", label: `Avans (${advances.length})` },
              { key: "EXPENSE", label: `Masraf (${expenses.length})` },
            ] as const
          ).map((item) => {
            const active = tab === item.key;
            return (
              <TouchableOpacity
                key={item.key}
                style={[styles.tabPill, active && styles.tabPillActive]}
                onPress={() => setTab(item.key)}
              >
                <Text style={[styles.tabText, active && styles.tabTextActive]}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <TouchableOpacity
          style={styles.createBtn}
          onPress={() => setShowCreateModal(true)}
          activeOpacity={0.85}
        >
          <Ionicons name="add-circle" size={18} color="#FFFFFF" />
          <Text style={styles.createBtnText}>
            {tab === "LEAVE"
              ? "Yeni İzin Talebi"
              : tab === "ADVANCE"
              ? "Yeni Avans Talebi"
              : "Fişli Masraf Gir"}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadRequests(true)}
            tintColor="#0A7AFF"
          />
        }
      >
        {loading ? (
          <SkeletonList count={4} />
        ) : activeCount === 0 ? (
          <EmptyState
            icon="receipt-outline"
            title="Henüz Talep Bulunmuyor"
            subtitle="Seçili kategoride görüntülenecek İK veya onay talebi yok."
          />
        ) : tab === "LEAVE" ? (
          leaves.map((item) => (
            <GlassCard key={item.id} style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardTitle}>{item.leaveType}</Text>
                  <Text style={styles.cardSub}>
                    {item.userName ? `${item.userName} • ` : ""}
                    {String(item.startDate).slice(0, 10)} →{" "}
                    {String(item.endDate).slice(0, 10)}
                  </Text>
                </View>
                <StatusBadge status={item.status} />
              </View>
              {item.reason ? <Text style={styles.cardBody}>{item.reason}</Text> : null}
              {canApprove && item.status === "PENDING" && (
                <View style={styles.reviewRow}>
                  <TouchableOpacity
                    style={styles.rejectBtn}
                    onPress={() => handleReview("LEAVE", item.id, "REJECT")}
                  >
                    <Text style={styles.rejectTxt}>Reddet</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.approveBtn}
                    onPress={() => handleReview("LEAVE", item.id, "APPROVE")}
                  >
                    <Text style={styles.approveTxt}>Onayla</Text>
                  </TouchableOpacity>
                </View>
              )}
            </GlassCard>
          ))
        ) : tab === "ADVANCE" ? (
          advances.map((item) => (
            <GlassCard key={item.id} style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardTitle}>
                    {item.amount.toLocaleString("tr-TR")} ₺ Avans
                  </Text>
                  <Text style={styles.cardSub}>
                    {item.userName ? `${item.userName} • ` : ""}
                    Kesinti Dönemi: {item.deductMonth}
                  </Text>
                </View>
                <StatusBadge status={item.status} />
              </View>
              {item.reason ? <Text style={styles.cardBody}>{item.reason}</Text> : null}
              {canApprove && item.status === "PENDING" && (
                <View style={styles.reviewRow}>
                  <TouchableOpacity
                    style={styles.rejectBtn}
                    onPress={() => handleReview("ADVANCE", item.id, "REJECT")}
                  >
                    <Text style={styles.rejectTxt}>Reddet</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.approveBtn}
                    onPress={() => handleReview("ADVANCE", item.id, "APPROVE")}
                  >
                    <Text style={styles.approveTxt}>Onayla</Text>
                  </TouchableOpacity>
                </View>
              )}
            </GlassCard>
          ))
        ) : (
          expenses.map((item) => (
            <GlassCard key={item.id} style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardTitle}>
                    {item.expenseType} — {item.amount.toLocaleString("tr-TR")} ₺
                  </Text>
                  <Text style={styles.cardSub}>
                    {item.userName ? `${item.userName} • ` : ""}
                    {new Date(item.createdAt).toLocaleDateString("tr-TR")}
                  </Text>
                </View>
                <StatusBadge status={item.status} />
              </View>
              {item.description ? (
                <Text style={styles.cardBody}>{item.description}</Text>
              ) : null}
              {item.receiptUrl ? (
                <Image
                  source={{ uri: item.receiptUrl }}
                  style={styles.receiptThumb}
                  resizeMode="cover"
                />
              ) : null}
              {canApprove && item.status === "PENDING" && (
                <View style={styles.reviewRow}>
                  <TouchableOpacity
                    style={styles.rejectBtn}
                    onPress={() => handleReview("EXPENSE", item.id, "REJECT")}
                  >
                    <Text style={styles.rejectTxt}>Reddet</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.approveBtn}
                    onPress={() => handleReview("EXPENSE", item.id, "APPROVE")}
                  >
                    <Text style={styles.approveTxt}>Onayla</Text>
                  </TouchableOpacity>
                </View>
              )}
            </GlassCard>
          ))
        )}
      </ScrollView>

      {/* Yeni Talep Modalı */}
      <Modal
        visible={showCreateModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCreateModal(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {tab === "LEAVE"
                  ? "Yeni İzin Talebi"
                  : tab === "ADVANCE"
                  ? "Yeni Avans Talebi"
                  : "Fişli Masraf Beyanı"}
              </Text>
              <TouchableOpacity onPress={() => setShowCreateModal(false)}>
                <Ionicons name="close" size={22} color="#8E8E93" />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={{ gap: 12 }}>
              {tab === "LEAVE" && (
                <>
                  <Text style={styles.label}>İzin Türü</Text>
                  <View style={styles.chipRow}>
                    {["Yıllık İzin", "Mazeret İzni", "Sağlık / Rapor"].map((lt) => (
                      <TouchableOpacity
                        key={lt}
                        style={[
                          styles.chip,
                          leaveType === lt && styles.chipActive,
                        ]}
                        onPress={() => setLeaveType(lt)}
                      >
                        <Text
                          style={[
                            styles.chipTxt,
                            leaveType === lt && styles.chipTxtActive,
                          ]}
                        >
                          {lt}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                  <View style={styles.row2}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.label}>Başlangıç (YYYY-AA-GG)</Text>
                      <TextInput
                        style={styles.input}
                        value={startDate}
                        onChangeText={setStartDate}
                        placeholder="2026-11-20"
                        placeholderTextColor="#6E6E73"
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.label}>Bitiş (YYYY-AA-GG)</Text>
                      <TextInput
                        style={styles.input}
                        value={endDate}
                        onChangeText={setEndDate}
                        placeholder="2026-11-21"
                        placeholderTextColor="#6E6E73"
                      />
                    </View>
                  </View>
                </>
              )}

              {(tab === "ADVANCE" || tab === "EXPENSE") && (
                <>
                  <Text style={styles.label}>Tutar (₺)</Text>
                  <TextInput
                    style={styles.input}
                    value={amount}
                    onChangeText={setAmount}
                    keyboardType="decimal-pad"
                    placeholder="Örn: 2500"
                    placeholderTextColor="#6E6E73"
                  />
                </>
              )}

              {tab === "ADVANCE" && (
                <>
                  <Text style={styles.label}>Kesinti Ayı (YYYY-AA)</Text>
                  <TextInput
                    style={styles.input}
                    value={deductMonth}
                    onChangeText={setDeductMonth}
                    placeholder="2026-12"
                    placeholderTextColor="#6E6E73"
                  />
                </>
              )}

              {tab === "EXPENSE" && (
                <>
                  <Text style={styles.label}>Masraf Kalemi</Text>
                  <View style={styles.chipRow}>
                    {["Saha Malzeme / Fiş", "Yakıt & Ulaşım", "Yemek / Ekip"].map((et) => (
                      <TouchableOpacity
                        key={et}
                        style={[
                          styles.chip,
                          expenseType === et && styles.chipActive,
                        ]}
                        onPress={() => setExpenseType(et)}
                      >
                        <Text
                          style={[
                            styles.chipTxt,
                            expenseType === et && styles.chipTxtActive,
                          ]}
                        >
                          {et}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <Text style={styles.label}>Fiş / Fatura Fotoğrafı</Text>
                  <View style={styles.row2}>
                    <TouchableOpacity
                      style={styles.photoBtn}
                      onPress={() => handleCaptureReceipt("camera")}
                    >
                      <Ionicons name="camera" size={18} color="#0A7AFF" />
                      <Text style={styles.photoBtnTxt}>Kamera ile Çek</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.photoBtn}
                      onPress={() => handleCaptureReceipt("gallery")}
                    >
                      <Ionicons name="image" size={18} color="#34C759" />
                      <Text style={[styles.photoBtnTxt, { color: "#34C759" }]}>
                        Galeriden Seç
                      </Text>
                    </TouchableOpacity>
                  </View>
                  {receiptUrl ? (
                    <Image
                      source={{ uri: receiptUrl }}
                      style={styles.previewImg}
                      resizeMode="cover"
                    />
                  ) : null}
                </>
              )}

              <Text style={styles.label}>Açıklama / Gerekçe</Text>
              <TextInput
                style={[styles.input, { minHeight: 72, textAlignVertical: "top" }]}
                value={reason}
                onChangeText={setReason}
                multiline
                placeholder="Talebe ilişkin notunuzu yazın..."
                placeholderTextColor="#6E6E73"
              />
            </ScrollView>

            <TouchableOpacity
              style={[styles.submitBtn, submitting && { opacity: 0.65 }]}
              onPress={handleSubmit}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.submitBtnTxt}>Talebi Gönder</Text>
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
  topControls: { paddingHorizontal: 16, paddingTop: 10, gap: 10 },
  tabRow: { flexDirection: "row", gap: 8 },
  tabPill: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
  },
  tabPillActive: {
    backgroundColor: "rgba(10,122,255,0.18)",
    borderColor: "#0A7AFF",
  },
  tabText: { color: "#8E8E93", fontSize: 12, fontWeight: "700" },
  tabTextActive: { color: "#FFFFFF" },
  createBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#0A7AFF",
    borderRadius: 12,
    paddingVertical: 12,
  },
  createBtnText: { color: "#FFFFFF", fontSize: 14, fontWeight: "700" },
  scroll: { padding: 16, paddingBottom: 120, gap: 12 },
  card: { gap: 10 },
  cardHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 8,
  },
  cardTitle: { color: "#FFFFFF", fontSize: 15, fontWeight: "700" },
  cardSub: { color: "#8E8E93", fontSize: 12, marginTop: 3 },
  cardBody: { color: "rgba(235,235,245,0.78)", fontSize: 13, lineHeight: 18 },
  receiptThumb: {
    width: "100%",
    height: 120,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  reviewRow: {
    flexDirection: "row",
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.08)",
    paddingTop: 10,
  },
  rejectBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: "rgba(255,59,48,0.16)",
    borderWidth: 1,
    borderColor: "rgba(255,59,48,0.35)",
    alignItems: "center",
  },
  rejectTxt: { color: "#FF453A", fontSize: 13, fontWeight: "700" },
  approveBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: "#34C759",
    alignItems: "center",
  },
  approveTxt: { color: "#FFFFFF", fontSize: 13, fontWeight: "700" },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.72)",
    justifyContent: "flex-end",
  },
  modalCard: {
    backgroundColor: "#111827",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: "88%",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    gap: 14,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
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
  row2: { flexDirection: "row", gap: 10 },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  chipActive: { backgroundColor: "rgba(10,122,255,0.22)", borderColor: "#0A7AFF" },
  chipTxt: { color: "#98A2B3", fontSize: 12, fontWeight: "600" },
  chipTxtActive: { color: "#FFFFFF" },
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
  previewImg: { width: "100%", height: 130, borderRadius: 12 },
  submitBtn: {
    backgroundColor: "#0A7AFF",
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
  },
  submitBtnTxt: { color: "#FFFFFF", fontSize: 15, fontWeight: "700" },
});
