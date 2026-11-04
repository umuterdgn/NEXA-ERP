"use client"
/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Şube Aylık Ciro & Royalty Beyan Modalı
 */

import React, { useState } from "react"
import {
  TrendingUp,
  X,
  Building2,
  Calendar,
  DollarSign,
  FileText,
  UploadCloud,
  CheckCircle2,
  Percent,
  Receipt
} from "lucide-react"
import { toast } from "react-hot-toast"

interface CreateRoyaltyModalProps {
  isOpen: boolean
  onClose: () => void
  projects?: Array<{ id: string; name: string }>
  onSuccess?: () => void
}

export default function CreateRoyaltyModal({
  isOpen,
  onClose,
  projects = [],
  onSuccess,
}: CreateRoyaltyModalProps) {
  const [formData, setFormData] = useState({
    projectId: projects[0]?.id || "",
    period: "Ekim 2026",
    grossRevenue: "950000",
    zReportFileName: "",
    posTerminalCount: "3",
    notes: "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (!isOpen) return null

  const revenueNum = parseFloat(formData.grossRevenue) || 0
  const royaltyFee = Math.round(revenueNum * 0.04) // %4
  const marketingFee = Math.round(revenueNum * 0.01) // %1
  const totalFeeDue = royaltyFee + marketingFee

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!revenueNum || revenueNum <= 0) {
      toast.error("Lütfen geçerli bir aylık brüt ciro tutarı girin.")
      return
    }

    setIsSubmitting(true)
    setTimeout(() => {
      setIsSubmitting(false)
      toast.success(
        `${formData.period} dönemi için ${revenueNum.toLocaleString("tr-TR")} ₺ ciro beyanı ve Z Raporu başarıyla işlendi!`
      )
      onClose()
      if (onSuccess) onSuccess()
    }, 500)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg max-h-[90vh] flex flex-col shadow-2xl overflow-hidden relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Yeni Ciro Beyanı & Z Raporu Gir</h3>
              <p className="text-xs text-slate-400">Şube aylık brüt satış hasılatı ve royalty tahakkuk fişi</p>
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Şube & Dönem */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-amber-400" />
                <span>Beyan Veren Şube</span>
              </label>
              <select
                value={formData.projectId}
                onChange={(e) => setFormData({ ...formData, projectId: e.target.value })}
                className="w-full px-3.5 py-2.5 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-amber-500"
              >
                {projects.length > 0 ? (
                  projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))
                ) : (
                  <>
                    <option value="p1">İskenderun Sahil Rezidans & AVM</option>
                    <option value="p2">Zorlu Center Cafe</option>
                    <option value="p3">Bağdat Caddesi Flagship</option>
                  </>
                )}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-blue-400" />
                <span>Hesap Dönemi (Ay / Yıl)</span>
              </label>
              <select
                value={formData.period}
                onChange={(e) => setFormData({ ...formData, period: e.target.value })}
                className="w-full px-3.5 py-2.5 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-amber-500"
              >
                <option value="Ekim 2026">Ekim 2026</option>
                <option value="Eylül 2026">Eylül 2026</option>
                <option value="Ağustos 2026">Ağustos 2026</option>
                <option value="Temmuz 2026">Temmuz 2026</option>
              </select>
            </div>
          </div>

          {/* Aylık Toplam Ciro Tutarı */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
              <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
              <span>Aylık Toplam Brüt Satış Cirosu (₺) <span className="text-amber-400">*</span></span>
            </label>
            <input
              type="number"
              min="1000"
              step="any"
              placeholder="Örn: 950000"
              value={formData.grossRevenue}
              onChange={(e) => setFormData({ ...formData, grossRevenue: e.target.value })}
              className="w-full px-3.5 py-2.5 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white font-mono text-base font-bold focus:outline-none focus:border-amber-500"
              required
            />
          </div>

          {/* Otomatik Royalty Hesap Tablosu */}
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2.5">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
              <span>Otomatik Hesaplanan Katılım Payları</span>
              <span className="text-amber-400 font-mono">%5 Toplam</span>
            </div>

            <div className="flex items-center justify-between text-xs py-1 border-b border-slate-800/80">
              <span className="text-slate-400">%4 Franchise İsim Hakkı (Royalty):</span>
              <span className="font-mono font-bold text-white">{royaltyFee.toLocaleString("tr-TR")} ₺</span>
            </div>

            <div className="flex items-center justify-between text-xs py-1 border-b border-slate-800/80">
              <span className="text-slate-400">%1 Ulusal Reklam & Pazarlama Fonu:</span>
              <span className="font-mono font-bold text-white">{marketingFee.toLocaleString("tr-TR")} ₺</span>
            </div>

            <div className="flex items-center justify-between text-sm pt-1 font-bold text-emerald-400">
              <span>Toplam Tahakkuk Eden Tutar:</span>
              <span className="font-mono text-base">{totalFeeDue.toLocaleString("tr-TR")} ₺</span>
            </div>
          </div>

          {/* Z Raporu Kanıt Yükleme */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
              <Receipt className="w-3.5 h-3.5 text-amber-400" />
              <span>Aylık Mali Z Raporu Belgesi (PDF / Görsel) <span className="text-amber-400">*</span></span>
            </label>
            <label className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-950 border border-dashed border-slate-800 hover:border-amber-500 cursor-pointer text-xs text-slate-400 transition-all">
              <div className="flex items-center gap-2">
                <UploadCloud className="w-4 h-4 text-amber-400" />
                <span className="truncate">{formData.zReportFileName || "Aylık Z Raporu, POS Mali Kümülatif Fişi Seç"}</span>
              </div>
              <span className="px-2.5 py-1 rounded-md bg-amber-500/10 text-amber-400 text-[10px] font-bold border border-amber-500/20">
                Dosya Seç
              </span>
              <input
                type="file"
                accept=".pdf,.png,.jpg,.jpeg"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) setFormData({ ...formData, zReportFileName: file.name })
                }}
              />
            </label>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
            >
              Vazgeç
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white text-xs font-bold shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isSubmitting ? "İşleniyor..." : "Ciro Beyanını Onayla"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
