/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Franchise Tip Mağaza / Konsept Şablonları API'si
 */

import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 })
    }

    let tenantId = (session.user as any)?.tenantId

    if (!tenantId && session.user.id) {
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { tenantId: true },
      })
      tenantId = user?.tenantId
    }

    if (!tenantId) {
      const firstTenant = await prisma.tenant.findFirst({ select: { id: true } })
      tenantId = firstTenant?.id
    }

    const where: any = tenantId ? { tenantId } : {}

    const templates = await prisma.storeTemplate.findMany({
      where,
      include: {
        _count: {
          select: { projects: true },
        },
      },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json({ templates })
  } catch (error: any) {
    console.error("❌ Templates GET Error:", error)
    return NextResponse.json({ error: error.message || "Şablonlar alınamadı" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 })
    }

    const tenantId = (session.user as any)?.tenantId
    const body = await request.json()
    const { name, estimatedDays, defaultBoQ, defaultTasks, companyId } = body

    if (!name || !estimatedDays) {
      return NextResponse.json({ error: "name ve estimatedDays zorunludur" }, { status: 400 })
    }

    const targetCompanyId = companyId || session.user.companyId || "default-company"

    const template = await prisma.storeTemplate.create({
      data: {
        name,
        estimatedDays: Number(estimatedDays),
        defaultBoQ: defaultBoQ || [],
        defaultTasks: defaultTasks || [],
        companyId: targetCompanyId,
        tenantId: tenantId || null,
      },
    })

    return NextResponse.json({ template }, { status: 201 })
  } catch (error: any) {
    console.error("❌ Templates POST Error:", error)
    return NextResponse.json({ error: error.message || "Şablon oluşturulamadı" }, { status: 500 })
  }
}
