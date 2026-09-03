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
    const reports = await prisma.nearMissReport.findMany({
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json(reports)
  } catch (error) {
    console.error("Failed to fetch near-miss reports:", error)
    return NextResponse.json(
      { error: "Failed to fetch near-miss reports" },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { isAnonymous, location, category, severity, description } = body

    const report = await prisma.nearMissReport.create({
      data: {
        isAnonymous: isAnonymous ?? true,
        location,
        category,
        severity,
        description,
        status: "Beklemede"
      }
    })

    return NextResponse.json(report)
  } catch (error) {
    console.error("Failed to create near-miss report:", error)
    return NextResponse.json(
      { error: "Failed to create near-miss report" },
      { status: 500 }
    )
  }
}
