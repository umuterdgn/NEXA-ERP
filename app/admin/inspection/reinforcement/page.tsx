"use client"
/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * This code is the property of NXA Software.
 */


import { useState, useEffect } from "react"
import { Plus, X, Camera, CheckCircle, XCircle, Clock, Edit, Trash2 } from "lucide-react"

interface ReinforcementInspection {
  id: string
  projectId: string
  element: string
  status: string
  notes: string
  photoUrl: string
  inspectionDate: string
  inspectorName: string
}

export default function ReinforcementPage() {
  const [inspections, setInspections] = useState<ReinforcementInspection[]>([])
  const [projects, setProjects] = useState<any[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [selectedInspection, setSelectedInspection] = useState<ReinforcementInspection | null>(null)
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [formData, setFormData] = useState({
    projectId: "",
    element: "",
    status: "ONAYLANDI",
    notes: "",
    photo: null as File | null,
    inspectionDate: new Date().toISOString().split('T')[0],
    inspectorName: ""
  })
  const [editFormData, setEditFormData] = useState({
    element: "",
    status: "ONAYLANDI",
    notes: "",
    inspectorName: ""
  })

  useEffect(() => {
    fetchInspections()
    fetchProjects()
  }, [])

  const fetchInspections = async () => {
    try {
      const response = await fetch("/api/inspection/reinforcement")
      const data = await response.json()
      setInspections(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error("Failed to fetch inspections:", error)
      setInspections([])
    } finally {
      setLoading(false)
    }
  }

  const fetchProjects = async () => {
    try {
      const response = await fetch("/api/admin/projects")
      const data = await response.json()
      setProjects(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error("Failed to fetch projects:", error)
      setProjects([])
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFormData({ ...formData, photo: e.target.files[0] })
    }
  }

  const handleSubmit = async () => {
    if (!formData.projectId || !formData.element || !formData.photo) {
      alert("Proje, eleman ve fotoğraf zorunludur")
      return
    }

    setUploading(true)

    try {
      let photoUrl = ""
      
      // Upload to /api/upload if photo provided
      if (formData.photo) {
        const uploadFormData = new FormData()
        uploadFormData.append('file', formData.photo)

        const uploadResponse = await fetch('/api/upload', {
          method: 'POST',
          body: uploadFormData
        })

        const uploadData = await uploadResponse.json()

        if (!uploadData.url) {
          throw new Error('Fotoğraf yüklenemedi')
        }
        photoUrl = uploadData.url
      }

      // Save to database
      const saveResponse = await fetch('/api/inspection/reinforcement', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: formData.projectId,
          element: formData.element,
          status: formData.status,
          notes: formData.notes,
          photoUrl,
          inspectionDate: formData.inspectionDate,
          inspectorName: formData.inspectorName
        })
      })

      if (saveResponse.ok) {
        setIsModalOpen(false)
        setFormData({ 
          projectId: "",
          element: "", 
          status: "ONAYLANDI", 
          notes: "", 
          photo: null,
          inspectionDate: new Date().toISOString().split('T')[0],
          inspectorName: ""
        })
        fetchInspections()
      }
    } catch (error) {
      console.error('Upload error:', error)
      alert('Bir hata oluştu')
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm("Bu kaydı silmek istediğinize emin misiniz?")) {
      return
    }

    try {
      const response = await fetch(`/api/inspection/reinforcement/${id}`, { method: 'DELETE' })
      
      if (!response.ok) {
        throw new Error('Silme işlemi başarısız')
      }

      fetchInspections()
    } catch (error) {
      console.error('Delete error:', error)
      alert('Silme işlemi sırasında hata oluştu')
    }
  }

  const handleEditClick = (inspection: ReinforcementInspection) => {
    setSelectedInspection(inspection)
    setEditFormData({
      element: inspection.element,
      status: inspection.status,
      notes: inspection.notes || "",
      inspectorName: inspection.inspectorName || ""
    })
    setIsEditModalOpen(true)
  }

  const handleEditSubmit = async () => {
    if (!selectedInspection) return

    try {
      const response = await fetch(`/api/inspection/reinforcement/${selectedInspection.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editFormData)
      })

      if (!response.ok) {
        throw new Error('Güncelleme başarısız')
      }

      fetchInspections()
      setIsEditModalOpen(false)
    } catch (error) {
      console.error('Edit error:', error)
      alert('Güncelleme sırasında hata oluştu')
    }
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ONAYLANDI':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-green-500/20 text-green-400">
            <CheckCircle className="w-3.5 h-3.5" />
            Onaylandı
          </span>
        )
      case 'REDDEDILDI':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-red-500/20 text-red-400">
            <XCircle className="w-3.5 h-3.5" />
            Reddedildi
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-yellow-500/20 text-yellow-400">
            <Clock className="w-3.5 h-3.5" />
            Bekliyor
          </span>
        )
    }
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Demir & Kalıp Kontrol</h1>
          <p className="text-slate-400 mt-1">Beton dökümü öncesi demir teslimat kontrolleri</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors"
        >
          <Plus className="w-5 h-5" />
          Yeni Kontrol Ekle
        </button>
      </div>

      <div className="bg-slate-900/50 backdrop-blur-lg rounded-2xl border border-slate-800 overflow-hidden">
        <div className="w-full overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
          <table className="w-full min-w-max">
            <thead>
              <tr className="border-b border-slate-800">
                <th className="text-left px-4 py-3 text-slate-400 font-medium text-sm">Eleman</th>
                <th className="text-left px-4 py-3 text-slate-400 font-medium text-sm">Durum</th>
                <th className="text-left px-4 py-3 text-slate-400 font-medium text-sm">Notlar</th>
                <th className="text-left px-4 py-3 text-slate-400 font-medium text-sm">Fotoğraf</th>
                <th className="text-left px-4 py-3 text-slate-400 font-medium text-sm">Tarih</th>
                <th className="text-left px-4 py-3 text-slate-400 font-medium text-sm">İşlemler</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center text-slate-400 py-8">Yükleniyor...</td>
                </tr>
              ) : inspections.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center text-slate-400 py-8">Henüz kontrol kaydı yok</td>
                </tr>
              ) : (
                inspections.map((inspection) => (
                  <tr key={inspection.id} className="border-b border-slate-800 hover:bg-slate-800/50 transition-colors">
                    <td className="px-4 py-3 text-white font-medium text-sm">{inspection.element}</td>
                    <td className="px-4 py-3">{getStatusBadge(inspection.status)}</td>
                    <td className="px-4 py-3 text-slate-300 text-sm">{inspection.notes || '-'}</td>
                    <td className="px-4 py-3">
                      {inspection.photoUrl && (
                        <a
                          href={inspection.photoUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 px-2 py-1 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors text-xs"
                        >
                          <Camera className="w-3.5 h-3.5" />
                          Görüntüle
                        </a>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-300 text-sm">{formatDate(inspection.inspectionDate)}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleEditClick(inspection)}
                          className="inline-flex items-center justify-center px-3 py-1.5 bg-amber-600 text-white text-xs rounded-md hover:bg-amber-700 transition-colors"
                        >
                          <Edit className="w-3.5 h-3.5" />
                          Düzenle
                        </button>
                        <button
                          onClick={() => handleDelete(inspection.id)}
                          className="inline-flex items-center justify-center px-3 py-1.5 bg-red-600 text-white text-xs rounded-md hover:bg-red-700 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Sil
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-2xl p-6 max-w-md w-full border border-slate-800">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-white">Yeni Kontrol Ekle</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-slate-400 mb-2">Proje Seçin</label>
                <select
                  value={formData.projectId}
                  onChange={(e) => setFormData({ ...formData, projectId: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-blue-500 transition-colors"
                >
                  <option value="">Seçiniz</option>
                  {projects.map((proj) => (
                    <option key={proj.id} value={proj.id}>{proj.name || proj.title}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-2">Kontrol Tarihi</label>
                <input
                  type="date"
                  value={formData.inspectionDate}
                  onChange={(e) => setFormData({ ...formData, inspectionDate: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-2">Kontrol Eden / Denetçi</label>
                <input
                  type="text"
                  value={formData.inspectorName}
                  onChange={(e) => setFormData({ ...formData, inspectorName: e.target.value })}
                  placeholder="İşi teslim alan kişi"
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-2">Dökülecek Eleman</label>
                <input
                  type="text"
                  value={formData.element}
                  onChange={(e) => setFormData({ ...formData, element: e.target.value })}
                  placeholder="Örn: 1. Kat Kolonları"
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-2">Durum</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-blue-500 transition-colors"
                >
                  <option value="ONAYLANDI">Onaylandı</option>
                  <option value="REDDEDILDI">Reddedildi</option>
                  <option value="BEKLIYOR">Bekliyor</option>
                </select>
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-2">Notlar</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Kontrol notları..."
                  rows={3}
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors resize-none"
                />
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-2">Saha Fotoğrafı</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-blue-500 transition-colors"
                />
                {formData.photo && (
                  <p className="text-green-400 text-sm mt-2">{formData.photo.name}</p>
                )}
              </div>

              <button
                onClick={handleSubmit}
                disabled={uploading}
                className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {uploading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Kaydediliyor...</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-5 h-5" />
                    <span>Kaydet</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {isEditModalOpen && selectedInspection && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-2xl p-6 max-w-md w-full border border-slate-800">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-white">Kontrol Kaydını Düzenle</h3>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-slate-400 mb-2">Dökülecek Eleman</label>
                <input
                  type="text"
                  value={editFormData.element}
                  onChange={(e) => setEditFormData({ ...editFormData, element: e.target.value })}
                  placeholder="Örn: 1. Kat Kolonları"
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-2">Durum</label>
                <select
                  value={editFormData.status}
                  onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-blue-500 transition-colors"
                >
                  <option value="ONAYLANDI">Onaylandı</option>
                  <option value="REDDEDILDI">Reddedildi</option>
                  <option value="BEKLIYOR">Bekliyor</option>
                </select>
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-2">Kontrol Eden / Denetçi</label>
                <input
                  type="text"
                  value={editFormData.inspectorName}
                  onChange={(e) => setEditFormData({ ...editFormData, inspectorName: e.target.value })}
                  placeholder="İşi teslim alan kişi"
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-2">Notlar</label>
                <textarea
                  value={editFormData.notes}
                  onChange={(e) => setEditFormData({ ...editFormData, notes: e.target.value })}
                  placeholder="Kontrol notları..."
                  rows={3}
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors resize-none"
                />
              </div>

              <button
                onClick={handleEditSubmit}
                className="w-full py-3 bg-amber-600 hover:bg-amber-500 text-white rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                <Edit className="w-5 h-5" />
                Güncelle
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
