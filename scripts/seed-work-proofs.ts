import { prisma } from "../lib/prisma"

async function main() {
  console.log("🌱 Seeding WorkProof data...")

  const contractKalıp = await prisma.contract.findFirst({
    where: { subcontractorId: "sub-yilmazlar" }
  })

  const contractElektrik = await prisma.contract.findFirst({
    where: { subcontractorId: "sub-demirtas" }
  })

  if (!contractKalıp || !contractElektrik) {
    console.log("Contracts not found, skipping...")
    return
  }

  // Ensure sample BoqItems exist for contracts
  let boqKalıp = await prisma.boqItem.findFirst({ where: { projectId: contractKalıp.projectId } })
  if (!boqKalıp) {
    boqKalıp = await prisma.boqItem.create({
      data: {
        projectId: contractKalıp.projectId,
        pozNo: "15.180.3012",
        description: "Plywood Düz Yüzeyli Betonarme Kalıbı Yapılması",
        unit: "m²",
        unitPrice: 420,
        plannedQuantity: 1800,
        totalPrice: 756000,
      },
    })
  }

  let boqElektrik = await prisma.boqItem.findFirst({ where: { projectId: contractElektrik.projectId } })
  if (!boqElektrik) {
    boqElektrik = await prisma.boqItem.create({
      data: {
        projectId: contractElektrik.projectId,
        pozNo: "70.100.1005",
        description: "Galvaniz Kablo Tavası Montajı",
        unit: "mt",
        unitPrice: 380,
        plannedQuantity: 450,
        totalPrice: 171000,
      },
    })
  }

  // Create or verify sample WorkProof 1
  const wp1 = await prisma.workProof.findFirst({
    where: { title: "1. Kat Kolon Kalıpları Döküm Öncesi Kanıtı" }
  })

  if (!wp1) {
    await prisma.workProof.create({
      data: {
        contractId: contractKalıp.id,
        subcontractorId: contractKalıp.subcontractorId,
        projectId: contractKalıp.projectId,
        boqItemId: boqKalıp.id,
        claimedQuantity: 85,
        approvedQuantity: 85,
        title: "1. Kat Kolon Kalıpları Döküm Öncesi Kanıtı",
        description: "A Blok 1. Kat K1-K8 arası kolonların kalıp montajı, şakül kontrolü ve paspayları tamamlandı. Beton dökümüne hazır.",
        imageUrl: "/uploads/1786367621980-r7jn37.jpg",
        photoUrl: "/uploads/1786367621980-r7jn37.jpg",
        bimElementId: "IFC-COL-1F-001",
        gpsLatitude: 41.0082,
        gpsLongitude: 28.9784,
        status: "PENDING",
        createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000)
      }
    })
  }

  // Create or verify sample WorkProof 2
  const wp2 = await prisma.workProof.findFirst({
    where: { title: "A Blok Zemin Kat Kablo Tavası Montajı" }
  })

  if (!wp2) {
    await prisma.workProof.create({
      data: {
        contractId: contractElektrik.id,
        subcontractorId: contractElektrik.subcontractorId,
        projectId: contractElektrik.projectId,
        boqItemId: boqElektrik.id,
        claimedQuantity: 45,
        approvedQuantity: 45,
        title: "A Blok Zemin Kat Kablo Tavası Montajı",
        description: "Ana pano odası ile şaft arası 600mm galvaniz kablo tavası montajı şartnameye uygun olarak askı aparatlarıyla tamamlandı.",
        imageUrl: "/uploads/1786367660199-vifc0j.jpg",
        photoUrl: "/uploads/1786367660199-vifc0j.jpg",
        bimElementId: "IFC-TRAY-GF-012",
        gpsLatitude: 41.0084,
        gpsLongitude: 28.9786,
        status: "PENDING",
        createdAt: new Date(Date.now() - 8 * 60 * 60 * 1000)
      }
    })
  }

  // Create or verify sample WorkProof 3 (Approved sample)
  const wp3 = await prisma.workProof.findFirst({
    where: { title: "Bodrum Kat Topraklama Şeridi Çekimi" }
  })

  if (!wp3) {
    await prisma.workProof.create({
      data: {
        contractId: contractElektrik.id,
        subcontractorId: contractElektrik.subcontractorId,
        projectId: contractElektrik.projectId,
        boqItemId: boqElektrik.id,
        claimedQuantity: 120,
        approvedQuantity: 120,
        title: "Bodrum Kat Topraklama Şeridi Çekimi",
        description: "Temel altı ve çevre ihata topraklama galvaniz şeridi kaynak bağlantıları yapılarak korozyon boyası sürüldü.",
        imageUrl: "/uploads/1786802285568-nsp17p.jpg",
        photoUrl: "/uploads/1786802285568-nsp17p.jpg",
        bimElementId: "IFC-GROUND-B1-004",
        gpsLatitude: 41.0081,
        gpsLongitude: 28.9782,
        status: "APPROVED",
        createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000)
      }
    })
  }

  console.log("✅ WorkProof sample data seeded successfully!")
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
