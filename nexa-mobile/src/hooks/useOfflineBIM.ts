/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Nexa ERP - Mobil Çevrimdışı BIM Modeli (Offline BIM) Hook'u
 *
 * Şantiyede internet olmadığında bile 3D BIM modelinin incelenebilmesi için,
 * Next.js merkezindeki devasa IFC/GLB modellerini expo-file-system ile cihazın
 * yerel hafızasına (FileSystem.documentDirectory) indiren ve durumunu yöneten hook.
 */

import { useState, useEffect, useCallback, useRef } from "react";
import * as FileSystem from "expo-file-system/legacy";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_BASE_URL } from "../lib/api";

const STORAGE_KEY_OFFLINE_BIM = "@nexa_offline_bim_meta";
export const OFFLINE_BIM_FILENAME = "model.ifc";

const WEB_BASE_URL = API_BASE_URL.replace(/\/api\/?$/, "");
export const DEFAULT_REMOTE_BIM_URL = `${WEB_BASE_URL}/model.ifc`;

export interface OfflineBIMState {
  isDownloaded: boolean;
  isDownloading: boolean;
  downloadProgress: number; // 0.0 - 1.0 (Yüzde hesaplama için)
  localModelUri: string | null;
  fileSizeMB: number | null;
  lastDownloadedAt: string | null;
  downloadModel: (remoteUrl?: string) => Promise<string | null>;
  deleteLocalModel: () => Promise<boolean>;
  checkLocalModel: () => Promise<boolean>;
}

export function useOfflineBIM(): OfflineBIMState {
  const [isDownloaded, setIsDownloaded] = useState<boolean>(false);
  const [isDownloading, setIsDownloading] = useState<boolean>(false);
  const [downloadProgress, setDownloadProgress] = useState<number>(0);
  const [localModelUri, setLocalModelUri] = useState<string | null>(null);
  const [fileSizeMB, setFileSizeMB] = useState<number | null>(null);
  const [lastDownloadedAt, setLastDownloadedAt] = useState<string | null>(null);

  const downloadTaskRef = useRef<FileSystem.DownloadResumable | null>(null);

  // Yerel dosya hedef yolu: file:///data/user/0/.../model.ifc
  const getTargetFileUri = (): string => {
    const baseDir = FileSystem.documentDirectory || "";
    return `${baseDir}${OFFLINE_BIM_FILENAME}`;
  };

  // 1. Cihaz hafızasındaki yerel modeli kontrol et
  const checkLocalModel = useCallback(async (): Promise<boolean> => {
    try {
      const targetUri = getTargetFileUri();
      const fileInfo = await FileSystem.getInfoAsync(targetUri);

      if (fileInfo.exists && !fileInfo.isDirectory) {
        setIsDownloaded(true);
        setLocalModelUri(targetUri);

        const bytes = (fileInfo as any).size || 0;
        const mb = Number((bytes / (1024 * 1024)).toFixed(2));
        setFileSizeMB(mb > 0.01 ? mb : 0.01);

        const savedMeta = await AsyncStorage.getItem(STORAGE_KEY_OFFLINE_BIM);
        if (savedMeta) {
          const parsed = JSON.parse(savedMeta);
          setLastDownloadedAt(parsed.downloadedAt || null);
        }
        return true;
      } else {
        setIsDownloaded(false);
        setLocalModelUri(null);
        setFileSizeMB(null);
        return false;
      }
    } catch (err) {
      console.warn("[useOfflineBIM] Yerel model sorgulama hatası:", err);
      setIsDownloaded(false);
      return false;
    }
  }, []);

  useEffect(() => {
    checkLocalModel();
  }, [checkLocalModel]);

  // 2. Merkeze yüklenmiş model.ifc dosyasını cihazın yerel hafızasına indir
  const downloadModel = useCallback(
    async (remoteUrl: string = DEFAULT_REMOTE_BIM_URL): Promise<string | null> => {
      try {
        setIsDownloading(true);
        setDownloadProgress(0);

        const targetUri = getTargetFileUri();

        // İndirme görevi oluştur (Progress Callback ile dairesel ilerleme)
        const downloadResumable = FileSystem.createDownloadResumable(
          remoteUrl,
          targetUri,
          {},
          (progressData) => {
            if (progressData.totalBytesExpectedToWrite > 0) {
              const fraction =
                progressData.totalBytesWritten /
                progressData.totalBytesExpectedToWrite;
              setDownloadProgress(Math.min(1, Math.max(0, fraction)));
            } else {
              // İçerik uzunluğu bilinmiyorsa temsili ilerleme
              setDownloadProgress((prev) => Math.min(0.9, prev + 0.1));
            }
          }
        );

        downloadTaskRef.current = downloadResumable;
        const result = await downloadResumable.downloadAsync();

        if (result && result.uri) {
          // İndirme tamamlandı
          setDownloadProgress(1);
          setIsDownloaded(true);
          setLocalModelUri(result.uri);

          // Dosya boyutunu ölç
          const info = await FileSystem.getInfoAsync(result.uri);
          const bytes = (info as any).size || 0;
          const mb = Number((bytes / (1024 * 1024)).toFixed(2));
          setFileSizeMB(mb > 0.01 ? mb : 0.01);

          const now = new Date().toISOString();
          setLastDownloadedAt(now);

          await AsyncStorage.setItem(
            STORAGE_KEY_OFFLINE_BIM,
            JSON.stringify({
              uri: result.uri,
              sizeBytes: bytes,
              downloadedAt: now,
              remoteUrl,
            })
          );

          console.log(`[useOfflineBIM] 3D BIM Modeli başarıyla cihaza indirildi: ${result.uri} (${mb} MB)`);
          return result.uri;
        } else {
          throw new Error("İndirme sonucu URI alınamadı");
        }
      } catch (error: any) {
        console.error("[useOfflineBIM] İndirme hatası:", error);
        // Hata durumunda standart fallback downloadAsync dene
        try {
          const targetUri = getTargetFileUri();
          const fallbackRes = await FileSystem.downloadAsync(remoteUrl, targetUri);
          if (fallbackRes.uri) {
            setIsDownloaded(true);
            setLocalModelUri(fallbackRes.uri);
            setDownloadProgress(1);
            return fallbackRes.uri;
          }
        } catch (fbErr) {
          console.error("[useOfflineBIM] Fallback indirme de başarısız oldu:", fbErr);
        }
        return null;
      } finally {
        setIsDownloading(false);
        downloadTaskRef.current = null;
      }
    },
    []
  );

  // 3. Yerel modeli sil (Depolama alanı boşaltma)
  const deleteLocalModel = useCallback(async (): Promise<boolean> => {
    try {
      const targetUri = getTargetFileUri();
      const info = await FileSystem.getInfoAsync(targetUri);
      if (info.exists) {
        await FileSystem.deleteAsync(targetUri, { idempotent: true });
      }
      await AsyncStorage.removeItem(STORAGE_KEY_OFFLINE_BIM);

      setIsDownloaded(false);
      setLocalModelUri(null);
      setFileSizeMB(null);
      setLastDownloadedAt(null);
      setDownloadProgress(0);
      return true;
    } catch (err) {
      console.error("[useOfflineBIM] Model silme hatası:", err);
      return false;
    }
  }, []);

  return {
    isDownloaded,
    isDownloading,
    downloadProgress,
    localModelUri,
    fileSizeMB,
    lastDownloadedAt,
    downloadModel,
    deleteLocalModel,
    checkLocalModel,
  };
}

export default useOfflineBIM;
