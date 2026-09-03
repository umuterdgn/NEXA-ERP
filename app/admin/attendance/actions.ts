"use server"
/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * This code is the property of NXA Software.
 */

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

export async function processNfcAttendance(nfcUid: string, projectId: string) {
  try {
    console.log("--- NFC ATTENDANCE PROCESSING ---")
    console.log("Gelen NFC ID:", nfcUid)
    console.log("Proje ID:", projectId)

    // Find personnel by NFC UID or ID (OR logic)
    const personel = await prisma.personel.findFirst({
      where: {
        OR: [
          { id: nfcUid },       // Yeni sistem: Şifresi çözülmüş CUID
          { nfcUid: nfcUid }    // Mevcut sistem: Fiziksel seri no sütunu
        ]
      }
    })

    console.log("Personel Arama Sonucu:", personel ? "Bulundu" : "BULUNAMADI")
    if (personel) {
      console.log("Personel Detayları:", { id: personel.id, name: personel.name, nfcUid: personel.nfcUid })
    }

    if (!personel) {
      return { success: false, error: "Tanımsız Kart" }
    }

    // Get today's date at midnight
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // Check if there's an active attendance record (check-in without check-out) for today
    const activeRecord = await prisma.attendanceRecord.findFirst({
      where: {
        personelId: personel.id,
        projectId,
        date: {
          gte: today
        },
        checkOut: null
      }
    })

    if (activeRecord) {
      // Check-out: update the existing record
      const updatedRecord = await prisma.attendanceRecord.update({
        where: { id: activeRecord.id },
        data: { checkOut: new Date() }
      })

      revalidatePath("/admin/attendance")
      return {
        success: true,
        action: "checkout",
        personelName: personel.name,
        time: new Date().toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })
      }
    } else {
      // Check-in: create a new record
      const newRecord = await prisma.attendanceRecord.create({
        data: {
          personelId: personel.id,
          projectId,
          date: today,
          checkIn: new Date()
        }
      })

      revalidatePath("/admin/attendance")
      return {
        success: true,
        action: "checkin",
        personelName: personel.name,
        time: new Date().toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })
      }
    }
  } catch (error) {
    console.error("NFC attendance processing error:", error)
    return { success: false, error: "İşlem sırasında hata oluştu" }
  }
}
