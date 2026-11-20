/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * This code is the property of NXA Software.
 */

"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

const SUPPORTED_3D_EXTENSIONS = ["ifc", "gltf", "glb"]
const SUPPORTED_2D_EXTRUSION_EXTENSIONS = ["pdf", "dwg", "dxf"]
const ALLOWED_VIEWER_EXTENSIONS = [...SUPPORTED_3D_EXTENSIONS, ...SUPPORTED_2D_EXTRUSION_EXTENSIONS]

function is3DModelRecord(fileUrl?: string | null, fileName?: string | null, fileType?: string | null): boolean {
  const extFromType = (fileType || "").toLowerCase().replace(/^\./, "").trim()
  if (extFromType) {
    return SUPPORTED_3D_EXTENSIONS.includes(extFromType)
  }

  const extFromName = (fileName || "").split("?")[0].split("#")[0].split(".").pop()?.toLowerCase().trim() || ""
  if (extFromName && (fileName || "").includes(".")) {
    return SUPPORTED_3D_EXTENSIONS.includes(extFromName)
  }

  const cleanUrl = (fileUrl || "").split("?")[0].split("#")[0].toLowerCase().trim()
  return SUPPORTED_3D_EXTENSIONS.some((ext) => cleanUrl.endsWith(`.${ext}`))
}

function isAllowedViewerFileRecord(fileUrl?: string | null, fileName?: string | null, fileType?: string | null): boolean {
  const extFromType = (fileType || "").toLowerCase().replace(/^\./, "").trim()
  if (extFromType) {
    return ALLOWED_VIEWER_EXTENSIONS.includes(extFromType)
  }

  const extFromName = (fileName || "").split("?")[0].split("#")[0].split(".").pop()?.toLowerCase().trim() || ""
  if (extFromName && (fileName || "").includes(".")) {
    return ALLOWED_VIEWER_EXTENSIONS.includes(extFromName)
  }

  const cleanUrl = (fileUrl || "").split("?")[0].split("#")[0].toLowerCase().trim()
  if (ALLOWED_VIEWER_EXTENSIONS.some((ext) => cleanUrl.endsWith(`.${ext}`))) {
    return true
  }
  // UploadThing URLs without file extension in path
  return Boolean(cleanUrl)
}

export async function updateProjectBimModel(projectId: string, modelUrl: string) {
  try {
    if (!isAllowedViewerFileRecord(modelUrl)) {
      return {
        success: false,
        error: "Bu dosya bir 3D model değildir. Lütfen .ifc, .gltf veya .glb uzantılı bir dosya seçin.",
      }
    }

    await prisma.project.update({
      where: { id: projectId },
      data: {
        bimModelUrl: modelUrl,
        ifcModelUrl: modelUrl,
      },
    })

    revalidatePath(`/admin/projects/${projectId}`)
    return { success: true, url: modelUrl }
  } catch (error) {
    console.error("Failed to update project BIM model:", error)
    return { success: false, error: "Failed to update project" }
  }
}

export async function addBimFile(projectId: string, url: string, name: string) {
  try {
    if (!url || url.startsWith("blob:")) {
      throw new Error("Geçici blob URL'leri veritabanına kaydedilemez. Lütfen kalıcı bir dosya yükleyin.")
    }

    const ext = name.split(".").pop()?.toLowerCase() || "ifc"
    const is3D = SUPPORTED_3D_EXTENSIONS.includes(ext) || is3DModelRecord(url, name, ext)

    if (!is3D) {
      // 3D olmayan dosyaları (örn. PDF) ProjectDocument olarak kaydet, 3D BIM modelini bozma
      const doc = await prisma.projectDocument.create({
        data: {
          projectId,
          title: name,
          type: "BLUEPRINT",
          fileUrl: url,
          revision: 0,
          status: "ACTIVE",
        },
      })
      revalidatePath(`/admin/projects/${projectId}`)
      return {
        id: doc.id,
        projectId,
        fileUrl: url,
        fileName: name,
        fileType: ext,
        isActive: false,
        uploadedAt: doc.createdAt,
      }
    }

    // Önce aynı projedeki diğer 3D modelleri pasif yap
    await prisma.bimFile.updateMany({ where: { projectId }, data: { isActive: false } })

    // Yeni 3D modeli aktif olarak kaydet
    const newFile = await prisma.bimFile.create({
      data: { projectId, fileUrl: url, fileName: name, fileType: ext, isActive: true },
    })

    await prisma.project
      .update({
        where: { id: projectId },
        data: {
          bimModelUrl: url,
          ifcModelUrl: url,
        },
      })
      .catch(() => null)

    revalidatePath(`/admin/projects/${projectId}`)
    return newFile
  } catch (error) {
    console.error("addBimFile hatası:", error)
    throw error
  }
}

