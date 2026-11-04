/**
 * © 2026 NXA Software. All rights reserved.
 * Nexa ERP Mobil - Apple iOS Human Interface Guidelines (HIG) Tasarım Sistemi
 */

import { Platform, StyleSheet } from "react-native";

export const iosColors = {
  // Arka Plan Renkleri
  background: "#0A0F1C", // Koyu lacivert / derin siyah zemin
  backgroundSecondary: "#111827",
  backgroundTertiary: "#161F32",

  // Frosted Glass Kart Renkleri
  glassCard: "rgba(255, 255, 255, 0.05)",
  glassCardHover: "rgba(255, 255, 255, 0.08)",
  glassBorder: "rgba(255, 255, 255, 0.08)",
  glassBorderLight: "rgba(255, 255, 255, 0.12)",
  glassInner: "rgba(255, 255, 255, 0.03)",

  // iOS Sistem Vurgu Renkleri
  systemBlue: "#0A7AFF", // iOS Sistem Mavisi
  systemRed: "#FF3B30", // Kırmızı / İhlal / Kritik
  systemGreen: "#34C759", // Yeşil / Onaylandı / Başarı
  systemOrange: "#FF9500", // Turuncu / Ramak Kala / Uyarı
  systemYellow: "#FFCC00",
  systemPurple: "#AF52DE",
  systemTeal: "#30B0C7",
  systemIndigo: "#5856D6",

  // Tipografi ve Metin Renkleri
  labelPrimary: "#FFFFFF", // %100 Beyaz
  labelSecondary: "rgba(235, 235, 245, 0.60)", // %60 Opak Gri (San Francisco)
  labelTertiary: "rgba(235, 235, 245, 0.35)", // %35 Opak Gri
  labelMuted: "#8E8E93",

  // Çizgiler ve Ayraçlar (Dividers)
  separator: "rgba(255, 255, 255, 0.08)",
  separatorOpaque: "#1C2438",
};

export const iosTypography = {
  fontFamily: Platform.OS === "ios" ? "System" : "sans-serif",
  largeTitle: {
    fontSize: 34,
    fontWeight: "800" as const,
    letterSpacing: -0.5,
  },
  title1: {
    fontSize: 28,
    fontWeight: "700" as const,
    letterSpacing: -0.4,
  },
  title2: {
    fontSize: 22,
    fontWeight: "700" as const,
    letterSpacing: -0.3,
  },
  title3: {
    fontSize: 20,
    fontWeight: "600" as const,
    letterSpacing: -0.2,
  },
  headline: {
    fontSize: 17,
    fontWeight: "600" as const,
  },
  body: {
    fontSize: 16,
    fontWeight: "400" as const,
  },
  callout: {
    fontSize: 15,
    fontWeight: "400" as const,
  },
  subhead: {
    fontSize: 14,
    fontWeight: "500" as const,
  },
  footnote: {
    fontSize: 13,
    fontWeight: "400" as const,
  },
  caption1: {
    fontSize: 12,
    fontWeight: "500" as const,
  },
  caption2: {
    fontSize: 11,
    fontWeight: "600" as const,
    letterSpacing: 0.2,
  },
};

export const iosRadius = {
  cardLarge: 20,
  card: 16,
  button: 14,
  input: 12,
  pill: 24,
  badge: 8,
};

export const iosStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: iosColors.background,
  },
  card: {
    backgroundColor: iosColors.glassCard,
    borderRadius: iosRadius.card,
    borderWidth: 1,
    borderColor: iosColors.glassBorder,
    padding: 16,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 3,
  },
  cardLarge: {
    backgroundColor: iosColors.glassCard,
    borderRadius: iosRadius.cardLarge,
    borderWidth: 1,
    borderColor: iosColors.glassBorder,
    padding: 20,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.22,
    shadowRadius: 16,
    elevation: 4,
  },
  buttonPrimary: {
    width: "100%",
    backgroundColor: iosColors.systemBlue,
    borderRadius: iosRadius.button,
    paddingVertical: 15,
    paddingHorizontal: 18,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    shadowColor: iosColors.systemBlue,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonSuccess: {
    width: "100%",
    backgroundColor: iosColors.systemGreen,
    borderRadius: iosRadius.button,
    paddingVertical: 15,
    paddingHorizontal: 18,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    shadowColor: iosColors.systemGreen,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonDanger: {
    width: "100%",
    backgroundColor: iosColors.systemRed,
    borderRadius: iosRadius.button,
    paddingVertical: 15,
    paddingHorizontal: 18,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    shadowColor: iosColors.systemRed,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonWarning: {
    width: "100%",
    backgroundColor: iosColors.systemOrange,
    borderRadius: iosRadius.button,
    paddingVertical: 15,
    paddingHorizontal: 18,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    shadowColor: iosColors.systemOrange,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonSecondary: {
    width: "100%",
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    borderRadius: iosRadius.button,
    borderWidth: 1,
    borderColor: iosColors.glassBorder,
    paddingVertical: 14,
    paddingHorizontal: 18,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
  },
  input: {
    backgroundColor: "rgba(255, 255, 255, 0.04)",
    borderRadius: iosRadius.input,
    borderWidth: 1,
    borderColor: iosColors.glassBorder,
    color: "#FFFFFF",
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
  },
  divider: {
    height: 1,
    backgroundColor: iosColors.separator,
    marginVertical: 12,
  },
});
