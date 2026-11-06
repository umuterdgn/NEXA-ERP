/**
 * © 2026 NXA Software. All rights reserved.
 * Nexa Mobile - Goods Receipt & Waybill OCR API
 * Saves verified waybill data into Prisma Inventory & InventoryTransaction
 */

import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const {
      waybillNo,
      supplierName,
      materialName,
      quantity,
      unit,
      totalAmount,
      currency,
      photoUrl,
      notes,
      projectId: incomingProjectId,
    } = body

    if (!materialName || !quantity) {
      return NextResponse.json(
        { error: "Malzeme adı ve miktar zorunludur" },
        { status: 400 }
      )
    }

    const qty = Number(quantity)
    if (isNaN(qty) || qty <= 0) {
      return NextResponse.json(
        { error: "Geçerli bir miktar girilmelidir" },
        { status: 400 }
      )
    }

    // 1. Proje tespiti
    let project = incomingProjectId
      ? await prisma.project.findUnique({ where: { id: incomingProjectId } })
      : await prisma.project.findFirst()

    const projectId = project?.id

    // 2. Envanterde aynı malzeme var mı kontrol et veya yeni envanter kalemi aç
    let inventoryItem = await prisma.inventoryItem.findFirst({
      where: {
        materialName: { equals: materialName, mode: "insensitive" },
        projectId: projectId || undefined,
      },
    })

    const generatedQr = `QR-MAT-${Date.now().toString().slice(-6)}`

    if (inventoryItem) {
      inventoryItem = await prisma.inventoryItem.update({
        where: { id: inventoryItem.id },
        data: {
          quantity: inventoryItem.quantity + qty,
          status: "IN_STOCK",
          locationStatus: "DEPO",
          unit: unit || inventoryItem.unit || "Adet",
        },
      })
    } else {
      inventoryItem = await prisma.inventoryItem.create({
        data: {
          materialName,
          name: materialName,
          quantity: qty,
          unit: unit || "Adet",
          qrCode: generatedQr,
          currentZone: "MAIN_WAREHOUSE",
          status: "IN_STOCK",
          locationStatus: "DEPO",
          projectId,
        },
      })
    }

    // 3. Giriş İşlemi (Transaction IN)
    const transaction = await prisma.inventoryTransaction.create({
      data: {
        inventoryItemId: inventoryItem.id,
        type: "IN",
        quantity: qty,
        unit: unit || "Adet",
        source: waybillNo ? `İrsaliye: ${waybillNo} (${supplierName || "Tedarikçi"})` : supplierName || "Tedarikçi Girişi",
        destination: "MAIN_WAREHOUSE",
        scannedCode: waybillNo || inventoryItem.qrCode,
        notes: `${notes || ""}${totalAmount ? ` | Tutar: ${totalAmount} ${currency || "TL"}` : ""}${photoUrl ? ` | Fotoğraf: ${photoUrl}` : ""}`,
        projectId,
      },
    })

    return NextResponse.json({
      success: true,
      message: "İrsaliye ve malzeme kabulü başarıyla kaydedildi.",
      item: inventoryItem,
      transaction,
    })
  } catch (error: any) {
    console.error("[API_MOBILE_RECEIVING] Error:", error)
    return NextResponse.json(
      { error: error.message || "İrsaliye kaydı başarısız oldu" },
      { status: 500 }
    )
  }
}

