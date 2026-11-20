/**
 * © 2026 NXA Software. All rights reserved.
 * Nexa ERP Mobil - Kullanıcı Profili, Biyometrik Kilit, Tema & Çıkış Ayarları
 */

import React from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useAuth } from "../context/AuthContext";
import { useMobileTheme, type AppTheme } from "../context/ThemeContext";
import {
  getRoleDisplayTitle,
  getTenantBusinessBadge,
} from "../config/navigationConfig";
import { GlassCard, ScreenHeader, StatusBadge } from "../components/ui/NexaUI";
import { iosColors } from "../theme/iosTheme";

export default function ProfileScreen() {
  const router = useRouter();
  const {
    user,
    tenant,
    tenantType,
    role,
    activeProject,
    locationTrackingMode,
    biometricAvailable,
    biometricEnabled,
    setBiometricEnabled,
    offlineQueueCount,
    logout,
  } = useAuth();
  const { theme, setTheme, language, setLanguage } = useMobileTheme();

  const handleLogout = () => {
    Alert.alert("Çıkış Yap", "Kurumsal oturumunuzu kapatmak istiyor musunuz?", [
      { text: "Vazgeç", style: "cancel" },
      { text: "Çıkış Yap", style: "destructive", onPress: () => logout() },
    ]);
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      <ScreenHeader
        title="Profil & Uygulama Ayarları"
        subtitle={tenant?.name || "Kurumsal Hesap"}
      />

      <ScrollView contentContainerStyle={styles.scroll}>
        <GlassCard style={styles.card}>
          <View style={styles.profileRow}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {(user?.name || "NX").slice(0, 2).toUpperCase()}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{user?.name || "Kullanıcı"}</Text>
              <Text style={styles.email}>{user?.email || "-"}</Text>
              <Text style={styles.role}>{getRoleDisplayTitle(role)}</Text>
            </View>
          </View>

          <View style={styles.badgesRow}>
            <StatusBadge status="INFO" label={getTenantBusinessBadge(tenantType)} />
            <StatusBadge
              status="ACTIVE"
              label={`GPS: ${locationTrackingMode}`}
            />
          </View>

          <Text style={styles.metaTxt}>
            Aktif Şantiye / Şube: {activeProject?.name || "Atama Bekleniyor"}
          </Text>
        </GlassCard>

        {/* Hızlı Kısayollar */}
        <GlassCard style={styles.card}>
          <Text style={styles.sectionTitle}>KİMLİK & SENKRONİZASYON</Text>
          <TouchableOpacity
            style={styles.navItem}
            onPress={() => router.push("/qr-id")}
          >
            <Ionicons name="qr-code-outline" size={20} color="#3B9EFF" />
            <Text style={styles.navItemTxt}>Dijital QR Kimlik Kartım</Text>
            <Ionicons name="chevron-forward" size={18} color="#8E8E93" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.navItem}
            onPress={() => router.push("/sync-queue")}
          >
            <Ionicons name="cloud-upload-outline" size={20} color="#FF9F0A" />
            <Text style={styles.navItemTxt}>
              Çevrimdışı Senkronizasyon Kuyruğu ({offlineQueueCount})
            </Text>
            <Ionicons name="chevron-forward" size={18} color="#8E8E93" />
          </TouchableOpacity>
        </GlassCard>

        {/* Biyometrik Güvenlik */}
        <GlassCard style={styles.card}>
          <Text style={styles.sectionTitle}>GÜVENLİK</Text>
          <View style={styles.switchRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.switchTitle}>Biyometrik Hızlı Giriş</Text>
              <Text style={styles.switchSub}>
                {biometricAvailable
                  ? "FaceID veya parmak izi ile oturum kilidini açın."
                  : "Bu cihazda biyometrik donanım algılanmadı."}
              </Text>
            </View>
            <Switch
              value={biometricEnabled}
              disabled={!biometricAvailable}
              onValueChange={setBiometricEnabled}
              trackColor={{ false: "#334155", true: "#0A7AFF" }}
              thumbColor="#FFFFFF"
            />
          </View>
        </GlassCard>

        {/* Görünüm & Dil */}
        <GlassCard style={styles.card}>
          <Text style={styles.sectionTitle}>TEMA & DİL</Text>
          <View style={styles.chipRow}>
            {(
              [
                { k: "dark", label: "Koyu Kurumsal" },
                { k: "light", label: "Açık Mod" },
                { k: "monochrome", label: "Yüksek Kontrast" },
              ] as { k: AppTheme; label: string }[]
            ).map((t) => (
              <TouchableOpacity
                key={t.k}
                style={[styles.chip, theme === t.k && styles.chipActive]}
                onPress={() => setTheme(t.k)}
              >
                <Text
                  style={[styles.chipTxt, theme === t.k && { color: "#FFFFFF" }]}
                >
                  {t.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.chipRow}>
            {(["tr", "en", "de"] as const).map((lng) => (
              <TouchableOpacity
                key={lng}
                style={[styles.chip, language === lng && styles.chipActive]}
                onPress={() => setLanguage(lng)}
              >
                <Text
                  style={[
                    styles.chipTxt,
                    language === lng && { color: "#FFFFFF" },
                  ]}
                >
                  {lng.toUpperCase()}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </GlassCard>

        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color="#FF453A" />
          <Text style={styles.logoutTxt}>Güvenli Çıkış Yap</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: iosColors.background },
  scroll: { padding: 16, paddingBottom: 120, gap: 12 },
  card: { gap: 12 },
  profileRow: { flexDirection: "row", alignItems: "center", gap: 14 },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#0A7AFF",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { color: "#FFFFFF", fontSize: 18, fontWeight: "800" },
  name: { color: "#FFFFFF", fontSize: 18, fontWeight: "800" },
  email: { color: "#98A2B3", fontSize: 12, marginTop: 2 },
  role: { color: "#3B9EFF", fontSize: 13, fontWeight: "700", marginTop: 3 },
  badgesRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  metaTxt: { color: "#8E8E93", fontSize: 12 },
  sectionTitle: {
    color: "#8E8E93",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.7,
  },
  navItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 8,
  },
  navItemTxt: { flex: 1, color: "#FFFFFF", fontSize: 14, fontWeight: "600" },
  switchRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  switchTitle: { color: "#FFFFFF", fontSize: 14, fontWeight: "700" },
  switchSub: { color: "#8E8E93", fontSize: 12, marginTop: 2 },
  chipRow: { flexDirection: "row", gap: 8 },
  chip: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
  },
  chipActive: { backgroundColor: "#0A7AFF", borderColor: "#0A7AFF" },
  chipTxt: { color: "#98A2B3", fontSize: 12, fontWeight: "700" },
  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 15,
    borderRadius: 14,
    backgroundColor: "rgba(255,59,48,0.14)",
    borderWidth: 1,
    borderColor: "rgba(255,59,48,0.35)",
  },
  logoutTxt: { color: "#FF453A", fontSize: 15, fontWeight: "800" },
});

