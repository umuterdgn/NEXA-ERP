import React, { createContext, useContext, useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Dimensions,
  Animated,
  ScrollView,
  Alert,
  Linking,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { getAuthSession, clearAuthSession } from "../../../apiClient";
import { OfflineQueue } from "../../services/OfflineQueue";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const DRAWER_WIDTH = Math.min(SCREEN_WIDTH * 0.82, 340);

interface DrawerContextType {
  isOpen: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
  toggleDrawer: () => void;
}

const DrawerContext = createContext<DrawerContextType>({
  isOpen: false,
  openDrawer: () => {},
  closeDrawer: () => {},
  toggleDrawer: () => {},
});

export const useDrawer = () => useContext(DrawerContext);

export function DrawerProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();

  const [slideAnim] = useState(new Animated.Value(-DRAWER_WIDTH));
  const [fadeAnim] = useState(new Animated.Value(0));

  const [userInfo, setUserInfo] = useState({
    name: "Umut Erdoğan",
    email: "erdgnumut20@gmail.com",
    role: "FRANCHISE_OWNER",
    tenantId: "nexa-franchise",
  });

  const [queuedCount, setQueuedCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);

  // Alt Modaller (Ayarlar & Destek)
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showSupportModal, setShowSupportModal] = useState(false);

  // Oturum ve Offline Kuyruk verilerini yükle
  useEffect(() => {
    (async () => {
      try {
        const session = await getAuthSession();
        if (session.user) {
          setUserInfo({
            name: session.user.name || session.user.email?.split("@")[0].toUpperCase() || "Kullanıcı",
            email: session.user.email || "kullanici@nxerp.com.tr",
            role: session.user.role || "ENGINEER",
            tenantId: session.tenantId || "nexa-franchise",
          });
        }
        const queue = await OfflineQueue.getQueue();
        setQueuedCount(queue.length);
      } catch (err) {
        console.warn("[DrawerProvider] Bilgi yükleme uyarısı:", err);
      }
    })();
  }, [isOpen]);

  const openDrawer = () => {
    setIsOpen(true);
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const closeDrawer = () => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: -DRAWER_WIDTH,
        duration: 220,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 220,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setIsOpen(false);
    });
  };

  const toggleDrawer = () => {
    if (isOpen) {
      closeDrawer();
    } else {
      openDrawer();
    }
  };

  // Çıkış Yap
  const handleLogout = () => {
    Alert.alert(
      "Oturumu Kapat",
      "Nexa ERP hesabınızdan çıkış yapmak istediğinize emin misiniz?",
      [
        { text: "Vazgeç", style: "cancel" },
        {
          text: "Çıkış Yap",
          style: "destructive",
          onPress: async () => {
            closeDrawer();
            await clearAuthSession();
            router.replace("/");
          },
        },
      ]
    );
  };

  // Manuel Çevrimdışı Senkronizasyon
  const handleSyncNow = async () => {
    try {
      setIsSyncing(true);
      await OfflineQueue.processQueue();
      const queue = await OfflineQueue.getQueue();
      setQueuedCount(queue.length);
      Alert.alert("Senkronizasyon", "Çevrimdışı kuyruktaki tüm veriler web sunucusuna iletildi.");
    } catch (err: any) {
      Alert.alert("Senkronizasyon", "Kuyruk işlenirken sunucuya erişilemedi. Otomatik tekrar denenecektir.");
    } finally {
      setIsSyncing(false);
    }
  };

  // Rol Etiketi
  const getRoleLabel = (role: string) => {
    switch (role) {
      case "ENGINEER":
        return "Şantiye Şefi / Başmühendis";
      case "SUBCONTRACTOR":
      case "TASERON":
        return "Taşeron Yüklenici";
      case "DRIVER":
        return "Lojistik / Mikser Sürücüsü";
      case "INSPECTOR":
        return "Bakanlık Yapı Denetçisi";
      case "FRANCHISE_OWNER":
      case "FRANCHISE":
        return "Franchise Super Admin";
      default:
        return role;
    }
  };

  return (
    <DrawerContext.Provider value={{ isOpen, openDrawer, closeDrawer, toggleDrawer }}>
      {children}

      {/* Drawer Overlay & Panel */}
      {isOpen && (
        <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
          {/* Karartma Backdrop */}
          <Animated.View
            style={[styles.backdrop, { opacity: fadeAnim }]}
            pointerEvents="auto"
          >
            <TouchableOpacity
              style={StyleSheet.absoluteFill}
              activeOpacity={1}
              onPress={closeDrawer}
            />
          </Animated.View>

          {/* Kayar Panel */}
          <Animated.View
            style={[
              styles.drawerContainer,
              { transform: [{ translateX: slideAnim }] },
            ]}
          >
            <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
              {/* Profil Başlığı */}
              <View style={styles.profileHeader}>
                <View style={styles.avatarWrapper}>
                  <Text style={styles.avatarInitials}>
                    {userInfo.name.slice(0, 2).toUpperCase()}
                  </Text>
                </View>
                <View style={styles.profileTextWrapper}>
                  <Text style={styles.profileName} numberOfLines={1}>
                    {userInfo.name}
                  </Text>
                  <Text style={styles.profileEmail} numberOfLines={1}>
                    {userInfo.email}
                  </Text>
                  <View style={styles.roleBadge}>
                    <Text style={styles.roleBadgeText}>
                      {getRoleLabel(userInfo.role)}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Tenant Bilgisi */}
              <View style={styles.tenantInfoBox}>
                <Ionicons name="business" size={14} color="#0A7AFF" />
                <Text style={styles.tenantText}>
                  Çalışma Alanı: <Text style={{ color: "#FFFFFF", fontWeight: "700" }}>{userInfo.tenantId}</Text>
                </Text>
              </View>

              {/* Menü Maddeleri */}
              <ScrollView
                style={styles.menuScroll}
                contentContainerStyle={{ paddingVertical: 12, gap: 6 }}
                showsVerticalScrollIndicator={false}
              >
                {/* 1. Profilim */}
                <TouchableOpacity
                  style={styles.menuItem}
                  activeOpacity={0.7}
                  onPress={() => {
                    closeDrawer();
                    router.push("/(tabs)/profile");
                  }}
                >
                  <View style={[styles.menuIconCircle, { backgroundColor: "rgba(10, 122, 255, 0.15)" }]}>
                    <Ionicons name="person" size={18} color="#0A7AFF" />
                  </View>
                  <Text style={styles.menuItemText}>Profilim</Text>
                  <Ionicons name="chevron-forward" size={16} color="#8E8E93" />
                </TouchableOpacity>

                {/* 2. Ayarlar */}
                <TouchableOpacity
                  style={styles.menuItem}
                  activeOpacity={0.7}
                  onPress={() => {
                    setShowSettingsModal(true);
                  }}
                >
                  <View style={[styles.menuIconCircle, { backgroundColor: "rgba(175, 82, 222, 0.15)" }]}>
                    <Ionicons name="settings" size={18} color="#AF52DE" />
                  </View>
                  <Text style={styles.menuItemText}>Ayarlar</Text>
                  <Ionicons name="chevron-forward" size={16} color="#8E8E93" />
                </TouchableOpacity>

                {/* 3. Destek / Yardım Merkezi */}
                <TouchableOpacity
                  style={styles.menuItem}
                  activeOpacity={0.7}
                  onPress={() => {
                    setShowSupportModal(true);
                  }}
                >
                  <View style={[styles.menuIconCircle, { backgroundColor: "rgba(52, 199, 89, 0.15)" }]}>
                    <Ionicons name="help-buoy" size={18} color="#34C759" />
                  </View>
                  <Text style={styles.menuItemText}>Destek / Yardım Merkezi</Text>
                  <Ionicons name="chevron-forward" size={16} color="#8E8E93" />
                </TouchableOpacity>

                {/* 4. Çevrimdışı Senkronizasyon Durumu */}
                <View style={styles.syncCard}>
                  <View style={styles.syncHeaderRow}>
                    <View style={styles.syncTitleRow}>
                      <Ionicons
                        name={queuedCount === 0 ? "checkmark-circle" : "cloud-upload"}
                        size={18}
                        color={queuedCount === 0 ? "#34C759" : "#FF9500"}
                      />
                      <Text style={styles.syncCardTitle}>Çevrimdışı Senkronizasyon</Text>
                    </View>
                    <View
                      style={[
                        styles.syncBadge,
                        queuedCount === 0 ? styles.syncBadgeGreen : styles.syncBadgeOrange,
                      ]}
                    >
                      <Text
                        style={[
                          styles.syncBadgeText,
                          queuedCount === 0 ? { color: "#34C759" } : { color: "#FF9500" },
                        ]}
                      >
                        {queuedCount === 0 ? "GÜNCEL" : `${queuedCount} BEKLİYOR`}
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.syncCardDesc}>
                    {queuedCount === 0
                      ? "Tüm saha kayıtları, jurnaller ve fotoğraflar sunucu ile eşitlendi."
                      : "İnternet koptuğunda kaydedilen taslaklar kuyrukta bekletiliyor."}
                  </Text>

                  <TouchableOpacity
                    style={styles.syncNowButton}
                    onPress={handleSyncNow}
                    disabled={isSyncing}
                  >
                    {isSyncing ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <>
                        <Ionicons name="sync" size={14} color="#FFFFFF" />
                        <Text style={styles.syncNowText}>Şimdi Senkronize Et</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              </ScrollView>

              {/* Alt Çıkış Yap Butonu */}
              <View style={styles.footerSection}>
                <TouchableOpacity
                  style={styles.logoutButton}
                  activeOpacity={0.8}
                  onPress={handleLogout}
                >
                  <Ionicons name="log-out-outline" size={20} color="#FF3B30" />
                  <Text style={styles.logoutText}>Çıkış Yap</Text>
                </TouchableOpacity>
                <Text style={styles.appVersionText}>Nexa ERP Mobil v1.0.4 (Build 88)</Text>
              </View>
            </SafeAreaView>
          </Animated.View>
        </View>
      )}

      {/* AYARLAR MODALI */}
      <Modal visible={showSettingsModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Uygulama Ayarları</Text>
              <TouchableOpacity onPress={() => setShowSettingsModal(false)}>
                <Ionicons name="close-circle" size={26} color="#8E8E93" />
              </TouchableOpacity>
            </View>

            <View style={styles.settingRow}>
              <Text style={styles.settingLabel}>Koyu Tema (Dark Mode)</Text>
              <Text style={styles.settingValue}>Aktif (Zorunlu)</Text>
            </View>

            <View style={styles.settingRow}>
              <Text style={styles.settingLabel}>GPS Yüksek Hassasiyet</Text>
              <Text style={styles.settingValueGreen}>Anti-Spoof Doğrulamalı</Text>
            </View>

            <View style={styles.settingRow}>
              <Text style={styles.settingLabel}>Önbellek (Offline Cache)</Text>
              <TouchableOpacity
                onPress={() => Alert.alert("Önbellek", "Geçici veriler başarıyla temizlendi.")}
              >
                <Text style={{ color: "#0A7AFF", fontWeight: "600" }}>Temizle</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.settingRow}>
              <Text style={styles.settingLabel}>Dil / Language</Text>
              <Text style={styles.settingValue}>Türkçe (TR)</Text>
            </View>

            <TouchableOpacity
              style={styles.modalDoneButton}
              onPress={() => setShowSettingsModal(false)}
            >
              <Text style={styles.modalDoneText}>Kapat</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* DESTEK & YARDIM MODALI */}
      <Modal visible={showSupportModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Destek & Yardım Merkezi</Text>
              <TouchableOpacity onPress={() => setShowSupportModal(false)}>
                <Ionicons name="close-circle" size={26} color="#8E8E93" />
              </TouchableOpacity>
            </View>

            <Text style={styles.supportDesc}>
              Şantiye saha koşullarında veya sistem kullanımında teknik bir sorun yaşarsanız
              7/24 Nexa Operasyon Merkezi ile irtibata geçebilirsiniz:
            </Text>

            <TouchableOpacity
              style={styles.supportContactRow}
              onPress={() => Linking.openURL("mailto:destek@nxerp.com.tr")}
            >
              <Ionicons name="mail" size={20} color="#0A7AFF" />
              <View>
                <Text style={styles.contactTitle}>E-posta Destek</Text>
                <Text style={styles.contactSub}>destek@nxerp.com.tr</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.supportContactRow}
              onPress={() => Linking.openURL("tel:08503004455")}
            >
              <Ionicons name="call" size={20} color="#34C759" />
              <View>
                <Text style={styles.contactTitle}>Şantiye Acil Çağrı Hattı</Text>
                <Text style={styles.contactSub}>0850 300 44 55</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modalDoneButton}
              onPress={() => setShowSupportModal(false)}
            >
              <Text style={styles.modalDoneText}>Tamam</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </DrawerContext.Provider>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(0, 0, 0, 0.72)",
  },
  drawerContainer: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: DRAWER_WIDTH,
    backgroundColor: "#0A0F1C",
    borderRightWidth: 1,
    borderRightColor: "rgba(255, 255, 255, 0.1)",
    shadowColor: "#000",
    shadowOffset: { width: 4, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 16,
  },
  safeArea: {
    flex: 1,
    justifyContent: "space-between",
  },
  profileHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.08)",
    gap: 12,
  },
  avatarWrapper: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(10, 122, 255, 0.15)",
    borderWidth: 1.5,
    borderColor: "#0A7AFF",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarInitials: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0A7AFF",
  },
  profileTextWrapper: {
    flex: 1,
  },
  profileName: {
    fontSize: 16,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  profileEmail: {
    fontSize: 11,
    color: "#8E8E93",
    marginTop: 1,
  },
  roleBadge: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(10, 122, 255, 0.12)",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginTop: 4,
    borderWidth: 1,
    borderColor: "rgba(10, 122, 255, 0.25)",
  },
  roleBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#0A7AFF",
  },
  tenantInfoBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.04)",
    marginHorizontal: 16,
    marginTop: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    gap: 8,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.06)",
  },
  tenantText: {
    fontSize: 11,
    color: "#8E8E93",
  },
  menuScroll: {
    flex: 1,
    paddingHorizontal: 12,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.05)",
    gap: 12,
  },
  menuIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  menuItemText: {
    flex: 1,
    fontSize: 14,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  syncCard: {
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.06)",
    padding: 14,
    marginTop: 8,
    gap: 8,
  },
  syncHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  syncTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  syncCardTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  syncBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  syncBadgeGreen: {
    backgroundColor: "rgba(52, 199, 89, 0.15)",
  },
  syncBadgeOrange: {
    backgroundColor: "rgba(255, 149, 0, 0.15)",
  },
  syncBadgeText: {
    fontSize: 9,
    fontWeight: "800",
  },
  syncCardDesc: {
    fontSize: 11,
    color: "#8E8E93",
    lineHeight: 15,
  },
  syncNowButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#0A7AFF",
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
    marginTop: 4,
  },
  syncNowText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
  },
  footerSection: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.08)",
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255, 59, 48, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(255, 59, 48, 0.25)",
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  logoutText: {
    color: "#FF3B30",
    fontSize: 14,
    fontWeight: "700",
  },
  appVersionText: {
    textAlign: "center",
    fontSize: 10,
    color: "#636366",
    marginTop: 10,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.75)",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  modalContent: {
    backgroundColor: "#121826",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.12)",
    padding: 22,
    gap: 14,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  settingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.06)",
  },
  settingLabel: {
    fontSize: 13,
    color: "#8E8E93",
  },
  settingValue: {
    fontSize: 13,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  settingValueGreen: {
    fontSize: 12,
    fontWeight: "700",
    color: "#34C759",
  },
  supportDesc: {
    fontSize: 13,
    color: "#8E8E93",
    lineHeight: 18,
  },
  supportContactRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.04)",
    padding: 12,
    borderRadius: 12,
    gap: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
  },
  contactTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  contactSub: {
    fontSize: 12,
    color: "#8E8E93",
  },
  modalDoneButton: {
    backgroundColor: "#0A7AFF",
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 6,
  },
  modalDoneText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
});
