/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Yapı Denetim Dashboard (Server Component + Prisma)
 */

import React from "react";
import { prisma } from "@/lib/prisma";
import DashboardClientView from "@/components/inspection/DashboardClientView";

export const dynamic = "force-dynamic";

export default async function InspectionDashboard() {
  const [
    activeBuildings,
    totalForms,
    openNcrs,
    totalSamples,
    recentInspections,
    criticalAlerts,
  ] = await Promise.all([
    prisma.project.count(),
    prisma.inspectionForm.count(),
    prisma.nonConformance.count({ where: { status: "OPEN" } }),
    prisma.coreSample.count(),
    prisma.inspectionForm.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: {
        project: {
          select: { id: true, title: true, name: true },
        },
        inspector: {
          select: { id: true, name: true },
        },
      },
    }),
    prisma.nonConformance.findMany({
      take: 3,
      where: { status: "OPEN" },
      orderBy: { createdAt: "desc" },
      include: {
        project: {
          select: { id: true, title: true, name: true },
        },
      },
    }),
  ]);

  const serializedInspections = recentInspections.map((f: any) => ({
    ...f,
    createdAt: f.createdAt.toISOString(),
  }));

  const serializedAlerts = criticalAlerts.map((n: any) => ({
    ...n,
    deadline: n.deadline.toISOString(),
    createdAt: n.createdAt.toISOString(),
  }));

  return (
    <DashboardClientView
      stats={{
        activeBuildings,
        totalForms,
        openNcrs,
        totalSamples,
      }}
      recentInspections={serializedInspections}
      criticalAlerts={serializedAlerts}
    />
  );
}
