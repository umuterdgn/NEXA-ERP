/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Mobil Puantaj & QR / Geofence Check-in/Check-out API
 */

import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getMobileAuth } from "@/lib/mobile-auth"
import { assertTenantAndProjectAccess, requireAnyModule } from "@/lib/api-rbac"

// Haversine formülü ile metre cinsinden mesafe hesaplama
function getDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371000 // Dünya yarıçapı (metre)
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

export async function GET(request: Request) {
  try {
    const auth = await getMobileAuth(request)
    if (!auth) {
      return NextResponse.json({ error: "Yetkisiz oturum." }, { status: 401 })
    }

    const denied = requireAnyModule(auth, ["my_attendance_qr", "attendance"])
    if (denied) return denied

    const { userId, email, tenantId } = auth

    const personel = await prisma.personel.findFirst({
      where: {
        ...(tenantId ? { tenantId } : {}),
        OR: [
          { userId },
          ...(email ? [{ email }] : []),
        ],
      },
      select: { id: true },
    })

    const records = personel
      ? await prisma.attendanceRecord.findMany({
          where: {
            personelId: personel.id,
          },
          orderBy: { date: "desc" },
          take: 30,
          include: {
            project: { select: { id: true, title: true } },
          },
        })
      : []

    return NextResponse.json({
      success: true,
      count: records.length,
      records: records.map((r) => ({
        id: r.id,
        date: r.date,
        checkIn: r.checkIn,
        checkOut: r.checkOut,
        status: r.status,
        method: "QR_OR_GPS",
        project: r.project?.title,
      })),
    })
  } catch (error: any) {
    console.error("Mobile attendance GET error:", error)
    return NextResponse.json({ error: "Puantaj kayıtları alınamadı." }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const auth = await getMobileAuth(request)
    if (!auth) {
      return NextResponse.json({ error: "Yetkisiz oturum." }, { status: 401 })
    }

    const denied = requireAnyModule(auth, ["my_attendance_qr", "attendance"])
    if (denied) return denied

    const { userId, email, name, tenantId, assignedProjectIds } = auth
    const body = await request.json().catch(() => ({}))
    const { lat, lng, latitude, longitude, projectId: reqProjectId } = body

    if (reqProjectId) {
      const accessErr = await assertTenantAndProjectAccess(auth, reqProjectId)
      if (accessErr) return accessErr
    }

    const currentLat = Number(lat ?? latitude)
    const currentLng = Number(lng ?? longitude)

    const targetProjectId =
      reqProjectId ||
      assignedProjectIds[0] ||
      (tenantId ? (await prisma.project.findFirst({ where: { tenantId, deletedAt: null } }))?.id : undefined)
    if (!targetProjectId) {
      return NextResponse.json({ error: "Proje bulunamadı." }, { status: 400 })
    }

    // Geofence Doğrulaması (varsa)
    if (!isNaN(currentLat) && !isNaN(currentLng)) {
      const project = await prisma.project.findUnique({
        where: { id: targetProjectId },
        select: { latitude: true, longitude: true, gpsRadius: true, gpsRequired: true },
      })
      if (project?.gpsRequired && project.latitude && project.longitude) {
        const dist = getDistanceMeters(currentLat, currentLng, project.latitude, project.longitude)
        const radius = project.gpsRadius || 150
        if (dist > radius) {
          return NextResponse.json(
            { error: `Şantiye sınırları dışındasınız (${Math.round(dist)}m uzaklıkta). Puantaj kaydedilemez.` },
            { status: 400 }
          )
        }
      }
    }

    const startOfToday = new Date()
    startOfToday.setHours(0, 0, 0, 0)
    const endOfToday = new Date()
    endOfToday.setHours(23, 59, 59, 999)

    const personel = await prisma.personel.findFirst({
      where: {
        OR: [
          { userId },
          ...(email ? [{ email }] : []),
        ],
      },
    })

    // Bugünün kaydını kontrol et
    const existingToday = personel
      ? await prisma.attendanceRecord.findFirst({
          where: {
            personelId: personel.id,
            date: { gte: startOfToday, lte: endOfToday },
          },
        })
      : null

    const now = new Date()

    if (existingToday) {
      // Eğer zaten giriş yapılmışsa -> Çıkış kaydet
      if (!existingToday.checkOut) {
        const updated = await prisma.attendanceRecord.update({
          where: { id: existingToday.id },
          data: {
            checkOut: now,
          },
        })
        return NextResponse.json({
          success: true,
          type: "CHECK_OUT",
          message: "Şantiye mesai çıkışınız başarıyla kaydedildi.",
          record: updated,
        })
      } else {
        // Bugün hem giriş hem çıkış yapılmış
        return NextResponse.json({
          success: true,
          type: "ALREADY_COMPLETED",
          message: "Bugünkü giriş ve çıkış işlemleriniz zaten tamamlanmıştır.",
          record: existingToday,
        })
      }
    }

    // Yeni Giriş Kaydı
    const newRecord = await prisma.attendanceRecord.create({
      data: {
        tenantId,
        personelId: personel?.id || null,
        workerName: name || email || "Saha Personeli",
        projectId: targetProjectId,
        date: now,
        checkIn: now,
        status: "PRESENT",
        latitude: !isNaN(currentLat) ? currentLat : null,
        longitude: !isNaN(currentLng) ? currentLng : null,
      },
    })

    return NextResponse.json({
      success: true,
      type: "CHECK_IN",
      message: "Şantiye mesai girişiniz başarıyla onaylandı.",
      record: newRecord,
    })
  } catch (error: any) {
    console.error("Mobile attendance POST error:", error)
    return NextResponse.json({ error: "Puantaj işlemi gerçekleştirilemedi." }, { status: 500 })
  }
}
