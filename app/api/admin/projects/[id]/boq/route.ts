import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

// GET /api/admin/projects/[id]/boq
// Projenin tüm iş paketlerini (BoQ pozlarını) döner
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params
    const projectId = resolvedParams.id

    const workPackages = await prisma.workPackage.findMany({
      where: { projectId },
      orderBy: [{ categoryKey: "asc" }, { pozNo: "asc" }]
    })

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { id: true, name: true, title: true }
    })

    return NextResponse.json({ project, workPackages })
  } catch (error) {
    console.error("BoQ fetch error:", error)
    return NextResponse.json({ error: "Pozlar yüklenirken hata oluştu" }, { status: 500 })
  }
}

// POST /api/admin/projects/[id]/boq
// Excel'den gelen toplu pozları (Bulk Insert) kaydeder
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 })
    }

    const resolvedParams = await params
    const projectId = resolvedParams.id

    const body = await request.json()
    const { items } = body

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: "İçe aktarılacak geçerli poz listesi bulunamadı" },
        { status: 400 }
      )
    }

    // Projeyi doğrula
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { id: true, name: true, title: true }
    })

    if (!project) {
      return NextResponse.json({ error: "Proje bulunamadı" }, { status: 404 })
    }

    // Poz verilerini hazırla
    const dataToInsert = items.map((item: any) => {
      const unitPrice = parseFloat(item.unitPrice) || 0
      const plannedQuantity = parseFloat(item.plannedQuantity) || 0
      const totalBudget = unitPrice * plannedQuantity

      // Kategori standardizasyonu
      const catLower = String(item.categoryKey || "statik").toLowerCase()
      const categoryKey = catLower.includes("mimar")
        ? "mimari"
        : catLower.includes("elektrik")
        ? "elektrik"
        : catLower.includes("mekanik")
        ? "mekanik"
        : "statik"

      return {
        projectId,
        pozNo: item.pozNo ? String(item.pozNo).trim() : null,
        code: item.pozNo ? String(item.pozNo).trim() : null,
        name: String(item.name || "İsimsiz İmalat").trim(),
        categoryKey,
        unit: String(item.unit || "adet").trim(),
        unitPrice,
        plannedQuantity,
        completedQuantity: 0,
        totalBudget,
        status: "PLANNED"
      }
    })

    // Prisma createMany ile bulk insert
    const result = await prisma.workPackage.createMany({
      data: dataToInsert,
      skipDuplicates: false
    })

    // AuditLog kaydı oluştur
    try {
      await prisma.auditLog.create({
        data: {
          projectId,
          userId: session.user.id,
          userName: session.user.name || "Yönetici",
          action: "BOQ_EXCEL_BULK_IMPORT",
          entityType: "WorkPackage",
          summary: `Excel üzerinden ${result.count} adet yeni imalat pozu (BoQ) bulk olarak içe aktarıldı.`,
          newValues: { count: result.count, samplePoz: dataToInsert[0]?.pozNo }
        }
      })
    } catch (auditErr) {
      console.warn("AuditLog kaydı oluşturulamadı:", auditErr)
    }

    return NextResponse.json({
      success: true,
      count: result.count,
      message: `${result.count} adet iş paketi (BoQ) başarıyla projeye eklendi.`
    })
  } catch (error: any) {
    console.error("BoQ bulk import error:", error)
    return NextResponse.json(
      { error: error?.message || "Pozlar içe aktarılırken bir hata oluştu" },
      { status: 500 }
    )
  }
}
