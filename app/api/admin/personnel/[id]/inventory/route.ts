/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * This code is the property of NXA Software.
 */

import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params
    
    const personel = await prisma.personel.findUnique({
      where: { id: resolvedParams.id }
    })

    if (!personel) {
      return NextResponse.json({ error: "Personel not found" }, { status: 404 })
    }

    // For personnel, use InventoryAssignment relation
    const assignedInventory = await prisma.inventoryAssignment.findMany({
      where: {
        personelId: resolvedParams.id
      },
      include: {
        inventory: true
      },
      orderBy: { assignedAt: "desc" }
    })

    return NextResponse.json(assignedInventory)
  } catch (error) {
    console.error("Error fetching assigned inventory:", error)
    return NextResponse.json({ error: "Failed to fetch assigned inventory" }, { status: 500 })
  }
}
