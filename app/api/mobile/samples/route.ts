/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * GET/POST/PATCH /api/mobile/samples
 * Karot ve Beton QR Numune Takip API'si (Saha Alma -> IN_LAB -> 7/28 Gün Kırım)
 */

import { NextResponse } from "next/server"
import { getMobileAuth } from "@/lib/mobile-auth"
import { prisma } from "@/lib/prisma"
import {
  assertRecordTenantScope,
  assertTenantAndProjectAccess,
  requireAnyModule,
} from "@/lib/api-rbac"

export const runtime = "nodejs"

export async function GET(request: Request) {
  try {
    const auth = await getMobileAuth(request)
    if (!auth) {
      return NextResponse.json({ error: "Yetkisiz oturum." }, { status: 401 })
    }

    const denied = requireAnyModule(auth, ["samples_core", "concrete_pouring_qa"])
    if (denied) return denied

    const { tenantId, assignedProjectIds } = auth
    const url = new URL(request.url)
    const reqProjectId = url.searchParams.get("projectId")
    const status = url.searchParams.get("status")
    const qrCode = url.searchParams.get("qrCode")

    if (reqProjectId) {
      const accessErr = await assertTenantAndProjectAccess(auth, reqProjectId)
      if (accessErr) return accessErr
    }

    const projectId = reqProjectId || (assignedProjectIds[0] ?? undefined)

    const where: any = {
      ...(tenantId ? { tenantId } : {}),
      ...(projectId ? { projectId } : {}),
    }

    if (qrCode) {
      where.qrCode = qrCode.trim()
    }

    if (status && status !== "ALL") {
      where.status = status
    }

    const samples = await prisma.coreSample.findMany({
      where,
      orderBy: { takenAt: "desc" },
      take: 50,
      include: {
        project: { select: { id: true, name: true, title: true } },
      },
    })

    return NextResponse.json({
      success: true,
      count: samples.length,
      samples: samples.map((s) => ({
        id: s.id,
        qrCode: s.qrCode,
        ebisRfidTag: s.ebisRfidTag,
        location: s.location || "Blok / Kat Belirtilmedi",
        status: s.status,
        pourDate: s.pourDate,
        testDate: s.testDate,
        strengthResult: s.strengthResult,
        takenAt: s.takenAt,
        project: s.project?.name || s.project?.title,
      })),
    })
  } catch (error: any) {
    console.error("Mobile samples GET error:", error)
    return NextResponse.json({ error: "Numuneler alınamadı." }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const auth = await getMobileAuth(request)
    if (!auth) {
      return NextResponse.json({ error: "Yetkisiz oturum." }, { status: 401 })
    }

    const denied = requireAnyModule(auth, ["samples_core", "concrete_pouring_qa"])
    if (denied) return denied

    const { userId, tenantId, assignedProjectIds } = auth
    const body = await request.json().catch(() => ({}))
    const { qrCode, ebisRfidTag, location, projectId: reqProjectId, pourDate } = body

    if (reqProjectId) {
      const accessErr = await assertTenantAndProjectAccess(auth, reqProjectId)
      if (accessErr) return accessErr
    }

    const targetQr = (qrCode || `QR-${Date.now()}`).trim()
    const targetProjectId = reqProjectId || assignedProjectIds[0]

    if (!targetProjectId) {
      return NextResponse.json({ error: "Proje seçimi zorunludur." }, { status: 400 })
    }

    const sample = await prisma.coreSample.create({
      data: {
        tenantId,
        projectId: targetProjectId,
        qrCode: targetQr,
        ebisRfidTag: ebisRfidTag || null,
        location: location || "Saha Numunesi",
        takenById: userId,
        status: "WAITING_TEST",
        pourDate: pourDate ? new Date(pourDate) : new Date(),
        takenAt: new Date(),
      },
    })

    return NextResponse.json({
      success: true,
      message: "Karekod numune kaydı başarıyla oluşturuldu.",
      sample,
    })
  } catch (error: any) {
    console.error("Mobile samples POST error:", error)
    return NextResponse.json({ error: "Numune kaydı oluşturulamadı." }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const auth = await getMobileAuth(request)
    if (!auth) {
      return NextResponse.json({ error: "Yetkisiz oturum." }, { status: 401 })
    }

    const denied = requireAnyModule(auth, ["samples_core", "concrete_pouring_qa"])
    if (denied) return denied

    const body = await request.json().catch(() => ({}))
    const { id, qrCode, status, strengthResult, testDate } = body

    if (!id && !qrCode) {
      return NextResponse.json({ error: "Numune ID veya QR Kod gereklidir." }, { status: 400 })
    }

    const where = id ? { id } : { qrCode: qrCode.trim() }
    const existing = await prisma.coreSample.findUnique({ where })
    if (!existing) {
      return NextResponse.json({ error: "Numune kaydı bulunamadı." }, { status: 404 })
    }

    const scopeErr = assertRecordTenantScope(auth, existing)
    if (scopeErr) return scopeErr

    const updateData: any = {}
    if (status) updateData.status = status
    if (strengthResult != null) {
      updateData.strengthResult = Number(strengthResult)
      updateData.testDate = testDate ? new Date(testDate) : new Date()
      if (!status) {
        updateData.status = Number(strengthResult) >= 30 ? "PASSED" : "FAILED"
      }
    }

    const updated = await prisma.coreSample.update({
      where: { id: existing.id },
      data: updateData,
    })

    return NextResponse.json({
      success: true,
      message: "Numune durumu başarıyla güncellendi.",
      sample: updated,
    })
  } catch (error: any) {
    console.error("Mobile samples PATCH error:", error)
    return NextResponse.json({ error: "Numune güncellenemedi." }, { status: 500 })
  }
}
