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
  ShieldCheck
} from "lucide-react"
import { toast } from "react-hot-toast"

interface CreateContractModalProps {
  isOpen: boolean
  onClose: () => void
  projects?: Array<{ id: string; name: string }>
  onSuccess?: () => void
}

export default function CreateContractModal({
  isOpen,
  onClose,
  projects = [],
  onSuccess,
}: CreateContractModalProps) {
  const [formData, setFormData] = useState({
    title: "",
    contractType: "FRANCHISE",
    partyA: "Nexa Franchise A.Ş.",
    partyB: "",
    projectId: projects[0]?.id || "",
    startDate: new Date().toISOString().split("T")[0],
    endDate: new Date(Date.now() + 365 * 86400000).toISOString().split("T")[0],
    amount: "1500000",
    pdfFileName: "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (!isOpen) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.title.trim()) {
      toast.error("Lütfen sözleşme başlığını girin.")
      return
    }
    if (!formData.partyB.trim()) {
      toast.error("Lütfen karşı taraf (yüklenici / franchise alan) bilgisini belirtin.")
      return
    }

    setIsSubmitting(true)
    setTimeout(() => {
      setIsSubmitting(false)
      toast.success(`"${formData.title}" sözleşmesi başarıyla kaydedildi!`)
      onClose()
      if (onSuccess) onSuccess()
    }, 600)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <FileSignature className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Yeni Sözleşme Tanımla</h3>
              <p className="text-xs text-slate-400">Franchise, taşeron hakediş ve tedarik taahhütleri</p>
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
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Sözleşme Başlığı / Konusu <span className="text-amber-400">*</span>
            </label>
            <input
              type="text"
              placeholder="Örn: İskenderun Şubesi Ana Franchise & Lisans Sözleşmesi"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3.5 py-2.5 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
              required
            />
          </div>

          {/* Sözleşme Tipi & Proje */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Sözleşme Tipi
              </label>
              <select
                value={formData.contractType}
                onChange={(e) => setFormData({ ...formData, contractType: e.target.value })}
                className="w-full px-3.5 py-2.5 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-amber-500"
              >
                <option value="FRANCHISE">Franchise & İsim Hakkı Sözleşmesi</option>
                <option value="SUBCONTRACTOR">Alt Taşeron İmalat & Montaj</option>
                <option value="SUPPLY">Tedarik & Mal Alım Protokolü</option>
                <option value="LEASE">Kira & Yer Tahsis Kontratı</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-amber-400" />
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
                    <option value="proj-1">İskenderun Sahil Rezidans & AVM</option>
                    <option value="proj-2">Zorlu Center Bistro</option>
                    <option value="proj-3">Bağdat Caddesi Flagship</option>
                  </>
                )}
              </select>
            </div>
          </div>

          {/* Taraflar (Party A & Party B) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Taraf A (Franchisor / İşveren)
              </label>
              <input
                type="text"
                value={formData.partyA}
                onChange={(e) => setFormData({ ...formData, partyA: e.target.value })}
                className="w-full px-3.5 py-2.5 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-amber-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Taraf B (Franchisee / Taşeron Firma) <span className="text-amber-400">*</span>
              </label>
              <input
                type="text"
                placeholder="Örn: Akdeniz Perakende Gıda Ltd. Şti."
                value={formData.partyB}
                onChange={(e) => setFormData({ ...formData, partyB: e.target.value })}
                className="w-full px-3.5 py-2.5 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                required
              />
            </div>
          </div>

          {/* Başlangıç ve Bitiş Tarihleri */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-blue-400" />
                <span>Başlangıç Tarihi</span>
              </label>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                className="w-full px-3.5 py-2.5 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-amber-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-blue-400" />
                <span>Bitiş Tarihi</span>
              </label>
              <input
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                className="w-full px-3.5 py-2.5 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-amber-500"
                required
              />
            </div>
          </div>

          {/* Sözleşme Bedeli */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
              <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
              <span>Sözleşme Toplam Bedeli (₺)</span>
            </label>
            <input
              type="number"
              placeholder="Örn: 2400000"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              className="w-full px-3.5 py-2.5 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-amber-500"
              required
            />
          </div>

          {/* PDF Yükleme Alanı */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-rose-400" />
              <span>İmzalı Sözleşme Belgesi (PDF)</span>
            </label>
            <label className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-950 border border-dashed border-slate-800 hover:border-amber-500 cursor-pointer text-xs text-slate-400 transition-all">
              <div className="flex items-center gap-2">
                <UploadCloud className="w-4 h-4 text-amber-400" />
                <span className="truncate">{formData.pdfFileName || "Islak imzalı veya e-imzalı PDF sözleşme yükle"}</span>
              </div>
              <span className="px-2.5 py-1 rounded-md bg-amber-500/10 text-amber-400 text-[10px] font-bold border border-amber-500/20">
                PDF Seç
              </span>
              <input
                type="file"
                accept=".pdf"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) setFormData({ ...formData, pdfFileName: file.name })
                }}
              />
            </label>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
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
              <span>{isSubmitting ? "Kaydediliyor..." : "Sözleşmeyi Onayla ve Kaydet"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

