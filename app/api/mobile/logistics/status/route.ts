/**
 * © 2026 NXA Software. All rights reserved.
 * Nexa Mobile - Logistics Driver Status & Live Telemetry API (Auth & Tenant Isolated)
 */

import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getMobileAuth } from "@/lib/mobile-auth"
import { assertRecordTenantScope, requireAnyModule } from "@/lib/api-rbac"

export const dynamic = "force-dynamic"

export async function POST(request: Request) {
  try {
    const auth = await getMobileAuth(request)
    if (!auth) {
      return NextResponse.json({ error: "Yetkisiz oturum." }, { status: 401 })
    }

    const denied = requireAnyModule(auth, [
      "driver_deliveries",
      "gate_security",
      "logistics_appointments",
    ])
    if (denied) return denied

    const { tenantId } = auth
    const body = await request.json().catch(() => ({}))
    const {
      status,
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

    let updatedAppointment = null
    if (appointmentId) {
      const existingAppt = await prisma.logisticsAppointment.findUnique({
        where: { id: appointmentId },
      })
      if (existingAppt) {
        const scopeErr = assertRecordTenantScope(auth, existingAppt)
        if (scopeErr) return scopeErr
        updatedAppointment = await prisma.logisticsAppointment
          .update({
            where: { id: appointmentId },
            data: {
              status: mappedStatus,
              notes: notes ? notes : undefined,
            },
          })
          .catch(() => null)
      }
    } else if (plateNumber) {
      const activeAppt = await prisma.logisticsAppointment.findFirst({
        where: {
          plateNumber,
          ...(tenantId ? { tenantId } : {}),
        },
        orderBy: { appointmentDate: "desc" },
      })
      if (activeAppt) {
        updatedAppointment = await prisma.logisticsAppointment
          .update({
            where: { id: activeAppt.id },
            data: { status: mappedStatus },
          })
          .catch(() => null)
      }
    }

    if (scheduleId) {
      const existingSched = await prisma.logisticsSchedule.findUnique({ where: { id: scheduleId } })
      if (existingSched) {
        const scopeErr = assertRecordTenantScope(auth, existingSched)
        if (scopeErr) return scopeErr
        await prisma.logisticsSchedule
          .update({
            where: { id: scheduleId },
            data: {
              notes: notes ? notes : undefined,
            },
          })
          .catch(() => null)
      }
    }

    return NextResponse.json({
      success: true,
      message: `Sürücü durumu başarıyla '${mappedStatus}' olarak güncellendi`,
      telemetry: {
        status: mappedStatus,
        plateNumber: plateNumber || null,
        driverName: driverName || auth.name,
        coords: { latitude, longitude },
        timestamp: new Date().toISOString(),
      },
      appointment: updatedAppointment,
    })
  } catch (error: any) {
    console.error("[API_MOBILE_LOGISTICS_STATUS] Error:", error)
    return NextResponse.json({ error: error.message || "Lojistik durum güncellemesi başarısız" }, { status: 500 })
  }
}
