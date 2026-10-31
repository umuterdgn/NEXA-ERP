/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Müteahhit 3D BIM Görüntüleyici Sayfası (/inspection/projects/[id]/bim)
 */

import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import AdminBimClient from "./AdminBimClient";

export const dynamic = "force-dynamic";

export default async function AdminBimPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = await params;
  const session = await auth();
  const userRole = session?.user?.role;
  const isSuperAdmin = userRole === "SUPER_ADMIN";
  const tenantId = (session?.user as any)?.tenantId as string | undefined;

  if (!session?.user || (!tenantId && !isSuperAdmin)) {
    redirect("/login");
  }

  const project = await prisma.project.findFirst({
    where: {
      id: resolvedParams.id,
      ...(!isSuperAdmin ? (tenantId ? { tenantId } : { tenantId: "non-existent" }) : {})
    },
    select: {
      id: true,
      title: true,
      name: true,
      yibfNo: true,
      city: true,
      district: true,
      bimModelUrl: true,
      ifcModelUrl: true,
    },
  });

  if (!project) {
    notFound();
  }

  return <AdminBimClient project={project} />;
}
