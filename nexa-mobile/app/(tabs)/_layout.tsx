/**
 * © 2026 NXA Software. All rights reserved.
 * Nexa ERP Mobil - 5 Slotlu Dinamik Rol & İşletme Tipi Alt Menüsü + Merkez FAB
 */

import React, { useMemo, useState } from "react";
import {
  Dimensions,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { Tabs, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { DrawerProvider } from "../../src/components/navigation/DrawerSidebar";
import { useAuth } from "../../src/context/AuthContext";
import {
  getDynamicTabs,
  getFabActions,
  getRoleDisplayTitle,
  getTenantBusinessBadge,
  type FabActionItem,
} from "../../src/config/navigationConfig";
import { iosColors } from "../../src/theme/iosTheme";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export default function TabLayout() {
  const router = useRouter();
  const { user, role, tenantType, allowedModules, isAuthenticated, isBootstrapping } =
    useAuth();
  const [isFabOpen, setIsFabOpen] = useState(false);

  const { slot2, slot4 } = useMemo(
    () => getDynamicTabs(role, tenantType, allowedModules),
    [role, tenantType, allowedModules]
  );

  const fabActions = useMemo(
    () => getFabActions(role, allowedModules),
    [role, allowedModules]
  );

  const handleOpenAction = (action: FabActionItem) => {
    setIsFabOpen(false);
    setTimeout(() => {
      router.push({
        pathname: "/screen/[moduleId]",
        params: {
          moduleId: action.screenId,
          ...(action.params || {}),
        },
      });
    }, 120);
  };

  if (!isBootstrapping && !isAuthenticated) {
    return null;
  }

  return (
    <DrawerProvider>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: iosColors.systemBlue,
          tabBarInactiveTintColor: "#8E8E93",
          tabBarStyle: {
            position: "absolute",
            backgroundColor:
              Platform.OS === "ios"
                ? "rgba(10, 15, 28, 0.8)"
                : "rgba(10, 15, 28, 0.97)",
            borderTopWidth: 1,
            borderTopColor: "rgba(255, 255, 255, 0.1)",
            height: Platform.OS === "ios" ? 84 : 68,
            paddingBottom: Platform.OS === "ios" ? 24 : 10,
            paddingTop: 8,
            elevation: 12,
          },
          tabBarLabelStyle: {
            fontSize: 10,
            fontWeight: "700",
          },
          tabBarBackground: () =>
            Platform.OS === "ios" ? (
              <BlurView intensity={45} tint="dark" style={StyleSheet.absoluteFill} />
            ) : null,
        }}
      >
        {/* SLOT 1: Ana Sayfa */}
        <Tabs.Screen
          name="index"
          options={{
            title: "Ana Sayfa",
            tabBarIcon: ({ focused }) => (
              <Ionicons
                name={focused ? "home" : "home-outline"}
                size={22}
                color={focused ? iosColors.systemBlue : "#8E8E93"}
              />
            ),
          }}
        />

        {/* SLOT 2: Rolün 1. Ana Modülü */}
        <Tabs.Screen
          name="primary"
          options={{
            title: slot2.label,
            tabBarIcon: ({ focused }) => (
              <Ionicons
                name={focused ? slot2.activeIcon : slot2.icon}
                size={22}
                color={focused ? iosColors.systemBlue : "#8E8E93"}
              />
            ),
          }}
        />

        {/* SLOT 3: Merkez Mavi FAB (+) */}
        <Tabs.Screen
          name="fab-anchor"
          options={{
            title: "",
            tabBarButton: () => (
              <View style={styles.fabContainer}>
                <TouchableOpacity
                  style={styles.fabButton}
                  activeOpacity={0.85}
                  onPress={() => setIsFabOpen(true)}
                >
                  <Ionicons name="add" size={30} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            ),
          }}
        />

        {/* SLOT 4: Rolün 2. Ana Modülü */}
        <Tabs.Screen
          name="secondary"
          options={{
            title: slot4.label,
            tabBarIcon: ({ focused }) => (
              <Ionicons
                name={focused ? slot4.activeIcon : slot4.icon}
                size={22}
                color={focused ? iosColors.systemBlue : "#8E8E93"}
              />
            ),
          }}
        />

        {/* SLOT 5: Yetkili Modüller Kataloğu */}
        <Tabs.Screen
          name="modules"
          options={{
            title: "Modüller",
            tabBarIcon: ({ focused }) => (
              <Ionicons
                name={focused ? "grid" : "grid-outline"}
                size={22}
                color={focused ? iosColors.systemBlue : "#8E8E93"}
              />
            ),
          }}
        />
      </Tabs>

      {/* MERKEZ FAB BOTTOM SHEET */}
      <Modal
        visible={isFabOpen}
        animationType="slide"
        transparent
        onRequestClose={() => setIsFabOpen(false)}
      >
        <TouchableWithoutFeedback onPress={() => setIsFabOpen(false)}>
          <View style={styles.sheetBackdrop}>
            <TouchableWithoutFeedback>
              <View style={styles.sheetContent}>
                <View style={styles.dragHandle} />
                <View style={styles.sheetHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.sheetTitle}>Hızlı İşlemler</Text>
                    <Text style={styles.sheetSub} numberOfLines={1}>
                      {user?.name || "Kullanıcı"} • {getTenantBusinessBadge(tenantType)} •{" "}
                      {getRoleDisplayTitle(role)}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.sheetCloseBtn}
                    onPress={() => setIsFabOpen(false)}
                  >
                    <Ionicons name="close" size={20} color="#8E8E93" />
                  </TouchableOpacity>
                </View>

                <ScrollView
                  style={{ maxHeight: 420 }}
                  showsVerticalScrollIndicator={false}
                >
                  {fabActions.length === 0 ? (
                    <Text style={styles.emptyFabText}>
                      Bu rol için tanımlanmış hızlı oluşturma aksiyonu bulunmuyor.
                    </Text>
                  ) : (
                    <View style={styles.actionGrid}>
                      {fabActions.map((act) => (
                        <TouchableOpacity
                          key={act.id}
                          style={styles.actionCard}
                          activeOpacity={0.8}
                          onPress={() => handleOpenAction(act)}
                        >
                          <View
                            style={[
                              styles.actionIconCircle,
                              { backgroundColor: act.bgColor },
                            ]}
                          >
                            <Ionicons name={act.icon} size={21} color={act.color} />
                          </View>
                          <Text style={styles.actionTitle} numberOfLines={2}>
                            {act.title}
                          </Text>
                          <Text style={styles.actionSub} numberOfLines={2}>
                            {act.subtitle}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </ScrollView>
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
    top: -20,
    justifyContent: "center",
    alignItems: "center",
    width: 66,
    height: 66,
  },
  fabButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: iosColors.systemBlue,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: iosColors.background,
    shadowColor: iosColors.systemBlue,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 10,
    elevation: 8,
  },
  sheetBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.72)",
    justifyContent: "flex-end",
  },
  sheetContent: {
    backgroundColor: "#111827",
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    borderTopWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.12)",
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: Platform.OS === "ios" ? 36 : 22,
  },
  dragHandle: {
    width: 42,
    height: 5,
    borderRadius: 3,
    backgroundColor: "rgba(255, 255, 255, 0.25)",
    alignSelf: "center",
    marginBottom: 14,
  },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
    gap: 10,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  sheetSub: {
    fontSize: 11,
    color: iosColors.labelMuted,
    marginTop: 2,
  },
  sheetCloseBtn: {
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
    gap: 10,
    paddingBottom: 10,
  },
  actionCard: {
    width: (SCREEN_WIDTH - 46) / 2,
    backgroundColor: "rgba(255, 255, 255, 0.04)",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    padding: 13,
    gap: 5,
  },
  actionIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  actionTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  actionSub: {
    fontSize: 10,
    color: iosColors.labelMuted,
    lineHeight: 14,
  },
  emptyFabText: {
    color: iosColors.labelMuted,
    fontSize: 13,
    textAlign: "center",
    paddingVertical: 24,
  },
});
