/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Engineer Subcontractor Proof Approval Actions
 */

"use server"

import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { revalidatePath } from "next/cache"

export async function getProofsForApproval() {
  try {
    const session = await auth()
    const userRole = (session?.user?.role as string) || "STAFF"

    const proofs = await prisma.workProof.findMany({
      include: {
        contract: {
          include: {
            project: { select: { id: true, name: true, title: true } },
            subcontractor: { select: { id: true, name: true } }
          }
        },
        subcontractor: {
          select: { id: true, name: true, contactName: true, phone: true }
        }
      },
      orderBy: { createdAt: "desc" }
    })

    // Also get ProgressAttachments
    const progressAttachments = await prisma.progressAttachment.findMany({
      take: 20,
      include: {
        project: { select: { id: true, name: true, title: true } },
        uploader: { select: { id: true, name: true, email: true } }
      },
      orderBy: { createdAt: "desc" }
    })

    return {
      success: true,
      proofs,
      progressAttachments,
      userRole
    }
  } catch (error: any) {
    console.error("getProofsForApproval error:", error)
    return { success: false, proofs: [], progressAttachments: [], error: error?.message }
  }
}

export async function approveProofAction(proofId: string, notes?: string) {
  try {
    const session = await auth()
    const engineerId = session?.user?.id

    const existing = await prisma.workProof.findUnique({
      where: { id: proofId }
    })

    if (!existing) {
      return { success: false, error: "İş kanıtı kaydı bulunamadı." }
    }

    const updated = await prisma.workProof.update({
      where: { id: proofId },
      data: {
        engineerStatus: "APPROVED",
        engineerId: engineerId || null,
        // If manager had already approved or user is Site Manager / Admin, approve overall status
        status: existing.managerStatus === "APPROVED" ? "APPROVED" : "PENDING"
      }
    })

    revalidatePath("/personnel/subcontractor-approvals")
    revalidatePath("/subcontractor/proofs/new")
    revalidatePath("/admin/subcontractor-inspections")

    return { success: true, message: "İş kanıtı saha mühendisi tarafından teknik kabule alındı (Onaylandı)." }
  } catch (error: any) {
    console.error("approveProofAction error:", error)
    return { success: false, error: error?.message || "Onaylama işlemi başarısız oldu." }
  }
}

export async function rejectProofAction(proofId: string, rejectionReason: string) {
  try {
    const session = await auth()
    const engineerId = session?.user?.id

    if (!rejectionReason.trim()) {
      return { success: false, error: "Lütfen ret veya düzeltme gerekçesini belirtiniz." }
    }

    const updated = await prisma.workProof.update({
      where: { id: proofId },
      data: {
        engineerStatus: "REJECTED",
        status: "REJECTED",
        engineerId: engineerId || null,
        description: `[DÜZELTME İSTENDİ - RET]: ${rejectionReason}`
      }
    })

    revalidatePath("/personnel/subcontractor-approvals")
    revalidatePath("/subcontractor/proofs/new")

    return { success: true, message: "İş kanıtı reddedildi ve taşerona düzeltme bildirimi iletildi." }
  } catch (error: any) {
    console.error("rejectProofAction error:", error)
    return { success: false, error: error?.message || "İşlem başarısız oldu." }
  }
}
