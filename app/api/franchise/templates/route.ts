/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Franchise Tip Mağaza / Konsept Şablonları API'si
 */

import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 })
    }

    const templates = await prisma.storeTemplate.findMany({
      include: {
        _count: {
          select: { projects: true },
        },
      },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json({ templates })
  } catch (error: any) {
    console.error("❌ Templates GET Error:", error)
    return NextResponse.json({ error: error.message || "Şablonlar alınamadı" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 })
    }

    const body = await request.json()
    const { name, estimatedDays, defaultBoQ, defaultTasks, companyId } = body

    if (!name || !estimatedDays) {
      return NextResponse.json({ error: "name ve estimatedDays zorunludur" }, { status: 400 })
    }

    const targetCompanyId = companyId || session.user.companyId || "default-company"

    const template = await prisma.storeTemplate.create({
      data: {
        name,
        estimatedDays: Number(estimatedDays),
        defaultBoQ: defaultBoQ || [],
        defaultTasks: defaultTasks || [],
        companyId: targetCompanyId,
      },
    })

    return NextResponse.json({ template }, { status: 201 })
  } catch (error: any) {
    console.error("❌ Templates POST Error:", error)
    return NextResponse.json({ error: error.message || "Şablon oluşturulamadı" }, { status: 500 })
  }
}
