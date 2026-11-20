/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * POST /api/mobile/sync/batch
 * Çevrimdışı (Offline) Mobil Senkronizasyon Kuyruğu Toplu İşleme API'si
 */

import { NextResponse } from "next/server"
import { getMobileAuth } from "@/lib/mobile-auth"
import { prisma } from "@/lib/prisma"
import { requireAnyModule } from "@/lib/api-rbac"

export const runtime = "nodejs"

interface SyncItem {
  id: string // Client-side unique event UUID
  action: "TASK_UPDATE" | "ATTENDANCE" | "DEFICIENCY" | "LOCATION_LOG" | "WORK_PROOF"
  payload: any
  clientTimestamp: string
}

export async function POST(request: Request) {
  try {
    const auth = await getMobileAuth(request)
    if (!auth) {
      return NextResponse.json({ error: "Yetkisiz oturum." }, { status: 401 })
    }

    const denied = requireAnyModule(auth, ["offline_sync"])
    if (denied) return denied

    const { userId, tenantId, assignedProjectIds, name, email } = auth
    const body = await request.json().catch(() => ({}))
    const items: SyncItem[] = Array.isArray(body.items) ? body.items : []

    if (items.length === 0) {
      return NextResponse.json({ success: true, processedCount: 0, results: [] })
    }

    const personel = await prisma.personel.findFirst({
      where: {
        ...(tenantId ? { tenantId } : {}),
        OR: [
          { userId },
          ...(email ? [{ email }] : []),
        ],
      },
      select: { id: true },
    })

    const results: Array<{ id: string; status: "SYNCED" | "CONFLICT" | "ERROR"; error?: string }> = []

    for (const item of items) {
      try {
        if (item.action === "TASK_UPDATE") {
          const { taskId, status } = item.payload
          if (taskId) {
            const existingTask = await prisma.task.findUnique({ where: { id: taskId } })
            if (!existingTask) {
              results.push({ id: item.id, status: "ERROR", error: "Görev bulunamadı" })
              continue
            }
            if (existingTask.tenantId && tenantId && existingTask.tenantId !== tenantId && auth.role !== "SUPER_ADMIN") {
              results.push({ id: item.id, status: "CONFLICT", error: "Yetkisiz görev erişimi" })
              continue
            }
            await prisma.task.update({
              where: { id: taskId },
              data: {
                status: status === "TAMAMLANDI" || status === "DONE" ? "COMPLETED" : "IN_PROGRESS",
              },
            })
            results.push({ id: item.id, status: "SYNCED" })
            continue
          }
        } else if (item.action === "ATTENDANCE") {
          const { checkInTime, projectId } = item.payload
          const targetProject = projectId || assignedProjectIds[0]
          if (targetProject) {
            await prisma.attendanceRecord.create({
              data: {
                tenantId,
                personelId: personel?.id || null,
                workerName: name || email || "Saha Personeli",
                projectId: targetProject,
                date: new Date(item.clientTimestamp || Date.now()),
                checkIn: checkInTime ? new Date(checkInTime) : new Date(),
                status: "PRESENT",
              },
            })
            results.push({ id: item.id, status: "SYNCED" })
            continue
          }
        } else if (item.action === "LOCATION_LOG") {
          const { lat, lng, speed, accuracy, source } = item.payload
          if (lat != null && lng != null) {
            await prisma.locationLog.create({
              data: {
                userId,
                tenantId,
                latitude: Number(lat),
                longitude: Number(lng),
                lat: Number(lat),
                lng: Number(lng),
                speed: speed != null ? Number(speed) : null,
                accuracy: accuracy != null ? Number(accuracy) : null,
                source: source || "OFFLINE_GPS",
                recordedAt: new Date(item.clientTimestamp || Date.now()),
                timestamp: new Date(item.clientTimestamp || Date.now()),
              },
            })
            results.push({ id: item.id, status: "SYNCED" })
            continue
          }
        } else if (item.action === "DEFICIENCY") {
          const { element, floor, category, description, photoUrl, projectId } = item.payload
          const targetProject = projectId || assignedProjectIds[0]
          if (description) {
            await prisma.deficiency.create({
              data: {
                tenantId,
                projectId: targetProject || null,
                element: element || "Saha Elemanı",
                floor: floor || "Zemin",
                category: category || "Genel Kusur",
                description,
                photoUrl: photoUrl || null,
                status: "OPEN",
              },
            })
            results.push({ id: item.id, status: "SYNCED" })
            continue
          }
        }

        results.push({ id: item.id, status: "ERROR", error: "Bilinmeyen veya eksik eylem verisi" })
      } catch (itemErr: any) {
        results.push({ id: item.id, status: "ERROR", error: itemErr?.message || "İşlem hatası" })
      }
    }

    const syncedCount = results.filter((r) => r.status === "SYNCED").length

    return NextResponse.json({
      success: true,
      processedCount: syncedCount,
      totalCount: items.length,
      results,
    })
  } catch (error: any) {
    console.error("Mobile batch sync error:", error)
    return NextResponse.json({ error: "Toplu senkronizasyon başarısız." }, { status: 500 })
  }
}
