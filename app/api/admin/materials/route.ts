/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * This code is the property of NXA Software.
 */

import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const isSuperAdmin = session.user.role === "SUPER_ADMIN"
    const tenantId = (session.user as any)?.tenantId

    const where: any = {}
    if (!isSuperAdmin) {
      where.tenantId = tenantId || "non-existent"
    }

    const materials = await prisma.materialSubmittal.findMany({
      where,
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
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const tenantId = (session.user as any)?.tenantId
    const body = await request.json()
    const { materialName, brand, batchNumber, tseCertificate, inspectorName, notes } = body

    const material = await prisma.materialSubmittal.create({
      data: {
        materialName,
        brand,
        batchNumber,
        tseCertificate: tseCertificate || false,
        inspectorName: inspectorName || session.user.name,
        notes,
        status: "Onay Bekliyor",
        tenantId: tenantId || null
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
