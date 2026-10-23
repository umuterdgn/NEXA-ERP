/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Delivery Appointments & Logistics API (Şantiye Kapı Randevu & Trafik Kontrolü)
 */

import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const dateFilter = searchParams.get("date") // "today", "tomorrow", "week", "all", or YYYY-MM-DD
    const status = searchParams.get("status")

    const where: any = {}
    if (status && status !== "ALL") {
      where.status = status
    }

    if (dateFilter && dateFilter !== "all") {
      const now = new Date()
      const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0)
      const endOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59)

      if (dateFilter === "today") {
        where.scheduledDate = {
          gte: startOfDay(now),
          lte: endOfDay(now),
        }
      } else if (dateFilter === "tomorrow") {
        const tomorrow = new Date(now.getTime() + 86400000)
        where.scheduledDate = {
          gte: startOfDay(tomorrow),
          lte: endOfDay(tomorrow),
        }
      } else if (dateFilter === "week") {
        const endOfWeek = new Date(now.getTime() + 7 * 86400000)
        where.scheduledDate = {
          gte: startOfDay(now),
          lte: endOfDay(endOfWeek),
        }
      } else {
        // Specific date YYYY-MM-DD
        const specific = new Date(dateFilter)
        if (!isNaN(specific.getTime())) {
          where.scheduledDate = {
            gte: startOfDay(specific),
            lte: endOfDay(specific),
          }
        }
      }
    }

    const appointments = await prisma.deliveryAppointment.findMany({
      where,
      include: {
        purchaseRequest: {
          include: {
            project: {
              select: {
                id: true,
                title: true,
                name: true,
                location: true,
              },
            },
          },
        },
      },
      orderBy: {
        scheduledDate: "asc",
      },
    })

    // Enrich with supplier info if supplierId matches a company
    const supplierIds = Array.from(new Set(appointments.map((a) => a.supplierId)))
    const companies = await prisma.company.findMany({
      where: { id: { in: supplierIds } },
      select: { id: true, name: true, phone: true },
    })
    const companyMap = new Map(companies.map((c) => [c.id, c]))

    const enriched = appointments.map((app) => ({
      ...app,
      supplier: companyMap.get(app.supplierId) || { name: "Bilinmeyen Tedarikçi", id: app.supplierId },
    }))

    return NextResponse.json(enriched)
  } catch (error: any) {
    console.error("Logistics GET Error:", error)
    return NextResponse.json({ error: error.message || "Failed to fetch appointments" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { purchaseRequestId, supplierId, vehiclePlate, driverName, scheduledDate, status } = body

    if (!purchaseRequestId || !supplierId || !vehiclePlate || !scheduledDate) {
      return NextResponse.json({ error: "Eksik bilgi gönderildi" }, { status: 400 })
    }

    const newAppointment = await prisma.deliveryAppointment.create({
      data: {
        purchaseRequestId,
        supplierId,
        vehiclePlate: vehiclePlate.toUpperCase().trim(),
        driverName: driverName || null,
        scheduledDate: new Date(scheduledDate),
        status: status || "SCHEDULED",
      },
      include: {
        purchaseRequest: true,
      },
    })

    return NextResponse.json(newAppointment, { status: 201 })
  } catch (error: any) {
    console.error("Logistics POST Error:", error)
    return NextResponse.json({ error: error.message || "Failed to create appointment" }, { status: 500 })
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json()
    const { id, status, scheduledDate } = body

    if (!id) {
      return NextResponse.json({ error: "ID gerekli" }, { status: 400 })
    }

    const updateData: any = {}
    if (status) updateData.status = status
    if (scheduledDate) updateData.scheduledDate = new Date(scheduledDate)

    const updated = await prisma.deliveryAppointment.update({
      where: { id },
      data: updateData,
      include: {
        purchaseRequest: true,
      },
    })

    return NextResponse.json(updated)
  } catch (error: any) {
    console.error("Logistics PATCH Error:", error)
    return NextResponse.json({ error: error.message || "Failed to update appointment" }, { status: 500 })
  }
}
