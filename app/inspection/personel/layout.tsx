/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Inspection Personel Layout - Server-side RBAC protection for Inspection Admin
 */

import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"

export const dynamic = "force-dynamic"

export default async function InspectionPersonelLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  if (!session) {
    redirect("/login")
  }

  const role = session.user?.role as string
  const isInspectionAdmin = role === "INSPECTION_ADMIN" || role === "SUPER_ADMIN" || role === "ADMIN"

  if (!isInspectionAdmin) {
    redirect("/inspection/dashboard")
  }

  return <>{children}</>
}
