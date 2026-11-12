/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Super Admin Leads CRM Page (/superadmin/leads)
 */

import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import LeadsCRMClient from "@/components/superadmin/LeadsCRMClient";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Demo Talepleri & Leads CRM | Super Admin",
  description: "B2B SaaS demo talepleri ve müşteri adayı satış hunisi.",
};

export default async function LeadsPage() {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  const userRole = (session.user as any)?.role;
  if (userRole !== "SUPER_ADMIN" && userRole !== "ADMIN") {
    redirect("/unauthorized");
  }

  return <LeadsCRMClient />;
}

