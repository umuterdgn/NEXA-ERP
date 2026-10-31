/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Nexa ERP - Kurumsal B2B Giriş Terminali (White-Label Server Component)
 */

import { Suspense } from "react"
import { prisma } from "@/lib/prisma"
import LoginForm, { TenantData } from "./LoginForm"

export const dynamic = "force-dynamic"

export default async function LoginPage({
  searchParams
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const resolvedSearchParams = await searchParams
  const rawTenant = resolvedSearchParams?.tenant
  const tenantParam = typeof rawTenant === "string" ? rawTenant.trim() : undefined

  let tenant: TenantData | null = null

  if (tenantParam) {
    try {
      const foundTenant = await prisma.tenant.findFirst({
        where: {
          OR: [
            { id: tenantParam },
            { slug: tenantParam }
          ]
        },
        select: {
          id: true,
          name: true,
          slug: true,
          logoUrl: true,
          type: true,
          primaryColor: true,
          isWhiteLabelActive: true
        }
      })

      if (foundTenant) {
        tenant = {
          id: foundTenant.id,
          name: foundTenant.name,
          slug: foundTenant.slug,
          logoUrl: foundTenant.logoUrl,
          type: String(foundTenant.type),
          primaryColor: foundTenant.primaryColor || "#3B82F6",
          isWhiteLabelActive: foundTenant.isWhiteLabelActive
        }
      }
    } catch (error) {
      console.error("Error fetching tenant for login:", error)
    }
  }

  return (
    <Suspense fallback={null}>
      <LoginForm tenant={tenant} />
    </Suspense>
  )
}