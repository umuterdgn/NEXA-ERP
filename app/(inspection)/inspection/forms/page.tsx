/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Dinamik Denetim Formları & Vize Tutanakları (Server Component + Prisma)
 */

import React from "react";
import { prisma } from "@/lib/prisma";
import InspectionFormsClientTable from "@/components/inspection/InspectionFormsClientTable";

export const dynamic = "force-dynamic";

export default async function DynamicFormsPage() {
  const [forms, projects] = await Promise.all([
    prisma.inspectionForm.findMany({
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

  const serializedForms = forms.map((f: any) => ({
    ...f,
    createdAt: f.createdAt.toISOString(),
  }));

  return <InspectionFormsClientTable initialForms={serializedForms as any} projects={projects} />;
}
