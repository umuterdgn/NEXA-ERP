"use server";
/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Project Documents & Blueprints Server Actions
 */

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export interface CreateProjectDocumentInput {
  projectId: string;
  title: string;
  type: string; // BLUEPRINT, SPECIFICATION, CONTRACT, OTHER, MIMARI, STATIK, ELEKTRIK, MEKANIK
  fileUrl: string;
  notes?: string | null;
  fileSizeMB?: number;
}

export async function createProjectDocumentAction(input: CreateProjectDocumentInput) {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    const tenantId = (session?.user as any)?.tenantId;

    if (!input.projectId || !input.title?.trim() || !input.fileUrl?.trim()) {
      return { success: false, error: "Proje ID, doküman adı ve dosya URL'si zorunludur." };
    }

    const docGroupId = crypto.randomUUID();

    // 1. ProjectDocument tablosuna kaydet
    const projectDoc = await prisma.projectDocument.create({
      data: {
        projectId: input.projectId,
        title: input.title.trim(),
        type: input.type || "BLUEPRINT",
        fileUrl: input.fileUrl.trim(),
        revision: 0,
        status: "ACTIVE",
        documentGroupId: docGroupId,
        uploadedById: userId || null,
        tenantId: tenantId || null,
      },
    });

    // 2. Global Document tablosu ile de senkronize et (varsa)
    try {
      if (userId) {
        await prisma.document.create({
          data: {
            projectId: input.projectId,
            name: input.title.trim(),
            type: input.type || "STATIK_PROJE",
            version: 1,
            googleDriveFileId: projectDoc.id,
            googleDriveUrl: input.fileUrl.trim(),
            uploadedById: userId,
            status: "ACTIVE",
            notes: input.notes || null,
            fileSizeMB: input.fileSizeMB || 0,
            tenantId: tenantId || null,
          },
        });
      }
    } catch (docErr) {
      console.warn("Document global archive sync warning:", docErr);
    }

    revalidatePath(`/admin/projects/${input.projectId}`);

    return {
      success: true,
      document: projectDoc,
      message: "Proje belgesi başarıyla yüklendi ve arşivlendi.",
    };
  } catch (error: any) {
    console.error("createProjectDocumentAction error:", error);
    return {
      success: false,
      error: error?.message || "Belge kaydedilirken hata oluştu.",
    };
  }
}
