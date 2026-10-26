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
} from "lucide-react"
import toast from "react-hot-toast"

interface TenantDetailData {
  id: string
  name: string
  domain?: string | null
  type: string
  subscriptionPlan: "STARTER" | "PROFESSIONAL" | "ENTERPRISE"
  status: "ACTIVE" | "SUSPENDED"
  paymentStatus: "PAID" | "PAST_DUE" | "FAILED"
  licenses: number
  extraStorageQuota: number
  features: string[]
  createdAt: string
  storage: {
    baseQuotaGb: number
    extraQuotaGb: number
    totalQuotaGb: number
    usedGb: number
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

  // Granüler Limit Form State
  const [extraQuotaInput, setExtraQuotaInput] = useState<number>(0)
  const [licensesInput, setLicensesInput] = useState<number>(50)
  const [selectedPlan, setSelectedPlan] = useState<string>("PROFESSIONAL")
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([])

  useEffect(() => {
    fetchTenantDetail()
  }, [id])

  const fetchTenantDetail = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/superadmin/tenants/${id}`)
      const result = await res.json()
      if (result.success) {
        setTenant(result.data)
        setExtraQuotaInput(result.data.extraStorageQuota || 0)
        setLicensesInput(result.data.licenses || 50)
        setSelectedPlan(result.data.subscriptionPlan)
        setSelectedFeatures(result.data.features || [])
      } else {
        toast.error("Firma bilgileri alınamadı")
      }
    } catch {
      toast.error("Ağ bağlantı hatası")
    } finally {
      setLoading(false)
    }
  }

  // Limit ve Özellik Güncelleme (Save)
  const handleSaveLimits = async () => {
    setSaving(true)
    try {
      const res = await fetch(`/api/superadmin/tenants/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          extraStorageQuota: Number(extraQuotaInput),
          licenses: Number(licensesInput),
          subscriptionPlan: selectedPlan,
          features: selectedFeatures,
        }),
      })
      const result = await res.json()
      if (result.success) {
        toast.success("AWS S3 Depolama kotası ve firma limitleri başarıyla güncellendi!")
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

      {/* Grid: 2 Kolon Yapısı */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* SOL KOLON: AWS S3 Kotası & Granüler Limit Override Formu */}
        <div className="lg:col-span-5 space-y-6">
          {/* AWS S3 Depolama Kullanım Oranı Kartı */}
          <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                <HardDrive className="h-4 w-4 text-purple-400" />
                AWS S3 Depolama Kullanım Oranı
              </span>
              <span
                className={`text-xs font-bold font-mono px-2 py-0.5 rounded-full ${
                  isStorageWarning
                    ? "bg-rose-950 text-rose-300 border border-rose-500/40"
                    : "bg-emerald-950 text-emerald-300 border border-emerald-500/40"
                }`}
              >
                %{storage.usagePercentage} Dolu
              </span>
            </div>

            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-medium">
                <span className="text-white font-mono font-bold">
                  {storage.usedGb} GB Kullanıldı
                </span>
                <span className="text-slate-400 font-mono">
                  Kota: {storage.totalQuotaGb} GB
                </span>
              </div>

              <div className="w-full h-3 rounded-full bg-slate-950 border border-slate-800 overflow-hidden p-0.5">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    storage.usagePercentage > 90
                      ? "bg-rose-500"
                      : storage.usagePercentage > 70
                      ? "bg-amber-500"
                      : "bg-gradient-to-r from-purple-600 to-indigo-500"
                  }`}
                  style={{ width: `${storage.usagePercentage}%` }}
                />
              </div>

              <div className="flex justify-between text-[11px] text-slate-500 pt-1">
                <span>Plan Kotası: {storage.baseQuotaGb} GB</span>
                <span>Ekstra Tanımlanan: +{storage.extraQuotaGb} GB</span>
              </div>
            </div>

            {/* Granüler Depolama Override Inputu */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-purple-300 uppercase tracking-wider">
                  Ek Depolama Tanımla (Override GB)
                </label>
                <span className="text-[11px] text-slate-500 font-mono">
                  Mevcut: +{tenant.extraStorageQuota} GB
                </span>
              </div>

              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <input
                    type="number"
                    min="0"
                    step="25"
                    value={extraQuotaInput}
                    onChange={(e) => setExtraQuotaInput(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white font-mono text-sm focus:outline-none focus:border-purple-500"
                    placeholder="Ekstra GB miktarı..."
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                    GB
                  </span>
                </div>

                <div className="flex gap-1">
                  {[50, 100, 250].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setExtraQuotaInput(preset)}
                      className="px-2.5 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs font-mono text-slate-300"
                    >
                      +{preset}
                    </button>
                  ))}
                </div>
              </div>
              <p className="text-[11px] text-slate-500">
                Bu alana yazılan miktar firmanın standart paket kotasına anında eklenir ve S3 upload sınırını genişletir.
              </p>
            </div>
          </div>

          {/* Granüler Lisans & Plan & Özellik Yönetimi */}
          <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider pb-3 border-b border-slate-800">
              SaaS Paket & Lisans Kotaları
            </h3>

            {/* Plan Seçimi */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Abonelik Paketi
              </label>
              <select
                value={selectedPlan}
                onChange={(e) => setSelectedPlan(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-purple-500"
              >
                <option value="STARTER">STARTER (50 GB S3, 20 Kullanıcı)</option>
                <option value="PROFESSIONAL">PROFESSIONAL (250 GB S3, 50 Kullanıcı)</option>
                <option value="ENTERPRISE">ENTERPRISE (1000 GB S3, Sınırsız)</option>
              </select>
            </div>

            {/* Lisans Sayısı */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Kullanıcı Lisans Sayısı (Saha + Ofis)
              </label>
              <input
                type="number"
                min="5"
                step="5"
                value={licensesInput}
                onChange={(e) => setLicensesInput(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white font-mono focus:outline-none focus:border-purple-500"
              />
            </div>

            {/* Modül Aç / Kapa (SaaS Upsell) */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2">
                Aktif Modüller (Feature Flags)
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { key: "BIM_VIEWER", label: "3D BIM Viewer", icon: Box },
                  { key: "AI_VISION", label: "AI Hasar & Patron", icon: Sparkles },
                  { key: "OCR", label: "Akıllı Evrak OCR", icon: ScanText },
                  { key: "DRONE", label: "İHA & Drone Harita", icon: Plane },
                ].map((feat) => {
                  const Icon = feat.icon
                  const active = selectedFeatures.includes(feat.key)
                  return (
                    <button
                      key={feat.key}
                      type="button"
                      onClick={() => toggleFeature(feat.key)}
                      className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center gap-2 transition ${
                        active
                          ? "bg-purple-600/20 border-purple-500 text-purple-300"
                          : "bg-slate-950 border-slate-800 text-slate-500"
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      <span>{feat.label}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            <button
              onClick={handleSaveLimits}
              disabled={saving}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-sm shadow-lg shadow-purple-600/30 transition flex items-center justify-center gap-2 disabled:opacity-50 mt-4"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Limitleri & Kotaları Kaydet
            </button>
          </div>
        </div>

        {/* SAĞ KOLON: Destek Biletleri Geçmişi & Proje Listesi */}
        <div className="lg:col-span-7 space-y-6">
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
