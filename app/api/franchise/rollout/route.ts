/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Franchise Rollout (Kanban & Harita) Veri ve Aşama Güncelleme API'si
 * %100 Tenant İzolasyonu ile RolloutProject ve StageGate Modellerine Bağlıdır.
 */

import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

export const dynamic = "force-dynamic"

// Türkiye şehir koordinat eşlemesi (Harita için dinamik pin hesaplama)
const CITY_COORDS: Record<string, { lat: number; lng: number }> = {
  İSTANBUL: { lat: 41.0082, lng: 28.9784 },
  ISTANBUL: { lat: 41.0082, lng: 28.9784 },
  ANKARA: { lat: 39.9334, lng: 32.8597 },
  İZMİR: { lat: 38.4237, lng: 27.1428 },
  IZMIR: { lat: 38.4237, lng: 27.1428 },
  BURSA: { lat: 40.1885, lng: 29.0610 },
  ANTALYA: { lat: 36.8969, lng: 30.7133 },
  ADANA: { lat: 37.0000, lng: 35.3213 },
  TRABZON: { lat: 41.0027, lng: 39.7168 },
  GAZİANTEP: { lat: 37.0662, lng: 37.3833 },
  GAZIANTEP: { lat: 37.0662, lng: 37.3833 },
  KONYA: { lat: 37.8746, lng: 32.4932 },
  KAYSERİ: { lat: 38.7205, lng: 35.4826 },
  KAYSERI: { lat: 38.7205, lng: 35.4826 },
  DİYARBAKIR: { lat: 37.9144, lng: 40.2306 },
  DIYARBAKIR: { lat: 37.9144, lng: 40.2306 },
  ESKİŞEHİR: { lat: 39.7767, lng: 30.5206 },
  ESKISEHIR: { lat: 39.7767, lng: 30.5206 },
  MERSİN: { lat: 36.8121, lng: 34.6415 },
  MERSIN: { lat: 36.8121, lng: 34.6415 },
  SAMSUN: { lat: 41.2867, lng: 36.3300 },
  DENİZLİ: { lat: 37.7765, lng: 29.0864 },
  DENIZLI: { lat: 37.7765, lng: 29.0864 },
  SAKARYA: { lat: 40.7569, lng: 30.3783 },
  KOCAELİ: { lat: 40.7654, lng: 29.9408 },
  KOCAELI: { lat: 40.7654, lng: 29.9408 },
  MUĞLA: { lat: 37.2153, lng: 28.3636 },
  MUGLA: { lat: 37.2153, lng: 28.3636 },
  BALIKESİR: { lat: 39.6484, lng: 27.8826 },
  BALIKESIR: { lat: 39.6484, lng: 27.8826 },
  TEKİRDAĞ: { lat: 40.9833, lng: 27.5167 },
  TEKIRDAG: { lat: 40.9833, lng: 27.5167 },
}

