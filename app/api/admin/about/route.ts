/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * This code is the property of NXA Software.
 */

import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

export async function GET() {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const about = await prisma.about.findFirst()
    return NextResponse.json(about)
  } catch (error) {
    console.error("About fetch error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { title, content, videoUrl } = body

    const existing = await prisma.about.findFirst()

    if (existing) {
      const updated = await prisma.about.update({
        where: { id: existing.id },
        data: { title, content, videoUrl }
      })
      return NextResponse.json(updated)
    } else {
      const created = await prisma.about.create({
        data: { title, content, videoUrl }
      })
      return NextResponse.json(created)
    }
  } catch (error) {
    console.error("About update error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}