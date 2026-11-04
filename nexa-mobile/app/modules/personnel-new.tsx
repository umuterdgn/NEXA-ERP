import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Alert,
  ActivityIndicator,
  Modal,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

// Cascading Hiyerarşi Konfigürasyonu
interface DeptConfig {
  id: string;
  name: string;
  roles: { code: string; label: string }[];
  trades: string[];
}

const DEPARTMENTS: DeptConfig[] = [
  {
    id: "LOJISTIK_GUVENLIK",
    name: "Lojistik & Kapı Güvenliği",
    roles: [
      { code: "DRIVER", label: "Lojistik / Transmikser Şoförü (DRIVER)" },
      { code: "SECURITY", label: "Şantiye Kapı Güvenlik Görevlisi (SECURITY)" },
      { code: "EQUIPMENT_MANAGER", label: "Makine & İkmal Müdürü" },
    ],
    trades: [
      "Hazır Beton Transmikser Şoförü",
      "Ağır Vasıta / Damperli Kamyon Şoförü",
      "Saha Güvenlik Görevlisi",
      "Depo & Ambar Sorumlusu",
    ],
  },
  {
    id: "SAHA_IMALAT",
    name: "Saha İmalat & Şantiye Ekibi",
    roles: [
      { code: "SITE_MANAGER", label: "Şantiye Şefi (SITE_MANAGER)" },
      { code: "ENGINEER", label: "Saha Mühendisi (ENGINEER)" },
      { code: "WORKER", label: "Saha İmalat Çalışanı / Usta (WORKER)" },
    ],
    trades: [
      "Demirci / Donatı Ustası",
      "Kalıpçı / Ahşap & Tünel Kalıp Ustası",
      "Betoncu / Şap ve Mastarcı",
      "Kule Vinç Operatörü",
      "Mobil Vinç Operatörü",
      "Ekskavatör Operatörü",
      "Beton Pompası Operatörü",
      "Elektrik Dağıtım & Pano Ustası",
      "Sıhhi Tesisat & Mekanik Montaj Ustası",
      "Harita Mühendisi / Topograf",
      "Saha Düz İşçi / Genel Yardımcı",
    ],
  },
  {
    id: "TASERON",
    name: "Taşeron Ekipleri",
    roles: [
      { code: "SUBCONTRACTOR", label: "Taşeron Firma Temsilcisi (SUBCONTRACTOR)" },
      { code: "WORKER", label: "Taşeron Ekip Çalışanı (WORKER)" },
    ],
    trades: [
      "Demirci / Donatı Ustası",
      "Kalıpçı / Ahşap & Tünel Kalıp Ustası",
      "Betoncu / Şap ve Mastarcı",
      "Alçı, Sıva ve Boya Ustası",
      "Seramik, Fayans ve Mermer Ustası",
    ],
  },
  {
    id: "YAPI_DENETIM",
    name: "Yapı Denetim & Bağımsız Kontrol",
    roles: [
      { code: "INSPECTION_ADMIN", label: "Yapı Denetim Şirket Müdürü" },
      { code: "INSPECTOR", label: "Bakanlık Yapı Denetçisi (INSPECTOR)" },
      { code: "AUDITOR", label: "Bağımsız Kalite Denetçisi (AUDITOR)" },
    ],
    trades: ["Harita Mühendisi / Topograf", "İSG Saha Denetçisi / Gözlemcisi"],
  },
  {
    id: "ISG_CEVRE",
    name: "İş Sağlığı ve Güvenliği (İSG)",
    roles: [{ code: "ISG_EXPERT", label: "A/B Sınıfı İSG Uzmanı (ISG_EXPERT)" }],
    trades: ["İSG Saha Denetçisi / Gözlemcisi"],
  },
  {
    id: "FINANS_MUHASEBE",
    name: "Finans & Muhasebe",
    roles: [
      { code: "FINANCE_MANAGER", label: "Finans & Mali İşler Müdürü" },
      { code: "ACCOUNTANT", label: "Muhasebe Uzmanı (ACCOUNTANT)" },
      { code: "MUHASEBE", label: "Ön Muhasebe Görevlisi (MUHASEBE)" },
    ],
    trades: ["Depo & Ambar Sorumlusu"],
  },
];

