"use client"
/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Yeni Kasa / Finansal Hareket Ekleme Modalı
 */

import React, { useState } from "react"
import {
  Wallet,
  X,
  TrendingUp,
  TrendingDown,
  Calendar,
  DollarSign,
  Tag,
  Building2,
  CheckCircle2,
  FileText
} from "lucide-react"
import { toast } from "react-hot-toast"

interface CreateCashFlowModalProps {
  isOpen: boolean
  onClose: () => void
  projects?: Array<{ id: string; name: string }>
  onSuccess?: () => void
}

export default function CreateCashFlowModal({
  isOpen,
  onClose,
  projects = [],
  onSuccess,
}: CreateCashFlowModalProps) {
  const [transactionType, setTransactionType] = useState<"INCOME" | "EXPENSE">("INCOME")
  const [formData, setFormData] = useState({
    amount: "145000",
    date: new Date().toISOString().split("T")[0],
    category: "ROYALTY",
    projectId: projects[0]?.id || "",
    account: "BANK_GARANTI",
    description: "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (!isOpen) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const amountNum = parseFloat(formData.amount)
    if (!amountNum || amountNum <= 0) {
      toast.error("Lütfen geçerli bir tutar girin.")
      return
    }

    setIsSubmitting(true)
    setTimeout(() => {
      setIsSubmitting(false)
      toast.success(
        `${transactionType === "INCOME" ? "Gelir" : "Gider"} işlemi (${amountNum.toLocaleString("tr-TR")} ₺) kasaya işlendi!`
      )
      onClose()
      if (onSuccess) onSuccess()
    }, 500)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Yeni Kasa Hareketi Ekle</h3>
              <p className="text-xs text-slate-400">Nakit akışı, şube tahsilatları ve Capex harcama fişi</p>
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
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* İşlem Tipi (Gelir / Gider Toggle) */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              İşlem Yönü
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setTransactionType("INCOME")}
                className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold border transition-all ${
                  transactionType === "INCOME"
                    ? "bg-emerald-950/70 border-emerald-500 text-emerald-300 shadow-lg shadow-emerald-950"
                    : "bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700"
                }`}
              >
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                <span>Kasa Girişi (Gelir / Tahsilat)</span>
              </button>

              <button
                type="button"
                onClick={() => setTransactionType("EXPENSE")}
                className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold border transition-all ${
                  transactionType === "EXPENSE"
                    ? "bg-rose-950/70 border-rose-500 text-rose-300 shadow-lg shadow-rose-950"
                    : "bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700"
                }`}
              >
                <TrendingDown className="w-4 h-4 text-rose-400" />
                <span>Kasa Çıkışı (Gider / Ödeme)</span>
              </button>
            </div>
          </div>

          {/* Tutar & Tarih */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                <span>İşlem Tutarı (₺) <span className="text-amber-400">*</span></span>
              </label>
              <input
                type="number"
                min="1"
                step="any"
                placeholder="Örn: 85000"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                className="w-full px-3.5 py-2.5 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white font-mono focus:outline-none focus:border-amber-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-blue-400" />
                <span>İşlem Tarihi</span>
              </label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full px-3.5 py-2.5 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-amber-500"
                required
              />
            </div>
          </div>

          {/* Kategori & Şube */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-amber-400" />
                <span>İşlem Kategorisi</span>
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3.5 py-2.5 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-amber-500"
              >
                {transactionType === "INCOME" ? (
                  <>
                    <option value="ROYALTY">%4 İsim Hakkı (Royalty Geliri)</option>
                    <option value="MARKETING">%1 Ulusal Reklam & Pazarlama Fonu</option>
                    <option value="ENTRY_FEE">Franchise İlk Giriş & Lisans Bedeli</option>
                    <option value="MAINTENANCE">Periyodik Bakım & Yazılım Aidatı</option>
                    <option value="OTHER_INCOME">Diğer Gelirler</option>
                  </>
                ) : (
                  <>
                    <option value="SUPPLY_PURCHASE">Merkezi Mal Alımı & Hammadde</option>
                    <option value="SUBCONTRACTOR_PAYMENT">Taşeron Montaj & Hakediş Ödemesi</option>
                    <option value="RENT">Şube Kira & Stopaj Gideri</option>
                    <option value="EQUIPMENT_CAPEX">Makine & Demirbaş Alımı (Capex)</option>
                    <option value="UTILITY">Elektrik, Su & Altyapı Aboneliği</option>
                  </>
                )}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-blue-400" />
                <span>İlişkili Şube / Proje</span>
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
          </div>

          {/* Açıklama */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Açıklama / Dekont No
            </label>
            <textarea
              rows={2}
              placeholder="Örn: Ekim 2026 POS Ciro İsim Hakkı Payı Tahsilatı (Garanti Bankası)"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3.5 py-2.5 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
            />
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
              <span>{isSubmitting ? "Kaydediliyor..." : "Hareketi Kaydet"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

