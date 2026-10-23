/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * e-YİBF (Yapı İzleme Belgesi Formu) Merkezi Yönetim Paneli (Server Component + Prisma)
 */

import React from "react";
import { prisma } from "@/lib/prisma";
import YibfClientList from "@/components/inspection/YibfClientList";

export const dynamic = "force-dynamic";

export default async function YibfListPage() {
  const projects = await prisma.project.findMany({
    select: {
      id: true,
      yibfNo: true,
      title: true,
      name: true,
      location: true,
      city: true,
      district: true,
      totalArea: true,
      progress: true,
      status: true,
      createdAt: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  const serializedProjects = projects.map((p: any) => ({
    ...p,
    createdAt: p.createdAt.toISOString(),
  }));

  return <YibfClientList initialList={serializedProjects as any} />;
}
