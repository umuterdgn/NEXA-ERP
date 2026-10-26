/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * This code is the property of NXA Software.
 */

import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

export async function GET() {
  try {
    const session = await auth()
    const userRole = session?.user?.role
    let userTenantId = (session?.user as any)?.tenantId as string | null | undefined

    if (!userTenantId && session?.user?.id) {
      const dbUser = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { tenantId: true }
      })
      userTenantId = dbUser?.tenantId || null
    }

    const isSuperAdmin = userRole === "SUPER_ADMIN"
    const tenantFilter: any = !isSuperAdmin
      ? userTenantId
        ? { tenantId: userTenantId }
        : { tenantId: "non-existent-tenant" }
      : {}

    const projectTenantFilter: any = !isSuperAdmin
      ? userTenantId
        ? { project: { tenantId: userTenantId } }
        : { project: { tenantId: "non-existent-tenant" } }
      : {}

    // 1. İstatistikler (Tenant İzolasyonlu)
    const [totalProjects, totalPersonnel, totalCompanies, totalArchives] = await Promise.all([
      prisma.project.count({ where: tenantFilter }),
      prisma.personel.count({ where: tenantFilter }),
      prisma.company.count({ where: tenantFilter }),
      prisma.documentArchive.count({ where: tenantFilter }).catch(() => 0)
    ])

    // 2. Finans (Son 6 ay - Tenant İzolasyonlu)
    const sixMonthsAgo = new Date()
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

    const transactionWhere: any = {
      date: {
        gte: sixMonthsAgo
      },
      ...(!isSuperAdmin
        ? userTenantId
          ? {
              OR: [
                { tenantId: userTenantId },
                { project: { tenantId: userTenantId } }
              ]
            }
          : { tenantId: "non-existent-tenant" }
        : {})
    }

    const transactions = await prisma.transaction.findMany({
      where: transactionWhere,
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

    // 3. Şantiye Dağılımı (Tenant İzolasyonlu)
    const personnel = await prisma.personel.findMany({
      where: tenantFilter,
      select: { currentSite: true }
    })

    const siteDistribution = personnel.reduce((acc: any, p) => {
      const site = p.currentSite || "Belirtilmemiş"
      acc[site] = (acc[site] || 0) + 1
      return acc
    }, {})

    // 4. Kritik Stoklar (Tenant İzolasyonlu)
    const criticalStocks = await prisma.stock.findMany({
      where: {
        quantity: {
          lte: 10
        },
        ...projectTenantFilter
      },
      orderBy: { quantity: 'asc' },
      take: 5,
      select: {
        id: true,
        name: true,
        quantity: true,
        unit: true
      }
    }).catch(() => [])

    // 5. Yaklaşan Ödemeler (Tenant İzolasyonlu)
    const today = new Date()
    const currentDay = today.getDate()

    const upcomingPayments = await prisma.personel.findMany({
      where: {
        ...tenantFilter,
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
        amount: p.salary * 0.14,
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
