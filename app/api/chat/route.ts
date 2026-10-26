/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Saha İçi İletişim (Kapalı Devre Chat) API
 */

import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 })
    }

    const isSuperAdmin = session.user.role === "SUPER_ADMIN"
    const tenantId = (session.user as any)?.tenantId

    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get("projectId")
    const channelName = searchParams.get("channelName")

    const whereClause: any = {}
    if (projectId) {
      whereClause.projectId = projectId
    }
    if (channelName) {
      whereClause.channelName = channelName
    }
    if (!isSuperAdmin) {
      whereClause.tenantId = tenantId || "non-existent"
    }

    const messages = await prisma.chatMessage.findMany({
      where: whereClause,
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            profileImage: true,
          },
        },
      },
      orderBy: { createdAt: "asc" },
      take: 100,
    })

    return NextResponse.json({ messages })
  } catch (error: any) {
    console.error("❌ Chat GET error:", error)
    return NextResponse.json({ error: error.message || "Mesajlar alınamadı" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 })
    }

    const tenantId = (session.user as any)?.tenantId
    const body = await request.json()
    const { content, photoUrl, projectId, receiverId, channelName } = body

    if (!content && !photoUrl) {
      return NextResponse.json({ error: "Mesaj içeriği veya fotoğraf gereklidir" }, { status: 400 })
    }

    const message = await prisma.chatMessage.create({
      data: {
        senderId: session.user.id,
        content: content || (photoUrl ? "📷 Saha Fotoğrafı" : ""),
        photoUrl: photoUrl || null,
        projectId: projectId || null,
        receiverId: receiverId || null,
        channelName: channelName || "Genel Şantiye Grubu",
        tenantId: tenantId || null,
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            profileImage: true,
          },
        },
      },
    })

    return NextResponse.json({ message }, { status: 201 })
  } catch (error: any) {
    console.error("❌ Chat POST error:", error)
    return NextResponse.json({ error: error.message || "Mesaj gönderilemedi" }, { status: 500 })
  }
}
