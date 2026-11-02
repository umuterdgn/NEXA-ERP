import { useState, useEffect, useRef } from "react";
import { Platform } from "react-native";
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import Constants from "expo-constants";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { api } from "../lib/api";
import { useAuth, AuthUser } from "./useAuth";

export const PUSH_TOKEN_STORAGE_KEY = "@nexa_device_push_token";

/**
 * Kullanıcı cihazından bildirim izni (Permissions) isteyen ve
 * Notifications.getExpoPushTokenAsync() ile benzersiz cihaz Token'ını alan fonksiyon.
 * Token alındığında backend'deki User modeline (pushToken alanı) Axios isteğiyle kaydeder.
 */
export async function registerForPushNotificationsAsync(
  user?: { id?: string; email?: string; name?: string; role?: string } | null
): Promise<string | null> {
  let token: string | null = null;

  try {
    // 1. Android için varsayılan yüksek öncelikli bildirim kanalı tanımla
    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("default", {
        name: "Nexa ERP Anlık Bildirimler",
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#2563EB",
        sound: "default",
      });
    }

    // 2. Fiziksel cihaz kontrolü ve izin isteme
    if (Device.isDevice) {
      const { status: existingStatus } =
        await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== "granted") {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== "granted") {
        console.warn("[PushNotifications] Bildirim izni kullanıcı tarafından verilmedi.");
        return null;
      }

      // 3. EAS / Expo Project ID belirleme
      const projectId =
        Constants?.expoConfig?.extra?.eas?.projectId ??
        Constants?.easConfig?.projectId;

      const pushTokenResult = await Notifications.getExpoPushTokenAsync(
        projectId ? { projectId } : undefined
      );

      token = pushTokenResult.data;
      console.log("[PushNotifications] Cihaz token'ı başarıyla alındı:", token);
    } else {
      console.log(
        "[PushNotifications] Simülatör / Emülatör üzerinde çalışılıyor, geliştirici mock token atanıyor."
      );
      token = `ExponentPushToken[mock_${Platform.OS}_${Date.now()}]`;
    }

    // 4. Token'ı yerel hafızaya sakla ve backend'e gönder
    if (token) {
      await AsyncStorage.setItem(PUSH_TOKEN_STORAGE_KEY, token);

      // Backend Axios İsteği: User modeline pushToken kaydı
      try {
        await api.post("/user/push-token", {
          userId: user?.id,
          email: user?.email,
          pushToken: token,
          platform: Platform.OS,
          deviceName: Device.modelName || Device.deviceName || "Mobil Cihaz",
        });
        console.log("[PushNotifications] Token backend User modeline başarıyla kaydedildi.");
      } catch (apiErr: any) {
        console.warn(
          "[PushNotifications] Backend push-token kayıt uyarısı:",
          apiErr?.response?.data || apiErr?.message || apiErr
        );
      }
    }
  } catch (error: any) {
    console.error("[PushNotifications] Token alma işlemi sırasında hata:", error?.message || error);
  }

  return token;
}

/**
 * Nexa ERP - Push Bildirim Yönetimi Hook'u
 */
export function usePushNotifications() {
  const { user } = useAuth();
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const [notification, setNotification] =
    useState<Notifications.Notification | null>(null);
  const notificationListener = useRef<Notifications.EventSubscription | null>(
    null
  );

  useEffect(() => {
    // Uygulama açılışında veya kullanıcı oturumu değiştiğinde token al ve backend'e kaydet
    (async () => {
      // Önce yerel önbellekteki token'ı kontrol et
      const cachedToken = await AsyncStorage.getItem(PUSH_TOKEN_STORAGE_KEY);
      if (cachedToken) {
        setExpoPushToken(cachedToken);
      }

      // Ardından taze token alıp backend'i güncelle
      const freshToken = await registerForPushNotificationsAsync(user);
      if (freshToken) {
        setExpoPushToken(freshToken);
      }
    })();

    // Ön planda (foreground) gelen bildirimleri dinle
    notificationListener.current =
      Notifications.addNotificationReceivedListener((incomingNotification) => {
        console.log(
          "[PushNotifications] Ön planda bildirim yakalandı:",
          incomingNotification.request.content.title
        );
        setNotification(incomingNotification);
      });

    return () => {
      if (notificationListener.current) {
        notificationListener.current.remove();
      }
    };
  }, [user?.id, user?.email]);

  return {
    expoPushToken,
    notification,
    registerToken: () => registerForPushNotificationsAsync(user),
  };
}

export default usePushNotifications;
