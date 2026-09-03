/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * This code is the property of NXA Software.
 */

import { NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export async function GET() {
  try {
    const materials = await prisma.materialSubmittal.findMany({
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json(materials)
  } catch (error) {
    console.error("Failed to fetch materials:", error)
    return NextResponse.json(
      { error: "Failed to fetch materials" },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { materialName, brand, batchNumber, tseCertificate, inspectorName, notes } = body

    const material = await prisma.materialSubmittal.create({
      data: {
        materialName,
        brand,
        batchNumber,
        tseCertificate: tseCertificate || false,
        inspectorName,
        notes,
        status: "Onay Bekliyor"
      }
    })

    return NextResponse.json(material)
  } catch (error) {
    console.error("Failed to create material:", error)
    return NextResponse.json(
      { error: "Failed to create material" },
      { status: 500 }
    )
  }
}
