/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Daily Construction Log Server Actions (Save, History, and Latest Progress)
 */

"use server"

import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { revalidatePath } from "next/cache"
import { writeFile, mkdir } from "fs/promises"
import { existsSync } from "fs"
import path from "path"

export interface BoqDailyLogUpdate {
  boqId: string
  addedQuantity: number
}

export async function createDailyLog(formData: FormData | any) {
  try {
    const session = await auth()
    let userId = session?.user?.id

    const isFormData = typeof FormData !== "undefined" && formData instanceof FormData

    const getField = (name: string, fallback = ""): string => {
      if (isFormData) {
        return (formData.get(name) as string) || fallback
      }
      return formData?.[name] !== undefined && formData?.[name] !== null
        ? String(formData[name])
        : fallback
    }

    let projectId = getField("projectId")
    const dateStr = getField("date")
    const weatherCondition = getField("weatherCondition", "Açık")
    const temperature = getField("temperature", "22")
    const windSpeedStr = getField("windSpeed")
    const staffCountStr = getField("staffCount", "0")
    const subcontractorCountStr = getField("subcontractorCount", "0")
    const equipment = getField("equipment")
    const completedWorks = getField("completedWorks")
    const safetyAndDelayNotes = getField("safetyAndDelayNotes")

    // Parse boqUpdates: { boqId: string, addedQuantity: number }[]
    let boqUpdates: BoqDailyLogUpdate[] = []
    if (isFormData) {
      const raw = formData.get("boqUpdates")
      if (raw) {
        try {
          const parsed = typeof raw === "string" ? JSON.parse(raw) : raw
          if (Array.isArray(parsed)) boqUpdates = parsed
        } catch (e) {
          console.error("Failed to parse boqUpdates from formData:", e)
        }
      }
    } else if (formData && Array.isArray(formData.boqUpdates)) {
      boqUpdates = formData.boqUpdates
    }

    const staffCount = parseInt(staffCountStr, 10) || 0
    const subcontractorCount = parseInt(subcontractorCountStr, 10) || 0
    const totalWorkers = staffCount + subcontractorCount
    const weatherTemp = temperature ? parseFloat(temperature) : null
    const windSpeed = windSpeedStr ? parseFloat(windSpeedStr) : null

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
      userId = firstUser?.id || undefined
    }

    const logDate = dateStr ? new Date(dateStr) : new Date()
    const weatherSummary = `${weatherCondition}, ${temperature}°C${windSpeed ? ` (Rüzgar: ${windSpeed} km/s)` : ""}`

    // Parse equipment data into JSON object and count machinery
    const equipmentData: Record<string, number> = {}
    let machineryCount = 0
    if (equipment) {
      const items = equipment.split(",")
      for (const item of items) {
        const [k, v] = item.split(":")
        if (k && v) {
          const count = parseInt(v.trim(), 10) || 0
          equipmentData[k.trim()] = count
          machineryCount += count
        }
      }
    }

    // Handle photo file uploads
    const photoFiles = isFormData
      ? (formData.getAll("photos") as (File | string)[])
      : Array.isArray(formData?.photos)
      ? formData.photos
      : []
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

    const logData: any = {
      projectId,
      date: logDate,
      weather: weatherSummary,
      weatherTemp,
      windSpeed,
      personnelCount: totalWorkers,
      equipmentData,
      activities: completedWorks.trim(),
      notes: safetyAndDelayNotes.trim() || null,
      photos: photoUrls,
      machineryCount,
      workDone: `[İmalatlar]: ${completedWorks.trim()}${equipment ? `\n[Kullanılan Ekipmanlar]: ${equipment}` : ""}${staffCount > 0 || subcontractorCount > 0 ? `\n[Personel]: Kendi: ${staffCount}, Taşeron: ${subcontractorCount} (Toplam: ${totalWorkers})` : ""}${safetyAndDelayNotes.trim() ? `\n[İSG ve Notlar]: ${safetyAndDelayNotes.trim()}` : ""}`,
      photoUrls,
      boqUpdates: boqUpdates.length > 0 ? boqUpdates : undefined,
      createdById: userId || null,
    }

    // ADIM 2: boqUpdates geliyorsa Prisma $transaction başlat & Bütçe Güvenlik Kilidi uygula
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

        // 1. Jurnali kaydet
        const createdLog = await tx.dailyLog.create({
          data: logData,
        })

        // 2. prisma.boQItem.update ile ilgili keşif kaleminin completedQuantity değerini addedQuantity kadar artır
        for (const update of boqUpdates) {
          const addedQty = Number(update.addedQuantity) || 0
          if (update.boqId && addedQty > 0) {
            try {
              await tx.boQItem.update({
                where: { id: update.boqId },
                data: {
                  completedQuantity: {
                    increment: addedQty,
                  },
                },
              })
            } catch (updateErr) {
              // Fallback: boqItem modelini de kontrol et
              await tx.boqItem
                .update({
                  where: { id: update.boqId },
                  data: {
                    actualQuantity: {
                      increment: addedQty,
                    },
                  },
                })
                .catch(() => {})
            }
          }
        }

        return createdLog
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
          engineerId: userId || "engineer",
          date: logDate,
          weather: {
            condition: weatherCondition,
            temperature: weatherTemp || 22,
            windSpeed: windSpeed || 0,
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
          ncrReports: safetyAndDelayNotes.trim()
            ? [{ id: `note-${Date.now()}`, description: safetyAndDelayNotes }]
            : [],
          engineerNotes: `[Ekipmanlar: ${equipment || "Yok"}] [Personel: ${staffCount} Kadrolu, ${subcontractorCount} Taşeron] ${safetyAndDelayNotes || ""}`,
          status: "SUBMITTED"
        }
      })
    } catch (jErr) {
      console.warn("DailyJournal sync warning:", jErr)
    }

    // 3. ActivityLog
    if (userId) {
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

/**
 * ADIM 2: getProjectLogsHistory(projectId: string)
 * Projeye ait tüm günlükleri tarihe göre azalan (desc) sırada getirir.
 */
export async function getProjectLogsHistory(projectId: string) {
  try {
    if (!projectId) {
      return { success: false, logs: [], error: "Proje kimliği gereklidir." }
    }

    const logs = await prisma.dailyLog.findMany({
      where: { projectId },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
            profileImage: true,
            role: true
          }
        }
      },
      orderBy: { date: "desc" }
    })

    return {
      success: true,
      logs
    }
  } catch (error: any) {
    console.error("getProjectLogsHistory error:", error)
    return {
      success: false,
      logs: [],
      error: error?.message || "Şantiye günlükleri geçmişi alınırken hata oluştu."
    }
  }
}

