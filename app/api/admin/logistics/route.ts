/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * This code is the property of NXA Software.
 */

import { NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export async function GET() {
  try {
    const schedules = await prisma.logisticsSchedule.findMany({
      orderBy: {
        scheduledAt: 'asc'
      }
    })

    return NextResponse.json(schedules)
  } catch (error) {
    console.error("Failed to fetch logistics schedules:", error)
    return NextResponse.json(
      { error: "Failed to fetch logistics schedules" },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { title, type, location, supplierName, driverContact, scheduledAt, notes, status } = body

    const schedule = await prisma.logisticsSchedule.create({
      data: {
        title,
        type,
        location,
        supplierName,
        driverContact,
        scheduledAt: new Date(scheduledAt),
        notes,
        status: status || "Planlandı"
      }
    })

    return NextResponse.json(schedule)
  } catch (error) {
    console.error("Failed to create logistics schedule:", error)
    return NextResponse.json(
      { error: "Failed to create logistics schedule" },
      { status: 500 }
    )
  }
}
