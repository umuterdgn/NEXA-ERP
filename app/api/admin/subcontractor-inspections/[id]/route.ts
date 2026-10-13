/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Admin Subcontractor Inspection Status Update API
 */

import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export const dynamic = 'force-dynamic'

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    const body = await request.json()
    const { status } = body

    if (!status || !["PENDING", "APPROVED", "REJECTED"].includes(status)) {
      return NextResponse.json({ error: "Geçersiz durum değeri" }, { status: 400 })
    }

    const updatedProof = await prisma.workProof.update({
      where: { id },
      data: { status },
      include: {
        contract: {
          select: { id: true, title: true }
        },
        subcontractor: {
          select: { id: true, name: true }
        }
      }
    })

    return NextResponse.json({ success: true, proof: updatedProof })
  } catch (error) {
    console.error("Update proof status error:", error)
    return NextResponse.json(
      { error: "Kanıt durumu güncellenirken hata oluştu" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    await prisma.workProof.delete({
      where: { id }
    })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Delete proof error:", error)
    return NextResponse.json({ error: "Kanıt silinemedi" }, { status: 500 })
  }
}
