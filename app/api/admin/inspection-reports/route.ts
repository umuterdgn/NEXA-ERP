/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * This code is the property of NXA Software.
 */

import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get("projectId")

    const reports = await prisma.inspectionReport.findMany({
      where: projectId ? { projectId } : undefined,
      orderBy: { createdAt: "desc" },
      include: {
        project: {
          select: {
            name: true,
            title: true
          }
        }
      }
    })

    return NextResponse.json(reports)
  } catch (error) {
    console.error("Error fetching inspection reports:", error)
    return NextResponse.json({ error: "Failed to fetch inspection reports" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { projectId, imageUrl, description, title, findings, markedBlueprintUrl, markedPhotoUrl, dxfUrl } = body

    const report = await prisma.inspectionReport.create({
      data: {
        projectId,
        imageUrl: imageUrl || null,
        description,
        title: title || null,
        findings: findings || null,
        markedBlueprintUrl: markedBlueprintUrl || null,
        markedPhotoUrl: markedPhotoUrl || null,
        dxfUrl: dxfUrl || null
      }
    })

    return NextResponse.json(report)
  } catch (error) {
    console.error("Error creating inspection report:", error)
    return NextResponse.json({ error: "Failed to create inspection report" }, { status: 500 })
  }
}
