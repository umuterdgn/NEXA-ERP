/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * This code is the property of NXA Software.
 */

import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { projectId, subcontractorId, periodMonth, periodYear, totalAmount, notes } = body

    // İlgili taşeron ve projeye ait, henüz hakedişe yansıtılmamış kesintileri çek
    const pendingDeductions = await prisma.deduction.findMany({
      where: {
        subcontractorId,
        projectId: projectId || null,
        appliedToBillingId: null,
      },
    })

    // Toplam kesinti tutarını hesapla
    const totalDeductions = pendingDeductions.reduce((sum, d) => sum + d.amount, 0)

    // Net ödenecek tutarı hesapla
    const netAmount = totalAmount - totalDeductions

    // Hakedişi oluştur
    const billing = await prisma.progressBilling.create({
      data: {
        projectId,
        subcontractorId,
        periodMonth,
        periodYear,
        totalAmount,
        netAmount,
        notes,
        status: "DRAFT"
      }
    })

    // İşleme alınan kesintilerin appliedToBillingId alanını güncelle
    if (pendingDeductions.length > 0) {
      await prisma.deduction.updateMany({
        where: {
          id: {
            in: pendingDeductions.map(d => d.id),
          },
        },
        data: {
          appliedToBillingId: billing.id,
        },
      })
    }

    return NextResponse.json(billing)
  } catch (error) {
    console.error("Failed to create progress billing:", error)
    return NextResponse.json({ error: "Failed to create billing" }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get("projectId")
    const subcontractorId = searchParams.get("subcontractorId")

    const where: any = {}
    if (projectId) where.projectId = projectId
    if (subcontractorId) where.subcontractorId = subcontractorId

    const billings = await prisma.progressBilling.findMany({
      where,
      include: {
        project: {
          select: { name: true }
        },
        subcontractor: {
          select: { name: true }
        }
      },
      orderBy: { createdAt: "desc" }
    })

    return NextResponse.json(billings)
  } catch (error) {
    console.error("Failed to fetch progress billings:", error)
    return NextResponse.json({ error: "Failed to fetch billings" }, { status: 500 })
  }
}
