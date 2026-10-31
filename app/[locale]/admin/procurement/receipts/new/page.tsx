"use client"

/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Nexa ERP - Ambar Mal Kabul & İrsaliye Eşleştirme (Goods Receipt Form)
 */

import React, { useState, useEffect, useMemo } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import {
  FileCheck2,
  ArrowLeft,
  Package,
  CheckCircle2,
  AlertTriangle,
  Scale,
  Truck,
  Building2,
  Calendar,
  User,
  Layers,
  FileText,
  Clock,
  Check,
} from "lucide-react"

interface PurchaseRequestOption {
  id: string
  materialName: string
  quantity: number
  unit: string
  status: string
  project?: {
    id: string
    title: string
    name?: string
  }
}

interface UserOption {
  id: string
  name: string
  role: string
}

interface ReceiptHistoryItem {
  id: string
  waybillNo: string
  orderedQuantity: number
  deliveredQuantity: number
  difference: number
  receivedDate: string
  receivedBy?: {
    name: string
  }
  purchaseRequest?: {
    materialName: string
    unit: string
  }
}

export default function NewGoodsReceiptPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const preSelectedPrId = searchParams.get("prId") || ""

  const [requests, setRequests] = useState<PurchaseRequestOption[]>([])
  const [users, setUsers] = useState<UserOption[]>([])
  const [recentReceipts, setRecentReceipts] = useState<ReceiptHistoryItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [successToast, setSuccessToast] = useState<string | null>(null)

  // Form Fields
  const [selectedPRId, setSelectedPRId] = useState<string>(preSelectedPrId)
  const [waybillNo, setWaybillNo] = useState<string>("")
  const [deliveredQuantity, setDeliveredQuantity] = useState<string>("")
  const [receivedById, setReceivedById] = useState<string>("")
  const [receivedDate, setReceivedDate] = useState<string>(
    new Date().toISOString().slice(0, 16)
  )

  useEffect(() => {
    initPage()
  }, [])

  const initPage = async () => {
    setIsLoading(true)
    try {
      const [prRes, userRes, receiptRes] = await Promise.all([
        fetch("/api/procurement/purchase-requests"),
        fetch("/api/users"),
        fetch("/api/procurement/receipts"),
      ])

      if (prRes.ok) {
        const prData = await prRes.json()
        setRequests(Array.isArray(prData) ? prData : [])
        if (!selectedPRId && prData.length > 0) {
          setSelectedPRId(prData[0].id)
        }
      }

      if (userRes.ok) {
        const userData = await userRes.json()
        setUsers(Array.isArray(userData) ? userData : [])
        if (userData.length > 0) {
          setReceivedById(userData[0].id)
        }
      } else {
        const u2 = await fetch("/api/admin/users")
        if (u2.ok) {
          const u2Data = await u2.json()
          setUsers(Array.isArray(u2Data) ? u2Data : [])
          if (u2Data.length > 0) setReceivedById(u2Data[0].id)
        }
      }

      if (receiptRes.ok) {
        const rData = await receiptRes.json()
        setRecentReceipts(Array.isArray(rData) ? rData : [])
      }
    } catch (err) {
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  // Selected Purchase Request Details
  const currentPR = useMemo(() => {
    return requests.find((r) => r.id === selectedPRId) || null
  }, [requests, selectedPRId])

  // Calculation of Difference (Gerçekte Ambara İnen vs Sipariş Edilen)
  const orderedQty = currentPR ? currentPR.quantity : 0
  const deliveredQtyNum = parseFloat(deliveredQuantity) || 0
  const difference = deliveredQuantity ? deliveredQtyNum - orderedQty : 0
  const isShortage = difference < 0
  const isExact = difference === 0 && deliveredQuantity !== ""
  const isSurplus = difference > 0

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedPRId || !waybillNo || !deliveredQuantity || !receivedById) {
      alert("Lütfen tüm zorunlu alanları doldurun.")
      return
    }

    setIsSubmitting(true)
    try {
      const res = await fetch("/api/procurement/receipts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          purchaseRequestId: selectedPRId,
          orderedQuantity: orderedQty,
          deliveredQuantity: deliveredQtyNum,
          waybillNo: waybillNo.toUpperCase().trim(),
          receivedById,
          receivedDate,
        }),
      })

      if (res.ok) {
        setSuccessToast(`İrsaliye kabulü başarıyla kaydedildi! (İrsaliye: ${waybillNo})`)
        setTimeout(() => {
          setSuccessToast(null)
          router.push("/admin/procurement/logistics")
        }, 2000)
      } else {
        const err = await res.json()
        alert(err.error || "Ambar kabul kaydı oluşturulamadı.")
      }
    } catch (error) {
      console.error(error)
      alert("Kaydetme hatası.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-5xl mx-auto min-h-screen text-slate-100 bg-slate-950">
      {/* Toast Alert */}
      {successToast && (
        <div className="fixed top-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-xl bg-emerald-500 text-white shadow-2xl animate-bounce">
          <CheckCircle2 className="w-5 h-5" />
          <span className="font-bold text-sm">{successToast}</span>
        </div>
      )}

      {/* Top Nav */}
      <div>
        <Link
          href="/admin/procurement/logistics"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors py-1.5 px-3 rounded-lg bg-slate-900 border border-slate-800"
        >
          <ArrowLeft className="w-4 h-4" />
          Kapı Güvenlik & Lojistik Takvimine Dön
        </Link>
      </div>

      {/* Header */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900/90 to-blue-950/40 border border-slate-800 shadow-xl">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-600 flex items-center justify-center text-white shadow-xl shadow-emerald-950/40">
            <Scale className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              Ambar Mal Kabul & İrsaliye Eşleştirme
            </h1>
            <p className="text-sm text-slate-400 mt-0.5">
              Ambara inen malzemenin irsaliye numarası ve "Sipariş Edilen vs Gelen" miktar farkı teyidi
            </p>
          </div>
        </div>
      </div>

      {/* Main Acceptance Form */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form Inputs (Left 2 Cols) */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* 1. Purchase Request Selection */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5 uppercase tracking-wider">
                1. İlgili Satınalma Talebi / Sipariş *
              </label>
              <select
                value={selectedPRId}
                onChange={(e) => setSelectedPRId(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-blue-500"
                required
              >
                {requests.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.materialName} ({r.quantity} {r.unit}) — {r.project?.title || "Şantiye"}
                  </option>
                ))}
              </select>
            </div>

            {/* 2. Waybill No & Delivery Date */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5 uppercase tracking-wider">
                  2. İrsaliye Numarası *
                </label>
                <div className="relative">
                  <FileText className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="text"
                    placeholder="Örn: IRS-2026-90412"
                    value={waybillNo}
                    onChange={(e) => setWaybillNo(e.target.value.toUpperCase())}
                    className="w-full pl-9 pr-3 py-2.5 text-sm rounded-xl bg-slate-950 border border-slate-800 text-white font-mono font-bold focus:outline-none focus:border-blue-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5 uppercase tracking-wider">
                  3. Mal Kabul Tarihi ve Saati *
                </label>
                <div className="relative">
                  <Calendar className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="datetime-local"
                    value={receivedDate}
                    onChange={(e) => setReceivedDate(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 text-sm rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-blue-500 font-mono"
                    required
                  />
                </div>
              </div>
            </div>

            {/* 3. Ordered Quantity vs Delivered Quantity Comparison Inputs */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 space-y-4">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                Miktar Doğrulama ve Kantar Tartımı
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Ordered Quantity (Reference) */}
                <div>
                  <label className="block text-xs text-slate-400 mb-1">
                    Sipariş Edilen Miktar (Sistem Referansı):
                  </label>
                  <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-white font-mono font-bold text-base flex items-center justify-between">
                    <span>{orderedQty}</span>
                    <span className="text-xs text-amber-400 font-semibold">{currentPR?.unit || "Birim"}</span>
                  </div>
                </div>

                {/* Delivered Quantity (Input) */}
                <div>
                  <label className="block text-xs font-bold text-emerald-400 mb-1">
                    Gerçekte Ambara İnen Miktar (Fiziki Sayım/Kantar) *
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={deliveredQuantity}
                      onChange={(e) => setDeliveredQuantity(e.target.value)}
                      className="w-full px-3 py-2 text-base rounded-lg bg-slate-900 border-2 border-emerald-500/70 text-emerald-400 font-mono font-black focus:outline-none focus:border-emerald-400"
                      required
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                      {currentPR?.unit || "Birim"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* 4. Receiver Personnel */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5 uppercase tracking-wider">
                4. Malı Teslim Alan Ambar Sorumlusu / Personel *
              </label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <select
                  value={receivedById}
                  onChange={(e) => setReceivedById(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 text-sm rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-blue-500"
                  required
                >
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.role})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-sm shadow-xl shadow-emerald-950 transition-all flex items-center justify-center gap-2"
              >
                <FileCheck2 className="w-5 h-5" />
                {isSubmitting ? "Ambar Girişi Yapılıyor..." : "İrsaliyeyi Onayla ve Ambar Kabulünü Tamamla"}
              </button>
            </div>
          </form>
        </div>

        {/* Live Variance Analysis Card (Right 1 Col) */}
        <div className="space-y-4">
          <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Scale className="w-4 h-4 text-emerald-400" />
              Anlık Miktar Fark Analizi
            </h3>

            {/* Status Feedback Box */}
            {deliveredQuantity ? (
              isShortage ? (
                <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-800/80 space-y-2">
                  <div className="flex items-center gap-2 text-rose-400 font-bold text-xs uppercase">
                    <AlertTriangle className="w-4 h-4" />
                    Eksik Teslimat Uyarısı!
                  </div>
                  <div className="text-2xl font-black text-rose-400 font-mono">
                    {difference.toFixed(2)} {currentPR?.unit}
                  </div>
                  <p className="text-xs text-rose-300/80 leading-relaxed">
                    İrsaliyeye şerh düşülmelidir. Eksik teslimat miktarı tedarikçinin hakediş / fatura
                    tutarından otomatik düşülecektir.
                  </p>
                </div>
              ) : isExact ? (
                <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-800/80 space-y-2">
                  <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs uppercase">
                    <CheckCircle2 className="w-4 h-4" />
                    Tam Teslimat Doğrulandı
                  </div>
                  <div className="text-2xl font-black text-emerald-400 font-mono">
                    0.00 {currentPR?.unit} Fark
                  </div>
                  <p className="text-xs text-emerald-300/80 leading-relaxed">
                    Sipariş edilen miktar ile ambara inen miktar %100 örtüşüyor. İrsaliye doğrudan
                    muhasebeye aktarılabilir.
                  </p>
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-blue-950/40 border border-blue-800/80 space-y-2">
                  <div className="flex items-center gap-2 text-blue-400 font-bold text-xs uppercase">
                    <Package className="w-4 h-4" />
                    Fazla Teslimat
                  </div>
                  <div className="text-2xl font-black text-blue-400 font-mono">
                    +{difference.toFixed(2)} {currentPR?.unit}
                  </div>
                  <p className="text-xs text-blue-300/80 leading-relaxed">
                    Sipariş miktarından daha fazla mal indi. Fazla stok ambar envanterine işlenecektir.
                  </p>
                </div>
              )
            ) : (
              <div className="p-6 text-center rounded-xl bg-slate-950 border border-slate-800 text-slate-500 text-xs">
                Miktar farkı görmek için ambara inen miktarı giriniz.
              </div>
            )}

            {/* Summary Metrics */}
            <div className="space-y-2 pt-2 border-t border-slate-800/80 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Sipariş Miktarı:</span>
                <span className="font-bold text-white">{orderedQty} {currentPR?.unit}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>İnen Miktar:</span>
                <span className="font-bold text-emerald-400">{deliveredQtyNum} {currentPR?.unit}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Fark Oranı:</span>
                <span className="font-mono font-bold text-white">
                  {orderedQty > 0 ? ((difference / orderedQty) * 100).toFixed(1) : 0}%
                </span>
              </div>
            </div>
          </div>

          {/* Quick Info Box */}
          <div className="p-4 rounded-2xl bg-slate-900/50 border border-slate-800 text-xs text-slate-400 space-y-2">
            <span className="font-bold text-slate-300 block">📌 İrsaliye Kabul Kuralları:</span>
            <ul className="list-disc list-inside space-y-1 text-[11px] text-slate-400">
              <li>Islak imzalı sevk irsaliyesi teslim alınmadan onay vermeyiniz.</li>
              <li>Ağır malzemelerde kantar tartım fişi no irsaliyeye eklenmelidir.</li>
              <li>Hasarlı veya uygunsuz ambalajlar derhal şantiye şefine bildirilir.</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Recent Receipts Table */}
      {recentReceipts.length > 0 && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden shadow-xl">
          <div className="p-4 border-b border-slate-800 bg-slate-950/70">
            <h2 className="text-sm font-bold text-white">Son Ambar Mal Kabul Kayıtları</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/90 text-slate-400 font-semibold uppercase">
                  <th className="py-3 px-4">İrsaliye No</th>
                  <th className="py-3 px-4">Malzeme</th>
                  <th className="py-3 px-4 text-right">Sipariş Qty</th>
                  <th className="py-3 px-4 text-right">Ambara İnen Qty</th>
                  <th className="py-3 px-4 text-right">Miktar Farkı</th>
                  <th className="py-3 px-4">Teslim Alan</th>
                  <th className="py-3 px-4">Tarih</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {recentReceipts.slice(0, 5).map((r) => {
                  const diff = r.deliveredQuantity - r.orderedQuantity
                  return (
                    <tr key={r.id} className="hover:bg-slate-800/30">
                      <td className="py-2.5 px-4 font-mono font-bold text-white">{r.waybillNo}</td>
                      <td className="py-2.5 px-4 font-semibold text-slate-200">
                        {r.purchaseRequest?.materialName || "Malzeme"}
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono">{r.orderedQuantity}</td>
                      <td className="py-2.5 px-4 text-right font-mono font-bold text-emerald-400">
                        {r.deliveredQuantity}
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono font-bold">
                        {diff < 0 ? (
                          <span className="text-rose-400">{diff.toFixed(2)} (Eksik)</span>
                        ) : diff > 0 ? (
                          <span className="text-blue-400">+{diff.toFixed(2)}</span>
                        ) : (
                          <span className="text-emerald-400">0.00 (Tam)</span>
                        )}
                      </td>
                      <td className="py-2.5 px-4">{r.receivedBy?.name || "Personel"}</td>
                      <td className="py-2.5 px-4 text-slate-500">
                        {new Date(r.receivedDate).toLocaleDateString("tr-TR")}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
