/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Chat Threads API (Saha ve Merkez Sohbet Kanalları)
 */

import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const isSuperAdmin = session.user.role === "SUPER_ADMIN"
    const tenantId = (session.user as any)?.tenantId

    const where: any = {}
    if (!isSuperAdmin) {
      where.tenantId = tenantId || "non-existent"
    }

    const threads = await prisma.chatThread.findMany({
      where,
      include: {
        project: {
          select: { id: true, title: true, name: true }
        },
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
          select: { content: true, createdAt: true, senderName: true }
        },
        participants: {
          select: { id: true, personelId: true }
        }
      },
      orderBy: { updatedAt: "desc" }
    })

    return NextResponse.json(threads)
  } catch (error: any) {
    console.error("ChatThreads GET Error:", error)
    return NextResponse.json({ error: error.message || "Failed to fetch threads" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const isSuperAdmin = session.user.role === "SUPER_ADMIN"
    const tenantId = (session.user as any)?.tenantId
    const body = await request.json()
    const { title, projectId, participants } = body

    if (!title) {
      return NextResponse.json({ error: "Kanal adı zorunludur" }, { status: 400 })
    }

    // Proje bulunamazsa kiracının ilk projesini bağla
    let targetProjectId = projectId
    if (!targetProjectId) {
      const firstProject = await prisma.project.findFirst({
        where: isSuperAdmin ? {} : { tenantId: tenantId || "non-existent" },
        select: { id: true }
      })
      targetProjectId = firstProject?.id
    }

    if (!targetProjectId) {
      return NextResponse.json({ error: "Sohbet kanalı için en az bir proje gereklidir." }, { status: 400 })
    }

    const newThread = await prisma.chatThread.create({
      data: {
        title,
        projectId: targetProjectId,
        createdById: session.user.id,
        tenantId: tenantId || null,
        participants: Array.isArray(participants) && participants.length > 0 ? {
          create: participants.map((pId: string) => ({
            personelId: pId,
            tenantId: tenantId || null
          }))
        } : undefined
      }
    })

    return NextResponse.json(newThread, { status: 201 })
  } catch (error: any) {
    console.error("ChatThreads POST Error:", error)
    return NextResponse.json({ error: error.message || "Failed to create thread" }, { status: 500 })
  }
}
