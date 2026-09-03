/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * This code is the property of NXA Software.
 */

import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const menus = await prisma.foodMenu.findMany({
      orderBy: { date: "asc" }
    })
    return NextResponse.json({ menus })
  } catch (error) {
    console.error("Fetch menus error:", error)
    return NextResponse.json({ error: "Menüler getirilemedi" }, { status: 500 })
  }
}
