"use client"
/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * This code is the property of NXA Software.
 */

import { useState, useEffect } from "react"
import { Clock, Calendar, Users, CheckCircle, AlertCircle, Loader2, Plus, Filter, X } from "lucide-react"

export default function ShiftsPage() {
  const [shiftData, setShiftData] = useState<any[]>([])
  const [projects, setProjects] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState({
    projectId: "",
    status: ""
  })
  const [formData, setFormData] = useState({
    name: "",
    timeRange: "",
    personnelCount: 0,
    projectId: "",
    status: "Active"
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    fetchShifts()
    fetchProjects()
  }, [filters])

  const fetchShifts = async () => {
    try {
      const params = new URLSearchParams()
      if (filters.projectId) params.append('projectId', filters.projectId)
      if (filters.status) params.append('status', filters.status)

      const response = await fetch(`/api/admin/shifts?${params.toString()}`)
      if (response.ok) {
        const data = await response.json()
        setShiftData(data)
      }
    } catch (error) {
      console.error('Failed to fetch shifts:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchProjects = async () => {
    try {
      const response = await fetch('/api/admin/projects')
      if (response.ok) {
        const data = await response.json()
        setProjects(data)
      }
    } catch (error) {
      console.error('Failed to fetch projects:', error)
    }
  }

  const handleCreate = async () => {
    if (!formData.name || !formData.timeRange) {
      alert("Lütfen vardiya adı ve saat aralığı girin")
      return
    }

    setIsSubmitting(true)
    try {
      const response = await fetch('/api/admin/shifts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        await fetchShifts()
        setShowCreateModal(false)
        setFormData({
          name: "",
          timeRange: "",
          personnelCount: 0,
          projectId: "",
          status: "Active"
        })
      } else {
        alert("Vardiya oluşturulurken hata oluştu")
      }
    } catch (error) {
      console.error('Failed to create shift:', error)
      alert("Vardiya oluşturulurken hata oluştu")
    } finally {
      setIsSubmitting(false)
    }
  }

  const clearFilters = () => {
    setFilters({ projectId: "", status: "" })
  }

  if (loading) {
    return (
      <div className="p-6 h-screen flex flex-col items-center justify-center">
        <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
        <p className="text-slate-400 mt-4">Vardiya verileri yükleniyor...</p>
      </div>
    )
  }

  return (
    <div className="lg:mt-0 mt-16">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-white flex items-center gap-3">
            <Clock className="w-8 h-8 text-blue-400" />
            Vardiyalar
          </h1>
          <p className="text-slate-400 mt-1">Vardiya planlama ve yönetimi</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Yeni Vardiya Ekle
        </button>
      </div>

      {/* Filters */}
      <div className="mb-6 bg-slate-900 rounded-xl border border-slate-800 p-4">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 text-slate-300 hover:text-white transition-colors"
          >
            <Filter className="w-4 h-4" />
            Filtreler
          </button>
          {(filters.projectId || filters.status) && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
              Filtreleri Temizle
            </button>
          )}
        </div>

        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Proje</label>
              <select
                value={filters.projectId}
                onChange={(e) => setFilters({ ...filters, projectId: e.target.value })}
                className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
              >
                <option value="">Tüm Projeler</option>
                {projects.map(p => (
                  <option key={p.id} value={p.id}>{p.name || p.title}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Durum</label>
              <select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
              >
                <option value="">Tüm Durumlar</option>
                <option value="Active">Aktif</option>
                <option value="Inactive">Pasif</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-slate-800/50 border-b border-slate-700">
              <th className="text-left p-4 text-slate-300 font-medium">Vardiya No</th>
              <th className="text-left p-4 text-slate-300 font-medium">Vardiya Adı</th>
              <th className="text-left p-4 text-slate-300 font-medium">Saat Aralığı</th>
              <th className="text-left p-4 text-slate-300 font-medium">Personel Sayısı</th>
              <th className="text-left p-4 text-slate-300 font-medium">Proje</th>
              <th className="text-left p-4 text-slate-300 font-medium">Durum</th>
            </tr>
          </thead>
          <tbody>
            {shiftData.length > 0 ? (
              shiftData.map((shift) => (
              <tr key={shift.id} className="border-b border-slate-800 hover:bg-slate-800/30 transition-colors">
                <td className="p-4 text-white font-medium">{shift.id}</td>
                <td className="p-4 text-white">{shift.name}</td>
                <td className="p-4 text-slate-300 flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  {shift.timeRange || shift.time}
                </td>
                <td className="p-4 text-slate-300 flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  {shift.personnelCount || shift.personnel}
                </td>
                <td className="p-4 text-slate-300">{shift.project?.name || shift.project || '-'}</td>
                <td className="p-4">
                  <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${
                    shift.status === "Active"
                      ? "bg-green-500/20 text-green-400"
                      : shift.status === "Scheduled"
                      ? "bg-blue-500/20 text-blue-400"
                      : "bg-yellow-500/20 text-yellow-400"
                  }`}>
                    {shift.status === "Active" && <CheckCircle className="w-3 h-3" />}
                    {shift.status === "Pending" && <AlertCircle className="w-3 h-3" />}
                    {shift.status}
                  </span>
                </td>
              </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="p-8 text-center text-slate-400">
                  <Clock className="w-12 h-12 mx-auto mb-3 text-slate-600" />
                  <p>Tanımlı vardiya bulunmuyor.</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-slate-900 rounded-xl border border-slate-700 p-6 w-full max-w-lg mx-4">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-white">Yeni Vardiya Ekle</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-white mb-2">Vardiya Adı</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  placeholder="Örn: Gündüz Vardiyası"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">Saat Aralığı</label>
                <input
                  type="text"
                  value={formData.timeRange}
                  onChange={(e) => setFormData({ ...formData, timeRange: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  placeholder="Örn: 08:00 - 17:00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">Personel Sayısı</label>
                <input
                  type="number"
                  value={formData.personnelCount}
                  onChange={(e) => setFormData({ ...formData, personnelCount: parseInt(e.target.value) || 0 })}
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  min="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">Proje</label>
                <select
                  value={formData.projectId}
                  onChange={(e) => setFormData({ ...formData, projectId: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="">Proje Seçin (Opsiyonel)</option>
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>{p.name || p.title}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">Durum</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="Active">Aktif</option>
                  <option value="Inactive">Pasif</option>
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition-colors"
                >
                  İptal
                </button>
                <button
                  onClick={handleCreate}
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? "Kaydediliyor..." : "Kaydet"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
