/**
 * © 2026 NXA Software. All rights reserved.
 * Paylaşılan Demo Hesapları Tanım Merkezi (Single Source of Truth)
 * Login UI ve prisma/seed-demo-accounts.ts aynı sabitleri kullanır.
 */

import { getDefaultWebRoute, type SystemRole, type TenantType } from "./rbac/permissions"

export const DEMO_ACCOUNT_PASSWORD = "nexa2026"

export const DEMO_TABS: {
  type: TenantType
  label: string
  description: string
}[] = [
  {
    type: "CONTRACTOR",
    label: "Müteahhit",
    description: "Şantiye, Mühendislik & Taşeron",
  },
  {
    type: "INSPECTION",
    label: "Yapı Denetim",
    description: "Denetim, Saha Kontrol & Laboratuvar",
  },
  {
    type: "FRANCHISE",
    label: "Franchise",
    description: "Genel Merkez & Bayi / Şube",
  },
]

export interface DemoAccountDefinition {
  key: string
  tenantType: TenantType
  tenantSlug: string
  role: SystemRole
  label: string
  shortBadge: string
  name: string
  email: string
  password: string
  personnelNo: string
  department: string
  companyType: "MAIN_CONTRACTOR" | "SUBCONTRACTOR" | "INSPECTION" | "FRANCHISE"
  projectScope: "ALL" | "FIRST"
  defaultWebRoute: string
}

function defineAccount(
  spec: Omit<DemoAccountDefinition, "password" | "defaultWebRoute">
): DemoAccountDefinition {
  return {
    ...spec,
    password: DEMO_ACCOUNT_PASSWORD,
    defaultWebRoute: getDefaultWebRoute(spec.role, spec.tenantType),
  }
}

