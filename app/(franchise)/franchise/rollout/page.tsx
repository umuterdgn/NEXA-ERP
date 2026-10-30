"use client"
/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Franchise / Rollout (Çoklu Mağaza Kurulumu) Paneli - Kanban & Harita
 * %100 Tenant İzolasyonu ile RolloutProject Modeline Bağlıdır.
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
  X,
  DollarSign,
  Loader2,
} from "lucide-react"
import {
  getRolloutProjects,
  createRolloutProject,
  updateRolloutProjectStatus,
} from "@/app/actions/franchise"

interface StageGate {
  id: string
  stageName: string
  isApproved: boolean
  isRequired: boolean
  documentUrl?: string | null
}

interface StoreProject {
  id: string
  name: string
  title: string
  city: string | null
  district?: string | null
  location?: string | null
  latitude?: number | null
  longitude?: number | null
  progress: number
  status: string
  budget?: number | null
  rolloutPhase: "KIRALAMA" | "AVM_ONAY" | "INSAAT" | "PUNCH_LIST" | "ACILISA_HAZIR" | string
  stageGates: StageGate[]
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
    key: "AVM_ONAY",
    label: "AVM & Ruhsat Onayı",
    desc: "Mimari proje, teknik şartname & izinler",
    badgeBg: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
    headerBg: "bg-indigo-500/5 border-indigo-500/30",
    dotColor: "bg-indigo-400",
  },
  {
    key: "INSAAT",
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

  // Yeni Mağaza Açılışı Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    city: "İstanbul",
    budget: "",
    status: "KIRALAMA",
  })

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

  // Faz Değişimi (Kanban Sürükle-Bırak veya Butonla İlerletme)
  const handleMovePhase = async (projectId: string, newPhase: string) => {
    try {
      setMovingProjectId(projectId)
      // Optimistic update
      setProjects((prev) =>
        prev.map((p) => (p.id === projectId ? { ...p, rolloutPhase: newPhase } : p))
      )

      await updateRolloutProjectStatus(projectId, newPhase)
      await fetchRollout()
    } catch (err) {
      console.error("Move phase failed", err)
      fetchRollout()
    } finally {
      setMovingProjectId(null)
    }
  }

  // Yeni Mağaza Kaydı Ekleme (Server Action Entegrasyonu)
  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)

    if (!formData.name.trim()) {
      setFormError("Lütfen mağaza adını giriniz.")
      return
    }
    if (!formData.city.trim()) {
      setFormError("Lütfen şehir bilgisini seçiniz.")
      return
    }

    try {
      setIsSubmitting(true)
      const res = await createRolloutProject({
        name: formData.name.trim(),
        city: formData.city.trim(),
        budget: formData.budget ? parseFloat(formData.budget) : null,
        status: formData.status,
      })

      if (!res.success) {
        setFormError(res.error || "Proje oluşturulamadı.")
        return
      }

      setIsCreateModalOpen(false)
      setFormData({ name: "", city: "İstanbul", budget: "", status: "KIRALAMA" })
      await fetchRollout()
    } catch (err: any) {
      setFormError(err.message || "Beklenmedik bir hata oluştu.")
    } finally {
      setIsSubmitting(false)
    }
  }

  // Normalize phase name helper
  const normalizePhaseKey = (phase: string) => {
    if (phase === "AVM_ONAYI") return "AVM_ONAY"
    if (phase === "INSAATTA") return "INSAAT"
    return phase
  }

  // Filtered list
  const filteredProjects = projects.filter((p) => {
    const matchesSearch =
      (p.name || p.title || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.city || "").toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCity = selectedCity === "ALL" || p.city === selectedCity
    return matchesSearch && matchesCity
  })

  // Distinct cities
  const cities = Array.from(new Set(projects.map((p) => p.city).filter(Boolean))) as string[]

  // Metrics
  const totalStores = projects.length
  const inRental = projects.filter((p) => normalizePhaseKey(p.rolloutPhase) === "KIRALAMA").length
  const inAvm = projects.filter((p) => normalizePhaseKey(p.rolloutPhase) === "AVM_ONAY").length
  const inConstruction = projects.filter((p) => normalizePhaseKey(p.rolloutPhase) === "INSAAT").length
  const inPunchList = projects.filter((p) => normalizePhaseKey(p.rolloutPhase) === "PUNCH_LIST").length
  const readyStores = projects.filter((p) => normalizePhaseKey(p.rolloutPhase) === "ACILISA_HAZIR").length

  return (
    <div className="w-full space-y-6 pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-amber-400 mb-1">
            <Store className="w-4 h-4" />
            <span>Zincir Mağaza & Franchise Rollout Operasyonu</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            Rollout Yönetim Paneli
          </h1>
          <p className="text-sm text-slate-400">
            Tüm Türkiye'deki mağaza açılışlarını idari kilitler (Stage-Gate) ve aşama aşama uçtan uca takip edin.
          </p>
        </div>

        {/* View Switcher & Actions */}
        <div className="flex items-center gap-3">
          <div className="flex items-center p-1 bg-slate-900 border border-slate-800 rounded-lg">
            <button
              onClick={() => setActiveView("KANBAN")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                activeView === "KANBAN"
                  ? "bg-amber-600 text-white shadow-sm"
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
                  ? "bg-amber-600 text-white shadow-sm"
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

          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold transition-all shadow-md shadow-amber-600/20"
          >
            <Plus className="w-4 h-4" />
            <span>Yeni Mağaza Açılışı</span>
          </button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5">
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
          <div className="text-xs text-slate-400 flex items-center justify-between">
            <span>Toplam Mağaza</span>
            <Building2 className="w-4 h-4 text-slate-500" />
          </div>
          <div className="text-2xl font-bold text-white mt-2">{totalStores}</div>
          <div className="text-[11px] text-slate-500 mt-1">Rollout Portföyü</div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
          <div className="text-xs text-amber-400 flex items-center justify-between">
            <span>Kiralama & İzin</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-amber-400 mt-2">{inRental + inAvm}</div>
          <div className="text-[11px] text-slate-500 mt-1">Sözleşme & AVM Onayında</div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
          <div className="text-xs text-blue-400 flex items-center justify-between">
            <span>Aktif Şantiye</span>
            <Layers className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-bold text-blue-400 mt-2">{inConstruction}</div>
          <div className="text-[11px] text-slate-500 mt-1">Kaba / İnce Montajda</div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
          <div className="text-xs text-purple-400 flex items-center justify-between">
            <span>Punch List (QA)</span>
            <AlertTriangle className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-bold text-purple-400 mt-2">{inPunchList}</div>
          <div className="text-[11px] text-slate-500 mt-1">Kusur Düzeltme Aşamasında</div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 col-span-2 md:col-span-1">
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
            placeholder="Mağaza adı veya şehir ara..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full sm:w-72 px-3 py-1.5 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500"
          />
          <select
            value={selectedCity}
            onChange={(e) => setSelectedCity(e.target.value)}
            className="px-3 py-1.5 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-amber-500"
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

      {/* Empty State: data.length === 0 */}
      {projects.length === 0 && !loading && (
        <div className="bg-slate-900/60 rounded-2xl border border-dashed border-slate-700/60 p-12 text-center my-6">
          <Store className="w-16 h-16 mx-auto mb-4 text-slate-600" />
          <h3 className="text-lg font-semibold text-white mb-1">Kayıtlı Mağaza Projesi Bulunamadı</h3>
          <p className="text-sm text-slate-400 mb-6">
            Bu kiracı için tanımlanmış herhangi bir franchise veya çoklu mağaza açılış projesi bulunamadı.
          </p>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-amber-600 hover:bg-amber-500 text-white rounded-lg transition-colors text-sm font-semibold shadow-lg shadow-amber-600/20"
          >
            <Plus className="w-4 h-4" />
            <span>Yeni Mağaza Açılışı Başlat</span>
          </button>
        </div>
      )}

      {/* Main Content: KANBAN VIEW */}
      {activeView === "KANBAN" && projects.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 overflow-x-auto pb-4">
          {PHASES.map((phase) => {
            const phaseProjects = filteredProjects.filter(
              (p) => normalizePhaseKey(p.rolloutPhase) === phase.key
            )

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
                            <h3 className="text-xs font-semibold text-white group-hover:text-amber-400 transition-colors line-clamp-1">
                              {project.name || project.title}
                            </h3>
                            {project.budget && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-950/60 border border-amber-800/50 text-amber-300 font-medium whitespace-nowrap">
                                {project.budget.toLocaleString("tr-TR")} ₺
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1 text-[11px] text-slate-400 mt-1">
                            <MapPin className="w-3 h-3 text-slate-500 shrink-0" />
                            <span className="truncate">{project.city || "Türkiye"}</span>
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
                              className="h-full bg-amber-500 rounded-full transition-all duration-300"
                              style={{ width: `${project.progress || 0}%` }}
                            ></div>
                          </div>
                        </div>

                        {/* Stage-Gate Badges */}
                        <div className="grid grid-cols-2 gap-1.5 pt-1 border-t border-slate-900 text-[10px]">
                          <Link
                            href="/franchise/stage-gates"
                            className={`flex items-center gap-1 p-1.5 rounded border transition-colors ${
                              project.approvedGates === project.totalGates && project.totalGates > 0
                                ? "bg-emerald-950/40 border-emerald-800/50 text-emerald-400 hover:bg-emerald-900/40"
                                : "bg-slate-900 border-slate-800 text-slate-300 hover:border-amber-600/50 hover:text-white"
                            }`}
                            title="İdari Kilitleri İncele"
                          >
                            <ShieldCheck className="w-3 h-3 text-amber-400 shrink-0" />
                            <span className="truncate">
                              Gate: {project.approvedGates}/{project.totalGates || 5}
                            </span>
                          </Link>

                          <div
                            className="flex items-center gap-1 p-1.5 rounded border bg-slate-900 border-slate-800 text-slate-400"
                            title="Şehir Bilgisi"
                          >
                            <Store className="w-3 h-3 text-blue-400 shrink-0" />
                            <span className="truncate">{project.city}</span>
                          </div>
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
                              className="text-amber-400 hover:text-amber-300 font-medium flex items-center gap-0.5 transition-colors"
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
      {activeView === "MAP" && projects.length > 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
            <div>
              <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                <MapIcon className="w-4 h-4 text-amber-400" />
                Türkiye Geneli Rollout Mağaza Haritası
              </h2>
              <p className="text-xs text-slate-400">
                Veritabanındaki mağaza kayıtlarının şehir konumları üzerinden dinamik olarak oluşturulmuştur.
              </p>
            </div>
            <div className="text-xs text-slate-400 bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800">
              Kayıtlı Mağaza: <span className="font-bold text-white">{filteredProjects.length}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-2">
            {filteredProjects.map((p) => (
              <div
                key={p.id}
                onClick={() => setSelectedProjectForModal(p)}
                className="bg-slate-950/70 border border-slate-800 hover:border-amber-600/50 p-4 rounded-xl cursor-pointer transition-all space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-white line-clamp-1">{p.name || p.title}</span>
                  <span className="text-xs text-amber-400 font-semibold px-2 py-0.5 rounded bg-amber-950/40 border border-amber-800/50">
                    {p.city}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>Aşama: {PHASES.find((ph) => ph.key === normalizePhaseKey(p.rolloutPhase))?.label || p.rolloutPhase}</span>
                  <span className="text-amber-400 flex items-center gap-0.5">
                    İncele <ChevronRight className="w-3 h-3" />
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL: Yeni Mağaza Açılışı Formu */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Store className="w-5 h-5 text-amber-500" />
                <h3 className="text-base font-bold text-white">Yeni Mağaza Açılışı Projesi</h3>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded-lg bg-red-950/50 border border-red-800 text-xs text-red-300">
                {formError}
              </div>
            )}

            <form onSubmit={handleCreateProject} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Mağaza / Şube Adı <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Örn: Kadıköy Şube Açılışı"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Şehir <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Örn: İstanbul, Ankara, İzmir, Bursa..."
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Tahmini Açılış Bütçesi (₺)
                </label>
                <input
                  type="number"
                  placeholder="Örn: 1500000"
                  value={formData.budget}
                  onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Başlangıç Aşaması
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-white focus:outline-none focus:border-amber-500"
                >
                  <option value="KIRALAMA">Kiralama & Etüt</option>
                  <option value="AVM_ONAY">AVM & Ruhsat Onayı</option>
                  <option value="INSAAT">Kaba & İnce İnşaat</option>
                  <option value="PUNCH_LIST">Punch List & QA</option>
                  <option value="ACILISA_HAZIR">Açılışa Hazır</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 text-xs text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
                >
                  Vazgeç
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold shadow-md shadow-amber-600/20 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Kaydediliyor...</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-3.5 h-3.5" />
                      <span>Projeyi Başlat</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Project Quick Detail Modal */}
      {selectedProjectForModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 space-y-5 shadow-2xl animate-in fade-in duration-200">
            <div className="flex items-start justify-between border-b border-slate-800 pb-4">
              <div>
                <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider">
                  Rollout Mağaza Projesi
                </span>
                <h2 className="text-lg font-bold text-white mt-1">
                  {selectedProjectForModal.name || selectedProjectForModal.title}
                </h2>
                <p className="text-xs text-slate-400 flex items-center gap-1 mt-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-500" />
                  {selectedProjectForModal.city}
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
                  {PHASES.find((p) => p.key === normalizePhaseKey(selectedProjectForModal.rolloutPhase))?.label ||
                    selectedProjectForModal.rolloutPhase}
                </div>
              </div>
              <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg">
                <span className="text-slate-400">Tahmini Bütçe</span>
                <div className="text-sm font-bold text-amber-400 mt-1">
                  {selectedProjectForModal.budget
                    ? `${selectedProjectForModal.budget.toLocaleString("tr-TR")} ₺`
                    : "Belirtilmemiş"}
                </div>
              </div>
              <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg">
                <span className="text-slate-400">İdari Kilitler (Stage-Gate)</span>
                <div className="text-sm font-bold text-emerald-400 mt-1">
                  {selectedProjectForModal.approvedGates} / {selectedProjectForModal.totalGates} Onaylandı
                </div>
              </div>
              <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg">
                <span className="text-slate-400">Şantiye İlerlemesi</span>
                <div className="text-sm font-bold text-blue-400 mt-1">
                  %{selectedProjectForModal.progress}
                </div>
              </div>
            </div>

            <div className="pt-2">
              <Link
                href="/franchise/stage-gates"
                className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold transition-colors"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>İdari Kilitleri (Stage-Gate) Yönet</span>
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
