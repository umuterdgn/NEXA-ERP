/**
 * © 2026 NXA Software. All rights reserved.
 * Nexa ERP Mobil - 3 İşletme Tipine Göre Dinamik Navigasyon & Modül Kayıt Merkezi
 * Yetki matrisi tamamen sunucudan gelen allowedModules ve role verisine dayanır.
 */

import type { Ionicons } from "@expo/vector-icons";
import type {
  ModuleCategory,
  ModuleKey,
  SystemRole,
  TenantType,
} from "../types/api";

export type NativeScreenId =
  | "dashboard"
  | "tasks"
  | "journal"
  | "work_proofs"
  | "inspections"
  | "samples"
  | "deficiencies"
  | "forms"
  | "attendance"
  | "hr_requests"
  | "hr_self"
  | "logistics"
  | "logistics_qr"
  | "routes"
  | "isg"
  | "ai_vision"
  | "chat";

export type IoniconName = keyof typeof Ionicons.glyphMap;

export interface MobileModuleItem {
  id: string;
  title: string;
  subtitle: string;
  category: ModuleCategory;
  icon: IoniconName;
  color: string;
  requiredModules: ModuleKey[];
  kind: "NATIVE" | "SSO";
  screenId?: NativeScreenId;
  screenParams?: Record<string, string>;
  ssoPath?: (tenantType: TenantType, projectId?: string) => string;
}

export interface DynamicTabConfig {
  id: string;
  label: string;
  icon: IoniconName;
  activeIcon: IoniconName;
  screenId: NativeScreenId;
  requiredModules: ModuleKey[];
}

export interface FabActionItem {
  id: string;
  title: string;
  subtitle: string;
  icon: IoniconName;
  color: string;
  bgColor: string;
  screenId: NativeScreenId;
  params?: Record<string, string>;
  requiredModules: ModuleKey[];
}

export const CATEGORY_LABELS: Record<ModuleCategory, string> = {
  MANAGEMENT_BI: "Yönetim, 3D BIM & Raporlar",
  HSE_FIELD_OPS: "Saha Operasyon, Görev & İSG",
  INSPECTION_QUALITY: "Yapı Denetim & Kalite Kontrol",
  SUBCONTRACTOR_FINANCE: "Taşeron, Hakediş & Finans",
  PROCUREMENT_LOGISTICS: "Lojistik, Ambar & Güzergah",
  HR_PERSONAL: "Puantaj, İK & Özlük",
  SYSTEM: "Sistem",
};

