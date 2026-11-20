/**
 * © 2026 NXA Software. All rights reserved.
 * Nexa ERP Mobil - Çekirdek Tasarım Bileşenleri (Dark Slate/Navy Glass UI)
 */

import React, { useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { iosColors, iosRadius } from "../../theme/iosTheme";
import { useAuth } from "../../context/AuthContext";
import { useDrawer } from "../navigation/DrawerSidebar";
import {
  getRoleDisplayTitle,
  getTenantBusinessBadge,
  type IoniconName,
} from "../../config/navigationConfig";
import type { ModuleKey } from "../../types/api";

// ============================================================================
// STATUS BADGE
// ============================================================================

export function getStatusPalette(status?: string | null): {
  bg: string;
  text: string;
  border: string;
  label: string;
} {
  const s = String(status || "").toUpperCase();
  if (
    ["APPROVED", "ONAYLANDI", "PASSED", "TAMAMLANDI", "COMPLETED", "DONE", "CLOSED", "PRESENT", "DELIVERED", "SYNCED", "ACTIVE"].includes(
      s
    )
  ) {
    return {
      bg: "rgba(52, 199, 89, 0.16)",
      text: "#34C759",
      border: "rgba(52, 199, 89, 0.35)",
      label: s === "APPROVED" ? "ONAYLANDI" : s === "CLOSED" ? "KAPATILDI" : s === "PASSED" ? "GEÇTİ" : s,
    };
  }
  if (
    ["REJECTED", "FAILED", "REDDEDİLDİ", "CRITICAL", "URGENT", "CONFLICT", "ERROR", "OPEN"].includes(
      s
    )
  ) {
    return {
      bg: "rgba(255, 59, 48, 0.16)",
      text: "#FF453A",
      border: "rgba(255, 59, 48, 0.35)",
      label: s === "REJECTED" ? "REDDEDİLDİ" : s === "FAILED" ? "KALDI" : s === "OPEN" ? "AÇIK" : s,
    };
  }
  if (
    ["PENDING", "WAITING_TEST", "BEKLİYOR", "IN_PROGRESS", "DEVAM EDİYOR", "HIGH", "MEDIUM", "PLANNED", "IN_TRANSIT", "IN_LAB"].includes(
      s
    )
  ) {
    return {
      bg: "rgba(255, 149, 0, 0.16)",
      text: "#FF9F0A",
      border: "rgba(255, 149, 0, 0.35)",
      label: s === "PENDING" ? "ONAY BEKLİYOR" : s === "WAITING_TEST" ? "TEST BEKLİYOR" : s === "IN_LAB" ? "LABORATUVARDA" : s,
    };
  }
  return {
    bg: "rgba(10, 122, 255, 0.16)",
    text: "#3B9EFF",
    border: "rgba(10, 122, 255, 0.35)",
    label: s || "BİLGİ",
  };
}

export function StatusBadge({
  status,
  label,
}: {
  status?: string | null;
  label?: string;
}) {
  const pal = getStatusPalette(status);
  return (
    <View
      style={[
        styles.badge,
        { backgroundColor: pal.bg, borderColor: pal.border },
      ]}
    >
      <Text style={[styles.badgeText, { color: pal.text }]} numberOfLines={1}>
        {label || pal.label}
      </Text>
    </View>
  );
}

// ============================================================================
// GLASS CARD
// ============================================================================

export function GlassCard({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  return <View style={[styles.glassCard, style]}>{children}</View>;
}

// ============================================================================
// EMPTY STATE & SKELETON LOADER
// ============================================================================

export function EmptyState({
  icon = "file-tray-outline",
  title = "Kayıt Bulunamadı",
  subtitle = "Bu alanda henüz sunucudan gelen bir veri bulunmuyor.",
  actionLabel,
  onAction,
}: {
  icon?: IoniconName;
  title?: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <GlassCard style={styles.emptyCard}>
      <View style={styles.emptyIconCircle}>
        <Ionicons name={icon} size={28} color="#3B9EFF" />
      </View>
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptySub}>{subtitle}</Text>
      {actionLabel && onAction && (
        <TouchableOpacity style={styles.emptyBtn} onPress={onAction} activeOpacity={0.8}>
          <Text style={styles.emptyBtnText}>{actionLabel}</Text>
        </TouchableOpacity>
      )}
    </GlassCard>
  );
}

export function SkeletonList({ count = 3 }: { count?: number }) {
  return (
    <View style={{ gap: 12 }}>
      {Array.from({ length: count }).map((_, idx) => (
        <View key={idx} style={styles.skeletonCard}>
          <View style={styles.skeletonBarShort} />
          <View style={styles.skeletonBarLong} />
          <View style={styles.skeletonBarMid} />
        </View>
      ))}
    </View>
  );
}

// ============================================================================
// YETKİ KORUMASI (ROUTE GUARD)
// ============================================================================

export function UnauthorizedGuard({
  requiredModules,
  children,
}: {
  requiredModules: ModuleKey[];
  children: React.ReactNode;
}) {
  const { isAuthenticated, isBootstrapping, role, hasModule } = useAuth();
  const router = useRouter();

  if (isBootstrapping) {
    return (
      <SafeAreaView style={styles.guardContainer}>
        <ActivityIndicator size="large" color={iosColors.systemBlue} />
      </SafeAreaView>
    );
  }

  if (!isAuthenticated) {
    return (
      <SafeAreaView style={styles.guardContainer}>
        <Ionicons name="lock-closed" size={44} color="#FF9500" />
        <Text style={styles.guardTitle}>Oturum Gerekli</Text>
        <Text style={styles.guardDesc}>Devam etmek için kurumsal hesabınızla giriş yapın.</Text>
        <TouchableOpacity
          style={styles.guardBtn}
          onPress={() => router.replace("/")}
        >
          <Text style={styles.guardBtnText}>Giriş Ekranına Dön</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  if (requiredModules.length > 0 && !hasModule(...requiredModules)) {
    return (
      <SafeAreaView style={styles.guardContainer}>
        <View style={styles.guardIconWarn}>
          <Ionicons name="shield-outline" size={38} color="#FF453A" />
        </View>
        <Text style={styles.guardTitle}>Erişim Yetkisi Yok</Text>
        <Text style={styles.guardDesc}>
          Rolünüz ({getRoleDisplayTitle(role)}) bu modüle erişim yetkisine sahip değil.
        </Text>
        <TouchableOpacity
          style={styles.guardBtn}
          onPress={() => router.replace("/(tabs)")}
        >
          <Text style={styles.guardBtnText}>Ana Ekrana Dön</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return <>{children}</>;
}

// ============================================================================
// APP HEADER (ANA SEKME EKRANLARI İÇİN ÜST BAR & PROJE DEĞİŞTİRİCİ)
// ============================================================================

export function AppHeader({ title }: { title?: string }) {
  const {
    user,
    tenant,
    tenantType,
    role,
    assignedProjects,
    activeProject,
    setActiveProject,
    isOnline,
    offlineQueueCount,
    geofenceStatus,
  } = useAuth();
  const { openDrawer } = useDrawer();
  const router = useRouter();
  const [showProjectModal, setShowProjectModal] = useState(false);

  const firstName = user?.name ? user.name.split(" ")[0] : "Kullanıcı";
  const initials = (user?.name || "NX").slice(0, 2).toUpperCase();
  const canSwitchProject = assignedProjects.length > 1;

  const tenantColors =
    tenantType === "INSPECTION"
      ? { bg: "rgba(175, 82, 222, 0.16)", border: "rgba(175, 82, 222, 0.38)", text: "#D38BFF" }
      : tenantType === "FRANCHISE"
      ? { bg: "rgba(255, 149, 0, 0.16)", border: "rgba(255, 149, 0, 0.38)", text: "#FFB340" }
      : { bg: "rgba(10, 122, 255, 0.16)", border: "rgba(10, 122, 255, 0.38)", text: "#58A6FF" };

  return (
    <View style={styles.appHeaderWrap}>
      {/* Üst Satır */}
      <View style={styles.headerTopRow}>
        <TouchableOpacity
          style={styles.iconCircleBtn}
          onPress={openDrawer}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="menu" size={22} color="#FFFFFF" />
        </TouchableOpacity>

        <View style={{ flex: 1 }}>
          <Text style={styles.headerGreeting} numberOfLines={1}>
            {title || `Merhaba, ${firstName}`}
          </Text>
          <Text style={styles.headerRoleSub} numberOfLines={1}>
            {getRoleDisplayTitle(role)}
          </Text>
        </View>

        {/* Çevrimdışı / Senkronizasyon Rozeti */}
        {(!isOnline || offlineQueueCount > 0) && (
          <TouchableOpacity
            style={[
              styles.syncHeaderPill,
              !isOnline
                ? { backgroundColor: "rgba(255, 59, 48, 0.18)", borderColor: "rgba(255, 59, 48, 0.4)" }
                : { backgroundColor: "rgba(255, 149, 0, 0.18)", borderColor: "rgba(255, 149, 0, 0.4)" },
            ]}
            onPress={() => router.push("/sync-queue")}
          >
            <Ionicons
              name={isOnline ? "cloud-upload-outline" : "cloud-offline-outline"}
              size={14}
              color={isOnline ? "#FF9F0A" : "#FF453A"}
            />
            <Text
              style={[
                styles.syncHeaderText,
                { color: isOnline ? "#FF9F0A" : "#FF453A" },
              ]}
            >
              {!isOnline ? "Çevrimdışı" : `${offlineQueueCount} Bekliyor`}
            </Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={styles.avatarCircle}
          onPress={() => router.push("/profile")}
        >
          <Text style={styles.avatarInitials}>{initials}</Text>
        </TouchableOpacity>
      </View>

      {/* İşletme Tipi Rozeti + Aktif Proje / Şube Seçici */}
      <View style={styles.contextBarRow}>
        <View
          style={[
            styles.businessPill,
            { backgroundColor: tenantColors.bg, borderColor: tenantColors.border },
          ]}
        >
          <Text style={[styles.businessPillText, { color: tenantColors.text }]}>
            {getTenantBusinessBadge(tenantType)}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.projectPill}
          disabled={!canSwitchProject}
          activeOpacity={canSwitchProject ? 0.75 : 1}
          onPress={() => canSwitchProject && setShowProjectModal(true)}
        >
          <View
            style={[
              styles.onlineDot,
              { backgroundColor: isOnline ? "#34C759" : "#FF9500" },
            ]}
          />
          <Text style={styles.projectPillText} numberOfLines={1}>
            {activeProject?.name || tenant?.name || "Proje Atanmadı"}
          </Text>
          {canSwitchProject && (
            <Ionicons name="chevron-down" size={14} color="#8E8E93" />
          )}
        </TouchableOpacity>
      </View>

      {/* Geofence İhlal Uyarısı */}
      {geofenceStatus && !geofenceStatus.isInside && (
        <View style={styles.geofenceBanner}>
          <Ionicons name="location-outline" size={15} color="#FF9F0A" />
          <Text style={styles.geofenceText} numberOfLines={2}>
            Şantiye sınırları dışındasınız ({geofenceStatus.distanceMeters} m). Puantaj ve saha kayıtlarında konum doğrulanır.
          </Text>
        </View>
      )}

      {/* Proje Seçim Modalı */}
      <Modal
        visible={showProjectModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowProjectModal(false)}
      >
        <TouchableWithoutFeedback onPress={() => setShowProjectModal(false)}>
          <View style={styles.modalBackdrop}>
            <TouchableWithoutFeedback>
              <View style={styles.modalSheet}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Aktif Şantiye / Şube Seç</Text>
                  <TouchableOpacity onPress={() => setShowProjectModal(false)}>
                    <Ionicons name="close" size={22} color="#8E8E93" />
                  </TouchableOpacity>
                </View>
                <ScrollView style={{ maxHeight: 340 }}>
                  {assignedProjects.map((proj) => {
                    const selected = activeProject?.id === proj.id;
                    return (
                      <TouchableOpacity
                        key={proj.id}
                        style={[
                          styles.projectOption,
                          selected && styles.projectOptionActive,
                        ]}
                        onPress={async () => {
                          await setActiveProject(proj);
                          setShowProjectModal(false);
                        }}
                      >
                        <View style={{ flex: 1 }}>
                          <Text style={styles.projectOptionName}>{proj.name}</Text>
                          <Text style={styles.projectOptionSub}>
                            {[proj.district, proj.city, proj.status].filter(Boolean).join(" • ") ||
                              "Aktif Proje"}
                          </Text>
                        </View>
                        {selected && (
                          <Ionicons name="checkmark-circle" size={20} color="#0A7AFF" />
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
}

// ============================================================================
// STACK EKRANLARI İÇİN ÜST BAR
// ============================================================================

export function ScreenHeader({
  title,
  subtitle,
  rightAction,
}: {
  title: string;
  subtitle?: string;
  rightAction?: React.ReactNode;
}) {
  const router = useRouter();
  return (
    <View style={styles.screenHeader}>
      <TouchableOpacity
        style={styles.iconCircleBtn}
        onPress={() => (router.canGoBack() ? router.back() : router.replace("/(tabs)"))}
      >
        <Ionicons name="chevron-back" size={22} color="#FFFFFF" />
      </TouchableOpacity>
      <View style={{ flex: 1 }}>
        <Text style={styles.screenHeaderTitle} numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? (
          <Text style={styles.screenHeaderSub} numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {rightAction || null}
    </View>
  );
}

const styles = StyleSheet.create({
  glassCard: {
    backgroundColor: iosColors.glassCard,
    borderRadius: iosRadius.card,
    borderWidth: 1,
    borderColor: iosColors.glassBorder,
    padding: 15,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    alignSelf: "flex-start",
  },
  badgeText: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.3,
  },
  emptyCard: {
    alignItems: "center",
    paddingVertical: 28,
    paddingHorizontal: 20,
    gap: 8,
  },
  emptyIconCircle: {
    width: 54,
    height: 54,
    borderRadius: 18,
    backgroundColor: "rgba(10, 122, 255, 0.14)",
    borderWidth: 1,
    borderColor: "rgba(10, 122, 255, 0.3)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#FFFFFF",
    textAlign: "center",
  },
  emptySub: {
    fontSize: 12,
    color: iosColors.labelMuted,
    textAlign: "center",
    lineHeight: 18,
  },
  emptyBtn: {
    marginTop: 8,
    backgroundColor: iosColors.systemBlue,
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 10,
  },
  emptyBtnText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
  },
  skeletonCard: {
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
    padding: 16,
    gap: 10,
  },
  skeletonBarShort: {
    width: "40%",
    height: 12,
    borderRadius: 6,
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  skeletonBarLong: {
    width: "90%",
    height: 15,
    borderRadius: 6,
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  skeletonBarMid: {
    width: "65%",
    height: 11,
    borderRadius: 6,
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  guardContainer: {
    flex: 1,
    backgroundColor: iosColors.background,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 28,
    gap: 12,
  },
  guardIconWarn: {
    width: 72,
    height: 72,
    borderRadius: 24,
    backgroundColor: "rgba(255, 59, 48, 0.14)",
    borderWidth: 1,
    borderColor: "rgba(255, 59, 48, 0.35)",
    alignItems: "center",
    justifyContent: "center",
  },
  guardTitle: {
    fontSize: 19,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  guardDesc: {
    fontSize: 13,
    color: iosColors.labelMuted,
    textAlign: "center",
    lineHeight: 19,
  },
  guardBtn: {
    marginTop: 8,
    backgroundColor: iosColors.systemBlue,
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 12,
  },
  guardBtnText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 14,
  },
  appHeaderWrap: {
    paddingHorizontal: 16,
    paddingTop: Platform.OS === "android" ? 10 : 6,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: iosColors.separator,
    backgroundColor: "rgba(10, 15, 28, 0.96)",
    gap: 10,
  },
  headerTopRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  iconCircleBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: "rgba(255, 255, 255, 0.06)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerGreeting: {
    fontSize: 18,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: -0.3,
  },
  headerRoleSub: {
    fontSize: 11,
    color: iosColors.labelMuted,
    fontWeight: "600",
  },
  syncHeaderPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 10,
    borderWidth: 1,
  },
  syncHeaderText: {
    fontSize: 10,
    fontWeight: "800",
  },
  avatarCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(10, 122, 255, 0.18)",
    borderWidth: 1.5,
    borderColor: iosColors.systemBlue,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarInitials: {
    color: "#58A6FF",
    fontSize: 13,
    fontWeight: "800",
  },
  contextBarRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  businessPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    borderWidth: 1,
  },
  businessPillText: {
    fontSize: 11,
    fontWeight: "800",
  },
  projectPill: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.09)",
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  onlineDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  projectPillText: {
    flex: 1,
    fontSize: 12,
    fontWeight: "600",
    color: "#E5E7EB",
  },
  geofenceBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(255, 149, 0, 0.14)",
    borderWidth: 1,
    borderColor: "rgba(255, 149, 0, 0.35)",
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  geofenceText: {
    flex: 1,
    fontSize: 11,
    color: "#FFB340",
    fontWeight: "600",
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.72)",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  modalSheet: {
    backgroundColor: "#111827",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    padding: 18,
    gap: 12,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  projectOption: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    backgroundColor: "rgba(255,255,255,0.03)",
    marginBottom: 8,
    gap: 10,
  },
  projectOptionActive: {
    borderColor: iosColors.systemBlue,
    backgroundColor: "rgba(10, 122, 255, 0.12)",
  },
  projectOptionName: {
    fontSize: 14,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  projectOptionSub: {
    fontSize: 11,
    color: iosColors.labelMuted,
    marginTop: 2,
  },
  screenHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: iosColors.separator,
    backgroundColor: "#0A0F1C",
  },
  screenHeaderTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  screenHeaderSub: {
    fontSize: 11,
    color: iosColors.labelMuted,
    marginTop: 1,
  },
});

