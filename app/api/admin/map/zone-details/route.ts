/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Nexa ERP - GIS Zone Details API (Tasks, Non-conformances & Active Personnel)
 */

import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import * as turf from "@turf/turf"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const zoneId = searchParams.get("zoneId")
    const projectId = searchParams.get("projectId")

    if (!zoneId && !projectId) {
      return NextResponse.json({ error: "zoneId or projectId is required" }, { status: 400 })
    }

    // 1. Fetch Zone / Geofence coordinates
    let polygonCoords: Array<{ lat: number; lng: number }> = []
    let resolvedProjectId = projectId

    if (zoneId) {
      const geofence = await prisma.geofenceZone.findUnique({
        where: { id: zoneId }
      })
      if (geofence) {
        resolvedProjectId = resolvedProjectId || geofence.projectId
        const coords = geofence.coordinates as any
        if (Array.isArray(coords)) polygonCoords = coords
        else if (typeof coords === "string") {
          try { polygonCoords = JSON.parse(coords) } catch {}
        }
      } else {
        const siteZone = await prisma.siteZone.findUnique({
          where: { id: zoneId }
        })
        if (siteZone) {
          resolvedProjectId = resolvedProjectId || siteZone.projectId
          const coords = siteZone.polygonCoordinates as any
          if (Array.isArray(coords)) polygonCoords = coords
          else if (typeof coords === "string") {
            try { polygonCoords = JSON.parse(coords) } catch {}
          }
        }
      }
    }

    // 2. Fetch Tasks assigned to this zone or project
    const taskWhere: any = {}
    if (zoneId) {
      taskWhere.OR = [
        { zoneId },
        ...(resolvedProjectId ? [{ projectId: resolvedProjectId }] : [])
      ]
    } else if (resolvedProjectId) {
      taskWhere.projectId = resolvedProjectId
    }

    const tasks = await prisma.task.findMany({
      where: taskWhere,
      take: 12,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        title: true,
        description: true,
        status: true,
        taskType: true,
        dueDate: true,
        assignedTo: true,
        createdAt: true
      }
    }).catch(() => [])

    // 3. Fetch DÖF / Deficiencies & Non-Conformances
    const deficiencies = await prisma.deficiency.findMany({
      where: {
        ...(resolvedProjectId ? { projectId: resolvedProjectId } : {}),
        status: { not: "CLOSED" }
      },
      take: 6,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        element: true,
        description: true,
        priority: true,
        status: true,
        dueDate: true
      }
    }).catch(() => [])

    const nonConformances = await prisma.nonConformance.findMany({
      where: {
        ...(resolvedProjectId ? { projectId: resolvedProjectId } : {}),
        status: { not: "RESOLVED" }
      },
      take: 6,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        reportNo: true,
        description: true,
        severity: true,
        status: true,
        deadline: true
      }
    }).catch(() => [])

    // 4. Fetch Personnel inside this polygon
    let matchingPersonnel: any[] = []
    const allPersonnel = await prisma.personel.findMany({
      where: {
        lastKnownLat: { not: null },
        lastKnownLng: { not: null }
      },
      select: {
        id: true,
        name: true,
        position: true,
        department: true,
        role: true,
        lastKnownLat: true,
        lastKnownLng: true
      }
    }).catch(() => [])

    if (polygonCoords.length >= 3) {
      try {
        const ring: [number, number][] = polygonCoords.map(c => [c.lng, c.lat])
        if (ring[0][0] !== ring[ring.length - 1][0] || ring[0][1] !== ring[ring.length - 1][1]) {
          ring.push([ring[0][0], ring[0][1]])
        }
        const poly = turf.polygon([ring])

        matchingPersonnel = allPersonnel.filter(p => {
          if (p.lastKnownLat && p.lastKnownLng) {
            const pt = turf.point([p.lastKnownLng, p.lastKnownLat])
            return turf.booleanPointInPolygon(pt, poly)
          }
          return false
        })
      } catch (err) {
        console.warn("Turf point in polygon check skipped:", err)
      }
    } else {
      matchingPersonnel = allPersonnel.slice(0, 5)
    }

    return NextResponse.json({
      tasks,
      dofs: [
        ...deficiencies.map(d => ({ ...d, type: "DEFICIENCY" })),
        ...nonConformances.map(nc => ({ ...nc, type: "NCR" }))
      ],
      personnel: matchingPersonnel
    })
  } catch (error: any) {
    console.error("GIS zone details error:", error)
    return NextResponse.json(
      { error: error?.message || "Internal server error" },
      { status: 500 }
    )
  }
}

