/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Superadmin Tenants & Multi-Tenant Management API
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import bcrypt from "bcryptjs";

function generateSlug(text: string): string {
  const trMap: Record<string, string> = {
    ç: "c", ğ: "g", ı: "i", ö: "o", ş: "s", ü: "u",
    Ç: "c", Ğ: "g", İ: "i", Ö: "o", Ş: "s", Ü: "u",
  };
  let str = text || "";
  for (const [k, v] of Object.entries(trMap)) {
    str = str.replace(new RegExp(k, "g"), v);
  }
  return (
    str
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "") || `tenant-${Date.now()}`
  );
}

const PLAN_PRICING: Record<string, number> = {
  STARTER: 15000,
  PROFESSIONAL: 35000,
  ENTERPRISE: 75000,
};

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    // Superadmin authorization
    if (session?.user?.role !== "SUPER_ADMIN" && session?.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Yetkisiz erişim. Superadmin yetkisi gereklidir." }, { status: 403 });
    }

    const tenants = await prisma.tenant.findMany({
      include: {
        _count: {
          select: {
            users: true,
            projects: true,
            personnel: true,
            equipment: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Calculate Global KPIs
    const totalTenants = tenants.length;
    const activeTenants = tenants.filter((t) => t.status === "ACTIVE" && t.isActive).length;
    const suspendedTenants = tenants.filter((t) => t.status === "SUSPENDED" || !t.isActive).length;

    // Monthly Recurring Revenue (MRR)
    const mrr = tenants.reduce((acc, t) => {
      if (t.status === "ACTIVE" && t.isActive) {
        return acc + (PLAN_PRICING[t.subscriptionPlan] || 15000);
      }
      return acc;
    }, 0);

    const totalUsers = tenants.reduce((acc, t) => acc + t._count.users, 0);
    const totalLicenses = tenants.reduce((acc, t) => acc + (t.licenses || 50), 0);
    const totalProjects = tenants.reduce((acc, t) => acc + t._count.projects, 0);

    // Approximate storage calculation (1.4 GB per project average + user media)
    const estimatedStorageGb = Number(((totalProjects * 2.8) + (totalUsers * 0.4) + 120).toFixed(1));

    return NextResponse.json({
      success: true,
      kpis: {
        totalTenants,
        activeTenants,
        suspendedTenants,
        mrr,
        totalUsers,
        totalLicenses,
        totalProjects,
        estimatedStorageGb,
      },
      tenants: tenants.map((t) => ({
        id: t.id,
        slug: t.slug,
        name: t.name,
        domain: t.domain,
        type: t.type,
        subscriptionPlan: t.subscriptionPlan || "STARTER",
        isTrial: t.isTrial ?? false,
        trialEndsAt: t.trialEndsAt ? t.trialEndsAt.toISOString() : null,
        subscriptionStatus: t.subscriptionStatus || "ACTIVE",
        status: t.status || (t.isActive ? "ACTIVE" : "SUSPENDED"),
        licenses: t.licenses || 50,
        maxUsers: t.maxUsers || 10,
        maxStorageMB: t.maxStorageMB || 51200,
        usedStorageMB: t.usedStorageMB || 0,
        enabledModules: t.enabledModules || ["DASHBOARD", "PROJECTS", "FINANCE", "DOCUMENTS"],
        primaryColor: t.primaryColor || "#3B82F6",
        logoUrl: t.logoUrl,
        isWhiteLabelActive: t.isWhiteLabelActive,
        usedLicenses: t._count.users,
        projectCount: t._count.projects,
        features: t.features || ["BIM_VIEWER", "AI_VISION", "OCR", "DRONE"],
        iyzicoSubId: t.iyzicoSubId,
        createdAt: t.createdAt.toISOString(),
      })),
    });
  } catch (error: any) {
    console.error("Superadmin GET Tenants Error:", error);
    return NextResponse.json(
      { error: "Firmalar listelenirken hata oluştu.", details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (session?.user?.role !== "SUPER_ADMIN" && session?.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Yetkisiz işlem. Superadmin yetkisi gereklidir." }, { status: 403 });
    }

    const body = await request.json();
    const {
      name,
      slug,
      domain,
      type,
      subscriptionPlan,
      isTrial,
      licenses,
      maxUsers,
      maxStorageMB,
      enabledModules,
      features,
      primaryColor,
      logoUrl,
      isWhiteLabelActive,
      adminName,
      adminEmail,
      adminPassword,
    } = body;

    if (!name || typeof name !== "string" || !name.trim()) {
      return NextResponse.json({ error: "Firma adı zorunludur." }, { status: 400 });
    }

    // Prisma Transaction ile Tenant ve İlk Admin Kaydı
    const result = await prisma.$transaction(async (tx) => {
      // 1. Slug Hazırlığı ve Benzersizlik Kontrolü
      let targetSlug = (slug && String(slug).trim().toLowerCase()) || generateSlug(name);
      targetSlug = targetSlug.replace(/[^a-z0-9-]+/g, "").replace(/(^-|-$)+/g, "");

      const slugExists = await tx.tenant.findUnique({
        where: { slug: targetSlug },
      });
      if (slugExists) {
        targetSlug = `${targetSlug}-${Math.random().toString(36).substring(2, 6)}`;
      }

      const tenantType = type === "INSPECTION" ? "INSPECTION" : "MAIN_CONTRACTOR";
      const finalMaxUsers = Number(maxUsers || licenses) || 10;
      const finalLicenses = Number(licenses || maxUsers) || 50;
      const finalMaxStorageMB = Number(maxStorageMB) || 51200;

      const isDemoTrial = Boolean(isTrial);
      const subscriptionStatus = isDemoTrial ? "TRIAL" : "ACTIVE";
      const trialEndsAt = isDemoTrial ? new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) : null;

      // 2. Tenant Kaydını Oluştur
      const newTenant = await tx.tenant.create({
        data: {
          name: name.trim(),
          slug: targetSlug,
          domain: domain?.trim() || null,
          type: tenantType,
          subscriptionPlan: subscriptionPlan || "STARTER",
          isTrial: isDemoTrial,
          trialEndsAt,
          subscriptionStatus,
          status: "ACTIVE",
          licenses: finalLicenses,
          maxUsers: finalMaxUsers,
          maxStorageMB: finalMaxStorageMB,
          enabledModules: Array.isArray(enabledModules) && enabledModules.length > 0
            ? enabledModules
            : ["DASHBOARD", "PROJECTS", "FINANCE", "DOCUMENTS"],
          features: Array.isArray(features) ? features : ["BIM_VIEWER", "AI_VISION", "OCR", "DRONE"],
          primaryColor: primaryColor?.trim() || "#3B82F6",
          logoUrl: logoUrl?.trim() || null,
          isWhiteLabelActive: Boolean(isWhiteLabelActive),
          isActive: true,
          paymentStatus: "PAID",
        },
      });

      // 3. İlk Yönetici (Admin) Hesabı Oluştur
      let createdAdmin = null;
      if (adminEmail && adminPassword) {
        const cleanEmail = String(adminEmail).trim().toLowerCase();

        // E-posta benzersizlik kontrolü
        const existingUser = await tx.user.findUnique({
          where: { email: cleanEmail },
        });

        if (existingUser) {
          throw new Error(
            `Bu e-posta adresi (${cleanEmail}) zaten başka bir hesap tarafından kullanılıyor.`
          );
        }

        const hashedPassword = await bcrypt.hash(String(adminPassword).trim(), 10);
        const adminRole = tenantType === "INSPECTION" ? "INSPECTION_ADMIN" : "ADMIN";

        createdAdmin = await tx.user.create({
          data: {
            email: cleanEmail,
            password: hashedPassword,
            name: (adminName && String(adminName).trim()) || `${name.trim()} Yöneticisi`,
            role: adminRole as any,
            companyType: tenantType,
            tenantId: newTenant.id,
            permissions: newTenant.enabledModules,
          },
        });
      }

      return {
        tenant: newTenant,
        admin: createdAdmin
          ? {
              id: createdAdmin.id,
              name: createdAdmin.name,
              email: createdAdmin.email,
              role: createdAdmin.role,
            }
          : null,
      };
    });

    return NextResponse.json({
      success: true,
      message: "Firma ve ilk yönetici hesabı başarıyla oluşturuldu.",
      data: result,
      tenant: result.tenant,
    });
  } catch (error: any) {
    console.error("Superadmin POST Tenant Transaction Error:", error);
    return NextResponse.json(
      { error: error.message || "Firma ve yönetici oluşturulurken hata oluştu." },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await auth();
    if (session?.user?.role !== "SUPER_ADMIN" && session?.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Yetkisiz işlem." }, { status: 403 });
    }

    const body = await request.json();
    const { id, status, subscriptionPlan, licenses, features, action } = body;

    if (!id) {
      return NextResponse.json({ error: "Tenant ID gereklidir." }, { status: 400 });
    }

    const updateData: any = {};

    if (status !== undefined) {
      updateData.status = status;
      updateData.isActive = status === "ACTIVE";
    }

    if (subscriptionPlan !== undefined) {
      updateData.subscriptionPlan = subscriptionPlan;
    }

    if (licenses !== undefined) {
      updateData.licenses = Number(licenses);
    }

    if (features !== undefined) {
      updateData.features = features;
    }

    const updatedTenant = await prisma.tenant.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      message: "Firma ayarları güncellendi.",
      tenant: updatedTenant,
    });
  } catch (error: any) {
    console.error("Superadmin PATCH Tenant Error:", error);
    return NextResponse.json(
      { error: "Firma güncellenirken hata oluştu.", details: error.message },
      { status: 500 }
    );
  }
}
