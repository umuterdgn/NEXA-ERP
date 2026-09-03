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
    const { supplierId, amount, description } = body

    const debt = await prisma.debt.create({
      data: {
        cariId: supplierId,
        amount,
        description,
        date: new Date()
      }
    })

    return NextResponse.json(debt)
  } catch (error) {
    console.error("Debt create error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
