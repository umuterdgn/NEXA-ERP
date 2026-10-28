/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Delivery Appointments & Gate Security Logistics API (Şantiye Kapı Randevu & Trafik Kontrolü)
 */

import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

export async function GET(req: Request) {
  try {
    const session = await auth()
    const { searchParams } = new URL(req.url)
    const dateFilter = searchParams.get("date") // "today", "tomorrow", "week", "all", or YYYY-MM-DD
    const status = searchParams.get("status")
    const driverUserId = searchParams.get("driverUserId")

    const where: any = {}

    // Tenant Filter if available
    const tenantId = (session?.user as any)?.tenantId
    if (tenantId && session?.user?.role !== "SUPER_ADMIN") {
      where.OR = [
        { tenantId: tenantId },
        { tenantId: null },
      ]
    }

    if (driverUserId) {
      where.driverUserId = driverUserId
    }

    if (status && status !== "ALL") {
      // Map statuses if necessary
      if (status === "BEKLİYOR" || status === "SCHEDULED") {
        where.status = { in: ["BEKLİYOR", "SCHEDULED"] }
      } else if (status === "KAPIDA" || status === "ARRIVED") {
        where.status = { in: ["KAPIDA", "ARRIVED"] }
      } else if (status === "BOŞALTILDI" || status === "UNLOADED") {
        where.status = { in: ["BOŞALTILDI", "UNLOADED"] }
      } else if (status === "İPTAL" || status === "REJECTED") {
        where.status = { in: ["İPTAL", "REJECTED"] }
      } else {
        where.status = status
      }
    }

    if (dateFilter && dateFilter !== "all") {
      const now = new Date()
      const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0)
      const endOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59)

      if (dateFilter === "today") {
        where.appointmentDate = {
          gte: startOfDay(now),
          lte: endOfDay(now),
        }
      } else if (dateFilter === "tomorrow") {
        const tomorrow = new Date(now.getTime() + 86400000)
        where.appointmentDate = {
          gte: startOfDay(tomorrow),
          lte: endOfDay(tomorrow),
        }
      } else if (dateFilter === "week") {
        const endOfWeek = new Date(now.getTime() + 7 * 86400000)
        where.appointmentDate = {
          gte: startOfDay(now),
          lte: endOfDay(endOfWeek),
        }
      } else {
        // Specific date YYYY-MM-DD
        const specific = new Date(dateFilter)
        if (!isNaN(specific.getTime())) {
          where.appointmentDate = {
            gte: startOfDay(specific),
            lte: endOfDay(specific),
          }
        }
      }
    }

    const appointments = await prisma.logisticsAppointment.findMany({
      where,
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
      orderBy: {
        appointmentDate: "asc",
      },
    })

    // Enrich with supplier info if supplierId matches a company
    const supplierIds = Array.from(new Set(appointments.map((a) => a.supplierId).filter(Boolean))) as string[]
    const companies = supplierIds.length > 0
      ? await prisma.company.findMany({
          where: { id: { in: supplierIds } },
          select: { id: true, name: true, phone: true },
        })
      : []
    const companyMap = new Map(companies.map((c) => [c.id, c]))

    // Also enrich with purchase requests if materialId matches
    const materialIds = Array.from(new Set(appointments.map((a) => a.materialId).filter(Boolean))) as string[]
    const purchaseRequests = materialIds.length > 0
      ? await prisma.purchaseRequest.findMany({
          where: { id: { in: materialIds } },
          select: { id: true, materialName: true, quantity: true, unit: true, projectId: true },
        })
      : []
    const prMap = new Map(purchaseRequests.map((pr) => [pr.id, pr]))

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://nxerp.com.tr"

    const enriched = appointments.map((app) => {
      const company = app.supplierId ? companyMap.get(app.supplierId) : null
      const pr = app.materialId ? prMap.get(app.materialId) : null
      const trackingUrl = app.trackingToken ? `${baseUrl}/track/${app.trackingToken}` : `${baseUrl}/track/${app.id}`

      return {
        ...app,
        vehiclePlate: app.plateNumber || "",
        scheduledDate: app.appointmentDate.toISOString(),
        supplier: company || (app.supplier ? { name: app.supplier, id: app.supplierId || "" } : { name: "Bilinmeyen Tedarikçi", id: app.supplierId || "" }),
        purchaseRequestId: app.materialId,
        purchaseRequest: pr ? {
          id: pr.id,
          materialName: pr.materialName,
          quantity: pr.quantity,
          unit: pr.unit,
          project: app.project,
        } : (app.title ? {
          id: app.id,
          materialName: app.title,
          quantity: 1,
          unit: "Sevkiyat",
          project: app.project,
        } : null),
        trackingUrl,
      }
    })

    return NextResponse.json(enriched)
  } catch (error: any) {
    console.error("Logistics GET Error:", error)
    return NextResponse.json({ error: error.message || "Failed to fetch appointments" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth()
    const body = await req.json()
    const {
      purchaseRequestId,
      materialId,
      supplierId,
      supplier,
      vehiclePlate,
      plateNumber,
      driverName,
      driverPhone,
      isInternalDriver,
      driverUserId,
      scheduledDate,
      appointmentDate,
      projectId,
      notes,
      title,
      status,
    } = body

    const targetPlate = (plateNumber || vehiclePlate || "").toUpperCase().trim()
    const targetDate = appointmentDate || scheduledDate
    const targetMaterialId = materialId || purchaseRequestId
    const targetPhone = driverPhone ? String(driverPhone).trim() : ""

    if (!targetPlate || !targetDate) {
      return NextResponse.json({ error: "Araç plakası ve randevu tarihi zorunludur." }, { status: 400 })
    }

    if (!targetPhone) {
      return NextResponse.json({ error: "Sürücü telefon numarası (driverPhone) zorunludur." }, { status: 400 })
    }

    // Determine projectId from purchaseRequest if not provided
    let finalProjectId = projectId || null
    if (!finalProjectId && targetMaterialId) {
      const pr = await prisma.purchaseRequest.findUnique({
        where: { id: targetMaterialId },
        select: { projectId: true, materialName: true },
      })
      if (pr) {
        finalProjectId = pr.projectId
      }
    }

    // Generate unique tracking token for external driver / GPS
    const tokenRand = Math.random().toString(36).substring(2, 9)
    const tokenTime = Date.now().toString(36)
    const trackingToken = `trk_${tokenRand}_${tokenTime}`
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://nxerp.com.tr"
    const trackingUrl = `${baseUrl}/track/${trackingToken}`

    const tenantId = (session?.user as any)?.tenantId || null

    const newAppointment = await prisma.logisticsAppointment.create({
      data: {
        tenantId,
        materialId: targetMaterialId || null,
        supplierId: supplierId || null,
        supplier: supplier || null,
        title: title || null,
        plateNumber: targetPlate,
        driverName: driverName ? String(driverName).trim() : null,
        driverPhone: targetPhone,
        isInternalDriver: Boolean(isInternalDriver),
        driverUserId: isInternalDriver && driverUserId ? driverUserId : null,
        appointmentDate: new Date(targetDate),
        status: status || "BEKLİYOR",
        notes: notes || null,
        trackingToken,
        projectId: finalProjectId,
      },
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
    })

    return NextResponse.json({
      ...newAppointment,
      vehiclePlate: newAppointment.plateNumber,
      scheduledDate: newAppointment.appointmentDate.toISOString(),
      trackingUrl,
    }, { status: 201 })
  } catch (error: any) {
    console.error("Logistics POST Error:", error)
    return NextResponse.json({ error: error.message || "Failed to create appointment" }, { status: 500 })
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json()
    const { id, status, scheduledDate, appointmentDate, notes, driverPhone, plateNumber, vehiclePlate } = body

    if (!id) {
      return NextResponse.json({ error: "ID gerekli" }, { status: 400 })
    }

    const updateData: any = {}
    if (status) updateData.status = status
    if (appointmentDate) updateData.appointmentDate = new Date(appointmentDate)
    else if (scheduledDate) updateData.appointmentDate = new Date(scheduledDate)
    if (notes !== undefined) updateData.notes = notes
    if (driverPhone) updateData.driverPhone = driverPhone
    if (plateNumber || vehiclePlate) updateData.plateNumber = (plateNumber || vehiclePlate).toUpperCase().trim()

    const updated = await prisma.logisticsAppointment.update({
      where: { id },
      data: updateData,
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
    })

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://nxerp.com.tr"
    const trackingUrl = updated.trackingToken ? `${baseUrl}/track/${updated.trackingToken}` : `${baseUrl}/track/${updated.id}`

    return NextResponse.json({
      ...updated,
      vehiclePlate: updated.plateNumber,
      scheduledDate: updated.appointmentDate.toISOString(),
      trackingUrl,
    })
  } catch (error: any) {
    console.error("Logistics PATCH Error:", error)
    return NextResponse.json({ error: error.message || "Failed to update appointment" }, { status: 500 })
  }
}
