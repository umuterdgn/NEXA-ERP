"use client"
/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Universal BIM & 3D Project Hub Client
 */

import React, { useState, useMemo } from "react"
import Link from "next/link"
import {
  Box,
  Layers,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  ExternalLink,
  Sparkles,
  Eye,
  Building2,
  MapPin,
  ChevronRight,
  FileText,
  FileCode,
  ShieldCheck,
  Smartphone,
} from "lucide-react"

export interface BimProjectSummary {
  id: string
  name: string
  title: string
  city?: string | null
  district?: string | null
  location?: string | null
  status?: string | null
  category?: string | null
  threeDCount: number
  blueprintCount: number
  aiAnalysesCount: number
  hasActive3D: boolean
  activeModelName?: string
  lastUpdated?: string | Date
}

interface BimHubClientProps {
  projects: BimProjectSummary[]
  total3DModels: number
  totalBlueprints: number
  totalAiAnalyses: number
}

export default function BimHubClient({
  projects,
  total3DModels,
  totalBlueprints,
  totalAiAnalyses,
}: BimHubClientProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [filterMode, setFilterMode] = useState<"ALL" | "WITH_3D" | "NEEDS_MODEL">("ALL")
  const [selectedCity, setSelectedCity] = useState<string>("ALL")

  const cities = useMemo(() => {
    const set = new Set<string>()
    projects.forEach((p) => {
      if (p.city && p.city.trim()) set.add(p.city.trim())
    })
    return Array.from(set).sort()
  }, [projects])

  const filteredProjects = useMemo(() => {
    return projects.filter((p) => {
      const matchSearch =
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.city && p.city.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (p.location && p.location.toLowerCase().includes(searchTerm.toLowerCase()))

      if (!matchSearch) return false

      if (filterMode === "WITH_3D" && !p.hasActive3D) return false
      if (filterMode === "NEEDS_MODEL" && p.hasActive3D) return false

      if (selectedCity !== "ALL" && p.city !== selectedCity) return false

      return true
    })
  }, [projects, searchTerm, filterMode, selectedCity])

  const readyCount = projects.filter((p) => p.hasActive3D).length

  return (
    <div className="w-full space-y-6 animate-in fade-in duration-300">
      {/* Top Banner & Title */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-cyan-950/40 p-6 sm:p-8 rounded-2xl border border-slate-800 shadow-2xl relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-96 bg-gradient-to-l from-cyan-500/10 to-transparent pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 text-xs font-bold uppercase tracking-wider mb-2">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
              Evrensel BIM &amp; Dijital İkiz Portalı
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              BIM &amp; 3D Proje Merkezi
            </h1>
            <p className="text-slate-400 text-sm mt-1 max-w-2xl leading-relaxed">
              Tüm şantiye ve projelerinizin 3D IFC/GLB yapı modellerini, DWG/DXF teknik çizimlerini ve AI destekli 2D→3D metrik ekstrüzyonlarını tek bir merkezden yönetin.
            </p>
          </div>

          <Link
            href="/admin/projects"
            className="px-4 py-2.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 transition-all flex items-center gap-2 w-fit shrink-0 active:scale-95"
          >
            <Building2 className="w-4 h-4 text-cyan-400" />
            <span>Tüm Projeler Listesi</span>
          </Link>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-4 shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Toplam Proje
            </span>
            <Building2 className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-white">{projects.length}</div>
          <p className="text-[11px] text-slate-500 mt-1">Sistemde kayıtlı şantiye</p>
        </div>

        <div className="bg-slate-900/90 rounded-2xl border border-cyan-500/30 p-4 shadow-lg shadow-cyan-500/5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider">
              3D Dijital İkiz
            </span>
            <Box className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-cyan-300">{readyCount}</div>
          <p className="text-[11px] text-cyan-400/70 mt-1">{total3DModels} adet aktif model</p>
        </div>

        <div className="bg-slate-900/90 rounded-2xl border border-amber-500/30 p-4 shadow-lg shadow-amber-500/5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
              2D Pafta &amp; CAD
            </span>
            <FileCode className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-amber-300">
            {totalBlueprints}
          </div>
          <p className="text-[11px] text-amber-400/70 mt-1">DWG, DXF ve PDF çizim</p>
        </div>

        <div className="bg-slate-900/90 rounded-2xl border border-emerald-500/30 p-4 shadow-lg shadow-emerald-500/5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
              AI Çözümlenen
            </span>
            <Sparkles className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-emerald-300">
            {totalAiAnalyses}
          </div>
          <p className="text-[11px] text-emerald-400/70 mt-1">2D→3D metraj çıkarıldı</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/90 p-4 rounded-xl border border-slate-800 backdrop-blur-sm">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Proje adı, konumu veya şehir ara..."
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-cyan-500 transition-colors"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Status Filter */}
          <div className="flex items-center bg-slate-950 rounded-xl p-1 border border-slate-800 text-xs">
            <button
              type="button"
              onClick={() => setFilterMode("ALL")}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                filterMode === "ALL"
                  ? "bg-slate-800 text-white shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Tümü ({projects.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterMode("WITH_3D")}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                filterMode === "WITH_3D"
                  ? "bg-cyan-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              3D Modelli ({readyCount})
            </button>
            <button
              type="button"
              onClick={() => setFilterMode("NEEDS_MODEL")}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                filterMode === "NEEDS_MODEL"
                  ? "bg-amber-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Model Bekleyen ({projects.length - readyCount})
            </button>
          </div>

          {/* City Filter */}
          {cities.length > 0 && (
            <select
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 text-xs font-semibold focus:outline-none focus:border-cyan-500 cursor-pointer"
            >
              <option value="ALL">Tüm Şehirler</option>
              {cities.map((city) => (
                <option key={city} value={city}>
                  {city}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Projects Grid */}
      {filteredProjects.length === 0 ? (
        <div className="text-center py-16 px-4 bg-slate-900/60 rounded-2xl border border-dashed border-slate-800">
          <Box className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h4 className="text-white font-bold text-base mb-1">Eşleşen Proje Bulunamadı</h4>
          <p className="text-slate-400 text-xs max-w-sm mx-auto">
            Arama kriterlerinizi değiştirmeyi veya filtreleri sıfırlamayı deneyin.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredProjects.map((project) => {
            const bimStudioUrl = `/admin/projects/${project.id}?tab=bim`
            const arUrl = `/tr/ar/${project.id}`

            return (
              <div
                key={project.id}
                className="group relative rounded-2xl bg-slate-900/90 border border-slate-800/90 hover:border-cyan-500/50 p-5 shadow-xl transition-all duration-300 flex flex-col justify-between hover:shadow-[0_0_30px_rgba(6,182,212,0.15)] backdrop-blur-sm"
              >
                <div>
                  {/* Card Header: Project Name & Status Badge */}
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
                        <MapPin className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                        <span className="truncate">
                          {project.city || project.district || project.location || "Türkiye"}
                        </span>
                        {project.category && (
                          <>
                            <span className="text-slate-600">•</span>
                            <span className="truncate">{project.category}</span>
                          </>
                        )}
                      </div>

                      <h3
                        className="text-base font-bold text-white group-hover:text-cyan-300 transition-colors truncate"
                        title={project.name || project.title}
                      >
                        {project.name || project.title}
                      </h3>
                    </div>

                    {project.hasActive3D ? (
                      <span className="shrink-0 px-2.5 py-1 rounded-full text-[10px] font-bold bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                        3D BIM Aktif
                      </span>
                    ) : project.blueprintCount > 0 ? (
                      <span className="shrink-0 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                        2D Paftalar Var
                      </span>
                    ) : (
                      <span className="shrink-0 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-slate-800 text-slate-400 border border-slate-700">
                        Model Bekleniyor
                      </span>
                    )}
                  </div>

                  {/* Badges / Metrics Row */}
                  <div className="grid grid-cols-3 gap-2 p-2.5 rounded-xl bg-slate-950/70 border border-slate-800/80 mb-4">
                    <div className="text-center">
                      <span className="block text-xs font-bold text-cyan-300">
                        {project.threeDCount}
                      </span>
                      <span className="text-[10px] text-slate-400">3D Model</span>
                    </div>
                    <div className="text-center border-x border-slate-800">
                      <span className="block text-xs font-bold text-amber-300">
                        {project.blueprintCount}
                      </span>
                      <span className="text-[10px] text-slate-400">2D Pafta</span>
                    </div>
                    <div className="text-center">
                      <span className="block text-xs font-bold text-emerald-300">
                        {project.aiAnalysesCount}
                      </span>
                      <span className="text-[10px] text-slate-400">AI Analiz</span>
                    </div>
                  </div>

                  {project.activeModelName && (
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mb-4 truncate px-1">
                      <Box className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                      <span className="text-slate-500">Model:</span>
                      <span className="text-slate-300 font-medium truncate">
                        {project.activeModelName}
                      </span>
                    </div>
                  )}
                </div>

                {/* Card Actions */}
                <div className="flex items-center gap-2 pt-3 border-t border-slate-800">
                  <Link
                    href={bimStudioUrl}
                    className="flex-1 py-2 px-3 rounded-xl text-xs font-bold bg-gradient-to-r from-blue-600 via-cyan-600 to-teal-600 hover:from-blue-500 hover:to-teal-500 text-white shadow-md shadow-cyan-600/20 transition-all flex items-center justify-center gap-1.5 active:scale-95"
                  >
                    <Box className="w-3.5 h-3.5" />
                    <span>3D BIM Stüdyosunu Aç</span>
                  </Link>

                  <a
                    href={arUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-cyan-400 hover:text-cyan-300 border border-slate-700 transition-colors"
                    title="Sahada AR Canlandır"
                  >
                    <Smartphone className="w-4 h-4" />
                  </a>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

