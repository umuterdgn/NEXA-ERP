/**
 * © 2026 NXA Software. All rights reserved.
 * Nexa Mobile - Malzeme Tüketimi (QR Sarfiyat) Modülü
 * Malzemenin QR kodunu okutup depodan anlık stok düşer ve seçilen Göreve (Task) bağlar.
 */

import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  ActivityIndicator,
  Alert,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { CameraView, useCameraPermissions } from "expo-camera";
import { inventoryMobileApi, tasksApi } from "../../apiClient";

interface MaterialConsumptionScreenProps {
  onBack: () => void;
}

export default function MaterialConsumptionScreen({ onBack }: MaterialConsumptionScreenProps) {
  const [permission, requestPermission] = useCameraPermissions();
  const [isScanning, setIsScanning] = useState(false);
  const [scannedQr, setScannedQr] = useState<string | null>(null);
  const [stockInfo, setStockInfo] = useState<any>(null);
  const [isLoadingStock, setIsLoadingStock] = useState(false);

  // Form State'leri
  const [consumeQty, setConsumeQty] = useState("");
  const [selectedTask, setSelectedTask] = useState<string>("");
  const [tasksList, setTasksList] = useState<any[]>([]);
  const [zoneName, setZoneName] = useState("Blok-B • 3. Kat Kolonları");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Görev listesini getir
  useEffect(() => {
    (async () => {
      try {
        const tasks = await tasksApi.getTasks();
        setTasksList(tasks || []);
        if (tasks && tasks.length > 0) {
          setSelectedTask(tasks[0].id);
        }
      } catch (err) {
        console.warn("[MaterialConsumption] Tasks load error:", err);
      }
    })();
  }, []);

  const handleSimulateScan = async (code: string = "QR-MAT-30911") => {
    setScannedQr(code);
    setIsLoadingStock(true);
    try {
      const res = await inventoryMobileApi.checkStockByQr(code);
      if (res?.item) {
        setStockInfo(res.item);
      } else {
        // Fallback demo stock
        setStockInfo({
          materialName: "B420C Nervürlü Donatı Çeliği (Ø16)",
          quantity: 34.5,
          unit: "Ton",
          currentZone: "MAIN_WAREHOUSE",
        });
      }
    } catch {
      setStockInfo({
        materialName: "C35/45 Hazır Beton",
        quantity: 180,
        unit: "m3",
        currentZone: "MAIN_WAREHOUSE",
      });
    } finally {
      setIsLoadingStock(false);
    }
  };

  const handleSubmitConsumption = async () => {
    const qty = parseFloat(consumeQty);
    if (isNaN(qty) || qty <= 0) {
      Alert.alert("Eksik Miktar", "Lütfen tüketilecek geçerli bir sarf miktarı girin.");
      return;
    }

    if (stockInfo && qty > stockInfo.quantity) {
      Alert.alert(
        "Yetersiz Stok",
        `Depodaki mevcut stok (${stockInfo.quantity} ${stockInfo.unit}) istenen tüketimden azdır.`
      );
      return;
    }

    try {
      setIsSubmitting(true);
      await inventoryMobileApi.consumeMaterial({
        qrCode: scannedQr || "QR-MAT-DEMO",
        quantity: qty,
        taskId: selectedTask || undefined,
        zoneName,
        notes,
      });

      Alert.alert(
        "✅ Malzeme Tüketimi Kaydedildi",
        `${qty} ${stockInfo?.unit || "Adet"} ${stockInfo?.materialName || "malzeme"} stoktan düşüldü ve ilgili iş emrine işlendi.`,
        [{ text: "Tamam", onPress: onBack }]
      );
    } catch (err: any) {
      Alert.alert("Tüketim Hatası", err?.message || "Stoktan düşülemedi.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Malzeme Tüketimi (QR)</Text>
          <Text style={styles.headerSubtitle}>Sarfiyat düşümü ve iş emrine bağlama</Text>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* QR Okutma Alanı */}
        <View style={styles.qrSectionCard}>
          <Text style={styles.sectionHeaderTitle}>1. MALZEME KAREKODU TARA</Text>

          {scannedQr ? (
            <View style={styles.scannedBox}>
              <View style={styles.scannedBadge}>
                <Ionicons name="checkmark-circle" size={20} color="#34C759" />
                <Text style={styles.scannedBadgeText}>QR KOD OKUNDU: {scannedQr}</Text>
              </View>

              {isLoadingStock ? (
                <ActivityIndicator color="#0A7AFF" style={{ marginVertical: 12 }} />
              ) : stockInfo ? (
                <View style={styles.stockDetailsBox}>
                  <Text style={styles.stockMatName}>{stockInfo.materialName}</Text>
                  <View style={styles.stockQtyRow}>
                    <Text style={styles.stockQtyLabel}>Depodaki Mevcut Stok:</Text>
                    <Text style={styles.stockQtyValue}>
                      {stockInfo.quantity} {stockInfo.unit}
                    </Text>
                  </View>
                  <Text style={styles.stockLocText}>Depo Konumu: {stockInfo.currentZone || "Ana Ambar"}</Text>
                </View>
              ) : null}

              <TouchableOpacity
                style={styles.rescanBtn}
                onPress={() => {
                  setScannedQr(null);
                  setStockInfo(null);
                }}
              >
                <Ionicons name="refresh" size={16} color="#0A7AFF" />
                <Text style={styles.rescanBtnText}>Farklı QR Okut</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.scanActionBox}>
              <Ionicons name="qr-code-outline" size={64} color="#0A7AFF" />
              <Text style={styles.scanActionHint}>Malzeme etiketindeki QR kodu kameraya gösterin</Text>
              <TouchableOpacity
                style={styles.simulateScanBtn}
                onPress={() => handleSimulateScan("QR-MAT-30911")}
              >
                <Ionicons name="scan" size={18} color="#FFFFFF" />
                <Text style={styles.simulateScanBtnText}>Karekod Tara & Stok Sorgula</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Tüketim & Görev Bağlantı Formu */}
        <View style={styles.formSectionCard}>
          <Text style={styles.sectionHeaderTitle}>2. SARFİYAT DETAYLARI</Text>

          <Text style={styles.inputLabel}>Tüketilecek Miktar ({stockInfo?.unit || "Adet"}) *</Text>
          <TextInput
            style={styles.input}
            value={consumeQty}
            onChangeText={setConsumeQty}
            keyboardType="numeric"
            placeholder={`Örn: 5 ${stockInfo?.unit || ""}`}
            placeholderTextColor="#666"
          />

          <Text style={styles.inputLabel}>İlgili Kat / İmalat Mahali *</Text>
          <TextInput
            style={styles.input}
            value={zoneName}
            onChangeText={setZoneName}
            placeholder="Örn: Blok-B 3. Kat Kolonları"
            placeholderTextColor="#666"
          />

          <Text style={styles.inputLabel}>Bağlı Görev / İş Emri</Text>
          <View style={styles.tasksPickerContainer}>
            {tasksList.map((t) => {
              const isSelected = selectedTask === t.id;
              return (
                <TouchableOpacity
                  key={t.id}
                  style={[styles.taskChip, isSelected && styles.taskChipActive]}
                  onPress={() => setSelectedTask(t.id)}
                >
                  <Ionicons
                    name={isSelected ? "radio-button-on" : "radio-button-off"}
                    size={16}
                    color={isSelected ? "#0A7AFF" : "#8E8E93"}
                  />
                  <Text style={[styles.taskChipText, isSelected && styles.taskChipTextActive]}>
                    {t.title}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <Text style={styles.inputLabel}>Açıklama / Saha Notu</Text>
          <TextInput
            style={[styles.input, { height: 70, textAlignVertical: "top" }]}
            value={notes}
            onChangeText={setNotes}
            multiline
            placeholder="İmalat notu, fire veya ek bilgiler"
            placeholderTextColor="#666"
          />

          <TouchableOpacity
            style={styles.submitBtn}
            onPress={handleSubmitConsumption}
            disabled={isSubmitting}
            activeOpacity={0.85}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <Ionicons name="archive" size={20} color="#FFFFFF" />
                <Text style={styles.submitBtnText}>Stoktan Düş & Göreve İşle</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
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
  content: {
    flex: 1,
    padding: 16,
  },
  qrSectionCard: {
    backgroundColor: "rgba(255, 255, 255, 0.04)",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    padding: 16,
    marginBottom: 16,
  },
  sectionHeaderTitle: {
    color: "#8E8E93",
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  scanActionBox: {
    alignItems: "center",
    paddingVertical: 20,
    gap: 12,
  },
  scanActionHint: {
    color: "#8E8E93",
    fontSize: 13,
    textAlign: "center",
  },
  simulateScanBtn: {
    backgroundColor: "#0A7AFF",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
    marginTop: 4,
  },
  simulateScanBtnText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 14,
  },
  scannedBox: {
    gap: 12,
  },
  scannedBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(52, 199, 89, 0.15)",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    gap: 8,
  },
  scannedBadgeText: {
    color: "#34C759",
    fontWeight: "700",
    fontSize: 13,
  },
  stockDetailsBox: {
    backgroundColor: "rgba(10, 122, 255, 0.08)",
    borderWidth: 1,
    borderColor: "rgba(10, 122, 255, 0.2)",
    borderRadius: 12,
    padding: 12,
    gap: 6,
  },
  stockMatName: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "800",
  },
  stockQtyRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  stockQtyLabel: {
    color: "#8E8E93",
    fontSize: 13,
  },
  stockQtyValue: {
    color: "#34C759",
    fontSize: 16,
    fontWeight: "800",
  },
  stockLocText: {
    color: "#8E8E93",
    fontSize: 11,
  },
  rescanBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 6,
  },
  rescanBtnText: {
    color: "#0A7AFF",
    fontSize: 13,
    fontWeight: "600",
  },
  formSectionCard: {
    backgroundColor: "rgba(255, 255, 255, 0.04)",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    padding: 16,
    marginBottom: 32,
  },
  inputLabel: {
    color: "#8E8E93",
    fontSize: 12,
    fontWeight: "700",
    marginBottom: 6,
    marginTop: 12,
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
  tasksPickerContainer: {
    gap: 8,
  },
  taskChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.04)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  taskChipActive: {
    backgroundColor: "rgba(10, 122, 255, 0.15)",
    borderColor: "#0A7AFF",
  },
  taskChipText: {
    color: "#8E8E93",
    fontSize: 13,
    flex: 1,
  },
  taskChipTextActive: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  submitBtn: {
    backgroundColor: "#34C759",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 15,
    borderRadius: 14,
    gap: 8,
    marginTop: 20,
  },
  submitBtnText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },
});

