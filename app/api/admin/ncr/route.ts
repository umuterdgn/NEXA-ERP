/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * This code is the property of NXA Software.
 */

import { NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export async function GET() {
  try {
    const reports = await (prisma as any).nonConformanceReport.findMany({
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json(reports)
  } catch (error) {
    console.error("Failed to fetch NCR reports:", error)
    return NextResponse.json(
      { error: "Failed to fetch NCR reports" },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { location, issueType, description, photoUrl, subcontractor, dueDate, notes } = body

    const report = await (prisma as any).nonConformanceReport.create({
      data: {
        location,
        issueType,
        description,
        photoUrl,
        subcontractor,
        dueDate: dueDate ? new Date(dueDate) : null,
        notes,
        status: "Açık" as any
      }
    })

    return NextResponse.json(report)
  } catch (error) {
    console.error("Failed to create NCR report:", error)
    return NextResponse.json(
      { error: "Failed to create NCR report" },
      { status: 500 }
    )
  }
}
