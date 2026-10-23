"use client"
/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Franchise Yönetim Dashboard'u & "Yapay Zeka Risk Radarı" (AI Delay Simulator)
 */

import { useState, useEffect } from "react"
import Link from "next/link"
import {
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Sparkles,
  Bot,
  Building2,
  Layers,
  MapPin,
  ArrowRight,
  TrendingUp,
  RefreshCw,
  Calendar,
  ChevronRight,
  ShieldCheck,
  PackageX,
  FileCheck,
  ExternalLink,
  Flame,
  Zap,
} from "lucide-react"
import CapexChartWidget from "@/components/dashboard/capex-chart"

interface StoreProject {
  id: string
  name: string
  title: string
  city: string | null
  district: string | null
  startDate: string
  progress: number
  status: string
  rolloutPhase: string
  grossAreaSqm?: number | null
  totalCapex?: number | null
  storeTemplate?: {
    id: string
    name: string
    estimatedDays: number
  } | null
  stageGates: Array<{
    id: string
    stageName: string
    isApproved: boolean
  }>
  punchLists: Array<{
    id: string
    status: string
  }>
  totalGates: number
  approvedGates: number
  openDefects: number
}

interface RiskAnalysis {
  project: StoreProject
  riskLevel: "CRITICAL" | "WARNING" | "ON_TRACK"
  estimatedDays: number
  elapsedDays: number
  delayDays: number
  bottleneckStage: string
  aiRecommendation: string
}

