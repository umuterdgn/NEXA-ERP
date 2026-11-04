import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Dimensions,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export interface MegaModuleItem {
  id: string;
  slug: string;
  title: string;
  category: "SAHA & İMALAT" | "KALİTE & İSG" | "MALZEME & AMBAR" | "İK & PERSONEL" | "İLETİŞİM & BELGE";
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  description: string;
  route?: string;
}

export const MEGA_MODULES: MegaModuleItem[] = [
  // 1-6: SAHA & İMALAT
  {
    id: "m1",
    slug: "bim-ar",
    title: "3D BIM & AR Navigasyon",
    category: "SAHA & İMALAT",
    icon: "cube",
    color: "#0A7AFF",
    description: "Sayısal ikiz, MEP çakışma ve AR kamera bindirmesi",
    route: "/(tabs)/bim",
  },
  {
    id: "m2",
    slug: "daily-journal",
    title: "Şantiye Günlüğü (Jurnal)",
    category: "SAHA & İMALAT",
    icon: "clipboard",
    color: "#34C759",
    description: "Hava durumu, günlük imalat, personel ve ekipman jurnali",
    route: "/(tabs)/journal",
  },
  {
    id: "m3",
    slug: "dynamic-forms",
    title: "Dinamik Denetim Formları",
    category: "KALİTE & İSG",
    icon: "document-text",
    color: "#AF52DE",
    description: "Kalıp, demir, beton döküm ve saha denetim şablonları",
    route: "/modules/dynamic-forms",
  },
  {
    id: "m4",
    slug: "ncr-revision",
    title: "Saha Revizyon (DÖF) Aç",
    category: "KALİTE & İSG",
    icon: "alert-circle",
    color: "#FF9500",
    description: "Kusurlu imalat tespiti, düzeltici önleyici faaliyet kaydı",
    route: "/modules/ncr-revision",
  },
  {
    id: "m5",
    slug: "subcontractor-approvals",
    title: "Taşeron İş Kabulleri",
    category: "SAHA & İMALAT",
    icon: "shield-checkmark",
    color: "#30B0C7",
    description: "Taşeron imalat tamamlama kanıtları ve hakediş ön onayları",
    route: "/modules/subcontractor-approvals",
  },
  {
    id: "m6",
    slug: "site-camera",
    title: "Saha Kamerası (İlerleme)",
    category: "SAHA & İMALAT",
    icon: "camera",
    color: "#FF2D55",
    description: "Zaman damgalı, GPS filigranlı şantiye ilerleme fotoğrafları",
    route: "/modules/site-camera",
  },
  // 7-10: MALZEME & AMBAR
  {
    id: "m7",
    slug: "material-delivery",
    title: "Malzeme Kabul & Teslimat",
    category: "MALZEME & AMBAR",
    icon: "cube",
    color: "#5856D6",
    description: "İrsaliye girişi, kantar tartım, OCR ve hasarlı ürün tutanağı",
    route: "/modules/material-delivery",
  },
  {
    id: "m8",
    slug: "qr-consume",
    title: "Malzeme Tüketimi (QR)",
    category: "MALZEME & AMBAR",
    icon: "barcode",
    color: "#007AFF",
    description: "Ambar mikro sarfiyat, çimento ve donatı çıkış kaydı",
    route: "/modules/qr-consume",
  },
  {
    id: "m9",
    slug: "material-requests",
    title: "Malzeme Talepleri",
    category: "MALZEME & AMBAR",
    icon: "cart",
    color: "#FF9500",
    description: "Saha şefinden satınalmaya acil sipariş ve sarf talebi",
    route: "/modules/material-requests",
  },
  {
    id: "m10",
    slug: "assigned-equipments",
    title: "Zimmetli Ekipmanlar",
    category: "MALZEME & AMBAR",
    icon: "construct",
    color: "#64D2FF",
    description: "Hilti, lazer terazi, akıllı baret ve araç zimmet listesi",
    route: "/modules/assigned-equipments",
  },
  // 11-15: İK & PERSONEL
  {
    id: "m11",
    slug: "qr-checkin",
    title: "QR Giriş / Çıkış",
    category: "İK & PERSONEL",
    icon: "qr-code",
    color: "#34C759",
    description: "Şantiye turnike, NFC ve GPS geofence mesai check-in",
    route: "/(tabs)/attendance",
  },
  {
    id: "m12",
    slug: "overtime-history",
    title: "Mesai Geçmişi",
    category: "İK & PERSONEL",
    icon: "time",
    color: "#FF9500",
    description: "Haftalık puantaj, fazla mesai saatleri ve vardiya takibi",
    route: "/modules/overtime-history",
  },
  {
    id: "m13",
    slug: "leave-management",
    title: "İzin Yönetimi",
    category: "İK & PERSONEL",
    icon: "calendar",
    color: "#AF52DE",
    description: "Yıllık izin, mazeret ve sağlık raporu onay talepleri",
    route: "/modules/leave-management",
  },
  {
    id: "m14",
    slug: "salary-advance",
    title: "Maaş ve Avans",
    category: "İK & PERSONEL",
    icon: "wallet",
    color: "#30D158",
    description: "Aylık hakediş bordrosu, banka ödemesi ve avans talebi",
    route: "/modules/salary-advance",
  },
  {
    id: "m15",
    slug: "expense-claim",
    title: "Masraf & Fiş Bildirimi",
    category: "İK & PERSONEL",
    icon: "receipt",
    color: "#FF453A",
    description: "Akaryakıt, hırdavat ve yemek fişi fotoğrafı ile masraf onayı",
    route: "/modules/expense-claim",
  },
  // 16-20: İLETİŞİM & BELGE
  {
    id: "m16",
    slug: "chat",
    title: "Mesajlar / Şantiye Chat",
    category: "İLETİŞİM & BELGE",
    icon: "chatbubbles",
    color: "#0A7AFF",
    description: "Şantiye içi anlık telsiz ses kaydı ve proje kanalları",
    route: "/(tabs)/chat",
  },
  {
    id: "m17",
    slug: "safety-alerts",
    title: "İSG Bildirimleri",
    category: "KALİTE & İSG",
    icon: "warning",
    color: "#FF3B30",
    description: "Ramak kala olay raporu, tehlike bölgesi alarmı ve KKD denetimi",
    route: "/(tabs)/safety",
  },
  {
    id: "m18",
    slug: "tasks-work-orders",
    title: "Görevlerim / İş Emirleri",
    category: "SAHA & İMALAT",
    icon: "checkbox",
    color: "#5E5CE6",
    description: "Kanban iş emirleri, swipe-to-complete ve alt yüklenici görevleri",
    route: "/(tabs)/tasks",
  },
  {
    id: "m19",
    slug: "inspection-reports",
    title: "Denetim Raporları",
    category: "KALİTE & İSG",
    icon: "document-attach",
    color: "#BF5AF2",
    description: "Bakanlık YİBF tutanakları, karot ve basınç test sonuçları",
    route: "/modules/inspection-reports",
  },
  {
    id: "m20",
    slug: "announcements-documents",
    title: "Duyurular ve Belgeler",
    category: "İLETİŞİM & BELGE",
    icon: "megaphone",
    color: "#FF9F0A",
    description: "Genel merkez duyuruları, şantiye yönetmelikleri ve şartnameler",
    route: "/modules/announcements-documents",
  },
];

