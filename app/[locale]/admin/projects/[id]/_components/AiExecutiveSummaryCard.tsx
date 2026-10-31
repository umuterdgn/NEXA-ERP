"use client"

import React, { useState, useEffect } from "react"
import {
  Sparkles,
  Bot,
  RefreshCw,
  AlertTriangle,
  ShieldCheck,
  TrendingUp,
  Zap,
  Building2,
  CheckCircle2,
  Flame,
  ArrowRight
} from "lucide-react"
import { toast } from "react-hot-toast"

interface DailyReport {
  id: string
  summaryText: string
  riskTags: string[]
  date: string
}

interface SubScore {
  id: string
  speedScore: number
  qualityScore: number
  isgRiskLevel: "LOW" | "MEDIUM" | "HIGH"
  company: {
    id: string
    name: string
    contactName?: string | null
  }
}

export default function AiExecutiveSummaryCard({
  projectId,
  projectName
}: {
  projectId: string
  projectName?: string
}) {
  const [report, setReport] = useState<DailyReport | null>(null)
  const [subcontractorScores, setSubcontractorScores] = useState<SubScore[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isGenerating, setIsGenerating] = useState(false)
  const [isTraining, setIsTraining] = useState(false)

  useEffect(() => {
    if (projectId) {
      fetchReportAndScores()
    }
  }, [projectId])

  const fetchReportAndScores = async () => {
    setIsLoading(true)
    try {
      const res = await fetch(`/api/ai/daily-report?projectId=${projectId}`)
      if (res.ok) {
        const data = await res.json()
        if (data.report) {
          setReport(data.report)
        }
        if (Array.isArray(data.subcontractorScores)) {
          setSubcontractorScores(data.subcontractorScores)
        }
      }
    } catch (err) {
      console.warn("AI raporu yüklenemedi:", err)
    } finally {
      setIsLoading(false)
    }
  }

  // Manuel AI Günlük Raporu Oluştur (POST /api/ai/daily-report)
  const handleGenerateReport = async () => {
    setIsGenerating(true)
    try {
      const res = await fetch("/api/ai/daily-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId })
      })

      const data = await res.json()

      if (res.ok && data.report) {
        setReport(data.report)
        toast.success("✨ Günün Otonom Patron Raporu başarıyla üretildi!", {
          icon: "👔",
          duration: 4000
        })
      } else {
        toast.error(data.error || "Rapor üretilemedi")
      }
    } catch (err: any) {
      toast.error("Rapor üretilirken hata oluştu: " + (err?.message || "Sunucu hatası"))
    } finally {
      setIsGenerating(false)
    }
  }

  // ML Taşeron Puanlama Algoritmasını Çalıştır
  const handleTriggerMlTraining = async () => {
    setIsTraining(true)
    try {
      const res = await fetch("/api/ai/train", { method: "POST" })
      const data = await res.json()

      if (res.ok) {
        toast.success("🧠 Taşeron performans modelleri ML algoritmasıyla yeniden eğitildi!", {
          icon: "📊"
        })
        await fetchReportAndScores()
      }
    } catch (err) {
      toast.error("ML model eğitimi başarısız oldu")
    } finally {
      setIsTraining(false)
    }
  }

  return (
    <div className="relative p-[1.5px] rounded-2xl bg-gradient-to-r from-violet-600 via-indigo-600 to-emerald-500 shadow-xl shadow-indigo-500/10 mb-6 overflow-hidden">
      {/* Kart İçerik Kapsayıcısı */}
      <div className="bg-slate-900 rounded-[15px] p-6 space-y-6">
        {/* Üst Başlık & Aksiyon Çubuğu */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-white tracking-wide flex items-center gap-2">
                  <span>AI Asistan & Otonom Patron Özeti</span>
                  <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
                </h3>
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-300 border border-violet-500/30">
                  C-Level Brief
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Şantiyedeki hakedişler, BIM kusurları ve İSG olayları LLM motoruyla özetlenir.
              </p>
            </div>
          </div>

          {/* Aksiyon Butonları */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={handleTriggerMlTraining}
              disabled={isTraining}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-semibold transition-all border border-slate-700 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              title="Kusur ve gecikme verilerinden taşeron puanlarını yeniden hesapla"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isTraining ? "animate-spin text-cyan-400" : ""}`} />
              <span>{isTraining ? "Eğitiliyor..." : "ML Taşeron Puanla"}</span>
            </button>

            <button
              onClick={handleGenerateReport}
              disabled={isGenerating}
              className="px-4 py-2 bg-gradient-to-r from-violet-600 via-indigo-600 to-purple-600 hover:from-violet-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-500/25 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50 border border-violet-400/30"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-amber-300" />
                  <span>Özet Çıkarılıyor...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>AI Günlük Raporu Oluştur</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* ==================================================================== */}
        {/* LLM GÜNLÜK PATRON ÖZETİ METNİ */}
        {/* ==================================================================== */}
        <div className="space-y-4">
          {isLoading ? (
            <div className="py-8 text-center text-slate-400 flex flex-col items-center justify-center gap-2">
              <RefreshCw className="w-6 h-6 animate-spin text-indigo-400" />
              <p className="text-xs">Günün yapay zeka analizi yükleniyor...</p>
            </div>
          ) : report ? (
            <div className="space-y-4">
              {/* Risk Etiketleri */}
              {report.riskTags && report.riskTags.length > 0 && (
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[11px] font-bold text-slate-400 mr-1">RİSK ANALİZİ:</span>
                  {report.riskTags.map((tag, idx) => (
                    <span
                      key={idx}
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                        tag.includes("KRİTİK") || tag.includes("YÜKSEK")
                          ? "bg-rose-500/15 text-rose-300 border-rose-500/30"
                          : tag.includes("BÜTÇE") || tag.includes("HAKEDİŞ")
                          ? "bg-amber-500/15 text-amber-300 border-amber-500/30"
                          : "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
                      }`}
                    >
                      {tag}
                    </span>
                  ))}
                  <span className="text-[11px] text-slate-500 ml-auto font-mono">
                    Rapor Tarihi: {new Date(report.date).toLocaleDateString("tr-TR")}
                  </span>
                </div>
              )}

              {/* 3 Paragraflık Patron Özeti Metni */}
              <div className="bg-slate-850/80 rounded-xl p-5 border border-slate-700/60 text-xs text-slate-200 leading-relaxed space-y-3 font-sans">
                {report.summaryText.split("\n\n").map((paragraph, index) => (
                  <p key={index} className="text-slate-200">
                    {paragraph}
                  </p>
                ))}
              </div>
            </div>
          ) : (
            <div className="p-6 rounded-xl bg-slate-850/40 border border-slate-800 text-center space-y-2">
              <Bot className="w-8 h-8 text-violet-400 mx-auto opacity-60" />
              <p className="text-xs font-semibold text-slate-300">
                Bu proje için henüz günün otonom patron raporu üretilmedi.
              </p>
              <p className="text-[11px] text-slate-500">
                Yukarıdaki <strong>"AI Günlük Raporu Oluştur"</strong> butonuna tıklayarak günün tüm şantiye verilerini LLM ile sentezleyebilirsiniz.
              </p>
            </div>
          )}
        </div>

        {/* ==================================================================== */}
        {/* TAŞERON PUANLAMA & RİSK KARTLARI (ML SONUÇLARI) */}
        {/* ==================================================================== */}
        <div className="space-y-3 pt-2 border-t border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-cyan-400" />
              <span>Taşeron Performans & İSG Risk Puanları (ML Modeli)</span>
            </span>
            <span className="text-[11px] text-slate-400">
              Kusur + Gecikme Regresyonu
            </span>
          </div>

          {subcontractorScores.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              {subcontractorScores.slice(0, 4).map((sub) => {
                const isgColor =
                  sub.isgRiskLevel === "HIGH"
                    ? "bg-rose-500/20 text-rose-300 border-rose-500/40"
                    : sub.isgRiskLevel === "MEDIUM"
                    ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                    : "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"

                return (
                  <div
                    key={sub.id}
                    className="p-3.5 rounded-xl bg-slate-850 border border-slate-700/60 space-y-2"
                  >
                    <div className="flex items-center justify-between gap-1">
                      <h4 className="text-xs font-bold text-white truncate max-w-[150px]" title={sub.company.name}>
                        {sub.company.name}
                      </h4>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold border ${isgColor}`}>
                        {sub.isgRiskLevel} İSG
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-800">
                      <div>
                        <span className="text-[10px] text-slate-400 block">Hız Puanı</span>
                        <span className="text-sm font-black text-cyan-400">
                          {sub.speedScore.toFixed(1)}/10
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block">BIM Kalite</span>
                        <span
                          className={`text-sm font-black ${
                            sub.qualityScore >= 8.5
                              ? "text-emerald-400"
                              : sub.qualityScore >= 6.5
                              ? "text-amber-400"
                              : "text-rose-400"
                          }`}
                        >
                          {sub.qualityScore.toFixed(1)}/10
                        </span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="p-3 rounded-lg bg-slate-850/40 border border-slate-800 text-[11px] text-slate-400">
              Taşeron puanları henüz hesaplanmadı. "ML Taşeron Puanla" butonuna basarak ilk modeli çalıştırabilirsiniz.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
