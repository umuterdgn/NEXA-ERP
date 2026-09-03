/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * This code is the property of NXA Software.
 */

import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get('projectId')

    if (!projectId) {
      return NextResponse.json(
        { error: "Project ID required" },
        { status: 400 }
      )
    }

    const dailyLogs = await prisma.dailyLog.findMany({
      where: { projectId },
      orderBy: { date: 'desc' }
    })

    return NextResponse.json(dailyLogs)
  } catch (error) {
    console.error("Error fetching daily logs:", error)
    return NextResponse.json(
      { error: "Günlük raporları getirilirken hata oluştu" },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { date, weather, machineryCount, workDone, photoUrls, projectId } = body

    if (!workDone || !projectId) {
      return NextResponse.json(
        { error: "Work done and projectId are required" },
        { status: 400 }
      )
    }

    const dailyLog = await prisma.dailyLog.create({
      data: {
        date: date ? new Date(date) : new Date(),
        weather: weather || null,
        machineryCount: machineryCount || 0,
        workDone,
        photoUrls: photoUrls || [],
        projectId
      }
    })

    return NextResponse.json(dailyLog, { status: 201 })
  } catch (error) {
    console.error("Error creating daily log:", error)
    return NextResponse.json(
      { error: "Günlük raporu oluşturulurken hata oluştu" },
      { status: 500 }
    )
  }
}
