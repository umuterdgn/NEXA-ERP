/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Autonomous Global Crash & Telemetry Log API (/api/telemetry/error)
 */

import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

export const dynamic = "force-dynamic"

export async function POST(request: Request) {
  try {
    const session = await auth().catch(() => null)
    const body = await request.json().catch(() => ({}))

    const {
      module = "SYSTEM_TELEMETRY",
      errorMessage = "Bilinmeyen Sistem Hatası",
      errorStack = null,
      tenantId: customTenantId,
      userId: customUserId,
    } = body

    const effectiveTenantId = customTenantId || (session?.user as any)?.tenantId || null
    const effectiveUserId = customUserId || session?.user?.id || null

    const errorLog = await prisma.systemErrorLog.create({
      data: {
        tenantId: effectiveTenantId,
        userId: effectiveUserId,
        module: String(module),
        errorMessage: String(errorMessage).slice(0, 500),
        errorStack: errorStack ? String(errorStack).slice(0, 5000) : null,
        isResolved: false,
      },
    })

    return NextResponse.json({ success: true, logId: errorLog.id }, { status: 201 })
  } catch (err: any) {
    console.error("Telemetry error saving failed:", err)
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}

export async function GET() {
  try {
    const session = await auth().catch(() => null)
    if (session?.user?.role !== "SUPER_ADMIN" && session?.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 403 })
    }

    const errorLogs = await prisma.systemErrorLog.findMany({
      take: 30,
      orderBy: { createdAt: "desc" },
      include: {
        tenant: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
      },
    })

    return NextResponse.json({ success: true, logs: errorLogs })
  } catch (err: any) {
    console.error("Fetch telemetry logs failed:", err)
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await auth().catch(() => null)
    if (session?.user?.role !== "SUPER_ADMIN" && session?.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 403 })
    }

    const body = await request.json()
    const { id, isResolved = true } = body

    if (!id) {
      return NextResponse.json({ error: "Hata ID zorunludur" }, { status: 400 })
    }

    const updated = await prisma.systemErrorLog.update({
      where: { id },
      data: { isResolved: Boolean(isResolved) },
    })

    return NextResponse.json({ success: true, updated })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}
