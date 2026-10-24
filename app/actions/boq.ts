"use server"

/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Keşif & Metraj (BoQ) Server Actions: Otonom Kayıt, Dinamik Hesaplama & Lojistik Entegrasyonu
 */

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

export interface BoqRowData {
  id: string
  projectId: string
  pozNo: string
  description: string
  unit: string
  plannedQuantity: number
  unitPrice: number
  totalPrice: number
  actualQuantity: number
  requiredMaterialId: string | null
  requiredMaterial?: {
    id: string
    materialName: string
    name?: string | null
    qrCode: string
    quantity: number
    unit?: string | null
    currentZone: string
    status: string
  } | null
  createdAt: string
  updatedAt: string
}

export interface InventoryMaterialOption {
  id: string
  materialName: string
  name?: string | null
  qrCode: string
  quantity: number
  unit?: string | null
  currentZone: string
  status: string
}

export interface BoqPageData {
  project: {
    id: string
    name: string
    title?: string | null
    status: string | null
    contractValue?: number | null
    progress: number
    city?: string | null
    district?: string | null
  }
  items: BoqRowData[]
  materials: InventoryMaterialOption[]
  summary: {
    totalPlannedAmount: number
    totalActualAmount: number
    remainingAmount: number
    generalProgressPercent: number
    itemCount: number
  }
}

/**
 * 1. Proje BoQ Verilerini, Bağlı Malzemeleri ve Lojistik Stoğunu Çek
 */
export async function getProjectBoq(projectId: string): Promise<{ success: boolean; data?: BoqPageData; error?: string }> {
  try {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: {
        id: true,
        name: true,
        title: true,
        status: true,
        contractValue: true,
        progress: true,
        city: true,
        district: true,
      },
    })

    if (!project) {
      return { success: false, error: "Proje bulunamadı" }
    }

    // BoQ Kalemlerini çek
    const rawItems = await prisma.boqItem.findMany({
      where: { projectId },
      include: {
        requiredMaterial: {
          select: {
            id: true,
            materialName: true,
            name: true,
            qrCode: true,
            quantity: true,
            unit: true,
            currentZone: true,
            status: true,
          },
        },
      },
      orderBy: { pozNo: "asc" },
    })

    // Sistemdeki Lojistik Malzemelerini çek (Seçim menüsü için)
    const rawMaterials = await prisma.inventoryItem.findMany({
      where: {
        OR: [
          { projectId },
          { projectId: null },
        ],
      },
      select: {
        id: true,
        materialName: true,
        name: true,
        qrCode: true,
        quantity: true,
        unit: true,
        currentZone: true,
        status: true,
      },
      orderBy: { materialName: "asc" },
      take: 100,
    })

    // Hesaplamalar
    let totalPlannedAmount = 0
    let totalActualAmount = 0

    const items: BoqRowData[] = rawItems.map((item) => {
      const plannedQuantity = Number(item.plannedQuantity) || 0
      const unitPrice = Number(item.unitPrice) || 0
      const actualQuantity = Number(item.actualQuantity) || 0
      const calculatedTotalPrice = Number(item.totalPrice) > 0 ? Number(item.totalPrice) : Number((plannedQuantity * unitPrice).toFixed(2))

      const plannedRowTotal = plannedQuantity * unitPrice
      const actualRowTotal = Math.min(actualQuantity, plannedQuantity) * unitPrice

      totalPlannedAmount += plannedRowTotal
      totalActualAmount += actualRowTotal

      return {
        id: item.id,
        projectId: item.projectId,
        pozNo: item.pozNo,
        description: item.description,
        unit: item.unit,
        plannedQuantity,
        unitPrice,
        totalPrice: calculatedTotalPrice,
        actualQuantity,
        requiredMaterialId: item.requiredMaterialId,
        requiredMaterial: item.requiredMaterial ? {
          id: item.requiredMaterial.id,
          materialName: item.requiredMaterial.materialName || item.requiredMaterial.name || "İsimsiz Malzeme",
          name: item.requiredMaterial.name,
          qrCode: item.requiredMaterial.qrCode,
          quantity: item.requiredMaterial.quantity,
          unit: item.requiredMaterial.unit,
          currentZone: item.requiredMaterial.currentZone,
          status: item.requiredMaterial.status,
        } : null,
        createdAt: item.createdAt.toISOString(),
        updatedAt: item.updatedAt.toISOString(),
      }
    })

    const remainingAmount = Math.max(0, totalPlannedAmount - totalActualAmount)
    const generalProgressPercent = totalPlannedAmount > 0 
      ? Number(((totalActualAmount / totalPlannedAmount) * 100).toFixed(1)) 
      : 0

    const materials: InventoryMaterialOption[] = rawMaterials.map((m) => ({
      id: m.id,
      materialName: m.materialName || m.name || "Malzeme",
      name: m.name,
      qrCode: m.qrCode,
      quantity: m.quantity,
      unit: m.unit,
      currentZone: m.currentZone,
      status: m.status,
    }))

    return {
      success: true,
      data: {
        project: {
          id: project.id,
          name: project.name || project.title || "Şantiye Projesi",
          title: project.title,
          status: project.status,
          contractValue: project.contractValue,
          progress: project.progress || Math.round(generalProgressPercent),
          city: project.city,
          district: project.district,
        },
        items,
        materials,
        summary: {
          totalPlannedAmount,
          totalActualAmount,
          remainingAmount,
          generalProgressPercent,
          itemCount: items.length,
        },
      },
    }
  } catch (error: any) {
    console.error("getProjectBoq hatası:", error)
    return { success: false, error: error?.message || "BoQ verileri yüklenirken hata oluştu" }
  }
}

