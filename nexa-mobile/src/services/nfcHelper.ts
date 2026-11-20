/**
 * © 2026 NXA Software. All rights reserved.
 * Nexa ERP Mobil - Güvenli NFC Yardımcısı (Expo Go Graceful Fallback)
 * Expo Go içinde çökmeden donanım desteğini kontrol eder; destek yoksa QR/GPS kullanılır.
 */

export interface NfcCheckResult {
  supported: boolean;
  reason?: string;
}

export async function checkNfcAvailability(): Promise<NfcCheckResult> {
  try {
    // Dynamic require: Expo Go veya NFC modülü derlenmemiş ortamlarda crash önlenir
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const nfcMod = require("react-native-nfc-manager");
    const NfcManager = nfcMod?.default;
    if (!NfcManager || typeof NfcManager.isSupported !== "function") {
      return {
        supported: false,
        reason: "Bu ortamda NFC modülü kullanılamıyor, QR veya GPS ile devam edin.",
      };
    }
    const supported = await NfcManager.isSupported();
    return {
      supported: Boolean(supported),
      reason: supported
        ? undefined
        : "Cihazda NFC donanımı bulunamadı; QR veya GPS doğrulaması aktif.",
    };
  } catch {
    return {
      supported: false,
      reason: "Expo Go ortamında NFC devre dışı — QR veya GPS doğrulaması kullanılır.",
    };
  }
}

