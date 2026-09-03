/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * This code is the property of NXA Software.
 */

import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { projectId, subcontractorId, periodMonth, periodYear } = body

    // Get DailyProgress records for the specified period
    const startDate = new Date(periodYear, periodMonth - 1, 1)
    const endDate = new Date(periodYear, periodMonth, 0)

    const dailyProgress = await prisma.dailyProgress.findMany({
      where: {
        projectId,
        subcontractorId,
        createdAt: {
          gte: startDate,
          lte: endDate
        }
      }
    })

    // Calculate average completion percentage
    const avgCompletion = dailyProgress.length > 0
      ? dailyProgress.reduce((sum, dp) => sum + dp.completionPercentage, 0) / dailyProgress.length
      : 0

    // Estimate total amount based on project value and completion
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { contractValue: true }
    })

    const estimatedAmount = project?.contractValue
      ? (project.contractValue * avgCompletion) / 100
      : 0

    return NextResponse.json({
      dailyProgressCount: dailyProgress.length,
      avgCompletion: Math.round(avgCompletion * 100) / 100,
      estimatedAmount: Math.round(estimatedAmount * 100) / 100,
      dailyProgressRecords: dailyProgress
    })
  } catch (error) {
    console.error("Failed to calculate progress billing:", error)
    return NextResponse.json({ error: "Failed to calculate billing" }, { status: 500 })
  }
}
