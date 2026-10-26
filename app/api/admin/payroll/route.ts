/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Payroll & Puantaj Data API with strict tenant isolation
 */

import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 })
    }

    const isSuperAdmin = session.user.role === "SUPER_ADMIN"
    const tenantId = (session.user as any)?.tenantId

    const tenantWhere: any = {}
    if (!isSuperAdmin) {
      tenantWhere.tenantId = tenantId || "non-existent"
    }

    const { searchParams } = new URL(request.url)
    const month = searchParams.get("month") || new Date().toISOString().slice(0, 7) // "YYYY-MM"
    const projectId = searchParams.get("projectId")

    // 1. Projeler
    const projects = await prisma.project.findMany({
      where: tenantWhere,
      select: {
        id: true,
        name: true,
      },
      orderBy: { name: "asc" },
    })

    // 2. Personel
    const personelWhere: any = { ...tenantWhere }
    if (projectId) {
      personelWhere.AttendanceRecord = {
        some: {
          projectId,
        },
      }
    }

    const personelList = await prisma.personel.findMany({
      where: personelWhere,
      select: {
        id: true,
        name: true,
        position: true,
        department: true,
        gunlukYevmiye: true,
        salary: true,
        status: true,
      },
      orderBy: { name: "asc" },
    })

    // 3. İlgili ayın puantaj (attendance) kayıtları
    const [yearStr, monthStr] = month.split("-")
    const startDate = new Date(parseInt(yearStr), parseInt(monthStr) - 1, 1)
    const endDate = new Date(parseInt(yearStr), parseInt(monthStr), 0, 23, 59, 59)

    const attendanceRecords = await prisma.attendanceRecord.findMany({
      where: {
        ...tenantWhere,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        personelId: true,
        date: true,
        status: true,
      },
    })

    // Personel başına attendance map oluştur
    const attendanceMap: Record<string, Record<number, string>> = {}
    for (const rec of attendanceRecords) {
      if (!rec.personelId) continue
      if (!attendanceMap[rec.personelId]) {
        attendanceMap[rec.personelId] = {}
      }
      const dayOfMonth = new Date(rec.date).getDate()
      const code = rec.status === "PRESENT" ? "X" : rec.status === "LATE" ? "İ" : rec.status === "ABSENT" ? "R" : ""
      attendanceMap[rec.personelId][dayOfMonth] = code
    }

    const formattedPersonnel = personelList.map((p) => {
      const dailyRate = p.gunlukYevmiye > 0 ? p.gunlukYevmiye : Math.round(p.salary / 30) || 1500
      return {
        id: p.id,
        name: p.name,
        role: p.position || p.department || "Saha Personeli",
        dailyRate,
        advancePayment: 0,
        attendance: attendanceMap[p.id] || {},
      }
    })

    return NextResponse.json({
      projects,
      personnel: formattedPersonnel,
    })
  } catch (error: any) {
    console.error("❌ Payroll GET Error:", error)
    return NextResponse.json({ error: error.message || "Bordro verileri alınamadı" }, { status: 500 })
  }
}
