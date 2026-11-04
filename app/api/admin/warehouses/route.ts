/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Nexa ERP - Merkez Depo Yönetim API
 */

import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

export const dynamic = "force-dynamic"

const DEFAULT_WAREHOUSES = [
  {
    name: "Tuzla Merkez Lojistik Deposu",
    code: "DEP-01",
    address: "Tepeören Mah. Lojistik Vadisi No:14, Tuzla",
    city: "İstanbul",
    latitude: 40.8986,
    longitude: 29.3597,
    contactName: "Murat Çetin (Depo Müdürü)",
    phone: "0532 999 10 20",
    isActive: true,
  },
  {
    name: "Gebze BİM Fit-Out & Prefabrik Merkezi",
    code: "DEP-02",
    address: "Güzeller OSB 4. Cadde No:8, Gebze",
    city: "Kocaeli",
    latitude: 40.8027,
    longitude: 29.4307,
    contactName: "Serkan Yılmaz (Lojistik Sorumlusu)",
    phone: "0533 888 30 40",
    isActive: true,
  },
  {
    name: "Hadımköy Avrupa Dağıtım Deposu",
    code: "DEP-03",
    address: "Ömerli Mah. Sanayi Cad. No:22, Hadımköy",
    city: "İstanbul",
    latitude: 41.1352,
    longitude: 28.6185,
    contactName: "Cemil Arslan (Saha Şefi)",
    phone: "0535 777 50 60",
    isActive: true,
  },
  {
    name: "Ankara Temelli Bölge Deposu",
    code: "DEP-04",
    address: "Başkent OSB 12. Cadde No:5, Malıköy/Sincan",
    city: "Ankara",
    latitude: 39.8152,
    longitude: 32.4836,
    contactName: "Erkan Koç (İç Anadolu Sorumlusu)",
    phone: "0530 666 70 80",
    isActive: true,
  },
]

export async function GET() {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const tenantId = (session.user as any)?.tenantId || null
    const tenantFilter = tenantId ? { OR: [{ tenantId }, { tenantId: null }] } : {}

    let warehouses = await (prisma as any).warehouse.findMany({
      where: {
        ...tenantFilter,
        isActive: true,
      },
      orderBy: { createdAt: "asc" },
    })

    // Otomatik Seed (Eğer hiç depo yoksa varsayılan merkez depoları ekle)
    if (!warehouses || warehouses.length === 0) {
      const seeded = []
      for (const item of DEFAULT_WAREHOUSES) {
        const created = await (prisma as any).warehouse.create({
          data: {
            ...item,
            tenantId,
          },
        }).catch(() => null)
        if (created) seeded.push(created)
      }
      warehouses = seeded.length > 0 ? seeded : DEFAULT_WAREHOUSES
    }

    return NextResponse.json(warehouses)
  } catch (error) {
    console.error("Warehouses fetch error:", error)
    // Hata durumunda dahi çökme olmaması için varsayılan listeyi dön
    return NextResponse.json(DEFAULT_WAREHOUSES)
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const tenantId = (session.user as any)?.tenantId || null
    const body = await req.json()
    const { name, code, address, city, latitude, longitude, contactName, phone } = body

    if (!name) {
      return NextResponse.json({ error: "Depo adı zorunludur" }, { status: 400 })
    }

    const warehouse = await (prisma as any).warehouse.create({
      data: {
        tenantId,
        name,
        code: code || null,
        address: address || null,
        city: city || null,
        latitude: latitude ? parseFloat(latitude) : 40.8986,
        longitude: longitude ? parseFloat(longitude) : 29.3597,
        contactName: contactName || null,
        phone: phone || null,
        isActive: true,
      },
    })

    return NextResponse.json(warehouse, { status: 201 })
  } catch (error: any) {
    console.error("Warehouse create error:", error)
    return NextResponse.json({ error: error?.message || "Internal server error" }, { status: 500 })
  }
}

