/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Franchise Portal - Taşeron Hakedişleri & Onay Süreçleri
 */

import React from "react"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import FranchiseProgressPaymentsClient from "@/components/franchise/FranchiseProgressPaymentsClient"

export const dynamic = "force-dynamic"

export default async function FranchiseProgressPaymentsPage() {
  const session = await auth()
  if (!session?.user) {
    redirect("/login")
  }

  const tenantId = (session.user as any)?.tenantId

  // %100 Tenant İzolasyonu
  const [billings, contracts] = await Promise.all([
    prisma.progressBilling.findMany({
      where: tenantId ? { tenantId } : {},
      include: {
        contract: {
          include: {
            project: {
              select: {
                id: true,
                name: true,
                city: true,
              },
            },
            subcontractor: {
              select: {
                id: true,
                name: true,
                contactName: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    }).catch(() => []),
    prisma.contract.findMany({
      where: tenantId ? { tenantId } : {},
      include: {
        project: {
          select: { id: true, name: true },
        },
        subcontractor: {
          select: { id: true, name: true },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 30,
    }).catch(() => []),
  ])

  return (
    <FranchiseProgressPaymentsClient
      initialBillings={billings}
      contracts={contracts}
    />
  )
}
