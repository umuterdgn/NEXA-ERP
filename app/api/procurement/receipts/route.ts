/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Goods Receipt API (Ambar Mal Kabul & İrsaliye Eşleştirme)
 */

import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const purchaseRequestId = searchParams.get("purchaseRequestId")

    const where: any = {}
    if (purchaseRequestId) where.purchaseRequestId = purchaseRequestId

    const receipts = await prisma.goodsReceipt.findMany({
      where,
      orderBy: { receivedDate: "desc" },
    })

    // Fetch related users & purchase requests
    const userIds = Array.from(new Set(receipts.map((r) => r.receivedById)))
    const prIds = Array.from(new Set(receipts.map((r) => r.purchaseRequestId)))

    const [users, purchaseRequests] = await Promise.all([
      prisma.user.findMany({
        where: { id: { in: userIds } },
        select: { id: true, name: true, email: true },
      }),
      prisma.purchaseRequest.findMany({
        where: { id: { in: prIds } },
        include: {
          project: {
            select: { id: true, title: true, name: true },
          },
        },
      }),
    ])

    const userMap = new Map(users.map((u) => [u.id, u]))
    const prMap = new Map(purchaseRequests.map((p) => [p.id, p]))

    const enriched = receipts.map((r) => ({
      ...r,
      receivedBy: userMap.get(r.receivedById) || { name: "Bilinmeyen Personel" },
      purchaseRequest: prMap.get(r.purchaseRequestId) || null,
      difference: r.deliveredQuantity - r.orderedQuantity,
    }))

    return NextResponse.json(enriched)
  } catch (error: any) {
    console.error("Goods Receipt GET Error:", error)
    return NextResponse.json({ error: error.message || "Failed to fetch receipts" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const {
      purchaseRequestId,
      orderedQuantity,
      deliveredQuantity,
      waybillNo,
      receivedById,
      receivedDate,
    } = body

    if (
      !purchaseRequestId ||
      orderedQuantity === undefined ||
      deliveredQuantity === undefined ||
      !waybillNo ||
      !receivedById
    ) {
      return NextResponse.json({ error: "Eksik bilgi gönderildi" }, { status: 400 })
    }

    const receipt = await prisma.goodsReceipt.create({
      data: {
        purchaseRequestId,
        orderedQuantity: parseFloat(orderedQuantity),
        deliveredQuantity: parseFloat(deliveredQuantity),
        waybillNo: waybillNo.trim(),
        receivedById,
        receivedDate: receivedDate ? new Date(receivedDate) : new Date(),
      },
    })

    return NextResponse.json(receipt, { status: 201 })
  } catch (error: any) {
    console.error("Goods Receipt POST Error:", error)
    return NextResponse.json({ error: error.message || "Failed to create goods receipt" }, { status: 500 })
  }
}
