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

  const role = session.user?.role as string
  const allowedRoles = ["INSPECTION_ADMIN", "INSPECTOR", "AUDITOR", "ADMIN", "SUPER_ADMIN"]

  if (role && !allowedRoles.includes(role)) {
    // Diğer roller kendi portallarına yönlendirilsin
    if (role === "SUBCONTRACTOR") {
      redirect("/subcontractor")
    } else if (role === "STAFF" || role === "WORKER") {
      redirect("/personnel")
    } else {
      redirect("/admin")
    }
  }

  const sessionUser = session.user as any
  let primaryColor = "#3B82F6"

  if (sessionUser?.isWhiteLabelActive && sessionUser?.primaryColor) {
    primaryColor = sessionUser.primaryColor
  } else if (sessionUser?.tenantId) {
    const { prisma } = await import("@/lib/prisma")
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
        <InspectionLayoutShell>{children}</InspectionLayoutShell>
        <Toaster position="bottom-right" />
      </div>
    </NextAuthSessionProvider>
  )
}
