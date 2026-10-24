/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Subcontractor Daily Report & BoqItem Progress Update Server Actions
 */

"use server"

import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { revalidatePath } from "next/cache"
import { writeFile, mkdir } from "fs/promises"
import { existsSync } from "fs"
import path from "path"

export async function getProjectsAndBoqItems(projectId?: string) {
  try {
    const projects = await prisma.project.findMany({
      select: {
        id: true,
        name: true,
        title: true,
        city: true,
      },
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
    console.error("getProjectsAndBoqItems error:", error)
    return { success: false, projects: [], boqItems: [], error: error?.message }
  }
}

export async function submitDailyReportAction(formData: FormData) {
  try {
    const session = await auth()
    const userId = session?.user?.id

    const projectId = formData.get("projectId") as string
    const boqItemId = (formData.get("boqItemId") as string) || ""
    const progressPercentStr = formData.get("progressPercent") as string
    const description = (formData.get("description") as string) || ""
    const workforceCountStr = formData.get("workforceCount") as string
    const file = formData.get("photo") as File | null

    const progressPercent = progressPercentStr ? parseFloat(progressPercentStr) : 0
    const workforceCount = workforceCountStr ? parseInt(workforceCountStr, 10) : 0

    if (!projectId) {
      return { success: false, error: "Lütfen ilgili şantiye projesini seçiniz." }
    }

    if (!description || !description.trim()) {
      return { success: false, error: "Lütfen bugün sahada yapılan işleri açıklayınız." }
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
        const filename = `daily-report-${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`
        await writeFile(path.join(uploadsDir, filename), buffer)
        photoUrl = `/uploads/${filename}`
      } catch (fErr) {
        console.error("Photo save error:", fErr)
      }
    }

    let updatedBoqItem = null
    let addedQuantity = 0

    // If a specific BoqItem was selected:
    if (boqItemId) {
      const boq = await prisma.boqItem.findUnique({
        where: { id: boqItemId }
      })

      if (boq) {
        // Calculate quantity added from percentage:
        // E.g., if total planned is 1000 m3 and progress is 5%, added is 50 m3
        if (progressPercent > 0) {
          addedQuantity = Number(((boq.plannedQuantity * progressPercent) / 100).toFixed(2))
        } else {
          addedQuantity = 1
        }

        // Add progress to actualQuantity
        updatedBoqItem = await prisma.boqItem.update({
          where: { id: boqItemId },
          data: {
            actualQuantity: { increment: addedQuantity }
          }
        })

        // Log the field progress entry (marked as pending approval)
        await prisma.boqProgressLog.create({
          data: {
            boqItemId: boq.id,
            quantityAdded: addedQuantity,
            notes: `[Taşeron Günlük Raporu - Onay Bekliyor]: %${progressPercent} ilerleme girildi (${description})`,
            attachmentUrl: photoUrl || null
          }
        })
      }
    }

    // Save as ProgressAttachment so it appears in Live Site Photos and Map
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
          description: `[Taşeron Günlük Raporu]: ${description.slice(0, 120)}`
        }
      })
    }

    // Also record an ActivityLog entry
    if (effectiveUserId) {
      try {
        await prisma.activityLog.create({
          data: {
            action: "SUBCONTRACTOR_DAILY_REPORT",
            details: `Günlük Saha Raporu: ${description.slice(0, 80)} (%${progressPercent} ilerleme)`,
            userId: effectiveUserId
          }
        })
      } catch (actErr) {
        console.warn("ActivityLog error:", actErr)
      }
    }

    revalidatePath("/subcontractor/report")
    revalidatePath("/subcontractor")
    revalidatePath(`/admin/projects/${projectId}`)
    revalidatePath(`/admin/projects/${projectId}/progress`)

    return {
      success: true,
      addedQuantity,
      updatedBoqItem,
      message: `Günlük rapor başarıyla kaydedildi! ${addedQuantity > 0 ? `${addedQuantity} birim imalat onay bekleyen statüsünde metraja eklendi.` : ""}`
    }
  } catch (error: any) {
    console.error("submitDailyReportAction error:", error)
    return { success: false, error: error?.message || "Günlük rapor kaydedilemedi." }
  }
}
