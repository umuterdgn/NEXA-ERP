/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Supplier Bids API (Tedarikçi Teklifleri ve Kıyaslama)
 */

import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const purchaseRequestId = searchParams.get("purchaseRequestId")
    const supplierId = searchParams.get("supplierId")

    const where: any = {}
    if (purchaseRequestId) {
      where.purchaseRequestId = purchaseRequestId
    }
    if (supplierId) {
      where.supplierId = supplierId
    }

    const bids = await prisma.supplierBid.findMany({
      where,
      include: {
        purchaseRequest: {
          include: {
            project: {
              select: {
                id: true,
                title: true,
                name: true,
              },
            },
          },
        },
        supplier: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            taxNumber: true,
          },
        },
      },
      orderBy: {
        unitPrice: "asc",
      },
    })

    return NextResponse.json(bids)
  } catch (error: any) {
    console.error("Supplier Bids GET Error:", error)
    return NextResponse.json({ error: error.message || "Failed to fetch bids" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { purchaseRequestId, supplierId, unitPrice, notes } = body

    if (!purchaseRequestId || !supplierId || unitPrice === undefined) {
      return NextResponse.json({ error: "Eksik parametreler" }, { status: 400 })
    }

    const purchaseRequest = await prisma.purchaseRequest.findUnique({
      where: { id: purchaseRequestId },
    })

    if (!purchaseRequest) {
      return NextResponse.json({ error: "Satınalma talebi bulunamadı" }, { status: 404 })
    }

    const parsedUnitPrice = parseFloat(unitPrice)
    const totalPrice = parsedUnitPrice * purchaseRequest.quantity

    // Check if supplier already submitted a bid for this request
    const existingBid = await prisma.supplierBid.findFirst({
      where: {
        purchaseRequestId,
        supplierId,
      },
    })

    let bid
    if (existingBid) {
      bid = await prisma.supplierBid.update({
        where: { id: existingBid.id },
        data: {
          unitPrice: parsedUnitPrice,
          totalPrice,
          notes,
        },
        include: {
          supplier: true,
          purchaseRequest: true,
        },
      })
    } else {
      bid = await prisma.supplierBid.create({
        data: {
          purchaseRequestId,
          supplierId,
          unitPrice: parsedUnitPrice,
          totalPrice,
          notes,
        },
        include: {
          supplier: true,
          purchaseRequest: true,
        },
      })
    }

    return NextResponse.json(bid, { status: 201 })
  } catch (error: any) {
    console.error("Supplier Bids POST Error:", error)
    return NextResponse.json({ error: error.message || "Failed to submit bid" }, { status: 500 })
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json()
    const { bidId, isWinning } = body

    if (!bidId) {
      return NextResponse.json({ error: "bidId gerekli" }, { status: 400 })
    }

    const targetBid = await prisma.supplierBid.findUnique({
      where: { id: bidId },
    })

    if (!targetBid) {
      return NextResponse.json({ error: "Teklif bulunamadı" }, { status: 404 })
    }

    if (isWinning) {
      // 1. Reset all other bids for this purchaseRequest to false
      await prisma.supplierBid.updateMany({
        where: { purchaseRequestId: targetBid.purchaseRequestId },
        data: { isWinningBid: false },
      })

      // 2. Mark this bid as winning
      const updatedBid = await prisma.supplierBid.update({
        where: { id: bidId },
        data: { isWinningBid: true },
      })

      // 3. Mark purchase request as COMPLETED
      await prisma.purchaseRequest.update({
        where: { id: targetBid.purchaseRequestId },
        data: { status: "COMPLETED" },
      })

      return NextResponse.json({ success: true, winningBid: updatedBid })
    } else {
      const updatedBid = await prisma.supplierBid.update({
        where: { id: bidId },
        data: { isWinningBid: false },
      })
      return NextResponse.json({ success: true, updatedBid })
    }
  } catch (error: any) {
    console.error("Supplier Bids PATCH Error:", error)
    return NextResponse.json({ error: error.message || "Failed to update bid" }, { status: 500 })
  }
}
