/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Field Personnel Tasks & Work Orders Server Actions
 * Bridges field personnel portal to admin task & work-order ecosystem
 */

"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { auth } from "@/lib/auth"

export interface WorkOrderItem {
  id: string
  title: string
  description: string | null
  status: "TODO" | "IN_PROGRESS" | "DONE" | "COMPLETED" | "REJECTED" | string
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT" | string
  dueDate: Date | null
  createdAt: Date
  projectId?: string | null
  projectName?: string
  taskType?: string | null
  source: "task" | "work_order"
  completionPhoto?: string | null
  rejectionReason?: string | null
}

export interface GetMyWorkOrdersResponse {
  success: boolean
  workOrders: WorkOrderItem[]
  error?: string
}

export interface UpdateWorkOrderStatusResponse {
  success: boolean
  data?: any
  message?: string
  error?: string
}

/**
 * ADIM 2: getMyWorkOrders(userId: string)
 * Task ve WorkOrder tablolarında kullanıcıya atanan görevleri getirir.
 */
export async function getMyWorkOrders(userId: string): Promise<GetMyWorkOrdersResponse> {
  try {
    if (!userId) {
      return { success: false, workOrders: [], error: "Kullanıcı ID'si gereklidir." }
    }

    // 1. Kullanıcı veya Personel ID'sini tespit et
    const personnel = await (prisma as any).personel.findFirst({
      where: {
        OR: [
          { userId },
          { id: userId }
        ]
      },
      select: {
        id: true,
        userId: true,
        name: true
      }
    })

    const targetIds = [userId]
    if (personnel?.id && !targetIds.includes(personnel.id)) {
      targetIds.push(personnel.id)
    }
    if (personnel?.userId && !targetIds.includes(personnel.userId)) {
      targetIds.push(personnel.userId)
    }

    // 2. Task (Admin To-Do / Kanban) tablosundan görevleri çek
    const tasks = await prisma.task.findMany({
      where: {
        assignedTo: { in: targetIds }
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            title: true
          }
        }
      },
      orderBy: { createdAt: "desc" }
    })

    // 3. WorkOrder tablosundan iş emirlerini çek
    let workOrders: any[] = []
    try {
      workOrders = await (prisma as any).workOrder.findMany({
        where: {
          assignedToId: { in: targetIds }
        },
        include: {
          project: {
            select: {
              id: true,
              name: true,
              title: true
            }
          }
        },
        orderBy: { createdAt: "desc" }
      })
    } catch (woErr) {
      console.warn("WorkOrder fetch warning:", woErr)
    }

    // 4. Ortak WorkOrderItem formatına dönüştür
    const mappedTasks: WorkOrderItem[] = tasks.map((t) => {
      let priority = "MEDIUM"
      const taskTypeLower = (t.taskType || "").toLowerCase()
      if (taskTypeLower.includes("acil") || taskTypeLower.includes("urgent")) {
        priority = "URGENT"
      } else if (taskTypeLower.includes("yüksek") || taskTypeLower.includes("high")) {
        priority = "HIGH"
      } else if (taskTypeLower.includes("düşük") || taskTypeLower.includes("low")) {
        priority = "LOW"
      }

      return {
        id: t.id,
        title: t.title,
        description: t.description,
        status: t.status || "TODO",
        priority,
        dueDate: t.dueDate,
        createdAt: t.createdAt,
        projectId: t.projectId,
        projectName: t.project?.name || t.project?.title || "Genel Şantiye",
        taskType: t.taskType || "Görev",
        source: "task",
        completionPhoto: (t as any).completionPhoto || null,
        rejectionReason: (t as any).rejectionReason || null
      }
    })

    const mappedWorkOrders: WorkOrderItem[] = workOrders.map((wo: any) => ({
      id: wo.id,
      title: wo.title,
      description: wo.description,
      status: String(wo.status || "TODO"),
      priority: String(wo.priority || "MEDIUM"),
      dueDate: wo.dueDate,
      createdAt: wo.createdAt,
      projectId: wo.projectId,
      projectName: wo.project?.name || wo.project?.title || "Genel Şantiye",
      taskType: wo.department || "İş Emri",
      source: "work_order",
      completionPhoto: wo.completionPhoto || null,
      rejectionReason: wo.rejectionReason || null
    }))

    // İkisini birleştirip tarihe göre sırala
    const combined = [...mappedTasks, ...mappedWorkOrders].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )

    return {
      success: true,
      workOrders: combined
    }
  } catch (error: any) {
    console.error("getMyWorkOrders error:", error)
    return {
      success: false,
      workOrders: [],
      error: error?.message || "İş emirleri alınırken bir hata oluştu."
    }
  }
}

