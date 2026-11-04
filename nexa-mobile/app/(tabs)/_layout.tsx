import React from "react";
import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Platform, StyleSheet } from "react-native";
import { BlurView } from "expo-blur";
import { iosColors } from "../../src/theme/iosTheme";

/**
 * Nexa ERP Mobil - Apple iOS Standartlarında Gelişmiş Bottom Tab Navigation
 * Frosted Glass (BlurView) efektli, padding-bottom içeren şık alt menü.
 * Sırasıyla 8 tab:
 * 1. Ana Sayfa (Home)
 * 2. Jurnal (Clipboard)
 * 3. İş Emirleri (Check-Square)
 * 4. Puantaj (Clock / Time)
 * 5. İSG (Warning / Triangle)
 * 6. BIM AR (Cube / 3D)
 * 7. Telsiz (Chat / Walkie-Talkie)
 * 8. Profil (User / Person)
 *
 * Seçili (active) olan tab'ın ikonu doldurulmuş (solid) ve mavi renkte (#0A7AFF),
 * diğerleri çizgi (outline) ve gri renkte (#8E8E93).
 */
export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarBackground: () => (
          <BlurView
            intensity={Platform.OS === "ios" ? 40 : 25}
            tint="dark"
            style={StyleSheet.absoluteFill}
          />
        ),
        tabBarStyle: {
          position: "absolute",
          backgroundColor:
            Platform.OS === "ios"
              ? "rgba(10, 15, 28, 0.75)"
              : "rgba(10, 15, 28, 0.95)",
          borderTopColor: iosColors.glassBorder,
          borderTopWidth: 1,
          height: Platform.OS === "ios" ? 88 : 68,
          paddingBottom: Platform.OS === "ios" ? 28 : 10,
          paddingTop: 8,
          elevation: 12,
          shadowColor: "#000000",
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.25,
          shadowRadius: 10,
        },
        tabBarActiveTintColor: iosColors.systemBlue,
        tabBarInactiveTintColor: iosColors.labelMuted,
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: "600",
          letterSpacing: -0.2,
          marginTop: 2,
        },
      }}
    >
      {/* 1. Ana Sayfa (Home Icon) */}
      <Tabs.Screen
        name="index"
        options={{
          title: "Ana Sayfa",
          tabBarIcon: ({ focused, size }) => (
            <Ionicons
              name={focused ? "home" : "home-outline"}
              size={size || 21}
              color={focused ? "#0A7AFF" : "#8E8E93"}
            />
          ),
        }}
      />

      {/* 2. Jurnal (Clipboard Icon) */}
      <Tabs.Screen
        name="journal"
        options={{
          title: "Jurnal",
          tabBarIcon: ({ focused, size }) => (
            <Ionicons
              name={focused ? "clipboard" : "clipboard-outline"}
              size={size || 21}
              color={focused ? "#0A7AFF" : "#8E8E93"}
            />
          ),
        }}
      />

      {/* 3. İş Emirleri (Check-Square Icon) */}
      <Tabs.Screen
        name="tasks"
        options={{
          title: "İş Emirleri",
          tabBarIcon: ({ focused, size }) => (
            <Ionicons
              name={focused ? "checkbox" : "checkbox-outline"}
              size={size || 21}
              color={focused ? "#0A7AFF" : "#8E8E93"}
            />
          ),
        }}
      />

      {/* 4. Puantaj (Clock / Time Icon) */}
      <Tabs.Screen
        name="attendance"
        options={{
          title: "Puantaj",
          tabBarIcon: ({ focused, size }) => (
            <Ionicons
              name={focused ? "time" : "time-outline"}
              size={size || 21}
              color={focused ? "#0A7AFF" : "#8E8E93"}
            />
          ),
        }}
      />

      {/* 5. İSG (Warning / Triangle Icon) */}
      <Tabs.Screen
        name="safety"
        options={{
          title: "İSG",
          tabBarIcon: ({ focused, size }) => (
            <Ionicons
              name={focused ? "warning" : "warning-outline"}
              size={size || 21}
              color={focused ? "#0A7AFF" : "#8E8E93"}
            />
          ),
        }}
      />

      {/* 6. BIM AR (Cube / 3D Icon) */}
      <Tabs.Screen
        name="bim"
        options={{
          title: "BIM AR",
          tabBarIcon: ({ focused, size }) => (
            <Ionicons
              name={focused ? "cube" : "cube-outline"}
              size={size || 21}
              color={focused ? "#0A7AFF" : "#8E8E93"}
            />
          ),
        }}
      />

      {/* 7. Telsiz (Chat / Walkie-Talkie Icon) */}
      <Tabs.Screen
        name="chat"
        options={{
          title: "Telsiz",
          tabBarIcon: ({ focused, size }) => (
            <Ionicons
              name={focused ? "chatbubbles" : "chatbubbles-outline"}
              size={size || 21}
              color={focused ? "#0A7AFF" : "#8E8E93"}
            />
          ),
        }}
      />

      {/* 8. Profil (User / Person Icon) */}
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profil",
          tabBarIcon: ({ focused, size }) => (
            <Ionicons
              name={focused ? "person" : "person-outline"}
              size={size || 21}
              color={focused ? "#0A7AFF" : "#8E8E93"}
            />
          ),
        }}
      />
    </Tabs>
  );
}
