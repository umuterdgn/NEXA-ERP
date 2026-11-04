import React from "react";
import { Tabs } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { Platform } from "react-native";
import { iosColors } from "../../src/theme/iosTheme";

/**
 * Nexa ERP Mobil - Apple iOS Standartlarında Sadeleştirilmiş Alt Sekme (Bottom Tab Bar)
 * Sadece 6 ana operasyonel sekme: Ana Sayfa, Jurnal, Puantaj, İSG, Telsiz, Profil.
 * Koyu zemin (#0A0F1C), Frosted Glass border ve iOS Sistem Mavisi (#0A7AFF) aktif vurgu.
 */
export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: iosColors.background,
          borderTopColor: iosColors.glassBorder,
          borderTopWidth: 1,
          height: Platform.OS === "ios" ? 88 : 68,
          paddingBottom: Platform.OS === "ios" ? 28 : 10,
          paddingTop: 8,
          elevation: 10,
          shadowColor: "#000000",
          shadowOffset: { width: 0, height: -3 },
          shadowOpacity: 0.15,
          shadowRadius: 8,
        },
        tabBarActiveTintColor: iosColors.systemBlue,
        tabBarInactiveTintColor: iosColors.labelMuted,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "600",
          letterSpacing: -0.2,
        },
      }}
    >
      {/* 1. Ana Sayfa (Role-Based Dynamic Dashboard) */}
      <Tabs.Screen
        name="index"
        options={{
          title: "Ana Sayfa",
          tabBarIcon: ({ color, size }) => (
            <Feather name="home" size={size || 22} color={color as string} />
          ),
        }}
      />

      {/* 2. Şantiye Jurnali */}
      <Tabs.Screen
        name="journal"
        options={{
          title: "Jurnal",
          tabBarIcon: ({ color, size }) => (
            <Feather name="clipboard" size={size || 22} color={color as string} />
          ),
        }}
      />

      {/* 3. Akıllı Puantaj (NFC & GPS Turnike) */}
      <Tabs.Screen
        name="attendance"
        options={{
          title: "Puantaj",
          tabBarIcon: ({ color, size }) => (
            <Feather name="clock" size={size || 22} color={color as string} />
          ),
        }}
      />

      {/* 4. İSG & Güvenlik Raporlama */}
      <Tabs.Screen
        name="safety"
        options={{
          title: "İSG",
          tabBarIcon: ({ color, size }) => (
            <Feather name="alert-triangle" size={size || 22} color={color as string} />
          ),
        }}
      />

      {/* 5. Şantiye Haberleşme & Telsiz (PTT) */}
      <Tabs.Screen
        name="chat"
        options={{
          title: "Telsiz",
          tabBarIcon: ({ color, size }) => (
            <Feather name="radio" size={size || 22} color={color as string} />
          ),
        }}
      />

      {/* 6. Profil */}
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profil",
          tabBarIcon: ({ color, size }) => (
            <Feather name="user" size={size || 22} color={color as string} />
          ),
        }}
      />

      {/* Arka plan / yedek sekmeler (Tab bar'da gizli) */}
      <Tabs.Screen
        name="tasks"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}
