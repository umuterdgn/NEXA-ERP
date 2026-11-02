import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Modal,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Image,
  ScrollView,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import * as Network from "expo-network";
import { useAuth } from "../../src/hooks/useAuth";
import { useNetworkSync } from "../../src/hooks";
import { api } from "../../src/lib/api";
import { OfflineQueue } from "../../src/services/OfflineQueue";
import { SignaturePad } from "../../src/components/inspections/SignaturePad";

/**
 * Kritik İmalat Kaydı Arayüzü (DailyLog / Inspection)
 */
export interface CriticalInspectionItem {
  id: string;
  element: string; // Örn: "A Blok 3. Kat Kolon Betonu"
  projectName: string;
  projectCode: string;
  type: "CONCRETE" | "REINFORCEMENT" | "SLAB" | "FOUNDATION";
  concreteClass?: string; // Örn: "C35/45"
  volumeM3?: number;
  slumpCm?: number;
  reinforcementDetails?: string; // Örn: "Q16-Q20 B420C Çift Sıra Donatı"
  contractorName: string;
  scheduledTime: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  inspectorSignature?: string | null;
  signedAt?: string | null;
  dailyLogId?: string;
  notes?: string;
}

// Varsayılan mockup veriler (Backend boşsa veya offline modda)
const INITIAL_INSPECTIONS: CriticalInspectionItem[] = [
  {
    id: "insp_log_001",
    element: "A Blok 3. Kat Kolon Betonu",
    projectName: "Nexa Vista Towers",
    projectCode: "PRJ-2026-A",
    type: "CONCRETE",
    concreteClass: "C35/45 S4",
    volumeM3: 145,
    slumpCm: 18,
    contractorName: "Zirve Yapı Ltd.",
    scheduledTime: "Bugün, 11:30",
    status: "PENDING",
    notes: "Kalıp terazisi ve paspayları saha mühendisi tarafından kontrol edildi.",
  },
  {
    id: "insp_log_002",
    element: "B Blok Temel Donatı & Paspayı Kontrolü",
    projectName: "Marina Park Rezidans",
    projectCode: "PRJ-2026-B",
    type: "REINFORCEMENT",
    reinforcementDetails: "Ø20-Ø25 B420C Çift Hasır Donatı",
    contractorName: "Ege İnşaat A.Ş.",
    scheduledTime: "Bugün, 14:00",
    status: "PENDING",
    notes: "Topraklama şeridi çekilmiş, kolon filizleri projeye uygun.",
  },
  {
    id: "insp_log_003",
    element: "C Blok 1. Kat Tabliye & Kiriş Donatısı",
    projectName: "Nexa Vista Towers",
    projectCode: "PRJ-2026-A",
    type: "REINFORCEMENT",
    reinforcementDetails: "Ø16 Pilye Donatıları & Çiroz Bağları",
    contractorName: "Zirve Yapı Ltd.",
    scheduledTime: "Yarın, 09:00",
    status: "PENDING",
    notes: "Kiriş donatı bindirme boyları şartnameye uygun kontrol edilecek.",
  },
  {
    id: "insp_log_004",
    element: "İstinat Duvarı C30 Perde Betonu",
    projectName: "Göl Vadi Villaları",
    projectCode: "PRJ-2026-C",
    type: "CONCRETE",
    concreteClass: "C30/37",
    volumeM3: 82,
    slumpCm: 16,
    contractorName: "Mega Altyapı",
    scheduledTime: "Dün, 16:30",
    status: "APPROVED",
    signedAt: "01.11.2026 17:15",
    inspectorSignature:
      "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
    notes: "Beton vibratör uygulaması denetlendi. İrsaliyeler kontrol edildi.",
  },
];

