"use client"
/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * BLE Equipment Tracking & Real-Time Site Map (Client Component)
 */

import React, { useState, useMemo, useCallback } from "react"
import dynamic from "next/dynamic"
import { 
  Radio, 
  Search, 
  X, 
  RefreshCw, 
  Building2, 
  Wrench, 
  Sparkles, 
  ExternalLink, 
  ChevronRight, 
  ChevronDown, 
  Info,
  ShieldAlert
} from "lucide-react"
import type { 
  BleEquipment, 
  BleSiteZone, 
  ActiveRadarPersonnel, 
  GeofenceZoneItem 
} from "@/components/map/BleEquipmentMap"
import { formatTimeAgo } from "@/components/map/BleEquipmentMap"

const BleEquipmentMap = dynamic(
  () => import("@/components/map/BleEquipmentMap"),
  {
    ssr: false,
    loading: () => <MapLoadingSkeleton />
  }
)

export interface ProjectItem {
  id: string
  title?: string | null
  name?: string | null
  city?: string | null
  district?: string | null
  latitude?: number | null
  longitude?: number | null
}

function MapLoadingSkeleton() {
  return (
    <div className="w-full h-full min-h-[500px] flex flex-col items-center justify-center bg-slate-950 rounded-xl border border-slate-800 text-slate-400 p-8">
      <div className="relative mb-6">
        <div className="w-16 h-16 rounded-full border-2 border-cyan-500/20 border-t-cyan-400 animate-spin" />
        <div className="absolute inset-0 flex items-center justify-center text-cyan-400">
          <Radio className="w-6 h-6 animate-pulse" />
        </div>
      </div>
      <h3 className="text-lg font-semibold text-white mb-1">Şantiye Haritası Yükleniyor</h3>
      <p className="text-sm text-slate-400 max-w-sm text-center">
        Gerçek Geofence poligonları ve BLE Radar telemetrisi haritaya aktarılıyor...
      </p>
    </div>
  )
}

interface AdminMapClientProps {
  initialProjects: ProjectItem[]
  initialZones: GeofenceZoneItem[]
  initialActiveRadars: ActiveRadarPersonnel[]
  initialEquipments: BleEquipment[]
  defaultCenter: [number, number]
  defaultZoom: number
}

