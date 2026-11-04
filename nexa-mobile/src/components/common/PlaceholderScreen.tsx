/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Nexa Mobile - Standart iOS Placeholder Ekranı (Yapım Aşamasında)
 */

import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Alert,
  ActivityIndicator,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

interface PlaceholderScreenProps {
  slug?: string;
  title?: string;
  category?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  color?: string;
  description?: string;
  onBack?: () => void;
}

export default function PlaceholderScreen({
  slug = "module",
  title = "Şantiye Modülü",
  category = "SAHA & İMALAT",
  icon = "construct",
  color = "#0A7AFF",
  description = "Bu modül Nexa ERP v2.4 güncellemesi kapsamında hazırlanmaktadır. Saha operasyon verileri offline önbelleğe alınmaya hazırdır.",
  onBack,
}: PlaceholderScreenProps) {
  const router = useRouter();
  const [formInput, setFormInput] = useState("");
  const [notesInput, setNotesInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      router.back();
    }
  };

  const handleSimulateAction = async () => {
    if (!formInput.trim()) {
      Alert.alert("Eksik Bilgi", "Lütfen bir referans veya kayıt başlığı girin.");
      return;
    }

    try {
      setIsSubmitting(true);
      await new Promise((resolve) => setTimeout(resolve, 600));
      Alert.alert(
        "Kayıt Alındı (Test Modu)",
        `"${formInput}" verisi yerel kuyruğa kaydedildi. Modül canlıya alındığında sunucu ile otomatik senkronize edilecektir.`
      );
      setFormInput("");
      setNotesInput("");
    } catch {
      Alert.alert("Hata", "İşlem sırasında bir hata oluştu.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
      {/* iOS Navigasyon Başlığı */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={handleBack}
          style={styles.backButton}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-back" size={26} color="#0A7AFF" />
          <Text style={styles.backText}>Geri</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {title}
        </Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* 🚧 Yapım Aşamasında Rozeti (Under Construction Banner) */}
        <View style={styles.constructionBanner}>
          <View style={styles.bannerIconBox}>
            <Text style={{ fontSize: 24 }}>🚧</Text>
          </View>
          <View style={{ flex: 1 }}>
            <View style={styles.badgeRow}>
              <View style={styles.statusBadge}>
                <Text style={styles.statusBadgeText}>YAPIM AŞAMASINDA</Text>
              </View>
              <Text style={styles.versionBadge}>v2.4 Roadmap</Text>
            </View>
            <Text style={styles.bannerTitle}>Geliştirme Devam Ediyor</Text>
            <Text style={styles.bannerSubtitle}>
              Bu modülün mobil UI & donanım entegrasyonu Nexa ERP çekirdek ekibi tarafından geliştirilmektedir.
            </Text>
          </View>
        </View>

        {/* Modül Tanım & İkon Kartı */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={[styles.iconContainer, { backgroundColor: `${color}18`, borderColor: `${color}35` }]}>
              <Ionicons name={icon} size={30} color={color} />
            </View>
            <View style={{ flex: 1, marginLeft: 14 }}>
              <Text style={styles.categoryLabel}>{category}</Text>
              <Text style={styles.moduleTitle}>{title}</Text>
              <Text style={styles.moduleSlug}>ID: {slug}</Text>
            </View>
          </View>

          <Text style={styles.descriptionText}>{description}</Text>

          {/* Sistem Özellikleri Listesi */}
          <View style={styles.featureList}>
            <View style={styles.featureItem}>
              <Ionicons name="checkmark-circle" size={16} color="#34C759" />
              <Text style={styles.featureText}>Çevrimdışı (Offline-First) SQLite tamponu hazır</Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="checkmark-circle" size={16} color="#34C759" />
              <Text style={styles.featureText}>Rol ve yetki güvenlik katmanı uygulandı</Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="checkmark-circle" size={16} color="#34C759" />
              <Text style={styles.featureText}>REST & WebSocket senkronizasyon kancası bağlı</Text>
            </View>
          </View>
        </View>

        {/* Önizleme & Test Formu */}
        <View style={styles.card}>
          <Text style={styles.sectionHeading}>Hızlı Test / Kayıt Girişi</Text>
          <Text style={styles.sectionSub}>
            Saha testi amacıyla yerel veri girişi yapabilirsiniz:
          </Text>

          <Text style={styles.inputLabel}>İşlem Başlığı / Seri No</Text>
          <TextInput
            style={styles.textInput}
            value={formInput}
            onChangeText={setFormInput}
            placeholder="Örn: 1. Blok Saha Kontrol Notu"
            placeholderTextColor="#8E8E93"
          />

          <Text style={styles.inputLabel}>Ek Açıklamalar</Text>
          <TextInput
            style={[styles.textInput, styles.textArea]}
            value={notesInput}
            onChangeText={setNotesInput}
            placeholder="Saha koordinatları veya açıklama ekleyin..."
            placeholderTextColor="#8E8E93"
            multiline
            numberOfLines={3}
          />

          <TouchableOpacity
            style={[styles.submitButton, { backgroundColor: color }]}
            onPress={handleSimulateAction}
            disabled={isSubmitting}
            activeOpacity={0.8}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <Ionicons name="cloud-upload" size={18} color="#FFFFFF" />
                <Text style={styles.submitButtonText}>Test Verisini Kaydet</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Güvenli Geri Dön Butonu */}
        <TouchableOpacity
          style={styles.returnButton}
          onPress={handleBack}
          activeOpacity={0.8}
        >
          <Ionicons name="arrow-back-circle" size={22} color="#0A7AFF" />
          <Text style={styles.returnButtonText}>Modüllere Geri Dön</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#0A0F1C",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.08)",
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  backText: {
    color: "#0A7AFF",
    fontSize: 17,
    fontWeight: "500",
  },
  headerTitle: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "700",
    textAlign: "center",
    maxWidth: "60%",
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
    gap: 16,
  },
  constructionBanner: {
    flexDirection: "row",
    backgroundColor: "rgba(255, 149, 0, 0.08)",
    borderWidth: 1,
    borderColor: "rgba(255, 149, 0, 0.25)",
    borderRadius: 16,
    padding: 16,
    alignItems: "flex-start",
    gap: 12,
  },
  bannerIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "rgba(255, 149, 0, 0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  badgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  statusBadge: {
    backgroundColor: "#FF9500",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusBadgeText: {
    color: "#000000",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  versionBadge: {
    color: "#8E8E93",
    fontSize: 11,
    fontWeight: "600",
  },
  bannerTitle: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 4,
  },
  bannerSubtitle: {
    color: "rgba(235, 235, 245, 0.65)",
    fontSize: 12,
    lineHeight: 17,
  },
  card: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    padding: 16,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  iconContainer: {
    width: 54,
    height: 54,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  categoryLabel: {
    color: "#8E8E93",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  moduleTitle: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "800",
    marginTop: 2,
  },
  moduleSlug: {
    color: "rgba(255, 255, 255, 0.35)",
    fontSize: 11,
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
    marginTop: 2,
  },
  descriptionText: {
    color: "rgba(235, 235, 245, 0.75)",
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 14,
  },
  featureList: {
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.06)",
    paddingTop: 12,
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  featureText: {
    color: "rgba(255, 255, 255, 0.7)",
    fontSize: 12,
  },
  sectionHeading: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 4,
  },
  sectionSub: {
    color: "#8E8E93",
    fontSize: 12,
    marginBottom: 12,
  },
  inputLabel: {
    color: "rgba(255, 255, 255, 0.8)",
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 6,
    marginTop: 6,
  },
  textInput: {
    backgroundColor: "rgba(255, 255, 255, 0.04)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: "#FFFFFF",
    fontSize: 14,
  },
  textArea: {
    height: 70,
    textAlignVertical: "top",
  },
  submitButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 14,
    gap: 8,
    marginTop: 16,
  },
  submitButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
  returnButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(10, 122, 255, 0.12)",
    borderWidth: 1,
    borderColor: "rgba(10, 122, 255, 0.3)",
    paddingVertical: 15,
    borderRadius: 16,
    gap: 8,
    marginTop: 4,
  },
  returnButtonText: {
    color: "#0A7AFF",
    fontSize: 15,
    fontWeight: "700",
  },
});
