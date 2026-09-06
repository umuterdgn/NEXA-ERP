/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * This code is the property of NXA Software.
 */

import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { latitude, longitude, accuracy } = body

    if (!latitude || !longitude) {
      return NextResponse.json({ error: "Latitude and longitude are required" }, { status: 400 })
    }

    // KVKK compliance: Only accept location data during working hours or from authorized users
    // For now, we'll accept all requests from authenticated users
    // In production, you would check if current time is within working hours (e.g., 8:00 - 18:00)
    const now = new Date()
    const hour = now.getHours()
    
    // Optional: Restrict to working hours (8 AM - 6 PM)
    // if (hour < 8 || hour >= 18) {
    //   return NextResponse.json({ error: "Location tracking only allowed during working hours" }, { status: 403 })
    // }

    const locationLog = await prisma.locationLog.create({
      data: {
        userId: session.user.id,
        latitude,
        longitude,
        accuracy: accuracy || null,
      },
    })

    return NextResponse.json({ success: true, locationLog }, { status: 201 })
  } catch (error) {
    console.error("Location log error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
