/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * 5D BIM Eleman & İş Paketi Eşleştirme (ACID Transaction) API Route
 */

import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { recordAuditLog, enqueueJob } from "@/lib/enterprise-core"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get("projectId")

    if (!projectId) {
      return NextResponse.json({ error: "Project ID is required" }, { status: 400 })
    }

    const elementMaps = await prisma.bimElementMap.findMany({
      where: { projectId },
      include: {
        workPackage: true,
      },
      orderBy: { updatedAt: "desc" },
    })

    return NextResponse.json(elementMaps)
  } catch (error: any) {
    console.error("Failed to fetch BIM element maps:", error)
    return NextResponse.json({ error: error?.message || "Failed to fetch maps" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      projectId,
      workPackageId,
      elementKey,
      categoryKey = "statik",
      quantity = 0,
      status = "COMPLETED",
      userName = "3D BIM Saha Sorumlusu",
    } = body

    if (!projectId || !workPackageId || !elementKey) {
      return NextResponse.json(
        { error: "projectId, workPackageId, and elementKey are required" },
        { status: 400 }
      )
    }

    const numQuantity = parseFloat(quantity) || 0

    // ACID Transaction ile 5D BIM eleman eşleştirme ve hakediş güncelleme
    const result = await prisma.$transaction(async (tx) => {
      // 1. BimElementMap kaydını upsert et
      const elementMap = await tx.bimElementMap.upsert({
        where: {
          projectId_elementKey: {
            projectId,
            elementKey,
          },
        },
        update: {
          workPackageId,
          categoryKey,
          quantity: numQuantity,
          status,
        },
        create: {
          projectId,
          workPackageId,
          elementKey,
          categoryKey,
          quantity: numQuantity,
          status,
        },
      })

      // 2. İlgili WorkPackage kaydını güncelle
      let updatedWorkPackage = null
      if (status === "COMPLETED") {
        updatedWorkPackage = await tx.workPackage.update({
          where: { id: workPackageId },
          data: {
            completedQuantity: {
              increment: numQuantity,
            },
            status: "IN_PROGRESS",
          },
        })
      } else {
        updatedWorkPackage = await tx.workPackage.findUnique({
          where: { id: workPackageId },
        })
      }

      const unitText = updatedWorkPackage?.unit || "m³"

      // 3. Denetim İzi (AuditLog) kaydı oluştur
      const auditSummary =
        status === "COMPLETED"
          ? `3D Model üzerinden [${elementKey}] imalatı tamamlandı olarak işaretlendi ve metraj hakedişe eklendi (${numQuantity} ${unitText}).`
          : `3D Model üzerinden [${elementKey}] elemanı güncellendi (${status}).`

      const auditLog = await recordAuditLog({
        projectId,
        userName,
        action: status === "COMPLETED" ? "ELEMENT_COMPLETED" : "BOQ_LINKED",
        entityType: "BimElementMap",
        entityId: elementMap.id,
        summary: auditSummary,
        newValues: {
          elementKey,
          workPackageId,
          pozNo: updatedWorkPackage?.pozNo,
          completedQuantity: updatedWorkPackage?.completedQuantity,
          quantity: numQuantity,
          status,
        },
        tx,
      })

      // 4. Arka Plan Kuyruğuna (BackgroundJob) BIM_METRAJ_INDEX işi ekle
      const backgroundJob = await enqueueJob({
        jobType: "BIM_METRAJ_INDEX",
        projectId,
        payload: {
          elementKey,
          workPackageId,
          pozNo: updatedWorkPackage?.pozNo,
          quantity: numQuantity,
          status,
        },
        tx,
      })

      return {
        elementMap,
        workPackage: updatedWorkPackage,
        auditLog,
        backgroundJob,
      }
    })

    return NextResponse.json({
      success: true,
      message: "3D BIM Elemanı başarıyla iş paketine eşleştirildi ve metraj hakedişe eklendi.",
      ...result,
    })
  } catch (error: any) {
    console.error("Failed to map BIM element:", error)
    return NextResponse.json(
      { error: error?.message || "Eleman eşleştirilirken bir hata oluştu." },
      { status: 500 }
    )
  }
}
