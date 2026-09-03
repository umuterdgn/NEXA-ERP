/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * This code is the property of NXA Software.
 */

import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get('projectId')

    const where = projectId ? { projectId } : {}

    const siteZones = await prisma.siteZone.findMany({
      where,
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json(siteZones)
  } catch (error) {
    console.error("Failed to fetch site zones:", error)
    return NextResponse.json(
      { error: "Alanlar getirilirken hata oluştu" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { projectId, title, category, latitude, longitude, radius } = body

    // Validate required fields
    if (!projectId || !title || !category || latitude === undefined || longitude === undefined || radius === undefined) {
      return NextResponse.json(
        { error: "Eksik alanlar var" },
        { status: 400 }
      )
    }

    // Validate category
    const validCategories = ['RISK', 'BUILDING', 'REST_AREA', 'STORAGE']
    if (!validCategories.includes(category)) {
      return NextResponse.json(
        { error: "Geçersiz kategori" },
        { status: 400 }
      )
    }

    const siteZone = await prisma.siteZone.create({
      data: {
        projectId,
        title,
        category,
        latitude,
        longitude,
        radius
      }
    })

    return NextResponse.json(siteZone, { status: 201 })
  } catch (error) {
    console.error("Failed to create site zone:", error)
    return NextResponse.json(
      { error: "Alan oluşturulurken hata oluştu" },
      { status: 500 }
    )
  }
}