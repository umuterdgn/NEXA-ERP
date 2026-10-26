/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Announcements API with strict tenant isolation
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

    const isSuperAdmin = session.user.role === "SUPER_ADMIN"
    const tenantId = (session.user as any)?.tenantId

    const where: any = {}
    if (!isSuperAdmin) {
      where.tenantId = tenantId || "non-existent"
    }

    const announcements = await prisma.announcement.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        project: {
          select: { id: true, name: true },
        },
      },
    })

    return NextResponse.json({ announcements })
  } catch (error: any) {
    console.error("❌ Announcements GET Error:", error)
    return NextResponse.json({ error: error.message || "Duyurular alınamadı" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 })
    }

    const tenantId = (session.user as any)?.tenantId
    const body = await request.json()
    const { title, content, severity, projectId } = body

    if (!title || !content) {
      return NextResponse.json({ error: "Başlık ve içerik zorunludur" }, { status: 400 })
    }

    const announcement = await prisma.announcement.create({
      data: {
        title,
        content,
        severity: severity || "INFO",
        projectId: projectId || null,
        tenantId: tenantId || null,
      },
    })

    return NextResponse.json({ announcement }, { status: 201 })
  } catch (error: any) {
    console.error("❌ Announcements POST Error:", error)
    return NextResponse.json({ error: error.message || "Duyuru oluşturulamadı" }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 })
    }

    const isSuperAdmin = session.user.role === "SUPER_ADMIN"
    const tenantId = (session.user as any)?.tenantId
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ error: "ID zorunludur" }, { status: 400 })
    }

    const item = await prisma.announcement.findUnique({ where: { id } })
    if (!item) {
      return NextResponse.json({ error: "Duyuru bulunamadı" }, { status: 404 })
    }

    if (!isSuperAdmin && item.tenantId !== tenantId) {
      return NextResponse.json({ error: "Yetkisiz işlem" }, { status: 403 })
    }

    await prisma.announcement.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("❌ Announcements DELETE Error:", error)
    return NextResponse.json({ error: error.message || "Duyuru silinemedi" }, { status: 500 })
  }
}
