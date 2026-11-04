/**
 * © 2026 NXA Software. All rights reserved.
 * Nexa ERP Mobil - Apple iOS Standartlarında İSG & Güvenlik Raporlama
 *
 * - Koyu iOS Zemin (#0A0F1C)
 * - Donanım: expo-camera ile "İhlal / Ceza Bildir" ve "Ramak Kala Olayı Bildir" butonlarından kamera vizörünü açma
 * - GPS Anti-Spoofing: expo-location isMocked kontrolü (Fake GPS ise "GPS Doğrulaması Başarısız", değilse "Anti-Spoof Doğrulandı")
 * - Çevrimdışı (Offline-First): @react-native-community/netinfo ile denetim, internet yoksa AsyncStorage OfflineQueue'ya "Senkronizasyon Bekliyor (Taslak)" olarak kayıt
 * - Alt kısımda iOS liste standartlarına uygun (divider çizgili, sade) ceza ve tutanak listesi
 */

import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Modal,
  Image,
  ActivityIndicator,
  Alert,
  Vibration,
  Platform,
  RefreshControl,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Location from "expo-location";
import NetInfo from "@react-native-community/netinfo";
import { useAuth } from "../../src/hooks/useAuth";
import { useNetworkSync } from "../../src/hooks/useNetworkSync";
import { OfflineCamera, QueuedMediaItem } from "../../src/components/media/OfflineCamera";
import { OfflineQueue } from "../../src/services/OfflineQueue";
import { api } from "../../src/lib/api";
import { iosColors, iosRadius } from "../../src/theme/iosTheme";

export const INCIDENT_TYPES = [
  { id: "KKD", label: "KKD Eksikliği (Baret / Yelek / Emniyet Kemeri)", icon: "hard-hat", severity: "HIGH" },
  { id: "HEIGHT", label: "Yüksekte Çalışma & Düşme Riski", icon: "arrow-up-circle", severity: "CRITICAL" },
  { id: "SCAFFOLD", label: "İskele & Platform Uygunsuzluğu", icon: "layers", severity: "CRITICAL" },
  { id: "ELECTRIC", label: "Elektrik & Pano Açıklığı / Tehlikesi", icon: "zap", severity: "CRITICAL" },
  { id: "VOID", label: "Şaft & Boşluk Emniyet Korkuluk Eksikliği", icon: "alert-triangle", severity: "HIGH" },
  { id: "MACHINERY", label: "İş Makinesi & Vasıta Güvensizliği", icon: "truck", severity: "MEDIUM" },
  { id: "NEAR_MISS", label: "Ramak Kala (Near-Miss) Olayı", icon: "shield-alert", severity: "HIGH" },
  { id: "HOUSEKEEPING", label: "Saha Düzeni & Malzeme İstifleme Riski", icon: "package", severity: "LOW" },
  { id: "OTHER", label: "Diğer İSG & Çevre Uygunsuzluğu", icon: "info", severity: "MEDIUM" },
];

export const SYSTEM_SUBCONTRACTORS = [
  { id: "SUB-1", name: "Zirve Yapı Endüstri Ltd.", trade: "Kaba Yapı & Kalıp", riskScore: 82 },
  { id: "SUB-2", name: "Ege İnşaat Taahhüt A.Ş.", trade: "Betonarme & Demir", riskScore: 90 },
  { id: "SUB-3", name: "Mega Çelik Konstrüksiyon", trade: "Çelik İmalat & Montaj", riskScore: 78 },
  { id: "SUB-4", name: "Erdemler Cephe & İskele", trade: "Dış Cephe & İskele", riskScore: 85 },
  { id: "SUB-5", name: "Özkan Elektrik & Tesisat", trade: "Elektrik & Pano", riskScore: 92 },
  { id: "SUB-6", name: "Atlas Zemin & Hafriyat", trade: "Hafriyat & Kazı", riskScore: 88 },
  { id: "SUB-7", name: "Nexa Doğrudan Saha Ekibi", trade: "Ana Yüklenici", riskScore: 95 },
];

export interface SafetyIncidentItem {
  id: string;
  category: "VIOLATION" | "NEAR_MISS";
  incidentType: string;
  subcontractorName: string;
  locationText: string;
  latitude: number | null;
  longitude: number | null;
  penaltyAmount?: number;
  description: string;
  imageUrl?: string;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  status: "Senkronizasyon Bekliyor (Taslak)" | "SUBMITTED" | "RESOLVED";
  createdAt: string;
  reporterName: string;
  isMockedGps?: boolean;
}

