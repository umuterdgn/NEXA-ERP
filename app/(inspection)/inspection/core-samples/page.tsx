/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Karot & Numune QR Takip Terminali (Server Component + Prisma)
 */

import React from "react";
import { prisma } from "@/lib/prisma";
import CoreSamplesClientTable from "@/components/inspection/CoreSamplesClientTable";

export const dynamic = "force-dynamic";

export default async function CoreSamplesPage() {
  const samples = await prisma.coreSample.findMany({
    include: {
      project: {
        select: {
          id: true,
          name: true,
          title: true,
          yibfNo: true,
          location: true,
        },
      },
      takenBy: {
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
  });

  const serializedSamples = samples.map((s: any) => ({
    ...s,
    pourDate: s.pourDate ? s.pourDate.toISOString() : null,
    testDate: s.testDate ? s.testDate.toISOString() : null,
    createdAt: s.createdAt.toISOString(),
  }));

  return <CoreSamplesClientTable initialSamples={serializedSamples as any} />;
}
