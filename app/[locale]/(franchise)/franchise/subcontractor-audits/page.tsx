/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Franchise Portal - Taşeron Denetimleri & Saha İSG/Kalite Puanlama
 */

import React from "react"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import FranchiseSubcontractorAuditsClient from "@/components/franchise/FranchiseSubcontractorAuditsClient"

export const dynamic = "force-dynamic"

export default async function FranchiseSubcontractorAuditsPage() {
  const session = await auth()
  if (!session?.user) {
    redirect("/login")
  }

  const tenantId = (session.user as any)?.tenantId

  // %100 Tenant İzolasyonu
  const [audits, projects, subcontractors] = await Promise.all([
    prisma.audit.findMany({
      where: tenantId ? { tenantId } : {},
      include: {
        project: {
          select: { id: true, name: true, title: true, city: true },
        },
        subcontractor: {
          select: { id: true, name: true, type: true },
        },
        inspector: {
          select: { id: true, name: true, position: true },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    }).catch(() => []),
    prisma.project.findMany({
      where: tenantId ? { tenantId } : {},
      select: { id: true, name: true, title: true, city: true },
      take: 30,
    }).catch(() => []),
    prisma.company.findMany({
      where: {
        type: "SUBCONTRACTOR",
        ...(tenantId ? { tenantId } : {}),
      },
      select: { id: true, name: true },
      take: 30,
    }).catch(() => []),
  ])

  return (
    <FranchiseSubcontractorAuditsClient
      initialAudits={audits}
      projects={projects}
      subcontractors={subcontractors}
    />
  )
}

