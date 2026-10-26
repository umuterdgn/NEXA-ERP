/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * GeofenceZone API - Poligon Sanal Çit & İSG Alan Yönetimi
 */

import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get("projectId")

    const where: any = { isActive: true }
    if (projectId) {
      where.projectId = projectId
    }

    let geofences = await prisma.geofenceZone.findMany({
      where,
      orderBy: { createdAt: "desc" }
    })

    // Geriye dönük uyumluluk: Eğer GeofenceZone boşsa ve SiteZone'da kayıt varsa aktar / getir
    if (geofences.length === 0 && projectId) {
      const siteZones = await prisma.siteZone.findMany({
        where: { projectId },
        orderBy: { createdAt: "desc" }
      })

      if (siteZones.length > 0) {
        const project = await prisma.project.findUnique({
          where: { id: projectId },
          select: { tenantId: true }
        })
        const tenantId = project?.tenantId || "default-tenant"

        // SiteZone'dan GeofenceZone'a migrate et
        for (const sz of siteZones) {
          let coords = sz.polygonCoordinates as any
          if (typeof coords === "string") {
            try { coords = JSON.parse(coords) } catch {}
          }
          if (Array.isArray(coords) && coords.length >= 3) {
            await prisma.geofenceZone.create({
              data: {
                projectId,
                tenantId,
                name: sz.title,
                type: sz.zoneType || (sz.category === "RISK" ? "DANGER_ZONE" : sz.category === "REST_AREA" ? "REST_AREA" : "MAIN_SITE"),
                coordinates: coords,
                isActive: true
              }
            }).catch(() => null)
          }
        }

        geofences = await prisma.geofenceZone.findMany({
          where,
          orderBy: { createdAt: "desc" }
        })
      }
    }

    return NextResponse.json(geofences)
  } catch (error) {
    console.error("GeofenceZone GET Error:", error)
    return NextResponse.json(
      { error: "Sanal çit alanları alınırken hata oluştu" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    const body = await request.json()
    const {
      projectId,
      tenantId: bodyTenantId,
      name,
      title,
      type: bodyType,
      zoneType,
      coordinates,
      polygonCoordinates
    } = body

    if (!projectId) {
      return NextResponse.json(
        { error: "Proje kimliği (projectId) zorunludur" },
        { status: 400 }
      )
    }

    const zoneName = (name || title || "").trim()
    if (!zoneName) {
      return NextResponse.json(
        { error: "Alan Adı (name) zorunludur" },
        { status: 400 }
      )
    }

    // Koordinatları doğrula
    const rawCoords = coordinates || polygonCoordinates
    let coordsArray: Array<{ lat: number; lng: number }> = []
    if (Array.isArray(rawCoords)) {
      coordsArray = rawCoords.map((pt: any) => ({
        lat: Number(pt.lat),
        lng: Number(pt.lng)
      }))
    }

    if (coordsArray.length < 3) {
      return NextResponse.json(
        { error: "Poligon sanal çit için en az 3 köşe noktası girilmelidir" },
        { status: 400 }
      )
    }

    // Alan tipi: MAIN_SITE (Mavi), DANGER_ZONE (Kırmızı), REST_AREA (Yeşil)
    let finalType = bodyType || zoneType || "MAIN_SITE"
    if (!["MAIN_SITE", "DANGER_ZONE", "REST_AREA"].includes(finalType)) {
      finalType = "MAIN_SITE"
    }

    // TenantId belirleme
    let tenantId = bodyTenantId || (session?.user as any)?.tenantId
    if (!tenantId) {
      const project = await prisma.project.findUnique({
        where: { id: projectId },
        select: { tenantId: true }
      })
      tenantId = project?.tenantId || "default-tenant"
    }

    // 1. GeofenceZone tablosuna kaydet
    const geofence = await prisma.geofenceZone.create({
      data: {
        projectId,
        tenantId,
        name: zoneName,
        type: finalType,
        coordinates: coordsArray,
        isActive: true
      }
    })

    // 2. Geriye dönük uyumluluk: SiteZone tablosunu da besle
    const sumLat = coordsArray.reduce((acc, p) => acc + p.lat, 0) / coordsArray.length
    const sumLng = coordsArray.reduce((acc, p) => acc + p.lng, 0) / coordsArray.length
    const category = finalType === "DANGER_ZONE" ? "RISK" : finalType === "REST_AREA" ? "REST_AREA" : "BUILDING"

    await prisma.siteZone.create({
      data: {
        projectId,
        title: zoneName,
        zoneType: finalType,
        category,
        latitude: sumLat,
        longitude: sumLng,
        polygonCoordinates: coordsArray
      }
    }).catch((err) => console.warn("SiteZone sync warning:", err))

    return NextResponse.json(geofence, { status: 201 })
  } catch (error: any) {
    console.error("GeofenceZone POST Error:", error)
    return NextResponse.json(
      { error: error?.message || "Sanal çit kaydedilirken hata oluştu" },
      { status: 500 }
    )
  }
}
