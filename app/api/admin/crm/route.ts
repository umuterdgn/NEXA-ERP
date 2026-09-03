/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * This code is the property of NXA Software.
 */

import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const companies = await prisma.company.findMany({
      orderBy: {
        createdAt: 'desc'
      }
    })
    return NextResponse.json(companies)
  } catch (error) {
    console.error("Error fetching companies:", error)
    // Return empty array instead of 500 error to prevent UI crash
    return NextResponse.json([])
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, type, contactName, phone, email, taxNumber, taxOffice } = body

    if (!name || !type) {
      return NextResponse.json(
        { error: "Firma adı ve tipi zorunludur" },
        { status: 400 }
      )
    }

    const company = await prisma.company.create({
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

    return NextResponse.json(company, { status: 201 })
  } catch (error) {
    console.error("Error creating company:", error)
    return NextResponse.json(
      { error: "Firma oluşturulurken hata oluştu" },
      { status: 500 }
    )
  }
}
