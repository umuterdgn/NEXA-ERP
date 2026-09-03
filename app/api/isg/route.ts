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
    const { imageUrl, description, type, personelId } = body

    if (!imageUrl || !description || !type || !personelId) {
      return NextResponse.json(
        { error: "Eksik alanlar var" },
        { status: 400 }
      )
    }

    // Create ISG report
    const isgReport = await prisma.isgReport.create({
      data: {
        imageUrl,
        description,
        type,
        personelId,
        status: "ACIL"
      }
    })

    return NextResponse.json(isgReport, { status: 201 })
  } catch (error) {
    console.error("ISG report creation error:", error)
    return NextResponse.json(
      { error: "Bildirim oluşturulurken hata oluştu" },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const isgReports = await prisma.isgReport.findMany({
      include: {
        personel: {
          select: {
            name: true,
            personnelNo: true
          }
        },
        project: {
          select: {
            name: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json(isgReports)
  } catch (error) {
    console.error("ISG reports fetch error:", error)
    return NextResponse.json(
      { error: "Bildirimler getirilirken hata oluştu" },
      { status: 500 }
    )
  }
}
