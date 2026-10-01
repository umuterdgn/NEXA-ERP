/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * This code is the property of NXA Software.
 */

import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const contracts = await prisma.contract.findMany({
      include: {
        subcontractor: {
          select: { id: true, name: true }
        },
        project: {
          select: { id: true, name: true }
        }
      },
      orderBy: { createdAt: "desc" }
    })

    return NextResponse.json(contracts)
  } catch (error) {
    console.error("Failed to fetch contracts:", error)
    return NextResponse.json(
      { error: "Sözleşmeler yüklenirken hata oluştu" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { title, subcontractorId, projectId, totalAmount, startDate, endDate, status } = body

    if (!title || !subcontractorId || !projectId || !totalAmount) {
      return NextResponse.json(
        { error: "Tüm zorunlu alanları doldurun" },
        { status: 400 }
      )
    }

    const contract = await prisma.contract.create({
      data: {
        title,
        subcontractorId,
        projectId,
        totalAmount: parseFloat(totalAmount),
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        status: status || "ACTIVE"
      },
      include: {
        subcontractor: {
          select: { id: true, name: true }
        },
        project: {
          select: { id: true, name: true }
        }
      }
    })

    return NextResponse.json(contract, { status: 201 })
  } catch (error) {
    console.error("Failed to create contract:", error)
    return NextResponse.json(
      { error: "Sözleşme oluşturulurken hata oluştu" },
      { status: 500 }
    )
  }
}
