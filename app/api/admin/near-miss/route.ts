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
    const userRole = session?.user?.role as string
    const isSuperAdmin = userRole === "SUPER_ADMIN"
    const tenantId = (session?.user as any)?.tenantId as string | undefined

    if (!session?.user || (!tenantId && !isSuperAdmin)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const tenantFilter: any = !isSuperAdmin ? (tenantId ? { tenantId } : { tenantId: "non-existent" }) : {}

    const reports = await prisma.nearMissReport.findMany({
      where: tenantFilter,
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json(reports)
  } catch (error) {
    console.error("Failed to fetch near-miss reports:", error)
    return NextResponse.json(
      { error: "Failed to fetch near-miss reports" },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth()
    const userRole = session?.user?.role as string
    const isSuperAdmin = userRole === "SUPER_ADMIN"
    const tenantId = (session?.user as any)?.tenantId as string | undefined

    if (!session?.user || (!tenantId && !isSuperAdmin)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { isAnonymous, location, category, severity, description, projectId } = body

    const report = await prisma.nearMissReport.create({
      data: {
        isAnonymous: isAnonymous ?? true,
        location,
        category,
        severity,
        description,
        status: "Beklemede",
        projectId: projectId || null,
        tenantId: tenantId || null,
      }
    })

    return NextResponse.json(report)
  } catch (error) {
    console.error("Failed to create near-miss report:", error)
    return NextResponse.json(
      { error: "Failed to create near-miss report" },
      { status: 500 }
    )
  }
}
