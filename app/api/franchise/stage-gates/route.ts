/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Franchise Stage-Gate İdari Onay ve Kilit API'si
 */

import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

export const dynamic = "force-dynamic"

export const DEFAULT_STAGE_GATES = [
  { stageName: "KİRALAMA", isRequired: true, label: "Kira Kontratı & Alan Tahsisi" },
  { stageName: "AVM_ONAYI", isRequired: true, label: "AVM Mimari & Teknik Onayı" },
  { stageName: "KABA_YAPI", isRequired: true, label: "Kaba & İnce Yapı İnşaat İzni" },
  { stageName: "İTFAİYE_ONAYI", isRequired: true, label: "İtfaiye Yangın & İskan Ruhsatı" },
  { stageName: "AÇILIŞ", isRequired: true, label: "Merkez Kurumsal Açılış Yetkisi" },
]

export async function GET(request: Request) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get("projectId")

    if (projectId) {
      let stages = await prisma.stageGate.findMany({
        where: { projectId },
        orderBy: { createdAt: "asc" },
      })

      // Eğer projeye ait stage-gate henüz oluşturulmamışsa varsayılan fazları oluştur
      if (stages.length === 0) {
        const project = await prisma.project.findUnique({ where: { id: projectId } })
        if (project) {
          for (const item of DEFAULT_STAGE_GATES) {
            await prisma.stageGate.create({
              data: {
                projectId,
                stageName: item.stageName,
                isRequired: item.isRequired,
                isApproved: false,
              },
            })
          }
          stages = await prisma.stageGate.findMany({
            where: { projectId },
            orderBy: { createdAt: "asc" },
          })
        }
      }

      return NextResponse.json({ stages })
    }

    // Tüm projelerin Stage-Gate özet durumları
    const projectsWithStages = await prisma.project.findMany({
      include: {
        stageGates: true,
        storeTemplate: true,
      },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json({ projects: projectsWithStages })
  } catch (error: any) {
    console.error("❌ Stage-Gates GET Error:", error)
    return NextResponse.json({ error: error.message || "İdari kilitler alınamadı" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 })
    }

    const body = await request.json()
    const { projectId, stageName, isRequired, documentUrl } = body

    if (!projectId || !stageName) {
      return NextResponse.json({ error: "projectId ve stageName zorunludur" }, { status: 400 })
    }

    const newGate = await prisma.stageGate.create({
      data: {
        projectId,
        stageName,
        isRequired: isRequired ?? true,
        documentUrl: documentUrl || null,
        isApproved: false,
      },
    })

    return NextResponse.json({ stageGate: newGate }, { status: 201 })
  } catch (error: any) {
    console.error("❌ Stage-Gates POST Error:", error)
    return NextResponse.json({ error: error.message || "Aşama oluşturulamadı" }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 })
    }

    const body = await request.json()
    const { id, isApproved, documentUrl } = body

    if (!id) {
      return NextResponse.json({ error: "Stage Gate ID zorunludur" }, { status: 400 })
    }

    const currentGate = await prisma.stageGate.findUnique({
      where: { id },
      include: { project: { include: { stageGates: { orderBy: { createdAt: "asc" } } } } },
    })

    if (!currentGate) {
      return NextResponse.json({ error: "Aşama bulunamadı" }, { status: 404 })
    }

    // Stage-Gate Kuralı: Eğer onaylanmak isteniyorsa, kendisinden önceki zorunlu aşamaların onaylanmış olması gerekir
    if (isApproved === true) {
      const allStages = currentGate.project.stageGates
      const currentIndex = allStages.findIndex((s) => s.id === id)

      for (let i = 0; i < currentIndex; i++) {
        const prevStage = allStages[i]
        if (prevStage.isRequired && !prevStage.isApproved) {
          return NextResponse.json(
            {
              error: `Bu aşamayı onaylayamazsınız! Önce "${prevStage.stageName}" aşamasının onaylanması gerekmektedir.`,
            },
            { status: 400 }
          )
        }
      }
    }

    const updated = await prisma.stageGate.update({
      where: { id },
      data: {
        isApproved: isApproved !== undefined ? isApproved : currentGate.isApproved,
        documentUrl: documentUrl !== undefined ? documentUrl : currentGate.documentUrl,
        approvedById: isApproved ? session.user.id : isApproved === false ? null : currentGate.approvedById,
        approvedAt: isApproved ? new Date() : isApproved === false ? null : currentGate.approvedAt,
      },
    })

    return NextResponse.json({ stageGate: updated, success: true })
  } catch (error: any) {
    console.error("❌ Stage-Gates PATCH Error:", error)
    return NextResponse.json({ error: error.message || "Aşama güncellenemedi" }, { status: 500 })
  }
}
