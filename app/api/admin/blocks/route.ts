/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Multi-Block & Zone Master Dashboard API
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
    const projectId = searchParams.get("projectId")
    const isSuperAdmin = session.user.role === "SUPER_ADMIN"
    const tenantId = (session.user as any)?.tenantId

    const where: any = {}
    if (!isSuperAdmin && tenantId) {
      where.tenantId = tenantId
    }
    if (projectId) {
      where.projectId = projectId
    }

    let blocks = await prisma.block.findMany({
      where,
      include: {
        project: {
          select: { id: true, name: true, city: true },
        },
        zones: {
          orderBy: { floorNumber: "desc" },
        },
      },
      orderBy: { name: "asc" },
    })

    // Projeler listesi de döndürülür
    const projects = await prisma.project.findMany({
      where: !isSuperAdmin && tenantId ? { tenantId } : {},
      select: { id: true, name: true, status: true, progress: true },
      orderBy: { name: "asc" },
    })

    return NextResponse.json({
      blocks,
      projects,
    })
  } catch (error: any) {
    console.error("❌ Blocks GET Error:", error)
    return NextResponse.json(
      { error: "Bloklar getirilirken bir hata oluştu: " + error.message },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 })
    }

    const body = await request.json()
    const {
      projectId,
      name,
      code,
      totalFloors = 10,
      basementFloors = 2,
      healthStatus = "GREEN",
      completionRate = 0,
      activeWorkers = 0,
      activeMachinery = 0,
      lastMilestone = "",
      openDefects = 0,
      isgRiskScore = 10,
    } = body

    if (!projectId || !name) {
      return NextResponse.json(
        { error: "Proje ve Blok Adı zorunludur" },
        { status: 400 }
      )
    }

    const tenantId = (session.user as any)?.tenantId

    const block = await prisma.block.create({
      data: {
        projectId,
        tenantId,
        name,
        code,
        totalFloors: Number(totalFloors),
        basementFloors: Number(basementFloors),
        healthStatus,
        completionRate: Number(completionRate),
        activeWorkers: Number(activeWorkers),
        activeMachinery: Number(activeMachinery),
        lastMilestone,
        openDefects: Number(openDefects),
        isgRiskScore: Number(isgRiskScore),
      },
    })

    return NextResponse.json({ success: true, block }, { status: 201 })
  } catch (error: any) {
    console.error("❌ Blocks POST Error:", error)
    return NextResponse.json(
      { error: "Blok oluşturulamadı: " + error.message },
      { status: 500 }
    )
  }
}