/**
 * ADIM 1: updateWorkOrderStatus(taskId: string, status: string, photoUrl?: string, rejectionReason?: string)
 * Sahadaki personelin görevi "Tamamlandı" (fotoğraf kanıtlı) veya "Reddedildi" (gerekçeli) yapabilmesi için.
 */
export async function updateWorkOrderStatus(
  taskId: string,
  status: string,
  photoUrl?: string,
  rejectionReason?: string
): Promise<UpdateWorkOrderStatusResponse> {
  try {
    if (!taskId) {
      return { success: false, error: "Görev ID'si gereklidir." }
    }

    // Durumu normalize et (TODO, IN_PROGRESS, COMPLETED, REJECTED)
    let normalizedStatus = status.toUpperCase().trim()
    if (
      normalizedStatus === "TAMAMLANDI" ||
      normalizedStatus === "TAMAMLA" ||
      normalizedStatus === "DONE" ||
      normalizedStatus === "COMPLETED"
    ) {
      normalizedStatus = "COMPLETED"
    } else if (
      normalizedStatus === "REDDEDILDI" ||
      normalizedStatus === "REDDEDİLDİ" ||
      normalizedStatus === "REDDET" ||
      normalizedStatus === "REJECTED"
    ) {
      normalizedStatus = "REJECTED"
    } else if (
      normalizedStatus === "DEVAM EDIYOR" ||
      normalizedStatus === "DEVAM EDİYOR" ||
      normalizedStatus === "BAŞLA" ||
      normalizedStatus === "IN_PROGRESS"
    ) {
      normalizedStatus = "IN_PROGRESS"
    } else if (
      normalizedStatus === "YAPILACAK" ||
      normalizedStatus === "DURAKLAT" ||
      normalizedStatus === "TODO"
    ) {
      normalizedStatus = "TODO"
    }

    const updatePayload: Record<string, any> = {
      status: normalizedStatus
    }

    if (normalizedStatus === "COMPLETED" && photoUrl) {
      updatePayload.completionPhoto = photoUrl
    }

    if (normalizedStatus === "REJECTED" && rejectionReason) {
      updatePayload.rejectionReason = rejectionReason
    }

    // 1. Önce Task tablosunu güncelle
    const existingTask = await prisma.task.findUnique({
      where: { id: taskId }
    })

    if (existingTask) {
      const updated = await prisma.task.update({
        where: { id: taskId },
        data: updatePayload
      })

      revalidatePath("/personnel/work-orders")
      revalidatePath("/personnel/tasks")
      revalidatePath("/admin/tasks")
      revalidatePath("/admin/my-tasks")

      let statusMsg = "Yapılacak"
      if (normalizedStatus === "COMPLETED") statusMsg = "Tamamlandı"
      else if (normalizedStatus === "REJECTED") statusMsg = "Reddedildi"
      else if (normalizedStatus === "IN_PROGRESS") statusMsg = "Devam Ediyor"

      return {
        success: true,
        data: updated,
        message: `Görev durumu "${statusMsg}" olarak güncellendi.`
      }
    }

    // 2. Task bulunamadıysa WorkOrder tablosunu güncelle
    try {
      const existingWorkOrder = await (prisma as any).workOrder.findUnique({
        where: { id: taskId }
      })

      if (existingWorkOrder) {
        const updated = await (prisma as any).workOrder.update({
          where: { id: taskId },
          data: updatePayload
        })

        revalidatePath("/personnel/work-orders")
        revalidatePath("/personnel/tasks")
        revalidatePath("/admin/work-orders")

        let statusMsg = "Yapılacak"
        if (normalizedStatus === "COMPLETED") statusMsg = "Tamamlandı"
        else if (normalizedStatus === "REJECTED") statusMsg = "Reddedildi"
        else if (normalizedStatus === "IN_PROGRESS") statusMsg = "Devam Ediyor"

        return {
          success: true,
          data: updated,
          message: `İş emri durumu "${statusMsg}" olarak güncellendi.`
        }
      }
    } catch (woErr) {
      console.warn("WorkOrder update check error:", woErr)
    }

    return {
      success: false,
      error: "Belirtilen görev veya iş emri kaydı bulunamadı."
    }
  } catch (error: any) {
    console.error("updateWorkOrderStatus error:", error)
    return {
      success: false,
      error: error?.message || "Görev durumu güncellenirken bir hata oluştu."
    }
  }
}

