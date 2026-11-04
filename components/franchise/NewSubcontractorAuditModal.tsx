"use client"
/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Franchise Yeni Taşeron Denetimi Oluşturma Modalı
 */

import React, { useState } from "react"
import {
  ShieldCheck,
  X,
  Building2,
  Calendar,
  Users,
  Award,
  FileText,
  UploadCloud,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  FileCheck
} from "lucide-react"
import { toast } from "react-hot-toast"
import { useRouter } from "next/navigation"

interface NewSubcontractorAuditModalProps {
  isOpen: boolean
  onClose: () => void
  projects?: Array<{ id: string; name?: string | null }>
  subcontractors?: Array<{ id: string; name: string }>
  onSuccess?: () => void
}

export default function NewSubcontractorAuditModal({
  isOpen,
  onClose,
  projects = [],
  subcontractors = [],
  onSuccess,
}: NewSubcontractorAuditModalProps) {
  const router = useRouter()
  const [title, setTitle] = useState("")
  const [subcontractorId, setSubcontractorId] = useState(subcontractors[0]?.id || "")
  const [subcontractorName, setSubcontractorName] = useState("")
  const [projectId, setProjectId] = useState(projects[0]?.id || "")
  const [auditType, setAuditType] = useState<"OHS" | "QUALITY" | "COMBINED">("OHS")
  const [score, setScore] = useState("88")
  const [auditDate, setAuditDate] = useState(new Date().toISOString().split("T")[0])
  const [pdfFileName, setPdfFileName] = useState("")
  const [notes, setNotes] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (!isOpen) return null

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      if (file.name.toLowerCase().endsWith(".pdf")) {
        setPdfFileName(file.name)
      } else {
        toast.error("Lütfen PDF formatında bir denetim tutanağı seçin.")
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!title.trim()) {
      toast.error("Lütfen denetim tutanağı başlığını girin.")
      return
    }

    const numericScore = parseInt(score) || 80
    if (numericScore < 1 || numericScore > 100) {
      toast.error("Puan 1 ile 100 arasında olmalıdır.")
      return
    }

    setIsSubmitting(true)

    try {
      const res = await fetch("/api/franchise/subcontractor-audits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          subcontractorId: subcontractorId || undefined,
          subcontractorName: subcontractorName || (subcontractors.find((s) => s.id === subcontractorId)?.name),
          projectId: projectId || projects[0]?.id,
          type: auditType,
          score: numericScore,
          auditDate,
          notes: notes.trim(),
          pdfReportUrl: pdfFileName ? `/reports/audits/${encodeURIComponent(pdfFileName)}` : null,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || "Denetim kaydı oluşturulamadı")
      }

      toast.success(
        `"${title}" denetimi (${numericScore}/100) başarıyla kaydedildi!`
      )

      router.refresh()
      if (onSuccess) onSuccess()
      onClose()
    } catch (err: any) {
      console.error("[NewSubcontractorAuditModal Error]:", err)
      toast.error(err?.message || "Denetim kaydedilirken hata oluştu.")
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
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Yeni Taşeron Denetimi Oluştur</h3>
              <p className="text-xs text-slate-400">İSG ve Kalite Puanlaması, denetim tutanağı ve saha uygunluk raporu</p>
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
          {/* Denetim Başlığı */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-amber-400" />
              <span>Denetim Tutanağı Başlığı *</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Örn: 3. Etap İskele Kurulumu ve İSG Güvenlik Denetimi"
              className="w-full px-3.5 py-2.5 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:border-amber-500"
              disabled={isSubmitting}
            />
          </div>

          {/* Taşeron Firma Seçimi */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-purple-400" />
                <span>Taşeron Firma (Select) *</span>
              </label>
              {subcontractors.length > 0 ? (
                <select
                  value={subcontractorId}
                  onChange={(e) => setSubcontractorId(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-amber-500"
                  disabled={isSubmitting}
                >
                  {subcontractors.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  required
                  value={subcontractorName}
                  onChange={(e) => setSubcontractorName(e.target.value)}
                  placeholder="Örn: Özkan Çelik & Demir Ltd."
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:border-amber-500"
                  disabled={isSubmitting}
                />
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-blue-400" />
                <span>Denetlenen Şube / Proje</span>
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
          </div>

          {/* Denetim Türü & İSG/Kalite Puanı (1-100) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Denetim Türü</span>
              </label>
              <select
                value={auditType}
                onChange={(e) => setAuditType(e.target.value as any)}
                className="w-full px-3.5 py-2.5 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-amber-500"
                disabled={isSubmitting}
              >
                <option value="OHS">İSG Denetimi (İş Sağlığı ve Güvenliği)</option>
                <option value="QUALITY">Teknik Kalite Kontrol (QA/QC)</option>
                <option value="COMBINED">Birleşik İSG & İmalat Uygunluk</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-amber-400 font-bold">
                  <Award className="w-3.5 h-3.5 text-amber-400" />
                  İSG & Kalite Puanı (1-100) *
                </span>
                <span className={`text-[11px] font-bold font-mono ${
                  parseInt(score) >= 75 ? "text-emerald-400" : parseInt(score) >= 50 ? "text-amber-400" : "text-red-400"
                }`}>
                  {parseInt(score) >= 75 ? "BAŞARILI" : parseInt(score) >= 50 ? "ŞARTLI GEÇTİ" : "UYGUNSUZ"}
                </span>
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="1"
                  max="100"
                  required
                  value={score}
                  onChange={(e) => setScore(e.target.value)}
                  className="w-24 px-3.5 py-2 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-amber-500 font-mono font-bold text-center"
                  disabled={isSubmitting}
                />
                <input
                  type="range"
                  min="1"
                  max="100"
                  value={score}
                  onChange={(e) => setScore(e.target.value)}
                  className="flex-1 accent-amber-500 cursor-pointer"
                  disabled={isSubmitting}
                />
              </div>
            </div>
          </div>

          {/* Denetim Tarihi */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>Denetim Tarihi *</span>
            </label>
            <input
              type="date"
              required
              value={auditDate}
              onChange={(e) => setAuditDate(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-amber-500"
              disabled={isSubmitting}
            />
          </div>

          {/* Denetim Tutanağı (PDF) Yükleme Alanı */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
              <FileCheck className="w-3.5 h-3.5 text-blue-400" />
              <span>Denetim Tutanağı (PDF Dosyası)</span>
            </label>
            <div
              className={`border-2 border-dashed rounded-2xl p-4 text-center cursor-pointer transition-all ${
                pdfFileName
                  ? "border-emerald-500/60 bg-emerald-950/20"
                  : "border-slate-800 bg-slate-950/60 hover:border-slate-700"
              }`}
              onClick={() => document.getElementById("audit-pdf-input")?.click()}
            >
              <input
                id="audit-pdf-input"
                type="file"
                accept=".pdf"
                className="hidden"
                onChange={handleFileChange}
                disabled={isSubmitting}
              />
              {pdfFileName ? (
                <div className="flex items-center justify-center gap-2 text-emerald-400">
                  <CheckCircle2 className="w-4 h-4" />
                  <span className="text-xs font-bold font-mono">{pdfFileName}</span>
                  <span className="text-[11px] text-slate-400">(Tıklayarak değiştirin)</span>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2 text-slate-400">
                  <UploadCloud className="w-4 h-4 text-amber-400" />
                  <span className="text-xs">İmzalı Saha Denetim Tutanağı (PDF) seçin veya sürükleyin</span>
                </div>
              )}
            </div>
          </div>

          {/* Notlar & Tespitler */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Denetim Tespitleri & Aksiyon Maddeleri
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="KKD kontrolü, güvenlik filesi, topraklama ölçümü ve eksik tespitleri..."
              className="w-full px-3.5 py-2 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:border-amber-500"
              disabled={isSubmitting}
            />
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
                  <ShieldCheck className="w-4 h-4" />
                  <span>Denetim Raporunu Kaydet</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

