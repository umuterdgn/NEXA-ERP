/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Nexa ERP - Mobil JWT Kimlik Doğrulama & Oturum Yardımcısı (lib/mobile-auth.ts)
 *
 * Mobil uygulama (/api/mobile/*) Bearer Token doğrulaması,
 * Token üretimi, Tenant izolasyonu ve Proje bazlı yetki kontrolü.
 */

import { SignJWT, jwtVerify } from "jose"
import { prisma } from "@/lib/prisma"
import {
  getAllowedModules,
  getMobileNavigationProfile,
  getLocationTrackingMode,
  normalizeTenantType,
  type SystemRole,
  type TenantType,
  type LocationTrackingMode,
  type ModuleKey,
  type MobileNavProfile,
} from "@/lib/rbac/permissions"

const SECRET_KEY = new TextEncoder().encode(
  process.env.AUTH_SECRET ||
    process.env.NEXTAUTH_SECRET ||
    "fallback-secret-key-change-in-production-nexa-2026"
)

export interface MobileTokenPayload {
  userId: string
  email: string
  name: string
  role: SystemRole
  tenantId: string | null
  tenantType: TenantType
  assignedProjectIds: string[]
  locationTrackingMode: LocationTrackingMode
}

export interface MobileAuthContext {
  userId: string
  email: string
  name: string
  role: SystemRole
  tenantId: string | null
  tenantType: TenantType
  tenant: {
    id: string
    name: string
    type: TenantType
    logoUrl?: string | null
    primaryColor?: string | null
  } | null
  assignedProjectIds: string[]
  locationTrackingMode: LocationTrackingMode
  allowedModules: ModuleKey[]
  mobileProfile: MobileNavProfile
  user: any
}

/**
 * Kullanıcı için Mobile Access ve Refresh JWT üretir.
 */
export async function generateMobileTokens(user: {
  id: string
  email: string
  name: string
  role: string
  tenantId?: string | null
  tenant?: { id: string; name: string; type?: any; logoUrl?: string | null; primaryColor?: string | null } | null
  assignedProjectIds?: string[]
  locationTrackingMode?: string | null
}) {
  const normalizedRole = (user.role || "WORKER").toUpperCase() as SystemRole
  const tenantType = normalizeTenantType(user.tenant?.type)
  const trackingMode = (user.locationTrackingMode || getLocationTrackingMode(normalizedRole)) as LocationTrackingMode

  const payload: MobileTokenPayload = {
    userId: user.id,
    email: user.email,
    name: user.name,
    role: normalizedRole,
    tenantId: user.tenantId || null,
    tenantType,
    assignedProjectIds: user.assignedProjectIds || [],
    locationTrackingMode: trackingMode,
  }

  // Access Token (30 gün)
  const accessToken = await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(SECRET_KEY)

  // Refresh Token (90 gün)
  const refreshToken = await new SignJWT({ userId: user.id, type: "refresh" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("90d")
    .sign(SECRET_KEY)

  return {
    accessToken,
    refreshToken,
    expiresIn: 30 * 24 * 60 * 60,
  }
}

/**
 * Gelen mobil istekteki Authorization Header'ını çözümler ve kullanıcıyı doğrular.
 */
export async function getMobileAuth(request: Request): Promise<MobileAuthContext | null> {
  try {
    const authHeader = request.headers.get("authorization") || request.headers.get("Authorization")
    let token: string | null = null

    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.substring(7).trim()
    }

    // Query param fallback (?token=...)
    if (!token) {
      const url = new URL(request.url)
      token = url.searchParams.get("token")
    }

    if (!token) {
      return null
    }

    const { payload } = await jwtVerify(token, SECRET_KEY)
    const userId = payload.userId as string

    if (!userId) return null

    // Veritabanından kullanıcıyı ve kiracı bilgisini doğrula
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        tenant: true,
        company: true,
      },
    })

    if (!user) return null

    // Personel kaydıyla eşleşen şantiye atamalarını al
    let assignedProjects = user.assignedProjectIds || []
    if (assignedProjects.length === 0) {
      const personel = await prisma.personel.findFirst({
        where: { userId: user.id },
        select: { projectId: true, assignedProjectIds: true },
      })
      if (personel) {
        if (personel.assignedProjectIds && personel.assignedProjectIds.length > 0) {
          assignedProjects = personel.assignedProjectIds
        } else if (personel.projectId) {
          assignedProjects = [personel.projectId]
        }
      }
    }

    const role = (user.role || "WORKER").toUpperCase() as SystemRole
    const tenantType = normalizeTenantType(user.tenant?.type || user.companyType)
    const trackingMode = (user.locationTrackingMode || getLocationTrackingMode(role)) as LocationTrackingMode
    const allowedModules = getAllowedModules(role, tenantType)
    const mobileProfile = getMobileNavigationProfile(role, tenantType)

    return {
      userId: user.id,
      email: user.email,
      name: user.name,
      role,
      tenantId: user.tenantId || null,
      tenantType,
      tenant: user.tenant
        ? {
            id: user.tenant.id,
            name: user.tenant.name,
            type: tenantType,
            primaryColor: (user.tenant as any).primaryColor || null,
          }
        : null,
      assignedProjectIds: assignedProjects,
      locationTrackingMode: trackingMode,
      allowedModules,
      mobileProfile,
      user,
    }
  } catch (error) {
    return null
  }
}

/**
 * Tek kullanımlık Web AR / BIM SSO Token üretir (Mobil WebView için).
 */
export async function generateSsoToken(user: { id: string; email: string; role: string; tenantId?: string | null }) {
  return await new SignJWT({
    userId: user.id,
    email: user.email,
    role: user.role,
    tenantId: user.tenantId || null,
    scope: "MOBILE_WEBVIEW_SSO",
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("15m") // 15 dakika geçerli
    .sign(SECRET_KEY)
}

