/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Superadmin SaaS Billing & Subscriptions API
 */

import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const session = await auth()
    if (session?.user?.role !== "SUPER_ADMIN" && session?.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 403 })
    }

    const tenants = await prisma.tenant.findMany({
      select: {
        id: true,
        name: true,
        domain: true,
        type: true,
        subscriptionPlan: true,
        status: true,
        paymentStatus: true,
        licenses: true,
        iyzicoSubId: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            projects: true,
            users: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    })

    // Plan fiyatlandırma haritası (Aylık TL)
    const PLAN_PRICES: Record<string, number> = {
      STARTER: 14900,
      PROFESSIONAL: 29900,
      ENTERPRISE: 49900,
    }

    const billingData = tenants.map((t) => {
      const price = PLAN_PRICES[t.subscriptionPlan] || 19900
      // İyzico yenilenme tarihi simülasyonu (ayın oluşturulduğu günü)
      const created = new Date(t.createdAt)
      const nextBilling = new Date()
      nextBilling.setDate(created.getDate())
      if (nextBilling < new Date()) {
        nextBilling.setMonth(nextBilling.getMonth() + 1)
      }

      return {
        ...t,
        monthlyFee: price,
        nextBillingDate: nextBilling.toISOString(),
        isReadOnly: t.status === "SUSPENDED",
      }
    })

    return NextResponse.json({ success: true, data: billingData })
  } catch (error) {
    console.error("Billing API Hatası:", error)
    return NextResponse.json({ success: false, error: "Faturalar çekilemedi" }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await auth()
    if (session?.user?.role !== "SUPER_ADMIN" && session?.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 403 })
    }

    const body = await request.json()
    const { tenantId, action, paymentStatus, status } = body

    if (!tenantId) {
      return NextResponse.json({ error: "tenantId zorunludur" }, { status: 400 })
    }

    const dataToUpdate: any = {}

    // Tek tuşla Read-Only (SUSPENDED) veya Aktife alma
    if (action === "TOGGLE_READ_ONLY") {
      const current = await prisma.tenant.findUnique({
        where: { id: tenantId },
        select: { status: true },
      })
      dataToUpdate.status = current?.status === "SUSPENDED" ? "ACTIVE" : "SUSPENDED"
    }

    if (action === "SET_PAST_DUE") {
      dataToUpdate.paymentStatus = "PAST_DUE"
      dataToUpdate.status = "SUSPENDED" // Ödemesi geciken firma otomatik read-only olur
    }

    if (action === "SET_PAID") {
      dataToUpdate.paymentStatus = "PAID"
      dataToUpdate.status = "ACTIVE"
    }

    if (paymentStatus) dataToUpdate.paymentStatus = paymentStatus
    if (status) dataToUpdate.status = status

    const updated = await prisma.tenant.update({
      where: { id: tenantId },
      data: dataToUpdate,
    })

    return NextResponse.json({ success: true, data: updated })
  } catch (error) {
    console.error("Billing PATCH Hatası:", error)
    return NextResponse.json({ success: false, error: "Abonelik güncellenemedi" }, { status: 500 })
  }
}
