/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * This code is the property of NXA Software.
 */

import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

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
    const whereClause: any = !isSuperAdmin
      ? userTenantId
        ? { tenantId: userTenantId }
        : { tenantId: "non-existent-tenant" }
      : {}

    const companies = await prisma.company.findMany({
      where: whereClause,
      orderBy: {
        createdAt: 'desc'
      }
    })
    return NextResponse.json(companies)
  } catch (error) {
    console.error("Error fetching companies:", error)
    return NextResponse.json([])
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth()
    let userTenantId = (session?.user as any)?.tenantId as string | null | undefined

    if (!userTenantId && session?.user?.id) {
      const dbUser = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { tenantId: true }
      })
      userTenantId = dbUser?.tenantId || null
    }

    const body = await request.json()
    const { name, type, contactName, phone, email, taxNumber, taxOffice } = body

    if (!name || !type) {
      return NextResponse.json(
        { error: "Firma adı ve tipi zorunludur" },
        { status: 400 }
      )
    }

    const company = await prisma.company.create({
      data: {
        name,
        type,
        contactName,
        phone,
        email,
        taxNumber,
        taxOffice,
        tenantId: userTenantId || null
      }
    })

    return NextResponse.json(company, { status: 201 })
  } catch (error) {
    console.error("Error creating company:", error)
    return NextResponse.json(
      { error: "Firma oluşturulurken hata oluştu" },
      { status: 500 }
    )
  }
}
