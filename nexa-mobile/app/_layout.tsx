/**
 * © 2026 NXA Software. All rights reserved.
 * Nexa ERP Mobil - Kök Düzen (Root Layout)
 */

import "../global.css";
import React, { useEffect } from "react";
import { Stack, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import * as Notifications from "expo-notifications";
import { MobileThemeProvider } from "../src/context/ThemeContext";
import { AuthProvider } from "../src/context/AuthContext";

try {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });
} catch {}

export default function RootLayout() {
  const router = useRouter();

  useEffect(() => {
    let sub: { remove: () => void } | null = null;
    try {
      sub = Notifications.addNotificationResponseReceivedListener((response) => {
        try {
          const data = response.notification.request.content.data as any;
          if (data?.route && typeof data.route === "string") {
            router.push(data.route as any);
          } else if (data?.type === "TASK" || data?.type === "WORK_ORDER") {
            router.push("/screen/tasks");
          } else if (data?.type === "JOURNAL") {
            router.push("/screen/journal");
          } else if (data?.type === "SOS" || data?.type === "ISG") {
            router.push("/screen/isg");
          } else {
            router.push("/(tabs)");
          }
        } catch {}
      });
    } catch {}
    return () => {
      sub?.remove?.();
    };
  }, [router]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <MobileThemeProvider>
          <AuthProvider>
            <StatusBar style="light" />
            <Stack
              screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: "#0A0F1C" },
                animation: "fade_from_bottom",
              }}
            >
              <Stack.Screen name="index" options={{ headerShown: false }} />
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              <Stack.Screen name="screen/[moduleId]" options={{ headerShown: false }} />
              <Stack.Screen name="sso" options={{ headerShown: false }} />
              <Stack.Screen name="sync-queue" options={{ headerShown: false }} />
              <Stack.Screen name="qr-id" options={{ headerShown: false }} />
              <Stack.Screen name="profile" options={{ headerShown: false }} />
            </Stack>
          </AuthProvider>
        </MobileThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
