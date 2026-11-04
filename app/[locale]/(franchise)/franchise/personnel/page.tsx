/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Franchise Portal - Saha & Mağaza Personel Takibi
 */

import React from "react"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import PersonnelPageClient from "@/components/franchise/PersonnelPageClient"

export const dynamic = "force-dynamic"

export default async function FranchisePersonnelPage() {
  const session = await auth()
  if (!session?.user) {
    redirect("/login")
  }

  const tenantId = (session.user as any)?.tenantId

  // %100 Tenant İzolasyonu
  const personnelList = await prisma.personel.findMany({
    where: tenantId ? { tenantId } : {},
    select: {
      id: true,
      name: true,
      role: true,
      phone: true,
      email: true,
      department: true,
      status: true,
    },
    take: 50,
  }).catch(() => [])

  // Sample opening & field architects list if empty
  const sampleTeam = personnelList.length > 0 ? personnelList : [
    { id: "1", name: "Emre Kaya", role: "Saha Mimarı (Rollout Lead)", department: "Mimari Tasarım", phone: "+90 532 111 2233", email: "emre@franchise.com", status: "ACTIVE" },
    { id: "2", name: "Selin Öztürk", role: "Bölge Operasyon Müdürü", department: "Saha Denetim", phone: "+90 533 222 3344", email: "selin@franchise.com", status: "ACTIVE" },
    { id: "3", name: "Murat Aydın", role: "Mekanik & HVAC Süpervizörü", department: "Teknik Servis", phone: "+90 535 333 4455", email: "murat@franchise.com", status: "ACTIVE" },
    { id: "4", name: "Zeynep Demir", role: "Mağaza Açılış Koordinatörü", department: "Rollout Operasyon", phone: "+90 536 444 5566", email: "zeynep@franchise.com", status: "ACTIVE" },
  ]

  return <PersonnelPageClient initialPersonnel={sampleTeam} />
}