export default function NewPersonnelScreen() {
  const router = useRouter();

  // Form State
  const [personnelNo, setPersonnelNo] = useState(`P-${Math.floor(1000 + Math.random() * 9000)}`);
  const [name, setName] = useState("");
  const [tcNo, setTcNo] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");

  // Cascading Selection State
  const [selectedDeptId, setSelectedDeptId] = useState(DEPARTMENTS[0].id);
  const currentDept = DEPARTMENTS.find((d) => d.id === selectedDeptId) || DEPARTMENTS[0];

  const [selectedRole, setSelectedRole] = useState(currentDept.roles[0]?.code || "DRIVER");
  const [selectedTrade, setSelectedTrade] = useState(currentDept.trades[0] || "");

  // Hidden Form Fields (Şantiye / Tenant İzolasyonu)
  const [hiddenTenantId] = useState("nexa-franchise");
  const [hiddenSiteId] = useState("site_kadikoy_rezidans");

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Departman değiştiğinde Rol ve Meslek otomatik filtrelenir (Cascading Dropdown)
  const handleDepartmentChange = (deptId: string) => {
    setSelectedDeptId(deptId);
    const dept = DEPARTMENTS.find((d) => d.id === deptId);
    if (dept) {
      setSelectedRole(dept.roles[0]?.code || "");
      setSelectedTrade(dept.trades[0] || "");
    }
  };

  const handleSavePersonnel = async () => {
    if (!name.trim()) {
      Alert.alert("Eksik Bilgi", "Lütfen personelin adını ve soyadını girin.");
      return;
    }

    try {
      setIsSubmitting(true);

      const payload = {
        personnelNo,
        name: name.trim(),
        tcNo: tcNo.trim(),
        phone: phone.trim(),
        email: email.trim(),
        department: currentDept.name,
        role: selectedRole,
        position: selectedTrade,
        // Gizli (Hidden) Tenant ve Şantiye parametreleri
        tenantId: hiddenTenantId,
        projectId: hiddenSiteId,
        currentSite: "Kadıköy Merkez Rezidans A-Kapısı",
        createdAt: new Date().toISOString(),
      };

      // Simüle edilen veya backend API çağrısı
      await new Promise((resolve) => setTimeout(resolve, 900));

      Alert.alert(
        "Personel Kaydedildi",
        `${name} (${selectedTrade}) personeli ${currentDept.name} departmanına ve ${selectedRole} rolüyle başarıyla tanımlandı.\n\nBağlı Şantiye/Tenant: ${hiddenTenantId}`,
        [
          {
            text: "Tamam",
            onPress: () => router.back(),
          },
        ]
      );
    } catch (err: any) {
      console.warn("[NewPersonnelScreen] Kayıt hatası:", err);
      Alert.alert("Hata", "Personel kaydedilemedi.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Yeni Personel Tanımla</Text>
          <Text style={styles.headerSubtitle}>Dinamik Departman & Rol Hiyerarşisi</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.container}>
        {/* Personel Temel Bilgileri */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>1. KİŞİSEL & İLETİŞİM BİLGİLERİ</Text>

          <Text style={styles.fieldLabel}>Personel Sicil No</Text>
          <TextInput
            style={[styles.fieldInput, { color: "#34C759", fontWeight: "700" }]}
            value={personnelNo}
            onChangeText={setPersonnelNo}
          />

          <Text style={styles.fieldLabel}>Ad Soyad *</Text>
          <TextInput
            style={styles.fieldInput}
            value={name}
            onChangeText={setName}
            placeholder="Örn: Ahmet Yılmaz"
            placeholderTextColor="#636366"
          />

          <View style={{ flexDirection: "row", gap: 10 }}>
            <View style={{ flex: 1 }}>
              <Text style={styles.fieldLabel}>TC Kimlik No</Text>
              <TextInput
                style={styles.fieldInput}
                value={tcNo}
                onChangeText={setTcNo}
                placeholder="11 haneli TC No"
                placeholderTextColor="#636366"
                keyboardType="numeric"
                maxLength={11}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.fieldLabel}>Telefon</Text>
              <TextInput
                style={styles.fieldInput}
                value={phone}
                onChangeText={setPhone}
                placeholder="0532 000 0000"
                placeholderTextColor="#636366"
                keyboardType="phone-pad"
              />
            </View>
          </View>
        </View>

        {/* CASCADING DROPDOWN BÖLÜMÜ */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>2. DİNAMİK DEPARTMAN, ROL & MESLEK MATRİSİ</Text>
          <Text style={styles.helperText}>
            Departman seçildiğinde Rol ve Meslek seçenekleri birbiriyle otomatik filtrelenir.
          </Text>

          {/* Adım 1: Departman Seçimi */}
          <Text style={styles.fieldLabel}>Departman Seçimi *</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
            {DEPARTMENTS.map((dept) => {
              const isSelected = dept.id === selectedDeptId;
              return (
                <TouchableOpacity
                  key={dept.id}
                  style={[styles.deptChip, isSelected && styles.deptChipActive]}
                  onPress={() => handleDepartmentChange(dept.id)}
                >
                  <Text style={[styles.deptChipText, isSelected && styles.deptChipTextActive]}>
                    {dept.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Adım 2: Filtrelenmiş Sistem Rolü */}
          <Text style={styles.fieldLabel}>Sistem Rolü (Bu Departmana Bağlı)</Text>
          <View style={{ gap: 8, marginBottom: 14 }}>
            {currentDept.roles.map((r) => {
              const isRoleActive = r.code === selectedRole;
              return (
                <TouchableOpacity
                  key={r.code}
                  style={[styles.roleSelectBox, isRoleActive && styles.roleSelectBoxActive]}
                  onPress={() => setSelectedRole(r.code)}
                >
                  <Ionicons
                    name={isRoleActive ? "radio-button-on" : "radio-button-off"}
                    size={20}
                    color={isRoleActive ? "#0A7AFF" : "#8E8E93"}
                  />
                  <Text style={[styles.roleSelectText, isRoleActive && { color: "#FFFFFF", fontWeight: "700" }]}>
                    {r.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Adım 3: Filtrelenmiş Meslek / Pozisyon */}
          <Text style={styles.fieldLabel}>Şantiye Mesleği / İhtisası (Bu Departmana Bağlı)</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 8 }}>
            {currentDept.trades.map((tr) => {
              const isTradeActive = tr === selectedTrade;
              return (
                <TouchableOpacity
                  key={tr}
                  style={[styles.tradeChip, isTradeActive && styles.tradeChipActive]}
                  onPress={() => setSelectedTrade(tr)}
                >
                  <Text style={[styles.tradeChipText, isTradeActive && styles.tradeChipTextActive]}>
                    {tr}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* GİZLİ (HIDDEN) FORM ALANLARI GÖSTERGE ROZETİ */}
        <View style={styles.hiddenFieldsBadge}>
          <Ionicons name="lock-closed" size={16} color="#34C759" />
          <View style={{ flex: 1 }}>
            <Text style={styles.hiddenBadgeTitle}>GİZLİ ALANLAR (SaaS Tenant Bariyeri):</Text>
            <Text style={styles.hiddenBadgeDesc}>
              tenantId: "{hiddenTenantId}" • siteId: "{hiddenSiteId}"
            </Text>
          </View>
        </View>

        {/* Kaydet Butonu */}
        <TouchableOpacity
          style={styles.saveBtn}
          onPress={handleSavePersonnel}
          disabled={isSubmitting}
          activeOpacity={0.85}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <Ionicons name="person-add" size={20} color="#FFFFFF" />
              <Text style={styles.saveBtnText}>Personeli Şantiyeye Kaydet</Text>
            </>
          )}
        </TouchableOpacity>
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
    fontSize: 11,
    color: "#8E8E93",
    marginTop: 2,
  },
  container: {
    padding: 16,
    gap: 16,
  },
  sectionCard: {
    backgroundColor: "rgba(255,255,255,0.03)",
    padding: 18,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    gap: 10,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: "#0A7AFF",
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  helperText: {
    fontSize: 12,
    color: "#8E8E93",
    marginBottom: 8,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#9CA3AF",
    textTransform: "uppercase",
  },
  fieldInput: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: "#FFFFFF",
    fontSize: 14,
  },
  deptChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.05)",
    marginRight: 8,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  deptChipActive: {
    backgroundColor: "#0A7AFF",
    borderColor: "#0A7AFF",
  },
  deptChipText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#8E8E93",
  },
  deptChipTextActive: {
    color: "#FFFFFF",
  },
  roleSelectBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.04)",
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    gap: 10,
  },
  roleSelectBoxActive: {
    borderColor: "#0A7AFF",
    backgroundColor: "rgba(10,122,255,0.1)",
  },
  roleSelectText: {
    fontSize: 13,
    color: "#8E8E93",
  },
  tradeChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.04)",
    marginRight: 8,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  tradeChipActive: {
    backgroundColor: "rgba(52,199,89,0.2)",
    borderColor: "#34C759",
  },
  tradeChipText: {
    fontSize: 12,
    color: "#8E8E93",
  },
  tradeChipTextActive: {
    color: "#34C759",
    fontWeight: "700",
  },
  hiddenFieldsBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(52,199,89,0.08)",
    borderWidth: 1,
    borderColor: "rgba(52,199,89,0.25)",
    borderRadius: 14,
    padding: 12,
    gap: 10,
  },
  hiddenBadgeTitle: {
    fontSize: 10,
    fontWeight: "800",
    color: "#34C759",
  },
  hiddenBadgeDesc: {
    fontSize: 11,
    color: "#9CA3AF",
    fontFamily: Platform.select({ ios: "Menlo", android: "monospace" }),
  },
  saveBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#0A7AFF",
    paddingVertical: 15,
    borderRadius: 16,
    gap: 8,
    marginTop: 4,
    marginBottom: 20,
  },
  saveBtnText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "800",
  },
});
