"use server"
/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Federated Multi-Discipline BIM & Prisma Synchronization Server Actions
 */

import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { revalidatePath } from "next/cache"

export interface FederatedModelItem {
  id: string
  name: string
  url: string
  category: "mimari" | "statik" | "elektrik" | "mekanik" | "akustik" | string
  color: string
  visible: boolean
}

/**
 * Dosya adı veya kategoriye göre BIM disiplinini ve temasını tespit eder
 */
export async function detectDisciplineHelper(fileNameOrType: string): Promise<{ category: string; color: string }> {
  const lower = (fileNameOrType || "").toLowerCase()
  if (
    lower.includes("statik") ||
    lower.includes("struct") ||
    lower.includes("betonarme") ||
    lower.includes("celik") ||
    lower.includes("çelik")
  ) {
    return { category: "statik", color: "#3b82f6" }
  }
  if (
    lower.includes("elektrik") ||
    lower.includes("elec") ||
    lower.includes("zayif") ||
    lower.includes("kuvvetli") ||
    lower.includes("pano")
  ) {
    return { category: "elektrik", color: "#eab308" }
  }
  if (
    lower.includes("mekanik") ||
    lower.includes("mep") ||
    lower.includes("hvac") ||
    lower.includes("tesisat") ||
    lower.includes("havalandirma") ||
    lower.includes("boru") ||
    lower.includes("chiller")
  ) {
    return { category: "mekanik", color: "#06b6d4" }
  }
  if (
    lower.includes("akustik") ||
    lower.includes("yalitim") ||
    lower.includes("izolasyon") ||
    lower.includes("sound")
  ) {
    return { category: "akustik", color: "#a855f7" }
  }
  // Varsayılan Mimari
  return { category: "mimari", color: "#f97316" }
}

/**
 * ADIM 1: Veritabanındaki (Prisma) gerçek IFC ve BIM modellerini çeker
 * Mock ve hardcoded dosyalar yerine doğrudan projenin gerçek modellerini döner.
 */
export async function getProjectFederatedBimModels(projectId: string): Promise<FederatedModelItem[]> {
  try {
    if (!projectId) return []

    // 1. BimFile tablosundaki kayıtlı modeller
    const bimFiles = await prisma.bimFile.findMany({
      where: { projectId },
      orderBy: { uploadedAt: "asc" },
    })

    // 2. ProjectDocument tablosundaki IFC / 3D paftalar
    const projectDocs = await prisma.projectDocument.findMany({
      where: {
        projectId,
        OR: [
          { fileUrl: { contains: ".ifc", mode: "insensitive" } },
          { fileUrl: { contains: ".glb", mode: "insensitive" } },
          { fileUrl: { contains: ".gltf", mode: "insensitive" } },
        ],
      },
      orderBy: { createdAt: "asc" },
    })

    // 3. Proje ana tablosundaki modeller
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { bimModelUrl: true, ifcModelUrl: true, title: true, name: true },
    })

    const models: FederatedModelItem[] = []
    const seenUrls = new Set<string>()

    // BimFiles ekle
    for (const file of bimFiles) {
      if (file.fileUrl && !seenUrls.has(file.fileUrl)) {
        seenUrls.add(file.fileUrl)
        const disc = await detectDisciplineHelper(file.fileName || file.fileType || "")
        models.push({
          id: file.id,
          name: file.fileName || "BIM Modeli",
          url: file.fileUrl,
          category: disc.category,
          color: disc.color,
          visible: true,
        })
      }
    }

    // ProjectDocuments ekle
    for (const doc of projectDocs) {
      if (doc.fileUrl && !seenUrls.has(doc.fileUrl)) {
        seenUrls.add(doc.fileUrl)
        const disc = await detectDisciplineHelper(doc.title || doc.type || "")
        models.push({
          id: doc.id,
          name: doc.title || "Proje Paftası",
          url: doc.fileUrl,
          category: disc.category,
          color: disc.color,
          visible: true,
        })
      }
    }

    // Ana Proje IFC veya BIM URL'si varsa ekle
    if (project?.ifcModelUrl && !seenUrls.has(project.ifcModelUrl)) {
      seenUrls.add(project.ifcModelUrl)
      const disc = await detectDisciplineHelper(project.title || "IFC")
      models.push({
        id: "proj-ifc-primary",
        name: `${project.title || project.name || "Proje"} (Ana IFC Modeli)`,
        url: project.ifcModelUrl,
        category: disc.category,
        color: disc.color,
        visible: true,
      })
    } else if (project?.bimModelUrl && !seenUrls.has(project.bimModelUrl)) {
      seenUrls.add(project.bimModelUrl)
      const disc = await detectDisciplineHelper(project.title || "BIM")
      models.push({
        id: "proj-bim-primary",
        name: `${project.title || project.name || "Proje"} (Ana BIM Modeli)`,
        url: project.bimModelUrl,
        category: disc.category,
        color: disc.color,
        visible: true,
      })
    }

    return models
  } catch (error) {
    console.error("[getProjectFederatedBimModels Error]:", error)
    return []
  }
}

/**
 * Saha Personelinin atandığı şantiyeyi ve o şantiyenin gerçek BIM modellerini getirir
 */
export async function getPersonnelAssignedBim(userId?: string, userEmail?: string) {
  try {
    let personnel = null
    if (userId) {
      personnel = await prisma.personel.findUnique({
        where: { userId },
        include: { project: true },
      })
    }

    if (!personnel && userEmail) {
      personnel = await prisma.personel.findFirst({
        where: { email: userEmail },
        include: { project: true },
      })
    }

    const project = personnel?.project
    const projectId = personnel?.projectId || project?.id

    if (!projectId || !project) {
      return {
        success: false,
        error: "Atanmış şantiye bulunamadı",
        project: null,
        models: [],
      }
    }

    const models = await getProjectFederatedBimModels(projectId)

    return {
      success: true,
      project: {
        id: project.id,
        name: project.name || project.title,
        title: project.title || project.name,
        city: project.city,
        district: project.district,
        yibfNo: project.yibfNo,
      },
      models,
    }
  } catch (error: any) {
    console.error("[getPersonnelAssignedBim Error]:", error)
    return {
      success: false,
      error: error?.message || "Saha BIM verileri yüklenirken hata oluştu",
      project: null,
      models: [],
    }
  }
}

/**
 * Yeni bir disiplin modeli yükleyip Prisma BimFile tablosuna kaydeder
 */
export async function uploadDisciplineBimModel(input: {
  projectId: string
  name: string
  url: string
  discipline: string
}) {
  try {
    const session = await auth()
    const tenantId = (session?.user as any)?.tenantId

    const ext = input.name.split(".").pop()?.toLowerCase() || "ifc"

    const newBimFile = await prisma.bimFile.create({
      data: {
        projectId: input.projectId,
        fileName: input.name,
        fileUrl: input.url,
        fileType: ext,
        isActive: true,
        tenantId: tenantId || null,
      },
    })

    revalidatePath(`/admin/projects/${input.projectId}`)
    revalidatePath(`/admin/projects/${input.projectId}/bim`)
    revalidatePath(`/personnel/bim-viewer`)
    revalidatePath(`/personnel/bim`)

    return {
      success: true,
      model: newBimFile,
      message: `${input.name} modeli (${input.discipline}) veritabanına kaydedildi.`,
    }
  } catch (error: any) {
    console.error("[uploadDisciplineBimModel Error]:", error)
    return {
      success: false,
      error: error?.message || "Model kaydedilemedi",
    }
  }
}

