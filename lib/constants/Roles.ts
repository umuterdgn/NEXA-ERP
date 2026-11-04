/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Nexa ERP - Kapsamlı Rol ve Yetki Matrisi (Role & Permission Engine)
 *
 * Hiyerarşi Grupları:
 * - Şirket Yönetimi & Sistem
 * - Merkez Ofis
 * - Departman Müdürleri
 * - Saha Ekibi
 * - Taşeron
 * - Yapı Denetim
 * - Lojistik & Güvenlik
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

export interface RoleDefinition {
  code: UserRole;
  title: string;
  category:
    | "ŞİRKET YÖNETİMİ"
    | "MERKEZ OFİS"
    | "DEPARTMAN MÜDÜRLERİ"
    | "SAHA EKİBİ"
    | "TAŞERON"
    | "YAPI DENETİM"
    | "LOJİSTİK & GÜVENLİK";
  defaultRoute: string;
  allowedPortals: string[];
  description: string;
}

export const ROLE_DEFINITIONS: Record<UserRole, RoleDefinition> = {
  SUPER_ADMIN: {
    code: "SUPER_ADMIN",
    title: "Sistem Süper Yöneticisi",
    category: "ŞİRKET YÖNETİMİ",
    defaultRoute: "/admin",
    allowedPortals: ["ALL"],
    description: "Tüm sistem, kiracı (tenant), finans ve yetki yönetimi tam yetki.",
  },
  ADMIN: {
    code: "ADMIN",
    title: "Firma Yöneticisi (Admin)",
    category: "ŞİRKET YÖNETİMİ",
    defaultRoute: "/admin",
    allowedPortals: ["ALL"],
    description: "Firma geneli operasyon, şantiye, bütçe ve personel tam yetki.",
  },
  PROJECT_MANAGER: {
    code: "PROJECT_MANAGER",
    title: "Proje Direktörü / Müdürü",
    category: "ŞİRKET YÖNETİMİ",
    defaultRoute: "/admin",
    allowedPortals: ["projects", "boq", "revisions", "finance", "reports", "inspection"],
    description: "Projelerin genel ilerlemesi, revizyonlar, hakediş ve saha koordinasyonu.",
  },
  FINANCE_MANAGER: {
    code: "FINANCE_MANAGER",
    title: "Finans & Mali İşler Müdürü",
    category: "DEPARTMAN MÜDÜRLERİ",
    defaultRoute: "/admin/finance",
    allowedPortals: ["finance", "billing", "contracts", "progress-payments"],
    description: "Kasa, bankalar, hakediş onayları, çek/senet ve nakit akışı.",
  },
  HR_MANAGER: {
    code: "HR_MANAGER",
    title: "İnsan Kaynakları Müdürü",
    category: "DEPARTMAN MÜDÜRLERİ",
    defaultRoute: "/admin/personel",
    allowedPortals: ["hr", "personnel", "payroll", "shifts", "leaves"],
    description: "Personel özlük işleri, puantaj, bordro, izinler ve İK onayları.",
  },
  PROCUREMENT_MANAGER: {
    code: "PROCUREMENT_MANAGER",
    title: "Satınalma & Tedarik Müdürü",
    category: "DEPARTMAN MÜDÜRLERİ",
    defaultRoute: "/admin/procurement",
    allowedPortals: ["procurement", "inventory", "receiving", "logistics"],
    description: "Satınalma talepleri, malzeme siparişleri, teklif toplama ve ambar yönetimi.",
  },
  EQUIPMENT_MANAGER: {
    code: "EQUIPMENT_MANAGER",
    title: "Makine & İkmal Müdürü",
    category: "DEPARTMAN MÜDÜRLERİ",
    defaultRoute: "/admin/equipments",
    allowedPortals: ["equipments", "inventory", "maintenance"],
    description: "Ağır ekipman, kule vinçler, araç zimmetleri ve periyodik bakımlar.",
  },
  ISG_EXPERT: {
    code: "ISG_EXPERT",
    title: "A/B Sınıfı İSG Uzmanı",
    category: "DEPARTMAN MÜDÜRLERİ",
    defaultRoute: "/admin/isg",
    allowedPortals: ["isg", "risk-map", "near-miss", "certificates", "ppe"],
    description: "İş sağlığı ve güvenliği denetimleri, ramak kala ve risk haritası.",
  },
  ACCOUNTANT: {
    code: "ACCOUNTANT",
    title: "Muhasebe Uzmanı",
    category: "MERKEZ OFİS",
    defaultRoute: "/admin/finance",
    allowedPortals: ["finance", "invoices", "expenses"],
    description: "Fatura girişi, masraf/fiş denetimi ve cari hesap mutabakatları.",
  },
  MUHASEBE: {
    code: "MUHASEBE",
    title: "Ön Muhasebe Görevlisi",
    category: "MERKEZ OFİS",
    defaultRoute: "/admin/finance",
    allowedPortals: ["finance", "expenses"],
    description: "Giriş seviyesi fiş, irsaliye ve gider kayıtları.",
  },
  HR_STAFF: {
    code: "HR_STAFF",
    title: "İK & Özlük Elemanı",
    category: "MERKEZ OFİS",
    defaultRoute: "/admin/personel",
    allowedPortals: ["hr", "attendance", "leaves"],
    description: "Günlük puantaj, servis takibi ve sağlık raporu girişleri.",
  },
  PURCHASING_STAFF: {
    code: "PURCHASING_STAFF",
    title: "Satınalma Elemanı",
    category: "MERKEZ OFİS",
    defaultRoute: "/admin/procurement",
    allowedPortals: ["procurement", "receiving"],
    description: "Tedarikçi siparişleri, irsaliye eşleştirme ve teslimat takibi.",
  },
  STAFF: {
    code: "STAFF",
    title: "Merkez Ofis Personeli",
    category: "MERKEZ OFİS",
    defaultRoute: "/admin",
    allowedPortals: ["tasks", "announcements", "documents"],
    description: "Genel idari ofis görevleri ve iç iletişim.",
  },
  SITE_MANAGER: {
    code: "SITE_MANAGER",
    title: "Şantiye Şefi / Başmühendis",
    category: "SAHA EKİBİ",
    defaultRoute: "/admin",
    allowedPortals: ["site", "daily-log", "revisions", "qa-qc", "inspections", "subcontractors", "tasks"],
    description: "Şantiyedeki tüm saha imalatları, günlük jurnaller ve taşeron denetimi.",
  },
  ENGINEER: {
    code: "ENGINEER",
    title: "Saha Mühendisi (İnşaat / Makine / Elektrik)",
    category: "SAHA EKİBİ",
    defaultRoute: "/admin",
    allowedPortals: ["site", "qa-qc", "concrete", "revisions", "tasks", "deficiencies"],
    description: "İmalat kontrolü, beton döküm tutanakları, metraj ve revizyon takibi.",
  },
  WORKER: {
    code: "WORKER",
    title: "Saha İmalat Çalışanı / Usta",
    category: "SAHA EKİBİ",
    defaultRoute: "/mobile/tasks",
    allowedPortals: ["my-tasks", "attendance", "salary", "ohs-report"],
    description: "Kendi görevleri, günlük check-in puantaj ve kişisel maaş/mesai takibi.",
  },
  SUBCONTRACTOR: {
    code: "SUBCONTRACTOR",
    title: "Taşeron Firma Temsilcisi",
    category: "TAŞERON",
    defaultRoute: "/subcontractor",
    allowedPortals: ["subcontractor-portal", "hakedis", "crew-attendance", "deficiencies"],
    description: "Sadece taşeron hakediş talepleri, iş kanıtları ve kendi ekip puantajı.",
  },
  INSPECTION_ADMIN: {
    code: "INSPECTION_ADMIN",
    title: "Yapı Denetim Şirket Müdürü",
    category: "YAPI DENETİM",
    defaultRoute: "/inspection",
    allowedPortals: ["inspection-portal", "yibf", "visas", "lab-tests"],
    description: "Bakanlık YİBF projeleri, vize onayları ve resmi denetim tutanakları.",
  },
  INSPECTOR: {
    code: "INSPECTOR",
    title: "Yapı Denetim Kontrol Elemanı / Denetçi",
    category: "YAPI DENETİM",
    defaultRoute: "/inspection",
    allowedPortals: ["inspection-portal", "reinforcement", "concrete-tests", "evidence"],
    description: "Demir ve kalıp kontrolü, beton numune şahitliği ve e-imza vizesi.",
  },
  AUDITOR: {
    code: "AUDITOR",
    title: "Bağımsız Kalite Denetçisi",
    category: "YAPI DENETİM",
    defaultRoute: "/inspection",
    allowedPortals: ["inspection-portal", "qa-qc", "audit-reports"],
    description: "Şantiye kalite standartları ve uygunsuzluk denetimleri.",
  },
  DRIVER: {
    code: "DRIVER",
    title: "Lojistik / Transmikser Şoförü",
    category: "LOJİSTİK & GÜVENLİK",
    defaultRoute: "/mobile/driver",
    allowedPortals: ["driver-portal"],
    description: "Sadece Sürücü Portalı: Kapı geçiş QR kodu, döküm rotası ve canlı GPS takibi.",
  },
  SECURITY: {
    code: "SECURITY",
    title: "Şantiye Kapı Güvenlik Görevlisi",
    category: "LOJİSTİK & GÜVENLİK",
    defaultRoute: "/admin/procurement/logistics",
    allowedPortals: ["security-portal", "gate-pass", "visitor-log", "truck-weighing"],
    description: "Nizamiye kapı kontrolü, kamyon tartım, QR okutma ve araç giriş/çıkış.",
  },
};

