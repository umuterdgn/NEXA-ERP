/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Super Admin Web Trafiği & Analitik Sayfası (/superadmin/analytics)
 */

import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import AnalyticsClient from "@/components/superadmin/AnalyticsClient";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Web Trafiği & Analitik | Super Admin",
  description: "B2B SaaS ziyaretçi trafiği, referanslar ve lead dönüşüm metrikleri.",
};

export default async function AnalyticsPage() {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  const userRole = (session.user as any)?.role;
  if (userRole !== "SUPER_ADMIN" && userRole !== "ADMIN") {
    redirect("/unauthorized");
  }

  return <AnalyticsClient />;
}

