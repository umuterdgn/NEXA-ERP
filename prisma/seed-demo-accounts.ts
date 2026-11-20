/**
 * © 2026 NXA Software. All rights reserved.
 * Faz 1 RBAC & 3 İşletme Tipi İçin İdempotent Demo Hesapları Seed Scripti
 * Çalıştırma: npx tsx prisma/seed-demo-accounts.ts
 *
 * KURAL: Mevcut gerçek kullanıcı hesaplarını ve mevcut sahip atanmış projeleri asla silmez/bozmaz.
 * Tüm demo kullanıcıları yalnızca upsert ile güncellenir/oluşturulur.
 */

import "dotenv/config"
import bcrypt from "bcryptjs"
import { PrismaClient } from "@prisma/client"
import { DEMO_ACCOUNTS } from "../lib/demo-accounts"
import {
  getAllowedModules,
  getDefaultWebRoute,
  getLocationTrackingMode,
} from "../lib/rbac/permissions"

const prisma = new PrismaClient()

async function ensureTenantProjects() {
  // 1. Kiracıları bul veya güvenli biçimde oluştur (update: {} -> mevcut gerçek ayarlara dokunmaz)
  const contractorTenant = await prisma.tenant.upsert({
    where: { slug: "nexa-insaat" },
    update: {},
    create: {
      slug: "nexa-insaat",
      name: "Nexa İnşaat A.Ş.",
      type: "MAIN_CONTRACTOR",
      enabledModules: [],
      isActive: true,
      status: "ACTIVE",
      subscriptionStatus: "ACTIVE",
    },
  })

  const inspectionTenant = await prisma.tenant.upsert({
    where: { slug: "balkan-denetim" },
    update: {},
    create: {
      slug: "balkan-denetim",
      name: "Balkan Yapı Denetim Ltd.",
      type: "INSPECTION",
      enabledModules: [],
      isActive: true,
      status: "ACTIVE",
      subscriptionStatus: "ACTIVE",
    },
  })

  const franchiseTenant = await prisma.tenant.upsert({
    where: { slug: "nexa-franchise" },
    update: {},
    create: {
      slug: "nexa-franchise",
      name: "nexa franchise",
      type: "FRANCHISE",
      enabledModules: [],
      isActive: true,
      status: "ACTIVE",
      subscriptionStatus: "ACTIVE",
    },
  })

  // 2. Müteahhit projeleri (mevcut projelere dokunmadan, Vadi Evleri 3. Etap ilk sırada olacak şekilde listele)
  const contractorProjectsRaw = await prisma.project.findMany({
    where: { tenantId: contractorTenant.id, deletedAt: null },
    select: { id: true, name: true, title: true },
    orderBy: { createdAt: "desc" },
  })
  const contractorProjects = [...contractorProjectsRaw].sort((a, b) => {
    const aIsPrimary =
      a.id === "cmvzn2rfw000d9gugjwp2rf5v" ||
      String(a.name || a.title).includes("Vadi Evleri 3. Etap")
    const bIsPrimary =
      b.id === "cmvzn2rfw000d9gugjwp2rf5v" ||
      String(b.name || b.title).includes("Vadi Evleri 3. Etap")
    if (aIsPrimary && !bIsPrimary) return -1
    if (!aIsPrimary && bIsPrimary) return 1
    return 0
  })

  // 3. Yapı Denetim projeleri: tenant'ta 0 proje varsa sadece sahipsiz (tenantId: null) YİBF projelerini bağla
  let inspectionProjects = await prisma.project.findMany({
    where: { tenantId: inspectionTenant.id, deletedAt: null },
    select: { id: true, name: true, title: true },
    orderBy: { createdAt: "desc" },
  })
  if (inspectionProjects.length === 0) {
    const orphanInspectionProjectIds = [
      "project-vadi",
      "proj-nexa-ankara",
      "proj-vadi-iskenderun",
    ]
    await prisma.project.updateMany({
      where: {
        id: { in: orphanInspectionProjectIds },
        tenantId: null,
        deletedAt: null,
      },
      data: { tenantId: inspectionTenant.id },
    })
    await prisma.coreSample.updateMany({
      where: {
        projectId: { in: orphanInspectionProjectIds },
        tenantId: null,
      },
      data: { tenantId: inspectionTenant.id },
    })
    inspectionProjects = await prisma.project.findMany({
      where: { tenantId: inspectionTenant.id, deletedAt: null },
      select: { id: true, name: true, title: true },
      orderBy: { createdAt: "desc" },
    })
  }
  inspectionProjects = [...inspectionProjects].sort((a, b) => {
    if (a.id === "project-vadi") return -1
    if (b.id === "project-vadi") return 1
    return 0
  })

  // 4. Franchise mağazaları: tenant'ta 0 proje varsa sadece sahipsiz (tenantId: null) mağazaları bağla (store-korupark'a DOKUNMA)
  let franchiseProjects = await prisma.project.findMany({
    where: { tenantId: franchiseTenant.id, deletedAt: null },
    select: { id: true, name: true, title: true },
    orderBy: { createdAt: "desc" },
  })
  if (franchiseProjects.length === 0) {
    const orphanFranchiseStoreIds = [
      "store-alsancak",
      "store-cevahir",
      "store-terracity",
      "store-tunali",
    ]
    await prisma.project.updateMany({
      where: {
        id: { in: orphanFranchiseStoreIds },
        tenantId: null,
        deletedAt: null,
      },
      data: { tenantId: franchiseTenant.id },
    })
    franchiseProjects = await prisma.project.findMany({
      where: { tenantId: franchiseTenant.id, deletedAt: null },
      select: { id: true, name: true, title: true },
      orderBy: { createdAt: "desc" },
    })
  }
  franchiseProjects = [...franchiseProjects].sort((a, b) => {
    if (a.id === "store-alsancak") return -1
    if (b.id === "store-alsancak") return 1
    return 0
  })

  return {
    "nexa-insaat": { tenant: contractorTenant, projects: contractorProjects },
    "balkan-denetim": { tenant: inspectionTenant, projects: inspectionProjects },
    "nexa-franchise": { tenant: franchiseTenant, projects: franchiseProjects },
  }
}

