import "../global.css";
import React from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import "../src/tasks/locationTask";

/**
 * Nexa ERP Mobil - Kök Düzen (Root Layout)
 * Global stiller, Dark Mode yapılandırması ve Navigasyon Yığını
 */
export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: {
            backgroundColor: "#090d16",
          },
          animation: "fade_from_bottom",
        }}
      >
        <Stack.Screen
          name="index"
          options={{
            headerShown: false,
            title: "Nexa ERP Giriş",
          }}
        />
        <Stack.Screen
          name="(tabs)"
          options={{
            headerShown: false,
          }}
        />
      </Stack>
    </SafeAreaProvider>
  </GestureHandlerRootView>
  );
}
