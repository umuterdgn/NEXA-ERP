/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Ataşman & İlerleme Kamerası (Kanıt Fotoğrafları) API
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
    const projectId = searchParams.get("projectId")

    const whereClause: any = {}
    if (projectId) {
      whereClause.projectId = projectId
    }

    const attachments = await prisma.progressAttachment.findMany({
      where: whereClause,
      include: {
        project: {
          select: { id: true, name: true, city: true },
        },
        uploader: {
          select: { id: true, name: true, email: true, role: true },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 60,
    })

    return NextResponse.json({ attachments })
  } catch (error: any) {
    console.error("❌ ProgressAttachment GET error:", error)
    return NextResponse.json({ error: error.message || "Ataşmanlar alınamadı" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 })
    }

    const body = await request.json()
    const { projectId, photoUrl, description, latitude, longitude, stageGateId } = body

    if (!projectId || !photoUrl) {
      return NextResponse.json({ error: "Proje ve fotoğraf zorunludur" }, { status: 400 })
    }

    const attachment = await prisma.progressAttachment.create({
      data: {
        projectId,
        uploaderId: session.user.id,
        photoUrl,
        description: description || null,
        latitude: latitude ? parseFloat(latitude) : null,
        longitude: longitude ? parseFloat(longitude) : null,
        stageGateId: stageGateId || null,
      },
      include: {
        project: {
          select: { id: true, name: true, city: true },
        },
        uploader: {
          select: { id: true, name: true, email: true },
        },
      },
    })

    // Eğer bir StageGate'e bağlıysa ve onay belgesi yoksa otomatik ilişkilendir
    if (stageGateId) {
      try {
        await prisma.stageGate.update({
          where: { id: stageGateId },
          data: {
            documentUrl: photoUrl,
          },
        })
      } catch (err) {
        console.warn("StageGate documentUrl update skipped:", err)
      }
    }

    return NextResponse.json({ attachment }, { status: 201 })
  } catch (error: any) {
    console.error("❌ ProgressAttachment POST error:", error)
    return NextResponse.json({ error: error.message || "Ataşman kaydedilemedi" }, { status: 500 })
  }
}
