"use client"
/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * BLE Equipment & Personnel Tracking Map with Polygon Geofencing & Turf.js Engine
 */

import React, { useEffect, useMemo, useState } from "react"
import { MapContainer, TileLayer, Marker, Popup, Circle, Polygon as LeafletPolygon, CircleMarker, useMap } from "react-leaflet"
import L from "leaflet"
import "leaflet/dist/leaflet.css"
import * as turf from "@turf/turf"

export interface BleEquipment {
  id: string
  name: string
  type: string
  category?: string
  status: "AKTIF" | "KAYIP" | string
  rawStatus?: string
  serialNumber?: string
  bleTagId: string
  latitude: number
  longitude: number
  lastSeenAt: string
  projectId?: string | null
  project?: {
    id: string
    title: string
    name: string
    latitude: number | null
    longitude: number | null
  } | null
  assignedTo?: {
    id: string
    name: string
    department?: string
    phone?: string
  } | null
}

export interface BleSiteZone {
  id: string
  title: string
  zoneType: "MAIN_SITE" | "DANGER_ZONE" | "REST_AREA"
  polygonCoordinates?: { lat: number; lng: number }[]
  supervisor?: string
}

export interface LiveBleWorker {
  id: string
  name: string
  department: string
  position: string
  latitude: number
  longitude: number
  pulse: number // bpm
  battery: number // %
  hasHelmet: boolean
  inDanger: boolean
  currentZoneName: string
  currentZoneType: "MAIN_SITE" | "DANGER_ZONE" | "REST_AREA" | null
}

interface BleEquipmentMapProps {
  center: [number, number]
  zoom?: number
  equipments: BleEquipment[]
  siteZones?: BleSiteZone[]
  highlightedId?: string | null
  searchQuery?: string
  onSelectEquipment?: (equipment: BleEquipment) => void
  selectedProjectName?: string
}

const ZONE_COLORS = {
  MAIN_SITE: {
    stroke: '#2563eb',
    fill: '#3b82f6',
    opacity: 0.25,
    title: 'Ana Şantiye Sınırı'
  },
  DANGER_ZONE: {
    stroke: '#dc2626',
    fill: '#ef4444',
    opacity: 0.35,
    title: 'Kritik Risk Alanı (Vinç/İskele)'
  },
  REST_AREA: {
    stroke: '#059669',
    fill: '#10b981',
    opacity: 0.25,
    title: 'Dinlenme / Toplanma Alanı'
  }
}

// Map Controller for smooth flyTo animations
function MapViewController({
  center,
  zoom,
  targetPoint
}: {
  center: [number, number]
  zoom: number
  targetPoint?: [number, number] | null
}) {
  const map = useMap()

  useEffect(() => {
    if (targetPoint) {
      map.flyTo(targetPoint, 17, {
        animate: true,
        duration: 1.2,
        easeLinearity: 0.25
      })
    } else if (center) {
      map.flyTo(center, zoom, {
        animate: true,
        duration: 1.5,
        easeLinearity: 0.25
      })
    }
  }, [map, center, zoom, targetPoint])

  return null
}

export function formatTimeAgo(dateString?: string | null): string {
  if (!dateString) return "Bilinmiyor"
  try {
    const date = new Date(dateString)
    const now = new Date()
    const diffSec = Math.floor((now.getTime() - date.getTime()) / 1000)

    if (diffSec < 60) return "Az önce"
    const diffMin = Math.floor(diffSec / 60)
    if (diffMin < 60) return `${diffMin} dakika önce`
    const diffHour = Math.floor(diffMin / 60)
    if (diffHour < 24) return `${diffHour} saat önce`
    const diffDay = Math.floor(diffHour / 24)
    if (diffDay < 30) return `${diffDay} gün önce`
    return date.toLocaleDateString("tr-TR")
  } catch {
    return "Bilinmiyor"
  }
}

