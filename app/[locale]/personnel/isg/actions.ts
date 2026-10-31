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

// Server Action: Yeni İSG bildirimi oluştur
export async function createISGReport(formData: FormData) {
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
  const location = formData.get("location") as string
  const description = formData.get("description") as string

  // İSG bildirimi oluştur
  await prisma.isgReport.create({
    data: {
      personelId: personel.id,
      type: type as any,
      location,
      description,
      status: "ACIL"
    }
  })

  revalidatePath("/personnel/isg")
  redirect("/personnel/isg")
}
