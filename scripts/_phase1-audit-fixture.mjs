/**
 * © 2026 NXA Software. All rights reserved.
 * Faz 1 Denetim Ortak Test Fixture & Garantili Teardown Modülü
 * TÜM geçici kayıtlar __PHASE1_AUDIT__ önekiyle oluşturulur ve finally bloğunda %100 silinir.
 */

import "dotenv/config"
import bcrypt from "bcryptjs"
import { PrismaClient } from "@prisma/client"

export const PREFIX = "__PHASE1_AUDIT__"
export const EMAIL_PREFIX = "__phase1_audit__"
export const TEST_PASSWORD = "AuditPass!2026"

export const prisma = new PrismaClient()

export async function cleanupAuditFixtures() {
  const tenants = await prisma.tenant.findMany({
    where: {
      OR: [
        { name: { startsWith: PREFIX } },
        { slug: { startsWith: "phase1-audit-" } },
      ],
    },
    select: { id: true },
  })
  const tenantIds = tenants.map((t) => t.id)

  const users = await prisma.user.findMany({
    where: {
      OR: [
        { email: { startsWith: EMAIL_PREFIX } },
        { name: { startsWith: PREFIX } },
        ...(tenantIds.length ? [{ tenantId: { in: tenantIds } }] : []),
      ],
    },
    select: { id: true },
  })
  const userIds = users.map((u) => u.id)

  const projects = await prisma.project.findMany({
    where: {
      OR: [
        { title: { startsWith: PREFIX } },
        { name: { startsWith: PREFIX } },
        ...(tenantIds.length ? [{ tenantId: { in: tenantIds } }] : []),
      ],
    },
    select: { id: true },
  })
  const projectIds = projects.map((p) => p.id)

  const personnels = await prisma.personel.findMany({
    where: {
      OR: [
        { name: { startsWith: PREFIX } },
        { personnelNo: { startsWith: PREFIX } },
        ...(tenantIds.length ? [{ tenantId: { in: tenantIds } }] : []),
        ...(userIds.length ? [{ userId: { in: userIds } }] : []),
      ],
    },
    select: { id: true },
  })
  const personelIds = personnels.map((p) => p.id)

  const subcontractors = await prisma.subcontractor.findMany({
    where: {
      OR: [
        { name: { startsWith: PREFIX } },
        ...(tenantIds.length ? [{ tenantId: { in: tenantIds } }] : []),
      ],
    },
    select: { id: true },
  })
  const subcontractorIds = subcontractors.map((s) => s.id)

  const companies = await prisma.company.findMany({
    where: {
      OR: [
        { name: { startsWith: PREFIX } },
        ...(tenantIds.length ? [{ tenantId: { in: tenantIds } }] : []),
      ],
    },
    select: { id: true },
  })
  const companyIds = companies.map((c) => c.id)

  const tenantFilter = tenantIds.length ? { tenantId: { in: tenantIds } } : null
  const projectFilter = projectIds.length ? { projectId: { in: projectIds } } : null
  const userFilter = userIds.length ? { userId: { in: userIds } } : null

  // Leaf-to-root deletion order (zero FK constraint violations)
  const ops = []

  // 1. WorkProofs, Billing, Payments
  await prisma.workProof.deleteMany({
    where: {
      OR: [
        { title: { startsWith: PREFIX } },
        ...(tenantFilter ? [tenantFilter] : []),
        ...(projectFilter ? [projectFilter] : []),
        ...(subcontractorIds.length ? [{ subcontractorId: { in: subcontractorIds } }] : []),
      ],
    },
  })
  await prisma.boqProgressLog.deleteMany({
    where: {
      OR: [
        ...(tenantFilter ? [tenantFilter] : []),
        ...(projectIds.length ? [{ boqItem: { projectId: { in: projectIds } } }] : []),
      ],
    },
  })
  await prisma.progressPayment.deleteMany({
    where: {
      OR: [
        ...(tenantFilter ? [tenantFilter] : []),
        ...(projectFilter ? [projectFilter] : []),
      ],
    },
  })
  await prisma.progressBilling.deleteMany({
    where: {
      ...(tenantIds.length || projectIds.length || companyIds.length
        ? {
            OR: [
              ...(tenantFilter ? [tenantFilter] : []),
              ...(projectIds.length ? [{ contract: { projectId: { in: projectIds } } }] : []),
            ],
          }
        : { id: "__none__" }),
    },
  })
  await prisma.contract.deleteMany({
    where: {
      OR: [
        { title: { startsWith: PREFIX } },
        ...(tenantFilter ? [tenantFilter] : []),
        ...(projectFilter ? [projectFilter] : []),
        ...(companyIds.length ? [{ subcontractorId: { in: companyIds } }] : []),
      ],
    },
  })
  await prisma.boqItem.deleteMany({
    where: {
      OR: [
        { pozNo: { startsWith: PREFIX } },
        ...(tenantFilter ? [tenantFilter] : []),
        ...(projectFilter ? [projectFilter] : []),
      ],
    },
  })

  // 2. Forms, Samples, Inspections, Deficiencies
  await prisma.formSubmission.deleteMany({
    where: {
      OR: [
        ...(tenantFilter ? [tenantFilter] : []),
        ...(projectFilter ? [projectFilter] : []),
        ...(userFilter ? [userFilter] : []),
      ],
    },
  })
  await prisma.dynamicForm.deleteMany({
    where: {
      OR: [
        { title: { startsWith: PREFIX } },
        ...(tenantFilter ? [tenantFilter] : []),
      ],
    },
  })
  await prisma.coreSample.deleteMany({
    where: {
      OR: [
        { qrCode: { startsWith: PREFIX } },
        ...(tenantFilter ? [tenantFilter] : []),
        ...(projectFilter ? [projectFilter] : []),
      ],
    },
  })
  await prisma.inspection.deleteMany({
    where: {
      OR: [
        ...(tenantFilter ? [tenantFilter] : []),
        ...(projectFilter ? [projectFilter] : []),
        ...(personelIds.length ? [{ inspectorId: { in: personelIds } }] : []),
      ],
    },
  })
  await prisma.deficiency.deleteMany({
    where: {
      OR: [
        { element: { startsWith: PREFIX } },
        { description: { startsWith: PREFIX } },
        ...(tenantFilter ? [tenantFilter] : []),
        ...(projectFilter ? [projectFilter] : []),
      ],
    },
  })

  // 3. Attendance, Location, HR Requests, ISG, Chat
  await prisma.attendanceRecord.deleteMany({
    where: {
      OR: [
        ...(tenantFilter ? [tenantFilter] : []),
        ...(projectFilter ? [projectFilter] : []),
        ...(personelIds.length ? [{ personelId: { in: personelIds } }] : []),
      ],
    },
  })
  await prisma.locationLog.deleteMany({
    where: {
      OR: [
        ...(tenantFilter ? [tenantFilter] : []),
        ...(userFilter ? [userFilter] : []),
      ],
    },
  })
  await prisma.leaveRequest.deleteMany({
    where: {
      OR: [
        ...(tenantFilter ? [tenantFilter] : []),
        ...(userFilter ? [userFilter] : []),
        ...(personelIds.length ? [{ personelId: { in: personelIds } }] : []),
      ],
    },
  })
  await prisma.advanceRequest.deleteMany({
    where: {
      OR: [
        ...(tenantFilter ? [tenantFilter] : []),
        ...(userFilter ? [userFilter] : []),
      ],
    },
  })
  await prisma.expenseClaim.deleteMany({
    where: {
      OR: [
        ...(tenantFilter ? [tenantFilter] : []),
        ...(userFilter ? [userFilter] : []),
      ],
    },
  })
  await prisma.sosAlert.deleteMany({
    where: {
      OR: [
        ...(tenantFilter ? [tenantFilter] : []),
        ...(userFilter ? [userFilter] : []),
      ],
    },
  })
  await prisma.nearMiss.deleteMany({
    where: {
      OR: [
        { title: { startsWith: PREFIX } },
        ...(tenantFilter ? [tenantFilter] : []),
        ...(projectFilter ? [projectFilter] : []),
        ...(personelIds.length ? [{ reportedById: { in: personelIds } }] : []),
      ],
    },
  })
  await prisma.chatMessage.deleteMany({
    where: {
      OR: [
        { content: { startsWith: PREFIX } },
        ...(tenantFilter ? [tenantFilter] : []),
        ...(userIds.length ? [{ senderId: { in: userIds } }] : []),
      ],
    },
  })

  // 4. Logistics, Inventory, Tasks, Journals
  await prisma.materialRequest.deleteMany({
    where: {
      OR: [
        { itemName: { startsWith: PREFIX } },
        ...(tenantFilter ? [tenantFilter] : []),
        ...(projectFilter ? [projectFilter] : []),
        ...(personelIds.length ? [{ requesterId: { in: personelIds } }] : []),
      ],
    },
  })
  await prisma.inventoryTransaction.deleteMany({
    where: {
      OR: [
        ...(tenantFilter ? [tenantFilter] : []),
        ...(projectFilter ? [projectFilter] : []),
      ],
    },
  })
  await prisma.inventoryItem.deleteMany({
    where: {
      OR: [
        { qrCode: { startsWith: PREFIX } },
        { materialName: { startsWith: PREFIX } },
        ...(tenantFilter ? [tenantFilter] : []),
        ...(projectFilter ? [projectFilter] : []),
      ],
    },
  })
  await prisma.inventoryAssignment.deleteMany({
    where: {
      OR: [
        ...(tenantFilter ? [tenantFilter] : []),
        ...(personelIds.length ? [{ personelId: { in: personelIds } }] : []),
      ],
    },
  })
  await prisma.inventory.deleteMany({
    where: {
      OR: [
        { name: { startsWith: PREFIX } },
        { qrCode: { startsWith: PREFIX } },
        ...(tenantFilter ? [tenantFilter] : []),
        ...(projectFilter ? [projectFilter] : []),
        ...(userIds.length ? [{ recordedBy: { in: userIds } }] : []),
      ],
    },
  })
  await prisma.logisticsSchedule.deleteMany({
    where: {
      OR: [
        { title: { startsWith: PREFIX } },
        ...(tenantFilter ? [tenantFilter] : []),
        ...(projectFilter ? [projectFilter] : []),
      ],
    },
  })
  await prisma.logisticsAppointment.deleteMany({
    where: {
      OR: [
        ...(tenantFilter ? [tenantFilter] : []),
        ...(projectFilter ? [projectFilter] : []),
      ],
    },
  })
  await prisma.dailyJournal.deleteMany({
    where: {
      OR: [
        ...(tenantFilter ? [tenantFilter] : []),
        ...(projectFilter ? [projectFilter] : []),
        ...(userIds.length ? [{ engineerId: { in: userIds } }] : []),
      ],
    },
  })
  await prisma.task.deleteMany({
    where: {
      OR: [
        { title: { startsWith: PREFIX } },
        ...(tenantFilter ? [tenantFilter] : []),
        ...(projectFilter ? [projectFilter] : []),
      ],
    },
  })
  await prisma.announcement.deleteMany({
    where: {
      OR: [
        { title: { startsWith: PREFIX } },
        ...(tenantFilter ? [tenantFilter] : []),
        ...(projectFilter ? [projectFilter] : []),
      ],
    },
  })
  await prisma.auditLog.deleteMany({
    where: {
      OR: [
        { details: { contains: PREFIX } },
        ...(userIds.length ? [{ userId: { in: userIds } }] : []),
      ],
    },
  }).catch(() => {})

  // 5. Core entities (Subcontractor -> Personel -> Project -> Company -> User -> Tenant)
  if (subcontractorIds.length) {
    await prisma.subcontractor.deleteMany({ where: { id: { in: subcontractorIds } } })
  } else {
    await prisma.subcontractor.deleteMany({ where: { name: { startsWith: PREFIX } } })
  }

  if (personelIds.length) {
    await prisma.personel.deleteMany({ where: { id: { in: personelIds } } })
  }

  if (projectIds.length) {
    await prisma.project.deleteMany({ where: { id: { in: projectIds } } })
  }

  if (companyIds.length) {
    await prisma.company.deleteMany({ where: { id: { in: companyIds } } })
  }

  if (userIds.length) {
    await prisma.user.deleteMany({ where: { id: { in: userIds } } })
  }

  if (tenantIds.length) {
    await prisma.tenant.deleteMany({ where: { id: { in: tenantIds } } })
  }

  void ops
}

