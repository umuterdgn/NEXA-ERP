/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * This code is the property of NXA Software.
 */

import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// DELETE - Meslek sil
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Check if profession has any personnel assigned
    const personelCount = await prisma.personel.count({
      where: { professionId: id }
    })

    if (personelCount > 0) {
      return NextResponse.json(
        { error: "Bu mesleğe atanmış personel var. Önce personeli güncelleyin." },
        { status: 400 }
      )
    }

    await prisma.profession.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting profession:", error)
    return NextResponse.json(
      { error: "Meslek silinirken hata oluştu" },
      { status: 500 }
    )
  }
}
