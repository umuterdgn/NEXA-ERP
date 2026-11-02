/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * This code is the property of NXA Software.
 */

import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const userId = body.personelId || body.userId || body.driverId
    const lat = body.lat !== undefined ? body.lat : body.latitude
    const lng = body.lng !== undefined ? body.lng : body.longitude
    const accuracy = body.accuracy || null
    const speed = body.speed || null
    const heading = body.heading || null

    // Validate required fields
    if (!userId || lat === undefined || lng === undefined) {
      return NextResponse.json(
        { error: "userId/driverId, lat/latitude, and lng/longitude are required" },
        { status: 400 }
      )
    }

    // Validate coordinates
    if (typeof lat !== "number" || typeof lng !== "number" || 
        lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      return NextResponse.json(
        { error: "Invalid coordinates. lat must be between -90 and 90, lng must be between -180 and 180" },
        { status: 400 }
      )
    }

    // Check if user exists before writing to foreign key relation
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { id: userId },
          { email: { contains: "driver" } },
          { role: "DRIVER" }
        ]
      }
    })

    if (user) {
      await prisma.locationLog.create({
        data: {
          latitude: lat,
          longitude: lng,
          accuracy: accuracy,
          userId: user.id,
          tenantId: user.tenantId,
        }
      })
    }

    return NextResponse.json({ 
      success: true, 
      message: "Canlı şoför konumu başarıyla kaydedildi.",
      coords: { lat, lng, speed, heading, accuracy }
    })
  } catch (error: any) {
    console.error("Error tracking location:", error)
    return NextResponse.json(
      { error: "Failed to track location: " + (error?.message || "Unknown error") },
      { status: 500 }
    )
  }
}
