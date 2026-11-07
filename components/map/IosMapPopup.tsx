"use client"
/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Nexa ERP - iOS Frosted Glass Map Popup & GIS Information Overlay
 */

import React, { useState, useEffect } from "react"
import Link from "next/link"
import { 
  X, 
  HardHat, 
  Truck, 
  Package, 
  ShieldAlert, 
  Radio, 
  MapPin, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  User, 
  ExternalLink, 
  ChevronRight, 
  Layers, 
  Activity, 
  Battery, 
  Heart, 
  Calendar,
  Sparkles,
  ClipboardList
} from "lucide-react"

export type IosPopupType = "PROJECT" | "WORKER" | "EQUIPMENT" | "ZONE_POLYGON" | "POLYLINE"

export interface IosProjectData {
  id: string
  title: string
  name?: string
  city?: string | null
  district?: string | null
  activeWorkers?: number
  totalBlocks?: number
  healthScore?: number
  progress?: number
  latitude?: number | null
  longitude?: number | null
}

export interface IosMarkerData {
  id: string
  name: string
  roleType: "ENGINEER" | "DRIVER" | "STORAGE" | "ISG" | "WORKER"
  roleTitle?: string
  department?: string
  status?: string
  bleTagId?: string
  serialNumber?: string
  latitude: number
  longitude: number
  lastSeenAt?: string
  pulse?: number
  battery?: number
  hasHelmet?: boolean
  inDanger?: boolean
  zoneName?: string
  assignedTo?: string
  projectId?: string | null
}

export interface IosZoneData {
  id: string
  title: string
  type: "MAIN_SITE" | "DANGER_ZONE" | "REST_AREA" | "POLYLINE" | string
  projectId?: string
  pointsCount: number
  supervisor?: string
  isPolyline?: boolean
}

interface IosMapPopupProps {
  isOpen: boolean
  onClose: () => void
  type: IosPopupType
  projectData?: IosProjectData | null
  markerData?: IosMarkerData | null
  zoneData?: IosZoneData | null
  onFlyTo?: (coords: [number, number]) => void
  onDeleteZone?: (zoneId: string) => void
}

