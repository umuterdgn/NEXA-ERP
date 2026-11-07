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
      latitude,
      longitude,
      capturedAt,
      zoneId,
      zoneName,
      subcontractorId,
      projectId: incomingProjectId,
    } = body

    const qty = Number(quantityAdded)
    if (isNaN(qty) || qty <= 0) {
      return NextResponse.json(
        { error: "Lütfen 0'dan büyük geçerli bir ilerleme miktarı girin" },
        { status: 400 }
      )
    }

    // ADIM 1: Fotoğraf Zorunluluğu (Anti-Fraud)
    if (!photoUrl) {
      return NextResponse.json(
        { error: "Saha ilerleme girişi için fotoğraf / görsel kanıt yüklenmesi zorunludur!" },
        { status: 400 }
      )
    }

    // ADIM 1: Kat / Mahal Zorunluluğu
    if (!zoneName && !zoneId) {
      return NextResponse.json(
        { error: "İlgili Kat / Mahal seçimi zorunludur! Lütfen imalatın yapıldığı katı seçin." },
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

    // 3. BoqProgressLog tablosuna sahadan giriş kanıtını kaydet (GPS, Kat/Mahal ve Taşeron Bağlantılı)
    const progressLog = await prisma.boqProgressLog.create({
      data: {
        boqItemId: targetBoqItem.id,
        quantityAdded: qty,
        notes: notes || "Mobil uygulamadan sahadan ilerleme girişi yapıldı.",
        attachmentUrl: photoUrl || null,
        createdByName: userName || "Saha Şefi / Mühendis (Mobil)",
        latitude: latitude != null ? Number(latitude) : null,
        longitude: longitude != null ? Number(longitude) : null,
        capturedAt: capturedAt ? new Date(capturedAt) : new Date(),
        zoneId: zoneId || null,
        zoneName: zoneName || null,
        subcontractorId: subcontractorId || targetBoqItem.subcontractorId || null,
      },
    })

    // ADIM 1 & 3: İlgili Kat/Mahal (Zone) İlerlemesini Güncelle
    if (zoneId || zoneName) {
      try {
        const targetZone = zoneId
          ? await prisma.zone.findUnique({ where: { id: zoneId } })
          : await prisma.zone.findFirst({
              where: {
                name: { contains: zoneName || "" },
                block: { projectId: targetBoqItem.projectId },
              },
            })

        if (targetZone) {
          const addedRate =
            targetBoqItem.plannedQuantity > 0
              ? (qty / targetBoqItem.plannedQuantity) * 100
              : 15
          const newRate = Math.min(
            100,
            Math.round(((targetZone.progressRate || 0) + addedRate) * 10) / 10
          )
          await prisma.zone.update({
            where: { id: targetZone.id },
            data: {
              progressRate: newRate,
              status: newRate >= 100 ? "COMPLETED" : "IN_PROGRESS",
            },
          })
        }
      } catch (zoneErr) {
        console.warn("Mobile zone update warning:", zoneErr)
      }
    }

    // ADIM 2: Otomatik Taşeron Hakedişi (Progress Payment) Hesabı
    const effectiveSubId = subcontractorId || targetBoqItem.subcontractorId
    const isSubcontractorTask = Boolean(
      effectiveSubId ||
      userRole === "SUBCONTRACTOR" ||
      userName?.toLowerCase().includes("taşeron") ||
      userName?.toLowerCase().includes("usta")
    )

    if (isSubcontractorTask) {
      try {
        const unitPrice = targetBoqItem.unitPrice || 0
        const earnedAmount = qty * unitPrice
        const currentPeriod = new Date().toISOString().slice(0, 7) // "2026-11"

        const existingPayment = await prisma.progressPayment.findFirst({
          where: {
            projectId: targetBoqItem.projectId,
            period: currentPeriod,
            ...(effectiveSubId ? { subcontractorCompanyId: effectiveSubId } : {}),
          },
        })

        if (existingPayment) {
          await prisma.progressPayment.update({
            where: { id: existingPayment.id },
            data: {
              quantity: { increment: qty },
              totalAmount: { increment: earnedAmount },
              totalPrice: { increment: earnedAmount },
              amount: { increment: earnedAmount },
              netAmount: { increment: earnedAmount * 0.95 },
              netPayableAmount: { increment: earnedAmount * 0.95 },
            },
          })
        } else {
          await prisma.progressPayment.create({
            data: {
              projectId: targetBoqItem.projectId,
              subcontractorCompanyId: effectiveSubId || null,
              title: `${currentPeriod} Dönemi Taşeron Hakedişi (${targetBoqItem.pozNo} - ${zoneName || "Mobil İlerleme"})`,
              period: currentPeriod,
              quantity: qty,
              unit: targetBoqItem.unit,
              unitPrice,
              totalAmount: earnedAmount,
              totalPrice: earnedAmount,
              amount: earnedAmount,
              netAmount: earnedAmount * 0.95,
              netPayableAmount: earnedAmount * 0.95,
              status: "DRAFT",
            },
          })
        }
      } catch (payErr) {
        console.warn("Mobile progress payment calculation error:", payErr)
      }
    }

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

      // ADIM 4: Taşeron kanıt fotoğrafı yüklediğinde Punch List kaydı otomatik "Çözüldü - Onay Bekliyor" (FIXED) olur
      try {
        if (targetTask.punchListId) {
          await prisma.punchList.updateMany({
            where: { id: targetTask.punchListId },
            data: {
              status: "FIXED",
              photoUrl: photoUrl || null,
            },
          })
        } else {
          await prisma.punchList.updateMany({
            where: { taskId: targetTask.id },
            data: {
              status: "FIXED",
              photoUrl: photoUrl || null,
            },
          })
        }
      } catch (punchSyncErr) {
        console.warn("PunchList sync fallback:", punchSyncErr)
      }
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