/**
 * DETAYLI ŞANTİYE MESLEKLER LİSTESİ (TRADES)
 */
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

/**
 * CASCADING DEPARTMAN - ROL - MESLEK İLİŞKİSİ
 */
export interface DepartmentCascadingConfig {
  id: string;
  name: string;
  roles: UserRole[];
  trades: DetailedTrade[];
}

export const DEPARTMENT_CASCADING_CONFIGS: DepartmentCascadingConfig[] = [
  {
    id: "LOJISTIK_GUVENLIK",
    name: "Lojistik & Kapı Güvenliği",
    roles: ["DRIVER", "SECURITY", "EQUIPMENT_MANAGER"],
    trades: [
      "Hazır Beton Transmikser Şoförü",
      "Ağır Vasıta / Damperli Kamyon Şoförü",
      "Saha Güvenlik Görevlisi",
      "Depo & Ambar Sorumlusu",
    ],
  },
  {
    id: "SAHA_IMALAT",
    name: "Saha İmalat & Şantiye",
    roles: ["SITE_MANAGER", "ENGINEER", "WORKER"],
    trades: [
      "Kule Vinç Operatörü",
      "Mobil Vinç Operatörü",
      "Ekskavatör Operatörü",
      "Beko Loder Operatörü",
      "Beton Pompası Operatörü",
      "Demirci / Donatı Ustası",
      "Kalıpçı / Ahşap & Tünel Kalıp Ustası",
      "Betoncu / Şap ve Mastarcı",
      "İskele Kurulum & Söküm Uzmanı",
      "Sertifikalı Kaynakçı (Gazaltı / Elektrot)",
      "Çelik Konstrüksiyon Montaj Ustası",
      "Elektrik Dağıtım & Pano Ustası",
      "Sıhhi Tesisat & Mekanik Montaj Ustası",
      "Harita Mühendisi / Topograf",
      "Nivo & GPS Alet Operatörü",
      "Alçı, Sıva ve Boya Ustası",
      "Yalıtım & İzolasyon Ustası (Su / Isı / Yangın)",
      "Seramik, Fayans ve Mermer Ustası",
      "Alçıpan & Asma Tavan Ustası",
      "İnce İşler Marangoz & Kapı Montaj Ustası",
      "Saha Düz İşçi / Genel Yardımcı",
    ],
  },
  {
    id: "TASERON",
    name: "Taşeron Ekipleri",
    roles: ["SUBCONTRACTOR", "WORKER"],
    trades: [
      "Demirci / Donatı Ustası",
      "Kalıpçı / Ahşap & Tünel Kalıp Ustası",
      "Betoncu / Şap ve Mastarcı",
      "Alçı, Sıva ve Boya Ustası",
      "Elektrik Dağıtım & Pano Ustası",
      "Sıhhi Tesisat & Mekanik Montaj Ustası",
      "Seramik, Fayans ve Mermer Ustası",
      "Saha Düz İşçi / Genel Yardımcı",
    ],
  },
  {
    id: "YAPI_DENETIM",
    name: "Yapı Denetim & Bağımsız Kalite",
    roles: ["INSPECTION_ADMIN", "INSPECTOR", "AUDITOR"],
    trades: ["Harita Mühendisi / Topograf", "İSG Saha Denetçisi / Gözlemcisi"],
  },
  {
    id: "ISG_CEVRE",
    name: "İş Sağlığı, Güvenliği ve Çevre (İSG)",
    roles: ["ISG_EXPERT"],
    trades: ["İSG Saha Denetçisi / Gözlemcisi"],
  },
  {
    id: "FINANS_MUHASEBE",
    name: "Finans & Muhasebe",
    roles: ["FINANCE_MANAGER", "ACCOUNTANT", "MUHASEBE"],
    trades: ["Depo & Ambar Sorumlusu"],
  },
  {
    id: "SATINALMA_TEDARIK",
    name: "Satınalma & Tedarik",
    roles: ["PROCUREMENT_MANAGER", "PURCHASING_STAFF", "EQUIPMENT_MANAGER"],
    trades: ["Depo & Ambar Sorumlusu"],
  },
  {
    id: "INSAN_KAYNAKLARI",
    name: "İnsan Kaynakları & İdari İşler",
    roles: ["HR_MANAGER", "HR_STAFF", "STAFF"],
    trades: ["Yemekhane ve Servis Personeli"],
  },
  {
    id: "YONETIM",
    name: "Şirket Yönetimi & İcra Kurulu",
    roles: ["SUPER_ADMIN", "ADMIN", "PROJECT_MANAGER"],
    trades: ["Harita Mühendisi / Topograf"],
  },
];