export default function MegaModulesHub() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [selectedCat, setSelectedCat] = useState<string>("TÜMÜ");

  const categories = ["TÜMÜ", "SAHA & İMALAT", "KALİTE & İSG", "MALZEME & AMBAR", "İK & PERSONEL", "İLETİŞİM & BELGE"];

  const filtered = MEGA_MODULES.filter((m) => {
    const matchesCat = selectedCat === "TÜMÜ" || m.category === selectedCat;
    const matchesSearch =
      m.title.toLowerCase().includes(search.toLowerCase()) ||
      m.description.toLowerCase().includes(search.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const handleOpenModule = (m: MegaModuleItem) => {
    try {
      if (m.route) {
        router.push(m.route as any);
      } else {
        router.push(`/modules/${m.slug}` as any);
      }
    } catch (err) {
      console.warn("Modül açma hatası:", err);
      router.push(`/modules/${m.slug}` as any);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
      {/* Üst Başlık */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Şantiye Modülleri</Text>
          <Text style={styles.headerSubtitle}>20 Temel Saha ve Yönetim Modülü</Text>
        </View>
      </View>

      {/* Arama Barı */}
      <View style={styles.searchBox}>
        <Ionicons name="search" size={18} color="#8E8E93" />
        <TextInput
          style={styles.searchInput}
          placeholder="Modül adı veya işlem ara..."
          placeholderTextColor="#636366"
          value={search}
          onChangeText={setSearch}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch("")}>
            <Ionicons name="close-circle" size={18} color="#8E8E93" />
          </TouchableOpacity>
        )}
      </View>

      {/* Kategori Hapları (Pills) */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catScroll}>
        {categories.map((c) => {
          const isActive = selectedCat === c;
          return (
            <TouchableOpacity
              key={c}
              style={[styles.catPill, isActive && styles.catPillActive]}
              onPress={() => setSelectedCat(c)}
            >
              <Text style={[styles.catPillText, isActive && styles.catPillTextActive]}>{c}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Modül Listesi Grid */}
      <ScrollView contentContainerStyle={styles.gridContainer}>
        {filtered.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={styles.card}
            activeOpacity={0.8}
            onPress={() => handleOpenModule(item)}
          >
            <View style={[styles.iconWrapper, { backgroundColor: `${item.color}22` }]}>
              <Ionicons name={item.icon} size={24} color={item.color} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>{item.title}</Text>
              <Text style={styles.cardDesc} numberOfLines={2}>
                {item.description}
              </Text>
              <View style={styles.cardBadge}>
                <Text style={[styles.cardBadgeText, { color: item.color }]}>{item.category}</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#8E8E93" />
          </TouchableOpacity>
        ))}
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
    fontSize: 18,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  headerSubtitle: {
    fontSize: 12,
    color: "#8E8E93",
    marginTop: 2,
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.05)",
    marginHorizontal: 16,
    marginTop: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    gap: 8,
  },
  searchInput: {
    flex: 1,
    color: "#FFFFFF",
    fontSize: 14,
  },
  catScroll: {
    paddingHorizontal: 16,
    marginTop: 12,
    maxHeight: 40,
  },
  catPill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.05)",
    marginRight: 8,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  catPillActive: {
    backgroundColor: "#0A7AFF",
    borderColor: "#0A7AFF",
  },
  catPillText: {
    color: "#8E8E93",
    fontSize: 12,
    fontWeight: "700",
  },
  catPillTextActive: {
    color: "#FFFFFF",
  },
  gridContainer: {
    padding: 16,
    gap: 12,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.03)",
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    gap: 14,
  },
  iconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  cardDesc: {
    fontSize: 12,
    color: "#8E8E93",
    marginTop: 3,
  },
  cardBadge: {
    marginTop: 6,
  },
  cardBadgeText: {
    fontSize: 10,
    fontWeight: "800",
    textTransform: "uppercase",
  },
});

