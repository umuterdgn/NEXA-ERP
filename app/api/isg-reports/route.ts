/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * This code is the property of NXA Software.
 */

import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

export async function POST(request: Request) {
  try {
    const session = await auth()
    const userRole = session?.user?.role as string
    const isSuperAdmin = userRole === "SUPER_ADMIN"
    const tenantId = (session?.user as any)?.tenantId as string | undefined

    if (!session?.user || (!tenantId && !isSuperAdmin)) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { imageUrl, description, personelId, projectId } = body

    if (!imageUrl || !description || !personelId) {
      return NextResponse.json(
        { success: false, error: "Eksik bilgiler" },
        { status: 400 }
      )
    }

    // Create İSG report in database
    const isgReport = await prisma.isgReport.create({
      data: {
        imageUrl,
        description,
        personelId,
        projectId: projectId || null,
        status: "ACIL",
        createdAt: new Date(),
        tenantId: tenantId || null,
      }
    })

    return NextResponse.json({
      success: true,
      data: isgReport
    })

  } catch (error) {
    console.error("İSG report error:", error)
    return NextResponse.json(
      { success: false, error: "Bildirim oluşturulurken hata oluştu" },
      { status: 500 }
    )
  }
}

export async function GET(request: Request) {
  try {
    const session = await auth()
    const userRole = session?.user?.role as string
    const isSuperAdmin = userRole === "SUPER_ADMIN"
    const tenantId = (session?.user as any)?.tenantId as string | undefined

    if (!session?.user || (!tenantId && !isSuperAdmin)) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const personelId = searchParams.get("personelId")

    const tenantFilter: any = !isSuperAdmin ? (tenantId ? { tenantId } : { tenantId: "non-existent" }) : {}
    const where: any = {
      ...tenantFilter,
      ...(personelId ? { personelId } : {})
    }

    const reports = await prisma.isgReport.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 20
    })

    return NextResponse.json({
      success: true,
      data: reports
    })

  } catch (error) {
    console.error("İSG reports fetch error:", error)
    return NextResponse.json(
      { success: false, error: "Bildirimler getirilirken hata oluştu" },
      { status: 500 }
    )
  }
}
