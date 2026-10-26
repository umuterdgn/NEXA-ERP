/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Nexa ERP - Dynamic Forms Management API
 */

import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    const userRole = session?.user?.role as string
    const isSuperAdmin = userRole === "SUPER_ADMIN"
    const tenantId = (session?.user as any)?.tenantId as string | undefined

    if (!session?.user || (!tenantId && !isSuperAdmin)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const tenantFilter: any = !isSuperAdmin ? (tenantId ? { tenantId } : { tenantId: "non-existent" }) : {}

    const { searchParams } = new URL(request.url)
    const category = searchParams.get("category")
    const search = searchParams.get("search")
    const id = searchParams.get("id")

    // If fetching single form
    if (id) {
      const form = await prisma.dynamicForm.findFirst({
        where: { id, ...tenantFilter },
        include: {
          submissions: {
            take: 10,
            orderBy: { createdAt: "desc" },
            include: {
              user: { select: { id: true, name: true, email: true, profileImage: true } },
              project: { select: { id: true, title: true, status: true } }
            }
          },
          _count: {
            select: { submissions: true }
          }
        }
      })

      if (!form) {
        return NextResponse.json({ error: "Form bulunamadı." }, { status: 404 })
      }

      return NextResponse.json({ form })
    }

    // Filter conditions
    const whereClause: any = { ...tenantFilter }
    if (category && category !== "ALL") {
      whereClause.category = category
    }
    if (search && search.trim()) {
      whereClause.OR = [
        { title: { contains: search.trim(), mode: "insensitive" } },
        { description: { contains: search.trim(), mode: "insensitive" } }
      ]
    }

    const forms = await prisma.dynamicForm.findMany({
      where: whereClause,
      include: {
        _count: {
          select: { submissions: true }
        },
        submissions: {
          take: 1,
          orderBy: { createdAt: "desc" },
          select: { createdAt: true }
        }
      },
      orderBy: { createdAt: "desc" }
    })

    const formattedForms = forms.map(f => ({
      ...f,
      submissionCount: f._count.submissions,
      lastSubmissionAt: f.submissions[0]?.createdAt || null
    }))

    return NextResponse.json({ forms: formattedForms })
  } catch (error: any) {
    console.error("GET Dynamic Forms Error:", error)
    return NextResponse.json(
      { error: "Formlar yüklenirken bir hata oluştu.", details: error.message },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    const userRole = session?.user?.role as string
    const isSuperAdmin = userRole === "SUPER_ADMIN"
    const tenantId = (session?.user as any)?.tenantId as string | undefined

    if (!session?.user || (!tenantId && !isSuperAdmin)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { title, description, category, fields } = body

    if (!title || typeof title !== "string" || !title.trim()) {
      return NextResponse.json(
        { error: "Form başlığı zorunludur." },
        { status: 400 }
      )
    }

    if (!fields || !Array.isArray(fields) || fields.length === 0) {
      return NextResponse.json(
        { error: "Form en az bir denetim alanı (field) içermelidir." },
        { status: 400 }
      )
    }

    const newForm = await prisma.dynamicForm.create({
      data: {
        title: title.trim(),
        description: description?.trim() || null,
        category: category?.trim() || "GENEL",
        fields: fields,
        tenantId: tenantId || null,
      }
    })

    return NextResponse.json({
      success: true,
      message: "Form şablonu başarıyla oluşturuldu.",
      form: newForm
    })
  } catch (error: any) {
    console.error("POST Dynamic Form Error:", error)
    return NextResponse.json(
      { error: "Form kaydedilirken hata oluştu.", details: error.message },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await auth()
    const userRole = session?.user?.role as string
    const isSuperAdmin = userRole === "SUPER_ADMIN"
    const tenantId = (session?.user as any)?.tenantId as string | undefined

    if (!session?.user || (!tenantId && !isSuperAdmin)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { id, title, description, category, fields } = body

    if (!id) {
      return NextResponse.json(
        { error: "Güncellenecek Form ID'si gereklidir." },
        { status: 400 }
      )
    }

    if (!isSuperAdmin) {
      const existing = await prisma.dynamicForm.findFirst({
        where: { id, tenantId }
      })
      if (!existing) {
        return NextResponse.json({ error: "Form bulunamadı veya yetkisiz erişim" }, { status: 404 })
      }
    }

    if (!title || typeof title !== "string" || !title.trim()) {
      return NextResponse.json(
        { error: "Form başlığı zorunludur." },
        { status: 400 }
      )
    }

    if (!fields || !Array.isArray(fields) || fields.length === 0) {
      return NextResponse.json(
        { error: "Form en az bir alan içermelidir." },
        { status: 400 }
      )
    }

    const updatedForm = await prisma.dynamicForm.update({
      where: { id },
      data: {
        title: title.trim(),
        description: description?.trim() || null,
        category: category?.trim() || "GENEL",
        fields: fields
      }
    })

    return NextResponse.json({
      success: true,
      message: "Form şablonu güncellendi.",
      form: updatedForm
    })
  } catch (error: any) {
    console.error("PUT Dynamic Form Error:", error)
    return NextResponse.json(
      { error: "Form güncellenirken hata oluştu.", details: error.message },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await auth()
    const userRole = session?.user?.role as string
    const isSuperAdmin = userRole === "SUPER_ADMIN"
    const tenantId = (session?.user as any)?.tenantId as string | undefined

    if (!session?.user || (!tenantId && !isSuperAdmin)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json(
        { error: "Silinecek Form ID'si gereklidir." },
        { status: 400 }
      )
    }

    if (!isSuperAdmin) {
      const existing = await prisma.dynamicForm.findFirst({
        where: { id, tenantId }
      })
      if (!existing) {
        return NextResponse.json({ error: "Form bulunamadı veya yetkisiz erişim" }, { status: 404 })
      }
    }

    await prisma.dynamicForm.delete({
      where: { id }
    })

    return NextResponse.json({
      success: true,
      message: "Form şablonu ve ilişkili kayıtlar silindi."
    })
  } catch (error: any) {
    console.error("DELETE Dynamic Form Error:", error)
    return NextResponse.json(
      { error: "Form silinirken hata oluştu.", details: error.message },
      { status: 500 }
    )
  }
}
