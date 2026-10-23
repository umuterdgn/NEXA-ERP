/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Equipment Fuel & Maintenance API
 */

import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const equipmentId = searchParams.get("equipmentId")

    const where: any = {}
    if (equipmentId) where.equipmentId = equipmentId

    const records = await prisma.equipmentFuelRecord.findMany({
      where,
      orderBy: { date: "desc" },
    })

    return NextResponse.json(records)
  } catch (error: any) {
    console.error("Equipment Fuel GET Error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { equipmentId, liters, cost, odometer, date } = body

    if (!equipmentId || liters === undefined || cost === undefined || odometer === undefined) {
      return NextResponse.json({ error: "Eksik bilgi" }, { status: 400 })
    }

    const record = await prisma.equipmentFuelRecord.create({
      data: {
        equipmentId,
        liters: parseFloat(liters),
        cost: parseFloat(cost),
        odometer: parseInt(odometer, 10),
        date: date ? new Date(date) : new Date(),
      },
    })

    return NextResponse.json(record, { status: 201 })
  } catch (error: any) {
    console.error("Equipment Fuel POST Error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
