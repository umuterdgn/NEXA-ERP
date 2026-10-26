/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * This code is the property of NXA Software.
 */

import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

export async function GET(request: Request) {
  try {
    const session = await auth()
    const userRole = session?.user?.role as string
    const isSuperAdmin = userRole === "SUPER_ADMIN"
    const tenantId = (session?.user as any)?.tenantId as string | undefined

    if (!session?.user || (!tenantId && !isSuperAdmin)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get('projectId')
    const mediaType = searchParams.get('mediaType')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    const where: any = !isSuperAdmin ? (tenantId ? { tenantId } : { tenantId: "non-existent" }) : {}

    if (projectId) {
      where.projectId = projectId
    }

    if (mediaType) {
      where.mediaType = mediaType
    }

    if (startDate || endDate) {
      where.date = {}
      if (startDate) {
        where.date.gte = new Date(startDate)
      }
      if (endDate) {
        where.date.lte = new Date(endDate)
      }
    }

    const droneMedia = await prisma.droneMedia.findMany({
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
        date: 'desc'
      }
    })

    return NextResponse.json(droneMedia)
  } catch (error) {
    console.error("Error fetching drone media:", error)
    return NextResponse.json(
      { error: "Drone medyaları getirilirken hata oluştu" },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth()
    const userRole = session?.user?.role as string
    const isSuperAdmin = userRole === "SUPER_ADMIN"
    const tenantId = (session?.user as any)?.tenantId as string | undefined

    if (!session?.user || (!tenantId && !isSuperAdmin)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { title, url, mediaType, date, projectId, description } = body

    // Validate required fields
    if (!title || !url || !mediaType || !date || !projectId) {
      return NextResponse.json(
        { error: "title, url, mediaType, date, and projectId are required" },
        { status: 400 }
      )
    }

    // Validate mediaType
    if (mediaType !== "IMAGE" && mediaType !== "VIDEO") {
      return NextResponse.json(
        { error: "mediaType must be either 'IMAGE' or 'VIDEO'" },
        { status: 400 }
      )
    }

    const droneMedia = await prisma.droneMedia.create({
      data: {
        title,
        url,
        mediaType,
        date: new Date(date),
        projectId,
        description: description || null,
        tenantId: tenantId || null,
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

    return NextResponse.json(droneMedia, { status: 201 })
  } catch (error) {
    console.error("Error creating drone media:", error)
    return NextResponse.json(
      { error: "Drone medyası oluşturulurken hata oluştu" },
      { status: 500 }
    )
  }
}
