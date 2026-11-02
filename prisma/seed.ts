/**
 * © 2026 Nexa ERP. All rights reserved.
 * Developer: Umut Erdoğan
 * Comprehensive Presentation / Demo Seed Script for Nexa ERP
 * 
 * ADIM 2: Gerçekçi Senaryo Verileri:
 * 1. Proje & Şantiye: "Vadi Evleri 3. Etap" mega karma konut projesi.
 * 2. Kullanıcılar: 1 Admin (Umut Erdoğan), 3 Şantiye Şefi, 15 Taşeron, 50 Saha Personeli.
 * 3. Metraj (BoQ): C30 Beton, S420 Demir, Duvar vb. 20 kalemlik doluluk oranları (%45, %80 vb.) içeren BoQ satırları.
 * 4. Jurnaller & İş Emirleri: Geriye dönük son 15 gün için yazılmış, hava durumu verileri girilmiş şantiye jurnalleri ve 30 adet tamamlanmış görev.
 * 5. İSG İhlalleri: Haritada görünecek 3 risk bölgesi ve 5 açık İSG cezası/ihlali.
 */

import {
  PrismaClient,
  CompanyType,
  UserRole,
  PersonelStatus,
  Gender,
  EmploymentType,
  TaskStatus,
  TaskPriority,
  Department,
  IsgReportType,
  IsgReportStatus,
} from "@prisma/client";
import { faker, fakerTR } from "@faker-js/faker";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

