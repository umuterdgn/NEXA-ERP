/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * This code is the property of NXA Software.
 */

"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { auth } from "@/lib/auth"

export async function createWorkOrder(formData: FormData) {
  try {
    const session = await auth()
    if (!session) {
      return { success: false, error: "Oturum bulunamadı" }
    }

    const title = formData.get("title") as string
    const description = formData.get("description") as string
    const projectId = formData.get("projectId") as string
    const assignedToId = formData.get("assignedToId") as string
    const department = formData.get("department") as string
    const priority = formData.get("priority") as string
    const dueDate = formData.get("dueDate") as string

    if (!title || !projectId) {
      return { success: false, error: "Başlık ve proje zorunludur" }
    }

    const workOrder = await prisma.workOrder.create({
      data: {
        title,
        description: description || null,
        projectId,
        assignedToId: assignedToId || null,
        department: (department || "GENEL") as any,
        priority: (priority || "MEDIUM") as any,
        dueDate: dueDate ? new Date(dueDate) : null
      },
      include: {
        project: true,
        assignedTo: true
      }
    })

    revalidatePath("/admin/work-orders")
    return { success: true, workOrder }
  } catch (error) {
    console.error("Create work order error:", error)
    return { success: false, error: "İş emri oluşturulamadı" }
  }
}

export async function updateWorkOrderStatus(id: string, newStatus: string) {
  try {
    const session = await auth()
    if (!session) {
      return { success: false, error: "Oturum bulunamadı" }
    }

    const workOrder = await prisma.workOrder.update({
      where: { id },
      data: { status: newStatus as any }
    })

    revalidatePath("/admin/work-orders")
    revalidatePath("/personnel/tasks")
    return { success: true, workOrder }
  } catch (error) {
    console.error("Update work order status error:", error)
    return { success: false, error: "Durum güncellenemedi" }
  }
}

export async function getWorkOrders() {
  try {
    const workOrders = await prisma.workOrder.findMany({
      include: {
        project: true,
        assignedTo: true
      },
      orderBy: { createdAt: "desc" }
    })
    return { success: true, workOrders }
  } catch (error) {
    console.error("Get work orders error:", error)
    return { success: false, error: "İş emirleri getirilemedi" }
  }
}