export default function FranchiseDashboardPage() {
  const [projects, setProjects] = useState<StoreProject[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedRiskTab, setSelectedRiskTab] = useState<"ALL" | "CRITICAL" | "WARNING">("ALL")

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      const res = await fetch("/api/franchise/rollout")
      const data = await res.json()
      if (data.projects) {
        setProjects(data.projects)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDashboardData()
  }, [])

  // AI Delay Risk Analysis Engine
  const analyzeProjectRisk = (p: StoreProject): RiskAnalysis => {
    const estimatedDays = p.storeTemplate?.estimatedDays || 45
    // Simulated project age (days elapsed since store start)
    // If progress is low compared to expected stage progression, compute delay
    const totalGates = p.stageGates?.length || 5
    const approvedGates = p.stageGates?.filter((g) => g.isApproved)?.length || 0
    const openDefects = p.openDefects || 0

    // Determine current unapproved bottleneck
    const unapprovedGate = p.stageGates?.find((g) => !g.isApproved)?.stageName || "AÇILIŞ"

    let riskLevel: "CRITICAL" | "WARNING" | "ON_TRACK" = "ON_TRACK"
    let delayDays = 0
    let aiRecommendation = "Proje kurulum süreci planlanan Gantt takvimine uygun ilerliyor."

    if (p.status === "TAMAMLANDI" || approvedGates === totalGates) {
      riskLevel = "ON_TRACK"
      delayDays = 0
      aiRecommendation = "Tüm idari onaylar ve inşaat fazları tamamlandı. Resmi açılışa hazır."
    } else if (approvedGates <= 1 && p.progress > 30) {
      // Construction proceeding without administrative AVM/Rental permits
      riskLevel = "CRITICAL"
      delayDays = 18
      aiRecommendation = `İdari "${unapprovedGate}" aşaması inşaat ilerlemesinin gerisinde kaldı. AVM yönetimiyle ivedi teknik uzlaşma toplantısı yapılmalı.`
    } else if (openDefects >= 3) {
      // Quality defects bottleneck
      riskLevel = "CRITICAL"
      delayDays = 12
      aiRecommendation = `${openDefects} açık Punch List kusuru açılışı tehlikeye atıyor. İlgili taşeronlara acil düzeltme ihtarı çekilmeli.`
    } else if (approvedGates === 2 && p.progress < 30) {
      riskLevel = "WARNING"
      delayDays = 7
      aiRecommendation = "Kaba yapı imalat hızı planlanan günlük metrajın %25 gerisinde. Şantiyeye ek taşeron ekibi takviye edilmeli."
    } else if (openDefects > 0) {
      riskLevel = "WARNING"
      delayDays = 4
      aiRecommendation = "Kusurların teslim tarihinden önce kapanması için bölge müdürü ara kabul denetimi yapmalı."
    }

    return {
      project: p,
      riskLevel,
      estimatedDays,
      elapsedDays: Math.min(estimatedDays, Math.round((p.progress / 100) * estimatedDays) + delayDays),
      delayDays,
      bottleneckStage: unapprovedGate,
      aiRecommendation,
    }
  }

  const analyzedList = projects.map(analyzeProjectRisk)
  const criticalRisks = analyzedList.filter((a) => a.riskLevel === "CRITICAL")
  const warningRisks = analyzedList.filter((a) => a.riskLevel === "WARNING")
  const onTrackList = analyzedList.filter((a) => a.riskLevel === "ON_TRACK")

  const filteredRiskList =
    selectedRiskTab === "ALL"
      ? analyzedList
      : selectedRiskTab === "CRITICAL"
      ? criticalRisks
      : warningRisks

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-blue-400 mb-1">
            <Bot className="w-4 h-4" />
            <span>Nexa AI Rollout Intelligence</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            Franchise Operasyon Dashboard'u
          </h1>
          <p className="text-sm text-slate-400">
            Tüm Türkiye'deki mağaza açılışlarını yapay zeka gecikme simülatörü, idari kilitler ve tedarik zinciriyle izleyin.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            href="/admin/franchise/rollout"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:bg-slate-800 text-xs text-slate-200 transition-colors"
          >
            <span>Rollout Haritası</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
          <Link
            href="/admin/franchise/procurement/consolidated"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:bg-slate-800 text-xs text-slate-200 transition-colors"
          >
            <span>Konsolide İhale</span>
          </Link>
          <Link
            href="/admin/franchise/logistics/rma"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:bg-slate-800 text-xs text-slate-200 transition-colors"
          >
            <span>RMA Hasar Merkezi</span>
          </Link>
        </div>
      </div>

      {/* Top Metrics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="text-xs text-slate-400 flex items-center justify-between">
            <span>Aktif Mağaza Kurulumu</span>
            <Building2 className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-bold text-white mt-2">{projects.length}</div>
          <div className="text-[11px] text-slate-500 mt-1">Türkiye Geneli Şantiye</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="text-xs text-red-400 flex items-center justify-between">
            <span>Kritik Gecikme Riski</span>
            <Flame className="w-4 h-4 text-red-400" />
          </div>
          <div className="text-2xl font-bold text-red-400 mt-2">{criticalRisks.length}</div>
          <div className="text-[11px] text-slate-500 mt-1">AI Radarına Yakalanan</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="text-xs text-amber-400 flex items-center justify-between">
            <span>Orta Seviye Risk</span>
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-amber-400 mt-2">{warningRisks.length}</div>
          <div className="text-[11px] text-slate-500 mt-1">Yakından Takip Edilen</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="text-xs text-emerald-400 flex items-center justify-between">
            <span>Takvime Uygun</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-emerald-400 mt-2">{onTrackList.length}</div>
          <div className="text-[11px] text-slate-500 mt-1">Planlanan Gantt'ta İlerleyen</div>
        </div>
      </div>

      {/* FEATURED: "YAPAY ZEKA RİSK RADARI" (AI Delay Radar Card) */}
      <div className="bg-slate-900 border-2 border-red-950/70 rounded-2xl p-6 space-y-5 shadow-2xl relative overflow-hidden">
        {/* Radar Accent Glow */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-red-600/5 rounded-full blur-3xl pointer-events-none"></div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-red-950/80 border border-red-800 text-red-400 shrink-0">
              <Bot className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white">Yapay Zeka Risk Radarı</h2>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-red-950 text-red-400 border border-red-800 animate-pulse">
                  CANLI SİMÜLASYON
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Standart Gantt kurulum süresi ile sahadan gelen onaylanmış Stage-Gate fazlarını kıyaslayarak gecikme riski olan mağazaları kırmızıyla listeler.
              </p>
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center p-1 bg-slate-950 border border-slate-800 rounded-lg text-xs self-start sm:self-center">
            <button
              onClick={() => setSelectedRiskTab("ALL")}
              className={`px-3 py-1 rounded-md font-medium transition-colors ${
                selectedRiskTab === "ALL" ? "bg-slate-800 text-white" : "text-slate-400 hover:text-white"
              }`}
            >
              Tümü ({analyzedList.length})
            </button>
            <button
              onClick={() => setSelectedRiskTab("CRITICAL")}
              className={`px-3 py-1 rounded-md font-medium transition-colors ${
                selectedRiskTab === "CRITICAL" ? "bg-red-950/80 text-red-300" : "text-slate-400 hover:text-white"
              }`}
            >
              Kritik ({criticalRisks.length})
            </button>
            <button
              onClick={() => setSelectedRiskTab("WARNING")}
              className={`px-3 py-1 rounded-md font-medium transition-colors ${
                selectedRiskTab === "WARNING" ? "bg-amber-950/80 text-amber-300" : "text-slate-400 hover:text-white"
              }`}
            >
              Orta Risk ({warningRisks.length})
            </button>
          </div>
        </div>

        {/* Risk Radar Cards List */}
        <div className="space-y-3.5">
          {filteredRiskList.length === 0 ? (
            <div className="bg-slate-950/60 border border-slate-800 p-8 rounded-xl text-center text-slate-500 text-xs">
              Bu filtrede gecikme riski tespit edilen mağaza bulunmuyor.
            </div>
          ) : (
            filteredRiskList.map((item) => {
              const p = item.project
              const isCritical = item.riskLevel === "CRITICAL"
              const isWarning = item.riskLevel === "WARNING"

              return (
                <div
                  key={p.id}
                  className={`rounded-xl border p-4.5 transition-all space-y-3.5 ${
                    isCritical
                      ? "bg-red-950/20 border-red-900/60 hover:border-red-700/80"
                      : isWarning
                      ? "bg-amber-950/15 border-amber-900/50 hover:border-amber-700/70"
                      : "bg-slate-950/40 border-slate-800"
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        {isCritical && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-red-950 border border-red-800 text-red-400 flex items-center gap-1">
                            <Flame className="w-3 h-3" /> KRİTİK GECİKME RİSKİ
                          </span>
                        )}
                        {isWarning && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-950 border border-amber-800 text-amber-400 flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" /> ORTA GECİKME RİSKİ
                          </span>
                        )}
                        {!isCritical && !isWarning && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-950 border border-emerald-800 text-emerald-400 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> TAKVİME UYGUN
                          </span>
                        )}

                        <span className="text-xs font-semibold text-slate-400">
                          {p.storeTemplate?.name || "Tip Konsept"}
                        </span>
                      </div>

                      <h3 className="text-base font-bold text-white pt-1">{p.name || p.title}</h3>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-slate-500" />
                          <span>{p.city} • {p.district}</span>
                        </span>
                        <span>•</span>
                        <span>Standart Süre: {item.estimatedDays} Gün</span>
                        <span>•</span>
                        <span>Şantiye İlerlemesi: %{p.progress}</span>
                      </div>
                    </div>

                    {/* Delay Metric & Action Link */}
                    <div className="flex flex-col sm:items-end gap-2 shrink-0">
                      {item.delayDays > 0 ? (
                        <div className="px-3 py-1.5 rounded-lg bg-red-950/80 border border-red-800 text-red-300 font-mono text-xs font-bold flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-red-400" />
                          <span>+{item.delayDays} Gün Gecikme Öngörüsü</span>
                        </div>
                      ) : (
                        <div className="px-3 py-1.5 rounded-lg bg-emerald-950/60 border border-emerald-800 text-emerald-300 font-mono text-xs font-bold">
                          Takvimde Sapma Yok
                        </div>
                      )}

                      <div className="flex items-center gap-2">
                        <Link
                          href={`/admin/franchise/stage-gates/${p.id}`}
                          className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition-colors flex items-center gap-1"
                        >
                          <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
                          <span>Stage-Gate Yönet</span>
                        </Link>
                      </div>
                    </div>
                  </div>

                  {/* AI Diagnosis and Action Recommendation */}
                  <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-lg text-xs space-y-1.5">
                    <div className="flex items-center gap-2 text-slate-400 font-semibold">
                      <Zap className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span>Darboğaz Fazı: <strong className="text-white">"{item.bottleneckStage}"</strong></span>
                    </div>
                    <div className="text-slate-300 pl-5 text-[11px] leading-relaxed">
                      <span className="text-blue-400 font-semibold">AI Önerisi: </span>
                      {item.aiRecommendation}
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>

      {/* CAPEX m² Analitiği ve Finans Widget'ı */}
      <CapexChartWidget projects={projects} />

      {/* Operations Quick Hub: Procurement & Logistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Consolidated Procurement Hub Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2 text-sm font-bold text-white">
              <Layers className="w-4 h-4 text-blue-400" />
              <span>Konsolide Satınalma Havuzu</span>
            </div>
            <Link
              href="/admin/franchise/procurement/consolidated"
              className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
            >
              <span>Tümünü Gör</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <p className="text-xs text-slate-400">
            Açılacak mağazaların aynı tip malzeme ihtiyaçları sistem tarafından otomatik birleştirilerek toplu alım iskontosu sağlanır.
          </p>

          <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg flex items-center justify-between text-xs">
            <span className="text-slate-300 font-medium">Ortak Soğutucu & Kasa Bankosu Talepleri</span>
            <span className="px-2 py-0.5 rounded bg-blue-950 text-blue-400 font-bold border border-blue-800">
              İHALE AÇIK
            </span>
          </div>
        </div>

        {/* RMA Damage Center Hub Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2 text-sm font-bold text-white">
              <PackageX className="w-4 h-4 text-red-400" />
              <span>Hasarlı Teslimatlar (RMA)</span>
            </div>
            <Link
              href="/admin/franchise/logistics/rma"
              className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1"
            >
              <span>Merkeze Git</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <p className="text-xs text-slate-400">
            Sahadan girilen hasarlı ve kusurlu teslimat tutanakları doğrudan tedarikçi RMA iade zincirine aktarılır.
          </p>

          <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg flex items-center justify-between text-xs">
            <span className="text-slate-300 font-medium">Tek Tıkla Tedarikçi İade/Değişim Maili</span>
            <span className="px-2 py-0.5 rounded bg-red-950 text-red-400 font-bold border border-red-800">
              RMA AKTİF
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