export const DEMO_ACCOUNTS: DemoAccountDefinition[] = [
  // 1. MÜTEAHHİT (CONTRACTOR)
  defineAccount({
    key: "contractor_admin",
    tenantType: "CONTRACTOR",
    tenantSlug: "nexa-insaat",
    role: "ADMIN",
    label: "Genel Müdür / Admin",
    shortBadge: "Yönetim",
    name: "Ahmet Yılmaz (Demo Admin)",
    email: "demo.admin@nxerp.com.tr",
    personnelNo: "DEMO-C-001",
    department: "Üst Yönetim",
    companyType: "MAIN_CONTRACTOR",
    projectScope: "ALL",
  }),
  defineAccount({
    key: "contractor_site_manager",
    tenantType: "CONTRACTOR",
    tenantSlug: "nexa-insaat",
    role: "SITE_MANAGER",
    label: "Şantiye Şefi",
    shortBadge: "Şantiye",
    name: "Barış Demir (Demo Şantiye Şefi)",
    email: "demo.sefi@nxerp.com.tr",
    personnelNo: "DEMO-C-002",
    department: "Şantiye Yönetimi",
    companyType: "MAIN_CONTRACTOR",
    projectScope: "FIRST",
  }),
  defineAccount({
    key: "contractor_engineer",
    tenantType: "CONTRACTOR",
    tenantSlug: "nexa-insaat",
    role: "ENGINEER",
    label: "Saha Mühendisi",
    shortBadge: "Teknik Mod",
    name: "Can Özdemir (Demo Mühendis)",
    email: "demo.muhendis@nxerp.com.tr",
    personnelNo: "DEMO-C-003",
    department: "Teknik Ofis & Saha",
    companyType: "MAIN_CONTRACTOR",
    projectScope: "FIRST",
  }),
  defineAccount({
    key: "contractor_worker",
    tenantType: "CONTRACTOR",
    tenantSlug: "nexa-insaat",
    role: "WORKER",
    label: "Saha Çalışanı / İşçi",
    shortBadge: "İşçi Modu",
    name: "Murat Kaya (Demo İşçi)",
    email: "demo.isci@nxerp.com.tr",
    personnelNo: "DEMO-C-004",
    department: "Kaba İnşaat Ekibi",
    companyType: "MAIN_CONTRACTOR",
    projectScope: "FIRST",
  }),
  defineAccount({
    key: "contractor_driver",
    tenantType: "CONTRACTOR",
    tenantSlug: "nexa-insaat",
    role: "DRIVER",
    label: "Şoför / Lojistik",
    shortBadge: "Lojistik Modu",
    name: "Osman Polat (Demo Şoför)",
    email: "demo.sofor@nxerp.com.tr",
    personnelNo: "DEMO-C-005",
    department: "Lojistik & Sevkiyat",
    companyType: "MAIN_CONTRACTOR",
    projectScope: "FIRST",
  }),
  defineAccount({
    key: "contractor_subcontractor",
    tenantType: "CONTRACTOR",
    tenantSlug: "nexa-insaat",
    role: "SUBCONTRACTOR",
    label: "Taşeron Yetkilisi",
    shortBadge: "Taşeron",
    name: "Yılmazlar Kalıpçılık (Demo Taşeron)",
    email: "demo.taseron@nxerp.com.tr",
    personnelNo: "DEMO-C-006",
    department: "Taşeron / Kalıp & İskele",
    companyType: "SUBCONTRACTOR",
    projectScope: "FIRST",
  }),

  // 2. YAPI DENETİM (INSPECTION)
  defineAccount({
    key: "inspection_admin",
    tenantType: "INSPECTION",
    tenantSlug: "balkan-denetim",
    role: "INSPECTION_ADMIN",
    label: "Kuruluş Yöneticisi",
    shortBadge: "YDK Yönetim",
    name: "Selim Balkan (Demo YDK Müdürü)",
    email: "demo.denetim@nxerp.com.tr",
    personnelNo: "DEMO-I-001",
    department: "Yapı Denetim Yönetim",
    companyType: "INSPECTION",
    projectScope: "ALL",
  }),
  defineAccount({
    key: "inspection_inspector",
    tenantType: "INSPECTION",
    tenantSlug: "balkan-denetim",
    role: "INSPECTOR",
    label: "Saha Denetçisi",
    shortBadge: "Kontrol",
    name: "Kerem Aydın (Demo Denetçi)",
    email: "demo.denetci@nxerp.com.tr",
    personnelNo: "DEMO-I-002",
    department: "Kontrol & Saha Denetim",
    companyType: "INSPECTION",
    projectScope: "ALL",
  }),
  defineAccount({
    key: "inspection_lab_tech",
    tenantType: "INSPECTION",
    tenantSlug: "balkan-denetim",
    role: "LAB_TECH",
    label: "Lab & Karot Teknisyeni",
    shortBadge: "Numune",
    name: "Elif Aksoy (Demo Lab Teknisyeni)",
    email: "demo.lab@nxerp.com.tr",
    personnelNo: "DEMO-I-003",
    department: "Laboratuvar & Karot",
    companyType: "INSPECTION",
    projectScope: "ALL",
  }),

  // 3. FRANCHISE (FRANCHISE)
  defineAccount({
    key: "franchise_admin",
    tenantType: "FRANCHISE",
    tenantSlug: "nexa-franchise",
    role: "FRANCHISE_ADMIN",
    label: "Merkez Yönetici",
    shortBadge: "Marka HQ",
    name: "Deniz Arslan (Demo Franchise Müdürü)",
    email: "demo.franchise@nxerp.com.tr",
    personnelNo: "DEMO-F-001",
    department: "Franchise Genel Merkez",
    companyType: "FRANCHISE",
    projectScope: "ALL",
  }),
  defineAccount({
    key: "franchise_franchisee",
    tenantType: "FRANCHISE",
    tenantSlug: "nexa-franchise",
    role: "FRANCHISEE",
    label: "Bayi / Şube Sahibi",
    shortBadge: "Şube",
    name: "Emre Koç (Demo Bayi - Alsancak)",
    email: "demo.bayi@nxerp.com.tr",
    personnelNo: "DEMO-F-002",
    department: "Şube İşletme",
    companyType: "FRANCHISE",
    projectScope: "FIRST",
  }),
]

export function getDemoAccountsByTenantType(
  tenantType: TenantType
): DemoAccountDefinition[] {
  return DEMO_ACCOUNTS.filter((acc) => acc.tenantType === tenantType)
}

