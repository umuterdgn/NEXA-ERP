/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * This code is the property of NXA Software.
 */

import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import {
  getAllowedModules,
  getAssignableRolesForTenant,
  getLocationTrackingMode,
  normalizeTenantType,
  type SystemRole,
} from "@/lib/rbac/permissions"
import { resolveApiAuth } from "@/lib/api-rbac"

const GRANT_ALLOWED_ROLES: SystemRole[] = [
  "SUPER_ADMIN",
  "ADMIN",
  "HR_MANAGER",
  "INSPECTION_ADMIN",
  "FRANCHISE_ADMIN",
]

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const caller = await resolveApiAuth(request)
    if (!caller) {
      return NextResponse.json({ error: "Yetkisiz oturum" }, { status: 401 })
    }

    const isSuperAdmin = caller.role === "SUPER_ADMIN"
    if (!GRANT_ALLOWED_ROLES.includes(caller.role)) {
      return NextResponse.json(
        { error: "Personel giriş yetkisi tanımlama izniniz yok" },
        { status: 403 }
      )
    }

    const resolvedParams = await params
    const body = await request.json()
    const { email, password, role, username, assignedProjectIds } = body

    // Check if personnel exists
    const personnel = await prisma.personel.findUnique({
      where: { id: resolvedParams.id },
      include: { tenant: true },
    })

    if (!personnel) {
      return NextResponse.json({ error: "Personel bulunamadı" }, { status: 404 })
    }

    // Çapraz kiracı koruması
    if (!isSuperAdmin && personnel.tenantId && caller.tenantId && personnel.tenantId !== caller.tenantId) {
      return NextResponse.json(
        { error: "Başka bir firmaya ait personele giriş yetkisi veremezsiniz" },
        { status: 403 }
      )
    }

    // Hash password with bcrypt
    const hashedPassword = await bcrypt.hash(password, 10)
    const targetRole = (role || "STAFF").toUpperCase() as SystemRole
    const tenantType = normalizeTenantType(personnel.tenant?.type || caller.tenantType)

    // İşletme Tipine Göre Rol İzolasyonu Doğrulaması (Örn: Yapı Denetim admini SITE_MANAGER atayamaz)
    const assignableRoles = getAssignableRolesForTenant(tenantType).map((r) => r.role)
    if (!isSuperAdmin && !assignableRoles.includes(targetRole)) {
      return NextResponse.json(
        { error: `Bu işletme tipi (${tenantType}) için '${targetRole}' rolü atanamaz` },
        { status: 403 }
      )
    }

    const allowedModules = getAllowedModules(targetRole, tenantType)
    const trackingMode = getLocationTrackingMode(targetRole)

    const finalAssignedProjectIds = Array.isArray(assignedProjectIds) && assignedProjectIds.length > 0
      ? assignedProjectIds
      : personnel.projectId
      ? [personnel.projectId]
      : []

    // Check if email already exists - if so, update existing user
    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    let user
    if (existingUser) {
      // Update existing user's password, role, permissions, projects, tracking
      user = await prisma.user.update({
        where: { email },
        data: {
          password: hashedPassword,
          role: targetRole as any,
          tenantId: personnel.tenantId || existingUser.tenantId || null,
          permissions: allowedModules,
          locationTrackingMode: trackingMode,
          assignedProjectIds: finalAssignedProjectIds,
        },
      })
    } else {
      // Create new User
      user = await prisma.user.create({
        data: {
          name: personnel.name,
          email,
          password: hashedPassword,
          role: targetRole as any,
          tenantId: personnel.tenantId || null,
          permissions: allowedModules,
          locationTrackingMode: trackingMode,
          assignedProjectIds: finalAssignedProjectIds,
        },
      })
    }

    // Update personnel with userId, username, role, projects and tracking
    const updatedPersonnel = await prisma.personel.update({
      where: { id: resolvedParams.id },
      data: { 
        userId: user.id,
        username: username || email,
        role: targetRole as any,
        locationTrackingMode: trackingMode,
        assignedProjectIds: finalAssignedProjectIds,
      },
    })

    return NextResponse.json({ 
      success: true, 
      user,
      personnel: updatedPersonnel,
    })
  } catch (error) {
    console.error("Error granting login access:", error)
    return NextResponse.json({ error: "Giriş izni verilirken hata oluştu" }, { status: 500 })
  }
}
