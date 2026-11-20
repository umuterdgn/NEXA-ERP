/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * This code is the property of NXA Software.
 */

import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import PersonnelLayoutShell from "@/components/personnel/PersonnelLayoutShell"
import NextAuthSessionProvider from "@/components/providers/SessionProvider"
import { getDefaultWebRoute, normalizeTenantType } from "@/lib/rbac/permissions"

export const dynamic = 'force-dynamic'

export default async function PersonnelLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  if (!session) {
    redirect("/login")
  }

  const userRole = ((session.user?.role as string) || "").toUpperCase()
  const tenantType = normalizeTenantType((session.user as any)?.tenantType)
  const allowedRoles = [
    "WORKER",
    "DRIVER",
    "STAFF",
    "PERSONNEL",
    "SITE_MANAGER",
    "ENGINEER",
    "ARCHITECT",
    "WAREHOUSE_MANAGER",
    "SECURITY",
    "EQUIPMENT_MANAGER",
    "PROJECT_MANAGER",
    "ISG_EXPERT",
    "FITOUT_SUPERVISOR",
    "FITOUT_TECH",
    "SUPPLIER",
    "ADMIN",
    "SUPER_ADMIN",
  ]
  const isPersonnel = allowedRoles.includes(userRole)

  if (!isPersonnel) {
    redirect(getDefaultWebRoute(userRole, tenantType))
  }

  return (
    <NextAuthSessionProvider session={session}>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white">
        <PersonnelLayoutShell>{children}</PersonnelLayoutShell>
      </div>
    </NextAuthSessionProvider>
  )
}
