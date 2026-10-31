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
      select: { id: true, name: true, title: true, city: true },
      orderBy: { createdAt: "desc" }
    })

    const targetProjectId = projectId || (projects.length > 0 ? projects[0].id : null)

    let boqItems: any[] = []
    if (targetProjectId) {
      boqItems = await prisma.boqItem.findMany({
        where: { projectId: targetProjectId },
        orderBy: { pozNo: "asc" }
      })
    }

    return {
      success: true,
      projects,
      boqItems,
      selectedProjectId: targetProjectId
    }
  } catch (error: any) {
    console.error("getJournalInitialData error:", error)
    return { success: false, projects: [], boqItems: [], error: error?.message }
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
