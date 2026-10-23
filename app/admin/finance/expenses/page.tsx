"use client"
/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Finans Karargahı: Personel Masraf ve Fiş Onay Masası (/admin/finance/expenses)
 */

import { useState, useEffect } from "react"
import Link from "next/link"
import {
  Receipt,
  CheckCircle2,
  XCircle,
  Clock,
  Fuel,
  Hammer,
  Utensils,
  Eye,
  Filter,
  DollarSign,
  Building2,
  RefreshCw,
  Search,
  CheckCheck,
  CreditCard,
  AlertCircle,
  FileText,
  User,
} from "lucide-react"

interface ExpenseClaim {
  id: string
  userId: string
  projectId: string | null
  expenseType: string
  amount: number
  receiptUrl: string
  description: string | null
  status: "PENDING" | "APPROVED" | "REJECTED" | "PAID" | string
  createdAt: string
  user: {
    name: string
    email: string
    role: string
  }
}

const TYPE_CONFIG: Record<string, { label: string; icon: any; color: string }> = {
  FUEL: { label: "Yakıt (Mazot)", icon: Fuel, color: "text-amber-400" },
  MATERIAL: { label: "Acil Nalburiye & Malzeme", icon: Hammer, color: "text-blue-400" },
  FOOD: { label: "Yemek & Kumanya", icon: Utensils, color: "text-emerald-400" },
}

