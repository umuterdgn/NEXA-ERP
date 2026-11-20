/**
 * © 2026 NXA Software. All rights reserved.
 * Nexa ERP Mobil - Gerçek Kurumsal Giriş & Biyometrik Kilit Ekranı
 * Yalnızca canlı POST /api/mobile/auth/login üzerinden kimlik doğrulaması yapar.
 */

import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useAuth } from "../src/context/AuthContext";
import { API_BASE_URL, extractErrorMessage } from "../src/services/apiClient";
import { iosColors } from "../src/theme/iosTheme";

export default function LoginScreen() {
  const router = useRouter();
  const {
    isBootstrapping,
    isAuthenticated,
    hasSavedSession,
    biometricAvailable,
    biometricEnabled,
    isOnline,
    login,
    unlockWithBiometrics,
  } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!isBootstrapping && isAuthenticated) {
      router.replace("/(tabs)");
    }
  }, [isBootstrapping, isAuthenticated, router]);

  const handleLogin = async () => {
    setErrorMsg(null);
    if (!email.trim() || !password) {
      setErrorMsg("Lütfen kurumsal e-posta / kullanıcı adı ve şifrenizi girin.");
      return;
    }

    try {
      setSubmitting(true);
      await login(email.trim(), password);
    } catch (err: any) {
      setErrorMsg(
        extractErrorMessage(
          err,
          "Giriş başarısız. Lütfen bilgilerinizi kontrol edin."
        )
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleBiometric = async () => {
    setErrorMsg(null);
    try {
      setSubmitting(true);
      await unlockWithBiometrics();
    } catch (err: any) {
      setErrorMsg(extractErrorMessage(err, "Biyometrik doğrulama tamamlanamadı."));
    } finally {
      setSubmitting(false);
    }
  };

  if (isBootstrapping) {
    return (
      <SafeAreaView style={styles.bootContainer}>
        <StatusBar style="light" />
        <View style={styles.logoBadge}>
          <Ionicons name="cube" size={38} color={iosColors.systemBlue} />
        </View>
        <Text style={styles.brandTitle}>NEXA ERP</Text>
        <ActivityIndicator
          size="small"
          color={iosColors.systemBlue}
          style={{ marginTop: 18 }}
        />
        <Text style={styles.bootSub}>Oturum ve RBAC yetkileri doğrulanıyor...</Text>
      </SafeAreaView>
    );
  }

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
          {/* Logo ve Başlık */}
          <View style={styles.logoSection}>
            <View style={styles.logoBadge}>
              <Ionicons name="cube" size={38} color={iosColors.systemBlue} />
            </View>
            <Text style={styles.brandTitle}>NEXA ERP</Text>
            <Text style={styles.brandSubtitle}>
              Müteahhit • Yapı Denetim • Franchise Saha Terminali
            </Text>

            <View
              style={[
                styles.statusPill,
                !isOnline && {
                  backgroundColor: "rgba(255, 59, 48, 0.14)",
                  borderColor: "rgba(255, 59, 48, 0.35)",
                },
              ]}
            >
              <View
                style={[
                  styles.statusDot,
                  { backgroundColor: isOnline ? "#34C759" : "#FF453A" },
                ]}
              />
              <Text style={styles.statusPillText}>
                {isOnline ? `Sunucu Aktif • ${API_BASE_URL}` : "Çevrimdışı (İnternet Bekleniyor)"}
              </Text>
            </View>
          </View>

          {/* Giriş Form Kartı */}
          <View style={styles.formContainer}>
            {errorMsg && (
              <View style={styles.errorBox}>
                <Ionicons name="alert-circle" size={18} color="#FF453A" />
                <Text style={styles.errorText}>{errorMsg}</Text>
              </View>
            )}

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Kurumsal E-posta veya Kullanıcı Adı</Text>
              <View style={styles.inputWrapper}>
                <Ionicons
                  name="mail-outline"
                  size={19}
                  color="#8E8E93"
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.textInput}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="ornek@nxerp.com.tr"
                  placeholderTextColor="#636366"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!submitting}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Şifre</Text>
              <View style={styles.inputWrapper}>
                <Ionicons
                  name="lock-closed-outline"
                  size={19}
                  color="#8E8E93"
                  style={styles.inputIcon}
                />
                <TextInput
                  style={[styles.textInput, { flex: 1 }]}
                  value={password}
                  onChangeText={setPassword}
                  placeholder="••••••••"
                  placeholderTextColor="#636366"
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  editable={!submitting}
                  onSubmitEditing={handleLogin}
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

            <TouchableOpacity
              style={[styles.loginButton, submitting && { opacity: 0.7 }]}
              onPress={handleLogin}
              disabled={submitting}
              activeOpacity={0.85}
            >
              {submitting ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons name="log-in-outline" size={20} color="#FFFFFF" />
                  <Text style={styles.loginButtonText}>Güvenli Giriş Yap</Text>
                </>
              )}
            </TouchableOpacity>

            {biometricAvailable && biometricEnabled && hasSavedSession && (
              <TouchableOpacity
                style={styles.biometricButton}
                onPress={handleBiometric}
                disabled={submitting}
                activeOpacity={0.75}
              >
                <Ionicons name="finger-print" size={21} color={iosColors.systemBlue} />
                <Text style={styles.biometricButtonText}>
                  Biyometrik Kilit Aç (Face ID / Parmak İzi)
                </Text>
              </TouchableOpacity>
            )}
          </View>

          <Text style={styles.footerInfo}>
            İşletme tipi, rol yetkileri ve atanmış şantiyeler sunucu tarafından otomatik yüklenir.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: iosColors.background,
  },
  bootContainer: {
    flex: 1,
    backgroundColor: iosColors.background,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  bootSub: {
    fontSize: 12,
    color: iosColors.labelMuted,
    marginTop: 10,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: 22,
    paddingVertical: 32,
  },
  logoSection: {
    alignItems: "center",
    marginBottom: 28,
  },
  logoBadge: {
    width: 72,
    height: 72,
    borderRadius: 22,
    backgroundColor: "rgba(10, 122, 255, 0.14)",
    borderWidth: 1.5,
    borderColor: "rgba(10, 122, 255, 0.38)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  brandTitle: {
    fontSize: 27,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: 1.2,
  },
  brandSubtitle: {
    fontSize: 12,
    color: iosColors.labelMuted,
    marginTop: 4,
    fontWeight: "600",
    textAlign: "center",
  },
  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 14,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 16,
    backgroundColor: "rgba(52, 199, 89, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(52, 199, 89, 0.25)",
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  statusPillText: {
    fontSize: 11,
    color: "#D1D5DB",
    fontWeight: "600",
  },
  formContainer: {
    backgroundColor: iosColors.glassCard,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: iosColors.glassBorderLight,
    padding: 20,
    gap: 16,
  },
  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(255, 59, 48, 0.14)",
    borderWidth: 1,
    borderColor: "rgba(255, 59, 48, 0.38)",
    borderRadius: 12,
    padding: 12,
  },
  errorText: {
    flex: 1,
    color: "#FF6961",
    fontSize: 12,
    fontWeight: "600",
  },
  inputGroup: {
    gap: 6,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: iosColors.labelMuted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: iosColors.glassBorderLight,
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
    backgroundColor: iosColors.systemBlue,
    borderRadius: 14,
    height: 50,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 6,
  },
  loginButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "800",
  },
  biometricButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "rgba(10, 122, 255, 0.1)",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(10, 122, 255, 0.3)",
    height: 46,
  },
  biometricButtonText: {
    color: "#58A6FF",
    fontSize: 13,
    fontWeight: "700",
  },
  footerInfo: {
    marginTop: 22,
    textAlign: "center",
    fontSize: 11,
    color: "#636366",
    lineHeight: 16,
  },
});
