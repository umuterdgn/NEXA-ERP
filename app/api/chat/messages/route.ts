/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * This code is the property of NXA Software.
 */

import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { pusherServer } from "@/lib/pusher"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const conversationId = searchParams.get("conversationId")

    if (!conversationId) {
      return NextResponse.json({ error: "Conversation ID required" }, { status: 400 })
    }

    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Verify user is participant in this conversation
    const participant = await prisma.conversationParticipant.findFirst({
      where: {
        conversationId,
        OR: [
          { userId: session.user.id },
          { personelId: session.user.id }
        ]
      }
    })

    if (!participant) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const messages = await prisma.message.findMany({
      where: { conversationId },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        personelSender: {
          select: {
            id: true,
            name: true,
            username: true
          }
        }
      },
      orderBy: { createdAt: 'asc' }
    })

    return NextResponse.json(messages)
  } catch (error) {
    console.error("Error fetching messages:", error)
    return NextResponse.json({ error: "Failed to fetch messages" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { body: messageBody, conversationId, senderId, personelSenderId } = body

    if (!messageBody || !conversationId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Verify sender (either user or worker)
    if (senderId && senderId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Verify user is participant in this conversation
    const participant = await prisma.conversationParticipant.findFirst({
      where: {
        conversationId,
        OR: [
          { userId: session.user.id },
          { personelId: session.user.id }
        ]
      }
    })

    if (!participant) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Create message with appropriate sender
    const messageData: any = {
      body: messageBody,
      conversationId
    }

    if (senderId) {
      messageData.senderId = senderId
    } else if (personelSenderId) {
      messageData.personelSenderId = personelSenderId
    } else {
      messageData.senderId = session.user.id
    }

    const message = await prisma.message.create({
      data: messageData,
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        personelSender: {
          select: {
            id: true,
            name: true,
            username: true
          }
        }
      }
    })

    // Trigger Pusher event for real-time updates
    try {
      await pusherServer.trigger(`conversation-${conversationId}`, 'new-message', message)
    } catch (pusherError) {
      console.error("Pusher trigger failed:", pusherError)
      // Continue without failing - message is still saved to database
      // This allows the chat to work even if Pusher credentials are not configured
    }

    return NextResponse.json(message)
  } catch (error) {
    console.error("Error creating message:", error)
    
    // Distinguish between Prisma errors and other errors
    if (error instanceof Error) {
      console.error("Error message:", error.message)
      console.error("Error stack:", error.stack)
    }
    
    return NextResponse.json({ 
      error: "Failed to create message", 
      message: error instanceof Error ? error.message : "Unknown error" 
    }, { status: 500 })
  }
}