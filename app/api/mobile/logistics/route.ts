/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Mobil Şantiye Lojistik, İrsaliye Kabul, Ambar QR Tüketim ve Malzeme Talepleri API
 */

import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getMobileAuth } from "@/lib/mobile-auth"
import {
  assertRecordTenantScope,
  assertTenantAndProjectAccess,
  requireAnyModule,
} from "@/lib/api-rbac"

const LOGISTICS_MODULES = [
  "logistics_appointments",
  "driver_deliveries",
  "goods_receiving",
  "warehouse_inventory",
  "qr_micro_consumption",
  "material_requests",
  "gate_security",
  "procurement",
] as const

export async function GET(request: Request) {
  try {
    const auth = await getMobileAuth(request)
    if (!auth) {
      return NextResponse.json({ error: "Yetkisiz oturum." }, { status: 401 })
    }

    const denied = requireAnyModule(auth, [...LOGISTICS_MODULES])
    if (denied) return denied

    const { tenantId, assignedProjectIds } = auth
    const url = new URL(request.url)
    const reqProjectId = url.searchParams.get("projectId")
    if (reqProjectId) {
      const accessErr = await assertTenantAndProjectAccess(auth, reqProjectId)
      if (accessErr) return accessErr
    }
    const projectId = reqProjectId || (assignedProjectIds[0] ?? undefined)
    const type = url.searchParams.get("type") // "APPOINTMENTS", "WAREHOUSE", "REQUESTS", "ALL"

    const [appointments, inventory, requests] = await Promise.all([
      type === "WAREHOUSE" || type === "REQUESTS"
        ? []
        : prisma.logisticsSchedule.findMany({
            where: {
              ...(tenantId ? { tenantId } : {}),
              ...(projectId ? { projectId } : {}),
            },
            orderBy: { scheduledAt: "asc" },
            take: 25,
            include: {
              project: { select: { id: true, title: true } },
            },
          }),
      type === "APPOINTMENTS" || type === "REQUESTS"
        ? []
        : prisma.inventory.findMany({
            where: {
              ...(tenantId ? { tenantId } : {}),
              ...(projectId ? { projectId } : {}),
            },
            take: 30,
            select: {
              id: true,
              name: true,
              category: true,
              quantity: true,
              unit: true,
              minimumStockLevel: true,
              qrCode: true,
            },
          }),
      type === "APPOINTMENTS" || type === "WAREHOUSE"
        ? []
        : prisma.materialRequest.findMany({
            where: {
              ...(tenantId ? { tenantId } : {}),
              ...(projectId ? { projectId } : {}),
            },
            orderBy: { createdAt: "desc" },
            take: 20,
            include: {
              requester: { select: { id: true, name: true } },
            },
          }),
    ])

    return NextResponse.json({
      success: true,
      appointments: appointments.map((a) => ({
        id: a.id,
        plateNumber: a.vehiclePlate,
        driverName: a.driverName,
        driverPhone: a.driverContact,
        supplierName: a.supplierName,
        materialType: a.type,
        estimatedArrival: a.scheduledAt,
        status: a.status,
        project: a.project?.title,
      })),
      inventory: inventory.map((i) => ({
        id: i.id,
        name: i.name,
        category: i.category,
        quantity: i.quantity,
        unit: i.unit,
        isLowStock: i.minimumStockLevel != null ? i.quantity <= i.minimumStockLevel : false,
        qrCode: i.qrCode,
      })),
      requests: requests.map((r) => ({
        id: r.id,
        itemName: r.itemName,
        quantity: r.quantity,
        unit: r.unit,
        urgency: r.urgency,
        status: r.status,
        requester: r.requester?.name,
        createdAt: r.createdAt,
      })),
    })
  } catch (error: any) {
    console.error("Mobile logistics GET error:", error)
    return NextResponse.json({ error: "Lojistik verileri alınamadı." }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const auth = await getMobileAuth(request)
    if (!auth) {
      return NextResponse.json({ error: "Yetkisiz oturum." }, { status: 401 })
    }

    const denied = requireAnyModule(auth, [...LOGISTICS_MODULES])
    if (denied) return denied

    const { userId, tenantId, assignedProjectIds, email } = auth
    const body = await request.json().catch(() => ({}))
    const { action } = body // "GATE_CHECKIN", "RECEIVE_GOODS", "CONSUME_QR", "CREATE_REQUEST"

    if (body.projectId) {
      const accessErr = await assertTenantAndProjectAccess(auth, body.projectId)
      if (accessErr) return accessErr
    }

    const targetProjectId =
      body.projectId ||
      assignedProjectIds[0] ||
      (tenantId ? (await prisma.project.findFirst({ where: { tenantId, deletedAt: null } }))?.id : undefined)

    if (action === "GATE_CHECKIN") {
      const { scheduleId } = body
      if (scheduleId) {
        const existing = await prisma.logisticsSchedule.findUnique({ where: { id: scheduleId } })
        if (!existing) return NextResponse.json({ error: "Sevkiyat bulunamadı." }, { status: 404 })
        const scopeErr = assertRecordTenantScope(auth, existing)
        if (scopeErr) return scopeErr
        const updated = await prisma.logisticsSchedule.update({
          where: { id: scheduleId },
          data: { status: "IN_TRANSIT" },
        })
        return NextResponse.json({ success: true, message: "Araç kapı girişi onaylandı.", schedule: updated })
      }
      return NextResponse.json({ error: "Sevkiyat randevu ID gereklidir." }, { status: 400 })
    }

    if (action === "RECEIVE_GOODS") {
      const { scheduleId } = body
      if (scheduleId) {
        const existing = await prisma.logisticsSchedule.findUnique({ where: { id: scheduleId } })
        if (!existing) return NextResponse.json({ error: "Randevu bulunamadı." }, { status: 404 })
        const scopeErr = assertRecordTenantScope(auth, existing)
        if (scopeErr) return scopeErr
        const updated = await prisma.logisticsSchedule.update({
          where: { id: scheduleId },
          data: {
            status: "DELIVERED",
            receivedById: userId,
          },
        })
        return NextResponse.json({ success: true, message: "Malzeme kabulü (tesellüm) tamamlandı.", schedule: updated })
      }
      return NextResponse.json({ error: "Randevu ID gereklidir." }, { status: 400 })
    }

    if (action === "CONSUME_QR") {
      const { qrCode, quantity } = body
      if (!qrCode) {
        return NextResponse.json({ error: "Karekod okutulmalıdır." }, { status: 400 })
      }
      const item = await prisma.inventory.findFirst({
        where: {
          OR: [{ qrCode }, { id: qrCode }],
          ...(tenantId ? { tenantId } : {}),
        },
      })
      if (!item) {
        return NextResponse.json({ error: "Karekoda ait malzeme bulunamadı." }, { status: 404 })
      }
      const consumeQty = Number(quantity) || 1
      if (item.quantity < consumeQty) {
        return NextResponse.json({ error: `Yetersiz stok. Mevcut stok: ${item.quantity} ${item.unit}` }, { status: 400 })
      }
      const updated = await prisma.inventory.update({
        where: { id: item.id },
        data: { quantity: item.quantity - consumeQty },
      })
      return NextResponse.json({
        success: true,
        message: `${consumeQty} ${item.unit} ${item.name} sarfiyatı kaydedildi.`,
        remainingQuantity: updated.quantity,
      })
    }

    if (action === "CREATE_REQUEST") {
      const { itemName, quantity, unit, urgency, description } = body
      if (!itemName) {
        return NextResponse.json({ error: "Malzeme adı gereklidir." }, { status: 400 })
      }

      const personel = await prisma.personel.findFirst({
        where: {
          OR: [
            { userId },
            ...(email ? [{ email }] : []),
          ],
        },
        select: { id: true },
      })

      const requesterId =
        personel?.id ||
        (tenantId ? (await prisma.personel.findFirst({ where: { tenantId } }))?.id : undefined)
      if (!requesterId || !targetProjectId) {
        return NextResponse.json({ error: "Kayıtlı personel veya proje bulunamadı." }, { status: 400 })
      }

      const req = await prisma.materialRequest.create({
        data: {
          tenantId,
          projectId: targetProjectId,
          requesterId,
          itemName,
          quantity: Math.round(Number(quantity) || 1),
          unit: unit || "Adet",
          urgency: urgency || "NORMAL",
          notes: description || null,
          status: "PENDING",
        },
      })
      return NextResponse.json({ success: true, message: "Malzeme talebi oluşturuldu.", request: req })
    }

    return NextResponse.json({ error: "Geçersiz eylem (action)." }, { status: 400 })
  } catch (error: any) {
    console.error("Mobile logistics POST error:", error)
    return NextResponse.json({ error: "İşlem gerçekleştirilemedi." }, { status: 500 })
  }
}
