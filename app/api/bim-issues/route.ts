/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * This code is the property of NXA Software.
 */

import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      projectId,
      title,
      description,
      imageUrl,
      positionX,
      positionY,
      positionZ,
      status,
      subcontractorName,
      severity,
      blockPayment,
      penaltyAmount,
    } = body

    // Embed metadata in description so schema remains backward-compatible without requiring raw DB migrations
    let storedDescription = description || ""
    const meta = { subcontractorName, severity, blockPayment, penaltyAmount }
    storedDescription = `${storedDescription}\n\n---BIM_META---\n${JSON.stringify(meta)}`

    const issue = await prisma.bimIssue.create({
      data: {
        projectId,
        title,
        description: storedDescription,
        imageUrl,
        positionX,
        positionY,
        positionZ,
        status: status || "OPEN",
      },
    })

    // 1. ApprovalRequest: Çözüm Onayı Talebi aç
    try {
      await prisma.approvalRequest.create({
        data: {
          projectId,
          title: `Kusur Çözüm Onayı: ${title}`,
          requestType: "KUSUR_KAPATMA",
          entityId: issue.id,
          requestedBy: subcontractorName || "Saha Ekibi",
          status: "PENDING",
          amount: penaltyAmount ? parseFloat(penaltyAmount) : null,
          notes: `Kusur bildirimi: ${description || title}. Şiddet: ${severity || "CRITICAL"}. Hakediş Blokesi: ${blockPayment ? "Aktif" : "Pasif"}`
        }
      })
    } catch (apprErr) {
      console.warn("ApprovalRequest oluşturulamadı:", apprErr)
    }

    // 2. Merkezi Denetim İzi (AuditLog) kaydı oluştur
    try {
      const { recordAuditLog } = await import("@/lib/enterprise-core")
      await recordAuditLog({
        projectId,
        action: "DEFECT_CREATED",
        entityType: "BimIssue",
        entityId: issue.id,
        summary: `3D Model üzerinde yeni kusur bildirildi: [${title}] (${subcontractorName || "Taşeron"}) - Ceza: ${penaltyAmount ? `${penaltyAmount} TL` : "Yok"}.`,
        newValues: {
          title,
          severity,
          subcontractorName,
          blockPayment,
          penaltyAmount,
        }
      })
    } catch (auditErr) {
      console.warn("AuditLog kaydedilemedi:", auditErr)
    }

    // 3. Arka Plan Kuyruğuna (BackgroundJob) DEFECT_RISK_SYNC işi ekle
    try {
      const { enqueueJob } = await import("@/lib/enterprise-core")
      await enqueueJob({
        jobType: "DEFECT_RISK_SYNC",
        projectId,
        payload: {
          issueId: issue.id,
          title,
          severity,
          subcontractorName,
          blockPayment,
        }
      })
    } catch (queueErr) {
      console.warn("BackgroundJob eklenemedi:", queueErr)
    }

    return NextResponse.json({
      ...issue,
      description: description || "",
      subcontractorName,
      severity,
      blockPayment,
      penaltyAmount,
    })
  } catch (error) {
    console.error("Failed to create BIM issue:", error)
    return NextResponse.json({ error: "Failed to create issue" }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get("projectId")

    if (!projectId) {
      return NextResponse.json({ error: "Project ID is required" }, { status: 400 })
    }

    const issues = await prisma.bimIssue.findMany({
      where: { projectId },
      orderBy: { createdAt: "desc" },
    })

    const parsedIssues = issues.map((iss) => {
      let desc = iss.description || ""
      let meta: any = {}
      if (desc.includes("---BIM_META---")) {
        const parts = desc.split("---BIM_META---")
        desc = parts[0].trim()
        try {
          meta = JSON.parse(parts[1].trim())
        } catch {}
      }
      return {
        ...iss,
        description: desc,
        subcontractorName: meta.subcontractorName || null,
        severity: meta.severity || "CRITICAL",
        blockPayment: meta.blockPayment !== undefined ? meta.blockPayment : true,
        penaltyAmount: meta.penaltyAmount || null,
      }
    })

    return NextResponse.json(parsedIssues)
  } catch (error) {
    console.error("Failed to fetch BIM issues:", error)
    return NextResponse.json({ error: "Failed to fetch issues" }, { status: 500 })
  }
}
