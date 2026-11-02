import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Modal,
  Alert,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather, Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { useRouter } from "expo-router";
import { useAuth, UserRole } from "../../src/hooks/useAuth";
import { QRScanner } from "../../src/components/scanner";

/**
 * Nexa ERP Mobil - iOS Tasarım Dilli Dinamik Ana Sayfa (Dashboard)
 * Kullanıcı rolüne (ENGINEER, DRIVER, SUBCONTRACTOR, INSPECTOR) göre özelleşen Frosted Glass Widget'lar
 */
export default function DynamicHomeScreen() {
  const router = useRouter();
  const { user, role, setRole } = useAuth();
  const [showQRScanner, setShowQRScanner] = useState(false);

  // iOS tarzı dinamik tarih metni
  const todayFormatted = new Date()
    .toLocaleDateString("tr-TR", {
      weekday: "long",
      day: "numeric",
      month: "long",
    })
    .toUpperCase();

  // İlk isim alıcı
  const firstName = user.name ? user.name.split(" ")[0] : "Kullanıcı";

  // QR Tarama Tamamlandığında
  const handleQRScanned = (data: string, type?: string) => {
    Alert.alert(
      "📦 İrsaliye Teslim Alındı",
      `Kod: ${data}\nTip: ${type || "Barkod"}\n\nŞantiye malzeme deposuna giriş onaylandı!`
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-950">
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        {/* ============================================================ */}
        {/* ADIM 2: iOS Tarzı Karşılama (Büyük Typography Header)        */}
        {/* ============================================================ */}
        <View className="px-6 pt-4 pb-3">
          {/* Küçük Gri Tarih */}
          <Text className="text-xs font-semibold text-gray-400 tracking-wider uppercase mb-1">
            {todayFormatted}
          </Text>

          {/* Kocaman, Kalın iOS Başlığı & Profil Avatarı */}
          <View className="flex-row items-center justify-between">
            <View className="flex-1 pr-3">
              <Text className="text-3xl font-black text-white tracking-tight">
                Merhaba, {firstName}
              </Text>
            </View>

            {/* iOS Tarzı Profil Rozeti */}
            <TouchableOpacity
              activeOpacity={0.8}
              className="w-12 h-12 rounded-full bg-blue-600/20 border-2 border-blue-500 items-center justify-center shadow-md shadow-blue-500/20"
            >
              <Text className="text-blue-400 font-bold text-base">
                {firstName.substring(0, 2).toUpperCase()}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Şirket / Şantiye Bilgi Etiketi */}
          <View className="flex-row items-center gap-2 mt-2">
            <View className="w-2 h-2 rounded-full bg-emerald-400" />
            <Text className="text-gray-400 text-xs font-medium">
              Merkez Rezidans Projesi • {user.tenantName || "Nexa ERP"}
            </Text>
          </View>
        </View>

        {/* ============================================================ */}
        {/* Hızlı Rol Değiştirici (Segmented Control - Test & Demo İçin)  */}
        {/* ============================================================ */}
        <View className="px-6 py-2">
          <Text className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">
            Aktif Rol Simülasyonu
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="flex-row gap-2"
          >
            {[
              { id: "ENGINEER", label: "Saha Ekibi", icon: "hard-hat" },
              { id: "DRIVER", label: "Şoför", icon: "truck" },
              { id: "WAREHOUSE", label: "Depo Sorumlusu", icon: "package" },
              { id: "SUBCONTRACTOR", label: "Taşeron", icon: "briefcase" },
              { id: "INSPECTOR", label: "Yapı Denetim", icon: "check-circle" },
            ].map((tab) => {
              const isActive = role === tab.id;
              return (
                <TouchableOpacity
                  key={tab.id}
                  onPress={() => setRole(tab.id as UserRole)}
                  activeOpacity={0.7}
                  className={`px-4 py-2 rounded-2xl flex-row items-center gap-1.5 border ${
                    isActive
                      ? "bg-blue-600 border-blue-400 shadow-md shadow-blue-500/30"
                      : "bg-gray-900/90 border-gray-800"
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
          </ScrollView>
        </View>

        {/* ============================================================ */}
        {/* ADIM 3 & 4: Rol Bazlı Dinamik iOS Frosted Glass Kartları      */}
        {/* ============================================================ */}
        <View className="px-6 pt-3 gap-5">
          {/* ---------------------------------------------------------- */}
          {/* ROL 1: ENGINEER veya FOREMAN (Saha Ekibi)                  */}
          {/* ---------------------------------------------------------- */}
          {(role === "ENGINEER" || role === "FOREMAN" || role === "ADMIN") && (
            <>
              {/* Kart 1: Bekleyen Görevlerim */}
              <View className="bg-white dark:bg-gray-800/80 rounded-3xl p-5 shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden relative">
                {Platform.OS === "ios" && (
                  <BlurView
                    intensity={30}
                    tint="dark"
                    className="absolute inset-0"
                  />
                )}
                <View className="flex-row items-center justify-between mb-4">
                  <View className="flex-row items-center gap-2">
                    <View className="w-8 h-8 rounded-xl bg-blue-500/20 items-center justify-center">
                      <Feather name="list" size={16} color="#3B82F6" />
                    </View>
                    <View>
                      <Text className="text-white text-base font-bold">
                        Bekleyen Görevlerim
                      </Text>
                      <Text className="text-gray-400 text-xs">
                        Bugün yapılması gereken 4 denetim
                      </Text>
                    </View>
                  </View>
                  <View className="px-2.5 py-1 rounded-full bg-blue-500/10 border border-blue-500/30">
                    <Text className="text-blue-400 text-[11px] font-bold">
                      %68
                    </Text>
                  </View>
                </View>

                {/* İlerleme Çubuğu */}
                <View className="w-full h-2 bg-gray-700/60 rounded-full mb-4 overflow-hidden">
                  <View className="w-[68%] h-full bg-blue-500 rounded-full" />
                </View>

                {/* Görev Maddeleri */}
                <View className="gap-2.5 mb-4">
                  {[
                    {
                      title: "Blok-B 3. Kat Kolon Donatısı Kontrolü",
                      status: "DEVAM EDİYOR",
                      tagColor: "text-amber-400 bg-amber-500/10",
                    },
                    {
                      title: "C30 Hazır Beton Döküm Öncesi İzin",
                      status: "BEKLİYOR",
                      tagColor: "text-rose-400 bg-rose-500/10",
                    },
                    {
                      title: "İSG Güvenlik Filesi ve Korkuluk Teftişi",
                      status: "TAMAMLANDI",
                      tagColor: "text-emerald-400 bg-emerald-500/10",
                    },
                  ].map((task, idx) => (
                    <View
                      key={idx}
                      className="p-3 bg-gray-900/70 border border-gray-700/50 rounded-2xl flex-row items-center justify-between"
                    >
                      <Text className="text-gray-200 text-xs font-semibold flex-1 mr-2">
                        {task.title}
                      </Text>
                      <View className={`px-2 py-0.5 rounded-full ${task.tagColor}`}>
                        <Text className="text-[10px] font-bold">
                          {task.status}
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>

                <TouchableOpacity
                  activeOpacity={0.8}
                  className="w-full py-3 bg-blue-600 rounded-2xl items-center flex-row justify-center gap-2 shadow-md shadow-blue-500/25"
                >
                  <Feather name="check-circle" size={15} color="#FFFFFF" />
                  <Text className="text-white text-xs font-bold">
                    Tüm Görevleri Görüntüle
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Kart 2: Bugünkü Şantiye Jurnali Durumu */}
              <View className="bg-white dark:bg-gray-800/80 rounded-3xl p-5 shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden relative">
                {Platform.OS === "ios" && (
                  <BlurView
                    intensity={30}
                    tint="dark"
                    className="absolute inset-0"
                  />
                )}
                <View className="flex-row items-center justify-between mb-3">
                  <View className="flex-row items-center gap-2">
                    <View className="w-8 h-8 rounded-xl bg-emerald-500/20 items-center justify-center">
                      <Feather name="clipboard" size={16} color="#10B981" />
                    </View>
                    <View>
                      <Text className="text-white text-base font-bold">
                        Şantiye Jurnali Durumu
                      </Text>
                      <Text className="text-gray-400 text-xs">
                        Günlük Rapor: 2 Kasım 2026
                      </Text>
                    </View>
                  </View>
                  <View className="px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/30">
                    <Text className="text-amber-400 text-[10px] font-bold">
                      TASLAK
                    </Text>
                  </View>
                </View>

                {/* Mini Metrikler */}
                <View className="flex-row gap-3 my-2">
                  <View className="flex-1 p-3 bg-gray-900/70 border border-gray-700/50 rounded-2xl items-center">
                    <Text className="text-gray-400 text-[11px] mb-0.5">
                      Saha Personeli
                    </Text>
                    <Text className="text-white text-xl font-bold">48 Kişi</Text>
                  </View>
                  <View className="flex-1 p-3 bg-gray-900/70 border border-gray-700/50 rounded-2xl items-center">
                    <Text className="text-gray-400 text-[11px] mb-0.5">
                      Hava Durumu
                    </Text>
                    <Text className="text-emerald-400 text-xl font-bold">
                      18°C Güneşli
                    </Text>
                  </View>
                </View>

                <TouchableOpacity
                  activeOpacity={0.8}
                  className="w-full mt-2 py-3 bg-gray-900 border border-gray-700 rounded-2xl items-center flex-row justify-center gap-2"
                >
                  <Feather name="edit-3" size={14} color="#10B981" />
                  <Text className="text-emerald-400 text-xs font-bold">
                    Jurnali Düzenle & Gönder
                  </Text>
                </TouchableOpacity>
              </View>
            </>
          )}

          {/* ---------------------------------------------------------- */}
          {/* ROL 2: DRIVER veya WAREHOUSE (Şoför / Lojistik Depo)       */}
          {/* ---------------------------------------------------------- */}
          {(role === "DRIVER" || role === "WAREHOUSE" || role === "LOGISTICS") && (
            <>
              {/* Kart 1: Sıradaki Teslimat / Rota */}
              <View className="bg-white dark:bg-gray-800/80 rounded-3xl p-5 shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden relative">
                {Platform.OS === "ios" && (
                  <BlurView
                    intensity={30}
                    tint="dark"
                    className="absolute inset-0"
                  />
                )}
                <View className="flex-row items-center justify-between mb-3">
                  <View className="flex-row items-center gap-2">
                    <View className="w-8 h-8 rounded-xl bg-blue-500/20 items-center justify-center">
                      <Feather name="navigation" size={16} color="#3B82F6" />
                    </View>
                    <View>
                      <Text className="text-white text-base font-bold">
                        Sıradaki Teslimat / Rota
                      </Text>
                      <Text className="text-gray-400 text-xs font-mono">
                        İrsaliye: #IRS-98421
                      </Text>
                    </View>
                  </View>
                  <View className="px-2.5 py-1 rounded-full bg-blue-500/10 border border-blue-500/30">
                    <Text className="text-blue-400 text-[10px] font-bold">
                      YOLDA
                    </Text>
                  </View>
                </View>

                {/* Yük ve Rota Detayları */}
                <View className="p-3.5 bg-gray-900/70 border border-gray-700/50 rounded-2xl gap-2.5 mb-3">
                  <View className="flex-row items-center justify-between">
                    <Text className="text-gray-400 text-xs">Yük:</Text>
                    <Text className="text-white text-xs font-bold">
                      32 Ton BÇ III Nervürlü İnşaat Demiri (Q16)
                    </Text>
                  </View>
                  <View className="flex-row items-center justify-between">
                    <Text className="text-gray-400 text-xs">Çıkış Noktası:</Text>
                    <Text className="text-gray-300 text-xs">
                      Dilovası Çelik Fabrikası
                    </Text>
                  </View>
                  <View className="flex-row items-center justify-between">
                    <Text className="text-gray-400 text-xs">Hedef Şantiye:</Text>
                    <Text className="text-emerald-400 text-xs font-semibold">
                      Kadıköy Merkez Rezidans A-Kapısı
                    </Text>
                  </View>
                </View>

                {/* Mesafe ve Tahmini Varış Rozetleri */}
                <View className="flex-row gap-3">
                  <View className="flex-1 p-3 bg-gray-900/70 border border-gray-700/50 rounded-2xl items-center">
                    <Text className="text-gray-400 text-[11px]">Kalan Mesafe</Text>
                    <Text className="text-white text-lg font-bold">34.2 km</Text>
                  </View>
                  <View className="flex-1 p-3 bg-gray-900/70 border border-gray-700/50 rounded-2xl items-center">
                    <Text className="text-gray-400 text-[11px]">Tahmini Süre</Text>
                    <Text className="text-blue-400 text-lg font-bold">45 Dk</Text>
                  </View>
                </View>
              </View>

              {/* Kart 2: Devasa QR Okut Butonu */}
              <TouchableOpacity
                onPress={() => setShowQRScanner(true)}
                activeOpacity={0.85}
                className="w-full bg-gradient-to-r from-emerald-600 to-teal-700 bg-emerald-600 rounded-3xl p-7 shadow-xl shadow-emerald-500/30 border-2 border-emerald-400/50 items-center justify-center overflow-hidden"
              >
                <View className="w-16 h-16 rounded-2xl bg-white/20 items-center justify-center mb-3 border border-white/30">
                  <Ionicons name="qr-code-outline" size={38} color="#FFFFFF" />
                </View>
                <Text className="text-white text-xl font-black tracking-tight text-center">
                  DEVASA QR OKUT
                </Text>
                <Text className="text-emerald-100 text-xs text-center mt-1 font-medium">
                  Şantiye kapısında malzeme teslimat barkodunu tarayın
                </Text>
              </TouchableOpacity>
            </>
          )}

          {/* ---------------------------------------------------------- */}
          {/* ROL 3: SUBCONTRACTOR (Taşeron)                             */}
          {/* ---------------------------------------------------------- */}
          {role === "SUBCONTRACTOR" && (
            <>
              {/* Kart 1: Bu Ayki İmalat İlerlemesi */}
              <View className="bg-white dark:bg-gray-800/80 rounded-3xl p-5 shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden relative">
                {Platform.OS === "ios" && (
                  <BlurView
                    intensity={30}
                    tint="dark"
                    className="absolute inset-0"
                  />
                )}
                <View className="flex-row items-center justify-between mb-3">
                  <View className="flex-row items-center gap-2">
                    <View className="w-8 h-8 rounded-xl bg-purple-500/20 items-center justify-center">
                      <Feather name="trending-up" size={16} color="#A855F7" />
                    </View>
                    <View>
                      <Text className="text-white text-base font-bold">
                        Bu Ayki İmalat İlerlemesi
                      </Text>
                      <Text className="text-gray-400 text-xs">
                        Taşeron: Erdemler İnşaat Ltd.
                      </Text>
                    </View>
                  </View>
                </View>

                <View className="gap-3.5 my-2">
                  {/* İmalat 1 */}
                  <View>
                    <View className="flex-row justify-between mb-1">
                      <Text className="text-white text-xs font-semibold">
                        Gazbeton Duvar İmalatı
                      </Text>
                      <Text className="text-purple-400 text-xs font-bold font-mono">
                        1.450 / 2.000 m² (%72.5)
                      </Text>
                    </View>
                    <View className="w-full h-2 bg-gray-700/60 rounded-full overflow-hidden">
                      <View className="w-[72.5%] h-full bg-purple-500 rounded-full" />
                    </View>
                  </View>

                  {/* İmalat 2 */}
                  <View>
                    <View className="flex-row justify-between mb-1">
                      <Text className="text-white text-xs font-semibold">
                        İç Mekan Alçı Sıva & Şap
                      </Text>
                      <Text className="text-purple-400 text-xs font-bold font-mono">
                        850 / 1.500 m² (%56.6)
                      </Text>
                    </View>
                    <View className="w-full h-2 bg-gray-700/60 rounded-full overflow-hidden">
                      <View className="w-[56.6%] h-full bg-purple-500 rounded-full" />
                    </View>
                  </View>
                </View>
              </View>

              {/* Kart 2: Güncel Hakediş */}
              <View className="bg-white dark:bg-gray-800/80 rounded-3xl p-5 shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden relative">
                {Platform.OS === "ios" && (
                  <BlurView
                    intensity={30}
                    tint="dark"
                    className="absolute inset-0"
                  />
                )}
                <View className="flex-row items-center justify-between mb-2">
                  <View className="flex-row items-center gap-2">
                    <View className="w-8 h-8 rounded-xl bg-emerald-500/20 items-center justify-center">
                      <Feather name="dollar-sign" size={16} color="#10B981" />
                    </View>
                    <View>
                      <Text className="text-white text-base font-bold">
                        Güncel Hakediş
                      </Text>
                      <Text className="text-gray-400 text-xs">
                        Dönem: Kasım 2026 (#14)
                      </Text>
                    </View>
                  </View>
                  <View className="px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/30">
                    <Text className="text-amber-400 text-[10px] font-bold">
                      ONAY BEKLİYOR
                    </Text>
                  </View>
                </View>

                {/* Finansal Detaylar */}
                <View className="p-4 bg-gray-900/80 border border-gray-700/60 rounded-2xl my-2 gap-2">
                  <View className="flex-row justify-between">
                    <Text className="text-gray-400 text-xs">Toplam Kesilen:</Text>
                    <Text className="text-white text-xs font-semibold">
                      ₺1,420,500.00
                    </Text>
                  </View>
                  <View className="flex-row justify-between">
                    <Text className="text-gray-400 text-xs">Kesintiler (%10 Teminat/Vergi):</Text>
                    <Text className="text-rose-400 text-xs font-semibold">
                      -₺142,050.00
                    </Text>
                  </View>
                  <View className="border-t border-gray-700/80 pt-2 flex-row justify-between items-center">
                    <Text className="text-emerald-400 text-xs font-bold uppercase">
                      Net Ödenecek:
                    </Text>
                    <Text className="text-emerald-400 text-lg font-black font-mono">
                      ₺1,278,450.00
                    </Text>
                  </View>
                </View>

                <TouchableOpacity
                  activeOpacity={0.8}
                  className="w-full py-3 bg-emerald-600 rounded-2xl items-center shadow-md shadow-emerald-500/20"
                >
                  <Text className="text-slate-950 font-bold text-xs">
                    Hakediş Fişi Detayını İncele
                  </Text>
                </TouchableOpacity>
              </View>
            </>
          )}

          {/* ---------------------------------------------------------- */}
          {/* ROL 4: INSPECTOR (Yapı Denetim)                            */}
          {/* ---------------------------------------------------------- */}
          {role === "INSPECTOR" && (
            <View className="bg-white dark:bg-gray-800/80 rounded-3xl p-5 shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden relative">
              {Platform.OS === "ios" && (
                <BlurView
                  intensity={30}
                  tint="dark"
                  className="absolute inset-0"
                />
              )}
              <View className="flex-row items-center justify-between mb-3">
                <View className="flex-row items-center gap-2">
                  <View className="w-8 h-8 rounded-xl bg-rose-500/20 items-center justify-center">
                    <Feather name="shield" size={16} color="#F43F5E" />
                  </View>
                  <View>
                    <Text className="text-white text-base font-bold">
                      Onay Bekleyen İmalatlar
                    </Text>
                    <Text className="text-gray-400 text-xs">
                      Yapı Denetim Vize ve Uygunluk Listesi
                    </Text>
                  </View>
                </View>
                <View className="px-2.5 py-1 rounded-full bg-rose-500/10 border border-rose-500/30">
                  <Text className="text-rose-400 text-[10px] font-bold">
                    3 VİZE BEKLİYOR
                  </Text>
                </View>
              </View>

              {/* İmalat Listesi */}
              <View className="gap-2.5 my-2">
                {[
                  {
                    item: "Blok-A Bodrum-2 Kolon Demir Donatı Uygunluğu",
                    desc: "Statik proje ve paspayı kontrolü tamamlandı",
                    badge: "VİZE BEKLİYOR",
                    badgeColor: "text-amber-400 bg-amber-500/10",
                  },
                  {
                    item: "Blok-B 4. Kat Tabliye C35 Beton Döküm İzni",
                    desc: "Kalıp iskelesi ve güvenlik ağı denetlendi",
                    badge: "KRİTİK",
                    badgeColor: "text-rose-400 bg-rose-500/10",
                  },
                  {
                    item: "Karot ve 28 Günlük Basınç Laboratuvar Testi",
                    desc: "TS 500 ve Bakanlık YİBF veri tabanına işlendi",
                    badge: "LAB ONAYLI",
                    badgeColor: "text-emerald-400 bg-emerald-500/10",
                  },
                ].map((insp, idx) => (
                  <View
                    key={idx}
                    className="p-3.5 bg-gray-900/70 border border-gray-700/50 rounded-2xl"
                  >
                    <View className="flex-row items-center justify-between mb-1">
                      <Text className="text-white text-xs font-bold flex-1 mr-2">
                        {insp.item}
                      </Text>
                      <View className={`px-2 py-0.5 rounded-full ${insp.badgeColor}`}>
                        <Text className="text-[10px] font-bold">
                          {insp.badge}
                        </Text>
                      </View>
                    </View>
                    <Text className="text-gray-400 text-[11px]">
                      {insp.desc}
                    </Text>
                  </View>
                ))}
              </View>

              <TouchableOpacity
                onPress={() => router.push("/(tabs)/inspections")}
                activeOpacity={0.8}
                className="w-full mt-2 py-3 bg-rose-600 rounded-2xl items-center flex-row justify-center gap-2 shadow-md shadow-rose-500/25"
              >
                <Feather name="check-square" size={15} color="#FFFFFF" />
                <Text className="text-white text-xs font-bold">
                  Bakanlık YİBF Onayını İmzala (e-İmza)
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Şoför QR Modal Entegrasyonu */}
      <Modal
        visible={showQRScanner}
        animationType="slide"
        onRequestClose={() => setShowQRScanner(false)}
      >
        <QRScanner
          onScan={handleQRScanned}
          onClose={() => setShowQRScanner(false)}
          title="Şantiye Teslimat QR Okut"
          subtitle="İrsaliye üzerindeki teslimat kodunu çerçevenin içine hizalayınız"
        />
      </Modal>
    </SafeAreaView>
  );
}
