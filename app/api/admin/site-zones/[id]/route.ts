/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * This code is the property of NXA Software.
 */

import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params
    const body = await request.json()
    const { title, category, latitude, longitude, radius } = body

    // Validate category if provided
    if (category) {
      const validCategories = ['RISK', 'BUILDING', 'REST_AREA', 'STORAGE']
      if (!validCategories.includes(category)) {
        return NextResponse.json(
          { error: "Geçersiz kategori" },
          { status: 400 }
        )
      }
    }

    const siteZone = await prisma.siteZone.update({
      where: { id: resolvedParams.id },
      data: {
        ...(title !== undefined && { title }),
        ...(category !== undefined && { category }),
        ...(latitude !== undefined && { latitude }),
        ...(longitude !== undefined && { longitude }),
        ...(radius !== undefined && { radius })
      }
    })

    return NextResponse.json(siteZone)
  } catch (error) {
    console.error("Failed to update site zone:", error)
    return NextResponse.json(
      { error: "Alan güncellenirken hata oluştu" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params

    await prisma.siteZone.delete({
      where: { id: resolvedParams.id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Failed to delete site zone:", error)
    return NextResponse.json(
      { error: "Alan silinirken hata oluştu" },
      { status: 500 }
    )
  }
}