/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Franchise Rollout Stage-Gate & Logistics Constants & Types
 */

// 6 Zorunlu Rollout Aşaması (Stage-Gate)
export type RolloutStageKey =
  | "YER_SECIMI"
  | "MIMARI_PROJE"
  | "SANCIYE_INSAAT"
  | "FFE_KURULUM"
  | "RESMI_IZINLER"
  | "PRE_OPENING"

export interface StageGateDefinition {
  key: RolloutStageKey
  name: string
  label: string
  description: string
  requiredDocument: string
  gateOrder: number
}

export const ROLLOUT_STAGES: StageGateDefinition[] = [
  {
    key: "YER_SECIMI",
    name: "Yer Seçimi & Fizibilite",
    label: "Yer Seçimi & Fizibilite",
    description: "Lokasyon analizi, yaya trafiği sayımı ve kira sözleşmesi ön mutabakatı",
    requiredDocument: "Kira Protokolü & Fizibilite Raporu",
    gateOrder: 1,
  },
  {
    key: "MIMARI_PROJE",
    name: "Mimari Proje & Onay",
    label: "Mimari Proje & Onay",
    description: "3D konsept model, rölöve, statik, elektrik ve mekanik uygulama projeleri",
    requiredDocument: "Onaylı Mimari Uygulama Projesi (.dwg / .pdf)",
    gateOrder: 2,
  },
  {
    key: "SANCIYE_INSAAT",
    name: "Şantiye & İnşaat",
    label: "Şantiye & İnşaat",
    description: "Saha kaba ve ince imalatı, alçıpan, zemin, asma tavan ve mekanik montaj",
    requiredDocument: "İnşaat İlerleme Raporu & Şantiye Teslim Tutanağı",
    gateOrder: 3,
  },
  {
    key: "FFE_KURULUM",
    name: "FF&E (Demirbaş) Kurulumu",
    label: "FF&E (Demirbaş) Kurulumu",
    description: "Espresso makinesi, POS terminalleri, tabela, soğutucu ve mobilya kurulumu",
    requiredDocument: "Demirbaş Teslim ve Montaj Tutanağı",
    gateOrder: 4,
  },
  {
    key: "RESMI_IZINLER",
    name: "Resmi İzinler",
    label: "Resmi İzinler",
    description: "İtfaiye uygunluk, çalışma ruhsatı, elektrik, su ve kurumsal internet abonelikleri",
    requiredDocument: "İtfaiye Uygunluk Raporu & İşyeri Çalışma Ruhsatı",
    gateOrder: 5,
  },
  {
    key: "PRE_OPENING",
    name: "Pre-Opening (Açılış Provası)",
    label: "Pre-Opening (Açılış Provası)",
    description: "Sıfır hata (0 Punch List) denetimi, prova açılışı ve anahtar teslimi",
    requiredDocument: "Sıfır Kusur (0 Açık Punch List) Onayı & GM Kabul Tutanağı",
    gateOrder: 6,
  },
]

// Standart Franchise FF&E Kataloğu
export interface FfeItem {
  id: string
  code: string
  name: string
  category: "Bar & Mutfak" | "Bilişim & POS" | "Reklam & Tabela" | "Mobilya & Dekor" | "İklimlendirme" | "Güvenlik & Ses"
  quantity: number
  unit: string
  supplier: string
  storeId: string
  storeName: string
  status: "Siparişi Bekleniyor" | "Siparişte" | "Yolda" | "Depoda" | "Sahaya Kuruldu"
  orderDate: string
  etaDate: string
  serialNo?: string
  trackingInfo?: {
    carrierName: string
    driverName: string
    driverPhone: string
    plateNumber: string
    currentCity: string
    originCity: string
    destinationCity: string
    currentLat: number
    currentLng: number
    speedKmH: number
    etaRemaining: string
    batteryLevel?: number
    cargoTemp?: string
  }
}

// Resmi İzinler & Kritik Yol Takip Verisi
export interface LegalPermitItem {
  id: string
  storeId: string
  storeName: string
  permitName: string
  authority: string
  officerInCharge: string
  status: "BAŞVURU_YAPILMADI" | "EVRAK_INCELEMESI" | "KESIF_BEKLENIYOR" | "ONAYLANDI" | "GECIKMEDE"
  applicationDate: string
  estimatedApprovalDate: string
  actualApprovalDate?: string
  documentUrl?: string
  isCriticalPath: boolean // Kritik yol üstünde mi?
  constructionFinishDate: string // İnşaat bitiş tarihiyle kıyaslanır
  notes?: string
}

// Punch List & Pre-Opening Kalite Kalemleri
export interface PunchListItemExt {
  id: string
  storeId: string
  storeName: string
  subcontractorId: string
  subcontractorName: string
  defectDesc: string
  locationFloor: string
  photoUrl: string | null
  priority: "KRITIK" | "YUKSEK" | "NORMAL" | "DUSUK"
  status: "OPEN" | "FIXED" | "VERIFIED"
  deadline: string
  createdAt: string
  taskId?: string // Otomatik oluşturulan Task / DÖF ID'si
}
