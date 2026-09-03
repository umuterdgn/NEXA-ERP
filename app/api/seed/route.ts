/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * This code is the property of NXA Software.
 */

import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

export async function GET() {
  try {
    // Hash the default password
    const hashedPassword = await bcrypt.hash("123456", 10);

    // 0. Create default users
    await prisma.user.upsert({
      where: { email: "admin@mahirbakay.com" },
      update: {},
      create: {
        email: "admin@mahirbakay.com",
        password: hashedPassword,
        name: "OS Admin",
        role: "ADMIN",
        permissions: []
      }
    });

    await prisma.user.upsert({
      where: { email: "personel@mahirbakay.com" },
      update: {},
      create: {
        email: "personel@mahirbakay.com",
        password: hashedPassword,
        name: "OS Personel",
        role: "STAFF",
        permissions: []
      }
    });

    await prisma.user.upsert({
      where: { email: "muteahhit@ornek.com" },
      update: {},
      create: {
        email: "muteahhit@ornek.com",
        password: hashedPassword,
        name: "Müteahhit Admin",
        role: "MUTEAHHIT" as any,
        permissions: []
      }
    });

    await prisma.user.upsert({
      where: { email: "isci@ornek.com" },
      update: {},
      create: {
        email: "isci@ornek.com",
        password: hashedPassword,
        name: "Müteahhit Personel",
        role: "WORKER" as any,
        permissions: []
      }
    });

    // 1. Personel Verileri
    const p1 = await prisma.personel.create({ data: { name: "Umut Erdoğan", position: "Şantiye Şefi", personnelNo: "P001", age: 35, birthDate: new Date("1990-01-01"), department: "Yönetim", currentSite: "İskenderun TOKİ", hireDate: new Date("2020-01-01"), status: "ACTIVE" } });
    const p2 = await prisma.personel.create({ data: { name: "Kutay Erdoğan", position: "İSG Uzmanı", personnelNo: "P002", age: 30, birthDate: new Date("1995-01-01"), department: "İSG", currentSite: "İskenderun TOKİ", hireDate: new Date("2021-01-01"), status: "ACTIVE" } });
    const p3 = await prisma.personel.create({ data: { name: "Ahmet Yılmaz", position: "Formen", personnelNo: "P003", age: 40, birthDate: new Date("1985-01-01"), department: "Şantiye", currentSite: "İskenderun TOKİ", hireDate: new Date("2019-01-01"), status: "ACTIVE" } });
    const p4 = await prisma.personel.create({ data: { name: "Mehmet Demir", position: "Operatör", personnelNo: "P004", age: 38, birthDate: new Date("1987-01-01"), department: "Makine", currentSite: "İskenderun TOKİ", hireDate: new Date("2022-01-01"), status: "ACTIVE" } });

    // 2. İSG Sertifikaları
    await prisma.certificate.createMany({
      data: [
        { name: "Yüksekte Çalışma Belgesi", expiryDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), personelId: p2.id }, // 5 gün kalmış (Kritik)
        { name: "İSG Temel Eğitimi", expiryDate: new Date(Date.now() + 120 * 24 * 60 * 60 * 1000), personelId: p1.id },
        { name: "Vinç Operatörü Belgesi", expiryDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), personelId: p4.id },
      ]
    });

    // 3. Ramak Kala (Near Miss) Raporları
    await prisma.nearMissReport.createMany({
      data: [
        { isAnonymous: true, location: "İskenderun TOKİ - A Blok, 3. Kat", category: "Düşme Riski", severity: "Yüksek", description: "Asansör boşluğunda korkuluk ipi kopmuş, az kalsın aşağı düşüyordum.", status: "Açık" },
        { isAnonymous: false, location: "Vinç Çalışma Alanı", category: "Malzeme Düşmesi", severity: "Orta", description: "Vinç yük alırken sapanlardan biri sıyırdı, yük kıl payı kenara düştü.", status: "Beklemede" }
      ]
    });

    // 4. KKD Zimmet Formları
    await prisma.pPEDelivery.create({
      data: { equipment: "Güvenlik Bareti, Reflektörlü Yelek, İş Eldiveni", signature: "U.Erdoğan (Dijital İmza)", personelId: p1.id, status: "Onaylandı" }
    });
    await prisma.pPEDelivery.create({
      data: { equipment: "Paraşüt Tipi Emniyet Kemeri, Baret", signature: "K.Erdoğan (Dijital İmza)", personelId: p2.id, status: "Onaylandı" }
    });

    // 5. QA/QC - Malzeme Onayları
    await prisma.materialSubmittal.createMany({
      data: [
        { materialName: "Demir (S420)", brand: "Erdemir", batchNumber: "B-2026-001", tseCertificate: true, status: "Onaylandı", inspectorName: "Kutay Erdoğan", notes: "Çekme testi standartlara uygun." },
        { materialName: "Çimento (CEM I 42.5)", brand: "Çimsa", batchNumber: "B-2026-002", tseCertificate: true, status: "Onay Bekliyor", notes: "Laboratuvar sonuçları bekleniyor." },
        { materialName: "Seramik (60x60)", brand: "Kaleseramik", batchNumber: "B-2026-003", tseCertificate: false, status: "Reddedildi", inspectorName: "Umut Erdoğan", notes: "İstenen renk kodlarına uymuyor." }
      ]
    });

    // 6. QA/QC - Uygunsuzluk (DÖF)
    await prisma.nonConformanceReport.createMany({
      data: [
        { location: "B Blok - Zemin Kat", issueType: "Paspayı Yetersiz", description: "Kolon paspayı kalınlığı 20cm olması gerekirken 15cm ölçüldü.", subcontractor: "Demirci Ekibi", status: "Açık", dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000) },
        { location: "A Blok - 2. Kat", issueType: "Kalıp Sızdırmazlığı", description: "Kalıp birleşim noktalarında mastik uygulaması eksik.", subcontractor: "Kalıpçı Ekibi", status: "İşlemde", dueDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000) }
      ]
    });

    // 7. Lojistik ve Randevu Takibi
    await prisma.logisticsSchedule.createMany({
      data: [
        { title: "C30 Beton Dökümü - A Blok", type: "BETON", location: "A Blok - Zemin", supplierName: "Çimsa", driverContact: "0555 123 45 67", status: "Yolda", scheduledAt: new Date(Date.now() + 2 * 60 * 60 * 1000) },
        { title: "İSG Genel Denetimi", type: "DENETİM", location: "Tüm Şantiye", supplierName: "Bakanlık Müfettişleri", driverContact: "-", status: "Planlandı", scheduledAt: new Date(Date.now() + 24 * 60 * 60 * 1000) },
        { title: "Demir Sevkiyatı (20 Ton)", type: "MALZEME", location: "B Blok Depo Alanı", supplierName: "Erdemir", driverContact: "0532 987 65 43", status: "Şantiyede", scheduledAt: new Date(Date.now() - 1 * 60 * 60 * 1000) }
      ]
    });

    // 8. İç Haberleşme (Chat)
    await prisma.chatMessage.createMany({
      data: [
        { senderId: p1.id, channelName: "Şantiye Şefleri", content: "Beton pompası sahaya ulaştı mı?" },
        { senderId: p3.id, channelName: "Şantiye Şefleri", content: "Evet şefim, mikserler de yolda." },
        { senderId: p2.id, channelName: "İSG Acil Durum", content: "A Blok 3. katta korkuluk sorunu var, ekibi yönlendiriyorum.", attachmentType: "NCR_REPORT" }
      ]
    });

    return NextResponse.json({ message: "Veritabanı başarıyla demo verileriyle dolduruldu!" }, { status: 200 });
  } catch (error) {
    console.error("Seed hatası:", error);
    return NextResponse.json({ error: "Veri eklenirken hata oluştu." }, { status: 500 });
  }
}
