/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Franchise & Rollout Server Actions with 100% Strict Tenant Isolation
 */

"use server"

import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { revalidatePath } from "next/cache"

// Türkiye şehir koordinatları tablosu
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

export function resolveCityCoords(city: string): { lat: number; lng: number } {
  const norm = (city || "").trim().toUpperCase()
  return CITY_COORDS[norm] || { lat: 39.0, lng: 35.0 }
}

/**
 * Helper: Güvenli ve zorunlu Tenant ID alımı (Strict Multi-Tenant Isolation)
 */
export async function getFranchiseTenantId(): Promise<string> {
  const session = await auth()
  if (!session?.user) {
    throw new Error("Yetkisiz erişim: Oturum açmanız gerekiyor.")
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
    const firstTenant = await prisma.tenant.findFirst({
      where: { isActive: true },
      select: { id: true },
    })
    tenantId = firstTenant?.id
  }

  if (!tenantId) {
    throw new Error("Firma/Kiracı (Tenant) bilgisi bulunamadı.")
  }

  return tenantId
}

// ============================================================================
// 1. ROLLOUT PROJECTS (Mağaza Kurulum Projeleri)
// ============================================================================

export async function getRolloutProjects() {
  try {
    const tenantId = await getFranchiseTenantId()

    const projects = await prisma.rolloutProject.findMany({
      where: { tenantId },
      include: {
        stageGates: {
          orderBy: { createdAt: "asc" },
        },
        expenses: {
          orderBy: { createdAt: "desc" },
        },
        workProofs: {
          orderBy: { createdAt: "desc" },
        },
      },
      orderBy: { createdAt: "desc" },
    })

    return { success: true, projects }
  } catch (error: any) {
    console.error("❌ getRolloutProjects Error:", error)
    return { success: false, error: error.message || "Projeler yüklenemedi", projects: [] }
  }
}

export async function getRolloutProjectById(id: string) {
  try {
    const tenantId = await getFranchiseTenantId()

    const project = await prisma.rolloutProject.findFirst({
      where: {
        id,
        tenantId,
      },
      include: {
        stageGates: {
          orderBy: { createdAt: "asc" },
        },
        expenses: {
          orderBy: { createdAt: "desc" },
        },
        workProofs: {
          orderBy: { createdAt: "desc" },
        },
      },
    })

    if (!project) {
      return { success: false, error: "Mağaza projesi bulunamadı." }
    }

    return { success: true, project }
  } catch (error: any) {
    console.error("❌ getRolloutProjectById Error:", error)
    return { success: false, error: error.message || "Proje yüklenemedi." }
  }
}

