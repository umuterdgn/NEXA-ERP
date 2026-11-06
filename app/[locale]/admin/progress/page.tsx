/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Nexa ERP - İlerleyiş (Progress Tracking) Proje Portalı
 * Prisma Veritabanından Tüm Projelerin Canlı İlerleyiş ve BoQ Verilerini Çeker
 */

import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import ProgressProjectsClient from "./_components/ProgressProjectsClient"

export const dynamic = "force-dynamic"

export default async function ProgressOverviewPage() {
  const session = await auth()
  const tenantId = (session?.user as any)?.tenantId

  // Prisma üzerinden tüm projeleri ve alt modüllerini canlı çek (Kesinlikle mock veri yok)
  const rawProjects = await prisma.project.findMany({
    where: tenantId ? { tenantId } : {},
    include: {
      blocks: {
        select: {
          id: true,
          name: true,
          code: true,
          completionRate: true,
          healthStatus: true,
          zones: {
            select: {
              id: true,
              name: true,
              progressRate: true,
            },
          },
        },
      },
      boqItems: {
        select: {
          id: true,
          pozNo: true,
          plannedQuantity: true,
          completedQuantity: true,
          unitPrice: true,
          unit: true,
        },
      },
      _count: {
        select: {
          tasks: true,
          documents: true,
        },
      },
    },
    orderBy: { updatedAt: "desc" },
  })

  // Proje kartları için istatistikleri ve ağırlıklı ilerlemeyi hesapla
  const projects = rawProjects.map((p) => {
    let totalPlannedAmount = 0
    let totalActualAmount = 0
    let completedBoqCount = 0

    const pBoqItems = (p as any).boqItems || []
    pBoqItems.forEach((b: any) => {
      const plannedTotal = (b.plannedQuantity || 0) * (b.unitPrice || 0)
      const actualTotal = Math.min(b.completedQuantity || 0, b.plannedQuantity || 0) * (b.unitPrice || 0)
      totalPlannedAmount += plannedTotal
      totalActualAmount += actualTotal

      if (b.plannedQuantity > 0 && (b.completedQuantity || 0) >= b.plannedQuantity) {
        completedBoqCount++
      }
    })

    const calculatedProgress =
      totalPlannedAmount > 0
        ? Math.min(100, Math.round((totalActualAmount / totalPlannedAmount) * 100))
        : (p.progress ?? 0)

    const rawP = p as any
    const pBlocks = rawP.blocks || []

    return {
      id: p.id,
      name: p.name || (rawP.title as string) || "İsimsiz Şantiye Projesi",
      code: p.id.slice(-6).toUpperCase(),
      city: (rawP.city as string) || "İstanbul",
      status: p.status || "IN_PROGRESS",
      progress: calculatedProgress,
      totalBoqItems: pBoqItems.length,
      completedBoqItems: completedBoqCount,
      totalPlannedAmount,
      totalActualAmount,
      blocksCount: pBlocks.length,
      blocks: pBlocks.map((b: any) => ({
        id: b.id,
        name: b.name,
        code: b.code,
        completionRate: b.completionRate ?? 0,
        healthStatus: b.healthStatus || "GREEN",
      })),
      tasksCount: rawP._count?.tasks ?? 0,
      startDate: p.startDate ? p.startDate.toISOString().split("T")[0] : null,
      endDate: p.endDate ? p.endDate.toISOString().split("T")[0] : null,
    }
  })

  return <ProgressProjectsClient projects={projects} />
}

