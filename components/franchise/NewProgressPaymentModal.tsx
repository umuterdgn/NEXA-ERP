"use client"
/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Franchise Yeni Hakediş Düzenleme Modalı
 */

import React, { useState, useEffect } from "react"
import {
  Receipt,
  X,
  Building2,
  Calendar,
  DollarSign,
  Percent,
  AlertTriangle,
  MinusCircle,
  PlusCircle,
  CheckCircle2,
  FileSignature,
  Loader2,
  Calculator
} from "lucide-react"
import { toast } from "react-hot-toast"
import { useRouter } from "next/navigation"

interface NewProgressPaymentModalProps {
  isOpen: boolean
  onClose: () => void
  contracts?: Array<{
    id: string
    title: string
    totalAmount?: number
    project?: { id: string; name?: string | null } | null
    subcontractor?: { id: string; name?: string | null } | null
  }>
  onSuccess?: () => void
}

export default function NewProgressPaymentModal({
  isOpen,
  onClose,
  contracts = [],
  onSuccess,
}: NewProgressPaymentModalProps) {
  const router = useRouter()
  const [selectedContractId, setSelectedContractId] = useState(contracts[0]?.id || "")
  const [billingNumber, setBillingNumber] = useState("1")
  const [period, setPeriod] = useState(new Date().toISOString().slice(0, 7)) // YYYY-MM
  const [progressPercentage, setProgressPercentage] = useState("25")
  const [grossAmount, setGrossAmount] = useState("450000")
  const [advanceDeduction, setAdvanceDeduction] = useState("50000")
  const [penaltyDeduction, setPenaltyDeduction] = useState("0")
  const [retentionPercent, setRetentionPercent] = useState("5") // %5 Teminat
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Otomatik hesaplanan kesintiler ve net ödenecek
  const gross = parseFloat(grossAmount) || 0
  const advance = parseFloat(advanceDeduction) || 0
  const penalty = parseFloat(penaltyDeduction) || 0
  const retention = (gross * (parseFloat(retentionPercent) || 5)) / 100
  const totalDeductions = advance + penalty + retention
  const netPayable = Math.max(0, gross - totalDeductions)

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!grossAmount || gross <= 0) {
      toast.error("Lütfen geçerli bir brüt hakediş tutarı girin.")
      return
    }

    setIsSubmitting(true)

    try {
      const res = await fetch("/api/franchise/progress-billing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contractId: selectedContractId || contracts[0]?.id,
          billingNumber: parseInt(billingNumber) || 1,
          period: `${period}-01`,
          progressPercentage: parseFloat(progressPercentage) || 0,
          grossAmount: gross,
          advanceDeduction: advance,
          penaltyDeduction: penalty,
          retentionDeduction: retention,
          netPayable,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || "Hakediş kaydedilemedi")
      }

      toast.success(
        `HK-${billingNumber} numaralı hakediş (Net: ₺${netPayable.toLocaleString("tr-TR")}) başarıyla onaylandı!`
      )

      router.refresh()
      if (onSuccess) onSuccess()
      onClose()
    } catch (err: any) {
      console.error("[NewProgressPaymentModal Submit Error]:", err)
      toast.error(err?.message || "Hakediş düzenlenirken hata oluştu.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Yeni Hakediş Düzenle (Progress Payment)</h3>
              <p className="text-xs text-slate-400">İmalat yüzdesi, brüt tutar ve otomatik teminat/avans kesintileri</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="text-slate-400 hover:text-white p-1.5 rounded-xl hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* İlgili Sözleşme & Şube */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
              <FileSignature className="w-3.5 h-3.5 text-amber-400" />
              <span>Bağlı Taşeron Sözleşmesi *</span>
            </label>
            <select
              value={selectedContractId}
              onChange={(e) => setSelectedContractId(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-amber-500"
              disabled={isSubmitting}
            >
              {contracts.length > 0 ? (
                contracts.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title} • {c.project?.name || "Şube"} (
                    {c.subcontractor?.name || "Taşeron"})
                  </option>
                ))
              ) : (
                <option value="default-c1">Cadde Mağazası Fit-Out İnce İşler Sözleşmesi</option>
              )}
            </select>
          </div>

          {/* Hakediş No & Dönem (Ay/Yıl) */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                <Receipt className="w-3.5 h-3.5 text-blue-400" />
                <span>Hakediş No *</span>
              </label>
              <div className="flex items-center bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs">
                <span className="text-amber-400 font-bold font-mono mr-1">HK-</span>
                <input
                  type="number"
                  required
                  min="1"
                  value={billingNumber}
                  onChange={(e) => setBillingNumber(e.target.value)}
                  placeholder="1"
                  className="w-full bg-transparent text-white focus:outline-none font-mono"
                  disabled={isSubmitting}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-purple-400" />
                <span>Hakediş Dönemi (Ay/Yıl) *</span>
              </label>
              <input
                type="month"
                required
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                className="w-full px-3.5 py-2 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-amber-500 font-mono"
                disabled={isSubmitting}
              />
            </div>
          </div>

          {/* Yapılan İmalat Yüzdesi & Brüt Tutar */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                <Percent className="w-3.5 h-3.5 text-emerald-400" />
                <span>Yapılan İmalat Yüzdesi (%)</span>
              </label>
              <input
                type="number"
                min="1"
                max="100"
                step="1"
                required
                value={progressPercentage}
                onChange={(e) => setProgressPercentage(e.target.value)}
                placeholder="25"
                className="w-full px-3.5 py-2.5 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-emerald-500 font-mono"
                disabled={isSubmitting}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                <span>Brüt Hakediş Tutarı (₺) *</span>
              </label>
              <input
                type="number"
                required
                min="0"
                step="1000"
                value={grossAmount}
                onChange={(e) => setGrossAmount(e.target.value)}
                placeholder="450000"
                className="w-full px-3.5 py-2.5 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-emerald-500 font-mono font-bold"
                disabled={isSubmitting}
              />
            </div>
          </div>

          {/* KESİNTİLER BÖLÜMÜ */}
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between text-xs font-bold text-slate-200 border-b border-slate-800/80 pb-2">
              <span className="flex items-center gap-1.5 text-amber-400">
                <MinusCircle className="w-4 h-4 text-amber-400" />
                Yasal ve Sözleşmesel Kesintiler
              </span>
              <span className="text-slate-400 font-mono font-normal">
                Toplam Kesinti: ₺{totalDeductions.toLocaleString("tr-TR")}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Avans Mahsubu (₺)</label>
                <input
                  type="number"
                  min="0"
                  value={advanceDeduction}
                  onChange={(e) => setAdvanceDeduction(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs bg-slate-900 border border-slate-800 rounded-lg text-white font-mono"
                  disabled={isSubmitting}
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Ceza / İhlal (₺)</label>
                <input
                  type="number"
                  min="0"
                  value={penaltyDeduction}
                  onChange={(e) => setPenaltyDeduction(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs bg-slate-900 border border-slate-800 rounded-lg text-white font-mono"
                  disabled={isSubmitting}
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Teminat (%{retentionPercent})</label>
                <div className="px-2.5 py-1.5 text-xs bg-slate-900 border border-slate-800 rounded-lg text-amber-300 font-mono font-bold">
                  ₺{retention.toLocaleString("tr-TR")}
                </div>
              </div>
            </div>
          </div>

          {/* NET ÖDENECEK HESAPLAMA KARTI */}
          <div className="p-4 rounded-2xl bg-emerald-950/30 border border-emerald-800/50 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                <Calculator className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs text-emerald-400 font-semibold uppercase tracking-wider block">
                  Net Ödenecek Tutar (KDV Hariç)
                </span>
                <span className="text-xs text-slate-400">
                  Brüt - (Avans + Ceza + Teminat)
                </span>
              </div>
            </div>
            <div className="text-xl md:text-2xl font-black font-mono text-emerald-400">
              ₺{netPayable.toLocaleString("tr-TR")}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2.5 rounded-xl border border-slate-800 text-xs font-semibold text-slate-300 hover:bg-slate-800 transition-colors"
            >
              Vazgeç
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white text-xs font-bold transition-all shadow-lg shadow-amber-500/20 disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Onaylanıyor...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Hakedişi Kesinleştir ve Onayla</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
