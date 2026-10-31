"use client"
/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Collection Risk AI Page connected to real database with strict tenant isolation
 */

import { useState, useEffect } from "react"
import { toast } from "react-hot-toast"
import { PieChart, TrendingDown, AlertTriangle, Send, Clock, RefreshCw, CheckCircle2 } from "lucide-react"

interface CompanyRisk {
  id: string
  name: string
  pendingBalance: number
  lastPaymentDate: string
  riskScore: number
  prediction: string
}

interface SummaryData {
  totalRisk: number
  highRiskCount: number
  averageDelay: number
}

export default function CollectionRiskPage() {
  const [companies, setCompanies] = useState<CompanyRisk[]>([])
  const [summaryData, setSummaryData] = useState<SummaryData>({
    totalRisk: 0,
    highRiskCount: 0,
    averageDelay: 0,
  })
  const [loading, setLoading] = useState(true)
  const [sendingReminder, setSendingReminder] = useState<string | null>(null)

  const fetchData = async () => {
    try {
      setLoading(true)
      const res = await fetch("/api/admin/collection-risk")
      const data = await res.json()
      if (data.companies) setCompanies(data.companies)
      if (data.summaryData) setSummaryData(data.summaryData)
    } catch (err) {
      console.error("Risk verileri alınamadı:", err)
      toast.error("Tahsilat risk verileri yüklenirken bir hata oluştu")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleSendReminder = async (companyId: string, companyName: string) => {
    setSendingReminder(companyId)
    try {
      const res = await fetch("/api/admin/collection-risk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companyId }),
      })
      if (res.ok) {
        toast.success(`${companyName} için vade hatırlatıcı gönderildi`)
      } else {
        toast.error("Hatırlatıcı gönderilemedi")
      }
    } catch (err) {
      console.error(err)
      toast.error("İşlem gerçekleştirilemedi")
    } finally {
      setSendingReminder(null)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("tr-TR", {
      style: "currency",
      currency: "TRY",
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("tr-TR", {
      day: "numeric",
      month: "short",
      year: "numeric",
    })
  }

  const getRiskBadge = (score: number) => {
    if (score >= 70) return "bg-red-500/20 text-red-400 border-red-500/30"
    if (score >= 40) return "bg-orange-500/20 text-orange-400 border-orange-500/30"
    return "bg-green-500/20 text-green-400 border-green-500/30"
  }

  const getRiskLabel = (score: number) => {
    if (score >= 70) return "Kritik"
    if (score >= 40) return "Orta"
    return "Güvenli"
  }

  return (
    <div className="lg:mt-0 mt-16 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-blue-400 mb-1">
            <PieChart className="w-4 h-4" />
            <span>Finansal Erken Uyarı</span>
          </div>
          <h1 className="text-2xl lg:text-3xl font-bold text-white">
            Tahsilat Risk AI
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Cari borç-alacak dengesi ve öngörülü risk analizi</p>
        </div>

        <button
          onClick={fetchData}
          disabled={loading}
          className="p-2 rounded-lg bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors self-start sm:self-center"
          title="Yenile"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-red-500/10 to-red-600/5 rounded-xl border border-red-500/30 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-red-500/20 rounded-xl flex items-center justify-center">
              <TrendingDown className="w-6 h-6 text-red-400" />
            </div>
            <span className="text-red-400 text-xs font-bold uppercase tracking-wider">Riskli Alacak</span>
          </div>
          <h3 className="text-3xl font-bold text-white mb-1">{formatCurrency(summaryData.totalRisk)}</h3>
          <p className="text-slate-400 text-xs">Toplam Tahsilat Riski</p>
        </div>

        <div className="bg-gradient-to-br from-orange-500/10 to-orange-600/5 rounded-xl border border-orange-500/30 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-orange-500/20 rounded-xl flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-orange-400" />
            </div>
            <span className="text-orange-400 text-xs font-bold uppercase tracking-wider">Yüksek Risk</span>
          </div>
          <h3 className="text-3xl font-bold text-white mb-1">{summaryData.highRiskCount}</h3>
          <p className="text-slate-400 text-xs">Yüksek Riskli Cari Sayısı</p>
        </div>

        <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 rounded-xl border border-blue-500/30 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
              <Clock className="w-6 h-6 text-blue-400" />
            </div>
            <span className="text-blue-400 text-xs font-bold uppercase tracking-wider">AI Tahmin</span>
          </div>
          <h3 className="text-3xl font-bold text-white mb-1">+{summaryData.averageDelay} Gün</h3>
          <p className="text-slate-400 text-xs">AI Tahmini Ortalama Gecikme</p>
        </div>
      </div>

      {/* Risk Table or Empty State */}
      {!loading && companies.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center max-w-xl mx-auto space-y-4 shadow-xl">
          <div className="w-16 h-16 rounded-2xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-center mx-auto text-slate-400 shadow-inner">
            <CheckCircle2 className="w-8 h-8 text-emerald-400" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-white">Tahsilat Riski Taşıyan Cari Bulunmuyor</h3>
            <p className="text-sm text-slate-400">
              Sisteme kayıtlı carilerinize ait vadesi geçmiş veya risk teşkil eden herhangi bir alacak kaydı bulunmamaktadır.
            </p>
          </div>
        </div>
      ) : (
        <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden shadow-sm">
          <div className="p-5 border-b border-slate-800 flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <PieChart className="w-4 h-4 text-blue-400" />
              <span>Yapay Zeka Destekli Cari Tahsilat Analizi</span>
            </h3>
            <span className="text-xs text-slate-400">Toplam {companies.length} Firma</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-slate-950/60 text-slate-400 border-b border-slate-800 text-[11px] uppercase font-semibold">
                <tr>
                  <th className="px-5 py-3.5 text-left">Müteahhit / Firma Adı</th>
                  <th className="px-5 py-3.5 text-left">Bekleyen Bakiye</th>
                  <th className="px-5 py-3.5 text-left">Son İşlem Tarihi</th>
                  <th className="px-5 py-3.5 text-left">AI Risk Skoru</th>
                  <th className="px-5 py-3.5 text-left">AI Tahmin & Öngörü</th>
                  <th className="px-5 py-3.5 text-right">İşlemler</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {companies.map((company) => (
                  <tr key={company.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="px-5 py-4">
                      <div className="text-white font-bold">{company.name}</div>
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-slate-200 font-semibold">{formatCurrency(company.pendingBalance)}</span>
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-slate-400">{formatDate(company.lastPaymentDate)}</span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="space-y-1.5 min-w-[120px]">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${
                                company.riskScore >= 70
                                  ? "bg-red-500"
                                  : company.riskScore >= 40
                                  ? "bg-orange-500"
                                  : "bg-emerald-500"
                              }`}
                              style={{ width: `${company.riskScore}%` }}
                            />
                          </div>
                          <span className="text-slate-400 font-mono text-[10px]">{company.riskScore}%</span>
                        </div>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getRiskBadge(company.riskScore)}`}>
                          {getRiskLabel(company.riskScore)}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <p className="text-slate-300 max-w-sm leading-relaxed">{company.prediction}</p>
                    </td>
                    <td className="px-5 py-4 text-right">
                      {company.riskScore >= 40 && (
                        <button
                          onClick={() => handleSendReminder(company.id, company.name)}
                          disabled={sendingReminder === company.id}
                          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors inline-flex items-center gap-1.5 text-xs font-semibold disabled:opacity-50"
                        >
                          {sendingReminder === company.id ? (
                            <>
                              <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                              <span>Gönderiliyor...</span>
                            </>
                          ) : (
                            <>
                              <Send className="w-3.5 h-3.5" />
                              <span>Hatırlatıcı Gönder</span>
                            </>
                          )}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
