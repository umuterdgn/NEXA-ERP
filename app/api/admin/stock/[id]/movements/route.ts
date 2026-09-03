/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * This code is the property of NXA Software.
 */

import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params
    
    const movements = await prisma.stockMovement.findMany({
      where: { stockId: resolvedParams.id },
      include: {
        project: true,
        personel: true
      },
      orderBy: { date: 'desc' }
    })
    
    return NextResponse.json(movements)
  } catch (error) {
    console.error("Error fetching stock movements:", error)
    return NextResponse.json(
      { error: "Stok hareketleri getirilirken hata oluştu" },
      { status: 500 }
    )
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params
    const body = await request.json()
    const { type, quantity, description, date, projectId, personnelId } = body

    if (!type || !quantity) {
      return NextResponse.json(
        { error: "İşlem tipi ve miktar zorunludur" },
        { status: 400 }
      )
    }

    // Use transaction for atomic operations
    const result = await prisma.$transaction(async (tx) => {
      // Create stock movement
      const movement = await tx.stockMovement.create({
        data: {
          type,
          quantity: parseFloat(quantity),
          description: description || null,
          date: date ? new Date(date) : new Date(),
          stockId: resolvedParams.id,
          projectId: projectId || null,
          personnelId: personnelId || null
        },
        include: {
          project: true,
          personel: true
        }
      })

      // Update stock quantity
      const stock = await tx.stock.findUnique({
        where: { id: resolvedParams.id }
      })

      if (stock) {
        const currentQuantity = stock.quantity || 0
        const newQuantity = type === "GIRIS" 
          ? currentQuantity + parseFloat(quantity)
          : currentQuantity - parseFloat(quantity)

        await tx.stock.update({
          where: { id: resolvedParams.id },
          data: { quantity: newQuantity }
        })
      }

      return movement
    })

    return NextResponse.json(result, { status: 201 })
  } catch (error) {
    console.error("Error creating stock movement:", error)
    return NextResponse.json(
      { error: "Stok hareketi oluşturulurken hata oluştu" },
      { status: 500 }
    )
  }
}
