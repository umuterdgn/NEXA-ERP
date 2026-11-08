/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Franchise Rollout Stage-Gate Sert Doğrulama ve Aşama Güncelleme API'si
 * Endpoint: /api/franchise/rollout/update-stage
 */

import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { validateStageGateTransition, updateRolloutBoardStage } from "@/app/actions/franchise-rollout"

export const dynamic = "force-dynamic"

export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 })
    }

    const body = await request.json()
    const { projectId, newStage, currentStage } = body

    if (!projectId || !newStage) {
      return NextResponse.json(
        { error: "projectId ve newStage parametreleri zorunludur" },
        { status: 400 }
      )
    }

    // Normalizasyon
    const targetStageNorm = (newStage || "").toUpperCase().replace(/-/g, "_")
    const fromStageNorm = (currentStage || "").toUpperCase().replace(/-/g, "_")

    // ============================================================================
    // ADIM 2: KATI STAGE-GATE DOĞRULAMA KURALLARI
    // ============================================================================

    // KURAL 1: Kart "Mimari Proje" aşamasından "Şantiye & İnşaat" aşamasına çekiliyorsa:
    // Prisma'dan o projenin onaylı bir 3D BIM veya 2D çizim dosyasına sahip olup olmadığını kontrol et.
    if (
      targetStageNorm === "SANCIYE_INSAAT" ||
      targetStageNorm === "INSAAT" ||
      targetStageNorm === "KABA_YAPI"
    ) {
      let hasBimOrDrawing = false

      try {
        // 1. Prisma BimFile kontrolü
        const bimCount = await prisma.bimFile.count({
          where: {
            OR: [
              { projectId: projectId },
              { project: { id: projectId } },
            ],
          },
        })
        if (bimCount > 0) {
          hasBimOrDrawing = true
        }

        // 2. StageGate Mimari Proje belgesi kontrolü
        if (!hasBimOrDrawing) {
          const archGate = await prisma.stageGate.findFirst({
            where: {
              rolloutProjectId: projectId,
              OR: [
                { stageName: "MIMARI_PROJE" },
                { stageName: "LOKASYON_ONAYI" },
                { name: { contains: "Mimari", mode: "insensitive" } },
                { name: { contains: "Dekorasyon", mode: "insensitive" } },
              ],
              AND: [
                {
                  OR: [
                    { isApproved: true },
                    { documentUrl: { not: null } },
                  ],
                },
              ],
            },
          })
          if (archGate) {
            hasBimOrDrawing = true
          }
        }
      } catch (dbErr) {
        // Offline / sandbox fallback: Server action doğrulama kurallarını kullan
        console.warn("DB StageGate check fallback to memory validation:", dbErr)
      }

      // Action seviyesindeki yedek kontrol
      if (!hasBimOrDrawing) {
        const fallbackCheck = await validateStageGateTransition(projectId, "SANCIYE_INSAAT")
        if (!fallbackCheck.allowed) {
          return NextResponse.json(
            {
              error: "Eksik belgeleri yüklemeden bu aşamaya geçemezsiniz",
              missingItem: "Onaylı 3D BIM Modeli veya 2D Mimari Uygulama Çizimi",
              missingDoc: "Onaylı 3D BIM Modeli veya 2D Mimari Uygulama Çizimi",
              code: "MISSING_ARCHITECTURAL_BIM",
              reason:
                "Şantiye ve inşaat imalatına geçebilmek için onaylanmış bir 3D BIM modeli veya mimari ruhsat çizimi zorunludur.",
            },
            { status: 400 }
          )
        }
      }
    }

    // KURAL 2: Kart "Resmi İzinler" aşamasını geçmek istiyorsa (Pre-Opening):
    // Zorunlu "Çalışma Ruhsatı" ve "İtfaiye Raporu" yüklenmiş mi bak.
    if (
      targetStageNorm === "PRE_OPENING" ||
      targetStageNorm === "ACILISA_HAZIR" ||
      fromStageNorm === "RESMI_IZINLER"
    ) {
      let hasFireReport = false
      let hasWorkPermit = false

      try {
        // İtfaiye raporu kontrolü
        const fireGate = await prisma.stageGate.findFirst({
          where: {
            rolloutProjectId: projectId,
            OR: [
              { name: { contains: "İtfaiye", mode: "insensitive" } },
              { name: { contains: "Yangın", mode: "insensitive" } },
              { stageName: "İTFAİYE_ONAYI" },
              { stageName: "RESMI_IZINLER" },
            ],
            AND: [
              {
                OR: [
                  { isApproved: true },
                  { documentUrl: { not: null } },
                ],
              },
            ],
          },
        })
        if (fireGate) hasFireReport = true

        // Çalışma ruhsatı kontrolü
        const permitGate = await prisma.stageGate.findFirst({
          where: {
            rolloutProjectId: projectId,
            OR: [
              { name: { contains: "Ruhsat", mode: "insensitive" } },
              { name: { contains: "Çalışma", mode: "insensitive" } },
              { stageName: "RESMI_IZINLER" },
            ],
            AND: [
              {
                OR: [
                  { isApproved: true },
                  { documentUrl: { not: null } },
                ],
              },
            ],
          },
        })
        if (permitGate) hasWorkPermit = true
      } catch (dbErr) {
        console.warn("DB Permits check fallback:", dbErr)
      }

      // Eksikse fallback action motorundan da doğrula
      if (!hasFireReport || !hasWorkPermit) {
        const fallbackCheck = await validateStageGateTransition(projectId, "PRE_OPENING")
        if (!fallbackCheck.allowed) {
          const missingItems: string[] = []
          if (!hasFireReport) missingItems.push("İtfaiye Yangın Uygunluk Raporu")
          if (!hasWorkPermit) missingItems.push("İşyeri Açma ve Çalışma Ruhsatı")

          return NextResponse.json(
            {
              error: "Eksik belgeleri yüklemeden bu aşamaya geçemezsiniz",
              missingItem: missingItems.join(" ve "),
              missingDoc: missingItems.join(" ve "),
              code: "MISSING_MANDATORY_PERMITS",
              reason:
                "Şube açılış provasına (Pre-Opening) geçebilmek için resmi Çalışma Ruhsatı ve İtfaiye Raporu onay belgeleri yüklenmelidir.",
              details: fallbackCheck.blockingDetails,
            },
            { status: 400 }
          )
        }
      }
    }

    // ============================================================================
    // AŞAMA GÜNCELLEMESİ (VERİTABANI VE IN-MEMORY SYNC)
    // ============================================================================
    const updateResult = await updateRolloutBoardStage(projectId, targetStageNorm as any, true)

    if (!updateResult.success) {
      return NextResponse.json({ error: updateResult.error }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      projectId,
      newStage: targetStageNorm,
      message: `Şube aşaması başarıyla "${targetStageNorm}" olarak güncellendi.`,
    })
  } catch (error: any) {
    console.error("❌ /api/franchise/rollout/update-stage Error:", error)
    return NextResponse.json(
      { error: error.message || "Aşama güncellenirken beklenmedik hata oluştu" },
      { status: 500 }
    )
  }
}

export async function PATCH(request: Request) {
  return POST(request)
}

