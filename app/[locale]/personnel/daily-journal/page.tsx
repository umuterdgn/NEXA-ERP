"use client"
/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Field Engineer Intelligent Daily Construction Journal (Akıllı Şantiye Jurnali)
 * Integrated with Admin Live Dashboard, Meteorological OHS Risk, Logistics & AI Brief Trigger
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
  ShieldAlert,
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
  MessageSquare,
  TrendingUp,
  Truck,
  Activity,
  AlertOctagon,
  Bot
} from "lucide-react"
import { getTodaySummary, submitDailyJournal, JournalSummary } from "@/app/actions/journal"
import { toast } from "react-hot-toast"

export default function SmartDailyJournalPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [submittedSuccess, setSubmittedSuccess] = useState(false)
  const [generatedAiBrief, setGeneratedAiBrief] = useState<string | null>(null)

  const [projects, setProjects] = useState<{ id: string; name: string }[]>([])
  const [selectedProjectId, setSelectedProjectId] = useState<string>("")
  const [summary, setSummary] = useState<JournalSummary | null>(null)
  const [engineerNotes, setEngineerNotes] = useState(
    "Meteorolojik fırtına uyarısı nedeniyle kule vinç operasyonları saat 11:30 - 14:30 arasında 3 saat durduruldu. Rüzgar hızının hafiflemesiyle A Blok 3. kat kolon beton dökümüne başlandı."
  )

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
        toast.success(
          "✨ Şantiye Jurnali mühürlendi ve Otonom Patron Raporu (C-Level Brief) başarıyla üretildi!",
          {
            icon: "👔",
            duration: 5000
          }
        )
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
      <div className="max-w-5xl mx-auto mb-6">
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
                  Günlük Şantiye Jurnali & Akıllı Onay Paneli
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    <Sparkles className="w-3 h-3" />
                    Canlı Şantiye & Meteoroloji Entegre
                  </span>
                </h1>
                <p className="text-xs text-slate-400">
                  Admin Canlı Şantiye Özeti, Meteorolojik İSG Riskleri ve Günlük Lojistik Konsolidasyonu
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
      <div className="max-w-5xl mx-auto">
        {loading ? (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-16 text-center">
            <Loader2 className="w-10 h-10 text-orange-400 animate-spin mx-auto mb-3" />
            <h3 className="text-base font-bold text-white">Canlı Şantiye Verileri Toplanıyor...</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
              Meteorolojik risk tahminleri, aktif personel puantajı, lojistik makbuzları ve açık İSG ihlalleri taranıyor.
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
                  <div className="text-[11px] text-slate-400">Şantiye Sahası / Aktif Proje</div>
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs text-slate-300 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800">
                <Calendar className="w-3.5 h-3.5 text-orange-400" />
                <span>Jurnal Tarihi:</span>
                <strong className="text-white font-mono">{summary.date}</strong>
              </div>

              <div className="flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-xl border border-emerald-500/20">
                <Lock className="w-3.5 h-3.5" />
                <span>Admin Şantiye Konsolidasyonu (Read-Only)</span>
              </div>
            </div>

            {/* Fırtına Uyarısı Kırmızı Banner (Eğer Aktifse) */}
            {summary.weather.stormAlert && (
              <div className="bg-gradient-to-r from-red-950/80 via-red-900/60 to-red-950/80 border-2 border-red-500/60 rounded-2xl p-4 sm:p-5 flex items-start gap-4 shadow-xl shadow-red-950/50 animate-pulse">
                <div className="w-10 h-10 rounded-xl bg-red-600 text-white flex items-center justify-center shrink-0 shadow-lg">
                  <AlertOctagon className="w-6 h-6" />
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-extrabold uppercase tracking-wider text-red-300 bg-red-950 px-2.5 py-0.5 rounded border border-red-500/40">
                      Meteorolojik Kritik Güvenlik Uyarısı
                    </span>
                    <span className="text-xs font-bold text-white">
                      Rüzgar: {summary.weather.windSpeed} km/h (Kritik Eşik: ≥50 km/h)
                    </span>
                  </div>
                  <h3 className="text-base sm:text-lg font-black text-white">
                    {summary.weather.stormWarning}
                  </h3>
                  <p className="text-xs text-red-200/90 leading-relaxed">
                    Şantiye otomatik rüzgar ölçerleri kritik fırtına eşiği bildirmiştir. Kule vinçler ve dış cephe sepet iskele operasyonları derhal durdurulmalıdır.
                  </p>
                </div>
              </div>
            )}

            {/* 2. 4 Büyük Canlı Şantiye KPI Kartı (Admin Paneli ile Birebir) */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              {/* Aktif Personel */}
              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 relative overflow-hidden">
                <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                  <span>Aktif Personel</span>
                  <Users className="w-4 h-4 text-blue-400" />
                </div>
                <div className="text-2xl sm:text-3xl font-extrabold text-white font-mono">
                  {summary.workerCount} <span className="text-xs font-normal text-slate-400">Kişi</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  {summary.workerBreakdown.staffCount} Kadrolu • {summary.workerBreakdown.subcontractorCount} Taşeron
                </p>
              </div>

              {/* İSG Durumu */}
              <div
                className={`border rounded-2xl p-4 relative overflow-hidden ${
                  summary.activeViolationsCount > 0
                    ? "bg-red-950/20 border-red-900/40"
                    : "bg-emerald-950/20 border-emerald-900/40"
                }`}
              >
                <div className="flex items-center justify-between text-xs mb-2">
                  <span className={summary.activeViolationsCount > 0 ? "text-red-400" : "text-emerald-400"}>
                    İSG Güvenlik Durumu
                  </span>
                  {summary.activeViolationsCount > 0 ? (
                    <ShieldAlert className="w-4 h-4 text-red-400" />
                  ) : (
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  )}
                </div>
                <div
                  className={`text-2xl sm:text-3xl font-extrabold font-mono ${
                    summary.activeViolationsCount > 0 ? "text-red-400" : "text-emerald-400"
                  }`}
                >
                  {summary.activeViolationsCount > 0 ? `${summary.activeViolationsCount} Aktif İhlal` : "Sıfır İhlal"}
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  {summary.activeViolationsCount > 0 ? "Baret ve Kazı şev güvenliği" : "Saha kurallarına tam uyum"}
                </p>
              </div>

              {/* Günlük İlerleme */}
              <div className="bg-emerald-950/20 border border-emerald-900/40 rounded-2xl p-4 relative overflow-hidden">
                <div className="flex items-center justify-between text-xs text-emerald-400 mb-2">
                  <span>Tamamlanan İmalat</span>
                  <TrendingUp className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="text-2xl sm:text-3xl font-extrabold text-emerald-400 font-mono">
                  +%{summary.dailyProgress}
                </div>
                <p className="text-[11px] text-emerald-300/70 mt-1">
                  Güncel BoQ metraj artışı
                </p>
              </div>

              {/* Meteorolojik Risk Seviyesi */}
              <div
                className={`border rounded-2xl p-4 relative overflow-hidden ${
                  summary.weather.stormAlert
                    ? "bg-red-950/20 border-red-900/40"
                    : "bg-amber-950/20 border-amber-900/40"
                }`}
              >
                <div className="flex items-center justify-between text-xs mb-2">
                  <span className={summary.weather.stormAlert ? "text-red-400" : "text-amber-400"}>
                    Rüzgar & Yağış Riski
                  </span>
                  <Wind className="w-4 h-4 text-slate-400" />
                </div>
                <div
                  className={`text-2xl sm:text-3xl font-extrabold font-mono ${
                    summary.weather.stormAlert ? "text-red-400" : "text-amber-400"
                  }`}
                >
                  {summary.weather.windSpeed} <span className="text-xs font-normal">km/h</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Yağış İhtimali: %{summary.weather.rainProb} • {summary.weather.riskLevel}
                </p>
              </div>
            </div>

            {/* 3. İki Kolonlu Detay Kartları: Meteorolojik İSG & Canlı İhlaller */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Meteorolojik İSG Risk Tahmini & Vinç Durumu */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <div className="flex items-center gap-2 text-xs font-bold text-amber-400 uppercase tracking-wider">
                    <CloudSun className="w-4 h-4" />
                    Meteorolojik İSG Risk Tahmini (Bugün)
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                      summary.weather.stormAlert
                        ? "bg-red-500/20 text-red-400 border border-red-500/30"
                        : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                    }`}
                  >
                    {summary.weather.riskLevel} RİSK
                  </span>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-center justify-between">
                    <span className="text-slate-400">Hava Durumu Şartları:</span>
                    <span className="text-white font-semibold">{summary.weather.condition}</span>
                  </div>
                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-center justify-between">
                    <span className="text-slate-400">Hava Sıcaklığı:</span>
                    <span className="text-white font-mono font-semibold">
                      {summary.weather.temperature} {summary.weather.unit}
                    </span>
                  </div>
                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-center justify-between">
                    <span className="text-slate-400">Rüzgar Hızı:</span>
                    <span
                      className={`font-mono font-bold ${
                        summary.weather.windSpeed >= 50 ? "text-red-400" : "text-white"
                      }`}
                    >
                      {summary.weather.windSpeed} km/h
                    </span>
                  </div>
                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-center justify-between">
                    <span className="text-slate-400">Yağış Olasılığı:</span>
                    <span className="text-blue-400 font-mono font-semibold">
                      %{summary.weather.rainProb}
                    </span>
                  </div>
                </div>

                {/* AI / İSG Önerisi */}
                <div className="bg-orange-500/10 border border-orange-500/20 p-3 rounded-xl flex items-center gap-2 text-xs text-orange-300">
                  <Sparkles className="w-4 h-4 text-orange-400 shrink-0" />
                  <span className="font-semibold">{summary.weather.aiRecommendation}</span>
                </div>
              </div>

              {/* Canlı İSG İhlalleri & Sahadaki Güvenlik Kayıtları */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <div className="flex items-center gap-2 text-xs font-bold text-red-400 uppercase tracking-wider">
                    <ShieldAlert className="w-4 h-4" />
                    Canlı Saha İSG İhlalleri (Sensör / Kamera)
                  </div>
                  <span className="text-[10px] text-slate-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                    {summary.isgViolations.length} Açık Kayıt
                  </span>
                </div>

                <div className="space-y-2">
                  {summary.isgViolations.map((v) => (
                    <div
                      key={v.id}
                      className="bg-slate-950 border border-red-500/20 rounded-xl p-3 space-y-1"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-red-400 animate-ping" />
                          <strong className="text-white">{v.workerName}</strong>
                        </div>
                        <span className="text-[10px] text-slate-500 font-mono">{v.timestamp}</span>
                      </div>
                      <div className="text-xs font-semibold text-red-300">{v.violation}</div>
                      {v.zoneName && (
                        <div className="text-[11px] text-slate-400 flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-orange-400" />
                          {v.zoneName}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* 4. Günlük Lojistik (120 T Demir, 400 m³ Beton vb.) */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-orange-400 uppercase tracking-wider">
                  <Truck className="w-4 h-4" />
                  Günlük Lojistik & Sahaya Giriş / Tüketim Dengesi
                </div>
                <span className="text-xs text-slate-400 bg-slate-950 px-2.5 py-0.5 rounded-lg border border-slate-800">
                  Konsolide Sevkiyat
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {summary.logistics.map((log) => (
                  <div
                    key={log.id}
                    className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 space-y-2"
                  >
                    <div className="text-xs font-bold text-white truncate">{log.material}</div>
                    <div className="flex items-baseline justify-between text-xs">
                      <div>
                        <div className="text-[10px] text-slate-400">Gelen Sevkiyat:</div>
                        <div className="text-sm font-bold text-blue-400 font-mono">
                          {log.incoming} {log.unit}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-[10px] text-slate-400">Bugün Tüketilen:</div>
                        <div className="text-sm font-bold text-emerald-400 font-mono">
                          {log.consumed} {log.unit}
                        </div>
                      </div>
                    </div>
                    {log.zone && (
                      <div className="text-[10px] text-slate-500 truncate pt-1 border-t border-slate-900">
                        📍 {log.zone}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* 5. Tamamlanan İmalatlar & BoQ İlerlemesi */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-cyan-400 uppercase tracking-wider">
                  <ShieldCheck className="w-4 h-4" />
                  Bugün Tamamlanan ve Teknik Kabulü Onaylanan İmalatlar
                </div>
                <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-lg border border-emerald-500/20">
                  Toplam İlerleme: +%{summary.dailyProgress}
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

            {/* 6. Mühendisin Manuel Değerlendirmesi & Saha Notları */}
            <div className="bg-gradient-to-br from-slate-900 to-slate-900/80 border-2 border-orange-500/40 rounded-2xl p-5 space-y-3 shadow-xl">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-orange-400 uppercase tracking-wider flex items-center gap-2">
                  <MessageSquare className="w-4 h-4" />
                  Saha Mühendisi Genel Değerlendirmesi / Ekstra Notlar
                </label>
                <span className="text-[11px] text-slate-400">
                  (Patron Raporuna ve LLM özetine doğrudan aktarılır)
                </span>
              </div>
              <textarea
                value={engineerNotes}
                onChange={(e) => setEngineerNotes(e.target.value)}
                rows={4}
                required
                placeholder="Örn: Vinç fırtına yüzünden 3 saat çalışmadı, rüzgar durulduğunda beton dökümüne devam edildi..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 resize-none transition"
              />
            </div>

            {/* 7. Büyük Doğrulama & Merkeze Gönder Butonu */}
            <div className="pt-2">
              {submittedSuccess ? (
                <div className="bg-emerald-500/10 border-2 border-emerald-500/40 rounded-3xl p-6 text-center space-y-3 shadow-2xl animate-in fade-in zoom-in-95">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <h3 className="text-lg font-extrabold text-white">
                    Günün Şantiye Jurnali Merkeze İletildi ve Otonom Patron Raporu Üretildi!
                  </h3>
                  <p className="text-xs text-slate-300 max-w-lg mx-auto leading-relaxed">
                    Tüm meteorolojik riskler, lojistik sevkiyatları ve İSG ihlalleri mühürlendi.
                    Yapay Zeka (LLM), Jurnaldan gelen ham verileri okuyarak Proje Detayı sayfasında
                    C-Level Patron Özeti olarak yayınladı.
                  </p>
                  <div className="flex items-center justify-center gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => router.push(`/admin/projects/${summary.projectId}`)}
                      className="px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs flex items-center gap-2 transition"
                    >
                      <Bot className="w-4 h-4" />
                      Admin Proje Detayı & Patron Raporuna Git
                    </button>
                    <button
                      type="button"
                      onClick={() => setSubmittedSuccess(false)}
                      className="text-xs text-slate-400 hover:text-white"
                    >
                      Jurnali Tekrar Görüntüle
                    </button>
                  </div>
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
                      Veriler Doğrulanıyor, Jurnal Mühürleniyor ve Patron Özeti Üretiliyor...
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5 group-hover:translate-x-1 transition" />
                      Verileri Doğrula & Jurnali Merkeze Gönder (Patron Raporunu Tetikle)
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