export async function addBimFileToProject(
  projectId: string,
  fileData: { fileName: string; fileUrl: string; fileType?: string | null }
) {
  try {
    if (!fileData?.fileUrl || fileData.fileUrl.startsWith("blob:")) {
      return {
        success: false,
        error: "Geçici blob URL'leri veritabanına kaydedilemez. Lütfen kalıcı bir dosya yükleyin.",
      }
    }

    const extension = (fileData.fileName.split(".").pop()?.toLowerCase() || fileData.fileType || "ifc")
      .toLowerCase()
      .replace(/^\./, "")

    if (!ALLOWED_VIEWER_EXTENSIONS.includes(extension) && !isAllowedViewerFileRecord(fileData.fileUrl, fileData.fileName, extension)) {
      return {
        success: false,
        error: "Bu dosya bir 3D model değildir. Lütfen .ifc, .gltf veya .glb uzantılı bir dosya seçin.",
      }
    }

    // 1. Deactivate all existing models for this project
    await prisma.bimFile.updateMany({
      where: { projectId },
      data: { isActive: false },
    })

    // 2. Create the new BimFile record with isActive: true
    const newBimFile = await prisma.bimFile.create({
      data: {
        projectId,
        fileName: fileData.fileName,
        fileUrl: fileData.fileUrl,
        fileType: extension,
        isActive: true,
      },
    })

    // 3. Update the project's active model URLs
    await prisma.project.update({
      where: { id: projectId },
      data: {
        bimModelUrl: fileData.fileUrl,
        ifcModelUrl: fileData.fileUrl,
      },
    })

    revalidatePath(`/admin/projects/${projectId}`)
    return { success: true, bimFile: newBimFile }
  } catch (error) {
    console.error("Failed to add BIM file to project:", error)
    return { success: false, error: "Model arşive eklenirken hata oluştu." }
  }
}

export async function setActiveBimFile(projectId: string, bimFileId: string) {
  try {
    const targetFile = await prisma.bimFile.findUnique({
      where: { id: bimFileId },
    })

    if (!targetFile || targetFile.projectId !== projectId) {
      return { success: false, error: "Model bulunamadı." }
    }

    if (!isAllowedViewerFileRecord(targetFile.fileUrl, targetFile.fileName, targetFile.fileType)) {
      return {
        success: false,
        error: "Bu dosya bir 3D model değildir. Lütfen .ifc, .gltf veya .glb uzantılı bir dosya seçin.",
      }
    }

    await prisma.bimFile.updateMany({
      where: { projectId },
      data: { isActive: false },
    })

    await prisma.bimFile.update({
      where: { id: bimFileId },
      data: { isActive: true },
    })

    await prisma.project.update({
      where: { id: projectId },
      data: {
        bimModelUrl: targetFile.fileUrl,
        ifcModelUrl: targetFile.fileUrl,
      },
    })

    revalidatePath(`/admin/projects/${projectId}`)
    return { success: true, url: targetFile.fileUrl }
  } catch (error) {
    console.error("Failed to set active BIM file:", error)
    return { success: false, error: "Model aktifleştirilirken hata oluştu." }
  }
}

export async function deleteBimFile(projectId: string, bimFileId: string) {
  try {
    const targetFile = await prisma.bimFile.findUnique({
      where: { id: bimFileId },
    })

    if (!targetFile || targetFile.projectId !== projectId) {
      return { success: false, error: "Silinecek model bulunamadı." }
    }

    await prisma.bimFile.delete({
      where: { id: bimFileId },
    })

    if (targetFile.isActive) {
      const remainingFiles = await prisma.bimFile.findMany({
        where: { projectId },
        orderBy: { uploadedAt: "desc" },
      })

      const remaining3DFile = remainingFiles.find((f) =>
        is3DModelRecord(f.fileUrl, f.fileName, f.fileType)
      )

      if (remaining3DFile) {
        await prisma.bimFile.update({
          where: { id: remaining3DFile.id },
          data: { isActive: true },
        })
        await prisma.project.update({
          where: { id: projectId },
          data: {
            bimModelUrl: remaining3DFile.fileUrl,
            ifcModelUrl: remaining3DFile.fileUrl,
          },
        })
      } else {
        await prisma.project.update({
          where: { id: projectId },
          data: {
            bimModelUrl: null,
            ifcModelUrl: null,
          },
        })
      }
    }

    revalidatePath(`/admin/projects/${projectId}`)
    return { success: true }
  } catch (error) {
    console.error("Failed to delete BIM file:", error)
    return { success: false, error: "Model silinirken hata oluştu." }
  }
}

