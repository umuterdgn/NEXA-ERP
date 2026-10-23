/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Malzeme Tüketimi (QR Consume) API
 */

import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

export const dynamic = "force-dynamic"

export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 })
    }

    const body = await request.json()
    const { qrCode, targetZone, notes } = body

    if (!qrCode) {
      return NextResponse.json({ error: "QR Kod zorunludur" }, { status: 400 })
    }

    // Malzemeyi QR Kod ile bul
    const item = await prisma.inventoryItem.findFirst({
      where: {
        OR: [{ qrCode: qrCode.trim() }, { id: qrCode.trim() }],
      },
      include: {
        project: {
          select: { id: true, name: true },
        },
      },
    })

    if (!item) {
      return NextResponse.json(
        { error: `"${qrCode}" koduna ait envanter malzemesi bulunamadı.` },
        { status: 404 }
      )
    }

    if (item.status === "CONSUMED") {
      return NextResponse.json(
        {
          error: `"${item.materialName || item.name}" malzemesi zaten ${
            item.consumedAt ? new Date(item.consumedAt).toLocaleDateString("tr-TR") : "daha önce"
          } tarihinde tüketildi olarak işaretlenmiş! (Mevcut Lokasyon: ${item.currentZone})`,
          item,
        },
        { status: 400 }
      )
    }

    const updatedZone = targetZone?.trim() || item.currentZone || "SAHA_TUKETILDI"

    // Malzemenin durumunu CONSUMED ve kat/blok konumunu güncelle
    const updated = await prisma.inventoryItem.update({
      where: { id: item.id },
      data: {
        status: "CONSUMED",
        locationStatus: "KULLANILDI",
        currentZone: updatedZone,
        consumedAt: new Date(),
        assignedTo: session.user.name || session.user.email,
      },
      include: {
        project: {
          select: { id: true, name: true },
        },
      },
    })

    return NextResponse.json({
      success: true,
      message: `"${updated.materialName || updated.name}" başarıyla ${updatedZone} kat/bloğunda tüketildi olarak kaydedildi.`,
      item: updated,
    })
  } catch (error: any) {
    console.error("❌ Inventory Consume error:", error)
    return NextResponse.json({ error: error.message || "Tüketim işlemi başarısız" }, { status: 500 })
  }
}
