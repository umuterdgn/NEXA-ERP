/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Yapı Denetim: Demir & Kalıp Vize Tutanağı Server Actions
 */

"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export interface CreateVisaInput {
  projectId: string;
  elementName: string;
  reinforcementDetails: string;
  coverSpace: number;
  formworkStatus: string;
  visaNo?: string;
}

/**
 * Yeni Donatı & Kalıp Vize Tutanağı Oluşturur (Create)
 */
export async function createVisa(data: CreateVisaInput) {
  try {
    let inspectorId: string | undefined;
    try {
      const session = await auth();
      inspectorId = session?.user?.id;
    } catch {
      // Running outside request context
    }

    if (!inspectorId) {
      // Eğer oturum ID'si yoksa uygun bir denetçi kullan
      const defaultInspector = await prisma.user.findFirst({
        where: {
          role: { in: ["INSPECTOR", "INSPECTION_ADMIN", "ADMIN"] },
        },
      });
      if (defaultInspector) {
        inspectorId = defaultInspector.id;
      } else {
        const anyUser = await prisma.user.findFirst();
        if (!anyUser) {
          return { success: false, error: "Sistemde denetçi kullanıcısı bulunamadı." };
        }
        inspectorId = anyUser.id;
      }
    }

    // Projenin varlığını doğrula
    const project = await prisma.project.findUnique({
      where: { id: data.projectId },
    });
    if (!project) {
      return { success: false, error: "Seçilen proje bulunamadı." };
    }

    // Vize Numarası Oluştur (Eğer girilmediyse)
    let visaNo = data.visaNo?.trim();
    if (!visaNo) {
      const year = new Date().getFullYear();
      const count = await prisma.reinforcementVisa.count();
      visaNo = `VIZE-${year}-${String(count + 1).padStart(3, "0")}`;
    }

    // Veritabanına kaydet
    const visa = await prisma.reinforcementVisa.create({
      data: {
        visaNo,
        projectId: data.projectId,
        inspectorId,
        elementName: data.elementName,
        reinforcementDetails: data.reinforcementDetails,
        coverSpace: Number(data.coverSpace),
        formworkStatus: data.formworkStatus,
        status: "PENDING",
      },
      include: {
        project: {
          select: { id: true, name: true, title: true, yibfNo: true, location: true },
        },
        inspector: {
          select: { id: true, name: true, email: true, role: true },
        },
      },
    });

    try {
      revalidatePath("/inspection/reinforcement");
    } catch {}
    return { success: true, data: visa };
  } catch (error: any) {
    console.error("createVisa error:", error);
    return { success: false, error: error?.message || "Vize tutanağı kaydedilemedi." };
  }
}

/**
 * Vize Tutanağı Durumunu Günceller (Onayla veya Reddet)
 */
export async function updateVisaStatus(
  visaId: string,
  status: "APPROVED" | "REJECTED",
  rejectionReason?: string
) {
  try {
    const existing = await prisma.reinforcementVisa.findUnique({
      where: { id: visaId },
    });

    if (!existing) {
      return { success: false, error: "Vize kaydı bulunamadı." };
    }

    const updated = await prisma.reinforcementVisa.update({
      where: { id: visaId },
      data: {
        status,
        rejectionReason: status === "REJECTED" ? rejectionReason || "Kusurlu imalat" : null,
      },
      include: {
        project: true,
        inspector: true,
      },
    });

    try {
      revalidatePath("/inspection/reinforcement");
      revalidatePath(`/inspection/reinforcement/${visaId}`);
    } catch {}
    return { success: true, data: updated };
  } catch (error: any) {
    console.error("updateVisaStatus error:", error);
    return { success: false, error: error?.message || "Vize durumu güncellenemedi." };
  }
}

/**
 * Tüm Donatı & Kalıp Vizelerini Listeler (Read)
 */
export async function getVisas() {
  try {
    const visas = await prisma.reinforcementVisa.findMany({
      include: {
        project: {
          select: { id: true, name: true, title: true, yibfNo: true, location: true },
        },
        inspector: {
          select: { id: true, name: true, email: true, role: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return { success: true, data: visas };
  } catch (error: any) {
    console.error("getVisas error:", error);
    return { success: false, error: error?.message || "Vizeler listelenemedi.", data: [] };
  }
}

/**
 * Tekil Vize Tutanağı Detayını Getirir (Read Single)
 */
export async function getVisaById(id: string) {
  try {
    const visa = await prisma.reinforcementVisa.findUnique({
      where: { id },
      include: {
        project: true,
        inspector: true,
      },
    });

    if (!visa) {
      return { success: false, error: "Vize tutanağı bulunamadı." };
    }

    return { success: true, data: visa };
  } catch (error: any) {
    console.error("getVisaById error:", error);
    return { success: false, error: error?.message || "Vize detayı alınamadı." };
  }
}

/**
 * Modal için Proje Listesini Getirir
 */
export async function getProjectsForSelection() {
  try {
    const projects = await prisma.project.findMany({
      select: {
        id: true,
        name: true,
        title: true,
        yibfNo: true,
        city: true,
        district: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return { success: true, data: projects };
  } catch (error: any) {
    console.error("getProjectsForSelection error:", error);
    return { success: false, data: [] };
  }
}
