/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * This code is the property of NXA Software.
 */

import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { revalidatePath } from "next/cache"
import { deleteFromCloudinary, deleteMultipleFromCloudinary } from "@/lib/cloudinary"

export async function GET() {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const services = await prisma.service.findMany({
      orderBy: { createdAt: "desc" }
    })

    return NextResponse.json(services)
  } catch (error) {
    console.error("Services fetch error:", error)
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
    
    // id'yi ayır, geri kalan tüm verileri dataToSave içine al
    const { id, ...dataToSave } = body

    const service = await prisma.service.create({
      data: {
        ...dataToSave,
        images: (dataToSave.images || []).filter((img: string) => img && img.trim() !== ''),
        threeDModelUrl: dataToSave.threeDModelUrl || null
      }
    })

    revalidatePath("/")
    revalidatePath("/hizmetlerimiz")

    return NextResponse.json(service)
  } catch (error) {
    console.error("Service create error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { id, title, description, images, threeDModelUrl } = body

    // Önce eski servisi bul
    const existingService = await prisma.service.findUnique({
      where: { id }
    })

    if (!existingService) {
      return NextResponse.json(
        { error: "Hizmet bulunamadı" },
        { status: 404 }
      )
    }

    // 3D model değiştiyse eskisini sil
    if (threeDModelUrl && threeDModelUrl !== existingService.threeDModelUrl && existingService.threeDModelUrl) {
      await deleteFromCloudinary(existingService.threeDModelUrl)
    }

    // Görseller değiştiyse eskilerini sil
    if (images && images.length > 0) {
      const oldImages = existingService.images || []
      const newImages = images.filter((img: string) => img && img.trim() !== '')
      
      // Eski görsellerden yeni olanlarda olmayanları sil
      const imagesToDelete = oldImages.filter((oldImg: string) => !newImages.includes(oldImg))
      if (imagesToDelete.length > 0) {
        await deleteMultipleFromCloudinary(imagesToDelete)
      }
    }

    const service = await prisma.service.update({
      where: { id },
      data: {
        title,
        description,
        images: (images || []).filter((img: string) => img && img.trim() !== ''),
        threeDModelUrl: threeDModelUrl || null
      }
    })

    revalidatePath("/")
    revalidatePath("/hizmetlerimiz")

    return NextResponse.json(service)
  } catch (error) {
    console.error("Service update error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}