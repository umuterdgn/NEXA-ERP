/**
 * © 2026 NXA Software. All rights reserved.
 * Nexa ERP Mobil - Kamera & Fotoğraf Yükleme Yardımcısı
 * Çevrimiçiyken /api/upload üzerinden kalıcı URL alır, çevrimdışıyken sıkıştırılmış Base64 döner.
 */

import * as ImagePicker from "expo-image-picker";
import NetInfo from "@react-native-community/netinfo";
import { Alert } from "react-native";
import { API_BASE_URL, loadSecureTokens } from "./apiClient";

export interface CapturedPhotoResult {
  photoUrl: string;
  base64?: string;
  previewUri: string;
}

export async function captureAndResolvePhotoUrl(opts: {
  source: "camera" | "gallery";
  sourceModule: string;
  projectId?: string;
}): Promise<CapturedPhotoResult | null> {
  try {
    if (opts.source === "camera") {
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (!perm.granted) {
        Alert.alert(
          "Kamera İzni Gerekli",
          "Fotoğraf çekebilmek için ayarlarınızdan kamera izni vermelisiniz."
        );
        return null;
      }
    } else {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        Alert.alert(
          "Galeri İzni Gerekli",
          "Fotoğraf seçebilmek için medya kütüphanesi izni vermelisiniz."
        );
        return null;
      }
    }

    const result =
      opts.source === "camera"
        ? await ImagePicker.launchCameraAsync({
            mediaTypes: ["images"],
            quality: 0.45,
            base64: true,
          })
        : await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ["images"],
            quality: 0.45,
            base64: true,
          });

    if (result.canceled || !result.assets?.[0]) {
      return null;
    }

    const asset = result.assets[0];
    const dataUrl = asset.base64
      ? `data:image/jpeg;base64,${asset.base64}`
      : asset.uri;

    const net = await NetInfo.fetch();
    const isOnline = Boolean(net.isConnected && net.isInternetReachable !== false);

    if (isOnline) {
      try {
        const { accessToken } = await loadSecureTokens();
        const formData = new FormData();
        formData.append("file", {
          uri: asset.uri,
          name: `mobile_${opts.sourceModule}_${Date.now()}.jpg`,
          type: asset.mimeType || "image/jpeg",
        } as any);
        formData.append("sourceModule", opts.sourceModule);
        formData.append("category", "SAHA_FOTO");
        if (opts.projectId) {
          formData.append("projectId", opts.projectId);
        }

        const uploadRes = await fetch(`${API_BASE_URL}/api/upload`, {
          method: "POST",
          headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
          body: formData,
        });

        if (uploadRes.ok) {
          const uploadJson = await uploadRes.json().catch(() => null);
          if (uploadJson?.url && typeof uploadJson.url === "string") {
            const resolvedUrl = uploadJson.url.startsWith("/")
              ? `${API_BASE_URL}${uploadJson.url}`
              : uploadJson.url;
            return {
              photoUrl: resolvedUrl,
              base64: asset.base64 || undefined,
              previewUri: asset.uri,
            };
          }
        }
      } catch (uploadErr) {
        console.warn("[mediaHelper] Upload fallback dataUrl:", uploadErr);
      }
    }

    return {
      photoUrl: dataUrl,
      base64: asset.base64 || undefined,
      previewUri: asset.uri,
    };
  } catch (err: any) {
    Alert.alert("Kamera Hatası", err?.message || "Fotoğraf alınamadı.");
    return null;
  }
}

