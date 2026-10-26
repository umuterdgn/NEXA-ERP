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
    const userRole = session?.user?.role
    const isSuperAdmin = userRole === "SUPER_ADMIN"
    const tenantId = (session?.user as any)?.tenantId as string | undefined

    if (!session?.user || (!tenantId && !isSuperAdmin)) {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 })
    }

    const whereClause: any = !isSuperAdmin ? (tenantId ? { tenantId } : { tenantId: "non-existent" }) : {}

    const records = await prisma.attendanceRecord.findMany({
      where: whereClause,
      include: {
        personel: true,
        project: true
      },
      orderBy: {
        date: 'desc'
      }
    })
    return NextResponse.json(records)
  } catch (error) {
    console.error("Error fetching attendance records:", error)
    return NextResponse.json(
      { error: "Yoklama kayıtları getirilirken hata oluştu" },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth()
    const userRole = session?.user?.role
    const isSuperAdmin = userRole === "SUPER_ADMIN"
    const tenantId = (session?.user as any)?.tenantId as string | undefined

    if (!session?.user || (!tenantId && !isSuperAdmin)) {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 })
    }

    const body = await request.json()
    const { personelId, projectId, date, checkIn, checkOut, dayMultiplier, overtimeHours } = body

    console.log("Attendance POST: Creating record with data:", { personelId, projectId, date, checkIn, checkOut, dayMultiplier, overtimeHours })

    let calculatedDayMultiplier = Number(dayMultiplier ?? 1)
    let calculatedOvertimeHours = Number(overtimeHours ?? 0)

    if (checkIn && checkOut) {
      const checkInDate = new Date(checkIn)
      const checkOutDate = new Date(checkOut)
      const hoursWorked = (checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60)

      if (!dayMultiplier && Number.isFinite(hoursWorked)) {
        calculatedDayMultiplier = hoursWorked >= 8 ? 1 : hoursWorked >= 4 ? 0.5 : 0
      }

      if (!overtimeHours && Number.isFinite(hoursWorked)) {
        calculatedOvertimeHours = Math.max(0, hoursWorked - 8)
      }
    }

    const record = await prisma.attendanceRecord.create({
      data: {
        personelId: personelId || null,
        projectId,
        date: new Date(date),
        checkIn: checkIn ? new Date(checkIn) : null,
        checkOut: checkOut ? new Date(checkOut) : null,
        dayMultiplier: calculatedDayMultiplier,
        overtimeHours: calculatedOvertimeHours,
        tenantId: tenantId || null,
      }
    })

    console.log("Attendance POST: Record created successfully:", record)

    return NextResponse.json(record)
  } catch (error) {
    console.error("Error creating attendance record:", error)
    return NextResponse.json(
      { error: "Yoklama kaydı oluşturulurken hata oluştu" },
      { status: 500 }
    )
  }
}