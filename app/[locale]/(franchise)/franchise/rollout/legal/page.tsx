"use client"
/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Franchise Rollout Legal & Official Permits Critical Path (CPM) Module
 * İtfaiye, Ruhsat, Elektrik, Su, İnternet Aboneliği ve Kritik Yol Gecikme Riski Alarmı
 */

import React, { useState, useEffect } from "react"
import Link from "next/link"
import {
  FileCheck2,
  AlertTriangle,
  AlertOctagon,
  Clock,
  CheckCircle2,
  Calendar,
  Building2,
  FileText,
  Search,
  Filter,
  RefreshCw,
  ExternalLink,
  ChevronRight,
  ShieldAlert,
  Flame,
  Zap,
  Droplets,
  Wifi,
  Sparkles,
  Layers,
  Check,
  X,
  UploadCloud,
} from "lucide-react"
import RolloutSubNav from "@/components/franchise/RolloutSubNav"
import type { LegalPermitItem } from "@/lib/constants/franchise-constants"
import {
  getRolloutLegalData,
  updateLegalPermitStatus,
} from "@/app/actions/franchise-rollout"

export default function RolloutLegalPage() {
  const [permits, setPermits] = useState<(LegalPermitItem & { hasDelayRisk?: boolean; delayDays?: number; diffDays?: number })[]>([])
  const [cpmAnalysis, setCpmAnalysis] = useState<any>({
    hasGlobalDelayRisk: false,
    maxDelayDays: 0,
    criticalBottlenecks: [],
    approvedCount: 0,
    totalCount: 0,
    completionRate: 0,
  })
  const [loading, setLoading] = useState(true)
  const [storeFilter, setStoreFilter] = useState("ALL")
  const [statusFilter, setStatusFilter] = useState("ALL")
  const [searchQuery, setSearchQuery] = useState("")

  // Edit / Action Modal
  const [selectedPermitForEdit, setSelectedPermitForEdit] = useState<any | null>(null)
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  const loadData = async () => {
    try {
      setLoading(true)
      const res = await getRolloutLegalData(storeFilter)
      if (res.success && res.permits) {
        setPermits(res.permits)
        if (res.cpmAnalysis) setCpmAnalysis(res.cpmAnalysis)
      }
    } catch (err) {
      console.error("Legal verileri yüklenirken hata:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [storeFilter])

  const handleUpdateStatus = async (
    permitId: string,
    newStatus: any,
    estimatedDate?: string
  ) => {
    try {
      setUpdatingId(permitId)
      const res = await updateLegalPermitStatus(permitId, {
        status: newStatus,
        estimatedApprovalDate: estimatedDate,
      })
      if (res.success) {
        loadData()
      }
    } catch (err) {
      console.error("İzin güncelleme hatası:", err)
    } finally {
      setUpdatingId(null)
    }
  }

  // Filtreleme
  const filteredPermits = permits.filter((p) => {
    const matchesSearch =
      p.permitName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.storeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.authority.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.officerInCharge.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === "ALL" || p.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const uniqueStores = Array.from(new Set(permits.map((p) => ({ id: p.storeId, name: p.storeName }))))

  // İzin tipine göre ikon
  const getPermitIcon = (name: string) => {
    if (name.includes("İtfaiye") || name.includes("Yangın")) return <Flame className="w-4 h-4 text-rose-400" />
    if (name.includes("Elektrik") || name.includes("Trafo")) return <Zap className="w-4 h-4 text-amber-400" />
    if (name.includes("Su") || name.includes("Kanal")) return <Droplets className="w-4 h-4 text-sky-400" />
    if (name.includes("İnternet") || name.includes("Fiber")) return <Wifi className="w-4 h-4 text-indigo-400" />
    return <FileCheck2 className="w-4 h-4 text-emerald-400" />
  }

  return (
    <div className="w-full space-y-6 pb-12">
      {/* Sub-Nav */}
      <RolloutSubNav activeTab="legal" alertCount={cpmAnalysis.criticalBottlenecks?.length || 0} />

      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-amber-400 mb-1">
            <FileCheck2 className="w-4 h-4 text-amber-400" />
            <span>Resmi İzinler & Abonelik Takip Merkezi</span>
            <span className="text-slate-600">•</span>
            <span className="text-slate-400">Critical Path Method (CPM) Delay Engine</span>
          </div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            Resmi İzinler & Kritik Yol Takibi
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20 font-bold">
              Otomatik Gecikme Riski Alarmı
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-3xl">
            İtfaiye Raporu, Çalışma Ruhsatı, Elektrik/Su ve Kurumsal İnternet onay tarihleri inşaatın bitiş tarihiyle anlık karşılaştırılır. Ruhsat çıkışı inşaat bitiminden sonraya kalırsa sistem otomatik "Kritik Yol Gecikme Riski" uyarısı verir.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={loadData}
            disabled={loading}
            className="px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 hover:border-slate-600 text-xs text-slate-300 flex items-center gap-2 hover:bg-slate-800 transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            Yenile
          </button>

          <Link
            href="/franchise/rollout/board"
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 border border-slate-700 text-xs font-medium text-slate-200 flex items-center gap-2 transition"
          >
            <Layers className="w-3.5 h-3.5 text-amber-400" />
            Kanban Panosuna Dön
          </Link>
        </div>
      </div>

      {/* ADIM 3: KRİTİK YOL (CPM) GECİKME RİSKİ ALARM BANNER'I */}
      {cpmAnalysis.hasGlobalDelayRisk && (
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-rose-950/80 via-slate-900 to-rose-950/80 border-2 border-rose-500/60 p-5 shadow-2xl shadow-rose-950/50 animate-pulse">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center shrink-0 text-rose-400 shadow-lg shadow-rose-500/30">
              <AlertOctagon className="w-7 h-7" />
            </div>

            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2.5 py-0.5 rounded-full bg-rose-500 text-slate-950 text-[10px] font-black uppercase tracking-wider shadow">
                  Kritik Yol Alarmı
                </span>
                <span className="text-xs font-bold text-rose-300">
                  {cpmAnalysis.maxDelayDays} Gün Açılış Gecikme Riski Tespit Edildi!
                </span>
              </div>

              <h3 className="text-base font-bold text-white">
                Resmi İzin Çıkış Tarihi İnşaat Bitiş Tarihinin Gerisinde Kaldı
              </h3>
              <p className="text-xs text-slate-300 mt-1 max-w-4xl leading-relaxed">
                Şantiyede inşaat tamamlanmış olsa dahi, aşağıdaki kritik izinler sonuçlanmadığı için mağaza fiilen açılamayacaktır:
              </p>

              {/* Gecikmedeki İzinler Listesi */}
              <div className="mt-3 flex flex-wrap gap-2">
                {cpmAnalysis.criticalBottlenecks.map((b: any) => (
                  <div
                    key={b.id}
                    className="flex items-center gap-2 bg-slate-950/90 border border-rose-500/40 px-3 py-1.5 rounded-xl text-xs"
                  >
                    <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                    <span className="font-bold text-white">{b.storeName}:</span>
                    <span className="text-rose-300">{b.permitName}</span>
                    <span className="px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-400 font-mono text-[10px] font-bold">
                      +{b.delayDays} gün sarkma
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="shrink-0 hidden md:block">
              <button
                onClick={() =>
                  alert("İlgili resmi makamlar için Genel Müdürlük Öncelik ve İtiraz Yazısı otomatik oluşturulup e-Devlet KEP üzerinden sevk edildi.")
                }
                className="px-4 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-400 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-lg shadow-rose-500/30 transition"
              >
                <Sparkles className="w-4 h-4" />
                Hızlandırma Talebi İlet
              </button>
            </div>
          </div>
        </div>
      )}

      {/* METRİK KARTLARI */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3.5">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">
            Toplam Resmi Süreç
          </div>
          <div className="text-2xl font-bold text-white mt-1">{cpmAnalysis.totalCount}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Yasal izin & abonelik</div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3.5">
          <div className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wide">
            Onaylanan / Tamamlanan
          </div>
          <div className="text-2xl font-bold text-emerald-300 mt-1">{cpmAnalysis.approvedCount}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Ruhsat & sözleşme teslim</div>
        </div>

        <div className="bg-slate-900/60 border border-rose-500/30 rounded-xl p-3.5">
          <div className="text-[11px] font-semibold text-rose-400 uppercase tracking-wide">
            Gecikmedeki İzinler
          </div>
          <div className="text-2xl font-bold text-rose-300 mt-1">
            {cpmAnalysis.criticalBottlenecks?.length || 0}
          </div>
          <div className="text-[10px] text-rose-400/80 mt-0.5">Kritik yol darboğazı</div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3.5">
          <div className="text-[11px] font-semibold text-amber-400 uppercase tracking-wide">
            Ruhsat Tamamlanma
          </div>
          <div className="text-2xl font-bold text-amber-300 mt-1">%{cpmAnalysis.completionRate}</div>
          <div className="w-full bg-slate-800 rounded-full h-1.5 mt-1 overflow-hidden">
            <div
              className="bg-amber-400 h-1.5 rounded-full"
              style={{ width: `${cpmAnalysis.completionRate}%` }}
            />
          </div>
        </div>
      </div>

      {/* FİLTRE VE ARAMA */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="İzin adı, kurum veya şube ara..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
          />
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <select
            value={storeFilter}
            onChange={(e) => setStoreFilter(e.target.value)}
            className="bg-slate-950 border border-slate-700 text-xs text-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:border-amber-500"
          >
            <option value="ALL">Tüm Şubeler</option>
            {uniqueStores.map((st) => (
              <option key={st.id} value={st.id}>
                {st.name}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-950 border border-slate-700 text-xs text-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:border-amber-500"
          >
            <option value="ALL">Tüm Durumlar</option>
            <option value="BAŞVURU_YAPILMADI">Başvuru Yapılmadı</option>
            <option value="EVRAK_INCELEMESI">Evrak İncelemesinde</option>
            <option value="KESIF_BEKLENIYOR">Keşif Bekleniyor</option>
            <option value="ONAYLANDI">Onaylandı</option>
            <option value="GECIKMEDE">Gecikmede (Alarm)</option>
          </select>
        </div>
      </div>

      {/* İZİNLER TABLOSU */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-950/80 border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3.5 px-4">Resmi Süreç / İzin Adı</th>
                <th className="py-3.5 px-3">Şube</th>
                <th className="py-3.5 px-3">İlgili Kurum & Yetkili</th>
                <th className="py-3.5 px-3">İnşaat Bitiş</th>
                <th className="py-3.5 px-3">Ruhsat Tahmini Çıkış</th>
                <th className="py-3.5 px-3 text-center">Kritik Yol Analizi</th>
                <th className="py-3.5 px-4 text-center">Durum</th>
                <th className="py-3.5 px-4 text-right">İşlem & Belge</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-200">
              {filteredPermits.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500">
                    <FileCheck2 className="w-8 h-8 text-slate-600 mx-auto mb-2 opacity-50" />
                    <span>Filtreye uygun resmi izin kaydı bulunamadı.</span>
                  </td>
                </tr>
              ) : (
                filteredPermits.map((permit) => {
                  const hasDelay = permit.hasDelayRisk
                  const isUpdating = updatingId === permit.id

                  const statusColors: Record<string, string> = {
                    BAŞVURU_YAPILMADI: "bg-slate-800 text-slate-400 border-slate-700",
                    EVRAK_INCELEMESI: "bg-sky-500/10 text-sky-400 border-sky-500/30",
                    KESIF_BEKLENIYOR: "bg-indigo-500/10 text-indigo-400 border-indigo-500/30",
                    ONAYLANDI: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30 font-bold",
                    GECIKMEDE: "bg-rose-500/10 text-rose-400 border-rose-500/40 font-bold animate-pulse",
                  }

                  return (
                    <tr
                      key={permit.id}
                      className={`hover:bg-slate-850/60 transition-colors ${
                        hasDelay ? "bg-rose-950/20" : ""
                      }`}
                    >
                      {/* İzin Adı & İkon */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="p-2 rounded-lg bg-slate-950 border border-slate-800 shrink-0">
                            {getPermitIcon(permit.permitName)}
                          </div>
                          <div>
                            <div className="font-bold text-white line-clamp-1">
                              {permit.permitName}
                            </div>
                            <div className="text-[10px] text-slate-400 mt-0.5">
                              Başvuru: {permit.applicationDate}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Şube */}
                      <td className="py-3 px-3">
                        <div className="font-medium text-slate-300 line-clamp-1">
                          {permit.storeName}
                        </div>
                      </td>

                      {/* Kurum & Yetkili */}
                      <td className="py-3 px-3">
                        <div className="text-slate-300 line-clamp-1">{permit.authority}</div>
                        <div className="text-[10px] text-slate-500">{permit.officerInCharge}</div>
                      </td>

                      {/* İnşaat Bitiş */}
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-1.5 text-slate-300">
                          <Calendar className="w-3.5 h-3.5 text-slate-500" />
                          <span>{permit.constructionFinishDate}</span>
                        </div>
                      </td>

                      {/* Ruhsat Tahmini */}
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-1.5 font-semibold text-slate-200">
                          <Clock className="w-3.5 h-3.5 text-amber-400" />
                          <span>{permit.estimatedApprovalDate}</span>
                        </div>
                      </td>

                      {/* Kritik Yol Kıyaslama */}
                      <td className="py-3 px-3 text-center">
                        {hasDelay ? (
                          <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 text-[11px] font-bold">
                            <AlertTriangle className="w-3 h-3 text-rose-400" />
                            Gecikme: +{permit.delayDays} gün
                          </div>
                        ) : permit.status === "ONAYLANDI" ? (
                          <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[11px] font-semibold">
                            <CheckCircle2 className="w-3 h-3" />
                            Tamamlandı
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-400">
                            Zamanında ({permit.diffDays} gün marj)
                          </span>
                        )}
                      </td>

                      {/* Durum Select */}
                      <td className="py-3 px-4 text-center">
                        <select
                          disabled={isUpdating}
                          value={permit.status}
                          onChange={(e) => handleUpdateStatus(permit.id, e.target.value)}
                          className={`text-xs rounded-lg px-2.5 py-1.5 border focus:outline-none focus:ring-1 focus:ring-amber-500 cursor-pointer ${
                            statusColors[permit.status as keyof typeof statusColors] || statusColors[permit.status] || "bg-slate-800 text-slate-300"
                          }`}
                        >
                          <option value="BAŞVURU_YAPILMADI" className="bg-slate-900 text-slate-400">
                            Başvuru Yapılmadı
                          </option>
                          <option value="EVRAK_INCELEMESI" className="bg-slate-900 text-sky-400">
                            Evrak İncelemesinde
                          </option>
                          <option value="KESIF_BEKLENIYOR" className="bg-slate-900 text-indigo-400">
                            Keşif Bekleniyor
                          </option>
                          <option value="ONAYLANDI" className="bg-slate-900 text-emerald-400">
                            ✓ Onaylandı
                          </option>
                          <option value="GECIKMEDE" className="bg-slate-900 text-rose-400">
                            ⚠ Gecikmede
                          </option>
                        </select>
                      </td>

                      {/* Belge & Detay */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {permit.documentUrl ? (
                            <button
                              onClick={() =>
                                alert(`Evrak Görüntüleyici: ${permit.documentUrl} dosyası açılıyor...`)
                              }
                              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-medium flex items-center gap-1 border border-slate-700 transition"
                            >
                              <FileText className="w-3.5 h-3.5 text-amber-400" />
                              Dosya
                            </button>
                          ) : (
                            <button
                              onClick={() => {
                                const newDate = prompt(
                                  "Yeni Tahmini Onay Tarihi Giriniz (YYYY-MM-DD):",
                                  permit.estimatedApprovalDate
                                )
                                if (newDate) {
                                  handleUpdateStatus(permit.id, permit.status, newDate)
                                }
                              }}
                              className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 text-[11px] font-medium flex items-center gap-1 border border-slate-800 transition"
                            >
                              <Clock className="w-3.5 h-3.5" />
                              Tarih Düzenle
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

