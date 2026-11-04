"use client"
/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Şube Kalite & Gizli Müşteri Denetim Raporu Yükleme Modalı
 */

import React, { useState } from "react"
import {
  Store,
  X,
  Star,
  Building2,
  Calendar,
  User,
  FileText,
  UploadCloud,
  CheckCircle2,
  Award,
  AlertCircle
} from "lucide-react"
import { toast } from "react-hot-toast"

interface CreateAuditReportModalProps {
  isOpen: boolean
  onClose: () => void
  projects?: Array<{ id: string; name: string }>
  onSuccess?: () => void
}

export default function CreateAuditReportModal({
  isOpen,
  onClose,
  projects = [],
  onSuccess,
}: CreateAuditReportModalProps) {
  const [formData, setFormData] = useState({
    projectId: projects[0]?.id || "",
    auditorName: "Barem Araştırma Grubu (Gizli Müşteri)",
    auditType: "MYSTERY_SHOPPING",
    date: new Date().toISOString().split("T")[0],
    score: 92,
    pdfFileName: "",
    summaryNotes: "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (!isOpen) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.auditorName.trim()) {
      toast.error("Lütfen denetmen adını girin.")
      return
    }

    setIsSubmitting(true)
    setTimeout(() => {
      setIsSubmitting(false)
      toast.success(
        `Denetim Raporu (${formData.score} Puan) başarıyla yüklendi ve sisteme kaydedildi!`
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
              <Store className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Denetim Raporu Yükle</h3>
              <p className="text-xs text-slate-400">Gizli müşteri, hijyen ve mağaza standart denetim belgesi</p>
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
          {/* Şube & Denetim Tipi */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-amber-400" />
                <span>Denetlenen Şube</span>
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
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Denetim Türü
              </label>
              <select
                value={formData.auditType}
                onChange={(e) => setFormData({ ...formData, auditType: e.target.value })}
                className="w-full px-3.5 py-2.5 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-amber-500"
              >
                <option value="MYSTERY_SHOPPING">Gizli Müşteri Denetimi</option>
                <option value="HYGIENE_SAFETY">Hijyen & Gıda Güvenliği Denetimi</option>
                <option value="OPERATIONAL">Standart Operasyonel Kalite</option>
                <option value="VISUAL_MERCH">Görsel Düzenleme & Vitrin Denetimi</option>
              </select>
            </div>
          </div>

          {/* Denetmen Adı & Tarih */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-blue-400" />
                <span>Denetmen / Kurum Adı <span className="text-amber-400">*</span></span>
              </label>
              <input
                type="text"
                placeholder="Örn: Barem Araştırma Grubu"
                value={formData.auditorName}
                onChange={(e) => setFormData({ ...formData, auditorName: e.target.value })}
                className="w-full px-3.5 py-2.5 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-amber-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-blue-400" />
                <span>Denetim Tarihi</span>
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

          {/* Genel Puan (1-100 & Yıldız) */}
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Award className="w-4 h-4 text-amber-400" />
                <span>Genel Denetim Kalite Puanı</span>
              </label>
              <span className={`text-base font-black font-mono ${
                formData.score >= 85 ? "text-emerald-400" : formData.score >= 70 ? "text-amber-400" : "text-rose-400"
              }`}>
                {formData.score} / 100
              </span>
            </div>

            <input
              type="range"
              min="1"
              max="100"
              value={formData.score}
              onChange={(e) => setFormData({ ...formData, score: parseInt(e.target.value) })}
              className="w-full accent-amber-500 cursor-pointer"
            />

            {/* Visual Stars */}
            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((starIdx) => {
                  const starScore = starIdx * 20
                  const isFilled = formData.score >= starScore - 10
                  return (
                    <Star
                      key={starIdx}
                      className={`w-4 h-4 ${
                        isFilled ? "text-amber-400 fill-amber-400" : "text-slate-700"
                      }`}
                    />
                  )
                })}
              </div>
              <span className="text-[11px] font-semibold text-slate-400">
                {formData.score >= 85 ? "Mükemmel (A+)" : formData.score >= 70 ? "Başarılı (B)" : "İyileştirme Gerekli"}
              </span>
            </div>
          </div>

          {/* Rapor Dosyası (PDF) */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-rose-400" />
              <span>Resmi Denetim Raporu Dosyası (PDF) <span className="text-amber-400">*</span></span>
            </label>
            <label className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-950 border border-dashed border-slate-800 hover:border-amber-500 cursor-pointer text-xs text-slate-400 transition-all">
              <div className="flex items-center gap-2">
                <UploadCloud className="w-4 h-4 text-amber-400" />
                <span className="truncate">{formData.pdfFileName || "Denetim Değerlendirme Raporu Seç (PDF)"}</span>
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

          {/* Özet Notlar */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Denetmen Yönetici Özeti & Aksiyon Notu
            </label>
            <textarea
              rows={2}
              placeholder="Örn: Müşteri karşılama süresi başarılı. Bar tezgahı altı temizlik standardına tam uyum sağlandı."
              value={formData.summaryNotes}
              onChange={(e) => setFormData({ ...formData, summaryNotes: e.target.value })}
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
              <span>{isSubmitting ? "Yükleniyor..." : "Raporu Kaydet"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

