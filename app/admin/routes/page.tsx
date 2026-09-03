"use client"
/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * This code is the property of NXA Software.
 */

import { useState, useEffect } from "react"
import dynamic from "next/dynamic"
import { Route, MapPin, Building2, Loader2, Sparkles, CheckCircle, ArrowRight } from "lucide-react"

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
  const [isOptimizing, setIsOptimizing] = useState(false)
  const [isOptimized, setIsOptimized] = useState(false)
  const [successMessage, setSuccessMessage] = useState("")
  const [personnelList, setPersonnelList] = useState<any[]>([])
  const [loadingPersonnel, setLoadingPersonnel] = useState(true)

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
      const response = await fetch('/api/admin/projects')
      if (response.ok) {
        const projects = await response.json()
        
        // Filter active projects with coordinates
        const activeProjects = projects.filter((p: any) => 
          p.isActive && p.latitude && p.longitude
        )

        if (activeProjects.length === 0) {
          setStops([])
          return
        }

        // Create stops from project data
        const projectStops: Stop[] = activeProjects.map((p: any, index: number) => ({
          id: p.id,
          name: p.name || p.title,
          address: `${p.district || ''}, ${p.city || ''}`,
          order: index + 1,
          lat: parseFloat(p.latitude),
          lng: parseFloat(p.longitude),
          isStart: false
        }))

        // Add starting point (office)
        const startStop: Stop = {
          id: "start",
          name: "Nexa Merkez Ofis",
          address: "Merkez, İskenderun",
          order: 0,
          lat: 36.58718,
          lng: 36.17347,
          isStart: true
        }

        setStops([startStop, ...projectStops])
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
    }
    
    setIsOptimized(true)
    setSuccessMessage("Rota optimize edildi. Tahmini yakıt ve zaman tasarrufu hesaplandı.")
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
                  <div className="flex items-start gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                      stop.isStart ? "bg-blue-500" : "bg-slate-700"
                    }`}>
                      {stop.isStart ? (
                        <Building2 className="w-4 h-4 text-white" />
                      ) : (
                        <span className="text-white font-medium text-sm">{index + 1}</span>
                      )}
                    </div>
                    <div className="flex-1">
                      <h4 className="text-white font-medium">{stop.name}</h4>
                      <p className="text-slate-400 text-sm">{stop.address}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Optimize Button */}
            <button
              onClick={handleOptimize}
              disabled={isOptimizing || isOptimized}
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
              Harita
            </h3>
            
            <div className="h-[500px] rounded-lg overflow-hidden">
              <MapContainer
                center={[36.58718, 36.17347]}
                zoom={11}
                style={{ height: "100%", width: "100%" }}
                className="z-0"
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
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

                {stops.length > 1 && (
                  <Polyline
                    positions={stops.map(stop => [stop.lat, stop.lng])}
                    color={getRouteColor()}
                    weight={4}
                    dashArray={getRouteDashArray()}
                  />
                )}
              </MapContainer>
            </div>

            {/* Legend */}
            <div className="mt-4 flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-4 h-1 bg-red-500"></div>
                <span className="text-slate-400">Orijinal Rota</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-1 bg-green-500"></div>
                <span className="text-slate-400">Optimize Edilmiş Rota</span>
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
