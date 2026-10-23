/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Denetlenen Yapılar & Projeler Portföyü (Server Component + Prisma)
 */

import React from "react";
import { prisma } from "@/lib/prisma";
import ProjectsClientGrid from "@/components/inspection/ProjectsClientGrid";

export const dynamic = "force-dynamic";

export default async function InspectedProjectsPage() {
  const projects = await prisma.project.findMany({
    select: {
      id: true,
      name: true,
      title: true,
      description: true,
      yibfNo: true,
      city: true,
      district: true,
      location: true,
      status: true,
      progress: true,
      totalArea: true,
      buildingClass: true,
      yapiSinifi: true,
      ada: true,
      parsel: true,
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

  return <ProjectsClientGrid initialProjects={serializedProjects as any} />;
}