export const MOBILE_MODULES: MobileModuleItem[] = [
  // NATIVE MODÜLLER (Canlı /api/mobile/* uçlarına bağlı)
  {
    id: "tasks",
    title: "İş Emirleri & Görevler",
    subtitle: "Aktif şantiye görevleri ve ilerleme takibi",
    category: "HSE_FIELD_OPS",
    icon: "checkbox-outline",
    color: "#0A7AFF",
    requiredModules: ["tasks_work_orders"],
    kind: "NATIVE",
    screenId: "tasks",
  },
  {
    id: "journal",
    title: "Şantiye Günlüğü (Jurnal)",
    subtitle: "Günlük ekip, hava ve imalat raporu",
    category: "HSE_FIELD_OPS",
    icon: "book-outline",
    color: "#34C759",
    requiredModules: ["site_journal"],
    kind: "NATIVE",
    screenId: "journal",
  },
  {
    id: "work_proofs",
    title: "Taşeron İş Kanıtı & Onay",
    subtitle: "GPS'li imalat fotoğrafı ve metraj kabulleri",
    category: "SUBCONTRACTOR_FINANCE",
    icon: "camera-outline",
    color: "#FF9500",
    requiredModules: ["work_proofs"],
    kind: "NATIVE",
    screenId: "work_proofs",
  },
  {
    id: "inspections",
    title: "Denetim Tutanak & Vize",
    subtitle: "Demir, kalıp, temel ve yapı denetim vizeleri",
    category: "INSPECTION_QUALITY",
    icon: "shield-checkmark-outline",
    color: "#AF52DE",
    requiredModules: ["inspections", "reinforcement_check", "concrete_pouring_qa"],
    kind: "NATIVE",
    screenId: "inspections",
  },
  {
    id: "samples",
    title: "Karot & Beton Numunesi QR",
    subtitle: "Numune alma, lab kabul ve 7/28 gün kırım",
    category: "INSPECTION_QUALITY",
    icon: "flask-outline",
    color: "#30B0C7",
    requiredModules: ["samples_core", "concrete_pouring_qa"],
    kind: "NATIVE",
    screenId: "samples",
  },
  {
    id: "deficiencies",
    title: "Saha Kusur & DÖF (NCR)",
    subtitle: "Fotoğraflı uygunsuzluk ve eksiklik kapatma",
    category: "INSPECTION_QUALITY",
    icon: "warning-outline",
    color: "#FF3B30",
    requiredModules: ["deficiencies", "ncr_dof"],
    kind: "NATIVE",
    screenId: "deficiencies",
  },
  {
    id: "forms",
    title: "Dinamik Denetim Formları",
    subtitle: "Özelleştirilmiş kontrol listesi doldurma",
    category: "INSPECTION_QUALITY",
    icon: "document-text-outline",
    color: "#5856D6",
    requiredModules: ["dynamic_forms", "form_builder"],
    kind: "NATIVE",
    screenId: "forms",
  },
  {
    id: "ai_vision",
    title: "AI Görsel Kusur Analizi",
    subtitle: "Kamera ile çatlak, kalıp ve İSG ihlal taraması",
    category: "INSPECTION_QUALITY",
    icon: "scan-outline",
    color: "#00C7BE",
    requiredModules: ["ai_vision", "site_camera"],
    kind: "NATIVE",
    screenId: "ai_vision",
  },
  {
    id: "attendance",
    title: "QR Puantaj & Mesai",
    subtitle: "Kamera QR ve GPS geofence giriş/çıkış",
    category: "HR_PERSONAL",
    icon: "qr-code-outline",
    color: "#34C759",
    requiredModules: ["my_attendance_qr", "attendance"],
    kind: "NATIVE",
    screenId: "attendance",
  },
  {
    id: "hr_requests",
    title: "İzin, Avans & Masraf Onay",
    subtitle: "Talep oluşturma ve yönetici onay kutusu",
    category: "HR_PERSONAL",
    icon: "receipt-outline",
    color: "#FF9500",
    requiredModules: ["my_leaves", "my_salary_advances", "my_expenses", "approvals"],
    kind: "NATIVE",
    screenId: "hr_requests",
  },
  {
    id: "hr_self",
    title: "Özlük, KKD Zimmet & Menü",
    subtitle: "Maaş özeti, dijital imzalı KKD, yemekhane",
    category: "HR_PERSONAL",
    icon: "id-card-outline",
    color: "#0A7AFF",
    requiredModules: ["my_profile", "my_assigned_equipments", "my_announcements", "food_menu"],
    kind: "NATIVE",
    screenId: "hr_self",
  },
  {
    id: "logistics",
    title: "Kapı Güvenlik & Tesellüm",
    subtitle: "Araç plaka girişi, irsaliye kabul ve talep",
    category: "PROCUREMENT_LOGISTICS",
    icon: "car-outline",
    color: "#30B0C7",
    requiredModules: ["gate_security", "goods_receiving", "logistics_appointments", "driver_deliveries"],
    kind: "NATIVE",
    screenId: "logistics",
  },
  {
    id: "logistics_qr",
    title: "Ambar Stok & QR Sarfiyat",
    subtitle: "Karekod ile malzeme çıkışı ve stok kontrolü",
    category: "PROCUREMENT_LOGISTICS",
    icon: "cube-outline",
    color: "#FF9500",
    requiredModules: ["qr_micro_consumption", "warehouse_inventory", "material_requests"],
    kind: "NATIVE",
    screenId: "logistics_qr",
    screenParams: { tab: "qr" },
  },
  {
    id: "routes",
    title: "Akıllı Güzergah & Duraklar",
    subtitle: "Sürücü, denetçi ve bölge müdürü durak rotası",
    category: "PROCUREMENT_LOGISTICS",
    icon: "navigate-outline",
    color: "#0A7AFF",
    requiredModules: ["route_optimization", "driver_deliveries", "inspections", "samples_core"],
    kind: "NATIVE",
    screenId: "routes",
  },
  {
    id: "isg",
    title: "İSG Radar, Ramak Kala & SOS",
    subtitle: "Acil SOS alarmı ve anonim ramak kala kaydı",
    category: "HSE_FIELD_OPS",
    icon: "medkit-outline",
    color: "#FF3B30",
    requiredModules: ["near_miss", "sos_alarm", "isg_dashboard"],
    kind: "NATIVE",
    screenId: "isg",
  },
  {
    id: "chat",
    title: "Telsiz (PTT) & Şantiye Chat",
    subtitle: "Proje ve genel saha kanalı anlık sohbet",
    category: "HSE_FIELD_OPS",
    icon: "chatbubbles-outline",
    color: "#5856D6",
    requiredModules: ["internal_comms", "ptt_chat"],
    kind: "NATIVE",
    screenId: "chat",
  },

  // AĞIR WEB SSO MODÜLLERİ (SsoWebViewScreen üzerinden şifresiz açılır)
  {
    id: "sso_bim_3d",
    title: "3D BIM & X-Ray Model",
    subtitle: "Three.js Federated BIM ve kesit inceleme",
    category: "MANAGEMENT_BI",
    icon: "layers-outline",
    color: "#00C7BE",
    requiredModules: ["bim_3d"],
    kind: "SSO",
    ssoPath: (tenantType, projectId) => {
      if (tenantType === "INSPECTION") return "/tr/inspection/bim";
      if (tenantType === "FRANCHISE") return "/tr/franchise/bim";
      return projectId ? `/tr/admin/projects/${projectId}?tab=bim` : "/tr/admin/bim";
    },
  },
  {
    id: "sso_ar",
    title: "Mobil AR Saha Hizalama",
    subtitle: "Kamera üzeri 3D BIM artırılmış gerçeklik",
    category: "MANAGEMENT_BI",
    icon: "aperture-outline",
    color: "#0A7AFF",
    requiredModules: ["bim_3d"],
    kind: "SSO",
    ssoPath: (_t, projectId) => (projectId ? `/tr/ar/${projectId}` : "/tr/admin/bim"),
  },
  {
    id: "sso_dwg",
    title: "2D DWG Pafta & Revizyon",
    subtitle: "CAD katmanları ve revizyon karşılaştırma",
    category: "MANAGEMENT_BI",
    icon: "map-outline",
    color: "#5856D6",
    requiredModules: ["digital_drawings", "revisions"],
    kind: "SSO",
    ssoPath: (tenantType) =>
      tenantType === "INSPECTION" ? "/tr/inspection/blueprints" : "/tr/admin/blueprints",
  },
  {
    id: "sso_drone",
    title: "4D Drone & Hava Haritası",
    subtitle: "Ortofoto ilerleme ve kübaj analizi",
    category: "MANAGEMENT_BI",
    icon: "airplane-outline",
    color: "#30B0C7",
    requiredModules: ["drone_maps"],
    kind: "SSO",
    ssoPath: (tenantType) =>
      tenantType === "INSPECTION" ? "/tr/inspection/drone" : "/tr/admin/drone",
  },
  {
    id: "sso_gis_map",
    title: "Şantiye GIS Haritası",
    subtitle: "Geofence bölgeleri ve konum radarı",
    category: "MANAGEMENT_BI",
    icon: "compass-outline",
    color: "#34C759",
    requiredModules: ["site_map"],
    kind: "SSO",
    ssoPath: (tenantType) => {
      if (tenantType === "INSPECTION") return "/tr/inspection/routes";
      if (tenantType === "FRANCHISE") return "/tr/franchise/rollout-map";
      return "/tr/admin/map";
    },
  },
  {
    id: "sso_boq",
    title: "Keşif & Metraj (BoQ)",
    subtitle: "Poz bazlı imalat metrajı ve hakediş",
    category: "SUBCONTRACTOR_FINANCE",
    icon: "calculator-outline",
    color: "#FF9500",
    requiredModules: ["boq", "progress_payments"],
    kind: "SSO",
    ssoPath: (tenantType) =>
      tenantType === "INSPECTION" ? "/tr/inspection/boq" : "/tr/admin/boq",
  },
  {
    id: "sso_finance",
    title: "Finans & Kasa Raporu",
    subtitle: "Nakit akışı, çek/senet ve hakediş özeti",
    category: "SUBCONTRACTOR_FINANCE",
    icon: "wallet-outline",
    color: "#34C759",
    requiredModules: ["finance_cash"],
    kind: "SSO",
    ssoPath: (tenantType) => {
      if (tenantType === "INSPECTION") return "/tr/inspection/finance";
      if (tenantType === "FRANCHISE") return "/tr/franchise/finance";
      return "/tr/admin/finance";
    },
  },
  {
    id: "sso_projects",
    title: "Proje / Şube Web Paneli",
    subtitle: "Kapsamlı web proje ve şube yönetimi",
    category: "MANAGEMENT_BI",
    icon: "business-outline",
    color: "#0A7AFF",
    requiredModules: ["projects"],
    kind: "SSO",
    ssoPath: (tenantType, projectId) => {
      if (tenantType === "INSPECTION") return "/tr/inspection/projects";
      if (tenantType === "FRANCHISE") return "/tr/franchise/branch";
      return projectId ? `/tr/admin/projects/${projectId}` : "/tr/admin/projects";
    },
  },
];

