/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * This code is the property of NXA Software.
 */

import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const attachments = await prisma.attachmentEvidence.findMany({
      include: {
        project: true
      },
      orderBy: {
        attachmentDate: 'desc'
      }
    })

    return NextResponse.json(attachments)
  } catch (error) {
    console.error("Attachment evidence fetch error:", error)
    return NextResponse.json(
      { error: "Ataşmanlar getirilirken hata oluştu" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { projectId, title, location, description, photoUrl, attachmentDate, createdBy } = body

    if (!projectId || !title || !location || !photoUrl) {
      return NextResponse.json(
        { error: "Proje, başlık, konum ve fotoğraf zorunludur" },
        { status: 400 }
      )
    }

    const attachment = await prisma.attachmentEvidence.create({
      data: {
        projectId,
        title,
        location,
        description: description || "",
        photoUrl,
        attachmentDate: attachmentDate ? new Date(attachmentDate) : new Date(),
        createdBy: createdBy || ""
      }
    })

    return NextResponse.json(attachment)
  } catch (error) {
    console.error("Attachment evidence creation error:", error)
    return NextResponse.json(
      { error: "Ataşman oluşturulurken hata oluştu" },
      { status: 500 }
    )
  }
}
