/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Nexa Mobile - Rol ve Yetki Matrisi
 */

export const ALL_ROLES = [
  "ACCOUNTANT",
  "HR_STAFF",
  "PURCHASING_STAFF",
  "MUHASEBE",
  "FINANCE_MANAGER",
  "HR_MANAGER",
  "PROCUREMENT_MANAGER",
  "EQUIPMENT_MANAGER",
  "ISG_EXPERT",
  "ADMIN",
  "PROJECT_MANAGER",
  "SUPER_ADMIN",
  "SITE_MANAGER",
  "ENGINEER",
  "STAFF",
  "WORKER",
  "SUBCONTRACTOR",
  "INSPECTION_ADMIN",
  "INSPECTOR",
  "AUDITOR",
  "DRIVER",
  "SECURITY",
] as const;

export type UserRole = (typeof ALL_ROLES)[number];

export const DETAILED_TRADES = [
  "Kule Vinç Operatörü",
  "Mobil Vinç Operatörü",
  "Ekskavatör Operatörü",
  "Beko Loder Operatörü",
  "Beton Pompası Operatörü",
  "Hazır Beton Transmikser Şoförü",
  "Ağır Vasıta / Damperli Kamyon Şoförü",
  "Demirci / Donatı Ustası",
  "Kalıpçı / Ahşap & Tünel Kalıp Ustası",
  "Betoncu / Şap ve Mastarcı",
  "İskele Kurulum & Söküm Uzmanı",
  "Sertifikalı Kaynakçı (Gazaltı / Elektrot)",
  "Çelik Konstrüksiyon Montaj Ustası",
  "Elektrik Dağıtım & Pano Ustası",
  "Zayıf Akım & Yangın Alarm Teknisyeni",
  "Sıhhi Tesisat & Mekanik Montaj Ustası",
  "Havalandırma & İklimlendirme (HVAC) Ustası",
  "Harita Mühendisi / Topograf",
  "Nivo & GPS Alet Operatörü",
  "Alçı, Sıva ve Boya Ustası",
  "Yalıtım & İzolasyon Ustası (Su / Isı / Yangın)",
  "Seramik, Fayans ve Mermer Ustası",
  "Alçıpan & Asma Tavan Ustası",
  "İnce İşler Marangoz & Kapı Montaj Ustası",
  "İSG Saha Denetçisi / Gözlemcisi",
  "Saha Güvenlik Görevlisi",
  "Depo & Ambar Sorumlusu",
  "Yemekhane ve Servis Personeli",
  "Saha Düz İşçi / Genel Yardımcı",
] as const;

export type DetailedTrade = (typeof DETAILED_TRADES)[number];

