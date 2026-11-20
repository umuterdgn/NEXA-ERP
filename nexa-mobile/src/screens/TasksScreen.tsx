/**
 * © 2026 NXA Software. All rights reserved.
 * Nexa ERP Mobil - İş Emirleri & Saha Görevleri (GET/PATCH /api/mobile/tasks)
 */

import React, { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../context/AuthContext";
import { extractErrorMessage, mobileApi } from "../services/apiClient";
import {
  AppHeader,
  EmptyState,
  GlassCard,
  ScreenHeader,
  SkeletonList,
  StatusBadge,
} from "../components/ui/NexaUI";
import { iosColors } from "../theme/iosTheme";
import type { MobileTaskItem } from "../types/api";

export default function TasksScreen({ embeddedInTab = false }: { embeddedInTab?: boolean }) {
  const { activeProject } = useAuth();
  const [tasks, setTasks] = useState<MobileTaskItem[]>([]);
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ACTIVE" | "COMPLETED">("ALL");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selected, setSelected] = useState<MobileTaskItem | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const loadTasks = useCallback(
    async (isRefresh = false) => {
      try {
        if (isRefresh) setRefreshing(true);
        else setLoading(true);
        const res = await mobileApi.tasks.list({
          projectId: activeProject?.id,
          status: statusFilter,
        });
        setTasks(res.tasks || []);
      } catch (err: any) {
        Alert.alert("Görevler Alınamadı", extractErrorMessage(err));
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [activeProject?.id, statusFilter]
  );

  useEffect(() => {
    loadTasks(false);
  }, [loadTasks]);

  const handleUpdateStatus = async (
    task: MobileTaskItem,
    nextStatus: "DEVAM EDİYOR" | "TAMAMLANDI"
  ) => {
    try {
      setUpdatingId(task.id);
      await mobileApi.tasks.updateStatus(task.id, nextStatus);
      setTasks((prev) =>
        prev.map((t) => (t.id === task.id ? { ...t, status: nextStatus } : t))
      );
      setSelected(null);
      Alert.alert("Güncellendi", `Görev durumu "${nextStatus}" olarak güncellendi.`);
    } catch (err: any) {
      Alert.alert("Hata", extractErrorMessage(err));
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      {embeddedInTab ? (
        <AppHeader title="İş Emirleri & Görevler" />
      ) : (
        <ScreenHeader
          title="İş Emirleri & Görevler"
          subtitle={activeProject?.name || "Canlı Saha İş Listesi"}
        />
      )}

      {/* Filtre Sekmeleri */}
      <View style={styles.filterRow}>
        {[
          { key: "ALL" as const, label: "Tümü" },
          { key: "ACTIVE" as const, label: "Devam Eden" },
          { key: "COMPLETED" as const, label: "Tamamlanan" },
        ].map((f) => {
          const active = statusFilter === f.key;
          return (
            <TouchableOpacity
              key={f.key}
              style={[styles.filterPill, active && styles.filterPillActive]}
              onPress={() => setStatusFilter(f.key)}
            >
              <Text style={[styles.filterText, active && styles.filterTextActive]}>
                {f.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadTasks(true)}
            tintColor={iosColors.systemBlue}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <SkeletonList count={4} />
        ) : tasks.length === 0 ? (
          <EmptyState
            icon="checkbox-outline"
            title="Görev Bulunamadı"
            subtitle="Seçili filtreye veya şantiyeye ait aktif görev yok."
            actionLabel="Yenile"
            onAction={() => loadTasks(true)}
          />
        ) : (
          tasks.map((t) => (
            <TouchableOpacity
              key={t.id}
              activeOpacity={0.82}
              onPress={() => setSelected(t)}
            >
              <GlassCard style={styles.taskCard}>
                <View style={styles.rowBetween}>
                  <Text style={styles.taskCode}>{t.code}</Text>
                  <View style={styles.badgesRow}>
                    <StatusBadge status={t.priority} />
                    <StatusBadge status={t.status} />
                  </View>
                </View>
                <Text style={styles.taskTitle}>{t.title}</Text>
                {t.description ? (
                  <Text style={styles.taskDesc} numberOfLines={2}>
                    {t.description}
                  </Text>
                ) : null}
                <View style={styles.metaRow}>
                  <Ionicons name="location-outline" size={14} color="#8E8E93" />
                  <Text style={styles.metaText} numberOfLines={1}>
                    {t.location}
                  </Text>
                  <Text style={styles.metaText}>• {t.dueDate}</Text>
                </View>
              </GlassCard>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      {/* Görev Detay & Durum Güncelleme Modalı */}
      <Modal
        visible={Boolean(selected)}
        transparent
        animationType="slide"
        onRequestClose={() => setSelected(null)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.rowBetween}>
              <Text style={styles.modalTitle}>Görev Detayı</Text>
              <TouchableOpacity onPress={() => setSelected(null)}>
                <Ionicons name="close" size={22} color="#8E8E93" />
              </TouchableOpacity>
            </View>
            {selected && (
              <>
                <Text style={styles.taskTitle}>{selected.title}</Text>
                <Text style={styles.modalDesc}>
                  {selected.description || "Açıklama bulunmuyor."}
                </Text>
                <View style={styles.metaRow}>
                  <Ionicons name="location-outline" size={15} color="#58A6FF" />
                  <Text style={styles.metaText}>{selected.location}</Text>
                </View>
                <View style={styles.modalActions}>
                  <TouchableOpacity
                    style={[styles.actionBtn, { backgroundColor: "rgba(255,149,0,0.2)", borderColor: "#FF9500" }]}
                    disabled={updatingId === selected.id}
                    onPress={() => handleUpdateStatus(selected, "DEVAM EDİYOR")}
                  >
                    <Text style={[styles.actionBtnText, { color: "#FFB340" }]}>
                      Devam Ediyor
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionBtn, { backgroundColor: "#34C759", borderColor: "#34C759" }]}
                    disabled={updatingId === selected.id}
                    onPress={() => handleUpdateStatus(selected, "TAMAMLANDI")}
                  >
                    <Text style={[styles.actionBtnText, { color: "#FFFFFF" }]}>
                      Tamamlandı
                    </Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: iosColors.background },
  filterRow: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  filterPill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  filterPillActive: {
    backgroundColor: "rgba(10, 122, 255, 0.2)",
    borderColor: iosColors.systemBlue,
  },
  filterText: { fontSize: 12, fontWeight: "700", color: "#8E8E93" },
  filterTextActive: { color: "#58A6FF" },
  scrollContent: { padding: 16, paddingBottom: 110, gap: 12 },
  taskCard: { gap: 8 },
  rowBetween: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  badgesRow: { flexDirection: "row", gap: 6 },
  taskCode: { fontSize: 11, fontWeight: "800", color: "#58A6FF" },
  taskTitle: { fontSize: 15, fontWeight: "800", color: "#FFFFFF" },
  taskDesc: { fontSize: 12, color: iosColors.labelMuted, lineHeight: 17 },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 5 },
  metaText: { fontSize: 11, color: "#8E8E93", flexShrink: 1 },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.75)",
    justifyContent: "flex-end",
  },
  modalCard: {
    backgroundColor: "#111827",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    padding: 20,
    gap: 14,
  },
  modalTitle: { fontSize: 17, fontWeight: "800", color: "#FFFFFF" },
  modalDesc: { fontSize: 13, color: "#D1D5DB", lineHeight: 19 },
  modalActions: { flexDirection: "row", gap: 10, marginTop: 6 },
  actionBtn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
  },
  actionBtnText: { fontSize: 13, fontWeight: "800" },
});

