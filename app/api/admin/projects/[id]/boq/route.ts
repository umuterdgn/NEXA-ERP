import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

// BoQ 2.0: AI Fire, Karbon Salınımı ve Delta Revizyon hesaplayıcı
function computeBoq2Metrics(item: {
  name: string
  categoryKey?: string | null
  unit?: string | null
  plannedQuantity: number
  unitPrice: number
  // Dinamik Fiyatlandırma & Enflasyon Simülatörü
  theoreticalQuantity?: number | null
  aiWasteMargin?: number | null
  actualOrderQty?: number | null
  carbonEmission?: number | null
  totalCarbon?: number | null
  version?: number | null
  previousQuantity?: number | null
  baseCurrency?: string | null
  exchangeRateAtBid?: number | null
  currentUnitPrice?: number | null
  inflationImpact?: number | null
}) {
  const nameLower = (item.name || "").toLowerCase()
  const cat = (item.categoryKey || "").toLowerCase()
  const qty = item.plannedQuantity || 0

  let defaultWaste = 0.04
  let defaultCarbonEmission = 35.0 // kg CO2 / birim
  let prevQtyFactor = 0.95

  if (
    nameLower.includes("beton") ||
    (cat.includes("statik") && (nameLower.includes("c25") || nameLower.includes("c30") || nameLower.includes("c35") || item.unit === "m3"))
  ) {
    defaultWaste = 0.042 // %4.2 fire
    defaultCarbonEmission = 245.0 // kg CO2 / m3
    prevQtyFactor = 0.92
  } else if (
    nameLower.includes("demir") ||
    nameLower.includes("çelik") ||
    nameLower.includes("donatı") ||
    item.unit === "ton"
  ) {
    defaultWaste = 0.055 // %5.5 fire
    defaultCarbonEmission = 1850.0 // kg CO2 / ton
    prevQtyFactor = 0.90
  } else if (
    nameLower.includes("duvar") ||
    nameLower.includes("gazbeton") ||
    nameLower.includes("tuğla") ||
    nameLower.includes("bims")
  ) {
    defaultWaste = 0.065 // %6.5 fire
    defaultCarbonEmission = 42.0 // kg CO2 / m2
    prevQtyFactor = 1.06
  } else if (
    nameLower.includes("kablo") ||
    nameLower.includes("kanal") ||
    cat.includes("elektrik")
  ) {
    defaultWaste = 0.035 // %3.5 fire
    defaultCarbonEmission = 3.8 // kg CO2 / mt
    prevQtyFactor = 0.97
  } else if (
    nameLower.includes("boru") ||
    nameLower.includes("tesisat") ||
    cat.includes("mekanik")
  ) {
    defaultWaste = 0.048 // %4.8 fire
    defaultCarbonEmission = 5.2 // kg CO2 / mt
    prevQtyFactor = 0.98
  }

  const aiWasteMargin = item.aiWasteMargin ?? defaultWaste
  const theoreticalQuantity =
    item.theoreticalQuantity ??
    (qty > 0 ? Math.round((qty / (1 + aiWasteMargin)) * 100) / 100 : 0)
  const actualOrderQty = item.actualOrderQty ?? qty
  const carbonEmission = item.carbonEmission ?? defaultCarbonEmission
  const totalCarbon =
    item.totalCarbon ?? Math.round(actualOrderQty * carbonEmission * 10) / 10
  const version = item.version ?? 2
  const previousQuantity =
    item.previousQuantity ?? (qty > 0 ? Math.round(qty * prevQtyFactor * 100) / 100 : 0)

  // Enflasyon & Kur Simülatörü Metrikleri
  const baseCurrency = item.baseCurrency || "TRY"
  const exchangeRateAtBid = item.exchangeRateAtBid ?? (baseCurrency === "USD" ? 31.5 : baseCurrency === "EUR" ? 34.2 : 1.0)
  const currentUnitPrice = item.currentUnitPrice ?? (item.unitPrice > 0 ? Math.round(item.unitPrice * 1.215 * 100) / 100 : 0)
  const inflationImpact = item.inflationImpact ?? Math.round(Math.max(0, currentUnitPrice - item.unitPrice) * qty * 100) / 100

  return {
    theoreticalQuantity,
    aiWasteMargin,
    actualOrderQty,
    carbonEmission,
    totalCarbon,
    version,
    previousQuantity,
    baseCurrency,
    exchangeRateAtBid,
    currentUnitPrice,
    inflationImpact
  }
}

