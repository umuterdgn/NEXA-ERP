/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * GET/POST/PATCH /api/mobile/deficiencies
 * Saha Kusurları & Eksiklikleri (Snagging & DÖF/NCR) API'si
 */

import { NextResponse } from "next/server"
import { getMobileAuth } from "@/lib/mobile-auth"
import { prisma } from "@/lib/prisma"
import {
  assertRecordTenantScope,
  assertTenantAndProjectAccess,
  isBranchOrProjectScopedRole,
  requireAnyModule,
} from "@/lib/api-rbac"

export const runtime = "nodejs"

export async function GET(request: Request) {
  try {
    const auth = await getMobileAuth(request)
    if (!auth) {
      return NextResponse.json({ error: "Yetkisiz oturum." }, { status: 401 })
    }

    const denied = requireAnyModule(auth, ["deficiencies", "ncr_dof"])
    if (denied) return denied

    const { role, tenantId, assignedProjectIds } = auth
    const url = new URL(request.url)
    const reqProjectId = url.searchParams.get("projectId")
    const status = url.searchParams.get("status")

    if (reqProjectId) {
      const accessErr = await assertTenantAndProjectAccess(auth, reqProjectId)
      if (accessErr) return accessErr
    }

    const where: any = {
      ...(tenantId ? { tenantId } : {}),
    }

    if (reqProjectId) {
      where.projectId = reqProjectId
    } else if (isBranchOrProjectScopedRole(role)) {
      where.projectId = {
        in: assignedProjectIds.length > 0 ? assignedProjectIds : ["__none__"],
      }
    } else if (assignedProjectIds.length > 0) {
      where.projectId = { in: assignedProjectIds }
    }

    if (status && status !== "ALL") {
      where.status = status
    }

    const deficiencies = await prisma.deficiency.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 50,
      include: {
        project: { select: { id: true, name: true, title: true } },
      },
    })

    return NextResponse.json({
      success: true,
      count: deficiencies.length,
      deficiencies: deficiencies.map((d) => ({
        id: d.id,
        projectId: d.projectId,
        element: d.element,
        floor: d.floor,
        category: d.category,
        priority: d.priority,
        description: d.description,
        photoUrl: d.photoUrl,
        status: d.status,
        dueDate: d.dueDate,
        project: d.project?.name || d.project?.title,
        createdAt: d.createdAt,
      })),
    })
  } catch (error: any) {
    console.error("Mobile deficiencies GET error:", error)
    return NextResponse.json({ error: "Eksiklikler alınamadı." }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const auth = await getMobileAuth(request)
    if (!auth) {
      return NextResponse.json({ error: "Yetkisiz oturum." }, { status: 401 })
    }

    const denied = requireAnyModule(auth, ["deficiencies", "ncr_dof"])
    if (denied) return denied

    const { tenantId, assignedProjectIds } = auth
    const body = await request.json().catch(() => ({}))
    const { element, floor, category, priority, description, photoUrl, dueDate, projectId: reqProjectId } = body

    if (reqProjectId) {
      const accessErr = await assertTenantAndProjectAccess(auth, reqProjectId)
      if (accessErr) return accessErr
    }

    const targetProjectId = reqProjectId || assignedProjectIds[0]

    if (!description || !description.trim()) {
      return NextResponse.json({ error: "Kusur açıklaması gereklidir." }, { status: 400 })
    }

    const deficiency = await prisma.deficiency.create({
      data: {
        tenantId,
        projectId: targetProjectId || null,
        element: element || "Genel Eleman",
        floor: floor || "Zemin",
        category: category || "Genel Kusur",
        priority: priority || "MEDIUM",
        description: description.trim(),
        photoUrl: photoUrl || null,
        status: "OPEN",
        dueDate: dueDate ? new Date(dueDate) : new Date(Date.now() + 7 * 24 * 3600 * 1000),
      },
    })

    return NextResponse.json({
      success: true,
      message: "Saha kusuru başarıyla kaydedildi.",
      deficiency,
    })
  } catch (error: any) {
    console.error("Mobile deficiencies POST error:", error)
    return NextResponse.json({ error: "Kusur kaydı oluşturulamadı." }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const auth = await getMobileAuth(request)
    if (!auth) {
      return NextResponse.json({ error: "Yetkisiz oturum." }, { status: 401 })
    }

    const denied = requireAnyModule(auth, ["deficiencies", "ncr_dof"])
    if (denied) return denied

    const body = await request.json().catch(() => ({}))
    const { id, status } = body

    if (!id || !status) {
      return NextResponse.json({ error: "Kusur ID ve yeni durum zorunludur." }, { status: 400 })
    }

    const existing = await prisma.deficiency.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: "Kusur kaydı bulunamadı." }, { status: 404 })
    }

    const scopeErr = assertRecordTenantScope(auth, existing)
    if (scopeErr) return scopeErr

    const updated = await prisma.deficiency.update({
      where: { id },
      data: {
        status,
        closedAt: status === "CLOSED" ? new Date() : null,
      },
    })

    return NextResponse.json({
      success: true,
      message: "Kusur durumu güncellendi.",
      deficiency: updated,
    })
  } catch (error: any) {
    console.error("Mobile deficiencies PATCH error:", error)
    return NextResponse.json({ error: "Kusur güncellenemedi." }, { status: 500 })
  }
}
