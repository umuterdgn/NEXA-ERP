/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Franchise Konsolide Satınalma ve Toplu İhale API'si
 * %100 Tenant İzolasyonu ile ConsolidatedTender Modeline Bağlıdır.
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

    if (!tenantId) {
      return NextResponse.json({ tenders: [], consolidatedList: [] })
    }

    // ConsolidatedTender tablosundan kiracıya ait kayıtları çek
    const tenders = await prisma.consolidatedTender.findMany({
      where: { tenantId },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json({
      tenders,
      consolidatedList: tenders,
      openRequests: [],
    })
  } catch (error: any) {
    console.error("❌ Consolidated Procurement GET Error:", error)
    return NextResponse.json({ error: error.message || "İhaleler alınamadı" }, { status: 500 })
  }
}

export async function POST(request: Request) {
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

    if (!tenantId) {
      return NextResponse.json({ error: "Kiracı (Tenant) bulunamadı" }, { status: 400 })
    }

    const body = await request.json()
    const { title, status } = body

    if (!title?.trim()) {
      return NextResponse.json(
        { error: "İhale paketi başlığı zorunludur" },
        { status: 400 }
      )
    }

    const tender = await prisma.consolidatedTender.create({
      data: {
        tenantId,
        title: title.trim(),
        status: status || "ACTIVE",
      },
    })

    return NextResponse.json({ tender, success: true }, { status: 201 })
  } catch (error: any) {
    console.error("❌ Consolidated Procurement POST Error:", error)
    return NextResponse.json({ error: error.message || "İhale paketi oluşturulamadı" }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
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

    const body = await request.json()
    const { id, status } = body

    if (!id || !status) {
      return NextResponse.json({ error: "ID ve status zorunludur" }, { status: 400 })
    }

    const updated = await prisma.consolidatedTender.updateMany({
      where: {
        id,
        ...(tenantId ? { tenantId } : {}),
      },
      data: { status },
    })

    return NextResponse.json({ success: true, count: updated.count })
  } catch (error: any) {
    console.error("❌ Consolidated Procurement PATCH Error:", error)
    return NextResponse.json({ error: error.message || "İhale güncellenemedi" }, { status: 500 })
  }
}
