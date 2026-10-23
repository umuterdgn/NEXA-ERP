/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Saha Talimatları (Site Instructions) - Kanban Board Görünümü
 * app/admin/projects/[id]/instructions/page.tsx
 */

import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import Link from "next/link"
import { auth } from "@/lib/auth"
import SiteInstructionsBoard from "./_components/SiteInstructionsBoard"
import { ArrowLeft, Building2, HardHat, FileSpreadsheet } from "lucide-react"

export const dynamic = "force-dynamic"

export default async function ProjectInstructionsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const session = await auth()

  const project = await prisma.project.findUnique({
    where: { id },
    select: {
      id: true,
      title: true,
      name: true,
      city: true,
      district: true,
      siteManager: true,
      engineer: true,
      company: {
        select: {
          name: true,
        },
      },
    },
  })

  if (!project) {
    notFound()
  }

  // Fetch initial instructions for the project
  const instructions = await prisma.siteInstruction.findMany({
    where: { projectId: id },
    orderBy: { createdAt: "desc" },
  })

  // Fetch users (creators)
  const creatorIds = Array.from(new Set(instructions.map((i) => i.createdById).filter(Boolean)))
  const creators = await prisma.user.findMany({
    where: { id: { in: creatorIds } },
    select: { id: true, name: true, role: true },
  })
  const creatorMap = new Map(creators.map((c) => [c.id, c]))

  // Fetch subcontractors
  const subcontractors = await prisma.subcontractor.findMany({
    select: { id: true, name: true, contactName: true, phone: true },
    orderBy: { name: "asc" },
  })
  const subMap = new Map(subcontractors.map((s) => [s.id, s]))

  const enrichedInstructions = instructions.map((item) => ({
    ...item,
    creator: creatorMap.get(item.createdById) || null,
    subcontractor: item.subcontractorId ? subMap.get(item.subcontractorId) || null : null,
  }))

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Top Header & Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800 pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Link
              href={`/admin/projects/${project.id}`}
              className="hover:text-blue-400 transition-colors flex items-center gap-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Proje Detayı
            </Link>
            <span>/</span>
            <span className="text-slate-300">Saha Talimatları (Site Instructions)</span>
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <HardHat className="w-6 h-6 text-amber-400" />
            <span>Saha Talimatları & Mimari Revizyonlar</span>
          </h1>

          <p className="text-xs text-slate-400 flex items-center gap-3">
            <span className="inline-flex items-center gap-1 text-slate-300">
              <Building2 className="w-3.5 h-3.5 text-slate-500" />
              {project.title || project.name}
            </span>
            {(project.city || project.district) && (
              <span className="text-slate-500">
                • {project.district} / {project.city}
              </span>
            )}
            {project.siteManager && (
              <span className="text-slate-500">
                • Şantiye Şefi: <strong className="text-slate-300">{project.siteManager}</strong>
              </span>
            )}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            href={`/admin/projects/${project.id}`}
            className="px-3.5 py-2 text-xs font-medium bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg text-slate-300 transition-all flex items-center gap-1.5"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Projeye Dön
          </Link>
          <Link
            href="/admin/approvals"
            className="px-3.5 py-2 text-xs font-medium bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 rounded-lg transition-all flex items-center gap-1.5"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            Onay Bekleyenler Konsolu
          </Link>
        </div>
      </div>

      {/* Interactive Kanban Board Client Component */}
      <SiteInstructionsBoard
        projectId={project.id}
        initialInstructions={enrichedInstructions}
        subcontractors={subcontractors}
        currentUserRole={session?.user?.role as string}
      />
    </div>
  )
}
