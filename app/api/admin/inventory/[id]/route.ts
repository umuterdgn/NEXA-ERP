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

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params
    const inventory = await prisma.inventory.findUnique({
      where: { id: resolvedParams.id },
      include: {
        project: true,
        assignments: {
          where: { returnedAt: null },
          include: {
            personel: true
          },
          orderBy: { assignedAt: 'desc' }
        },
        history: {
          orderBy: { createdAt: 'desc' },
          include: {
            personnel: true
          }
        }
      }
    })

    if (!inventory) {
      return NextResponse.json({ error: "Malzeme bulunamadı" }, { status: 404 })
    }

    return NextResponse.json(inventory)
  } catch (error) {
    console.error("Error fetching inventory item:", error)
    return NextResponse.json({ error: "Malzeme bilgileri getirilirken hata oluştu" }, { status: 500 })
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params
    const body = await request.json()
    const { quantity, operationType, changeAmount } = body

    // Get a valid admin user ID for history records
    const adminUser = await prisma.user.findFirst({
      where: { role: 'ADMIN' }
    })
    const validRecordedBy = adminUser?.id

    const existingItem = await prisma.inventory.findUnique({
      where: { id: resolvedParams.id }
    })

    if (!existingItem) {
      return NextResponse.json(
        { error: "Malzeme bulunamadı" },
        { status: 404 }
      )
    }

    const updateData: any = {}
    
    if (quantity !== undefined) {
      const oldQuantity = existingItem.quantity
      const newQuantity = parseFloat(quantity)
      updateData.quantity = newQuantity
      
      // Create history for stock change
      if (oldQuantity !== newQuantity) {
        const action = operationType === "add" ? "STOCK_ADDED" : "STOCK_REMOVED"
        const changeQty = changeAmount ? parseFloat(changeAmount) : Math.abs(newQuantity - oldQuantity)
        await createInventoryHistory(
          resolvedParams.id,
          action,
          changeQty,
          `${operationType === "add" ? "Stok eklendi" : "Stok düşüldü"}: ${changeQty} ${existingItem.unit}`,
          undefined,
          validRecordedBy
        )
      }
    }

    const updatedItem = await prisma.inventory.update({
      where: { id: resolvedParams.id },
      data: updateData
    })

    return NextResponse.json(updatedItem)
  } catch (error) {
    console.error("Error updating inventory item:", error)
    return NextResponse.json(
      { error: "Stok güncellenirken hata oluştu" },
      { status: 500 }
    )
  }
}
