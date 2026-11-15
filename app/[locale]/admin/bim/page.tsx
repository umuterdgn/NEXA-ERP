/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * This code is the property of NXA Software.
 */

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export default async function BIMPage({
  searchParams,
}: {
  searchParams?: Promise<{ projectId?: string }>;
}) {
  const resolvedParams = searchParams ? await searchParams : undefined;
  if (resolvedParams?.projectId) {
    redirect(`/admin/projects/${resolvedParams.projectId}?tab=bim`);
  }

  try {
    const session = await auth();
    const userRole = (session?.user as any)?.role;
    const isSuperAdmin = userRole === "SUPER_ADMIN";
    const tenantId = (session?.user as any)?.tenantId as string | undefined;

    const latestProject = await prisma.project.findFirst({
      where: !isSuperAdmin ? (tenantId ? { tenantId } : { tenantId: "non-existent" }) : {},
      orderBy: { createdAt: "desc" },
      select: { id: true },
    });

    if (latestProject?.id) {
      redirect(`/admin/projects/${latestProject.id}?tab=bim`);
    }
  } catch (err: any) {
    if (err?.digest?.startsWith("NEXT_REDIRECT")) {
      throw err;
    }
  }

  redirect("/admin/projects");
}
