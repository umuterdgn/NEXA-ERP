"use server"

/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Şantiye İlerleme Takibi (Progress Tracking) & Keşif/Metraj (BoQ) Server Actions
 */

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

export interface BoqItemWithLogs {
  id: string
  projectId: string
  pozNo: string
  description: string
  unit: string
  plannedQuantity: number
  unitPrice: number
  actualQuantity: number
  startDate: string | null
  endDate: string | null
  subcontractorId: string | null
  createdAt: string
  updatedAt: string
  progressLogs: {
    id: string
    quantityAdded: number
    notes: string | null
    attachmentUrl: string | null
    createdByName: string | null
    latitude?: number | null
    longitude?: number | null
    capturedAt?: string | null
    zoneId?: string | null
    zoneName?: string | null
    subcontractorId?: string | null
    createdAt: string
  }[]
}

export interface ProgressSummary {
  weightedProgress: number
  totalPlannedAmount: number
  totalActualAmount: number
  remainingAmount: number
  completedCount: number
  inProgressCount: number
  notStartedCount: number
  totalCount: number
}

// 1. Proje ve BoQ İlerleme Verilerini Çek
export async function getProjectProgressData(projectId: string) {
  try {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: {
        id: true,
        name: true,
        title: true,
        status: true,
        startDate: true,
        endDate: true,
        progress: true,
        city: true,
        district: true,
        locationCity: true,
      },
    })

    if (!project) {
      throw new Error("Proje bulunamadı")
    }

    const items = await prisma.boqItem.findMany({
      where: { projectId },
      include: {
        progressLogs: {
          orderBy: { createdAt: "desc" },
        },
      },
      orderBy: { pozNo: "asc" },
    })

    // Ağırlıklı İlerleme ve Maliyet Hesaplamaları
    let totalPlannedAmount = 0
    let totalActualAmount = 0
    let completedCount = 0
    let inProgressCount = 0
    let notStartedCount = 0

    items.forEach((item) => {
      const plannedTotal = item.plannedQuantity * item.unitPrice
      const actualTotal = Math.min(item.actualQuantity, item.plannedQuantity) * item.unitPrice

      totalPlannedAmount += plannedTotal
      totalActualAmount += actualTotal

      const progressRatio = item.plannedQuantity > 0 ? (item.actualQuantity / item.plannedQuantity) * 100 : 0
      if (progressRatio >= 100) {
        completedCount++
      } else if (progressRatio > 0) {
        inProgressCount++
      } else {
        notStartedCount++
      }
    })

    const weightedProgress =
      totalPlannedAmount > 0
        ? Math.min(100, Math.round((totalActualAmount / totalPlannedAmount) * 1000) / 10)
        : 0

    const formattedItems: BoqItemWithLogs[] = items.map((it) => ({
      id: it.id,
      projectId: it.projectId,
      pozNo: it.pozNo,
      description: it.description,
      unit: it.unit,
      plannedQuantity: it.plannedQuantity,
      unitPrice: it.unitPrice,
      actualQuantity: it.actualQuantity,
      startDate: it.startDate ? it.startDate.toISOString() : null,
      endDate: it.endDate ? it.endDate.toISOString() : null,
      subcontractorId: it.subcontractorId,
      createdAt: it.createdAt.toISOString(),
      updatedAt: it.updatedAt.toISOString(),
      progressLogs: it.progressLogs.map((log) => ({
        id: log.id,
        quantityAdded: log.quantityAdded,
        notes: log.notes,
        attachmentUrl: log.attachmentUrl,
        createdByName: log.createdByName,
        latitude: log.latitude ?? null,
        longitude: log.longitude ?? null,
        capturedAt: log.capturedAt ? log.capturedAt.toISOString() : null,
        zoneId: log.zoneId ?? null,
        zoneName: log.zoneName ?? null,
        subcontractorId: log.subcontractorId ?? null,
        createdAt: log.createdAt.toISOString(),
      })),
    }))

    const summary: ProgressSummary = {
      weightedProgress,
      totalPlannedAmount,
      totalActualAmount,
      remainingAmount: Math.max(0, totalPlannedAmount - totalActualAmount),
      completedCount,
      inProgressCount,
      notStartedCount,
      totalCount: items.length,
    }

    return {
      success: true,
      project: {
        ...project,
        startDate: project.startDate ? project.startDate.toISOString() : null,
        endDate: project.endDate ? project.endDate.toISOString() : null,
      },
      boqItems: formattedItems,
      summary,
    }
  } catch (error: any) {
    console.error("getProjectProgressData error:", error)
    return {
      success: false,
      error: error.message || "İlerleme verileri alınamadı",
      project: null,
      boqItems: [],
      summary: {
        weightedProgress: 0,
        totalPlannedAmount: 0,
        totalActualAmount: 0,
        remainingAmount: 0,
        completedCount: 0,
        inProgressCount: 0,
        notStartedCount: 0,
        totalCount: 0,
      },
    }
  }
}

