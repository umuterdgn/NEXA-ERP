/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Yatırımcı Portalı - Finansal Özet (Read-Only Executive Finance)
 */

import React from "react"
import { DollarSign, TrendingUp, PieChart, ShieldCheck, CheckCircle2, ArrowUpRight } from "lucide-react"

export const dynamic = "force-dynamic"

export default function InvestorFinancePage() {
  const financialSummary = {
    totalBudget: 48500000,
    realizedSpending: 31525000,
    remainingBudget: 16975000,
    spendingRatio: 65,
    cashflowStatus: "POZİTİF (Nakit Akışı Dengeli)",
  }

  const costBreakdown = [
    { title: "Kaba Yapı & Betonarme", planned: 22000000, actual: 18500000, ratio: 84 },
    { title: "İnce Yapı & Cephe", planned: 14500000, actual: 7200000, ratio: 50 },
    { title: "Mekanik Tesisat & Yangın", planned: 6800000, actual: 3600000, ratio: 53 },
    { title: "Elektrik & Otomasyon", planned: 5200000, actual: 2225000, ratio: 43 },
  ]

  const recentPayments = [
    { id: "HKD-08", period: "Kasım 2026", gross: 2413500, net: 2177825, status: "ONAYLANDI", date: "02.11.2026" },
    { id: "HKD-07", period: "Ekim 2026", gross: 3120000, net: 2840000, status: "ÖDENDİ", date: "01.10.2026" },
    { id: "HKD-06", period: "Eylül 2026", gross: 2850000, net: 2595000, status: "ÖDENDİ", date: "02.09.2026" },
    { id: "HKD-05", period: "Ağustos 2026", gross: 3450000, net: 3140000, status: "ÖDENDİ", date: "01.08.2026" },
  ]

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900 border border-slate-800 p-5 rounded-2xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold">
              Yatırım & Finans
            </span>
            <span className="text-xs text-slate-400 font-mono">• Bütçe & Hakediş İzleme</span>
          </div>
          <h1 className="text-lg sm:text-xl font-bold text-white">
            Finansal Gerçekleşme & Hakediş Özeti
          </h1>
          <p className="text-xs text-slate-400">
            Proje yatırım bütçesi, hakediş ödemeleri ve imalat disiplini bazlı harcama dağılımı
          </p>
        </div>

        <div className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center gap-2 text-xs text-slate-400">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Salt Okunur Finansal Denetim</span>
        </div>
      </div>

      {/* Büyük Metrik Kartları */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-1 font-mono">
          <span className="text-xs text-slate-400 font-sans">Toplam Proje Keşif Bedeli</span>
          <p className="text-2xl sm:text-3xl font-extrabold text-white mt-1">
            {financialSummary.totalBudget.toLocaleString("tr-TR")} ₺
          </p>
          <p className="text-[11px] text-slate-500 font-sans">Sözleşme Kapsamı Tavanı</p>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-1 font-mono">
          <span className="text-xs text-slate-400 font-sans">Kümülatif Hakediş Harcaması</span>
          <p className="text-2xl sm:text-3xl font-extrabold text-emerald-400 mt-1">
            {financialSummary.realizedSpending.toLocaleString("tr-TR")} ₺
          </p>
          <p className="text-[11px] text-emerald-400/80 font-sans flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            Bütçe Tüketimi: %{financialSummary.spendingRatio}
          </p>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-1 font-mono">
          <span className="text-xs text-slate-400 font-sans">Kalan Yatırım Bütçesi</span>
          <p className="text-2xl sm:text-3xl font-extrabold text-blue-400 mt-1">
            {financialSummary.remainingBudget.toLocaleString("tr-TR")} ₺
          </p>
          <p className="text-[11px] text-slate-500 font-sans">Öngörülen Kalan Nakit</p>
        </div>
      </div>

      {/* Disiplin Bazlı Maliyet Dağılımı */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <PieChart className="w-4 h-4 text-indigo-400" />
          <span>İmalat Grupları Bazında Gerçekleşme Oranları</span>
        </h3>

        <div className="space-y-4 font-mono text-xs">
          {costBreakdown.map((item, idx) => (
            <div key={idx} className="space-y-1.5">
              <div className="flex items-center justify-between font-sans">
                <span className="font-semibold text-slate-200">{item.title}</span>
                <span className="text-slate-400 font-mono">
                  {item.actual.toLocaleString("tr-TR")} ₺ / {item.planned.toLocaleString("tr-TR")} ₺ ({item.ratio}%)
                </span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden border border-slate-700/50">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-500"
                  style={{ width: `${item.ratio}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Son Dönem Hakediş Tablosu */}
      <div className="border border-slate-800 rounded-2xl overflow-hidden bg-slate-900/80">
        <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
            Son Dönem Taşeron & İmalat Hakedişleri
          </h4>
          <span className="text-[11px] text-slate-400 font-mono">Merkezi Muhasebe Entegreli</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-950/60 text-slate-400 border-b border-slate-800">
              <tr>
                <th className="px-4 py-3">Hakediş No</th>
                <th className="px-4 py-3">Dönem</th>
                <th className="px-4 py-3 text-right">Brüt Tutar</th>
                <th className="px-4 py-3 text-right">Net Ödenen / Ödenecek</th>
                <th className="px-4 py-3 text-center">Durum</th>
                <th className="px-4 py-3 text-right">Tarih</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {recentPayments.map((p) => (
                <tr key={p.id} className="hover:bg-slate-800/40">
                  <td className="px-4 py-3 font-bold text-blue-400">{p.id}</td>
                  <td className="px-4 py-3 text-white font-sans">{p.period}</td>
                  <td className="px-4 py-3 text-right text-slate-300">
                    {p.gross.toLocaleString("tr-TR")} ₺
                  </td>
                  <td className="px-4 py-3 text-right font-bold text-emerald-400">
                    {p.net.toLocaleString("tr-TR")} ₺
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold">
                      {p.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right text-slate-400">{p.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
