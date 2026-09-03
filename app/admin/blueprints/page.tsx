"use client"
/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * This code is the property of NXA Software.
 */


import { useState, useEffect } from "react"
import { FileText, Plus, X, Download, Eye, Calendar, Building2 } from "lucide-react"

interface Blueprint {
  id: string
  title: string
  discipline: string
  revisionNo: string
  fileUrl: string
  isCurrent: boolean
  createdAt: string
  project: {
    name: string
  }
}

export default function BlueprintsPage() {
  const [activeTab, setActiveTab] = useState("MIMARI")
  const [blueprints, setBlueprints] = useState<Blueprint[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [formData, setFormData] = useState({
    projectId: "",
    title: "",
    discipline: "MIMARI",
    revisionNo: "R0",
    file: null as File | null
  })

  const disciplines = [
    { id: "MIMARI", label: "Mimari", color: "text-purple-400" },
    { id: "STATIK", label: "Statik", color: "text-blue-400" },
    { id: "ELEKTRIK", label: "Elektrik", color: "text-yellow-400" },
    { id: "MEKANIK", label: "Mekanik", color: "text-green-400" }
  ]

  useEffect(() => {
    fetchBlueprints()
  }, [activeTab])

  const fetchBlueprints = async () => {
    try {
      const response = await fetch(`/api/blueprints?discipline=${activeTab}`)
      const data = await response.json()
      setBlueprints(data)
    } catch (error) {
      console.error('Failed to fetch blueprints:', error)
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
    if (!formData.title || !formData.file || !formData.projectId) {
      alert("Lütfen proje, başlık ve dosya seçin")
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
      const saveResponse = await fetch('/api/blueprints', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: formData.projectId,
          title: formData.title,
          discipline: formData.discipline,
          revisionNo: formData.revisionNo,
          fileUrl: uploadData.secure_url
        })
      })

      if (saveResponse.ok) {
        setIsModalOpen(false)
        setFormData({ projectId: "", title: "", discipline: "MIMARI", revisionNo: "R0", file: null })
        fetchBlueprints()
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

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Dijital Projeler / Çizimler</h1>
          <p className="text-slate-400 mt-1">Proje revizyonlarını takip edin ve yönetin</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors"
        >
          <Plus className="w-5 h-5" />
          Yeni Çizim / Revizyon Yükle
        </button>
      </div>

      {/* Discipline Tabs */}
      <div className="bg-slate-900/50 backdrop-blur-lg rounded-2xl border border-slate-800 overflow-hidden">
        <div className="flex border-b border-slate-800">
          {disciplines.map((discipline) => (
            <button
              key={discipline.id}
              onClick={() => setActiveTab(discipline.id)}
              className={`flex-1 px-6 py-4 font-medium transition-colors ${
                activeTab === discipline.id
                  ? `text-white border-b-2 border-blue-400 bg-slate-800/50`
                  : "text-slate-400 hover:text-white"
              }`}
            >
              {discipline.label}
            </button>
          ))}
        </div>

        {/* Blueprint List */}
        <div className="p-6">
          {loading ? (
            <div className="text-center text-slate-400 py-8">Yükleniyor...</div>
          ) : blueprints.length === 0 ? (
            <div className="text-center text-slate-400 py-8">
              <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Bu disiplinde henüz çizim yok</p>
            </div>
          ) : (
            <div className="space-y-4">
              {(blueprints || []).map((blueprint) => (
                <div
                  key={blueprint.id}
                  className="bg-slate-800/50 rounded-xl p-4 border border-slate-700 hover:border-slate-600 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <h3 className="text-white font-medium">{blueprint.title}</h3>
                        {blueprint.isCurrent && (
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-500/20 text-green-400">
                            Revizyon: {blueprint.revisionNo} (Aktif)
                          </span>
                        )}
                        {!blueprint.isCurrent && (
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-slate-600/20 text-slate-400">
                            Revizyon: {blueprint.revisionNo} (Arşiv)
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-4 mt-2 text-sm text-slate-400">
                        <div className="flex items-center gap-1">
                          <Building2 className="w-4 h-4" />
                          {blueprint.project.name}
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {formatDate(blueprint.createdAt)}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <a
                        href={blueprint.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 px-3 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors text-sm"
                      >
                        <Eye className="w-4 h-4" />
                        Görüntüle
                      </a>
                      <a
                        href={blueprint.fileUrl}
                        download
                        className="flex items-center gap-1 px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors text-sm"
                      >
                        <Download className="w-4 h-4" />
                        İndir
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Upload Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-2xl p-6 max-w-md w-full border border-slate-800">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-white">Yeni Çizim / Revizyon Yükle</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-slate-400 mb-2">Proje</label>
                <select
                  value={formData.projectId}
                  onChange={(e) => setFormData({ ...formData, projectId: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-blue-500 transition-colors"
                >
                  <option value="">Proje Seçiniz</option>
                  <option value="proj-1">A Blok Konut Projesi</option>
                  <option value="proj-2">B Blok Ticari Alan</option>
                  <option value="proj-3">C Blok Ofis Binası</option>
                </select>
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-2">Çizim Başlığı</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Örn: A Blok Statik Aplikasyon Planı"
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-2">Disiplin</label>
                <select
                  value={formData.discipline}
                  onChange={(e) => setFormData({ ...formData, discipline: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-blue-500 transition-colors"
                >
                  <option value="MIMARI">Mimari</option>
                  <option value="STATIK">Statik</option>
                  <option value="ELEKTRIK">Elektrik</option>
                  <option value="MEKANIK">Mekanik</option>
                </select>
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-2">Revizyon No</label>
                <input
                  type="text"
                  value={formData.revisionNo}
                  onChange={(e) => setFormData({ ...formData, revisionNo: e.target.value })}
                  placeholder="Örn: R1"
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-2">Çizim Dosyası (PDF/Görsel)</label>
                <input
                  type="file"
                  accept=".pdf,image/*"
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
                    <Plus className="w-5 h-5" />
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
