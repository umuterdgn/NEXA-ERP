"use client"
/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Nexa ERP - Görsel Proje Kontrol Merkezi (2.5D Isometric & Heatmap Master Dashboard)
 * Açık / Koyu Tema (Light & Dark) Destekli, Veritabanı (Prisma) Entegreli
 */

import React, { useState, useEffect } from "react"
import {
  Building2,
  Users,
  Truck,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Layers,
  Activity,
  HardHat,
  ChevronRight,
  X,
  Compass,
  ArrowUpRight,
  Filter,
  RefreshCw,
  Plus,
  ShieldAlert,
  Flame,
  Radio,
  SlidersHorizontal,
  FileWarning,
} from "lucide-react"
import toast from "react-hot-toast"
import ThemeToggle from "@/components/ThemeToggle"

interface ZoneItem {
  id: string
  name: string
  code?: string | null
  floorNumber: number
  areaType?: string | null
  status: string
  progressRate: number
}

interface DeficiencyItem {
  id: string
  floor: string
  element?: string | null
  category: string
  priority: string
  description: string
  status: string
}

interface BlockItem {
  id: string
  projectId: string
  projectName?: string
  name: string
  code: string
  totalFloors: number
  basementFloors: number
  status: string
  healthStatus: "GREEN" | "YELLOW" | "RED"
  completionRate: number
  activeWorkers: number
  activeMachinery: number
  lastMilestone: string
  openDefects: number
  isgRiskScore: number
  workerBreakdown?: {
    kalipci: number
    demirci: number
    betoncu: number
    elektrik: number
    isg: number
  }
  machineryList?: {
    name: string
    type: string
    status: string
    batteryOrTelemetry: string
  }[]
  deficienciesList?: DeficiencyItem[]
  zones: ZoneItem[]
}

interface ProjectOption {
  id: string
  name: string
  status: string
  progress?: number | null
  city?: string | null
}

