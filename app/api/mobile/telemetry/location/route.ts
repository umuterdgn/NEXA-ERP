/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * POST /api/mobile/telemetry/location
 * Canlı Konum Telemetrisi & Geofence Doğrulama (Saha ve Yol Personeli)
 */

import { NextResponse } from "next/server"
import { getMobileAuth } from "@/lib/mobile-auth"
import { prisma } from "@/lib/prisma"
import { assertTenantAndProjectAccess } from "@/lib/api-rbac"

export const runtime = "nodejs"

// Haversine formülü ile iki koordinat arası metre mesafesi
function calculateDistanceInMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3 // Dünya yarıçapı metre
  const φ1 = (lat1 * Math.PI) / 180
  const φ2 = (lat2 * Math.PI) / 180
  const Δφ = ((lat2 - lat1) * Math.PI) / 180
  const Δλ = ((lon2 - lon1) * Math.PI) / 180

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

  return R * c
}

export async function POST(request: Request) {
  try {
    const auth = await getMobileAuth(request)
    if (!auth) {
      return NextResponse.json({ error: "Yetkisiz oturum." }, { status: 401 })
    }

    const { userId, tenantId, assignedProjectIds } = auth
    const body = await request.json().catch(() => ({}))
    const { lat, lng, latitude, longitude, speed, heading, accuracy, source, batteryLevel, projectId: requestedProjectId } = body

    const currentLat = Number(lat ?? latitude)
    const currentLng = Number(lng ?? longitude)

    if (isNaN(currentLat) || isNaN(currentLng)) {
      return NextResponse.json(
        { error: "Geçerli bir enlem (lat) ve boylam (lng) gereklidir." },
        { status: 400 }
      )
    }

    if (requestedProjectId) {
      const accessErr = await assertTenantAndProjectAccess(auth, requestedProjectId)
      if (accessErr) return accessErr
    }

    // Hedef Projeyi Belirle
    let targetProjectId = requestedProjectId || (assignedProjectIds.length > 0 ? assignedProjectIds[0] : null)
    let isInsideGeofence = true

    if (targetProjectId) {
      const project = await prisma.project.findUnique({
        where: { id: targetProjectId },
        select: { id: true, latitude: true, longitude: true, gpsRadius: true },
      })

      if (project && project.latitude && project.longitude) {
        const distance = calculateDistanceInMeters(
          currentLat,
          currentLng,
          project.latitude,
          project.longitude
        )
        const allowedRadius = project.gpsRadius || 150
        isInsideGeofence = distance <= allowedRadius
      }
    }

    const now = new Date()

    // 1. LocationLog kaydı oluştur
    const log = await prisma.locationLog.create({
      data: {
        userId,
        tenantId,
        projectId: targetProjectId,
        latitude: currentLat,
        longitude: currentLng,
        lat: currentLat,
        lng: currentLng,
        speed: speed != null ? Number(speed) : null,
        heading: heading != null ? Number(heading) : null,
        accuracy: accuracy != null ? Number(accuracy) : null,
        source: source || "GPS",
        batteryLevel: batteryLevel != null ? Number(batteryLevel) : null,
        isInsideGeofence,
        recordedAt: now,
        timestamp: now,
      },
    })

    // 2. User tablosundaki anlık konum alanlarını güncelle
    await prisma.user.update({
      where: { id: userId },
      data: {
        currentLat,
        currentLng,
        lastLocationUpdate: now,
      },
    }).catch(() => {})

    return NextResponse.json({
      success: true,
      logId: log.id,
      isInsideGeofence,
      recordedAt: log.recordedAt,
    })
  } catch (error: any) {
    console.error("Telemetry location error:", error)
    return NextResponse.json({ error: "Konum kaydedilemedi." }, { status: 500 })
  }
}

