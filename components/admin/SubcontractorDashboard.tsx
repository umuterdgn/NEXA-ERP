"use client"

import React, { useState } from "react"
import Link from "next/link"
import {
  LayoutDashboard,
  Box,
  ShieldAlert,
  Wallet,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ArrowUpRight,
  HardHat,
  TrendingUp,
  MapPin,
  ExternalLink,
  Camera,
  Layers,
  DollarSign
} from "lucide-react"

export interface SubcontractorWorkPackage {
  id: string
  pozNo?: string | null
  name: string
  categoryKey?: string | null
  unit?: string | null
  plannedQuantity: number
  completedQuantity: number
  status: string
  subcontractorName?: string | null
}

export interface SubcontractorBimIssue {
  id: string
  title: string
  description?: string
  status: string
  severity?: string | null
  penaltyAmount?: number | null
  blockPayment?: boolean | null
  createdAt: string | Date
}

export interface SubcontractorApproval {
  id: string
  title: string
  requestType: string
  status: string
  amount?: number | null
  createdAt: string | Date
  notes?: string | null
}

interface SubcontractorDashboardProps {
  userName?: string | null
  workPackages: SubcontractorWorkPackage[]
  bimIssues: SubcontractorBimIssue[]
  approvals: SubcontractorApproval[]
}

