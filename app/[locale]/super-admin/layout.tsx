/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * This code is the property of NXA Software.
 */

import SuperAdminLayoutShell from "@/components/super-admin/SuperAdminLayoutShell"

export const dynamic = 'force-dynamic'

export default function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <SuperAdminLayoutShell>{children}</SuperAdminLayoutShell>
    </div>
  )
}

