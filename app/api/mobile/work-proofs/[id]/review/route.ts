/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * PATCH / POST /api/mobile/work-proofs/[id]/review
 * Mühendis (1. Kademe) ve Şantiye Şefi / Proje Müdürü (2. Kademe) İş Kanıtı Onay Ucu
 */

import { NextResponse } from "next/server"
import { getMobileAuth } from "@/lib/mobile-auth"
import { prisma } from "@/lib/prisma"
import { assertRecordTenantScope, requireAnyModule } from "@/lib/api-rbac"

export const runtime = "nodejs"

async function handleReview(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getMobileAuth(request)
    if (!auth) {
      return NextResponse.json({ error: "Yetkisiz oturum." }, { status: 401 })
    }

    // 1. ÖNCE Modül ve Rol Yetkisi (403 DB sorgusundan önce dönmeli!)
    const modDenied = requireAnyModule(auth, ["work_proofs"])
    if (modDenied) return modDenied

    const { userId, role } = auth
    const isEngineer = ["ENGINEER", "ARCHITECT"].includes(role)
    const isManager = ["SITE_MANAGER", "PROJECT_MANAGER", "ADMIN", "SUPER_ADMIN", "FITOUT_SUPERVISOR"].includes(role)

    if (!isEngineer && !isManager) {
      return NextResponse.json(
        { error: "Bu iş kanıtını onaylama yetkiniz bulunmamaktadır." },
        { status: 403 }
      )
    }

    const resolvedParams = await params
    const proofId = resolvedParams.id

    const body = await request.json().catch(() => ({}))
    const { action, approvedQuantity, notes } = body // action: "APPROVE" | "REJECT"

    if (!action || !["APPROVE", "REJECT"].includes(action)) {
      return NextResponse.json(
        { error: "Geçerli bir onay eylemi ('APPROVE' veya 'REJECT') belirtilmelidir." },
        { status: 400 }
      )
    }

    const proof = await prisma.workProof.findUnique({
      where: { id: proofId },
    })

    if (!proof) {
      return NextResponse.json({ error: "İş kanıtı bulunamadı." }, { status: 404 })
    }

    const scopeErr = assertRecordTenantScope(auth, proof)
    if (scopeErr) return scopeErr

    const newEngineerStatus = isEngineer
      ? action === "APPROVE" ? "APPROVED" : "REJECTED"
      : proof.engineerStatus

    const newManagerStatus = isManager
      ? action === "APPROVE" ? "APPROVED" : "REJECTED"
      : proof.managerStatus

    let finalStatus = proof.status
    if (newManagerStatus === "REJECTED" || newEngineerStatus === "REJECTED") {
      finalStatus = "REJECTED"
    } else if (newManagerStatus === "APPROVED") {
      finalStatus = "APPROVED"
    } else if (newEngineerStatus === "APPROVED" && proof.managerStatus === "APPROVED") {
      finalStatus = "APPROVED"
    }

    const updated = await prisma.workProof.update({
      where: { id: proofId },
      data: {
        status: finalStatus,
        engineerStatus: newEngineerStatus,
        managerStatus: newManagerStatus,
        engineerId: isEngineer ? userId : proof.engineerId,
        managerId: isManager ? userId : proof.managerId,
        approvedQuantity:
          approvedQuantity != null ? Number(approvedQuantity) : proof.approvedQuantity ?? proof.claimedQuantity,
        description: notes ? `${proof.description}\n[Not: ${notes}]` : proof.description,
      },
    })

    return NextResponse.json({
      success: true,
      message: `İş kanıtı ${action === "APPROVE" ? "onaylandı" : "reddedildi"}.`,
      proof: updated,
    })
  } catch (error: any) {
    console.error("Work proof review error:", error)
    return NextResponse.json({ error: "Onay işlemi gerçekleştirilemedi." }, { status: 500 })
  }
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  return handleReview(request, context)
}

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  return handleReview(request, context)
}
