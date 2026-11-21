/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * GET /api/mobile/ble/devices
 * Zimmetli BLE Kart / Baret / Ekipman Yakınlık Radarı Envanter Ucu (Sıfır Mock)
 */

import { NextResponse } from "next/server"
import { getMobileAuth } from "@/lib/mobile-auth"
import { prisma } from "@/lib/prisma"
import { assertTenantAndProjectAccess, requireAnyModule } from "@/lib/api-rbac"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const PERSONAL_BLE_ROLES = new Set(["WORKER", "DRIVER", "STAFF", "FITOUT_TECH"])
const MANAGER_BLE_ROLES = new Set([
  "SITE_MANAGER",
  "ENGINEER",
  "ISG_EXPERT",
  "EQUIPMENT_MANAGER",
  "WAREHOUSE_MANAGER",
  "ADMIN",
  "PROJECT_MANAGER",
  "SUPER_ADMIN",
])

export async function GET(request: Request) {
  try {
    const auth = await getMobileAuth(request)
    if (!auth) {
      return NextResponse.json({ error: "Yetkisiz oturum." }, { status: 401 })
    }

    const denied = requireAnyModule(auth, ["ble_radar"])
    if (denied) return denied

    const { userId, email, role, tenantId, assignedProjectIds } = auth
    const isPersonalScope = PERSONAL_BLE_ROLES.has(role)
    const isManagerScope = MANAGER_BLE_ROLES.has(role)

    if (!isPersonalScope && !isManagerScope) {
      return NextResponse.json(
        { error: "Rolünüz BLE yakınlık radarı verilerine erişim yetkisine sahip değil." },
        { status: 403 }
      )
    }

    const url = new URL(request.url)
    const reqProjectId = url.searchParams.get("projectId")

    if (reqProjectId) {
      const accessErr = await assertTenantAndProjectAccess(auth, reqProjectId)
      if (accessErr) return accessErr
    }

    // Kullanıcının Personel kaydını bul (zimmetli BLE & ekipman eşlemesi için)
    const myPersonel = await prisma.personel.findFirst({
      where: {
        ...(tenantId ? { tenantId } : {}),
        OR: [{ userId }, ...(email ? [{ email }] : [])],
      },
      select: { id: true, name: true, projectId: true },
    })

    let bleWhere: any = {
      ...(tenantId ? { tenantId } : {}),
    }
    let equipWhere: any = {
      ...(tenantId ? { tenantId } : {}),
      bleTagId: { not: null },
    }

    if (isPersonalScope) {
      const personalOr: any[] = [{ userId }]
      if (myPersonel?.id) {
        personalOr.push({ assignedTo: myPersonel.id })
      }
      bleWhere.OR = personalOr

      if (myPersonel?.id) {
        equipWhere.assignedToId = myPersonel.id
      } else {
        equipWhere.id = "__none__"
      }

      if (reqProjectId) {
        bleWhere.projectId = reqProjectId
        equipWhere.projectId = reqProjectId
      }
    } else {
      // Şantiye şefi / İSG / Ekipman Sorumlusu / Yönetici kapsamı
      if (reqProjectId) {
        bleWhere.projectId = reqProjectId
        equipWhere.projectId = reqProjectId
      } else if (assignedProjectIds.length > 0) {
        bleWhere.projectId = { in: assignedProjectIds }
        equipWhere.projectId = { in: assignedProjectIds }
      } else if (!["ADMIN", "PROJECT_MANAGER", "SUPER_ADMIN"].includes(role)) {
        bleWhere.projectId = { in: ["__none__"] }
        equipWhere.projectId = { in: ["__none__"] }
      }
    }

    const [bleDevices, taggedEquipments] = await Promise.all([
      prisma.bleDevice.findMany({
        where: bleWhere,
        orderBy: [{ lastSeenAt: "desc" }, { id: "asc" }],
        take: 100,
        include: {
          user: { select: { id: true, name: true } },
        },
      }),
      prisma.equipment.findMany({
        where: equipWhere,
        orderBy: [{ lastSeenAt: "desc" }, { createdAt: "desc" }],
        take: 100,
        include: {
          assignedTo: { select: { id: true, name: true } },
        },
      }),
    ])

    // Personel isimlerini çözümle
    const assignedPersonelIds = bleDevices
      .map((d) => d.assignedTo)
      .filter((id): id is string => Boolean(id))

    const personelNameMap: Record<string, string> = {}
    if (assignedPersonelIds.length > 0) {
      const personels = await prisma.personel.findMany({
        where: { id: { in: assignedPersonelIds } },
        select: { id: true, name: true },
      })
      for (const p of personels) {
        personelNameMap[p.id] = p.name
      }
    }

    const devices = [
      ...bleDevices.map((d) => {
        const assignedName =
          d.user?.name || (d.assignedTo ? personelNameMap[d.assignedTo] : null) || null
        return {
          id: d.id,
          sourceType: "BLE_DEVICE" as const,
          name:
            d.name ||
            `${d.deviceType}${assignedName ? ` (${assignedName})` : ""}`,
          macAddress: d.macAddress,
          uuid: d.uuid || null,
          txPower: d.txPower ?? -59,
          type: d.deviceType,
          status: d.status || "ACTIVE",
          batteryLevel: d.batteryLevel ?? 100,
          lastSeenAt: d.lastSeenAt ? d.lastSeenAt.toISOString() : null,
          lastLat: d.lastLat ?? null,
          lastLng: d.lastLng ?? null,
          lastRssi: d.lastRssi ?? null,
          proximityZone: d.proximityZone ?? null,
          assignedToName: assignedName,
          projectId: d.projectId,
        }
      }),
      ...taggedEquipments.map((eq) => ({
        id: eq.id,
        sourceType: "EQUIPMENT" as const,
        name: eq.name,
        macAddress: eq.bleTagId || eq.serialNumber || eq.id,
        uuid: null,
        txPower: -59,
        type: eq.type || "EKIPMAN",
        status: eq.status === "LOST" ? "LOST" : "ACTIVE",
        batteryLevel: null,
        lastSeenAt: eq.lastSeenAt ? eq.lastSeenAt.toISOString() : null,
        lastLat: eq.lastLat ?? eq.latitude ?? null,
        lastLng: eq.lastLng ?? eq.longitude ?? null,
        lastRssi: null,
        proximityZone: null,
        assignedToName: eq.assignedTo?.name || null,
        projectId: eq.projectId || null,
      })),
    ]

    return NextResponse.json({
      success: true,
      scope: isPersonalScope ? "PERSONAL" : "PROJECT",
      count: devices.length,
      devices,
    })
  } catch (error: any) {
    console.error("Mobile BLE devices GET error:", error)
    return NextResponse.json({ error: "BLE cihaz listesi alınamadı." }, { status: 500 })
  }
}

