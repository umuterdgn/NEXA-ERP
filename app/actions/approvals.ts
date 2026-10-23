/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Kademeli Onay Servisi (Multi-Tier Approval Service)
 * Saha Mühendisi (STAFF/ENGINEER) -> Şantiye Şefi (SITE_MANAGER) -> Proje Müdürü (PROJECT_MANAGER)
 */

"use server"

import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { revalidatePath } from "next/cache"
import { isEngineerRole, isManagerRole } from "@/lib/roles"

/**
 * Taşeron İş Kanıtı Kademeli Onay Fonksiyonu:
 * 1. Saha Mühendisi (STAFF / ENGINEER): Sadece engineerStatus değerini APPROVED yapar.
 * 2. Şantiye Şefi (SITE_MANAGER / PROJECT_MANAGER / ADMIN):
 *    - engineerStatus onaylanmadan ONAY BUTONU ÇALIŞMAZ (Guard & UI disabled)
 *    - managerStatus değerini APPROVED yapar.
 * 3. Her iki kademe de onaylandığında (engineerStatus === 'APPROVED' && managerStatus === 'APPROVED'):
 *    - Genel status = 'APPROVED' olur.
 *    - Taşeronun hakedişine yansır (ProgressPayment kaydı oluşturulur).
 */
export async function approveWorkProof(proofId: string, notes?: string) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: "Yetkisiz işlem: Oturum açmanız gerekmektedir." }
    }

    const currentRole = (session.user.role as string) || "STAFF"
    const currentUserId = session.user.id

    // Fetch existing proof with contract and subcontractor info
    const proof = await prisma.workProof.findUnique({
      where: { id: proofId },
      include: {
        contract: {
          include: {
            project: true,
          },
        },
        subcontractor: true,
      },
    })

    if (!proof) {
      return { success: false, error: "İş kanıtı bulunamadı." }
    }

    const isEngineer = isEngineerRole(currentRole)
    const isManager = isManagerRole(currentRole)

    if (!isEngineer && !isManager) {
      return {
        success: false,
        error: "Yetkisiz işlem: Sadece Saha Mühendisleri veya Şantiye Şefleri bu onayı verebilir.",
      }
    }

    let nextEngineerStatus = proof.engineerStatus || "PENDING"
    let nextManagerStatus = proof.managerStatus || "PENDING"
    let nextEngineerId = proof.engineerId
    let nextManagerId = proof.managerId

    // 1. AŞAMA: Saha Mühendisi Onayı
    if (isEngineer && !isManager) {
      nextEngineerStatus = "APPROVED"
      nextEngineerId = currentUserId
    }

    // 2. AŞAMA: Şantiye Şefi / Proje Müdürü Onayı
    if (isManager) {
      // Kritik Kural: engineerStatus onaylanmadan, Şantiye Şefinin onayı verilemez!
      if (proof.engineerStatus !== "APPROVED" && nextEngineerStatus !== "APPROVED") {
        return {
          success: false,
          error:
            "Kademeli Onay Kuralı: Saha Mühendisi (STAFF) ilk teknik onayı vermeden Şantiye Şefi onayı tamamlanamaz.",
        }
      }
      nextManagerStatus = "APPROVED"
      nextManagerId = currentUserId
    }

    // Çift Kademe Kontrolü: İkisi de onaylandı mı?
    const isFullyApproved = nextEngineerStatus === "APPROVED" && nextManagerStatus === "APPROVED"
    const overallStatus = isFullyApproved ? "APPROVED" : proof.status

    // Update WorkProof
    const updatedProof = await prisma.workProof.update({
      where: { id: proofId },
      data: {
        engineerStatus: nextEngineerStatus,
        managerStatus: nextManagerStatus,
        engineerId: nextEngineerId,
        managerId: nextManagerId,
        status: overallStatus as any,
      },
    })

    // İkisi de onaylandığında taşeronun hakedişine yansısın:
    let paymentRecord = null
    if (isFullyApproved) {
      try {
        const contractAmount = proof.contract?.totalAmount || 50000
        const progressAmount = Number((contractAmount * 0.05).toFixed(2)) // Örn: %5 imalat payı

        paymentRecord = await prisma.progressPayment.create({
          data: {
            title: `Onaylı İmalat Hakedişi: ${proof.title}`,
            description: `Saha Mühendisi ve Şantiye Şefi kademeli teknik doğrulaması tamamlandı (Kanıt #${proof.id}). ${notes ? "Not: " + notes : ""}`,
            quantity: 1,
            unit: "Hakediş Dilimi",
            unitPrice: progressAmount,
            totalPrice: progressAmount,
            amount: progressAmount,
            netAmount: progressAmount,
            netPayableAmount: progressAmount,
            status: "ONAYLANDI",
            projectId: proof.contract?.projectId || null,
            contractId: proof.contractId,
            subcontractorId: proof.subcontractorId,
          },
        })
      } catch (billingErr) {
        console.error("Hakediş oluşturulurken hata:", billingErr)
      }
    }

    try {
      revalidatePath("/admin/approvals")
      revalidatePath("/admin/subcontractor-inspections")
      revalidatePath("/admin/billing")
      revalidatePath("/admin/progress-payments")
    } catch {}

    return {
      success: true,
      data: updatedProof,
      isFullyApproved,
      paymentCreated: !!paymentRecord,
      message: isFullyApproved
        ? "Tüm kademeler onaylandı! İmalat taşeron hakedişine başarıyla yansıtıldı."
        : isEngineer
        ? "Saha Mühendisi teknik onayı kaydedildi. Şantiye Şefi 2. onayına iletildi."
        : "Şantiye Şefi onayı kaydedildi.",
    }
  } catch (error: any) {
    console.error("approveWorkProof error:", error)
    return { success: false, error: error?.message || "İş kanıtı onaylanırken hata oluştu." }
  }
}

