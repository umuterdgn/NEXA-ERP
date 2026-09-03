"use client"
/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * This code is the property of NXA Software.
 */


import { useState, useEffect } from "react"
import { AlertOctagon, Plus, Search, Camera, Calendar, User, MapPin, CheckCircle, Clock, XCircle, X } from "lucide-react"
import toast from "react-hot-toast"

interface NonConformanceReport {
  id: string
  location: string
  issueType: string
  description: string
  photoUrl?: string
  subcontractor: string
  status: "Açık" | "İşlemde" | "Kapalı"
  dueDate?: string | Date
  createdAt: string | Date
}

export default function NCRPage() {
  const [filter, setFilter] = useState<"all" | "open" | "in-progress" | "closed">("all")
  const [searchTerm, setSearchTerm] = useState("")
  const [reports, setReports] = useState<NonConformanceReport[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    location: "",
    issueType: "",
    description: "",
    subcontractor: "",
    dueDate: "",
    notes: ""
  })

  useEffect(() => {
    fetchReports()
  }, [])

  const fetchReports = async () => {
    try {
      const response = await fetch('/api/admin/ncr')
      if (response.ok) {
        const data = await response.json()
        setReports(data)
      }
    } catch (error) {
      console.error('Failed to fetch reports:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.location || !formData.issueType || !formData.description || !formData.subcontractor) {
      toast.error("Lütfen zorunlu alanları doldurun")
      return
    }

    setSubmitting(true)
    try {
      const response = await fetch('/api/admin/ncr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        toast.success("DÖF başarıyla oluşturuldu")
        setIsModalOpen(false)
        setFormData({ location: "", issueType: "", description: "", subcontractor: "", dueDate: "", notes: "" })
        fetchReports()
      } else {
        toast.error("DÖF oluşturulurken hata oluştu")
      }
    } catch (error) {
      console.error('Failed to create NCR:', error)
      toast.error("Bir hata oluştu")
    } finally {
      setSubmitting(false)
    }
  }

  const updateStatus = async (reportId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/admin/ncr/${reportId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      })

      if (response.ok) {
        toast.success(`Durum güncellendi: ${newStatus}`)
        fetchReports()
      } else {
        toast.error("Durum güncellenirken hata oluştu")
      }
    } catch (error) {
      console.error('Failed to update status:', error)
      toast.error("Bir hata oluştu")
    }
  }

  const filteredReports = reports.filter(report => {
    const matchesFilter = filter === "all" || 
      (filter === "open" && report.status === "Açık") ||
      (filter === "in-progress" && report.status === "İşlemde") ||
      (filter === "closed" && report.status === "Kapalı")
    
    const matchesSearch = report.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.issueType.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.subcontractor.toLowerCase().includes(searchTerm.toLowerCase())
    
    return matchesFilter && matchesSearch
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Kapalı":
        return "bg-green-500/20 text-green-400 border-green-500/50"
      case "İşlemde":
        return "bg-blue-500/20 text-blue-400 border-blue-500/50"
      default:
        return "bg-red-500/20 text-red-400 border-red-500/50"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Kapalı":
        return <CheckCircle className="w-4 h-4" />
      case "İşlemde":
        return <Clock className="w-4 h-4" />
      default:
        return <XCircle className="w-4 h-4" />
    }
  }

  const getDueDateColor = (dueDateString?: string | Date | null) => {
    if (!dueDateString) return "text-slate-400"
    const dueDate = new Date(dueDateString)
    const today = new Date()
    const diffDays = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    if (diffDays < 0) return "text-red-400"
    if (diffDays <= 2) return "text-yellow-400"
    return "text-slate-400"
  }

  const stats = {
    total: reports.length,
    open: reports.filter(r => r.status === "Açık").length,
    inProgress: reports.filter(r => r.status === "İşlemde").length,
    closed: reports.filter(r => r.status === "Kapalı").length
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Uygunsuzluk & DÖF</h1>
          <p className="text-slate-400 mt-1">Saha hataları ve düzeltme faaliyetleri takibi</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-500 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Yeni DÖF Oluştur
        </button>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-slate-800/50 backdrop-blur-lg rounded-xl border border-slate-700 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
              <AlertOctagon className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <div className="text-xl font-bold text-white">{stats.total}</div>
              <div className="text-xs text-slate-400">Toplam Rapor</div>
            </div>
          </div>
        </div>
        <div className="bg-slate-800/50 backdrop-blur-lg rounded-xl border border-slate-700 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-red-500/20 flex items-center justify-center">
              <XCircle className="w-5 h-5 text-red-400" />
            </div>
            <div>
              <div className="text-xl font-bold text-white">{stats.open}</div>
              <div className="text-xs text-slate-400">Açık</div>
            </div>
          </div>
        </div>
        <div className="bg-slate-800/50 backdrop-blur-lg rounded-xl border border-slate-700 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
              <Clock className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <div className="text-xl font-bold text-white">{stats.inProgress}</div>
              <div className="text-xs text-slate-400">İşlemde</div>
            </div>
          </div>
        </div>
        <div className="bg-slate-800/50 backdrop-blur-lg rounded-xl border border-slate-700 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <div className="text-xl font-bold text-white">{stats.closed}</div>
              <div className="text-xs text-slate-400">Kapalı</div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex gap-2">
          <button
            onClick={() => setFilter("all")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === "all" ? "bg-blue-600 text-white" : "bg-slate-800 text-slate-300 hover:bg-slate-700"
            }`}
          >
            Tümü
          </button>
          <button
            onClick={() => setFilter("open")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === "open" ? "bg-red-600 text-white" : "bg-slate-800 text-slate-300 hover:bg-slate-700"
            }`}
          >
            Açık
          </button>
          <button
            onClick={() => setFilter("in-progress")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === "in-progress" ? "bg-blue-600 text-white" : "bg-slate-800 text-slate-300 hover:bg-slate-700"
            }`}
          >
            İşlemde
          </button>
          <button
            onClick={() => setFilter("closed")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === "closed" ? "bg-green-600 text-white" : "bg-slate-800 text-slate-300 hover:bg-slate-700"
            }`}
          >
            Kapalı
          </button>
        </div>
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Konum, hata tipi veya taşeron ara..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      {/* Reports Grid */}
      {loading ? (
        <div className="text-center py-12 text-slate-400">Yükleniyor...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredReports.map((report) => (
          <div key={report.id} className="bg-slate-800/50 backdrop-blur-lg rounded-xl border border-slate-700 overflow-hidden hover:border-slate-600 transition-colors">
            {/* Photo Section */}
            {report.photoUrl ? (
              <div className="h-40 bg-slate-900 relative">
                <div className="absolute inset-0 flex items-center justify-center text-slate-600">
                  <Camera className="w-12 h-12" />
                </div>
                <div className="absolute top-2 right-2">
                  <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(report.status)}`}>
                    {getStatusIcon(report.status)}
                    {report.status}
                  </span>
                </div>
              </div>
            ) : (
              <div className="h-20 bg-slate-900 flex items-center justify-center relative">
                <Camera className="w-8 h-8 text-slate-600" />
                <div className="absolute top-2 right-2">
                  <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(report.status)}`}>
                    {getStatusIcon(report.status)}
                    {report.status}
                  </span>
                </div>
              </div>
            )}

            {/* Content */}
            <div className="p-4 space-y-3">
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
                <div>
                  <div className="text-white font-medium">{report.location}</div>
                  <div className="text-sm text-slate-400">{report.issueType}</div>
                </div>
              </div>

              <p className="text-sm text-slate-300 line-clamp-2">{report.description}</p>

              <div className="flex items-center gap-2 text-sm text-slate-400">
                <User className="w-4 h-4" />
                <span>{report.subcontractor}</span>
              </div>

              {report.dueDate && (
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="w-4 h-4 text-slate-400" />
                  <span className={getDueDateColor(report.dueDate)}>
                    Son Tarih: {new Date(report.dueDate).toLocaleDateString('tr-TR')}
                  </span>
                </div>
              )}

              <div className="pt-3 border-t border-slate-700 text-xs text-slate-500 flex items-center justify-between">
                <span>{new Date(report.createdAt).toLocaleDateString('tr-TR')}</span>
                <div className="flex gap-2">
                  {report.status === "Açık" && (
                    <button
                      onClick={() => updateStatus(report.id, "İşlemde")}
                      className="px-2 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-500 transition-colors"
                    >
                      İşleme Al
                    </button>
                  )}
                  {report.status === "İşlemde" && (
                    <button
                      onClick={() => updateStatus(report.id, "Kapalı")}
                      className="px-2 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-500 transition-colors"
                    >
                      Kapat
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
        </div>
      )}

      {filteredReports.length === 0 && !loading && (
        <div className="text-center py-12 text-slate-400">
          <AlertOctagon className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>Rapor bulunamadı</p>
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-800 rounded-xl border border-slate-700 w-full max-w-md">
            <div className="flex items-center justify-between p-4 border-b border-slate-700">
              <h3 className="text-lg font-semibold text-white">Yeni DÖF Oluştur</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Konum</label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  placeholder="Örn: A Blok - 3. Kat"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Hata Tipi</label>
                <input
                  type="text"
                  value={formData.issueType}
                  onChange={(e) => setFormData({ ...formData, issueType: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  placeholder="Örn: Paspayı Yetersiz"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Açıklama</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  rows={3}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Taşeron</label>
                <input
                  type="text"
                  value={formData.subcontractor}
                  onChange={(e) => setFormData({ ...formData, subcontractor: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  placeholder="Örn: Demirci Ekibi"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Son Tarih</label>
                <input
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Notlar</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  rows={2}
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? "Kaydediliyor..." : "Kaydet"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
