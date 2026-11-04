/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Nexa Mobile - iOS Tasarım Standartlarında Dinamik ve Rol Bazlı Modüller Ekranı
 */

import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Dimensions,
  Platform,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useAuthorization } from "../hooks/useAuthorization";
import { UserRole } from "../constants/Roles";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const GRID_CARD_WIDTH = (SCREEN_WIDTH - 16 * 2 - 12) / 2;

// Kategori Kimlikleri
export type ModuleCategoryKey =
  | "FIELD_PRODUCTION"
  | "LOGISTICS_MATERIAL"
  | "AUDIT_OHS"
  | "HR_FINANCE"
  | "COMMUNICATION_OFFICE";

export interface CategoryMeta {
  key: ModuleCategoryKey;
  title: string;
  emoji: string;
  color: string;
  description: string;
}

export const MODULE_CATEGORIES: CategoryMeta[] = [
  {
    key: "FIELD_PRODUCTION",
    title: "Saha & Üretim",
    emoji: "🏗️",
    color: "#0A7AFF",
    description: "İmalat, şantiye jurnalleri ve 3D BIM navigasyonu",
  },
  {
    key: "LOGISTICS_MATERIAL",
    title: "Lojistik & Malzeme",
    emoji: "📦",
    color: "#FF9500",
    description: "Kabul, sevkiyat, ambar ve ekipman zimmet takibi",
  },
  {
    key: "AUDIT_OHS",
    title: "Denetim & İSG",
    emoji: "🛡️",
    color: "#34C759",
    description: "Saha güvenlik kontrolleri, formlar ve iş kabulleri",
  },
  {
    key: "HR_FINANCE",
    title: "İK & Finans",
    emoji: "👥",
    color: "#AF52DE",
    description: "Puantaj, izinler, hakediş ve masraf bildirimleri",
  },
  {
    key: "COMMUNICATION_OFFICE",
    title: "İletişim & Ofis",
    emoji: "💬",
    color: "#30B0C7",
    description: "Şantiye mesajlaşması, anonslar ve resmi belgeler",
  },
];

export interface ModuleItem {
  id: string;
  slug: string;
  title: string;
  category: ModuleCategoryKey;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  description: string;
  route: string;
  isRealRoute?: boolean; // tab veya hazır rota ise true
  badge?: string;
}