export default function IosMapPopup({
  isOpen,
  onClose,
  type,
  projectData,
  markerData,
  zoneData,
  onFlyTo,
  onDeleteZone
}: IosMapPopupProps) {
  const [activeTab, setActiveTab] = useState<"summary" | "tasks" | "personnel" | "dof">("summary")
  const [zoneDetails, setZoneDetails] = useState<{
    tasks: any[]
    personnel: any[]
    dofs: any[]
    isLoading: boolean
  }>({
    tasks: [],
    personnel: [],
    dofs: [],
    isLoading: false
  })

  // When a ZONE or POLYLINE is clicked, fetch GIS integrated data
  useEffect(() => {
    if (isOpen && (type === "ZONE_POLYGON" || type === "POLYLINE") && zoneData?.id) {
      setZoneDetails(prev => ({ ...prev, isLoading: true }))
      fetch(`/api/admin/map/zone-details?zoneId=${encodeURIComponent(zoneData.id)}${zoneData.projectId ? `&projectId=${encodeURIComponent(zoneData.projectId)}` : ""}`)
        .then(res => res.json())
        .then(data => {
          setZoneDetails({
            tasks: data.tasks || [],
            personnel: data.personnel || [],
            dofs: data.dofs || [],
            isLoading: false
          })
        })
        .catch(err => {
          console.error("Zone details fetch error:", err)
          setZoneDetails({ tasks: [], personnel: [], dofs: [], isLoading: false })
        })
    }
  }, [isOpen, type, zoneData])

  if (!isOpen) return null

  // Helper for role metadata
  const getRoleBadge = (role: IosMarkerData["roleType"]) => {
    switch (role) {
      case "ENGINEER":
        return {
          icon: HardHat,
          title: "Saha Mühendisi",
          bg: "bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30",
          gradient: "from-blue-600 to-indigo-600"
        }
      case "DRIVER":
        return {
          icon: Truck,
          title: "Araç / Şoför / Lojistik",
          bg: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30",
          gradient: "from-amber-600 to-orange-600"
        }
      case "STORAGE":
        return {
          icon: Package,
          title: "Ambar / Depo / Demirbaş",
          bg: "bg-slate-500/15 text-slate-700 dark:text-slate-300 border-slate-500/30",
          gradient: "from-slate-600 to-slate-800"
        }
      case "ISG":
        return {
          icon: ShieldAlert,
          title: "İSG Güvenlik & Denetçi",
          bg: "bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/30",
          gradient: "from-red-600 to-rose-600"
        }
      default:
        return {
          icon: User,
          title: "Saha Personeli",
          bg: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
          gradient: "from-emerald-600 to-teal-600"
        }
    }
  }

  return (
    <div className="absolute bottom-4 right-4 left-4 md:left-auto md:top-4 md:bottom-auto z-40 md:w-[420px] max-w-[calc(100vw-2rem)] pointer-events-auto">
      <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-2xl border border-white/40 dark:border-white/10 shadow-2xl shadow-black/40 rounded-3xl p-5 text-slate-800 dark:text-slate-100 transition-all duration-300 animate-in fade-in zoom-in-95">
        
        {/* Header Bar */}
        <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-200/80 dark:border-slate-800/80">
          <div className="flex items-center gap-3">
            {type === "PROJECT" && (
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/30 shrink-0">
                <MapPin className="w-5 h-5" />
              </div>
            )}

            {(type === "WORKER" || type === "EQUIPMENT") && markerData && (() => {
              const meta = getRoleBadge(markerData.roleType)
              const IconComp = meta.icon
              return (
                <div className={`w-11 h-11 rounded-2xl bg-gradient-to-br ${meta.gradient} flex items-center justify-center text-white shadow-lg shrink-0`}>
                  <IconComp className="w-5 h-5" />
                </div>
              )
            })()}

            {(type === "ZONE_POLYGON" || type === "POLYLINE") && (
              <div className={`w-11 h-11 rounded-2xl ${type === "POLYLINE" ? "bg-gradient-to-br from-amber-500 to-orange-600 shadow-amber-500/30" : "bg-gradient-to-br from-cyan-500 to-blue-600 shadow-cyan-500/30"} flex items-center justify-center text-white shadow-lg shrink-0`}>
                <Layers className="w-5 h-5" />
              </div>
            )}

            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border bg-slate-100 dark:bg-slate-800/90 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700">
                  {type === "PROJECT" && "Şantiye Lokasyonu"}
                  {type === "WORKER" && (markerData ? getRoleBadge(markerData.roleType).title : "Personel")}
                  {type === "EQUIPMENT" && "BLE Demirbaş"}
                  {type === "ZONE_POLYGON" && "Sanal Poligon Çit"}
                  {type === "POLYLINE" && "Yatay Hat (Boru/Yol)"}
                </span>

                {type === "WORKER" && markerData?.inDanger && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-500/20 text-red-500 border border-red-500/40 animate-pulse">
                    Risk Alanında
                  </span>
                )}
              </div>

              <h3 className="text-base font-bold text-slate-900 dark:text-white mt-1 leading-snug">
                {type === "PROJECT" && (projectData?.title || projectData?.name || "Şantiye")}
                {(type === "WORKER" || type === "EQUIPMENT") && (markerData?.name || "Cihaz")}
                {(type === "ZONE_POLYGON" || type === "POLYLINE") && (zoneData?.title || "Saha Alanı")}
              </h3>

              <p className="text-xs text-slate-500 dark:text-slate-400">
                {type === "PROJECT" && `${projectData?.city || "Türkiye"} ${projectData?.district ? `• ${projectData.district}` : ""}`}
                {type === "WORKER" && `${markerData?.roleTitle || markerData?.department || "Saha Operasyonu"}`}
                {type === "EQUIPMENT" && `BLE ID: ${markerData?.bleTagId || "Tanımsız"}`}
                {(type === "ZONE_POLYGON" || type === "POLYLINE") && `Köşe Noktaları: ${zoneData?.pointsCount || 0} Koordinat`}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/80 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition flex items-center justify-center shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ========================================================================= */}
        {/* CASE 1: PROJECT OVERVIEW (Şantiye Özeti) */}
        {/* ========================================================================= */}
        {type === "PROJECT" && projectData && (
          <div className="pt-4 space-y-4">
            <div className="grid grid-cols-2 gap-2.5">
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
                <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block mb-1">
                  Aktif İşçi (Canlı)
                </span>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                  <span className="text-xl font-extrabold text-slate-900 dark:text-white">
                    {projectData.activeWorkers ?? 24}
                  </span>
                  <span className="text-xs text-slate-400">kişi</span>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
                <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block mb-1">
                  Toplam Blok / Alan
                </span>
                <span className="text-xl font-extrabold text-slate-900 dark:text-white">
                  {projectData.totalBlocks ?? 4}
                </span>
                <span className="text-xs text-slate-400 ml-1">blok</span>
              </div>
            </div>

            {/* Health & Progress Mini Bars */}
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500 dark:text-slate-400 font-medium">Fiziki İlerleme:</span>
                <span className="font-bold text-blue-600 dark:text-blue-400">%{projectData.progress ?? 68}</span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full" 
                  style={{ width: `${projectData.progress ?? 68}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-xs pt-1">
                <span className="text-slate-500 dark:text-slate-400 font-medium">Sağlık & İSG Skoru:</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">{projectData.healthScore ?? 92}/100</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 pt-1">
              {projectData.latitude && projectData.longitude && onFlyTo && (
                <button
                  onClick={() => onFlyTo([projectData.latitude!, projectData.longitude!])}
                  className="flex-1 py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold transition flex items-center justify-center gap-1.5"
                >
                  <MapPin className="w-3.5 h-3.5 text-blue-500" />
                  <span>Sahaya Yakınlaş</span>
                </button>
              )}
              <Link
                href={`/admin/projects/${projectData.id}`}
                className="flex-1 py-2.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition shadow-lg shadow-blue-600/25 flex items-center justify-center gap-1.5"
              >
                <span>Proje Detayı</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* CASE 2: WORKER / EQUIPMENT OVERVIEW */}
        {/* ========================================================================= */}
        {(type === "WORKER" || type === "EQUIPMENT") && markerData && (
          <div className="pt-4 space-y-3.5">
            {/* Live Telemetry Grid */}
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
                <div className="flex items-center justify-center gap-1 text-[10px] text-slate-500 dark:text-slate-400 mb-0.5">
                  <Heart className="w-3 h-3 text-red-500" />
                  <span>Nabız</span>
                </div>
                <span className="font-mono font-bold text-sm text-slate-900 dark:text-white">
                  {markerData.pulse ?? 76} bpm
                </span>
              </div>

              <div className="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
                <div className="flex items-center justify-center gap-1 text-[10px] text-slate-500 dark:text-slate-400 mb-0.5">
                  <Battery className="w-3 h-3 text-emerald-500" />
                  <span>BLE Pil</span>
                </div>
                <span className="font-mono font-bold text-sm text-emerald-600 dark:text-emerald-400">
                  %{markerData.battery ?? 92}
                </span>
              </div>

              <div className="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
                <div className="flex items-center justify-center gap-1 text-[10px] text-slate-500 dark:text-slate-400 mb-0.5">
                  <HardHat className="w-3 h-3 text-amber-500" />
                  <span>KKD Onayı</span>
                </div>
                <span className="font-bold text-xs text-slate-900 dark:text-white">
                  {markerData.hasHelmet !== false ? "Baret Takılı" : "⚠️ Yok"}
                </span>
              </div>
            </div>

            {/* Current Zone Location */}
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between text-xs">
              <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-cyan-500" />
                Bulunduğu Mahal:
              </span>
              <span className="font-semibold text-slate-900 dark:text-white truncate max-w-[200px]">
                {markerData.zoneName || "Genel Şantiye Sahası"}
              </span>
            </div>

            {/* GPS Coords */}
            <div className="px-1 text-[11px] font-mono text-slate-400 flex items-center justify-between">
              <span>GPS Koordinatları:</span>
              <span>{markerData.latitude.toFixed(5)}, {markerData.longitude.toFixed(5)}</span>
            </div>

            {/* Action */}
            <div className="pt-1">
              <Link
                href="/admin/personnel"
                className="w-full py-2.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition shadow-lg shadow-blue-600/25 flex items-center justify-center gap-1.5"
              >
                <span>Personel Profilini Aç</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* CASE 3: GIS ZONE POLYGON & POLYLINE (Tam Bütünleşik Yapı) */}
        {/* ========================================================================= */}
        {(type === "ZONE_POLYGON" || type === "POLYLINE") && zoneData && (
          <div className="pt-3 space-y-3">
            {/* Segmented Tab Controls */}
            <div className="flex rounded-xl bg-slate-100 dark:bg-slate-800 p-1 text-xs font-semibold">
              <button
                onClick={() => setActiveTab("summary")}
                className={`flex-1 py-1.5 rounded-lg transition ${activeTab === "summary" ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm" : "text-slate-500 dark:text-slate-400"}`}
              >
                Özet
              </button>
              <button
                onClick={() => setActiveTab("tasks")}
                className={`flex-1 py-1.5 rounded-lg transition ${activeTab === "tasks" ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm" : "text-slate-500 dark:text-slate-400"}`}
              >
                İş Emirleri ({zoneDetails.tasks.length})
              </button>
              <button
                onClick={() => setActiveTab("personnel")}
                className={`flex-1 py-1.5 rounded-lg transition ${activeTab === "personnel" ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm" : "text-slate-500 dark:text-slate-400"}`}
              >
                Personel ({zoneDetails.personnel.length})
              </button>
              <button
                onClick={() => setActiveTab("dof")}
                className={`flex-1 py-1.5 rounded-lg transition ${activeTab === "dof" ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm" : "text-slate-500 dark:text-slate-400"}`}
              >
                DÖF ({zoneDetails.dofs.length})
              </button>
            </div>

            {/* TAB CONTENT: SUMMARY */}
            {activeTab === "summary" && (
              <div className="space-y-2.5 text-xs">
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 dark:text-slate-400">Alan Tipi:</span>
                    <span className="font-bold text-slate-900 dark:text-white">
                      {zoneData.type === "DANGER_ZONE" ? "Riskli İSG Bölgesi" : zoneData.type === "REST_AREA" ? "Toplanma / Dinlenme" : zoneData.type === "POLYLINE" ? "Yatay Hat (Boru/Yol)" : "Ana Şantiye Çiti"}
                    </span>
                  </div>
                  {zoneData.supervisor && (
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500 dark:text-slate-400">Sorumlu Amir:</span>
                      <span className="font-medium text-slate-900 dark:text-white">{zoneData.supervisor}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 dark:text-slate-400">Harita Geometrisi:</span>
                    <span className="font-mono text-slate-700 dark:text-slate-300">{zoneData.pointsCount} Köşe Noktası</span>
                  </div>
                </div>

                {onDeleteZone && (
                  <button
                    onClick={() => onDeleteZone(zoneData.id)}
                    className="w-full py-2 px-3 rounded-xl border border-red-500/30 text-red-500 hover:bg-red-500/10 text-xs font-semibold transition"
                  >
                    Bu Alanı Haritadan Sil
                  </button>
                )}
              </div>
            )}

            {/* TAB CONTENT: TASKS */}
            {activeTab === "tasks" && (
              <div className="max-h-56 overflow-y-auto space-y-2 text-xs pr-1">
                {zoneDetails.isLoading ? (
                  <div className="py-6 text-center text-slate-400">İş emirleri sorgulanıyor...</div>
                ) : zoneDetails.tasks.length === 0 ? (
                  <div className="py-6 text-center text-slate-400 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
                    Bu alana atanmış aktif iş emri bulunmuyor.
                  </div>
                ) : (
                  zoneDetails.tasks.map((task: any) => (
                    <div key={task.id} className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 flex items-start justify-between gap-2">
                      <div>
                        <h4 className="font-semibold text-slate-900 dark:text-white leading-tight">{task.title}</h4>
                        <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                          <span>{task.taskType || "Genel"}</span>
                          {task.dueDate && <span>• {new Date(task.dueDate).toLocaleDateString("tr-TR")}</span>}
                        </div>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold shrink-0 ${
                        task.status === "DONE" || task.status === "COMPLETED" 
                          ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400" 
                          : "bg-blue-500/15 text-blue-600 dark:text-blue-400"
                      }`}>
                        {task.status}
                      </span>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* TAB CONTENT: PERSONNEL */}
            {activeTab === "personnel" && (
              <div className="max-h-56 overflow-y-auto space-y-2 text-xs pr-1">
                {zoneDetails.isLoading ? (
                  <div className="py-6 text-center text-slate-400">Saha personeli taranıyor...</div>
                ) : zoneDetails.personnel.length === 0 ? (
                  <div className="py-6 text-center text-slate-400 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
                    Bu çit sınırları içinde tespit edilen aktif personel yok.
                  </div>
                ) : (
                  zoneDetails.personnel.map((p: any) => (
                    <div key={p.id} className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-blue-500/20 text-blue-500 flex items-center justify-center font-bold text-xs">
                          👷
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900 dark:text-white">{p.name}</p>
                          <p className="text-[11px] text-slate-400">{p.position || p.department || "İşçi"}</p>
                        </div>
                      </div>
                      <span className="text-[11px] font-mono font-semibold text-emerald-500">
                        Canlı Sinyal
                      </span>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* TAB CONTENT: DOF */}
            {activeTab === "dof" && (
              <div className="max-h-56 overflow-y-auto space-y-2 text-xs pr-1">
                {zoneDetails.isLoading ? (
                  <div className="py-6 text-center text-slate-400">DÖF kayıtları getiriliyor...</div>
                ) : zoneDetails.dofs.length === 0 ? (
                  <div className="py-6 text-center text-slate-400 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
                    Bu alanda açık uygunsuzluk (DÖF) bulunmuyor.
                  </div>
                ) : (
                  zoneDetails.dofs.map((d: any) => (
                    <div key={d.id} className="p-2.5 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 flex items-start justify-between gap-2">
                      <div>
                        <h4 className="font-semibold text-red-900 dark:text-red-300 leading-tight">
                          {d.element || d.reportNo || "Uygunsuzluk"}
                        </h4>
                        <p className="text-[11px] text-red-700/80 dark:text-red-400 mt-0.5 line-clamp-2">
                          {d.description}
                        </p>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-500/20 text-red-500 shrink-0">
                        {d.severity || d.priority || "AÇIK"}
                      </span>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

