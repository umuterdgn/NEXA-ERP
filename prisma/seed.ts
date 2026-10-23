/**
* 2026 NXA Software. All rights reserved.
* Developer: Umut Erdoğan
* This code is the property of NXA Software.
*/

import { PrismaClient, CompanyType, UserRole, Gender, EmploymentType, PersonelStatus, ContractStatus } from "@prisma/client"
import bcrypt from "bcryptjs"
import { faker } from "@faker-js/faker"

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

const prisma = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma

async function main() {
  console.log(" Seeding database with realistic Turkish data...")

  // ============================================================================
  // FIRMAŞAR (COMPANIES)
  // ============================================================================
  console.log(" Creating companies...")

  const inspectionCompany = await prisma.company.upsert({
    where: { id: "company-inspection" },
    update: {},
    create: {
      id: "company-inspection",
      name: "Güven Yapı Denetim A.Ş.",
      type: CompanyType.INSPECTION,
      contactName: "Mehmet Demir",
      phone: "+90 212 555 0001",
      email: "info@guvendenetim.com",
      taxNumber: "1234567890",
      taxOffice: "Büyükçekmece Vergi Dairesi"
    }
  })

  const contractorCompany = await prisma.company.upsert({
    where: { id: "company-contractor" },
    update: {},
    create: {
      id: "company-contractor",
      name: "Mahir Bakay Mühendislik",
      type: CompanyType.MAIN_CONTRACTOR,
      contactName: "Mahir Bakay",
      phone: "+90 212 555 0002",
      email: "info@mahirbakay.com",
      taxNumber: "0987654321",
      taxOffice: "Kadıköy Vergi Dairesi"
    }
  })

  console.log(` Created ${inspectionCompany.name} (INSPECTION)`)
  console.log(` Created ${contractorCompany.name} (CONTRACTOR)`)

  // ============================================================================
  // KULLANICILAR / PERSONELLER (USERS/PERSONNEL)
  // ============================================================================
  console.log(" Creating users and personnel...")

  const hashedPassword = await bcrypt.hash("demo123", 10)
  const demoPassword = hashedPassword

  // ============================================================================
  // DEMO KULLANICILAR (Quick Login / Demo Giriş)
  // ============================================================================
  console.log(" Creating demo users for quick login...")

  // 1. Admin (Patron)
  const adminUser = await prisma.user.upsert({
    where: { email: "admin@nexa.com" },
    update: {
      password: hashedPassword,
      name: "Admin (Patron)",
      role: UserRole.ADMIN,
      companyId: contractorCompany.id,
      companyType: CompanyType.MAIN_CONTRACTOR,
    },
    create: {
      email: "admin@nexa.com",
      password: hashedPassword,
      name: "Admin (Patron)",
      role: UserRole.ADMIN,
      companyId: contractorCompany.id,
      companyType: CompanyType.MAIN_CONTRACTOR,
      permissions: ["dashboard", "projects", "personnel", "finance", "inventory", "subcontractors", "contracts", "procurement", "admin", "users"]
    }
  })

  // 2. İK Müdürü
  const ikUser = await prisma.user.upsert({
    where: { email: "ik@nexa.com" },
    update: {
      password: hashedPassword,
      name: "İK Müdürü",
      role: UserRole.HR_MANAGER,
      companyId: contractorCompany.id,
      companyType: CompanyType.MAIN_CONTRACTOR,
    },
    create: {
      email: "ik@nexa.com",
      password: hashedPassword,
      name: "İK Müdürü",
      role: UserRole.HR_MANAGER,
      companyId: contractorCompany.id,
      companyType: CompanyType.MAIN_CONTRACTOR,
      permissions: ["dashboard", "personnel", "hr", "payroll", "attendance", "contracts"]
    }
  })

  // 3. Finans Müdürü
  const finansUser = await prisma.user.upsert({
    where: { email: "finans@nexa.com" },
    update: {
      password: hashedPassword,
      name: "Finans Müdürü",
      role: UserRole.FINANCE_MANAGER,
      companyId: contractorCompany.id,
      companyType: CompanyType.MAIN_CONTRACTOR,
    },
    create: {
      email: "finans@nexa.com",
      password: hashedPassword,
      name: "Finans Müdürü",
      role: UserRole.FINANCE_MANAGER,
      companyId: contractorCompany.id,
      companyType: CompanyType.MAIN_CONTRACTOR,
      permissions: ["dashboard", "finance", "invoices", "payments", "cashflow", "accounting"]
    }
  })

  // 4. Yapı Denetim Patronu
  const denetimUser = await prisma.user.upsert({
    where: { email: "denetim@nexa.com" },
    update: {
      password: hashedPassword,
      name: "Yapı Denetim Patronu",
      role: UserRole.INSPECTION_ADMIN,
      companyId: inspectionCompany.id,
      companyType: CompanyType.INSPECTION,
    },
    create: {
      email: "denetim@nexa.com",
      password: hashedPassword,
      name: "Yapı Denetim Patronu",
      role: UserRole.INSPECTION_ADMIN,
      companyId: inspectionCompany.id,
      companyType: CompanyType.INSPECTION,
      permissions: ["dashboard", "inspection", "reports", "documents", "qa-qc", "isg", "admin"]
    }
  })

  // 5. Satınalma / Lojistik Müdürü
  const lojistikUser = await prisma.user.upsert({
    where: { email: "lojistik@nexa.com" },
    update: {
      password: hashedPassword,
      name: "Satınalma ve Lojistik Müdürü",
      role: UserRole.PROCUREMENT_MANAGER,
      companyId: contractorCompany.id,
      companyType: CompanyType.MAIN_CONTRACTOR,
    },
    create: {
      email: "lojistik@nexa.com",
      password: hashedPassword,
      name: "Satınalma ve Lojistik Müdürü",
      role: UserRole.PROCUREMENT_MANAGER,
      companyId: contractorCompany.id,
      companyType: CompanyType.MAIN_CONTRACTOR,
      permissions: ["dashboard", "logistics", "procurement", "inventory", "stock", "suppliers", "orders"]
    }
  })

  // 6. Proje Koordinatörü (Üst Onay)
  const koordinatorUser = await prisma.user.upsert({
    where: { email: "koordinator@nexa.com" },
    update: {
      password: hashedPassword,
      name: "Proje Koordinatörü (Üst Onay)",
      role: UserRole.PROJECT_MANAGER,
      companyId: contractorCompany.id,
      companyType: CompanyType.MAIN_CONTRACTOR,
    },
    create: {
      email: "koordinator@nexa.com",
      password: hashedPassword,
      name: "Proje Koordinatörü (Üst Onay)",
      role: UserRole.PROJECT_MANAGER,
      companyId: contractorCompany.id,
      companyType: CompanyType.MAIN_CONTRACTOR,
      permissions: ["dashboard", "projects", "approvals", "progress", "budget", "reports", "contracts"]
    }
  })

  // 7. Şantiye Şefi (Orta Onay)
  const sefUser = await prisma.user.upsert({
    where: { email: "sef@nexa.com" },
    update: {
      password: hashedPassword,
      name: "Şantiye Şefi (Orta Onay)",
      role: UserRole.SITE_MANAGER,
      companyId: contractorCompany.id,
      companyType: CompanyType.MAIN_CONTRACTOR,
    },
    create: {
      email: "sef@nexa.com",
      password: hashedPassword,
      name: "Şantiye Şefi (Orta Onay)",
      role: UserRole.SITE_MANAGER,
      companyId: contractorCompany.id,
      companyType: CompanyType.MAIN_CONTRACTOR,
      permissions: ["dashboard", "projects", "site", "approvals", "work-orders", "daily-logs", "tasks", "attendance"]
    }
  })

  // 8. Saha Mühendisi (İşlemi Başlatan)
  const muhendisUser = await prisma.user.upsert({
    where: { email: "muhendis@nexa.com" },
    update: {
      password: hashedPassword,
      name: "Saha Mühendisi (İşlemi Başlatan)",
      role: UserRole.ENGINEER,
      companyId: contractorCompany.id,
      companyType: CompanyType.MAIN_CONTRACTOR,
    },
    create: {
      email: "muhendis@nexa.com",
      password: hashedPassword,
      name: "Saha Mühendisi (İşlemi Başlatan)",
      role: UserRole.ENGINEER,
      companyId: contractorCompany.id,
      companyType: CompanyType.MAIN_CONTRACTOR,
      permissions: ["dashboard", "projects", "site", "work-proof", "instructions", "quality", "deficiencies"]
    }
  })

  // 9. Kamyon Şoförü (Ahmet Yılmaz)
  const soforUser = await prisma.user.upsert({
    where: { email: "sofor@nexa.com" },
    update: {
      password: hashedPassword,
      name: "Ahmet Yılmaz",
      role: UserRole.DRIVER,
      companyId: contractorCompany.id,
      companyType: CompanyType.MAIN_CONTRACTOR,
    },
    create: {
      email: "sofor@nexa.com",
      password: hashedPassword,
      name: "Ahmet Yılmaz",
      role: UserRole.DRIVER,
      companyId: contractorCompany.id,
      companyType: CompanyType.MAIN_CONTRACTOR,
      permissions: ["logistics", "tracking", "driver", "my-deliveries"]
    }
  })

  // 9b. Mikser Şoförü (Mehmet Demir)
  await prisma.user.upsert({
    where: { email: "mehmet.sofor@nexa.com" },
    update: {
      password: hashedPassword,
      name: "Mehmet Demir",
      role: UserRole.DRIVER,
      companyId: contractorCompany.id,
      companyType: CompanyType.MAIN_CONTRACTOR,
    },
    create: {
      email: "mehmet.sofor@nexa.com",
      password: hashedPassword,
      name: "Mehmet Demir",
      role: UserRole.DRIVER,
      companyId: contractorCompany.id,
      companyType: CompanyType.MAIN_CONTRACTOR,
      permissions: ["logistics", "tracking", "driver", "my-deliveries"]
    }
  })

  // 9c. Lojistik Şoförü (Ayşe Kaya)
  await prisma.user.upsert({
    where: { email: "ayse.sofor@nexa.com" },
    update: {
      password: hashedPassword,
      name: "Ayşe Kaya",
      role: UserRole.DRIVER,
      companyId: contractorCompany.id,
      companyType: CompanyType.MAIN_CONTRACTOR,
    },
    create: {
      email: "ayse.sofor@nexa.com",
      password: hashedPassword,
      name: "Ayşe Kaya",
      role: UserRole.DRIVER,
      companyId: contractorCompany.id,
      companyType: CompanyType.MAIN_CONTRACTOR,
      permissions: ["logistics", "tracking", "driver", "my-deliveries"]
    }
  })

  // 10. Saha Yapı Denetimcisi
  const sahaDenetciUser = await prisma.user.upsert({
    where: { email: "denetci@nexa.com" },
    update: {
      password: hashedPassword,
      name: "Saha Yapı Denetimcisi",
      role: UserRole.INSPECTOR,
      companyId: inspectionCompany.id,
      companyType: CompanyType.INSPECTION,
    },
    create: {
      email: "denetci@nexa.com",
      password: hashedPassword,
      name: "Saha Yapı Denetimcisi",
      role: UserRole.INSPECTOR,
      companyId: inspectionCompany.id,
      companyType: CompanyType.INSPECTION,
      permissions: ["dashboard", "inspection", "yibf", "field-checks", "reports", "qa-qc"]
    }
  })

  // 11. Saha Personeli
  const personelUser = await prisma.user.upsert({
    where: { email: "personel@nexa.com" },
    update: {
      password: hashedPassword,
      name: "Saha Personeli",
      role: UserRole.STAFF,
      companyId: contractorCompany.id,
      companyType: CompanyType.MAIN_CONTRACTOR,
    },
    create: {
      email: "personel@nexa.com",
      password: hashedPassword,
      name: "Saha Personeli",
      role: UserRole.STAFF,
      companyId: contractorCompany.id,
      companyType: CompanyType.MAIN_CONTRACTOR,
      permissions: ["my-tasks", "my-attendance", "my-salary"]
    }
  })

  console.log(` Created demo user: admin@nexa.com (Admin - Patron)`)
  console.log(` Created demo user: ik@nexa.com (İK Müdürü)`)
  console.log(` Created demo user: finans@nexa.com (Finans Müdürü)`)
  console.log(` Created demo user: denetim@nexa.com (Yapı Denetim Patronu)`)
  console.log(` Created demo user: lojistik@nexa.com (Satınalma / Lojistik Müdürü)`)
  console.log(` Created demo user: koordinator@nexa.com (Proje Koordinatörü)`)
  console.log(` Created demo user: sef@nexa.com (Şantiye Şefi)`)
  console.log(` Created demo user: muhendis@nexa.com (Saha Mühendisi)`)
  console.log(` Created demo user: sofor@nexa.com (Kamyon Şoförü)`)
  console.log(` Created demo user: denetci@nexa.com (Saha Yapı Denetimcisi)`)
  console.log(` Created demo user: personel@nexa.com (Saha Personeli)`)

  // Patron / Super Admin
  const patron = await prisma.user.upsert({
    where: { email: "patron@mahirbakay.com" },
    update: {},
    create: {
      email: "patron@mahirbakay.com",
      password: hashedPassword,
      name: "Demo Admin",
      role: UserRole.SUPER_ADMIN,
      permissions: ["dashboard", "cms", "archive", "finance", "stock", "staff", "users", "admin"]
    }
  })

  // Denetçi (Ahmet Yılmaz)
  const denetciUser = await prisma.user.upsert({
    where: { email: "ahmet.yilmaz@mahirbakay.com" },
    update: {},
    create: {
      email: "ahmet.yilmaz@mahirbakay.com",
      password: hashedPassword,
      name: "Ahmet Yılmaz",
      role: UserRole.ENGINEER,
      permissions: ["dashboard", "inspection", "reports"]
    }
  })

  const denetci = await prisma.personel.upsert({
    where: { personnelNo: "P001" },
    update: {},
    create: {
      personnelNo: "P001",
      name: "Ahmet Yılmaz",
      tcNo: "12345678901",
      age: 35,
      birthDate: new Date("1989-05-15"),
      gender: Gender.MALE,
      phone: "+90 532 123 4567",
      email: "ahmet.yilmaz@mahirbakay.com",
      address: "İstanbul, Kadıköy",
      department: "Yapı Denetim",
      position: "Yapı Denetçisi",
      currentSite: "İstanbul",
      hireDate: new Date("2020-03-01"),
      employmentType: EmploymentType.OFFICER,
      status: PersonelStatus.ACTIVE,
      salary: 45000,
      salaryPayDay: 25,
      companyId: inspectionCompany.id,
      userId: denetciUser.id,
      role: UserRole.ENGINEER,
      bloodType: "A+"
    }
  })

  // Kontrol Elemanı
  const kontrolUser = await prisma.user.upsert({
    where: { email: "ali.ozturk@mahirbakay.com" },
    update: {},
    create: {
      email: "ali.ozturk@mahirbakay.com",
      password: hashedPassword,
      name: "Ali Öztürk",
      role: UserRole.STAFF,
      permissions: ["dashboard", "inspection"]
    }
  })

  const kontrol = await prisma.personel.upsert({
    where: { personnelNo: "P002" },
    update: {},
    create: {
      personnelNo: "P002",
      name: "Ali Öztürk",
      tcNo: "98765432109",
      age: 28,
      birthDate: new Date("1996-08-20"),
      gender: Gender.MALE,
      phone: "+90 533 987 6543",
      email: "ali.ozturk@mahirbakay.com",
      address: "İstanbul, Üsküdar",
      department: "Kontrol",
      position: "Kontrol Elemanı",
      currentSite: "İstanbul",
      hireDate: new Date("2022-01-15"),
      employmentType: EmploymentType.WORKER,
      status: PersonelStatus.ACTIVE,
      salary: 28000,
      salaryPayDay: 25,
      companyId: inspectionCompany.id,
      userId: kontrolUser.id,
      role: UserRole.STAFF,
      bloodType: "B+"
    }
  })

  console.log(` Created ${patron.name} (Patron/Super Admin)`)
  console.log(` Created ${denetci.name} (Denetçi)`)
  console.log(` Created ${kontrol.name} (Kontrol Elemanı)`)

  // ============================================================================
  // YİBF PROJELERİ (INSPECTION PROJECTS)
  // ============================================================================
  console.log(" Creating YİBF projects...")

  // Proje 1: Sorunsuz (LOW RISK) - İstanbul
  const projectLowRisk = await prisma.yibfProject.upsert({
    where: { yibfNo: "YIBF-2024-001" },
    update: {},
    create: {
      yibfNo: "YIBF-2024-001",
      address: "Kadıköy, Caferağa Mah. Moda Cad. No:123, İstanbul",
      ownerName: "Aile Konut Yapı A.Ş.",
      contractorName: "Nexa ERP Demo Firması",
      totalArea: 2500.0,
      floors: 8,
      status: "ACTIVE",
      companyId: inspectionCompany.id
    }
  })

  // Proje 2: Orta Risk (MEDIUM RISK) - Ankara
  const projectMediumRisk = await prisma.yibfProject.upsert({
    where: { yibfNo: "YIBF-2024-002" },
    update: {},
    create: {
      yibfNo: "YIBF-2024-002",
      address: "Çankaya, Kızılay Mah. Atatürk Bulvarı No:456, Ankara",
      ownerName: "Başkent İnşaat Ltd. Şti.",
      contractorName: "Nexa ERP Demo Firması",
      totalArea: 4200.0,
      floors: 12,
      status: "ACTIVE",
      companyId: inspectionCompany.id
    }
  })

  // Proje 3: Yüksek Risk (HIGH RISK) - Hatay
  const projectHighRisk = await prisma.yibfProject.upsert({
    where: { yibfNo: "YIBF-2024-003" },
    update: {},
    create: {
      yibfNo: "YIBF-2024-003",
      address: "Antakya, Kurtuluş Mah. Cumhuriyet Cad. No:789, Hatay",
      ownerName: "Deprem Konut Yapı Kooperatifi",
      contractorName: "Nexa ERP Demo Firması",
      totalArea: 5800.0,
      floors: 15,
      status: "ACTIVE",
      companyId: inspectionCompany.id
    }
  })

  console.log(` Created ${projectLowRisk.yibfNo} (LOW RISK - İstanbul)`)
  console.log(` Created ${projectMediumRisk.yibfNo} (MEDIUM RISK - Ankara)`)
  console.log(` Created ${projectHighRisk.yibfNo} (HIGH RISK - Hatay)`)

  // ============================================================================
  // INSPECTION RECORDS (DENETİM KAYITLARI)
  // ============================================================================
  console.log(" Creating inspection records...")

  const inspectionRecordsData = [
    // Proje 1 - Sorunsuz
    {
      category: "Demir",
      status: "PASS",
      gpsLat: 40.9901,
      gpsLng: 29.0292,
      notes: "Donatı montajı TS 500 standartlarına uygun.",
      yibfId: projectLowRisk.id,
      inspectorId: denetci.id
    },
    {
      category: "Beton",
      status: "PASS",
      gpsLat: 40.9902,
      gpsLng: 29.0293,
      notes: "Beton dökümü TS EN 206 standartlarına uygun.",
      yibfId: projectLowRisk.id,
      inspectorId: denetci.id
    },
    // Proje 2 - Orta Risk
    {
      category: "Duvar",
      status: "PENDING",
      gpsLat: 39.9334,
      gpsLng: 32.8597,
      notes: "Duvar örüme işleminde eksiklik tespit edildi, kontrol gerekiyor.",
      yibfId: projectMediumRisk.id,
      inspectorId: kontrol.id
    },
    {
      category: "Demir",
      status: "FAIL",
      gpsLat: 39.9335,
      gpsLng: 32.8598,
      notes: "Kolon donatısında bağlantı uzunlukları yetersiz.",
      yibfId: projectMediumRisk.id,
      inspectorId: denetci.id
    },
    // Proje 3 - Yüksek Risk
    {
      category: "Beton",
      status: "FAIL",
      gpsLat: 36.2023,
      gpsLng: 36.1605,
      notes: "Beton dayanım sınıfı proje gereksinimini karşılamıyor.",
      yibfId: projectHighRisk.id,
      inspectorId: denetci.id
    },
    {
      category: "Demir",
      status: "FAIL",
      gpsLat: 36.2024,
      gpsLng: 36.1606,
      notes: "Kritik yapı elemanlarında donatı eksikliği tespit edildi.",
      yibfId: projectHighRisk.id,
      inspectorId: denetci.id
    }
  ]

  const inspectionRecords = []
  for (const record of inspectionRecordsData) {
    const created = await prisma.inspectionRecord.create({ data: record })
    inspectionRecords.push(created)
    await new Promise(resolve => setTimeout(resolve, 50))
  }

  console.log(` Created ${inspectionRecords.length} inspection records`)

  // ============================================================================
  // DEFICIENCIES (EKSİKLİKLER)
  // ============================================================================
  console.log(" Creating deficiencies...")

  const deficienciesData = [
    // Proje 1 - Sorunsuz (kapalı eksiklikler)
    {
      floor: "Zemin",
      element: "Kolon K1",
      category: "Demir",
      priority: "LOW",
      description: "Kolon donatısında küçük bir bağlantı eksikliği giderildi.",
      status: "CLOSED",
      dueDate: new Date("2024-01-20"),
      closedAt: new Date("2024-01-18"),
      yibfId: projectLowRisk.id,
      inspectorId: denetci.id
    },
    // Proje 2 - Orta Risk (açık ve kapanmış eksiklikler)
    {
      floor: "3. Kat",
      element: "Kiriş K3",
      category: "Demir",
      priority: "MEDIUM",
      description: "Kiriş donatısında bağlantı uzunlukları TS 500'e göre %15 kısa.",
      status: "OPEN",
      dueDate: new Date("2024-02-15"),
      yibfId: projectMediumRisk.id,
      inspectorId: denetci.id
    },
    {
      floor: "2. Kat",
      element: "Duvar D2",
      category: "Duvar",
      priority: "MEDIUM",
      description: "Duvar örüme düzenlemesinde düzensizlik giderildi.",
      status: "CLOSED",
      dueDate: new Date("2024-01-25"),
      closedAt: new Date("2024-01-23"),
      yibfId: projectMediumRisk.id,
      inspectorId: kontrol.id
    },
    // Proje 3 - Yüksek Risk (kritik açık eksiklikler)
    {
      floor: "5. Kat",
      element: "Kolon K5",
      category: "Demir",
      priority: "CRITICAL",
      description: "Kritik kolon donatısında %30 eksiklik tespit edildi. Acil düzeltme gerekli.",
      status: "OPEN",
      dueDate: new Date("2024-01-30"),
      yibfId: projectHighRisk.id,
      inspectorId: denetci.id
    },
    {
      floor: "4. Kat",
      element: "Döşeme D4",
      category: "Beton",
      priority: "CRITICAL",
      description: "Beton dayanım sınıfı C25 yerine C20 olarak dökülmüş. Yeniden döküm gerekli.",
      status: "FIX_PENDING",
      dueDate: new Date("2024-02-05"),
      yibfId: projectHighRisk.id,
      inspectorId: denetci.id
    },
    {
      floor: "6. Kat",
      element: "Kiriş K6",
      category: "Demir",
      priority: "CRITICAL",
      description: "Kiriş donatısında taşıma kapasitesi yetersizliği tespit edildi.",
      status: "OPEN",
      dueDate: new Date("2024-02-10"),
      yibfId: projectHighRisk.id,
      inspectorId: denetci.id
    }
  ]

  const deficiencies = []
  for (const deficiency of deficienciesData) {
    const created = await prisma.deficiency.create({ data: deficiency })
    deficiencies.push(created)
    await new Promise(resolve => setTimeout(resolve, 50))
  }

  console.log(` Created ${deficiencies.length} deficiencies`)

  // ============================================================================
  // YİBF EVENTS (ZAMAN MAKİNESİ LOGLARI)
  // ============================================================================
  console.log(" Creating YİBF events...")

  const yibfEventsData = [
    // Proje 1
    {
      eventType: "Ruhsat Alındı",
      description: "Yapı kullanma izin belgesi alındı",
      yibfId: projectLowRisk.id,
      userId: patron.id
    },
    {
      eventType: "Denetim Başladı",
      description: "Yapı denetim süreci başlatıldı",
      yibfId: projectLowRisk.id,
      userId: denetciUser.id
    },
    // Proje 2
    {
      eventType: "Eksiklik Açıldı",
      description: "Demir - Kiriş K3 bağlantı uzunlukları yetersiz",
      yibfId: projectMediumRisk.id,
      userId: denetciUser.id
    },
    {
      eventType: "Eksiklik Kapatıldı",
      description: "Duvar - Duvar D2 düzensizliği giderildi",
      yibfId: projectMediumRisk.id,
      userId: kontrolUser.id
    },
    // Proje 3
    {
      eventType: "Kritik Eksiklik Açıldı",
      description: "Demir - Kolon K5 %30 eksiklik (KRİTİK)",
      yibfId: projectHighRisk.id,
      userId: denetciUser.id
    },
    {
      eventType: "Kritik Eksiklik Açıldı",
      description: "Beton - Döşeme D4 dayanım sınıfı yetersiz (KRİTİK)",
      yibfId: projectHighRisk.id,
      userId: denetciUser.id
    },
    {
      eventType: "Acil Düzeltme Gerekiyor",
      description: "Yapısal güvenlik riski nedeniyle acil müdahale gerekli",
      yibfId: projectHighRisk.id,
      userId: patron.id
    }
  ]

  const yibfEvents = []
  for (const event of yibfEventsData) {
    const created = await prisma.yibfEvent.create({ data: event })
    yibfEvents.push(created)
    await new Promise(resolve => setTimeout(resolve, 50))
  }

  console.log(` Created ${yibfEvents.length} YİBF events`)

  // ============================================================================
  // CMS CONTENT (About, Services, Projects)
  // ============================================================================
  console.log(" Creating CMScontent...")

  const about = await prisma.about.upsert({
    where: { id: "default" },
    update: {},
    create: {
      id: "default",
      title: "Hakkımızda",
      content: "Nexa ERP olarak inşaat ve yapı denetim sektöründe yenilikçi ve sürdürülebilir çözümler sunuyoruz. Kalite ve güvenilirlik ilkesiyle projelerimize hayat veriyoruz. Yapı denetim, statik hesap, mimari tasarım ve proje yönetimi alanlarında uzman kadromuzla hizmet veriyoruz.",
      videoUrl: "/about-video.mp4"
    }
  })

  const servicesData = [
    {
      id: "service-1",
      title: "Yapı Denetim Hizmetleri",
      description: "Yapı İzleme Belgesi (YİBF) kapsamında profesyonel yapı denetim hizmetleri sunuyoruz. TS 500, TS EN 206 ve ilgili Türk Standartlarına uygun denetimler gerçekleştiriyoruz.",
      images: ["/images/service1-1.jpg", "/images/service1-2.jpg"],
      displayOrder: 1
    },
    {
      id: "service-2",
      title: "Statik Hesap ve Proje",
      description: "Yapıların güvenliği için detaylı statik hesaplamalar, deprem analizleri ve mühendislik projeleri hazırlıyoruz. Son teknoloji yazılımlar ile optimum çözümler sunuyoruz.",
      images: ["/images/service2-1.jpg"],
      displayOrder: 2
    },
    {
      id: "service-3",
      title: "Mimari Tasarım",
      description: "Estetik ve fonksiyonelliği birleştiren mimari tasarımlarımızla mekanlara değer katıyoruz. Konut, ticari ve endüstriyel yapılar için yenilikçi çözümler üretiyoruz.",
      images: ["/images/service3-1.jpg"],
      displayOrder: 3
    }
  ]

  const services = []
  for (const service of servicesData) {
    const created = await prisma.service.upsert({
      where: { id: service.id },
      update: {},
      create: service
    })
    services.push(created)
    await new Promise(resolve => setTimeout(resolve, 50))
  }

  const projectsData = [
    {
      id: "project-1",
      title: "Modern Plaza İş Merkezi",
      description: "İstanbul'un kalbinde, 25 katlı modern bir iş merkezi projesi. LEED sertifikalı yeşil bina konsepti ile tasarlandı.",
      images: ["/images/project1-1.jpg", "/images/project1-2.jpg"],
      year: "2024",
      location: "İstanbul, Türkiye",
      category: "Paket İş",
      city: "İstanbul",
      district: "Kadıköy",
      displayOrder: 1
    },
    {
      id: "project-2",
      title: "Eco Valley Konakları",
      description: "Doğa ile iç içe 500 konutluk bir yaşam projesi. Sürdürülebilir mimari ve akıllı ev teknolojileri ile donatıldı.",
      images: ["/images/project2-1.jpg"],
      year: "2023",
      location: "Ankara, Türkiye",
      category: "Kentsel Dönüşüm",
      city: "Ankara",
      district: "Çankaya",
      displayOrder: 2
    },
    {
      id: "project-3",
      title: "Tech Park Araştırma Merkezi",
      description: "Teknoloji geliştirme ve inovasyon merkezi. Start-up'lar için ofisler, laboratuvarlar ve coworking alanları içeriyor.",
      images: ["/images/project3-1.jpg"],
      year: "2024",
      location: "İzmir, Türkiye",
      category: "Danışmanlık",
      city: "İzmir",
      district: "Bornova",
      displayOrder: 3
    }
  ]

  const projects = []
  for (const project of projectsData) {
    const created = await prisma.project.upsert({
      where: { id: project.id },
      update: {},
      create: project
    })
    projects.push(created)
    await new Promise(resolve => setTimeout(resolve, 50))
  }

  console.log(` Created CMS content (About, ${services.length} services, ${projects.length} projects)`)

  // ============================================================================
  // CONTRACT TEMPLATES
  // ============================================================================
  console.log(" Creating contract templates...")

  const contractTemplatesData = [
    {
      name: "İSG (İş Sağlığı ve Güvenliği) Taahhütnamesi",
      content: "İŞ SAĞLIĞI VE GÜVENLİĞİ TAAHHÜTNAMESİ\n\nBen {{PERSONEL_ADI}} (TC: {{KIMLIK_NO}}), {{PROJE_ADI}} şantiyesinde çalışırken İş Sağlığı ve Güvenliği kurallarına eksiksiz uyacağımı, tarafıma teslim edilen kişisel koruyucu donanımları (baret, yelek, iş ayakkabısı) her zaman kullanacağımı beyan ve taahhüt ederim.\n\nTarih: {{TARİH}}\nİmza:"
    },
    {
      name: "Malzeme ve Donanım Zimmet Formu",
      content: "DEMİRBAŞ / MALZEME ZİMMET TUTANAĞI\n\n{{PROJE_ADI}} projesinde görev yapmakta olan {{PERSONEL_ADI}}'na (TC: {{KIMLIK_NO}}) firmaya ait ekipmanlar/malzemeler eksiksiz ve çalışır durumda teslim edilmiştir. İlgili personel işten ayrılma durumunda bu malzemeleri iade etmekle yükümlüdür.\n\nTarih: {{TARİH}}\nTeslim Alan (İmza):"
    },
    {
      name: "Genel Hizmet / Taşeron Sözleşmesi",
      content: "HİZMET SÖZLEŞMESİ\n\nBu sözleşme, {{PROJE_ADI}} projesi kapsamında görev alacak olan {{PERSONEL_ADI}} (TC: {{KIMLIK_NO}}) ile işveren arasında, {{TARİH}} tarihinde imza altına alınmıştır. Taraflar, şantiye yönetmeliklerine ve belirlenen hakediş kurallarına uymayı kabul eder.\n\nTarih: {{TARİH}}\nİmza:"
    }
  ]

  const contractTemplates = []
  for (const template of contractTemplatesData) {
    const created = await prisma.contractTemplate.upsert({
      where: { name: template.name },
      update: {},
      create: template
    })
    contractTemplates.push(created)
    await new Promise(resolve => setTimeout(resolve, 50))
  }

  console.log(` Created ${contractTemplates.length} contract templates`)

  // ============================================================================
  // PROJELER (ERP PROJECTS)
  // ============================================================================
  console.log(" Creating ERP projects...")

  const vadiEvleri = await prisma.project.upsert({
    where: { id: "project-vadi" },
    update: {
      managerId: sefUser.id,
      projectManagerId: koordinatorUser.id,
      siteManager: "Şantiye Şefi (sef@nexa.com)",
      engineer: "Saha Mühendisi (muhendis@nexa.com)",
      engineers: [muhendisUser.id],
      companyId: contractorCompany.id,
    },
    create: {
      id: "project-vadi",
      name: "Vadi Evleri Konut Projesi",
      title: "Vadi Evleri Konut Projesi",
      description: "İstanbul'un Avrupa yakasında 1200 konutluk lüks konut projesi",
      status: "SAHA",
      category: "Konut",
      city: "İstanbul",
      district: "Büyükçekmece",
      mintika: "Büyükçekmece",
      ada: "1234",
      parsel: "5",
      pafta: "A-12",
      yapiSinifi: "A-3",
      clientName: "Vadi Yapı A.Ş.",
      mapUrl: "https://maps.google.com",
      startDate: new Date("2024-01-01"),
      endDate: new Date("2026-12-31"),
      managerId: sefUser.id,
      projectManagerId: koordinatorUser.id,
      siteManager: "Şantiye Şefi (sef@nexa.com)",
      engineer: "Saha Mühendisi (muhendis@nexa.com)",
      engineers: [muhendisUser.id],
      architect: "Ayşe Kaya",
      yibfNo: "YIBF-2024-IST-001",
      healthScore: 85,
      progress: 65,
      gpsRequired: true,
      latitude: 41.0122,
      longitude: 28.8825,
      gpsRadius: 200,
      contractValue: 250000000,
      companyId: contractorCompany.id
    }
  })

  // Canlı Lojistik & Sevkiyat (sofor@nexa.com ve lojistik@nexa.com için aktif canlı tır)
  const purchaseReq = await prisma.purchaseRequest.upsert({
    where: { id: "req-vadi-c35-beton" },
    update: {
      projectId: vadiEvleri.id,
      materialName: "C35/45 Hazır Beton & Donatı Çeliği",
      quantity: 120,
      unit: "m³",
      status: "OPEN_FOR_BID"
    },
    create: {
      id: "req-vadi-c35-beton",
      projectId: vadiEvleri.id,
      materialName: "C35/45 Hazır Beton & Donatı Çeliği",
      quantity: 120,
      unit: "m³",
      status: "OPEN_FOR_BID"
    }
  })

  // Bağlı Gantt İş Emri (linkedTaskId için)
  const ganttTask = await prisma.projectTask.upsert({
    where: { id: "task-bina-a-gantt" },
    update: {},
    create: {
      id: "task-bina-a-gantt",
      name: "Bina A - 3. Kat Kuru Duvar ve İnce Yapı İşi",
      startDate: new Date(),
      endDate: new Date(Date.now() + 4 * 60 * 60 * 1000), // 4 saat sonra
      progress: 40,
      projectId: vadiEvleri.id,
      notes: "Malzeme sevkiyatı (Bina A - 3. Kat) bağlantılı inşaat iş emri.",
    },
  });

  const nowTime = new Date();
  const etaSample = new Date(nowTime.getTime() + 50 * 60 * 1000); // 50 dakika sonra

  await prisma.shipmentTracking.upsert({
    where: { trackingCode: "TRK-2026-NEXA" },
    update: {
      purchaseRequestId: purchaseReq.id,
      driverPhone: "+90 532 555 1020",
      vehiclePlate: "34 NX 2026",
      status: "ON_THE_WAY",
      lastLatitude: 41.0125,
      lastLongitude: 28.8830,
      estimatedTimeOfArrival: etaSample,
      delayInMinutes: 0,
      linkedTaskId: ganttTask.id,
    },
    create: {
      trackingCode: "TRK-2026-NEXA",
      purchaseRequestId: purchaseReq.id,
      driverPhone: "+90 532 555 1020",
      vehiclePlate: "34 NX 2026",
      status: "ON_THE_WAY",
      lastLatitude: 41.0125,
      lastLongitude: 28.8830,
      estimatedTimeOfArrival: etaSample,
      delayInMinutes: 0,
      linkedTaskId: ganttTask.id,
    }
  })

  const nexaPlaza = await prisma.project.upsert({
    where: { id: "project-plaza" },
    update: {},
    create: {
      id: "project-plaza",
      name: "Nexa Plaza İş Merkezi",
      title: "Nexa Plaza İş Merkezi",
      description: "Leed sertifikalı 25 katlı ofis binası",
      status: "SAHA",
      category: "Ticari",
      city: "İstanbul",
      district: "Kadıköy",
      mintika: "Kadıköy",
      ada: "567",
      parsel: "8",
      pafta: "B-3",
      yapiSinifi: "A-2",
      clientName: "Nexa Gayrimenkul",
      mapUrl: "https://maps.google.com",
      startDate: new Date("2024-03-01"),
      endDate: new Date("2027-06-30"),
      managerId: patron.id,
      siteManager: "Ali Öztürk",
      engineer: "Can Yılmaz",
      architect: "Zeynep Demir",
      yibfNo: "YIBF-2024-IST-002",
      healthScore: 92,
      progress: 45,
      gpsRequired: true,
      latitude: 40.9901,
      longitude: 29.0292,
      gpsRadius: 150,
      contractValue: 180000000,
      companyId: contractorCompany.id
    }
  })

  const iskenderun = await prisma.project.upsert({
    where: { id: "project-iskenderun" },
    update: {},
    create: {
      id: "project-iskenderun",
      name: "İskenderun Sahil Yolu Altyapı İşi",
      title: "İskenderun Sahil Yolu Altyapı İşi",
      description: "12 km sahil yolu altyapı yenileme projesi",
      status: "SAHA",
      category: "Altyapı",
      city: "Hatay",
      district: "İskenderun",
      mintika: "İskenderun",
      ada: "890",
      parsel: "12",
      pafta: "C-7",
      yapiSinifi: "A-1",
      clientName: "Hatay Büyükşehir Belediyesi",
      mapUrl: "https://maps.google.com",
      startDate: new Date("2024-06-01"),
      endDate: new Date("2025-12-31"),
      managerId: patron.id,
      siteManager: "Mehmet Kaya",
      engineer: "Hakan Öz",
      architect: "Selin Ak",
      yibfNo: "YIBF-2024-HAT-001",
      healthScore: 78,
      progress: 30,
      gpsRequired: true,
      latitude: 36.2023,
      longitude: 36.1605,
      gpsRadius: 500,
      contractValue: 95000000,
      companyId: contractorCompany.id
    }
  })

  console.log(` Created ${vadiEvleri.name} (%${vadiEvleri.progress} tamamlandı)`)
  console.log(` Created ${nexaPlaza.name} (%${nexaPlaza.progress} tamamlandı)`)
  console.log(` Created ${iskenderun.name} (%${iskenderun.progress} tamamlandı)`)

  // ============================================================================
  // TAŞERON FİRMALARI (SUBCONTRACTORS - New Model)
  // ============================================================================
  console.log(" Creating subcontractors...")

  const demirtasElektrik = await prisma.subcontractor.upsert({
    where: { id: "sub-demirtas" },
    update: {},
    create: {
      id: "sub-demirtas",
      name: "Demirtaş Elektrik Ltd. Şti.",
      taxNumber: "1234567890",
      contactName: "Ahmet Demirtaş",
      phone: "+90 532 111 2233"
    }
  })

  const yilmazlarKalip = await prisma.subcontractor.upsert({
    where: { id: "sub-yilmazlar" },
    update: {},
    create: {
      id: "sub-yilmazlar",
      name: "Yılmazlar Kalıpçılık",
      taxNumber: "0987654321",
      contactName: "Mehmet Yılmaz",
      phone: "+90 533 444 5566"
    }
  })

  console.log(` Created ${demirtasElektrik.name}`)
  console.log(` Created ${yilmazlarKalip.name}`)

  // ============================================================================
  // SÖZLEŞMELER (CONTRACTS - New Model)
  // ============================================================================
  console.log(" Creating contracts...")

  const contract1 = await prisma.contract.create({
    data: {
      projectId: vadiEvleri.id,
      subcontractorId: demirtasElektrik.id,
      title: "Vadi Evleri - Elektrik Tesisatı Sözleşmesi",
      totalAmount: 3500000,
      startDate: new Date("2024-01-15"),
      endDate: new Date("2025-12-31"),
      status: "ACTIVE"
    }
  })

  const contract2 = await prisma.contract.create({
    data: {
      projectId: vadiEvleri.id,
      subcontractorId: yilmazlarKalip.id,
      title: "Vadi Evleri - Kalıp İşleri Sözleşmesi",
      totalAmount: 2800000,
      startDate: new Date("2024-02-01"),
      endDate: new Date("2025-06-30"),
      status: "ACTIVE"
    }
  })

  const contract3 = await prisma.contract.create({
    data: {
      projectId: nexaPlaza.id,
      subcontractorId: demirtasElektrik.id,
      title: "Nexa Plaza - Elektrik Altyapı Sözleşmesi",
      totalAmount: 4200000,
      startDate: new Date("2024-03-01"),
      endDate: new Date("2026-03-31"),
      status: "ACTIVE"
    }
  })

  console.log(" Created 3 contracts")

  // ============================================================================
  // HAKEDİŞLER (PROGRESS BILLINGS - New Schema)
  // ============================================================================
  console.log(" Creating progress billings...")

  // Billing 1: Paid with advance deduction
  await prisma.progressBilling.create({
    data: {
      contractId: contract1.id,
      billingNumber: 1,
      period: new Date("2024-01-31"),
      grossAmount: 450000,
      advanceDeduction: 10000,
      penaltyDeduction: 0,
      retentionDeduction: 5000,
      netPayable: 435000,
      status: "PAID"
    }
  })

  // Billing 2: Paid with penalty deduction
  await prisma.progressBilling.create({
    data: {
      contractId: contract2.id,
      billingNumber: 1,
      period: new Date("2024-02-28"),
      grossAmount: 520000,
      advanceDeduction: 0,
      penaltyDeduction: 10000,
      retentionDeduction: 5000,
      netPayable: 505000,
      status: "PAID"
    }
  })

  // Billing 3: Approved with no deductions
  await prisma.progressBilling.create({
    data: {
      contractId: contract3.id,
      billingNumber: 1,
      period: new Date("2024-03-31"),
      grossAmount: 380000,
      advanceDeduction: 0,
      penaltyDeduction: 0,
      retentionDeduction: 10000,
      netPayable: 370000,
      status: "APPROVED"
    }
  })

  // Billing 4: Draft with all deductions
  await prisma.progressBilling.create({
    data: {
      contractId: contract1.id,
      billingNumber: 2,
      period: new Date("2024-02-29"),
      grossAmount: 500000,
      advanceDeduction: 15000,
      penaltyDeduction: 5000,
      retentionDeduction: 10000,
      netPayable: 470000,
      status: "DRAFT"
    }
  })

  // Billing 5: Pending approval
  await prisma.progressBilling.create({
    data: {
      contractId: contract2.id,
      billingNumber: 2,
      period: new Date("2024-03-31"),
      grossAmount: 480000,
      advanceDeduction: 0,
      penaltyDeduction: 0,
      retentionDeduction: 0,
      netPayable: 480000,
      status: "PENDING_APPROVAL"
    }
  })

  console.log(" Created 5 progress billings")

  // ============================================================================
  // KESİNTİLER VE CEZALAR (DEDUCTIONS)
  // ============================================================================
  console.log(" Creating deductions...")

  // Clear existing deductions to avoid foreign key conflicts
  await prisma.deduction.deleteMany({})

  await prisma.deduction.create({
    data: {
      amount: 15000,
      reason: "İş programına uyulmaması nedeniyle gecikme cezası",
      date: new Date("2024-02-15"),
      notes: "1 hafta gecikme için %3 ceza uygulanmıştır",
      projectId: vadiEvleri.id,
      subcontractorId: demirtasElektrik.id
    }
  })

  await prisma.deduction.create({
    data: {
      amount: 8000,
      reason: "Kalite uygunsuzluğu - Kalıp yüzeyi düzensizliği",
      date: new Date("2024-03-01"),
      notes: "TS 500 standartlarına uygun olmayan kalıp yüzeyleri",
      projectId: vadiEvleri.id,
      subcontractorId: yilmazlarKalip.id
    }
  })

  await prisma.deduction.create({
    data: {
      amount: 12000,
      reason: "İSG kurallarına uyulmaması",
      date: new Date("2024-03-10"),
      notes: "Baret takmayan personel tespiti",
      projectId: nexaPlaza.id,
      subcontractorId: demirtasElektrik.id
    }
  })

  console.log(" Created 3 deductions")

  // ============================================================================
  // EK PERSONEL (ADDITIONAL PERSONNEL)
  // ============================================================================
  console.log(" Creating additional personnel...")

  const mehmetKaya = await prisma.personel.upsert({
    where: { personnelNo: "P003" },
    update: {},
    create: {
      personnelNo: "P003",
      name: "Mehmet Kaya",
      tcNo: "11122233344",
      age: 42,
      birthDate: new Date("1982-03-10"),
      gender: Gender.MALE,
      phone: "+90 544 555 6677",
      email: "mehmet.kaya@mahirbakay.com",
      address: "İstanbul, Beyoğlu",
      department: "Makine",
      position: "Kule Vinç Operatörü",
      currentSite: "Vadi Evleri",
      hireDate: new Date("2018-06-01"),
      employmentType: EmploymentType.WORKER,
      status: PersonelStatus.ACTIVE,
      salary: 32000,
      salaryPayDay: 25,
      companyId: contractorCompany.id,
      role: UserRole.STAFF,
      bloodType: "O+",
      gunlukYevmiye: 500
    }
  })

  const ayseDemir = await prisma.personel.upsert({
    where: { personnelNo: "P004" },
    update: {},
    create: {
      personnelNo: "P004",
      name: "Ayşe Demir",
      tcNo: "55566677788",
      age: 30,
      birthDate: new Date("1994-07-22"),
      gender: Gender.FEMALE,
      phone: "+90 555 888 9900",
      email: "ayse.demir@mahirbakay.com",
      address: "İstanbul, Beşiktaş",
      department: "İSG",
      position: "İSG Uzmanı",
      currentSite: "Nexa Plaza",
      hireDate: new Date("2021-09-15"),
      employmentType: EmploymentType.OFFICER,
      status: PersonelStatus.ACTIVE,
      salary: 38000,
      salaryPayDay: 25,
      companyId: contractorCompany.id,
      role: UserRole.ENGINEER,
      bloodType: "AB+"
    }
  })

  const mustafaOz = await prisma.personel.upsert({
    where: { personnelNo: "P005" },
    update: {},
    create: {
      personnelNo: "P005",
      name: "Mustafa Öz",
      tcNo: "99988877766",
      age: 38,
      birthDate: new Date("1986-11-05"),
      gender: Gender.MALE,
      phone: "+90 542 333 4455",
      email: "mustafa.oz@mahirbakay.com",
      address: "İstanbul, Fatih",
      department: "İnşaat",
      position: "Beton Masteri",
      currentSite: "İskenderun",
      hireDate: new Date("2019-04-01"),
      employmentType: EmploymentType.WORKER,
      status: PersonelStatus.ACTIVE,
      salary: 29000,
      salaryPayDay: 25,
      companyId: contractorCompany.id,
      role: UserRole.STAFF,
      bloodType: "B-",
      gunlukYevmiye: 450
    }
  })

  console.log(` Created ${mehmetKaya.name} (Kule Vinç Operatörü)`)
  console.log(` Created ${ayseDemir.name} (İSG Uzmanı)`)
  console.log(` Created ${mustafaOz.name} (Beton Masteri)`)

  // ============================================================================
  // PUANTAJ KAYITLARI (ATTENDANCE RECORDS)
  // ============================================================================
  console.log(" Creating attendance records...")

  const attendanceData = []
  const today = new Date()

  for (let i = 0; i < 30; i++) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)

    // Hafta sonu hariç
    if (date.getDay() !== 0 && date.getDay() !== 6) {
      attendanceData.push({
        date: date,
        checkIn: new Date(date.setHours(8, 0, 0)),
        checkOut: new Date(date.setHours(17, 0, 0)),
        dayMultiplier: 1,
        overtimeHours: 0,
        status: "PRESENT",
        personelId: mehmetKaya.id,
        projectId: vadiEvleri.id
      })

      attendanceData.push({
        date: new Date(date),
        checkIn: new Date(date.setHours(8, 15, 0)),
        checkOut: new Date(date.setHours(17, 30, 0)),
        dayMultiplier: 1,
        overtimeHours: 0.25,
        status: "PRESENT",
        personelId: ayseDemir.id,
        projectId: nexaPlaza.id
      })

      attendanceData.push({
        date: new Date(date),
        checkIn: new Date(date.setHours(7, 45, 0)),
        checkOut: new Date(date.setHours(16, 45, 0)),
        dayMultiplier: 1,
        overtimeHours: 0,
        status: "PRESENT",
        personelId: mustafaOz.id,
        projectId: iskenderun.id
      })
    }
  }

  for (const record of attendanceData) {
    await prisma.attendanceRecord.create({ data: record })
    await new Promise(resolve => setTimeout(resolve, 10))
  }

  console.log(` Created ${attendanceData.length} attendance records`)

  // ============================================================================
  // FİNANS İŞLEMLERİ (TRANSACTIONS)
  // ============================================================================
  console.log(" Creating finance transactions...")

  await prisma.transaction.create({
    data: {
      type: "GIDER",
      amount: 250000,
      description: "Hazır Beton Alımı - Vadi Evleri A Blok Temel",
      date: new Date("2024-01-20"),
      category: "Malzeme",
      project: { connect: { id: vadiEvleri.id } },
      personnel: { connect: { id: mehmetKaya.id } }
    }
  })

  await prisma.transaction.create({
    data: {
      type: "GIDER",
      amount: 435000,
      description: "Hakediş Ödemesi - Yıldız Demirci Ocak Ayı",
      date: new Date("2024-02-01"),
      category: "Taşeron Ödemesi",
      project: { connect: { id: vadiEvleri.id } },
      personnel: { connect: { id: mehmetKaya.id } }
    }
  })

  await prisma.transaction.create({
    data: {
      type: "GELIR",
      amount: 15000000,
      description: "Proje Avans Ödemesi - Nexa Plaza",
      date: new Date("2024-02-15"),
      category: "Proje Geliri",
      project: { connect: { id: nexaPlaza.id } },
      personnel: { connect: { id: ayseDemir.id } }
    }
  })

  await prisma.transaction.create({
    data: {
      type: "GIDER",
      amount: 85000,
      description: "Demir Alımı - 20 Ton Nervürlü Çelik",
      date: new Date("2024-03-01"),
      category: "Malzeme",
      project: { connect: { id: vadiEvleri.id } },
      personnel: { connect: { id: mehmetKaya.id } }
    }
  })

  await prisma.transaction.create({
    data: {
      type: "GIDER",
      amount: 45000,
      description: "Çimento Alımı - 50 Torba Çimento",
      date: new Date("2024-03-05"),
      category: "Malzeme",
      project: { connect: { id: iskenderun.id } },
      personnel: { connect: { id: mustafaOz.id } }
    }
  })

  console.log(" Created 5 finance transactions")

  // ============================================================================
  // STOK KAYITLARI (STOCK)
  // ============================================================================
  console.log(" Creating stock items...")

  await prisma.stock.upsert({
    where: { code: "S001" },
    update: {},
    create: {
      code: "S001",
      name: "Nervürlü Çelik S420",
      category: "Demir",
      unit: "TON",
      quantity: 45.5,
      minStock: 20,
      maxStock: 100,
      costPrice: 4250,
      sellPrice: 4800
    }
  })

  await prisma.stock.upsert({
    where: { code: "S002" },
    update: {},
    create: {
      code: "S002",
      name: "Portland Çimento CEM I",
      category: "Çimento",
      unit: "PAKET",
      quantity: 250,
      minStock: 100,
      maxStock: 500,
      costPrice: 90,
      sellPrice: 110
    }
  })

  await prisma.stock.upsert({
    where: { code: "S003" },
    update: {},
    create: {
      code: "S003",
      name: "Kalıp Plywood 18mm",
      category: "Kalıp",
      unit: "ADET",
      quantity: 150,
      minStock: 50,
      maxStock: 300,
      costPrice: 450,
      sellPrice: 550
    }
  })

  console.log(" Created 3 stock items")

  // ============================================================================
  // AI ANALİZLERİ (AI ANALYSIS)
  // ============================================================================
  console.log(" Creating AI analysis records...")

  await prisma.aIAnalysis.create({
    data: {
      type: "REINFORCEMENT",
      title: "Vadi Evleri - Kolon Demir Aralığı Analizi",
      description: "A Blok 3. Kat Kolon K12 donatı aralığı kontrol edildi. Şartnameye göre %15 sapma tespit edildi.",
      result: "WARNING",
      confidence: 87.5,
      imageUrl: "/images/ai-reinforcement-1.jpg",
      projectId: vadiEvleri.id
    }
  })

  await prisma.aIAnalysis.create({
    data: {
      type: "CRACK_DETECTION",
      title: "Drone Çatlak Tespiti - Nexa Plaza",
      description: "B Blok cephe yüzeyinde 3 adet mikro çatlak tespit edildi. Risk seviyesi düşük.",
      result: "PASS",
      confidence: 92.3,
      imageUrl: "/images/ai-crack-1.jpg",
      projectId: nexaPlaza.id
    }
  })

  await prisma.aIAnalysis.create({
    data: {
      type: "DRONE_ANALYSIS",
      title: "İskenderun Sahil Yolu İlerleme Analizi",
      description: "Drone görüntüleri ile %30 ilerleme tespit edildi. Planlanan programa uygun ilerleme.",
      result: "PASS",
      confidence: 95.0,
      imageUrl: "/images/ai-drone-1.jpg",
      projectId: iskenderun.id
    }
  })

  await prisma.aIAnalysis.create({
    data: {
      type: "SAFETY",
      title: "İSG Güvenlik Analizi - Vadi Evleri",
      description: "İSG ekipman kullanımı analizi: %92 uyum. Baret takmayan 2 personel tespit edildi.",
      result: "WARNING",
      confidence: 89.7,
      imageUrl: "/images/ai-safety-1.jpg",
      projectId: vadiEvleri.id
    }
  })

  console.log(" Created 4 AI analysis records")

  // ============================================================================
  // İSG RAPORLARI (ISG REPORTS)
  // ============================================================================
  console.log(" Creating İSG reports...")

  await prisma.isgReport.create({
    data: {
      type: "TEHLIKE",
      status: "COZULDU",
      description: "A Blok 4. Kat İskele Korkuluğu Gevşemiş - A Blok 4. katta iskele korkuluğunda gevşeklik tespit edildi. Acil düzeltme yapıldı.",
      location: "Vadi Evleri - A Blok 4. Kat",
      projectId: vadiEvleri.id,
      personelId: ayseDemir.id
    }
  })

  await prisma.isgReport.create({
    data: {
      type: "TEHLIKE",
      status: "INCELEMEDE",
      description: "Baret Takmayan Personel Tespiti - Nexa Plaza şantiyesinde baret takmadan çalışan 2 personel tespit edildi. İkaz yapıldı.",
      location: "Nexa Plaza - Şantiye Girişi",
      projectId: nexaPlaza.id,
      personelId: ayseDemir.id
    }
  })

  await prisma.isgReport.create({
    data: {
      type: "KAZA_TUTANAGI",
      status: "ACIL",
      description: "Vinç Operatörü Düşme Riski - İskenderun şantiyesinde vinç operatörü platformunda güvenlik eksikliği tespit edildi.",
      location: "İskenderun - Vinç Platformu",
      projectId: iskenderun.id,
      personelId: ayseDemir.id
    }
  })

  await prisma.isgReport.create({
    data: {
      type: "EKSIK_DOKUM",
      status: "COZULDU",
      description: "İSG Eğitim Belgesi Eksikliği - Yeni personel İSG eğitimi belgesi eksik. Eğitim tamamlandı.",
      location: "Vadi Evleri - Şantiye Ofisi",
      projectId: vadiEvleri.id,
      personelId: ayseDemir.id
    }
  })

  console.log(" Created 4 İSG reports")

  // ============================================================================
  // İŞ EMİRLERİ (WORK ORDERS)
  // ============================================================================
  console.log(" Creating work orders...")

  await prisma.workOrder.create({
    data: {
      title: "A Blok Temel Kazı Tamamlama",
      description: "A Blok temel kazı işlerinin tamamlanması ve zemin hazırlığı",
      status: "IN_PROGRESS",
      priority: "HIGH",
      department: "INSAAT",
      projectId: vadiEvleri.id,
      assignedToId: mehmetKaya.id,
      dueDate: new Date("2024-04-15")
    }
  })

  await prisma.workOrder.create({
    data: {
      title: "Elektrik Tesisatı Proje Revizyonu",
      description: "Nexa Plaza elektrik tesisatı projesinde revizyon gerekiyor",
      status: "TODO",
      priority: "MEDIUM",
      department: "ELEKTRIK",
      projectId: nexaPlaza.id,
      assignedToId: mustafaOz.id,
      dueDate: new Date("2024-04-30")
    }
  })

  await prisma.workOrder.create({
    data: {
      title: "İSG Ekipman Kontrolü",
      description: "Tüm şantiyelerde İSG ekipmanlarının periyodik kontrolü",
      status: "IN_PROGRESS",
      priority: "HIGH",
      department: "GENEL",
      projectId: vadiEvleri.id,
      assignedToId: ayseDemir.id,
      dueDate: new Date("2024-04-10")
    }
  })

  await prisma.workOrder.create({
    data: {
      title: "Sahil Yolu Asfalt Serme",
      description: "İskenderun sahil yolunda asfalt serme işi",
      status: "TODO",
      priority: "MEDIUM",
      department: "INSAAT",
      projectId: iskenderun.id,
      assignedToId: mehmetKaya.id,
      dueDate: new Date("2024-05-15")
    }
  })

  console.log(" Created 4 work orders")

  // ============================================================================
  // VARDİYALAR (SHIFTS)
  // ============================================================================
  console.log(" Creating shifts...")

  // Shifts (Vardiyalar)
  await prisma.shift.create({
    data: {
      name: "Sabah Vardiyası",
      timeRange: "08:00 - 17:00",
      personnelCount: 45,
      projectId: vadiEvleri.id,
      status: "Active"
    }
  })

  await prisma.shift.create({
    data: {
      name: "Gece Vardiyası",
      timeRange: "20:00 - 05:00",
      personnelCount: 15,
      projectId: vadiEvleri.id,
      status: "Active"
    }
  })

  await prisma.shift.create({
    data: {
      name: "Sabah Vardiyası",
      timeRange: "08:00 - 17:00",
      personnelCount: 30,
      projectId: nexaPlaza.id,
      status: "Active"
    }
  })

  await prisma.shift.create({
    data: {
      name: "Öğle Vardiyası",
      timeRange: "12:00 - 21:00",
      personnelCount: 25,
      projectId: nexaPlaza.id,
      status: "Active"
    }
  })

  await prisma.shift.create({
    data: {
      name: "Sabah Vardiyası",
      timeRange: "07:00 - 16:00",
      personnelCount: 35,
      projectId: iskenderun.id,
      status: "Active"
    }
  })

  await prisma.shift.create({
    data: {
      name: "Gece Vardiyası",
      timeRange: "19:00 - 04:00",
      personnelCount: 20,
      projectId: iskenderun.id,
      status: "Active"
    }
  })

  await prisma.shift.create({
    data: {
      name: "Hafta Sonu Vardiyası",
      timeRange: "09:00 - 18:00",
      personnelCount: 15,
      projectId: vadiEvleri.id,
      status: "Active"
    }
  })

  await prisma.shift.create({
    data: {
      name: "Part-Time Vardiya",
      timeRange: "14:00 - 20:00",
      personnelCount: 10,
      projectId: nexaPlaza.id,
      status: "Active"
    }
  })

  console.log(" Created 8 shifts")

  // ============================================================================
  // DRONE ANALYSIS (Drone Gözlem Analizi)
  // ============================================================================
  console.log(" Creating drone analyses...")

  await prisma.droneAnalysis.create({
    data: {
      title: "A Blok Temel Atımı Drone Gözlemi",
      description: "Temel kazı alanının havadan görüntülenmesi ve ilerleme durumu analizi",
      flightDate: new Date("2024-01-15"),
      areaCovered: 2.5,
      imageUrl: "https://example.com/drone1.jpg",
      status: "COMPLETED",
      projectId: vadiEvleri.id
    }
  })

  await prisma.droneAnalysis.create({
    data: {
      title: "Nexa Plaza Çatı İzolasyon Kontrolü",
      description: "Çatı izolasyon malzemesi uygulama kalitesi drone ile kontrol edildi",
      flightDate: new Date("2024-02-20"),
      areaCovered: 1.8,
      imageUrl: "https://example.com/drone2.jpg",
      status: "COMPLETED",
      projectId: nexaPlaza.id
    }
  })

  await prisma.droneAnalysis.create({
    data: {
      title: "İskenderun Sahil Yolu Topografya",
      description: "Yol güzergahı ve çevre alanın topografik haritalandırılması",
      flightDate: new Date("2024-03-10"),
      areaCovered: 5.0,
      imageUrl: "https://example.com/drone3.jpg",
      status: "COMPLETED",
      projectId: iskenderun.id
    }
  })

  console.log(" Created 3 drone analyses")

  // ============================================================================
  // LAB DOCUMENT (Laboratuvar ve Evrak)
  // ============================================================================
  console.log(" Creating lab documents...")

  await prisma.labDocument.create({
    data: {
      title: "C25 Beton Dayanım Testi",
      documentNo: "LAB-2024-001",
      sampleType: "BETON",
      testResult: "PASS",
      testDate: new Date("2024-01-20"),
      imageUrl: "https://example.com/lab1.jpg",
      notes: "28 günlük dayanım testi sonucu 32 MPa",
      projectId: vadiEvleri.id
    }
  })

  await prisma.labDocument.create({
    data: {
      title: "Donatı Çekme Testi",
      documentNo: "LAB-2024-002",
      sampleType: "DONATI",
      testResult: "PASS",
      testDate: new Date("2024-02-15"),
      imageUrl: "https://example.com/lab2.jpg",
      notes: "S420 donatı çeliği çekme testi başarılı",
      projectId: nexaPlaza.id
    }
  })

  await prisma.labDocument.create({
    data: {
      title: "Zemin Taşıma Kapasitesi Testi",
      documentNo: "LAB-2024-003",
      sampleType: "TOPRAK",
      testResult: "PASS",
      testDate: new Date("2024-03-05"),
      imageUrl: "https://example.com/lab3.jpg",
      notes: "Taşıma kapasitesi TS 500 standartlarına uygun",
      projectId: iskenderun.id
    }
  })

  console.log(" Created 3 lab documents")

  // ============================================================================
  // REBAR FORMWORK CHECK (Demir & Kalıp Kontrol)
  // ============================================================================
  console.log(" Creating rebar formwork checks...")

  await prisma.rebarFormworkCheck.create({
    data: {
      title: "A Blok 3. Kat Kolon Demirleri Kontrolü",
      type: "REBAR",
      location: "A Blok 3. Kat Kolonlar",
      status: "APPROVED",
      checkDate: new Date("2024-01-25"),
      imageUrl: "https://example.com/rebar1.jpg",
      notes: "Demir aralıkları ve bağlantı detayları onaylandı",
      projectId: vadiEvleri.id,
      inspectorId: mehmetKaya.id
    }
  })

  await prisma.rebarFormworkCheck.create({
    data: {
      title: "B Blok 2. Kat Döşeme Kalıp Kontrolü",
      type: "FORMWORK",
      location: "B Blok 2. Kat Döşeme",
      status: "APPROVED",
      checkDate: new Date("2024-02-18"),
      imageUrl: "https://example.com/formwork1.jpg",
      notes: "Kalıp düzlemi ve destekler uygun",
      projectId: nexaPlaza.id,
      inspectorId: ayseDemir.id
    }
  })

  await prisma.rebarFormworkCheck.create({
    data: {
      title: "Kiriş Demiri ve Kalıp Birleşik Kontrol",
      type: "BOTH",
      location: "C Blok 1. Kat Kirişler",
      status: "PENDING",
      checkDate: new Date("2024-03-20"),
      imageUrl: "https://example.com/both1.jpg",
      notes: "Kontrol devam ediyor",
      projectId: iskenderun.id,
      inspectorId: mustafaOz.id
    }
  })

  console.log(" Created 3 rebar formwork checks")

  // ============================================================================
  // ATTACHMENT (Ataşman & Dijital Delil)
  // ============================================================================
  console.log(" Creating attachments...")

  await prisma.attachment.create({
    data: {
      title: "Temel Kazı Fotoğrafı",
      type: "PHOTO",
      fileUrl: "https://example.com/att1.jpg",
      description: "A Blok temel kazı alanı görüntüsü",
      projectId: vadiEvleri.id,
      uploadedById: patron.id
    }
  })

  await prisma.attachment.create({
    data: {
      title: "İş Güvenliği Eğitim Videosu",
      type: "VIDEO",
      fileUrl: "https://example.com/att1.mp4",
      description: "Şantiye giriş eğitimi kaydı",
      projectId: nexaPlaza.id,
      uploadedById: patron.id
    }
  })

  await prisma.attachment.create({
    data: {
      title: "Proje Teknik Şartnamesi",
      type: "DOCUMENT",
      fileUrl: "https://example.com/att1.pdf",
      description: "Teknik şartname PDF dosyası",
      projectId: iskenderun.id,
      uploadedById: patron.id
    }
  })

  console.log(" Created 3 attachments")

  // ============================================================================
  // LICENSE ARCHIVE (Ruhsat ve Evrak Arşivi)
  // ============================================================================
  console.log(" Creating license archives...")

  await prisma.licenseArchive.create({
    data: {
      title: "Yapı Ruhsatı - Vadi Evleri",
      licenseNo: "YR-2024-001",
      type: "YAPI_RUHSAT",
      issueDate: new Date("2024-01-01"),
      expiryDate: new Date("2026-01-01"),
      status: "ACTIVE",
      fileUrl: "https://example.com/license1.pdf",
      notes: "Belediye onaylı yapı ruhsatı",
      projectId: vadiEvleri.id
    }
  })

  await prisma.licenseArchive.create({
    data: {
      title: "İSG Belgelendirme Sertifikası",
      licenseNo: "ISG-2024-002",
      type: "ISG_BELGESI",
      issueDate: new Date("2024-02-01"),
      expiryDate: new Date("2025-02-01"),
      status: "ACTIVE",
      fileUrl: "https://example.com/license2.pdf",
      notes: "İş güvenliği belgesi",
      projectId: nexaPlaza.id
    }
  })

  await prisma.licenseArchive.create({
    data: {
      title: "Çevre İzin Belgesi",
      licenseNo: "CEVRE-2024-003",
      type: "DIGER",
      issueDate: new Date("2024-03-01"),
      expiryDate: new Date("2025-03-01"),
      status: "ACTIVE",
      fileUrl: "https://example.com/license3.pdf",
      notes: "Çevre bakanlığı izni",
      projectId: iskenderun.id
    }
  })

  console.log(" Created 3 license archives")

  // ============================================================================
  // DIGITAL ARCHIVE (Dijital Evrak Arşivi)
  // ============================================================================
  console.log(" Creating digital archives...")

  await prisma.digitalArchive.create({
    data: {
      title: "Mimari Proje Dosyaları",
      category: "PROJE",
      fileUrl: "https://example.com/arch1.zip",
      fileSize: 52428800,
      mimeType: "application/zip",
      description: "Mimari çizimler ve detaylar",
      projectId: vadiEvleri.id,
      uploadedById: patron.id
    }
  })

  await prisma.digitalArchive.create({
    data: {
      title: "Aylık İlerleme Raporu - Şubat",
      category: "RAPOR",
      fileUrl: "https://example.com/arch2.pdf",
      fileSize: 2097152,
      mimeType: "application/pdf",
      description: "Şubat ayı ilerleme raporu",
      projectId: nexaPlaza.id,
      uploadedById: patron.id
    }
  })

  await prisma.digitalArchive.create({
    data: {
      title: "Ana Sözleşme",
      category: "SOZLESME",
      fileUrl: "https://example.com/arch3.pdf",
      fileSize: 10485760,
      mimeType: "application/pdf",
      description: "İdare ile yapılan ana sözleşme",
      projectId: iskenderun.id,
      uploadedById: patron.id
    }
  })

  console.log(" Created 3 digital archives")

  // ============================================================================
  // OCR DOCUMENT (Akıllı Evrak Denetimi)
  // ============================================================================
  console.log(" Creating OCR documents...")

  await prisma.oCRDocument.create({
    data: {
      title: "Fatura OCR İşlemi",
      originalText: "YILDIZ DEMİR A.Ş. Fatura No: 2024-001",
      extractedText: "YILDIZ DEMİR A.Ş. Fatura No: 2024-001 Tutar: 125.000 TL",
      confidence: 95.5,
      status: "PROCESSED",
      fileUrl: "https://example.com/ocr1.pdf",
      imageUrl: "https://example.com/ocr1.jpg",
      projectId: vadiEvleri.id
    }
  })

  await prisma.oCRDocument.create({
    data: {
      title: "Teklif OCR İşlemi",
      originalText: "GÜVEN KALIPÇILIK Teklif No: TK-2024-001",
      extractedText: "GÜVEN KALIPÇILIK Teklif No: TK-2024-001 Tutar: 85.000 TL",
      confidence: 92.3,
      status: "PROCESSED",
      fileUrl: "https://example.com/ocr2.pdf",
      imageUrl: "https://example.com/ocr2.jpg",
      projectId: nexaPlaza.id
    }
  })

  await prisma.oCRDocument.create({
    data: {
      title: "Sözleşme OCR İşlemi",
      originalText: "APEX ELEKTRİK Sözleşme No: SZ-2024-001",
      extractedText: "APEX ELEKTRİK Sözleşme No: SZ-2024-001 Tutar: 250.000 TL",
      confidence: 88.7,
      status: "PROCESSED",
      fileUrl: "https://example.com/ocr3.pdf",
      imageUrl: "https://example.com/ocr3.jpg",
      projectId: iskenderun.id
    }
  })

  console.log(" Created 3 OCR documents")

  // ============================================================================
  // AI IMAGE ANALYSIS (AI Görsel Analiz)
  // ============================================================================
  console.log(" Creating AI image analyses...")

  await prisma.aIImageAnalysis.create({
    data: {
      title: "Çatlak Tespiti - A Blok Duvar",
      imageUrl: "https://example.com/ai1.jpg",
      analysisType: "CRACK_DETECTION",
      result: "WARNING",
      confidence: 87.5,
      boundingBoxes: '[{"x":100,"y":200,"width":50,"height":30,"label":"crack"}]',
      notes: "Duvar yüzeyinde küçük çatlak tespit edildi",
      projectId: vadiEvleri.id
    }
  })

  await prisma.aIImageAnalysis.create({
    data: {
      title: "İş Güvenliği Analizi - Baret Kontrolü",
      imageUrl: "https://example.com/ai2.jpg",
      analysisType: "SAFETY_HAZARD",
      result: "PASS",
      confidence: 94.2,
      boundingBoxes: '[{"x":150,"y":100,"width":40,"height":40,"label":"helmet"}]',
      notes: "Tüm personel baret taktı",
      projectId: nexaPlaza.id
    }
  })

  await prisma.aIImageAnalysis.create({
    data: {
      title: "Ekipman Sayımı - Vinçler",
      imageUrl: "https://example.com/ai3.jpg",
      analysisType: "EQUIPMENT_COUNT",
      result: "PASS",
      confidence: 91.8,
      boundingBoxes: '[{"x":200,"y":150,"width":60,"height":80,"label":"crane"}]',
      notes: "3 adet kule vinç tespit edildi",
      projectId: iskenderun.id
    }
  })

  console.log(" Created 3 AI image analyses")

  // ============================================================================
  // PROJECT REVISION (Proje Revizyonları)
  // ============================================================================
  console.log(" Creating project revisions...")

  await prisma.projectRevision.create({
    data: {
      version: "v1.0",
      title: "İlk Proje Revizyonu",
      description: "Mimari düzenlemeler ve plan değişiklikleri",
      status: "APPROVED",
      fileUrl: "https://example.com/rev1.pdf",
      projectId: vadiEvleri.id,
      createdById: patron.id
    }
  })

  await prisma.projectRevision.create({
    data: {
      version: "v1.1",
      title: "İkinci Proje Revizyonu",
      description: "Statik güçlendirme detayları",
      status: "APPROVED",
      fileUrl: "https://example.com/rev2.pdf",
      projectId: nexaPlaza.id,
      createdById: patron.id
    }
  })

  await prisma.projectRevision.create({
    data: {
      version: "v2.0",
      title: "Üçüncü Proje Revizyonu",
      description: "Mekanik tesisat değişiklikleri",
      status: "DRAFT",
      fileUrl: "https://example.com/rev3.pdf",
      projectId: iskenderun.id,
      createdById: patron.id
    }
  })

  console.log(" Created 3 project revisions")

  // ============================================================================
  // DIGITAL DRAWING (Dijital Projeler / Çizimler)
  // ============================================================================
  console.log(" Creating digital drawings...")

  await prisma.digitalDrawing.create({
    data: {
      title: "Mimari Plan - Zemin Kat",
      drawingNo: "M-001",
      type: "MIMARI",
      scale: "1/100",
      status: "ACTIVE",
      fileUrl: "https://example.com/draw1.dwg",
      thumbnailUrl: "https://example.com/draw1.jpg",
      notes: "Zemin kat mimari planı",
      projectId: vadiEvleri.id,
      uploadedById: patron.id
    }
  })

  await prisma.digitalDrawing.create({
    data: {
      title: "Statik Proje - Kolon Detayları",
      drawingNo: "S-002",
      type: "STATIK",
      scale: "1/50",
      status: "ACTIVE",
      fileUrl: "https://example.com/draw2.dwg",
      thumbnailUrl: "https://example.com/draw2.jpg",
      notes: "Kolon donatı detayları",
      projectId: nexaPlaza.id,
      uploadedById: patron.id
    }
  })

  await prisma.digitalDrawing.create({
    data: {
      title: "Elektrik Tesisat - Aydınlatma",
      drawingNo: "E-003",
      type: "ELEKTRIK",
      scale: "1/100",
      status: "ACTIVE",
      fileUrl: "https://example.com/draw3.dwg",
      thumbnailUrl: "https://example.com/draw3.jpg",
      notes: "Aydınlatma tesisat planı",
      projectId: iskenderun.id,
      uploadedById: patron.id
    }
  })

  console.log(" Created 3 digital drawings")

  // ============================================================================
  // AUDIT RECORD (Denetim Kayıtları)
  // ============================================================================
  console.log(" Creating audit records...")

  await prisma.auditRecord.create({
    data: {
      title: "İç Kalite Denetimi - Ocak",
      type: "INTERNAL",
      status: "COMPLETED",
      auditDate: new Date("2024-01-30"),
      findings: "Genel durum iyi, küçük eksiklikler tespit edildi",
      score: 92,
      projectId: vadiEvleri.id,
      auditorId: mehmetKaya.id
    }
  })

  await prisma.auditRecord.create({
    data: {
      title: "Dış Denetim - İSG",
      type: "EXTERNAL",
      status: "COMPLETED",
      auditDate: new Date("2024-02-28"),
      findings: "İSG standartlarına uygunluk sağlandı",
      score: 88,
      projectId: nexaPlaza.id,
      auditorId: ayseDemir.id
    }
  })

  await prisma.auditRecord.create({
    data: {
      title: "OHS Denetimi - Mart",
      type: "OHS",
      status: "IN_PROGRESS",
      auditDate: new Date("2024-03-25"),
      findings: null,
      score: null,
      projectId: iskenderun.id,
      auditorId: mustafaOz.id
    }
  })

  console.log(" Created 3 audit records")

  // ============================================================================
  // MATERIAL APPROVAL (Malzeme Onayları)
  // ============================================================================
  console.log(" Creating material approvals...")

  await prisma.materialApproval.create({
    data: {
      materialName: "C25 Beton",
      supplier: "Oyak Beton",
      batchNo: "B-2024-001",
      testResult: "APPROVED",
      testDate: new Date("2024-01-22"),
      certificateUrl: "https://example.com/cert1.pdf",
      notes: "Beton dayanım testi başarılı",
      projectId: vadiEvleri.id,
      approvedById: mehmetKaya.id
    }
  })

  await prisma.materialApproval.create({
    data: {
      materialName: "S420 Donatı Çeliği",
      supplier: "Yıldız Demir",
      batchNo: "B-2024-002",
      testResult: "APPROVED",
      testDate: new Date("2024-02-17"),
      certificateUrl: "https://example.com/cert2.pdf",
      notes: "Donatı çekme testi başarılı",
      projectId: nexaPlaza.id,
      approvedById: ayseDemir.id
    }
  })

  await prisma.materialApproval.create({
    data: {
      materialName: "PVC Boru",
      supplier: "Ege Plastik",
      batchNo: "B-2024-003",
      testResult: "PENDING",
      testDate: new Date("2024-03-22"),
      certificateUrl: null,
      notes: "Test sonuçları bekleniyor",
      projectId: iskenderun.id,
      approvedById: null
    }
  })

  console.log(" Created 3 material approvals")

  // ============================================================================
  // NONCONFORMITY DOF (Uygunsuzluk & DÖF)
  // ============================================================================
  console.log(" Creating nonconformity DOFs...")

  await prisma.nonconformityDOF.create({
    data: {
      title: "C25 Beton Dayanım Düşüklüğü",
      type: "QUALITY",
      severity: "HIGH",
      status: "CLOSED",
      description: "Beton dayanım testi sonuçları beklenen değerlerin altında çıktı",
      rootCause: "Çimento kalitesi",
      correctiveAction: "Çimento tedarikçisi değiştirildi",
      dueDate: new Date("2024-02-01"),
      projectId: vadiEvleri.id,
      reportedById: mehmetKaya.id
    }
  })

  await prisma.nonconformityDOF.create({
    data: {
      title: "İSG Eksikliği - Baret Kullanımı",
      type: "SAFETY",
      severity: "MEDIUM",
      status: "CLOSED",
      description: "Bazı personel baret kullanmıyordu",
      rootCause: "Eğitim eksikliği",
      correctiveAction: "İSG eğitimi verildi",
      dueDate: new Date("2024-02-15"),
      projectId: nexaPlaza.id,
      reportedById: ayseDemir.id
    }
  })

  await prisma.nonconformityDOF.create({
    data: {
      title: "Evrak Eksikliği - Malzeme Sertifikası",
      type: "DOCUMENT",
      severity: "LOW",
      status: "OPEN",
      description: "Malzeme sertifikası eksik",
      rootCause: null,
      correctiveAction: null,
      dueDate: new Date("2024-04-01"),
      projectId: iskenderun.id,
      reportedById: mustafaOz.id
    }
  })

  console.log(" Created 3 nonconformity DOFs")

  // ============================================================================
  // LEGAL CERTIFICATE (Yasal Evrak ve Sertifika Takibi)
  // ============================================================================
  console.log(" Creating legal certificates...")

  await prisma.legalCertificate.create({
    data: {
      title: "İSG Sertifikası",
      type: "ISG_CERTIFICATE",
      certificateNo: "ISG-2024-001",
      issueDate: new Date("2024-01-10"),
      expiryDate: new Date("2025-01-10"),
      status: "ACTIVE",
      fileUrl: "https://example.com/legal1.pdf",
      notes: "İş güvenliği sertifikası",
      personelId: mehmetKaya.id
    }
  })

  await prisma.legalCertificate.create({
    data: {
      title: "Mühendislik Yeterlik Belgesi",
      type: "PROFESSIONAL_LICENSE",
      certificateNo: "MYB-2024-002",
      issueDate: new Date("2024-02-15"),
      expiryDate: new Date("2026-02-15"),
      status: "ACTIVE",
      fileUrl: "https://example.com/legal2.pdf",
      notes: "İnşaat mühendisliği yeterlik belgesi",
      personelId: ayseDemir.id
    }
  })

  await prisma.legalCertificate.create({
    data: {
      title: "Kepçe Operatörlük Belgesi",
      type: "OTHER",
      certificateNo: "KOP-2024-003",
      issueDate: new Date("2024-03-20"),
      expiryDate: new Date("2025-03-20"),
      status: "ACTIVE",
      fileUrl: "https://example.com/legal3.pdf",
      notes: "Kepçe operatörlük belgesi",
      personelId: mustafaOz.id
    }
  })

  console.log(" Created 3 legal certificates")

  // ============================================================================
  // NEAR MISS (Ramak Kala Bildirim)
  // ============================================================================
  console.log(" Creating near misses...")

  await prisma.nearMiss.create({
    data: {
      title: "Düşen Malzeme Tehlikesi",
      description: "Yüksekten düşen malzeme personelin yanına düştü",
      severity: "HIGH",
      status: "CLOSED",
      incidentDate: new Date("2024-01-28"),
      location: "A Blok 3. Kat",
      imageUrl: "https://example.com/near1.jpg",
      projectId: vadiEvleri.id,
      reportedById: mehmetKaya.id
    }
  })

  await prisma.nearMiss.create({
    data: {
      title: "Elektrik Kaçağı Riski",
      description: "Kablo kopması nedeniyle elektrik kaçağı riski oluştu",
      severity: "MEDIUM",
      status: "CLOSED",
      incidentDate: new Date("2024-02-25"),
      location: "B Blok 2. Kat",
      imageUrl: "https://example.com/near2.jpg",
      projectId: nexaPlaza.id,
      reportedById: ayseDemir.id
    }
  })

  await prisma.nearMiss.create({
    data: {
      title: "Kayak Zemin Riski",
      description: "Yağmurlu hava nedeniyle zemin kaygan",
      severity: "LOW",
      status: "OPEN",
      incidentDate: new Date("2024-03-28"),
      location: "Şantiye Girişi",
      imageUrl: "https://example.com/near3.jpg",
      projectId: iskenderun.id,
      reportedById: mustafaOz.id
    }
  })

  console.log(" Created 3 near misses")

  // ============================================================================
  // PPE ASSIGNMENT (KKD Dijital Zimmet)
  // ============================================================================
  console.log(" Creating PPE assignments...")

  await prisma.pPEAssignment.create({
    data: {
      itemName: "Baret",
      type: "HELMET",
      serialNo: "B-001",
      status: "ASSIGNED",
      assignmentDate: new Date("2024-01-15"),
      returnDate: null,
      notes: "Sarı renk baret",
      personelId: mehmetKaya.id,
      projectId: vadiEvleri.id
    }
  })

  await prisma.pPEAssignment.create({
    data: {
      itemName: "Reflektörlü Yelek",
      type: "VEST",
      serialNo: "Y-002",
      status: "ASSIGNED",
      assignmentDate: new Date("2024-02-10"),
      returnDate: null,
      notes: "Turuncu renk yelek",
      personelId: ayseDemir.id,
      projectId: nexaPlaza.id
    }
  })

  await prisma.pPEAssignment.create({
    data: {
      itemName: "Güvenlik Ayakkabısı",
      type: "BOOTS",
      serialNo: "A-003",
      status: "ASSIGNED",
      assignmentDate: new Date("2024-03-05"),
      returnDate: null,
      notes: "Çelik burunlu ayakkabı",
      personelId: mustafaOz.id,
      projectId: iskenderun.id
    }
  })

  console.log(" Created 3 PPE assignments")

  // ============================================================================
  // LOGISTICS APPOINTMENT (Lojistik & Randevu Ağı)
  // ============================================================================
  console.log(" Creating logistics appointments...")

  await prisma.logisticsAppointment.create({
    data: {
      title: "Beton Döküm Randevusu",
      supplier: "Oyak Beton",
      type: "DELIVERY",
      appointmentDate: new Date("2024-04-15T09:00:00"),
      status: "SCHEDULED",
      notes: "15 mikser beton dökümü",
      projectId: vadiEvleri.id
    }
  })

  await prisma.logisticsAppointment.create({
    data: {
      title: "Demir Teslimatı",
      supplier: "Yıldız Demir",
      type: "DELIVERY",
      appointmentDate: new Date("2024-04-16T10:00:00"),
      status: "SCHEDULED",
      notes: "50 ton donatı çeliği",
      projectId: nexaPlaza.id
    }
  })

  await prisma.logisticsAppointment.create({
    data: {
      title: "Atık Malzeme Toplama",
      supplier: "Çevre Temizlik",
      type: "PICKUP",
      appointmentDate: new Date("2024-04-17T14:00:00"),
      status: "SCHEDULED",
      notes: "Şantiye atıklarının toplanması",
      projectId: iskenderun.id
    }
  })

  console.log(" Created 3 logistics appointments")

  // ============================================================================
  // LOGISTICS SCHEDULE (Lojistik & Randevu Ağı Panel Kayıtları)
  // ============================================================================
  console.log(" Creating logistics schedules...")
  await prisma.logisticsSchedule.deleteMany({
    where: {
      title: {
        in: [
          "Bina A - 3. Kat - Geniş Alan (Malzeme Teslimatı)",
          "C35/45 Hazır Beton Dökümü - Temel A Blok",
          "Kalıp & İskele Güvenlik Denetimi",
        ],
      },
    },
  }).catch(() => {})

  const schedNow = new Date()
  const sched1430 = new Date(schedNow)
  sched1430.setHours(14, 30, 0, 0)

  const sched0900 = new Date(schedNow)
  sched0900.setHours(9, 0, 0, 0)

  const sched1600 = new Date(schedNow)
  sched1600.setHours(16, 0, 0, 0)

  await prisma.logisticsSchedule.create({
    data: {
      title: "Bina A - 3. Kat - Geniş Alan (Malzeme Teslimatı)",
      type: "MALZEME_TESLİMAT",
      location: "Bina A - 3. Kat - Geniş Alan",
      supplierName: "Yıldız Çelik & Yapı Market",
      driverContact: "+90 532 555 1020 (Ahmet Yılmaz)",
      status: "IN_TRANSIT",
      scheduledAt: sched1430,
      notes: "Kuru duvar profilleri, alçıpan levhalar ve şantiye içi malzeme teslimatı",
      projectId: vadiEvleri.id,
    },
  })

  await prisma.logisticsSchedule.create({
    data: {
      title: "C35/45 Hazır Beton Dökümü - Temel A Blok",
      type: "BETON",
      location: "A Blok Temel Kazısı",
      supplierName: "Oyak Beton A.Ş.",
      driverContact: "+90 533 444 8899 (Mehmet Demir)",
      status: "PLANNED",
      scheduledAt: sched0900,
      notes: "15 mikser C35/45 hazır beton dökümü ve transmikser pompa kontrolü",
      projectId: vadiEvleri.id,
    },
  })

  await prisma.logisticsSchedule.create({
    data: {
      title: "Kalıp & İskele Güvenlik Denetimi",
      type: "DENETİM",
      location: "B Blok Dış Cephe İskelesi",
      supplierName: "Nexa İSG & Denetim Birimi",
      driverContact: "+90 535 777 2211 (Ayşe Kaya)",
      status: "DELIVERED",
      scheduledAt: sched1600,
      notes: "Dış cephe güvenlik ağları ve ankraj kontrolü tamamlandı",
      projectId: vadiEvleri.id,
    },
  })

  console.log(" Created 3 logistics schedules (including Bina A 3. Kat)")

  // ============================================================================
  // KURUMSAL HİYERARŞİK MOCK DATA (TÜRKİYE İNŞAAT SEKTÖRÜ SAHTE VERİ SENARYOSU)
  // ============================================================================
  await seedHierarchicalMockData(prisma)

  console.log(" Seed completed successfully!")
  console.log(" Summary:")
  console.log("   - 5 Companies (2 Main, 3 Subcontractors)")
  console.log("   - 6 Users (Demo + Patron + Denetçi + Kontrol + Additional)")
  console.log("   - 6 Personnel Records")
  console.log("   - 3 ERP Projects (Vadi Evleri, Nexa Plaza, İskenderun)")
  console.log("   - 3 YİBF Projects (LOW, MEDIUM, HIGH Risk)")
  console.log("   - 6 Inspection Records")
  console.log("   - 5 Deficiencies")
  console.log("   - 7 YİBF Events")
  console.log("   - 3 Subcontractor Contracts")
  console.log("   - 3 Progress Billings")
  console.log("   - 3 Deductions")
  console.log("   - ~90 Attendance Records (30 days x 3 personnel)")
  console.log("   - 5 Finance Transactions")
  console.log("   - 3 Stock Items")
  console.log("   - 4 AI Analysis Records")
  console.log("   - 4 İSG Reports")
  console.log("   - 4 Work Orders")
  console.log("   - 8 Shifts (Vardiyalar)")
  console.log("   - 3 Drone Analyses")
  console.log("   - 3 Lab Documents")
  console.log("   - 3 Rebar Formwork Checks")
  console.log("   - 3 Attachments")
  console.log("   - 3 License Archives")
  console.log("   - 3 Digital Archives")
  console.log("   - 3 OCR Documents")
  console.log("   - 3 AI Image Analyses")
  console.log("   - 3 Project Revisions")
  console.log("   - 3 Digital Drawings")
  console.log("   - 3 Audit Records")
  console.log("   - 3 Material Approvals")
  console.log("   - 3 Nonconformity DOFs")
  console.log("   - 3 Legal Certificates")
  console.log("   - 3 Near Misses")
  console.log("   - 3 PPE Assignments")
  console.log("   - 3 Logistics Appointments")
  console.log("   - CMS Content (About, Services, Projects)")
  console.log("   - 3 Contract Templates")

  console.log("\n")
  console.log("════════════════════════════════════════════════════════════════")
  console.log("          DEMO KULLANICI GİRİŞ BİLGİLERİ (DEMO CREDENTIALS)     ")
  console.log("════════════════════════════════════════════════════════════════")
  console.log("\n")
  console.log("👑  ADMIN (PATRON):")
  console.log("   E-posta: admin@nexa.com | Şifre: demo123 | Rol: ADMIN")
  console.log("\n")
  console.log("📦  SATINALMA / LOJİSTİK MÜDÜRÜ:")
  console.log("   E-posta: lojistik@nexa.com | Şifre: demo123 | Rol: PROCUREMENT_MANAGER")
  console.log("\n")
  console.log("🏗️  PROJE KOORDİNATÖRÜ (ÜST ONAY):")
  console.log("   E-posta: koordinator@nexa.com | Şifre: demo123 | Rol: PROJECT_MANAGER")
  console.log("\n")
  console.log("📋  ŞANTİYE ŞEFİ (ORTA ONAY):")
  console.log("   E-posta: sef@nexa.com | Şifre: demo123 | Rol: SITE_MANAGER")
  console.log("\n")
  console.log("📐  SAHA MÜHENDİSİ (İŞLEMİ BAŞLATAN):")
  console.log("   E-posta: muhendis@nexa.com | Şifre: demo123 | Rol: ENGINEER")
  console.log("\n")
  console.log("🚚  KAMYON ŞOFÖRÜ:")
  console.log("   E-posta: sofor@nexa.com | Şifre: demo123 | Rol: DRIVER")
  console.log("\n")
  console.log("👥  İK MÜDÜRÜ:")
  console.log("   E-posta: ik@nexa.com | Şifre: demo123 | Rol: HR_MANAGER")
  console.log("\n")
  console.log("💰  FİNANS MÜDÜRÜ:")
  console.log("   E-posta: finans@nexa.com | Şifre: demo123 | Rol: FINANCE_MANAGER")
  console.log("\n")
  console.log("🏛️  YAPI DENETİM PATRONU:")
  console.log("   E-posta: denetim@nexa.com | Şifre: demo123 | Rol: INSPECTION_ADMIN")
  console.log("\n")
  console.log("🔍  SAHA YAPI DENETİMCİSİ:")
  console.log("   E-posta: denetci@nexa.com | Şifre: demo123 | Rol: INSPECTOR")
  console.log("\n")
  console.log("👷  SAHA PERSONELİ:")
  console.log("   E-posta: personel@nexa.com | Şifre: demo123 | Rol: STAFF")
  console.log("\n")
  console.log("════════════════════════════════════════════════════════════════")
}

