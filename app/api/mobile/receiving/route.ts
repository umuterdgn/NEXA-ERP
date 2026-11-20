/**
 * © 2026 NXA Software. All rights reserved.
 * Nexa Mobile - Goods Receipt & Waybill OCR API (Auth & Tenant Isolated)
 */

import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getMobileAuth } from "@/lib/mobile-auth"
import { assertTenantAndProjectAccess, requireAnyModule } from "@/lib/api-rbac"

export const dynamic = "force-dynamic"

export async function POST(request: Request) {
  try {
    const auth = await getMobileAuth(request)
    if (!auth) {
      return NextResponse.json({ error: "Yetkisiz oturum." }, { status: 401 })
    }

    const denied = requireAnyModule(auth, ["goods_receiving"])
    if (denied) return denied

    const { tenantId, assignedProjectIds } = auth
    const body = await request.json().catch(() => ({}))
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
      return NextResponse.json({ error: "Malzeme adı ve miktar zorunludur" }, { status: 400 })
    }

    const qty = Number(quantity)
    if (isNaN(qty) || qty <= 0) {
      return NextResponse.json({ error: "Geçerli bir miktar girilmelidir" }, { status: 400 })
    }

    if (incomingProjectId) {
      const accessErr = await assertTenantAndProjectAccess(auth, incomingProjectId)
      if (accessErr) return accessErr
    }

    const targetProjId = incomingProjectId || assignedProjectIds[0]
    const project = targetProjId
      ? await prisma.project.findFirst({ where: { id: targetProjId, ...(tenantId ? { tenantId } : {}) } })
      : await prisma.project.findFirst({ where: { ...(tenantId ? { tenantId } : {}), deletedAt: null } })

    const projectId = project?.id || null

    let inventoryItem = await prisma.inventoryItem.findFirst({
      where: {
        materialName: { equals: materialName, mode: "insensitive" },
        ...(tenantId ? { tenantId } : {}),
        ...(projectId ? { projectId } : {}),
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
          tenantId,
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

    const transaction = await prisma.inventoryTransaction.create({
      data: {
        tenantId,
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
    return NextResponse.json({ error: error.message || "İrsaliye kaydı başarısız oldu" }, { status: 500 })
  }
}
