/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Gerçek Saha Görevleri & Teslimat Lokasyonları Rota API'si
 */

import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const personnelId = searchParams.get("personnelId")

    const sessionUser = session.user as any
    const isSuperAdmin = sessionUser?.role === "SUPER_ADMIN"
    const userTenantId = sessionUser?.tenantId as string | undefined

    const tenantFilter: any = !isSuperAdmin
      ? userTenantId
        ? { tenantId: userTenantId }
        : { tenantId: "non-existent" }
      : {}

    const projectTenantFilter: any = !isSuperAdmin
      ? userTenantId
        ? { project: { tenantId: userTenantId } }
        : { project: { tenantId: "non-existent" } }
      : {}

    // 1. Personel Bilgisi
    let personnel: any = null
    if (personnelId) {
      personnel = await prisma.personel.findUnique({
        where: { id: personnelId },
        select: {
          id: true,
          name: true,
          phone: true,
          lastKnownLat: true,
          lastKnownLng: true,
          currentSite: true,
        }
      })
    }

    const startOfToday = new Date()
    startOfToday.setHours(0, 0, 0, 0)
    const endOfToday = new Date()
    endOfToday.setHours(23, 59, 59, 999)

    // 2. Bugünün Gerçek Sevkiyat / Teslimatlarını Çek
    const logisticsWhere: any = {
      ...tenantFilter,
      scheduledAt: { gte: startOfToday, lte: endOfToday },
    }

    if (personnel) {
      logisticsWhere.OR = [
        { driverName: { contains: personnel.name, mode: "insensitive" } },
        ...(personnel.phone ? [{ driverContact: { contains: personnel.phone } }] : [])
      ]
    }

    const realLogistics = await prisma.logisticsSchedule.findMany({
      where: logisticsWhere,
      include: {
        project: {
          select: {
            id: true,
            name: true,
            latitude: true,
            longitude: true,
            city: true,
            district: true,
          }
        }
      },
      orderBy: { scheduledAt: "asc" }
    }).catch(() => [])

    // 3. Sahada Atanmış Gerçek Görevleri (Task & WorkOrder) Çek
    const workOrderWhere: any = {
      ...projectTenantFilter,
      status: { in: ["TODO", "IN_PROGRESS"] },
    }
    if (personnelId) {
      workOrderWhere.assignedToId = personnelId
    }

    const realWorkOrders = await prisma.workOrder.findMany({
      where: workOrderWhere,
      include: {
        project: {
          select: {
            id: true,
            name: true,
            latitude: true,
            longitude: true,
            city: true,
            district: true,
          }
        }
      },
      take: 10,
      orderBy: { dueDate: "asc" }
    }).catch(() => [])

    const stops: Array<{
      id: string
      name: string
      type: "TESLIMAT" | "GOREV" | "BASLANGIC"
      address: string
      lat: number
      lng: number
      order: number
      time?: string
      status: string
    }> = []

    let orderIndex = 1

    // Eğer personelin canlı GPS konumu varsa başlangıç noktası olarak ekle
    if (personnel?.lastKnownLat && personnel?.lastKnownLng) {
      stops.push({
        id: "start-live-pos",
        name: `${personnel.name} (Anlık Konum)`,
        type: "BASLANGIC",
        address: personnel.currentSite || "Canlı GPS Konumu",
        lat: Number(personnel.lastKnownLat),
        lng: Number(personnel.lastKnownLng),
        order: orderIndex++,
        status: "LIVE"
      })
    }

    // Gerçek Teslimat Durakları
    for (const item of realLogistics) {
      const lat = typeof item.project?.latitude === "number" ? item.project.latitude : null
      const lng = typeof item.project?.longitude === "number" ? item.project.longitude : null

      if (lat !== null && lng !== null && !isNaN(lat) && !isNaN(lng)) {
        stops.push({
          id: `logistics-${item.id}`,
          name: item.title,
          type: "TESLIMAT",
          address: `${item.location || ''} ${item.project?.district ? `(${item.project.district})` : ''}`,
          lat,
          lng,
          order: orderIndex++,
          time: new Date(item.scheduledAt).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" }),
          status: item.status
        })
      }
    }

    // Gerçek Saha Görevleri
    for (const wo of realWorkOrders) {
      const lat = typeof wo.project?.latitude === "number" ? wo.project.latitude : null
      const lng = typeof wo.project?.longitude === "number" ? wo.project.longitude : null

      if (lat !== null && lng !== null && !isNaN(lat) && !isNaN(lng)) {
        stops.push({
          id: `wo-${wo.id}`,
          name: wo.title,
          type: "GOREV",
          address: `${wo.project.name} - ${wo.department}`,
          lat,
          lng,
          order: orderIndex++,
          status: wo.status
        })
      }
    }

    // Eğer bu personele özel görev bulunamadıysa ve genel sorguysa, koordinatı olan projelerden çek
    if (stops.length === 0 && !personnelId) {
      const activeProjects = await prisma.project.findMany({
        where: {
          ...tenantFilter,
          latitude: { not: null },
          longitude: { not: null },
          isActive: true
        },
        select: {
          id: true,
          name: true,
          latitude: true,
          longitude: true,
          city: true,
          district: true
        },
        take: 5
      }).catch(() => [])

      for (const p of activeProjects) {
        const lat = typeof p.latitude === "number" ? p.latitude : null
        const lng = typeof p.longitude === "number" ? p.longitude : null
        if (lat !== null && lng !== null && !isNaN(lat) && !isNaN(lng)) {
          stops.push({
            id: `proj-${p.id}`,
            name: p.name ?? "İsimsiz Proje",
            type: "GOREV",
            address: `${p.district || ''}, ${p.city || ''}`,
            lat,
            lng,
            order: orderIndex++,
            status: "ACTIVE"
          })
        }
      }
    }

    return NextResponse.json({
      success: true,
      personnel: personnel ? { id: personnel.id, name: personnel.name } : null,
      stopsCount: stops.length,
      stops
    })
  } catch (error: any) {
    console.error("Route stops API error:", error)
    return NextResponse.json({ error: "Duraklar listelenirken hata oluştu" }, { status: 500 })
  }
}
