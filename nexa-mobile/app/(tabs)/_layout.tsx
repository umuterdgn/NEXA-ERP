import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Platform,
  Dimensions,
  TouchableWithoutFeedback,
} from "react-native";
import { Tabs, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { iosColors, iosRadius } from "../../src/theme/iosTheme";
import { DrawerProvider } from "../../src/components/navigation/DrawerSidebar";
import { getAuthSession } from "../../apiClient";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

/**
 * Nexa ERP Mobil - Master Navigation
 * - Drawer Sidebar (Profil, Ayarlar, Destek, Çevrimdışı Senkronizasyon, Çıkış)
 * - Bottom Tab Navigator (Sol: Ana Sayfa, Jurnal | Sağ: İş Emirleri, Portallar)
 * - Merkez Buton (Custom FAB): Dışarı taşan devasa mavi buton ve rol bazlı Hızlı İşlem menüsü (Action Sheet)
 */
export default function TabLayout() {
  const router = useRouter();
  const [isActionSheetOpen, setIsActionSheetOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    (async () => {
      try {
        const session = await getAuthSession();
        if (session.user) {
          setCurrentUser(session.user);
        }
      } catch (err) {
        console.warn("[TabLayout] Oturum uyarısı:", err);
      }
    })();
  }, [isActionSheetOpen]);

  // Hızlı İşlem Yönlendirmeleri
  const handleAction = (route: string) => {
    setIsActionSheetOpen(false);
    setTimeout(() => {
      router.push(route as any);
    }, 150);
  };

  const role = currentUser?.role || "ENGINEER";

  return (
    <DrawerProvider>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: "#0A7AFF",
          tabBarInactiveTintColor: "#8E8E93",
          tabBarStyle: {
            position: "absolute",
            backgroundColor:
              Platform.OS === "ios"
                ? "rgba(10, 15, 28, 0.75)"
                : "rgba(10, 15, 28, 0.95)",
            borderTopWidth: 1,
            borderTopColor: "rgba(255, 255, 255, 0.12)",
            height: Platform.OS === "ios" ? 84 : 70,
            paddingBottom: Platform.OS === "ios" ? 24 : 10,
            paddingTop: 8,
            elevation: 12,
            shadowColor: "#000000",
            shadowOffset: { width: 0, height: -4 },
            shadowOpacity: 0.35,
            shadowRadius: 16,
          },
          tabBarLabelStyle: {
            fontSize: 10,
            fontWeight: "700",
            letterSpacing: 0.2,
          },
          tabBarBackground: () =>
            Platform.OS === "ios" ? (
              <BlurView
                intensity={45}
                tint="dark"
                style={StyleSheet.absoluteFill}
              />
            ) : null,
        }}
      >
        {/* ================================================================ */}
        {/* SOL TABLAR                                                       */}
        {/* ================================================================ */}

        {/* 1. Ana Sayfa */}
        <Tabs.Screen
          name="index"
          options={{
            title: "Ana Sayfa",
            tabBarIcon: ({ focused }) => (
              <Ionicons
                name={focused ? "home" : "home-outline"}
                size={22}
                color={focused ? "#0A7AFF" : "#8E8E93"}
              />
            ),
          }}
        />

        {/* 2. Jurnal */}
        <Tabs.Screen
          name="journal"
          options={{
            title: "Jurnal",
            tabBarIcon: ({ focused }) => (
              <Ionicons
                name={focused ? "clipboard" : "clipboard-outline"}
                size={22}
                color={focused ? "#0A7AFF" : "#8E8E93"}
              />
            ),
          }}
        />

        {/* ================================================================ */}
        {/* MERKEZ BUTON (CUSTOM FAB): Role Göre Hızlı İşlem Action Sheet     */}
        {/* ================================================================ */}
        <Tabs.Screen
          name="chat" // Mevcut chat route'unu dummy FAB yuvası olarak kullanıp özelleştiriyoruz
          options={{
            title: "",
            tabBarButton: () => (
              <View style={styles.fabContainer}>
                <TouchableOpacity
                  style={styles.fabButton}
                  activeOpacity={0.85}
                  onPress={() => setIsActionSheetOpen(true)}
                >
                  <Ionicons name="add" size={32} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            ),
          }}
        />

        {/* ================================================================ */}
        {/* SAĞ TABLAR                                                       */}
        {/* ================================================================ */}

        {/* 4. İş Emirleri */}
        <Tabs.Screen
          name="tasks"
          options={{
            title: "İş Emirleri",
            tabBarIcon: ({ focused }) => (
              <Ionicons
                name={focused ? "checkbox" : "checkbox-outline"}
                size={22}
                color={focused ? "#0A7AFF" : "#8E8E93"}
              />
            ),
          }}
        />

        {/* 5. Portallar */}
        <Tabs.Screen
          name="portals"
          options={{
            title: "Portallar",
            tabBarIcon: ({ focused }) => (
              <Ionicons
                name={focused ? "grid" : "grid-outline"}
                size={22}
                color={focused ? "#0A7AFF" : "#8E8E93"}
              />
            ),
          }}
        />

        {/* DİĞER İÇ ROTALAR (Tab barda buton göstermeden yönlendirilebilir) */}
        <Tabs.Screen name="attendance" options={{ href: null }} />
        <Tabs.Screen name="safety" options={{ href: null }} />
        <Tabs.Screen name="bim" options={{ href: null }} />
        <Tabs.Screen name="profile" options={{ href: null }} />
      </Tabs>

      {/* ================================================================== */}
      {/* MERKEZ FAB AKSİYON MENÜSÜ (ACTION SHEET MODAL)                     */}
      {/* ================================================================== */}
      <Modal
        visible={isActionSheetOpen}
        animationType="slide"
        transparent
        onRequestClose={() => setIsActionSheetOpen(false)}
      >
        <TouchableWithoutFeedback onPress={() => setIsActionSheetOpen(false)}>
          <View style={styles.actionSheetBackdrop}>
            <TouchableWithoutFeedback>
              <View style={styles.actionSheetContent}>
                {/* Tutma Çubuğu (Drag Handle) */}
                <View style={styles.dragHandle} />

                {/* Başlık */}
                <View style={styles.actionSheetHeader}>
                  <View>
                    <Text style={styles.actionSheetTitle}>Hızlı İşlemler</Text>
                    <Text style={styles.actionSheetSub}>
                      {currentUser?.name || "Kullanıcı"} • {role}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.actionCloseBtn}
                    onPress={() => setIsActionSheetOpen(false)}
                  >
                    <Ionicons name="close" size={20} color="#8E8E93" />
                  </TouchableOpacity>
                </View>

                {/* Rol Bazlı Dinamik Butonlar */}
                <View style={styles.actionGrid}>
                  {/* Ortak: Hasar / Olay Bildir */}
                  <TouchableOpacity
                    style={styles.actionCard}
                    activeOpacity={0.8}
                    onPress={() => handleAction("/(tabs)/portals")}
                  >
                    <View style={[styles.actionIconCircle, { backgroundColor: "rgba(255, 59, 48, 0.15)" }]}>
                      <Ionicons name="camera-reverse" size={22} color="#FF3B30" />
                    </View>
                    <Text style={styles.actionCardTitle}>Hasar / Olay Bildir</Text>
                    <Text style={styles.actionCardSub}>Fotoğraf üzeri çizim ve GPS</Text>
                  </TouchableOpacity>

                  {/* Taşeron İçin: Hakediş & Puantaj */}
                  {(role === "SUBCONTRACTOR" || role === "TASERON" || role === "ENGINEER" || role === "FRANCHISE_OWNER") && (
                    <TouchableOpacity
                      style={styles.actionCard}
                      activeOpacity={0.8}
                      onPress={() => handleAction("/(tabs)/portals")}
                    >
                      <View style={[styles.actionIconCircle, { backgroundColor: "rgba(255, 149, 0, 0.15)" }]}>
                        <Ionicons name="hammer" size={22} color="#FF9500" />
                      </View>
                      <Text style={styles.actionCardTitle}>Hakediş / Puantaj</Text>
                      <Text style={styles.actionCardSub}>İmalat ve ekip puantajı</Text>
                    </TouchableOpacity>
                  )}

                  {/* Sürücü İçin: Kapı Geçiş QR & Rota */}
                  {(role === "DRIVER" || role === "SOFOR" || role === "ENGINEER") && (
                    <TouchableOpacity
                      style={styles.actionCard}
                      activeOpacity={0.8}
                      onPress={() => handleAction("/(tabs)/portals")}
                    >
                      <View style={[styles.actionIconCircle, { backgroundColor: "rgba(52, 199, 89, 0.15)" }]}>
                        <Ionicons name="navigate" size={22} color="#34C759" />
                      </View>
                      <Text style={styles.actionCardTitle}>Kapı Geçiş & Rota</Text>
                      <Text style={styles.actionCardSub}>Transmikser QR ve harita</Text>
                    </TouchableOpacity>
                  )}

                  {/* Yapı Denetim İçin: Beton Döküm Vizesi */}
                  {(role === "INSPECTOR" || role === "YAPI_DENETIM" || role === "ENGINEER") && (
                    <TouchableOpacity
                      style={styles.actionCard}
                      activeOpacity={0.8}
                      onPress={() => handleAction("/(tabs)/portals")}
                    >
                      <View style={[styles.actionIconCircle, { backgroundColor: "rgba(175, 82, 222, 0.15)" }]}>
                        <Ionicons name="shield-checkmark" size={22} color="#AF52DE" />
                      </View>
                      <Text style={styles.actionCardTitle}>Beton Döküm Vizesi</Text>
                      <Text style={styles.actionCardSub}>e-İmza ile yasal onay</Text>
                    </TouchableOpacity>
                  )}

                  {/* Franchise İçin: Ciro Beyanı */}
                  {(role === "FRANCHISE_OWNER" || role === "FRANCHISE") && (
                    <TouchableOpacity
                      style={styles.actionCard}
                      activeOpacity={0.8}
                      onPress={() => handleAction("/(tabs)/portals")}
                    >
                      <View style={[styles.actionIconCircle, { backgroundColor: "rgba(10, 122, 255, 0.15)" }]}>
                        <Ionicons name="business" size={22} color="#0A7AFF" />
                      </View>
                      <Text style={styles.actionCardTitle}>Ciro Beyanı Ekle</Text>
                      <Text style={styles.actionCardSub}>Günlük mağaza cirosu</Text>
                    </TouchableOpacity>
                  )}

                  {/* BIM AR Canlı Saha Çakıştırma */}
                  <TouchableOpacity
                    style={styles.actionCard}
                    activeOpacity={0.8}
                    onPress={() => handleAction("/(tabs)/bim")}
                  >
                    <View style={[styles.actionIconCircle, { backgroundColor: "rgba(10, 122, 255, 0.15)" }]}>
                      <Ionicons name="cube" size={22} color="#0A7AFF" />
                    </View>
                    <Text style={styles.actionCardTitle}>BIM AR Canlı Hizalama</Text>
                    <Text style={styles.actionCardSub}>Kamera ile tesisat çakıştırma</Text>
                  </TouchableOpacity>

                  {/* Turnike NFC Kart Okut */}
                  <TouchableOpacity
                    style={styles.actionCard}
                    activeOpacity={0.8}
                    onPress={() => handleAction("/(tabs)/attendance")}
                  >
                    <View style={[styles.actionIconCircle, { backgroundColor: "rgba(52, 199, 89, 0.15)" }]}>
                      <Ionicons name="radio" size={22} color="#34C759" />
                    </View>
                    <Text style={styles.actionCardTitle}>NFC Turnike Kartı</Text>
                    <Text style={styles.actionCardSub}>Temassız personel girişi</Text>
                  </TouchableOpacity>

                  {/* QR Kod Tara */}
                  <TouchableOpacity
                    style={styles.actionCard}
                    activeOpacity={0.8}
                    onPress={() => handleAction("/(tabs)/attendance")}
                  >
                    <View style={[styles.actionIconCircle, { backgroundColor: "rgba(255, 255, 255, 0.15)" }]}>
                      <Ionicons name="qr-code" size={22} color="#FFFFFF" />
                    </View>
                    <Text style={styles.actionCardTitle}>Kamera ile QR Okut</Text>
                    <Text style={styles.actionCardSub}>Yaka kartı veya sevkiyat</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </DrawerProvider>
  );
}