/**
 * 2. updateBoqItem - Satır Güncellemesi & Otonom Hakediş/Finans Senkronizasyonu
 * Kritik Kural: Birim fiyat veya miktar değiştiğinde totalPrice otonom hesaplanır,
 * proje ilerlemesi güncellenir ve Finans/Taşeron rotaları anında revalidatePath ile yenilenir.
 */
export async function updateBoqItem(
  id: string,
  projectId: string,
  data: {
    pozNo?: string
    description?: string
    unit?: string
    plannedQuantity?: number
    unitPrice?: number
    actualQuantity?: number
    requiredMaterialId?: string | null
  }
) {
  try {
    const existing = await prisma.boqItem.findUnique({
      where: { id },
    })

    if (!existing) {
      return { success: false, error: "İş kalemi bulunamadı" }
    }

    const plannedQuantity = data.plannedQuantity !== undefined ? Number(data.plannedQuantity) : existing.plannedQuantity
    const unitPrice = data.unitPrice !== undefined ? Number(data.unitPrice) : existing.unitPrice
    const actualQuantity = data.actualQuantity !== undefined ? Number(data.actualQuantity) : existing.actualQuantity
    const totalPrice = Number((plannedQuantity * unitPrice).toFixed(2))

    const updatePayload: any = {
      ...(data.pozNo !== undefined && { pozNo: data.pozNo.trim() }),
      ...(data.description !== undefined && { description: data.description.trim() }),
      ...(data.unit !== undefined && { unit: data.unit.trim() }),
      plannedQuantity,
      unitPrice,
      totalPrice,
      actualQuantity,
      ...(data.requiredMaterialId !== undefined && { requiredMaterialId: data.requiredMaterialId }),
      updatedAt: new Date(),
    }

    const updated = await prisma.boqItem.update({
      where: { id },
      data: updatePayload,
      include: {
        requiredMaterial: true,
      },
    })

    // Projenin genel ağırlıklı ilerlemesini otonom güncelle
    await recalculateProjectWeightedProgress(projectId)

    // Finans, Proje ve Taşeron Modüllerini Anında Revalidate Et
    revalidatePath(`/admin/projects/${projectId}/boq`)
    revalidatePath(`/admin/projects/${projectId}`)
    revalidatePath(`/admin/projects/${projectId}/progress`)
    revalidatePath("/admin/finance")
    revalidatePath("/subcontractor")

    return {
      success: true,
      data: {
        ...updated,
        createdAt: updated.createdAt.toISOString(),
        updatedAt: updated.updatedAt.toISOString(),
      },
    }
  } catch (error: any) {
    console.error("updateBoqItem hatası:", error)
    return { success: false, error: error?.message || "İş kalemi güncellenemedi" }
  }
}

