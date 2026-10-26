/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Superadmin Helpdesk & Support Tickets API
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

    let tickets = await (prisma as any).supportTicket.findMany({
      include: {
        tenant: {
          select: {
            id: true,
            name: true,
            type: true,
            subscriptionPlan: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    }).catch(() => [])

    // Eğer veritabanında henüz bilet yoksa, ilk kurulum için örnek biletler üret ve kaydet
    if (!tickets || tickets.length === 0) {
      const firstTenant = await prisma.tenant.findFirst({ select: { id: true } })
      if (firstTenant) {
        const demoTickets = [
          {
            tenantId: firstTenant.id,
            userId: session.user.id || "admin",
            subject: "BIM IFC Modeli Yükleme Hatası (500MB üzeri)",
            message: "12. Blok projesinin 540 MB'lık IFC modelini sisteme yüklerken ağ zaman aşımı hatası almaktayız. Depolama limitimizi kontrol edebilir misiniz?",
            status: "OPEN",
            priority: "HIGH",
          },
          {
            tenantId: firstTenant.id,
            userId: session.user.id || "admin",
            subject: "Bakanlık UYDS Entegrasyon İzni Hakkında",
            message: "Kadıköy şantiyemiz için UYDS ruhsat verilerini otomatik senkronize etmek istiyoruz. Bakanlık token yenilemesi gerekiyor mu?",
            status: "IN_PROGRESS",
            priority: "MEDIUM",
            response: "Token entegrasyonu tarafımızdan test edildi. 24 saat içerisinde otomatik yenilenecektir.",
          },
          {
            tenantId: firstTenant.id,
            userId: session.user.id || "admin",
            subject: "Yeni Saha Denetçisi Lisansı Ekleme",
            message: "Firmamıza 5 adet ek saha denetçisi personeli eklemek istiyoruz. Lisans kotamızı arttırabilir misiniz?",
            status: "RESOLVED",
            priority: "LOW",
            response: "Lisans kotanız 50'den 55'e yükseltilmiştir. İyi çalışmalar dileriz.",
          },
        ]

        for (const t of demoTickets) {
          await (prisma as any).supportTicket.create({ data: t }).catch(() => null)
        }

        tickets = await (prisma as any).supportTicket.findMany({
          include: {
            tenant: {
              select: {
                id: true,
                name: true,
                type: true,
                subscriptionPlan: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
        }).catch(() => [])
      }
    }

    return NextResponse.json({ success: true, data: tickets || [] })
  } catch (error) {
    console.error("Tickets API Hatası:", error)
    return NextResponse.json({ success: false, error: "Destek talepleri çekilemedi" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth()
    const body = await request.json()
    const { tenantId, subject, message, priority } = body

    if (!tenantId || !subject || !message) {
      return NextResponse.json({ error: "Eksik bilgi girildi" }, { status: 400 })
    }

    const newTicket = await (prisma as any).supportTicket.create({
      data: {
        tenantId,
        userId: session?.user?.id || "anonymous",
        subject,
        message,
        priority: priority || "MEDIUM",
        status: "OPEN",
      },
      include: { tenant: true },
    })

    return NextResponse.json({ success: true, data: newTicket })
  } catch (error) {
    console.error("Create Ticket Hatası:", error)
    return NextResponse.json({ success: false, error: "Bilet oluşturulamadı" }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await auth()
    if (session?.user?.role !== "SUPER_ADMIN" && session?.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 403 })
    }

    const body = await request.json()
    const { id, status, response } = body

    if (!id) {
      return NextResponse.json({ error: "Bilet ID zorunludur" }, { status: 400 })
    }

    const updated = await (prisma as any).supportTicket.update({
      where: { id },
      data: {
        ...(status ? { status } : {}),
        ...(response !== undefined ? { response } : {}),
      },
      include: { tenant: true },
    })

    return NextResponse.json({ success: true, data: updated })
  } catch (error) {
    console.error("Update Ticket Hatası:", error)
    return NextResponse.json({ success: false, error: "Bilet güncellenemedi" }, { status: 500 })
  }
}
