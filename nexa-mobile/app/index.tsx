import React, { useState, useEffect, useCallback } from "react";
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
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import * as LocalAuthentication from "expo-local-authentication";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";

import { authService, setAuthToken, API_BASE_URL } from "../src/lib/api";
import { QRScanner } from "../src/components/scanner";
import { OfflineCamera, getOfflineUploadQueue, QueuedMediaItem } from "../src/components/media";
import { useLocationWeather, registerForPushNotificationsAsync } from "../src/hooks";

const AUTH_TOKEN_KEY = "@nexa_auth_token";
const AUTH_USER_KEY = "@nexa_auth_user";

// Hızlı Demo Rolleri
const DEMO_ACCOUNTS = [
  {
    roleName: "Şantiye Şefi",
    email: "sefi@nxerp.com.tr",
    password: "Password123!",
    badge: "ENGINEER",
  },
  {
    roleName: "İSG Uzmanı",
    email: "isg@nxerp.com.tr",
    password: "Password123!",
    badge: "ISG",
  },
  {
    roleName: "Yapı Denetim",
    email: "denetim@nxerp.com.tr",
    password: "Password123!",
    badge: "INSPECTOR",
  },
  {
    roleName: "Lojistik Şoför",
    email: "sofor@nxerp.com.tr",
    password: "Password123!",
    badge: "DRIVER",
  },
];

/**
 * Nexa ERP - Apple iOS (Cupertino) Frosted Glass & Biometrik (Face ID) Login Ekranı
 */
