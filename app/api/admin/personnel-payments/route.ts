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
    const { personelId, type, amount, description, isPaid, paidDate } = body

    const payment = await prisma.personelPayment.create({
      data: {
        personelId,
        type,
        amount: parseFloat(amount),
        description,
        isPaid: isPaid || false,
        paidDate: paidDate ? new Date(paidDate) : null
      }
    })

    return NextResponse.json(payment)
  } catch (error) {
    console.error("Error creating personnel payment:", error)
    return NextResponse.json({ error: "Failed to create personnel payment" }, { status: 500 })
  }
}
