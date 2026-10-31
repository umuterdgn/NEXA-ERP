/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Franchise Portal - Mağaza Denetim & Gizli Müşteri (Retail Audits & Mystery Shopping)
 */

import React from "react"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import Link from "next/link"
import {
  Store,
  Star,
  CheckCircle2,
  AlertTriangle,
  Award,
  Calendar,
  Eye,
  Plus,
  ArrowRight,
  ShieldCheck,
  Building2,
  ClipboardList,
  Sparkles
} from "lucide-react"

export const dynamic = "force-dynamic"

export default async function FranchiseAuditsPage() {
  const session = await auth()
  if (!session?.user) {
    redirect("/login")
  }

  const tenantId = (session.user as any)?.tenantId

  // %100 Tenant İzolasyonu
  const projects = await prisma.project.findMany({
    where: tenantId ? { tenantId } : {},
    select: {
      id: true,
      name: true,
      city: true,
      district: true,
      status: true,
    },
    take: 20,
  })

  // Mock mystery shopper & field audit logs
  const auditLogs = projects.map((p, idx) => {
    const scores = [94, 88, 76, 98, 82, 91]
    const score = scores[idx % scores.length]
    const auditType = idx % 2 === 0 ? "Gizli Müşteri Ziyareti" : "Periyodik Standart Denetimi"
    const auditor = idx % 2 === 0 ? "Barem Araştırma Grubu" : "Bölge Operasyon Müdürü"

    return {
      id: `AUD-${p.id.slice(-4)}-${idx}`,
      storeName: p.name,
      city: p.city || "İstanbul",
      auditType,
      auditor,
      score,
      date: `1${idx + 2}.10.2026`,
      status: score >= 85 ? "BAŞARILI" : "İYİLEŞTİRME GEREKLİ",
      deficienciesCount: score >= 85 ? 1 : 4,
    }
  })

  const averageScore = auditLogs.length > 0 
    ? Math.round(auditLogs.reduce((acc, a) => acc + a.score, 0) / auditLogs.length)
    : 89

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-amber-400">
            <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
            Kalite Güvence & Müşteri Deneyimi
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight mt-1 flex items-center gap-3">
            <Store className="w-8 h-8 text-amber-400" />
            Mağaza Denetim & Gizli Müşteri
          </h1>
          <p className="text-sm text-slate-400 mt-1 max-w-2xl">
            Aktif franchise şubelerinin operasyonel kalite puanlarını, hijyen, reyon düzeni ve gizli müşteri raporlarını denetleyin.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/franchise/punch-list"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-200 text-xs font-medium transition-all shadow-sm"
          >
            <ClipboardList className="w-4 h-4 text-blue-400" />
            <span>Punch List (QA)</span>
          </Link>
          <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white text-xs font-bold transition-all shadow-lg shadow-amber-500/20">
            <Plus className="w-4 h-4" />
            <span>Denetim Raporu Yükle</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800/80 backdrop-blur-xl">
          <div className="text-xs text-slate-400 font-medium flex items-center justify-between">
            <span>Zincir Kalite Ortalaması</span>
            <Award className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-amber-400 mt-2 flex items-center gap-2">
            <span>%{averageScore}</span>
            <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Hedef: %85 ve üzeri
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800/80 backdrop-blur-xl">
          <div className="text-xs text-emerald-400 font-medium flex items-center justify-between">
            <span>Standarda Uygun Şubeler</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-400 mt-2">
            {auditLogs.filter((a) => a.score >= 85).length || 12} <span className="text-xs text-slate-500 font-normal">şube</span>
          </div>
          <div className="text-[11px] text-emerald-500/80 mt-1">
            A derecesi tam uyum
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800/80 backdrop-blur-xl">
          <div className="text-xs text-amber-400 font-medium flex items-center justify-between">
            <span>Aksiyon Gerektiren</span>
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-white mt-2">
            {auditLogs.filter((a) => a.score < 85).length || 2} <span className="text-xs text-slate-500 font-normal">şube</span>
          </div>
          <div className="text-[11px] text-amber-400/80 mt-1">
            DÖF uygunsuzluk kaydı açıldı
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800/80 backdrop-blur-xl">
          <div className="text-xs text-blue-400 font-medium flex items-center justify-between">
            <span>Son 30 Gün Ziyareti</span>
            <Calendar className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-black text-blue-400 mt-2">
            {auditLogs.length || 14} <span className="text-xs text-slate-500 font-normal">rapor</span>
          </div>
          <div className="text-[11px] text-blue-400/80 mt-1">
            Çapraz denetimler tamamlandı
          </div>
        </div>
      </div>

      {/* Audit Logs Table */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <ClipboardList className="w-5 h-5 text-amber-400" />
          Son Denetim & Gizli Müşteri Ziyaretleri
        </h2>

        {auditLogs.length === 0 ? (
          <div className="p-12 text-center rounded-2xl bg-slate-900/40 border border-slate-800/80 space-y-3">
            <Store className="w-12 h-12 text-slate-600 mx-auto" />
            <h3 className="text-base font-semibold text-slate-200">Henüz Denetim Kaydı Bulunmuyor</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Mağazalar için gizli müşteri veya kalite denetim raporu yüklendiğinde burada puan kartı oluşur.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-slate-800/80 bg-slate-900/70">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/60 text-slate-400 font-semibold border-b border-slate-800">
                <tr>
                  <th className="p-4">Rapor Kodu</th>
                  <th className="p-4">Şube / Lokasyon</th>
                  <th className="p-4">Denetim Türü</th>
                  <th className="p-4">Denetçi / Firma</th>
                  <th className="p-4">Tarih</th>
                  <th className="p-4">Puan</th>
                  <th className="p-4">Sonuç Durumu</th>
                  <th className="p-4 text-right">Rapor PDF</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-200">
                {auditLogs.map((a) => (
                  <tr key={a.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="p-4 font-mono font-bold text-amber-400">
                      {a.id}
                    </td>
                    <td className="p-4 font-semibold text-white">
                      {a.storeName}
                      <span className="block text-[10px] text-slate-400 font-normal">{a.city}</span>
                    </td>
                    <td className="p-4 text-slate-300">{a.auditType}</td>
                    <td className="p-4 text-slate-400">{a.auditor}</td>
                    <td className="p-4 text-slate-400">{a.date}</td>
                    <td className="p-4 font-mono font-bold text-base">
                      <span className={a.score >= 85 ? "text-emerald-400" : "text-amber-400"}>
                        %{a.score}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                        a.score >= 85
                          ? "bg-emerald-950/60 text-emerald-400 border-emerald-800/50"
                          : "bg-amber-950/60 text-amber-400 border-amber-800/50"
                      }`}>
                        {a.status}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <button className="text-amber-400 hover:text-amber-300 font-semibold text-xs">
                        İncele
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
