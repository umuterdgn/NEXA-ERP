/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * This code is the property of NXA Software.
 */

import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const limit = parseInt(searchParams.get("limit") || "100")
    
    // @ts-ignore - SystemLog model exists after schema update
    const logs = await prisma.systemLog.findMany({
      // @ts-ignore - include with tenant exists after schema update
      include: {
        tenant: true
      },
      orderBy: { createdAt: "desc" },
      take: limit
    })

    return NextResponse.json(logs)
  } catch (error) {
    console.error("Failed to fetch logs:", error)
    return NextResponse.json(
      { error: "Loglar yüklenirken hata oluştu" },
      { status: 500 }
    )
  }
}
