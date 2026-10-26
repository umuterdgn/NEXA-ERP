/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Audits API with strict tenant isolation
 */

import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 })
    }

    const isSuperAdmin = session.user.role === "SUPER_ADMIN"
    const tenantId = (session.user as any)?.tenantId

    const where: any = {}
    if (!isSuperAdmin) {
      where.tenantId = tenantId || "non-existent"
    }

    const audits = await prisma.audit.findMany({
      where,
      include: {
        project: {
          select: { id: true, name: true },
        },
        subcontractor: {
          select: { id: true, name: true },
        },
        inspector: {
          select: { id: true, name: true },
        },
      },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json(audits)
  } catch (error: any) {
    console.error("❌ Audits GET Error:", error)
    return NextResponse.json({ error: error.message || "Denetimler alınamadı" }, { status: 500 })
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
    const { title, type, score, notes, projectId, subcontractorId, inspectorId } = body

    if (!title || !projectId || !subcontractorId) {
      return NextResponse.json({ error: "Başlık, proje ve taşeron zorunludur" }, { status: 400 })
    }

    const numericScore = Number(score) || 0
    let status = "PASSED"
    if (numericScore < 60) status = "FAILED"
    else if (numericScore < 80) status = "ACTION_REQUIRED"

    // If inspectorId is not specified, find an inspector personel or use first personel
    let resolvedInspectorId = inspectorId
    if (!resolvedInspectorId) {
      const p = await prisma.personel.findFirst({
        where: { tenantId: tenantId || undefined },
      })
      resolvedInspectorId = p?.id
    }

    if (!resolvedInspectorId) {
      return NextResponse.json({ error: "Denetimi kaydedebilmek için sistemde en az bir personel bulunmalıdır" }, { status: 400 })
    }

    const audit = await prisma.audit.create({
      data: {
        title,
        type: type || "QUALITY",
        score: numericScore,
        status,
        notes: notes || null,
        projectId,
        subcontractorId,
        inspectorId: resolvedInspectorId,
        tenantId: tenantId || null,
      },
      include: {
        project: { select: { id: true, name: true } },
        subcontractor: { select: { id: true, name: true } },
        inspector: { select: { id: true, name: true } },
      },
    })

    return NextResponse.json(audit, { status: 201 })
  } catch (error: any) {
    console.error("❌ Audits POST Error:", error)
    return NextResponse.json({ error: error.message || "Denetim oluşturulamadı" }, { status: 500 })
  }
}
