/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Progress Payments / Billings API
 */

import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

export async function GET() {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const billings = await prisma.progressBilling.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        contract: {
          include: {
            subcontractor: true,
            project: true,
          },
        },
      },
    })

    const formatted = billings.map((b) => ({
      id: b.id,
      billingNumber: b.billingNumber,
      subcontractor: b.contract?.subcontractor?.name || "Taşeron Firma",
      projectName: b.contract?.project?.name || b.contract?.project?.title || "Genel Proje",
      grossAmount: b.grossAmount,
      totalAmount: b.netPayable > 0 ? b.netPayable : b.grossAmount,
      netPayable: b.netPayable,
      status: b.status,
      period: b.period,
      createdAt: b.createdAt,
    }))

    return NextResponse.json(formatted)
  } catch (error: any) {
    console.error("Progress Payments GET Error:", error)
    return NextResponse.json({ error: error.message || "Failed to fetch progress payments" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { contractId, billingNumber, grossAmount, advanceDeduction, penaltyDeduction, retentionDeduction, netPayable, status } = body

    const newBilling = await prisma.progressBilling.create({
      data: {
        contractId: contractId || null,
        billingNumber: billingNumber ? parseInt(billingNumber) : 1,
        grossAmount: grossAmount ? parseFloat(grossAmount) : 0,
        advanceDeduction: advanceDeduction ? parseFloat(advanceDeduction) : 0,
        penaltyDeduction: penaltyDeduction ? parseFloat(penaltyDeduction) : 0,
        retentionDeduction: retentionDeduction ? parseFloat(retentionDeduction) : 0,
        netPayable: netPayable ? parseFloat(netPayable) : (parseFloat(grossAmount || "0")),
        status: status || "DRAFT",
      },
      include: {
        contract: {
          include: {
            subcontractor: true,
            project: true,
          },
        },
      },
    })

    return NextResponse.json(newBilling, { status: 201 })
  } catch (error: any) {
    console.error("Progress Payments POST Error:", error)
    return NextResponse.json({ error: error.message || "Failed to create progress payment" }, { status: 500 })
  }
}