"use client"
/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Field Engineer Intelligent Daily Construction Journal (Akıllı Şantiye Jurnali)
 * Integrated Aggregator for QR Consumption, Attendance, and Subcontractor Proofs
 */

import React, { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
  BookOpen,
  Building2,
  Calendar,
  CloudSun,
  Users,
  QrCode,
  PackageCheck,
  CheckCircle2,
  ShieldCheck,
  AlertTriangle,
  ArrowLeft,
  RefreshCw,
  Send,
  Loader2,
  FileCheck2,
  Sparkles,
  Wind,
  Droplets,
  HardHat,
  Eye,
  Check,
  MapPin,
  Lock,
  MessageSquare
} from "lucide-react"
import { getTodaySummary, submitDailyJournal, JournalSummary } from "@/app/actions/journal"
import { toast } from "react-hot-toast"

export default function SmartDailyJournalPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [submittedSuccess, setSubmittedSuccess] = useState(false)

  const [projects, setProjects] = useState<{ id: string; name: string }[]>([])
  const [selectedProjectId, setSelectedProjectId] = useState<string>("")
  const [summary, setSummary] = useState<JournalSummary | null>(null)
  const [engineerNotes, setEngineerNotes] = useState("")

  const loadData = async (projId?: string) => {
    setLoading(true)
    try {
      const res = await getTodaySummary(projId)
      if (res.success && res.summary) {
        setSummary(res.summary)
        setProjects(res.projects || [])
        setSelectedProjectId(res.summary.projectId)
      } else {
        toast.error("Şantiye verileri toplanamadı.")
      }
    } catch (err) {
      console.error("Journal load error:", err)
      toast.error("Veriler alınırken bir sorun oluştu.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadData()
  }, [])

  const handleProjectChange = (newProjId: string) => {
    setSelectedProjectId(newProjId)
    void loadData(newProjId)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!summary) {
      toast.error("Şantiye özeti bulunamadı.")
      return
    }

    setSubmitting(true)
    try {
      const res = await submitDailyJournal({
        projectId: summary.projectId,
        weather: summary.weather,
        workerCount: summary.workerCount,
        consumedItems: summary.consumedItems,
        completedWorks: summary.completedWorks,
        ncrReports: summary.ncrReports,
        engineerNotes
      })

      if (res.success) {
        toast.success(res.message || "Günlük Şantiye Jurnali başarıyla Merkeze iletildi!")
        setSubmittedSuccess(true)
      } else {
        toast.error(res.error || "Jurnal kaydedilemedi.")
      }
    } catch (err) {
      console.error("Submit error:", err)
      toast.error("İşlem sırasında beklenmedik bir hata oluştu.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-6 lg:p-8">
      {/* Top Header */}
      <div className="max-w-4xl mx-auto mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <button
              onClick={() => router.push("/personnel")}
              className="flex items-center gap-2 text-xs text-orange-400 hover:text-orange-300 mb-2 transition"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Personel Portalı
            </button>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-blue-600/20">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
                  Günlük Şantiye Jurnali & Onay Paneli
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    <Sparkles className="w-3 h-3" />
                    Otonom Sistem
                  </span>
                </h1>
                <p className="text-xs text-slate-400">
                  QR Malzeme Tüketimi, Puantaj ve Taşeron İş Kanıtlarını birleştiren akıllı rapor
                </p>
              </div>
            </div>
          </div>

          {/* Project & Refresh */}
          <div className="flex items-center gap-2">
            <select
              value={selectedProjectId}
              onChange={(e) => handleProjectChange(e.target.value)}
              className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500 font-medium"
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={() => loadData(selectedProjectId)}
              disabled={loading}
              className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 transition"
              title="Verileri Yenile"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-orange-400" : ""}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto">
        {loading ? (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-16 text-center">
            <Loader2 className="w-10 h-10 text-orange-400 animate-spin mx-auto mb-3" />
            <h3 className="text-base font-bold text-white">Saha Verileri Konsolide Ediliyor...</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
              QR malzeme tüketimleri, puantaj turnike girişleri ve taşeron teknik kabulleri taranıyor.
            </p>
          </div>
        ) : !summary ? (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-12 text-center">
            <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto mb-2" />
            <p className="text-sm text-slate-300">Özet veri bulunamadı.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* 1. Header Information Strip */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Building2 className="w-5 h-5 text-orange-400" />
                <div>
                  <div className="text-xs font-semibold text-white">{summary.projectName}</div>
                  <div className="text-[11px] text-slate-400">Şantiye Sahası</div>
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs text-slate-300 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800">
                <Calendar className="w-3.5 h-3.5 text-orange-400" />
                <span>Rapor Tarihi:</span>
                <strong className="text-white font-mono">{summary.date}</strong>
              </div>

              <div className="flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-xl border border-emerald-500/20">
                <Lock className="w-3.5 h-3.5" />
                <span>Sistem Verileri Salt-Okunur (Korumalı)</span>
              </div>
            </div>

            {/* 2. Hava Durumu & Personel Puantaj Kartları */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Hava Durumu Kartı */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 relative overflow-hidden">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-amber-400 uppercase tracking-wider">
                    <CloudSun className="w-4 h-4" />
                    Otonom Hava Durumu
                  </div>
                  <span className="text-[10px] text-slate-500 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                    API / İstasyon
                  </span>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-3xl sm:text-4xl font-extrabold text-white font-mono">
                    {summary.weather.temperature}
                    <span className="text-orange-400">{summary.weather.unit}</span>
                  </div>
                  <div>
                    <div className="text-sm font-bold text-white">{summary.weather.condition}</div>
                    <div className="text-[11px] text-slate-400 flex items-center gap-3 mt-1">
                      <span className="flex items-center gap-1">
                        <Wind className="w-3 h-3 text-slate-500" />
                        {summary.weather.windSpeed}
                      </span>
                      <span className="flex items-center gap-1">
                        <Droplets className="w-3 h-3 text-blue-400" />
                        {summary.weather.humidity}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-3 text-[10px] text-slate-500 border-t border-slate-800/80 pt-2">
                  Kaynak: {summary.weather.source}
                </div>
              </div>

              {/* Personel Puantaj Kartı */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 relative overflow-hidden">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-blue-400 uppercase tracking-wider">
                    <Users className="w-4 h-4" />
                    Aktif Saha Personeli (QR Puantaj)
                  </div>
                  <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 font-semibold">
                    Turnike Doğrulamalı
                  </span>
                </div>

                <div className="flex items-baseline gap-2">
                  <div className="text-3xl sm:text-4xl font-extrabold text-white font-mono">
                    {summary.workerCount}
                  </div>
                  <span className="text-xs text-slate-400">Kişi Bugün Giriş Yaptı</span>
                </div>

                <div className="grid grid-cols-2 gap-2 mt-3 pt-2 border-t border-slate-800/80 text-xs">
                  <div className="bg-slate-950 p-2 rounded-xl border border-slate-800">
                    <div className="text-[10px] text-slate-400">Kadrolu Teknik Kadro</div>
                    <div className="text-sm font-bold text-blue-400 font-mono">
                      {summary.workerBreakdown.staffCount} Personel
                    </div>
                  </div>
                  <div className="bg-slate-950 p-2 rounded-xl border border-slate-800">
                    <div className="text-[10px] text-slate-400">Taşeron İşçi / Usta</div>
                    <div className="text-sm font-bold text-amber-400 font-mono">
                      {summary.workerBreakdown.subcontractorCount} Çalışan
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 3. Tüketilen Malzemeler (QR Tüketim Özeti) */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 uppercase tracking-wider">
                  <QrCode className="w-4 h-4" />
                  Bugün Tüketilen Malzemeler (QR Envanter Düşümü)
                </div>
                <span className="text-xs text-slate-400 bg-slate-950 px-2.5 py-0.5 rounded-lg border border-slate-800">
                  {summary.consumedItems.length} Kalem
                </span>
              </div>

              <div className="space-y-2">
                {summary.consumedItems.map((item) => (
                  <div
                    key={item.id}
                    className="bg-slate-950 border border-slate-800/80 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
                        <PackageCheck className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-white">{item.materialName}</div>
                        <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                          <span className="font-mono text-slate-500">[{item.qrCode}]</span>
                          <span>•</span>
                          <span className="text-orange-400">📍 {item.zone}</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="font-mono font-bold text-emerald-400 text-sm">
                        {item.quantity.toLocaleString("tr-TR")} {item.unit}
                      </div>
                      {item.consumedAt && (
                        <div className="text-[10px] text-slate-500">Saat: {item.consumedAt}</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 4. Tamamlanan & Onaylanan İmalatlar (Taşeron İş Kabulleri) */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-cyan-400 uppercase tracking-wider">
                  <ShieldCheck className="w-4 h-4" />
                  Bugün Onaylanan Taşeron İmalatları & Metrajlar
                </div>
                <span className="text-xs text-slate-400 bg-slate-950 px-2.5 py-0.5 rounded-lg border border-slate-800">
                  {summary.completedWorks.length} İmalat
                </span>
              </div>

              <div className="space-y-2">
                {summary.completedWorks.map((work) => (
                  <div
                    key={work.id}
                    className="bg-slate-950 border border-slate-800/80 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white">{work.title}</span>
                        <span className="text-[10px] font-semibold text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
                          {work.subcontractorName}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400">{work.quantityText}</p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
                        <Check className="w-3 h-3" />
                        Teknik Kabul Onaylı
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 5. İSG & DÖF (NCR) Uygunsuzlukları */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-red-400 uppercase tracking-wider">
                  <AlertTriangle className="w-4 h-4" />
                  Saha Revizyon ve Kusur (DÖF) Durumu
                </div>
                <span className="text-xs text-slate-400 bg-slate-950 px-2.5 py-0.5 rounded-lg border border-slate-800">
                  {summary.ncrReports.length} Kayıt
                </span>
              </div>

              <div className="space-y-2">
                {summary.ncrReports.map((ncr) => (
                  <div
                    key={ncr.id}
                    className="bg-slate-950 border border-slate-800/80 rounded-xl p-3 flex items-center justify-between gap-3 text-xs"
                  >
                    <div>
                      <span className="font-mono font-bold text-orange-400 mr-2">
                        {ncr.reportNo}
                      </span>
                      <span className="text-slate-200">{ncr.description}</span>
                    </div>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded shrink-0 ${
                        ncr.status === "Açık DÖF"
                          ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                          : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                      }`}
                    >
                      {ncr.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* 6. Mühendisin Manuel Notu & Değerlendirmesi */}
            <div className="bg-slate-900 border border-orange-500/30 rounded-2xl p-5 space-y-3 shadow-lg">
              <label className="block text-xs font-bold text-orange-400 uppercase tracking-wider flex items-center gap-2">
                <MessageSquare className="w-4 h-4" />
                Günlük Genel Değerlendirme / Ekstra Notlar
              </label>
              <textarea
                value={engineerNotes}
                onChange={(e) => setEngineerNotes(e.target.value)}
                rows={4}
                placeholder="Örn: 3. Kat beton dökümü sırasında mikser sirkülasyonu sorunsuz tamamlanmış olup, 7 ve 28 günlük numuneler laboratuvara sevk edilmiştir. Hava şartları elverişli seyretmiştir..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 resize-none transition"
              />
            </div>

            {/* 7. Büyük Doğrulama & Merkeze Gönder Butonu */}
            <div className="pt-2">
              {submittedSuccess ? (
                <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-5 text-center space-y-2">
                  <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
                  <h3 className="text-base font-bold text-white">
                    Günün Şantiye Jurnali Başarıyla Merkeze İletildi!
                  </h3>
                  <p className="text-xs text-slate-300">
                    Tüm QR tüketimleri, puantaj ve hakediş snapshot verileri DailyJournal modeline mühürlenerek kaydedildi.
                  </p>
                  <button
                    type="button"
                    onClick={() => setSubmittedSuccess(false)}
                    className="mt-2 text-xs text-orange-400 hover:underline"
                  >
                    Yeni Bir Not Eklemek İçin Tekrar Aç
                  </button>
                </div>
              ) : (
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-4 rounded-2xl bg-gradient-to-r from-orange-600 via-amber-600 to-orange-600 hover:from-orange-500 hover:to-amber-500 text-white font-extrabold text-sm sm:text-base shadow-2xl shadow-orange-600/30 flex items-center justify-center gap-3 transition disabled:opacity-50 group"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Veriler Doğrulanıyor ve Merkeze Gönderiliyor...
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5 group-hover:translate-x-1 transition" />
                      Verileri Doğrula & Jurnali Merkeze Gönder
                    </>
                  )}
                </button>
              )}
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
