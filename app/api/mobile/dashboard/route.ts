/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * GET /api/mobile/dashboard
 * Mobil Dinamik Dashboard & Şantiye Operasyon Özeti (Sıfır Mock, Gerçek DB & Hava Durumu)
 */

import { NextResponse } from "next/server"
import { getMobileAuth } from "@/lib/mobile-auth"
import { prisma } from "@/lib/prisma"
import { assertTenantAndProjectAccess, isBranchOrProjectScopedRole } from "@/lib/api-rbac"

export const runtime = "nodejs"

export async function GET(request: Request) {
  try {
    const auth = await getMobileAuth(request)
    if (!auth) {
      return NextResponse.json({ error: "Yetkisiz oturum." }, { status: 401 })
    }

    const { userId, role, tenantId, assignedProjectIds } = auth
    const url = new URL(request.url)
    const reqProjectId = url.searchParams.get("projectId")

    if (reqProjectId) {
      const accessErr = await assertTenantAndProjectAccess(auth, reqProjectId)
      if (accessErr) return accessErr
    }

    let projectId = reqProjectId

    // Eğer parametrede projectId yoksa kullanıcının ilk atandığı projeyi al
    if (!projectId && assignedProjectIds.length > 0) {
      projectId = assignedProjectIds[0]
    }

    // Projeyi getir
    let project: any = null
    if (projectId) {
      project = await prisma.project.findFirst({
        where: {
          id: projectId,
          deletedAt: null,
          ...(tenantId ? { tenantId } : {}),
        },
        select: {
          id: true,
          title: true,
          name: true,
          city: true,
          district: true,
          latitude: true,
          longitude: true,
          status: true,
          progress: true,
          bimModelUrl: true,
        },
      })
    }

    // Eğer hala proje bulunamadıysa (ve şube/kapsam kısıtlı rol değilse) tenant'ın ilk projesini bul
    if (!project && !isBranchOrProjectScopedRole(role)) {
      project = await prisma.project.findFirst({
        where: {
          deletedAt: null,
          ...(tenantId ? { tenantId } : {}),
        },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          title: true,
          name: true,
          city: true,
          district: true,
          latitude: true,
          longitude: true,
          status: true,
          progress: true,
          bimModelUrl: true,
        },
      })
    }

    const activeProjectId = project?.id

    // Bugünün başlangıç ve bitişi
    const startOfToday = new Date()
    startOfToday.setHours(0, 0, 0, 0)
    const endOfToday = new Date()
    endOfToday.setHours(23, 59, 59, 999)

    // 1. Bekleyen Görevler
    const pendingTasks = await prisma.task.findMany({
      where: {
        ...(tenantId ? { tenantId } : {}),
        ...(activeProjectId ? { projectId: activeProjectId } : {}),
        OR: [
          { assignedTo: userId },
          { status: "TODO" },
          { status: "IN_PROGRESS" },
        ],
      },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        title: true,
        description: true,
        status: true,
        dueDate: true,
        taskType: true,
      },
    })

    // 2. Kullanıcının Bugünkü Puantaj Durumu
    const personel = await prisma.personel.findFirst({
      where: {
        OR: [
          { userId },
          ...(auth.email ? [{ email: auth.email }] : []),
        ],
      },
      select: { id: true },
    })

    const todayAttendance = personel
      ? await prisma.attendanceRecord.findFirst({
          where: {
            personelId: personel.id,
            date: { gte: startOfToday, lte: endOfToday },
          },
          select: {
            id: true,
            checkIn: true,
            checkOut: true,
            status: true,
          },
        })
      : null

    // 3. Günlük Jurnal & İlerleme
    const todayJournals = activeProjectId
      ? await prisma.dailyLog.findMany({
          where: {
            projectId: activeProjectId,
            date: { gte: startOfToday, lte: endOfToday },
          },
          select: {
            id: true,
            activities: true,
            personnelCount: true,
            weather: true,
            createdAt: true,
          },
          take: 3,
        })
      : []

    // 4. Denetim & Saha Kusurları (Deficiencies / Inspections)
    const openDeficiencies = activeProjectId
      ? await prisma.deficiency.count({
          where: {
            projectId: activeProjectId,
            status: { in: ["OPEN", "IN_PROGRESS", "PENDING_REVIEW"] },
          },
        })
      : 0

    // 5. Sevkiyat & Lojistik Durumu (Şoför veya Ambar için)
    const activeDeliveries = await prisma.logisticsSchedule.findMany({
      where: {
        ...(activeProjectId ? { projectId: activeProjectId } : {}),
        status: { in: ["PLANNED", "IN_TRANSIT"] },
      },
      take: 3,
      select: {
        id: true,
        vehiclePlate: true,
        driverName: true,
        type: true,
        status: true,
        scheduledAt: true,
        title: true,
      },
    })

    // 6. Son Kurumsal Duyurular
    const recentAnnouncements = await prisma.announcement.findMany({
      where: {
        ...(tenantId ? { tenantId } : {}),
      },
      orderBy: { createdAt: "desc" },
      take: 3,
      select: {
        id: true,
        title: true,
        content: true,
        severity: true,
        createdAt: true,
      },
    })

    // 7. Gerçek Hava Durumu (Open-Meteo Canlı API)
    let weatherData: any = {
      temperature: 21,
      weatherCode: 0,
      description: "Açık",
      isLive: false,
    }

    const lat = project?.latitude || 41.0082
    const lng = project?.longitude || 28.9784

    try {
      const weatherRes = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current_weather=true`,
        { next: { revalidate: 900 } } // 15 dk cache
      )
      if (weatherRes.ok) {
        const wJson = await weatherRes.json()
        if (wJson.current_weather) {
          weatherData = {
            temperature: Math.round(wJson.current_weather.temperature),
            windSpeed: wJson.current_weather.windspeed,
            weatherCode: wJson.current_weather.weathercode,
            time: wJson.current_weather.time,
            isLive: true,
          }
        }
      }
    } catch {}

    // Metrik Kartları
    const metrics = [
      {
        key: "tasks",
        title: "Bekleyen Görevler",
        value: pendingTasks.length,
        trend: pendingTasks.length > 0 ? "warning" : "success",
      },
      {
        key: "attendance",
        title: "Bugünkü Mesai",
        value: todayAttendance?.checkIn ? "Giriş Yapıldı" : "Giriş Bekleniyor",
        status: todayAttendance?.checkIn ? "PRESENT" : "ABSENT",
      },
      {
        key: "deficiencies",
        title: "Açık Saha Kusurları",
        value: openDeficiencies,
        trend: openDeficiencies > 0 ? "danger" : "success",
      },
      {
        key: "progress",
        title: "Şantiye İlerlemesi",
        value: `${project?.progress || 0}%`,
      },
    ]

    return NextResponse.json({
      success: true,
      project: project
        ? {
            id: project.id,
            name: project.name || project.title,
            city: project.city,
            district: project.district,
            progress: project.progress || 0,
            has3DModel: Boolean(project.bimModelUrl),
          }
        : null,
      weather: weatherData,
      metrics,
      pendingTasks,
      todayAttendance,
      todayJournals,
      activeDeliveries,
      recentAnnouncements,
    })
  } catch (error: any) {
    console.error("Mobile dashboard error:", error)
    return NextResponse.json({ error: error?.message || "Dashboard yüklenemedi." }, { status: 500 })
  }
}
