"use client"
/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Nexa ERP - BLE Equipment & Personnel Tracking Map with Nested Polygons, Polyline Drawing, Role Markers & iOS Popup
 */

import React, { useEffect, useMemo, useState, useRef } from "react"
import { useTheme } from "next-themes"
import { 
  MapContainer, 
  TileLayer, 
  Marker, 
  Polygon as LeafletPolygon, 
  Polyline, 
  CircleMarker, 
  useMap,
  useMapEvents
} from "react-leaflet"
import L from "leaflet"
import "leaflet/dist/leaflet.css"
import * as turf from "@turf/turf"
import IosMapPopup, { 
  IosPopupType, 
  IosProjectData, 
  IosMarkerData, 
  IosZoneData 
} from "@/components/map/IosMapPopup"
import {
  createEngineerDivIcon,
  createDriverDivIcon,
  createStorageDivIcon,
  createIsgDivIcon,
  createProjectPinIcon,
  resolveMarkerRole
} from "@/components/map/mapIcons"

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
  zoneType: "MAIN_SITE" | "DANGER_ZONE" | "REST_AREA" | "POLYLINE" | string
  polygonCoordinates?: { lat: number; lng: number }[]
  supervisor?: string
  projectId?: string
}

export interface LiveBleWorker {
  id: string
  name: string
  department: string
  position: string
  role?: string
  latitude: number
  longitude: number
  pulse: number
  battery: number
  hasHelmet: boolean
  inDanger: boolean
  currentZoneName: string
  currentZoneType: string | null
}

export interface ActiveRadarPersonnel {
  id: string
  name?: string
  firstName?: string
  lastName?: string
  department?: string
  position?: string
  lastKnownLat: number | null
  lastKnownLng: number | null
  role?: string
  pulse?: number
  battery?: number
  hasHelmet?: boolean
  inDanger?: boolean
  currentZoneName?: string
  currentZoneType?: string | null
}

export interface GeofenceZoneItem {
  id: string
  name?: string
  title?: string
  type?: string
  zoneType?: string
  coordinates?: any
  polygonCoordinates?: { lat: number; lng: number }[]
  supervisor?: string
  projectId?: string
}

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

export interface BleEquipmentMapProps {
  center: [number, number]
  zoom?: number
  equipments: BleEquipment[]
  siteZones?: BleSiteZone[]
  zones?: GeofenceZoneItem[]
  activeRadars?: ActiveRadarPersonnel[]
  projects?: ProjectItem[]
  highlightedId?: string | null
  searchQuery?: string
  onSelectEquipment?: (equipment: BleEquipment) => void
  onSelectProject?: (project: ProjectItem) => void
  onDeleteZone?: (zoneId: string) => void
  selectedProjectName?: string
  // Drawing mode props
  isDrawing?: boolean
  drawShape?: "POLYGON" | "POLYLINE"
  drawZoneType?: "MAIN_SITE" | "DANGER_ZONE" | "REST_AREA"
  drawingPoints?: { lat: number; lng: number }[]
  onAddDrawingPoint?: (pt: { lat: number; lng: number }) => void
  onFinishDrawing?: () => void
}

const ZONE_COLORS: Record<string, { stroke: string; fill: string; opacity: number; title: string }> = {
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
  },
  POLYLINE: {
    stroke: '#f59e0b',
    fill: '#f59e0b',
    opacity: 0.6,
    title: 'Yatay Hat (Boru/Yol)'
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
        duration: 1.5,
        easeLinearity: 0.25
      })
    } else if (center && center[0] && center[1]) {
      map.flyTo(center, zoom, {
        animate: true,
        duration: 1.8,
        easeLinearity: 0.25
      })
    }
  }, [map, center, zoom, targetPoint])

  return null
}

