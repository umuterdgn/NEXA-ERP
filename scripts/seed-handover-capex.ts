/**
 * © 2026 NXA Software. All rights reserved.
 * Seed script for CAPEX m2, HandoverDocuments, and Tozsuz Ortam StageGate
 */

import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function main() {
  console.log("🌱 Seeding CAPEX, Handover Documents and Tozsuz Ortam StageGates...")

  // 1. Company SLA Score
  await prisma.company.updateMany({
    where: { companyType: "FRANCHISE" },
    data: { slaScore: 94.5 },
  })

  // 2. Projeleri güncelle (grossAreaSqm, totalCapex)
  const updates = [
    { id: "store-cevahir", sqm: 120, capex: 1850000, lat: 41.0628, lng: 28.9932 },
    { id: "store-tunali", sqm: 240, capex: 3600000, lat: 39.9056, lng: 32.8612 },
    { id: "store-alsancak", sqm: 95, capex: 1425000, lat: 38.4372, lng: 27.1438 },
    { id: "store-korupark", sqm: 150, capex: 2150000, lat: 40.2458, lng: 28.9567 },
    { id: "store-terracity", sqm: 180, capex: 2750000, lat: 36.8521, lng: 30.7584 },
  ]

  for (const item of updates) {
    const existing = await prisma.project.findUnique({ where: { id: item.id } })
    if (existing) {
      await prisma.project.update({
        where: { id: item.id },
        data: {
          grossAreaSqm: item.sqm,
          totalCapex: item.capex,
          latitude: item.lat,
          longitude: item.lng,
        },
      })
    }
  }

  // 3. Tozsuz Ortam (INSAAT_TEMIZLIGI) StageGate ekle
  // Cevahir'de onaylı olsun, Tunalı'da henüz onaylanmamış olsun (IT kilidi testi için)
  const cevahir = await prisma.project.findUnique({ where: { id: "store-cevahir" } })
  if (cevahir) {
    const existingGate = await prisma.stageGate.findFirst({
      where: { projectId: cevahir.id, stageName: "INSAAT_TEMIZLIGI" },
    })
    if (!existingGate) {
      await prisma.stageGate.create({
        data: {
          projectId: cevahir.id,
          stageName: "INSAAT_TEMIZLIGI",
          isRequired: true,
          isApproved: true,
          billingPercentage: 10,
          documentUrl: "https://example.com/tozsuz-ortam-tutanak.pdf",
          approvedAt: new Date(),
        },
      })
    }
  }

  const tunali = await prisma.project.findUnique({ where: { id: "store-tunali" } })
  if (tunali) {
    const existingGate = await prisma.stageGate.findFirst({
      where: { projectId: tunali.id, stageName: "INSAAT_TEMIZLIGI" },
    })
    if (!existingGate) {
      await prisma.stageGate.create({
        data: {
          projectId: tunali.id,
          stageName: "INSAAT_TEMIZLIGI",
          isRequired: true,
          isApproved: false, // Kilitli! IT Kurulumu yapılamaz!
          billingPercentage: 10,
        },
      })
    }
  }

  // 4. Dijital Devir-Teslim (Handover) Belgeleri
  const sampleDocs = [
    {
      projectId: "store-cevahir",
      documentType: "WARRANTY",
      title: "Mitsubishi Heavy VRF Klima 5 Yıl Garanti Belgesi",
      fileUrl: "https://example.com/klima-garanti-belgesi.pdf",
    },
    {
      projectId: "store-cevahir",
      documentType: "AS_BUILT_DRAWING",
      title: "Schneider Ana Dağıtım Panosu As-Built Şeması ve Sigorta Etiket Planı",
      fileUrl: "https://example.com/as-built-elektrik-cevahir.dwg",
    },
    {
      projectId: "store-cevahir",
      documentType: "MANUAL",
      title: "Otomatik Fotoselli Kayar Kapı Kullanım ve Acil Durum Kılavuzu",
      fileUrl: "https://example.com/fotosel-kapi-kilavuz.pdf",
    },
    {
      projectId: "store-cevahir",
      documentType: "PANEL_PHOTO",
      title: "Zayıf Akım Rack Kabin, Switch ve Fiber Patch Panel Montaj Fotoğrafı",
      fileUrl: "https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=800",
    },
    {
      projectId: "store-cevahir",
      documentType: "PANEL_PHOTO",
      title: "Yangın İhbar Santrali ve Gazlı Söndürme Tüpleri Devreye Alma Görseli",
      fileUrl: "https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800",
    },
    {
      projectId: "store-korupark",
      documentType: "WARRANTY",
      title: "Daikin Tavan Kaset Tipi Klima Garanti Belgesi",
      fileUrl: "https://example.com/daikin-garanti.pdf",
    },
    {
      projectId: "store-korupark",
      documentType: "AS_BUILT_DRAWING",
      title: "Mimari Kesin As-Built Yerleşim ve Teşhir Planı",
      fileUrl: "https://example.com/mimari-asbuilt-korupark.pdf",
    },
  ]

  for (const doc of sampleDocs) {
    const proj = await prisma.project.findUnique({ where: { id: doc.projectId } })
    if (proj) {
      const existing = await prisma.handoverDocument.findFirst({
        where: { projectId: doc.projectId, title: doc.title },
      })
      if (!existing) {
        await prisma.handoverDocument.create({ data: doc })
      }
    }
  }

  console.log("✅ CAPEX, Handover Documents ve Tozsuz Ortam aşamaları hazırlandı.")
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
