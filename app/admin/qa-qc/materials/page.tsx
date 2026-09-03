"use client"
/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * This code is the property of NXA Software.
 */


import { useState, useEffect } from "react"
import { CheckCircle, XCircle, Clock, Plus, Search, Filter, FileText, X } from "lucide-react"
import toast from "react-hot-toast"

interface MaterialSubmittal {
  id: string
  materialName: string
  brand: string
  batchNumber?: string
  tseCertificate: boolean
  status: "Onay Bekliyor" | "Onaylandı" | "Reddedildi"
  inspectorName?: string
  notes?: string
  createdAt: Date
}

export default function MaterialsPage() {
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "rejected">("all")
  const [searchTerm, setSearchTerm] = useState("")
  const [materials, setMaterials] = useState<MaterialSubmittal[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    materialName: "",
    brand: "",
    batchNumber: "",
    tseCertificate: false,
    notes: ""
  })

  useEffect(() => {
    fetchMaterials()
  }, [])

  const fetchMaterials = async () => {
    try {
      const response = await fetch('/api/admin/materials')
      if (response.ok) {
        const data = await response.json()
        setMaterials(data)
      }
    } catch (error) {
      console.error('Failed to fetch materials:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.materialName || !formData.brand) {
      toast.error("Lütfen malzeme adı ve marka girin")
      return
    }

    setSubmitting(true)
    try {
      const response = await fetch('/api/admin/materials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        toast.success("Malzeme başarıyla eklendi")
        setIsModalOpen(false)
        setFormData({ materialName: "", brand: "", batchNumber: "", tseCertificate: false, notes: "" })
        fetchMaterials()
      } else {
        toast.error("Malzeme eklenirken hata oluştu")
      }
    } catch (error) {
      console.error('Failed to add material:', error)
      toast.error("Bir hata oluştu")
    } finally {
      setSubmitting(false)
    }
  }

  const filteredMaterials = materials.filter(material => {
    const matchesFilter = filter === "all" || 
      (filter === "pending" && material.status === "Onay Bekliyor") ||
      (filter === "approved" && material.status === "Onaylandı") ||
      (filter === "rejected" && material.status === "Reddedildi")
    
    const matchesSearch = material.materialName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      material.brand.toLowerCase().includes(searchTerm.toLowerCase())
    
    return matchesFilter && matchesSearch
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Onaylandı":
        return "bg-green-500/20 text-green-400 border-green-500/50"
      case "Reddedildi":
        return "bg-red-500/20 text-red-400 border-red-500/50"
      default:
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/50"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Onaylandı":
        return <CheckCircle className="w-4 h-4" />
      case "Reddedildi":
        return <XCircle className="w-4 h-4" />
      default:
        return <Clock className="w-4 h-4" />
    }
  }

  const stats = {
    total: materials.length,
    pending: materials.filter(m => m.status === "Onay Bekliyor").length,
    approved: materials.filter(m => m.status === "Onaylandı").length,
    rejected: materials.filter(m => m.status === "Reddedildi").length
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Malzeme Onayları</h1>
          <p className="text-slate-400 mt-1">Şantiye malzemelerinin kalite kontrol ve onay süreçleri</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Yeni Malzeme Sun
        </button>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-slate-800/50 backdrop-blur-lg rounded-xl border border-slate-700 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
              <FileText className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <div className="text-xl font-bold text-white">{stats.total}</div>
              <div className="text-xs text-slate-400">Toplam Malzeme</div>
            </div>
          </div>
        </div>
        <div className="bg-slate-800/50 backdrop-blur-lg rounded-xl border border-slate-700 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-yellow-500/20 flex items-center justify-center">
              <Clock className="w-5 h-5 text-yellow-400" />
            </div>
            <div>
              <div className="text-xl font-bold text-white">{stats.pending}</div>
              <div className="text-xs text-slate-400">Onay Bekliyor</div>
            </div>
          </div>
        </div>
        <div className="bg-slate-800/50 backdrop-blur-lg rounded-xl border border-slate-700 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <div className="text-xl font-bold text-white">{stats.approved}</div>
              <div className="text-xs text-slate-400">Onaylandı</div>
            </div>
          </div>
        </div>
        <div className="bg-slate-800/50 backdrop-blur-lg rounded-xl border border-slate-700 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-red-500/20 flex items-center justify-center">
              <XCircle className="w-5 h-5 text-red-400" />
            </div>
            <div>
              <div className="text-xl font-bold text-white">{stats.rejected}</div>
              <div className="text-xs text-slate-400">Reddedildi</div>
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
            onClick={() => setFilter("pending")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === "pending" ? "bg-yellow-600 text-white" : "bg-slate-800 text-slate-300 hover:bg-slate-700"
            }`}
          >
            Onay Bekliyor
          </button>
          <button
            onClick={() => setFilter("approved")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === "approved" ? "bg-green-600 text-white" : "bg-slate-800 text-slate-300 hover:bg-slate-700"
            }`}
          >
            Onaylandı
          </button>
          <button
            onClick={() => setFilter("rejected")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === "rejected" ? "bg-red-600 text-white" : "bg-slate-800 text-slate-300 hover:bg-slate-700"
            }`}
          >
            Reddedildi
          </button>
        </div>
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Malzeme veya marka ara..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      {/* Materials List */}
      <div className="bg-slate-800/50 backdrop-blur-lg rounded-xl border border-slate-700 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-400">Yükleniyor...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="text-left px-6 py-4 text-sm font-medium text-slate-400">Malzeme</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-slate-400">Marka</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-slate-400">Parti No</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-slate-400">TSE</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-slate-400">Durum</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-slate-400">Denetimci</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-slate-400">Tarih</th>
                </tr>
              </thead>
              <tbody>
                {filteredMaterials.map((material) => (
                <tr key={material.id} className="border-b border-slate-700 hover:bg-slate-700/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="text-white font-medium">{material.materialName}</div>
                    {material.notes && (
                      <div className="text-xs text-slate-400 mt-1">{material.notes}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 text-slate-300">{material.brand}</td>
                  <td className="px-6 py-4 text-slate-300">{material.batchNumber || "-"}</td>
                  <td className="px-6 py-4">
                    {material.tseCertificate ? (
                      <span className="text-green-400">✓</span>
                    ) : (
                      <span className="text-red-400">✗</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(material.status)}`}>
                      {getStatusIcon(material.status)}
                      {material.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-300">{material.inspectorName || "-"}</td>
                  <td className="px-6 py-4 text-slate-300">
                    {new Date(material.createdAt).toLocaleDateString('tr-TR')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        )}
        {filteredMaterials.length === 0 && !loading && (
          <div className="text-center py-12 text-slate-400">
            <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Malzeme bulunamadı</p>
          </div>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-800 rounded-xl border border-slate-700 w-full max-w-md">
            <div className="flex items-center justify-between p-4 border-b border-slate-700">
              <h3 className="text-lg font-semibold text-white">Yeni Malzeme Sun</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Malzeme Adı</label>
                <input
                  type="text"
                  value={formData.materialName}
                  onChange={(e) => setFormData({ ...formData, materialName: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Marka</label>
                <input
                  type="text"
                  value={formData.brand}
                  onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Parti Numarası</label>
                <input
                  type="text"
                  value={formData.batchNumber}
                  onChange={(e) => setFormData({ ...formData, batchNumber: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                />
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="tse"
                  checked={formData.tseCertificate}
                  onChange={(e) => setFormData({ ...formData, tseCertificate: e.target.checked })}
                  className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="tse" className="text-sm text-slate-300">TSE Belgesi Var</label>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Notlar</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  rows={3}
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
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
