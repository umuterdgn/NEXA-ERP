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

  // %100 Tenant İzolasyonu (Zero Mock)
  const personnelList = await prisma.personel.findMany({
    where: tenantId ? { tenantId } : { id: "__none__" },
    select: {
      id: true,
      name: true,
      role: true,
      phone: true,
      email: true,
      username: true,
      department: true,
      status: true,
      projectId: true,
      assignedProjectIds: true,
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  }).catch(() => [])

  return <PersonnelPageClient initialPersonnel={personnelList} />
}
