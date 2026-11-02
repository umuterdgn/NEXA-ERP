import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Animated,
  Alert,
  Vibration,
  Platform,
  Modal,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Location from "expo-location";
import * as Network from "expo-network";
import { useAuth } from "../../src/hooks/useAuth";
import { useNFCScanner } from "../../src/hooks/useNFCScanner";
import { useNetworkSync } from "../../src/hooks/useNetworkSync";
import { QRScanner } from "../../src/components/scanner";
import { OfflineQueue } from "../../src/services/OfflineQueue";
import { api } from "../../src/lib/api";
import {
  BACKGROUND_LOCATION_TASK,
  startAttendanceLocationTracking,
  stopAttendanceLocationTracking,
} from "../../src/tasks/backgroundLocationTask";

/**
 * Şantiye Geofence (Coğrafi Sınır) Yapılandırması
 * Kadıköy Merkez Rezidans Şantiye Koordinatları
 */
const ACTIVE_SITE_GEOFENCE = {
  name: "Kadıköy Merkez Rezidans & AVM",
  code: "PRJ-2026-A",
  latitude: 40.9912,
  longitude: 29.0287,
  radiusMeters: 500, // 500 metre şantiye yarıçapı
};

/**
 * İki GPS koordinatı arasındaki mesafeyi metre cinsinden hesaplar (Haversine Formülü)
 */
function getDistanceInMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // Dünya yarıçapı (metre)
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c);
}

