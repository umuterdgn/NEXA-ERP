/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Franchise Portal - Dijital Evrak & Mağaza Arşivi
 */

import React from "react"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import DocumentsPageClient from "@/components/franchise/DocumentsPageClient"

export const dynamic = "force-dynamic"

export default async function FranchiseDocumentsPage() {
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
      status: true,
    },
    take: 20,
  })

  // Sample store legal documents
  const sampleDocs = [
    {
      title: "İşyeri Açma ve Çalışma Ruhsatı",
      store: projects[0]?.name || "Zorlu Center Şube",
      type: "Resmi Ruhsat",
      date: "14.10.2026",
      size: "2.4 MB",
    },
    {
      title: "İtfaiye Yangın Güvenlik Uygunluk Raporu",
      store: projects[1]?.name || "İskenderun Sahil Rezidans",
      type: "İtfaiye Raporu",
      date: "08.10.2026",
      size: "1.8 MB",
    },
    {
      title: "Noter Tasdikli AVM Kira Sözleşmesi",
      store: projects[2]?.name || "Bağdat Caddesi Şube",
      type: "Kira Kontratı",
      date: "28.09.2026",
      size: "4.5 MB",
    },
    {
      title: "Elektrik & Trafo Bağlantı Onay Belgesi",
      store: projects[0]?.name || "Zorlu Center Şube",
      type: "Abonelik",
      date: "20.09.2026",
      size: "1.1 MB",
    },
  ]

  return (
    <DocumentsPageClient
      projects={projects}
      initialDocs={sampleDocs}
    />
  )
}
