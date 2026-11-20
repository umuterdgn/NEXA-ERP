/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * GET/POST /api/mobile/isg
 * Mobil İSG, Ramak Kala Bildirimi ve Acil SOS Alarm API'si
 */

import { NextResponse } from "next/server"
import { getMobileAuth } from "@/lib/mobile-auth"
import { prisma } from "@/lib/prisma"
import { assertTenantAndProjectAccess, requireAnyModule } from "@/lib/api-rbac"

export const runtime = "nodejs"

export async function GET(request: Request) {
  try {
    const auth = await getMobileAuth(request)
    if (!auth) {
      return NextResponse.json({ error: "Yetkisiz oturum." }, { status: 401 })
    }

    const denied = requireAnyModule(auth, ["near_miss", "sos_alarm", "isg_dashboard"])
    if (denied) return denied

    const { tenantId, assignedProjectIds } = auth
    const url = new URL(request.url)
    const reqProjectId = url.searchParams.get("projectId")
    if (reqProjectId) {
      const accessErr = await assertTenantAndProjectAccess(auth, reqProjectId)
      if (accessErr) return accessErr
    }
    const projectId = reqProjectId || (assignedProjectIds[0] ?? undefined)

    const [nearMisses, activeSos] = await Promise.all([
      prisma.nearMiss.findMany({
        where: {
          ...(tenantId ? { tenantId } : {}),
          ...(projectId ? { projectId } : {}),
        },
        orderBy: { incidentDate: "desc" },
        take: 20,
      }),
      prisma.sosAlert.findMany({
        where: {
          status: "ACTIVE",
          ...(tenantId ? { tenantId } : {}),
          ...(projectId ? { projectId } : {}),
        },
        orderBy: { createdAt: "desc" },
        include: { user: { select: { id: true, name: true, phone: true } } },
      }),
    ])

    return NextResponse.json({
      success: true,
      activeSosCount: activeSos.length,
      activeSosAlerts: activeSos.map((s) => ({
        id: s.id,
        userName: s.user?.name,
        userPhone: s.user?.phone,
        latitude: s.latitude,
        longitude: s.longitude,
        createdAt: s.createdAt,
      })),
      nearMisses: nearMisses.map((n) => ({
        id: n.id,
        title: n.title,
        description: n.description,
        severity: n.severity,
        status: n.status,
        location: n.location,
        imageUrl: n.imageUrl,
        incidentDate: n.incidentDate,
      })),
    })
  } catch (error: any) {
    console.error("Mobile isg GET error:", error)
    return NextResponse.json({ error: "İSG verileri getirilemedi." }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const auth = await getMobileAuth(request)
    if (!auth) {
      return NextResponse.json({ error: "Yetkisiz oturum." }, { status: 401 })
    }

    const denied = requireAnyModule(auth, ["near_miss", "sos_alarm", "isg_dashboard"])
    if (denied) return denied

    const { userId, tenantId, assignedProjectIds } = auth
    const body = await request.json().catch(() => ({}))
    const { action, title, description, severity, location, imageUrl, lat, lng, latitude, longitude, isAnonymous, projectId: reqProjectId } = body

    if (reqProjectId) {
      const accessErr = await assertTenantAndProjectAccess(auth, reqProjectId)
      if (accessErr) return accessErr
    }

    const targetProjectId =
      reqProjectId ||
      assignedProjectIds[0] ||
      (tenantId ? (await prisma.project.findFirst({ where: { tenantId, deletedAt: null } }))?.id : undefined)
    const currentLat = Number(lat ?? latitude)
    const currentLng = Number(lng ?? longitude)

    // 1. Acil Durum SOS Butonu
    if (action === "SOS") {
      const sos = await prisma.sosAlert.create({
        data: {
          tenantId,
          userId,
          projectId: targetProjectId,
          latitude: !isNaN(currentLat) ? currentLat : null,
          longitude: !isNaN(currentLng) ? currentLng : null,
          status: "ACTIVE",
        },
      })

      return NextResponse.json({
        success: true,
        message: "ACİL DURUM SOS ALARMI AKTİF EDİLDİ! Şantiye güvenliği ve sağlık ekiplerine bildirim iletildi.",
        sosAlert: sos,
      })
    }

    // 2. Ramak Kala İSG Bildirimi
    if (!description || !description.trim()) {
      return NextResponse.json({ error: "Ramak kala olay açıklaması gereklidir." }, { status: 400 })
    }

    let personel = await prisma.personel.findFirst({
      where: {
        ...(tenantId ? { tenantId } : {}),
        OR: [
          { userId },
          ...(auth.email ? [{ email: auth.email }] : []),
        ],
      },
      select: { id: true },
    })

    if (!personel && tenantId) {
      personel = await prisma.personel.findFirst({
        where: targetProjectId ? { projectId: targetProjectId, tenantId } : { tenantId },
        select: { id: true },
      })
    }

    const reporterId = personel?.id
    if (!reporterId || !targetProjectId) {
      return NextResponse.json({ error: "Sistemde kayıtlı personel veya proje bulunamadı." }, { status: 400 })
    }

    const nearMiss = await prisma.nearMiss.create({
      data: {
        tenantId,
        projectId: targetProjectId,
        reportedById: reporterId,
        title: title || (isAnonymous ? "Anonim Ramak Kala Bildirimi" : `${auth.name || "Personel"} - Ramak Kala Bildirimi`),
        description: description.trim(),
        severity: severity || "MEDIUM",
        location: location || "Şantiye Sahası",
        imageUrl: imageUrl || null,
        incidentDate: new Date(),
        status: "OPEN",
      },
    })

    return NextResponse.json({
      success: true,
      message: "Ramak kala bildirimi İSG uzmanına iletildi.",
      nearMiss,
    })
  } catch (error: any) {
    console.error("Mobile isg POST error:", error)
    return NextResponse.json({ error: "İSG bildirimi kaydedilemedi." }, { status: 500 })
  }
}
