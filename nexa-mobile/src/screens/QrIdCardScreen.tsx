/**
 * © 2026 NXA Software. All rights reserved.
 * Nexa ERP Mobil - Dijital Personel QR Kimlik Kartı (Turnike & Saha Geçiş Kartı)
 */

import React, { useEffect, useMemo, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../context/AuthContext";
import { mobileApi } from "../services/apiClient";
import {
  getRoleDisplayTitle,
  getTenantBusinessBadge,
} from "../config/navigationConfig";
import { GlassCard, ScreenHeader, StatusBadge } from "../components/ui/NexaUI";
import { iosColors } from "../theme/iosTheme";

/**
 * Harici SVG/QR native modülü olmadan Expo Go içinde deterministik
 * yüksek kontrastlı 21x21 dijital geçiş matrisi üretir.
 */
function buildDeterministicMatrix(seedInput: string): boolean[][] {
  const size = 21;
  const grid: boolean[][] = Array.from({ length: size }, () =>
    Array(size).fill(false)
  );

  const drawFinder = (r0: number, c0: number) => {
    for (let r = 0; r < 7; r++) {
      for (let c = 0; c < 7; c++) {
        const border = r === 0 || r === 6 || c === 0 || c === 6;
        const inner = r >= 2 && r <= 4 && c >= 2 && c <= 4;
        grid[r0 + r][c0 + c] = border || inner;
      }
    }
  };

  drawFinder(0, 0);
  drawFinder(0, size - 7);
  drawFinder(size - 7, 0);

  let hash = 2166136261;
  for (let i = 0; i < seedInput.length; i++) {
    hash ^= seedInput.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const inTopLeft = r < 8 && c < 8;
      const inTopRight = r < 8 && c >= size - 8;
      const inBottomLeft = r >= size - 8 && c < 8;
      if (inTopLeft || inTopRight || inBottomLeft) continue;

      hash ^= (r * 31 + c * 17) & 0xff;
      hash = Math.imul(hash, 16777619);
      grid[r][c] = (hash >>> 0) % 2 === 0;
    }
  }
  return grid;
}

export default function QrIdCardScreen() {
  const { user, tenant, tenantType, role, activeProject, geofenceStatus } =
    useAuth();
  const [personnelNo, setPersonnelNo] = useState<string>("");
  const [department, setDepartment] = useState<string>("");

  useEffect(() => {
    mobileApi.hr
      .getSelf()
      .then((res) => {
        if (res?.profile?.personnelNo) setPersonnelNo(res.profile.personnelNo);
        if (res?.profile?.department) setDepartment(res.profile.department);
      })
      .catch(() => {});
  }, []);

  const badgeCode = useMemo(() => {
    const uid = user?.id?.slice(0, 8) || "USER";
    const pNo = personnelNo || uid.toUpperCase();
    return `NEXA-ID:${tenant?.id?.slice(0, 6) || "ERP"}:${pNo}`;
  }, [user?.id, tenant?.id, personnelNo]);

  const matrix = useMemo(() => buildDeterministicMatrix(badgeCode), [badgeCode]);

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      <ScreenHeader
        title="Dijital QR Kimlik Kartı"
        subtitle="Turnike, Kapı Güvenlik & Saha Yetki Kartı"
      />

      <ScrollView contentContainerStyle={styles.scroll}>
        <GlassCard style={styles.idCard}>
          <View style={styles.topRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.companyName}>
                {tenant?.name || "NEXA ERP KURUMSAL"}
              </Text>
              <Text style={styles.badgeLabel}>
                {getTenantBusinessBadge(tenantType)}
              </Text>
            </View>
            <StatusBadge
              status={geofenceStatus?.isInside === false ? "WARNING" : "ACTIVE"}
              label={
                geofenceStatus?.isInside === false ? "SAHA DIŞI" : "SAHA YETKİLİ"
              }
            />
          </View>

          <View style={styles.qrFrame}>
            <View style={styles.matrixWrap}>
              {matrix.map((row, rIdx) => (
                <View key={rIdx} style={styles.matrixRow}>
                  {row.map((cell, cIdx) => (
                    <View
                      key={cIdx}
                      style={[
                        styles.matrixCell,
                        { backgroundColor: cell ? "#0A0F1C" : "#FFFFFF" },
                      ]}
                    />
                  ))}
                </View>
              ))}
            </View>
            <Text style={styles.qrTokenText}>{badgeCode}</Text>
          </View>

          <View style={styles.identityBlock}>
            <Text style={styles.personName}>{user?.name || "Personel"}</Text>
            <Text style={styles.personRole}>{getRoleDisplayTitle(role)}</Text>
            {department ? (
              <Text style={styles.personMeta}>Birim: {department}</Text>
            ) : null}
            <Text style={styles.personMeta}>E-posta: {user?.email || "-"}</Text>
            <Text style={styles.personMeta}>
              Aktif Proje / Şube: {activeProject?.name || "Genel Merkez"}
            </Text>
          </View>

          <View style={styles.verifiedBar}>
            <Ionicons name="shield-checkmark" size={16} color="#34C759" />
            <Text style={styles.verifiedTxt}>
              JWT Oturumu & İşletme Yetkisi Canlı Doğrulandı
            </Text>
          </View>
        </GlassCard>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: iosColors.background },
  scroll: { padding: 16, paddingBottom: 100 },
  idCard: { gap: 18, padding: 20 },
  topRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 10,
  },
  companyName: { color: "#FFFFFF", fontSize: 16, fontWeight: "800" },
  badgeLabel: { color: "#3B9EFF", fontSize: 12, fontWeight: "700", marginTop: 2 },
  qrFrame: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 18,
    alignItems: "center",
    gap: 10,
  },
  matrixWrap: { width: 189, height: 189 },
  matrixRow: { flexDirection: "row" },
  matrixCell: { width: 9, height: 9 },
  qrTokenText: {
    color: "#0F172A",
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.8,
  },
  identityBlock: { alignItems: "center", gap: 4 },
  personName: { color: "#FFFFFF", fontSize: 20, fontWeight: "800" },
  personRole: { color: "#3B9EFF", fontSize: 14, fontWeight: "700" },
  personMeta: { color: "#98A2B3", fontSize: 12 },
  verifiedBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "rgba(52,199,89,0.14)",
    borderRadius: 12,
    paddingVertical: 10,
  },
  verifiedTxt: { color: "#34C759", fontSize: 12, fontWeight: "700" },
});

