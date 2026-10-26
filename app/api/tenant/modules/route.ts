/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Active Tenant Modules & Quota Endpoint
 */

import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userRole = session.user.role
    if (userRole === "SUPER_ADMIN") {
      return NextResponse.json({
        enabledModules: [
          "DASHBOARD", "PROJECTS", "FINANCE", "DOCUMENTS",
          "BIM", "AI_VISION", "BOQ_METRAJ", "INSPECTION",
          "PERSONNEL", "DRONE", "QA_QC", "ISG"
        ],
        maxStorageMB: 512000,
        usedStorageMB: 0
      })
    }

    const tenantId = (session.user as any)?.tenantId
    if (!tenantId) {
      return NextResponse.json({
        enabledModules: ["DASHBOARD", "PROJECTS", "FINANCE", "DOCUMENTS", "INSPECTION"],
        maxStorageMB: 51200,
        usedStorageMB: 0
      })
    }

    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: {
        id: true,
        name: true,
        enabledModules: true,
        maxStorageMB: true,
        usedStorageMB: true
      }
    })

    return NextResponse.json({
      enabledModules: tenant?.enabledModules || ["DASHBOARD", "PROJECTS", "FINANCE", "DOCUMENTS"],
      maxStorageMB: tenant?.maxStorageMB || 51200,
      usedStorageMB: tenant?.usedStorageMB || 0
    })
  } catch (err) {
    console.error("Error fetching tenant modules:", err)
    return NextResponse.json({ error: "Failed to fetch tenant modules" }, { status: 500 })
  }
}
