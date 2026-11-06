/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Nexa ERP Mobil - Sahadan İlerleme Girişi (Task & BoQ Sync API)
 * Mobil uygulamanın girdiği ilerlemeyi veritabanında BoqItem ve Task tablolarına işler,
 * Web panelindeki Gantt şemasını ve proje ilerlemesini anında günceller.
 */

import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

export const dynamic = "force-dynamic"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const {
      taskId,
      boqItemId,
      quantityAdded,
      notes,
      photoUrl,
      userName,
      userRole,
      projectId: incomingProjectId,
    } = body

    const qty = Number(quantityAdded)
    if (isNaN(qty) || qty <= 0) {
      return NextResponse.json(
        { error: "Lütfen 0'dan büyük geçerli bir ilerleme miktarı girin" },
        { status: 400 }
      )
    }

    let targetBoqItem: any = null
    let targetTask: any = null

    // 1. Task veya boqItemId üzerinden ilgili BoQ Pozunu tespit et
    if (taskId) {
      targetTask = await prisma.task.findUnique({
        where: { id: taskId },
      })
      if (targetTask?.boqItemId) {
        targetBoqItem = await prisma.boqItem.findUnique({
          where: { id: targetTask.boqItemId },
        })
      }
    }

    if (!targetBoqItem && boqItemId) {
      targetBoqItem = await prisma.boqItem.findUnique({
        where: { id: boqItemId },
      })
    }

    // Poz doğrudan bulunamadıysa proje üzerinden fallback eşleme
    if (!targetBoqItem && (targetTask?.projectId || incomingProjectId)) {
      const pId = targetTask?.projectId || incomingProjectId
      targetBoqItem = await prisma.boqItem.findFirst({
        where: { projectId: pId },
        orderBy: { createdAt: "asc" },
      })
    }

    if (!targetBoqItem) {
      return NextResponse.json(
        { error: "Bu göreve bağlı bir Keşif/Metraj (BoQ) kalemi bulunamadı." },
        { status: 404 }
      )
    }

    // 2. BoqItem'ın actualQuantity (mevcut gerçekleşen) değerini toplayarak güncelle
    const updatedBoqItem = await prisma.boqItem.update({
      where: { id: targetBoqItem.id },
      data: {
        actualQuantity: { increment: qty },
      },
    })

    // 3. BoqProgressLog tablosuna sahadan giriş kanıtını kaydet
    const progressLog = await prisma.boqProgressLog.create({
      data: {
        boqItemId: targetBoqItem.id,
        quantityAdded: qty,
        notes: notes || "Mobil uygulamadan sahadan ilerleme girişi yapıldı.",
        attachmentUrl: photoUrl || null,
        createdByName: userName || "Saha Şefi / Mühendis (Mobil)",
      },
    })

    // 4. İlerleme yüzdesi hesapla
    const completionRate =
      targetBoqItem.plannedQuantity > 0
        ? Math.min(
            100,
            Math.round(
              (updatedBoqItem.actualQuantity / targetBoqItem.plannedQuantity) * 100
            )
          )
        : 100

    // 5. Bağlı Task (İş Emri) durumunu güncelle
    if (targetTask) {
      await prisma.task.update({
        where: { id: targetTask.id },
        data: {
          status: completionRate >= 100 ? "COMPLETED" : "IN_PROGRESS",
          completionPhoto: photoUrl || null,
        },
      })
    }

    // 6. Projenin genel ağırlıklı ilerlemesini (Gantt) güncelle
    let newProjectProgress = 0
    try {
      const allBoqItems = await prisma.boqItem.findMany({
        where: { projectId: targetBoqItem.projectId },
      })

      let totalPlannedAmount = 0
      let totalActualAmount = 0

      allBoqItems.forEach((it) => {
        totalPlannedAmount += it.plannedQuantity * it.unitPrice
        totalActualAmount +=
          Math.min(it.actualQuantity, it.plannedQuantity) * it.unitPrice
      })

      newProjectProgress =
        totalPlannedAmount > 0
          ? Math.min(100, Math.round((totalActualAmount / totalPlannedAmount) * 100))
          : 0

      await prisma.project.update({
        where: { id: targetBoqItem.projectId },
        data: { progress: newProjectProgress },
      })

      // İlgili ProjectTask (Gantt bar) varsa onun da yüzdesini güncelle
      await prisma.projectTask.updateMany({
        where: {
          projectId: targetBoqItem.projectId,
          name: { contains: targetBoqItem.pozNo },
        },
        data: {
          progress: completionRate,
        },
      })
    } catch (projErr) {
      console.warn("Project progress update warning:", projErr)
    }

    // 7. Web arayüzü rotalarını anında revalidate et
    revalidatePath(`/admin/projects/${targetBoqItem.projectId}/progress`)
    revalidatePath(`/admin/projects/${targetBoqItem.projectId}`)
    revalidatePath(`/admin/projects`)

    return NextResponse.json({
      success: true,
      message: `Sahadan ${qty} ${targetBoqItem.unit} ilerleme başarıyla işlendi. Web Gantt şeması güncellendi.`,
      boqItemId: targetBoqItem.id,
      pozNo: targetBoqItem.pozNo,
      newActualQuantity: updatedBoqItem.actualQuantity,
      completionRate,
      projectProgress: newProjectProgress,
      logId: progressLog.id,
    })
  } catch (error: any) {
    console.error("Mobile task progress API error:", error)
    return NextResponse.json(
      { error: error?.message || "İlerleme kaydedilirken hata oluştu" },
      { status: 500 }
    )
  }
}

