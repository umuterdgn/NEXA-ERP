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
    const history = await prisma.inventoryHistory.findMany({
      where: { inventoryId: resolvedParams.id },
      include: {
        personnel: true
      },
      orderBy: { createdAt: "desc" }
    })

    return NextResponse.json(history)
  } catch (error) {
    console.error("Error fetching inventory history:", error)
    return NextResponse.json({ error: "Failed to fetch inventory history" }, { status: 500 })
  }
}
