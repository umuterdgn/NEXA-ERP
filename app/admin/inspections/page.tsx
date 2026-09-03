"use client"
/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * This code is the property of NXA Software.
 */

import { useState, useEffect } from "react"
import { 
  ClipboardCheck, 
  Search,
  Filter,
  AlertTriangle,
  CheckCircle,
  Clock,
  MapPin,
  FileText
} from "lucide-react"

interface Inspection {
  id: string
  type: string
  floor: string | null
  status: string
  inspectionDate: string
  gpsLocation: string | null
  notes: string | null
  createdAt: string
  projectId: string
  inspectorId: string
  project: {
    id: string
    name: string
    yibfNo: string | null
  }
  inspector: {
    id: string
    name: string
  }
}

export default function InspectionsPage() {
  const [inspections, setInspections] = useState<Inspection[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("ALL")

  useEffect(() => {
    fetchInspections()
  }, [])

  const fetchInspections = async () => {
    try {
      const response = await fetch("/api/admin/inspections")
      if (response.ok) {
        const data = await response.json()
        setInspections(data)
      } else {
        setInspections([])
      }
    } catch (error) {
      console.error("Failed to fetch inspections:", error)
      setInspections([])
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "APPROVED":
        return <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-xs font-medium">ONAYLANDI</span>
      case "REJECTED":
        return <span className="px-3 py-1 bg-red-500/20 text-red-400 rounded-full text-xs font-medium">REDDEDİLDİ</span>
      case "PENDING":
        return <span className="px-3 py-1 bg-yellow-500/20 text-yellow-400 rounded-full text-xs font-medium">BEKLEMEDE</span>
      default:
        return <span className="px-3 py-1 bg-slate-500/20 text-slate-400 rounded-full text-xs font-medium">{status}</span>
    }
  }

  const getTypeBadge = (type: string) => {
    switch (type) {
      case "DONATI":
        return <span className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded text-xs">DONATI</span>
      case "BETON":
        return <span className="px-2 py-1 bg-orange-500/20 text-orange-400 rounded text-xs">BETON</span>
      case "KALIP":
        return <span className="px-2 py-1 bg-purple-500/20 text-purple-400 rounded text-xs">KALIP</span>
      case "DUVAR":
        return <span className="px-2 py-1 bg-pink-500/20 text-pink-400 rounded text-xs">DUVAR</span>
      case "DOSEME":
        return <span className="px-2 py-1 bg-cyan-500/20 text-cyan-400 rounded text-xs">DÖŞEME</span>
      case "KOLON":
        return <span className="px-2 py-1 bg-emerald-500/20 text-emerald-400 rounded text-xs">KOLON</span>
      case "KIRIS":
        return <span className="px-2 py-1 bg-amber-500/20 text-amber-400 rounded text-xs">KİRİŞ</span>
      default:
        return <span className="px-2 py-1 bg-slate-500/20 text-slate-400 rounded text-xs">{type}</span>
    }
  }

  const filteredInspections = inspections.filter(inspection => {
    const matchesSearch = inspection.project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         inspection.project.yibfNo?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         inspection.inspector.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         inspection.type.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === "ALL" || inspection.status === statusFilter
    return matchesSearch && matchesStatus
  })

  return (
    <div className="min-h-screen bg-slate-950 p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Denetim Kayıtları</h1>
        <p className="text-slate-400">Yapı denetim kontrollerini ve kanıt zincirini yönetin</p>
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
            <option value="PENDING">Beklemede</option>
            <option value="APPROVED">Onaylandı</option>
            <option value="REJECTED">Reddedildi</option>
          </select>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
        <div className="w-full overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
          <table className="w-full min-w-max">
            <thead>
              <tr className="border-b border-slate-800">
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Tarih</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">YİBF No</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Proje</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Denetçi</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Denetim Tipi</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Kat</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Durum</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">GPS</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-slate-400">
                    Yükleniyor...
                  </td>
                </tr>
              ) : filteredInspections.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-slate-400">
                    Henüz denetim kaydı bulunmuyor
                  </td>
                </tr>
              ) : (
                filteredInspections.map((inspection) => (
                  <tr key={inspection.id} className="border-b border-slate-800 hover:bg-slate-800/50 transition-colors">
                    <td className="px-6 py-4 text-slate-400">
                      {new Date(inspection.inspectionDate).toLocaleDateString('tr-TR')}
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-white font-medium">{inspection.project.yibfNo || '-'}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-white font-medium">{inspection.project.name}</div>
                    </td>
                    <td className="px-6 py-4 text-white">{inspection.inspector.name}</td>
                    <td className="px-6 py-4">{getTypeBadge(inspection.type)}</td>
                    <td className="px-6 py-4 text-slate-400">{inspection.floor || '-'}</td>
                    <td className="px-6 py-4">{getStatusBadge(inspection.status)}</td>
                    <td className="px-6 py-4">
                      {inspection.gpsLocation ? (
                        <span className="flex items-center gap-1 text-green-400 text-sm">
                          <MapPin className="w-3 h-3" />
                          Kayıtlı
                        </span>
                      ) : (
                        <span className="text-slate-500 text-sm">-</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