export async function createRolloutProject(data: {
  name: string
  city: string
  locationType?: string // "STREET" | "MALL" | "KIOSK"
  budget?: number | null
  totalBudget?: number | null
  lat?: number | null
  lng?: number | null
  status?: string
  regionalManagerId?: string | null
  branchManagerId?: string | null
}) {
  try {
    const tenantId = await getFranchiseTenantId()

    if (!data.name?.trim()) {
      return { success: false, error: "Mağaza adı zorunludur." }
    }
    if (!data.city?.trim()) {
      return { success: false, error: "Şehir bilgisi zorunludur." }
    }

    // Koordinatları çözümle veya kullanıcının sağladığı koordinatı kullan
    let lat = data.lat
    let lng = data.lng
    if (!lat || !lng) {
      const coords = resolveCityCoords(data.city)
      lat = coords.lat
      lng = coords.lng
    }

    const budgetVal = data.totalBudget ?? data.budget ?? 0
    const locationType = (data.locationType || "STREET").toUpperCase()

    // Lokasyon tipine göre dinamik Stage-Gate kapıları
    let locationGates: { name: string; stageName: string }[] = []
    if (locationType === "MALL") {
      locationGates = [
        { name: "AVM Yönetimi Dekorasyon Onayı", stageName: "LOKASYON_ONAYI" },
        { name: "AVM Gece Çalışma İzni", stageName: "LOKASYON_ONAYI" },
      ]
    } else if (locationType === "KIOSK") {
      locationGates = [
        { name: "Kiosk Yerleşim & AVM/Alan İzni", stageName: "LOKASYON_ONAYI" },
        { name: "Elektrik & Altyapı Bağlantı Onayı", stageName: "LOKASYON_ONAYI" },
      ]
    } else {
      // STREET (Cadde / Bağımsız Dükkan)
      locationGates = [
        { name: "Belediye Tadilat Ruhsatı", stageName: "LOKASYON_ONAYI" },
        { name: "Belediye Tabela İzni", stageName: "LOKASYON_ONAYI" },
      ]
    }

    const initialGates = [
      {
        name: "Kiralama & Kira Sözleşmesi",
        stageName: "KİRALAMA",
        status: "BEKLIYOR",
        isRequired: true,
        isApproved: false,
        tenantId,
      },
      ...locationGates.map((gate) => ({
        name: gate.name,
        stageName: gate.stageName,
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
        name: "Punch List & QA Denetim Onayı",
        stageName: "PUNCH_LIST",
        status: "BEKLIYOR",
        isRequired: true,
        isApproved: false,
        tenantId,
      },
      {
        name: "İtfaiye Ruhsatı & Nihai Açılış İzni",
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
        name: data.name.trim(),
        city: data.city.trim(),
        locationType,
        lat,
        lng,
        totalBudget: Number(budgetVal),
        budget: Number(budgetVal),
        status: data.status || "KIRALAMA",
        regionalManagerId: data.regionalManagerId || null,
        branchManagerId: data.branchManagerId || null,
        stageGates: {
          create: initialGates,
        },
      },
      include: {
        stageGates: true,
      },
    })

    revalidatePath("/franchise/rollout")
    revalidatePath("/franchise/stage-gates")
    revalidatePath("/franchise/rollout-map")

    return { success: true, project }
  } catch (error: any) {
    console.error("❌ createRolloutProject Error:", error)
    return { success: false, error: error.message || "Mağaza projesi oluşturulamadı." }
  }
}

export async function updateRolloutProjectStatus(id: string, status: string) {
  try {
    const tenantId = await getFranchiseTenantId()

    const updated = await prisma.rolloutProject.updateMany({
      where: {
        id,
        tenantId,
      },
      data: {
        status,
      },
    })

    if (updated.count === 0) {
      return { success: false, error: "Güncellenecek proje bulunamadı veya yetkiniz yok." }
    }

    revalidatePath("/franchise/rollout")
    revalidatePath("/franchise/stage-gates")
    revalidatePath("/franchise/rollout-map")

    return { success: true }
  } catch (error: any) {
    console.error("❌ updateRolloutProjectStatus Error:", error)
    return { success: false, error: error.message || "Aşama güncellenemedi." }
  }
}

// ============================================================================
// 2. STAGE-GATE (İdari İzinler ve Kilitler)
// ============================================================================

export async function updateStageGateApproval(gateId: string, status: string) {
  try {
    const isApproved = status === "ONAYLANDI"

    const updated = await prisma.stageGate.update({
      where: { id: gateId },
      data: {
        status,
        isApproved,
        approvedAt: isApproved ? new Date() : null,
      },
    })

    revalidatePath("/franchise/stage-gates")
    revalidatePath("/franchise/rollout")
    revalidatePath("/franchise/rollout-map")

    return { success: true, gate: updated }
  } catch (error: any) {
    console.error("❌ updateStageGateApproval Error:", error)
    return { success: false, error: error.message || "Stage-Gate onay durumu güncellenemedi." }
  }
}

// ============================================================================
// 3. CONSOLIDATED TENDER (Konsolide Satınalma İhaleleri)
// ============================================================================

export async function getConsolidatedTenders() {
  try {
    const tenantId = await getFranchiseTenantId()

    const tenders = await prisma.consolidatedTender.findMany({
      where: { tenantId },
      orderBy: { createdAt: "desc" },
    })

    return { success: true, tenders }
  } catch (error: any) {
    console.error("❌ getConsolidatedTenders Error:", error)
    return { success: false, error: error.message || "İhaleler yüklenemedi", tenders: [] }
  }
}

export async function createConsolidatedTender(title: string) {
  try {
    const tenantId = await getFranchiseTenantId()

    if (!title?.trim()) {
      return { success: false, error: "İhale paketi başlığı zorunludur." }
    }

    const tender = await prisma.consolidatedTender.create({
      data: {
        tenantId,
        title: title.trim(),
        status: "ACTIVE",
      },
    })

    revalidatePath("/franchise/procurement/consolidated")

    return { success: true, tender }
  } catch (error: any) {
    console.error("❌ createConsolidatedTender Error:", error)
    return { success: false, error: error.message || "İhale paketi oluşturulamadı." }
  }
}

export async function updateConsolidatedTenderStatus(id: string, status: string) {
  try {
    const tenantId = await getFranchiseTenantId()

    const updated = await prisma.consolidatedTender.updateMany({
      where: {
        id,
        tenantId,
      },
      data: {
        status,
      },
    })

    if (updated.count === 0) {
      return { success: false, error: "İhale bulunamadı veya yetkiniz yok." }
    }

    revalidatePath("/franchise/procurement/consolidated")

    return { success: true }
  } catch (error: any) {
    console.error("❌ updateConsolidatedTenderStatus Error:", error)
    return { success: false, error: error.message || "İhale durumu güncellenemedi." }
  }
}

// ============================================================================
// 4. RMA REQUEST (Hasarlı Teslimat / Kusur Kayıtları)
// ============================================================================

export async function getRmaRequests(status?: string) {
  try {
    const tenantId = await getFranchiseTenantId()

    const where: any = { tenantId }
    if (status && status !== "ALL") {
      where.status = status
    }

    const rmaRequests = await prisma.rmaRequest.findMany({
      where,
      orderBy: { createdAt: "desc" },
    })

    return { success: true, rmaRequests }
  } catch (error: any) {
    console.error("❌ getRmaRequests Error:", error)
    return { success: false, error: error.message || "RMA kayıtları yüklenemedi", rmaRequests: [] }
  }
}

export async function createRmaRequest(data: {
  storeName: string
  itemName: string
  status?: string
}) {
  try {
    const tenantId = await getFranchiseTenantId()

    if (!data.storeName?.trim()) {
      return { success: false, error: "Mağaza / Şantiye adı zorunludur." }
    }
    if (!data.itemName?.trim()) {
      return { success: false, error: "Kusurlu / hasarlı ürün adı zorunludur." }
    }

    const rma = await prisma.rmaRequest.create({
      data: {
        tenantId,
        storeName: data.storeName.trim(),
        itemName: data.itemName.trim(),
        status: data.status || "REPORTED",
      },
    })

    revalidatePath("/franchise/logistics/rma")

    return { success: true, rma }
  } catch (error: any) {
    console.error("❌ createRmaRequest Error:", error)
    return { success: false, error: error.message || "RMA kaydı oluşturulamadı." }
  }
}

export async function updateRmaRequestStatus(id: string, status: string) {
  try {
    const tenantId = await getFranchiseTenantId()

    const updated = await prisma.rmaRequest.updateMany({
      where: {
        id,
        tenantId,
      },
      data: {
        status,
      },
    })

    if (updated.count === 0) {
      return { success: false, error: "RMA kaydı bulunamadı veya yetkiniz yok." }
    }

    revalidatePath("/franchise/logistics/rma")

    return { success: true }
  } catch (error: any) {
    console.error("❌ updateRmaRequestStatus Error:", error)
    return { success: false, error: error.message || "RMA durumu güncellenemedi." }
  }
}

// ============================================================================
// 5. ROLLOUT EXPENSES (Şube Kurulum Giderleri & Bütçe Takibi)
// ============================================================================

export async function getRolloutExpenses(rolloutProjectId: string) {
  try {
    const tenantId = await getFranchiseTenantId()

    // Verify project belongs to tenant
    const project = await prisma.rolloutProject.findFirst({
      where: { id: rolloutProjectId, tenantId },
      select: { id: true, totalBudget: true, budget: true, name: true },
    })

    if (!project) {
      return { success: false, error: "Proje bulunamadı veya yetkiniz yok.", expenses: [] }
    }

    const expenses = await prisma.rolloutExpense.findMany({
      where: { rolloutProjectId },
      orderBy: { createdAt: "desc" },
    })

    const totalSpent = expenses.reduce((sum, item) => sum + item.amount, 0)
    const budget = project.totalBudget || project.budget || 0
    const remaining = budget - totalSpent

    return {
      success: true,
      expenses,
      summary: {
        totalBudget: budget,
        totalSpent,
        remaining,
        burnPercentage: budget > 0 ? Math.min(100, Math.round((totalSpent / budget) * 100)) : 0,
      },
    }
  } catch (error: any) {
    console.error("❌ getRolloutExpenses Error:", error)
    return { success: false, error: error.message || "Giderler yüklenemedi", expenses: [] }
  }
}

export async function createRolloutExpense(data: {
  rolloutProjectId: string
  title: string
  amount: number
  category: string // INSAAT, MOBILYA, IT_DONANIM, RESMI_HARC
  receiptUrl?: string | null
}) {
  try {
    const tenantId = await getFranchiseTenantId()

    // Project check
    const project = await prisma.rolloutProject.findFirst({
      where: { id: data.rolloutProjectId, tenantId },
    })
    if (!project) {
      return { success: false, error: "Mağaza projesi bulunamadı." }
    }

    if (!data.title?.trim()) {
      return { success: false, error: "Harcama başlığı zorunludur." }
    }
    if (!data.amount || data.amount <= 0) {
      return { success: false, error: "Geçerli bir harcama tutarı giriniz." }
    }

    const expense = await prisma.rolloutExpense.create({
      data: {
        rolloutProjectId: data.rolloutProjectId,
        title: data.title.trim(),
        amount: Number(data.amount),
        category: data.category || "INSAAT",
        receiptUrl: data.receiptUrl || null,
      },
    })

    revalidatePath(`/franchise/rollout/${data.rolloutProjectId}`)
    revalidatePath("/franchise/rollout")

    return { success: true, expense }
  } catch (error: any) {
    console.error("❌ createRolloutExpense Error:", error)
    return { success: false, error: error.message || "Gider kaydı eklenemedi." }
  }
}

export async function deleteRolloutExpense(id: string) {
  try {
    const tenantId = await getFranchiseTenantId()

    const expense = await prisma.rolloutExpense.findUnique({
      where: { id },
      include: { project: true },
    })

    if (!expense || expense.project.tenantId !== tenantId) {
      return { success: false, error: "Gider kaydı bulunamadı veya yetkiniz yok." }
    }

    await prisma.rolloutExpense.delete({ where: { id } })

    revalidatePath(`/franchise/rollout/${expense.rolloutProjectId}`)
    return { success: true }
  } catch (error: any) {
    console.error("❌ deleteRolloutExpense Error:", error)
    return { success: false, error: error.message || "Gider silinemedi." }
  }
}

// ============================================================================
// 6. WORK PROOFS (Taşeron İş Kanıtı ve Çift Onay Akışı)
// ============================================================================

export async function getRolloutWorkProofs(rolloutProjectId: string) {
  try {
    const tenantId = await getFranchiseTenantId()

    const project = await prisma.rolloutProject.findFirst({
      where: { id: rolloutProjectId, tenantId },
    })
    if (!project) {
      return { success: false, error: "Proje bulunamadı.", workProofs: [] }
    }

    const workProofs = await prisma.rolloutWorkProof.findMany({
      where: { rolloutProjectId },
      orderBy: { createdAt: "desc" },
    })

    return { success: true, workProofs }
  } catch (error: any) {
    console.error("❌ getRolloutWorkProofs Error:", error)
    return { success: false, error: error.message || "İş kanıtları yüklenemedi", workProofs: [] }
  }
}

export async function createRolloutWorkProof(data: {
  rolloutProjectId: string
  subcontractorId?: string
  title: string
  photoUrl: string
}) {
  try {
    const tenantId = await getFranchiseTenantId()

    const project = await prisma.rolloutProject.findFirst({
      where: { id: data.rolloutProjectId, tenantId },
    })
    if (!project) {
      return { success: false, error: "Proje bulunamadı." }
    }

    if (!data.title?.trim()) {
      return { success: false, error: "İş başlığı zorunludur." }
    }
    if (!data.photoUrl?.trim()) {
      return { success: false, error: "Kanıt fotoğrafı zorunludur." }
    }

    const proof = await prisma.rolloutWorkProof.create({
      data: {
        rolloutProjectId: data.rolloutProjectId,
        subcontractorId: data.subcontractorId || "SUB_DEFAULT",
        title: data.title.trim(),
        photoUrl: data.photoUrl.trim(),
        status: "PENDING",
      },
    })

    revalidatePath(`/franchise/rollout/${data.rolloutProjectId}/work-proofs`)
    revalidatePath(`/franchise/rollout/${data.rolloutProjectId}`)

    return { success: true, proof }
  } catch (error: any) {
    console.error("❌ createRolloutWorkProof Error:", error)
    return { success: false, error: error.message || "İş kanıtı eklenemedi." }
  }
}

export async function approveRegionalWorkProof(id: string, notes?: string) {
  try {
    const tenantId = await getFranchiseTenantId()

    const proof = await prisma.rolloutWorkProof.findUnique({
      where: { id },
      include: { project: true },
    })

    if (!proof || proof.project.tenantId !== tenantId) {
      return { success: false, error: "İş kanıtı bulunamadı veya yetkiniz yok." }
    }

    const updated = await prisma.rolloutWorkProof.update({
      where: { id },
      data: {
        status: "REGIONAL_APPROVED",
        regionalNotes: notes || "Bölge Müdürü tarafından sahada incelendi ve onaylandı.",
      },
    })

    revalidatePath(`/franchise/rollout/${proof.rolloutProjectId}/work-proofs`)
    revalidatePath(`/franchise/rollout/${proof.rolloutProjectId}`)

    return { success: true, proof: updated }
  } catch (error: any) {
    console.error("❌ approveRegionalWorkProof Error:", error)
    return { success: false, error: error.message || "Bölge onayı verilemedi." }
  }
}

export async function approveHqWorkProof(id: string, notes?: string) {
  try {
    const tenantId = await getFranchiseTenantId()

    const proof = await prisma.rolloutWorkProof.findUnique({
      where: { id },
      include: { project: true },
    })

    if (!proof || proof.project.tenantId !== tenantId) {
      return { success: false, error: "İş kanıtı bulunamadı veya yetkiniz yok." }
    }

    const updated = await prisma.rolloutWorkProof.update({
      where: { id },
      data: {
        status: "HQ_APPROVED",
        hqNotes: notes || "Genel Merkez (HQ) teknik incelemesi onaylandı. Hakedişe hazır.",
      },
    })

    revalidatePath(`/franchise/rollout/${proof.rolloutProjectId}/work-proofs`)
    revalidatePath(`/franchise/rollout/${proof.rolloutProjectId}`)

    return { success: true, proof: updated }
  } catch (error: any) {
    console.error("❌ approveHqWorkProof Error:", error)
    return { success: false, error: error.message || "Genel Merkez onayı verilemedi." }
  }
}

export async function rejectWorkProof(id: string, notes?: string) {
  try {
    const tenantId = await getFranchiseTenantId()

    const proof = await prisma.rolloutWorkProof.findUnique({
      where: { id },
      include: { project: true },
    })

    if (!proof || proof.project.tenantId !== tenantId) {
      return { success: false, error: "İş kanıtı bulunamadı veya yetkiniz yok." }
    }

    const updated = await prisma.rolloutWorkProof.update({
      where: { id },
      data: {
        status: "REJECTED",
        hqNotes: notes || "İş kanıtı standartlara uygun bulunmadı, revizyon talep edildi.",
      },
    })

    revalidatePath(`/franchise/rollout/${proof.rolloutProjectId}/work-proofs`)
    revalidatePath(`/franchise/rollout/${proof.rolloutProjectId}`)

    return { success: true, proof: updated }
  } catch (error: any) {
    console.error("❌ rejectWorkProof Error:", error)
    return { success: false, error: error.message || "İş kanıtı reddedilemedi." }
  }
}

// ============================================================================
// 7. CONCEPT TEMPLATES (Tip Mağaza / Konsept Şablonları)
// ============================================================================

export async function getConceptTemplates() {
  try {
    const tenantId = await getFranchiseTenantId()

    const templates = await prisma.conceptTemplate.findMany({
      where: { tenantId },
      orderBy: { createdAt: "desc" },
    })

    return { success: true, templates }
  } catch (error: any) {
    console.error("❌ getConceptTemplates Error:", error)
    return { success: false, error: error.message || "Konsept şablonları yüklenemedi", templates: [] }
  }
}

export async function createConceptTemplate(data: {
  name: string
  baseBudget: number
  phasesJson?: any
}) {
  try {
    const tenantId = await getFranchiseTenantId()

    if (!data.name?.trim()) {
      return { success: false, error: "Şablon adı zorunludur." }
    }
    if (!data.baseBudget || data.baseBudget <= 0) {
      return { success: false, error: "Geçerli bir taban bütçe giriniz." }
    }

    const defaultPhases = [
      { name: "Kiralama & Alan Teslimi", days: 10, weight: 15 },
      { name: "AVM & Mimari Proje Onayı", days: 12, weight: 20 },
      { name: "Kaba & İnce İnşaat Montajı", days: 20, weight: 40 },
      { name: "Punch List & Kalite Denetimi", days: 5, weight: 15 },
      { name: "İtfaiye Ruhsatı & Açılış İzni", days: 3, weight: 10 },
    ]

    const template = await prisma.conceptTemplate.create({
      data: {
        tenantId,
        name: data.name.trim(),
        baseBudget: Number(data.baseBudget),
        phasesJson: data.phasesJson || defaultPhases,
        isActive: true,
      },
    })

    revalidatePath("/franchise/templates")
    revalidatePath("/franchise/rollout")

    return { success: true, template }
  } catch (error: any) {
    console.error("❌ createConceptTemplate Error:", error)
    return { success: false, error: error.message || "Konsept şablonu oluşturulamadı." }
  }
}

export async function toggleConceptTemplate(id: string) {
  try {
    const tenantId = await getFranchiseTenantId()

    const tpl = await prisma.conceptTemplate.findFirst({
      where: { id, tenantId },
    })
    if (!tpl) {
      return { success: false, error: "Şablon bulunamadı." }
    }

    const updated = await prisma.conceptTemplate.update({
      where: { id },
      data: { isActive: !tpl.isActive },
    })

    revalidatePath("/franchise/templates")
    return { success: true, template: updated }
  } catch (error: any) {
    console.error("❌ toggleConceptTemplate Error:", error)
    return { success: false, error: error.message || "Şablon durumu güncellenemedi." }
  }
}
