/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * This code is the property of NXA Software.
 */

import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { imageUrl, description, personelId } = body

    if (!imageUrl || !description || !personelId) {
      return NextResponse.json(
        { success: false, error: "Eksik bilgiler" },
        { status: 400 }
      )
    }

    // Create İSG report in database
    const isgReport = await prisma.isgReport.create({
      data: {
        imageUrl,
        description,
        personelId,
        status: "ACIL",
        createdAt: new Date()
      }
    })

    return NextResponse.json({
      success: true,
      data: isgReport
    })

  } catch (error) {
    console.error("İSG report error:", error)
    return NextResponse.json(
      { success: false, error: "Bildirim oluşturulurken hata oluştu" },
      { status: 500 }
    )
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const personelId = searchParams.get("personelId")

    const reports = await prisma.isgReport.findMany({
      where: personelId ? { personelId } : {},
      orderBy: { createdAt: 'desc' },
      take: 20
    })

    return NextResponse.json({
      success: true,
      data: reports
    })

  } catch (error) {
    console.error("İSG reports fetch error:", error)
    return NextResponse.json(
      { success: false, error: "Bildirimler getirilirken hata oluştu" },
      { status: 500 }
    )
  }
}
