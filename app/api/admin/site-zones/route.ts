/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * This code is the property of NXA Software.
 */

import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get('projectId')

    const where = projectId ? { projectId } : {}

    let siteZones = await prisma.siteZone.findMany({
      where,
      orderBy: { createdAt: 'desc' }
    })

    // If no zones exist yet for this project, auto-seed realistic polygon geofences
    if (siteZones.length === 0 && projectId) {
      const project = await prisma.project.findUnique({
        where: { id: projectId },
        select: { latitude: true, longitude: true, title: true, name: true }
      })

      if (project && project.latitude && project.longitude) {
        const lat = project.latitude
        const lng = project.longitude

        const initialZonesData = [
          {
            projectId,
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
            supervisor: "Caner Aydın (İSG Uzmanı)"
          },
          {
            projectId,
            title: "Personel Dinlenme & Toplanma Alanı",
            zoneType: "REST_AREA",
            category: "REST_AREA",
            latitude: lat - 0.0005,
            longitude: lng - 0.0005,
            polygonCoordinates: [
              { lat: lat - 0.00035, lng: lng - 0.00085 },
              { lat: lat - 0.00030, lng: lng - 0.00035 },
              { lat: lat - 0.00070, lng: lng - 0.00030 },
              { lat: lat - 0.00075, lng: lng - 0.00080 }
            ],
            supervisor: "Sevgi Kaya (İdari İşler)"
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
      { error: "Alanlar getirilirken hata oluştu" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      projectId, 
      title, 
      category, 
      zoneType: inputZoneType, 
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
        polygonCoordinates: polygonCoordinates || null
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