// Create custom animated divIcons
function createBlePinIcon(
  status: string,
  isHighlighted: boolean,
  isSearched: boolean,
  name: string
) {
  const isLost = status.toUpperCase() === "KAYIP" || status.toUpperCase() === "LOST"

  if (isHighlighted || isSearched) {
    return L.divIcon({
      className: "custom-ble-pin",
      iconSize: [44, 44],
      iconAnchor: [22, 22],
      popupAnchor: [0, -24],
      html: `
        <div style="position: relative; width: 44px; height: 44px; display: flex; align-items: center; justify-content: center;">
          <div style="position: absolute; inset: -8px; border-radius: 9999px; background: rgba(6, 182, 212, 0.4); filter: blur(6px); animation: pulse 1.5s infinite;"></div>
          <div style="position: absolute; width: 40px; height: 40px; border-radius: 9999px; border: 2px solid #06b6d4; background: rgba(8, 145, 178, 0.25); animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
          <div style="position: relative; width: 32px; height: 32px; border-radius: 9999px; background: #0891b2; border: 2.5px solid #22d3ee; box-shadow: 0 0 16px #06b6d4, 0 0 30px #0891b2; display: flex; align-items: center; justify-content: center; color: white;">
            <svg style="width: 18px; height: 18px;" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <span style="position: absolute; bottom: -20px; font-size: 10px; font-weight: 700; color: #22d3ee; text-shadow: 0 0 8px #0891b2; white-space: nowrap; background: rgba(15, 23, 42, 0.9); padding: 1px 6px; border-radius: 4px; border: 1px solid rgba(6, 182, 212, 0.4);">${name.slice(0, 16)}</span>
        </div>
      `
    })
  }

  if (isLost) {
    return L.divIcon({
      className: "custom-ble-pin",
      iconSize: [36, 36],
      iconAnchor: [18, 18],
      popupAnchor: [0, -20],
      html: `
        <div style="position: relative; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center;">
          <div style="position: absolute; width: 36px; height: 36px; border-radius: 9999px; background: rgba(239, 68, 68, 0.2); animation: ping 2.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
          <div style="position: relative; width: 28px; height: 28px; border-radius: 9999px; background: #dc2626; border: 2px solid #fca5a5; box-shadow: 0 0 12px rgba(239, 68, 68, 0.8); display: flex; align-items: center; justify-content: center; color: white;">
            <svg style="width: 15px; height: 15px;" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
        </div>
      `
    })
  }

  return L.divIcon({
    className: "custom-ble-pin",
    iconSize: [36, 36],
    iconAnchor: [18, 18],
    popupAnchor: [0, -20],
    html: `
      <div style="position: relative; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center;">
        <div style="position: absolute; width: 32px; height: 32px; border-radius: 9999px; background: rgba(16, 185, 129, 0.25); animation: pulse 2s infinite;"></div>
        <div style="position: relative; width: 26px; height: 26px; border-radius: 9999px; background: #059669; border: 2px solid #6ee7b7; box-shadow: 0 0 10px rgba(16, 185, 129, 0.7); display: flex; align-items: center; justify-content: center; color: white;">
          <svg style="width: 14px; height: 14px;" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M7 11.5V14m0-2.5v-6a1.5 1.5 0 113 0m-3 6a1.5 1.5 0 00-3 0v2a7.5 7.5 0 0015 0v-5a1.5 1.5 0 00-3 0m-6-3V11m0-5.5v-1a1.5 1.5 0 013 0v1m0 0V11m0-5.5a1.5 1.5 0 013 0v3m0 0V11" />
          </svg>
        </div>
      </div>
    `
  })
}

