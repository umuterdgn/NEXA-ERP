/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * POST /api/mobile/routes/checkin
 * Güzergah Durağı Varış / Tamamlama (GPS Doğrulamalı Canlı DB Güncellemesi)
 */

import { NextResponse } from "next/server"
import { getMobileAuth } from "@/lib/mobile-auth"
import { prisma } from "@/lib/prisma"
import {
  assertRecordTenantScope,
  assertTenantAndProjectAccess,
  requireAnyModule,
} from "@/lib/api-rbac"

export const runtime = "nodejs"

function haversineMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3
  const phi1 = (lat1 * Math.PI) / 180
  const phi2 = (lat2 * Math.PI) / 180
  const dPhi = ((lat2 - lat1) * Math.PI) / 180
  const dLambda = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(dPhi / 2) * Math.sin(dPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(dLambda / 2) * Math.sin(dLambda / 2)
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

export async function POST(request: Request) {
  try {
    const auth = await getMobileAuth(request)
    if (!auth) {
      return NextResponse.json({ error: "Yetkisiz oturum." }, { status: 401 })
    }

    const denied = requireAnyModule(auth, ["route_optimization", "driver_deliveries"])
    if (denied) return denied

    const { userId, tenantId, name, email, assignedProjectIds } = auth
    const body = await request.json().catch(() => ({}))
    const {
      stopId,
      projectId: requestedProjectId,
      action,
      stopType,
      lat,
      lng,
      notes,
      qrCode,
      photoUrl,
    } = body

    if (!stopId || !action || !["ARRIVED", "COMPLETED"].includes(String(action))) {
      return NextResponse.json(
        { error: "Geçerli bir stopId ve action ('ARRIVED' | 'COMPLETED') gereklidir." },
        { status: 400 }
      )
    }

    const currentLat = Number(lat)
    const currentLng = Number(lng)
    if (isNaN(currentLat) || isNaN(currentLng)) {
      return NextResponse.json(
        { error: "Durak check-in işlemi için geçerli GPS koordinatı (lat, lng) gereklidir." },
        { status: 400 }
      )
    }

    if (requestedProjectId) {
      const accessErr = await assertTenantAndProjectAccess(auth, requestedProjectId)
      if (accessErr) return accessErr
    }

    const cleanStopId = String(stopId).trim()
    const now = new Date()

    // Durak kaydının bağlı olduğu gerçek modeli bul
    const schedule = await prisma.logisticsSchedule.findUnique({
      where: { id: cleanStopId },
      include: {
        project: { select: { id: true, tenantId: true, latitude: true, longitude: true, gpsRadius: true, name: true, title: true } },
      },
    })

    const appointment = !schedule
      ? await prisma.logisticsAppointment.findUnique({
          where: { id: cleanStopId },
          include: {
            project: { select: { id: true, tenantId: true, latitude: true, longitude: true, gpsRadius: true, name: true, title: true } },
          },
        })
      : null

    let targetProjectId: string | null =
      schedule?.projectId ||
      appointment?.projectId ||
      requestedProjectId ||
      null

    if (!schedule && !appointment) {
      // Proje tabanlı durak olabilir
      const directProj = await prisma.project.findUnique({
        where: { id: cleanStopId },
        select: { id: true, tenantId: true },
      })
      if (directProj) {
        targetProjectId = directProj.id
      }
    }

    if (schedule) {
      const scopeErr = assertRecordTenantScope(auth, schedule)
      if (scopeErr) return scopeErr
    } else if (appointment) {
      const scopeErr = assertRecordTenantScope(auth, appointment)
      if (scopeErr) return scopeErr
    } else if (targetProjectId) {
      const accessErr = await assertTenantAndProjectAccess(auth, targetProjectId)
      if (accessErr) return accessErr
    } else {
      return NextResponse.json({ error: "Durak veya proje kaydı bulunamadı." }, { status: 404 })
    }

    const effectiveProjectId = targetProjectId || (assignedProjectIds.length > 0 ? assignedProjectIds[0] : null)
    const projectForGeo =
      schedule?.project ||
      appointment?.project ||
      (effectiveProjectId
        ? await prisma.project.findUnique({
            where: { id: effectiveProjectId },
            select: { id: true, tenantId: true, latitude: true, longitude: true, gpsRadius: true, name: true, title: true },
          })
        : null)

    let distanceMeters: number | null = null
    let gpsVerified = true
    if (projectForGeo?.latitude != null && projectForGeo?.longitude != null) {
      distanceMeters = Math.round(
        haversineMeters(currentLat, currentLng, projectForGeo.latitude, projectForGeo.longitude)
      )
      const threshold = Math.max(projectForGeo.gpsRadius || 300, 300)
      gpsVerified = distanceMeters <= threshold
    }

    // Konum telemetri kaydı düş
    await prisma.locationLog.create({
      data: {
        userId,
        tenantId,
        projectId: effectiveProjectId,
        latitude: currentLat,
        longitude: currentLng,
        lat: currentLat,
        lng: currentLng,
        source: "ROUTE_CHECKIN",
        isInsideGeofence: gpsVerified,
        recordedAt: now,
        timestamp: now,
      },
    })

    const noteParts = [
      notes ? String(notes).trim() : null,
      qrCode ? `QR: ${String(qrCode).trim()}` : null,
      distanceMeters !== null ? `GPS Mesafe: ${distanceMeters}m (${gpsVerified ? "Doğrulandı" : "Saha Dışı"})` : null,
    ]
      .filter(Boolean)
      .join(" | ")

    let updatedRecordId: string | null = null

    if (schedule) {
      const updated = await prisma.logisticsSchedule.update({
        where: { id: schedule.id },
        data: {
          status: action === "COMPLETED" ? "DELIVERED" : "IN_TRANSIT",
          ...(action === "COMPLETED" ? { completedAt: now, receivedById: userId } : {}),
          ...(photoUrl ? { deliveryProofImageUrl: String(photoUrl) } : {}),
          ...(noteParts ? { deliveryNotes: noteParts } : {}),
        },
      })
      updatedRecordId = updated.id
    } else if (appointment) {
      const updated = await prisma.logisticsAppointment.update({
        where: { id: appointment.id },
        data: {
          status: action === "COMPLETED" ? "BOŞALTILDI" : "KAPIDA",
          ...(noteParts ? { notes: noteParts } : {}),
        },
      })
      updatedRecordId = updated.id
    } else if (effectiveProjectId) {
      // Yapı Denetim / Lab / Franchise Bölge Durağı için denetim kaydı oluştur
      const personel = await prisma.personel.findFirst({
        where: {
          ...(tenantId ? { tenantId } : {}),
          OR: [{ userId }, ...(email ? [{ email }] : [])],
        },
        select: { id: true },
      })

      if (personel) {
        const createdInspection = await prisma.inspection.create({
          data: {
            tenantId,
            projectId: effectiveProjectId,
            inspectorId: personel.id,
            type:
              stopType === "BRANCH_AUDIT"
                ? "SUBE_DENETIM"
                : stopType === "SAMPLE_PICKUP"
                ? "NUMUNE_ALIMI"
                : "SAHA_DENETIM",
            floor: "Saha Ziyareti",
            status: action === "COMPLETED" ? "APPROVED" : "PENDING",
            gpsLocation: `${currentLat.toFixed(6)},${currentLng.toFixed(6)}`,
            notes: noteParts || `Rota ${action} kaydı (${name || email})`,
          },
        })
        updatedRecordId = createdInspection.id
      }
    }

    if (action === "COMPLETED" && tenantId) {
      const admins = await prisma.user.findMany({
        where: {
          tenantId,
          role: { in: ["ADMIN", "SITE_MANAGER", "PROJECT_MANAGER", "INSPECTION_ADMIN", "FRANCHISE_ADMIN"] as any },
        },
        select: { id: true },
        take: 15,
      })
      if (admins.length > 0) {
        const stopLabel =
          schedule?.title ||
          appointment?.title ||
          projectForGeo?.name ||
          projectForGeo?.title ||
          cleanStopId
        await prisma.notification
          .createMany({
            data: admins.map((adm) => ({
              tenantId,
              userId: adm.id,
              title: "Güzergah Durağı Tamamlandı",
              message: `${name || email} '${stopLabel}' durağını tamamladı.${distanceMeters !== null ? ` (Mesafe: ${distanceMeters}m)` : ""}`,
              type: "SUCCESS",
              link: "/tr/admin/logistics",
            })),
          })
          .catch(() => {})
      }
    }

    return NextResponse.json({
      success: true,
      stopId: cleanStopId,
      status: action,
      distanceMeters,
      gpsVerified,
      checkedInAt: now.toISOString(),
      updatedRecordId,
      message:
        action === "COMPLETED"
          ? "Durak işlemi tamamlandı ve web paneline yansıtıldı."
          : "Durağa varış GPS doğrulamasıyla kaydedildi.",
    })
  } catch (error: any) {
    console.error("Mobile routes checkin POST error:", error)
    return NextResponse.json({ error: "Durak check-in kaydedilemedi." }, { status: 500 })
  }
}

