/**
 * © 2026 NXA Software. All rights reserved.
 * Nexa ERP Mobil - AI Görsel Saha Kusur & İSG İhlali Tarayıcı (POST /api/mobile/ai/vision)
 */

import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useAuth } from "../context/AuthContext";
import { extractErrorMessage, mobileApi } from "../services/apiClient";
import { captureAndResolvePhotoUrl } from "../services/mediaHelper";
import { GlassCard, ScreenHeader, StatusBadge } from "../components/ui/NexaUI";
import { iosColors } from "../theme/iosTheme";
import type { AiVisionAnalysis } from "../types/api";

export default function AiVisionScreen() {
  const router = useRouter();
  const { activeProject, hasModule } = useAuth();

  const [previewUri, setPreviewUri] = useState("");
  const [imageBase64, setImageBase64] = useState<string | undefined>(undefined);
  const [imageUrl, setImageUrl] = useState<string | undefined>(undefined);
  const [prompt, setPrompt] = useState(
    "Beton imalatı, donatı/kalıp uygunluğu ve İSG KKD ihlallerini analiz et."
  );
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<AiVisionAnalysis | null>(null);

  const pickImage = async (source: "camera" | "gallery") => {
    const res = await captureAndResolvePhotoUrl({
      source,
      sourceModule: "AI_VISION_SCAN",
      projectId: activeProject?.id,
    });
    if (res) {
      setPreviewUri(res.previewUri);
      setImageBase64(res.base64);
      setImageUrl(res.photoUrl.startsWith("http") ? res.photoUrl : undefined);
      setAnalysis(null);
    }
  };

  const handleAnalyze = async () => {
    if (!imageBase64 && !imageUrl) {
      Alert.alert("Görsel Gerekli", "Analiz için kamera veya galeriden fotoğraf seçin.");
      return;
    }
    setAnalyzing(true);
    try {
      const res = await mobileApi.ai.analyzeVision({
        imageBase64,
        imageUrl,
        prompt: prompt.trim() || undefined,
      });
      setAnalysis(res.analysis);
    } catch (err: any) {
      Alert.alert("AI Analizi Yapılamadı", extractErrorMessage(err));
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      <ScreenHeader
        title="AI Görsel Saha Tarayıcı"
        subtitle="Gemini Vision ile Çatlak, Kalıp & İSG Tespiti"
      />

      <ScrollView contentContainerStyle={styles.scroll}>
        <GlassCard style={styles.card}>
          <Text style={styles.eyebrow}>1. SAHA FOTOĞRAFI ÇEK VEYA SEÇ</Text>
          <View style={styles.row2}>
            <TouchableOpacity
              style={styles.pickBtn}
              onPress={() => pickImage("camera")}
            >
              <Ionicons name="camera" size={20} color="#0A7AFF" />
              <Text style={styles.pickBtnTxt}>Kamera İle Çek</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.pickBtn}
              onPress={() => pickImage("gallery")}
            >
              <Ionicons name="images" size={20} color="#34C759" />
              <Text style={[styles.pickBtnTxt, { color: "#34C759" }]}>
                Galeriden Yükle
              </Text>
            </TouchableOpacity>
          </View>

          {previewUri ? (
            <Image
              source={{ uri: previewUri }}
              style={styles.previewImg}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.placeholderBox}>
              <Ionicons name="scan-outline" size={38} color="#6E6E73" />
              <Text style={styles.placeholderTxt}>
                Yapay zeka analizi için henüz fotoğraf seçilmedi.
              </Text>
            </View>
          )}

          <Text style={styles.eyebrow}>2. ANALİZ YÖNERGESİ</Text>
          <TextInput
            style={styles.input}
            value={prompt}
            onChangeText={setPrompt}
            multiline
            placeholder="Kontrol edilmesini istediğiniz odak noktasını yazın..."
            placeholderTextColor="#6E6E73"
          />

          <TouchableOpacity
            style={[
              styles.analyzeBtn,
              (!previewUri || analyzing) && { opacity: 0.6 },
            ]}
            onPress={handleAnalyze}
            disabled={!previewUri || analyzing}
          >
            {analyzing ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <Ionicons name="sparkles" size={18} color="#FFFFFF" />
                <Text style={styles.analyzeBtnTxt}>AI İle Analiz Et</Text>
              </>
            )}
          </TouchableOpacity>
        </GlassCard>

        {analysis && (
          <GlassCard style={styles.resultCard}>
            <View style={styles.rowBetween}>
              <View style={{ flex: 1 }}>
                <Text style={styles.eyebrow}>YAPAY ZEKA RAPORU</Text>
                <Text style={styles.resultTitle}>
                  {analysis.hasDefect
                    ? analysis.defectType || "Uygunsuzluk Tespit Edildi"
                    : "Kritik Kusur Saptanmadı"}
                </Text>
              </View>
              <StatusBadge status={analysis.severity} />
            </View>

            <View style={styles.metaBar}>
              <Text style={styles.metaChip}>
                Güven Skoru: %{Math.round((analysis.confidence || 0) * (analysis.confidence <= 1 ? 100 : 1))}
              </Text>
              {analysis.location ? (
                <Text style={styles.metaChip}>{analysis.location}</Text>
              ) : null}
            </View>

            <Text style={styles.sectionSub}>Tespit Özeti</Text>
            <Text style={styles.resultText}>{analysis.summary}</Text>

            <Text style={styles.sectionSub}>Önerilen Saha Aksiyonu</Text>
            <Text style={styles.resultText}>{analysis.recommendedAction}</Text>

            {hasModule("deficiencies", "ncr_dof") && (
              <TouchableOpacity
                style={styles.deficiencyBtn}
                onPress={() => router.push("/screen/deficiencies" as any)}
              >
                <Ionicons name="warning-outline" size={18} color="#FFFFFF" />
                <Text style={styles.deficiencyBtnTxt}>
                  Kusur / DÖF Kaydına Geç
                </Text>
              </TouchableOpacity>
            )}
          </GlassCard>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: iosColors.background },
  scroll: { padding: 16, paddingBottom: 120, gap: 14 },
  card: { gap: 12 },
  eyebrow: {
    color: "#8E8E93",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.7,
  },
  row2: { flexDirection: "row", gap: 10 },
  pickBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: "rgba(10,122,255,0.12)",
    borderWidth: 1,
    borderColor: "rgba(10,122,255,0.32)",
  },
  pickBtnTxt: { color: "#3B9EFF", fontSize: 13, fontWeight: "700" },
  previewImg: { width: "100%", height: 210, borderRadius: 14 },
  placeholderBox: {
    height: 150,
    borderRadius: 14,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: "rgba(255,255,255,0.16)",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 20,
  },
  placeholderTxt: { color: "#8E8E93", fontSize: 12, textAlign: "center" },
  input: {
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    borderRadius: 12,
    padding: 12,
    color: "#FFFFFF",
    fontSize: 13,
    minHeight: 68,
    textAlignVertical: "top",
  },
  analyzeBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#00C7BE",
    borderRadius: 14,
    paddingVertical: 14,
  },
  analyzeBtnTxt: { color: "#FFFFFF", fontSize: 15, fontWeight: "800" },
  resultCard: { gap: 10 },
  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 10,
  },
  resultTitle: { color: "#FFFFFF", fontSize: 17, fontWeight: "800", marginTop: 4 },
  metaBar: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  metaChip: {
    color: "#3B9EFF",
    fontSize: 11,
    fontWeight: "700",
    backgroundColor: "rgba(10,122,255,0.15)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  sectionSub: { color: "#FFFFFF", fontSize: 13, fontWeight: "700", marginTop: 4 },
  resultText: { color: "rgba(235,235,245,0.82)", fontSize: 13, lineHeight: 19 },
  deficiencyBtn: {
    marginTop: 6,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#FF3B30",
    borderRadius: 12,
    paddingVertical: 12,
  },
  deficiencyBtnTxt: { color: "#FFFFFF", fontSize: 14, fontWeight: "700" },
});

