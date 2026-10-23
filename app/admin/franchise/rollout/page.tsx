"use client"
/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Franchise / Rollout (Çoklu Mağaza Kurulumu) Paneli - Kanban & Harita
 */

import { useState, useEffect } from "react"
import Link from "next/link"
import {
  Store,
  MapPin,
  Kanban,
  Map as MapIcon,
  ShieldCheck,
  ClipboardCheck,
  AlertTriangle,
  ArrowRight,
  Plus,
  RefreshCw,
  Clock,
  CheckCircle2,
  Lock,
  Building2,
  SlidersHorizontal,
  ChevronRight,
  ExternalLink,
  Layers,
  Sparkles,
} from "lucide-react"

interface StageGate {
  id: string
  stageName: string
  isApproved: boolean
  isRequired: boolean
  documentUrl?: string | null
}

interface PunchListDefect {
  id: string
  status: string
  defectDesc: string
}

interface StoreProject {
  id: string
  name: string
  title: string
  city: string | null
  district: string | null
  location: string | null
  latitude: number | null
  longitude: number | null
  progress: number
  status: string
  rolloutPhase: "KIRALAMA" | "AVM_ONAYI" | "INSAATTA" | "PUNCH_LIST" | "ACILISA_HAZIR"
  storeTemplate?: {
    id: string
    name: string
    estimatedDays: number
  } | null
  stageGates: StageGate[]
  punchLists: PunchListDefect[]
  openDefects: number
  totalGates: number
  approvedGates: number
}

const PHASES = [
  {
    key: "KIRALAMA",
    label: "Kiralama & Etüt",
    desc: "Yer seçimi, kira sözleşmesi & fizibilite",
    badgeBg: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    headerBg: "bg-amber-500/5 border-amber-500/30",
    dotColor: "bg-amber-400",
  },
  {
    key: "AVM_ONAYI",
    label: "AVM & Ruhsat Onayı",
    desc: "Mimari proje, teknik şartname & izinler",
    badgeBg: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
    headerBg: "bg-indigo-500/5 border-indigo-500/30",
    dotColor: "bg-indigo-400",
  },
  {
    key: "INSAATTA",
    label: "Kaba & İnce İnşaat",
    desc: "Saha imalatı, elektrik & mekanik montaj",
    badgeBg: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    headerBg: "bg-blue-500/5 border-blue-500/30",
    dotColor: "bg-blue-400",
  },
  {
    key: "PUNCH_LIST",
    label: "Punch List & QA",
    desc: "Bölge müdürü denetimi & kusur giderme",
    badgeBg: "bg-purple-500/10 text-purple-400 border-purple-500/20",
    headerBg: "bg-purple-500/5 border-purple-500/30",
    dotColor: "bg-purple-400",
  },
  {
    key: "ACILISA_HAZIR",
    label: "Açılışa Hazır",
    desc: "Tüm onaylar tamamlandı, faaliyete hazır",
    badgeBg: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    headerBg: "bg-emerald-500/5 border-emerald-500/30",
    dotColor: "bg-emerald-400",
  },
]

