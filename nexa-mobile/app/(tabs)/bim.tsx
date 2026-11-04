/**
 * © 2026 NXA Software. All rights reserved.
 * Nexa ERP Mobil - BIM & AR Saha Mühendisliği Ekranı
 *
 * - 3D IFC/GLB Model İnceleme
 * - Çevrimdışı Model İndirme (expo-file-system)
 * - AR Saha Çakıştırma ve Ölçüm
 */

import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { useOfflineBIM } from "../../src/hooks/useOfflineBIM";
import { iosColors, iosRadius } from "../../src/theme/iosTheme";

export default function BimArScreen() {
  const {
    isDownloaded,
    isDownloading,
    downloadProgress,
    fileSizeMB,
    lastDownloadedAt,
    downloadModel,
    deleteLocalModel,
  } = useOfflineBIM();

  const [activeModel, setActiveModel] = useState("Merkez Rezidans - Blok A & B");
  const [isArActive, setIsArActive] = useState(false);

  const handleDownload = async () => {
    try {
      await downloadModel();
      Alert.alert(
        "✅ BIM Modeli İndirildi",
        "3D Yapı modeli cihazınıza başarıyla kaydedildi. Şantiyede çevrimdışı (offline) olarak inceleyebilirsiniz."
      );
    } catch (e: any) {
      Alert.alert("İndirme Hatası", e.message || "Model indirilemedi.");
    }
  };

  const handleDelete = () => {
    Alert.alert(
      "Modeli Sil",
      "Cihazdaki yerel BIM model dosyasını silmek istediğinize emin misiniz?",
      [
        { text: "Vazgeç", style: "cancel" },
        {
          text: "Sil",
          style: "destructive",
          onPress: async () => {
            await deleteLocalModel();
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safeContainer} edges={["top", "left", "right"]}>
      {/* 1. Üst Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerSubtitle}>3D SAHA MÜHENDİSLİĞİ</Text>
          <Text style={styles.headerTitle}>BIM & AR Görüntüleyici</Text>
        </View>

        <View style={styles.statusBadge}>
          <Ionicons
            name={isDownloaded ? "cube" : "cloud-download-outline"}
            size={14}
            color={isDownloaded ? iosColors.systemGreen : iosColors.systemBlue}
          />
          <Text
            style={[
              styles.statusBadgeText,
              { color: isDownloaded ? iosColors.systemGreen : iosColors.systemBlue },
            ]}
          >
            {isDownloaded ? "Çevrimdışı Hazır" : "Bulut Modeli"}
          </Text>
        </View>
      </View>

      <ScrollView
        style={styles.scrollArea}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Model Önizleme Kartı */}
        <View style={styles.viewerCard}>
          {Platform.OS === "ios" && (
            <BlurView intensity={25} tint="dark" style={StyleSheet.absoluteFill} />
          )}

          <View style={styles.previewCanvas}>
            <MaterialCommunityIcons
              name="cube-scan"
              size={64}
              color={iosColors.systemBlue}
            />
            <Text style={styles.canvasTitle}>3D IFC / GLB Dijital İkiz</Text>
            <Text style={styles.canvasSubtitle}>
              {activeModel} • Statik & Mekanik Proje
            </Text>

            {isDownloading && (
              <View style={styles.downloadProgressBox}>
                <ActivityIndicator size="small" color={iosColors.systemBlue} />
                <Text style={styles.downloadProgressText}>
                  İndiriliyor... %{Math.round(downloadProgress * 100)}
                </Text>
                <View style={styles.progressBarTrack}>
                  <View
                    style={[
                      styles.progressBarFill,
                      { width: `${Math.round(downloadProgress * 100)}%` },
                    ]}
                  />
                </View>
              </View>
            )}
          </View>

          {/* Model Bilgileri */}
          <View style={styles.metaRow}>
            <View style={styles.metaCol}>
              <Text style={styles.metaLabel}>Dosya Boyutu</Text>
              <Text style={styles.metaValue}>{fileSizeMB ? `${fileSizeMB} MB` : "14.8 MB"}</Text>
            </View>
            <View style={styles.metaCol}>
              <Text style={styles.metaLabel}>Son Güncelleme</Text>
              <Text style={styles.metaValue}>Kasım 2026</Text>
            </View>
            <View style={styles.metaCol}>
              <Text style={styles.metaLabel}>Format</Text>
              <Text style={styles.metaValue}>IFC 4.3 / GLTF</Text>
            </View>
          </View>
        </View>

        {/* Aksiyon Butonları */}
        <View style={styles.actionSection}>
          {/* AR Canlı Saha Kamerası */}
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => setIsArActive(!isArActive)}
            style={styles.arButton}
          >
            <MaterialCommunityIcons name="augmented-reality" size={24} color="#FFFFFF" />
            <Text style={styles.arButtonText}>
              {isArActive ? "AR Modunu Kapat" : "AR Saha Çakıştırmasını Başlat"}
            </Text>
          </TouchableOpacity>

          {/* Çevrimdışı İndirme / Silme */}
          {isDownloaded ? (
            <TouchableOpacity
              onPress={handleDelete}
              activeOpacity={0.8}
              style={styles.deleteButton}
            >
              <Feather name="trash-2" size={16} color={iosColors.systemRed} />
              <Text style={styles.deleteButtonText}>Cihazdaki Yerel Modeli Sil</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              onPress={handleDownload}
              disabled={isDownloading}
              activeOpacity={0.85}
              style={styles.downloadButton}
            >
              <Feather name="download-cloud" size={18} color="#FFFFFF" />
              <Text style={styles.downloadButtonText}>
                Çevrimdışı İncelemek İçin İndir
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Kat & Disiplin Seçimi */}
        <Text style={styles.sectionHeading}>PROJE DİSİPLİNLERİ</Text>
        <View style={styles.disciplinesGrid}>
          {[
            { id: "arch", name: "Mimari Model", count: "1.240 Öğe", icon: "home" },
            { id: "struct", name: "Statik & Betonarme", count: "860 Öğe", icon: "layers" },
            { id: "mep", name: "Mekanik & Tesisat", count: "420 Öğe", icon: "tool" },
            { id: "elec", name: "Elektrik & Pano", count: "310 Öğe", icon: "zap" },
          ].map((disc) => (
            <View key={disc.id} style={styles.disciplineCard}>
              <View style={styles.discIconBox}>
                <Feather name={disc.icon as any} size={16} color={iosColors.systemBlue} />
              </View>
              <Text style={styles.discName}>{disc.name}</Text>
              <Text style={styles.discCount}>{disc.count}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: iosColors.background,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: iosColors.glassBorder,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerSubtitle: {
    fontSize: 11,
    fontWeight: "700",
    color: iosColors.labelSecondary,
    letterSpacing: 0.8,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: iosColors.labelPrimary,
    letterSpacing: -0.3,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: iosRadius.pill,
    borderWidth: 1,
    borderColor: iosColors.glassBorder,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: "700",
  },
  scrollArea: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  viewerCard: {
    backgroundColor: iosColors.glassCard,
    borderRadius: iosRadius.cardLarge,
    borderWidth: 1,
    borderColor: iosColors.glassBorder,
    overflow: "hidden",
    position: "relative",
    marginBottom: 16,
  },
  previewCanvas: {
    height: 220,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(10, 122, 255, 0.04)",
    padding: 20,
  },
  canvasTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: iosColors.labelPrimary,
    marginTop: 12,
  },
  canvasSubtitle: {
    fontSize: 12,
    color: iosColors.labelSecondary,
    marginTop: 2,
  },
  downloadProgressBox: {
    width: "80%",
    marginTop: 14,
    alignItems: "center",
  },
  downloadProgressText: {
    fontSize: 11,
    fontWeight: "600",
    color: iosColors.systemBlue,
    marginBottom: 6,
  },
  progressBarTrack: {
    width: "100%",
    height: 6,
    borderRadius: 3,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: iosColors.systemBlue,
    borderRadius: 3,
  },
  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: iosColors.glassBorder,
    backgroundColor: "rgba(255, 255, 255, 0.02)",
  },
  metaCol: {
    alignItems: "center",
  },
  metaLabel: {
    fontSize: 10,
    color: iosColors.labelSecondary,
    marginBottom: 2,
  },
  metaValue: {
    fontSize: 12,
    fontWeight: "700",
    color: iosColors.labelPrimary,
  },
  actionSection: {
    gap: 10,
    marginBottom: 24,
  },
  arButton: {
    width: "100%",
    backgroundColor: iosColors.systemBlue,
    borderRadius: iosRadius.button,
    paddingVertical: 15,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
    shadowColor: iosColors.systemBlue,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 4,
  },
  arButtonText: {
    fontSize: 14,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  downloadButton: {
    width: "100%",
    backgroundColor: "rgba(52, 199, 89, 0.15)",
    borderWidth: 1,
    borderColor: "rgba(52, 199, 89, 0.35)",
    borderRadius: iosRadius.button,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  downloadButtonText: {
    fontSize: 13,
    fontWeight: "700",
    color: iosColors.systemGreen,
  },
  deleteButton: {
    width: "100%",
    backgroundColor: "rgba(255, 59, 48, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(255, 59, 48, 0.25)",
    borderRadius: iosRadius.button,
    paddingVertical: 13,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 6,
  },
  deleteButtonText: {
    fontSize: 12,
    fontWeight: "700",
    color: iosColors.systemRed,
  },
  sectionHeading: {
    fontSize: 11,
    fontWeight: "700",
    color: iosColors.labelSecondary,
    letterSpacing: 0.8,
    marginBottom: 12,
  },
  disciplinesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  disciplineCard: {
    width: "48%",
    backgroundColor: iosColors.glassCard,
    borderRadius: iosRadius.card,
    borderWidth: 1,
    borderColor: iosColors.glassBorder,
    padding: 14,
  },
  discIconBox: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: "rgba(10, 122, 255, 0.12)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  discName: {
    fontSize: 13,
    fontWeight: "700",
    color: iosColors.labelPrimary,
  },
  discCount: {
    fontSize: 11,
    color: iosColors.labelSecondary,
    marginTop: 2,
  },
});
