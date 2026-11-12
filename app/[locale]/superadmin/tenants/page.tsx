/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Super Admin Müşteri (Tenant) Yönetimi Sayfası (/superadmin/tenants)
 */

import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import TenantsManagementClient from "@/components/superadmin/TenantsManagementClient";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Müşteri (Tenant) Yönetimi | Super Admin",
  description: "SaaS kiracı firmaları, abonelik paketleri ve limit yönetimi.",
};

export default async function TenantsPage() {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  const userRole = (session.user as any)?.role;
  if (userRole !== "SUPER_ADMIN" && userRole !== "ADMIN") {
    redirect("/unauthorized");
  }

  return <TenantsManagementClient />;
}

