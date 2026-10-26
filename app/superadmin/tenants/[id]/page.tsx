/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Superadmin Firma / Tenant Detay & Granüler Limit Yönetimi (/superadmin/tenants/[id])
 */

"use client"

import React, { useState, useEffect, use } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  Building2,
  HardDrive,
  Users,
  Shield,
  CreditCard,
  LifeBuoy,
  FolderKanban,
  ArrowLeft,
  Save,
  CheckCircle,
  AlertTriangle,
  Lock,
  Unlock,
  RefreshCw,
  Loader2,
  Calendar,
  Box,
  Sparkles,
  ScanText,
  Plane,
  Clock,
  Send,
  CheckSquare,
  Square,
  DollarSign,
  Archive,
  LayoutDashboard,
  Calculator,
  Activity,
  Layers,
  Palette,
  Image as ImageIcon,
  Upload,
  Copy,
  Check,
  Globe,
  ExternalLink,
  KeyRound,
  ShieldCheck,
  Eye,
  EyeOff,
} from "lucide-react"
import toast from "react-hot-toast"

interface TenantDetailData {
  id: string
  slug?: string | null
  name: string
  domain?: string | null
  type: string
  subscriptionPlan: "STARTER" | "PROFESSIONAL" | "ENTERPRISE"
  status: "ACTIVE" | "SUSPENDED"
  paymentStatus: "PAID" | "PAST_DUE" | "FAILED"
  licenses: number
  extraStorageQuota: number
  maxStorageMB?: number
  usedStorageMB?: number
  enabledModules?: string[]
  logoUrl?: string | null
  primaryColor?: string | null
  isWhiteLabelActive?: boolean
  features: string[]
  createdAt: string
  storage: {
    baseQuotaGb: number
    extraQuotaGb: number
    totalQuotaGb: number
    usedGb: number
    usedMb?: number
    usagePercentage: number
  }
  projects: Array<{
    id: string
    name: string
    title: string
    yibfNo?: string | null
    status: string
    progress: number
    createdAt: string
  }>
  users: Array<{
    id: string
    name: string
    email: string
    role: string
    createdAt: string
  }>
  supportTickets: Array<{
    id: string
    subject: string
    message: string
    status: "OPEN" | "IN_PROGRESS" | "RESOLVED"
    priority: string
    response?: string | null
    createdAt: string
  }>
  _count: {
    projects: number
    users: number
    personnel: number
    equipment: number
    droneMedia: number
  }
}

