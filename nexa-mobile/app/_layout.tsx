import "../global.css";
import React, { useEffect } from "react";
import { Stack, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import * as Notifications from "expo-notifications";
import "../src/tasks/locationTask";

/**
 * ADIM 3: Foreground (Ön Plan) Bildirim Yöneticisi
 * Uygulama açıkken gelen bildirimlerin ekranın üstünden sesli bir uyarı ile (Alert / Sound / Banner) düşmesini sağlar.
 */
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

/**
 * Nexa ERP Mobil - Kök Düzen (Root Layout)
 * Global stiller, Dark Mode, Push Bildirimler ve Navigasyon Yığını
 */
export default function RootLayout() {
  const router = useRouter();

  useEffect(() => {
    // ADIM 3: Bildirime tıklandığında (Response listener) ilgili sayfaya yönlendirme (Deep Link / Routing)
    const subscription =
      Notifications.addNotificationResponseReceivedListener((response) => {
        try {
          const data = response.notification.request.content.data;
          console.log("[Notification Clicked] Bildirime tıklandı, hedef veri:", data);

          if (data?.route && typeof data.route === "string") {
            router.push(data.route as any);
          } else if (
            data?.type === "TASK" ||
            data?.type === "WORK_ORDER" ||
            data?.screen === "tasks"
          ) {
            router.push("/(tabs)/tasks");
          } else if (
            data?.type === "JOURNAL" ||
            data?.type === "SITE_DIARY" ||
            data?.screen === "journal"
          ) {
            router.push("/(tabs)/journal");
          } else if (
            data?.type === "INSPECTION" ||
            data?.type === "CONCRETE" ||
            data?.screen === "inspections"
          ) {
            router.push("/(tabs)/inspections");
          } else if (
            data?.type === "LOGISTICS" ||
            data?.type === "DELIVERY" ||
            data?.screen === "logistics"
          ) {
            router.push("/(tabs)/logistics");
          } else {
            router.push("/(tabs)");
          }
        } catch (routingErr) {
          console.warn("[Notifications] Bildirim yönlendirme uyarısı:", routingErr);
        }
      });

    return () => {
      subscription.remove();
    };
  }, [router]);

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
