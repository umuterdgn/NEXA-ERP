/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Müteahhit 3D BIM Görüntüleyici Sayfası (/admin/projects/[id]/bim)
 */

import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { getProjectFederatedBimModels } from "@/actions/bim";
import AdminBimClient from "./AdminBimClient";

export const dynamic = "force-dynamic";

export default async function AdminBimPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = await params;
  const session = await auth();
  const userRole = (session?.user as any)?.role;
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

  // ADIM 1: Veritabanındaki gerçek federated IFC / BIM modellerini çek
  const models = await getProjectFederatedBimModels(project.id);

  return <AdminBimClient project={project} models={models} />;
}
