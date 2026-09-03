/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * This code is the property of NXA Software.
 */

import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

async function createInventoryHistory(inventoryId: string, action: string, quantity?: number, description?: string, personnelId?: string, userId?: string) {
  try {
    await prisma.inventoryHistory.create({
      data: {
        inventoryId,
        action,
        quantity,
        description,
        personnelId,
        userId
      }
    })
  } catch (error) {
    console.error("Error creating inventory history:", error)
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params
    const body = await request.json()
    const { personelId, quantity, notes } = body

    // Get a valid admin user ID for history records
    const adminUser = await prisma.user.findFirst({
      where: { role: 'ADMIN' }
    })
    const validRecordedBy = adminUser?.id

    // Get the inventory item
    const inventory = await prisma.inventory.findUnique({
      where: { id: resolvedParams.id },
      include: {
        assignments: {
          where: { returnedAt: null }
        }
      }
    })

    if (!inventory) {
      return NextResponse.json({ error: "Malzeme bulunamadı" }, { status: 404 })
    }

    // Calculate available quantity
    const assignedQuantity = inventory.assignments.reduce((sum: number, assignment: any) => sum + assignment.quantity, 0)
    const availableQuantity = inventory.quantity - assignedQuantity

    if (quantity > availableQuantity) {
      return NextResponse.json({
        error: `Yetersiz stok. Kullanılabilir miktar: ${availableQuantity} ${inventory.unit}`
      }, { status: 400 })
    }

    // Get personel info for history
    const personel = await prisma.personel.findUnique({
      where: { id: personelId }
    })

    // Create assignment
    const assignment = await prisma.inventoryAssignment.create({
      data: {
        inventoryId: resolvedParams.id,
        personelId,
        quantity: parseInt(quantity),
        notes
      }
    })

    // Create history record
    await createInventoryHistory(
      resolvedParams.id,
      "ASSIGNED",
      parseInt(quantity),
      `${personel?.name || ""} personeline ${quantity} ${inventory.unit} zimmetlendi`,
      personelId,
      validRecordedBy
    )

    return NextResponse.json(assignment)
  } catch (error) {
    console.error("Error creating inventory assignment:", error)
    return NextResponse.json({ error: "Zimmet oluşturulurken hata oluştu" }, { status: 500 })
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params
    const body = await request.json()
    const { assignmentId } = body

    // Get a valid admin user ID for history records
    const adminUser = await prisma.user.findFirst({
      where: { role: 'ADMIN' }
    })
    const validRecordedBy = adminUser?.id

    // Get the assignment
    const assignment = await prisma.inventoryAssignment.findUnique({
      where: { id: assignmentId },
      include: {
        inventory: true,
        personel: true
      } as any
    })

    if (!assignment) {
      return NextResponse.json({ error: "Zimmet kaydı bulunamadı" }, { status: 404 })
    }

    if (assignment.returnedAt) {
      return NextResponse.json({ error: "Bu zimmet zaten iade edilmiş" }, { status: 400 })
    }

    // Update assignment with return date
    const updatedAssignment = await prisma.inventoryAssignment.update({
      where: { id: assignmentId },
      data: {
        returnedAt: new Date()
      }
    })

    // Create history record
    await createInventoryHistory(
      assignment.inventoryId,
      "UNASSIGNED",
      assignment.quantity,
      `${(assignment.personel as any)?.name || ""} personelinden ${assignment.quantity} ${(assignment.inventory as any).unit} iade alındı`,
      assignment.personelId || undefined,
      validRecordedBy
    )

    return NextResponse.json(updatedAssignment)
  } catch (error) {
    console.error("Error returning inventory assignment:", error)
    return NextResponse.json({ error: "Zimmet iadesi sırasında hata oluştu" }, { status: 500 })
  }
}