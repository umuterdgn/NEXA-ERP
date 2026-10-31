/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Field Engineer NCR & Defect Request Server Actions
 */

"use server"

import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { revalidatePath } from "next/cache"
import { writeFile, mkdir } from "fs/promises"
import { existsSync } from "fs"
import path from "path"

export async function getNcrFormData() {
  try {
    const projects = await prisma.project.findMany({
      select: { id: true, name: true, title: true }
    })
    const subcontractors = await prisma.subcontractor.findMany({
      select: { id: true, name: true }
    })
    return { success: true, projects, subcontractors }
  } catch (error: any) {
    console.error("getNcrFormData error:", error)
    return { success: false, projects: [], subcontractors: [] }
  }
}

export async function createNcrAction(formData: FormData) {
  try {
    const session = await auth()
    let creatorId = session?.user?.id

    if (!creatorId) {
      const admin = await prisma.user.findFirst()
      creatorId = admin?.id || ""
    }

    const projectId = formData.get("projectId") as string
    const subcontractorId = (formData.get("subcontractorId") as string) || null
    const location = (formData.get("location") as string) || ""
    const description = (formData.get("description") as string) || ""
    const deadlineStr = formData.get("deadline") as string
    const file = formData.get("photo") as File | null

    if (!projectId || !description.trim()) {
      return { success: false, error: "Lütfen proje ve kusur açıklamasını doldurunuz." }
    }

    const deadline = deadlineStr ? new Date(deadlineStr) : new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)

    let photoUrl = ""
    if (file && file.size > 0) {
      try {
        const bytes = await file.arrayBuffer()
        const buffer = Buffer.from(bytes)
        const uploadsDir = path.join(process.cwd(), "public", "uploads")
        if (!existsSync(uploadsDir)) {
          await mkdir(uploadsDir, { recursive: true })
        }
        const filename = `ncr-${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`
        await writeFile(path.join(uploadsDir, filename), buffer)
        photoUrl = `/uploads/${filename}`
      } catch (fErr) {
        console.error("Photo save error:", fErr)
      }
    }

    const count = await prisma.nonConformance.count()
    const reportNo = `NCR-2026-${String(count + 1).padStart(3, "0")}`

    const ncr = await prisma.nonConformance.create({
      data: {
        reportNo,
        projectId,
        creatorId: creatorId!,
        subcontractorId,
        description: location ? `[Mahal: ${location}] ${description}` : description,
        deadline,
        status: "OPEN",
        photos: photoUrl ? [photoUrl] : []
      }
    })

    revalidatePath("/subcontractor/audits")
    revalidatePath("/personnel/ncr-request")

    return {
      success: true,
      reportNo: ncr.reportNo,
      message: `"${ncr.reportNo}" numaralı uygunsuzluk ve revizyon talebi başarıyla açıldı.`
    }
  } catch (error: any) {
    console.error("createNcrAction error:", error)
    return { success: false, error: error?.message || "Kusur kaydı açılamadı." }
  }
}
