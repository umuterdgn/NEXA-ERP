"use client"
/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Nexa ERP - BLE Equipment Tracking & Real-Time GIS Site Map (Client Component)
 */

import React, { useState, useMemo, useCallback, useEffect } from "react"
import dynamic from "next/dynamic"
import { 
  Radio, 
  Search, 
  X, 
  RefreshCw, 
  Building2, 
  Wrench, 
  ExternalLink, 
  ChevronRight, 
  ChevronDown, 
  Info,
  Layers,
  Pencil,
  Spline,
  Check,
  Undo
} from "lucide-react"
import { toast } from "react-hot-toast"
import type { 
  BleEquipment, 
  BleSiteZone, 
  ActiveRadarPersonnel, 
  GeofenceZoneItem 
} from "@/components/map/BleEquipmentMap"
import { formatTimeAgo } from "@/components/map/BleEquipmentMap"
import NewDiscoveryModal from "@/components/discovery/NewDiscoveryModal"

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
  progress?: number
  healthScore?: number
  activeWorkers?: number
  totalBlocks?: number
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
        Gerçek Geofence poligonları, Polyline yatay hatları ve BLE Radar telemetrisi aktarılıyor...
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
  // ADIM 4: Başlangıçta tüm Türkiye genel haritasını göstermek için selectedProjectId boş başlar
  const [selectedProjectId, setSelectedProjectId] = useState<string>("")
  const [mapCenter, setMapCenter] = useState<[number, number]>(defaultCenter)
  const [mapZoom, setMapZoom] = useState<number>(defaultZoom)

  const [equipments, setEquipments] = useState<BleEquipment[]>(initialEquipments)
  const [zones, setZones] = useState<GeofenceZoneItem[]>(initialZones)
  const [activeRadars, setActiveRadars] = useState<ActiveRadarPersonnel[]>(initialActiveRadars)

  const [isRefreshing, setIsRefreshing] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<"ALL" | "AKTIF" | "KAYIP">("ALL")
  const [highlightedEquipmentId, setHighlightedEquipmentId] = useState<string | null>(null)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [lastSyncTime, setLastSyncTime] = useState<Date>(new Date())

  // Drawing tool states (ADIM 2: Poligon ve Yatay Proje Polyline Çizimi)
  const [isDrawing, setIsDrawing] = useState(false)
  const [drawShape, setDrawShape] = useState<"POLYGON" | "POLYLINE">("POLYGON")
  const [drawZoneType, setDrawZoneType] = useState<"MAIN_SITE" | "DANGER_ZONE" | "REST_AREA">("MAIN_SITE")
  const [drawingPoints, setDrawingPoints] = useState<{ lat: number; lng: number }[]>([])
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false)
  const [saveForm, setSaveForm] = useState({ title: "", supervisor: "" })

  // ADIM 4: Cleanup function to avoid memory leak / sidebar freezing when leaving page
  useEffect(() => {
    return () => {
      // Clear drawing or ongoing telemetry
      setIsDrawing(false)
      setDrawingPoints([])
    }
  }, [])

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

  // Handle Project Selection & flyTo animation (ADIM 4)
  const handleSelectProject = useCallback((project: ProjectItem) => {
    setSelectedProjectId(project.id)
    if (project.latitude && project.longitude) {
      setMapCenter([project.latitude, project.longitude])
      setMapZoom(17)
    }
  }, [])

  // Handle Save Drawing (Poligon veya Polyline)
  const handleSaveDrawing = async () => {
    if (!saveForm.title.trim()) {
      toast.error("Lütfen alan veya hat adını girin")
      return
    }
    const minPoints = drawShape === "POLYLINE" ? 2 : 3
    if (drawingPoints.length < minPoints) {
      toast.error(drawShape === "POLYLINE" ? "Çizgi (Polyline) için en az 2 nokta gereklidir" : "Poligon için en az 3 köşe noktası gereklidir")
      return
    }

    const targetProjId = selectedProjectId || (projects[0]?.id)
    if (!targetProjId) {
      toast.error("Lütfen bir şantiye projesi seçin")
      return
    }

    try {
      const finalType = drawShape === "POLYLINE" ? "POLYLINE" : drawZoneType
      const res = await fetch("/api/admin/geofences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: targetProjId,
          name: saveForm.title,
          title: saveForm.title,
          type: finalType,
          zoneType: finalType,
          coordinates: drawingPoints,
          supervisor: saveForm.supervisor || undefined
        })
      })

      if (res.ok) {
        const created = await res.json()
        setZones(prev => [
          ...prev,
          {
            id: created.id,
            title: saveForm.title,
            name: saveForm.title,
            type: finalType,
            zoneType: finalType,
            polygonCoordinates: drawingPoints,
            supervisor: saveForm.supervisor,
            projectId: targetProjId
          }
        ])
        toast.success(`"${saveForm.title}" başarıyla haritaya eklendi!`)
        setIsDrawing(false)
        setDrawingPoints([])
        setIsSaveModalOpen(false)
        setSaveForm({ title: "", supervisor: "" })
      } else {
        toast.error("Alan kaydedilirken bir hata oluştu")
      }
    } catch (e) {
      console.error("Save drawing error:", e)
      toast.error("Bağlantı hatası")
    }
  }

  // Handle Delete Zone
  const handleDeleteZone = async (zoneId: string) => {
    try {
      const res = await fetch(`/api/admin/geofences/${zoneId}`, { method: "DELETE" })
      if (res.ok) {
        setZones(prev => prev.filter(z => z.id !== zoneId))
        toast.success("Alan haritadan silindi")
      }
    } catch (e) {
      console.error("Delete zone error:", e)
      toast.error("Alan silinemedi")
    }
  }

  // Filter equipments by search and status
  const filteredEquipments = useMemo(() => {
    return equipments.filter((eq) => {
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

  const selectedProjectTitle = selectedProject?.title || selectedProject?.name || "Tüm Şantiyeler (Türkiye)"

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] max-h-[calc(100vh-4rem)] bg-slate-950 text-slate-100 overflow-hidden">
      {/* Top Header Bar / Filter Header */}
      <header className="px-5 py-3 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 flex flex-wrap items-center justify-between gap-4 z-20 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-lg shadow-cyan-500/20 shrink-0">
            <Radio className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-white tracking-tight">
                Şantiye Haritası & GIS Radarı
              </h1>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                iOS Radar
              </span>
            </div>
            <p className="text-xs text-slate-400">
              İç içe poligonlar, yatay hatlar (Polyline) ve iş emri entegrasyonu
            </p>
          </div>
        </div>

        {/* Project Selector, Drawing Controls & Actions */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Project Selector */}
          {projects.length > 0 && (
            <div className="flex items-center gap-2 bg-slate-800/90 border border-slate-700/80 rounded-xl px-3 py-1.5 shadow-sm hover:border-slate-600 transition">
              <Building2 className="w-4 h-4 text-cyan-400 shrink-0" />
              <div className="flex flex-col">
                <label htmlFor="project-select" className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  Aktif Şantiye
                </label>
                <select
                  id="project-select"
                  value={selectedProjectId}
                  onChange={(e) => {
                    const id = e.target.value
                    setSelectedProjectId(id)
                    setHighlightedEquipmentId(null)
                    const found = projects.find(p => p.id === id)
                    if (found && found.latitude && found.longitude) {
                      setMapCenter([found.latitude, found.longitude])
                      setMapZoom(17)
                    } else {
                      setMapCenter(defaultCenter)
                      setMapZoom(5)
                    }
                  }}
                  className="bg-transparent text-sm font-semibold text-white focus:outline-none cursor-pointer pr-4 appearance-none"
                >
                  <option value="" className="bg-slate-900 text-slate-300">
                    🌍 Tüm Şantiyeler (Türkiye Geneli)
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

          {/* ADIM 2: Çizim Araçları (Poligon & Polyline) */}
          {!isDrawing ? (
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => {
                  setIsDrawing(true)
                  setDrawShape("POLYGON")
                  setDrawingPoints([])
                  toast("Poligon çizim modu devrede! Haritaya tıklayarak köşe noktaları belirleyin.")
                }}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 transition shadow-sm"
                title="İç içe poligon veya sanal çit çiz"
              >
                <Pencil className="w-3.5 h-3.5 text-blue-400" />
                <span>Poligon Çiz</span>
              </button>

              <button
                onClick={() => {
                  setIsDrawing(true)
                  setDrawShape("POLYLINE")
                  setDrawingPoints([])
                  toast("Yatay hat (Polyline) çizim modu devrede! Otoyol, boru hattı veya tünel güzergahı çizin.")
                }}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border border-amber-500/30 transition shadow-sm"
                title="Boru hattı / Otoyol / Tünel çiz"
              >
                <Spline className="w-3.5 h-3.5 text-amber-400" />
                <span>Çizgi / Hat (Polyline)</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 bg-slate-800/95 border border-cyan-500/40 rounded-xl p-1.5 text-xs">
              <span className="text-cyan-400 font-bold px-1.5 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                {drawShape === "POLYGON" ? "Poligon" : "Polyline"} ({drawingPoints.length} nokta)
              </span>

              {/* Geri Al */}
              <button
                onClick={() => setDrawingPoints(prev => prev.slice(0, -1))}
                disabled={drawingPoints.length === 0}
                className="px-2 py-1 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg disabled:opacity-40 flex items-center gap-1 transition"
              >
                <Undo className="w-3 h-3" />
                <span>Geri</span>
              </button>

              {/* Tamamla */}
              <button
                onClick={() => {
                  const minPoints = drawShape === "POLYLINE" ? 2 : 3
                  if (drawingPoints.length < minPoints) {
                    toast.error(drawShape === "POLYLINE" ? "En az 2 nokta işaretleyin" : "Poligon için en az 3 köşe noktası gereklidir")
                    return
                  }
                  setIsSaveModalOpen(true)
                }}
                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg flex items-center gap-1 transition shadow-sm"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Tamamla</span>
              </button>

              {/* İptal */}
              <button
                onClick={() => {
                  setIsDrawing(false)
                  setDrawingPoints([])
                }}
                className="px-2 py-1 bg-red-600/20 hover:bg-red-600/30 border border-red-500/30 text-red-300 rounded-lg transition"
              >
                İptal
              </button>
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
      <div className="relative flex-1 w-full h-full min-h-0 z-0">
        {/* Floating Search & Filter Bar */}
        <div className="absolute top-2 left-2 right-2 md:top-4 md:left-4 md:right-auto z-30 w-[calc(100%-16px)] md:w-96 flex flex-col gap-2 pointer-events-none">
          <div className="pointer-events-auto bg-slate-900/90 backdrop-blur-xl border border-slate-800/90 rounded-2xl p-2.5 shadow-2xl shadow-black/80 flex flex-col gap-2">
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
                    ? "bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/40"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                Aktif ({stats.active})
              </button>
              <button
                onClick={() => setStatusFilter("KAYIP")}
                className={`flex-1 py-1 px-2 rounded-lg text-xs font-medium transition flex items-center justify-center gap-1 ${
                  statusFilter === "KAYIP"
                    ? "bg-red-500/20 text-red-300 font-semibold border border-red-500/40"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
                Kayıp ({stats.lost})
              </button>
            </div>
          </div>
        </div>

        {/* Right Drawer: Equipments Panel */}
        {isSidebarOpen && (
          <aside className="absolute top-0 right-0 bottom-0 z-30 w-80 sm:w-96 bg-slate-900/95 backdrop-blur-xl border-l border-slate-800 flex flex-col shadow-2xl animate-in slide-in-from-right duration-200">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-white text-sm">BLE Cihazlar & Ekipmanlar</h3>
                <p className="text-xs text-slate-400">
                  {selectedProject ? selectedProject.title : "Tüm Şantiyeler"}
                </p>
              </div>
              <button
                onClick={() => setIsSidebarOpen(false)}
                className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
              {filteredEquipments.length === 0 ? (
                <div className="text-center py-12 text-slate-500 text-xs">
                  Aramanıza uygun ekipman bulunamadı.
                </div>
              ) : (
                filteredEquipments.map((eq) => {
                  const isLost = eq.status.toUpperCase() === "KAYIP" || eq.status.toUpperCase() === "LOST"
                  return (
                    <div
                      key={eq.id}
                      onClick={() => setHighlightedEquipmentId(eq.id)}
                      className={`p-3 rounded-xl border transition cursor-pointer ${
                        highlightedEquipmentId === eq.id
                          ? "bg-cyan-500/10 border-cyan-500/50 shadow-md shadow-cyan-500/10"
                          : "bg-slate-800/60 hover:bg-slate-800 border-slate-700/70"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h4 className="font-semibold text-white text-xs leading-snug">{eq.name}</h4>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                          isLost ? "bg-red-500/20 text-red-400" : "bg-emerald-500/20 text-emerald-400"
                        }`}>
                          {isLost ? "Kayıp" : "Aktif"}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono">
                        Tag: <span className="text-cyan-300 font-semibold">{eq.bleTagId}</span>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </aside>
        )}

        {/* Leaflet BleEquipmentMap Container */}
        <BleEquipmentMap
          center={mapCenter}
          zoom={mapZoom}
          equipments={filteredEquipments}
          zones={zones}
          activeRadars={activeRadars}
          projects={projects}
          highlightedId={highlightedEquipmentId}
          searchQuery={searchQuery}
          onSelectEquipment={(eq) => setHighlightedEquipmentId(eq.id)}
          onSelectProject={handleSelectProject}
          onDeleteZone={handleDeleteZone}
          selectedProjectName={selectedProjectTitle}
          isDrawing={isDrawing}
          drawShape={drawShape}
          drawZoneType={drawZoneType}
          drawingPoints={drawingPoints}
          onAddDrawingPoint={(pt) => setDrawingPoints(prev => [...prev, pt])}
          onFinishDrawing={() => setIsSaveModalOpen(true)}
        />

        {/* Drawing Save Modal (ADIM 2 & ADIM 5) */}
        {isSaveModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 animate-in zoom-in-95">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Layers className="w-5 h-5 text-cyan-400" />
                  <span>{drawShape === "POLYLINE" ? "Yeni Yatay Hat (Polyline) Kaydet" : "Yeni Sanal Çit (Poligon) Kaydet"}</span>
                </h3>
                <button
                  onClick={() => setIsSaveModalOpen(false)}
                  className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">
                    {drawShape === "POLYLINE" ? "Hat / Güzergah Adı *" : "Alan / Mahal Adı *"}
                  </label>
                  <input
                    type="text"
                    value={saveForm.title}
                    onChange={(e) => setSaveForm({ ...saveForm, title: e.target.value })}
                    placeholder={drawShape === "POLYLINE" ? "Örn: 1. Etap Doğalgaz Boru Hattı, Kuzey Çevre Yolu" : "Örn: A Blok Fore Kazık Alanı, Kule Vinç Çevresi"}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">
                    Sorumlu Saha Mühendisi / Amiri
                  </label>
                  <input
                    type="text"
                    value={saveForm.supervisor}
                    onChange={(e) => setSaveForm({ ...saveForm, supervisor: e.target.value })}
                    placeholder="Örn: Umut Erdoğan (Şantiye Şefi)"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>

                {drawShape === "POLYGON" && (
                  <div>
                    <label className="block text-slate-400 mb-1 font-semibold">İSG Güvenlik Seviyesi</label>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => setDrawZoneType("MAIN_SITE")}
                        className={`py-2 rounded-xl border text-center transition ${drawZoneType === "MAIN_SITE" ? "bg-blue-600/20 border-blue-500 text-blue-300 font-bold" : "bg-slate-800 border-slate-700 text-slate-400"}`}
                      >
                        Ana Şantiye
                      </button>
                      <button
                        type="button"
                        onClick={() => setDrawZoneType("DANGER_ZONE")}
                        className={`py-2 rounded-xl border text-center transition ${drawZoneType === "DANGER_ZONE" ? "bg-red-600/20 border-red-500 text-red-300 font-bold" : "bg-slate-800 border-slate-700 text-slate-400"}`}
                      >
                        Kritik Risk
                      </button>
                      <button
                        type="button"
                        onClick={() => setDrawZoneType("REST_AREA")}
                        className={`py-2 rounded-xl border text-center transition ${drawZoneType === "REST_AREA" ? "bg-emerald-600/20 border-emerald-500 text-emerald-300 font-bold" : "bg-slate-800 border-slate-700 text-slate-400"}`}
                      >
                        Dinlenme
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-2.5 pt-2">
                <button
                  onClick={() => setIsSaveModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
                >
                  Vazgeç
                </button>
                <button
                  onClick={handleSaveDrawing}
                  className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition shadow-lg shadow-blue-600/30"
                >
                  Veritabanına Kaydet
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
