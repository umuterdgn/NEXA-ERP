import React from "react";
import { Tabs } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useAuth } from "../../src/hooks/useAuth";

/**
 * Nexa ERP Mobil - Alt Sekme Navigasyonu (Bottom Tab Bar Layout)
 * Koyu tema (Dark Mode), gray-900 zemin, gray-800 border ve blue-500 aktif vurgu
 */
export default function TabLayout() {
  const { role } = useAuth();
  const canAccessLogistics =
    role === "DRIVER" ||
    role === "WAREHOUSE" ||
    role === "LOGISTICS" ||
    role === "ADMIN";

  const canAccessInspections =
    role === "INSPECTOR" ||
    role === "ADMIN";

  const canAccessSubcontractor =
    role === "SUBCONTRACTOR" ||
    role === "ADMIN";

  const canAccessEngineering =
    role === "ENGINEER" ||
    role === "FOREMAN" ||
    role === "ADMIN";

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

      {/* 4. Malzeme Kabul (Lojistik & Şoför) */}
      <Tabs.Screen
        name="logistics"
        options={{
          title: "Malzeme Kabul",
          href: canAccessLogistics ? "/logistics" : null,
          tabBarIcon: ({ color, size }) => (
            <Feather name="truck" size={size || 22} color={color as string} />
          ),
        }}
      />

      {/* 5. Yapı Denetim (INSPECTOR) */}
      <Tabs.Screen
        name="inspections"
        options={{
          title: "Denetim",
          href: canAccessInspections ? "/inspections" : null,
          tabBarIcon: ({ color, size }) => (
            <Feather name="check-circle" size={size || 22} color={color as string} />
          ),
        }}
      />

      {/* 6. Akıllı Puantaj (NFC & Geofence) */}
      <Tabs.Screen
        name="attendance"
        options={{
          title: "Puantaj",
          tabBarIcon: ({ color, size }) => (
            <Feather name="clock" size={size || 22} color={color as string} />
          ),
        }}
      />

      {/* 7. İSG & Güvenlik Raporlama */}
      <Tabs.Screen
        name="safety"
        options={{
          title: "İSG",
          tabBarIcon: ({ color, size }) => (
            <Feather name="alert-triangle" size={size || 22} color={color as string} />
          ),
        }}
      />

      {/* 8. Taşeron Portalı & Hakediş (SUBCONTRACTOR) */}
      <Tabs.Screen
        name="subcontractor"
        options={{
          title: "Taşeron",
          href: canAccessSubcontractor ? "/subcontractor" : null,
          tabBarIcon: ({ color, size }) => (
            <Feather name="layers" size={size || 22} color={color as string} />
          ),
        }}
      />

      {/* 9. BIM & AR Saha Mühendisliği (ENGINEER & FOREMAN) */}
      <Tabs.Screen
        name="engineering"
        options={{
          title: "BIM AR",
          href: canAccessEngineering ? "/engineering" : null,
          tabBarIcon: ({ color, size }) => (
            <Feather name="box" size={size || 22} color={color as string} />
          ),
        }}
      />

      {/* 10. Şantiye İç Haberleşme & Telsiz (iMessage) */}
      <Tabs.Screen
        name="chat"
        options={{
          title: "Telsiz & Chat",
          tabBarIcon: ({ color, size }) => (
            <Feather name="message-circle" size={size || 22} color={color as string} />
          ),
        }}
      />

      {/* 11. Profil */}
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
