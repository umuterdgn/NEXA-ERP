/**
 * © 2026 NXA Software. All rights reserved.
 * Nexa ERP Mobil - Apple iOS Standartlarında Şantiye Jurnali
 *
 * - Koyu iOS zemin (#0A0F1C)
 * - GPS Anti-Spoofing: expo-location isMocked kontrolü (Fake GPS ise kırmızı "GPS Doğrulaması Başarısız", değilse yeşil "Anti-Spoof Doğrulandı")
 * - Çevrimdışı (Offline-First): @react-native-community/netinfo ile bağlantı denetimi, internet yoksa AsyncStorage OfflineQueue'ya "Senkronizasyon Bekliyor (Taslak)" olarak kayıt
 * - Blok/Kat ve Personel Sayısı yan yana modern flex-row
 * - Sayfanın altında sabit (sticky) yeşil renkte devasa "Jurnali Kaydet & Merkeze İlet" butonu
 */

import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  ActivityIndicator,
  Alert,
  Vibration,
  Platform,
  KeyboardAvoidingView,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather, Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import NetInfo from "@react-native-community/netinfo";
import { useDrawer } from "../../src/components/navigation/DrawerSidebar";
import { useLocationWeather, useNetworkSync } from "../../src/hooks";
import { OfflineQueue } from "../../src/services/OfflineQueue";
import { api } from "../../src/lib/api";
import { iosColors, iosRadius } from "../../src/theme/iosTheme";

export interface JournalRecord {
  id: string;
  date: string;
  project: string;
  block: string;
  personnelCount: number;
  weatherSummary: string;
  temperature: number;
  worksDone: string;
  equipment: string;
  isgNotes: string;
  status: "ONAYLANDI" | "Senkronizasyon Bekliyor (Taslak)" | "İNCELENİYOR";
}

const INITIAL_JOURNALS: JournalRecord[] = [
  {
    id: "JRN-01",
    date: "Bugün (2 Kasım 2026)",
    project: "Merkez Rezidans & AVM",
    block: "Blok-B • Kat: 3",
    personnelCount: 45,
    weatherSummary: "Açık / Güneşli",
    temperature: 19,
    worksDone: "3. kat kolon demir donatısı bağlandı. Kalıp hazırlıkları tamamlandı.",
    equipment: "1 Kule Vinç, 2 Transmikser",
    isgNotes: "Kişisel koruyucu donanım denetimi yapıldı.",
    status: "ONAYLANDI",
  },
  {
    id: "JRN-02",
    date: "1 Kasım 2026",
    project: "Merkez Rezidans & AVM",
    block: "Blok-A • Kat: 2",
    personnelCount: 42,
    weatherSummary: "Parçalı Bulutlu",
    temperature: 17,
    worksDone: "2. kat tabliye C35 beton dökümü gerçekleştirildi (140 m3).",
    equipment: "1 Beton Pompası, 4 Transmikser",
    isgNotes: "Beton döküm alanı güvenlik şeridiyle çevrildi.",
    status: "ONAYLANDI",
  },
];

