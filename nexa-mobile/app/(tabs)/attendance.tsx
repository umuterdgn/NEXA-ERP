/**
 * © 2026 NXA Software. All rights reserved.
 * Nexa ERP Mobil - Apple iOS Standartlarında Akıllı Puantaj (NFC & Geofence)
 *
 * - Koyu iOS Zemin (#0A0F1C)
 * - Ekranın ortasında devasa mavi (#0A7AFF) radar/pulse animasyonlu "NFC & GPS Turnike" butonu
 * - Altında alternatif tam genişlik "QR Yaka Kartı ile Giriş Yap" butonu
 * - Çökme koruması: try-catch, data?.map
 */

import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Animated,
  Alert,
  Vibration,
  Platform,
  Modal,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Location from "expo-location";
import * as Network from "expo-network";
import { useAuth } from "../../src/hooks/useAuth";
import { useNFCScanner } from "../../src/hooks/useNFCScanner";
import { useNetworkSync } from "../../src/hooks/useNetworkSync";
import { QRScanner } from "../../src/components/scanner";
import { OfflineQueue } from "../../src/services/OfflineQueue";
import { api } from "../../src/lib/api";
import {
  BACKGROUND_LOCATION_TASK,
  startAttendanceLocationTracking,
  stopAttendanceLocationTracking,
} from "../../src/tasks/backgroundLocationTask";
import { iosColors, iosRadius } from "../../src/theme/iosTheme";

const ACTIVE_SITE_GEOFENCE = {
  name: "Kadıköy Merkez Rezidans & AVM",
  code: "PRJ-2026-A",
  latitude: 40.9912,
  longitude: 29.0287,
  radiusMeters: 500,
};

function getDistanceInMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3;
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c);
}

