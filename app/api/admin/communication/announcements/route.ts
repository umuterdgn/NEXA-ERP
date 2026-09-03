/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * This code is the property of NXA Software.
 */

import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get('projectId')
    const severity = searchParams.get('severity')

    const where: any = {}

    if (projectId) {
      where.projectId = projectId
    } else {
      // If no projectId specified, get company-wide announcements (projectId is null)
      where.projectId = null
    }

    if (severity) {
      where.severity = severity
    }

    const announcements = await prisma.announcement.findMany({
      where,
      include: {
        project: {
          select: {
            id: true,
            title: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json(announcements)
  } catch (error) {
    console.error("Error fetching announcements:", error)
    return NextResponse.json(
      { error: "Duyurular getirilirken hata oluştu" },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { title, content, severity, projectId } = body

    // Validate required fields
    if (!title || !content) {
      return NextResponse.json(
        { error: "title and content are required" },
        { status: 400 }
      )
    }

    // Validate severity
    if (severity && severity !== "INFO" && severity !== "WARNING" && severity !== "URGENT") {
      return NextResponse.json(
        { error: "severity must be either 'INFO', 'WARNING', or 'URGENT'" },
        { status: 400 }
      )
    }

    const announcement = await prisma.announcement.create({
      data: {
        title,
        content,
        severity: severity || "INFO",
        projectId: projectId || null
      },
      include: {
        project: {
          select: {
            id: true,
            title: true
          }
        }
      }
    })

    return NextResponse.json(announcement, { status: 201 })
  } catch (error) {
    console.error("Error creating announcement:", error)
    return NextResponse.json(
      { error: "Duyuru oluşturulurken hata oluştu" },
      { status: 500 }
    )
  }
}
