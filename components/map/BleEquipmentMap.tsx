"use client"
/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * BLE Equipment Map Component (Client-Side Leaflet with Dark Matter Layer)
 */

import React, { useEffect, useMemo } from "react"
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from "react-leaflet"
import L from "leaflet"
import "leaflet/dist/leaflet.css"

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

interface BleEquipmentMapProps {
  center: [number, number]
  zoom?: number
  equipments: BleEquipment[]
  highlightedId?: string | null
  searchQuery?: string
  onSelectEquipment?: (equipment: BleEquipment) => void
  selectedProjectName?: string
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
    // Neon Cyan / Electric Blue glowing pin for searched/highlighted equipment
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
    // Red / Amber glowing warning marker for LOST equipment
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

  // Emerald green badge for ACTIVE equipment
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

export default function BleEquipmentMap({
  center,
  zoom = 16,
  equipments,
  highlightedId,
  searchQuery = "",
  onSelectEquipment,
  selectedProjectName = "Şantiye Sahası"
}: BleEquipmentMapProps) {
  const isSearchActive = searchQuery.trim().length > 0
  const normalizedQuery = searchQuery.trim().toLowerCase()

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
        {/* CartoDB Dark Matter Layer for futuristic dark UI */}
        <TileLayer
          attribution='&copy; <a href="https://carto.com/attributions">CARTO</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          maxZoom={20}
          subdomains="abcd"
        />

        {/* Dynamic View Controller */}
        <MapViewController center={center} zoom={zoom} targetPoint={targetPoint} />

        {/* Project Center Geofence & Hub */}
        <Circle
          center={center}
          radius={75}
          pathOptions={{
            color: "#38bdf8",
            fillColor: "#0284c7",
            fillOpacity: 0.08,
            weight: 1.5,
            dashArray: "4, 6"
          }}
        />

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
                <div className="flex justify-between">
                  <span className="text-slate-400">BLE Kapsama:</span>
                  <span className="text-emerald-400 font-medium">75m Geofence</span>
                </div>
              </div>
            </div>
          </Popup>
        </Marker>

        {/* Equipment BLE Markers */}
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
