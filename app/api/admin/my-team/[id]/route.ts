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

    // @ts-ignore - companyId field exists after schema update
    const personnel = await prisma.personel.update({
      where: { id: unwrappedParams.id },
      data: body
    })

    return NextResponse.json(personnel)
  } catch (error) {
    console.error("Failed to update personnel:", error)
    return NextResponse.json(
      { error: "Personel güncellenirken hata oluştu" },
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

    // @ts-ignore - companyId field exists after schema update
    await prisma.personel.delete({
      where: { id: unwrappedParams.id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Failed to delete personnel:", error)
    return NextResponse.json(
      { error: "Personel silinirken hata oluştu" },
      { status: 500 }
    )
  }
}
