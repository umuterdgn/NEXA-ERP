/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * This code is the property of NXA Software.
 */

import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const inspections = await prisma.inspection.findMany({
      include: {
        project: {
          select: {
            id: true,
            name: true,
            yibfNo: true
          }
        },
        inspector: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: {
        inspectionDate: 'desc'
      }
    })

    return NextResponse.json(inspections)
  } catch (error) {
    console.error("Failed to fetch inspections:", error)
    return NextResponse.json([])
  }
}