/**
 * 3. createBoqItem - Yeni Kalem Ekleme (Hücre İçi veya Butonla)
 */
export async function createBoqItem(
  projectId: string,
  data: {
    pozNo: string
    description: string
    unit: string
    plannedQuantity: number
    unitPrice: number
    requiredMaterialId?: string | null
  }
) {
  try {
    const plannedQuantity = Number(data.plannedQuantity) || 0
    const unitPrice = Number(data.unitPrice) || 0
    const totalPrice = Number((plannedQuantity * unitPrice).toFixed(2))

    const newItem = await prisma.boqItem.create({
      data: {
        projectId,
        pozNo: data.pozNo.trim() || `P-${Date.now().toString().slice(-4)}`,
        description: data.description.trim() || "Yeni İş Kalemi",
        unit: data.unit.trim() || "m3",
        plannedQuantity,
        unitPrice,
        totalPrice,
        actualQuantity: 0,
        requiredMaterialId: data.requiredMaterialId || null,
      },
      include: {
        requiredMaterial: true,
      },
    })

    // Genel ağırlıklı ilerlemeyi güncelle
    await recalculateProjectWeightedProgress(projectId)

    // Finans & Proje ekranlarını anında güncelle
    revalidatePath(`/admin/projects/${projectId}/boq`)
    revalidatePath(`/admin/projects/${projectId}`)
    revalidatePath(`/admin/projects/${projectId}/progress`)
    revalidatePath("/admin/finance")
    revalidatePath("/subcontractor")

    return {
      success: true,
      data: {
        ...newItem,
        createdAt: newItem.createdAt.toISOString(),
        updatedAt: newItem.updatedAt.toISOString(),
      },
    }
  } catch (error: any) {
    console.error("createBoqItem hatası:", error)
    return { success: false, error: error?.message || "Yeni iş kalemi oluşturulamadı" }
  }
}

/**
 * 4. deleteBoqItem - İş Kalemi Silme
 */
export async function deleteBoqItem(id: string, projectId: string) {
  try {
    await prisma.boqItem.delete({
      where: { id },
    })

    await recalculateProjectWeightedProgress(projectId)

    revalidatePath(`/admin/projects/${projectId}/boq`)
    revalidatePath(`/admin/projects/${projectId}`)
    revalidatePath(`/admin/projects/${projectId}/progress`)
    revalidatePath("/admin/finance")
    revalidatePath("/subcontractor")

    return { success: true }
  } catch (error: any) {
    console.error("deleteBoqItem hatası:", error)
    return { success: false, error: error?.message || "İş kalemi silinemedi" }
  }
}

/**
 * 5. seedBoqTemplate - Boş Projeler İçin Hızlı Standart Poz Şablonu
 */
