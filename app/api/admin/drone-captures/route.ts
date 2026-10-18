import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// GET /api/admin/drone-captures?projectId=...
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get("projectId")

    if (!projectId) {
      return NextResponse.json(
        { error: "projectId parametresi gereklidir" },
        { status: 400 }
      )
    }

    const captures = await prisma.droneCapture.findMany({
      where: { projectId },
      orderBy: { captureDate: "asc" }
    })

    return NextResponse.json(captures)
  } catch (error) {
    console.error("Error fetching drone captures:", error)
    return NextResponse.json(
      { error: "Drone çekimleri alınırken hata oluştu" },
      { status: 500 }
    )
  }
}

// POST /api/admin/drone-captures
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { projectId, stageName, modelUrl, captureDate, progressPct, aiAnalysis } = body

    if (!projectId || !stageName || !modelUrl) {
      return NextResponse.json(
        { error: "projectId, stageName ve modelUrl alanları zorunludur" },
        { status: 400 }
      )
    }

    const capture = await prisma.droneCapture.create({
      data: {
        projectId,
        stageName,
        modelUrl,
        captureDate: captureDate ? new Date(captureDate) : new Date(),
        progressPct: typeof progressPct === "number" ? progressPct : parseInt(progressPct || "0", 10),
        aiAnalysis: aiAnalysis || null
      }
    })

    return NextResponse.json(capture, { status: 201 })
  } catch (error) {
    console.error("Error creating drone capture:", error)
    return NextResponse.json(
      { error: "Drone çekimi kaydedilirken hata oluştu" },
      { status: 500 }
    )
  }
}
