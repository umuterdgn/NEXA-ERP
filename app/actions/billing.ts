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

export async function createBilling(formData: FormData) {
  try {
    const contractId = formData.get('contractId') as string
    const billingNumber = parseInt(formData.get('billingNumber') as string)
    const period = new Date(formData.get('period') as string)
    const grossAmount = parseFloat(formData.get('grossAmount') as string)
    const advanceDeduction = parseFloat(formData.get('advanceDeduction') as string) || 0
    const penaltyDeduction = parseFloat(formData.get('penaltyDeduction') as string) || 0
    const retentionDeduction = parseFloat(formData.get('retentionDeduction') as string) || 0

    const netPayable = grossAmount - advanceDeduction - penaltyDeduction - retentionDeduction

    await prisma.progressBilling.create({
      data: {
        contractId,
        billingNumber,
        period,
        grossAmount,
        advanceDeduction,
        penaltyDeduction,
        retentionDeduction,
        netPayable,
        status: 'DRAFT' as const
      }
    })

    revalidatePath('/admin/billings')
    return { success: true }
  } catch (error) {
    console.error("Failed to create billing:", error)
    return { success: false, error: "Failed to create billing" }
  }
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
