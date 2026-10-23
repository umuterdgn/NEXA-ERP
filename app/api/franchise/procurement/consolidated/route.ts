/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Franchise Konsolide Satınalma ve Toplu İhale API'si
 */

import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 })
    }

    // 1. Mevcut Konsolide Paketler
    const consolidatedList = await prisma.consolidatedProcurement.findMany({
      include: {
        requests: {
          include: {
            project: {
              select: { id: true, name: true, city: true, district: true },
            },
            bids: {
              include: { supplier: true },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    })

    // 2. Henüz konsolide edilmemiş açık satınalma talepleri (Şantiyelerden gelenler)
    const openRequests = await prisma.purchaseRequest.findMany({
      where: {
        consolidatedId: null,
      },
      include: {
        project: {
          select: { id: true, name: true, city: true, district: true },
        },
      },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json({
      consolidatedList,
      openRequests,
    })
  } catch (error: any) {
    console.error("❌ Consolidated Procurement GET Error:", error)
    return NextResponse.json({ error: error.message || "Talepler alınamadı" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 })
    }

    const body = await request.json()
    const { title, requestIds } = body

    if (!title || !requestIds || !Array.isArray(requestIds) || requestIds.length === 0) {
      return NextResponse.json(
        { error: "Başlık ve en az bir talep seçimi zorunludur" },
        { status: 400 }
      )
    }

    // Konsolide paketi oluştur ve talepleri bağla
    const consolidated = await prisma.consolidatedProcurement.create({
      data: {
        title,
        status: "TENDER_ACTIVE", // Toplu ihale açıldı
        requests: {
          connect: requestIds.map((id: string) => ({ id })),
        },
      },
      include: {
        requests: {
          include: { project: true },
        },
      },
    })

    return NextResponse.json({ consolidated }, { status: 201 })
  } catch (error: any) {
    console.error("❌ Consolidated Procurement POST Error:", error)
    return NextResponse.json({ error: error.message || "Toplu ihale paketi oluşturulamadı" }, { status: 500 })
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

    const updated = await prisma.consolidatedProcurement.update({
      where: { id },
      data: { status },
      include: {
        requests: {
          include: { project: true },
        },
      },
    })

    return NextResponse.json({ consolidated: updated })
  } catch (error: any) {
    console.error("❌ Consolidated Procurement PATCH Error:", error)
    return NextResponse.json({ error: error.message || "İhale güncellenemedi" }, { status: 500 })
  }
}
