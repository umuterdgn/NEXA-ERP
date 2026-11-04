/**
 * © 2026 Nexa ERP. All rights reserved.
 * Developer: Umut Erdoğan
 * Nexa Franchise Demo & Canlı Şantiye BLE Harita Seed Betiği
 * 
 * Tenant: "nexa-franchise"
 * User: "erdgnumut20@gmail.com" (SUPER_ADMIN)
 * Şantiye: İskenderun / Hatay Projesi (Lat: 36.5878, Lng: 36.1735)
 * Donanım: BLE Akıllı Baretler, Ağır Ekipmanlar (Kule Vinç, Ekskavatör)
 */

import { PrismaClient, UserRole, CompanyType, PersonelStatus } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("================================================================================");
  console.log("🚀 NEXA FRANCHISE & BLE HARİTA SEED BAŞLATILIYOR...");
  console.log("================================================================================");

  // ============================================================================
  // ADIM 2: TENANT VE USER UPSERT MANTIĞI
  // ============================================================================
  console.log("🏢 1. 'nexa-franchise' Kiracısı (Tenant) Hazırlanıyor...");
  const tenant = await prisma.tenant.upsert({
    where: { slug: "nexa-franchise" },
    update: {
      name: "Nexa Franchise A.Ş.",
      domain: "franchise.nxerp.com.tr",
      type: CompanyType.MAIN_CONTRACTOR,
      subscriptionPlan: "ENTERPRISE",
      subscriptionStatus: "ACTIVE",
      status: "ACTIVE",
      isActive: true,
      licenses: 250,
      maxUsers: 250,
      maxStorageMB: 102400,
      enabledModules: [
        "DASHBOARD",
        "PROJECTS",
        "FINANCE",
        "DOCUMENTS",
        "BLE_TRACKING",
        "MAPS",
        "SUPER_ADMIN",
      ],
      features: [
        "BIM_VIEWER",
        "AI_VISION",
        "OCR",
        "DRONE",
        "BLE_RADAR",
        "LIVE_MAPS",
      ],
    },
    create: {
      slug: "nexa-franchise",
      name: "Nexa Franchise A.Ş.",
      domain: "franchise.nxerp.com.tr",
      type: CompanyType.MAIN_CONTRACTOR,
      subscriptionPlan: "ENTERPRISE",
      subscriptionStatus: "ACTIVE",
      status: "ACTIVE",
      isActive: true,
      licenses: 250,
      maxUsers: 250,
      maxStorageMB: 102400,
      enabledModules: [
        "DASHBOARD",
        "PROJECTS",
        "FINANCE",
        "DOCUMENTS",
        "BLE_TRACKING",
        "MAPS",
        "SUPER_ADMIN",
      ],
      features: [
        "BIM_VIEWER",
        "AI_VISION",
        "OCR",
        "DRONE",
        "BLE_RADAR",
        "LIVE_MAPS",
      ],
    },
  });
  console.log(`✅ Tenant hazır: ${tenant.name} (ID: ${tenant.id}, Slug: ${tenant.slug})`);

  console.log("👤 2. Super Admin Kullanıcısı (erdgnumut20@gmail.com) Hazırlanıyor...");
  const defaultPassword = await bcrypt.hash("Password123!", 10);

  const superAdmin = await prisma.user.upsert({
    where: { email: "erdgnumut20@gmail.com" },
    update: {
      name: "Umut Erdoğan",
      role: UserRole.SUPER_ADMIN,
      tenantId: tenant.id,
      currentLat: 36.5878,
      currentLng: 36.1735,
      lastLocationUpdate: new Date(),
    },
    create: {
      email: "erdgnumut20@gmail.com",
      name: "Umut Erdoğan",
      password: defaultPassword,
      role: UserRole.SUPER_ADMIN,
      tenantId: tenant.id,
      currentLat: 36.5878,
      currentLng: 36.1735,
      lastLocationUpdate: new Date(),
      permissions: ["*"],
    },
  });
  console.log(`✅ Super Admin hazır: ${superAdmin.name} (${superAdmin.email}) - Yetki: ${superAdmin.role}`);

  // ============================================================================
  // ADIM 3: BLE CİHAZLARI VE ŞANTİYE VERİLERİNİ BAĞLAMA
  // ============================================================================
  console.log("🏗️ 3. Şantiye Projesi (İskenderun Sahil) Hazırlanıyor...");
  let project = await prisma.project.findFirst({
    where: {
      tenantId: tenant.id,
      title: "İskenderun Sahil Rezidans & AVM",
    },
  });

  if (!project) {
    project = await prisma.project.create({
      data: {
        title: "İskenderun Sahil Rezidans & AVM",
        name: "İskenderun Sahil Projesi",
        description: "Hatay / İskenderun BLE ve IoT Donanımlı Akıllı Şantiye Sahası",
        location: "İskenderun / Hatay",
        city: "Hatay",
        district: "İskenderun",
        tenantId: tenant.id,
        managerId: superAdmin.id,
        siteManager: "Ahmet Yılmaz",
        status: "SAHA",
        category: "Karma Proje (Rezidans & Ticari)",
        isActive: true,
        images: ["/uploads/projects/iskenderun_sahil.jpg"],
      },
    });
  }
  console.log(`✅ Şantiye Projesi hazır: ${project.title} (ID: ${project.id})`);

  // Personel Verileri (Hatay/İskenderun Koordinatları)
  console.log("👷 4. Personel & Saha Ekipleri Ekleniyor...");
  const personnelSeedData = [
    {
      personnelNo: "PRS-FRN-001",
      name: "Ahmet Yılmaz",
      position: "Şantiye Şefi",
      department: "Teknik Ofis / Saha Yönetimi",
      age: 38,
      birthDate: new Date("1988-04-12"),
      hireDate: new Date("2024-01-15"),
      currentSite: "İskenderun Sahil Rezidans",
      status: PersonelStatus.ACTIVE,
      role: UserRole.SITE_MANAGER,
      tenantId: tenant.id,
      projectId: project.id,
      lat: 36.5878,
      lng: 36.1735,
      battery: 85,
      mac: "C4:4E:AC:01:22:11",
      deviceType: "BARET",
    },
    {
      personnelNo: "PRS-FRN-002",
      name: "Mehmet Demir",
      position: "Operatör",
      department: "Makine Parkı / Saha",
      age: 34,
      birthDate: new Date("1992-08-20"),
      hireDate: new Date("2024-03-01"),
      currentSite: "İskenderun Sahil Rezidans",
      status: PersonelStatus.ACTIVE,
      role: UserRole.WORKER,
      tenantId: tenant.id,
      projectId: project.id,
      lat: 36.5881,
      lng: 36.1730,
      battery: 42,
      mac: "C4:4E:AC:01:22:22",
      deviceType: "YELEK",
    },
  ];

  for (const p of personnelSeedData) {
    const personel = await prisma.personel.upsert({
      where: { personnelNo: p.personnelNo },
      update: {
        name: p.name,
        position: p.position,
        department: p.department,
        currentSite: p.currentSite,
        tenantId: p.tenantId,
        projectId: p.projectId,
        status: p.status,
      },
      create: {
        personnelNo: p.personnelNo,
        name: p.name,
        position: p.position,
        department: p.department,
        age: p.age,
        birthDate: p.birthDate,
        hireDate: p.hireDate,
        currentSite: p.currentSite,
        tenantId: p.tenantId,
        projectId: p.projectId,
        status: p.status,
        role: p.role,
        salary: 45000,
      },
    });

    // Personel için BLE Cihazı kaydı
    await prisma.bleDevice.upsert({
      where: { macAddress: p.mac },
      update: {
        deviceType: p.deviceType,
        assignedTo: personel.id,
        batteryLevel: p.battery,
        lastSeenAt: new Date(),
        projectId: project.id,
        tenantId: tenant.id,
      },
      create: {
        macAddress: p.mac,
        deviceType: p.deviceType,
        assignedTo: personel.id,
        batteryLevel: p.battery,
        lastSeenAt: new Date(),
        projectId: project.id,
        tenantId: tenant.id,
      },
    });

    console.log(`   👷 ${personel.name} (${p.personnelNo}) - BLE Tag: ${p.mac} (Pil: %${p.battery}, Koordinat: ${p.lat}, ${p.lng})`);
  }

  // Ağır Ekipmanlar (Hatay/İskenderun Koordinatları)
  console.log("🚜 5. Ağır Ekipmanlar ve Makine Parkı Ekleniyor...");
  const equipmentSeedData = [
    {
      name: "Kule Vinç 1",
      type: "IS_MAKINESI",
      category: "Ağır Ekipman",
      status: "AVAILABLE",
      serialNumber: "EQ-KV-2026-01",
      bleTagId: "BLE-TAG-CRANE-01",
      latitude: 36.5885,
      longitude: 36.1740,
      battery: 100,
      tenantId: tenant.id,
      projectId: project.id,
    },
    {
      name: "Ekskavatör",
      type: "IS_MAKINESI",
      category: "Kazı Ekipmanı",
      status: "ASSIGNED",
      serialNumber: "EQ-EXC-2026-02",
      bleTagId: "BLE-TAG-EXC-02",
      latitude: 36.5875,
      longitude: 36.1725,
      battery: 12, // Düşük pil uyarısı
      tenantId: tenant.id,
      projectId: project.id,
    },
  ];

  for (const eq of equipmentSeedData) {
    const equipment = await prisma.equipment.upsert({
      where: { serialNumber: eq.serialNumber },
      update: {
        name: eq.name,
        type: eq.type,
        category: eq.category,
        status: eq.status,
        bleTagId: eq.bleTagId,
        latitude: eq.latitude,
        longitude: eq.longitude,
        lastLat: eq.latitude,
        lastLng: eq.longitude,
        lastSeenAt: new Date(),
        tenantId: eq.tenantId,
        projectId: eq.projectId,
      },
      create: {
        name: eq.name,
        type: eq.type,
        category: eq.category,
        status: eq.status,
        serialNumber: eq.serialNumber,
        bleTagId: eq.bleTagId,
        latitude: eq.latitude,
        longitude: eq.longitude,
        lastLat: eq.latitude,
        lastLng: eq.longitude,
        lastSeenAt: new Date(),
        tenantId: eq.tenantId,
        projectId: eq.projectId,
      },
    });

    // Ekipman için BLE Cihazı kaydı
    await prisma.bleDevice.upsert({
      where: { macAddress: `TAG:${eq.bleTagId}` },
      update: {
        deviceType: "EKIPMAN_TAG",
        assignedTo: equipment.id,
        batteryLevel: eq.battery,
        lastSeenAt: new Date(),
        projectId: project.id,
        tenantId: tenant.id,
      },
      create: {
        macAddress: `TAG:${eq.bleTagId}`,
        deviceType: "EKIPMAN_TAG",
        assignedTo: equipment.id,
        batteryLevel: eq.battery,
        lastSeenAt: new Date(),
        projectId: project.id,
        tenantId: tenant.id,
      },
    });

    console.log(`   🚜 ${equipment.name} (${eq.serialNumber}) -> Lat: ${eq.latitude}, Lng: ${eq.longitude} (Pil: %${eq.battery})`);
  }

  // İSG Risk Bölgesi (Geofence)
  console.log("🛡️ 6. İSG Risk Bölgesi (Geofence) Tanımlanıyor...");
  await prisma.riskZone.upsert({
    where: { id: "risk_zone_crane_01" },
    update: {
      projectId: project.id,
      tenantId: tenant.id,
      name: "Kule Vinç Çalışma Yarıçapı",
      zoneName: "A Blok Önü Ağır Yük Kaldırma Alanı",
      radius: 45.0,
      centerLat: 36.5885,
      centerLng: 36.1740,
      dangerLevel: "CRITICAL",
      requiredPpe: ["BARET", "YELEK", "IS_AYAKKABISI"],
    },
    create: {
      id: "risk_zone_crane_01",
      projectId: project.id,
      tenantId: tenant.id,
      name: "Kule Vinç Çalışma Yarıçapı",
      zoneName: "A Blok Önü Ağır Yük Kaldırma Alanı",
      radius: 45.0,
      centerLat: 36.5885,
      centerLng: 36.1740,
      dangerLevel: "CRITICAL",
      requiredPpe: ["BARET", "YELEK", "IS_AYAKKABISI"],
    },
  });

  console.log("================================================================================");
  console.log("🎉 NEXA FRANCHISE SEED İŞLEMİ BAŞARIYLA TAMAMLANDI!");
  console.log("================================================================================");
  console.log(`🏢 Tenant: nexa-franchise (ID: ${tenant.id})`);
  console.log(`👑 Super Admin: ${superAdmin.email} (Rol: SUPER_ADMIN)`);
  console.log(`📍 Proje: ${project.title} (İskenderun, Hatay)`);
  console.log("📍 Donanım: 2 Personel (Ahmet Yılmaz, Mehmet Demir) + 2 Ekipman (Kule Vinç 1, Ekskavatör)");
}

main()
  .catch((e) => {
    console.error("❌ Seed Hatası:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