/**
 * ADIM 2: getProjectLatestProgress(projectId: string)
 * Projenin sadece en son (bugünkü/dünkü) günlüğünü ve ilerleme verilerini getirir.
 */
export async function getProjectLatestProgress(projectId: string) {
  try {
    if (!projectId) {
      return { success: false, latestLog: null, error: "Proje kimliği gereklidir." }
    }

    const latestLog = await prisma.dailyLog.findFirst({
      where: { projectId },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: { date: "desc" }
    })

    return {
      success: true,
      latestLog
    }
  } catch (error: any) {
    console.error("getProjectLatestProgress error:", error)
    return {
      success: false,
      latestLog: null,
      error: error?.message || "Son günlük verisi alınamadı."
    }
  }
}

/**
 * ADIM 1: getTodayPersonnelCount(projectId: string)
 * İlgili şantiyenin bugünkü AttendanceRecord / Puantaj veritabanından aktif giriş yapan personel sayısını çeker.
 * Kendi personelimiz ve taşeron personeli olarak gruplayıp döndürür.
 */
export async function getTodayPersonnelCount(projectId: string) {
  try {
    if (!projectId) {
      return {
        success: false,
        total: 0,
        staffCount: 0,
        subcontractorCount: 0,
        hasRecords: false,
        error: "Lütfen bir şantiye projesi seçiniz."
      }
    }

    const now = new Date()
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0)
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999)

    // Bugün ilgili şantiyede check-in yapmış veya yoklamada bulunan kayıtlar
    const records = await prisma.attendanceRecord.findMany({
      where: {
        projectId,
        OR: [
          {
            date: {
              gte: startOfToday,
              lte: endOfToday
            }
          },
          {
            checkIn: {
              gte: startOfToday,
              lte: endOfToday
            }
          }
        ],
        status: { in: ["PRESENT", "LATE"] }
      },
      include: {
        personel: {
          select: {
            id: true,
            role: true,
            companyId: true,
            company: {
              select: {
                id: true,
                type: true,
                name: true
              }
            }
          }
        }
      }
    })

    const hasRecords = records.length > 0

    if (!hasRecords) {
      return {
        success: true,
        hasRecords: false,
        total: 0,
        staffCount: 0,
        subcontractorCount: 0,
        message: "Bugün için henüz puantaj/giriş kaydı bulunamadı, manuel girebilirsiniz."
      }
    }

    const seenWorkers = new Set<string>()
    let staffCount = 0
    let subcontractorCount = 0

    for (const record of records) {
      const workerKey = record.personelId || record.workerName || record.id
      if (seenWorkers.has(workerKey)) continue
      seenWorkers.add(workerKey)

      const p = record.personel
      const isSubcontractor =
        p?.role === "SUBCONTRACTOR" ||
        p?.company?.type === "SUBCONTRACTOR" ||
        (p?.companyId !== null && p?.companyId !== undefined)

      if (isSubcontractor) {
        subcontractorCount++
      } else {
        staffCount++
      }
    }

    const uniqueTotal = seenWorkers.size

    return {
      success: true,
      hasRecords: uniqueTotal > 0,
      total: uniqueTotal,
      staffCount,
      subcontractorCount,
      message: `Bugün kapı turnike/QR sisteminden ${uniqueTotal} aktif personel tespit edildi.`
    }
  } catch (error: any) {
    console.error("getTodayPersonnelCount error:", error)
    return {
      success: false,
      hasRecords: false,
      total: 0,
      staffCount: 0,
      subcontractorCount: 0,
      error: error?.message || "Puantaj verileri sorgulanırken hata oluştu."
    }
  }
}

