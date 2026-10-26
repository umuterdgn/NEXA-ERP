/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Superadmin Faturalandırma & Abonelik Yönetimi (/superadmin/billing)
 */

"use client"

import React, { useState, useEffect } from "react"
import Link from "next/link"
import {
  CreditCard,
  DollarSign,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Lock,
  Unlock,
  RefreshCw,
  Search,
  Filter,
  Calendar,
  Building2,
  ExternalLink,
  ShieldAlert,
  Loader2,
  TrendingUp,
  Receipt,
} from "lucide-react"
import toast from "react-hot-toast"

interface BillingTenant {
  id: string
  name: string
  domain?: string | null
  type: string
  subscriptionPlan: "STARTER" | "PROFESSIONAL" | "ENTERPRISE"
  status: "ACTIVE" | "SUSPENDED"
  paymentStatus: "PAID" | "PAST_DUE" | "FAILED"
  licenses: number
  iyzicoSubId?: string | null
  monthlyFee: number
  nextBillingDate: string
  isReadOnly: boolean
  _count: {
    projects: number
    users: number
  }
}

export default function SuperadminBillingPage() {
  const [tenants, setTenants] = useState<BillingTenant[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterPayment, setFilterPayment] = useState("ALL")
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null)

  useEffect(() => {
    fetchBillingData()
  }, [])

  const fetchBillingData = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/superadmin/billing")
      const result = await res.json()
      if (result.success) {
        setTenants(result.data)
      } else {
        toast.error("Faturalandırma verisi alınamadı")
      }
    } catch (err) {
      console.error(err)
      toast.error("Ağ hatası")
    } finally {
      setLoading(false)
    }
  }

  // Tek tuşla Read-Only (Askıya alma / Açma)
  const handleToggleReadOnly = async (tenantId: string, currentStatus: string) => {
    setActionLoadingId(tenantId)
    try {
      const res = await fetch("/api/superadmin/billing", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenantId,
          action: "TOGGLE_READ_ONLY",
        }),
      })
      const result = await res.json()
      if (result.success) {
        toast.success(
          currentStatus === "ACTIVE"
            ? "Firma 'Sadece Okunabilir' (Read-Only) moda alındı."
            : "Firma erişimi tekrar aktif edildi."
        )
        fetchBillingData()
      } else {
        toast.error(result.error || "İşlem başarısız")
      }
    } catch {
      toast.error("Sunucuya bağlanılamadı")
    } finally {
      setActionLoadingId(null)
    }
  }

  // Ödeme durumu güncelleme (PAID / PAST_DUE)
  const handleUpdatePaymentStatus = async (tenantId: string, newStatus: string) => {
    setActionLoadingId(tenantId)
    try {
      const res = await fetch("/api/superadmin/billing", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenantId,
          paymentStatus: newStatus,
          status: newStatus === "PAST_DUE" || newStatus === "FAILED" ? "SUSPENDED" : "ACTIVE",
        }),
      })
      const result = await res.json()
      if (result.success) {
        toast.success(`Ödeme durumu '${newStatus}' olarak güncellendi.`)
        fetchBillingData()
      } else {
        toast.error("Durum güncellenemedi")
      }
    } catch {
      toast.error("İşlem hatası")
    } finally {
      setActionLoadingId(null)
    }
  }

  // KPI Hesaplamaları
  const totalMrr = tenants.reduce((acc, t) => acc + (t.status === "ACTIVE" ? t.monthlyFee : 0), 0)
  const pastDueAmount = tenants
    .filter((t) => t.paymentStatus === "PAST_DUE" || t.paymentStatus === "FAILED")
    .reduce((acc, t) => acc + t.monthlyFee, 0)
  const paidCount = tenants.filter((t) => t.paymentStatus === "PAID").length
  const pastDueCount = tenants.filter((t) => t.paymentStatus === "PAST_DUE" || t.paymentStatus === "FAILED").length

  // Filtreleme
  const filteredTenants = tenants.filter((t) => {
    const matchesSearch =
      t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.domain && t.domain.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesFilter =
      filterPayment === "ALL" ? true : t.paymentStatus === filterPayment
    return matchesSearch && matchesFilter
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <CreditCard className="h-7 w-7 text-purple-400" />
            Faturalandırma & Abonelikler
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            SaaS multi-tenant tahsilat akışı, İyzico abonelik döngüleri ve kilit yönetimi
          </p>
        </div>

        <button
          onClick={fetchBillingData}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-sm font-medium transition"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Yenile
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Aylık Tekrarlayan Gelir (MRR)</span>
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400">
              <TrendingUp className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-white">₺{totalMrr.toLocaleString("tr-TR")}</span>
            <span className="text-xs text-emerald-400 font-medium">/ Ay</span>
          </div>
          <p className="mt-1 text-xs text-slate-500">Aktif aboneliklerin toplamı</p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Geciken Tahsilat Riski</span>
            <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400">
              <AlertTriangle className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-rose-400">₺{pastDueAmount.toLocaleString("tr-TR")}</span>
            <span className="text-xs text-rose-400 font-medium font-mono">({pastDueCount} Firma)</span>
          </div>
          <p className="mt-1 text-xs text-slate-500">Ödemesi gecikmiş kilitli firmalar</p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Düzenli Ödeyen Firmalar</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <CheckCircle className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-emerald-400">{paidCount}</span>
            <span className="text-xs text-slate-400">/ {tenants.length} Tenant</span>
          </div>
          <p className="mt-1 text-xs text-slate-500">Otomatik tahsilat aktif</p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">İyzico Gateway Entegrasyonu</span>
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400">
              <Receipt className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-blue-400">%100</span>
            <span className="text-xs text-blue-300 font-medium">B2B Otomasyon</span>
          </div>
          <p className="mt-1 text-xs text-slate-500">Aylık periyodik kart çekimi</p>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <input
            type="text"
            placeholder="Firma adı veya domain ara..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-purple-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
          <span className="text-xs text-slate-400 font-medium whitespace-nowrap flex items-center gap-1.5">
            <Filter className="h-3.5 w-3.5" /> Durum:
          </span>
          {[
            { key: "ALL", label: "Tümü" },
            { key: "PAID", label: "Ödendi" },
            { key: "PAST_DUE", label: "Gecikmede" },
            { key: "FAILED", label: "Başarısız" },
          ].map((f) => (
            <button
              key={f.key}
              onClick={() => setFilterPayment(f.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition whitespace-nowrap ${
                filterPayment === f.key
                  ? "bg-purple-600 text-white shadow-lg shadow-purple-600/30"
                  : "bg-slate-800 text-slate-300 hover:bg-slate-700"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* DataGrid */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-950/80 text-xs uppercase tracking-wider text-slate-400 border-b border-slate-800">
              <tr>
                <th className="px-5 py-4 font-semibold">Firma / Tenant</th>
                <th className="px-5 py-4 font-semibold">Tür & Plan</th>
                <th className="px-5 py-4 font-semibold">Aylık Tutar</th>
                <th className="px-5 py-4 font-semibold">Ödeme Durumu</th>
                <th className="px-5 py-4 font-semibold">Sıradaki Çekim</th>
                <th className="px-5 py-4 font-semibold">Erişim Modu</th>
                <th className="px-5 py-4 font-semibold text-right">Hızlı Müdahale</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-medium">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-slate-500">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto text-purple-500 mb-2" />
                    Faturalandırma verileri yükleniyor...
                  </td>
                </tr>
              ) : filteredTenants.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-slate-500">
                    Arama kriterlerine uygun firma bulunamadı.
                  </td>
                </tr>
              ) : (
                filteredTenants.map((tenant) => {
                  const isSuspended = tenant.status === "SUSPENDED"
                  const isPastDue = tenant.paymentStatus === "PAST_DUE" || tenant.paymentStatus === "FAILED"

                  return (
                    <tr
                      key={tenant.id}
                      className="hover:bg-slate-800/40 transition-colors group"
                    >
                      {/* Firma Adı */}
                      <td className="px-5 py-4">
                        <Link
                          href={`/superadmin/tenants/${tenant.id}`}
                          className="font-semibold text-white group-hover:text-purple-400 flex items-center gap-2"
                        >
                          <Building2 className="h-4 w-4 text-slate-400 shrink-0" />
                          <span>{tenant.name}</span>
                          <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </Link>
                        <p className="text-xs text-slate-500 font-mono mt-0.5">
                          {tenant.domain || `ID: ${tenant.id.slice(0, 10)}...`}
                        </p>
                      </td>

                      {/* Tür & Plan */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${
                              tenant.subscriptionPlan === "ENTERPRISE"
                                ? "bg-purple-950/80 text-purple-300 border border-purple-500/40"
                                : tenant.subscriptionPlan === "PROFESSIONAL"
                                ? "bg-blue-950/80 text-blue-300 border border-blue-500/40"
                                : "bg-slate-800 text-slate-300 border border-slate-700"
                            }`}
                          >
                            {tenant.subscriptionPlan}
                          </span>
                          <span className="text-[11px] text-slate-400">
                            {tenant.type === "INSPECTION" ? "Yapı Denetim" : "Müteahhit"}
                          </span>
                        </div>
                      </td>

                      {/* Aylık Tutar */}
                      <td className="px-5 py-4 font-mono font-bold text-white">
                        ₺{tenant.monthlyFee.toLocaleString("tr-TR")}
                      </td>

                      {/* Ödeme Durumu */}
                      <td className="px-5 py-4">
                        {tenant.paymentStatus === "PAID" ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-950/60 text-emerald-300 border border-emerald-500/30">
                            <CheckCircle className="h-3.5 w-3.5 text-emerald-400" />
                            Ödendi
                          </span>
                        ) : tenant.paymentStatus === "PAST_DUE" ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-950/60 text-amber-300 border border-amber-500/30">
                            <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />
                            Gecikmede
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-950/60 text-rose-300 border border-rose-500/30">
                            <XCircle className="h-3.5 w-3.5 text-rose-400" />
                            Başarısız
                          </span>
                        )}
                      </td>

                      {/* Sıradaki Çekim */}
                      <td className="px-5 py-4 text-xs text-slate-400 font-mono">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5 text-slate-500" />
                          {new Date(tenant.nextBillingDate).toLocaleDateString("tr-TR")}
                        </div>
                      </td>

                      {/* Erişim Modu */}
                      <td className="px-5 py-4">
                        {isSuspended ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-950/80 text-rose-300 border border-rose-500/40">
                            <Lock className="h-3.5 w-3.5 text-rose-400" />
                            Read-Only (Kilitli)
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                            <Unlock className="h-3.5 w-3.5 text-emerald-400" />
                            Tam Erişim (Yazma Aktif)
                          </span>
                        )}
                      </td>

                      {/* Aksiyon Butonları */}
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {/* Read-Only Şalter Butonu */}
                          <button
                            onClick={() => handleToggleReadOnly(tenant.id, tenant.status)}
                            disabled={actionLoadingId === tenant.id}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
                              isSuspended
                                ? "bg-emerald-600/20 text-emerald-300 hover:bg-emerald-600/30 border border-emerald-500/30"
                                : "bg-rose-600/20 text-rose-300 hover:bg-rose-600/30 border border-rose-500/30"
                            }`}
                            title={isSuspended ? "Kilit Aç (Tam Erişim)" : "Ödeme Nedeniyle Read-Only Yap"}
                          >
                            {actionLoadingId === tenant.id ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : isSuspended ? (
                              <>
                                <Unlock className="h-3.5 w-3.5" />
                                Kilidi Aç
                              </>
                            ) : (
                              <>
                                <Lock className="h-3.5 w-3.5" />
                                Read-Only Yap
                              </>
                            )}
                          </button>

                          {/* Ödeme Durumu Değiştirme Butonu */}
                          {isPastDue ? (
                            <button
                              onClick={() => handleUpdatePaymentStatus(tenant.id, "PAID")}
                              disabled={actionLoadingId === tenant.id}
                              className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 text-slate-200 hover:bg-slate-700 border border-slate-700"
                              title="Tahsil Edildi Olarak İşaretle"
                            >
                              ✓ Tahsil Edildi
                            </button>
                          ) : (
                            <button
                              onClick={() => handleUpdatePaymentStatus(tenant.id, "PAST_DUE")}
                              disabled={actionLoadingId === tenant.id}
                              className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-amber-300 border border-slate-700"
                              title="Ödemesi Gecikti Olarak İşaretle"
                            >
                              Gecikme Uyarısı
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
