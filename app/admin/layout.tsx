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
  let primaryColor = "#3B82F6"

  if (sessionUser?.isWhiteLabelActive && sessionUser?.primaryColor) {
    primaryColor = sessionUser.primaryColor
  } else if (sessionUser?.tenantId) {
    const tenant = await prisma.tenant.findUnique({
      where: { id: sessionUser.tenantId },
      select: { primaryColor: true, isWhiteLabelActive: true }
    }).catch(() => null)
    if (tenant?.isWhiteLabelActive && tenant?.primaryColor) {
      primaryColor = tenant.primaryColor
    }
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