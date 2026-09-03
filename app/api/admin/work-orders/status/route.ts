/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * This code is the property of NXA Software.
 */

import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { id, status } = body

    const workOrder = await prisma.workOrder.update({
      where: { id },
      data: { status }
    })

    return NextResponse.json({ success: true, workOrder })
  } catch (error) {
    console.error("Update work order status error:", error)
    return NextResponse.json({ success: false, error: "Durum güncellenemedi" }, { status: 500 })
  }
}
