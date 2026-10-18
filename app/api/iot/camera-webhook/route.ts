import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// POST /api/iot/camera-webhook
// Harici Python (YOLOv8) AI sunucusundan gelen gerçek zamanlı video analiz tespitlerini karşılar
// Payload: { cameraId: "CAM_1", violationType: "NO_HELMET", confidence: 0.92, imageBlobUrl: "...", projectId?: "..." }
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const {
      cameraId = "CAM_1",
      violationType = "NO_HELMET",
      confidence = 0.92,
      imageBlobUrl,
      imageUrl,
      projectId: reqProjectId
    } = body

    // 1. Projeyi belirle
    let projectId = reqProjectId
    if (!projectId) {
      const firstProject = await prisma.project.findFirst({ select: { id: true } })
      projectId = firstProject?.id || "default-project"
    }

    const confScore = typeof confidence === "number" ? confidence : parseFloat(String(confidence) || "0.92")
    const resolvedImg = imageBlobUrl || imageUrl || null

    // 2. CameraViolation tablosuna kaydet
    const cameraViolation = await prisma.cameraViolation.create({
      data: {
        projectId,
        cameraId,
        violation: violationType,
        confidence: confScore,
        imageUrl: resolvedImg,
        status: "OPEN"
      }
    })

    // 3. Genel İSG Radarının da tetiklenmesi için IsgViolation kaydı oluştur
    const violationLabel =
      violationType === "NO_HELMET"
        ? "Baret Takılmadı (YOLOv8 AI Kamera Tespiti)"
        : violationType === "UNAUTHORIZED_ZONE"
        ? "Yetkisiz Bölge Girişi (AI Çit İhlali)"
        : `${violationType} İhlali`

    await prisma.isgViolation.create({
      data: {
        projectId,
        workerName: `Kamera Tespiti [${cameraId}]`,
        violation: `${violationLabel} (%${Math.round(confScore * 100)} Doğruluk)`,
        zoneName: `Kamera İzleme Alanı (${cameraId})`,
        status: "OPEN"
      }
    })

    console.log(`[AI KAMERA TESPİTİ] ${cameraId} - ${violationType} (Güven: %${Math.round(confScore * 100)})`)

    return NextResponse.json({
      success: true,
      violationId: cameraViolation.id,
      cameraId,
      violationType,
      confidence: confScore,
      timestamp: cameraViolation.timestamp
    }, { status: 201 })
  } catch (error) {
    console.error("Camera webhook hatası:", error)
    return NextResponse.json(
      { error: "Kamera tespiti işlenirken hata oluştu" },
      { status: 500 }
    )
  }
}

// GET /api/iot/camera-webhook?projectId=...
// Live Dashboard'daki "📷 AI Kamera Tespitleri" canlı akışı için
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get("projectId")

    const whereClause: any = {}
    if (projectId) {
      whereClause.projectId = projectId
    }

    const violations = await prisma.cameraViolation.findMany({
      where: whereClause,
      orderBy: { timestamp: "desc" },
      take: 15
    })

    return NextResponse.json(violations)
  } catch (error) {
    console.error("Kamera tespitleri getirme hatası:", error)
    return NextResponse.json(
      { error: "Kamera tespitleri alınamadı" },
      { status: 500 }
    )
  }
}

// PATCH /api/iot/camera-webhook
// Kameradaki tespiti "RESOLVED" (İncelendi / Çözüldü) yap
export async function PATCH(request: Request) {
  try {
    const body = await request.json()
    const { violationId, status = "RESOLVED" } = body

    if (!violationId) {
      return NextResponse.json(
        { error: "violationId gereklidir" },
        { status: 400 }
      )
    }

    const updated = await prisma.cameraViolation.update({
      where: { id: violationId },
      data: { status }
    })

    return NextResponse.json({ success: true, updated })
  } catch (error) {
    console.error("Kamera tespiti güncelleme hatası:", error)
    return NextResponse.json(
      { error: "Güncelleme başarısız" },
      { status: 500 }
    )
  }
}
