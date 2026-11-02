import React from "react";
import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";

/**
 * Nexa ERP Mobil - İş Emirleri & Saha Görevleri
 */
export default function TasksScreen() {
  const taskList = [
    {
      id: "TSK-104",
      title: "Kolon Donatısı ve Paspayı Kontrolü",
      location: "Blok-B Kat: 3",
      priority: "YÜKSEK",
      priorityColor: "text-rose-400 bg-rose-500/10 border-rose-500/30",
      status: "DEVAM EDİYOR",
    },
    {
      id: "TSK-103",
      title: "C30 Hazır Beton Numunesi Alma",
      location: "Laboratuvar & Saha",
      priority: "ORTA",
      priorityColor: "text-amber-400 bg-amber-500/10 border-amber-500/30",
      status: "BEKLİYOR",
    },
    {
      id: "TSK-102",
      title: "İSG Güvenlik Ağları ve Korkuluk Denetimi",
      location: "Tüm Katlar",
      priority: "KRİTİK",
      priorityColor: "text-rose-400 bg-rose-500/10 border-rose-500/30",
      status: "TAMAMLANDI",
    },
  ];

  return (
    <SafeAreaView className="flex-1 bg-slate-950">
      {/* Özel Üst Header Bar */}
      <View className="px-5 py-4 bg-gray-900/90 border-b border-gray-800 flex-row items-center justify-between">
        <View>
          <Text className="text-white text-lg font-bold">İş Emirleri</Text>
          <Text className="text-gray-400 text-xs">Saha Görevleri ve Kontrol Listeleri</Text>
        </View>

        <View className="px-2.5 py-1 bg-blue-500/10 border border-blue-500/20 rounded-full">
          <Text className="text-blue-400 text-xs font-semibold">{taskList.length} Görev</Text>
        </View>
      </View>

      <ScrollView className="flex-1 px-5 pt-5" showsVerticalScrollIndicator={false}>
        {taskList.map((task) => (
          <TouchableOpacity
            key={task.id}
            activeOpacity={0.8}
            className="bg-gray-900 border border-gray-800 p-4 rounded-xl mb-3.5"
          >
            <View className="flex-row items-center justify-between mb-2">
              <Text className="text-gray-400 text-xs font-mono font-semibold">
                #{task.id}
              </Text>
              <View className={`px-2 py-0.5 rounded-full border ${task.priorityColor}`}>
                <Text className="text-[10px] font-bold">{task.priority}</Text>
              </View>
            </View>

            <Text className="text-white text-base font-bold mb-1.5">{task.title}</Text>

            <View className="flex-row items-center justify-between mt-2 pt-2 border-t border-gray-800/60">
              <View className="flex-row items-center gap-1.5">
                <Feather name="map-pin" size={12} color="#9CA3AF" />
                <Text className="text-gray-400 text-xs">{task.location}</Text>
              </View>

              <Text className="text-emerald-400 text-xs font-semibold">
                {task.status}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}
