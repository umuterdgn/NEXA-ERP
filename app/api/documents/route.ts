/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * This code is the property of NXA Software.
 */

import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { title, category, fileUrl, projectId, expiryDate } = body

    if (!title || !category || !fileUrl) {
      return NextResponse.json(
        { error: "Eksik alanlar var" },
        { status: 400 }
      )
    }

    // Create document archive entry
    const document = await prisma.documentArchive.create({
      data: {
        title,
        category,
        fileUrl,
        projectId: projectId || null,
        expiryDate: expiryDate ? new Date(expiryDate) : null
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            title: true
          }
        }
      }
    })

    return NextResponse.json(document, { status: 201 })
  } catch (error) {
    console.error("Document creation error:", error)
    return NextResponse.json(
      { error: "Evrak oluşturulurken hata oluştu" },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get("projectId")
    const category = searchParams.get("category")

    const documents = await prisma.documentArchive.findMany({
      where: {
        ...(projectId && { projectId }),
        ...(category && { category })
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            title: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json(documents)
  } catch (error) {
    console.error("Documents fetch error:", error)
    return NextResponse.json(
      { error: "Evraklar getirilirken hata oluştu" },
      { status: 500 }
    )
  }
}
