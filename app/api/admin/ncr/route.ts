/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * This code is the property of NXA Software.
 */

import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const isSuperAdmin = session.user.role === "SUPER_ADMIN"
    const tenantId = (session.user as any)?.tenantId

    const where: any = {}
    if (!isSuperAdmin) {
      where.tenantId = tenantId || "non-existent"
    }

    const reports = await (prisma as any).nonConformanceReport.findMany({
      where,
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json(reports)
  } catch (error) {
    console.error("Failed to fetch NCR reports:", error)
    return NextResponse.json(
      { error: "Failed to fetch NCR reports" },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const tenantId = (session.user as any)?.tenantId
    const body = await request.json()
    const { location, issueType, description, photoUrl, subcontractor, dueDate, notes } = body

    const report = await (prisma as any).nonConformanceReport.create({
      data: {
        location,
        issueType,
        description,
        photoUrl,
        subcontractor,
        dueDate: dueDate ? new Date(dueDate) : null,
        notes,
        status: "Açık" as any,
        tenantId: tenantId || null
      }
    })

    return NextResponse.json(report)
  } catch (error) {
    console.error("Failed to create NCR report:", error)
    return NextResponse.json(
      { error: "Failed to create NCR report" },
      { status: 500 }
    )
  }
}
