/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * POST /api/mobile/auth/login
 * Mobil Uygulama Kurumsal Giriş Ucu (Sıfır Mock, Gerçek Prisma Doğrulaması)
 */

import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { generateMobileTokens } from "@/lib/mobile-auth"
import {
  getAllowedModules,
  getMobileNavigationProfile,
  getLocationTrackingMode,
  normalizeTenantType,
  type SystemRole,
} from "@/lib/rbac/permissions"

export const runtime = "nodejs"

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}))
    const { email, username, password, pushToken } = body

    const identifier = (email || username || "").trim().toLowerCase()
    if (!identifier || !password) {
      return NextResponse.json(
        { error: "Lütfen kullanıcı adı / e-posta ve şifrenizi giriniz." },
        { status: 400 }
      )
    }

    // 1. Önce User tablosunda e-posta veya isim ara
    let user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: { equals: identifier, mode: "insensitive" } },
          { name: { equals: identifier, mode: "insensitive" } },
        ],
      },
      include: {
        tenant: true,
        company: true,
      },
    })

    // 2. User'da bulunamadıysa Personel tablosundan username ile ara
    let linkedPersonel: any = null
    if (!user) {
      linkedPersonel = await prisma.personel.findFirst({
        where: {
          OR: [
            { username: { equals: identifier, mode: "insensitive" } },
            { email: { equals: identifier, mode: "insensitive" } },
            { personnelNo: { equals: identifier, mode: "insensitive" } },
          ],
        },
        include: {
          project: true,
          tenant: true,
        },
      })

      if (linkedPersonel && linkedPersonel.userId) {
        user = await prisma.user.findUnique({
          where: { id: linkedPersonel.userId },
          include: { tenant: true, company: true },
        })
      }
    } else {
      linkedPersonel = await prisma.personel.findFirst({
        where: { userId: user.id },
        include: { project: true, tenant: true },
      })
    }

    if (!user) {
      return NextResponse.json(
        { error: "Kullanıcı bulunamadı. Lütfen bilgilerinizi kontrol ediniz." },
        { status: 401 }
      )
    }

    // 3. Şifre Doğrulaması
    const isPasswordValid = await bcrypt.compare(password, user.password)
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: "Hatalı şifre girdiniz." },
        { status: 401 }
      )
    }

    // 4. Push Token Güncellemesi (varsa)
    if (pushToken && pushToken !== user.pushToken) {
      await prisma.user.update({
        where: { id: user.id },
        data: { pushToken },
      })
    }

    // 5. Şantiye / Proje Atamaları
    let assignedProjectIds = user.assignedProjectIds || []
    if (assignedProjectIds.length === 0 && linkedPersonel) {
      if (linkedPersonel.assignedProjectIds && linkedPersonel.assignedProjectIds.length > 0) {
        assignedProjectIds = linkedPersonel.assignedProjectIds
      } else if (linkedPersonel.projectId) {
        assignedProjectIds = [linkedPersonel.projectId]
      }
    }

    // Proje detaylarını veritabanından çek
    const assignedProjects = await prisma.project.findMany({
      where: {
        id: { in: assignedProjectIds },
        deletedAt: null,
      },
      select: {
        id: true,
        title: true,
        name: true,
        city: true,
        district: true,
        status: true,
        category: true,
        latitude: true,
        longitude: true,
        gpsRadius: true,
      },
    })

    const role = (user.role || "WORKER").toUpperCase() as SystemRole
    const tenantType = normalizeTenantType(user.tenant?.type || user.companyType)
    const locationTrackingMode = (user.locationTrackingMode || getLocationTrackingMode(role))
    const allowedModules = getAllowedModules(role, tenantType)
    const mobileProfile = getMobileNavigationProfile(role, tenantType)

    // 6. JWT Tokenları Üret
    const tokens = await generateMobileTokens({
      id: user.id,
      email: user.email,
      name: user.name,
      role,
      tenantId: user.tenantId,
      tenant: user.tenant,
      assignedProjectIds,
      locationTrackingMode,
    })

    return NextResponse.json({
      success: true,
      message: "Giriş başarılı.",
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresIn: tokens.expiresIn,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role,
        profileImage: user.profileImage || null,
        phone: user.phone || linkedPersonel?.phone || null,
        plateNumber: user.plateNumber || linkedPersonel?.plateNumber || null,
        personnelNo: linkedPersonel?.personnelNo || null,
        currentSite: linkedPersonel?.currentSite || null,
      },
      tenant: user.tenant
        ? {
            id: user.tenant.id,
            name: user.tenant.name,
            type: tenantType,
            slug: user.tenant.slug,
            primaryColor: (user.tenant as any).primaryColor || null,
          }
        : null,
      assignedProjects: assignedProjects.map((p) => ({
        id: p.id,
        name: p.name || p.title,
        city: p.city,
        district: p.district,
        status: p.status,
        latitude: p.latitude,
        longitude: p.longitude,
        radius: p.gpsRadius || 100,
      })),
      locationTrackingMode,
      allowedModules,
      mobileProfile,
    })
  } catch (error: any) {
    console.error("Mobile login error:", error)
    return NextResponse.json(
      { error: error?.message || "Sunucu hatası. Giriş yapılamadı." },
      { status: 500 }
    )
  }
}