const styles = StyleSheet.create({
  fabContainer: {
    top: -22,
    justifyContent: "center",
    alignItems: "center",
    width: 68,
    height: 68,
  },
  fabButton: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: "#0A7AFF",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#0A7AFF",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 10,
    borderWidth: 3,
    borderColor: "#0A0F1C",
  },
  actionSheetBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.75)",
    justifyContent: "flex-end",
  },
  actionSheetContent: {
    backgroundColor: "#121826",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderTopWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.12)",
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: Platform.OS === "ios" ? 40 : 24,
  },
  dragHandle: {
    width: 44,
    height: 5,
    borderRadius: 3,
    backgroundColor: "rgba(255, 255, 255, 0.25)",
    alignSelf: "center",
    marginBottom: 16,
  },
  actionSheetHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 18,
  },
  actionSheetTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  actionSheetSub: {
    fontSize: 12,
    color: "#8E8E93",
    marginTop: 2,
  },
  actionCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  actionGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  actionCard: {
    width: (SCREEN_WIDTH - 52) / 2,
    backgroundColor: "rgba(255, 255, 255, 0.04)",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    padding: 14,
    gap: 6,
  },
  actionIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  actionCardTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  actionCardSub: {
    fontSize: 10,
    color: "#8E8E93",
    lineHeight: 14,
  },
});
