/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Franchise Portal - Tedarikçi Firmalar (CRM & Tedarik Ağı)
 */

import React from "react"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import CrmPageClient from "@/components/franchise/CrmPageClient"

export const dynamic = "force-dynamic"

export default async function FranchiseCrmPage() {
  const session = await auth()
  if (!session?.user) {
    redirect("/login")
  }

  const tenantId = (session.user as any)?.tenantId

  // %100 Tenant İzolasyonu
  const suppliers = await prisma.company.findMany({
    where: tenantId ? { tenantId } : {},
    select: {
      id: true,
      name: true,
      type: true,
      email: true,
      phone: true,
      contactName: true,
      taxNumber: true,
      taxOffice: true,
    },
    take: 50,
  }).catch(() => [])

  return <CrmPageClient initialSuppliers={suppliers} />
}