export async function seedDatabase() {
  console.log("================================================================================");
  console.log("🚀 NEXA ERP - KAPSAMLI SUNUM & DEMO VERİLERİ (SEED) BAŞLATILIYOR...");
  console.log("================================================================================");

  const defaultPassword = await bcrypt.hash("nexa2026", 10);
  const now = new Date();
  const daysAgo = (days: number) => new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

  // ============================================================================
  // 1. KIRACI FİRMA & ŞİRKET (TENANT & COMPANY)
  // ============================================================================
  console.log("🏢 1. Ana Kiracı (Tenant) ve Müteahhit Şirketi Hazırlanıyor...");

  const tenant = await prisma.tenant.upsert({
    where: { slug: "nexa-insaat" },
    update: {
      name: "Nexa İnşaat A.Ş.",
      domain: "portal.nexa.com.tr",
      type: CompanyType.MAIN_CONTRACTOR,
      subscriptionPlan: "ENTERPRISE",
      status: "ACTIVE",
      licenses: 250,
      maxUsers: 250,
      maxStorageMB: 102400,
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
        "OHS",
      ],
      features: ["BIM_VIEWER", "AI_VISION", "OCR", "DRONE", "GEOFENCING", "SOCKET_STREAM"],
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
      licenses: 250,
      maxUsers: 250,
      maxStorageMB: 102400,
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
        "OHS",
      ],
      features: ["BIM_VIEWER", "AI_VISION", "OCR", "DRONE", "GEOFENCING", "SOCKET_STREAM"],
      primaryColor: "#3B82F6",
      isWhiteLabelActive: true,
      isActive: true,
      paymentStatus: "PAID",
    },
  });

  const company = await prisma.company.upsert({
    where: { slug: "nexa-insaat-as" },
    update: {
      name: "Nexa İnşaat A.Ş.",
      tenantId: tenant.id,
      companyType: "CONTRACTOR",
      type: CompanyType.MAIN_CONTRACTOR,
      taxNumber: "6310482910",
      taxOffice: "Büyük Mükellefler V.D.",
      phone: "+90 212 444 6392",
      email: "info@nexa.com.tr",
      themeColor: "#2563EB",
    },
    create: {
      name: "Nexa İnşaat A.Ş.",
      slug: "nexa-insaat-as",
      tenantId: tenant.id,
      companyType: "CONTRACTOR",
      type: CompanyType.MAIN_CONTRACTOR,
      taxNumber: "6310482910",
      taxOffice: "Büyük Mükellefler V.D.",
      phone: "+90 212 444 6392",
      email: "info@nexa.com.tr",
      themeColor: "#2563EB",
    },
  });

  // ============================================================================
  // 2. KULLANICILAR: 1 ADMIN (SEN), 3 ŞANTİYE ŞEFİ, 15 TAŞERON, 50 SAHA PERSONELİ
  // ============================================================================
  console.log("👥 2. Kullanıcılar ve Ekipler Oluşturuluyor...");

  // 1 Admin (Sen - Umut Erdoğan)
  const adminUser = await prisma.user.upsert({
    where: { email: "admin@nexa.com.tr" },
    update: {
      name: "Umut Erdoğan",
      password: defaultPassword,
      role: UserRole.ADMIN,
      companyId: company.id,
      tenantId: tenant.id,
      phone: "+90 532 555 2026",
      currentLat: 41.0851,
      currentLng: 28.8021,
      lastLocationUpdate: now,
      permissions: ["*"],
    },
    create: {
      email: "admin@nexa.com.tr",
      name: "Umut Erdoğan",
      password: defaultPassword,
      role: UserRole.ADMIN,
      companyId: company.id,
      tenantId: tenant.id,
      phone: "+90 532 555 2026",
      currentLat: 41.0851,
      currentLng: 28.8021,
      lastLocationUpdate: now,
      permissions: ["*"],
    },
  });

  // Geriye dönük uyumluluk için admin@nexa.com
  await prisma.user.upsert({
    where: { email: "admin@nexa.com" },
    update: {
      name: "Umut Erdoğan",
      password: defaultPassword,
      role: UserRole.ADMIN,
      companyId: company.id,
      tenantId: tenant.id,
    },
    create: {
      email: "admin@nexa.com",
      name: "Umut Erdoğan",
      password: defaultPassword,
      role: UserRole.ADMIN,
      companyId: company.id,
      tenantId: tenant.id,
    },
  });

  console.log(`  ✅ 1 Admin: ${adminUser.name} (${adminUser.email})`);

  // 3 Şantiye Şefi
  const siteManagerData = [
    { name: "İnş. Müh. Barış Demir", email: "sefi1@nxerp.com.tr", phone: "+90 533 111 2233" },
    { name: "İnş. Müh. Selin Aydın", email: "sefi2@nxerp.com.tr", phone: "+90 533 222 3344" },
    { name: "İnş. Müh. Caner Koç", email: "sefi3@nxerp.com.tr", phone: "+90 533 333 4455" },
  ];

  const siteManagers = [];
  for (const mgr of siteManagerData) {
    const user = await prisma.user.upsert({
      where: { email: mgr.email },
      update: {
        name: mgr.name,
        password: defaultPassword,
        role: UserRole.SITE_MANAGER,
        companyId: company.id,
        tenantId: tenant.id,
        phone: mgr.phone,
        currentLat: 41.085 + (Math.random() - 0.5) * 0.002,
        currentLng: 28.802 + (Math.random() - 0.5) * 0.002,
        lastLocationUpdate: now,
      },
      create: {
        email: mgr.email,
        name: mgr.name,
        password: defaultPassword,
        role: UserRole.SITE_MANAGER,
        companyId: company.id,
        tenantId: tenant.id,
        phone: mgr.phone,
        currentLat: 41.085 + (Math.random() - 0.5) * 0.002,
        currentLng: 28.802 + (Math.random() - 0.5) * 0.002,
        lastLocationUpdate: now,
      },
    });
    siteManagers.push(user);
  }
  console.log(`  ✅ 3 Şantiye Şefi oluşturuldu: ${siteManagers.map((s) => s.name).join(", ")}`);

  // ============================================================================
  // 3. PROJE & ŞANTİYE: "Vadi Evleri 3. Etap"
  // ============================================================================
  console.log("🏗️ 3. Mega Proje Tanımlanıyor: 'Vadi Evleri 3. Etap'...");

  let project = await prisma.project.findFirst({
    where: { name: "Vadi Evleri 3. Etap" },
  });

  if (!project) {
    project = await prisma.project.create({
      data: {
        name: "Vadi Evleri 3. Etap",
        title: "Vadi Evleri 3. Etap",
        description:
          "12 Blok, 840 Bağımsız Bölüm, Ticari Alanlar, Kapalı Otopark ve Sosyal Tesislerden oluşan karma lüks konut projesi.",
        location: "Başakşehir / İstanbul (Kuzey Marmara Otoyolu Bağlantısı)",
        year: "2025-2027",
        status: "SAHA",
        isActive: true,
        startDate: new Date("2025-01-15"),
        endDate: new Date("2027-08-30"),
        managerId: adminUser.id,
        companyId: company.id,
        tenantId: tenant.id,
        displayOrder: 1,
        threeDModelUrl: "https://assets.nxerp.com.tr/models/vadi-evleri-stage3.glb",
        images: [
          "https://images.unsplash.com/photo-1541888946425-d0fbb186156f?auto=format&fit=crop&w=1200&q=80",
          "https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=1200&q=80",
          "https://images.unsplash.com/photo-1590381105924-c72589b9ef3f?auto=format&fit=crop&w=1200&q=80",
        ],
      },
    });
  } else {
    project = await prisma.project.update({
      where: { id: project.id },
      data: {
        title: "Vadi Evleri 3. Etap",
        description:
          "12 Blok, 840 Bağımsız Bölüm, Ticari Alanlar, Kapalı Otopark ve Sosyal Tesislerden oluşan karma lüks konut projesi.",
        location: "Başakşehir / İstanbul (Kuzey Marmara Otoyolu Bağlantısı)",
        status: "SAHA",
        managerId: adminUser.id,
        tenantId: tenant.id,
        companyId: company.id,
      },
    });
  }

  console.log(`  ✅ Proje Oluşturuldu: ${project.name} (ID: ${project.id})`);

  // 15 Taşeron Firması ve Kullanıcıları
  console.log("🔨 4. 15 Uzman Taşeron Firması ve Kullanıcı Hesapları Kuruluyor...");
  const subcontractorDefs = [
    { trade: "Kalıp & İskele", name: "Özkan Kalıp & Endüstriyel İskele Ltd. Şti.", tax: "6319827361" },
    { trade: "Demir & Donatı", name: "Çelikler Donatı Demir Doğrama San. A.Ş.", tax: "4820194852" },
    { trade: "Hazır Beton", name: "Marmara Hazır Beton & Çimento San. A.Ş.", tax: "7192840192" },
    { trade: "Zemin & Fore Kazık", name: "Boğaziçi Zemin, İksa & Kazık Teknolojileri A.Ş.", tax: "5910294821" },
    { trade: "Mekanik & Yangın", name: "Akkaya Mekanik, Sıhhi Tesisat & Yangın Ltd. Şti.", tax: "8392019481" },
    { trade: "Elektrik & Otomasyon", name: "Yıldız Elektrik, Trafo & Otomasyon A.Ş.", tax: "9102948271" },
    { trade: "Duvar & Gazbeton", name: "Anadolu Gazbeton Duvar & Kaba Sıva Ltd.", tax: "3920194820" },
    { trade: "Dış Cephe Mantolama", name: "Gökkuşağı Dış Cephe Taşyünü & Yalıtım Ltd.", tax: "7492019482" },
    { trade: "Su & Çatı İzolasyonu", name: "Akdeniz Çatı & Membran Su İzolasyonu A.Ş.", tax: "6291049281" },
    { trade: "Asansör Sistemleri", name: "Zirve Yüksek Hızlı Asansör Sistemleri A.Ş.", tax: "5192049182" },
    { trade: "Alüminyum & Cephe", name: "Atlas Alüminyum Doğrama & Giydirme Cephe A.Ş.", tax: "8492019483" },
    { trade: "HVAC & İklimlendirme", name: "Toros Havalandırma, Klima & Şaft Sistemleri Ltd.", tax: "4920194829" },
    { trade: "Seramik & Zemin", name: "Doğan Seramik, Granit & Zemin Kaplama Ltd.", tax: "3819204918" },
    { trade: "Çelik Konstrüksiyon", name: "Güneş Çelik Konstrüksiyon & Yangın Kapıları A.Ş.", tax: "9283019481" },
    { trade: "Altyapı & Peyzaj", name: "Baran Altyapı, Yol & Çevre Peyzaj Hizmetleri Ltd.", tax: "6192049184" },
  ];

  const seededSubcontractors = [];
  for (let i = 0; i < subcontractorDefs.length; i++) {
    const sDef = subcontractorDefs[i];
    const contactPerson = fakerTR.person.fullName();
    const phone = fakerTR.phone.number();

    let sub = await prisma.subcontractor.findFirst({
      where: { name: sDef.name },
    });

    if (!sub) {
      sub = await prisma.subcontractor.create({
        data: {
          name: sDef.name,
          taxNumber: sDef.tax,
          contactName: contactPerson,
          phone: phone,
          tenantId: tenant.id,
        },
      });
    }

    // Taşeron Portalı Kullanıcısı
    const subEmail = `taseron${i + 1}@nxerp.com.tr`;
    await prisma.user.upsert({
      where: { email: subEmail },
      update: {
        name: `${sDef.trade} - ${contactPerson}`,
        password: defaultPassword,
        role: UserRole.SUBCONTRACTOR,
        phone: phone,
        tenantId: tenant.id,
      },
      create: {
        email: subEmail,
        name: `${sDef.trade} - ${contactPerson}`,
        password: defaultPassword,
        role: UserRole.SUBCONTRACTOR,
        phone: phone,
        tenantId: tenant.id,
      },
    });

    seededSubcontractors.push(sub);
  }
  console.log(`  ✅ 15 Taşeron Firması ve Kullanıcı Hesabı Eklendi.`);

  // 50 Saha Personeli (Personel)
  console.log("👷 5. 50 Gerçekçi Saha Personeli Faker.js ile Üretiliyor...");

  const departments = [
    "Kaba Yapı",
    "İnce Yapı",
    "Mekanik Tesisat",
    "Elektrik & Otomasyon",
    "İSG & Çevre Sağlığı",
    "Lojistik & Ambar",
    "Harita & Ölçme",
  ];

  const positionsByDept: Record<string, string[]> = {
    "Kaba Yapı": ["Demirci Ustası", "Kalıpçı Ustası", "Betoncu", "Kule Vinç Operatörü", "Hafriyat Şoförü", "İnşaat İşçisi"],
    "İnce Yapı": ["Duvar Ustası", "Alçı Sıvacı", "Seramik Kaplamacı", "Boya Ustası", "Alçıpan Ustası"],
    "Mekanik Tesisat": ["Sıhhi Tesisatçı", "Kaynakçı", "Havalandırma Montajcısı", "Yangın Sprinkler Ustası"],
    "Elektrik & Otomasyon": ["Elektrik Ustası", "Kablo Çekim Elemanı", "Pano Montajcısı", "Zayıf Akım Teknisyeni"],
    "İSG & Çevre Sağlığı": ["İSG Saha Gözetmeni", "İlkyardım Görevlisi", "Çevre Mühendisi", "İskele Güvenlik Kontrolörü"],
    "Lojistik & Ambar": ["Ambar Sorumlusu", "Forklift Operatörü", "Malzeme Kabul Sorumlusu", "Ağır Vasıta Şoförü"],
    "Harita & Ölçme": ["Topoğraf", "Harita Teknikeri", "Alet Operatörü"],
  };

  const seededPersonnel = [];
  for (let i = 1; i <= 50; i++) {
    const pNo = `P${String(i).padStart(3, "0")}`;
    const fullName = fakerTR.person.fullName();
    const dept = departments[i % departments.length];
    const posList = positionsByDept[dept] || ["Saha İşçisi"];
    const position = posList[i % posList.length];
    const age = faker.number.int({ min: 21, max: 58 });
    const birthYear = now.getFullYear() - age;
    const birthDate = new Date(birthYear, faker.number.int({ min: 0, max: 11 }), faker.number.int({ min: 1, max: 28 }));
    const tcNo = `1${String(faker.number.int({ min: 100000000, max: 999999999 }))}`;
    const sgkNo = `SGK${String(faker.number.int({ min: 1000000000, max: 9999999999 }))}`;
    const salary = faker.number.int({ min: 38000, max: 74000 });

    const p = await prisma.personel.upsert({
      where: { personnelNo: pNo },
      update: {
        name: fullName,
        age: age,
        birthDate: birthDate,
        department: dept,
        position: position,
        currentSite: "Vadi Evleri 3. Etap",
        status: PersonelStatus.ACTIVE,
        salary: salary,
        salaryStatus: "Paid",
        phone: fakerTR.phone.number(),
        email: faker.internet.email({ firstName: fullName.split(" ")[0], lastName: fullName.split(" ")[1] }),
        address: `${fakerTR.location.streetAddress()}, ${fakerTR.location.city()}`,
        projectId: project.id,
        companyId: company.id,
        tenantId: tenant.id,
        lastKnownLat: 41.085 + (Math.random() - 0.5) * 0.003,
        lastKnownLng: 28.802 + (Math.random() - 0.5) * 0.003,
        lastLocationAt: now,
      },
      create: {
        personnelNo: pNo,
        name: fullName,
        tcNo: tcNo,
        sgkNo: sgkNo,
        age: age,
        birthDate: birthDate,
        gender: i % 8 === 0 ? Gender.FEMALE : Gender.MALE,
        department: dept,
        position: position,
        currentSite: "Vadi Evleri 3. Etap",
        hireDate: daysAgo(faker.number.int({ min: 30, max: 500 })),
        employmentType: EmploymentType.WORKER,
        status: PersonelStatus.ACTIVE,
        salary: salary,
        salaryStatus: "Paid",
        phone: fakerTR.phone.number(),
        email: faker.internet.email({ firstName: fullName.split(" ")[0], lastName: fullName.split(" ")[1] }),
        address: `${fakerTR.location.streetAddress()}, ${fakerTR.location.city()}`,
        projectId: project.id,
        companyId: company.id,
        tenantId: tenant.id,
        lastKnownLat: 41.085 + (Math.random() - 0.5) * 0.003,
        lastKnownLng: 28.802 + (Math.random() - 0.5) * 0.003,
        lastLocationAt: now,
      },
    });
    seededPersonnel.push(p);
  }
  console.log(`  ✅ 50 Saha Personeli (P001 - P050) Başarıyla Oluşturuldu.`);

  // ============================================================================
  // 4. METRAJ (BoQ): C30 Beton, S420 Demir, Duvar Dahil 20 KALEM VE DOLULUK ORANLARI
  // ============================================================================
  console.log("📐 6. 20 Kalemlik Detaylı Keşif & Metraj (BoQ) Oluşturuluyor...");

  const boqDefs = [
    {
      pozNo: "15.120.1001",
      description: "C30/37 Hazır Beton Dökümü (Kalıp & Pompalı Dahil)",
      unit: "m3",
      planned: 25000,
      actual: 18750, // %75
      unitPrice: 2650,
    },
    {
      pozNo: "15.140.1002",
      description: "S420 Nervürlü Donatı Çeliği Temini, Bükümü ve Montajı",
      unit: "Ton",
      planned: 3200,
      actual: 2560, // %80
      unitPrice: 31500,
    },
    {
      pozNo: "15.210.1003",
      description: "20 cm Gazbeton Blokları ile Dış ve İç Duvar Örülmesi",
      unit: "m2",
      planned: 45000,
      actual: 20250, // %45
      unitPrice: 420,
    },
    {
      pozNo: "15.110.1001",
      description: "Endüstriyel Çelik & Ahşap Kolon-Perde Kalıbı İmalatı",
      unit: "m2",
      planned: 78000,
      actual: 58500, // %75
      unitPrice: 580,
    },
    {
      pozNo: "15.260.1001",
      description: "Temel ve Bodrum Perde 2 Kat Bitümlü Membran Su Yalıtımı",
      unit: "m2",
      planned: 18500,
      actual: 16650, // %90
      unitPrice: 380,
    },
    {
      pozNo: "15.270.1005",
      description: "Dış Cephe 10 cm Taşyünü Isı Yalıtımı ve Mantolama Sistemi",
      unit: "m2",
      planned: 32000,
      actual: 11200, // %35
      unitPrice: 850,
    },
    {
      pozNo: "15.280.1002",
      description: "Helikopter Perdahlı Tesviye Şapı Dökümü (Kat Holleri ve Daireler)",
      unit: "m2",
      planned: 52000,
      actual: 28600, // %55
      unitPrice: 220,
    },
    {
      pozNo: "15.310.1001",
      description: "İç Cephe Perlitli Makine Alçı Sıva İmalatı",
      unit: "m2",
      planned: 95000,
      actual: 47500, // %50
      unitPrice: 190,
    },
    {
      pozNo: "15.340.1003",
      description: "Metal Taşıyıcılı Alçıpan Asma Tavan Yapılması",
      unit: "m2",
      planned: 42000,
      actual: 12600, // %30
      unitPrice: 480,
    },
    {
      pozNo: "15.370.1002",
      description: "60x120 cm Porselen Granit Seramik Zemin Kaplaması",
      unit: "m2",
      planned: 38000,
      actual: 15200, // %40
      unitPrice: 750,
    },
    {
      pozNo: "15.410.1001",
      description: "İç Cephe Silikonlu Mat Plastik Boya (3 Kat Astar Dahil)",
      unit: "m2",
      planned: 120000,
      actual: 24000, // %20
      unitPrice: 110,
    },
    {
      pozNo: "15.450.1004",
      description: "Dış Cephe Alüminyum Kompozit Panel Giydirme Cephe İmalatı",
      unit: "m2",
      planned: 14000,
      actual: 8400, // %60
      unitPrice: 2400,
    },
    {
      pozNo: "15.470.1001",
      description: "Isı Yalıtımlı Alüminyum Doğrama & Isıcam Konfor Doğrama Sistemi",
      unit: "m2",
      planned: 8500,
      actual: 5100, // %60
      unitPrice: 4800,
    },
    {
      pozNo: "15.520.1002",
      description: "90 Dakika Yangına Dayanıklı Çelik Kaçış Kapıları ve Kasası",
      unit: "Adet",
      planned: 650,
      actual: 420, // %65
      unitPrice: 5500,
    },
    {
      pozNo: "18.110.1001",
      description: "Otomatik Islak Yangın Sprinkler Borulama ve Hat Dağıtımı",
      unit: "Metre",
      planned: 22000,
      actual: 17600, // %80
      unitPrice: 620,
    },
    {
      pozNo: "18.120.1003",
      description: "PPRC Temiz Su ve Sessiz PVC Pis Su Tesisat Boru Hatları",
      unit: "Metre",
      planned: 35000,
      actual: 24500, // %70
      unitPrice: 450,
    },
    {
      pozNo: "18.210.1001",
      description: "Galvaniz Sac Havalandırma Kanalları ve Menfez Montajı",
      unit: "m2",
      planned: 16000,
      actual: 9600, // %60
      unitPrice: 950,
    },
    {
      pozNo: "19.110.1002",
      description: "Kuvvetli Akım Halogen-Free Kablolama & Delikli Sac Kablo Kanalı",
      unit: "Metre",
      planned: 85000,
      actual: 59500, // %70
      unitPrice: 280,
    },
    {
      pozNo: "19.210.1005",
      description: "Zayıf Akım (Yangın Algılama, CCTV, İnterkom, Data) Hatları",
      unit: "Metre",
      planned: 62000,
      actual: 37200, // %60
      unitPrice: 190,
    },
    {
      pozNo: "15.610.1001",
      description: "Bitkisel Peyzaj, Otomatik Sulama ve Sert Zemin Çevre Düzenlemesi",
      unit: "m2",
      planned: 28000,
      actual: 4200, // %15
      unitPrice: 650,
    },
  ];

  for (const b of boqDefs) {
    const totalPrice = b.planned * b.unitPrice;
    const subIdx = Math.abs(b.pozNo.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0)) % seededSubcontractors.length;
    const subId = seededSubcontractors[subIdx]?.id;

    // BoqItem Modeli
    const existingBoq = await prisma.boqItem.findFirst({
      where: { projectId: project.id, pozNo: b.pozNo },
    });

    if (existingBoq) {
      await prisma.boqItem.update({
        where: { id: existingBoq.id },
        data: {
          description: b.description,
          unit: b.unit,
          plannedQuantity: b.planned,
          actualQuantity: b.actual,
          unitPrice: b.unitPrice,
          totalPrice: totalPrice,
          subcontractorId: subId,
          tenantId: tenant.id,
        },
      });
    } else {
      await prisma.boqItem.create({
        data: {
          projectId: project.id,
          tenantId: tenant.id,
          pozNo: b.pozNo,
          description: b.description,
          unit: b.unit,
          plannedQuantity: b.planned,
          actualQuantity: b.actual,
          unitPrice: b.unitPrice,
          totalPrice: totalPrice,
          subcontractorId: subId,
        },
      });
    }

    // BoQItem Modeli (Çift Modül Uyumu)
    const existingBoQ2 = await prisma.boQItem.findFirst({
      where: { projectId: project.id, pozNo: b.pozNo },
    });

    if (existingBoQ2) {
      await prisma.boQItem.update({
        where: { id: existingBoQ2.id },
        data: {
          description: b.description,
          unit: b.unit,
          plannedQuantity: b.planned,
          completedQuantity: b.actual,
          unitPrice: b.unitPrice,
          totalPrice: totalPrice,
          tenantId: tenant.id,
        },
      });
    } else {
      await prisma.boQItem.create({
        data: {
          projectId: project.id,
          tenantId: tenant.id,
          pozNo: b.pozNo,
          description: b.description,
          unit: b.unit,
          plannedQuantity: b.planned,
          completedQuantity: b.actual,
          unitPrice: b.unitPrice,
          totalPrice: totalPrice,
        },
      });
    }
  }
  console.log(`  ✅ 20 Kalem BoQ Metraj Kalemi Başarıyla Projeye Bağlandı.`);

  // ============================================================================
  // 5. JURNALLER & İŞ EMİRLERİ (SON 15 GÜN JURNAL & 30 TAMAMLANMIŞ GÖREV)
  // ============================================================================
  console.log("📝 7. Geriye Dönük Son 15 Gün Şantiye Jurnalleri Oluşturuluyor...");

  const weatherPresets = [
    { desc: "Açık ve Güneşli", temp: 22, wind: 12, hum: 45 },
    { desc: "Parçalı Bulutlu", temp: 20, wind: 16, hum: 52 },
    { desc: "Hafif Rüzgarlı ve Açık", temp: 19, wind: 22, hum: 48 },
    { desc: "Güneşli, İmalata Elverişli", temp: 23, wind: 10, hum: 44 },
    { desc: "Kısmen Bulutlu", temp: 21, wind: 14, hum: 55 },
  ];

  for (let i = 14; i >= 0; i--) {
    const reportDate = daysAgo(i);
    const w = weatherPresets[i % weatherPresets.length];
    const totalWorkers = 120 + i * 2;

    const consumedJson = [
      { item: "C30/37 Hazır Beton", qty: `${faker.number.int({ min: 140, max: 320 })} m3`, supplier: "Marmara Beton" },
      { item: "S420 Nervürlü Donatı", qty: `${faker.number.int({ min: 12, max: 28 })} Ton`, supplier: "Çelikler Demir" },
      { item: "Gazbeton Duvar Bloğu", qty: `${faker.number.int({ min: 25, max: 60 })} Palet`, supplier: "Anadolu Gazbeton" },
    ];

    const completedJson = [
      `A Blok ${2 + (i % 6)}. Kat Kolon & Perde İmalatı`,
      `B Blok ${1 + (i % 4)}. Kat Döşeme Hasır Çelik Montajı`,
      `C Blok Bodrum Kat Mekanik Şaft Yangın Borulama`,
    ];

    const engineerNote = `Vadi Evleri 3. Etap sahasında hava sıcaklığı ${w.temp}°C, rüzgar hızı ${w.wind} km/h ölçüldü. Sahada toplam ${totalWorkers} işçi ve teknik personel mesai yaptı. Planlanan beton dökümü ve kalıp söküm çalışmaları İSG kurallarına uygun tamamlandı.`;

    // DailyJournal
    await prisma.dailyJournal.create({
      data: {
        projectId: project.id,
        tenantId: tenant.id,
        engineerId: adminUser.id,
        date: reportDate,
        weather: {
          description: w.desc,
          temperature: w.temp,
          windSpeed: w.wind,
          humidity: w.hum,
        },
        workerCount: totalWorkers,
        consumedItems: consumedJson,
        completedWorks: completedJson,
        ncrReports: [],
        engineerNotes: engineerNote,
        status: "APPROVED",
        createdAt: reportDate,
      },
    });

    // SiteReport (Çift modül ve günlük rapor listeleri için)
    await prisma.siteReport.create({
      data: {
        projectId: project.id,
        tenantId: tenant.id,
        date: reportDate,
        weather: `${w.desc}, ${w.temp}°C, Rüzgar: ${w.wind} km/h`,
        workerCount: totalWorkers,
        staffWorkerCount: 30,
        subWorkerCount: totalWorkers - 30,
        activities: completedJson.join(" | "),
        notes: engineerNote,
        createdBy: adminUser.name,
        createdAt: reportDate,
      },
    });
  }
  console.log(`  ✅ 15 Günlük Hava Durumu ve Tüketim Verili Şantiye Jurnalleri Kaydedildi.`);

  // 30 Adet Tamamlanmış Görev (WorkOrder & Task)
  console.log("📋 8. 30 Adet Tamamlanmış Görev & İş Emri Üretiliyor...");

  const taskTitles = [
    { title: "A Blok 3. Kat Kolon Donatı ve Paspayı Kontrolü", dept: Department.INSAAT },
    { title: "B Blok Temel Su Yalıtımı Koruma Betonu Dökümü", dept: Department.INSAAT },
    { title: "C Blok Kule Vinç 1 Periyodik Halat ve Fren Muayenesi", dept: Department.GENEL },
    { title: "Trafo Merkezi AG Pano Odası Topraklama Ölçümü", dept: Department.ELEKTRIK },
    { title: "Bodrum 2. Kat Yangın Sprinkler Basınç Testi (16 Bar)", dept: Department.MEKANIK },
    { title: "A Blok 4. Kat Perde Kalıbı Diklik ve Şakül Kontrolü", dept: Department.INSAAT },
    { title: "Dış Cephe Taşyünü Mantolama Dübel Yoğunluğu Testi", dept: Department.MIMARI },
    { title: "B Blok 1. Kat Gazbeton Duvar Harç Bağ Mukavemeti Kontrolü", dept: Department.INSAAT },
    { title: "C Blok Asansör Boşluğu Güvenlik Ağları ve Kapaklarının Denetimi", dept: Department.GENEL },
    { title: "A Blok Zemin Kat Şap Öncesi Ses Yalıtım Şiltesi Serimi", dept: Department.MIMARI },
    { title: "Şantiye Mobil Jeneratör Yağ ve Filtre Bakımı", dept: Department.MEKANIK },
    { title: "Merkezi Kazan Dairesi Sirkülasyon Pompaları Bağlantı Kontrolü", dept: Department.MEKANIK },
    { title: "B Blok 2. Kat Alçı Sıva Köşe Profili ve Düzlemsellik Kabulü", dept: Department.MIMARI },
    { title: "A Blok Çatı Parapet Duvarı Su İzolasyonu Etek Detayı Muayenesi", dept: Department.INSAAT },
    { title: "Saha Lojistik Alanı Malzeme İndirme Alanı İşaretlemeleri", dept: Department.GENEL },
    { title: "C Blok 3. Kat Elektrik Borulama ve Kasa Yerleşimi Kontrolü", dept: Department.ELEKTRIK },
    { title: "A Blok 2. Kat Kolon C30/37 Beton Slump ve Sıcaklık Tutanakları", dept: Department.INSAAT },
    { title: "Şantiye Ana Dağıtım Panosu Kaçak Akım Röleleri Testi", dept: Department.ELEKTRIK },
    { title: "B Blok Temel Drenaj Boruları Eğim ve Çakıl Dolgusu Kontrolü", dept: Department.INSAAT },
    { title: "Kule Vinç 2 Operatörü İSG Yüksekte Çalışma Yenileme Eğitimi", dept: Department.GENEL },
    { title: "D Blok Fore Kazık Baş Kesme ve Donatı Filiz Kontrolü", dept: Department.INSAAT },
    { title: "A Blok 5. Kat Döşeme Hasır Çelik Bindirme Boyu Ölçümü", dept: Department.INSAAT },
    { title: "Sosyal Tesis Binası Çelik Çatı Makasları Kaynak Röntgen Raporu", dept: Department.INSAAT },
    { title: "B Blok 3. Kat Sıhhi Tesisat Kolon Hatları Sızdırmazlık Testi", dept: Department.MEKANIK },
    { title: "A Blok Daire İçi Alçıpan Bölme Duvar İskelet Kontrolü", dept: Department.MIMARI },
    { title: "İnşaat Sahası Tozuma Önleme Sulama Arazözü Rutin Denetimi", dept: Department.GENEL },
    { title: "C Blok Yangın Kaçış Merdiveni Basamak Yükseklik Muayenesi", dept: Department.GENEL },
    { title: "B Blok Kat Holleri Granit Seramik Yapıştırıcı Tarama Kontrolü", dept: Department.MIMARI },
    { title: "Şantiye Yemekhanesi ve Yatakhane Hijyen ve İSG Raporu", dept: Department.GENEL },
    { title: "Proje 3. Etap Çevre Koruma Çiti ve Aydınlatma Revizyonu", dept: Department.ELEKTRIK },
  ];

  for (let i = 0; i < taskTitles.length; i++) {
    const tDef = taskTitles[i];
    const completedAt = daysAgo(faker.number.int({ min: 1, max: 14 }));
    const assignedPersonel = seededPersonnel[i % seededPersonnel.length];

    // WorkOrder Modeli
    await prisma.workOrder.create({
      data: {
        title: tDef.title,
        description: `${tDef.title} saha teknik şartnamesine ve şantiye şefi onayına uygun şekilde başarıyla tamamlanmıştır.`,
        status: TaskStatus.COMPLETED,
        priority: i % 3 === 0 ? TaskPriority.HIGH : TaskPriority.MEDIUM,
        department: tDef.dept,
        projectId: project.id,
        assignedToId: assignedPersonel?.id,
        tenantId: tenant.id,
        dueDate: completedAt,
        completionPhoto: "https://images.unsplash.com/photo-1541888946425-d0fbb186156f?auto=format&fit=crop&w=800&q=80",
        createdAt: daysAgo(15),
      },
    });

    // Task Modeli (Genel Görev Çizelgesi)
    await prisma.task.create({
      data: {
        title: tDef.title,
        description: `${tDef.title} saha teknik şartnamesine uygun şekilde tamamlanmıştır.`,
        status: "COMPLETED",
        projectId: project.id,
        assignedTo: assignedPersonel?.name,
        taskType: "KONTROL_KABUL",
        tenantId: tenant.id,
        dueDate: completedAt,
        completionPhoto: "https://images.unsplash.com/photo-1541888946425-d0fbb186156f?auto=format&fit=crop&w=800&q=80",
        createdAt: daysAgo(15),
      },
    });
  }
  console.log(`  ✅ 30 Adet Tamamlanmış İş Emri ve Görev Veritabanına Yazıldı.`);

  // ============================================================================
  // 6. İSG İHLALLERİ & RİSK BÖLGELERİ (3 RİSK BÖLGESİ, 5 AÇIK İSG CEZASI)
  // ============================================================================
  console.log("⚠️ 9. Harita İSG Risk Bölgeleri ve Açık Cezalar Tanımlanıyor...");

  // 3 Risk Bölgesi (Haritada gösterilecek Geofence alanları)
  const riskZonesData = [
    {
      name: "Kule Vinç 1 Yük Askı & Dönüş Yarıçapı",
      zoneName: "Kule Vinç 1 Sahası",
      radius: 45.0,
      centerLat: 41.0853,
      centerLng: 28.8025,
      dangerLevel: "CRITICAL",
      requiredPpe: ["BARET", "REFLEKTORLU_YELEK", "CELIK_BURUNLU_BOT"],
    },
    {
      name: "A-B Blok Yüksekte Çalışma ve Dış İskele Hattı",
      zoneName: "Dış İskele Yüksekte Çalışma",
      radius: 35.0,
      centerLat: 41.0859,
      centerLng: 28.8018,
      dangerLevel: "HIGH",
      requiredPpe: ["PARASUT_TIPI_KEMER", "BARET", "YASAM_HATTI"],
    },
    {
      name: "Ana Derin Kazı ve İstinat Duvarı Şev Güvenlik Sahası",
      zoneName: "Derin Kazı & Şev Alanı",
      radius: 50.0,
      centerLat: 41.0847,
      centerLng: 28.803,
      dangerLevel: "HIGH",
      requiredPpe: ["BARET", "CELIK_BURUNLU_BOT", "GAZ_DEDEKTORU"],
    },
  ];

  for (const rz of riskZonesData) {
    await prisma.riskZone.create({
      data: {
        projectId: project.id,
        tenantId: tenant.id,
        name: rz.name,
        zoneName: rz.zoneName,
        radius: rz.radius,
        centerLat: rz.centerLat,
        centerLng: rz.centerLng,
        dangerLevel: rz.dangerLevel,
        requiredPpe: rz.requiredPpe,
      },
    });
  }
  console.log(`  ✅ 3 Risk Bölgesi Haritaya Eklendi (Kule Vinç, İskele, Derin Kazı).`);

  // 5 Açık İSG Cezası / İhlali
  const violationsData = [
    {
      workerName: "Mehmet Kaya",
      violation: "A Blok 3. Kat dış iskelede paraşüt tipi emniyet kemeri takılmadan ve yaşam hattına bağlanmadan çalışma yapılması",
      zoneName: "Dış İskele Yüksekte Çalışma",
    },
    {
      workerName: "Ali Demir",
      violation: "Kule vinç yük askı sahasında koruyucu baret olmadan malzeme yönlendirmesi yapılması",
      zoneName: "Kule Vinç 1 Sahası",
    },
    {
      workerName: "Murat Çelik",
      violation: "Şantiye ana dağıtım panosu kapağının açık bırakılması, topraklama hattının devre dışı bırakılması",
      zoneName: "Şantiye Dağıtım Panosu",
    },
    {
      workerName: "Hasan Yılmaz",
      violation: "B Blok 2. Kat asansör şaft boşluğu güvenlik korkuluklarının izinsiz sökülmesi ve açık bırakılması",
      zoneName: "Asansör Şaft Boşluğu",
    },
    {
      workerName: "Serkan Öztürk",
      violation: "Kapalı alanda kaynak işlemi sırasında yangın tüpü bulundurulmaması ve kaynak maskesi kullanılmaması",
      zoneName: "Atölye Kaynak Alanı",
    },
  ];

  for (let i = 0; i < violationsData.length; i++) {
    const v = violationsData[i];
    const violationDate = daysAgo(faker.number.int({ min: 1, max: 5 }));

    // IsgViolation (Harita ve hızlı ceza takibi)
    await prisma.isgViolation.create({
      data: {
        projectId: project.id,
        tenantId: tenant.id,
        workerName: v.workerName,
        violation: v.violation,
        zoneName: v.zoneName,
        status: "OPEN",
        timestamp: violationDate,
      },
    });

    // IsgReport (Detaylı İSG Yönetim Modülü)
    const assignedP = seededPersonnel[i] || seededPersonnel[0];
    await prisma.isgReport.create({
      data: {
        projectId: project.id,
        tenantId: tenant.id,
        personelId: assignedP.id,
        type: IsgReportType.TEHLIKE,
        status: IsgReportStatus.ACIL,
        description: `[İSG CEZASI] Personel: ${v.workerName} - İhlal: ${v.violation} (Bölge: ${v.zoneName})`,
        location: v.zoneName,
        imageUrl: "https://images.unsplash.com/photo-1541888946425-d0fbb186156f?auto=format&fit=crop&w=600&q=80",
        createdAt: violationDate,
      },
    });
  }
  console.log(`  ✅ 5 Adet Açık İSG Cezası & İhlali Veritabanına İşlendi.`);

  console.log("================================================================================");
  console.log("🎉 TEBRİKLER! NEXA ERP DEMO SEED İŞLEMİ BAŞARIYLA TAMAMLANDI!");
  console.log("--------------------------------------------------------------------------------");
  console.log(`Proje:              ${project.name} (${project.location})`);
  console.log(`Admin (Sen):        ${adminUser.name} | ${adminUser.email} (Şifre: nexa2026)`);
  console.log(`Şantiye Şefleri:    3 Adet (${siteManagers.map((s) => s.email).join(", ")})`);
  console.log(`Taşeronlar:         15 Firma (Örn: taseron1@nxerp.com.tr ... taseron15@nxerp.com.tr)`);
  console.log(`Saha Personeli:     50 Kişi (P001 - P050)`);
  console.log(`BoQ Metraj:         20 Kalem (C30 Beton, S420 Demir, Duvar vb. %15 - %90 doluluk)`);
  console.log(`Şantiye Jurnalleri: Son 15 Gün (Hava Durumu, İşçi Sayıları, Tüketilen Malzemeler)`);
  console.log(`İş Emirleri:        30 Adet Tamamlanmış Görev`);
  console.log(`İSG:                3 Risk Bölgesi & 5 Açık İSG Cezası`);
  console.log("================================================================================\n");

  return {
    success: true,
    projectId: project.id,
    projectName: project.name,
    adminEmail: adminUser.email,
  };
}

// CLI doğrudan çalıştırma
if (
  typeof window === "undefined" &&
  !process.env.NEXT_RUNTIME &&
  typeof require !== "undefined" &&
  require.main === module
) {
  seedDatabase()
    .catch((err) => {
      console.error("❌ Seed Hatası:", err);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}