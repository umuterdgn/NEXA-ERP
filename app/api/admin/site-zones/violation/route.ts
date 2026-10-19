/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Autonomous ISG Violation Logging API (Polygon Geofence Engine)
 */

import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { projectId, workerId, workerName, zoneName, violation, status = "OPEN" } = body

    if (!projectId || !workerName) {
      return NextResponse.json(
        { error: "projectId ve workerName alanları zorunludur" },
        { status: 400 }
      )
    }

    // Rate-limit / de-duplicate: If an OPEN violation for the same worker & zone was created in the last 2 minutes, don't spam
    const recentThreshold = new Date(Date.now() - 2 * 60 * 1000)
    const existing = await prisma.isgViolation.findFirst({
      where: {
        projectId,
        workerName,
        status: "OPEN",
        timestamp: { gte: recentThreshold }
      }
    })

    if (existing) {
      return NextResponse.json({
        success: true,
        alreadyLogged: true,
        violation: existing
      })
    }

    const createdViolation = await prisma.isgViolation.create({
      data: {
        projectId,
        workerName,
        zoneName: zoneName || "Tehlikeli Alan (DANGER_ZONE)",
        violation: violation || "DANGER_ZONE (Kırmızı Alan) Alan İhlali: Baret / KKD Eksik",
        status
      }
    })

    console.warn(`[POLYGON GEOFENCE ISG İHLALİ] ${workerName} - ${zoneName} bölgesinde ihlal oluşturuldu!`)

    return NextResponse.json({
      success: true,
      alreadyLogged: false,
      violation: createdViolation
    }, { status: 201 })
  } catch (error) {
    console.error("Failed to log ISG violation:", error)
    return NextResponse.json(
      { error: "İSG İhlali kaydedilirken hata oluştu" },
      { status: 500 }
    )
  }
}
