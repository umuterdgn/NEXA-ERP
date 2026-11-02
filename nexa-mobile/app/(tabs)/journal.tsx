import React from "react";
import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";

/**
 * Nexa ERP Mobil - Şantiye Günlük Jurnali
 */
export default function JournalScreen() {
  return (
    <SafeAreaView className="flex-1 bg-slate-950">
      {/* Özel Üst Header Bar */}
      <View className="px-5 py-4 bg-gray-900/90 border-b border-gray-800 flex-row items-center justify-between">
        <View>
          <Text className="text-white text-lg font-bold">Şantiye Jurnali</Text>
          <Text className="text-gray-400 text-xs">Günlük Saha & İmalat Raporları</Text>
        </View>

        <TouchableOpacity className="px-3 py-1.5 bg-blue-600 rounded-lg flex-row items-center gap-1.5">
          <Feather name="plus" size={14} color="#FFFFFF" />
          <Text className="text-white text-xs font-semibold">Yeni Jurnal</Text>
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1 px-5 pt-5" showsVerticalScrollIndicator={false}>
        {/* Bugünün Jurnal Durumu */}
        <View className="bg-gray-900 border border-gray-800 p-5 rounded-2xl mb-5">
          <View className="flex-row items-center justify-between mb-3">
            <View className="flex-row items-center gap-2">
              <Feather name="calendar" size={16} color="#3B82F6" />
              <Text className="text-gray-300 text-sm font-semibold">Bugün: 2 Kasım 2026</Text>
            </View>
            <View className="px-2 py-0.5 bg-amber-500/10 border border-amber-500/30 rounded-full">
              <Text className="text-amber-400 text-[10px] font-bold">TASLAK</Text>
            </View>
          </View>

          <View className="gap-2 border-t border-gray-800/80 pt-3">
            <View className="flex-row justify-between">
              <Text className="text-gray-400 text-xs">Hava Durumu:</Text>
              <Text className="text-slate-200 text-xs font-medium">Açık / Güneşli, 18°C (Open-Meteo)</Text>
            </View>
            <View className="flex-row justify-between">
              <Text className="text-gray-400 text-xs">Toplam Personel:</Text>
              <Text className="text-slate-200 text-xs font-medium">32 Çalışan</Text>
            </View>
            <View className="flex-row justify-between">
              <Text className="text-gray-400 text-xs">Eklenen Kanıt Fotoğrafı:</Text>
              <Text className="text-slate-200 text-xs font-medium">4 Medya</Text>
            </View>
          </View>
        </View>

        {/* Geçmiş Jurnaller Listesi */}
        <Text className="text-sm font-bold text-gray-300 uppercase tracking-wider mb-3">
          Son Kayıtlar
        </Text>

        {[
          { date: "1 Kasım 2026", status: "ONAYLANDI", staff: 45, color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/30" },
          { date: "31 Ekim 2026", status: "ONAYLANDI", staff: 42, color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/30" },
          { date: "30 Ekim 2026", status: "ONAYLANDI", staff: 48, color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/30" },
        ].map((item, idx) => (
          <View key={idx} className="bg-gray-900 border border-gray-800 p-4 rounded-xl mb-3 flex-row items-center justify-between">
            <View>
              <Text className="text-white font-semibold text-sm">{item.date}</Text>
              <Text className="text-gray-400 text-xs mt-0.5">{item.staff} Personel Sahada</Text>
            </View>
            <View className={`px-2 py-0.5 rounded-full border ${item.bg}`}>
              <Text className={`text-[10px] font-bold ${item.color}`}>{item.status}</Text>
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}
