"use client"
/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Subcontractor Progress Billings (Hakedişlerim) Real-Time Database Page
 */

import React, { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
  DollarSign,
  TrendingUp,
  Clock,
  CheckCircle2,
  FileText,
  Building2,
  Calendar,
  ArrowLeft,
  RefreshCw,
  Eye,
  X,
  Printer,
  Download,
  AlertCircle,
  FileCheck2,
  ShieldCheck
} from "lucide-react"
import { getSubcontractorBillings } from "./actions"
import { toast } from "react-hot-toast"

interface BillingItem {
  id: string
  billingNumber: number
  period: string | Date
  grossAmount: number
  advanceDeduction: number
  penaltyDeduction: number
  retentionDeduction: number
  netPayable: number
  status: string
  createdAt: string | Date
  contract?: {
    id: string
    title: string
    totalAmount: number
    project?: {
      id: string
      name?: string | null
      title?: string | null
    } | null
    subcontractor?: {
      id: string
      name: string
    } | null
  } | null
}

export default function SubcontractorBillingPage() {
  const router = useRouter()
  const [billings, setBillings] = useState<BillingItem[]>([])
  const [companyName, setCompanyName] = useState<string>("")
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<string>("ALL")
  const [selectedBilling, setSelectedBilling] = useState<BillingItem | null>(null)

  const loadBillings = async () => {
    setLoading(true)
    try {
      const res = await getSubcontractorBillings()
      if (res.success && res.billings) {
        setBillings(res.billings as any)
        if (res.companyName) setCompanyName(res.companyName)
      } else {
        toast.error("Hakediş kayıtları alınamadı.")
      }
    } catch (err) {
      console.error("Load billings error:", err)
      toast.error("Hakedişler yüklenirken hata oluştu.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadBillings()
  }, [])

  // Dynamic KPI totals calculated strictly from DB records
  const totalGross = billings.reduce((sum, b) => sum + (b.grossAmount || 0), 0)
  const totalPaid = billings
    .filter((b) => b.status === "PAID")
    .reduce((sum, b) => sum + (b.netPayable || b.grossAmount || 0), 0)
  const totalPending = billings
    .filter((b) => b.status === "APPROVED" || b.status === "PENDING_APPROVAL")
    .reduce((sum, b) => sum + (b.netPayable || b.grossAmount || 0), 0)
  const totalDeductions = billings.reduce(
    (sum, b) => sum + (b.advanceDeduction || 0) + (b.retentionDeduction || 0) + (b.penaltyDeduction || 0),
    0
  )

  // Filtered billings
  const filteredBillings = billings.filter((b) => {
    if (activeTab === "ALL") return true
    return b.status === activeTab
  })

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PAID":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Ödendi
          </span>
        )
      case "APPROVED":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
            <ShieldCheck className="w-3.5 h-3.5" />
            Onaylandı (Ödeme Sırasında)
          </span>
        )
      case "PENDING_APPROVAL":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-amber-500/20 text-amber-400 border border-amber-500/30">
            <Clock className="w-3.5 h-3.5" />
            Onay Bekliyor
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-500/20 text-slate-300">
            Taslak
          </span>
        )
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-6 lg:p-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <button
            onClick={() => router.push("/subcontractor")}
            className="flex items-center gap-2 text-sm text-orange-400 hover:text-orange-300 mb-2 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            Portala Dön
          </button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                Hakedişlerim & Finansal Durum
              </h1>
              <p className="text-xs sm:text-sm text-slate-400">
                {companyName ? `${companyName} firmasına` : "Firmanıza"} ait onaylanmış ve ödenmiş hakediş (Progress Billing) kayıtları
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadBillings}
            disabled={loading}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 flex items-center gap-2 transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-orange-400" : ""}`} />
            Yenile
          </button>
        </div>
      </div>

      {/* 4 Financial KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
            <span>Toplam Brüt Hakediş</span>
            <TrendingUp className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-xl sm:text-2xl font-bold text-white font-mono">
            ₺{totalGross.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Gerçekleşen imalat toplamı</p>
        </div>

        <div className="bg-emerald-950/20 border border-emerald-900/40 rounded-2xl p-4">
          <div className="flex items-center justify-between text-emerald-400 text-xs mb-2">
            <span>Tahsil Edilen (Ödenen)</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-xl sm:text-2xl font-bold text-emerald-400 font-mono">
            ₺{totalPaid.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <p className="text-[11px] text-emerald-300/70 mt-1">Hesaba aktarılan tutar</p>
        </div>

        <div className="bg-cyan-950/20 border border-cyan-900/40 rounded-2xl p-4">
          <div className="flex items-center justify-between text-cyan-400 text-xs mb-2">
            <span>Onayda / Bekleyen</span>
            <Clock className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-xl sm:text-2xl font-bold text-cyan-400 font-mono">
            ₺{totalPending.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <p className="text-[11px] text-cyan-300/70 mt-1">Ödeme emri bekleyen</p>
        </div>

        <div className="bg-red-950/20 border border-red-900/40 rounded-2xl p-4">
          <div className="flex items-center justify-between text-red-400 text-xs mb-2">
            <span>Toplam Kesintiler</span>
            <FileText className="w-4 h-4 text-red-400" />
          </div>
          <div className="text-xl sm:text-2xl font-bold text-red-400 font-mono">
            ₺{totalDeductions.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <p className="text-[11px] text-red-300/70 mt-1">Avans + Teminat stopajı</p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 mb-4">
        {[
          { id: "ALL", label: "Tüm Hakedişler" },
          { id: "APPROVED", label: "Onaylananlar" },
          { id: "PAID", label: "Ödenenler" },
          { id: "PENDING_APPROVAL", label: "Onay Bekleyenler" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition ${
              activeTab === tab.id
                ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/30"
                : "bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Real DataGrid */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 uppercase tracking-wider font-semibold">
              <tr>
                <th className="px-4 py-3.5">Hakediş No</th>
                <th className="px-4 py-3.5">Proje & Sözleşme</th>
                <th className="px-4 py-3.5">Dönem</th>
                <th className="px-4 py-3.5 text-right">Brüt Tutar</th>
                <th className="px-4 py-3.5 text-right">Kesintiler</th>
                <th className="px-4 py-3.5 text-right font-bold text-emerald-400">Net Ödenecek</th>
                <th className="px-4 py-3.5 text-center">Durum</th>
                <th className="px-4 py-3.5 text-center">İşlem</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin text-orange-400 mx-auto mb-2" />
                    Hakediş verileri yükleniyor...
                  </td>
                </tr>
              ) : filteredBillings.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-slate-400">
                    <FileCheck2 className="w-10 h-10 text-slate-600 mx-auto mb-2" />
                    Kriterlere uygun hakediş kaydı bulunamadı.
                  </td>
                </tr>
              ) : (
                filteredBillings.map((b) => {
                  const deductions =
                    (b.advanceDeduction || 0) + (b.retentionDeduction || 0) + (b.penaltyDeduction || 0)

                  return (
                    <tr
                      key={b.id}
                      className="hover:bg-slate-800/40 transition group cursor-pointer"
                      onClick={() => setSelectedBilling(b)}
                    >
                      <td className="px-4 py-3.5 font-mono font-bold text-orange-400">
                        #{b.billingNumber || 1}
                      </td>

                      <td className="px-4 py-3.5">
                        <div className="font-semibold text-white group-hover:text-orange-400 transition">
                          {b.contract?.project?.name || b.contract?.project?.title || "Merkez Proje"}
                        </div>
                        <div className="text-[11px] text-slate-400 line-clamp-1">
                          {b.contract?.title || "Taşeron İmalat Sözleşmesi"}
                        </div>
                      </td>

                      <td className="px-4 py-3.5 text-slate-300">
                        {new Date(b.period).toLocaleDateString("tr-TR", {
                          month: "long",
                          year: "numeric"
                        })}
                      </td>

                      <td className="px-4 py-3.5 text-right font-mono text-slate-200">
                        ₺{b.grossAmount.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                      </td>

                      <td className="px-4 py-3.5 text-right font-mono text-red-400">
                        -₺{deductions.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                      </td>

                      <td className="px-4 py-3.5 text-right font-mono font-bold text-emerald-400 text-sm">
                        ₺{b.netPayable.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                      </td>

                      <td className="px-4 py-3.5 text-center">
                        {getStatusBadge(b.status)}
                      </td>

                      <td className="px-4 py-3.5 text-center">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            setSelectedBilling(b)
                          }}
                          className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 inline-flex items-center gap-1 transition"
                        >
                          <Eye className="w-3.5 h-3.5 text-orange-400" />
                          İncele
                        </button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detailed Billing Sheet Modal */}
      {selectedBilling && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-orange-500/20 text-orange-400 flex items-center justify-center font-bold text-sm">
                  #{selectedBilling.billingNumber}
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    Hakediş İcmal & Kesinti Cetveli
                  </h3>
                  <p className="text-xs text-slate-400">
                    Dönem: {new Date(selectedBilling.period).toLocaleDateString("tr-TR", { month: "long", year: "numeric" })}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedBilling(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Project Details */}
            <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Şantiye Projesi:</span>
                <span className="text-white font-medium">
                  {selectedBilling.contract?.project?.name || "Merkez Proje"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Sözleşme:</span>
                <span className="text-white font-medium">{selectedBilling.contract?.title || "-"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Durum:</span>
                <div>{getStatusBadge(selectedBilling.status)}</div>
              </div>
            </div>

            {/* Financial Calculations breakdown */}
            <div className="space-y-2 text-xs">
              <div className="flex justify-between items-center py-1.5 border-b border-slate-800">
                <span className="text-slate-300 font-medium">1. Brüt İmalat Tutarı (A)</span>
                <span className="font-mono font-bold text-white text-sm">
                  ₺{selectedBilling.grossAmount.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                </span>
              </div>

              <div className="flex justify-between items-center py-1.5 text-red-400">
                <span>- Avans Mahsubu Kesintisi</span>
                <span className="font-mono">
                  -₺{(selectedBilling.advanceDeduction || 0).toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                </span>
              </div>

              <div className="flex justify-between items-center py-1.5 text-red-400">
                <span>- Nakit Teminat Stopajı (%5)</span>
                <span className="font-mono">
                  -₺{(selectedBilling.retentionDeduction || 0).toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                </span>
              </div>

              {(selectedBilling.penaltyDeduction || 0) > 0 && (
                <div className="flex justify-between items-center py-1.5 text-red-400">
                  <span>- İSG / Teknik Ceza Kesintisi</span>
                  <span className="font-mono">
                    -₺{selectedBilling.penaltyDeduction.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                  </span>
                </div>
              )}

              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 flex justify-between items-center mt-3">
                <div>
                  <div className="text-[11px] text-emerald-400 font-medium">Net Ödenecek Hakediş Tutarı</div>
                  <div className="text-[10px] text-slate-400">Banka hesabına aktarılacak miktar</div>
                </div>
                <div className="text-lg font-bold font-mono text-emerald-400">
                  ₺{selectedBilling.netPayable.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => window.print()}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 flex items-center gap-2 transition"
              >
                <Printer className="w-3.5 h-3.5" />
                Yazdır / PDF
              </button>
              <button
                type="button"
                onClick={() => setSelectedBilling(null)}
                className="px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-semibold transition"
              >
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
