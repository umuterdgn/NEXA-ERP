/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Nexa ERP - Merkezi Rol Bazlı Erişim Kontrolü (RBAC) & Modül İzin Motoru
 *
 * Web, Mobil (/api/mobile/*), Sidebar, Middleware/Proxy ve Modal Yetki Seçicileri
 * için TEK VE DEĞİŞMEZ OTORİTE KAYNAĞI.
 */

// ============================================================================
// 1. İŞLETME TİPLERİ VE ROLLER
// ============================================================================

export type TenantType = "CONTRACTOR" | "INSPECTION" | "FRANCHISE"

export type SystemRole =
  // Platform Süper Yöneticisi
  | "SUPER_ADMIN"
  // Müteahhit (CONTRACTOR) Rolleri
  | "ADMIN"
  | "PROJECT_MANAGER"
  | "SITE_MANAGER"
  | "ENGINEER"
  | "ARCHITECT"
  | "ISG_EXPERT"
  | "FINANCE_MANAGER"
  | "HR_MANAGER"
  | "PROCUREMENT_MANAGER"
  | "WAREHOUSE_MANAGER"
  | "SECURITY"
  | "DRIVER"
  | "WORKER"
  | "SUBCONTRACTOR"
  // Yapı Denetim (INSPECTION) Rolleri
  | "INSPECTION_ADMIN"
  | "PROJECT_AUDITOR"
  | "INSPECTOR"
  | "LAB_TECH"
  | "INSPECTION_OFFICE"
  | "INSPECTION_FINANCE"
  // Franchise (FRANCHISE) Rolleri
  | "FRANCHISE_ADMIN"
  | "REGIONAL_MANAGER"
  | "FRANCHISEE"
  | "FITOUT_SUPERVISOR"
  | "FITOUT_TECH"
  // Geriye Dönük Uyumluluk (Legacy Fallback)
  | "STAFF"
  | "MUHASEBE"
  | "ACCOUNTANT"
  | "HR_STAFF"
  | "PURCHASING_STAFF"
  | "EQUIPMENT_MANAGER"
  | "MUTEAHHIT"
  | "AUDITOR"
  | "BRANCH_MANAGER"
  | "CLIENT"
  | "INVESTOR"
  | "SUPPLIER"

export type LocationTrackingMode = "SITE_LIVE" | "ROUTE_LIVE" | "OFF"

// ============================================================================
// 2. MODÜL HAVUZU (MODULE KEYS)
// ============================================================================

export type ModuleCategory =
  | "MANAGEMENT_BI"
  | "HR_PERSONAL"
  | "SUBCONTRACTOR_FINANCE"
  | "PROCUREMENT_LOGISTICS"
  | "INSPECTION_QUALITY"
  | "HSE_FIELD_OPS"
  | "SYSTEM"

export type ModuleKey =
  // Yönetim & BI
  | "dashboard"
  | "site_map"
  | "projects"
  | "progress"
  | "control_center"
  | "crm"
  | "bim_3d"
  | "boq"
  // İK & Kişisel
  | "personnel"
  | "personnel_tracking"
  | "isg_doc_alerts"
  | "attendance"
  | "payroll"
  | "shifts"
  | "approvals"
  | "food_menu"
  | "my_attendance_qr"
  | "my_shifts_history"
  | "my_leaves"
  | "my_salary_advances"
  | "my_expenses"
  | "my_announcements"
  | "my_profile"
  // Taşeron & Finans
  | "work_proofs"
  | "subcontractor_inspections"
  | "progress_payments"
  | "subcontractor_contracts"
  | "subcontractor_isg"
  | "deductions"
  | "finance_cash"
  | "expense_approvals"
  | "checks_notes"
  | "contracts"
  | "collection_risk"
  // Tedarik & Lojistik
  | "procurement"
  | "gate_security"
  | "goods_receiving"
  | "logistics_map"
  | "route_optimization"
  | "warehouse_inventory"
  | "qr_micro_consumption"
  | "material_requests"
  | "equipments"
  | "my_assigned_equipments"
  | "logistics_appointments"
  | "driver_deliveries"
  // Yapı Denetim & Kalite
  | "dynamic_forms"
  | "form_builder"
  | "damage_assessment"
  | "samples_core"
  | "reinforcement_check"
  | "site_camera"
  | "attachments_evidence"
  | "license_archive"
  | "digital_archive"
  | "smart_ocr"
  | "field_reports"
  | "ai_vision"
  | "revisions"
  | "drone_maps"
  | "digital_drawings"
  | "free_drawing"
  | "inspections"
  | "deficiencies"
  | "material_approvals"
  | "ncr_dof"
  | "concrete_pouring_qa"
  | "yibf_integration"
  // İSG & Saha Operasyon
  | "isg_dashboard"
  | "isg_risk_plan"
  | "isg_certificates"
  | "near_miss"
  | "ppe_forms"
  | "tasks_work_orders"
  | "site_journal"
  | "internal_comms"
  | "ptt_chat"
  | "sos_alarm"
  | "offline_sync"
  // Sistem
  | "system_health"
  | "users_management"
  | "system_logs"
  | "audit_logs"
  | "notifications"
  | "announcements_admin"
  | "settings_branding"

// ============================================================================
// 3. ROL METAVERİLERİ & TÜRKÇE BAŞLIKLARI
// ============================================================================

export interface RoleMeta {
  role: SystemRole
  title: string
  tenantType: TenantType | "PLATFORM"
  description: string
  defaultWebRoute: string
  locationTrackingMode: LocationTrackingMode
}

export const ROLE_DEFINITIONS: Record<SystemRole, RoleMeta> = {
  // PLATFORM
  SUPER_ADMIN: {
    role: "SUPER_ADMIN",
    title: "Sistem Süper Yöneticisi",
    tenantType: "PLATFORM",
    description: "Tüm sistem, kiracılar, veri tabanı ve yetki yönetimi",
    defaultWebRoute: "/admin",
    locationTrackingMode: "OFF",
  },

  // MÜTEAHHİT (CONTRACTOR)
  ADMIN: {
    role: "ADMIN",
    title: "Şirket Yöneticisi (Müteahhit Admin)",
    tenantType: "CONTRACTOR",
    description: "Tüm şantiyeler, finans, İK, sözleşmeler ve şirket yönetimi",
    defaultWebRoute: "/admin",
    locationTrackingMode: "OFF",
  },
  PROJECT_MANAGER: {
    role: "PROJECT_MANAGER",
    title: "Proje Müdürü / Koordinatör",
    tenantType: "CONTRACTOR",
    description: "Projeler, ilerleyiş, taşeron ve hakediş onayları, BIM ve BoQ yönetimi",
    defaultWebRoute: "/admin",
    locationTrackingMode: "OFF",
  },
  SITE_MANAGER: {
    role: "SITE_MANAGER",
    title: "Şantiye Şefi",
    tenantType: "CONTRACTOR",
    description: "Şantiye günlüğü, iş emirleri, 2. kademe kanıt onayı, revizyon ve saha operasyonu",
    defaultWebRoute: "/admin",
    locationTrackingMode: "SITE_LIVE",
  },
  ENGINEER: {
    role: "ENGINEER",
    title: "Saha Mühendisi (İnşaat / Makine / Elektrik)",
    tenantType: "CONTRACTOR",
    description: "3D BIM, AR, revizyon, BoQ, 1. kademe iş kanıtı onayı, kalite denetimi",
    defaultWebRoute: "/personnel",
    locationTrackingMode: "SITE_LIVE",
  },
  ARCHITECT: {
    role: "ARCHITECT",
    title: "Mimar / Dizayn Ofis Sorumlusu",
    tenantType: "CONTRACTOR",
    description: "Mimari paftalar, 3D BIM, as-built revizyonlar, mahal listesi ve BoQ",
    defaultWebRoute: "/personnel",
    locationTrackingMode: "SITE_LIVE",
  },
  ISG_EXPERT: {
    role: "ISG_EXPERT",
    title: "İSG Uzmanı",
    tenantType: "CONTRACTOR",
    description: "İş sağlığı ve güvenliği denetimleri, ramak kala, KKD zimmetleri ve risk planı",
    defaultWebRoute: "/admin/isg",
    locationTrackingMode: "SITE_LIVE",
  },
  FINANCE_MANAGER: {
    role: "FINANCE_MANAGER",
    title: "Finans & Muhasebe Müdürü",
    tenantType: "CONTRACTOR",
    description: "Kasa, banka, çek/senet, taşeron hakedişleri, kesintiler ve tahsilat riski",
    defaultWebRoute: "/admin/finance",
    locationTrackingMode: "OFF",
  },
  HR_MANAGER: {
    role: "HR_MANAGER",
    title: "İnsan Kaynakları Müdürü",
    tenantType: "CONTRACTOR",
    description: "Personel kartları, süreli evrak takibi, puantaj, bordro ve izin onayları",
    defaultWebRoute: "/admin/personel",
    locationTrackingMode: "OFF",
  },
  PROCUREMENT_MANAGER: {
    role: "PROCUREMENT_MANAGER",
    title: "Satınalma & Tedarik Müdürü",
    tenantType: "CONTRACTOR",
    description: "Satınalma talepleri, malzeme teklifleri (RFQ), onaylar ve ambar kontrolü",
    defaultWebRoute: "/admin/procurement",
    locationTrackingMode: "OFF",
  },
  WAREHOUSE_MANAGER: {
    role: "WAREHOUSE_MANAGER",
    title: "Ambar & Depo Sorumlusu",
    tenantType: "CONTRACTOR",
    description: "Malzeme kabul/tesellüm, ambar stokları, QR mikro tüketim ve demirbaş zimmetleri",
    defaultWebRoute: "/personnel",
    locationTrackingMode: "SITE_LIVE",
  },
  SECURITY: {
    role: "SECURITY",
    title: "Kapı Güvenlik Görevlisi",
    tenantType: "CONTRACTOR",
    description: "Şantiye araç giriş/çıkış kontrolü, ziyaretçi kaydı ve personel QR okutma",
    defaultWebRoute: "/personnel",
    locationTrackingMode: "SITE_LIVE",
  },
  DRIVER: {
    role: "DRIVER",
    title: "Lojistik / Sevkiyat Şoförü",
    tenantType: "CONTRACTOR",
    description: "Sevkiyat görevleri, canlı rota optimizasyonu, QR teslimat ve yakıt/fiş takibi",
    defaultWebRoute: "/personnel",
    locationTrackingMode: "ROUTE_LIVE",
  },
  WORKER: {
    role: "WORKER",
    title: "Saha Çalışanı / Usta / İşçi",
    tenantType: "CONTRACTOR",
    description: "QR giriş-çıkış, görevlerim, KKD, mesai geçmişi ve acil SOS",
    defaultWebRoute: "/personnel",
    locationTrackingMode: "SITE_LIVE",
  },
  SUBCONTRACTOR: {
    role: "SUBCONTRACTOR",
    title: "Taşeron Firma Temsilcisi",
    tenantType: "CONTRACTOR",
    description: "Sözleşmeli iş emirleri, fotoğraflı iş kanıtı yükleme, hakediş ve kesintilerim",
    defaultWebRoute: "/subcontractor",
    locationTrackingMode: "SITE_LIVE",
  },

  // YAPI DENETİM (INSPECTION)
  INSPECTION_ADMIN: {
    role: "INSPECTION_ADMIN",
    title: "Yapı Denetim Şirket Müdürü",
    tenantType: "INSPECTION",
    description: "Tüm denetim projeleri, YİBF entegrasyonu, finans, sözleşmeler ve şirket yönetimi",
    defaultWebRoute: "/inspection",
    locationTrackingMode: "OFF",
  },
  PROJECT_AUDITOR: {
    role: "PROJECT_AUDITOR",
    title: "Proje & Uygulama Denetçisi",
    tenantType: "INSPECTION",
    description: "YİBF mimari/statik denetimi, 3D BIM kontrolü, ruhsat arşivi ve DÖF onayları",
    defaultWebRoute: "/inspection",
    locationTrackingMode: "ROUTE_LIVE",
  },
  INSPECTOR: {
    role: "INSPECTOR",
    title: "Kontrol Elemanı / Saha Denetçisi",
    tenantType: "INSPECTION",
    description: "Saha denetim rotası, dinamik formlar, demir/kalıp vizesi, beton kırım ve DÖF",
    defaultWebRoute: "/inspection/field",
    locationTrackingMode: "ROUTE_LIVE",
  },
  LAB_TECH: {
    role: "LAB_TECH",
    title: "Laboratuvar & Karot Teknisyeni",
    tenantType: "INSPECTION",
    description: "Karot/beton QR numune takibi, kırım testleri, OCR raporları ve rota optimizasyonu",
    defaultWebRoute: "/inspection/samples",
    locationTrackingMode: "ROUTE_LIVE",
  },
  INSPECTION_OFFICE: {
    role: "INSPECTION_OFFICE",
    title: "YİBF & Evrak Sorumlusu",
    tenantType: "INSPECTION",
    description: "Ruhsat arşivi, dijital evraklar, OCR, form oluşturucu ve YİBF işlemleri",
    defaultWebRoute: "/inspection/documents",
    locationTrackingMode: "OFF",
  },
  INSPECTION_FINANCE: {
    role: "INSPECTION_FINANCE",
    title: "Yapı Denetim Finans Sorumlusu",
    tenantType: "INSPECTION",
    description: "Denetim hakedişleri, kasa, çek/senet, tahsilatlar ve masraf onayları",
    defaultWebRoute: "/inspection/finance",
    locationTrackingMode: "OFF",
  },

  // FRANCHISE (FRANCHISE)
  FRANCHISE_ADMIN: {
    role: "FRANCHISE_ADMIN",
    title: "Franchise Genel Müdürü / Marka Sahibi",
    tenantType: "FRANCHISE",
    description: "Tüm şubeler dashboard, bütçe, demirbaş standartları, 3D mağaza BIM ve marka yönetimi",
    defaultWebRoute: "/franchise",
    locationTrackingMode: "OFF",
  },
  REGIONAL_MANAGER: {
    role: "REGIONAL_MANAGER",
    title: "Franchise Bölge Müdürü",
    tenantType: "FRANCHISE",
    description: "Bölge şubeleri, açılış denetimleri, rota optimizasyonu, eksiklikler ve standart kontrolü",
    defaultWebRoute: "/franchise",
    locationTrackingMode: "ROUTE_LIVE",
  },
  FRANCHISEE: {
    role: "FRANCHISEE",
    title: "Franchise Şube Sahibi / Bayi",
    tenantType: "FRANCHISE",
    description: "Kendi şubesinin kurulumu, 3D mağaza modeli, demirbaşlar, ödeme ve duyurular",
    defaultWebRoute: "/franchise/branch",
    locationTrackingMode: "OFF",
  },
  FITOUT_SUPERVISOR: {
    role: "FITOUT_SUPERVISOR",
    title: "Mağaza Kurulum Şefi (Fitout Supervisor)",
    tenantType: "FRANCHISE",
    description: "Mağaza şantiyesi, mimari revizyon, kurulum jurnali, taşeron iş kanıtı onayı ve teslimat QR",
    defaultWebRoute: "/personnel",
    locationTrackingMode: "SITE_LIVE",
  },
  FITOUT_TECH: {
    role: "FITOUT_TECH",
    title: "Kurulum & Servis Teknisyeni",
    tenantType: "FRANCHISE",
    description: "Montaj/kurulum görevleri, demirbaş QR montaj, fotoğraflı kanıt ve saha masrafları",
    defaultWebRoute: "/personnel",
    locationTrackingMode: "ROUTE_LIVE",
  },

  // LEGACY FALLBACKS
  STAFF: {
    role: "STAFF",
    title: "Personel (Standart)",
    tenantType: "CONTRACTOR",
    description: "Genel personel yetkisi",
    defaultWebRoute: "/personnel",
    locationTrackingMode: "SITE_LIVE",
  },
  MUHASEBE: {
    role: "MUHASEBE",
    title: "Muhasebe Yetkilisi",
    tenantType: "CONTRACTOR",
    description: "Finans ve muhasebe işlemleri",
    defaultWebRoute: "/admin/finance",
    locationTrackingMode: "OFF",
  },
  ACCOUNTANT: {
    role: "ACCOUNTANT",
    title: "Muhasebeci",
    tenantType: "CONTRACTOR",
    description: "Finans ve muhasebe işlemleri",
    defaultWebRoute: "/admin/finance",
    locationTrackingMode: "OFF",
  },
  HR_STAFF: {
    role: "HR_STAFF",
    title: "İK Personeli",
    tenantType: "CONTRACTOR",
    description: "İnsan kaynakları ve puantaj",
    defaultWebRoute: "/admin/personel",
    locationTrackingMode: "OFF",
  },
  PURCHASING_STAFF: {
    role: "PURCHASING_STAFF",
    title: "Satınalma Personeli",
    tenantType: "CONTRACTOR",
    description: "Satınalma siparişleri ve tedarik",
    defaultWebRoute: "/admin/procurement",
    locationTrackingMode: "OFF",
  },
  EQUIPMENT_MANAGER: {
    role: "EQUIPMENT_MANAGER",
    title: "Makine / Ekipman Sorumlusu",
    tenantType: "CONTRACTOR",
    description: "Ekipman ve ambar yönetimi",
    defaultWebRoute: "/personnel",
    locationTrackingMode: "SITE_LIVE",
  },
  MUTEAHHIT: {
    role: "MUTEAHHIT",
    title: "Müteahhit Firma Yetkilisi",
    tenantType: "CONTRACTOR",
    description: "Müteahhit tam yetki",
    defaultWebRoute: "/admin",
    locationTrackingMode: "OFF",
  },
  AUDITOR: {
    role: "AUDITOR",
    title: "Denetçi (Auditor)",
    tenantType: "INSPECTION",
    description: "Yapı denetim saha ve proje denetçisi",
    defaultWebRoute: "/inspection",
    locationTrackingMode: "ROUTE_LIVE",
  },
  BRANCH_MANAGER: {
    role: "BRANCH_MANAGER",
    title: "Şube Müdürü",
    tenantType: "FRANCHISE",
    description: "Franchise şube yönetimi",
    defaultWebRoute: "/franchise/branch",
    locationTrackingMode: "OFF",
  },
  CLIENT: {
    role: "CLIENT",
    title: "Müşteri / İşveren",
    tenantType: "CONTRACTOR",
    description: "İşveren portalı",
    defaultWebRoute: "/investor/dashboard",
    locationTrackingMode: "OFF",
  },
  INVESTOR: {
    role: "INVESTOR",
    title: "Yatırımcı / Hak Sahibi",
    tenantType: "CONTRACTOR",
    description: "Yatırımcı portalı",
    defaultWebRoute: "/investor/dashboard",
    locationTrackingMode: "OFF",
  },
  SUPPLIER: {
    role: "SUPPLIER",
    title: "Tedarikçi",
    tenantType: "CONTRACTOR",
    description: "Tedarikçi portalı",
    defaultWebRoute: "/personnel",
    locationTrackingMode: "OFF",
  },
}

// ============================================================================
// 4. İŞLETME TİPİNE GÖRE ATANABİLİR ROLLER
// ============================================================================

export function getAssignableRolesForTenant(tenantType?: string | null): RoleMeta[] {
  const normalizedType = normalizeTenantType(tenantType)

  const rolesByTenant: Record<TenantType, SystemRole[]> = {
    CONTRACTOR: [
      "ADMIN",
      "PROJECT_MANAGER",
      "SITE_MANAGER",
      "ENGINEER",
      "ARCHITECT",
      "ISG_EXPERT",
      "FINANCE_MANAGER",
      "HR_MANAGER",
      "PROCUREMENT_MANAGER",
      "WAREHOUSE_MANAGER",
      "SECURITY",
      "DRIVER",
      "WORKER",
      "SUBCONTRACTOR",
    ],
    INSPECTION: [
      "INSPECTION_ADMIN",
      "PROJECT_AUDITOR",
      "INSPECTOR",
      "LAB_TECH",
      "INSPECTION_OFFICE",
      "INSPECTION_FINANCE",
    ],
    FRANCHISE: [
      "FRANCHISE_ADMIN",
      "REGIONAL_MANAGER",
      "FRANCHISEE",
      "FITOUT_SUPERVISOR",
      "FITOUT_TECH",
    ],
  }

  const selectedRoles = rolesByTenant[normalizedType] || rolesByTenant.CONTRACTOR
  return selectedRoles.map((r) => ROLE_DEFINITIONS[r]).filter(Boolean)
}

export function normalizeTenantType(type?: string | null): TenantType {
  if (!type) return "CONTRACTOR"
  const upper = String(type).toUpperCase().trim()
  if (upper === "INSPECTION" || upper === "YAPI_DENETIM") return "INSPECTION"
  if (upper === "FRANCHISE") return "FRANCHISE"
  if (upper === "CONTRACTOR" || upper === "MAIN_CONTRACTOR" || upper === "MUTEAHHIT") return "CONTRACTOR"
  return "CONTRACTOR"
}

// ============================================================================
// 5. ROL -> İZİNLİ MODÜLLER EŞLEMESİ (STRICT ISOLATION)
// ============================================================================

const COMMON_PERSONAL_MODULES: ModuleKey[] = [
  "my_attendance_qr",
  "my_shifts_history",
  "my_leaves",
  "my_salary_advances",
  "my_expenses",
  "my_announcements",
  "my_profile",
  "internal_comms",
  "ptt_chat",
  "sos_alarm",
  "offline_sync",
]

const ALL_SYSTEM_MODULES: ModuleKey[] = [
  "system_health",
  "users_management",
  "system_logs",
  "audit_logs",
  "notifications",
  "announcements_admin",
  "settings_branding",
]

export const ROLE_PERMISSION_MATRIX: Record<SystemRole, ModuleKey[]> = {
  // SUPER_ADMIN: Tüm modüllere tam yetki
  SUPER_ADMIN: [
    "dashboard",
    "site_map",
    "projects",
    "progress",
    "control_center",
    "crm",
    "bim_3d",
    "boq",
    "personnel",
    "personnel_tracking",
    "isg_doc_alerts",
    "attendance",
    "payroll",
    "shifts",
    "approvals",
    "food_menu",
    ...COMMON_PERSONAL_MODULES,
    "work_proofs",
    "subcontractor_inspections",
    "progress_payments",
    "subcontractor_contracts",
    "subcontractor_isg",
    "deductions",
    "finance_cash",
    "expense_approvals",
    "checks_notes",
    "contracts",
    "collection_risk",
    "procurement",
    "gate_security",
    "goods_receiving",
    "logistics_map",
    "route_optimization",
    "warehouse_inventory",
    "qr_micro_consumption",
    "material_requests",
    "equipments",
    "my_assigned_equipments",
    "logistics_appointments",
    "driver_deliveries",
    "dynamic_forms",
    "form_builder",
    "damage_assessment",
    "samples_core",
    "reinforcement_check",
    "site_camera",
    "attachments_evidence",
    "license_archive",
    "digital_archive",
    "smart_ocr",
    "field_reports",
    "ai_vision",
    "revisions",
    "drone_maps",
    "digital_drawings",
    "free_drawing",
    "inspections",
    "deficiencies",
    "material_approvals",
    "ncr_dof",
    "concrete_pouring_qa",
    "yibf_integration",
    "isg_dashboard",
    "isg_risk_plan",
    "isg_certificates",
    "near_miss",
    "ppe_forms",
    "tasks_work_orders",
    "site_journal",
    ...ALL_SYSTEM_MODULES,
  ],

  // MÜTEAHHİT ADMIN: Tüm müteahhit + sistem modülleri
  ADMIN: [
    "dashboard",
    "site_map",
    "projects",
    "progress",
    "control_center",
    "crm",
    "bim_3d",
    "boq",
    "personnel",
    "personnel_tracking",
    "isg_doc_alerts",
    "attendance",
    "payroll",
    "shifts",
    "approvals",
    "food_menu",
    ...COMMON_PERSONAL_MODULES,
    "work_proofs",
    "subcontractor_inspections",
    "progress_payments",
    "subcontractor_contracts",
    "subcontractor_isg",
    "deductions",
    "finance_cash",
    "expense_approvals",
    "checks_notes",
    "contracts",
    "collection_risk",
    "procurement",
    "gate_security",
    "goods_receiving",
    "logistics_map",
    "route_optimization",
    "warehouse_inventory",
    "qr_micro_consumption",
    "material_requests",
    "equipments",
    "my_assigned_equipments",
    "logistics_appointments",
    "driver_deliveries",
    "dynamic_forms",
    "damage_assessment",
    "site_camera",
    "attachments_evidence",
    "license_archive",
    "digital_archive",
    "smart_ocr",
    "field_reports",
    "ai_vision",
    "revisions",
    "drone_maps",
    "digital_drawings",
    "inspections",
    "deficiencies",
    "material_approvals",
    "ncr_dof",
    "isg_dashboard",
    "isg_risk_plan",
    "isg_certificates",
    "near_miss",
    "ppe_forms",
    "tasks_work_orders",
    "site_journal",
    "users_management",
    "audit_logs",
    "notifications",
    "announcements_admin",
    "settings_branding",
  ],

  // PROJE MÜDÜRÜ: Yönetim, projeler, BIM/BoQ, ilerleyiş, taşeron/hakediş, onaylar, saha operasyon (Kasa detay/sistem logları hariç)
  PROJECT_MANAGER: [
    "dashboard",
    "site_map",
    "projects",
    "progress",
    "control_center",
    "bim_3d",
    "boq",
    "personnel",
    "personnel_tracking",
    "attendance",
    "shifts",
    "approvals",
    ...COMMON_PERSONAL_MODULES,
    "work_proofs",
    "subcontractor_inspections",
    "progress_payments",
    "subcontractor_contracts",
    "subcontractor_isg",
    "deductions",
    "contracts",
    "procurement",
    "goods_receiving",
    "logistics_map",
    "material_requests",
    "equipments",
    "dynamic_forms",
    "site_camera",
    "attachments_evidence",
    "digital_archive",
    "field_reports",
    "ai_vision",
    "revisions",
    "drone_maps",
    "inspections",
    "deficiencies",
    "material_approvals",
    "ncr_dof",
    "isg_dashboard",
    "isg_risk_plan",
    "near_miss",
    "ppe_forms",
    "tasks_work_orders",
    "site_journal",
    "notifications",
  ],

  // ŞANTİYE ŞEFİ: Atandığı şantiye haritası, jurnal, iş emirleri, 2. kademe kanıt onayı, BIM/AR, revizyon, beton/demir/kalıp, eksiklik/DÖF, İSG, malzeme talebi, puantaj/vardiya, chat/PTT
  SITE_MANAGER: [
    "dashboard",
    "site_map",
    "projects",
    "progress",
    "bim_3d",
    "boq",
    "personnel_tracking",
    "attendance",
    "shifts",
    "approvals",
    "food_menu",
    ...COMMON_PERSONAL_MODULES,
    "work_proofs",
    "subcontractor_inspections",
    "deductions",
    "material_requests",
    "goods_receiving",
    "equipments",
    "dynamic_forms",
    "samples_core",
    "reinforcement_check",
    "concrete_pouring_qa",
    "site_camera",
    "attachments_evidence",
    "field_reports",
    "ai_vision",
    "revisions",
    "digital_drawings",
    "inspections",
    "deficiencies",
    "material_approvals",
    "ncr_dof",
    "isg_dashboard",
    "isg_risk_plan",
    "near_miss",
    "ppe_forms",
    "tasks_work_orders",
    "site_journal",
  ],

  // SAHA MÜHENDİSİ: 3D BIM & AR, çizimler, revizyon, BoQ, dinamik formlar, DÖF açma, 1. kademe iş kanıtı onayı, AI görsel analiz, saha kamerası, görevler, jurnal, chat + kişisel
  ENGINEER: [
    "bim_3d",
    "boq",
    "projects",
    ...COMMON_PERSONAL_MODULES,
    "work_proofs",
    "subcontractor_inspections",
    "material_requests",
    "my_assigned_equipments",
    "dynamic_forms",
    "samples_core",
    "reinforcement_check",
    "concrete_pouring_qa",
    "site_camera",
    "attachments_evidence",
    "field_reports",
    "ai_vision",
    "revisions",
    "digital_drawings",
    "free_drawing",
    "inspections",
    "deficiencies",
    "material_approvals",
    "ncr_dof",
    "near_miss",
    "ppe_forms",
    "tasks_work_orders",
    "site_journal",
  ],

  // MİMAR: Mimari paftalar, 3D BIM, as-built revizyonlar, mahal listesi ve BoQ, çizimler
  ARCHITECT: [
    "bim_3d",
    "boq",
    "projects",
    ...COMMON_PERSONAL_MODULES,
    "work_proofs",
    "dynamic_forms",
    "site_camera",
    "attachments_evidence",
    "field_reports",
    "ai_vision",
    "revisions",
    "digital_drawings",
    "free_drawing",
    "deficiencies",
    "material_approvals",
    "tasks_work_orders",
    "site_journal",
  ],

  // İSG UZMANI: Tüm İSG modülleri, süreli evrak alarmları, harita (BLE risk), ramak kala, KKD, ceza/kesinti önerisi, chat + kişisel
  ISG_EXPERT: [
    "site_map",
    "personnel_tracking",
    "isg_doc_alerts",
    ...COMMON_PERSONAL_MODULES,
    "subcontractor_isg",
    "deductions",
    "site_camera",
    "attachments_evidence",
    "field_reports",
    "ai_vision",
    "deficiencies",
    "ncr_dof",
    "isg_dashboard",
    "isg_risk_plan",
    "isg_certificates",
    "near_miss",
    "ppe_forms",
    "tasks_work_orders",
  ],

  // FİNANS & MUHASEBE MÜDÜRÜ: Finans/kasa, masraf fiş onayı, çek/senet, hakediş, sözleşmeler, kesintiler, tahsilat risk AI, bordro
  FINANCE_MANAGER: [
    "dashboard",
    "payroll",
    "approvals",
    ...COMMON_PERSONAL_MODULES,
    "progress_payments",
    "subcontractor_contracts",
    "deductions",
    "finance_cash",
    "expense_approvals",
    "checks_notes",
    "contracts",
    "collection_risk",
    "notifications",
  ],

  // İK MÜDÜRÜ: Personeller, personel takibi, süreli evrak, puantaj, bordro, vardiya, izin/avans onay, yemek menüsü, duyuru
  HR_MANAGER: [
    "dashboard",
    "personnel",
    "personnel_tracking",
    "isg_doc_alerts",
    "attendance",
    "payroll",
    "shifts",
    "approvals",
    "food_menu",
    ...COMMON_PERSONAL_MODULES,
    "announcements_admin",
    "notifications",
  ],

  // SATINALMA & TEDARİK MÜDÜRÜ: Satınalma/RFQ, CRM, malzeme onayları, sözleşmeler, ambar özeti, lojistik randevu
  PROCUREMENT_MANAGER: [
    "dashboard",
    "crm",
    "approvals",
    ...COMMON_PERSONAL_MODULES,
    "procurement",
    "goods_receiving",
    "warehouse_inventory",
    "material_requests",
    "equipments",
    "logistics_appointments",
    "contracts",
    "material_approvals",
    "notifications",
  ],

  // AMBAR & DEPO SORUMLUSU: Ambar/karekod, malzeme kabul/tesellüm, QR mikro tüketim, malzeme talepleri, demirbaş + kişisel
  WAREHOUSE_MANAGER: [
    ...COMMON_PERSONAL_MODULES,
    "goods_receiving",
    "warehouse_inventory",
    "qr_micro_consumption",
    "material_requests",
    "equipments",
    "my_assigned_equipments",
    "logistics_appointments",
    "tasks_work_orders",
  ],

  // KAPI GÜVENLİK GÖREVLİSİ: Kapı güvenlik & lojistik, araç randevu/giriş-çıkış, ziyaretçi, personel QR/NFC okutma, SOS + kişisel
  SECURITY: [
    ...COMMON_PERSONAL_MODULES,
    "gate_security",
    "goods_receiving",
    "logistics_appointments",
    "attendance",
    "tasks_work_orders",
  ],

  // ŞOFÖR: Sevkiyat görevlerim, güzergah & rota optimizasyonu, canlı harita, irsaliye QR teslimat, yakıt/arıza, masraf/fiş, PTT/chat + kişisel
  DRIVER: [
    ...COMMON_PERSONAL_MODULES,
    "logistics_map",
    "route_optimization",
    "driver_deliveries",
    "my_assigned_equipments",
    "goods_receiving",
    "tasks_work_orders",
  ],

  // İŞÇİ / SAHA ÇALIŞANI: QR/NFC giriş-çıkış, mesai geçmişi, görevlerim, zimmetli ekipman/KKD, ramak kala/İSG bildirimi, izin, maaş/avans, masraf/fiş, yemek menüsü, duyurular, chat/PTT, profil
  WORKER: [
    ...COMMON_PERSONAL_MODULES,
    "my_assigned_equipments",
    "near_miss",
    "tasks_work_orders",
  ],

  // TAŞERON: Kendi sözleşmem, bana atanan iş emirleri, iş kanıtı yükleme, kendi hakediş & kesintilerim, bana atanan eksiklik/DÖF, kendi İSG evraklarım
  SUBCONTRACTOR: [
    ...COMMON_PERSONAL_MODULES,
    "work_proofs",
    "progress_payments",
    "subcontractor_contracts",
    "subcontractor_isg",
    "deductions",
    "deficiencies",
    "tasks_work_orders",
  ],

  // ==========================================================================
  // YAPI DENETİM (INSPECTION) — MÜTEAHHİT TAŞERON/AMBAR/JURNAL KESİNLİKLE YASAK
  // ==========================================================================

  INSPECTION_ADMIN: [
    "dashboard",
    "projects",
    "progress",
    "crm",
    "bim_3d",
    "boq",
    "personnel",
    "attendance",
    "payroll",
    "approvals",
    ...COMMON_PERSONAL_MODULES,
    "dynamic_forms",
    "form_builder",
    "damage_assessment",
    "samples_core",
    "reinforcement_check",
    "site_camera",
    "attachments_evidence",
    "license_archive",
    "digital_archive",
    "smart_ocr",
    "field_reports",
    "ai_vision",
    "revisions",
    "drone_maps",
    "digital_drawings",
    "free_drawing",
    "inspections",
    "deficiencies",
    "material_approvals",
    "ncr_dof",
    "concrete_pouring_qa",
    "yibf_integration",
    "finance_cash",
    "expense_approvals",
    "checks_notes",
    "contracts",
    "users_management",
    "audit_logs",
    "notifications",
    "settings_branding",
  ],

  PROJECT_AUDITOR: [
    "dashboard",
    "projects",
    "bim_3d",
    "boq",
    ...COMMON_PERSONAL_MODULES,
    "damage_assessment",
    "samples_core",
    "reinforcement_check",
    "site_camera",
    "attachments_evidence",
    "license_archive",
    "digital_archive",
    "smart_ocr",
    "field_reports",
    "ai_vision",
    "revisions",
    "digital_drawings",
    "inspections",
    "deficiencies",
    "material_approvals",
    "ncr_dof",
    "concrete_pouring_qa",
    "yibf_integration",
    "tasks_work_orders",
  ],

  INSPECTOR: [
    "projects",
    "bim_3d",
    ...COMMON_PERSONAL_MODULES,
    "route_optimization",
    "dynamic_forms",
    "damage_assessment",
    "samples_core",
    "reinforcement_check",
    "site_camera",
    "attachments_evidence",
    "smart_ocr",
    "field_reports",
    "ai_vision",
    "revisions",
    "digital_drawings",
    "free_drawing",
    "inspections",
    "deficiencies",
    "ncr_dof",
    "concrete_pouring_qa",
    "tasks_work_orders",
  ],

  LAB_TECH: [
    ...COMMON_PERSONAL_MODULES,
    "route_optimization",
    "samples_core",
    "concrete_pouring_qa",
    "attachments_evidence",
    "smart_ocr",
    "field_reports",
    "tasks_work_orders",
  ],

  INSPECTION_OFFICE: [
    "dashboard",
    "projects",
    "crm",
    ...COMMON_PERSONAL_MODULES,
    "form_builder",
    "license_archive",
    "digital_archive",
    "smart_ocr",
    "yibf_integration",
    "contracts",
    "notifications",
  ],

  INSPECTION_FINANCE: [
    "dashboard",
    "payroll",
    "approvals",
    ...COMMON_PERSONAL_MODULES,
    "finance_cash",
    "expense_approvals",
    "checks_notes",
    "contracts",
    "notifications",
  ],

  // ==========================================================================
  // FRANCHISE (FRANCHISE)
  // ==========================================================================

  FRANCHISE_ADMIN: [
    "dashboard",
    "projects",
    "progress",
    "control_center",
    "crm",
    "bim_3d",
    "personnel",
    "attendance",
    "approvals",
    ...COMMON_PERSONAL_MODULES,
    "procurement",
    "warehouse_inventory",
    "equipments",
    "dynamic_forms",
    "form_builder",
    "site_camera",
    "attachments_evidence",
    "field_reports",
    "ai_vision",
    "deficiencies",
    "ncr_dof",
    "tasks_work_orders",
    "finance_cash",
    "contracts",
    "users_management",
    "notifications",
    "settings_branding",
  ],

  REGIONAL_MANAGER: [
    "dashboard",
    "projects",
    "progress",
    "bim_3d",
    ...COMMON_PERSONAL_MODULES,
    "route_optimization",
    "dynamic_forms",
    "site_camera",
    "attachments_evidence",
    "field_reports",
    "ai_vision",
    "deficiencies",
    "ncr_dof",
    "tasks_work_orders",
    "expense_approvals",
    "notifications",
  ],

  FRANCHISEE: [
    "dashboard",
    "projects",
    "progress",
    "bim_3d",
    ...COMMON_PERSONAL_MODULES,
    "deficiencies",
    "my_assigned_equipments",
    "tasks_work_orders",
    "notifications",
  ],

  FITOUT_SUPERVISOR: [
    "projects",
    "bim_3d",
    ...COMMON_PERSONAL_MODULES,
    "work_proofs",
    "goods_receiving",
    "warehouse_inventory",
    "my_assigned_equipments",
    "dynamic_forms",
    "site_camera",
    "attachments_evidence",
    "field_reports",
    "ai_vision",
    "revisions",
    "deficiencies",
    "tasks_work_orders",
    "site_journal",
  ],

  FITOUT_TECH: [
    ...COMMON_PERSONAL_MODULES,
    "goods_receiving",
    "my_assigned_equipments",
    "attachments_evidence",
    "tasks_work_orders",
  ],

  // ==========================================================================
  // LEGACY FALLBACKS
  // ==========================================================================

  STAFF: [
    ...COMMON_PERSONAL_MODULES,
    "tasks_work_orders",
  ],

  MUHASEBE: [
    "dashboard",
    "payroll",
    ...COMMON_PERSONAL_MODULES,
    "progress_payments",
    "finance_cash",
    "expense_approvals",
    "checks_notes",
    "contracts",
    "collection_risk",
  ],

  ACCOUNTANT: [
    "dashboard",
    "payroll",
    ...COMMON_PERSONAL_MODULES,
    "progress_payments",
    "finance_cash",
    "expense_approvals",
    "checks_notes",
    "contracts",
  ],

  HR_STAFF: [
    "dashboard",
    "personnel",
    "attendance",
    "payroll",
    "shifts",
    ...COMMON_PERSONAL_MODULES,
  ],

  PURCHASING_STAFF: [
    "dashboard",
    "procurement",
    "goods_receiving",
    "warehouse_inventory",
    ...COMMON_PERSONAL_MODULES,
  ],

  EQUIPMENT_MANAGER: [
    ...COMMON_PERSONAL_MODULES,
    "warehouse_inventory",
    "equipments",
    "my_assigned_equipments",
  ],

  MUTEAHHIT: [
    "dashboard",
    "projects",
    "progress",
    "bim_3d",
    "boq",
    "personnel",
    "finance_cash",
    "contracts",
    ...COMMON_PERSONAL_MODULES,
  ],

  AUDITOR: [
    "dashboard",
    "projects",
    "bim_3d",
    ...COMMON_PERSONAL_MODULES,
    "samples_core",
    "reinforcement_check",
    "site_camera",
    "attachments_evidence",
    "field_reports",
    "deficiencies",
    "ncr_dof",
    "concrete_pouring_qa",
    "yibf_integration",
  ],

  BRANCH_MANAGER: [
    "dashboard",
    "projects",
    "progress",
    "bim_3d",
    ...COMMON_PERSONAL_MODULES,
    "deficiencies",
    "my_assigned_equipments",
  ],

  CLIENT: [
    "dashboard",
    "projects",
    "progress",
    "bim_3d",
    ...COMMON_PERSONAL_MODULES,
  ],

  INVESTOR: [
    "dashboard",
    "projects",
    "progress",
    "bim_3d",
    ...COMMON_PERSONAL_MODULES,
  ],

  SUPPLIER: [
    ...COMMON_PERSONAL_MODULES,
    "goods_receiving",
    "procurement",
  ],
}

// ============================================================================
// 6. YARDIMCI VE ERİŞİM KONTROL FONKSİYONLARI
// ============================================================================

export function getAllowedModules(role?: string | null, tenantType?: string | null): ModuleKey[] {
  if (!role) return []
  const upperRole = String(role).toUpperCase().trim() as SystemRole
  if (upperRole === "SUPER_ADMIN") return ROLE_PERMISSION_MATRIX.SUPER_ADMIN

  const normalizedTenant = normalizeTenantType(tenantType)
  const allowed = ROLE_PERMISSION_MATRIX[upperRole] || ROLE_PERMISSION_MATRIX.STAFF

  // Sıkı İzolasyon Kontrolü:
  // Eğer kullanıcı INSPECTION kiracısındaysa, müteahhit taşeron/kasa/jurnal modüllerine erişemez
  if (normalizedTenant === "INSPECTION") {
    const forbiddenForInspection: ModuleKey[] = [
      "work_proofs",
      "subcontractor_contracts",
      "subcontractor_isg",
      "site_journal",
      "gate_security",
      "qr_micro_consumption",
      "collection_risk",
    ]
    return allowed.filter((m) => !forbiddenForInspection.includes(m))
  }

  // Eğer kullanıcı CONTRACTOR ise YİBF entegrasyonu veya laboratuvar kırım gibi salt denetim modülleri filtreli
  if (normalizedTenant === "CONTRACTOR" && upperRole !== "ADMIN") {
    const forbiddenForContractorNonAdmin: ModuleKey[] = [
      "form_builder",
      "yibf_integration",
    ]
    return allowed.filter((m) => !forbiddenForContractorNonAdmin.includes(m))
  }

  return allowed
}

export function hasModuleAccess(
  role?: string | null,
  tenantType?: string | null,
  moduleKey?: ModuleKey
): boolean {
  if (!role || !moduleKey) return false
  const upperRole = String(role).toUpperCase().trim() as SystemRole
  if (upperRole === "SUPER_ADMIN") return true

  const allowed = getAllowedModules(upperRole, tenantType)
  return allowed.includes(moduleKey)
}

export function getDefaultWebRoute(role?: string | null, tenantType?: string | null): string {
  if (!role) return "/login"
  const upperRole = String(role).toUpperCase().trim() as SystemRole
  const meta = ROLE_DEFINITIONS[upperRole]

  if (meta) {
    const normalizedTenant = normalizeTenantType(tenantType)
    // Eğer tenantType INSPECTION ise ve rol varsayılanı /admin ise /inspection'a çek
    if (normalizedTenant === "INSPECTION" && meta.defaultWebRoute === "/admin") {
      return "/inspection"
    }
    // Eğer tenantType FRANCHISE ise ve rol varsayılanı /admin ise /franchise'a çek
    if (normalizedTenant === "FRANCHISE" && meta.defaultWebRoute === "/admin") {
      return "/franchise"
    }
    return meta.defaultWebRoute
  }

  return "/personnel"
}

export function getLocationTrackingMode(role?: string | null): LocationTrackingMode {
  if (!role) return "OFF"
  const upperRole = String(role).toUpperCase().trim() as SystemRole
  const meta = ROLE_DEFINITIONS[upperRole]
  return meta?.locationTrackingMode || "SITE_LIVE"
}

// ============================================================================
// 7. MOBİL UYGULAMA İÇİN NAVİGASYON VE BUTON PROFİLİ
// ============================================================================

export interface MobileNavProfile {
  role: SystemRole
  title: string
  trackingMode: LocationTrackingMode
  bottomTabs: {
    tab1: { key: string; label: string; icon: string; route: string }
    tab2: { key: string; label: string; icon: string; route: string }
  }
  fabAction: {
    label: string
    icon: string
    action: string
  }
  moduleGrid: {
    key: ModuleKey
    title: string
    icon: string
    category: ModuleCategory
    badge?: string
  }[]
}

export function getMobileNavigationProfile(
  role?: string | null,
  tenantType?: string | null
): MobileNavProfile {
  const upperRole = (String(role || "WORKER").toUpperCase().trim()) as SystemRole
  const trackingMode = getLocationTrackingMode(upperRole)
  const allowed = getAllowedModules(upperRole, tenantType)

  // Rol bazlı Bottom Tab konfigürasyonu
  let bottomTabs = {
    tab1: { key: "tasks", label: "Görevler", icon: "CheckSquare", route: "/tasks" },
    tab2: { key: "attendance", label: "Puantaj", icon: "QrCode", route: "/attendance" },
  }

  let fabAction = {
    label: "QR Giriş",
    icon: "QrCode",
    action: "SCAN_ATTENDANCE",
  }

  if (upperRole === "DRIVER") {
    bottomTabs = {
      tab1: { key: "deliveries", label: "Sevkiyat", icon: "Truck", route: "/deliveries" },
      tab2: { key: "routes", label: "Güzergah", icon: "Navigation", route: "/routes" },
    }
    fabAction = {
      label: "Teslimat QR",
      icon: "QrCode",
      action: "SCAN_DELIVERY",
    }
  } else if (upperRole === "INSPECTOR" || upperRole === "AUDITOR") {
    bottomTabs = {
      tab1: { key: "inspections", label: "Denetim", icon: "ClipboardCheck", route: "/inspections" },
      tab2: { key: "forms", label: "Formlar", icon: "FileText", route: "/forms" },
    }
    fabAction = {
      label: "Numune Al",
      icon: "PlusCircle",
      action: "NEW_SAMPLE",
    }
  } else if (upperRole === "LAB_TECH") {
    bottomTabs = {
      tab1: { key: "samples", label: "Numuneler", icon: "TestTube", route: "/samples" },
      tab2: { key: "routes", label: "Saha Rotası", icon: "Navigation", route: "/routes" },
    }
    fabAction = {
      label: "Numune Okut",
      icon: "QrCode",
      action: "SCAN_SAMPLE",
    }
  } else if (upperRole === "SITE_MANAGER" || upperRole === "FITOUT_SUPERVISOR") {
    bottomTabs = {
      tab1: { key: "journal", label: "Jurnal", icon: "BookOpen", route: "/journal" },
      tab2: { key: "work_proofs", label: "Onaylar", icon: "CheckCircle", route: "/work-proofs" },
    }
    fabAction = {
      label: "Jurnal Yaz",
      icon: "Edit3",
      action: "NEW_JOURNAL",
    }
  } else if (upperRole === "ENGINEER" || upperRole === "ARCHITECT") {
    bottomTabs = {
      tab1: { key: "bim", label: "3D BIM & AR", icon: "Box", route: "/bim" },
      tab2: { key: "proofs", label: "İş Kanıtı", icon: "Camera", route: "/work-proofs" },
    }
    fabAction = {
      label: "AI Kusur Tara",
      icon: "Scan",
      action: "AI_VISION_SCAN",
    }
  } else if (upperRole === "SECURITY") {
    bottomTabs = {
      tab1: { key: "gate", label: "Nöbet", icon: "Shield", route: "/gate" },
      tab2: { key: "receiving", label: "İrsaliye", icon: "FileCheck", route: "/receiving" },
    }
    fabAction = {
      label: "Araç Giriş",
      icon: "QrCode",
      action: "SCAN_GATE",
    }
  } else if (upperRole === "WAREHOUSE_MANAGER") {
    bottomTabs = {
      tab1: { key: "inventory", label: "Ambar", icon: "Package", route: "/inventory" },
      tab2: { key: "receiving", label: "Mal Kabul", icon: "Download", route: "/receiving" },
    }
    fabAction = {
      label: "QR Tüketim",
      icon: "QrCode",
      action: "CONSUME_QR",
    }
  } else if (upperRole === "SUBCONTRACTOR") {
    bottomTabs = {
      tab1: { key: "tasks", label: "İş Emirleri", icon: "ListTodo", route: "/tasks" },
      tab2: { key: "proofs", label: "Kanıtlarım", icon: "UploadCloud", route: "/work-proofs" },
    }
    fabAction = {
      label: "Kanıt Yükle",
      icon: "Camera",
      action: "UPLOAD_WORK_PROOF",
    }
  }

  // Modüller Grid
  const moduleCatalog: {
    key: ModuleKey
    title: string
    icon: string
    category: ModuleCategory
  }[] = [
    { key: "bim_3d", title: "3D BIM & AR Model", icon: "Box", category: "MANAGEMENT_BI" },
    { key: "site_map", title: "Şantiye Haritası", icon: "Map", category: "MANAGEMENT_BI" },
    { key: "progress", title: "Fiziki İlerleme", icon: "TrendingUp", category: "MANAGEMENT_BI" },
    { key: "boq", title: "Metraj & BoQ", icon: "Layers", category: "MANAGEMENT_BI" },
    { key: "tasks_work_orders", title: "İş Emirleri & Görevler", icon: "CheckSquare", category: "HSE_FIELD_OPS" },
    { key: "site_journal", title: "Şantiye Günlüğü (AI Jurnal)", icon: "BookOpen", category: "HSE_FIELD_OPS" },
    { key: "work_proofs", title: "Fotoğraflı İş Kanıtı", icon: "Camera", category: "SUBCONTRACTOR_FINANCE" },
    { key: "inspections", title: "Saha Denetimleri", icon: "ClipboardCheck", category: "INSPECTION_QUALITY" },
    { key: "dynamic_forms", title: "Denetim Formları", icon: "FileText", category: "INSPECTION_QUALITY" },
    { key: "samples_core", title: "Numune & Karot Takip", icon: "TestTube", category: "INSPECTION_QUALITY" },
    { key: "reinforcement_check", title: "Demir/Kalıp Kontrol", icon: "Maximize", category: "INSPECTION_QUALITY" },
    { key: "deficiencies", title: "Saha Kusurları & DÖF", icon: "AlertTriangle", category: "INSPECTION_QUALITY" },
    { key: "ai_vision", title: "AI Görsel Kusur Analizi", icon: "Eye", category: "INSPECTION_QUALITY" },
    { key: "my_attendance_qr", title: "Karekod Puantaj Giriş-Çıkış", icon: "QrCode", category: "HR_PERSONAL" },
    { key: "my_leaves", title: "İzin Taleplerim", icon: "Calendar", category: "HR_PERSONAL" },
    { key: "my_salary_advances", title: "Avans & Maaş Talepleri", icon: "CreditCard", category: "HR_PERSONAL" },
    { key: "my_expenses", title: "Masraf & Fiş Bildirimi", icon: "Receipt", category: "HR_PERSONAL" },
    { key: "my_assigned_equipments", title: "Zimmetli Ekipman & KKD", icon: "Shield", category: "HR_PERSONAL" },
    { key: "near_miss", title: "Ramak Kala İSG Bildirimi", icon: "AlertOctagon", category: "HSE_FIELD_OPS" },
    { key: "sos_alarm", title: "Acil Durum SOS Butonu", icon: "Bell", category: "HSE_FIELD_OPS" },
    { key: "ptt_chat", title: "Şantiye Telsiz (PTT) & Chat", icon: "Radio", category: "HSE_FIELD_OPS" },
    { key: "route_optimization", title: "Akıllı Güzergah & Rota", icon: "Navigation", category: "PROCUREMENT_LOGISTICS" },
    { key: "driver_deliveries", title: "Sevkiyat Teslimatı", icon: "Truck", category: "PROCUREMENT_LOGISTICS" },
    { key: "goods_receiving", title: "Mal Kabul / İrsaliye", icon: "FileCheck", category: "PROCUREMENT_LOGISTICS" },
    { key: "warehouse_inventory", title: "Ambar Stok & Demirbaş", icon: "Package", category: "PROCUREMENT_LOGISTICS" },
    { key: "qr_micro_consumption", title: "QR Mikro Malzeme Sarfı", icon: "Cpu", category: "PROCUREMENT_LOGISTICS" },
  ]

  const filteredGrid = moduleCatalog.filter((item) => allowed.includes(item.key))

  return {
    role: upperRole,
    title: ROLE_DEFINITIONS[upperRole]?.title || upperRole,
    trackingMode,
    bottomTabs,
    fabAction,
    moduleGrid: filteredGrid,
  }
}