/**
 * ADIM 1: getProjectsForSelect()
 * "Yeni İş Emri / Görev Ekle" formundaki Proje dropdown'ını doldurmak için projeleri getirir.
 */
export async function getProjectsForSelect() {
  try {
    const session = await auth()
    const userRole = session?.user?.role
    const isSuperAdmin = userRole === "SUPER_ADMIN"
    let tenantId = (session?.user as any)?.tenantId

    if (!tenantId && session?.user?.id) {
      const dbUser = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { tenantId: true }
      })
      tenantId = dbUser?.tenantId || null
    }

    const where: any = {
      deletedAt: null
    }

    if (!isSuperAdmin && tenantId) {
      where.tenantId = tenantId
    }

    const projects = await prisma.project.findMany({
      where,
      select: {
        id: true,
        title: true,
        name: true
      },
      orderBy: { title: "asc" }
    })

    return projects.map((p) => ({
      id: p.id,
      title: p.title || p.name || "İsimsiz Proje",
      name: p.name || p.title || "İsimsiz Proje"
    }))
  } catch (error) {
    console.error("getProjectsForSelect error:", error)
    return []
  }
}

/**
 * ADIM 1: getPersonnelForSelect()
 * "Yeni İş Emri / Görev Ekle" formundaki Personel dropdown'ını doldurmak için kullanıcı ve personelleri getirir.
 */
export async function getPersonnelForSelect() {
  try {
    const session = await auth()
    const userRole = session?.user?.role
    const isSuperAdmin = userRole === "SUPER_ADMIN"
    let tenantId = (session?.user as any)?.tenantId

    if (!tenantId && session?.user?.id) {
      const dbUser = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { tenantId: true }
      })
      tenantId = dbUser?.tenantId || null
    }

    const userWhere: any = {
      role: {
        in: [
          "STAFF",
          "ENGINEER",
          "SITE_MANAGER",
          "WORKER",
          "PROJECT_MANAGER",
          "ISG_EXPERT",
          "ADMIN"
        ]
      }
    }

    if (!isSuperAdmin && tenantId) {
      userWhere.tenantId = tenantId
    }

    const users = await prisma.user.findMany({
      where: userWhere,
      select: { id: true, name: true, role: true },
      orderBy: { name: "asc" }
    })

    // Personel tablosundan da aktif saha personellerini getir
    const personelWhere: any = {
      status: "ACTIVE"
    }
    if (!isSuperAdmin && tenantId) {
      personelWhere.tenantId = tenantId
    }

    const personels = await prisma.personel.findMany({
      where: personelWhere,
      select: { id: true, name: true, role: true },
      orderBy: { name: "asc" }
    })

    // İsim veya ID bazında tekilleştir ve sırala
    const map = new Map<string, { id: string; name: string; role: string }>()
    for (const u of users) {
      if (u.name) {
        map.set(u.id, { id: u.id, name: u.name, role: String(u.role) })
      }
    }
    for (const p of personels) {
      if (p.name && !map.has(p.id)) {
        map.set(p.id, { id: p.id, name: p.name, role: String(p.role) })
      }
    }

    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name, "tr"))
  } catch (error) {
    console.error("getPersonnelForSelect error:", error)
    return []
  }
}

