/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * This code is the property of NXA Software.
 */

"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { toast } from "react-hot-toast"

interface Project {
  id: string
  title: string
}

interface DroneMedia {
  id: string
  title: string
  url: string
  mediaType: string
  date: string
  projectId: string
  project: {
    id: string
    title: string
  }
  description?: string
}

export default function DroneArchivePage() {
  const [media, setMedia] = useState<DroneMedia[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false)
  const [selectedVideoUrl, setSelectedVideoUrl] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const [filters, setFilters] = useState({
    projectId: "",
    mediaType: "",
    startDate: "",
    endDate: ""
  })
  
  const [formData, setFormData] = useState({
    title: "",
    url: "",
    mediaType: "IMAGE",
    date: "",
    projectId: "",
    description: ""
  })

  useEffect(() => {
    fetchProjects()
    fetchMedia()
  }, [])

  useEffect(() => {
    fetchMedia()
  }, [filters])

  const fetchProjects = async () => {
    try {
      const response = await fetch("/api/admin/projects")
      if (response.ok) {
        const data = await response.json()
        setProjects(data)
      }
    } catch (error) {
      console.error("Failed to fetch projects:", error)
    }
  }

  const fetchMedia = async () => {
    try {
      const params = new URLSearchParams()
      if (filters.projectId) params.append("projectId", filters.projectId)
      if (filters.mediaType) params.append("mediaType", filters.mediaType)
      if (filters.startDate) params.append("startDate", filters.startDate)
      if (filters.endDate) params.append("endDate", filters.endDate)

      const response = await fetch(`/api/admin/drone-media?${params}`)
      if (response.ok) {
        const data = await response.json()
        setMedia(data)
      }
    } catch (error) {
      console.error("Failed to fetch media:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const openModal = () => {
    setFormData({
      title: "",
      url: "",
      mediaType: "IMAGE",
      date: new Date().toISOString().split('T')[0],
      projectId: "",
      description: ""
    })
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setFormData({
      title: "",
      url: "",
      mediaType: "IMAGE",
      date: "",
      projectId: "",
      description: ""
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.title || !formData.url || !formData.date || !formData.projectId) {
      toast.error("Tüm zorunlu alanları doldurun")
      return
    }

    setIsSubmitting(true)
    try {
      const response = await fetch("/api/admin/drone-media", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        toast.success("Medya başarıyla eklendi")
        fetchMedia()
        closeModal()
      } else {
        toast.error("Medya eklenirken hata oluştu")
      }
    } catch (error) {
      toast.error("Medya eklenirken hata oluştu")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Bu medyayı silmek istediğinize emin misiniz?")) {
      return
    }

    try {
      const response = await fetch(`/api/admin/drone-media/${id}`, {
        method: "DELETE"
      })

      if (response.ok) {
        toast.success("Medya başarıyla silindi")
        fetchMedia()
      } else {
        toast.error("Medya silinirken hata oluştu")
      }
    } catch (error) {
      toast.error("Medya silinirken hata oluştu")
    }
  }

  const openVideoModal = (url: string) => {
    setSelectedVideoUrl(url)
    setIsVideoModalOpen(true)
  }

  const closeVideoModal = () => {
    setIsVideoModalOpen(false)
    setSelectedVideoUrl("")
  }

  return (
    <div className="lg:mt-0 mt-16 p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            Drone Çekim Arşivi
          </h1>
          <p className="text-slate-400 mt-1">Şantiye ilerleyişini görsel olarak takip edin</p>
        </div>
        <button
          onClick={openModal}
          className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:from-purple-500 hover:to-pink-500 transition-all font-medium flex items-center gap-2 shadow-lg shadow-purple-900/20"
        >
          ➕ Yeni Medya Ekle
        </button>
      </div>

      {/* Filters */}
      <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-700/50 shadow-lg mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Proje</label>
            <select
              value={filters.projectId}
              onChange={(e) => setFilters({ ...filters, projectId: e.target.value })}
              className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-white"
            >
              <option value="">Tüm Projeler</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>{project.title}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Medya Türü</label>
            <select
              value={filters.mediaType}
              onChange={(e) => setFilters({ ...filters, mediaType: e.target.value })}
              className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-white"
            >
              <option value="">Tüm Türler</option>
              <option value="IMAGE">Fotoğraf</option>
              <option value="VIDEO">Video</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Başlangıç Tarihi</label>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
              className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Bitiş Tarihi</label>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
              className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-white"
            />
          </div>
        </div>
      </div>

      {/* Media Grid */}
      {isLoading ? (
        <div className="text-center py-12 text-slate-400">Yükleniyor...</div>
      ) : media.length === 0 ? (
        <div className="text-center py-12 text-slate-400">
          Henüz medya kaydı yok
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {media.map((item) => (
            <div
              key={item.id}
              className="bg-slate-800/50 backdrop-blur-sm rounded-2xl overflow-hidden border border-slate-700/50 shadow-lg hover:scale-105 transition-all duration-300 group"
            >
              <div className="relative aspect-video bg-slate-900/50">
                {item.mediaType === "IMAGE" ? (
                  <img
                    src={item.url}
                    alt={item.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div
                    className="w-full h-full flex items-center justify-center cursor-pointer bg-slate-900/50"
                    onClick={() => openVideoModal(item.url)}
                  >
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center group-hover:bg-white/30 transition-all">
                        <svg className="w-8 h-8 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M8 5v14l11-7z" />
                        </svg>
                      </div>
                    </div>
                    <img
                      src={item.url}
                      alt={item.title}
                      className="w-full h-full object-cover opacity-50"
                    />
                  </div>
                )}
                <button
                  onClick={() => handleDelete(item.id)}
                  className="absolute top-2 right-2 p-2 bg-red-600/80 hover:bg-red-600 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="p-4">
                <h3 className="text-white font-semibold mb-2 truncate">{item.title}</h3>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between text-slate-400">
                    <span>Proje:</span>
                    <span className="text-slate-300">{item.project.title}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Tarih:</span>
                    <span className="text-slate-300">
                      {new Date(item.date).toLocaleDateString("tr-TR")}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Tür:</span>
                    <span className="text-slate-300">
                      {item.mediaType === "IMAGE" ? "📷 Fotoğraf" : "🎬 Video"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-700/50 w-full max-w-lg mx-4 shadow-2xl">
            <h3 className="text-xl font-semibold text-white mb-6">Yeni Medya Ekle</h3>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Başlık *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-white"
                  required
                  placeholder="Örn: A Blok Temel Atımı"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">URL *</label>
                <input
                  type="url"
                  value={formData.url}
                  onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-white"
                  required
                  placeholder="https://cloudinary.com/..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Medya Türü *</label>
                  <select
                    value={formData.mediaType}
                    onChange={(e) => setFormData({ ...formData, mediaType: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-white"
                    required
                  >
                    <option value="IMAGE">Fotoğraf</option>
                    <option value="VIDEO">Video</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Çekim Tarihi *</label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full px-4 py-31 bg-slate-900/50 border border-slate-700/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-white"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Proje *</label>
                <select
                  value={formData.projectId}
                  onChange={(e) => setFormData({ ...formData, projectId: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-white"
                  required
                >
                  <option value="">Proje Seçin</option>
                  {projects.map((project) => (
                    <option key={project.id} value={project.id}>{project.title}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Açıklama</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-white"
                  rows={3}
                  placeholder="İsteğe bağlı açıklama"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 px-4 py-3 bg-slate-700/50 text-white rounded-xl hover:bg-slate-700 transition-colors"
                  disabled={isSubmitting}
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:from-purple-500 hover:to-pink-500 transition-all"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Ekleniyor..." : "Ekle"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Video Modal */}
      {isVideoModalOpen && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="w-full max-w-4xl mx-4">
            <button
              onClick={closeVideoModal}
              className="absolute top-4 right-4 text-white hover:text-slate-300 transition-colors"
            >
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <video
              src={selectedVideoUrl}
              controls
              autoPlay
              className="w-full rounded-xl"
            />
          </div>
        </div>
      )}
    </div>
  )
}
