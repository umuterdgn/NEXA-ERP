/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * This code is the property of NXA Software.
 */

import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { projectId, title, description, imageUrl, positionX, positionY, positionZ, status } = body

    const issue = await prisma.bimIssue.create({
      data: {
        projectId,
        title,
        description,
        imageUrl,
        positionX,
        positionY,
        positionZ,
        status: status || "OPEN"
      }
    })

    return NextResponse.json(issue)
  } catch (error) {
    console.error("Failed to create BIM issue:", error)
    return NextResponse.json({ error: "Failed to create issue" }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get("projectId")

    if (!projectId) {
      return NextResponse.json({ error: "Project ID is required" }, { status: 400 })
    }

    const issues = await prisma.bimIssue.findMany({
      where: { projectId },
      orderBy: { createdAt: "desc" }
    })

    return NextResponse.json(issues)
  } catch (error) {
    console.error("Failed to fetch BIM issues:", error)
    return NextResponse.json({ error: "Failed to fetch issues" }, { status: 500 })
  }
}
