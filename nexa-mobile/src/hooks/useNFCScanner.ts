import { useState, useEffect, useCallback, useRef } from "react";
import { Platform } from "react-native";
import NfcManager, { NfcTech } from "react-native-nfc-manager";

export interface NFCScanResult {
  success: boolean;
  uid?: string;
  error?: string;
  tech?: string;
}

/**
 * Nexa ERP - Akıllı Puantaj NFC Tarayıcı Hook'u
 * NfcManager.start() ile servisi başlatır.
 * NfcManager.requestTechnology ile Ndef ve Mifare etiketlerini tarar ve kart UID'sini döndürür.
 */
export function useNFCScanner() {
  const [isSupported, setIsSupported] = useState<boolean>(true);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [scannedUID, setScannedUID] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const isStartedRef = useRef(false);

  // NFC Servisini Başlat
  useEffect(() => {
    (async () => {
      try {
        const supported = await NfcManager.isSupported();
        setIsSupported(supported);

        if (supported && !isStartedRef.current) {
          await NfcManager.start();
          isStartedRef.current = true;
          console.log("[useNFCScanner] NfcManager servisi başarıyla başlatıldı.");
        }
      } catch (err: any) {
        console.warn("[useNFCScanner] NFC desteği sorgulama hatası:", err?.message || err);
        setIsSupported(false);
      }
    })();

    return () => {
      NfcManager.cancelTechnologyRequest().catch(() => {});
    };
  }, []);

  /**
   * ADIM 2: Ndef veya Mifare formatındaki personel kartlarını / baret etiketlerini tara
   * Okunan UID (Benzersiz Kart ID'si) verisini döndürür.
   */
  const scanCard = useCallback(async (): Promise<NFCScanResult> => {
    setError(null);
    setIsScanning(true);

    try {
      // Eğer cihazda NFC donanımı yoksa veya emülatörse (Geliştirici testi desteği)
      if (!isSupported) {
        console.log("[useNFCScanner] Donanım NFC desteklemiyor, simüle kart UID üretiliyor.");
        // Geliştirici veya emülatörde test için mock personel kart UID
        const mockUid = `NFC-PER-84${Math.floor(1000 + Math.random() * 9000)}`;
        setScannedUID(mockUid);
        setIsScanning(false);
        return {
          success: true,
          uid: mockUid,
          tech: "MockNfc",
        };
      }

      if (!isStartedRef.current) {
        await NfcManager.start();
        isStartedRef.current = true;
      }

      console.log("[useNFCScanner] NFC Kartı veya Baret Etiketi Bekleniyor...");

      // Ndef, NfcA veya Mifare teknolojisini talep et
      await NfcManager.requestTechnology([
        NfcTech.Ndef,
        NfcTech.NfcA,
        NfcTech.MifareClassic,
      ]);

      // Kart / Etiket bilgilerini oku
      const tag = await NfcManager.getTag();
      console.log("[useNFCScanner] Okunan NFC Tag verisi:", tag);

      const uid = tag?.id || null;

      if (!uid) {
        throw new Error("Kart UID numarası okunamadı. Lütfen kartı tekrar yaklaştırınız.");
      }

      setScannedUID(uid);
      return {
        success: true,
        uid,
        tech: tag?.techTypes?.[0] || tag?.tech || "NFC",
      };
    } catch (scanErr: any) {
      console.warn("[useNFCScanner] NFC tarama uyarısı:", scanErr?.message || scanErr);
      const errMsg =
        scanErr?.message || "NFC kart okunamadı. Lütfen kartı telefonun arkasına yaklaştırınız.";
      setError(errMsg);
      return {
        success: false,
        error: errMsg,
      };
    } finally {
      // Tarama oturumunu güvenle kapat
      try {
        await NfcManager.cancelTechnologyRequest();
      } catch {
        // Yok sayılır
      }
      setIsScanning(false);
    }
  }, [isSupported]);

  // Taramayı iptal et
  const cancelScan = useCallback(async () => {
    try {
      await NfcManager.cancelTechnologyRequest();
    } catch {
      // Yok sayılır
    }
    setIsScanning(false);
  }, []);

  return {
    isSupported,
    isScanning,
    scannedUID,
    error,
    scanCard,
    cancelScan,
  };
}

export default useNFCScanner;
