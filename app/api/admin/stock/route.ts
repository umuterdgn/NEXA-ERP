/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * This code is the property of NXA Software.
 */

import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

export async function GET() {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const stocks = await prisma.stock.findMany({
      include: {
        transactions: {
          orderBy: { date: "desc" }
        }
      },
      orderBy: { name: "asc" }
    })

    return NextResponse.json(stocks)
  } catch (error) {
    console.error("Stock fetch error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { name, unit } = body

    // Generate unique stock code
    const code = `STK-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`

    const stock = await prisma.stock.create({
      data: {
        code,
        name,
        unit: unit.toUpperCase()
      }
    })

    return NextResponse.json(stock)
  } catch (error) {
    console.error("Stock create error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}