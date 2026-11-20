/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * GET/POST /api/mobile/inspections
 * Yapı Denetim ve Kalite Kontrol (YİBF, Demir/Kalıp Vizesi, Beton QA)
 */

import { NextResponse } from "next/server"
import { getMobileAuth } from "@/lib/mobile-auth"
import { prisma } from "@/lib/prisma"
import { assertTenantAndProjectAccess, requireAnyModule } from "@/lib/api-rbac"

export const runtime = "nodejs"

export async function GET(request: Request) {
  try {
    const auth = await getMobileAuth(request)
    if (!auth) {
      return NextResponse.json({ error: "Yetkisiz oturum." }, { status: 401 })
    }

    const denied = requireAnyModule(auth, ["inspections", "reinforcement_check", "concrete_pouring_qa"])
    if (denied) return denied

    const { tenantId, assignedProjectIds } = auth
    const url = new URL(request.url)
    const reqProjectId = url.searchParams.get("projectId")
    const type = url.searchParams.get("type")

    if (reqProjectId) {
      const accessErr = await assertTenantAndProjectAccess(auth, reqProjectId)
      if (accessErr) return accessErr
    }

    const projectId = reqProjectId || (assignedProjectIds[0] ?? undefined)

    const where: any = {
      ...(tenantId ? { tenantId } : {}),
      ...(projectId ? { projectId } : {}),
    }

    if (type && type !== "ALL") {
      where.type = type
    }

    const inspections = await prisma.inspection.findMany({
      where,
      orderBy: { inspectionDate: "desc" },
      take: 50,
      include: {
        project: { select: { id: true, name: true, title: true } },
        inspector: { select: { id: true, name: true } },
      },
    })

    return NextResponse.json({
      success: true,
      count: inspections.length,
      inspections: inspections.map((ins) => ({
        id: ins.id,
        type: ins.type,
        floor: ins.floor || "Genel",
        status: ins.status,
        inspectionDate: ins.inspectionDate,
        gpsLocation: ins.gpsLocation,
        project: ins.project?.name || ins.project?.title,
        inspector: ins.inspector?.name || "Denetçi",
      })),
    })
  } catch (error: any) {
    console.error("Mobile inspections GET error:", error)
    return NextResponse.json({ error: "Denetim kayıtları getirilemedi." }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const auth = await getMobileAuth(request)
    if (!auth) {
      return NextResponse.json({ error: "Yetkisiz oturum." }, { status: 401 })
    }

    const denied = requireAnyModule(auth, ["inspections", "reinforcement_check", "concrete_pouring_qa"])
    if (denied) return denied

    const { userId, tenantId, assignedProjectIds } = auth
    const body = await request.json().catch(() => ({}))
    const { projectId: reqProjectId, type, floor, status, gpsLocation } = body

    if (reqProjectId) {
      const accessErr = await assertTenantAndProjectAccess(auth, reqProjectId)
      if (accessErr) return accessErr
    }

    const targetProjectId = reqProjectId || assignedProjectIds[0]
    if (!targetProjectId) {
      return NextResponse.json({ error: "Proje seçimi zorunludur." }, { status: 400 })
    }

    let inspectorPersonel = await prisma.personel.findFirst({
      where: { userId, ...(tenantId ? { tenantId } : {}) },
    })

    if (!inspectorPersonel && tenantId) {
      inspectorPersonel = await prisma.personel.findFirst({
        where: { tenantId },
      })
    }

    if (!inspectorPersonel) {
      return NextResponse.json({ error: "Denetçi personel profili bulunamadı." }, { status: 400 })
    }

    const inspection = await prisma.inspection.create({
      data: {
        tenantId,
        projectId: targetProjectId,
        inspectorId: inspectorPersonel.id,
        type: type || "DONATI",
        floor: floor || "Zemin",
        status: status || "APPROVED",
        inspectionDate: new Date(),
        gpsLocation: gpsLocation || null,
      },
    })

    return NextResponse.json({
      success: true,
      message: "Denetim vizesi başarıyla kaydedildi.",
      inspection,
    })
  } catch (error: any) {
    console.error("Mobile inspections POST error:", error)
    return NextResponse.json({ error: "Denetim kaydı oluşturulamadı." }, { status: 500 })
  }
}
