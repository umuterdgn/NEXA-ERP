/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Superadmin Global System Announcements (Broadcasts) API
 */

import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const session = await auth()
    if (session?.user?.role !== "SUPER_ADMIN" && session?.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 403 })
    }

    let announcements = await (prisma as any).systemAnnouncement.findMany({
      orderBy: { createdAt: "desc" },
    }).catch(() => [])

    // Örnek duyurular
    if (!announcements || announcements.length === 0) {
      const demoAnnouncements = [
        {
          title: "Sistem Planlı Bakım Bildirisi",
          message: "Pazar gecesi 02:00 - 04:00 saatleri arasında Bakanlık EBİS & UYDS gateway hatlarında planlı sunucu güncellemesi yapılacaktır.",
          type: "MAINTENANCE",
          target: "ALL",
          isActive: true,
        },
        {
          title: "Yeni BIM 3D Viewer v2.4 Yayında!",
          message: "500MB üzeri IFC modellerinde %60 daha hızlı render performansı ve kat bazlı filtreleme özellikleri eklendi.",
          type: "INFO",
          target: "ALL",
          isActive: true,
        },
        {
          title: "T.C. ÇŞİDB Beton Numune Barkod Zorunluluğu",
          message: "1 Kasım itibariyle RFID çipli beton karot numuneleri haricindeki tutanaklar Bakanlık tarafından otomatik askıya alınacaktır.",
          type: "WARNING",
          target: "INSPECTORS",
          isActive: true,
        },
      ]

      for (const a of demoAnnouncements) {
        await (prisma as any).systemAnnouncement.create({ data: a }).catch(() => null)
      }

      announcements = await (prisma as any).systemAnnouncement.findMany({
        orderBy: { createdAt: "desc" },
      }).catch(() => [])
    }

    return NextResponse.json({ success: true, data: announcements || [] })
  } catch (error) {
    console.error("Broadcasts API Hatası:", error)
    return NextResponse.json({ success: false, error: "Duyurular çekilemedi" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth()
    if (session?.user?.role !== "SUPER_ADMIN" && session?.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 403 })
    }

    const body = await request.json()
    const { title, message, type, target } = body

    if (!title || !message) {
      return NextResponse.json({ error: "Başlık ve mesaj zorunludur" }, { status: 400 })
    }

    const announcement = await (prisma as any).systemAnnouncement.create({
      data: {
        title,
        message,
        type: type || "INFO",
        target: target || "ALL",
        isActive: true,
      },
    })

    return NextResponse.json({ success: true, data: announcement })
  } catch (error) {
    console.error("Create Broadcast Hatası:", error)
    return NextResponse.json({ success: false, error: "Duyuru yayınlanamadı" }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await auth()
    if (session?.user?.role !== "SUPER_ADMIN" && session?.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 403 })
    }

    const body = await request.json()
    const { id, isActive, action } = body

    if (!id) {
      return NextResponse.json({ error: "Duyuru ID zorunludur" }, { status: 400 })
    }

    if (action === "DELETE") {
      await (prisma as any).systemAnnouncement.delete({ where: { id } })
      return NextResponse.json({ success: true, message: "Duyuru silindi" })
    }

    const updated = await (prisma as any).systemAnnouncement.update({
      where: { id },
      data: {
        ...(typeof isActive === "boolean" ? { isActive } : {}),
      },
    })

    return NextResponse.json({ success: true, data: updated })
  } catch (error) {
    console.error("Update Broadcast Hatası:", error)
    return NextResponse.json({ success: false, error: "Duyuru güncellenemedi" }, { status: 500 })
  }
}