// GET /api/admin/projects/[id]/boq
// Projenin tüm iş paketlerini (BoQ pozlarını) BoQ 2.0 metrikleriyle döner
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    const userRole = session?.user?.role as string
    const isSuperAdmin = userRole === "SUPER_ADMIN"
    const tenantId = (session?.user as any)?.tenantId as string | undefined

    if (!session?.user || (!tenantId && !isSuperAdmin)) {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 })
    }

    const tenantFilter: any = !isSuperAdmin ? (tenantId ? { tenantId } : { tenantId: "non-existent" }) : {}

    const resolvedParams = await params
    const projectId = resolvedParams.id

    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        ...tenantFilter,
      },
      select: { id: true, name: true, title: true }
    })

    if (!project) {
      return NextResponse.json({ error: "Proje bulunamadı veya yetkisiz erişim" }, { status: 404 })
    }

    const rawWorkPackages = await prisma.workPackage.findMany({
      where: {
        projectId,
        ...tenantFilter,
      },
      orderBy: [{ categoryKey: "asc" }, { pozNo: "asc" }]
    })

    // BoQ 2.0 zenginleştirmesi
    const workPackages = rawWorkPackages.map((wp) => {
      const metrics = computeBoq2Metrics({
        name: wp.name,
        categoryKey: wp.categoryKey,
        unit: wp.unit,
        plannedQuantity: wp.plannedQuantity,
        unitPrice: wp.unitPrice,
        theoreticalQuantity: wp.theoreticalQuantity,
        aiWasteMargin: wp.aiWasteMargin,
        actualOrderQty: wp.actualOrderQty,
        carbonEmission: wp.carbonEmission,
        totalCarbon: wp.totalCarbon,
        version: wp.version,
        previousQuantity: wp.previousQuantity,
        baseCurrency: wp.baseCurrency,
        exchangeRateAtBid: wp.exchangeRateAtBid,
        currentUnitPrice: wp.currentUnitPrice,
        inflationImpact: wp.inflationImpact
      })

      return {
        ...wp,
        ...metrics
      }
    })

    return NextResponse.json({ project, workPackages })
  } catch (error) {
    console.error("BoQ fetch error:", error)
    return NextResponse.json({ error: "Pozlar yüklenirken hata oluştu" }, { status: 500 })
  }
}

// POST /api/admin/projects/[id]/boq
// Excel'den gelen toplu pozları (Bulk Insert) BoQ 2.0 metrikleriyle kaydeder
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    const userRole = session?.user?.role as string
    const isSuperAdmin = userRole === "SUPER_ADMIN"
    const tenantId = (session?.user as any)?.tenantId as string | undefined

    if (!session?.user || (!tenantId && !isSuperAdmin)) {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 })
    }

    const tenantFilter: any = !isSuperAdmin ? (tenantId ? { tenantId } : { tenantId: "non-existent" }) : {}

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
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        ...tenantFilter,
      },
      select: { id: true, name: true, title: true }
    })

    if (!project) {
      return NextResponse.json({ error: "Proje bulunamadı veya yetkisiz erişim" }, { status: 404 })
    }

    // Poz verilerini hazırla (BoQ 2.0 alanları dahil)
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

      const unit = String(item.unit || "adet").trim()
      const name = String(item.name || "İsimsiz İmalat").trim()

      const metrics = computeBoq2Metrics({
        name,
        categoryKey,
        unit,
        plannedQuantity,
        unitPrice
      })

      return {
        projectId,
        tenantId: tenantId || null,
        pozNo: item.pozNo ? String(item.pozNo).trim() : null,
        code: item.pozNo ? String(item.pozNo).trim() : null,
        name,
        categoryKey,
        unit,
        unitPrice,
        plannedQuantity,
        completedQuantity: 0,
        totalBudget,
        status: "PLANNED",
        theoreticalQuantity: metrics.theoreticalQuantity,
        aiWasteMargin: metrics.aiWasteMargin,
        actualOrderQty: metrics.actualOrderQty,
        carbonEmission: metrics.carbonEmission,
        totalCarbon: metrics.totalCarbon,
        version: metrics.version,
        previousQuantity: metrics.previousQuantity
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
          summary: `Excel üzerinden ${result.count} adet yeni imalat pozu (BoQ 2.0) bulk olarak içe aktarıldı.`,
          newValues: { count: result.count, samplePoz: dataToInsert[0]?.pozNo }
        }
      })
    } catch (auditErr) {
      console.warn("AuditLog kaydı oluşturulamadı:", auditErr)
    }

    return NextResponse.json({
      success: true,
      count: result.count,
      message: `${result.count} adet iş paketi (BoQ 2.0) başarıyla projeye eklendi.`
    })
  } catch (error: any) {
    console.error("BoQ bulk import error:", error)
    return NextResponse.json(
      { error: error?.message || "Pozlar içe aktarılırken bir hata oluştu" },
      { status: 500 }
    )
  }
}
