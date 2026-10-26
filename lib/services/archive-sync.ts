/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Centralized Global Archive & Storage Quota Synchronization Service
 */

import { prisma } from "@/lib/prisma"

export interface SyncArchiveParams {
  title: string
  fileUrl: string
  fileSizeBytes: number
  sourceModule: string // "BIM", "INSPECTION_FORM", "WORK_PROOF", "FINANCE", "DOCUMENT_ARCHIVE", "GENERAL"
  category?: string
  tenantId?: string | null
  projectId?: string | null
  uploadedById?: string | null
  notes?: string | null
}

export async function syncToGlobalArchive(params: SyncArchiveParams) {
  try {
    const rawMB = params.fileSizeBytes / (1024 * 1024)
    const fileSizeMB = Math.max(0.001, Number(rawMB.toFixed(3)))

    let effectiveTenantId = params.tenantId || null

    // Projeden tenantId türetme (eğer verilmediyse)
    if (!effectiveTenantId && params.projectId) {
      const proj = await prisma.project.findUnique({
        where: { id: params.projectId },
        select: { tenantId: true }
      }).catch(() => null)
      if (proj?.tenantId) {
        effectiveTenantId = proj.tenantId
      }
    }

    // Kullanıcıdan tenantId türetme (eğer hala yoksa)
    if (!effectiveTenantId && params.uploadedById) {
      const u = await prisma.user.findUnique({
        where: { id: params.uploadedById },
        select: { tenantId: true }
      }).catch(() => null)
      if (u?.tenantId) {
        effectiveTenantId = u.tenantId
      }
    }

    // 1. DocumentArchive tablosuna merkezi kayıt aç
    const archiveRecord = await prisma.documentArchive.create({
      data: {
        title: params.title,
        category: params.category || "GENERAL",
        fileUrl: params.fileUrl,
        projectId: params.projectId || null,
        tenantId: effectiveTenantId,
        isGlobalArchive: true,
        sourceModule: params.sourceModule,
        fileSizeMB: fileSizeMB,
      }
    }).catch(err => {
      console.error("DocumentArchive sync error:", err)
      return null
    })

    // 2. Proje ve yükleyen kullanıcı varsa Document tablosuna da yansıt
    if (params.projectId && params.uploadedById) {
      await prisma.document.create({
        data: {
          name: params.title,
          type: params.category || "DIGER",
          projectId: params.projectId,
          uploadedById: params.uploadedById,
          googleDriveFileId: "EXTERNAL_FILE",
          googleDriveUrl: params.fileUrl,
          tenantId: effectiveTenantId,
          isGlobalArchive: true,
          sourceModule: params.sourceModule,
          fileSizeMB: fileSizeMB,
          notes: params.notes || `Merkezi Arşiv Senkronizasyonu - Kaynak: ${params.sourceModule}`,
        }
      }).catch(err => {
        console.warn("Document table secondary sync warning:", err)
      })
    }

    // 3. Kiracının kullanılan depolama kotasını güncelle (usedStorageMB += fileSizeMB)
    if (effectiveTenantId) {
      await prisma.tenant.update({
        where: { id: effectiveTenantId },
        data: {
          usedStorageMB: {
            increment: fileSizeMB
          }
        }
      }).catch(err => {
        console.warn("Tenant storage quota increment warning:", err)
      })
    }

    return {
      success: true,
      archiveRecord,
      fileSizeMB,
      tenantId: effectiveTenantId
    }
  } catch (error) {
    console.error("Critical error in syncToGlobalArchive:", error)
    return { success: false, error }
  }
}
