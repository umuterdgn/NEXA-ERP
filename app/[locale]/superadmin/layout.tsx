/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Superadmin Command Center Layout
 */

import SuperAdminLayoutShell from "@/components/super-admin/SuperAdminLayoutShell";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function SuperadminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  if (session.user?.role !== "SUPER_ADMIN" && session.user?.role !== "ADMIN") {
    redirect("/unauthorized");
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <SuperAdminLayoutShell>{children}</SuperAdminLayoutShell>
    </div>
  );
}
