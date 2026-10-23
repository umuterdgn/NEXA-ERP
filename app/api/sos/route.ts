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
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status") || "ACTIVE"

    const alerts = await prisma.sosAlert.findMany({
      where: status === "ALL" ? {} : { status },
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
    if (!session?.user?.id) {
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
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 })
    }

    const body = await request.json()
    const { alertId, status } = body // "RESOLVED"

    if (!alertId) {
      return NextResponse.json({ error: "alertId zorunludur" }, { status: 400 })
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
