import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  TextInput,
  Alert,
  Modal,
  ActivityIndicator,
  Dimensions,
  Platform,
  Linking,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import MapView, { Marker, Polyline } from "react-native-maps";
import { useDrawer } from "../../src/components/navigation/DrawerSidebar";
import { startDriverLocationTracking, stopDriverLocationTracking, isDriverTrackingActive } from "../../src/tasks/backgroundLocationTask";
import {
  getAuthSession,
  damageApi,
  subcontractorApi,
  driverApi,
  franchiseApi,
  inspectionApi,
  revisionApi,
  materialReceivingApi,
  concreteCastingApi,
  logisticsApi,
} from "../../apiClient";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

type PortalKey = "damage" | "subcontractor" | "driver" | "franchise" | "inspection";

const PORTALS_LIST: { key: PortalKey; label: string; icon: keyof typeof Ionicons.glyphMap; color: string }[] = [
  { key: "damage", label: "Hasar Tespit", icon: "camera-reverse", color: "#FF3B30" },
  { key: "subcontractor", label: "Taşeron", icon: "hammer", color: "#FF9500" },
  { key: "driver", label: "Sürücü & Rota", icon: "navigate", color: "#34C759" },
  { key: "franchise", label: "Franchise", icon: "business", color: "#0A7AFF" },
  { key: "inspection", label: "Yapı Denetim", icon: "shield-checkmark", color: "#AF52DE" },
];