export default function AdminMapClient({
  initialProjects,
  initialZones,
  initialActiveRadars,
  initialEquipments,
  defaultCenter,
  defaultZoom
}: AdminMapClientProps) {
  const [projects] = useState<ProjectItem[]>(initialProjects)
  const [selectedProjectId, setSelectedProjectId] = useState<string>(() => {
    if (initialProjects.length > 0) {
      const withCoords = initialProjects.find((p) => p.latitude && p.longitude)
      return withCoords ? withCoords.id : initialProjects[0].id
    }
    return ""
  })

  const [equipments, setEquipments] = useState<BleEquipment[]>(initialEquipments)
  const [zones, setZones] = useState<GeofenceZoneItem[]>(initialZones)
  const [activeRadars, setActiveRadars] = useState<ActiveRadarPersonnel[]>(initialActiveRadars)

  const [isRefreshing, setIsRefreshing] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<"ALL" | "AKTIF" | "KAYIP">("ALL")
  const [highlightedEquipmentId, setHighlightedEquipmentId] = useState<string | null>(null)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [lastSyncTime, setLastSyncTime] = useState<Date>(new Date())

  // Refresh data from API
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true)
    try {
      const [trackingRes, zonesRes] = await Promise.all([
        fetch(`/api/admin/tracking${selectedProjectId ? `?projectId=${encodeURIComponent(selectedProjectId)}` : ""}`),
        fetch(`/api/admin/site-zones${selectedProjectId ? `?projectId=${encodeURIComponent(selectedProjectId)}` : ""}`)
      ])

      if (trackingRes.ok) {
        const data = await trackingRes.json()
        if (data.equipments) setEquipments(data.equipments)
      }
      if (zonesRes.ok) {
        const zData = await zonesRes.json()
        if (Array.isArray(zData)) {
          setZones(zData.map((z: any) => ({
            id: z.id,
            title: z.title || z.name,
            name: z.name || z.title,
            type: z.zoneType || z.type,
            zoneType: z.zoneType || z.type,
            polygonCoordinates: z.polygonCoordinates,
            supervisor: z.supervisor,
            projectId: z.projectId
          })))
        }
      }
      setLastSyncTime(new Date())
    } catch (err) {
      console.error("Failed to refresh live telemetry:", err)
    } finally {
      setIsRefreshing(false)
    }
  }, [selectedProjectId])

  // Selected project object
  const selectedProject = useMemo(() => {
    return projects.find((p) => p.id === selectedProjectId)
  }, [projects, selectedProjectId])

  // Center calculation (ADIM 3)
  const mapCenter = useMemo<[number, number]>(() => {
    if (selectedProject && selectedProject.latitude && selectedProject.longitude) {
      return [selectedProject.latitude, selectedProject.longitude]
    }
    if (activeRadars.length > 0 && activeRadars[0].lastKnownLat && activeRadars[0].lastKnownLng) {
      return [activeRadars[0].lastKnownLat, activeRadars[0].lastKnownLng]
    }
    return defaultCenter
  }, [selectedProject, activeRadars, defaultCenter])

  // Filter equipments by search and status
  const filteredEquipments = useMemo(() => {
    return equipments.filter((eq) => {
      // If a specific project is selected, show that project's equipment or unassigned
      if (selectedProjectId && eq.projectId && eq.projectId !== selectedProjectId) {
        return false
      }
      if (statusFilter !== "ALL") {
        const isLost = eq.status.toUpperCase() === "KAYIP" || eq.status.toUpperCase() === "LOST"
        if (statusFilter === "KAYIP" && !isLost) return false
        if (statusFilter === "AKTIF" && isLost) return false
      }
      return true
    })
  }, [equipments, selectedProjectId, statusFilter])

  // Stats calculation
  const stats = useMemo(() => {
    const total = filteredEquipments.length
    const active = filteredEquipments.filter(
      (e) => e.status.toUpperCase() !== "KAYIP" && e.status.toUpperCase() !== "LOST"
    ).length
    const lost = total - active
    return { total, active, lost }
  }, [filteredEquipments])

  const selectedProjectTitle = selectedProject?.title || selectedProject?.name || "Şantiye Sahası"

  // Empty state check (ADIM 3)
  const isCompletelyEmpty = zones.length === 0 && activeRadars.length === 0 && equipments.length === 0

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] max-h-[calc(100vh-4rem)] bg-slate-950 text-slate-100 overflow-hidden">
      {/* Top Header Bar / Filter Header */}
      <header className="px-5 py-3.5 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 flex flex-wrap items-center justify-between gap-4 z-20 shrink-0">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-lg shadow-cyan-500/20">
            <Radio className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-white tracking-tight">
                Şantiye Haritası & BLE Radar
              </h1>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                Canlı Telemetri
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Prisma Geofence poligonları ve Bluetooth etiketli personel/ekipman radarı
            </p>
          </div>
        </div>

        {/* Project Selector & Actions */}
        <div className="flex items-center gap-3">
          {projects.length > 0 && (
            <div className="flex items-center gap-2 bg-slate-800/90 border border-slate-700/80 rounded-xl px-3 py-1.5 shadow-sm hover:border-slate-600 transition">
              <Building2 className="w-4 h-4 text-cyan-400 shrink-0" />
              <div className="flex flex-col">
                <label htmlFor="project-select" className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  Aktif Proje / Şantiye
                </label>
                <select
                  id="project-select"
                  value={selectedProjectId}
                  onChange={(e) => {
                    setSelectedProjectId(e.target.value)
                    setHighlightedEquipmentId(null)
                  }}
                  className="bg-transparent text-sm font-semibold text-white focus:outline-none cursor-pointer pr-4 appearance-none"
                >
                  <option value="" className="bg-slate-900 text-slate-400">
                    Tüm Şantiyeler
                  </option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id} className="bg-slate-900 text-white">
                      {p.title || p.name || `Proje #${p.id}`} {p.city ? `(${p.city})` : ""}
                    </option>
                  ))}
                </select>
              </div>
              <ChevronDown className="w-4 h-4 text-slate-400 pointer-events-none" />
            </div>
          )}

          {/* Refresh / Sync Button */}
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            title="Sinyalleri Yenile"
            className="p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white transition disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin text-cyan-400" : ""}`} />
          </button>

          {/* Toggle Equipment List Drawer */}
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition border ${
              isSidebarOpen
                ? "bg-cyan-500/20 border-cyan-500/40 text-cyan-300"
                : "bg-slate-800/80 hover:bg-slate-700 border-slate-700 text-slate-300"
            }`}
          >
            <Wrench className="w-4 h-4" />
            <span>Ekipmanlar ({filteredEquipments.length})</span>
          </button>
        </div>
      </header>

      {/* Main Map Body with Overlays */}
      <div className="relative flex-1 w-full h-full min-h-0">
        {/* Empty State Banner (ADIM 3) */}
        {isCompletelyEmpty && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-40 max-w-lg w-[calc(100%-2rem)]">
            <div className="bg-slate-900/95 backdrop-blur-md border border-amber-500/30 rounded-2xl p-4 shadow-2xl shadow-black/80 flex items-start gap-3">
              <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 shrink-0">
                <Info className="w-5 h-5" />
              </div>
              <div className="flex-1 text-xs">
                <h4 className="font-bold text-white text-sm mb-1">
                  Harita Bilgisi
                </h4>
                <p className="text-slate-300 leading-relaxed">
                  Haritada henüz çizilmiş bir sanal çit (Geofence) veya tespit edilen BLE cihazı bulunmuyor.
                </p>
                <div className="mt-2.5 flex items-center gap-2">
                  <a
                    href="/admin/isg/master-plan"
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-cyan-600/30 hover:bg-cyan-600/50 text-cyan-300 border border-cyan-500/30 font-medium"
                  >
                    <span>Poligon Sanal Çit Çiz</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </a>
                  <a
                    href="/admin/equipments"
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 font-medium"
                  >
                    <span>BLE Etiket Tanımla</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Floating Search & Filter Bar (Absolute z-30 Overlay) */}
        <div className="absolute top-2 left-2 right-2 md:top-4 md:left-4 md:right-auto z-30 w-[calc(100%-16px)] md:w-96 flex flex-col gap-2 pointer-events-none">
          <div className="pointer-events-auto bg-slate-900/95 backdrop-blur-md border border-slate-800/90 rounded-2xl p-2.5 shadow-2xl shadow-black/80 flex flex-col gap-2">
            {/* Search Input */}
            <div className="relative flex items-center">
              <Search className="w-4 h-4 text-cyan-400 absolute left-3 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder='Ekipman veya BLE ID ara ("Hilti", "BLE-HLT")...'
                className="w-full bg-slate-950/80 text-sm text-white placeholder-slate-400 rounded-xl pl-9 pr-8 py-2 border border-slate-800 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 focus:outline-none transition"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Quick Status Filters */}
            <div className="flex items-center gap-1.5 pt-1 border-t border-slate-800/60">
              <button
                onClick={() => setStatusFilter("ALL")}
                className={`flex-1 py-1 px-2 rounded-lg text-xs font-medium transition ${
                  statusFilter === "ALL"
                    ? "bg-slate-800 text-white font-semibold border border-slate-700"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                Tümü ({stats.total})
              </button>
              <button
                onClick={() => setStatusFilter("AKTIF")}
                className={`flex-1 py-1 px-2 rounded-lg text-xs font-medium transition flex items-center justify-center gap-1 ${
                  statusFilter === "AKTIF"
                    ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-semibold"
                    : "text-slate-400 hover:text-emerald-400"
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                Aktif ({stats.active})
              </button>
              <button
                onClick={() => setStatusFilter("KAYIP")}
                className={`flex-1 py-1 px-2 rounded-lg text-xs font-medium transition flex items-center justify-center gap-1 ${
                  statusFilter === "KAYIP"
                    ? "bg-red-500/20 text-red-400 border border-red-500/30 font-semibold"
                    : "text-slate-400 hover:text-red-400"
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
                Kayıp ({stats.lost})
              </button>
            </div>

            {/* Search Match Indicator Message */}
            {searchQuery.trim() && (
              <div className="px-2 py-1 rounded-lg bg-cyan-950/60 border border-cyan-800/50 flex items-center justify-between text-xs text-cyan-300">
                <span className="flex items-center gap-1.5 font-medium">
                  <Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-spin" />
                  Neon odak modu devrede
                </span>
                <span className="font-mono text-[11px] bg-cyan-900/50 px-1.5 py-0.5 rounded">
                  {filteredEquipments.filter((e) => 
                    e.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                    e.bleTagId.toLowerCase().includes(searchQuery.toLowerCase())
                  ).length} eşleşme
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Floating Quick Legend / Status Chips (Bottom Left Overlay) */}
        <div className="absolute bottom-2.5 left-2 right-2 sm:right-auto sm:left-5 sm:bottom-5 z-30 pointer-events-none flex items-center">
          <div className="pointer-events-auto bg-slate-900/95 backdrop-blur-md border border-slate-800 rounded-xl px-3 py-1.5 sm:px-3.5 sm:py-2 shadow-xl flex flex-wrap items-center gap-2.5 sm:gap-4 text-xs">
            <div className="flex items-center gap-1.5 whitespace-nowrap">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400/80" />
              <span className="text-slate-300 font-medium text-xs">Aktif Telemetri</span>
            </div>
            <div className="flex items-center gap-1.5 whitespace-nowrap">
              <span className="w-2.5 h-2.5 rounded-full bg-red-400 shadow-sm shadow-red-400/80 animate-pulse" />
              <span className="text-slate-300 font-medium text-xs">Kayıp / Uyarı</span>
            </div>
            <div className="flex items-center gap-1.5 whitespace-nowrap">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
              <span className="text-slate-300 font-medium text-xs">Geofence Sınırı</span>
            </div>
            <div className="flex items-center gap-1.5 whitespace-nowrap">
              <span className="text-xs">👷</span>
              <span className="text-slate-300 font-medium text-xs">Personel ({activeRadars.length})</span>
            </div>
          </div>
        </div>

        {/* Right Drawer: Equipments List */}
        {isSidebarOpen && (
          <aside className="absolute top-0 right-0 bottom-0 w-80 md:w-96 bg-slate-900/95 backdrop-blur-xl border-l border-slate-800 shadow-2xl z-40 flex flex-col">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-white text-sm">Demirbaş ve BLE Listesi</h3>
                <p className="text-xs text-slate-400">
                  {filteredEquipments.length} demirbaş listeleniyor
                </p>
              </div>
              <button
                onClick={() => setIsSidebarOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-2.5 divide-y divide-slate-800/40">
              {filteredEquipments.length === 0 ? (
                <div className="text-center py-12 text-slate-500 text-xs">
                  {searchQuery ? "Arama kriterine uygun ekipman bulunamadı." : "Kayıtlı demirbaş bulunmuyor."}
                </div>
              ) : (
                filteredEquipments.map((eq) => {
                  const isLost = eq.status === "KAYIP"
                  const isHighlighted = highlightedEquipmentId === eq.id
                  return (
                    <div
                      key={eq.id}
                      onClick={() => setHighlightedEquipmentId(eq.id)}
                      className={`p-3 rounded-xl border transition cursor-pointer pt-3 ${
                        isHighlighted
                          ? "bg-cyan-950/40 border-cyan-500/60 shadow-lg shadow-cyan-950/50"
                          : "bg-slate-950/50 border-slate-800/80 hover:border-slate-700"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h4 className="font-semibold text-white text-xs truncate">{eq.name}</h4>
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            isLost
                              ? "bg-red-500/20 text-red-400 border border-red-500/30"
                              : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                          }`}
                        >
                          {isLost ? "Kayıp" : "Aktif"}
                        </span>
                      </div>

                      <div className="text-[11px] text-slate-400 mb-2 font-mono">
                        Tag: <span className="text-cyan-300 font-semibold">{eq.bleTagId}</span>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-slate-800/60 text-xs">
                        <span className="font-mono text-[11px] text-slate-500">
                          {eq.latitude.toFixed(4)}, {eq.longitude.toFixed(4)}
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            setHighlightedEquipmentId(eq.id)
                          }}
                          className="text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-0.5"
                        >
                          Haritada Odaklan <ChevronRight className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  )
                })
              )}
            </div>

            <div className="p-3 bg-slate-950/80 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
              <span>Son Tarama: {formatTimeAgo(lastSyncTime.toISOString())}</span>
              <a
                href="/admin/equipments"
                className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-medium"
              >
                Tüm Demirbaşlar <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </aside>
        )}

        {/* Leaflet Dark Matter Map Container */}
        <BleEquipmentMap
          center={mapCenter}
          zoom={defaultZoom}
          equipments={filteredEquipments}
          zones={zones}
          activeRadars={activeRadars}
          highlightedId={highlightedEquipmentId}
          searchQuery={searchQuery}
          onSelectEquipment={(eq) => setHighlightedEquipmentId(eq.id)}
          selectedProjectName={selectedProjectTitle}
        />
      </div>
    </div>
  )
}
