/**
 * © 2026 NXA Software. All rights reserved.
 * Nexa ERP Mobil - Dinamik Sol Çekmece (DrawerSidebar)
 * Gerçek oturum, işletme tipi rozeti, proje değiştirici ve çevrimdışı kuyruk sayacı içerir.
 */

import React, { createContext, useContext, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useAuth } from "../../context/AuthContext";
import {
  getAuthorizedModules,
  getRoleDisplayTitle,
  getTenantBusinessBadge,
} from "../../config/navigationConfig";
import { iosColors } from "../../theme/iosTheme";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const DRAWER_WIDTH = Math.min(SCREEN_WIDTH * 0.84, 340);

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
  const [slideAnim] = useState(new Animated.Value(-DRAWER_WIDTH));
  const [fadeAnim] = useState(new Animated.Value(0));
  const [isSyncing, setIsSyncing] = useState(false);

  const router = useRouter();
  const {
    user,
    tenant,
    tenantType,
    role,
    allowedModules,
    activeProject,
    isOnline,
    offlineQueueCount,
    hasModule,
    syncOfflineNow,
    logout,
  } = useAuth();

  const authorizedCount = getAuthorizedModules(role, allowedModules).length;
  const initials = (user?.name || "NX").slice(0, 2).toUpperCase();

  const openDrawer = () => {
    setIsOpen(true);
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 240,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 240,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const closeDrawer = (callback?: () => void) => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: -DRAWER_WIDTH,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setIsOpen(false);
      callback?.();
    });
  };

  const toggleDrawer = () => {
    if (isOpen) closeDrawer();
    else openDrawer();
  };

  const navigateAndClose = (path: string, params?: Record<string, string>) => {
    closeDrawer(() => {
      if (params) {
        router.push({ pathname: path as any, params });
      } else {
        router.push(path as any);
      }
    });
  };

  const handleSyncNow = async () => {
    try {
      setIsSyncing(true);
      const res = await syncOfflineNow();
      Alert.alert(
        "Senkronizasyon Tamamlandı",
        res.total === 0
          ? "Bekleyen çevrimdışı kayıt yok."
          : `${res.synced} kayıt eşitlendi${res.conflicts > 0 ? `, ${res.conflicts} çakışma` : ""}${res.errors > 0 ? `, ${res.errors} hata` : ""}.`
      );
    } finally {
      setIsSyncing(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      "Oturumu Kapat",
      "Nexa ERP oturumunuzdan güvenli şekilde çıkış yapmak istiyor musunuz?",
      [
        { text: "Vazgeç", style: "cancel" },
        {
          text: "Çıkış Yap",
          style: "destructive",
          onPress: () => closeDrawer(() => logout()),
        },
      ]
    );
  };

  return (
    <DrawerContext.Provider value={{ isOpen, openDrawer, closeDrawer, toggleDrawer }}>
      {children}

      {isOpen && (
        <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
          <Animated.View style={[styles.backdrop, { opacity: fadeAnim }]}>
            <TouchableOpacity
              style={StyleSheet.absoluteFill}
              activeOpacity={1}
              onPress={() => closeDrawer()}
            />
          </Animated.View>

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
                  <Text style={styles.avatarInitials}>{initials}</Text>
                </View>
                <View style={styles.profileTextWrapper}>
                  <Text style={styles.profileName} numberOfLines={1}>
                    {user?.name || "Kullanıcı"}
                  </Text>
                  <Text style={styles.profileEmail} numberOfLines={1}>
                    {user?.email || ""}
                  </Text>
                  <View style={styles.badgesRow}>
                    <View style={styles.roleBadge}>
                      <Text style={styles.roleBadgeText} numberOfLines={1}>
                        {getRoleDisplayTitle(role)}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>

              {/* İşletme Tipi & Aktif Proje Özeti */}
              <View style={styles.contextBox}>
                <View style={styles.contextRow}>
                  <Ionicons name="business" size={14} color="#0A7AFF" />
                  <Text style={styles.contextText} numberOfLines={1}>
                    {getTenantBusinessBadge(tenantType)} •{" "}
                    <Text style={{ color: "#FFFFFF", fontWeight: "700" }}>
                      {tenant?.name || "Nexa Kurum"}
                    </Text>
                  </Text>
                </View>
                {activeProject && (
                  <View style={styles.contextRow}>
                    <Ionicons name="location" size={14} color="#34C759" />
                    <Text style={styles.contextText} numberOfLines={1}>
                      {activeProject.name}
                    </Text>
                  </View>
                )}
              </View>

              <ScrollView
                style={styles.menuScroll}
                contentContainerStyle={{ paddingVertical: 12, gap: 8 }}
                showsVerticalScrollIndicator={false}
              >
                {/* Dijital QR Kimlik Kartım */}
                <TouchableOpacity
                  style={styles.menuItem}
                  activeOpacity={0.75}
                  onPress={() => navigateAndClose("/qr-id")}
                >
                  <View style={[styles.menuIconCircle, { backgroundColor: "rgba(10, 122, 255, 0.16)" }]}>
                    <Ionicons name="qr-code" size={18} color="#0A7AFF" />
                  </View>
                  <Text style={styles.menuItemText}>Dijital QR Kimlik Kartım</Text>
                  <Ionicons name="chevron-forward" size={16} color="#8E8E93" />
                </TouchableOpacity>

                {/* Telsiz & Şantiye Chat */}
                {hasModule("internal_comms", "ptt_chat") && (
                  <TouchableOpacity
                    style={styles.menuItem}
                    activeOpacity={0.75}
                    onPress={() => navigateAndClose("/screen/chat")}
                  >
                    <View style={[styles.menuIconCircle, { backgroundColor: "rgba(88, 86, 214, 0.16)" }]}>
                      <Ionicons name="chatbubbles" size={18} color="#7A77FF" />
                    </View>
                    <Text style={styles.menuItemText}>Telsiz & Şantiye Chat</Text>
                    <Ionicons name="chevron-forward" size={16} color="#8E8E93" />
                  </TouchableOpacity>
                )}

                {/* Canlı Güzergah Haritası */}
                {hasModule("route_optimization", "driver_deliveries") && (
                  <TouchableOpacity
                    style={styles.menuItem}
                    activeOpacity={0.75}
                    onPress={() => navigateAndClose("/screen/routes")}
                  >
                    <View style={[styles.menuIconCircle, { backgroundColor: "rgba(10, 122, 255, 0.16)" }]}>
                      <Ionicons name="navigate" size={18} color="#0A7AFF" />
                    </View>
                    <Text style={styles.menuItemText}>Canlı Güzergah Haritası</Text>
                    <Ionicons name="chevron-forward" size={16} color="#8E8E93" />
                  </TouchableOpacity>
                )}

                {/* Zimmetli BLE Yakınlık Radarı */}
                {hasModule("ble_radar") && (
                  <TouchableOpacity
                    style={styles.menuItem}
                    activeOpacity={0.75}
                    onPress={() => navigateAndClose("/screen/ble_radar")}
                  >
                    <View style={[styles.menuIconCircle, { backgroundColor: "rgba(0, 199, 190, 0.16)" }]}>
                      <Ionicons name="bluetooth" size={18} color="#00C7BE" />
                    </View>
                    <Text style={styles.menuItemText}>BLE Yakınlık Radarı</Text>
                    <Ionicons name="chevron-forward" size={16} color="#8E8E93" />
                  </TouchableOpacity>
                )}

                {/* Yetkili Modüller Kataloğu */}
                <TouchableOpacity
                  style={styles.menuItem}
                  activeOpacity={0.75}
                  onPress={() => navigateAndClose("/(tabs)/modules")}
                >
                  <View style={[styles.menuIconCircle, { backgroundColor: "rgba(0, 199, 190, 0.16)" }]}>
                    <Ionicons name="grid" size={18} color="#00C7BE" />
                  </View>
                  <Text style={styles.menuItemText}>
                    Modüller ({authorizedCount})
                  </Text>
                  <Ionicons name="chevron-forward" size={16} color="#8E8E93" />
                </TouchableOpacity>

                {/* Çevrimdışı Senkronizasyon Kuyruğu */}
                <TouchableOpacity
                  style={styles.menuItem}
                  activeOpacity={0.75}
                  onPress={() => navigateAndClose("/sync-queue")}
                >
                  <View
                    style={[
                      styles.menuIconCircle,
                      {
                        backgroundColor:
                          offlineQueueCount > 0
                            ? "rgba(255, 149, 0, 0.18)"
                            : "rgba(52, 199, 89, 0.16)",
                      },
                    ]}
                  >
                    <Ionicons
                      name={offlineQueueCount > 0 ? "cloud-upload" : "cloud-done"}
                      size={18}
                      color={offlineQueueCount > 0 ? "#FF9F0A" : "#34C759"}
                    />
                  </View>
                  <Text style={styles.menuItemText}>Çevrimdışı Kuyruk</Text>
                  {offlineQueueCount > 0 ? (
                    <View style={styles.countBadge}>
                      <Text style={styles.countBadgeText}>{offlineQueueCount}</Text>
                    </View>
                  ) : (
                    <Ionicons name="chevron-forward" size={16} color="#8E8E93" />
                  )}
                </TouchableOpacity>

                {/* Kırmızı Acil SOS Butonu */}
                {hasModule("sos_alarm") && (
                  <TouchableOpacity
                    style={[styles.menuItem, styles.sosMenuItem]}
                    activeOpacity={0.8}
                    onPress={() => navigateAndClose("/screen/isg", { tab: "sos" })}
                  >
                    <View style={[styles.menuIconCircle, { backgroundColor: "rgba(255, 59, 48, 0.22)" }]}>
                      <Ionicons name="medkit" size={18} color="#FF453A" />
                    </View>
                    <Text style={[styles.menuItemText, { color: "#FF6961" }]}>
                      ACİL DURUM SOS
                    </Text>
                    <Ionicons name="warning" size={16} color="#FF453A" />
                  </TouchableOpacity>
                )}

                {/* Profil & Ayarlar */}
                <TouchableOpacity
                  style={styles.menuItem}
                  activeOpacity={0.75}
                  onPress={() => navigateAndClose("/profile")}
                >
                  <View style={[styles.menuIconCircle, { backgroundColor: "rgba(175, 82, 222, 0.16)" }]}>
                    <Ionicons name="settings" size={18} color="#AF52DE" />
                  </View>
                  <Text style={styles.menuItemText}>Profil & Ayarlar</Text>
                  <Ionicons name="chevron-forward" size={16} color="#8E8E93" />
                </TouchableOpacity>

                {/* Hızlı Sync Kartı */}
                <View style={styles.syncCard}>
                  <View style={styles.syncHeaderRow}>
                    <Text style={styles.syncTitle}>
                      {isOnline ? "Sunucu Bağlı" : "Çevrimdışı Mod"}
                    </Text>
                    <Text
                      style={[
                        styles.syncStateBadge,
                        { color: offlineQueueCount === 0 ? "#34C759" : "#FF9F0A" },
                      ]}
                    >
                      {offlineQueueCount === 0 ? "GÜNCEL" : `${offlineQueueCount} BEKLİYOR`}
                    </Text>
                  </View>
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
                        <Text style={styles.syncNowText}>Şimdi Eşitle</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              </ScrollView>

              {/* Çıkış */}
              <View style={styles.footerSection}>
                <TouchableOpacity
                  style={styles.logoutButton}
                  activeOpacity={0.8}
                  onPress={handleLogout}
                >
                  <Ionicons name="log-out-outline" size={20} color="#FF453A" />
                  <Text style={styles.logoutText}>Çıkış Yap</Text>
                </TouchableOpacity>
                <Text style={styles.appVersionText}>Nexa ERP Mobile • RBAC v2.0</Text>
              </View>
            </SafeAreaView>
          </Animated.View>
        </View>
      )}
    </DrawerContext.Provider>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: "rgba(0, 0, 0, 0.72)",
  },
  drawerContainer: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: DRAWER_WIDTH,
    backgroundColor: iosColors.background,
    borderRightWidth: 1,
    borderRightColor: "rgba(255, 255, 255, 0.1)",
  },
  safeArea: {
    flex: 1,
    justifyContent: "space-between",
  },
  profileHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 18,
    paddingTop: 14,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: iosColors.separator,
    gap: 12,
  },
  avatarWrapper: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(10, 122, 255, 0.16)",
    borderWidth: 1.5,
    borderColor: iosColors.systemBlue,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarInitials: {
    fontSize: 17,
    fontWeight: "800",
    color: "#58A6FF",
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
    color: iosColors.labelMuted,
    marginTop: 1,
  },
  badgesRow: {
    flexDirection: "row",
    marginTop: 5,
  },
  roleBadge: {
    backgroundColor: "rgba(10, 122, 255, 0.14)",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "rgba(10, 122, 255, 0.3)",
  },
  roleBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#58A6FF",
  },
  contextBox: {
    marginHorizontal: 14,
    marginTop: 10,
    padding: 10,
    borderRadius: 12,
    backgroundColor: "rgba(255, 255, 255, 0.04)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.07)",
    gap: 6,
  },
  contextRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  contextText: {
    flex: 1,
    fontSize: 11,
    color: iosColors.labelMuted,
  },
  menuScroll: {
    flex: 1,
    paddingHorizontal: 14,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.035)",
    paddingVertical: 11,
    paddingHorizontal: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.06)",
    gap: 11,
  },
  sosMenuItem: {
    backgroundColor: "rgba(255, 59, 48, 0.09)",
    borderColor: "rgba(255, 59, 48, 0.3)",
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
    fontSize: 13,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  countBadge: {
    backgroundColor: "#FF9500",
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 10,
  },
  countBadgeText: {
    color: "#0A0F1C",
    fontSize: 11,
    fontWeight: "900",
  },
  syncCard: {
    marginTop: 6,
    padding: 12,
    borderRadius: 14,
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.06)",
    gap: 8,
  },
  syncHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  syncTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  syncStateBadge: {
    fontSize: 10,
    fontWeight: "800",
  },
  syncNowButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: iosColors.systemBlue,
    paddingVertical: 8,
    borderRadius: 9,
    gap: 6,
  },
  syncNowText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
  },
  footerSection: {
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 10,
    borderTopWidth: 1,
    borderTopColor: iosColors.separator,
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255, 59, 48, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(255, 59, 48, 0.3)",
    paddingVertical: 11,
    borderRadius: 12,
    gap: 8,
  },
  logoutText: {
    color: "#FF453A",
    fontSize: 14,
    fontWeight: "700",
  },
  appVersionText: {
    textAlign: "center",
    fontSize: 10,
    color: "#636366",
    marginTop: 8,
  },
});