// Center point marker for the project hub
function createProjectHubIcon(projectName: string) {
  return L.divIcon({
    className: "custom-project-pin",
    iconSize: [40, 40],
    iconAnchor: [20, 20],
    popupAnchor: [0, -22],
    html: `
      <div style="position: relative; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center;">
        <div style="position: absolute; inset: -4px; border-radius: 12px; background: rgba(59, 130, 246, 0.3); filter: blur(4px);"></div>
        <div style="width: 34px; height: 34px; border-radius: 10px; background: linear-gradient(135deg, #1e40af, #3b82f6); border: 2px solid #93c5fd; box-shadow: 0 0 16px rgba(59, 130, 246, 0.8); display: flex; align-items: center; justify-content: center; color: white;">
          <svg style="width: 18px; height: 18px;" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
        </div>
      </div>
    `
  })
}

// Worker DivIcon (Realistic Hardhat BLE Badge)
function createWorkerBleIcon(inDanger: boolean, hasHelmet: boolean, name: string) {
  const bg = inDanger ? "#dc2626" : hasHelmet ? "#0284c7" : "#ea580c"
  const ring = inDanger ? "#f87171" : hasHelmet ? "#38bdf8" : "#fb923c"

  return L.divIcon({
    className: "custom-worker-pin",
    iconSize: [34, 34],
    iconAnchor: [17, 17],
    popupAnchor: [0, -18],
    html: `
      <div style="position: relative; width: 34px; height: 34px; display: flex; align-items: center; justify-content: center;">
        ${inDanger ? `<div style="position: absolute; width: 34px; height: 34px; border-radius: 9999px; background: rgba(239, 68, 68, 0.4); animation: ping 1.5s infinite;"></div>` : ''}
        <div style="position: relative; width: 26px; height: 26px; border-radius: 9999px; background: ${bg}; border: 2px solid ${ring}; box-shadow: 0 0 10px ${bg}; display: flex; align-items: center; justify-content: center; color: white; font-size: 13px;">
          👷
        </div>
        <span style="position: absolute; bottom: -18px; font-size: 9px; font-weight: 700; color: white; white-space: nowrap; background: rgba(15, 23, 42, 0.9); padding: 0.5px 5px; border-radius: 3px; border: 1px solid rgba(255, 255, 255, 0.2);">${name.split(' ')[0]}</span>
      </div>
    `
  })
}

// Helper: Build closed GeoJSON Polygon from array
function toTurfPolygon(coords: { lat: number; lng: number }[]) {
  if (!coords || coords.length < 3) return null
  const ring: [number, number][] = coords.map((c) => [c.lng, c.lat])
  const first = ring[0]
  const last = ring[ring.length - 1]
  if (first[0] !== last[0] || first[1] !== last[1]) {
    ring.push([first[0], first[1]])
  }
  if (ring.length < 4) return null
  try {
    return turf.polygon([ring])
  } catch {
    return null
  }
}