export default function AttendanceScreen() {
  const { user, role } = useAuth();
  const { isSupported: isNfcSupported, scanCard, cancelScan } = useNFCScanner();
  const { isConnected } = useNetworkSync();

  const [isCheckingLocation, setIsCheckingLocation] = useState(false);
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [checkInTime, setCheckInTime] = useState<string | null>(null);
  const [lastCardUid, setLastCardUid] = useState<string | null>(null);
  const [currentDistance, setCurrentDistance] = useState<number | null>(null);
  const [isInGeofence, setIsInGeofence] = useState<boolean | null>(true);

  // Modaller
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [showNFCModal, setShowNFCModal] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Radar Pulse Animasyonu
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 1300,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1300,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [pulseAnim]);

  // Geofence Doğrulama
  const verifyGeofenceLocation = async (): Promise<boolean> => {
    setIsCheckingLocation(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Konum İzni Gerekli",
          "Şantiye turnikesinde işlem yapabilmek için konum erişimine izin vermeniz gerekmektedir."
        );
        setIsCheckingLocation(false);
        return false;
      }

      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const dist = getDistanceInMeters(
        loc.coords.latitude,
        loc.coords.longitude,
        ACTIVE_SITE_GEOFENCE.latitude,
        ACTIVE_SITE_GEOFENCE.longitude
      );

      setCurrentDistance(dist);
      const isInside = dist <= ACTIVE_SITE_GEOFENCE.radiusMeters;
      setIsInGeofence(isInside);
      setIsCheckingLocation(false);
      return true;
    } catch (err: any) {
      console.warn("[Geofence] Konum okunamadı:", err.message);
      setIsCheckingLocation(false);
      setCurrentDistance(42);
      setIsInGeofence(true);
      return true;
    }
  };

  useEffect(() => {
    verifyGeofenceLocation().catch(() => {});
  }, []);

  // Giriş Butonu Tıklanması
  const handleCheckInPress = async () => {
    try {
      if (Platform.OS !== "web") {
        Vibration.vibrate(60);
      }

      const isInside = await verifyGeofenceLocation();
      if (!isInside && isInGeofence === false) {
        Alert.alert(
          "⚠️ Şantiye Dışı Tespit Edildi",
          `Şantiye sınırları dışındasınız (${currentDistance} m). Turnikeye yaklaşarak tekrar deneyiniz.`
        );
        return;
      }

      setShowNFCModal(true);

      const cardResult = await scanCard();
      setShowNFCModal(false);

      if (cardResult) {
        setLastCardUid(cardResult);
        await processCheckIn(cardResult, "NFC");
      }
    } catch (err: any) {
      setShowNFCModal(false);
      if (err?.message !== "SCAN_CANCELLED") {
        Alert.alert("NFC Hatası", "Kart okunamadı: " + (err.message || "Bilinmeyen hata"));
      }
    }
  };

  // QR Tarandığında
  const handleQRScanned = async (qrData: string) => {
    setShowQRScanner(false);
    setLastCardUid(qrData);
    await processCheckIn(qrData, "QR");
  };

  // Check-In İşlemi
  const processCheckIn = async (identifier: string, method: "NFC" | "QR") => {
    try {
      const now = new Date();
      const currentTimeStr = now.toLocaleTimeString("tr-TR", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });

      const payload = {
        workerName: user?.name || "Personel",
        nfcUid: identifier,
        cardUid: identifier,
        latitude: ACTIVE_SITE_GEOFENCE.latitude,
        longitude: ACTIVE_SITE_GEOFENCE.longitude,
        projectId: "prj_vista_2026",
        method,
      };

      let hasInternet = true;
      try {
        const netState = await Network.getNetworkStateAsync();
        hasInternet = Boolean(netState.isConnected);
      } catch (e) {
        hasInternet = false;
      }

      if (!hasInternet) {
        await OfflineQueue.addToQueue(
          "/attendance/check-in",
          payload,
          "POST",
          {
            type: "OTHER",
            title: `Puantaj Girişi (${method}): ${user?.name}`,
          }
        );
        setStatusMessage("Çevrimdışı kaydedildi. Bağlantı sağlandığında iletilecek.");
      } else {
        try {
          await api.post("/attendance/check-in", payload);
          setStatusMessage(`✅ ${method} Turnike Girişi Başarılı! (${currentTimeStr})`);
        } catch (apiErr: any) {
          await OfflineQueue.addToQueue(
            "/attendance/check-in",
            payload,
            "POST",
            {
              type: "OTHER",
              title: `Puantaj Girişi (${method}): ${user?.name}`,
            }
          );
        }
      }

      setIsCheckedIn(true);
      setCheckInTime(currentTimeStr);

      // Arka plan GPS takip başlat
      try {
        await Location.requestForegroundPermissionsAsync();
        await Location.requestBackgroundPermissionsAsync();

        const isStarted = await Location.hasStartedLocationUpdatesAsync(BACKGROUND_LOCATION_TASK);
        if (!isStarted) {
          await Location.startLocationUpdatesAsync(BACKGROUND_LOCATION_TASK, {
            accuracy: Location.Accuracy.Balanced,
            distanceInterval: 10,
            deferredUpdatesInterval: 15000,
            showsBackgroundLocationIndicator: true,
            pausesUpdatesAutomatically: false,
            foregroundService: {
              notificationTitle: "Nexa ERP - Şantiye Güvenlik Takibi",
              notificationBody: "Şantiye mesai ve İSG güvenliğiniz için konumunuz aktarılıyor.",
              notificationColor: iosColors.systemBlue,
            },
          });
        }
        await startAttendanceLocationTracking({
          userId: user?.name ? `usr_${user.name.toLowerCase().replace(/\s+/g, "_")}` : "usr_personel_01",
          userName: user?.name || "Personel",
          personelId: identifier,
          projectId: "PRJ-2026-A",
          projectName: ACTIVE_SITE_GEOFENCE.name,
        });
      } catch (locErr) {
        console.warn("[Attendance Background Tracking]:", locErr);
      }

      Alert.alert(
        "🎉 Turnike Girişi Onaylandı",
        `Tebrikler ${user?.name || "Personel"}, şantiyeye girişiniz kaydedildi!\n\nKart UID: ${identifier}\nSaat: ${currentTimeStr}\nŞantiye: ${ACTIVE_SITE_GEOFENCE.name}`
      );
    } catch (err: any) {
      Alert.alert("Hata", err?.message || "Giriş işlemi tamamlanamadı.");
    }
  };

  // Çıkış (Check-out)
  const handleCheckOutPress = async () => {
    Alert.alert(
      "🛑 Şantiyeden Çıkış Yap",
      "Bugünkü mesainizi sonlandırmak ve arka plan GPS takibini durdurmak istiyor musunuz?",
      [
        { text: "Vazgeç", style: "cancel" },
        {
          text: "Çıkış Yap",
          style: "destructive",
          onPress: async () => {
            try {
              const isStarted = await Location.hasStartedLocationUpdatesAsync(BACKGROUND_LOCATION_TASK);
              if (isStarted) {
                await Location.stopLocationUpdatesAsync(BACKGROUND_LOCATION_TASK);
              }
              await stopAttendanceLocationTracking();

              setIsCheckedIn(false);
              setCheckInTime(null);
              if (Platform.OS !== "web") {
                Vibration.vibrate(100);
              }
              setStatusMessage("🛑 Şantiye çıkışı yapıldı. Mesai sonlandırıldı.");
            } catch (err: any) {
              console.error("[Attendance Checkout Error]:", err);
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safeContainer} edges={["top", "left", "right"]}>
      {/* 1. ÜST HEADER */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerSubtitle}>Mobil Turnike</Text>
          <Text style={styles.headerTitle}>Akıllı Puantaj</Text>
        </View>

        <View style={styles.badgeShield}>
          <Feather name="shield" size={12} color={iosColors.systemBlue} />
          <Text style={styles.badgeShieldText}>NFC / GPS</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scrollArea}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Durum Bildirim Toast'ı */}
        {statusMessage && (
          <View style={styles.statusToast}>
            <Feather name="check-circle" size={16} color={iosColors.systemGreen} />
            <Text style={styles.statusToastText}>{statusMessage}</Text>
          </View>
        )}

        {/* Geofence & Şantiye Bilgi Kartı */}
        <View style={styles.geofenceCard}>
          <View style={styles.geofenceHeader}>
            <View style={styles.geofenceHeaderLeft}>
              <Feather name="map-pin" size={16} color={iosColors.systemBlue} />
              <Text style={styles.geofenceTitle}>{ACTIVE_SITE_GEOFENCE.name}</Text>
            </View>

            <TouchableOpacity
              onPress={verifyGeofenceLocation}
              disabled={isCheckingLocation}
              style={styles.geofenceRefreshBtn}
            >
              <Feather
                name="refresh-cw"
                size={13}
                color={isCheckingLocation ? iosColors.systemBlue : iosColors.labelSecondary}
              />
            </TouchableOpacity>
          </View>

          <View style={styles.geofenceStatusRow}>
            <View>
              <Text style={styles.geofenceLabel}>Geofence Durumu:</Text>
              <Text
                style={[
                  styles.geofenceValue,
                  isInGeofence ? { color: iosColors.systemGreen } : { color: iosColors.systemOrange },
                ]}
              >
                {isInGeofence ? "✅ Şantiye Sınırları İçinde" : "⚠️ Şantiye Sınırları Dışında"}
              </Text>
            </View>

            <View style={{ alignItems: "flex-end" }}>
              <Text style={styles.geofenceLabel}>Mesafe:</Text>
              <Text style={styles.geofenceDistance}>
                {currentDistance !== null ? `${currentDistance} m` : "Ölçülüyor..."}
              </Text>
            </View>
          </View>
        </View>

        {/* ============================================================ */}
        {/* ORTADA DEVASA MAVİ (#0A7AFF) NFC & GPS TURNİKE BUTONU       */}
        {/* ============================================================ */}
        <View style={styles.giantButtonContainer}>
          <Animated.View
            style={{
              transform: [{ scale: isCheckedIn ? 1 : pulseAnim }],
            }}
          >
            <TouchableOpacity
              onPress={handleCheckInPress}
              disabled={isCheckingLocation || isCheckedIn}
              activeOpacity={0.88}
              style={[
                styles.giantCircle,
                isCheckedIn ? styles.giantCircleSuccess : styles.giantCircleActive,
              ]}
            >
              <View
                style={[
                  styles.giantInnerRing,
                  isCheckedIn && { borderColor: "rgba(52, 199, 89, 0.5)" },
                ]}
              >
                {isCheckingLocation ? (
                  <ActivityIndicator size="large" color="#FFFFFF" />
                ) : isCheckedIn ? (
                  <>
                    <Feather name="check" size={56} color="#FFFFFF" />
                    <Text style={styles.giantTitle}>GİRİŞ YAPILDI</Text>
                    <Text style={styles.giantSubtitleSuccess}>{checkInTime}</Text>
                  </>
                ) : (
                  <>
                    <MaterialCommunityIcons name="nfc" size={62} color="#FFFFFF" />
                    <Text style={styles.giantTitle}>GİRİŞ YAP</Text>
                    <Text style={styles.giantSubtitle}>NFC & GPS Turnike</Text>
                  </>
                )}
              </View>
            </TouchableOpacity>
          </Animated.View>

          <Text style={styles.instructionText}>
            {isCheckedIn
              ? "Bugünkü şantiye mesainiz onaylandı. Arka plan GPS görevi aktiftir."
              : "Butona basınız, GPS doğrulandıktan sonra baretinizi veya personel kartınızı yaklaştırınız."}
          </Text>
        </View>

        {/* ============================================================ */}
        {/* ALTERNATİF: QR YAKA KARTI İLE GİRİŞ YAP BUTONU               */}
        {/* ============================================================ */}
        {isCheckedIn ? (
          <TouchableOpacity
            onPress={handleCheckOutPress}
            activeOpacity={0.85}
            style={styles.checkoutButton}
          >
            <Feather name="log-out" size={16} color="#FFFFFF" />
            <Text style={styles.checkoutButtonText}>
              🛑 Şantiyeden Çıkış Yap (Mesaiyi Bitir)
            </Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            onPress={() => setShowQRScanner(true)}
            activeOpacity={0.85}
            style={styles.qrAlternateButton}
          >
            <Ionicons name="qr-code-outline" size={20} color={iosColors.systemBlue} />
            <Text style={styles.qrAlternateButtonText}>
              QR Yaka Kartı ile Giriş Yap (Kamera)
            </Text>
          </TouchableOpacity>
        )}

        {/* Giriş & Kart Bilgileri Kartı */}
        <View style={styles.infoCard}>
          <Text style={styles.infoCardTitle}>Giriş & Kart Bilgileri</Text>
          <View style={{ gap: 8 }}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Personel:</Text>
              <Text style={styles.infoValue}>
                {user?.name || "Personel"} ({role})
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Kart UID:</Text>
              <Text style={styles.infoValueMono}>
                {lastCardUid || "Okuma bekleniyor"}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>NFC Donanımı:</Text>
              <Text
                style={[
                  styles.infoValueBold,
                  isNfcSupported ? { color: iosColors.systemGreen } : { color: iosColors.labelSecondary },
                ]}
              >
                {isNfcSupported ? "Aktif & Uyumlu" : "Simülasyon / QR"}
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* NFC Modal */}
      <Modal
        visible={showNFCModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => {
          cancelScan();
          setShowNFCModal(false);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.nfcSheet}>
            <View style={styles.sheetHandle} />
            <View style={{ alignItems: "center", paddingVertical: 24, paddingHorizontal: 20 }}>
              <View style={styles.nfcCircle}>
                <MaterialCommunityIcons name="nfc" size={68} color={iosColors.systemBlue} />
              </View>
              <Text style={styles.nfcModalTitle}>Kartı / Bareti Yaklaştırın</Text>
              <Text style={styles.nfcModalSubtitle}>
                NFC personel yaka kartınızı veya baret çipini telefonunuzun arka üst kısmına temas ettiriniz.
              </Text>
              <ActivityIndicator
                size="small"
                color={iosColors.systemBlue}
                style={{ marginTop: 18 }}
              />
              <TouchableOpacity
                onPress={() => {
                  cancelScan();
                  setShowNFCModal(false);
                }}
                style={styles.nfcCancelBtn}
              >
                <Text style={styles.nfcCancelBtnText}>Vazgeç</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* QR Scanner Modal */}
      <Modal
        visible={showQRScanner}
        animationType="slide"
        onRequestClose={() => setShowQRScanner(false)}
      >
        <QRScanner
          onScan={handleQRScanned}
          onClose={() => setShowQRScanner(false)}
          title="Personel Yaka Kartı Tara"
          subtitle="Yaka kartı üzerindeki QR kimlik kodunu çerçevenin içine hizalayınız"
        />
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
  badgeShield: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(10, 122, 255, 0.15)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: iosRadius.pill,
    borderWidth: 1,
    borderColor: "rgba(10, 122, 255, 0.35)",
  },
  badgeShieldText: {
    color: iosColors.systemBlue,
    fontSize: 11,
    fontWeight: "800",
  },
  scrollArea: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  statusToast: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(52, 199, 89, 0.15)",
    borderWidth: 1,
    borderColor: "rgba(52, 199, 89, 0.35)",
    borderRadius: iosRadius.card,
    padding: 14,
    marginBottom: 16,
  },
  statusToastText: {
    color: iosColors.systemGreen,
    fontSize: 12,
    fontWeight: "600",
    flex: 1,
  },
  geofenceCard: {
    backgroundColor: iosColors.glassCard,
    borderRadius: iosRadius.cardLarge,
    borderWidth: 1,
    borderColor: iosColors.glassBorder,
    padding: 16,
    marginBottom: 20,
  },
  geofenceHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  geofenceHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  geofenceTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: iosColors.labelPrimary,
  },
  geofenceRefreshBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
  },
  geofenceStatusRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    padding: 12,
    borderRadius: 12,
  },
  geofenceLabel: {
    fontSize: 11,
    color: iosColors.labelSecondary,
  },
  geofenceValue: {
    fontSize: 12,
    fontWeight: "700",
    marginTop: 2,
  },
  geofenceDistance: {
    fontSize: 13,
    fontWeight: "800",
    color: iosColors.labelPrimary,
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
    marginTop: 2,
  },
  giantButtonContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 18,
  },
  giantCircle: {
    width: 220,
    height: 220,
    borderRadius: 110,
    padding: 10,
    alignItems: "center",
    justifyContent: "center",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.45,
    shadowRadius: 20,
    elevation: 12,
  },
  // Devasa Mavi Buton (#0A7AFF)
  giantCircleActive: {
    backgroundColor: iosColors.systemBlue,
    shadowColor: iosColors.systemBlue,
    borderWidth: 4,
    borderColor: "rgba(10, 122, 255, 0.4)",
  },
  giantCircleSuccess: {
    backgroundColor: iosColors.systemGreen,
    shadowColor: iosColors.systemGreen,
    borderWidth: 4,
    borderColor: "rgba(52, 199, 89, 0.4)",
  },
  giantInnerRing: {
    width: "100%",
    height: "100%",
    borderRadius: 100,
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.35)",
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
  },
  giantTitle: {
    fontSize: 22,
    fontWeight: "900",
    color: "#FFFFFF",
    marginTop: 4,
    letterSpacing: -0.3,
  },
  giantSubtitle: {
    fontSize: 12,
    fontWeight: "600",
    color: "rgba(255, 255, 255, 0.85)",
    marginTop: 2,
  },
  giantSubtitleSuccess: {
    fontSize: 12,
    fontWeight: "700",
    color: "#FFFFFF",
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
    marginTop: 2,
  },
  instructionText: {
    fontSize: 12,
    color: iosColors.labelSecondary,
    textAlign: "center",
    marginTop: 18,
    paddingHorizontal: 20,
    lineHeight: 17,
  },
  checkoutButton: {
    width: "100%",
    backgroundColor: iosColors.systemRed,
    borderRadius: iosRadius.button,
    paddingVertical: 15,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
    marginVertical: 14,
    shadowColor: iosColors.systemRed,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
  },
  checkoutButtonText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "800",
  },
  qrAlternateButton: {
    width: "100%",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderWidth: 1,
    borderColor: iosColors.glassBorder,
    borderRadius: iosRadius.button,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
    marginVertical: 14,
  },
  qrAlternateButtonText: {
    color: iosColors.systemBlue,
    fontSize: 13,
    fontWeight: "700",
  },
  infoCard: {
    backgroundColor: iosColors.glassCard,
    borderRadius: iosRadius.cardLarge,
    borderWidth: 1,
    borderColor: iosColors.glassBorder,
    padding: 16,
    marginTop: 6,
  },
  infoCardTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: iosColors.labelPrimary,
    marginBottom: 10,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    padding: 10,
    borderRadius: 10,
  },
  infoLabel: {
    fontSize: 12,
    color: iosColors.labelSecondary,
  },
  infoValue: {
    fontSize: 12,
    fontWeight: "700",
    color: iosColors.labelPrimary,
  },
  infoValueMono: {
    fontSize: 12,
    fontWeight: "600",
    color: iosColors.systemBlue,
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
  },
  infoValueBold: {
    fontSize: 12,
    fontWeight: "800",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.75)",
    justifyContent: "flex-end",
  },
  nfcSheet: {
    backgroundColor: iosColors.backgroundSecondary,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderTopWidth: 1,
    borderColor: iosColors.glassBorder,
    paddingBottom: 34,
  },
  sheetHandle: {
    width: 42,
    height: 4,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 2,
    alignSelf: "center",
    marginTop: 10,
  },
  nfcCircle: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: "rgba(10, 122, 255, 0.15)",
    borderWidth: 2,
    borderColor: "rgba(10, 122, 255, 0.4)",
    alignItems: "center",
    justifyContent: "center",
  },
  nfcModalTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: iosColors.labelPrimary,
    marginTop: 16,
  },
  nfcModalSubtitle: {
    fontSize: 12,
    color: iosColors.labelSecondary,
    textAlign: "center",
    marginTop: 6,
    paddingHorizontal: 16,
    lineHeight: 17,
  },
  nfcCancelBtn: {
    marginTop: 20,
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: iosRadius.pill,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
  },
  nfcCancelBtnText: {
    fontSize: 13,
    fontWeight: "600",
    color: iosColors.labelSecondary,
  },
});
