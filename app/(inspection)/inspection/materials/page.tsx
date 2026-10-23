/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Kalite & Malzeme Onayları Terminali (Server Component + Prisma)
 */

import React from "react";
import { prisma } from "@/lib/prisma";
import MaterialsClientTable from "@/components/inspection/MaterialsClientTable";

export const dynamic = "force-dynamic";

export default async function MaterialsApprovalPage() {
  const [materials, projects] = await Promise.all([
    prisma.inspectionForm.findMany({
      where: {
        formType: "KALITE",
      },
      include: {
        project: {
          select: {
            id: true,
            title: true,
            name: true,
            yibfNo: true,
          },
        },
        inspector: {
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

  const serializedMaterials = materials.map((m: any) => ({
    ...m,
    createdAt: m.createdAt.toISOString(),
  }));

  return <MaterialsClientTable initialMaterials={serializedMaterials as any} projects={projects} />;
}
