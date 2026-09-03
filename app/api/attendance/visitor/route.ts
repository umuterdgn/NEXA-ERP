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
    const { fullName, company, reason, projectId } = body

    if (!fullName || !projectId) {
      return NextResponse.json(
        { error: "Ad Soyad ve proje ID zorunludur" },
        { status: 400 }
      )
    }

    // Proje kontrolü
    const project = await prisma.project.findUnique({
      where: { id: projectId }
    })

    if (!project) {
      return NextResponse.json(
        { error: "Proje bulunamadı" },
        { status: 404 }
      )
    }

    // Ziyaretçi kaydı oluştur
    const visitorRecord = await prisma.visitorRecord.create({
      data: {
        fullName,
        company: company || null,
        reason: reason || null,
        projectId,
        checkIn: new Date()
      }
    })

    return NextResponse.json({
      message: "Ziyaretçi kaydı başarıyla oluşturuldu",
      record: visitorRecord
    })
  } catch (error) {
    console.error("Visitor record error:", error)
    return NextResponse.json(
      { error: "Kayıt sırasında hata oluştu" },
      { status: 500 }
    )
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get('projectId')

    // Eğer projectId verilmişse sadece o projenin ziyaretçilerini getir
    // Verilmezse tüm ziyaretçileri getir (admin için)
    const whereClause = projectId ? { projectId } : {}

    const visitors = await prisma.visitorRecord.findMany({
      where: whereClause,
      include: { project: true },
      orderBy: { checkIn: 'desc' }
    })

    return NextResponse.json(visitors)
  } catch (error) {
    console.error("Failed to fetch visitors:", error)
    return NextResponse.json(
      { error: "Ziyaretçiler getirilirken hata oluştu" },
      { status: 500 }
    )
  }
}