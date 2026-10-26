/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * This code is the property of NXA Software.
 */

import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    const userRole = session?.user?.role as string
    const isSuperAdmin = userRole === "SUPER_ADMIN"
    const tenantId = (session?.user as any)?.tenantId as string | undefined

    if (!session?.user || (!tenantId && !isSuperAdmin)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { imageUrl, description, type, personelId, projectId } = body

    if (!imageUrl || !description || !type || !personelId) {
      return NextResponse.json(
        { error: "Eksik alanlar var" },
        { status: 400 }
      )
    }

    // Create ISG report
    const isgReport = await prisma.isgReport.create({
      data: {
        imageUrl,
        description,
        type,
        personelId,
        projectId: projectId || null,
        status: "ACIL",
        tenantId: tenantId || null,
      }
    })

    return NextResponse.json(isgReport, { status: 201 })
  } catch (error) {
    console.error("ISG report creation error:", error)
    return NextResponse.json(
      { error: "Bildirim oluşturulurken hata oluştu" },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    const userRole = session?.user?.role as string
    const isSuperAdmin = userRole === "SUPER_ADMIN"
    const tenantId = (session?.user as any)?.tenantId as string | undefined

    if (!session?.user || (!tenantId && !isSuperAdmin)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const tenantFilter: any = !isSuperAdmin ? (tenantId ? { tenantId } : { tenantId: "non-existent" }) : {}

    const isgReports = await prisma.isgReport.findMany({
      where: tenantFilter,
      include: {
        personel: {
          select: {
            name: true,
            personnelNo: true
          }
        },
        project: {
          select: {
            name: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json(isgReports)
  } catch (error) {
    console.error("ISG reports fetch error:", error)
    return NextResponse.json(
      { error: "Bildirimler getirilirken hata oluştu" },
      { status: 500 }
    )
  }
}
