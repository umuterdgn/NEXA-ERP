/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Franchise Dijital Devir-Teslim (Handover & As-Built) Belgeleri API'si
 */

import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

export const dynamic = "force-dynamic"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 })
    }

    const { id } = await params
    const projectId = id

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: {
        id: true,
        name: true,
        title: true,
        city: true,
        district: true,
        grossAreaSqm: true,
        totalCapex: true,
        status: true,
      },
    })

    if (!project) {
      return NextResponse.json({ error: "Proje bulunamadı" }, { status: 404 })
    }

    const documents = await prisma.handoverDocument.findMany({
      where: { projectId },
      orderBy: { uploadedAt: "desc" },
    })

    return NextResponse.json({ project, documents })
  } catch (error: any) {
    console.error("❌ Handover GET Error:", error)
    return NextResponse.json({ error: error.message || "Devir-teslim belgeleri alınamadı" }, { status: 500 })
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 })
    }

    const { id } = await params
    const projectId = id
    const body = await request.json()
    const { documentType, title, fileUrl } = body

    if (!documentType || !title || !fileUrl) {
      return NextResponse.json(
        { error: "documentType, title ve fileUrl zorunludur" },
        { status: 400 }
      )
    }

    const doc = await prisma.handoverDocument.create({
      data: {
        projectId,
        documentType,
        title,
        fileUrl,
      },
    })

    return NextResponse.json({ document: doc }, { status: 201 })
  } catch (error: any) {
    console.error("❌ Handover POST Error:", error)
    return NextResponse.json({ error: error.message || "Belge eklenemedi" }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const docId = searchParams.get("docId")

    if (!docId) {
      return NextResponse.json({ error: "docId zorunludur" }, { status: 400 })
    }

    await prisma.handoverDocument.delete({
      where: { id: docId },
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("❌ Handover DELETE Error:", error)
    return NextResponse.json({ error: error.message || "Belge silinemedi" }, { status: 500 })
  }
}
