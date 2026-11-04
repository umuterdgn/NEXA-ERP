/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Franchise Taşeron Hakedişleri API Endpoint
 */

import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 })
    }

    const tenantId = (session.user as any)?.tenantId

    const billings = await prisma.progressBilling.findMany({
      where: tenantId ? { tenantId } : {},
      include: {
        contract: {
          include: {
            project: {
              select: { id: true, name: true, city: true },
            },
            subcontractor: {
              select: { id: true, name: true },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json({ success: true, billings })
  } catch (error: any) {
    console.error("[Franchise Progress Billing GET Error]:", error)
    return NextResponse.json(
      { error: error?.message || "Hakedişler alınırken hata oluştu" },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 })
    }

    const tenantId = (session.user as any)?.tenantId
    const body = await request.json()

    const {
      contractId,
      billingNumber,
      period,
      progressPercentage = 25,
      grossAmount,
      advanceDeduction = 0,
      penaltyDeduction = 0,
      retentionDeduction = 0,
    } = body

    const numericGross = parseFloat(grossAmount) || 0
    const numericAdvance = parseFloat(advanceDeduction) || 0
    const numericPenalty = parseFloat(penaltyDeduction) || 0
    const numericRetention = parseFloat(retentionDeduction) || (numericGross * 0.05)
    const numericNet = Math.max(
      0,
      numericGross - numericAdvance - numericPenalty - numericRetention
    )

    // Contract bul veya varsayılan contract
    let targetContractId = contractId
    if (!targetContractId) {
      const defaultContract = await prisma.contract.findFirst({
        where: tenantId ? { tenantId } : {},
        select: { id: true },
      })
      targetContractId = defaultContract?.id
    }

    // Parse billingNumber
    const parsedBillingNum = parseInt(billingNumber) || Math.floor(Math.random() * 90) + 10

    const newBilling = await prisma.progressBilling.create({
      data: {
        contractId: targetContractId || null,
        billingNumber: parsedBillingNum,
        period: period ? new Date(period) : new Date(),
        grossAmount: numericGross,
        advanceDeduction: numericAdvance,
        penaltyDeduction: numericPenalty,
        retentionDeduction: numericRetention,
        netPayable: numericNet,
        status: "APPROVED",
        tenantId: tenantId || null,
      },
      include: {
        contract: {
          include: {
            project: { select: { id: true, name: true, city: true } },
            subcontractor: { select: { id: true, name: true } },
          },
        },
      },
    })

    console.log(
      `[Franchise Billing Created] 💰 Hakediş No: HK-${newBilling.billingNumber} - Brüt: ${numericGross} - Net: ${numericNet} ₺`
    )

    return NextResponse.json({
      success: true,
      message: "Taşeron hakedişi kesintiler ve net tutarla başarıyla oluşturuldu.",
      billing: {
        ...newBilling,
        progressPercentage,
      },
    })
  } catch (error: any) {
    console.error("[Franchise Progress Billing POST Error]:", error)
    return NextResponse.json(
      { error: error?.message || "Hakediş kaydedilemedi" },
      { status: 500 }
    )
  }
}
