/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * İş Emirleri Servisi & "Tozsuz Ortam" (Clean Environment) İş Kilidi
 */

"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

export interface CreateWorkOrderInput {
  title: string
  description?: string
  projectId: string
  assignedToId?: string | null
  orderType?: "IT_INSTALLATION" | "SERVER_SETUP" | "GENERAL" | string
  priority?: "LOW" | "MEDIUM" | "HIGH" | "URGENT"
  dueDate?: Date | string
}

/**
 * TOZSUZ ORTAM KONTROLÜ (Clean Environment Middleware):
 * Eğer iş emri "IT_INSTALLATION" veya "SERVER_SETUP" tipindeyse,
 * ilgili projenin "INSAAT_TEMIZLIGI" (Tozsuz Ortam) StageGate'i onaylanmadan
 * bu iş emrinin taşerona atanmasını engeller ve hata fırlatır.
 */
async function validateDustFreeEnvironment(projectId: string, orderType?: string, title?: string) {
  const isITSetup =
    orderType === "IT_INSTALLATION" ||
    orderType === "SERVER_SETUP" ||
    (title &&
      (title.includes("IT_INSTALLATION") ||
        title.includes("SERVER_SETUP") ||
        title.toLowerCase().includes("server") ||
        title.toLowerCase().includes("it kurulum") ||
        title.toLowerCase().includes("sunucu montaj")))

  if (isITSetup) {
    const cleanGate = await prisma.stageGate.findFirst({
      where: {
        projectId,
        stageName: {
          in: ["INSAAT_TEMIZLIGI", "TOZSUZ_ORTAM", "İNŞAAT_TEMİZLİĞİ"],
        },
      },
    })

    // Eğer temizlik aşaması varsa ve onaylanmamışsa hata fırlat
    if (cleanGate && !cleanGate.isApproved) {
      throw new Error(
        `[TOZSUZ ORTAM İŞ KİLİDİ]: "${title || "IT / Sunucu Kurulumu"}" iş emri taşerona atanamaz! Şantiyenin "INSAAT_TEMIZLIGI" (Tozsuz Ortam) aşaması onaylanmadan hassas sunucu ve IT cihazları montajına izin verilmez.`
      )
    }
  }
}

export async function createWorkOrder(data: CreateWorkOrderInput) {
  try {
    // Eğer doğrudan taşerona / personele atanıyorsa kilit kontrolü yap
    if (data.assignedToId) {
      await validateDustFreeEnvironment(data.projectId, data.orderType, data.title)
    }

    const workOrder = await prisma.workOrder.create({
      data: {
        title: data.title,
        description: data.description || null,
        projectId: data.projectId,
        assignedToId: data.assignedToId || null,
        priority: (data.priority as any) || "MEDIUM",
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        status: "TODO",
      },
      include: {
        project: {
          select: { id: true, name: true, city: true },
        },
        assignedTo: {
          select: { id: true, name: true, role: true },
        },
      },
    })

    try {
      revalidatePath("/admin/work-orders")
    } catch {
      // Non-request context resilience (e.g. CLI/tests)
    }
    return { success: true, workOrder }
  } catch (error: any) {
    console.error("❌ createWorkOrder error:", error.message)
    return { success: false, error: error.message }
  }
}

export async function assignWorkOrder(workOrderId: string, assignedToId: string) {
  try {
    const workOrder = await prisma.workOrder.findUnique({
      where: { id: workOrderId },
    })

    if (!workOrder) {
      return { success: false, error: "İş emri bulunamadı." }
    }

    // Atama anında tozsuz ortam kontrolü
    await validateDustFreeEnvironment(workOrder.projectId, undefined, workOrder.title)

    const updated = await prisma.workOrder.update({
      where: { id: workOrderId },
      data: { assignedToId },
      include: {
        project: true,
        assignedTo: true,
      },
    })

    try {
      revalidatePath("/admin/work-orders")
    } catch {
      // Non-request context resilience (e.g. CLI/tests)
    }
    return { success: true, workOrder: updated }
  } catch (error: any) {
    console.error("❌ assignWorkOrder error:", error.message)
    return { success: false, error: error.message }
  }
}