// 20+ Modülün Tanımı
export const ALL_MODULES: ModuleItem[] = [
  // ==========================================
  // 1. 🏗️ SAHA & ÜRETİM (5 Modül)
  // ==========================================
  {
    id: "m_jurnal",
    slug: "daily-journal",
    title: "Şantiye Günlüğü (Jurnal)",
    category: "FIELD_PRODUCTION",
    icon: "clipboard",
    color: "#34C759",
    description: "Hava durumu, günlük imalat, personel ve ekipman jurnali",
    route: "/(tabs)/journal",
    isRealRoute: true,
    badge: "Canlı",
  },
  {
    id: "m_tasks",
    slug: "task-orders",
    title: "Görevlerim / İş Emirleri",
    category: "FIELD_PRODUCTION",
    icon: "checkbox",
    color: "#0A7AFF",
    description: "Atanan görevler, kontrol listeleri ve ilerleme takibi",
    route: "/(tabs)/tasks",
    isRealRoute: true,
    badge: "Canlı",
  },
  {
    id: "m_bim",
    slug: "bim-ar",
    title: "3D BIM & AR Navigasyon",
    category: "FIELD_PRODUCTION",
    icon: "cube",
    color: "#5856D6",
    description: "Sayısal ikiz, MEP çakışma ve AR kamera bindirmesi",
    route: "/(tabs)/bim",
    isRealRoute: true,
    badge: "3D",
  },
  {
    id: "m_dof",
    slug: "site-revision",
    title: "Saha Revizyon (DÖF) Aç",
    category: "FIELD_PRODUCTION",
    icon: "construct",
    color: "#FF9500",
    description: "Düzeltici ve önleyici faaliyet başlatma ve fotoğraf ekleme",
    route: "/modules/site-revision",
  },
  {
    id: "m_camera",
    slug: "site-camera",
    title: "Saha Kamerası (İlerleme)",
    category: "FIELD_PRODUCTION",
    icon: "camera",
    color: "#30B0C7",
    description: "Zaman damgalı ilerleme fotoğrafları ve yapay zeka tespiti",
    route: "/modules/site-camera",
  },
  {
    id: "m_sitemap",
    slug: "sitemap",
    title: "Şantiye Haritası & BLE",
    category: "FIELD_PRODUCTION",
    icon: "map",
    color: "#34C759",
    description: "İş makineleri ve personellerin anlık uzaysal konumu",
    route: "/sitemap",
    isRealRoute: true,
  },

  // ==========================================
  // 2. 📦 LOJİSTİK & MALZEME (5 Modül)
  // ==========================================
  {
    id: "m_receiving",
    slug: "material-receiving",
    title: "Malzeme Kabul & Teslimat",
    category: "LOGISTICS_MATERIAL",
    icon: "file-tray-full",
    color: "#0A7AFF",
    description: "İrsaliye tarama, kantar fişi ve saha ambar girişi",
    route: "/modules/material-receiving",
  },
  {
    id: "m_consumption",
    slug: "material-consumption",
    title: "Malzeme Tüketimi (QR)",
    category: "LOGISTICS_MATERIAL",
    icon: "qr-code",
    color: "#34C759",
    description: "QR okutarak şantiyede harcanan sarf malzeme düşümü",
    route: "/modules/material-consumption",
  },
  {
    id: "m_requests",
    slug: "material-requests",
    title: "Malzeme Talepleri",
    category: "LOGISTICS_MATERIAL",
    icon: "cart",
    color: "#FF9500",
    description: "Satınalma departmanına anlık acil sipariş talebi iletme",
    route: "/modules/material-requests",
  },
  {
    id: "m_equipment",
    slug: "equipment-tracking",
    title: "Zimmetli Ekipmanlar",
    category: "LOGISTICS_MATERIAL",
    icon: "hardware-chip",
    color: "#AF52DE",
    description: "El aletleri, jeneratör ve iş makinesi zimmet kontrolü",
    route: "/modules/equipment-tracking",
  },
  {
    id: "m_gate",
    slug: "qr-gate",
    title: "QR Giriş / Çıkış",
    category: "LOGISTICS_MATERIAL",
    icon: "scan",
    color: "#FF2D55",
    description: "Kamyon, beton mikseri ve araç kapı geçiş kaydı",
    route: "/modules/qr-gate",
  },

  // ==========================================
  // 3. 🛡️ DENETİM & İSG (4+ Modül)
  // ==========================================
  {
    id: "m_forms",
    slug: "dynamic-forms",
    title: "Dinamik Denetim Formları",
    category: "AUDIT_OHS",
    icon: "document-text",
    color: "#AF52DE",
    description: "Kalıp, demir, beton döküm ve saha denetim şablonları",
    route: "/modules/dynamic-forms",
  },
  {
    id: "m_safety",
    slug: "safety-incidents",
    title: "İSG Bildirimleri",
    category: "AUDIT_OHS",
    icon: "warning",
    color: "#FF3B30",
    description: "Ramak kala olaylar, KKD kontrolü ve tehlike ihbarları",
    route: "/(tabs)/safety",
    isRealRoute: true,
    badge: "Önemli",
  },
  {
    id: "m_audit_reports",
    slug: "audit-reports",
    title: "Denetim Raporları",
    category: "AUDIT_OHS",
    icon: "shield-checkmark",
    color: "#34C759",
    description: "Yapı denetim ve bağımsız müşavir onay raporları",
    route: "/modules/audit-reports",
  },
  {
    id: "m_subcontractor_acc",
    slug: "subcontractor-acceptance",
    title: "Taşeron İş Kabulleri",
    category: "AUDIT_OHS",
    icon: "checkmark-done-circle",
    color: "#0A7AFF",
    description: "Taşeron imalatlarının teknik şartnameye uygun teslimi",
    route: "/modules/subcontractor-acceptance",
  },
  {
    id: "m_qa_qc",
    slug: "qa-qc",
    title: "Beton Döküm & QA/QC",
    category: "AUDIT_OHS",
    icon: "flask",
    color: "#30B0C7",
    description: "Slump testi, küp numune ve sıcaklık kalite kayıtları",
    route: "/modules/qa-qc",
  },

  // ==========================================
  // 4. 👥 İK & FİNANS (4+ Modül)
  // ==========================================
  {
    id: "m_attendance",
    slug: "work-history",
    title: "Mesai Geçmişi & Puantaj",
    category: "HR_FINANCE",
    icon: "time",
    color: "#FFCC00",
    description: "NFC/GPS puantaj hareketleri ve haftalık çalışma saatleri",
    route: "/(tabs)/attendance",
    isRealRoute: true,
  },
  {
    id: "m_leave",
    slug: "leave-requests",
    title: "İzin Yönetimi",
    category: "HR_FINANCE",
    icon: "calendar",
    color: "#0A7AFF",
    description: "Yıllık, sıhhi ve mazeret izin talepleri ve onay durumu",
    route: "/modules/leave-requests",
  },
  {
    id: "m_payroll",
    slug: "payroll-advances",
    title: "Maaş ve Avans",
    category: "HR_FINANCE",
    icon: "wallet",
    color: "#34C759",
    description: "Bordro dökümleri, günlük yevmiye ve avans talepleri",
    route: "/modules/payroll-advances",
  },
  {
    id: "m_expense",
    slug: "expense-reports",
    title: "Masraf & Fiş Bildirimi",
    category: "HR_FINANCE",
    icon: "receipt",
    color: "#FF9500",
    description: "Saha akaryakıt, yemek ve malzeme fişlerini fotoğraflama",
    route: "/modules/expense-reports",
  },
  {
    id: "m_new_personnel",
    slug: "personnel-new",
    title: "Yeni Personel Tanımla",
    category: "HR_FINANCE",
    icon: "person-add",
    color: "#AF52DE",
    description: "Cascading departman, rol ve meslek seçimi ile personel kaydı",
    route: "/modules/personnel-new",
    isRealRoute: true,
  },

  // ==========================================
  // 5. 💬 İLETİŞİM & OFİS (2 Modül)
  // ==========================================
  {
    id: "m_chat",
    slug: "chat-messaging",
    title: "Mesajlar / Şantiye Chat",
    category: "COMMUNICATION_OFFICE",
    icon: "chatbubbles",
    color: "#0A7AFF",
    description: "Şantiye ekipleriyle sesli, resimli ve yazılı anlık telsiz",
    route: "/(tabs)/chat",
    isRealRoute: true,
    badge: "Aktif",
  },
  {
    id: "m_announcements",
    slug: "announcements-documents",
    title: "Duyurular ve Belgeler",
    category: "COMMUNICATION_OFFICE",
    icon: "notifications",
    color: "#FF9500",
    description: "Yönetim sirküleri, iş güvenliği talimatları ve şartnameler",
    route: "/modules/announcements-documents",
  },
];

