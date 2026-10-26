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
    const userRole = session?.user?.role
    const isSuperAdmin = userRole === "SUPER_ADMIN"
    const tenantId = (session?.user as any)?.tenantId as string | undefined

    if (!session?.user || (!tenantId && !isSuperAdmin)) {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 })
    }

    const body = await request.json()
    const { personelId, type, amount, description, isPaid, paidDate } = body

    const payment = await prisma.personelPayment.create({
      data: {
        personelId,
        type,
        amount: parseFloat(amount),
        description,
        isPaid: isPaid || false,
        paidDate: paidDate ? new Date(paidDate) : null,
        tenantId: tenantId || null,
      }
    })

    return NextResponse.json(payment)
  } catch (error) {
    console.error("Error creating personnel payment:", error)
    return NextResponse.json({ error: "Failed to create personnel payment" }, { status: 500 })
  }
}
