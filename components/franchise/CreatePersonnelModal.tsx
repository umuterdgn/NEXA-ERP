"use client"
/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Yeni Saha & Şube Personeli Tanımlama Modalı
 */

import React, { useState } from "react"
import {
  Users,
  X,
  User,
  Phone,
  Mail,
  Building2,
  Briefcase,
  CheckCircle2,
  Calendar,
  DollarSign
} from "lucide-react"
import { toast } from "react-hot-toast"

interface CreatePersonnelModalProps {
  isOpen: boolean
  onClose: () => void
  projects?: Array<{ id: string; name: string }>
  onSuccess?: (newPerson: any) => void
}

export default function CreatePersonnelModal({
  isOpen,
  onClose,
  projects = [],
  onSuccess,
}: CreatePersonnelModalProps) {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    email: "",
    projectId: projects[0]?.id || "",
    role: "STORE_MANAGER",
    department: "Saha Operasyon",
    startDate: new Date().toISOString().split("T")[0],
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (!isOpen) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      toast.error("Lütfen personelin adını ve soyadını girin.")
      return
    }

    const fullName = `${formData.firstName.trim()} ${formData.lastName.trim()}`
    setIsSubmitting(true)
    setTimeout(() => {
      setIsSubmitting(false)
      const newPerson = {
        id: `prs-${Date.now()}`,
        name: fullName,
        role: getRoleTitle(formData.role),
        department: formData.department,
        phone: formData.phone || "+90 532 555 0101",
        email: formData.email || `${formData.firstName.toLowerCase()}@franchise.com`,
        status: "ACTIVE",
      }

      toast.success(`"${fullName}" personeli başarıyla sisteme kaydedildi!`)
      onClose()
      if (onSuccess) onSuccess(newPerson)
    }, 500)
  }

  const getRoleTitle = (key: string) => {
    switch (key) {
      case "STORE_MANAGER":
        return "Mağaza Müdürü"
      case "SITE_CHIEF":
        return "Şantiye Şefi"
      case "BARISTA":
        return "Kıdemli Barista & Servis Sorumlusu"
      case "ARCHITECT":
        return "Saha Mimarı (Rollout Lead)"
      case "SUPERVISOR":
        return "Bölge Operasyon Süpervizörü"
      default:
        return "Saha Personeli"
    }
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
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Yeni Personel Tanımla</h3>
              <p className="text-xs text-slate-400">Şube mağaza müdürü, barista, şantiye şefi ve saha mimarları</p>
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
          {/* Ad & Soyad */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-blue-400" />
                <span>Ad <span className="text-amber-400">*</span></span>
              </label>
              <input
                type="text"
                placeholder="Örn: Can"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                className="w-full px-3.5 py-2.5 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Soyad <span className="text-amber-400">*</span>
              </label>
              <input
                type="text"
                placeholder="Örn: Yılmaz"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                className="w-full px-3.5 py-2.5 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                required
              />
            </div>
          </div>

          {/* Telefon & E-posta */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-amber-400" />
                <span>Telefon</span>
              </label>
              <input
                type="tel"
                placeholder="+90 532 000 0000"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3.5 py-2.5 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                <span>Kurumsal E-posta</span>
              </label>
              <input
                type="email"
                placeholder="can.yilmaz@franchise.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3.5 py-2.5 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          {/* Şube/Mağaza & Görev/Rol */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-blue-400" />
                <span>Atandığı Şube / Mağaza</span>
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
                <Briefcase className="w-3.5 h-3.5 text-amber-400" />
                <span>Görev / Rol</span>
              </label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="w-full px-3.5 py-2.5 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-amber-500"
              >
                <option value="SITE_CHIEF">Şantiye Şefi</option>
                <option value="STORE_MANAGER">Mağaza Müdürü</option>
                <option value="BARISTA">Barista & Servis Sorumlusu</option>
                <option value="ARCHITECT">Saha Mimarı (Rollout Lead)</option>
                <option value="SUPERVISOR">Bölge Operasyon Müdürü</option>
              </select>
            </div>
          </div>

          {/* İşe Başlama Tarihi */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-blue-400" />
              <span>İşe Başlama Tarihi</span>
            </label>
            <input
              type="date"
              value={formData.startDate}
              onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              className="w-full px-3.5 py-2.5 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-amber-500"
              required
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
              <span>{isSubmitting ? "Kaydediliyor..." : "Personeli Kaydet"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
