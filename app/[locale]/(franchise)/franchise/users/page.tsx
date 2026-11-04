/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Franchise Portal - Kullanıcı & Rol Yönetimi
 */

import React from "react"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import FranchiseUsersClient from "@/components/franchise/FranchiseUsersClient"

export const dynamic = "force-dynamic"

export default async function FranchiseUsersPage() {
  const session = await auth()
  if (!session?.user) {
    redirect("/login")
  }

  const tenantId = (session.user as any)?.tenantId

  // %100 Tenant İzolasyonu
  const users = await prisma.user.findMany({
    where: tenantId ? { tenantId } : {},
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      companyType: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  }).catch(() => [])

  return <FranchiseUsersClient initialUsers={users} />
}
