"use client"

/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Nexa ERP - Satınalma Kıyaslama & Otomatik Mukayese Tablosu
 */

import React, { useState, useEffect, useMemo } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import {
  ArrowLeft,
  Gavel,
  CheckCircle2,
  Trophy,
  TrendingDown,
  Building2,
  DollarSign,
  Package,
  Calendar,
  Layers,
  Sparkles,
  Download,
  ShieldCheck,
  RefreshCw,
  AlertCircle,
  FileSpreadsheet,
} from "lucide-react"

interface BidItem {
  id: string
  purchaseRequestId: string
  supplierId: string
  unitPrice: number
  totalPrice: number
  isWinningBid: boolean
  notes?: string | null
  createdAt: string
  supplier: {
    id: string
    name: string
    email?: string
    phone?: string
    taxNumber?: string
  }
}

interface PurchaseRequestData {
  id: string
  materialName: string
  quantity: number
  unit: string
  status: string
  createdAt: string
  project?: {
    id: string
    title: string
    name?: string
    location?: string
  }
  bids: BidItem[]
}

export default function BidComparisonPage() {
  const params = useParams()
  const router = useRouter()
  const requestId = params?.id as string

  const [requestData, setRequestData] = useState<PurchaseRequestData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isActionLoading, setIsActionLoading] = useState(false)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  useEffect(() => {
    if (requestId) {
      fetchRequestAndBids()
    }
  }, [requestId])

  const fetchRequestAndBids = async () => {
    setIsLoading(true)
    try {
      const res = await fetch(`/api/procurement/purchase-requests`)
      if (res.ok) {
        const allRequests: PurchaseRequestData[] = await res.json()
        const found = allRequests.find((r) => r.id === requestId)
        if (found) {
          // Sort bids by unitPrice asc
          found.bids = (found.bids || []).sort((a, b) => a.unitPrice - b.unitPrice)
          setRequestData(found)
        }
      }
    } catch (err) {
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSelectWinningBid = async (bidId: string) => {
    if (!confirm("Bu teklifi kazanan olarak onaylayıp ihaleyi tamamlamak istiyor musunuz?")) {
      return
    }

    setIsActionLoading(true)
    try {
      const res = await fetch("/api/procurement/bids", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bidId, isWinning: true }),
      })

      if (res.ok) {
        setSuccessMsg("İhale onaylandı! Kazanan teklif kesinleşti.")
        setTimeout(() => setSuccessMsg(null), 4000)
        await fetchRequestAndBids()
      } else {
        alert("Teklif onaylanırken hata oluştu.")
      }
    } catch (error) {
      console.error(error)
      alert("Hata oluştu.")
    } finally {
      setIsActionLoading(false)
    }
  }

  // Mukayese Analizi (Calculations)
  const comparisonStats = useMemo(() => {
    if (!requestData || !requestData.bids || requestData.bids.length === 0) {
      return null
    }

    const bids = requestData.bids
    const lowestBid = bids[0]
    const highestBid = bids[bids.length - 1]
    const sumUnitPrice = bids.reduce((acc, b) => acc + b.unitPrice, 0)
    const avgUnitPrice = sumUnitPrice / bids.length
    const totalPotentialSavings = (avgUnitPrice - lowestBid.unitPrice) * requestData.quantity

    return {
      lowestBid,
      highestBid,
      avgUnitPrice,
      totalPotentialSavings: Math.max(0, totalPotentialSavings),
      count: bids.length,
    }
  }, [requestData])

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("tr-TR", {
      style: "currency",
      currency: "TRY",
      maximumFractionDigits: 0,
    }).format(val)
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-8">
      {/* Toast Alert */}
      {successMsg && (
        <div className="fixed top-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-xl bg-emerald-500 text-white shadow-2xl animate-bounce">
          <CheckCircle2 className="w-5 h-5" />
          <span className="font-bold text-sm">{successMsg}</span>
        </div>
      )}

      <div className="max-w-7xl mx-auto space-y-6">
        {/* Top Navigation */}
        <div className="flex items-center justify-between">
          <Link
            href="/admin/procurement"
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors py-1.5 px-3 rounded-lg bg-slate-900 border border-slate-800"
          >
            <ArrowLeft className="w-4 h-4" />
            Satınalma Modülüne Dön
          </Link>

          <button
            onClick={fetchRequestAndBids}
            className="p-2 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white transition-all shadow-sm"
            title="Yenile"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
          </button>
        </div>

        {/* Page Header & Request Summary */}
        <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900/90 to-emerald-950/30 border border-slate-800 shadow-xl">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-semibold">
                  Otomatik Fiyat Mukayesesi
                </span>
                <span className="text-xs text-slate-500">
                  Talep ID: <span className="font-mono text-slate-300">{requestId}</span>
                </span>
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                {requestData?.materialName || "Satınalma Talebi"}
                {requestData?.status === "COMPLETED" && (
                  <span className="text-xs px-2.5 py-1 rounded-md bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 font-bold">
                    İhale Sonuçlandı
                  </span>
                )}
              </h1>
              <p className="text-xs text-slate-400">
                Proje:{" "}
                <span className="text-slate-200 font-medium">
                  {requestData?.project?.title || requestData?.project?.name || "Şantiye Projesi"}
                </span>{" "}
                • Miktar:{" "}
                <span className="text-amber-400 font-bold">
                  {requestData?.quantity.toLocaleString("tr-TR")} {requestData?.unit}
                </span>
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-right">
                <span className="text-[11px] text-slate-400 block">Gelen Teklif Sayısı</span>
                <span className="text-2xl font-black text-white">
                  {requestData?.bids?.length || 0} Firma
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Mukayese Analiz Özeti (Best Offer Highlight Banner) */}
        {comparisonStats && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* 1. Best Offer Card (Emerald Glowing) */}
            <div className="md:col-span-2 p-6 rounded-2xl bg-gradient-to-r from-emerald-950/60 to-slate-900 border-2 border-emerald-500/80 shadow-2xl shadow-emerald-950/60 relative overflow-hidden">
              <div className="flex items-center justify-between mb-3">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-emerald-500 text-slate-950 shadow-md">
                  <Trophy className="w-3.5 h-3.5" />
                  EN AVANTAJLI TEKLİF (1. SIRA)
                </span>
                <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
                  <TrendingDown className="w-4 h-4" />
                  Piyasa Ortalamasından Daha Uygun
                </span>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-4 mt-2">
                <div>
                  <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-emerald-400" />
                    {comparisonStats.lowestBid.supplier.name}
                  </h3>
                  <p className="text-xs text-slate-300 mt-1">
                    {comparisonStats.lowestBid.notes || "Belirtilen şartlarda teslimat"}
                  </p>
                </div>

                <div className="text-right">
                  <span className="text-xs text-emerald-300/80 block">En Düşük Birim Fiyat:</span>
                  <div className="text-3xl font-black text-emerald-400 font-mono">
                    {formatCurrency(comparisonStats.lowestBid.unitPrice)}
                    <span className="text-xs font-normal text-slate-400"> / {requestData?.unit}</span>
                  </div>
                  <span className="text-xs text-slate-300 font-medium">
                    Toplam: {formatCurrency(comparisonStats.lowestBid.totalPrice)}
                  </span>
                </div>
              </div>

              {/* Action for Best Offer */}
              <div className="mt-4 pt-4 border-t border-emerald-900/60 flex items-center justify-between">
                <span className="text-xs text-emerald-200/90 font-medium">
                  Tahmini Tasarruf:{" "}
                  <strong className="text-emerald-400 font-bold">
                    {formatCurrency(comparisonStats.totalPotentialSavings)}
                  </strong>
                </span>

                {!comparisonStats.lowestBid.isWinningBid && requestData?.status !== "COMPLETED" && (
                  <button
                    disabled={isActionLoading}
                    onClick={() => handleSelectWinningBid(comparisonStats.lowestBid.id)}
                    className="flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-extrabold bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-lg shadow-emerald-950 transition-all"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    En Düşük Teklifi Onayla & İhaleyi Bitir
                  </button>
                )}
                {comparisonStats.lowestBid.isWinningBid && (
                  <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-400 bg-emerald-950 px-3 py-1.5 rounded-lg border border-emerald-800">
                    <ShieldCheck className="w-4 h-4" />
                    Bu Teklif Kazanan İlan Edildi
                  </span>
                )}
              </div>
            </div>

            {/* 2. Statistical Breakdown */}
            <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between">
              <div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">
                  İhale Fiyat Analizi
                </span>
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">Ortalama Birim Fiyat:</span>
                    <span className="font-bold text-white font-mono">
                      {formatCurrency(comparisonStats.avgUnitPrice)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">En Yüksek Teklif:</span>
                    <span className="font-bold text-rose-400 font-mono">
                      {formatCurrency(comparisonStats.highestBid.unitPrice)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">Maksimum Fiyat Makası:</span>
                    <span className="font-bold text-amber-400 font-mono">
                      {formatCurrency(
                        comparisonStats.highestBid.unitPrice - comparisonStats.lowestBid.unitPrice
                      )}
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-4 mt-4 border-t border-slate-800 text-center">
                <span className="text-[11px] text-slate-500">
                  Otomatik mukayese matrisi tüm teklifleri en düşük birim fiyattan yükseğe doğru
                  sıralar.
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Mukayese Tablosu (Comparative Table) */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden shadow-2xl backdrop-blur-sm">
          <div className="p-4 border-b border-slate-800 bg-slate-950/70 flex items-center justify-between">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
              Tedarikçi Teklif Mukayese Matrisi
            </h2>
            <span className="text-xs text-slate-400">
              {requestData?.bids?.length || 0} Tedarikçi Katıldı
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/90 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  <th className="py-3.5 px-4 text-center">Sıra</th>
                  <th className="py-3.5 px-4">Tedarikçi Firma</th>
                  <th className="py-3.5 px-4 text-right">Birim Fiyat</th>
                  <th className="py-3.5 px-4 text-right">Toplam Fiyat</th>
                  <th className="py-3.5 px-4 text-right">Fiyat Farkı (%)</th>
                  <th className="py-3.5 px-4">Teslimat & Vade Notları</th>
                  <th className="py-3.5 px-4">Teklif Tarihi</th>
                  <th className="py-3.5 px-4 text-center">Durum & Onay</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-sm">
                {isLoading ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400">
                      <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-emerald-500" />
                      Teklifler karşılaştırılıyor...
                    </td>
                  </tr>
                ) : !requestData?.bids || requestData.bids.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400">
                      Bu satınalma talebine henüz tedarikçi teklifi verilmemiş.
                    </td>
                  </tr>
                ) : (
                  requestData.bids.map((bid, index) => {
                    const isLowest = index === 0
                    const lowestPrice = requestData.bids[0].unitPrice
                    const diffPercent =
                      lowestPrice > 0
                        ? (((bid.unitPrice - lowestPrice) / lowestPrice) * 100).toFixed(1)
                        : "0.0"

                    return (
                      <tr
                        key={bid.id}
                        className={`transition-colors ${
                          isLowest
                            ? "bg-emerald-950/30 hover:bg-emerald-950/40 border-l-4 border-l-emerald-500"
                            : bid.isWinningBid
                            ? "bg-blue-950/20 hover:bg-blue-950/30"
                            : "hover:bg-slate-800/30"
                        }`}
                      >
                        {/* Rank */}
                        <td className="py-3.5 px-4 text-center">
                          {isLowest ? (
                            <span className="w-6 h-6 rounded-full bg-emerald-500 text-slate-950 font-black text-xs inline-flex items-center justify-center shadow-md">
                              1
                            </span>
                          ) : (
                            <span className="w-6 h-6 rounded-full bg-slate-800 text-slate-300 font-semibold text-xs inline-flex items-center justify-center">
                              {index + 1}
                            </span>
                          )}
                        </td>

                        {/* Supplier Name */}
                        <td className="py-3.5 px-4">
                          <div>
                            <div className="font-bold text-white flex items-center gap-1.5">
                              {bid.supplier.name}
                              {isLowest && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold">
                                  EN UYGUN
                                </span>
                              )}
                            </div>
                            <span className="text-xs text-slate-400 block">
                              {bid.supplier.email || bid.supplier.phone || "Kayıtlı İletişim"}
                            </span>
                          </div>
                        </td>

                        {/* Unit Price (Green if lowest) */}
                        <td className="py-3.5 px-4 text-right font-mono font-bold whitespace-nowrap">
                          <span
                            className={`text-base ${
                              isLowest ? "text-emerald-400 font-extrabold" : "text-slate-200"
                            }`}
                          >
                            {formatCurrency(bid.unitPrice)}
                          </span>
                        </td>

                        {/* Total Price */}
                        <td className="py-3.5 px-4 text-right font-mono font-bold text-white whitespace-nowrap">
                          {formatCurrency(bid.totalPrice)}
                        </td>

                        {/* Difference vs Lowest */}
                        <td className="py-3.5 px-4 text-right font-mono text-xs whitespace-nowrap">
                          {isLowest ? (
                            <span className="text-emerald-400 font-bold">Referans (%0)</span>
                          ) : (
                            <span className="text-rose-400 font-semibold">+{diffPercent}%</span>
                          )}
                        </td>

                        {/* Notes & Terms */}
                        <td className="py-3.5 px-4 text-xs text-slate-300 max-w-xs">
                          {bid.notes || "—"}
                        </td>

                        {/* Bid Date */}
                        <td className="py-3.5 px-4 text-xs text-slate-400 whitespace-nowrap">
                          {new Date(bid.createdAt).toLocaleDateString("tr-TR")}
                        </td>

                        {/* Action / Winning */}
                        <td className="py-3.5 px-4 text-center whitespace-nowrap">
                          {bid.isWinningBid ? (
                            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              KAZANAN
                            </span>
                          ) : requestData.status !== "COMPLETED" ? (
                            <button
                              disabled={isActionLoading}
                              onClick={() => handleSelectWinningBid(bid.id)}
                              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shadow-sm ${
                                isLowest
                                  ? "bg-emerald-600 hover:bg-emerald-500 text-white font-bold"
                                  : "bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white"
                              }`}
                            >
                              Kazanan Seç
                            </button>
                          ) : (
                            <span className="text-xs text-slate-500">Kayıtlı</span>
                          )}
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
    </div>
  )
}
