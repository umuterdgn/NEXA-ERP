import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { authService, API_BASE_URL } from "../src/lib/api";
import { QRScanner } from "../src/components/scanner";
import { OfflineCamera, getOfflineUploadQueue, QueuedMediaItem } from "../src/components/media";
import { useLocationWeather, registerForPushNotificationsAsync } from "../src/hooks";

/**
 * Nexa ERP - Mobil Giriş & Saha Operasyonları Ekranı
 * Next.js Backend bağlantısı, QR Lojistik Tarayıcı, Anti-Fake GPS Hava Durumu ve Offline Medya Kuyruğu
 */
export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [rememberMe, setRememberMe] = useState(true);

  // Donanım Modalleri & Saha Araçları State'i
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [scannedCode, setScannedCode] = useState<string | null>(null);
  const [queuedItemsCount, setQueuedItemsCount] = useState<number>(0);

  // Güvenli GPS & Hava Durumu Hook'u
  const {
    isLoading: isWeatherLoading,
    error: weatherError,
    location,
    weather,
    isMocked,
    fetchLocationAndWeather,
  } = useLocationWeather();

  // Çevrimdışı kuyruk sayısını yükle
  useEffect(() => {
    loadQueueCount();
  }, []);

  const loadQueueCount = async () => {
    try {
      const queue = await getOfflineUploadQueue();
      setQueuedItemsCount(queue.length);
    } catch {
      // Hata yok sayılır
    }
  };

  // Giriş Yap fonksiyonu - Next.js /api/auth/login endpoint'ine bağlanır
  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      setErrorMessage("Lütfen e-posta ve şifrenizi eksiksiz giriniz.");
      return;
    }

    setErrorMessage(null);
    setIsLoading(true);

    try {
      console.log(`[Nexa Mobile] Giriş isteği gönderiliyor: ${API_BASE_URL}/auth/login`);
      
      const response = await authService.login({
        email: email.trim(),
        password: password,
      });

      console.log("[Nexa Mobile] Giriş başarılı:", response);

      // Cihaz push token'ını alıp backend'deki User modeline kaydet
      registerForPushNotificationsAsync(response.user).catch((err) => {
        console.warn("[Login] Push token kaydı uyarısı:", err);
      });

      // Başarılı Login işleminden sonra (tabs) grubuna yönlendir
      router.replace("/(tabs)");
    } catch (error: any) {
      console.error("[Nexa Mobile] Giriş hatası:", error);
      const serverMsg =
        error.response?.data?.message ||
        error.response?.data?.error ||
        "Giriş başarısız. Lütfen bilgilerinizi kontrol ediniz.";
      
      setErrorMessage(serverMsg);
      Alert.alert("Giriş Yapılamadı", serverMsg);
    } finally {
      setIsLoading(false);
    }
  };

  // Güvenli GPS & Hava Durumu Testi
  const handleCheckLocationWeather = async () => {
    try {
      const res = await fetchLocationAndWeather();
      if (res) {
        Alert.alert(
          "🛡️ Güvenli Konum & Hava Durumu",
          `✅ Konum Doğrulandı (Spoof Yok)\n📍 Lat: ${res.location.latitude.toFixed(4)}, Lng: ${res.location.longitude.toFixed(4)}\n⛅ Durum: ${res.weather.description}\n🌡️ Sıcaklık: ${res.weather.temperature}°C\n💨 Rüzgar: ${res.weather.windSpeed} km/h`
        );
      }
    } catch (err: any) {
      Alert.alert("GPS / Hava Durumu Uyarısı", err.message || "Konum alınamadı.");
    }
  };

  // QR Tarama Tamamlandığında
  const handleQRScanned = (data: string, type?: string) => {
    setScannedCode(data);
    Alert.alert(
      "📦 QR / Barkod Okundu",
      `Format: ${type || "Bilinmiyor"}\nVeri: ${data}\n\nİrsaliye veya malzeme kabul kaydına işlenebilir.`
    );
  };

  // Offline Fotoğraf Kuyruğa Alındığında
  const handlePhotoQueued = (item: QueuedMediaItem) => {
    loadQueueCount();
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-950">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
          className="flex-1 px-6"
        >
          <View className="flex-1 justify-center py-6">
            {/* Üst Logo ve Başlık Alanı */}
            <View className="items-center mb-6">
              <View className="w-14 h-14 rounded-2xl bg-emerald-500 items-center justify-center shadow-lg shadow-emerald-500/30 mb-3 border border-emerald-400/40">
                <Text className="text-white text-2xl font-black tracking-wider">NX</Text>
              </View>

              <View className="flex-row items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 mb-1.5">
                <View className="w-2 h-2 rounded-full bg-emerald-400" />
                <Text className="text-emerald-400 text-[11px] font-semibold uppercase tracking-widest">
                  Enterprise ERP Mobile
                </Text>
              </View>

              <Text className="text-2xl font-bold text-white text-center tracking-tight">
                Nexa ERP Mobil
              </Text>
              <Text className="text-slate-400 text-xs text-center mt-0.5">
                Şantiye Jurnali, Lojistik ve Saha Operasyonları
              </Text>
            </View>

            {/* Saha Donanım Yetenekleri Hızlı Erişim Kartı */}
            <View className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 mb-5">
              <View className="flex-row items-center justify-between mb-3">
                <Text className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Saha Donanım Modülleri
                </Text>
                {queuedItemsCount > 0 && (
                  <View className="px-2 py-0.5 bg-amber-500/20 border border-amber-500/40 rounded-full">
                    <Text className="text-[10px] text-amber-300 font-bold">
                      Kuyrukta: {queuedItemsCount} Fotoğraf
                    </Text>
                  </View>
                )}
              </View>

              <View className="flex-row gap-2">
                {/* QR Tarayıcı Butonu */}
                <TouchableOpacity
                  onPress={() => setShowQRScanner(true)}
                  activeOpacity={0.8}
                  className="flex-1 py-2.5 px-2 bg-slate-800/80 hover:bg-slate-800 rounded-xl items-center border border-slate-700/60"
                >
                  <Text className="text-base mb-1">📦</Text>
                  <Text className="text-[11px] font-bold text-slate-200">QR / Barkod</Text>
                  <Text className="text-[9px] text-slate-400">Lojistik Tara</Text>
                </TouchableOpacity>

                {/* Güvenli GPS & Hava Durumu Butonu */}
                <TouchableOpacity
                  onPress={handleCheckLocationWeather}
                  disabled={isWeatherLoading}
                  activeOpacity={0.8}
                  className="flex-1 py-2.5 px-2 bg-slate-800/80 hover:bg-slate-800 rounded-xl items-center border border-slate-700/60"
                >
                  {isWeatherLoading ? (
                    <ActivityIndicator size="small" color="#10b981" className="my-1" />
                  ) : (
                    <Text className="text-base mb-1">⛅</Text>
                  )}
                  <Text className="text-[11px] font-bold text-slate-200">Hava & GPS</Text>
                  <Text className="text-[9px] text-emerald-400">Anti-Spoof</Text>
                </TouchableOpacity>

                {/* Offline Kamera Butonu */}
                <TouchableOpacity
                  onPress={() => setShowCamera(true)}
                  activeOpacity={0.8}
                  className="flex-1 py-2.5 px-2 bg-slate-800/80 hover:bg-slate-800 rounded-xl items-center border border-slate-700/60"
                >
                  <Text className="text-base mb-1">📷</Text>
                  <Text className="text-[11px] font-bold text-slate-200">Offline Foto</Text>
                  <Text className="text-[9px] text-slate-400">Medya Kuyruğu</Text>
                </TouchableOpacity>
              </View>

              {/* Anlık Okunan QR veya Hava Bilgisi Vurgusu */}
              {scannedCode && (
                <View className="mt-3 p-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex-row items-center justify-between">
                  <Text className="text-[11px] text-emerald-400 font-mono flex-1 mr-2" numberOfLines={1}>
                    Son Kod: {scannedCode}
                  </Text>
                  <TouchableOpacity onPress={() => setScannedCode(null)}>
                    <Text className="text-slate-400 text-xs font-bold">✕</Text>
                  </TouchableOpacity>
                </View>
              )}

              {weather && location && (
                <View className="mt-3 p-2.5 bg-slate-950/80 border border-slate-800 rounded-xl flex-row items-center justify-between">
                  <View className="flex-row items-center gap-2">
                    <View className="w-2 h-2 rounded-full bg-emerald-400" />
                    <Text className="text-[11px] text-slate-200 font-medium">
                      {weather.description} ({weather.temperature}°C)
                    </Text>
                  </View>
                  <Text className="text-[10px] text-slate-400 font-mono">
                    Rüzgar: {weather.windSpeed} km/h
                  </Text>
                </View>
              )}
            </View>

            {/* Giriş Kartı */}
            <View className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-2xl">
              <Text className="text-base font-bold text-slate-100 mb-4">
                Kullanıcı Girişi
              </Text>

              {/* Hata Bildirim Çubuğu */}
              {errorMessage && (
                <View className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 flex-row items-center gap-2">
                  <View className="w-2 h-2 rounded-full bg-rose-500" />
                  <Text className="text-rose-400 text-xs flex-1 leading-4">
                    {errorMessage}
                  </Text>
                </View>
              )}

              {/* E-posta Alanı */}
              <View className="mb-4">
                <Text className="text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider">
                  E-Posta Adresi
                </Text>
                <View className="flex-row items-center bg-slate-950/80 border border-slate-800 focus:border-emerald-500 rounded-xl px-4 py-3">
                  <TextInput
                    value={email}
                    onChangeText={setEmail}
                    placeholder="ornek@nxerp.com.tr"
                    placeholderTextColor="#64748b"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    className="flex-1 text-slate-100 text-base"
                  />
                </View>
              </View>

              {/* Şifre Alanı */}
              <View className="mb-4">
                <View className="flex-row justify-between items-center mb-1.5">
                  <Text className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                    Şifre
                  </Text>
                  <TouchableOpacity
                    onPress={() => setShowPassword(!showPassword)}
                    activeOpacity={0.7}
                  >
                    <Text className="text-xs text-emerald-400 font-medium">
                      {showPassword ? "Gizle" : "Göster"}
                    </Text>
                  </TouchableOpacity>
                </View>

                <View className="flex-row items-center bg-slate-950/80 border border-slate-800 focus:border-emerald-500 rounded-xl px-4 py-3">
                  <TextInput
                    value={password}
                    onChangeText={setPassword}
                    placeholder="••••••••"
                    placeholderTextColor="#64748b"
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    className="flex-1 text-slate-100 text-base"
                  />
                </View>
              </View>

              {/* Beni Hatırla & Şifremi Unuttum */}
              <View className="flex-row items-center justify-between mt-1 mb-5">
                <TouchableOpacity
                  onPress={() => setRememberMe(!rememberMe)}
                  className="flex-row items-center gap-2"
                  activeOpacity={0.8}
                >
                  <View
                    className={`w-4 h-4 rounded border ${
                      rememberMe
                        ? "bg-emerald-500 border-emerald-500"
                        : "bg-slate-950 border-slate-700"
                    } items-center justify-center`}
                  >
                    {rememberMe && (
                      <Text className="text-slate-950 text-[10px] font-bold">✓</Text>
                    )}
                  </View>
                  <Text className="text-slate-400 text-xs">Beni Hatırla</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() =>
                    Alert.alert(
                      "Şifre Sıfırlama",
                      "Lütfen şirket sistem yöneticiniz (Admin) ile iletişime geçiniz."
                    )
                  }
                  activeOpacity={0.7}
                >
                  <Text className="text-slate-400 text-xs">Şifremi Unuttum</Text>
                </TouchableOpacity>
              </View>

              {/* Giriş Yap Butonu */}
              <TouchableOpacity
                onPress={handleLogin}
                disabled={isLoading}
                activeOpacity={0.85}
                className={`w-full py-3.5 rounded-xl flex-row items-center justify-center shadow-lg shadow-emerald-500/25 ${
                  isLoading
                    ? "bg-emerald-700 opacity-70"
                    : "bg-emerald-500 active:bg-emerald-600"
                }`}
              >
                {isLoading ? (
                  <View className="flex-row items-center gap-2">
                    <ActivityIndicator color="#ffffff" size="small" />
                    <Text className="text-white font-semibold text-base">
                      Doğrulanıyor...
                    </Text>
                  </View>
                ) : (
                  <Text className="text-slate-950 font-bold text-base tracking-wide">
                    Giriş Yap
                  </Text>
                )}
              </TouchableOpacity>

              {/* Hızlı Demo Girişi (Sekmeleri İnceleme) */}
              <TouchableOpacity
                onPress={() => router.replace("/(tabs)")}
                activeOpacity={0.7}
                className="w-full mt-2.5 py-2.5 rounded-xl border border-slate-800 bg-slate-950/60 items-center justify-center flex-row gap-2"
              >
                <Text className="text-slate-400 text-xs font-semibold">
                  Demo Olarak Giriş Yap & Sekmelere Geç →
                </Text>
              </TouchableOpacity>
            </View>

            {/* Alt Bilgi ve Backend Durum Göstergesi */}
            <View className="items-center mt-6">
              <View className="flex-row items-center gap-2 px-3 py-1 rounded-full bg-slate-900 border border-slate-800">
                <View className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <Text className="text-slate-400 text-[11px] font-mono">
                  API: {API_BASE_URL.replace("https://", "").replace("http://", "")}
                </Text>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* QR & Barkod Tarayıcı Modali */}
      <Modal
        visible={showQRScanner}
        animationType="slide"
        onRequestClose={() => setShowQRScanner(false)}
      >
        <QRScanner
          onScan={handleQRScanned}
          onClose={() => setShowQRScanner(false)}
          title="Lojistik QR / Barkod Okuyucu"
        />
      </Modal>

      {/* Offline Kamera Modali */}
      <Modal
        visible={showCamera}
        animationType="slide"
        onRequestClose={() => setShowCamera(false)}
      >
        <OfflineCamera
          onPhotoQueued={handlePhotoQueued}
          onClose={() => setShowCamera(false)}
          title="Saha Görev Kanıtı"
          taskId="JURNAL-2026"
        />
      </Modal>
    </SafeAreaView>
  );
}
