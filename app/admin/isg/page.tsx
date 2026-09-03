"use client"
/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * This code is the property of NXA Software.
 */


import { useState, useEffect } from "react"
import { Shield, AlertTriangle, FileText, Plus, X, Clock, Upload, Camera } from "lucide-react"

interface ISGReport {
  id: string
  type: string
  status: string
  description: string
  imageUrl: string | null
  location: string | null
  createdAt: string
  personel: {
    name: string
    personnelNo: string
  } | null
  project: {
    name: string
  } | null
}

export default function ISGPage() {
  const [isgReports, setIsgReports] = useState<ISGReport[]>([])
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [formData, setFormData] = useState({
    type: "TEHLIKE",
    description: "",
    file: null as File | null
  })

  useEffect(() => {
    fetchISGReports()
  }, [])

  const fetchISGReports = async () => {
    try {
      const response = await fetch('/api/isg')
      const data = await response.json()
      
      // API'den gelen veriyi kontrol et
      if (Array.isArray(data)) {
        setIsgReports(data)
      } else if (data && Array.isArray(data.reports)) {
        setIsgReports(data.reports)
      } else {
        setIsgReports([]) // Hata olursa veya boşsa kesinlikle boş dizi yap
        console.error("Beklenmeyen veri formatı:", data)
      }
    } catch (error) {
      console.error('Failed to fetch ISG reports:', error)
      setIsgReports([]) // Hata durumunda boş dizi yap
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
    if (!formData.description || !formData.file) {
      alert("Lütfen açıklama ve dosya seçin")
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
        throw new Error('Fotoğraf yüklenemedi')
      }

      // Save to database
      const saveResponse = await fetch('/api/isg', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageUrl: uploadData.secure_url,
          description: formData.description,
          type: formData.type
        })
      })

      if (saveResponse.ok) {
        setIsModalOpen(false)
        setFormData({ type: "TEHLIKE", description: "", file: null })
        fetchISGReports()
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
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusBadge = (status: string) => {
    const statusMap = {
      'ACIL': { bg: 'bg-red-500/20', text: 'text-red-400', label: 'Acil' },
      'INCELEMEDE': { bg: 'bg-yellow-500/20', text: 'text-yellow-400', label: 'İncelemede' },
      'COZULDU': { bg: 'bg-green-500/20', text: 'text-green-400', label: 'Çözüldü' }
    }
    const s = statusMap[status as keyof typeof statusMap] || statusMap['ACIL']
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium ${s.bg} ${s.text}`}>
        {s.label}
      </span>
    )
  }

  const getTypeBadge = (type: string) => {
    const typeMap = {
      'TEHLIKE': { bg: 'bg-orange-500/20', text: 'text-orange-400', label: 'Tehlike', icon: AlertTriangle },
      'KAZA_TUTANAGI': { bg: 'bg-red-500/20', text: 'text-red-400', label: 'Kaza Tutanığı', icon: FileText },
      'EKSIK_DOKUM': { bg: 'bg-blue-500/20', text: 'text-blue-400', label: 'Eksik Döküm', icon: FileText }
    }
    const t = typeMap[type as keyof typeof typeMap] || typeMap['TEHLIKE']
    const Icon = t.icon
    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${t.bg} ${t.text}`}>
        <Icon className="w-3.5 h-3.5" />
        {t.label}
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
            <Shield className="w-8 h-8 text-blue-400" />
            İSG Bildirim Panosu
          </h1>
          <p className="text-slate-400 mt-1">Sahadan gelen canlı tehlike bildirimleri</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors"
        >
          <Plus className="w-5 h-5" />
          Yeni Tutanak Ekle
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-slate-900/50 backdrop-blur-lg rounded-xl p-4 border border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-500/20 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-red-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">
                {(isgReports || []).filter(r => r.status === 'ACIL').length}
              </p>
              <p className="text-slate-400 text-sm">Acil</p>
            </div>
          </div>
        </div>
        <div className="bg-slate-900/50 backdrop-blur-lg rounded-xl p-4 border border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-500/20 rounded-lg">
              <FileText className="w-5 h-5 text-yellow-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">
                {(isgReports || []).filter(r => r.status === 'INCELEMEDE').length}
              </p>
              <p className="text-slate-400 text-sm">İncelemede</p>
            </div>
          </div>
        </div>
        <div className="bg-slate-900/50 backdrop-blur-lg rounded-xl p-4 border border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-500/20 rounded-lg">
              <Shield className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">
                {(isgReports || []).filter(r => r.status === 'COZULDU').length}
              </p>
              <p className="text-slate-400 text-sm">Çözüldü</p>
            </div>
          </div>
        </div>
        <div className="bg-slate-900/50 backdrop-blur-lg rounded-xl p-4 border border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <FileText className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{(isgReports || []).length}</p>
              <p className="text-slate-400 text-sm">Toplam</p>
            </div>
          </div>
        </div>
      </div>

      {/* Hazard Report Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {(isgReports || []).length > 0 ? (
          (isgReports || []).map((report) => (
            <div 
              key={report.id} 
              className="bg-slate-900/50 backdrop-blur-lg rounded-2xl border border-slate-800 overflow-hidden hover:border-slate-700 transition-all cursor-pointer"
              onClick={() => report.imageUrl && setSelectedImage(report.imageUrl)}
            >
              {/* Photo Section */}
              <div className="relative h-48 bg-slate-800">
                {report.imageUrl ? (
                  <img 
                    src={report.imageUrl} 
                    alt="Saha fotoğrafı" 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <AlertTriangle className="w-12 h-12 text-slate-600" />
                  </div>
                )}
                <div className="absolute top-3 right-3">
                  {getTypeBadge(report.type)}
                </div>
              </div>

              {/* Content Section */}
              <div className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <p className="text-white font-medium mb-1 line-clamp-2">
                      {report.description}
                    </p>
                    <div className="flex items-center gap-2 text-slate-400 text-xs">
                      <Clock className="w-3 h-3" />
                      {formatDate(report.createdAt)}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-slate-800">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-slate-700 rounded-full flex items-center justify-center">
                      <span className="text-xs text-slate-300">
                        {report.personel?.name?.charAt(0) || '?'}
                      </span>
                    </div>
                    <div>
                      <p className="text-white text-sm">{report.personel?.name || '-'}</p>
                      <p className="text-slate-500 text-xs">{report.personel?.personnelNo || '-'}</p>
                    </div>
                  </div>
                  {getStatusBadge(report.status)}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full text-center py-16 bg-slate-900/50 backdrop-blur-lg rounded-2xl border border-slate-800">
            <Shield className="w-16 h-16 mx-auto mb-4 text-slate-600" />
            <h3 className="text-xl font-semibold text-white mb-2">Henüz İSG bildirimi yok</h3>
            <p className="text-slate-400">Sahadan gelen bildirimler burada görüntülenecek</p>
          </div>
        )}
      </div>

      {/* Image Modal */}
      {selectedImage && (
        <div 
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
        >
          <button 
            onClick={(e) => {
              e.stopPropagation()
              setSelectedImage(null)
            }}
            className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
          >
            <X className="w-6 h-6 text-white" />
          </button>
          <img 
            src={selectedImage} 
            alt="Büyük fotoğraf" 
            className="max-w-full max-h-full object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      {/* New ISG Report Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-2xl p-6 max-w-md w-full border border-slate-800">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-white">Yeni İSG Bildirimi</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-slate-400 mb-2">Tehlike Tipi</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-blue-500 transition-colors"
                >
                  <option value="TEHLIKE">Tehlike</option>
                  <option value="KAZA_TUTANAGI">Kaza Tutanak</option>
                  <option value="EKSIK_DOKUM">Eksik Döküm</option>
                </select>
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-2">Açıklama</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Tehlikeyi açıklayın..."
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors resize-none"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-2">Fotoğraf</label>
                <input
                  type="file"
                  accept="image/*"
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
                    <span>Gönderiliyor...</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-5 h-5" />
                    <span>Gönder</span>
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
