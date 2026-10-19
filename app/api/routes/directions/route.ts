/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * OSRM Real-Road Driving Directions API Proxy
 */

import { NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { coordinates } = body // Array of [lng, lat]

    if (!Array.isArray(coordinates) || coordinates.length < 2) {
      return NextResponse.json(
        { error: "En az 2 koordinat noktası gereklidir." },
        { status: 400 }
      )
    }

    // Format coordinates for OSRM: lng1,lat1;lng2,lat2;...;lngN,latN
    const coordsString = coordinates
      .map((coord: [number, number]) => `${coord[0]},${coord[1]}`)
      .join(";")

    const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${coordsString}?overview=full&geometries=geojson`

    const response = await fetch(osrmUrl, {
      headers: {
        "User-Agent": "NEXA-ERP-Inspection-Dispatcher/1.0"
      },
      // Cache for 30 minutes to reduce redundant OSRM public hits
      next: { revalidate: 1800 }
    })

    if (!response.ok) {
      throw new Error(`OSRM yanıt vermedi: ${response.statusText}`)
    }

    const data = await response.json()

    if (data.code !== "Ok" || !data.routes || data.routes.length === 0) {
      return NextResponse.json(
        { error: "Güzergah bulunamadı veya rota hesaplanamadı." },
        { status: 404 }
      )
    }

    const route = data.routes[0]

    return NextResponse.json({
      success: true,
      distanceMeters: route.distance,
      distanceKm: Number((route.distance / 1000).toFixed(2)),
      durationSeconds: route.duration,
      durationMinutes: Math.round(route.duration / 60),
      geometry: route.geometry, // GeoJSON LineString geometry
      coordinates: route.geometry.coordinates // [ [lng, lat], ... ]
    })
  } catch (error: any) {
    console.error("Directions API error:", error)
    return NextResponse.json(
      { error: error.message || "Rota hesaplanırken sunucu hatası oluştu" },
      { status: 500 }
    )
  }
}
