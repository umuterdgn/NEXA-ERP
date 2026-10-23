/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Ataşman & Delil Kayıtları Terminali (Server Component + Prisma)
 */

import React from "react";
import { prisma } from "@/lib/prisma";
import AttachmentClientGrid from "@/components/inspection/AttachmentClientGrid";

export const dynamic = "force-dynamic";

export default async function AttachmentPage() {
  const [attachments, projects] = await Promise.all([
    prisma.inspectionForm.findMany({
      where: {
        formType: {
          in: ["ATASMAN", "GIZLI_IMALAT", "YALITIM"],
        },
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

  const serializedAttachments = attachments.map((a: any) => ({
    ...a,
    createdAt: a.createdAt.toISOString(),
  }));

  return <AttachmentClientGrid initialAttachments={serializedAttachments as any} projects={projects} />;
}
