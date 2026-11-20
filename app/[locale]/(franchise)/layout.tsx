/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Franchise Portal Layout - Isolated Portal Layout for Multi-Store / Retail Chains
 */

import React from "react"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import FranchiseLayoutShell from "@/components/franchise/FranchiseLayoutShell"
import NextAuthSessionProvider from "@/components/providers/SessionProvider"
import { Toaster } from "react-hot-toast"
import { prisma } from "@/lib/prisma"
import { getDefaultWebRoute, normalizeTenantType } from "@/lib/rbac/permissions"

export const dynamic = "force-dynamic"

export default async function FranchisePortalLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  if (!session) {
    redirect("/login")
  }

  const sessionUser = session.user as any
  const userRole = String(sessionUser?.role || "").toUpperCase()
  const sessionTenantType = normalizeTenantType(sessionUser?.tenantType)
  const isSuperAdmin = userRole === "SUPER_ADMIN"
  let primaryColor = "#F59E0B" // Amber-500 default for Franchise Hub

  const allowedFranchiseRoles = [
    "FRANCHISE_ADMIN",
    "REGIONAL_MANAGER",
    "FRANCHISEE",
    "FITOUT_SUPERVISOR",
    "FITOUT_TECH",
    "BRANCH_MANAGER",
    "ADMIN",
    "SUPER_ADMIN",
  ]
  if (!isSuperAdmin && (!allowedFranchiseRoles.includes(userRole) || (userRole === "ADMIN" && sessionTenantType !== "FRANCHISE"))) {
    redirect(getDefaultWebRoute(userRole, sessionTenantType))
  }

  // ============================================================================
  // LİSANS VE 14 GÜNLÜK DEMO KONTROLCÜSÜ (SAAS BILLING GATEWAY)
  // ============================================================================
  if (!isSuperAdmin && sessionUser?.tenantId) {
    const tenant = await prisma.tenant.findUnique({
      where: { id: sessionUser.tenantId },
      select: {
        id: true,
        type: true,
        primaryColor: true,
        isWhiteLabelActive: true,
        subscriptionStatus: true,
        trialEndsAt: true,
        isTrial: true,
        status: true,
        isActive: true,
      }
    }).catch(() => null)

    if (tenant) {
      const isTrialExpired = Boolean(
        tenant.isTrial && tenant.trialEndsAt && new Date(tenant.trialEndsAt) < new Date()
      )
      const isSubscriptionExpired = 
        tenant.subscriptionStatus === "EXPIRED" || 
        tenant.status === "SUSPENDED" ||
        tenant.isActive === false

      if (isTrialExpired || isSubscriptionExpired) {
        redirect("/expired")
      }

      if (tenant.isWhiteLabelActive && tenant.primaryColor) {
        primaryColor = tenant.primaryColor
      }
    }
  } else if (sessionUser?.isWhiteLabelActive && sessionUser?.primaryColor) {
    primaryColor = sessionUser.primaryColor
  }

  return (
    <NextAuthSessionProvider session={session}>
      <div 
        className="h-screen overflow-hidden bg-slate-950 text-white flex flex-col selection:bg-amber-500 selection:text-white"
        style={{
          "--tenant-primary": primaryColor,
        } as React.CSSProperties}
      >
        <FranchiseLayoutShell>{children}</FranchiseLayoutShell>
        <Toaster position="bottom-right" />
      </div>
    </NextAuthSessionProvider>
  )
}
