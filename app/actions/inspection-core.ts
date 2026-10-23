/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Yapı Denetim Merkezi Server Actions (Core Sample, NCR, Inspection Form)
 */

"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

// ============================================================================
// 1. KAROT & NUMUNE QR TAKİP ACTIONS
// ============================================================================

export interface CreateCoreSampleInput {
  qrCode?: string;
  projectId: string;
  pourDate?: Date | string;
  testDate?: Date | string | null;
  strengthResult?: number | null;
  location?: string;
  status?: string;
  concreteClass?: string;
}

export async function createCoreSample(data: CreateCoreSampleInput) {
  try {
    let inspectorId: string | undefined;
    try {
      const session = await auth();
      inspectorId = session?.user?.id;
    } catch {}

    if (!inspectorId) {
      const defaultUser = await prisma.user.findFirst({
        where: { role: { in: ["INSPECTOR", "INSPECTION_ADMIN", "ADMIN"] } },
      }) || await prisma.user.findFirst();
      inspectorId = defaultUser?.id;
    }

    if (!inspectorId) {
      return { success: false, error: "Denetçi kullanıcısı bulunamadı." };
    }

    let qrCode = data.qrCode?.trim();
    if (!qrCode) {
      const count = await prisma.coreSample.count();
      qrCode = `NXA-SPL-${new Date().getFullYear()}-${String(count + 1001).padStart(4, "0")}`;
    }

    const pourDate = data.pourDate ? new Date(data.pourDate) : new Date();
    const testDate = data.testDate ? new Date(data.testDate) : null;

    const sample = await prisma.coreSample.create({
      data: {
        qrCode,
        projectId: data.projectId,
        takenById: inspectorId,
        inspectorId: inspectorId,
        pourDate,
        testDate,
        strengthResult: data.strengthResult ?? null,
        resultStrength: data.strengthResult ?? null,
        location: data.location || data.concreteClass || "Yapı Elemanı",
        status: data.status || (data.strengthResult ? (data.strengthResult >= 30 ? "PASSED" : "FAILED") : "WAITING_TEST"),
      },
      include: {
        project: {
          select: { id: true, name: true, title: true, yibfNo: true, location: true },
        },
        takenBy: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    try {
      revalidatePath("/inspection/core-samples");
      revalidatePath("/admin/samples");
    } catch {}

    return { success: true, data: sample };
  } catch (error: any) {
    console.error("createCoreSample error:", error);
    return { success: false, error: error?.message || "Numune kaydı oluşturulamadı." };
  }
}

export async function updateCoreSampleStatus(id: string, status: string, strengthResult?: number | null) {
  try {
    const updated = await prisma.coreSample.update({
      where: { id },
      data: {
        status,
        ...(strengthResult !== undefined ? { strengthResult, resultStrength: strengthResult } : {}),
        testedAt: new Date(),
        testDate: new Date(),
      },
      include: {
        project: true,
        takenBy: true,
      },
    });

    try {
      revalidatePath("/inspection/core-samples");
      revalidatePath("/admin/samples");
    } catch {}

    return { success: true, data: updated };
  } catch (error: any) {
    console.error("updateCoreSampleStatus error:", error);
    return { success: false, error: error?.message || "Numune durumu güncellenemedi." };
  }
}

export async function getCoreSamples() {
  try {
    const samples = await prisma.coreSample.findMany({
      include: {
        project: {
          select: { id: true, name: true, title: true, yibfNo: true, location: true },
        },
        takenBy: {
          select: { id: true, name: true, email: true, role: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });
    return { success: true, data: samples };
  } catch (error: any) {
    console.error("getCoreSamples error:", error);
    return { success: false, error: error?.message || "Numuneler alınamadı.", data: [] };
  }
}

// ============================================================================
// 2. UYGUNSUZLUK & DÖF (NCR) ACTIONS
// ============================================================================

export interface CreateNCRInput {
  reportNo?: string;
  projectId: string;
  description: string;
  deadline: Date | string;
  subcontractorId?: string;
  photos?: string[];
  severity?: string;
}

export async function createNCR(data: CreateNCRInput) {
  try {
    let creatorId: string | undefined;
    try {
      const session = await auth();
      creatorId = session?.user?.id;
    } catch {}

    if (!creatorId) {
      const defaultUser = await prisma.user.findFirst({
        where: { role: { in: ["INSPECTOR", "INSPECTION_ADMIN", "ADMIN"] } },
      }) || await prisma.user.findFirst();
      creatorId = defaultUser?.id;
    }

    if (!creatorId) {
      return { success: false, error: "Denetçi kullanıcısı bulunamadı." };
    }

    let reportNo = data.reportNo?.trim();
    if (!reportNo) {
      const count = await prisma.nonConformance.count();
      reportNo = `NCR-${new Date().getFullYear()}-${String(count + 1).padStart(3, "0")}`;
    }

    const ncr = await prisma.nonConformance.create({
      data: {
        reportNo,
        projectId: data.projectId,
        creatorId,
        subcontractorId: data.subcontractorId || null,
        description: data.description,
        deadline: new Date(data.deadline),
        status: "OPEN",
        photos: data.photos || [],
      },
      include: {
        project: {
          select: { id: true, name: true, title: true, yibfNo: true },
        },
        creator: {
          select: { id: true, name: true, email: true, role: true },
        },
      },
    });

    try {
      revalidatePath("/inspection/ncr");
    } catch {}

    return { success: true, data: ncr };
  } catch (error: any) {
    console.error("createNCR error:", error);
    return { success: false, error: error?.message || "DÖF oluşturulamadı." };
  }
}

export async function resolveNCR(id: string, status: "RESOLVED" | "VERIFIED" | "CLOSED" = "RESOLVED") {
  try {
    const updated = await prisma.nonConformance.update({
      where: { id },
      data: { status },
      include: {
        project: true,
        creator: true,
      },
    });

    try {
      revalidatePath("/inspection/ncr");
    } catch {}

    return { success: true, data: updated };
  } catch (error: any) {
    console.error("resolveNCR error:", error);
    return { success: false, error: error?.message || "DÖF güncellenemedi." };
  }
}

export async function getNCRs() {
  try {
    const ncrs = await prisma.nonConformance.findMany({
      include: {
        project: {
          select: { id: true, name: true, title: true, yibfNo: true },
        },
        creator: {
          select: { id: true, name: true, email: true, role: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });
    return { success: true, data: ncrs };
  } catch (error: any) {
    console.error("getNCRs error:", error);
    return { success: false, error: error?.message || "DÖF kayıtları alınamadı.", data: [] };
  }
}

// ============================================================================
// 3. DİNAMİK DENETİM FORMLARI ACTIONS
// ============================================================================

export interface SubmitInspectionFormInput {
  formType: string;
  projectId: string;
  formData: any;
  isPassed: boolean;
}

export async function submitInspectionForm(data: SubmitInspectionFormInput) {
  try {
    let inspectorId: string | undefined;
    try {
      const session = await auth();
      inspectorId = session?.user?.id;
    } catch {}

    if (!inspectorId) {
      const defaultUser = await prisma.user.findFirst({
        where: { role: { in: ["INSPECTOR", "INSPECTION_ADMIN", "ADMIN"] } },
      }) || await prisma.user.findFirst();
      inspectorId = defaultUser?.id;
    }

    if (!inspectorId) {
      return { success: false, error: "Denetçi kullanıcısı bulunamadı." };
    }

    const form = await prisma.inspectionForm.create({
      data: {
        formType: data.formType,
        projectId: data.projectId,
        inspectorId,
        formData: data.formData || {},
        isPassed: data.isPassed,
      },
      include: {
        project: {
          select: { id: true, name: true, title: true, yibfNo: true },
        },
        inspector: {
          select: { id: true, name: true, email: true, role: true },
        },
      },
    });

    try {
      revalidatePath("/inspection/forms");
    } catch {}

    return { success: true, data: form };
  } catch (error: any) {
    console.error("submitInspectionForm error:", error);
    return { success: false, error: error?.message || "Denetim formu kaydedilemedi." };
  }
}

export async function getInspectionForms() {
  try {
    const forms = await prisma.inspectionForm.findMany({
      include: {
        project: {
          select: { id: true, name: true, title: true, yibfNo: true },
        },
        inspector: {
          select: { id: true, name: true, email: true, role: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });
    return { success: true, data: forms };
  } catch (error: any) {
    console.error("getInspectionForms error:", error);
    return { success: false, error: error?.message || "Formlar alınamadı.", data: [] };
  }
}
