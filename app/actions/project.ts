/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * This code is the property of NXA Software.
 */

"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

export async function updateProjectBimModel(projectId: string, modelUrl: string) {
  try {
    await prisma.project.update({
      where: { id: projectId },
      data: {
        bimModelUrl: modelUrl,
        ifcModelUrl: modelUrl,
      }
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
    // Önce aynı projedeki diğer modelleri pasif yap
    await prisma.bimFile.updateMany({ where: { projectId }, data: { isActive: false } })

    const ext = name.split(".").pop()?.toLowerCase() || "ifc"

    // Yeni modeli aktif olarak kaydet
    const newFile = await prisma.bimFile.create({
      data: { projectId, fileUrl: url, fileName: name, fileType: ext, isActive: true },
    })

    await prisma.project.update({
      where: { id: projectId },
      data: {
        bimModelUrl: url,
        ifcModelUrl: url,
      },
    }).catch(() => null)

    revalidatePath(`/admin/projects/${projectId}`) // Cache'i anında temizle!
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
    // 1. Deactivate all existing models for this project
    await prisma.bimFile.updateMany({
      where: { projectId },
      data: { isActive: false },
    })

    // Determine file type from extension if not provided
    const extension = fileData.fileName.split('.').pop()?.toLowerCase() || fileData.fileType || "ifc"

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
    // Find target file
    const targetFile = await prisma.bimFile.findUnique({
      where: { id: bimFileId },
    })

    if (!targetFile || targetFile.projectId !== projectId) {
      return { success: false, error: "Model bulunamadı." }
    }

    // Set all to inactive
    await prisma.bimFile.updateMany({
      where: { projectId },
      data: { isActive: false },
    })

    // Set target to active
    await prisma.bimFile.update({
      where: { id: bimFileId },
      data: { isActive: true },
    })

    // Update project model URLs
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

    // If the deleted file was active, switch to another model or clear
    if (targetFile.isActive) {
      const remainingFile = await prisma.bimFile.findFirst({
        where: { projectId },
        orderBy: { uploadedAt: "desc" },
      })

      if (remainingFile) {
        await prisma.bimFile.update({
          where: { id: remainingFile.id },
          data: { isActive: true },
        })
        await prisma.project.update({
          where: { id: projectId },
          data: {
            bimModelUrl: remainingFile.fileUrl,
            ifcModelUrl: remainingFile.fileUrl,
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
    const files = await prisma.bimFile.findMany({
      where: { projectId },
      orderBy: { uploadedAt: "desc" },
    })
    return { success: true, files }
  } catch (error) {
    console.error("Failed to fetch project BIM files:", error)
    return { success: false, files: [] }
  }
}

