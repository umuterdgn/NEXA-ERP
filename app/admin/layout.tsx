/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * This code is the property of NXA Software.
 */

import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import AdminLayoutShell from "@/components/admin/AdminLayoutShell"
import GlobalSosBanner from "@/components/admin/GlobalSosBanner"
import { Toaster } from "react-hot-toast"
import NextAuthSessionProvider from "@/components/providers/SessionProvider"

import { prisma } from "@/lib/prisma"

export const dynamic = 'force-dynamic'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  if (!session) {
    redirect("/login")
  }

  const sessionUser = session.user as any
  const isSuperAdmin = sessionUser?.role === "SUPER_ADMIN"
  let primaryColor = "#3B82F6"

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
      if (tenant.type === "FRANCHISE") {
        redirect("/franchise/dashboard")
      }

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
    <NextAuthSessionProvider>
      <div 
        className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white flex flex-col"
        style={{
          '--tenant-primary': primaryColor,
        } as React.CSSProperties}
      >
        <GlobalSosBanner />
        <AdminLayoutShell>{children}</AdminLayoutShell>
        <Toaster position="bottom-right" />
      </div>
    </NextAuthSessionProvider>
  )
}