/**
 * © 2026 NXA Software. All rights reserved.
 * Nexa ERP Mobil - Dinamik Yetkili Modüller Ekranı (Slot 5)
 * Yalnızca sunucudan dönen allowedModules içindeki modülleri render eder.
 */

import React, { useMemo, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useAuth } from "../context/AuthContext";
import {
  CATEGORY_LABELS,
  getAuthorizedModules,
  type MobileModuleItem,
} from "../config/navigationConfig";
import { AppHeader, EmptyState, GlassCard } from "../components/ui/NexaUI";
import { iosColors } from "../theme/iosTheme";
import type { ModuleCategory } from "../types/api";

const CATEGORY_ORDER: ModuleCategory[] = [
  "HSE_FIELD_OPS",
  "INSPECTION_QUALITY",
  "SUBCONTRACTOR_FINANCE",
  "PROCUREMENT_LOGISTICS",
  "HR_PERSONAL",
  "MANAGEMENT_BI",
];

export default function ModulesCatalogScreen() {
  const router = useRouter();
  const { role, tenantType, allowedModules, activeProject } = useAuth();
  const [query, setQuery] = useState("");

  const authorizedModules = useMemo(
    () => getAuthorizedModules(role, allowedModules),
    [role, allowedModules]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return authorizedModules;
    return authorizedModules.filter(
      (m) =>
        m.title.toLowerCase().includes(q) ||
        m.subtitle.toLowerCase().includes(q)
    );
  }, [authorizedModules, query]);

  const grouped = useMemo(() => {
    const map = new Map<ModuleCategory, MobileModuleItem[]>();
    for (const cat of CATEGORY_ORDER) {
      const items = filtered.filter((m) => m.category === cat);
      if (items.length > 0) map.set(cat, items);
    }
    return Array.from(map.entries());
  }, [filtered]);

  const openModule = (mod: MobileModuleItem) => {
    if (mod.kind === "SSO" && mod.ssoPath) {
      router.push({
        pathname: "/sso",
        params: {
          targetRoute: mod.ssoPath(tenantType, activeProject?.id),
          title: mod.title,
          projectId: activeProject?.id || "",
        },
      });
    } else if (mod.screenId) {
      router.push({
        pathname: "/screen/[moduleId]",
        params: { moduleId: mod.screenId, ...(mod.screenParams || {}) },
      });
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      <AppHeader title="Yetkili Modüller" />

      <View style={styles.searchWrap}>
        <View style={styles.searchBox}>
          <Ionicons name="search" size={18} color="#8E8E93" />
          <TextInput
            style={styles.searchInput}
            value={query}
            onChangeText={setQuery}
            placeholder="Modül veya işlem ara..."
            placeholderTextColor="#636366"
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery("")}>
              <Ionicons name="close-circle" size={18} color="#8E8E93" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {grouped.length === 0 ? (
          <EmptyState
            icon="apps-outline"
            title="Eşleşen Modül Bulunamadı"
            subtitle="Arama kriterinizi değiştirin veya sistem yöneticinizden ek yetki talep edin."
          />
        ) : (
          grouped.map(([cat, items]) => (
            <View key={cat} style={styles.groupBlock}>
              <Text style={styles.groupTitle}>{CATEGORY_LABELS[cat]}</Text>
              <View style={styles.grid}>
                {items.map((mod) => (
                  <TouchableOpacity
                    key={mod.id}
                    style={styles.moduleTouch}
                    activeOpacity={0.8}
                    onPress={() => openModule(mod)}
                  >
                    <GlassCard style={styles.moduleCard}>
                      <View style={styles.cardTopRow}>
                        <View
                          style={[
                            styles.iconBox,
                            { backgroundColor: `${mod.color}22` },
                          ]}
                        >
                          <Ionicons name={mod.icon} size={20} color={mod.color} />
                        </View>
                        {mod.kind === "SSO" && (
                          <View style={styles.ssoBadge}>
                            <Text style={styles.ssoBadgeText}>WEB SSO</Text>
                          </View>
                        )}
                      </View>
                      <Text style={styles.modTitle} numberOfLines={2}>
                        {mod.title}
                      </Text>
                      <Text style={styles.modSub} numberOfLines={2}>
                        {mod.subtitle}
                      </Text>
                    </GlassCard>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: iosColors.background,
  },
  searchWrap: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 6,
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: iosColors.glassBorderLight,
    paddingHorizontal: 12,
    height: 44,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    color: "#FFFFFF",
    fontSize: 14,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 110,
    gap: 18,
  },
  groupBlock: {
    gap: 10,
  },
  groupTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: "#8E8E93",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  moduleTouch: {
    width: "48%",
  },
  moduleCard: {
    minHeight: 134,
    gap: 7,
  },
  cardTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  iconBox: {
    width: 38,
    height: 38,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },
  ssoBadge: {
    backgroundColor: "rgba(0, 199, 190, 0.16)",
    borderWidth: 1,
    borderColor: "rgba(0, 199, 190, 0.35)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  ssoBadgeText: {
    fontSize: 9,
    fontWeight: "800",
    color: "#5CE1E6",
  },
  modTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  modSub: {
    fontSize: 11,
    color: iosColors.labelMuted,
    lineHeight: 15,
  },
});

