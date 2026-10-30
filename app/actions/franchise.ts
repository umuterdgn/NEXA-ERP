/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Franchise & Rollout Server Actions with 100% Strict Tenant Isolation
 */

"use server"

import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { revalidatePath } from "next/cache"

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
    // SuperAdmin fallback veya ilk aktif tenant
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
      },
      orderBy: { createdAt: "desc" },
    })

    return { success: true, projects }
  } catch (error: any) {
    console.error("❌ getRolloutProjects Error:", error)
    return { success: false, error: error.message || "Projeler yüklenemedi", projects: [] }
  }
}

export async function createRolloutProject(data: {
  name: string
  city: string
  budget?: number | null
  status?: string
}) {
  try {
    const tenantId = await getFranchiseTenantId()

    if (!data.name?.trim()) {
      return { success: false, error: "Mağaza adı zorunludur." }
    }
    if (!data.city?.trim()) {
      return { success: false, error: "Şehir bilgisi zorunludur." }
    }

    const project = await prisma.rolloutProject.create({
      data: {
        tenantId,
        name: data.name.trim(),
        city: data.city.trim(),
        budget: data.budget ? Number(data.budget) : null,
        status: data.status || "KIRALAMA",
        stageGates: {
          create: [
            {
              name: "Kiralama & Kira Sözleşmesi",
              stageName: "KİRALAMA",
              status: "BEKLIYOR",
              isRequired: true,
              isApproved: false,
              tenantId,
            },
            {
              name: "AVM Dekorasyon & Mimari Onay",
              stageName: "AVM_ONAYI",
              status: "BEKLIYOR",
              isRequired: true,
              isApproved: false,
              tenantId,
            },
            {
              name: "Kaba & İnce İnşaat Uygulama Onayı",
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
          ],
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
