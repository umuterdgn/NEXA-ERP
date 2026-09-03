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
    const projectId = searchParams.get('projectId')
    const status = searchParams.get('status')

    const where: any = {}

    if (projectId) {
      where.projectId = projectId
    }

    if (status) {
      where.status = status
    }

    const threads = await prisma.chatThread.findMany({
      where,
      include: {
        project: {
          select: {
            id: true,
            title: true
          }
        },
        participants: {
          include: {
            personel: {
              select: {
                id: true,
                name: true
              }
            }
          }
        },
        _count: {
          select: {
            messages: true
          }
        }
      },
      orderBy: {
        updatedAt: 'desc'
      }
    })

    return NextResponse.json(threads)
  } catch (error) {
    console.error("Error fetching threads:", error)
    return NextResponse.json(
      { error: "Konular getirilirken hata oluştu" },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { title, projectId, createdById, participantIds } = body

    // Validate required fields
    if (!title || !projectId || !createdById) {
      return NextResponse.json(
        { error: "title, projectId, and createdById are required" },
        { status: 400 }
      )
    }

    const thread = await prisma.chatThread.create({
      data: {
        title,
        projectId,
        createdById,
        status: "OPEN"
      },
      include: {
        project: {
          select: {
            id: true,
            title: true
          }
        }
      }
    })

    // Add participants if provided
    if (participantIds && Array.isArray(participantIds) && participantIds.length > 0) {
      await prisma.chatParticipant.createMany({
        data: participantIds.map((personelId: string) => ({
          threadId: thread.id,
          personelId
        }))
      })
    }

    return NextResponse.json(thread, { status: 201 })
  } catch (error) {
    console.error("Error creating thread:", error)
    return NextResponse.json(
      { error: "Konu oluşturulurken hata oluştu" },
      { status: 500 }
    )
  }
}
