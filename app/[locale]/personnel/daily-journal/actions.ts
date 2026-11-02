/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Field Engineer Daily Construction Journal Server Actions
 */

"use server"

import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { revalidatePath } from "next/cache"
import { writeFile, mkdir } from "fs/promises"
import { existsSync } from "fs"
import path from "path"

export async function getJournalInitialData(projectId?: string) {
  try {
    const projects = await prisma.project.findMany({
      select: {
        id: true,
        name: true,
        title: true,
        city: true,
        latitude: true,
        longitude: true,
        locationCity: true
      },
      orderBy: { createdAt: "desc" }
    })

    const targetProjectId = projectId || (projects.length > 0 ? projects[0].id : null)

    let boqItems: any[] = []
    if (targetProjectId) {
      try {
        const qItems = await prisma.boQItem.findMany({
          where: {
            OR: [
              { projectId: targetProjectId },
              { projectId: null },
            ],
          },
          orderBy: { createdAt: "desc" },
        })
        boqItems = qItems.map((item) => ({
          id: item.id,
          pozNo: item.pozNo || item.itemCode || "POZ",
          description: item.description,
          unit: item.unit,
          plannedQuantity: item.plannedQuantity || item.contractQuantity || 0,
          completedQuantity: item.completedQuantity || 0,
          unitPrice: item.unitPrice,
        }))
      } catch (e) {
        console.error("Failed to fetch boQItem in getJournalInitialData:", e)
      }

      if (!boqItems || boqItems.length === 0) {
        try {
          const lowerItems = await prisma.boqItem.findMany({
            where: { projectId: targetProjectId },
            orderBy: { pozNo: "asc" },
          })
          boqItems = lowerItems.map((item) => ({
            id: item.id,
            pozNo: item.pozNo,
            description: item.description,
            unit: item.unit,
            plannedQuantity: item.plannedQuantity,
            completedQuantity: item.actualQuantity,
            unitPrice: item.unitPrice,
          }))
        } catch {}
      }
    }

    return {
      success: true,
      projects,
      boqItems,
      selectedProjectId: targetProjectId,
    }
  } catch (error: any) {
    console.error("getJournalInitialData error:", error)
    return { success: false, projects: [], boqItems: [], error: error?.message }
  }
}

/**
 * Projeye ait BoQ (Keşif & Metraj) listesini getiren Server Action
 */
export async function getProjectBoqItems(projectId: string) {
  try {
    let items: any[] = []
    try {
      const qItems = await prisma.boQItem.findMany({
        where: {
          OR: [
            { projectId },
            { projectId: null },
          ],
        },
        orderBy: { createdAt: "desc" },
      })
      items = qItems.map((item) => ({
        id: item.id,
        pozNo: item.pozNo || item.itemCode || "POZ",
        description: item.description,
        unit: item.unit,
        plannedQuantity: item.plannedQuantity || item.contractQuantity || 0,
        completedQuantity: item.completedQuantity || 0,
        unitPrice: item.unitPrice,
      }))
    } catch {}

    if (items.length === 0) {
      try {
        const lowerItems = await prisma.boqItem.findMany({
          where: { projectId },
          orderBy: { pozNo: "asc" },
        })
        items = lowerItems.map((item) => ({
          id: item.id,
          pozNo: item.pozNo,
          description: item.description,
          unit: item.unit,
          plannedQuantity: item.plannedQuantity,
          completedQuantity: item.actualQuantity,
          unitPrice: item.unitPrice,
        }))
      } catch {}
    }

    return { success: true, items }
  } catch (err: any) {
    return { success: false, items: [], error: err?.message }
  }
}