/**
 * Dünkü Jurnali Kopyalama Yardımcısı
 */
export async function getLatestLog(projectId: string) {

  try {
    if (!projectId) {
      return { success: false, error: "Lütfen bir şantiye projesi seçiniz." }
    }

    // 1. Fetch latest daily log for this project
    const lastDailyLog = await prisma.dailyLog.findFirst({
      where: { projectId },
      orderBy: { date: "desc" }
    })

    // 2. Fetch latest journal for backup / structured notes
    const lastJournal = await prisma.dailyJournal.findFirst({
      where: { projectId },
      orderBy: { date: "desc" }
    })

    if (!lastDailyLog && !lastJournal) {
      return {
        success: false,
        error: "Bu şantiye için daha önce kaydedilmiş bir jurnal bulunamadı."
      }
    }

    // Parse weather condition & temperature
    let weatherCondition = "Açık"
    let temperature = "24"
    if (lastDailyLog?.weatherTemp) {
      temperature = String(Math.round(lastDailyLog.weatherTemp))
    }
    if (lastDailyLog?.weather) {
      const parts = lastDailyLog.weather.split(",")
      if (parts[0]) weatherCondition = parts[0].trim()
      if (!lastDailyLog?.weatherTemp && parts[1]) {
        const tempMatch = parts[1].match(/-?\d+/)
        if (tempMatch) temperature = tempMatch[0]
      }
    } else if (lastJournal?.weather) {
      const w = lastJournal.weather as any
      if (w?.condition) weatherCondition = w.condition
      if (w?.temperature) temperature = String(w.temperature)
    }

    // Parse staff, subcontractor, equipment, notes
    let staffCount = "12"
    let subcontractorCount = "48"
    let equipment = ""
    let safetyAndDelayNotes = lastDailyLog?.notes || ""

    if (lastDailyLog?.personnelCount) {
      // If we have total personnel, estimate 20% kadrolu, 80% taseron
      const staffEst = Math.round(lastDailyLog.personnelCount * 0.2)
      staffCount = String(staffEst)
      subcontractorCount = String(lastDailyLog.personnelCount - staffEst)
    }

    const workDoneText = lastDailyLog?.workDone || ""
    const engineerNotes = lastJournal?.engineerNotes || ""
    const combinedText = `${workDoneText}\n${engineerNotes}`

    // Parse staffCount from text if available
    const staffMatch = combinedText.match(/(?:Kendi|Kadrolu)\s*:\s*(\d+)/i)
    if (staffMatch) staffCount = staffMatch[1]

    // Parse subcontractorCount from text if available
    const subMatch = combinedText.match(/Taşeron\s*:\s*(\d+)/i)
    if (subMatch) subcontractorCount = subMatch[1]

    // Parse equipment
    if (lastDailyLog?.equipmentData && typeof lastDailyLog.equipmentData === "object") {
      const eqEntries = Object.entries(lastDailyLog.equipmentData as Record<string, number>)
      if (eqEntries.length > 0) {
        equipment = eqEntries.map(([k, v]) => `${k}: ${v}`).join(", ")
      }
    }

    if (!equipment) {
      const eqMatch = combinedText.match(/\[(?:Kullanılan )?Ekipmanlar?\]\s*:\s*([^\n]+)/i)
      if (eqMatch) {
        equipment = eqMatch[1].trim()
      }
    }

    // Parse safety and delay notes
    if (!safetyAndDelayNotes) {
      const notesMatch = combinedText.match(/\[İSG ve Notlar\]\s*:\s*([\s\S]+)/i)
      if (notesMatch) {
        safetyAndDelayNotes = notesMatch[1].trim()
      } else if (lastJournal?.engineerNotes) {
        safetyAndDelayNotes = lastJournal.engineerNotes
      }
    }

    return {
      success: true,
      data: {
        date: lastDailyLog?.date || lastJournal?.date,
        weatherCondition,
        temperature,
        staffCount,
        subcontractorCount,
        equipment,
        safetyAndDelayNotes,
        completedWorks: ""
      }
    }
  } catch (error: any) {
    console.error("getLatestLog error:", error)
    return {
      success: false,
      error: error?.message || "Dünkü jurnal verileri alınırken bir sorun oluştu."
    }
  }
}
