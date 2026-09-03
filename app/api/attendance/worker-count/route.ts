/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * This code is the property of NXA Software.
 */

import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get('projectId')
    const date = searchParams.get('date')

    if (!projectId || !date) {
      return NextResponse.json(
        { error: "projectId ve date gerekli" },
        { status: 400 }
      )
    }

    // Count unique personnel who checked in on this date for this project
    const startDate = new Date(date)
    startDate.setHours(0, 0, 0, 0)
    
    const endDate = new Date(date)
    endDate.setHours(23, 59, 59, 999)

    const attendanceRecords = await prisma.attendanceRecord.findMany({
      where: {
        projectId,
        checkIn: {
          gte: startDate,
          lte: endDate
        }
      },
      select: {
        personelId: true
      }
    })

    // Count unique personnel
    const uniqueWorkers = new Set(attendanceRecords.map(r => r.personelId))
    const count = uniqueWorkers.size

    return NextResponse.json({ count })
  } catch (error) {
    console.error("Worker count fetch error:", error)
    return NextResponse.json(
      { error: "Çalışan sayısı getirilirken hata oluştu" },
      { status: 500 }
    )
  }
}
