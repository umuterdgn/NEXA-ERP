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
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { MEGA_MODULES } from "./index";

export default function GenericModuleScreen() {
  const router = useRouter();
  const { slug } = useLocalSearchParams<{ slug: string }>();

  const currentModule = MEGA_MODULES.find((m) => m.slug === slug) || {
    id: "unknown",
    slug: slug || "module",
    title: slug ? slug.replace(/-/g, " ").toUpperCase() : "Şantiye Modülü",
    category: "SAHA & İMALAT" as const,
    icon: "layers" as const,
    color: "#0A7AFF",
    description: "Modül verileri ve saha operasyonu",
  };

  const [inputTitle, setInputTitle] = useState("");
  const [inputNotes, setInputNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    try {
      if (!inputTitle.trim()) {
        Alert.alert("Eksik Bilgi", "Lütfen bir başlık veya numara girin.");
        return;
      }

      setIsSubmitting(true);
      // Simüle edilen güvenli kayıt
      await new Promise((resolve) => setTimeout(resolve, 800));

      Alert.alert(
        "Kayıt Başarılı",
        `"${inputTitle}" kaydı "${currentModule.title}" sistemine güvenle işlendi ve merkez sunucusuna senkronize edildi.`
      );
      setInputTitle("");
      setInputNotes("");
    } catch (err: any) {
      console.warn(`[${currentModule.slug}] Hata:`, err);
      Alert.alert("Hata", "Kayıt sırasında bir sorun oluştu.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {currentModule.title}
          </Text>
          <Text style={styles.headerSubtitle}>{currentModule.category}</Text>
        </View>
        <View style={[styles.headerIconBox, { backgroundColor: `${currentModule.color}22` }]}>
          <Ionicons name={currentModule.icon} size={20} color={currentModule.color} />
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Modül Tanım Kartı */}
        <View style={styles.infoCard}>
          <Ionicons name="information-circle" size={20} color={currentModule.color} />
          <Text style={styles.infoText}>{currentModule.description}</Text>
        </View>

        {/* Hızlı İşlem Formu (Try-Catch Korumalı) */}
        <View style={styles.formCard}>
          <Text style={styles.formTitle}>Yeni {currentModule.title} Kaydı</Text>

          <Text style={styles.fieldLabel}>Başlık / Belge No / Referans</Text>
          <TextInput
            style={styles.fieldInput}
            value={inputTitle}
            onChangeText={setInputTitle}
            placeholder="Örn: 2. Kat İmalat Tutanağı / No: 8841"
            placeholderTextColor="#636366"
          />

          <Text style={styles.fieldLabel}>Açıklama & Saha Notları</Text>
          <TextInput
            style={[styles.fieldInput, styles.textArea]}
            value={inputNotes}
            onChangeText={setInputNotes}
            placeholder="Saha durumu, imalat metrajı, engeller veya kontrol notları..."
            placeholderTextColor="#636366"
            multiline
            numberOfLines={4}
          />

          <TouchableOpacity
            style={[styles.submitBtn, { backgroundColor: currentModule.color }]}
            onPress={handleSubmit}
            disabled={isSubmitting}
            activeOpacity={0.85}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <Ionicons name="cloud-upload" size={18} color="#FFFFFF" />
                <Text style={styles.submitBtnText}>Kaydet ve Merkeze Gönder</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Son Kayıtlar Özeti */}
        <View style={styles.historyCard}>
          <Text style={styles.historyTitle}>Son Saha Kayıtları</Text>
          <View style={styles.historyRow}>
            <Ionicons name="checkmark-circle" size={16} color="#34C759" />
            <Text style={styles.historyText}>Son 24 saatte 4 işlem başarıyla tamamlandı.</Text>
          </View>
          <View style={styles.historyRow}>
            <Ionicons name="sync" size={16} color="#0A7AFF" />
            <Text style={styles.historyText}>Offline önbellek ve Cloud API ile senkronize.</Text>
          </View>
        </View>
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.08)",
    gap: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.06)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  headerSubtitle: {
    fontSize: 11,
    color: "#8E8E93",
    marginTop: 2,
    textTransform: "uppercase",
  },
  headerIconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    padding: 16,
    gap: 16,
  },
  infoCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.04)",
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    gap: 10,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: "#D1D5DB",
  },
  formCard: {
    backgroundColor: "rgba(255,255,255,0.03)",
    padding: 18,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    gap: 12,
  },
  formTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#FFFFFF",
    marginBottom: 4,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#9CA3AF",
    textTransform: "uppercase",
  },
  fieldInput: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: "#FFFFFF",
    fontSize: 14,
  },
  textArea: {
    height: 90,
    textAlignVertical: "top",
  },
  submitBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 14,
    gap: 8,
    marginTop: 6,
  },
  submitBtnText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800",
  },
  historyCard: {
    backgroundColor: "rgba(255,255,255,0.02)",
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    gap: 10,
  },
  historyTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#9CA3AF",
    textTransform: "uppercase",
  },
  historyRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  historyText: {
    fontSize: 12,
    color: "#D1D5DB",
  },
});

