/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Equipment Maintenance API
 */

import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const equipmentId = searchParams.get("equipmentId")

    const where: any = {}
    if (equipmentId) where.equipmentId = equipmentId

    const records = await prisma.equipmentMaintenance.findMany({
      where,
      orderBy: { nextDueDate: "asc" },
    })

    return NextResponse.json(records)
  } catch (error: any) {
    console.error("Equipment Maintenance GET Error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { equipmentId, maintenanceType, cost, nextDueDate, isCompleted } = body

    if (!equipmentId || !maintenanceType || cost === undefined || !nextDueDate) {
      return NextResponse.json({ error: "Eksik bilgi" }, { status: 400 })
    }

    const record = await prisma.equipmentMaintenance.create({
      data: {
        equipmentId,
        maintenanceType,
        cost: parseFloat(cost),
        nextDueDate: new Date(nextDueDate),
        isCompleted: isCompleted || false,
      },
    })

    return NextResponse.json(record, { status: 201 })
  } catch (error: any) {
    console.error("Equipment Maintenance POST Error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
