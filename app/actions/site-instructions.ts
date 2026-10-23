/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Sahadan Revizyon ve İş Emri (Site Instruction) Server Actions
 */

"use server"

import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { revalidatePath } from "next/cache"

export interface CreateSiteInstructionInput {
  projectId: string
  title: string
  description: string
  subcontractorId?: string
  priority?: "URGENT" | "NORMAL" | "LOW"
  attachments?: string[]
}

/**
 * Projeye ait tüm saha talimatlarını (Site Instructions) getirir.
 */
export async function getSiteInstructions(projectId: string) {
  try {
    const instructions = await prisma.siteInstruction.findMany({
      where: { projectId },
      orderBy: { createdAt: "desc" },
    })

    // Fetch user details for createdById
    const creatorIds = Array.from(new Set(instructions.map((i) => i.createdById).filter(Boolean)))
    const creators = await prisma.user.findMany({
      where: { id: { in: creatorIds } },
      select: { id: true, name: true, role: true },
    })
    const creatorMap = new Map(creators.map((c) => [c.id, c]))

    // Fetch subcontractor details if assigned
    const subIds = Array.from(
      new Set(instructions.map((i) => i.subcontractorId).filter((id): id is string => Boolean(id)))
    )
    const subcontractors = await prisma.subcontractor.findMany({
      where: { id: { in: subIds } },
      select: { id: true, name: true, contactName: true, phone: true },
    })
    const subMap = new Map(subcontractors.map((s) => [s.id, s]))

    const enriched = instructions.map((item) => ({
      ...item,
      creator: creatorMap.get(item.createdById) || null,
      subcontractor: item.subcontractorId ? subMap.get(item.subcontractorId) || null : null,
    }))

    return { success: true, data: enriched }
  } catch (error: any) {
    console.error("getSiteInstructions error:", error)
    return { success: false, error: error?.message || "Saha talimatları alınamadı." }
  }
}

/**
 * Yeni Saha Talimatı (Site Instruction) Oluşturur:
 * Saha mühendisleri mimari revizyonları, şantiye düzeltici faaliyetlerini (DÖF)
 * veya taşeron iş emirlerini girer.
 */
export async function createSiteInstruction(input: CreateSiteInstructionInput) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: "Yetkisiz işlem: Oturum açmanız gerekmektedir." }
    }

    if (!input.projectId) {
      return { success: false, error: "Proje kimliği zorunludur." }
    }

    if (!input.title?.trim() || !input.description?.trim()) {
      return { success: false, error: "Talimat başlığı ve açıklaması zorunludur." }
    }

    const newInstruction = await prisma.siteInstruction.create({
      data: {
        projectId: input.projectId,
        createdById: session.user.id,
        subcontractorId: input.subcontractorId || null,
        title: input.title.trim(),
        description: input.description.trim(),
        attachments: input.attachments || [],
        priority: input.priority || "NORMAL",
        status: "OPEN",
      },
    })

    try {
      revalidatePath(`/admin/projects/${input.projectId}/instructions`)
      revalidatePath(`/admin/projects/${input.projectId}`)
    } catch {}

    return {
      success: true,
      data: newInstruction,
      message: "Saha talimatı başarıyla oluşturuldu.",
    }
  } catch (error: any) {
    console.error("createSiteInstruction error:", error)
    return { success: false, error: error?.message || "Saha talimatı oluşturulamadı." }
  }
}

/**
 * Saha Talimatı Durum Güncellemesi (Kanban Sürükle-Bırak veya Durum Butonu):
 * Durumlar: OPEN, IN_PROGRESS, RESOLVED, CLOSED
 */
export async function updateSiteInstructionStatus(
  instructionId: string,
  status: "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED"
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: "Yetkisiz işlem: Oturum açınız." }
    }

    const updated = await prisma.siteInstruction.update({
      where: { id: instructionId },
      data: { status },
    })

    try {
      revalidatePath(`/admin/projects/${updated.projectId}/instructions`)
    } catch {}

    return {
      success: true,
      data: updated,
      message: `Talimat durumu "${status}" olarak güncellendi.`,
    }
  } catch (error: any) {
    console.error("updateSiteInstructionStatus error:", error)
    return { success: false, error: error?.message || "Durum güncellenirken hata oluştu." }
  }
}

/**
 * Saha Talimatını Silme
 */
export async function deleteSiteInstruction(instructionId: string) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: "Yetkisiz işlem: Oturum açınız." }
    }

    const deleted = await prisma.siteInstruction.delete({
      where: { id: instructionId },
    })

    try {
      revalidatePath(`/admin/projects/${deleted.projectId}/instructions`)
    } catch {}

    return { success: true, message: "Talimat başarıyla silindi." }
  } catch (error: any) {
    console.error("deleteSiteInstruction error:", error)
    return { success: false, error: error?.message || "Talimat silinemedi." }
  }
}

/**
 * Projeye atanmış veya sistemdeki taşeronları listeler
 */
export async function getProjectSubcontractors(projectId?: string) {
  try {
    const subcontractors = await prisma.subcontractor.findMany({
      select: {
        id: true,
        name: true,
        contactName: true,
        phone: true,
      },
      orderBy: { name: "asc" },
    })

    return { success: true, data: subcontractors }
  } catch (error: any) {
    console.error("getProjectSubcontractors error:", error)
    return { success: false, error: error?.message || "Taşeronlar alınamadı." }
  }
}
