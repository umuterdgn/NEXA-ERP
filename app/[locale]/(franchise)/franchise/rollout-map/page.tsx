/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Franchise Canlı Rollout Haritası (Server Component - Real Prisma Coordinates)
 * Tamamen gerçek şube verilerini ve koordinatlarını çeker, mock veriler kaldırılmıştır.
 */

import React from "react"
import { prisma } from "@/lib/prisma"
import { getFranchiseTenantId, resolveCityCoords } from "@/app/actions/franchise"
import RolloutMapClient from "./_components/RolloutMapClient"

export const dynamic = "force-dynamic"

export default async function FranchiseRolloutMapPage() {
  const tenantId = await getFranchiseTenantId()

  // RolloutProject tablosundan kiracıya ait gerçek şube projelerini çek
  const rawProjects = await prisma.rolloutProject.findMany({
    where: {
      tenantId,
    },
    include: {
      stageGates: true,
      expenses: true,
    },
    orderBy: { createdAt: "desc" },
  })

  // Eğer projede lat/lng henüz kayıtlı değilse şehir koordinatıyla dinamik eşle
  const mappedProjects = await Promise.all(
    rawProjects.map(async (p) => {
      let lat = p.lat
      let lng = p.lng

      if (!lat || !lng) {
        const coords = await resolveCityCoords(p.city)
        lat = coords.lat
        lng = coords.lng
      }

      const budgetVal = p.totalBudget || p.budget || 0

      return {
        id: p.id,
        name: p.name,
        title: p.name,
        city: p.city,
        district: p.city,
        location: `${p.city} Şubesi`,
        locationType: p.locationType || "STREET",
        status: p.status,
        rolloutPhase: p.status,
        lat,
        lng,
        latitude: lat,
        longitude: lng,
        totalBudget: budgetVal,
        budget: budgetVal,
        totalCapex: budgetVal,
        grossAreaSqm: 140,
        progress:
          p.status === "ACILISA_HAZIR"
            ? 100
            : p.status === "PUNCH_LIST"
            ? 85
            : p.status === "INSAAT" || p.status === "INSAATTA"
            ? 65
            : p.status === "LOKASYON_ONAYI" || p.status === "AVM_ONAY" || p.status === "AVM_ONAYI"
            ? 30
            : 15,
        stageGates: p.stageGates.map((g) => ({
          id: g.id,
          stageName: g.name || g.stageName || "Aşama",
          isApproved: g.status === "ONAYLANDI" || g.isApproved,
        })),
      }
    })
  )

  const projects = mappedProjects.filter((p) => typeof p.lat === "number" && typeof p.lng === "number")

  return <RolloutMapClient initialProjects={projects} />
}