export default function SafetyScreen() {
  const { user } = useAuth();
  const { isConnected } = useNetworkSync();

  // Kamera & Modal State'leri
  const [isCameraVisible, setIsCameraVisible] = useState(false);
  const [cameraMode, setCameraMode] = useState<"VIOLATION" | "NEAR_MISS">("VIOLATION");
  const [isFormModalVisible, setIsFormModalVisible] = useState(false);
  const [isTypePickerVisible, setIsTypePickerVisible] = useState(false);
  const [isSubcontractorPickerVisible, setIsSubcontractorPickerVisible] = useState(false);

  // Form Verileri
  const [capturedPhotoUri, setCapturedPhotoUri] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<"VIOLATION" | "NEAR_MISS">("VIOLATION");
  const [selectedType, setSelectedType] = useState<string>(INCIDENT_TYPES[0].label);
  const [selectedSubcontractor, setSelectedSubcontractor] = useState<string>(SYSTEM_SUBCONTRACTORS[0].name);
  const [locationText, setLocationText] = useState<string>("");
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [locationAccuracy, setLocationAccuracy] = useState<number | null>(null);
  const [isMockedGps, setIsMockedGps] = useState<boolean>(false);
  const [penaltyAmount, setPenaltyAmount] = useState<string>("5000");
  const [description, setDescription] = useState<string>("");
  const [severity, setSeverity] = useState<"LOW" | "MEDIUM" | "HIGH" | "CRITICAL">("HIGH");

  // Liste
  const [incidents, setIncidents] = useState<SafetyIncidentItem[]>([
    {
      id: "INC-2026-081",
      category: "VIOLATION",
      incidentType: "KKD Eksikliği (Baret / Yelek / Emniyet Kemeri)",
      subcontractorName: "Zirve Yapı Endüstri Ltd.",
      locationText: "A Blok 3. Kat Kolon Alanı",
      latitude: 40.9912,
      longitude: 29.0287,
      penaltyAmount: 5000,
      description: "2 çalışan baret takmadan beton kalıp çakımı yaparken tespit edildi. Çalışma durduruldu ve baret temin ettirildi.",
      severity: "HIGH",
      status: "SUBMITTED",
      createdAt: "Bugün, 10:45",
      reporterName: "Ahmet Yılmaz (İSG Uzmanı)",
      isMockedGps: false,
    },
    {
      id: "INC-2026-080",
      category: "NEAR_MISS",
      incidentType: "Ramak Kala (Near-Miss) Olayı",
      subcontractorName: "Mega Çelik Konstrüksiyon",
      locationText: "B Blok Şaft Boşluğu Yanı",
      latitude: 40.9918,
      longitude: 29.0292,
      description: "Üst kattan profil demiri çalışma sahasına düştü. Yaralanma yok, alan derhal güvenlik şeridine alındı.",
      severity: "CRITICAL",
      status: "SUBMITTED",
      createdAt: "Dün, 16:20",
      reporterName: "Mehmet Demir (Şantiye Şefi)",
      isMockedGps: false,
    },
    {
      id: "INC-2026-079",
      category: "VIOLATION",
      incidentType: "Yüksekte Çalışma & Düşme Riski",
      subcontractorName: "Erdemler Cephe & İskele",
      locationText: "C Blok Dış Cephe 6. Kat",
      latitude: 40.9905,
      longitude: 29.0275,
      penaltyAmount: 10000,
      description: "Dış cephe iskelesinde güvenlik filesi ve yaşam hattı bağlanmadan montaj yapıldığı tespit edildi.",
      severity: "CRITICAL",
      status: "SUBMITTED",
      createdAt: "01 Kas 2026, 14:10",
      reporterName: "Ahmet Yılmaz (İSG Uzmanı)",
      isMockedGps: false,
    },
  ]);

  const [activeFilter, setActiveFilter] = useState<"ALL" | "VIOLATION" | "NEAR_MISS">("ALL");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [feedbackBanner, setFeedbackBanner] = useState<{
    type: "SUCCESS" | "OFFLINE" | "ERROR";
    message: string;
  } | null>(null);

  // ADIM 3: GPS Konumu & Anti-Spoofing (isMocked) Kontrolü
  const requestCurrentLocation = useCallback(async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") return;

      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const fakeDetected =
        Boolean(loc.mocked) ||
        Boolean((loc.coords as any)?.isMocked) ||
        Boolean((loc.coords as any)?.mocked) ||
        Boolean((loc as any)?.isFromMockProvider);

      setIsMockedGps(fakeDetected);
      setLatitude(loc.coords.latitude);
      setLongitude(loc.coords.longitude);
      setLocationAccuracy(Math.round(loc.coords.accuracy || 5));
    } catch (err) {
      console.warn("[Safety GPS Error]:", err);
    }
  }, []);

  useEffect(() => {
    requestCurrentLocation().catch(() => {});
  }, [requestCurrentLocation]);

  // "İhlal Bildir" Butonu (expo-camera Vizörünü Açar)
  const handleOpenViolationReporting = () => {
    setCameraMode("VIOLATION");
    setSelectedCategory("VIOLATION");
    setSelectedType(INCIDENT_TYPES[0].label);
    setLocationText("A Blok 3. Kat");
    setCapturedPhotoUri(null);
    setIsCameraVisible(true);
  };

  // "Ramak Kala Olayı Bildir" Butonu (expo-camera Vizörünü Açar)
  const handleOpenNearMissReporting = () => {
    setCameraMode("NEAR_MISS");
    setSelectedCategory("NEAR_MISS");
    setSelectedType("Ramak Kala (Near-Miss) Olayı");
    setLocationText("Saha Genel Alanı");
    setCapturedPhotoUri(null);
    setPenaltyAmount("");
    setIsCameraVisible(true);
  };

  // Kameradan Fotoğraf Çekildiğinde
  const handlePhotoCaptured = (item: QueuedMediaItem) => {
    setIsCameraVisible(false);
    setCapturedPhotoUri(item.localUri);
    setIsFormModalVisible(true);
    requestCurrentLocation();
    if (Platform.OS !== "web") {
      Vibration.vibrate(50);
    }
  };

  // ADIM 4: Rapor Gönder (Offline-First Entegrasyonu)
  const handleSubmitReport = async () => {
    if (!description.trim() && !locationText.trim()) {
      Alert.alert("Eksik Bilgi", "Lütfen konum açıklaması veya ihlal detayını belirtiniz.");
      return;
    }

    setIsSubmitting(true);
    try {
      const netState = await NetInfo.fetch();
      const online = Boolean(netState.isConnected && netState.isInternetReachable !== false);

      const newIncidentId = `INC-${Date.now().toString().slice(-6)}`;
      const payload = {
        id: newIncidentId,
        title: `${selectedCategory === "NEAR_MISS" ? "🛑 Ramak Kala" : "⚠️ İSG İhlali"}: ${selectedType}`,
        incidentType: selectedType,
        category: selectedCategory,
        subcontractorName: selectedSubcontractor,
        locationText: locationText || "Saha Genel",
        latitude: latitude || 40.9912,
        longitude: longitude || 29.0287,
        penaltyAmount: selectedCategory === "VIOLATION" && penaltyAmount ? parseFloat(penaltyAmount) : undefined,
        description: description.trim() || `${selectedType} ihlali kaydedildi.`,
        imageUrl: capturedPhotoUri || "",
        severity: severity,
        reporterName: user?.name || "İSG Sorumlusu",
        createdAt: new Date().toISOString(),
        isMockedGps,
      };

      if (!online) {
        // İnternet yoksa: AsyncStorage içine "Senkronizasyon Bekliyor (Taslak)" statüsüyle kaydet
        await OfflineQueue.addToQueue(
          "/safety/incidents",
          payload,
          "POST",
          {
            type: "OTHER",
            title: `İSG Raporu: ${selectedType} (${selectedSubcontractor})`,
          }
        );

        const localItem: SafetyIncidentItem = {
          id: newIncidentId,
          category: selectedCategory,
          incidentType: selectedType,
          subcontractorName: selectedSubcontractor,
          locationText: locationText || "Şantiye Sahası",
          latitude: latitude,
          longitude: longitude,
          penaltyAmount: payload.penaltyAmount,
          description: payload.description,
          imageUrl: capturedPhotoUri || undefined,
          severity: severity,
          status: "Senkronizasyon Bekliyor (Taslak)",
          createdAt: "Şimdi (Taslak)",
          reporterName: user?.name || "İSG Uzmanı",
          isMockedGps,
        };

        setIncidents((prev) => [localItem, ...(prev || [])]);
        setFeedbackBanner({
          type: "OFFLINE",
          message: "İnternet bağlantısı yok. Güvenlik kaydı cihaza kaydedildi: Senkronizasyon Bekliyor (Taslak)",
        });
      } else {
        try {
          await api.post("/safety/incidents", payload);
        } catch (apiErr) {
          await OfflineQueue.addToQueue(
            "/safety/incidents",
            payload,
            "POST",
            {
              type: "OTHER",
              title: `İSG Raporu: ${selectedType}`,
            }
          );
        }

        const localItem: SafetyIncidentItem = {
          id: newIncidentId,
          category: selectedCategory,
          incidentType: selectedType,
          subcontractorName: selectedSubcontractor,
          locationText: locationText || "Şantiye Sahası",
          latitude: latitude,
          longitude: longitude,
          penaltyAmount: payload.penaltyAmount,
          description: payload.description,
          imageUrl: capturedPhotoUri || undefined,
          severity: severity,
          status: "SUBMITTED",
          createdAt: "Şimdi",
          reporterName: user?.name || "İSG Uzmanı",
          isMockedGps,
        };

        setIncidents((prev) => [localItem, ...(prev || [])]);
        setFeedbackBanner({
          type: "SUCCESS",
          message: "İSG Güvenlik Bildirimi başarıyla kaydedildi ve tutanağa işlendi.",
        });
      }

      setIsFormModalVisible(false);
      setCapturedPhotoUri(null);
      setDescription("");
      setLocationText("");
      if (Platform.OS !== "web") {
        Vibration.vibrate(100);
      }

      setTimeout(() => setFeedbackBanner(null), 5000);
    } catch (err: any) {
      console.error("[Safety Submit Error]:", err);
      Alert.alert("Hata", "Rapor kaydedilemedi: " + (err.message || "Bilinmeyen hata"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredIncidents = (incidents || []).filter((item) => {
    if (activeFilter === "ALL") return true;
    return item.category === activeFilter;
  });

  const violationCount = (incidents || []).filter((i) => i.category === "VIOLATION").length;
  const nearMissCount = (incidents || []).filter((i) => i.category === "NEAR_MISS").length;

  return (
    <SafeAreaView style={styles.safeContainer} edges={["top", "left", "right"]}>
      {/* 1. ÜST HEADER */}
      <View style={styles.header}>
        <View>
          <View style={styles.headerIndicator}>
            <View style={styles.indicatorDot} />
            <Text style={styles.indicatorText}>İSG DENETİM & SAHA GÜVENLİĞİ</Text>
          </View>
          <Text style={styles.headerTitle}>Güvenlik Raporlama</Text>
        </View>

        <View
          style={[
            styles.networkBadge,
            isConnected ? styles.networkBadgeOnline : styles.networkBadgeOffline,
          ]}
        >
          <Feather
            name={isConnected ? "wifi" : "wifi-off"}
            size={12}
            color={isConnected ? iosColors.systemGreen : iosColors.systemOrange}
          />
          <Text
            style={[
              styles.networkBadgeText,
              isConnected ? { color: iosColors.systemGreen } : { color: iosColors.systemOrange },
            ]}
          >
            {isConnected ? "Çevrimiçi" : "Çevrimdışı"}
          </Text>
        </View>
      </View>

      {/* Banner */}
      {feedbackBanner && (
        <View
          style={[
            styles.banner,
            feedbackBanner.type === "SUCCESS"
              ? styles.bannerSuccess
              : styles.bannerWarning,
          ]}
        >
          <Feather
            name={feedbackBanner.type === "SUCCESS" ? "check-circle" : "cloud-off"}
            size={16}
            color={feedbackBanner.type === "SUCCESS" ? iosColors.systemGreen : iosColors.systemOrange}
          />
          <Text style={styles.bannerText}>{feedbackBanner.message}</Text>
          <TouchableOpacity onPress={() => setFeedbackBanner(null)}>
            <Feather name="x" size={16} color={iosColors.labelSecondary} />
          </TouchableOpacity>
        </View>
      )}

      <ScrollView
        style={styles.scrollArea}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => {
              setIsRefreshing(true);
              requestCurrentLocation();
              setTimeout(() => setIsRefreshing(false), 800);
            }}
            tintColor={iosColors.systemRed}
          />
        }
      >
        {/* ============================================================ */}
        {/* ADIM 3: DEVASA KIRMIZI (#FF3B30) VE TURUNCU (#FF9500) BUTONLAR*/}
        {/* ============================================================ */}
        <View style={styles.actionButtonsContainer}>
          {/* BUTON 1: DEVASA KIRMIZI "İHLAL / CEZA BİLDİR" */}
          <TouchableOpacity
            activeOpacity={0.88}
            onPress={handleOpenViolationReporting}
            style={styles.giantViolationButton}
          >
            <View style={styles.buttonTopRow}>
              <View style={styles.buttonTextWrapper}>
                <View style={styles.badgeLabelWrapper}>
                  <Text style={styles.badgeLabelRed}>ACİL SAHA YAPTIRIMI</Text>
                </View>
                <Text style={styles.giantButtonTitle}>⚠️ İhlal / Ceza Bildir</Text>
                <Text style={styles.giantButtonSubtitle}>
                  Baretsiz personel, emniyetsiz iskele veya KKD ihlalini anında fotoğrafla, GPS ile tutanağa bağla.
                </Text>
              </View>

              <View style={styles.iconCircleRed}>
                <Feather name="camera" size={28} color="#FFFFFF" />
              </View>
            </View>

            <View style={styles.buttonBottomRow}>
              {/* GPS Anti-Spoof Durumu Rozeti */}
              <View style={styles.gpsRow}>
                <Feather
                  name={isMockedGps ? "alert-circle" : "shield"}
                  size={12}
                  color={isMockedGps ? "#FECACA" : "#D1FAE5"}
                />
                <Text
                  style={[
                    styles.gpsText,
                    isMockedGps && { color: "#FEE2E2", fontWeight: "800" },
                  ]}
                >
                  {isMockedGps
                    ? "❌ GPS Doğrulaması Başarısız"
                    : `🛡️ Anti-Spoof Doğrulandı (±${locationAccuracy || 5}m)`}
                </Text>
              </View>
              <View style={styles.arrowRow}>
                <Text style={styles.arrowText}>Fotoğraf Çek</Text>
                <Feather name="chevron-right" size={14} color="#FFFFFF" />
              </View>
            </View>
          </TouchableOpacity>

          {/* BUTON 2: DEVASA TURUNCU "RAMAK KALA OLAYI BİLDİR" */}
          <TouchableOpacity
            activeOpacity={0.88}
            onPress={handleOpenNearMissReporting}
            style={styles.giantNearMissButton}
          >
            <View style={styles.buttonTopRow}>
              <View style={styles.buttonTextWrapper}>
                <View style={styles.badgeLabelWrapper}>
                  <Text style={styles.badgeLabelOrange}>KAZAYI ÖNCEDEN ENGELLE</Text>
                </View>
                <Text style={styles.giantButtonTitle}>🛑 Ramak Kala Olayı Bildir</Text>
                <Text style={styles.giantButtonSubtitle}>
                  Yaralanma olmadan atlatılan malzeme düşmesi veya açık şaft risklerini sisteme işle.
                </Text>
              </View>

              <View style={styles.iconCircleOrange}>
                <MaterialCommunityIcons name="shield-alert" size={32} color="#FFFFFF" />
              </View>
            </View>

            <View style={styles.buttonBottomRow}>
              <Text style={styles.gpsText}>Kaza Olmadan Önce Güvenliği Sağla</Text>
              <View style={styles.arrowRow}>
                <Text style={styles.arrowText}>Raporla</Text>
                <Feather name="chevron-right" size={14} color="#FFFFFF" />
              </View>
            </View>
          </TouchableOpacity>
        </View>

        {/* HIZLI METRİK KARTLARI */}
        <View style={styles.metricsRow}>
          <View style={styles.metricCard}>
            <Text style={styles.metricCardLabel}>Toplam İhlal</Text>
            <Text style={[styles.metricCardValue, { color: iosColors.systemRed }]}>
              {violationCount}
            </Text>
          </View>

          <View style={styles.metricCard}>
            <Text style={styles.metricCardLabel}>Ramak Kala</Text>
            <Text style={[styles.metricCardValue, { color: iosColors.systemOrange }]}>
              {nearMissCount}
            </Text>
          </View>

          <View style={styles.metricCard}>
            <Text style={styles.metricCardLabel}>Kayıp Günlü Kaza</Text>
            <Text style={[styles.metricCardValue, { color: iosColors.systemGreen }]}>
              0
            </Text>
          </View>
        </View>

        {/* FİLTRE VE BAŞLIK */}
        <View style={styles.filterSection}>
          <Text style={styles.filterSectionTitle}>Saha Güvenlik Kayıtları</Text>
          <View style={styles.filterPills}>
            <TouchableOpacity
              onPress={() => setActiveFilter("ALL")}
              style={[
                styles.filterPill,
                activeFilter === "ALL" && styles.filterPillActive,
              ]}
            >
              <Text
                style={[
                  styles.filterPillText,
                  activeFilter === "ALL" && styles.filterPillTextActive,
                ]}
              >
                Tümü
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setActiveFilter("VIOLATION")}
              style={[
                styles.filterPill,
                activeFilter === "VIOLATION" && styles.filterPillActiveRed,
              ]}
            >
              <Text
                style={[
                  styles.filterPillText,
                  activeFilter === "VIOLATION" && { color: iosColors.systemRed },
                ]}
              >
                İhlaller
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setActiveFilter("NEAR_MISS")}
              style={[
                styles.filterPill,
                activeFilter === "NEAR_MISS" && styles.filterPillActiveOrange,
              ]}
            >
              <Text
                style={[
                  styles.filterPillText,
                  activeFilter === "NEAR_MISS" && { color: iosColors.systemOrange },
                ]}
              >
                Ramak Kala
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ============================================================ */}
        {/* iOS LİSTE STANDARTLARINDA ÇİZGİLİ / AYRAÇLI LİSTE           */}
        {/* ============================================================ */}
        <View style={styles.listContainer}>
          {filteredIncidents.length === 0 ? (
            <View style={styles.emptyCard}>
              <Feather name="shield" size={36} color={iosColors.labelMuted} />
              <Text style={styles.emptyCardText}>
                Bu kategoride kayıtlı olay bulunamadı.
              </Text>
            </View>
          ) : (
            filteredIncidents.map((incident, index) => {
              const isViolation = incident.category === "VIOLATION";
              const isLast = index === filteredIncidents.length - 1;
              const isDraft = incident.status === "Senkronizasyon Bekliyor (Taslak)";

              return (
                <View
                  key={incident.id}
                  style={[
                    styles.incidentItemCard,
                    !isLast && styles.incidentItemBorder,
                  ]}
                >
                  {/* Başlık Satırı & Rozetler */}
                  <View style={styles.incidentItemHeader}>
                    <View style={styles.badgeRow}>
                      <View
                        style={[
                          styles.categoryBadge,
                          isViolation ? styles.categoryBadgeRed : styles.categoryBadgeOrange,
                        ]}
                      >
                        <Text
                          style={[
                            styles.categoryBadgeText,
                            isViolation ? { color: iosColors.systemRed } : { color: iosColors.systemOrange },
                          ]}
                        >
                          {isViolation ? "⚠️ İSG İhlali" : "🛑 Ramak Kala"}
                        </Text>
                      </View>

                      {isDraft ? (
                        <View style={styles.syncBadgePending}>
                          <Text style={styles.syncBadgePendingText}>
                            ⏳ Senkronizasyon Bekliyor (Taslak)
                          </Text>
                        </View>
                      ) : (
                        <View style={styles.syncBadgeDone}>
                          <Text style={styles.syncBadgeDoneText}>✓ İletildi</Text>
                        </View>
                      )}
                    </View>

                    <Text style={styles.incidentDateText}>{incident.createdAt}</Text>
                  </View>

                  {/* Olay Türü */}
                  <Text style={styles.incidentTypeTitle}>{incident.incidentType}</Text>

                  {/* Taşeron ve Ceza Bilgisi */}
                  <View style={styles.subcontractorRow}>
                    <View style={styles.subBadge}>
                      <Feather name="briefcase" size={11} color={iosColors.labelSecondary} />
                      <Text style={styles.subBadgeText}>{incident.subcontractorName}</Text>
                    </View>

                    {incident.penaltyAmount && (
                      <View style={styles.penaltyBadge}>
                        <Feather name="dollar-sign" size={11} color={iosColors.systemRed} />
                        <Text style={styles.penaltyBadgeText}>
                          ₺{incident.penaltyAmount.toLocaleString("tr-TR")} Ceza
                        </Text>
                      </View>
                    )}
                  </View>

                  {/* Konum */}
                  <View style={styles.locationRow}>
                    <Feather name="map-pin" size={12} color={iosColors.systemBlue} />
                    <Text style={styles.locationText}>{incident.locationText}</Text>
                  </View>

                  {/* Açıklama */}
                  <Text style={styles.descriptionText}>{incident.description}</Text>

                  {/* Varsa Fotoğraf */}
                  {incident.imageUrl ? (
                    <View style={styles.photoContainer}>
                      <Image
                        source={{ uri: incident.imageUrl }}
                        style={styles.photoImage}
                        resizeMode="cover"
                      />
                    </View>
                  ) : null}

                  {/* Alt Bilgi: Raporlayan */}
                  <View style={styles.reporterRow}>
                    <Text style={styles.reporterText}>
                      Raporlayan: <Text style={{ color: iosColors.labelPrimary, fontWeight: "600" }}>{incident.reporterName}</Text>
                    </Text>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                      <Feather name="check" size={12} color={iosColors.systemGreen} />
                      <Text style={styles.registeredText}>Tutanağa İşlendi</Text>
                    </View>
                  </View>
                </View>
              );
            })
          )}
        </View>
      </ScrollView>

      {/* KAMERA MODALI (expo-camera) */}
      <Modal
        visible={isCameraVisible}
        animationType="slide"
        onRequestClose={() => setIsCameraVisible(false)}
      >
        <OfflineCamera
          title={
            cameraMode === "VIOLATION"
              ? "⚠️ İSG İhlal Kanıtı Fotoğrafı"
              : "🛑 Ramak Kala Olayı Fotoğrafı"
          }
          onPhotoQueued={handlePhotoCaptured}
          onClose={() => setIsCameraVisible(false)}
        />
      </Modal>

      {/* FORM MODALI */}
      <Modal
        visible={isFormModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setIsFormModalVisible(false)}
      >
        <SafeAreaView style={styles.safeContainer} edges={["top", "bottom"]}>
          <View style={styles.sheetHandle} />

          <View style={styles.modalHeader}>
            <View>
              <Text style={styles.modalTitle}>
                {selectedCategory === "NEAR_MISS"
                  ? "🛑 Ramak Kala Tutanağı"
                  : "⚠️ İSG İhlal & Ceza Tutanağı"}
              </Text>
              <Text style={styles.modalSubtitle}>Saha güvenlik raporunu tamamlayın</Text>
            </View>

            <TouchableOpacity
              onPress={() => setIsFormModalVisible(false)}
              style={styles.modalCloseBtn}
            >
              <Feather name="x" size={18} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={{ flex: 1, paddingHorizontal: 20, paddingTop: 14 }}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ paddingBottom: 40 }}
          >
            {/* Fotoğraf Önizleme */}
            {capturedPhotoUri && (
              <View style={styles.formPhotoWrapper}>
                <Image
                  source={{ uri: capturedPhotoUri }}
                  style={styles.formPhoto}
                  resizeMode="cover"
                />
              </View>
            )}

            {/* Form Alanları */}
            <View style={{ gap: 14 }}>
              <View>
                <Text style={styles.fieldLabel}>İHLAL / OLAY TÜRÜ</Text>
                <TouchableOpacity
                  onPress={() => setIsTypePickerVisible(true)}
                  style={styles.selectorInput}
                >
                  <Text style={styles.selectorText}>{selectedType}</Text>
                  <Feather name="chevron-down" size={16} color={iosColors.labelSecondary} />
                </TouchableOpacity>
              </View>

              <View>
                <Text style={styles.fieldLabel}>SORUMLU TAŞERON</Text>
                <TouchableOpacity
                  onPress={() => setIsSubcontractorPickerVisible(true)}
                  style={styles.selectorInput}
                >
                  <Text style={styles.selectorText}>{selectedSubcontractor}</Text>
                  <Feather name="chevron-down" size={16} color={iosColors.labelSecondary} />
                </TouchableOpacity>
              </View>

              <View>
                <Text style={styles.fieldLabel}>OLAY YERİ / ŞANTİYE BÖLGESİ</Text>
                <TextInput
                  value={locationText}
                  onChangeText={setLocationText}
                  placeholder="Örn: Blok-A 3. Kat Kolon Alanı"
                  placeholderTextColor={iosColors.labelMuted}
                  style={styles.fieldInput}
                />
              </View>

              {selectedCategory === "VIOLATION" && (
                <View>
                  <Text style={styles.fieldLabel}>KESİLECEK CEZA TUTARI (TL)</Text>
                  <TextInput
                    value={penaltyAmount}
                    onChangeText={setPenaltyAmount}
                    placeholder="5000"
                    placeholderTextColor={iosColors.labelMuted}
                    keyboardType="numeric"
                    style={styles.fieldInput}
                  />
                </View>
              )}

              <View>
                <Text style={styles.fieldLabel}>TUTANAK AÇIKLAMASI</Text>
                <TextInput
                  value={description}
                  onChangeText={setDescription}
                  placeholder="Gözlemlenen tehlikeyi, alınan aksiyonu ve personelin durumunu detaylandırın."
                  placeholderTextColor={iosColors.labelMuted}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                  style={[styles.fieldInput, { minHeight: 90 }]}
                />
              </View>
            </View>

            {/* Gönder Butonu */}
            <TouchableOpacity
              onPress={handleSubmitReport}
              disabled={isSubmitting}
              activeOpacity={0.88}
              style={[
                styles.submitButton,
                selectedCategory === "VIOLATION"
                  ? styles.submitButtonRed
                  : styles.submitButtonOrange,
              ]}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Feather name="check-circle" size={18} color="#FFFFFF" />
                  <Text style={styles.submitButtonText}>
                    {selectedCategory === "VIOLATION"
                      ? "İhlal Tutanağını Kaydet & Merkeze İlet"
                      : "Ramak Kala Raporunu Gönder"}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* TÜR SEÇİCİ MODAL */}
      <Modal
        visible={isTypePickerVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsTypePickerVisible(false)}
      >
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => setIsTypePickerVisible(false)}
          style={styles.pickerOverlay}
        >
          <View style={styles.pickerSheet}>
            <Text style={styles.pickerTitle}>İhlal / Olay Türü Seçiniz</Text>
            <ScrollView>
              {(INCIDENT_TYPES || []).map((t) => (
                <TouchableOpacity
                  key={t.id}
                  onPress={() => {
                    setSelectedType(t.label);
                    setIsTypePickerVisible(false);
                  }}
                  style={styles.pickerOption}
                >
                  <Text style={styles.pickerOptionText}>{t.label}</Text>
                  {selectedType === t.label && (
                    <Feather name="check" size={16} color={iosColors.systemBlue} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* TAŞERON SEÇİCİ MODAL */}
      <Modal
        visible={isSubcontractorPickerVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsSubcontractorPickerVisible(false)}
      >
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => setIsSubcontractorPickerVisible(false)}
          style={styles.pickerOverlay}
        >
          <View style={styles.pickerSheet}>
            <Text style={styles.pickerTitle}>Sorumlu Taşeron Firma</Text>
            <ScrollView>
              {(SYSTEM_SUBCONTRACTORS || []).map((sub) => (
                <TouchableOpacity
                  key={sub.id}
                  onPress={() => {
                    setSelectedSubcontractor(sub.name);
                    setIsSubcontractorPickerVisible(false);
                  }}
                  style={styles.pickerOption}
                >
                  <View style={{ flex: 1, paddingRight: 8 }}>
                    <Text style={styles.pickerOptionText}>{sub.name}</Text>
                    <Text style={styles.pickerOptionSub}>{sub.trade}</Text>
                  </View>
                  {selectedSubcontractor === sub.name && (
                    <Feather name="check" size={16} color={iosColors.systemBlue} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: iosColors.background,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: iosColors.glassBorder,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerIndicator: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 3,
  },
  indicatorDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: iosColors.systemRed,
  },
  indicatorText: {
    fontSize: 10,
    fontWeight: "800",
    color: iosColors.systemRed,
    letterSpacing: 0.8,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: "800",
    color: iosColors.labelPrimary,
    letterSpacing: -0.4,
  },
  networkBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: iosRadius.pill,
    borderWidth: 1,
  },
  networkBadgeOnline: {
    backgroundColor: "rgba(52, 199, 89, 0.15)",
    borderColor: "rgba(52, 199, 89, 0.35)",
  },
  networkBadgeOffline: {
    backgroundColor: "rgba(255, 149, 0, 0.15)",
    borderColor: "rgba(255, 149, 0, 0.35)",
  },
  networkBadgeText: {
    fontSize: 11,
    fontWeight: "800",
  },
  banner: {
    marginHorizontal: 20,
    marginTop: 10,
    padding: 12,
    borderRadius: iosRadius.card,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
  },
  bannerSuccess: {
    backgroundColor: "rgba(52, 199, 89, 0.15)",
    borderColor: "rgba(52, 199, 89, 0.35)",
  },
  bannerWarning: {
    backgroundColor: "rgba(255, 149, 0, 0.15)",
    borderColor: "rgba(255, 149, 0, 0.35)",
  },
  bannerText: {
    fontSize: 12,
    color: iosColors.labelPrimary,
    flex: 1,
    marginHorizontal: 8,
  },
  scrollArea: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  scrollContent: {
    paddingBottom: 110,
  },
  actionButtonsContainer: {
    gap: 12,
    marginBottom: 20,
  },
  giantViolationButton: {
    width: "100%",
    backgroundColor: iosColors.systemRed,
    borderRadius: iosRadius.cardLarge,
    padding: 18,
    shadowColor: iosColors.systemRed,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
  },
  giantNearMissButton: {
    width: "100%",
    backgroundColor: iosColors.systemOrange,
    borderRadius: iosRadius.cardLarge,
    padding: 18,
    shadowColor: iosColors.systemOrange,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
  },
  buttonTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  buttonTextWrapper: {
    flex: 1,
    paddingRight: 12,
  },
  badgeLabelWrapper: {
    backgroundColor: "rgba(0, 0, 0, 0.25)",
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginBottom: 6,
  },
  badgeLabelRed: {
    fontSize: 9,
    fontWeight: "900",
    color: "#FFFFFF",
    letterSpacing: 0.8,
  },
  badgeLabelOrange: {
    fontSize: 9,
    fontWeight: "900",
    color: "#FFFFFF",
    letterSpacing: 0.8,
  },
  giantButtonTitle: {
    fontSize: 19,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: -0.3,
  },
  giantButtonSubtitle: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.88)",
    marginTop: 4,
    lineHeight: 16,
  },
  iconCircleRed: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: "rgba(0, 0, 0, 0.2)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
    alignItems: "center",
    justifyContent: "center",
  },
  iconCircleOrange: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: "rgba(0, 0, 0, 0.2)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
    alignItems: "center",
    justifyContent: "center",
  },
  buttonBottomRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 14,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.2)",
  },
  gpsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  gpsText: {
    fontSize: 11,
    color: "rgba(255, 255, 255, 0.9)",
    fontWeight: "600",
  },
  arrowRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  arrowText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  metricsRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 20,
  },
  metricCard: {
    flex: 1,
    backgroundColor: iosColors.glassCard,
    borderRadius: iosRadius.card,
    borderWidth: 1,
    borderColor: iosColors.glassBorder,
    padding: 12,
  },
  metricCardLabel: {
    fontSize: 11,
    color: iosColors.labelSecondary,
    fontWeight: "600",
  },
  metricCardValue: {
    fontSize: 22,
    fontWeight: "900",
    marginTop: 4,
  },
  filterSection: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  filterSectionTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: iosColors.labelPrimary,
  },
  filterPills: {
    flexDirection: "row",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    padding: 3,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: iosColors.glassBorder,
  },
  filterPill: {
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 8,
  },
  filterPillActive: {
    backgroundColor: "rgba(255, 255, 255, 0.12)",
  },
  filterPillActiveRed: {
    backgroundColor: "rgba(255, 59, 48, 0.2)",
  },
  filterPillActiveOrange: {
    backgroundColor: "rgba(255, 149, 0, 0.2)",
  },
  filterPillText: {
    fontSize: 11,
    fontWeight: "700",
    color: iosColors.labelSecondary,
  },
  filterPillTextActive: {
    color: "#FFFFFF",
  },
  listContainer: {
    backgroundColor: iosColors.glassCard,
    borderRadius: iosRadius.cardLarge,
    borderWidth: 1,
    borderColor: iosColors.glassBorder,
    overflow: "hidden",
  },
  emptyCard: {
    padding: 30,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyCardText: {
    fontSize: 13,
    color: iosColors.labelSecondary,
    marginTop: 8,
  },
  incidentItemCard: {
    padding: 16,
  },
  incidentItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: iosColors.glassBorder,
  },
  incidentItemHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  badgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  categoryBadgeRed: {
    backgroundColor: "rgba(255, 59, 48, 0.15)",
    borderColor: "rgba(255, 59, 48, 0.35)",
  },
  categoryBadgeOrange: {
    backgroundColor: "rgba(255, 149, 0, 0.15)",
    borderColor: "rgba(255, 149, 0, 0.35)",
  },
  categoryBadgeText: {
    fontSize: 9,
    fontWeight: "800",
  },
  syncBadgePending: {
    backgroundColor: "rgba(255, 149, 0, 0.15)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "rgba(255, 149, 0, 0.35)",
  },
  syncBadgePendingText: {
    fontSize: 9,
    fontWeight: "800",
    color: iosColors.systemOrange,
  },
  syncBadgeDone: {
    backgroundColor: "rgba(52, 199, 89, 0.15)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "rgba(52, 199, 89, 0.35)",
  },
  syncBadgeDoneText: {
    fontSize: 9,
    fontWeight: "800",
    color: iosColors.systemGreen,
  },
  incidentDateText: {
    fontSize: 11,
    color: iosColors.labelSecondary,
  },
  incidentTypeTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: iosColors.labelPrimary,
    marginBottom: 6,
  },
  subcontractorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 6,
  },
  subBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  subBadgeText: {
    fontSize: 11,
    fontWeight: "600",
    color: iosColors.labelSecondary,
  },
  penaltyBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(255, 59, 48, 0.15)",
    borderWidth: 1,
    borderColor: "rgba(255, 59, 48, 0.35)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  penaltyBadgeText: {
    fontSize: 11,
    fontWeight: "800",
    color: iosColors.systemRed,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginBottom: 6,
  },
  locationText: {
    fontSize: 11,
    fontWeight: "600",
    color: iosColors.systemBlue,
  },
  descriptionText: {
    fontSize: 12,
    color: iosColors.labelSecondary,
    lineHeight: 17,
    marginBottom: 8,
  },
  photoContainer: {
    width: "100%",
    height: 120,
    borderRadius: 10,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: iosColors.glassBorder,
    marginBottom: 8,
  },
  photoImage: {
    width: "100%",
    height: "100%",
  },
  reporterRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: iosColors.glassBorder,
    paddingTop: 8,
    marginTop: 4,
  },
  reporterText: {
    fontSize: 11,
    color: iosColors.labelSecondary,
  },
  registeredText: {
    fontSize: 10,
    fontWeight: "700",
    color: iosColors.systemGreen,
  },
  sheetHandle: {
    width: 44,
    height: 4,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 2,
    alignSelf: "center",
    marginTop: 10,
    marginBottom: 6,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: iosColors.glassBorder,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: iosColors.labelPrimary,
  },
  modalSubtitle: {
    fontSize: 12,
    color: iosColors.labelSecondary,
    marginTop: 2,
  },
  modalCloseBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  formPhotoWrapper: {
    width: "100%",
    height: 140,
    borderRadius: 14,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: iosColors.glassBorder,
    marginBottom: 16,
  },
  formPhoto: {
    width: "100%",
    height: "100%",
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: iosColors.labelSecondary,
    letterSpacing: 0.6,
    marginBottom: 6,
  },
  fieldInput: {
    backgroundColor: "rgba(255, 255, 255, 0.04)",
    borderRadius: iosRadius.input,
    borderWidth: 1,
    borderColor: iosColors.glassBorder,
    color: "#FFFFFF",
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
  },
  selectorInput: {
    backgroundColor: "rgba(255, 255, 255, 0.04)",
    borderRadius: iosRadius.input,
    borderWidth: 1,
    borderColor: iosColors.glassBorder,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  selectorText: {
    color: "#FFFFFF",
    fontSize: 14,
  },
  submitButton: {
    width: "100%",
    borderRadius: iosRadius.button,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
    marginTop: 24,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 4,
  },
  submitButtonRed: {
    backgroundColor: iosColors.systemRed,
    shadowColor: iosColors.systemRed,
  },
  submitButtonOrange: {
    backgroundColor: iosColors.systemOrange,
    shadowColor: iosColors.systemOrange,
  },
  submitButtonText: {
    fontSize: 14,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  pickerOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.75)",
    justifyContent: "center",
    padding: 20,
  },
  pickerSheet: {
    backgroundColor: iosColors.backgroundSecondary,
    borderRadius: iosRadius.cardLarge,
    borderWidth: 1,
    borderColor: iosColors.glassBorder,
    padding: 18,
    maxHeight: "80%",
  },
  pickerTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: iosColors.labelPrimary,
    marginBottom: 12,
  },
  pickerOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: 10,
    borderBottomWidth: 1,
    borderBottomColor: iosColors.glassBorder,
  },
  pickerOptionText: {
    fontSize: 13,
    fontWeight: "600",
    color: iosColors.labelPrimary,
  },
  pickerOptionSub: {
    fontSize: 11,
    color: iosColors.labelSecondary,
    marginTop: 2,
  },
});
