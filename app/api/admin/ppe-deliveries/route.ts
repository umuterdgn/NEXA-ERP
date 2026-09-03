/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * This code is the property of NXA Software.
 */

import { NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

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
    const deliveries = await prisma.pPEDelivery.findMany({
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
        personelId
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