export default function BleEquipmentMap({
  center,
  zoom = 16,
  equipments,
  siteZones = [],
  highlightedId,
  searchQuery = "",
  onSelectEquipment,
  selectedProjectName = "Şantiye Sahası"
}: BleEquipmentMapProps) {
  const isSearchActive = searchQuery.trim().length > 0
  const normalizedQuery = searchQuery.trim().toLowerCase()

  // Live BLE Workers State
  const [liveWorkers, setLiveWorkers] = useState<LiveBleWorker[]>([])

  // Initialize and stream workers
  useEffect(() => {
    if (!center || !center[0] || !center[1]) return

    const initial: LiveBleWorker[] = [
      {
        id: "w-1",
        name: "Ahmet Yılmaz",
        department: "Kaba Yapı",
        position: "Kalıp Ustası",
        latitude: center[0] + 0.0003,
        longitude: center[1] + 0.0002,
        pulse: 78,
        battery: 89,
        hasHelmet: true,
        inDanger: false,
        currentZoneName: "Ana Şantiye",
        currentZoneType: "MAIN_SITE"
      },
      {
        id: "w-2",
        name: "Mustafa Kaya",
        department: "İskele & Vinç",
        position: "Vinç Operatörü",
        latitude: center[0] - 0.00025,
        longitude: center[1] + 0.00035,
        pulse: 84,
        battery: 64,
        hasHelmet: true,
        inDanger: false,
        currentZoneName: "Ana Şantiye",
        currentZoneType: "MAIN_SITE"
      },
      {
        id: "w-3",
        name: "Emre Demir",
        department: "Demir & Donatı",
        position: "Demirci Ustası",
        latitude: center[0] + 0.0001,
        longitude: center[1] - 0.0003,
        pulse: 92,
        battery: 76,
        hasHelmet: false,
        inDanger: false,
        currentZoneName: "Genel Saha",
        currentZoneType: null
      },
      {
        id: "w-4",
        name: "Ali Öztürk",
        department: "Elektrik & Mekanik",
        position: "Elektrik Teknisyeni",
        latitude: center[0] - 0.0004,
        longitude: center[1] - 0.0002,
        pulse: 75,
        battery: 94,
        hasHelmet: true,
        inDanger: false,
        currentZoneName: "Dinlenme Alanı",
        currentZoneType: "REST_AREA"
      }
    ]

    setLiveWorkers(initial)

    // Interval to simulate live BLE telemetry and autonomous Turf point-in-polygon
    const interval = setInterval(() => {
      setLiveWorkers((prev) =>
        prev.map((w) => {
          const newLat = w.latitude + (Math.random() - 0.5) * 0.00008
          const newLng = w.longitude + (Math.random() - 0.5) * 0.00008
          const newPulse = Math.max(68, Math.min(125, w.pulse + (Math.random() > 0.5 ? 1 : -1)))

          // Turf calculation
          const pt = turf.point([newLng, newLat])
          let detectedZone: BleSiteZone | null = null

          for (const zone of siteZones) {
            if (zone.polygonCoordinates && zone.polygonCoordinates.length >= 3) {
              const poly = toTurfPolygon(zone.polygonCoordinates)
              if (poly && turf.booleanPointInPolygon(pt, poly)) {
                detectedZone = zone
                break
              }
            }
          }

          const inDanger = detectedZone?.zoneType === "DANGER_ZONE"
          const zoneName = detectedZone ? detectedZone.title : "Genel Şantiye Sahası"
          const zoneType = detectedZone ? detectedZone.zoneType : null

          return {
            ...w,
            latitude: newLat,
            longitude: newLng,
            pulse: newPulse,
            inDanger,
            currentZoneName: zoneName,
            currentZoneType: zoneType
          }
        })
      )
    }, 2500)

    return () => clearInterval(interval)
  }, [center, siteZones])

  // Filter equipments: if search query exists, only show matching equipments!
  const visibleEquipments = useMemo(() => {
    if (!isSearchActive) return equipments

    return equipments.filter((eq) => {
      const matchName = eq.name.toLowerCase().includes(normalizedQuery)
      const matchBle = eq.bleTagId.toLowerCase().includes(normalizedQuery)
      const matchSerial = eq.serialNumber?.toLowerCase().includes(normalizedQuery) || false
      const matchCategory = eq.category?.toLowerCase().includes(normalizedQuery) || false
      return matchName || matchBle || matchSerial || matchCategory
    })
  }, [equipments, isSearchActive, normalizedQuery])

  // Focused target point if one equipment is highlighted or first search result
  const targetPoint = useMemo<[number, number] | null>(() => {
    if (highlightedId) {
      const found = equipments.find((e) => e.id === highlightedId)
      if (found && found.latitude && found.longitude) {
        return [found.latitude, found.longitude]
      }
    }
    if (isSearchActive && visibleEquipments.length === 1) {
      return [visibleEquipments[0].latitude, visibleEquipments[0].longitude]
    }
    return null
  }, [highlightedId, equipments, isSearchActive, visibleEquipments])

  return (
    <div className="relative w-full h-full bg-slate-950 overflow-hidden rounded-xl border border-slate-800">
      {/* Global CSS for Leaflet Popups in Dark Mode */}
      <style jsx global>{`
        .leaflet-popup-content-wrapper {
          background: rgba(15, 23, 42, 0.95) !important;
          backdrop-filter: blur(12px) !important;
          border: 1px solid rgba(51, 65, 85, 0.8) !important;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.7), 0 0 20px rgba(6, 182, 212, 0.15) !important;
          border-radius: 14px !important;
          color: #f1f5f9 !important;
          padding: 0 !important;
        }
        .leaflet-popup-content {
          margin: 0 !important;
          line-height: 1.4 !important;
        }
        .leaflet-popup-tip {
          background: rgba(15, 23, 42, 0.95) !important;
          border: 1px solid rgba(51, 65, 85, 0.8) !important;
        }
        .leaflet-container {
          background: #090d16 !important;
          font-family: inherit !important;
        }
        .dark-map-tiles {
          filter: invert(100%) hue-rotate(180deg) brightness(95%) contrast(90%) !important;
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.15); }
        }
      `}</style>

      <MapContainer
        center={center}
        zoom={zoom}
        style={{ height: "100%", width: "100%" }}
        className="z-0 h-full w-full"
        scrollWheelZoom={true}
      >
        {/* Esri Dark Gray Base Harita Altlığı (Yazısız, modern dark mode) */}
        <TileLayer
          attribution='&copy; <a href="https://www.esri.com/">Esri</a>, DeLorme, HERE, MapmyIndia'
          url="https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}"
          maxZoom={16}
        />

        {/* Dynamic View Controller */}
        <MapViewController center={center} zoom={zoom} targetPoint={targetPoint} />

        {/* 1. Poligon Sanal Çitler (Polygon Geofences per prompt specifications) */}
        {siteZones.map((zone) => {
          const cfg = ZONE_COLORS[zone.zoneType] || ZONE_COLORS.MAIN_SITE
          if (zone.polygonCoordinates && zone.polygonCoordinates.length >= 3) {
            const positions: [number, number][] = zone.polygonCoordinates.map((c) => [c.lat, c.lng])
            return (
              <LeafletPolygon
                key={zone.id}
                positions={positions}
                pathOptions={{
                  color: cfg.stroke,
                  fillColor: cfg.fill,
                  fillOpacity: cfg.opacity,
                  weight: 2
                }}
              >
                <Popup>
                  <div className="p-3 text-white min-w-[200px]">
                    <div className="flex items-center justify-between border-b border-slate-700/80 pb-1.5 mb-2">
                      <h4 className="font-bold text-sm text-cyan-300">{zone.title}</h4>
                      <span className="text-[10px] px-2 py-0.5 rounded font-bold uppercase bg-slate-800 text-slate-300">
                        {zone.zoneType}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300">
                      Köşe Noktaları: {zone.polygonCoordinates.length} Nokta
                    </p>
                    {zone.supervisor && (
                      <p className="text-xs text-slate-400 mt-1">
                        Sorumlu: {zone.supervisor}
                      </p>
                    )}
                  </div>
                </Popup>
              </LeafletPolygon>
            )
          }
          return null
        })}

        {/* 2. Project Center Hub */}
        <Marker position={center} icon={createProjectHubIcon(selectedProjectName)}>
          <Popup>
            <div className="p-3.5 min-w-[220px]">
              <div className="flex items-center gap-2 mb-2 pb-2 border-b border-slate-700/60">
                <div className="w-7 h-7 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-xs">
                  GPS
                </div>
                <div>
                  <h4 className="font-semibold text-white text-sm leading-tight">
                    {selectedProjectName}
                  </h4>
                  <p className="text-xs text-blue-400">Şantiye Merkez Noktası</p>
                </div>
              </div>
              <div className="text-xs text-slate-300 space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-400">Enlem:</span>
                  <span className="font-mono text-slate-200">{center[0].toFixed(5)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Boylam:</span>
                  <span className="font-mono text-slate-200">{center[1].toFixed(5)}</span>
                </div>
              </div>
            </div>
          </Popup>
        </Marker>

        {/* 3. Live Streaming BLE Personnel (Workers) */}
        {liveWorkers.map((worker) => {
          const workerIcon = createWorkerBleIcon(worker.inDanger, worker.hasHelmet, worker.name)
          return (
            <Marker
              key={worker.id}
              position={[worker.latitude, worker.longitude]}
              icon={workerIcon}
            >
              <Popup>
                <div className="p-4 min-w-[250px] max-w-[300px]">
                  {/* Header */}
                  <div className="flex items-start justify-between border-b border-slate-800 pb-2 mb-2">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm">👷</span>
                        <h4 className="font-bold text-white text-sm leading-tight">{worker.name}</h4>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {worker.position} - {worker.department}
                      </p>
                    </div>
                    {worker.inDanger ? (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-500/20 border border-red-500/40 text-red-400 animate-pulse">
                        TEHLİKE
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 border border-emerald-500/40 text-emerald-400">
                        GÜVENLİ
                      </span>
                    )}
                  </div>

                  {/* O an içinde bulunduğu Poligon Sanal Çit */}
                  <div className="mb-2.5">
                    <div
                      className={`p-2 rounded-lg text-xs font-semibold flex items-center justify-between border ${
                        worker.inDanger
                          ? "bg-red-950/40 border-red-500/40 text-red-300"
                          : "bg-slate-900 border-slate-800 text-slate-200"
                      }`}
                    >
                      <span className="text-slate-400">📍 Bulunduğu Alan:</span>
                      <span className="font-mono truncate max-w-[140px] text-cyan-300">
                        {worker.currentZoneName}
                      </span>
                    </div>
                  </div>

                  {/* Nabız & BLE Pil Telemetrisi */}
                  <div className="grid grid-cols-2 gap-2 text-xs mb-2.5">
                    <div className="bg-slate-900/90 border border-slate-800 p-2 rounded-lg">
                      <span className="text-[10px] text-slate-400 block">❤️ Nabız:</span>
                      <span className={`font-mono font-bold ${worker.pulse > 105 ? 'text-red-400' : 'text-slate-200'}`}>
                        {worker.pulse} bpm
                      </span>
                    </div>
                    <div className="bg-slate-900/90 border border-slate-800 p-2 rounded-lg">
                      <span className="text-[10px] text-slate-400 block">🔋 BLE Pil:</span>
                      <span className="font-mono font-bold text-emerald-400">
                        %{worker.battery}
                      </span>
                    </div>
                  </div>

                  {/* Baret & KKD Durumu */}
                  <div className="mb-3">
                    <div
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center justify-between border ${
                        worker.hasHelmet
                          ? "bg-emerald-950/30 border-emerald-500/30 text-emerald-300"
                          : "bg-amber-950/30 border-amber-500/40 text-amber-300 font-bold"
                      }`}
                    >
                      <span>🪖 Baret Sinyali:</span>
                      <span>{worker.hasHelmet ? "Onaylı" : "⚠️ BARET YOK"}</span>
                    </div>
                  </div>

                  {/* Action */}
                  <a
                    href="/admin/personnel"
                    className="block w-full py-1.5 bg-blue-600/80 hover:bg-blue-600 text-white text-xs font-semibold rounded text-center transition"
                  >
                    Personel Detayına Git
                  </a>
                </div>
              </Popup>
            </Marker>
          )
        })}

        {/* 4. Equipment BLE Markers */}
        {visibleEquipments.map((eq) => {
          const isHighlighted = eq.id === highlightedId
          const isSearched = isSearchActive
          const isLost = eq.status.toUpperCase() === "KAYIP" || eq.status.toUpperCase() === "LOST"
          const pinIcon = createBlePinIcon(eq.status, isHighlighted, isSearched, eq.name)

          return (
            <Marker
              key={eq.id}
              position={[eq.latitude, eq.longitude]}
              icon={pinIcon}
              eventHandlers={{
                click: () => {
                  if (onSelectEquipment) onSelectEquipment(eq)
                }
              }}
            >
              <Popup>
                <div className="p-4 min-w-[260px] max-w-[320px]">
                  {/* Header */}
                  <div className="flex items-start justify-between gap-3 mb-2.5 pb-2.5 border-b border-slate-800">
                    <div>
                      <span className="inline-block px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider bg-slate-800 text-slate-300 border border-slate-700/80 mb-1">
                        {eq.category || eq.type}
                      </span>
                      <h4 className="font-bold text-white text-sm leading-snug">
                        {eq.name}
                      </h4>
                    </div>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-xs font-semibold flex items-center gap-1.5 shrink-0 ${
                        isLost
                          ? "bg-red-500/15 text-red-400 border border-red-500/30"
                          : "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          isLost ? "bg-red-400 animate-pulse" : "bg-emerald-400"
                        }`}
                      />
                      {isLost ? "Kayıp" : "Aktif"}
                    </span>
                  </div>

                  {/* Details Body */}
                  <div className="space-y-2 text-xs">
                    {/* BLE Etiket No */}
                    <div className="flex items-center justify-between p-2 rounded-lg bg-slate-900/80 border border-slate-800/80">
                      <span className="text-slate-400 flex items-center gap-1.5">
                        <svg
                          className="w-3.5 h-3.5 text-cyan-400"
                          fill="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path d="M12 2a1 1 0 0 0-.6.2l-5 4a1 1 0 0 0 1.2 1.6L11 5.08V11H6a1 1 0 1 0 0 2h5v5.92l-3.4-2.72a1 1 0 1 0-1.2 1.6l5 4A1 1 0 0 0 13 21v-7.59l4.3 4.3a1 1 0 0 0 1.4-1.42L14.41 12l4.3-4.3a1 1 0 0 0-1.42-1.4L13 10.58V3a1 1 0 0 0-1-1zm1 5.41 2.3 2.3L13 12.01V7.41zm0 9.18 2.3-2.3L13 11.99v4.6z" />
                        </svg>
                        BLE Etiket No:
                      </span>
                      <span className="font-mono font-semibold text-cyan-300">
                        {eq.bleTagId}
                      </span>
                    </div>

                    {/* Son Görülme Zamanı */}
                    <div className="flex items-center justify-between px-1">
                      <span className="text-slate-400 flex items-center gap-1.5">
                        <svg
                          className="w-3.5 h-3.5 text-slate-500"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        Son Görülme:
                      </span>
                      <span className="font-medium text-slate-200">
                        {formatTimeAgo(eq.lastSeenAt)}
                      </span>
                    </div>

                    {/* Sorumlu / Zimmet */}
                    {eq.assignedTo && (
                      <div className="flex items-center justify-between px-1">
                        <span className="text-slate-400">Zimmetli:</span>
                        <span className="font-medium text-slate-200 truncate max-w-[140px]">
                          {eq.assignedTo.name}
                        </span>
                      </div>
                    )}

                    {/* GPS Koordinatları */}
                    <div className="flex items-center justify-between px-1 text-[11px] text-slate-500 font-mono">
                      <span>GPS:</span>
                      <span>
                        {eq.latitude.toFixed(5)}, {eq.longitude.toFixed(5)}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center gap-2">
                    <a
                      href={`/admin/equipments`}
                      className="flex-1 py-1.5 px-3 rounded-lg bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 text-center font-medium text-xs transition border border-cyan-500/30 hover:border-cyan-400/50"
                    >
                      Demirbaş Kartı
                    </a>
                  </div>
                </div>
              </Popup>
            </Marker>
          )
        })}
      </MapContainer>
    </div>
  )
}
