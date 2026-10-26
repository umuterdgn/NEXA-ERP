/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Franchise Hasarlı Teslimat ve İade / Değişim (RMA) API'si
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

    const isSuperAdmin = session.user.role === "SUPER_ADMIN"
    const tenantId = (session.user as any)?.tenantId

    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")

    const where: any = {}
    if (!isSuperAdmin) {
      where.tenantId = tenantId || "non-existent"
    }
    if (status && status !== "ALL") {
      where.status = status
    }

    const issues = await prisma.deliveryIssue.findMany({
      where,
      include: {
        goodsReceipt: {
          include: {
            issues: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    })

    // Fetch associated purchase requests & projects for the goods receipts
    const purchaseRequestIds = issues.map((i) => i.goodsReceipt.purchaseRequestId).filter(Boolean)
    const purchaseRequests = await prisma.purchaseRequest.findMany({
      where: { id: { in: purchaseRequestIds } },
      include: {
        project: {
          select: { id: true, name: true, city: true, district: true },
        },
        bids: {
          where: { isWinningBid: true },
          include: { supplier: true },
          take: 1,
        },
      },
    })

    const prMap = new Map(purchaseRequests.map((pr) => [pr.id, pr]))

    const enrichedIssues = issues.map((issue) => {
      const pr = prMap.get(issue.goodsReceipt.purchaseRequestId)
      return {
        ...issue,
        materialName: pr?.materialName || "Kurumsal Malzeme",
        orderedQuantity: issue.goodsReceipt.orderedQuantity,
        deliveredQuantity: issue.goodsReceipt.deliveredQuantity,
        waybillNo: issue.goodsReceipt.waybillNo,
        project: pr?.project || { name: "Franchise Şantiyesi", city: "Türkiye" },
        supplier: pr?.bids[0]?.supplier || {
          name: "Kurumsal Merkez Tedarikçi A.Ş.",
          email: "tedarik@kurumsal.com",
          phone: "0850 444 00 22",
        },
      }
    })

    return NextResponse.json({ issues: enrichedIssues })
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

    const body = await request.json()
    const { goodsReceiptId, issueType, description, photoUrls } = body

    if (!goodsReceiptId || !description) {
      return NextResponse.json(
        { error: "goodsReceiptId ve açıklama zorunludur" },
        { status: 400 }
      )
    }

    const tenantId = (session.user as any)?.tenantId
    const issue = await prisma.deliveryIssue.create({
      data: {
        goodsReceiptId,
        tenantId: tenantId || null,
        issueType: issueType || "DAMAGED",
        description,
        photoUrls: photoUrls || [],
        status: "REPORTED",
      },
    })

    return NextResponse.json({ issue }, { status: 201 })
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

    const body = await request.json()
    const { id, status } = body

    if (!id || !status) {
      return NextResponse.json({ error: "ID ve status zorunludur" }, { status: 400 })
    }

    const updated = await prisma.deliveryIssue.update({
      where: { id },
      data: { status },
    })

    return NextResponse.json({ issue: updated })
  } catch (error: any) {
    console.error("❌ RMA PATCH Error:", error)
    return NextResponse.json({ error: error.message || "RMA durumu güncellenemedi" }, { status: 500 })
  }
}
