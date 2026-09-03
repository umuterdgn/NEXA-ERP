"use client"
/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * This code is the property of NXA Software.
 */


import { useState, useEffect } from "react"
import { toast } from "react-hot-toast"

interface ProjectFile {
  id: string
  name: string
  url: string
  category: string
  projectId: string
  uploadedBy: string | null
  createdAt: string
}

const CATEGORIES = [
  "Mimari",
  "Statik",
  "Zemin Etüt",
  "Elektrik",
  "Mekanik",
  "Resmi Evrak",
  "Personel Evrakı",
  "Diğer"
]

interface ProjectFilesProps {
  projectId: string
}

export default function ProjectFiles({ projectId }: ProjectFilesProps) {
  const [files, setFiles] = useState<ProjectFile[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isAdding, setIsAdding] = useState(false)
  const [categoryFilter, setCategoryFilter] = useState<string>("Tümü")
  const [formData, setFormData] = useState({
    name: "",
    url: "",
    category: "Mimari",
    file: null as File | null
  })

  useEffect(() => {
    fetchFiles()
  }, [projectId])

  const fetchFiles = async () => {
    try {
      const response = await fetch(`/api/admin/project-files?projectId=${projectId}`)
      if (response.ok) {
        const data = await response.json()
        setFiles(data)
      }
    } catch (error) {
      console.error("Error fetching project files:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null
    setFormData({ ...formData, file })
  }

  const uploadFile = async (file: File): Promise<string> => {
    const formData = new FormData()
    formData.append('file', file)
    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData
      // Note: No Content-Type header - browser sets multipart/form-data with boundary automatically
    })
    if (response.ok) {
      const data = await response.json()
      return data.url
    }
    throw new Error('Upload failed')
  }

  const handleAddFile = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name || !formData.category) {
      toast.error("Lütfen dosya adı ve kategori seçin")
      return
    }

    try {
      let fileUrl = formData.url
      
      // Upload file if selected
      if (formData.file) {
        fileUrl = await uploadFile(formData.file)
      }

      if (!fileUrl) {
        toast.error("Lütfen dosya seçin veya URL girin")
        return
      }

      const response = await fetch("/api/admin/project-files", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          url: fileUrl,
          category: formData.category,
          projectId
        })
      })

      if (response.ok) {
        toast.success("Dosya eklendi")
        setFormData({ name: "", url: "", category: "Mimari", file: null })
        setIsAdding(false)
        fetchFiles()
      } else {
        toast.error("Dosya eklenirken hata oluştu")
      }
    } catch (error) {
      toast.error("Dosya eklenirken hata oluştu")
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/admin/project-files/${id}`, {
        method: "DELETE"
      })

      if (response.ok) {
        toast.success("Dosya silindi")
        fetchFiles()
      }
    } catch (error) {
      toast.error("Silinirken hata oluştu")
    }
  }

  // Filter files by category
  const filteredFiles = categoryFilter === "Tümü" 
    ? files 
    : files.filter(file => file.category === categoryFilter)

  // Group files by category
  const groupedFiles = filteredFiles.reduce((acc, file) => {
    if (!acc[file.category]) {
      acc[file.category] = []
    }
    acc[file.category].push(file)
    return acc
  }, {} as Record<string, ProjectFile[]>)

  if (isLoading) {
    return <div className="text-slate-400">Yükleniyor...</div>
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-white">Arşiv & Dosyalar</h3>
        {!isAdding && (
          <button
            onClick={() => setIsAdding(true)}
            className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors text-sm"
          >
            + Dosya Ekle
          </button>
        )}
      </div>

      {/* Category Filter */}
      <div className="flex items-center gap-3">
        <label className="text-sm font-medium text-slate-300">Kategori Filtresi:</label>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white text-sm"
        >
          <option value="Tümü">Tümü</option>
          {CATEGORIES.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
      </div>

      {isAdding && (
        <form onSubmit={handleAddFile} className="bg-slate-800 rounded-lg p-4 space-y-3">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Dosya Adı</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
              placeholder="Örn: Statik Proje Raporu"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Dosya Yükle veya URL Gir</label>
            <input
              type="file"
              accept="image/*,application/pdf"
              capture="environment"
              onChange={handleFileChange}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white text-sm"
            />
            {formData.file && (
              <div className="mt-2 bg-slate-700 rounded-lg px-3 py-2 flex items-center justify-between">
                <span className="text-slate-300 text-sm truncate">{formData.file.name}</span>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, file: null })}
                  className="text-red-400 hover:text-red-300"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            )}
            <div className="mt-2 text-center text-slate-500 text-xs">veya</div>
            <input
              type="url"
              value={formData.url}
              onChange={(e) => setFormData({ ...formData, url: e.target.value })}
              className="w-full mt-2 px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white text-sm"
              placeholder="https://..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Kategori</label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
              required
            >
              {CATEGORIES.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
          <div className="flex gap-2">
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

      {files.length === 0 ? (
        <div className="text-center text-slate-500 py-8 bg-slate-800 rounded-lg">
          Henüz dosya yüklenmemiş
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedFiles).map(([category, categoryFiles]) => (
            <div key={category}>
              <h4 className="text-md font-medium text-slate-300 mb-3 flex items-center gap-2">
                <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                {category}
                <span className="text-xs text-slate-500">({categoryFiles.length})</span>
              </h4>
              <div className="space-y-2">
                {categoryFiles.map((file) => (
                  <div
                    key={file.id}
                    className="bg-slate-800 rounded-lg p-4 border border-slate-700 flex justify-between items-center"
                  >
                    <div className="flex-1">
                      <p className="text-white text-sm font-medium">{file.name}</p>
                      <p className="text-slate-500 text-xs">
                        {new Date(file.createdAt).toLocaleDateString("tr-TR")}
                        {file.uploadedBy && ` • ${file.uploadedBy}`}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <a
                        href={file.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors text-sm"
                      >
                        İndir
                      </a>
                      <a
                        href={file.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1.5 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors text-sm"
                      >
                        Görüntüle
                      </a>
                      <button
                        onClick={() => handleDelete(file.id)}
                        className="px-3 py-1.5 bg-red-600/20 text-red-400 rounded-lg hover:bg-red-600/30 transition-colors text-sm"
                      >
                        Sil
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
