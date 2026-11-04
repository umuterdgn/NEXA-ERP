/**
 * © 2026 NXA Software. All rights reserved.
 * Nexa ERP Mobil - Apple iOS Standartlarında Dinamik Role-Based Dashboard
 *
 * Tek ve birleştirilmiş ana ekran:
 * - DRIVER: "Sıradaki Teslimat / Rota" + Devasa Yeşil "DEVASA QR OKUT" butonu
 * - INSPECTOR: "Onay Bekleyen İmalatlar" + Kırmızı "Bakanlık YİBF Onayını İmzala" butonu
 * - ENGINEER / FOREMAN: "Bekleyen Görevlerim" progress barı + "Şantiye Jurnali Durumu"
 * - SUBCONTRACTOR: "Bu Ayki İmalat İlerlemesi" + "Güncel Hakediş"
 * - En üstte: "AKTİF ROL SİMÜLASYONU" yatay kaydırılabilir hap filtre barı (Pills)
 */

import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Modal,
  Alert,
  Platform,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { useRouter } from "expo-router";
import { useAuth, UserRole } from "../../src/hooks/useAuth";
import { QRScanner } from "../../src/components/scanner";
import { iosColors, iosRadius, iosStyles } from "../../src/theme/iosTheme";

export default function DynamicDashboardScreen() {
  const router = useRouter();
  const { user, role, setRole } = useAuth();

  // QR Tarayıcı Modal State'i
  const [showQRScanner, setShowQRScanner] = useState(false);

  // e-İmza / YİBF Vize Modal State'i (Yapı Denetim)
  const [showSignatureModal, setShowSignatureModal] = useState(false);
  const [isSigning, setIsSigning] = useState(false);

  // Günün iOS Tarihi
  const todayFormatted = new Date()
    .toLocaleDateString("tr-TR", {
      weekday: "long",
      day: "numeric",
      month: "long",
    })
    .toUpperCase();

  const firstName = user?.name ? user.name.split(" ")[0] : "Kullanıcı";

  // QR Tarama İşleyicisi
  const handleQRScanned = (data: string, type?: string) => {
    try {
      setShowQRScanner(false);
      Alert.alert(
        "📦 İrsaliye Teslim Alındı",
        `Barkod: ${data}\nTip: ${type || "QR"}\n\nŞantiye malzeme kabul kapısında yük kaydı ve stok girişi başarıyla tamamlandı!`
      );
    } catch (err: any) {
      console.error("[QR Scanner Error]:", err);
      Alert.alert("Hata", "QR kod işlenirken bir sorun oluştu.");
    }
  };

  // e-İmza Gönderim İşleyicisi
  const handleSignYIBF = async () => {
    try {
      setIsSigning(true);
      // Simüle edilmiş güvenli Bakanlık YİBF mobil e-imza servisi
      setTimeout(() => {
        setIsSigning(false);
        setShowSignatureModal(false);
        Alert.alert(
          "✅ Bakanlık YİBF Onayı Başarılı",
          "Elektronik mobil imzanız (Zaman Damgalı - 5070 Sayılı Kanun) başarıyla Çevre, Şehircilik ve İklim Değişikliği Bakanlığı YİBF sistemine iletildi."
        );
      }, 1200);
    } catch (err: any) {
      setIsSigning(false);
      console.error("[YIBF Sign Error]:", err);
      Alert.alert("İmza Hatası", "e-İmza işlemi tamamlanamadı.");
    }
  };

  // Mock Görev Verileri (ENGINEER)
  const tasks = [
    {
      id: "t1",
      title: "Blok-B 3. Kat Kolon Donatısı Kontrolü",
      status: "DEVAM EDİYOR",
      badgeColor: iosColors.systemOrange,
    },
    {
      id: "t2",
      title: "C30 Hazır Beton Döküm Öncesi İzin",
      status: "BEKLİYOR",
      badgeColor: iosColors.systemRed,
    },
    {
      id: "t3",
      title: "İSG Güvenlik Filesi ve Korkuluk Teftişi",
      status: "TAMAMLANDI",
      badgeColor: iosColors.systemGreen,
    },
  ];

  // Mock Denetim Verileri (INSPECTOR)
  const pendingInspections = [
    {
      id: "i1",
      item: "Blok-A Bodrum-2 Kolon Demir Donatı Uygunluğu",
      desc: "Statik proje ve paspayı kontrolü tamamlandı.",
      badge: "VİZE BEKLİYOR",
      badgeColor: iosColors.systemOrange,
    },
    {
      id: "i2",
      item: "Blok-B 4. Kat Tabliye C35 Beton Döküm İzni",
      desc: "Kalıp iskelesi ve güvenlik ağı denetlendi.",
      badge: "KRİTİK",
      badgeColor: iosColors.systemRed,
    },
    {
      id: "i3",
      item: "Karot ve 28 Günlük Basınç Laboratuvar Testi",
      desc: "TS 500 ve Bakanlık YİBF veri tabanına işlendi.",
      badge: "LAB ONAYLI",
      badgeColor: iosColors.systemGreen,
    },
  ];

  return (
    <SafeAreaView style={styles.safeContainer} edges={["top", "left", "right"]}>
      <ScrollView
        style={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* ============================================================ */}
        {/* ADIM 1: iOS Büyük Başlık & Karşılama Bölümü                  */}
        {/* ============================================================ */}
        <View style={styles.headerSection}>
          <Text style={styles.dateText}>{todayFormatted}</Text>

          <View style={styles.titleRow}>
            <View style={{ flex: 1, paddingRight: 12 }}>
              <Text style={styles.welcomeTitle}>Merhaba, {firstName}</Text>
            </View>

            {/* iOS Profil Avatar Rozeti */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => router.push("/(tabs)/profile")}
              style={styles.avatarButton}
            >
              <Text style={styles.avatarText}>
                {firstName.substring(0, 2).toUpperCase()}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Şantiye Bilgi Rozeti */}
          <View style={styles.siteInfoBadge}>
            <View style={styles.onlineDot} />
            <Text style={styles.siteInfoText}>
              Kadıköy Merkez Rezidans • {user?.tenantName || "Nexa ERP"}
            </Text>
          </View>
        </View>

        {/* ============================================================ */}
        {/* ADIM 2: AKTİF ROL SİMÜLASYONU (Yatay Hap Filtre Barı)         */}
        {/* ============================================================ */}
        <View style={styles.pillsContainer}>
          <Text style={styles.pillsTitle}>AKTİF ROL SİMÜLASYONU</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.pillsScroll}
          >
            {[
              { id: "ENGINEER", label: "Saha Ekibi / Şef", icon: "hard-hat" },
              { id: "DRIVER", label: "Şoför / Lojistik", icon: "truck" },
              { id: "INSPECTOR", label: "Yapı Denetim", icon: "check-circle" },
              { id: "SUBCONTRACTOR", label: "Taşeron", icon: "briefcase" },
              { id: "ADMIN", label: "Super Admin", icon: "shield" },
            ].map((item) => {
              const isActive = role === item.id;
              return (
                <TouchableOpacity
                  key={item.id}
                  onPress={() => setRole(item.id as UserRole)}
                  activeOpacity={0.75}
                  style={[
                    styles.pillButton,
                    isActive ? styles.pillButtonActive : styles.pillButtonInactive,
                  ]}
                >
                  <Text
                    style={[
                      styles.pillButtonText,
                      isActive
                        ? styles.pillButtonTextActive
                        : styles.pillButtonTextInactive,
                    ]}
                  >
                    {item.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* ============================================================ */}
        {/* DİNAMİK ROL MODÜLLERİ (FROSTED GLASS KARTLAR)                */}
        {/* ============================================================ */}
        <View style={styles.modulesContainer}>
          {/* ---------------------------------------------------------- */}
          {/* ROL 1: ŞOFÖR (DRIVER / WAREHOUSE / LOGISTICS)              */}
          {/* ---------------------------------------------------------- */}
          {(role === "DRIVER" || role === "WAREHOUSE" || role === "LOGISTICS") && (
            <>
              {/* Kart 1: Sıradaki Teslimat / Rota */}
              <View style={styles.frostedCard}>
                {Platform.OS === "ios" && (
                  <BlurView intensity={25} tint="dark" style={StyleSheet.absoluteFill} />
                )}
                <View style={styles.cardHeader}>
                  <View style={styles.cardHeaderLeft}>
                    <View style={styles.iconCircleBlue}>
                      <Feather name="navigation" size={17} color={iosColors.systemBlue} />
                    </View>
                    <View>
                      <Text style={styles.cardTitle}>Sıradaki Teslimat / Rota</Text>
                      <Text style={styles.cardSubtitleMono}>İrsaliye: #IRS-98421</Text>
                    </View>
                  </View>
                  <View style={styles.statusBadgeBlue}>
                    <Text style={styles.statusBadgeTextBlue}>YOLDA</Text>
                  </View>
                </View>

                {/* Yük & Lokasyon Detayları */}
                <View style={styles.deliveryDetailsBox}>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Yük:</Text>
                    <Text style={styles.detailValueBold}>
                      32 Ton BÇ III Nervürlü Demir (Q16)
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Çıkış:</Text>
                    <Text style={styles.detailValue}>Dilovası Çelik Fabrikası</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Hedef Şantiye:</Text>
                    <Text style={styles.detailValueGreen}>
                      Kadıköy Merkez Rezidans A-Kapısı
                    </Text>
                  </View>
                </View>

                {/* Mesafe ve Tahmini Varış Rozetleri */}
                <View style={styles.metricsRow}>
                  <View style={styles.metricBox}>
                    <Text style={styles.metricLabel}>Kalan Mesafe</Text>
                    <Text style={styles.metricValue}>34.2 km</Text>
                  </View>
                  <View style={styles.metricBox}>
                    <Text style={styles.metricLabel}>Tahmini Süre</Text>
                    <Text style={styles.metricValueBlue}>45 Dk</Text>
                  </View>
                </View>
              </View>

              {/* Kart 2: Devasa Yeşil "DEVASA QR OKUT" Butonu */}
              <TouchableOpacity
                onPress={() => setShowQRScanner(true)}
                activeOpacity={0.85}
                style={styles.giantGreenQrButton}
              >
                <View style={styles.qrIconWrapper}>
                  <Ionicons name="qr-code-outline" size={42} color="#FFFFFF" />
                </View>
                <Text style={styles.giantQrTitle}>DEVASA QR OKUT</Text>
                <Text style={styles.giantQrSubtitle}>
                  Şantiye kapısında malzeme teslimat barkodunu tarayın
                </Text>
              </TouchableOpacity>
            </>
          )}

          {/* ---------------------------------------------------------- */}
          {/* ROL 2: YAPI DENETİM (INSPECTOR)                            */}
          {/* ---------------------------------------------------------- */}
          {role === "INSPECTOR" && (
            <View style={styles.frostedCard}>
              {Platform.OS === "ios" && (
                <BlurView intensity={25} tint="dark" style={StyleSheet.absoluteFill} />
              )}
              <View style={styles.cardHeader}>
                <View style={styles.cardHeaderLeft}>
                  <View style={styles.iconCircleRed}>
                    <Feather name="shield" size={17} color={iosColors.systemRed} />
                  </View>
                  <View>
                    <Text style={styles.cardTitle}>Onay Bekleyen İmalatlar</Text>
                    <Text style={styles.cardSubtitle}>
                      Bakanlık YİBF Vize ve Uygunluk Listesi
                    </Text>
                  </View>
                </View>
                <View style={styles.statusBadgeRed}>
                  <Text style={styles.statusBadgeTextRed}>3 VİZE BEKLİYOR</Text>
                </View>
              </View>

              {/* Denetim Listesi */}
              <View style={styles.inspectionsList}>
                {(pendingInspections || []).map((insp) => (
                  <View key={insp.id} style={styles.inspectionItem}>
                    <View style={styles.inspectionItemHeader}>
                      <Text style={styles.inspectionItemTitle}>{insp.item}</Text>
                      <View
                        style={[
                          styles.badgeSmall,
                          {
                            backgroundColor: `${insp.badgeColor}20`,
                            borderColor: `${insp.badgeColor}40`,
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.badgeSmallText,
                            { color: insp.badgeColor },
                          ]}
                        >
                          {insp.badge}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.inspectionItemDesc}>{insp.desc}</Text>
                  </View>
                ))}
              </View>

              {/* Kırmızı Devasa Buton: Bakanlık YİBF Onayını İmzala */}
              <TouchableOpacity
                onPress={() => setShowSignatureModal(true)}
                activeOpacity={0.85}
                style={styles.yibfSignButton}
              >
                <Feather name="check-square" size={18} color="#FFFFFF" />
                <Text style={styles.yibfSignButtonText}>
                  Bakanlık YİBF Onayını İmzala
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* ---------------------------------------------------------- */}
          {/* ROL 3: SAHA EKİBİ / ŞEF (ENGINEER / FOREMAN / ADMIN)       */}
          {/* ---------------------------------------------------------- */}
          {(role === "ENGINEER" || role === "FOREMAN" || role === "ADMIN") && (
            <>
              {/* Kart 1: Bekleyen Görevlerim */}
              <View style={styles.frostedCard}>
                {Platform.OS === "ios" && (
                  <BlurView intensity={25} tint="dark" style={StyleSheet.absoluteFill} />
                )}
                <View style={styles.cardHeader}>
                  <View style={styles.cardHeaderLeft}>
                    <View style={styles.iconCircleBlue}>
                      <Feather name="check-circle" size={17} color={iosColors.systemBlue} />
                    </View>
                    <View>
                      <Text style={styles.cardTitle}>Bekleyen Görevlerim</Text>
                      <Text style={styles.cardSubtitle}>
                        Bugün yapılması gereken 3 kritik denetim
                      </Text>
                    </View>
                  </View>
                  <View style={styles.progressPercentBadge}>
                    <Text style={styles.progressPercentText}>%68</Text>
                  </View>
                </View>

                {/* iOS Progress Bar */}
                <View style={styles.progressBarTrack}>
                  <View style={[styles.progressBarFill, { width: "68%" }]} />
                </View>

                {/* Görev Maddeleri */}
                <View style={styles.tasksList}>
                  {(tasks || []).map((t) => (
                    <View key={t.id} style={styles.taskItem}>
                      <Text style={styles.taskItemTitle}>{t.title}</Text>
                      <View
                        style={[
                          styles.badgeSmall,
                          {
                            backgroundColor: `${t.badgeColor}20`,
                            borderColor: `${t.badgeColor}40`,
                          },
                        ]}
                      >
                        <Text style={[styles.badgeSmallText, { color: t.badgeColor }]}>
                          {t.status}
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>
              </View>

              {/* Kart 2: Şantiye Jurnali Durumu */}
              <View style={styles.frostedCard}>
                {Platform.OS === "ios" && (
                  <BlurView intensity={25} tint="dark" style={StyleSheet.absoluteFill} />
                )}
                <View style={styles.cardHeader}>
                  <View style={styles.cardHeaderLeft}>
                    <View style={styles.iconCircleGreen}>
                      <Feather name="clipboard" size={17} color={iosColors.systemGreen} />
                    </View>
                    <View>
                      <Text style={styles.cardTitle}>Şantiye Jurnali Durumu</Text>
                      <Text style={styles.cardSubtitle}>Günlük Rapor: Bugün</Text>
                    </View>
                  </View>
                  <View style={styles.statusBadgeOrange}>
                    <Text style={styles.statusBadgeTextOrange}>TASLAK</Text>
                  </View>
                </View>

                {/* Metrikler */}
                <View style={styles.metricsRow}>
                  <View style={styles.metricBox}>
                    <Text style={styles.metricLabel}>Saha Personeli</Text>
                    <Text style={styles.metricValue}>48 Kişi</Text>
                  </View>
                  <View style={styles.metricBox}>
                    <Text style={styles.metricLabel}>Hava Durumu</Text>
                    <Text style={styles.metricValueGreen}>18°C Güneşli</Text>
                  </View>
                </View>

                {/* Jurnale Git Butonu */}
                <TouchableOpacity
                  onPress={() => router.push("/(tabs)/journal")}
                  activeOpacity={0.85}
                  style={styles.journalEditButton}
                >
                  <Feather name="edit-3" size={15} color={iosColors.systemGreen} />
                  <Text style={styles.journalEditText}>
                    Jurnali Düzenle & Merkeze İlet
                  </Text>
                </TouchableOpacity>
              </View>
            </>
          )}

          {/* ---------------------------------------------------------- */}
          {/* ROL 4: TAŞERON (SUBCONTRACTOR)                             */}
          {/* ---------------------------------------------------------- */}
          {role === "SUBCONTRACTOR" && (
            <>
              {/* Kart 1: Bu Ayki İmalat İlerlemesi */}
              <View style={styles.frostedCard}>
                {Platform.OS === "ios" && (
                  <BlurView intensity={25} tint="dark" style={StyleSheet.absoluteFill} />
                )}
                <View style={styles.cardHeader}>
                  <View style={styles.cardHeaderLeft}>
                    <View style={styles.iconCirclePurple}>
                      <Feather name="trending-up" size={17} color={iosColors.systemPurple} />
                    </View>
                    <View>
                      <Text style={styles.cardTitle}>Bu Ayki İmalat İlerlemesi</Text>
                      <Text style={styles.cardSubtitle}>
                        Taşeron: Erdemler İnşaat Ltd.
                      </Text>
                    </View>
                  </View>
                </View>

                <View style={{ gap: 14, marginVertical: 8 }}>
                  <View>
                    <View style={styles.boqRow}>
                      <Text style={styles.boqTitle}>Gazbeton Duvar İmalatı</Text>
                      <Text style={styles.boqValue}>1.450 / 2.000 m² (%72.5)</Text>
                    </View>
                    <View style={styles.progressBarTrack}>
                      <View
                        style={[
                          styles.progressBarFill,
                          {
                            width: "72.5%",
                            backgroundColor: iosColors.systemPurple,
                          },
                        ]}
                      />
                    </View>
                  </View>

                  <View>
                    <View style={styles.boqRow}>
                      <Text style={styles.boqTitle}>İç Mekan Alçı Sıva & Şap</Text>
                      <Text style={styles.boqValue}>850 / 1.500 m² (%56.6)</Text>
                    </View>
                    <View style={styles.progressBarTrack}>
                      <View
                        style={[
                          styles.progressBarFill,
                          {
                            width: "56.6%",
                            backgroundColor: iosColors.systemPurple,
                          },
                        ]}
                      />
                    </View>
                  </View>
                </View>
              </View>

              {/* Kart 2: Güncel Hakediş */}
              <View style={styles.frostedCard}>
                {Platform.OS === "ios" && (
                  <BlurView intensity={25} tint="dark" style={StyleSheet.absoluteFill} />
                )}
                <View style={styles.cardHeader}>
                  <View style={styles.cardHeaderLeft}>
                    <View style={styles.iconCircleGreen}>
                      <Feather name="dollar-sign" size={17} color={iosColors.systemGreen} />
                    </View>
                    <View>
                      <Text style={styles.cardTitle}>Güncel Hakediş Durumu</Text>
                      <Text style={styles.cardSubtitle}>Dönem: Kasım 2026 (#14)</Text>
                    </View>
                  </View>
                  <View style={styles.statusBadgeOrange}>
                    <Text style={styles.statusBadgeTextOrange}>ONAY BEKLİYOR</Text>
                  </View>
                </View>

                <View style={styles.hakedisBox}>
                  <View style={styles.hakedisRow}>
                    <Text style={styles.hakedisLabel}>Toplam Kesilen:</Text>
                    <Text style={styles.hakedisValue}>₺1,420,500.00</Text>
                  </View>
                  <View style={styles.hakedisRow}>
                    <Text style={styles.hakedisLabel}>Kesintiler (%10 Teminat):</Text>
                    <Text style={styles.hakedisDanger}>-₺142,050.00</Text>
                  </View>
                  <View style={styles.hakedisTotalRow}>
                    <Text style={styles.hakedisTotalLabel}>Net Ödenecek:</Text>
                    <Text style={styles.hakedisTotalValue}>₺1,278,450.00</Text>
                  </View>
                </View>
              </View>
            </>
          )}
        </View>
      </ScrollView>

      {/* QR Tarayıcı Modali */}
      <Modal
        visible={showQRScanner}
        animationType="slide"
        onRequestClose={() => setShowQRScanner(false)}
      >
        <QRScanner
          onScan={handleQRScanned}
          onClose={() => setShowQRScanner(false)}
          title="Şantiye Teslimat QR Okut"
          subtitle="İrsaliye üzerindeki teslimat barkodunu çerçevenin içine hizalayınız"
        />
      </Modal>

      {/* e-İmza YİBF Modal (Yapı Denetim) */}
      <Modal
        visible={showSignatureModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowSignatureModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.signatureSheet}>
            <View style={styles.signatureHeader}>
              <View style={styles.iconCircleRedLarge}>
                <Feather name="shield" size={26} color={iosColors.systemRed} />
              </View>
              <Text style={styles.signatureTitle}>Bakanlık YİBF e-İmza</Text>
              <Text style={styles.signatureSubtitle}>
                Yapı Denetim Kanunu gereğince denetlenen imalatları onaylamak üzeresiniz.
              </Text>
            </View>

            <View style={styles.signatureInfoBox}>
              <Text style={styles.signatureInfoText}>
                • Blok-A Bodrum-2 Kolon Demir Donatı Uygunluğu{"\n"}
                • Blok-B 4. Kat Tabliye C35 Beton Döküm İzni{"\n"}
                • Karot ve Basınç Dayanım Raporu Onayı
              </Text>
            </View>

            <TouchableOpacity
              onPress={handleSignYIBF}
              disabled={isSigning}
              activeOpacity={0.85}
              style={styles.confirmSignButton}
            >
              {isSigning ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Feather name="check-circle" size={18} color="#FFFFFF" />
                  <Text style={styles.confirmSignText}>
                    Zaman Damgası ile İmzala & Gönder
                  </Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setShowSignatureModal(false)}
              disabled={isSigning}
              style={styles.cancelSignButton}
            >
              <Text style={styles.cancelSignText}>Vazgeç</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: iosColors.background,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 110,
  },
  headerSection: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  dateText: {
    fontSize: 12,
    fontWeight: "600",
    color: iosColors.labelSecondary,
    letterSpacing: 0.8,
    textTransform: "uppercase",
    marginBottom: 4,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  welcomeTitle: {
    fontSize: 30,
    fontWeight: "800",
    color: iosColors.labelPrimary,
    letterSpacing: -0.5,
  },
  avatarButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(10, 122, 255, 0.15)",
    borderWidth: 2,
    borderColor: iosColors.systemBlue,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    color: iosColors.systemBlue,
    fontWeight: "700",
    fontSize: 15,
  },
  siteInfoBadge: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    gap: 6,
  },
  onlineDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: iosColors.systemGreen,
  },
  siteInfoText: {
    fontSize: 13,
    color: iosColors.labelSecondary,
    fontWeight: "500",
  },
  pillsContainer: {
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  pillsTitle: {
    fontSize: 11,
    fontWeight: "700",
    color: iosColors.labelSecondary,
    letterSpacing: 0.8,
    textTransform: "uppercase",
    marginBottom: 8,
  },
  pillsScroll: {
    flexDirection: "row",
    gap: 8,
  },
  pillButton: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: iosRadius.pill,
    borderWidth: 1,
  },
  pillButtonActive: {
    backgroundColor: iosColors.systemBlue,
    borderColor: iosColors.systemBlue,
    shadowColor: iosColors.systemBlue,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 4,
  },
  pillButtonInactive: {
    backgroundColor: iosColors.glassCard,
    borderColor: iosColors.glassBorder,
  },
  pillButtonText: {
    fontSize: 12,
    fontWeight: "700",
  },
  pillButtonTextActive: {
    color: "#FFFFFF",
  },
  pillButtonTextInactive: {
    color: iosColors.labelSecondary,
  },
  modulesContainer: {
    paddingHorizontal: 20,
    paddingTop: 10,
    gap: 16,
  },
  frostedCard: {
    backgroundColor: iosColors.glassCard,
    borderRadius: iosRadius.cardLarge,
    borderWidth: 1,
    borderColor: iosColors.glassBorder,
    padding: 18,
    overflow: "hidden",
    position: "relative",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 4,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  cardHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  iconCircleBlue: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: "rgba(10, 122, 255, 0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  iconCircleRed: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: "rgba(255, 59, 48, 0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  iconCircleGreen: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: "rgba(52, 199, 89, 0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  iconCirclePurple: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: "rgba(175, 82, 222, 0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: iosColors.labelPrimary,
  },
  cardSubtitle: {
    fontSize: 12,
    color: iosColors.labelSecondary,
    marginTop: 1,
  },
  cardSubtitleMono: {
    fontSize: 12,
    color: iosColors.labelSecondary,
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
    marginTop: 1,
  },
  statusBadgeBlue: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: iosRadius.badge,
    backgroundColor: "rgba(10, 122, 255, 0.15)",
    borderWidth: 1,
    borderColor: "rgba(10, 122, 255, 0.35)",
  },
  statusBadgeTextBlue: {
    fontSize: 10,
    fontWeight: "800",
    color: iosColors.systemBlue,
  },
  statusBadgeRed: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: iosRadius.badge,
    backgroundColor: "rgba(255, 59, 48, 0.15)",
    borderWidth: 1,
    borderColor: "rgba(255, 59, 48, 0.35)",
  },
  statusBadgeTextRed: {
    fontSize: 10,
    fontWeight: "800",
    color: iosColors.systemRed,
  },
  statusBadgeOrange: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: iosRadius.badge,
    backgroundColor: "rgba(255, 149, 0, 0.15)",
    borderWidth: 1,
    borderColor: "rgba(255, 149, 0, 0.35)",
  },
  statusBadgeTextOrange: {
    fontSize: 10,
    fontWeight: "800",
    color: iosColors.systemOrange,
  },
  progressPercentBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: iosRadius.badge,
    backgroundColor: "rgba(10, 122, 255, 0.15)",
    borderWidth: 1,
    borderColor: "rgba(10, 122, 255, 0.35)",
  },
  progressPercentText: {
    fontSize: 11,
    fontWeight: "800",
    color: iosColors.systemBlue,
  },
  deliveryDetailsBox: {
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: iosColors.glassBorder,
    padding: 14,
    gap: 8,
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  detailLabel: {
    fontSize: 12,
    color: iosColors.labelSecondary,
  },
  detailValueBold: {
    fontSize: 12,
    fontWeight: "700",
    color: iosColors.labelPrimary,
  },
  detailValue: {
    fontSize: 12,
    color: iosColors.labelPrimary,
  },
  detailValueGreen: {
    fontSize: 12,
    fontWeight: "600",
    color: iosColors.systemGreen,
  },
  metricsRow: {
    flexDirection: "row",
    gap: 10,
  },
  metricBox: {
    flex: 1,
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: iosColors.glassBorder,
    padding: 12,
    alignItems: "center",
  },
  metricLabel: {
    fontSize: 11,
    color: iosColors.labelSecondary,
    marginBottom: 2,
  },
  metricValue: {
    fontSize: 17,
    fontWeight: "800",
    color: iosColors.labelPrimary,
  },
  metricValueBlue: {
    fontSize: 17,
    fontWeight: "800",
    color: iosColors.systemBlue,
  },
  metricValueGreen: {
    fontSize: 17,
    fontWeight: "800",
    color: iosColors.systemGreen,
  },
  giantGreenQrButton: {
    width: "100%",
    backgroundColor: iosColors.systemGreen,
    borderRadius: iosRadius.cardLarge,
    paddingVertical: 24,
    paddingHorizontal: 20,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: iosColors.systemGreen,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  qrIconWrapper: {
    width: 68,
    height: 68,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.35)",
  },
  giantQrTitle: {
    fontSize: 22,
    fontWeight: "900",
    color: "#FFFFFF",
    letterSpacing: -0.3,
  },
  giantQrSubtitle: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.85)",
    fontWeight: "500",
    marginTop: 4,
    textAlign: "center",
  },
  inspectionsList: {
    gap: 10,
    marginVertical: 6,
  },
  inspectionItem: {
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: iosColors.glassBorder,
    padding: 12,
  },
  inspectionItemHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  inspectionItemTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: iosColors.labelPrimary,
    flex: 1,
    marginRight: 8,
  },
  inspectionItemDesc: {
    fontSize: 11,
    color: iosColors.labelSecondary,
    lineHeight: 15,
  },
  badgeSmall: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
  },
  badgeSmallText: {
    fontSize: 9,
    fontWeight: "800",
  },
  yibfSignButton: {
    width: "100%",
    backgroundColor: iosColors.systemRed,
    borderRadius: iosRadius.button,
    paddingVertical: 15,
    marginTop: 14,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
    shadowColor: iosColors.systemRed,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 4,
  },
  yibfSignButtonText: {
    fontSize: 14,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  progressBarTrack: {
    width: "100%",
    height: 8,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    borderRadius: 4,
    overflow: "hidden",
    marginVertical: 10,
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: iosColors.systemBlue,
    borderRadius: 4,
  },
  tasksList: {
    gap: 8,
    marginTop: 4,
  },
  taskItem: {
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: iosColors.glassBorder,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  taskItemTitle: {
    fontSize: 12,
    fontWeight: "600",
    color: iosColors.labelPrimary,
    flex: 1,
    marginRight: 8,
  },
  journalEditButton: {
    width: "100%",
    backgroundColor: "rgba(52, 199, 89, 0.12)",
    borderRadius: iosRadius.button,
    borderWidth: 1,
    borderColor: "rgba(52, 199, 89, 0.35)",
    paddingVertical: 13,
    marginTop: 12,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 6,
  },
  journalEditText: {
    fontSize: 13,
    fontWeight: "700",
    color: iosColors.systemGreen,
  },
  boqRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  boqTitle: {
    fontSize: 12,
    fontWeight: "600",
    color: iosColors.labelPrimary,
  },
  boqValue: {
    fontSize: 12,
    fontWeight: "700",
    color: iosColors.systemPurple,
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
  },
  hakedisBox: {
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: iosColors.glassBorder,
    padding: 14,
    gap: 8,
    marginVertical: 4,
  },
  hakedisRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  hakedisLabel: {
    fontSize: 12,
    color: iosColors.labelSecondary,
  },
  hakedisValue: {
    fontSize: 12,
    fontWeight: "600",
    color: iosColors.labelPrimary,
  },
  hakedisDanger: {
    fontSize: 12,
    fontWeight: "600",
    color: iosColors.systemRed,
  },
  hakedisTotalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: iosColors.glassBorder,
    paddingTop: 8,
    marginTop: 4,
  },
  hakedisTotalLabel: {
    fontSize: 12,
    fontWeight: "800",
    color: iosColors.systemGreen,
    textTransform: "uppercase",
  },
  hakedisTotalValue: {
    fontSize: 18,
    fontWeight: "900",
    color: iosColors.systemGreen,
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.75)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  signatureSheet: {
    width: "100%",
    backgroundColor: iosColors.backgroundSecondary,
    borderRadius: iosRadius.cardLarge,
    borderWidth: 1,
    borderColor: iosColors.glassBorder,
    padding: 24,
    alignItems: "center",
  },
  iconCircleRedLarge: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "rgba(255, 59, 48, 0.15)",
    borderWidth: 1,
    borderColor: "rgba(255, 59, 48, 0.35)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  signatureHeader: {
    alignItems: "center",
    marginBottom: 14,
  },
  signatureTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: iosColors.labelPrimary,
  },
  signatureSubtitle: {
    fontSize: 12,
    color: iosColors.labelSecondary,
    textAlign: "center",
    marginTop: 4,
    lineHeight: 16,
  },
  signatureInfoBox: {
    width: "100%",
    backgroundColor: "rgba(255, 255, 255, 0.04)",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: iosColors.glassBorder,
    padding: 12,
    marginBottom: 20,
  },
  signatureInfoText: {
    fontSize: 11,
    color: iosColors.labelSecondary,
    lineHeight: 18,
  },
  confirmSignButton: {
    width: "100%",
    backgroundColor: iosColors.systemRed,
    borderRadius: iosRadius.button,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  confirmSignText: {
    color: "#FFFFFF",
    fontWeight: "800",
    fontSize: 13,
  },
  cancelSignButton: {
    marginTop: 10,
    paddingVertical: 10,
  },
  cancelSignText: {
    color: iosColors.labelSecondary,
    fontWeight: "600",
    fontSize: 13,
  },
});
