"use client"
/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Announcements Management with full database integration and tenant isolation
 */

import { useState, useEffect } from "react"
import { Plus, Bell, Calendar, Tag, Trash2, X, Search, RefreshCw, AlertCircle } from "lucide-react"

interface Announcement {
  id: string
  title: string
  content: string
  severity: string
  projectId?: string | null
  project?: { id: string; name: string } | null
  createdAt: string
}

export default function AdminAnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedSeverity, setSelectedSeverity] = useState("")
  const [showForm, setShowForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    severity: "INFO",
  })

  const fetchAnnouncements = async () => {
    try {
      setLoading(true)
      const res = await fetch("/api/admin/announcements")
      const data = await res.json()
      if (data.announcements) {
        setAnnouncements(data.announcements)
      }
    } catch (err) {
      console.error("Duyurular yüklenirken hata:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAnnouncements()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setSubmitting(true)
      const res = await fetch("/api/admin/announcements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })
      if (res.ok) {
        setShowForm(false)
        setFormData({ title: "", content: "", severity: "INFO" })
        fetchAnnouncements()
      }
    } catch (err) {
      console.error("Duyuru eklenirken hata:", err)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Bu duyuruyu silmek istediğinizden emin misiniz?")) return
    try {
      const res = await fetch(`/api/admin/announcements?id=${id}`, {
        method: "DELETE",
      })
      if (res.ok) {
        fetchAnnouncements()
      }
    } catch (err) {
      console.error("Duyuru silinirken hata:", err)
    }
  }

  const severityColors: Record<string, string> = {
    URGENT: "bg-red-500/20 text-red-400 border-red-500/30",
    WARNING: "bg-amber-500/20 text-amber-400 border-amber-500/30",
    INFO: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  }

  const severityLabels: Record<string, string> = {
    URGENT: "Acil / Önemli",
    WARNING: "Uyarı / İSG",
    INFO: "Genel Bilgi",
  }

  const filteredAnnouncements = announcements.filter((a) => {
    const matchesSearch =
      a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.content.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesSeverity = selectedSeverity ? a.severity === selectedSeverity : true
    return matchesSearch && matchesSeverity
  })

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-blue-400 mb-1">
            <Bell className="w-4 h-4" />
            <span>Kurumsal İletişim</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Duyurular Yönetimi</h1>
          <p className="text-sm text-slate-400">Şirket içi duyuruları oluşturun, yayınlayın ve yönetin</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchAnnouncements}
            disabled={loading}
            className="p-2 rounded-lg bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
            title="Yenile"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>

          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Yeni Duyuru
          </button>
        </div>
      </div>

      {/* Create Announcement Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-2xl p-6 max-w-lg w-full border border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Bell className="w-4 h-4 text-blue-400" />
                <span>Yeni Duyuru Yayınla</span>
              </h3>
              <button
                onClick={() => setShowForm(false)}
                className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Başlık *</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Örn: Saha Güvenlik ve İSG Denetimi"
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">İçerik *</label>
                <textarea
                  required
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  placeholder="Duyuru detaylarını buraya yazın..."
                  rows={4}
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Duyuru Türü / Önem Derecesi</label>
                <select
                  value={formData.severity}
                  onChange={(e) => setFormData({ ...formData, severity: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="INFO">Genel Bilgi</option>
                  <option value="WARNING">Uyarı / İSG</option>
                  <option value="URGENT">Acil / Kritik</option>
                </select>
              </div>

              <div className="flex gap-2.5 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 py-2 text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-colors"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-2 text-xs bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition-colors font-semibold"
                >
                  {submitting ? "Kaydediliyor..." : "Duyuruyu Yayınla"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Filter and Search */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="flex-1 w-full relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Duyuru başlığı veya içeriğinde ara..."
            className="w-full pl-10 pr-4 py-2.5 text-xs bg-slate-900 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
          />
        </div>
        <select
          value={selectedSeverity}
          onChange={(e) => setSelectedSeverity(e.target.value)}
          className="w-full sm:w-auto px-4 py-2.5 text-xs bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-blue-500 transition-colors"
        >
          <option value="">Tüm Türler</option>
          <option value="INFO">Genel Bilgi</option>
          <option value="WARNING">Uyarı / İSG</option>
          <option value="URGENT">Acil / Önemli</option>
        </select>
      </div>

      {/* Announcements List or Empty State */}
      {!loading && filteredAnnouncements.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center max-w-xl mx-auto space-y-4 shadow-xl">
          <div className="w-16 h-16 rounded-2xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-center mx-auto text-slate-400 shadow-inner">
            <Bell className="w-8 h-8 text-blue-400" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-white">Henüz Duyuru Bulunmuyor</h3>
            <p className="text-sm text-slate-400">
              Şirket personeline iletmek istediğiniz genel bilgilendirmeleri, İSG uyarılarını veya acil duyuruları buradan yayınlayabilirsiniz.
            </p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-lg shadow-blue-500/20 transition-all hover:scale-105"
          >
            <Plus className="w-4 h-4" />
            <span>İlk Duyuruyu Oluştur</span>
          </button>
        </div>
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
          <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Bell className="w-4 h-4 text-blue-400" />
              <h2 className="text-sm font-bold text-white">Yayınlanan Duyurular</h2>
            </div>
            <span className="px-2.5 py-0.5 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-full text-xs font-semibold">
              {filteredAnnouncements.length} Kayıt
            </span>
          </div>

          <div className="divide-y divide-slate-800/60">
            {filteredAnnouncements.map((announcement) => (
              <div key={announcement.id} className="p-5 hover:bg-slate-800/30 transition-colors">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-sm font-bold text-white">{announcement.title}</h3>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                          severityColors[announcement.severity] || severityColors.INFO
                        }`}
                      >
                        {severityLabels[announcement.severity] || announcement.severity}
                      </span>
                      {announcement.project && (
                        <span className="px-2 py-0.5 rounded-md text-[10px] bg-slate-950 border border-slate-800 text-slate-400">
                          {announcement.project.name}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">{announcement.content}</p>
                    <div className="flex items-center gap-2 text-[11px] text-slate-500">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{new Date(announcement.createdAt).toLocaleDateString("tr-TR")}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleDelete(announcement.id)}
                    className="p-2 hover:bg-red-500/10 rounded-lg text-slate-500 hover:text-red-400 transition-colors"
                    title="Duyuruyu Sil"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
