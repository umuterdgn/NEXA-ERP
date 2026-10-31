"use client"
/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * This code is the property of NXA Software.
 */

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { Camera, MapPin, Clock, User, AlertCircle, CheckCircle, XCircle, Plus, X, Upload, Mic, Loader2, Search, Filter, FileText } from "lucide-react"

interface Deficiency {
  id: string
  floor: string
  element: string
  category: string
  priority: string
  description: string
  photoUrl: string | null
  status: string
  severity: string
  location: string | null
  createdAt: string
  updatedAt: string
  projectId: string | null
  inspectorId: string | null
  reporterId: string | null
  inspectionId: string | null
  project: {
    id: string
    name: string
    yibfNo: string | null
  } | null
  inspector: {
    id: string
    name: string
  } | null
  reporter: {
    id: string
    name: string
  } | null
  inspection: {
    id: string
    type: string
  } | null
  proofUrl?: string | null
}

export default function DeficienciesPage() {
  const { data: session } = useSession()
  const userRole = session?.user?.role as string
  const isContractor = userRole === "SUBCONTRACTOR" || userRole === "MUTEAHHIT_MUSTERI"
  
  const [deficiencies, setDeficiencies] = useState<Deficiency[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("ALL")
  const [severityFilter, setSeverityFilter] = useState("ALL")
  const [uploadModalOpen, setUploadModalOpen] = useState(false)
  const [selectedDeficiency, setSelectedDeficiency] = useState<Deficiency | null>(null)
  const [uploading, setUploading] = useState(false)
  const [proofFile, setProofFile] = useState<File | null>(null)

  useEffect(() => {
    fetchDeficiencies()
  }, [])

  const fetchDeficiencies = async () => {
    try {
      const response = await fetch("/api/admin/deficiencies")
      if (response.ok) {
        const data = await response.json()
        setDeficiencies(data)
      } else {
        setDeficiencies([])
      }
    } catch (error) {
      console.error("Failed to fetch deficiencies:", error)
      setDeficiencies([])
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "OPEN":
        return <span className="px-3 py-1 bg-red-500/20 text-red-400 rounded-full text-xs font-medium">AÇIK</span>
      case "FIX_PENDING":
        return <span className="px-3 py-1 bg-yellow-500/20 text-yellow-400 rounded-full text-xs font-medium">DÜZELTME BEKLİYOR</span>
      case "VERIFY_PENDING":
        return <span className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full text-xs font-medium">KONTROL BEKLİYOR</span>
      case "CLOSED":
        return <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-xs font-medium">KAPATILDI</span>
      default:
        return <span className="px-3 py-1 bg-slate-500/20 text-slate-400 rounded-full text-xs font-medium">{status}</span>
    }
  }

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case "CRITICAL":
        return <span className="px-3 py-1 bg-red-600/20 text-red-400 border border-red-500/30 rounded-full text-xs font-medium">KRİTİK</span>
      case "HIGH":
        return <span className="px-3 py-1 bg-orange-500/20 text-orange-400 border border-orange-500/30 rounded-full text-xs font-medium">YÜKSEK</span>
      case "MEDIUM":
        return <span className="px-3 py-1 bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 rounded-full text-xs font-medium">ORTA</span>
      case "LOW":
        return <span className="px-3 py-1 bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-full text-xs font-medium">DÜŞÜK</span>
      default:
        return <span className="px-3 py-1 bg-slate-500/20 text-slate-400 border border-slate-500/30 rounded-full text-xs font-medium">{severity}</span>
    }
  }

  const filteredDeficiencies = deficiencies.filter(deficiency => {
    const matchesSearch = deficiency.project?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         deficiency.project?.yibfNo?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         deficiency.element.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         deficiency.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         deficiency.location?.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === "ALL" || deficiency.status === statusFilter
    const matchesSeverity = severityFilter === "ALL" || deficiency.severity === severityFilter
    return matchesSearch && matchesStatus && matchesSeverity
  })

  const handleUploadProof = (deficiency: Deficiency) => {
    setSelectedDeficiency(deficiency)
    setUploadModalOpen(true)
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setProofFile(e.target.files[0])
    }
  }

  const handleSubmitProof = async () => {
    if (!selectedDeficiency || !proofFile) return

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('proof', proofFile)
      formData.append('deficiencyId', selectedDeficiency.id)

      const response = await fetch('/api/admin/deficiencies/upload-proof', {
        method: 'POST',
        body: formData
      })

      if (response.ok) {
        setUploadModalOpen(false)
        setSelectedDeficiency(null)
        setProofFile(null)
        fetchDeficiencies()
      } else {
        alert('Kanıt yüklenirken hata oluştu')
      }
    } catch (error) {
      console.error('Error uploading proof:', error)
      alert('Kanıt yüklenirken hata oluştu')
    } finally {
      setUploading(false)
    }
  }

  const canUploadProof = (deficiency: Deficiency) => {
    return isContractor && (deficiency.status === 'OPEN' || deficiency.status === 'FIX_PENDING')
  }

  return (
    <div className="min-h-screen bg-slate-950 p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Saha Eksiklikleri</h1>
        <p className="text-slate-400">Şantiye eksikliklerini ve kanıt zincirini yönetin</p>
      </div>

      {/* Actions Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-80">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Eksiklik ara..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
          >
            <option value="ALL">Tüm Durumlar</option>
            <option value="OPEN">Açık</option>
            <option value="FIX_PENDING">Düzeltme Bekliyor</option>
            <option value="VERIFY_PENDING">Kontrol Bekliyor</option>
            <option value="CLOSED">Kapatıldı</option>
          </select>
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
          >
            <option value="ALL">Tüm Önem Düzeyleri</option>
            <option value="CRITICAL">Kritik</option>
            <option value="HIGH">Yüksek</option>
            <option value="MEDIUM">Orta</option>
            <option value="LOW">Düşük</option>
          </select>
        </div>
      </div>

      {/* Cards Grid */}
      {loading ? (
        <div className="text-center py-12 text-slate-400">
          Yükleniyor...
        </div>
      ) : filteredDeficiencies.length === 0 ? (
        <div className="text-center py-12 text-slate-400">
          Henüz eksiklik kaydı bulunmuyor
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDeficiencies.map((deficiency) => (
            <div key={deficiency.id} className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden hover:border-slate-700 transition-colors">
              {/* Card Header */}
              <div className="p-4 border-b border-slate-800">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h3 className="text-white font-semibold mb-1">{deficiency.element}</h3>
                    <p className="text-slate-400 text-sm">{deficiency.category}</p>
                  </div>
                  {getSeverityBadge(deficiency.severity)}
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <span>{deficiency.floor}</span>
                  {deficiency.location && <span>• {deficiency.location}</span>}
                </div>
              </div>

              {/* Card Body */}
              <div className="p-4">
                <p className="text-slate-300 text-sm mb-4 line-clamp-3">{deficiency.description}</p>
                
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Proje:</span>
                    <span className="text-white">{deficiency.project?.name || '-'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">YİBF No:</span>
                    <span className="text-white">{deficiency.project?.yibfNo || '-'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Denetçi:</span>
                    <span className="text-white">{deficiency.inspector?.name || '-'}</span>
                  </div>
                </div>
              </div>

              {/* Card Footer */}
              <div className="p-4 bg-slate-800/50 border-t border-slate-800">
                <div className="flex items-center justify-between mb-3">
                  {getStatusBadge(deficiency.status)}
                  <span className="text-slate-500 text-xs">
                    {new Date(deficiency.createdAt).toLocaleDateString('tr-TR')}
                  </span>
                </div>
                {deficiency.proofUrl && (
                  <div className="flex items-center gap-2 text-xs text-green-400 mb-3">
                    <FileText className="w-3 h-3" />
                    <span>Kanıt yüklendi</span>
                  </div>
                )}
                {canUploadProof(deficiency) && (
                  <button
                    onClick={() => handleUploadProof(deficiency)}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm transition-colors"
                  >
                    <Upload className="w-4 h-4" />
                    <span>Kanıt Yükle ve Onaya Gönder</span>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload Modal */}
      {uploadModalOpen && selectedDeficiency && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 rounded-xl border border-slate-800 p-6 w-full max-w-md">
            <h3 className="text-xl font-bold text-white mb-4">Düzeltme Kanıtı Yükle</h3>
            <p className="text-slate-400 text-sm mb-4">
              {selectedDeficiency.element} - {selectedDeficiency.project?.yibfNo}
            </p>
            
            <div className="mb-4">
              <label className="block text-slate-300 text-sm mb-2">Kanıt Dosyası (Fotoğraf/Doküman)</label>
              <input
                type="file"
                accept="image/*,.pdf"
                onChange={handleFileSelect}
                className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setUploadModalOpen(false)}
                disabled={uploading}
                className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors disabled:opacity-50"
              >
                İptal
              </button>
              <button
                onClick={handleSubmitProof}
                disabled={!proofFile || uploading}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {uploading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Yükleniyor...</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    <span>Yükle ve Gönder</span>
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
