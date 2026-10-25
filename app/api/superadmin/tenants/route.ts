/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Superadmin Tenants & Multi-Tenant Management API
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

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
        name: t.name,
        domain: t.domain,
        type: t.type,
        subscriptionPlan: t.subscriptionPlan || "STARTER",
        status: t.status || (t.isActive ? "ACTIVE" : "SUSPENDED"),
        licenses: t.licenses || 50,
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
      return NextResponse.json({ error: "Yetkisiz işlem." }, { status: 403 });
    }

    const body = await request.json();
    const { name, domain, type, subscriptionPlan, licenses, features } = body;

    if (!name || typeof name !== "string" || !name.trim()) {
      return NextResponse.json({ error: "Firma adı zorunludur." }, { status: 400 });
    }

    const newTenant = await prisma.tenant.create({
      data: {
        name: name.trim(),
        domain: domain?.trim() || null,
        type: type === "INSPECTION" ? "INSPECTION" : "MAIN_CONTRACTOR",
        subscriptionPlan: subscriptionPlan || "STARTER",
        status: "ACTIVE",
        licenses: Number(licenses) || 50,
        features: Array.isArray(features) ? features : ["BIM_VIEWER", "AI_VISION", "OCR", "DRONE"],
        isActive: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Firma (Tenant) başarıyla oluşturuldu.",
      tenant: newTenant,
    });
  } catch (error: any) {
    console.error("Superadmin POST Tenant Error:", error);
    return NextResponse.json(
      { error: "Firma oluşturulurken hata oluştu.", details: error.message },
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
