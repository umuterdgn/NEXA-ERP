/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Nexa ERP - Mobil İSG İhlal & Ramak Kala Raporlama Modülü
 *
 * Sahada görülen güvenlik ihlallerini anında fotoğraflayıp, GPS konumu ve
 * sorumlu taşeron bilgisiyle merkeze raporlayan native İSG bileşeni.
 * Çevrimdışı (offline) ortamlarda OfflineQueue üzerinden otomatik kuyruklar.
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
import * as Network from "expo-network";
import { useAuth } from "../../src/hooks/useAuth";
import { useNetworkSync } from "../../src/hooks/useNetworkSync";
import { OfflineCamera, QueuedMediaItem } from "../../src/components/media/OfflineCamera";
import { OfflineQueue } from "../../src/services/OfflineQueue";
import { api } from "../../src/lib/api";

// İSG İhlal Kategorileri & Türleri
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

// Sistem Taşeronları
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
  status: "PENDING_SYNC" | "SUBMITTED" | "RESOLVED";
  createdAt: string;
  reporterName: string;
}

export default function SafetyScreen() {
  const { user, role } = useAuth();
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
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [penaltyAmount, setPenaltyAmount] = useState<string>("5000");
  const [description, setDescription] = useState<string>("");
  const [severity, setSeverity] = useState<"LOW" | "MEDIUM" | "HIGH" | "CRITICAL">("HIGH");

  // Liste & Yükleme
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
    },
    {
      id: "INC-2026-080",
      category: "NEAR_MISS",
      incidentType: "Ramak Kala (Near-Miss) Olayı",
      subcontractorName: "Mega Çelik Konstrüksiyon",
      locationText: "B Blok Şaft Boşluğu Yanı",
      latitude: 40.9918,
      longitude: 29.0292,
      description: "Üst kattan gevşek bırakılan profil demiri 1 metre yakınına düştü. Yaralanma yok, alan güvenlik şeridine alındı.",
      severity: "CRITICAL",
      status: "SUBMITTED",
      createdAt: "Dün, 16:20",
      reporterName: "Mehmet Demir (Şantiye Şefi)",
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
      description: "Dış cephe iskelesinde güvenlik filesi ve yaşam hattı bağlanmadan montaj yapıldığı saptandı.",
      severity: "CRITICAL",
      status: "SUBMITTED",
      createdAt: "01 Kas 2026, 14:10",
      reporterName: "Ahmet Yılmaz (İSG Uzmanı)",
    },
  ]);

  const [activeFilter, setActiveFilter] = useState<"ALL" | "VIOLATION" | "NEAR_MISS">("ALL");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [feedbackBanner, setFeedbackBanner] = useState<{
    type: "SUCCESS" | "OFFLINE" | "ERROR";
    message: string;
  } | null>(null);

  // Sayfa açıldığında GPS konumunu al
  const requestCurrentLocation = useCallback(async () => {
    try {
      setIsLocating(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setIsLocating(false);
        return;
      }
      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      setLatitude(loc.coords.latitude);
      setLongitude(loc.coords.longitude);
      setLocationAccuracy(Math.round(loc.coords.accuracy || 5));
    } catch (err) {
      console.warn("[Safety GPS] Konum alınamadı:", err);
    } finally {
      setIsLocating(false);
    }
  }, []);

  useEffect(() => {
    requestCurrentLocation();
  }, [requestCurrentLocation]);

  // ADIM 2: "İhlal Bildir" butonuna basıldığında
  const handleOpenViolationReporting = () => {
    setCameraMode("VIOLATION");
    setSelectedCategory("VIOLATION");
    setSelectedType(INCIDENT_TYPES[0].label);
    setLocationText("A Blok 3. Kat");
    setCapturedPhotoUri(null);
    setIsCameraVisible(true);
  };

  // "Ramak Kala Olayı Bildir" butonuna basıldığında
  const handleOpenNearMissReporting = () => {
    setCameraMode("NEAR_MISS");
    setSelectedCategory("NEAR_MISS");
    setSelectedType("Ramak Kala (Near-Miss) Olayı");
    setLocationText("Saha Genel Alanı");
    setCapturedPhotoUri(null);
    setPenaltyAmount("");
    setIsCameraVisible(true);
  };

  // Kameradan fotoğraf çekildiğinde çalışan callback
  const handlePhotoCaptured = (item: QueuedMediaItem) => {
    setIsCameraVisible(false);
    setCapturedPhotoUri(item.localUri);
    // Fotoğraf çekildikten hemen sonra Bottom Sheet kayıt formunu aç
    setIsFormModalVisible(true);
    requestCurrentLocation();
    Vibration.vibrate(50);
  };

  // Formu direkt açmak (fotoğrafsız veya sonradan eklemeli)
  const handleOpenFormDirectly = (cat: "VIOLATION" | "NEAR_MISS") => {
    setSelectedCategory(cat);
    if (cat === "NEAR_MISS") {
      setSelectedType("Ramak Kala (Near-Miss) Olayı");
      setPenaltyAmount("");
    } else {
      setSelectedType(INCIDENT_TYPES[0].label);
      setPenaltyAmount("5000");
    }
    requestCurrentLocation();
    setIsFormModalVisible(true);
  };

  // ADIM 3: Çevrimdışı (Offline) Destek ve Gönderim
  const handleSubmitReport = async () => {
    if (!description.trim() && !locationText.trim()) {
      Alert.alert("Eksik Bilgi", "Lütfen konum açıklaması veya ihlal detayını belirtiniz.");
      return;
    }

    setIsSubmitting(true);
    try {
      const netState = await Network.getNetworkStateAsync();
      const online = netState.isConnected && netState.isInternetReachable !== false;

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
      };

      if (!online) {
        // Çevrimdışı: OfflineQueue servisine gönder
        await OfflineQueue.addToQueue(
          "/safety/incidents",
          payload,
          "POST",
          {
            type: "OTHER",
            title: `İSG Raporu: ${selectedType} (${selectedSubcontractor})`,
          }
        );

        // UI'ya hemen çevrimdışı bekleyen durum olarak ekle
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
          status: "PENDING_SYNC",
          createdAt: "Şimdi (Kuyrukta)",
          reporterName: user?.name || "İSG Uzmanı",
        };

        setIncidents([localItem, ...incidents]);
        setFeedbackBanner({
          type: "OFFLINE",
          message:
            "İnternet bağlantısı yok. Güvenlik kaydı cihaz hafızasına kaydedildi, bağlantı sağlandığında otomatik merkeze iletilecektir.",
        });
      } else {
        // Çevrimiçi: Backend API'ye gönder
        try {
          await api.post("/safety/incidents", payload);
        } catch (apiErr) {
          // Sunucu hatasında da güvenle OfflineQueue'ya aktar
          console.warn("[Safety] Sunucuya ulaşılamadı, kuyruğa alınıyor:", apiErr);
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
        };

        setIncidents([localItem, ...incidents]);
        setFeedbackBanner({
          type: "SUCCESS",
          message: "İSG Güvenlik Bildirimi başarıyla merkeze iletildi ve şantiye tutanağına işlendi.",
        });
      }

      // Formu sıfırla ve kapat
      setIsFormModalVisible(false);
      setCapturedPhotoUri(null);
      setDescription("");
      setLocationText("");
      Vibration.vibrate(100);

      // Banner'ı 6 saniye sonra kapat
      setTimeout(() => {
        setFeedbackBanner(null);
      }, 6000);
    } catch (err: any) {
      console.error("[Safety Submit Error]:", err);
      Alert.alert("Hata", "Rapor kaydedilemedi: " + (err.message || "Bilinmeyen hata"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredIncidents = incidents.filter((item) => {
    if (activeFilter === "ALL") return true;
    return item.category === activeFilter;
  });

  const violationCount = incidents.filter((i) => i.category === "VIOLATION").length;
  const nearMissCount = incidents.filter((i) => i.category === "NEAR_MISS").length;
  const pendingSyncCount = incidents.filter((i) => i.status === "PENDING_SYNC").length;

  return (
    <SafeAreaView className="flex-1 bg-gray-950">
      {/* 1. ÜST HEADER */}
      <View className="px-5 pt-3 pb-4 border-b border-gray-900 bg-gray-900/40">
        <View className="flex-row items-center justify-between">
          <View>
            <View className="flex-row items-center space-x-2">
              <View className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
              <Text className="text-xs uppercase tracking-wider font-bold text-red-400">
                İSG Denetim & Saha Güvenliği
              </Text>
            </View>
            <Text className="text-2xl font-black text-white mt-0.5 tracking-tight">
              Güvenlik Raporlama
            </Text>
          </View>

          {/* Ağ & Kuyruk Durumu Rozeti */}
          <View className="items-end">
            <View
              className={`flex-row items-center px-2.5 py-1 rounded-full ${
                isConnected ? "bg-emerald-500/20 border border-emerald-500/40" : "bg-amber-500/20 border border-amber-500/40"
              }`}
            >
              <Feather
                name={isConnected ? "wifi" : "wifi-off"}
                size={12}
                color={isConnected ? "#10B981" : "#F59E0B"}
              />
              <Text
                className={`text-[11px] font-bold ml-1.5 ${
                  isConnected ? "text-emerald-400" : "text-amber-400"
                }`}
              >
                {isConnected ? "Çevrimiçi" : "Çevrimdışı"}
              </Text>
            </View>
            {pendingSyncCount > 0 && (
              <Text className="text-[10px] text-amber-400 font-semibold mt-1">
                ⏳ {pendingSyncCount} kayıt kuyrukta
              </Text>
            )}
          </View>
        </View>

        {/* Bilgilendirme Banner'ı */}
        {feedbackBanner && (
          <View
            className={`mt-3 p-3 rounded-xl border flex-row items-start ${
              feedbackBanner.type === "OFFLINE"
                ? "bg-amber-950/70 border-amber-500/50"
                : feedbackBanner.type === "SUCCESS"
                ? "bg-emerald-950/70 border-emerald-500/50"
                : "bg-red-950/70 border-red-500/50"
            }`}
          >
            <Feather
              name={
                feedbackBanner.type === "OFFLINE"
                  ? "cloud-off"
                  : feedbackBanner.type === "SUCCESS"
                  ? "check-circle"
                  : "alert-circle"
              }
              size={18}
              color={
                feedbackBanner.type === "OFFLINE"
                  ? "#F59E0B"
                  : feedbackBanner.type === "SUCCESS"
                  ? "#10B981"
                  : "#EF4444"
              }
              style={{ marginTop: 2, marginRight: 8 }}
            />
            <View className="flex-1">
              <Text
                className={`text-xs font-semibold ${
                  feedbackBanner.type === "OFFLINE"
                    ? "text-amber-200"
                    : feedbackBanner.type === "SUCCESS"
                    ? "text-emerald-200"
                    : "text-red-200"
                }`}
              >
                {feedbackBanner.message}
              </Text>
            </View>
            <TouchableOpacity onPress={() => setFeedbackBanner(null)}>
              <Feather name="x" size={16} color="#9CA3AF" />
            </TouchableOpacity>
          </View>
        )}
      </View>

      <ScrollView
        className="flex-1 px-5"
        contentContainerStyle={{ paddingBottom: 40, paddingTop: 16 }}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => {
              setIsRefreshing(true);
              requestCurrentLocation();
              setTimeout(() => setIsRefreshing(false), 800);
            }}
            tintColor="#EF4444"
          />
        }
      >
        {/* ADIM 1: DİKKAT ÇEKİCİ İKİ ANA BUTON */}
        <View className="space-y-3 mb-6">
          {/* BUTON 1: ⚠️ İHLAL / CEZA BİLDİR */}
          <TouchableOpacity
            activeOpacity={0.88}
            onPress={handleOpenViolationReporting}
            className="bg-gradient-to-r from-red-600 to-rose-700 p-4 rounded-2xl shadow-lg border border-red-500/60 overflow-hidden relative"
            style={{ backgroundColor: "#DC2626" }}
          >
            <View className="flex-row items-center justify-between">
              <View className="flex-1 pr-3">
                <View className="flex-row items-center space-x-2 mb-1">
                  <View className="bg-black/30 px-2 py-0.5 rounded-full">
                    <Text className="text-[10px] font-black text-white tracking-widest uppercase">
                      ACİL SAHA YAPTIRIMI
                    </Text>
                  </View>
                </View>
                <Text className="text-xl font-extrabold text-white tracking-tight">
                  ⚠️ İhlal / Ceza Bildir
                </Text>
                <Text className="text-xs text-red-100 font-medium mt-1 leading-4">
                  Baretsiz işçi, emniyetsiz iskele veya KKD ihlalini anında fotoğrafla, GPS ile tutanağa bağla.
                </Text>
              </View>

              <View className="w-14 h-14 rounded-2xl bg-black/25 items-center justify-center border border-white/20">
                <Feather name="camera" size={26} color="#FFFFFF" />
              </View>
            </View>

            <View className="flex-row items-center justify-between mt-3 pt-2.5 border-t border-white/15">
              <View className="flex-row items-center">
                <Feather name="map-pin" size={12} color="#FEE2E2" />
                <Text className="text-[11px] text-red-100 font-semibold ml-1">
                  {latitude ? `GPS Aktif (±${locationAccuracy || 5}m)` : "GPS Alınıyor..."}
                </Text>
              </View>
              <View className="flex-row items-center">
                <Text className="text-xs font-bold text-white mr-1">Fotoğraf Çek</Text>
                <Feather name="chevron-right" size={14} color="#FFFFFF" />
              </View>
            </View>
          </TouchableOpacity>

          {/* BUTON 2: 🛑 RAMAK KALA OLAYI BİLDİR */}
          <TouchableOpacity
            activeOpacity={0.88}
            onPress={handleOpenNearMissReporting}
            className="p-4 rounded-2xl shadow-lg border border-amber-500/50 overflow-hidden relative mt-3"
            style={{ backgroundColor: "#D97706" }}
          >
            <View className="flex-row items-center justify-between">
              <View className="flex-1 pr-3">
                <View className="flex-row items-center space-x-2 mb-1">
                  <View className="bg-black/30 px-2 py-0.5 rounded-full">
                    <Text className="text-[10px] font-black text-amber-100 tracking-widest uppercase">
                      KAZAYI ÖNCEDEN ENGELLE
                    </Text>
                  </View>
                </View>
                <Text className="text-xl font-extrabold text-white tracking-tight">
                  🛑 Ramak Kala Olayı Bildir
                </Text>
                <Text className="text-xs text-amber-100 font-medium mt-1 leading-4">
                  Yaralanma olmadan atlatılan düşen malzeme veya açık şaft tehlikelerini sisteme işle.
                </Text>
              </View>

              <View className="w-14 h-14 rounded-2xl bg-black/25 items-center justify-center border border-white/20">
                <MaterialCommunityIcons name="shield-alert" size={30} color="#FFFFFF" />
              </View>
            </View>

            <View className="flex-row items-center justify-between mt-3 pt-2.5 border-t border-white/15">
              <Text className="text-[11px] text-amber-100 font-semibold">
                Kaza Olmadan Önce Güvenliği Sağla
              </Text>
              <View className="flex-row items-center">
                <Text className="text-xs font-bold text-white mr-1">Raporla</Text>
                <Feather name="chevron-right" size={14} color="#FFFFFF" />
              </View>
            </View>
          </TouchableOpacity>
        </View>

        {/* HIZLI METRİK KARTLARI */}
        <View className="flex-row space-x-2 mb-6">
          <View className="flex-1 bg-gray-900 border border-gray-800 p-3 rounded-xl">
            <Text className="text-[11px] text-gray-400 font-semibold">Toplam İhlal</Text>
            <View className="flex-row items-baseline mt-1">
              <Text className="text-2xl font-black text-red-400">{violationCount}</Text>
              <Text className="text-[10px] text-gray-500 ml-1">Kayıt</Text>
            </View>
          </View>

          <View className="flex-1 bg-gray-900 border border-gray-800 p-3 rounded-xl">
            <Text className="text-[11px] text-gray-400 font-semibold">Ramak Kala</Text>
            <View className="flex-row items-baseline mt-1">
              <Text className="text-2xl font-black text-amber-400">{nearMissCount}</Text>
              <Text className="text-[10px] text-gray-500 ml-1">Kayıt</Text>
            </View>
          </View>

          <View className="flex-1 bg-gray-900 border border-gray-800 p-3 rounded-xl">
            <Text className="text-[11px] text-gray-400 font-semibold">Kayıp Günlü Kaza</Text>
            <View className="flex-row items-baseline mt-1">
              <Text className="text-2xl font-black text-emerald-400">0</Text>
              <Text className="text-[10px] text-emerald-500/80 ml-1">Kazasız</Text>
            </View>
          </View>
        </View>

        {/* FİLTRE VE BAŞLIK */}
        <View className="flex-row items-center justify-between mb-3">
          <Text className="text-base font-bold text-white">Saha Güvenlik Kayıtları</Text>
          <View className="flex-row bg-gray-900 p-0.5 rounded-lg border border-gray-800">
            <TouchableOpacity
              onPress={() => setActiveFilter("ALL")}
              className={`px-2.5 py-1 rounded-md ${activeFilter === "ALL" ? "bg-gray-800" : ""}`}
            >
              <Text className={`text-xs font-semibold ${activeFilter === "ALL" ? "text-white" : "text-gray-400"}`}>
                Tümü
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setActiveFilter("VIOLATION")}
              className={`px-2.5 py-1 rounded-md ${activeFilter === "VIOLATION" ? "bg-red-950/80" : ""}`}
            >
              <Text
                className={`text-xs font-semibold ${
                  activeFilter === "VIOLATION" ? "text-red-400" : "text-gray-400"
                }`}
              >
                İhlaller
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setActiveFilter("NEAR_MISS")}
              className={`px-2.5 py-1 rounded-md ${activeFilter === "NEAR_MISS" ? "bg-amber-950/80" : ""}`}
            >
              <Text
                className={`text-xs font-semibold ${
                  activeFilter === "NEAR_MISS" ? "text-amber-400" : "text-gray-400"
                }`}
              >
                Ramak Kala
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* LİSTE */}
        <View className="space-y-3">
          {filteredIncidents.length === 0 ? (
            <View className="bg-gray-900/60 border border-gray-800 rounded-2xl p-6 items-center justify-center">
              <Feather name="shield" size={36} color="#4B5563" />
              <Text className="text-sm font-semibold text-gray-400 mt-2">
                Bu kategoride kayıtlı olay bulunamadı.
              </Text>
            </View>
          ) : (
            filteredIncidents.map((incident) => (
              <View
                key={incident.id}
                className="bg-gray-900 border border-gray-800 rounded-2xl p-4 shadow-sm mb-3"
              >
                {/* Üst Bilgi Rozeti */}
                <View className="flex-row items-center justify-between mb-2">
                  <View className="flex-row items-center space-x-1.5">
                    <View
                      className={`px-2 py-0.5 rounded-full ${
                        incident.category === "VIOLATION"
                          ? "bg-red-500/20 border border-red-500/30"
                          : "bg-amber-500/20 border border-amber-500/30"
                      }`}
                    >
                      <Text
                        className={`text-[10px] font-black uppercase ${
                          incident.category === "VIOLATION" ? "text-red-400" : "text-amber-400"
                        }`}
                      >
                        {incident.category === "VIOLATION" ? "⚠️ İSG İhlali" : "🛑 Ramak Kala"}
                      </Text>
                    </View>

                    {incident.status === "PENDING_SYNC" ? (
                      <View className="bg-amber-500/20 px-2 py-0.5 rounded-full border border-amber-500/30">
                        <Text className="text-[10px] text-amber-300 font-bold">
                          ⏳ Cihazda Bekliyor
                        </Text>
                      </View>
                    ) : (
                      <View className="bg-emerald-500/20 px-2 py-0.5 rounded-full border border-emerald-500/30">
                        <Text className="text-[10px] text-emerald-400 font-bold">
                          ✓ Merkeze İletildi
                        </Text>
                      </View>
                    )}
                  </View>

                  <Text className="text-[11px] text-gray-500 font-medium">
                    {incident.createdAt}
                  </Text>
                </View>

                {/* Başlık & İhlal Türü */}
                <Text className="text-base font-bold text-white mb-1">
                  {incident.incidentType}
                </Text>

                {/* Sorumlu Taşeron & Ceza */}
                <View className="flex-row items-center flex-wrap gap-2 mb-2">
                  <View className="flex-row items-center bg-gray-800/80 px-2.5 py-1 rounded-lg">
                    <Feather name="briefcase" size={12} color="#9CA3AF" />
                    <Text className="text-xs text-gray-300 font-semibold ml-1.5">
                      {incident.subcontractorName}
                    </Text>
                  </View>

                  {incident.penaltyAmount && (
                    <View className="flex-row items-center bg-red-950/60 border border-red-800/60 px-2.5 py-1 rounded-lg">
                      <Feather name="dollar-sign" size={12} color="#F87171" />
                      <Text className="text-xs text-red-300 font-bold ml-1">
                        ₺{incident.penaltyAmount.toLocaleString("tr-TR")} Ceza
                      </Text>
                    </View>
                  )}
                </View>

                {/* Konum */}
                <View className="flex-row items-center mb-2">
                  <Feather name="map-pin" size={12} color="#60A5FA" />
                  <Text className="text-xs text-blue-400 font-medium ml-1.5">
                    {incident.locationText}
                    {incident.latitude && incident.longitude
                      ? ` (${incident.latitude.toFixed(4)}, ${incident.longitude.toFixed(4)})`
                      : ""}
                  </Text>
                </View>

                {/* Detay Metni */}
                <Text className="text-xs text-gray-400 leading-4 mb-3">
                  {incident.description}
                </Text>

                {/* Varsa Çekilen Fotoğraf Önizlemesi */}
                {incident.imageUrl ? (
                  <View className="mb-2 rounded-xl overflow-hidden border border-gray-800 h-28 w-full bg-gray-950">
                    <Image
                      source={{ uri: incident.imageUrl }}
                      style={{ width: "100%", height: "100%" }}
                      resizeMode="cover"
                    />
                  </View>
                ) : null}

                {/* Alt Bilgi: Raporlayan */}
                <View className="pt-2 border-t border-gray-800/80 flex-row items-center justify-between">
                  <Text className="text-[11px] text-gray-500">
                    Raporlayan: <Text className="text-gray-400 font-semibold">{incident.reporterName}</Text>
                  </Text>
                  <View className="flex-row items-center">
                    <Feather name="check" size={12} color="#10B981" />
                    <Text className="text-[11px] text-gray-400 font-semibold ml-1">
                      Tutanağa İşlendi
                    </Text>
                  </View>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      {/* ADIM 2: OFFLINE KAMERA MODAL'I */}
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

      {/* ADIM 2: BOTTOM SHEET / KAYIT FORMU MODAL'I */}
      <Modal
        visible={isFormModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsFormModalVisible(false)}
      >
        <View className="flex-1 bg-black/75 justify-end">
          <View
            className="bg-gray-900 rounded-t-3xl border-t border-gray-800 max-h-[92%] flex-col"
            style={{ maxHeight: "92%" }}
          >
            {/* Tutma Çubuğu (Bottom Sheet Grabber) */}
            <View className="items-center pt-3 pb-1">
              <View className="w-12 h-1.5 rounded-full bg-gray-700" />
            </View>

            {/* Modal Header */}
            <View className="px-5 py-3 border-b border-gray-800 flex-row items-center justify-between">
              <View>
                <Text className="text-lg font-black text-white">
                  {selectedCategory === "NEAR_MISS"
                    ? "🛑 Ramak Kala Tutanağı"
                    : "⚠️ İSG İhlal & Ceza Tutanağı"}
                </Text>
                <Text className="text-xs text-gray-400">
                  Fotoğraflı ve GPS doğrulamalı resmi saha kaydı
                </Text>
              </View>

              <TouchableOpacity
                onPress={() => setIsFormModalVisible(false)}
                className="w-8 h-8 rounded-full bg-gray-800 items-center justify-center"
              >
                <Feather name="x" size={18} color="#9CA3AF" />
              </TouchableOpacity>
            </View>

            <ScrollView className="px-5 pt-3" contentContainerStyle={{ paddingBottom: 30 }}>
              {/* Çekilen Fotoğraf Önizlemesi */}
              {capturedPhotoUri && (
                <View className="mb-4">
                  <Text className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">
                    Çekilen İSG Fotoğraf Kanıtı
                  </Text>
                  <View className="relative rounded-2xl overflow-hidden border border-gray-700 h-44 bg-gray-950">
                    <Image
                      source={{ uri: capturedPhotoUri }}
                      style={{ width: "100%", height: "100%" }}
                      resizeMode="cover"
                    />
                    <TouchableOpacity
                      onPress={() => {
                        setIsCameraVisible(true);
                        setIsFormModalVisible(false);
                      }}
                      className="absolute bottom-3 right-3 bg-black/70 px-3 py-1.5 rounded-full flex-row items-center border border-white/20"
                    >
                      <Feather name="refresh-cw" size={13} color="#FFFFFF" />
                      <Text className="text-xs text-white font-semibold ml-1.5">Yeniden Çek</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {/* Kategori Seçici (İhlal vs Ramak Kala) */}
              <View className="mb-4">
                <Text className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">
                  Bildirim Türü
                </Text>
                <View className="flex-row space-x-2">
                  <TouchableOpacity
                    onPress={() => setSelectedCategory("VIOLATION")}
                    className={`flex-1 p-3 rounded-xl border flex-row items-center justify-center ${
                      selectedCategory === "VIOLATION"
                        ? "bg-red-950/80 border-red-500"
                        : "bg-gray-800/60 border-gray-700"
                    }`}
                  >
                    <Feather
                      name="alert-triangle"
                      size={16}
                      color={selectedCategory === "VIOLATION" ? "#EF4444" : "#9CA3AF"}
                    />
                    <Text
                      className={`text-xs font-bold ml-2 ${
                        selectedCategory === "VIOLATION" ? "text-red-400" : "text-gray-300"
                      }`}
                    >
                      İSG İhlali / Ceza
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => setSelectedCategory("NEAR_MISS")}
                    className={`flex-1 p-3 rounded-xl border flex-row items-center justify-center ${
                      selectedCategory === "NEAR_MISS"
                        ? "bg-amber-950/80 border-amber-500"
                        : "bg-gray-800/60 border-gray-700"
                    }`}
                  >
                    <MaterialCommunityIcons
                      name="shield-alert"
                      size={16}
                      color={selectedCategory === "NEAR_MISS" ? "#F59E0B" : "#9CA3AF"}
                    />
                    <Text
                      className={`text-xs font-bold ml-2 ${
                        selectedCategory === "NEAR_MISS" ? "text-amber-400" : "text-gray-300"
                      }`}
                    >
                      Ramak Kala Olayı
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* İHLAL TÜRÜ (DROPDOWN) */}
              <View className="mb-4">
                <Text className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">
                  İhlal / Tehlike Türü *
                </Text>
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => setIsTypePickerVisible(true)}
                  className="bg-gray-800/90 border border-gray-700 p-3.5 rounded-xl flex-row items-center justify-between"
                >
                  <View className="flex-row items-center flex-1 pr-2">
                    <Feather name="alert-octagon" size={16} color="#EF4444" />
                    <Text className="text-sm font-bold text-white ml-2.5 numberOfLines={1}">
                      {selectedType}
                    </Text>
                  </View>
                  <Feather name="chevron-down" size={18} color="#9CA3AF" />
                </TouchableOpacity>
              </View>

              {/* SORUMLU TAŞERON (DROPDOWN) */}
              <View className="mb-4">
                <Text className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">
                  Sorumlu Taşeron Firma *
                </Text>
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => setIsSubcontractorPickerVisible(true)}
                  className="bg-gray-800/90 border border-gray-700 p-3.5 rounded-xl flex-row items-center justify-between"
                >
                  <View className="flex-row items-center flex-1 pr-2">
                    <Feather name="briefcase" size={16} color="#60A5FA" />
                    <Text className="text-sm font-bold text-white ml-2.5 numberOfLines={1}">
                      {selectedSubcontractor}
                    </Text>
                  </View>
                  <Feather name="chevron-down" size={18} color="#9CA3AF" />
                </TouchableOpacity>
              </View>

              {/* KONUM (GPS VE MANUEL AÇIKLAMA) */}
              <View className="mb-4">
                <View className="flex-row items-center justify-between mb-1.5">
                  <Text className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                    Saha Konumu *
                  </Text>
                  <TouchableOpacity
                    onPress={requestCurrentLocation}
                    className="flex-row items-center"
                  >
                    {isLocating ? (
                      <ActivityIndicator size="small" color="#10B981" />
                    ) : (
                      <>
                        <Feather name="crosshair" size={12} color="#10B981" />
                        <Text className="text-[11px] font-semibold text-emerald-400 ml-1">
                          GPS Yenile
                        </Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>

                {/* GPS Koordinat Rozeti */}
                <View className="bg-emerald-950/40 border border-emerald-500/30 p-2.5 rounded-xl flex-row items-center mb-2">
                  <Feather name="map-pin" size={14} color="#10B981" />
                  <Text className="text-xs font-semibold text-emerald-300 ml-2">
                    {latitude && longitude
                      ? `GPS: ${latitude.toFixed(5)}, ${longitude.toFixed(5)} (Hassasiyet: ±${locationAccuracy || 5}m)`
                      : "GPS koordinatları alınıyor..."}
                  </Text>
                </View>

                {/* Manuel Konum Açıklaması */}
                <TextInput
                  value={locationText}
                  onChangeText={setLocationText}
                  placeholder="Örn: A Blok 3. Kat Kolon Alanı, B Blok Şaft Yanı..."
                  placeholderTextColor="#6B7280"
                  className="bg-gray-800/90 border border-gray-700 p-3.5 rounded-xl text-white text-sm"
                />
              </View>

              {/* İDARİ CEZA TUTARI (Sadece İhlal durumunda) */}
              {selectedCategory === "VIOLATION" && (
                <View className="mb-4">
                  <Text className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">
                    Sözleşmesel İSG Ceza Tutarı (₺)
                  </Text>
                  <View className="flex-row items-center bg-gray-800/90 border border-gray-700 rounded-xl px-3.5">
                    <Text className="text-base font-bold text-red-400 mr-2">₺</Text>
                    <TextInput
                      value={penaltyAmount}
                      onChangeText={setPenaltyAmount}
                      keyboardType="numeric"
                      placeholder="5000"
                      placeholderTextColor="#6B7280"
                      className="flex-1 py-3.5 text-white text-sm font-semibold"
                    />
                  </View>
                </View>
              )}

              {/* TEHLİKE DERECESİ */}
              <View className="mb-4">
                <Text className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">
                  Tehlike / Öncelik Seviyesi
                </Text>
                <View className="flex-row space-x-2">
                  {(["LOW", "MEDIUM", "HIGH", "CRITICAL"] as const).map((sev) => {
                    const isSelected = severity === sev;
                    const labels: Record<string, string> = {
                      LOW: "Düşük",
                      MEDIUM: "Orta",
                      HIGH: "Yüksek",
                      CRITICAL: "Hayati",
                    };
                    const colors: Record<string, string> = {
                      LOW: isSelected ? "bg-blue-950/80 border-blue-500 text-blue-400" : "bg-gray-800/60 border-gray-700 text-gray-400",
                      MEDIUM: isSelected ? "bg-amber-950/80 border-amber-500 text-amber-400" : "bg-gray-800/60 border-gray-700 text-gray-400",
                      HIGH: isSelected ? "bg-orange-950/80 border-orange-500 text-orange-400" : "bg-gray-800/60 border-gray-700 text-gray-400",
                      CRITICAL: isSelected ? "bg-red-950/80 border-red-500 text-red-400" : "bg-gray-800/60 border-gray-700 text-gray-400",
                    };
                    return (
                      <TouchableOpacity
                        key={sev}
                        onPress={() => setSeverity(sev)}
                        className={`flex-1 py-2.5 rounded-xl border items-center justify-center ${colors[sev].split(" ").slice(0, 2).join(" ")}`}
                      >
                        <Text className={`text-xs font-bold ${isSelected ? "text-white" : "text-gray-400"}`}>
                          {labels[sev]}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* İSG UZMANI AÇIKLAMASI */}
              <View className="mb-6">
                <Text className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">
                  Tespit & Tutanak Açıklaması *
                </Text>
                <TextInput
                  value={description}
                  onChangeText={setDescription}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                  placeholder="Baretsiz çalışan işçiler tespit edildi, çalışma durduruldu ve taşeron saha şefine yazılı ikaz iletildi..."
                  placeholderTextColor="#6B7280"
                  className="bg-gray-800/90 border border-gray-700 p-3.5 rounded-xl text-white text-sm min-h-[90px]"
                />
              </View>

              {/* GÖNDER BUTONU */}
              <TouchableOpacity
                activeOpacity={0.88}
                disabled={isSubmitting}
                onPress={handleSubmitReport}
                className="py-4 rounded-2xl flex-row items-center justify-center shadow-lg mb-4"
                style={{
                  backgroundColor: selectedCategory === "VIOLATION" ? "#DC2626" : "#D97706",
                }}
              >
                {isSubmitting ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <>
                    <Feather
                      name={isConnected ? "send" : "save"}
                      size={18}
                      color="#FFFFFF"
                      style={{ marginRight: 8 }}
                    />
                    <Text className="text-white text-base font-black tracking-wide">
                      {isConnected
                        ? "Raporu Merkeze İlet"
                        : "Kayıt Cihaza Kaydet (Çevrimdışı)"}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* İHLAL TÜRÜ SEÇİM MODALI */}
      <Modal
        visible={isTypePickerVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsTypePickerVisible(false)}
      >
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => setIsTypePickerVisible(false)}
          className="flex-1 bg-black/80 justify-center px-5"
        >
          <View className="bg-gray-900 border border-gray-800 rounded-3xl p-5 max-h-[80%]">
            <Text className="text-lg font-black text-white mb-3">
              İhlal / Tehlike Türü Seçiniz
            </Text>
            <ScrollView>
              {INCIDENT_TYPES.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  onPress={() => {
                    setSelectedType(item.label);
                    setIsTypePickerVisible(false);
                  }}
                  className={`p-3.5 rounded-xl mb-2 flex-row items-center justify-between border ${
                    selectedType === item.label
                      ? "bg-red-950/60 border-red-500"
                      : "bg-gray-800/60 border-gray-700/60"
                  }`}
                >
                  <Text className="text-sm font-semibold text-white flex-1 pr-2">
                    {item.label}
                  </Text>
                  {selectedType === item.label && (
                    <Feather name="check" size={18} color="#EF4444" />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* TAŞERON SEÇİM MODALI */}
      <Modal
        visible={isSubcontractorPickerVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsSubcontractorPickerVisible(false)}
      >
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => setIsSubcontractorPickerVisible(false)}
          className="flex-1 bg-black/80 justify-center px-5"
        >
          <View className="bg-gray-900 border border-gray-800 rounded-3xl p-5 max-h-[80%]">
            <Text className="text-lg font-black text-white mb-3">
              Sorumlu Taşeron Firma Seçiniz
            </Text>
            <ScrollView>
              {SYSTEM_SUBCONTRACTORS.map((sub) => (
                <TouchableOpacity
                  key={sub.id}
                  onPress={() => {
                    setSelectedSubcontractor(sub.name);
                    setIsSubcontractorPickerVisible(false);
                  }}
                  className={`p-3.5 rounded-xl mb-2 flex-row items-center justify-between border ${
                    selectedSubcontractor === sub.name
                      ? "bg-blue-950/60 border-blue-500"
                      : "bg-gray-800/60 border-gray-700/60"
                  }`}
                >
                  <View className="flex-1 pr-2">
                    <Text className="text-sm font-bold text-white">{sub.name}</Text>
                    <Text className="text-xs text-gray-400 mt-0.5">{sub.trade}</Text>
                  </View>
                  {selectedSubcontractor === sub.name && (
                    <Feather name="check" size={18} color="#3B82F6" />
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
