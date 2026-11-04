/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Franchise & Taşeron Sözleşmeleri API Endpoint
 */

import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 })
    }

    const tenantId = (session.user as any)?.tenantId

    const contracts = await prisma.contract.findMany({
      where: tenantId ? { tenantId } : {},
      include: {
        project: {
          select: {
            id: true,
            name: true,
            title: true,
            city: true,
          },
        },
        subcontractor: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json({ success: true, contracts })
  } catch (error: any) {
    console.error("[Franchise Contracts GET Error]:", error)
    return NextResponse.json(
      { error: error?.message || "Sözleşmeler alınamadı" },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 })
    }

    const tenantId = (session.user as any)?.tenantId
    const body = await request.json()

    const {
      title,
      partyB, // Taşeron adı
      projectId,
      amount,
      currency = "TRY",
      scope = "Kaba Yapı (Kalıp, Demir, Beton)",
      startDate,
      endDate,
      retentionRate = 0.05,
      dailyPenaltyRate = 0,
    } = body

    if (!title || !title.trim()) {
      return NextResponse.json(
        { error: "Sözleşme başlığı zorunludur" },
        { status: 400 }
      )
    }

    // Proje tespiti
    let targetProjectId = projectId
    if (!targetProjectId) {
      const defaultProj = await prisma.project.findFirst({
        where: tenantId ? { tenantId } : {},
        select: { id: true },
      })
      targetProjectId = defaultProj?.id
    }

    if (!targetProjectId) {
      return NextResponse.json(
        { error: "İlişkili bir proje/şube seçilmelidir" },
        { status: 400 }
      )
    }

    // Taşeron Firma (Company) tespiti veya oluşturma
    let subCompany = await prisma.company.findFirst({
      where: {
        name: partyB ? partyB.trim() : "Taşeron Firma",
        tenantId: tenantId || undefined,
      },
      select: { id: true },
    })

    if (!subCompany) {
      subCompany = await prisma.company.create({
        data: {
          name: partyB ? partyB.trim() : "Standart Taşeron Ltd.",
          type: "SUBCONTRACTOR",
          tenantId: tenantId || null,
        },
        select: { id: true },
      })
    }

    const numericAmount = parseFloat(amount) || 1500000
    const numericRetention = parseFloat(retentionRate) || 0.05
    const numericPenalty = parseFloat(dailyPenaltyRate) || 0

    const contract = await prisma.contract.create({
      data: {
        title: title.trim(),
        projectId: targetProjectId,
        subcontractorId: subCompany.id,
        totalAmount: numericAmount,
        retentionRate: numericRetention,
        dailyPenaltyRate: numericPenalty,
        startDate: startDate ? new Date(startDate) : new Date(),
        endDate: endDate ? new Date(endDate) : new Date(Date.now() + 180 * 86400000),
        status: "ACTIVE",
        tenantId: tenantId || null,
      },
      include: {
        project: {
          select: { id: true, name: true, city: true },
        },
        subcontractor: {
          select: { id: true, name: true },
        },
      },
    })

    console.log(
      `[Franchise Contract Created] 📄 ${contract.title} - Tutar: ${numericAmount} ${currency} - Teminat: %${numericRetention * 100}`
    )

    return NextResponse.json({
      success: true,
      message: "Taşeron sözleşmesi finansal detaylarla birlikte başarıyla kaydedildi.",
      contract: {
        ...contract,
        currency,
        scope,
      },
    })
  } catch (error: any) {
    console.error("[Franchise Contracts POST Error]:", error)
    return NextResponse.json(
      { error: error?.message || "Sözleşme oluşturulurken hata meydana geldi" },
      { status: 500 }
    )
  }
}

