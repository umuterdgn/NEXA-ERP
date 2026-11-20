import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import SubcontractorLayoutShell from "@/components/subcontractor/SubcontractorLayoutShell"
import NextAuthSessionProvider from "@/components/providers/SessionProvider"
import { getDefaultWebRoute, normalizeTenantType } from "@/lib/rbac/permissions"

export const dynamic = "force-dynamic"

export default async function SubcontractorLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  if (!session) {
    redirect("/login")
  }

  const userRole = String(session.user?.role || "").toUpperCase()
  const tenantType = normalizeTenantType((session.user as any)?.tenantType)
  const allowedRoles = ["SUBCONTRACTOR", "ADMIN", "SUPER_ADMIN"]

  if (!allowedRoles.includes(userRole)) {
    redirect(getDefaultWebRoute(userRole, tenantType))
  }

  return (
    <NextAuthSessionProvider session={session}>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white">
        <SubcontractorLayoutShell>{children}</SubcontractorLayoutShell>
      </div>
    </NextAuthSessionProvider>
  )
}
