import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  Platform,
  Vibration,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather, Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import { useAuth } from "../../src/hooks/useAuth";
import { LogisticsScanner } from "../../src/components/scanner";
import api from "../../src/lib/api";
import {
  startBackgroundLocationTracking,
  stopBackgroundLocationTracking,
  isLocationTrackingActive,
  getActiveDeliveryTracking,
  LOCATION_TRACKING_TASK_NAME,
  DeliveryTrackingState,
} from "../../src/tasks/locationTask";

export interface ReceivedItem {
  id: string;
  code: string;
  materialName: string;
  quantity: string;
  receivedAt: string;
  supplier: string;
}

const RECENT_RECEIVALS: ReceivedItem[] = [
  {
    id: "REC-101",
    code: "IRS-98421-DEMIR",
    materialName: "BÇ III Nervürlü İnşaat Demiri (Q16)",
    quantity: "32 Ton",
    receivedAt: "Bugün 14:20",
    supplier: "Dilovası Çelik Fabrikası",
  },
  {
    id: "REC-100",
    code: "IRS-98399-BETON",
    materialName: "C30/37 Hazır Beton",
    quantity: "140 m³",
    receivedAt: "Dün 11:45",
    supplier: "Akçansa Hazır Beton",
  },
];

/**
 * Nexa ERP Mobil - Malzeme Kabul & Şoför Canlı Sevkiyat Takip Ekranı
 * Sadece DRIVER ve WAREHOUSE (Lojistik) rollerine özel ekran. Yetkisiz ise 'return null'.
 */
