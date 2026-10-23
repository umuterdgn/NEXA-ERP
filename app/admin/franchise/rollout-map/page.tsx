"use client"
/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Franchise İnteraktif Rollout Haritası (Dinamik StageGate Pin Renkleri)
 */

import { useState, useEffect } from "react"
import Link from "next/link"
import {
  Map as MapIcon,
  MapPin,
  Store,
  Layers,
  Building2,
  RefreshCw,
  Search,
  Filter,
  ShieldCheck,
  FolderArchive,
  ArrowRight,
  ExternalLink,
  ChevronRight,
  SlidersHorizontal,
  Compass,
  CheckCircle2,
} from "lucide-react"

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
  grossAreaSqm: number | null
  totalCapex: number | null
  rolloutPhase: string
  storeTemplate?: {
    name: string
  } | null
  stageGates: Array<{
    id: string
    stageName: string
    isApproved: boolean
  }>
}

type PinCategory = "IDARI" | "INSAAT" | "IT_MONTAJ" | "ACIK"

export default function FranchiseRolloutMapPage() {
  const [projects, setProjects] = useState<StoreProject[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState<"ALL" | PinCategory>("ALL")
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedProject, setSelectedProject] = useState<StoreProject | null>(null)
  const [zoomLevel, setZoomLevel] = useState(1)

  const fetchProjects = async () => {
    try {
      setLoading(true)
      const res = await fetch("/api/franchise/rollout")
      const data = await res.json()
      if (data.projects) {
        setProjects(data.projects)
        if (data.projects.length > 0 && !selectedProject) {
          setSelectedProject(data.projects[0])
        }
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProjects()
  }, [])

  // Pin Statüsü Belirleme Kuralı (Kırmızı: İdari, Sarı: İnşaat, Mavi: IT/Montaj, Yeşil: Açık)
  const getPinCategory = (p: StoreProject): PinCategory => {
    const totalGates = p.stageGates?.length || 5
    const approvedGates = p.stageGates?.filter((g) => g.isApproved)?.length || 0

    if (p.status === "TAMAMLANDI" || approvedGates === totalGates) {
      return "ACIK" // Yeşil
    }

    // IT_MONTAJ: Eğer inşaat temizliği onaylıysa veya montaj aşamasındaysa
    const cleanGate = p.stageGates?.find((g) => g.stageName === "INSAAT_TEMIZLIGI")
    if (cleanGate?.isApproved || approvedGates >= 3) {
      return "IT_MONTAJ" // Mavi
    }

    // INSAAT: Kaba veya ince inşaat aşamasında
    if (approvedGates >= 2 || p.status === "SAHA") {
      return "INSAAT" // Sarı
    }

    // IDARI: Kiralama veya AVM onayı aşamasında
    return "IDARI" // Kırmızı
  }

  const getPinColorStyles = (cat: PinCategory) => {
    switch (cat) {
      case "IDARI":
        return {
          bg: "bg-red-500",
          ring: "ring-red-500/40",
          badge: "bg-red-950/80 text-red-300 border-red-800",
          label: "İdari Aşama (Kiralama / AVM)",
          dot: "bg-red-500",
        }
      case "INSAAT":
        return {
          bg: "bg-amber-400",
          ring: "ring-amber-400/40",
          badge: "bg-amber-950/80 text-amber-300 border-amber-800",
          label: "İnşaat Fazı (Kaba / İnce)",
          dot: "bg-amber-400",
        }
      case "IT_MONTAJ":
        return {
          bg: "bg-blue-500",
          ring: "ring-blue-500/40",
          badge: "bg-blue-950/80 text-blue-300 border-blue-800",
          label: "IT / Montaj (Tozsuz Ortam)",
          dot: "bg-blue-500",
        }
      case "ACIK":
        return {
          bg: "bg-emerald-500",
          ring: "ring-emerald-500/40",
          badge: "bg-emerald-950/80 text-emerald-300 border-emerald-800",
          label: "Açık / Faaliyette",
          dot: "bg-emerald-500",
        }
    }
  }

  // Filtered
  const filteredProjects = projects.filter((p) => {
    const cat = getPinCategory(p)
    const matchesCategory = selectedCategory === "ALL" || cat === selectedCategory
    const q = searchQuery.toLowerCase()
    const matchesSearch =
      (p.name || p.title).toLowerCase().includes(q) ||
      (p.city || "").toLowerCase().includes(q) ||
      (p.district || "").toLowerCase().includes(q)
    return matchesCategory && matchesSearch
  })

  // Category counts
  const idariCount = projects.filter((p) => getPinCategory(p) === "IDARI").length
  const insaatCount = projects.filter((p) => getPinCategory(p) === "INSAAT").length
  const itMontajCount = projects.filter((p) => getPinCategory(p) === "IT_MONTAJ").length
  const acikCount = projects.filter((p) => getPinCategory(p) === "ACIK").length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-blue-400 mb-1">
            <Compass className="w-4 h-4" />
            <span>Coğrafi Bilgi Sistemi (GIS)</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            İnteraktif Rollout Haritası
          </h1>
          <p className="text-sm text-slate-400">
            Türkiye genelindeki tüm mağaza kurulumlarını aktif StageGate statüsüne göre dinamik renkli pinlerle canlı izleyin.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            href="/admin/franchise/dashboard"
            className="px-3.5 py-2 rounded-lg bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 text-xs font-medium transition-colors"
          >
            Dashboard'a Dön
          </Link>
          <button
            onClick={fetchProjects}
            disabled={loading}
            className="p-2 rounded-lg bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
            title="Yenile"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Dynamic Pin Legend Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <button
          onClick={() => setSelectedCategory(selectedCategory === "IDARI" ? "ALL" : "IDARI")}
          className={`p-3 rounded-xl border text-left transition-all ${
            selectedCategory === "IDARI"
              ? "bg-red-950/40 border-red-700 shadow-md ring-1 ring-red-600"
              : "bg-slate-900 border-slate-800 hover:border-slate-700"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-red-400 flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span>
              Kırmızı: İdari Onay
            </span>
            <span className="text-xs font-bold text-white font-mono">{idariCount}</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Kiralama & AVM İzinleri</p>
        </button>

        <button
          onClick={() => setSelectedCategory(selectedCategory === "INSAAT" ? "ALL" : "INSAAT")}
          className={`p-3 rounded-xl border text-left transition-all ${
            selectedCategory === "INSAAT"
              ? "bg-amber-950/40 border-amber-700 shadow-md ring-1 ring-amber-600"
              : "bg-slate-900 border-slate-800 hover:border-slate-700"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-400 flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
              Sarı: İnşaat Fazı
            </span>
            <span className="text-xs font-bold text-white font-mono">{insaatCount}</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Kaba / İnce Yapı İmalatı</p>
        </button>

        <button
          onClick={() => setSelectedCategory(selectedCategory === "IT_MONTAJ" ? "ALL" : "IT_MONTAJ")}
          className={`p-3 rounded-xl border text-left transition-all ${
            selectedCategory === "IT_MONTAJ"
              ? "bg-blue-950/40 border-blue-700 shadow-md ring-1 ring-blue-600"
              : "bg-slate-900 border-slate-800 hover:border-slate-700"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-blue-400 flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
              Mavi: IT / Montaj
            </span>
            <span className="text-xs font-bold text-white font-mono">{itMontajCount}</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Tozsuz Ortam & Donanım</p>
        </button>

        <button
          onClick={() => setSelectedCategory(selectedCategory === "ACIK" ? "ALL" : "ACIK")}
          className={`p-3 rounded-xl border text-left transition-all ${
            selectedCategory === "ACIK"
              ? "bg-emerald-950/40 border-emerald-700 shadow-md ring-1 ring-emerald-600"
              : "bg-slate-900 border-slate-800 hover:border-slate-700"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
              Yeşil: Açık / Faal
            </span>
            <span className="text-xs font-bold text-white font-mono">{acikCount}</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Devir-Teslimi Tamamlanan</p>
        </button>
      </div>

      {/* Main Map & Detail Panel Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Interactive Map Area (2 Columns) */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Haritada mağaza veya şehir ara..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span>Harita Pinleri: <strong className="text-white">{filteredProjects.length}</strong></span>
              <button
                onClick={() => setZoomLevel((z) => (z >= 1.4 ? 1 : z + 0.2))}
                className="px-2 py-1 bg-slate-950 border border-slate-800 rounded hover:bg-slate-800 text-[11px]"
              >
                Büyüt ({Math.round(zoomLevel * 100)}%)
              </button>
            </div>
          </div>

          {/* Map Surface */}
          <div className="relative w-full h-[520px] bg-slate-950 rounded-xl border border-slate-800 overflow-hidden flex items-center justify-center p-4">
            {/* Grid Pattern */}
            <div
              className="absolute inset-0 opacity-15 pointer-events-none"
              style={{
                backgroundImage:
                  "radial-gradient(#3b82f6 1px, transparent 1px), radial-gradient(#1e293b 1px, transparent 1px)",
                backgroundSize: "28px 28px",
              }}
            ></div>

            {/* Stylized Vector Map of Turkey */}
            <svg
              viewBox="0 0 1000 500"
              className="w-full h-full max-h-[480px] text-slate-800/40 select-none transition-transform duration-300"
              style={{ transform: `scale(${zoomLevel})` }}
              fill="currentColor"
            >
              <path
                d="M 120 180 Q 200 130 350 140 Q 550 130 750 150 Q 880 170 920 220 Q 940 300 860 340 Q 720 370 560 380 Q 420 370 280 390 Q 180 370 140 310 Q 100 240 120 180 Z"
                fill="#0f172a"
                stroke="#1e293b"
                strokeWidth="2"
              />
              <circle cx="220" cy="200" r="14" fill="#1e293b" opacity="0.6" />
              <circle cx="200" cy="280" r="14" fill="#1e293b" opacity="0.6" />
              <circle cx="450" cy="260" r="18" fill="#1e293b" opacity="0.4" />
              <circle cx="430" cy="380" r="16" fill="#1e293b" opacity="0.5" />
            </svg>

            {/* Dynamic StageGate Pins */}
            {filteredProjects.map((p) => {
              const cat = getPinCategory(p)
              const styles = getPinColorStyles(cat)
              const isSelected = selectedProject?.id === p.id

              const minLat = 35.5
              const maxLat = 42.5
              const minLng = 25.5
              const maxLng = 45.0

              const lat = p.latitude || 39.0
              const lng = p.longitude || 35.0

              const leftPercent = Math.max(6, Math.min(92, ((lng - minLng) / (maxLng - minLng)) * 100))
              const topPercent = Math.max(10, Math.min(88, (1 - (lat - minLat) / (maxLat - minLat)) * 100))

              return (
                <div
                  key={p.id}
                  style={{ left: `${leftPercent}%`, top: `${topPercent}%` }}
                  className="absolute transform -translate-x-1/2 -translate-y-1/2 z-20 group"
                >
                  <button
                    onClick={() => setSelectedProject(p)}
                    className={`relative p-2.5 rounded-full text-white shadow-2xl ring-4 transition-all duration-300 hover:scale-130 ${
                      styles.bg
                    } ${styles.ring} ${isSelected ? "scale-135 ring-white" : ""}`}
                    title={`${p.name || p.title} (${styles.label})`}
                  >
                    <Store className="w-4 h-4 text-white" />
                    <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-white ring-2 ring-slate-900"></span>
                  </button>

                  {/* Hover Mini Card */}
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:flex flex-col items-center pointer-events-none z-30 min-w-[190px]">
                    <div className="bg-slate-900 border border-slate-700 text-white rounded-lg p-2.5 text-xs shadow-2xl space-y-1">
                      <div className="font-bold text-blue-400 line-clamp-1">{p.name || p.title}</div>
                      <div className="text-[11px] text-slate-300 flex items-center justify-between">
                        <span>{p.city}</span>
                        <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${styles.badge}`}>
                          {styles.label.split(" ")[0]}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-400 pt-0.5">
                        {p.grossAreaSqm ? `${p.grossAreaSqm} m²` : ""} • İlerleme %{p.progress}
                      </div>
                    </div>
                    <div className="w-2 h-2 bg-slate-900 border-r border-b border-slate-700 transform rotate-45 -mt-1"></div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Selected Store Inspector & Quick Action Hub (1 Column) */}
        <div className="space-y-4">
          {selectedProject ? (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-5">
              {/* Store Title & Status */}
              <div>
                <div className="flex items-center gap-2">
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${
                      getPinColorStyles(getPinCategory(selectedProject)).badge
                    }`}
                  >
                    {getPinColorStyles(getPinCategory(selectedProject)).label}
                  </span>
                  <span className="text-xs text-slate-400">
                    {selectedProject.storeTemplate?.name || "Tip Konsept"}
                  </span>
                </div>

                <h2 className="text-lg font-bold text-white mt-1.5">
                  {selectedProject.name || selectedProject.title}
                </h2>

                <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-500" />
                  <span>
                    {selectedProject.location || `${selectedProject.city} / ${selectedProject.district}`}
                  </span>
                </div>
              </div>

              {/* CAPEX & Area Statistics Box */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl">
                  <span className="text-slate-400">Mağaza Brüt m²</span>
                  <div className="text-base font-bold text-white mt-0.5 font-mono">
                    {selectedProject.grossAreaSqm ? `${selectedProject.grossAreaSqm} m²` : "120 m²"}
                  </div>
                </div>

                <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl">
                  <span className="text-slate-400">Total CAPEX</span>
                  <div className="text-base font-bold text-emerald-400 mt-0.5 font-mono">
                    {selectedProject.totalCapex
                      ? `${(selectedProject.totalCapex / 1000000).toFixed(2)}M ₺`
                      : "1.85M ₺"}
                  </div>
                </div>

                <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl col-span-2">
                  <span className="text-slate-400">m² Başına Kurulum Maliyeti</span>
                  <div className="text-lg font-bold text-blue-400 mt-0.5 font-mono">
                    {selectedProject.grossAreaSqm && selectedProject.totalCapex
                      ? `${Math.round(selectedProject.totalCapex / selectedProject.grossAreaSqm).toLocaleString("tr-TR")} ₺ / m²`
                      : "15.416 ₺ / m²"}
                  </div>
                </div>
              </div>

              {/* Stage-Gate Status */}
              <div className="space-y-1.5 pt-1 border-t border-slate-800 text-xs">
                <div className="flex items-center justify-between text-slate-300">
                  <span className="flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-blue-400" />
                    İdari İzinler:
                  </span>
                  <span className="font-bold text-white">
                    {selectedProject.stageGates?.filter((g) => g.isApproved).length} /{" "}
                    {selectedProject.stageGates?.length || 5} Faz Onaylı
                  </span>
                </div>
                <div className="h-1.5 w-full bg-slate-950 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 rounded-full"
                    style={{ width: `${selectedProject.progress || 0}%` }}
                  ></div>
                </div>
              </div>

              {/* Direct Actions */}
              <div className="space-y-2 pt-2 border-t border-slate-800">
                <Link
                  href={`/admin/franchise/projects/${selectedProject.id}/handover`}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-colors shadow-sm"
                >
                  <FolderArchive className="w-4 h-4" />
                  <span>Devir-Teslim (Handover) Arşivi</span>
                </Link>

                <Link
                  href={`/admin/franchise/stage-gates/${selectedProject.id}`}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Stage-Gate İdari Kilitleri Aç</span>
                </Link>
              </div>
            </div>
          ) : (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center text-slate-500 text-xs">
              Detayları görmek için harita üzerinden bir mağaza pinine tıklayın.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
