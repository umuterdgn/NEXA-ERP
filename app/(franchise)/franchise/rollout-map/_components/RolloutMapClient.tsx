"use client"
/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Franchise İnteraktif Rollout Haritası Client Bileşeni
 */

import { useState } from "react"
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
  Plus,
  Coins,
} from "lucide-react"

import RolloutMapWrapper from "./RolloutMapWrapper"
import type { StoreProject, PinCategory } from "./RolloutLeafletMap"

export default function RolloutMapClient({ initialProjects }: { initialProjects: StoreProject[] }) {
  const [projects, setProjects] = useState<StoreProject[]>(initialProjects)
  const [selectedCategory, setSelectedCategory] = useState<"ALL" | PinCategory>("ALL")
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedProject, setSelectedProject] = useState<StoreProject | null>(
    initialProjects.length > 0 ? initialProjects[0] : null
  )

  // Pin Statüsü Belirleme Kuralı
  const getPinCategory = (p: StoreProject): PinCategory => {
    const totalGates = p.stageGates?.length || 5
    const approvedGates = p.stageGates?.filter((g) => g.isApproved)?.length || 0

    if (p.status === "ACILISA_HAZIR" || approvedGates === totalGates) {
      return "ACIK" // Yeşil
    }

    if (p.status === "PUNCH_LIST" || approvedGates >= 3) {
      return "IT_MONTAJ" // Mavi
    }

    if (approvedGates >= 2 || p.status === "INSAAT") {
      return "INSAAT" // Sarı
    }

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
      (p.name || p.title || "").toLowerCase().includes(q) ||
      (p.city || "").toLowerCase().includes(q)
    return matchesCategory && matchesSearch
  })

  // Category counts
  const idariCount = projects.filter((p) => getPinCategory(p) === "IDARI").length
  const insaatCount = projects.filter((p) => getPinCategory(p) === "INSAAT").length
  const itMontajCount = projects.filter((p) => getPinCategory(p) === "IT_MONTAJ").length
  const acikCount = projects.filter((p) => getPinCategory(p) === "ACIK").length

  return (
    <div className="w-full space-y-6 pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-amber-400 mb-1">
            <Compass className="w-4 h-4" />
            <span>Coğrafi Bilgi Sistemi (GIS) & Canlı Harita</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            Türkiye Rollout Haritası
          </h1>
          <p className="text-sm text-slate-400">
            Prisma veritabanındaki gerçek şube koordinatları ve anlık idari kilit durumları üzerinden canlı harita.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            href="/franchise/rollout"
            className="px-3.5 py-2 rounded-lg bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 text-xs font-medium transition-colors"
          >
            Rollout Kanban
          </Link>
          <Link
            href="/franchise/rollout"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold shadow-md shadow-amber-600/20"
          >
            <Plus className="w-4 h-4" />
            <span>Yeni Şube Açılışı</span>
          </Link>
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
          <p className="text-[11px] text-slate-500 mt-1">Punch List & Donanım</p>
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
          <p className="text-[11px] text-slate-500 mt-1">Açılışı Tamamlanan</p>
        </button>
      </div>

      {/* Empty State: data.length === 0 */}
      {projects.length === 0 ? (
        <div className="bg-slate-900/60 rounded-2xl border border-dashed border-slate-800 p-12 text-center max-w-xl mx-auto space-y-4 shadow-xl my-6">
          <div className="w-16 h-16 rounded-2xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-center mx-auto text-slate-400 shadow-inner">
            <MapIcon className="w-8 h-8 text-amber-400" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-white">Kayıtlı Mağaza Projesi Bulunamadı</h3>
            <p className="text-sm text-slate-400">
              Haritada görüntülenecek herhangi bir franchise veya çoklu mağaza açılış projesi bulunamadı.
            </p>
          </div>
          <Link
            href="/franchise/rollout"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-amber-600 hover:bg-amber-500 text-white rounded-lg transition-colors text-xs font-semibold shadow-lg shadow-amber-600/20"
          >
            <Plus className="w-4 h-4" />
            <span>Yeni Mağaza Açılışı Başlat</span>
          </Link>
        </div>
      ) : (
        /* Main Map & Detail Panel Grid */
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
                  className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex items-center gap-2 text-xs text-slate-400">
                <span>Aktif Canlı Pinler: <strong className="text-white font-mono">{filteredProjects.length}</strong></span>
              </div>
            </div>

            {/* Real React-Leaflet Rollout Map */}
            <RolloutMapWrapper
              projects={filteredProjects}
              selectedProject={selectedProject}
              onSelectProject={setSelectedProject}
              getPinCategory={getPinCategory}
            />
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
                    <span className="text-xs text-slate-400 font-medium">
                      {selectedProject.city}
                    </span>
                  </div>

                  <h2 className="text-lg font-bold text-white mt-1.5">
                    {selectedProject.name || selectedProject.title}
                  </h2>

                  <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-1">
                    <MapPin className="w-3.5 h-3.5 text-amber-500" />
                    <span>
                      {selectedProject.city} {selectedProject.latitude ? `(${selectedProject.latitude.toFixed(2)}, ${selectedProject.longitude?.toFixed(2)})` : ""}
                    </span>
                  </div>
                </div>

                {/* Bütçe & Koordinat Bilgileri */}
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl">
                    <span className="text-slate-400">Toplam Kurulum Bütçesi</span>
                    <div className="text-base font-bold text-emerald-400 mt-0.5 font-mono">
                      {(selectedProject.totalBudget || selectedProject.budget || 0).toLocaleString("tr-TR")} ₺
                    </div>
                  </div>

                  <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl">
                    <span className="text-slate-400">Statü</span>
                    <div className="text-sm font-bold text-amber-400 mt-0.5">
                      {selectedProject.status || selectedProject.rolloutPhase}
                    </div>
                  </div>
                </div>

                {/* Direct Actions */}
                <div className="space-y-2 pt-2 border-t border-slate-800">
                  <Link
                    href={`/franchise/rollout/${selectedProject.id}`}
                    className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold transition-colors shadow-sm"
                  >
                    <Coins className="w-4 h-4" />
                    <span>Şube Detay & Giderler (Expenses)</span>
                  </Link>

                  <Link
                    href={`/franchise/rollout/${selectedProject.id}/work-proofs`}
                    className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    <span>Çift Kademeli İş Kanıtı Onayları</span>
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
      )}
    </div>
  )
}
