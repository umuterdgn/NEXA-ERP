/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * This code is the property of NXA Software.
 */

"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

export async function getBillings() {
  try {
    const billings = await prisma.progressBilling.findMany({
      include: {
        contract: {
          include: {
            project: true,
            subcontractor: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })
    return { success: true, data: billings }
  } catch (error) {
    console.error("Failed to fetch billings:", error)
    return { success: false, error: "Failed to fetch billings" }
  }
}

export async function getBillingStats() {
  try {
    const billings = await prisma.progressBilling.findMany()

    const totalGross = billings.reduce((sum, b) => sum + b.grossAmount, 0)
    const pendingApprovals = billings.filter(b => b.status === 'PENDING_APPROVAL').length
    const totalDeductions = billings.reduce((sum, b) => sum + b.advanceDeduction + b.penaltyDeduction + b.retentionDeduction, 0)

    return {
      success: true,
      data: {
        totalGross,
        pendingApprovals,
        totalDeductions
      }
    }
  } catch (error) {
    console.error("Failed to fetch billing stats:", error)
    return { success: false, error: "Failed to fetch billing stats" }
  }
}

export async function createProgressBilling(formData: FormData) {
  try {
    const contractId = (formData.get('contractId') as string) || ''
    let projectId = (formData.get('projectId') as string) || ''
    let subcontractorId = (formData.get('subcontractorId') as string) || ''
    const billingNumberInput = parseInt(formData.get('billingNumber') as string)
    const periodInput = formData.get('period') as string
    const period = periodInput ? new Date(periodInput) : new Date()

    // 1. Resolve contract, project and subcontractor
    let contract: any = null
    if (contractId) {
      contract = await prisma.contract.findUnique({
        where: { id: contractId },
        include: {
          project: true,
          subcontractor: true,
        },
      })
      if (contract) {
        projectId = projectId || contract.projectId
        subcontractorId = subcontractorId || contract.subcontractorId
      }
    }

    // 2. Find independent APPROVED WorkProofs for this project & subcontractor
    // (status = "APPROVED", projectId & subcontractorId match, progressBillingId is null)
    const whereProofs: any = {
      status: 'APPROVED',
      progressBillingId: null,
    }
    if (projectId) whereProofs.projectId = projectId
    if (subcontractorId) whereProofs.subcontractorId = subcontractorId

    const independentProofs = await prisma.workProof.findMany({
      where: whereProofs,
      include: {
        boqItem: true,
      },
    })

    // 3. Exact mathematical calculation: sum(approvedQuantity * unitPrice) to the exact cent
    let calculatedGross = 0
    for (const proof of independentProofs) {
      const qty = proof.approvedQuantity ?? proof.claimedQuantity ?? 0
      const unitPrice = proof.boqItem?.unitPrice ?? 0
      const lineTotal = Math.round(qty * unitPrice * 100) / 100
      calculatedGross += lineTotal
    }
    calculatedGross = Math.round(calculatedGross * 100) / 100

    // Raw fallback if form provided a manual grossAmount and 0 proofs were found
    const rawGross = parseFloat(formData.get('grossAmount') as string)
    const grossAmount = independentProofs.length > 0 ? calculatedGross : (!isNaN(rawGross) ? rawGross : 0)

    const advanceDeduction = parseFloat(formData.get('advanceDeduction') as string) || 0
    const penaltyDeduction = parseFloat(formData.get('penaltyDeduction') as string) || 0

    // Retention deduction: %5 or contract's retentionRate
    let retentionDeduction = parseFloat(formData.get('retentionDeduction') as string)
    if (isNaN(retentionDeduction) || retentionDeduction === 0) {
      const rate = contract?.retentionRate ?? 0.05
      retentionDeduction = Math.round(grossAmount * rate * 100) / 100
    }

    const netPayable = Math.round((grossAmount - advanceDeduction - penaltyDeduction - retentionDeduction) * 100) / 100

    // Determine billing number
    let billingNumber = billingNumberInput
    if (!billingNumber || isNaN(billingNumber)) {
      const existingCount = await prisma.progressBilling.count({
        where: contractId ? { contractId } : undefined,
      })
      billingNumber = existingCount + 1
    }

    // 4. Create ProgressBilling
    const billing = await prisma.progressBilling.create({
      data: {
        contractId: contractId || null,
        billingNumber,
        period,
        grossAmount,
        advanceDeduction,
        penaltyDeduction,
        retentionDeduction,
        netPayable,
        status: 'DRAFT',
      },
    })

    // 5. Autonomously link all found independent proofs to this newly created ProgressBilling
    if (independentProofs.length > 0) {
      await prisma.workProof.updateMany({
        where: {
          id: { in: independentProofs.map((p) => p.id) },
        },
        data: {
          progressBillingId: billing.id,
        },
      })
    }

    revalidatePath('/admin/billings')
    revalidatePath('/admin/finance')
    revalidatePath(`/admin/finance/progress-billing/${billing.id}`)

    return {
      success: true,
      data: billing,
      linkedProofCount: independentProofs.length,
      grossAmount,
      netPayable,
    }
  } catch (error) {
    console.error('Failed to create progress billing:', error)
    return { success: false, error: 'Failed to create progress billing' }
  }
}

export async function createBilling(formData: FormData) {
  return createProgressBilling(formData)
}

export async function updateBillingStatus(billingId: string, status: 'DRAFT' | 'PENDING_APPROVAL' | 'APPROVED' | 'PAID') {
  try {
    await prisma.progressBilling.update({
      where: { id: billingId },
      data: { status }
    })

    revalidatePath('/admin/billings')
    return { success: true }
  } catch (error) {
    console.error("Failed to update billing status:", error)
    return { success: false, error: "Failed to update billing status" }
  }
}

export async function getContracts() {
  try {
    const contracts = await prisma.contract.findMany({
      include: {
        project: true,
        subcontractor: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })
    return { success: true, data: contracts }
  } catch (error) {
    console.error("Failed to fetch contracts:", error)
    return { success: false, error: "Failed to fetch contracts" }
  }
}

export async function createContract(formData: FormData) {
  try {
    const projectId = formData.get('projectId') as string
    const subcontractorId = formData.get('subcontractorId') as string
    const title = formData.get('title') as string
    const totalAmount = parseFloat(formData.get('totalAmount') as string)
    const startDate = new Date(formData.get('startDate') as string)
    const endDate = new Date(formData.get('endDate') as string)

    await prisma.contract.create({
      data: {
        projectId,
        subcontractorId,
        title,
        totalAmount,
        startDate,
        endDate,
        status: 'ACTIVE' as const
      }
    })

    revalidatePath('/admin/billings')
    return { success: true }
  } catch (error) {
    console.error("Failed to create contract:", error)
    return { success: false, error: "Failed to create contract" }
  }
}

export async function getSubcontractors() {
  try {
    const subcontractors = await prisma.subcontractor.findMany({
      orderBy: {
        createdAt: 'desc'
      }
    })
    return { success: true, data: subcontractors }
  } catch (error) {
    console.error("Failed to fetch subcontractors:", error)
    return { success: false, error: "Failed to fetch subcontractors" }
  }
}

export async function createSubcontractor(formData: FormData) {
  try {
    const name = formData.get('name') as string
    const taxNumber = formData.get('taxNumber') as string
    const contactName = formData.get('contactName') as string
    const phone = formData.get('phone') as string

    await prisma.subcontractor.create({
      data: {
        name,
        taxNumber,
        contactName,
        phone
      }
    })

    revalidatePath('/admin/billings')
    return { success: true }
  } catch (error) {
    console.error("Failed to create subcontractor:", error)
    return { success: false, error: "Failed to create subcontractor" }
  }
}
