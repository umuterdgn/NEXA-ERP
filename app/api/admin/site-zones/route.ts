/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * This code is the property of NXA Software.
 */

import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    const userRole = session?.user?.role as string
    const isSuperAdmin = userRole === "SUPER_ADMIN"
    const tenantId = (session?.user as any)?.tenantId as string | undefined

    if (!session?.user || (!tenantId && !isSuperAdmin)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get('projectId')

    const tenantFilter: any = !isSuperAdmin ? (tenantId ? { tenantId } : { tenantId: "non-existent" }) : {}
    const where: any = {
      ...tenantFilter,
      ...(projectId ? { projectId } : {})
    }

    let siteZones = await prisma.siteZone.findMany({
      where,
      orderBy: { createdAt: 'desc' }
    })

    // If no zones exist yet for this project, auto-seed realistic polygon geofences
    if (siteZones.length === 0 && projectId) {
      const project = await prisma.project.findFirst({
        where: { id: projectId, ...tenantFilter },
        select: { latitude: true, longitude: true, title: true, name: true }
      })

      if (project && project.latitude && project.longitude) {
        const lat = project.latitude
        const lng = project.longitude

        const initialZonesData = [
          {
            projectId,
            tenantId: tenantId || null,
            title: "Ana Şantiye Çevreleme Sınırı",
            zoneType: "MAIN_SITE",
            category: "BUILDING",
            latitude: lat,
            longitude: lng,
            polygonCoordinates: [
              { lat: lat + 0.0011, lng: lng - 0.0012 },
              { lat: lat + 0.0012, lng: lng + 0.0013 },
              { lat: lat - 0.0010, lng: lng + 0.0014 },
              { lat: lat - 0.0012, lng: lng - 0.0010 }
            ],
            supervisor: "Kemal Şahin (Şantiye Şefi)"
          },
          {
            projectId,
            tenantId: tenantId || null,
            title: "A Blok - Kule Vinç & Ağır Yük Riski",
            zoneType: "DANGER_ZONE",
            category: "RISK",
            latitude: lat + 0.0002,
            longitude: lng + 0.0003,
            polygonCoordinates: [
              { lat: lat + 0.00045, lng: lng + 0.00015 },
              { lat: lat + 0.00055, lng: lng + 0.00065 },
              { lat: lat + 0.00010, lng: lng + 0.00075 },
              { lat: lat - 0.00010, lng: lng + 0.00020 }
            ],
            supervisor: "Ali Öztürk (İSG Uzmanı)"
          },
          {
            projectId,
            tenantId: tenantId || null,
            title: "İdari Bina & Dinlenme Alanı",
            zoneType: "REST_AREA",
            category: "REST_AREA",
            latitude: lat - 0.0005,
            longitude: lng - 0.0006,
            polygonCoordinates: [
              { lat: lat - 0.0003, lng: lng - 0.0008 },
              { lat: lat - 0.0003, lng: lng - 0.0004 },
              { lat: lat - 0.0007, lng: lng - 0.0004 },
              { lat: lat - 0.0007, lng: lng - 0.0008 }
            ],
            supervisor: "Mehmet Demir (Saha Mühendisi)"
          }
        ]

        await prisma.siteZone.createMany({
          data: initialZonesData
        })

        siteZones = await prisma.siteZone.findMany({
          where,
          orderBy: { createdAt: 'desc' }
        })
      }
    }

    return NextResponse.json(siteZones)
  } catch (error) {
    console.error("Failed to fetch site zones:", error)
    return NextResponse.json(
      { error: "Alanlar yüklenirken hata oluştu" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    const userRole = session?.user?.role as string
    const isSuperAdmin = userRole === "SUPER_ADMIN"
    const tenantId = (session?.user as any)?.tenantId as string | undefined

    if (!session?.user || (!tenantId && !isSuperAdmin)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { 
      projectId, 
      title, 
      zoneType: inputZoneType,
      category, 
      latitude, 
      longitude, 
      radius, 
      polygonCoordinates 
    } = body

    if (!projectId || !title) {
      return NextResponse.json(
        { error: "Proje kimliği ve alan adı zorunludur" },
        { status: 400 }
      )
    }

    // Determine zoneType and category
    let zoneType = inputZoneType || "MAIN_SITE"
    if (!inputZoneType && category) {
      if (category === 'RISK') zoneType = 'DANGER_ZONE'
      else if (category === 'REST_AREA') zoneType = 'REST_AREA'
      else zoneType = 'MAIN_SITE'
    }

    const validZoneTypes = ['MAIN_SITE', 'DANGER_ZONE', 'REST_AREA']
    if (!validZoneTypes.includes(zoneType)) {
      zoneType = 'MAIN_SITE'
    }

    // Determine category for backwards compatibility
    let resolvedCategory = category
    if (!resolvedCategory) {
      if (zoneType === 'DANGER_ZONE') resolvedCategory = 'RISK'
      else if (zoneType === 'REST_AREA') resolvedCategory = 'REST_AREA'
      else resolvedCategory = 'BUILDING'
    }

    // Calculate centroid if polygonCoordinates is provided but latitude/longitude are not
    let finalLat = latitude
    let finalLng = longitude

    if (Array.isArray(polygonCoordinates) && polygonCoordinates.length > 0) {
      if (finalLat === undefined || finalLat === null || finalLng === undefined || finalLng === null) {
        const sumLat = polygonCoordinates.reduce((acc: number, pt: any) => acc + (Number(pt.lat) || 0), 0)
        const sumLng = polygonCoordinates.reduce((acc: number, pt: any) => acc + (Number(pt.lng) || 0), 0)
        finalLat = sumLat / polygonCoordinates.length
        finalLng = sumLng / polygonCoordinates.length
      }
    }

    const siteZone = await prisma.siteZone.create({
      data: {
        projectId,
        title,
        zoneType,
        category: resolvedCategory,
        latitude: finalLat ?? null,
        longitude: finalLng ?? null,
        radius: radius !== undefined ? Number(radius) : null,
        polygonCoordinates: polygonCoordinates || null,
        tenantId: tenantId || null,
      }
    })

    return NextResponse.json(siteZone, { status: 201 })
  } catch (error) {
    console.error("Failed to create site zone:", error)
    return NextResponse.json(
      { error: "Alan oluşturulurken hata oluştu" },
      { status: 500 }
    )
  }
}