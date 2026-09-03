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
    const { name, category, url } = body

    const projectFile = await prisma.projectFile.update({
      where: { id: resolvedParams.id },
      data: {
        ...(name !== undefined && { name }),
        ...(category !== undefined && { category }),
        ...(url !== undefined && { url })
      }
    })

    return NextResponse.json(projectFile)
  } catch (error) {
    console.error("Error updating project file:", error)
    return NextResponse.json(
      { error: "Proje dosyası güncellenirken hata oluştu" },
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

    await prisma.projectFile.delete({
      where: { id: resolvedParams.id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting project file:", error)
    return NextResponse.json(
      { error: "Proje dosyası silinirken hata oluştu" },
      { status: 500 }
    )
  }
}