export default function JournalScreen() {
  const { openDrawer } = useDrawer();
  const [journals, setJournals] = useState<JournalRecord[]>(INITIAL_JOURNALS);
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  // Form State'leri
  const [project, setProject] = useState("Kadıköy Merkez Rezidans");
  const [block, setBlock] = useState("Blok-B • Kat: 4");
  const [personnelCount, setPersonnelCount] = useState("48");
  const [worksDone, setWorksDone] = useState("");
  const [equipment, setEquipment] = useState("");
  const [isgNotes, setIsgNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Konum & Hava Durumu Hook'u (Anti-Spoofing destekli)
  const {
    isLoading: isLocationLoading,
    error: locationError,
    location,
    weather,
    isMocked,
    fetchLocationAndWeather,
  } = useLocationWeather();

  // Ağ durumu
  const { isConnected, queueCount } = useNetworkSync();
  const [offlineNotice, setOfflineNotice] = useState<string | null>(null);

  useEffect(() => {
    try {
      fetchLocationAndWeather().catch(() => {});
    } catch (err) {
      console.warn("[Journal Location Weather Error]:", err);
    }
  }, [fetchLocationAndWeather]);

  // Jurnali Kaydet ve Merkeze Gönder
  const handleSaveJournal = async () => {
    if (!worksDone.trim()) {
      Alert.alert("Eksik Alan", "Lütfen bugün yapılan imalat özetini giriniz.");
      return;
    }

    setIsSubmitting(true);
    try {
      if (Platform.OS !== "web") {
        Vibration.vibrate(80);
      }

      const journalPayload = {
        projectId: "prj_active_01",
        projectName: project,
        block,
        activities: `${block} - ${worksDone}`,
        weather: `${weather?.description || "Açık"}, ${weather?.temperature || 18}°C`,
        personnelCount: parseInt(personnelCount, 10) || 0,
        equipmentData: { equipment: equipment || "1 Kule Vinç" },
        notes: isgNotes || "Uygunsuzluk tespit edilmedi.",
        isMockedGps: isMocked,
      };

      // ADIM 4: Önce NetInfo ile internet bağlantısını denetle
      const netState = await NetInfo.fetch();
      const hasInternet = Boolean(netState.isConnected && netState.isInternetReachable !== false);

      if (!hasInternet) {
        // İnternet yoksa: AsyncStorage içine "Senkronizasyon Bekliyor (Taslak)" olarak kaydet
        await OfflineQueue.addToQueue(
          "/site-diary/logs",
          journalPayload,
          "POST",
          {
            type: "JOURNAL",
            title: `${project} • ${block}`,
          }
        );

        setOfflineNotice(
          "İnternet bağlantısı yok. Veriler cihaza kaydedildi: Senkronizasyon Bekliyor (Taslak)"
        );
        setTimeout(() => setOfflineNotice(null), 6000);

        Alert.alert(
          "🌐 Çevrimdışı Kayıt",
          "İnternet bağlantısı yok. Jurnal yerel hafızaya 'Senkronizasyon Bekliyor (Taslak)' olarak kaydedildi. Bağlantı geldiğinde sunucuya iletilecektir."
        );
      } else {
        try {
          await api.post("/site-diary/logs", journalPayload);
          Alert.alert(
            "📝 Jurnal Kaydedildi",
            "Günlük şantiye jurnali başarıyla sisteme kaydedildi ve şirket merkezine iletildi."
          );
        } catch (apiErr: any) {
          console.warn("[Journal] API hatası, offline taslak kuyruğuna aktarılıyor:", apiErr?.message);
          await OfflineQueue.addToQueue(
            "/site-diary/logs",
            journalPayload,
            "POST",
            {
              type: "JOURNAL",
              title: `${project} • ${block}`,
            }
          );
          setOfflineNotice(
            "Sunucuya erişilemedi. Veriler cihaza kaydedildi: Senkronizasyon Bekliyor (Taslak)"
          );
          setTimeout(() => setOfflineNotice(null), 6000);
        }
      }

      const newRecord: JournalRecord = {
        id: `JRN-${Date.now().toString().slice(-4)}`,
        date: "Bugün (Yeni)",
        project,
        block,
        personnelCount: parseInt(personnelCount, 10) || 0,
        weatherSummary: weather?.description || "Açık",
        temperature: weather?.temperature || 18,
        worksDone,
        equipment: equipment || "1 Kule Vinç",
        isgNotes: isgNotes || "Uygunsuzluk tespit edilmedi.",
        status: hasInternet ? "ONAYLANDI" : "Senkronizasyon Bekliyor (Taslak)",
      };

      setJournals((prev) => [newRecord, ...(prev || [])]);
      setIsSheetOpen(false);
      setWorksDone("");
      setEquipment("");
      setIsgNotes("");
    } catch (err: any) {
      console.error("[Journal Save Error]:", err);
      Alert.alert("Hata", "Jurnal kaydedilirken bir hata oluştu.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeContainer} edges={["top", "left", "right"]}>
      {/* 1. ÜST HEADER */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.hamburgerButton}
          onPress={openDrawer}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="menu" size={24} color="#FFFFFF" />
        </TouchableOpacity>

        <View style={{ flex: 1 }}>
          <Text style={styles.headerSubtitle}>Saha Raporları</Text>
          <Text style={styles.headerTitle}>Şantiye Jurnali</Text>
        </View>

        <View style={styles.headerActions}>
          {queueCount > 0 && (
            <View style={styles.queueBadge}>
              <Feather name="refresh-cw" size={10} color={iosColors.systemOrange} />
              <Text style={styles.queueBadgeText}>{queueCount} Taslak</Text>
            </View>
          )}

          <TouchableOpacity
            onPress={() => setIsSheetOpen(true)}
            activeOpacity={0.8}
            style={styles.newJournalBtn}
          >
            <Feather name="plus" size={16} color="#FFFFFF" />
            <Text style={styles.newJournalBtnText}>Yeni Jurnal</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Çevrimdışı Bildirim Toast'ı */}
      {offlineNotice && (
        <View style={styles.offlineToast}>
          <Feather name="cloud-off" size={16} color={iosColors.systemOrange} />
          <Text style={styles.offlineToastText}>{offlineNotice}</Text>
          <TouchableOpacity onPress={() => setOfflineNotice(null)}>
            <Feather name="x" size={16} color={iosColors.labelSecondary} />
          </TouchableOpacity>
        </View>
      )}

      <ScrollView
        style={styles.scrollArea}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* ============================================================ */}
        {/* ADIM 3: GPS ANTİ-SPOOFİNG & HAVA DURUMU KARTI                */}
        {/* ============================================================ */}
        <View style={styles.weatherCard}>
          {Platform.OS === "ios" && (
            <BlurView intensity={25} tint="dark" style={StyleSheet.absoluteFill} />
          )}
          <View style={styles.weatherCardHeader}>
            <View style={styles.weatherHeaderLeft}>
              <View style={styles.weatherIconCircle}>
                <Feather name="cloud-rain" size={16} color={iosColors.systemBlue} />
              </View>
              <View>
                <Text style={styles.weatherCardTitle}>Şantiye Hava Durumu & GPS</Text>
                <Text style={styles.weatherCardSubtitle}>Open-Meteo & Anti-Spoof Kilidi</Text>
              </View>
            </View>

            {/* ADIM 3: GPS Anti-Spoofing Rozeti (Kırmızı / Yeşil) */}
            <View
              style={
                isMocked
                  ? styles.antiSpoofBadgeDanger
                  : styles.antiSpoofBadgeSuccess
              }
            >
              <Feather
                name={isMocked ? "alert-circle" : "shield"}
                size={11}
                color={isMocked ? iosColors.systemRed : iosColors.systemGreen}
              />
              <Text
                style={[
                  styles.antiSpoofText,
                  { color: isMocked ? iosColors.systemRed : iosColors.systemGreen },
                ]}
              >
                {isMocked
                  ? "GPS Doğrulaması Başarısız"
                  : "Anti-Spoof Doğrulandı"}
              </Text>
            </View>
          </View>

          {weather && location ? (
            <View style={styles.weatherDetails}>
              <View style={styles.weatherRow}>
                <View style={styles.weatherTempRow}>
                  <Ionicons name="sunny" size={26} color="#FBBF24" />
                  <Text style={styles.weatherTempText}>{weather.temperature}°C</Text>
                  <Text style={styles.weatherDescText}>{weather.description}</Text>
                </View>
                <Text style={styles.windText}>💨 {weather.windSpeed} km/h</Text>
              </View>

              <View style={styles.coordsRow}>
                <Text style={styles.coordsText}>
                  📍 Lat: {location.latitude.toFixed(4)}, Lng: {location.longitude.toFixed(4)}
                </Text>
                <TouchableOpacity
                  onPress={() => fetchLocationAndWeather()}
                  disabled={isLocationLoading}
                  style={styles.refreshBtn}
                >
                  <Feather
                    name="refresh-cw"
                    size={11}
                    color={iosColors.systemBlue}
                  />
                  <Text style={styles.refreshBtnText}>Yenile</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={styles.weatherLoadingBox}>
              <ActivityIndicator size="small" color={iosColors.systemBlue} />
              <Text style={styles.weatherLoadingText}>
                {locationError || "GPS koordinatları ve hava durumu alınıyor..."}
              </Text>
            </View>
          )}
        </View>

        {/* Jurnal Kayıtları Başlığı */}
        <Text style={styles.sectionTitle}>GEÇMİŞ ŞANTİYE JURNALLERİ</Text>

        {/* Jurnal Listesi */}
        {(journals || []).map((item) => {
          const isPendingDraft = item.status === "Senkronizasyon Bekliyor (Taslak)";

          return (
            <View key={item.id} style={styles.journalItemCard}>
              <View style={styles.journalItemHeader}>
                <Text style={styles.journalItemDate}>{item.date}</Text>
                <View
                  style={[
                    styles.journalItemBadge,
                    item.status === "ONAYLANDI"
                      ? styles.journalItemBadgeSuccess
                      : isPendingDraft
                      ? styles.journalItemBadgeDraft
                      : styles.journalItemBadgeWarning,
                  ]}
                >
                  <Text
                    style={[
                      styles.journalItemBadgeText,
                      item.status === "ONAYLANDI"
                        ? { color: iosColors.systemGreen }
                        : isPendingDraft
                        ? { color: iosColors.systemOrange }
                        : { color: iosColors.systemBlue },
                    ]}
                  >
                    {item.status}
                  </Text>
                </View>
              </View>

              <Text style={styles.journalItemBlock}>{item.block}</Text>
              <Text style={styles.journalItemWorks}>{item.worksDone}</Text>

              <View style={styles.journalItemFooter}>
                <View style={styles.footerItem}>
                  <Feather name="users" size={12} color={iosColors.labelSecondary} />
                  <Text style={styles.footerText}>{item.personnelCount} Personel</Text>
                </View>

                <View style={styles.footerItem}>
                  <Feather name="sun" size={12} color={iosColors.systemGreen} />
                  <Text style={styles.footerText}>
                    {item.weatherSummary} ({item.temperature}°C)
                  </Text>
                </View>
              </View>
            </View>
          );
        })}
      </ScrollView>

      {/* ============================================================ */}
      {/* iOS MODAL FORM: BLOK/KAT & PERSONEL SAYISI YAN YANA (FLEX-ROW)*/}
      {/* VE EN ALTTA SABİT (STICKY) DEVASA YEŞİL KAYDET BUTONU        */}
      {/* ============================================================ */}
      <Modal
        visible={isSheetOpen}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setIsSheetOpen(false)}
      >
        <SafeAreaView style={styles.safeContainer} edges={["top", "bottom"]}>
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={{ flex: 1 }}
          >
            {/* iOS Sürükleme Çizgisi */}
            <View style={styles.sheetHandle} />

            {/* Modal Üst Bar */}
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Yeni Şantiye Jurnali</Text>
                <Text style={styles.modalSubtitle}>Günlük imalat ve saha durumunu kaydedin</Text>
              </View>

              <TouchableOpacity
                onPress={() => setIsSheetOpen(false)}
                style={styles.modalCloseBtn}
              >
                <Feather name="x" size={18} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={{ flex: 1, paddingHorizontal: 20, paddingTop: 14 }}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={{ paddingBottom: 110 }}
            >
              {/* Form Alanları */}
              <View style={{ gap: 14 }}>
                <View>
                  <Text style={styles.fieldLabel}>PROJE & ŞANTİYE</Text>
                  <TextInput
                    value={project}
                    onChangeText={setProject}
                    placeholder="Proje adı"
                    placeholderTextColor={iosColors.labelMuted}
                    style={styles.fieldInput}
                  />
                </View>

                {/* BLOK/KAT SEÇİMİ VE PERSONEL SAYISI (YAN YANA FLEX-ROW) */}
                <View style={styles.flexRowFields}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.fieldLabel}>BLOK / KAT</Text>
                    <TextInput
                      value={block}
                      onChangeText={setBlock}
                      placeholder="Örn: Blok-B Kat: 4"
                      placeholderTextColor={iosColors.labelMuted}
                      style={styles.fieldInput}
                    />
                  </View>

                  <View style={{ width: 140 }}>
                    <Text style={styles.fieldLabel}>PERSONEL SAYISI</Text>
                    <TextInput
                      value={personnelCount}
                      onChangeText={setPersonnelCount}
                      placeholder="0"
                      placeholderTextColor={iosColors.labelMuted}
                      keyboardType="numeric"
                      style={[styles.fieldInput, styles.fieldInputMono]}
                    />
                  </View>
                </View>

                {/* Yapılan İmalatlar */}
                <View>
                  <Text style={styles.fieldLabel}>BUGÜN YAPILAN İMALATLAR *</Text>
                  <TextInput
                    value={worksDone}
                    onChangeText={setWorksDone}
                    placeholder="Örn: 4. kat tabliye kalıp montajı ve donatı bağlama işleri tamamlandı."
                    placeholderTextColor={iosColors.labelMuted}
                    multiline
                    numberOfLines={4}
                    textAlignVertical="top"
                    style={[styles.fieldInput, styles.fieldTextArea]}
                  />
                </View>

                {/* Ekipmanlar */}
                <View>
                  <Text style={styles.fieldLabel}>ÇALIŞAN EKİPMANLAR</Text>
                  <TextInput
                    value={equipment}
                    onChangeText={setEquipment}
                    placeholder="Örn: 1 Kule Vinç, 2 Transmikser, 1 Pompa"
                    placeholderTextColor={iosColors.labelMuted}
                    style={styles.fieldInput}
                  />
                </View>

                {/* İSG & Emniyet Notları */}
                <View>
                  <Text style={styles.fieldLabel}>İSG & EMNİYET TEDBİRLERİ</Text>
                  <TextInput
                    value={isgNotes}
                    onChangeText={setIsgNotes}
                    placeholder="Örn: Baret ve emniyet kemeri denetimi yapıldı."
                    placeholderTextColor={iosColors.labelMuted}
                    style={styles.fieldInput}
                  />
                </View>
              </View>
            </ScrollView>

            {/* SABİT (STICKY) DEVASA YEŞİL KAYDET BUTONU */}
            <View style={styles.stickyBottomBar}>
              <TouchableOpacity
                onPress={handleSaveJournal}
                disabled={isSubmitting}
                activeOpacity={0.88}
                style={styles.giantSaveButton}
              >
                {isSubmitting ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Feather name="check-circle" size={20} color="#FFFFFF" />
                    <Text style={styles.giantSaveButtonText}>
                      Jurnali Kaydet & Merkeze İlet
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>
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
  hamburgerButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "rgba(255, 255, 255, 0.06)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  headerSubtitle: {
    fontSize: 11,
    fontWeight: "700",
    color: iosColors.labelSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: "800",
    color: iosColors.labelPrimary,
    letterSpacing: -0.4,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  queueBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    backgroundColor: "rgba(255, 149, 0, 0.15)",
    borderWidth: 1,
    borderColor: "rgba(255, 149, 0, 0.3)",
  },
  queueBadgeText: {
    fontSize: 10,
    fontWeight: "800",
    color: iosColors.systemOrange,
  },
  newJournalBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: iosColors.systemBlue,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: iosRadius.button,
  },
  newJournalBtnText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
  },
  offlineToast: {
    marginHorizontal: 20,
    marginTop: 10,
    padding: 12,
    borderRadius: 14,
    backgroundColor: "rgba(255, 149, 0, 0.15)",
    borderWidth: 1,
    borderColor: "rgba(255, 149, 0, 0.35)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  offlineToastText: {
    fontSize: 12,
    color: iosColors.systemOrange,
    fontWeight: "600",
    flex: 1,
    marginHorizontal: 8,
    lineHeight: 16,
  },
  scrollArea: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  scrollContent: {
    paddingBottom: 110,
  },
  weatherCard: {
    backgroundColor: iosColors.glassCard,
    borderRadius: iosRadius.cardLarge,
    borderWidth: 1,
    borderColor: iosColors.glassBorder,
    padding: 18,
    overflow: "hidden",
    position: "relative",
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 3,
  },
  weatherCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  weatherHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  weatherIconCircle: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: "rgba(10, 122, 255, 0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  weatherCardTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: iosColors.labelPrimary,
  },
  weatherCardSubtitle: {
    fontSize: 11,
    color: iosColors.labelSecondary,
  },
  antiSpoofBadgeSuccess: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(52, 199, 89, 0.15)",
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: iosRadius.badge,
    borderWidth: 1,
    borderColor: "rgba(52, 199, 89, 0.35)",
  },
  antiSpoofBadgeDanger: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(255, 59, 48, 0.15)",
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: iosRadius.badge,
    borderWidth: 1,
    borderColor: "rgba(255, 59, 48, 0.35)",
  },
  antiSpoofText: {
    fontSize: 10,
    fontWeight: "800",
  },
  weatherDetails: {
    borderTopWidth: 1,
    borderTopColor: iosColors.glassBorder,
    paddingTop: 12,
  },
  weatherRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  weatherTempRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  weatherTempText: {
    fontSize: 22,
    fontWeight: "800",
    color: iosColors.labelPrimary,
  },
  weatherDescText: {
    fontSize: 13,
    color: iosColors.labelSecondary,
  },
  windText: {
    fontSize: 12,
    color: iosColors.labelSecondary,
  },
  coordsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 10,
  },
  coordsText: {
    fontSize: 11,
    color: iosColors.labelSecondary,
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
  },
  refreshBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    backgroundColor: "rgba(10, 122, 255, 0.12)",
  },
  refreshBtnText: {
    fontSize: 10,
    fontWeight: "700",
    color: iosColors.systemBlue,
  },
  weatherLoadingBox: {
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  weatherLoadingText: {
    fontSize: 12,
    color: iosColors.labelSecondary,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: "700",
    color: iosColors.labelSecondary,
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  journalItemCard: {
    backgroundColor: iosColors.glassCard,
    borderRadius: iosRadius.card,
    borderWidth: 1,
    borderColor: iosColors.glassBorder,
    padding: 16,
    marginBottom: 12,
  },
  journalItemHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  journalItemDate: {
    fontSize: 14,
    fontWeight: "700",
    color: iosColors.labelPrimary,
  },
  journalItemBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  journalItemBadgeSuccess: {
    backgroundColor: "rgba(52, 199, 89, 0.15)",
    borderColor: "rgba(52, 199, 89, 0.35)",
  },
  journalItemBadgeWarning: {
    backgroundColor: "rgba(10, 122, 255, 0.15)",
    borderColor: "rgba(10, 122, 255, 0.35)",
  },
  journalItemBadgeDraft: {
    backgroundColor: "rgba(255, 149, 0, 0.15)",
    borderColor: "rgba(255, 149, 0, 0.35)",
  },
  journalItemBadgeText: {
    fontSize: 9,
    fontWeight: "800",
  },
  journalItemBlock: {
    fontSize: 12,
    fontWeight: "600",
    color: iosColors.systemBlue,
    marginBottom: 4,
  },
  journalItemWorks: {
    fontSize: 13,
    color: iosColors.labelSecondary,
    lineHeight: 18,
    marginBottom: 12,
  },
  journalItemFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: iosColors.glassBorder,
    paddingTop: 10,
  },
  footerItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  footerText: {
    fontSize: 11,
    color: iosColors.labelSecondary,
  },
  sheetHandle: {
    width: 44,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    alignSelf: "center",
    marginTop: 10,
    marginBottom: 6,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: iosColors.glassBorder,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: iosColors.labelPrimary,
  },
  modalSubtitle: {
    fontSize: 12,
    color: iosColors.labelSecondary,
    marginTop: 2,
  },
  modalCloseBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: iosColors.labelSecondary,
    letterSpacing: 0.6,
    marginBottom: 6,
  },
  fieldInput: {
    backgroundColor: "rgba(255, 255, 255, 0.04)",
    borderRadius: iosRadius.input,
    borderWidth: 1,
    borderColor: iosColors.glassBorder,
    color: "#FFFFFF",
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
  },
  fieldInputMono: {
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
  },
  fieldTextArea: {
    minHeight: 90,
  },
  flexRowFields: {
    flexDirection: "row",
    gap: 12,
  },
  stickyBottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: Platform.OS === "ios" ? 30 : 16,
    backgroundColor: "rgba(10, 15, 28, 0.96)",
    borderTopWidth: 1,
    borderTopColor: iosColors.glassBorder,
  },
  giantSaveButton: {
    width: "100%",
    backgroundColor: iosColors.systemGreen,
    borderRadius: iosRadius.button,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
    shadowColor: iosColors.systemGreen,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
  giantSaveButtonText: {
    fontSize: 16,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: -0.2,
  },
});
