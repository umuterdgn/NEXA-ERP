/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * This code is the property of NXA Software.
 */

import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Check if media exists
    const existingMedia = await prisma.droneMedia.findUnique({
      where: { id }
    })

    if (!existingMedia) {
      return NextResponse.json(
        { error: "Drone medyası bulunamadı" },
        { status: 404 }
      )
    }

    // Delete the media
    await prisma.droneMedia.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting drone media:", error)
    return NextResponse.json(
      { error: "Drone medyası silinirken hata oluştu" },
      { status: 500 }
    )
  }
}
