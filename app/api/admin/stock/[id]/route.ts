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
    
    const stock = await prisma.stock.findUnique({
      where: { id: resolvedParams.id },
      include: {
        transactions: {
          orderBy: { date: 'desc' }
        }
      }
    })
    
    if (!stock) {
      return NextResponse.json({ error: "Stok bulunamadı" }, { status: 404 })
    }
    
    return NextResponse.json(stock)
  } catch (error) {
    console.error("Error fetching stock:", error)
    return NextResponse.json(
      { error: "Stok getirilirken hata oluştu" },
      { status: 500 }
    )
  }
}