async function ensureDemoSubcontractorEntities(tenantId: string, name: string, email: string) {
  let company = await prisma.company.findFirst({
    where: { tenantId, email },
  })
  if (!company) {
    company = await prisma.company.create({
      data: {
        tenantId,
        name,
        contactName: name,
        email,
        type: "SUBCONTRACTOR",
        companyType: "CONTRACTOR",
      },
    })
  }

  let sub = await prisma.subcontractor.findFirst({
    where: { tenantId, name },
  })
  if (!sub) {
    sub = await prisma.subcontractor.create({
      data: {
        tenantId,
        name,
        contactName: name,
      },
    })
  }

  return { company, sub }
}

async function main() {
  console.log("🚀 Demo hesapları Neon PostgreSQL ile eşitleniyor...")
  const tenantMap = await ensureTenantProjects()

  const summaryRows: {
    role: string
    tenantType: string
    email: string
    route: string
    projectCount: number
    moduleCount: number
  }[] = []

  for (const acc of DEMO_ACCOUNTS) {
    const bundle = tenantMap[acc.tenantSlug as keyof typeof tenantMap]
    if (!bundle) {
      throw new Error(`Bilinmeyen kiracı slug'ı: ${acc.tenantSlug}`)
    }

    const { tenant, projects } = bundle
    const allProjectIds = projects.map((p) => p.id)
    const assignedProjectIds =
      acc.projectScope === "ALL" ? allProjectIds : allProjectIds.slice(0, 1)

    const permissions = getAllowedModules(acc.role, acc.tenantType)
    const locationTrackingMode = getLocationTrackingMode(acc.role)
    const passwordHash = await bcrypt.hash(acc.password, 10)

    let companyId: string | null = null
    if (acc.role === "SUBCONTRACTOR") {
      const subEntities = await ensureDemoSubcontractorEntities(
        tenant.id,
        acc.name,
        acc.email
      )
      companyId = subEntities.company.id
    }

    const user = await prisma.user.upsert({
      where: { email: acc.email },
      create: {
        email: acc.email,
        password: passwordHash,
        name: acc.name,
        role: acc.role as any,
        tenantId: tenant.id,
        companyType: acc.companyType as any,
        companyId,
        permissions,
        assignedProjectIds,
        locationTrackingMode,
      },
      update: {
        password: passwordHash,
        name: acc.name,
        role: acc.role as any,
        tenantId: tenant.id,
        companyType: acc.companyType as any,
        companyId,
        permissions,
        assignedProjectIds,
        locationTrackingMode,
      },
    })

    const primaryProject = projects.find((p) => p.id === assignedProjectIds[0])
    const currentSite = primaryProject?.name || primaryProject?.title || tenant.name

    const existingPersonel = await prisma.personel.findFirst({
      where: {
        OR: [{ userId: user.id }, { personnelNo: acc.personnelNo }],
      },
    })

    if (existingPersonel) {
      await prisma.personel.update({
        where: { id: existingPersonel.id },
        data: {
          personnelNo: acc.personnelNo,
          name: acc.name,
          email: acc.email,
          username: acc.email,
          role: acc.role as any,
          department: acc.department,
          currentSite,
          tenantId: tenant.id,
          userId: user.id,
          companyId,
          projectId: assignedProjectIds[0] || null,
          assignedProjectIds,
          locationTrackingMode,
          status: "ACTIVE",
        },
      })
    } else {
      await prisma.personel.create({
        data: {
          personnelNo: acc.personnelNo,
          name: acc.name,
          age: 32,
          birthDate: new Date("1994-01-15"),
          hireDate: new Date("2025-01-01"),
          department: acc.department,
          currentSite,
          email: acc.email,
          username: acc.email,
          role: acc.role as any,
          tenantId: tenant.id,
          userId: user.id,
          companyId,
          projectId: assignedProjectIds[0] || null,
          assignedProjectIds,
          locationTrackingMode,
          status: "ACTIVE",
        },
      })
    }

    summaryRows.push({
      role: acc.role,
      tenantType: acc.tenantType,
      email: acc.email,
      route: getDefaultWebRoute(acc.role, acc.tenantType),
      projectCount: assignedProjectIds.length,
      moduleCount: permissions.length,
    })
  }

  console.log("\n✅ Tüm Demo Hesapları Başarıyla Eşitlendi:")
  console.table(summaryRows)
}

main()
  .catch((err) => {
    console.error("❌ Demo seed hatası:", err)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

