/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * BLE Equipment Tracking API with strict tenant isolation (100% Real Database, Zero Mock Data)
 */

import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 })
    }

    const isSuperAdmin = session.user.role === "SUPER_ADMIN"
    const tenantId = (session.user as any)?.tenantId

    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get("projectId")

    const whereClause: any = {}
    if (!isSuperAdmin) {
      whereClause.tenantId = tenantId || "non-existent"
    }

    if (projectId && projectId !== "all") {
      whereClause.projectId = projectId
    }

    const equipments = await prisma.equipment.findMany({
      where: whereClause,
      include: {
        project: {
          select: {
            id: true,
            title: true,
            name: true,
            latitude: true,
            longitude: true,
          },
        },
        assignedTo: {
          select: {
            id: true,
            name: true,
            department: true,
            phone: true,
          },
        },
      },
      orderBy: { updatedAt: "desc" },
    })

    // Normalizing status representation
    const formatted = equipments.map((eq) => {
      const rawStatus = (eq.status || "").toUpperCase()
      const isLost = rawStatus === "KAYIP" || rawStatus === "LOST" || rawStatus === "MAINTENANCE"
      const statusDisplay = isLost ? "KAYIP" : "AKTIF"

      return {
        id: eq.id,
        name: eq.name,
        type: eq.type,
        category: eq.category || "Genel Ekipman",
        status: statusDisplay,
        rawStatus: eq.status,
        serialNumber: eq.serialNumber,
        bleTagId: eq.bleTagId || eq.serialNumber || "BLE-N/A",
        latitude: eq.latitude ?? eq.lastLat,
        longitude: eq.longitude ?? eq.lastLng,
        lastSeenAt: eq.lastSeenAt ? eq.lastSeenAt.toISOString() : eq.updatedAt.toISOString(),
        projectId: eq.projectId,
        project: eq.project
          ? {
              id: eq.project.id,
              title: eq.project.title || eq.project.name || "Şantiye",
              name: eq.project.name || eq.project.title || "Şantiye",
              latitude: eq.project.latitude,
              longitude: eq.project.longitude,
            }
          : null,
        assignedTo: eq.assignedTo,
      }
    })

    const validWithCoords = formatted.filter((e) => e.latitude != null && e.longitude != null)

    return NextResponse.json({
      equipments: validWithCoords,
      stats: {
        total: validWithCoords.length,
        active: validWithCoords.filter((e) => e.status === "AKTIF").length,
        lost: validWithCoords.filter((e) => e.status === "KAYIP").length,
      },
    })
  } catch (error) {
    console.error("Error in tracking API:", error)
    return NextResponse.json(
      { error: "Ekipman konum verileri alınamadı" },
      { status: 500 }
    )
  }
}