// ==============================================================================
// BÖLÜM 2: GELİŞMİŞ TÜRKİYE İNŞAAT SEKTÖRÜ MOCK DATA GENERATOR (50 PERSONEL, BOQ, BIM, HAKEDİŞ)
// ==============================================================================
async function seedHierarchicalMockData(prisma: PrismaClient) {
  console.log("\n🚀 [MOCK DATA] Kapsamlı Kurumsal Türkiye İnşaat Sektörü Mock Data Üretimi Başlıyor...")

  const demoPassword = await bcrypt.hash("123456", 10)

  // ----------------------------------------------------------------------------
  // A. ORGANİZASYON VE ŞİRKETLER (COMPANY & SUBCONTRACTOR)
  // ----------------------------------------------------------------------------
  console.log("🏢 [MOCK DATA] A. Organizasyon ve Şirketler (1 Ana Yüklenici, 3 Taşeron, 1 Yapı Denetim) oluşturuluyor...")

  // 1 Ana Yüklenici
  const mainContractor = await prisma.company.upsert({
    where: { id: "comp-nexa-main" },
    update: {
      name: "Nexa Yapı A.Ş.",
      type: CompanyType.MAIN_CONTRACTOR,
      contactName: "Umut Erdoğan",
      phone: "+90 505 147 77 29",
      email: "nxglobalinfo@gmail.com",
      taxNumber: "8820491023",
      taxOffice: "İskenderun Vergi Dairesi"
    },
    create: {
      id: "comp-nexa-main",
      name: "Nexa Yapı A.Ş.",
      type: CompanyType.MAIN_CONTRACTOR,
      contactName: "Umut Erdoğan",
      phone: "+90 505 147 77 29",
      email: "nxglobalinfo@gmail.com",
      taxNumber: "8820491023",
      taxOffice: "İskenderun Vergi Dairesi"
    }
  })

  // 3 Taşeron Firma
  const subDemirtas = await prisma.company.upsert({
    where: { id: "comp-sub-demirtas" },
    update: {
      name: "Demirtaş Çelik Sistemleri",
      type: CompanyType.SUBCONTRACTOR,
      contactName: "Kemal Demirtaş",
      phone: "+90 326 614 20 40",
      email: "info@demirtascelik.com.tr",
      taxNumber: "2840192841",
      taxOffice: "İskenderun Vergi Dairesi"
    },
    create: {
      id: "comp-sub-demirtas",
      name: "Demirtaş Çelik Sistemleri",
      type: CompanyType.SUBCONTRACTOR,
      contactName: "Kemal Demirtaş",
      phone: "+90 326 614 20 40",
      email: "info@demirtascelik.com.tr",
      taxNumber: "2840192841",
      taxOffice: "İskenderun Vergi Dairesi"
    }
  })

  const subZirve = await prisma.company.upsert({
    where: { id: "comp-sub-zirve" },
    update: {
      name: "Zirve Beton Döküm",
      type: CompanyType.SUBCONTRACTOR,
      contactName: "Murat Zirveoğlu",
      phone: "+90 312 440 80 90",
      email: "siparis@zirvebeton.com.tr",
      taxNumber: "9182374610",
      taxOffice: "Ostim Vergi Dairesi"
    },
    create: {
      id: "comp-sub-zirve",
      name: "Zirve Beton Döküm",
      type: CompanyType.SUBCONTRACTOR,
      contactName: "Murat Zirveoğlu",
      phone: "+90 312 440 80 90",
      email: "siparis@zirvebeton.com.tr",
      taxNumber: "9182374610",
      taxOffice: "Ostim Vergi Dairesi"
    }
  })

  const subAkim = await prisma.company.upsert({
    where: { id: "comp-sub-akim" },
    update: {
      name: "Akım Elektrik",
      type: CompanyType.SUBCONTRACTOR,
      contactName: "Fikret Akımcı",
      phone: "+90 326 617 55 33",
      email: "destek@akimelektrik.com",
      taxNumber: "3819284712",
      taxOffice: "Sahil Vergi Dairesi"
    },
    create: {
      id: "comp-sub-akim",
      name: "Akım Elektrik",
      type: CompanyType.SUBCONTRACTOR,
      contactName: "Fikret Akımcı",
      phone: "+90 326 617 55 33",
      email: "destek@akimelektrik.com",
      taxNumber: "3819284712",
      taxOffice: "Sahil Vergi Dairesi"
    }
  })

  // 1 Yapı Denetim Firması
  const inspCompany = await prisma.company.upsert({
    where: { id: "comp-insp-guven" },
    update: {
      name: "Güven-Yapı Denetim A.Ş.",
      type: CompanyType.INSPECTION,
      contactName: "Mimar Selim Güvenç",
      phone: "+90 326 618 90 90",
      email: "hatay@guvenyapidenetim.com.tr",
      taxNumber: "4591029384",
      taxOffice: "Antakya Vergi Dairesi"
    },
    create: {
      id: "comp-insp-guven",
      name: "Güven-Yapı Denetim A.Ş.",
      type: CompanyType.INSPECTION,
      contactName: "Mimar Selim Güvenç",
      phone: "+90 326 618 90 90",
      email: "hatay@guvenyapidenetim.com.tr",
      taxNumber: "4591029384",
      taxOffice: "Antakya Vergi Dairesi"
    }
  })

  // Subcontractor tablosu uyumluluğu
  await prisma.subcontractor.upsert({
    where: { id: "sub-demirtas" },
    update: { name: "Demirtaş Çelik Sistemleri", contactName: "Kemal Demirtaş", phone: "+90 326 614 20 40", taxNumber: "2840192841" },
    create: { id: "sub-demirtas", name: "Demirtaş Çelik Sistemleri", contactName: "Kemal Demirtaş", phone: "+90 326 614 20 40", taxNumber: "2840192841" }
  })
  await prisma.subcontractor.upsert({
    where: { id: "sub-zirve" },
    update: { name: "Zirve Beton Döküm", contactName: "Murat Zirveoğlu", phone: "+90 312 440 80 90", taxNumber: "9182374610" },
    create: { id: "sub-zirve", name: "Zirve Beton Döküm", contactName: "Murat Zirveoğlu", phone: "+90 312 440 80 90", taxNumber: "9182374610" }
  })
  await prisma.subcontractor.upsert({
    where: { id: "sub-akim" },
    update: { name: "Akım Elektrik", contactName: "Fikret Akımcı", phone: "+90 326 617 55 33", taxNumber: "3819284712" },
    create: { id: "sub-akim", name: "Akım Elektrik", contactName: "Fikret Akımcı", phone: "+90 326 617 55 33", taxNumber: "3819284712" }
  })

  // ----------------------------------------------------------------------------
  // B. PROJELER VE HARİTA (PROJECT & SITEZONE)
  // ----------------------------------------------------------------------------
  console.log("🏗️ [MOCK DATA] B. Projeler ve Harita (2 Devasa Proje + SiteZone) oluşturuluyor...")

  const projVadi = await prisma.project.upsert({
    where: { id: "proj-vadi-iskenderun" },
    update: {
      name: "Vadi Konutları (İskenderun)",
      title: "Vadi Konutları (İskenderun)",
      description: "İskenderun Sahil Vadi Konutları ve Ticari Yaşam Alanı",
      status: "SAHA",
      category: "Konut ve Ticari",
      city: "Hatay",
      district: "İskenderun",
      yibfNo: "YİBF-HAT-2024-001",
      progress: 68,
      latitude: 36.5784,
      longitude: 36.1732,
      gpsRadius: 450,
      contractValue: 185000000,
      companyId: mainContractor.id
    },
    create: {
      id: "proj-vadi-iskenderun",
      name: "Vadi Konutları (İskenderun)",
      title: "Vadi Konutları (İskenderun)",
      description: "İskenderun Sahil Vadi Konutları ve Ticari Yaşam Alanı",
      status: "SAHA",
      category: "Konut ve Ticari",
      city: "Hatay",
      district: "İskenderun",
      yibfNo: "YİBF-HAT-2024-001",
      progress: 68,
      latitude: 36.5784,
      longitude: 36.1732,
      gpsRadius: 450,
      contractValue: 185000000,
      companyId: mainContractor.id
    }
  })

  const projNexa = await prisma.project.upsert({
    where: { id: "proj-nexa-ankara" },
    update: {
      name: "Nexa Plaza (Ankara)",
      title: "Nexa Plaza (Ankara)",
      description: "A+ Karma Ofis ve Alışveriş Kulesi",
      status: "SAHA",
      category: "Ticari",
      city: "Ankara",
      district: "Çankaya",
      yibfNo: "YİBF-ANK-2024-002",
      progress: 42,
      latitude: 39.9042,
      longitude: 32.8258,
      gpsRadius: 350,
      contractValue: 320000000,
      companyId: mainContractor.id
    },
    create: {
      id: "proj-nexa-ankara",
      name: "Nexa Plaza (Ankara)",
      title: "Nexa Plaza (Ankara)",
      description: "A+ Karma Ofis ve Alışveriş Kulesi",
      status: "SAHA",
      category: "Ticari",
      city: "Ankara",
      district: "Çankaya",
      yibfNo: "YİBF-ANK-2024-002",
      progress: 42,
      latitude: 39.9042,
      longitude: 32.8258,
      gpsRadius: 350,
      contractValue: 320000000,
      companyId: mainContractor.id
    }
  })

  // SiteZones
  const zoneVadiA = await prisma.siteZone.upsert({
    where: { id: "zone-vadi-a-blok" },
    update: { title: "A Blok Şantiye", category: "BUILDING", latitude: 36.5784, longitude: 36.1732, radius: 45 },
    create: { id: "zone-vadi-a-blok", title: "A Blok Şantiye", category: "BUILDING", latitude: 36.5784, longitude: 36.1732, radius: 45, projectId: projVadi.id }
  })
  const zoneVadiB = await prisma.siteZone.upsert({
    where: { id: "zone-vadi-b-blok" },
    update: { title: "B Blok Şantiye", category: "BUILDING", latitude: 36.5788, longitude: 36.1736, radius: 40 },
    create: { id: "zone-vadi-b-blok", title: "B Blok Şantiye", category: "BUILDING", latitude: 36.5788, longitude: 36.1736, radius: 40, projectId: projVadi.id }
  })
  const zoneVadiDemir = await prisma.siteZone.upsert({
    where: { id: "zone-vadi-demir" },
    update: { title: "Demir Atölyesi", category: "STORAGE", latitude: 36.5780, longitude: 36.1728, radius: 30 },
    create: { id: "zone-vadi-demir", title: "Demir Atölyesi", category: "STORAGE", latitude: 36.5780, longitude: 36.1728, radius: 30, projectId: projVadi.id }
  })
  const zoneVadiVinc = await prisma.siteZone.upsert({
    where: { id: "zone-vadi-vinc" },
    update: { title: "Kule Vinç Altı", category: "RISK", latitude: 36.5785, longitude: 36.1734, radius: 25 },
    create: { id: "zone-vadi-vinc", title: "Kule Vinç Altı", category: "RISK", latitude: 36.5785, longitude: 36.1734, radius: 25, projectId: projVadi.id }
  })
  await prisma.siteZone.upsert({
    where: { id: "zone-vadi-yemekhane" },
    update: { title: "Prefabrik Yemekhane & Sosyal Tesis", category: "REST_AREA", latitude: 36.5778, longitude: 36.1725, radius: 35 },
    create: { id: "zone-vadi-yemekhane", title: "Prefabrik Yemekhane & Sosyal Tesis", category: "REST_AREA", latitude: 36.5778, longitude: 36.1725, radius: 35, projectId: projVadi.id }
  })

  await prisma.siteZone.upsert({
    where: { id: "zone-nexa-kazi" },
    update: { title: "Podium Kazı Alanı", category: "RISK", latitude: 39.9042, longitude: 32.8258, radius: 50 },
    create: { id: "zone-nexa-kazi", title: "Podium Kazı Alanı", category: "RISK", latitude: 39.9042, longitude: 32.8258, radius: 50, projectId: projNexa.id }
  })
  await prisma.siteZone.upsert({
    where: { id: "zone-nexa-cekerdek" },
    update: { title: "Kule Çekirdeği", category: "BUILDING", latitude: 39.9045, longitude: 32.8260, radius: 30 },
    create: { id: "zone-nexa-cekerdek", title: "Kule Çekirdeği", category: "BUILDING", latitude: 39.9045, longitude: 32.8260, radius: 30, projectId: projNexa.id }
  })
  await prisma.siteZone.upsert({
    where: { id: "zone-nexa-depo" },
    update: { title: "Malzeme Deposu", category: "STORAGE", latitude: 39.9038, longitude: 32.8252, radius: 40 },
    create: { id: "zone-nexa-depo", title: "Malzeme Deposu", category: "STORAGE", latitude: 39.9038, longitude: 32.8252, radius: 40, projectId: projNexa.id }
  })

  // ----------------------------------------------------------------------------
  // C. PERSONEL VE İK (50 GERÇEKÇİ PERSONEL, KULLANICILAR VE PUANTAJ)
  // ----------------------------------------------------------------------------
  console.log("👷 [MOCK DATA] C. Personel ve İK (50 Gerçekçi Personel, Roller ve 30 Günlük Puantaj) üretiliyor...")

  const turkishFirstNames = [
    "Ahmet", "Mehmet", "Mustafa", "Ali", "Hüseyin", "Hasan", "İbrahim", "İsmail", "Osman", "Ömer",
    "Yusuf", "Halil", "Süleyman", "Murat", "Ramazan", "Mahmut", "Salih", "Fatih", "Recep", "Metin",
    "Ayşe", "Fatma", "Emine", "Hatice", "Zeynep", "Elif", "Merve", "Büşra", "Zehra", "Sultan",
    "Gökhan", "Serkan", "Hakan", "Tolga", "Cem", "Burak", "Onur", "Volkan", "Deniz", "Eren",
    "Kadir", "Tarkan", "Barış", "Selim", "Ufuk", "Levent", "Yasin", "Tarık", "Batuhan", "Doğukan"
  ]
  const turkishLastNames = [
    "Yılmaz", "Kaya", "Demir", "Çelik", "Şahin", "Yıldız", "Yıldırım", "Öztürk", "Aydın", "Özdemir",
    "Arslan", "Doğan", "Kılıç", "Aslan", "Çetin", "Kara", "Koç", "Kurt", "Özkan", "Şimşek",
    "Polat", "Özcan", "Korkmaz", "Çakır", "Erdoğan", "Yavuz", "Güneş", "Bozkurt", "Ünal", "Acar"
  ]

  const seededPersonnelList: any[] = []

  for (let i = 1; i <= 50; i++) {
    const fn = turkishFirstNames[(i - 1) % turkishFirstNames.length]
    const ln = turkishLastNames[(i * 3) % turkishLastNames.length]
    const fullName = `${fn} ${ln}`
    const pNo = `MCK-P${i < 10 ? "00" + i : (i < 100 ? "0" + i : i)}`
    const tcNo = `${Math.floor(10000000000 + i * 1482937)}`.slice(0, 11)
    const phone = `+90 53${Math.floor(10 + (i % 80))} ${Math.floor(100 + i * 7)} ${Math.floor(10 + (i % 89))} ${Math.floor(10 + (i % 79))}`
    const email = `personel.${i}.${fn.toLowerCase()}.${ln.toLowerCase()}@nexa.com.tr`

    let role: UserRole = UserRole.WORKER
    let position = "Kalıpçı Ustası"
    let department = "Kaba Yapı"
    let assignedCompany = subZirve
    let assignedProject = projVadi
    let dailyRate = 1800
    let monthlySalary = 45000

    if (i <= 2) {
      role = UserRole.ADMIN
      position = "Proje Müdürü"
      department = "Proje Yönetimi"
      assignedCompany = mainContractor
      assignedProject = i === 1 ? projVadi : projNexa
      dailyRate = 4500
      monthlySalary = 110000
    } else if (i <= 7) {
      role = UserRole.ADMIN
      position = "Şantiye Şefi (İnşaat Müh.)"
      department = "Saha Yönetimi"
      assignedCompany = mainContractor
      assignedProject = i % 2 === 0 ? projVadi : projNexa
      dailyRate = 3200
      monthlySalary = 80000
    } else if (i <= 10) {
      role = UserRole.ENGINEER
      position = "A Sınıfı İSG Uzmanı"
      department = "İş Sağlığı ve Güvenliği"
      assignedCompany = i === 10 ? inspCompany : mainContractor
      assignedProject = i % 2 === 0 ? projVadi : projNexa
      dailyRate = 2800
      monthlySalary = 70000
    } else {
      role = UserRole.WORKER
      const workerTypes = [
        { prof: "Kalıpçı Ustası", dept: "Kaba Yapı", comp: subZirve, rate: 1950, sal: 48000 },
        { prof: "Demir Bağlama Ustası", dept: "Donatı İmalatı", comp: subDemirtas, rate: 1900, sal: 47000 },
        { prof: "Gazaltı Kaynakçısı", dept: "Çelik Atölyesi", comp: subDemirtas, rate: 2200, sal: 55000 },
        { prof: "Kule Vinç Operatörü", dept: "Ağır Ekipman", comp: mainContractor, rate: 2600, sal: 65000 },
        { prof: "Beton Pompası Operatörü", dept: "Beton Santrali", comp: subZirve, rate: 2100, sal: 52000 },
        { prof: "Elektrik Teknikeri", dept: "Kuvvetli Akım", comp: subAkim, rate: 2000, sal: 50000 },
        { prof: "Pano Montaj Ustası", dept: "Zayıf Akım", comp: subAkim, rate: 2100, sal: 52000 },
        { prof: "Alçı ve Sıva Ustası", dept: "İnce İşler", comp: subZirve, rate: 1800, sal: 45000 },
        { prof: "Dış Cephe İskele Ustası", dept: "Cephe İmalatı", comp: subDemirtas, rate: 2300, sal: 58000 },
        { prof: "Saha Formeni", dept: "Saha Yönetimi", comp: mainContractor, rate: 2500, sal: 62000 }
      ]
      const chosen = workerTypes[i % workerTypes.length]
      position = chosen.prof
      department = chosen.dept
      assignedCompany = chosen.comp
      assignedProject = i % 3 === 0 ? projNexa : projVadi
      dailyRate = chosen.rate
      monthlySalary = chosen.sal
    }

    const seededUser = await prisma.user.upsert({
      where: { email },
      update: {
        name: fullName,
        role,
        companyType: assignedCompany.type
      },
      create: {
        email,
        password: demoPassword,
        name: fullName,
        role,
        companyType: assignedCompany.type,
        permissions: role === UserRole.ADMIN ? ["all"] : ["dashboard", "tasks", "attendance"]
      }
    })

    const seededPersonel = await prisma.personel.upsert({
      where: { personnelNo: pNo },
      update: {
        name: fullName,
        phone,
        email,
        department,
        position,
        currentSite: assignedProject.name || assignedProject.title || "Vadi Evleri Projesi",
        gunlukYevmiye: dailyRate,
        salary: monthlySalary,
        status: PersonelStatus.ACTIVE,
        companyId: assignedCompany.id,
        userId: seededUser.id
      },
      create: {
        personnelNo: pNo,
        tcNo,
        name: fullName,
        phone,
        email,
        age: 26 + (i % 30),
        birthDate: new Date(1982 + (i % 20), (i % 12), 10),
        gender: i % 7 === 0 ? Gender.FEMALE : Gender.MALE,
        department,
        position,
        currentSite: assignedProject.name || assignedProject.title || "Vadi Evleri Projesi",
        hireDate: new Date("2023-01-15"),
        employmentType: i <= 10 ? EmploymentType.OFFICER : EmploymentType.WORKER,
        status: PersonelStatus.ACTIVE,
        gunlukYevmiye: dailyRate,
        salary: monthlySalary,
        companyId: assignedCompany.id,
        userId: seededUser.id
      }
    })

    seededPersonnelList.push({ personel: seededPersonel, user: seededUser, project: assignedProject })
  }

  // Son 30 günlük Puantaj kayıtları (İşçiler için)
  console.log("⏱️ [MOCK DATA] Son 30 günlük Puantaj (Giriş/Çıkış ve Mesai) kayıtları yazılıyor...")
  const attendanceWorkers = seededPersonnelList.filter(p => p.personel.gunlukYevmiye < 3000).slice(0, 35)
  const now = new Date()

  for (let dayOffset = 1; dayOffset <= 30; dayOffset++) {
    const recordDate = new Date(now.getTime() - dayOffset * 24 * 60 * 60 * 1000)
    // Pazar günlerini atla
    if (recordDate.getDay() === 0) continue

    for (const worker of attendanceWorkers) {
      const isLate = Math.random() < 0.12
      const isOvertime = Math.random() < 0.28
      const hasOvertimeHours = isOvertime ? Math.floor(Math.random() * 3) + 1 : 0

      const checkInHour = isLate ? 8 : 7
      const checkInMin = isLate ? Math.floor(Math.random() * 35) + 10 : Math.floor(Math.random() * 25) + 40
      const checkOutHour = 17 + hasOvertimeHours
      const checkOutMin = Math.floor(Math.random() * 30)

      const checkInTime = new Date(recordDate)
      checkInTime.setHours(checkInHour, checkInMin, 0, 0)

      const checkOutTime = new Date(recordDate)
      checkOutTime.setHours(checkOutHour, checkOutMin, 0, 0)

      await prisma.attendanceRecord.create({
        data: {
          personelId: worker.personel.id,
          projectId: worker.project.id,
          date: recordDate,
          checkIn: checkInTime,
          checkOut: checkOutTime,
          status: isLate ? "LATE" : "PRESENT",
          dayMultiplier: 1,
          overtimeHours: hasOvertimeHours,
          workerName: worker.personel.name
        }
      })
    }
  }

  // ----------------------------------------------------------------------------
  // D. İHALE, METRAJ VE 5D BIM (50 POZ & 20 BIM KUSURU)
  // ----------------------------------------------------------------------------
  console.log("📐 [MOCK DATA] D. İhale, Metraj ve 5D BIM (50 Poz ve 20 3D BIM Kusuru) oluşturuluyor...")

  const boqPozTemplates = [
    { name: "C30/37 Hazır Beton Dökümü (Kalıp İçi)", unit: "m3", unitPrice: 2850, baseQty: 1200, cat: "statik" },
    { name: "S420 Nervürlü Donatı Çeliği Temini ve İşçiliği", unit: "ton", unitPrice: 32500, baseQty: 85, cat: "statik" },
    { name: "Endüstriyel Çelik Perde ve Kolon Kalıbı Montajı", unit: "m2", unitPrice: 480, baseQty: 3400, cat: "statik" },
    { name: "Tünel Kalıp Sistemi Kurulumu ve Sökümü", unit: "m2", unitPrice: 620, baseQty: 2500, cat: "statik" },
    { name: "20 cm Gazbeton Duvar İmalatı (Harçlı)", unit: "m2", unitPrice: 420, baseQty: 1800, cat: "mimari" },
    { name: "15 cm Delikli Bims Blok Duvar Örülmesi", unit: "m2", unitPrice: 360, baseQty: 2200, cat: "mimari" },
    { name: "Çimento Esaslı Kaba ve İnce Sıva İmalatı", unit: "m2", unitPrice: 290, baseQty: 4500, cat: "mimari" },
    { name: "Alçıpan Asma Tavan (Akustik Taşyünü Takviyeli)", unit: "m2", unitPrice: 550, baseQty: 1600, cat: "mimari" },
    { name: "Taş Yünü Isı Yalıtım Levhalı Dış Mantolama (5 cm)", unit: "m2", unitPrice: 780, baseQty: 3200, cat: "mimari" },
    { name: "Silikon Giydirme Cam Cephe Alüminyum İmalatı", unit: "m2", unitPrice: 4200, baseQty: 650, cat: "mimari" },
    { name: "Seramik Kaplama (60x120 Porselen Granit)", unit: "m2", unitPrice: 680, baseQty: 1400, cat: "mimari" },
    { name: "Lamine Parke Zemin İmalatı (32. Sınıf)", unit: "m2", unitPrice: 520, baseQty: 2100, cat: "mimari" },
    { name: "Yangın Merdiveni ve Çelik Konstrüksiyon Fabrikasyonu", unit: "kg", unitPrice: 85, baseQty: 18000, cat: "statik" },
    { name: "Kuvvetli Akım Kablolama (Halogen-Free 3x2.5)", unit: "mt", unitPrice: 68, baseQty: 12000, cat: "elektrik" },
    { name: "Ana Dağıtım ve Kat Tali Elektrik Panoları", unit: "adet", unitPrice: 18500, baseQty: 14, cat: "elektrik" },
    { name: "Sığınak ve Yangın Duman Tahliye Fanları", unit: "adet", unitPrice: 34000, baseQty: 6, cat: "mekanik" },
    { name: "Yangın Springler Islak Borulu Söndürme Hattı", unit: "mt", unitPrice: 310, baseQty: 2800, cat: "mekanik" },
    { name: "Polipropilen (PPRC) Temiz Su Tesisatı Döşenmesi", unit: "mt", unitPrice: 140, baseQty: 3500, cat: "mekanik" },
    { name: "Sessiz Atık Su Borusu (PVC Dikey İniş Kolonları)", unit: "mt", unitPrice: 240, baseQty: 1900, cat: "mekanik" },
    { name: "Su Deposu ve Frekans Konvertörlü Hidrofor Grubu", unit: "takım", unitPrice: 125000, baseQty: 2, cat: "mekanik" },
    { name: "Temel Altı SBS Modifiye Bitümlü Çift Kat Su Yalıtımı", unit: "m2", unitPrice: 460, baseQty: 3800, cat: "mimari" },
    { name: "Teras Çatı Poliüretan Esaslı UV Dayanımlı İzolasyon", unit: "m2", unitPrice: 580, baseQty: 1250, cat: "mimari" },
    { name: "İkili Split VRF Klima Dış/İç Ünite Bakır Borulaması", unit: "hat", unitPrice: 16500, baseQty: 28, cat: "mekanik" },
    { name: "Sedye ve İtfaiyeci Asansörü 1000 kg 1.6 m/sn", unit: "durak", unitPrice: 48000, baseQty: 14, cat: "mekanik" },
    { name: "Otopark Trafik Çizgileri ve Epoksi Zemin Kaplaması", unit: "m2", unitPrice: 490, baseQty: 2800, cat: "mimari" }
  ]

  for (let i = 1; i <= 50; i++) {
    const tmpl = boqPozTemplates[(i - 1) % boqPozTemplates.length]
    const proj = i % 2 === 0 ? projNexa : projVadi
    const pozCode = `POZ-2024-${i < 10 ? "0" + i : i}`
    const qtyMultiplier = 1 + (i % 4) * 0.35
    const plannedQty = Math.round(tmpl.baseQty * qtyMultiplier)
    const completedQty = Math.round(plannedQty * ((20 + (i % 70)) / 100))
    const totalBudget = plannedQty * tmpl.unitPrice

    await prisma.workPackage.upsert({
      where: { id: `wp-poz-${i}` },
      update: {
        code: pozCode,
        pozNo: `15.${100 + i}.200`,
        name: `${tmpl.name} (Bölge ${((i % 5) + 1)})`,
        categoryKey: tmpl.cat,
        unit: tmpl.unit,
        unitPrice: tmpl.unitPrice,
        plannedQuantity: plannedQty,
        completedQuantity: completedQty,
        totalBudget,
        status: completedQty >= plannedQty ? "COMPLETED" : "IN_PROGRESS",
        projectId: proj.id
      },
      create: {
        id: `wp-poz-${i}`,
        code: pozCode,
        pozNo: `15.${100 + i}.200`,
        name: `${tmpl.name} (Bölge ${((i % 5) + 1)})`,
        categoryKey: tmpl.cat,
        unit: tmpl.unit,
        unitPrice: tmpl.unitPrice,
        plannedQuantity: plannedQty,
        completedQuantity: completedQty,
        totalBudget,
        status: completedQty >= plannedQty ? "COMPLETED" : "IN_PROGRESS",
        projectId: proj.id
      }
    })
  }

  // ----------------------------------------------------------------------------
  // E. FİNANS VE TAŞERON HAKEDİŞLERİ (CONTRACT & PROGRESSPAYMENT + CEZA BLOKESİ)
  // ----------------------------------------------------------------------------
  console.log("💰 [MOCK DATA] E. Finans ve Taşeron Hakedişleri (En az 5M TL Sözleşmeler ve 2 BLOKELİ Hakediş) oluşturuluyor...")

  // Sözleşmeler (Contract model: totalAmount, startDate, endDate, status)
  const contractDemirtas = await prisma.contract.upsert({
    where: { id: "cnt-demirtas-2024" },
    update: {
      title: "Vadi Konutları Çelik ve Donatı İmalatı Taşeron Sözleşmesi",
      subcontractorId: subDemirtas.id,
      projectId: projVadi.id,
      totalAmount: 18500000,
      status: ContractStatus.ACTIVE,
      startDate: new Date("2024-01-10"),
      endDate: new Date("2024-12-31")
    },
    create: {
      id: "cnt-demirtas-2024",
      title: "Vadi Konutları Çelik ve Donatı İmalatı Taşeron Sözleşmesi",
      subcontractorId: subDemirtas.id,
      projectId: projVadi.id,
      totalAmount: 18500000,
      status: ContractStatus.ACTIVE,
      startDate: new Date("2024-01-10"),
      endDate: new Date("2024-12-31")
    }
  })

  const contractZirve = await prisma.contract.upsert({
    where: { id: "cnt-zirve-2024" },
    update: {
      title: "Vadi Konutları ve Nexa Plaza Hazır Beton & Kalıp Döküm Sözleşmesi",
      subcontractorId: subZirve.id,
      projectId: projVadi.id,
      totalAmount: 24200000,
      status: ContractStatus.ACTIVE,
      startDate: new Date("2024-02-01"),
      endDate: new Date("2025-03-30")
    },
    create: {
      id: "cnt-zirve-2024",
      title: "Vadi Konutları ve Nexa Plaza Hazır Beton & Kalıp Döküm Sözleşmesi",
      subcontractorId: subZirve.id,
      projectId: projVadi.id,
      totalAmount: 24200000,
      status: ContractStatus.ACTIVE,
      startDate: new Date("2024-02-01"),
      endDate: new Date("2025-03-30")
    }
  })

  const contractAkim = await prisma.contract.upsert({
    where: { id: "cnt-akim-2024" },
    update: {
      title: "Nexa Plaza Alçak & Orta Gerilim Elektrik Altyapı Sözleşmesi",
      subcontractorId: subAkim.id,
      projectId: projNexa.id,
      totalAmount: 9000000,
      status: ContractStatus.ACTIVE,
      startDate: new Date("2024-03-15"),
      endDate: new Date("2024-11-30")
    },
    create: {
      id: "cnt-akim-2024",
      title: "Nexa Plaza Alçak & Orta Gerilim Elektrik Altyapı Sözleşmesi",
      subcontractorId: subAkim.id,
      projectId: projNexa.id,
      totalAmount: 9000000,
      status: ContractStatus.ACTIVE,
      startDate: new Date("2024-03-15"),
      endDate: new Date("2024-11-30")
    }
  })

  // 10 Adet Hakediş (2 Tanesi BLOCKED ve BIM Kusuruna Bağlı)
  const progressPaymentConfigs = [
    { id: "pay-demirtas-hakedis-1", title: "Ocak 2024 Donatı İmalatı Hakedişi No:1", cnt: contractDemirtas, subId: "sub-demirtas", qty: 45, unit: "ton", up: 32000, gross: 1440000, pen: 0, stat: "ODENDI", desc: "Ocak 2024 hakedişi eksiksiz ödendi." },
    { id: "pay-demirtas-hakedis-2", title: "Şubat 2024 Donatı İmalatı Hakedişi No:2", cnt: contractDemirtas, subId: "sub-demirtas", qty: 52, unit: "ton", up: 32000, gross: 1664000, pen: 0, stat: "ODENDI", desc: "Şubat ayı metraj teslimi yapıldı." },
    // KRİTİK BLOKE 1: BIM Kusuru (issue-bim-01) yüzünden sistemce otomatik bloke edildi!
    { 
      id: "pay-demirtas-hakedis-3", 
      title: "Mart 2024 Donatı ve Kalıp Hakedişi No:3", 
      cnt: contractDemirtas, 
      subId: "sub-demirtas",
      qty: 58, 
      unit: "ton", 
      up: 32000, 
      gross: 1856000, 
      pen: 65000, 
      stat: "BLOCKED", 
      desc: "⚠️ OTOMATİK KESİNTİ BLOKESİ: [BIM-REV-01] Kolon paspayı kusuru giderilmediği için sistem hakedişi bloke etti!" 
    },
    { id: "pay-demirtas-hakedis-4", title: "Nisan 2024 Donatı Hakedişi No:4", cnt: contractDemirtas, subId: "sub-demirtas", qty: 60, unit: "ton", up: 32000, gross: 1920000, pen: 0, stat: "PENDING", desc: "Nisan 2024 Donatı Hakedişi (Kontrol Mühendisi İncelemesinde)" },
    { id: "pay-zirve-hakedis-1", title: "Şubat 2024 C30 Beton Döküm Hakedişi No:1", cnt: contractZirve, subId: "sub-zirve", qty: 740, unit: "m3", up: 2850, gross: 2109000, pen: 0, stat: "ODENDI", desc: "Şubat 2024 C30 Beton Hakedişi tamamlandı." },
    { id: "pay-zirve-hakedis-2", title: "Mart 2024 C30 Beton Döküm Hakedişi No:2", cnt: contractZirve, subId: "sub-zirve", qty: 820, unit: "m3", up: 2850, gross: 2337000, pen: 0, stat: "ODENDI", desc: "Mart ayı dökümleri onaylandı." },
    { id: "pay-zirve-hakedis-3", title: "Nisan 2024 Beton Döküm Hakedişi No:3", cnt: contractZirve, subId: "sub-zirve", qty: 700, unit: "m3", up: 2850, gross: 1995000, pen: 0, stat: "APPROVED", desc: "Nisan ayı onaylandı, ödeme listesinde." },
    // KRİTİK BLOKE 2: Kiriş Segregasyon Kusuru (issue-bim-02) yüzünden BLOKE
    { 
      id: "pay-zirve-hakedis-4", 
      title: "Mayıs 2024 Beton ve Kalıp Döküm Hakedişi No:4", 
      cnt: contractZirve, 
      subId: "sub-zirve",
      qty: 850, 
      unit: "m3", 
      up: 2850, 
      gross: 2422500, 
      pen: 80000, 
      stat: "BLOCKED", 
      desc: "⚠️ OTOMATİK KESİNTİ BLOKESİ: [BIM-REV-02] Kiriş segregasyon ve bal peteği kusuru nedeniyle 80.000 TL ceza ve ödeme blokesi." 
    },
    { id: "pay-akim-hakedis-1", title: "Nisan 2024 Trafo ve Tava Hakedişi No:1", cnt: contractAkim, subId: "sub-akim", qty: 1, unit: "Adet", up: 1200000, gross: 1200000, pen: 0, stat: "ODENDI", desc: "Ana trafo montajı tamamlandı." },
    { id: "pay-akim-hakedis-2", title: "Mayıs 2024 Kablolama Hakedişi No:2", cnt: contractAkim, subId: "sub-akim", qty: 1, unit: "Adet", up: 1400000, gross: 1400000, pen: 0, stat: "PENDING", desc: "Mayıs 2024 Kablolama Hakedişi inceleniyor." }
  ]

  for (const p of progressPaymentConfigs) {
    const net = p.gross - p.pen
    await prisma.progressPayment.upsert({
      where: { id: p.id },
      update: {
        title: p.title,
        description: p.desc,
        quantity: p.qty,
        unit: p.unit,
        unitPrice: p.up,
        totalPrice: p.gross,
        amount: p.gross,
        penaltyDeduction: p.pen,
        netAmount: net,
        status: p.stat,
        subcontractorId: p.subId,
        projectId: p.cnt.projectId,
        contractId: p.cnt.id
      },
      create: {
        id: p.id,
        title: p.title,
        description: p.desc,
        quantity: p.qty,
        unit: p.unit,
        unitPrice: p.up,
        totalPrice: p.gross,
        amount: p.gross,
        penaltyDeduction: p.pen,
        netAmount: net,
        status: p.stat,
        subcontractorId: p.subId,
        projectId: p.cnt.projectId,
        contractId: p.cnt.id
      }
    })
  }

  // 20 Adet 3D BIM Kusuru (BimIssue)
  console.log("🧱 [MOCK DATA] 20 adet x,y,z koordinatlı 3D BIM kusuru (BimIssue) işleniyor...")

  const bimDefectTemplates = [
    { title: "A-104 Kolonunda paspayı yetersizliği ve donatı teması", desc: "Beton dökümü öncesi paspayı elemanları düşmüş, donatı kalıba temas ediyor.", sev: "CRITICAL", block: true, pen: 65000, payId: "pay-demirtas-hakedis-3", x: 12.45, y: 3.20, z: -4.15 },
    { title: "B-202 Kiriş alt kotunda segregasyon ve bal peteği boşluğu", desc: "Vibratör yetersiz kullanılmış, agreganın ayrışması sonucu 40cm boşluk oluştu.", sev: "CRITICAL", block: true, pen: 80000, payId: "pay-zirve-hakedis-4", x: -8.30, y: 7.10, z: 14.60 },
    { title: "Kule Vinç yaklaşma sınırında şantiye konteyneri çakışması", desc: "Vinç bom hareket sahası içinde izinsiz ofis yapısı tespit edildi.", sev: "HIGH", block: false, pen: 0, payId: null, x: 22.10, y: 15.00, z: -1.20 },
    { title: "Şaft boşluğunda yangın durdurucu harç eksikliği", desc: "Elektrik kablo geçişlerinde yangın bariyeri mastik çekilmemiş.", sev: "HIGH", block: false, pen: 0, payId: null, x: 4.80, y: 11.40, z: 2.30 },
    { title: "Döşeme rezervasyon deliği projeden 15 cm kayık", desc: "Sıhhi tesisat pimaş borusu kiriş donatısına çakışma yaratıyor.", sev: "MEDIUM", block: false, pen: 0, payId: null, x: -14.20, y: 6.80, z: 8.40 },
    { title: "Perde donatısında korozyon ve pas kalıntıları", desc: "Yağmur suyu tahliyesi geciktiği için donatıda yüzeyel paslanma var.", sev: "MEDIUM", block: false, pen: 0, payId: null, x: 1.10, y: -2.40, z: 5.60 },
    { title: "Dilatasyon derzinde su tutucu bant montaj hatası", desc: "Genleşme derzinde kauçuk su tutucu profil ters yerleştirilmiş.", sev: "HIGH", block: false, pen: 0, payId: null, x: -3.50, y: 0.80, z: -2.10 },
    { title: "Korkuluk ankraj pimlerinde kaynak yetersizliği", desc: "Merdiven kovası geçici güvenlik korkuluklarında 2 kaynak noktası kopuk.", sev: "HIGH", block: false, pen: 0, payId: null, x: 9.70, y: 8.90, z: 18.20 }
  ]

  for (let i = 1; i <= 20; i++) {
    const tmpl = bimDefectTemplates[(i - 1) % bimDefectTemplates.length]
    const isOpen = i <= 6 // İlk 6 kusur AÇIK kalsın
    const isCritical = tmpl.sev === "CRITICAL" || i === 1 || i === 2
    const blockPayment = isCritical && isOpen

    await prisma.bimIssue.upsert({
      where: { id: `issue-bim-${i < 10 ? "0" + i : i}` },
      update: {
        title: `[BIM-REV-${i}] ${tmpl.title}`,
        description: tmpl.desc,
        severity: tmpl.sev,
        status: isOpen ? "OPEN" : "RESOLVED",
        blockPayment,
        penaltyAmount: blockPayment ? tmpl.pen : 0,
        positionX: tmpl.x + (i * 0.5),
        positionY: tmpl.y + (i * 0.2),
        positionZ: tmpl.z - (i * 0.4),
        imageUrl: `https://picsum.photos/seed/nexa-bim-${i}/800/600`,
        projectId: projVadi.id,
        subcontractorId: i % 2 === 0 ? "sub-zirve" : "sub-demirtas",
        progressPaymentId: blockPayment ? tmpl.payId : null
      },
      create: {
        id: `issue-bim-${i < 10 ? "0" + i : i}`,
        title: `[BIM-REV-${i}] ${tmpl.title}`,
        description: tmpl.desc,
        severity: tmpl.sev,
        status: isOpen ? "OPEN" : "RESOLVED",
        blockPayment,
        penaltyAmount: blockPayment ? tmpl.pen : 0,
        positionX: tmpl.x + (i * 0.5),
        positionY: tmpl.y + (i * 0.2),
        positionZ: tmpl.z - (i * 0.4),
        imageUrl: `https://picsum.photos/seed/nexa-bim-${i}/800/600`,
        projectId: projVadi.id,
        subcontractorId: i % 2 === 0 ? "sub-zirve" : "sub-demirtas",
        progressPaymentId: blockPayment ? tmpl.payId : null
      }
    })
  }

  // ----------------------------------------------------------------------------
  // F. İSG VE IOT (20 BLE BEACON & 14 İSG İHLALİ)
  // ----------------------------------------------------------------------------
  console.log("🦺 [MOCK DATA] F. İSG ve IoT (20 BLE Cihazı ve Son 1 Haftalık İSG İhlalleri) oluşturuluyor...")

  const bleAssignedWorkers = seededPersonnelList.slice(0, 20)

  for (let i = 0; i < 20; i++) {
    const worker = bleAssignedWorkers[i]
    const mac = `E4:5F:01:A2:${i < 10 ? "0" + i : i}:${Math.floor(10 + i * 4)}`
    const battery = Math.floor(Math.random() * 85) + 14 // %14 - %98 arası

    await prisma.bleDevice.upsert({
      where: { id: `ble-dev-${i + 1}` },
      update: {
        macAddress: mac,
        deviceType: i % 2 === 0 ? "BARET" : "YELEK",
        batteryLevel: battery,
        assignedTo: worker.personel.id,
        userId: worker.user.id,
        lastSeenAt: new Date(Date.now() - Math.floor(Math.random() * 600000)),
        projectId: projVadi.id
      },
      create: {
        id: `ble-dev-${i + 1}`,
        macAddress: mac,
        deviceType: i % 2 === 0 ? "BARET" : "YELEK",
        batteryLevel: battery,
        assignedTo: worker.personel.id,
        userId: worker.user.id,
        lastSeenAt: new Date(Date.now() - Math.floor(Math.random() * 600000)),
        projectId: projVadi.id
      }
    })
  }

  // 14 Adet İSG İhlali (IsgViolation)
  const isgViolationTemplates = [
    { title: "Baret Takılmadı (Akıllı Kamera Tespiti)", zone: "A Blok Şantiye" },
    { title: "Yasaklı Kule Vinç Kör Noktasına Giriş", zone: "Kule Vinç Altı" },
    { title: "Yüksekte Emniyetsiz Çalışma (Paraşüt Tipi Emniyet Kemeri Eksik)", zone: "A Blok Şantiye" },
    { title: "Kaynak Alanında Koruyucu Siperlik ve Yanmaz Önlük Eksikliği", zone: "Demir Atölyesi" },
    { title: "Reflektörlü İş Yeleği Giyilmedi", zone: "B Blok Şantiye" },
    { title: "Yangın Tüpü Önüne Malzeme Yığılması", zone: "B Blok Şantiye" },
    { title: "Yetkisiz Elektrik Panosu Müdahalesi", zone: "Demir Atölyesi" }
  ]

  for (let i = 1; i <= 14; i++) {
    const tmpl = isgViolationTemplates[(i - 1) % isgViolationTemplates.length]
    const assignedWorker = seededPersonnelList[i + 5]
    const daysAgo = Math.floor(Math.random() * 6) + 1
    const violationDate = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000)

    await prisma.isgViolation.upsert({
      where: { id: `isg-viol-${i}` },
      update: {
        workerName: assignedWorker ? assignedWorker.personel.name : "Ahmet Usta",
        violation: tmpl.title,
        zoneName: tmpl.zone,
        status: i <= 5 ? "OPEN" : "RESOLVED",
        timestamp: violationDate,
        projectId: projVadi.id
      },
      create: {
        id: `isg-viol-${i}`,
        workerName: assignedWorker ? assignedWorker.personel.name : "Ahmet Usta",
        violation: tmpl.title,
        zoneName: tmpl.zone,
        status: i <= 5 ? "OPEN" : "RESOLVED",
        timestamp: violationDate,
        projectId: projVadi.id
      }
    })
  }

  console.log("✅ [MOCK DATA] Tüm hiyerarşik kurumsal mock veriler (Şirketler, Projeler, İK, Metraj, BIM, Finans, İSG) başarıyla oluşturuldu!\n")
}

main()
  .catch((e) => {
    console.error(" Seed failed:", e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })