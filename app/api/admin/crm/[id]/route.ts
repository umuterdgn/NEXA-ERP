/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * This code is the property of NXA Software.
 */

import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params
    
    const company = await prisma.company.findUnique({
      where: { id: resolvedParams.id }
    })
    
    if (!company) {
      return NextResponse.json({ error: "Firma bulunamadı" }, { status: 404 })
    }
    
    return NextResponse.json(company)
  } catch (error) {
    console.error("Error fetching company:", error)
    return NextResponse.json(
      { error: "Firma getirilirken hata oluştu" },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params
    const body = await request.json()
    const { name, type, contactName, phone, email, taxNumber, taxOffice } = body

    const company = await prisma.company.update({
      where: { id: resolvedParams.id },
      data: {
        name: name || undefined,
        type: type || undefined,
        contactName: contactName || undefined,
        phone: phone || undefined,
        email: email || undefined,
        taxNumber: taxNumber || undefined,
        taxOffice: taxOffice || undefined
      }
    })

    return NextResponse.json(company)
  } catch (error) {
    console.error("Error updating company:", error)
    return NextResponse.json(
      { error: "Firma güncellenirken hata oluştu" },
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
    
    await prisma.company.delete({
      where: { id: resolvedParams.id }
    })
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting company:", error)
    return NextResponse.json(
      { error: "Firma silinirken hata oluştu" },
      { status: 500 }
    )
  }
}
