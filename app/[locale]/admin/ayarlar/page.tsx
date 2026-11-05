"use client"
/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * This code is the property of NXA Software.
 */

import { useState, useEffect } from "react"
import Link from "next/link"
import { Bot, Palette, Sun, Moon, Contrast, Globe, Check, Eye, SunMedium } from "lucide-react"
import toast from "react-hot-toast"
import ConfirmModal from "@/components/ConfirmModal"
import ThemeToggle from "@/components/ThemeToggle"
import { useTheme } from "next-themes"
import { useLocale } from "next-intl"
import { usePathname, useRouter } from "@/i18n/routing"

export default function AdminSettingsPage() {
  const [driveFolderId, setDriveFolderId] = useState("")
  const [isSaving, setIsSaving] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  
  // Theme and Locale engines
  const { theme, setTheme } = useTheme()
  const locale = useLocale()
  const router = useRouter()
  const pathname = usePathname()
  const [mounted, setMounted] = useState(false)

  // Profession management state
  const [professions, setProfessions] = useState<any[]>([])
  const [newProfession, setNewProfession] = useState("")
  const [isAddingProfession, setIsAddingProfession] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; id: string | null }>({ isOpen: false, id: null })
  
  // Tab state
  const [activeTab, setActiveTab] = useState<"profile" | "drive" | "professions" | "appearance">("profile")
  const [profileData, setProfileData] = useState({
    name: "",
    email: "",
    profileImage: ""
  })
  const [isProfileSaving, setIsProfileSaving] = useState(false)

  useEffect(() => {
    setMounted(true)
    fetchSettings()
    fetchProfessions()
    fetchProfile()
  }, [])

  const handleLanguageChange = (newLocale: string) => {
    try {
      toast.success(
        newLocale === "tr"
          ? "Dil Türkçe olarak değiştirildi"
          : newLocale === "en"
          ? "Language switched to English"
          : newLocale === "de"
          ? "Sprache auf Deutsch umgestellt"
          : newLocale === "ru"
          ? "Язык переключен на русский"
          : "تم تغيير اللغة إلى العربية"
      )
      router.replace(pathname, { locale: newLocale })
    } catch (err) {
      console.error("Language switch error:", err)
    }
  }

  const handleThemeChange = (newTheme: "dark" | "light" | "monochrome") => {
    setTheme(newTheme)
    if (newTheme === "monochrome") {
      toast("Siyah-Beyaz (Yüksek Kontrast / Güneş Altı) modu aktifleştirildi.", {
        icon: "☀️",
      })
    } else if (newTheme === "light") {
      toast.success("Açık (Light) tema aktifleştirildi.")
    } else {
      toast.success("Koyu (Dark) tema aktifleştirildi.")
    }
  }

  const fetchProfile = async () => {
    try {
      const response = await fetch("/api/admin/user/profile")
      if (response.ok) {
        const data = await response.json()
        setProfileData({
          name: data.name || "",
          email: data.email || "",
          profileImage: data.profileImage || ""
        })
      }
    } catch (error) {
      console.error("Failed to fetch profile:", error)
    }
  }

  const fetchSettings = async () => {
    try {
      const response = await fetch("/api/admin/settings")
      if (response.ok) {
        const data = await response.json()
        setDriveFolderId(data.driveFolderId || "")
      }
    } catch (error) {
      console.error("Failed to fetch settings:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchProfessions = async () => {
    try {
      const response = await fetch("/api/admin/professions")
      if (response.ok) {
        const data = await response.json()
        setProfessions(data)
      }
    } catch (error) {
      console.error("Failed to fetch professions:", error)
    }
  }

  const handleAddProfession = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newProfession.trim()) return

    setIsAddingProfession(true)
    try {
      const response = await fetch("/api/admin/professions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newProfession.trim() })
      })

      if (response.ok) {
        toast.success("Meslek başarıyla eklendi")
        setNewProfession("")
        fetchProfessions()
      } else {
        toast.error("Meslek eklenirken hata oluştu")
      }
    } catch (error) {
      toast.error("Hata oluştu")
    } finally {
      setIsAddingProfession(false)
    }
  }

  const handleDeleteProfession = async (id: string) => {
    setDeleteConfirm({ isOpen: true, id })
  }

  const confirmDeleteProfession = async () => {
    if (!deleteConfirm.id) return

    try {
      const response = await fetch(`/api/admin/professions/${deleteConfirm.id}`, {
        method: "DELETE"
      })

      if (response.ok) {
        toast.success("Meslek başarıyla silindi")
        fetchProfessions()
      } else {
        const data = await response.json()
        toast.error(data.error || "Meslek silinirken hata oluştu")
      }
    } catch (error) {
      toast.error("Hata oluştu")
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)

    try {
      const response = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ driveFolderId })
      })

      if (response.ok) {
        toast.success("Ayarlar kaydedildi")
      } else {
        toast.error("Hata oluştu")
      }
    } catch (error) {
      toast.error("Hata oluştu")
    } finally {
      setIsSaving(false)
    }
  }

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsProfileSaving(true)

    try {
      const response = await fetch("/api/admin/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profileData)
      })

      if (response.ok) {
        toast.success("Profil başarıyla güncellendi")
      } else {
        toast.error("Profil güncellenirken hata oluştu")
      }
    } catch (error) {
      toast.error("Hata oluştu")
    } finally {
      setIsProfileSaving(false)
    }
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      })

      if (response.ok) {
        const data = await response.json()
        setProfileData(prev => ({ ...prev, profileImage: data.url }))
        toast.success("Fotoğraf yüklendi")
      } else {
        toast.error("Fotoğraf yüklenirken hata oluştu")
      }
    } catch (error) {
      toast.error("Hata oluştu")
    }
  }

  return (
    <div className="lg:mt-0 mt-16 max-w-5xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
            Sistem Ayarları
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Görünüm, dil, arşivleme ve profil yapılandırmasını yönetin.
          </p>
        </div>
        <ThemeToggle variant="pills" />
      </div>

      {/* Tab Navigation */}
      <div className="flex flex-wrap gap-2 mb-6 border-b border-slate-200 dark:border-slate-800 pb-4">
        <button
          onClick={() => setActiveTab("appearance")}
          className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 ${
            activeTab === "appearance"
              ? "bg-blue-600 text-white shadow-lg shadow-blue-600/30 ring-1 ring-blue-500"
              : "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800"
          }`}
        >
          <Palette className="w-4 h-4 text-cyan-500" />
          <span>Görünüm & Dil</span>
        </button>

        <button
          onClick={() => setActiveTab("profile")}
          className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
            activeTab === "profile"
              ? "bg-blue-600 text-white shadow-lg shadow-blue-600/30 ring-1 ring-blue-500"
              : "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800"
          }`}
        >
          Profil Düzenleme
        </button>

        <button
          onClick={() => setActiveTab("drive")}
          className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
            activeTab === "drive"
              ? "bg-blue-600 text-white shadow-lg shadow-blue-600/30 ring-1 ring-blue-500"
              : "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800"
          }`}
        >
          Google Drive
        </button>

        <button
          onClick={() => setActiveTab("professions")}
          className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
            activeTab === "professions"
              ? "bg-blue-600 text-white shadow-lg shadow-blue-600/30 ring-1 ring-blue-500"
              : "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800"
          }`}
        >
          Meslek Yönetimi
        </button>

        <Link
          href="/admin/settings/integrations"
          className="px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors bg-cyan-50 dark:bg-cyan-950/40 text-cyan-700 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800/60 hover:bg-cyan-100 dark:hover:bg-cyan-900/40 flex items-center gap-1.5 ml-auto"
        >
          <Bot className="w-4 h-4 text-cyan-500" />
          <span>Bakanlık (YİBF) Entegrasyonu</span>
        </Link>
      </div>

      <div className="space-y-8">
        {/* Appearance & Language Tab */}
        {activeTab === "appearance" && (
          <div className="space-y-6">
            {/* Görünüm / Tema Seçimi */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-500">
                  <Palette className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white">Görünüm Modu (Tema)</h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Kullanım ortamınıza ve ortam ışığına göre optimum kontrast seviyesini seçin.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                {/* Koyu Tema */}
                <div
                  onClick={() => handleThemeChange("dark")}
                  className={`cursor-pointer rounded-2xl p-5 border-2 transition-all relative flex flex-col justify-between ${
                    (mounted ? theme : "dark") === "dark"
                      ? "border-blue-500 bg-slate-950/80 text-white shadow-lg shadow-blue-500/10 ring-2 ring-blue-500/30"
                      : "border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 hover:border-slate-400 dark:hover:border-slate-700 text-slate-900 dark:text-white"
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-blue-400 border border-slate-700">
                        <Moon className="w-5 h-5" />
                      </div>
                      {(mounted ? theme : "dark") === "dark" && (
                        <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center">
                          <Check className="w-3.5 h-3.5" />
                        </div>
                      )}
                    </div>
                    <h3 className="text-base font-bold mb-1">Koyu (Dark)</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                      Mevcut lacivert ve siyah zemin tasarımı. Şantiye ofisi ve gece kullanımı için göz yormaz.
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800/80 flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-blue-500" />
                    <span className="w-3 h-3 rounded-full bg-slate-800" />
                    <span className="w-3 h-3 rounded-full bg-slate-950" />
                    <span className="text-[11px] text-slate-400 dark:text-slate-500 ml-auto font-mono">Standart</span>
                  </div>
                </div>

                {/* Açık Tema */}
                <div
                  onClick={() => handleThemeChange("light")}
                  className={`cursor-pointer rounded-2xl p-5 border-2 transition-all relative flex flex-col justify-between ${
                    (mounted ? theme : "dark") === "light"
                      ? "border-blue-500 bg-blue-50/40 dark:bg-slate-100/10 shadow-lg shadow-blue-500/10 ring-2 ring-blue-500/30 text-slate-900 dark:text-white"
                      : "border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 hover:border-slate-400 dark:hover:border-slate-700 text-slate-900 dark:text-white"
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500 border border-amber-500/20">
                        <Sun className="w-5 h-5" />
                      </div>
                      {(mounted ? theme : "dark") === "light" && (
                        <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center">
                          <Check className="w-3.5 h-3.5" />
                        </div>
                      )}
                    </div>
                    <h3 className="text-base font-bold mb-1">Açık (Light)</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                      Beyaz ağırlıklı, net ve ferah tasarım. Standart ofis aydınlatmasında yüksek okunabilirlik sağlar.
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800/80 flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-blue-600" />
                    <span className="w-3 h-3 rounded-full bg-white" />
                    <span className="w-3 h-3 rounded-full bg-slate-200" />
                    <span className="text-[11px] text-slate-400 dark:text-slate-500 ml-auto font-mono">Ferah Ofis</span>
                  </div>
                </div>

                {/* Siyah-Beyaz / Yüksek Kontrast */}
                <div
                  onClick={() => handleThemeChange("monochrome")}
                  className={`cursor-pointer rounded-2xl p-5 border-2 transition-all relative flex flex-col justify-between ${
                    (mounted ? theme : "dark") === "monochrome"
                      ? "border-black dark:border-white bg-black text-white shadow-lg shadow-white/10 ring-2 ring-white/50"
                      : "border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 hover:border-slate-400 dark:hover:border-slate-700 text-slate-900 dark:text-white"
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-10 h-10 rounded-xl bg-black dark:bg-white text-white dark:text-black flex items-center justify-center font-black border border-white">
                        <Contrast className="w-5 h-5" />
                      </div>
                      {(mounted ? theme : "dark") === "monochrome" && (
                        <div className="w-6 h-6 rounded-full bg-white text-black flex items-center justify-center font-bold">
                          <Check className="w-3.5 h-3.5" />
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold mb-1">Siyah-Beyaz (Monochrome)</h3>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                      Güneş altında çalışan saha personeli için renk körlüğü ve WCAG AAA yüksek kontrast standartlarında saf siyah-beyaz mod.
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800/80 flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-white" />
                    <span className="w-3 h-3 rounded-full bg-neutral-600" />
                    <span className="w-3 h-3 rounded-full bg-black border border-white/50" />
                    <span className="text-[11px] text-amber-500 ml-auto font-mono font-semibold">Güneş Altı & WCAG</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Dil Seçimi */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500">
                  <Globe className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white">Dil Seçimi (Language & Locale)</h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Sistem arayüzünü ve raporları tercih ettiğiniz dilde görüntüleyin.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 mt-6">
                {[
                  { code: "tr", name: "Türkçe", native: "Türkçe", flag: "🇹🇷", dir: "LTR" },
                  { code: "en", name: "English", native: "English", flag: "🇬🇧", dir: "LTR" },
                  { code: "de", name: "Deutsch", native: "Deutsch", flag: "🇩🇪", dir: "LTR" },
                  { code: "ru", name: "Русский", native: "Русский", flag: "🇷🇺", dir: "LTR" },
                  { code: "ar", name: "العربية", native: "العربية", flag: "🇸🇦", dir: "RTL" },
                ].map((item) => {
                  const isSelected = locale === item.code
                  return (
                    <button
                      key={item.code}
                      onClick={() => handleLanguageChange(item.code)}
                      className={`p-4 rounded-xl border text-left transition-all relative ${
                        isSelected
                          ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-900 dark:text-white ring-1 ring-emerald-500/50 shadow-sm"
                          : "border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 text-slate-700 dark:text-slate-300 hover:border-slate-400 dark:hover:border-slate-700"
                      }`}
                    >
                      {isSelected && (
                        <div className="absolute top-2.5 right-2.5 w-4 h-4 rounded-full bg-emerald-500 text-black flex items-center justify-center">
                          <Check className="w-2.5 h-2.5 stroke-[3]" />
                        </div>
                      )}
                      <div className="text-2xl mb-2">{item.flag}</div>
                      <div className="font-bold text-sm text-slate-900 dark:text-white">{item.native}</div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 uppercase font-mono">{item.code} • {item.dir}</div>
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        {/* Profile Tab */}
        {activeTab === "profile" && (
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm max-w-2xl">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-6">Profil Düzenleme</h2>
            
            <form onSubmit={handleProfileSave} className="space-y-6">
              <div className="flex items-center gap-6">
                <div className="relative">
                  <div className="w-24 h-24 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center overflow-hidden border-2 border-slate-300 dark:border-slate-700">
                    {profileData.profileImage ? (
                      <img src={profileData.profileImage} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-3xl text-slate-500">{profileData.name.charAt(0).toUpperCase()}</span>
                    )}
                  </div>
                  <label className="absolute bottom-0 right-0 bg-blue-600 text-white p-2 rounded-full cursor-pointer hover:bg-blue-500 transition-colors shadow-sm">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </label>
                </div>
                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Profil fotoğrafını değiştirmek için ikona tıklayın</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Ad Soyad</label>
                <input
                  type="text"
                  value={profileData.name}
                  onChange={(e) => setProfileData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-4 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">E-posta</label>
                <input
                  type="email"
                  value={profileData.email}
                  onChange={(e) => setProfileData(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full px-4 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500"
                  required
                />
              </div>

              <div className="flex space-x-4">
                <button
                  type="submit"
                  disabled={isProfileSaving}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors disabled:opacity-50 shadow-sm"
                >
                  {isProfileSaving ? "Kaydediliyor..." : "Kaydet"}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Google Drive Settings */}
        {activeTab === "drive" && (
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm max-w-2xl">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-6">Google Drive Arşiv Ayarları</h2>
            
            <form onSubmit={handleSave} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Google Drive Klasör ID / Linki
                </label>
                <input
                  type="text"
                  value={driveFolderId}
                  onChange={(e) => setDriveFolderId(e.target.value)}
                  className="w-full px-4 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500"
                  placeholder="https://drive.google.com/drive/folders/..."
                  disabled={isLoading}
                />
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
                  PDF dosyalarının yükleneceği Google Drive klasörünün ID'si veya tam linki.
                </p>
              </div>

              <div className="flex space-x-4">
                <button
                  type="submit"
                  disabled={isSaving || isLoading}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors disabled:opacity-50 shadow-sm"
                >
                  {isSaving ? "Kaydediliyor..." : "Kaydet"}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Profession Management */}
        {activeTab === "professions" && (
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm max-w-2xl">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-6">Birim / Meslek Yönetimi</h2>
            
            {/* Add New Profession Form */}
            <form onSubmit={handleAddProfession} className="mb-6">
              <div className="flex gap-4">
                <input
                  type="text"
                  value={newProfession}
                  onChange={(e) => setNewProfession(e.target.value)}
                  className="flex-1 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500"
                  placeholder="Yeni meslek adı (Örn: Kalıpçı, Elektrikçi)"
                  disabled={isAddingProfession}
                />
                <button
                  type="submit"
                  disabled={isAddingProfession || !newProfession.trim()}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-500 transition-colors disabled:opacity-50 shadow-sm"
                >
                  {isAddingProfession ? "Ekleniyor..." : "Ekle"}
                </button>
              </div>
            </form>

            {/* Professions List */}
            <div className="space-y-2">
              {professions.length === 0 ? (
                <p className="text-slate-500 dark:text-slate-400 text-center py-4">Henüz meslek eklenmedi</p>
              ) : (
                professions.map((prof) => (
                  <div
                    key={prof.id}
                    className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-transparent"
                  >
                    <span className="text-slate-900 dark:text-white font-medium">{prof.name}</span>
                    <button
                      onClick={() => handleDeleteProfession(prof.id)}
                      className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-500 transition-colors shadow-sm"
                    >
                      Sil
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        <ConfirmModal
          isOpen={deleteConfirm.isOpen}
          onClose={() => setDeleteConfirm({ isOpen: false, id: null })}
          onConfirm={confirmDeleteProfession}
          title="Mesleği Sil"
          message="Bu mesleği silmek istediğinize emin misiniz? Bu işlem geri alınamaz."
          confirmText="Sil"
          cancelText="İptal"
          type="danger"
        />
      </div>
    </div>
  )
}
