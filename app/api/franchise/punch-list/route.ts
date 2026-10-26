/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Franchise Punch List (QA ve Kusur Denetimi) API'si
 */

import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 })
    }

    const isSuperAdmin = session.user.role === "SUPER_ADMIN"
    const tenantId = (session.user as any)?.tenantId

    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get("projectId")
    const status = searchParams.get("status")

    const where: any = {}
    if (!isSuperAdmin) {
      where.tenantId = tenantId || "non-existent"
    }
    if (projectId) where.projectId = projectId
    if (status && status !== "ALL") where.status = status

    const punchLists = await prisma.punchList.findMany({
      where,
      include: {
        project: {
          select: {
            id: true,
            name: true,
            city: true,
            district: true,
            status: true,
          },
        },
      },
      orderBy: { deadline: "asc" },
    })

    return NextResponse.json({ punchLists })
  } catch (error: any) {
    console.error("❌ Punch List GET Error:", error)
    return NextResponse.json({ error: error.message || "Kusur listesi alınamadı" }, { status: 500 })
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
    const { projectId, inspectorId, subcontractorId, defectDesc, photoUrl, deadline } = body

    if (!projectId || !defectDesc || !deadline) {
      return NextResponse.json(
        { error: "projectId, defectDesc ve deadline zorunludur" },
        { status: 400 }
      )
    }

    const item = await prisma.punchList.create({
      data: {
        projectId,
        tenantId: tenantId || null,
        inspectorId: inspectorId || session.user.id,
        subcontractorId: subcontractorId || "Genel Taşeron",
        defectDesc,
        photoUrl: photoUrl || null,
        deadline: new Date(deadline),
        status: "OPEN",
      },
      include: {
        project: {
          select: { id: true, name: true, city: true, district: true },
        },
      },
    })

    return NextResponse.json({ punchList: item }, { status: 201 })
  } catch (error: any) {
    console.error("❌ Punch List POST Error:", error)
    return NextResponse.json({ error: error.message || "Kusur kaydı eklenemedi" }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 })
    }

    const body = await request.json()
    const { id, status, defectDesc, photoUrl, deadline, subcontractorId } = body

    if (!id) {
      return NextResponse.json({ error: "Punch List ID zorunludur" }, { status: 400 })
    }

    const data: any = {}
    if (status) data.status = status // OPEN, FIXED, VERIFIED
    if (defectDesc) data.defectDesc = defectDesc
    if (photoUrl !== undefined) data.photoUrl = photoUrl
    if (deadline) data.deadline = new Date(deadline)
    if (subcontractorId) data.subcontractorId = subcontractorId

    const updated = await prisma.punchList.update({
      where: { id },
      data,
      include: {
        project: {
          select: { id: true, name: true, city: true, district: true },
        },
      },
    })

    return NextResponse.json({ punchList: updated })
  } catch (error: any) {
    console.error("❌ Punch List PATCH Error:", error)
    return NextResponse.json({ error: error.message || "Kusur güncellenemedi" }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ error: "ID zorunludur" }, { status: 400 })
    }

    await prisma.punchList.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("❌ Punch List DELETE Error:", error)
    return NextResponse.json({ error: error.message || "Kusur silinemedi" }, { status: 500 })
  }
}
