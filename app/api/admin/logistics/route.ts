/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Logistics Schedule API Route
 */

import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

export async function GET() {
  try {
    const session = await auth()
    const userRole = session?.user?.role as string
    const isSuperAdmin = userRole === "SUPER_ADMIN"
    const tenantId = (session?.user as any)?.tenantId as string | undefined

    if (!session?.user || (!tenantId && !isSuperAdmin)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const tenantFilter: any = !isSuperAdmin ? (tenantId ? { tenantId } : { tenantId: "non-existent" }) : {}

    const schedules = await prisma.logisticsSchedule.findMany({
      where: tenantFilter,
      include: {
        receivedBy: {
          select: { id: true, name: true, email: true }
        },
        project: {
          select: { id: true, name: true, title: true }
        }
      },
      orderBy: {
        scheduledAt: 'asc'
      }
    })

    // Canlı sevkiyat ve OSRM verileriyle randevuları zenginleştir
    const activeShipments = await prisma.shipmentTracking.findMany({
      where: {
        ...tenantFilter,
        status: { in: ["ON_THE_WAY", "PREPARING", "ARRIVED"] }
      },
      orderBy: { updatedAt: "desc" },
    });

    const enrichedSchedules = schedules.map((schedule) => {
      // Eşleşen canlı sevkiyatı bul (Proje ID'si veya başlık/iletişim)
      const matchingShipment = activeShipments.find(
        (s) => s.purchaseRequestId || s.driverPhone === schedule.driverContact
      ) || activeShipments[0];

      let etaDate: Date | null = null;
      let delayMin = 0;

      if (matchingShipment?.estimatedTimeOfArrival) {
        etaDate = new Date(matchingShipment.estimatedTimeOfArrival);
        delayMin = matchingShipment.delayInMinutes || 0;
      } else if (schedule.status === "IN_TRANSIT" || schedule.title.includes("Geniş Alan")) {
        // Canlı yoldaki randevular için OSRM hesaplanmış ETA
        etaDate = new Date(schedule.scheduledAt);
        delayMin = 0;
      }

      const etaFormatted = etaDate
        ? etaDate.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })
        : null;

      return {
        ...schedule,
        estimatedTimeOfArrival: etaDate?.toISOString() || null,
        delayInMinutes: delayMin,
        etaFormatted,
        isDelayed: delayMin > 0,
      };
    });

    return NextResponse.json(enrichedSchedules)
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
    const session = await auth()
    const userRole = session?.user?.role as string
    const isSuperAdmin = userRole === "SUPER_ADMIN"
    const tenantId = (session?.user as any)?.tenantId as string | undefined

    if (!session?.user || (!tenantId && !isSuperAdmin)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const {
      title,
      scheduledAt,
      timeSlot,
      vehiclePlate,
      driverName,
      driverContact,
      notes,
      status,
      projectId
    } = body

    if (!title || !scheduledAt || !timeSlot || !vehiclePlate || !driverName) {
      return NextResponse.json(
        { error: "Required fields are missing" },
        { status: 400 }
      )
    }

    // Default to PENDING if invalid status provided
    const validStatus = ["PENDING", "APPROVED", "REJECTED", "DELIVERED"].includes(status)
      ? status
      : "PENDING"

    const schedule = await prisma.logisticsSchedule.create({
      data: {
        title,
        type: body.type || "MALZEME_TESLİMAT",
        location: body.location || "Şantiye",
        scheduledAt: new Date(scheduledAt),
        timeSlot,
        vehiclePlate,
        driverName,
        driverContact,
        notes,
        status: validStatus,
        projectId: projectId || null,
        tenantId: tenantId || null,
      },
      include: {
        receivedBy: {
          select: { id: true, name: true, email: true }
        },
        project: {
          select: { id: true, name: true, title: true }
        }
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

export async function PATCH(request: Request) {
  try {
    const session = await auth()
    const userRole = session?.user?.role as string
    const isSuperAdmin = userRole === "SUPER_ADMIN"
    const tenantId = (session?.user as any)?.tenantId as string | undefined

    if (!session?.user || (!tenantId && !isSuperAdmin)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { id, status, deliveryProofImageUrl, deliveryNotes, receivedById, completedAt } = body

    if (!id) {
      return NextResponse.json(
        { error: "Schedule ID is required" },
        { status: 400 }
      )
    }

    if (!isSuperAdmin) {
      const existing = await prisma.logisticsSchedule.findFirst({
        where: { id, tenantId }
      })
      if (!existing) {
        return NextResponse.json({ error: "Kayıt bulunamadı veya yetkisiz erişim" }, { status: 404 })
      }
    }

    const updateData: any = {}
    if (status) updateData.status = status
    if (deliveryProofImageUrl !== undefined) updateData.deliveryProofImageUrl = deliveryProofImageUrl
    if (deliveryNotes !== undefined) updateData.deliveryNotes = deliveryNotes
    if (receivedById !== undefined) updateData.receivedById = receivedById
    if (completedAt !== undefined) {
      updateData.completedAt = completedAt ? new Date(completedAt) : null
    } else if (status === "DELIVERED") {
      updateData.completedAt = new Date()
    }

    const updated = await prisma.logisticsSchedule.update({
      where: { id },
      data: updateData,
      include: {
        receivedBy: {
          select: { id: true, name: true, email: true }
        },
        project: {
          select: { id: true, name: true, title: true }
        }
      }
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error("Failed to update logistics schedule:", error)
    return NextResponse.json(
      { error: "Failed to update logistics schedule" },
      { status: 500 }
    )
  }
}
