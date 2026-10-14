/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Nexa ERP - Field Personnel Dynamic Forms API
 */

import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    const userId = session?.user?.id

    const [forms, projects, mySubmissions] = await Promise.all([
      // All available form templates
      prisma.dynamicForm.findMany({
        orderBy: { createdAt: "desc" }
      }),
      // Active projects for selection
      prisma.project.findMany({
        where: { isActive: true },
        select: { id: true, title: true, status: true, city: true, district: true },
        orderBy: { title: "asc" }
      }),
      // User's previous submissions if logged in
      userId ? prisma.formSubmission.findMany({
        where: { userId },
        include: {
          form: { select: { id: true, title: true, category: true, fields: true } },
          project: { select: { id: true, title: true } }
        },
        orderBy: { createdAt: "desc" },
        take: 30
      }) : []
    ])

    return NextResponse.json({
      success: true,
      forms,
      projects,
      mySubmissions
    })
  } catch (error: any) {
    console.error("GET Personnel Forms Error:", error)
    return NextResponse.json(
      { error: "Formlar ve projeler yüklenirken hata oluştu.", details: error.message },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    let userId = session?.user?.id

    const body = await request.json()
    const { formId, projectId, answers, notes, status } = body

    if (!formId) {
      return NextResponse.json({ error: "Form ID seçilmelidir." }, { status: 400 })
    }

    if (!projectId) {
      return NextResponse.json({ error: "Proje seçilmelidir." }, { status: 400 })
    }

    if (!answers || typeof answers !== "object") {
      return NextResponse.json({ error: "Form cevapları gereklidir." }, { status: 400 })
    }

    // If no user from session, find first admin/user for demo/testing resilience
    if (!userId) {
      const fallbackUser = await prisma.user.findFirst({
        select: { id: true }
      })
      userId = fallbackUser?.id || "anonymous-inspector"
    }

    // Verify form exists
    const form = await prisma.dynamicForm.findUnique({
      where: { id: formId }
    })

    if (!form) {
      return NextResponse.json({ error: "Seçilen form bulunamadı." }, { status: 404 })
    }

    const submission = await prisma.formSubmission.create({
      data: {
        formId,
        projectId,
        userId,
        answers,
        notes: notes || null,
        status: status || "COMPLETED"
      },
      include: {
        form: { select: { title: true, category: true } },
        project: { select: { title: true } }
      }
    })

    return NextResponse.json({
      success: true,
      message: "Denetim formu başarıyla kaydedildi.",
      submission
    })
  } catch (error: any) {
    console.error("POST Personnel Form Submission Error:", error)
    return NextResponse.json(
      { error: "Form kaydedilirken hata oluştu.", details: error.message },
      { status: 500 }
    )
  }
}