export async function seedBoqTemplate(projectId: string) {
  try {
    const existingCount = await prisma.boqItem.count({ where: { projectId } })
    if (existingCount > 0) {
      return { success: true, message: "Projeye ait iş kalemleri zaten mevcut." }
    }

    // Sistemdeki ilk 5 malzemeyi yakala ve pozlara eşle
    const materials = await prisma.inventoryItem.findMany({
      take: 5,
      select: { id: true, materialName: true, name: true },
    })

    const sampleItems = [
      {
        pozNo: "15.120.1001",
        description: "Temel & Grobeton C30/37 Hazır Beton İmalatı",
        unit: "m3",
        plannedQuantity: 450,
        unitPrice: 2850,
        actualQuantity: 180,
        materialIndex: 0,
      },
      {
        pozNo: "15.140.1003",
        description: "B420C Nervürlü Donatı Çeliği Temini ve İşçiliği",
        unit: "Ton",
        plannedQuantity: 65,
        unitPrice: 32500,
        actualQuantity: 28,
        materialIndex: 1,
      },
      {
        pozNo: "15.160.1005",
        description: "Plywood Kalıp Kurulumu ve İskele Güvenlik Ağı",
        unit: "m2",
        plannedQuantity: 1800,
        unitPrice: 420,
        actualQuantity: 950,
        materialIndex: 2,
      },
      {
        pozNo: "15.220.2001",
        description: "Dış Cephe Çift Kat Bitümlü Su ve Nem Yalıtımı",
        unit: "m2",
        plannedQuantity: 1200,
        unitPrice: 380,
        actualQuantity: 400,
        materialIndex: 3,
      },
      {
        pozNo: "15.310.1002",
        description: "20 cm Gazbeton Duvar Örülmesi ve Harç İmalatı",
        unit: "m2",
        plannedQuantity: 950,
        unitPrice: 650,
        actualQuantity: 150,
        materialIndex: 4,
      },
      {
        pozNo: "15.450.3001",
        description: "Kat Şapı Dökümü ve Helikopterli Perdah",
        unit: "m2",
        plannedQuantity: 1500,
        unitPrice: 210,
        actualQuantity: 0,
        materialIndex: -1,
      },
    ]

    for (const item of sampleItems) {
      const matId = item.materialIndex >= 0 && materials[item.materialIndex]
        ? materials[item.materialIndex].id
        : null

      const totalPrice = Number((item.plannedQuantity * item.unitPrice).toFixed(2))

      await prisma.boqItem.create({
        data: {
          projectId,
          pozNo: item.pozNo,
          description: item.description,
          unit: item.unit,
          plannedQuantity: item.plannedQuantity,
          unitPrice: item.unitPrice,
          totalPrice,
          actualQuantity: item.actualQuantity,
          requiredMaterialId: matId,
        },
      })
    }

    await recalculateProjectWeightedProgress(projectId)

    revalidatePath(`/admin/projects/${projectId}/boq`)
    revalidatePath(`/admin/projects/${projectId}`)
    revalidatePath(`/admin/projects/${projectId}/progress`)
    revalidatePath("/admin/finance")
    revalidatePath("/subcontractor")

    return { success: true, count: sampleItems.length }
  } catch (error: any) {
    console.error("seedBoqTemplate hatası:", error)
    return { success: false, error: error?.message || "Şablon yüklenirken hata oluştu" }
  }
}

/**
 * Yardımcı: Projenin Ağırlıklı İlerlemesini Hesaplayıp Kaydet
 */
async function recalculateProjectWeightedProgress(projectId: string) {
  try {
    const allItems = await prisma.boqItem.findMany({
      where: { projectId },
      select: {
        plannedQuantity: true,
        unitPrice: true,
        actualQuantity: true,
      },
    })

    let totalPlanned = 0
    let totalActual = 0

    allItems.forEach((it) => {
      const p = it.plannedQuantity * it.unitPrice
      const a = Math.min(it.actualQuantity, it.plannedQuantity) * it.unitPrice
      totalPlanned += p
      totalActual += a
    })

    const progress = totalPlanned > 0 ? Math.round((totalActual / totalPlanned) * 100) : 0

    await prisma.project.update({
      where: { id: projectId },
      data: { progress },
    })
  } catch (err) {
    console.error("recalculateProjectWeightedProgress hatası:", err)
  }
}
