"use client"
/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * This code is the property of NXA Software.
 */


import { useState, useEffect } from "react"
import { toast } from "react-hot-toast"

export default function SiteReportsPage() {
  const [reports, setReports] = useState<any[]>([])
  const [projects, setProjects] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    fetchReports()
    fetchProjects()
  }, [])
  
  const [formData, setFormData] = useState({
    date: "",
    weather: "",
    workerCount: "",
    notes: "",
    images: [] as File[],
    projectId: ""
  })

  const [filters, setFilters] = useState({
    projectId: "",
    date: ""
  })

  const fetchReports = async () => {
    try {
      const response = await fetch("/api/admin/site-reports")
      if (response.ok) {
        const data = await response.json()
        setReports(data)
      }
    } catch (error) {
      console.error("Failed to fetch reports:", error)
      toast.error("Raporlar yüklenirken hata oluştu")
    } finally {
      setIsLoading(false)
    }
  }

  const filteredReports = reports.filter(report => {
    const projectMatch = !filters.projectId || report.projectId === filters.projectId
    const dateMatch = !filters.date || new Date(report.date).toISOString().split('T')[0] === filters.date
    return projectMatch && dateMatch
  })

  const fetchProjects = async () => {
    try {
      const response = await fetch("/api/admin/projects")
      if (response.ok) {
        const data = await response.json()
        setProjects(Array.isArray(data) ? data : (data?.projects || []))
      }
    } catch (error) {
      console.error("Failed to fetch projects:", error)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))

    // When project is selected, auto-fetch worker count and weather
    if (name === 'projectId' && value) {
      fetchWorkerCount(value, formData.date)
      fetchWeatherForProject(value)
    }
  }

  const fetchWorkerCount = async (projectId: string, date: string) => {
    try {
      const response = await fetch(`/api/attendance/worker-count?projectId=${projectId}&date=${date}`)
      if (response.ok) {
        const data = await response.json()
        setFormData(prev => ({ ...prev, workerCount: data.count.toString() }))
      }
    } catch (error) {
      console.error('Failed to fetch worker count:', error)
    }
  }

  const fetchWeatherForProject = async (projectId: string) => {
    try {
      // Get project details to find city
      const projectResponse = await fetch(`/api/admin/projects/${projectId}`)
      if (projectResponse.ok) {
        const project = await projectResponse.json()
        if (project.city) {
          // Fetch weather data (using a free weather API or mock)
          const weatherResponse = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${project.city}&appid=${process.env.NEXT_PUBLIC_WEATHER_API_KEY}&units=metric&lang=tr`)
          if (weatherResponse.ok) {
            const weatherData = await weatherResponse.json()
            const weatherDescription = weatherData.weather[0].description
            const temperature = Math.round(weatherData.main.temp)
            setFormData(prev => ({ ...prev, weather: `${weatherDescription}, ${temperature}°C` }))
          }
        }
      }
    } catch (error) {
      console.error('Failed to fetch weather:', error)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFormData(prev => ({ ...prev, images: Array.from(e.target.files!) }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.projectId || !formData.notes) {
      toast.error("Proje seçimi ve notlar zorunludur")
      return
    }

    setIsSubmitting(true)
    try {
      const formDataToSend = new FormData()
      formDataToSend.append('date', formData.date)
      formDataToSend.append('weather', formData.weather)
      formDataToSend.append('workerCount', formData.workerCount)
      formDataToSend.append('notes', formData.notes)
      formDataToSend.append('projectId', formData.projectId)
      
      // Append each image file
      formData.images.forEach((file) => {
        formDataToSend.append('images', file)
      })

      const response = await fetch("/api/admin/site-reports", {
        method: "POST",
        body: formDataToSend
      })

      if (response.ok) {
        toast.success("Şantiye raporu başarıyla eklendi")
        fetchReports()
        closeModal()
      } else {
        toast.error("Rapor eklenirken hata oluştu")
      }
    } catch (error) {
      toast.error("Rapor eklenirken hata oluştu")
    } finally {
      setIsSubmitting(false)
    }
  }

  const openModal = () => {
    setFormData({
      date: new Date().toISOString().split('T')[0],
      weather: "",
      workerCount: "",
      notes: "",
      images: [],
      projectId: ""
    })
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setFormData({
      date: "",
      weather: "",
      workerCount: "",
      notes: "",
      images: [],
      projectId: ""
    })
  }

  if (isLoading) {
    return (
      <div className="lg:mt-0 mt-16">
        <div className="text-white">Yükleniyor...</div>
      </div>
    )
  }

  return (
    <div className="lg:mt-0 mt-16">
      <div className="flex flex-wrap gap-4 justify-between items-start mb-8">
        <h1 className="text-2xl lg:text-3xl font-bold text-white">
          Şantiye Günlüğü
        </h1>
        <button
          onClick={openModal}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors whitespace-nowrap"
        >
          Yeni Günlük Rapor Ekle
        </button>
      </div>

      {/* Filters */}
      <div className="bg-slate-900 rounded-xl p-4 border border-slate-800 mb-6">
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Proje Filtrele</label>
            <select
              value={filters.projectId}
              onChange={(e) => setFilters(prev => ({ ...prev, projectId: e.target.value }))}
              className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
            >
              <option value="">Tüm Projeler</option>
              {(Array.isArray(projects) ? projects : []).map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name || project.title}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Tarih Filtrele</label>
            <input
              type="date"
              value={filters.date}
              onChange={(e) => setFilters(prev => ({ ...prev, date: e.target.value }))}
              className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
            />
          </div>
        </div>
      </div>

      {/* Reports Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredReports.length === 0 ? (
          <div className="col-span-full bg-slate-900 rounded-xl p-12 border border-slate-800 text-center text-slate-400">
            {reports.length === 0 ? "Henüz şantiye raporu yok" : "Filtrelere uygun rapor bulunamadı"}
          </div>
        ) : (
          filteredReports.map((report) => (
            <div key={report.id} className="bg-slate-900 rounded-xl p-6 border border-slate-800">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-white mb-1">
                    {report.project?.name || report.project?.title || "Proje"}
                  </h3>
                  <p className="text-sm text-slate-400">
                    {new Date(report.date).toLocaleDateString("tr-TR")}
                  </p>
                </div>
                {report.weather && (
                  <span className="px-2 py-1 bg-blue-900/50 text-blue-400 rounded-full text-xs">
                    {report.weather}
                  </span>
                )}
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-center text-sm">
                  <span className="text-slate-400 w-24">Çalışan:</span>
                  <span className="text-white font-medium">{report.workerCount} kişi</span>
                </div>
                {report.createdBy && (
                  <div className="flex items-center text-sm">
                    <span className="text-slate-400 w-24">Yazan:</span>
                    <span className="text-white">{report.createdBy}</span>
                  </div>
                )}
              </div>

              <div className="bg-slate-800 rounded-lg p-3 mb-4">
                <p className="text-sm text-slate-300 line-clamp-3">{report.notes}</p>
              </div>

              {report.images && (
                <div className="text-xs text-slate-500">
                  Resimler eklendi
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-slate-900 rounded-xl p-6 border border-slate-800 w-full max-w-lg mx-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-semibold text-white mb-6">Yeni Günlük Rapor Ekle</h3>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Tarih</label>
                <input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Proje *</label>
                <select
                  name="projectId"
                  value={formData.projectId}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                  required
                >
                  <option value="">Proje Seçin</option>
                  {(Array.isArray(projects) ? projects : []).map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.name || project.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Hava Durumu</label>
                <input
                  type="text"
                  name="weather"
                  value={formData.weather}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-slate-500"
                  placeholder="Örn: Güneşli, Yağmurlu 30°C"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Çalışan Sayısı</label>
                <input
                  type="number"
                  name="workerCount"
                  value={formData.workerCount}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-slate-500"
                  placeholder="0"
                  min="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Notlar *</label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  rows={4}
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-slate-500"
                  placeholder="Günlük notlarınızı yazın..."
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Resimler (Opsiyonel)</label>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleFileChange}
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white file:mr-2 file:py-1 file:px-3 file:rounded file:border-0 file:bg-blue-600 file:text-white file:cursor-pointer"
                />
                {formData.images.length > 0 && (
                  <p className="text-xs text-slate-500 mt-1">{formData.images.length} dosya seçildi</p>
                )}
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors"
                  disabled={isSubmitting}
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Kaydediliyor..." : "Kaydet"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
