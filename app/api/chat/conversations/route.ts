/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * This code is the property of NXA Software.
 */

import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { logAction } from "@/lib/logger"

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get conversations where the user is a participant
    const conversations = await prisma.conversation.findMany({
      where: {
        participants: {
          some: {
            OR: [
              { userId: session.user.id },
              { personelId: session.user.id }
            ]
          }
        }
      },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            },
            personel: {
              select: {
                id: true,
                name: true,
                personnelNo: true
              }
            }
          }
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          include: {
            sender: {
              select: {
                name: true
              }
            },
            personelSender: {
              select: {
                name: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json(conversations)
  } catch (error) {
    console.error("Error fetching conversations:", error)
    return NextResponse.json({ error: "Failed to fetch conversations" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { name, isGroup, isAnnouncement, participantIds } = body

    // Check if user has permission to create announcements
    if (isAnnouncement && session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: "Forbidden - Only admins can create announcements" }, { status: 403 })
    }

    // Separate user and personel participant IDs
    const userIds: string[] = []
    const personelIds: string[] = []

    if (participantIds && Array.isArray(participantIds)) {
      for (const id of participantIds) {
        // Check if this is a User or Personel by trying to find them
        const user = await prisma.user.findUnique({ where: { id } })
        if (user) {
          userIds.push(id)
        } else {
          // Assume it's a personel
          personelIds.push(id)
        }
      }
    }

    // Create participants array
    const participantsData = [
      { userId: session.user.id },
      ...userIds.map((id) => ({ userId: id })),
      ...personelIds.map((id) => ({ personelId: id }))
    ]

    // Create conversation
    const conversation = await prisma.conversation.create({
      data: {
        name: name || null,
        isGroup: isGroup || false,
        isAnnouncement: isAnnouncement || false,
        participants: {
          create: participantsData
        }
      },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            },
            personel: {
              select: {
                id: true,
                name: true,
                personnelNo: true
              }
            }
          }
        }
      }
    })

    return NextResponse.json(conversation)
  } catch (error) {
    console.error("Error creating conversation:", error)
    return NextResponse.json({ error: "Failed to create conversation" }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Only admins can delete conversations
    if (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: "Forbidden - Only admins can delete conversations" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const userName = session.user.name || "Bilinmeyen Kullanıcı"

    if (!id) {
      return NextResponse.json({ error: "Conversation ID is required" }, { status: 400 })
    }

    // Get the existing conversation to log the name
    const existingConversation = await prisma.conversation.findUnique({
      where: { id }
    })

    // Delete conversation (this will cascade delete messages and participants)
    await prisma.conversation.delete({
      where: { id }
    })

    // Log the action with detailed information
    if (existingConversation) {
      await logAction("SILINDI", `${userName}, ${existingConversation.name || 'İsimsiz Sohbet'} adlı sohbeti sildi`, userName)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting conversation:", error)
    return NextResponse.json({ error: "Failed to delete conversation" }, { status: 500 })
  }
}