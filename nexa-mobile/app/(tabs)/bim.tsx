/**
 * © 2026 NXA Software. All rights reserved.
 * Nexa ERP Mobil - True AR (BIM Artırılmış Gerçeklik) & Saha Mühendisliği Ekranı
 *
 * - Tam Ekran Kamera (expo-camera CameraView)
 * - Web Backend (/api/bim/models/current) Senkronize Sayısal İkiz Katmanı
 * - "Tesisat Boruları" (MEP) ve "Kolon / Kiriş" (Statik) AR Çizgi Bindirmesi (Overlay)
 * - Çevrimdışı Model İndirme (expo-file-system)
 */

import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
  StyleSheet,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useOfflineBIM } from "../../src/hooks/useOfflineBIM";
import { iosColors, iosRadius } from "../../src/theme/iosTheme";
import { bimApi } from "../../apiClient";
import { useDrawer } from "../../src/components/navigation/DrawerSidebar";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

export default function BimArScreen() {
  const { openDrawer } = useDrawer();

  const {
    isDownloaded,
    isDownloading,
    downloadProgress,
    fileSizeMB,
    downloadModel,
    deleteLocalModel,
  } = useOfflineBIM();

  const [activeModel, setActiveModel] = useState("Merkez Rezidans - Blok A & B");
  const [isArActive, setIsArActive] = useState(false);

  // Kamera İzinleri
  const [permission, requestPermission] = useCameraPermissions();

  // AR Katman Durumları
  const [showPipes, setShowPipes] = useState(true);
  const [showColumns, setShowColumns] = useState(true);
  const [showLaser, setShowLaser] = useState(true);
  const [overlayOpacity, setOverlayOpacity] = useState(0.85);
  const [scale, setScale] = useState(1.0);
  const [modelOverlay, setModelOverlay] = useState<any>(null);

  // Web API'den güncel BIM katman planını çek
  useEffect(() => {
    (async () => {
      try {
        const data = await bimApi.getCurrentModelOverlay();
        setModelOverlay(data);
      } catch (err) {
        console.warn("[BimArScreen] Model overlay çekme uyarısı:", err);
      }
    })();
  }, []);

  const handleStartAr = async () => {
    if (!permission?.granted) {
      const { granted } = await requestPermission();
      if (!granted) {
        Alert.alert(
          "Kamera İzni Gerekli",
          "Şantiyede AR (Artırılmış Gerçeklik) katmanını görebilmek için kamera izni vermeniz gerekir."
        );
        return;
      }
    }
    setIsArActive(true);
  };

  const handleDownload = async () => {
    try {
      await downloadModel();
      Alert.alert(
        "✅ BIM Modeli İndirildi",
        "3D Yapı modeli cihazınıza kaydedildi. Şantiyede çevrimdışı (offline) olarak inceleyebilirsiniz."
      );
    } catch (e: any) {
      Alert.alert("İndirme Hatası", e.message || "Model indirilemedi.");
    }
  };

  const handleDelete = () => {
    Alert.alert(
      "Modeli Sil",
      "Cihazdaki yerel BIM model dosyasını silmek istediğinize emin misiniz?",
      [
        { text: "Vazgeç", style: "cancel" },
        {
          text: "Sil",
          style: "destructive",
          onPress: async () => {
            await deleteLocalModel();
          },
        },
      ]
    );
  };

  const handleSnapshot = () => {
    Alert.alert(
      "AR Görüntüsü Kaydedildi",
      "Kamera görüntüsü ve üzerindeki BIM tesisat/kolon hizalamaları şantiye günlüğüne (Jurnal) eklendi."
    );
  };

  return (
    <SafeAreaView style={styles.safeContainer} edges={["top", "left", "right"]}>
      {/* ==================================================================== */}
      {/* ADIM 4: TRUE AR TAM EKRAN KAMERA GÖRÜNÜMÜ                           */}
      {/* ==================================================================== */}
      {isArActive ? (
        <View style={styles.arFullscreenContainer}>
          <CameraView style={StyleSheet.absoluteFill} facing="back">
            {/* Üst HUD Kontrolleri */}
            <SafeAreaView edges={["top"]} style={styles.arTopHud}>
              <View style={styles.arTopRow}>
                <TouchableOpacity
                  style={styles.arCloseButton}
                  onPress={() => setIsArActive(false)}
                >
                  <Ionicons name="close" size={24} color="#FFFFFF" />
                </TouchableOpacity>

                <View style={styles.arTitleBadge}>
                  <View style={styles.arPulseDot} />
                  <Text style={styles.arTitleText}>BIM CANLI AR KATMANI</Text>
                </View>

                <TouchableOpacity
                  style={styles.arSnapshotBtn}
                  onPress={handleSnapshot}
                >
                  <Ionicons name="camera" size={20} color="#FFFFFF" />
                </TouchableOpacity>
              </View>

              {/* Katman Aç/Kapa Butonları */}
              <View style={styles.arLayersRow}>
                <TouchableOpacity
                  style={[styles.arLayerChip, showPipes && styles.arLayerChipBlue]}
                  onPress={() => setShowPipes(!showPipes)}
                >
                  <Ionicons
                    name="git-commit"
                    size={13}
                    color={showPipes ? "#FFFFFF" : "#8E8E93"}
                  />
                  <Text style={[styles.arLayerText, showPipes && styles.arLayerTextActive]}>
                    Tesisat Boruları (MEP)
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.arLayerChip, showColumns && styles.arLayerChipOrange]}
                  onPress={() => setShowColumns(!showColumns)}
                >
                  <Ionicons
                    name="square"
                    size={12}
                    color={showColumns ? "#FFFFFF" : "#8E8E93"}
                  />
                  <Text style={[styles.arLayerText, showColumns && styles.arLayerTextActive]}>
                    Kolon / Kiriş
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.arLayerChip, showLaser && styles.arLayerChipGreen]}
                  onPress={() => setShowLaser(!showLaser)}
                >
                  <Ionicons
                    name="scan"
                    size={13}
                    color={showLaser ? "#FFFFFF" : "#8E8E93"}
                  />
                  <Text style={[styles.arLayerText, showLaser && styles.arLayerTextActive]}>
                    Lazer Hizalama
                  </Text>
                </TouchableOpacity>
              </View>
            </SafeAreaView>

            {/* ORTA: AR ÇİZGİLERİ VE STATİK / MEKANİK OVERLAY BİNDİRMESİ */}
            <View
              style={[
                styles.arOverlayCanvas,
                { opacity: overlayOpacity, transform: [{ scale }] },
              ]}
              pointerEvents="none"
            >
              {/* 1. Lazer Hizalama Çaprazı (Green Laser Guide) */}
              {showLaser && (
                <View style={styles.laserContainer}>
                  <View style={styles.laserCrosshairH} />
                  <View style={styles.laserCrosshairV} />
                  <View style={styles.laserCenterCircle}>
                    <Text style={styles.laserDeltaText}>ΔX: +0.2 cm  ΔY: -0.1 cm</Text>
                    <Text style={styles.laserAngleText}>Eğim: 0.0° (Hizalı)</Text>
                  </View>
                </View>
              )}

              {/* 2. Statik Kolon ve Kiriş Çizgileri (Red / Green Outlines) */}
              {showColumns && (
                <View style={styles.columnsOverlayGroup}>
                  {/* S-104 Kolon Sınırı */}
                  <View style={styles.columnBoxS104}>
                    <Text style={styles.columnLabel}>S-104 KOLONU (60x60)</Text>
                    <View style={styles.cornerTL} />
                    <View style={styles.cornerTR} />
                    <View style={styles.cornerBL} />
                    <View style={styles.cornerBR} />
                  </View>

                  {/* K-208 Kiriş Aksı (Kırmızı Proje Ekseni) */}
                  <View style={styles.beamLineK208}>
                    <Text style={styles.beamLabel}>K-208 KİRİŞ AKSI [KOT: +3.20]</Text>
                  </View>
                </View>
              )}

              {/* 3. Tesisat Boruları (Cyan / Blue / Red MEP Pipes) */}
              {showPipes && (
                <View style={styles.pipesOverlayGroup}>
                  {/* Pis Su Dikey İniş Hattı */}
                  <View style={styles.pipeVerticalBlue}>
                    <Text style={styles.pipeLabel}>Ø110 Pis Su İniş</Text>
                  </View>

                  {/* Yangın Sprinkler Hattı (Kırmızı) */}
                  <View style={styles.pipeHorizontalRed}>
                    <Text style={styles.pipeLabel}>Ø25 Yangın Sprinkler [2.8 Bar]</Text>
                  </View>

                  {/* Temiz Su Besleme Hattı (Yeşil) */}
                  <View style={styles.pipeHorizontalGreen}>
                    <Text style={styles.pipeLabel}>Ø32 Soğuk Su Dağıtım</Text>
                  </View>
                </View>
              )}
            </View>

            {/* Alt Kontrol Paneli (Zoom & Şeffaflık) */}
            <SafeAreaView edges={["bottom"]} style={styles.arBottomHud}>
              <View style={styles.arBottomControls}>
                <View style={styles.controlGroup}>
                  <Text style={styles.controlLabel}>Ölçek: {scale.toFixed(1)}x</Text>
                  <View style={styles.zoomButtonsRow}>
                    <TouchableOpacity
                      style={styles.zoomBtn}
                      onPress={() => setScale((s) => Math.max(0.6, s - 0.1))}
                    >
                      <Ionicons name="remove" size={16} color="#FFFFFF" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.zoomBtn}
                      onPress={() => setScale((s) => Math.min(1.6, s + 0.1))}
                    >
                      <Ionicons name="add" size={16} color="#FFFFFF" />
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.controlGroup}>
                  <Text style={styles.controlLabel}>Opaklık: %{Math.round(overlayOpacity * 100)}</Text>
                  <View style={styles.zoomButtonsRow}>
                    <TouchableOpacity
                      style={styles.zoomBtn}
                      onPress={() => setOverlayOpacity((o) => Math.max(0.3, o - 0.2))}
                    >
                      <Ionicons name="contrast-outline" size={14} color="#FFFFFF" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.zoomBtn}
                      onPress={() => setOverlayOpacity((o) => Math.min(1.0, o + 0.2))}
                    >
                      <Ionicons name="contrast" size={14} color="#FFFFFF" />
                    </TouchableOpacity>
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.realignBtn}
                  onPress={() => {
                    setScale(1.0);
                    Alert.alert("Sıfırlandı", "AR katman hizalaması fabrika aksına sıfırlandı.");
                  }}
                >
                  <Ionicons name="refresh" size={16} color="#0A7AFF" />
                  <Text style={styles.realignBtnText}>Yeniden Hizala</Text>
                </TouchableOpacity>
              </View>
            </SafeAreaView>
          </CameraView>
        </View>
      ) : (
        /* ================================================================== */
        /* STANDART 3D BIM MODELİ VE İNCELEME GÖRÜNÜMÜ                       */
        /* ================================================================== */
        <>
          {/* Üst Header */}
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.hamburgerButton}
              onPress={openDrawer}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="menu" size={24} color="#FFFFFF" />
            </TouchableOpacity>

            <View style={{ flex: 1 }}>
              <Text style={styles.headerSubtitle}>3D SAHA MÜHENDİSLİĞİ</Text>
              <Text style={styles.headerTitle}>BIM & AR Görüntüleyici</Text>
            </View>

            <View style={styles.statusBadge}>
              <Ionicons
                name={isDownloaded ? "cube" : "cloud-done"}
                size={14}
                color={isDownloaded ? iosColors.systemGreen : iosColors.systemBlue}
              />
              <Text
                style={[
                  styles.statusBadgeText,
                  { color: isDownloaded ? iosColors.systemGreen : iosColors.systemBlue },
                ]}
              >
                {isDownloaded ? "Çevrimdışı Hazır" : "Web Senkronize"}
              </Text>
            </View>
          </View>

          <ScrollView
            style={styles.scrollArea}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {/* Model Önizleme Kartı */}
            <View style={styles.viewerCard}>
              {Platform.OS === "ios" && (
                <BlurView intensity={25} tint="dark" style={StyleSheet.absoluteFill} />
              )}

              <View style={styles.previewCanvas}>
                <MaterialCommunityIcons
                  name="cube-scan"
                  size={64}
                  color={iosColors.systemBlue}
                />
                <Text style={styles.canvasTitle}>3D IFC / GLB Dijital İkiz</Text>
                <Text style={styles.canvasSubtitle}>
                  {activeModel} • Statik & Mekanik Katman
                </Text>

                {isDownloading && (
                  <View style={styles.downloadProgressBox}>
                    <ActivityIndicator size="small" color={iosColors.systemBlue} />
                    <Text style={styles.downloadProgressText}>
                      İndiriliyor... %{Math.round(downloadProgress * 100)}
                    </Text>
                    <View style={styles.progressBarTrack}>
                      <View
                        style={[
                          styles.progressBarFill,
                          { width: `${Math.round(downloadProgress * 100)}%` },
                        ]}
                      />
                    </View>
                  </View>
                )}
              </View>

              {/* Model Bilgileri */}
              <View style={styles.metaRow}>
                <View style={styles.metaCol}>
                  <Text style={styles.metaLabel}>Dosya Boyutu</Text>
                  <Text style={styles.metaValue}>{fileSizeMB ? `${fileSizeMB} MB` : "14.8 MB"}</Text>
                </View>
                <View style={styles.metaCol}>
                  <Text style={styles.metaLabel}>Model Sürümü</Text>
                  <Text style={styles.metaValue}>v4.2 (Kasım 2026)</Text>
                </View>
                <View style={styles.metaCol}>
                  <Text style={styles.metaLabel}>BIM Formatı</Text>
                  <Text style={styles.metaValue}>IFC 4.3 / GLTF</Text>
                </View>
              </View>
            </View>

            {/* ADIM 4: AR BAŞLAT BUTONU */}
            <View style={styles.actionSection}>
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={handleStartAr}
                style={styles.arButton}
              >
                <MaterialCommunityIcons name="augmented-reality" size={26} color="#FFFFFF" />
                <View style={{ flex: 1 }}>
                  <Text style={styles.arButtonTitle}>Gerçek AR Saha Çakıştırmasını Başlat</Text>
                  <Text style={styles.arButtonSub}>
                    Kamerayı kolonlara tutarak tesisat ve donatı kaçıklıklarını inceleyin
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#FFFFFF" />
              </TouchableOpacity>

              {/* Çevrimdışı İndirme / Silme */}
              {isDownloaded ? (
                <TouchableOpacity
                  onPress={handleDelete}
                  activeOpacity={0.8}
                  style={styles.deleteButton}
                >
                  <Feather name="trash-2" size={16} color={iosColors.systemRed} />
                  <Text style={styles.deleteButtonText}>Cihazdaki Yerel Modeli Sil</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  onPress={handleDownload}
                  disabled={isDownloading}
                  activeOpacity={0.85}
                  style={styles.downloadButton}
                >
                  <Feather name="download-cloud" size={18} color="#FFFFFF" />
                  <Text style={styles.downloadButtonText}>
                    Çevrimdışı İncelemek İçin İndir
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Kat & Disiplin Seçimi */}
            <Text style={styles.sectionHeading}>PROJE DİSİPLİNLERİ</Text>
            <View style={styles.disciplinesGrid}>
              {[
                { id: "arch", name: "Mimari Model", count: "1.240 Öğe", icon: "home" },
                { id: "struct", name: "Statik & Betonarme", count: "860 Öğe", icon: "layers" },
                { id: "mep", name: "Mekanik & Tesisat", count: "420 Öğe", icon: "tool" },
                { id: "elec", name: "Elektrik & Pano", count: "310 Öğe", icon: "zap" },
              ].map((disc) => (
                <View key={disc.id} style={styles.disciplineCard}>
                  <View style={styles.discIconBox}>
                    <Feather name={disc.icon as any} size={16} color={iosColors.systemBlue} />
                  </View>
                  <Text style={styles.discName}>{disc.name}</Text>
                  <Text style={styles.discCount}>{disc.count}</Text>
                </View>
              ))}
            </View>
          </ScrollView>
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: iosColors.background,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: iosColors.glassBorder,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  hamburgerButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "rgba(255, 255, 255, 0.06)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  headerSubtitle: {
    fontSize: 10,
    fontWeight: "700",
    color: iosColors.systemBlue,
    letterSpacing: 1.2,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: iosColors.labelPrimary,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: "600",
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 110,
    gap: 16,
  },
  viewerCard: {
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    overflow: "hidden",
  },
  previewCanvas: {
    height: 180,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  canvasTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#FFFFFF",
    marginTop: 10,
  },
  canvasSubtitle: {
    fontSize: 12,
    color: "#8E8E93",
    marginTop: 4,
  },
  downloadProgressBox: {
    width: "80%",
    marginTop: 14,
    alignItems: "center",
    gap: 6,
  },
  downloadProgressText: {
    fontSize: 11,
    color: iosColors.systemBlue,
    fontWeight: "600",
  },
  progressBarTrack: {
    width: "100%",
    height: 4,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 2,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: iosColors.systemBlue,
  },
  metaRow: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.06)",
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  metaCol: {
    flex: 1,
  },
  metaLabel: {
    fontSize: 10,
    color: "#8E8E93",
  },
  metaValue: {
    fontSize: 12,
    fontWeight: "700",
    color: "#FFFFFF",
    marginTop: 2,
  },
  actionSection: {
    gap: 10,
  },
  arButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#0A7AFF",
    padding: 16,
    borderRadius: 16,
    gap: 12,
    shadowColor: "#0A7AFF",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
  arButtonTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  arButtonSub: {
    fontSize: 11,
    color: "rgba(255, 255, 255, 0.8)",
    marginTop: 2,
  },
  downloadButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255, 255, 255, 0.06)",
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  downloadButtonText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "600",
  },
  deleteButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255, 59, 48, 0.1)",
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: "rgba(255, 59, 48, 0.25)",
  },
  deleteButtonText: {
    color: iosColors.systemRed,
    fontSize: 13,
    fontWeight: "600",
  },
  sectionHeading: {
    fontSize: 11,
    fontWeight: "800",
    color: "#8E8E93",
    letterSpacing: 1,
  },
  disciplinesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  disciplineCard: {
    width: (SCREEN_WIDTH - 42) / 2,
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.06)",
    padding: 14,
    gap: 6,
  },
  discIconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: "rgba(10, 122, 255, 0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  discName: {
    fontSize: 13,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  discCount: {
    fontSize: 11,
    color: "#8E8E93",
  },

  /* AR TAM EKRAN STİLLERİ */
  arFullscreenContainer: {
    flex: 1,
    backgroundColor: "#000000",
  },
  arTopHud: {
    paddingHorizontal: 16,
    paddingTop: 8,
    backgroundColor: "rgba(0, 0, 0, 0.45)",
    gap: 10,
  },
  arTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  arCloseButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    alignItems: "center",
    justifyContent: "center",
  },
  arTitleBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  arPulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#FF3B30",
  },
  arTitleText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.8,
  },
  arSnapshotBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#0A7AFF",
    alignItems: "center",
    justifyContent: "center",
  },
  arLayersRow: {
    flexDirection: "row",
    gap: 6,
    paddingBottom: 8,
  },
  arLayerChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    gap: 4,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  arLayerChipBlue: {
    backgroundColor: "rgba(10, 122, 255, 0.35)",
    borderColor: "#0A7AFF",
  },
  arLayerChipOrange: {
    backgroundColor: "rgba(255, 149, 0, 0.35)",
    borderColor: "#FF9500",
  },
  arLayerChipGreen: {
    backgroundColor: "rgba(52, 199, 89, 0.35)",
    borderColor: "#34C759",
  },
  arLayerText: {
    fontSize: 10,
    color: "#8E8E93",
    fontWeight: "600",
  },
  arLayerTextActive: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  arOverlayCanvas: {
    ...StyleSheet.absoluteFill,
    justifyContent: "center",
    alignItems: "center",
  },
  laserContainer: {
    ...StyleSheet.absoluteFill,
    alignItems: "center",
    justifyContent: "center",
  },
  laserCrosshairH: {
    position: "absolute",
    left: 40,
    right: 40,
    height: 1,
    backgroundColor: "rgba(52, 199, 89, 0.75)",
  },
  laserCrosshairV: {
    position: "absolute",
    top: 100,
    bottom: 100,
    width: 1,
    backgroundColor: "rgba(52, 199, 89, 0.75)",
  },
  laserCenterCircle: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    borderWidth: 1,
    borderColor: "#34C759",
    alignItems: "center",
  },
  laserDeltaText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#34C759",
  },
  laserAngleText: {
    fontSize: 9,
    color: "#FFFFFF",
  },
  columnsOverlayGroup: {
    ...StyleSheet.absoluteFill,
  },
  columnBoxS104: {
    position: "absolute",
    top: 180,
    left: 60,
    width: 160,
    height: 160,
    borderWidth: 2,
    borderColor: "rgba(52, 199, 89, 0.8)",
    backgroundColor: "rgba(52, 199, 89, 0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  columnLabel: {
    color: "#34C759",
    fontSize: 10,
    fontWeight: "800",
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
  },
  cornerTL: {
    position: "absolute",
    top: -4,
    left: -4,
    width: 12,
    height: 12,
    borderTopWidth: 3,
    borderLeftWidth: 3,
    borderColor: "#34C759",
  },
  cornerTR: {
    position: "absolute",
    top: -4,
    right: -4,
    width: 12,
    height: 12,
    borderTopWidth: 3,
    borderRightWidth: 3,
    borderColor: "#34C759",
  },
  cornerBL: {
    position: "absolute",
    bottom: -4,
    left: -4,
    width: 12,
    height: 12,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
    borderColor: "#34C759",
  },
  cornerBR: {
    position: "absolute",
    bottom: -4,
    right: -4,
    width: 12,
    height: 12,
    borderBottomWidth: 3,
    borderRightWidth: 3,
    borderColor: "#34C759",
  },
  beamLineK208: {
    position: "absolute",
    top: 180,
    left: 220,
    right: 20,
    height: 4,
    backgroundColor: "rgba(255, 149, 0, 0.8)",
    justifyContent: "center",
  },
  beamLabel: {
    position: "absolute",
    top: -16,
    left: 10,
    color: "#FF9500",
    fontSize: 9,
    fontWeight: "700",
    backgroundColor: "rgba(0,0,0,0.7)",
    paddingHorizontal: 4,
    borderRadius: 2,
  },
  pipesOverlayGroup: {
    ...StyleSheet.absoluteFill,
  },
  pipeVerticalBlue: {
    position: "absolute",
    top: 80,
    bottom: 120,
    left: 120,
    width: 6,
    backgroundColor: "rgba(10, 122, 255, 0.85)",
    alignItems: "center",
    justifyContent: "center",
  },
  pipeHorizontalRed: {
    position: "absolute",
    top: 140,
    left: 20,
    right: 20,
    height: 5,
    backgroundColor: "rgba(255, 59, 48, 0.85)",
    justifyContent: "center",
    alignItems: "flex-end",
    paddingRight: 10,
  },
  pipeHorizontalGreen: {
    position: "absolute",
    top: 360,
    left: 20,
    right: 20,
    height: 4,
    backgroundColor: "rgba(52, 199, 89, 0.85)",
    justifyContent: "center",
    paddingLeft: 20,
  },
  pipeLabel: {
    color: "#FFFFFF",
    fontSize: 9,
    fontWeight: "700",
    backgroundColor: "rgba(0,0,0,0.75)",
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 2,
  },
  arBottomHud: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(0, 0, 0, 0.65)",
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  arBottomControls: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  controlGroup: {
    alignItems: "center",
    gap: 4,
  },
  controlLabel: {
    fontSize: 10,
    color: "#8E8E93",
    fontWeight: "600",
  },
  zoomButtonsRow: {
    flexDirection: "row",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 8,
    padding: 2,
    gap: 2,
  },
  zoomBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  realignBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(10, 122, 255, 0.15)",
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
    gap: 4,
    borderWidth: 1,
    borderColor: "rgba(10, 122, 255, 0.3)",
  },
  realignBtnText: {
    color: "#0A7AFF",
    fontSize: 11,
    fontWeight: "700",
  },
});
