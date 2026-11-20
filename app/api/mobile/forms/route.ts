/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * GET/POST /api/mobile/forms
 * Dinamik Denetim Formları & Yanıt Gönderimi API'si
 */

import { NextResponse } from "next/server"
import { getMobileAuth } from "@/lib/mobile-auth"
import { prisma } from "@/lib/prisma"
import {
  assertRecordTenantScope,
  assertTenantAndProjectAccess,
  requireAnyModule,
} from "@/lib/api-rbac"

export const runtime = "nodejs"

export async function GET(request: Request) {
  try {
    const auth = await getMobileAuth(request)
    if (!auth) {
      return NextResponse.json({ error: "Yetkisiz oturum." }, { status: 401 })
    }

    const denied = requireAnyModule(auth, ["dynamic_forms", "form_builder"])
    if (denied) return denied

    const { tenantId } = auth

    const forms = await prisma.dynamicForm.findMany({
      where: {
        ...(tenantId ? { tenantId } : {}),
      },
      orderBy: { createdAt: "desc" },
      take: 30,
    })

    return NextResponse.json({
      success: true,
      count: forms.length,
      forms: forms.map((f) => ({
        id: f.id,
        title: f.title,
        description: f.description,
        category: f.category,
        fields: f.fields,
      })),
    })
  } catch (error: any) {
    console.error("Mobile forms GET error:", error)
    return NextResponse.json({ error: "Formlar alınamadı." }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const auth = await getMobileAuth(request)
    if (!auth) {
      return NextResponse.json({ error: "Yetkisiz oturum." }, { status: 401 })
    }

    const denied = requireAnyModule(auth, ["dynamic_forms", "form_builder"])
    if (denied) return denied

    const { userId, tenantId, assignedProjectIds } = auth
    const body = await request.json().catch(() => ({}))
    const { formId, projectId: reqProjectId, answers, notes } = body

    if (!formId || !answers) {
      return NextResponse.json({ error: "Form ID ve yanıtlar zorunludur." }, { status: 400 })
    }

    if (reqProjectId) {
      const accessErr = await assertTenantAndProjectAccess(auth, reqProjectId)
      if (accessErr) return accessErr
    }

    const form = await prisma.dynamicForm.findUnique({ where: { id: formId } })
    if (!form) {
      return NextResponse.json({ error: "Form şablonu bulunamadı." }, { status: 404 })
    }
    const formScopeErr = assertRecordTenantScope(auth, form)
    if (formScopeErr) return formScopeErr

    const targetProjectId =
      reqProjectId ||
      assignedProjectIds[0] ||
      (tenantId ? (await prisma.project.findFirst({ where: { tenantId, deletedAt: null } }))?.id : undefined)

    if (!targetProjectId) {
      return NextResponse.json({ error: "Proje bulunamadı." }, { status: 400 })
    }

    const submission = await prisma.formSubmission.create({
      data: {
        tenantId,
        formId,
        projectId: targetProjectId,
        userId,
        answers: answers || {},
        notes: notes || null,
        status: "COMPLETED",
      },
    })

    return NextResponse.json({
      success: true,
      message: "Denetim formu başarıyla gönderildi.",
      submissionId: submission.id,
      submission,
    })
  } catch (error: any) {
    console.error("Mobile forms POST error:", error)
    return NextResponse.json({ error: "Form kaydedilemedi." }, { status: 500 })
  }
}
