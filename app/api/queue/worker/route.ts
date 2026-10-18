/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Arka Plan Kuyruk (BackgroundJob Queue) Worker API Endpoint
 */

import { NextResponse } from "next/server"
import { processPendingJobs } from "@/lib/enterprise-core"

export async function GET() {
  try {
    const result = await processPendingJobs()
    return NextResponse.json({
      success: true,
      message: `Kuyruk işlendi: ${result.processedCount} görev tamamlandı.`,
      ...result,
    })
  } catch (error: any) {
    console.error("Queue Worker Error (GET):", error)
    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Kuyruk işlenirken beklenmeyen bir hata oluştu.",
      },
      { status: 500 }
    )
  }
}

export async function POST() {
  try {
    const result = await processPendingJobs()
    return NextResponse.json({
      success: true,
      message: `Kuyruk işlendi: ${result.processedCount} görev tamamlandı.`,
      ...result,
    })
  } catch (error: any) {
    console.error("Queue Worker Error (POST):", error)
    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Kuyruk işlenirken beklenmeyen bir hata oluştu.",
      },
      { status: 500 }
    )
  }
}
