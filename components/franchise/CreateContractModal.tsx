"use client"
/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Franchise & Taşeron Sözleşmesi Tanımlama Modalı
 */

import React, { useState } from "react"
import {
  FileSignature,
  X,
  Building2,
  Calendar,
  DollarSign,
  FileText,
  UploadCloud,
  CheckCircle2,
  Users,
  ShieldCheck,
  Percent,
  Layers,
  Coins,
  Loader2
} from "lucide-react"
import { toast } from "react-hot-toast"
import { useRouter } from "next/navigation"

interface CreateContractModalProps {
  isOpen: boolean
  onClose: () => void
  projects?: Array<{ id: string; name?: string | null }>
  onSuccess?: () => void
}

export default function CreateContractModal({
  isOpen,
  onClose,
  projects = [],
  onSuccess,
}: CreateContractModalProps) {
  const router = useRouter()
  const [title, setTitle] = useState("")
  const [partyB, setPartyB] = useState("")
  const [projectId, setProjectId] = useState(projects[0]?.id || "")
  const [scope, setScope] = useState("Kaba Yapı (Kalıp, Demir, Beton)")
  const [currency, setCurrency] = useState("TRY")
  const [amount, setAmount] = useState("1500000")
  const [retentionPercent, setRetentionPercent] = useState("5") // %5 Teminat kesintisi
  const [dailyPenalty, setDailyPenalty] = useState("2500")
  const [startDate, setStartDate] = useState(new Date().toISOString().split("T")[0])
  const [endDate, setEndDate] = useState(
    new Date(Date.now() + 180 * 86400000).toISOString().split("T")[0]
  )
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!title.trim()) {
      toast.error("Lütfen sözleşme başlığını girin.")
      return
    }
    if (!partyB.trim()) {
      toast.error("Lütfen yüklenici / taşeron firma adını girin.")
      return
    }

    setIsSubmitting(true)

    try {
      const res = await fetch("/api/franchise/contracts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          partyB: partyB.trim(),
          projectId: projectId || projects[0]?.id,
          amount: parseFloat(amount) || 0,
          currency,
          scope,
          retentionRate: (parseFloat(retentionPercent) || 5) / 100,
          dailyPenaltyRate: parseFloat(dailyPenalty) || 0,
          startDate,
          endDate,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || "Sözleşme kaydedilemedi")
      }

      toast.success(`"${title}" sözleşmesi finansal detaylarıyla başarıyla kaydedildi!`)

      router.refresh()
      if (onSuccess) onSuccess()
      onClose()
    } catch (err: any) {
      console.error("[CreateContractModal Error]:", err)
      toast.error(err?.message || "Sözleşme oluşturulurken bir hata oluştu.")
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
              <FileSignature className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Yeni Taşeron Sözleşmesi Tanımla</h3>
              <p className="text-xs text-slate-400">Sözleşme tutarı, kapsam, teminat kesintisi ve süre taahhütleri</p>
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
          {/* Sözleşme Başlığı */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-amber-400" />
              <span>Sözleşme Başlığı / Konusu *</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Örn: 2026 Kadıköy Şube İnce İşler & Asma Tavan Sözleşmesi"
              className="w-full px-3.5 py-2.5 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:border-amber-500"
              disabled={isSubmitting}
            />
          </div>

          {/* Proje ve Taşeron Firma */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-blue-400" />
                <span>İlgili Şube / Proje</span>
              </label>
              <select
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-amber-500"
                disabled={isSubmitting}
              >
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name || "Şube Projesi"}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-purple-400" />
                <span>Taşeron Firma (Yüklenici) *</span>
              </label>
              <input
                type="text"
                required
                value={partyB}
                onChange={(e) => setPartyB(e.target.value)}
                placeholder="Örn: Yılmaz İnşaat & Yapı San. Tic. Ltd."
                className="w-full px-3.5 py-2.5 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:border-amber-500"
                disabled={isSubmitting}
              />
            </div>
          </div>

          {/* KAPSAM (Scope) */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-emerald-400" />
              <span>Sözleşme Kapsamı *</span>
            </label>
            <select
              value={scope}
              onChange={(e) => setScope(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-amber-500"
              disabled={isSubmitting}
            >
              <option value="Kaba Yapı (Kalıp, Demir, Beton)">Kaba Yapı (Kalıp, Demir, Betonarme İmalat)</option>
              <option value="İnce İşler (Alçı, Boya, Seramik, Asma Tavan)">İnce İşler (Alçı, Boya, Seramik, Asma Tavan)</option>
              <option value="Mekanik, Havalandırma & Yangın Tesisatı">Mekanik, Havalandırma & Yangın Tesisatı</option>
              <option value="Elektrik Dağıtım, Aydınlatma & Zayıf Akım">Elektrik Dağıtım, Aydınlatma & Zayıf Akım</option>
              <option value="Mobilya, Raf & Sabit Ekipman Montajı">Mobilya, Raf & Sabit Ekipman Montajı</option>
              <option value="Dış Cephe Kompozit & Doğrama">Dış Cephe Kompozit & Alüminyum Doğrama</option>
            </select>
          </div>

          {/* Sözleşme Tutarı ve Para Birimi */}
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                <span>Sözleşme Tutarı *</span>
              </label>
              <input
                type="number"
                required
                min="0"
                step="1000"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="1500000"
                className="w-full px-3.5 py-2.5 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 font-mono font-bold"
                disabled={isSubmitting}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                <Coins className="w-3.5 h-3.5 text-amber-400" />
                <span>Para Birimi</span>
              </label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-amber-500 font-bold"
                disabled={isSubmitting}
              >
                <option value="TRY">TRY (₺)</option>
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
              </select>
            </div>
          </div>

          {/* Teminat Kesintisi ve Gecikme Cezası */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                <Percent className="w-3.5 h-3.5 text-amber-400" />
                <span>Teminat Kesintisi Yüzdesi (%)</span>
              </label>
              <input
                type="number"
                min="0"
                max="50"
                step="0.5"
                value={retentionPercent}
                onChange={(e) => setRetentionPercent(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-amber-500 font-mono"
                disabled={isSubmitting}
              />
              <span className="text-[10px] text-slate-500">Hakedişlerden otomatik kesilecek kesin teminat oranı</span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-red-400" />
                <span>Günlük Gecikme Cezası ({currency})</span>
              </label>
              <input
                type="number"
                min="0"
                value={dailyPenalty}
                onChange={(e) => setDailyPenalty(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-amber-500 font-mono"
                disabled={isSubmitting}
              />
            </div>
          </div>

          {/* Başlangıç ve Bitiş Tarihleri */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>Başlangıç Tarihi *</span>
              </label>
              <input
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-amber-500"
                disabled={isSubmitting}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>Taahhüt Bitiş Tarihi *</span>
              </label>
              <input
                type="date"
                required
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-amber-500"
                disabled={isSubmitting}
              />
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
                  <span>Kaydediliyor...</span>
                </>
              ) : (
                <>
                  <FileSignature className="w-4 h-4" />
                  <span>Sözleşmeyi Kaydet ve Onayla</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
