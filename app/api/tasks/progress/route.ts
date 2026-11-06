/**
 * © 2026 NXA Software. All rights reserved.
 * Nexa ERP - Otonom Kat/Mahal İlerleme ve İş Emri Senkronizasyon API'si
 * 
 * Saha personeli bir iş emrini tamamladığında veya ilerleme girdiğinde:
 * 1. İlgili Task'ı günceller (Fotoğraf kanıtı & durum).
 * 2. Bağlı Kat/Mahal (Zone) tamamlanma yüzdesini (progressRate / progressPercentage) otonom hesaplar.
 * 3. Ebeveyn Blok'un (Block) genel ilerlemesini ve sağlık durumunu günceller.
 * 4. Master Dashboard'un (Project Control Center) canlı okumasını sağlar.
 */

import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const {
      taskId,
      status = "COMPLETED",
      completionPhoto,
      quantityAdded,
      zoneId: incomingZoneId,
      zoneName,
      boqItemId,
      notes,
      userName,
      userRole,
      subcontractorId,
      projectId: incomingProjectId,
    } = body

    let targetTask: any = null
    let targetZoneId = incomingZoneId

    // 1. Task'ı bul ve güncelle
    if (taskId) {
      targetTask = await prisma.task.findUnique({
        where: { id: taskId },
        include: { zone: true, project: true },
      })

      if (targetTask) {
        if (!targetZoneId && targetTask.zoneId) {
          targetZoneId = targetTask.zoneId
        }

        const dbStatus =
          status === "TAMAMLANDI" || status === "DONE" || status === "COMPLETED"
            ? "COMPLETED"
            : status === "DEVAM EDİYOR" || status === "IN_PROGRESS"
            ? "IN_PROGRESS"
            : status

        targetTask = await prisma.task.update({
          where: { id: taskId },
          data: {
            status: dbStatus,
            completionPhoto: completionPhoto || targetTask.completionPhoto,
            zoneId: targetZoneId || undefined,
            description: notes ? `${targetTask.description || ""}\n${notes}` : undefined,
          },
        })
      }
    }

    // 2. Zone (Kat / Mahal) tespiti
    let targetZone: any = null
    if (targetZoneId) {
      targetZone = await prisma.zone.findUnique({
        where: { id: targetZoneId },
        include: { block: true },
      })
    }

    if (!targetZone && zoneName) {
      targetZone = await prisma.zone.findFirst({
        where: {
          name: { contains: zoneName, mode: "insensitive" },
          ...(incomingProjectId ? { block: { projectId: incomingProjectId } } : {}),
        },
        include: { block: true },
      })
    }

    // Eğer halen bulunamadıysa ilk mevcut Zone'u seç veya oluştur
    if (!targetZone) {
      targetZone = await prisma.zone.findFirst({
        include: { block: true },
        orderBy: { floorNumber: "asc" },
      })
    }

    // 3. OTONOM KAT/MAHAL İLERLEME YÜZDESİ HESABI
    let newProgressRate = 0

    if (targetZone) {
      // Bu kata bağlı görevleri say
      const zoneTasks = await prisma.task.findMany({
        where: { zoneId: targetZone.id },
      })

      if (zoneTasks.length > 0) {
        const completedCount = zoneTasks.filter(
          (t) => t.status === "COMPLETED" || t.status === "DONE" || t.status === "TAMAMLANDI"
        ).length
        newProgressRate = Math.min(100, Math.round((completedCount / zoneTasks.length) * 100))
      } else {
        // Görev bazlı değilse, miktar artışı veya kademeli artış
        const currentRate = targetZone.progressRate || 0
        const increment = quantityAdded ? Math.min(40, Number(quantityAdded) * 0.8) : 25
        newProgressRate = Math.min(100, Math.round((currentRate + increment) * 10) / 10)
      }

      // Zone tablosunu güncelle
      targetZone = await prisma.zone.update({
        where: { id: targetZone.id },
        data: {
          progressRate: newProgressRate,
          status: newProgressRate >= 100 ? "COMPLETED" : "IN_PROGRESS",
        },
        include: { block: true },
      })

      // 4. Ebeveyn Blok (Block) İlerlemesini Yeniden Hesapla
      if (targetZone.blockId) {
        const allZonesOfBlock = await prisma.zone.findMany({
          where: { blockId: targetZone.blockId },
          select: { progressRate: true },
        })

        if (allZonesOfBlock.length > 0) {
          const totalRate = allZonesOfBlock.reduce((acc, z) => acc + (z.progressRate || 0), 0)
          const avgBlockRate = Math.round((totalRate / allZonesOfBlock.length) * 10) / 10

          await prisma.block.update({
            where: { id: targetZone.blockId },
            data: {
              completionRate: avgBlockRate,
              healthStatus: avgBlockRate >= 80 ? "GREEN" : avgBlockRate >= 40 ? "YELLOW" : "GREEN",
            },
          })
        }
      }
    }

    // 5. BoqItem ve Taşeron Hakediş Entegrasyonu
    const effectiveBoqId = boqItemId || targetTask?.boqItemId
    if (effectiveBoqId && quantityAdded) {
      await prisma.boqItem.update({
        where: { id: effectiveBoqId },
        data: {
          actualQuantity: { increment: Number(quantityAdded) },
        },
      }).catch(() => null)

      // İlerleme kanıt logu
      await prisma.boqProgressLog.create({
        data: {
          boqItemId: effectiveBoqId,
          quantityAdded: Number(quantityAdded),
          notes: notes || "Mobil iş emri tamamlanması ile otomatik üretildi.",
          attachmentUrl: completionPhoto || null,
          createdByName: userName || "Saha Personeli",
          zoneId: targetZone?.id || null,
          zoneName: targetZone?.name || zoneName || null,
          subcontractorId: subcontractorId || null,
        },
      }).catch(() => null)
    }

    return NextResponse.json({
      success: true,
      message: `Kat/Mahal (${targetZone?.name || "Bölge"}) ilerlemesi %${newProgressRate} olarak güncellendi ve Master Dashboard'a yansıtıldı.`,
      progressPercentage: newProgressRate,
      zone: targetZone,
      task: targetTask,
    })
  } catch (error: any) {
    console.error("[API_TASKS_PROGRESS] Error:", error)
    return NextResponse.json(
      { error: error.message || "İlerleme kaydedilirken hata oluştu" },
      { status: 500 }
    )
  }
}
