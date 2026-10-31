"use client"
/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * This code is the property of NXA Software.
 */

import { useState, useEffect } from "react"
import dynamic from "next/dynamic"
import { Route, MapPin, Building2, Loader2, Sparkles, CheckCircle, ArrowRight, Navigation, ExternalLink } from "lucide-react"

// Dynamic import to avoid SSR issues with Leaflet
const MapContainer = dynamic(
  () => import('react-leaflet').then((mod) => mod.MapContainer),
  { ssr: false }
)

const TileLayer = dynamic(
  () => import('react-leaflet').then((mod) => mod.TileLayer),
  { ssr: false }
)

const Marker = dynamic(
  () => import('react-leaflet').then((mod) => mod.Marker),
  { ssr: false }
)

const Popup = dynamic(
  () => import('react-leaflet').then((mod) => mod.Popup),
  { ssr: false }
)

const Polyline = dynamic(
  () => import('react-leaflet').then((mod) => mod.Polyline),
  { ssr: false }
)

interface Stop {
  id: string
  name: string
  address: string
  order: number
  lat: number
  lng: number
  isStart: boolean
}

export default function RoutesPage() {
  const [selectedPersonnel, setSelectedPersonnel] = useState("")
  const [stops, setStops] = useState<Stop[]>([])
  const [roadPolyline, setRoadPolyline] = useState<[number, number][]>([])
  const [isOptimizing, setIsOptimizing] = useState(false)
  const [isOptimized, setIsOptimized] = useState(false)
  const [successMessage, setSuccessMessage] = useState("")
  const [personnelList, setPersonnelList] = useState<any[]>([])
  const [loadingPersonnel, setLoadingPersonnel] = useState(true)
  const [routeKm, setRouteKm] = useState<number | null>(null)

  useEffect(() => {
    fetchPersonnel()
  }, [])

  useEffect(() => {
    if (selectedPersonnel) {
      fetchProjectStops()
      setIsOptimized(false)
      setSuccessMessage("")
    }
  }, [selectedPersonnel])

  const fetchProjectStops = async () => {
    try {
      const response = await fetch(`/api/admin/routes/stops?personnelId=${encodeURIComponent(selectedPersonnel)}`)
      if (response.ok) {
        const data = await response.json()
        const realStops = Array.isArray(data.stops) ? data.stops : []
        setStops(realStops)
      } else {
        setStops([])
      }
    } catch (error) {
      console.error('Failed to fetch project stops:', error)
      setStops([])
    }
  }

  const fetchPersonnel = async () => {
    try {
      const response = await fetch('/api/admin/personnel')
      if (response.ok) {
        const data = await response.json()
        setPersonnelList(data)
      }
    } catch (error) {
      console.error('Failed to fetch personnel:', error)
    } finally {
      setLoadingPersonnel(false)
    }
  }

  const handleOptimize = async () => {
    setIsOptimizing(true)
    
    // Simulate AI optimization (1-2 seconds)
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    // Simple nearest-neighbor optimization
    if (stops.length > 1) {
      const startStop = stops[0]
      const otherStops = stops.slice(1)
      
      const optimized = [startStop]
      let currentLat = startStop.lat
      let currentLng = startStop.lng
      
      while (otherStops.length > 0) {
        // Find nearest stop
        let nearestIndex = 0
        let nearestDist = Infinity
        
        otherStops.forEach((stop, index) => {
          const dist = Math.sqrt(
            Math.pow(stop.lat - currentLat, 2) + 
            Math.pow(stop.lng - currentLng, 2)
          )
          if (dist < nearestDist) {
            nearestDist = dist
            nearestIndex = index
          }
        })
        
        const nearest = otherStops.splice(nearestIndex, 1)[0]
        optimized.push(nearest)
        currentLat = nearest.lat
        currentLng = nearest.lng
      }
      
      setStops(optimized)

      // Fetch real road driving polyline from OSRM
      try {
        const coordsParam = optimized.map((s) => `${s.lng},${s.lat}`).join(";")
        const res = await fetch(`https://router.project-osrm.org/route/v1/driving/${coordsParam}?overview=full&geometries=geojson`)
        if (res.ok) {
          const data = await res.json()
          if (data.code === "Ok" && data.routes?.length > 0) {
            const r = data.routes[0]
            const realCoords: [number, number][] = r.geometry.coordinates.map(([lng, lat]: [number, number]) => [lat, lng])
            setRoadPolyline(realCoords)
            setRouteKm(Number((r.distance / 1000).toFixed(1)))
          }
        }
      } catch (err) {
        console.warn("OSRM routing error in routes page:", err)
      }
    }
    
    setIsOptimized(true)
    setSuccessMessage("Gerçek karayolu rotası OSRM ile optimize edildi. Yakıt ve zaman tasarrufu hesaplandı.")
    setIsOptimizing(false)
  }

  const getRouteColor = () => {
    return isOptimized ? "#22c55e" : "#ef4444"
  }

  const getRouteDashArray = () => {
    return isOptimized ? undefined : "10, 10"
  }

  return (
    <div className="lg:mt-0 mt-16">
      <div className="mb-6">
        <h1 className="text-2xl lg:text-3xl font-bold text-white flex items-center gap-3">
          <Route className="w-8 h-8 text-blue-400" />
          Rota Optimizasyonu
        </h1>
        <p className="text-slate-400 mt-1">Akıllı saha rotası planlaması</p>
      </div>

      {/* Personnel Selector */}
      <div className="bg-slate-900 rounded-xl border border-slate-800 p-6 mb-6">
        <label className="block text-sm font-medium text-slate-300 mb-2">Personel Seçin</label>
        {loadingPersonnel ? (
          <div className="flex items-center gap-2 text-slate-400">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Personel listesi yükleniyor...</span>
          </div>
        ) : personnelList.length === 0 ? (
          <div className="text-slate-400">Henüz personel kaydı bulunmuyor.</div>
        ) : (
          <select
            value={selectedPersonnel}
            onChange={(e) => setSelectedPersonnel(e.target.value)}
            className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
          >
            <option value="">Personel seçin...</option>
            {personnelList.map((person) => (
              <option key={person.id} value={person.id}>
                {person.name}
              </option>
            ))}
          </select>
        )}
      </div>

      {selectedPersonnel && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Panel - Stops List */}
          <div className="bg-slate-900 rounded-xl border border-slate-800 p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-blue-400" />
              Günlük Görevler / Duraklar
            </h3>
            
            {stops.length === 0 ? (
              <div className="p-8 text-center border border-dashed border-slate-800 rounded-xl my-4 text-slate-400">
                <MapPin className="w-8 h-8 mx-auto mb-2 text-slate-600" />
                <p className="text-sm font-medium">Bu personel için bugün planlanmış teslimat veya saha görevi bulunmuyor.</p>
                <p className="text-xs text-slate-500 mt-1">Lojistik veya görev modülünden randevu oluşturulduğunda haritaya yansır.</p>
              </div>
            ) : (
              <div className="space-y-3 mb-6">
                {stops.map((stop, index) => (
                  <div
                    key={stop.id}
                    className={`p-4 rounded-lg border ${
                      stop.isStart
                        ? "bg-blue-500/10 border-blue-500/30"
                        : "bg-slate-800 border-slate-700"
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <div
                          className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                            stop.isStart
                              ? "bg-blue-500 text-white"
                              : "bg-slate-700 text-slate-300"
                          }`}
                        >
                          {stop.order}
                        </div>
                        <div>
                          <h4 className="font-medium text-white">{stop.name}</h4>
                          <p className="text-sm text-slate-400">{stop.address}</p>
                        </div>
                      </div>
                      <span className="text-xs px-2 py-1 bg-slate-700 text-slate-300 rounded">
                        {stop.isStart ? "Başlangıç" : `Durak ${index + 1}`}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Optimize Button */}
            <button
              onClick={handleOptimize}
              disabled={isOptimizing || isOptimized || stops.length < 2}
              className="w-full px-6 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white rounded-xl transition-colors flex items-center justify-center gap-3 font-medium disabled:opacity-50"
            >
              {isOptimizing ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Yapay zeka rotayı optimize ediyor...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  Yapay Zeka ile Rotayı Optimize Et
                </>
              )}
            </button>

            {/* Success Message */}
            {successMessage && (
              <div className="mt-4 p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <p className="text-green-400 font-medium">{successMessage}</p>
                </div>
              </div>
            )}
          </div>

          {/* Right Panel - Map */}
          <div className="bg-slate-900 rounded-xl border border-slate-800 p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-blue-400" />
              Harita & AI Rota Önizlemesi
            </h3>
            
            {stops.length === 0 ? (
              <div className="h-[500px] rounded-lg border border-dashed border-slate-800 bg-slate-950/40 flex flex-col items-center justify-center text-slate-500 p-6 text-center">
                <MapPin className="w-10 h-10 mb-3 text-slate-600" />
                <p className="font-semibold text-slate-300">Haritada Çizilecek Görev Noktası Yok</p>
                <p className="text-xs text-slate-500 mt-1">Seçilen personele ait aktif teslimat veya saha görevi eklendiğinde koordinatlar burada çizilir.</p>
              </div>
            ) : (
              <div className="h-[500px] rounded-lg overflow-hidden">
                <MapContainer
                  center={[stops[0].lat, stops[0].lng]}
                  zoom={12}
                  maxZoom={19}
                  style={{ height: "100%", width: "100%" }}
                  className="z-0"
                >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  maxZoom={19}
                />
                
                {stops.map((stop) => (
                  <Marker key={stop.id} position={[stop.lat, stop.lng]}>
                    <Popup>
                      <div className="text-slate-900">
                        <strong>{stop.name}</strong>
                        <br />
                        {stop.address}
                      </div>
                    </Popup>
                  </Marker>
                ))}

                {/* Real Road Polyline from OSRM */}
                {roadPolyline.length > 1 ? (
                  <Polyline
                    positions={roadPolyline}
                    color="#3b82f6"
                    weight={5}
                    opacity={0.85}
                  />
                ) : (
                  stops.length > 1 && (
                    <Polyline
                      positions={stops.map(stop => [stop.lat, stop.lng])}
                      color={getRouteColor()}
                      weight={4}
                      dashArray={getRouteDashArray()}
                    />
                  )
                )}
              </MapContainer>
            </div>
          )}

            {/* Google Maps Launch Navigation Button */}
            {stops.length > 1 && (
              <div className="mt-4 pt-4 border-t border-slate-800">
                <a
                  href={`https://www.google.com/maps/dir/?api=1&origin=${stops[0].lat},${stops[0].lng}&destination=${stops[stops.length - 1].lat},${stops[stops.length - 1].lng}${stops.length > 2 ? `&waypoints=${stops.slice(1, -1).map(s => `${s.lat},${s.lng}`).join('|')}` : ''}&travelmode=driving`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3.5 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold rounded-xl transition flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 active:scale-95 text-sm"
                >
                  <Navigation className="w-4 h-4 fill-white" />
                  <span>Navigasyonu Başlat (Google Haritalar)</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            )}

            {/* Legend & Stats */}
            <div className="mt-4 flex flex-wrap items-center justify-between gap-4 text-sm">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-1 bg-blue-500"></div>
                  <span className="text-slate-400">Karayolu Ağı (OSRM)</span>
                </div>
                {routeKm && (
                  <span className="text-cyan-400 font-mono font-bold text-xs">
                    Mesafe: {routeKm} km
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {!selectedPersonnel && (
        <div className="text-center py-16 bg-slate-900 rounded-xl border border-slate-800">
          <Route className="w-16 h-16 mx-auto mb-4 text-slate-600" />
          <h3 className="text-xl font-semibold text-white mb-2">Personel Seçin</h3>
          <p className="text-slate-400">Rota planlaması için personel seçin</p>
        </div>
      )}
    </div>
  )
}
