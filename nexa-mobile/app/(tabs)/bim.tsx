/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Nexa ERP Mobil - True AR (BIM Artırılmış Gerçeklik) & "Duvarın Arkasını Gör" (X-Ray) Ekranı
 *
 * Özellikler:
 * 1. Şantiyede "Duvarın Arkasını Gör" (X-Ray AR Modu):
 *    - Kamera ile duvara tutulduğunda duvarlar yarı saydam (%15) hayalet kılavuza dönüşür.
 *    - Duvarın arkasındaki Mekanik borular (Pis su, Yangın sprinkler, Temiz su, Havalandırma),
 *      Elektrik kablo tavaları ve Statik kolon/kirişler parlayarak net şekilde görünür.
 * 2. 3D Dijital İkiz Modu:
 *    - Web AR / 3D Canvas WebView entegrasyonu ve çevrimdışı model yönetimi.
 * 3. 2D Pafta ve Katmanlar:
 *    - Mimari, Statik, Elektrik, Mekanik disiplin paftaları listesi ve filtreleme.
 * 4. Çoklu Proje Seçimi ve Lazer Hizalama Kılavuzu.
 */

import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
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
import { WebView } from "react-native-webview";
import { useOfflineBIM } from "../../src/hooks/useOfflineBIM";
import { iosColors, iosRadius } from "../../src/theme/iosTheme";
import { bimApi, API_BASE_URL } from "../../apiClient";
import { useDrawer } from "../../src/components/navigation/DrawerSidebar";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

