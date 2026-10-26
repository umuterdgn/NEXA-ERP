/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * This code is the property of NXA Software.
 */

import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

// Safe JSON parse function
function safeParseJSON(val: any) {
  try {
    return JSON.parse(val)
  } catch {
    return val
  }
}

export async function GET() {
  try {
    const session = await auth()
    const userRole = session?.user?.role
    const isSuperAdmin = userRole === "SUPER_ADMIN"
    const tenantId = (session?.user as any)?.tenantId as string | undefined

    if (!session?.user || (!tenantId && !isSuperAdmin)) {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 })
    }

    const whereClause: any = !isSuperAdmin ? (tenantId ? { tenantId } : { tenantId: "non-existent" }) : {}

    const deliveries = await prisma.pPEDelivery.findMany({
      where: whereClause,
      include: {
        personel: {
          select: {
            id: true,
            name: true,
            personnelNo: true,
            department: true
          }
        }
      },
      orderBy: {
        date: 'desc'
      }
    })

    // Parse equipment JSON safely
    const deliveriesWithParsedEquipment = deliveries.map(delivery => ({
      ...delivery,
      equipment: safeParseJSON(delivery.equipment)
    }))

    return NextResponse.json(deliveriesWithParsedEquipment)
  } catch (error) {
    console.error("Failed to fetch PPE deliveries:", error)
    return NextResponse.json(
      { error: "Failed to fetch PPE deliveries" },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth()
    const userRole = session?.user?.role
    const isSuperAdmin = userRole === "SUPER_ADMIN"
    const tenantId = (session?.user as any)?.tenantId as string | undefined

    if (!session?.user || (!tenantId && !isSuperAdmin)) {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 })
    }

    const body = await request.json()
    const { equipment, signature, personelId } = body
    const normalizedEquipment = Array.isArray(equipment)
      ? equipment
      : typeof equipment === 'string'
        ? equipment.split(',').map((item: string) => item.trim()).filter(Boolean)
        : []

    const delivery = await prisma.pPEDelivery.create({
      data: {
        equipment: JSON.stringify(normalizedEquipment),
        signature,
        personelId,
        tenantId: tenantId || null,
      },
      include: {
        personel: {
          select: {
            id: true,
            name: true,
            personnelNo: true,
            department: true
          }
        }
      }
    })

    return NextResponse.json({
      ...delivery,
      equipment: safeParseJSON(delivery.equipment)
    })
  } catch (error) {
    console.error("Failed to create PPE delivery:", error)
    return NextResponse.json(
      { error: "Failed to create PPE delivery" },
      { status: 500 }
    )
  }
}
