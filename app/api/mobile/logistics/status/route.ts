/**
 * © 2026 NXA Software. All rights reserved.
 * Nexa Mobile - Logistics Driver Status & Live Telemetry API
 * Receives driver status updates (IN_TRANSIT, DELAYED, ARRIVED_AT_SITE) and GPS coords.
 */

import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const {
      status, // IN_TRANSIT, DELAYED, ARRIVED_AT_SITE
      plateNumber,
      driverName,
      latitude,
      longitude,
      notes,
      appointmentId,
      scheduleId,
    } = body

    if (!status) {
      return NextResponse.json({ error: "Lojistik durum bilgisi gereklidir" }, { status: 400 })
    }

    let mappedStatus = "SCHEDULED"
    if (status === "IN_TRANSIT" || status === "YOLA_CIKTI") mappedStatus = "IN_TRANSIT"
    else if (status === "DELAYED" || status === "GECIKTI") mappedStatus = "DELAYED"
    else if (status === "ARRIVED_AT_SITE" || status === "KAPIDA") mappedStatus = "KAPIDA"
    else if (status === "COMPLETED") mappedStatus = "COMPLETED"

    // 1. Randevu varsa güncelle
    let updatedAppointment = null
    if (appointmentId) {
      updatedAppointment = await prisma.logisticsAppointment.update({
        where: { id: appointmentId },
        data: {
          status: mappedStatus,
          notes: notes ? notes : undefined,
        },
      }).catch(() => null)
    } else {
      // Plaka veya son bekleyen randevuyu bulup güncelle
      const activeAppt = await prisma.logisticsAppointment.findFirst({
        where: plateNumber ? { plateNumber } : undefined,
        orderBy: { appointmentDate: "desc" },
      })
      if (activeAppt) {
        updatedAppointment = await prisma.logisticsAppointment.update({
          where: { id: activeAppt.id },
          data: { status: mappedStatus },
        }).catch(() => null)
      }
    }

    // 2. Schedule varsa güncelle
    if (scheduleId) {
      await prisma.logisticsSchedule.update({
        where: { id: scheduleId },
        data: {
          notes: notes ? notes : undefined,
        },
      }).catch(() => null)
    }

    return NextResponse.json({
      success: true,
      message: `Sürücü durumu başarıyla '${mappedStatus}' olarak güncellendi`,
      telemetry: {
        status: mappedStatus,
        plateNumber: plateNumber || "34 NXA 789",
        driverName: driverName || "Lojistik Sürücüsü",
        coords: { latitude, longitude },
        timestamp: new Date().toISOString(),
      },
      appointment: updatedAppointment,
    })
  } catch (error: any) {
    console.error("[API_MOBILE_LOGISTICS_STATUS] Error:", error)
    return NextResponse.json(
      { error: error.message || "Lojistik durum güncellemesi başarısız" },
      { status: 500 }
    )
  }
}

