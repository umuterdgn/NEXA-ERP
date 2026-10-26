/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Comprehensive Presentation / Demo Seed Script for Nexa ERP
 * Multi-Tenant: Nexa İnşaat A.Ş. & Balkan Yapı Denetim Ltd.
 */

import { PrismaClient, CompanyType, UserRole } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

export async function seedDatabase() {
  console.log("🚀 Nexa ERP Sunum ve Demo Verileri Yükleniyor...")

  const defaultPassword = await bcrypt.hash("nexa2026", 10)

  // ============================================================================
  // 1. FİRMALAR (TENANTS)
  // ============================================================================
  console.log("🏢 1. Kiracı Firmalar (Tenants) Oluşturuluyor...")

  // Müteahhit Firması: Nexa İnşaat A.Ş.
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
        "BOQ_METRAJ"
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
        "BOQ_METRAJ"
      ],
      features: ["BIM_VIEWER", "AI_VISION", "OCR", "DRONE"],
      primaryColor: "#3B82F6",
      isWhiteLabelActive: true,
      isActive: true,
      paymentStatus: "PAID",
    },
  })

  // Yapı Denetim Firması: Balkan Yapı Denetim Ltd.
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
        "AI_VISION"
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
        "AI_VISION"
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

  console.log(`✅ Müteahhit Patron: ${contractorAdmin.email} (Rol: ${contractorAdmin.role})`)
  console.log(`✅ Denetim Patronu: ${inspectionAdmin.email} (Rol: ${inspectionAdmin.role})`)
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

  // Proje 1: Vadi Evleri A Blok (Kadıköy)
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

  // Proje 2: Nexa Tower Plaza (Şişli)
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

  // Proje 3: Arsuz Sahil Konakları (Hatay)
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
  // 6. KEŞİF & METRAJ (BoQ Items)
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

  console.log("✅ C35 Beton, Ø14 Nervürlü Çelik ve C50 BoQ kalemleri projelerine bağlandı.")

  // ============================================================================
  // 7. KASA, FİNANS VE GELİR/GİDER İŞLEMLERİ (Transactions)
  // ============================================================================
  console.log("💰 7. Kasa, Banka ve Finans Hareketleri Ekleniyor...")

  const now = new Date()
  const daysAgo = (days: number) => new Date(now.getTime() - days * 24 * 60 * 60 * 1000)

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

  return {
    success: true,
    message: "Seed verileri başarıyla yüklendi",
    tenants: [contractorTenant.slug, inspectionTenant.slug],
    users: [contractorAdmin.email, inspectionAdmin.email, superAdmin.email],
    projects: [project1.name, project2.name, project3.name],
  }
}

// CLI doğrudan çalıştırma desteği (Next.js import edildiğinde otomatik tetiklenmez)
if (typeof window === "undefined" && !process.env.NEXT_RUNTIME && typeof require !== "undefined" && require.main === module) {
  seedDatabase()
    .then((res) => {
      console.log("\n========================================================")
      console.log("🎉 MÜŞTERİ SUNUMU SEED TAMAMLANDI! GİRİŞ BİLGİLERİ:")
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