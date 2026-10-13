"use client"
/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * BLE Equipment Tracking & Real-Time Site Map Page
 */

import React, { useState, useEffect, useMemo, useCallback } from "react"
import dynamic from "next/dynamic"
import { 
  MapPin, 
  Search, 
  X, 
  Bluetooth, 
  Radio, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  RefreshCw, 
  Layers, 
  ChevronDown, 
  SlidersHorizontal,
  Compass,
  Building2,
  Wrench,
  Sparkles,
  ExternalLink,
  ChevronRight,
  ShieldAlert
} from "lucide-react"
import type { BleEquipment } from "@/components/map/BleEquipmentMap"
import { formatTimeAgo } from "@/components/map/BleEquipmentMap"

// Critical SSR Protection: Dynamic import of Leaflet map with ssr: false
const BleEquipmentMap = dynamic(
  () => import("@/components/map/BleEquipmentMap"),
  {
    ssr: false,
    loading: () => <MapLoadingSkeleton />
  }
)

interface ProjectItem {
  id: string
  title?: string | null
  name?: string | null
  city?: string | null
  district?: string | null
  latitude?: number | null
  longitude?: number | null
  yibfNo?: string | null
  healthScore?: number | null
  progress?: number | null
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
        BLE Gateway sinyalleri ve CartoDB Dark Matter katmanı başlatılıyor...
      </p>
    </div>
  )
}

