/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Nexa ERP - Mobil Taşeron İmalat Teslim & BIM Hakediş Modülü
 *
 * ADIM 1: Sadece SUBCONTRACTOR rolüne açık Taşeron Paneli (UI).
 * "Aktif Hakediş Kalemlerim" listesi (FlatList) üzerinden kalan metraj ve iş tanımı.
 * 
 * ADIM 2: "İşi Teslim Et (Kanıt Yükle)" -> OfflineCamera ile fotoğraf çekimi -> 
 * Bottom Sheet üzerinden metraj girişi & BIM ID eşleştirmesi -> /api/finance/submit-proof gönderimi.
 */

import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  TextInput,
  Modal,
  Image,
  ActivityIndicator,
  Alert,
  Vibration,
  RefreshControl,
  StyleSheet,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather, MaterialCommunityIcons, Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import { useAuth } from "../../src/hooks/useAuth";
import { useNetworkSync } from "../../src/hooks/useNetworkSync";
import { OfflineCamera, QueuedMediaItem } from "../../src/components/media/OfflineCamera";
import { OfflineQueue } from "../../src/services/OfflineQueue";
import { api } from "../../src/lib/api";

export interface SubcontractorBoQItem {
  id: string;
  pozNo: string;
  title: string;
  description: string;
  unit: string;
  plannedQuantity: number;
  completedQuantity: number;
  remainingQuantity: number;
  progressPercent: number;
  unitPrice: number;
  totalPrice: number;
  bimElementId: string; // 3D IFC GUID
  projectName?: string;
  projectId?: string;
}