export default function AdminFinanceExpensesPage() {
  const [expenses, setExpenses] = useState<ExpenseClaim[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<string>("ALL")
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedReceipt, setSelectedReceipt] = useState<string | null>(null)
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null)

  const fetchExpenses = async () => {
    try {
      setLoading(true)
      const res = await fetch("/api/finance/expenses")
      const data = await res.json()
      if (data.expenses) {
        setExpenses(data.expenses)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchExpenses()
  }, [])

  // Update Status action
  const handleUpdateStatus = async (claimId: string, status: "APPROVED" | "REJECTED" | "PAID") => {
    try {
      setActionLoadingId(claimId)
      const res = await fetch("/api/finance/expenses", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ claimId, status }),
      })

      if (res.ok) {
        // Optimistic update
        setExpenses((prev) =>
          prev.map((e) => (e.id === claimId ? { ...e, status } : e))
        )
      }
    } catch (err) {
      console.error(err)
      fetchExpenses()
    } finally {
      setActionLoadingId(null)
    }
  }

  // Filtered list
  const filtered = expenses.filter((e) => {
    const matchesTab = activeTab === "ALL" || e.status === activeTab
    const q = searchQuery.toLowerCase()
    const matchesQuery =
      e.user?.name?.toLowerCase().includes(q) ||
      e.description?.toLowerCase().includes(q) ||
      e.expenseType?.toLowerCase().includes(q)
    return matchesTab && matchesQuery
  })

  // Metrics
  const totalClaimsCount = expenses.length
  const totalAmount = expenses.reduce((s, e) => s + (e.amount || 0), 0)

  const pendingClaims = expenses.filter((e) => e.status === "PENDING")
  const pendingAmount = pendingClaims.reduce((s, e) => s + (e.amount || 0), 0)

  const paidClaims = expenses.filter((e) => e.status === "PAID")
  const paidAmount = paidClaims.reduce((s, e) => s + (e.amount || 0), 0)

  const approvedClaims = expenses.filter((e) => e.status === "APPROVED")
  const approvedAmount = approvedClaims.reduce((s, e) => s + (e.amount || 0), 0)

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 mb-1">
            <DollarSign className="w-4 h-4" />
            <span>Finans & Muhasebe Masası</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            Personel Masraf & Fiş Onay Masası
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Saha mühendislerinden gelen yakıt, nalburiye ve yemek harcama fişlerini inceleyip tek tıkla "Onayla ve Öde" talimatı verin.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            href="/admin/finance"
            className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-medium transition-colors"
          >
            Finans Paneline Dön
          </Link>

          <button
            onClick={fetchExpenses}
            disabled={loading}
            className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
            title="Yenile"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4.5 shadow-sm">
          <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center justify-between">
            <span>Toplam Masraf Bildirimi</span>
            <Receipt className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white mt-2 font-mono">
            {totalAmount.toLocaleString("tr-TR", { minimumFractionDigits: 2 })} ₺
          </div>
          <div className="text-[11px] text-slate-500 mt-1">{totalClaimsCount} Adet Talep</div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4.5 shadow-sm">
          <div className="text-xs text-amber-600 dark:text-amber-400 flex items-center justify-between">
            <span>Onay Bekleyen</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-2 font-mono">
            {pendingAmount.toLocaleString("tr-TR", { minimumFractionDigits: 2 })} ₺
          </div>
          <div className="text-[11px] text-slate-500 mt-1">{pendingClaims.length} Fiş İncelemede</div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4.5 shadow-sm">
          <div className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center justify-between">
            <span>Ödenen & Kapanan</span>
            <CheckCheck className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-2 font-mono">
            {paidAmount.toLocaleString("tr-TR", { minimumFractionDigits: 2 })} ₺
          </div>
          <div className="text-[11px] text-slate-500 mt-1">{paidClaims.length} Fiş Hesaba Geçti</div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4.5 shadow-sm">
          <div className="text-xs text-blue-600 dark:text-blue-400 flex items-center justify-between">
            <span>Onaylanan (Ödeme Sırasında)</span>
            <CreditCard className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-2 font-mono">
            {approvedAmount.toLocaleString("tr-TR", { minimumFractionDigits: 2 })} ₺
          </div>
          <div className="text-[11px] text-slate-500 mt-1">{approvedClaims.length} Fiş Sıraya Alındı</div>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3">
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          <button
            onClick={() => setActiveTab("ALL")}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
              activeTab === "ALL"
                ? "bg-blue-600 text-white font-bold"
                : "text-slate-600 dark:text-slate-400 hover:text-white"
            }`}
          >
            Tümü ({expenses.length})
          </button>
          <button
            onClick={() => setActiveTab("PENDING")}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
              activeTab === "PENDING"
                ? "bg-amber-600 text-white font-bold"
                : "text-slate-600 dark:text-slate-400 hover:text-white"
            }`}
          >
            Bekleyenler ({pendingClaims.length})
          </button>
          <button
            onClick={() => setActiveTab("APPROVED")}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
              activeTab === "APPROVED"
                ? "bg-blue-600 text-white font-bold"
                : "text-slate-600 dark:text-slate-400 hover:text-white"
            }`}
          >
            Onaylananlar ({approvedClaims.length})
          </button>
          <button
            onClick={() => setActiveTab("PAID")}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
              activeTab === "PAID"
                ? "bg-emerald-600 text-white font-bold"
                : "text-slate-600 dark:text-slate-400 hover:text-white"
            }`}
          >
            Ödenenler ({paidClaims.length})
          </button>
          <button
            onClick={() => setActiveTab("REJECTED")}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
              activeTab === "REJECTED"
                ? "bg-red-600 text-white font-bold"
                : "text-slate-600 dark:text-slate-400 hover:text-white"
            }`}
          >
            Reddedilenler ({expenses.filter((e) => e.status === "REJECTED").length})
          </button>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Personel veya açıklama ara..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      {/* Expense Claims Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/75 dark:bg-slate-950/60 text-slate-500 dark:text-slate-400 uppercase font-semibold text-[11px]">
                <th className="py-3 px-4">Personel / Mühendis</th>
                <th className="py-3 px-4">Masraf Türü</th>
                <th className="py-3 px-4">Açıklama</th>
                <th className="py-3 px-4">Tutar (₺)</th>
                <th className="py-3 px-4">Fiş / Fatura</th>
                <th className="py-3 px-4">Tarih</th>
                <th className="py-3 px-4">Durum</th>
                <th className="py-3 px-4 text-right">Karar / Aksiyon</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400 text-xs">
                    Bu kriterlere uygun harcama fişi bulunamadı.
                  </td>
                </tr>
              ) : (
                filtered.map((item) => {
                  const typeCfg = TYPE_CONFIG[item.expenseType] || TYPE_CONFIG.MATERIAL
                  const Icon = typeCfg.icon
                  const isPending = item.status === "PENDING"
                  const isApproved = item.status === "APPROVED"
                  const isPaid = item.status === "PAID"
                  const isRejected = item.status === "REJECTED"

                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      {/* User */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center font-bold text-[10px] text-slate-700 dark:text-slate-300">
                            {item.user?.name ? item.user.name.slice(0, 2).toUpperCase() : "SA"}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 dark:text-white">
                              {item.user?.name || "Bilinmeyen Personel"}
                            </div>
                            <div className="text-[10px] text-slate-400">{item.user?.role}</div>
                          </div>
                        </div>
                      </td>

                      {/* Type */}
                      <td className="py-3 px-4">
                        <span className="flex items-center gap-1.5 font-medium text-slate-800 dark:text-slate-200">
                          <Icon className={`w-3.5 h-3.5 ${typeCfg.color}`} />
                          <span>{typeCfg.label}</span>
                        </span>
                      </td>

                      {/* Description */}
                      <td className="py-3 px-4 max-w-xs">
                        <span className="text-slate-600 dark:text-slate-300 line-clamp-2">
                          {item.description || "-"}
                        </span>
                      </td>

                      {/* Amount */}
                      <td className="py-3 px-4 font-mono font-bold text-slate-900 dark:text-white text-sm">
                        {item.amount.toLocaleString("tr-TR", { minimumFractionDigits: 2 })} ₺
                      </td>

                      {/* Receipt Preview Thumbnail */}
                      <td className="py-3 px-4">
                        {item.receiptUrl ? (
                          <button
                            onClick={() => setSelectedReceipt(item.receiptUrl)}
                            className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400 hover:underline font-semibold"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Fişi İncele</span>
                          </button>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>

                      {/* Date */}
                      <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">
                        {new Date(item.createdAt).toLocaleDateString("tr-TR")}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4">
                        {isPending && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-950/70 border border-amber-800 text-amber-300">
                            ONAY BEKLİYOR
                          </span>
                        )}
                        {isApproved && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-950/70 border border-blue-800 text-blue-300">
                            ONAYLANDI
                          </span>
                        )}
                        {isPaid && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950/70 border border-emerald-800 text-emerald-300">
                            ÖDENDİ
                          </span>
                        )}
                        {isRejected && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-950/70 border border-red-800 text-red-300">
                            REDDEDİLDİ
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {isPending && (
                            <>
                              <button
                                onClick={() => handleUpdateStatus(item.id, "PAID")}
                                disabled={actionLoadingId === item.id}
                                className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] shadow-sm transition-all"
                                title="Hemen onayla ve ödeme yapıldı olarak işaretle"
                              >
                                Onayla & Öde
                              </button>

                              <button
                                onClick={() => handleUpdateStatus(item.id, "APPROVED")}
                                disabled={actionLoadingId === item.id}
                                className="px-2 py-1 rounded-lg bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-medium text-[11px]"
                              >
                                Onayla
                              </button>

                              <button
                                onClick={() => handleUpdateStatus(item.id, "REJECTED")}
                                disabled={actionLoadingId === item.id}
                                className="p-1 rounded text-slate-400 hover:text-red-500"
                                title="Reddet"
                              >
                                <XCircle className="w-4 h-4" />
                              </button>
                            </>
                          )}

                          {isApproved && (
                            <button
                              onClick={() => handleUpdateStatus(item.id, "PAID")}
                              disabled={actionLoadingId === item.id}
                              className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px]"
                            >
                              Ödemeyi Tamamla
                            </button>
                          )}

                          {isPaid && (
                            <span className="text-[11px] text-emerald-500 font-semibold flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Hesaba Geçti</span>
                            </span>
                          )}

                          {isRejected && (
                            <span className="text-[11px] text-red-500 font-semibold">İptal Edildi</span>
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

      {/* Lightbox Receipt Modal */}
      {selectedReceipt && (
        <div
          onClick={() => setSelectedReceipt(null)}
          className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm cursor-pointer"
        >
          <div className="relative max-w-3xl max-h-[85vh] bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden p-2">
            <img
              src={selectedReceipt}
              alt="Fiş / Fatura Görseli"
              className="max-w-full max-h-[80vh] object-contain rounded-xl"
            />
          </div>
        </div>
      )}
    </div>
  )
}
