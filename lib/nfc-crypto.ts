/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * This code is the property of NXA Software.
 */

import CryptoJS from "crypto-js"

// Client-side'da çalışabilmesi için NEXT_PUBLIC_ kullanıldı veya fallback atandı.
const SECRET_KEY = process.env.NEXT_PUBLIC_NFC_SECRET_KEY || "mahirbakay-erp-super-secret-key-2026";

export interface NfcPayload {
  id: string
  timestamp: number
  company: string
}

/**
 * Encrypt NFC payload data using AES
 */
export function encryptNfcData(payload: NfcPayload): string {
  const jsonString = JSON.stringify(payload)
  const encrypted = CryptoJS.AES.encrypt(jsonString, SECRET_KEY).toString()
  return encrypted
}

/**
 * Decrypt NFC payload data using AES
 */
export function decryptNfcData(encryptedData: string): NfcPayload | null {
  try {
    if (!encryptedData) return null;

    // CryptoJS AES çıktıları her zaman "U2FsdGVkX1" (Salted__) ile başlar.
    // NDEF Text Record'un eklediği baştaki dil kodlarını atlamak için metni buradan kesiyoruz.
    const magicString = "U2FsdGVkX1";
    const startIndex = encryptedData.indexOf(magicString);
    
    if (startIndex === -1) {
      // Eğer bu kelime yoksa, bu bizim şifreli kartımız değildir.
      return null; 
    }

    // Baştaki ıvır zıvırı (Örn: "en", "tr") atıp gerçek şifreli metni alıyoruz
    const cleanEncryptedData = encryptedData.substring(startIndex);

    // Şimdi güvenle şifreyi çözebiliriz
    const bytes = CryptoJS.AES.decrypt(cleanEncryptedData, SECRET_KEY)
    const decryptedString = bytes.toString(CryptoJS.enc.Utf8)
    const payload = JSON.parse(decryptedString) as NfcPayload
    
    // Validate payload structure
    if (!payload.id || !payload.timestamp || !payload.company) {
      return null
    }
    
    return payload
  } catch (error) {
    console.error("NFC decryption error:", error)
    return null
  }
}

/**
 * Create NFC payload for personnel
 */
export function createPersonnelNfcPayload(personnelId: string): string {
  const payload: NfcPayload = {
    id: personnelId,
    timestamp: Date.now(),
    company: "MahirBakay"
  }
  return encryptNfcData(payload)
}