export default function LogisticsScreen() {
  const { user, role } = useAuth();
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [receivals, setReceivals] = useState<ReceivedItem[]>(RECENT_RECEIVALS);

  // Arka Plan Canlı GPS Takip Durumu
  const [isTrackingActive, setIsTrackingActive] = useState(false);
  const [isTrackingLoading, setIsTrackingLoading] = useState(false);
  const [trackingInfo, setTrackingInfo] =
    useState<DeliveryTrackingState | null>(null);

  // Yeşil Toast Bildirimi State'i
  const [toast, setToast] = useState<{
    visible: boolean;
    title?: string;
    code: string;
    material: string;
    quantity: string;
  } | null>(null);

  // Başlangıçta arka plan takibinin açık olup olmadığını kontrol et
  useEffect(() => {
    (async () => {
      try {
        const active = await isLocationTrackingActive();
        setIsTrackingActive(active);

        const info = await getActiveDeliveryTracking();
        if (info && info.isActive) {
          setTrackingInfo(info);
        }
      } catch (err) {
        console.warn("[Logistics] Takip durumu sorgulama hatası:", err);
      }
    })();
  }, []);

  // ADIM 2: ROL BAZLI KORUMA
  // Sadece DRIVER, WAREHOUSE veya LOGISTICS rollerine izin ver. Değilse ekran boş dönsün (return null).
  const isAuthorized =
    role === "DRIVER" ||
    role === "WAREHOUSE" ||
    role === "LOGISTICS" ||
    role === "ADMIN";

  if (!isAuthorized) {
    return null;
  }

  // ADIM 2: Arka Plan GPS Canlı Takip Başlat / Durdur Tetikleyicisi
  const handleToggleTracking = async () => {
    setIsTrackingLoading(true);

    try {
      if (!isTrackingActive) {
        // --- SEVKİYATA BAŞLA (Arka Plan Görevini Başlat) ---
        console.log(
          "[Logistics] Location.startLocationUpdatesAsync arka plan takibi başlatılıyor..."
        );

        const result = await startBackgroundLocationTracking({
          deliveryId: "DEL-2026-98421",
          driverId: user?.id || "usr_driver_01",
          driverName: user?.name || "Mehmet Demir",
          waybillNo: "IRS-98421",
        });

        if (!result.success) {
          Alert.alert("Konum İzni Gerekli", result.error);
          setIsTrackingLoading(false);
          return;
        }

        setIsTrackingActive(true);
        setTrackingInfo({
          isActive: true,
          deliveryId: "DEL-2026-98421",
          driverName: user?.name,
          waybillNo: "IRS-98421",
          startedAt: new Date().toLocaleTimeString("tr-TR"),
        });

        if (Platform.OS !== "web") {
          Vibration.vibrate([0, 100, 100, 150]);
        }

        Alert.alert(
          "🚚 Sevkiyat Başlatıldı",
          "Canlı GPS takibi devrede. Telefon kilitli veya uygulama arka planda olsa bile koordinatlarınız Merkez'e iletilmeye devam edecektir.",
          [{ text: "Tamam" }]
        );
      } else {
        // --- TESLİMATI BİTİR (Arka Plan Görevini Durdur) ---
        Alert.alert(
          "🛑 Teslimatı Bitir",
          "Rotayı tamamlayıp canlı konum paylaşımını kapatmak istiyor musunuz?",
          [
            {
              text: "Vazgeç",
              style: "cancel",
              onPress: () => setIsTrackingLoading(false),
            },
            {
              text: "Evet, Bitir",
              style: "destructive",
              onPress: async () => {
                console.log(
                  "[Logistics] Location.stopLocationUpdatesAsync arka plan takibi durduruluyor..."
                );
                await stopBackgroundLocationTracking();
                setIsTrackingActive(false);
                setTrackingInfo(null);
                setIsTrackingLoading(false);

                if (Platform.OS !== "web") {
                  Vibration.vibrate(120);
                }

                Alert.alert(
                  "Teslimat Tamamlandı",
                  "Arka plan konum paylaşımı kapatıldı. İmalat ve şantiye depolarına teslimat kaydedilebilir."
                );
              },
            },
          ]
        );
        return;
      }
    } catch (err: any) {
      console.error("[Logistics] Takip butonu hatası:", err);
      Alert.alert(
        "Hata",
        "Takip işlemi gerçekleştirilemedi: " + (err?.message || "Bilinmeyen hata")
      );
    } finally {
      setIsTrackingLoading(false);
    }
  };

  // QR / Barkod okunduğunda backend'e (/api/logistics/receive) gönder
  const handleCodeScanned = async (scannedCode: string, codeType?: string) => {
    setIsLoading(true);

    try {
      console.log(
        `[Logistics] Backend'e gönderiliyor: /api/logistics/receive -> ${scannedCode}`
      );

      // Axios backend API isteği
      const response = await api.post("/logistics/receive", {
        code: scannedCode,
        type: codeType || "QR",
        receivedAt: new Date().toISOString(),
        receivedBy: user.id,
      });

      const materialName =
        response.data?.materialName || "BÇ III Nervürlü İnşaat Demiri (Q16)";
      const quantity = response.data?.quantity || "32 Ton";

      // Başarılı kaydı listeye ekle
      const newItem: ReceivedItem = {
        id: `REC-${Date.now().toString().slice(-4)}`,
        code: scannedCode,
        materialName,
        quantity,
        receivedAt: "Az önce",
        supplier: "Onaylı Tedarikçi",
      };

      setReceivals([newItem, ...receivals]);

      // Yeşil "Stoka Eklendi" Toast mesajı
      setToast({
        visible: true,
        title: "Stoka Eklendi",
        code: scannedCode,
        material: materialName,
        quantity,
      });

      if (Platform.OS !== "web") {
        Vibration.vibrate(100);
      }
    } catch (error: any) {
      console.warn(
        "[Logistics] Backend offline veya yanıt vermedi, yerel kayıt oluşturuluyor:",
        error.message
      );

      // Demo & Çevrimdışı şantiye desteği: Yerel listeye kaydet ve yeşil toast göster
      const fallbackItem: ReceivedItem = {
        id: `REC-${Date.now().toString().slice(-4)}`,
        code: scannedCode,
        materialName: "BÇ III Nervürlü İnşaat Demiri (Q16)",
        quantity: "32 Ton",
        receivedAt: "Az önce (Yerel Kayıt)",
        supplier: "Dilovası Çelik A.Ş.",
      };

      setReceivals([fallbackItem, ...receivals]);

      setToast({
        visible: true,
        title: "Stoka Eklendi (Yerel)",
        code: scannedCode,
        material: fallbackItem.materialName,
        quantity: fallbackItem.quantity,
      });

      if (Platform.OS !== "web") {
        Vibration.vibrate(100);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-950">
      {/* Özel iOS Tarzı Üst Header */}
      <View className="px-6 pt-4 pb-3 bg-gray-900/90 border-b border-gray-800 flex-row items-center justify-between">
        <View>
          <Text className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-0.5">
            Lojistik & Sevkiyat Yönetimi
          </Text>
          <Text className="text-2xl font-black text-white tracking-tight">
            Malzeme & Sevkiyat
          </Text>
        </View>

        <View className="px-3 py-1 bg-blue-500/10 border border-blue-500/30 rounded-full flex-row items-center gap-1.5">
          <Feather name="truck" size={12} color="#60A5FA" />
          <Text className="text-blue-400 text-xs font-bold uppercase">
            {role === "DRIVER" ? "Şoför Modu" : "Depo Sorumlusu"}
          </Text>
        </View>
      </View>

      <ScrollView
        className="flex-1 px-6 pt-5"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        {/* Yeşil "Stoka Eklendi" Toast / Başarı Bildirimi */}
        {toast?.visible && (
          <View className="mb-5 p-4 rounded-3xl bg-emerald-500/15 border border-emerald-500/40 shadow-lg shadow-emerald-500/20">
            <View className="flex-row items-center justify-between mb-1.5">
              <View className="flex-row items-center gap-2">
                <View className="w-6 h-6 rounded-full bg-emerald-500 items-center justify-center">
                  <Feather name="check" size={14} color="#090d16" />
                </View>
                <Text className="text-emerald-400 text-sm font-black tracking-wide">
                  {toast.title || "Stoka Eklendi"}
                </Text>
              </View>

              <TouchableOpacity onPress={() => setToast(null)}>
                <Feather name="x" size={16} color="#6EE7B7" />
              </TouchableOpacity>
            </View>

            <Text className="text-white text-xs font-bold mt-1">
              {toast.material} • {toast.quantity}
            </Text>
            <Text className="text-emerald-300/80 text-[11px] font-mono mt-0.5">
              İrsaliye Kodu: {toast.code}
            </Text>
          </View>
        )}

        {/* ============================================================ */}
        {/* ADIM 2: CANLI SEVKİYAT TAKİP BUTONU (Şoför Özel Ekranı)       */}
        {/* ============================================================ */}
        <View className="mb-6 rounded-3xl p-5 bg-gray-900 border border-gray-800 shadow-xl overflow-hidden relative">
          {/* Durum Rozeti */}
          <View className="flex-row items-center justify-between mb-3">
            <View className="flex-row items-center gap-2">
              <View
                className={`w-3 h-3 rounded-full ${
                  isTrackingActive
                    ? "bg-rose-500 shadow-md shadow-rose-500"
                    : "bg-emerald-400"
                }`}
              />
              <Text className="text-xs font-bold text-gray-300 uppercase tracking-wider">
                {isTrackingActive ? "CANLI GPS DEVREDE" : "SEVKİYAT DURUMU"}
              </Text>
            </View>

            <View
              className={`px-2.5 py-0.5 rounded-full border ${
                isTrackingActive
                  ? "bg-rose-500/10 border-rose-500/40"
                  : "bg-gray-800 border-gray-700"
              }`}
            >
              <Text
                className={`text-[10px] font-bold ${
                  isTrackingActive ? "text-rose-400" : "text-gray-400"
                }`}
              >
                {isTrackingActive ? "YOLDA / KİLİTLİ TAKİP" : "BEKLEMEDE"}
              </Text>
            </View>
          </View>

          {/* Sevkiyat Detay Kutusu */}
          <View className="p-3.5 bg-gray-950/80 rounded-2xl border border-gray-800 mb-4 gap-1.5">
            <View className="flex-row items-center justify-between">
              <Text className="text-gray-400 text-xs">Aktif Rota:</Text>
              <Text className="text-white text-xs font-bold">
                Dilovası Fabrika ➔ Kadıköy Merkez
              </Text>
            </View>
            <View className="flex-row items-center justify-between">
              <Text className="text-gray-400 text-xs">İrsaliye No:</Text>
              <Text className="text-blue-400 text-xs font-mono font-semibold">
                #IRS-98421 (32 Ton Demir)
              </Text>
            </View>
            <View className="flex-row items-center justify-between">
              <Text className="text-gray-400 text-xs">Arka Plan Takibi:</Text>
              <Text
                className={`text-xs font-semibold ${
                  isTrackingActive ? "text-emerald-400" : "text-gray-500"
                }`}
              >
                {isTrackingActive
                  ? "Telefon Kilitli Mod Aktif"
                  : "Henüz Başlatılmadı"}
              </Text>
            </View>
          </View>

          {/* Sevkiyata Başla / Teslimatı Bitir Dinamik Butonu */}
          <TouchableOpacity
            onPress={handleToggleTracking}
            disabled={isTrackingLoading}
            activeOpacity={0.85}
            className={`w-full py-4 rounded-2xl flex-row items-center justify-center gap-2.5 shadow-lg ${
              isTrackingActive
                ? "bg-rose-600 shadow-rose-600/30 border border-rose-400/30"
                : "bg-emerald-600 shadow-emerald-600/30 border border-emerald-400/30"
            }`}
          >
            {isTrackingLoading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : isTrackingActive ? (
              <>
                <Feather name="stop-circle" size={20} color="#FFFFFF" />
                <Text className="text-white text-base font-black tracking-tight">
                  🛑 Teslimatı Bitir (Konum Paylaşımını Kapat)
                </Text>
              </>
            ) : (
              <>
                <Feather name="navigation" size={20} color="#FFFFFF" />
                <Text className="text-white text-base font-black tracking-tight">
                  🚚 Sevkiyata Başla (Rotaya Çık)
                </Text>
              </>
            )}
          </TouchableOpacity>

          <Text className="text-gray-500 text-[11px] text-center mt-2.5">
            {isTrackingActive
              ? "Merkez operasyon paneline her 5 saniyede bir anlık GPS koordinatı aktarılıyor."
              : "Rotaya çıktığınızda butona basarak canlı arka plan konum servisini başlatın."}
          </Text>
        </View>

        {/* ============================================================ */}
        {/* Devasa "📷 İrsaliye / Malzeme Okut" Butonu                   */}
        {/* ============================================================ */}
        <TouchableOpacity
          onPress={() => setIsScannerOpen(true)}
          disabled={isLoading}
          activeOpacity={0.85}
          className="w-full bg-gradient-to-br from-blue-600 via-indigo-600 to-blue-700 bg-blue-600 rounded-3xl p-8 mb-6 shadow-2xl shadow-blue-500/30 border border-blue-400/40 items-center justify-center overflow-hidden"
        >
          <View className="w-20 h-20 rounded-3xl bg-white/20 items-center justify-center mb-4 border border-white/30 shadow-inner">
            {isLoading ? (
              <ActivityIndicator size="large" color="#FFFFFF" />
            ) : (
              <Ionicons name="camera-outline" size={44} color="#FFFFFF" />
            )}
          </View>

          <Text className="text-white text-2xl font-black tracking-tight text-center">
            📷 İrsaliye / Malzeme Okut
          </Text>
          <Text className="text-blue-100 text-xs text-center mt-2 font-medium px-4 leading-4">
            Malzeme barkodunu veya sevk irsaliyesi QR kodunu vizör ile tarayın,
            anında şantiye deposuna işleyin.
          </Text>

          <View className="mt-4 px-4 py-1.5 rounded-full bg-white/15 border border-white/25 flex-row items-center gap-1.5">
            <Feather name="maximize" size={12} color="#FFFFFF" />
            <Text className="text-white text-[11px] font-bold">
              Tam Ekran Vizör Modunu Başlat
            </Text>
          </View>
        </TouchableOpacity>

        {/* Depo Bilgi Özeti */}
        <View className="bg-white dark:bg-gray-800/80 rounded-3xl p-5 shadow-sm border border-gray-100 dark:border-gray-700 mb-6">
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-white text-sm font-bold">
              Aktif Kabul Deposu
            </Text>
            <View className="px-2.5 py-0.5 bg-emerald-500/10 border border-emerald-500/30 rounded-full">
              <Text className="text-emerald-400 text-[10px] font-bold">AÇIK</Text>
            </View>
          </View>

          <View className="p-3.5 bg-gray-900/80 border border-gray-700/60 rounded-2xl gap-2">
            <View className="flex-row justify-between">
              <Text className="text-gray-400 text-xs">Lokasyon:</Text>
              <Text className="text-white text-xs font-semibold">
                Kadıköy Merkez Şantiye • Depo-1
              </Text>
            </View>
            <View className="flex-row justify-between">
              <Text className="text-gray-400 text-xs">Bugünkü Kabul:</Text>
              <Text className="text-blue-400 text-xs font-bold font-mono">
                {receivals.length} Sevkiyat
              </Text>
            </View>
          </View>
        </View>

        {/* Son Teslim Alınanlar Başlığı */}
        <Text className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
          Son Teslim Alınan İrsaliyeler
        </Text>

        {/* Teslim Alınan Malzemeler Listesi */}
        {receivals.map((item) => (
          <View
            key={item.id}
            className="bg-white dark:bg-gray-800/80 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-700 mb-3"
          >
            <View className="flex-row items-center justify-between mb-1.5">
              <Text className="text-white text-sm font-bold" numberOfLines={1}>
                {item.materialName}
              </Text>
              <View className="px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/30 rounded-full">
                <Text className="text-emerald-400 text-[10px] font-bold">
                  KABUL EDİLDİ
                </Text>
              </View>
            </View>

            <View className="flex-row items-center justify-between mt-1">
              <Text className="text-blue-400 font-mono text-xs font-bold">
                {item.quantity}
              </Text>
              <Text className="text-gray-400 text-xs">{item.supplier}</Text>
            </View>

            <View className="flex-row items-center justify-between pt-2.5 mt-2.5 border-t border-gray-700/50">
              <Text className="text-gray-400 text-[10px] font-mono">
                İrsaliye: #{item.code}
              </Text>
              <Text className="text-gray-400 text-[10px]">{item.receivedAt}</Text>
            </View>
          </View>
        ))}
      </ScrollView>

      {/* ============================================================ */}
      {/* Tam Ekran LogisticsScanner Vizör Modali                      */}
      {/* ============================================================ */}
      <Modal
        visible={isScannerOpen}
        animationType="slide"
        onRequestClose={() => setIsScannerOpen(false)}
      >
        <LogisticsScanner
          onScanned={handleCodeScanned}
          onClose={() => setIsScannerOpen(false)}
          title="İrsaliye & Malzeme Vizörü"
          subtitle="İrsaliye üzerindeki barkodu veya malzeme kabul QR kodunu vizöre hizalayınız"
        />
      </Modal>
    </SafeAreaView>
  );
}
