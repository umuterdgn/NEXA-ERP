/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * This code is the property of NXA Software.
 */

import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    // 1. İstatistikler
    const [totalProjects, totalPersonnel, totalCompanies, totalArchives] = await Promise.all([
      prisma.project.count(),
      prisma.personel.count(),
      prisma.company.count(),
      prisma.archive.count()
    ])

    // 2. Finans (Son 6 ay)
    const sixMonthsAgo = new Date()
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

    const transactions = await prisma.transaction.findMany({
      where: {
        date: {
          gte: sixMonthsAgo
        }
      },
      orderBy: { date: 'asc' }
    })

    // Aylık gruplama
    const monthlyData = transactions.reduce((acc: any, t) => {
      const month = new Date(t.date).toLocaleString('tr-TR', { month: 'long', year: 'numeric' })
      if (!acc[month]) {
        acc[month] = { income: 0, expense: 0 }
      }
      if (t.type === "GELIR") {
        acc[month].income += t.amount
      } else {
        acc[month].expense += t.amount
      }
      return acc
    }, {})

    // 3. Şantiye Dağılımı
    const personnel = await prisma.personel.findMany({
      select: { currentSite: true }
    })

    const siteDistribution = personnel.reduce((acc: any, p) => {
      const site = p.currentSite || "Belirtilmemiş"
      acc[site] = (acc[site] || 0) + 1
      return acc
    }, {})

    // 4. Kritik Stoklar (quantity <= 10)
    const criticalStocks = await prisma.stock.findMany({
      where: {
        quantity: {
          lte: 10
        }
      },
      orderBy: { quantity: 'asc' },
      take: 5,
      select: {
        id: true,
        name: true,
        quantity: true,
        unit: true
      }
    })

    // 5. Yaklaşan Ödemler
    const today = new Date()
    const currentDay = today.getDate()

    const upcomingPayments = await prisma.personel.findMany({
      where: {
        OR: [
          {
            salaryPayDay: {
              not: null,
              gte: currentDay - 3,
              lte: currentDay + 3
            }
          },
          {
            sgkPayDay: {
              not: null,
              gte: currentDay - 3,
              lte: currentDay + 3
            }
          }
        ]
      },
      select: {
        id: true,
        name: true,
        salaryPayDay: true,
        sgkPayDay: true,
        salary: true
      }
    })

    const upcomingPaymentsFormatted = upcomingPayments.map(p => {
      const salaryPayment = p.salaryPayDay ? {
        type: "Maaş",
        day: p.salaryPayDay,
        amount: p.salary,
        isLate: currentDay > p.salaryPayDay
      } : null

      const sgkPayment = p.sgkPayDay ? {
        type: "SGK",
        day: p.sgkPayDay,
        amount: p.salary * 0.14, // Yaklaşık SGK oranı
        isLate: currentDay > p.sgkPayDay
      } : null

      return {
        personnel: p,
        payments: [salaryPayment, sgkPayment].filter(Boolean)
      }
    }).filter(p => p.payments.length > 0)

    return NextResponse.json({
      stats: {
        totalProjects,
        totalPersonnel,
        totalCompanies,
        totalArchives
      },
      financials: monthlyData,
      siteDistribution,
      criticalStocks,
      upcomingPayments: upcomingPaymentsFormatted
    })
  } catch (error) {
    console.error("Error fetching dashboard data:", error)
    return NextResponse.json(
      { error: "Dashboard verileri getirilirken hata oluştu" },
      { status: 500 }
    )
  }
}
