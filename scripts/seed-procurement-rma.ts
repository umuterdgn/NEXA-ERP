/**
 * © 2026 NXA Software. All rights reserved.
 * Franchise Konsolide Satınalma ve RMA Örnek Veri Tohumlama
 */

import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function main() {
  console.log("🌱 Seeding Consolidated Procurement and Delivery Issues (RMA)...")

  // Projeleri çek
  const projects = await prisma.project.findMany({ take: 5 })
  if (projects.length === 0) {
    console.log("❌ Proje bulunamadı, önce seed-franchise çalıştırılmalı.")
    return
  }

  // 1. Konsolide Satınalma Talepleri (Farklı mağazalardan gelen ortak malzeme talepleri)
  const p1 = projects[0]
  const p2 = projects[1] || projects[0]
  const p3 = projects[2] || projects[0]

  const req1 = await prisma.purchaseRequest.create({
    data: {
      projectId: p1.id,
      materialName: "Çift Kapılı İçecek Teşhir Soğutucu Dolabı",
      quantity: 5,
      unit: "Adet",
      status: "OPEN_FOR_BID",
    },
  })

  const req2 = await prisma.purchaseRequest.create({
    data: {
      projectId: p2.id,
      materialName: "Çift Kapılı İçecek Teşhir Soğutucu Dolabı",
      quantity: 6,
      unit: "Adet",
      status: "OPEN_FOR_BID",
    },
  })

  const req3 = await prisma.purchaseRequest.create({
    data: {
      projectId: p3.id,
      materialName: "Çift Kapılı İçecek Teşhir Soğutucu Dolabı",
      quantity: 4,
      unit: "Adet",
      status: "OPEN_FOR_BID",
    },
  })

  const req4 = await prisma.purchaseRequest.create({
    data: {
      projectId: p1.id,
      materialName: "Kurumsal Modüler Mağaza Kasa Bankosu",
      quantity: 2,
      unit: "Adet",
      status: "OPEN_FOR_BID",
    },
  })

  const req5 = await prisma.purchaseRequest.create({
    data: {
      projectId: p2.id,
      materialName: "Kurumsal Modüler Mağaza Kasa Bankosu",
      quantity: 2,
      unit: "Adet",
      status: "OPEN_FOR_BID",
    },
  })

  // Bir paket konsolide edilmiş olsun
  const consolidated = await prisma.consolidatedProcurement.create({
    data: {
      title: "Kasım Ayı Yeni Açılışlar Ortak Soğutucu Dolap Tedariği",
      status: "TENDER_ACTIVE",
      requests: {
        connect: [{ id: req1.id }, { id: req2.id }, { id: req3.id }],
      },
    },
  })

  console.log("✅ Konsolide Satınalma Paketi oluşturuldu:", consolidated.title)

  // 2. Goods Receipt ve DeliveryIssue (Hasarlı Teslimat)
  const gr1 = await prisma.goodsReceipt.create({
    data: {
      purchaseRequestId: req1.id,
      orderedQuantity: 5,
      deliveredQuantity: 4,
      waybillNo: "IRS-2026-88192",
      receivedById: "Saha-Yetkilisi-Murat",
    },
  })

  const issue1 = await prisma.deliveryIssue.create({
    data: {
      goodsReceiptId: gr1.id,
      issueType: "DAMAGED",
      description: "Soğutucu dolabın sol yan sacında nakliye kaynaklı 30 cm derin göçük ve cam kapak çatlağı mevcut.",
      photoUrls: [
        "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=800",
        "https://images.unsplash.com/photo-1513694203232-719a280e022f?w=800",
      ],
      status: "REPORTED",
    },
  })

  const gr2 = await prisma.goodsReceipt.create({
    data: {
      purchaseRequestId: req4.id,
      orderedQuantity: 2,
      deliveredQuantity: 2,
      waybillNo: "IRS-2026-90412",
      receivedById: "Saha-Yetkilisi-Murat",
    },
  })

  const issue2 = await prisma.deliveryIssue.create({
    data: {
      goodsReceiptId: gr2.id,
      issueType: "WRONG_ITEM",
      description: "Sipariş edilen ceviz kaplama kasa arkası görsel paneli yerine açık meşe teslim edilmiş. Kurumsal renk koduna uymuyor.",
      photoUrls: [
        "https://images.unsplash.com/photo-1541888946425-d0fbb18615f3?w=800",
      ],
      status: "REPLACEMENT_SENT",
    },
  })

  console.log("✅ Hasarlı Teslimat (DeliveryIssue) kayıtları oluşturuldu.")
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
