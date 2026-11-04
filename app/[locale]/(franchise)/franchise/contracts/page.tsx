/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Franchise Portal - Taşeron Sözleşmeleri Yönetimi
 */

import React from "react"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import ContractsPageClient from "@/components/franchise/ContractsPageClient"

export const dynamic = "force-dynamic"

export default async function FranchiseContractsPage() {
  const session = await auth()
  if (!session?.user) {
    redirect("/login")
  }

  const tenantId = (session.user as any)?.tenantId

  // %100 Tenant İzolasyonu
  const [contracts, projects] = await Promise.all([
    prisma.contract.findMany({
      where: tenantId ? { tenantId } : {},
      include: {
        project: {
          select: {
            id: true,
            name: true,
            city: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    }).catch(() => []),
    prisma.project.findMany({
      where: tenantId ? { tenantId } : {},
      select: {
        id: true,
        name: true,
        city: true,
      },
      take: 30,
    }),
  ])

  // Toplam sözleşme tutarı
  const totalValue = contracts.reduce((acc: number, c: any) => acc + (Number(c.totalAmount || c.amount || 0)), 0)

  return (
    <ContractsPageClient
      initialContracts={contracts}
      projects={projects}
      totalValue={totalValue}
    />
  )
}