export default function AttendanceScreen() {
  const { user, role } = useAuth();
  const { isSupported: isNfcSupported, isScanning: isNfcScanning, scanCard, cancelScan } =
    useNFCScanner();
  const { isConnected } = useNetworkSync();

  // Durum State'leri
  const [isCheckingLocation, setIsCheckingLocation] = useState(false);
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [checkInTime, setCheckInTime] = useState<string | null>(null);
  const [lastCardUid, setLastCardUid] = useState<string | null>(null);
  const [currentDistance, setCurrentDistance] = useState<number | null>(null);
  const [isInGeofence, setIsInGeofence] = useState<boolean | null>(null);
  const [isDemoGeofenceOverride, setIsDemoGeofenceOverride] = useState(false);
  const [isTrackingActive, setIsTrackingActive] = useState(false);

  // Modaller
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [showNFCModal, setShowNFCModal] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Animasyon Değerleri (Devasa Dairesel Buton İçin Pulse Efekti)
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const rippleAnim = useRef(new Animated.Value(0)).current;

  // Yetki Kontrolü: Yalnızca yetkili personelde veya cihazlarda görünsün
  const isAuthorized =
    role === "FOREMAN" ||
    role === "ENGINEER" ||
    role === "ADMIN" ||
    role === "SUBCONTRACTOR" ||
    role === "DRIVER" ||
    role === "WAREHOUSE";

  if (!isAuthorized) {
    return null;
  }

  // Nabız Animasyonu Başlat
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.06,
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1200,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // İlk açılışta GPS konumunu ve şantiye mesafesini doğrula
    verifyGeofenceLocation();

    // Arka plan GPS görevinin çalışıp çalışmadığını kontrol et
    Location.hasStartedLocationUpdatesAsync(BACKGROUND_LOCATION_TASK)
      .then((active) => {
        if (active) {
          setIsCheckedIn(true);
          setIsTrackingActive(true);
        }
      })
      .catch((e) => console.log("[Attendance] Görev durumu okunamadı:", e));
  }, []);

  // 1. GPS Konum Doğrulaması (Geofencing)
  const verifyGeofenceLocation = async (): Promise<boolean> => {
    try {
      setIsCheckingLocation(true);
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== "granted") {
        Alert.alert(
          "Konum İzni Gerekli",
          "Şantiye geofence doğrulaması için konum izni gereklidir."
        );
        return false;
      }

      const currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const dist = getDistanceInMeters(
        currentLocation.coords.latitude,
        currentLocation.coords.longitude,
        ACTIVE_SITE_GEOFENCE.latitude,
        ACTIVE_SITE_GEOFENCE.longitude
      );

      setCurrentDistance(dist);
      const withinSite = dist <= ACTIVE_SITE_GEOFENCE.radiusMeters || isDemoGeofenceOverride;
      setIsInGeofence(withinSite);

      return withinSite;
    } catch (err: any) {
      console.warn("[Attendance] Konum alma hatası:", err);
      // Geliştirici veya ofis ortamında demo override açık ise onay ver
      if (isDemoGeofenceOverride) {
        setIsInGeofence(true);
        return true;
      }
      return false;
    } finally {
      setIsCheckingLocation(false);
    }
  };

  // 2. Giriş Yap Ana Tetikleyicisi
  const handleCheckInPress = async () => {
    // Adım 1: GPS Geofencing Kontrolü
    const inSite = await verifyGeofenceLocation();

    if (!inSite && !isDemoGeofenceOverride) {
      Alert.alert(
        "⚠️ Şantiye Alanında Değilsiniz",
        `Puantaj doğrulaması için şantiye sınırları (Geofence: ${ACTIVE_SITE_GEOFENCE.radiusMeters}m) içinde olmalısınız.\n\nMevcut Mesafe: Yaklaşık ${currentDistance || "Bilinmiyor"} m dışarıdasınız.`,
        [
          { text: "Tamam" },
          {
            text: "🧪 Test Simülasyonunu Aç",
            onPress: () => {
              setIsDemoGeofenceOverride(true);
              setIsInGeofence(true);
              Alert.alert(
                "Geofence Simülasyonu",
                "Şantiye içi test modu açıldı. Artık NFC ve QR ile puantaj girişini test edebilirsiniz."
              );
            },
          },
        ]
      );
      return;
    }

    // Adım 2: Konum doğruysa NFC okuyucuyu tetikle
    setShowNFCModal(true);
    triggerNFCScan();
  };

  // NFC Taramasını Başlat
  const triggerNFCScan = async () => {
    const result = await scanCard();

    if (result.success && result.uid) {
      setShowNFCModal(false);
      await processAttendanceCheckIn(result.uid, "NFC");
    }
  };

  // QR Yaka Kartı ile Giriş
  const handleQRScanned = async (qrData: string) => {
    setShowQRScanner(false);
    await processAttendanceCheckIn(qrData, "QR");
  };

  // 3. Puantaj Backend Kaydı (/api/attendance/check-in)
  const processAttendanceCheckIn = async (
    identifier: string,
    method: "NFC" | "QR"
  ) => {
    try {
      if (Platform.OS !== "web") {
        Vibration.vibrate([0, 100, 80, 200]);
      }

      setLastCardUid(identifier);
      const currentTimeStr = new Date().toLocaleTimeString("tr-TR", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });

      const payload = {
        workerName: user?.name || "Ahmet Yılmaz",
        nfcUid: identifier,
        cardUid: identifier,
        latitude: ACTIVE_SITE_GEOFENCE.latitude,
        longitude: ACTIVE_SITE_GEOFENCE.longitude,
        projectId: "prj_vista_2026",
        method,
      };

      // İnternet durumunu denetle
      const netState = await Network.getNetworkStateAsync();
      const hasInternet = Boolean(netState.isConnected);

      if (!hasInternet) {
        // Çevrimdışı modda OfflineQueue'ya ekle
        await OfflineQueue.addToQueue(
          "/attendance/check-in",
          payload,
          "POST",
          {
            type: "OTHER",
            title: `Puantaj Girişi (${method}): ${user?.name}`,
          }
        );

        setStatusMessage(
          "İnternet bağlantısı yok. Puantaj verisi cihaza kaydedildi, bağlantı sağlandığında otomatik gönderilecek."
        );
        setTimeout(() => setStatusMessage(null), 6000);
      } else {
        // İnternet var: Backend API isteği at
        try {
          await api.post("/attendance/check-in", payload);
          setStatusMessage(
            `✅ ${method} Puantaj Girişi Başarılı! (${currentTimeStr})`
          );
          setTimeout(() => setStatusMessage(null), 5000);
        } catch (apiErr: any) {
          console.warn("[Attendance] API isteği başarısız, offline kuyruğa yazılıyor:", apiErr);
          await OfflineQueue.addToQueue(
            "/attendance/check-in",
            payload,
            "POST",
            {
              type: "OTHER",
              title: `Puantaj Girişi (${method}): ${user?.name}`,
            }
          );
        }
      }

      setIsCheckedIn(true);
      setCheckInTime(currentTimeStr);

      // ADIM 2: Kullanıcı NFC/QR ile başarıyla giriş yaptığında:
      // Location.startLocationUpdatesAsync('BACKGROUND_LOCATION_TASK', { accuracy: Location.Accuracy.Balanced, distanceInterval: 10, deferredUpdatesInterval: 15000 })
      try {
        await Location.requestForegroundPermissionsAsync();
        await Location.requestBackgroundPermissionsAsync();

        const isStarted = await Location.hasStartedLocationUpdatesAsync(BACKGROUND_LOCATION_TASK);
        if (!isStarted) {
          await Location.startLocationUpdatesAsync(BACKGROUND_LOCATION_TASK, {
            accuracy: Location.Accuracy.Balanced,
            distanceInterval: 10, // 10 metrede bir
            deferredUpdatesInterval: 15000, // 15 saniyede bir
            showsBackgroundLocationIndicator: true,
            pausesUpdatesAutomatically: false,
            foregroundService: {
              notificationTitle: "Nexa ERP - Şantiye Güvenlik Takibi",
              notificationBody: "Şantiye mesai ve İSG güvenliğiniz için arka planda canlı konumunuz aktarılıyor.",
              notificationColor: "#2563EB",
            },
          });
          console.log("[Attendance] BACKGROUND_LOCATION_TASK başarıyla başlatıldı (10m / 15s).");
        }
        setIsTrackingActive(true);
        await startAttendanceLocationTracking({
          userId: user?.name ? `usr_${user.name.toLowerCase().replace(/\s+/g, "_")}` : "usr_personel_01",
          userName: user?.name || "Personel",
          personelId: identifier,
          projectId: "PRJ-2026-A",
          projectName: ACTIVE_SITE_GEOFENCE.name,
        });
      } catch (locErr: any) {
        console.warn("[Attendance] Arka plan konum görevi başlatılamadı:", locErr);
      }

      Alert.alert(
        "🎉 Puantaj Başlatıldı",
        `Tebrikler ${user?.name || "Personel"}, şantiye turnike girişi onaylandı!\n\n🛰️ İSG Canlı GPS Takibi: Aktif (10m / 15s)\nKart UID: ${identifier}\nSaat: ${currentTimeStr}\nŞantiye: ${ACTIVE_SITE_GEOFENCE.name}`,
        [{ text: "Harika" }]
      );
    } catch (err: any) {
      Alert.alert("Puantaj Hatası", err?.message || "Giriş işlemi tamamlanamadı.");
    }
  };

  // ADIM 2: Çıkış (Check-out) Tetikleyicisi
  // Location.stopLocationUpdatesAsync('BACKGROUND_LOCATION_TASK') ile takibi tamamen durdur.
  const handleCheckOutPress = async () => {
    Alert.alert(
      "🛑 Şantiyeden Çıkış Yap",
      "Mesaiyi sonlandırmak ve arka plan GPS konum takibini tamamen durdurmak istiyor musunuz?",
      [
        { text: "Vazgeç", style: "cancel" },
        {
          text: "Çıkış Yap ve Takibi Kapat",
          style: "destructive",
          onPress: async () => {
            try {
              const isStarted = await Location.hasStartedLocationUpdatesAsync(BACKGROUND_LOCATION_TASK);
              if (isStarted) {
                await Location.stopLocationUpdatesAsync(BACKGROUND_LOCATION_TASK);
                console.log("[Attendance] BACKGROUND_LOCATION_TASK durduruldu.");
              }
              await stopAttendanceLocationTracking();

              setIsCheckedIn(false);
              setIsTrackingActive(false);
              setCheckInTime(null);

              if (Platform.OS !== "web") {
                Vibration.vibrate(100);
              }

              setStatusMessage(
                "🛑 Şantiye çıkışı yapıldı. Arka plan GPS takibi tamamen durduruldu."
              );
              setTimeout(() => setStatusMessage(null), 5000);
            } catch (err: any) {
              console.error("[Attendance] Çıkış durdurma hatası:", err);
              Alert.alert("Hata", "Çıkış yapılırken konum takibi durdurulamadı: " + err.message);
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-950">
      {/* Üst Header */}
      <View className="px-6 pt-4 pb-3 bg-gray-900/90 border-b border-gray-800 flex-row items-center justify-between">
        <View>
          <Text className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-0.5">
            Mobil Turnike
          </Text>
          <Text className="text-2xl font-black text-white tracking-tight">
            Akıllı Puantaj
          </Text>
        </View>

        <View className="px-3 py-1 bg-blue-500/10 border border-blue-500/30 rounded-full flex-row items-center gap-1.5">
          <Feather name="shield" size={12} color="#60A5FA" />
          <Text className="text-blue-400 text-xs font-bold uppercase">
            NFC / GPS
          </Text>
        </View>
      </View>

      <ScrollView
        className="flex-1 px-6 pt-5"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        {/* Durum Bildirim Toast'ı */}
        {statusMessage && (
          <View className="mb-4 p-4 rounded-3xl bg-emerald-500/15 border border-emerald-500/40 shadow-lg shadow-emerald-500/20">
            <View className="flex-row items-center gap-2">
              <Feather name="check-circle" size={16} color="#34D399" />
              <Text className="text-emerald-300 text-xs font-semibold flex-1 leading-4">
                {statusMessage}
              </Text>
            </View>
          </View>
        )}

        {/* 1. Geofence & Şantiye Konum Bilgi Kartı */}
        <View className="mb-6 p-4 rounded-3xl bg-gray-900 border border-gray-800 shadow-md">
          <View className="flex-row items-center justify-between mb-2">
            <View className="flex-row items-center gap-2">
              <Feather name="map-pin" size={16} color="#3B82F6" />
              <Text className="text-white text-sm font-bold">
                {ACTIVE_SITE_GEOFENCE.name}
              </Text>
            </View>

            <TouchableOpacity
              onPress={verifyGeofenceLocation}
              disabled={isCheckingLocation}
              className="p-1.5 rounded-lg bg-gray-800"
            >
              <Feather
                name="refresh-cw"
                size={14}
                color={isCheckingLocation ? "#60A5FA" : "#9CA3AF"}
              />
            </TouchableOpacity>
          </View>

          <View className="p-3 bg-gray-950/80 rounded-2xl border border-gray-800/80 flex-row items-center justify-between">
            <View>
              <Text className="text-gray-400 text-[11px]">Geofence Durumu:</Text>
              <Text
                className={`text-xs font-bold mt-0.5 ${
                  isInGeofence ? "text-emerald-400" : "text-amber-400"
                }`}
              >
                {isInGeofence
                  ? "✅ Şantiye Sınırları İçinde"
                  : "⚠️ Şantiye Sınırları Dışında"}
              </Text>
            </View>

            <View className="items-end">
              <Text className="text-gray-400 text-[11px]">Mesafe:</Text>
              <Text className="text-white text-xs font-mono font-bold mt-0.5">
                {currentDistance !== null ? `${currentDistance} m` : "Ölçülüyor..."}
              </Text>
            </View>
          </View>
        </View>

        {/* ============================================================ */}
        {/* ADIM 3: DEVASA ANİMASYONLU DAİRESEL "GİRİŞ YAP" BUTONU        */}
        {/* ============================================================ */}
        <View className="items-center justify-center my-6">
          <Animated.View
            style={{
              transform: [{ scale: isCheckedIn ? 1 : pulseAnim }],
            }}
            className="items-center justify-center"
          >
            <TouchableOpacity
              onPress={handleCheckInPress}
              disabled={isCheckingLocation || isCheckedIn}
              activeOpacity={0.88}
              style={[
                styles.giantCircleBtn,
                isCheckedIn ? styles.giantCircleBtnSuccess : styles.giantCircleBtnActive,
              ]}
            >
              {/* İç Halka */}
              <View
                style={[
                  styles.giantInnerRing,
                  isCheckedIn && { borderColor: "rgba(16, 185, 129, 0.4)" },
                ]}
              >
                {isCheckingLocation ? (
                  <ActivityIndicator size="large" color="#FFFFFF" />
                ) : isCheckedIn ? (
                  <>
                    <Feather name="check" size={54} color="#FFFFFF" />
                    <Text className="text-white text-xl font-black mt-2 tracking-tight">
                      GİRİŞ YAPILDI
                    </Text>
                    <Text className="text-emerald-100 text-xs font-mono font-bold mt-1">
                      {checkInTime}
                    </Text>
                  </>
                ) : (
                  <>
                    <MaterialCommunityIcons
                      name="nfc"
                      size={58}
                      color="#FFFFFF"
                    />
                    <Text className="text-white text-2xl font-black mt-1 tracking-tight">
                      GİRİŞ YAP
                    </Text>
                    <Text className="text-blue-100 text-[11px] font-semibold mt-1">
                      NFC & GPS Turnike
                    </Text>
                  </>
                )}
              </View>
            </TouchableOpacity>
          </Animated.View>

          <Text className="text-gray-400 text-xs text-center mt-6 px-6">
            {isCheckedIn
              ? "Bugünkü şantiye mesainiz kayıt altında. Arka plan GPS görevi aktiftir."
              : "Butona basınız, GPS doğrulandıktan sonra baretinizi veya personel kartınızı yaklaştırınız."}
          </Text>
        </View>

        {/* Canlı İSG Arka Plan Takip Durumu & Çıkış Yap Butonu */}
        {isCheckedIn ? (
          <View className="mb-6 p-4 rounded-3xl bg-blue-950/70 border border-blue-500/40 shadow-lg">
            <View className="flex-row items-center justify-between mb-2">
              <View className="flex-row items-center gap-2">
                <View className="w-2.5 h-2.5 rounded-full bg-blue-400" />
                <Text className="text-white text-xs font-bold uppercase tracking-wider">
                  Canlı İSG Arka Plan Takibi Aktif
                </Text>
              </View>
              <View className="px-2 py-0.5 rounded-full bg-blue-500/20 border border-blue-400/30">
                <Text className="text-[10px] text-blue-300 font-bold">10m / 15s</Text>
              </View>
            </View>
            <Text className="text-blue-200 text-xs leading-4 mb-3">
              Uygulama kapalı olsa dahi şantiye alanındaki iş güvenliğiniz için GPS koordinatları merkeze (/api/location/live-update) aktarılıyor.
            </Text>

            {/* ADIM 2: Çıkış (Check-out) Butonu */}
            <TouchableOpacity
              onPress={handleCheckOutPress}
              activeOpacity={0.85}
              className="w-full py-3.5 px-4 rounded-2xl bg-red-600 border border-red-500 flex-row items-center justify-center gap-2 shadow-md"
            >
              <Feather name="log-out" size={16} color="#FFFFFF" />
              <Text className="text-white text-xs font-black tracking-wide">
                🛑 Şantiyeden Çıkış Yap (Mesaiyi Bitir & Takibi Durdur)
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          /* Alternatif: QR Yaka Kartı Butonu */
          <View className="mt-2 mb-6">
            <TouchableOpacity
              onPress={() => setShowQRScanner(true)}
              activeOpacity={0.8}
              className="w-full py-3.5 px-4 rounded-2xl bg-gray-900 border border-gray-800 flex-row items-center justify-center gap-2 shadow-sm"
            >
              <Ionicons name="qr-code-outline" size={18} color="#60A5FA" />
              <Text className="text-blue-400 text-xs font-bold">
                📷 QR Yaka Kartı ile Giriş Yap (Kamera)
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Puantaj Özet Kartları */}
        <View className="bg-gray-900/90 rounded-3xl p-5 border border-gray-800">
          <Text className="text-white text-sm font-bold mb-3">
            Giriş & Kart Bilgileri
          </Text>

          <View className="space-y-2 gap-2">
            <View className="p-3 bg-gray-950/70 rounded-2xl border border-gray-800/60 flex-row justify-between items-center">
              <Text className="text-gray-400 text-xs">Personel:</Text>
              <Text className="text-white text-xs font-bold">
                {user?.name} ({role})
              </Text>
            </View>

            <View className="p-3 bg-gray-950/70 rounded-2xl border border-gray-800/60 flex-row justify-between items-center">
              <Text className="text-gray-400 text-xs">Kart UID:</Text>
              <Text className="text-blue-400 font-mono text-xs font-semibold">
                {lastCardUid || "Okuma bekleniyor"}
              </Text>
            </View>

            <View className="p-3 bg-gray-950/70 rounded-2xl border border-gray-800/60 flex-row justify-between items-center">
              <Text className="text-gray-400 text-xs">NFC Donanımı:</Text>
              <Text
                className={`text-xs font-bold ${
                  isNfcSupported ? "text-emerald-400" : "text-gray-400"
                }`}
              >
                {isNfcSupported ? "Aktif & Uyumlu" : "Simülasyon / QR"}
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* ADIM 2: NFC Tarama Bekleme Modali (Bottom Sheet hissi) */}
      <Modal
        visible={showNFCModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => {
          cancelScan();
          setShowNFCModal(false);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.nfcSheet}>
            <View style={styles.sheetHandle} />

            <View className="items-center py-6 px-4">
              <View style={styles.nfcPulseCircle}>
                <MaterialCommunityIcons
                  name="nfc"
                  size={64}
                  color="#3B82F6"
                />
              </View>

              <Text className="text-white text-xl font-black mt-4 tracking-tight">
                Kartı / Bareti Yaklaştırın
              </Text>
              <Text className="text-gray-400 text-xs text-center mt-2 px-4 leading-4">
                NFC Personel yaka kartınızı veya baret çipini telefonun arka
                üst kısmına temas ettiriniz.
              </Text>

              <ActivityIndicator
                size="small"
                color="#3B82F6"
                style={{ marginTop: 18 }}
              />

              <TouchableOpacity
                onPress={() => {
                  cancelScan();
                  setShowNFCModal(false);
                }}
                className="mt-6 py-2.5 px-6 rounded-full bg-gray-800 border border-gray-700"
              >
                <Text className="text-gray-300 text-xs font-semibold">
                  Vazgeç
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* QR Yaka Kartı Tarayıcı Modali */}
      <Modal
        visible={showQRScanner}
        animationType="slide"
        onRequestClose={() => setShowQRScanner(false)}
      >
        <QRScanner
          onScan={handleQRScanned}
          onClose={() => setShowQRScanner(false)}
          title="Personel Yaka Kartı Tara"
          subtitle="Yaka kartı üzerindeki QR kimlik kodunu çerçevenin içine hizalayınız"
        />
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  giantCircleBtn: {
    width: 220,
    height: 220,
    borderRadius: 110,
    padding: 10,
    alignItems: "center",
    justifyContent: "center",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.45,
    shadowRadius: 20,
    elevation: 12,
  },
  giantCircleBtnActive: {
    backgroundColor: "#2563EB", // blue-600
    shadowColor: "#2563EB",
    borderWidth: 4,
    borderColor: "rgba(96, 165, 250, 0.4)",
  },
  giantCircleBtnSuccess: {
    backgroundColor: "#059669", // emerald-600
    shadowColor: "#059669",
    borderWidth: 4,
    borderColor: "rgba(52, 211, 153, 0.4)",
  },
  giantInnerRing: {
    width: "100%",
    height: "100%",
    borderRadius: 100,
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.3)",
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0, 0, 0, 0.7)",
  },
  nfcSheet: {
    backgroundColor: "#111827",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderTopWidth: 1,
    borderColor: "#374151",
    paddingBottom: 36,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    backgroundColor: "#4B5563",
    borderRadius: 2,
    alignSelf: "center",
    marginTop: 10,
  },
  nfcPulseCircle: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: "rgba(37, 99, 235, 0.15)",
    borderWidth: 2,
    borderColor: "rgba(59, 130, 246, 0.4)",
    alignItems: "center",
    justifyContent: "center",
  },
});