export default function SubcontractorDashboard({
  userName = "Taşeron Yetkilisi",
  workPackages = [],
  bimIssues = [],
  approvals = []
}: SubcontractorDashboardProps) {
  // Hesaplamalar
  const totalWp = workPackages.length
  const completedWp = workPackages.filter((w) => w.status === "COMPLETED").length
  const avgProgress =
    totalWp > 0
      ? Math.round(
          workPackages.reduce((sum, w) => {
            const pct = w.plannedQuantity > 0 ? (w.completedQuantity / w.plannedQuantity) * 100 : 0
            return sum + Math.min(pct, 100)
          }, 0) / totalWp
        )
      : 0

  const activeDefects = bimIssues.filter((i) => i.status === "OPEN")
  const totalPenalties = bimIssues.reduce((sum, i) => sum + (i.penaltyAmount || 0), 0)

  const pendingApprovals = approvals.filter((a) => a.status === "PENDING")
  const totalPendingHakedis = pendingApprovals.reduce(
    (sum, a) => sum + (typeof a.amount === "number" ? a.amount : 0),
    0
  )

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Üst Karşılama Başlığı (Finans/Ciro kesinlikle gösterilmez) */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border border-slate-700/80 rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-orange-500/10 to-transparent pointer-events-none" />

        <div className="flex flex-wrap items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-2.5 mb-2">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-orange-500/20 text-orange-400 border border-orange-500/30 flex items-center gap-1.5">
                <HardHat className="w-3.5 h-3.5" />
                TAŞERON KORUMALI PORTAL
              </span>
              <span className="text-xs text-slate-400">Nexa ERP v2.6</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black text-white tracking-wide">
              Hoş Geldiniz, {userName}
            </h1>
            <p className="text-xs md:text-sm text-slate-300 mt-1 max-w-2xl">
              Bu ekranda sadece size atanmış iş paketlerini, 3D BIM kalite cezalarınızı ve hakediş onay durumunuzu takip edebilirsiniz.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/admin/subcontractor-inspections"
              className="px-4 py-2.5 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-400 hover:to-amber-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-orange-500/20 transition-all flex items-center gap-2"
            >
              <Camera className="w-4 h-4" />
              <span>İş Kanıtı Yükle</span>
            </Link>
            <Link
              href="/admin/bim"
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-all border border-slate-700 flex items-center gap-2"
            >
              <Box className="w-4 h-4 text-cyan-400" />
              <span>3D Modeli Aç</span>
            </Link>
          </div>
        </div>
      </div>

      {/* 3 Ana Durum Kartı (Ciro Yok, Sadece Taşeron Metrikleri) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Kart 1: Atanmış İş Paketleri & İlerleme */}
        <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Atanmış İş Paketleri
              </span>
              <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center border border-blue-500/20">
                <Layers className="w-4 h-4" />
              </div>
            </div>

            <div className="flex items-baseline gap-2 mb-2">
              <span className="text-3xl font-black text-white tracking-tight">{totalWp}</span>
              <span className="text-xs text-slate-400">Kalem İmalat</span>
            </div>

            <div className="space-y-1.5 mt-3">
              <div className="flex justify-between text-xs text-slate-300">
                <span>Ortalama İlerleme</span>
                <span className="font-bold text-blue-400">%{avgProgress}</span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-blue-500 to-cyan-400 h-full rounded-full transition-all"
                  style={{ width: `${Math.min(avgProgress, 100)}%` }}
                />
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] text-slate-400 flex justify-between">
            <span>Tamamlanan: {completedWp}</span>
            <span>Devam Eden: {totalWp - completedWp}</span>
          </div>
        </div>

        {/* Kart 2: 3D BIM Cezaları ve Kusurlar */}
        <div
          className={`backdrop-blur-md rounded-2xl p-6 shadow-xl flex flex-col justify-between transition-all border ${
            activeDefects.length > 0
              ? "bg-red-950/20 border-red-500/40 shadow-red-500/10"
              : "bg-slate-900/60 border-slate-800"
          }`}
        >
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                {activeDefects.length > 0 && <span className="w-2 h-2 rounded-full bg-red-400 animate-ping" />}
                3D BIM Kusur & Cezaları
              </span>
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                  activeDefects.length > 0
                    ? "bg-red-500/20 text-red-400 border border-red-500/40"
                    : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                }`}
              >
                <ShieldAlert className="w-4 h-4" />
              </div>
            </div>

            <div className="flex items-baseline gap-2 mb-2">
              <span
                className={`text-3xl font-black tracking-tight ${
                  activeDefects.length > 0 ? "text-red-400" : "text-emerald-400"
                }`}
              >
                {activeDefects.length}
              </span>
              <span className="text-xs text-slate-400">Aktif Kusur Bildirimi</span>
            </div>

            <div className="mt-3 p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/60 flex items-center justify-between text-xs">
              <span className="text-slate-400">Uygulanan Ceza:</span>
              <strong className="text-red-400 font-bold">
                ₺{totalPenalties.toLocaleString("tr-TR")}
              </strong>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] text-slate-400 flex justify-between items-center">
            <span>{activeDefects.length > 0 ? "Kusurları kapatmak için delil yükleyin" : "Tüm imalatlar onaylı"}</span>
            <Link href="/admin/bim" className="text-cyan-400 hover:underline font-semibold">
              3D İncele →
            </Link>
          </div>
        </div>

        {/* Kart 3: Bekleyen Hakediş Onay Durumu */}
        <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Hakediş Onay Durumu
              </span>
              <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
                <Wallet className="w-4 h-4" />
              </div>
            </div>

            <div className="flex items-baseline gap-2 mb-2">
              <span className="text-3xl font-black text-emerald-400 tracking-tight">
                ₺{totalPendingHakedis.toLocaleString("tr-TR")}
              </span>
            </div>
            <p className="text-xs text-slate-400">
              {pendingApprovals.length > 0
                ? `${pendingApprovals.length} adet onay bekleyen hakediş talebiniz var`
                : "Bekleyen hakediş onayı yok"}
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] flex justify-between items-center">
            <span className="text-amber-400 font-medium flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              Yönetici İncelemesinde
            </span>
            <Link href="/admin/subcontractor-inspections" className="text-emerald-400 hover:underline font-semibold">
              Detay →
            </Link>
          </div>
        </div>
      </div>

      {/* Detay Tabloları (2 Sütunlu Grid) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Sol Sütun: Atanmış İş Paketleri */}
        <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Layers className="w-4.5 h-4.5 text-blue-400" />
              <span>Atanmış İş Paketleri & Metrajlar</span>
            </h2>
            <span className="text-xs text-slate-400">{workPackages.length} Kalem</span>
          </div>

          {workPackages.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-10">Henüz atanmış bir iş paketi bulunmuyor.</p>
          ) : (
            <div className="space-y-3">
              {workPackages.slice(0, 5).map((wp) => {
                const pct =
                  wp.plannedQuantity > 0
                    ? Math.round((wp.completedQuantity / wp.plannedQuantity) * 100)
                    : 0

                return (
                  <div
                    key={wp.id}
                    className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/60 space-y-2 hover:border-slate-600 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 min-w-0">
                        {wp.pozNo && (
                          <span className="px-2 py-0.5 rounded bg-slate-800 text-cyan-300 font-mono text-[10px] border border-slate-700 shrink-0">
                            {wp.pozNo}
                          </span>
                        )}
                        <span className="font-bold text-xs text-white truncate">{wp.name}</span>
                      </div>
                      <span className="text-xs font-bold text-blue-400">%{pct}</span>
                    </div>

                    <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-blue-500 h-full rounded-full"
                        style={{ width: `${Math.min(pct, 100)}%` }}
                      />
                    </div>

                    <div className="flex justify-between text-[11px] text-slate-400">
                      <span>
                        Tamamlanan: {wp.completedQuantity} {wp.unit || "m3"}
                      </span>
                      <span>
                        Planlanan: {wp.plannedQuantity} {wp.unit || "m3"}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Sağ Sütun: Kesilmiş 3D BIM Kusurları & Cezalar */}
        <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <ShieldAlert className="w-4.5 h-4.5 text-red-400" />
              <span>3D BIM Kusur Bildirimleri & Cezalar</span>
            </h2>
            <Link href="/admin/bim" className="text-xs text-cyan-400 hover:underline">
              3D Sahada Gör →
            </Link>
          </div>

          {bimIssues.length === 0 ? (
            <div className="text-center py-10 space-y-2">
              <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
              <p className="text-xs font-bold text-slate-200">Kusur veya ceza kaydı bulunmuyor.</p>
              <p className="text-[11px] text-slate-500">Tüm saha kontrolleri ve 3D imalat standartları kusursuz.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {bimIssues.slice(0, 5).map((issue) => (
                <div
                  key={issue.id}
                  className="p-4 rounded-xl bg-red-950/20 border border-red-500/30 flex items-center justify-between gap-4 text-xs"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-red-300 truncate">{issue.title}</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-red-500/20 text-red-400 border border-red-500/30">
                        {issue.severity || "Kusur"}
                      </span>
                    </div>
                    {issue.description && (
                      <p className="text-slate-400 text-xs mt-1 line-clamp-1">{issue.description}</p>
                    )}
                    {issue.penaltyAmount && (
                      <p className="text-xs font-bold text-red-400 mt-1">
                        Ceza: ₺{issue.penaltyAmount.toLocaleString("tr-TR")}
                      </p>
                    )}
                  </div>

                  <Link
                    href="/admin/subcontractor-inspections"
                    className="px-3 py-1.5 bg-orange-600 hover:bg-orange-500 text-white rounded-lg text-xs font-semibold transition-colors shrink-0 flex items-center gap-1 shadow-sm"
                  >
                    <span>Delil Sun</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
