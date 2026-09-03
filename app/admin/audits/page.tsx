"use client"
/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * This code is the property of NXA Software.
 */

import { useState, useEffect } from "react"
import { 
  ClipboardCheck, 
  ShieldAlert, 
  Plus, 
  Search,
  Filter,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  X
} from "lucide-react"

interface Audit {
  id: string
  title: string
  type: string
  score: number
  status: string
  notes: string | null
  createdAt: string
  projectId: string
  subcontractorId: string
  inspectorId: string
  project: {
    id: string
    name: string
  }
  subcontractor: {
    id: string
    name: string
  }
  inspector: {
    id: string
    name: string
  }
}

export default function AuditsPage() {
  const [audits, setAudits] = useState<Audit[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("ALL")

  // Form state
  const [formData, setFormData] = useState({
    projectId: "",
    subcontractorId: "",
    type: "QUALITY",
    score: 100,
    notes: ""
  })

  // Mock data for projects and subcontractors (will be fetched from API)
  const [projects, setProjects] = useState<any[]>([])
  const [subcontractors, setSubcontractors] = useState<any[]>([])

  useEffect(() => {
    fetchAudits()
    fetchProjects()
    fetchSubcontractors()
  }, [])

  const fetchAudits = async () => {
    try {
      const response = await fetch("/api/admin/audits")
      if (response.ok) {
        const data = await response.json()
        setAudits(data)
      } else {
        // Mock data for now
        setAudits([
          {
            id: "1",
            title: "A Blok 3. Kat Kalıp Denetimi",
            type: "QUALITY",
            score: 85,
            status: "PASSED",
            notes: "Kalıp işçiliği genel olarak iyi, bazı düzeltmeler gerekiyor.",
            createdAt: new Date().toISOString(),
            projectId: "1",
            subcontractorId: "1",
            inspectorId: "1",
            project: { id: "1", name: "Merkez Plaza Projesi" },
            subcontractor: { id: "1", name: "Yıldız İnşaat Ltd." },
            inspector: { id: "1", name: "Ahmet Yılmaz" }
          },
          {
            id: "2",
            title: "İSG Ekipman Kontrolü",
            type: "OHS",
            score: 45,
            status: "FAILED",
            notes: "KKD eksikleri tespit edildi, derhal düzeltilmeli.",
            createdAt: new Date(Date.now() - 86400000).toISOString(),
            projectId: "1",
            subcontractorId: "2",
            inspectorId: "2",
            project: { id: "1", name: "Merkez Plaza Projesi" },
            subcontractor: { id: "2", name: "Demir Yapı A.Ş." },
            inspector: { id: "2", name: "Mehmet Kaya" }
          }
        ])
      }
    } catch (error) {
      console.error("Failed to fetch audits:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchProjects = async () => {
    try {
      const response = await fetch("/api/admin/projects")
      if (response.ok) {
        const data = await response.json()
        setProjects(data)
      }
    } catch (error) {
      console.error("Failed to fetch projects:", error)
    }
  }

  const fetchSubcontractors = async () => {
    try {
      const response = await fetch("/api/admin/companies?type=SUBCONTRACTOR")
      if (response.ok) {
        const data = await response.json()
        setSubcontractors(data)
      }
    } catch (error) {
      console.error("Failed to fetch subcontractors:", error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const response = await fetch("/api/admin/audits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        setShowModal(false)
        setFormData({ projectId: "", subcontractorId: "", type: "QUALITY", score: 100, notes: "" })
        fetchAudits()
      }
    } catch (error) {
      console.error("Failed to create audit:", error)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PASSED":
        return <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-xs font-medium">BAŞARILI</span>
      case "FAILED":
        return <span className="px-3 py-1 bg-red-500/20 text-red-400 rounded-full text-xs font-medium">BAŞARISIZ</span>
      case "ACTION_REQUIRED":
        return <span className="px-3 py-1 bg-yellow-500/20 text-yellow-400 rounded-full text-xs font-medium">EYLEM GEREKİYOR</span>
      default:
        return <span className="px-3 py-1 bg-slate-500/20 text-slate-400 rounded-full text-xs font-medium">{status}</span>
    }
  }

  const getTypeBadge = (type: string) => {
    switch (type) {
      case "OHS":
        return <span className="px-2 py-1 bg-red-500/20 text-red-400 rounded text-xs">İSG</span>
      case "QUALITY":
        return <span className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded text-xs">KALİTE</span>
      case "PROGRESS":
        return <span className="px-2 py-1 bg-purple-500/20 text-purple-400 rounded text-xs">İLERLEME</span>
      default:
        return <span className="px-2 py-1 bg-slate-500/20 text-slate-400 rounded text-xs">{type}</span>
    }
  }

  const filteredAudits = audits.filter(audit => {
    const matchesSearch = audit.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         audit.subcontractor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         audit.inspector.name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === "ALL" || audit.status === statusFilter
    return matchesSearch && matchesStatus
  })

  // KPI Calculations
  const totalAuditsThisMonth = audits.filter(a => {
    const auditDate = new Date(a.createdAt)
    const now = new Date()
    return auditDate.getMonth() === now.getMonth() && auditDate.getFullYear() === now.getFullYear()
  }).length

  const criticalSubcontractors = new Set(
    audits.filter(a => a.status === "FAILED" || a.score < 50).map(a => a.subcontractorId)
  ).size

  const averageScore = audits.length > 0 
    ? Math.round(audits.reduce((sum, a) => sum + a.score, 0) / audits.length)
    : 0

  return (
    <div className="min-h-screen bg-slate-950 p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Taşeron Denetimleri</h1>
        <p className="text-slate-400">Taşeron firmaların kalite ve İSG performansını değerlendirin</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Total Audits This Month */}
        <div className="bg-gradient-to-br from-blue-900/50 to-slate-900 rounded-xl p-6 border border-blue-800">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-blue-600/20 rounded-lg flex items-center justify-center">
              <ClipboardCheck className="w-6 h-6 text-blue-400" />
            </div>
            <span className="text-3xl font-bold text-white">{totalAuditsThisMonth}</span>
          </div>
          <p className="text-slate-300 font-medium">Bu Ayki Toplam Denetim</p>
          <p className="text-slate-500 text-sm mt-1">Yapılan denetim sayısı</p>
        </div>

        {/* Critical Subcontractors */}
        <div className="bg-gradient-to-br from-red-900/50 to-slate-900 rounded-xl p-6 border border-red-800">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-red-600/20 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-red-400" />
            </div>
            <span className="text-3xl font-bold text-white">{criticalSubcontractors}</span>
          </div>
          <p className="text-slate-300 font-medium">Kritik Uyarı Alan Taşeron</p>
          <p className="text-slate-500 text-sm mt-1">Düşük performanslı firmalar</p>
        </div>

        {/* Average Quality Score */}
        <div className="bg-gradient-to-br from-emerald-900/50 to-slate-900 rounded-xl p-6 border border-emerald-800">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-emerald-600/20 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-emerald-400" />
            </div>
            <span className="text-3xl font-bold text-white">{averageScore}</span>
          </div>
          <p className="text-slate-300 font-medium">Ortalama Kalite Skoru</p>
          <p className="text-slate-500 text-sm mt-1">100 üzerinden puan</p>
        </div>
      </div>

      {/* Actions Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-80">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Denetim ara..."
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
            <option value="PASSED">Başarılı</option>
            <option value="FAILED">Başarısız</option>
            <option value="ACTION_REQUIRED">Eylem Gerekiyor</option>
          </select>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors font-medium"
        >
          <Plus className="w-4 h-4" />
          Yeni Denetim Raporu
        </button>
      </div>

      {/* Data Table */}
      <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
        <div className="w-full overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
          <table className="w-full min-w-max">
            <thead>
              <tr className="border-b border-slate-800">
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Denetim Başlığı</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Taşeron</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Denetmen</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Tür</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Puan</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Durum</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Tarih</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                    Yükleniyor...
                  </td>
                </tr>
              ) : filteredAudits.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                    Henüz denetim kaydı bulunmuyor
                  </td>
                </tr>
              ) : (
                filteredAudits.map((audit) => (
                  <tr key={audit.id} className="border-b border-slate-800 hover:bg-slate-800/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="text-white font-medium">{audit.title}</div>
                      <div className="text-slate-400 text-sm">{audit.project.name}</div>
                    </td>
                    <td className="px-6 py-4 text-white">{audit.subcontractor.name}</td>
                    <td className="px-6 py-4 text-white">{audit.inspector.name}</td>
                    <td className="px-6 py-4">{getTypeBadge(audit.type)}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className={`font-bold ${audit.score >= 70 ? 'text-green-400' : audit.score >= 50 ? 'text-yellow-400' : 'text-red-400'}`}>
                          {audit.score}
                        </span>
                        <span className="text-slate-400 text-sm">/100</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">{getStatusBadge(audit.status)}</td>
                    <td className="px-6 py-4 text-slate-400">
                      {new Date(audit.createdAt).toLocaleDateString('tr-TR')}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Audit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-2xl p-6 max-w-lg w-full border border-slate-800 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-white">Yeni Denetim Raporu</h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm text-slate-400 mb-2">Proje</label>
                <select
                  value={formData.projectId}
                  onChange={(e) => setFormData({ ...formData, projectId: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-blue-500"
                  required
                >
                  <option value="">Proje Seçin</option>
                  {projects.map((project) => (
                    <option key={project.id} value={project.id}>{project.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-2">Taşeron Firma</label>
                <select
                  value={formData.subcontractorId}
                  onChange={(e) => setFormData({ ...formData, subcontractorId: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-blue-500"
                  required
                >
                  <option value="">Taşeron Seçin</option>
                  {subcontractors.map((sub) => (
                    <option key={sub.id} value={sub.id}>{sub.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-2">Denetim Türü</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="QUALITY">Kalite Denetimi</option>
                  <option value="OHS">İSG Denetimi</option>
                  <option value="PROGRESS">İlerleme Denetimi</option>
                </select>
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-2">Puan (0-100)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={formData.score}
                  onChange={(e) => setFormData({ ...formData, score: parseInt(e.target.value) })}
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-2">Açıklama / Notlar</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-blue-500 resize-none"
                  placeholder="Denetim detaylarını girin..."
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl transition-colors font-medium"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition-colors font-medium"
                >
                  Denetim Oluştur
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
