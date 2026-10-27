"use client"

import React, { useState } from "react"
import {
  Building2,
  UserCheck,
  HardDrive,
  Palette,
  Check,
  Loader2,
  X,
  Sparkles,
  Shield,
  Layers,
  KeyRound,
  Mail,
  User,
  Globe,
  Sliders,
  Upload,
  Link as LinkIcon
} from "lucide-react"
import { toast } from "react-hot-toast"

interface CreateTenantModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

const AVAILABLE_MODULES = [
  { id: "DASHBOARD", label: "Dashboard & İstatistikler", desc: "Genel özet panelleri" },
  { id: "PROJECTS", label: "Proje & Şantiye", desc: "Şantiyeler ve yapı süreçleri" },
  { id: "FINANCE", label: "Kasa & Finans", desc: "Gelir/Gider, hakediş ve çekler" },
  { id: "DOCUMENTS", label: "Dijital Evrak Arşivi", desc: "Merkezi doküman ve ruhsatlar" },
  { id: "BIM", label: "BIM 3D", desc: "3D modeller ve IFC görselleştirme" },
  { id: "OCR", label: "OCR Evrak Denetimi", desc: "Fatura ve tutanak tarama" },
  { id: "DRONE", label: "Hava & Drone Gözlem", desc: "Hava fotoğrafları ve ortofoto" },
  { id: "AI_VISION", label: "AI Görsel Analiz", desc: "Kusur ve donatı tespiti" },
  { id: "HR", label: "İnsan Kaynakları", desc: "Personel, bordro ve vardiya" },
]