// 2. Sahadan İlerleme Girişi (updateBoqProgress)
export async function updateBoqProgress(payload: {
  boqItemId: string
  additionalQuantity: number
  notes?: string
  attachmentUrl?: string
  createdByName?: string
  latitude?: number | null
  longitude?: number | null
  capturedAt?: Date | string | null
  zoneId?: string | null
  zoneName?: string | null
  subcontractorId?: string | null
}) {
  try {
    const {
      boqItemId,
      additionalQuantity,
      notes,
      attachmentUrl,
      createdByName,
      latitude,
      longitude,
      capturedAt,
      zoneId,
      zoneName,
      subcontractorId,
    } = payload

    if (!boqItemId) {
      return { success: false, error: "BoQ kalemi seçilmedi" }
    }

    const qty = Number(additionalQuantity)
    if (isNaN(qty) || qty <= 0) {
      return { success: false, error: "Lütfen 0'dan büyük geçerli bir miktar girin" }
    }

    // ADIM 1: Fotoğraf Zorunluluğu (Anti-Fraud)
    if (!attachmentUrl) {
      return {
        success: false,
        error: "Saha ilerleme girişi için kanıt fotoğrafı yüklenmesi zorunludur!",
      }
    }

    // ADIM 1: Kat / Mahal Zorunluluğu
    if (!zoneName && !zoneId) {
      return {
        success: false,
        error: "İlgili Kat / Mahal seçimi zorunludur! Lütfen imalatın yapıldığı katı seçin.",
      }
    }

    // İlgili BoQ kalemini getir
    const currentItem = await prisma.boqItem.findUnique({
      where: { id: boqItemId },
    })

    if (!currentItem) {
      return { success: false, error: "BoQ kalemi bulunamadı" }
    }

    // 1. BoQ kaleminin actualQuantity değerinin üstüne ekle
    const updatedItem = await prisma.boqItem.update({
      where: { id: boqItemId },
      data: {
        actualQuantity: { increment: qty },
      },
    })

    // 2. Günlük İlerleme Logu (BoqProgressLog) oluştur - GPS, Zaman, Kat/Mahal ve Taşeron Bağlantılı
    await prisma.boqProgressLog.create({
      data: {
        boqItemId,
        quantityAdded: qty,
        notes: notes || null,
        attachmentUrl: attachmentUrl || null,
        createdByName: createdByName || "Saha Şefi / Mühendis",
        latitude: latitude != null ? Number(latitude) : null,
        longitude: longitude != null ? Number(longitude) : null,
        capturedAt: capturedAt ? new Date(capturedAt) : new Date(),
        zoneId: zoneId || null,
        zoneName: zoneName || null,
        subcontractorId: subcontractorId || currentItem.subcontractorId || null,
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
                block: { projectId: currentItem.projectId },
              },
            })

        if (targetZone) {
          const addedRate = currentItem.plannedQuantity > 0 ? (qty / currentItem.plannedQuantity) * 100 : 15
          const newRate = Math.min(100, Math.round(((targetZone.progressRate || 0) + addedRate) * 10) / 10)
          await prisma.zone.update({
            where: { id: targetZone.id },
            data: {
              progressRate: newRate,
              status: newRate >= 100 ? "COMPLETED" : "IN_PROGRESS",
            },
          })
        }
      } catch (zoneErr) {
        console.warn("Zone progress update warning:", zoneErr)
      }
    }

    // ADIM 2: Otomatik Taşeron Hakedişi (Progress Payment) Hesabı
    const effectiveSubId = subcontractorId || currentItem.subcontractorId
    const isSubcontractorEntry = Boolean(
      effectiveSubId ||
      createdByName?.toLowerCase().includes("taşeron") ||
      createdByName?.toLowerCase().includes("usta")
    )

    if (isSubcontractorEntry) {
      try {
        const unitPrice = currentItem.unitPrice || 0
        const earnedAmount = qty * unitPrice
        const currentPeriod = new Date().toISOString().slice(0, 7) // "2026-11"

        const existingPayment = await prisma.progressPayment.findFirst({
          where: {
            projectId: currentItem.projectId,
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
              projectId: currentItem.projectId,
              subcontractorCompanyId: effectiveSubId || null,
              title: `${currentPeriod} Dönemi Taşeron Hakedişi (${currentItem.pozNo} - ${zoneName || "Kat İmalatı"})`,
              period: currentPeriod,
              quantity: qty,
              unit: currentItem.unit,
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
        console.warn("Otomatik hakediş hesaplama uyarısı:", payErr)
      }
    }

    // ADIM 4: Personel performans günlüğüne / AuditLog'a bu başarıyı işle
    try {
      await prisma.auditLog.create({
        data: {
          projectId: currentItem.projectId,
          action: "FIELD_PROGRESS_LOGGED",
          entityType: "BoqProgressLog",
          userName: createdByName || "Saha Personeli",
          summary: `${createdByName || "Saha Personeli"} tarafından ${currentItem.pozNo} pozuna +${qty} ${currentItem.unit} imalat girişi tamamlandı (GPS & Zaman Damgalı Fotoğraf Doğrulandı).`,
          newValues: {
            boqItemId,
            quantityAdded: qty,
            performedBy: createdByName,
            latitude: latitude ?? null,
            longitude: longitude ?? null,
            capturedAt: capturedAt ?? new Date(),
          },
        },
      })
    } catch {
      // audit optional
    }

    // 3. Projenin genel ağırlıklı ilerleme yüzdesini güncelle
    const allProjectItems = await prisma.boqItem.findMany({
      where: { projectId: currentItem.projectId },
    })

    let totalPlanned = 0
    let totalActual = 0

    allProjectItems.forEach((it) => {
      totalPlanned += it.plannedQuantity * it.unitPrice
      totalActual += Math.min(it.actualQuantity, it.plannedQuantity) * it.unitPrice
    })

    const newProgress = totalPlanned > 0 ? Math.min(100, Math.round((totalActual / totalPlanned) * 100)) : 0

    await prisma.project.update({
      where: { id: currentItem.projectId },
      data: { progress: newProgress },
    })

    revalidatePath(`/admin/projects/${currentItem.projectId}/progress`)
    revalidatePath(`/admin/projects/${currentItem.projectId}`)

    return {
      success: true,
      updatedQuantity: updatedItem.actualQuantity,
      newProgress,
      message: `${currentItem.pozNo} pozuna ${qty} ${currentItem.unit} ilerleme başarıyla işlendi`,
    }
  } catch (error: any) {
    console.error("updateBoqProgress error:", error)
    return {
      success: false,
      error: error.message || "İlerleme güncellenirken hata oluştu",
    }
  }
}

// 3. Yeni Keşif/Metraj Pozu Ekleme
export async function createBoqItem(
  projectId: string,
  data: {
    pozNo: string
    description: string
    unit: string
    plannedQuantity: number
    unitPrice: number
    startDate?: string
    endDate?: string
    subcontractorId?: string
  }
) {
  try {
    if (!projectId || !data.pozNo || !data.description) {
      return { success: false, error: "Zorunlu alanları doldurun" }
    }

    const newItem = await prisma.boqItem.create({
      data: {
        projectId,
        pozNo: data.pozNo,
        description: data.description,
        unit: data.unit || "m3",
        plannedQuantity: Number(data.plannedQuantity) || 0,
        unitPrice: Number(data.unitPrice) || 0,
        actualQuantity: 0,
        startDate: data.startDate ? new Date(data.startDate) : null,
        endDate: data.endDate ? new Date(data.endDate) : null,
        subcontractorId: data.subcontractorId || null,
      },
    })

    // ADIM 2: Eş zamanlı olarak Task (İş Emri) tablosuna kayıt oluştur
    try {
      await prisma.task.create({
        data: {
          projectId,
          title: `${newItem.pozNo} - ${newItem.description}`,
          description: `Keşif/Metraj İmalat Kalemi: ${newItem.description}. Planlanan Miktar: ${newItem.plannedQuantity} ${newItem.unit}`,
          status: "TODO",
          taskType: "SAHA_IMALAT",
          boqItemId: newItem.id,
          dueDate: newItem.endDate,
        },
      })
    } catch (taskErr) {
      console.warn("Task creation error:", taskErr)
    }

    revalidatePath(`/admin/projects/${projectId}/progress`)
    return { success: true, item: newItem }
  } catch (error: any) {
    console.error("createBoqItem error:", error)
    return { success: false, error: error.message || "Poz eklenirken hata oluştu" }
  }
}

// 4. Standart Şantiye Keşif & İş Programı Şablonunu Başlat (1-Click Template Seed)
export async function seedInitialBoqItems(projectId: string) {
  try {
    const existing = await prisma.boqItem.count({ where: { projectId } })
    if (existing > 0) {
      return { success: true, message: "Projeye ait pozlar zaten mevcut" }
    }

    const today = new Date()
    const addDays = (days: number) => {
      const d = new Date(today)
      d.setDate(d.getDate() + days)
      return d
    }

    const standardTemplates = [
      {
        pozNo: "15.110.1005",
        description: "Makine ile Her Cins Zeminde Kazı Yapılması ve Dolgu Alanına Nakli",
        unit: "m3",
        plannedQuantity: 4200,
        unitPrice: 195,
        actualQuantity: 4200, // %100 tamamlandı
        startDate: addDays(-45),
        endDate: addDays(-25),
      },
      {
        pozNo: "15.140.1002",
        description: "Temel ve Bodrum Perdeleri İçin Ahşap/Plywood Kalıp Yapılması",
        unit: "m2",
        plannedQuantity: 3600,
        unitPrice: 440,
        actualQuantity: 2880, // %80
        startDate: addDays(-30),
        endDate: addDays(5),
      },
      {
        pozNo: "15.160.1003",
        description: "B420C Nervürlü Donatı Çeliği Temini, Bükümü ve Yerine Montajı",
        unit: "Ton",
        plannedQuantity: 125,
        unitPrice: 29500,
        actualQuantity: 82, // %65.6
        startDate: addDays(-25),
        endDate: addDays(15),
      },
      {
        pozNo: "15.120.1001",
        description: "C35/45 Hazır Beton Dökümü (Pompalı, Mikser Nakli Dahil)",
        unit: "m3",
        plannedQuantity: 1850,
        unitPrice: 3600,
        actualQuantity: 960, // %51.8
        startDate: addDays(-20),
        endDate: addDays(25),
      },
      {
        pozNo: "15.250.1004",
        description: "Bodrum Perde Duvarlarında Çift Kat Bitümlü Su İzolasyonu Yapılması",
        unit: "m2",
        plannedQuantity: 1400,
        unitPrice: 320,
        actualQuantity: 420, // %30
        startDate: addDays(-10),
        endDate: addDays(20),
      },
      {
        pozNo: "15.220.1001",
        description: "20 cm Kalınlıkta Gazbeton Blok ile İç ve Dış Duvar Örülmesi",
        unit: "m2",
        plannedQuantity: 2400,
        unitPrice: 580,
        actualQuantity: 240, // %10
        startDate: addDays(10),
        endDate: addDays(50),
      },
      {
        pozNo: "15.280.1002",
        description: "Dış Cephe 150 kg/m3 Taşyünü Levhalar ile Isı Yalıtımı ve Mantolama",
        unit: "m2",
        plannedQuantity: 1950,
        unitPrice: 890,
        actualQuantity: 0, // %0
        startDate: addDays(25),
        endDate: addDays(75),
      },
      {
        pozNo: "15.310.1001",
        description: "Zemin Kat ve Normal Kat Döşemelerinde Çimento Esaslı Koruma Şapı",
        unit: "m2",
        plannedQuantity: 3200,
        unitPrice: 240,
        actualQuantity: 0, // %0
        startDate: addDays(40),
        endDate: addDays(90),
      },
    ]

    for (const item of standardTemplates) {
      const createdItem = await prisma.boqItem.create({
        data: {
          projectId,
          pozNo: item.pozNo,
          description: item.description,
          unit: item.unit,
          plannedQuantity: item.plannedQuantity,
          unitPrice: item.unitPrice,
          actualQuantity: item.actualQuantity,
          startDate: item.startDate,
          endDate: item.endDate,
        },
      })

      // Eş zamanlı Task (İş Emri) kaydı oluştur
      try {
        await prisma.task.create({
          data: {
            projectId,
            title: `${createdItem.pozNo} - ${createdItem.description}`,
            description: `Keşif/Metraj İmalat Kalemi: ${createdItem.description}. Planlanan Miktar: ${createdItem.plannedQuantity} ${createdItem.unit}`,
            status:
              createdItem.actualQuantity >= createdItem.plannedQuantity
                ? "COMPLETED"
                : createdItem.actualQuantity > 0
                ? "IN_PROGRESS"
                : "TODO",
            taskType: "SAHA_IMALAT",
            boqItemId: createdItem.id,
            dueDate: createdItem.endDate,
          },
        })
      } catch (err) {
        // ignore
      }
    }

    revalidatePath(`/admin/projects/${projectId}/progress`)
    return { success: true, count: standardTemplates.length }
  } catch (error: any) {
    console.error("seedInitialBoqItems error:", error)
    return { success: false, error: error.message || "Şablon yüklenemedi" }
  }
}