export default function ProjectMasterDashboardPage() {
  const [projects, setProjects] = useState<ProjectOption[]>([])
  const [selectedProjectId, setSelectedProjectId] = useState<string>("")
  const [blocks, setBlocks] = useState<BlockItem[]>([])
  const [selectedBlock, setSelectedBlock] = useState<BlockItem | null>(null)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [activeFilter, setActiveFilter] = useState<"ALL" | "GREEN" | "YELLOW" | "RED">("ALL")
  const [viewMode, setViewMode] = useState<"ISOMETRIC" | "HEATMAP">("ISOMETRIC")
  const [isLoading, setIsLoading] = useState(false)

  // Sayfa açıldığında projeleri ve blokları DB'den çek
  useEffect(() => {
    fetchInitialData()
  }, [])

  const fetchInitialData = async () => {
    setIsLoading(true)
    try {
      const res = await fetch("/api/admin/blocks")
      if (res.ok) {
        const data = await res.json()
        if (data.projects && data.projects.length > 0) {
          setProjects(data.projects)
          const targetId = data.selectedProjectId || data.projects[0].id
          setSelectedProjectId(targetId)
          if (data.blocks) {
            setBlocks(data.blocks)
          }
        }
      }
    } catch (e) {
      toast.error("Proje verileri yüklenirken hata oluştu.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleProjectChange = async (projectId: string) => {
    setSelectedProjectId(projectId)
    setIsLoading(true)
    try {
      const res = await fetch(`/api/admin/blocks?projectId=${projectId}`)
      if (res.ok) {
        const data = await res.json()
        if (data.blocks) {
          setBlocks(data.blocks)
          toast.success(`${projects.find((p) => p.id === projectId)?.name || "Proje"} blokları yüklendi.`)
        }
      }
    } catch (e) {
      toast.error("Bloklar yüklenemedi.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleOpenXRay = (block: BlockItem) => {
    setSelectedBlock(block)
    setIsDrawerOpen(true)
  }

  const handleStatusChangeSimulation = async (blockId: string, newHealth: "GREEN" | "YELLOW" | "RED") => {
    // 1. Optimistic UI update
    setBlocks((prev) =>
      prev.map((b) => {
        if (b.id === blockId) {
          return {
            ...b,
            healthStatus: newHealth,
            isgRiskScore: newHealth === "RED" ? 85 : newHealth === "YELLOW" ? 40 : 10,
          }
        }
        return b
      })
    )
    if (selectedBlock && selectedBlock.id === blockId) {
      setSelectedBlock((prev) => (prev ? { ...prev, healthStatus: newHealth } : null))
    }

    // 2. DB Update (PATCH)
    try {
      const res = await fetch("/api/admin/blocks", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ blockId, healthStatus: newHealth }),
      })
      if (res.ok) {
        toast.success(`Blok durumu veritabanında ${newHealth} olarak güncellendi.`)
      }
    } catch (err) {
      // rollback or ignore
    }
  }

  const filteredBlocks = blocks.filter((b) => {
    if (activeFilter === "ALL") return true
    return b.healthStatus === activeFilter
  })

  // Canlı KPI hesaplamaları
  const totalBlocks = blocks.length
  const avgProgress = totalBlocks > 0
    ? Math.round(blocks.reduce((acc, curr) => acc + (curr.completionRate || 0), 0) / totalBlocks)
    : 0
  const totalWorkers = blocks.reduce((acc, curr) => acc + (curr.activeWorkers || 0), 0)
  const totalMachinery = blocks.reduce((acc, curr) => acc + (curr.activeMachinery || 0), 0)
  const redAlertCount = blocks.filter((b) => b.healthStatus === "RED").length
  const yellowAlertCount = blocks.filter((b) => b.healthStatus === "YELLOW").length

  return (
    <div className="min-h-screen text-slate-900 dark:text-slate-100 pb-20 relative">
      {/* Top Banner & Control Center Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Canlı DB & IoT Telemetrisi
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
              NEXA MASTER DISPATCHER v4.5
            </span>
          </div>
          <h1 className="text-2xl lg:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight mt-1">
            Proje Kontrol Merkezi (Master Dashboard)
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Prisma veritabanı destekli 2.5D izometrik kule görünümü ve çoklu blok ısı haritası (Heatmap).
          </p>
        </div>

        {/* Action Buttons & Dynamic Project Switcher */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Dynamic DB Project Selector */}
          <div className="relative">
            <select
              value={selectedProjectId}
              onChange={(e) => handleProjectChange(e.target.value)}
              className="px-4 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-900 dark:text-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[240px]"
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} {p.city ? `(${p.city})` : ""}
                </option>
              ))}
            </select>
          </div>

          {/* View Mode Toggle */}
          <div className="bg-slate-100 dark:bg-slate-900 p-1 rounded-xl border border-slate-300 dark:border-slate-800 flex items-center shadow-sm">
            <button
              onClick={() => setViewMode("ISOMETRIC")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                viewMode === "ISOMETRIC"
                  ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>2.5D İzometrik</span>
            </button>
            <button
              onClick={() => setViewMode("HEATMAP")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                viewMode === "HEATMAP"
                  ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>Isı Haritası</span>
            </button>
          </div>

          {/* Quick Theme Toggle in Dashboard Toolbar */}
          <ThemeToggle variant="icon" />

          {/* Refresh Button */}
          <button
            onClick={() => handleProjectChange(selectedProjectId)}
            disabled={isLoading}
            className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-sm"
            title="Yenile"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin text-blue-500" : ""}`} />
          </button>
        </div>
      </div>

      {/* KPI METRIC BAR */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-8">
        <div className="bg-white dark:bg-slate-900/80 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs mb-1">
            <span>Toplam Blok</span>
            <Building2 className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            {totalBlocks} <span className="text-xs font-normal text-slate-500">Kule/Yapı</span>
          </div>
          <div className="text-[11px] text-blue-600 dark:text-blue-400 font-medium mt-1">Multi-Block Hiyerarşi</div>
        </div>

        <div className="bg-white dark:bg-slate-900/80 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs mb-1">
            <span>Genel İlerleme</span>
            <Compass className="w-4 h-4 text-cyan-500" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">%{avgProgress}</div>
          <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-500 to-emerald-500 h-full rounded-full" style={{ width: `${avgProgress}%` }} />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900/80 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs mb-1">
            <span>Aktif İşçi (Turnike/GPS)</span>
            <HardHat className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            {totalWorkers} <span className="text-xs font-normal text-slate-500">Personel</span>
          </div>
          <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium mt-1 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
            Canlı Biyometrik Onaylı
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900/80 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs mb-1">
            <span>İş Makineleri (BLE)</span>
            <Truck className="w-4 h-4 text-purple-500" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            {totalMachinery} <span className="text-xs font-normal text-slate-500">Araç</span>
          </div>
          <div className="text-[11px] text-purple-600 dark:text-purple-400 font-medium mt-1">Vinç, Pompa & Kepçe</div>
        </div>

        <div className="col-span-2 md:col-span-1 bg-white dark:bg-slate-900/80 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs mb-1">
            <span>Riskli Bloklar</span>
            <ShieldAlert className="w-4 h-4 text-rose-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-rose-600 dark:text-rose-400">{redAlertCount}</span>
            <span className="text-xs text-rose-600 dark:text-rose-400 font-bold">Kritik</span>
            <span className="text-slate-400 dark:text-slate-600">/</span>
            <span className="text-lg font-bold text-amber-600 dark:text-amber-400">{yellowAlertCount}</span>
            <span className="text-xs text-amber-600 dark:text-amber-400 font-bold">Risk</span>
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">İSG & İmalat Durumu</div>
        </div>
      </div>

      {/* FILTER BUTTONS & HEATMAP LEGEND */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6 bg-white dark:bg-slate-900/50 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-500 dark:text-slate-400" />
          <span className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Durum Filtresi:</span>
          
          <button
            onClick={() => setActiveFilter("ALL")}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
              activeFilter === "ALL"
                ? "bg-blue-600 text-white shadow-sm"
                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            Tümü ({blocks.length})
          </button>

          <button
            onClick={() => setActiveFilter("GREEN")}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeFilter === "GREEN"
                ? "bg-emerald-600 text-white"
                : "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/40"
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            Planında ({blocks.filter((b) => b.healthStatus === "GREEN").length})
          </button>

          <button
            onClick={() => setActiveFilter("YELLOW")}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeFilter === "YELLOW"
                ? "bg-amber-600 text-white"
                : "bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-400 border border-amber-200 dark:border-amber-800/40"
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            Gecikme / Risk ({blocks.filter((b) => b.healthStatus === "YELLOW").length})
          </button>

          <button
            onClick={() => setActiveFilter("RED")}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeFilter === "RED"
                ? "bg-rose-600 text-white"
                : "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800/40"
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-rose-500" />
            Kritik / Durdu ({blocks.filter((b) => b.healthStatus === "RED").length})
          </button>
        </div>

        {/* Heatmap Legend */}
        <div className="flex items-center gap-4 text-xs font-medium text-slate-600 dark:text-slate-400">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-emerald-500 shadow-sm" />
            <span>%80+ / Takvimde</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-amber-500 shadow-sm" />
            <span>Risk / DÖF</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-rose-600 shadow-sm" />
            <span>Kritik / İSG Kaza</span>
          </div>
        </div>
      </div>

      {/* MAIN VIEW: 2.5D ISOMETRIC / HEATMAP */}
      {viewMode === "ISOMETRIC" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {filteredBlocks.map((block) => {
            const isGreen = block.healthStatus === "GREEN"
            const isYellow = block.healthStatus === "YELLOW"
            const isRed = block.healthStatus === "RED"

            const statusBorder = isRed
              ? "border-rose-400 dark:border-rose-500/60 shadow-xl shadow-rose-900/10 ring-1 ring-rose-500/30"
              : isYellow
              ? "border-amber-400 dark:border-amber-500/60 shadow-xl shadow-amber-900/10 ring-1 ring-amber-500/30"
              : "border-emerald-300 dark:border-emerald-500/40 hover:border-emerald-500"

            const badgeBg = isRed
              ? "bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-500/20 dark:text-rose-300 dark:border-rose-500/40"
              : isYellow
              ? "bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-500/20 dark:text-amber-300 dark:border-amber-500/40"
              : "bg-emerald-100 text-emerald-900 border-emerald-300 dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-500/40"

            return (
              <div
                key={block.id}
                onClick={() => handleOpenXRay(block)}
                className={`bg-white dark:bg-slate-900 rounded-3xl p-5 border-2 transition-all cursor-pointer hover:-translate-y-1 relative group flex flex-col justify-between overflow-hidden shadow-sm ${statusBorder}`}
              >
                {/* 2.5D Isometric Top Accent Glow */}
                <div
                  className={`absolute top-0 left-0 right-0 h-1.5 ${
                    isRed ? "bg-rose-500" : isYellow ? "bg-amber-500" : "bg-emerald-500"
                  }`}
                />

                <div>
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-2 mb-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-black tracking-wider uppercase bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                          {block.code}
                        </span>
                        <span className="text-xs text-slate-500 dark:text-slate-400">
                          {block.totalFloors} Kat ({block.basementFloors} Bodrum)
                        </span>
                      </div>
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white mt-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {block.name}
                      </h3>
                    </div>

                    <span
                      className={`px-2.5 py-1 rounded-full text-[11px] font-black border uppercase tracking-wider flex items-center gap-1 ${badgeBg}`}
                    >
                      <span
                        className={`w-2 h-2 rounded-full ${
                          isRed
                            ? "bg-rose-500 animate-ping"
                            : isYellow
                            ? "bg-amber-500"
                            : "bg-emerald-500"
                        }`}
                      />
                      {isRed ? "Kritik" : isYellow ? "Risk" : "Planında"}
                    </span>
                  </div>

                  {/* 2.5D ISOMETRIC VISUAL TOWER (CSS Slices) */}
                  <div className="my-4 py-4 px-3 bg-slate-50 dark:bg-slate-950/60 rounded-2xl border border-slate-200 dark:border-slate-800/80 flex items-center justify-center relative overflow-hidden">
                    <div className="w-full flex flex-col items-center">
                      <div className="w-36 flex flex-col gap-1 py-1">
                        {[...Array(6)].map((_, i) => {
                          const floorIndex = 5 - i
                          const isFloorCompleted =
                            floorIndex <= Math.floor((block.completionRate / 100) * 6)
                          const isFloorActive =
                            floorIndex === Math.floor((block.completionRate / 100) * 6) + 1

                          const sliceColor = isRed
                            ? isFloorCompleted
                              ? "bg-rose-200 text-rose-900 border-rose-300 dark:bg-rose-900/60 dark:text-slate-300 dark:border-rose-500/50"
                              : isFloorActive
                              ? "bg-rose-500 text-white border-rose-600 animate-pulse dark:bg-rose-500/40 dark:border-rose-400"
                              : "bg-slate-200 text-slate-600 border-slate-300 dark:bg-slate-800/40 dark:text-slate-500 dark:border-slate-700/50"
                            : isYellow
                            ? isFloorCompleted
                              ? "bg-amber-200 text-amber-900 border-amber-300 dark:bg-amber-900/60 dark:text-slate-300 dark:border-amber-500/50"
                              : isFloorActive
                              ? "bg-amber-500 text-white border-amber-600 animate-pulse dark:bg-amber-500/40 dark:border-amber-400"
                              : "bg-slate-200 text-slate-600 border-slate-300 dark:bg-slate-800/40 dark:text-slate-500 dark:border-slate-700/50"
                            : isFloorCompleted
                            ? "bg-emerald-200 text-emerald-900 border-emerald-300 dark:bg-emerald-900/60 dark:text-slate-300 dark:border-emerald-500/50"
                            : isFloorActive
                            ? "bg-emerald-500 text-white border-emerald-600 animate-pulse dark:bg-emerald-500/40 dark:border-emerald-400"
                            : "bg-slate-200 text-slate-600 border-slate-300 dark:bg-slate-800/40 dark:text-slate-500 dark:border-slate-700/50"

                          return (
                            <div
                              key={i}
                              style={{
                                transform: "perspective(300px) rotateX(25deg)",
                                height: "13px",
                              }}
                              className={`rounded-md border shadow-sm transition-all flex items-center justify-between px-2 ${sliceColor}`}
                            >
                              <span className="text-[8px] font-mono font-bold">
                                {floorIndex === 5 ? "Çatı" : floorIndex === 0 ? "Zemin" : `K-${floorIndex}`}
                              </span>
                              {isFloorActive && (
                                <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                              )}
                            </div>
                          )
                        })}
                      </div>

                      <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono mt-1">
                        2.5D İzometrik Katman Dilimleri
                      </div>
                    </div>
                  </div>

                  {/* Progress Bar & Percentage */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between text-xs mb-1.5 font-bold">
                      <span className="text-slate-500 dark:text-slate-400">İlerleme Oranı</span>
                      <span className="text-slate-900 dark:text-white">%{block.completionRate}</span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          isRed
                            ? "bg-rose-500"
                            : isYellow
                            ? "bg-amber-500"
                            : "bg-emerald-500"
                        }`}
                        style={{ width: `${block.completionRate}%` }}
                      />
                    </div>
                  </div>

                  {/* Last Milestone Info */}
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 mb-4 text-xs">
                    <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider mb-1 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-cyan-600 dark:text-cyan-400" />
                      Son Kritik İmalat
                    </div>
                    <p className="text-slate-700 dark:text-slate-300 font-medium line-clamp-2 leading-relaxed">
                      {block.lastMilestone}
                    </p>
                  </div>

                  {/* Field Telemetry Quick Chips */}
                  <div className="grid grid-cols-2 gap-2 text-xs mb-2">
                    <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 flex items-center gap-2">
                      <HardHat className="w-4 h-4 text-amber-500 flex-shrink-0" />
                      <div>
                        <div className="font-bold text-slate-900 dark:text-white">{block.activeWorkers} İşçi</div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400">Turnike/GPS</div>
                      </div>
                    </div>

                    <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 flex items-center gap-2">
                      <Truck className="w-4 h-4 text-purple-500 flex-shrink-0" />
                      <div>
                        <div className="font-bold text-slate-900 dark:text-white">{block.activeMachinery} Araç</div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400">BLE IoT Tag</div>
                      </div>
                    </div>
                  </div>

                  {/* Open Defects / OHS Risk */}
                  <div className="flex items-center justify-between text-xs py-2 px-3 rounded-xl bg-slate-50 dark:bg-slate-950/30 border border-slate-200 dark:border-slate-800/80">
                    <span className="text-slate-500 dark:text-slate-400">Açık DÖF:</span>
                    <span
                      className={`font-bold ${
                        block.openDefects > 0 ? "text-amber-600 dark:text-amber-400" : "text-emerald-600 dark:text-emerald-400"
                      }`}
                    >
                      {block.openDefects > 0 ? `${block.openDefects} Uygunsuzluk` : "Sıfır DÖF"}
                    </span>
                  </div>
                </div>

                {/* Card Footer: X-Ray Drawer Trigger */}
                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
                  <span className="text-xs font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                    <span>X-Ray İncele</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">
                    İSG Risk: {block.isgRiskScore}/100
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        /* HEATMAP MATRIX VIEW */
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 space-y-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Kat & Blok Isı Haritası Matrisi</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Tüm blokların kat bazında imalat yoğunluğunu ve engellerini tek bakışta analiz edin.
              </p>
            </div>
            <div className="text-xs font-mono text-slate-500 dark:text-slate-400">
              Prisma Canlı Telemetri
            </div>
          </div>

          <div className="space-y-4">
            {filteredBlocks.map((block) => (
              <div
                key={block.id}
                onClick={() => handleOpenXRay(block)}
                className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 hover:border-blue-500/50 transition-colors cursor-pointer"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded font-black text-xs bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-white">
                      {block.code}
                    </span>
                    <h3 className="font-bold text-slate-900 dark:text-white text-base">{block.name}</h3>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        block.healthStatus === "RED"
                          ? "bg-rose-100 text-rose-800 dark:bg-rose-500/20 dark:text-rose-300"
                          : block.healthStatus === "YELLOW"
                          ? "bg-amber-100 text-amber-900 dark:bg-amber-500/20 dark:text-amber-300"
                          : "bg-emerald-100 text-emerald-900 dark:bg-emerald-500/20 dark:text-emerald-300"
                      }`}
                    >
                      {block.healthStatus}
                    </span>
                  </div>

                  <div className="flex items-center gap-4 text-xs">
                    <span className="text-slate-500 dark:text-slate-400">
                      Aktif: <strong className="text-slate-900 dark:text-white">{block.activeWorkers} İşçi</strong>
                    </span>
                    <span className="text-slate-500 dark:text-slate-400">
                      Makine: <strong className="text-slate-900 dark:text-white">{block.activeMachinery} Adet</strong>
                    </span>
                    <span className="text-blue-600 dark:text-blue-400 font-bold">%{block.completionRate}</span>
                  </div>
                </div>

                {/* Floor Matrix Grid */}
                <div className="grid grid-cols-4 sm:grid-cols-8 md:grid-cols-14 gap-1.5">
                  {block.zones.map((zone) => {
                    const isZoneDone = zone.progressRate === 100
                    const isZoneRisk = zone.name.includes("DÖF") || zone.name.includes("Mühür")

                    const zoneBg = isZoneRisk
                      ? "bg-rose-600 text-white border-rose-400"
                      : isZoneDone
                      ? "bg-emerald-600 text-white border-emerald-400"
                      : zone.progressRate > 0
                      ? "bg-amber-500 text-white border-amber-300"
                      : "bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border-slate-300 dark:border-slate-700"

                    return (
                      <div
                        key={zone.id}
                        className={`p-2 rounded-lg border text-center transition-transform hover:scale-105 shadow-xs ${zoneBg}`}
                        title={`${zone.name} - %${zone.progressRate}`}
                      >
                        <div className="text-[10px] font-mono font-bold">
                          {zone.floorNumber === 0 ? "Zemin" : `K-${zone.floorNumber}`}
                        </div>
                        <div className="text-[9px] font-black mt-0.5">
                          %{zone.progressRate}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* X-RAY VIEW DRAWER (Slide Panel) */}
      {isDrawerOpen && selectedBlock && (
        <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/60 dark:bg-black/75 backdrop-blur-xs transition-opacity"
            onClick={() => setIsDrawerOpen(false)}
          />

          {/* Drawer Body */}
          <div className="relative w-full max-w-xl bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 h-full shadow-2xl flex flex-col z-10 overflow-y-auto">
            {/* Drawer Header */}
            <div className="p-6 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/80 sticky top-0 z-20 flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-blue-600 text-white">
                    {selectedBlock.code}
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    {selectedBlock.projectName || "Aktif Şantiye"}
                  </span>
                </div>
                <h2 className="text-xl font-black text-slate-900 dark:text-white">{selectedBlock.name}</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  X-Ray Dijital Şantiye İnceleme ve Canlı Telemetri Raporu
                </p>
              </div>

              <button
                onClick={() => setIsDrawerOpen(false)}
                className="p-2 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Drawer Content */}
            <div className="p-6 space-y-6 flex-1">
              {/* Quick Health Status Changer for simulation */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-slate-800 dark:text-slate-300">Blok Durumu (DB Kaydı)</div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Durumu anında güncelle</div>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleStatusChangeSimulation(selectedBlock.id, "GREEN")}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors ${
                      selectedBlock.healthStatus === "GREEN"
                        ? "bg-emerald-600 text-white shadow-sm"
                        : "bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                    }`}
                  >
                    🟢 Planında
                  </button>
                  <button
                    onClick={() => handleStatusChangeSimulation(selectedBlock.id, "YELLOW")}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors ${
                      selectedBlock.healthStatus === "YELLOW"
                        ? "bg-amber-600 text-white shadow-sm"
                        : "bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                    }`}
                  >
                    🟡 Risk
                  </button>
                  <button
                    onClick={() => handleStatusChangeSimulation(selectedBlock.id, "RED")}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors ${
                      selectedBlock.healthStatus === "RED"
                        ? "bg-rose-600 text-white shadow-sm"
                        : "bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                    }`}
                  >
                    🔴 Kritik
                  </button>
                </div>
              </div>

              {/* 1. CANLI TURNİKE & GPS İŞÇİ TELEMETRİSİ */}
              <div className="bg-slate-50 dark:bg-slate-950/60 rounded-2xl p-5 border border-slate-200 dark:border-slate-800">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-amber-500/10 text-amber-500">
                      <HardHat className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 dark:text-white text-sm">Canlı İşçi Sayısı (Turnike & GPS)</h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">DB Attendance loglarından anlık çekildi</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xl font-black text-amber-600 dark:text-amber-400">
                      {selectedBlock.activeWorkers}
                    </span>
                    <span className="text-xs text-slate-500 ml-1">Kişi</span>
                  </div>
                </div>

                {selectedBlock.workerBreakdown && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-3 pt-3 border-t border-slate-200 dark:border-slate-800/80">
                    <div className="p-2 bg-white dark:bg-slate-900 rounded-xl text-xs border border-slate-100 dark:border-transparent">
                      <span className="text-slate-500 dark:text-slate-400">Kalıpçı Ekibi:</span>
                      <div className="font-bold text-slate-900 dark:text-white">{selectedBlock.workerBreakdown.kalipci} Personel</div>
                    </div>
                    <div className="p-2 bg-white dark:bg-slate-900 rounded-xl text-xs border border-slate-100 dark:border-transparent">
                      <span className="text-slate-500 dark:text-slate-400">Demirci Ekibi:</span>
                      <div className="font-bold text-slate-900 dark:text-white">{selectedBlock.workerBreakdown.demirci} Personel</div>
                    </div>
                    <div className="p-2 bg-white dark:bg-slate-900 rounded-xl text-xs border border-slate-100 dark:border-transparent">
                      <span className="text-slate-500 dark:text-slate-400">Beton Ekibi:</span>
                      <div className="font-bold text-slate-900 dark:text-white">{selectedBlock.workerBreakdown.betoncu} Personel</div>
                    </div>
                    <div className="p-2 bg-white dark:bg-slate-900 rounded-xl text-xs border border-slate-100 dark:border-transparent">
                      <span className="text-slate-500 dark:text-slate-400">Mekanik/Elektrik:</span>
                      <div className="font-bold text-slate-900 dark:text-white">{selectedBlock.workerBreakdown.elektrik} Personel</div>
                    </div>
                    <div className="p-2 bg-white dark:bg-slate-900 rounded-xl text-xs border border-slate-100 dark:border-transparent">
                      <span className="text-slate-500 dark:text-slate-400">İSG & Saha Şefi:</span>
                      <div className="font-bold text-emerald-600 dark:text-emerald-400">{selectedBlock.workerBreakdown.isg} Personel</div>
                    </div>
                  </div>
                )}
              </div>

              {/* 2. SON TAMAMLANAN KRİTİK İMALAT */}
              <div className="bg-slate-50 dark:bg-slate-950/60 rounded-2xl p-5 border border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-white text-sm">Son Tamamlanan Kritik İmalat (Milestone)</h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">Yapı denetim onaylı şantiye imalatı</p>
                  </div>
                </div>

                <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 mt-2">
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                    {selectedBlock.lastMilestone}
                  </p>
                  <div className="flex items-center gap-3 text-[11px] text-slate-500 dark:text-slate-400 mt-2">
                    <span>Durum: <strong className="text-emerald-600 dark:text-emerald-400">Onaylandı</strong></span>
                    <span>•</span>
                    <span>Kalite & Kürleme Takibinde</span>
                  </div>
                </div>
              </div>

              {/* 3. ANLIK UYUMSUZLUK (DÖF) RAPORLARI */}
              <div className="bg-slate-50 dark:bg-slate-950/60 rounded-2xl p-5 border border-slate-200 dark:border-slate-800">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-rose-500/10 text-rose-500">
                      <FileWarning className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 dark:text-white text-sm">Açık DÖF / Saha Uygunsuzlukları</h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">Veritabanındaki aktif uygunsuzluklar</p>
                    </div>
                  </div>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300">
                    {selectedBlock.deficienciesList?.length || selectedBlock.openDefects} Kayıt
                  </span>
                </div>

                {selectedBlock.deficienciesList && selectedBlock.deficienciesList.length > 0 ? (
                  <div className="space-y-2 mt-2">
                    {selectedBlock.deficienciesList.map((def, idx) => (
                      <div
                        key={def.id || idx}
                        className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 flex items-start justify-between text-xs"
                      >
                        <div>
                          <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                            <span className="text-rose-600 dark:text-rose-400">[{def.floor}]</span>
                            <span>{def.description}</span>
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                            Kategori: {def.category} • Öncelik: {def.priority}
                          </div>
                        </div>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
                          {def.status}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl text-center text-xs text-emerald-700 dark:text-emerald-400 font-medium">
                    Bu blokta açık bir DÖF veya uygunsuzluk kaydı bulunmuyor.
                  </div>
                )}
              </div>

              {/* 4. SAHADAKİ AKTİF İŞ MAKİNELERİ (BLE IoT) */}
              <div className="bg-slate-50 dark:bg-slate-950/60 rounded-2xl p-5 border border-slate-200 dark:border-slate-800">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-purple-500/10 text-purple-500">
                      <Truck className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 dark:text-white text-sm">Aktif İş Makineleri (BLE & IoT)</h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">Otomatik telemetri ve yük sensörü</p>
                    </div>
                  </div>
                  <span className="text-sm font-bold text-purple-600 dark:text-purple-400">
                    {selectedBlock.machineryList?.length || selectedBlock.activeMachinery} Makine
                  </span>
                </div>

                <div className="space-y-2 mt-2">
                  {selectedBlock.machineryList?.map((m, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs"
                    >
                      <div>
                        <div className="font-bold text-slate-900 dark:text-white">{m.name}</div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400">{m.type} • {m.status}</div>
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200 dark:border-purple-800/40">
                        {m.batteryOrTelemetry}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* 5. KAT VE MAHAL BAZINDA DETAYLI İLERLEME */}
              <div className="bg-slate-50 dark:bg-slate-950/60 rounded-2xl p-5 border border-slate-200 dark:border-slate-800">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500">
                      <Layers className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 dark:text-white text-sm">Kat & Mahal İlerleme Çubukları</h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">Her katın DB'deki ilerleme yüzdesi</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3 mt-2 max-h-64 overflow-y-auto pr-1">
                  {selectedBlock.zones.map((zone) => (
                    <div
                      key={zone.id}
                      className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800/80"
                    >
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="font-bold text-slate-900 dark:text-white">{zone.name}</span>
                        <span
                          className={`font-black ${
                            zone.progressRate === 100
                              ? "text-emerald-600 dark:text-emerald-400"
                              : zone.progressRate > 0
                              ? "text-amber-600 dark:text-amber-400"
                              : "text-slate-400 dark:text-slate-500"
                          }`}
                        >
                          %{zone.progressRate}
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            zone.progressRate === 100
                              ? "bg-emerald-500"
                              : zone.progressRate > 0
                              ? "bg-amber-500"
                              : "bg-slate-300 dark:bg-slate-700"
                          }`}
                          style={{ width: `${zone.progressRate}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Quick Actions */}
              <div className="pt-2">
                <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                  Hızlı Saha Aksiyonları
                </h4>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => toast.success("İş emri oluşturma modülü açıldı")}
                    className="p-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-colors text-center shadow-sm"
                  >
                    + İş Emri Ata
                  </button>
                  <button
                    onClick={() => toast.success("DÖF / Uygunsuzluk bildirim formu açıldı")}
                    className="p-3 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold transition-colors text-center shadow-sm"
                  >
                    ⚠️ DÖF Kaydı Aç
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
