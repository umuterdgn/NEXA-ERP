/**
 * © 2026 NXA Software. All rights reserved.
 * Nexa ERP Mobil - Çevrimdışı Senkronizasyon Kuyruğu & Çakışma Yönetimi (/api/mobile/sync/batch)
 */

import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../context/AuthContext";
import { offlineSync } from "../services/offlineSync";
import {
  EmptyState,
  GlassCard,
  ScreenHeader,
  StatusBadge,
} from "../components/ui/NexaUI";
import { iosColors } from "../theme/iosTheme";
import type { OfflineMutationRecord } from "../types/api";

export default function SyncQueueScreen() {
  const { isOnline, syncOfflineNow } = useAuth();
  const [items, setItems] = useState<OfflineMutationRecord[]>([]);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    offlineSync.getQueue().then(setItems).catch(() => {});
    const unsub = offlineSync.subscribe(setItems);
    return unsub;
  }, []);

  const handleSyncNow = async () => {
    if (!isOnline) {
      Alert.alert(
        "İnternet Bağlantısı Yok",
        "Kayıtlar bağlantı kurulduğu anda otomatik eşitlenecektir."
      );
      return;
    }
    setSyncing(true);
    try {
      const res = await syncOfflineNow();
      Alert.alert(
        "Senkronizasyon Özeti",
        `Eşitlenen: ${res.synced} • Çakışma: ${res.conflicts} • Hata: ${res.errors}`
      );
    } finally {
      setSyncing(false);
    }
  };

  const pendingCount = items.filter((i) => i.status === "PENDING").length;
  const syncedCount = items.filter((i) => i.status === "SYNCED").length;
  const conflictOrErrorCount = items.filter(
    (i) => i.status === "CONFLICT" || i.status === "ERROR"
  ).length;

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      <ScreenHeader
        title="Çevrimdışı Eşitleme Kuyruğu"
        subtitle={
          isOnline
            ? "Bağlantı Çevrimiçi • Senkronizasyon Hazır"
            : "Çevrimdışı Mod • Veriler Cihazda Korunuyor"
        }
      />

      <ScrollView contentContainerStyle={styles.scroll}>
        <GlassCard style={styles.summaryCard}>
          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statVal}>{pendingCount}</Text>
              <Text style={styles.statLbl}>Bekleyen</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={[styles.statVal, { color: "#34C759" }]}>
                {syncedCount}
              </Text>
              <Text style={styles.statLbl}>Eşitlendi</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={[styles.statVal, { color: "#FF453A" }]}>
                {conflictOrErrorCount}
              </Text>
              <Text style={styles.statLbl}>Çakışma / Hata</Text>
            </View>
          </View>

          <View style={styles.btnRow}>
            <TouchableOpacity
              style={[styles.syncBtn, syncing && { opacity: 0.65 }]}
              onPress={handleSyncNow}
              disabled={syncing}
            >
              {syncing ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <>
                  <Ionicons name="cloud-upload" size={18} color="#FFFFFF" />
                  <Text style={styles.syncBtnTxt}>Şimdi Eşitle</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.clearBtn}
              onPress={() => offlineSync.clearSynced()}
            >
              <Text style={styles.clearBtnTxt}>Eşitlenenleri Temizle</Text>
            </TouchableOpacity>
          </View>
        </GlassCard>

        {items.length === 0 ? (
          <EmptyState
            icon="cloud-done-outline"
            title="Kuyruk Tamamen Temiz"
            subtitle="Çevrimdışı bekleyen veya çakışmalı saha işlemi bulunmuyor."
          />
        ) : (
          items.map((item) => (
            <GlassCard key={item.clientMutationId} style={styles.itemCard}>
              <View style={styles.rowBetween}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.itemLabel}>{item.label}</Text>
                  <Text style={styles.itemMeta}>
                    {item.method} {item.endpoint}
                  </Text>
                  <Text style={styles.itemMeta}>
                    {new Date(item.createdAt).toLocaleString("tr-TR")}
                  </Text>
                </View>
                <StatusBadge status={item.status} />
              </View>

              {item.error ? (
                <Text style={styles.errTxt}>{item.error}</Text>
              ) : null}

              <TouchableOpacity
                style={styles.removeBtn}
                onPress={() => offlineSync.removeItem(item.clientMutationId)}
              >
                <Ionicons name="trash-outline" size={14} color="#8E8E93" />
                <Text style={styles.removeTxt}>Kuyruktan Kaldır</Text>
              </TouchableOpacity>
            </GlassCard>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: iosColors.background },
  scroll: { padding: 16, paddingBottom: 120, gap: 12 },
  summaryCard: { gap: 14 },
  statsRow: { flexDirection: "row", gap: 8 },
  statBox: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: 12,
    padding: 12,
    alignItems: "center",
  },
  statVal: { color: "#FF9F0A", fontSize: 22, fontWeight: "800" },
  statLbl: { color: "#8E8E93", fontSize: 11, fontWeight: "600", marginTop: 2 },
  btnRow: { flexDirection: "row", gap: 10 },
  syncBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#0A7AFF",
    borderRadius: 12,
    paddingVertical: 12,
  },
  syncBtnTxt: { color: "#FFFFFF", fontSize: 14, fontWeight: "700" },
  clearBtn: {
    paddingHorizontal: 14,
    justifyContent: "center",
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  clearBtnTxt: { color: "#FFFFFF", fontSize: 12, fontWeight: "700" },
  itemCard: { gap: 8 },
  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 8,
  },
  itemLabel: { color: "#FFFFFF", fontSize: 14, fontWeight: "700" },
  itemMeta: { color: "#8E8E93", fontSize: 11, marginTop: 2 },
  errTxt: { color: "#FF453A", fontSize: 12 },
  removeBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    alignSelf: "flex-end",
  },
  removeTxt: { color: "#8E8E93", fontSize: 11, fontWeight: "600" },
});
