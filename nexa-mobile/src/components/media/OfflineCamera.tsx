import React, { useState, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  Vibration,
  Platform,
} from "react-native";
import {
  CameraView,
  useCameraPermissions,
  CameraType,
  FlashMode,
} from "expo-camera";
import * as FileSystem from "expo-file-system/legacy";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { SafeAreaView } from "react-native-safe-area-context";

export const UPLOAD_QUEUE_STORAGE_KEY = "@nexa_offline_upload_queue";

export interface QueuedMediaItem {
  id: string;
  localUri: string;
  fileName: string;
  capturedAt: string;
  status: "PENDING" | "UPLOADING" | "UPLOADED" | "FAILED";
  taskId?: string;
  notes?: string;
}

export interface OfflineCameraProps {
  onPhotoQueued?: (item: QueuedMediaItem) => void;
  onClose: () => void;
  taskId?: string;
  title?: string;
}

/**
 * AsyncStorage üzerindeki mevcut yükleme kuyruğunu döner
 */
export async function getOfflineUploadQueue(): Promise<QueuedMediaItem[]> {
  try {
    const raw = await AsyncStorage.getItem(UPLOAD_QUEUE_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (error) {
    console.error("[OfflineCamera] Kuyruk okuma hatası:", error);
    return [];
  }
}

/**
 * Kuyruğa yeni medya öğesi ekler
 */
export async function enqueueOfflineMedia(
  item: QueuedMediaItem
): Promise<QueuedMediaItem[]> {
  const currentQueue = await getOfflineUploadQueue();
  const updatedQueue = [item, ...currentQueue];
  await AsyncStorage.setItem(
    UPLOAD_QUEUE_STORAGE_KEY,
    JSON.stringify(updatedQueue)
  );
  return updatedQueue;
}

/**
 * Nexa ERP - Offline Saha Fotoğraf Çekim & Medya Kuyruğu Bileşeni
 * İnternet bağlantısı olmasa dahi fotoğrafları güvenle yerel hafızaya kaydeder ve yükleme kuyruğuna alır.
 */
export const OfflineCamera: React.FC<OfflineCameraProps> = ({
  onPhotoQueued,
  onClose,
  taskId,
  title = "Saha Görev Kanıtı Fotoğrafı",
}) => {
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<CameraType>("back");
  const [flash, setFlash] = useState<FlashMode>("off");
  const [isCapturing, setIsCapturing] = useState(false);
  const [capturedUri, setCapturedUri] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const cameraRef = useRef<CameraView>(null);

  if (!permission) {
    return (
      <View className="flex-1 bg-slate-950 items-center justify-center">
        <ActivityIndicator size="large" color="#10b981" />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <SafeAreaView className="flex-1 bg-slate-950 items-center justify-center px-6">
        <Text className="text-white text-xl font-bold mb-3 text-center">
          Kamera İzni Gerekli
        </Text>
        <Text className="text-slate-400 text-sm text-center mb-6">
          Saha fotoğrafı çekmek ve çevrimdışı kanıt kaydetmek için kamera izni
          veriniz.
        </Text>
        <TouchableOpacity
          onPress={requestPermission}
          className="w-full py-3.5 bg-emerald-500 rounded-xl items-center mb-3"
        >
          <Text className="text-slate-950 font-bold">İzin Ver</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={onClose}
          className="w-full py-3 bg-slate-900 border border-slate-800 rounded-xl items-center"
        >
          <Text className="text-slate-400">Kapat</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  // Fotoğraf Çekme İşlemi
  const handleCapturePhoto = async () => {
    if (!cameraRef.current || isCapturing) return;

    try {
      setIsCapturing(true);
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.85,
        skipProcessing: false,
      });

      if (photo?.uri) {
        if (Platform.OS !== "web") {
          Vibration.vibrate(50);
        }
        setCapturedUri(photo.uri);
      }
    } catch (err: any) {
      console.error("[OfflineCamera] Fotoğraf çekilemedi:", err);
      Alert.alert("Hata", "Fotoğraf çekilirken bir hata oluştu.");
    } finally {
      setIsCapturing(false);
    }
  };

  // Çekilen Fotoğrafı Yerel Hafızaya (FileSystem) ve AsyncStorage Kuyruğuna Kaydetme
  const handleSaveToQueue = async () => {
    if (!capturedUri || isSaving) return;

    setIsSaving(true);
    try {
      const timestamp = Date.now();
      const fileName = `nexa_evidence_${timestamp}.jpg`;

      // Hedef yerel dosya yolu (documentDirectory)
      let finalUri = capturedUri;
      if (FileSystem.documentDirectory) {
        const targetDir = `${FileSystem.documentDirectory}nexa_media/`;
        
        // Klasör yoksa oluştur
        const dirInfo = await FileSystem.getInfoAsync(targetDir);
        if (!dirInfo.exists) {
          await FileSystem.makeDirectoryAsync(targetDir, { intermediates: true });
        }

        const targetPath = `${targetDir}${fileName}`;
        await FileSystem.copyAsync({
          from: capturedUri,
          to: targetPath,
        });
        finalUri = targetPath;
      }

      // Medya Kuyruk Nesnesi
      const queuedItem: QueuedMediaItem = {
        id: `media_${timestamp}_${Math.random().toString(36).substring(2, 7)}`,
        localUri: finalUri,
        fileName,
        capturedAt: new Date().toISOString(),
        status: "PENDING",
        taskId: taskId || "GENERAL_TASK",
        notes: "Saha mobil kamerasıyla çevrimdışı çekildi",
      };

      // AsyncStorage yükleme kuyruğuna ekle
      const queue = await enqueueOfflineMedia(queuedItem);

      if (Platform.OS !== "web") {
        Vibration.vibrate(100);
      }

      console.log(`[OfflineCamera] Fotoğraf kuyruğa alındı. Toplam bekleyen: ${queue.length}`);

      Alert.alert(
        "Kuyruğa Eklendi (Offline)",
        `Fotoğraf cihazın güvenli hafızasına kaydedildi ve yükleme kuyruğuna eklendi (Kuyrukta: ${queue.length} öğe). İnternet bağlantısı sağlandığında otomatik yüklenecektir.`,
        [
          {
            text: "Tamam",
            onPress: () => {
              if (onPhotoQueued) {
                onPhotoQueued(queuedItem);
              }
              onClose();
            },
          },
        ]
      );
    } catch (err: any) {
      console.error("[OfflineCamera] Kaydetme hatası:", err);
      Alert.alert("Kaydedilemedi", "Fotoğraf yerel hafızaya kaydedilemedi.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <View className="flex-1 bg-black">
      {capturedUri ? (
        // Fotoğraf Önizleme ve Kuyruğa Kaydetme Ekranı
        <SafeAreaView className="flex-1 bg-slate-950 justify-between">
          <View className="px-5 py-4 border-b border-slate-800 flex-row items-center justify-between">
            <View>
              <Text className="text-emerald-400 text-xs font-bold uppercase tracking-widest">
                Önizleme & Doğrulama
              </Text>
              <Text className="text-white text-base font-bold">
                Çekilen Fotoğraf
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => setCapturedUri(null)}
              className="w-8 h-8 rounded-full bg-slate-800 items-center justify-center"
            >
              <Text className="text-white font-bold">✕</Text>
            </TouchableOpacity>
          </View>

          <View className="flex-1 p-4 items-center justify-center">
            <Image
              source={{ uri: capturedUri }}
              className="w-full h-full rounded-2xl bg-slate-900 border border-slate-800"
              resizeMode="contain"
            />
          </View>

          <View className="p-6 bg-slate-900/90 border-t border-slate-800 gap-3">
            <TouchableOpacity
              onPress={handleSaveToQueue}
              disabled={isSaving}
              activeOpacity={0.85}
              className="w-full py-4 bg-emerald-500 rounded-xl items-center justify-center flex-row gap-2 shadow-lg shadow-emerald-500/20"
            >
              {isSaving ? (
                <>
                  <ActivityIndicator size="small" color="#022c22" />
                  <Text className="text-slate-950 font-bold text-base">
                    Yerel Hafızaya Kaydediliyor...
                  </Text>
                </>
              ) : (
                <>
                  <Text className="text-base">💾</Text>
                  <Text className="text-slate-950 font-bold text-base">
                    Yerel Hafızaya & Kuyruğa Kaydet
                  </Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setCapturedUri(null)}
              disabled={isSaving}
              className="w-full py-3 bg-slate-800 rounded-xl items-center"
            >
              <Text className="text-slate-300 font-semibold text-sm">
                Yeniden Çek
              </Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      ) : (
        // Canlı Kamera Ekranı
        <CameraView
          ref={cameraRef}
          facing={facing}
          flash={flash}
          className="flex-1"
        >
          <SafeAreaView className="flex-1 justify-between">
            {/* Üst Kontrol Çubuğu */}
            <View className="px-5 py-3 flex-row items-center justify-between bg-slate-950/60 backdrop-blur-md">
              <TouchableOpacity
                onPress={onClose}
                className="w-9 h-9 rounded-full bg-slate-900/80 items-center justify-center border border-slate-700"
              >
                <Text className="text-white font-bold text-base">✕</Text>
              </TouchableOpacity>

              <View className="items-center">
                <Text className="text-white text-sm font-bold">{title}</Text>
                {taskId && (
                  <Text className="text-emerald-400 text-[11px] font-mono">
                    Görev: #{taskId}
                  </Text>
                )}
              </View>

              <TouchableOpacity
                onPress={() =>
                  setFlash((prev) => (prev === "off" ? "on" : "off"))
                }
                className={`w-9 h-9 rounded-full items-center justify-center border ${
                  flash === "on"
                    ? "bg-amber-500/30 border-amber-400"
                    : "bg-slate-900/80 border-slate-700"
                }`}
              >
                <Text className="text-sm">{flash === "on" ? "⚡" : "🔕"}</Text>
              </TouchableOpacity>
            </View>

            {/* Alt Deklanşör & Kamera Değiştirme */}
            <View className="p-8 pb-10 bg-slate-950/60 backdrop-blur-md flex-row items-center justify-around">
              {/* Boş dengeleyici veya galeri butonu */}
              <View className="w-12 h-12" />

              {/* Deklanşör Butonu */}
              <TouchableOpacity
                onPress={handleCapturePhoto}
                disabled={isCapturing}
                activeOpacity={0.7}
                className="w-20 h-20 rounded-full border-4 border-emerald-400 bg-white/20 items-center justify-center shadow-lg shadow-emerald-500/30"
              >
                <View className="w-14 h-14 rounded-full bg-emerald-500 items-center justify-center">
                  {isCapturing && (
                    <ActivityIndicator size="small" color="#090d16" />
                  )}
                </View>
              </TouchableOpacity>

              {/* Kamera Çevir (Ön / Arka) */}
              <TouchableOpacity
                onPress={() =>
                  setFacing((prev) => (prev === "back" ? "front" : "back"))
                }
                className="w-12 h-12 rounded-full bg-slate-900/80 border border-slate-700 items-center justify-center"
              >
                <Text className="text-lg">🔄</Text>
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </CameraView>
      )}
    </View>
  );
};

export default OfflineCamera;
