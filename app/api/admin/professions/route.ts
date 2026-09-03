/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * This code is the property of NXA Software.
 */

import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// GET - Tüm meslekleri getir
export async function GET() {
  try {
    const professions = await prisma.profession.findMany({
      orderBy: { name: 'asc' }
    })
    
    return NextResponse.json(professions)
  } catch (error) {
    console.error("Error fetching professions:", error)
    return NextResponse.json(
      { error: "Meslekler getirilirken hata oluştu" },
      { status: 500 }
    )
  }
}

// POST - Yeni meslek ekle
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name } = body

    if (!name || name.trim() === "") {
      return NextResponse.json(
        { error: "Meslek adı zorunludur" },
        { status: 400 }
      )
    }

    const profession = await prisma.profession.create({
      data: {
        name: name.trim()
      }
    })

    return NextResponse.json(profession, { status: 201 })
  } catch (error) {
    console.error("Error creating profession:", error)
    return NextResponse.json(
      { error: "Meslek eklenirken hata oluştu" },
      { status: 500 }
    )
  }
}
