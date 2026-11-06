"use client"
/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Nexa ERP - İlerleyiş (Progress) Proje Kartları İstemci Bileşeni
 */

import React, { useState } from "react"
import { useRouter } from "next/navigation"
import {
  TrendingUp,
  Search,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  Layers,
  ArrowRight,
  Filter,
  BarChart3,
  HardHat,
  Sparkles,
} from "lucide-react"

interface ProjectItem {
  id: string
  name: string
  code: string
  city: string
  status: string
  progress: number
  totalBoqItems: number
  completedBoqItems: number
  totalPlannedAmount: number
  totalActualAmount: number
  blocksCount: number
  blocks: {
    id: string
    name: string
    code?: string | null
    completionRate: number
    healthStatus: string
  }[]
  tasksCount: number
  startDate: string | null
  endDate: string | null
}

interface Props {
  projects: ProjectItem[]
}

export default function ProgressProjectsClient({ projects }: Props) {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("ALL")

  const formatTRY = (val: number) =>
    new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY", maximumFractionDigits: 0 }).format(val)

  const filteredProjects = projects.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.code.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus =
      statusFilter === "ALL" ||
      (statusFilter === "COMPLETED" && p.progress >= 100) ||
      (statusFilter === "IN_PROGRESS" && p.progress > 0 && p.progress < 100) ||
      (statusFilter === "NOT_STARTED" && p.progress === 0)
    return matchesSearch && matchesStatus
  })

  const totalProjects = projects.length
  const avgProgress =
    totalProjects > 0
      ? Math.round(projects.reduce((sum, p) => sum + p.progress, 0) / totalProjects)
      : 0
  const activeProjectsCount = projects.filter((p) => p.progress > 0 && p.progress < 100).length
  const completedProjectsCount = projects.filter((p) => p.progress >= 100).length

  return (
    <div className="p-6 md:p-8 space-y-8 bg-slate-50 dark:bg-[#0A0F1C] min-h-screen text-slate-900 dark:text-white">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-blue-600 dark:text-blue-400 mb-1">
            <TrendingUp className="w-4 h-4" />
            <span>ŞANTİYE VE İMALAT TAKİBİ</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Proje İlerleyiş Portalı
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Prisma veritabanındaki tüm projelerin canlı BoQ (Keşif/Metraj), Gantt şeması ve kat ilerlemeleri.
          </p>
        </div>

        {/* Global Metrik Rozetleri */}
        <div className="flex items-center gap-3">
          <div className="px-4 py-2.5 rounded-2xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 shadow-xs text-right">
            <div className="text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400">Ortalama İlerleme</div>
            <div className="text-xl font-black text-blue-600 dark:text-blue-400 font-mono">%{avgProgress}</div>
          </div>
          <div className="px-4 py-2.5 rounded-2xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 shadow-xs text-right">
            <div className="text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400">Aktif Şantiyeler</div>
            <div className="text-xl font-black text-emerald-600 dark:text-emerald-400 font-mono">{activeProjectsCount}</div>
          </div>
        </div>
      </div>

      {/* Arama & Filtreleme Çubuğu */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Proje adı, şehir veya kod ile ara..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#111827] text-slate-900 dark:text-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-xs"
          />
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          {[
            { id: "ALL", label: `Tümü (${totalProjects})` },
            { id: "IN_PROGRESS", label: `Devam Edenler (${activeProjectsCount})` },
            { id: "COMPLETED", label: `Tamamlananlar (${completedProjectsCount})` },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                statusFilter === tab.id
                  ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
                  : "bg-white dark:bg-[#111827] text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* PROJE KARTLARI (GRID) */}
      {filteredProjects.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-[#111827] rounded-3xl border border-slate-200 dark:border-slate-800">
          <Building2 className="w-12 h-12 text-slate-400 mx-auto mb-3 opacity-60" />
          <h3 className="text-base font-bold text-slate-900 dark:text-white">Kayıtlı Proje Bulunamadı</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Arama kriterlerinize uygun ilerleyiş kaydı mevcut değil.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((project) => {
            const isCompleted = project.progress >= 100
            const isOngoing = project.progress > 0 && project.progress < 100

            const statusBadgeColor = isCompleted
              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
              : isOngoing
              ? "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20"
              : "bg-slate-500/10 text-slate-500 border-slate-500/20"

            const progressTrackColor = isCompleted
              ? "bg-emerald-500"
              : isOngoing
              ? "bg-gradient-to-r from-blue-600 to-cyan-500"
              : "bg-slate-300 dark:bg-slate-700"

            return (
              <div
                key={project.id}
                onClick={() => router.push(`/admin/projects/${project.id}/progress`)}
                className="group bg-white dark:bg-[#111827] rounded-3xl p-6 border-2 border-slate-200 dark:border-slate-800/80 hover:border-blue-500 dark:hover:border-blue-500 transition-all duration-200 cursor-pointer shadow-sm hover:shadow-xl hover:-translate-y-1 relative flex flex-col justify-between overflow-hidden"
              >
                {/* Top Colored Accent */}
                <div
                  className={`absolute top-0 left-0 right-0 h-1.5 ${
                    isCompleted ? "bg-emerald-500" : isOngoing ? "bg-blue-600" : "bg-slate-400"
                  }`}
                />

                <div>
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                          #{project.code}
                        </span>
                        <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                          📍 {project.city}
                        </span>
                      </div>
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white mt-1.5 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-1">
                        {project.name}
                      </h3>
                    </div>

                    <span
                      className={`text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider border ${statusBadgeColor}`}
                    >
                      {isCompleted ? "Tamamlandı" : isOngoing ? "Saha İmalatında" : "Başlanmadı"}
                    </span>
                  </div>

                  {/* Progress Gauge */}
                  <div className="my-4 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                        <BarChart3 className="w-3.5 h-3.5 text-blue-500" />
                        <span>Ağırlıklı İlerleme</span>
                      </span>
                      <span className="font-mono text-base text-slate-900 dark:text-white">
                        %{project.progress}
                      </span>
                    </div>

                    <div className="w-full bg-slate-200 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${progressTrackColor}`}
                        style={{ width: `${project.progress}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-1 font-mono">
                      <span>
                        Pozlar: <strong className="text-slate-700 dark:text-slate-300">{project.completedBoqItems}/{project.totalBoqItems}</strong>
                      </span>
                      <span>
                        {project.totalPlannedAmount > 0
                          ? `${formatTRY(project.totalActualAmount)} / ${formatTRY(project.totalPlannedAmount)}`
                          : "Bütçe Belirlenmedi"}
                      </span>
                    </div>
                  </div>

                  {/* Multi-Block Pills */}
                  {project.blocks && project.blocks.length > 0 && (
                    <div className="space-y-1.5 mb-4">
                      <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                        Blok İlerleyişi ({project.blocks.length} Blok)
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {project.blocks.slice(0, 3).map((b) => (
                          <span
                            key={b.id}
                            className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800/80 text-[10px] font-bold border border-slate-200 dark:border-slate-700 flex items-center gap-1.5 text-slate-700 dark:text-slate-300"
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                b.completionRate >= 100
                                  ? "bg-emerald-500"
                                  : b.completionRate > 0
                                  ? "bg-blue-500"
                                  : "bg-slate-400"
                              }`}
                            />
                            <span>{b.code || b.name}: %{b.completionRate}</span>
                          </span>
                        ))}
                        {project.blocks.length > 3 && (
                          <span className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-[10px] font-bold text-slate-400">
                            +{project.blocks.length - 3} blok
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer Action */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between mt-2">
                  <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>{project.endDate || "Takvim Belirtilmedi"}</span>
                  </div>

                  <span className="text-xs font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                    <span>İnteraktif BoQ & Gantt</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