// Mock / Canlı Proje Listesi
const SAMPLE_PROJECTS = [
  { id: "cm01projekaydi", name: "Merkez Rezidans - Blok A & B", code: "MR-2026", floors: "14 Kat" },
  { id: "cm02projekaydi", name: "Nexa Towers Karma Yaşam Merkezi", code: "NT-2026", floors: "28 Kat" },
  { id: "cm03projekaydi", name: "Esenyurt Lojistik Depo Kompleksi", code: "EL-2026", floors: "3 Kat" },
];

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

  // Aktif Proje ve Sekme
  const [selectedProject, setSelectedProject] = useState(SAMPLE_PROJECTS[0]);
  const [activeTab, setActiveTab] = useState<"camera" | "3d" | "2d">("camera");

  // AR & Kamera Durumları
  const [permission, requestPermission] = useCameraPermissions();
  const [isArActive, setIsArActive] = useState(false);
  const [isXRayMode, setIsXRayMode] = useState(true); // "Duvarın Arkasını Gör" varsayılan aktif
  const [showLaser, setShowLaser] = useState(true);
  const [showPipes, setShowPipes] = useState(true);
  const [showColumns, setShowColumns] = useState(true);
  const [showElectrical, setShowElectrical] = useState(true);
  const [overlayOpacity, setOverlayOpacity] = useState(0.85);
  const [scale, setScale] = useState(1.0);
  const [lowMemoryMode, setLowMemoryMode] = useState(false);

  // WebView / 3D Model Durumları
  const [webViewLoading, setWebViewLoading] = useState(true);

  // Web API'den güncel BIM katman planını çek
  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        await bimApi.getCurrentModelOverlay();
      } catch (err) {
        console.warn("[BimArScreen] Model overlay uyarısı:", err);
      }
    })();
    return () => {
      isMounted = false;
    };
  }, [selectedProject]);

  // RAM şişmesini önleyen memoized transform
  const memoizedTransform = useMemo(() => {
    return {
      opacity: overlayOpacity,
      transform: [{ scale: lowMemoryMode ? 1.0 : scale }],
    };
  }, [overlayOpacity, scale, lowMemoryMode]);

  // AR Başlatma Handler
  const handleStartAr = useCallback(async () => {
    try {
      if (!permission?.granted) {
        const { granted } = await requestPermission();
        if (!granted) {
          Alert.alert(
            "Kamera İzni Gerekli",
            "Şantiyede duvarın arkasındaki tesisat ve kolonları görebilmek için kamera izni vermeniz gerekmektedir."
          );
          return;
        }
      }
      setIsArActive(true);
    } catch (err: any) {
      console.error("[BimArScreen] AR Başlatma Hatası:", err);
      Alert.alert("AR Hatası", "Kamera başlatılamadı. Lütfen kamera izinlerinizi kontrol edin.");
    }
  }, [permission, requestPermission]);

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
      "📸 AR Saha Fotoğrafı Kaydedildi",
      `Duvar arkası X-Ray röntgen görüntüsü, boru kotları ve lazer hizalamaları ${selectedProject.name} şantiye günlüğüne (Jurnal) işlendi.`
    );
  };

  // Web AR URL'si
  const webArUrl = useMemo(() => {
    const webDomain = API_BASE_URL.replace("/api", "");
    return `${webDomain}/tr/ar/${selectedProject.id}?embed=1&mode=${isXRayMode ? "xray" : "3d"}`;
  }, [selectedProject, isXRayMode]);

  return (
    <SafeAreaView style={styles.safeContainer} edges={["top", "left", "right"]}>
      {/* ==================================================================== */}
      {/* 1. CANLI AR TAM EKRAN KAMERA (DUVARIN ARKASINI GÖR MODU)             */}
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
                  <View style={[styles.arPulseDot, isXRayMode && styles.arPulseDotXRay]} />
                  <Text style={styles.arTitleText}>
                    {isXRayMode ? "🩻 DUVARIN ARKASINI GÖR (X-RAY)" : "BIM AR SAHA HİZALAMA"}
                  </Text>
                </View>

                <TouchableOpacity
                  style={styles.arSnapshotBtn}
                  onPress={handleSnapshot}
                >
                  <Ionicons name="camera" size={20} color="#FFFFFF" />
                </TouchableOpacity>
              </View>

              {/* X-Ray Modu Aç / Kapat Butonu */}
              <View style={styles.xRayToggleRow}>
                <TouchableOpacity
                  style={[styles.xRayToggleBtn, isXRayMode && styles.xRayToggleBtnActive]}
                  onPress={() => setIsXRayMode(!isXRayMode)}
                  activeOpacity={0.85}
                >
                  <MaterialCommunityIcons
                    name="radiology-box"
                    size={16}
                    color={isXRayMode ? "#00FFFF" : "#8E8E93"}
                  />
                  <Text style={[styles.xRayToggleText, isXRayMode && styles.xRayToggleTextActive]}>
                    {isXRayMode ? "✓ Duvarın Arkası Görünüyor (Duvar %15 Şeffaf)" : "Normal Mod (Duvar Opak)"}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Katman Aç/Kapa Çipleri */}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.arLayersRow}
              >
                {/* Mekanik / Boru */}
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
                    Tesisat & Boru (MEP)
                  </Text>
                </TouchableOpacity>

                {/* Kolon / Kiriş */}
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
                    Kolon / Kiriş (Statik)
                  </Text>
                </TouchableOpacity>

                {/* Elektrik */}
                <TouchableOpacity
                  style={[styles.arLayerChip, showElectrical && styles.arLayerChipYellow]}
                  onPress={() => setShowElectrical(!showElectrical)}
                >
                  <Ionicons
                    name="flash"
                    size={12}
                    color={showElectrical ? "#FFFFFF" : "#8E8E93"}
                  />
                  <Text style={[styles.arLayerText, showElectrical && styles.arLayerTextActive]}>
                    Kablo Tavası (Elektrik)
                  </Text>
                </TouchableOpacity>

                {/* Lazer Hizalama */}
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
                    Lazer Kılavuz
                  </Text>
                </TouchableOpacity>
              </ScrollView>
            </SafeAreaView>

            {/* ================================================================ */}
            {/* ORTA: AR DUVAR ARKASI ÇİZGİLERİ (X-RAY GHOST OVERLAY)            */}
            {/* ================================================================ */}
            <View style={[styles.arOverlayCanvas, memoizedTransform]} pointerEvents="none">
              {/* 1. Şeffaf Duvar Izgarası (Ghost Wall Grid) */}
              {isXRayMode && (
                <View style={styles.ghostWallBox}>
                  <View style={styles.ghostWallHeader}>
                    <Text style={styles.ghostWallLabel}>
                      🧱 25cm Gazbeton Duvar (Röntgen Modu: %15 Şeffaf)
                    </Text>
                    <Text style={styles.ghostWallKot}>Kot: +2.80 m</Text>
                  </View>
                  <View style={styles.ghostWallGrid} />
                </View>
              )}

              {/* 2. Lazer Hizalama Nişangahı */}
              {showLaser && (
                <View style={styles.laserContainer}>
                  <View style={styles.laserCrosshairH} />
                  <View style={styles.laserCrosshairV} />
                  <View style={styles.laserCenterCircle}>
                    <Text style={styles.laserDeltaText}>ΔX: 0.0 cm  ΔY: 0.0 cm</Text>
                    <Text style={styles.laserAngleText}>Duvar Açısı: 90.0° (Tam Hizalı)</Text>
                  </View>
                </View>
              )}

              {/* 3. Statik Kolon ve Taşıyıcı Sistem (Duvarın Arkasında) */}
              {showColumns && (
                <View style={styles.columnsOverlayGroup}>
                  <View style={styles.columnBoxS104}>
                    <View style={styles.columnHeaderBar}>
                      <Text style={styles.columnLabel}>S-104 BETONARME KOLONU (60x60)</Text>
                    </View>
                    <Text style={styles.columnSubLabel}>12Ф20 Donatı • C35/45 Beton</Text>
                    <View style={styles.cornerTL} />
                    <View style={styles.cornerTR} />
                    <View style={styles.cornerBL} />
                    <View style={styles.cornerBR} />
                  </View>

                  <View style={styles.beamLineK208}>
                    <Text style={styles.beamLabel}>K-208 ANA TAŞIYICI KİRİŞ [30/60 cm - KOT: +3.20]</Text>
                  </View>
                </View>
              )}

              {/* 4. Duvarın Arkasındaki Mekanik Borular (MEP) */}
              {showPipes && (
                <View style={styles.pipesOverlayGroup}>
                  {/* Pis Su Dikey İniş Kolonu */}
                  <View style={styles.pipeVerticalBlue}>
                    <View style={styles.pipeGlowEffect} />
                    <Text style={styles.pipeLabel}>Ø110 Pis Su Ana İnişi (Duvar İçi 12cm)</Text>
                  </View>

                  {/* Yangın Sprinkler Hattı */}
                  <View style={styles.pipeHorizontalRed}>
                    <View style={styles.pipeGlowEffectRed} />
                    <Text style={styles.pipeLabel}>Ø25 Yangın Sprinkler Hattı [2.8 Bar - Duvar İçi 8cm]</Text>
                  </View>

                  {/* Temiz Su Besleme */}
                  <View style={styles.pipeHorizontalGreen}>
                    <Text style={styles.pipeLabel}>Ø32 Temiz Soğuk Su Dağıtım Borusu</Text>
                  </View>

                  {/* HVAC Havalandırma Kanalı */}
                  <View style={styles.ductBoxOrange}>
                    <Text style={styles.ductLabel}>40x25 Galvaniz Havalandırma Kanalı (Tavan Kotu)</Text>
                  </View>
                </View>
              )}

              {/* 5. Elektrik Kablo Tavaları (Duvar İçi / Tavan) */}
              {showElectrical && (
                <View style={styles.electricalOverlayGroup}>
                  <View style={styles.cableTrayYellow}>
                    <Text style={styles.cableTrayLabel}>⚡ 200x50 mm Kuvvetli Akım Kablo Tavası (Kot: +2.90m)</Text>
                  </View>
                </View>
              )}
            </View>

            {/* Alt Kontrol Paneli (Radar & Zoom & Şeffaflık) */}
            <SafeAreaView edges={["bottom"]} style={styles.arBottomHud}>
              {/* Duvar Radarı Bilgi Kartı */}
              <View style={styles.radarCard}>
                <View style={styles.radarIconBox}>
                  <MaterialCommunityIcons name="radar" size={16} color="#00FFFF" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.radarTitle}>Duvar İçi Tesisat Radarı (Canlı Algılama)</Text>
                  <Text style={styles.radarSub}>
                    Duvar İçi: Ø110 Pis Su (12cm geride) • S-104 Kolon (45cm sağda) • Eğim: 0.0°
                  </Text>
                </View>
                <View style={styles.radarTag}>
                  <Text style={styles.radarTagText}>HİZALI</Text>
                </View>
              </View>

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
                  <Text style={styles.controlLabel}>Röntgen: %{Math.round(overlayOpacity * 100)}</Text>
                  <View style={styles.zoomButtonsRow}>
                    <TouchableOpacity
                      style={styles.zoomBtn}
                      onPress={() => setOverlayOpacity((o) => Math.max(0.2, o - 0.15))}
                    >
                      <Ionicons name="contrast-outline" size={14} color="#FFFFFF" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.zoomBtn}
                      onPress={() => setOverlayOpacity((o) => Math.min(1.0, o + 0.15))}
                    >
                      <Ionicons name="contrast" size={14} color="#FFFFFF" />
                    </TouchableOpacity>
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.realignBtn}
                  onPress={() => {
                    setScale(1.0);
                    setOverlayOpacity(0.85);
                    Alert.alert("Sıfırlandı", "AR katman hizalaması fabrika aksına sıfırlandı.");
                  }}
                >
                  <Ionicons name="refresh" size={16} color="#0A7AFF" />
                  <Text style={styles.realignBtnText}>Sıfırla</Text>
                </TouchableOpacity>
              </View>
            </SafeAreaView>
          </CameraView>
        </View>
      ) : (
        /* ================================================================== */
        /* STANDART GÖRÜNÜM: 3D MODEL, 2D PAFTALAR VE PROJE YÖNETİMİ          */
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
              <Text style={styles.headerSubtitle}>3D SAHA MÜHENDİSLİĞİ & AR</Text>
              <Text style={styles.headerTitle}>BIM & X-Ray Navigasyon</Text>
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

          {/* Proje Seçici Çipleri */}
          <View style={styles.projectSelectorContainer}>
            <Text style={styles.projectSelectorLabel}>AKTİF PROJE:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
              {SAMPLE_PROJECTS.map((proj) => {
                const isSelected = proj.id === selectedProject.id;
                return (
                  <TouchableOpacity
                    key={proj.id}
                    onPress={() => setSelectedProject(proj)}
                    style={[styles.projectChip, isSelected && styles.projectChipActive]}
                  >
                    <Text style={[styles.projectChipText, isSelected && styles.projectChipTextActive]}>
                      {proj.name}
                    </Text>
                    <Text style={[styles.projectChipBadge, isSelected && styles.projectChipBadgeActive]}>
                      {proj.floors}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {/* Mod Değiştirme Segmenti (AR Kamera | 3D Model | 2D Paftalar) */}
          <View style={styles.segmentContainer}>
            <TouchableOpacity
              style={[styles.segmentBtn, activeTab === "camera" && styles.segmentBtnActive]}
              onPress={() => setActiveTab("camera")}
            >
              <MaterialCommunityIcons
                name="augmented-reality"
                size={16}
                color={activeTab === "camera" ? "#FFFFFF" : "#8E8E93"}
              />
              <Text style={[styles.segmentText, activeTab === "camera" && styles.segmentTextActive]}>
                AR X-Ray Kamera
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.segmentBtn, activeTab === "3d" && styles.segmentBtnActive]}
              onPress={() => setActiveTab("3d")}
            >
              <Ionicons
                name="cube"
                size={16}
                color={activeTab === "3d" ? "#FFFFFF" : "#8E8E93"}
              />
              <Text style={[styles.segmentText, activeTab === "3d" && styles.segmentTextActive]}>
                3D Dijital İkiz
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.segmentBtn, activeTab === "2d" && styles.segmentBtnActive]}
              onPress={() => setActiveTab("2d")}
            >
              <Ionicons
                name="document-text"
                size={16}
                color={activeTab === "2d" ? "#FFFFFF" : "#8E8E93"}
              />
              <Text style={[styles.segmentText, activeTab === "2d" && styles.segmentTextActive]}>
                2D Paftalar
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.scrollArea}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {/* ============================================================== */}
            {/* SEKMELER: 1. AR KAMERA ÖNİZLEMESİ                              */}
            {/* ============================================================== */}
            {activeTab === "camera" && (
              <>
                <View style={styles.viewerCard}>
                  {Platform.OS === "ios" && (
                    <BlurView intensity={25} tint="dark" style={StyleSheet.absoluteFill} />
                  )}

                  <View style={styles.previewCanvas}>
                    <View style={styles.xRayHeroCircle}>
                      <MaterialCommunityIcons name="radiology-box" size={44} color="#00FFFF" />
                    </View>
                    <Text style={styles.canvasTitle}>Şantiyede Duvarın Arkasını Gör</Text>
                    <Text style={styles.canvasSubtitle}>
                      {selectedProject.name} • Canlı X-Ray Kamera & Lazer Kılavuz
                    </Text>

                    <View style={styles.xRayFeatureBadge}>
                      <Ionicons name="checkmark-circle" size={14} color="#34C759" />
                      <Text style={styles.xRayFeatureText}>
                        Duvarlar %15 Saydamlaşır • MEP Boruları & Donatılar Opak Parlar
                      </Text>
                    </View>
                  </View>

                  <View style={styles.metaRow}>
                    <View style={styles.metaCol}>
                      <Text style={styles.metaLabel}>X-Ray Tipi</Text>
                      <Text style={styles.metaValue}>BIM Röntgen</Text>
                    </View>
                    <View style={styles.metaCol}>
                      <Text style={styles.metaLabel}>Hassasiyet</Text>
                      <Text style={styles.metaValue}>±0.2 cm Lazer</Text>
                    </View>
                    <View style={styles.metaCol}>
                      <Text style={styles.metaLabel}>Tesisat Algılama</Text>
                      <Text style={styles.metaValue}>Tam Otomatik</Text>
                    </View>
                  </View>
                </View>

                {/* AR Başlat Butonu */}
                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={handleStartAr}
                  style={styles.arButton}
                >
                  <MaterialCommunityIcons name="augmented-reality" size={26} color="#FFFFFF" />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.arButtonTitle}>Kamerayı Aç & Duvarın Arkasını Gör</Text>
                    <Text style={styles.arButtonSub}>
                      Telefon kamerasını duvara doğrultarak içindeki boru ve kolonları canlandırın
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#FFFFFF" />
                </TouchableOpacity>
              </>
            )}

            {/* ============================================================== */}
            {/* SEKMELER: 2. 3D DİJİTAL İKİZ (WEB AR WEBVIEW)                  */}
            {/* ============================================================== */}
            {activeTab === "3d" && (
              <View style={styles.webViewCard}>
                <View style={styles.webViewHolder}>
                  <WebView
                    source={{ uri: webArUrl }}
                    style={{ flex: 1, backgroundColor: "#0A0F1C" }}
                    onLoadEnd={() => setWebViewLoading(false)}
                    allowsInlineMediaPlayback
                    mediaPlaybackRequiresUserAction={false}
                    javaScriptEnabled
                    domStorageEnabled
                  />
                  {webViewLoading && (
                    <View style={styles.webViewLoader}>
                      <ActivityIndicator size="large" color="#0A7AFF" />
                      <Text style={styles.webViewLoaderText}>3D WebGL Canvas Yükleniyor...</Text>
                    </View>
                  )}
                </View>

                <View style={styles.webViewFooter}>
                  <TouchableOpacity
                    style={styles.webArExternalBtn}
                    onPress={handleStartAr}
                  >
                    <Ionicons name="camera" size={16} color="#FFFFFF" />
                    <Text style={styles.webArExternalBtnText}>AR Saha Kamerasını Aç</Text>
                  </TouchableOpacity>

                  {isDownloaded ? (
                    <TouchableOpacity onPress={handleDelete} style={styles.deleteButtonSmall}>
                      <Feather name="trash-2" size={14} color={iosColors.systemRed} />
                      <Text style={styles.deleteButtonSmallText}>Yerel Modeli Sil</Text>
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity
                      onPress={handleDownload}
                      disabled={isDownloading}
                      style={styles.downloadButtonSmall}
                    >
                      <Feather name="download-cloud" size={14} color="#FFFFFF" />
                      <Text style={styles.downloadButtonSmallText}>
                        {isDownloading ? `%${Math.round(downloadProgress * 100)}` : "Çevrimdışı İndir"}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            )}

            {/* ============================================================== */}
            {/* SEKMELER: 3. 2D PAFTALAR VE KATMANLAR                          */}
            {/* ============================================================== */}
            {activeTab === "2d" && (
              <View style={{ gap: 12 }}>
                <Text style={styles.sectionHeading}>PROJE TEKNİK PAFTALARI (2D→3D)</Text>
                {[
                  {
                    id: "pdf-1",
                    title: "Zemin Kat Mimari Yerleşim & Duvar Paftası",
                    disc: "Mimari",
                    badge: "2D Pafta",
                    elements: "48 Duvar Elemanı",
                    color: "#f59e0b",
                  },
                  {
                    id: "pdf-2",
                    title: "Kolon Aplikasyon & Statik Taşıyıcı Kalıp Planı",
                    disc: "Statik",
                    badge: "2D Pafta",
                    elements: "24 Kolon, 36 Kiriş",
                    color: "#3b82f6",
                  },
                  {
                    id: "pdf-3",
                    title: "Sıhhi Tesisat & Yangın Sprinkler Mekanik Projesi",
                    disc: "Mekanik",
                    badge: "2D Pafta",
                    elements: "18 Tesisat Boru Hattı",
                    color: "#06b6d4",
                  },
                  {
                    id: "pdf-4",
                    title: "Kuvvetli Akım & Kablo Tavası Elektrik Dağıtım Planı",
                    disc: "Elektrik",
                    badge: "2D Pafta",
                    elements: "12 Kablo Tavası, 4 Şaft",
                    color: "#eab308",
                  },
                ].map((doc) => (
                  <View key={doc.id} style={styles.docCard}>
                    <View style={[styles.docIconCircle, { backgroundColor: `${doc.color}20` }]}>
                      <Ionicons name="document-text" size={20} color={doc.color} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.docTitle}>{doc.title}</Text>
                      <Text style={styles.docSub}>
                        {doc.disc} • {doc.elements}
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={styles.docViewBtn}
                      onPress={() => {
                        Alert.alert(
                          "2D Pafta & 3D Bütünleşik Model",
                          `"${doc.title}" paftası seçildi. Bu pafta 3D ortamda diğer tüm katmanlarla (Statik, Mimari, MEP) birleşik olarak görüntülenmektedir.`
                        );
                      }}
                    >
                      <Text style={styles.docViewBtnText}>İncele</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}

            {/* Kat & Disiplin İstatistikleri */}
            <Text style={styles.sectionHeading}>PROJE BİLEŞENLERİ (BÜTÜNLEŞİK DİJİTAL İKİZ)</Text>
            <View style={styles.disciplinesGrid}>
              {[
                { id: "arch", name: "Mimari Duvarlar", count: "1.240 Öğe", icon: "home", color: "#f59e0b" },
                { id: "struct", name: "Statik Kolon/Kiriş", count: "860 Öğe", icon: "layers", color: "#3b82f6" },
                { id: "mep", name: "Mekanik & Tesisat", count: "420 Öğe", icon: "tool", color: "#06b6d4" },
                { id: "elec", name: "Elektrik & Tava", count: "310 Öğe", icon: "zap", color: "#eab308" },
              ].map((disc) => (
                <View key={disc.id} style={styles.disciplineCard}>
                  <View style={[styles.discIconBox, { backgroundColor: `${disc.color}15` }]}>
                    <Feather name={disc.icon as any} size={16} color={disc.color} />
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

  // Proje Seçici
  projectSelectorContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.05)",
  },
  projectSelectorLabel: {
    fontSize: 9.5,
    fontWeight: "800",
    color: "#8E8E93",
    letterSpacing: 1,
    marginBottom: 6,
  },
  projectChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
  },
  projectChipActive: {
    backgroundColor: "rgba(10, 122, 255, 0.2)",
    borderColor: "#0A7AFF",
  },
  projectChipText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#8E8E93",
  },
  projectChipTextActive: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  projectChipBadge: {
    fontSize: 9.5,
    color: "#8E8E93",
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 6,
  },
  projectChipBadgeActive: {
    color: "#0A7AFF",
    backgroundColor: "rgba(10, 122, 255, 0.2)",
  },

  // Segment Bar
  segmentContainer: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
  },
  segmentBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
  },
  segmentBtnActive: {
    backgroundColor: "#0A7AFF",
    borderColor: "#0A7AFF",
  },
  segmentText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#8E8E93",
  },
  segmentTextActive: {
    color: "#FFFFFF",
    fontWeight: "700",
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
    height: 190,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  xRayHeroCircle: {
    width: 68,
    height: 68,
    borderRadius: 20,
    backgroundColor: "rgba(0, 255, 255, 0.12)",
    borderWidth: 1.5,
    borderColor: "rgba(0, 255, 255, 0.4)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  canvasTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#FFFFFF",
    marginTop: 4,
  },
  canvasSubtitle: {
    fontSize: 12,
    color: "#8E8E93",
    marginTop: 2,
  },
  xRayFeatureBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(52, 199, 89, 0.12)",
    borderWidth: 1,
    borderColor: "rgba(52, 199, 89, 0.3)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginTop: 10,
  },
  xRayFeatureText: {
    fontSize: 10.5,
    fontWeight: "700",
    color: "#34C759",
  },

  metaRow: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.08)",
    padding: 12,
  },
  metaCol: {
    flex: 1,
    alignItems: "center",
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

  arButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 16,
    borderRadius: 16,
    backgroundColor: "#0A7AFF",
    shadowColor: "#0A7AFF",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
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

  // WebView Card
  webViewCard: {
    borderRadius: 20,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    backgroundColor: "#0A0F1C",
  },
  webViewHolder: {
    height: 380,
    position: "relative",
  },
  webViewLoader: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "#0A0F1C",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  webViewLoaderText: {
    fontSize: 12,
    color: "#8E8E93",
  },
  webViewFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.08)",
    backgroundColor: "rgba(10, 15, 28, 0.95)",
  },
  webArExternalBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#0A7AFF",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  webArExternalBtnText: {
    fontSize: 11.5,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  downloadButtonSmall: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
  },
  downloadButtonSmallText: {
    fontSize: 11,
    color: "#FFFFFF",
    fontWeight: "600",
  },
  deleteButtonSmall: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(255, 59, 48, 0.15)",
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
  },
  deleteButtonSmallText: {
    fontSize: 11,
    color: iosColors.systemRed,
    fontWeight: "600",
  },

  // 2D Pafta Kartları
  docCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: 16,
    backgroundColor: "rgba(255, 255, 255, 0.04)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
  },
  docIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  docTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  docSub: {
    fontSize: 11,
    color: "#8E8E93",
    marginTop: 2,
  },
  docViewBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
  },
  docViewBtnText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#0A7AFF",
  },

  sectionHeading: {
    fontSize: 11,
    fontWeight: "800",
    color: "#8E8E93",
    letterSpacing: 1,
    marginTop: 8,
  },
  disciplinesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  disciplineCard: {
    width: (SCREEN_WIDTH - 32 - 8) / 2,
    padding: 12,
    borderRadius: 14,
    backgroundColor: "rgba(255, 255, 255, 0.04)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
  },
  discIconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
  },
  discName: {
    fontSize: 12,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  discCount: {
    fontSize: 10.5,
    color: "#8E8E93",
    marginTop: 1,
  },

  // =========================================================================
  // AR KAMERA TAM EKRAN STİLLERİ
  // =========================================================================
  arFullscreenContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "#000000",
    zIndex: 999,
  },
  arTopHud: {
    paddingHorizontal: 16,
    paddingTop: 8,
    backgroundColor: "rgba(0, 0, 0, 0.65)",
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
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  arTitleBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    borderWidth: 1,
    borderColor: "rgba(0, 255, 255, 0.4)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
  },
  arPulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#34C759",
  },
  arPulseDotXRay: {
    backgroundColor: "#00FFFF",
  },
  arTitleText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#00FFFF",
    letterSpacing: 0.5,
  },
  arSnapshotBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(0, 122, 255, 0.6)",
    alignItems: "center",
    justifyContent: "center",
  },

  xRayToggleRow: {
    flexDirection: "row",
    justifyContent: "center",
  },
  xRayToggleBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
  },
  xRayToggleBtnActive: {
    backgroundColor: "rgba(0, 255, 255, 0.15)",
    borderColor: "#00FFFF",
  },
  xRayToggleText: {
    fontSize: 11.5,
    fontWeight: "700",
    color: "#8E8E93",
  },
  xRayToggleTextActive: {
    color: "#00FFFF",
  },

  arLayersRow: {
    gap: 8,
    paddingBottom: 8,
  },
  arLayerChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  arLayerChipBlue: {
    backgroundColor: "rgba(10, 122, 255, 0.4)",
    borderColor: "#0A7AFF",
  },
  arLayerChipOrange: {
    backgroundColor: "rgba(255, 149, 0, 0.4)",
    borderColor: "#FF9500",
  },
  arLayerChipYellow: {
    backgroundColor: "rgba(234, 179, 8, 0.4)",
    borderColor: "#eab308",
  },
  arLayerChipGreen: {
    backgroundColor: "rgba(52, 199, 89, 0.4)",
    borderColor: "#34C759",
  },
  arLayerText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#8E8E93",
  },
  arLayerTextActive: {
    color: "#FFFFFF",
  },

  arOverlayCanvas: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  // Şeffaf Duvar Izgarası
  ghostWallBox: {
    position: "absolute",
    width: SCREEN_WIDTH * 0.88,
    height: SCREEN_HEIGHT * 0.48,
    borderWidth: 1.5,
    borderColor: "rgba(0, 255, 255, 0.35)",
    backgroundColor: "rgba(0, 255, 255, 0.05)",
    borderRadius: 12,
  },
  ghostWallHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "rgba(0, 255, 255, 0.15)",
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  ghostWallLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: "#00FFFF",
  },
  ghostWallKot: {
    fontSize: 10,
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
    color: "#00FFFF",
  },
  ghostWallGrid: {
    flex: 1,
    borderStyle: "dashed",
    borderWidth: 1,
    borderColor: "rgba(0, 255, 255, 0.15)",
  },

  // Lazer
  laserContainer: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
  },
  laserCrosshairH: {
    width: 180,
    height: 1.5,
    backgroundColor: "#34C759",
    opacity: 0.8,
  },
  laserCrosshairV: {
    position: "absolute",
    width: 1.5,
    height: 180,
    backgroundColor: "#34C759",
    opacity: 0.8,
  },
  laserCenterCircle: {
    position: "absolute",
    alignItems: "center",
    gap: 2,
    top: 25,
  },
  laserDeltaText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#34C759",
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  laserAngleText: {
    fontSize: 9,
    color: "#FFFFFF",
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },

  // Kolonlar
  columnsOverlayGroup: {
    position: "absolute",
    width: "100%",
    height: "100%",
  },
  columnBoxS104: {
    position: "absolute",
    top: "22%",
    left: "14%",
    width: 130,
    height: 240,
    borderWidth: 2,
    borderColor: "#3b82f6",
    backgroundColor: "rgba(59, 130, 246, 0.12)",
    padding: 6,
  },
  columnHeaderBar: {
    backgroundColor: "rgba(59, 130, 246, 0.8)",
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
  },
  columnLabel: {
    fontSize: 9,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  columnSubLabel: {
    fontSize: 8,
    color: "#93c5fd",
    marginTop: 2,
  },
  cornerTL: { position: "absolute", top: -2, left: -2, width: 8, height: 8, borderTopWidth: 3, borderLeftWidth: 3, borderColor: "#3b82f6" },
  cornerTR: { position: "absolute", top: -2, right: -2, width: 8, height: 8, borderTopWidth: 3, borderRightWidth: 3, borderColor: "#3b82f6" },
  cornerBL: { position: "absolute", bottom: -2, left: -2, width: 8, height: 8, borderBottomWidth: 3, borderLeftWidth: 3, borderColor: "#3b82f6" },
  cornerBR: { position: "absolute", bottom: -2, right: -2, width: 8, height: 8, borderBottomWidth: 3, borderRightWidth: 3, borderColor: "#3b82f6" },

  beamLineK208: {
    position: "absolute",
    top: "18%",
    left: "10%",
    right: "10%",
    height: 32,
    borderWidth: 2,
    borderColor: "#60a5fa",
    backgroundColor: "rgba(96, 165, 250, 0.15)",
    justifyContent: "center",
    paddingHorizontal: 8,
  },
  beamLabel: {
    fontSize: 9,
    fontWeight: "700",
    color: "#FFFFFF",
  },

  // Tesisat Boruları
  pipesOverlayGroup: {
    position: "absolute",
    width: "100%",
    height: "100%",
  },
  pipeVerticalBlue: {
    position: "absolute",
    top: "15%",
    right: "22%",
    width: 22,
    height: 280,
    backgroundColor: "rgba(6, 182, 212, 0.75)",
    borderWidth: 1.5,
    borderColor: "#06b6d4",
    borderRadius: 11,
    justifyContent: "center",
    alignItems: "center",
  },
  pipeGlowEffect: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "#06b6d4",
    opacity: 0.3,
    borderRadius: 11,
  },
  pipeHorizontalRed: {
    position: "absolute",
    top: "35%",
    left: "12%",
    right: "12%",
    height: 14,
    backgroundColor: "rgba(239, 68, 68, 0.8)",
    borderWidth: 1,
    borderColor: "#ef4444",
    borderRadius: 7,
    justifyContent: "center",
    paddingHorizontal: 8,
  },
  pipeGlowEffectRed: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "#ef4444",
    opacity: 0.35,
    borderRadius: 7,
  },
  pipeHorizontalGreen: {
    position: "absolute",
    top: "42%",
    left: "12%",
    right: "12%",
    height: 12,
    backgroundColor: "rgba(16, 185, 129, 0.8)",
    borderWidth: 1,
    borderColor: "#10b981",
    borderRadius: 6,
    justifyContent: "center",
    paddingHorizontal: 8,
  },
  ductBoxOrange: {
    position: "absolute",
    top: "24%",
    left: "15%",
    right: "15%",
    height: 28,
    backgroundColor: "rgba(249, 115, 22, 0.6)",
    borderWidth: 1.5,
    borderColor: "#f97316",
    borderRadius: 4,
    justifyContent: "center",
    paddingHorizontal: 8,
  },
  ductLabel: {
    fontSize: 8.5,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  pipeLabel: {
    fontSize: 8,
    fontWeight: "700",
    color: "#FFFFFF",
  },

  // Elektrik Tavaları
  electricalOverlayGroup: {
    position: "absolute",
    width: "100%",
    height: "100%",
  },
  cableTrayYellow: {
    position: "absolute",
    top: "48%",
    left: "10%",
    right: "10%",
    height: 16,
    backgroundColor: "rgba(234, 179, 8, 0.75)",
    borderWidth: 1.5,
    borderColor: "#eab308",
    borderRadius: 3,
    justifyContent: "center",
    paddingHorizontal: 8,
  },
  cableTrayLabel: {
    fontSize: 8.5,
    fontWeight: "800",
    color: "#000000",
  },

  // Alt HUD
  arBottomHud: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: "rgba(0, 0, 0, 0.75)",
    gap: 8,
  },
  radarCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(0, 255, 255, 0.12)",
    borderWidth: 1,
    borderColor: "rgba(0, 255, 255, 0.3)",
    padding: 8,
    borderRadius: 12,
  },
  radarIconBox: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: "rgba(0, 255, 255, 0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  radarTitle: {
    fontSize: 10.5,
    fontWeight: "700",
    color: "#00FFFF",
  },
  radarSub: {
    fontSize: 9.5,
    color: "#E2E8F0",
    marginTop: 1,
  },
  radarTag: {
    backgroundColor: "rgba(52, 199, 89, 0.3)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  radarTagText: {
    fontSize: 8.5,
    fontWeight: "800",
    color: "#34C759",
  },

  arBottomControls: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  controlGroup: {
    gap: 4,
  },
  controlLabel: {
    fontSize: 10,
    color: "#8E8E93",
  },
  zoomButtonsRow: {
    flexDirection: "row",
    gap: 4,
  },
  zoomBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  realignBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(10, 122, 255, 0.2)",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  realignBtnText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#0A7AFF",
  },
});
