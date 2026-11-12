"use server";
/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Super Admin Leads CRM & Demo Request Server Actions
 */

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export interface CreateDemoRequestInput {
  companyName: string;
  contactName: string;
  email: string;
  phone?: string | null;
  employeeCount?: string | null;
  notes?: string | null;
}

/**
 * ADIM 2: Ana Sayfa Form API Entegrasyonu (Server Action)
 * Ziyaretçilerin landing page veya iletişim sayfasından gönderdiği Demo talebini kaydeder.
 */
export async function createDemoRequest(data: CreateDemoRequestInput) {
  try {
    if (!data.companyName?.trim()) {
      return { success: false, error: "Şirket/Firma adı zorunludur." };
    }
    if (!data.contactName?.trim()) {
      return { success: false, error: "Yetkili kişi adı soyadı zorunludur." };
    }
    if (!data.email?.trim() || !data.email.includes("@")) {
      return { success: false, error: "Geçerli bir kurumsal e-posta adresi giriniz." };
    }

    const demoRequest = await prisma.demoRequest.create({
      data: {
        companyName: data.companyName.trim(),
        contactName: data.contactName.trim(),
        email: data.email.trim().toLowerCase(),
        phone: data.phone?.trim() || null,
        employeeCount: data.employeeCount?.trim() || null,
        notes: data.notes?.trim() || null,
        status: "NEW",
      },
    });

    try {
      revalidatePath("/superadmin/leads");
      revalidatePath("/super-admin/leads");
    } catch {
      // In non-request context or build time
    }

    return {
      success: true,
      message: "Talebiniz alınmıştır, uzmanlarımız en kısa sürede sizinle iletişime geçecektir",
      data: demoRequest,
    };
  } catch (error: any) {
    console.error("createDemoRequest Server Action Error:", error);
    return {
      success: false,
      error: error?.message || "Demo talebi iletilirken bir hata oluştu.",
    };
  }
}

/**
 * Super Admin Leads CRM: Tüm Demo Taleplerini listele
 */
export async function getDemoRequests() {
  try {
    const session = await auth();
    const userRole = (session?.user as any)?.role;
    if (userRole !== "SUPER_ADMIN" && userRole !== "ADMIN") {
      return { success: false, error: "Yetkisiz erişim. Superadmin yetkisi gereklidir." };
    }

    const leads = await prisma.demoRequest.findMany({
      orderBy: { createdAt: "desc" },
    });

    return { success: true, leads };
  } catch (error: any) {
    console.error("getDemoRequests Error:", error);
    return { success: false, error: error?.message || "Demo talepleri alınamadı.", leads: [] };
  }
}

/**
 * Super Admin Leads CRM: Talep Durumunu güncelle (NEW -> CONTACTED -> DEMO_DONE -> CONVERTED -> REJECTED)
 */
export async function updateDemoRequestStatus(
  id: string,
  status: "NEW" | "CONTACTED" | "DEMO_DONE" | "CONVERTED" | "REJECTED",
  notes?: string
) {
  try {
    const session = await auth();
    const userRole = (session?.user as any)?.role;
    if (userRole !== "SUPER_ADMIN" && userRole !== "ADMIN") {
      return { success: false, error: "Yetkisiz işlem." };
    }

    const updateData: { status: string; notes?: string } = { status };
    if (notes !== undefined) {
      updateData.notes = notes;
    }

    const updated = await prisma.demoRequest.update({
      where: { id },
      data: updateData,
    });

    revalidatePath("/superadmin/leads");
    revalidatePath("/super-admin/leads");

    return { success: true, lead: updated };
  } catch (error: any) {
    console.error("updateDemoRequestStatus Error:", error);
    return { success: false, error: error?.message || "Durum güncellenemedi." };
  }
}

/**
 * Super Admin Leads CRM: Demo Talebini Sil
 */
export async function deleteDemoRequest(id: string) {
  try {
    const session = await auth();
    const userRole = (session?.user as any)?.role;
    if (userRole !== "SUPER_ADMIN" && userRole !== "ADMIN") {
      return { success: false, error: "Yetkisiz işlem." };
    }

    await prisma.demoRequest.delete({
      where: { id },
    });

    revalidatePath("/superadmin/leads");
    revalidatePath("/super-admin/leads");

    return { success: true, message: "Kayıt başarıyla silindi." };
  } catch (error: any) {
    console.error("deleteDemoRequest Error:", error);
    return { success: false, error: error?.message || "Kayıt silinemedi." };
  }
}

/**
 * Super Admin Leads CRM: İstatistik & KPI Hesaplama
 */
export async function getLeadsMetrics() {
  try {
    const session = await auth();
    const userRole = (session?.user as any)?.role;
    if (userRole !== "SUPER_ADMIN" && userRole !== "ADMIN") {
      return { success: false, error: "Yetkisiz erişim." };
    }

    const [total, newCount, contactedCount, demoDoneCount, convertedCount, rejectedCount] =
      await Promise.all([
        prisma.demoRequest.count(),
        prisma.demoRequest.count({ where: { status: "NEW" } }),
        prisma.demoRequest.count({ where: { status: "CONTACTED" } }),
        prisma.demoRequest.count({ where: { status: "DEMO_DONE" } }),
        prisma.demoRequest.count({ where: { status: "CONVERTED" } }),
        prisma.demoRequest.count({ where: { status: "REJECTED" } }),
      ]);

    const conversionRate = total > 0 ? ((convertedCount / total) * 100).toFixed(1) : "0.0";

    return {
      success: true,
      metrics: {
        total,
        newCount,
        contactedCount,
        demoDoneCount,
        convertedCount,
        rejectedCount,
        conversionRate,
      },
    };
  } catch (error: any) {
    console.error("getLeadsMetrics Error:", error);
    return { success: false, error: error?.message || "Metrikler alınamadı." };
  }
}