export async function verifyCleanDatabase() {
  const counts = {
    tenants: await prisma.tenant.count({ where: { OR: [{ name: { startsWith: PREFIX } }, { slug: { startsWith: "phase1-audit-" } }] } }),
    users: await prisma.user.count({ where: { OR: [{ email: { startsWith: EMAIL_PREFIX } }, { name: { startsWith: PREFIX } }] } }),
    projects: await prisma.project.count({ where: { OR: [{ title: { startsWith: PREFIX } }, { name: { startsWith: PREFIX } }] } }),
    personels: await prisma.personel.count({ where: { OR: [{ name: { startsWith: PREFIX } }, { personnelNo: { startsWith: PREFIX } }] } }),
    subcontractors: await prisma.subcontractor.count({ where: { name: { startsWith: PREFIX } } }),
    companies: await prisma.company.count({ where: { name: { startsWith: PREFIX } } }),
    workProofs: await prisma.workProof.count({ where: { title: { startsWith: PREFIX } } }),
    contracts: await prisma.contract.count({ where: { title: { startsWith: PREFIX } } }),
    dynamicForms: await prisma.dynamicForm.count({ where: { title: { startsWith: PREFIX } } }),
    coreSamples: await prisma.coreSample.count({ where: { qrCode: { startsWith: PREFIX } } }),
    deficiencies: await prisma.deficiency.count({ where: { OR: [{ element: { startsWith: PREFIX } }, { description: { startsWith: PREFIX } }] } }),
    inventoryItems: await prisma.inventoryItem.count({ where: { OR: [{ qrCode: { startsWith: PREFIX } }, { materialName: { startsWith: PREFIX } }] } }),
    tasks: await prisma.task.count({ where: { title: { startsWith: PREFIX } } }),
  }

  const dirty = Object.entries(counts).filter(([, n]) => n > 0)
  if (dirty.length > 0) {
    throw new Error(`TEARDOWN BAŞARISIZ! Veritabanında kalan ${PREFIX} kayıtları: ${JSON.stringify(dirty)}`)
  }
  return counts
}

