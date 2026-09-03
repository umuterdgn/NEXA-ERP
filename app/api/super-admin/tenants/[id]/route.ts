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
    const unwrappedParams = await params
    const body = await request.json()
    
    // @ts-ignore - Tenant model exists after schema update
    const tenant = await prisma.tenant.update({
      where: { id: unwrappedParams.id },
      data: {
        name: body.name,
        domain: body.domain || null,
        isActive: body.isActive
      }
    })

    return NextResponse.json(tenant)
  } catch (error) {
    console.error("Failed to update tenant:", error)
    return NextResponse.json(
      { error: "Kiracı güncellenirken hata oluştu" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const unwrappedParams = await params
    
    // @ts-ignore - Tenant model exists after schema update
    await prisma.tenant.delete({
      where: { id: unwrappedParams.id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Failed to delete tenant:", error)
    return NextResponse.json(
      { error: "Kiracı silinirken hata oluştu" },
      { status: 500 }
    )
  }
}
