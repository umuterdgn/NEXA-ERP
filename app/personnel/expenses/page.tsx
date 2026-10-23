"use client"
/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Personel Masraf ve Fiş Takip Listesi (/personnel/expenses)
 */

import { useState, useEffect } from "react"
import Link from "next/link"
import {
  Receipt,
  Plus,
  RefreshCw,
  Fuel,
  Hammer,
  Utensils,
  Clock,
  CheckCircle2,
  XCircle,
  CreditCard,
  ExternalLink,
  DollarSign,
  AlertCircle,
  Eye,
} from "lucide-react"

interface ExpenseClaimItem {
  id: string
  expenseType: string
  amount: number
  receiptUrl: string
  description?: string | null
  status: "PENDING" | "APPROVED" | "REJECTED" | "PAID" | string
  createdAt: string
  user?: {
    name: string
  }
}

const TYPE_LABELS: Record<string, { label: string; icon: any; color: string }> = {
  FUEL: { label: "Yakıt (Mazot)", icon: Fuel, color: "text-amber-400" },
  MATERIAL: { label: "Acil Hırdavat & Malzeme", icon: Hammer, color: "text-blue-400" },
  FOOD: { label: "Yemek & Kumanya", icon: Utensils, color: "text-emerald-400" },
}

const STATUS_BADGES: Record<string, { label: string; class: string }> = {
  PENDING: { label: "Onay Bekliyor", class: "bg-amber-950/70 border-amber-800 text-amber-300" },
  APPROVED: { label: "Onaylandı", class: "bg-blue-950/70 border-blue-800 text-blue-300" },
  PAID: { label: "Ödendi (Kapandı)", class: "bg-emerald-950/70 border-emerald-800 text-emerald-300" },
  REJECTED: { label: "Reddedildi", class: "bg-red-950/70 border-red-800 text-red-300" },
}

export default function PersonnelExpensesListPage() {
  const [expenses, setExpenses] = useState<ExpenseClaimItem[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedReceipt, setSelectedReceipt] = useState<string | null>(null)

  const fetchExpenses = async () => {
    try {
      setLoading(true)
      const res = await fetch("/api/finance/expenses?onlyMine=true")
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

  // Metrics
  const totalAmount = expenses.reduce((s, e) => s + (e.amount || 0), 0)
  const pendingAmount = expenses
    .filter((e) => e.status === "PENDING")
    .reduce((s, e) => s + (e.amount || 0), 0)
  const paidAmount = expenses
    .filter((e) => e.status === "PAID")
    .reduce((s, e) => s + (e.amount || 0), 0)

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400 mb-1">
            <Receipt className="w-4 h-4" />
            <span>Saha Personel Harcamaları</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
            Masraf & Yakıt Fişi Bildirimleri
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Şantiyede harcadığınız yakıt ve malzeme fişlerinin onay ve ödeme durumunu canlı takip edin.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchExpenses}
            disabled={loading}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:text-white"
            title="Yenile"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>

          <Link
            href="/personnel/expenses/new"
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-md shadow-blue-600/30"
          >
            <Plus className="w-4 h-4" />
            <span>Yeni Masraf / Fiş Bildir</span>
          </Link>
        </div>
      </div>

      {/* Summary Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
          <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center justify-between">
            <span>Toplam Bildirilen</span>
            <DollarSign className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-xl font-bold text-slate-900 dark:text-white mt-1.5 font-mono">
            {totalAmount.toLocaleString("tr-TR", { minimumFractionDigits: 2 })} ₺
          </div>
          <span className="text-[10px] text-slate-400 mt-0.5 block">{expenses.length} Adet Fiş</span>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
          <div className="text-xs text-amber-500 flex items-center justify-between">
            <span>Onay Bekleyen</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-xl font-bold text-amber-500 mt-1.5 font-mono">
            {pendingAmount.toLocaleString("tr-TR", { minimumFractionDigits: 2 })} ₺
          </div>
          <span className="text-[10px] text-slate-400 mt-0.5 block">Muhasebe İncelemesinde</span>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
          <div className="text-xs text-emerald-500 flex items-center justify-between">
            <span>Ödenen Tutar</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-xl font-bold text-emerald-500 mt-1.5 font-mono">
            {paidAmount.toLocaleString("tr-TR", { minimumFractionDigits: 2 })} ₺
          </div>
          <span className="text-[10px] text-slate-400 mt-0.5 block">Hesaba Yatırılan</span>
        </div>
      </div>

      {/* Expenses List */}
      <div className="space-y-3">
        {expenses.length === 0 ? (
          <div className="p-12 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs text-slate-400 space-y-3">
            <Receipt className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-700" />
            <p>Henüz kayıtlı bir masraf veya fiş bildiriminiz bulunmuyor.</p>
            <Link
              href="/personnel/expenses/new"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold"
            >
              <Plus className="w-4 h-4" />
              <span>İlk Masrafınızı Bildirin</span>
            </Link>
          </div>
        ) : (
          expenses.map((item) => {
            const typeCfg = TYPE_LABELS[item.expenseType] || TYPE_LABELS.MATERIAL
            const statusCfg = STATUS_BADGES[item.status] || STATUS_BADGES.PENDING
            const Icon = typeCfg.icon

            return (
              <div
                key={item.id}
                className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="flex items-start gap-3.5">
                  <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800/80 text-blue-600 dark:text-blue-400 shrink-0">
                    <Icon className="w-5 h-5" />
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-900 dark:text-white">
                        {typeCfg.label}
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${statusCfg.class}`}>
                        {statusCfg.label}
                      </span>
                    </div>

                    {item.description && (
                      <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-1">
                        {item.description}
                      </p>
                    )}

                    <div className="text-[11px] text-slate-400 font-mono">
                      {new Date(item.createdAt).toLocaleDateString("tr-TR", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                  </div>
                </div>

                {/* Amount & Receipt button */}
                <div className="flex sm:flex-col items-center sm:items-end justify-between border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100 dark:border-slate-800 gap-2 shrink-0">
                  <div className="text-base font-bold text-slate-900 dark:text-white font-mono">
                    {item.amount.toLocaleString("tr-TR", { minimumFractionDigits: 2 })} ₺
                  </div>

                  {item.receiptUrl && (
                    <button
                      onClick={() => setSelectedReceipt(item.receiptUrl)}
                      className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Fişi Gör</span>
                    </button>
                  )}
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Lightbox Modal for Receipt Preview */}
      {selectedReceipt && (
        <div
          onClick={() => setSelectedReceipt(null)}
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm cursor-pointer"
        >
          <div className="relative max-w-2xl max-h-[85vh] bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden p-2">
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
