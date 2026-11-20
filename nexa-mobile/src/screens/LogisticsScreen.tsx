/**
 * © 2026 NXA Software. All rights reserved.
 * Nexa ERP Mobil - Kapı Kontrolü, Mal Kabul, QR Stok Sarfiyat & Malzeme Talebi (GET/POST /api/mobile/logistics)
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
import type { LogisticsResponse } from "../types/api";

type LogisticsTab = "gate" | "qr" | "requests";

export default function LogisticsScreen({
  embeddedInTab = false,
  initialTab = "gate",
}: {
  embeddedInTab?: boolean;
  initialTab?: LogisticsTab;
}) {
  const { activeProject } = useAuth();
  const [tab, setTab] = useState<LogisticsTab>(initialTab);
  const [data, setData] = useState<LogisticsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // QR Sarfiyat Modalı
  const [showQrScanner, setShowQrScanner] = useState(false);
  const [showConsumeModal, setShowConsumeModal] = useState(false);
  const [consumeQr, setConsumeQr] = useState("");
  const [consumeQty, setConsumeQty] = useState("1");

  // Malzeme Talep Modalı
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [itemName, setItemName] = useState("");
  const [reqQty, setReqQty] = useState("1");
  const [unit, setUnit] = useState("Adet");
  const [urgency, setUrgency] = useState<"NORMAL" | "HIGH" | "URGENT">("NORMAL");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const loadLogistics = useCallback(
    async (isRefresh = false) => {
      try {
        if (isRefresh) setRefreshing(true);
        else setLoading(true);
        const res = await mobileApi.logistics.get({
          projectId: activeProject?.id,
          type: "ALL",
        });
        setData(res);
      } catch (err: any) {
        Alert.alert("Lojistik Verileri Alınamadı", extractErrorMessage(err));
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [activeProject?.id]
  );

  useEffect(() => {
    loadLogistics(false);
  }, [loadLogistics]);

  const handleGateAction = async (
    scheduleId: string,
    action: "GATE_CHECKIN" | "RECEIVE_GOODS"
  ) => {
    try {
      const res = await mobileApi.logistics.action({
        action,
        scheduleId,
        projectId: activeProject?.id,
      });
      Alert.alert(
        "Lojistik İşlemi",
        res.message ||
          (action === "GATE_CHECKIN"
            ? "Araç kapı girişi kaydedildi."
            : "Mal kabul işlemi tamamlandı.")
      );
      if (!res.offlineQueued) await loadLogistics(true);
    } catch (err: any) {
      Alert.alert("İşlem Yapılamadı", extractErrorMessage(err));
    }
  };

  const handleConsumeSubmit = async () => {
    const qty = parseFloat(consumeQty.replace(",", "."));
    if (!consumeQr.trim() || isNaN(qty) || qty <= 0) {
      Alert.alert("Eksik Bilgi", "Geçerli stok QR kodu ve miktar girmelisiniz.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await mobileApi.logistics.action({
        action: "CONSUME_QR",
        qrCode: consumeQr.trim(),
        quantity: qty,
        projectId: activeProject?.id,
      });
      Alert.alert(
        "Stok Çıkışı",
        res.message || `Sarfiyat kaydedildi. Kalan stok: ${res.remainingQuantity ?? "-"}`
      );
      setShowConsumeModal(false);
      setConsumeQr("");
      setConsumeQty("1");
      if (!res.offlineQueued) await loadLogistics(true);
    } catch (err: any) {
      Alert.alert("Sarfiyat Başarısız", extractErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateRequest = async () => {
    const qty = parseFloat(reqQty.replace(",", "."));
    if (!itemName.trim() || isNaN(qty) || qty <= 0) {
      Alert.alert("Eksik Bilgi", "Malzeme adı ve miktarı zorunludur.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await mobileApi.logistics.action({
        action: "CREATE_REQUEST",
        itemName: itemName.trim(),
        quantity: qty,
        unit: unit.trim() || "Adet",
        urgency,
        description: description.trim() || undefined,
        projectId: activeProject?.id,
      });
      Alert.alert("Malzeme Talebi", res.message || "Talebiniz satınalma/ambara iletildi.");
      setShowRequestModal(false);
      setItemName("");
      setDescription("");
      if (!res.offlineQueued) await loadLogistics(true);
    } catch (err: any) {
      Alert.alert("Talep Oluşturulamadı", extractErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const appointments = data?.appointments || [];
  const inventory = data?.inventory || [];
  const requests = data?.requests || [];

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      {embeddedInTab ? (
        <AppHeader title="Lojistik & Ambar Yönetimi" />
      ) : (
        <ScreenHeader
          title="Ambar, Kapı & QR Stok"
          subtitle={activeProject?.name || "Canlı Sevkiyat & Stok Takibi"}
        />
      )}

      <View style={styles.topControls}>
        <View style={styles.tabRow}>
          {(
            [
              { key: "gate", label: `Kapı/Mal Kabul (${appointments.length})` },
              { key: "qr", label: `QR Stok (${inventory.length})` },
              { key: "requests", label: `Talepler (${requests.length})` },
            ] as const
          ).map((t) => {
            const active = tab === t.key;
            return (
              <TouchableOpacity
                key={t.key}
                style={[styles.tabPill, active && styles.tabPillActive]}
                onPress={() => setTab(t.key)}
              >
                <Text style={[styles.tabText, active && styles.tabTextActive]}>
                  {t.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {tab === "qr" && (
          <View style={styles.row2}>
            <TouchableOpacity
              style={[styles.actionBtn, { flex: 1 }]}
              onPress={() => setShowQrScanner(true)}
            >
              <Ionicons name="qr-code-outline" size={18} color="#FFFFFF" />
              <Text style={styles.actionBtnTxt}>QR Okut & Sarf Et</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.secondaryBtn]}
              onPress={() => setShowConsumeModal(true)}
            >
              <Ionicons name="create-outline" size={18} color="#3B9EFF" />
              <Text style={styles.secondaryBtnTxt}>Manuel</Text>
            </TouchableOpacity>
          </View>
        )}

        {tab === "requests" && (
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => setShowRequestModal(true)}
          >
            <Ionicons name="cube-outline" size={18} color="#FFFFFF" />
            <Text style={styles.actionBtnTxt}>Yeni Malzeme Talebi Oluştur</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadLogistics(true)}
            tintColor="#0A7AFF"
          />
        }
      >
        {loading ? (
          <SkeletonList count={4} />
        ) : tab === "gate" ? (
          appointments.length === 0 ? (
            <EmptyState
              icon="car-outline"
              title="Planlı Sevkiyat Bulunmuyor"
              subtitle="Aktif şantiye için beklenen araç randevusu yok."
            />
          ) : (
            appointments.map((app) => (
              <GlassCard key={app.id} style={styles.card}>
                <View style={styles.rowBetween}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.cardTitle}>
                      {app.plateNumber || "Plaka Belirtilmedi"} •{" "}
                      {app.materialType || "Malzeme Sevkiyatı"}
                    </Text>
                    <Text style={styles.cardSub}>
                      {app.supplierName || "Tedarikçi"} • Şoför:{" "}
                      {app.driverName || "-"}
                    </Text>
                    <Text style={styles.cardSub}>
                      Varış:{" "}
                      {new Date(app.estimatedArrival).toLocaleString("tr-TR", {
                        day: "2-digit",
                        month: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </Text>
                  </View>
                  <StatusBadge status={app.status} />
                </View>

                <View style={styles.row2}>
                  <TouchableOpacity
                    style={styles.gateBtn}
                    onPress={() => handleGateAction(app.id, "GATE_CHECKIN")}
                  >
                    <Ionicons name="enter-outline" size={16} color="#3B9EFF" />
                    <Text style={styles.gateBtnTxt}>Kapı Girişi</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.receiveBtn}
                    onPress={() => handleGateAction(app.id, "RECEIVE_GOODS")}
                  >
                    <Ionicons name="checkmark-done" size={16} color="#FFFFFF" />
                    <Text style={styles.receiveBtnTxt}>Mal Kabul Onayla</Text>
                  </TouchableOpacity>
                </View>
              </GlassCard>
            ))
          )
        ) : tab === "qr" ? (
          inventory.length === 0 ? (
            <EmptyState
              icon="cube-outline"
              title="Ambar Stoğu Boş"
              subtitle="Aktif projeye tanımlı malzeme stoku bulunamadı."
            />
          ) : (
            inventory.map((inv) => (
              <GlassCard key={inv.id} style={styles.card}>
                <View style={styles.rowBetween}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.cardTitle}>{inv.name}</Text>
                    <Text style={styles.cardSub}>
                      {inv.category || "Genel"} • QR: {inv.qrCode || "-"}
                    </Text>
                  </View>
                  <View style={{ alignItems: "flex-end", gap: 4 }}>
                    <Text style={styles.stockQty}>
                      {inv.quantity} {inv.unit}
                    </Text>
                    {inv.isLowStock && <StatusBadge status="CRITICAL" label="KRİTİK STOK" />}
                  </View>
                </View>
                {inv.qrCode ? (
                  <TouchableOpacity
                    style={styles.consumeQuickBtn}
                    onPress={() => {
                      setConsumeQr(inv.qrCode || "");
                      setConsumeQty("1");
                      setShowConsumeModal(true);
                    }}
                  >
                    <Ionicons name="remove-circle-outline" size={16} color="#FF9F0A" />
                    <Text style={styles.consumeQuickTxt}>Stoktan Sarf Et</Text>
                  </TouchableOpacity>
                ) : null}
              </GlassCard>
            ))
          )
        ) : requests.length === 0 ? (
          <EmptyState
            icon="clipboard-outline"
            title="Malzeme Talebi Yok"
            subtitle="Yeni malzeme ihtiyacı oluşturmak için yukarıdaki butonu kullanın."
          />
        ) : (
          requests.map((req) => (
            <GlassCard key={req.id} style={styles.card}>
              <View style={styles.rowBetween}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardTitle}>
                    {req.itemName} ({req.quantity} {req.unit})
                  </Text>
                  <Text style={styles.cardSub}>
                    {req.requester || "Personel"} •{" "}
                    {new Date(req.createdAt).toLocaleDateString("tr-TR")}
                  </Text>
                </View>
                <View style={{ alignItems: "flex-end", gap: 4 }}>
                  <StatusBadge status={req.status} />
                  <StatusBadge status={req.urgency} />
                </View>
              </View>
            </GlassCard>
          ))
        )}
      </ScrollView>

      {/* QR Okuyucu */}
      <Modal
        visible={showQrScanner}
        animationType="slide"
        onRequestClose={() => setShowQrScanner(false)}
      >
        <QRScanner
          title="Ambar QR Stok Tarayıcı"
          subtitle="Malzeme etiketindeki QR kodu okutun"
          onScan={(code) => {
            setShowQrScanner(false);
            setConsumeQr(code.trim());
            setShowConsumeModal(true);
          }}
          onClose={() => setShowQrScanner(false)}
        />
      </Modal>

      {/* Stok Sarfiyat Modalı */}
      <Modal
        visible={showConsumeModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowConsumeModal(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>QR Stok Çıkışı / Sarfiyat</Text>
            <Text style={styles.label}>Malzeme QR Kodu</Text>
            <TextInput
              style={styles.input}
              value={consumeQr}
              onChangeText={setConsumeQr}
              placeholder="QR-MAT-..."
              placeholderTextColor="#6E6E73"
            />
            <Text style={styles.label}>Sarf Miktarı</Text>
            <TextInput
              style={styles.input}
              value={consumeQty}
              onChangeText={setConsumeQty}
              keyboardType="decimal-pad"
              placeholder="1"
              placeholderTextColor="#6E6E73"
            />
            <View style={styles.row2}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setShowConsumeModal(false)}
              >
                <Text style={styles.cancelTxt}>Vazgeç</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.confirmBtn}
                onPress={handleConsumeSubmit}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.confirmTxt}>Stoktan Düş</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Malzeme Talep Modalı */}
      <Modal
        visible={showRequestModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowRequestModal(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Yeni Malzeme Talebi</Text>
            <Text style={styles.label}>Malzeme / Ekipman Adı</Text>
            <TextInput
              style={styles.input}
              value={itemName}
              onChangeText={setItemName}
              placeholder="Örn: C30 Hazır Beton / Nervürlü Demir 12mm"
              placeholderTextColor="#6E6E73"
            />
            <View style={styles.row2}>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>Miktar</Text>
                <TextInput
                  style={styles.input}
                  value={reqQty}
                  onChangeText={setReqQty}
                  keyboardType="decimal-pad"
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>Birim</Text>
                <TextInput
                  style={styles.input}
                  value={unit}
                  onChangeText={setUnit}
                  placeholder="Adet / m3 / Ton"
                  placeholderTextColor="#6E6E73"
                />
              </View>
            </View>
            <Text style={styles.label}>Aciliyet</Text>
            <View style={styles.row2}>
              {(["NORMAL", "HIGH", "URGENT"] as const).map((u) => (
                <TouchableOpacity
                  key={u}
                  style={[
                    styles.urgencyChip,
                    urgency === u && styles.urgencyChipActive,
                  ]}
                  onPress={() => setUrgency(u)}
                >
                  <Text
                    style={[
                      styles.urgencyTxt,
                      urgency === u && { color: "#FFFFFF" },
                    ]}
                  >
                    {u === "NORMAL" ? "Normal" : u === "HIGH" ? "Yüksek" : "Acil"}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <TextInput
              style={[styles.input, { minHeight: 64, textAlignVertical: "top" }]}
              value={description}
              onChangeText={setDescription}
              multiline
              placeholder="Kullanım yeri veya ekstra notlar..."
              placeholderTextColor="#6E6E73"
            />
            <View style={styles.row2}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setShowRequestModal(false)}
              >
                <Text style={styles.cancelTxt}>Vazgeç</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.confirmBtn}
                onPress={handleCreateRequest}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.confirmTxt}>Talep Gönder</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: iosColors.background },
  topControls: { paddingHorizontal: 16, paddingTop: 10, gap: 10 },
  tabRow: { flexDirection: "row", gap: 6 },
  tabPill: {
    flex: 1,
    paddingVertical: 9,
    paddingHorizontal: 4,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
  },
  tabPillActive: { backgroundColor: "rgba(10,122,255,0.18)", borderColor: "#0A7AFF" },
  tabText: { color: "#8E8E93", fontSize: 11, fontWeight: "700", textAlign: "center" },
  tabTextActive: { color: "#FFFFFF" },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#0A7AFF",
    borderRadius: 12,
    paddingVertical: 12,
  },
  actionBtnTxt: { color: "#FFFFFF", fontSize: 14, fontWeight: "700" },
  secondaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: "rgba(10,122,255,0.14)",
    borderWidth: 1,
    borderColor: "rgba(10,122,255,0.35)",
  },
  secondaryBtnTxt: { color: "#3B9EFF", fontSize: 13, fontWeight: "700" },
  scroll: { padding: 16, paddingBottom: 120, gap: 12 },
  card: { gap: 10 },
  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 8,
  },
  row2: { flexDirection: "row", gap: 10 },
  cardTitle: { color: "#FFFFFF", fontSize: 15, fontWeight: "700" },
  cardSub: { color: "#8E8E93", fontSize: 12, marginTop: 2 },
  stockQty: { color: "#FFFFFF", fontSize: 16, fontWeight: "800" },
  gateBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: "rgba(10,122,255,0.14)",
    borderWidth: 1,
    borderColor: "rgba(10,122,255,0.3)",
  },
  gateBtnTxt: { color: "#3B9EFF", fontSize: 13, fontWeight: "700" },
  receiveBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: "#34C759",
  },
  receiveBtnTxt: { color: "#FFFFFF", fontSize: 13, fontWeight: "700" },
  consumeQuickBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 9,
    borderRadius: 10,
    backgroundColor: "rgba(255,149,0,0.14)",
    borderWidth: 1,
    borderColor: "rgba(255,149,0,0.35)",
  },
  consumeQuickTxt: { color: "#FF9F0A", fontSize: 13, fontWeight: "700" },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.75)",
    justifyContent: "center",
    padding: 18,
  },
  modalCard: {
    backgroundColor: "#111827",
    borderRadius: 20,
    padding: 18,
    gap: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  modalTitle: { color: "#FFFFFF", fontSize: 17, fontWeight: "800" },
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
  urgencyChip: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.06)",
    alignItems: "center",
  },
  urgencyChipActive: { backgroundColor: "#0A7AFF" },
  urgencyTxt: { color: "#98A2B3", fontSize: 12, fontWeight: "700" },
  cancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
  },
  cancelTxt: { color: "#FFFFFF", fontSize: 14, fontWeight: "700" },
  confirmBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: "#0A7AFF",
    alignItems: "center",
  },
  confirmTxt: { color: "#FFFFFF", fontSize: 14, fontWeight: "700" },
});