/**
 * İş Kanıtı Reddetme
 */
export async function rejectWorkProof(proofId: string, reason?: string) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: "Yetkisiz işlem: Oturum açınız." }
    }

    const currentRole = (session.user.role as string) || "STAFF"
    const isEngineer = isEngineerRole(currentRole)

    const updated = await prisma.workProof.update({
      where: { id: proofId },
      data: {
        status: "REJECTED" as any,
        engineerStatus: isEngineer ? "REJECTED" : undefined,
        managerStatus: !isEngineer ? "REJECTED" : undefined,
        description: reason ? `[RED SEBEBİ]: ${reason}` : undefined,
      },
    })

    try {
      revalidatePath("/admin/approvals")
      revalidatePath("/admin/subcontractor-inspections")
    } catch {}

    return {
      success: true,
      data: updated,
      message: "İş kanıtı reddedildi ve taşerona bildirildi.",
    }
  } catch (error: any) {
    console.error("rejectWorkProof error:", error)
    return { success: false, error: error?.message || "İş kanıtı reddedilirken hata oluştu." }
  }
}

/**
 * Onay Bekleyenler Konsolu İçin Tüm Talepleri Getirme:
 * - İş Kanıtları (WorkProof - Kademeli Onay)
 * - İzin Talepleri (LeaveRequest)
 * - Masraf Talepleri (ExpenseClaim)
 * - Hakediş Talepleri (ProgressBilling)
 */
