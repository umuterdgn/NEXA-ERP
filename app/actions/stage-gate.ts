/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Franchise Stage-Gate Server Actions & Otonom Hakediş Tetikleyicisi
 */

"use server"

import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { revalidatePath } from "next/cache"

export async function approveStageGate(stageGateId: string, approvedById?: string) {
  try {
    const session = await auth()
    const operatorId = approvedById || session?.user?.id || "SYSTEM"

    // 1. StageGate ve Projeyi çek
    const gate = await prisma.stageGate.findUnique({
      where: { id: stageGateId },
      include: {
        project: {
          include: {
            contracts: {
              where: { status: "ACTIVE" },
              orderBy: { createdAt: "desc" },
              take: 1,
            },
            stageGates: {
              orderBy: { createdAt: "asc" },
            },
          },
        },
      },
    })

    if (!gate) {
      return { success: false, error: "StageGate aşaması bulunamadı" }
    }

    // 2. Stage-Gate Kuralı: Kendisinden önceki aşamalar onaylı mı?
    const allStages = gate.project.stageGates
    const currentIndex = allStages.findIndex((s) => s.id === stageGateId)

    for (let i = 0; i < currentIndex; i++) {
      const prev = allStages[i]
      if (prev.isRequired && !prev.isApproved) {
        return {
          success: false,
          error: `Önceki aşama olan "${prev.stageName}" onaylanmadan bu aşama onaylanamaz!`,
        }
      }
    }

    // 3. OTONOM HAKEDİŞ: Eğer billingPercentage varsa ve henüz ProgressBilling oluşturulmamışsa
    let createdBillingId = gate.progressBillingId || null

    if (gate.billingPercentage && gate.billingPercentage > 0 && !gate.progressBillingId) {
      const contract = gate.project.contracts[0]
      // Sözleşme tutarı (yoksa proje bazlı varsayılan franchise taşeron montaj bedeli 750.000 ₺)
      const contractAmount = (contract as any)?.totalAmount || 750000
      const grossAmount = (contractAmount * gate.billingPercentage) / 100
      const netPayable = grossAmount

      const previousBillingsCount = contract?.id
        ? await prisma.progressBilling.count({ where: { contractId: contract.id } })
        : 0

      const newBilling = await prisma.progressBilling.create({
        data: {
          contractId: contract?.id || null,
          billingNumber: previousBillingsCount + 1,
          period: new Date(),
          grossAmount,
          advanceDeduction: 0,
          penaltyDeduction: 0,
          retentionDeduction: 0,
          netPayable,
          status: "DRAFT",
        },
      })

      createdBillingId = newBilling.id
      console.log(
        `✅ [Otonom Hakediş] StageGate "${gate.stageName}" onaylandı -> Taslak Hakediş No:${newBilling.billingNumber} tutar:${grossAmount} ₺ oluşturuldu.`
      )
    }

    // 4. Aşama Onayını Güncelle
    const updatedGate = await prisma.stageGate.update({
      where: { id: stageGateId },
      data: {
        isApproved: true,
        approvedById: operatorId,
        approvedAt: new Date(),
        progressBillingId: createdBillingId,
      },
    })

    revalidatePath(`/admin/franchise/stage-gates/${gate.projectId}`)
    revalidatePath("/admin/franchise/rollout")
    revalidatePath("/admin/billing")

    return {
      success: true,
      stageGate: updatedGate,
      createdBillingId,
    }
  } catch (error: any) {
    console.error("❌ approveStageGate error:", error)
    return { success: false, error: error.message || "Aşama onaylanamadı" }
  }
}

export async function revokeStageGate(stageGateId: string) {
  try {
    const updated = await prisma.stageGate.update({
      where: { id: stageGateId },
      data: {
        isApproved: false,
        approvedById: null,
        approvedAt: null,
      },
    })
    revalidatePath(`/admin/franchise/stage-gates/${updated.projectId}`)
    revalidatePath("/admin/franchise/rollout")
    return { success: true, stageGate: updated }
  } catch (error: any) {
    console.error("❌ revokeStageGate error:", error)
    return { success: false, error: error.message || "Onay geri alınamadı" }
  }
}
