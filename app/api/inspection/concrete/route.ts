/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * This code is the property of NXA Software.
 */

import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const concreteTests = await prisma.concreteTest.findMany({
      include: {
        project: true
      },
      orderBy: {
        castDate: 'desc'
      }
    })

    return NextResponse.json(concreteTests)
  } catch (error) {
    console.error("Concrete tests fetch error:", error)
    return NextResponse.json(
      { error: "Numuneler getirilirken hata oluştu" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      projectId, 
      concreteClass, 
      element, 
      waybillNo, 
      castDate, 
      day7Result, 
      day28Result, 
      status, 
      reportUrl 
    } = body

    if (!projectId || !concreteClass || !element || !waybillNo || !castDate) {
      return NextResponse.json(
        { error: "Proje, beton sınıfı, eleman, irsaliye no ve döküm tarihi zorunludur" },
        { status: 400 }
      )
    }

    const concreteTest = await prisma.concreteTest.create({
      data: {
        projectId,
        concreteClass,
        element,
        waybillNo,
        castDate: castDate ? new Date(castDate) : new Date(),
        day7Result: day7Result ? parseFloat(day7Result) : null,
        day28Result: day28Result ? parseFloat(day28Result) : null,
        status: status || "BEKLIYOR",
        reportUrl: reportUrl || ""
      }
    })

    return NextResponse.json(concreteTest)
  } catch (error) {
    console.error("Concrete test creation error:", error)
    return NextResponse.json(
      { error: "Numune oluşturulurken hata oluştu" },
      { status: 500 }
    )
  }
}
