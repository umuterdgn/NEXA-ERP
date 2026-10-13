/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * This code is the property of NXA Software.
 */

import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get("projectId")

    if (!projectId) {
      return NextResponse.json({ 
        menus: [], 
        message: "Lütfen bir proje seçiniz" 
      })
    }

    const menus = await prisma.foodMenu.findMany({
      where: { projectId },
      include: {
        project: {
          select: { id: true, name: true, title: true }
        }
      },
      orderBy: { date: "asc" }
    })

    return NextResponse.json({ menus })
  } catch (error) {
    console.error("Fetch menus error:", error)
    return NextResponse.json({ error: "Menüler getirilemedi" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { projectId, date: dateStr, items } = body

    if (!projectId || !dateStr || !items) {
      return NextResponse.json({ error: "Proje, tarih ve menü içeriği zorunludur" }, { status: 400 })
    }

    const date = new Date(dateStr)
    const menu = await prisma.foodMenu.upsert({
      where: {
        projectId_date: {
          projectId,
          date
        }
      },
      update: { items: items.trim() },
      create: {
        projectId,
        date,
        items: items.trim()
      }
    })

    return NextResponse.json({ success: true, menu })
  } catch (error) {
    console.error("Create menu error:", error)
    return NextResponse.json({ error: "Menü kaydedilemedi" }, { status: 500 })
  }
}
