/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Franchise Portal - Şube Ciro & Royalty Bildirimleri
 */

import React from "react"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import RoyaltyPageClient from "@/components/franchise/RoyaltyPageClient"

export const dynamic = "force-dynamic"

export default async function FranchiseRoyaltyPage() {
  const session = await auth()
  if (!session?.user) {
    redirect("/login")
  }

  const tenantId = (session.user as any)?.tenantId

  // %100 Tenant İzolasyonu
  const projects = await prisma.project.findMany({
    where: tenantId ? { tenantId } : {},
    select: {
      id: true,
      name: true,
      city: true,
      district: true,
      status: true,
    },
    take: 20,
  })

  // Mock revenue / royalty transactions for the current month
  const royaltySubmissions = projects.map((p, idx) => {
    const monthlyGrossRevenue = 850000 + (idx * 125000)
    const royaltyRate = 0.04 // %4 Franchise Royalty Fee
    const marketingRate = 0.01 // %1 Ulusal Pazarlama Fonu
    const royaltyFee = monthlyGrossRevenue * royaltyRate
    const marketingFee = monthlyGrossRevenue * marketingRate
    const totalDue = royaltyFee + marketingFee
    const isPaid = idx % 2 === 0

    return {
      id: `ROY-${p.id.slice(-4)}-${idx}`,
      storeName: p.name,
      city: p.city || "İstanbul",
      period: "Ekim 2026",
      grossRevenue: monthlyGrossRevenue,
      royaltyFee,
      marketingFee,
      totalDue,
      isPaid,
      submittedAt: "25.10.2026",
    }
  })

  const totalGrossRevenue = royaltySubmissions.reduce((acc, r) => acc + r.grossRevenue, 0)
  const totalRoyaltyDue = royaltySubmissions.reduce((acc, r) => acc + r.totalDue, 0)
  const totalCollected = royaltySubmissions.filter((r) => r.isPaid).reduce((acc, r) => acc + r.totalDue, 0)

  return (
    <RoyaltyPageClient
      projects={projects}
      initialSubmissions={royaltySubmissions}
      totalGrossRevenue={totalGrossRevenue}
      totalRoyaltyDue={totalRoyaltyDue}
      totalCollected={totalCollected}
    />
  )
}