export default function SubcontractorScreen() {
  const { user, role, setRole } = useAuth();
  const { isConnected } = useNetworkSync();

  // State'ler
  const [items, setItems] = useState<SubcontractorBoQItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  // Kamera ve Modal State'leri
  const [isCameraVisible, setIsCameraVisible] = useState<boolean>(false);
  const [isBottomSheetVisible, setIsBottomSheetVisible] = useState<boolean>(false);
  const [selectedBoQItem, setSelectedBoQItem] = useState<SubcontractorBoQItem | null>(null);
  const [capturedPhotoUri, setCapturedPhotoUri] = useState<string | null>(null);

  // Form State'leri
  const [completedQuantity, setCompletedQuantity] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // GPS State'leri
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);

  // Yeşil Toast / Bildirim Banner'ı
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // GPS Konumu Al
  const fetchLocation = useCallback(async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === "granted") {
        const loc = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        setLatitude(loc.coords.latitude);
        setLongitude(loc.coords.longitude);
      }
    } catch {
      // GPS fallback
      setLatitude(41.0851);
      setLongitude(28.8021);
    }
  }, []);

  // Backend'den Hakediş Kalemlerini Çek
  const fetchSubcontractorItems = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await api.get("/finance/submit-proof");
      if (Array.isArray(response.data) && response.data.length > 0) {
        setItems(response.data);
      } else {
        // Fallback demo kalemleri
        setItems(FALLBACK_ITEMS);
      }
    } catch (err) {
      console.warn("[Subcontractor] Hakediş kalemleri yükleme uyarısı, varsayılan kalemler yüklendi:", err);
      setItems(FALLBACK_ITEMS);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchSubcontractorItems();
    fetchLocation();
  }, [fetchSubcontractorItems, fetchLocation]);

  // ADIM 2: "İşi Teslim Et (Kanıt Yükle)" Butonuna Basıldığında
  const handleOpenDelivery = (item: SubcontractorBoQItem) => {
    setSelectedBoQItem(item);
    setCapturedPhotoUri(null);
    setCompletedQuantity("");
    setNotes("");
    setIsCameraVisible(true);
  };

  // Kamera Fotoğrafı Çektiğinde Çalışan Callback
  const handlePhotoCaptured = (media: QueuedMediaItem) => {
    setIsCameraVisible(false);
    setCapturedPhotoUri(media.localUri);
    // Fotoğraf çekildikten sonra Bottom Sheet formunu aç
    setIsBottomSheetVisible(true);
    fetchLocation();
    Vibration.vibrate(50);
  };

  // ADIM 2: "Şefe Onaya Gönder" Butonuna Basıldığında
  const handleSubmitProof = async () => {
    if (!selectedBoQItem) return;

    const qty = parseFloat(completedQuantity);
    if (!completedQuantity.trim() || isNaN(qty) || qty <= 0) {
      Alert.alert("Eksik Bilgi", "Lütfen geçerli bir tamamlanan metraj miktarı giriniz.");
      return;
    }

    setIsSubmitting(true);

    const payload = {
      boqItemId: selectedBoQItem.id,
      claimedQuantity: qty,
      bimElementId: selectedBoQItem.bimElementId, // Arka planda gizli tutulan BIM ID'si
      photoUrl: capturedPhotoUri || "",
      imageUrl: capturedPhotoUri || "",
      title: `${selectedBoQItem.title} - İmalat Teslimi`,
      description: notes.trim() || `${qty} ${selectedBoQItem.unit} imalat tamamlandı ve BIM ${selectedBoQItem.bimElementId} elemanıyla eşleştirildi.`,
      subcontractorName: user?.name || "Taşeron Yetkilisi",
      subcontractorId: user?.id,
      latitude: latitude || 41.0851,
      longitude: longitude || 28.8021,
    };

    try {
      if (isConnected) {
        // Çevrimiçi ise doğrudan /api/finance/submit-proof rotasına gönder
        await api.post("/finance/submit-proof", payload);
      } else {
        // Çevrimdışı ise OfflineQueue'ya al
        await OfflineQueue.addToQueue(
          "/finance/submit-proof",
          payload,
          "POST",
          {
            type: "OTHER",
            title: `Hakediş Kanıtı: ${selectedBoQItem.title} (${qty} ${selectedBoQItem.unit})`,
          }
        );
      }

      // Kalan metrajı yerel listede dinamik düşür
      setItems((prevItems) =>
        prevItems.map((it) => {
          if (it.id === selectedBoQItem.id) {
            const newCompleted = it.completedQuantity + qty;
            const newRemaining = Math.max(0, it.plannedQuantity - newCompleted);
            const newPercent = Math.min(100, Math.round((newCompleted / it.plannedQuantity) * 100));
            return {
              ...it,
              completedQuantity: newCompleted,
              remainingQuantity: newRemaining,
              progressPercent: newPercent,
            };
          }
          return it;
        })
      );

      // Formu kapat
      setIsBottomSheetVisible(false);
      setCapturedPhotoUri(null);
      setCompletedQuantity("");
      setNotes("");

      // Başarılı olunca ekrana yeşil toast mesajı bas
      Vibration.vibrate([100, 200]);
      const successMsg = "Kanıt merkeze iletildi, hakedişinize yansıtılması için şef onayı bekleniyor.";
      setToastMessage(successMsg);

      // 6 saniye sonra toast'ı kaldır
      setTimeout(() => {
        setToastMessage(null);
      }, 6000);
    } catch (err: any) {
      console.error("[Submit Proof Error]:", err);
      Alert.alert(
        "Gönderim Uyarısı",
        "Kanıt kaydedilemedi: " + (err.response?.data?.error || err.message || "Bilinmeyen hata")
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // ADIM 1: Sadece SUBCONTRACTOR rolüne açık kontrolü
  const isAuthorized = role === "SUBCONTRACTOR" || role === "ADMIN";

  if (!isAuthorized) {
    return (
      <SafeAreaView className="flex-1 bg-gray-950 justify-center px-6">
        <View className="bg-gray-900 border border-gray-800 rounded-3xl p-6 items-center shadow-xl">
          <View className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 items-center justify-center mb-4">
            <Feather name="lock" size={32} color="#F59E0B" />
          </View>

          <Text className="text-xl font-bold text-white text-center tracking-tight mb-2">
            Taşeron Yetkisi Gerekli
          </Text>

          <Text className="text-sm text-gray-400 text-center leading-5 mb-6">
            Bu ekran yalnızca <Text className="text-white font-semibold">Taşeron (SUBCONTRACTOR)</Text> yetkisine sahip kullanıcılar içindir. Mevcut rolünüz: <Text className="text-amber-400 font-bold">{role}</Text>
          </Text>

          <TouchableOpacity
            onPress={() => setRole("SUBCONTRACTOR")}
            activeOpacity={0.8}
            className="w-full py-3.5 bg-blue-600 active:bg-blue-700 rounded-xl items-center justify-center flex-row shadow-lg shadow-blue-500/20"
          >
            <Feather name="repeat" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
            <Text className="text-white font-bold text-sm">
              Taşeron Rolüne Geç (Demo Test)
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-950">
      {/* 1. ÜST HEADER */}
      <View className="px-5 pt-3 pb-4 border-b border-gray-900 bg-gray-900/50">
        <View className="flex-row items-center justify-between">
          <View>
            <View className="flex-row items-center space-x-2">
              <View className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse" />
              <Text className="text-xs uppercase tracking-wider font-bold text-blue-400">
                Taşeron Portalı & 3D BIM
              </Text>
            </View>
            <Text className="text-2xl font-black text-white mt-0.5 tracking-tight">
              Aktif Hakediş Kalemlerim
            </Text>
          </View>

          {/* Ağ Durumu */}
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
        </View>

        {/* ADIM 2: Yeşil Toast Mesajı (Başarılı Gönderim) */}
        {toastMessage && (
          <View className="mt-3 p-3.5 rounded-2xl bg-emerald-950/90 border border-emerald-500 flex-row items-start shadow-xl">
            <Feather name="check-circle" size={18} color="#10B981" style={{ marginTop: 2, marginRight: 8 }} />
            <View className="flex-1">
              <Text className="text-xs font-bold text-emerald-200 leading-4">
                {toastMessage}
              </Text>
            </View>
            <TouchableOpacity onPress={() => setToastMessage(null)}>
              <Feather name="x" size={16} color="#6EE7B7" />
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* 2. AKTİF HAKEDİŞ KALEMLERİ LİSTESİ (FLATLIST) */}
      {isLoading && items.length === 0 ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text className="text-gray-400 text-xs font-semibold mt-3">
            Hakediş ve metraj kalemleri yükleniyor...
          </Text>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={() => {
                setIsRefreshing(true);
                fetchSubcontractorItems();
              }}
              tintColor="#3B82F6"
            />
          }
          renderItem={({ item }) => (
            <View className="bg-gray-900 border border-gray-800 rounded-3xl p-5 mb-4 shadow-md">
              {/* Üst Başlık & Poz No & BIM Rozeti */}
              <View className="flex-row items-center justify-between mb-2">
                <View className="px-2.5 py-0.5 rounded-lg bg-gray-800 border border-gray-700">
                  <Text className="text-[11px] font-mono font-bold text-gray-300">
                    Poz: {item.pozNo}
                  </Text>
                </View>

                {/* BIM Eşleşme İndikatörü */}
                <View className="flex-row items-center bg-blue-500/15 border border-blue-500/30 px-2.5 py-0.5 rounded-full">
                  <MaterialCommunityIcons name="cube-outline" size={12} color="#60A5FA" />
                  <Text className="text-[10px] font-bold text-blue-300 ml-1">
                    BIM Eşli
                  </Text>
                </View>
              </View>

              {/* İş Tanımı */}
              <Text className="text-lg font-bold text-white mb-1 leading-6">
                {item.title}
              </Text>
              <Text className="text-xs text-gray-400 mb-3" numberOfLines={2}>
                {item.description}
              </Text>

              {/* Metraj Bilgileri Tablosu */}
              <View className="bg-gray-950/80 border border-gray-800/80 rounded-2xl p-3.5 mb-3.5">
                <View className="flex-row items-center justify-between mb-2 pb-2 border-b border-gray-800">
                  <Text className="text-xs text-gray-400 font-medium">Toplam Sözleşme:</Text>
                  <Text className="text-xs font-bold text-gray-200">
                    {item.plannedQuantity.toLocaleString("tr-TR")} {item.unit}
                  </Text>
                </View>

                <View className="flex-row items-center justify-between mb-2 pb-2 border-b border-gray-800">
                  <Text className="text-xs text-gray-400 font-medium">Onaylanan İmalat:</Text>
                  <Text className="text-xs font-bold text-emerald-400">
                    {item.completedQuantity.toLocaleString("tr-TR")} {item.unit} (%{item.progressPercent})
                  </Text>
                </View>

                {/* Kalan Metraj Vurgusu */}
                <View className="flex-row items-center justify-between">
                  <Text className="text-xs font-bold text-white">Kalan Metraj:</Text>
                  <Text className="text-base font-black text-cyan-400">
                    {item.remainingQuantity.toLocaleString("tr-TR")} {item.unit}
                  </Text>
                </View>

                {/* İlerleme Çubuğu */}
                <View className="w-full bg-gray-800 h-2 rounded-full overflow-hidden mt-3">
                  <View
                    className="bg-blue-500 h-full rounded-full"
                    style={{ width: `${item.progressPercent}%` }}
                  />
                </View>
              </View>

              {/* ADIM 1: Mavi "📷 İşi Teslim Et (Kanıt Yükle)" Butonu */}
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => handleOpenDelivery(item)}
                className="w-full py-3.5 rounded-2xl bg-blue-600 active:bg-blue-700 flex-row items-center justify-center shadow-lg shadow-blue-500/25"
              >
                <Feather name="camera" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
                <Text className="text-white font-bold text-sm tracking-wide">
                  📷 İşi Teslim Et (Kanıt Yükle)
                </Text>
              </TouchableOpacity>
            </View>
          )}
        />
      )}

      {/* ADIM 2: OFFLINE KAMERA MODALI */}
      <Modal
        visible={isCameraVisible}
        animationType="slide"
        onRequestClose={() => setIsCameraVisible(false)}
      >
        <OfflineCamera
          title={`📷 İmalat Teslimi: ${selectedBoQItem?.title || "Hakediş Kanıtı"}`}
          taskId={selectedBoQItem?.id}
          onPhotoQueued={handlePhotoCaptured}
          onClose={() => setIsCameraVisible(false)}
        />
      </Modal>

      {/* ADIM 2: BOTTOM SHEET (KANIT & METRAJ GİRİŞ FORMU) */}
      <Modal
        visible={isBottomSheetVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsBottomSheetVisible(false)}
      >
        <View className="flex-1 bg-black/80 justify-end">
          <View
            className="bg-gray-900 rounded-t-3xl border-t border-gray-800 max-h-[92%] flex-col"
            style={{ maxHeight: "92%" }}
          >
            {/* Grabber */}
            <View className="items-center pt-3 pb-1">
              <View className="w-12 h-1.5 rounded-full bg-gray-700" />
            </View>

            {/* Modal Header */}
            <View className="px-5 py-3 border-b border-gray-800 flex-row items-center justify-between">
              <View>
                <Text className="text-lg font-black text-white">
                  İmalat Teslim & Hakediş Formu
                </Text>
                <Text className="text-xs text-blue-400 font-semibold">
                  Fotoğraflı ve 3D BIM Doğrulamalı Teslimat
                </Text>
              </View>

              <TouchableOpacity
                onPress={() => setIsBottomSheetVisible(false)}
                className="w-8 h-8 rounded-full bg-gray-800 items-center justify-center"
              >
                <Feather name="x" size={18} color="#9CA3AF" />
              </TouchableOpacity>
            </View>

            <View className="px-5 pt-3 pb-6">
              {/* Seçilen Kalem Özeti */}
              <View className="bg-gray-950 p-3.5 rounded-2xl border border-gray-800 mb-4">
                <Text className="text-xs font-mono text-gray-400 mb-0.5">
                  Poz No: {selectedBoQItem?.pozNo}
                </Text>
                <Text className="text-base font-bold text-white mb-1">
                  {selectedBoQItem?.title}
                </Text>
                <View className="flex-row items-center justify-between mt-1 pt-1.5 border-t border-gray-800/60">
                  <Text className="text-xs text-gray-400">Kalan Metraj:</Text>
                  <Text className="text-xs font-bold text-cyan-400">
                    {selectedBoQItem?.remainingQuantity} {selectedBoQItem?.unit}
                  </Text>
                </View>

                {/* Arka planda tutulan ve teknik onayda kullanılan BIM GUID Rozeti */}
                <View className="mt-2 pt-2 border-t border-gray-800/60 flex-row items-center">
                  <MaterialCommunityIcons name="cube" size={14} color="#60A5FA" />
                  <Text className="text-[11px] font-mono text-blue-300 ml-1.5" numberOfLines={1}>
                    BIM GUID: {selectedBoQItem?.bimElementId}
                  </Text>
                </View>
              </View>

              {/* Çekilen Fotoğraf Önizlemesi */}
              {capturedPhotoUri && (
                <View className="mb-4">
                  <Text className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">
                    Çekilen İmalat Fotoğrafı
                  </Text>
                  <View className="relative rounded-2xl overflow-hidden border border-gray-700 h-36 bg-gray-950">
                    <Image
                      source={{ uri: capturedPhotoUri }}
                      style={{ width: "100%", height: "100%" }}
                      resizeMode="cover"
                    />
                    <TouchableOpacity
                      onPress={() => {
                        setIsBottomSheetVisible(false);
                        setIsCameraVisible(true);
                      }}
                      className="absolute bottom-2.5 right-2.5 bg-black/70 px-3 py-1.5 rounded-full flex-row items-center border border-white/20"
                    >
                      <Feather name="refresh-cw" size={12} color="#FFFFFF" />
                      <Text className="text-xs text-white font-semibold ml-1">Yeniden Çek</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {/* ADIM 2: "Tamamlanan Miktar (Metraj)" Sayısal Input */}
              <View className="mb-4">
                <Text className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">
                  Tamamlanan Miktar (Metraj) *
                </Text>
                <View className="flex-row items-center bg-gray-800/90 border border-gray-700 rounded-xl px-4">
                  <TextInput
                    value={completedQuantity}
                    onChangeText={setCompletedQuantity}
                    keyboardType="numeric"
                    placeholder={`Örn: 50`}
                    placeholderTextColor="#6B7280"
                    className="flex-1 py-3 text-white text-base font-bold"
                  />
                  <Text className="text-xs font-bold text-blue-400 ml-2">
                    {selectedBoQItem?.unit}
                  </Text>
                </View>
              </View>

              {/* Saha İmalat Notu (Opsiyonel) */}
              <View className="mb-5">
                <Text className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">
                  İmalat Açıklaması & Not (Opsiyonel)
                </Text>
                <TextInput
                  value={notes}
                  onChangeText={setNotes}
                  placeholder="İmalat şartnameye ve projesine uygun şekilde tamamlandı..."
                  placeholderTextColor="#6B7280"
                  className="bg-gray-800/90 border border-gray-700 p-3 rounded-xl text-white text-xs"
                />
              </View>

              {/* ADIM 2: "Şefe Onaya Gönder" Butonu */}
              <TouchableOpacity
                activeOpacity={0.88}
                disabled={isSubmitting}
                onPress={handleSubmitProof}
                className="w-full py-4 rounded-2xl bg-blue-600 active:bg-blue-700 flex-row items-center justify-center shadow-lg shadow-blue-500/30"
              >
                {isSubmitting ? (
                  <View className="flex-row items-center">
                    <ActivityIndicator color="#FFFFFF" style={{ marginRight: 8 }} />
                    <Text className="text-white text-sm font-bold">İletiliyor...</Text>
                  </View>
                ) : (
                  <View className="flex-row items-center">
                    <Feather name="send" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
                    <Text className="text-white text-base font-black tracking-wide">
                      Şefe Onaya Gönder
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// Varsayılan / Fallback BoQ Kalemleri
const FALLBACK_ITEMS: SubcontractorBoQItem[] = [
  {
    id: "boq_c30_kolon",
    pozNo: "15.120.1001",
    title: "C30 Kolon ve Perde Betonu Dökümü",
    description: "A Blok 3. Kat Kolon & Perde C30/37 Hazır Beton Dökümü (Pompalı)",
    unit: "m3",
    plannedQuantity: 1850,
    completedQuantity: 1100,
    remainingQuantity: 750,
    progressPercent: 59,
    unitPrice: 2650,
    totalPrice: 4902500,
    bimElementId: "2O2$U$point$3kKolonPerde_A3_301",
    projectName: "Vadi Evleri 3. Etap",
  },
  {
    id: "boq_s420_demir",
    pozNo: "15.140.1002",
    title: "S420 Nervürlü Donatı Çeliği Montajı",
    description: "B Blok 2. Kat Döşeme ve Kiriş Donatı İmalatı (Ø14-Ø28)",
    unit: "Ton",
    plannedQuantity: 240,
    completedQuantity: 180,
    remainingQuantity: 60,
    progressPercent: 75,
    unitPrice: 31500,
    totalPrice: 7560000,
    bimElementId: "3K1$X$point$9mDosemeRebar_B2_204",
    projectName: "Vadi Evleri 3. Etap",
  },
  {
    id: "boq_gazbeton_duvar",
    pozNo: "15.210.1003",
    title: "20 cm Gazbeton Dış Duvar İmalatı",
    description: "A Blok 2. ve 3. Kat Daire İçi & Dış Cephe Duvar Örülmesi",
    unit: "m2",
    plannedQuantity: 3200,
    completedQuantity: 1440,
    remainingQuantity: 1760,
    progressPercent: 45,
    unitPrice: 420,
    totalPrice: 1344000,
    bimElementId: "4M3$Z$point$2mGazbetonDuvar_A_02",
    projectName: "Vadi Evleri 3. Etap",
  },
  {
    id: "boq_kalip_iskele",
    pozNo: "15.110.1001",
    title: "Endüstriyel Çelik Kolon & Perde Kalıbı",
    description: "C Blok Kat Kalıbı Kurulumu ve Şakül Doğrulaması",
    unit: "m2",
    plannedQuantity: 5400,
    completedQuantity: 4050,
    remainingQuantity: 1350,
    progressPercent: 75,
    unitPrice: 580,
    totalPrice: 3132000,
    bimElementId: "1N8$Y$point$7kEndustriyelKalip_C_01",
    projectName: "Vadi Evleri 3. Etap",
  },
  {
    id: "boq_su_yalitimi",
    pozNo: "15.260.1001",
    title: "Bodrum Perde Bitümlü Su Yalıtımı",
    description: "Temel ve Bodrum Dış Perde 2 Kat Membran İzolasyonu",
    unit: "m2",
    plannedQuantity: 1800,
    completedQuantity: 1620,
    remainingQuantity: 180,
    progressPercent: 90,
    unitPrice: 380,
    totalPrice: 684000,
    bimElementId: "5P9$A$point$6kSuYalitimiMembran_B_00",
    projectName: "Vadi Evleri 3. Etap",
  },
];
