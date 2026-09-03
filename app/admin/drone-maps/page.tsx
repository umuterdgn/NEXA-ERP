"use client"
/**
 * © 2026 Software. All rights reserved.
 * Developer: Umut Erdoğan
 * This code is the property of NXA Software.
 */

import { useState, useEffect } from "react"
import dynamic from "next/dynamic"
import { Plane, MapPin, Calendar, TrendingUp, Bot, ChevronLeft, ChevronRight, Loader2 } from "lucide-react"

// Dynamic import to avoid SSR issues with Leaflet
const MapContainer = dynamic(
  () => import('react-leaflet').then((mod) => mod.MapContainer),
  { ssr: false }
)

const TileLayer = dynamic(
  () => import('react-leaflet').then((mod) => mod.TileLayer),
  { ssr: false }
)

const ImageOverlay = dynamic(
  () => import('react-leaflet').then((mod) => mod.ImageOverlay),
  { ssr: false }
)

interface DroneImage {
  id: string
  month: number
  label: string
  imageUrl: string
  bounds: [[number, number], [number, number]]
}

export default function DroneMapsPage() {
  const [selectedProject, setSelectedProject] = useState("")
  const [selectedMonth, setSelectedMonth] = useState(3)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [projects, setProjects] = useState<any[]>([])
  const [loadingProjects, setLoadingProjects] = useState(true)

  useEffect(() => {
    fetchProjects()
  }, [])

  const fetchProjects = async () => {
    try {
      const response = await fetch('/api/admin/projects')
      if (response.ok) {
        const data = await response.json()
        setProjects(data)
      }
    } catch (error) {
      console.error('Failed to fetch projects:', error)
    } finally {
      setLoadingProjects(false)
    }
  }

  const droneImages: DroneImage[] = [
    {
      id: "1",
      month: 1,
      label: "1. Ay Çekimi",
      imageUrl: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1200&h=800&fit=crop",
      bounds: [[36.5800, 35.9150], [36.5950, 35.9350]]
    },
    {
      id: "2",
      month: 2,
      label: "2. Ay Çekimi",
      imageUrl: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=1200&h=800&fit=crop",
      bounds: [[36.5800, 35.9150], [36.5950, 35.9350]]
    },
    {
      id: "3",
      month: 3,
      label: "Güncel Durum (3. Ay)",
      imageUrl: "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=1200&h=800&fit=crop",
      bounds: [[36.5800, 35.9150], [36.5950, 35.9350]]
    }
  ]

  const currentImage = droneImages.find(img => img.month === selectedMonth)

  const handleMonthChange = async (month: number) => {
    if (month === selectedMonth) return
    
    setIsTransitioning(true)
    
    // Simulate fade transition
    await new Promise(resolve => setTimeout(resolve, 500))
    
    setSelectedMonth(month)
    
    await new Promise(resolve => setTimeout(resolve, 500))
    
    setIsTransitioning(false)
  }

  const aiAnalysis = {
    summary: "Son drone çekimi ile bir önceki çekim karşılaştırıldı. B Blok temel kazısı %100 tamamlandı, C blok 2. kat tabliyesi döküldü. Genel İlerleme: %34",
    progress: 34,
    completedTasks: [
      "B Blok temel kazısı",
      "C Blok 2. kat tabliyesi"
    ],
    upcomingTasks: [
      "D Blok kolon imalatı",
      "A Blok çatı izolasyonu"
    ]
  }

  return (
    <div className="lg:mt-0 mt-16">
      <div className="mb-6">
        <h1 className="text-2xl lg:text-3xl font-bold text-white flex items-center gap-3">
          <Plane className="w-8 h-8 text-blue-400" />
          Hava & Drone Gözlem
        </h1>
        <p className="text-slate-400 mt-1">Drone ortofoto haritaları ve ilerleme takibi</p>
      </div>

      {/* Project Selector */}
      <div className="bg-slate-900 rounded-xl border border-slate-800 p-6 mb-6">
        <label className="block text-sm font-medium text-slate-300 mb-2">Proje Seçin</label>
        {loadingProjects ? (
          <div className="flex items-center gap-2 text-slate-400">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Projeler yükleniyor...</span>
          </div>
        ) : projects.length === 0 ? (
          <div className="text-slate-400">Henüz proje kaydı bulunmuyor.</div>
        ) : (
          <select
            value={selectedProject}
            onChange={(e) => setSelectedProject(e.target.value)}
            className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
          >
            <option value="">Proje seçin...</option>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name || project.title}
              </option>
            ))}
          </select>
        )}
      </div>

      {selectedProject && (
        <>
          {/* Map Container */}
          <div className="bg-slate-900 rounded-xl border border-slate-800 p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <MapPin className="w-5 h-5 text-blue-400" />
                Drone Harita Görünümü
              </h3>
              <div className="flex items-center gap-2 text-slate-400 text-sm">
                <Calendar className="w-4 h-4" />
                <span>{currentImage?.label}</span>
              </div>
            </div>
            
            <div className="relative h-[500px] rounded-lg overflow-hidden">
              <MapContainer
                center={[36.5875, 35.9250]}
                zoom={15}
                style={{ height: "100%", width: "100%" }}
                className="z-0"
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                
                {currentImage && (
                  <ImageOverlay
                    url={currentImage.imageUrl}
                    bounds={currentImage.bounds}
                    opacity={isTransitioning ? 0.3 : 0.7}
                    className={`transition-opacity duration-500 ${isTransitioning ? 'opacity-30' : 'opacity-70'}`}
                  />
                )}
              </MapContainer>

              {/* AI Analysis Card */}
              <div className="absolute top-4 right-4 w-80 bg-slate-900/90 backdrop-blur-md rounded-xl border border-slate-700 p-4 shadow-xl">
                <div className="flex items-center gap-2 mb-3">
                  <Bot className="w-5 h-5 text-blue-400" />
                  <h4 className="text-white font-semibold">Yapay Zeka Analizi</h4>
                </div>
                <p className="text-slate-300 text-sm mb-4">{aiAnalysis.summary}</p>
                
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-slate-400 text-sm">Genel İlerleme</span>
                    <span className="text-white font-semibold">{aiAnalysis.progress}%</span>
                  </div>
                  <div className="w-full bg-slate-700 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-blue-600 to-green-500 h-2 rounded-full transition-all"
                      style={{ width: `${aiAnalysis.progress}%` }}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div>
                    <p className="text-slate-400 text-xs mb-1">Tamamlanan Görevler</p>
                    <div className="space-y-1">
                      {aiAnalysis.completedTasks.map((task, index) => (
                        <div key={index} className="flex items-center gap-2 text-sm">
                          <div className="w-2 h-2 bg-green-500 rounded-full" />
                          <span className="text-green-400">{task}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-slate-400 text-xs mb-1">Yaklaşan Görevler</p>
                    <div className="space-y-1">
                      {aiAnalysis.upcomingTasks.map((task, index) => (
                        <div key={index} className="flex items-center gap-2 text-sm">
                          <div className="w-2 h-2 bg-orange-500 rounded-full" />
                          <span className="text-orange-400">{task}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Timeline Slider */}
          <div className="bg-slate-900 rounded-xl border border-slate-800 p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-400" />
              Gelişim Takvimi
            </h3>
            
            <div className="flex items-center gap-4">
              <button
                onClick={() => handleMonthChange(selectedMonth - 1)}
                disabled={selectedMonth === 1}
                className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-5 h-5 text-white" />
              </button>
              
              <div className="flex-1 flex gap-3">
                {droneImages.map((image) => (
                  <button
                    key={image.id}
                    onClick={() => handleMonthChange(image.month)}
                    className={`flex-1 p-4 rounded-xl border transition-all ${
                      selectedMonth === image.month
                        ? "bg-blue-600 border-blue-500 text-white"
                        : "bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700"
                    }`}
                  >
                    <div className="text-center">
                      <p className="font-medium text-sm mb-1">{image.label}</p>
                      <p className="text-xs opacity-75">
                        {image.month === 3 ? "Güncel" : `${image.month}. Ay`}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
              
              <button
                onClick={() => handleMonthChange(selectedMonth + 1)}
                disabled={selectedMonth === 3}
                className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-5 h-5 text-white" />
              </button>
            </div>
          </div>
        </>
      )}

      {!selectedProject && (
        <div className="text-center py-16 bg-slate-900 rounded-xl border border-slate-800">
          <Plane className="w-16 h-16 mx-auto mb-4 text-slate-600" />
          <h3 className="text-xl font-semibold text-white mb-2">Proje Seçin</h3>
          <p className="text-slate-400">Drone haritalarını görüntülemek için proje seçin</p>
        </div>
      )}
    </div>
  )
}
