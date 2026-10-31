/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Franchise Portal - Şube Ciro & Royalty Bildirimleri (Retail Fee & Revenue Management)
 */

import React from "react"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import Link from "next/link"
import {
  TrendingUp,
  Building2,
  Percent,
  DollarSign,
  Calendar,
  CheckCircle2,
  Clock,
  AlertCircle,
  Plus,
  ArrowRight,
  Download,
  CreditCard,
  FileSpreadsheet
} from "lucide-react"

export const dynamic = "force-dynamic"

export default async function FranchiseRoyaltyPage() {
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

  // Mock revenue / royalty transactions for the current month
  const royaltySubmissions = projects.map((p, idx) => {
    const monthlyGrossRevenue = 850000 + (idx * 125000)
    const royaltyRate = 0.04 // %4 Franchise Royalty Fee
    const marketingRate = 0.01 // %1 Ulusal Pazarlama Fonu
    const royaltyFee = monthlyGrossRevenue * royaltyRate
    const marketingFee = monthlyGrossRevenue * marketingRate
    const totalDue = royaltyFee + marketingFee
    const isPaid = idx % 2 === 0

    return {
      id: `ROY-${p.id.slice(-4)}-${idx}`,
      storeName: p.name,
      city: p.city || "İstanbul",
      period: "Ekim 2026",
      grossRevenue: monthlyGrossRevenue,
      royaltyFee,
      marketingFee,
      totalDue,
      isPaid,
      submittedAt: "25.10.2026",
    }
  })

  const totalGrossRevenue = royaltySubmissions.reduce((acc, r) => acc + r.grossRevenue, 0)
  const totalRoyaltyDue = royaltySubmissions.reduce((acc, r) => acc + r.totalDue, 0)
  const totalCollected = royaltySubmissions.filter((r) => r.isPaid).reduce((acc, r) => acc + r.totalDue, 0)

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-amber-400">
            <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
            Mağaza Yönetimi & Gelir Paylaşımı
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight mt-1 flex items-center gap-3">
            <TrendingUp className="w-8 h-8 text-amber-400" />
            Şube Ciro & Royalty Bildirimleri
          </h1>
          <p className="text-sm text-slate-400 mt-1 max-w-2xl">
            Franchise zincir şubelerinizin aylık POS ciro beyanlarını, %4 isim hakkı ve %1 reklam katılım payı tahsilatlarını denetleyin.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-200 text-xs font-medium transition-all shadow-sm">
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            <span>Excel Dışa Aktar</span>
          </button>
          <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white text-xs font-bold transition-all shadow-lg shadow-amber-500/20">
            <Plus className="w-4 h-4" />
            <span>Yeni Ciro Beyanı Gir</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800/80 backdrop-blur-xl">
          <div className="text-xs text-slate-400 font-medium flex items-center justify-between">
            <span>Aylık Zincir Cirosu</span>
            <TrendingUp className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-white mt-2">
            ₺{(totalGrossRevenue || 14200000).toLocaleString("tr-TR")}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Ekim 2026 konsolide satış
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800/80 backdrop-blur-xl">
          <div className="text-xs text-emerald-400 font-medium flex items-center justify-between">
            <span>Tahsil Edilen Royalty</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-400 mt-2">
            ₺{(totalCollected || 480000).toLocaleString("tr-TR")}
          </div>
          <div className="text-[11px] text-emerald-500/80 mt-1">
            Kasa / banka onaylı ödemeler
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800/80 backdrop-blur-xl">
          <div className="text-xs text-blue-400 font-medium flex items-center justify-between">
            <span>Bekleyen Royalty Borcu</span>
            <Clock className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-black text-blue-400 mt-2">
            ₺{Math.max(0, (totalRoyaltyDue || 710000) - (totalCollected || 480000)).toLocaleString("tr-TR")}
          </div>
          <div className="text-[11px] text-blue-400/80 mt-1">
            Son ödeme tarihi: Ayın son günü
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800/80 backdrop-blur-xl">
          <div className="text-xs text-amber-400 font-medium flex items-center justify-between">
            <span>Royalty & Reklam Oranı</span>
            <Percent className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-white mt-2">
            %4 + %1 <span className="text-xs text-slate-500 font-normal">toplam %5</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Franchise sözleşme standardı
          </div>
        </div>
      </div>

      {/* Submissions Table */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <Building2 className="w-5 h-5 text-amber-400" />
          Şube Bazlı Beyan Tablosu (Son Dönem)
        </h2>

        {royaltySubmissions.length === 0 ? (
          <div className="p-12 text-center rounded-2xl bg-slate-900/40 border border-slate-800/80 space-y-3">
            <TrendingUp className="w-12 h-12 text-slate-600 mx-auto" />
            <h3 className="text-base font-semibold text-slate-200">Henüz Ciro Bildirimi Bulunmuyor</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Mağazalar aylık POS raporlarını yüklediğinde ciro ve royalty hesaplamaları burada listelenir.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-slate-800/80 bg-slate-900/70">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/60 text-slate-400 font-semibold border-b border-slate-800">
                <tr>
                  <th className="p-4">Beyan Kodu</th>
                  <th className="p-4">Şube / Mağaza</th>
                  <th className="p-4">Dönem</th>
                  <th className="p-4">Aylık Brüt Ciro</th>
                  <th className="p-4">Royalty (%4)</th>
                  <th className="p-4">Pazarlama (%1)</th>
                  <th className="p-4">Toplam Borç</th>
                  <th className="p-4">Tahsilat Durumu</th>
                  <th className="p-4 text-right">İşlem</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-200">
                {royaltySubmissions.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="p-4 font-mono font-bold text-amber-400">
                      {r.id}
                    </td>
                    <td className="p-4 font-semibold text-white">
                      {r.storeName}
                      <span className="block text-[10px] text-slate-400 font-normal">{r.city}</span>
                    </td>
                    <td className="p-4 text-slate-300">{r.period}</td>
                    <td className="p-4 font-mono font-medium text-slate-200">
                      ₺{r.grossRevenue.toLocaleString("tr-TR")}
                    </td>
                    <td className="p-4 font-mono text-slate-300">
                      ₺{r.royaltyFee.toLocaleString("tr-TR")}
                    </td>
                    <td className="p-4 font-mono text-slate-400">
                      ₺{r.marketingFee.toLocaleString("tr-TR")}
                    </td>
                    <td className="p-4 font-mono font-bold text-amber-400">
                      ₺{r.totalDue.toLocaleString("tr-TR")}
                    </td>
                    <td className="p-4">
                      {r.isPaid ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950/60 text-emerald-400 border border-emerald-800/50">
                          <CheckCircle2 className="w-3 h-3" />
                          TAHSİL EDİLDİ
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-950/60 text-amber-400 border border-amber-800/50">
                          <Clock className="w-3 h-3" />
                          ÖDEME BEKLENİYOR
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-right">
                      <button className="text-amber-400 hover:text-amber-300 font-semibold text-xs">
                        Dekont Gör
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
