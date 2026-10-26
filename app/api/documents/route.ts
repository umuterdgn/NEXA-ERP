/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Centralized Document Archive API with Tenant Storage Quota Support
 */

import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

export async function POST(request: NextRequest) {
  try {
    const session = await auth().catch(() => null)
    const body = await request.json()
    const { 
      title, 
      category, 
      fileUrl, 
      projectId, 
      expiryDate,
      sourceModule = "DIGITAL_ARCHIVE",
      fileSizeMB = 0,
      tenantId: customTenantId
    } = body

    if (!title || !category || !fileUrl) {
      return NextResponse.json(
        { error: "Eksik alanlar var (başlık, kategori ve dosya linki zorunludur)" },
        { status: 400 }
      )
    }

    let effectiveTenantId = customTenantId || (session?.user as any)?.tenantId || null
    if (!effectiveTenantId && projectId) {
      const proj = await prisma.project.findUnique({
        where: { id: projectId },
        select: { tenantId: true }
      }).catch(() => null)
      if (proj?.tenantId) effectiveTenantId = proj.tenantId
    }

    const calculatedSizeMB = Number(fileSizeMB) > 0 ? Number(fileSizeMB) : 0.05

    // Create document archive entry
    const document = await prisma.documentArchive.create({
      data: {
        title,
        category,
        fileUrl,
        projectId: projectId || null,
        tenantId: effectiveTenantId,
        isGlobalArchive: true,
        sourceModule,
        fileSizeMB: calculatedSizeMB,
        expiryDate: expiryDate ? new Date(expiryDate) : null
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            title: true
          }
        }
      }
    })

    // Update Tenant Storage Quota
    if (effectiveTenantId && calculatedSizeMB > 0) {
      await prisma.tenant.update({
        where: { id: effectiveTenantId },
        data: {
          usedStorageMB: {
            increment: calculatedSizeMB
          }
        }
      }).catch(err => {
        console.warn("Storage quota increment error:", err)
      })
    }

    return NextResponse.json(document, { status: 201 })
  } catch (error) {
    console.error("Document creation error:", error)
    return NextResponse.json(
      { error: "Evrak oluşturulurken hata oluştu" },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth().catch(() => null)
    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get("projectId")
    const category = searchParams.get("category")
    const sourceModule = searchParams.get("sourceModule")
    const isGlobalOnly = searchParams.get("globalOnly") === "true"

    const sessionTenantId = (session?.user as any)?.tenantId
    const isSuperAdmin = session?.user?.role === "SUPER_ADMIN"
    const tenantFilter: any = !isSuperAdmin
      ? sessionTenantId
        ? { tenantId: sessionTenantId }
        : { tenantId: "non-existent-tenant" }
      : {}

    const documents = await prisma.documentArchive.findMany({
      where: {
        ...(projectId && { projectId }),
        ...(category && { category }),
        ...(sourceModule && { sourceModule }),
        ...(isGlobalOnly && { isGlobalArchive: true }),
        ...tenantFilter
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            title: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json(documents)
  } catch (error) {
    console.error("Documents fetch error:", error)
    return NextResponse.json(
      { error: "Evraklar getirilirken hata oluştu" },
      { status: 500 }
    )
  }
}
