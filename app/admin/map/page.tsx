"use client"
/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * This code is the property of NXA Software.
 */

"use client"

import { useState, useEffect } from "react"
import dynamic from "next/dynamic"
import { MapPin, AlertTriangle, Clock, CheckCircle, Loader2 } from "lucide-react"

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

interface Project {
  id: string
  name: string
  yibfNo: string | null
  healthScore: number | null
  progress: number | null
  address: string | null
  latitude: number | null
  longitude: number | null
  _count?: {
    deficiencies?: number
  }
}

export default function MapPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let isActive = true

    const loadProjects = async () => {
      try {
        const response = await fetch('/api/admin/projects')
        if (!isActive) return

        if (response.ok) {
          const data = await response.json()
          setProjects(data)
        } else {
          setProjects([])
        }
      } catch (error) {
        if (!isActive) return
        console.error('Failed to fetch projects:', error)
        setProjects([])
      } finally {
        if (isActive) {
          setLoading(false)
        }
      }
    }

    void loadProjects()
    return () => {
      isActive = false
    }
  }, [])

  const getHealthStatus = (project: Project) => {
    const healthScore = project.healthScore || 0
    const openDeficiencies = project._count?.deficiencies || 0
    
    if (healthScore < 50 || openDeficiencies > 5) return 'critical'
    if (healthScore < 80) return 'warning'
    return 'normal'
  }

  const getPinColor = (status: string) => {
    switch (status) {
      case 'critical': return '#ef4444'
      case 'warning': return '#f97316'
      case 'normal': return '#22c55e'
      default: return '#64748b'
    }
  }

  const getPinIcon = (status: string) => {
    switch (status) {
      case 'critical': return <AlertTriangle className="w-4 h-4" />
      case 'warning': return <Clock className="w-4 h-4" />
      case 'normal': return <CheckCircle className="w-4 h-4" />
      default: return <MapPin className="w-4 h-4" />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'critical': return 'bg-red-100 text-red-700'
      case 'warning': return 'bg-orange-100 text-orange-700'
      case 'normal': return 'bg-green-100 text-green-700'
      default: return 'bg-slate-100 text-slate-700'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'critical': return 'Kritik'
      case 'warning': return 'Takip'
      case 'normal': return 'Normal'
      default: return 'Bilinmiyor'
    }
  }

  if (loading) {
    return (
      <div className="p-6 h-screen flex flex-col items-center justify-center">
        <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
        <p className="text-slate-400 mt-4">Harita yükleniyor...</p>
      </div>
    )
  }

  return (
    <div className="p-6 h-screen flex flex-col">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white flex items-center gap-3">
          <MapPin className="w-8 h-8 text-blue-400" />
          Şantiye Haritası
        </h1>
        <p className="text-slate-400 mt-1">YİBF durumlarına göre coğrafi dağılım</p>
      </div>

      {/* Legend */}
      <div className="flex gap-4 mb-4">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-red-500 rounded-full" />
          <span className="text-sm text-slate-300">Kritik (Health &lt; 50)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-orange-500 rounded-full" />
          <span className="text-sm text-slate-300">Takip (Health 50-79)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-green-500 rounded-full" />
          <span className="text-sm text-slate-300">Normal (Health 80-100)</span>
        </div>
      </div>

      {/* Map Container */}
      <div className="mobile-map-shell flex-1 border border-slate-700 bg-slate-800/50 md:flex-none">
        {projects.length === 0 ? (
          <div className="flex h-full min-h-[220px] items-center justify-center text-slate-400">
            Harita için gösterilecek proje verisi bulunamadı.
          </div>
        ) : typeof window !== 'undefined' && (
          <MapContainer
            center={[36.58718, 36.17347]} // İskenderun center
            zoom={11}
            style={{ height: '100%', width: '100%' }}
            className="z-0 h-full w-full"
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {projects
              .filter(p => p.latitude && p.longitude)
              .map((project) => {
                const status = getHealthStatus(project)
                return (
                  <Marker
                    key={project.id}
                    position={[project.latitude!, project.longitude!]}
                  >
                    <Popup>
                      <div className="p-2 min-w-[200px]">
                        <div className="flex items-center gap-2 mb-2">
                          <div 
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-white"
                            style={{ backgroundColor: getPinColor(status) }}
                          >
                            {getPinIcon(status)}
                          </div>
                          <div>
                            <h3 className="font-semibold text-slate-900">YİBF {project.yibfNo}</h3>
                            <p className="text-sm text-slate-600">{project.name}</p>
                          </div>
                        </div>

                        <div className="space-y-1 text-sm">
                          <div className="flex justify-between">
                            <span className="text-slate-600">Durum</span>
                            <span className={`px-2 py-0.5 rounded text-xs font-medium ${getStatusBadge(status)}`}>
                              {getStatusText(status)}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-600">Health Score</span>
                            <span className="font-medium text-slate-900">{project.healthScore || 0}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-600">İlerleme</span>
                            <span className="font-medium text-slate-900">%{project.progress || 0}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-600">Açık Eksiklik</span>
                            <span className="font-medium text-slate-900">{project._count?.deficiencies || 0}</span>
                          </div>
                          {project.address && (
                            <div className="flex justify-between">
                              <span className="text-slate-600">Adres</span>
                              <span className="font-medium text-slate-900 text-right max-w-[120px] truncate">
                                {project.address}
                              </span>
                            </div>
                          )}
                        </div>

                        <a
                          href={`/admin/projects/${project.id}`}
                          className="block w-full mt-3 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors text-sm text-center"
                        >
                          Dijital İkiz Görüntüle
                        </a>
                      </div>
                    </Popup>
                  </Marker>
                )
              })}
          </MapContainer>
        )}
      </div>
    </div>
  )
}
