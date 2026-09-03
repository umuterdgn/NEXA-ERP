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

// Server Action: Ekipman arıza bildirimi
export async function reportEquipmentIssue(formData: FormData) {
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

  const assignmentId = formData.get("assignmentId") as string
  const issueType = formData.get("issueType") as string
  const description = formData.get("description") as string

  // Atamayı bul
  const assignment = await prisma.inventoryAssignment.findFirst({
    where: {
      id: assignmentId,
      personelId: personel.id
    }
  })

  if (!assignment) {
    return { error: "Ekipman ataması bulunamadı" }
  }

  // Atama durumunu MAINTENANCE olarak güncelle
  await prisma.inventoryAssignment.update({
    where: { id: assignmentId },
    data: {
      status: "MAINTENANCE",
      condition: "Arızalı",
      notes: description ? `${issueType}: ${description}` : issueType
    }
  })

  revalidatePath("/personnel/equipment")
  redirect("/personnel/equipment")
}
