"use client"
/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Yeni Tedarikçi / İş Ortağı Ekleme Modalı
 */

import React, { useState } from "react"
import {
  Building2,
  X,
  Phone,
  Mail,
  User,
  Tag,
  Percent,
  CheckCircle2,
  FileText,
  MapPin
} from "lucide-react"
import { toast } from "react-hot-toast"

interface CreateSupplierModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

export default function CreateSupplierModal({
  isOpen,
  onClose,
  onSuccess,
}: CreateSupplierModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    taxNumber: "",
    taxOffice: "Kadıköy V.D.",
    contactPerson: "",
    phone: "",
    email: "",
    category: "HVAC_COOLING",
    discountRate: "18",
    city: "İstanbul",
    notes: "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (!isOpen) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim()) {
      toast.error("Lütfen tedarikçi firma adını girin.")
      return
    }

    setIsSubmitting(true)
    setTimeout(() => {
      setIsSubmitting(false)
      toast.success(`"${formData.name}" tedarikçi ağına başarıyla eklendi!`)
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
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Yeni Tedarikçi / Anlaşmalı Firma Ekle</h3>
              <p className="text-xs text-slate-400">Ulusal iskonto ve standart mağaza ekipman tedarikçileri</p>
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

        {/* Scrollable Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Firma Adı */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Firma Ünvanı <span className="text-amber-400">*</span>
            </label>
            <input
              type="text"
              placeholder="Örn: FrigoPack Soğutma & Mutfak Ekipmanları A.Ş."
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3.5 py-2.5 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
              required
            />
          </div>

          {/* Vergi No & Vergi Dairesi */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Vergi Numarası (VKN) <span className="text-amber-400">*</span>
              </label>
              <input
                type="text"
                placeholder="Örn: 3880492144"
                maxLength={11}
                value={formData.taxNumber}
                onChange={(e) => setFormData({ ...formData, taxNumber: e.target.value })}
                className="w-full px-3.5 py-2.5 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white font-mono focus:outline-none focus:border-amber-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Vergi Dairesi
              </label>
              <input
                type="text"
                value={formData.taxOffice}
                onChange={(e) => setFormData({ ...formData, taxOffice: e.target.value })}
                className="w-full px-3.5 py-2.5 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          {/* Hizmet/Kategori & İskonto */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-amber-400" />
                <span>Hizmet / Ürün Kategorisi</span>
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3.5 py-2.5 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-amber-500"
              >
                <option value="HVAC_COOLING">Soğutma, İklimlendirme & HVAC</option>
                <option value="COFFEE_EQUIPMENT">Endüstriyel Mutfak & Espresso</option>
                <option value="FURNITURE">Mağaza Mobilya, Raf & Ahşap</option>
                <option value="LIGHTING">Aydınlatma & Elektrik Donanımı</option>
                <option value="POS_HARDWARE">POS, Kasa, Barkod & Ağ Altyapısı</option>
                <option value="SIGNAGE">Dış Cephe Tabela, Totem & Görsel</option>
                <option value="RAW_MATERIAL">Gıda Hammadde & Ambalaj</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                <Percent className="w-3.5 h-3.5 text-emerald-400" />
                <span>Ulusal İskonto Oranı (%)</span>
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={formData.discountRate}
                onChange={(e) => setFormData({ ...formData, discountRate: e.target.value })}
                className="w-full px-3.5 py-2.5 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white font-mono focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          {/* İletişim Kişisi & Telefon */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-blue-400" />
                <span>Yetkili İletişim Kişisi</span>
              </label>
              <input
                type="text"
                placeholder="Örn: Kemal Akın (Satış Müdürü)"
                value={formData.contactPerson}
                onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                className="w-full px-3.5 py-2.5 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-blue-400" />
                <span>Telefon Numarası</span>
              </label>
              <input
                type="tel"
                placeholder="+90 532 000 0000"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3.5 py-2.5 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-amber-500"
                required
              />
            </div>
          </div>

          {/* E-posta */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-slate-400" />
              <span>Kurumsal E-posta</span>
            </label>
            <input
              type="email"
              placeholder="siparis@frigopack.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-3.5 py-2.5 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-amber-500"
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
              <span>{isSubmitting ? "Kaydediliyor..." : "Tedarikçiyi Kaydet"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

