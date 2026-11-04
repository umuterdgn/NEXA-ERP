/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Franchise BIM / IFC Model Yükleme ve Listeleme API Endpoint
 */

import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 })
    }

    const tenantId = (session.user as any)?.tenantId

    const bimFiles = await prisma.bimFile.findMany({
      where: tenantId ? { tenantId } : {},
      include: {
        project: {
          select: {
            id: true,
            name: true,
            title: true,
            city: true,
          },
        },
      },
      orderBy: { uploadedAt: "desc" },
    })

    return NextResponse.json({ success: true, bimFiles })
  } catch (error: any) {
    console.error("[Franchise BIM GET Error]:", error)
    return NextResponse.json(
      { error: error?.message || "BIM modelleri alınırken hata oluştu" },
      { status: 500 }
    )
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

    const {
      name,
      fileName,
      projectId,
      fileUrl,
      fileType = "ifc",
      discipline = "ARCHITECTURAL",
      lodLevel = "LOD_300",
    } = body

    if (!fileName && !name) {
      return NextResponse.json(
        { error: "Model veya dosya adı zorunludur" },
        { status: 400 }
      )
    }

    // Proje kontrolü (veya varsayılan ilk proje)
    let targetProjectId = projectId
    if (!targetProjectId) {
      const defaultProj = await prisma.project.findFirst({
        where: tenantId ? { tenantId } : {},
        select: { id: true },
      })
      targetProjectId = defaultProj?.id
    }

    if (!targetProjectId) {
      return NextResponse.json(
        { error: "Lütfen modeli bağlamak için bir proje seçin" },
        { status: 400 }
      )
    }

    const finalFileName = (name || fileName).endsWith(`.${fileType}`)
      ? name || fileName
      : `${name || fileName}.${fileType}`

    const finalFileUrl =
      fileUrl ||
      `/models/bim/${encodeURIComponent(finalFileName)}`

    // Veritabanına kaydet
    const bimFile = await prisma.bimFile.create({
      data: {
        projectId: targetProjectId,
        fileName: finalFileName,
        fileUrl: finalFileUrl,
        fileType: fileType.toLowerCase(),
        tenantId: tenantId || null,
        isActive: true,
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            title: true,
          },
        },
      },
    })

    console.log(
      `[Franchise BIM] Yeni BIM Modeli Kaydedildi: ${bimFile.fileName} (Proje: ${bimFile.projectId})`
    )

    return NextResponse.json({
      success: true,
      message: "BIM / IFC modeli başarıyla veritabanına kaydedildi.",
      bimFile,
    })
  } catch (error: any) {
    console.error("[Franchise BIM POST Error]:", error)
    return NextResponse.json(
      { error: error?.message || "BIM modeli kaydedilirken hata oluştu" },
      { status: 500 }
    )
  }
}