export default function AdminMapPage() {
  const [projects, setProjects] = useState<ProjectItem[]>([])
  const [selectedProjectId, setSelectedProjectId] = useState<string>("")
  const [equipments, setEquipments] = useState<BleEquipment[]>([])
  const [loadingProjects, setLoadingProjects] = useState(true)
  const [loadingTracking, setLoadingTracking] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<"ALL" | "AKTIF" | "KAYIP">("ALL")
  const [highlightedEquipmentId, setHighlightedEquipmentId] = useState<string | null>(null)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [lastSyncTime, setLastSyncTime] = useState<Date>(new Date())

  // Default coordinates (Turkey center / Istanbul default fallback)
  const defaultCenter: [number, number] = [41.0122, 28.8825] // Vadi Evleri

  // Fetch Projects list
  useEffect(() => {
    let isActive = true
    const fetchProjects = async () => {
      try {
        const res = await fetch("/api/admin/projects")
        if (res.ok && isActive) {
          const data: ProjectItem[] = await res.json()
          setProjects(data)
          // Default to first project with coordinates or project-vadi
          const vadi = data.find(p => p.id === "project-vadi" || p.name?.includes("Vadi") || p.title?.includes("Vadi"))
          if (vadi) {
            setSelectedProjectId(vadi.id)
          } else if (data.length > 0) {
            const firstWithCoords = data.find(p => p.latitude && p.longitude)
            if (firstWithCoords) {
              setSelectedProjectId(firstWithCoords.id)
            } else {
              setSelectedProjectId(data[0].id)
            }
          }
        }
      } catch (err) {
        console.error("Failed to load projects:", err)
      } finally {
        if (isActive) setLoadingProjects(false)
      }
    }

    void fetchProjects()
    return () => { isActive = false }
  }, [])

  // Fetch Tracking data when selected project changes
  const loadTrackingData = useCallback(async (projId: string) => {
    if (!projId) return
    setLoadingTracking(true)
    try {
      const res = await fetch(`/api/admin/tracking?projectId=${encodeURIComponent(projId)}`)
      if (res.ok) {
        const data = await res.json()
        setEquipments(data.equipments || [])
        setLastSyncTime(new Date())
      }
    } catch (err) {
      console.error("Failed to fetch tracking data:", err)
    } finally {
      setLoadingTracking(false)
    }
  }, [])

  useEffect(() => {
    if (selectedProjectId) {
      void loadTrackingData(selectedProjectId)
    }
  }, [selectedProjectId, loadTrackingData])

  // Get currently selected project object
  const selectedProject = useMemo(() => {
    return projects.find(p => p.id === selectedProjectId)
  }, [projects, selectedProjectId])

  // Calculate current map center
  const mapCenter = useMemo<[number, number]>(() => {
    if (selectedProject && selectedProject.latitude && selectedProject.longitude) {
      return [selectedProject.latitude, selectedProject.longitude]
    }
    return defaultCenter
  }, [selectedProject])

  // Filter equipment by status tab and search
  const filteredEquipments = useMemo(() => {
    return equipments.filter(eq => {
      // Status filter
      if (statusFilter !== "ALL") {
        const isLost = eq.status.toUpperCase() === "KAYIP" || eq.status.toUpperCase() === "LOST"
        if (statusFilter === "KAYIP" && !isLost) return false
        if (statusFilter === "AKTIF" && isLost) return false
      }
      return true
    })
  }, [equipments, statusFilter])

  // Stats calculation
  const stats = useMemo(() => {
    const total = equipments.length
    const active = equipments.filter(e => e.status.toUpperCase() !== "KAYIP" && e.status.toUpperCase() !== "LOST").length
    const lost = total - active
    return { total, active, lost }
  }, [equipments])

  // Selected project display name
  const selectedProjectTitle = selectedProject?.title || selectedProject?.name || "Şantiye Sahası"

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
                Canlı İzleme
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Bluetooth etiketli ekipmanların anlık konum ve sinyal telemetrisi
            </p>
          </div>
        </div>

        {/* Project Selector (Şık Açılır Menü) */}
        <div className="flex items-center gap-3">
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
                disabled={loadingProjects}
                className="bg-transparent text-sm font-semibold text-white focus:outline-none cursor-pointer pr-4 appearance-none"
              >
                <option value="" disabled className="bg-slate-900 text-slate-400">
                  Lütfen Proje Seçiniz
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

          {/* Refresh / Sync Button */}
          <button
            onClick={() => loadTrackingData(selectedProjectId)}
            disabled={loadingTracking || !selectedProjectId}
            title="Sinyalleri Yenile"
            className="p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white transition disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loadingTracking ? "animate-spin text-cyan-400" : ""}`} />
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
            <span>Ekipman Listesi ({filteredEquipments.length})</span>
          </button>
        </div>
      </header>

      {/* Main Map Body with Overlays */}
      <div className="relative flex-1 w-full h-full min-h-0">
        {/* Floating Search & Filter Bar (Absolute z-[500] Overlay) */}
        <div className="absolute top-4 left-4 z-[500] w-full max-w-sm flex flex-col gap-2 pointer-events-none">
          <div className="pointer-events-auto bg-slate-900/90 backdrop-blur-md border border-slate-800/90 rounded-2xl p-2.5 shadow-2xl shadow-black/80 flex flex-col gap-2">
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
                  {filteredEquipments.filter(e => 
                    e.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                    e.bleTagId.toLowerCase().includes(searchQuery.toLowerCase())
                  ).length} eşleşme
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Floating Quick Legend / Status Chips (Bottom Left Overlay) */}
        <div className="absolute bottom-5 left-5 z-[500] pointer-events-none hidden sm:flex items-center gap-3">
          <div className="pointer-events-auto bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-xl px-3.5 py-2 shadow-xl flex items-center gap-4 text-xs">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400/80" />
              <span className="text-slate-300 font-medium">Aktif Sinyal</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-red-400 shadow-sm shadow-red-400/80 animate-pulse" />
              <span className="text-slate-300 font-medium">Kayıp / Sinyal Yok</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-md shadow-cyan-400/90 animate-ping" />
              <span className="text-cyan-300 font-medium">Aranan (Neon Parlama)</span>
            </div>
          </div>
        </div>

        {/* Floating Project Geofence Badge (Top Right Overlay) */}
        <div className="absolute top-4 right-4 z-[500] pointer-events-none">
          <div className="pointer-events-auto bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-2xl px-4 py-2.5 shadow-xl flex items-center gap-3 text-xs">
            <div className="w-8 h-8 rounded-lg bg-blue-500/15 border border-blue-500/30 text-blue-400 flex items-center justify-center font-bold">
              <Compass className="w-4 h-4 text-blue-400" />
            </div>
            <div>
              <p className="font-semibold text-white leading-tight">{selectedProjectTitle}</p>
              <p className="text-[11px] text-slate-400 font-mono">
                {mapCenter[0].toFixed(4)}° N, {mapCenter[1].toFixed(4)}° E
              </p>
            </div>
          </div>
        </div>

        {/* Collapsible Equipment List Side Drawer */}
        {isSidebarOpen && (
          <aside className="absolute top-0 right-0 bottom-0 z-[600] w-80 sm:w-96 bg-slate-900/95 backdrop-blur-xl border-l border-slate-800 shadow-2xl flex flex-col transition-all animate-in slide-in-from-right duration-200">
            {/* Drawer Header */}
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Wrench className="w-4 h-4 text-cyan-400" />
                <h3 className="font-bold text-white text-sm">BLE Ekipman Listesi</h3>
                <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
                  {filteredEquipments.length}
                </span>
              </div>
              <button
                onClick={() => setIsSidebarOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Equipment Items List */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2.5 divide-y divide-slate-800/40">
              {filteredEquipments.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-sm">
                  {searchQuery ? "Arama kriterine uygun ekipman bulunamadı." : "Bu şantiyede kayıtlı ekipman yok."}
                </div>
              ) : (
                filteredEquipments.map((eq) => {
                  const isLost = eq.status.toUpperCase() === "KAYIP" || eq.status.toUpperCase() === "LOST"
                  const isHighlighted = eq.id === highlightedEquipmentId

                  return (
                    <div
                      key={eq.id}
                      onClick={() => setHighlightedEquipmentId(eq.id)}
                      className={`p-3 rounded-xl border transition cursor-pointer pt-3 ${
                        isHighlighted
                          ? "bg-cyan-950/40 border-cyan-500/50 shadow-lg shadow-cyan-950/50"
                          : "bg-slate-950/60 hover:bg-slate-800/50 border-slate-800"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-1.5">
                        <div>
                          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                            {eq.category || eq.type}
                          </span>
                          <h4 className="font-semibold text-white text-sm leading-snug">
                            {eq.name}
                          </h4>
                        </div>
                        <span
                          className={`px-2 py-0.5 rounded text-[11px] font-semibold flex items-center gap-1 ${
                            isLost
                              ? "bg-red-500/15 text-red-400 border border-red-500/30"
                              : "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${isLost ? "bg-red-400 animate-pulse" : "bg-emerald-400"}`} />
                          {isLost ? "Kayıp" : "Aktif"}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                        <span className="flex items-center gap-1 text-cyan-300 font-mono">
                          <Bluetooth className="w-3.5 h-3.5 text-cyan-400" />
                          {eq.bleTagId}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-500" />
                          {formatTimeAgo(eq.lastSeenAt)}
                        </span>
                      </div>

                      {eq.assignedTo && (
                        <p className="text-[11px] text-slate-300 mb-2">
                          <span className="text-slate-500">Zimmet:</span> {eq.assignedTo.name}
                        </p>
                      )}

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

            {/* Drawer Footer */}
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
          zoom={16}
          equipments={filteredEquipments}
          highlightedId={highlightedEquipmentId}
          searchQuery={searchQuery}
          onSelectEquipment={(eq) => setHighlightedEquipmentId(eq.id)}
          selectedProjectName={selectedProjectTitle}
        />
      </div>
    </div>
  )
}
