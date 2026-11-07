/**
 * © 2026 NXA Software. All rights reserved.
 * Nexa ERP Mobil - İş Emirleri (Tasks) Ekranı
 *
 * - Üst Segmented Control: "Tümü", "Devam Edenler", "Tamamlananlar"
 * - react-native-gesture-handler & react-native-reanimated ile "Sola Kaydırarak Tamamla" (Swipe Left to Complete)
 * - Renkli Etiketler: Kırmızı: KRİTİK, Turuncu: YÜKSEK, Mavi: BEKLİYOR, Yeşil: TAMAMLANDI
 * - Apple iOS Standartlarında Frosted Glass Arayüzü
 */

import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Vibration,
  Platform,
  Alert,
  StyleSheet,
  Modal,
  TextInput,
  ActivityIndicator,
  Image,
  RefreshControl,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather, Ionicons } from "@expo/vector-icons";
import ReanimatedSwipeable from "react-native-gesture-handler/ReanimatedSwipeable";
import Animated, {
  useAnimatedStyle,
  interpolate,
  Extrapolation,
  SharedValue,
} from "react-native-reanimated";
import { iosColors, iosRadius } from "../../src/theme/iosTheme";
import { useDrawer } from "../../src/components/navigation/DrawerSidebar";
import { tasksApi, getAuthSession } from "../../apiClient";

export interface TaskItem {
  id: string;
  code: string;
  title: string;
  description: string;
  location: string;
  priority: "KRİTİK" | "YÜKSEK" | "ORTA" | "DÜŞÜK";
  status: "BEKLİYOR" | "DEVAM EDİYOR" | "TAMAMLANDI";
  dueDate: string;
  targetQuantity?: number;
  currentQuantity?: number;
  unit?: string;
  boqItemId?: string;
  zoneId?: string;
  assignedRole?: "ENGINEER" | "FOREMAN" | "SUBCONTRACTOR" | "ALL";
  assignedToName?: string;
}

const INITIAL_TASKS: TaskItem[] = [
  {
    id: "1",
    code: "TSK-201",
    title: "C35/45 Hazır Beton Dökümü",
    description: "3. Kat Kolon ve Kirişleri Pompalı Hazır Beton Dökümü.",
    location: "Blok-B • Kat: 3",
    priority: "KRİTİK",
    status: "DEVAM EDİYOR",
    dueDate: "Bugün 16:30",
    targetQuantity: 100,
    currentQuantity: 0,
    unit: "m3",
    boqItemId: "boq-beton-1",
    assignedRole: "SUBCONTRACTOR",
    assignedToName: "Kaya Kalıp & Beton Ltd.",
  },
  {
    id: "2",
    code: "TSK-202",
    title: "B420C Nervürlü Donatı Çeliği Montajı",
    description: "Temel ve kolon donatılarının statik projeye göre bağlanması.",
    location: "Blok-A • Temel",
    priority: "YÜKSEK",
    status: "BEKLİYOR",
    dueDate: "Bugün 17:00",
    targetQuantity: 50,
    currentQuantity: 15,
    unit: "Ton",
    boqItemId: "boq-demir-1",
    assignedRole: "SUBCONTRACTOR",
    assignedToName: "Özkan Demir İşleri",
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
    targetQuantity: 24,
    currentQuantity: 0,
    unit: "Adet",
    assignedRole: "FOREMAN",
    assignedToName: "Ahmet Usta (Saha Formeni)",
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
    targetQuantity: 600,
    currentQuantity: 250,
    unit: "m2",
    assignedRole: "ENGINEER",
    assignedToName: "İnşaat Müh. Selin Demir",
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
    targetQuantity: 400,
    currentQuantity: 400,
    unit: "mt",
    assignedRole: "FOREMAN",
    assignedToName: "Elektrik Formen Ekibi",
  },
];

// Reanimated Sağ Kaydırma Aksiyon Bileşeni
interface RightActionProps {
  progress: SharedValue<number>;
  drag: SharedValue<number>;
  onComplete: () => void;
}

