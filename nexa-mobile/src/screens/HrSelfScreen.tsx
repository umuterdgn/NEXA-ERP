/**
 * © 2026 NXA Software. All rights reserved.
 * Nexa ERP Mobil - Personel Özlük, Maaş Bordro, KKD Zimmet İmza & Yemek Menüsü (GET/POST /api/mobile/hr/self)
 */

import React, { useCallback, useEffect, useState } from "react";
import {
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
import { extractErrorMessage, mobileApi } from "../services/apiClient";
import { SignaturePad } from "../components/inspections/SignaturePad";
import {
  AppHeader,
  EmptyState,
  GlassCard,
  ScreenHeader,
  SkeletonList,
  StatusBadge,
} from "../components/ui/NexaUI";
import { iosColors } from "../theme/iosTheme";
import type { HrSelfResponse } from "../types/api";

export default function HrSelfScreen({
  embeddedInTab = false,
}: {
  embeddedInTab?: boolean;
}) {
  const [data, setData] = useState<HrSelfResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showSalary, setShowSalary] = useState(false);

  const [signTarget, setSignTarget] = useState<
    HrSelfResponse["assignedEquipments"][number] | null
  >(null);
  const [signing, setSigning] = useState(false);

  const loadSelf = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      const res = await mobileApi.hr.getSelf();
      setData(res);
    } catch (err: any) {
      Alert.alert("Özlük Bilgileri Alınamadı", extractErrorMessage(err));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadSelf(false);
  }, [loadSelf]);

  const handleConfirmSignature = async (base64Signature: string) => {
    if (!signTarget) return;
    setSigning(true);
    try {
      const res = await mobileApi.hr.signEquipment({
        assignmentId: signTarget.id,
        signatureData: base64Signature,
      });
      Alert.alert("Zimmet Onayı", res.message || "Dijital imzanız kaydedildi.");
      setSignTarget(null);
      await loadSelf(true);
    } catch (err: any) {
      Alert.alert("İmza Kaydedilemedi", extractErrorMessage(err));
    } finally {
      setSigning(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      {embeddedInTab ? (
        <AppHeader title="Özlük, KKD & Yemekhane" />
      ) : (
        <ScreenHeader
          title="Personel Özlük & Zimmet"
          subtitle="Maaş Özeti, KKD Dijital İmza ve Duyurular"
        />
      )}

      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadSelf(true)}
            tintColor="#0A7AFF"
          />
        }
      >
        {loading ? (
          <SkeletonList count={4} />
        ) : !data?.profile ? (
          <EmptyState
            icon="id-card-outline"
            title="Özlük Profili Bulunamadı"
            subtitle="Personel sicil kaydınız henüz oluşturulmamış görünüyor."
          />
        ) : (
          <>
            {/* Personel & Maaş Kartı */}
            <GlassCard style={styles.card}>
              <View style={styles.rowBetween}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.eyebrow}>PERSONEL SİCİL & MAAŞ</Text>
                  <Text style={styles.profileName}>{data.profile.name}</Text>
                  <Text style={styles.profileSub}>
                    {data.profile.personnelNo} • {data.profile.department} /{" "}
                    {data.profile.position}
                  </Text>
                </View>
                <StatusBadge status={data.profile.salaryStatus} />
              </View>

              <View style={styles.salaryBox}>
                <View>
                  <Text style={styles.salaryLabel}>Tanımlı Net / Dönem Ücreti</Text>
                  <Text style={styles.salaryValue}>
                    {showSalary
                      ? `${Number(data.profile.salary || 0).toLocaleString("tr-TR")} ₺`
                      : "•••••• ₺"}
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.eyeBtn}
                  onPress={() => setShowSalary((v) => !v)}
                >
                  <Ionicons
                    name={showSalary ? "eye-off-outline" : "eye-outline"}
                    size={20}
                    color="#3B9EFF"
                  />
                </TouchableOpacity>
              </View>

              <View style={styles.metaGrid}>
                <Text style={styles.metaLine}>
                  Şantiye: <Text style={styles.metaStrong}>{data.profile.project}</Text>
                </Text>
                {data.profile.iban ? (
                  <Text style={styles.metaLine}>
                    IBAN: <Text style={styles.metaStrong}>{data.profile.iban}</Text>
                  </Text>
                ) : null}
                {data.profile.hireDate ? (
                  <Text style={styles.metaLine}>
                    İşe Giriş:{" "}
                    <Text style={styles.metaStrong}>
                      {new Date(data.profile.hireDate).toLocaleDateString("tr-TR")}
                    </Text>
                  </Text>
                ) : null}
              </View>
            </GlassCard>

            {/* Zimmetli Ekipman & KKD */}
            <Text style={styles.sectionTitle}>
              ZİMMETLİ KKD VE EKİPMANLAR ({data.assignedEquipments?.length || 0})
            </Text>
            {(data.assignedEquipments || []).length === 0 ? (
              <GlassCard>
                <Text style={styles.mutedTxt}>
                  Üzerinize zimmetli ekipman veya KKD kaydı bulunmuyor.
                </Text>
              </GlassCard>
            ) : (
              data.assignedEquipments.map((eq) => {
                const needsSign = !["SIGNED", "DELIVERED", "ACTIVE", "APPROVED"].includes(
                  String(eq.status || "").toUpperCase()
                );
                return (
                  <GlassCard key={eq.id} style={styles.card}>
                    <View style={styles.rowBetween}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.itemTitle}>{eq.name}</Text>
                        <Text style={styles.itemSub}>
                          {eq.category} • QR: {eq.qrCode}
                        </Text>
                      </View>
                      <StatusBadge status={eq.status} />
                    </View>
                    {needsSign && (
                      <TouchableOpacity
                        style={styles.signBtn}
                        onPress={() => setSignTarget(eq)}
                      >
                        <Ionicons name="pencil" size={16} color="#FFFFFF" />
                        <Text style={styles.signBtnTxt}>Dijital İmza İle Teslim Al</Text>
                      </TouchableOpacity>
                    )}
                  </GlassCard>
                );
              })
            )}

            {/* Yemekhane Menüsü */}
            <Text style={styles.sectionTitle}>HAFTALIK YEMEKHANE MENÜSÜ</Text>
            {(data.foodMenus || []).length === 0 ? (
              <GlassCard>
                <Text style={styles.mutedTxt}>
                  Aktif haftalık yemek menüsü yayınlanmadı.
                </Text>
              </GlassCard>
            ) : (
              data.foodMenus.map((menu) => (
                <GlassCard key={menu.id} style={styles.card}>
                  <View style={styles.rowBetween}>
                    <Text style={styles.itemTitle}>{menu.dayName}</Text>
                    <Text style={styles.itemSub}>
                      {new Date(menu.date).toLocaleDateString("tr-TR")}
                    </Text>
                  </View>
                  <Text style={styles.menuItems}>
                    {(menu.items || []).join("  •  ") || "Menü detayı girilmedi"}
                  </Text>
                </GlassCard>
              ))
            )}

            {/* Şantiye Duyuruları */}
            <Text style={styles.sectionTitle}>DUYURULAR & İSG BİLDİRİMLERİ</Text>
            {(data.announcements || []).length === 0 ? (
              <GlassCard>
                <Text style={styles.mutedTxt}>Yeni duyuru bulunmuyor.</Text>
              </GlassCard>
            ) : (
              data.announcements.map((ann) => (
                <GlassCard key={ann.id} style={styles.card}>
                  <View style={styles.rowBetween}>
                    <Text style={styles.itemTitle}>{ann.title}</Text>
                    {ann.severity ? <StatusBadge status={ann.severity} /> : null}
                  </View>
                  <Text style={styles.menuItems}>{ann.content}</Text>
                </GlassCard>
              ))
            )}
          </>
        )}
      </ScrollView>

      {/* Dijital Zimmet İmza Modalı */}
      <Modal
        visible={Boolean(signTarget)}
        transparent
        animationType="slide"
        onRequestClose={() => setSignTarget(null)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <SignaturePad
              title={`KKD / Zimmet Teslim İmza`}
              subtitle={signTarget ? `${signTarget.name} (${signTarget.qrCode})` : ""}
              signerName={data?.profile?.name}
              isLoading={signing}
              onConfirm={handleConfirmSignature}
              onClose={() => setSignTarget(null)}
            />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: iosColors.background },
  scroll: { padding: 16, paddingBottom: 120, gap: 12 },
  card: { gap: 10 },
  rowBetween: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  eyebrow: {
    color: "#8E8E93",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.7,
  },
  profileName: { color: "#FFFFFF", fontSize: 18, fontWeight: "800", marginTop: 3 },
  profileSub: { color: "#98A2B3", fontSize: 12, marginTop: 2 },
  salaryBox: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "rgba(10,122,255,0.12)",
    borderWidth: 1,
    borderColor: "rgba(10,122,255,0.3)",
    borderRadius: 14,
    padding: 12,
  },
  salaryLabel: { color: "#98A2B3", fontSize: 12 },
  salaryValue: { color: "#FFFFFF", fontSize: 20, fontWeight: "800", marginTop: 2 },
  eyeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  metaGrid: { gap: 4 },
  metaLine: { color: "#8E8E93", fontSize: 12 },
  metaStrong: { color: "#FFFFFF", fontWeight: "600" },
  sectionTitle: {
    color: "#8E8E93",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.7,
    marginTop: 6,
  },
  mutedTxt: { color: "#8E8E93", fontSize: 13 },
  itemTitle: { color: "#FFFFFF", fontSize: 15, fontWeight: "700" },
  itemSub: { color: "#8E8E93", fontSize: 12, marginTop: 2 },
  signBtn: {
    backgroundColor: "#0A7AFF",
    borderRadius: 10,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  signBtnTxt: { color: "#FFFFFF", fontSize: 13, fontWeight: "700" },
  menuItems: { color: "rgba(235,235,245,0.82)", fontSize: 13, lineHeight: 19 },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.75)",
    justifyContent: "center",
    padding: 16,
  },
  modalCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 22,
    padding: 14,
  },
});
