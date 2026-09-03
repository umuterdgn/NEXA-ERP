/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * This code is the property of NXA Software.
 */

import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { stockId, type, quantity, note } = body

    const transaction = await (prisma as any).stockTransaction.create({
      data: {
        stockId,
        type,
        quantity,
        note
      }
    })

    return NextResponse.json(transaction)
  } catch (error) {
    console.error("Stock transaction error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}