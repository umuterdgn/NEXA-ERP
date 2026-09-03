/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * This code is the property of NXA Software.
 */

import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params
    
    // Return empty array for now - Personel model doesn't have attendance records
    // Attendance is handled by Worker model with AttendanceRecord
    return NextResponse.json([])
  } catch (error) {
    console.error("Error fetching personnel attendance:", error)
    return NextResponse.json({ error: "Failed to fetch personnel attendance" }, { status: 500 })
  }
}
