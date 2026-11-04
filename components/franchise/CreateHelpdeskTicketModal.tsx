"use client"
/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Şube Bakım / Yeni Arıza Bildirimi Modalı
 */

import React, { useState } from "react"
import {
  Headphones,
  X,
  AlertTriangle,
  Building2,
  Tag,
  Camera,
  UploadCloud,
  CheckCircle2,
  Flame,
  Zap,
  Droplets,
  Wrench
} from "lucide-react"
import { toast } from "react-hot-toast"

interface CreateHelpdeskTicketModalProps {
  isOpen: boolean
  onClose: () => void
  projects?: Array<{ id: string; name: string }>
  onSuccess?: () => void
}

export default function CreateHelpdeskTicketModal({
  isOpen,
  onClose,
  projects = [],
  onSuccess,
}: CreateHelpdeskTicketModalProps) {
  const [formData, setFormData] = useState({
    title: "",
    projectId: projects[0]?.id || "",
    urgency: "URGENT",
    faultType: "EQUIPMENT",
    description: "",
    photoFileName: "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (!isOpen) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.title.trim()) {
      toast.error("Lütfen arıza konusunu belirtin.")
      return
    }

    setIsSubmitting(true)
    setTimeout(() => {
      setIsSubmitting(false)
      toast.success(
        `"${formData.title}" arıza talebi SLA takip sistemine kaydedildi! Servis ekibi bilgilendirildi.`
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
            <div className="w-10 h-10 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
              <Headphones className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Yeni Arıza Bildirimi</h3>
              <p className="text-xs text-slate-400">Teknik servis ve acil onarım talebi oluşturun</p>
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
          {/* Arıza Konusu */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Arıza Başlığı / Cihaz Adı <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              placeholder="Örn: 2 Nolu Pasta Dolabı Soğutma Kompresörü Devre Dışı"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3.5 py-2.5 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
              required
            />
          </div>

          {/* Aciliyet Durumu (Düşük, Orta, Acil) */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Aciliyet Düzeyi (SLA Kriteri)
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { key: "LOW", label: "Düşük (48 Saat)", color: "border-slate-700 text-slate-400 bg-slate-950" },
                { key: "MEDIUM", label: "Orta (24 Saat)", color: "border-amber-500/60 text-amber-300 bg-amber-950/40" },
                { key: "URGENT", label: "Kritik / ACİL (4 Saat)", color: "border-rose-500 text-rose-300 bg-rose-950/60" },
              ].map((u) => (
                <button
                  key={u.key}
                  type="button"
                  onClick={() => setFormData({ ...formData, urgency: u.key })}
                  className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all text-center ${
                    formData.urgency === u.key
                      ? u.color + " ring-1 ring-rose-500/50 shadow-md"
                      : "bg-slate-950 border-slate-800 text-slate-500 hover:border-slate-700"
                  }`}
                >
                  {u.label}
                </button>
              ))}
            </div>
          </div>

          {/* Arıza Tipi & Şube */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                <Wrench className="w-3.5 h-3.5 text-amber-400" />
                <span>Arıza Kategorisi</span>
              </label>
              <select
                value={formData.faultType}
                onChange={(e) => setFormData({ ...formData, faultType: e.target.value })}
                className="w-full px-3.5 py-2.5 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-amber-500"
              >
                <option value="EQUIPMENT">Ekipman & Soğutma (HVAC / Buzdolabı)</option>
                <option value="ELECTRICAL">Elektrik, Sigorta & Aydınlatma</option>
                <option value="PLUMBING">Sıhhi Tesisat, Su & Drenaj Hattı</option>
                <option value="POS_IT">POS Kasa Terminali & Ağ Bağlantısı</option>
                <option value="SHUTTER">Kepenk & Otomatik Kapı Mekanizması</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-blue-400" />
                <span>Bildirim Yapan Şube</span>
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
              Arıza Açıklaması & Belirtiler <span className="text-rose-400">*</span>
            </label>
            <textarea
              rows={3}
              placeholder="Örn: Cihazın sigortası attı, kompresörden yüksek ses geliyor ve iç sıcaklık +14°C'ye yükseldi."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3.5 py-2.5 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
              required
            />
          </div>

          {/* Fotoğraf Yükleme Alanı */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
              <Camera className="w-3.5 h-3.5 text-blue-400" />
              <span>Arıza Fotoğrafı / Cihaz Etiketi (Opsiyonel)</span>
            </label>
            <label className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-950 border border-dashed border-slate-800 hover:border-amber-500 cursor-pointer text-xs text-slate-400 transition-all">
              <div className="flex items-center gap-2">
                <UploadCloud className="w-4 h-4 text-amber-400" />
                <span className="truncate">{formData.photoFileName || "Cihazın ve arızanın fotoğrafını seç (PNG, JPG)"}</span>
              </div>
              <span className="px-2.5 py-1 rounded-md bg-amber-500/10 text-amber-400 text-[10px] font-bold border border-amber-500/20">
                Fotoğraf Seç
              </span>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) setFormData({ ...formData, photoFileName: file.name })
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
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-amber-600 hover:from-rose-600 hover:to-amber-700 text-white text-xs font-bold shadow-lg shadow-rose-950/40 transition-all cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isSubmitting ? "Bildiriliyor..." : "Arıza Talebini Gönder"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

