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

    // Depolama Kotası ve Gerçek Kullanım
    const baseQuota = Number(((tenant.maxStorageMB || 51200) / 1024).toFixed(1))
    const extraQuota = tenant.extraStorageQuota || 0
    const totalStorageQuotaGb = Number((baseQuota + extraQuota).toFixed(1))
    const totalMaxMB = totalStorageQuotaGb * 1024

    const actualUsedMB = tenant.usedStorageMB || 0
    const actualUsedGb = Number((actualUsedMB / 1024).toFixed(2))

    const usagePercentage = totalMaxMB > 0 
      ? Math.min(100, Math.round((actualUsedMB / totalMaxMB) * 100)) 
      : 0

    return NextResponse.json({
      success: true,
      data: {
        ...tenant,
        storage: {
          baseQuotaGb: baseQuota,
          extraQuotaGb: extraQuota,
          totalQuotaGb: totalStorageQuotaGb,
          usedGb: actualUsedGb,
          usedMb: actualUsedMB,
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
    const { 
      extraStorageQuota, 
      maxStorageMB,
      usedStorageMB,
      enabledModules,
      licenses, 
      status, 
      paymentStatus, 
      subscriptionPlan, 
      features,
      logoUrl,
      primaryColor,
      isWhiteLabelActive
    } = body

    const dataToUpdate: any = {}

    if (typeof extraStorageQuota === "number") dataToUpdate.extraStorageQuota = extraStorageQuota
    if (typeof maxStorageMB === "number") dataToUpdate.maxStorageMB = maxStorageMB
    if (typeof usedStorageMB === "number") dataToUpdate.usedStorageMB = usedStorageMB
    if (Array.isArray(enabledModules)) dataToUpdate.enabledModules = enabledModules
    if (typeof licenses === "number") dataToUpdate.licenses = licenses
    if (status) dataToUpdate.status = status
    if (paymentStatus) dataToUpdate.paymentStatus = paymentStatus
    if (subscriptionPlan) dataToUpdate.subscriptionPlan = subscriptionPlan
    if (Array.isArray(features)) dataToUpdate.features = features
    if (typeof logoUrl !== "undefined") dataToUpdate.logoUrl = logoUrl ? String(logoUrl).trim() : null
    if (typeof primaryColor !== "undefined") dataToUpdate.primaryColor = primaryColor ? String(primaryColor).trim() : "#3B82F6"
    if (typeof isWhiteLabelActive !== "undefined") dataToUpdate.isWhiteLabelActive = Boolean(isWhiteLabelActive)

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
