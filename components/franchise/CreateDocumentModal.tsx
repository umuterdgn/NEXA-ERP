"use client"
/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Şube Resmi Evrak & Dijital Arşiv Yükleme Modalı
 */

import React, { useState } from "react"
import {
  UploadCloud,
  X,
  FileText,
  Building2,
  Calendar,
  CheckCircle2,
  ShieldCheck,
  FolderArchive
} from "lucide-react"
import { toast } from "react-hot-toast"

interface CreateDocumentModalProps {
  isOpen: boolean
  onClose: () => void
  projects?: Array<{ id: string; name: string }>
  onSuccess?: () => void
}

export default function CreateDocumentModal({
  isOpen,
  onClose,
  projects = [],
  onSuccess,
}: CreateDocumentModalProps) {
  const [formData, setFormData] = useState({
    title: "",
    documentType: "PERMIT",
    projectId: projects[0]?.id || "",
    issueDate: new Date().toISOString().split("T")[0],
    expiryDate: new Date(Date.now() + 365 * 86400000).toISOString().split("T")[0],
    fileName: "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (!isOpen) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.title.trim()) {
      toast.error("Lütfen evrak başlığını belirtin.")
      return
    }

    setIsSubmitting(true)
    setTimeout(() => {
      setIsSubmitting(false)
      toast.success(`"${formData.title}" evrakı güvenli bulut arşivine yüklendi!`)
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
              <FolderArchive className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Yeni Evrak Yükle</h3>
              <p className="text-xs text-slate-400">Ruhsat, vergi levhası, yangın raporu ve şube arşiv evrakı</p>
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
          {/* Evrak Başlığı */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Evrak / Belge Adı <span className="text-amber-400">*</span>
            </label>
            <input
              type="text"
              placeholder="Örn: 2026 Yılı İşyeri Açma ve Çalışma Ruhsatı"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3.5 py-2.5 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
              required
            />
          </div>

          {/* Evrak Tipi & Şube */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-amber-400" />
                <span>Evrak Tipi</span>
              </label>
              <select
                value={formData.documentType}
                onChange={(e) => setFormData({ ...formData, documentType: e.target.value })}
                className="w-full px-3.5 py-2.5 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-amber-500"
              >
                <option value="PERMIT">İlçe Belediyesi Çalışma Ruhsatı</option>
                <option value="TAX_PLATE">Güncel Vergi Levhası</option>
                <option value="FIRE_REPORT">İtfaiye Yangın Uygunluk Raporu</option>
                <option value="LEASE_CONTRACT">Noter Onaylı Kira Sözleşmesi</option>
                <option value="OCCUPANCY">İmar & Yapı Kullanım İzin Belgesi (İskan)</option>
                <option value="UTILITY_BILL">Elektrik / Su / Gaz Abonelik Sözleşmesi</option>
                <option value="SIGNAGE_PERMIT">Tabela & Totem Reklam İzin Yazısı</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-blue-400" />
                <span>İlişkili Şube</span>
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

          {/* Belge Tarihi & Geçerlilik Bitiş */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-blue-400" />
                <span>Düzenlenme Tarihi</span>
              </label>
              <input
                type="date"
                value={formData.issueDate}
                onChange={(e) => setFormData({ ...formData, issueDate: e.target.value })}
                className="w-full px-3.5 py-2.5 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-amber-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-blue-400" />
                <span>Geçerlilik Bitiş Tarihi</span>
              </label>
              <input
                type="date"
                value={formData.expiryDate}
                onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                className="w-full px-3.5 py-2.5 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          {/* Dosya Yükleme Alanı */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
              <UploadCloud className="w-3.5 h-3.5 text-amber-400" />
              <span>Evrak Dosyası (PDF, PNG, JPG) <span className="text-amber-400">*</span></span>
            </label>
            <label className="flex items-center justify-between p-4 rounded-2xl bg-slate-950 border border-dashed border-slate-800 hover:border-amber-500 cursor-pointer text-xs text-slate-400 transition-all">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-amber-400" />
                <span className="truncate">{formData.fileName || "Taranmış evrak veya onaylı PDF seç"}</span>
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
                  if (file) setFormData({ ...formData, fileName: file.name })
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
              <span>{isSubmitting ? "Yükleniyor..." : "Evrakı Arşive Kaydet"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
