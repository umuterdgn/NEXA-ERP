/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * This code is the property of NXA Software.
 */

import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import BillingClient from "./BillingClient"

export const dynamic = 'force-dynamic'

export default async function AdminBillingPage() {
  const session = await auth()
  const userRole = session?.user?.role
  const isSuperAdmin = userRole === "SUPER_ADMIN"
  const tenantId = (session?.user as any)?.tenantId as string | undefined

  if (!session?.user || (!tenantId && !isSuperAdmin)) {
    redirect("/login")
  }

  const tenantFilter = !isSuperAdmin ? (tenantId ? { tenantId } : { tenantId: "non-existent" }) : {}

  const billings = await prisma.progressBilling.findMany({
    where: tenantFilter,
    include: {
      contract: {
        include: {
          project: {
            select: { name: true }
          },
          subcontractor: {
            select: { name: true }
          }
        }
      }
    },
    orderBy: { createdAt: "desc" }
  })

  const subcontractors = await prisma.company.findMany({
    where: {
      type: "SUBCONTRACTOR",
      ...tenantFilter
    },
    select: { id: true, name: true }
  })

  const projects = await prisma.project.findMany({
    where: {
      isActive: true,
      ...tenantFilter
    },
    select: { id: true, name: true, contractValue: true }
  })

  const formattedProjects = projects.map(p => ({
    id: p.id,
    name: p.name || "İsimsiz Proje",
    contractValue: p.contractValue || 0
  }))

  return (
    <BillingClient 
      initialBillings={billings} 
      subcontractors={subcontractors} 
      projects={formattedProjects} 
    />
  )
}
