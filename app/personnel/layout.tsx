/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * This code is the property of NXA Software.
 */

import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import PersonnelLayoutShell from "@/components/personnel/PersonnelLayoutShell"
import NextAuthSessionProvider from "@/components/providers/SessionProvider"

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
  const allowedRoles = ["WORKER", "DRIVER", "STAFF", "PERSONNEL", "SITE_MANAGER", "ENGINEER", "ADMIN", "SUPER_ADMIN"]
  const isPersonnel = allowedRoles.includes(userRole)

  if (!isPersonnel) {
    redirect("/login")
  }

  return (
    <NextAuthSessionProvider>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white">
        <PersonnelLayoutShell>{children}</PersonnelLayoutShell>
      </div>
    </NextAuthSessionProvider>
  )
}
