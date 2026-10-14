/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Logistics Schedule API Route
 */

import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const schedules = await prisma.logisticsSchedule.findMany({
      include: {
        receivedBy: {
          select: { id: true, name: true, email: true }
        },
        project: {
          select: { id: true, name: true, title: true }
        }
      },
      orderBy: {
        scheduledAt: 'asc'
      }
    })

    return NextResponse.json(schedules)
  } catch (error) {
    console.error("Failed to fetch logistics schedules:", error)
    return NextResponse.json(
      { error: "Failed to fetch logistics schedules" },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { title, type, location, supplierName, driverContact, scheduledAt, notes, status, projectId } = body

    const validStatus = ["PLANNED", "IN_TRANSIT", "DELIVERED", "ISSUE_REPORTED"].includes(status)
      ? status
      : "PLANNED"

    const schedule = await prisma.logisticsSchedule.create({
      data: {
        title,
        type,
        location,
        supplierName,
        driverContact,
        scheduledAt: new Date(scheduledAt),
        notes,
        status: validStatus,
        projectId: projectId || null
      },
      include: {
        receivedBy: {
          select: { id: true, name: true, email: true }
        },
        project: {
          select: { id: true, name: true, title: true }
        }
      }
    })

    return NextResponse.json(schedule)
  } catch (error) {
    console.error("Failed to create logistics schedule:", error)
    return NextResponse.json(
      { error: "Failed to create logistics schedule" },
      { status: 500 }
    )
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json()
    const { id, status, deliveryProofImageUrl, deliveryNotes, receivedById, completedAt } = body

    if (!id) {
      return NextResponse.json(
        { error: "Schedule ID is required" },
        { status: 400 }
      )
    }

    const updateData: any = {}
    if (status) updateData.status = status
    if (deliveryProofImageUrl !== undefined) updateData.deliveryProofImageUrl = deliveryProofImageUrl
    if (deliveryNotes !== undefined) updateData.deliveryNotes = deliveryNotes
    if (receivedById !== undefined) updateData.receivedById = receivedById
    if (completedAt !== undefined) {
      updateData.completedAt = completedAt ? new Date(completedAt) : null
    } else if (status === "DELIVERED") {
      updateData.completedAt = new Date()
    }

    const updated = await prisma.logisticsSchedule.update({
      where: { id },
      data: updateData,
      include: {
        receivedBy: {
          select: { id: true, name: true, email: true }
        },
        project: {
          select: { id: true, name: true, title: true }
        }
      }
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error("Failed to update logistics schedule:", error)
    return NextResponse.json(
      { error: "Failed to update logistics schedule" },
      { status: 500 }
    )
  }
}