export function hasAnyModuleAccess(
  role: SystemRole | string | undefined,
  allowedModules: ModuleKey[],
  required: ModuleKey[]
): boolean {
  if (role === "SUPER_ADMIN") return true;
  if (!required || required.length === 0) return true;
  return required.some((k) => allowedModules.includes(k));
}

export function getTenantBusinessBadge(tenantType?: TenantType | string): string {
  switch (tenantType) {
    case "INSPECTION":
      return "Yapı Denetim";
    case "FRANCHISE":
      return "Franchise";
    default:
      return "Müteahhit";
  }
}

export function getRoleDisplayTitle(role?: string): string {
  const upper = String(role || "").toUpperCase();
  const map: Record<string, string> = {
    SUPER_ADMIN: "Sistem Süper Yöneticisi",
    ADMIN: "Genel Müdür / Admin",
    PROJECT_MANAGER: "Proje Müdürü",
    SITE_MANAGER: "Şantiye Şefi",
    ENGINEER: "Saha Mühendisi",
    ARCHITECT: "Mimar / Dizayn Sorumlusu",
    ISG_EXPERT: "İSG Uzmanı",
    FINANCE_MANAGER: "Finans Müdürü",
    HR_MANAGER: "İK Müdürü",
    PROCUREMENT_MANAGER: "Satınalma Müdürü",
    WAREHOUSE_MANAGER: "Ambar Sorumlusu",
    SECURITY: "Kapı Güvenlik",
    DRIVER: "Şoför / Lojistik",
    WORKER: "Saha Çalışanı",
    SUBCONTRACTOR: "Taşeron Yetkilisi",
    INSPECTION_ADMIN: "Yapı Denetim Yöneticisi",
    PROJECT_AUDITOR: "Proje Denetçisi",
    INSPECTOR: "Saha Denetçisi",
    LAB_TECH: "Lab & Karot Teknisyeni",
    INSPECTION_OFFICE: "YİBF Evrak Sorumlusu",
    INSPECTION_FINANCE: "Denetim Finans Sorumlusu",
    FRANCHISE_ADMIN: "Franchise Genel Müdürü",
    REGIONAL_MANAGER: "Bölge Müdürü",
    FRANCHISEE: "Bayi / Şube Sahibi",
    FITOUT_SUPERVISOR: "Kurulum Şefi",
    FITOUT_TECH: "Kurulum Teknisyeni",
    BRANCH_MANAGER: "Şube Müdürü",
    STAFF: "Saha Personeli",
  };
  return map[upper] || upper || "Kullanıcı";
}