export interface ProjectMediaGalleryItem {
  id: string
  title: string
  completionPhoto: string
  updatedAt: Date | string
  completedAt?: Date | string
  assignedToName?: string | null
  assignedTo?: {
    name: string | null
  } | null
  source?: "work_order" | "task"
}

/**
 * ADIM 1: getProjectMediaGallery(projectId: string)
 * Projeye ait, durumu COMPLETED olan ve completionPhoto alanı null olmayan görevlerin kanıt fotoğraflarını çeker.
 */
export async function getProjectMediaGallery(projectId: string): Promise<ProjectMediaGalleryItem[]> {
  try {
    if (!projectId) return []

    // 1. WorkOrder tablosundan kanıt fotoğraflı tamamlanmış iş emirlerini çek
    let workOrders: any[] = []
    try {
      workOrders = await (prisma as any).workOrder.findMany({
        where: {
          projectId,
          status: { in: ["COMPLETED", "DONE"] },
          completionPhoto: { not: null }
        },
        include: {
          assignedTo: {
            select: { name: true }
          }
        },
        orderBy: {
          updatedAt: "desc"
        }
      })
    } catch (woErr) {
      console.warn("WorkOrder media gallery fetch error:", woErr)
    }

    // 2. Task tablosundan da kanıt fotoğraflı tamamlanan görevleri çek
    let tasks: any[] = []
    try {
      tasks = await (prisma as any).task.findMany({
        where: {
          projectId,
          status: { in: ["COMPLETED", "DONE"] },
          completionPhoto: { not: null }
        },
        orderBy: {
          createdAt: "desc"
        }
      })
    } catch (tErr) {
      console.warn("Task media gallery fetch error:", tErr)
    }

    // Task'lar için personellerin isimlerini al
    const assignedUserIds = tasks.map((t) => t.assignedTo).filter(Boolean)
    const personMap = new Map<string, string>()

    if (assignedUserIds.length > 0) {
      try {
        const users = await prisma.user.findMany({
          where: { id: { in: assignedUserIds } },
          select: { id: true, name: true }
        })
        users.forEach((u) => {
          if (u.name) personMap.set(u.id, u.name)
        })

        const personels = await prisma.personel.findMany({
          where: { id: { in: assignedUserIds } },
          select: { id: true, name: true }
        })
        personels.forEach((p) => {
          if (p.name) personMap.set(p.id, p.name)
        })
      } catch (pErr) {
        console.warn("Assigned person resolution error:", pErr)
      }
    }

    const mappedWorkOrders: ProjectMediaGalleryItem[] = workOrders.map((wo) => ({
      id: wo.id,
      title: wo.title,
      completionPhoto: wo.completionPhoto!,
      updatedAt: wo.updatedAt || wo.createdAt,
      completedAt: wo.updatedAt || wo.createdAt,
      assignedToName: wo.assignedTo?.name || null,
      assignedTo: wo.assignedTo || null,
      source: "work_order"
    }))

    const mappedTasks: ProjectMediaGalleryItem[] = tasks.map((t) => ({
      id: t.id,
      title: t.title,
      completionPhoto: t.completionPhoto!,
      updatedAt: (t as any).updatedAt || t.createdAt,
      completedAt: (t as any).updatedAt || t.createdAt,
      assignedToName: personMap.get(t.assignedTo) || null,
      assignedTo: personMap.get(t.assignedTo) ? { name: personMap.get(t.assignedTo)! } : null,
      source: "task"
    }))

    // Birleştir ve en yeniden eskiye doğru sırala
    const combined = [...mappedWorkOrders, ...mappedTasks].sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    )

    return combined
  } catch (error) {
    console.error("getProjectMediaGallery error:", error)
    return []
  }
}


