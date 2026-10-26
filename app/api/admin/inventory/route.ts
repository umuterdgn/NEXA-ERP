/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * This code is the property of NXA Software.
 */

import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

async function createInventoryHistory(inventoryId: string, action: string, quantity?: number, description?: string, personnelId?: string, userId?: string, tenantId?: string | null) {
  try {
    await prisma.inventoryHistory.create({
      data: {
        inventoryId,
        action,
        quantity,
        description,
        personnelId,
        userId
      }
    })
  } catch (error) {
    console.error("Error creating inventory history:", error)
  }
}

export async function GET() {
  try {
    const session = await auth()
    const userRole = session?.user?.role as string
    const isSuperAdmin = userRole === "SUPER_ADMIN"
    const tenantId = (session?.user as any)?.tenantId as string | undefined

    if (!session?.user || (!tenantId && !isSuperAdmin)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (userRole !== "SUPER_ADMIN" && userRole !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden - Insufficient permissions" }, { status: 403 })
    }

    const whereClause: any = !isSuperAdmin ? (tenantId ? { tenantId } : { tenantId: "non-existent" }) : {}

    const inventory = await prisma.inventory.findMany({
      where: whereClause,
      include: {
        project: true,
        assignments: {
          where: { returnedAt: null },
          include: {
            personel: true
          }
        }
      },
      orderBy: { name: 'asc' }
    })
    return NextResponse.json(inventory)
  } catch (error) {
    console.error("Error fetching inventory:", error)
    return NextResponse.json({ error: "Stok bilgileri getirilirken hata oluştu" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth()
    const userRole = session?.user?.role as string
    const isSuperAdmin = userRole === "SUPER_ADMIN"
    const tenantId = (session?.user as any)?.tenantId as string | undefined

    if (!session?.user || (!tenantId && !isSuperAdmin)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (userRole !== "SUPER_ADMIN" && userRole !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden - Insufficient permissions" }, { status: 403 })
    }

    const body = await request.json()
    const { name, category, quantity, unit, location, projectId, recordedBy } = body

    const tenantFilter: any = !isSuperAdmin ? (tenantId ? { tenantId } : { tenantId: "non-existent" }) : {}

    // Get a valid project ID
    const project = await prisma.project.findFirst({ where: tenantFilter })
    const validProjectId = projectId || project?.id || "default"

    const validRecordedBy = recordedBy || session.user.id

    const item = await prisma.inventory.create({
      data: {
        name,
        type: "IN",
        category,
        quantity: parseFloat(quantity),
        unit,
        location,
        projectId: validProjectId,
        recordedBy: validRecordedBy,
        tenantId: tenantId || null,
      }
    })

    // Create history record
    await createInventoryHistory(
      item.id,
      "CREATED",
      parseFloat(quantity),
      `Malzeme oluşturuldu: ${name}`,
      undefined,
      validRecordedBy,
      tenantId
    )

    return NextResponse.json(item)
  } catch (error) {
    console.error("Error creating inventory item:", error)
    return NextResponse.json({ error: "Malzeme eklenirken hata oluştu" }, { status: 500 })
  }
}
