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

  // Patron / Super Admin
  const patron = await prisma.user.upsert({
    where: { email: "patron@mahirbakay.com" },
    update: {},
    create: {
      email: "patron@mahirbakay.com",
      password: hashedPassword,
      name: "Mahir Bakay",
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
      contractorName: "Mahir Bakay Mühendislik",
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
      contractorName: "Mahir Bakay Mühendislik",
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
      contractorName: "Mahir Bakay Mühendislik",
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
      content: "Mahir Bakay Mühendislik olarak 20 yılı aşkın tecrübemizle inşaat sektöründe yenilikçi ve sürdürülebilir çözümler sunuyoruz. Kalite ve güvenilirlik ilkesiyle projelerimize hayat veriyoruz. Yapı denetim, statik hesap, mimari tasarım ve proje yönetimi alanlarında uzman kadromuzla hizmet veriyoruz.",
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

  console.log(" Seed completed successfully!")
  console.log(" Summary:")
  console.log("   - 2 Companies (INSPECTION, CONTRACTOR)")
  console.log("   - 3 Users (Patron, Denetçi, Kontrol Elemanı)")
  console.log("   - 3 Personnel Records")
  console.log("   - 3 YİBF Projects (LOW, MEDIUM, HIGH Risk)")
  console.log("   - 6 Inspection Records")
  console.log("   - 5 Deficiencies")
  console.log("   - 7 YİBF Events")
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