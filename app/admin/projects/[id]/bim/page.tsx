/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Müteahhit 3D BIM Görüntüleyici Sayfası (/admin/projects/[id]/bim)
 */

import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import AdminBimClient from "./AdminBimClient";

export const dynamic = "force-dynamic";

export default async function AdminBimPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = await params;
  const project = await prisma.project.findUnique({
    where: { id: resolvedParams.id },
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
