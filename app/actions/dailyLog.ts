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

export async function createDailyLog(formData: FormData) {
  try {
    const session = await auth()
    let userId = session?.user?.id

    let projectId = (formData.get("projectId") as string) || ""
    const dateStr = (formData.get("date") as string) || ""
    const weatherCondition = (formData.get("weatherCondition") as string) || "Açık"
    const temperature = (formData.get("temperature") as string) || "22"
    const windSpeedStr = (formData.get("windSpeed") as string) || ""
    const staffCountStr = (formData.get("staffCount") as string) || "0"
    const subcontractorCountStr = (formData.get("subcontractorCount") as string) || "0"
    const equipment = (formData.get("equipment") as string) || ""
    const completedWorks = (formData.get("completedWorks") as string) || ""
    const safetyAndDelayNotes = (formData.get("safetyAndDelayNotes") as string) || ""

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

    // 1. Create DailyLog in DB with all new schema fields
    const dailyLog = await prisma.dailyLog.create({
      data: {
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
        createdById: userId || null
      }
    })

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
