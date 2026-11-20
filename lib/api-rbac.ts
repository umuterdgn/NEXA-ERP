/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Nexa ERP - Ortak API Kimlik Doğrulama, RBAC Modül Kontrolü ve Kiracı/Proje İzolasyon Yardımcısı
 */

import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { getMobileAuth } from "@/lib/mobile-auth"
import {
  getAllowedModules,
  getLocationTrackingMode,
  getMobileNavigationProfile,
  hasModuleAccess,
  normalizeTenantType,
  type LocationTrackingMode,
  type MobileNavProfile,
  type ModuleKey,
  type SystemRole,
  type TenantType,
} from "@/lib/rbac/permissions"

export interface ApiAuthContext {
  userId: string
  email: string
  name: string
  role: SystemRole
  tenantId: string | null
  tenantType: TenantType
  assignedProjectIds: string[]
  locationTrackingMode: LocationTrackingMode
  allowedModules: ModuleKey[]
  mobileProfile?: MobileNavProfile
  tenant?: {
    id: string
    name: string
    type: TenantType
    primaryColor?: string | null
  } | null
  user?: any
}

/**
 * Authorization: Bearer JWT (mobil) veya NextAuth Session Cookie (web) üzerinden çağıranı çözer.
 */
export async function resolveApiAuth(request: Request): Promise<ApiAuthContext | null> {
  // 1. Bearer JWT veya ?token= kontrolü
  const mobileAuth = await getMobileAuth(request)
  if (mobileAuth) {
    return mobileAuth
  }

  // 2. Web Cookie Session (NextAuth)
  const session = await auth().catch(() => null)
  const sessionUser = session?.user as any
  if (!sessionUser?.id) {
    return null
  }

  const dbUser = await prisma.user
    .findUnique({
      where: { id: sessionUser.id },
      include: { tenant: true, company: true },
    })
    .catch(() => null)

  if (!dbUser) {
    return null
  }

  let assignedProjectIds = dbUser.assignedProjectIds || []
  if (assignedProjectIds.length === 0) {
    const personel = await prisma.personel
      .findFirst({
        where: { userId: dbUser.id },
        select: { projectId: true, assignedProjectIds: true },
      })
      .catch(() => null)
    if (personel) {
      assignedProjectIds =
        personel.assignedProjectIds && personel.assignedProjectIds.length > 0
          ? personel.assignedProjectIds
          : personel.projectId
          ? [personel.projectId]
          : []
    }
  }

  const role = String(dbUser.role || sessionUser.role || "WORKER").toUpperCase() as SystemRole
  const tenantType = normalizeTenantType(dbUser.tenant?.type || dbUser.companyType || sessionUser.tenantType)
  const locationTrackingMode = (dbUser.locationTrackingMode || getLocationTrackingMode(role)) as LocationTrackingMode
  const allowedModules = getAllowedModules(role, tenantType)
  const mobileProfile = getMobileNavigationProfile(role, tenantType)

  return {
    userId: dbUser.id,
    email: dbUser.email,
    name: dbUser.name,
    role,
    tenantId: dbUser.tenantId || null,
    tenantType,
    assignedProjectIds,
    locationTrackingMode,
    allowedModules,
    mobileProfile,
    tenant: dbUser.tenant
      ? {
          id: dbUser.tenant.id,
          name: dbUser.tenant.name,
          type: tenantType,
          primaryColor: (dbUser.tenant as any).primaryColor || null,
        }
      : null,
    user: dbUser,
  }
}

/**
 * Kullanıcının belirtilen ModuleKey'lerden EN AZ BİRİNE yetkisi olup olmadığını kontrol eder.
 * Yetkisizse 403 NextResponse döner, yetkiliyse null döner.
 */
export function requireAnyModule(
  authCtx: ApiAuthContext,
  modules: ModuleKey[],
  customError?: string
): NextResponse | null {
  if (authCtx.role === "SUPER_ADMIN") {
    return null
  }

  const allowed = modules.some((mod) => hasModuleAccess(authCtx.role, authCtx.tenantType, mod))
  if (!allowed) {
    return NextResponse.json(
      { error: customError || "Bu modül veya işlem için yetkiniz bulunmamaktadır." },
      { status: 403 }
    )
  }

  return null
}

/**
 * İstenen projenin hem kullanıcının kiracısına (tenantId) hem de kapsamına (assignedProjectIds)
 * uyduğunu doğrular. Uymuyorsa 403/404 NextResponse döner, uygunsa null döner.
 */
