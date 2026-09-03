"use client"
/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * This code is the property of NXA Software.
 */


import { useState, useEffect } from "react"
import { Plus, X, MapPin, Calendar, Image as ImageIcon, Edit, Trash2, ExternalLink } from "lucide-react"

interface AttachmentEvidence {
  id: string
  projectId: string
  title: string
  location: string
  description: string
  photoUrl: string
  attachmentDate: string
  createdBy: string
  createdAt: string
}

export default function AttachmentPage() {
  const [attachments, setAttachments] = useState<AttachmentEvidence[]>([])
  const [projects, setProjects] = useState<any[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [selectedAttachment, setSelectedAttachment] = useState<AttachmentEvidence | null>(null)
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [formData, setFormData] = useState({
    projectId: "",
    title: "",
    location: "",
    description: "",
    photo: null as File | null,
    attachmentDate: new Date().toISOString().split('T')[0],
    createdBy: ""
  })
  const [editFormData, setEditFormData] = useState({
    title: "",
    location: "",
    description: "",
    createdBy: ""
  })

  useEffect(() => {
    fetchAttachments()
    fetchProjects()
  }, [])

  const fetchAttachments = async () => {
    try {
      const response = await fetch("/api/inspection/attachment")
      const data = await response.json()
      setAttachments(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error("Failed to fetch attachments:", error)
      setAttachments([])
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
    if (!formData.projectId || !formData.title || !formData.location || !formData.photo) {
      alert("Proje, başlık, konum ve fotoğraf zorunludur")
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
      const saveResponse = await fetch('/api/inspection/attachment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: formData.projectId,
          title: formData.title,
          location: formData.location,
          description: formData.description,
          photoUrl,
          attachmentDate: formData.attachmentDate,
          createdBy: formData.createdBy
        })
      })

      if (saveResponse.ok) {
        setIsModalOpen(false)
        setFormData({ 
          projectId: "",
          title: "", 
          location: "", 
          description: "", 
          photo: null,
          attachmentDate: new Date().toISOString().split('T')[0],
          createdBy: ""
        })
        fetchAttachments()
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
      const response = await fetch(`/api/inspection/attachment/${id}`, { method: 'DELETE' })
      
      if (!response.ok) {
        throw new Error('Silme işlemi başarısız')
      }

      fetchAttachments()
    } catch (error) {
      console.error('Delete error:', error)
      alert('Silme işlemi sırasında hata oluştu')
    }
  }

  const handleEditClick = (attachment: AttachmentEvidence) => {
    setSelectedAttachment(attachment)
    setEditFormData({
      title: attachment.title,
      location: attachment.location,
      description: attachment.description || "",
      createdBy: attachment.createdBy || ""
    })
    setIsEditModalOpen(true)
  }

  const handleEditSubmit = async () => {
    if (!selectedAttachment) return

    try {
      const response = await fetch(`/api/inspection/attachment/${selectedAttachment.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editFormData)
      })

      if (!response.ok) {
        throw new Error('Güncelleme başarısız')
      }

      fetchAttachments()
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

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Ataşman & Dijital Delil</h1>
          <p className="text-slate-400 mt-1">Toprak altı imalat fotoğraf arşivi</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors"
        >
          <Plus className="w-5 h-5" />
          Yeni Ataşman Ekle
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full text-center text-slate-400 py-8">Yükleniyor...</div>
        ) : attachments.length === 0 ? (
          <div className="col-span-full text-center text-slate-400 py-8">
            <ImageIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Henüz ataşman kaydı yok</p>
          </div>
        ) : (
          attachments.map((attachment) => (
            <div
              key={attachment.id}
              className="bg-slate-900/50 backdrop-blur-lg rounded-2xl border border-slate-800 overflow-hidden hover:border-slate-700 transition-colors"
            >
              <div className="aspect-video bg-slate-800 relative">
                {attachment.photoUrl && (
                  <img
                    src={attachment.photoUrl}
                    alt={attachment.title}
                    className="w-full h-full object-cover"
                  />
                )}
              </div>
              <div className="p-4">
                <h3 className="text-white font-semibold mb-2">{attachment.title}</h3>
                <div className="flex items-center gap-2 text-slate-400 text-sm mb-2">
                  <MapPin className="w-4 h-4" />
                  <span>{attachment.location}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-400 text-sm mb-3">
                  <Calendar className="w-4 h-4" />
                  <span>{formatDate(attachment.attachmentDate)}</span>
                </div>
                {attachment.description && (
                  <p className="text-slate-300 text-sm line-clamp-2 mb-3">{attachment.description}</p>
                )}
                <div className="flex items-center gap-2 pt-3 border-t border-slate-800">
                  <a
                    href={attachment.photoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs rounded-md transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    İncele
                  </a>
                  <button
                    onClick={() => handleEditClick(attachment)}
                    className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 bg-amber-600 hover:bg-amber-500 text-white text-xs rounded-md transition-colors"
                  >
                    <Edit className="w-3.5 h-3.5" />
                    Düzenle
                  </button>
                  <button
                    onClick={() => handleDelete(attachment.id)}
                    className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 bg-red-600 hover:bg-red-500 text-white text-xs rounded-md transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Sil
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-2xl p-6 max-w-md w-full border border-slate-800">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-white">Yeni Ataşman Ekle</h3>
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
                <label className="block text-sm text-slate-400 mb-2">Tarih</label>
                <input
                  type="date"
                  value={formData.attachmentDate}
                  onChange={(e) => setFormData({ ...formData, attachmentDate: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-2">Ekleyen / Sorumlu</label>
                <input
                  type="text"
                  value={formData.createdBy}
                  onChange={(e) => setFormData({ ...formData, createdBy: e.target.value })}
                  placeholder="Delili sisteme yükleyen kişi"
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-2">Başlık</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Örn: Temel Ataşmanı"
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-2">Mahal/Konum Bilgisi</label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="Örn: A Blok Temel"
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-2">Açıklama</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Ataşman açıklaması..."
                  rows={3}
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors resize-none"
                />
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-2">Fotoğraf (Zorunlu)</label>
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
      {isEditModalOpen && selectedAttachment && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-2xl p-6 max-w-md w-full border border-slate-800">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-white">Ataşman Kaydını Düzenle</h3>
              <button
                onClick={() => setIsEditModalOpen(false)}
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
                  value={editFormData.title}
                  onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })}
                  placeholder="Örn: Temel Ataşmanı"
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-2">Mahal/Konum Bilgisi</label>
                <input
                  type="text"
                  value={editFormData.location}
                  onChange={(e) => setEditFormData({ ...editFormData, location: e.target.value })}
                  placeholder="Örn: A Blok Temel"
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-2">Ekleyen / Sorumlu</label>
                <input
                  type="text"
                  value={editFormData.createdBy}
                  onChange={(e) => setEditFormData({ ...editFormData, createdBy: e.target.value })}
                  placeholder="Delili sisteme yükleyen kişi"
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-2">Açıklama</label>
                <textarea
                  value={editFormData.description}
                  onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                  placeholder="Ataşman açıklaması..."
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
