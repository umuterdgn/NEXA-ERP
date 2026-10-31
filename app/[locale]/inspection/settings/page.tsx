"use client"

import React, { useState, useEffect } from "react"
import {
  Palette,
  Upload,
  Check,
  RefreshCw,
  Save,
  Building2,
  Sparkles,
  ShieldCheck,
  ArrowRight
} from "lucide-react"
import { toast } from "react-hot-toast"

export default function InspectionSettingsPage() {
  const [logoUrl, setLogoUrl] = useState("")
  const [primaryColor, setPrimaryColor] = useState("#3B82F6")
  const [isWhiteLabelActive, setIsWhiteLabelActive] = useState(false)
  const [companyName, setCompanyName] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isUploadingLogo, setIsUploadingLogo] = useState(false)

  useEffect(() => {
    fetchBranding()
  }, [])

  const fetchBranding = async () => {
    setIsLoading(true)
    try {
      const res = await fetch("/api/tenant/branding")
      if (res.ok) {
        const data = await res.json()
        if (data.logoUrl) setLogoUrl(data.logoUrl)
        if (data.primaryColor) setPrimaryColor(data.primaryColor)
        setIsWhiteLabelActive(Boolean(data.isWhiteLabelActive))
        if (data.companyName) setCompanyName(data.companyName)
      }
    } catch (err) {
      console.error("Branding bilgileri alınamadı:", err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploadingLogo(true)
    const formData = new FormData()
    formData.append("file", file)

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })
      if (!res.ok) throw new Error("Dosya yüklenemedi")
      const data = await res.json()
      setLogoUrl(data.url)
      toast.success("Logo başarıyla yüklendi! Kaydetmeyi unutmayın.")
    } catch (err: any) {
      toast.error(err.message || "Logo yüklenirken hata oluştu")
    } finally {
      setIsUploadingLogo(false)
    }
  }

  const handleSaveBranding = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    try {
      const res = await fetch("/api/tenant/branding", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          logoUrl,
          primaryColor,
        }),
      })
      if (res.ok) {
        toast.success("Kurumsal kimlik ve marka ayarları kaydedildi!", { icon: "🎨" })
        if (typeof document !== "undefined") {
          document.documentElement.style.setProperty("--tenant-primary", primaryColor)
        }
      } else {
        const data = await res.json()
        toast.error(data.error || "Ayarlar kaydedilemedi")
      }
    } catch (err) {
      console.error("Branding save error:", err)
      toast.error("Bağlantı hatası oluştu")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-8 p-4 md:p-8 max-w-5xl mx-auto">
      {/* Üst Başlık & Bilgi */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-md bg-blue-500/10 text-blue-400 border border-blue-500/20">
              Yapı Denetim Kuruluşu
            </span>
            <span className="text-xs text-slate-500">•</span>
            <span className="text-xs text-slate-400">Şirket Ayarları</span>
          </div>
          <h1 className="text-2xl font-black text-white tracking-wide mt-1 flex items-center gap-2.5">
            <span>Kurumsal Kimlik & Marka (White-Label)</span>
            <Palette className="w-6 h-6 text-blue-400" />
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Yapı Denetim firmanızın kendi logosunu ve kurumsal renk tonunu sisteme uygulayın.
          </p>
        </div>
      </div>

      <form onSubmit={handleSaveBranding} className="space-y-6">
        <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center border border-blue-500/20">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <span>{companyName || "Yapı Denetim Şirketi"}</span>
                  {isWhiteLabelActive ? (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                      <Check className="w-3 h-3" />
                      White-Label Yayında
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                      Önizleme Modu (Standart Paket)
                    </span>
                  )}
                </h3>
                <p className="text-xs text-slate-400">
                  Denetim paneli ve saha mühendislerinin gördüğü arayüzde logonuz ve kurumsal renginiz uygulanır.
                </p>
              </div>
            </div>

            {!isWhiteLabelActive && (
              <div className="px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs">
                Kurumsal renk ve logo seçimleriniz kaydedilebilir; tam kurumsal yayına geçmek için Enterprise lisansı gerekir.
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Firma Logosu */}
            <div className="space-y-3">
              <label className="text-xs font-bold text-slate-200 flex items-center justify-between">
                <span>Kuruluş Logosu</span>
                <span className="text-[11px] text-slate-500 font-normal">PNG, SVG veya WebP</span>
              </label>

              <div className="flex items-center gap-4">
                <div className="w-24 h-24 rounded-2xl border-2 border-dashed border-slate-700 bg-slate-850 flex items-center justify-center overflow-hidden relative shrink-0">
                  {logoUrl ? (
                    <img
                      src={logoUrl}
                      alt="Kuruluş Logosu"
                      className="w-full h-full object-contain p-2"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = "none"
                      }}
                    />
                  ) : (
                    <span className="text-[10px] text-slate-500 text-center px-2">Logo Yok</span>
                  )}
                </div>

                <div className="space-y-2 flex-1">
                  <input
                    type="text"
                    value={logoUrl}
                    onChange={(e) => setLogoUrl(e.target.value)}
                    placeholder="https://.../logo.png"
                    className="w-full bg-slate-850 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />

                  <div className="flex items-center gap-2">
                    <label className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold cursor-pointer border border-slate-700 flex items-center gap-1.5 transition-all">
                      <Upload className="w-3.5 h-3.5 text-blue-400" />
                      <span>{isUploadingLogo ? "Yükleniyor..." : "Dosya Seç & Yükle"}</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleLogoUpload}
                        disabled={isUploadingLogo}
                      />
                    </label>
                    {logoUrl && (
                      <button
                        type="button"
                        onClick={() => setLogoUrl("")}
                        className="px-2.5 py-1.5 text-xs text-rose-400 hover:bg-rose-500/10 rounded-lg transition-all"
                      >
                        Kaldır
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Kurumsal Renk Seçici */}
            <div className="space-y-3">
              <label className="text-xs font-bold text-slate-200 flex items-center justify-between">
                <span>Ana Kurumsal Renk (Primary Color)</span>
                <span className="text-[11px] text-slate-400 font-mono">{primaryColor}</span>
              </label>

              <div className="flex items-center gap-3">
                <div className="relative">
                  <input
                    type="color"
                    value={primaryColor || "#3B82F6"}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="w-12 h-12 rounded-xl cursor-pointer border border-slate-700 bg-transparent p-1"
                  />
                </div>
                <input
                  type="text"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  placeholder="#3B82F6"
                  className="flex-1 bg-slate-850 border border-slate-700/80 rounded-xl px-3 py-2 text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Hızlı Renk Paletleri */}
              <div className="space-y-1.5">
                <span className="text-[10px] text-slate-400 font-semibold">Önerilen Renkler:</span>
                <div className="flex flex-wrap gap-2">
                  {[
                    { name: "Nexa Mavisi", hex: "#3B82F6" },
                    { name: "Zümrüt Yeşili", hex: "#10B981" },
                    { name: "Çivit İndigo", hex: "#6366F1" },
                    { name: "Amber Turuncusu", hex: "#F59E0B" },
                    { name: "Ametist Moru", hex: "#8B5CF6" },
                    { name: "Gül Pembesi", hex: "#EC4899" },
                    { name: "Okyanus Cyan", hex: "#06B6D4" },
                    { name: "Grafit", hex: "#1E293B" },
                  ].map((palette) => (
                    <button
                      key={palette.hex}
                      type="button"
                      onClick={() => setPrimaryColor(palette.hex)}
                      className={`group flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium border transition-all ${
                        primaryColor.toLowerCase() === palette.hex.toLowerCase()
                          ? "bg-slate-800 border-white text-white"
                          : "bg-slate-850/80 border-slate-700/60 text-slate-300 hover:border-slate-500"
                      }`}
                    >
                      <span
                        className="w-2.5 h-2.5 rounded-full ring-1 ring-white/20"
                        style={{ backgroundColor: palette.hex }}
                      />
                      <span>{palette.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Canlı Önizleme Kartı */}
          <div className="p-4 rounded-xl bg-slate-850/60 border border-slate-700/60 space-y-3">
            <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">
              Arayüz Canlı Önizleme (Dinamik CSS Değişkeni)
            </span>
            <div className="flex flex-wrap items-center gap-4">
              <button
                type="button"
                style={{ backgroundColor: primaryColor }}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white shadow-lg transition-transform hover:scale-105"
              >
                Kurumsal Ana Buton
              </button>
              <div
                style={{ borderColor: primaryColor, color: primaryColor }}
                className="px-3 py-1.5 rounded-xl border text-xs font-semibold bg-white/5"
              >
                Aktif Sekme / Rozet
              </div>
              <div
                style={{ borderLeftColor: primaryColor }}
                className="pl-3 py-1 border-l-4 text-xs font-medium text-slate-200"
              >
                Sol Sidebar Vurgu Çizgisi
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-2 border-t border-slate-800">
            <button
              type="submit"
              disabled={isSaving}
              style={{ backgroundColor: primaryColor }}
              className="px-6 py-2.5 rounded-xl text-xs font-bold text-white shadow-xl transition-all hover:opacity-95 disabled:opacity-50 flex items-center gap-2 cursor-pointer"
            >
              {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              <span>{isSaving ? "Kaydediliyor..." : "Marka Ayarlarını Kaydet"}</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}
