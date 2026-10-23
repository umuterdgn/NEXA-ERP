/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Saha Kusur & Eksiklikleri Terminali (Server Component + Prisma)
 */

import React from "react";
import { prisma } from "@/lib/prisma";
import DeficienciesClientTable from "@/components/inspection/DeficienciesClientTable";

export const dynamic = "force-dynamic";

export default async function DeficienciesPage() {
  const [ncrs, projects] = await Promise.all([
    prisma.nonConformance.findMany({
      include: {
        project: {
          select: {
            id: true,
            title: true,
            name: true,
            yibfNo: true,
          },
        },
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    }),
    prisma.project.findMany({
      select: {
        id: true,
        title: true,
        name: true,
        yibfNo: true,
      },
      orderBy: {
        title: "asc",
      },
    }),
  ]);

  const serialized = ncrs.map((item: any) => ({
    ...item,
    deadline: item.deadline.toISOString(),
    createdAt: item.createdAt.toISOString(),
  }));

  return <DeficienciesClientTable initialDeficiencies={serialized as any} projects={projects} />;
}
