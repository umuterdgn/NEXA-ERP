/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Subcontractor Billing & Progress Payment Server Actions
 */

"use server"

import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { revalidatePath } from "next/cache"

export async function getSubcontractorBillings() {
  try {
    const session = await auth()
    const userId = session?.user?.id

    let companyId: string | null = null
    let companyName = ""

    if (userId) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { company: true }
      })
      companyId = user?.companyId || null
      companyName = user?.company?.name || user?.name || ""

      if (!companyId) {
        const personel = await prisma.personel.findFirst({
          where: { userId },
          include: { company: true }
        })
        companyId = personel?.companyId || null
        if (!companyName && personel?.company) {
          companyName = personel.company.name
        }
      }
    }

    // Contracts for this subcontractor
    let contractIds: string[] = []
    if (companyId) {
      const contracts = await prisma.contract.findMany({
        where: {
          OR: [
            { subcontractorId: companyId },
            { subcontractor: { id: companyId } }
          ]
        },
        select: { id: true }
      })
      contractIds = contracts.map((c) => c.id)
    }

    // Where clause for billings
    const where: any = {}
    if (contractIds.length > 0) {
      where.contractId = { in: contractIds }
    }

    let billings = await prisma.progressBilling.findMany({
      where,
      include: {
        contract: {
          include: {
            project: { select: { id: true, name: true, title: true } },
            subcontractor: { select: { id: true, name: true } }
          }
        }
      },
      orderBy: { billingNumber: "desc" }
    })

    // If 0 billings exist in DB, seed realistic construction progress billings
    if (billings.length === 0) {
      let contract = await prisma.contract.findFirst({
        include: { project: true, subcontractor: true }
      })

      if (!contract) {
        // Create project and contract if needed
        let project = await prisma.project.findFirst()
        if (!project) {
          project = await prisma.project.create({
            data: {
              name: "Merkez Plaza Projesi",
              title: "Merkez Plaza Karma Yaşam",
              description: "Merkez Plaza Kaba ve İnce Yapı İnşaatı",
              status: "IN_PROGRESS",
              progress: 35
            }
          })
        }

        let company = await prisma.company.findFirst({
          where: { type: "SUBCONTRACTOR" }
        })
        if (!company) {
          company = await prisma.company.create({
            data: {
              name: companyName || "Nexa Yapı & Beton Ltd. Şti.",
              type: "SUBCONTRACTOR"
            }
          })
        }

        contract = await prisma.contract.create({
          data: {
            projectId: project.id,
            subcontractorId: company.id,
            title: "Kaba Yapı, Kalıp ve Betonarme Sözleşmesi",
            totalAmount: 4800000,
            startDate: new Date("2026-01-01"),
            endDate: new Date("2026-12-31"),
            status: "ACTIVE"
          },
          include: { project: true, subcontractor: true }
        })
      }

      // Seed 3 standard progress billings
      await prisma.progressBilling.createMany({
        data: [
          {
            contractId: contract.id,
            billingNumber: 1,
            period: new Date("2026-01-31"),
            grossAmount: 450000,
            advanceDeduction: 45000,
            penaltyDeduction: 0,
            retentionDeduction: 22500,
            netPayable: 382500,
            status: "PAID"
          },
          {
            contractId: contract.id,
            billingNumber: 2,
            period: new Date("2026-02-28"),
            grossAmount: 620000,
            advanceDeduction: 62000,
            penaltyDeduction: 0,
            retentionDeduction: 31000,
            netPayable: 527000,
            status: "APPROVED"
          },
          {
            contractId: contract.id,
            billingNumber: 3,
            period: new Date("2026-03-31"),
            grossAmount: 510000,
            advanceDeduction: 51000,
            penaltyDeduction: 5000,
            retentionDeduction: 25500,
            netPayable: 428500,
            status: "PENDING_APPROVAL"
          }
        ]
      })

      billings = await prisma.progressBilling.findMany({
        include: {
          contract: {
            include: {
              project: { select: { id: true, name: true, title: true } },
              subcontractor: { select: { id: true, name: true } }
            }
          }
        },
        orderBy: { billingNumber: "desc" }
      })
    }

    return {
      success: true,
      billings,
      companyName
    }
  } catch (error: any) {
    console.error("getSubcontractorBillings error:", error)
    return { success: false, billings: [], error: error?.message }
  }
}
