/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Şantiye İlerleme Takibi (Progress Tracking) & Keşif/Metraj (BoQ) Sayfası
 */

import { getProjectProgressData } from "./actions"
import ProjectProgressClient from "./ProjectProgressClient"
import Link from "next/link"
import { ArrowLeft, Building2 } from "lucide-react"

export const dynamic = "force-dynamic"

export default async function ProjectProgressPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const unwrappedParams = await params
  const projectId = unwrappedParams.id

  const data = await getProjectProgressData(projectId)

  if (!data.success || !data.project) {
    return (
      <div className="max-w-4xl mx-auto py-16 text-center space-y-4">
        <Building2 className="w-12 h-12 text-slate-600 mx-auto mb-2" />
        <h2 className="text-xl font-bold text-white">Proje Bulunamadı</h2>
        <p className="text-sm text-slate-400">
          İstenen proje ID ({projectId}) sistemde kayıtlı değil veya silinmiş.
        </p>
        <Link
          href="/inspection/projects"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 text-white text-xs font-semibold hover:bg-slate-700 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Projeler Listesine Dön</span>
        </Link>
      </div>
    )
  }

  return (
    <ProjectProgressClient
      projectId={projectId}
      initialProject={data.project}
      initialBoqItems={data.boqItems}
      initialSummary={data.summary}
    />
  )
}
