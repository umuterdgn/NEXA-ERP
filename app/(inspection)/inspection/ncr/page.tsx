/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Uygunsuzluk & DÖF (Non-Conformance Report) Terminali (Server Component + Prisma)
 */

import React from "react";
import { prisma } from "@/lib/prisma";
import NCRClientTable from "@/components/inspection/NCRClientTable";

export const dynamic = "force-dynamic";

export default async function NcrPage() {
  const [ncrs, projects] = await Promise.all([
    prisma.nonConformance.findMany({
      include: {
        project: {
          select: {
            id: true,
            title: true,
            name: true,
            yibfNo: true,
            location: true,
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

  const serializedNcrs = ncrs.map((n: any) => ({
    ...n,
    deadline: n.deadline.toISOString(),
    createdAt: n.createdAt.toISOString(),
  }));

  return <NCRClientTable initialNcrs={serializedNcrs as any} projects={projects} />;
}