const SCREEN_TO_TAB_META: Record<
  Exclude<NativeScreenId, "dashboard">,
  Omit<DynamicTabConfig, "id">
> = {
  tasks: {
    label: "Görevler",
    icon: "checkbox-outline",
    activeIcon: "checkbox",
    screenId: "tasks",
    requiredModules: ["tasks_work_orders"],
  },
  journal: {
    label: "Jurnal",
    icon: "book-outline",
    activeIcon: "book",
    screenId: "journal",
    requiredModules: ["site_journal"],
  },
  work_proofs: {
    label: "İş Kanıtı",
    icon: "camera-outline",
    activeIcon: "camera",
    screenId: "work_proofs",
    requiredModules: ["work_proofs"],
  },
  inspections: {
    label: "Denetim",
    icon: "shield-checkmark-outline",
    activeIcon: "shield-checkmark",
    screenId: "inspections",
    requiredModules: ["inspections", "reinforcement_check", "concrete_pouring_qa"],
  },
  samples: {
    label: "Karot QR",
    icon: "flask-outline",
    activeIcon: "flask",
    screenId: "samples",
    requiredModules: ["samples_core", "concrete_pouring_qa"],
  },
  deficiencies: {
    label: "Kusurlar",
    icon: "warning-outline",
    activeIcon: "warning",
    screenId: "deficiencies",
    requiredModules: ["deficiencies", "ncr_dof"],
  },
  forms: {
    label: "Formlar",
    icon: "document-text-outline",
    activeIcon: "document-text",
    screenId: "forms",
    requiredModules: ["dynamic_forms", "form_builder"],
  },
  attendance: {
    label: "Puantaj",
    icon: "qr-code-outline",
    activeIcon: "qr-code",
    screenId: "attendance",
    requiredModules: ["my_attendance_qr", "attendance"],
  },
  hr_requests: {
    label: "Talepler",
    icon: "receipt-outline",
    activeIcon: "receipt",
    screenId: "hr_requests",
    requiredModules: ["my_leaves", "my_salary_advances", "my_expenses", "approvals"],
  },
  hr_self: {
    label: "Özlük",
    icon: "id-card-outline",
    activeIcon: "id-card",
    screenId: "hr_self",
    requiredModules: ["my_profile", "my_assigned_equipments"],
  },
  logistics: {
    label: "Lojistik",
    icon: "car-outline",
    activeIcon: "car",
    screenId: "logistics",
    requiredModules: [
      "gate_security",
      "goods_receiving",
      "logistics_appointments",
      "driver_deliveries",
    ],
  },
  logistics_qr: {
    label: "QR Stok",
    icon: "cube-outline",
    activeIcon: "cube",
    screenId: "logistics_qr",
    requiredModules: ["qr_micro_consumption", "warehouse_inventory", "material_requests"],
  },
  routes: {
    label: "Rotam",
    icon: "navigate-outline",
    activeIcon: "navigate",
    screenId: "routes",
    requiredModules: ["route_optimization", "driver_deliveries", "inspections", "samples_core"],
  },
  isg: {
    label: "İSG",
    icon: "medkit-outline",
    activeIcon: "medkit",
    screenId: "isg",
    requiredModules: ["near_miss", "sos_alarm", "isg_dashboard"],
  },
  ai_vision: {
    label: "AI Tara",
    icon: "scan-outline",
    activeIcon: "scan",
    screenId: "ai_vision",
    requiredModules: ["ai_vision", "site_camera"],
  },
  chat: {
    label: "İletişim",
    icon: "chatbubbles-outline",
    activeIcon: "chatbubbles",
    screenId: "chat",
    requiredModules: ["internal_comms", "ptt_chat"],
  },
};