export default function CreateTenantModal({
  isOpen,
  onClose,
  onSuccess,
}: CreateTenantModalProps) {
  // 1. Firma Bilgileri
  const [name, setName] = useState("")
  const [slug, setSlug] = useState("")
  const [type, setType] = useState<"MAIN_CONTRACTOR" | "INSPECTION">("MAIN_CONTRACTOR")
  const [domain, setDomain] = useState("")
  const [subscriptionPlan, setSubscriptionPlan] = useState("PROFESSIONAL")
  const [isTrial, setIsTrial] = useState(false)

  // 2. İlk Yönetici (Admin) Hesabı
  const [adminName, setAdminName] = useState("")
  const [adminEmail, setAdminEmail] = useState("")
  const [adminPassword, setAdminPassword] = useState("")

  // 3. Kota & Limitler
  const [maxUsers, setMaxUsers] = useState<number>(15)
  const [storageGb, setStorageGb] = useState<number>(50)

  // 4. Modül İzinleri & Marka
  const [enabledModules, setEnabledModules] = useState<string[]>([
    "DASHBOARD",
    "PROJECTS",
    "FINANCE",
    "DOCUMENTS",
    "BIM",
    "OCR",
  ])
  const [primaryColor, setPrimaryColor] = useState("#3B82F6")
  const [logoUrl, setLogoUrl] = useState("")
  const [isUploadingLogo, setIsUploadingLogo] = useState(false)
  const [isWhiteLabelActive, setIsWhiteLabelActive] = useState(true)

  const [loading, setLoading] = useState(false)

  // Firma Logosu Dosya Yükleme (Direct File Upload)
  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Sadece görsel (Image) kısıtlaması
    if (!file.type.startsWith("image/")) {
      toast.error("Lütfen sadece resim dosyası seçiniz (PNG, JPG, WEBP). PDF kabul edilmez.")
      return
    }

    setIsUploadingLogo(true)
    const toastId = toast.loading("Firma logosu yükleniyor...")
    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("sourceModule", "BRANDING")

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })

      const data = await res.json()
      if (res.ok && data.url) {
        setLogoUrl(data.url)
        toast.success("Logo başarıyla yüklendi", { id: toastId })
      } else {
        toast.error(data.error || "Logo yüklenemedi", { id: toastId })
      }
    } catch (err) {
      console.error("Logo upload error:", err)
      toast.error("Logo yüklenirken bir hata oluştu", { id: toastId })
    } finally {
      setIsUploadingLogo(false)
      e.target.value = ""
    }
  }

  // Otomatik Slug üretici
  const handleNameChange = (val: string) => {
    setName(val)
    if (!slug || slug === toSlug(name)) {
      setSlug(toSlug(val))
    }
  }

  const toSlug = (text: string) => {
    const trMap: Record<string, string> = {
      ç: "c", ğ: "g", ı: "i", ö: "o", ş: "s", ü: "u",
      Ç: "c", Ğ: "g", İ: "i", Ö: "o", Ş: "s", Ü: "u",
    }
    let s = text || ""
    for (const [k, v] of Object.entries(trMap)) {
      s = s.replace(new RegExp(k, "g"), v)
    }
    return s
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9-]+/g, "-")
      .replace(/(^-|-$)+/g, "")
  }

  const toggleModule = (modId: string) => {
    setEnabledModules((prev) =>
      prev.includes(modId) ? prev.filter((m) => m !== modId) : [...prev, modId]
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name.trim()) {
      toast.error("Lütfen firma adını giriniz")
      return
    }

    if (!adminEmail.trim() || !adminPassword.trim()) {
      toast.error("İlk firma yöneticisi için e-posta ve şifre zorunludur")
      return
    }

    if (adminPassword.length < 6) {
      toast.error("Admin şifresi en az 6 karakter olmalıdır")
      return
    }

    setLoading(true)

    try {
      const res = await fetch("/api/superadmin/tenants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          slug: slug.trim() || toSlug(name),
          domain: domain.trim() || null,
          type,
          subscriptionPlan,
          isTrial,
          licenses: maxUsers,
          maxUsers,
          maxStorageMB: storageGb * 1024,
          enabledModules,
          primaryColor,
          logoUrl: logoUrl.trim() || null,
          isWhiteLabelActive,
          adminName: adminName.trim(),
          adminEmail: adminEmail.trim(),
          adminPassword: adminPassword.trim(),
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || "Firma oluşturulamadı")
      }

      toast.success(
        `🎉 ${name} firması ve [${adminEmail}] yönetici hesabı başarıyla oluşturuldu!`,
        { duration: 5000 }
      )
      onSuccess()
      onClose()
    } catch (err: any) {
      console.error(err)
      toast.error(err.message || "Firma kaydı başarısız oldu")
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-3 sm:p-4 overflow-y-auto">
      <div className="relative w-full max-w-4xl my-auto rounded-2xl border border-slate-800 bg-slate-950 p-6 sm:p-8 shadow-2xl space-y-6 max-h-[92vh] flex flex-col">
        {/* Modal Üst Başlık */}
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black text-white">Yeni Firma (Tenant) Onboarding</h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Otomatik Admin Kurulumu
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Kiracı firmayı kaydedin, patron hesabını tanımlayın ve paket limitlerini belirleyin.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition-all cursor-pointer border border-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Alanı (Kaydırılabilir içerik) */}
        <form onSubmit={handleSubmit} className="space-y-6 overflow-y-auto pr-1 flex-1">
          {/* Grid: 4 Mantıksal Bölüm */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* ========================================================= */}
            {/* BÖLÜM 1: FİRMA BİLGİLERİ */}
            {/* ========================================================= */}
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 space-y-3.5">
              <div className="flex items-center gap-2 text-white font-bold text-xs uppercase tracking-wider text-purple-400 border-b border-slate-800 pb-2">
                <Building2 className="w-4 h-4" />
                <span>1. Firma Temel Bilgileri</span>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold text-xs mb-1">
                  Firma Ticari Unvanı *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="Örn: Demirtaş İnşaat Taahhüt A.Ş."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-purple-500 transition-colors"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold text-xs mb-1">
                    Firma Türü
                  </label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500 transition-colors"
                  >
                    <option value="MAIN_CONTRACTOR">Ana Müteahhit / İnşaat</option>
                    <option value="INSPECTION">Yapı Denetim Kuruluşu</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold text-xs mb-1">
                    Abonelik Paketi
                  </label>
                  <select
                    value={subscriptionPlan}
                    onChange={(e) => setSubscriptionPlan(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500 transition-colors"
                  >
                    <option value="STARTER">Starter (15.000 ₺/ay)</option>
                    <option value="PROFESSIONAL">Professional (35.000 ₺/ay)</option>
                    <option value="ENTERPRISE">Enterprise (75.000 ₺/ay)</option>
                  </select>
                </div>
              </div>

              {/* 14 Günlük Ücretsiz Demo (Trial) Seçeneği */}
              <div className="p-3 rounded-xl bg-purple-950/20 border border-purple-800/40 flex items-center justify-between transition-colors hover:border-purple-700/60">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white flex items-center gap-2">
                      <span>14 Günlük Ücretsiz Demo (Trial) Başlat</span>
                      {isTrial && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                          14 Gün Aktif
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-400">
                      İşaretlenirse firma 14 gün demo modunda açılır, süre dolduğunda lisans bariyeri kilitler.
                    </div>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer ml-3 shrink-0">
                  <input
                    type="checkbox"
                    checked={isTrial}
                    onChange={(e) => setIsTrial(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                </label>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold text-xs mb-1 flex items-center justify-between">
                  <span>URL Kısa Adı (Slug) *</span>
                  <span className="text-[10px] text-slate-500 font-mono">/login?tenant={slug || "slug"}</span>
                </label>
                <div className="flex items-center">
                  <span className="px-3 py-2 bg-slate-950 border border-r-0 border-slate-800 rounded-l-xl text-slate-500 text-xs font-mono">
                    nxerp.com.tr/
                  </span>
                  <input
                    type="text"
                    required
                    value={slug}
                    onChange={(e) => setSlug(toSlug(e.target.value))}
                    placeholder="demirtas-insaat"
                    className="w-full bg-slate-950 border border-slate-800 rounded-r-xl px-3 py-2 text-xs font-mono text-purple-300 placeholder:text-slate-600 focus:outline-none focus:border-purple-500 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold text-xs mb-1">
                  Özel Domain (Opsiyonel)
                </label>
                <input
                  type="text"
                  value={domain}
                  onChange={(e) => setDomain(e.target.value)}
                  placeholder="portal.demirtasinsaat.com.tr"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-purple-500 transition-colors"
                />
              </div>
            </div>

            {/* ========================================================= */}
            {/* BÖLÜM 2: İLK YÖNETİCİ (ADMİN) HESABI */}
            {/* ========================================================= */}
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 space-y-3.5">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <div className="flex items-center gap-2 text-white font-bold text-xs uppercase tracking-wider text-indigo-400">
                  <UserCheck className="w-4 h-4" />
                  <span>2. İlk Yönetici (Patron) Hesabı</span>
                </div>
                <span className="text-[10px] text-amber-400 font-bold px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20">
                  {type === "INSPECTION" ? "INSPECTION_ADMIN" : "ADMIN"}
                </span>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold text-xs mb-1 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  <span>Yönetici Adı Soyadı</span>
                </label>
                <input
                  type="text"
                  value={adminName}
                  onChange={(e) => setAdminName(e.target.value)}
                  placeholder="Örn: Ahmet Yılmaz"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold text-xs mb-1 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  <span>Yönetici E-Posta Adresi *</span>
                </label>
                <input
                  type="email"
                  required
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  placeholder="yonetici@demirtas.com"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold text-xs mb-1 flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-slate-400" />
                  <span>Giriş Şifresi (İlk Giriş) *</span>
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 transition-colors"
                />
                <p className="text-[10px] text-slate-500 mt-1">
                  Kiracı bu e-posta ve şifreyle sisteme doğrudan giriş yapacaktır.
                </p>
              </div>
            </div>

            {/* ========================================================= */}
            {/* BÖLÜM 3: KOTA & LİMİTLER */}
            {/* ========================================================= */}
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 space-y-3.5">
              <div className="flex items-center gap-2 text-white font-bold text-xs uppercase tracking-wider text-emerald-400 border-b border-slate-800 pb-2">
                <HardDrive className="w-4 h-4" />
                <span>3. Kota & Granüler Sınırlar</span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold text-xs mb-1">
                    Kullanıcı Koltuk Sayısı (Seats)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={1000}
                    value={maxUsers}
                    onChange={(e) => setMaxUsers(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-emerald-400 focus:outline-none focus:border-emerald-500 transition-colors"
                  />
                  <span className="text-[10px] text-slate-500">Açabileceği max kullanıcı</span>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold text-xs mb-1">
                    Bulut Depolama Alanı (GB)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={10000}
                    value={storageGb}
                    onChange={(e) => setStorageGb(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-emerald-400 focus:outline-none focus:border-emerald-500 transition-colors"
                  />
                  <span className="text-[10px] text-slate-500">{storageGb * 1024} MB alan</span>
                </div>
              </div>
            </div>

            {/* ========================================================= */}
            {/* BÖLÜM 4: MARKA (WHITE-LABEL) */}
            {/* ========================================================= */}
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 space-y-3.5">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <div className="flex items-center gap-2 text-white font-bold text-xs uppercase tracking-wider text-cyan-400">
                  <Palette className="w-4 h-4" />
                  <span>4. Kurumsal Marka & Logo</span>
                </div>
                <label className="flex items-center gap-1.5 cursor-pointer text-[10px] text-slate-300 font-medium">
                  <input
                    type="checkbox"
                    checked={isWhiteLabelActive}
                    onChange={(e) => setIsWhiteLabelActive(e.target.checked)}
                    className="rounded border-slate-700 bg-slate-950 text-cyan-500 focus:ring-0"
                  />
                  <span>White-Label Aktif</span>
                </label>
              </div>

              <div className="grid grid-cols-2 gap-3 items-center">
                <div>
                  <label className="block text-slate-300 font-semibold text-xs mb-1">
                    Kurumsal Renk (Primary)
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      className="w-9 h-9 rounded-lg cursor-pointer border border-slate-700 bg-transparent p-0.5 shrink-0"
                    />
                    <input
                      type="text"
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs font-mono text-white focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold text-xs mb-1 flex items-center justify-between">
                    <span>Firma Logosu Seç (PNG/JPG)</span>
                    {logoUrl && (
                      <span className="text-[10px] text-emerald-400 font-medium">Yüklendi</span>
                    )}
                  </label>

                  {logoUrl ? (
                    <div className="p-2 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-2.5">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-10 h-8 rounded-lg bg-slate-900 border border-slate-700/80 p-0.5 flex items-center justify-center overflow-hidden shrink-0">
                          <img
                            src={logoUrl}
                            alt="Logo Önizleme"
                            className="max-h-full max-w-full object-contain"
                          />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[11px] font-mono text-slate-200 truncate">
                            {logoUrl.split("/").pop() || "firma-logo.png"}
                          </p>
                          <p className="text-[9px] text-emerald-400">Önizleme Aktif</p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => setLogoUrl("")}
                        className="text-[11px] text-rose-400 hover:text-rose-300 font-medium px-2 py-1 rounded hover:bg-rose-500/10 transition cursor-pointer shrink-0"
                      >
                        Kaldır
                      </button>
                    </div>
                  ) : (
                    <div className="relative group">
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/jpg,image/webp"
                        onChange={handleLogoUpload}
                        disabled={isUploadingLogo}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed z-10"
                      />
                      <div className="px-3 py-2 rounded-xl border border-dashed border-slate-700 group-hover:border-cyan-500/60 bg-slate-950 transition-colors flex items-center justify-center gap-2 cursor-pointer">
                        {isUploadingLogo ? (
                          <Loader2 className="w-3.5 h-3.5 text-cyan-400 animate-spin" />
                        ) : (
                          <Upload className="w-3.5 h-3.5 text-cyan-400 group-hover:scale-110 transition-transform" />
                        )}
                        <span className="text-xs text-slate-300">
                          {isUploadingLogo ? "Yükleniyor..." : "Firma Logosu Seç (PNG/JPG)"}
                        </span>
                        <span className="text-[10px] text-slate-500">(PNG, JPG)</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* ========================================================= */}
          {/* MODÜL İZİNLERİ (FEATURE TOGGLES) */}
          {/* ========================================================= */}
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <div className="flex items-center gap-2 text-white font-bold text-xs uppercase tracking-wider text-amber-400">
                <Sliders className="w-4 h-4" />
                <span>Paket Modül Yetkileri (Sidebar İzolasyonu)</span>
              </div>
              <span className="text-[10px] text-slate-400">
                {enabledModules.length} modül aktif
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
              {AVAILABLE_MODULES.map((mod) => {
                const isChecked = enabledModules.includes(mod.id)
                return (
                  <button
                    type="button"
                    key={mod.id}
                    onClick={() => toggleModule(mod.id)}
                    className={`flex items-start gap-2.5 p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                      isChecked
                        ? "bg-purple-600/10 border-purple-500/40 text-white"
                        : "bg-slate-950/60 border-slate-800/60 text-slate-400 hover:border-slate-700"
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded mt-0.5 flex items-center justify-center shrink-0 transition-colors ${
                        isChecked ? "bg-purple-600 text-white" : "border border-slate-700 bg-slate-900"
                      }`}
                    >
                      {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-bold truncate">{mod.label}</div>
                      <div className="text-[10px] text-slate-500 truncate">{mod.desc}</div>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Form Alt Butonları */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800 shrink-0">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 font-semibold text-xs transition-colors cursor-pointer"
            >
              Vazgeç
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-bold text-xs shadow-xl shadow-purple-600/20 disabled:opacity-50 flex items-center gap-2 cursor-pointer transition-all"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>{loading ? "Kiracı Oluşturuluyor..." : "Firmayı ve Yöneticiyi Başlat (Onboard)"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
