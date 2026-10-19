/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * İnşaat Muhasebesi ve Finans Server Actions
 * - Teminat Kesintili Hakediş Hesaplama Motoru (4857 & Yapı İşleri Genel Şartnamesi Uyumlu)
 * - E-Fatura (UBL-TR Gelen/Giden Kutusu) Yönetimi
 */

"use server"

import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { revalidatePath } from "next/cache"

export interface ProgressPaymentCalculationInput {
  grossAmount: number // Toplam İmalat Bedeli (Bürüt Tutar)
  defectPenalties?: number // BIM Kusur ve Ceza Kesintileri
  retentionRate?: number // Teminat Kesinti Oranı (Varsayılan 0.05 - %5 Geçici Kabul Teminatı)
  advanceDeduction?: number // Taşerona Verilen Avans Mahsubu
}

export interface ProgressPaymentCalculationResult {
  grossAmount: number
  defectPenalties: number
  retentionRate: number
  retentionAmount: number // grossAmount * retentionRate
  advanceDeduction: number
  totalDeductions: number // defectPenalties + retentionAmount + advanceDeduction
  netPayableAmount: number // grossAmount - totalDeductions
}

/**
 * İnşaat Muhasebesine Özel Hakediş Hesaplama Motoru:
 * Formül: Net Hakediş = Toplam İmalat Bedeli - (BIM Kusur Cezaları + %5 Teminat Kesintisi + Verilen Avans)
 */
export function calculateProgressPaymentBreakdown(
  input: ProgressPaymentCalculationInput
): ProgressPaymentCalculationResult {
  const grossAmount = Math.max(0, Number(input.grossAmount) || 0)
  const defectPenalties = Math.max(0, Number(input.defectPenalties) || 0)
  const retentionRate = typeof input.retentionRate === "number" ? input.retentionRate : 0.05
  const retentionAmount = Math.round(grossAmount * retentionRate * 100) / 100
  const advanceDeduction = Math.max(0, Number(input.advanceDeduction) || 0)

  const totalDeductions = Math.round((defectPenalties + retentionAmount + advanceDeduction) * 100) / 100
  const netPayableAmount = Math.max(0, Math.round((grossAmount - totalDeductions) * 100) / 100)

  return {
    grossAmount,
    defectPenalties,
    retentionRate,
    retentionAmount,
    advanceDeduction,
    totalDeductions,
    netPayableAmount,
  }
}

// ============================================================================
// HAKEDİŞ DETAY & YÖNETİM ACTIONS
// ============================================================================

export async function getProgressPaymentDetail(id: string) {
  try {
    const payment = await prisma.progressPayment.findUnique({
      where: { id },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            title: true,
            city: true,
            district: true,
            yibfNo: true,
            ada: true,
            parsel: true,
          },
        },
        subcontractor: {
          select: {
            id: true,
            name: true,
            contactName: true,
            phone: true,
            taxNumber: true,
          },
        },
        contract: {
          select: {
            id: true,
            title: true,
            totalAmount: true,
            startDate: true,
            endDate: true,
          },
        },
        workPackage: {
          select: { id: true, name: true, code: true },
        },
        boqItem: {
          select: { id: true, itemCode: true, description: true, unit: true, unitPrice: true },
        },
        blockingIssues: true,
        financialTransactions: {
          orderBy: { createdAt: "desc" },
          take: 5,
        },
      },
    })

    if (!payment) {
      return { success: false, error: "Hakediş kaydı bulunamadı." }
    }

    const paymentAny = payment as any

    // Toplam İmalat Bedeli (Bürüt)
    const grossAmount =
      payment.totalPrice ??
      (payment.quantity && payment.unitPrice ? payment.quantity * payment.unitPrice : payment.amount || 0)

    // Açık BIM Kusur Cezalarını Hesapla
    let calculatedPenalties = payment.penaltyDeduction || 0
    if (paymentAny.blockingIssues && paymentAny.blockingIssues.length > 0) {
      const issuePenaltiesSum = paymentAny.blockingIssues.reduce((acc: number, issue: any) => acc + (issue.penaltyAmount || 0), 0)
      if (issuePenaltiesSum > 0) {
        calculatedPenalties = issuePenaltiesSum
      }
    }

    const breakdown = calculateProgressPaymentBreakdown({
      grossAmount,
      defectPenalties: calculatedPenalties,
      retentionRate: payment.retentionRate ?? 0.05,
      advanceDeduction: payment.advanceDeduction ?? 0,
    })

    return {
      success: true,
      payment,
      breakdown,
    }
  } catch (error: any) {
    console.error("getProgressPaymentDetail error:", error)
    return { success: false, error: error.message || "Hakediş detayları yüklenemedi." }
  }
}

