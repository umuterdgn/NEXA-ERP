/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 */

"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function addBimFile(projectId: string, url: string, name: string) {
  try {
    // Önce aynı projedeki diğer modelleri pasif yap
    await db.bimFile.updateMany({ where: { projectId }, data: { isActive: false } });
    
    // Dosya uzantısını belirle (ifc, glb, gltf vb.)
    const ext = name.split(".").pop()?.toLowerCase() || "ifc";

    // Yeni modeli aktif olarak kaydet
    const newFile = await db.bimFile.create({
      data: {
        projectId,
        fileUrl: url,
        fileName: name,
        fileType: ext,
        isActive: true,
      },
    });

    // Projedeki aktif model alanlarını da güncelle
    await db.project.update({
      where: { id: projectId },
      data: {
        bimModelUrl: url,
        ifcModelUrl: url,
      },
    }).catch((err) => {
      console.error("Proje model URL güncellenirken uyarı:", err);
    });
    
    revalidatePath(`/admin/projects/${projectId}`); // Cache'i anında temizle!
    return newFile;
  } catch (error) {
    console.error("addBimFile hatası:", error);
    throw error;
  }
}

export async function setActiveBimFile(projectId: string, bimFileId: string) {
  try {
    const targetFile = await db.bimFile.findUnique({
      where: { id: bimFileId },
    });

    if (!targetFile || targetFile.projectId !== projectId) {
      return { success: false, error: "Model bulunamadı." };
    }

    await db.bimFile.updateMany({
      where: { projectId },
      data: { isActive: false },
    });

    await db.bimFile.update({
      where: { id: bimFileId },
      data: { isActive: true },
    });

    await db.project.update({
      where: { id: projectId },
      data: {
        bimModelUrl: targetFile.fileUrl,
        ifcModelUrl: targetFile.fileUrl,
      },
    });

    revalidatePath(`/admin/projects/${projectId}`);
    return { success: true, url: targetFile.fileUrl, bimFile: targetFile };
  } catch (error) {
    console.error("Failed to set active BIM file:", error);
    return { success: false, error: "Model aktifleştirilirken hata oluştu." };
  }
}

export async function deleteBimFile(projectId: string, bimFileId: string) {
  try {
    const targetFile = await db.bimFile.findUnique({
      where: { id: bimFileId },
    });

    if (!targetFile || targetFile.projectId !== projectId) {
      return { success: false, error: "Silinecek model bulunamadı." };
    }

    await db.bimFile.delete({
      where: { id: bimFileId },
    });

    if (targetFile.isActive) {
      const remainingFile = await db.bimFile.findFirst({
        where: { projectId },
        orderBy: { uploadedAt: "desc" },
      });

      if (remainingFile) {
        await db.bimFile.update({
          where: { id: remainingFile.id },
          data: { isActive: true },
        });
        await db.project.update({
          where: { id: projectId },
          data: {
            bimModelUrl: remainingFile.fileUrl,
            ifcModelUrl: remainingFile.fileUrl,
          },
        });
      } else {
        await db.project.update({
          where: { id: projectId },
          data: {
            bimModelUrl: null,
            ifcModelUrl: null,
          },
        });
      }
    }

    revalidatePath(`/admin/projects/${projectId}`);
    return { success: true };
  } catch (error) {
    console.error("Failed to delete BIM file:", error);
    return { success: false, error: "Model silinirken hata oluştu." };
  }
}

export async function getProjectBimFiles(projectId: string) {
  try {
    const files = await db.bimFile.findMany({
      where: { projectId },
      orderBy: { uploadedAt: "desc" },
    });
    return { success: true, files };
  } catch (error) {
    console.error("Failed to fetch project BIM files:", error);
    return { success: false, files: [] };
  }
}
