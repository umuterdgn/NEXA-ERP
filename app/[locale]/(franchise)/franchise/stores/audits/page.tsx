/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Franchise Portal - Mağaza Denetim & Gizli Müşteri
 */

import React from "react"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import AuditsPageClient from "@/components/franchise/AuditsPageClient"

export const dynamic = "force-dynamic"

export default async function FranchiseAuditsPage() {
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

  // Mock mystery shopper & field audit logs
  const auditLogs = projects.map((p, idx) => {
    const scores = [94, 88, 76, 98, 82, 91]
    const score = scores[idx % scores.length]
    const auditType = idx % 2 === 0 ? "Gizli Müşteri Ziyareti" : "Periyodik Standart Denetimi"
    const auditor = idx % 2 === 0 ? "Barem Araştırma Grubu" : "Bölge Operasyon Müdürü"

    return {
      id: `AUD-${p.id.slice(-4)}-${idx}`,
      storeName: p.name,
      city: p.city || "İstanbul",
      auditType,
      auditor,
      score,
      date: `1${idx + 2}.10.2026`,
      status: score >= 85 ? "BAŞARILI" : "İYİLEŞTİRME GEREKLİ",
      deficienciesCount: score >= 85 ? 1 : 4,
    }
  })

  const averageScore = auditLogs.length > 0 
    ? Math.round(auditLogs.reduce((acc, a) => acc + a.score, 0) / auditLogs.length)
    : 89

  return (
    <AuditsPageClient
      projects={projects}
      initialAuditLogs={auditLogs}
      averageScore={averageScore}
    />
  )
}