export async function submitJournalEntryAction(formData: FormData) {
  try {
    const session = await auth()
    const userId = session?.user?.id
    const userName = session?.user?.name || "Saha Mühendisi"

    const projectId = formData.get("projectId") as string
    const boqItemId = (formData.get("boqItemId") as string) || ""
    const progressPercentStr = formData.get("progressPercent") as string
    const notes = (formData.get("notes") as string) || ""
    const weather = (formData.get("weather") as string) || "Güneşli, 24°C"
    const workforceCountStr = formData.get("workforceCount") as string
    const file = formData.get("photo") as File | null

    const progressPercent = progressPercentStr ? parseFloat(progressPercentStr) : 0
    const workforceCount = workforceCountStr ? parseInt(workforceCountStr, 10) : 0

    if (!projectId) {
      return { success: false, error: "Lütfen ilgili şantiye projesini seçiniz." }
    }

    if (!notes.trim()) {
      return { success: false, error: "Lütfen günün teknik imalat notlarını yazınız." }
    }

    // Photo file upload
    let photoUrl = ""
    if (file && file.size > 0) {
      try {
        const bytes = await file.arrayBuffer()
        const buffer = Buffer.from(bytes)
        const uploadsDir = path.join(process.cwd(), "public", "uploads")
        if (!existsSync(uploadsDir)) {
          await mkdir(uploadsDir, { recursive: true })
        }
        const filename = `journal-${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`
        await writeFile(path.join(uploadsDir, filename), buffer)
        photoUrl = `/uploads/${filename}`
      } catch (fErr) {
        console.error("Photo save error:", fErr)
      }
    }

    let addedQuantity = 0

    // Update BoQ progress
    if (boqItemId) {
      const boq = await prisma.boqItem.findUnique({ where: { id: boqItemId } })
      if (boq) {
        if (progressPercent > 0) {
          addedQuantity = Number(((boq.plannedQuantity * progressPercent) / 100).toFixed(2))
        } else {
          addedQuantity = 1
        }

        await prisma.boqItem.update({
          where: { id: boqItemId },
          data: {
            actualQuantity: { increment: addedQuantity }
          }
        })

        await prisma.boqProgressLog.create({
          data: {
            boqItemId: boq.id,
            quantityAdded: addedQuantity,
            notes: `[Şantiye Jurnali]: %${progressPercent} ilerleme girildi (${notes.slice(0, 100)})`,
            attachmentUrl: photoUrl || null,
            createdByName: userName
          }
        })
      }
    }

    // Save ProgressAttachment
    let effectiveUserId = userId
    if (!effectiveUserId) {
      const admin = await prisma.user.findFirst()
      effectiveUserId = admin?.id || ""
    }

    if (effectiveUserId && photoUrl) {
      await prisma.progressAttachment.create({
        data: {
          projectId,
          uploaderId: effectiveUserId,
          photoUrl,
          description: `[Günlük Şantiye Jurnali]: ${notes.slice(0, 120)}`
        }
      })
    }

    revalidatePath("/personnel/daily-journal")
    revalidatePath("/admin/reports")
    revalidatePath(`/admin/projects/${projectId}/progress`)

    return {
      success: true,
      addedQuantity,
      message: `Şantiye jurnali başarıyla kaydedildi! ${addedQuantity > 0 ? `${addedQuantity} birim imalat onaylanmış metraja işlendi.` : ""}`
    }
  } catch (error: any) {
    console.error("submitJournalEntryAction error:", error)
    return { success: false, error: error?.message || "Jurnal kaydedilemedi." }
  }
}

