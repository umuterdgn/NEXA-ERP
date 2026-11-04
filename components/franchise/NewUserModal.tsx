"use client"
/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Franchise Yeni Kullanıcı & Personel Tanımlama Modalı (Zorunlu Şifre Girişi)
 */

import React, { useState } from "react"
import {
  UserPlus,
  X,
  Mail,
  Lock,
  User,
  Shield,
  Building,
  Eye,
  EyeOff,
  Phone,
  CheckCircle2,
  Loader2,
  Smartphone
} from "lucide-react"
import { toast } from "react-hot-toast"
import { useRouter } from "next/navigation"

interface NewUserModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

export default function NewUserModal({
  isOpen,
  onClose,
  onSuccess,
}: NewUserModalProps) {
  const router = useRouter()
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [role, setRole] = useState("STAFF")
  const [companyType, setCompanyType] = useState("FRANCHISE")
  const [phone, setPhone] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name.trim()) {
      toast.error("Lütfen ad ve soyad girin.")
      return
    }

    if (!email.trim() || !email.includes("@")) {
      toast.error("Lütfen geçerli bir e-posta adresi girin.")
      return
    }

    if (!password || password.trim().length < 6) {
      toast.error("Lütfen en az 6 karakterden oluşan bir giriş şifresi belirleyin.")
      return
    }

    setIsSubmitting(true)

    try {
      const res = await fetch("/api/franchise/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          password: password.trim(),
          role,
          companyType,
          phone: phone.trim(),
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || "Kullanıcı oluşturulamadı")
      }

      toast.success(
        `"${name}" sisteme eklendi! Mobil ve Web şifresi başarıyla tanımlandı.`
      )

      // Formu temizle
      setName("")
      setEmail("")
      setPassword("")
      setRole("STAFF")
      setPhone("")

      router.refresh()
      if (onSuccess) onSuccess()
      onClose()
    } catch (err: any) {
      console.error("[NewUserModal Submit Error]:", err)
      toast.error(err?.message || "Kullanıcı eklenirken bir hata oluştu.")
    } finally {
      setIsSubmitting(false)
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
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Yeni Personel / Kullanıcı Ekle</h3>
              <p className="text-xs text-slate-400">Web paneli ve mobil uygulama giriş şifresi tanımlama</p>
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
          {/* Ad Soyad */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-amber-400" />
              <span>Ad Soyad *</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Örn: Burak Özdemir"
              className="w-full px-3.5 py-2.5 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:border-amber-500"
              disabled={isSubmitting}
            />
          </div>

          {/* E-posta */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-blue-400" />
              <span>E-posta Adresi (Giriş Kullanıcı Adı) *</span>
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ornek@nxerp.com.tr"
              className="w-full px-3.5 py-2.5 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:border-amber-500 font-mono"
              disabled={isSubmitting}
            />
          </div>

          {/* GİRİŞ ŞİFRESİ (ZORUNLU - ADIM 2) */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-emerald-400 font-bold">
                <Lock className="w-3.5 h-3.5 text-emerald-400" />
                Giriş Şifresi (Password) *
              </span>
              <span className="text-[10px] text-slate-500">Min. 6 Karakter</span>
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Personelin mobil/web giriş şifresi..."
                className="w-full px-3.5 py-2.5 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 pr-10"
                disabled={isSubmitting}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-white transition-colors"
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
            <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
              <Smartphone className="w-3 h-3 text-emerald-400" />
              Personel mobil uygulamaya bu şifre ve e-posta ile anında giriş yapabilir (bcrypt ile hash'lenir).
            </p>
          </div>

          {/* Rol & Firma Türü */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-purple-400" />
                <span>Sistem Rolü *</span>
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-amber-500"
                disabled={isSubmitting}
              >
                <option value="ADMIN">ADMIN (Tam Yetkili Yönetici)</option>
                <option value="SITE_MANAGER">SITE_MANAGER (Şantiye Şefi)</option>
                <option value="ENGINEER">ENGINEER (Saha Mühendisi)</option>
                <option value="DRIVER">DRIVER (Lojistik Sürücüsü)</option>
                <option value="SECURITY">SECURITY (Nizamiye Güvenlik)</option>
                <option value="ISG_EXPERT">ISG_EXPERT (İş Güvenliği Uzmanı)</option>
                <option value="ACCOUNTANT">ACCOUNTANT (Muhasebe & Finans)</option>
                <option value="SUBCONTRACTOR">SUBCONTRACTOR (Taşeron Temsilcisi)</option>
                <option value="STAFF">STAFF (Genel Personel)</option>
                <option value="WORKER">WORKER (Saha İşçisi)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                <Building className="w-3.5 h-3.5 text-blue-400" />
                <span>Firma / Departman Türü</span>
              </label>
              <select
                value={companyType}
                onChange={(e) => setCompanyType(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-amber-500"
                disabled={isSubmitting}
              >
                <option value="FRANCHISE">FRANCHISE (Genel Merkez)</option>
                <option value="BRANCH">BRANCH (Şube / Mağaza)</option>
                <option value="SUBCONTRACTOR">SUBCONTRACTOR (Taşeron)</option>
                <option value="SUPPLIER">SUPPLIER (Tedarikçi Firma)</option>
              </select>
            </div>
          </div>

          {/* Telefon */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-slate-400" />
              <span>Telefon Numarası (Opsiyonel)</span>
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="05XX XXX XX XX"
              className="w-full px-3.5 py-2.5 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:border-amber-500 font-mono"
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
                  <UserPlus className="w-4 h-4" />
                  <span>Kullanıcıyı Kaydet ve Şifrele</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
