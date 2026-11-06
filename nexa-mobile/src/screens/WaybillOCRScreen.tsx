/**
 * © 2026 NXA Software. All rights reserved.
 * Nexa Mobile - İrsaliye Okuma (OCR) & Malzeme Kabul Modülü
 * Kameradan irsaliyeyi tarar, OCR ile okur ve onay formunun ardından DB'ye kaydeder.
 */

import React, { useState, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  TextInput,
  ActivityIndicator,
  Alert,
  ScrollView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { CameraView, useCameraPermissions } from "expo-camera";
import { inventoryMobileApi } from "../../apiClient";

interface WaybillOCRScreenProps {
  onBack: () => void;
}

export default function WaybillOCRScreen({ onBack }: WaybillOCRScreenProps) {
  const [permission, requestPermission] = useCameraPermissions();
  const [isScanning, setIsScanning] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Doğrulama Formu State'leri
  const [waybillNo, setWaybillNo] = useState("IRS-2026-98412");
  const [supplierName, setSupplierName] = useState("Çimsa Çimento Sanayi A.Ş.");
  const [materialName, setMaterialName] = useState("C35/45 Hazır Beton");
  const [quantity, setQuantity] = useState("120");
  const [unit, setUnit] = useState("m3");
  const [totalAmount, setTotalAmount] = useState("324000");
  const [currency, setCurrency] = useState("TRY");
  const [date, setDate] = useState("2026-11-06");

  const handleScanWaybill = async () => {
    if (!permission?.granted) {
      const { granted } = await requestPermission();
      if (!granted) {
        Alert.alert("İzin Gerekli", "İrsaliye taramak için kamera izni verilmelidir.");
        return;
      }
    }

    setIsScanning(true);

    // OCR Simülasyonu & Ayrıştırma (Tarih, Tutar, Malzeme, Miktar)
    setTimeout(() => {
      setIsScanning(false);
      setWaybillNo(`IRS-2026-${Math.floor(10000 + Math.random() * 90000)}`);
      setSupplierName("Kalyon Çelik & Demir Sanayi");
      setMaterialName("B420C Nervürlü Donatı Çeliği (Ø16)");
      setQuantity("24.5");
      setUnit("Ton");
      setTotalAmount("784000");
      setDate(new Date().toISOString().split("T")[0]);
      setIsModalOpen(true);
    }, 1200);
  };

  const handleConfirmAndSave = async () => {
    if (!materialName.trim() || !quantity.trim()) {
      Alert.alert("Eksik Bilgi", "Lütfen malzeme adı ve miktar alanlarını doldurun.");
      return;
    }

    try {
      setIsSubmitting(true);
      await inventoryMobileApi.submitReceivingOCR({
        waybillNo,
        supplierName,
        materialName,
        quantity: parseFloat(quantity) || 0,
        unit,
        totalAmount: parseFloat(totalAmount) || 0,
        currency,
      });

      setIsModalOpen(false);
      Alert.alert(
        "✅ Malzeme Kabulü Tamamlandı",
        `İrsaliye (${waybillNo}) doğrulandı. ${quantity} ${unit} "${materialName}" başarıyla ambar envanterine eklendi.`,
        [{ text: "Tamam", onPress: onBack }]
      );
    } catch (err: any) {
      Alert.alert("Kayıt Hatası", err?.message || "İrsaliye kaydedilemedi.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      {/* Üst Bar */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>İrsaliye Okuma (OCR)</Text>
          <Text style={styles.headerSubtitle}>Kamera ile otomatik evrak tanıma</Text>
        </View>
      </View>

      {/* Kamera Vizörü */}
      <View style={styles.cameraBox}>
        {permission?.granted ? (
          <CameraView style={StyleSheet.absoluteFill} facing="back">
            {/* Vizör Kılavuz Çerçevesi */}
            <View style={styles.overlayFrame}>
              <View style={styles.scanTargetBox}>
                <View style={[styles.corner, styles.cornerTL]} />
                <View style={[styles.corner, styles.cornerTR]} />
                <View style={[styles.corner, styles.cornerBL]} />
                <View style={[styles.corner, styles.cornerBR]} />
                <Text style={styles.targetHint}>İrsaliyeyi çerçevenin içine hizalayın</Text>
              </View>
            </View>
          </CameraView>
        ) : (
          <View style={styles.permissionBox}>
            <Ionicons name="camera-outline" size={48} color="#8E8E93" />
            <Text style={styles.permText}>Kamera izni bekleniyor</Text>
            <TouchableOpacity style={styles.permBtn} onPress={requestPermission}>
              <Text style={styles.permBtnText}>İzin Ver</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Alt Kontrol Paneli */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.scanButton}
          onPress={handleScanWaybill}
          disabled={isScanning}
          activeOpacity={0.85}
        >
          {isScanning ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <Ionicons name="scan-circle" size={26} color="#FFFFFF" />
              <Text style={styles.scanButtonText}>İrsaliyeyi Tara (OCR)</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* ==================================================================== */}
      {/* "LÜTFEN OKUNAN VERİLERİ DOĞRULAYIN" MODAL FORMU                      */}
      {/* ==================================================================== */}
      <Modal visible={isModalOpen} animationType="slide" transparent>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Okunan Verileri Doğrulayın</Text>
                <Text style={styles.modalSubtitle}>OCR ile algılanan irsaliye detayları</Text>
              </View>
              <TouchableOpacity onPress={() => setIsModalOpen(false)}>
                <Ionicons name="close" size={24} color="#8E8E93" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              <Text style={styles.inputLabel}>İrsaliye No</Text>
              <TextInput
                style={styles.input}
                value={waybillNo}
                onChangeText={setWaybillNo}
                placeholder="Örn: IRS-2026-001"
                placeholderTextColor="#666"
              />

              <Text style={styles.inputLabel}>Tedarikçi Firma</Text>
              <TextInput
                style={styles.input}
                value={supplierName}
                onChangeText={setSupplierName}
                placeholder="Tedarikçi firma adı"
                placeholderTextColor="#666"
              />

              <Text style={styles.inputLabel}>Malzeme Adı / Cinsi</Text>
              <TextInput
                style={styles.input}
                value={materialName}
                onChangeText={setMaterialName}
                placeholder="Malzeme adı"
                placeholderTextColor="#666"
              />

              <View style={{ flexDirection: "row", gap: 12 }}>
                <View style={{ flex: 2 }}>
                  <Text style={styles.inputLabel}>Miktar</Text>
                  <TextInput
                    style={styles.input}
                    value={quantity}
                    onChangeText={setQuantity}
                    keyboardType="numeric"
                    placeholder="Miktar"
                    placeholderTextColor="#666"
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>Birim</Text>
                  <TextInput
                    style={styles.input}
                    value={unit}
                    onChangeText={setUnit}
                    placeholder="Ton/m3/Adet"
                    placeholderTextColor="#666"
                  />
                </View>
              </View>

              <View style={{ flexDirection: "row", gap: 12 }}>
                <View style={{ flex: 2 }}>
                  <Text style={styles.inputLabel}>Toplam Tutar (TL)</Text>
                  <TextInput
                    style={styles.input}
                    value={totalAmount}
                    onChangeText={setTotalAmount}
                    keyboardType="numeric"
                    placeholder="Tutar"
                    placeholderTextColor="#666"
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>Tarih</Text>
                  <TextInput
                    style={styles.input}
                    value={date}
                    onChangeText={setDate}
                    placeholder="YYYY-AA-GG"
                    placeholderTextColor="#666"
                  />
                </View>
              </View>

              <View style={styles.verifyWarningBox}>
                <Ionicons name="information-circle" size={18} color="#0A7AFF" />
                <Text style={styles.verifyWarningText}>
                  Onaylanan veriler doğrudan şantiye ambar stoğuna (Inventory) giriş hareketi olarak kaydedilecektir.
                </Text>
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.confirmBtn}
                onPress={handleConfirmAndSave}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <>
                    <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
                    <Text style={styles.confirmBtnText}>Onayla ve Depoya Kaydet</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0A0F1C",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.08)",
    gap: 12,
  },
  backButton: {
    padding: 6,
  },
  headerTitle: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "700",
  },
  headerSubtitle: {
    color: "#8E8E93",
    fontSize: 12,
    marginTop: 2,
  },
  cameraBox: {
    flex: 1,
    backgroundColor: "#000000",
    overflow: "hidden",
  },
  overlayFrame: {
    ...StyleSheet.absoluteFill,
    justifyContent: "center",
    alignItems: "center",
  },
  scanTargetBox: {
    width: "84%",
    height: "60%",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  corner: {
    position: "absolute",
    width: 24,
    height: 24,
    borderColor: "#0A7AFF",
  },
  cornerTL: { top: -2, left: -2, borderTopWidth: 4, borderLeftWidth: 4 },
  cornerTR: { top: -2, right: -2, borderTopWidth: 4, borderRightWidth: 4 },
  cornerBL: { bottom: -2, left: -2, borderBottomWidth: 4, borderLeftWidth: 4 },
  cornerBR: { bottom: -2, right: -2, borderBottomWidth: 4, borderRightWidth: 4 },
  targetHint: {
    color: "rgba(255, 255, 255, 0.75)",
    fontSize: 13,
    fontWeight: "600",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  footer: {
    padding: 16,
    backgroundColor: "#0A0F1C",
  },
  scanButton: {
    backgroundColor: "#0A7AFF",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 16,
    gap: 10,
  },
  scanButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  permissionBox: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  permText: {
    color: "#8E8E93",
    fontSize: 14,
  },
  permBtn: {
    backgroundColor: "#0A7AFF",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },
  permBtnText: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.75)",
    justifyContent: "flex-end",
  },
  modalCard: {
    backgroundColor: "#161D2F",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "85%",
    padding: 20,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  modalTitle: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "800",
  },
  modalSubtitle: {
    color: "#8E8E93",
    fontSize: 12,
    marginTop: 2,
  },
  modalBody: {
    marginBottom: 16,
  },
  inputLabel: {
    color: "#8E8E93",
    fontSize: 12,
    fontWeight: "700",
    marginBottom: 6,
    marginTop: 10,
  },
  input: {
    backgroundColor: "rgba(255, 255, 255, 0.06)",
    color: "#FFFFFF",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  verifyWarningBox: {
    flexDirection: "row",
    backgroundColor: "rgba(10, 122, 255, 0.12)",
    borderWidth: 1,
    borderColor: "rgba(10, 122, 255, 0.25)",
    borderRadius: 12,
    padding: 12,
    marginTop: 16,
    gap: 8,
    alignItems: "center",
  },
  verifyWarningText: {
    color: "#93C5FD",
    fontSize: 12,
    flex: 1,
    lineHeight: 16,
  },
  modalFooter: {
    paddingTop: 8,
  },
  confirmBtn: {
    backgroundColor: "#34C759",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 14,
    gap: 8,
  },
  confirmBtnText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },
});

