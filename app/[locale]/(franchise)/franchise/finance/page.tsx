/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Franchise Portal - Kasa & Bütçe (Store Capex & Rollout Finance)
 */

import React from "react"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import FinancePageClient from "@/components/franchise/FinancePageClient"

export const dynamic = "force-dynamic"

export default async function FranchiseFinancePage() {
  const session = await auth()
  if (!session?.user) {
    redirect("/login")
  }

  const tenantId = (session.user as any)?.tenantId

  // %100 Tenant İzolasyonu
  const [projects, transactions] = await Promise.all([
    prisma.project.findMany({
      where: tenantId ? { tenantId } : {},
      select: {
        id: true,
        name: true,
        city: true,
        contractValue: true,
        totalCapex: true,
        status: true,
      },
      take: 20,
    }),
    prisma.transaction.findMany({
      where: tenantId ? { tenantId } : {},
      orderBy: { createdAt: "desc" },
      take: 30,
    }).catch(() => []),
  ])

  const totalBudget = projects.reduce((acc: number, p: any) => acc + Number(p.contractValue || p.totalCapex || 0), 0)
  const totalSpent = projects.reduce((acc: number, p: any) => acc + Number(p.totalCapex || 0), 0)

  return (
    <FinancePageClient
      projects={projects}
      transactions={transactions}
      totalBudget={totalBudget}
      totalSpent={totalSpent}
    />
  )
}
