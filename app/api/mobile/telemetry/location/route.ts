/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * POST /api/mobile/telemetry/location
 * Canlı Konum Telemetrisi, Geofence Doğrulama & Zimmetli BLE Yakınlık / Kayıp Uyarısı
 */

import { NextResponse } from "next/server"
import { getMobileAuth } from "@/lib/mobile-auth"
import { prisma } from "@/lib/prisma"
import { assertRecordTenantScope, assertTenantAndProjectAccess } from "@/lib/api-rbac"

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

    const { userId, tenantId, assignedProjectIds, name, email } = auth
    const body = await request.json().catch(() => ({}))
    const {
      lat,
      lng,
      latitude,
      longitude,
      speed,
      heading,
      accuracy,
      source,
      batteryLevel,
      projectId: requestedProjectId,
      // BLE Telemetri Alanları
      bleDeviceId,
      rssi,
      estimatedDistanceMeters,
      proximityZone,
      bleEventType,
    } = body

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

    let targetProjectId =
      requestedProjectId || (assignedProjectIds.length > 0 ? assignedProjectIds[0] : null)
    let isInsideGeofence = true

    if (targetProjectId) {
      const project = await prisma.project.findUnique({
        where: { id: targetProjectId },
        select: { id: true, latitude: true, longitude: true, gpsRadius: true },
      })

      if (project && project.latitude != null && project.longitude != null) {
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
    const normalizedEventType =
      bleEventType === "HEARTBEAT" || bleEventType === "LOST_ALERT" || bleEventType === "FOUND"
        ? bleEventType
        : bleDeviceId
        ? "HEARTBEAT"
        : null

    const parsedRssi = rssi != null && !isNaN(Number(rssi)) ? Math.round(Number(rssi)) : null
    const parsedBleDistance =
      estimatedDistanceMeters != null && !isNaN(Number(estimatedDistanceMeters))
        ? Number(estimatedDistanceMeters)
        : null

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
        speed: speed != null && !isNaN(Number(speed)) ? Number(speed) : null,
        heading: heading != null && !isNaN(Number(heading)) ? Number(heading) : null,
        accuracy: accuracy != null && !isNaN(Number(accuracy)) ? Number(accuracy) : null,
        source: source || (bleDeviceId ? "BLE" : "GPS"),
        batteryLevel:
          batteryLevel != null && !isNaN(Number(batteryLevel)) ? Number(batteryLevel) : null,
        isInsideGeofence,
        bleDeviceId: bleDeviceId ? String(bleDeviceId) : null,
        rssi: parsedRssi,
        estimatedDistanceMeters: parsedBleDistance,
        proximityZone: proximityZone ? String(proximityZone) : null,
        bleEventType: normalizedEventType,
        recordedAt: now,
        timestamp: now,
      },
    })

    // 2. User tablosundaki anlık konum alanlarını güncelle
    await prisma.user
      .update({
        where: { id: userId },
        data: {
          currentLat,
          currentLng,
          lastLocationUpdate: now,
        },
      })
      .catch(() => {})

    // 3. BLE cihazı eşleşiyorsa son konumunu ve durumunu güncelle; LOST_ALERT ise İSG & bildirim oluştur
    let bleUpdated = false
    let alertTriggered = false

    if (bleDeviceId) {
      const cleanBleKey = String(bleDeviceId).trim()
      const bleDevice = await prisma.bleDevice.findFirst({
        where: {
          ...(tenantId ? { tenantId } : {}),
          OR: [{ id: cleanBleKey }, { macAddress: cleanBleKey.toUpperCase() }],
        },
      })

      let resolvedDeviceLabel: string | null = null
      let resolvedProjectId = targetProjectId

      if (bleDevice) {
        const scopeErr = assertRecordTenantScope(auth, bleDevice)
        if (scopeErr) return scopeErr

        const nextStatus = normalizedEventType === "LOST_ALERT" ? "LOST" : "ACTIVE"
        await prisma.bleDevice.update({
          where: { id: bleDevice.id },
          data: {
            lastLat: currentLat,
            lastLng: currentLng,
            lastSeenAt: now,
            status: nextStatus,
            ...(parsedRssi !== null ? { lastRssi: parsedRssi } : {}),
            ...(proximityZone ? { proximityZone: String(proximityZone) } : {}),
            ...(batteryLevel != null && !isNaN(Number(batteryLevel))
              ? { batteryLevel: Math.max(0, Math.min(100, Math.round(Number(batteryLevel)))) }
              : {}),
          },
        })
        bleUpdated = true
        resolvedDeviceLabel = bleDevice.name || `${bleDevice.deviceType} (${bleDevice.macAddress})`
        resolvedProjectId = bleDevice.projectId || targetProjectId
      } else {
        const equipment = await prisma.equipment.findFirst({
          where: {
            ...(tenantId ? { tenantId } : {}),
            OR: [{ id: cleanBleKey }, { bleTagId: cleanBleKey }],
          },
        })

        if (equipment) {
          const scopeErr = assertRecordTenantScope(auth, equipment)
          if (scopeErr) return scopeErr

          await prisma.equipment.update({
            where: { id: equipment.id },
            data: {
              lastLat: currentLat,
              lastLng: currentLng,
              latitude: currentLat,
              longitude: currentLng,
              lastSeenAt: now,
              ...(normalizedEventType === "LOST_ALERT"
                ? { status: "LOST" }
                : equipment.status === "LOST"
                ? { status: "ASSIGNED" }
                : {}),
            },
          })
          bleUpdated = true
          resolvedDeviceLabel = `${equipment.name} (${equipment.bleTagId || equipment.serialNumber || equipment.id})`
          resolvedProjectId = equipment.projectId || targetProjectId
        }
      }

      if (normalizedEventType === "LOST_ALERT") {
        const deviceDesc = resolvedDeviceLabel || cleanBleKey
        const workerLabel = name || email || "Saha Personeli"

        if (resolvedProjectId) {
          await prisma.isgViolation
            .create({
              data: {
                tenantId,
                projectId: resolvedProjectId,
                workerName: workerLabel,
                violation: `Zimmetli BLE Sinyal Kaybı: ${deviceDesc}`,
                zoneName: `Son GPS: ${currentLat.toFixed(5)}, ${currentLng.toFixed(5)}`,
                status: "OPEN",
              },
            })
            .catch(() => {})
        }

        const managers = await prisma.user.findMany({
          where: {
            ...(tenantId ? { tenantId } : {}),
            role: {
              in: ["SITE_MANAGER", "ISG_EXPERT", "EQUIPMENT_MANAGER", "ADMIN"] as any,
            },
          },
          select: { id: true },
          take: 20,
        })

        if (managers.length > 0) {
          await prisma.notification
            .createMany({
              data: managers.map((mgr) => ({
                tenantId,
                userId: mgr.id,
                title: "BLE Etiket Sinyal Kaybı",
                message: `${workerLabel} için zimmetli '${deviceDesc}' etiketi 60+ sn sinyal kesintisi verdi. Son GPS: ${currentLat.toFixed(5)}, ${currentLng.toFixed(5)}`,
                type: "URGENT",
                link: "/tr/admin/isg",
              })),
            })
            .catch(() => {})
        }

        alertTriggered = true
      }
    }

    return NextResponse.json({
      success: true,
      logId: log.id,
      isInsideGeofence,
      recordedAt: log.recordedAt,
      bleUpdated,
      alertTriggered,
    })
  } catch (error: any) {
    console.error("Telemetry location error:", error)
    return NextResponse.json({ error: "Konum kaydedilemedi." }, { status: 500 })
  }
}
