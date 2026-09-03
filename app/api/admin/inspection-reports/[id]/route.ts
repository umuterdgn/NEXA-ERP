/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * This code is the property of NXA Software.
 */

import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// GET - Fetch a single inspection report
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const report = await prisma.inspectionReport.findUnique({
      where: { id },
      include: {
        project: {
          select: {
            name: true,
            title: true
          }
        }
      }
    })

    if (!report) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 })
    }

    return NextResponse.json(report)
  } catch (error) {
    console.error("Error fetching inspection report:", error)
    return NextResponse.json({ error: "Failed to fetch inspection report" }, { status: 500 })
  }
}

// PUT - Update an inspection report
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { title, description, findings, markedBlueprintUrl, markedPhotoUrl, dxfUrl } = body

    const report = await prisma.inspectionReport.update({
      where: { id },
      data: {
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(findings !== undefined && { findings }),
        ...(markedBlueprintUrl !== undefined && { markedBlueprintUrl }),
        ...(markedPhotoUrl !== undefined && { markedPhotoUrl }),
        ...(dxfUrl !== undefined && { dxfUrl })
      }
    })

    return NextResponse.json(report)
  } catch (error) {
    console.error("Error updating inspection report:", error)
    return NextResponse.json({ error: "Failed to update inspection report" }, { status: 500 })
  }
}