/**
 * © 2026 NXA Software. All rights reserved.
 * Nexa ERP Mobil - 3D BIM, X-Ray, AR, DWG & Web Raporlar İçin Tek Kullanımlık SSO Köprüsü
 */

import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { WebView } from "react-native-webview";
import { useAuth } from "../context/AuthContext";
import {
  extractErrorMessage,
  mobileApi,
  resolveFullWebUrl,
} from "../services/apiClient";
import { EmptyState, ScreenHeader } from "../components/ui/NexaUI";
import { iosColors } from "../theme/iosTheme";

const NativeWebView = WebView as unknown as React.ComponentType<any>;

export default function SsoWebViewScreen({
  title = "Nexa Web Portal",
  targetRoute,
  projectId,
}: {
  title?: string;
  targetRoute?: string;
  projectId?: string;
}) {
  const { activeProject } = useAuth();
  const webViewRef = useRef<any>(null);

  const [ssoUrl, setSsoUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [webLoading, setWebLoading] = useState(true);
  const [fullscreen, setFullscreen] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const effectiveProjectId = projectId || activeProject?.id;

  const fetchSso = useCallback(async () => {
    try {
      setLoading(true);
      setErrorMsg(null);
      const res = await mobileApi.auth.getSsoToken({
        projectId: effectiveProjectId,
        targetRoute,
      });
      const chosen = targetRoute
        ? res.endpoints?.customTargetUrl || res.endpoints?.bimViewerUrl
        : res.endpoints?.bimViewerUrl;
      setSsoUrl(resolveFullWebUrl(chosen));
    } catch (err: any) {
      setErrorMsg(
        extractErrorMessage(err, "SSO güvenlik bileti sunucudan alınamadı.")
      );
    } finally {
      setLoading(false);
    }
  }, [effectiveProjectId, targetRoute]);

  useEffect(() => {
    fetchSso();
  }, [fetchSso]);

  return (
    <SafeAreaView style={styles.container} edges={fullscreen ? [] : ["top", "left", "right"]}>
      {!fullscreen && (
        <ScreenHeader
          title={title}
          subtitle="5 dk SSO Web Köprüsü"
          rightAction={
            <View style={{ flexDirection: "row", gap: 8 }}>
              <TouchableOpacity
                style={styles.topBtn}
                onPress={() => webViewRef.current?.reload()}
              >
                <Ionicons name="refresh" size={18} color="#FFFFFF" />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.topBtn}
                onPress={() => setFullscreen(true)}
              >
                <Ionicons name="expand-outline" size={18} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          }
        />
      )}

      {loading ? (
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color={iosColors.systemBlue} />
          <Text style={styles.loadingText}>
            Tek kullanımlık SSO oturum bileti hazırlanıyor...
          </Text>
        </View>
      ) : errorMsg || !ssoUrl ? (
        <View style={{ padding: 20 }}>
          <EmptyState
            icon="globe-outline"
            title="Web Modülü Açılamadı"
            subtitle={errorMsg || "Geçerli SSO adresi üretilemedi."}
            actionLabel="Yeniden Dene"
            onAction={fetchSso}
          />
        </View>
      ) : (
        <View style={{ flex: 1 }}>
          <NativeWebView
            ref={webViewRef}
            source={{ uri: ssoUrl }}
            style={{ flex: 1, backgroundColor: iosColors.background }}
            javaScriptEnabled
            domStorageEnabled
            allowsInlineMediaPlayback
            onLoadStart={() => setWebLoading(true)}
            onLoadEnd={() => setWebLoading(false)}
          />
          {webLoading && (
            <View style={styles.progressBarWrap}>
              <ActivityIndicator size="small" color="#0A7AFF" />
              <Text style={styles.progressText}>Web görünümü yükleniyor...</Text>
            </View>
          )}
          {fullscreen && (
            <TouchableOpacity
              style={styles.exitFullscreenBtn}
              onPress={() => setFullscreen(false)}
            >
              <Ionicons name="contract-outline" size={18} color="#FFFFFF" />
              <Text style={styles.exitFullscreenText}>Çıkış</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: iosColors.background,
  },
  topBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  centerBox: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    paddingHorizontal: 24,
  },
  loadingText: {
    fontSize: 13,
    color: iosColors.labelMuted,
    textAlign: "center",
  },
  progressBarWrap: {
    position: "absolute",
    top: 12,
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(10, 15, 28, 0.92)",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
  },
  progressText: {
    fontSize: 12,
    color: "#FFFFFF",
    fontWeight: "600",
  },
  exitFullscreenBtn: {
    position: "absolute",
    top: 46,
    right: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(10, 15, 28, 0.88)",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  exitFullscreenText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
  },
});