export async function approveProgressPaymentAction(
  id: string,
  options?: {
    advanceDeduction?: number
    retentionRate?: number
  }
) {
  try {
    const payment = await prisma.progressPayment.findUnique({
      where: { id },
      include: {
        blockingIssues: true,
      },
    })

    if (!payment) {
      return { success: false, error: "Hakediş kaydı bulunamadı." }
    }

    const paymentAny = payment as any
    const grossAmount =
      payment.totalPrice ??
      (payment.quantity && payment.unitPrice ? payment.quantity * payment.unitPrice : payment.amount || 0)

    const defectPenalties = (paymentAny.blockingIssues || []).reduce(
      (acc: number, issue: any) => acc + (issue.penaltyAmount || 0),
      payment.penaltyDeduction || 0
    )
    const retentionRate = options?.retentionRate ?? payment.retentionRate ?? 0.05
    const advanceDeduction = options?.advanceDeduction ?? payment.advanceDeduction ?? 0

    const breakdown = calculateProgressPaymentBreakdown({
      grossAmount,
      defectPenalties,
      retentionRate,
      advanceDeduction,
    })

    const updated = await prisma.$transaction(async (tx) => {
      const p = await tx.progressPayment.update({
        where: { id },
        data: {
          status: "ONAYLANDI",
          penaltyDeduction: breakdown.defectPenalties,
          retentionRate: breakdown.retentionRate,
          retentionAmount: breakdown.retentionAmount,
          advanceDeduction: breakdown.advanceDeduction,
          netPayableAmount: breakdown.netPayableAmount,
          netAmount: breakdown.netPayableAmount,
        },
      })

      // Finans tablosuna borç/gider kaydı işle
      await tx.financialTransaction.create({
        data: {
          type: "EXPENSE",
          amount: breakdown.grossAmount,
          netAmount: breakdown.netPayableAmount,
          penaltyDeduction: breakdown.defectPenalties,
          status: "COMPLETED",
          description: `Hakediş Onayı: ${p.title} (Brüt: ${breakdown.grossAmount} ₺, Kusur: ${breakdown.defectPenalties} ₺, %5 Teminat: ${breakdown.retentionAmount} ₺, Avans: ${breakdown.advanceDeduction} ₺, Net: ${breakdown.netPayableAmount} ₺)`,
          category: "HAKEDIS",
          progressPaymentId: p.id,
          projectId: p.projectId || null,
          subcontractorId: p.subcontractorId || null,
          contractId: p.contractId || null,
          date: new Date(),
        },
      })

      return p
    })

    revalidatePath(`/admin/finance/progress-payments/${id}`)
    revalidatePath("/admin/progress-payments")
    revalidatePath("/admin/finance")

    return { success: true, payment: updated, breakdown }
  } catch (error: any) {
    console.error("approveProgressPaymentAction error:", error)
    return { success: false, error: error.message || "Hakediş onaylanamadı." }
  }
}

// ============================================================================
// E-FATURA (UBL-TR) SERVER ACTIONS
// ============================================================================

export async function getEInvoicesAction(filter?: {
  direction?: string // "INCOMING" | "OUTGOING" | "ALL"
  status?: string
  companyId?: string
}) {
  try {
    const where: any = {}
    if (filter?.direction && filter.direction !== "ALL") {
      where.direction = filter.direction
    }
    if (filter?.status && filter.status !== "ALL") {
      where.status = filter.status
    }
    if (filter?.companyId) {
      where.companyId = filter.companyId
    }

    const invoices = await prisma.eInvoice.findMany({
      where,
      include: {
        company: {
          select: { id: true, name: true, taxNumber: true, taxOffice: true },
        },
      },
      orderBy: { issueDate: "desc" },
    })

    return { success: true, invoices }
  } catch (error: any) {
    console.error("getEInvoicesAction error:", error)
    return { success: false, error: error.message || "E-Faturalar yüklenemedi.", invoices: [] }
  }
}

export async function createEInvoiceAction(data: {
  invoiceNo: string
  companyId: string
  direction: "INCOMING" | "OUTGOING"
  totalAmount: number
  taxAmount: number
  issueDate: string
  status?: string
}) {
  try {
    const invoice = await prisma.eInvoice.create({
      data: {
        invoiceNo: data.invoiceNo.trim().toUpperCase(),
        companyId: data.companyId,
        direction: data.direction,
        totalAmount: Number(data.totalAmount),
        taxAmount: Number(data.taxAmount),
        issueDate: new Date(data.issueDate),
        status: data.status || "DRAFT",
      },
      include: {
        company: true,
      },
    })

    revalidatePath("/admin/finance")
    return { success: true, invoice }
  } catch (error: any) {
    console.error("createEInvoiceAction error:", error)
    return { success: false, error: error.message || "E-Fatura oluşturulamadı." }
  }
}

export async function updateEInvoiceStatusAction(
  id: string,
  status: "DRAFT" | "SENT" | "RECEIVED" | "REJECTED"
) {
  try {
    const invoice = await prisma.eInvoice.update({
      where: { id },
      data: { status },
    })

    revalidatePath("/admin/finance")
    return { success: true, invoice }
  } catch (error: any) {
    console.error("updateEInvoiceStatusAction error:", error)
    return { success: false, error: error.message || "E-Fatura durumu güncellenemedi." }
  }
}