export default function PortalsScreen() {
  const { openDrawer } = useDrawer();

  const [activePortal, setActivePortal] = useState<PortalKey>("damage");
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Rol bazlı varsayılan portal belirleme
  useEffect(() => {
    (async () => {
      try {
        const session = await getAuthSession();
        if (session.user) {
          setCurrentUser(session.user);
          const role = session.user.role;
          if (role === "SUBCONTRACTOR" || role === "TASERON") {
            setActivePortal("subcontractor");
          } else if (role === "DRIVER" || role === "SOFOR") {
            setActivePortal("driver");
          } else if (role === "FRANCHISE_OWNER" || role === "FRANCHISE") {
            setActivePortal("franchise");
          } else if (role === "INSPECTOR" || role === "YAPI_DENETIM") {
            setActivePortal("inspection");
          } else {
            setActivePortal("damage");
          }
        }
      } catch (err) {
        console.warn("[PortalsScreen] Rol belirleme hatası:", err);
      }
    })();
  }, []);

  return (
    <SafeAreaView style={styles.safeContainer} edges={["top", "left", "right"]}>
      {/* Üst Header: Hamburger Drawer + Başlık */}
      <View style={styles.topHeader}>
        <TouchableOpacity
          style={styles.hamburgerButton}
          onPress={openDrawer}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="menu" size={24} color="#FFFFFF" />
        </TouchableOpacity>

        <View style={styles.headerTitleWrap}>
          <Text style={styles.headerTitle}>Portallar & Sahalar</Text>
          <Text style={styles.headerSubtitle}>
            {currentUser?.tenantId || "nexa-franchise"} • {currentUser?.role || "ENGINEER"}
          </Text>
        </View>

        <View style={styles.headerRightBadge}>
          <Ionicons name="cloud-done" size={16} color="#34C759" />
          <Text style={styles.headerRightText}>CANLI API</Text>
        </View>
      </View>

      {/* ADIM 3: Portallar Üst Yatay Sekme Seçicisi (Segmented Control) */}
      <View style={styles.tabsScrollWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabsScrollContent}
        >
          {PORTALS_LIST.filter((p) => {
            const role = currentUser?.role;
            if (role === "DRIVER" || role === "SOFOR") return p.key === "driver";
            return true;
          }).map((p) => {
            const isActive = activePortal === p.key;
            return (
              <TouchableOpacity
                key={p.key}
                style={[styles.portalTabPill, isActive && { backgroundColor: p.color, borderColor: p.color }]}
                onPress={() => setActivePortal(p.key)}
                activeOpacity={0.8}
              >
                <Ionicons
                  name={p.icon}
                  size={15}
                  color={isActive ? "#FFFFFF" : "#8E8E93"}
                />
                <Text
                  style={[
                    styles.portalTabText,
                    isActive && styles.portalTabTextActive,
                  ]}
                >
                  {p.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Seçili Portal İçeriği */}
      <ScrollView
        style={styles.contentScrollView}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {activePortal === "damage" && <DamageEvidencePortal />}
        {activePortal === "subcontractor" && <SubcontractorPortal />}
        {activePortal === "driver" && <DriverRoutePortal currentUser={currentUser} />}
        {activePortal === "franchise" && <FranchisePortal />}
        {activePortal === "inspection" && <InspectionPortal />}
      </ScrollView>
    </SafeAreaView>
  );
}

/* ========================================================================== */
/*                 1. HASAR TESPİT & KANIT PORTALI                           */
/* ========================================================================== */
function DamageEvidencePortal() {
  const [title, setTitle] = useState("");
  const [severity, setSeverity] = useState<"CRITICAL" | "HIGH" | "MEDIUM">("CRITICAL");
  const [notes, setNotes] = useState("");
  const [hasPhoto, setHasPhoto] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [reports, setReports] = useState<any[]>([]);

  // Fotoğraf üzerine çizim modları (Örn: Çatlak oku, Kırık daire)
  const [drawnMarkers, setDrawnMarkers] = useState<{ x: number; y: number; label: string }[]>([]);

  const simulatedGPS = { latitude: 36.5878, longitude: 36.1735 };
  const currentTimestamp = new Date().toLocaleString("tr-TR");

  useEffect(() => {
    (async () => {
      const data = await damageApi.getReports();
      setReports(data || []);
    })();
  }, []);

  const handleTakeEvidencePhoto = () => {
    // Simüle edilmiş kamera çekimi & AR çizim katmanı
    setHasPhoto(true);
    setDrawnMarkers([
      { x: 120, y: 80, label: "Ana Çatlak (0.8mm)" },
      { x: 220, y: 140, label: "Paspayı Dökülmesi" },
    ]);
    Alert.alert(
      "Fotoğraf Çekildi",
      "Kamera görüntüsü alındı. Şantiye GPS koordinatları ve zaman damgası kareye mühürlendi."
    );
  };

  const handleAddMarker = (event: any) => {
    const { locationX, locationY } = event.nativeEvent;
    setDrawnMarkers((prev) => [
      ...prev,
      { x: Math.round(locationX), y: Math.round(locationY), label: "Hasar Noktası" },
    ]);
  };

  const handleSubmitEvidence = async () => {
    if (!title.trim()) {
      Alert.alert("Eksik Alan", "Lütfen olay başlığını yazın.");
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await damageApi.uploadEvidence({
        title,
        category: "STRUCTURAL",
        severity,
        notes,
        coordinates: simulatedGPS,
        siteName: "Nexa Towers Şantiye Alanı",
        timestamp: currentTimestamp,
      });

      Alert.alert(
        "Kanıt Sisteme Yüklendi",
        `Olay Kayıt No: ${res.id}\nWeb API'ye GPS ve zaman damgası ile güvenle kaydedildi.`
      );

      setTitle("");
      setNotes("");
      setHasPhoto(false);
      setDrawnMarkers([]);

      const updated = await damageApi.getReports();
      setReports(updated || []);
    } catch (err: any) {
      Alert.alert("Hata", err.message || "Yükleme başarısız.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={styles.portalCardWrapper}>
      <View style={styles.portalTitleRow}>
        <View style={[styles.portalIconBox, { backgroundColor: "rgba(255, 59, 48, 0.15)" }]}>
          <Ionicons name="camera-reverse" size={20} color="#FF3B30" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.portalCardTitle}>Hasar Tespit & Kanıt Portalı</Text>
          <Text style={styles.portalCardDesc}>Fotoğraf üzeri çizim, GPS ve zaman damgalı web aktarımı</Text>
        </View>
      </View>

      {/* Fotoğraf Çekim & Çizim Alanı */}
      <View style={styles.cameraBox}>
        {hasPhoto ? (
          <TouchableOpacity
            style={styles.photoCanvas}
            activeOpacity={0.9}
            onPress={handleAddMarker}
          >
            {/* Fotoğraf Arka Plan Simülasyonu */}
            <View style={styles.photoBackgroundGrid}>
              <Ionicons name="image" size={54} color="rgba(255,255,255,0.15)" />
              <Text style={{ color: "#8E8E93", fontSize: 12, marginTop: 6 }}>
                Hasar Fotoğrafı (Dokunarak İşaret Ekleyin)
              </Text>
            </View>

            {/* Çizilen / Eklenen AR Hasar İşaretleri */}
            {drawnMarkers.map((m, idx) => (
              <View
                key={idx}
                style={[styles.drawnMarkerPin, { left: m.x - 12, top: m.y - 12 }]}
              >
                <Ionicons name="alert-circle" size={24} color="#FF3B30" />
                <View style={styles.markerLabelBox}>
                  <Text style={styles.markerLabelText}>{m.label}</Text>
                </View>
              </View>
            ))}

            {/* GPS & Zaman Damgası Filigranı (Watermark) */}
            <View style={styles.watermarkBadge}>
              <Ionicons name="location-sharp" size={12} color="#34C759" />
              <Text style={styles.watermarkText}>
                LAT: {simulatedGPS.latitude} | LON: {simulatedGPS.longitude}
              </Text>
              <Text style={styles.watermarkText}>• {currentTimestamp}</Text>
            </View>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.cameraEmptyBox}
            activeOpacity={0.8}
            onPress={handleTakeEvidencePhoto}
          >
            <Ionicons name="camera" size={40} color="#0A7AFF" />
            <Text style={styles.cameraEmptyTitle}>Kanıt Fotoğrafı Çek</Text>
            <Text style={styles.cameraEmptyDesc}>
              Kamera açılır, üzerine kırmızı hasar çizgileri eklenir
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Form Girişleri */}
      <View style={styles.formFieldsBox}>
        <Text style={styles.fieldLabel}>Olay / Kusur Başlığı</Text>
        <TextInput
          style={styles.fieldInput}
          value={title}
          onChangeText={setTitle}
          placeholder="Örn: Blok-B 3. Kat Kolon Kalıp Deformasyonu"
          placeholderTextColor="#636366"
        />

        <Text style={styles.fieldLabel}>Şiddet Derecesi</Text>
        <View style={styles.severityRow}>
          {(["CRITICAL", "HIGH", "MEDIUM"] as const).map((s) => {
            const isSel = severity === s;
            const color = s === "CRITICAL" ? "#FF3B30" : s === "HIGH" ? "#FF9500" : "#0A7AFF";
            return (
              <TouchableOpacity
                key={s}
                style={[
                  styles.severityPill,
                  isSel && { backgroundColor: color, borderColor: color },
                ]}
                onPress={() => setSeverity(s)}
              >
                <Text style={[styles.severityText, isSel && { color: "#FFFFFF" }]}>
                  {s === "CRITICAL" ? "KRİTİK" : s === "HIGH" ? "YÜKSEK" : "ORTA"}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={styles.fieldLabel}>Açıklama & Saha Notları</Text>
        <TextInput
          style={[styles.fieldInput, { height: 70, textAlignVertical: "top" }]}
          value={notes}
          onChangeText={setNotes}
          placeholder="Statik proje aksına göre 2 cm kaçıklık tespit edildi..."
          placeholderTextColor="#636366"
          multiline
        />

        <TouchableOpacity
          style={styles.submitPrimaryBtn}
          onPress={handleSubmitEvidence}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <Ionicons name="cloud-upload" size={18} color="#FFFFFF" />
              <Text style={styles.submitPrimaryBtnText}>Web Sistemine Yükle (Kanıt)</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Önceki Hasar Raporları */}
      <View style={styles.subListSection}>
        <Text style={styles.subListTitle}>WEB'E İLETİLEN SON HASAR KAYITLARI</Text>
        {reports.map((r) => (
          <View key={r.id} style={styles.reportRowCard}>
            <View style={styles.reportRowHeader}>
              <Text style={styles.reportTitle} numberOfLines={1}>
                {r.title}
              </Text>
              <View style={[styles.statusBadge, { backgroundColor: "rgba(255, 59, 48, 0.15)" }]}>
                <Text style={{ color: "#FF3B30", fontSize: 10, fontWeight: "800" }}>
                  {r.severity}
                </Text>
              </View>
            </View>
            <Text style={styles.reportLocation}>
              📍 {r.siteName} • {r.timestamp}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

/* ========================================================================== */
/*                    2. TAŞERON PORTALI                                      */
/* ========================================================================== */
function SubcontractorPortal() {
  const [subTab, setSubTab] = useState<"hakedis" | "invoices" | "puantaj">("hakedis");
  const [hakedisList, setHakedisList] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [showHakedisModal, setShowHakedisModal] = useState(false);

  // Form State
  const [itemTitle, setItemTitle] = useState("");
  const [quantity, setQuantity] = useState("");
  const [unitPrice, setUnitPrice] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Puantaj listesi
  const [workers, setWorkers] = useState([
    { id: "w1", name: "Ramazan Usta", trade: "Kalıpçı Ustası", status: "PRESENT", hours: 8 },
    { id: "w2", name: "Murat Keskin", trade: "Demirci Ustası", status: "PRESENT", hours: 8 },
    { id: "w3", name: "Yusuf Akın", trade: "Sıva & Alçı Ustası", status: "PRESENT", hours: 8 },
    { id: "w4", name: "Cemil Boz", trade: "Demirci Kalfası", status: "LEAVE", hours: 0 },
  ]);

  useEffect(() => {
    (async () => {
      const hData = await subcontractorApi.getHakedisList();
      const iData = await subcontractorApi.getInvoices();
      setHakedisList(hData || []);
      setInvoices(iData || []);
    })();
  }, []);

  const handleToggleWorker = (id: string) => {
    setWorkers((prev) =>
      prev.map((w) =>
        w.id === id
          ? {
              ...w,
              status: w.status === "PRESENT" ? "ABSENT" : "PRESENT",
              hours: w.status === "PRESENT" ? 0 : 8,
            }
          : w
      )
    );
  };

  const handleSaveAttendance = async () => {
    await subcontractorApi.submitAttendance({
      date: new Date().toLocaleDateString("tr-TR"),
      workers: workers as any,
    });
    Alert.alert("Başarılı", "Ekip puantajı ana yüklenici ve şantiye şefine iletildi.");
  };

  const handleSubmitNewHakedis = async () => {
    if (!itemTitle.trim() || !quantity || !unitPrice) {
      Alert.alert("Eksik Alan", "Lütfen imalat kalemi, miktar ve birim fiyatı girin.");
      return;
    }
    const q = parseFloat(quantity);
    const up = parseFloat(unitPrice);
    const total = q * up;

    setIsSubmitting(true);
    await subcontractorApi.submitHakedis({
      itemTitle,
      period: "Kasım 2026",
      quantity: q,
      unit: "m²",
      unitPrice: up,
      total,
    });
    setIsSubmitting(false);
    setShowHakedisModal(false);
    setItemTitle("");
    setQuantity("");
    setUnitPrice("");

    Alert.alert("Hakediş Gönderildi", `₺${total.toLocaleString("tr-TR")} tutarındaki hakediş onay kuyruğuna alındı.`);
    const updated = await subcontractorApi.getHakedisList();
    setHakedisList(updated || []);
  };

  return (
    <View style={styles.portalCardWrapper}>
      <View style={styles.portalTitleRow}>
        <View style={[styles.portalIconBox, { backgroundColor: "rgba(255, 149, 0, 0.15)" }]}>
          <Ionicons name="hammer" size={20} color="#FF9500" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.portalCardTitle}>Taşeron Portalı</Text>
          <Text style={styles.portalCardDesc}>Hakediş talepleri, faturalar ve ekip puantaj yönetimi</Text>
        </View>
      </View>

      {/* Alt Sekmeler */}
      <View style={styles.subTabRow}>
        {(["hakedis", "invoices", "puantaj"] as const).map((tab) => {
          const isActive = subTab === tab;
          const label =
            tab === "hakedis" ? "Hakedişlerim" : tab === "invoices" ? "Faturalarım" : "Ekip Puantajı";
          return (
            <TouchableOpacity
              key={tab}
              style={[styles.subTabButton, isActive && styles.subTabButtonActive]}
              onPress={() => setSubTab(tab)}
            >
              <Text style={[styles.subTabText, isActive && styles.subTabTextActive]}>
                {label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* 1. HAKEDİŞLER */}
      {subTab === "hakedis" && (
        <View style={{ gap: 10 }}>
          <TouchableOpacity
            style={styles.actionBtnOrange}
            onPress={() => setShowHakedisModal(true)}
          >
            <Ionicons name="add-circle" size={18} color="#FFFFFF" />
            <Text style={styles.actionBtnText}>Yeni Hakediş Talebi Gir</Text>
          </TouchableOpacity>

          {hakedisList.map((hk) => (
            <View key={hk.id} style={styles.itemCard}>
              <View style={styles.itemHeader}>
                <Text style={styles.itemTitle}>{hk.itemTitle}</Text>
                <View
                  style={[
                    styles.statusBadge,
                    { backgroundColor: hk.statusColor ? `${hk.statusColor}22` : "rgba(52, 199, 89, 0.15)" },
                  ]}
                >
                  <Text
                    style={{
                      color: hk.statusColor || "#34C759",
                      fontSize: 10,
                      fontWeight: "800",
                    }}
                  >
                    {hk.status}
                  </Text>
                </View>
              </View>
              <Text style={styles.itemSub}>{hk.period}</Text>
              <View style={styles.itemFooterRow}>
                <Text style={styles.itemMeta}>Miktar: {hk.quantity} {hk.unit}</Text>
                <Text style={styles.itemAmount}>₺{hk.amount.toLocaleString("tr-TR")}</Text>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* 2. FATURALAR */}
      {subTab === "invoices" && (
        <View style={{ gap: 10 }}>
          {invoices.map((inv) => (
            <View key={inv.id} style={styles.itemCard}>
              <View style={styles.itemHeader}>
                <Text style={styles.itemTitle}>Fatura No: {inv.invoiceNo}</Text>
                <View style={[styles.statusBadge, { backgroundColor: "rgba(10, 122, 255, 0.15)" }]}>
                  <Text style={{ color: "#0A7AFF", fontSize: 10, fontWeight: "800" }}>
                    {inv.status}
                  </Text>
                </View>
              </View>
              <Text style={styles.itemSub}>Düzenleme Tarihi: {inv.date}</Text>
              <View style={styles.itemFooterRow}>
                <Text style={styles.itemMeta}>KDV: ₺{inv.vat.toLocaleString("tr-TR")}</Text>
                <Text style={styles.itemAmount}>Toplam: ₺{inv.total.toLocaleString("tr-TR")}</Text>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* 3. EKİP PUANTAJI */}
      {subTab === "puantaj" && (
        <View style={{ gap: 10 }}>
          <Text style={styles.infoHelperText}>
            Saha çalışanlarının günlük durumunu işaretleyip ana yükleniciye onaylatın.
          </Text>

          {workers.map((w) => {
            const isPresent = w.status === "PRESENT";
            return (
              <View key={w.id} style={styles.workerRowCard}>
                <View style={styles.workerAvatar}>
                  <Ionicons name="person" size={16} color="#FF9500" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.workerName}>{w.name}</Text>
                  <Text style={styles.workerTrade}>{w.trade}</Text>
                </View>

                <TouchableOpacity
                  style={[
                    styles.presentToggleBtn,
                    isPresent ? styles.presentBtnActive : styles.presentBtnInactive,
                  ]}
                  onPress={() => handleToggleWorker(w.id)}
                >
                  <Ionicons
                    name={isPresent ? "checkmark" : "close"}
                    size={14}
                    color="#FFFFFF"
                  />
                  <Text style={styles.presentToggleText}>
                    {isPresent ? "GELDİ (8s)" : "YOK"}
                  </Text>
                </TouchableOpacity>
              </View>
            );
          })}

          <TouchableOpacity style={styles.submitPrimaryBtn} onPress={handleSaveAttendance}>
            <Ionicons name="save" size={18} color="#FFFFFF" />
            <Text style={styles.submitPrimaryBtnText}>Puantajı Onayla ve Gönder</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* YENİ HAKEDİŞ MODALI */}
      <Modal visible={showHakedisModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Yeni Hakediş Talebi</Text>
              <TouchableOpacity onPress={() => setShowHakedisModal(false)}>
                <Ionicons name="close-circle" size={26} color="#8E8E93" />
              </TouchableOpacity>
            </View>

            <Text style={styles.fieldLabel}>İmalat Kalemi</Text>
            <TextInput
              style={styles.fieldInput}
              value={itemTitle}
              onChangeText={setItemTitle}
              placeholder="Örn: 3. Kat Alçı Sıva İmalatı"
              placeholderTextColor="#636366"
            />

            <View style={{ flexDirection: "row", gap: 10 }}>
              <View style={{ flex: 1 }}>
                <Text style={styles.fieldLabel}>Miktar (m²)</Text>
                <TextInput
                  style={styles.fieldInput}
                  value={quantity}
                  onChangeText={setQuantity}
                  placeholder="1200"
                  placeholderTextColor="#636366"
                  keyboardType="numeric"
                />
              </View>

              <View style={{ flex: 1 }}>
                <Text style={styles.fieldLabel}>Birim Fiyat (₺)</Text>
                <TextInput
                  style={styles.fieldInput}
                  value={unitPrice}
                  onChangeText={setUnitPrice}
                  placeholder="150"
                  placeholderTextColor="#636366"
                  keyboardType="numeric"
                />
              </View>
            </View>

            <TouchableOpacity
              style={styles.actionBtnOrange}
              onPress={handleSubmitNewHakedis}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.actionBtnText}>Hakediş Talebini Onaya Gönder</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

/* ========================================================================== */
/*                    3. SÜRÜCÜ & ROTA PORTALI                                */
/* ========================================================================== */
function DriverRoutePortal({ currentUser }: { currentUser?: any }) {
  const [gatePass, setGatePass] = useState<any>(null);
  const [isDriving, setIsDriving] = useState(false);
  const [isTrackingLoading, setIsTrackingLoading] = useState(false);
  const [driverStatus, setDriverStatus] = useState<"IDLE" | "IN_TRANSIT" | "DELAYED" | "ARRIVED_AT_SITE">("IDLE");
  const [isSendingStatus, setIsSendingStatus] = useState(false);

  // Rol kontrolü: Sadece DRIVER / SOFOR veya ADMIN / ENGINEER erişebilir
  const userRole = currentUser?.role || "GUEST";
  const hasAccess =
    userRole === "DRIVER" ||
    userRole === "SOFOR" ||
    userRole === "ADMIN" ||
    userRole === "SYSTEM_ADMIN" ||
    userRole === "ENGINEER";

  const driverCoord = { latitude: 36.584, longitude: 36.1685 };
  const gateCoord = { latitude: 36.5878, longitude: 36.1735 };
  const dumpCoord = { latitude: 36.5889, longitude: 36.1742 };

  useEffect(() => {
    (async () => {
      const data = await driverApi.getGatePass();
      setGatePass(data);
      const active = await isDriverTrackingActive();
      setIsDriving(active);
    })();
  }, []);

  if (!hasAccess) {
    return (
      <View style={[styles.portalCardWrapper, { alignItems: "center", paddingVertical: 40 }]}>
        <View style={[styles.portalIconBox, { backgroundColor: "rgba(255, 59, 48, 0.15)", width: 64, height: 64, borderRadius: 32, marginBottom: 16 }]}>
          <Ionicons name="lock-closed" size={32} color="#FF3B30" />
        </View>
        <Text style={[styles.portalCardTitle, { fontSize: 18, textAlign: "center", marginBottom: 8 }]}>
          Erişim İzni Kısıtlandı
        </Text>
        <Text style={[styles.portalCardDesc, { textAlign: "center", maxWidth: 300, lineHeight: 20 }]}>
          Sürücü ve Lojistik ekranı yalnızca sistemde rolü "DRIVER" (Şoför) olan personele veya Sistem Yöneticisine açıktır.{"\n"}
          Mevcut rolünüz: <Text style={{ color: "#FF9500", fontWeight: "700" }}>{userRole}</Text>
        </Text>
      </View>
    );
  }

  // Telemetri ve Durum Gönderimi (Yola Çıktım, Gecikme Var, Şantiyeye Ulaştım)
  const handleUpdateDriverStatus = async (
    status: "IN_TRANSIT" | "DELAYED" | "ARRIVED_AT_SITE",
    title: string
  ) => {
    try {
      setIsSendingStatus(true);
      setDriverStatus(status);

      await logisticsApi.updateStatus({
        status,
        plateNumber: gatePass?.plate || "34 NXA 789",
        driverName: currentUser?.name || "Lojistik Sürücüsü",
        latitude: driverCoord.latitude,
        longitude: driverCoord.longitude,
        notes: `Sürücü durumu güncellendi: ${title}`,
      });

      Alert.alert(
        "✅ Telemetri İletildi",
        `Durumunuz "${title}" olarak şantiye kontrol merkezine ve haritaya anlık yansıtıldı.`
      );
    } catch (err: any) {
      Alert.alert("İletişim Uyarısı", err?.message || "Durum iletilemedi.");
    } finally {
      setIsSendingStatus(false);
    }
  };

  const handleToggleDriving = async () => {
    try {
      setIsTrackingLoading(true);
      if (!isDriving) {
        const success = await startDriverLocationTracking({
          plate: gatePass?.plate || "34 NXA 789",
          driverName: currentUser?.name || "Lojistik Şoförü",
        });
        if (success) {
          setIsDriving(true);
          setDriverStatus("IN_TRANSIT");
          Alert.alert(
            "Sürüş Başlatıldı (Arka Plan GPS Aktif)",
            "Cihaz kilitliyken bile her 10 saniyede bir veya 50 metre yer değiştirmede /api/location/update üzerinden merkeze telemetri aktarılacaktır."
          );
        } else {
          Alert.alert("İzin Gerekli", "Arka plan konum izni verilmediğinden takip başlatılamadı.");
        }
      } else {
        await stopDriverLocationTracking();
        setIsDriving(false);
        Alert.alert("Sürüş Tamamlandı", "Arka plan GPS takibi durduruldu.");
      }
    } catch (err: any) {
      Alert.alert("Hata", err?.message || "İşlem gerçekleştirilemedi.");
    } finally {
      setIsTrackingLoading(false);
    }
  };

  const handleOpenNavigation = () => {
    const url = Platform.select({
      ios: `maps:0,0?q=Nexa+Towers+Santiye@${gateCoord.latitude},${gateCoord.longitude}`,
      android: `geo:0,0?q=${gateCoord.latitude},${gateCoord.longitude}(Nexa Towers Santiye)`,
    });
    if (url) Linking.openURL(url);
  };

  return (
    <View style={styles.portalCardWrapper}>
      <View style={styles.portalTitleRow}>
        <View style={[styles.portalIconBox, { backgroundColor: "rgba(52, 199, 89, 0.15)" }]}>
          <Ionicons name="navigate" size={20} color="#34C759" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.portalCardTitle}>Sürücü & Rota Portalı</Text>
          <Text style={styles.portalCardDesc}>Kapı geçişi için QR kod ve döküm rotası</Text>
        </View>
        <View style={{ backgroundColor: driverStatus === "IN_TRANSIT" ? "rgba(52, 199, 89, 0.2)" : driverStatus === "DELAYED" ? "rgba(255, 59, 48, 0.2)" : "rgba(10, 122, 255, 0.2)", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 }}>
          <Text style={{ fontSize: 11, fontWeight: "700", color: driverStatus === "IN_TRANSIT" ? "#34C759" : driverStatus === "DELAYED" ? "#FF3B30" : "#0A7AFF" }}>
            {driverStatus === "IN_TRANSIT" ? "YOLDA" : driverStatus === "DELAYED" ? "GECİKME" : driverStatus === "ARRIVED_AT_SITE" ? "ŞANTİYEDE" : "HAZIR"}
          </Text>
        </View>
      </View>

      {/* ADIM 3: ADAPTİF SÜRÜCÜ DURUM BUTONLARI */}
      <View style={{ backgroundColor: "rgba(255, 255, 255, 0.04)", borderRadius: 16, padding: 12, gap: 8, borderWidth: 1, borderColor: "rgba(255, 255, 255, 0.08)" }}>
        <Text style={{ fontSize: 12, fontWeight: "700", color: "#8E8E93", textTransform: "uppercase", letterSpacing: 0.5 }}>
          Anlık Sürücü Durumu Bildir
        </Text>
        <View style={{ flexDirection: "row", gap: 8 }}>
          {/* Yola Çıktım */}
          <TouchableOpacity
            style={{
              flex: 1,
              backgroundColor: driverStatus === "IN_TRANSIT" ? "#34C759" : "rgba(52, 199, 89, 0.15)",
              paddingVertical: 10,
              paddingHorizontal: 8,
              borderRadius: 10,
              alignItems: "center",
              justifyContent: "center",
              borderWidth: 1,
              borderColor: "#34C759",
            }}
            disabled={isSendingStatus}
            onPress={() => handleUpdateDriverStatus("IN_TRANSIT", "Yola Çıktım")}
          >
            <Ionicons name="car" size={16} color={driverStatus === "IN_TRANSIT" ? "#FFFFFF" : "#34C759"} />
            <Text style={{ fontSize: 11, fontWeight: "700", color: driverStatus === "IN_TRANSIT" ? "#FFFFFF" : "#34C759", marginTop: 4 }}>
              Yola Çıktım
            </Text>
          </TouchableOpacity>

          {/* Gecikme Var */}
          <TouchableOpacity
            style={{
              flex: 1,
              backgroundColor: driverStatus === "DELAYED" ? "#FF9500" : "rgba(255, 149, 0, 0.15)",
              paddingVertical: 10,
              paddingHorizontal: 8,
              borderRadius: 10,
              alignItems: "center",
              justifyContent: "center",
              borderWidth: 1,
              borderColor: "#FF9500",
            }}
            disabled={isSendingStatus}
            onPress={() => handleUpdateDriverStatus("DELAYED", "Gecikme Var (Kaza/Trafik)")}
          >
            <Ionicons name="warning" size={16} color={driverStatus === "DELAYED" ? "#FFFFFF" : "#FF9500"} />
            <Text style={{ fontSize: 11, fontWeight: "700", color: driverStatus === "DELAYED" ? "#FFFFFF" : "#FF9500", marginTop: 4 }}>
              Gecikme Var
            </Text>
          </TouchableOpacity>

          {/* Şantiyeye Ulaştım */}
          <TouchableOpacity
            style={{
              flex: 1,
              backgroundColor: driverStatus === "ARRIVED_AT_SITE" ? "#0A7AFF" : "rgba(10, 122, 255, 0.15)",
              paddingVertical: 10,
              paddingHorizontal: 8,
              borderRadius: 10,
              alignItems: "center",
              justifyContent: "center",
              borderWidth: 1,
              borderColor: "#0A7AFF",
            }}
            disabled={isSendingStatus}
            onPress={() => handleUpdateDriverStatus("ARRIVED_AT_SITE", "Şantiyeye Ulaştım")}
          >
            <Ionicons name="business" size={16} color={driverStatus === "ARRIVED_AT_SITE" ? "#FFFFFF" : "#0A7AFF"} />
            <Text style={{ fontSize: 11, fontWeight: "700", color: driverStatus === "ARRIVED_AT_SITE" ? "#FFFFFF" : "#0A7AFF", marginTop: 4 }}>
              Şantiyedeyim
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Şoför Canlı Arka Plan GPS Takip Kontrolü (10s veya 50m) */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          backgroundColor: isDriving ? "rgba(52, 199, 89, 0.12)" : "rgba(255, 255, 255, 0.04)",
          borderWidth: 1,
          borderColor: isDriving ? "rgba(52, 199, 89, 0.35)" : "rgba(255, 255, 255, 0.08)",
          borderRadius: 16,
          padding: 14,
          gap: 12,
        }}
      >
        <Ionicons name={isDriving ? "radio" : "pause-circle"} size={24} color={isDriving ? "#34C759" : "#8E8E93"} />
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 13, fontWeight: "800", color: isDriving ? "#34C759" : "#FFFFFF" }}>
            {isDriving ? "CANLI ARKA PLAN GPS TAKİBİ AKTİF" : "SÜRÜŞ TAKİBİ BEKLEMEDE"}
          </Text>
          <Text style={{ fontSize: 11, color: "#8E8E93", marginTop: 2 }}>
            {isDriving
              ? "Her 10s veya 50m telemetri verisi şantiye merkezine aktarılıyor"
              : "Döküm rotasına çıkarken sürüş takibini başlatın"}
          </Text>
        </View>
      </View>

      <TouchableOpacity
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: isDriving ? "#FF3B30" : "#34C759",
          paddingVertical: 14,
          borderRadius: 14,
          gap: 8,
        }}
        onPress={handleToggleDriving}
        disabled={isTrackingLoading}
        activeOpacity={0.85}
      >
        {isTrackingLoading ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <>
            <Ionicons name={isDriving ? "stop-circle" : "play-circle"} size={22} color="#FFFFFF" />
            <Text style={{ color: "#FFFFFF", fontSize: 14, fontWeight: "800" }}>
              {isDriving ? "Sürüşü Tamamla (GPS Durdur)" : "Sürüşe Başla (Arka Plan GPS Aktif Et)"}
            </Text>
          </>
        )}
      </TouchableOpacity>

      {/* Kapı Geçiş QR Kodu */}
      <View style={styles.qrPassBox}>
        <Text style={styles.qrPassTitle}>KAPI GEÇİŞ KAREKODU</Text>
        <Text style={styles.qrPassPlate}>{gatePass?.plate || "34 NXA 789"}</Text>

        <View style={styles.qrFrame}>
          {/* QR Kod Görseli */}
          <Ionicons name="qr-code" size={160} color="#FFFFFF" />
        </View>

        <View style={styles.qrBadgeRow}>
          <Ionicons name="shield-checkmark" size={16} color="#34C759" />
          <Text style={styles.qrBadgeText}>
            {gatePass?.status === "GEÇİŞE_UYGUN" ? "KAPI GEÇİŞİNE UYGUN (AKTİF)" : "ONAY BEKLİYOR"}
          </Text>
        </View>

        <Text style={styles.qrMetaInfo}>
          İrsaliye: {gatePass?.gatePassId || "GP-99824"} • {gatePass?.material || "C35 Hazır Beton"}
        </Text>
      </View>

      {/* Şantiye & Döküm Sahası Haritası */}
      <View style={styles.mapSectionWrapper}>
        <Text style={styles.subListTitle}>ŞANTİYE & DÖKÜM ROTASI</Text>

        <View style={styles.mapContainer}>
          <MapView
            style={StyleSheet.absoluteFill}
            initialRegion={{
              latitude: 36.586,
              longitude: 36.171,
              latitudeDelta: 0.015,
              longitudeDelta: 0.015,
            }}
          >
            {/* Sürücü Mevcut Konum */}
            <Marker coordinate={driverCoord} title="Mevcut Konum" description="Transmikser">
              <View style={[styles.customMapMarker, { backgroundColor: "#0A7AFF" }]}>
                <Ionicons name="car" size={16} color="#FFFFFF" />
              </View>
            </Marker>

            {/* Kapı Konumu */}
            <Marker coordinate={gateCoord} title="Şantiye Giriş Kapısı" description="2 Nolu Giriş">
              <View style={[styles.customMapMarker, { backgroundColor: "#34C759" }]}>
                <Ionicons name="business" size={16} color="#FFFFFF" />
              </View>
            </Marker>

            {/* Döküm Sahası */}
            <Marker coordinate={dumpCoord} title="Döküm Sahası" description="Blok-B Temel">
              <View style={[styles.customMapMarker, { backgroundColor: "#FF9500" }]}>
                <Ionicons name="construct" size={16} color="#FFFFFF" />
              </View>
            </Marker>

            {/* Rota Çizgisi */}
            <Polyline
              coordinates={[driverCoord, gateCoord, dumpCoord]}
              strokeColor="#0A7AFF"
              strokeWidth={4}
            />
          </MapView>
        </View>

        <View style={styles.routeFooterBox}>
          <View style={{ flex: 1 }}>
            <Text style={styles.routeDistanceText}>Kalan: 4.2 km (12 dk)</Text>
            <Text style={styles.routeTargetText}>Hedef: Nexa Towers - C35 Döküm Kapısı</Text>
          </View>

          <TouchableOpacity style={styles.navStartBtn} onPress={handleOpenNavigation}>
            <Ionicons name="navigate" size={16} color="#FFFFFF" />
            <Text style={styles.navStartText}>Navigasyon</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

/* ========================================================================== */
/*                    4. FRANCHISE PORTALI                                    */
/* ========================================================================== */
function FranchisePortal() {
  const [dashboard, setDashboard] = useState<any>(null);
  const [showRevenueModal, setShowRevenueModal] = useState(false);
  const [cash, setCash] = useState("");
  const [card, setCard] = useState("");
  const [receipts, setReceipts] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    (async () => {
      const data = await franchiseApi.getDashboard();
      setDashboard(data);
    })();
  }, []);

  const handleSubmitRevenue = async () => {
    if (!cash && !card) {
      Alert.alert("Eksik Bilgi", "Lütfen en az bir ciro tutarı girin.");
      return;
    }
    setIsSubmitting(true);
    await franchiseApi.submitRevenue({
      date: new Date().toLocaleDateString("tr-TR"),
      cash: parseFloat(cash) || 0,
      card: parseFloat(card) || 0,
      receipts: parseInt(receipts) || 0,
    });
    setIsSubmitting(false);
    setShowRevenueModal(false);
    setCash("");
    setCard("");
    setReceipts("");
    Alert.alert("Ciro Beyanı İletildi", "Günlük ciro ve adisyon verisi genel merkez sunucusuna aktarıldı.");
  };

  return (
    <View style={styles.portalCardWrapper}>
      <View style={styles.portalTitleRow}>
        <View style={[styles.portalIconBox, { backgroundColor: "rgba(10, 122, 255, 0.15)" }]}>
          <Ionicons name="business" size={20} color="#0A7AFF" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.portalCardTitle}>Franchise Portalı</Text>
          <Text style={styles.portalCardDesc}>Ciro beyanı, konsept şablonları ve şube denetim özeti</Text>
        </View>
      </View>

      {/* Ciro Özet Metrikleri */}
      <View style={styles.metricsGrid}>
        <View style={styles.metricCard}>
          <Text style={styles.metricCardLabel}>Bugünkü Ciro</Text>
          <Text style={styles.metricCardValue}>
            ₺{(dashboard?.dailyRevenue || 148500).toLocaleString("tr-TR")}
          </Text>
        </View>

        <View style={styles.metricCard}>
          <Text style={styles.metricCardLabel}>Aylık Kümülatif</Text>
          <Text style={[styles.metricCardValue, { color: "#34C759" }]}>
            ₺{(dashboard?.monthlyCumulative || 3840000).toLocaleString("tr-TR")}
          </Text>
        </View>

        <View style={styles.metricCard}>
          <Text style={styles.metricCardLabel}>Royalty Payı (%6)</Text>
          <Text style={[styles.metricCardValue, { color: "#FF9500" }]}>
            ₺{(dashboard?.royaltyFee || 230400).toLocaleString("tr-TR")}
          </Text>
        </View>

        <View style={styles.metricCard}>
          <Text style={styles.metricCardLabel}>Denetim Skoru</Text>
          <Text style={[styles.metricCardValue, { color: "#AF52DE" }]}>
            %{dashboard?.lastAuditScore || 94} (A+)
          </Text>
        </View>
      </View>

      <TouchableOpacity
        style={styles.submitPrimaryBtn}
        onPress={() => setShowRevenueModal(true)}
      >
        <Ionicons name="cash-outline" size={18} color="#FFFFFF" />
        <Text style={styles.submitPrimaryBtnText}>Günlük Ciro Beyanı Ekle</Text>
      </TouchableOpacity>

      {/* Konsept Şablonları */}
      <View style={styles.subListSection}>
        <Text style={styles.subListTitle}>TİP MAĞAZA KONSEPT ŞABLONLARI</Text>
        {(dashboard?.templates || []).map((t: any) => (
          <View key={t.id} style={styles.itemCard}>
            <View style={styles.itemHeader}>
              <Text style={styles.itemTitle}>{t.title}</Text>
              <View style={[styles.statusBadge, { backgroundColor: "rgba(10, 122, 255, 0.15)" }]}>
                <Text style={{ color: "#0A7AFF", fontSize: 10, fontWeight: "800" }}>
                  BIM 3D
                </Text>
              </View>
            </View>
            <Text style={styles.itemSub}>Önerilen Alan: {t.area}</Text>
            <View style={styles.itemFooterRow}>
              <Text style={styles.itemMeta}>Kurulum: ₺{t.costPerSqm.toLocaleString("tr-TR")} / m²</Text>
              <Text style={{ color: "#8E8E93", fontSize: 11 }}>{t.bimModel}</Text>
            </View>
          </View>
        ))}
      </View>

      {/* CİRO BEYANI MODALI */}
      <Modal visible={showRevenueModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Günlük Ciro Beyanı</Text>
              <TouchableOpacity onPress={() => setShowRevenueModal(false)}>
                <Ionicons name="close-circle" size={26} color="#8E8E93" />
              </TouchableOpacity>
            </View>

            <Text style={styles.fieldLabel}>Nakit Ciro (₺)</Text>
            <TextInput
              style={styles.fieldInput}
              value={cash}
              onChangeText={setCash}
              placeholder="32500"
              placeholderTextColor="#636366"
              keyboardType="numeric"
            />

            <Text style={styles.fieldLabel}>Kredi Kartı / POS (₺)</Text>
            <TextInput
              style={styles.fieldInput}
              value={card}
              onChangeText={setCard}
              placeholder="116000"
              placeholderTextColor="#636366"
              keyboardType="numeric"
            />

            <Text style={styles.fieldLabel}>Toplam Fiş / Adisyon Adedi</Text>
            <TextInput
              style={styles.fieldInput}
              value={receipts}
              onChangeText={setReceipts}
              placeholder="340"
              placeholderTextColor="#636366"
              keyboardType="numeric"
            />

            <TouchableOpacity
              style={styles.submitPrimaryBtn}
              onPress={handleSubmitRevenue}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.submitPrimaryBtnText}>Ciro Beyanını Kaydet</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

/* ========================================================================== */
/*                    5. YAPI DENETİM PORTALI                                 */
/* ========================================================================== */
function InspectionPortal() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [showSignModal, setShowSignModal] = useState(false);
  const [inspectorPin, setInspectorPin] = useState("");
  const [isSigning, setIsSigning] = useState(false);

  // Saha Senaryoları State
  const [revisions, setRevisions] = useState<any[]>([]);
  const [showConcreteModal, setShowConcreteModal] = useState(false);
  const [showReceivingModal, setShowReceivingModal] = useState(false);

  // Beton Döküm Tutanağı Form State
  const [slumpCm, setSlumpCm] = useState("18");
  const [concreteTemp, setConcreteTemp] = useState("22");
  const [airTemp, setAirTemp] = useState("25");
  const [transmixerPlate, setTransmixerPlate] = useState("");
  const [waybillTime, setWaybillTime] = useState("10:00");
  const [castStartTime, setCastStartTime] = useState("10:30");
  const [labSampleTaken, setLabSampleTaken] = useState(true);
  const [isSubmittingCast, setIsSubmittingCast] = useState(false);

  // Malzeme Tesellüm Form State
  const [recWaybillNo, setRecWaybillNo] = useState("");
  const [recMaterialType, setRecMaterialType] = useState("C35 Hazır Beton");
  const [recQuantity, setRecQuantity] = useState("12");
  const [recRejectedQty, setRecRejectedQty] = useState("0");
  const [isSubmittingRec, setIsSubmittingRec] = useState(false);

  useEffect(() => {
    (async () => {
      const data = await inspectionApi.getCriticalTasks();
      setTasks(data || []);
      const revs = await revisionApi.getLatestRevisions();
      setRevisions(revs || []);
    })();
  }, []);

  const handleSubmitConcreteLog = async () => {
    if (!transmixerPlate) {
      Alert.alert("Eksik Bilgi", "Transmikser plakasını giriniz.");
      return;
    }
    setIsSubmittingCast(true);
    await concreteCastingApi.submitCastingLog({
      concreteClass: "C35/45",
      element: "1. Normal Kat Kolonları",
      slumpCm: parseFloat(slumpCm) || 18,
      concreteTemp: parseFloat(concreteTemp) || 22,
      airTemp: parseFloat(airTemp) || 25,
      transmixerPlate,
      waybillTime,
      castStartTime,
      labSampleTaken,
    });
    setIsSubmittingCast(false);
    setShowConcreteModal(false);
    setTransmixerPlate("");
    Alert.alert("Tutanak Kaydedildi", "Taze beton test verileri ve QA tutanağı sisteme işlendi.");
  };

  const handleSubmitReceivingLog = async () => {
    if (!recWaybillNo) {
      Alert.alert("Eksik Bilgi", "İrsaliye numarasını giriniz.");
      return;
    }
    setIsSubmittingRec(true);
    await materialReceivingApi.submitReceiving({
      waybillNo: recWaybillNo,
      materialType: recMaterialType,
      receivedQuantity: parseFloat(recQuantity) || 0,
      unit: "m³ / Ton",
      rejectedQuantity: parseFloat(recRejectedQty) || 0,
    });
    setIsSubmittingRec(false);
    setShowReceivingModal(false);
    setRecWaybillNo("");
    Alert.alert("Tesellüm Kaydedildi", "Malzeme kabul ve irsaliye kaydı sunucuya aktarıldı.");
  };

  const handleOpenSignModal = (task: any) => {
    setSelectedTask(task);
    setShowSignModal(true);
  };

  const handleSignVize = async () => {
    if (!inspectorPin || inspectorPin.length < 4) {
      Alert.alert("Eksik PIN", "Lütfen 4 haneli Bakanlık Denetçi PIN kodunuzu girin.");
      return;
    }

    try {
      setIsSigning(true);
      const res = await inspectionApi.signVize(selectedTask.id, {
        pin: inspectorPin,
        signatureBase64: "digital_signature_token_" + Date.now(),
      });

      Alert.alert(
        "Yasal Vize Onaylandı",
        `${selectedTask.title}\n${res.yibfCode} nolu Bakanlık YİBF vizesi ile onaylanmıştır.`
      );

      setShowSignModal(false);
      setInspectorPin("");

      // Görev durumunu güncelle
      setTasks((prev) =>
        prev.map((t) =>
          t.id === selectedTask.id
            ? { ...t, status: "VİZE VERİLDİ (ONAYLI)", badgeColor: "#34C759" }
            : t
        )
      );
    } catch (err: any) {
      Alert.alert("İmza Hatası", err.message || "e-İmza atılamadı.");
    } finally {
      setIsSigning(false);
    }
  };

  return (
    <View style={styles.portalCardWrapper}>
      <View style={styles.portalTitleRow}>
        <View style={[styles.portalIconBox, { backgroundColor: "rgba(175, 82, 222, 0.15)" }]}>
          <Ionicons name="shield-checkmark" size={20} color="#AF52DE" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.portalCardTitle}>Yapı Denetim & QA/QC Portalı</Text>
          <Text style={styles.portalCardDesc}>Kritik imalat onayları, beton döküm tutanağı ve revizyon alarmları</Text>
        </View>
      </View>

      {/* KRİTİK PROJE REVİZYON UYARISI BANNER'I */}
      {revisions.some((r) => r.isObsoleteWarning) && (
        <View style={styles.obsoleteRevisionBanner}>
          <Ionicons name="warning" size={22} color="#FF3B30" />
          <View style={{ flex: 1 }}>
            <Text style={styles.obsoleteRevisionTitle}>
              KRİTİK REVİZYON UYARISI: {revisions.find((r) => r.isObsoleteWarning)?.revisionNo}
            </Text>
            <Text style={styles.obsoleteRevisionText}>
              {revisions.find((r) => r.isObsoleteWarning)?.notes || "Eski proje paftaları iptal edilmiştir!"}
            </Text>
          </View>
        </View>
      )}

      {/* SAHA QA & TESELLÜM HIZLI İŞLEM BUTONLARI */}
      <View style={styles.qaActionRow}>
        <TouchableOpacity
          style={[styles.qaActionButton, { backgroundColor: "rgba(0, 199, 190, 0.15)", borderColor: "rgba(0, 199, 190, 0.3)" }]}
          onPress={() => setShowConcreteModal(true)}
          activeOpacity={0.8}
        >
          <Ionicons name="flask" size={16} color="#00C7BE" />
          <Text style={[styles.qaActionText, { color: "#00C7BE" }]}>Beton Tutanağı (QA)</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.qaActionButton, { backgroundColor: "rgba(10, 122, 255, 0.15)", borderColor: "rgba(10, 122, 255, 0.3)" }]}
          onPress={() => setShowReceivingModal(true)}
          activeOpacity={0.8}
        >
          <Ionicons name="cube" size={16} color="#0A7AFF" />
          <Text style={[styles.qaActionText, { color: "#0A7AFF" }]}>Malzeme Tesellüm</Text>
        </TouchableOpacity>
      </View>

      <View style={{ gap: 12 }}>
        {tasks.map((task) => (
          <View key={task.id} style={styles.itemCard}>
            <View style={styles.itemHeader}>
              <Text style={styles.itemTitle} numberOfLines={1}>
                {task.title}
              </Text>
              <View
                style={[
                  styles.statusBadge,
                  { backgroundColor: `${task.badgeColor}25` },
                ]}
              >
                <Text style={{ color: task.badgeColor, fontSize: 10, fontWeight: "800" }}>
                  {task.status}
                </Text>
              </View>
            </View>

            <Text style={styles.itemSub}>{task.details}</Text>

            <View style={styles.itemFooterRow}>
              <Text style={styles.itemMeta}>
                {task.buildingBlock} • {task.level}
              </Text>

              {task.status === "VİZE BEKLİYOR" ? (
                <TouchableOpacity
                  style={styles.vizeButton}
                  onPress={() => handleOpenSignModal(task)}
                >
                  <Ionicons name="create-outline" size={14} color="#FFFFFF" />
                  <Text style={styles.vizeButtonText}>e-İmza ile Vize Ver</Text>
                </TouchableOpacity>
              ) : (
                <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                  <Ionicons name="checkmark-done" size={16} color="#34C759" />
                  <Text style={{ color: "#34C759", fontSize: 12, fontWeight: "700" }}>
                    Onaylandı
                  </Text>
                </View>
              )}
            </View>
          </View>
        ))}
      </View>

      {/* BETON DÖKÜM TUTANAĞI MODALI */}
      <Modal visible={showConcreteModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Beton Döküm Tutanağı (QA)</Text>
              <TouchableOpacity onPress={() => setShowConcreteModal(false)}>
                <Ionicons name="close-circle" size={26} color="#8E8E93" />
              </TouchableOpacity>
            </View>

            <Text style={styles.fieldLabel}>Transmikser Plakası</Text>
            <TextInput
              style={styles.fieldInput}
              value={transmixerPlate}
              onChangeText={setTransmixerPlate}
              placeholder="34 VR 8901"
              placeholderTextColor="#636366"
              autoCapitalize="characters"
            />

            <View style={{ flexDirection: "row", gap: 8 }}>
              <View style={{ flex: 1 }}>
                <Text style={styles.fieldLabel}>Slump (cm)</Text>
                <TextInput
                  style={styles.fieldInput}
                  value={slumpCm}
                  onChangeText={setSlumpCm}
                  placeholder="18"
                  placeholderTextColor="#636366"
                  keyboardType="numeric"
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.fieldLabel}>Beton Sıcaklığı (°C)</Text>
                <TextInput
                  style={styles.fieldInput}
                  value={concreteTemp}
                  onChangeText={setConcreteTemp}
                  placeholder="22"
                  placeholderTextColor="#636366"
                  keyboardType="numeric"
                />
              </View>
            </View>

            <View style={{ flexDirection: "row", gap: 8 }}>
              <View style={{ flex: 1 }}>
                <Text style={styles.fieldLabel}>İrsaliye Saati</Text>
                <TextInput
                  style={styles.fieldInput}
                  value={waybillTime}
                  onChangeText={setWaybillTime}
                  placeholder="10:00"
                  placeholderTextColor="#636366"
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.fieldLabel}>Döküm Başlama</Text>
                <TextInput
                  style={styles.fieldInput}
                  value={castStartTime}
                  onChangeText={setCastStartTime}
                  placeholder="10:30"
                  placeholderTextColor="#636366"
                />
              </View>
            </View>

            <TouchableOpacity
              style={{ flexDirection: "row", alignItems: "center", gap: 8, marginVertical: 4 }}
              onPress={() => setLabSampleTaken(!labSampleTaken)}
            >
              <Ionicons
                name={labSampleTaken ? "checkbox" : "square-outline"}
                size={22}
                color={labSampleTaken ? "#34C759" : "#8E8E93"}
              />
              <Text style={{ color: "#FFFFFF", fontSize: 13, fontWeight: "600" }}>
                6 Adet Küp Numune Alındı & Etiketlendi
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.submitPrimaryBtn, { backgroundColor: "#00C7BE" }]}
              onPress={handleSubmitConcreteLog}
              disabled={isSubmittingCast}
            >
              {isSubmittingCast ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.submitPrimaryBtnText}>Döküm Tutanağını Kaydet</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* MALZEME TESELLÜM MODALI */}
      <Modal visible={showReceivingModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Malzeme Kabul & Tesellüm</Text>
              <TouchableOpacity onPress={() => setShowReceivingModal(false)}>
                <Ionicons name="close-circle" size={26} color="#8E8E93" />
              </TouchableOpacity>
            </View>

            <Text style={styles.fieldLabel}>İrsaliye No</Text>
            <TextInput
              style={styles.fieldInput}
              value={recWaybillNo}
              onChangeText={setRecWaybillNo}
              placeholder="IRS-99412"
              placeholderTextColor="#636366"
            />

            <Text style={styles.fieldLabel}>Gelen Malzeme Tipi</Text>
            <TextInput
              style={styles.fieldInput}
              value={recMaterialType}
              onChangeText={setRecMaterialType}
              placeholder="C35 Hazır Beton"
              placeholderTextColor="#636366"
            />

            <View style={{ flexDirection: "row", gap: 8 }}>
              <View style={{ flex: 1 }}>
                <Text style={styles.fieldLabel}>Kabul Edilen Miktar</Text>
                <TextInput
                  style={styles.fieldInput}
                  value={recQuantity}
                  onChangeText={setRecQuantity}
                  placeholder="12"
                  placeholderTextColor="#636366"
                  keyboardType="numeric"
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.fieldLabel}>Hasarlı / Reddedilen</Text>
                <TextInput
                  style={styles.fieldInput}
                  value={recRejectedQty}
                  onChangeText={setRecRejectedQty}
                  placeholder="0"
                  placeholderTextColor="#636366"
                  keyboardType="numeric"
                />
              </View>
            </View>

            <TouchableOpacity
              style={styles.submitPrimaryBtn}
              onPress={handleSubmitReceivingLog}
              disabled={isSubmittingRec}
            >
              {isSubmittingRec ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.submitPrimaryBtnText}>Tesellüm Tutanağını Kaydet</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* E-İMZA & VİZE ONAY MODALI */}
      <Modal visible={showSignModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Bakanlık YİBF e-İmza Vizesi</Text>
              <TouchableOpacity onPress={() => setShowSignModal(false)}>
                <Ionicons name="close-circle" size={26} color="#8E8E93" />
              </TouchableOpacity>
            </View>

            <Text style={{ color: "#FFFFFF", fontSize: 14, fontWeight: "700" }}>
              {selectedTask?.title}
            </Text>
            <Text style={styles.infoHelperText}>
              Bu onay, 4708 sayılı Yapı Denetimi Kanunu uyarınca yasal bağlayıcılığa sahip
              resmi vizedir. Kalıp ve donatı uygunluğu denetlenmiştir.
            </Text>

            {/* Simüle Edilmiş İmza Çizim Alanı */}
            <View style={styles.signaturePadBox}>
              <Ionicons name="finger-print" size={32} color="#AF52DE" />
              <Text style={{ color: "#8E8E93", fontSize: 11, marginTop: 4 }}>
                Mobil İmza & Dijital Sertifika Alanı
              </Text>
            </View>

            <Text style={styles.fieldLabel}>Bakanlık Denetçi PIN / Şifresi</Text>
            <TextInput
              style={styles.fieldInput}
              value={inspectorPin}
              onChangeText={setInspectorPin}
              placeholder="••••"
              placeholderTextColor="#636366"
              secureTextEntry
              keyboardType="numeric"
              maxLength={6}
            />

            <TouchableOpacity
              style={[styles.submitPrimaryBtn, { backgroundColor: "#AF52DE" }]}
              onPress={handleSignVize}
              disabled={isSigning}
            >
              {isSigning ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons name="shield-checkmark" size={18} color="#FFFFFF" />
                  <Text style={styles.submitPrimaryBtnText}>e-İmza ile Mühürle ve Vizeyi Tamamla</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

/* ========================================================================== */
/*                             STİLLER                                        */
/* ========================================================================== */
const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: "#0A0F1C",
  },
  topHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.08)",
  },
  hamburgerButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "rgba(255, 255, 255, 0.06)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  headerTitleWrap: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  headerSubtitle: {
    fontSize: 11,
    color: "#8E8E93",
    marginTop: 1,
  },
  headerRightBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(52, 199, 89, 0.12)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
    borderWidth: 1,
    borderColor: "rgba(52, 199, 89, 0.25)",
  },
  headerRightText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#34C759",
  },
  tabsScrollWrapper: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.05)",
  },
  tabsScrollContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  portalTabPill: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    gap: 6,
  },
  portalTabText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#8E8E93",
  },
  portalTabTextActive: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  contentScrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 110,
  },
  portalCardWrapper: {
    gap: 16,
  },
  portalTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  portalIconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  portalCardTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  portalCardDesc: {
    fontSize: 12,
    color: "#8E8E93",
    marginTop: 2,
  },
  cameraBox: {
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    backgroundColor: "rgba(255, 255, 255, 0.03)",
  },
  cameraEmptyBox: {
    height: 180,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  cameraEmptyTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#FFFFFF",
    marginTop: 8,
  },
  cameraEmptyDesc: {
    fontSize: 11,
    color: "#8E8E93",
    textAlign: "center",
    marginTop: 4,
  },
  photoCanvas: {
    height: 220,
    position: "relative",
    backgroundColor: "#161D2B",
  },
  photoBackgroundGrid: {
    ...StyleSheet.absoluteFill,
    alignItems: "center",
    justifyContent: "center",
  },
  drawnMarkerPin: {
    position: "absolute",
    alignItems: "center",
  },
  markerLabelBox: {
    backgroundColor: "rgba(0,0,0,0.75)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 2,
  },
  markerLabelText: {
    color: "#FFFFFF",
    fontSize: 9,
    fontWeight: "700",
  },
  watermarkBadge: {
    position: "absolute",
    bottom: 8,
    left: 8,
    right: 8,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  watermarkText: {
    fontSize: 10,
    color: "#FFFFFF",
    fontWeight: "600",
  },
  formFieldsBox: {
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.06)",
    gap: 10,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#8E8E93",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  fieldInput: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: "#FFFFFF",
    fontSize: 14,
  },
  severityRow: {
    flexDirection: "row",
    gap: 8,
  },
  severityPill: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.03)",
  },
  severityText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#8E8E93",
  },
  submitPrimaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#0A7AFF",
    paddingVertical: 13,
    borderRadius: 12,
    gap: 8,
    marginTop: 6,
  },
  submitPrimaryBtnText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
  subListSection: {
    marginTop: 6,
    gap: 10,
  },
  subListTitle: {
    fontSize: 11,
    fontWeight: "800",
    color: "#636366",
    letterSpacing: 0.8,
  },
  reportRowCard: {
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.06)",
    gap: 4,
  },
  reportRowHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  reportTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#FFFFFF",
    flex: 1,
    marginRight: 8,
  },
  reportLocation: {
    fontSize: 11,
    color: "#8E8E93",
  },
  subTabRow: {
    flexDirection: "row",
    backgroundColor: "rgba(255, 255, 255, 0.04)",
    borderRadius: 12,
    padding: 4,
    gap: 4,
  },
  subTabButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: "center",
    borderRadius: 8,
  },
  subTabButtonActive: {
    backgroundColor: "rgba(255, 255, 255, 0.12)",
  },
  subTabText: {
    fontSize: 12,
    color: "#8E8E93",
    fontWeight: "600",
  },
  subTabTextActive: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  actionBtnOrange: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FF9500",
    paddingVertical: 12,
    borderRadius: 12,
    gap: 6,
  },
  actionBtnText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
  },
  itemCard: {
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.06)",
    padding: 14,
    gap: 6,
  },
  itemHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  itemTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#FFFFFF",
    flex: 1,
    marginRight: 8,
  },
  itemSub: {
    fontSize: 12,
    color: "#8E8E93",
  },
  itemFooterRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 4,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.04)",
    paddingTop: 6,
  },
  itemMeta: {
    fontSize: 12,
    color: "#8E8E93",
  },
  itemAmount: {
    fontSize: 14,
    fontWeight: "800",
    color: "#34C759",
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  infoHelperText: {
    fontSize: 12,
    color: "#8E8E93",
    lineHeight: 16,
  },
  workerRowCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    borderRadius: 12,
    padding: 12,
    gap: 10,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.05)",
  },
  workerAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "rgba(255, 149, 0, 0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  workerName: {
    fontSize: 13,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  workerTrade: {
    fontSize: 11,
    color: "#8E8E93",
  },
  presentToggleBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  presentBtnActive: {
    backgroundColor: "#34C759",
  },
  presentBtnInactive: {
    backgroundColor: "#FF3B30",
  },
  presentToggleText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "800",
  },
  qrPassBox: {
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    padding: 20,
    alignItems: "center",
  },
  qrPassTitle: {
    fontSize: 11,
    fontWeight: "800",
    color: "#8E8E93",
    letterSpacing: 1,
  },
  qrPassPlate: {
    fontSize: 24,
    fontWeight: "900",
    color: "#FFFFFF",
    marginVertical: 4,
  },
  qrFrame: {
    padding: 12,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    borderRadius: 16,
    marginVertical: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.15)",
  },
  qrBadgeRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(52, 199, 89, 0.15)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 6,
  },
  qrBadgeText: {
    color: "#34C759",
    fontSize: 12,
    fontWeight: "800",
  },
  qrMetaInfo: {
    fontSize: 11,
    color: "#8E8E93",
    marginTop: 8,
  },
  mapSectionWrapper: {
    gap: 8,
    marginTop: 6,
  },
  mapContainer: {
    height: 220,
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  customMapMarker: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  routeFooterBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.04)",
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.06)",
  },
  routeDistanceText: {
    fontSize: 13,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  routeTargetText: {
    fontSize: 11,
    color: "#8E8E93",
    marginTop: 2,
  },
  navStartBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#0A7AFF",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 4,
  },
  navStartText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
  },
  metricsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  metricCard: {
    width: (SCREEN_WIDTH - 42) / 2,
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.06)",
  },
  metricCardLabel: {
    fontSize: 11,
    color: "#8E8E93",
    fontWeight: "600",
  },
  metricCardValue: {
    fontSize: 17,
    fontWeight: "800",
    color: "#FFFFFF",
    marginTop: 4,
  },
  vizeButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#AF52DE",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  vizeButtonText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "700",
  },
  signaturePadBox: {
    height: 120,
    borderRadius: 12,
    backgroundColor: "rgba(175, 82, 222, 0.08)",
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderColor: "rgba(175, 82, 222, 0.35)",
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.75)",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  modalContent: {
    backgroundColor: "#121826",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.12)",
    padding: 22,
    gap: 12,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  obsoleteRevisionBanner: {
    backgroundColor: "rgba(255, 59, 48, 0.12)",
    borderWidth: 1,
    borderColor: "rgba(255, 59, 48, 0.4)",
    borderRadius: 14,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  obsoleteRevisionTitle: {
    color: "#FF453A",
    fontSize: 13,
    fontWeight: "800",
  },
  obsoleteRevisionText: {
    color: "#EBEBF5",
    fontSize: 11,
    marginTop: 3,
  },
  qaActionRow: {
    flexDirection: "row",
    gap: 10,
  },
  qaActionButton: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 8,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
  },
  qaActionText: {
    fontSize: 12,
    fontWeight: "700",
  },
});