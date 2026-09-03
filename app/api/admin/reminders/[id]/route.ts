/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * This code is the property of NXA Software.
 */

import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params
    const body = await request.json()
    const { isCompleted, title, date } = body

    const reminder = await prisma.reminder.update({
      where: { id: resolvedParams.id },
      data: {
        ...(isCompleted !== undefined && { isCompleted }),
        ...(title !== undefined && { title }),
        ...(date !== undefined && { date: new Date(date) })
      }
    })

    return NextResponse.json(reminder)
  } catch (error) {
    console.error("Error updating reminder:", error)
    return NextResponse.json(
      { error: "Hatırlatıcı güncellenirken hata oluştu" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params

    await prisma.reminder.delete({
      where: { id: resolvedParams.id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting reminder:", error)
    return NextResponse.json(
      { error: "Hatırlatıcı silinirken hata oluştu" },
      { status: 500 }
    )
  }
}