export async function seedAuditFixtures() {
  // Önce olası yarım kalmış eski test kalıntılarını temizle
  await cleanupAuditFixtures()

  const passwordHash = await bcrypt.hash(TEST_PASSWORD, 10)
  const now = new Date()

  // 1. 3 İşletme Tipi Kiracı
  const contractorTenant = await prisma.tenant.create({
    data: {
      name: `${PREFIX}Contractor`,
      slug: "phase1-audit-contractor",
      type: "MAIN_CONTRACTOR",
      enabledModules: [],
      isActive: true,
      status: "ACTIVE",
      subscriptionStatus: "ACTIVE",
    },
  })

  const inspectionTenant = await prisma.tenant.create({
    data: {
      name: `${PREFIX}Inspection`,
      slug: "phase1-audit-inspection",
      type: "INSPECTION",
      enabledModules: [],
      isActive: true,
      status: "ACTIVE",
      subscriptionStatus: "ACTIVE",
    },
  })

  const franchiseTenant = await prisma.tenant.create({
    data: {
      name: `${PREFIX}Franchise`,
      slug: "phase1-audit-franchise",
      type: "FRANCHISE",
      enabledModules: [],
      isActive: true,
      status: "ACTIVE",
      subscriptionStatus: "ACTIVE",
    },
  })

  // 2. Projeler / Şubeler
  const contractorProj = await prisma.project.create({
    data: {
      tenantId: contractorTenant.id,
      title: `${PREFIX}Contractor_Proj`,
      name: `${PREFIX}Contractor_Proj`,
      description: `${PREFIX}Contractor test şantiyesi`,
      images: [],
      location: "İstanbul",
      city: "İstanbul",
      district: "Kadıköy",
      latitude: 41.0082,
      longitude: 28.9784,
      gpsRadius: 500,
      gpsRequired: false,
      status: "SAHA",
      progress: 42,
    },
  })

  const inspectionProj = await prisma.project.create({
    data: {
      tenantId: inspectionTenant.id,
      title: `${PREFIX}Inspection_Proj`,
      name: `${PREFIX}Inspection_Proj`,
      description: `${PREFIX}Inspection test yapısı`,
      images: [],
      location: "Ankara",
      city: "Ankara",
      district: "Çankaya",
      latitude: 39.9208,
      longitude: 32.8541,
      status: "SAHA",
      yibfNo: "2026-AUDIT-1",
      buildingClass: "4A",
    },
  })

  const franchiseBranchA = await prisma.project.create({
    data: {
      tenantId: franchiseTenant.id,
      title: `${PREFIX}Franchise_BranchA`,
      name: `${PREFIX}Franchise_BranchA`,
      description: `${PREFIX}Şube A`,
      images: [],
      location: "Nişantaşı, İstanbul",
      city: "İstanbul",
      district: "Şişli",
      latitude: 41.048,
      longitude: 28.993,
      status: "SAHA",
      progress: 65,
    },
  })

  const franchiseBranchB = await prisma.project.create({
    data: {
      tenantId: franchiseTenant.id,
      title: `${PREFIX}Franchise_BranchB`,
      name: `${PREFIX}Franchise_BranchB`,
      description: `${PREFIX}Şube B`,
      images: [],
      location: "Alsancak, İzmir",
      city: "İzmir",
      district: "Konak",
      latitude: 38.436,
      longitude: 27.143,
      status: "ETUT",
      progress: 15,
    },
  })

  // 3. Taşeron Firmalar & İzolasyon Kayıtları
  const subCompanyA = await prisma.company.create({
    data: {
      tenantId: contractorTenant.id,
      name: `${PREFIX}SUBCONTRACTOR`,
      contactName: `${PREFIX}SUBCONTRACTOR`,
      email: `${EMAIL_PREFIX}subcontractor@nexa.test`,
      type: "SUBCONTRACTOR",
      companyType: "CONTRACTOR",
    },
  })

  const subCompanyB = await prisma.company.create({
    data: {
      tenantId: contractorTenant.id,
      name: `${PREFIX}OtherSubCompany`,
      contactName: `${PREFIX}OtherSub`,
      email: `${EMAIL_PREFIX}other_sub@nexa.test`,
      type: "SUBCONTRACTOR",
      companyType: "CONTRACTOR",
    },
  })

  const subA = await prisma.subcontractor.create({
    data: {
      tenantId: contractorTenant.id,
      name: `${PREFIX}SUBCONTRACTOR`,
      contactName: `${PREFIX}SUBCONTRACTOR`,
    },
  })

  const subB = await prisma.subcontractor.create({
    data: {
      tenantId: contractorTenant.id,
      name: `${PREFIX}OtherSub`,
      contactName: `${PREFIX}OtherSub`,
    },
  })

  const contractB = await prisma.contract.create({
    data: {
      tenantId: contractorTenant.id,
      projectId: contractorProj.id,
      subcontractorId: subCompanyB.id,
      title: `${PREFIX}ContractB`,
      totalAmount: 250000,
      startDate: now,
      endDate: new Date(Date.now() + 30 * 86400000),
      status: "ACTIVE",
    },
  })

  const workProofB = await prisma.workProof.create({
    data: {
      tenantId: contractorTenant.id,
      projectId: contractorProj.id,
      subcontractorId: subB.id,
      title: `${PREFIX}ProofB`,
      description: "Diğer taşerona ait izole iş kanıtı",
      photoUrl: "https://example.com/other-sub-proof.jpg",
      claimedQuantity: 25,
      status: "PENDING",
    },
  })

  // 4. 11 Test Aktörü + Personel Kayıtları
  const actorSpecs = [
    // CONTRACTOR
    { key: "ADMIN", role: "ADMIN", tenant: contractorTenant, companyType: "MAIN_CONTRACTOR", projects: [contractorProj.id], site: contractorProj.name },
    { key: "SITE_MANAGER", role: "SITE_MANAGER", tenant: contractorTenant, companyType: "MAIN_CONTRACTOR", projects: [contractorProj.id], site: contractorProj.name },
    { key: "ENGINEER", role: "ENGINEER", tenant: contractorTenant, companyType: "MAIN_CONTRACTOR", projects: [contractorProj.id], site: contractorProj.name },
    { key: "WORKER", role: "WORKER", tenant: contractorTenant, companyType: "MAIN_CONTRACTOR", projects: [contractorProj.id], site: contractorProj.name },
    { key: "DRIVER", role: "DRIVER", tenant: contractorTenant, companyType: "MAIN_CONTRACTOR", projects: [contractorProj.id], site: contractorProj.name },
    { key: "SUBCONTRACTOR", role: "SUBCONTRACTOR", tenant: contractorTenant, companyType: "SUBCONTRACTOR", projects: [contractorProj.id], site: contractorProj.name, companyId: subCompanyA.id },
    // INSPECTION
    { key: "INSPECTION_ADMIN", role: "INSPECTION_ADMIN", tenant: inspectionTenant, companyType: "INSPECTION", projects: [inspectionProj.id], site: inspectionProj.name },
    { key: "INSPECTOR", role: "INSPECTOR", tenant: inspectionTenant, companyType: "INSPECTION", projects: [inspectionProj.id], site: inspectionProj.name },
    { key: "LAB_TECH", role: "LAB_TECH", tenant: inspectionTenant, companyType: "INSPECTION", projects: [inspectionProj.id], site: inspectionProj.name },
    // FRANCHISE
    { key: "FRANCHISE_ADMIN", role: "FRANCHISE_ADMIN", tenant: franchiseTenant, companyType: "FRANCHISE", projects: [franchiseBranchA.id, franchiseBranchB.id], site: franchiseBranchA.name },
    { key: "FRANCHISEE", role: "FRANCHISEE", tenant: franchiseTenant, companyType: "FRANCHISE", projects: [franchiseBranchA.id], site: franchiseBranchA.name },
  ]

  const actors = {}
  for (const spec of actorSpecs) {
    const email = `${EMAIL_PREFIX}${spec.key.toLowerCase()}@nexa.test`
    const user = await prisma.user.create({
      data: {
        email,
        password: passwordHash,
        name: `${PREFIX}${spec.key}`,
        role: spec.role,
        tenantId: spec.tenant.id,
        companyType: spec.companyType,
        companyId: spec.companyId || null,
        assignedProjectIds: spec.projects,
        locationTrackingMode: spec.role === "DRIVER" || spec.role === "INSPECTOR" ? "ROUTE_LIVE" : "SITE_LIVE",
      },
    })

    const personel = await prisma.personel.create({
      data: {
        tenantId: spec.tenant.id,
        personnelNo: `${PREFIX}P_${spec.key}`,
        name: `${PREFIX}${spec.key}`,
        age: 30,
        birthDate: new Date("1995-01-01"),
        department: "Denetim Test",
        currentSite: spec.site,
        hireDate: now,
        userId: user.id,
        email,
        username: email,
        role: spec.role,
        projectId: spec.projects[0],
        assignedProjectIds: spec.projects,
      },
    })

    actors[spec.key] = { email, password: TEST_PASSWORD, role: spec.role, user, personel, tenantId: spec.tenant.id }
  }

  // Modal & Grant-Login testleri için her kiracıda ek hedef personel (giriş aktörünü bozmadan)
  const targetContractorPersonel = await prisma.personel.create({
    data: {
      tenantId: contractorTenant.id,
      personnelNo: `${PREFIX}TARGET_C`,
      name: `${PREFIX}Target_CONTRACTOR`,
      age: 28,
      birthDate: new Date("1997-01-01"),
      department: "Saha",
      currentSite: contractorProj.name,
      hireDate: now,
      projectId: contractorProj.id,
    },
  })

  const targetInspectionPersonel = await prisma.personel.create({
    data: {
      tenantId: inspectionTenant.id,
      personnelNo: `${PREFIX}TARGET_I`,
      name: `${PREFIX}Target_INSPECTION`,
      age: 32,
      birthDate: new Date("1993-01-01"),
      department: "Denetim",
      currentSite: inspectionProj.name,
      hireDate: now,
      projectId: inspectionProj.id,
    },
  })

  const targetFranchisePersonel = await prisma.personel.create({
    data: {
      tenantId: franchiseTenant.id,
      personnelNo: `${PREFIX}TARGET_F`,
      name: `${PREFIX}Target_FRANCHISE`,
      age: 29,
      birthDate: new Date("1996-01-01"),
      department: "Mağaza Operasyon",
      currentSite: franchiseBranchA.name,
      hireDate: now,
      projectId: franchiseBranchA.id,
    },
  })

  // 5. Pozitif API Testleri İçin Gerçek Veriler
  const contractorBoq = await prisma.boqItem.create({
    data: {
      tenantId: contractorTenant.id,
      projectId: contractorProj.id,
      pozNo: `${PREFIX}POZ_1`,
      description: "Test Betonarme İmalatı",
      unit: "m3",
      plannedQuantity: 100,
      unitPrice: 1500,
    },
  })

  const contractorTask = await prisma.task.create({
    data: {
      tenantId: contractorTenant.id,
      projectId: contractorProj.id,
      title: `${PREFIX}Task_1`,
      description: "Saha kontrol görevi",
      status: "TODO",
      boqItemId: contractorBoq.id,
    },
  })

  const contractorInv = await prisma.inventory.create({
    data: {
      tenantId: contractorTenant.id,
      projectId: contractorProj.id,
      name: `${PREFIX}Cement_Inv`,
      type: "IN",
      quantity: 200,
      unit: "Adet",
      qrCode: `${PREFIX}QR_INV_1`,
      recordedBy: actors.ADMIN.user.id,
    },
  })

  const contractorInvItem = await prisma.inventoryItem.create({
    data: {
      tenantId: contractorTenant.id,
      projectId: contractorProj.id,
      materialName: `${PREFIX}Rebar`,
      name: `${PREFIX}Rebar`,
      qrCode: `${PREFIX}QR_ITEM_1`,
      quantity: 100,
      unit: "Ton",
    },
  })

  const contractorSchedule = await prisma.logisticsSchedule.create({
    data: {
      tenantId: contractorTenant.id,
      projectId: contractorProj.id,
      title: `${PREFIX}Schedule_1`,
      type: "MALZEME_TESLİMAT",
      location: "A Kapısı",
      driverName: `${PREFIX}DRIVER`,
      vehiclePlate: "34 AUD 01",
      scheduledAt: now,
      status: "PLANNED",
    },
  })

  const inspectionForm = await prisma.dynamicForm.create({
    data: {
      tenantId: inspectionTenant.id,
      title: `${PREFIX}InspectionForm`,
      category: "Kalıp & Donatı",
      fields: [{ id: "q1", type: "boolean", label: "Paspayı uygun mu?", required: true }],
    },
  })

  const inspectionSample = await prisma.coreSample.create({
    data: {
      tenantId: inspectionTenant.id,
      projectId: inspectionProj.id,
      qrCode: `${PREFIX}SAMPLE_QR_1`,
      location: "A Blok Zemin Kat",
      status: "WAITING_TEST",
      takenById: actors.INSPECTOR.user.id,
    },
  })

  const branchADeficiency = await prisma.deficiency.create({
    data: {
      tenantId: franchiseTenant.id,
      projectId: franchiseBranchA.id,
      floor: "Zemin",
      element: `${PREFIX}WallA`,
      category: "Mimari",
      description: `${PREFIX}BranchA_Defect`,
      status: "OPEN",
    },
  })

  const branchBDeficiency = await prisma.deficiency.create({
    data: {
      tenantId: franchiseTenant.id,
      projectId: franchiseBranchB.id,
      floor: "1. Kat",
      element: `${PREFIX}WallB`,
      category: "Mimari",
      description: `${PREFIX}BranchB_Defect`,
      status: "OPEN",
    },
  })

  return {
    tenants: { contractorTenant, inspectionTenant, franchiseTenant },
    projects: { contractorProj, inspectionProj, franchiseBranchA, franchiseBranchB },
    subcontractors: { subCompanyA, subCompanyB, subA, subB, contractB, workProofB },
    targets: { targetContractorPersonel, targetInspectionPersonel, targetFranchisePersonel },
    records: {
      contractorBoq,
      contractorTask,
      contractorInv,
      contractorInvItem,
      contractorSchedule,
      inspectionForm,
      inspectionSample,
      branchADeficiency,
      branchBDeficiency,
    },
    actors,
  }
}

