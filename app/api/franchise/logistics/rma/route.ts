/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Franchise Hasarlı Teslimat ve İade / Değişim (RMA) API'si
 * %100 Tenant İzolasyonu ile RmaRequest Modeline Bağlıdır.
 */

import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

export const dynamic = "force-dynamic"

export async function GET(request: Request) {
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
      return NextResponse.json({ issues: [], rmaRequests: [] })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")

    const where: any = { tenantId }
    if (status && status !== "ALL") {
      where.status = status
    }

    const rmaRequests = await prisma.rmaRequest.findMany({
      where,
      orderBy: { createdAt: "desc" },
    })

    const enrichedIssues = rmaRequests.map((r) => ({
      id: r.id,
      storeName: r.storeName,
      itemName: r.itemName,
      status: r.status,
      createdAt: r.createdAt,
      materialName: r.itemName,
      description: `${r.storeName} için kusurlu ürün kaydı: ${r.itemName}`,
      issueType: "DAMAGED",
      project: {
        name: r.storeName,
        city: "Türkiye",
      },
      supplier: {
        name: "Merkezi Franchise Tedarikçi",
        email: "tedarik@franchise.nexa.com",
        phone: "0850 444 00 22",
      },
    }))

    return NextResponse.json({ issues: enrichedIssues, rmaRequests })
  } catch (error: any) {
    console.error("❌ RMA GET Error:", error)
    return NextResponse.json({ error: error.message || "Hasarlı teslimatlar alınamadı" }, { status: 500 })
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
    const { storeName, itemName, status } = body

    if (!storeName || !itemName) {
      return NextResponse.json(
        { error: "Mağaza adı ve kusurlu ürün adı zorunludur" },
        { status: 400 }
      )
    }

    const rma = await prisma.rmaRequest.create({
      data: {
        tenantId,
        storeName: storeName.trim(),
        itemName: itemName.trim(),
        status: status || "REPORTED",
      },
    })

    return NextResponse.json({ issue: rma, rma, success: true }, { status: 201 })
  } catch (error: any) {
    console.error("❌ RMA POST Error:", error)
    return NextResponse.json({ error: error.message || "Hasar kaydı eklenemedi" }, { status: 500 })
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

    const updated = await prisma.rmaRequest.updateMany({
      where: {
        id,
        ...(tenantId ? { tenantId } : {}),
      },
      data: { status },
    })

    return NextResponse.json({ success: true, count: updated.count })
  } catch (error: any) {
    console.error("❌ RMA PATCH Error:", error)
    return NextResponse.json({ error: error.message || "RMA durumu güncellenemedi" }, { status: 500 })
  }
}
