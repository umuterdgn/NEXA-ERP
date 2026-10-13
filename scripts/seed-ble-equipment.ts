import { prisma } from "../lib/prisma"

async function main() {
  console.log("🌱 Seeding BLE equipment data...")

  // Update projects without coordinates if any
  await prisma.project.updateMany({
    where: { id: "project-1", latitude: null },
    data: { latitude: 41.0822, longitude: 29.0112, name: "Modern Plaza İş Merkezi" }
  })
  await prisma.project.updateMany({
    where: { id: "project-2", latitude: null },
    data: { latitude: 39.9208, longitude: 32.8541, name: "Eco Valley Konakları" }
  })
  await prisma.project.updateMany({
    where: { id: "project-3", latitude: null },
    data: { latitude: 38.4237, longitude: 27.1428, name: "Tech Park Araştırma Merkezi" }
  })

  // Ensure Vadi Evleri exists
  let vadiProject = await prisma.project.findUnique({
    where: { id: "project-vadi" }
  })

  if (!vadiProject) {
    vadiProject = await prisma.project.create({
      data: {
        id: "project-vadi",
        title: "Vadi Evleri Konut Projesi",
        name: "Vadi Evleri Konut Projesi",
        description: "Vadi Evleri Şantiye ve Konut Projesi",
        latitude: 41.0122,
        longitude: 28.8825,
        status: "SAHA",
        yibfNo: "YİBF-34-8842",
        healthScore: 92,
        progress: 68
      }
    })
  }

  // Equipment sample definitions for Vadi Evleri
  const vadiEquipments = [
    {
      name: "Hilti TE 70-ATC Kırıcı Delici",
      type: "ELEKTRONIK",
      category: "Delme & Kırma",
      status: "AKTIF",
      serialNumber: "SN-HLT-70912",
      bleTagId: "BLE-HLT-001",
      latitude: 41.01254,
      longitude: 28.88285,
      lastSeenAt: new Date(Date.now() - 2 * 60 * 1000), // 2 min ago
      projectId: vadiProject.id
    },
    {
      name: "Bosch GRL 600 CHV Rotasyon Lazeri",
      type: "ELEKTRONIK",
      category: "Ölçüm Cihazı",
      status: "AKTIF",
      serialNumber: "SN-BSH-60041",
      bleTagId: "BLE-BSH-084",
      latitude: 41.01186,
      longitude: 28.88212,
      lastSeenAt: new Date(Date.now() - 14 * 60 * 1000), // 14 min ago
      projectId: vadiProject.id
    },
    {
      name: "CAT 320 Ekskavatör (Paletli)",
      type: "IS_MAKINESI",
      category: "Ağır İş Makinesi",
      status: "AKTIF",
      serialNumber: "SN-CAT-32099",
      bleTagId: "BLE-CAT-320",
      latitude: 41.01289,
      longitude: 28.88334,
      lastSeenAt: new Date(Date.now() - 45 * 60 * 1000), // 45 min ago
      projectId: vadiProject.id
    },
    {
      name: "Stihl TS 800 Beton Kesme Testeresi",
      type: "ELEKTRONIK",
      category: "Kesim Ekipmanı",
      status: "KAYIP",
      serialNumber: "SN-STL-80023",
      bleTagId: "BLE-STL-912",
      latitude: 41.01138,
      longitude: 28.88195,
      lastSeenAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
      projectId: vadiProject.id
    },
    {
      name: "Leica TS16 Total Station",
      type: "ELEKTRONIK",
      category: "Harita & Ölçüm",
      status: "AKTIF",
      serialNumber: "SN-LCA-16001",
      bleTagId: "BLE-LCA-505",
      latitude: 41.01211,
      longitude: 28.88392,
      lastSeenAt: new Date(Date.now() - 4 * 60 * 1000), // 4 min ago
      projectId: vadiProject.id
    }
  ]

  for (const eq of vadiEquipments) {
    const existing = await prisma.equipment.findFirst({
      where: {
        OR: [
          { bleTagId: eq.bleTagId },
          { serialNumber: eq.serialNumber }
        ]
      }
    })

    if (existing) {
      await prisma.equipment.update({
        where: { id: existing.id },
        data: {
          name: eq.name,
          type: eq.type,
          category: eq.category,
          status: eq.status,
          bleTagId: eq.bleTagId,
          latitude: eq.latitude,
          longitude: eq.longitude,
          lastSeenAt: eq.lastSeenAt,
          projectId: eq.projectId,
          lastLat: eq.latitude,
          lastLng: eq.longitude
        }
      })
    } else {
      await prisma.equipment.create({
        data: {
          ...eq,
          lastLat: eq.latitude,
          lastLng: eq.longitude
        }
      })
    }
  }

  // Also seed for Nexa Plaza if exists
  const plazaProject = await prisma.project.findFirst({
    where: { OR: [{ id: "project-plaza" }, { title: { contains: "Nexa Plaza" } }] }
  })
  if (plazaProject) {
    const plazaEquipments = [
      {
        name: "Hilti DD 250 Karot Makinesi",
        type: "ELEKTRONIK",
        category: "Delme Sistemleri",
        status: "AKTIF",
        serialNumber: "SN-HLT-25011",
        bleTagId: "BLE-HLT-250",
        latitude: (plazaProject.latitude || 40.9901) + 0.0003,
        longitude: (plazaProject.longitude || 29.0292) + 0.0004,
        lastSeenAt: new Date(Date.now() - 8 * 60 * 1000),
        projectId: plazaProject.id
      },
      {
        name: "Komatsu WA380 Lastikli Yükleyici",
        type: "IS_MAKINESI",
        category: "İş Makinesi",
        status: "AKTIF",
        serialNumber: "SN-KMT-38022",
        bleTagId: "BLE-KMT-380",
        latitude: (plazaProject.latitude || 40.9901) - 0.0004,
        longitude: (plazaProject.longitude || 29.0292) - 0.0002,
        lastSeenAt: new Date(Date.now() - 30 * 60 * 1000),
        projectId: plazaProject.id
      },
      {
        name: "Wacker Neuson Titreşimli Kompaktör",
        type: "IS_MAKINESI",
        category: "Sıkıştırma",
        status: "KAYIP",
        serialNumber: "SN-WCK-10155",
        bleTagId: "BLE-WCK-101",
        latitude: (plazaProject.latitude || 40.9901) + 0.0006,
        longitude: (plazaProject.longitude || 29.0292) - 0.0003,
        lastSeenAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        projectId: plazaProject.id
      }
    ]

    for (const eq of plazaEquipments) {
      const existing = await prisma.equipment.findFirst({
        where: {
          OR: [
            { bleTagId: eq.bleTagId },
            { serialNumber: eq.serialNumber }
          ]
        }
      })
      if (existing) {
        await prisma.equipment.update({
          where: { id: existing.id },
          data: {
            ...eq,
            lastLat: eq.latitude,
            lastLng: eq.longitude
          }
        })
      } else {
        await prisma.equipment.create({
          data: {
            ...eq,
            lastLat: eq.latitude,
            lastLng: eq.longitude
          }
        })
      }
    }
  }

  // Also seed for İskenderun Sahil Yolu
  const iskenderunProject = await prisma.project.findFirst({
    where: { OR: [{ id: "project-iskenderun" }, { title: { contains: "İskenderun" } }] }
  })
  if (iskenderunProject) {
    const iskenderunEquipments = [
      {
        name: "JCB 3CX Kazıcı Yükleyici (Beko Loder)",
        type: "IS_MAKINESI",
        category: "Ağır İş Makinesi",
        status: "AKTIF",
        serialNumber: "SN-JCB-30310",
        bleTagId: "BLE-JCB-303",
        latitude: (iskenderunProject.latitude || 36.2023) + 0.0004,
        longitude: (iskenderunProject.longitude || 36.1605) + 0.0003,
        lastSeenAt: new Date(Date.now() - 3 * 60 * 1000),
        projectId: iskenderunProject.id
      },
      {
        name: "Hilti PR 30-HVS Döner Lazer",
        type: "ELEKTRONIK",
        category: "Ölçüm Cihazı",
        status: "AKTIF",
        serialNumber: "SN-HLT-03099",
        bleTagId: "BLE-HLT-030",
        latitude: (iskenderunProject.latitude || 36.2023) - 0.0003,
        longitude: (iskenderunProject.longitude || 36.1605) - 0.0004,
        lastSeenAt: new Date(Date.now() - 18 * 60 * 1000),
        projectId: iskenderunProject.id
      }
    ]

    for (const eq of iskenderunEquipments) {
      const existing = await prisma.equipment.findFirst({
        where: {
          OR: [
            { bleTagId: eq.bleTagId },
            { serialNumber: eq.serialNumber }
          ]
        }
      })
      if (existing) {
        await prisma.equipment.update({
          where: { id: existing.id },
          data: {
            ...eq,
            lastLat: eq.latitude,
            lastLng: eq.longitude
          }
        })
      } else {
        await prisma.equipment.create({
          data: {
            ...eq,
            lastLat: eq.latitude,
            lastLng: eq.longitude
          }
        })
      }
    }
  }

  console.log("✅ Seed completed successfully!")
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