// Drawing Click Event Handler
function MapDrawingEvents({
  isDrawing,
  onAddPoint,
  onClosePolygon,
  drawingPoints
}: {
  isDrawing: boolean
  onAddPoint: (pt: { lat: number; lng: number }) => void
  onClosePolygon: () => void
  drawingPoints: { lat: number; lng: number }[]
}) {
  useMapEvents({
    click(e) {
      if (!isDrawing) return
      // If closing polygon
      if (drawingPoints.length >= 3) {
        const first = drawingPoints[0]
        const dLat = Math.abs(e.latlng.lat - first.lat)
        const dLng = Math.abs(e.latlng.lng - first.lng)
        if (dLat < 0.0003 && dLng < 0.0003) {
          onClosePolygon()
          return
        }
      }
      onAddPoint({ lat: e.latlng.lat, lng: e.latlng.lng })
    }
  })
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
  zoom = 5,
  equipments,
  siteZones = [],
  zones = [],
  activeRadars = [],
  projects = [],
  highlightedId,
  searchQuery = "",
  onSelectEquipment,
  onSelectProject,
  onDeleteZone,
  selectedProjectName = "Genel Şantiye Haritası",
  isDrawing = false,
  drawShape = "POLYGON",
  drawZoneType = "MAIN_SITE",
  drawingPoints = [],
  onAddDrawingPoint,
  onFinishDrawing
}: BleEquipmentMapProps) {
  const { resolvedTheme } = useTheme()
  const isDark = resolvedTheme === "dark"
  const isSearchActive = searchQuery.trim().length > 0
  const normalizedQuery = searchQuery.trim().toLowerCase()

  // iOS Style Overlay Popup State (No more Leaflet default balloon popups!)
  const [popupState, setPopupState] = useState<{
    isOpen: boolean
    type: IosPopupType
    projectData?: IosProjectData | null
    markerData?: IosMarkerData | null
    zoneData?: IosZoneData | null
  }>({
    isOpen: false,
    type: "PROJECT"
  })

  // Unified Poligon Sanal Çitler & Polylines
  const allZones = useMemo<BleSiteZone[]>(() => {
    const res: BleSiteZone[] = []
    const seen = new Set<string>()

    if (Array.isArray(siteZones)) {
      for (const sz of siteZones) {
        if (!seen.has(sz.id)) {
          seen.add(sz.id)
          res.push(sz)
        }
      }
    }

    if (Array.isArray(zones)) {
      for (const z of zones) {
        if (!seen.has(z.id)) {
          seen.add(z.id)
          let coords: { lat: number; lng: number }[] | undefined = undefined
          const raw = z.polygonCoordinates || z.coordinates
          if (typeof raw === "string") {
            try {
              const parsed = JSON.parse(raw)
              if (Array.isArray(parsed)) {
                coords = parsed
              } else if (parsed && parsed.type === "Feature" && parsed.geometry?.coordinates) {
                const gCoords = parsed.geometry.coordinates
                if (parsed.geometry.type === "Polygon") {
                  coords = gCoords[0]?.map((c: any) => ({ lat: c[1], lng: c[0] }))
                } else if (parsed.geometry.type === "LineString") {
                  coords = gCoords?.map((c: any) => ({ lat: c[1], lng: c[0] }))
                }
              }
            } catch {}
          } else if (Array.isArray(raw)) {
            coords = raw
          } else if (raw && typeof raw === "object") {
            if (raw.type === "Feature" && raw.geometry?.coordinates) {
              const gCoords = raw.geometry.coordinates
              if (raw.geometry.type === "Polygon") {
                coords = gCoords[0]?.map((c: any) => ({ lat: c[1], lng: c[0] }))
              } else if (raw.geometry.type === "LineString") {
                coords = gCoords?.map((c: any) => ({ lat: c[1], lng: c[0] }))
              }
            } else if (raw.coordinates && Array.isArray(raw.coordinates)) {
              coords = raw.coordinates
            }
          }

          let zType = (z.zoneType || z.type || "MAIN_SITE").toUpperCase()
          if (zType.includes("POLYLINE") || zType.includes("LINE")) zType = "POLYLINE"
          else if (zType.includes("DANGER") || zType.includes("RISK")) zType = "DANGER_ZONE"
          else if (zType.includes("REST")) zType = "REST_AREA"
          else zType = "MAIN_SITE"

          res.push({
            id: z.id,
            title: z.title || z.name || (zType === "POLYLINE" ? "Yatay Hat" : "Sanal Çit"),
            zoneType: zType,
            polygonCoordinates: coords,
            supervisor: z.supervisor,
            projectId: z.projectId
          })
        }
      }
    }

    return res
  }, [siteZones, zones])

  // Live BLE Workers State
  const [liveWorkers, setLiveWorkers] = useState<LiveBleWorker[]>([])

  // Initialize real workers from activeRadars
  useEffect(() => {
    if (!activeRadars || activeRadars.length === 0) {
      setLiveWorkers([])
      return
    }

    const initialWorkers: LiveBleWorker[] = activeRadars
      .filter((r) => r.lastKnownLat != null && r.lastKnownLng != null)
      .map((r, idx) => {
        const displayName =
          r.name ||
          (r.firstName && r.lastName ? `${r.firstName} ${r.lastName}` : `Personel #${idx + 1}`)

        const lat = r.lastKnownLat!
        const lng = r.lastKnownLng!

        // Turf calculation for zone detection
        const pt = turf.point([lng, lat])
        let detectedZone: BleSiteZone | null = null

        for (const zone of allZones) {
          if (zone.polygonCoordinates && zone.polygonCoordinates.length >= 3 && zone.zoneType !== "POLYLINE") {
            const poly = toTurfPolygon(zone.polygonCoordinates)
            if (poly && turf.booleanPointInPolygon(pt, poly)) {
              detectedZone = zone
              break
            }
          }
        }

        return {
          id: r.id,
          name: displayName,
          department: r.department || "Saha Operasyon",
          position: r.position || r.role || "Saha Personeli",
          role: r.role,
          latitude: lat,
          longitude: lng,
          pulse: r.pulse ?? 76,
          battery: r.battery ?? 88,
          hasHelmet: r.hasHelmet ?? true,
          inDanger: detectedZone?.zoneType === "DANGER_ZONE",
          currentZoneName: detectedZone ? detectedZone.title : "Genel Saha",
          currentZoneType: detectedZone ? detectedZone.zoneType : null
        }
      })

    setLiveWorkers(initialWorkers)
  }, [activeRadars, allZones])

  // Pulse & telemetry timer with proper unmount cleanup
  useEffect(() => {
    if (liveWorkers.length === 0) return

    const interval = setInterval(() => {
      setLiveWorkers((prev) =>
        prev.map((w) => {
          const newLat = w.latitude + (Math.random() - 0.5) * 0.00003
          const newLng = w.longitude + (Math.random() - 0.5) * 0.00003
          const newPulse = Math.max(68, Math.min(125, w.pulse + (Math.random() > 0.5 ? 1 : -1)))

          const pt = turf.point([newLng, newLat])
          let detectedZone: BleSiteZone | null = null

          for (const zone of allZones) {
            if (zone.polygonCoordinates && zone.polygonCoordinates.length >= 3 && zone.zoneType !== "POLYLINE") {
              const poly = toTurfPolygon(zone.polygonCoordinates)
              if (poly && turf.booleanPointInPolygon(pt, poly)) {
                detectedZone = zone
                break
              }
            }
          }

          return {
            ...w,
            latitude: newLat,
            longitude: newLng,
            pulse: newPulse,
            inDanger: detectedZone?.zoneType === "DANGER_ZONE",
            currentZoneName: detectedZone ? detectedZone.title : "Genel Şantiye Sahası",
            currentZoneType: detectedZone ? detectedZone.zoneType : null
          }
        })
      )
    }, 4000)

    return () => clearInterval(interval)
  }, [liveWorkers.length, allZones])

  // Filter equipments
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

  // Focused target point
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

  // Role icon resolver
  const getMarkerIcon = (item: { role?: string; position?: string; department?: string; category?: string; type?: string; name: string }) => {
    const role = resolveMarkerRole(item)
    switch (role) {
      case "ENGINEER":
        return createEngineerDivIcon(item.name)
      case "DRIVER":
        return createDriverDivIcon(item.name)
      case "STORAGE":
        return createStorageDivIcon(item.name)
      case "ISG":
        return createIsgDivIcon(item.name)
      default:
        return createEngineerDivIcon(item.name)
    }
  }

  return (
    <div className="relative w-full h-full bg-slate-950 overflow-hidden rounded-xl border border-slate-800 z-0">
      {/* iOS Frosted Glass Popup Overlay */}
      <IosMapPopup
        isOpen={popupState.isOpen}
        onClose={() => setPopupState((prev) => ({ ...prev, isOpen: false }))}
        type={popupState.type}
        projectData={popupState.projectData}
        markerData={popupState.markerData}
        zoneData={popupState.zoneData}
        onFlyTo={(coords) => {
          if (onSelectProject && popupState.projectData) {
            onSelectProject(popupState.projectData as any)
          }
        }}
        onDeleteZone={onDeleteZone}
      />

      <MapContainer
        center={center}
        zoom={zoom}
        maxZoom={22}
        style={{ height: "100%", width: "100%" }}
        className={`z-0 h-full w-full ${isDrawing ? "cursor-crosshair" : ""}`}
        scrollWheelZoom={true}
      >
        {/* Dynamic Theme Tiles: CartoDB Dark Matter for Dark Mode / CartoDB Positron for Light Mode */}
        {isDark ? (
          <TileLayer
            key="carto-dark-matter"
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
            subdomains="abcd"
            maxZoom={20}
          />
        ) : (
          <TileLayer
            key="carto-positron"
            url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
            subdomains="abcd"
            maxZoom={20}
          />
        )}

        {/* Esri Hybrid Reference Overlay */}
        <TileLayer
          url="https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}"
          attribution='&copy; <a href="https://www.esri.com/">Esri</a>'
          maxNativeZoom={18}
          maxZoom={22}
        />

        {/* Dynamic View Controller */}
        <MapViewController center={center} zoom={zoom} targetPoint={targetPoint} />

        {/* Drawing Events Listener */}
        {isDrawing && onAddDrawingPoint && (
          <MapDrawingEvents
            isDrawing={isDrawing}
            onAddPoint={onAddDrawingPoint}
            onClosePolygon={() => {
              if (onFinishDrawing) onFinishDrawing()
            }}
            drawingPoints={drawingPoints}
          />
        )}

        {/* 1. All Projects Markers (Türkiye / Bölge Geneli Harita Görünümü) */}
        {projects.map((proj) => {
          if (!proj.latitude || !proj.longitude) return null
          return (
            <Marker
              key={proj.id}
              position={[proj.latitude, proj.longitude]}
              icon={createProjectPinIcon(proj.title || proj.name || "Şantiye")}
              eventHandlers={{
                click: () => {
                  setPopupState({
                    isOpen: true,
                    type: "PROJECT",
                    projectData: {
                      id: proj.id,
                      title: proj.title || proj.name || "Şantiye",
                      name: proj.name || proj.title || "",
                      city: proj.city || "",
                      district: proj.district || "",
                      activeWorkers: proj.activeWorkers || 0,
                      totalBlocks: proj.totalBlocks || 0,
                      healthScore: proj.healthScore || 0,
                      progress: proj.progress || 0,
                      latitude: proj.latitude,
                      longitude: proj.longitude
                    }
                  })
                  if (onSelectProject) onSelectProject(proj)
                }
              }}
            />
          )
        })}

        {/* 2. Poligon Sanal Çitler & Polyline Yatay Hatlar */}
        {allZones.map((zone) => {
          if (!zone.polygonCoordinates || zone.polygonCoordinates.length < 2) return null
          const isPoly = zone.zoneType === "POLYLINE"
          const cfg = ZONE_COLORS[zone.zoneType] || ZONE_COLORS.MAIN_SITE
          const positions: [number, number][] = zone.polygonCoordinates.map((c) => [c.lat, c.lng])

          // ADIM 2 FIX: When isDrawing is true, interactive is set to false so clicking inside an existing polygon passes to the map drawer!
          if (isPoly) {
            return (
              <Polyline
                key={zone.id}
                positions={positions}
                pathOptions={{
                  color: "#f59e0b",
                  weight: 4.5,
                  dashArray: "6, 6",
                  interactive: !isDrawing
                }}
                eventHandlers={{
                  click: (e) => {
                    L.DomEvent.stopPropagation(e as any)
                    if (isDrawing) return
                    setPopupState({
                      isOpen: true,
                      type: "POLYLINE",
                      zoneData: {
                        id: zone.id,
                        title: zone.title,
                        type: "POLYLINE",
                        projectId: zone.projectId,
                        pointsCount: zone.polygonCoordinates?.length || 0,
                        supervisor: zone.supervisor,
                        isPolyline: true
                      }
                    })
                  }
                }}
              />
            )
          }

          if (zone.polygonCoordinates.length >= 3) {
            return (
              <LeafletPolygon
                key={zone.id}
                positions={positions}
                pathOptions={{
                  color: cfg.stroke,
                  fillColor: cfg.fill,
                  fillOpacity: cfg.opacity,
                  weight: 2,
                  interactive: !isDrawing
                }}
                eventHandlers={{
                  click: (e) => {
                    L.DomEvent.stopPropagation(e as any)
                    if (isDrawing) return
                    setPopupState({
                      isOpen: true,
                      type: "ZONE_POLYGON",
                      zoneData: {
                        id: zone.id,
                        title: zone.title,
                        type: zone.zoneType,
                        projectId: zone.projectId,
                        pointsCount: zone.polygonCoordinates?.length || 0,
                        supervisor: zone.supervisor,
                        isPolyline: false
                      }
                    })
                  }
                }}
              />
            )
          }

          return null
        })}

        {/* 3. Canlı BLE Personeller (Mühendis, Şoför, İSG, İşçi) */}
        {liveWorkers.map((worker) => {
          const roleType = resolveMarkerRole(worker)
          const markerIcon = getMarkerIcon(worker)

          return (
            <Marker
              key={worker.id}
              position={[worker.latitude, worker.longitude]}
              icon={markerIcon}
              eventHandlers={{
                click: () => {
                  setPopupState({
                    isOpen: true,
                    type: "WORKER",
                    markerData: {
                      id: worker.id,
                      name: worker.name,
                      roleType,
                      roleTitle: worker.position,
                      department: worker.department,
                      latitude: worker.latitude,
                      longitude: worker.longitude,
                      pulse: worker.pulse,
                      battery: worker.battery,
                      hasHelmet: worker.hasHelmet,
                      inDanger: worker.inDanger,
                      zoneName: worker.currentZoneName
                    }
                  })
                }
              }}
            />
          )
        })}

        {/* 4. Canlı BLE Demirbaşlar & Ekipmanlar (Ambar, Depo, Araç) */}
        {visibleEquipments.map((eq) => {
          const roleType = resolveMarkerRole(eq)
          const eqIcon = getMarkerIcon(eq)

          return (
            <Marker
              key={eq.id}
              position={[eq.latitude, eq.longitude]}
              icon={eqIcon}
              eventHandlers={{
                click: () => {
                  setPopupState({
                    isOpen: true,
                    type: "EQUIPMENT",
                    markerData: {
                      id: eq.id,
                      name: eq.name,
                      roleType,
                      roleTitle: eq.category || eq.type,
                      department: eq.assignedTo?.department,
                      bleTagId: eq.bleTagId,
                      serialNumber: eq.serialNumber,
                      latitude: eq.latitude,
                      longitude: eq.longitude,
                      status: eq.status,
                      assignedTo: eq.assignedTo?.name
                    }
                  })
                  if (onSelectEquipment) onSelectEquipment(eq)
                }
              }}
            />
          )
        })}

        {/* 5. Çizim Modu Önizleme (Active Drawing Points & Guides) */}
        {isDrawing && drawingPoints.length > 0 && (
          <>
            <Polyline
              positions={drawingPoints.map((p) => [p.lat, p.lng])}
              pathOptions={{
                color: drawShape === "POLYLINE" ? "#f59e0b" : ZONE_COLORS[drawZoneType]?.stroke || "#2563eb",
                weight: drawShape === "POLYLINE" ? 4 : 2.5,
                dashArray: "5, 5"
              }}
            />

            {drawShape === "POLYGON" && drawingPoints.length >= 3 && (
              <LeafletPolygon
                positions={drawingPoints.map((p) => [p.lat, p.lng])}
                pathOptions={{
                  color: ZONE_COLORS[drawZoneType]?.stroke || "#2563eb",
                  fillColor: ZONE_COLORS[drawZoneType]?.fill || "#3b82f6",
                  fillOpacity: 0.25,
                  weight: 2
                }}
              />
            )}

            {drawingPoints.map((pt, idx) => (
              <CircleMarker
                key={idx}
                center={[pt.lat, pt.lng]}
                radius={idx === 0 ? 8 : 4}
                pathOptions={{
                  color: idx === 0 ? "#10b981" : "#ffffff",
                  fillColor: idx === 0 ? "#10b981" : "#3b82f6",
                  fillOpacity: 1,
                  weight: 2
                }}
              />
            ))}
          </>
        )}
      </MapContainer>
    </div>
  )
}
