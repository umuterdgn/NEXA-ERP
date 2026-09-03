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
    const { name, type, contactName, phone, email, taxNumber, taxOffice } = body

    const company = await prisma.company.update({
      where: { id: unwrappedParams.id },
      data: {
        name,
        type,
        contactName,
        phone,
        email,
        taxNumber,
        taxOffice
      }
    })

    return NextResponse.json(company)
  } catch (error) {
    console.error("Failed to update company:", error)
    return NextResponse.json(
      { error: "Firma güncellenirken hata oluştu" },
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

    await prisma.company.delete({
      where: { id: unwrappedParams.id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Failed to delete company:", error)
    return NextResponse.json(
      { error: "Firma silinirken hata oluştu" },
      { status: 500 }
    )
  }
}
