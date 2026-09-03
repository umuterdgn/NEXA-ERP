/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * This code is the property of NXA Software.
 */

import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const companyId = searchParams.get("companyId")

    if (!companyId) {
      return NextResponse.json(
        { error: "Company ID gereklidir" },
        { status: 400 }
      )
    }

    // @ts-ignore - companyId field exists after schema update
    const personnel = await prisma.personel.findMany({
      where: { companyId },
      orderBy: { createdAt: "desc" }
    })

    return NextResponse.json(personnel)
  } catch (error) {
    console.error("Failed to fetch personnel:", error)
    return NextResponse.json(
      { error: "Personel listesi yüklenirken hata oluştu" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { companyId, ...personnelData } = body

    // @ts-ignore - companyId field exists after schema update
    const personnel = await prisma.personel.create({
      data: {
        ...personnelData,
        companyId // Will be validated/forced by frontend
      }
    })

    return NextResponse.json(personnel, { status: 201 })
  } catch (error) {
    console.error("Failed to create personnel:", error)
    return NextResponse.json(
      { error: "Personel oluşturulurken hata oluştu" },
      { status: 500 }
    )
  }
}
