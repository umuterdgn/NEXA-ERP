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

  // Create or verify sample WorkProof 1
  const wp1 = await prisma.workProof.findFirst({
    where: { title: "1. Kat Kolon Kalıpları Döküm Öncesi Kanıtı" }
  })

  if (!wp1) {
    await prisma.workProof.create({
      data: {
        contractId: contractKalıp.id,
        subcontractorId: contractKalıp.subcontractorId,
        title: "1. Kat Kolon Kalıpları Döküm Öncesi Kanıtı",
        description: "A Blok 1. Kat K1-K8 arası kolonların kalıp montajı, şakül kontrolü ve paspayları tamamlandı. Beton dökümüne hazır.",
        imageUrl: "/uploads/1786367621980-r7jn37.jpg",
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
        title: "A Blok Zemin Kat Kablo Tavası Montajı",
        description: "Ana pano odası ile şaft arası 600mm galvaniz kablo tavası montajı şartnameye uygun olarak askı aparatlarıyla tamamlandı.",
        imageUrl: "/uploads/1786367660199-vifc0j.jpg",
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
        title: "Bodrum Kat Topraklama Şeridi Çekimi",
        description: "Temel altı ve çevre ihata topraklama galvaniz şeridi kaynak bağlantıları yapılarak korozyon boyası sürüldü.",
        imageUrl: "/uploads/1786802285568-nsp17p.jpg",
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
