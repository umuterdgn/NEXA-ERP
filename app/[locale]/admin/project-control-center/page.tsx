"use client"
/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Nexa ERP - Görsel Proje Kontrol Merkezi (2.5D Isometric & Heatmap Master Dashboard)
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
} from "lucide-react"
import toast from "react-hot-toast"

interface ZoneItem {
  id: string
  name: string
  code?: string | null
  floorNumber: number
  areaType?: string | null
  status: string
  progressRate: number
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
  zones: ZoneItem[]
}

// Varsayılan zengin şantiye simülasyon blokları (DB'de henüz veri yoksa fallback)
const DEFAULT_BLOCKS: BlockItem[] = [
  {
    id: "blk-1",
    projectId: "prj-vadi",
    projectName: "Vadi Kuleleri & Yaşam Merkezi",
    name: "A Blok - Rezidans Kulesi",
    code: "BLK-A",
    totalFloors: 14,
    basementFloors: 2,
    status: "ACTIVE",
    healthStatus: "GREEN",
    completionRate: 84.5,
    activeWorkers: 46,
    activeMachinery: 4,
    lastMilestone: "Dün 12. Kat tabliyesi döküldü (C35/45 Beton, 320 m³)",
    openDefects: 0,
    isgRiskScore: 8,
    workerBreakdown: {
      kalipci: 14,
      demirci: 16,
      betoncu: 8,
      elektrik: 5,
      isg: 3,
    },
    machineryList: [
      { name: "Potain MDT 219 Kule Vinç #1", type: "Kule Vinç", status: "Yük Kaldırıyor (2.1t)", batteryOrTelemetry: "IoT Online" },
      { name: "Putzmeister 36m Pompa", type: "Beton Pompası", status: "Hazır Beklemede", batteryOrTelemetry: "CAN-Bus 98%" },
      { name: "Komatsu PC200 Ekskavatör", type: "Hafriyat", status: "Saha İçi Sevkiyat", batteryOrTelemetry: "GPS Aktif" },
    ],
    zones: [
      { id: "z-14", name: "14. Kat - Çatı Terası", floorNumber: 14, areaType: "SLAB", status: "NOT_STARTED", progressRate: 10 },
      { id: "z-13", name: "13. Kat - Daireler", floorNumber: 13, areaType: "FLOOR", status: "IN_PROGRESS", progressRate: 45 },
      { id: "z-12", name: "12. Kat - Daireler (Dün Tabliye Döküldü)", floorNumber: 12, areaType: "FLOOR", status: "COMPLETED", progressRate: 100 },
      { id: "z-11", name: "11. Kat - Daireler", floorNumber: 11, areaType: "FLOOR", status: "COMPLETED", progressRate: 100 },
      { id: "z-10", name: "10. Kat - Daireler", floorNumber: 10, areaType: "FLOOR", status: "COMPLETED", progressRate: 100 },
      { id: "z-5", name: "5. Kat - Daireler", floorNumber: 5, areaType: "FLOOR", status: "COMPLETED", progressRate: 100 },
      { id: "z-1", name: "Zemin Kat - Giriş Lobby", floorNumber: 0, areaType: "COMMON_AREA", status: "COMPLETED", progressRate: 100 },
      { id: "z-b1", name: "Bodrum -1 - Kapalı Otopark", floorNumber: -1, areaType: "COMMON_AREA", status: "COMPLETED", progressRate: 100 },
    ],
  },
  {
    id: "blk-2",
    projectId: "prj-vadi",
    projectName: "Vadi Kuleleri & Yaşam Merkezi",
    name: "B Blok - Ticari Ofis Kulesi",
    code: "BLK-B",
    totalFloors: 10,
    basementFloors: 2,
    status: "ACTIVE",
    healthStatus: "YELLOW",
    completionRate: 61.0,
    activeWorkers: 38,
    activeMachinery: 3,
    lastMilestone: "6. Kat kolon filizleri bağlandı, kalıp onayı bekleniyor",
    openDefects: 3,
    isgRiskScore: 35,
    workerBreakdown: {
      kalipci: 12,
      demirci: 12,
      betoncu: 6,
      elektrik: 6,
      isg: 2,
    },
    machineryList: [
      { name: "Liebherr 280 EC-H Vinç", type: "Kule Vinç", status: "Rüzgar Alarmı Beklemede", batteryOrTelemetry: "IoT Online" },
      { name: "Caterpillar Forklift", type: "Lojistik", status: "Palet İndiriyor", batteryOrTelemetry: "BLE Tag OK" },
    ],
    zones: [
      { id: "zb-10", name: "10. Kat - Ofis Katı", floorNumber: 10, areaType: "FLOOR", status: "NOT_STARTED", progressRate: 0 },
      { id: "zb-7", name: "7. Kat - Ofis Katı", floorNumber: 7, areaType: "FLOOR", status: "NOT_STARTED", progressRate: 15 },
      { id: "zb-6", name: "6. Kat - Ofis Katı (DÖF: Kalıp Eğikliği)", floorNumber: 6, areaType: "FLOOR", status: "IN_PROGRESS", progressRate: 65 },
      { id: "zb-5", name: "5. Kat - Ofis Katı", floorNumber: 5, areaType: "FLOOR", status: "COMPLETED", progressRate: 100 },
      { id: "zb-1", name: "Zemin Kat - Ticari Mağazalar", floorNumber: 0, areaType: "COMMON_AREA", status: "COMPLETED", progressRate: 100 },
      { id: "zb-b1", name: "Bodrum -1 - Mekanik Oda", floorNumber: -1, areaType: "SHAFT", status: "COMPLETED", progressRate: 100 },
    ],
  },
  {
    id: "blk-3",
    projectId: "prj-vadi",
    projectName: "Vadi Kuleleri & Yaşam Merkezi",
    name: "C Blok - Sosyal Tesis & Spa",
    code: "BLK-C",
    totalFloors: 4,
    basementFloors: 1,
    status: "ACTIVE",
    healthStatus: "RED",
    completionRate: 34.2,
    activeWorkers: 18,
    activeMachinery: 1,
    lastMilestone: "Zemin kat tavan kalıbında çökme riski tespit edildi - İSG Durdurdu",
    openDefects: 5,
    isgRiskScore: 82,
    workerBreakdown: {
      kalipci: 6,
      demirci: 4,
      betoncu: 0,
      elektrik: 4,
      isg: 4,
    },
    machineryList: [
      { name: "JCB 3CX Kazıcı Yükleyici", type: "Hafriyat", status: "Motor Stop (Güvenlik Kilit)", batteryOrTelemetry: "Kırmızı Uyarı" },
    ],
    zones: [
      { id: "zc-4", name: "4. Kat - Açık Teras & Restoran", floorNumber: 4, areaType: "COMMON_AREA", status: "NOT_STARTED", progressRate: 0 },
      { id: "zc-2", name: "2. Kat - Fitness & Dinlenme", floorNumber: 2, areaType: "COMMON_AREA", status: "NOT_STARTED", progressRate: 20 },
      { id: "zc-1", name: "1. Kat - Yüzme Havuzu (İSG Mühürlü)", floorNumber: 1, areaType: "COMMON_AREA", status: "IN_PROGRESS", progressRate: 40 },
      { id: "zc-0", name: "Zemin - Resepsiyon & Soyunma Odaları", floorNumber: 0, areaType: "COMMON_AREA", status: "IN_PROGRESS", progressRate: 55 },
      { id: "zc-b1", name: "Bodrum - Su Deposu & Pompa Dairesi", floorNumber: -1, areaType: "COMMON_AREA", status: "COMPLETED", progressRate: 100 },
    ],
  },
  {
    id: "blk-4",
    projectId: "prj-vadi",
    projectName: "Vadi Kuleleri & Yaşam Merkezi",
    name: "D Blok - Villalar & İdari Bina",
    code: "BLK-D",
    totalFloors: 3,
    basementFloors: 1,
    status: "ACTIVE",
    healthStatus: "GREEN",
    completionRate: 92.0,
    activeWorkers: 24,
    activeMachinery: 2,
    lastMilestone: "Çatı çelik konstrüksiyon montajı başarıyla tamamlandı",
    openDefects: 0,
    isgRiskScore: 5,
    workerBreakdown: {
      kalipci: 4,
      demirci: 4,
      betoncu: 2,
      elektrik: 10,
      isg: 4,
    },
    machineryList: [
      { name: "Hiab 166 Kamyon Üstü Vinç", type: "Mobil Vinç", status: "Malzeme Boşaltıyor", batteryOrTelemetry: "Online" },
    ],
    zones: [
      { id: "zd-3", name: "3. Kat - Çatı Katı & İdari Ofisler", floorNumber: 3, areaType: "FLOOR", status: "IN_PROGRESS", progressRate: 85 },
      { id: "zd-2", name: "2. Kat - Yönetim Katı", floorNumber: 2, areaType: "FLOOR", status: "COMPLETED", progressRate: 100 },
      { id: "zd-1", name: "1. Kat - Toplantı Odaları", floorNumber: 1, areaType: "FLOOR", status: "COMPLETED", progressRate: 100 },
      { id: "zd-0", name: "Zemin Kat - Giriş & Karşılama", floorNumber: 0, areaType: "COMMON_AREA", status: "COMPLETED", progressRate: 100 },
    ],
  },
]