export async function assertTenantAndProjectAccess(
  authCtx: ApiAuthContext,
  requestedProjectId?: string | null
): Promise<NextResponse | null> {
  if (!requestedProjectId || authCtx.role === "SUPER_ADMIN") {
    return null
  }

  const project = await prisma.project.findUnique({
    where: { id: requestedProjectId },
    select: { id: true, tenantId: true },
  })

  if (!project) {
    return NextResponse.json({ error: "Proje veya şube bulunamadı." }, { status: 404 })
  }

  if (project.tenantId && authCtx.tenantId && project.tenantId !== authCtx.tenantId) {
    return NextResponse.json(
      { error: "Başka bir firmaya ait proje veya şube verisine erişim izniniz yok." },
      { status: 403 }
    )
  }

  const scopedRoles: SystemRole[] = [
    "FRANCHISEE",
    "BRANCH_MANAGER",
    "WORKER",
    "SUBCONTRACTOR",
    "INSPECTOR",
    "FITOUT_TECH",
  ]
  if (scopedRoles.includes(authCtx.role)) {
    if (["FRANCHISEE", "BRANCH_MANAGER"].includes(authCtx.role) && authCtx.assignedProjectIds.length === 0) {
      return NextResponse.json(
        { error: "Bu şubeye erişim yetkiniz tanımlanmamış." },
        { status: 403 }
      )
    }
    if (
      authCtx.assignedProjectIds.length > 0 &&
      !authCtx.assignedProjectIds.includes(requestedProjectId)
    ) {
      return NextResponse.json(
        { error: "Atanmadığınız bir proje veya şubeye erişim izniniz bulunmamaktadır." },
        { status: 403 }
      )
    }
  }

  return null
}

/**
 * Bir kaydın (WorkProof, CoreSample, Deficiency vb.) kiracı ve şube sınırlarını doğrular.
 */
export function assertRecordTenantScope(
  authCtx: ApiAuthContext,
  record: { tenantId?: string | null; projectId?: string | null } | null
): NextResponse | null {
  if (!record || authCtx.role === "SUPER_ADMIN") {
    return null
  }
  if (record.tenantId && authCtx.tenantId && record.tenantId !== authCtx.tenantId) {
    return NextResponse.json(
      { error: "Başka bir firmaya ait kayda erişim yetkiniz bulunmamaktadır." },
      { status: 403 }
    )
  }
  if (
    record.projectId &&
    ["FRANCHISEE", "BRANCH_MANAGER"].includes(authCtx.role) &&
    !authCtx.assignedProjectIds.includes(record.projectId)
  ) {
    return NextResponse.json(
      { error: "Başka bir şubeye ait kayda erişim yetkiniz bulunmamaktadır." },
      { status: 403 }
    )
  }
  return null
}

/**
 * SUBCONTRACTOR kullanıcısının yalnızca kendi Subcontractor kaydını çözümler (asla başka taşeronu döndürmez).
 */
export async function resolveSubcontractorForUser(authCtx: ApiAuthContext) {
  const orConds: any[] = [{ id: authCtx.userId }]
  if (authCtx.name && authCtx.name.trim()) {
    orConds.push(
      { name: { equals: authCtx.name.trim(), mode: "insensitive" } },
      { contactName: { equals: authCtx.name.trim(), mode: "insensitive" } }
    )
  }

  return prisma.subcontractor.findFirst({
    where: {
      ...(authCtx.tenantId ? { tenantId: authCtx.tenantId } : {}),
      OR: orConds,
    },
  })
}

/**
 * Contract.subcontractor (Company modeli) için SUBCONTRACTOR kullanıcısının firma ID'sini çözümler.
 */
export async function resolveSubcontractorCompanyIdForUser(authCtx: ApiAuthContext): Promise<string | null> {
  if (authCtx.user?.companyId) {
    return authCtx.user.companyId as string
  }
  const orConds: any[] = []
  if (authCtx.email) {
    orConds.push({ email: { equals: authCtx.email, mode: "insensitive" } })
  }
  if (authCtx.name && authCtx.name.trim()) {
    orConds.push(
      { name: { equals: authCtx.name.trim(), mode: "insensitive" } },
      { contactName: { equals: authCtx.name.trim(), mode: "insensitive" } }
    )
  }
  if (orConds.length === 0) return null

  const comp = await prisma.company.findFirst({
    where: {
      ...(authCtx.tenantId ? { tenantId: authCtx.tenantId } : {}),
      OR: orConds,
    },
    select: { id: true },
  })
  return comp?.id || null
}

/**
 * Kiracı içinde kısıtlı (şube/proje) kapsamındaki varsayılan projectId listesini döndürür.
 */
export function isBranchOrProjectScopedRole(role: SystemRole): boolean {
  return ["FRANCHISEE", "BRANCH_MANAGER"].includes(role)
}
