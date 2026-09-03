"use client"
/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * This code is the property of NXA Software.
 */


import { useState, useEffect } from "react"
import { FileText, Plus, X, Upload, Download, Trash2 } from "lucide-react"

interface Document {
  id: string
  title: string
  category: string
  fileUrl: string
  expiryDate: string | null
  createdAt: string
}

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [formData, setFormData] = useState({
    title: "",
    category: "RUHSAT",
    file: null as File | null
  })

  useEffect(() => {
    fetchDocuments()
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

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFormData({ ...formData, file: e.target.files[0] })
    }
  }

  const handleUpload = async () => {
    if (!formData.title || !formData.file) {
      alert("Lütfen başlık ve dosya seçin")
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
          fileUrl: uploadData.secure_url
        })
      })

      if (saveResponse.ok) {
        setIsModalOpen(false)
        setFormData({ title: "", category: "RUHSAT", file: null })
        fetchDocuments()
      }
    } catch (error) {
      console.error('Upload error:', error)
      alert('Bir hata oluştu')
    } finally {
      setUploading(false)
    }
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
  }

  const getCategoryBadge = (category: string) => {
    const categoryMap = {
      'RUHSAT': { bg: 'bg-blue-500/20', text: 'text-blue-400', label: 'Ruhsat' },
      'PROJE_CIZIMI': { bg: 'bg-purple-500/20', text: 'text-purple-400', label: 'Proje Çizimi' },
      'TUTANAK': { bg: 'bg-green-500/20', text: 'text-green-400', label: 'Tutanak' }
    }
    const c = categoryMap[category as keyof typeof categoryMap] || categoryMap['RUHSAT']
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium ${c.bg} ${c.text}`}>
        {c.label}
      </span>
    )
  }

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <div className="text-slate-400">Yükleniyor...</div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <FileText className="w-8 h-8 text-blue-400" />
            Ruhsat ve Evrak Arşivi
          </h1>
          <p className="text-slate-400 mt-1">Proje evrakları ve resmi belgeler</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors"
        >
          <Plus className="w-5 h-5" />
          Yeni Evrak Yükle
        </button>
      </div>

      {/* Documents Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {documents.length > 0 ? (
          documents.map((doc) => (
            <div key={doc.id} className="bg-slate-900/50 backdrop-blur-lg rounded-2xl border border-slate-800 p-4 hover:border-slate-700 transition-all">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-slate-800 rounded-xl">
                    <FileText className="w-6 h-6 text-slate-400" />
                  </div>
                  <div>
                    <h3 className="text-white font-medium">{doc.title}</h3>
                    <p className="text-slate-400 text-sm">{formatDate(doc.createdAt)}</p>
                  </div>
                </div>
                {getCategoryBadge(doc.category)}
              </div>
              <div className="flex items-center gap-2 pt-3 border-t border-slate-800">
                <a 
                  href={doc.fileUrl} 
                  target="_blank"
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-slate-800 text-slate-300 rounded-lg hover:bg-slate-700 transition-colors text-sm"
                >
                  <Download className="w-4 h-4" />
                  İndir
                </a>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full text-center py-16 bg-slate-900/50 backdrop-blur-lg rounded-2xl border border-slate-800">
            <FileText className="w-16 h-16 mx-auto mb-4 text-slate-600" />
            <h3 className="text-xl font-semibold text-white mb-2">Henüz evrak yok</h3>
            <p className="text-slate-400">Yeni evrak yüklemek için butona tıklayın</p>
          </div>
        )}
      </div>

      {/* Upload Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-2xl p-6 max-w-md w-full border border-slate-800">
            <div className="flex items-center justify-between mb-4">
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
                <label className="block text-sm text-slate-400 mb-2">Başlık</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Örn: Yapı Ruhsatı"
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-2">Kategori</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-blue-500 transition-colors"
                >
                  <option value="RUHSAT">Ruhsat</option>
                  <option value="PROJE_CIZIMI">Proje Çizimi</option>
                  <option value="TUTANAK">Tutanak</option>
                </select>
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-2">Dosya</label>
                <input
                  type="file"
                  onChange={handleFileSelect}
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-blue-500 transition-colors"
                />
                {formData.file && (
                  <p className="text-green-400 text-sm mt-2">{formData.file.name}</p>
                )}
              </div>

              <button
                onClick={handleUpload}
                disabled={uploading}
                className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {uploading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Yükleniyor...</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-5 h-5" />
                    <span>Yükle</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
