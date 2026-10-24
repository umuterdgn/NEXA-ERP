"use server"

/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Finans Modülü - Gerçek Prisma Hakediş Sorguları
 */

import { prisma } from "@/lib/prisma"

export async function getProgressBillingsData() {
  try {
    const billings = await prisma.progressBilling.findMany({
      take: 20,
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

    return billings.map((b) => ({
      id: b.id,
      billingNumber: b.billingNumber,
      subcontractor: b.contract?.subcontractor?.name || "Taşeron Firma",
      projectName: b.contract?.project?.name || b.contract?.project?.title || "Şantiye Projesi",
      grossAmount: b.grossAmount,
      advanceDeduction: b.advanceDeduction,
      penaltyDeduction: b.penaltyDeduction,
      retentionDeduction: b.retentionDeduction,
      netPayable: b.netPayable,
      status: b.status,
      period: b.period.toISOString(),
      createdAt: b.createdAt.toISOString(),
    }))
  } catch (error) {
    console.error("Error fetching progress billings from database:", error)
    return []
  }
}

export async function getRecentBillingMovements() {
  try {
    const billings = await prisma.progressBilling.findMany({
      take: 8,
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

    return billings.map((b) => ({
      id: b.id,
      projectName: b.contract?.project?.name || b.contract?.project?.title || "Şantiye Projesi",
      subcontractor: b.contract?.subcontractor?.name || "Taşeron Firma",
      amount: b.netPayable > 0 ? b.netPayable : b.grossAmount,
      billingNumber: b.billingNumber,
      status: b.status,
      date: b.createdAt.toISOString(),
    }))
  } catch (error) {
    console.error("Error fetching recent billing movements from database:", error)
    return []
  }
}
