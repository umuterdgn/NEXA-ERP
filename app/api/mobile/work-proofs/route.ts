/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Mobil Taşeron İmalat İlerleme Kanıtı (WorkProof) & Fotoğraflı Hakediş Talep API
 */

import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getMobileAuth } from "@/lib/mobile-auth"
import {
  assertTenantAndProjectAccess,
  requireAnyModule,
  resolveSubcontractorForUser,
} from "@/lib/api-rbac"

export async function GET(request: Request) {
  try {
    const auth = await getMobileAuth(request)
    if (!auth) {
      return NextResponse.json({ error: "Yetkisiz oturum." }, { status: 401 })
    }

    const denied = requireAnyModule(auth, ["work_proofs"])
    if (denied) return denied

    const { role, tenantId, assignedProjectIds } = auth
    const url = new URL(request.url)
    const reqProjectId = url.searchParams.get("projectId")
    const reqSubcontractorId = url.searchParams.get("subcontractorId")
    const status = url.searchParams.get("status")

    if (reqProjectId) {
      const accessErr = await assertTenantAndProjectAccess(auth, reqProjectId)
      if (accessErr) return accessErr
    }

    const projectId = reqProjectId || (assignedProjectIds[0] ?? undefined)

    const where: any = {
      ...(tenantId ? { tenantId } : {}),
      ...(projectId ? { projectId } : {}),
    }

    if (status && status !== "ALL") {
      where.status = status
    }

    // Taşeron ise SADECE kendi iş kanıtlarını görebilir (başka taşeron ID isterse 403)
    if (role === "SUBCONTRACTOR") {
      const ownSub = await resolveSubcontractorForUser(auth)
      if (reqSubcontractorId && reqSubcontractorId !== ownSub?.id) {
        return NextResponse.json(
          { error: "Başka bir taşerona ait iş kanıtlarını görüntüleme yetkiniz yok." },
          { status: 403 }
        )
      }
      if (!ownSub) {
        return NextResponse.json({ success: true, count: 0, proofs: [] })
      }
      where.subcontractorId = ownSub.id
    } else if (reqSubcontractorId) {
      where.subcontractorId = reqSubcontractorId
    }

    const proofs = await prisma.workProof.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 50,
      include: {
        subcontractor: {
          select: { id: true, name: true, contactName: true },
        },
        boqItem: {
          select: { id: true, pozNo: true, description: true, unit: true },
        },
      },
    })

    return NextResponse.json({
      success: true,
      count: proofs.length,
      proofs: proofs.map((p) => ({
        id: p.id,
        title: p.title || "İş Kanıtı",
        description: p.description,
        photoUrl: p.photoUrl || p.imageUrl,
        claimedQuantity: p.claimedQuantity,
        approvedQuantity: p.approvedQuantity,
        status: p.status,
        engineerStatus: p.engineerStatus,
        managerStatus: p.managerStatus,
        subcontractorId: p.subcontractorId,
        subcontractor: p.subcontractor?.name || "Taşeron Firma",
        boqItem: p.boqItem ? `${p.boqItem.pozNo} - ${p.boqItem.description}` : null,
        unit: p.boqItem?.unit || "m²",
        gpsLatitude: p.gpsLatitude || p.latitude,
        gpsLongitude: p.gpsLongitude || p.longitude,
        createdAt: p.createdAt,
      })),
    })
  } catch (error: any) {
    console.error("Mobile work-proofs GET error:", error)
    return NextResponse.json({ error: "İş kanıtları getirilemedi." }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const auth = await getMobileAuth(request)
    if (!auth) {
      return NextResponse.json({ error: "Yetkisiz oturum." }, { status: 401 })
    }

    const denied = requireAnyModule(auth, ["work_proofs"])
    if (denied) return denied

    const { tenantId, assignedProjectIds } = auth
    const body = await request.json().catch(() => ({}))
    const {
      title,
      description,
      photoUrl,
      imageUrl,
      claimedQuantity,
      boqItemId,
      bimElementId,
      gpsLatitude,
      gpsLongitude,
      contractId,
      projectId: reqProjectId,
    } = body

    const finalPhotoUrl = (photoUrl || imageUrl || "").trim()
    if (!finalPhotoUrl) {
      return NextResponse.json({ error: "İş kanıtı fotoğrafı zorunludur." }, { status: 400 })
    }

    if (reqProjectId) {
      const accessErr = await assertTenantAndProjectAccess(auth, reqProjectId)
      if (accessErr) return accessErr
    }

    const targetProjectId = reqProjectId || assignedProjectIds[0] || null

    let subcontractor = await resolveSubcontractorForUser(auth)

    if (!subcontractor) {
      subcontractor = await prisma.subcontractor.create({
        data: {
          name: auth.name || "Taşeron Ekip",
          contactName: auth.name || "Taşeron Yetkilisi",
          tenantId,
        },
      })
    }

    const proof = await prisma.workProof.create({
      data: {
        tenantId,
        projectId: targetProjectId,
        subcontractorId: subcontractor.id,
        contractId: contractId || null,
        boqItemId: boqItemId || null,
        bimElementId: bimElementId || null,
        title: title || "Saha İmalat Kanıtı",
        description: (description || "").trim(),
        claimedQuantity: Number(claimedQuantity) || 0,
        photoUrl: finalPhotoUrl,
        imageUrl: finalPhotoUrl,
        gpsLatitude: !isNaN(Number(gpsLatitude)) ? Number(gpsLatitude) : null,
        gpsLongitude: !isNaN(Number(gpsLongitude)) ? Number(gpsLongitude) : null,
        status: "PENDING",
        engineerStatus: "PENDING",
        managerStatus: "PENDING",
      },
      include: {
        subcontractor: { select: { id: true, name: true } },
        boqItem: { select: { id: true, pozNo: true, description: true } },
      },
    })

    return NextResponse.json({
      success: true,
      message: "İş kanıtı başarıyla yüklendi ve mühendis onay kuyruğuna alındı.",
      proof,
    })
  } catch (error: any) {
    console.error("Mobile work-proofs POST error:", error)
    return NextResponse.json({ error: "İş kanıtı kaydedilemedi." }, { status: 500 })
  }
}
