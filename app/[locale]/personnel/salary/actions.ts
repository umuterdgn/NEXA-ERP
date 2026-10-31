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

// Server Action: Yeni avans talebi oluştur
export async function createAdvanceRequest(formData: FormData) {
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

  const amount = parseFloat(formData.get("amount") as string)
  const date = new Date(formData.get("date") as string)
  const reason = formData.get("reason") as string

  // Tutar kontrolü
  if (isNaN(amount) || amount <= 0) {
    return { error: "Geçerli bir tutar giriniz" }
  }

  // Avans talebi oluştur
  await prisma.personelPayment.create({
    data: {
      personelId: personel.id,
      type: "AVANS",
      amount,
      description: reason,
      date,
      status: "PENDING",
      isPaid: false
    }
  })

  revalidatePath("/personnel/salary")
  redirect("/personnel/salary")
}
