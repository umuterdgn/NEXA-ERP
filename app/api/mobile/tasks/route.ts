/**
 * © 2026 NXA Software. All rights reserved.
 * Nexa Mobile - Tasks & Work Orders API (Auth, RBAC & Strict Tenant Isolated)
 */

import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getMobileAuth } from "@/lib/mobile-auth"
import {
  assertRecordTenantScope,
  assertTenantAndProjectAccess,
  requireAnyModule,
} from "@/lib/api-rbac"

export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  try {
    const auth = await getMobileAuth(request)
    if (!auth) {
      return NextResponse.json({ error: "Yetkisiz oturum." }, { status: 401 })
    }

    const denied = requireAnyModule(auth, ["tasks_work_orders"])
    if (denied) return denied

    const { tenantId, userId, assignedProjectIds } = auth
    const { searchParams } = new URL(request.url)
    const reqProjectId = searchParams.get("projectId")
    const status = searchParams.get("status")
    const reqUserId = searchParams.get("userId")

    if (reqProjectId) {
      const accessErr = await assertTenantAndProjectAccess(auth, reqProjectId)
      if (accessErr) return accessErr
    }

    const whereClause: any = {
      ...(tenantId ? { tenantId } : {}),
    }

    if (reqProjectId) {
      whereClause.projectId = reqProjectId
    } else if (assignedProjectIds.length > 0) {
      whereClause.projectId = { in: assignedProjectIds }
    }

    if (status && status !== "ALL") {
      if (status === "ACTIVE") {
        whereClause.status = { in: ["BEKLİYOR", "TODO", "IN_PROGRESS", "DEVAM EDİYOR"] }
      } else if (status === "COMPLETED") {
        whereClause.status = { in: ["TAMAMLANDI", "COMPLETED", "DONE"] }
      } else {
        whereClause.status = status
      }
    }

    if (reqUserId) {
      whereClause.OR = [{ assignedTo: reqUserId }, { assignedTo: null }]
    } else if (auth.role === "WORKER" || auth.role === "FITOUT_TECH") {
      whereClause.OR = [{ assignedTo: userId }, { assignedTo: null }]
    }

    const tasks = await prisma.task.findMany({
      where: whereClause,
      include: {
        project: {
          select: { id: true, name: true, title: true },
        },
        zone: {
          select: { id: true, name: true, code: true },
        },
      },
      orderBy: { dueDate: "asc" },
      take: 50,
    })

    const geofenceZones = await prisma.geofenceZone
      .findMany({
        where: {
          isActive: true,
          ...(tenantId ? { project: { tenantId } } : {}),
        },
        select: {
          id: true,
          name: true,
          type: true,
          coordinates: true,
          projectId: true,
        },
      })
      .catch(() => [])

    const mappedTasks = tasks.map((t, idx) => {
      let priority: "KRİTİK" | "YÜKSEK" | "ORTA" | "DÜŞÜK" = "ORTA"
      if (t.taskType?.includes("Beton") || t.taskType?.includes("İSG")) priority = "KRİTİK"
      else if (t.taskType?.includes("Demir")) priority = "YÜKSEK"

      let mappedStatus: "BEKLİYOR" | "DEVAM EDİYOR" | "TAMAMLANDI" = "BEKLİYOR"
      if (t.status === "DONE" || t.status === "COMPLETED") mappedStatus = "TAMAMLANDI"
      else if (t.status === "IN_PROGRESS") mappedStatus = "DEVAM EDİYOR"

      const matchedGeofence =
        geofenceZones.find((g) => g.id === t.zoneId) ||
        geofenceZones.find((g) => t.zone?.name && g.name.toLowerCase().includes(t.zone.name.toLowerCase())) ||
        geofenceZones.find((g) => t.projectId && g.projectId === t.projectId) ||
        null

      const zoneCoordinates: any = matchedGeofence?.coordinates || null
      const zoneType =
        matchedGeofence?.type ||
        (t.taskType?.includes("Boru") || t.taskType?.includes("Elektrik") || t.title.includes("Tava")
          ? "POLYLINE"
          : t.taskType?.includes("İSG") || priority === "KRİTİK"
          ? "DANGER_ZONE"
          : "POLYGON")

      return {
        id: t.id,
        code: `TSK-${(idx + 101).toString()}`,
        title: t.title,
        description: t.description || "",
        location: t.zone?.name
          ? `${t.project?.name || t.project?.title || "Şantiye"} • ${t.zone.name}`
          : t.project?.name || t.project?.title || "Şantiye",
        zoneId: t.zoneId || matchedGeofence?.id || undefined,
        zoneName: t.zone?.name || matchedGeofence?.name || null,
        zoneCoordinates,
        zoneType,
        priority,
        status: mappedStatus,
        dueDate: t.dueDate
          ? new Date(t.dueDate).toLocaleDateString("tr-TR", {
              day: "numeric",
              month: "long",
              hour: "2-digit",
              minute: "2-digit",
            })
          : "Belirtilmedi",
        boqItemId: t.boqItemId || undefined,
        projectId: t.projectId || undefined,
      }
    })

    return NextResponse.json({ success: true, count: mappedTasks.length, tasks: mappedTasks })
  } catch (error: any) {
    console.error("[API_MOBILE_TASKS_GET] Error:", error)
    return NextResponse.json({ error: error.message || "Görevler getirilemedi" }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const auth = await getMobileAuth(request)
    if (!auth) {
      return NextResponse.json({ error: "Yetkisiz oturum." }, { status: 401 })
    }

    const denied = requireAnyModule(auth, ["tasks_work_orders"])
    if (denied) return denied

    const body = await request.json().catch(() => ({}))
    const { taskId, status } = body

    if (!taskId) {
      return NextResponse.json({ error: "Task ID gereklidir" }, { status: 400 })
    }

    const existingTask = await prisma.task.findUnique({ where: { id: taskId } })
    if (!existingTask) {
      return NextResponse.json({ error: "Görev bulunamadı" }, { status: 404 })
    }

    const scopeErr = assertRecordTenantScope(auth, existingTask)
    if (scopeErr) return scopeErr

    let dbStatus = "TODO"
    if (status === "TAMAMLANDI" || status === "DONE" || status === "COMPLETED") dbStatus = "COMPLETED"
    else if (status === "DEVAM EDİYOR" || status === "IN_PROGRESS") dbStatus = "IN_PROGRESS"

    const updated = await prisma.task.update({
      where: { id: taskId },
      data: { status: dbStatus },
      include: { zone: true },
    })

    try {
      if (dbStatus === "COMPLETED" || dbStatus === "IN_PROGRESS") {
        if (updated.punchListId) {
          await prisma.punchList.updateMany({
            where: { id: updated.punchListId },
            data: { status: "FIXED" },
          })
        } else {
          await prisma.punchList.updateMany({
            where: { taskId: updated.id },
            data: { status: "FIXED" },
          })
        }
      }
    } catch {}

    if (dbStatus === "COMPLETED" && updated.zone) {
      const zoneToUpdate = updated.zone
      const currentRate = zoneToUpdate.progressRate || 0
      const newRate = Math.min(100, Math.round((currentRate + 20) * 10) / 10)

      await prisma.zone.update({
        where: { id: zoneToUpdate.id },
        data: {
          progressRate: newRate,
          status: newRate >= 100 ? "COMPLETED" : "IN_PROGRESS",
        },
      })
    }

    return NextResponse.json({ success: true, task: updated })
  } catch (error: any) {
    console.error("[API_MOBILE_TASKS_PATCH] Error:", error)
    return NextResponse.json({ error: error.message || "Görev güncellenemedi" }, { status: 500 })
  }
}
