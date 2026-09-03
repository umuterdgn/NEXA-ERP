/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * This code is the property of NXA Software.
 */

import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { deleteFromCloudinary, deleteMultipleFromCloudinary } from "@/lib/cloudinary"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params
    
    const project = await prisma.project.findUnique({
      where: { id: resolvedParams.id },
      include: {
        company: true,
        manager: true
      }
    })

    if (!project) {
      return NextResponse.json(
        { error: "Proje bulunamadı" },
        { status: 404 }
      )
    }

    return NextResponse.json(project)
  } catch (error) {
    console.error("Error fetching project:", error)
    return NextResponse.json(
      { error: "Proje getirilirken hata oluştu" },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params
    const body = await request.json()
    const { status } = body

    if (!status) {
      return NextResponse.json(
        { error: "Durum zorunludur" },
        { status: 400 }
      )
    }

    const project = await prisma.project.update({
      where: { id: resolvedParams.id },
      data: { status },
      include: {
        company: true
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

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params
    const body = await request.json()
    const { name, description, status, companyId, startDate, endDate, threeDModelUrl, images, managerId, engineers, architects, city, district, mintika, ada, parsel, pafta, yapiSinifi, clientName, mapUrl, latitude, longitude, geofenceRadius, gpsRadius, shiftStart, shiftEnd } = body
    const normalizedGeofenceRadius = geofenceRadius ?? gpsRadius ?? 100

    // Önce eski projeyi bul
    const existingProject = await prisma.project.findUnique({
      where: { id: resolvedParams.id }
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

    // Projeyi güncelle
    const project = await prisma.project.update({
      where: { id: resolvedParams.id },
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
        city: city || null,
        district: district || null,
        mintika: mintika || null,
        ada: ada || null,
        parsel: parsel || null,
        pafta: pafta || null,
        yapiSinifi: yapiSinifi || null,
        clientName: clientName || null,
        mapUrl: mapUrl || null,
        shiftStart: shiftStart || "08:00",
        shiftEnd: shiftEnd || "17:00",
        latitude: latitude ? parseFloat(latitude) : null,
        longitude: longitude ? parseFloat(longitude) : null,
        gpsRadius: normalizedGeofenceRadius !== null && normalizedGeofenceRadius !== undefined ? Number(normalizedGeofenceRadius) : 100,
        geofenceRadius: normalizedGeofenceRadius !== null && normalizedGeofenceRadius !== undefined ? Number(normalizedGeofenceRadius) : 100
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

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params
    
    // Önce projeyi bul ve medyaları al
    const project = await prisma.project.findUnique({
      where: { id: resolvedParams.id }
    })

    if (!project) {
      return NextResponse.json(
        { error: "Proje bulunamadı" },
        { status: 404 }
      )
    }

    // Cloudinary'den medyaları sil
    if (project.threeDModelUrl) {
      await deleteFromCloudinary(project.threeDModelUrl)
    }

    if (project.images && project.images.length > 0) {
      await deleteMultipleFromCloudinary(project.images)
    }

    // Projeyi veritabanından sil
    await prisma.project.delete({
      where: { id: resolvedParams.id }
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