export default function TenantDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const router = useRouter()

  const [tenant, setTenant] = useState<TenantDetailData | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Granüler Limit & Kota Form State
  const [extraQuotaInput, setExtraQuotaInput] = useState<number>(0)
  const [maxStorageGbInput, setMaxStorageGbInput] = useState<number>(50)
  const [licensesInput, setLicensesInput] = useState<number>(50)
  const [selectedPlan, setSelectedPlan] = useState<string>("PROFESSIONAL")
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([])
  const [enabledModulesInput, setEnabledModulesInput] = useState<string[]>([
    "DASHBOARD", "PROJECTS", "FINANCE", "DOCUMENTS", "BIM", "AI_VISION", "BOQ_METRAJ", "INSPECTION"
  ])

  // Slug ve URL State
  const [slugInput, setSlugInput] = useState<string>("")
  const [copied, setCopied] = useState<boolean>(false)

  // White-Label & Kurumsal Kimlik State
  const [logoUrlInput, setLogoUrlInput] = useState<string>("")
  const [primaryColorInput, setPrimaryColorInput] = useState<string>("#3B82F6")
  const [isWhiteLabelInput, setIsWhiteLabelInput] = useState<boolean>(false)
  const [isUploadingLogo, setIsUploadingLogo] = useState<boolean>(false)

  // Yönetici (Admin) Erişim Bilgileri State
  const [adminData, setAdminData] = useState<{ id: string; name: string; email: string; role: string } | null>(null)
  const [loadingAdmin, setLoadingAdmin] = useState<boolean>(false)
  const [newAdminEmail, setNewAdminEmail] = useState<string>("")
  const [newAdminPassword, setNewAdminPassword] = useState<string>("")
  const [showNewPassword, setShowNewPassword] = useState<boolean>(false)
  const [savingAdmin, setSavingAdmin] = useState<boolean>(false)

  useEffect(() => {
    fetchTenantDetail()
    fetchAdminData()
  }, [id])

  const fetchAdminData = async () => {
    setLoadingAdmin(true)
    try {
      const res = await fetch(`/api/superadmin/tenants/${id}/admin`)
      const result = await res.json()
      if (result.success && result.admin) {
        setAdminData(result.admin)
        setNewAdminEmail(result.admin.email || "")
      } else {
        setAdminData(null)
      }
    } catch (err) {
      console.error("Yönetici verisi alınamadı:", err)
    } finally {
      setLoadingAdmin(false)
    }
  }

  const handleUpdateAdminCredentials = async () => {
    if (!newAdminEmail.trim() && !newAdminPassword.trim()) {
      toast.error("Lütfen güncellenecek e-posta veya şifreyi giriniz.")
      return
    }
    if (newAdminPassword.trim() && newAdminPassword.trim().length < 6) {
      toast.error("Yeni şifre en az 6 karakter olmalıdır.")
      return
    }

    setSavingAdmin(true)
    try {
      const res = await fetch(`/api/superadmin/tenants/${id}/admin`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          newEmail: newAdminEmail.trim() || undefined,
          newPassword: newAdminPassword.trim() || undefined,
        }),
      })
      const result = await res.json()
      if (result.success) {
        toast.success(result.message || "Yönetici giriş bilgileri başarıyla güncellendi!")
        setNewAdminPassword("")
        if (result.admin) {
          setAdminData(result.admin)
          setNewAdminEmail(result.admin.email)
        }
      } else {
        toast.error(result.error || "Güncelleme başarısız oldu.")
      }
    } catch {
      toast.error("Yönetici bilgileri güncellenirken sunucu hatası oluştu.")
    } finally {
      setSavingAdmin(false)
    }
  }

  const fetchTenantDetail = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/superadmin/tenants/${id}`)
      const result = await res.json()
      if (result.success) {
        setTenant(result.data)
        setSlugInput(result.data.slug || "")
        setExtraQuotaInput(result.data.extraStorageQuota || 0)
        setMaxStorageGbInput(Math.round((result.data.maxStorageMB || 51200) / 1024))
        setLicensesInput(result.data.licenses || 50)
        setSelectedPlan(result.data.subscriptionPlan)
        setSelectedFeatures(result.data.features || [])
        setEnabledModulesInput(
          result.data.enabledModules && result.data.enabledModules.length > 0
            ? result.data.enabledModules
            : ["DASHBOARD", "PROJECTS", "FINANCE", "DOCUMENTS", "BIM", "AI_VISION", "BOQ_METRAJ", "INSPECTION"]
        )
        setLogoUrlInput(result.data.logoUrl || "")
        setPrimaryColorInput(result.data.primaryColor || "#3B82F6")
        setIsWhiteLabelInput(Boolean(result.data.isWhiteLabelActive))
      } else {
        toast.error("Firma bilgileri alınamadı")
      }
    } catch {
      toast.error("Ağ bağlantı hatası")
    } finally {
      setLoading(false)
    }
  }

  // Logo Yükleme Servisi
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
      formData.append("tenantId", id)

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })

      const data = await res.json()
      if (res.ok && data.url) {
        setLogoUrlInput(data.url)
        toast.success("Logo başarıyla yüklendi", { id: toastId })
      } else {
        toast.error(data.error || "Logo yüklenemedi", { id: toastId })
      }
    } catch (err) {
      console.error(err)
      toast.error("Logo yükleme hatası", { id: toastId })
    } finally {
      setIsUploadingLogo(false)
      e.target.value = ""
    }
  }

  // Limit, Modül ve Marka Güncelleme (Save)
  const handleSaveLimits = async () => {
    setSaving(true)
    try {
      const res = await fetch(`/api/superadmin/tenants/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          extraStorageQuota: Number(extraQuotaInput),
          maxStorageMB: Math.max(1, Number(maxStorageGbInput)) * 1024,
          enabledModules: enabledModulesInput,
          licenses: Number(licensesInput),
          subscriptionPlan: selectedPlan,
          features: selectedFeatures,
          slug: slugInput?.trim()?.toLowerCase() || null,
          logoUrl: logoUrlInput ? logoUrlInput.trim() : null,
          primaryColor: primaryColorInput || "#3B82F6",
          isWhiteLabelActive: isWhiteLabelInput,
        }),
      })
      const result = await res.json()
      if (result.success) {
        toast.success("Kotalar, modül izinleri ve White-Label marka ayarları başarıyla güncellendi!")
        fetchTenantDetail()
      } else {
        toast.error(result.error || "Güncelleme başarısız")
      }
    } catch {
      toast.error("İşlem hatası")
    } finally {
      setSaving(false)
    }
  }

  const toggleModule = (moduleKey: string) => {
    setEnabledModulesInput((prev) =>
      prev.includes(moduleKey) ? prev.filter((m) => m !== moduleKey) : [...prev, moduleKey]
    )
  }

  // Read-Only / Aktif Şalteri
  const handleToggleStatus = async () => {
    if (!tenant) return
    const newStatus = tenant.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE"

    try {
      const res = await fetch(`/api/superadmin/tenants/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      })
      const result = await res.json()
      if (result.success) {
        toast.success(
          newStatus === "SUSPENDED"
            ? "Firma 'Sadece Okunabilir' (Read-Only) kilitlendi."
            : "Firma kilidi açıldı, tam erişim verildi."
        )
        fetchTenantDetail()
      }
    } catch {
      toast.error("Hata oluştu")
    }
  }

  const toggleFeature = (feat: string) => {
    setSelectedFeatures((prev) =>
      prev.includes(feat) ? prev.filter((f) => f !== feat) : [...prev, feat]
    )
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-slate-500">
        <Loader2 className="h-8 w-8 animate-spin text-purple-500 mb-3" />
        <p className="text-sm font-medium">Firma ve limit verileri yükleniyor...</p>
      </div>
    )
  }

  if (!tenant) {
    return (
      <div className="p-8 text-center text-slate-400 bg-slate-900 rounded-3xl border border-slate-800">
        <AlertTriangle className="h-10 w-10 text-amber-500 mx-auto mb-3" />
        <h2 className="text-lg font-bold text-white">Firma Bulunamadı</h2>
        <p className="text-xs text-slate-500 mt-1">İlgili tenant kaydı veritabanında mevcut değil.</p>
        <Link
          href="/superadmin/dashboard"
          className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-600 text-white text-xs font-semibold"
        >
          <ArrowLeft className="h-4 w-4" /> Dashboard'a Dön
        </Link>
      </div>
    )
  }

  const { storage } = tenant
  const isStorageWarning = storage.usagePercentage >= 80

  return (
    <div className="space-y-6">
      {/* Üst Bar: Navigasyon ve Başlık */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/superadmin/dashboard"
            className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
                <Building2 className="h-6 w-6 text-purple-400" />
                {tenant.name}
              </h1>
              <span
                className={`text-xs px-2.5 py-0.5 rounded-full font-bold border ${
                  tenant.status === "ACTIVE"
                    ? "bg-emerald-950/80 text-emerald-300 border-emerald-500/30"
                    : "bg-rose-950/80 text-rose-300 border-rose-500/40"
                }`}
              >
                {tenant.status === "ACTIVE" ? "● Aktif" : "🔒 Read-Only Kilitli"}
              </span>
            </div>
            <p className="text-xs text-slate-400 font-mono mt-1">
              Tenant ID: {tenant.id} • {tenant.type === "INSPECTION" ? "Yapı Denetim Firması" : "Ana Yüklenici Müteahhit"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleToggleStatus}
            className={`px-4 py-2 rounded-xl text-xs font-bold border transition flex items-center gap-2 ${
              tenant.status === "ACTIVE"
                ? "bg-rose-600/20 text-rose-300 border-rose-500/30 hover:bg-rose-600/30"
                : "bg-emerald-600/20 text-emerald-300 border-emerald-500/30 hover:bg-emerald-600/30"
            }`}
          >
            {tenant.status === "ACTIVE" ? (
              <>
                <Lock className="h-4 w-4" /> Sadece Okunabilir (Kitle)
              </>
            ) : (
              <>
                <Unlock className="h-4 w-4" /> Kilidi Aç (Tam Erişim)
              </>
            )}
          </button>

          <button
            onClick={fetchTenantDetail}
            className="p-2 rounded-xl bg-slate-900 text-slate-400 hover:text-white border border-slate-800 transition"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Müşteri Giriş URL'si Bilgi Kartı */}
      {(() => {
        const clientLoginUrl = `https://nxerp.com.tr/login?tenant=${tenant.slug || tenant.id}`
        const handleCopyUrl = () => {
          navigator.clipboard.writeText(clientLoginUrl)
          setCopied(true)
          toast.success("Müşteri Giriş URL'si panoya kopyalandı!", { icon: "📋" })
          setTimeout(() => setCopied(false), 2500)
        }

        return (
          <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-purple-950/60 via-indigo-950/40 to-slate-900 border border-purple-500/30 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  Müşteri Giriş URL'si
                </span>
                <span className="text-xs text-slate-500">•</span>
                <span className="text-xs text-slate-400">Firma personeli ve yöneticileri bu adres üzerinden sisteme bağlanır</span>
              </div>
              <div className="flex items-center gap-2 font-mono text-xs sm:text-sm font-bold text-white tracking-wide">
                <Globe className="w-4 h-4 text-purple-400 shrink-0" />
                <span className="text-purple-300 select-all">{clientLoginUrl}</span>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleCopyUrl}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-lg ${
                  copied
                    ? "bg-emerald-600 text-white shadow-emerald-500/20"
                    : "bg-purple-600 hover:bg-purple-500 text-white shadow-purple-500/20"
                }`}
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? "Kopyalandı!" : "Panoya Kopyala"}</span>
              </button>

              <a
                href={`https://wa.me/?text=${encodeURIComponent(`Merhaba, Nexa ERP kurumsal yönetim paneline giriş adresiniz: ${clientLoginUrl}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3.5 py-2.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 transition flex items-center gap-1.5"
                title="Müşteriye WhatsApp'tan İlet"
              >
                <span>WhatsApp</span>
              </a>

              <a
                href={clientLoginUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition"
                title="Bağlantıyı Yeni Sekmede Aç"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </div>
        )
      })()}

      {/* Grid: 2 Kolon Yapısı */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* SOL KOLON: AWS S3 Kotası & Granüler Limit Override Formu */}
        <div className="lg:col-span-5 space-y-6">
          {/* Depolama ve Limitler Kartı */}
          <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                <HardDrive className="h-4 w-4 text-purple-400" />
                Depolama ve Limitler
              </span>
              <span
                className={`text-xs font-bold font-mono px-2.5 py-1 rounded-full border ${
                  storage.usagePercentage >= 90
                    ? "bg-rose-950 text-rose-300 border-rose-500/50 animate-pulse"
                    : storage.usagePercentage >= 80
                    ? "bg-amber-950 text-amber-300 border-amber-500/50"
                    : "bg-emerald-950 text-emerald-300 border-emerald-500/40"
                }`}
              >
                %{storage.usagePercentage} Dolu
              </span>
            </div>

            {/* %80 ve %90 Üzeri Uyarı Kutusu */}
            {storage.usagePercentage >= 90 ? (
              <div className="p-4 rounded-2xl bg-rose-950/60 border border-rose-500/40 text-rose-200 text-xs flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-rose-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-rose-300">Kritik Kota Uyarısı (%{storage.usagePercentage})</p>
                  <p className="text-[11px] text-rose-200/80 mt-0.5">
                    Firma depolama kapasitesinin %90'ını aştı! Yeni belge, BIM veya medya yüklemeleri engellenebilir. Lütfen kotayı artırınız.
                  </p>
                </div>
              </div>
            ) : storage.usagePercentage >= 80 ? (
              <div className="p-4 rounded-2xl bg-amber-950/60 border border-amber-500/40 text-amber-200 text-xs flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-amber-300">Kapasite Uyarısı (%{storage.usagePercentage})</p>
                  <p className="text-[11px] text-amber-200/80 mt-0.5">
                    Firma depolama alanının %80'ini aştı. Yakında kota sınırına ulaşılabilir.
                  </p>
                </div>
              </div>
            ) : null}

            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-medium">
                <span className="text-white font-mono font-bold">
                  {storage.usedGb} GB Kullanıldı
                </span>
                <span className="text-slate-400 font-mono">
                  Toplam Kota: {storage.totalQuotaGb} GB
                </span>
              </div>

              <div className="w-full h-3.5 rounded-full bg-slate-950 border border-slate-800 overflow-hidden p-0.5">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    storage.usagePercentage >= 90
                      ? "bg-rose-500 shadow-sm shadow-rose-500/50"
                      : storage.usagePercentage >= 80
                      ? "bg-amber-500 shadow-sm shadow-amber-500/50"
                      : "bg-gradient-to-r from-purple-600 to-indigo-500"
                  }`}
                  style={{ width: `${Math.min(100, Math.max(2, storage.usagePercentage))}%` }}
                />
              </div>

              <div className="flex justify-between text-[11px] text-slate-500 pt-1">
                <span>Ana Limit: {maxStorageGbInput} GB</span>
                <span>Ek Override: +{extraQuotaInput} GB</span>
              </div>
            </div>

            {/* Manuel Kota (GB) Belirleme Inputu */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-purple-300 uppercase tracking-wider">
                  Depolama Sınırı (Manuel GB Limiti)
                </label>
                <span className="text-[11px] text-slate-500 font-mono">
                  {maxStorageGbInput * 1024} MB
                </span>
              </div>

              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <input
                    type="number"
                    min="5"
                    step="10"
                    value={maxStorageGbInput}
                    onChange={(e) => setMaxStorageGbInput(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white font-mono text-sm focus:outline-none focus:border-purple-500"
                    placeholder="Örn: 100"
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                    GB
                  </span>
                </div>

                <div className="flex gap-1">
                  {[50, 100, 250, 500].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setMaxStorageGbInput(preset)}
                      className={`px-2.5 py-2 rounded-lg text-xs font-mono transition ${
                        maxStorageGbInput === preset
                          ? "bg-purple-600 text-white font-bold"
                          : "bg-slate-800 hover:bg-slate-700 text-slate-300"
                      }`}
                    >
                      {preset}G
                    </button>
                  ))}
                </div>
              </div>

              {/* Ekstra Override GB */}
              <div className="pt-2 border-t border-slate-800/80">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[11px] font-semibold text-slate-400">
                    Bonus / Ekstra Override Kota (+GB)
                  </label>
                  <span className="text-[11px] text-slate-500 font-mono">+{extraQuotaInput} GB</span>
                </div>
                <input
                  type="number"
                  min="0"
                  step="10"
                  value={extraQuotaInput}
                  onChange={(e) => setExtraQuotaInput(Number(e.target.value))}
                  className="w-full px-3.5 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white font-mono text-xs focus:outline-none focus:border-purple-500"
                  placeholder="Ekstra bonus GB..."
                />
              </div>
            </div>
          </div>

          {/* Modül İzinleri (Feature Toggles) Checkbox Listesi */}
          <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                  <Layers className="h-4 w-4 text-purple-400" />
                  Modül İzinleri (Feature Toggles)
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  İşareti kaldırılan modüller firmanın sol menüsünde (Sidebar) gizlenir.
                </p>
              </div>
              <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-purple-950 text-purple-300 border border-purple-500/30">
                {enabledModulesInput.length} Açık
              </span>
            </div>

            <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
              {[
                { key: "DASHBOARD", label: "Dashboard & Harita", icon: LayoutDashboard, desc: "Genel gösterge ve canlı şantiye haritası" },
                { key: "PROJECTS", label: "Projeler & CRM", icon: FolderKanban, desc: "Proje yönetimi ve iş ortakları / firmalar" },
                { key: "FINANCE", label: "Kasa & Finans", icon: DollarSign, desc: "Kasa, masraf, hakediş ve çek/senet" },
                { key: "DOCUMENTS", label: "Merkezi Evrak Arşivi", icon: Archive, desc: "Dijital arşiv ve merkezi evrak havuzu" },
                { key: "BIM", label: "3D BIM & Modeller", icon: Box, desc: "IFC ve 3D GLB model görselleştirici" },
                { key: "AI_VISION", label: "AI Görsel Analiz", icon: Sparkles, desc: "Yapay zeka şantiye hasar ve OCR tespiti" },
                { key: "BOQ_METRAJ", label: "Keşif & Metraj (BoQ)", icon: Calculator, desc: "Metraj cetveli ve hakediş hesapları" },
                { key: "INSPECTION", label: "Saha Denetim & Formlar", icon: CheckCircle, desc: "Karot, demir-kalıp ve dinamik formlar" },
                { key: "PERSONNEL", label: "Personel & Puantaj", icon: Users, desc: "Personel listesi, vardiya ve mesai" },
                { key: "DRONE", label: "İHA & Drone Harita", icon: Plane, desc: "Hava fotoğrafları ve ortofoto harita" },
              ].map((mod) => {
                const Icon = mod.icon
                const isEnabled = enabledModulesInput.includes(mod.key)
                return (
                  <div
                    key={mod.key}
                    onClick={() => toggleModule(mod.key)}
                    className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                      isEnabled
                        ? "bg-purple-950/30 border-purple-500/40 hover:border-purple-500"
                        : "bg-slate-950/60 border-slate-800/80 hover:border-slate-700 opacity-60"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-xl ${isEnabled ? "bg-purple-600/30 text-purple-300" : "bg-slate-800 text-slate-500"}`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-white flex items-center gap-1.5">
                          {mod.label}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {mod.desc}
                        </div>
                      </div>
                    </div>

                    <div className="shrink-0">
                      {isEnabled ? (
                        <CheckSquare className="h-5 w-5 text-purple-400" />
                      ) : (
                        <Square className="h-5 w-5 text-slate-600" />
                      )}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Plan ve Lisans Sayısı */}
            <div className="pt-3 border-t border-slate-800 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Abonelik Planı
                  </label>
                  <select
                    value={selectedPlan}
                    onChange={(e) => setSelectedPlan(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-purple-500"
                  >
                    <option value="STARTER">STARTER</option>
                    <option value="PROFESSIONAL">PROFESSIONAL</option>
                    <option value="ENTERPRISE">ENTERPRISE</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Kullanıcı Lisansı
                  </label>
                  <input
                    type="number"
                    min="5"
                    step="5"
                    value={licensesInput}
                    onChange={(e) => setLicensesInput(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white font-mono focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>
            </div>

            <button
              onClick={handleSaveLimits}
              disabled={saving}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-sm shadow-lg shadow-purple-600/30 transition flex items-center justify-center gap-2 disabled:opacity-50 mt-4 cursor-pointer"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Depolama & Modül İzinlerini Kaydet
            </button>
          </div>

          {/* Kurumsal Kimlik & Marka (White-Label) Kartı */}
          <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Palette className="h-4 w-4 text-purple-400" />
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Kurumsal Kimlik & Marka (White-Label)
                </span>
              </div>
              <span
                className={`text-xs font-mono font-bold px-2 py-0.5 rounded-full border ${
                  isWhiteLabelInput
                    ? "bg-purple-950 text-purple-300 border-purple-500/40"
                    : "bg-slate-950 text-slate-500 border-slate-800"
                }`}
              >
                {isWhiteLabelInput ? "● White-Label Aktif" : "Varsayılan Tema"}
              </span>
            </div>

            {/* White-Label Aç/Kapat Toggle */}
            <div
              onClick={() => setIsWhiteLabelInput(!isWhiteLabelInput)}
              className={`p-3.5 rounded-2xl border transition cursor-pointer flex items-center justify-between ${
                isWhiteLabelInput
                  ? "bg-purple-950/30 border-purple-500/50"
                  : "bg-slate-950 border-slate-800 opacity-70"
              }`}
            >
              <div>
                <p className="text-xs font-bold text-white">White-Label Özelliği</p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Açıldığında firmanın logosu ve seçilen renk paleti Sidebar ile butonlarda aktif olur.
                </p>
              </div>
              <div
                className={`w-11 h-6 rounded-full transition p-0.5 shrink-0 ${
                  isWhiteLabelInput ? "bg-purple-600" : "bg-slate-800"
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white transition-transform ${
                    isWhiteLabelInput ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </div>
            </div>

            {/* Firma Logosu Yükleme & Önizleme */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-300 flex items-center justify-between">
                <span>Firma Logosu Seç (PNG/JPG)</span>
                {logoUrlInput && (
                  <span className="text-[10px] text-emerald-400 font-medium">Yüklendi</span>
                )}
              </label>

              {logoUrlInput ? (
                <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-16 h-10 rounded-lg bg-slate-900 border border-slate-700 p-1 flex items-center justify-center overflow-hidden">
                      <img src={logoUrlInput} alt="Logo" className="max-h-full max-w-full object-contain" />
                    </div>
                    <div>
                      <p className="text-xs font-mono text-slate-200 truncate max-w-[180px]">
                        {logoUrlInput.split("/").pop() || "Firma Logosu"}
                      </p>
                      <p className="text-[10px] text-emerald-400">Yüklendi & Aktif</p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setLogoUrlInput("")}
                    className="text-xs text-rose-400 hover:text-rose-300 font-medium cursor-pointer"
                  >
                    Kaldır
                  </button>
                </div>
              ) : (
                <div className="relative">
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/jpg,image/webp"
                    onChange={handleLogoUpload}
                    disabled={isUploadingLogo}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <div className="p-4 rounded-2xl border-2 border-dashed border-slate-700 hover:border-purple-500/60 bg-slate-950/60 transition text-center flex flex-col items-center justify-center gap-1.5 cursor-pointer">
                    <Upload className="w-5 h-5 text-purple-400" />
                    <span className="text-xs font-semibold text-slate-300">
                      {isUploadingLogo ? "Logo Yükleniyor..." : "Firma Logosu Seç (PNG/JPG)"}
                    </span>
                    <span className="text-[10px] text-slate-500">Maksimum 5 MB • PNG, JPG veya WEBP</span>
                  </div>
                </div>
              )}
            </div>

            {/* Ana Renk (Primary Color) Seçici */}
            <div className="space-y-2 pt-2 border-t border-slate-800">
              <label className="block text-xs font-semibold text-slate-300">
                Ana Kurumsal Renk (Primary Color)
              </label>

              <div className="flex items-center gap-3">
                <div className="relative">
                  <input
                    type="color"
                    value={primaryColorInput}
                    onChange={(e) => setPrimaryColorInput(e.target.value)}
                    className="w-10 h-10 rounded-xl border border-slate-700 bg-transparent cursor-pointer p-0.5"
                  />
                </div>

                <div className="flex-1">
                  <input
                    type="text"
                    value={primaryColorInput}
                    onChange={(e) => setPrimaryColorInput(e.target.value)}
                    placeholder="#3B82F6"
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-white uppercase focus:outline-none focus:border-purple-500"
                  />
                </div>

                {/* Renk Önizleme Kutusu */}
                <div
                  className="w-10 h-10 rounded-xl border border-white/20 shadow-inner flex items-center justify-center text-white text-xs font-bold"
                  style={{ backgroundColor: primaryColorInput }}
                />
              </div>

              {/* Hızlı Renk Paletleri */}
              <div className="flex items-center gap-1.5 pt-1">
                {[
                  { hex: "#3B82F6", name: "Mavi" },
                  { hex: "#6366F1", name: "İndigo" },
                  { hex: "#8B5CF6", name: "Mor" },
                  { hex: "#10B981", name: "Zümrüt" },
                  { hex: "#F59E0B", name: "Kehribar" },
                  { hex: "#EF4444", name: "Kırmızı" },
                  { hex: "#0F172A", name: "Lacivert" },
                ].map((color) => (
                  <button
                    key={color.hex}
                    type="button"
                    onClick={() => setPrimaryColorInput(color.hex)}
                    title={color.name}
                    className="w-6 h-6 rounded-lg border border-slate-700 hover:scale-110 transition shrink-0 cursor-pointer"
                    style={{ backgroundColor: color.hex }}
                  />
                ))}
              </div>
            </div>

            {/* Canlı Arayüz & Buton Önizlemesi */}
            <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Arayüz Canlı Önizlemesi
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="px-4 py-2 rounded-xl text-xs font-bold text-white shadow-md transition"
                  style={{ backgroundColor: primaryColorInput }}
                >
                  Örnek Buton
                </button>
                <span
                  className="px-2.5 py-1 rounded-lg text-xs font-medium border"
                  style={{
                    color: primaryColorInput,
                    borderColor: `${primaryColorInput}55`,
                    backgroundColor: `${primaryColorInput}15`,
                  }}
                >
                  Aktif Rozet
                </span>
              </div>
            </div>

            <button
              onClick={handleSaveLimits}
              disabled={saving}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-sm shadow-lg shadow-purple-600/30 transition flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Kurumsal Marka Ayarlarını Kaydet
            </button>
          </div>
        </div>

        {/* SAĞ KOLON: Yönetici Erişim Bilgileri, Destek Biletleri Geçmişi & Proje Listesi */}
        <div className="lg:col-span-7 space-y-6">
          {/* Yönetici (Admin) Erişim Bilgileri Kartı */}
          <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-purple-600/20 text-purple-400">
                  <KeyRound className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    Yönetici (Admin) Erişim Bilgileri
                  </h3>
                  <p className="text-xs text-slate-400">
                    Firmanın ana yönetici hesabının e-posta ve şifresini güncelleyin
                  </p>
                </div>
              </div>
              {adminData && (
                <span className="text-[10px] font-mono font-bold px-2.5 py-1 rounded-full bg-purple-950 text-purple-300 border border-purple-500/30 uppercase tracking-wider">
                  {adminData.role}
                </span>
              )}
            </div>

            {loadingAdmin ? (
              <div className="py-8 flex flex-col items-center justify-center text-slate-500 text-xs">
                <Loader2 className="h-6 w-6 animate-spin text-purple-500 mb-2" />
                <span>Yönetici hesabı sorgulanıyor...</span>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Mevcut Yönetici Bilgi Şeridi */}
                <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-slate-800 flex items-center justify-center text-slate-300 font-bold text-xs border border-slate-700">
                      {adminData?.name ? adminData.name.slice(0, 2).toUpperCase() : "AD"}
                    </div>
                    <div>
                      <span className="text-xs font-bold text-white block">
                        {adminData?.name || "Ana Yönetici Hesabı"}
                      </span>
                      <span className="text-[11px] font-mono text-purple-400">
                        Mevcut E-posta: {adminData?.email || "Henüz atanmadı"}
                      </span>
                    </div>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-500/30 font-semibold">
                    {adminData ? "Aktif Yetkili" : "Hesap Yok"}
                  </span>
                </div>

                {/* Yeni E-posta Adresi */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Yeni E-posta Adresi
                  </label>
                  <input
                    type="email"
                    value={newAdminEmail}
                    onChange={(e) => setNewAdminEmail(e.target.value)}
                    placeholder="admin@firma.com"
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 font-mono"
                  />
                </div>

                {/* Yeni Şifre Belirle */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Yeni Şifre Belirle
                  </label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? "text" : "password"}
                      value={newAdminPassword}
                      onChange={(e) => setNewAdminPassword(e.target.value)}
                      placeholder="Yeni güvenli şifre belirleyin (min. 6 karakter)"
                      className="w-full pl-3.5 pr-10 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      aria-label={showNewPassword ? "Şifreyi gizle" : "Şifreyi göster"}
                      className="absolute right-3 top-2.5 text-slate-500 hover:text-slate-300 transition cursor-pointer"
                    >
                      {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>

                  {/* Güvenlik Notu (Adım 3) */}
                  <div className="mt-2.5 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-2.5 text-xs text-amber-300/90 leading-relaxed">
                    <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <p>
                      <strong>Güvenlik Protokolü:</strong> Güvenlik protokolleri gereği mevcut şifre görüntülenemez, ancak üzerine yazılarak yeni şifre atanabilir.
                    </p>
                  </div>
                </div>

                {/* Güncelle Butonu */}
                <button
                  type="button"
                  onClick={handleUpdateAdminCredentials}
                  disabled={savingAdmin}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-purple-600/30 transition flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  {savingAdmin ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  Giriş Bilgilerini Güncelle
                </button>
              </div>
            )}
          </div>

          {/* Destek Biletleri Geçmişi */}
          <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <LifeBuoy className="h-5 w-5 text-purple-400" />
                Firmanın Destek Talepleri Geçmişi
              </h3>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono">
                {tenant.supportTickets.length} Talep
              </span>
            </div>

            {tenant.supportTickets.length === 0 ? (
              <p className="text-xs text-slate-500 py-6 text-center">
                Bu firma tarafından henüz bir destek talebi açılmamıştır.
              </p>
            ) : (
              <div className="space-y-3">
                {tenant.supportTickets.map((ticket) => (
                  <div
                    key={ticket.id}
                    className="p-4 rounded-2xl bg-slate-950 border border-slate-800/80 space-y-2"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                            ticket.status === "RESOLVED"
                              ? "bg-emerald-950 text-emerald-300 border border-emerald-500/40"
                              : ticket.status === "OPEN"
                              ? "bg-rose-950 text-rose-300 border border-rose-500/40"
                              : "bg-amber-950 text-amber-300 border border-amber-500/40"
                          }`}
                        >
                          {ticket.status}
                        </span>
                        <span className="text-xs font-bold text-white">
                          {ticket.subject}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-500 font-mono">
                        {new Date(ticket.createdAt).toLocaleDateString("tr-TR")}
                      </span>
                    </div>

                    <p className="text-xs text-slate-400 leading-relaxed">
                      {ticket.message}
                    </p>

                    {ticket.response && (
                      <div className="mt-2 p-2.5 rounded-xl bg-emerald-950/20 border border-emerald-500/20 text-xs text-emerald-300 flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 shrink-0 mt-0.5 text-emerald-400" />
                        <div>
                          <strong className="block">Superadmin Yanıtı:</strong>
                          <span>{ticket.response}</span>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Firmanın Projeleri */}
          <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <FolderKanban className="h-5 w-5 text-purple-400" />
                Firmanın Projeleri ({tenant._count.projects})
              </h3>
            </div>

            {tenant.projects.length === 0 ? (
              <p className="text-xs text-slate-500 py-6 text-center">
                Bu firmaya ait kayıtlı proje bulunmamaktadır.
              </p>
            ) : (
              <div className="divide-y divide-slate-800/80">
                {tenant.projects.map((proj) => (
                  <div key={proj.id} className="py-3 flex items-center justify-between text-xs">
                    <div>
                      <p className="font-bold text-white">{proj.name || proj.title}</p>
                      {proj.yibfNo && (
                        <p className="text-[11px] text-purple-400 font-mono mt-0.5">
                          YİBF: {proj.yibfNo}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
                        {proj.status || "ACTIVE"}
                      </span>
                      <span className="font-mono text-slate-400">
                        %{proj.progress || 0}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
