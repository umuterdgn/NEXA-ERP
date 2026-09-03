/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * This code is the property of NXA Software.
 */

import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

export async function GET(request: Request) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const search = searchParams.get("search")

    let suppliers = await prisma.cari.findMany({
      where: { type: "SUPPLIER" },
      include: {
        debts: true,
        payments: true
      },
      orderBy: { name: "asc" }
    })

    if (search) {
      suppliers = suppliers.filter(s => 
        s.name.toLowerCase().includes(search.toLowerCase())
      )
    }

    return NextResponse.json(suppliers)
  } catch (error) {
    console.error("Suppliers fetch error:", error)
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
    const { name, contact, email, phone } = body

    const supplier = await prisma.cari.create({
      data: {
        code: `C${Date.now().toString().slice(-3)}`,
        name,
        contactName: contact,
        email,
        phone,
        type: "SUPPLIER"
      }
    })

    return NextResponse.json(supplier)
  } catch (error) {
    console.error("Supplier create error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}