export async function getPendingApprovals() {
  try {
    const session = await auth()
    const currentRole = (session?.user?.role as string) || "STAFF"
    const currentUserId = session?.user?.id || ""

    // 1. İş Kanıtları (WorkProof)
    const workProofs = await prisma.workProof.findMany({
      where: {
        status: "PENDING",
      },
      include: {
        contract: {
          include: {
            project: {
              select: {
                id: true,
                name: true,
                title: true,
                city: true,
                district: true,
              },
            },
          },
        },
        subcontractor: {
          select: {
            id: true,
            name: true,
            contactName: true,
            phone: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    // Fetch user details for reviewers if present
    const reviewerIds = Array.from(
      new Set(
        workProofs
          .flatMap((wp) => [wp.engineerId, wp.managerId])
          .filter((id): id is string => Boolean(id))
      )
    )

    const reviewerUsers = await prisma.user.findMany({
      where: { id: { in: reviewerIds } },
      select: { id: true, name: true, role: true },
    })
    const userMap = new Map(reviewerUsers.map((u) => [u.id, u.name]))

    const annotatedWorkProofs = workProofs.map((wp) => {
      const isEngineer = isEngineerRole(currentRole)
      const isManager = isManagerRole(currentRole)

      const engineerApproved = wp.engineerStatus === "APPROVED"
      const managerApproved = wp.managerStatus === "APPROVED"

      // Kademeli Kurallar:
      // Mühendis onaylayabilir mi? -> Rolü mühendisse ve henüz kendisi onaylamamışsa
      const canEngineerApprove = isEngineer && !engineerApproved
      // Şantiye Şefi onaylayabilir mi? -> Rolü yöneticiyse VE mühendis ONAYLAMIŞSA ve henüz şef onaylamamışsa
      const canManagerApprove = isManager && engineerApproved && !managerApproved
      // Şef butonu devre dışı mı? -> Yönetici rolünde ama henüz mühendis onaylamamış
      const isManagerDisabled = isManager && !engineerApproved

      return {
        ...wp,
        engineerName: wp.engineerId ? userMap.get(wp.engineerId) || "Saha Mühendisi" : null,
        managerName: wp.managerId ? userMap.get(wp.managerId) || "Şantiye Şefi" : null,
        canEngineerApprove,
        canManagerApprove,
        isManagerDisabled,
      }
    })

    // 2. İzin Talepleri (LeaveRequest)
    const leaveRequests = await prisma.leaveRequest.findMany({
      where: {
        status: "PENDING",
      },
      include: {
        personel: {
          select: {
            id: true,
            name: true,
            department: true,
            position: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 50,
    })

    // 3. Masraf Talepleri (ExpenseClaim)
    const expenseClaims = await prisma.expenseClaim.findMany({
      where: {
        status: "PENDING",
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 50,
    })

    // 4. Hakediş Talepleri (ProgressBilling)
    const progressBillings = await prisma.progressBilling.findMany({
      where: {
        status: { in: ["PENDING_APPROVAL", "DRAFT"] },
      },
      include: {
        contract: {
          include: {
            project: {
              select: {
                id: true,
                name: true,
                title: true,
              },
            },
            subcontractor: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 50,
    })

    return {
      success: true,
      currentUserRole: currentRole,
      currentUserId,
      data: {
        workProofs: annotatedWorkProofs,
        leaveRequests,
        expenseClaims,
        progressBillings,
        summary: {
          totalPending:
            annotatedWorkProofs.length +
            leaveRequests.length +
            expenseClaims.length +
            progressBillings.length,
          workProofsCount: annotatedWorkProofs.length,
          leavesCount: leaveRequests.length,
          expensesCount: expenseClaims.length,
          billingsCount: progressBillings.length,
        },
      },
    }
  } catch (error: any) {
    console.error("getPendingApprovals error:", error)
    return { success: false, error: error?.message || "Onaylar yüklenirken hata oluştu." }
  }
}

/**
 * İzin Onay / Red İşlemi
 */
export async function reviewLeaveRequest(requestId: string, action: "APPROVED" | "REJECTED", reason?: string) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: "Yetkisiz işlem: Oturum açınız." }
    }

    const updated = await prisma.leaveRequest.update({
      where: { id: requestId },
      data: {
        status: action,
        reviewedBy: session.user.id,
        reviewedAt: new Date(),
        reason: reason ? `[İncelendi]: ${reason}` : undefined,
      },
    })

    try {
      revalidatePath("/admin/approvals")
      revalidatePath("/admin/personel")
      revalidatePath("/admin/leave")
    } catch {}

    return {
      success: true,
      data: updated,
      message: action === "APPROVED" ? "İzin talebi onaylandı." : "İzin talebi reddedildi.",
    }
  } catch (error: any) {
    console.error("reviewLeaveRequest error:", error)
    return { success: false, error: error?.message || "İzin işlemi gerçekleştirilemedi." }
  }
}

/**
 * Masraf Onay / Red İşlemi
 */
export async function reviewExpenseClaim(claimId: string, action: "APPROVED" | "REJECTED" | "PAID") {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: "Yetkisiz işlem: Oturum açınız." }
    }

    const updated = await prisma.expenseClaim.update({
      where: { id: claimId },
      data: {
        status: action,
      },
    })

    try {
      revalidatePath("/admin/approvals")
      revalidatePath("/admin/finance/expenses")
    } catch {}

    return {
      success: true,
      data: updated,
      message: action === "APPROVED" ? "Masraf onaylandı." : action === "PAID" ? "Masraf ödendi olarak işaretlendi." : "Masraf reddedildi.",
    }
  } catch (error: any) {
    console.error("reviewExpenseClaim error:", error)
    return { success: false, error: error?.message || "Masraf işlemi gerçekleştirilemedi." }
  }
}

/**
 * Hakediş Onay / Red İşlemi
 */
export async function reviewProgressBilling(billingId: string, action: "APPROVED" | "DRAFT" | "PAID") {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: "Yetkisiz işlem: Oturum açınız." }
    }

    const updated = await prisma.progressBilling.update({
      where: { id: billingId },
      data: {
        status: action as any,
      },
    })

    try {
      revalidatePath("/admin/approvals")
      revalidatePath("/admin/billing")
    } catch {}

    return {
      success: true,
      data: updated,
      message: `Hakediş durumu "${action}" olarak güncellendi.`,
    }
  } catch (error: any) {
    console.error("reviewProgressBilling error:", error)
    return { success: false, error: error?.message || "Hakediş işlemi gerçekleştirilemedi." }
  }
}
