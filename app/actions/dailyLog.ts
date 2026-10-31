/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Daily Construction Log Server Actions (getLatestLog & automation)
 */

"use server"

import { prisma } from "@/lib/prisma"

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
    if (lastDailyLog?.weather) {
      const parts = lastDailyLog.weather.split(",")
      if (parts[0]) weatherCondition = parts[0].trim()
      if (parts[1]) {
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
    let safetyAndDelayNotes = ""

    const workDoneText = lastDailyLog?.workDone || ""
    const engineerNotes = lastJournal?.engineerNotes || ""
    const combinedText = `${workDoneText}\n${engineerNotes}`

    // Parse staffCount
    const staffMatch = combinedText.match(/(?:Kendi|Kadrolu)\s*:\s*(\d+)/i)
    if (staffMatch) staffCount = staffMatch[1]

    // Parse subcontractorCount
    const subMatch = combinedText.match(/Taşeron\s*:\s*(\d+)/i)
    if (subMatch) subcontractorCount = subMatch[1]

    // Parse equipment
    const eqMatch = combinedText.match(/\[(?:Kullanılan )?Ekipmanlar?\]\s*:\s*([^\n]+)/i)
    if (eqMatch) {
      equipment = eqMatch[1].trim()
    }

    // Parse safety and delay notes
    const notesMatch = combinedText.match(/\[İSG ve Notlar\]\s*:\s*([\s\S]+)/i)
    if (notesMatch) {
      safetyAndDelayNotes = notesMatch[1].trim()
    } else if (lastJournal?.engineerNotes) {
      safetyAndDelayNotes = lastJournal.engineerNotes
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
        // Sadece 'Yapılan İşler' kısmını boş veya editlenmeye hazır bırakıyoruz
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

export { createDailyLog } from "@/app/[locale]/personnel/daily-journal/actions"
