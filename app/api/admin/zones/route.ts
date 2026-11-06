/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Nexa ERP - Kat ve Mahal (Zones / Floors) API
 * Sahadan ilerleme girişinde kat/mahal seçimi için Zone veritabanı sorgusu
 */

import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  try {
    const session = await auth()
    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get("projectId")

    const where: any = {}
    if (projectId) {
      where.block = { projectId }
    }

    let zones = await prisma.zone.findMany({
      where,
      include: {
        block: {
          select: {
            id: true,
            name: true,
            code: true,
            projectId: true,
          },
        },
      },
      orderBy: [
        { block: { name: "asc" } },
        { floorNumber: "desc" },
      ],
    })

    // Projeye ait henüz hiç Zone yoksa otomatik tohumla (Auto-seed)
    if (zones.length === 0) {
      // Önce bir blok bul veya oluştur
      let targetBlock = await prisma.block.findFirst({
        where: projectId ? { projectId } : {},
      })

      if (!targetBlock && projectId) {
        targetBlock = await prisma.block.create({
          data: {
            projectId,
            name: "A Blok - Ana Kule",
            code: "BLK-A",
            totalFloors: 14,
            basementFloors: 2,
            healthStatus: "GREEN",
            completionRate: 65,
          },
        })
      }

      if (targetBlock) {
        const seedData = [
          { name: "14. Kat - Çatı Terası & Mekanik", floorNumber: 14, areaType: "SLAB", progressRate: 10 },
          { name: "13. Kat - Rezidans Daireleri", floorNumber: 13, areaType: "FLOOR", progressRate: 45 },
          { name: "12. Kat - Rezidans Daireleri", floorNumber: 12, areaType: "FLOOR", progressRate: 100 },
          { name: "10. Kat - Rezidans Daireleri", floorNumber: 10, areaType: "FLOOR", progressRate: 100 },
          { name: "6. Kat - Tip Kat Daireler", floorNumber: 6, areaType: "FLOOR", progressRate: 85 },
          { name: "3. Kat - Kolon ve Döşeme", floorNumber: 3, areaType: "FLOOR", progressRate: 70 },
          { name: "Zemin Kat - Giriş Lobby & Ticari", floorNumber: 0, areaType: "COMMON_AREA", progressRate: 100 },
          { name: "Bodrum -1 - Kapalı Otopark & Sığınak", floorNumber: -1, areaType: "COMMON_AREA", progressRate: 100 },
          { name: "Bodrum -2 - Temel & Su Deposu", floorNumber: -2, areaType: "COMMON_AREA", progressRate: 100 },
        ]

        for (const s of seedData) {
          await prisma.zone.create({
            data: {
              blockId: targetBlock.id,
              name: s.name,
              floorNumber: s.floorNumber,
              areaType: s.areaType,
              status: s.progressRate === 100 ? "COMPLETED" : s.progressRate > 0 ? "IN_PROGRESS" : "NOT_STARTED",
              progressRate: s.progressRate,
            },
          })
        }

        zones = await prisma.zone.findMany({
          where,
          include: {
            block: {
              select: {
                id: true,
                name: true,
                code: true,
                projectId: true,
              },
            },
          },
          orderBy: [
            { block: { name: "asc" } },
            { floorNumber: "desc" },
          ],
        })
      }
    }

    const formatted = zones.map((z) => ({
      id: z.id,
      name: z.name,
      code: z.code || `KAT-${z.floorNumber ?? 0}`,
      floorNumber: z.floorNumber,
      areaType: z.areaType,
      status: z.status,
      progressRate: z.progressRate ?? 0,
      blockId: z.blockId,
      blockName: z.block?.name || "Ana Blok",
      blockCode: z.block?.code || "BLK",
    }))

    return NextResponse.json({
      success: true,
      zones: formatted,
    })
  } catch (error: any) {
    console.error("GET /api/admin/zones error:", error)
    return NextResponse.json(
      { error: error?.message || "Kat/Mahal listesi alınamadı" },
      { status: 500 }
    )
  }
}