export default function ProjectMasterDashboardPage() {
  const [blocks, setBlocks] = useState<BlockItem[]>(DEFAULT_BLOCKS)
  const [selectedBlock, setSelectedBlock] = useState<BlockItem | null>(null)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [activeFilter, setActiveFilter] = useState<"ALL" | "GREEN" | "YELLOW" | "RED">("ALL")
  const [viewMode, setViewMode] = useState<"ISOMETRIC" | "HEATMAP">("ISOMETRIC")
  const [selectedProject, setSelectedProject] = useState("prj-vadi")
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    fetchBlocksData()
  }, [])

  const fetchBlocksData = async () => {
    setIsLoading(true)
    try {
      const res = await fetch("/api/admin/blocks")
      if (res.ok) {
        const data = await res.json()
        if (data.blocks && data.blocks.length > 0) {
          // Merge API data with simulation defaults
          const merged = data.blocks.map((b: any, idx: number) => {
            const fallback = DEFAULT_BLOCKS[idx % DEFAULT_BLOCKS.length]
            return {
              ...fallback,
              ...b,
              zones: b.zones && b.zones.length > 0 ? b.zones : fallback.zones,
            }
          })
          setBlocks(merged)
        }
      }
    } catch (e) {
      // Use rich default simulation
    } finally {
      setIsLoading(false)
    }
  }

  const handleOpenXRay = (block: BlockItem) => {
    setSelectedBlock(block)
    setIsDrawerOpen(true)
  }

  const handleStatusChangeSimulation = (blockId: string, newHealth: "GREEN" | "YELLOW" | "RED") => {
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
    toast.success(`Blok durumu ${newHealth} olarak güncellendi.`)
  }

  const filteredBlocks = blocks.filter((b) => {
    if (activeFilter === "ALL") return true
    return b.healthStatus === activeFilter
  })

  // Quick stats calculation
  const totalBlocks = blocks.length
  const avgProgress = Math.round(
    blocks.reduce((acc, curr) => acc + (curr.completionRate || 0), 0) / (totalBlocks || 1)
  )
  const totalWorkers = blocks.reduce((acc, curr) => acc + (curr.activeWorkers || 0), 0)
  const totalMachinery = blocks.reduce((acc, curr) => acc + (curr.activeMachinery || 0), 0)
  const redAlertCount = blocks.filter((b) => b.healthStatus === "RED").length
  const yellowAlertCount = blocks.filter((b) => b.healthStatus === "YELLOW").length

  return (
    <div className="min-h-screen text-slate-100 pb-20 relative">
      {/* Top Banner & Control Center Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Canlı Telemetri & IoT
            </span>
            <span className="text-xs text-slate-400 font-mono">
              NEXA MASTER DISPATCHER v4.2
            </span>
          </div>
          <h1 className="text-2xl lg:text-3xl font-extrabold text-white tracking-tight mt-1">
            Proje Kontrol Merkezi (Master Dashboard)
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            WebGL motoru yüklemeden 2.5D izometrik derinlik ve renk kodlu Isı Haritası (Heatmap) ile tüm blokları yönetin.
          </p>
        </div>

        {/* Action Buttons & Project Switcher */}
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={selectedProject}
            onChange={(e) => setSelectedProject(e.target.value)}
            className="px-4 py-2 bg-slate-900 border border-slate-700 rounded-xl text-sm font-semibold text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="prj-vadi">Vadi Kuleleri & Yaşam Projesi</option>
            <option value="prj-plaza">Nexa Finans Plaza</option>
            <option value="prj-metro">Metro Şantiyesi Hat 4</option>
          </select>

          {/* View Mode Toggle */}
          <div className="bg-slate-900 p-1 rounded-xl border border-slate-800 flex items-center">
            <button
              onClick={() => setViewMode("ISOMETRIC")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                viewMode === "ISOMETRIC"
                  ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
                  : "text-slate-400 hover:text-white"
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
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>Isı Haritası</span>
            </button>
          </div>

          <button
            onClick={fetchBlocksData}
            disabled={isLoading}
            className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
            title="Yenile"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin text-blue-400" : ""}`} />
          </button>
        </div>
      </div>

      {/* KPI METRIC BAR */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-8">
        <div className="bg-slate-900/80 rounded-2xl p-4 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Toplam Blok</span>
            <Building2 className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-black text-white">{totalBlocks} <span className="text-xs font-normal text-slate-500">Kule/Yapı</span></div>
          <div className="text-[11px] text-blue-400 font-medium mt-1">Multi-Block Hiyerarşi</div>
        </div>

        <div className="bg-slate-900/80 rounded-2xl p-4 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Genel İlerleme</span>
            <Compass className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-black text-white">%{avgProgress}</div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-500 to-emerald-400 h-full rounded-full" style={{ width: `${avgProgress}%` }} />
          </div>
        </div>

        <div className="bg-slate-900/80 rounded-2xl p-4 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Aktif İşçi (Turnike/GPS)</span>
            <HardHat className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-white">{totalWorkers} <span className="text-xs font-normal text-slate-500">Personel</span></div>
          <div className="text-[11px] text-emerald-400 font-medium mt-1 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
            Canlı Biyometrik Onaylı
          </div>
        </div>

        <div className="bg-slate-900/80 rounded-2xl p-4 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>İş Makineleri (BLE)</span>
            <Truck className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-black text-white">{totalMachinery} <span className="text-xs font-normal text-slate-500">Araç</span></div>
          <div className="text-[11px] text-purple-400 font-medium mt-1">Vinç, Pompa & Kepçe</div>
        </div>

        <div className="col-span-2 md:col-span-1 bg-slate-900/80 rounded-2xl p-4 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Riskli Bloklar</span>
            <ShieldAlert className="w-4 h-4 text-rose-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-rose-400">{redAlertCount}</span>
            <span className="text-xs text-rose-400/80 font-bold">Kritik</span>
            <span className="text-slate-600">/</span>
            <span className="text-lg font-bold text-amber-400">{yellowAlertCount}</span>
            <span className="text-xs text-amber-400/80 font-bold">Risk</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">İSG & İmalat Durumu</div>
        </div>
      </div>

      {/* FILTER BUTTONS & HEATMAP LEGEND */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6 bg-slate-900/50 p-3 rounded-2xl border border-slate-800">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Durum Filtresi:</span>
          
          <button
            onClick={() => setActiveFilter("ALL")}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
              activeFilter === "ALL"
                ? "bg-blue-600 text-white"
                : "bg-slate-800 text-slate-400 hover:text-white"
            }`}
          >
            Tümü ({blocks.length})
          </button>

          <button
            onClick={() => setActiveFilter("GREEN")}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeFilter === "GREEN"
                ? "bg-emerald-600 text-white"
                : "bg-emerald-950/40 text-emerald-400 border border-emerald-800/40 hover:bg-emerald-900/50"
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            Planında ({blocks.filter((b) => b.healthStatus === "GREEN").length})
          </button>

          <button
            onClick={() => setActiveFilter("YELLOW")}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeFilter === "YELLOW"
                ? "bg-amber-600 text-white"
                : "bg-amber-950/40 text-amber-400 border border-amber-800/40 hover:bg-amber-900/50"
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            Gecikme / Risk ({blocks.filter((b) => b.healthStatus === "YELLOW").length})
          </button>

          <button
            onClick={() => setActiveFilter("RED")}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeFilter === "RED"
                ? "bg-rose-600 text-white"
                : "bg-rose-950/40 text-rose-400 border border-rose-800/40 hover:bg-rose-900/50"
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-rose-400" />
            Kritik / Durdu ({blocks.filter((b) => b.healthStatus === "RED").length})
          </button>
        </div>

        {/* Heatmap Legend */}
        <div className="flex items-center gap-4 text-xs font-medium text-slate-400">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-emerald-500 shadow-sm shadow-emerald-500/50" />
            <span>%80+ / Takvimde</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-amber-500 shadow-sm shadow-amber-500/50" />
            <span>Risk / DÖF</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-rose-600 shadow-sm shadow-rose-600/50" />
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
              ? "border-rose-500/60 shadow-xl shadow-rose-900/20 ring-1 ring-rose-500/40"
              : isYellow
              ? "border-amber-500/60 shadow-xl shadow-amber-900/20 ring-1 ring-amber-500/40"
              : "border-emerald-500/40 shadow-xl shadow-emerald-900/10 hover:border-emerald-500/70"

            const badgeBg = isRed
              ? "bg-rose-500/20 text-rose-300 border-rose-500/40"
              : isYellow
              ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
              : "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"

            return (
              <div
                key={block.id}
                onClick={() => handleOpenXRay(block)}
                className={`bg-slate-900 rounded-3xl p-5 border-2 transition-all cursor-pointer hover:-translate-y-1 relative group flex flex-col justify-between overflow-hidden ${statusBorder}`}
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
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-black tracking-wider uppercase bg-slate-800 text-slate-300 border border-slate-700">
                          {block.code}
                        </span>
                        <span className="text-xs text-slate-400">
                          {block.totalFloors} Kat ({block.basementFloors} Bodrum)
                        </span>
                      </div>
                      <h3 className="text-lg font-bold text-white mt-1 group-hover:text-blue-400 transition-colors">
                        {block.name}
                      </h3>
                    </div>

                    <span
                      className={`px-2.5 py-1 rounded-full text-[11px] font-black border uppercase tracking-wider flex items-center gap-1 ${badgeBg}`}
                    >
                      <span
                        className={`w-2 h-2 rounded-full ${
                          isRed
                            ? "bg-rose-400 animate-ping"
                            : isYellow
                            ? "bg-amber-400"
                            : "bg-emerald-400"
                        }`}
                      />
                      {isRed ? "Kritik" : isYellow ? "Risk" : "Planında"}
                    </span>
                  </div>

                  {/* 2.5D ISOMETRIC VISUAL TOWER (CSS Slices) */}
                  <div className="my-4 py-4 px-3 bg-slate-950/60 rounded-2xl border border-slate-800/80 flex items-center justify-center relative overflow-hidden">
                    <div className="w-full flex flex-col items-center">
                      {/* Isometric Floor Slices Stack */}
                      <div className="w-36 flex flex-col gap-1 py-1">
                        {[...Array(6)].map((_, i) => {
                          const floorIndex = 5 - i
                          const isFloorCompleted =
                            floorIndex <= Math.floor((block.completionRate / 100) * 6)
                          const isFloorActive =
                            floorIndex === Math.floor((block.completionRate / 100) * 6) + 1

                          const sliceColor = isRed
                            ? isFloorCompleted
                              ? "bg-rose-900/60 border-rose-500/50"
                              : isFloorActive
                              ? "bg-rose-500/40 border-rose-400 animate-pulse"
                              : "bg-slate-800/40 border-slate-700/50"
                            : isYellow
                            ? isFloorCompleted
                              ? "bg-amber-900/60 border-amber-500/50"
                              : isFloorActive
                              ? "bg-amber-500/40 border-amber-400 animate-pulse"
                              : "bg-slate-800/40 border-slate-700/50"
                            : isFloorCompleted
                            ? "bg-emerald-900/60 border-emerald-500/50"
                            : isFloorActive
                            ? "bg-emerald-500/40 border-emerald-400 animate-pulse"
                            : "bg-slate-800/40 border-slate-700/50"

                          return (
                            <div
                              key={i}
                              style={{
                                transform: "perspective(300px) rotateX(25deg)",
                                height: "13px",
                              }}
                              className={`rounded-md border shadow-sm transition-all flex items-center justify-between px-2 ${sliceColor}`}
                            >
                              <span className="text-[8px] font-mono font-bold text-slate-300">
                                {floorIndex === 5 ? "Çatı" : floorIndex === 0 ? "Zemin" : `K-${floorIndex}`}
                              </span>
                              {isFloorActive && (
                                <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                              )}
                            </div>
                          )
                        })}
                      </div>

                      <div className="text-[10px] text-slate-400 font-mono mt-1">
                        2.5D İzometrik Katman Dilimleri
                      </div>
                    </div>
                  </div>

                  {/* Progress Bar & Percentage */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between text-xs mb-1.5 font-bold">
                      <span className="text-slate-400">İlerleme Oranı</span>
                      <span className="text-white">%{block.completionRate}</span>
                    </div>
                    <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
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
                  <div className="p-3 rounded-xl bg-slate-950/40 border border-slate-800 mb-4 text-xs">
                    <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider mb-1 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-cyan-400" />
                      Son Kritik İmalat
                    </div>
                    <p className="text-slate-300 font-medium line-clamp-2 leading-relaxed">
                      {block.lastMilestone}
                    </p>
                  </div>

                  {/* Field Telemetry Quick Chips */}
                  <div className="grid grid-cols-2 gap-2 text-xs mb-2">
                    <div className="p-2 rounded-xl bg-slate-800/60 border border-slate-700/60 flex items-center gap-2">
                      <HardHat className="w-4 h-4 text-amber-400 flex-shrink-0" />
                      <div>
                        <div className="font-bold text-white">{block.activeWorkers} İşçi</div>
                        <div className="text-[10px] text-slate-400">Turnike/GPS</div>
                      </div>
                    </div>

                    <div className="p-2 rounded-xl bg-slate-800/60 border border-slate-700/60 flex items-center gap-2">
                      <Truck className="w-4 h-4 text-purple-400 flex-shrink-0" />
                      <div>
                        <div className="font-bold text-white">{block.activeMachinery} Araç</div>
                        <div className="text-[10px] text-slate-400">BLE IoT Tag</div>
                      </div>
                    </div>
                  </div>

                  {/* Open Defects / OHS Risk */}
                  <div className="flex items-center justify-between text-xs py-2 px-3 rounded-xl bg-slate-950/30 border border-slate-800/80">
                    <span className="text-slate-400">Açık DÖF:</span>
                    <span
                      className={`font-bold ${
                        block.openDefects > 0 ? "text-amber-400" : "text-emerald-400"
                      }`}
                    >
                      {block.openDefects > 0 ? `${block.openDefects} Uygunsuzluk` : "Sıfır DÖF"}
                    </span>
                  </div>
                </div>

                {/* Card Footer: X-Ray Drawer Trigger */}
                <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                  <span className="text-xs font-bold text-blue-400 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
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
        <div className="bg-slate-900 rounded-3xl p-6 border border-slate-800 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-white">Kat & Blok Isı Haritası Matrisi</h2>
              <p className="text-xs text-slate-400">
                Tüm blokların kat bazında imalat yoğunluğunu ve engellerini tek bakışta analiz edin.
              </p>
            </div>
            <div className="text-xs font-mono text-slate-400">
              Gerçek Zamanlı Saha Girdisi
            </div>
          </div>

          <div className="space-y-4">
            {filteredBlocks.map((block) => (
              <div
                key={block.id}
                onClick={() => handleOpenXRay(block)}
                className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 hover:border-blue-500/50 transition-colors cursor-pointer"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded font-black text-xs bg-slate-800 text-white">
                      {block.code}
                    </span>
                    <h3 className="font-bold text-white text-base">{block.name}</h3>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        block.healthStatus === "RED"
                          ? "bg-rose-500/20 text-rose-300"
                          : block.healthStatus === "YELLOW"
                          ? "bg-amber-500/20 text-amber-300"
                          : "bg-emerald-500/20 text-emerald-300"
                      }`}
                    >
                      {block.healthStatus}
                    </span>
                  </div>

                  <div className="flex items-center gap-4 text-xs">
                    <span className="text-slate-400">
                      Aktif: <strong className="text-white">{block.activeWorkers} İşçi</strong>
                    </span>
                    <span className="text-slate-400">
                      Makine: <strong className="text-white">{block.activeMachinery} Adet</strong>
                    </span>
                    <span className="text-blue-400 font-bold">%{block.completionRate}</span>
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
                      ? "bg-amber-500 text-black border-amber-300"
                      : "bg-slate-800 text-slate-400 border-slate-700"

                    return (
                      <div
                        key={zone.id}
                        className={`p-2 rounded-lg border text-center transition-transform hover:scale-105 ${zoneBg}`}
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
            className="fixed inset-0 bg-black/75 backdrop-blur-sm transition-opacity"
            onClick={() => setIsDrawerOpen(false)}
          />

          {/* Drawer Body */}
          <div className="relative w-full max-w-xl bg-slate-900 border-l border-slate-800 text-slate-100 h-full shadow-2xl flex flex-col z-10 overflow-y-auto">
            {/* Drawer Header */}
            <div className="p-6 border-b border-slate-800 bg-slate-950/80 sticky top-0 z-20 flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-blue-600 text-white">
                    {selectedBlock.code}
                  </span>
                  <span className="text-xs text-slate-400">
                    {selectedBlock.projectName}
                  </span>
                </div>
                <h2 className="text-xl font-black text-white">{selectedBlock.name}</h2>
                <p className="text-xs text-slate-400 mt-1">
                  X-Ray Dijital Şantiye İnceleme ve Telemetri Raporu
                </p>
              </div>

              <button
                onClick={() => setIsDrawerOpen(false)}
                className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Drawer Content */}
            <div className="p-6 space-y-6 flex-1">
              {/* Quick Health Status Changer for simulation */}
              <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-slate-300">Blok Sağlık Durumu (Heatmap)</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">Risk seviyesini manuel simüle et</div>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleStatusChangeSimulation(selectedBlock.id, "GREEN")}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                      selectedBlock.healthStatus === "GREEN"
                        ? "bg-emerald-600 text-white"
                        : "bg-slate-800 text-slate-400"
                    }`}
                  >
                    🟢 Planında
                  </button>
                  <button
                    onClick={() => handleStatusChangeSimulation(selectedBlock.id, "YELLOW")}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                      selectedBlock.healthStatus === "YELLOW"
                        ? "bg-amber-600 text-white"
                        : "bg-slate-800 text-slate-400"
                    }`}
                  >
                    🟡 Risk
                  </button>
                  <button
                    onClick={() => handleStatusChangeSimulation(selectedBlock.id, "RED")}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                      selectedBlock.healthStatus === "RED"
                        ? "bg-rose-600 text-white"
                        : "bg-slate-800 text-slate-400"
                    }`}
                  >
                    🔴 Kritik
                  </button>
                </div>
              </div>

              {/* 1. CANLI TURNİKE & GPS İŞÇİ TELEMETRİSİ */}
              <div className="bg-slate-950/60 rounded-2xl p-5 border border-slate-800">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400">
                      <HardHat className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-bold text-white text-sm">Canlı İşçi Sayısı (Turnike & GPS)</h4>
                      <p className="text-[11px] text-slate-400">Sahada kayıtlı anlık personel</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xl font-black text-amber-400">
                      {selectedBlock.activeWorkers}
                    </span>
                    <span className="text-xs text-slate-500 ml-1">Kişi</span>
                  </div>
                </div>

                {selectedBlock.workerBreakdown && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-3 pt-3 border-t border-slate-800/80">
                    <div className="p-2 bg-slate-900 rounded-xl text-xs">
                      <span className="text-slate-400">Kalıpçı Ekibi:</span>
                      <div className="font-bold text-white">{selectedBlock.workerBreakdown.kalipci} Personel</div>
                    </div>
                    <div className="p-2 bg-slate-900 rounded-xl text-xs">
                      <span className="text-slate-400">Demirci Ekibi:</span>
                      <div className="font-bold text-white">{selectedBlock.workerBreakdown.demirci} Personel</div>
                    </div>
                    <div className="p-2 bg-slate-900 rounded-xl text-xs">
                      <span className="text-slate-400">Beton Ekibi:</span>
                      <div className="font-bold text-white">{selectedBlock.workerBreakdown.betoncu} Personel</div>
                    </div>
                    <div className="p-2 bg-slate-900 rounded-xl text-xs">
                      <span className="text-slate-400">Mekanik/Elektrik:</span>
                      <div className="font-bold text-white">{selectedBlock.workerBreakdown.elektrik} Personel</div>
                    </div>
                    <div className="p-2 bg-slate-900 rounded-xl text-xs">
                      <span className="text-slate-400">İSG & Saha Şefi:</span>
                      <div className="font-bold text-emerald-400">{selectedBlock.workerBreakdown.isg} Personel</div>
                    </div>
                  </div>
                )}
              </div>

              {/* 2. SON TAMAMLANAN KRİTİK İMALAT */}
              <div className="bg-slate-950/60 rounded-2xl p-5 border border-slate-800">
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-sm">Son Tamamlanan Kritik İmalat (Milestone)</h4>
                    <p className="text-[11px] text-slate-400">Yapı denetim ve şantiye şefi onaylı</p>
                  </div>
                </div>

                <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 mt-2">
                  <p className="text-sm font-semibold text-slate-200">
                    {selectedBlock.lastMilestone}
                  </p>
                  <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-2">
                    <span>Onaylayan: <strong>Murat Karaca (Yapı Denetim)</strong></span>
                    <span>•</span>
                    <span>Durum: <strong>Kürleme ve Mukavemet Takibinde</strong></span>
                  </div>
                </div>
              </div>

              {/* 3. SAHADAKİ AKTİF İŞ MAKİNELERİ (BLE IoT) */}
              <div className="bg-slate-950/60 rounded-2xl p-5 border border-slate-800">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400">
                      <Truck className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-bold text-white text-sm">Aktif İş Makineleri (BLE & IoT)</h4>
                      <p className="text-[11px] text-slate-400">Otomatik telemetri ve yük sensörü</p>
                    </div>
                  </div>
                  <span className="text-sm font-bold text-purple-400">
                    {selectedBlock.machineryList?.length || 0} Makine
                  </span>
                </div>

                <div className="space-y-2 mt-2">
                  {selectedBlock.machineryList?.map((m, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between text-xs"
                    >
                      <div>
                        <div className="font-bold text-white">{m.name}</div>
                        <div className="text-[11px] text-slate-400">{m.type} • {m.status}</div>
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-purple-950/60 text-purple-300 border border-purple-800/40">
                        {m.batteryOrTelemetry}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* 4. KAT VE MAHAL BAZINDA DETAYLI İLERLEME */}
              <div className="bg-slate-950/60 rounded-2xl p-5 border border-slate-800">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
                      <Layers className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-bold text-white text-sm">Kat & Mahal İlerleme Çubukları</h4>
                      <p className="text-[11px] text-slate-400">Her katın imalat durumu ve DÖF oranı</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3 mt-2 max-h-64 overflow-y-auto pr-1">
                  {selectedBlock.zones.map((zone) => (
                    <div
                      key={zone.id}
                      className="p-3 bg-slate-900 rounded-xl border border-slate-800/80"
                    >
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="font-bold text-white">{zone.name}</span>
                        <span
                          className={`font-black ${
                            zone.progressRate === 100
                              ? "text-emerald-400"
                              : zone.progressRate > 0
                              ? "text-amber-400"
                              : "text-slate-500"
                          }`}
                        >
                          %{zone.progressRate}
                        </span>
                      </div>
                      <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            zone.progressRate === 100
                              ? "bg-emerald-500"
                              : zone.progressRate > 0
                              ? "bg-amber-500"
                              : "bg-slate-700"
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
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Hızlı Saha Aksiyonları
                </h4>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => toast.success("İş emri oluşturma modülü açıldı")}
                    className="p-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-colors text-center"
                  >
                    + İş Emri Ata
                  </button>
                  <button
                    onClick={() => toast.success("DÖF / Uygunsuzluk bildirim formu açıldı")}
                    className="p-3 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold transition-colors text-center"
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

