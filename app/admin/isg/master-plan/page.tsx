"use client"
/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * This code is the property of NXA Software.
 */


import { useState, useEffect } from "react"
import dynamic from "next/dynamic"
import { Map, ChevronDown, Navigation, NavigationOff } from "lucide-react"
import { useGeolocation } from "@/hooks/useGeolocation"

const SiteMasterPlan = dynamic(() => import("@/components/SiteMasterPlan"), { 
  ssr: false,
  loading: () => <div className="h-[600px] bg-slate-800 animate-pulse rounded-xl flex items-center justify-center text-slate-400">Harita yükleniyor...</div>
});

interface Project {
  id: string
  name: string
  title: string
  latitude: number | null
  longitude: number | null
  city: string | null
  district: string | null
}

export default function ISGMasterPlanPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)
  
  const geolocation = useGeolocation({
    enableHighAccuracy: true,
    timeout: 10000,
    maximumAge: 0
  })

  useEffect(() => {
    fetchProjects()
  }, [])

  const fetchProjects = async () => {
    try {
      const response = await fetch('/api/admin/projects')
      if (response.ok) {
        const data = await response.json()
        setProjects(data)
        // Auto-select the first project (most recent due to createdAt: 'desc' in API)
        if (data && data.length > 0) {
          setSelectedProject(data[0])
        }
      }
    } catch (error) {
      console.error('Failed to fetch projects:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleProjectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const projectId = e.target.value
    const project = projects.find(p => p.id === projectId)
    if (project) {
      setSelectedProject(project)
    }
  }

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <div className="text-slate-400">Yükleniyor...</div>
      </div>
    )
  }

  if (!selectedProject) {
    return (
      <div className="p-6">
        <div className="bg-slate-900/50 backdrop-blur-lg rounded-2xl border border-slate-800 p-8 text-center">
          <Map className="w-16 h-16 mx-auto mb-4 text-slate-600" />
          <h3 className="text-xl font-semibold text-white mb-2">Proje Bulunamadı</h3>
          <p className="text-slate-400">Sistemde kayıtlı proje bulunmamaktadır.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white flex items-center gap-3">
          <Map className="w-8 h-8 text-blue-400" />
          Vaziyet ve Risk Planı
        </h1>
        <p className="text-slate-400 mt-1">Proje bazlı şantiye alanı ve risk bölgesi yönetimi</p>
      </div>

      {/* Project Selector */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-slate-400 mb-2">Proje Seç</label>
        <div className="relative">
          <select
            value={selectedProject.id}
            onChange={handleProjectChange}
            className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white appearance-none focus:outline-none focus:border-blue-500 transition-colors cursor-pointer"
          >
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name || project.title}
                {project.city && project.district && ` - ${project.city}/${project.district}`}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
        </div>
      </div>

      {/* Location Tracking Button */}
      <div className="mb-6">
        <button
          onClick={geolocation.toggleTracking}
          className={`w-full px-4 py-3 rounded-xl font-medium transition-all flex items-center justify-center gap-2 ${
            geolocation.isTracking
              ? 'bg-green-600 hover:bg-green-500 text-white'
              : 'bg-blue-600 hover:bg-blue-500 text-white'
          }`}
        >
          {geolocation.isTracking ? (
            <>
              <NavigationOff className="w-5 h-5" />
              Konum Takibi Durdur
            </>
          ) : (
            <>
              <Navigation className="w-5 h-5" />
              Konumumu Paylaş / Canlı Takip
            </>
          )}
        </button>
        {geolocation.error && (
          <div className="mt-2 text-sm text-red-400 bg-red-500/10 border border-red-500/30 rounded-lg p-3">
            {geolocation.error}
          </div>
        )}
        {geolocation.isTracking && geolocation.latitude && geolocation.longitude && (
          <div className="mt-2 text-sm text-green-400 bg-green-500/10 border border-green-500/30 rounded-lg p-3">
            Konum aktif: {geolocation.latitude.toFixed(6)}, {geolocation.longitude.toFixed(6)}
            {geolocation.accuracy && ` (Doğruluk: ±${Math.round(geolocation.accuracy)}m)`}
          </div>
        )}
      </div>

      {/* Site Master Plan */}
      {selectedProject.latitude && selectedProject.longitude ? (
        <SiteMasterPlan
          projectLat={selectedProject.latitude}
          projectLng={selectedProject.longitude}
          projectId={selectedProject.id}
          userLocation={{
            latitude: geolocation.latitude,
            longitude: geolocation.longitude,
            isTracking: geolocation.isTracking
          }}
        />
      ) : (
        <div className="bg-slate-900/50 backdrop-blur-lg rounded-2xl border border-slate-800 p-8 text-center">
          <Map className="w-16 h-16 mx-auto mb-4 text-slate-600" />
          <h3 className="text-xl font-semibold text-white mb-2">Konum Bilgisi Eksik</h3>
          <p className="text-slate-400">Seçilen proje için konum bilgisi (enlem/boylam) tanımlanmamıştır.</p>
        </div>
      )}
    </div>
  )
}
