/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * This code is the property of NXA Software.
 */

import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const companies = await prisma.company.findMany({
      orderBy: { createdAt: "desc" }
    })

    // Count personnel for each company
    const companiesWithCounts = await Promise.all(
      companies.map(async (company) => {
        // @ts-ignore - companyId field exists after schema update
        const personnelCount = await prisma.personel.count({
          where: { companyId: company.id }
        })
        return {
          ...company,
          _count: { personnel: personnelCount }
        }
      })
    )

    return NextResponse.json(companiesWithCounts)
  } catch (error) {
    console.error("Failed to fetch companies:", error)
    return NextResponse.json(
      { error: "Firmalar yüklenirken hata oluştu" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, type, contactName, phone, email, taxNumber, taxOffice } = body

    if (!name) {
      return NextResponse.json(
        { error: "Firma adı zorunludur" },
        { status: 400 }
      )
    }

    const company = await prisma.company.create({
      data: {
        name,
        type: type || "SUBCONTRACTOR",
        contactName,
        phone,
        email,
        taxNumber,
        taxOffice
      }
    })

    return NextResponse.json(company, { status: 201 })
  } catch (error) {
    console.error("Failed to create company:", error)
    return NextResponse.json(
      { error: "Firma oluşturulurken hata oluştu" },
      { status: 500 }
    )
  }
}
