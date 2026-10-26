/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Comprehensive Presentation / Demo Seed Script for Nexa ERP
 * Multi-Tenant & All Modules:
 * - Tenants (Nexa İnşaat & Balkan Yapı Denetim)
 * - Users & Auth (Admin, Inspection Admin, Superadmin)
 * - Companies & Suppliers (Oyak Çimento, Kardemir)
 * - Projects & Construction Sites (Vadi Evleri, Nexa Tower, Arsuz Sahil)
 * - Ministry YİBF / UYDS Inspection Data
 * - BoQ & Metraj (C35 Beton, Ø14 Demir, Mantolama, C50 Kolon)
 * - Finance & Transactions (Hakediş Tahsilatı, Giderler, Kasalar)
 * - Expense Claims & Receipts (Akaryakıt, Karot Testi, İSG Yemek)
 * - HR & Personnel (Proje Müdürü, Şantiye Şefleri, Muhasebeci, Saha Denetçileri)
 * - Subcontractors, Contracts & Progress Billings (Kardeşler Kalıp, Demirci Ustaları)
 * - Work Proofs & Field Evidence (GPS, Metraj, Fotoğraflı Kanıtlar)
 * - Digital Document Archive (isGlobalArchive, Statik Proje, Zemin Etüd, Ruhsat)
 * - Quality & NCR / DÖF (Beton Mukavemet Düşüklüğü, Eksik Paspayı)
 * - Dynamic Inspection Forms & Visas (Kalıp Kontrol Tutanağı, Demir Vize Formu)
 * - SaaS Support Tickets (3D BIM Sorunu, Kota Artırımı)
 * - Global System Error Telemetry Logs (OCR PDF Hatası)
 */

import {
  PrismaClient,
  CompanyType,
  UserRole,
  PersonelStatus,
  ContractStatus,
  BillingStatus,
} from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