/**
 * ADIM 4: Rol Bazlı Filtreleme Fonksiyonu
 * DRIVER: İK, Finans, İSG, Saha gizlenir; Yalnızca Lojistik & Malzeme ve İletişim kalır.
 * SUPER_ADMIN / PROJECT_MANAGER: Tüm kategorileri görür.
 */
export function getAllowedCategoriesForRole(role?: UserRole | string | null): ModuleCategoryKey[] {
  const r = (role || "").toUpperCase();

  if (r === "DRIVER") {
    return ["LOGISTICS_MATERIAL", "COMMUNICATION_OFFICE"];
  }

  if (r === "SECURITY") {
    return ["LOGISTICS_MATERIAL", "COMMUNICATION_OFFICE"];
  }

  if (r === "SUBCONTRACTOR") {
    return ["FIELD_PRODUCTION", "AUDIT_OHS", "COMMUNICATION_OFFICE"];
  }

  if (
    r === "ISG_EXPERT" ||
    r === "INSPECTOR" ||
    r === "AUDITOR" ||
    r === "INSPECTION_ADMIN"
  ) {
    return ["AUDIT_OHS", "FIELD_PRODUCTION", "COMMUNICATION_OFFICE"];
  }

  if (r === "ACCOUNTANT" || r === "FINANCE_MANAGER" || r === "MUHASEBE") {
    return ["HR_FINANCE", "LOGISTICS_MATERIAL", "COMMUNICATION_OFFICE"];
  }

  if (r === "HR_STAFF" || r === "HR_MANAGER") {
    return ["HR_FINANCE", "COMMUNICATION_OFFICE"];
  }

  if (r === "WORKER" || r === "STAFF") {
    return ["FIELD_PRODUCTION", "HR_FINANCE", "COMMUNICATION_OFFICE"];
  }

  // SUPER_ADMIN, ADMIN, PROJECT_MANAGER, SITE_MANAGER, ENGINEER -> Tüm kategoriler
  return [
    "FIELD_PRODUCTION",
    "LOGISTICS_MATERIAL",
    "AUDIT_OHS",
    "HR_FINANCE",
    "COMMUNICATION_OFFICE",
  ];
}

export default function ModulesScreen() {
  const router = useRouter();
  const { role, user, isDriver } = useAuthorization();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<ModuleCategoryKey | "ALL">("ALL");
  const [viewMode, setViewMode] = useState<"GRID" | "SECTION">("GRID");

  // Kullanıcının rolüne göre izin verilen kategoriler
  const allowedCategoryKeys = useMemo(() => {
    return getAllowedCategoriesForRole(role);
  }, [role]);

  // Filtrelenmiş Modüller
  const filteredModules = useMemo(() => {
    return ALL_MODULES.filter((m) => {
      // 1. Rol İzni Kontrolü
      if (!allowedCategoryKeys.includes(m.category)) {
        return false;
      }
      // 2. Kategori Filtresi
      if (selectedCategory !== "ALL" && m.category !== selectedCategory) {
        return false;
      }
      // 3. Arama Filtresi
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          m.title.toLowerCase().includes(q) ||
          m.description.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [allowedCategoryKeys, selectedCategory, searchQuery]);

  // ADIM 5: Güvenli Navigasyon (Fallback Koruması)
  const handleModulePress = (module: ModuleItem) => {
    try {
      router.push(module.route as any);
    } catch (err) {
      console.warn(`[ModulesScreen] Navigasyon uyarısı (${module.slug}):`, err);
      // Fallback olarak universal slug ekranına yönlendir
      try {
        router.push(`/modules/${module.slug}` as any);
      } catch {
        Alert.alert(
          "🚧 Yapım Aşamasında",
          `"${module.title}" modülü geliştirilmektedir. Lütfen bir sonraki güncellemede tekrar deneyin.`
        );
      }
    }
  };

  // İzin verilen kategorilerin metadata listesi
  const visibleCategories = useMemo(() => {
    return MODULE_CATEGORIES.filter((c) => allowedCategoryKeys.includes(c.key));
  }, [allowedCategoryKeys]);

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
      {/* iOS Header */}
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Modüller</Text>
          <Text style={styles.headerSubtitle}>
            Tüm Şantiye İşlemleri • {role || "ENGINEER"}
          </Text>
        </View>

        {/* Görünüm Modu Değiştirici (Grid vs Section) */}
        <View style={styles.viewModeToggle}>
          <TouchableOpacity
            style={[
              styles.viewModeBtn,
              viewMode === "GRID" && styles.viewModeBtnActive,
            ]}
            onPress={() => setViewMode("GRID")}
            activeOpacity={0.8}
          >
            <Ionicons
              name="grid"
              size={16}
              color={viewMode === "GRID" ? "#FFFFFF" : "#8E8E93"}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.viewModeBtn,
              viewMode === "SECTION" && styles.viewModeBtnActive,
            ]}
            onPress={() => setViewMode("SECTION")}
            activeOpacity={0.8}
          >
            <Ionicons
              name="list"
              size={16}
              color={viewMode === "SECTION" ? "#FFFFFF" : "#8E8E93"}
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Rol Bilgilendirme Rozeti */}
      {isDriver && (
        <View style={styles.driverBanner}>
          <Ionicons name="car" size={16} color="#FF9500" />
          <Text style={styles.driverBannerText}>
            Şoför Portalı devrede: İK, Finans ve İSG alanları güvenlik gereği filtrelendi.
          </Text>
        </View>
      )}

      {/* Arama Çubuğu (iOS Search Bar) */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={18} color="#8E8E93" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Modül veya işlem ara... (Örn: BIM, Kabul, Puantaj)"
          placeholderTextColor="#8E8E93"
          value={searchQuery}
          onChangeText={setSearchQuery}
          clearButtonMode="while-editing"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery("")}>
            <Ionicons name="close-circle" size={18} color="#8E8E93" />
          </TouchableOpacity>
        )}
      </View>

      {/* Kategori Yatay Filtre Çubuğu */}
      <View style={styles.categoriesBar}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryScrollContent}
        >
          <TouchableOpacity
            style={[
              styles.categoryPill,
              selectedCategory === "ALL" && styles.categoryPillActive,
            ]}
            onPress={() => setSelectedCategory("ALL")}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.categoryPillText,
                selectedCategory === "ALL" && styles.categoryPillTextActive,
              ]}
            >
              Tümü ({filteredModules.length})
            </Text>
          </TouchableOpacity>

          {visibleCategories.map((cat) => {
            const isSelected = selectedCategory === cat.key;
            return (
              <TouchableOpacity
                key={cat.key}
                style={[
                  styles.categoryPill,
                  isSelected && {
                    backgroundColor: cat.color,
                    borderColor: cat.color,
                  },
                ]}
                onPress={() => setSelectedCategory(isSelected ? "ALL" : cat.key)}
                activeOpacity={0.8}
              >
                <Text style={{ fontSize: 13, marginRight: 4 }}>{cat.emoji}</Text>
                <Text
                  style={[
                    styles.categoryPillText,
                    isSelected && styles.categoryPillTextActive,
                  ]}
                >
                  {cat.title}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Ana Modül İçeriği */}
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {filteredModules.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="search-outline" size={48} color="#8E8E93" />
            <Text style={styles.emptyTitle}>Modül Bulunamadı</Text>
            <Text style={styles.emptySubtitle}>
              "{searchQuery}" aramasına veya rolünüze uygun modül bulunmuyor.
            </Text>
          </View>
        ) : viewMode === "GRID" ? (
          /* ============================================================== */
          /* GÖRÜNÜM 1: 2 Sütunlu iOS GRID                                   */
          /* ============================================================== */
          <View style={styles.gridContainer}>
            {filteredModules.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.gridCard}
                onPress={() => handleModulePress(item)}
                activeOpacity={0.75}
              >
                {/* Kart İkonu ve Rozet */}
                <View style={styles.cardTopRow}>
                  <View
                    style={[
                      styles.iconCircle,
                      {
                        backgroundColor: `${item.color}20`,
                        borderColor: `${item.color}40`,
                      },
                    ]}
                  >
                    <Ionicons name={item.icon} size={22} color={item.color} />
                  </View>
                  {item.badge && (
                    <View
                      style={[
                        styles.badgeBox,
                        {
                          backgroundColor:
                            item.badge === "Canlı" || item.badge === "Aktif"
                              ? "rgba(52, 199, 89, 0.2)"
                              : item.badge === "3D"
                              ? "rgba(88, 86, 214, 0.2)"
                              : "rgba(255, 59, 48, 0.2)",
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.badgeText,
                          {
                            color:
                              item.badge === "Canlı" || item.badge === "Aktif"
                                ? "#34C759"
                                : item.badge === "3D"
                                ? "#5856D6"
                                : "#FF3B30",
                          },
                        ]}
                      >
                        {item.badge}
                      </Text>
                    </View>
                  )}
                </View>

                {/* Kart Başlık ve Açıklaması */}
                <Text style={styles.gridCardTitle} numberOfLines={2}>
                  {item.title}
                </Text>
                <Text style={styles.gridCardDesc} numberOfLines={2}>
                  {item.description}
                </Text>

                {/* Alt Çizgi & Ok */}
                <View style={styles.cardFooter}>
                  <Text style={styles.footerSlug}>{item.slug}</Text>
                  <Ionicons name="chevron-forward" size={14} color="#8E8E93" />
                </View>
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          /* ============================================================== */
          /* GÖRÜNÜM 2: iOS Ayarlar Tarzı Kategorize Liste                   */
          /* ============================================================== */
          <View style={styles.sectionContainer}>
            {visibleCategories.map((cat) => {
              const catModules = filteredModules.filter(
                (m) => m.category === cat.key
              );
              if (catModules.length === 0) return null;

              return (
                <View key={cat.key} style={styles.sectionGroup}>
                  <View style={styles.sectionHeader}>
                    <Text style={styles.sectionEmoji}>{cat.emoji}</Text>
                    <Text style={styles.sectionTitle}>{cat.title}</Text>
                    <Text style={styles.sectionCount}>({catModules.length})</Text>
                  </View>

                  <View style={styles.sectionCard}>
                    {catModules.map((item, idx) => {
                      const isLast = idx === catModules.length - 1;
                      return (
                        <TouchableOpacity
                          key={item.id}
                          style={[
                            styles.sectionItem,
                            !isLast && styles.sectionItemBorder,
                          ]}
                          onPress={() => handleModulePress(item)}
                          activeOpacity={0.7}
                        >
                          <View
                            style={[
                              styles.sectionIconBox,
                              { backgroundColor: `${item.color}20` },
                            ]}
                          >
                            <Ionicons
                              name={item.icon}
                              size={20}
                              color={item.color}
                            />
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text style={styles.sectionItemTitle}>
                              {item.title}
                            </Text>
                            <Text
                              style={styles.sectionItemDesc}
                              numberOfLines={1}
                            >
                              {item.description}
                            </Text>
                          </View>
                          {item.badge && (
                            <View style={styles.sectionItemBadge}>
                              <Text style={styles.sectionItemBadgeText}>
                                {item.badge}
                              </Text>
                            </View>
                          )}
                          <Ionicons
                            name="chevron-forward"
                            size={16}
                            color="#8E8E93"
                          />
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              );
            })}
          </View>
        )}
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
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 6,
  },
  headerTitle: {
    color: "#FFFFFF",
    fontSize: 26,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    color: "#8E8E93",
    fontSize: 12,
    marginTop: 2,
    fontWeight: "500",
  },
  viewModeToggle: {
    flexDirection: "row",
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    borderRadius: 10,
    padding: 3,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
  },
  viewModeBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 7,
  },
  viewModeBtnActive: {
    backgroundColor: "#0A7AFF",
  },
  driverBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 149, 0, 0.12)",
    borderWidth: 1,
    borderColor: "rgba(255, 149, 0, 0.25)",
    marginHorizontal: 16,
    marginTop: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    gap: 8,
  },
  driverBannerText: {
    color: "#FF9500",
    fontSize: 11,
    fontWeight: "600",
    flex: 1,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.06)",
    marginHorizontal: 16,
    marginTop: 10,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === "ios" ? 10 : 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: "#FFFFFF",
    fontSize: 14,
    padding: 0,
  },
  categoriesBar: {
    marginTop: 10,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.06)",
    paddingBottom: 10,
  },
  categoryScrollContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  categoryPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
  },
  categoryPillActive: {
    backgroundColor: "#0A7AFF",
    borderColor: "#0A7AFF",
  },
  categoryPillText: {
    color: "rgba(235, 235, 245, 0.7)",
    fontSize: 12,
    fontWeight: "600",
  },
  categoryPillTextActive: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 95, // Bottom tab payı
  },
  gridContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: 12,
  },
  gridCard: {
    width: GRID_CARD_WIDTH,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    borderRadius: 16,
    padding: 14,
    justifyContent: "space-between",
    minHeight: 148,
  },
  cardTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  iconCircle: {
    width: 42,
    height: 42,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeBox: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: "800",
  },
  gridCardTitle: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
    lineHeight: 18,
    marginBottom: 4,
  },
  gridCardDesc: {
    color: "rgba(235, 235, 245, 0.55)",
    fontSize: 11,
    lineHeight: 15,
  },
  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.04)",
  },
  footerSlug: {
    color: "rgba(255, 255, 255, 0.3)",
    fontSize: 9,
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
    maxWidth: GRID_CARD_WIDTH - 40,
  },
  sectionContainer: {
    gap: 18,
  },
  sectionGroup: {
    gap: 8,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 4,
    gap: 6,
  },
  sectionEmoji: {
    fontSize: 16,
  },
  sectionTitle: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "800",
  },
  sectionCount: {
    color: "#8E8E93",
    fontSize: 13,
    fontWeight: "600",
  },
  sectionCard: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    overflow: "hidden",
  },
  sectionItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 12,
  },
  sectionItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.06)",
  },
  sectionIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  sectionItemTitle: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 2,
  },
  sectionItemDesc: {
    color: "rgba(235, 235, 245, 0.55)",
    fontSize: 11,
  },
  sectionItemBadge: {
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  sectionItemBadgeText: {
    color: "#8E8E93",
    fontSize: 10,
    fontWeight: "700",
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    gap: 10,
  },
  emptyTitle: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "700",
  },
  emptySubtitle: {
    color: "#8E8E93",
    fontSize: 13,
    textAlign: "center",
    paddingHorizontal: 32,
  },
});

