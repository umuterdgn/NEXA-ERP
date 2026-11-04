/**
 * © 2026 NXA Software. All rights reserved.
 * Nexa ERP Mobil - İş Emirleri (Tasks) Ekranı
 *
 * - Üst Segmented Control: "Tümü", "Devam Edenler", "Tamamlananlar"
 * - react-native-gesture-handler & react-native-reanimated ile "Sola Kaydırarak Tamamla" (Swipe Left to Complete)
 * - Renkli Etiketler: Kırmızı: KRİTİK, Turuncu: YÜKSEK, Mavi: BEKLİYOR, Yeşil: TAMAMLANDI
 * - Apple iOS Standartlarında Frosted Glass Arayüzü
 */

import React, { useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Vibration,
  Platform,
  Alert,
  StyleSheet,
} from "react-native";
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

export interface TaskItem {
  id: string;
  code: string;
  title: string;
  description: string;
  location: string;
  priority: "KRİTİK" | "YÜKSEK" | "ORTA" | "DÜŞÜK";
  status: "BEKLİYOR" | "DEVAM EDİYOR" | "TAMAMLANDI";
  dueDate: string;
}

const INITIAL_TASKS: TaskItem[] = [
  {
    id: "1",
    code: "TSK-201",
    title: "Kolon Donatısı ve Paspayı Kontrolü",
    description: "Statik projeye göre demir bağlama ve paspayı takozları kontrol edilecek.",
    location: "Blok-B • Kat: 3",
    priority: "KRİTİK",
    status: "DEVAM EDİYOR",
    dueDate: "Bugün 16:30",
  },
  {
    id: "2",
    code: "TSK-202",
    title: "C30 Hazır Beton Numunesi Alma",
    description: "Gelen transmikserden slump ve 6 adet küp numune alınması.",
    location: "Laboratuvar & Zemin",
    priority: "YÜKSEK",
    status: "BEKLİYOR",
    dueDate: "Bugün 17:00",
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
  const [tasks, setTasks] = useState<TaskItem[]>(INITIAL_TASKS);
  const [filter, setFilter] = useState<"ALL" | "ACTIVE" | "COMPLETED">("ALL");

  // Görevi Tamamlandı Olarak İşaretle
  const handleCompleteTask = (taskId: string) => {
    if (Platform.OS !== "web") {
      Vibration.vibrate(80);
    }

    setTasks((prev) =>
      (prev || []).map((t) => (t.id === taskId ? { ...t, status: "TAMAMLANDI" } : t))
    );

    const target = tasks.find((t) => t.id === taskId);
    Alert.alert(
      "✅ Görev Tamamlandı",
      `"${target?.title || "İş emri"}" başarıyla tamamlandı olarak işaretlendi.`
    );
  };

  // Filtreleme
  const filteredTasks = (tasks || []).filter((t) => {
    if (filter === "ACTIVE") return t.status !== "TAMAMLANDI";
    if (filter === "COMPLETED") return t.status === "TAMAMLANDI";
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
          <View>
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
                <View
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

                  {/* Konum & Termin Tarihi */}
                  <View style={styles.taskFooter}>
                    <View style={styles.footerItem}>
                      <Feather name="map-pin" size={12} color={iosColors.systemBlue} />
                      <Text style={styles.footerLocationText}>{item.location}</Text>
                    </View>

                    <View style={styles.footerItem}>
                      <Feather name="clock" size={12} color={iosColors.labelSecondary} />
                      <Text style={styles.footerDueText}>{item.dueDate}</Text>
                    </View>
                  </View>
                </View>
              </ReanimatedSwipeable>
            </View>
          );
        }}
      />
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
});
