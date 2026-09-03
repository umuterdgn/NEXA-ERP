"use client"
/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * This code is the property of NXA Software.
 */

import { useState } from "react"
import { toast } from "react-hot-toast"
import { PieChart, TrendingDown, AlertTriangle, Mail, Send, CheckCircle, Clock } from "lucide-react"

interface CompanyRisk {
  id: string
  name: string
  pendingBalance: number
  lastPaymentDate: string
  riskScore: number
  prediction: string
}

export default function CollectionRiskPage() {
  const [sendingReminder, setSendingReminder] = useState<string | null>(null)

  const summaryData = {
    totalRisk: 1250000,
    highRiskCount: 4,
    averageDelay: 14
  }

  const companies: CompanyRisk[] = [
    {
      id: "1",
      name: "Yılmaz İnşaat A.Ş.",
      pendingBalance: 450000,
      lastPaymentDate: "2024-08-10",
      riskScore: 85,
      prediction: "Son 3 hakediş ödemesi ortalama 21 gün gecikti. Nakit akışı problemi şüphesi."
    },
    {
      id: "2",
      name: "Kaya Yapı Ltd. Şti.",
      pendingBalance: 320000,
      lastPaymentDate: "2024-08-15",
      riskScore: 45,
      prediction: "Ödemeleri genellikle ay sonuna sarkıtıyor, ancak temerrüde düşmüyor."
    },
    {
      id: "3",
      name: "Demir Grup İnşaat",
      pendingBalance: 280000,
      lastPaymentDate: "2024-08-05",
      riskScore: 90,
      prediction: "Son 6 ayda 2 kez temerrüde düştü. Yasal takip riski yüksek."
    },
    {
      id: "4",
      name: "Öztürk Mühendislik",
      pendingBalance: 150000,
      lastPaymentDate: "2024-08-20",
      riskScore: 10,
      prediction: "Ödemelerini vadesinden ortalama 2 gün önce yapıyor."
    },
    {
      id: "5",
      name: "Can Yapı Sanayi",
      pendingBalance: 50000,
      lastPaymentDate: "2024-08-18",
      riskScore: 30,
      prediction: "Düzenli ödeme alışkanlığı var, ancak son ödeme 5 gün gecikti."
    }
  ]

  const handleSendReminder = async (companyId: string, companyName: string) => {
    setSendingReminder(companyId)
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    toast.success(`${companyName} için vade hatırlatıcı gönderildi`)
    setSendingReminder(null)
  }

  const getRiskColor = (score: number) => {
    if (score >= 70) return "red"
    if (score >= 40) return "orange"
    return "green"
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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
  }

  return (
    <div className="lg:mt-0 mt-16">
      <div className="mb-6">
        <h1 className="text-2xl lg:text-3xl font-bold text-white flex items-center gap-3">
          <PieChart className="w-8 h-8 text-blue-400" />
          Tahsilat Risk AI
        </h1>
        <p className="text-slate-400 mt-1">Finansal erken uyarı ve risk analizi</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-gradient-to-br from-red-500/10 to-red-600/5 rounded-xl border border-red-500/30 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-red-500/20 rounded-xl flex items-center justify-center">
              <TrendingDown className="w-6 h-6 text-red-400" />
            </div>
            <span className="text-red-400 text-sm font-medium">Riskli Alacak</span>
          </div>
          <h3 className="text-3xl font-bold text-white mb-1">{formatCurrency(summaryData.totalRisk)}</h3>
          <p className="text-slate-400 text-sm">Toplam Riskli Alacak</p>
        </div>

        <div className="bg-gradient-to-br from-orange-500/10 to-orange-600/5 rounded-xl border border-orange-500/30 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-orange-500/20 rounded-xl flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-orange-400" />
            </div>
            <span className="text-orange-400 text-sm font-medium">Yüksek Risk</span>
          </div>
          <h3 className="text-3xl font-bold text-white mb-1">{summaryData.highRiskCount}</h3>
          <p className="text-slate-400 text-sm">Yüksek Riskli Cari Sayısı</p>
        </div>

        <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 rounded-xl border border-blue-500/30 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
              <Clock className="w-6 h-6 text-blue-400" />
            </div>
            <span className="text-blue-400 text-sm font-medium">AI Tahmin</span>
          </div>
          <h3 className="text-3xl font-bold text-white mb-1">+{summaryData.averageDelay} Gün</h3>
          <p className="text-slate-400 text-sm">AI Tahmini Ortalama Gecikme</p>
        </div>
      </div>

      {/* Risk Table */}
      <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
        <div className="p-6 border-b border-slate-800">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <PieChart className="w-5 h-5 text-blue-400" />
            Yapay Zeka Risk Analizi
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-800">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-medium text-slate-300">Müteahhit/Firma Adı</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-slate-300">Bekleyen Bakiye</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-slate-300">Son Ödeme Tarihi</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-slate-300">AI Risk Skoru</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-slate-300">AI Öngörüsü</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-slate-300">İşlemler</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {companies.map((company) => (
                <tr key={company.id} className="hover:bg-slate-800/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="text-white font-medium">{company.name}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-slate-300 font-medium">{formatCurrency(company.pendingBalance)}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-slate-400">{formatDate(company.lastPaymentDate)}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              getRiskColor(company.riskScore) === "red"
                                ? "bg-red-500"
                                : getRiskColor(company.riskScore) === "orange"
                                ? "bg-orange-500"
                                : "bg-green-500"
                            }`}
                            style={{ width: `${company.riskScore}%` }}
                          />
                        </div>
                        <span className="text-slate-400 text-sm font-medium">{company.riskScore}%</span>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getRiskBadge(company.riskScore)}`}>
                        {getRiskLabel(company.riskScore)}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-slate-400 text-sm max-w-xs">{company.prediction}</p>
                  </td>
                  <td className="px-6 py-4">
                    {company.riskScore >= 70 && (
                      <button
                        onClick={() => handleSendReminder(company.id, company.name)}
                        disabled={sendingReminder === company.id}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors flex items-center gap-2 text-sm disabled:opacity-50"
                      >
                        {sendingReminder === company.id ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            Gönderiliyor...
                          </>
                        ) : (
                          <>
                            <Send className="w-4 h-4" />
                            Hatırlatıcı Gönder
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

      {/* Info Banner */}
      <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
        <div className="flex items-start gap-3">
          <PieChart className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="text-blue-400 font-medium mb-1">AI Risk Analizi</h4>
            <p className="text-slate-400 text-sm">
              Bu tahminler yapay zeka tarafından geçmiş ödeme alışkanlıklarına dayalı olarak hesaplanmıştır. 
              Yüksek riskli cariler için otomatik vade hatırlatıcıları göndererek tahsilat oranlarını artırabilirsiniz.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
