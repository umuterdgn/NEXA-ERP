import React from "react";
import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";

/**
 * Nexa ERP Mobil - Ana Sayfa (Dashboard)
 */
export default function HomeScreen() {
  return (
    <SafeAreaView className="flex-1 bg-slate-950">
      {/* Özel Üst Header Bar */}
      <View className="px-5 py-4 bg-gray-900/90 border-b border-gray-800 flex-row items-center justify-between">
        <View className="flex-row items-center gap-2.5">
          <View className="w-9 h-9 rounded-xl bg-blue-600 items-center justify-center shadow-md shadow-blue-500/20">
            <Text className="text-white font-black text-base">NX</Text>
          </View>
          <View>
            <Text className="text-white text-base font-bold">Nexa ERP</Text>
            <Text className="text-gray-400 text-xs">Şantiye ve Saha Yönetimi</Text>
          </View>
        </View>

        <View className="flex-row items-center gap-2">
          <View className="px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex-row items-center gap-1.5">
            <View className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <Text className="text-emerald-400 text-[11px] font-semibold">Çevrimiçi</Text>
          </View>
        </View>
      </View>

      <ScrollView className="flex-1 px-5 pt-5" showsVerticalScrollIndicator={false}>
        {/* Hoş Geldiniz Banner */}
        <View className="bg-gradient-to-r from-blue-900/40 to-slate-900 p-5 rounded-2xl border border-blue-500/30 mb-5">
          <View className="flex-row items-center gap-2 mb-1">
            <Feather name="activity" size={16} color="#60A5FA" />
            <Text className="text-blue-400 text-xs font-bold uppercase tracking-wider">
              Aktif Proje Özeti
            </Text>
          </View>
          <Text className="text-white text-xl font-bold">Merkez Rezidans & AVM</Text>
          <Text className="text-gray-400 text-xs mt-1">
            Blok-B Kat: 4 Betonarme İmalatları devam ediyor
          </Text>
        </View>

        {/* Hızlı İstatistik Kartları */}
        <View className="flex-row gap-3 mb-5">
          <View className="flex-1 bg-gray-900 border border-gray-800 p-4 rounded-xl">
            <View className="flex-row items-center justify-between mb-2">
              <Text className="text-gray-400 text-xs font-medium">Günlük Personel</Text>
              <Feather name="users" size={16} color="#3B82F6" />
            </View>
            <Text className="text-white text-2xl font-bold">48</Text>
            <Text className="text-emerald-400 text-[10px] mt-1 font-semibold">Aktif Sahada</Text>
          </View>

          <View className="flex-1 bg-gray-900 border border-gray-800 p-4 rounded-xl">
            <View className="flex-row items-center justify-between mb-2">
              <Text className="text-gray-400 text-xs font-medium">Açık İş Emri</Text>
              <Feather name="check-circle" size={16} color="#F59E0B" />
            </View>
            <Text className="text-white text-2xl font-bold">12</Text>
            <Text className="text-amber-400 text-[10px] mt-1 font-semibold">3 Yüksek Öncelik</Text>
          </View>
        </View>

        {/* Hızlı İşlemler */}
        <Text className="text-sm font-bold text-gray-300 uppercase tracking-wider mb-3">
          Hızlı Saha İşlemleri
        </Text>
        <View className="bg-gray-900 border border-gray-800 rounded-2xl p-3 mb-6">
          <TouchableOpacity className="flex-row items-center justify-between p-3 border-b border-gray-800">
            <View className="flex-row items-center gap-3">
              <View className="w-9 h-9 rounded-lg bg-blue-500/10 items-center justify-center">
                <Feather name="file-text" size={18} color="#3B82F6" />
              </View>
              <View>
                <Text className="text-white text-sm font-semibold">Yeni Jurnal Girişi</Text>
                <Text className="text-gray-400 text-xs">Bugünkü hava, personel ve imalat kaydı</Text>
              </View>
            </View>
            <Feather name="chevron-right" size={18} color="#6B7280" />
          </TouchableOpacity>

          <TouchableOpacity className="flex-row items-center justify-between p-3">
            <View className="flex-row items-center gap-3">
              <View className="w-9 h-9 rounded-lg bg-emerald-500/10 items-center justify-center">
                <Feather name="camera" size={18} color="#10B981" />
              </View>
              <View>
                <Text className="text-white text-sm font-semibold">Saha Fotoğrafı Yükle</Text>
                <Text className="text-gray-400 text-xs">Çevrimdışı medya kuyruğuna kanıt ekle</Text>
              </View>
            </View>
            <Feather name="chevron-right" size={18} color="#6B7280" />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