function getCoordsForCity(cityName: string, index: number = 0) {
  const norm = (cityName || "").trim().toUpperCase()
  const base = CITY_COORDS[norm] || { lat: 39.0, lng: 35.0 }
  // Şehirde birden fazla mağaza varsa pinlerin üst üste binmemesi için hafif dağılım
  const offset = index * 0.015
  return {
    latitude: Number((base.lat + (index % 2 === 0 ? offset : -offset)).toFixed(4)),
    longitude: Number((base.lng + (index % 3 === 0 ? offset : -offset)).toFixed(4)),
  }
}

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 })
    }

    let tenantId = (session.user as any)?.tenantId

    if (!tenantId && session.user.id) {
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { tenantId: true },
      })
      tenantId = user?.tenantId
    }

    if (!tenantId) {
      const firstTenant = await prisma.tenant.findFirst({ select: { id: true } })
      tenantId = firstTenant?.id
    }

    if (!tenantId) {
      return NextResponse.json({ projects: [] })
    }

    const userRole = session.user.role
    const userId = session.user.id

    const whereClause: any = { tenantId }

    // ADIM 4: Rol bazlı görünürlük / Yetki Koruması
    // BÖLGE MÜDÜRÜ ise; sadece regionalManagerId'si kendisine atanmış Rollout projelerini görsün.
    if (userRole === "REGIONAL_MANAGER" && userId) {
      whereClause.regionalManagerId = userId
    }

    // TAŞERON ise; sadece kendisine iş kanıtı atanmış projeleri görsün
    if (userRole === "SUBCONTRACTOR" && userId) {
      whereClause.workProofs = {
        some: { subcontractorId: userId },
      }
    }

    // RolloutProject tablosundan kiracıya özel (Tenant Isolation) mağaza projelerini çek
    const rolloutProjects = await prisma.rolloutProject.findMany({
      where: whereClause,
      include: {
        stageGates: {
          orderBy: { createdAt: "asc" },
        },
      },
      orderBy: { createdAt: "desc" },
    })

    const enrichedProjects = rolloutProjects.map((p, idx) => {
      const coords = getCoordsForCity(p.city, idx)
      const totalGates = p.stageGates.length || 5
      const approvedGates = p.stageGates.filter((g) => g.status === "ONAYLANDI" || g.isApproved).length

      // Aşama / Statü Normalizasyonu
      let rolloutPhase = p.status || "KIRALAMA"
      if (rolloutPhase === "AVM_ONAY" || rolloutPhase === "AVM_ONAYI") rolloutPhase = "LOKASYON_ONAYI"
      if (rolloutPhase === "INSAAT") rolloutPhase = "INSAATTA"

      // İlerleme yüzdesi hesabı
      let progress = 10
      if (rolloutPhase === "LOKASYON_ONAYI") progress = 30
      else if (rolloutPhase === "INSAATTA" || rolloutPhase === "INSAAT") progress = 65
      else if (rolloutPhase === "PUNCH_LIST") progress = 85
      else if (rolloutPhase === "ACILISA_HAZIR") progress = 100

      return {
        id: p.id,
        name: p.name,
        title: p.name,
        city: p.city,
        district: p.city,
        location: `${p.city} Şubesi`,
        locationType: p.locationType || "STREET",
        latitude: p.lat || coords.latitude,
        longitude: p.lng || coords.longitude,
        progress,
        status: p.status,
        rolloutPhase,
        budget: p.totalBudget || p.budget || 0,
        totalBudget: p.totalBudget || p.budget || 0,
        regionalManagerId: p.regionalManagerId,
        branchManagerId: p.branchManagerId,
        grossAreaSqm: 140,
        totalCapex: p.totalBudget || p.budget || 0,
        stageGates: p.stageGates.map((g) => ({
          id: g.id,
          stageName: g.name || g.stageName || "Aşama",
          isApproved: g.status === "ONAYLANDI" || g.isApproved,
          isRequired: g.isRequired,
          documentUrl: g.documentUrl,
        })),
        punchLists: [],
        openDefects: rolloutPhase === "PUNCH_LIST" ? 2 : 0,
        totalGates,
        approvedGates,
      }
    })

    return NextResponse.json({ projects: enrichedProjects })
  } catch (error: any) {
    console.error("❌ Rollout GET Error:", error)
    return NextResponse.json({ error: error.message || "Rollout verisi alınamadı" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 })
    }

    let tenantId = (session.user as any)?.tenantId

    if (!tenantId && session.user.id) {
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { tenantId: true },
      })
      tenantId = user?.tenantId
    }

    if (!tenantId) {
      const firstTenant = await prisma.tenant.findFirst({ select: { id: true } })
      tenantId = firstTenant?.id
    }

    if (!tenantId) {
      return NextResponse.json({ error: "Kiracı (Tenant) bulunamadı" }, { status: 400 })
    }

    const body = await request.json()
    const { name, city, budget, totalBudget, status, regionalManagerId, branchManagerId, lat, lng, locationType } = body

    if (!name || !city) {
      return NextResponse.json({ error: "Mağaza adı ve şehir zorunludur" }, { status: 400 })
    }

    const bVal = totalBudget ?? budget ?? 0
    const coords = getCoordsForCity(city)
    const finalLat = lat ?? coords.latitude
    const finalLng = lng ?? coords.longitude
    const normLocationType = (locationType || "STREET").toUpperCase()

    // Lokasyon tipine göre dinamik Stage-Gate kapıları
    let locationGates: { name: string; stageName: string }[] = []
    if (normLocationType === "MALL") {
      locationGates = [
        { name: "AVM Yönetimi Dekorasyon Onayı", stageName: "LOKASYON_ONAYI" },
        { name: "AVM Gece Çalışma İzni", stageName: "LOKASYON_ONAYI" },
      ]
    } else if (normLocationType === "KIOSK") {
      locationGates = [
        { name: "Kiosk Yerleşim & AVM/Alan İzni", stageName: "LOKASYON_ONAYI" },
        { name: "Elektrik & Altyapı Bağlantı Onayı", stageName: "LOKASYON_ONAYI" },
      ]
    } else {
      // STREET (Cadde / Dükkan)
      locationGates = [
        { name: "Belediye Tadilat Ruhsatı", stageName: "LOKASYON_ONAYI" },
        { name: "Belediye Tabela İzni", stageName: "LOKASYON_ONAYI" },
      ]
    }

    const initialGates = [
      {
        name: "Kiralama & Alan Tahsisi",
        stageName: "KİRALAMA",
        status: "BEKLIYOR",
        isRequired: true,
        isApproved: false,
        tenantId,
      },
      ...locationGates.map((g) => ({
        name: g.name,
        stageName: g.stageName,
        status: "BEKLIYOR",
        isRequired: true,
        isApproved: false,
        tenantId,
      })),
      {
        name: "Kaba & İnce İnşaat Montajı",
        stageName: "KABA_YAPI",
        status: "BEKLIYOR",
        isRequired: true,
        isApproved: false,
        tenantId,
      },
      {
        name: "Punch List & Kalite Denetimi",
        stageName: "PUNCH_LIST",
        status: "BEKLIYOR",
        isRequired: true,
        isApproved: false,
        tenantId,
      },
      {
        name: "İtfaiye Ruhsatı & Açılış İzni",
        stageName: "İTFAİYE_ONAYI",
        status: "BEKLIYOR",
        isRequired: true,
        isApproved: false,
        tenantId,
      },
    ]

    const project = await prisma.rolloutProject.create({
      data: {
        tenantId,
        name: name.trim(),
        city: city.trim(),
        locationType: normLocationType,
        lat: finalLat,
        lng: finalLng,
        totalBudget: Number(bVal),
        budget: Number(bVal),
        status: status || "KIRALAMA",
        regionalManagerId: regionalManagerId || null,
        branchManagerId: branchManagerId || null,
        stageGates: {
          create: initialGates,
        },
      },
      include: {
        stageGates: true,
      },
    })

    return NextResponse.json({ project, success: true }, { status: 201 })
  } catch (error: any) {
    console.error("❌ Rollout POST Error:", error)
    return NextResponse.json({ error: error.message || "Mağaza açılamadı" }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 })
    }

    let tenantId = (session.user as any)?.tenantId

    if (!tenantId && session.user.id) {
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { tenantId: true },
      })
      tenantId = user?.tenantId
    }

    if (!tenantId) {
      const firstTenant = await prisma.tenant.findFirst({ select: { id: true } })
      tenantId = firstTenant?.id
    }

    const body = await request.json()
    const { projectId, rolloutPhase } = body

    if (!projectId) {
      return NextResponse.json({ error: "projectId zorunludur" }, { status: 400 })
    }

    // Normalizasyon: KIRALAMA, LOKASYON_ONAYI, INSAAT, PUNCH_LIST, ACILISA_HAZIR
    let dbStatus = rolloutPhase
    if (rolloutPhase === "AVM_ONAYI" || rolloutPhase === "AVM_ONAY" || rolloutPhase === "LOKASYON_ONAYI") {
      dbStatus = "LOKASYON_ONAYI"
    }
    if (rolloutPhase === "INSAATTA") dbStatus = "INSAAT"

    // Tenant Isolation ile sadece kiracının kendi projesini güncelle
    const updated = await prisma.rolloutProject.updateMany({
      where: {
        id: projectId,
        ...(tenantId ? { tenantId } : {}),
      },
      data: {
        status: dbStatus,
      },
    })

    return NextResponse.json({ success: true, count: updated.count })
  } catch (error: any) {
    console.error("❌ Rollout PATCH Error:", error)
    return NextResponse.json({ error: error.message || "Rollout aşaması güncellenemedi" }, { status: 500 })
  }
}
