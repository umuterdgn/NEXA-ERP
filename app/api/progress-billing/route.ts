/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * This code is the property of NXA Software.
 */

import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    const userRole = session?.user?.role
    const isSuperAdmin = userRole === "SUPER_ADMIN"
    const tenantId = (session?.user as any)?.tenantId as string | undefined

    if (!session?.user || (!tenantId && !isSuperAdmin)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { contractId, billingNumber, period, grossAmount, advanceDeduction, penaltyDeduction, retentionDeduction, status } = body

    // Net ödenecek tutarı hesapla
    const netPayable = grossAmount - (advanceDeduction || 0) - (penaltyDeduction || 0) - (retentionDeduction || 0)

    // Hakedişi oluştur
    const billing = await prisma.progressBilling.create({
      data: {
        contractId,
        billingNumber: parseInt(billingNumber),
        period: new Date(period),
        grossAmount: parseFloat(grossAmount),
        advanceDeduction: parseFloat(advanceDeduction || 0),
        penaltyDeduction: parseFloat(penaltyDeduction || 0),
        retentionDeduction: parseFloat(retentionDeduction || 0),
        netPayable,
        status: status || 'DRAFT',
        tenantId: tenantId || null,
      },
      include: {
        contract: {
          include: {
            project: {
              select: {
                id: true,
                name: true
              }
            },
            subcontractor: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      }
    })

    return NextResponse.json(billing)
  } catch (error) {
    console.error("Failed to create progress billing:", error)
    return NextResponse.json({ error: "Failed to create billing" }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    const userRole = session?.user?.role
    const isSuperAdmin = userRole === "SUPER_ADMIN"
    const tenantId = (session?.user as any)?.tenantId as string | undefined

    if (!session?.user || (!tenantId && !isSuperAdmin)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const contractId = searchParams.get("contractId")

    const where: any = !isSuperAdmin ? (tenantId ? { tenantId } : { tenantId: "non-existent" }) : {}
    if (contractId) where.contractId = contractId

    const billings = await prisma.progressBilling.findMany({
      where,
      include: {
        contract: {
          include: {
            project: {
              select: {
                id: true,
                name: true
              }
            },
            subcontractor: {
              select: {
                id: true,
                name: true,
                taxNumber: true,
                contactName: true,
                phone: true
              }
            }
          }
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