export default function InspectionsScreen() {
  const { user, role } = useAuth();
  const [inspections, setInspections] =
    useState<CriticalInspectionItem[]>(INITIAL_INSPECTIONS);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [filterType, setFilterType] = useState<"ALL" | "CONCRETE" | "REINFORCEMENT">(
    "ALL"
  );

  // Bottom Sheet / Modal Durumu
  const [selectedItem, setSelectedItem] =
    useState<CriticalInspectionItem | null>(null);
  const [isSheetVisible, setIsSheetVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Başarı Bildirimi Toast State
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // 1. Yetki Kontrolü: Yalnızca INSPECTOR ve ADMIN rollerine açık
  const isAuthorized = role === "INSPECTOR" || role === "ADMIN";
  if (!isAuthorized) {
    return null;
  }

  // Backend'den Onay Bekleyen Jurnal / İmalat Listesini Çek
  const fetchInspections = useCallback(async () => {
    try {
      setIsLoading(true);
      // Backend DailyLog ve Inspection API'lerini sorgula
      const response = await api.get("/site-diary/logs", {
        params: { status: "PENDING_INSPECTION" },
      });

      if (response.data && Array.isArray(response.data) && response.data.length > 0) {
        // Backend DailyLog verilerini ekrana uyarla
        const mapped: CriticalInspectionItem[] = response.data.map((log: any) => ({
          id: log.id,
          element: log.activities || "Kritik İmalat Dökümü",
          projectName: log.project?.name || "Şantiye Projesi",
          projectCode: log.project?.code || "PRJ",
          type:
            log.activities?.toLowerCase().includes("demir") ||
            log.activities?.toLowerCase().includes("donatı")
              ? "REINFORCEMENT"
              : "CONCRETE",
          concreteClass: log.activities?.includes("C35")
            ? "C35/45"
            : log.activities?.includes("C30")
            ? "C30/37"
            : undefined,
          contractorName: "Ana Yüklenici",
          scheduledTime: log.date
            ? new Date(log.date).toLocaleDateString("tr-TR")
            : "Bugün",
          status: log.inspectorSignature ? "APPROVED" : "PENDING",
          inspectorSignature: log.inspectorSignature,
          signedAt: log.inspectorSignedAt,
          notes: log.notes,
        }));

        setInspections(mapped);
      }
    } catch (err) {
      console.warn(
        "[Inspections] Backend veri çekme hatası (Yerel mockup aktif):",
        err
      );
      // Çevrimdışı veya demo esnasında varsayılan mockup korunur
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchInspections();
  }, [fetchInspections]);

  const onRefresh = () => {
    setIsRefreshing(true);
    fetchInspections();
  };

  // Kalem simgesine tıklandığında Bottom Sheet aç
  const handleOpenSignatureSheet = (item: CriticalInspectionItem) => {
    setSelectedItem(item);
    setIsSheetVisible(true);
  };

  // Bottom Sheet'i kapat
  const handleCloseSheet = () => {
    setIsSheetVisible(false);
    setSelectedItem(null);
  };

  // Dijital İmza Onaylandı: Backend DailyLog'a inspectorSignature olarak PATCH et (ADIM 4)
  const handleConfirmSignature = async (base64Signature: string) => {
    if (!selectedItem) return;

    try {
      setIsSubmitting(true);

      const signaturePayload = {
        inspectorSignature: base64Signature,
        inspectorId: user?.id,
        notes: selectedItem.notes
          ? `${selectedItem.notes} (Denetçi e-İmzası alındı)`
          : "Yapı denetim döküm onayı verildi.",
      };

      // ADIM 4: İstek atılmadan önce interneti kontrol et
      const netState = await Network.getNetworkStateAsync();
      const hasInternet = Boolean(netState.isConnected);

      if (!hasInternet) {
        // İnternet yok: OfflineQueue.addToQueue ile cihaza kaydet ve yeşil uyarı bas
        await OfflineQueue.addToQueue(
          `/site-diary/logs/${selectedItem.id}`,
          signaturePayload,
          "PATCH",
          {
            type: "SIGNATURE",
            title: `e-İmza: ${selectedItem.element}`,
          }
        );

        setSuccessMessage(
          "İnternet bağlantısı yok. Veriler cihaza kaydedildi, bağlantı sağlandığında otomatik gönderilecek."
        );
        setTimeout(() => setSuccessMessage(null), 6000);

        Alert.alert(
          "🌐 Çevrimdışı Kayıt",
          "İnternet bağlantısı yok. Veriler cihaza kaydedildi, bağlantı sağlandığında otomatik gönderilecek."
        );
      } else {
        // İnternet var: Backend API İsteği gönder
        try {
          await api.patch(`/site-diary/logs/${selectedItem.id}`, signaturePayload);
          setSuccessMessage(
            `✅ ${selectedItem.element} için dijital onay imzalandı ve sisteme işlendi.`
          );
          setTimeout(() => setSuccessMessage(null), 4500);
        } catch (apiErr: any) {
          console.warn("[Inspections] API hatası, offline kuyruğa aktarılıyor:", apiErr?.message);
          await OfflineQueue.addToQueue(
            `/site-diary/logs/${selectedItem.id}`,
            signaturePayload,
            "PATCH",
            {
              type: "SIGNATURE",
              title: `e-İmza: ${selectedItem.element}`,
            }
          );

          setSuccessMessage(
            "İnternet bağlantısı yok. Veriler cihaza kaydedildi, bağlantı sağlandığında otomatik gönderilecek."
          );
          setTimeout(() => setSuccessMessage(null), 6000);

          Alert.alert(
            "🌐 Çevrimdışı Kayıt",
            "İnternet bağlantısı yok. Veriler cihaza kaydedildi, bağlantı sağlandığında otomatik gönderilecek."
          );
        }
      }

      // Yerel durum listesini güncelle
      const nowStr = new Date().toLocaleString("tr-TR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });

      setInspections((prev) =>
        prev.map((it) =>
          it.id === selectedItem.id
            ? {
                ...it,
                status: "APPROVED",
                inspectorSignature: base64Signature,
                signedAt: nowStr,
              }
            : it
        )
      );

      // Bottom Sheet'i kapat
      handleCloseSheet();
    } catch (err: any) {
      Alert.alert(
        "İmza Hatası",
        "İmza işlenirken bir hata oluştu: " +
          (err?.message || "Lütfen tekrar deneyiniz.")
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filtrelenmiş liste
  const filteredList = inspections.filter((item) => {
    if (filterType === "ALL") return true;
    return item.type === filterType;
  });

  const pendingCount = inspections.filter((i) => i.status === "PENDING").length;
  const approvedCount = inspections.filter((i) => i.status === "APPROVED").length;

  return (
    <View style={styles.screen}>
      {/* iOS Tarzı Büyük Başlık & Denetçi Rozeti */}
      <View style={styles.header}>
        <View style={styles.headerTopRow}>
          <View style={styles.roleBadge}>
            <Feather name="shield" size={12} color="#10B981" />
            <Text style={styles.roleBadgeText}>YAPI DENETİM PORTALI</Text>
          </View>
          <View style={styles.inspectorInfo}>
            <Text style={styles.inspectorNameText}>{user?.name}</Text>
          </View>
        </View>

        <Text style={styles.mainTitle}>Kritik İmalat Onayları</Text>
        <Text style={styles.subtitle}>
          Beton dökümü ve donatı kontrolleri için dijital e-İmza vize alanı
        </Text>

        {/* İstatistik Sayaçları */}
        <View style={styles.statsRow}>
          <View style={[styles.statCard, styles.statCardPending]}>
            <Text style={styles.statNumber}>{pendingCount}</Text>
            <Text style={styles.statLabel}>Onay Bekleyen</Text>
          </View>
          <View style={[styles.statCard, styles.statCardApproved]}>
            <Text style={styles.statNumber}>{approvedCount}</Text>
            <Text style={styles.statLabel}>İmzalanan</Text>
          </View>
          <View style={[styles.statCard, styles.statCardTotal]}>
            <Text style={styles.statNumber}>{inspections.length}</Text>
            <Text style={styles.statLabel}>Toplam İmalat</Text>
          </View>
        </View>

        {/* Filtre Butonları */}
        <View style={styles.filterRow}>
          <TouchableOpacity
            onPress={() => setFilterType("ALL")}
            style={[
              styles.filterChip,
              filterType === "ALL" && styles.filterChipActive,
            ]}
          >
            <Text
              style={[
                styles.filterChipText,
                filterType === "ALL" && styles.filterChipTextActive,
              ]}
            >
              Tümü ({inspections.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setFilterType("CONCRETE")}
            style={[
              styles.filterChip,
              filterType === "CONCRETE" && styles.filterChipActive,
            ]}
          >
            <Text
              style={[
                styles.filterChipText,
                filterType === "CONCRETE" && styles.filterChipTextActive,
              ]}
            >
              Beton Dökümü
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setFilterType("REINFORCEMENT")}
            style={[
              styles.filterChip,
              filterType === "REINFORCEMENT" && styles.filterChipActive,
            ]}
          >
            <Text
              style={[
                styles.filterChipText,
                filterType === "REINFORCEMENT" && styles.filterChipTextActive,
              ]}
            >
              Demir & Donatı
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Başarı Bildirimi Toast */}
      {successMessage && (
        <View style={styles.toastContainer}>
          <Text style={styles.toastText}>{successMessage}</Text>
        </View>
      )}

      {/* İmalat Listesi */}
      <FlatList
        data={filteredList}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            tintColor="#3B82F6"
          />
        }
        ListEmptyComponent={
          isLoading ? (
            <View style={styles.emptyContainer}>
              <ActivityIndicator size="large" color="#3B82F6" />
              <Text style={styles.emptyText}>İmalatlar yükleniyor...</Text>
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <Feather name="check-circle" size={40} color="#6B7280" />
              <Text style={styles.emptyTitle}>Onay Bekleyen İmalat Yok</Text>
              <Text style={styles.emptyText}>
                Tüm kritik beton ve donatı vize işlemleri tamamlandı.
              </Text>
            </View>
          )
        }
        renderItem={({ item }) => {
          const isPending = item.status === "PENDING";
          const isConcrete = item.type === "CONCRETE";

          return (
            <View style={styles.card}>
              {/* Kart Üst Bilgi Satırı */}
              <View style={styles.cardHeader}>
                <View style={styles.typeTag}>
                  <Feather
                    name={isConcrete ? "box" : "grid"}
                    size={12}
                    color={isConcrete ? "#60A5FA" : "#F59E0B"}
                  />
                  <Text
                    style={[
                      styles.typeTagText,
                      { color: isConcrete ? "#93C5FD" : "#FCD34D" },
                    ]}
                  >
                    {isConcrete ? "BETON DÖKÜMÜ" : "DONATI VİZESİ"}
                  </Text>
                </View>

                {/* Onay Durum Rozeti */}
                <View
                  style={[
                    styles.statusBadge,
                    isPending
                      ? styles.statusBadgePending
                      : styles.statusBadgeApproved,
                  ]}
                >
                  <View
                    style={[
                      styles.statusDot,
                      { backgroundColor: isPending ? "#F59E0B" : "#10B981" },
                    ]}
                  />
                  <Text
                    style={[
                      styles.statusText,
                      { color: isPending ? "#FCD34D" : "#34D399" },
                    ]}
                  >
                    {isPending ? "Onay Bekliyor" : "Onaylandı"}
                  </Text>
                </View>
              </View>

              {/* İmalat Başlığı & Proje */}
              <Text style={styles.itemTitle}>{item.element}</Text>
              <View style={styles.projectRow}>
                <Feather name="map-pin" size={13} color="#9CA3AF" />
                <Text style={styles.projectText}>
                  {item.projectName} ({item.projectCode})
                </Text>
              </View>

              {/* Teknik Detaylar (Beton Sınıfı / Donatı Çapı) */}
              <View style={styles.detailsGrid}>
                {item.concreteClass && (
                  <View style={styles.detailBadge}>
                    <Text style={styles.detailBadgeLabel}>Beton Sınıfı</Text>
                    <Text style={styles.detailBadgeValue}>
                      {item.concreteClass}
                    </Text>
                  </View>
                )}
                {item.volumeM3 && (
                  <View style={styles.detailBadge}>
                    <Text style={styles.detailBadgeLabel}>Miktar</Text>
                    <Text style={styles.detailBadgeValue}>
                      {item.volumeM3} m³
                    </Text>
                  </View>
                )}
                {item.slumpCm && (
                  <View style={styles.detailBadge}>
                    <Text style={styles.detailBadgeLabel}>Slump</Text>
                    <Text style={styles.detailBadgeValue}>{item.slumpCm} cm</Text>
                  </View>
                )}
                {item.reinforcementDetails && (
                  <View style={[styles.detailBadge, { flex: 1 }]}>
                    <Text style={styles.detailBadgeLabel}>Donatı Tipi</Text>
                    <Text
                      style={styles.detailBadgeValue}
                      numberOfLines={1}
                      ellipsizeMode="tail"
                    >
                      {item.reinforcementDetails}
                    </Text>
                  </View>
                )}
              </View>

              {/* Alt Bilgi & İmzala Butonu */}
              <View style={styles.cardFooter}>
                <View style={styles.footerInfo}>
                  <View style={styles.timeRow}>
                    <Feather name="clock" size={12} color="#9CA3AF" />
                    <Text style={styles.timeText}>{item.scheduledTime}</Text>
                  </View>
                  <Text style={styles.contractorText}>
                    Yüklenici: {item.contractorName}
                  </Text>
                </View>

                {/* Aksiyon: Kalem Butonu (Bottom Sheet Açar) */}
                {isPending ? (
                  <TouchableOpacity
                    onPress={() => handleOpenSignatureSheet(item)}
                    style={styles.btnSign}
                    activeOpacity={0.8}
                  >
                    <Feather name="edit-3" size={16} color="#FFFFFF" />
                    <Text style={styles.btnSignText}>İmzala</Text>
                  </TouchableOpacity>
                ) : (
                  <View style={styles.signedStamp}>
                    <Feather name="check" size={14} color="#10B981" />
                    <Text style={styles.signedStampText}>
                      İmzalandı ({item.signedAt || "Onaylı"})
                    </Text>
                  </View>
                )}
              </View>

              {/* İmzalanmışsa İmza Önizleme Çizgisi */}
              {!isPending && item.inspectorSignature && (
                <View style={styles.signaturePreviewBox}>
                  <Text style={styles.signaturePreviewLabel}>
                    Elektronik İmza Kaydı:
                  </Text>
                  <Image
                    source={{ uri: item.inspectorSignature }}
                    style={styles.signatureThumb}
                    resizeMode="contain"
                  />
                </View>
              )}
            </View>
          );
        }}
      />

      {/* ADIM 2: Alt Kısımdan Açılan Bottom Sheet (Modal) */}
      <Modal
        visible={isSheetVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={handleCloseSheet}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={handleCloseSheet}
          />

          <View style={styles.sheetContainer}>
            {/* Sheet Tutamağı (Handle Bar) */}
            <View style={styles.sheetHandle} />

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.sheetScrollContent}
            >
              {selectedItem && (
                <View style={styles.sheetItemOverview}>
                  <Text style={styles.sheetItemElement}>
                    {selectedItem.element}
                  </Text>
                  <Text style={styles.sheetItemProject}>
                    {selectedItem.projectName} • {selectedItem.contractorName}
                  </Text>
                  {selectedItem.concreteClass && (
                    <Text style={styles.sheetItemSpec}>
                      Tasarım Sınıfı: {selectedItem.concreteClass} (
                      {selectedItem.volumeM3} m³)
                    </Text>
                  )}
                </View>
              )}

              {/* SignaturePad Bileşeni */}
              <SignaturePad
                title="Şantiye İmalat e-İmza Onayı"
                subtitle="Bu imza ile şantiyedeki beton/demir imalatının projeye ve deprem yönetmeliğine uygunluğu vize edilir."
                signerName={user?.name}
                onConfirm={handleConfirmSignature}
                onClose={handleCloseSheet}
                isLoading={isSubmitting}
                canvasHeight={240}
              />
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#111827", // gray-900
  },
  header: {
    paddingTop: 54,
    paddingHorizontal: 18,
    paddingBottom: 14,
    backgroundColor: "#1F2937", // gray-800
    borderBottomWidth: 1,
    borderBottomColor: "#374151",
  },
  headerTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  roleBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(16, 185, 129, 0.15)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(16, 185, 129, 0.3)",
    gap: 5,
  },
  roleBadgeText: {
    color: "#34D399",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  inspectorInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  inspectorNameText: {
    color: "#93C5FD",
    fontSize: 12,
    fontWeight: "600",
  },
  mainTitle: {
    color: "#FFFFFF",
    fontSize: 24,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  subtitle: {
    color: "#9CA3AF",
    fontSize: 13,
    marginTop: 2,
  },
  statsRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 14,
  },
  statCard: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 12,
    alignItems: "center",
  },
  statCardPending: {
    backgroundColor: "rgba(245, 158, 11, 0.12)",
    borderWidth: 1,
    borderColor: "rgba(245, 158, 11, 0.25)",
  },
  statCardApproved: {
    backgroundColor: "rgba(16, 185, 129, 0.12)",
    borderWidth: 1,
    borderColor: "rgba(16, 185, 129, 0.25)",
  },
  statCardTotal: {
    backgroundColor: "#374151",
  },
  statNumber: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "700",
  },
  statLabel: {
    color: "#9CA3AF",
    fontSize: 10,
    fontWeight: "600",
    marginTop: 2,
  },
  filterRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 14,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: "#374151",
  },
  filterChipActive: {
    backgroundColor: "#3B82F6",
  },
  filterChipText: {
    color: "#D1D5DB",
    fontSize: 12,
    fontWeight: "600",
  },
  filterChipTextActive: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  toastContainer: {
    backgroundColor: "rgba(16, 185, 129, 0.95)",
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginHorizontal: 16,
    marginTop: 10,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  toastText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "600",
    textAlign: "center",
  },
  listContent: {
    padding: 16,
    paddingBottom: 40,
    gap: 14,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    gap: 10,
  },
  emptyTitle: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  emptyText: {
    color: "#9CA3AF",
    fontSize: 13,
    textAlign: "center",
    paddingHorizontal: 32,
  },
  card: {
    backgroundColor: "#1F2937",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#374151",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  typeTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  typeTagText: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    gap: 5,
  },
  statusBadgePending: {
    backgroundColor: "rgba(245, 158, 11, 0.15)",
  },
  statusBadgeApproved: {
    backgroundColor: "rgba(16, 185, 129, 0.15)",
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 11,
    fontWeight: "700",
  },
  itemTitle: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
    lineHeight: 22,
  },
  projectRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: 4,
  },
  projectText: {
    color: "#9CA3AF",
    fontSize: 12,
  },
  detailsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 12,
  },
  detailBadge: {
    backgroundColor: "#111827",
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#374151",
  },
  detailBadgeLabel: {
    color: "#6B7280",
    fontSize: 9,
    fontWeight: "600",
    textTransform: "uppercase",
  },
  detailBadgeValue: {
    color: "#E5E7EB",
    fontSize: 12,
    fontWeight: "700",
    marginTop: 1,
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#374151",
  },
  footerInfo: {
    flex: 1,
    paddingRight: 8,
  },
  timeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  timeText: {
    color: "#9CA3AF",
    fontSize: 12,
    fontWeight: "500",
  },
  contractorText: {
    color: "#6B7280",
    fontSize: 11,
    marginTop: 2,
  },
  btnSign: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#2563EB", // blue-600
    paddingVertical: 9,
    paddingHorizontal: 16,
    borderRadius: 12,
    gap: 6,
    shadowColor: "#2563EB",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  btnSignText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
  },
  signedStamp: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(16, 185, 129, 0.1)",
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  signedStampText: {
    color: "#34D399",
    fontSize: 11,
    fontWeight: "600",
  },
  signaturePreviewBox: {
    marginTop: 10,
    padding: 8,
    backgroundColor: "#111827",
    borderRadius: 8,
    alignItems: "center",
  },
  signaturePreviewLabel: {
    color: "#6B7280",
    fontSize: 10,
    fontWeight: "600",
    marginBottom: 4,
    alignSelf: "flex-start",
  },
  signatureThumb: {
    width: "100%",
    height: 48,
    backgroundColor: "#FFFFFF",
    borderRadius: 4,
  },
  // Modal / Bottom Sheet
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0, 0, 0, 0.65)",
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFill,
  },
  sheetContainer: {
    backgroundColor: "#1F2937", // gray-800
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: "90%",
    paddingBottom: 24,
    borderTopWidth: 1,
    borderColor: "#374151",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 10,
  },
  sheetHandle: {
    width: 44,
    height: 5,
    backgroundColor: "#4B5563",
    borderRadius: 3,
    alignSelf: "center",
    marginTop: 12,
    marginBottom: 8,
  },
  sheetScrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  sheetItemOverview: {
    backgroundColor: "#111827",
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#374151",
  },
  sheetItemElement: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },
  sheetItemProject: {
    color: "#9CA3AF",
    fontSize: 12,
    marginTop: 2,
  },
  sheetItemSpec: {
    color: "#60A5FA",
    fontSize: 12,
    fontWeight: "600",
    marginTop: 2,
  },
});
