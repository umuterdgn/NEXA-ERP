import React from "react";
import { View, Text, ScrollView, TouchableOpacity, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { authService, clearAuthToken } from "../../src/lib/api";

/**
 * Nexa ERP Mobil - Kullanıcı Profili ve Ayarlar
 */
export default function ProfileScreen() {
  const router = useRouter();

  const handleLogout = async () => {
    Alert.alert(
      "Çıkış Yap",
      "Oturumunuzu kapatmak istediğinize emin misiniz?",
      [
        { text: "Vazgeç", style: "cancel" },
        {
          text: "Çıkış Yap",
          style: "destructive",
          onPress: async () => {
            try {
              await authService.logout();
            } finally {
              clearAuthToken();
              router.replace("/");
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-950">
      {/* Özel Üst Header Bar */}
      <View className="px-5 py-4 bg-gray-900/90 border-b border-gray-800 flex-row items-center justify-between">
        <Text className="text-white text-lg font-bold">Kullanıcı Profili</Text>
        <View className="px-2.5 py-0.5 bg-blue-500/10 border border-blue-500/30 rounded-full">
          <Text className="text-blue-400 text-xs font-semibold">Şantiye Şefi</Text>
        </View>
      </View>

      <ScrollView className="flex-1 px-5 pt-5" showsVerticalScrollIndicator={false}>
        {/* Kullanıcı Bilgi Kartı */}
        <View className="bg-gray-900 border border-gray-800 p-5 rounded-2xl items-center mb-5">
          <View className="w-20 h-20 rounded-full bg-blue-600/20 border-2 border-blue-500 items-center justify-center mb-3">
            <Feather name="user" size={36} color="#3B82F6" />
          </View>
          <Text className="text-white text-lg font-bold">Ahmet Yılmaz</Text>
          <Text className="text-gray-400 text-xs">ahmet.yilmaz@nxerp.com.tr</Text>
          <View className="mt-2 px-3 py-1 bg-gray-800 rounded-full">
            <Text className="text-gray-300 text-[11px] font-mono">
              Tenant: Nexa İnşaat A.Ş.
            </Text>
          </View>
        </View>

        {/* Menü Seçenekleri */}
        <View className="bg-gray-900 border border-gray-800 rounded-2xl p-2 mb-5">
          <TouchableOpacity className="flex-row items-center justify-between p-3.5 border-b border-gray-800">
            <View className="flex-row items-center gap-3">
              <Feather name="bell" size={18} color="#9CA3AF" />
              <Text className="text-white text-sm font-medium">Bildirimler</Text>
            </View>
            <Feather name="chevron-right" size={18} color="#6B7280" />
          </TouchableOpacity>

          <TouchableOpacity className="flex-row items-center justify-between p-3.5 border-b border-gray-800">
            <View className="flex-row items-center gap-3">
              <Feather name="database" size={18} color="#9CA3AF" />
              <Text className="text-white text-sm font-medium">Çevrimdışı Medya Kuyruğu</Text>
            </View>
            <Feather name="chevron-right" size={18} color="#6B7280" />
          </TouchableOpacity>

          <TouchableOpacity className="flex-row items-center justify-between p-3.5">
            <View className="flex-row items-center gap-3">
              <Feather name="shield" size={18} color="#9CA3AF" />
              <Text className="text-white text-sm font-medium">Güvenlik ve İzinler</Text>
            </View>
            <Feather name="chevron-right" size={18} color="#6B7280" />
          </TouchableOpacity>
        </View>

        {/* Çıkış Yap Butonu */}
        <TouchableOpacity
          onPress={handleLogout}
          activeOpacity={0.8}
          className="w-full py-4 bg-rose-500/10 border border-rose-500/30 rounded-xl flex-row items-center justify-center gap-2 mb-8"
        >
          <Feather name="log-out" size={18} color="#F43F5E" />
          <Text className="text-rose-400 font-bold text-sm">Oturumu Kapat</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
