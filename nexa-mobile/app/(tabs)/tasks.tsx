import React, { useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Vibration,
  Platform,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import ReanimatedSwipeable from "react-native-gesture-handler/ReanimatedSwipeable";

export interface TaskItem {
  id: string;
  code: string;
  title: string;
  description: string;
  location: string;
  priority: "KRİTİK" | "YÜKSEK" | "ORTA" | "DÜŞÜK";
  status: "BEKLİYOR" | "DEVAM EDİYOR" | "TAMAMLANDI";
  dueDate: string;
}

const INITIAL_TASKS: TaskItem[] = [
  {
    id: "1",
    code: "TSK-201",
    title: "Kolon Donatısı ve Paspayı Kontrolü",
    description: "Statik projeye göre demir bağlama ve paspayı takozları kontrol edilecek.",
    location: "Blok-B • Kat: 3",
    priority: "KRİTİK",
    status: "DEVAM EDİYOR",
    dueDate: "Bugün 16:30",
  },
  {
    id: "2",
    code: "TSK-202",
    title: "C30 Hazır Beton Numunesi Alma",
    description: "Gelen transmikserden slump ve 6 adet küp numune alınması.",
    location: "Laboratuvar & Zemin",
    priority: "YÜKSEK",
    status: "BEKLİYOR",
    dueDate: "Bugün 17:00",
  },
  {
    id: "3",
    code: "TSK-203",
    title: "İSG Güvenlik Filesi ve Korkuluk Teftişi",
    description: "Cephe iskelesi ankrajları ve güvenlik file bağlantı kontrolü.",
    location: "Tüm Katlar (Dış Cephe)",
    priority: "KRİTİK",
    status: "BEKLİYOR",
    dueDate: "Yarın 10:00",
  },
  {
    id: "4",
    code: "TSK-204",
    title: "Şantiye Su Yalıtım Membranı Muayenesi",
    description: "Bodrum perde duvarları bitüm esaslı membran bindirme kontrolü.",
    location: "Blok-A • Bodrum-2",
    priority: "ORTA",
    status: "DEVAM EDİYOR",
    dueDate: "4 Kasım 2026",
  },
  {
    id: "5",
    code: "TSK-205",
    title: "Elektrik Tava & Borulama Denetimi",
    description: "Otopark katı asma tavan altı galvaniz tava montajı.",
    location: "Kapalı Otopark",
    priority: "DÜŞÜK",
    status: "TAMAMLANDI",
    dueDate: "1 Kasım 2026",
  },
];

/**
 * Nexa ERP Mobil - İş Emirleri (Tasks) Ekranı
 * iOS Swipe-to-action (Sola kaydırarak görevi tamamlama) ve Apple FlatList tasarımı
 */
export default function TasksScreen() {
  const [tasks, setTasks] = useState<TaskItem[]>(INITIAL_TASKS);
  const [filter, setFilter] = useState<"ALL" | "ACTIVE" | "COMPLETED">("ALL");

  // Görevi Tamamlandı Olarak İşaretle
  const handleCompleteTask = (taskId: string) => {
    if (Platform.OS !== "web") {
      Vibration.vibrate(80);
    }

    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status: "TAMAMLANDI" } : t))
    );

    const target = tasks.find((t) => t.id === taskId);
    Alert.alert(
      "✅ Görev Tamamlandı",
      `"${target?.title || "İş emri"}" başarıyla tamamlandı olarak işaretlendi.`
    );
  };

  // Filtreleme
  const filteredTasks = tasks.filter((t) => {
    if (filter === "ACTIVE") return t.status !== "TAMAMLANDI";
    if (filter === "COMPLETED") return t.status === "TAMAMLANDI";
    return true;
  });

  // Öncelik rozeti renkleri
  const getPriorityStyle = (priority: TaskItem["priority"]) => {
    switch (priority) {
      case "KRİTİK":
        return "bg-rose-500/10 border-rose-500/30 text-rose-400";
      case "YÜKSEK":
        return "bg-amber-500/10 border-amber-500/30 text-amber-400";
      case "ORTA":
        return "bg-blue-500/10 border-blue-500/30 text-blue-400";
      case "DÜŞÜK":
      default:
        return "bg-gray-500/10 border-gray-500/30 text-gray-400";
    }
  };

  // Sola Kaydırıldığında Açılan Sağ Aksiyon (Apple Mail Tarzı Yeşil Tamamla Butonu)
  const renderRightActions = (
    item: TaskItem,
    prog: any,
    drag: any,
    methods: any
  ) => {
    return (
      <TouchableOpacity
        onPress={() => {
          handleCompleteTask(item.id);
          methods?.close?.();
        }}
        activeOpacity={0.8}
        className="bg-emerald-600 justify-center items-center w-24 rounded-2xl mb-3 ml-2 shadow-lg shadow-emerald-500/30"
      >
        <Feather name="check" size={26} color="#FFFFFF" />
        <Text className="text-white text-xs font-bold mt-1">Tamamla</Text>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-950">
      {/* Özel iOS Tarzı Üst Header */}
      <View className="px-6 pt-4 pb-3 bg-gray-900/90 border-b border-gray-800">
        <View className="flex-row items-center justify-between">
          <View>
            <Text className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-0.5">
              Saha İş Akışı
            </Text>
            <Text className="text-2xl font-black text-white tracking-tight">
              İş Emirleri
            </Text>
          </View>

          <View className="px-3 py-1 bg-blue-500/10 border border-blue-500/30 rounded-full">
            <Text className="text-blue-400 text-xs font-bold">
              {filteredTasks.length} Görev
            </Text>
          </View>
        </View>

        {/* iOS Segmented Control (Filtreleme Sekmeleri) */}
        <View className="flex-row bg-gray-950 p-1 rounded-2xl mt-4 border border-gray-800">
          {[
            { id: "ALL", label: "Tümü" },
            { id: "ACTIVE", label: "Devam Edenler" },
            { id: "COMPLETED", label: "Tamamlananlar" },
          ].map((tab) => {
            const isActive = filter === tab.id;
            return (
              <TouchableOpacity
                key={tab.id}
                onPress={() => setFilter(tab.id as any)}
                activeOpacity={0.7}
                className={`flex-1 py-2 rounded-xl items-center ${
                  isActive ? "bg-gray-800 shadow-sm" : ""
                }`}
              >
                <Text
                  className={`text-xs font-bold ${
                    isActive ? "text-white" : "text-gray-400"
                  }`}
                >
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Kaydırma İpucu Notu */}
      <View className="px-6 py-2.5 flex-row items-center justify-between">
        <Text className="text-[11px] text-gray-400">
          💡 İpucu: Görevi tamamlamak için sola kaydırınız
        </Text>
        <Feather name="arrow-left" size={12} color="#9CA3AF" />
      </View>

      {/* Görevler Listesi (FlatList + ReanimatedSwipeable) */}
      <FlatList
        data={filteredTasks}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => {
          const isDone = item.status === "TAMAMLANDI";

          return (
            <ReanimatedSwipeable
              renderRightActions={(prog, drag, methods) =>
                renderRightActions(item, prog, drag, methods)
              }
              overshootRight={false}
            >
              <View
                className={`p-4 rounded-2xl border mb-3 ${
                  isDone
                    ? "bg-gray-900/40 border-gray-800/50 opacity-60"
                    : "bg-white dark:bg-gray-800/90 border-gray-100 dark:border-gray-700 shadow-sm"
                }`}
              >
                {/* Üst Satır: Kod ve Rozetler */}
                <View className="flex-row items-center justify-between mb-2">
                  <View className="flex-row items-center gap-2">
                    <Text className="text-gray-400 font-mono text-xs font-bold">
                      #{item.code}
                    </Text>
                    <View
                      className={`px-2 py-0.5 rounded-full border ${getPriorityStyle(
                        item.priority
                      )}`}
                    >
                      <Text className="text-[10px] font-bold">
                        {item.priority}
                      </Text>
                    </View>
                  </View>

                  <View
                    className={`px-2 py-0.5 rounded-full border ${
                      isDone
                        ? "bg-emerald-500/10 border-emerald-500/30"
                        : "bg-blue-500/10 border-blue-500/30"
                    }`}
                  >
                    <Text
                      className={`text-[10px] font-bold ${
                        isDone ? "text-emerald-400" : "text-blue-400"
                      }`}
                    >
                      {item.status}
                    </Text>
                  </View>
                </View>

                {/* Başlık ve Açıklama */}
                <Text
                  className={`text-base font-semibold mb-1 ${
                    isDone ? "line-through text-gray-400" : "text-white"
                  }`}
                >
                  {item.title}
                </Text>
                <Text className="text-gray-400 text-xs mb-3 leading-4">
                  {item.description}
                </Text>

                {/* Alt Satır: Konum ve Termin */}
                <View className="flex-row items-center justify-between pt-2.5 border-t border-gray-700/50">
                  <View className="flex-row items-center gap-1.5">
                    <Feather name="map-pin" size={12} color="#9CA3AF" />
                    <Text className="text-gray-300 text-xs font-medium">
                      {item.location}
                    </Text>
                  </View>

                  <View className="flex-row items-center gap-1.5">
                    <Feather name="clock" size={12} color="#9CA3AF" />
                    <Text className="text-gray-400 text-xs font-mono">
                      {item.dueDate}
                    </Text>
                  </View>
                </View>
              </View>
            </ReanimatedSwipeable>
          );
        }}
      />
    </SafeAreaView>
  );
}
