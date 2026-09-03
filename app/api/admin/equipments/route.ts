/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * This code is the property of NXA Software.
 */

import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { logEquipmentAction } from "@/lib/logger"

export async function GET() {
  try {
    const equipments = await prisma.equipment.findMany({
      include: {
        project: true,
        assignedTo: {
          select: {
            id: true,
            name: true,
            department: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })
    
    return NextResponse.json(equipments)
  } catch (error) {
    console.error("Error fetching equipments:", error)
    return NextResponse.json(
      { error: "Demirbaşlar getirilirken hata oluştu" },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth()
    const userName = session?.user?.name || "Bilinmeyen Kullanıcı"
    
    const body = await request.json()
    const { name, type, serialNumber, category, assignedToId, projectId } = body

    const equipment = await prisma.equipment.create({
      data: {
        name,
        type: type || "DIGER",
        status: "AVAILABLE",
        serialNumber: serialNumber || "",
        category: category || null,
        assignedToId: assignedToId || null,
        projectId: projectId || null
      },
      include: {
        project: true,
        assignedTo: {
          select: {
            id: true,
            name: true,
            department: true
          }
        }
      }
    })

    // Log the action with detailed information
    await logEquipmentAction("EKLENDI", userName, equipment.name, `Tip: ${equipment.type}`)

    return NextResponse.json(equipment, { status: 201 })
  } catch (error) {
    console.error("Error creating equipment:", error)
    return NextResponse.json(
      { error: "Demirbaş oluşturulurken hata oluştu" },
      { status: 500 }
    )
  }
}

export async function PUT(request: Request) {
  try {
    const session = await auth()
    const userName = session?.user?.name || "Bilinmeyen Kullanıcı"
    
    const body = await request.json()
    const { id, name, type, status, plateOrSerialNo, nextMaintenance, projectId } = body

    // Get the existing equipment to log the name
    const existingEquipment = await prisma.equipment.findUnique({
      where: { id }
    })

    const equipment = await prisma.equipment.update({
      where: { id },
      data: {
        name,
        type: type || "DIGER",
        status: status || "AKTIF",
        plateOrSerialNo: plateOrSerialNo || null,
        nextMaintenance: nextMaintenance ? new Date(nextMaintenance) : null,
        projectId: projectId || null
      },
      include: {
        project: true
      }
    })

    // Log the action with detailed information
    if (existingEquipment) {
      await logEquipmentAction("GUNCELLENDI", userName, existingEquipment.name, `Tip: ${existingEquipment.type}`)
    }

    return NextResponse.json(equipment)
  } catch (error) {
    console.error("Error updating equipment:", error)
    return NextResponse.json(
      { error: "Demirbaş güncellenirken hata oluştu" },
      { status: 500 }
    )
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await auth()
    const userName = session?.user?.name || "Bilinmeyen Kullanıcı"
    
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: "ID parametresi gerekli" },
        { status: 400 }
      )
    }

    // Get the existing equipment to log the name
    const existingEquipment = await prisma.equipment.findUnique({
      where: { id }
    })

    await prisma.equipment.delete({
      where: { id }
    })

    // Log the action with detailed information
    if (existingEquipment) {
      await logEquipmentAction("SILINDI", userName, existingEquipment.name, `Tip: ${existingEquipment.type}`)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting equipment:", error)
    return NextResponse.json(
      { error: "Demirbaş silinirken hata oluştu" },
      { status: 500 }
    )
  }
}
