/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Superadmin Global Duyurular & Sistem Mesajları (/superadmin/broadcasts)
 */

"use client"

import React, { useState, useEffect } from "react"
import {
  Megaphone,
  Radio,
  Send,
  AlertTriangle,
  Info,
  Wrench,
  Users,
  Building,
  CheckCircle,
  Trash2,
  Power,
  RefreshCw,
  Loader2,
  Sparkles,
  Eye,
} from "lucide-react"
import toast from "react-hot-toast"

interface SystemAnnouncementItem {
  id: string
  title: string
  message: string
  type: "INFO" | "WARNING" | "MAINTENANCE"
  target: "ALL" | "CONTRACTORS" | "INSPECTORS"
  isActive: boolean
  createdAt: string
}

export default function SuperadminBroadcastsPage() {
  const [announcements, setAnnouncements] = useState<SystemAnnouncementItem[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [actionId, setActionId] = useState<string | null>(null)

  // Yeni Duyuru Form State
  const [formData, setFormData] = useState({
    title: "",
    message: "",
    type: "INFO" as "INFO" | "WARNING" | "MAINTENANCE",
    target: "ALL" as "ALL" | "CONTRACTORS" | "INSPECTORS",
  })

  useEffect(() => {
    fetchAnnouncements()
  }, [])

  const fetchAnnouncements = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/superadmin/broadcasts")
      const result = await res.json()
      if (result.success) {
        setAnnouncements(result.data)
      } else {
        toast.error("Duyurular alınamadı")
      }
    } catch {
      toast.error("Ağ hatası")
    } finally {
      setLoading(false)
    }
  }

  // Yeni duyuru yayınla
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.title.trim() || !formData.message.trim()) {
      toast.error("Lütfen başlık ve mesaj alanlarını doldurun.")
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch("/api/superadmin/broadcasts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })
      const result = await res.json()
      if (result.success) {
        toast.success("Sistem duyurusu tüm hedef kullanıcılara başarıyla yayınlandı!")
        setFormData({
          title: "",
          message: "",
          type: "INFO",
          target: "ALL",
        })
        fetchAnnouncements()
      } else {
        toast.error(result.error || "Yayınlama başarısız")
      }
    } catch {
      toast.error("İşlem hatası")
    } finally {
      setSubmitting(false)
    }
  }

  // Aktif / Pasif şalteri
  const handleToggleActive = async (id: string, currentActive: boolean) => {
    setActionId(id)
    try {
      const res = await fetch("/api/superadmin/broadcasts", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, isActive: !currentActive }),
      })
      const result = await res.json()
      if (result.success) {
        toast.success(currentActive ? "Duyuru yayından kaldırıldı." : "Duyuru tekrar yayına alındı.")
        fetchAnnouncements()
      } else {
        toast.error("Güncellenemedi")
      }
    } catch {
      toast.error("İşlem hatası")
    } finally {
      setActionId(null)
    }
  }

  // Duyuru sil
  const handleDelete = async (id: string) => {
    if (!confirm("Bu duyuruyu kalıcı olarak silmek istediğinize emin misiniz?")) return

    setActionId(id)
    try {
      const res = await fetch("/api/superadmin/broadcasts", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action: "DELETE" }),
      })
      const result = await res.json()
      if (result.success) {
        toast.success("Duyuru silindi.")
        fetchAnnouncements()
      } else {
        toast.error("Silinemedi")
      }
    } catch {
      toast.error("İşlem hatası")
    } finally {
      setActionId(null)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <Radio className="h-7 w-7 text-purple-400" />
            Global Duyurular & Sistem Mesajları
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Tüm platforma veya hedef müşteri kitlelerine (Banner / Bildirim) anında yayın yapın
          </p>
        </div>

        <button
          onClick={fetchAnnouncements}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-sm font-medium transition"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Yenile
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Sol Kolon: Yeni Duyuru Yayınlama Formu */}
        <div className="lg:col-span-5 space-y-6">
          <form
            onSubmit={handleSubmit}
            className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-4"
          >
            <div className="flex items-center gap-2 pb-3 border-b border-slate-800 text-white font-bold">
              <Megaphone className="h-5 w-5 text-purple-400" />
              <span>Yeni Sistem Duyurusu Yayınla</span>
            </div>

            {/* Duyuru Tipi */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Duyuru Tipi
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { key: "INFO", label: "Bilgilendirme", icon: Info, color: "text-blue-400" },
                  { key: "WARNING", label: "Kritik Uyarı", icon: AlertTriangle, color: "text-amber-400" },
                  { key: "MAINTENANCE", label: "Bakım / Kesinti", icon: Wrench, color: "text-rose-400" },
                ].map((t) => {
                  const Icon = t.icon
                  const isSelected = formData.type === t.key
                  return (
                    <button
                      key={t.key}
                      type="button"
                      onClick={() => setFormData({ ...formData, type: t.key as any })}
                      className={`p-3 rounded-2xl border text-xs font-semibold flex flex-col items-center gap-1.5 transition ${
                        isSelected
                          ? "bg-purple-600/20 border-purple-500 text-white shadow-lg shadow-purple-600/20"
                          : "bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700"
                      }`}
                    >
                      <Icon className={`h-4 w-4 ${t.color}`} />
                      <span>{t.label}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Hedef Kitle */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Hedef Kitle (Target Segment)
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { key: "ALL", label: "Tüm Sistem (Herkes)" },
                  { key: "INSPECTORS", label: "Sadece Yapı Denetim" },
                  { key: "CONTRACTORS", label: "Sadece Müteahhitler" },
                ].map((tgt) => (
                  <button
                    key={tgt.key}
                    type="button"
                    onClick={() => setFormData({ ...formData, target: tgt.key as any })}
                    className={`py-2 px-2 rounded-xl border text-[11px] font-semibold text-center transition ${
                      formData.target === tgt.key
                        ? "bg-slate-800 border-purple-500 text-purple-300 shadow"
                        : "bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700"
                    }`}
                  >
                    {tgt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Başlık */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Duyuru Başlığı *
              </label>
              <input
                type="text"
                placeholder="Örn: Planlı Sunucu Bakımı Hakkında"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                required
              />
            </div>

            {/* Mesaj */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Duyuru Metni *
              </label>
              <textarea
                rows={3}
                placeholder="Kullanıcıların ekranında banner veya toast olarak görüntülenecek detaylı mesaj..."
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                required
              />
            </div>

            {/* Canlı Önizleme */}
            {(formData.title || formData.message) && (
              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-1.5">
                <div className="text-[10px] font-semibold uppercase tracking-wider text-purple-400 flex items-center gap-1">
                  <Eye className="h-3 w-3" /> Canlı Kullanıcı Önizlemesi
                </div>
                <div
                  className={`p-3 rounded-xl border text-xs flex items-start gap-2.5 ${
                    formData.type === "WARNING"
                      ? "bg-amber-950/40 border-amber-500/40 text-amber-200"
                      : formData.type === "MAINTENANCE"
                      ? "bg-rose-950/40 border-rose-500/40 text-rose-200"
                      : "bg-blue-950/40 border-blue-500/40 text-blue-200"
                  }`}
                >
                  <Megaphone className="h-4 w-4 shrink-0 mt-0.5" />
                  <div>
                    <strong className="block font-bold">{formData.title || "Başlık"}</strong>
                    <span className="opacity-90">{formData.message || "Mesaj içeriği..."}</span>
                  </div>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-semibold text-sm shadow-lg shadow-purple-600/30 transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {submitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              Duyuruyu Anında Yayınla
            </button>
          </form>
        </div>

        {/* Sağ Kolon: Mevcut Duyurular Listesi */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <span>Yayınlanan Sistem Duyuruları</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-mono">
                {announcements.length}
              </span>
            </h2>
          </div>

          {loading ? (
            <div className="p-12 text-center text-slate-500 bg-slate-900 rounded-3xl border border-slate-800">
              <Loader2 className="h-6 w-6 animate-spin mx-auto text-purple-500 mb-2" />
              Duyurular yükleniyor...
            </div>
          ) : announcements.length === 0 ? (
            <div className="p-12 text-center text-slate-500 bg-slate-900 rounded-3xl border border-slate-800">
              Henüz yayınlanmış bir sistem duyurusu bulunmuyor.
            </div>
          ) : (
            announcements.map((item) => (
              <div
                key={item.id}
                className={`p-5 rounded-3xl border transition shadow-lg ${
                  item.isActive
                    ? "bg-slate-900 border-slate-800"
                    : "bg-slate-950/60 border-slate-900 opacity-60"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      {/* Tip Rozeti */}
                      <span
                        className={`text-[11px] px-2.5 py-0.5 rounded-full font-semibold border ${
                          item.type === "WARNING"
                            ? "bg-amber-950/60 text-amber-300 border-amber-500/30"
                            : item.type === "MAINTENANCE"
                            ? "bg-rose-950/60 text-rose-300 border-rose-500/30"
                            : "bg-blue-950/60 text-blue-300 border-blue-500/30"
                        }`}
                      >
                        {item.type === "WARNING"
                          ? "⚠ Kritik Uyarı"
                          : item.type === "MAINTENANCE"
                          ? "🛠 Planlı Bakım"
                          : "ℹ Bilgilendirme"}
                      </span>

                      {/* Hedef Kitle */}
                      <span className="text-[11px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-medium">
                        Hedef: {item.target === "ALL" ? "Herkes" : item.target === "INSPECTORS" ? "Yapı Denetim" : "Müteahhitler"}
                      </span>

                      {/* Durum */}
                      <span
                        className={`text-[11px] font-semibold ${
                          item.isActive ? "text-emerald-400" : "text-slate-500"
                        }`}
                      >
                        {item.isActive ? "● Yayında" : "○ Pasif"}
                      </span>

                      <span className="text-xs text-slate-500 font-mono">
                        {new Date(item.createdAt).toLocaleDateString("tr-TR")}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-white">{item.title}</h3>
                    <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap">
                      {item.message}
                    </p>
                  </div>

                  {/* Aksiyonlar */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => handleToggleActive(item.id, item.isActive)}
                      disabled={actionId === item.id}
                      className={`p-2 rounded-xl text-xs font-medium transition ${
                        item.isActive
                          ? "bg-emerald-950/60 text-emerald-400 hover:bg-emerald-900/60 border border-emerald-500/30"
                          : "bg-slate-800 text-slate-400 hover:text-white"
                      }`}
                      title={item.isActive ? "Yayından Kaldır" : "Tekrar Yayına Al"}
                    >
                      <Power className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      disabled={actionId === item.id}
                      className="p-2 rounded-xl text-xs font-medium bg-rose-950/40 text-rose-400 hover:bg-rose-900/60 border border-rose-500/30 transition"
                      title="Duyuruyu Sil"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