export function getDynamicTabs(
  role: SystemRole | string | undefined,
  _tenantType: TenantType | undefined,
  allowedModules: ModuleKey[]
): { slot2: DynamicTabConfig; slot4: DynamicTabConfig } {
  const upperRole = String(role || "WORKER").toUpperCase();

  let preferred: [
    { screenId: Exclude<NativeScreenId, "dashboard">; label?: string },
    { screenId: Exclude<NativeScreenId, "dashboard">; label?: string },
  ] = [{ screenId: "attendance", label: "QR Puantaj" }, { screenId: "tasks", label: "Görevlerim" }];

  if (["ADMIN", "PROJECT_MANAGER", "FRANCHISE_ADMIN", "SUPER_ADMIN"].includes(upperRole)) {
    preferred = [
      { screenId: "tasks", label: "Kontrol" },
      { screenId: "hr_requests", label: "Onaylar" },
    ];
  } else if (
    ["SITE_MANAGER", "ENGINEER", "ARCHITECT", "FITOUT_SUPERVISOR"].includes(upperRole)
  ) {
    preferred = [
      { screenId: "journal", label: "Jurnal" },
      { screenId: "tasks", label: "İş Emirleri" },
    ];
  } else if (
    ["INSPECTION_ADMIN", "INSPECTOR", "PROJECT_AUDITOR", "AUDITOR", "INSPECTION_OFFICE"].includes(
      upperRole
    )
  ) {
    preferred = [
      { screenId: "inspections", label: "Denetimler" },
      { screenId: "samples", label: "Karot QR" },
    ];
  } else if (upperRole === "LAB_TECH") {
    preferred = [
      { screenId: "samples", label: "Numune QR" },
      { screenId: "routes", label: "Rotam" },
    ];
  } else if (upperRole === "SUBCONTRACTOR") {
    preferred = [
      { screenId: "work_proofs", label: "İş Kanıtı" },
      { screenId: "deficiencies", label: "Kusurlar" },
    ];
  } else if (upperRole === "DRIVER") {
    preferred = [
      { screenId: "routes", label: "Güzergahım" },
      { screenId: "logistics", label: "Teslimat" },
    ];
  } else if (upperRole === "REGIONAL_MANAGER") {
    preferred = [
      { screenId: "routes", label: "Güzergahım" },
      { screenId: "deficiencies", label: "Denetimler" },
    ];
  } else if (["SECURITY", "WAREHOUSE_MANAGER", "EQUIPMENT_MANAGER"].includes(upperRole)) {
    preferred = [
      { screenId: "logistics", label: "Mal Kabul" },
      { screenId: "logistics_qr", label: "QR Stok" },
    ];
  } else if (upperRole === "ISG_EXPERT") {
    preferred = [
      { screenId: "isg", label: "İSG Radar" },
      { screenId: "deficiencies", label: "Kusurlar" },
    ];
  } else if (
    ["FINANCE_MANAGER", "INSPECTION_FINANCE", "HR_MANAGER", "ACCOUNTANT", "MUHASEBE", "HR_STAFF"].includes(
      upperRole
    )
  ) {
    preferred = [
      { screenId: "hr_requests", label: "Onaylar" },
      { screenId: "hr_self", label: "Özlük" },
    ];
  } else if (["FRANCHISEE", "BRANCH_MANAGER"].includes(upperRole)) {
    preferred = [
      { screenId: "deficiencies", label: "Eksiklikler" },
      { screenId: "chat", label: "İletişim" },
    ];
  } else if (["WORKER", "STAFF", "FITOUT_TECH"].includes(upperRole)) {
    preferred = [
      { screenId: "attendance", label: "QR Puantaj" },
      { screenId: "tasks", label: "Görevlerim" },
    ];
  }

  const pickAllowed = (
    candidate: { screenId: Exclude<NativeScreenId, "dashboard">; label?: string },
    excludeScreen?: NativeScreenId
  ): DynamicTabConfig => {
    const meta = SCREEN_TO_TAB_META[candidate.screenId];
    if (
      hasAnyModuleAccess(upperRole, allowedModules, meta.requiredModules) &&
      candidate.screenId !== excludeScreen
    ) {
      return {
        id: candidate.screenId,
        ...meta,
        label: candidate.label || meta.label,
      };
    }

    const fallbackEntry = Object.values(SCREEN_TO_TAB_META).find(
      (m) =>
        m.screenId !== excludeScreen &&
        hasAnyModuleAccess(upperRole, allowedModules, m.requiredModules)
    );

    if (fallbackEntry) {
      return {
        id: fallbackEntry.screenId,
        ...fallbackEntry,
      };
    }

    return {
      id: "hr_self",
      ...SCREEN_TO_TAB_META.hr_self,
    };
  };

  const slot2 = pickAllowed(preferred[0]);
  const slot4 = pickAllowed(preferred[1], slot2.screenId);

  return { slot2, slot4 };
}

