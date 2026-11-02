import React from "react";
import { Tabs } from "expo-router";
import { Feather } from "@expo/vector-icons";

/**
 * Nexa ERP Mobil - Alt Sekme Navigasyonu (Bottom Tab Bar Layout)
 * Koyu tema (Dark Mode), gray-900 zemin, gray-800 border ve blue-500 aktif vurgu
 */
export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: "#111827", // gray-900
          borderTopColor: "#1F2937", // gray-800
          borderTopWidth: 1,
          height: 65,
          paddingBottom: 10,
          paddingTop: 8,
        },
        tabBarActiveTintColor: "#3B82F6", // blue-500
        tabBarInactiveTintColor: "#9CA3AF", // gray-400
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "600",
        },
      }}
    >
      {/* 1. Ana Sayfa */}
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

      {/* 3. İş Emirleri */}
      <Tabs.Screen
        name="tasks"
        options={{
          title: "İş Emirleri",
          tabBarIcon: ({ color, size }) => (
            <Feather name="check-square" size={size || 22} color={color as string} />
          ),
        }}
      />

      {/* 4. Profil */}
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profil",
          tabBarIcon: ({ color, size }) => (
            <Feather name="user" size={size || 22} color={color as string} />
          ),
        }}
      />
    </Tabs>
  );
}