export async function getProjectBimFiles(projectId: string) {
  try {
    const [allBimFiles, projectDocs, projectFiles] = await Promise.all([
      prisma.bimFile.findMany({
        where: { projectId },
        orderBy: { uploadedAt: "desc" },
      }),
      prisma.projectDocument.findMany({
        where: { projectId, status: "ACTIVE" },
        orderBy: { createdAt: "desc" },
      }),
      prisma.projectFile.findMany({
        where: { projectId },
        orderBy: { createdAt: "desc" },
      }),
    ])

    // ADIM 1 & 2: Sadece 3D model dosyaları (.ifc, .gltf, .glb) "bimFiles" (Kayıtlı BIM Modelleri Arşivi) listesine düşer
    const bimFromBimTable = allBimFiles.filter((f) =>
      is3DModelRecord(f.fileUrl, f.fileName, f.fileType)
    )
    const bimFromProjFiles = projectFiles
      .filter((f) => is3DModelRecord(f.url, f.name))
      .map((f) => ({
        id: f.id,
        projectId: f.projectId,
        fileName: f.name,
        fileUrl: f.url,
        fileType: (f.name?.split(".").pop() || f.url?.split(".").pop() || "ifc").toLowerCase(),
        uploadedAt: f.createdAt,
        isActive: false,
      }))

    const seen3DUrls = new Set<string>()
    const files = [...bimFromBimTable, ...bimFromProjFiles].filter((f) => {
      if (!f.fileUrl || seen3DUrls.has(f.fileUrl)) return false
      seen3DUrls.add(f.fileUrl)
      return true
    })

    const extractSafeExt = (name?: string | null, url?: string | null, type?: string | null) => {
      if (type && !type.includes("/") && type.length <= 6 && !["blueprint", "other", "specification", "contract"].includes(type.toLowerCase())) {
        return type.toLowerCase().replace(/^\./, "")
      }
      const cleanName = (name || "").split("?")[0].trim()
      if (cleanName.includes(".")) {
        const ext = cleanName.split(".").pop()?.toLowerCase()
        if (ext && ext.length <= 6) return ext
      }
      const lastSeg = ((url || "").split("?")[0].split("/").pop() || "").trim()
      if (lastSeg.includes(".")) {
        const ext = lastSeg.split(".").pop()?.toLowerCase()
        if (ext && ext.length <= 6) return ext
      }
      return "pdf"
    }

    // PDF, DOCX, XLSX ve diğer 2D dokümanlar ayrı "documentFiles" (Proje Evrakları ve Paftalar) listesine aktarılır
    const non3DBimFiles = allBimFiles
      .filter((f) => !is3DModelRecord(f.fileUrl, f.fileName, f.fileType))
      .map((f) => ({
        id: f.id,
        projectId: f.projectId,
        fileName: f.fileName,
        fileUrl: f.fileUrl,
        fileType: extractSafeExt(f.fileName, f.fileUrl, f.fileType),
        uploadedAt: f.uploadedAt,
      }))

    const docItems = projectDocs
      .filter((d) => !is3DModelRecord(d.fileUrl, d.title, d.type))
      .map((d) => ({
        id: d.id,
        projectId: d.projectId,
        fileName: d.title,
        fileUrl: d.fileUrl,
        fileType: extractSafeExt(d.title, d.fileUrl, d.type),
        uploadedAt: d.createdAt,
      }))

    const projFileDocs = projectFiles
      .filter((f) => !is3DModelRecord(f.url, f.name))
      .map((f) => ({
        id: f.id,
        projectId: f.projectId,
        fileName: f.name,
        fileUrl: f.url,
        fileType: extractSafeExt(f.name, f.url),
        uploadedAt: f.createdAt,
      }))

    const seenDocUrls = new Set<string>()
    const documents = [...non3DBimFiles, ...docItems, ...projFileDocs].filter((doc) => {
      if (!doc.fileUrl || seenDocUrls.has(doc.fileUrl)) return false
      seenDocUrls.add(doc.fileUrl)
      return true
    })

    return { success: true, files, documents }
  } catch (error) {
    console.error("Failed to fetch project BIM files:", error)
    return { success: false, files: [], documents: [] }
  }
}
