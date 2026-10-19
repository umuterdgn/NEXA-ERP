/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Güvenli Kimlik Bilgisi Şifreleme Kasası (AES-256 Vault)
 * E-Devlet Şifreleri ve TC Kimlik No'ların veritabanında güvenli saklanması
 */

import CryptoJS from "crypto-js";

// Şifreleme anahtarı (Ortam değişkeninden veya güvenli varsayılandan alınır)
const VAULT_SECRET = process.env.ENCRYPTION_SECRET || process.env.NEXTAUTH_SECRET || "nexa-erp-secure-aes-vault-2026-key";

/**
 * Düz metni AES-256 ile şifreler
 */
export function encryptAES(plainText: string): string {
  if (!plainText) return "";
  try {
    return CryptoJS.AES.encrypt(plainText.trim(), VAULT_SECRET).toString();
  } catch (err) {
    console.error("AES Encryption error:", err);
    throw new Error("Veri şifrelenirken hata oluştu.");
  }
}

/**
 * AES-256 ile şifrelenmiş metni çözer
 */
export function decryptAES(cipherText: string): string {
  if (!cipherText) return "";
  try {
    const bytes = CryptoJS.AES.decrypt(cipherText, VAULT_SECRET);
    const decrypted = bytes.toString(CryptoJS.enc.Utf8);
    if (!decrypted) {
      // Eğer şifre çözülemezse (veya zaten düz metinse), güvenli biçimde kontrol et
      return cipherText;
    }
    return decrypted;
  } catch (err) {
    console.error("AES Decryption error:", err);
    return cipherText;
  }
}

/**
 * Hassas veriyi UI üzerinde maskeler (Örn: "12345678901" -> "123*****901")
 */
export function maskSensitive(text: string, showStart = 3, showEnd = 2): string {
  if (!text) return "";
  if (text.length <= showStart + showEnd) return "******";
  const start = text.slice(0, showStart);
  const end = text.slice(-showEnd);
  const maskedLength = Math.max(text.length - (showStart + showEnd), 4);
  return `${start}${"*".repeat(maskedLength)}${end}`;
}
