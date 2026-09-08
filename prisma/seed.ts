/**
 * 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * This code is the property of NXA Software.
 */

import { PrismaClient, CompanyType, UserRole, Gender, EmploymentType, PersonelStatus } from "@prisma/client"
import bcrypt from "bcryptjs"

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

  const hashedPassword = await bcrypt.hash("admin123", 10)
  const demoPassword = await bcrypt.hash("123456", 10)

  // ============================================================================
  // DEMO KULLANICILAR (Quick Login için)
  // ============================================================================
  console.log(" Creating demo users for quick login...")

  // Müteahhit Yöneticisi
  await prisma.user.upsert({
    where: { email: "admin@nexa.com" },
    update: {},
    create: {
      email: "admin@nexa.com",
      password: demoPassword,
      name: "Müteahhit Yöneticisi",
      role: UserRole.ADMIN,
      companyType: CompanyType.MAIN_CONTRACTOR,
      permissions: ["dashboard", "projects", "personnel", "finance", "inventory", "subcontractors", "contracts", "procurement"]
    }
  })

  // Yapı Denetim Yöneticisi
  await prisma.user.upsert({
    where: { email: "denetim@nexa.com" },
    update: {},
    create: {
      email: "denetim@nexa.com",
      password: demoPassword,
      name: "Yapı Denetim Yöneticisi",
      role: UserRole.ADMIN,
      companyType: CompanyType.INSPECTION,
      permissions: ["dashboard", "inspection", "reports", "documents", "qa-qc", "isg"]
    }
  })

  // Saha Personeli
  await prisma.user.upsert({
    where: { email: "personel@nexa.com" },
    update: {},
    create: {
      email: "personel@nexa.com",
      password: demoPassword,
      name: "Saha Personeli",
      role: UserRole.STAFF,
      companyType: CompanyType.MAIN_CONTRACTOR,
      permissions: ["my-tasks", "my-attendance", "my-salary"]
    }
  })

  console.log(` Created demo user: admin@nexa.com (Müteahhit Yöneticisi)`)
  console.log(` Created demo user: denetim@nexa.com (Yapı Denetim Yöneticisi)`)
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
    update: {},
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
      managerId: patron.id,
      siteManager: "Ahmet Yılmaz",
      engineer: "Mehmet Demir",
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
  // TAŞERON FİRMALARI (SUBCONTRACTORS)
  // ============================================================================
  console.log(" Creating subcontractor companies...")

  const yildizDemirci = await prisma.company.upsert({
    where: { id: "sub-yildiz" },
    update: {},
    create: {
      id: "sub-yildiz",
      name: "Yıldız Demirci Ltd. Şti.",
      type: CompanyType.SUBCONTRACTOR,
      contactName: "Hasan Yıldız",
      phone: "+90 532 111 2233",
      email: "info@yildizdemirci.com",
      taxNumber: "5555555555",
      taxOffice: "Gaziosmanpaşa Vergi Dairesi"
    }
  })

  const guvenKalip = await prisma.company.upsert({
    where: { id: "sub-guven" },
    update: {},
    create: {
      id: "sub-guven",
      name: "Güven Kalıpçılık",
      type: CompanyType.SUBCONTRACTOR,
      contactName: "İsmail Güven",
      phone: "+90 533 444 5566",
      email: "info@guvenkalip.com",
      taxNumber: "6666666666",
      taxOffice: "Ümraniye Vergi Dairesi"
    }
  })

  const apexElektrik = await prisma.company.upsert({
    where: { id: "sub-apex" },
    update: {},
    create: {
      id: "sub-apex",
      name: "Apex Elektrik",
      type: CompanyType.SUBCONTRACTOR,
      contactName: "Kemal Apex",
      phone: "+90 534 777 8899",
      email: "info@apexelektrik.com",
      taxNumber: "7777777777",
      taxOffice: "Kartal Vergi Dairesi"
    }
  })

  console.log(` Created ${yildizDemirci.name}`)
  console.log(` Created ${guvenKalip.name}`)
  console.log(` Created ${apexElektrik.name}`)

  // ============================================================================
  // TAŞERON SÖZLEŞMELERİ (SUBCONTRACTOR CONTRACTS)
  // ============================================================================
  console.log(" Creating subcontractor contracts...")

  await prisma.subcontractorContract.create({
    data: {
      contractType: "UNIT_PRICE",
      totalValue: 3500000,
      startDate: new Date("2024-01-15"),
      endDate: new Date("2025-12-31"),
      status: "ACTIVE",
      notes: "Demir işleri birim fiyat sözleşmesi",
      projectId: vadiEvleri.id,
      subcontractorId: yildizDemirci.id
    }
  })

  await prisma.subcontractorContract.create({
    data: {
      contractType: "LUMP_SUM",
      totalValue: 2800000,
      startDate: new Date("2024-02-01"),
      endDate: new Date("2025-06-30"),
      status: "ACTIVE",
      notes: "Kalıp işleri toplam fiyat sözleşmesi",
      projectId: vadiEvleri.id,
      subcontractorId: guvenKalip.id
    }
  })

  await prisma.subcontractorContract.create({
    data: {
      contractType: "UNIT_PRICE",
      totalValue: 4200000,
      startDate: new Date("2024-03-01"),
      endDate: new Date("2026-03-31"),
      status: "ACTIVE",
      notes: "Elektrik tesisatı birim fiyat sözleşmesi",
      projectId: nexaPlaza.id,
      subcontractorId: apexElektrik.id
    }
  })

  console.log(" Created 3 subcontractor contracts")

  // ============================================================================
  // HAKEDİŞLER (PROGRESS BILLINGS)
  // ============================================================================
  console.log(" Creating progress billings...")

  await prisma.progressBilling.create({
    data: {
      periodMonth: 1,
      periodYear: 2024,
      totalAmount: 450000,
      netAmount: 435000,
      status: "PAID",
      notes: "Ocak ayı hakedişi - Demir işleri",
      projectId: vadiEvleri.id,
      subcontractorId: yildizDemirci.id
    }
  })

  await prisma.progressBilling.create({
    data: {
      periodMonth: 2,
      periodYear: 2024,
      totalAmount: 520000,
      netAmount: 505000,
      status: "PAID",
      notes: "Şubat ayı hakedişi - Kalıp işleri",
      projectId: vadiEvleri.id,
      subcontractorId: guvenKalip.id
    }
  })

  await prisma.progressBilling.create({
    data: {
      periodMonth: 3,
      periodYear: 2024,
      totalAmount: 380000,
      netAmount: 370000,
      status: "APPROVED",
      notes: "Mart ayı hakedişi - Elektrik işleri",
      projectId: nexaPlaza.id,
      subcontractorId: apexElektrik.id
    }
  })

  console.log(" Created 3 progress billings")

  // ============================================================================
  // KESİNTİLER VE CEZALAR (DEDUCTIONS)
  // ============================================================================
  console.log(" Creating deductions...")

  await prisma.deduction.create({
    data: {
      amount: 15000,
      reason: "İş programına uyulmaması nedeniyle gecikme cezası",
      date: new Date("2024-02-15"),
      notes: "1 hafta gecikme için %3 ceza uygulanmıştır",
      projectId: vadiEvleri.id,
      subcontractorId: yildizDemirci.id
    }
  })

  await prisma.deduction.create({
    data: {
      amount: 8000,
      reason: "Kalite uygunsuzluğu - Kalıp yüzeyi düzensizliği",
      date: new Date("2024-03-01"),
      notes: "TS 500 standartlarına uygun olmayan kalıp yüzeyleri",
      projectId: vadiEvleri.id,
      subcontractorId: guvenKalip.id
    }
  })

  await prisma.deduction.create({
    data: {
      amount: 12000,
      reason: "İSG kurallarına uyulmaması",
      date: new Date("2024-03-10"),
      notes: "Baret takmayan personel tespiti",
      projectId: nexaPlaza.id,
      subcontractorId: apexElektrik.id
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

  console.log(" Created 3 shifts")

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
  console.log("   - 3 Shifts")
  console.log("   - CMS Content (About, Services, Projects)")
  console.log("   - 3 Contract Templates")

  console.log("\n")
  console.log("════════════════════════════════════════════════════════════════")
  console.log("                    GİRİŞ BİLGİLERİ (LOGIN CREDENTIALS)")
  console.log("════════════════════════════════════════════════════════════════")
  console.log("\n")
  console.log("🏗️  MÜTEAHHİT GİRİŞİ (MAIN CONTRACTOR):")
  console.log("   E-posta: patron@mahirbakay.com")
  console.log("   Şifre:   admin123")
  console.log("   Rol:     Super Admin")
  console.log("\n")
  console.log("🏛️  YAPI DENETİM GİRİŞİ (INSPECTION):")
  console.log("   E-posta: ahmet.yilmaz@mahirbakay.com")
  console.log("   Şifre:   admin123")
  console.log("   Rol:     Denetçi (Engineer)")
  console.log("\n")
  console.log("👷  KONTROL ELEMANI GİRİŞİ:")
  console.log("   E-posta: ali.ozturk@mahirbakay.com")
  console.log("   Şifre:   admin123")
  console.log("   Rol:     Kontrol Elemanı (Staff)")
  console.log("\n")
  console.log("════════════════════════════════════════════════════════════════")
}

main()
  .catch((e) => {
    console.error(" Seed failed:", e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })