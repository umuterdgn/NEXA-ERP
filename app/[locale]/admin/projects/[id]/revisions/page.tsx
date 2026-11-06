/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Nexa ERP - Proje Revizyon Karşılaştırma & Diff Sayfası (2D & 3D BIM)
 */

import { notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"
import ProjectRevisionDiffClient from "./_components/ProjectRevisionDiffClient"

export const dynamic = "force-dynamic"

export default async function ProjectRevisionsPage({
  params,
}: {
  params: Promise<{ id: string; locale: string }>
}) {
  const { id, locale } = await params

  const project = await prisma.project.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      status: true,
      startDate: true,
      endDate: true,
    },
  })

  if (!project) {
    notFound()
  }

  return (
    <div className="flex-1 min-h-screen bg-slate-50 dark:bg-[#0A0F1C] text-slate-900 dark:text-white">
      <ProjectRevisionDiffClient
        project={{
          id: project.id,
          name: project.name || "Şantiye Projesi",
          code: project.id.slice(-6).toUpperCase(),
          status: project.status || "ACTIVE",
        }}
        locale={locale}
      />
    </div>
  )
}

