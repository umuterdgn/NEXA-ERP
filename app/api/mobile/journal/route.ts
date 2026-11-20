/**
 * © 2026 NXA Software. All rights reserved.
 * Nexa Mobile - Daily Site Journal API
 * Reads & writes real daily logs and journals from Prisma DB (Strict Tenant & RBAC Isolated).
 */

import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getMobileAuth } from "@/lib/mobile-auth"
import { assertTenantAndProjectAccess, requireAnyModule } from "@/lib/api-rbac"

export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  try {
    const auth = await getMobileAuth(request)
    if (!auth) {
      return NextResponse.json({ error: "Yetkisiz oturum." }, { status: 401 })
    }

    const denied = requireAnyModule(auth, ["site_journal"])
    if (denied) return denied

    const { tenantId, assignedProjectIds } = auth
    const { searchParams } = new URL(request.url)
    const reqProjectId = searchParams.get("projectId")

    if (reqProjectId) {
      const accessErr = await assertTenantAndProjectAccess(auth, reqProjectId)
      if (accessErr) return accessErr
    }

    const whereClause: any = {
      ...(tenantId ? { tenantId } : {}),
    }
    if (reqProjectId) {
      whereClause.projectId = reqProjectId
    } else if (assignedProjectIds.length > 0) {
      whereClause.projectId = { in: assignedProjectIds }
    }

    const journals = await prisma.dailyJournal.findMany({
      where: whereClause,
      orderBy: { date: "desc" },
      take: 20,
    })

    const projects = await prisma.project.findMany({
      where: tenantId ? { tenantId, deletedAt: null } : { deletedAt: null },
      select: { id: true, name: true, title: true },
    })
    const projectMap = new Map(projects.map((p) => [p.id, p.name || p.title]))

    const formatted = journals.map((j) => {
      const weatherData: any = j.weather || {}
      return {
        id: j.id,
        date: new Date(j.date).toLocaleDateString("tr-TR", {
          day: "numeric",
          month: "long",
          year: "numeric",
        }),
        project: projectMap.get(j.projectId) || "Şantiye",
        block: "Saha",
        personnelCount: j.workerCount || 0,
        weatherSummary: weatherData.summary || "Açık",
        temperature: weatherData.temperature ?? null,
        worksDone: j.engineerNotes || "",
        status: j.status === "SUBMITTED" ? "ONAYLANDI" : "İNCELENİYOR",
      }
    })

    return NextResponse.json({ success: true, count: formatted.length, journals: formatted })
  } catch (error: any) {
    console.error("[API_MOBILE_JOURNAL_GET] Error:", error)
    return NextResponse.json({ error: error.message || "Jurnal kayıtları getirilemedi" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const auth = await getMobileAuth(request)
    if (!auth) {
      return NextResponse.json({ error: "Yetkisiz oturum." }, { status: 401 })
    }

    const denied = requireAnyModule(auth, ["site_journal"])
    if (denied) return denied

    const { userId, tenantId, assignedProjectIds } = auth
    const body = await request.json().catch(() => ({}))
    const {
      projectId: reqProjectId,
      project,
      block,
      personnelCount,
      worksDone,
      equipment,
      isgNotes,
      weatherSummary,
      temperature,
      latitude,
      longitude,
    } = body

    if (!worksDone || !worksDone.trim()) {
      return NextResponse.json({ error: "Lütfen yapılan işler açıklamasını girin" }, { status: 400 })
    }

    if (reqProjectId) {
      const accessErr = await assertTenantAndProjectAccess(auth, reqProjectId)
      if (accessErr) return accessErr
    }

    let dbProject = reqProjectId
      ? await prisma.project.findFirst({ where: { id: reqProjectId, ...(tenantId ? { tenantId } : {}) } })
      : await prisma.project.findFirst({
          where: {
            ...(tenantId ? { tenantId } : {}),
            ...(assignedProjectIds.length > 0 ? { id: { in: assignedProjectIds } } : {}),
            ...(project ? { name: { contains: project, mode: "insensitive" } } : {}),
            deletedAt: null,
          },
        })

    if (!dbProject) {
      return NextResponse.json({ error: "Proje bulunamadı." }, { status: 400 })
    }

    const newJournal = await prisma.dailyJournal.create({
      data: {
        tenantId,
        projectId: dbProject.id,
        engineerId: userId,
        workerCount: Number(personnelCount) || 10,
        weather: {
          summary: weatherSummary || "Açık",
          temperature: Number(temperature) || 20,
          latitude,
          longitude,
        },
        consumedItems: equipment ? [{ equipment }] : [],
        completedWorks: [{ description: worksDone, block: block || "Genel" }],
        ncrReports: isgNotes ? [{ note: isgNotes }] : [],
        engineerNotes: `${worksDone}${equipment ? `\nEkipman: ${equipment}` : ""}${isgNotes ? `\nİSG Notu: ${isgNotes}` : ""}`,
        status: "SUBMITTED",
      },
    })

    return NextResponse.json({
      success: true,
      journal: {
        id: newJournal.id,
        date: "Bugün (" + new Date().toLocaleDateString("tr-TR") + ")",
        project: dbProject.name || dbProject.title,
        block: block || "Saha",
        personnelCount: Number(personnelCount) || 10,
        weatherSummary: weatherSummary || "Açık",
        temperature: Number(temperature) || 20,
        worksDone,
        equipment: equipment || "-",
        isgNotes: isgNotes || "-",
        status: "ONAYLANDI",
      },
    })
  } catch (error: any) {
    console.error("[API_MOBILE_JOURNAL_POST] Error:", error)
    return NextResponse.json({ error: error.message || "Jurnal kaydedilemedi" }, { status: 500 })
  }
}
