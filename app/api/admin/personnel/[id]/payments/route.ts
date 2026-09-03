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
    const payments = await prisma.personelPayment.findMany({
      where: { personelId: resolvedParams.id },
      orderBy: { date: "desc" }
    })

    return NextResponse.json(payments)
  } catch (error) {
    console.error("Error fetching personnel payments:", error)
    return NextResponse.json({ error: "Failed to fetch personnel payments" }, { status: 500 })
  }
}
