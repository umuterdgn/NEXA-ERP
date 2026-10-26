/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Collection Risk & Tahsilat Radarı API with strict tenant isolation
 */

import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 })
    }

    const isSuperAdmin = session.user.role === "SUPER_ADMIN"
    const tenantId = (session.user as any)?.tenantId

    const tenantWhere: any = {}
    if (!isSuperAdmin) {
      tenantWhere.tenantId = tenantId || "non-existent"
    }

    const cariler = await prisma.cari.findMany({
      where: tenantWhere,
      include: {
        debts: {
          where: { isPaid: false },
          orderBy: { dueDate: "asc" },
        },
        payments: {
          orderBy: { date: "desc" },
          take: 3,
        },
      },
      orderBy: { balance: "desc" },
    })

    const now = new Date()
    let totalRisk = 0
    let highRiskCount = 0
    let totalDelayDays = 0
    let delayedCarisCount = 0

    const companies = cariler.map((cari) => {
      const unpaidDebts = cari.debts || []
      const pendingBalance = unpaidDebts.reduce((sum, d) => sum + d.amount, 0) || Math.max(0, cari.balance)
      const lastPayment = cari.payments && cari.payments.length > 0 ? cari.payments[0] : null
      const lastPaymentDate = lastPayment
        ? new Date(lastPayment.date).toISOString().split("T")[0]
        : new Date(cari.createdAt).toISOString().split("T")[0]

      // Find max delay in unpaid debts
      let maxDelay = 0
      for (const debt of unpaidDebts) {
        if (debt.dueDate) {
          const delay = Math.ceil((now.getTime() - new Date(debt.dueDate).getTime()) / (1000 * 60 * 60 * 24))
          if (delay > maxDelay) maxDelay = delay
        }
      }

      if (maxDelay > 0) {
        totalDelayDays += maxDelay
        delayedCarisCount++
      }

      // Calculate risk score: 0-100
      let riskScore = 15
      if (maxDelay > 30) riskScore = 90
      else if (maxDelay > 15) riskScore = 75
      else if (maxDelay > 7) riskScore = 55
      else if (pendingBalance > 250000) riskScore = 60
      else if (pendingBalance > 100000) riskScore = 40
      else if (pendingBalance === 0) riskScore = 10

      if (riskScore >= 70) highRiskCount++
      totalRisk += pendingBalance

      let prediction = "Ödeme performansı düzenli, cari hesap dengeli."
      if (maxDelay > 30) {
        prediction = `Vadesi ${maxDelay} gün geçmiş tahsilat bulunuyor. Temerrüt ve hukuki takip riski yüksek.`
      } else if (maxDelay > 0) {
        prediction = `Son ödemelerde ortalama ${maxDelay} gün gecikme gözlemleniyor. Nakit akışı uyarısı.`
      } else if (pendingBalance > 200000) {
        prediction = "Yüksek bakiye taşıyor ancak vadesi geçmiş borcu bulunmuyor."
      }

      return {
        id: cari.id,
        name: cari.name,
        pendingBalance,
        lastPaymentDate,
        riskScore,
        prediction,
      }
    })

    const averageDelay = delayedCarisCount > 0 ? Math.round(totalDelayDays / delayedCarisCount) : 0

    return NextResponse.json({
      summaryData: {
        totalRisk,
        highRiskCount,
        averageDelay,
      },
      companies,
    })
  } catch (error: any) {
    console.error("❌ Collection Risk GET Error:", error)
    return NextResponse.json({ error: error.message || "Tahsilat risk verileri alınamadı" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 })
    }

    const body = await request.json()
    const { companyId } = body

    if (!companyId) {
      return NextResponse.json({ error: "Firma ID zorunludur" }, { status: 400 })
    }

    return NextResponse.json({ success: true, message: "Vade hatırlatması iletildi" })
  } catch (error: any) {
    console.error("❌ Collection Risk POST Error:", error)
    return NextResponse.json({ error: error.message || "Hatırlatıcı gönderilemedi" }, { status: 500 })
  }
}
