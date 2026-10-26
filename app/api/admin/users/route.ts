/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * This code is the property of NXA Software.
 */

import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import bcrypt from "bcryptjs"

export async function GET() {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userRole = session.user.role
    let userTenantId = (session.user as any)?.tenantId as string | null | undefined

    if (!userTenantId && session.user.id) {
      const dbUser = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { tenantId: true }
      })
      userTenantId = dbUser?.tenantId || null
    }

    const isSuperAdmin = userRole === 'SUPER_ADMIN'
    const tenantFilter: any = !isSuperAdmin
      ? userTenantId
        ? { tenantId: userTenantId }
        : { tenantId: "non-existent-tenant" }
      : {}

    let users: any[] = []
    let personnel: any[] = []

    // Fetch users based on role hierarchy & tenant isolation
    if (userRole === 'STAFF') {
      users = await prisma.user.findMany({
        where: { role: 'ADMIN', ...tenantFilter },
        orderBy: { name: "asc" }
      })
    } else if (userRole === 'ADMIN') {
      personnel = await prisma.personel.findMany({
        where: tenantFilter,
        include: {
          profession: true
        },
        orderBy: { name: "asc" }
      })

      users = await prisma.user.findMany({
        where: {
          OR: [
            { role: 'SUPER_ADMIN' },
            { ...tenantFilter }
          ]
        },
        orderBy: { name: "asc" }
      })
    } else if (userRole === 'SUPER_ADMIN') {
      users = await prisma.user.findMany({
        where: { role: 'ADMIN' },
        orderBy: { name: "asc" }
      })
    } else {
      users = await prisma.user.findMany({
        where: tenantFilter,
        orderBy: { name: "asc" }
      })
      personnel = await prisma.personel.findMany({
        where: tenantFilter,
        include: {
          profession: true
        },
        orderBy: { name: "asc" }
      })
    }

    // Combine users and personnel in unified format with null safety
    const combined = [
      ...users.filter(user => user !== null).map(user => ({
        id: user.id,
        name: user.name || 'Bilinmeyen Kullanıcı',
        email: user.email || 'Email yok',
        role: user.role || 'USER',
        type: 'user'
      })),
      ...personnel.filter(person => person !== null).map(person => ({
        id: person.id,
        name: person.name || 'Bilinmeyen Personel',
        email: person.username || 'Username yok',
        role: 'STAFF',
        type: 'personnel',
        profession: person.profession?.name || null
      }))
    ]

    const finalCombined = combined.filter(item => item !== null && item.id !== null)

    return NextResponse.json(finalCombined)
  } catch (error) {
    console.error("Users fetch error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    let userTenantId = (session.user as any)?.tenantId as string | null | undefined
    if (!userTenantId && session.user.id) {
      const dbUser = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { tenantId: true }
      })
      userTenantId = dbUser?.tenantId || null
    }

    const body = await request.json()
    const { name, email, password, role, permissions } = body

    const hashedPassword = await bcrypt.hash(password, 10)

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role,
        tenantId: userTenantId || null,
        permissions: permissions || []
      }
    })

    return NextResponse.json(user)
  } catch (error) {
    console.error("User create error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}