"use client"
/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * This code is the property of NXA Software.
 */


import { useState, useEffect } from "react"
import { toast } from "react-hot-toast"
import { 
  FileText, 
  Plus, 
  X, 
  Upload, 
  Download, 
  Trash2, 
  Grid3x3, 
  List, 
  Search,
  Filter,
  Calendar,
  Building2,
  AlertCircle,
  CheckCircle
} from "lucide-react"
import StorageWidget from "@/components/StorageWidget"

interface Document {
  id: string
  title: string
  category: string
  fileUrl: string
  expiryDate: string | null
  createdAt: string
  project?: {
    id: string
    name: string
    title: string
  }
}

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([])
  const [projects, setProjects] = useState<any[]>([])
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid")
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  
  // Filters
  const [selectedProjectId, setSelectedProjectId] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  
  const [formData, setFormData] = useState({
    title: "",
    category: "RUHSAT",
    projectId: "",
    expiryDate: "",
    file: null as File | null
  })

  useEffect(() => {
    fetchDocuments()
    fetchProjects()
  }, [])

  const fetchDocuments = async () => {
    try {
      const response = await fetch('/api/documents')
      const data = await response.json()
      setDocuments(data)
    } catch (error) {
      console.error('Failed to fetch documents:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchProjects = async () => {
    try {
      const response = await fetch('/api/admin/projects')
      const data = await response.json()
      setProjects(data)
    } catch (error) {
      console.error('Failed to fetch projects:', error)
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFormData({ ...formData, file: e.target.files[0] })
    }
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFormData({ ...formData, file: e.dataTransfer.files[0] })
    }
  }

  const handleUpload = async () => {
    if (!formData.title || !formData.file) {
      toast.error("Lütfen başlık ve dosya seçin")
      return
    }

    setUploading(true)

    try {
      // Upload to Cloudinary
      const uploadFormData = new FormData()
      uploadFormData.append('file', formData.file)
      uploadFormData.append('upload_preset', process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'ml_default')

      const uploadResponse = await fetch(`https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`, {
        method: 'POST',
        body: uploadFormData
      })

      const uploadData = await uploadResponse.json()

      if (!uploadData.secure_url) {
        throw new Error('Dosya yüklenemedi')
      }

      // Save to database
      const saveResponse = await fetch('/api/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.title,
          category: formData.category,
          fileUrl: uploadData.secure_url,
          projectId: formData.projectId || null,
          expiryDate: formData.expiryDate || null
        })
      })

      if (saveResponse.ok) {
        toast.success("Evrak başarıyla yüklendi")
        setIsModalOpen(false)
        setFormData({ title: "", category: "RUHSAT", projectId: "", expiryDate: "", file: null })
        fetchDocuments()
      } else {
        toast.error("Evrak kaydedilirken hata oluştu")
      }
    } catch (error) {
      console.error('Upload error:', error)
      toast.error('Bir hata oluştu')
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Bu evrakı silmek istediğinize emin misiniz?")) return

    try {
      const response = await fetch(`/api/documents/${id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        toast.success("Evrak silindi")
        fetchDocuments()
      } else {
        toast.error("Silme işlemi başarısız")
      }
    } catch (error) {
      toast.error("Bir hata oluştu")
    }
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
  }

  const isExpiringSoon = (expiryDate: string | null) => {
    if (!expiryDate) return false
    const expiry = new Date(expiryDate)
    const today = new Date()
    const daysUntilExpiry = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    return daysUntilExpiry <= 30 && daysUntilExpiry > 0
  }

  const isExpired = (expiryDate: string | null) => {
    if (!expiryDate) return false
    const expiry = new Date(expiryDate)
    const today = new Date()
    return expiry < today
  }

  const getCategoryBadge = (category: string) => {
    const categoryMap: Record<string, { bg: string, text: string, label: string }> = {
      'RUHSAT': { bg: 'bg-blue-500/20', text: 'text-blue-400', label: 'Ruhsat' },
      'PROJE_CIZIMI': { bg: 'bg-purple-500/20', text: 'text-purple-400', label: 'Proje Çizimi' },
      'TUTANAK': { bg: 'bg-green-500/20', text: 'text-green-400', label: 'Tutanak' },
      'ISG': { bg: 'bg-orange-500/20', text: 'text-orange-400', label: 'İSG' },
      'SOZLESME': { bg: 'bg-pink-500/20', text: 'text-pink-400', label: 'Sözleşme' },
      'DEKONT': { bg: 'bg-cyan-500/20', text: 'text-cyan-400', label: 'Dekont' },
      'DIGER': { bg: 'bg-slate-500/20', text: 'text-slate-400', label: 'Diğer' }
    }
    const c = categoryMap[category] || categoryMap['DIGER']
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium ${c.bg} ${c.text}`}>
        {c.label}
      </span>
    )
  }

  const getStatusBadge = (doc: Document) => {
    if (isExpired(doc.expiryDate)) {
      return (
        <span className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-500/20 text-red-400">
          <AlertCircle className="w-3 h-3" />
          Süresi Dolmuş
        </span>
      )
    }
    if (isExpiringSoon(doc.expiryDate)) {
      return (
        <span className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-yellow-500/20 text-yellow-400">
          <AlertCircle className="w-3 h-3" />
          Yakında Dolacak
        </span>
      )
    }
    return (
      <span className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-500/20 text-green-400">
        <CheckCircle className="w-3 h-3" />
        Geçerli
      </span>
    )
  }

  const filteredDocuments = documents.filter(doc => {
    const matchesProject = !selectedProjectId || doc.project?.id === selectedProjectId
    const matchesCategory = !selectedCategory || doc.category === selectedCategory
    const matchesSearch = !searchTerm || 
      doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (doc.project?.name || doc.project?.title || "").toLowerCase().includes(searchTerm.toLowerCase())
    return matchesProject && matchesCategory && matchesSearch
  })

  if (loading) {
    return (
      <div className="lg:mt-0 mt-16">
        <div className="text-white">Yükleniyor...</div>
      </div>
    )
  }

  return (
    <div className="lg:mt-0 mt-16">
      <div className="flex flex-wrap gap-4 justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-white flex items-center gap-3">
            <FileText className="w-8 h-8 text-blue-400" />
            Dijital Evrak Arşivi
          </h1>
          <p className="text-slate-400 mt-1">Proje evrakları ve resmi belgeler</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors font-medium"
        >
          <Plus className="w-5 h-5" />
          Yeni Evrak Yükle
        </button>
      </div>

      {/* Storage Widget */}
      <div className="mb-6">
        <StorageWidget />
      </div>

      {/* Filters */}
      <div className="bg-slate-900 rounded-xl p-6 border border-slate-800 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Proje (YİBF) Seç</label>
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
            >
              <option value="">Tüm Projeler</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name || project.title}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Evrak Tipi</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
            >
              <option value="">Tüm Tipler</option>
              <option value="RUHSAT">Ruhsat</option>
              <option value="PROJE_CIZIMI">Proje Çizimi</option>
              <option value="TUTANAK">Tutanak</option>
              <option value="ISG">İSG</option>
              <option value="SOZLESME">Sözleşme</option>
              <option value="DEKONT">Dekont</option>
              <option value="DIGER">Diğer</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Ara</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500 w-5 h-5" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Evrak adı veya proje..."
                className="w-full pl-10 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-slate-500"
              />
            </div>
          </div>

          <div className="flex items-end">
            <div className="flex gap-2 w-full">
              <button
                onClick={() => setViewMode("grid")}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg transition-colors ${
                  viewMode === "grid" 
                    ? "bg-blue-600 text-white" 
                    : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                }`}
              >
                <Grid3x3 className="w-5 h-5" />
                Grid
              </button>
              <button
                onClick={() => setViewMode("table")}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg transition-colors ${
                  viewMode === "table" 
                    ? "bg-blue-600 text-white" 
                    : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                }`}
              >
                <List className="w-5 h-5" />
                Tablo
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Documents Grid View */}
      {viewMode === "grid" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredDocuments.length > 0 ? (
            filteredDocuments.map((doc) => (
              <div key={doc.id} className="bg-slate-900 rounded-xl border border-slate-800 p-4 hover:border-slate-700 transition-all">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-slate-800 rounded-xl">
                      <FileText className="w-6 h-6 text-slate-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-white font-medium truncate">{doc.title}</h3>
                      <p className="text-slate-400 text-sm">{formatDate(doc.createdAt)}</p>
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-2 mb-3">
                  {getCategoryBadge(doc.category)}
                  {doc.expiryDate && getStatusBadge(doc)}
                </div>

                {doc.project && (
                  <div className="flex items-center gap-2 text-xs text-slate-500 mb-3">
                    <Building2 className="w-3 h-3" />
                    <span className="truncate">{doc.project.name || doc.project.title}</span>
                  </div>
                )}

                <div className="flex items-center gap-2 pt-3 border-t border-slate-800">
                  <a 
                    href={doc.fileUrl} 
                    target="_blank"
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-slate-800 text-slate-300 rounded-lg hover:bg-slate-700 transition-colors text-sm"
                  >
                    <Download className="w-4 h-4" />
                    İndir
                  </a>
                  <button
                    onClick={() => handleDelete(doc.id)}
                    className="px-3 py-2 bg-red-900/50 text-red-400 rounded-lg hover:bg-red-900 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full text-center py-16 bg-slate-900 rounded-xl border border-slate-800">
              <FileText className="w-16 h-16 mx-auto mb-4 text-slate-600" />
              <h3 className="text-xl font-semibold text-white mb-2">Henüz evrak yok</h3>
              <p className="text-slate-400">Yeni evrak yüklemek için butona tıklayın</p>
            </div>
          )}
        </div>
      )}

      {/* Documents Table View */}
      {viewMode === "table" && (
        <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
          <div className="w-full overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
            <table className="w-full min-w-max">
              <thead className="bg-slate-800">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-medium text-slate-300">Evrak Adı</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-slate-300">Tipi</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-slate-300">Proje</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-slate-300">Yüklenme Tarihi</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-slate-300">Geçerlilik Tarihi</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-slate-300">Durum</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-slate-300">İşlemler</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {filteredDocuments.length > 0 ? (
                  filteredDocuments.map((doc) => (
                    <tr key={doc.id} className="hover:bg-slate-800/50 transition-colors">
                      <td className="px-6 py-4 text-white">{doc.title}</td>
                      <td className="px-6 py-4">{getCategoryBadge(doc.category)}</td>
                      <td className="px-6 py-4 text-slate-300 text-sm">
                        {doc.project ? (doc.project.name || doc.project.title) : '-'}
                      </td>
                      <td className="px-6 py-4 text-slate-400 text-sm">{formatDate(doc.createdAt)}</td>
                      <td className="px-6 py-4 text-slate-400 text-sm">
                        {doc.expiryDate ? formatDate(doc.expiryDate) : '-'}
                      </td>
                      <td className="px-6 py-4">{doc.expiryDate ? getStatusBadge(doc) : '-'}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <a 
                            href={doc.fileUrl} 
                            target="_blank"
                            className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded-lg hover:bg-slate-700 transition-colors text-sm flex items-center gap-1"
                          >
                            <Download className="w-4 h-4" />
                            İndir
                          </a>
                          <button
                            onClick={() => handleDelete(doc.id)}
                            className="px-3 py-1.5 bg-red-900/50 text-red-400 rounded-lg hover:bg-red-900 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="px-6 py-16 text-center">
                      <FileText className="w-16 h-16 mx-auto mb-4 text-slate-600" />
                      <h3 className="text-xl font-semibold text-white mb-2">Henüz evrak yok</h3>
                      <p className="text-slate-400">Yeni evrak yüklemek için butona tıklayın</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Upload Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-xl p-6 max-w-lg w-full border border-slate-800">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-white">Yeni Evrak Yükle</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Başlık *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Örn: Yapı Ruhsatı"
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-slate-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Kategori *</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                >
                  <option value="RUHSAT">Ruhsat</option>
                  <option value="PROJE_CIZIMI">Proje Çizimi</option>
                  <option value="TUTANAK">Tutanak</option>
                  <option value="ISG">İSG</option>
                  <option value="SOZLESME">Sözleşme</option>
                  <option value="DEKONT">Dekont</option>
                  <option value="DIGER">Diğer</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Proje (Opsiyonel)</label>
                <select
                  value={formData.projectId}
                  onChange={(e) => setFormData({ ...formData, projectId: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                >
                  <option value="">Proje Seçin</option>
                  {projects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.name || project.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Geçerlilik Bitiş Tarihi (Opsiyonel)</label>
                <input
                  type="date"
                  value={formData.expiryDate}
                  onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Dosya *</label>
                <div
                  className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                    dragActive 
                      ? 'border-blue-500 bg-blue-500/10' 
                      : 'border-slate-700 hover:border-slate-600'
                  }`}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                >
                  {formData.file ? (
                    <div className="flex items-center justify-center gap-3">
                      <FileText className="w-8 h-8 text-blue-400" />
                      <span className="text-white">{formData.file.name}</span>
                      <button
                        onClick={() => setFormData({ ...formData, file: null })}
                        className="p-1 hover:bg-slate-800 rounded"
                      >
                        <X className="w-4 h-4 text-slate-400" />
                      </button>
                    </div>
                  ) : (
                    <div>
                      <Upload className="w-12 h-12 mx-auto mb-3 text-slate-500" />
                      <p className="text-slate-400 mb-2">Dosyayı sürükleyip bırakın veya</p>
                      <label className="cursor-pointer">
                        <span className="text-blue-400 hover:text-blue-300">dosya seçin</span>
                        <input
                          type="file"
                          onChange={handleFileSelect}
                          className="hidden"
                        />
                      </label>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-4 py-3 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition-colors"
                  disabled={uploading}
                >
                  İptal
                </button>
                <button
                  onClick={handleUpload}
                  className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors"
                  disabled={uploading}
                >
                  {uploading ? "Yükleniyor..." : "Yükle"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}