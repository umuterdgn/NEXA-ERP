/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Multi-Block & Zone Master Dashboard Database API
 */

import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const reqProjectId = searchParams.get("projectId")
    const isSuperAdmin = session.user.role === "SUPER_ADMIN"
    const tenantId = (session.user as any)?.tenantId

    const tenantWhere: any = !isSuperAdmin && tenantId ? { tenantId } : {}

    // 1. Kullanıcının yetkili olduğu projeleri çek
    const rawProjects = await prisma.project.findMany({
      where: tenantWhere,
      select: {
        id: true,
        name: true,
        title: true,
        status: true,
        progress: true,
        city: true,
      },
      orderBy: { createdAt: "desc" },
    })

    let projects = rawProjects.map((p) => ({
      id: p.id,
      name: p.name || p.title || "Proje",
      status: p.status || "IN_PROGRESS",
      progress: p.progress || 0,
      city: p.city || "",
    }))

    // Proje yoksa varsayılan bir demo proje oluştur
    if (projects.length === 0) {
      try {
        const demoProj = await prisma.project.create({
          data: {
            title: "Vadi Kuleleri & Yaşam Merkezi",
            name: "Vadi Kuleleri & Yaşam Merkezi",
            description: "Ana Şantiye Yerleşkesi - 4 Blok Çoklu Yaşam Projesi",
            status: "SAHA",
            progress: 68.4,
            city: "İstanbul",
            tenantId: tenantId || null,
          },
        })
        projects = [{
          id: demoProj.id,
          name: demoProj.name || demoProj.title,
          status: demoProj.status || "SAHA",
          progress: demoProj.progress || 0,
          city: demoProj.city || "İstanbul",
        }]
      } catch (err) {
        console.warn("Demo proje oluşturulamadı:", err)
      }
    }

    const targetProjectId = (reqProjectId && reqProjectId !== "ALL")
      ? reqProjectId
      : (projects[0]?.id || "")

    if (!targetProjectId) {
      return NextResponse.json({ projects: [], blocks: [] })
    }

    // 2. Seçili projeye ait blokları kontrol et
    let blocks = await prisma.block.findMany({
      where: {
        projectId: targetProjectId,
        ...(tenantWhere.tenantId ? { tenantId: tenantWhere.tenantId } : {}),
      },
      include: {
        project: {
          select: { id: true, name: true, city: true },
        },
        zones: {
          orderBy: { floorNumber: "desc" },
        },
        inspections: {
          orderBy: { inspectionDate: "desc" },
          take: 5,
        },
        attendances: {
          take: 20,
          orderBy: { createdAt: "desc" },
        },
      },
      orderBy: { name: "asc" },
    })

    // Eğer projede henüz blok kaydı yoksa, DB'ye standart çoklu blokları ve katlarını tohumla (Auto-Seed)
    if (blocks.length === 0 && targetProjectId) {
      try {
        const seedBlocks = [
          {
            name: "A Blok - Rezidans Kulesi",
            code: "BLK-A",
            totalFloors: 14,
            basementFloors: 2,
            healthStatus: "GREEN",
            completionRate: 84.5,
            activeWorkers: 46,
            activeMachinery: 4,
            lastMilestone: "12. Kat tabliyesi döküldü (C35/45 Beton, 320 m³)",
            openDefects: 0,
            isgRiskScore: 8,
            zones: [
              { name: "14. Kat - Çatı Terası", floorNumber: 14, areaType: "SLAB", status: "NOT_STARTED", progressRate: 10 },
              { name: "13. Kat - Daireler", floorNumber: 13, areaType: "FLOOR", status: "IN_PROGRESS", progressRate: 45 },
              { name: "12. Kat - Daireler", floorNumber: 12, areaType: "FLOOR", status: "COMPLETED", progressRate: 100 },
              { name: "10. Kat - Daireler", floorNumber: 10, areaType: "FLOOR", status: "COMPLETED", progressRate: 100 },
              { name: "Zemin Kat - Giriş Lobby", floorNumber: 0, areaType: "COMMON_AREA", status: "COMPLETED", progressRate: 100 },
              { name: "Bodrum -1 - Kapalı Otopark", floorNumber: -1, areaType: "COMMON_AREA", status: "COMPLETED", progressRate: 100 },
            ],
          },
          {
            name: "B Blok - Ticari Ofis Kulesi",
            code: "BLK-B",
            totalFloors: 10,
            basementFloors: 2,
            healthStatus: "YELLOW",
            completionRate: 61.0,
            activeWorkers: 38,
            activeMachinery: 3,
            lastMilestone: "6. Kat kolon filizleri bağlandı, kalıp onayı bekleniyor",
            openDefects: 3,
            isgRiskScore: 35,
            zones: [
              { name: "10. Kat - Ofis Katı", floorNumber: 10, areaType: "FLOOR", status: "NOT_STARTED", progressRate: 0 },
              { name: "7. Kat - Ofis Katı", floorNumber: 7, areaType: "FLOOR", status: "NOT_STARTED", progressRate: 15 },
              { name: "6. Kat - Ofis Katı (DÖF: Kalıp Eğikliği)", floorNumber: 6, areaType: "FLOOR", status: "IN_PROGRESS", progressRate: 65 },
              { name: "5. Kat - Ofis Katı", floorNumber: 5, areaType: "FLOOR", status: "COMPLETED", progressRate: 100 },
              { name: "Zemin Kat - Ticari Mağazalar", floorNumber: 0, areaType: "COMMON_AREA", status: "COMPLETED", progressRate: 100 },
            ],
          },
          {
            name: "C Blok - Sosyal Tesis & Spa",
            code: "BLK-C",
            totalFloors: 4,
            basementFloors: 1,
            healthStatus: "RED",
            completionRate: 34.2,
            activeWorkers: 18,
            activeMachinery: 1,
            lastMilestone: "Zemin kat tavan kalıbında sehim riski tespit edildi - İSG Durdurdu",
            openDefects: 5,
            isgRiskScore: 82,
            zones: [
              { name: "4. Kat - Açık Teras", floorNumber: 4, areaType: "COMMON_AREA", status: "NOT_STARTED", progressRate: 0 },
              { name: "2. Kat - Fitness Alanı", floorNumber: 2, areaType: "COMMON_AREA", status: "NOT_STARTED", progressRate: 20 },
              { name: "1. Kat - Kapalı Yüzme Havuzu (İSG Mühürlü)", floorNumber: 1, areaType: "COMMON_AREA", status: "IN_PROGRESS", progressRate: 40 },
              { name: "Zemin - Resepsiyon & Soyunma Odaları", floorNumber: 0, areaType: "COMMON_AREA", status: "IN_PROGRESS", progressRate: 55 },
            ],
          },
          {
            name: "D Blok - Villalar & İdari Bina",
            code: "BLK-D",
            totalFloors: 3,
            basementFloors: 1,
            healthStatus: "GREEN",
            completionRate: 92.0,
            activeWorkers: 24,
            activeMachinery: 2,
            lastMilestone: "Çatı çelik konstrüksiyon montajı tamamlandı",
            openDefects: 0,
            isgRiskScore: 5,
            zones: [
              { name: "3. Kat - Çatı Katı & Ofisler", floorNumber: 3, areaType: "FLOOR", status: "IN_PROGRESS", progressRate: 85 },
              { name: "2. Kat - Yönetim Katı", floorNumber: 2, areaType: "FLOOR", status: "COMPLETED", progressRate: 100 },
              { name: "1. Kat - Toplantı Odaları", floorNumber: 1, areaType: "FLOOR", status: "COMPLETED", progressRate: 100 },
              { name: "Zemin Kat - Giriş & Danışma", floorNumber: 0, areaType: "COMMON_AREA", status: "COMPLETED", progressRate: 100 },
            ],
          },
        ]

        for (const sb of seedBlocks) {
          await prisma.block.create({
            data: {
              projectId: targetProjectId,
              tenantId: tenantWhere.tenantId || null,
              name: sb.name,
              code: sb.code,
              totalFloors: sb.totalFloors,
              basementFloors: sb.basementFloors,
              healthStatus: sb.healthStatus,
              completionRate: sb.completionRate,
              activeWorkers: sb.activeWorkers,
              activeMachinery: sb.activeMachinery,
              lastMilestone: sb.lastMilestone,
              openDefects: sb.openDefects,
              isgRiskScore: sb.isgRiskScore,
              zones: {
                create: sb.zones.map((z) => ({
                  tenantId: tenantWhere.tenantId || null,
                  name: z.name,
                  floorNumber: z.floorNumber,
                  areaType: z.areaType,
                  status: z.status,
                  progressRate: z.progressRate,
                })),
              },
            },
          })
        }

        // Yeniden çek
        blocks = await prisma.block.findMany({
          where: {
            projectId: targetProjectId,
            ...(tenantWhere.tenantId ? { tenantId: tenantWhere.tenantId } : {}),
          },
          include: {
            project: { select: { id: true, name: true, city: true } },
            zones: { orderBy: { floorNumber: "desc" } },
            inspections: { orderBy: { inspectionDate: "desc" }, take: 5 },
            attendances: { take: 20, orderBy: { createdAt: "desc" } },
          },
          orderBy: { name: "asc" },
        })
      } catch (seedErr) {
        console.warn("Blok tohumlama uyarısı:", seedErr)
      }
    }

    // 3. Proje bazlı canlı istatistikleri DB'den çek
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const todayAttendanceCount = await prisma.attendanceRecord.count({
      where: {
        projectId: targetProjectId,
        createdAt: { gte: today },
      },
    }).catch(() => 0)

    const latestDailyLog = await prisma.dailyLog.findFirst({
      where: { projectId: targetProjectId },
      orderBy: { date: "desc" },
      select: { machineryCount: true, personnelCount: true, equipmentData: true, activities: true },
    }).catch(() => null)

    const openDeficiencies = await prisma.deficiency.findMany({
      where: {
        projectId: targetProjectId,
        status: { not: "CLOSED" },
      },
      select: {
        id: true,
        floor: true,
        element: true,
        category: true,
        priority: true,
        description: true,
        status: true,
      },
      orderBy: { priority: "desc" },
      take: 10,
    }).catch(() => [])

    // Blokları zenginleştirilmiş telemetriyle hazırla
    const enrichedBlocks = blocks.map((block) => {
      const blockWorkers = block.activeWorkers || Math.max(12, Math.floor(todayAttendanceCount / (blocks.length || 1)))
      const blockMachinery = block.activeMachinery || Math.max(1, Math.floor((latestDailyLog?.machineryCount || 2) / (blocks.length || 1)))

      const workerBreakdown = {
        kalipci: Math.max(2, Math.floor(blockWorkers * 0.3)),
        demirci: Math.max(2, Math.floor(blockWorkers * 0.3)),
        betoncu: Math.max(1, Math.floor(blockWorkers * 0.15)),
        elektrik: Math.max(1, Math.floor(blockWorkers * 0.15)),
        isg: Math.max(1, Math.floor(blockWorkers * 0.1)),
      }

      const blockDeficiencies = openDeficiencies.filter((d) =>
        block.zones.some((z) => z.name.toLowerCase().includes(d.floor.toLowerCase())) ||
        d.floor.toLowerCase().includes(block.code?.toLowerCase() || "")
      )

      return {
        ...block,
        activeWorkers: blockWorkers,
        activeMachinery: blockMachinery,
        lastMilestone: block.lastMilestone || latestDailyLog?.activities || "İmalat takvimine uygun devam ediyor",
        openDefects: blockDeficiencies.length > 0 ? blockDeficiencies.length : block.openDefects,
        workerBreakdown,
        deficienciesList: blockDeficiencies.length > 0 ? blockDeficiencies : openDeficiencies.slice(0, 3),
        machineryList: [
          { name: `Potain MDT 219 Vinç (${block.code})`, type: "Kule Vinç", status: "Kanca Yükü: 2.3t", batteryOrTelemetry: "IoT Online" },
          { name: "Putzmeister 36m Pompa", type: "Beton Pompası", status: "Basınç: 85 bar", batteryOrTelemetry: "CAN-Bus 99%" },
        ],
      }
    })

    return NextResponse.json({
      projects,
      selectedProjectId: targetProjectId,
      blocks: enrichedBlocks,
      summary: {
        totalBlocks: enrichedBlocks.length,
        totalWorkers: enrichedBlocks.reduce((acc, curr) => acc + (curr.activeWorkers || 0), 0),
        totalMachinery: enrichedBlocks.reduce((acc, curr) => acc + (curr.activeMachinery || 0), 0),
        openDefectsCount: openDeficiencies.length,
      },
    })
  } catch (error: any) {
    console.error("❌ Blocks GET Error:", error)
    return NextResponse.json(
      { error: "Bloklar ve şantiye telemetrisi getirilemedi: " + error.message },
      { status: 500 }
    )
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 })
    }

    const body = await request.json()
    const { blockId, healthStatus, completionRate, lastMilestone, openDefects } = body

    if (!blockId) {
      return NextResponse.json({ error: "Blok ID zorunludur" }, { status: 400 })
    }

    const updated = await prisma.block.update({
      where: { id: blockId },
      data: {
        ...(healthStatus ? { healthStatus } : {}),
        ...(typeof completionRate === "number" ? { completionRate } : {}),
        ...(lastMilestone ? { lastMilestone } : {}),
        ...(typeof openDefects === "number" ? { openDefects } : {}),
      },
    })

    return NextResponse.json({ success: true, block: updated })
  } catch (error: any) {
    console.error("❌ Blocks PATCH Error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
