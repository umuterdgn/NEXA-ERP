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
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as LocalAuthentication from "expo-local-authentication";
import { Ionicons } from "@expo/vector-icons";
import { setAuthSession, getAuthSession } from "../apiClient";

// Hızlı Demo Rolleri (Geliştirici ve test kolaylığı için)
const DEMO_ACCOUNTS = [
  { role: "ENGINEER", label: "Şantiye Şefi", email: "sefi@nxerp.com.tr", tenant: "nexa-franchise" },
  { role: "SUBCONTRACTOR", label: "Taşeron", email: "taseron@nxerp.com.tr", tenant: "nexa-franchise" },
  { role: "DRIVER", label: "Sürücü", email: "sofor@nxerp.com.tr", tenant: "nexa-franchise" },
  { role: "INSPECTOR", label: "Yapı Denetim", email: "denetim@nxerp.com.tr", tenant: "nexa-franchise" },
  { role: "FRANCHISE_OWNER", label: "Franchise", email: "erdgnumut20@gmail.com", tenant: "nexa-franchise" },
];

/**
 * Nexa ERP - Minimalist Apple iOS Cupertino Login Ekranı
 * Sadece Nexa Logosu, Çalışma Alanı (Tenant), E-posta, Şifre ve FaceID/TouchID Biyometrik Giriş
 */
