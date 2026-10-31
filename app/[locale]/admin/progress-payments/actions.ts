/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Progress Payments Server Actions with strict tenant isolation
 */

"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { auth } from "@/lib/auth"

export async function createProgressPayment(formData: FormData) {
  try {
    const session = await auth()
    if (!session?.user) {
      return { success: false, error: "Oturum bulunamadı" }
    }

    const tenantId = (session.user as any)?.tenantId

    const title = formData.get("title") as string
    const description = formData.get("description") as string
    const quantity = parseFloat(formData.get("quantity") as string)
    const unit = formData.get("unit") as string
    const unitPrice = formData.get("unitPrice") ? parseFloat(formData.get("unitPrice") as string) : null
    const date = formData.get("date") as string

    if (!title || !quantity || !unit) {
      return { success: false, error: "Başlık, miktar ve birim zorunludur" }
    }

    const totalPrice = unitPrice ? quantity * unitPrice : null

    const progressPayment = await prisma.progressPayment.create({
      data: {
        title,
        description: description || null,
        quantity,
        unit,
        unitPrice,
        totalPrice,
        amount: totalPrice || 0,
        netAmount: totalPrice || 0,
        netPayableAmount: totalPrice || 0,
        date: date ? new Date(date) : new Date(),
        tenantId: tenantId || null,
      },
    })

    revalidatePath("/admin/progress-payments")
    return { success: true, progressPayment }
  } catch (error) {
    console.error("Create progress payment error:", error)
    return { success: false, error: "Hakediş oluşturulamadı" }
  }
}

export async function updateProgressPaymentStatus(id: string, newStatus: string) {
  try {
    const session = await auth()
    if (!session?.user) {
      return { success: false, error: "Oturum bulunamadı" }
    }

    const isSuperAdmin = session.user.role === "SUPER_ADMIN"
    const tenantId = (session.user as any)?.tenantId

    const existing = await prisma.progressPayment.findUnique({ where: { id } })
    if (!existing) {
      return { success: false, error: "Hakediş bulunamadı" }
    }

    if (!isSuperAdmin && existing.tenantId !== tenantId) {
      return { success: false, error: "Yetkisiz işlem" }
    }

    const progressPayment = await prisma.progressPayment.update({
      where: { id },
      data: { status: newStatus },
    })

    revalidatePath("/admin/progress-payments")
    return { success: true, progressPayment }
  } catch (error) {
    console.error("Update progress payment status error:", error)
    return { success: false, error: "Durum güncellenemedi" }
  }
}

export async function getProgressPayments() {
  try {
    const session = await auth()
    if (!session?.user) {
      return { success: false, error: "Yetkisiz erişim", progressPayments: [] }
    }

    const isSuperAdmin = session.user.role === "SUPER_ADMIN"
    const tenantId = (session.user as any)?.tenantId

    const where: any = {}
    if (!isSuperAdmin) {
      where.tenantId = tenantId || "non-existent"
    }

    const progressPayments = await prisma.progressPayment.findMany({
      where,
      orderBy: { date: "desc" },
    })
    return { success: true, progressPayments }
  } catch (error) {
    console.error("Get progress payments error:", error)
    return { success: false, error: "Hakedişler getirilemedi", progressPayments: [] }
  }
}
