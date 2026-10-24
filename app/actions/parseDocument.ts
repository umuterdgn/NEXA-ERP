/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Akıllı Evrak & OCR Belge Çözümleme Server Action
 */

"use server";

export interface ParsedDocumentResult {
  success: boolean;
  documentType: string;
  yibfNo: string;
  licenseNo: string;
  issueDate: string;
  expiryDate: string;
  ownerName: string;
  buildingClass: string;
  totalArea: string;
  blockParcel: string;
  bearingCapacity?: string;
  settlementAmount?: string;
  confidence: number;
  extractedText: string;
  signatureStatus: "SIGNED_VERIFIED" | "PENDING_VERIFICATION" | "INVALID";
  complianceStatus: "COMPLIANT" | "DEFICIENT" | "CRITICAL_MISSING";
  missingFields: string[];
  error?: string;
}

export async function parseDocument(formData: FormData): Promise<ParsedDocumentResult> {
  try {
    const file = formData.get("file") as File | null;
    const documentCategory = (formData.get("documentCategory") as string) || "RUHSAT";

    const fileName = file?.name || "resmi_evrak.pdf";
    const fileSize = file?.size || 1024;

    // Simulate OCR delay (1.2s)
    await new Promise((resolve) => setTimeout(resolve, 1200));

    // Intelligence heuristic based on document category and file name
    const isZeminEtudu = documentCategory === "ZEMIN" || fileName.toLowerCase().includes("zemin");
    const isStatik = documentCategory === "STATIK" || fileName.toLowerCase().includes("statik");
    const isLaboratuvar = documentCategory === "LAB" || fileName.toLowerCase().includes("karot") || fileName.toLowerCase().includes("deney");

    let docType = "Yapı Ruhsatı ve İmar İzin Belgesi";
    let text = `T.C. ÇEVRE, ŞEHİRCİLİK VE İKLİM DEĞİŞİKLİĞİ BAKANLIĞI\nYAPI DENETİM SİSTEMİ (4708 SAYILI KANUN)\n\nBelge Türü: YAPI RUHSATI\nYİBF No: 184920\nRuhsat No: 2026/842-A\nAda / Parsel: 1420 / 18\nYapı Sahibi: Ege Global Gayrimenkul Yatırım A.Ş.\nYapı Müteahhidi: Tekno İnşaat ve Sanayi Ltd. Şti.\nYapı Sınıfı: IV-A (Betonarme Karkas Konut)\nToplam İnşaat Alanı: 8.450 m²\nKat Adedi: 2 Bodrum + Zemin + 8 Normal Kat\nOnay Tarihi: 14.02.2026\nGeçerlilik: 14.02.2031 (5 Yıl)\nIslak İmza / e-İmza: Mimar & İnşaat Mühendisi Onaylı (TMMOB Sicil Teyitli)\nDurum: Mevzuata Tam Uyumlu.`;

    if (isZeminEtudu) {
      docType = "Jeolojik & Jeoteknik Zemin Etüt Raporu";
      text = `JEOTEKNİK ZEMİN İNCELEME RAPORU\nYİBF No: 184920 | Ada: 1420 Parsel: 18\nTarih: 08.01.2026\n\nZemin Grubu: ZB - Sıkı Kumlu Çakıl\nZemin Taşıma Gücü (qa): 220 kN/m²\nYatak Katsayısı (ks): 32.000 kN/m³\nOturma Miktarı: 1.8 cm (Standart Limit Altında)\nYeraltı Su Seviyesi: -8.50 m kotunda rastlanmamıştır.\nTemel Tipi Önerisi: Radye Jeneral Temel (H=80cm)\nUygunluk: Deprem Yönetmeliği (TBDY 2018) Esaslarına Uygundur.`;
    } else if (isStatik) {
      docType = "Statik Hesap Raporu & Donatı Metrajı";
      text = `STATİK VE BETONARME HESAP RAPORU\nYİBF No: 184920 | Deprem Tasarım Sınıfı: DTS-1\nBeton Sınıfı: C35/45 Hazır Beton\nDonatı Çeliği: B420C Nervürlü Donatı\nSünek Deprem Davranış Katsayısı (R): 7\nKolon Düşey Donatı Oranı: %1.4 (TS 500 Uygun)\nPerde Oranı: Taban alanının %1.8'i (Deprem Güvenli)\ne-İmza Doğrulama: Bakanlık YİBF Havuzunda Onaylı.`;
    } else if (isLaboratuvar) {
      docType = "Akredite Laboratuvar Beton Basınç Deney Raporu";
      text = `TÜRKAK AKREDİTE BETON BASINÇ DENEY RAPORU\nRapor No: LAB-2026-9941\nNumune Alım Tarihi: 10.02.2026\nKırım Tarihi: 17.02.2026 (7 Günlük) & 10.03.2026 (28 Günlük)\nBeton Sınıfı Hedef: C30/37\nÖlçülen Ortalama Basınç Dayanımı: 34.8 MPa\nKarakteristik Dayanım Oranı: %108 (Şartnameyi Sağlar)\nSonuç: ONAYLANDI (PASS).`;
    }

    return {
      success: true,
      documentType: docType,
      yibfNo: "184920",
      licenseNo: "2026/842-A",
      issueDate: "14.02.2026",
      expiryDate: "14.02.2031",
      ownerName: "Ege Global Gayrimenkul Yatırım A.Ş.",
      buildingClass: "IV-A Betonarme",
      totalArea: "8.450 m²",
      blockParcel: "1420 / 18",
      bearingCapacity: isZeminEtudu ? "220 kN/m²" : undefined,
      settlementAmount: isZeminEtudu ? "1.8 cm" : undefined,
      confidence: 98,
      extractedText: text,
      signatureStatus: "SIGNED_VERIFIED",
      complianceStatus: "COMPLIANT",
      missingFields: [],
    };
  } catch (err: any) {
    return {
      success: false,
      documentType: "Bilinmeyen Belge",
      yibfNo: "-",
      licenseNo: "-",
      issueDate: "-",
      expiryDate: "-",
      ownerName: "-",
      buildingClass: "-",
      totalArea: "-",
      blockParcel: "-",
      confidence: 0,
      extractedText: "",
      signatureStatus: "INVALID",
      complianceStatus: "CRITICAL_MISSING",
      missingFields: ["Tüm belge"],
      error: err.message || "Evrak OCR motoru tarafından okunamadı.",
    };
  }
}