export async function createDailyLog(formData: FormData) {
  try {
    const session = await auth()
    let userId = session?.user?.id

    let projectId = (formData.get("projectId") as string) || ""
    const dateStr = (formData.get("date") as string) || ""
    const weatherCondition = (formData.get("weatherCondition") as string) || "Açık"
    const temperature = (formData.get("temperature") as string) || "22"
    const staffCountStr = (formData.get("staffCount") as string) || "0"
    const subcontractorCountStr = (formData.get("subcontractorCount") as string) || "0"
    const equipment = (formData.get("equipment") as string) || ""
    const completedWorks = (formData.get("completedWorks") as string) || ""
    const safetyAndDelayNotes = (formData.get("safetyAndDelayNotes") as string) || ""

    const staffCount = parseInt(staffCountStr, 10) || 0
    const subcontractorCount = parseInt(subcontractorCountStr, 10) || 0
    const totalWorkers = staffCount + subcontractorCount

    if (!projectId) {
      const firstProject = await prisma.project.findFirst({ select: { id: true } })
      if (firstProject) {
        projectId = firstProject.id
      } else {
        return { success: false, error: "Lütfen bir şantiye projesi seçiniz." }
      }
    }

    if (!completedWorks.trim()) {
      return { success: false, error: "Lütfen gün içinde yapılan imalatları (işleri) giriniz." }
    }

    if (!userId) {
      const firstUser = await prisma.user.findFirst({ select: { id: true } })
      userId = firstUser?.id || "engineer"
    }

    const logDate = dateStr ? new Date(dateStr) : new Date()
    const weatherSummary = `${weatherCondition}, ${temperature}°C`

    // Calculate machinery count from equipment text/entries
    let machineryCount = 0
    if (equipment) {
      const matches = equipment.match(/:?\s*(\d+)/g)
      if (matches) {
        for (const m of matches) {
          const num = parseInt(m.replace(/\D/g, ""), 10)
          if (!isNaN(num)) machineryCount += num
        }
      }
    }

    // Handle photo file uploads
    const photoFiles = formData.getAll("photos") as (File | string)[]
    const photoUrls: string[] = []

    for (const item of photoFiles) {
      if (typeof item === "string") {
        if (item.trim()) photoUrls.push(item)
      } else if (item && typeof item === "object" && "arrayBuffer" in item && item.size > 0) {
        try {
          const bytes = await item.arrayBuffer()
          const buffer = Buffer.from(bytes)
          const uploadsDir = path.join(process.cwd(), "public", "uploads")
          if (!existsSync(uploadsDir)) {
            await mkdir(uploadsDir, { recursive: true })
          }
          const safeName = item.name.replace(/[^a-zA-Z0-9.-]/g, "_")
          const filename = `journal-${Date.now()}-${safeName}`
          await writeFile(path.join(uploadsDir, filename), buffer)
          photoUrls.push(`/uploads/${filename}`)
        } catch (fErr) {
          console.error("Photo upload error:", fErr)
        }
      }
    }

    // Parse boqUpdates
    let boqUpdates: Array<{ boqId: string; addedQuantity: number }> = []
    const rawBoqUpdates = formData.get("boqUpdates")
    if (rawBoqUpdates) {
      try {
        const parsed = typeof rawBoqUpdates === "string" ? JSON.parse(rawBoqUpdates) : rawBoqUpdates
        if (Array.isArray(parsed)) boqUpdates = parsed
      } catch (e) {
        console.error("Failed to parse boqUpdates:", e)
      }
    }

    const logData: any = {
      projectId,
      date: logDate,
      weather: weatherSummary,
      machineryCount,
      workDone: `[İmalatlar]: ${completedWorks.trim()}${equipment ? `\n[Kullanılan Ekipmanlar]: ${equipment}` : ""}${staffCount > 0 || subcontractorCount > 0 ? `\n[Personel]: Kendi: ${staffCount}, Taşeron: ${subcontractorCount} (Toplam: ${totalWorkers})` : ""}${safetyAndDelayNotes.trim() ? `\n[İSG ve Notlar]: ${safetyAndDelayNotes.trim()}` : ""}`,
      photoUrls,
      boqUpdates: boqUpdates.length > 0 ? boqUpdates : undefined,
    }

    let dailyLog: any
    if (boqUpdates && boqUpdates.length > 0) {
      dailyLog = await prisma.$transaction(async (tx) => {
        // ADIM 2: Bütçe Sapma Güvenlik Kilidi (Over-budget Strict Check)
        for (const update of boqUpdates) {
          const addedQty = Number(update.addedQuantity) || 0
          if (update.boqId && addedQty > 0) {
            let boq: any = await tx.boQItem.findUnique({ where: { id: update.boqId } }).catch(() => null)
            if (!boq) {
              boq = await tx.boqItem.findUnique({ where: { id: update.boqId } }).catch(() => null)
            }

            if (boq) {
              const currentCompleted = Number(boq.completedQuantity ?? boq.actualQuantity ?? 0)
              const plannedQty = Number(boq.plannedQuantity ?? boq.contractQuantity ?? 0)

              // Eğer (mevcut completedQuantity + sahadanGelenMiktar) > plannedQuantity ise işlemi durdur ve HATA fırlat
              if (plannedQty > 0 && currentCompleted + addedQty > plannedQty) {
                throw new Error(
                  "BÜTÇE AŞIMI RİSKİ: Planlanan metraj sınırına ulaşıldı. Fazla imalat için Admin/Şef onayı (DÖF) gereklidir!"
                )
              }
            }
          }
        }

        const created = await tx.dailyLog.create({
          data: logData,
        })
        for (const update of boqUpdates) {
          const qty = Number(update.addedQuantity) || 0
          if (update.boqId && qty > 0) {
            try {
              await tx.boQItem.update({
                where: { id: update.boqId },
                data: {
                  completedQuantity: { increment: qty },
                },
              })
            } catch {
              await tx.boqItem
                .update({
                  where: { id: update.boqId },
                  data: {
                    actualQuantity: { increment: qty },
                  },
                })
                .catch(() => {})
            }
          }
        }
        return created
      })
    } else {
      dailyLog = await prisma.dailyLog.create({
        data: logData,
      })
    }

    // 2. Also sync to DailyJournal for unified enterprise reporting
    try {
      await prisma.dailyJournal.create({
        data: {
          projectId,
          engineerId: userId,
          date: logDate,
          weather: {
            condition: weatherCondition,
            temperature: Number(temperature) || 22,
            unit: "°C"
          },
          workerCount: totalWorkers,
          consumedItems: [],
          completedWorks: [
            {
              id: `work-${Date.now()}`,
              title: completedWorks.slice(0, 100),
              quantityText: completedWorks,
              subcontractorName: "Saha İmalat Ekibi",
              status: "APPROVED"
            }
          ],
          ncrReports: safetyAndDelayNotes.trim() ? [{ id: `note-${Date.now()}`, description: safetyAndDelayNotes }] : [],
          engineerNotes: `[Ekipmanlar: ${equipment || "Yok"}] [Personel: ${staffCount} Kadrolu, ${subcontractorCount} Taşeron] ${safetyAndDelayNotes || ""}`,
          status: "SUBMITTED"
        }
      })
    } catch (jErr) {
      console.warn("DailyJournal sync warning:", jErr)
    }

    // 3. ActivityLog
    try {
      await prisma.activityLog.create({
        data: {
          action: "DAILY_LOG_CREATED",
          details: `Şantiye Jurnali kaydedildi (${totalWorkers} Personel, ${machineryCount} Ekipman, ${photoUrls.length} Fotoğraf, ${weatherSummary})`,
          userId
        }
      })
    } catch (aErr) {
      console.warn("ActivityLog write warning:", aErr)
    }

    revalidatePath("/personnel/daily-journal")
    revalidatePath("/personnel/daily-log")
    revalidatePath("/personnel")
    revalidatePath("/admin/reports")
    revalidatePath("/admin/daily-logs")
    revalidatePath(`/admin/projects/${projectId}`)

    return {
      success: true,
      dailyLogId: dailyLog.id,
      photoUrls,
      message: "Şantiye jurnali başarıyla kaydedildi ve merkeze iletildi!"
    }
  } catch (error: any) {
    console.error("createDailyLog error:", error)
    return {
      success: false,
      error: error?.message || "Jurnal kaydedilirken bir hata oluştu."
    }
  }
}


