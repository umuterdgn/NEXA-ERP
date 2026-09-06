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
    const { personelId, lat, lng } = body

    // Validate required fields
    if (!personelId || lat === undefined || lng === undefined) {
      return NextResponse.json(
        { error: "personelId, lat, and lng are required" },
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

    // Update personnel location log
    await prisma.locationLog.create({
      data: {
        latitude: lat,
        longitude: lng,
        userId: personelId
      }
    })

    return NextResponse.json({ 
      success: true, 
      message: "Location updated successfully"
    })
  } catch (error) {
    console.error("Error tracking location:", error)
    return NextResponse.json(
      { error: "Failed to track location" },
      { status: 500 }
    )
  }
}