export default function LoginScreen() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [rememberMe, setRememberMe] = useState(true);

  // Biyometrik Donanım Durumu
  const [hasBiometricHardware, setHasBiometricHardware] = useState(false);
  const [isBiometricEnrolled, setIsBiometricEnrolled] = useState(false);
  const [biometricTypeLabel, setBiometricTypeLabel] = useState<string>("Face ID");

  // Donanım Modalleri & Saha Araçları State'i
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [scannedCode, setScannedCode] = useState<string | null>(null);
  const [queuedItemsCount, setQueuedItemsCount] = useState<number>(0);

  // Güvenli GPS & Hava Durumu Hook'u
  const {
    isLoading: isWeatherLoading,
    location,
    weather,
    fetchLocationAndWeather,
  } = useLocationWeather();

  // Biometrik Kimlik Doğrulama Fonksiyonu
  const executeBiometricAuth = useCallback(
    async (isAutoPrompt = false) => {
      try {
        setIsAuthenticating(true);
        setErrorMessage(null);

        const hardwareCheck = await LocalAuthentication.hasHardwareAsync();
        const enrolledCheck = await LocalAuthentication.isEnrolledAsync();

        if (!hardwareCheck || !enrolledCheck) {
          if (!isAutoPrompt) {
            Alert.alert(
              "Biyometrik Giriş Kullanılamıyor",
              "Cihazınızda Face ID / Touch ID donanımı bulunamadı veya biyometrik veri kaydedilmemiş."
            );
          }
          return;
        }

        const result = await LocalAuthentication.authenticateAsync({
          promptMessage: "Nexa ERP'ye Giriş Yap",
          fallbackLabel: "Şifre ile Giriş Yap",
          cancelLabel: "Vazgeç",
          disableDeviceFallback: false,
        });

        if (result.success) {
          console.log("[Nexa Mobile] Biometrik doğrulama başarılı.");

          // Mevcut token'ı al veya demo oturum token'ı yükle
          const storedToken =
            (await AsyncStorage.getItem(AUTH_TOKEN_KEY)) || "nexa_biometric_bearer_token";
          setAuthToken(storedToken);

          // Şifre sormadan doğrudan sekmelere yönlendir
          router.replace("/(tabs)");
        } else {
          console.log("[Nexa Mobile] Biyometrik kimlik doğrulama tamamlanamadı:", result);
          if (!isAutoPrompt && result.error !== "user_cancel") {
            setErrorMessage("Biyometrik doğrulama başarısız oldu.");
          }
        }
      } catch (err: any) {
        console.error("[Nexa Mobile] Biyometrik hata:", err);
        if (!isAutoPrompt) {
          Alert.alert("Biyometrik Hata", err.message || "Kimlik doğrulama gerçekleştirilemedi.");
        }
      } finally {
        setIsAuthenticating(false);
      }
    },
    [router]
  );

  /**
   * ADIM 3: Sayfa yüklendiğinde (useEffect), AsyncStorage'da daha önce giriş yapmış
   * bir kullanıcı token'ı varsa LocalAuthentication.authenticateAsync() fonksiyonunu tetikle.
   */
  useEffect(() => {
    let isMounted = true;

    async function checkAuthAndBiometrics() {
      try {
        // Çevrimdışı medya kuyruğunu yükle
        const queue = await getOfflineUploadQueue();
        if (isMounted) {
          setQueuedItemsCount(queue.length);
        }

        // Biyometrik donanım ve kayıt kontrolü
        const hasHardware = await LocalAuthentication.hasHardwareAsync();
        const isEnrolled = await LocalAuthentication.isEnrolledAsync();

        if (isMounted) {
          setHasBiometricHardware(hasHardware);
          setIsBiometricEnrolled(isEnrolled);
        }

        if (hasHardware) {
          const supported = await LocalAuthentication.supportedAuthenticationTypesAsync();
          if (
            supported.includes(
              LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION
            )
          ) {
            if (isMounted) setBiometricTypeLabel("Face ID");
          } else if (
            supported.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)
          ) {
            if (isMounted) setBiometricTypeLabel("Touch ID");
          } else {
            if (isMounted) setBiometricTypeLabel("Biyometrik");
          }
        }

        // AsyncStorage'da kayıtlı oturum token'ı veya kullanıcı var mı?
        const storedToken = await AsyncStorage.getItem(AUTH_TOKEN_KEY);
        const storedUser = await AsyncStorage.getItem(AUTH_USER_KEY);

        if ((storedToken || storedUser) && hasHardware && isEnrolled) {
          console.log("[Nexa Mobile] Kayıtlı oturum tespit edildi, Face ID tetikleniyor...");
          // iOS ve Android'de ekran çiziminin tamamlanması için kısa bir gecikme
          setTimeout(() => {
            if (isMounted) {
              executeBiometricAuth(true);
            }
          }, 350);
        }
      } catch (err) {
        console.warn("[Nexa Mobile] İlk yükleme kontrol hatası:", err);
      }
    }

    checkAuthAndBiometrics();

    return () => {
      isMounted = false;
    };
  }, [executeBiometricAuth]);

  // Standart E-posta ve Şifre ile Giriş Yap
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

      // Başarılı girişte Token ve Kullanıcıyı AsyncStorage'a kaydet (Biyometrik giriş için)
      if (response.token) {
        await AsyncStorage.setItem(AUTH_TOKEN_KEY, response.token);
      }
      if (response.user) {
        await AsyncStorage.setItem(AUTH_USER_KEY, JSON.stringify(response.user));
        // Push notification token kaydını arka planda tetikle
        registerForPushNotificationsAsync(response.user).catch((err) => {
          console.warn("[Login] Push token kaydı uyarısı:", err);
        });
      }

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

  // Demo Hesabı Hızlı Doldur ve Giriş Yap
  const handleSelectDemoAccount = async (account: (typeof DEMO_ACCOUNTS)[0]) => {
    setEmail(account.email);
    setPassword(account.password);
    setErrorMessage(null);

    // Mock oturum token'ı kaydet (Böylece sonraki açılışta Face ID otomatik tetiklenir)
    await AsyncStorage.setItem(AUTH_TOKEN_KEY, `token_${account.badge.toLowerCase()}_demo`);
    await AsyncStorage.setItem(
      AUTH_USER_KEY,
      JSON.stringify({
        id: `usr_${account.badge.toLowerCase()}`,
        name: account.roleName,
        email: account.email,
        role: account.badge,
        tenantName: "Nexa İnşaat A.Ş.",
      })
    );
  };

  // Güvenli GPS & Hava Durumu
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

  const handleQRScanned = (data: string, type?: string) => {
    setScannedCode(data);
    Alert.alert(
      "📦 QR / Barkod Okundu",
      `Format: ${type || "Bilinmiyor"}\nVeri: ${data}\n\nİrsaliye ve kabul kaydına işlenebilir.`
    );
  };

  const handlePhotoQueued = (_item: QueuedMediaItem) => {
    getOfflineUploadQueue().then((q) => setQueuedItemsCount(q.length));
  };

  return (
    <View className="flex-1 bg-slate-950">
      <StatusBar style="light" />

      {/* ADIM 2: Arka plana koyu, ağırbaşlı lacivert/siyah gradient */}
      <LinearGradient
        colors={["#020617", "#070E22", "#0F1A3A", "#030712"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      {/* iOS Cupertino Frosted Glass Aydınlatma Halkaları (BlurView arkasında kırılma derinliği katar) */}
      <View
        pointerEvents="none"
        style={{
          position: "absolute",
          top: -80,
          right: -50,
          width: 300,
          height: 300,
          borderRadius: 150,
          backgroundColor: "rgba(59, 130, 246, 0.22)",
        }}
      />
      <View
        pointerEvents="none"
        style={{
          position: "absolute",
          bottom: 80,
          left: -70,
          width: 320,
          height: 320,
          borderRadius: 160,
          backgroundColor: "rgba(99, 102, 241, 0.18)",
        }}
      />
      <View
        pointerEvents="none"
        style={{
          position: "absolute",
          top: "45%",
          right: -90,
          width: 240,
          height: 240,
          borderRadius: 120,
          backgroundColor: "rgba(16, 185, 129, 0.12)",
        }}
      />

      {/* ADIM 2: Üzerine tam ekran BlurView intensity={80} tint="dark" */}
      <BlurView intensity={80} tint="dark" style={StyleSheet.absoluteFill} />

      {/* İçerik Katmanı */}
      <SafeAreaView className="flex-1">
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          className="flex-1"
        >
          <ScrollView
            contentContainerStyle={{ flexGrow: 1 }}
            keyboardShouldPersistTaps="handled"
            className="flex-1 px-6"
            showsVerticalScrollIndicator={false}
          >
            <View className="flex-1 justify-center py-6">
              {/* iOS Üst Rozet / Kapsül */}
              <View className="items-center mb-4">
                <View className="flex-row items-center gap-1.5 px-3.5 py-1 rounded-full bg-white/10 border border-white/15">
                  <View className="w-2 h-2 rounded-full bg-emerald-400" />
                  <Text className="text-white/80 text-[11px] font-semibold tracking-widest uppercase">
                    Nexa Enterprise Core
                  </Text>
                </View>
              </View>

              {/* ADIM 2 Tipografi: En üste devasa ve kalın bir Nexa ERP başlığı */}
              <View className="items-center mb-8">
                <Text className="text-5xl font-bold tracking-tight text-white text-center">
                  Nexa ERP
                </Text>
                <Text className="text-slate-300 text-sm font-medium tracking-wide text-center mt-2">
                  Akıllı Şantiye, Jurnal ve Saha Operasyonları
                </Text>
              </View>

              {/* Hata Bildirimi */}
              {errorMessage && (
                <View className="mb-5 p-3.5 rounded-2xl bg-rose-500/15 border border-rose-500/30 flex-row items-center gap-2.5">
                  <Ionicons name="alert-circle" size={18} color="#f87171" />
                  <Text className="text-rose-200 text-xs font-medium flex-1">
                    {errorMessage}
                  </Text>
                </View>
              )}

              {/* ADIM 2 Inputlar: Çerçevesiz, arka planı %15 beyaz (bg-white/15), 
                  metinleri tam beyaz, köşeleri iyice yuvarlatılmış (rounded-2xl), 
                  yüksekliği geniş (h-14) şık iOS inputları */}
              <View className="space-y-4 mb-4">
                {/* E-Posta Input */}
                <View className="h-14 bg-white/15 rounded-2xl px-4 flex-row items-center border-0">
                  <Ionicons
                    name="mail-outline"
                    size={20}
                    color="rgba(255, 255, 255, 0.7)"
                  />
                  <TextInput
                    value={email}
                    onChangeText={setEmail}
                    placeholder="ad.soyad@nxerp.com.tr"
                    placeholderTextColor="rgba(255, 255, 255, 0.45)"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    className="flex-1 ml-3 text-white text-base font-normal h-full"
                  />
                  {email.length > 0 && (
                    <TouchableOpacity onPress={() => setEmail("")} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                      <Ionicons name="close-circle" size={18} color="rgba(255, 255, 255, 0.4)" />
                    </TouchableOpacity>
                  )}
                </View>

                {/* Şifre Input */}
                <View className="h-14 mt-3 bg-white/15 rounded-2xl px-4 flex-row items-center border-0">
                  <Ionicons
                    name="lock-closed-outline"
                    size={20}
                    color="rgba(255, 255, 255, 0.7)"
                  />
                  <TextInput
                    value={password}
                    onChangeText={setPassword}
                    placeholder="••••••••"
                    placeholderTextColor="rgba(255, 255, 255, 0.45)"
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    autoCorrect={false}
                    className="flex-1 ml-3 text-white text-base font-normal h-full"
                  />
                  <TouchableOpacity
                    onPress={() => setShowPassword(!showPassword)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name={showPassword ? "eye-off-outline" : "eye-outline"}
                      size={20}
                      color="rgba(255, 255, 255, 0.7)"
                    />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Beni Hatırla & Şifremi Unuttum */}
              <View className="flex-row items-center justify-between mb-6 px-1">
                <TouchableOpacity
                  onPress={() => setRememberMe(!rememberMe)}
                  className="flex-row items-center gap-2"
                  activeOpacity={0.8}
                >
                  <View
                    className={`w-5 h-5 rounded-lg border ${
                      rememberMe
                        ? "bg-blue-600 border-blue-500"
                        : "bg-white/10 border-white/20"
                    } items-center justify-center`}
                  >
                    {rememberMe && (
                      <Ionicons name="checkmark" size={14} color="#ffffff" />
                    )}
                  </View>
                  <Text className="text-slate-300 text-xs font-medium">Beni Hatırla</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() =>
                    Alert.alert(
                      "Şifre Sıfırlama",
                      "Kurumsal hesap parolanız için Nexa ERP sistem yöneticiniz (Admin) ile iletişime geçiniz."
                    )
                  }
                  activeOpacity={0.7}
                >
                  <Text className="text-blue-400 text-xs font-semibold">
                    Şifremi Unuttum
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Giriş Butonları Grubu */}
              <View className="space-y-3">
                {/* Standart Giriş Butonu */}
                <TouchableOpacity
                  onPress={handleLogin}
                  disabled={isLoading || isAuthenticating}
                  activeOpacity={0.85}
                  className={`h-14 rounded-2xl flex-row items-center justify-center shadow-lg shadow-blue-500/25 ${
                    isLoading
                      ? "bg-blue-700 opacity-70"
                      : "bg-blue-600 active:bg-blue-700"
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
                    <View className="flex-row items-center gap-2">
                      <Text className="text-white font-semibold text-base tracking-wide">
                        Giriş Yap
                      </Text>
                      <Ionicons name="arrow-forward" size={18} color="#ffffff" />
                    </View>
                  )}
                </TouchableOpacity>

                {/* ADIM 3: Giriş butonunun altına "Face ID ile Giriş Yap" ikonlu bir buton */}
                <TouchableOpacity
                  onPress={() => executeBiometricAuth(false)}
                  disabled={isLoading || isAuthenticating}
                  activeOpacity={0.8}
                  className="h-14 mt-3 rounded-2xl bg-white/10 active:bg-white/20 border border-white/20 flex-row items-center justify-center gap-2.5 shadow-sm"
                >
                  {isAuthenticating ? (
                    <ActivityIndicator color="#60a5fa" size="small" />
                  ) : (
                    <MaterialCommunityIcons
                      name={
                        biometricTypeLabel === "Touch ID"
                          ? "fingerprint"
                          : "face-recognition"
                      }
                      size={24}
                      color="#60a5fa"
                    />
                  )}
                  <Text className="text-white font-semibold text-base tracking-wide">
                    {biometricTypeLabel} ile Giriş Yap
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Hızlı Demo Hesapları (Test ve İnceleme İçin) */}
              <View className="mt-8">
                <Text className="text-white/60 text-xs font-semibold uppercase tracking-wider text-center mb-3">
                  Hızlı Rol Seçimi (Demo)
                </Text>
                <View className="flex-row flex-wrap justify-between gap-2">
                  {DEMO_ACCOUNTS.map((acc) => (
                    <TouchableOpacity
                      key={acc.email}
                      onPress={() => handleSelectDemoAccount(acc)}
                      activeOpacity={0.75}
                      className="flex-1 min-w-[46%] py-2.5 px-3 rounded-xl bg-white/10 active:bg-white/20 border border-white/15 items-center justify-center mb-1"
                    >
                      <Text className="text-white text-xs font-semibold">
                        {acc.roleName}
                      </Text>
                      <Text className="text-slate-400 text-[10px] mt-0.5">
                        {acc.badge}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Saha Donanım Araçları & Modülleri (Kısayol Çubuğu) */}
              <View className="mt-6 pt-5 border-t border-white/10 flex-row items-center justify-around">
                {/* QR Tarayıcı Butonu */}
                <TouchableOpacity
                  onPress={() => setShowQRScanner(true)}
                  activeOpacity={0.8}
                  className="items-center px-3 py-1.5 rounded-xl active:bg-white/10"
                >
                  <Ionicons name="qr-code-outline" size={20} color="#94a3b8" />
                  <Text className="text-slate-300 text-[11px] font-medium mt-1">
                    QR Lojistik
                  </Text>
                </TouchableOpacity>

                {/* Güvenli GPS & Hava Butonu */}
                <TouchableOpacity
                  onPress={handleCheckLocationWeather}
                  disabled={isWeatherLoading}
                  activeOpacity={0.8}
                  className="items-center px-3 py-1.5 rounded-xl active:bg-white/10"
                >
                  {isWeatherLoading ? (
                    <ActivityIndicator size="small" color="#60a5fa" />
                  ) : (
                    <Ionicons name="cloudy-night-outline" size={20} color="#94a3b8" />
                  )}
                  <Text className="text-slate-300 text-[11px] font-medium mt-1">
                    Hava & GPS
                  </Text>
                </TouchableOpacity>

                {/* Offline Kamera Butonu */}
                <TouchableOpacity
                  onPress={() => setShowCamera(true)}
                  activeOpacity={0.8}
                  className="items-center px-3 py-1.5 rounded-xl active:bg-white/10 relative"
                >
                  <Ionicons name="camera-outline" size={20} color="#94a3b8" />
                  <Text className="text-slate-300 text-[11px] font-medium mt-1">
                    Kamera
                  </Text>
                  {queuedItemsCount > 0 && (
                    <View className="absolute top-0 right-1 px-1.5 py-0.5 rounded-full bg-amber-500">
                      <Text className="text-[9px] font-bold text-slate-950">
                        {queuedItemsCount}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              </View>

              {/* Okunan QR veya Hava Bilgisi Vurgusu */}
              {scannedCode && (
                <View className="mt-3 p-3 bg-blue-500/15 border border-blue-500/30 rounded-2xl flex-row items-center justify-between">
                  <Text className="text-xs text-blue-300 font-mono flex-1 mr-2" numberOfLines={1}>
                    📦 Kod: {scannedCode}
                  </Text>
                  <TouchableOpacity onPress={() => setScannedCode(null)}>
                    <Ionicons name="close" size={16} color="#94a3b8" />
                  </TouchableOpacity>
                </View>
              )}

              {weather && location && (
                <View className="mt-3 p-3 bg-white/10 border border-white/15 rounded-2xl flex-row items-center justify-between">
                  <View className="flex-row items-center gap-2">
                    <Ionicons name="sunny" size={16} color="#38bdf8" />
                    <Text className="text-xs text-slate-200 font-medium">
                      {weather.description} ({weather.temperature}°C)
                    </Text>
                  </View>
                  <Text className="text-[11px] text-slate-400 font-mono">
                    Rüzgar: {weather.windSpeed} km/h
                  </Text>
                </View>
              )}

              {/* Alt Bilgi */}
              <View className="items-center mt-6">
                <Text className="text-white/40 text-[11px] font-medium tracking-wide">
                  Nexa Core Architecture • Cupertino iOS Design
                </Text>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>

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
    </View>
  );
}
