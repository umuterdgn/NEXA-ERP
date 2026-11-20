/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * This code is the property of NXA Software.
 */

import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { logPersonnelAction } from "@/lib/logger"
import { resolveApiAuth, requireAnyModule } from "@/lib/api-rbac"
import { getAssignableRolesForTenant, type SystemRole } from "@/lib/rbac/permissions"

export async function GET(request: Request) {
  try {
    const caller = await resolveApiAuth(request)
    if (!caller) {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 })
    }
    const denied = requireAnyModule(caller, ["personnel", "personnel_tracking"])
    if (denied) return denied

    const isSuperAdmin = caller.role === "SUPER_ADMIN"
    const userTenantId = caller.tenantId
    const tenantFilter = !isSuperAdmin
      ? userTenantId
        ? { tenantId: userTenantId }
        : { tenantId: "non-existent-tenant" }
      : {}

    const personnel = await prisma.personel.findMany({
      where: {
        role: {
          notIn: ['ADMIN', 'MUTEAHHIT']
        },
        ...tenantFilter
      },
      include: {
        profession: true,
        project: true
      },
      orderBy: { createdAt: 'desc' }
    })
    return NextResponse.json(personnel)
  } catch (error) {
    console.error("Error fetching personnel:", error)
    return NextResponse.json({ error: "Failed to fetch personnel" }, { status: 500 })
  }
}

import bcrypt from "bcryptjs"

export async function POST(request: Request) {
  try {
    const caller = await resolveApiAuth(request)
    if (!caller) {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 })
    }
    const denied = requireAnyModule(caller, ["personnel", "personnel_tracking"])
    if (denied) return denied

    const userName = caller.name || "Bilinmeyen Kullanıcı"
    const userTenantId = caller.tenantId
    const isSuperAdmin = caller.role === "SUPER_ADMIN"
    
    const body = await request.json()
    
    // Sisteme giriş hesabı oluşturma kontrolü (createAccount veya hasLogin true ise)
    let createdUser: any = null
    const shouldCreateAccount = Boolean(body.createAccount || body.hasLogin) && Boolean(body.username && body.password)
    
    if (shouldCreateAccount) {
      const email = body.username.includes("@") ? body.username : `${body.username}@nexa.local`
      const hashedPassword = await bcrypt.hash(body.password, 10)
      const userRole = String(body.role || "STAFF").toUpperCase() as SystemRole
      const assignableRoles = getAssignableRolesForTenant(caller.tenantType).map((r) => r.role)
      if (!isSuperAdmin && !assignableRoles.includes(userRole)) {
        return NextResponse.json(
          { error: `Bu işletme tipi (${caller.tenantType}) için '${userRole}' rolü atanamaz` },
          { status: 403 }
        )
      }

      const existingUser = await prisma.user.findUnique({
        where: { email }
      })

      if (existingUser) {
        createdUser = await prisma.user.update({
          where: { email },
          data: {
            password: hashedPassword,
            role: userRole,
            tenantId: userTenantId || existingUser.tenantId || null
          }
        })
      } else {
        createdUser = await prisma.user.create({
          data: {
            name: body.name,
            email,
            password: hashedPassword,
            role: userRole,
            tenantId: userTenantId || null
          }
        })
      }
    }

    const assignedRole = createdUser ? createdUser.role : (body.role || "STAFF")

    // Meslek (Profession) ve Pozisyon (Position) eşleştirmesi
    let resolvedProfessionId: string | null = null
    const positionTitle = body.position ? String(body.position).trim() : null
    const departmentValue = body.department ? String(body.department).trim() : "Genel"

    if (body.professionId && !body.professionId.startsWith("temp-") && !body.professionId.startsWith("default-")) {
      const existingProf = await prisma.profession.findUnique({
        where: { id: body.professionId }
      })
      if (existingProf) {
        resolvedProfessionId = existingProf.id
      }
    }

    if (!resolvedProfessionId && (positionTitle || body.professionId)) {
      const searchName = positionTitle || body.professionId
      const foundByName = await prisma.profession.findFirst({
        where: {
          name: {
            equals: searchName,
            mode: "insensitive"
          }
        }
      })
      if (foundByName) {
        resolvedProfessionId = foundByName.id
      } else if (searchName && !searchName.startsWith("temp-") && !searchName.startsWith("default-")) {
        try {
          const newProf = await prisma.profession.create({
            data: { name: searchName }
          })
          resolvedProfessionId = newProf.id
        } catch {
          resolvedProfessionId = null
        }
      }
    }

    const personnel = await prisma.personel.create({
      data: {
        tenantId: userTenantId || null,
        personnelNo: body.personnelNo,
        name: body.name,
        tcNo: body.tcNo || null,
        nfcUid: body.nfcUid || null,
        age: body.age ? Number(body.age) : 0,
        birthDate: new Date(body.birthDate),
        department: departmentValue,
        position: positionTitle,
        currentSite: body.currentSite,
        projectId: body.projectId || null,
        phone: body.phone || null,
        email: body.email || null,
        hireDate: new Date(body.hireDate || new Date()),
        status: "ACTIVE",
        salary: body.salary ? parseFloat(body.salary.toString()) : 0,
        salaryPayDay: body.salaryPayDay ? Number(body.salaryPayDay) : null,
        sgkPeriod: body.sgkPeriod || null,
        sgkPayDay: body.sgkPayDay ? Number(body.sgkPayDay) : null,
        healthStatus: body.healthStatus || null,
        bonuses: body.bonuses ? parseFloat(body.bonuses.toString()) : 0,
        takim: body.takim || null,
        gunlukYevmiye: body.gunlukYevmiye ? parseFloat(body.gunlukYevmiye.toString()) : 0,
        professionId: resolvedProfessionId,
        userId: createdUser ? createdUser.id : null,
        username: createdUser ? (body.username || createdUser.email) : null,
        role: assignedRole
      }
    })
    
    // Log the action with detailed information
    await logPersonnelAction("EKLENDI", userName, personnel.name, `Personel No: ${personnel.personnelNo}`)
    
    return NextResponse.json(personnel)
  } catch (error) {
    console.error("Error creating personnel:", error)
    return NextResponse.json({ error: "Failed to create personnel" }, { status: 500 })
  }
}
