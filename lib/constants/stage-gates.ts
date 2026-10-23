/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Franchise Stage-Gate Varsayılan Faz Tanımları
 */

export const DEFAULT_STAGE_GATES = [
  { stageName: "KİRALAMA", isRequired: true, label: "Kira Kontratı & Alan Tahsisi", billingPercentage: 15 },
  { stageName: "AVM_ONAYI", isRequired: true, label: "AVM Mimari & Teknik Onayı", billingPercentage: 20 },
  { stageName: "KABA_YAPI", isRequired: true, label: "Kaba & İnce Yapı İnşaat İzni", billingPercentage: 35 },
  { stageName: "İTFAİYE_ONAYI", isRequired: true, label: "İtfaiye Yangın & İskan Ruhsatı", billingPercentage: 20 },
  { stageName: "AÇILIŞ", isRequired: true, label: "Merkez Kurumsal Açılış Yetkisi", billingPercentage: 10 },
]
