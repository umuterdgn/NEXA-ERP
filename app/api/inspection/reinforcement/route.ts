/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * This code is the property of NXA Software.
 */

import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const inspections = await prisma.reinforcementInspection.findMany({
      include: {
        project: true
      },
      orderBy: {
        inspectionDate: 'desc'
      }
    })

    return NextResponse.json(inspections)
  } catch (error) {
    console.error("Reinforcement inspection fetch error:", error)
    return NextResponse.json(
      { error: "Kontroller getirilirken hata oluştu" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { projectId, element, status, notes, photoUrl, inspectionDate, inspectorName } = body

    if (!projectId || !element || !photoUrl) {
      return NextResponse.json(
        { error: "Proje, eleman ve fotoğraf zorunludur" },
        { status: 400 }
      )
    }

    const inspection = await prisma.reinforcementInspection.create({
      data: {
        projectId,
        element,
        status: status || "BEKLIYOR",
        notes: notes || "",
        photoUrl,
        inspectionDate: inspectionDate ? new Date(inspectionDate) : new Date(),
        inspectorName: inspectorName || ""
      }
    })

    return NextResponse.json(inspection)
  } catch (error) {
    console.error("Reinforcement inspection creation error:", error)
    return NextResponse.json(
      { error: "Kontrol oluşturulurken hata oluştu" },
      { status: 500 }
    )
  }
}
