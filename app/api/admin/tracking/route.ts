/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * BLE Equipment Tracking API
 */

import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get("projectId")

    const whereClause: any = {}
    if (projectId && projectId !== "all") {
      whereClause.projectId = projectId
    }

    let equipments = await prisma.equipment.findMany({
      where: whereClause,
      include: {
        project: {
          select: {
            id: true,
            title: true,
            name: true,
            latitude: true,
            longitude: true
          }
        },
        assignedTo: {
          select: {
            id: true,
            name: true,
            department: true,
            phone: true
          }
        }
      },
      orderBy: { updatedAt: "desc" }
    })

    // If a project is selected and no equipments are stored in DB yet, generate context-aware mock equipment
    if (equipments.length === 0 && projectId && projectId !== "all") {
      const project = await prisma.project.findUnique({
        where: { id: projectId }
      })

      if (project && project.latitude && project.longitude) {
        const baseLat = project.latitude
        const baseLng = project.longitude
        const pName = project.title || project.name || "Seçili Şantiye"

        const fallbackItems = [
          {
            id: `mock-1-${projectId}`,
            name: "Hilti TE 70-ATC Kırıcı Delici",
            type: "ELEKTRONIK",
            category: "Delme & Kırma",
            status: "AKTIF",
            serialNumber: "SN-HLT-70912",
            bleTagId: "BLE-HLT-001",
            latitude: baseLat + 0.00045,
            longitude: baseLng + 0.00035,
            lastSeenAt: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
            projectId: project.id,
            project: {
              id: project.id,
              title: pName,
              name: pName,
              latitude: baseLat,
              longitude: baseLng
            },
            assignedTo: {
              id: "pers-1",
              name: "Ahmet Usta (Kalıp Şefi)",
              department: "Kaba Yapı",
              phone: "0532 555 12 34"
            }
          },
          {
            id: `mock-2-${projectId}`,
            name: "Bosch GRL 600 CHV Rotasyon Lazeri",
            type: "ELEKTRONIK",
            category: "Ölçüm Cihazı",
            status: "AKTIF",
            serialNumber: "SN-BSH-60041",
            bleTagId: "BLE-BSH-084",
            latitude: baseLat - 0.00038,
            longitude: baseLng - 0.00042,
            lastSeenAt: new Date(Date.now() - 14 * 60 * 1000).toISOString(),
            projectId: project.id,
            project: {
              id: project.id,
              title: pName,
              name: pName,
              latitude: baseLat,
              longitude: baseLng
            },
            assignedTo: {
              id: "pers-2",
              name: "Mehmet Demir (Topoğraf)",
              department: "Harita & Ölçüm",
              phone: "0533 444 56 78"
            }
          },
          {
            id: `mock-3-${projectId}`,
            name: "CAT 320 Ekskavatör (Paletli)",
            type: "IS_MAKINESI",
            category: "Ağır İş Makinesi",
            status: "AKTIF",
            serialNumber: "SN-CAT-32099",
            bleTagId: "BLE-CAT-320",
            latitude: baseLat + 0.00062,
            longitude: baseLng + 0.00078,
            lastSeenAt: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
            projectId: project.id,
            project: {
              id: project.id,
              title: pName,
              name: pName,
              latitude: baseLat,
              longitude: baseLng
            },
            assignedTo: {
              id: "pers-3",
              name: "Ali Kara (Operatör)",
              department: "Makine Parkı",
              phone: "0542 333 78 90"
            }
          },
          {
            id: `mock-4-${projectId}`,
            name: "Stihl TS 800 Beton Kesme Testeresi",
            type: "ELEKTRONIK",
            category: "Kesim Ekipmanı",
            status: "KAYIP",
            serialNumber: "SN-STL-80023",
            bleTagId: "BLE-STL-912",
            latitude: baseLat - 0.00072,
            longitude: baseLng - 0.00031,
            lastSeenAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
            projectId: project.id,
            project: {
              id: project.id,
              title: pName,
              name: pName,
              latitude: baseLat,
              longitude: baseLng
            },
            assignedTo: null
          }
        ]

        return NextResponse.json({
          equipments: fallbackItems,
          stats: {
            total: fallbackItems.length,
            active: fallbackItems.filter(e => e.status === "AKTIF").length,
            lost: fallbackItems.filter(e => e.status === "KAYIP").length
          }
        })
      }
    }

    // Normalizing status representation
    const formatted = equipments.map(eq => {
      // Normalize status: "AVAILABLE" or "AKTIF" or "ACTIVE" => "AKTIF", "KAYIP" or "LOST" => "KAYIP"
      const rawStatus = (eq.status || "").toUpperCase()
      const isLost = rawStatus === "KAYIP" || rawStatus === "LOST" || rawStatus === "MAINTENANCE"
      const statusDisplay = isLost ? "KAYIP" : "AKTIF"

      return {
        id: eq.id,
        name: eq.name,
        type: eq.type,
        category: eq.category || "Genel Ekipman",
        status: statusDisplay,
        rawStatus: eq.status,
        serialNumber: eq.serialNumber,
        bleTagId: eq.bleTagId || eq.serialNumber || "BLE-N/A",
        latitude: eq.latitude ?? eq.lastLat,
        longitude: eq.longitude ?? eq.lastLng,
        lastSeenAt: eq.lastSeenAt ? eq.lastSeenAt.toISOString() : eq.updatedAt.toISOString(),
        projectId: eq.projectId,
        project: eq.project ? {
          id: eq.project.id,
          title: eq.project.title || eq.project.name || "Şantiye",
          name: eq.project.name || eq.project.title || "Şantiye",
          latitude: eq.project.latitude,
          longitude: eq.project.longitude
        } : null,
        assignedTo: eq.assignedTo
      }
    })

    const validWithCoords = formatted.filter(e => e.latitude != null && e.longitude != null)

    return NextResponse.json({
      equipments: validWithCoords,
      stats: {
        total: validWithCoords.length,
        active: validWithCoords.filter(e => e.status === "AKTIF").length,
        lost: validWithCoords.filter(e => e.status === "KAYIP").length
      }
    })
  } catch (error) {
    console.error("Error in tracking API:", error)
    return NextResponse.json(
      { error: "Ekipman konum verileri alınamadı" },
      { status: 500 }
    )
  }
}
