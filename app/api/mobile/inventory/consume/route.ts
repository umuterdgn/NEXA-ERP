/**
 * © 2026 NXA Software. All rights reserved.
 * Nexa Mobile - QR Material Consumption API
 * Reads stock by QR Code, decrements stock in Prisma DB and logs task material consumption.
 */

import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const qrCode = searchParams.get("qrCode")

    if (!qrCode) {
      // Barkod/QR olmadan tüm stoktaki malzemeleri döndür
      const items = await prisma.inventoryItem.findMany({
        where: { quantity: { gt: 0 } },
        take: 30,
        orderBy: { createdAt: "desc" },
      })
      return NextResponse.json({ success: true, items })
    }

    const item = await prisma.inventoryItem.findFirst({
      where: {
        OR: [
          { qrCode },
          { barcode: qrCode },
          { id: qrCode },
        ],
      },
      include: {
        project: {
          select: { id: true, name: true },
        },
      },
    })

    if (!item) {
      return NextResponse.json(
        { error: "Bu QR koda ait malzeme bulunamadı" },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true, item })
  } catch (error: any) {
    console.error("[API_MOBILE_INVENTORY_CONSUME_GET] Error:", error)
    return NextResponse.json(
      { error: error.message || "Stok bilgisi sorgulanamadı" },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { qrCode, quantity, taskId, notes, zoneName } = body

    if (!qrCode || !quantity) {
      return NextResponse.json(
        { error: "QR Kod ve tüketim miktarı zorunludur" },
        { status: 400 }
      )
    }

    const consumeQty = Number(quantity)
    if (isNaN(consumeQty) || consumeQty <= 0) {
      return NextResponse.json(
        { error: "Geçerli bir tüketim miktarı giriniz" },
        { status: 400 }
      )
    }

    // 1. Malzemeyi bul
    const item = await prisma.inventoryItem.findFirst({
      where: {
        OR: [
          { qrCode },
          { barcode: qrCode },
          { id: qrCode },
        ],
      },
    })

    if (!item) {
      return NextResponse.json(
        { error: "Karekod ile eşleşen ambar malzemesi bulunamadı" },
        { status: 404 }
      )
    }

    if (item.quantity < consumeQty) {
      return NextResponse.json(
        {
          error: `Yetersiz stok! Mevcut stok: ${item.quantity} ${item.unit || "Adet"}, istenen: ${consumeQty}`,
        },
        { status: 400 }
      )
    }

    // 2. Stoktan düş
    const remainingQty = item.quantity - consumeQty
    const updatedItem = await prisma.inventoryItem.update({
      where: { id: item.id },
      data: {
        quantity: remainingQty,
        status: remainingQty === 0 ? "CONSUMED" : "IN_STOCK",
        consumedAt: remainingQty === 0 ? new Date() : undefined,
      },
    })

    // 3. Stok çıkış hareketi (Transaction OUT)
    const transaction = await prisma.inventoryTransaction.create({
      data: {
        inventoryItemId: item.id,
        type: "OUT",
        quantity: consumeQty,
        unit: item.unit || "Adet",
        source: item.currentZone || "MAIN_WAREHOUSE",
        destination: zoneName || "Şantiye İmalat Sahası",
        scannedCode: qrCode,
        notes: `${notes || "Saha sarfiyatı"}${taskId ? ` | Görev: ${taskId}` : ""}`,
        projectId: item.projectId,
      },
    })

    // 4. Eğer bir Task'a bağlanmışsa, task açıklamasına veya ilerlemesine not düş
    if (taskId) {
      await prisma.task.update({
        where: { id: taskId },
        data: {
          description: {
            set: `${item.materialName} sarfiyatı yapıldı: ${consumeQty} ${item.unit || "Adet"}.`,
          },
        },
      }).catch(() => null)
    }

    return NextResponse.json({
      success: true,
      message: `${consumeQty} ${item.unit || "Adet"} ${item.materialName} başarıyla stoktan düşüldü.`,
      remainingQuantity: remainingQty,
      item: updatedItem,
      transaction,
    })
  } catch (error: any) {
    console.error("[API_MOBILE_INVENTORY_CONSUME_POST] Error:", error)
    return NextResponse.json(
      { error: error.message || "Malzeme tüketim kaydı oluşturulamadı" },
      { status: 500 }
    )
  }
}