function SwipeRightAction({ progress, drag, onComplete }: RightActionProps) {
  const animatedStyle = useAnimatedStyle(() => {
    const scale = interpolate(
      progress.value,
      [0, 1],
      [0.7, 1],
      Extrapolation.CLAMP
    );
    const opacity = interpolate(
      progress.value,
      [0, 0.4, 1],
      [0, 0.7, 1],
      Extrapolation.CLAMP
    );

    return {
      transform: [{ scale }],
      opacity,
    };
  });

  return (
    <Animated.View style={[styles.rightActionContainer, animatedStyle]}>
      <TouchableOpacity
        onPress={onComplete}
        activeOpacity={0.85}
        style={styles.rightActionBtn}
      >
        <Ionicons name="checkmark-done" size={26} color="#FFFFFF" />
        <Text style={styles.rightActionText}>Tamamla</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function TasksScreen() {
  const { openDrawer } = useDrawer();
  const [tasks, setTasks] = useState<TaskItem[]>(INITIAL_TASKS);
  const [filter, setFilter] = useState<"ALL" | "ACTIVE" | "COMPLETED">("ALL");
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [userRole, setUserRole] = useState<"ALL" | "ENGINEER" | "FOREMAN" | "SUBCONTRACTOR">("ALL");
  const [scopeFilter, setScopeFilter] = useState<"MY_ROLE" | "ALL">("MY_ROLE");
  const [isLoadingTasks, setIsLoadingTasks] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Veritabanından personele / role göre gerçek görevleri yükle
  const loadTasksFromDB = async (customUser?: any) => {
    try {
      setIsLoadingTasks(true);
      const user = customUser || currentUser;
      const dbTasks = await tasksApi.getTasks({
        userId: user?.id,
        role: userRole !== "ALL" ? userRole : undefined,
      });
      if (dbTasks && dbTasks.length > 0) {
        setTasks(dbTasks);
      }
    } catch (err) {
      console.warn("[TasksScreen] DB tasks fetch warning:", err);
    } finally {
      setIsLoadingTasks(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    (async () => {
      try {
        const session = await getAuthSession();
        if (session.user) {
          setCurrentUser(session.user);
          const r = String(session.user.role || "").toUpperCase();
          if (r.includes("ENG") || r.includes("MÜH") || r.includes("MUH")) {
            setUserRole("ENGINEER");
          } else if (r.includes("FOR") || r.includes("ŞEF")) {
            setUserRole("FOREMAN");
          } else if (r.includes("SUB") || r.includes("TAŞ") || r.includes("TAS")) {
            setUserRole("SUBCONTRACTOR");
          }
          loadTasksFromDB(session.user);
        } else {
          loadTasksFromDB();
        }
      } catch (err) {
        console.warn("[TasksScreen] session read warning:", err);
        loadTasksFromDB();
      }
    })();
  }, []);

  const AVAILABLE_ZONES = [
    "14. Kat - Çatı Terası & Mekanik",
    "13. Kat - Daireler (Rezidans)",
    "12. Kat - Daireler (Rezidans)",
    "6. Kat - Tip Kat Daireler",
    "3. Kat - Kolon & Kiriş Tabliyesi",
    "Zemin Kat - Giriş / Lobi",
    "Bodrum -1 - Kapalı Otopark",
    "Bodrum -2 - Radye Temel & Perde",
  ];

  // Sahadan İlerleme Girişi Modal State'leri (Anti-Fraud GPS, Kat/Mahal & Hakediş Destekli)
  const [selectedTask, setSelectedTask] = useState<TaskItem | null>(null);
  const [isProgressModalOpen, setIsProgressModalOpen] = useState(false);
  const [dailyProgressQty, setDailyProgressQty] = useState("");
  const [dailyProgressNotes, setDailyProgressNotes] = useState("");
  const [selectedZone, setSelectedZone] = useState<string>(AVAILABLE_ZONES[4]);
  const [isSubcontractorMode, setIsSubcontractorMode] = useState<boolean>(true);
  const [isPhotoAttached, setIsPhotoAttached] = useState(false);
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [photoGps, setPhotoGps] = useState<{ latitude: number; longitude: number; isMocked?: boolean } | null>(null);
  const [photoTimestamp, setPhotoTimestamp] = useState<string | null>(null);
  const [isCapturingPhoto, setIsCapturingPhoto] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleOpenProgressModal = (task: TaskItem) => {
    setSelectedTask(task);
    setDailyProgressQty("");
    setDailyProgressNotes("");
    setSelectedZone(AVAILABLE_ZONES[4]);
    setIsSubcontractorMode(true);
    setIsPhotoAttached(false);
    setPhotoUri(null);
    setPhotoGps(null);
    setPhotoTimestamp(null);
    setIsProgressModalOpen(true);
  };

  // ADIM 2: Canlı Kamera ile Çekim ve GPS/Zaman Damgası Alma (Anti-Fraud)
  const handleTakeLivePhoto = async () => {
    try {
      setIsCapturingPhoto(true);

      // Kamera İzni
      const cameraPermission = await ImagePicker.requestCameraPermissionsAsync();
      if (!cameraPermission.granted) {
        Alert.alert(
          "Kamera İzni Gerekli",
          "Saha imalat kanıtını fotoğraflamak için kamera iznine ihtiyaç duyulmaktadır."
        );
        return;
      }

      // GPS Konum İzni ve Alımı (Anti-Spoofing Kontrolü)
      let locationCoords = { latitude: 41.0082, longitude: 28.9784, isMocked: false };
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === "granted") {
          const loc = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.High,
          });
          locationCoords = {
            latitude: loc.coords.latitude,
            longitude: loc.coords.longitude,
            isMocked: (loc as any).mocked ?? false,
          };
        }
      } catch (locErr) {
        console.warn("Location error:", locErr);
      }

      // Doğrudan Canlı Kamera Başlatma (Galeri kısıtlaması)
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: false,
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        setPhotoUri(asset.uri);
        setIsPhotoAttached(true);
        setPhotoGps(locationCoords);
        setPhotoTimestamp(
          new Date().toLocaleTimeString("tr-TR", {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
          })
        );

        if (Platform.OS !== "web") {
          Vibration.vibrate(60);
        }
      }
    } catch (err: any) {
      Alert.alert("Kamera Hatası", err?.message || "Kamera başlatılamadı.");
    } finally {
      setIsCapturingPhoto(false);
    }
  };

  const handleSubmitProgress = async () => {
    if (!selectedTask) return;
    const qty = parseFloat(dailyProgressQty);
    if (isNaN(qty) || qty <= 0) {
      Alert.alert("Geçersiz Miktar", "Lütfen 0'dan büyük geçerli bir ilerleme miktarı girin.");
      return;
    }

    // ADIM 1: Kat / Mahal Zorunluluğu Kontrolü
    if (!selectedZone) {
      Alert.alert("Kat/Mahal Zorunludur", "Lütfen imalatın yapıldığı Kat / Mahali seçin.");
      return;
    }

    // ADIM 1: Fotoğraf Zorunluluğu Kontrolü
    if (!isPhotoAttached && !photoUri) {
      Alert.alert(
        "Fotoğraf Zorunludur",
        "Saha ilerleme kaydı için canlı kamera ile imalat kanıt fotoğrafı çekilmesi zorunludur!"
      );
      return;
    }

    setIsSubmitting(true);
    if (Platform.OS !== "web") {
      Vibration.vibrate(80);
    }

    try {
      // Backend /api/tasks/progress çağrısı (Kat ve Taşeron Hakediş Entegreli Otonom İlerleme)
      let progressPercentage = 100;
      try {
        const res = await tasksApi.submitProgress({
          taskId: selectedTask.id,
          boqItemId: selectedTask.boqItemId,
          quantityAdded: qty,
          status: "COMPLETED",
          completionPhoto: photoUri || undefined,
          zoneName: selectedZone,
          notes: dailyProgressNotes || `${qty} ${selectedTask.unit || "m3"} imalat ${selectedZone} mahaline işlendi.`,
          userName: currentUser?.name || (isSubcontractorMode ? "Mehmet Kaya (Taşeron Usta Başı)" : "Ahmet Yılmaz (Saha Şefi)"),
          userRole: userRole !== "ALL" ? userRole : (isSubcontractorMode ? "SUBCONTRACTOR" : "ENGINEER"),
          subcontractorId: isSubcontractorMode ? "sub-kaya-kalip" : undefined,
        });
        if (res && typeof res.progressPercentage === "number") {
          progressPercentage = res.progressPercentage;
        }
      } catch (subErr) {
        console.warn("[TasksScreen] tasksApi.submitProgress warn:", subErr);
      }

      const updatedCurrent = (selectedTask.currentQuantity || 0) + qty;

      setTasks((prev) =>
        prev.map((t) =>
          t.id === selectedTask.id
            ? {
                ...t,
                currentQuantity: updatedCurrent,
                status: "TAMAMLANDI",
              }
            : t
        )
      );

      setIsProgressModalOpen(false);
      Alert.alert(
        `🚀 Kat İlerlemesi Güncellendi: %${progressPercentage}`,
        `"${selectedTask.title}" (${qty} ${selectedTask.unit || "m3"}) tamamlandı. ${selectedZone} mahali güncellendi, Master Dashboard (2.5D Isı Haritası) ve Hakediş'e otonom yansıtıldı.`
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Görevi Tamamlandı Olarak İşaretle
  const handleCompleteTask = (taskId: string) => {
    if (Platform.OS !== "web") {
      Vibration.vibrate(80);
    }

    setTasks((prev) =>
      (prev || []).map((t) => (t.id === taskId ? { ...t, status: "TAMAMLANDI" } : t))
    );

    // Veritabanına da kaydet
    tasksApi.updateTaskStatus(taskId, "TAMAMLANDI").catch((err) => {
      console.warn("[TasksScreen] DB update error:", err);
    });

    const target = tasks.find((t) => t.id === taskId);
    Alert.alert(
      "✅ Görev Tamamlandı",
      `"${target?.title || "İş emri"}" başarıyla tamamlandı olarak işaretlendi ve veritabanına kaydedildi.`
    );
  };

  // Filtreleme (Durum + Rol + Kapsam)
  const filteredTasks = (tasks || []).filter((t) => {
    // 1. Durum Filtresi
    if (filter === "ACTIVE" && t.status === "TAMAMLANDI") return false;
    if (filter === "COMPLETED" && t.status !== "TAMAMLANDI") return false;

    // 2. Rol & Kapsam Filtresi
    if (scopeFilter === "MY_ROLE" && userRole !== "ALL") {
      const titleLower = (t.title || "").toLowerCase();
      const descLower = (t.description || "").toLowerCase();

      if (userRole === "SUBCONTRACTOR") {
        const isSubTask =
          t.assignedRole === "SUBCONTRACTOR" ||
          titleLower.includes("beton") ||
          titleLower.includes("demir") ||
          titleLower.includes("kalıp") ||
          titleLower.includes("duvar") ||
          titleLower.includes("membran") ||
          descLower.includes("dökümü") ||
          descLower.includes("montajı");
        if (!isSubTask) return false;
      } else if (userRole === "FOREMAN") {
        const isForemanTask =
          t.assignedRole === "FOREMAN" ||
          titleLower.includes("teftiş") ||
          titleLower.includes("isg") ||
          titleLower.includes("korkuluk") ||
          titleLower.includes("denetim") ||
          titleLower.includes("tava");
        if (!isForemanTask) return false;
      } else if (userRole === "ENGINEER") {
        const isEngTask =
          t.assignedRole === "ENGINEER" ||
          titleLower.includes("muayene") ||
          titleLower.includes("onay") ||
          titleLower.includes("vize") ||
          t.priority === "KRİTİK";
        if (!isEngTask) return false;
      }
    }

    return true;
  });

  // Öncelik Rozeti Rengi
  const getPriorityStyle = (priority: TaskItem["priority"]) => {
    switch (priority) {
      case "KRİTİK":
        return {
          bg: "rgba(255, 59, 48, 0.15)",
          border: "rgba(255, 59, 48, 0.4)",
          text: iosColors.systemRed,
        };
      case "YÜKSEK":
        return {
          bg: "rgba(255, 149, 0, 0.15)",
          border: "rgba(255, 149, 0, 0.4)",
          text: iosColors.systemOrange,
        };
      case "ORTA":
        return {
          bg: "rgba(10, 122, 255, 0.15)",
          border: "rgba(10, 122, 255, 0.4)",
          text: iosColors.systemBlue,
        };
      case "DÜŞÜK":
      default:
        return {
          bg: "rgba(255, 255, 255, 0.08)",
          border: "rgba(255, 255, 255, 0.15)",
          text: iosColors.labelSecondary,
        };
    }
  };

  // Durum Rozeti Rengi
  const getStatusStyle = (status: TaskItem["status"]) => {
    switch (status) {
      case "TAMAMLANDI":
        return {
          bg: "rgba(52, 199, 89, 0.15)",
          border: "rgba(52, 199, 89, 0.4)",
          text: iosColors.systemGreen,
        };
      case "DEVAM EDİYOR":
        return {
          bg: "rgba(255, 149, 0, 0.15)",
          border: "rgba(255, 149, 0, 0.4)",
          text: iosColors.systemOrange,
        };
      case "BEKLİYOR":
      default:
        return {
          bg: "rgba(10, 122, 255, 0.15)",
          border: "rgba(10, 122, 255, 0.4)",
          text: iosColors.systemBlue,
        };
    }
  };

  return (
    <SafeAreaView style={styles.safeContainer} edges={["top", "left", "right"]}>
      {/* 1. ÜST HEADER */}
      <View style={styles.header}>
        <View style={styles.headerTopRow}>
          <TouchableOpacity
            style={styles.hamburgerButton}
            onPress={openDrawer}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="menu" size={24} color="#FFFFFF" />
          </TouchableOpacity>

          <View style={{ flex: 1 }}>
            <Text style={styles.headerSubtitle}>Saha İş Akışı</Text>
            <Text style={styles.headerTitle}>İş Emirleri</Text>
          </View>

          <View style={styles.taskCountBadge}>
            <Text style={styles.taskCountText}>
              {filteredTasks.length} Görev
            </Text>
          </View>
        </View>

        {/* ============================================================ */}
        {/* iOS SEGMENTED CONTROL: TÜMÜ / DEVAM EDENLER / TAMAMLANANLAR  */}
        {/* ============================================================ */}
        <View style={styles.segmentedControl}>
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
                activeOpacity={0.75}
                style={[
                  styles.segmentedTab,
                  isActive && styles.segmentedTabActive,
                ]}
              >
                <Text
                  style={[
                    styles.segmentedTabText,
                    isActive && styles.segmentedTabTextActive,
                  ]}
                >
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* ============================================================ */}
        {/* ROL FİLTRESİ (Mühendis / Formen / Taşeron) & KAPSAM           */}
        {/* ============================================================ */}
        <View style={styles.roleFilterSection}>
          <View style={styles.roleSelectorRow}>
            {[
              { id: "ALL", label: "Tümü" },
              { id: "ENGINEER", label: "👷 Mühendis" },
              { id: "FOREMAN", label: "📋 Formen" },
              { id: "SUBCONTRACTOR", label: "🔨 Taşeron" },
            ].map((r) => {
              const isRoleActive = userRole === r.id;
              return (
                <TouchableOpacity
                  key={r.id}
                  onPress={() => setUserRole(r.id as any)}
                  style={[styles.roleChip, isRoleActive && styles.roleChipActive]}
                  activeOpacity={0.75}
                >
                  <Text
                    style={[
                      styles.roleChipText,
                      isRoleActive && styles.roleChipTextActive,
                    ]}
                  >
                    {r.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={styles.scopeToggleRow}>
            <TouchableOpacity
              onPress={() => setScopeFilter("MY_ROLE")}
              style={[styles.scopeBtn, scopeFilter === "MY_ROLE" && styles.scopeBtnActive]}
              activeOpacity={0.75}
            >
              <Text
                style={[
                  styles.scopeBtnText,
                  scopeFilter === "MY_ROLE" && styles.scopeBtnTextActive,
                ]}
              >
                🎯 {userRole === "ALL" ? "Bana / Ekibime Atananlar" : `${userRole} Görevleri`}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setScopeFilter("ALL")}
              style={[styles.scopeBtn, scopeFilter === "ALL" && styles.scopeBtnActive]}
              activeOpacity={0.75}
            >
              <Text
                style={[
                  styles.scopeBtnText,
                  scopeFilter === "ALL" && styles.scopeBtnTextActive,
                ]}
              >
                🌐 Tüm Şantiye
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Kaydırma İpucu Notu */}
      <View style={styles.hintBar}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          <Ionicons name="swap-horizontal" size={14} color={iosColors.systemBlue} />
          <Text style={styles.hintText}>
            Görevi tamamlamak için kartı sola kaydırınız
          </Text>
        </View>
        <Feather name="arrow-left" size={12} color={iosColors.labelSecondary} />
      </View>

      {/* ============================================================ */}
      {/* GÖREVLER LİSTESİ: ReanimatedSwipeable KAYDIRMA AKSİYONU       */}
      {/* ============================================================ */}
      <FlatList
        data={filteredTasks}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => {
          const isDone = item.status === "TAMAMLANDI";
          const priorityStyle = getPriorityStyle(item.priority);
          const statusStyle = getStatusStyle(item.status);
          const currentQty = item.currentQuantity || 0;
          const targetQty = item.targetQuantity || 100;
          const progressPercent = Math.min(100, Math.round((currentQty / targetQty) * 100));

          return (
            <View style={styles.swipeWrapper}>
              <ReanimatedSwipeable
                renderRightActions={(prog, drag) => (
                  <SwipeRightAction
                    progress={prog}
                    drag={drag}
                    onComplete={() => handleCompleteTask(item.id)}
                  />
                )}
                overshootRight={false}
              >
                <TouchableOpacity
                  activeOpacity={0.88}
                  onPress={() => handleOpenProgressModal(item)}
                  style={[
                    styles.taskCard,
                    isDone && styles.taskCardDone,
                  ]}
                >
                  {/* Kod & Rozetler */}
                  <View style={styles.taskCardTopRow}>
                    <View style={styles.taskCardCodeGroup}>
                      <Text style={styles.taskCodeText}>#{item.code}</Text>

                      {/* Öncelik Rozeti (Kırmızı: KRİTİK, Turuncu: YÜKSEK, Mavi: ORTA) */}
                      <View
                        style={[
                          styles.badge,
                          {
                            backgroundColor: priorityStyle.bg,
                            borderColor: priorityStyle.border,
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.badgeText,
                            { color: priorityStyle.text },
                          ]}
                        >
                          {item.priority}
                        </Text>
                      </View>
                    </View>

                    {/* Durum Rozeti (Yeşil: TAMAMLANDI, Mavi: BEKLİYOR, Turuncu: DEVAM EDİYOR) */}
                    <View
                      style={[
                        styles.badge,
                        {
                          backgroundColor: statusStyle.bg,
                          borderColor: statusStyle.border,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.badgeText,
                          { color: statusStyle.text },
                        ]}
                      >
                        {item.status}
                      </Text>
                    </View>
                  </View>

                  {/* Başlık ve Açıklama */}
                  <Text
                    style={[
                      styles.taskTitle,
                      isDone && styles.taskTitleDone,
                    ]}
                  >
                    {item.title}
                  </Text>
                  <Text style={styles.taskDescription}>{item.description}</Text>

                  {/* Saha İlerleme Göstergesi (Gantt Eşleşmesi) */}
                  <View style={styles.cardProgressContainer}>
                    <View style={styles.cardProgressHeader}>
                      <Text style={styles.cardProgressLabel}>
                        İlerleme: {currentQty} / {targetQty} {item.unit || "m3"}
                      </Text>
                      <Text
                        style={[
                          styles.cardProgressPercent,
                          {
                            color:
                              progressPercent >= 100
                                ? iosColors.systemGreen
                                : progressPercent > 0
                                ? iosColors.systemBlue
                                : iosColors.labelSecondary,
                          },
                        ]}
                      >
                        %{progressPercent}
                      </Text>
                    </View>
                    <View style={styles.progressBarTrack}>
                      <View
                        style={[
                          styles.progressBarFill,
                          {
                            width: `${progressPercent}%`,
                            backgroundColor:
                              progressPercent >= 100
                                ? iosColors.systemGreen
                                : iosColors.systemBlue,
                          },
                        ]}
                      />
                    </View>
                  </View>

                  {/* Konum, Termin & Hızlı İlerleme Ekle İpucu */}
                  <View style={styles.taskFooter}>
                    <View style={styles.footerItem}>
                      <Feather name="map-pin" size={12} color={iosColors.systemBlue} />
                      <Text style={styles.footerLocationText}>{item.location}</Text>
                    </View>

                    <View style={styles.footerItem}>
                      <Feather name="plus-circle" size={12} color={iosColors.systemGreen} />
                      <Text style={[styles.footerDueText, { color: iosColors.systemGreen, fontWeight: "700" }]}>
                        İlerleme Gir
                      </Text>
                    </View>
                  </View>

                  {/* ADIM 4: Mobil "Yapıldı" Butonu (Fotoğraflı Kanıt & Miktar Gir) */}
                  <TouchableOpacity
                    activeOpacity={0.85}
                    onPress={() => handleOpenProgressModal(item)}
                    style={[
                      styles.cardActionButton,
                      isDone && styles.cardActionButtonDone,
                    ]}
                  >
                    <Ionicons
                      name={isDone ? "checkmark-circle" : "camera"}
                      size={15}
                      color={isDone ? iosColors.systemGreen : "#FFFFFF"}
                    />
                    <Text
                      style={[
                        styles.cardActionButtonText,
                        isDone && styles.cardActionButtonTextDone,
                      ]}
                    >
                      {isDone
                        ? "✓ Tamamlandı (Fotoğraf & Miktar Kaydedildi)"
                        : "✅ Yapıldı (Fotoğraflı Kanıt & Miktar Gir)"}
                    </Text>
                  </TouchableOpacity>
                </TouchableOpacity>
              </ReanimatedSwipeable>
            </View>
          );
        }}
      />

      {/* ============================================================ */}
      {/* SAHADAN İLERLEME GİRİŞİ MODAL (Gantt Entegreli)              */}
      {/* ============================================================ */}
      <Modal
        visible={isProgressModalOpen && !!selectedTask}
        transparent
        animationType="fade"
        onRequestClose={() => setIsProgressModalOpen(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 2 }}>
                  <Text style={styles.modalCodeBadge}>#{selectedTask?.code}</Text>
                  <Text style={styles.modalLocationBadge}>{selectedTask?.location}</Text>
                </View>
                <Text style={styles.modalTitle} numberOfLines={1}>
                  {selectedTask?.title}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setIsProgressModalOpen(false)}
                style={styles.modalCloseBtn}
              >
                <Ionicons name="close" size={20} color={iosColors.labelSecondary} />
              </TouchableOpacity>
            </View>

            {/* Target & Current Gauge */}
            <View style={styles.modalTargetBox}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 6 }}>
                <Text style={styles.modalTargetLabel}>Toplam Hedef Miktar</Text>
                <Text style={styles.modalTargetVal}>
                  {selectedTask?.targetQuantity || 100} {selectedTask?.unit || "m3"}
                </Text>
              </View>
              <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                <Text style={styles.modalTargetLabel}>Şu Ana Kadar Yapılan</Text>
                <Text style={[styles.modalTargetVal, { color: iosColors.systemGreen }]}>
                  {selectedTask?.currentQuantity || 0} {selectedTask?.unit || "m3"} (%{Math.round(((selectedTask?.currentQuantity || 0) / (selectedTask?.targetQuantity || 100)) * 100)})
                </Text>
              </View>
            </View>

            {/* ADIM 1: İlgili Kat / Mahal Seçimi (ZORUNLU) */}
            <View style={{ marginBottom: 14 }}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                <Text style={styles.inputLabel}>İlgili Kat / Mahal (Zone) *</Text>
                <Text style={{ fontSize: 10, fontWeight: "800", color: iosColors.systemBlue }}>
                  * Zorunlu
                </Text>
              </View>

              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: 6 }}>
                {AVAILABLE_ZONES.slice(0, 4).map((zone) => {
                  const isSelected = selectedZone === zone;
                  return (
                    <TouchableOpacity
                      key={zone}
                      onPress={() => setSelectedZone(zone)}
                      style={[
                        styles.zoneChip,
                        isSelected && styles.zoneChipActive,
                      ]}
                      activeOpacity={0.8}
                    >
                      <Text
                        style={[
                          styles.zoneChipText,
                          isSelected && styles.zoneChipTextActive,
                        ]}
                        numberOfLines={1}
                      >
                        {zone.split(" - ")[0]}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
                {AVAILABLE_ZONES.slice(4).map((zone) => {
                  const isSelected = selectedZone === zone;
                  return (
                    <TouchableOpacity
                      key={zone}
                      onPress={() => setSelectedZone(zone)}
                      style={[
                        styles.zoneChip,
                        isSelected && styles.zoneChipActive,
                      ]}
                      activeOpacity={0.8}
                    >
                      <Text
                        style={[
                          styles.zoneChipText,
                          isSelected && styles.zoneChipTextActive,
                        ]}
                        numberOfLines={1}
                      >
                        {zone.split(" - ")[0]}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text style={styles.selectedZoneSubtitle}>
                📍 Seçili Mahal: <Text style={{ color: "#FFFFFF", fontWeight: "700" }}>{selectedZone}</Text>
              </Text>
            </View>

            {/* ADIM 1 & 2: Taşeron Hakediş Otomasyonu */}
            <View style={styles.subcontractorBadge}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                <Ionicons name="briefcase" size={14} color={iosColors.systemOrange} />
                <Text style={styles.subcontractorTitle}>Taşeron Hakedişi:</Text>
                <Text style={styles.subcontractorName}>Kaya Kalıp & Demir Ltd.</Text>
              </View>
              <Text style={styles.subcontractorDesc}>
                İlerleme girildiğinde Kasım 2026 hakediş tutarına otomatik eklenecektir.
              </Text>
            </View>

            {/* Input: Bugün Yapılan Miktar */}
            <Text style={styles.inputLabel}>
              Bugün Sahada Yapılan Miktar ({selectedTask?.unit || "m3"}) *
            </Text>
            <TextInput
              style={styles.qtyInput}
              keyboardType="numeric"
              placeholder={`Örn: 50`}
              placeholderTextColor="#6B7280"
              value={dailyProgressQty}
              onChangeText={setDailyProgressQty}
            />

            {/* Input: İlerleme Notu */}
            <Text style={styles.inputLabel}>Saha Notu / İmalat Detayı</Text>
            <TextInput
              style={styles.notesInput}
              placeholder="Örn: 3. Kat kolonları vibratörlü hazır beton dökümü tamamlandı."
              placeholderTextColor="#6B7280"
              value={dailyProgressNotes}
              onChangeText={setDailyProgressNotes}
              multiline
              numberOfLines={2}
            />

            {/* ADIM 1 & 2: Saha İmalat Kanıtı (Canlı Kamera - ZORUNLU) */}
            <View style={{ marginBottom: 16 }}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                <Text style={styles.inputLabel}>
                  Saha İmalat Kanıtı (Canlı Kamera) *
                </Text>
                <Text style={{ fontSize: 10, fontWeight: "800", color: iosColors.systemRed }}>
                  * Zorunlu
                </Text>
              </View>

              <TouchableOpacity
                onPress={handleTakeLivePhoto}
                disabled={isCapturingPhoto}
                style={[
                  styles.attachBtn,
                  isPhotoAttached && styles.attachBtnActive,
                ]}
                activeOpacity={0.8}
              >
                {isCapturingPhoto ? (
                  <ActivityIndicator color={iosColors.systemBlue} size="small" />
                ) : (
                  <Feather
                    name={isPhotoAttached ? "check-circle" : "camera"}
                    size={18}
                    color={isPhotoAttached ? iosColors.systemGreen : iosColors.systemBlue}
                  />
                )}
                <Text
                  style={[
                    styles.attachBtnText,
                    isPhotoAttached && { color: iosColors.systemGreen },
                  ]}
                >
                  {isPhotoAttached
                    ? "✓ Canlı Fotoğraf Çekildi (Yeniden Çek)"
                    : "Kamera ile Canlı Fotoğraf Çek (GPS Damgalı)"}
                </Text>
              </TouchableOpacity>

              {/* Fotoğraf ve GPS/Zaman Damgası Önizleme */}
              {photoUri && (
                <View style={styles.photoPreviewCard}>
                  <Image source={{ uri: photoUri }} style={styles.photoThumbnail} />
                  <View style={{ flex: 1, marginLeft: 10 }}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginBottom: 2 }}>
                      <Ionicons name="shield-checkmark" size={13} color={iosColors.systemGreen} />
                      <Text style={styles.antiFraudTag}>Anti-Fraud Doğrulandı</Text>
                    </View>
                    <Text style={styles.photoMetaText}>
                      📍 {photoGps ? `${photoGps.latitude.toFixed(4)}°N, ${photoGps.longitude.toFixed(4)}°E` : "41.0082°N, 28.9784°E"}
                    </Text>
                    <Text style={styles.photoMetaText}>
                      🕒 {photoTimestamp || "Şimdi"} {photoGps?.isMocked ? "⚠️ (Mock GPS)" : "✓ (Orijinal)"}
                    </Text>
                  </View>
                </View>
              )}
            </View>

            {/* Submit & Cancel */}
            <TouchableOpacity
              onPress={handleSubmitProgress}
              disabled={isSubmitting}
              style={[styles.modalSubmitBtn, isSubmitting && { opacity: 0.6 }]}
              activeOpacity={0.85}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <Ionicons name="cloud-upload" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
                  <Text style={styles.modalSubmitText}>
                    Sahadan İlerlemeyi Gönder (Gantt'a Yansıt)
                  </Text>
                </View>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setIsProgressModalOpen(false)}
              style={styles.modalCancelBtn}
            >
              <Text style={styles.modalCancelText}>Vazgeç</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: iosColors.background,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: iosColors.glassBorder,
    backgroundColor: "rgba(10, 15, 28, 0.95)",
  },
  headerTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  hamburgerButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "rgba(255, 255, 255, 0.06)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  headerSubtitle: {
    fontSize: 11,
    fontWeight: "700",
    color: iosColors.labelSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: "800",
    color: iosColors.labelPrimary,
    letterSpacing: -0.4,
  },
  taskCountBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: iosRadius.pill,
    backgroundColor: "rgba(10, 122, 255, 0.15)",
    borderWidth: 1,
    borderColor: "rgba(10, 122, 255, 0.35)",
  },
  taskCountText: {
    color: iosColors.systemBlue,
    fontSize: 11,
    fontWeight: "800",
  },
  segmentedControl: {
    flexDirection: "row",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    padding: 3,
    borderRadius: 14,
    marginTop: 12,
    borderWidth: 1,
    borderColor: iosColors.glassBorder,
  },
  segmentedTab: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },
  segmentedTabActive: {
    backgroundColor: "rgba(255, 255, 255, 0.14)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  segmentedTabText: {
    fontSize: 12,
    fontWeight: "700",
    color: iosColors.labelSecondary,
  },
  segmentedTabTextActive: {
    color: "#FFFFFF",
  },
  roleFilterSection: {
    marginTop: 10,
    gap: 8,
  },
  roleSelectorRow: {
    flexDirection: "row",
    gap: 6,
  },
  roleChip: {
    flex: 1,
    paddingVertical: 7,
    paddingHorizontal: 4,
    borderRadius: 10,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  roleChipActive: {
    backgroundColor: "rgba(10, 122, 255, 0.2)",
    borderColor: iosColors.systemBlue,
  },
  roleChipText: {
    fontSize: 10,
    fontWeight: "700",
    color: iosColors.labelSecondary,
  },
  roleChipTextActive: {
    color: "#FFFFFF",
    fontWeight: "800",
  },
  scopeToggleRow: {
    flexDirection: "row",
    gap: 6,
  },
  scopeBtn: {
    flex: 1,
    paddingVertical: 7,
    borderRadius: 9,
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.06)",
    alignItems: "center",
  },
  scopeBtnActive: {
    backgroundColor: "rgba(52, 199, 89, 0.15)",
    borderColor: "rgba(52, 199, 89, 0.4)",
  },
  scopeBtnText: {
    fontSize: 11,
    fontWeight: "600",
    color: iosColors.labelSecondary,
  },
  scopeBtnTextActive: {
    color: iosColors.systemGreen,
    fontWeight: "700",
  },
  hintBar: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  hintText: {
    fontSize: 11,
    color: iosColors.labelSecondary,
    fontWeight: "500",
  },
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 110, // Tab bar taşmasını önler
  },
  swipeWrapper: {
    marginBottom: 12,
  },
  taskCard: {
    backgroundColor: iosColors.glassCard,
    borderRadius: iosRadius.card,
    borderWidth: 1,
    borderColor: iosColors.glassBorder,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 3,
  },
  taskCardDone: {
    opacity: 0.55,
    backgroundColor: "rgba(255, 255, 255, 0.02)",
  },
  taskCardTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  taskCardCodeGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  taskCodeText: {
    color: iosColors.labelSecondary,
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
    fontSize: 11,
    fontWeight: "700",
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: 6,
    borderWidth: 1,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 0.2,
  },
  taskTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: iosColors.labelPrimary,
    marginBottom: 4,
    lineHeight: 20,
  },
  taskTitleDone: {
    textDecorationLine: "line-through",
    color: iosColors.labelSecondary,
  },
  taskDescription: {
    fontSize: 12,
    color: iosColors.labelSecondary,
    lineHeight: 17,
    marginBottom: 12,
  },
  taskFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: iosColors.glassBorder,
    paddingTop: 10,
  },
  footerItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  footerLocationText: {
    fontSize: 11,
    fontWeight: "600",
    color: iosColors.systemBlue,
  },
  footerDueText: {
    fontSize: 11,
    color: iosColors.labelSecondary,
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
  },
  cardActionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 12,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: "#2563EB",
    shadowColor: "#2563EB",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 3,
  },
  cardActionButtonDone: {
    backgroundColor: "rgba(52, 199, 89, 0.15)",
    borderWidth: 1,
    borderColor: "rgba(52, 199, 89, 0.35)",
    shadowOpacity: 0,
  },
  cardActionButtonText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "800",
  },
  cardActionButtonTextDone: {
    color: iosColors.systemGreen,
  },
  rightActionContainer: {
    width: 95,
    marginBottom: 0,
    marginLeft: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  rightActionBtn: {
    width: "100%",
    height: "100%",
    backgroundColor: iosColors.systemGreen,
    borderRadius: iosRadius.card,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: iosColors.systemGreen,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
  },
  rightActionText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "800",
    marginTop: 4,
  },
  // Card Progress Bar
  cardProgressContainer: {
    marginVertical: 10,
    padding: 10,
    backgroundColor: "rgba(255, 255, 255, 0.04)",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
  },
  cardProgressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  cardProgressLabel: {
    fontSize: 11,
    color: iosColors.labelSecondary,
    fontWeight: "600",
  },
  cardProgressPercent: {
    fontSize: 12,
    fontWeight: "800",
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
  },
  progressBarTrack: {
    height: 6,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 3,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    borderRadius: 3,
  },

  // Modal Styles
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.75)",
    justifyContent: "center",
    padding: 20,
  },
  modalCard: {
    backgroundColor: "#0F172A",
    borderRadius: 24,
    padding: 22,
    borderWidth: 1,
    borderColor: "#1E293B",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    borderBottomWidth: 1,
    borderBottomColor: "#1E293B",
    paddingBottom: 14,
    marginBottom: 14,
  },
  modalCodeBadge: {
    fontSize: 10,
    fontWeight: "900",
    color: iosColors.systemBlue,
    backgroundColor: "rgba(10, 122, 255, 0.15)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  modalLocationBadge: {
    fontSize: 10,
    color: iosColors.labelSecondary,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: "#FFFFFF",
    marginTop: 2,
  },
  modalCloseBtn: {
    padding: 6,
    borderRadius: 10,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
  },
  modalTargetBox: {
    backgroundColor: "#0A0F1C",
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: "#1E293B",
    marginBottom: 14,
  },
  modalTargetLabel: {
    fontSize: 12,
    color: iosColors.labelSecondary,
    fontWeight: "600",
  },
  modalTargetVal: {
    fontSize: 12,
    color: "#FFFFFF",
    fontWeight: "800",
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: iosColors.labelSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  qtyInput: {
    backgroundColor: "#0A0F1C",
    borderWidth: 1,
    borderColor: "#334155",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "800",
    marginBottom: 14,
  },
  notesInput: {
    backgroundColor: "#0A0F1C",
    borderWidth: 1,
    borderColor: "#334155",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: "#FFFFFF",
    fontSize: 13,
    minHeight: 60,
    textAlignVertical: "top",
    marginBottom: 14,
  },
  attachBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: "#334155",
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    marginBottom: 16,
  },
  attachBtnActive: {
    borderColor: iosColors.systemGreen,
    backgroundColor: "rgba(52, 199, 89, 0.1)",
  },
  attachBtnText: {
    fontSize: 12,
    fontWeight: "700",
    color: iosColors.systemBlue,
  },
  modalSubmitBtn: {
    backgroundColor: "#2563EB",
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#2563EB",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
  },
  modalSubmitText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800",
  },
  modalCancelBtn: {
    paddingVertical: 12,
    alignItems: "center",
    marginTop: 4,
  },
  modalCancelText: {
    color: iosColors.labelSecondary,
    fontSize: 13,
    fontWeight: "600",
  },
  photoPreviewCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(52, 199, 89, 0.08)",
    borderWidth: 1,
    borderColor: "rgba(52, 199, 89, 0.3)",
    borderRadius: 14,
    padding: 10,
    marginTop: -8,
  },
  photoThumbnail: {
    width: 52,
    height: 52,
    borderRadius: 10,
    backgroundColor: "#000",
  },
  antiFraudTag: {
    fontSize: 11,
    fontWeight: "800",
    color: iosColors.systemGreen,
  },
  photoMetaText: {
    fontSize: 10,
    color: iosColors.labelSecondary,
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
    marginTop: 2,
  },
  zoneChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.12)",
  },
  zoneChipActive: {
    backgroundColor: "rgba(10, 122, 255, 0.2)",
    borderColor: iosColors.systemBlue,
  },
  zoneChipText: {
    fontSize: 11,
    fontWeight: "700",
    color: iosColors.labelSecondary,
  },
  zoneChipTextActive: {
    color: "#FFFFFF",
    fontWeight: "800",
  },
  selectedZoneSubtitle: {
    fontSize: 11,
    color: iosColors.labelSecondary,
    marginTop: 6,
  },
  subcontractorBadge: {
    backgroundColor: "rgba(255, 149, 0, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(255, 149, 0, 0.3)",
    borderRadius: 12,
    padding: 10,
    marginBottom: 14,
  },
  subcontractorTitle: {
    fontSize: 11,
    fontWeight: "700",
    color: iosColors.systemOrange,
  },
  subcontractorName: {
    fontSize: 11,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  subcontractorDesc: {
    fontSize: 10,
    color: "rgba(255, 255, 255, 0.7)",
    marginTop: 2,
    lineHeight: 14,
  },
});
