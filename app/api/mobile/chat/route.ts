/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * GET/POST /api/mobile/chat
 * Mobil Şantiye Ekip Mesajlaşması & Telsiz/PTT Ses Kayıt API'si
 */

import { NextResponse } from "next/server"
import { getMobileAuth } from "@/lib/mobile-auth"
import { prisma } from "@/lib/prisma"
import { assertTenantAndProjectAccess, requireAnyModule } from "@/lib/api-rbac"

export const runtime = "nodejs"

export async function GET(request: Request) {
  try {
    const auth = await getMobileAuth(request)
    if (!auth) {
      return NextResponse.json({ error: "Yetkisiz oturum." }, { status: 401 })
    }

    const denied = requireAnyModule(auth, ["internal_comms", "ptt_chat"])
    if (denied) return denied

    const { userId, tenantId, assignedProjectIds } = auth
    const url = new URL(request.url)
    const reqProjectId = url.searchParams.get("projectId")
    if (reqProjectId) {
      const accessErr = await assertTenantAndProjectAccess(auth, reqProjectId)
      if (accessErr) return accessErr
    }
    const projectId = reqProjectId || (assignedProjectIds[0] ?? undefined)
    const channelName = url.searchParams.get("channelName") || "Şantiye Genel"

    const messages = await prisma.chatMessage.findMany({
      where: {
        ...(tenantId ? { tenantId } : {}),
        OR: [
          { projectId, channelName },
          { receiverId: userId },
          { senderId: userId },
        ],
      },
      orderBy: { createdAt: "desc" },
      take: 50,
      include: {
        sender: {
          select: { id: true, name: true, role: true, profileImage: true },
        },
      },
    })

    return NextResponse.json({
      success: true,
      count: messages.length,
      messages: messages.reverse().map((m) => ({
        id: m.id,
        content: m.content,
        photoUrl: m.photoUrl,
        attachmentType: m.attachmentType,
        attachmentUrl: m.attachmentUrl,
        channelName: m.channelName,
        createdAt: m.createdAt,
        isMe: m.senderId === userId,
        sender: {
          id: m.sender.id,
          name: m.sender.name,
          role: m.sender.role,
          avatar: m.sender.profileImage,
        },
      })),
    })
  } catch (error: any) {
    console.error("Mobile chat GET error:", error)
    return NextResponse.json({ error: "Mesajlar alınamadı." }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const auth = await getMobileAuth(request)
    if (!auth) {
      return NextResponse.json({ error: "Yetkisiz oturum." }, { status: 401 })
    }

    const denied = requireAnyModule(auth, ["internal_comms", "ptt_chat"])
    if (denied) return denied

    const { userId, tenantId, assignedProjectIds } = auth
    const body = await request.json().catch(() => ({}))
    const { content, photoUrl, audioUrl, channelName, receiverId, projectId: reqProjectId } = body

    if (reqProjectId) {
      const accessErr = await assertTenantAndProjectAccess(auth, reqProjectId)
      if (accessErr) return accessErr
    }

    if (!content && !photoUrl && !audioUrl) {
      return NextResponse.json({ error: "Boş mesaj gönderilemez." }, { status: 400 })
    }

    const targetProjectId =
      reqProjectId ||
      assignedProjectIds[0] ||
      (tenantId ? (await prisma.project.findFirst({ where: { tenantId, deletedAt: null } }))?.id : undefined) ||
      null

    const message = await prisma.chatMessage.create({
      data: {
        tenantId,
        senderId: userId,
        receiverId: receiverId || null,
        projectId: targetProjectId,
        channelName: channelName || "Şantiye Genel",
        content: content || (audioUrl ? "🎤 Sesli Telsiz Mesajı" : "📷 Saha Fotoğrafı"),
        photoUrl: photoUrl || null,
        attachmentType: audioUrl ? "PTT_AUDIO" : photoUrl ? "PHOTO" : null,
        attachmentUrl: audioUrl || photoUrl || null,
      },
      include: {
        sender: { select: { id: true, name: true, role: true } },
      },
    })

    return NextResponse.json({
      success: true,
      message,
    })
  } catch (error: any) {
    console.error("Mobile chat POST error:", error)
    return NextResponse.json({ error: "Mesaj gönderilemedi." }, { status: 500 })
  }
}

