/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Demir & Kalıp Kontrol (Vize) Terminali - Prisma Veritabanı Entegrasyonlu
 */

import React from "react";
import { prisma } from "@/lib/prisma";
import ReinforcementTableClient from "@/components/inspection/ReinforcementTableClient";

export const dynamic = "force-dynamic";

export default async function ReinforcementPage() {
  // Prisma üzerinden veritabanındaki gerçek vize tutanaklarını çek
  const rawVisas = await prisma.reinforcementVisa.findMany({
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
      inspector: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // Client Component için serialize et
  const visas = rawVisas.map((v) => ({
    ...v,
    createdAt: v.createdAt.toISOString(),
  }));

  return <ReinforcementTableClient initialVisas={visas} />;
}
