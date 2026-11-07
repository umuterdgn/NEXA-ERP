"use client"
/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Nexa ERP - Web Portalları Görev Mini Haritası (TaskMiniMapWeb)
 * 
 * Personel veya taşeron bir iş emrine tıkladığında görevin bağlı olduğu
 * poligon veya çizgiyi (Polyline) görselleştiren vektörel GIS mini haritası.
 */

import React, { useMemo, useState } from "react"
import { MapPin, Navigation, Maximize2, ShieldAlert, Sparkles, Layers } from "lucide-react"

export interface LatLng {
  lat?: number
  lng?: number
  latitude?: number
  longitude?: number
}

export interface TaskMiniMapWebProps {
  taskTitle?: string
  taskCode?: string
  zoneName?: string
  zoneType?: "POLYGON" | "POLYLINE" | "DANGER_ZONE" | "MAIN_SITE" | string
  coordinates?: any
  height?: number
  showControls?: boolean
}

export default function TaskMiniMapWeb({
  taskTitle = "İş Emri",
  taskCode,
  zoneName = "Blok Sahası",
  zoneType = "POLYGON",
  coordinates,
  height = 190,
  showControls = true,
}: TaskMiniMapWebProps) {
  const [zoomLevel, setZoomLevel] = useState<number>(1)
  const [viewMode, setViewMode] = useState<"vector" | "satellite">("vector")

  // Koordinatları normalize et
  const normalizedCoords = useMemo(() => {
    if (!coordinates) return []
    let raw = coordinates
    if (typeof raw === "string") {
      try {
        raw = JSON.parse(raw)
      } catch {
        return []
      }
    }
    if (Array.isArray(raw) && Array.isArray(raw[0]) && Array.isArray(raw[0][0])) {
      raw = raw[0]
    }
    if (!Array.isArray(raw)) return []

    const pts: { lat: number; lng: number }[] = []
    for (const item of raw) {
      if (Array.isArray(item) && item.length >= 2) {
        pts.push({ lng: Number(item[0]), lat: Number(item[1]) })
      } else if (item && typeof item === "object") {
        const lat = Number(item.lat ?? item.latitude)
        const lng = Number(item.lng ?? item.longitude)
        if (!isNaN(lat) && !isNaN(lng)) {
          pts.push({ lat, lng })
        }
      }
    }
    return pts
  }, [coordinates])

  const isPolyline =
    zoneType === "POLYLINE" ||
    (normalizedCoords.length >= 2 && normalizedCoords.length <= 3 && zoneType !== "DANGER_ZONE")

  const isDanger = zoneType === "DANGER_ZONE"

  // Bounding box ve projeksiyon hesaplama (SVG 600x300 viewBox)
  const svgProjection = useMemo(() => {
    const defaultBox = {
      pointsSvg: "150,80 450,70 420,230 180,240",
      centerSvg: { x: 300, y: 155 },
      centerLatLng: { lat: 36.5878, lng: 36.1735 },
    }

    if (normalizedCoords.length === 0) return defaultBox

    let minLat = normalizedCoords[0].lat
    let maxLat = normalizedCoords[0].lat
    let minLng = normalizedCoords[0].lng
    let maxLng = normalizedCoords[0].lng

    for (const pt of normalizedCoords) {
      if (pt.lat < minLat) minLat = pt.lat
      if (pt.lat > maxLat) maxLat = pt.lat
      if (pt.lng < minLng) minLng = pt.lng
      if (pt.lng > maxLng) maxLng = pt.lng
    }

    const latSpan = Math.max(0.0004, maxLat - minLat)
    const lngSpan = Math.max(0.0004, maxLng - minLng)

    const padding = 65
    const width = 600 - padding * 2
    const height = 300 - padding * 2

    const svgPoints = normalizedCoords
      .map((pt) => {
        const x = padding + ((pt.lng - minLng) / lngSpan) * width
        const y = padding + (1 - (pt.lat - minLat) / latSpan) * height
        return `${Math.round(x)},${Math.round(y)}`
      })
      .join(" ")

    const centerLat = (minLat + maxLat) / 2
    const centerLng = (minLng + maxLng) / 2
    const centerX = padding + ((centerLng - minLng) / lngSpan) * width
    const centerY = padding + (1 - (centerLat - minLat) / latSpan) * height

    return {
      pointsSvg: svgPoints,
      centerSvg: { x: Math.round(centerX), y: Math.round(centerY) },
      centerLatLng: { lat: centerLat, lng: centerLng },
    }
  }, [normalizedCoords])

  return (
    <div
      style={{ height }}
      className="relative w-full rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 shadow-inner select-none transition-all"
    >
      {/* Vektörel Harita Altlığı SVG */}
      <svg
        viewBox="0 0 600 300"
        className="w-full h-full object-cover transition-transform duration-300"
        style={{ transform: `scale(${zoomLevel})` }}
      >
        <defs>
          {/* Grid Arka Plan Deseni */}
          <pattern id="grid" width="30" height="30" patternUnits="userSpaceOnUse">
            <path
              d="M 30 0 L 0 0 0 30"
              fill="none"
              stroke={viewMode === "satellite" ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.04)"}
              strokeWidth="0.8"
            />
          </pattern>

          {/* Poligon Radyal Gradyan */}
          <radialGradient id="polyGradBlue" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#0284C7" stopOpacity="0.15" />
          </radialGradient>

          <radialGradient id="polyGradDanger" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#EF4444" stopOpacity="0.45" />
            <stop offset="100%" stopColor="#991B1B" stopOpacity="0.2" />
          </radialGradient>

          <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Zemin / Grid */}
        <rect
          width="600"
          height="300"
          fill={viewMode === "satellite" ? "#0b1220" : "#080c16"}
        />
        <rect width="600" height="300" fill="url(#grid)" />

        {/* Şantiye Kontur Çizgileri */}
        <path
          d="M 40,240 Q 200,280 400,210 T 560,120"
          fill="none"
          stroke="rgba(255,255,255,0.03)"
          strokeWidth="1.5"
          strokeDasharray="4,4"
        />
        <path
          d="M 80,60 Q 280,30 520,80"
          fill="none"
          stroke="rgba(255,255,255,0.03)"
          strokeWidth="1.5"
        />

        {/* Poligon veya Çizgi Çizimi */}
        {isPolyline ? (
          <polyline
            points={svgProjection.pointsSvg}
            fill="none"
            stroke="#F59E0B"
            strokeWidth="4"
            strokeDasharray="8,5"
            filter="url(#glow)"
          />
        ) : (
          <polygon
            points={svgProjection.pointsSvg}
            fill={isDanger ? "url(#polyGradDanger)" : "url(#polyGradBlue)"}
            stroke={isDanger ? "#EF4444" : "#38BDF8"}
            strokeWidth="2.5"
            strokeLinejoin="round"
            filter="url(#glow)"
          />
        )}

        {/* Poligon Köşe Noktaları */}
        {svgProjection.pointsSvg.split(" ").map((ptStr, idx) => {
          const [cx, cy] = ptStr.split(",").map(Number)
          if (isNaN(cx) || isNaN(cy)) return null
          return (
            <circle
              key={idx}
              cx={cx}
              cy={cy}
              r="3.5"
              fill="#FFFFFF"
              stroke={isDanger ? "#EF4444" : "#0284C7"}
              strokeWidth="1.5"
            />
          )
        })}

        {/* Merkez Pin & Titreşim Çemberi */}
        <g transform={`translate(${svgProjection.centerSvg.x}, ${svgProjection.centerSvg.y})`}>
          <circle
            r="16"
            fill={isDanger ? "rgba(239, 68, 68, 0.25)" : "rgba(56, 189, 248, 0.25)"}
            className="animate-ping"
          />
          <circle
            r="8"
            fill={isDanger ? "#EF4444" : "#0284C7"}
            stroke="#FFFFFF"
            strokeWidth="2"
          />
        </g>
      </svg>

      {/* Üst Sol Başlık Rozeti */}
      <div className="absolute top-2.5 left-2.5 bg-slate-900/90 backdrop-blur-md px-2.5 py-1.5 rounded-xl border border-slate-700/60 shadow-lg flex items-center gap-2">
        <div
          className={`w-2 h-2 rounded-full ${
            isDanger ? "bg-red-500 animate-pulse" : isPolyline ? "bg-amber-400" : "bg-sky-400"
          }`}
        />
        <div className="text-left">
          <p className="text-[10px] font-bold tracking-wider uppercase text-slate-400 leading-none">
            {isDanger ? "⚠️ Riskli Saha Poligonu" : isPolyline ? "📐 Yatay Proje (Polyline)" : "📍 Görev Sahası (GIS)"}
          </p>
          <p className="text-xs font-semibold text-white leading-tight mt-0.5 max-w-[200px] truncate">
            {zoneName}
          </p>
        </div>
      </div>

      {/* Üst Sağ Koordinat & Mod Kontrolü */}
      {showControls && (
        <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5">
          <button
            onClick={() => setViewMode(viewMode === "vector" ? "satellite" : "vector")}
            className="px-2 py-1 rounded-lg bg-slate-900/90 backdrop-blur-md border border-slate-700/60 text-[10px] font-medium text-slate-300 hover:text-white transition flex items-center gap-1"
          >
            <Layers className="w-3 h-3 text-sky-400" />
            {viewMode === "vector" ? "Vektör" : "Uydu"}
          </button>

          <button
            onClick={() => setZoomLevel((z) => (z === 1 ? 1.35 : 1))}
            className="p-1 rounded-lg bg-slate-900/90 backdrop-blur-md border border-slate-700/60 text-slate-300 hover:text-white transition"
            title="Yakınlaştır / Sıfırla"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Alt Bilgi Çubuğu */}
      <div className="absolute bottom-2 left-2.5 right-2.5 flex items-center justify-between text-[10px] text-slate-400 pointer-events-none">
        <span className="bg-slate-900/80 backdrop-blur-sm px-2 py-0.5 rounded-md border border-slate-800 font-mono">
          {svgProjection.centerLatLng.lat.toFixed(4)}°N, {svgProjection.centerLatLng.lng.toFixed(4)}°E
        </span>
        <span className="bg-slate-900/80 backdrop-blur-sm px-2 py-0.5 rounded-md border border-slate-800">
          {normalizedCoords.length > 0 ? `${normalizedCoords.length} Köşe Noktası` : "Saha Çiti"}
        </span>
      </div>
    </div>
  )
}

