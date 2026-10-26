/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Acil Durum (SOS Alarmı) API
 */

import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  try {
    const session = await auth()
    const userRole = session?.user?.role as string
    const isSuperAdmin = userRole === "SUPER_ADMIN"
    const tenantId = (session?.user as any)?.tenantId as string | undefined

    if (!session?.user?.id || (!tenantId && !isSuperAdmin)) {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status") || "ACTIVE"

    const tenantFilter: any = !isSuperAdmin ? (tenantId ? { tenantId } : { tenantId: "non-existent" }) : {}
    const where: any = {
      ...tenantFilter,
      ...(status === "ALL" ? {} : { status })
    }

    const alerts = await prisma.sosAlert.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 20,
    })

    return NextResponse.json({ alerts })
  } catch (error: any) {
    console.error("❌ SOS GET error:", error)
    return NextResponse.json({ error: error.message || "SOS alarmları alınamadı" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth()
    const userRole = session?.user?.role as string
    const isSuperAdmin = userRole === "SUPER_ADMIN"
    const tenantId = (session?.user as any)?.tenantId as string | undefined

    if (!session?.user?.id || (!tenantId && !isSuperAdmin)) {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 })
    }

    const body = await request.json()
    const { latitude, longitude, projectId } = body

    const alert = await prisma.sosAlert.create({
      data: {
        userId: session.user.id,
        projectId: projectId || null,
        latitude: latitude ? parseFloat(latitude) : null,
        longitude: longitude ? parseFloat(longitude) : null,
        status: "ACTIVE",
        tenantId: tenantId || null,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
    })

    return NextResponse.json({ success: true, alert }, { status: 201 })
  } catch (error: any) {
    console.error("❌ SOS POST error:", error)
    return NextResponse.json({ error: error.message || "SOS alarmı tetiklenemedi" }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await auth()
    const userRole = session?.user?.role as string
    const isSuperAdmin = userRole === "SUPER_ADMIN"
    const tenantId = (session?.user as any)?.tenantId as string | undefined

    if (!session?.user?.id || (!tenantId && !isSuperAdmin)) {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 })
    }

    const body = await request.json()
    const { alertId, status } = body // "RESOLVED"

    if (!alertId) {
      return NextResponse.json({ error: "alertId zorunludur" }, { status: 400 })
    }

    if (!isSuperAdmin) {
      const existing = await prisma.sosAlert.findFirst({
        where: { id: alertId, tenantId }
      })
      if (!existing) {
        return NextResponse.json({ error: "Alarm bulunamadı veya yetkisiz erişim" }, { status: 404 })
      }
    }

    const updated = await prisma.sosAlert.update({
      where: { id: alertId },
      data: {
        status: status || "RESOLVED",
        resolvedById: session.user.id,
      },
      include: {
        user: {
          select: { id: true, name: true },
        },
      },
    })

    return NextResponse.json({ success: true, alert: updated })
  } catch (error: any) {
    console.error("❌ SOS PATCH error:", error)
    return NextResponse.json({ error: error.message || "SOS alarmı sonlandırılamadı" }, { status: 500 })
  }
}