export default function FranchiseRolloutPage() {
  const [projects, setProjects] = useState<StoreProject[]>([])
  const [loading, setLoading] = useState(true)
  const [activeView, setActiveView] = useState<"KANBAN" | "MAP">("KANBAN")
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCity, setSelectedCity] = useState<string>("ALL")
  const [selectedProjectForModal, setSelectedProjectForModal] = useState<StoreProject | null>(null)
  const [draggedProjectId, setDraggedProjectId] = useState<string | null>(null)
  const [movingProjectId, setMovingProjectId] = useState<string | null>(null)

  const fetchRollout = async () => {
    try {
      setLoading(true)
      const res = await fetch("/api/franchise/rollout")
      const data = await res.json()
      if (data.projects) {
        setProjects(data.projects)
      }
    } catch (err) {
      console.error("Failed to load rollout data", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRollout()
  }, [])

  // Move project to phase
  const handleMovePhase = async (projectId: string, newPhase: string) => {
    try {
      setMovingProjectId(projectId)
      // Optimistic update
      setProjects((prev) =>
        prev.map((p) => (p.id === projectId ? { ...p, rolloutPhase: newPhase as any } : p))
      )

      await fetch("/api/franchise/rollout", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, rolloutPhase: newPhase }),
      })
    } catch (err) {
      console.error("Move phase failed", err)
      fetchRollout()
    } finally {
      setMovingProjectId(null)
    }
  }

  // Filtered list
  const filteredProjects = projects.filter((p) => {
    const matchesSearch =
      (p.name || p.title || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.city || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.district || "").toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCity = selectedCity === "ALL" || p.city === selectedCity
    return matchesSearch && matchesCity
  })

  // Distinct cities
  const cities = Array.from(new Set(projects.map((p) => p.city).filter(Boolean))) as string[]

  // Metrics
  const totalStores = projects.length
  const inRental = projects.filter((p) => p.rolloutPhase === "KIRALAMA" || p.rolloutPhase === "AVM_ONAYI").length
  const inConstruction = projects.filter((p) => p.rolloutPhase === "INSAATTA").length
  const inPunchList = projects.filter((p) => p.rolloutPhase === "PUNCH_LIST").length
  const readyStores = projects.filter((p) => p.rolloutPhase === "ACILISA_HAZIR").length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-blue-400 mb-1">
            <Store className="w-4 h-4" />
            <span>Zincir Mağaza & Franchise Operasyonu</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            Rollout Yönetim Paneli
          </h1>
          <p className="text-sm text-slate-400">
            Tüm Türkiye'deki mağaza açılışlarını idari kilitler (Stage-Gate) ve Punch List denetimleri ile uçtan uca takip edin.
          </p>
        </div>

        {/* View Switcher & Actions */}
        <div className="flex items-center gap-3">
          <div className="flex items-center p-1 bg-slate-900 border border-slate-800 rounded-lg">
            <button
              onClick={() => setActiveView("KANBAN")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                activeView === "KANBAN"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Kanban className="w-3.5 h-3.5" />
              <span>Kanban Board</span>
            </button>
            <button
              onClick={() => setActiveView("MAP")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                activeView === "MAP"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <MapIcon className="w-3.5 h-3.5" />
              <span>Türkiye Haritası</span>
            </button>
          </div>

          <button
            onClick={fetchRollout}
            disabled={loading}
            className="p-2 rounded-lg bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 transition-colors"
            title="Yenile"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>

          <Link
            href="/admin/projects/new"
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium transition-colors shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Yeni Mağaza Açılışı</span>
          </Link>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="text-xs text-slate-400 flex items-center justify-between">
            <span>Toplam Mağaza</span>
            <Building2 className="w-4 h-4 text-slate-500" />
          </div>
          <div className="text-2xl font-bold text-white mt-2">{totalStores}</div>
          <div className="text-[11px] text-slate-500 mt-1">Rollout Portföyü</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="text-xs text-amber-400 flex items-center justify-between">
            <span>Kiralama & İzin</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-amber-400 mt-2">{inRental}</div>
          <div className="text-[11px] text-slate-500 mt-1">Sözleşme & AVM Onayında</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="text-xs text-blue-400 flex items-center justify-between">
            <span>Aktif Şantiye</span>
            <Layers className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-bold text-blue-400 mt-2">{inConstruction}</div>
          <div className="text-[11px] text-slate-500 mt-1">Kaba / İnce Montajda</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="text-xs text-purple-400 flex items-center justify-between">
            <span>Punch List (QA)</span>
            <AlertTriangle className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-bold text-purple-400 mt-2">{inPunchList}</div>
          <div className="text-[11px] text-slate-500 mt-1">Kusur Düzeltme Aşamasında</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 col-span-2 md:col-span-1">
          <div className="text-xs text-emerald-400 flex items-center justify-between">
            <span>Açılışa Hazır</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-emerald-400 mt-2">{readyStores}</div>
          <div className="text-[11px] text-slate-500 mt-1">Tüm Kilitler Onaylandı</div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-900/60 border border-slate-800/80 rounded-xl p-3">
        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <input
            type="text"
            placeholder="Mağaza adı, ilçe veya şehir ara..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full sm:w-72 px-3 py-1.5 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
          <select
            value={selectedCity}
            onChange={(e) => setSelectedCity(e.target.value)}
            className="px-3 py-1.5 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-blue-500"
          >
            <option value="ALL">Tüm Şehirler ({projects.length})</option>
            {cities.map((city) => (
              <option key={city} value={city}>
                {city} ({projects.filter((p) => p.city === city).length})
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-400 w-full sm:w-auto justify-end">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span> Tamamlandı
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-blue-500 inline-block"></span> İnşaat
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-purple-500 inline-block"></span> Punch List
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-amber-500 inline-block"></span> İdari İzin
          </span>
        </div>
      </div>

      {/* Main Content: KANBAN VIEW */}
      {activeView === "KANBAN" && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 overflow-x-auto pb-4">
          {PHASES.map((phase) => {
            const phaseProjects = filteredProjects.filter((p) => p.rolloutPhase === phase.key)

            return (
              <div
                key={phase.key}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => {
                  if (draggedProjectId) {
                    handleMovePhase(draggedProjectId, phase.key)
                    setDraggedProjectId(null)
                  }
                }}
                className="flex flex-col bg-slate-900/70 border border-slate-800 rounded-xl overflow-hidden min-h-[560px]"
              >
                {/* Column Header */}
                <div className={`p-3.5 border-b ${phase.headerBg}`}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="flex items-center gap-2 text-xs font-semibold text-white">
                      <span className={`w-2 h-2 rounded-full ${phase.dotColor}`}></span>
                      {phase.label}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-slate-800 text-slate-300">
                      {phaseProjects.length}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 line-clamp-1">{phase.desc}</p>
                </div>

                {/* Column Items */}
                <div className="p-2.5 space-y-2.5 flex-1 overflow-y-auto">
                  {phaseProjects.length === 0 ? (
                    <div className="h-32 flex flex-col items-center justify-center border-2 border-dashed border-slate-800/80 rounded-lg text-slate-600 text-xs p-4 text-center">
                      <span>Bu aşamada mağaza yok</span>
                      <span className="text-[10px] text-slate-700 mt-1">Kartları buraya sürükleyebilirsiniz</span>
                    </div>
                  ) : (
                    phaseProjects.map((project) => (
                      <div
                        key={project.id}
                        draggable
                        onDragStart={() => setDraggedProjectId(project.id)}
                        className={`group bg-slate-950/90 border border-slate-800 hover:border-slate-700 rounded-lg p-3.5 space-y-3 cursor-grab active:cursor-grabbing transition-all hover:shadow-lg ${
                          movingProjectId === project.id ? "opacity-50" : ""
                        }`}
                      >
                        {/* Store Title & Location */}
                        <div>
                          <div className="flex items-start justify-between gap-1">
                            <h3 className="text-xs font-semibold text-white group-hover:text-blue-400 transition-colors line-clamp-1">
                              {project.name || project.title}
                            </h3>
                            {project.storeTemplate && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-950/60 border border-blue-800/50 text-blue-300 font-medium whitespace-nowrap">
                                {project.storeTemplate.name.split("-")[0]}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1 text-[11px] text-slate-400 mt-1">
                            <MapPin className="w-3 h-3 text-slate-500 shrink-0" />
                            <span className="truncate">
                              {project.city || "Türkiye"} {project.district ? `• ${project.district}` : ""}
                            </span>
                          </div>
                        </div>

                        {/* Progress Bar */}
                        <div>
                          <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                            <span>Kurulum İlerlemesi</span>
                            <span className="font-semibold text-slate-200">%{project.progress || 0}</span>
                          </div>
                          <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-blue-500 rounded-full transition-all duration-300"
                              style={{ width: `${project.progress || 0}%` }}
                            ></div>
                          </div>
                        </div>

                        {/* Stage-Gate & Punch List Badges */}
                        <div className="grid grid-cols-2 gap-1.5 pt-1 border-t border-slate-900 text-[10px]">
                          <Link
                            href={`/admin/franchise/stage-gates/${project.id}`}
                            className={`flex items-center gap-1 p-1.5 rounded border transition-colors ${
                              project.approvedGates === project.totalGates && project.totalGates > 0
                                ? "bg-emerald-950/40 border-emerald-800/50 text-emerald-400 hover:bg-emerald-900/40"
                                : "bg-slate-900 border-slate-800 text-slate-300 hover:border-blue-600/50 hover:text-white"
                            }`}
                            title="İdari Kilitleri İncele"
                          >
                            <ShieldCheck className="w-3 h-3 text-blue-400 shrink-0" />
                            <span className="truncate">
                              Gate: {project.approvedGates}/{project.totalGates || 5}
                            </span>
                          </Link>

                          <Link
                            href="/admin/franchise/punch-list"
                            className={`flex items-center gap-1 p-1.5 rounded border transition-colors ${
                              project.openDefects > 0
                                ? "bg-amber-950/40 border-amber-800/50 text-amber-400 hover:bg-amber-900/40"
                                : "bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200"
                            }`}
                            title="Punch List Kusur Denetimi"
                          >
                            <ClipboardCheck className="w-3 h-3 text-purple-400 shrink-0" />
                            <span className="truncate">
                              {project.openDefects > 0 ? `${project.openDefects} Kusur` : "QA Temiz"}
                            </span>
                          </Link>
                        </div>

                        {/* Card Actions */}
                        <div className="flex items-center justify-between pt-1 text-[11px]">
                          <button
                            onClick={() => setSelectedProjectForModal(project)}
                            className="text-slate-400 hover:text-white flex items-center gap-1 transition-colors"
                          >
                            <span>Detay</span>
                            <ExternalLink className="w-3 h-3" />
                          </button>

                          {/* Quick Advance Button */}
                          {phase.key !== "ACILISA_HAZIR" && (
                            <button
                              onClick={() => {
                                const currentIndex = PHASES.findIndex((p) => p.key === phase.key)
                                if (currentIndex < PHASES.length - 1) {
                                  handleMovePhase(project.id, PHASES[currentIndex + 1].key)
                                }
                              }}
                              className="text-blue-400 hover:text-blue-300 font-medium flex items-center gap-0.5 transition-colors"
                              title="Sonraki Aşamaya Taşı"
                            >
                              <span>İlerlet</span>
                              <ArrowRight className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Main Content: MAP VIEW */}
      {activeView === "MAP" && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
            <div>
              <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                <MapIcon className="w-4 h-4 text-blue-400" />
                Türkiye Geneli Mağaza Lokasyon Haritası
              </h2>
              <p className="text-xs text-slate-400">
                Harita üzerindeki mağaza pinlerine tıklayarak idari onay ve şantiye faz durumunu görüntüleyin.
              </p>
            </div>
            <div className="text-xs text-slate-400 bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800">
              Gösterilen Mağaza: <span className="font-bold text-white">{filteredProjects.length}</span>
            </div>
          </div>

          {/* Interactive Simulated Map Canvas */}
          <div className="relative w-full h-[520px] bg-slate-950 rounded-xl border border-slate-800 overflow-hidden flex items-center justify-center p-4">
            {/* Background Grid & Compass */}
            <div
              className="absolute inset-0 opacity-10 pointer-events-none"
              style={{
                backgroundImage:
                  "radial-gradient(#3b82f6 1px, transparent 1px), radial-gradient(#1e293b 1px, transparent 1px)",
                backgroundSize: "24px 24px",
              }}
            ></div>

            {/* Simulated Turkey Outline / Region Radar */}
            <svg
              viewBox="0 0 1000 500"
              className="w-full h-full max-h-[480px] text-slate-800/40 select-none"
              fill="currentColor"
            >
              {/* Stylized Turkey Shape */}
              <path
                d="M 120 180 Q 200 130 350 140 Q 550 130 750 150 Q 880 170 920 220 Q 940 300 860 340 Q 720 370 560 380 Q 420 370 280 390 Q 180 370 140 310 Q 100 240 120 180 Z"
                fill="#0f172a"
                stroke="#1e293b"
                strokeWidth="2"
              />
              {/* Marmara / Aegean accent */}
              <circle cx="220" cy="200" r="14" fill="#1e293b" opacity="0.6" />
              <circle cx="200" cy="280" r="14" fill="#1e293b" opacity="0.6" />
              {/* Central Anatolia accent */}
              <circle cx="450" cy="260" r="18" fill="#1e293b" opacity="0.4" />
              {/* Mediterranean accent */}
              <circle cx="430" cy="380" r="16" fill="#1e293b" opacity="0.5" />
            </svg>

            {/* Interactive Pins Projected onto Coordinate Space */}
            {filteredProjects.map((p) => {
              // Convert lat/long to svg/box percentage (Turkey: lat 36-42, lng 26-45)
              const minLat = 35.5
              const maxLat = 42.5
              const minLng = 25.5
              const maxLng = 45.0

              const lat = p.latitude || 39.0
              const lng = p.longitude || 35.0

              const leftPercent = Math.max(5, Math.min(92, ((lng - minLng) / (maxLng - minLng)) * 100))
              const topPercent = Math.max(8, Math.min(90, (1 - (lat - minLat) / (maxLat - minLat)) * 100))

              let pinColor = "bg-blue-500 ring-blue-500/40 text-blue-300"
              if (p.rolloutPhase === "ACILISA_HAZIR") {
                pinColor = "bg-emerald-500 ring-emerald-500/40 text-emerald-300"
              } else if (p.rolloutPhase === "PUNCH_LIST") {
                pinColor = "bg-purple-500 ring-purple-500/40 text-purple-300"
              } else if (p.rolloutPhase === "KIRALAMA" || p.rolloutPhase === "AVM_ONAYI") {
                pinColor = "bg-amber-500 ring-amber-500/40 text-amber-300"
              }

              return (
                <div
                  key={p.id}
                  style={{ left: `${leftPercent}%`, top: `${topPercent}%` }}
                  className="absolute transform -translate-x-1/2 -translate-y-1/2 z-20 group"
                >
                  <button
                    onClick={() => setSelectedProjectForModal(p)}
                    className={`relative p-2 rounded-full text-white shadow-xl ring-4 transition-all duration-300 hover:scale-125 focus:scale-125 ${pinColor}`}
                  >
                    <Store className="w-4 h-4" />
                    <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-white ring-2 ring-slate-900"></span>
                  </button>

                  {/* Tooltip on Hover */}
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:flex flex-col items-center pointer-events-none z-30 min-w-[180px]">
                    <div className="bg-slate-900 border border-slate-700 text-white rounded-lg p-2 text-xs shadow-2xl space-y-1">
                      <div className="font-semibold text-blue-400 line-clamp-1">{p.name || p.title}</div>
                      <div className="text-[11px] text-slate-300 flex items-center justify-between">
                        <span>{p.city}</span>
                        <span className="font-bold">%{p.progress}</span>
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {p.rolloutPhase === "ACILISA_HAZIR"
                          ? "Açılışa Hazır"
                          : p.rolloutPhase === "PUNCH_LIST"
                          ? "Punch List Denetiminde"
                          : p.rolloutPhase === "INSAATTA"
                          ? "Şantiyede"
                          : "İdari İzin Sürecinde"}
                      </div>
                    </div>
                    <div className="w-2 h-2 bg-slate-900 border-r border-b border-slate-700 transform rotate-45 -mt-1"></div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Map Stores Bottom Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
            {filteredProjects.slice(0, 4).map((p) => (
              <div
                key={p.id}
                onClick={() => setSelectedProjectForModal(p)}
                className="bg-slate-950/70 border border-slate-800/80 hover:border-slate-700 p-3 rounded-lg cursor-pointer transition-all space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-white line-clamp-1">{p.name || p.title}</span>
                  <span className="text-[10px] text-slate-400 font-medium">{p.city}</span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span>İlerleme: %{p.progress}</span>
                  <span className="text-blue-400 flex items-center gap-0.5">
                    İncele <ChevronRight className="w-3 h-3" />
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Project Quick Detail Modal */}
      {selectedProjectForModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 space-y-5 shadow-2xl animate-in fade-in duration-200">
            <div className="flex items-start justify-between border-b border-slate-800 pb-4">
              <div>
                <span className="text-[11px] font-bold text-blue-400 uppercase tracking-wider">
                  {selectedProjectForModal.storeTemplate?.name || "Standart Kurumsal Konsept"}
                </span>
                <h2 className="text-lg font-bold text-white mt-1">
                  {selectedProjectForModal.name || selectedProjectForModal.title}
                </h2>
                <p className="text-xs text-slate-400 flex items-center gap-1 mt-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-500" />
                  {selectedProjectForModal.location || `${selectedProjectForModal.city} / ${selectedProjectForModal.district}`}
                </p>
              </div>
              <button
                onClick={() => setSelectedProjectForModal(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg bg-slate-800/50"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg">
                <span className="text-slate-400">Mevcut Aşama</span>
                <div className="text-sm font-bold text-white mt-1">
                  {PHASES.find((p) => p.key === selectedProjectForModal.rolloutPhase)?.label}
                </div>
              </div>
              <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg">
                <span className="text-slate-400">Şantiye İlerlemesi</span>
                <div className="text-sm font-bold text-blue-400 mt-1">%{selectedProjectForModal.progress}</div>
              </div>
              <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg">
                <span className="text-slate-400">İdari Kilitler (Stage-Gate)</span>
                <div className="text-sm font-bold text-emerald-400 mt-1">
                  {selectedProjectForModal.approvedGates} / {selectedProjectForModal.totalGates} Onaylandı
                </div>
              </div>
              <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg">
                <span className="text-slate-400">Punch List Kusur Durumu</span>
                <div className="text-sm font-bold text-purple-400 mt-1">
                  {selectedProjectForModal.openDefects} Açık Kusur
                </div>
              </div>
            </div>

            {/* Modal Links */}
            <div className="flex items-center gap-3 pt-2">
              <Link
                href={`/admin/franchise/stage-gates/${selectedProjectForModal.id}`}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-colors"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>İdari Kilitleri (Stage-Gate) Yönet</span>
              </Link>
              <Link
                href="/admin/franchise/punch-list"
                className="flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors"
              >
                <ClipboardCheck className="w-4 h-4" />
                <span>Punch List QA İncele</span>
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
