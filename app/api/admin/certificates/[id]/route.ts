/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * This code is the property of NXA Software.
 */

import { NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { name, expiryDate, documentUrl, type } = body

    const certificate = await prisma.certificate.update({
      where: { id },
      data: {
        name,
        expiryDate: new Date(expiryDate),
        documentUrl: documentUrl || null,
        type: type || "SERTIFIKA"
      },
      include: {
        personel: {
          select: {
            id: true,
            name: true,
            personnelNo: true
          }
        }
      }
    })

    return NextResponse.json(certificate)
  } catch (error) {
    console.error("Failed to update certificate:", error)
    return NextResponse.json(
      { error: "Failed to update certificate" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    await prisma.certificate.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Failed to delete certificate:", error)
    return NextResponse.json(
      { error: "Failed to delete certificate" },
      { status: 500 }
    )
  }
}
