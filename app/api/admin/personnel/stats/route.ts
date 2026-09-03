/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * This code is the property of NXA Software.
 */

import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    // Get all personnel with INSPECTOR role (excluding ADMIN and MUTEAHHIT)
    const inspectors = await prisma.personel.findMany({
      where: {
        role: 'INSPECTOR'
      },
      select: {
        id: true,
        name: true,
        personnelNo: true
      }
    })

    // Calculate stats for each inspector
    const stats = await Promise.all(
      inspectors.map(async (inspector) => {
        const inspectionCount = await prisma.inspection.count({
          where: { inspectorId: inspector.id }
        })

        const deficiencyCount = await prisma.deficiency.count({
          where: { inspectorId: inspector.id }
        })

        return {
          id: inspector.id,
          name: inspector.name,
          personnelNo: inspector.personnelNo,
          inspectionCount,
          deficiencyCount,
          averageDuration: 30 // Default value - can be calculated from actual data if available
        }
      })
    )

    return NextResponse.json(stats)
  } catch (error) {
    console.error("Error fetching personnel stats:", error)
    return NextResponse.json({ error: "Failed to fetch personnel stats" }, { status: 500 })
  }
}