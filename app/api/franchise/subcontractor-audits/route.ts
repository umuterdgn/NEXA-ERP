/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Franchise Taşeron Denetimleri CRUD API Endpoint
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

    const audits = await prisma.audit.findMany({
      where: tenantId ? { tenantId } : {},
      include: {
        project: {
          select: { id: true, name: true, title: true, city: true },
        },
        subcontractor: {
          select: { id: true, name: true, type: true },
        },
        inspector: {
          select: { id: true, name: true, position: true },
        },
      },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json({ success: true, audits })
  } catch (error: any) {
    console.error("[Franchise Subcontractor Audits GET Error]:", error)
    return NextResponse.json(
      { error: error?.message || "Denetim kayıtları alınamadı" },
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
      subcontractorId,
      subcontractorName,
      projectId,
      type = "OHS", // OHS (İSG), QUALITY (Kalite)
      score = 85,
      auditDate,
      notes,
      pdfReportUrl,
      status,
    } = body

    if (!title || !title.trim()) {
      return NextResponse.json(
        { error: "Denetim tutanağı başlığı zorunludur" },
        { status: 400 }
      )
    }

    const numericScore = Math.max(1, Math.min(100, parseInt(score) || 85))

    // Durum Belirleme: 70 altı ACTION_REQUIRED, 50 altı FAILED, 70+ PASSED
    let resolvedStatus = status
    if (!resolvedStatus) {
      if (numericScore >= 75) resolvedStatus = "PASSED"
      else if (numericScore >= 50) resolvedStatus = "ACTION_REQUIRED"
      else resolvedStatus = "FAILED"
    }

    // 1. Proje tespiti
    let targetProjectId = projectId
    if (!targetProjectId) {
      const defProj = await prisma.project.findFirst({
        where: tenantId ? { tenantId } : {},
        select: { id: true },
      })
      targetProjectId = defProj?.id
    }

    if (!targetProjectId) {
      return NextResponse.json(
        { error: "Lütfen bir proje seçin" },
        { status: 400 }
      )
    }

    // 2. Taşeron Firma (Company) tespiti
    let targetSubId = subcontractorId
    if (!targetSubId) {
      const company = await prisma.company.findFirst({
        where: {
          name: subcontractorName ? subcontractorName.trim() : undefined,
          tenantId: tenantId || undefined,
        },
        select: { id: true },
      })
      if (company) {
        targetSubId = company.id
      } else {
        const newComp = await prisma.company.create({
          data: {
            name: subcontractorName ? subcontractorName.trim() : "Örnek Taşeron Firma",
            type: "SUBCONTRACTOR",
            tenantId: tenantId || null,
          },
          select: { id: true },
        })
        targetSubId = newComp.id
      }
    }

    // 3. Denetçi / Mühendis (Personel) tespiti
    let inspectorPersonel = await prisma.personel.findFirst({
      where: tenantId ? { tenantId } : {},
      select: { id: true },
    })

    if (!inspectorPersonel) {
      inspectorPersonel = await prisma.personel.create({
        data: {
          personnelNo: `INS-${Date.now().toString().slice(-6)}`,
          name: session.user.name || "Baş Denetçi / İSG Uzmanı",
          age: 35,
          birthDate: new Date("1990-01-01"),
          department: "Kalite Güvence & İSG",
          position: "İSG Uzmanı / Denetçi",
          currentSite: "Merkez / Saha",
          hireDate: new Date(),
          tenantId: tenantId || null,
        },
        select: { id: true },
      })
    }

    const reportNote = pdfReportUrl
      ? `${notes || "Saha denetimi başarıyla tamamlandı."}\n[PDF Raporu]: ${pdfReportUrl}`
      : notes || "Saha denetimi tamamlandı."

    // Audit oluştur
    const newAudit = await prisma.audit.create({
      data: {
        title: title.trim(),
        type,
        score: numericScore,
        status: resolvedStatus,
        notes: reportNote,
        projectId: targetProjectId,
        subcontractorId: targetSubId,
        inspectorId: inspectorPersonel.id,
        createdAt: auditDate ? new Date(auditDate) : new Date(),
        tenantId: tenantId || null,
      },
      include: {
        project: { select: { id: true, name: true, city: true } },
        subcontractor: { select: { id: true, name: true } },
        inspector: { select: { id: true, name: true, position: true } },
      },
    })

    console.log(
      `[Franchise Audit Created] 🛡️ ${newAudit.title} - Taşeron: ${newAudit.subcontractor?.name} - Puan: ${numericScore}/100 - Durum: ${newAudit.status}`
    )

    return NextResponse.json({
      success: true,
      message: "Taşeron denetim kaydı başarıyla oluşturuldu.",
      audit: newAudit,
    })
  } catch (error: any) {
    console.error("[Franchise Subcontractor Audits POST Error]:", error)
    return NextResponse.json(
      { error: error?.message || "Denetim kaydı oluşturulurken hata meydana geldi" },
      { status: 500 }
    )
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ error: "Kayıt ID zorunludur" }, { status: 400 })
    }

    await prisma.audit.delete({ where: { id } })

    return NextResponse.json({ success: true, message: "Denetim kaydı silindi" })
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Silme hatası" },
      { status: 500 }
    )
  }
}
