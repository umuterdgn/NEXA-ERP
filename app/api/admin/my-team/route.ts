/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * This code is the property of NXA Software.
 */

import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    const userRole = session?.user?.role
    const isSuperAdmin = userRole === "SUPER_ADMIN"
    const tenantId = (session?.user as any)?.tenantId as string | undefined

    if (!session?.user || (!tenantId && !isSuperAdmin)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const companyId = searchParams.get("companyId")

    const whereClause: any = !isSuperAdmin ? (tenantId ? { tenantId } : { tenantId: "non-existent" }) : {}
    if (companyId) {
      whereClause.companyId = companyId
    }

    const personnel = await prisma.personel.findMany({
      where: whereClause,
      orderBy: { createdAt: "desc" }
    })

    return NextResponse.json(personnel)
  } catch (error) {
    console.error("Failed to fetch personnel:", error)
    return NextResponse.json(
      { error: "Personel listesi yüklenirken hata oluştu" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    const userRole = session?.user?.role
    const isSuperAdmin = userRole === "SUPER_ADMIN"
    const tenantId = (session?.user as any)?.tenantId as string | undefined

    if (!session?.user || (!tenantId && !isSuperAdmin)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { companyId, ...personnelData } = body

    const personnel = await prisma.personel.create({
      data: {
        ...personnelData,
        companyId,
        tenantId: tenantId || null,
      }
    })

    return NextResponse.json(personnel, { status: 201 })
  } catch (error) {
    console.error("Failed to create personnel:", error)
    return NextResponse.json(
      { error: "Personel oluşturulurken hata oluştu" },
      { status: 500 }
    )
  }
}
