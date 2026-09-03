/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * This code is the property of NXA Software.
 */

"use server"

import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

// İzin gün sayısını hesapla
function calculateLeaveDays(startDate: Date, endDate: Date): number {
  const diffTime = endDate.getTime() - startDate.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1
  return diffDays
}

// Server Action: Yeni izin talebi oluştur
export async function createLeaveRequest(formData: FormData) {
  const session = await auth()
  
  if (!session) {
    return { error: "Oturum bulunamadı" }
  }

  const personel = await prisma.personel.findFirst({
    where: { userId: session.user.id },
    select: { id: true }
  })

  if (!personel) {
    return { error: "Personel bulunamadı" }
  }

  const type = formData.get("type") as string
  const startDate = new Date(formData.get("startDate") as string)
  const endDate = new Date(formData.get("endDate") as string)
  const reason = formData.get("reason") as string

  // Tarih kontrolü
  if (startDate > endDate) {
    return { error: "Bitiş tarihi başlangıç tarihinden önce olamaz" }
  }

  // Gün sayısını hesapla
  const days = calculateLeaveDays(startDate, endDate)

  // İzin talebi oluştur
  await prisma.leaveRequest.create({
    data: {
      personelId: personel.id,
      type: type as any,
      startDate,
      endDate,
      days,
      reason,
      status: "PENDING"
    }
  })

  revalidatePath("/personnel/leave")
  redirect("/personnel/leave")
}
