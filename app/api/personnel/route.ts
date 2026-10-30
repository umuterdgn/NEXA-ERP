/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Nexa ERP - Personnel Management API Route
 */

import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import bcrypt from "bcryptjs"
import { logPersonnelAction } from "@/lib/logger"

export async function GET() {
  try {
    const session = await auth()
    const userRole = session?.user?.role
    let userTenantId = (session?.user as any)?.tenantId as string | null | undefined

    if (!userTenantId && session?.user?.id) {
      const dbUser = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { tenantId: true }
      })
      userTenantId = dbUser?.tenantId || null
    }

    const isSuperAdmin = userRole === "SUPER_ADMIN"
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
        profession: true
      },
      orderBy: { createdAt: 'desc' }
    })
    return NextResponse.json(personnel)
  } catch (error) {
    console.error("Error fetching personnel:", error)
    return NextResponse.json({ error: "Failed to fetch personnel" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth()
    const userName = session?.user?.name || "Bilinmeyen Kullanıcı"
    let userTenantId = (session?.user as any)?.tenantId as string | null | undefined

    if (!userTenantId && session?.user?.id) {
      const dbUser = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { tenantId: true }
      })
      userTenantId = dbUser?.tenantId || null
    }
    
    const body = await request.json()
    
    // Sisteme giriş hesabı oluşturma kontrolü (createAccount veya hasLogin true ise)
    let createdUser: any = null
    const shouldCreateAccount = Boolean(body.createAccount || body.hasLogin) && Boolean(body.username && body.password)
    
    if (shouldCreateAccount) {
      const email = body.username.includes("@") ? body.username : `${body.username}@nexa.local`
      const hashedPassword = await bcrypt.hash(body.password, 10)
      const userRole = body.role || "STAFF"

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

    const personnel = await prisma.personel.create({
      data: {
        tenantId: userTenantId || null,
        personnelNo: body.personnelNo,
        name: body.name,
        tcNo: body.tcNo || null,
        nfcUid: body.nfcUid || null,
        age: body.age ? Number(body.age) : 0,
        birthDate: new Date(body.birthDate),
        department: body.department,
        currentSite: body.currentSite,
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
        professionId: body.professionId || null,
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
