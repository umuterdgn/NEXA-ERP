/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * This code is the property of NXA Software.
 */

import { NextResponse } from "next/server"
import { revalidatePath } from 'next/cache'
import { prisma } from "@/lib/prisma"
import { deleteFromCloudinary, deleteMultipleFromCloudinary } from "@/lib/cloudinary"
import { auth } from "@/lib/auth"
import { logAction } from "@/lib/logger"

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const session = await auth()
    const userRole = session?.user?.role
    const userId = session?.user?.id
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')

    console.log("📋 Projects API - Session:", { userRole, userId })

    const isAdmin = userRole === "ADMIN" || userRole === "SUPER_ADMIN"
    const roleWhereClause = !isAdmin && userId ? { managerId: userId } : {}

    const searchWhereClause = search
      ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' as const } },
            { title: { contains: search, mode: 'insensitive' as const } },
            { parsel: { contains: search, mode: 'insensitive' as const } },
            { mintika: { contains: search, mode: 'insensitive' as const } },
            { clientName: { contains: search, mode: 'insensitive' as const } },
            { city: { contains: search, mode: 'insensitive' as const } },
            { district: { contains: search, mode: 'insensitive' as const } },
          ]
        }
      : {}

    const whereClause = {
      ...roleWhereClause,
      ...searchWhereClause
    }

    console.log("📋 Projects API - Where clause:", whereClause)

    const projects = await prisma.project.findMany({
      where: whereClause,
      include: {
        company: true,
        manager: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    console.log("📋 DB'den çekilen projeler:", projects)
    console.log("📋 Projects API - Fetched projects count:", projects.length)

    return NextResponse.json(projects || [])
  } catch (error) {
    console.error("❌ Error fetching projects:", error)
    return NextResponse.json([], { status: 200 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    console.log("📥 Gelen Proje Verisi:", body)

    // id'yi ve varsa hatalı gelebilecek diğer alanları ayıklıyoruz
    const { images, companyId, managerId, engineers, architects, ...restData } = body

    // Prisma schema'nda olabilecek zorunlu alanlar için güvenlik ağı kuruyoruz.
    // Eğer veritabanın (örneğin SQLite) string array desteklemiyorsa images'ı JSON string yapman gerekebilir. 
    // Mevcut şemana göre images: images veya images: JSON.stringify(images) olarak ayarla.
    const geofenceRadiusValue = restData.geofenceRadius ?? restData.gpsRadius ?? 100
    const dataToSave = {
      ...restData,
      images: (images || []).filter((img: string) => img && img.trim() !== ''),
      title: restData.name || restData.title,
      description: restData.description || restData.name || restData.title,
      company: companyId ? { connect: { id: companyId } } : undefined,
      manager: managerId ? { connect: { id: managerId } } : undefined,
      engineers: engineers || [],
      architects: architects || [],
      startDate: restData.startDate && restData.startDate !== "" ? new Date(restData.startDate) : new Date(),
      endDate: restData.endDate && restData.endDate !== "" ? new Date(restData.endDate) : null,
      threeDModelUrl: restData.threeDModelUrl || null,
      siteManager: restData.siteManager || null,
      engineer: restData.engineer || null,
      architect: restData.architect || null,
      // New categorization and location fields
      category: restData.category || null,
      city: restData.city || null,
      district: restData.district || null,
      mintika: restData.mintika || null,
      ada: restData.ada || null,
      parsel: restData.parsel || null,
      pafta: restData.pafta || null,
      yapiSinifi: restData.yapiSinifi || null,
      clientName: restData.clientName || null,
      // Shift hours
      shiftStart: restData.shiftStart || "08:00",
      shiftEnd: restData.shiftEnd || "17:00",
      // Geofencing (GPS) fields - optional
      latitude: restData.latitude ? parseFloat(restData.latitude) : null,
      longitude: restData.longitude ? parseFloat(restData.longitude) : null,
      gpsRadius: geofenceRadiusValue !== null && geofenceRadiusValue !== undefined ? Number(geofenceRadiusValue) : 100,
      geofenceRadius: geofenceRadiusValue !== null && geofenceRadiusValue !== undefined ? Number(geofenceRadiusValue) : 100,
    }

    const newProject = await prisma.project.create({
      data: dataToSave,
      include: {
        company: true,
        manager: true
      }
    })

    // Log the action
    await logAction("PROJE_EKLENDI", `${newProject.title || newProject.name} adlı proje oluşturuldu.`, "Admin")
    revalidatePath('/admin/projects')

    return NextResponse.json(newProject, { status: 201 })

  } catch (error: unknown) {
    // KRİTİK: Hatayı gizleme, tam olarak neyin eksik olduğunu terminale KIPKIRMIZI bas!
    console.error("❌ PRISMA KAYIT HATASI (DETAYLI):", error)

    return NextResponse.json(
      {
        error: "Kayıt hatası",
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 400 }
    )
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json()
    const { id, name, description, status, companyId, startDate, endDate, threeDModelUrl, images, managerId, engineers, architects } = body

    // Önce eski projeyi bul
    const existingProject = await prisma.project.findUnique({
      where: { id }
    })

    if (!existingProject) {
      return NextResponse.json(
        { error: "Proje bulunamadı" },
        { status: 404 }
      )
    }

    // 3D model değiştiyse eskisini sil
    if (threeDModelUrl && threeDModelUrl !== existingProject.threeDModelUrl && existingProject.threeDModelUrl) {
      await deleteFromCloudinary(existingProject.threeDModelUrl)
    }

    // Görseller değiştiyse eskilerini sil
    if (images && images.length > 0) {
      const oldImages = existingProject.images || []
      const newImages = images.filter((img: string) => img && img.trim() !== '')
      
      // Eski görsellerden yeni olanlarda olmayanları sil
      const imagesToDelete = oldImages.filter((oldImg: string) => !newImages.includes(oldImg))
      if (imagesToDelete.length > 0) {
        await deleteMultipleFromCloudinary(imagesToDelete)
      }
    }

    const project = await prisma.project.update({
      where: { id },
      data: {
        name,
        title: name,
        description: description || name,
        status,
        company: companyId ? { connect: { id: companyId } } : undefined,
        manager: managerId ? { connect: { id: managerId } } : undefined,
        engineers: engineers || [],
        architects: architects || [],
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : null,
        threeDModelUrl: threeDModelUrl || null,
        images: (images || []).filter((img: string) => img && img.trim() !== ''),
        siteManager: body.siteManager || null,
        engineer: body.engineer || null,
        architect: body.architect || null,
        // New categorization and location fields
        category: body.category || null,
        city: body.city || null,
        district: body.district || null,
        mintika: body.mintika || null,
        ada: body.ada || null,
        parsel: body.parsel || null,
        clientName: body.clientName || null,
        // Shift hours
        shiftStart: body.shiftStart || null,
        shiftEnd: body.shiftEnd || null
      },
      include: {
        company: true,
        manager: true
      }
    })

    return NextResponse.json(project)
  } catch (error) {
    console.error("Error updating project:", error)
    return NextResponse.json(
      { error: "Proje güncellenirken hata oluştu" },
      { status: 500 }
    )
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: "Project ID required" }, { status: 400 })
    }

    await prisma.project.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting project:", error)
    return NextResponse.json(
      { error: "Proje silinirken hata oluştu" },
      { status: 500 }
    )
  }
}
