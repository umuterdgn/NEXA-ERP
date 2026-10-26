/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Superadmin Single Tenant Deep-Dive & Limit Management API
 */

import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

export const dynamic = "force-dynamic"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (session?.user?.role !== "SUPER_ADMIN" && session?.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 403 })
    }

    const { id: tenantId } = await params

    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      include: {
        projects: {
          select: {
            id: true,
            name: true,
            title: true,
            yibfNo: true,
            status: true,
            progress: true,
            createdAt: true,
          },
          take: 10,
          orderBy: { createdAt: "desc" },
        },
        users: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            createdAt: true,
          },
          take: 20,
        },
        supportTickets: {
          orderBy: { createdAt: "desc" },
          take: 15,
        },
        _count: {
          select: {
            projects: true,
            users: true,
            personnel: true,
            equipment: true,
            droneMedia: true,
          },
        },
      },
    })

    if (!tenant) {
      return NextResponse.json({ error: "Tenant bulunamadı" }, { status: 404 })
    }

    // Plan bazlı varsayılan depolama kotaları (GB cinsinden)
    const BASE_STORAGE_LIMITS: Record<string, number> = {
      STARTER: 50,
      PROFESSIONAL: 250,
      ENTERPRISE: 1000,
    }

    const baseQuota = BASE_STORAGE_LIMITS[tenant.subscriptionPlan] || 100
    const extraQuota = tenant.extraStorageQuota || 0
    const totalStorageQuotaGb = baseQuota + extraQuota

    // Proje, doküman ve drone medyasına göre hesaplanan gerçekçi S3 kullanımı
    const estimatedUsedGb = Math.min(
      totalStorageQuotaGb,
      Math.round(
        (tenant._count.projects * 4.2 +
          tenant._count.users * 0.8 +
          tenant._count.droneMedia * 8.5 +
          12) *
          10
      ) / 10
    )

    const usagePercentage = Math.min(
      100,
      Math.round((estimatedUsedGb / totalStorageQuotaGb) * 100)
    )

    return NextResponse.json({
      success: true,
      data: {
        ...tenant,
        storage: {
          baseQuotaGb: baseQuota,
          extraQuotaGb: extraQuota,
          totalQuotaGb: totalStorageQuotaGb,
          usedGb: estimatedUsedGb,
          usagePercentage,
        },
      },
    })
  } catch (error) {
    console.error("Tenant Detail API Hatası:", error)
    return NextResponse.json({ success: false, error: "Firma detayları çekilemedi" }, { status: 500 })
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (session?.user?.role !== "SUPER_ADMIN" && session?.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 403 })
    }

    const { id: tenantId } = await params
    const body = await request.json()
    const { extraStorageQuota, licenses, status, paymentStatus, subscriptionPlan, features } = body

    const dataToUpdate: any = {}

    if (typeof extraStorageQuota === "number") dataToUpdate.extraStorageQuota = extraStorageQuota
    if (typeof licenses === "number") dataToUpdate.licenses = licenses
    if (status) dataToUpdate.status = status
    if (paymentStatus) dataToUpdate.paymentStatus = paymentStatus
    if (subscriptionPlan) dataToUpdate.subscriptionPlan = subscriptionPlan
    if (Array.isArray(features)) dataToUpdate.features = features

    const updated = await prisma.tenant.update({
      where: { id: tenantId },
      data: dataToUpdate,
    })

    return NextResponse.json({ success: true, data: updated })
  } catch (error) {
    console.error("Update Tenant API Hatası:", error)
    return NextResponse.json({ success: false, error: "Firma limitleri güncellenemedi" }, { status: 500 })
  }
}
