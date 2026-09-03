/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * This code is the property of NXA Software.
 */

import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const threadId = searchParams.get('threadId')

    if (!threadId) {
      return NextResponse.json(
        { error: "threadId is required" },
        { status: 400 }
      )
    }

    const messages = await prisma.threadMessage.findMany({
      where: {
        threadId
      },
      orderBy: {
        createdAt: 'asc'
      }
    })

    return NextResponse.json(messages)
  } catch (error) {
    console.error("Error fetching messages:", error)
    return NextResponse.json(
      { error: "Mesajlar getirilirken hata oluştu" },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { threadId, content, senderId, senderName } = body

    // Validate required fields
    if (!threadId || !content || !senderId || !senderName) {
      return NextResponse.json(
        { error: "threadId, content, senderId, and senderName are required" },
        { status: 400 }
      )
    }

    const message = await prisma.threadMessage.create({
      data: {
        threadId,
        content,
        senderId,
        senderName
      }
    })

    // Update thread's updatedAt timestamp
    await prisma.chatThread.update({
      where: { id: threadId },
      data: { updatedAt: new Date() }
    })

    return NextResponse.json(message, { status: 201 })
  } catch (error) {
    console.error("Error creating message:", error)
    return NextResponse.json(
      { error: "Mesaj gönderilirken hata oluştu" },
      { status: 500 }
    )
  }
}
