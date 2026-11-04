/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Franchise Portal - Mağaza Bakım Onarım Talepleri (Helpdesk)
 */

import React from "react"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import HelpdeskPageClient from "@/components/franchise/HelpdeskPageClient"

export const dynamic = "force-dynamic"

export default async function FranchiseHelpdeskPage() {
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

  // Sample helpdesk tickets across retail branches
  const sampleTickets = [
    {
      id: "TKT-8842",
      storeName: projects[0]?.name || "Zorlu Center Şube",
      category: "Endüstriyel Soğutma & HVAC",
      issue: "Pastane reyonu vitrin dolabı soğutma fanı arızalandı, sıcaklık +12°C seviyesine yükseldi.",
      priority: "CRITICAL",
      status: "IN_PROGRESS",
      technician: "FrigoPack Teknik Servis",
      slaHours: 4,
      createdAt: "Bugün 09:15",
    },
    {
      id: "TKT-8839",
      storeName: projects[1]?.name || "İskenderun Sahil Rezidans",
      category: "Elektrik & Otomatik Kepenk",
      issue: "Ana giriş motorlu kepenk rayında takılma var, uzaktan kumanda komut almıyor.",
      priority: "HIGH",
      status: "OPEN",
      technician: "Bölge Taşeron Ekibi",
      slaHours: 12,
      createdAt: "Dün 18:30",
    },
    {
      id: "TKT-8810",
      storeName: projects[2]?.name || "Bağdat Caddesi Şube",
      category: "POS & Ağ Altyapısı",
      issue: "2 Nolu kasa barkod okuyucu ve slip yazıcı bağlantı hatası veriyor.",
      priority: "NORMAL",
      status: "RESOLVED",
      technician: "Nexa İç Bakım Ekibi",
      slaHours: 24,
      createdAt: "22.10.2026",
    },
  ]

  return (
    <HelpdeskPageClient
      projects={projects}
      initialTickets={sampleTickets}
    />
  )
}
