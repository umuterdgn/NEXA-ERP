/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Nexa ERP - Dynamic Form Submissions Admin API
 */

import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const formId = searchParams.get("formId")
    const projectId = searchParams.get("projectId")
    const status = searchParams.get("status")

    const whereClause: any = {}
    if (formId) whereClause.formId = formId
    if (projectId) whereClause.projectId = projectId
    if (status && status !== "ALL") whereClause.status = status

    const submissions = await prisma.formSubmission.findMany({
      where: whereClause,
      include: {
        form: {
          select: { id: true, title: true, category: true, fields: true }
        },
        project: {
          select: { id: true, title: true, status: true, city: true }
        },
        user: {
          select: { id: true, name: true, email: true, profileImage: true, role: true }
        }
      },
      orderBy: { createdAt: "desc" }
    })

    return NextResponse.json({ submissions })
  } catch (error: any) {
    console.error("GET Form Submissions Error:", error)
    return NextResponse.json(
      { error: "Denetim kayıtları yüklenirken hata oluştu.", details: error.message },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { id, status, notes } = await request.json()

    if (!id) {
      return NextResponse.json({ error: "Kayıt ID zorunludur." }, { status: 400 })
    }

    const updated = await prisma.formSubmission.update({
      where: { id },
      data: {
        ...(status ? { status } : {}),
        ...(notes !== undefined ? { notes } : {})
      }
    })

    return NextResponse.json({ success: true, submission: updated })
  } catch (error: any) {
    console.error("PATCH Form Submission Error:", error)
    return NextResponse.json(
      { error: "Kayıt güncellenirken hata oluştu.", details: error.message },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ error: "Kayıt ID zorunludur." }, { status: 400 })
    }

    await prisma.formSubmission.delete({
      where: { id }
    })

    return NextResponse.json({ success: true, message: "Denetim kaydı silindi." })
  } catch (error: any) {
    console.error("DELETE Form Submission Error:", error)
    return NextResponse.json(
      { error: "Kayıt silinirken hata oluştu.", details: error.message },
      { status: 500 }
    )
  }
}