export async function seedDatabase() {
  console.log("🚀 Nexa ERP Kapsamlı Müşteri Sunumu (Demo) Verileri Yükleniyor...")

  const defaultPassword = await bcrypt.hash("nexa2026", 10)
  const now = new Date()
  const daysAgo = (days: number) => new Date(now.getTime() - days * 24 * 60 * 60 * 1000)

  // ============================================================================
  // 1. FİRMALAR (TENANTS)
  // ============================================================================
  console.log("🏢 1. Kiracı Firmalar (Tenants) Oluşturuluyor...")

  // Müteahhit Firması: Nexa İnşaat A.Ş. (Tüm modüller açık, 100 GB kota)
  const contractorTenant = await prisma.tenant.upsert({
    where: { slug: "nexa-insaat" },
    update: {
      name: "Nexa İnşaat A.Ş.",
      domain: "portal.nexa.com.tr",
      type: CompanyType.MAIN_CONTRACTOR,
      subscriptionPlan: "ENTERPRISE",
      status: "ACTIVE",
      licenses: 100,
      maxUsers: 100,
      maxStorageMB: 102400, // 100 GB
      enabledModules: [
        "DASHBOARD",
        "PROJECTS",
        "FINANCE",
        "DOCUMENTS",
        "BIM",
        "OCR",
        "DRONE",
        "AI_VISION",
        "HR",
        "BOQ_METRAJ",
        "SUBCONTRACTOR",
        "QUALITY_CONTROL",
      ],
      features: ["BIM_VIEWER", "AI_VISION", "OCR", "DRONE"],
      primaryColor: "#3B82F6",
      isWhiteLabelActive: true,
      isActive: true,
      paymentStatus: "PAID",
    },
    create: {
      name: "Nexa İnşaat A.Ş.",
      slug: "nexa-insaat",
      domain: "portal.nexa.com.tr",
      type: CompanyType.MAIN_CONTRACTOR,
      subscriptionPlan: "ENTERPRISE",
      status: "ACTIVE",
      licenses: 100,
      maxUsers: 100,
      maxStorageMB: 102400, // 100 GB
      enabledModules: [
        "DASHBOARD",
        "PROJECTS",
        "FINANCE",
        "DOCUMENTS",
        "BIM",
        "OCR",
        "DRONE",
        "AI_VISION",
        "HR",
        "BOQ_METRAJ",
        "SUBCONTRACTOR",
        "QUALITY_CONTROL",
      ],
      features: ["BIM_VIEWER", "AI_VISION", "OCR", "DRONE"],
      primaryColor: "#3B82F6",
      isWhiteLabelActive: true,
      isActive: true,
      paymentStatus: "PAID",
    },
  })

  // Yapı Denetim Firması: Balkan Yapı Denetim Ltd. (Sadece denetim modülleri açık, 50 GB kota)
  const inspectionTenant = await prisma.tenant.upsert({
    where: { slug: "balkan-denetim" },
    update: {
      name: "Balkan Yapı Denetim Ltd.",
      domain: "denetim.balkan.com.tr",
      type: CompanyType.INSPECTION,
      subscriptionPlan: "PROFESSIONAL",
      status: "ACTIVE",
      licenses: 50,
      maxUsers: 50,
      maxStorageMB: 51200, // 50 GB
      enabledModules: [
        "DASHBOARD",
        "PROJECTS",
        "INSPECTION",
        "DOCUMENTS",
        "OCR",
        "AI_VISION",
        "QUALITY_CONTROL",
      ],
      features: ["AI_VISION", "OCR"],
      primaryColor: "#10B981",
      isWhiteLabelActive: true,
      isActive: true,
      paymentStatus: "PAID",
    },
    create: {
      name: "Balkan Yapı Denetim Ltd.",
      slug: "balkan-denetim",
      domain: "denetim.balkan.com.tr",
      type: CompanyType.INSPECTION,
      subscriptionPlan: "PROFESSIONAL",
      status: "ACTIVE",
      licenses: 50,
      maxUsers: 50,
      maxStorageMB: 51200, // 50 GB
      enabledModules: [
        "DASHBOARD",
        "PROJECTS",
        "INSPECTION",
        "DOCUMENTS",
        "OCR",
        "AI_VISION",
        "QUALITY_CONTROL",
      ],
      features: ["AI_VISION", "OCR"],
      primaryColor: "#10B981",
      isWhiteLabelActive: true,
      isActive: true,
      paymentStatus: "PAID",
    },
  })

  console.log(`✅ Müteahhit: ${contractorTenant.name} (${contractorTenant.slug})`)
  console.log(`✅ Yapı Denetim: ${inspectionTenant.name} (${inspectionTenant.slug})`)

  // ============================================================================
  // 2. YÖNETİCİ KULLANICILARI (USERS)
  // ============================================================================
  console.log("👤 2. Yönetici Kullanıcıları Tanımlanıyor...")

  // Müteahhit Admin (admin@nexa.com)
  const contractorAdmin = await prisma.user.upsert({
    where: { email: "admin@nexa.com" },
    update: {
      password: defaultPassword,
      name: "Kemal Demirtaş (Yönetici)",
      role: UserRole.ADMIN,
      companyType: CompanyType.MAIN_CONTRACTOR,
      tenantId: contractorTenant.id,
      permissions: contractorTenant.enabledModules,
    },
    create: {
      email: "admin@nexa.com",
      password: defaultPassword,
      name: "Kemal Demirtaş (Yönetici)",
      role: UserRole.ADMIN,
      companyType: CompanyType.MAIN_CONTRACTOR,
      tenantId: contractorTenant.id,
      permissions: contractorTenant.enabledModules,
    },
  })

  // Yapı Denetim Admin (denetim@nexa.com)
  const inspectionAdmin = await prisma.user.upsert({
    where: { email: "denetim@nexa.com" },
    update: {
      password: defaultPassword,
      name: "Mimar Selim Balkan (Başdenetçi)",
      role: UserRole.INSPECTION_ADMIN,
      companyType: CompanyType.INSPECTION,
      tenantId: inspectionTenant.id,
      permissions: inspectionTenant.enabledModules,
    },
    create: {
      email: "denetim@nexa.com",
      password: defaultPassword,
      name: "Mimar Selim Balkan (Başdenetçi)",
      role: UserRole.INSPECTION_ADMIN,
      companyType: CompanyType.INSPECTION,
      tenantId: inspectionTenant.id,
      permissions: inspectionTenant.enabledModules,
    },
  })

  // Global Superadmin (superadmin@nxa.com.tr)
  const superAdmin = await prisma.user.upsert({
    where: { email: "superadmin@nxa.com.tr" },
    update: {
      password: defaultPassword,
      name: "Nexa Superadmin",
      role: UserRole.SUPER_ADMIN,
    },
    create: {
      email: "superadmin@nxa.com.tr",
      password: defaultPassword,
      name: "Nexa Superadmin",
      role: UserRole.SUPER_ADMIN,
    },
  })

  console.log(`✅ Müteahhit Admin: ${contractorAdmin.email}`)
  console.log(`✅ Denetim Admin: ${inspectionAdmin.email}`)
  console.log(`✅ Superadmin: ${superAdmin.email}`)

  // ============================================================================
  // 3. TEDARİKÇİ & CRM FİRMALARI (COMPANIES)
  // ============================================================================
  console.log("🤝 3. CRM & Tedarikçi Firmaları Ekleniyor...")

  const oyakCimento = await prisma.company.upsert({
    where: { id: "company-oyak-cimento" },
    update: {},
    create: {
      id: "company-oyak-cimento",
      name: "Oyak Çimento San. ve Tic. A.Ş.",
      slug: "oyak-cimento",
      type: CompanyType.SUPPLIER,
      companyType: "SUPPLIER",
      contactName: "Murat Özkan (Satış Direktörü)",
      phone: "+90 216 555 4000",
      email: "satis@oyakcimento.com.tr",
      taxNumber: "6490012480",
      taxOffice: "Boğaziçi Kurumlar V.D.",
    },
  })

  const kardemir = await prisma.company.upsert({
    where: { id: "company-kardemir" },
    update: {},
    create: {
      id: "company-kardemir",
      name: "Kardemir Karabük Demir Çelik Sanayi A.Ş.",
      slug: "kardemir",
      type: CompanyType.SUPPLIER,
      companyType: "SUPPLIER",
      contactName: "Serkan Çelik (Bölge Müdürü)",
      phone: "+90 370 418 2000",
      email: "pazarlama@kardemir.com",
      taxNumber: "5240018590",
      taxOffice: "Karabük V.D.",
    },
  })

  const balkanCompany = await prisma.company.upsert({
    where: { id: "company-balkan-denetim" },
    update: {},
    create: {
      id: "company-balkan-denetim",
      name: "Balkan Yapı Denetim Ltd.",
      slug: "balkan-denetim-ltd",
      type: CompanyType.INSPECTION,
      companyType: "INSPECTION",
      contactName: "Selim Balkan",
      phone: "+90 212 555 9090",
      email: "info@balkandenetim.com.tr",
      taxNumber: "1480029301",
      taxOffice: "Marmara Kurumlar V.D.",
    },
  })

  console.log(`✅ Tedarikçiler: ${oyakCimento.name}, ${kardemir.name}`)

  // ============================================================================
  // 4. ŞANTİYELER & PROJELER (PROJECTS)
  // ============================================================================
  console.log("🏗️ 4. Gerçekçi İnşaat Projeleri Tanımlanıyor...")

  // Proje 1: Vadi Evleri A Blok (Kadıköy / İstanbul, %75 Tamamlanmış, Bütçe: 150M TL)
  const project1 = await prisma.project.upsert({
    where: { yibfNo: "14582" },
    update: {
      title: "Vadi Evleri A Blok",
      name: "Vadi Evleri A Blok",
      description: "120 konutluk lüks rezidans ve kapalı otopark projesi. Kaba inşaat tamamlandı, ince işçilik ve elektromekanik imalatlar sürüyor.",
      location: "Kadıköy / İstanbul",
      city: "İstanbul",
      district: "Kadıköy",
      status: "SAHA",
      year: "2025-2026",
      contractValue: 150000000, // 150 Milyon TL
      progress: 75,
      healthScore: 94,
      totalArea: 14500,
      totalConstructionArea: 14500,
      buildingClass: "IV-A",
      yibfStatus: "Aktif Şantiye",
      tenantId: contractorTenant.id,
      managerId: contractorAdmin.id,
      siteManager: "İnş. Müh. Barış Demir",
      engineer: "Ece Korkmaz",
      architect: "Sinan Kara",
      latitude: 40.9912,
      longitude: 29.0278,
    },
    create: {
      title: "Vadi Evleri A Blok",
      name: "Vadi Evleri A Blok",
      description: "120 konutluk lüks rezidans ve kapalı otopark projesi. Kaba inşaat tamamlandı, ince işçilik ve elektromekanik imalatlar sürüyor.",
      location: "Kadıköy / İstanbul",
      city: "İstanbul",
      district: "Kadıköy",
      status: "SAHA",
      year: "2025-2026",
      contractValue: 150000000,
      progress: 75,
      healthScore: 94,
      totalArea: 14500,
      totalConstructionArea: 14500,
      buildingClass: "IV-A",
      yibfNo: "14582",
      yibfStatus: "Aktif Şantiye",
      tenantId: contractorTenant.id,
      managerId: contractorAdmin.id,
      siteManager: "İnş. Müh. Barış Demir",
      engineer: "Ece Korkmaz",
      architect: "Sinan Kara",
      latitude: 40.9912,
      longitude: 29.0278,
    },
  })

  // Proje 2: Nexa Tower Plaza (Şişli / İstanbul, %30 Tamamlanmış, Bütçe: 450M TL)
  const project2 = await prisma.project.upsert({
    where: { yibfNo: "34591" },
    update: {
      title: "Nexa Tower Plaza",
      name: "Nexa Tower Plaza",
      description: "42 katlı A+ akıllı ofis ve iş merkezi. LEED Platinum standartlarında çevre dostu kule projesi. Bodrum katlar ve temel beton dökümleri bitti.",
      location: "Şişli / İstanbul",
      city: "İstanbul",
      district: "Şişli",
      status: "SAHA",
      year: "2026-2027",
      contractValue: 450000000, // 450 Milyon TL
      progress: 30,
      healthScore: 98,
      totalArea: 38200,
      totalConstructionArea: 38200,
      buildingClass: "V-B",
      yibfStatus: "Aktif Şantiye",
      tenantId: contractorTenant.id,
      managerId: contractorAdmin.id,
      siteManager: "Yük. Müh. Cenk Aksoy",
      engineer: "Deniz Yıldız",
      architect: "Bora Erdem",
      latitude: 41.0602,
      longitude: 28.9877,
    },
    create: {
      title: "Nexa Tower Plaza",
      name: "Nexa Tower Plaza",
      description: "42 katlı A+ akıllı ofis ve iş merkezi. LEED Platinum standartlarında çevre dostu kule projesi. Bodrum katlar ve temel beton dökümleri bitti.",
      location: "Şişli / İstanbul",
      city: "İstanbul",
      district: "Şişli",
      status: "SAHA",
      year: "2026-2027",
      contractValue: 450000000,
      progress: 30,
      healthScore: 98,
      totalArea: 38200,
      totalConstructionArea: 38200,
      buildingClass: "V-B",
      yibfNo: "34591",
      yibfStatus: "Aktif Şantiye",
      tenantId: contractorTenant.id,
      managerId: contractorAdmin.id,
      siteManager: "Yük. Müh. Cenk Aksoy",
      engineer: "Deniz Yıldız",
      architect: "Bora Erdem",
      latitude: 41.0602,
      longitude: 28.9877,
    },
  })

  // Proje 3: Arsuz Sahil Konakları (Hatay / Arsuz, %10 Tamamlanmış, Bütçe: 85M TL)
  const project3 = await prisma.project.upsert({
    where: { yibfNo: "31045" },
    update: {
      title: "Arsuz Sahil Konakları",
      name: "Arsuz Sahil Konakları",
      description: "Denize sıfır 24 adet özel yüzme havuzlu lüks villa sitesi. Zemin iyileştirme (jet-grout) ve istinat iksa çalışmaları devam ediyor.",
      location: "Arsuz / Hatay",
      city: "Hatay",
      district: "Arsuz",
      status: "ETUT",
      year: "2026-2027",
      contractValue: 85000000, // 85 Milyon TL
      progress: 10,
      healthScore: 89,
      totalArea: 8400,
      totalConstructionArea: 8400,
      buildingClass: "III-B",
      yibfStatus: "Ruhsat Aşaması",
      tenantId: contractorTenant.id,
      managerId: contractorAdmin.id,
      siteManager: "İnş. Müh. Mert Aydın",
      engineer: "Selin Kaya",
      architect: "Canan Çetin",
      latitude: 35.8872,
      longitude: 35.8821,
    },
    create: {
      title: "Arsuz Sahil Konakları",
      name: "Arsuz Sahil Konakları",
      description: "Denize sıfır 24 adet özel yüzme havuzlu lüks villa sitesi. Zemin iyileştirme (jet-grout) ve istinat iksa çalışmaları devam ediyor.",
      location: "Arsuz / Hatay",
      city: "Hatay",
      district: "Arsuz",
      status: "ETUT",
      year: "2026-2027",
      contractValue: 85000000,
      progress: 10,
      healthScore: 89,
      totalArea: 8400,
      totalConstructionArea: 8400,
      buildingClass: "III-B",
      yibfNo: "31045",
      yibfStatus: "Ruhsat Aşaması",
      tenantId: contractorTenant.id,
      managerId: contractorAdmin.id,
      siteManager: "İnş. Müh. Mert Aydın",
      engineer: "Selin Kaya",
      architect: "Canan Çetin",
      latitude: 35.8872,
      longitude: 35.8821,
    },
  })

  console.log(`✅ 3 Proje Oluşturuldu: ${project1.name}, ${project2.name}, ${project3.name}`)

  // ============================================================================
  // 5. YAPI DENETİM & BAKANLIK YİBF PROJELERİ (YibfProject)
  // ============================================================================
  console.log("🏛️ 5. Bakanlık e-YİBF / UYDS Denetim Verileri Oluşturuluyor...")

  await prisma.yibfProject.upsert({
    where: { yibfNo: "14582" },
    update: {
      address: "Koşuyolu Mah. Çelik Sok. No:14 Kadıköy / İstanbul",
      ownerName: "Demirtaş Gayrimenkul Yatırım A.Ş.",
      contractorName: "Nexa İnşaat A.Ş.",
      totalArea: 14500,
      floors: 12,
      status: "ACTIVE", // UYDS: Denetimde
      companyId: balkanCompany.id,
      tenantId: inspectionTenant.id,
    },
    create: {
      yibfNo: "14582",
      address: "Koşuyolu Mah. Çelik Sok. No:14 Kadıköy / İstanbul",
      ownerName: "Demirtaş Gayrimenkul Yatırım A.Ş.",
      contractorName: "Nexa İnşaat A.Ş.",
      totalArea: 14500,
      floors: 12,
      status: "ACTIVE",
      companyId: balkanCompany.id,
      tenantId: inspectionTenant.id,
    },
  })

  await prisma.yibfProject.upsert({
    where: { yibfNo: "34591" },
    update: {
      address: "Büyükdere Cad. No:88 Esentepe Şişli / İstanbul",
      ownerName: "Avrasya Portföy Yönetimi A.Ş.",
      contractorName: "Nexa İnşaat A.Ş.",
      totalArea: 38200,
      floors: 42,
      status: "ACTIVE", // UYDS: Denetimde
      companyId: balkanCompany.id,
      tenantId: inspectionTenant.id,
    },
    create: {
      yibfNo: "34591",
      address: "Büyükdere Cad. No:88 Esentepe Şişli / İstanbul",
      ownerName: "Avrasya Portföy Yönetimi A.Ş.",
      contractorName: "Nexa İnşaat A.Ş.",
      totalArea: 38200,
      floors: 42,
      status: "ACTIVE",
      companyId: balkanCompany.id,
      tenantId: inspectionTenant.id,
    },
  })

  console.log("✅ YİBF No: 14582 ve 34591 Balkan Yapı Denetim'e bağlandı (Statü: DENETİMDE)")

  // ============================================================================
  // 6. KEŞİF & METRAJ (BoQ Kalemleri)
  // ============================================================================
  console.log("📐 6. Keşif & Metraj (BoQ) Kalemleri Oluşturuluyor...")

  // Vadi Evleri BoQ Kalemleri
  await prisma.boQItem.createMany({
    data: [
      {
        projectId: project1.id,
        itemCode: "15.120.1001",
        description: "C35/45 Hazır Beton Dökümü (Kalıp ve Pompa Dahil)",
        unit: "m3",
        unitPrice: 2850,
        contractQuantity: 4200,
        completedQuantity: 3150,
        totalAmount: 11970000,
        carbonEmission: 240,
        totalCarbon: 1008000,
      },
      {
        projectId: project1.id,
        itemCode: "15.160.1003",
        description: "B420C Nervürlü Çelik Hasır ve Donatı İmalatı (Ø14)",
        unit: "ton",
        unitPrice: 26500,
        contractQuantity: 380,
        completedQuantity: 285,
        totalAmount: 10070000,
        carbonEmission: 1800,
        totalCarbon: 684000,
      },
      {
        projectId: project1.id,
        itemCode: "15.250.2004",
        description: "Dış Cephe Taşyünü Mantolama ve Silikonlu Boya (10 cm)",
        unit: "m2",
        unitPrice: 650,
        contractQuantity: 8500,
        completedQuantity: 4200,
        totalAmount: 5525000,
      },
    ],
    skipDuplicates: true,
  })

  // Nexa Tower Plaza BoQ Kalemleri
  await prisma.boQItem.createMany({
    data: [
      {
        projectId: project2.id,
        itemCode: "15.120.1008",
        description: "C50/60 Yüksek Mukavemetli Çekirdek Kolon Betonu",
        unit: "m3",
        unitPrice: 3600,
        contractQuantity: 12500,
        completedQuantity: 3750,
        totalAmount: 45000000,
      },
      {
        projectId: project2.id,
        itemCode: "15.160.1012",
        description: "Deprem Şartnamesi Yüksek Sünek Donatı Çeliği (Ø20-Ø32)",
        unit: "ton",
        unitPrice: 27800,
        contractQuantity: 1400,
        completedQuantity: 420,
        totalAmount: 38920000,
      },
    ],
    skipDuplicates: true,
  })

  // Ayrıca iş kanıtlarına bağlanan BoqItem modeline de kayıt ekleyelim:
  const boqBetonItem = await prisma.boqItem.upsert({
    where: { id: "boq-vadi-c35-beton-item" },
    update: {
      plannedQuantity: 4200,
      actualQuantity: 3150,
      unitPrice: 2850,
      totalPrice: 11970000,
    },
    create: {
      id: "boq-vadi-c35-beton-item",
      projectId: project1.id,
      pozNo: "15.120.1001",
      description: "C35/45 Hazır Beton Dökümü (Kalıp ve Pompa Dahil)",
      unit: "m3",
      plannedQuantity: 4200,
      unitPrice: 2850,
      totalPrice: 11970000,
      actualQuantity: 3150,
    },
  })

  console.log("✅ C35 Beton, Ø14 Nervürlü Çelik ve C50 BoQ kalemleri projelerine bağlandı.")

  // ============================================================================
  // 7. KASA, FİNANS VE GELİR/GİDER İŞLEMLERİ (Transactions & Expenses)
  // ============================================================================
  console.log("💰 7. Kasa, Banka ve Finans Hareketleri Ekleniyor...")

  await prisma.transaction.createMany({
    data: [
      {
        type: "GELIR",
        amount: 18500000,
        description: "Vadi Evleri A Blok - 3. Hak Ediş Hakediş Tahsilatı (İş Bankası Teminat)",
        category: "HAKEDIS",
        projectId: project1.id,
        companyId: oyakCimento.id,
        date: daysAgo(2),
      },
      {
        type: "GIDER",
        amount: 3420000,
        description: "Oyak Çimento - 1200 m3 C35 Hazır Beton Faturası Ödemesi",
        category: "BETON",
        projectId: project1.id,
        companyId: oyakCimento.id,
        date: daysAgo(5),
      },
      {
        type: "GIDER",
        amount: 3975000,
        description: "Kardemir A.Ş. - 150 Ton Ø14 Nervürlü Demir Sevkiyat Bedeli (Garanti Ticari)",
        category: "DEMIR",
        projectId: project1.id,
        companyId: kardemir.id,
        date: daysAgo(8),
      },
      {
        type: "GELIR",
        amount: 45000000,
        description: "Nexa Tower Plaza - İşveren Sözleşme Avansı Tahsilatı (İş Bankası)",
        category: "AVANS",
        projectId: project2.id,
        date: daysAgo(12),
      },
      {
        type: "GIDER",
        amount: 1850000,
        description: "Tünel Kalıp & İskele Kurulumu Saha Taşeron Hak Edişi",
        category: "TASERON",
        projectId: project2.id,
        date: daysAgo(15),
      },
      {
        type: "GIDER",
        amount: 1250000,
        description: "Şantiye Saha Mühendisleri & Formeler Maaş ve SGK Ödemeleri",
        category: "MAAS",
        projectId: project1.id,
        date: daysAgo(20),
      },
      {
        type: "GELIR",
        amount: 12000000,
        description: "Arsuz Sahil Konakları - Ön Satış ve Teminat Girişi",
        category: "DIGER",
        projectId: project3.id,
        date: daysAgo(25),
      },
    ],
  })

  // Masraf & Fiş Kayıtları (Expense Claims)
  await prisma.expenseClaim.createMany({
    data: [
      {
        userId: contractorAdmin.id,
        projectId: project1.id,
        expenseType: "FUEL",
        amount: 28500,
        receiptUrl: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600",
        description: "Şantiye Kule Vinç & Jeneratör Mazot İkmali (Opet)",
        status: "APPROVED",
        createdAt: daysAgo(3),
      },
      {
        userId: contractorAdmin.id,
        projectId: project1.id,
        expenseType: "MATERIAL",
        amount: 14200,
        receiptUrl: "https://images.unsplash.com/photo-1450133064473-71024230f91b?w=600",
        description: "Bağımsız Laboratuvar Karot & Çelik Çekme Deney Faturası",
        status: "APPROVED",
        createdAt: daysAgo(7),
      },
      {
        userId: contractorAdmin.id,
        projectId: project2.id,
        expenseType: "FOOD",
        amount: 4850,
        receiptUrl: "https://images.unsplash.com/photo-1554224154-26032ffc0d07?w=600",
        description: "Saha Teknik Ekip & İş Sağlığı Uzmanları İSG Saha Yemeği",
        status: "APPROVED",
        createdAt: daysAgo(10),
      },
    ],
  })

  // ============================================================================
  // 8. İNSAN KAYNAKLARI (HR / PERSONEL)
  // ============================================================================
  console.log("👥 8. İnsan Kaynakları & Şantiye Personelleri Tanımlanıyor...")

  // Nexa İnşaat Personelleri:
  // 1 Proje Müdürü: Ahmet Yılmaz
  await prisma.personel.upsert({
    where: { personnelNo: "P-NEXA-001" },
    update: {
      name: "Ahmet Yılmaz",
      position: "Proje Müdürü",
      department: "Proje Yönetimi",
      currentSite: "Nexa Merkez / Vadi Evleri",
      salary: 95000,
      status: PersonelStatus.ACTIVE,
      tenantId: contractorTenant.id,
    },
    create: {
      personnelNo: "P-NEXA-001",
      name: "Ahmet Yılmaz",
      position: "Proje Müdürü",
      department: "Proje Yönetimi",
      currentSite: "Nexa Merkez / Vadi Evleri",
      age: 44,
      birthDate: new Date("1982-04-12"),
      hireDate: new Date("2020-03-01"),
      salary: 95000,
      salaryStatus: "Paid",
      phone: "+90 532 111 2233",
      email: "ahmet.yilmaz@nexa.com",
      status: PersonelStatus.ACTIVE,
      tenantId: contractorTenant.id,
    },
  })

  // 2 Şantiye Şefi: Barış Demir & Mert Aydın
  await prisma.personel.upsert({
    where: { personnelNo: "P-NEXA-002" },
    update: {
      name: "İnş. Müh. Barış Demir",
      position: "Şantiye Şefi",
      department: "Saha Operasyon",
      currentSite: "Vadi Evleri A Blok",
      salary: 75000,
      status: PersonelStatus.ACTIVE,
      tenantId: contractorTenant.id,
    },
    create: {
      personnelNo: "P-NEXA-002",
      name: "İnş. Müh. Barış Demir",
      position: "Şantiye Şefi",
      department: "Saha Operasyon",
      currentSite: "Vadi Evleri A Blok",
      age: 38,
      birthDate: new Date("1988-06-20"),
      hireDate: new Date("2021-08-15"),
      salary: 75000,
      salaryStatus: "Paid",
      phone: "+90 533 222 3344",
      email: "baris.demir@nexa.com",
      status: PersonelStatus.ACTIVE,
      tenantId: contractorTenant.id,
    },
  })

  await prisma.personel.upsert({
    where: { personnelNo: "P-NEXA-003" },
    update: {
      name: "İnş. Müh. Mert Aydın",
      position: "Şantiye Şefi",
      department: "Saha Operasyon",
      currentSite: "Arsuz Sahil Konakları",
      salary: 70000,
      status: PersonelStatus.ACTIVE,
      tenantId: contractorTenant.id,
    },
    create: {
      personnelNo: "P-NEXA-003",
      name: "İnş. Müh. Mert Aydın",
      position: "Şantiye Şefi",
      department: "Saha Operasyon",
      currentSite: "Arsuz Sahil Konakları",
      age: 35,
      birthDate: new Date("1991-09-10"),
      hireDate: new Date("2023-02-01"),
      salary: 70000,
      salaryStatus: "Paid",
      phone: "+90 535 333 4455",
      email: "mert.aydin@nexa.com",
      status: PersonelStatus.ACTIVE,
      tenantId: contractorTenant.id,
    },
  })

  // 1 Muhasebeci: Elif Korkmaz
  await prisma.personel.upsert({
    where: { personnelNo: "P-NEXA-004" },
    update: {
      name: "Elif Korkmaz",
      position: "Mali İşler & Muhasebe Uzmanı",
      department: "Finans & Muhasebe",
      currentSite: "Nexa Merkez Ofis",
      salary: 58000,
      status: PersonelStatus.ACTIVE,
      tenantId: contractorTenant.id,
    },
    create: {
      personnelNo: "P-NEXA-004",
      name: "Elif Korkmaz",
      position: "Mali İşler & Muhasebe Uzmanı",
      department: "Finans & Muhasebe",
      currentSite: "Nexa Merkez Ofis",
      age: 32,
      birthDate: new Date("1994-01-25"),
      hireDate: new Date("2022-05-10"),
      salary: 58000,
      salaryStatus: "Paid",
      phone: "+90 536 444 5566",
      email: "elif.korkmaz@nexa.com",
      status: PersonelStatus.ACTIVE,
      tenantId: contractorTenant.id,
    },
  })

  // Balkan Yapı Denetim Personelleri:
  // 2 Saha Denetçisi: Can Özdemir & Zeynep Arslan
  await prisma.personel.upsert({
    where: { personnelNo: "P-BALKAN-001" },
    update: {
      name: "İnş. Müh. Can Özdemir",
      position: "Kıdemli Statik Saha Denetçisi",
      department: "Yapı Denetim Saha",
      currentSite: "Vadi Evleri & Nexa Tower",
      salary: 68000,
      status: PersonelStatus.ACTIVE,
      tenantId: inspectionTenant.id,
    },
    create: {
      personnelNo: "P-BALKAN-001",
      name: "İnş. Müh. Can Özdemir",
      position: "Kıdemli Statik Saha Denetçisi",
      department: "Yapı Denetim Saha",
      currentSite: "Vadi Evleri & Nexa Tower",
      age: 39,
      birthDate: new Date("1987-11-05"),
      hireDate: new Date("2019-10-01"),
      salary: 68000,
      salaryStatus: "Paid",
      phone: "+90 537 555 6677",
      email: "can.ozdemir@balkandenetim.com.tr",
      status: PersonelStatus.ACTIVE,
      tenantId: inspectionTenant.id,
    },
  })

  await prisma.personel.upsert({
    where: { personnelNo: "P-BALKAN-002" },
    update: {
      name: "Mimar Zeynep Arslan",
      position: "Mimari & Yangın Güvenliği Denetçisi",
      department: "Yapı Denetim Saha",
      currentSite: "Vadi Evleri & Nexa Tower",
      salary: 65000,
      status: PersonelStatus.ACTIVE,
      tenantId: inspectionTenant.id,
    },
    create: {
      personnelNo: "P-BALKAN-002",
      name: "Mimar Zeynep Arslan",
      position: "Mimari & Yangın Güvenliği Denetçisi",
      department: "Yapı Denetim Saha",
      currentSite: "Vadi Evleri & Nexa Tower",
      age: 34,
      birthDate: new Date("1992-07-18"),
      hireDate: new Date("2021-04-12"),
      salary: 65000,
      salaryStatus: "Paid",
      phone: "+90 538 666 7788",
      email: "zeynep.arslan@balkandenetim.com.tr",
      status: PersonelStatus.ACTIVE,
      tenantId: inspectionTenant.id,
    },
  })

  console.log("✅ 4 Nexa İnşaat + 2 Balkan Yapı Denetim personeli tanımlandı.")

  // ============================================================================
  // 9. TAŞERONLAR, SÖZLEŞMELER & HAKEDİŞLER (SUBCONTRACTORS & BILLINGS)
  // ============================================================================
  console.log("🔨 9. Taşeronlar, Sözleşmeler ve Hakediş Kayıtları Giriliyor...")

  // 1. Taşeron Company kayıtları (Contract modeli Company referansı içerir)
  const kardeslerKalipCompany = await prisma.company.upsert({
    where: { id: "company-sub-kardesler-kalip" },
    update: {},
    create: {
      id: "company-sub-kardesler-kalip",
      name: "Kardeşler Kalıp & İskele Sistemleri Ltd. Şti.",
      slug: "kardesler-kalip",
      type: CompanyType.SUBCONTRACTOR,
      companyType: "SUBCONTRACTOR",
      contactName: "Hasan Kardeş (Genel Müdür)",
      phone: "+90 216 444 1234",
      email: "info@kardeslerkalip.com",
      taxNumber: "5120349811",
      taxOffice: "Kadıköy V.D.",
    },
  })

  const demirciUstalariCompany = await prisma.company.upsert({
    where: { id: "company-sub-demirci-ustalari" },
    update: {},
    create: {
      id: "company-sub-demirci-ustalari",
      name: "Demirci Ustaları Donatı San. ve Tic. Ltd.",
      slug: "demirci-ustalari",
      type: CompanyType.SUBCONTRACTOR,
      companyType: "SUBCONTRACTOR",
      contactName: "Mustafa Usta (Saha Şefi)",
      phone: "+90 212 333 5678",
      email: "iletisim@demirciustalari.com",
      taxNumber: "3890214562",
      taxOffice: "Şişli V.D.",
    },
  })

  // 2. Subcontractor tablosu (WorkProof & ProgressPayment ile ilişkili)
  const kardeslerSubcontractor = await prisma.subcontractor.upsert({
    where: { id: "sub-kardesler-kalip" },
    update: {
      name: "Kardeşler Kalıp & İskele Sistemleri Ltd. Şti.",
      taxNumber: "5120349811",
      contactName: "Hasan Kardeş",
      phone: "+90 216 444 1234",
    },
    create: {
      id: "sub-kardesler-kalip",
      name: "Kardeşler Kalıp & İskele Sistemleri Ltd. Şti.",
      taxNumber: "5120349811",
      contactName: "Hasan Kardeş",
      phone: "+90 216 444 1234",
    },
  })

  const demirciSubcontractor = await prisma.subcontractor.upsert({
    where: { id: "sub-demirci-ustalari" },
    update: {
      name: "Demirci Ustaları Donatı San. ve Tic. Ltd.",
      taxNumber: "3890214562",
      contactName: "Mustafa Usta",
      phone: "+90 212 333 5678",
    },
    create: {
      id: "sub-demirci-ustalari",
      name: "Demirci Ustaları Donatı San. ve Tic. Ltd.",
      taxNumber: "3890214562",
      contactName: "Mustafa Usta",
      phone: "+90 212 333 5678",
    },
  })

  // 3. Taşeron Sözleşmeleri (Contracts)
  const contractKalip = await prisma.contract.upsert({
    where: { id: "contract-kalip-vadi" },
    update: {
      title: "Vadi Evleri A Blok Endüstriyel Kalıp ve İskele İmalatı Sözleşmesi",
      totalAmount: 18500000,
      projectId: project1.id,
      subcontractorId: kardeslerKalipCompany.id,
      status: ContractStatus.ACTIVE,
    },
    create: {
      id: "contract-kalip-vadi",
      title: "Vadi Evleri A Blok Endüstriyel Kalıp ve İskele İmalatı Sözleşmesi",
      totalAmount: 18500000,
      dailyPenaltyRate: 15000,
      retentionRate: 0.05,
      startDate: daysAgo(90),
      endDate: new Date(now.getTime() + 120 * 24 * 60 * 60 * 1000),
      status: ContractStatus.ACTIVE,
      projectId: project1.id,
      subcontractorId: kardeslerKalipCompany.id,
    },
  })

  const contractDemir = await prisma.contract.upsert({
    where: { id: "contract-demir-plaza" },
    update: {
      title: "Nexa Tower Plaza Yüksek Sünek Donatı Demir İmalatı ve Bağlama Sözleşmesi",
      totalAmount: 32000000,
      projectId: project2.id,
      subcontractorId: demirciUstalariCompany.id,
      status: ContractStatus.ACTIVE,
    },
    create: {
      id: "contract-demir-plaza",
      title: "Nexa Tower Plaza Yüksek Sünek Donatı Demir İmalatı ve Bağlama Sözleşmesi",
      totalAmount: 32000000,
      dailyPenaltyRate: 25000,
      retentionRate: 0.05,
      startDate: daysAgo(60),
      endDate: new Date(now.getTime() + 180 * 24 * 60 * 60 * 1000),
      status: ContractStatus.ACTIVE,
      projectId: project2.id,
      subcontractorId: demirciUstalariCompany.id,
    },
  })

  // 4. ProgressBilling (Hakediş Kayıtları: Biri Onaylanmış, Biri Bekleyen)
  const billingApproved = await prisma.progressBilling.upsert({
    where: { id: "billing-vadi-kalip-1" },
    update: {
      billingNumber: 1,
      period: daysAgo(10),
      grossAmount: 4200000,
      advanceDeduction: 500000,
      penaltyDeduction: 0,
      retentionDeduction: 210000,
      netPayable: 3490000,
      status: BillingStatus.APPROVED,
      contractId: contractKalip.id,
    },
    create: {
      id: "billing-vadi-kalip-1",
      billingNumber: 1,
      period: daysAgo(10),
      grossAmount: 4200000,
      advanceDeduction: 500000,
      penaltyDeduction: 0,
      retentionDeduction: 210000,
      netPayable: 3490000,
      status: BillingStatus.APPROVED,
      contractId: contractKalip.id,
    },
  })

  await prisma.progressBilling.upsert({
    where: { id: "billing-plaza-demir-2" },
    update: {
      billingNumber: 2,
      period: daysAgo(2),
      grossAmount: 6800000,
      advanceDeduction: 800000,
      penaltyDeduction: 50000,
      retentionDeduction: 340000,
      netPayable: 5610000,
      status: BillingStatus.PENDING_APPROVAL,
      contractId: contractDemir.id,
    },
    create: {
      id: "billing-plaza-demir-2",
      billingNumber: 2,
      period: daysAgo(2),
      grossAmount: 6800000,
      advanceDeduction: 800000,
      penaltyDeduction: 50000,
      retentionDeduction: 340000,
      netPayable: 5610000,
      status: BillingStatus.PENDING_APPROVAL,
      contractId: contractDemir.id,
    },
  })

  // 5. ProgressPayment Modeli (UI Hakediş Detayları)
  await prisma.progressPayment.upsert({
    where: { id: "ppay-vadi-kalip-1" },
    update: {
      title: "Vadi Evleri A Blok - 3. Kat Kolon & Perde Kalıp Teslim Hakedişi",
      quantity: 1250,
      unit: "m2",
      unitPrice: 450,
      totalPrice: 562500,
      amount: 562500,
      status: "ONAYLANDI",
      projectId: project1.id,
      subcontractorId: kardeslerSubcontractor.id,
      contractId: contractKalip.id,
    },
    create: {
      id: "ppay-vadi-kalip-1",
      title: "Vadi Evleri A Blok - 3. Kat Kolon & Perde Kalıp Teslim Hakedişi",
      description: "Kalıp terazisi ve aks kontrolleri tamamlandı, şantiye şefi onaylı.",
      quantity: 1250,
      unit: "m2",
      unitPrice: 450,
      totalPrice: 562500,
      amount: 562500,
      status: "ONAYLANDI",
      projectId: project1.id,
      subcontractorId: kardeslerSubcontractor.id,
      contractId: contractKalip.id,
      netAmount: 534375,
      retentionAmount: 28125,
    },
  })

  await prisma.progressPayment.upsert({
    where: { id: "ppay-plaza-demir-1" },
    update: {
      title: "Nexa Tower Plaza - Temel Radye Ø32 Donatı Bağlama Hakedişi",
      quantity: 180,
      unit: "ton",
      unitPrice: 4800,
      totalPrice: 864000,
      amount: 864000,
      status: "BEKLIYOR",
      projectId: project2.id,
      subcontractorId: demirciSubcontractor.id,
      contractId: contractDemir.id,
    },
    create: {
      id: "ppay-plaza-demir-1",
      title: "Nexa Tower Plaza - Temel Radye Ø32 Donatı Bağlama Hakedişi",
      description: "Alt ve üst donatı ağı örüldü, paspayları yerleştirildi. Müşavir vizesi bekleniyor.",
      quantity: 180,
      unit: "ton",
      unitPrice: 4800,
      totalPrice: 864000,
      amount: 864000,
      status: "BEKLIYOR",
      projectId: project2.id,
      subcontractorId: demirciSubcontractor.id,
      contractId: contractDemir.id,
      netAmount: 820800,
      retentionAmount: 43200,
    },
  })

  console.log("✅ Kardeşler Kalıp (Onaylandı) ve Demirci Ustaları (Bekliyor) hakedişleri oluşturuldu.")

  // ============================================================================
  // 10. İŞ KANITLARI & ATAŞMANLAR (WORK PROOFS - GPS & METRAJ)
  // ============================================================================
  console.log("📍 10. Saha İş Kanıtları (Work Proofs) GPS Koordinatlarıyla Ekleniyor...")

  await prisma.workProof.upsert({
    where: { id: "proof-kolon-beton-dokumu" },
    update: {
      title: "2. Kat Kolon Beton Dökümü",
      description: "Vadi Evleri A Blok 2. kat kolon ve perde beton dökümü, slump testi 18 cm, sıcaklık 22°C. Numune küpleri alındı.",
      claimedQuantity: 45,
      approvedQuantity: 45,
      gpsLatitude: 40.9912,
      gpsLongitude: 29.0278,
      status: "APPROVED",
      engineerStatus: "APPROVED",
      managerStatus: "APPROVED",
      photoUrl: "https://images.unsplash.com/photo-1541888946425-d0fbb18615f3?w=800",
      projectId: project1.id,
      subcontractorId: kardeslerSubcontractor.id,
      progressBillingId: billingApproved.id,
      boqItemId: boqBetonItem.id,
      contractId: contractKalip.id,
    },
    create: {
      id: "proof-kolon-beton-dokumu",
      title: "2. Kat Kolon Beton Dökümü",
      description: "Vadi Evleri A Blok 2. kat kolon ve perde beton dökümü, slump testi 18 cm, sıcaklık 22°C. Numune küpleri alındı.",
      claimedQuantity: 45,
      approvedQuantity: 45,
      gpsLatitude: 40.9912,
      gpsLongitude: 29.0278,
      status: "APPROVED",
      engineerStatus: "APPROVED",
      managerStatus: "APPROVED",
      photoUrl: "https://images.unsplash.com/photo-1541888946425-d0fbb18615f3?w=800",
      projectId: project1.id,
      subcontractorId: kardeslerSubcontractor.id,
      progressBillingId: billingApproved.id,
      boqItemId: boqBetonItem.id,
      contractId: contractKalip.id,
    },
  })

  await prisma.workProof.upsert({
    where: { id: "proof-radye-demir-baglama" },
    update: {
      title: "Temel Radye Demir Donatı Kontrolü",
      description: "Nexa Tower Plaza - Temel radye Ø32 donatı aralıkları, sehpa demirleri ve bindirme boyları şartnameye uygun bağlandı.",
      claimedQuantity: 180,
      gpsLatitude: 41.0602,
      gpsLongitude: 28.9877,
      status: "PENDING",
      engineerStatus: "PENDING",
      managerStatus: "PENDING",
      photoUrl: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800",
      projectId: project2.id,
      subcontractorId: demirciSubcontractor.id,
      contractId: contractDemir.id,
    },
    create: {
      id: "proof-radye-demir-baglama",
      title: "Temel Radye Demir Donatı Kontrolü",
      description: "Nexa Tower Plaza - Temel radye Ø32 donatı aralıkları, sehpa demirleri ve bindirme boyları şartnameye uygun bağlandı.",
      claimedQuantity: 180,
      gpsLatitude: 41.0602,
      gpsLongitude: 28.9877,
      status: "PENDING",
      engineerStatus: "PENDING",
      managerStatus: "PENDING",
      photoUrl: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800",
      projectId: project2.id,
      subcontractorId: demirciSubcontractor.id,
      contractId: contractDemir.id,
    },
  })

  console.log("✅ GPS koordinatlı ve BoQ kalemine bağlı iş kanıtları (WorkProof) yüklendi.")

  // ============================================================================
  // 11. DİJİTAL EVRAK ARŞİVİ (DOCUMENTS - isGlobalArchive)
  // ============================================================================
  console.log("📂 11. Merkezi Dijital Evrak Arşivi Oluşturuluyor...")

  await prisma.document.upsert({
    where: { id: "doc-zemin-etud-vadi" },
    update: {
      name: "Zemin_Etüd_Raporu.pdf",
      type: "RUHSAT",
      version: 1,
      googleDriveFileId: "gdrive-zemin-101",
      googleDriveUrl: "https://drive.google.com/file/d/zemin-etud-raporu/view",
      uploadedById: contractorAdmin.id,
      status: "ACTIVE",
      tenantId: contractorTenant.id,
      isGlobalArchive: true,
      sourceModule: "PROJECTS",
      fileSizeMB: 14.6,
      notes: "Kadıköy Belediyesi Onaylı Jeolojik ve Jeoteknik Sondaj Raporu (12 Adet 30m Sondaj)",
    },
    create: {
      id: "doc-zemin-etud-vadi",
      projectId: project1.id,
      name: "Zemin_Etüd_Raporu.pdf",
      type: "RUHSAT",
      version: 1,
      googleDriveFileId: "gdrive-zemin-101",
      googleDriveUrl: "https://drive.google.com/file/d/zemin-etud-raporu/view",
      uploadedById: contractorAdmin.id,
      status: "ACTIVE",
      tenantId: contractorTenant.id,
      isGlobalArchive: true,
      sourceModule: "PROJECTS",
      fileSizeMB: 14.6,
      notes: "Kadıköy Belediyesi Onaylı Jeolojik ve Jeoteknik Sondaj Raporu (12 Adet 30m Sondaj)",
    },
  })

  await prisma.document.upsert({
    where: { id: "doc-statik-proje-vadi" },
    update: {
      name: "A_Blok_Statik_Proje.dwg",
      type: "STATIK_PROJE",
      version: 2,
      googleDriveFileId: "gdrive-statik-102",
      googleDriveUrl: "https://drive.google.com/file/d/statik-proje-dwg/view",
      uploadedById: contractorAdmin.id,
      status: "ACTIVE",
      tenantId: contractorTenant.id,
      isGlobalArchive: true,
      sourceModule: "BIM",
      fileSizeMB: 22.4,
      notes: "Revize Radye Temel & Kolon Aplikasyon Paftaları (TBDY-2018 Uyumlu)",
    },
    create: {
      id: "doc-statik-proje-vadi",
      projectId: project1.id,
      name: "A_Blok_Statik_Proje.dwg",
      type: "STATIK_PROJE",
      version: 2,
      googleDriveFileId: "gdrive-statik-102",
      googleDriveUrl: "https://drive.google.com/file/d/statik-proje-dwg/view",
      uploadedById: contractorAdmin.id,
      status: "ACTIVE",
      tenantId: contractorTenant.id,
      isGlobalArchive: true,
      sourceModule: "BIM",
      fileSizeMB: 22.4,
      notes: "Revize Radye Temel & Kolon Aplikasyon Paftaları (TBDY-2018 Uyumlu)",
    },
  })

  await prisma.document.upsert({
    where: { id: "doc-ruhsat-onayi-vadi" },
    update: {
      name: "Ruhsat_Onayi.pdf",
      type: "RUHSAT",
      version: 1,
      googleDriveFileId: "gdrive-ruhsat-103",
      googleDriveUrl: "https://drive.google.com/file/d/ruhsat-onayi/view",
      uploadedById: contractorAdmin.id,
      status: "ACTIVE",
      tenantId: contractorTenant.id,
      isGlobalArchive: true,
      sourceModule: "PROJECTS",
      fileSizeMB: 6.2,
      notes: "Kadıköy İmar Müdürlüğü Yeni Yapı Ruhsatı ve Ekleri (YİBF No: 14582)",
    },
    create: {
      id: "doc-ruhsat-onayi-vadi",
      projectId: project1.id,
      name: "Ruhsat_Onayi.pdf",
      type: "RUHSAT",
      version: 1,
      googleDriveFileId: "gdrive-ruhsat-103",
      googleDriveUrl: "https://drive.google.com/file/d/ruhsat-onayi/view",
      uploadedById: contractorAdmin.id,
      status: "ACTIVE",
      tenantId: contractorTenant.id,
      isGlobalArchive: true,
      sourceModule: "PROJECTS",
      fileSizeMB: 6.2,
      notes: "Kadıköy İmar Müdürlüğü Yeni Yapı Ruhsatı ve Ekleri (YİBF No: 14582)",
    },
  })

  await prisma.document.upsert({
    where: { id: "doc-balkan-denetim-uygunluk" },
    update: {
      name: "Yapi_Denetim_Uygunluk_Belgesi.pdf",
      type: "YAPI_KULLANMA",
      version: 1,
      googleDriveFileId: "gdrive-denetim-104",
      googleDriveUrl: "https://drive.google.com/file/d/balkan-uygunluk/view",
      uploadedById: inspectionAdmin.id,
      status: "ACTIVE",
      tenantId: inspectionTenant.id,
      isGlobalArchive: true,
      sourceModule: "INSPECTION_FORM",
      fileSizeMB: 8.5,
      notes: "Bakanlık UYDS onaylı Kaba Yapı Taşıyıcı Sistem İnceleme ve Uygunluk Tutanağı",
    },
    create: {
      id: "doc-balkan-denetim-uygunluk",
      projectId: project1.id,
      name: "Yapi_Denetim_Uygunluk_Belgesi.pdf",
      type: "YAPI_KULLANMA",
      version: 1,
      googleDriveFileId: "gdrive-denetim-104",
      googleDriveUrl: "https://drive.google.com/file/d/balkan-uygunluk/view",
      uploadedById: inspectionAdmin.id,
      status: "ACTIVE",
      tenantId: inspectionTenant.id,
      isGlobalArchive: true,
      sourceModule: "INSPECTION_FORM",
      fileSizeMB: 8.5,
      notes: "Bakanlık UYDS onaylı Kaba Yapı Taşıyıcı Sistem İnceleme ve Uygunluk Tutanağı",
    },
  })

  console.log("✅ 4 adet merkezi arşiv evrakı (Zemin Etüd, Statik DWG, Ruhsat, Uygunluk) yüklendi.")

  // ============================================================================
  // 12. KALİTE VE DÖF (NCR - UYGUNSUZLUK RAPORLARI)
  // ============================================================================
  console.log("⚠️ 12. Saha Kalite & DÖF (NCR) Uygunsuzluk Raporları Ekleniyor...")

  // Kritik Hata: Açık (C35 Beton Mukavemet Düşüklüğü)
  await prisma.nonConformance.upsert({
    where: { reportNo: "NCR-2026-001" },
    update: {
      description: "C35 Beton Mukavemet Düşüklüğü (Kırmızı/Kritik) - 7 günlük laboratuvar basınç kırımı fcm: 26.4 MPa ölçüldü. Şartname sınırı 30 MPa altında.",
      status: "OPEN",
      severity: "CRITICAL",
      deadline: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000),
      photos: ["https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800"],
      projectId: project1.id,
      creatorId: inspectionAdmin.id,
    },
    create: {
      reportNo: "NCR-2026-001",
      description: "C35 Beton Mukavemet Düşüklüğü (Kırmızı/Kritik) - 7 günlük laboratuvar basınç kırımı fcm: 26.4 MPa ölçüldü. Şartname sınırı 30 MPa altında.",
      status: "OPEN",
      severity: "CRITICAL",
      deadline: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000),
      photos: ["https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800"],
      projectId: project1.id,
      creatorId: inspectionAdmin.id,
      subcontractorId: kardeslerSubcontractor.id,
    },
  })

  // Orta Hata: Çözüldü (Eksik Paspayı Bırakılması)
  await prisma.nonConformance.upsert({
    where: { reportNo: "NCR-2026-002" },
    update: {
      description: "Eksik Paspayı Bırakılması (Sarı/Orta) - B Blok 2. kat kolon donatısında kalıp temas riski tespit edildi. Plastik paspayı elemanları tamamlatıldı.",
      status: "RESOLVED",
      severity: "MEDIUM",
      deadline: daysAgo(1),
      photos: ["https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800"],
      projectId: project1.id,
      creatorId: contractorAdmin.id,
    },
    create: {
      reportNo: "NCR-2026-002",
      description: "Eksik Paspayı Bırakılması (Sarı/Orta) - B Blok 2. kat kolon donatısında kalıp temas riski tespit edildi. Plastik paspayı elemanları tamamlatıldı.",
      status: "RESOLVED",
      severity: "MEDIUM",
      deadline: daysAgo(1),
      photos: ["https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800"],
      projectId: project1.id,
      creatorId: contractorAdmin.id,
      subcontractorId: demirciSubcontractor.id,
    },
  })

  // NonConformanceReport Tablosu Simülasyonu
  await prisma.nonConformanceReport.createMany({
    data: [
      {
        location: "Vadi Evleri A Blok - Zemin Kat Kolonları",
        issueType: "C35 Beton Mukavemet Düşüklüğü (Kırmızı/Kritik)",
        description: "Karot alma ve Schmidt çekici testi talep edildi. Döküm durduruldu.",
        subcontractor: "Kardeşler Kalıp & Hazır Beton Ekibi",
        status: "Açık",
        dueDate: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000),
      },
      {
        location: "Nexa Tower Plaza - Temel Perdesi",
        issueType: "Eksik Paspayı Bırakılması (Sarı/Orta)",
        description: "Perde dış donatısında 5 cm yerine 2.5 cm paspayı ölçüldü. Ek paspayları yerleştirildi ve düzeltildi.",
        subcontractor: "Demirci Ustaları Ltd.",
        status: "Kapalı",
        dueDate: daysAgo(2),
      },
    ],
    skipDuplicates: true,
  })

  console.log("✅ DÖF / NCR kayıtları girildi: Biri Açık (Kritik), Biri Çözüldü (Orta).")

  // ============================================================================
  // 13. DİNAMİK DENETİM FORMLARI & VİZELER (INSPECTION FORMS)
  // ============================================================================
  console.log("📝 13. Yapı Denetim Formları (Kalıp Kontrol & Demir Vizesi) Ekleniyor...")

  await prisma.inspectionForm.createMany({
    data: [
      {
        formType: "KALITE",
        projectId: project1.id,
        inspectorId: inspectionAdmin.id,
        isPassed: true,
        formData: {
          title: "Kalıp Kontrol Tutanağı",
          inspectionDate: daysAgo(4).toISOString(),
          floor: "3. Kat",
          axis: "A-D / 1-4 Aksları",
          checks: {
            moldCleanliness: "UYGUN",
            strutSupportSpacing: "80 cm - UYGUN",
            formworkPlumbness: "Lazer Şakülünde - KUSURSUZ",
            moldReleaseAgentApplied: "EVET",
          },
          inspectorNotes: "Kalıp terazisi ve sehim kontrolleri şartnameye uygun. Beton dökümüne izin verildi.",
          approvedBy: "Mimar Selim Balkan (Başdenetçi)",
        },
      },
      {
        formType: "DEMIR_VIZE",
        projectId: project1.id,
        inspectorId: inspectionAdmin.id,
        isPassed: true,
        formData: {
          title: "Demir Vize Formu",
          inspectionDate: daysAgo(5).toISOString(),
          floor: "3. Kat Tabliye ve Kolonlar",
          checks: {
            rebarDiameterAndGrade: "B420C Ø14 / Ø20 - ONAYLI",
            stirrupSpacingDenseZone: "10 cm - UYGUN",
            stirrupSpacingMidZone: "20 cm - UYGUN",
            hookBends135Degrees: "EVET - 135 Derece Kanca Mevcut",
            spliceLapLength: "65 cm (>= 50d) - UYGUN",
            concreteCoverSpacers: "Plastik Paspayı 3 cm - TAMAM",
          },
          inspectorNotes: "Bakanlık e-YİBF sistemine demir donatı vizesi işlendi. Fotoğraflar yüklendi.",
          approvedBy: "Mimar Selim Balkan (Başdenetçi)",
        },
      },
    ],
    skipDuplicates: true,
  })

  // DynamicForm ve FormSubmission kayıtları
  const existingDynamicForms = await prisma.dynamicForm.count()
  if (existingDynamicForms === 0) {
    const dynForm = await prisma.dynamicForm.create({
      data: {
        title: "Kalıp ve Donatı Teslim Tutanağı (Saha)",
        category: "Kalıp & Donatı",
        description: "Beton dökümü öncesi aks, düşeylik ve donatı vizesi kontrol şablonu.",
        fields: [
          { id: "f1", type: "text", label: "Blok ve Kat Bilgisi", required: true },
          { id: "f2", type: "checkbox", label: "Paspayları şartnameye uygun mu?", required: true },
          { id: "f3", type: "select", label: "Döküm Kararı", options: ["Onaylandı", "Eksikler Giderilsin", "Reddedildi"], required: true },
        ],
      },
    })

    await prisma.formSubmission.create({
      data: {
        formId: dynForm.id,
        projectId: project1.id,
        userId: contractorAdmin.id,
        answers: {
          f1: "Vadi Evleri A Blok - 3. Kat Kolonlar",
          f2: true,
          f3: "Onaylandı",
        },
        status: "COMPLETED",
        notes: "Müşavir kontrolü sonrası beton pompası sahaya çağrıldı.",
      },
    })
  }

  console.log("✅ Kalıp Kontrol ve Demir Vize formları JSON verileriyle kaydedildi.")

  // ============================================================================
  // 14. DESTEK TALEPLERİ (TICKETS - SUPERADMIN İÇİN)
  // ============================================================================
  console.log("🎫 14. Superadmin Destek Biletleri (Support Tickets) Tanımlanıyor...")

  await prisma.supportTicket.upsert({
    where: { id: "ticket-bim-render" },
    update: {
      subject: "3D BIM Yüklenmiyor",
      message: "42 katlı Nexa Tower IFC modeli web viewer üzerinden yüklenirken WebGL bellek hatası veriyor, optimizasyon rica ederiz.",
      status: "OPEN",
      priority: "HIGH",
      tenantId: contractorTenant.id,
      userId: contractorAdmin.id,
    },
    create: {
      id: "ticket-bim-render",
      subject: "3D BIM Yüklenmiyor",
      message: "42 katlı Nexa Tower IFC modeli web viewer üzerinden yüklenirken WebGL bellek hatası veriyor, optimizasyon rica ederiz.",
      status: "OPEN",
      priority: "HIGH",
      tenantId: contractorTenant.id,
      userId: contractorAdmin.id,
    },
  })

  await prisma.supportTicket.upsert({
    where: { id: "ticket-storage-upgrade" },
    update: {
      subject: "Kota Artırımı Talebi",
      message: "Şantiyelerimizden yüklenen 4K drone ortofoto ve taranan faturalar nedeniyle 100 GB kota sınırımıza yaklaştık. Ek 100 GB depolama paketi istiyoruz.",
      status: "IN_PROGRESS",
      priority: "MEDIUM",
      response: "Talebiniz inceleniyor. 100 GB ek paket faturası oluşturulduktan sonra tanımlanacaktır.",
      tenantId: contractorTenant.id,
      userId: contractorAdmin.id,
    },
    create: {
      id: "ticket-storage-upgrade",
      subject: "Kota Artırımı Talebi",
      message: "Şantiyelerimizden yüklenen 4K drone ortofoto ve taranan faturalar nedeniyle 100 GB kota sınırımıza yaklaştık. Ek 100 GB depolama paketi istiyoruz.",
      status: "IN_PROGRESS",
      priority: "MEDIUM",
      response: "Talebiniz inceleniyor. 100 GB ek paket faturası oluşturulduktan sonra tanımlanacaktır.",
      tenantId: contractorTenant.id,
      userId: contractorAdmin.id,
    },
  })

  console.log("✅ 2 Destek Talebi (3D BIM ve Kota Artırımı) eklendi.")

  // ============================================================================
  // 15. SİSTEM HATA LOGLARI (SYSTEM ERROR LOG - TELEMETRİ)
  // ============================================================================
  console.log("🚨 15. Superadmin Hata Radarı (SystemErrorLog) Oluşturuluyor...")

  await prisma.systemErrorLog.upsert({
    where: { id: "log-ocr-pdf-corrupted" },
    update: {
      module: "INSPECTION_OCR",
      errorMessage: "OCR belgesi okunamadı (PDF Corrupted): Bakanlık onaylı YİBF tarama PDF'inde geçersiz akış başlığı.",
      errorStack: "Error: Invalid PDF stream at PdfParser.parseBuffer (/node_modules/pdf-parse/lib/index.js:42:15)\n    at async POST (/app/api/documents/ocr/route.ts:58:24)",
      isResolved: false,
      tenantId: inspectionTenant.id,
      userId: inspectionAdmin.id,
    },
    create: {
      id: "log-ocr-pdf-corrupted",
      module: "INSPECTION_OCR",
      errorMessage: "OCR belgesi okunamadı (PDF Corrupted): Bakanlık onaylı YİBF tarama PDF'inde geçersiz akış başlığı.",
      errorStack: "Error: Invalid PDF stream at PdfParser.parseBuffer (/node_modules/pdf-parse/lib/index.js:42:15)\n    at async POST (/app/api/documents/ocr/route.ts:58:24)",
      isResolved: false,
      tenantId: inspectionTenant.id,
      userId: inspectionAdmin.id,
    },
  })

  console.log("✅ Çözülmemiş OCR PDF hata logu kaydedildi.")

  return {
    success: true,
    message: "Tüm modüller için kapsamlı sunum ve demo verileri başarıyla yüklendi!",
    tenants: [contractorTenant.slug, inspectionTenant.slug],
    users: [contractorAdmin.email, inspectionAdmin.email, superAdmin.email],
    projects: [project1.name, project2.name, project3.name],
    modulesSeeded: [
      "HR_PERSONNEL",
      "SUBCONTRACTORS",
      "CONTRACTS",
      "PROGRESS_BILLING",
      "WORK_PROOFS",
      "GLOBAL_DOCUMENTS",
      "QUALITY_NCR",
      "INSPECTION_FORMS",
      "SUPPORT_TICKETS",
      "ERROR_LOGS",
      "FINANCE_TRANSACTIONS",
    ],
  }
}

// CLI doğrudan çalıştırma desteği (Next.js import edildiğinde otomatik tetiklenmez)
if (typeof window === "undefined" && !process.env.NEXT_RUNTIME && typeof require !== "undefined" && require.main === module) {
  seedDatabase()
    .then((res) => {
      console.log("\n========================================================")
      console.log("🎉 TÜM MODÜLLER İÇİN DEMO SEED TAMAMLANDI! GİRİŞ BİLGİLERİ:")
      console.log("--------------------------------------------------------")
      console.log("Müteahhit Girişi:  admin@nexa.com   | Şifre: nexa2026 (Nexa İnşaat A.Ş.)")
      console.log("Denetim Girişi:    denetim@nexa.com | Şifre: nexa2026 (Balkan Yapı Denetim)")
      console.log("Superadmin:        superadmin@nxa.com.tr | Şifre: nexa2026")
      console.log("========================================================\n")
    })
    .catch((e) => {
      console.error("❌ Seed Hatası:", e)
      process.exit(1)
    })
    .finally(async () => {
      await prisma.$disconnect()
    })
}