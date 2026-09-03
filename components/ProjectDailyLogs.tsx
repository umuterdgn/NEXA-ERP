"use client"
/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * This code is the property of NXA Software.
 */


import { useState, useEffect } from "react"
import { toast } from "react-hot-toast"

interface DailyLog {
  id: string
  date: string
  weather: string | null
  machineryCount: number
  workDone: string
  photoUrls: string[]
  projectId: string
  createdAt: string
  updatedAt: string
}

interface ProjectDailyLogsProps {
  projectId: string
}

export default function ProjectDailyLogs({ projectId }: ProjectDailyLogsProps) {
  const [logs, setLogs] = useState<DailyLog[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isAdding, setIsAdding] = useState(false)
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    weather: "",
    machineryCount: 0,
    workDone: "",
    photoUrls: [] as string[],
    photoFiles: [] as File[]
  })

  useEffect(() => {
    fetchLogs()
  }, [projectId])

  const fetchLogs = async () => {
    try {
      const response = await fetch(`/api/admin/daily-logs?projectId=${projectId}`)
      if (response.ok) {
        const data = await response.json()
        setLogs(data)
      }
    } catch (error) {
      console.error("Error fetching daily logs:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    setFormData({ ...formData, photoFiles: [...formData.photoFiles, ...files] })
  }

  const handleRemoveFile = (index: number) => {
    const newFiles = formData.photoFiles.filter((_, i) => i !== index)
    setFormData({ ...formData, photoFiles: newFiles })
  }

  const uploadFiles = async (files: File[]): Promise<string[]> => {
    const urls: string[] = []
    for (const file of files) {
      const formData = new FormData()
      formData.append('file', file)
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      })
      if (response.ok) {
        const data = await response.json()
        urls.push(data.url)
      }
    }
    return urls
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.workDone) {
      toast.error("Yapılan işler alanı zorunludur")
      return
    }

    try {
      // Upload files first
      const uploadedUrls = await uploadFiles(formData.photoFiles)
      const allPhotoUrls = [...formData.photoUrls, ...uploadedUrls]

      const response = await fetch("/api/admin/daily-logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          photoUrls: allPhotoUrls,
          projectId
        })
      })

      if (response.ok) {
        toast.success("Günlük raporu eklendi")
        setFormData({
          date: new Date().toISOString().split('T')[0],
          weather: "",
          machineryCount: 0,
          workDone: "",
          photoUrls: [],
          photoFiles: []
        })
        setIsAdding(false)
        fetchLogs()
      } else {
        toast.error("Rapor eklenirken hata oluştu")
      }
    } catch (error) {
      toast.error("Rapor eklenirken hata oluştu")
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/admin/daily-logs/${id}`, {
        method: "DELETE"
      })

      if (response.ok) {
        toast.success("Rapor silindi")
        fetchLogs()
      }
    } catch (error) {
      toast.error("Silinirken hata oluştu")
    }
  }

  if (isLoading) {
    return <div className="text-slate-400">Yükleniyor...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-white">Şantiye Günlüğü</h3>
        {!isAdding && (
          <button
            onClick={() => setIsAdding(true)}
            className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors text-sm"
          >
            + Rapor Ekle
          </button>
        )}
      </div>

      {isAdding && (
        <form onSubmit={handleSubmit} className="bg-slate-800 rounded-lg p-6 space-y-4 border border-slate-700">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Tarih</label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Hava Durumu</label>
              <input
                type="text"
                value={formData.weather}
                onChange={(e) => setFormData({ ...formData, weather: e.target.value })}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                placeholder="Örn: Güneşli, 28°C"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">İş Makinesi Sayısı</label>
            <input
              type="number"
              value={formData.machineryCount}
              onChange={(e) => setFormData({ ...formData, machineryCount: parseInt(e.target.value) || 0 })}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
              min="0"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Yapılan İşler *</label>
            <textarea
              value={formData.workDone}
              onChange={(e) => setFormData({ ...formData, workDone: e.target.value })}
              rows={4}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white resize-none"
              placeholder="O gün yapılan imalatların detaylarını girin..."
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Fotoğraflar</label>
            <input
              type="file"
              multiple
              accept="image/*,application/pdf"
              capture="environment"
              onChange={handleFileChange}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white text-sm"
            />
            {formData.photoFiles.length > 0 && (
              <div className="mt-2 space-y-2">
                {formData.photoFiles.map((file, index) => (
                  <div key={index} className="flex items-center justify-between bg-slate-700 rounded-lg px-3 py-2">
                    <span className="text-slate-300 text-sm truncate">{file.name}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveFile(index)}
                      className="text-red-400 hover:text-red-300"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="flex-1 px-3 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-500 transition-colors"
            >
              İptal
            </button>
            <button
              type="submit"
              className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors"
            >
              Kaydet
            </button>
          </div>
        </form>
      )}

      {logs.length === 0 ? (
        <div className="text-center text-slate-500 py-8 bg-slate-800 rounded-lg">
          Henüz günlük rapor yok
        </div>
      ) : (
        <div className="space-y-4">
          {logs.map((log) => (
            <div
              key={log.id}
              className="bg-slate-800 rounded-lg p-5 border border-slate-700 hover:border-slate-600 transition-colors"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-white font-medium">
                      {new Date(log.date).toLocaleDateString("tr-TR", {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </span>
                    {log.weather && (
                      <span className="px-2 py-0.5 bg-blue-900/50 text-blue-400 rounded text-xs">
                        {log.weather}
                      </span>
                    )}
                    {log.machineryCount > 0 && (
                      <span className="px-2 py-0.5 bg-orange-900/50 text-orange-400 rounded text-xs">
                        {log.machineryCount} Makine
                      </span>
                    )}
                  </div>
                  <p className="text-slate-500 text-xs">
                    {new Date(log.createdAt).toLocaleString("tr-TR")}
                  </p>
                </div>
                <button
                  onClick={() => handleDelete(log.id)}
                  className="text-slate-400 hover:text-red-400 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>

              <div className="mb-4">
                <h4 className="text-sm font-medium text-slate-300 mb-2">Yapılan İşler</h4>
                <p className="text-slate-400 text-sm whitespace-pre-wrap">{log.workDone}</p>
              </div>

              {log.photoUrls && log.photoUrls.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-slate-300 mb-3">Fotoğraflar</h4>
                  <div className="grid grid-cols-4 gap-2">
                    {log.photoUrls.map((url, index) => (
                      <a
                        key={index}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="relative group"
                      >
                        <div className="aspect-square bg-slate-700 rounded-lg overflow-hidden flex items-center justify-center border border-slate-600 hover:border-blue-500 transition-colors">
                          <div className="text-center p-2">
                            <svg className="w-6 h-6 text-slate-400 mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <p className="text-xs text-slate-500 truncate max-w-[80px]">Fotoğraf {index + 1}</p>
                          </div>
                        </div>
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