export default function LoginScreen() {
  const router = useRouter();

  const [tenant, setTenant] = useState("nexa-franchise");
  const [email, setEmail] = useState("erdgnumut20@gmail.com");
  const [password, setPassword] = useState("Password123!");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState("FRANCHISE_OWNER");

  // Sayfa açıldığında kayıtlı oturum kontrolü
  useEffect(() => {
    (async () => {
      try {
        const session = await getAuthSession();
        if (session.tenantId) {
          setTenant(session.tenantId);
        }
        if (session.user?.email) {
          setEmail(session.user.email);
        }
        if (session.user?.role) {
          setSelectedRole(session.user.role);
        }
      } catch (err) {
        console.warn("[LoginScreen] Oturum okuma uyarısı:", err);
      }
    })();
  }, []);

  // Standart Giriş
  const handleLogin = async () => {
    if (!tenant.trim()) {
      Alert.alert("Eksik Bilgi", "Lütfen çalışma alanı (tenant) kodunu girin.");
      return;
    }
    if (!email.trim() || !password.trim()) {
      Alert.alert("Eksik Bilgi", "Lütfen e-posta ve şifrenizi girin.");
      return;
    }

    try {
      setIsLoading(true);

      const fakeToken = `nexa_jwt_${Date.now()}`;
      const userPayload = {
        id: "usr-" + Date.now().toString().slice(-5),
        email: email.trim(),
        name: email.split("@")[0].toUpperCase(),
        role: selectedRole,
        tenantId: tenant.trim(),
      };

      await setAuthSession(fakeToken, tenant.trim(), userPayload);
      router.replace("/(tabs)");
    } catch (err: any) {
      Alert.alert("Giriş Başarısız", err.message || "Giriş yapılırken bir hata oluştu.");
    } finally {
      setIsLoading(false);
    }
  };

  // ADIM 1: FaceID / TouchID Biyometrik Giriş
  const handleBiometricAuth = useCallback(async () => {
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();

      if (!hasHardware || !isEnrolled) {
        Alert.alert(
          "Biyometrik Giriş Kullanılamıyor",
          "Cihazınızda Face ID / Touch ID donanımı bulunamadı veya kayıtlı biyometrik veri yok."
        );
        return;
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: "Nexa ERP Güvenli Giriş",
        fallbackLabel: "Şifre ile Devam Et",
        cancelLabel: "Vazgeç",
        disableDeviceFallback: false,
      });

      if (result.success) {
        const fakeToken = `nexa_bio_token_${Date.now()}`;
        const userPayload = {
          id: "usr-bio",
          email: email.trim() || "erdgnumut20@gmail.com",
          name: "Umut Erdoğan",
          role: selectedRole,
          tenantId: tenant.trim() || "nexa-franchise",
        };

        await setAuthSession(fakeToken, tenant.trim() || "nexa-franchise", userPayload);
        router.replace("/(tabs)");
      }
    } catch (err: any) {
      Alert.alert("Biyometrik Hata", err.message || "Biyometrik kimlik doğrulama yapılamadı.");
    }
  }, [email, tenant, selectedRole, router]);

  // Demo Rol Değiştirici
  const handleSelectDemo = (item: (typeof DEMO_ACCOUNTS)[0]) => {
    setEmail(item.email);
    setTenant(item.tenant);
    setSelectedRole(item.role);
  };

  return (
    <SafeAreaView style={styles.safeContainer} edges={["top", "bottom"]}>
      <StatusBar style="light" />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Nexa Logo & Başlık */}
          <View style={styles.logoSection}>
            <View style={styles.logoBadge}>
              <Ionicons name="cube" size={38} color="#0A7AFF" />
            </View>
            <Text style={styles.brandTitle}>NEXA ERP</Text>
            <Text style={styles.brandSubtitle}>Kurumsal Saha & İnşaat Ekosistemi</Text>
          </View>

          {/* Form Alanları */}
          <View style={styles.formContainer}>
            {/* 1. Çalışma Alanı (Tenant) */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Çalışma Alanı (Tenant)</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="business-outline" size={19} color="#8E8E93" style={styles.inputIcon} />
                <TextInput
                  style={styles.textInput}
                  value={tenant}
                  onChangeText={setTenant}
                  placeholder="örn: nexa-franchise"
                  placeholderTextColor="#636366"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
            </View>

            {/* 2. E-posta */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>E-posta</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="mail-outline" size={19} color="#8E8E93" style={styles.inputIcon} />
                <TextInput
                  style={styles.textInput}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="ad.soyad@nxerp.com.tr"
                  placeholderTextColor="#636366"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
            </View>

            {/* 3. Şifre */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Şifre</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="lock-closed-outline" size={19} color="#8E8E93" style={styles.inputIcon} />
                <TextInput
                  style={[styles.textInput, { flex: 1 }]}
                  value={password}
                  onChangeText={setPassword}
                  placeholder="••••••••"
                  placeholderTextColor="#636366"
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                />
                <TouchableOpacity
                  onPress={() => setShowPassword((prev) => !prev)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Ionicons
                    name={showPassword ? "eye-off-outline" : "eye-outline"}
                    size={20}
                    color="#8E8E93"
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Giriş Yap Butonu */}
            <TouchableOpacity
              style={styles.loginButton}
              onPress={handleLogin}
              disabled={isLoading}
              activeOpacity={0.85}
            >
              {isLoading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.loginButtonText}>Giriş Yap</Text>
              )}
            </TouchableOpacity>

            {/* Biyometrik Giriş (Face ID / Touch ID) */}
            <TouchableOpacity
              style={styles.biometricButton}
              onPress={handleBiometricAuth}
              activeOpacity={0.7}
            >
              <Ionicons name="scan-outline" size={22} color="#0A7AFF" />
              <Text style={styles.biometricButtonText}>Biyometrik Giriş (Face ID / Touch ID)</Text>
            </TouchableOpacity>
          </View>

          {/* Hızlı Rol Seçimi (Test Kolaylığı) */}
          <View style={styles.demoSection}>
            <Text style={styles.demoTitle}>HIZLI TEST ROLLERİ</Text>
            <View style={styles.demoPillsRow}>
              {DEMO_ACCOUNTS.map((item) => {
                const isActive = selectedRole === item.role;
                return (
                  <TouchableOpacity
                    key={item.role}
                    style={[styles.demoPill, isActive && styles.demoPillActive]}
                    onPress={() => handleSelectDemo(item)}
                  >
                    <Text
                      style={[styles.demoPillText, isActive && styles.demoPillTextActive]}
                    >
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: "#0A0F1C",
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  logoSection: {
    alignItems: "center",
    marginBottom: 36,
  },
  logoBadge: {
    width: 72,
    height: 72,
    borderRadius: 22,
    backgroundColor: "rgba(10, 122, 255, 0.12)",
    borderWidth: 1.5,
    borderColor: "rgba(10, 122, 255, 0.35)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  brandTitle: {
    fontSize: 26,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: 1.2,
  },
  brandSubtitle: {
    fontSize: 13,
    color: "#8E8E93",
    marginTop: 4,
    fontWeight: "500",
  },
  formContainer: {
    backgroundColor: "rgba(255, 255, 255, 0.04)",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    padding: 22,
    gap: 16,
  },
  inputGroup: {
    gap: 6,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#8E8E93",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.06)",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    paddingHorizontal: 12,
    height: 48,
  },
  inputIcon: {
    marginRight: 10,
  },
  textInput: {
    flex: 1,
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "500",
  },
  loginButton: {
    backgroundColor: "#0A7AFF",
    borderRadius: 14,
    height: 50,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
    shadowColor: "#0A7AFF",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 4,
  },
  loginButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  biometricButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "rgba(10, 122, 255, 0.08)",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(10, 122, 255, 0.25)",
    height: 48,
  },
  biometricButtonText: {
    color: "#0A7AFF",
    fontSize: 14,
    fontWeight: "600",
  },
  demoSection: {
    marginTop: 32,
    alignItems: "center",
  },
  demoTitle: {
    fontSize: 10,
    fontWeight: "700",
    color: "#636366",
    letterSpacing: 1,
    marginBottom: 10,
  },
  demoPillsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 8,
  },
  demoPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: "rgba(255, 255, 255, 0.04)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
  },
  demoPillActive: {
    backgroundColor: "rgba(10, 122, 255, 0.2)",
    borderColor: "#0A7AFF",
  },
  demoPillText: {
    fontSize: 11,
    color: "#8E8E93",
    fontWeight: "600",
  },
  demoPillTextActive: {
    color: "#0A7AFF",
    fontWeight: "700",
  },
});
