/**
 * © 2026 NXA Software. All rights reserved.
 * Nexa ERP Mobil - Şantiye Günlüğü (Jurnal) (GET/POST /api/mobile/journal)
 */

import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../context/AuthContext";
import { extractErrorMessage, mobileApi } from "../services/apiClient";
import { getCurrentGpsFix } from "../services/locationTracker";
import {
  AppHeader,
  EmptyState,
  GlassCard,
  ScreenHeader,
  SkeletonList,
  StatusBadge,
} from "../components/ui/NexaUI";
import { iosColors } from "../theme/iosTheme";
import type { MobileJournalItem } from "../types/api";

export default function JournalScreen({ embeddedInTab = false }: { embeddedInTab?: boolean }) {
  const { activeProject } = useAuth();
  const [journals, setJournals] = useState<MobileJournalItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [block, setBlock] = useState("Genel Saha");
  const [personnelCount, setPersonnelCount] = useState("12");
  const [weatherSummary, setWeatherSummary] = useState("Açık");
  const [worksDone, setWorksDone] = useState("");
  const [equipment, setEquipment] = useState("");
  const [isgNotes, setIsgNotes] = useState("");

  const loadJournals = useCallback(
    async (isRefresh = false) => {
      try {
        if (isRefresh) setRefreshing(true);
        else setLoading(true);
        const res = await mobileApi.journal.list(activeProject?.id);
        setJournals(res.journals || []);
      } catch (err: any) {
        Alert.alert("Jurnal Alınamadı", extractErrorMessage(err));
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [activeProject?.id]
  );

  useEffect(() => {
    loadJournals(false);
  }, [loadJournals]);

  const handleCreate = async () => {
    if (!worksDone.trim()) {
      Alert.alert("Eksik Alan", "Lütfen yapılan işler açıklamasını giriniz.");
      return;
    }
    try {
      setSubmitting(true);
      const gps = await getCurrentGpsFix();
      const res = await mobileApi.journal.create({
        projectId: activeProject?.id,
        block: block.trim() || "Genel Saha",
        personnelCount: Number(personnelCount) || 10,
        weatherSummary: weatherSummary.trim() || "Açık",
        worksDone: worksDone.trim(),
        equipment: equipment.trim() || undefined,
        isgNotes: isgNotes.trim() || undefined,
        latitude: gps?.latitude,
        longitude: gps?.longitude,
      });
      setShowModal(false);
      setWorksDone("");
      setEquipment("");
      setIsgNotes("");
      if (!res.offlineQueued) {
        await loadJournals(true);
      }
      Alert.alert(
        "Jurnal Kaydedildi",
        res.offlineQueued
          ? "Çevrimdışı kuyruğa alındı, bağlantı gelince sunucuya aktarılacak."
          : "Şantiye günlük raporu veritabanına işlendi."
      );
    } catch (err: any) {
      Alert.alert("Hata", extractErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      {embeddedInTab ? (
        <AppHeader title="Şantiye Günlüğü (Jurnal)" />
      ) : (
        <ScreenHeader
          title="Şantiye Günlüğü"
          subtitle={activeProject?.name || "Günlük İmalat Kaydı"}
        />
      )}

      <View style={styles.topActionBar}>
        <TouchableOpacity
          style={styles.newBtn}
          onPress={() => setShowModal(true)}
          activeOpacity={0.85}
        >
          <Ionicons name="add-circle" size={18} color="#FFFFFF" />
          <Text style={styles.newBtnText}>Bugünkü Jurnali Yaz</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadJournals(true)}
            tintColor={iosColors.systemBlue}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <SkeletonList count={3} />
        ) : journals.length === 0 ? (
          <EmptyState
            icon="book-outline"
            title="Henüz Jurnal Kaydı Yok"
            subtitle="Bu şantiye için yeni şantiye günlüğü kaydı oluşturabilirsiniz."
            actionLabel="Yeni Jurnal Yaz"
            onAction={() => setShowModal(true)}
          />
        ) : (
          journals.map((j) => (
            <GlassCard key={j.id} style={styles.card}>
              <View style={styles.rowBetween}>
                <Text style={styles.dateText}>{j.date}</Text>
                <StatusBadge status={j.status} />
              </View>
              <Text style={styles.projectName}>{j.project} • {j.block}</Text>
              <Text style={styles.worksText}>{j.worksDone}</Text>
              <View style={styles.footerRow}>
                <Text style={styles.metaText}>👷 {j.personnelCount} Personel</Text>
                <Text style={styles.metaText}>🌤️ {j.weatherSummary}</Text>
              </View>
            </GlassCard>
          ))
        )}
      </ScrollView>

      <Modal
        visible={showModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalBackdrop}>
          <ScrollView contentContainerStyle={styles.modalSheet}>
            <View style={styles.rowBetween}>
              <Text style={styles.modalTitle}>Yeni Şantiye Jurnali</Text>
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <Ionicons name="close" size={22} color="#8E8E93" />
              </TouchableOpacity>
            </View>

            <Text style={styles.label}>Blok / Bölge</Text>
            <TextInput
              style={styles.input}
              value={block}
              onChangeText={setBlock}
              placeholder="A Blok - 3. Kat"
              placeholderTextColor="#636366"
            />

            <View style={styles.rowGap}>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>Ekip Sayısı</Text>
                <TextInput
                  style={styles.input}
                  value={personnelCount}
                  onChangeText={setPersonnelCount}
                  keyboardType="numeric"
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>Hava Durumu</Text>
                <TextInput
                  style={styles.input}
                  value={weatherSummary}
                  onChangeText={setWeatherSummary}
                />
              </View>
            </View>

            <Text style={styles.label}>Yapılan İmalatlar *</Text>
            <TextInput
              style={[styles.input, { minHeight: 90, textAlignVertical: "top" }]}
              value={worksDone}
              onChangeText={setWorksDone}
              multiline
              placeholder="Bugün tamamlanan saha işlerini detaylandırın..."
              placeholderTextColor="#636366"
            />

            <Text style={styles.label}>Kullanılan Makine / Ekipman</Text>
            <TextInput
              style={styles.input}
              value={equipment}
              onChangeText={setEquipment}
              placeholder="Örn: Kule Vinç #1, Beton Pompası"
              placeholderTextColor="#636366"
            />

            <Text style={styles.label}>İSG Notu</Text>
            <TextInput
              style={styles.input}
              value={isgNotes}
              onChangeText={setIsgNotes}
              placeholder="KKD ve güvenlik gözlemleri..."
              placeholderTextColor="#636366"
            />

            <TouchableOpacity
              style={styles.submitBtn}
              onPress={handleCreate}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.submitBtnText}>Jurnali Gönder</Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: iosColors.background },
  topActionBar: { paddingHorizontal: 16, paddingTop: 12 },
  newBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: iosColors.systemBlue,
    paddingVertical: 12,
    borderRadius: 12,
  },
  newBtnText: { color: "#FFFFFF", fontSize: 13, fontWeight: "800" },
  scrollContent: { padding: 16, paddingBottom: 110, gap: 12 },
  card: { gap: 8 },
  rowBetween: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  dateText: { fontSize: 12, fontWeight: "700", color: "#58A6FF" },
  projectName: { fontSize: 14, fontWeight: "800", color: "#FFFFFF" },
  worksText: { fontSize: 13, color: "#E5E7EB", lineHeight: 19 },
  footerRow: { flexDirection: "row", gap: 14, marginTop: 4 },
  metaText: { fontSize: 11, color: iosColors.labelMuted },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.78)",
    justifyContent: "flex-end",
  },
  modalSheet: {
    backgroundColor: "#111827",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    gap: 10,
  },
  modalTitle: { fontSize: 17, fontWeight: "800", color: "#FFFFFF", marginBottom: 4 },
  label: { fontSize: 11, fontWeight: "700", color: "#8E8E93", marginTop: 4 },
  input: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    borderRadius: 11,
    padding: 12,
    color: "#FFFFFF",
    fontSize: 13,
  },
  rowGap: { flexDirection: "row", gap: 10 },
  submitBtn: {
    backgroundColor: iosColors.systemBlue,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 10,
  },
  submitBtnText: { color: "#FFFFFF", fontSize: 14, fontWeight: "800" },
});

