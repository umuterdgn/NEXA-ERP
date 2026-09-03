/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * This code is the property of NXA Software.
 */

import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const coreTests = await prisma.coreTest.findMany({
      include: {
        project: true
      },
      orderBy: {
        testDate: 'desc'
      }
    })

    return NextResponse.json(coreTests)
  } catch (error) {
    console.error("Core tests fetch error:", error)
    return NextResponse.json(
      { error: "Karot testleri getirilirken hata oluştu" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      projectId, 
      element, 
      location, 
      testDate, 
      strength, 
      status, 
      reportUrl 
    } = body

    if (!projectId || !element || !testDate) {
      return NextResponse.json(
        { error: "Proje, eleman ve test tarihi zorunludur" },
        { status: 400 }
      )
    }

    const coreTest = await prisma.coreTest.create({
      data: {
        projectId,
        element,
        location: location || "",
        testDate: testDate ? new Date(testDate) : new Date(),
        strength: strength ? parseFloat(strength) : null,
        status: status || "BEKLIYOR",
        reportUrl: reportUrl || ""
      }
    })

    return NextResponse.json(coreTest)
  } catch (error) {
    console.error("Core test creation error:", error)
    return NextResponse.json(
      { error: "Karot testi oluşturulurken hata oluştu" },
      { status: 500 }
    )
  }
}
