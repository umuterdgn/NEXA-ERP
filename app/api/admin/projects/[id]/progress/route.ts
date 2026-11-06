/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Nexa ERP - Proje Sahadan İlerleme Girişi & Otomatik Taşeron Hakediş API'si
 * Kat/Mahal (Zone) ve Taşeron Hakedişi (Progress Payment) Entegreli
 */

import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { auth } from "@/lib/auth"

export const dynamic = "force-dynamic"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params
    const boqItems = await prisma.boqItem.findMany({
      where: { projectId },
      include: {
        progressLogs: {
          orderBy: { createdAt: "desc" },
          include: { zone: true },
        },
      },
      orderBy: { pozNo: "asc" },
    })

    return NextResponse.json({ success: true, boqItems })
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "İlerleme verileri alınamadı" },
      { status: 500 }
    )
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params
    const body = await request.json()
    const {
      boqItemId,
      quantityAdded,
      notes,
      attachmentUrl,
      createdByName,
      zoneId,
      zoneName,
      subcontractorId,
      latitude,
      longitude,
      capturedAt,
    } = body

    const qty = Number(quantityAdded)
    if (isNaN(qty) || qty <= 0) {
      return NextResponse.json(
        { error: "Lütfen 0'dan büyük geçerli bir ilerleme miktarı girin" },
        { status: 400 }
      )
    }

    // ADIM 1: Fotoğraf Zorunluluğu (Anti-Fraud)
    if (!attachmentUrl) {
      return NextResponse.json(
        { error: "Saha ilerleme girişi için kanıt fotoğrafı yüklenmesi zorunludur!" },
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

    // 1. İlgili BoQ Pozunu Bul
    let targetBoqItem = boqItemId
      ? await prisma.boqItem.findUnique({ where: { id: boqItemId } })
      : await prisma.boqItem.findFirst({ where: { projectId }, orderBy: { createdAt: "asc" } })

    if (!targetBoqItem) {
      return NextResponse.json(
        { error: "İlgili Keşif/Metraj (BoQ) kalemi bulunamadı." },
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

    // 3. Günlük İlerleme Logu (BoqProgressLog) oluştur
    const progressLog = await prisma.boqProgressLog.create({
      data: {
        boqItemId: targetBoqItem.id,
        quantityAdded: qty,
        notes: notes || null,
        attachmentUrl,
        createdByName: createdByName || "Saha Personeli",
        latitude: latitude != null ? Number(latitude) : null,
        longitude: longitude != null ? Number(longitude) : null,
        capturedAt: capturedAt ? new Date(capturedAt) : new Date(),
        zoneId: zoneId || null,
        zoneName: zoneName || null,
        subcontractorId: subcontractorId || targetBoqItem.subcontractorId || null,
      },
    })

    // 4. İlgili Kat/Mahal (Zone) İlerlemesini Güncelle
    if (zoneId || zoneName) {
      try {
        const targetZone = zoneId
          ? await prisma.zone.findUnique({ where: { id: zoneId } })
          : await prisma.zone.findFirst({
              where: {
                name: { contains: zoneName || "" },
                block: { projectId },
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
        console.warn("Zone update error:", zoneErr)
      }
    }

    // ADIM 2: Otomatik Taşeron Hakedişi (Progress Payment) Hesabı
    const effectiveSubId = subcontractorId || targetBoqItem.subcontractorId
    const isSubcontractorEntry = Boolean(
      effectiveSubId ||
      createdByName?.toLowerCase().includes("taşeron") ||
      createdByName?.toLowerCase().includes("usta")
    )

    let createdPaymentId: string | null = null

    if (isSubcontractorEntry) {
      try {
        const unitPrice = targetBoqItem.unitPrice || 0
        const earnedAmount = qty * unitPrice
        const currentPeriod = new Date().toISOString().slice(0, 7) // "2026-11"

        const existingPayment = await prisma.progressPayment.findFirst({
          where: {
            projectId,
            period: currentPeriod,
            ...(effectiveSubId ? { subcontractorCompanyId: effectiveSubId } : {}),
          },
        })

        if (existingPayment) {
          const updatedPay = await prisma.progressPayment.update({
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
          createdPaymentId = updatedPay.id
        } else {
          const newPay = await prisma.progressPayment.create({
            data: {
              projectId,
              subcontractorCompanyId: effectiveSubId || null,
              title: `${currentPeriod} Dönemi Taşeron Hakedişi (${targetBoqItem.pozNo} - ${zoneName || "Kat İmalatı"})`,
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
          createdPaymentId = newPay.id
        }
      } catch (payErr) {
        console.warn("Otomatik hakediş hesaplama uyarısı:", payErr)
      }
    }

    // 5. Cache Revalidation
    revalidatePath(`/admin/projects/${projectId}/progress`)
    revalidatePath(`/admin/project-control-center`)
    revalidatePath(`/admin/projects`)

    return NextResponse.json({
      success: true,
      message: `İlerleme başarıyla kaydedildi. Kat/Mahal güncellendi ve hakediş tutarı işlendi.`,
      logId: progressLog.id,
      newActualQuantity: updatedBoqItem.actualQuantity,
      paymentId: createdPaymentId,
    })
  } catch (error: any) {
    console.error("POST /api/admin/projects/[id]/progress error:", error)
    return NextResponse.json(
      { error: error?.message || "İlerleme kaydedilirken hata oluştu" },
      { status: 500 }
    )
  }
}

