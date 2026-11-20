/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Inspection Layout - Dedicated layout for Building Inspection (Yapı Denetim) modules
 */

import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import InspectionLayoutShell from "@/components/inspection/InspectionLayoutShell"
import NextAuthSessionProvider from "@/components/providers/SessionProvider"
import { Toaster } from "react-hot-toast"
import { getDefaultWebRoute, normalizeTenantType } from "@/lib/rbac/permissions"

export const dynamic = "force-dynamic"

export default async function InspectionLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  if (!session) {
    redirect("/login")
  }

  const sessionUser = session.user as any
  const role = String(sessionUser?.role || "").toUpperCase()
  const sessionTenantType = normalizeTenantType(sessionUser?.tenantType)
  const allowedRoles = [
    "INSPECTION_ADMIN",
    "PROJECT_AUDITOR",
    "INSPECTOR",
    "LAB_TECH",
    "INSPECTION_OFFICE",
    "INSPECTION_FINANCE",
    "AUDITOR",
    "ADMIN",
    "SUPER_ADMIN",
  ]

  if (role && (!allowedRoles.includes(role) || (role === "ADMIN" && sessionTenantType !== "INSPECTION"))) {
    redirect(getDefaultWebRoute(role, sessionTenantType))
  }

  const isSuperAdmin = role === "SUPER_ADMIN"
  let primaryColor = "#3B82F6"

  // ============================================================================
  // LİSANS VE 14 GÜNLÜK DEMO KONTROLCÜSÜ (SAAS BILLING GATEWAY)
  // ============================================================================
  if (!isSuperAdmin && sessionUser?.tenantId) {
    const { prisma } = await import("@/lib/prisma")
    const tenant = await prisma.tenant.findUnique({
      where: { id: sessionUser.tenantId },
      select: {
        id: true,
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
        className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white flex flex-col"
        style={{
          '--tenant-primary': primaryColor,
        } as React.CSSProperties}
      >
        <InspectionLayoutShell>{children}</InspectionLayoutShell>
        <Toaster position="bottom-right" />
      </div>
    </NextAuthSessionProvider>
  )
}