/**
 * YETKİ KONTROL FONKSİYONU
 */
export function isRouteAllowedForRole(role: string | undefined, pathname: string): boolean {
  if (!role) return false;
  if (role === "SUPER_ADMIN" || role === "ADMIN") return true;

  // ŞOFÖR KISITLAMASI: Sadece Sürücü Portalı'nı görebilir
  if (role === "DRIVER") {
    return (
      pathname.startsWith("/mobile/driver") ||
      pathname.startsWith("/track") ||
      pathname.includes("driver") ||
      pathname === "/login"
    );
  }

  // GÜVENLİK KISITLAMASI
  if (role === "SECURITY") {
    return (
      pathname.startsWith("/admin/procurement/logistics") ||
      pathname.startsWith("/mobile/security") ||
      pathname.includes("gate") ||
      pathname === "/login"
    );
  }

  // TAŞERON KISITLAMASI
  if (role === "SUBCONTRACTOR") {
    return (
      pathname.startsWith("/subcontractor") ||
      pathname.startsWith("/admin/subcontractor-inspections") ||
      pathname.startsWith("/admin/bim") ||
      pathname === "/admin" ||
      pathname === "/login"
    );
  }

  // YAPI DENETİM KISITLAMASI
  if (role === "INSPECTOR" || role === "AUDITOR" || role === "INSPECTION_ADMIN") {
    return (
      pathname.startsWith("/inspection") ||
      pathname.startsWith("/admin/inspection") ||
      pathname.startsWith("/admin/qa-qc") ||
      pathname.startsWith("/admin/samples") ||
      pathname === "/admin" ||
      pathname === "/login"
    );
  }

  const def = ROLE_DEFINITIONS[role as UserRole];
  if (!def) return false;

  if (def.allowedPortals.includes("ALL")) return true;

  return true;
}

