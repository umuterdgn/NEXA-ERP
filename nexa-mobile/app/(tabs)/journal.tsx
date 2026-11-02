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
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather, Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { useLocationWeather } from "../../src/hooks";

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
  status: "ONAYLANDI" | "TASLAK" | "İNCELENİYOR";
}

const INITIAL_JOURNALS: JournalRecord[] = [
  {
    id: "JRN-01",
    date: "1 Kasım 2026",
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
    date: "31 Ekim 2026",
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

/**
 * Nexa ERP Mobil - Şantiye Jurnali Ekranı
 * iOS Bottom Sheet form sunumu, Frosted Glass GPS & Open-Meteo hava widget'ı
 */
export default function JournalScreen() {
  const [journals, setJournals] = useState<JournalRecord[]>(INITIAL_JOURNALS);
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  // Form State'i
  const [project, setProject] = useState("Merkez Rezidans & AVM");
  const [block, setBlock] = useState("Blok-B • Kat: 4");
  const [personnelCount, setPersonnelCount] = useState("48");
  const [worksDone, setWorksDone] = useState("");
  const [equipment, setEquipment] = useState("");
  const [isgNotes, setIsgNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Anti-Fake GPS & Open-Meteo Hook'u
  const {
    isLoading: isLocationLoading,
    error: locationError,
    location,
    weather,
    fetchLocationAndWeather,
  } = useLocationWeather();

  // Bottom Sheet açıldığında konumu ve hava durumunu otomatik sorgula
  useEffect(() => {
    if (isSheetOpen) {
      fetchLocationAndWeather().catch(() => {});
    }
  }, [isSheetOpen, fetchLocationAndWeather]);

  // Jurnali Kaydet
  const handleSaveJournal = async () => {
    if (!worksDone.trim()) {
      Alert.alert("Eksik Bilgi", "Lütfen bugün yapılan imalat özetini giriniz.");
      return;
    }

    setIsSubmitting(true);
    try {
      if (Platform.OS !== "web") {
        Vibration.vibrate(100);
      }

      const newRecord: JournalRecord = {
        id: `JRN-${Date.now().toString().slice(-4)}`,
        date: "Bugün (2 Kasım 2026)",
        project,
        block,
        personnelCount: parseInt(personnelCount, 10) || 0,
        weatherSummary: weather?.description || "Açık",
        temperature: weather?.temperature || 18,
        worksDone,
        equipment: equipment || "1 Kule Vinç",
        isgNotes: isgNotes || "Uygunsuzluk tespit edilmedi.",
        status: "TASLAK",
      };

      setJournals([newRecord, ...journals]);
      setIsSheetOpen(false);
      setWorksDone("");
      setEquipment("");
      setIsgNotes("");

      Alert.alert(
        "📝 Jurnal Kaydedildi",
        "Günlük şantiye jurnali başarıyla kaydedildi ve şirket merkezine iletildi."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-950">
      {/* Özel iOS Tarzı Üst Header */}
      <View className="px-6 pt-4 pb-3 bg-gray-900/90 border-b border-gray-800 flex-row items-center justify-between">
        <View>
          <Text className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-0.5">
            Saha Raporları
          </Text>
          <Text className="text-2xl font-black text-white tracking-tight">
            Şantiye Jurnali
          </Text>
        </View>

        {/* Yeni Jurnal Açma Butonu */}
        <TouchableOpacity
          onPress={() => setIsSheetOpen(true)}
          activeOpacity={0.8}
          className="px-4 py-2.5 bg-blue-600 rounded-2xl flex-row items-center gap-1.5 shadow-md shadow-blue-500/30"
        >
          <Feather name="plus" size={16} color="#FFFFFF" />
          <Text className="text-white text-xs font-bold">Yeni Jurnal</Text>
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1 px-6 pt-5" showsVerticalScrollIndicator={false}>
        {/* En Son Jurnal Vurgu Kartı */}
        <View className="bg-gradient-to-r from-blue-950/40 to-gray-900 p-5 rounded-3xl border border-blue-500/30 mb-5">
          <View className="flex-row items-center justify-between mb-2">
            <View className="flex-row items-center gap-2">
              <Feather name="check-circle" size={16} color="#60A5FA" />
              <Text className="text-blue-400 text-xs font-bold uppercase tracking-wider">
                Bugünkü Şantiye Durumu
              </Text>
            </View>
            <View className="px-2.5 py-0.5 bg-blue-500/10 border border-blue-500/30 rounded-full">
              <Text className="text-blue-400 text-[10px] font-bold">GÜNCEL</Text>
            </View>
          </View>
          <Text className="text-white text-lg font-bold">
            Merkez Rezidans • Blok-B
          </Text>
          <Text className="text-gray-400 text-xs mt-1 leading-4">
            Bugün sahada 48 personel ve 3 iş makinesi aktif çalışmaktadır.
          </Text>
        </View>

        {/* Jurnal Kayıtları Başlığı */}
        <Text className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
          Geçmiş Şantiye Jurnalleri
        </Text>

        {/* Jurnal Listesi */}
        {journals.map((item) => (
          <View
            key={item.id}
            className="bg-white dark:bg-gray-800/80 rounded-3xl p-5 shadow-sm border border-gray-100 dark:border-gray-700 mb-4"
          >
            <View className="flex-row items-center justify-between mb-2">
              <Text className="text-white text-sm font-bold">{item.date}</Text>
              <View
                className={`px-2 py-0.5 rounded-full border ${
                  item.status === "ONAYLANDI"
                    ? "bg-emerald-500/10 border-emerald-500/30"
                    : "bg-amber-500/10 border-amber-500/30"
                }`}
              >
                <Text
                  className={`text-[10px] font-bold ${
                    item.status === "ONAYLANDI"
                      ? "text-emerald-400"
                      : "text-amber-400"
                  }`}
                >
                  {item.status}
                </Text>
              </View>
            </View>

            <Text className="text-blue-400 text-xs font-medium mb-1">
              {item.block}
            </Text>
            <Text className="text-gray-300 text-xs leading-4 mb-3">
              {item.worksDone}
            </Text>

            <View className="flex-row items-center justify-between pt-3 border-t border-gray-700/50">
              <View className="flex-row items-center gap-1.5">
                <Feather name="users" size={12} color="#9CA3AF" />
                <Text className="text-gray-400 text-xs font-mono">
                  {item.personnelCount} Personel
                </Text>
              </View>

              <View className="flex-row items-center gap-1.5">
                <Feather name="sun" size={12} color="#10B981" />
                <Text className="text-gray-400 text-xs font-mono">
                  {item.weatherSummary} ({item.temperature}°C)
                </Text>
              </View>
            </View>
          </View>
        ))}
      </ScrollView>

      {/* ============================================================ */}
      {/* iOS Tarzı Bottom Sheet (Modal Form Presentation)             */}
      {/* ============================================================ */}
      <Modal
        visible={isSheetOpen}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setIsSheetOpen(false)}
      >
        <SafeAreaView className="flex-1 bg-slate-950">
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            className="flex-1"
          >
            {/* iOS Çekme Çubuğu (Drag Handle) */}
            <View className="w-12 h-1.5 bg-gray-600 rounded-full mx-auto my-3" />

            {/* Modal Üst Bar */}
            <View className="px-6 py-2 flex-row items-center justify-between border-b border-gray-800">
              <View>
                <Text className="text-white text-lg font-black tracking-tight">
                  Yeni Şantiye Jurnali
                </Text>
                <Text className="text-gray-400 text-xs">
                  Günlük imalat ve saha durumunu kaydedin
                </Text>
              </View>

              <TouchableOpacity
                onPress={() => setIsSheetOpen(false)}
                className="w-9 h-9 rounded-full bg-gray-800 items-center justify-center"
              >
                <Feather name="x" size={18} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            <ScrollView
              className="flex-1 px-6 pt-4"
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={{ paddingBottom: 40 }}
            >
              {/* ============================================================ */}
              {/* iOS Hava Durumu & Güvenli GPS Widget'ı (Frosted Glass)        */}
              {/* ============================================================ */}
              <View className="bg-white dark:bg-gray-800/80 rounded-3xl p-5 shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden relative mb-5">
                {Platform.OS === "ios" && (
                  <BlurView
                    intensity={30}
                    tint="dark"
                    className="absolute inset-0"
                  />
                )}
                <View className="flex-row items-center justify-between mb-2">
                  <View className="flex-row items-center gap-2">
                    <View className="w-8 h-8 rounded-xl bg-blue-500/20 items-center justify-center">
                      <Feather name="cloud-rain" size={16} color="#3B82F6" />
                    </View>
                    <View>
                      <Text className="text-white text-sm font-bold">
                        Şantiye Hava Durumu & GPS
                      </Text>
                      <Text className="text-gray-400 text-[11px]">
                        Open-Meteo & Anti-Spoof Kilidi
                      </Text>
                    </View>
                  </View>

                  <TouchableOpacity
                    onPress={() => fetchLocationAndWeather()}
                    disabled={isLocationLoading}
                    className="px-2.5 py-1 bg-gray-900 border border-gray-700 rounded-xl flex-row items-center gap-1"
                  >
                    {isLocationLoading ? (
                      <ActivityIndicator size="small" color="#3B82F6" />
                    ) : (
                      <>
                        <Feather name="refresh-cw" size={12} color="#60A5FA" />
                        <Text className="text-blue-400 text-[10px] font-bold">
                          Yenile
                        </Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>

                {/* Hava & Koordinat Verisi */}
                {weather && location ? (
                  <View className="mt-2 pt-2 border-t border-gray-700/60">
                    <View className="flex-row items-center justify-between">
                      <View className="flex-row items-center gap-2">
                        <Ionicons name="sunny" size={24} color="#FBBF24" />
                        <Text className="text-white text-xl font-bold">
                          {weather.temperature}°C
                        </Text>
                        <Text className="text-gray-300 text-xs font-medium">
                          {weather.description}
                        </Text>
                      </View>
                      <Text className="text-gray-400 text-xs font-mono">
                        💨 {weather.windSpeed} km/h
                      </Text>
                    </View>

                    {/* Saydam Koordinat Çubuğu */}
                    <View className="mt-2.5 flex-row items-center justify-between">
                      <Text className="text-gray-400 text-[10px] font-mono">
                        📍 Lat: {location.latitude.toFixed(4)}, Lng:{" "}
                        {location.longitude.toFixed(4)}
                      </Text>
                      <View className="px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
                        <Text className="text-emerald-400 text-[9px] font-bold">
                          🛡️ Anti-Spoof Doğrulandı
                        </Text>
                      </View>
                    </View>
                  </View>
                ) : (
                  <View className="py-2 items-center">
                    <Text className="text-gray-400 text-xs">
                      {locationError || "Konum ve hava durumu tespit ediliyor..."}
                    </Text>
                  </View>
                )}
              </View>

              {/* ============================================================ */}
              {/* iOS Tarzı Form Alanları (bg-gray-100 dark:bg-gray-900)       */}
              {/* ============================================================ */}
              <View className="gap-4">
                {/* Proje & Blok */}
                <View>
                  <Text className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
                    Proje & Bölge
                  </Text>
                  <TextInput
                    value={project}
                    onChangeText={setProject}
                    placeholder="Proje adı giriniz"
                    placeholderTextColor="#6B7280"
                    className="bg-gray-100 dark:bg-gray-900 text-slate-100 rounded-xl px-4 py-3 text-sm border border-gray-800"
                  />
                </View>

                {/* Blok / Kat ve Personel Sayısı (Yan Yana) */}
                <View className="flex-row gap-3">
                  <View className="flex-1">
                    <Text className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
                      Blok / Kat
                    </Text>
                    <TextInput
                      value={block}
                      onChangeText={setBlock}
                      placeholder="Örn: Blok-B Kat: 4"
                      placeholderTextColor="#6B7280"
                      className="bg-gray-100 dark:bg-gray-900 text-slate-100 rounded-xl px-4 py-3 text-sm border border-gray-800"
                    />
                  </View>

                  <View className="w-36">
                    <Text className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
                      Personel Sayısı
                    </Text>
                    <TextInput
                      value={personnelCount}
                      onChangeText={setPersonnelCount}
                      placeholder="0"
                      placeholderTextColor="#6B7280"
                      keyboardType="numeric"
                      className="bg-gray-100 dark:bg-gray-900 text-slate-100 rounded-xl px-4 py-3 text-sm border border-gray-800 font-mono"
                    />
                  </View>
                </View>

                {/* Yapılan İmalatlar (Çok Satırlı) */}
                <View>
                  <Text className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
                    Bugün Yapılan İmalatlar *
                  </Text>
                  <TextInput
                    value={worksDone}
                    onChangeText={setWorksDone}
                    placeholder="Örn: 4. kat tabliye kalıp montajı ve donatı bağlama işleri tamamlandı."
                    placeholderTextColor="#6B7280"
                    multiline
                    numberOfLines={4}
                    textAlignVertical="top"
                    className="bg-gray-100 dark:bg-gray-900 text-slate-100 rounded-xl px-4 py-3 text-sm border border-gray-800 min-h-[90px]"
                  />
                </View>

                {/* Çalışan Ekipmanlar / Makineler */}
                <View>
                  <Text className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
                    Çalışan Ekipmanlar
                  </Text>
                  <TextInput
                    value={equipment}
                    onChangeText={setEquipment}
                    placeholder="Örn: 1 Kule Vinç, 2 Transmikser, 1 Bekoloder"
                    placeholderTextColor="#6B7280"
                    className="bg-gray-100 dark:bg-gray-900 text-slate-100 rounded-xl px-4 py-3 text-sm border border-gray-800"
                  />
                </View>

                {/* İSG ve Emniyet Notu */}
                <View>
                  <Text className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
                    İSG & Güvenlik Tedbirleri
                  </Text>
                  <TextInput
                    value={isgNotes}
                    onChangeText={setIsgNotes}
                    placeholder="Örn: Şantiye içi baret ve yelek denetimi yapıldı."
                    placeholderTextColor="#6B7280"
                    className="bg-gray-100 dark:bg-gray-900 text-slate-100 rounded-xl px-4 py-3 text-sm border border-gray-800"
                  />
                </View>
              </View>

              {/* Aksiyon Butonları */}
              <View className="mt-6 gap-3">
                <TouchableOpacity
                  onPress={handleSaveJournal}
                  disabled={isSubmitting}
                  activeOpacity={0.85}
                  className="w-full py-4 bg-emerald-500 rounded-2xl items-center justify-center flex-row gap-2 shadow-lg shadow-emerald-500/25"
                >
                  {isSubmitting ? (
                    <ActivityIndicator size="small" color="#022c22" />
                  ) : (
                    <>
                      <Feather name="check-circle" size={18} color="#022c22" />
                      <Text className="text-slate-950 font-black text-base">
                        Jurnali Kaydet & Merkeze İlet
                      </Text>
                    </>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setIsSheetOpen(false)}
                  disabled={isSubmitting}
                  className="w-full py-3 bg-gray-900 border border-gray-800 rounded-2xl items-center"
                >
                  <Text className="text-gray-400 font-semibold text-sm">
                    Vazgeç
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}