export function getFabActions(
  role: SystemRole | string | undefined,
  allowedModules: ModuleKey[]
): FabActionItem[] {
  const upperRole = String(role || "").toUpperCase();
  const isReviewer = [
    "ADMIN",
    "SUPER_ADMIN",
    "PROJECT_MANAGER",
    "SITE_MANAGER",
    "ENGINEER",
    "ARCHITECT",
    "FITOUT_SUPERVISOR",
  ].includes(upperRole);

  const candidates: FabActionItem[] = [
    {
      id: "fab_attendance",
      title: "QR Mesai Giriş/Çıkış",
      subtitle: "Kamera veya GPS doğrulama",
      icon: "qr-code",
      color: "#34C759",
      bgColor: "rgba(52, 199, 89, 0.16)",
      screenId: "attendance",
      requiredModules: ["my_attendance_qr", "attendance"],
    },
    {
      id: "fab_work_proof_upload",
      title:
        upperRole === "SUBCONTRACTOR"
          ? "İş Kanıtı Yükle"
          : isReviewer
          ? "İş Kanıtı Onay / Kayıt"
          : "İş Kanıtı",
      subtitle:
        upperRole === "SUBCONTRACTOR"
          ? "Fotoğraflı metraj beyanı"
          : "Gelen iş kanıtlarını incele",
      icon: "camera",
      color: "#FF9500",
      bgColor: "rgba(255, 149, 0, 0.16)",
      screenId: "work_proofs",
      requiredModules: ["work_proofs"],
    },
    {
      id: "fab_journal",
      title: "Şantiye Jurnali Yaz",
      subtitle: "Günlük ekip ve hava raporu",
      icon: "book",
      color: "#0A7AFF",
      bgColor: "rgba(10, 122, 255, 0.16)",
      screenId: "journal",
      requiredModules: ["site_journal"],
    },
    {
      id: "fab_inspection",
      title: "Yeni Denetim Vizesi",
      subtitle: "Demir, kalıp ve beton kontrolü",
      icon: "shield-checkmark",
      color: "#AF52DE",
      bgColor: "rgba(175, 82, 222, 0.16)",
      screenId: "inspections",
      requiredModules: ["inspections", "reinforcement_check"],
    },
    {
      id: "fab_sample",
      title: "Karot / Numune QR",
      subtitle: "Taze numune veya lab sonucu",
      icon: "flask",
      color: "#30B0C7",
      bgColor: "rgba(48, 176, 199, 0.16)",
      screenId: "samples",
      requiredModules: ["samples_core", "concrete_pouring_qa"],
    },
    {
      id: "fab_deficiency",
      title: "Kusur / DÖF Aç",
      subtitle: "Fotoğraflı saha eksikliği",
      icon: "warning",
      color: "#FF3B30",
      bgColor: "rgba(255, 59, 48, 0.16)",
      screenId: "deficiencies",
      requiredModules: ["deficiencies", "ncr_dof"],
    },
    {
      id: "fab_form",
      title: "Dinamik Form Doldur",
      subtitle: "Saha kontrol listesi gönder",
      icon: "document-text",
      color: "#5856D6",
      bgColor: "rgba(88, 86, 214, 0.16)",
      screenId: "forms",
      requiredModules: ["dynamic_forms", "form_builder"],
    },
    {
      id: "fab_ai",
      title: "AI Görsel Analiz",
      subtitle: "Çatlak & İSG yapay zeka tarama",
      icon: "scan",
      color: "#00C7BE",
      bgColor: "rgba(0, 199, 190, 0.16)",
      screenId: "ai_vision",
      requiredModules: ["ai_vision", "site_camera"],
    },
    {
      id: "fab_hr",
      title: "İzin / Avans / Masraf",
      subtitle: "Fiş fotoğraflı talep gönder",
      icon: "receipt",
      color: "#FF9500",
      bgColor: "rgba(255, 149, 0, 0.16)",
      screenId: "hr_requests",
      requiredModules: ["my_leaves", "my_salary_advances", "my_expenses"],
    },
    {
      id: "fab_logistics_qr",
      title: "QR Stok / Malzeme Talebi",
      subtitle: "Depo sarfiyat veya talep oluştur",
      icon: "cube",
      color: "#30B0C7",
      bgColor: "rgba(48, 176, 199, 0.16)",
      screenId: "logistics_qr",
      params: { tab: "qr" },
      requiredModules: ["qr_micro_consumption", "material_requests", "goods_receiving"],
    },
    {
      id: "fab_near_miss",
      title: "Ramak Kala Bildir",
      subtitle: "İSG olay ve tehlike kaydı",
      icon: "alert-circle",
      color: "#FF9500",
      bgColor: "rgba(255, 149, 0, 0.16)",
      screenId: "isg",
      params: { tab: "near_miss" },
      requiredModules: ["near_miss", "isg_dashboard"],
    },
    {
      id: "fab_sos",
      title: "Acil Durum SOS",
      subtitle: "Kırmızı siren & canlı GPS",
      icon: "medkit",
      color: "#FF3B30",
      bgColor: "rgba(255, 59, 48, 0.22)",
      screenId: "isg",
      params: { tab: "sos" },
      requiredModules: ["sos_alarm"],
    },
  ];

  return candidates.filter((item) =>
    hasAnyModuleAccess(upperRole, allowedModules, item.requiredModules)
  );
}

export function getAuthorizedModules(
  role: SystemRole | string | undefined,
  allowedModules: ModuleKey[]
): MobileModuleItem[] {
  return MOBILE_MODULES.filter((mod) =>
    hasAnyModuleAccess(role, allowedModules, mod.requiredModules)
  );
}

export function isNativeScreenAuthorized(
  screenId: NativeScreenId,
  role: SystemRole | string | undefined,
  allowedModules: ModuleKey[]
): boolean {
  if (screenId === "dashboard") return true;
  const meta = SCREEN_TO_TAB_META[screenId];
  if (!meta) return false;
  return hasAnyModuleAccess(role, allowedModules, meta.requiredModules);
}

