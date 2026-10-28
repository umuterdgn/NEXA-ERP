"use client"

/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Nexa ERP - Şantiye Kapı Güvenlik & Lojistik Takvim / Trafik Kontrolü
 */

import React, { useState, useEffect, useMemo } from "react"
import Link from "next/link"
import { useSession } from "next-auth/react"
import {
  Truck,
  Calendar,
  Clock,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Plus,
  Search,
  Filter,
  Building2,
  Package,
  ShieldCheck,
  ArrowRight,
  RefreshCw,
  MessageSquare,
  FileText,
  User,
  MapPin,
  Phone,
  Copy,
  ExternalLink,
  Check,
} from "lucide-react"

interface AppointmentItem {
  id: string
  purchaseRequestId?: string | null
  materialId?: string | null
  supplierId?: string | null
  vehiclePlate: string
  plateNumber?: string
  driverName?: string | null
  driverPhone?: string | null
  isInternalDriver?: boolean
  driverUserId?: string | null
  scheduledDate: string
  appointmentDate?: string
  status: "BEKLİYOR" | "KAPIDA" | "İÇERİDE" | "BOŞALTILDI" | "İPTAL" | "SCHEDULED" | "ARRIVED" | "UNLOADED" | "REJECTED" | string
  trackingToken?: string | null
  trackingUrl?: string | null
  notes?: string | null
  createdAt: string
  purchaseRequest?: {
    id: string
    materialName: string
    quantity: number
    unit: string
    project?: {
      id?: string
      title: string
      name?: string
      location?: string
    }
  } | null
  supplier?: {
    id: string
    name: string
    phone?: string
  } | null
}

interface PurchaseRequestOption {
  id: string
  materialName: string
  quantity: number
  unit: string
  projectId: string
  project?: {
    title: string
  }
}

interface CompanyOption {
  id: string
  name: string
}

interface InternalDriverOption {
  id: string
  name: string
  email: string
  phone?: string | null
}

export default function LogisticsCalendarPage() {
  const { data: session } = useSession()
  const isSecurity = session?.user?.role === "SECURITY"

  const [appointments, setAppointments] = useState<AppointmentItem[]>([])
  const [purchaseRequests, setPurchaseRequests] = useState<PurchaseRequestOption[]>([])
  const [companies, setCompanies] = useState<CompanyOption[]>([])
  const [internalDrivers, setInternalDrivers] = useState<InternalDriverOption[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeDateTab, setActiveDateTab] = useState<string>("today")
  const [customDate, setCustomDate] = useState<string>(new Date().toISOString().split("T")[0])
  const [statusFilter, setStatusFilter] = useState<string>("ALL")
  const [searchQuery, setSearchQuery] = useState<string>("")
  const [toastMsg, setToastMsg] = useState<string | null>(null)

  // New Appointment Modal
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [formPRId, setFormPRId] = useState("")
  const [formSupplierId, setFormSupplierId] = useState("")
  const [formPlate, setFormPlate] = useState("")
  const [formDriver, setFormDriver] = useState("")
  const [formDriverPhone, setFormDriverPhone] = useState("")
  const [isInternalDriver, setIsInternalDriver] = useState(false)
  const [formDriverUserId, setFormDriverUserId] = useState("")
  const [formDateTime, setFormDateTime] = useState(
    new Date(Date.now() + 3600000).toISOString().slice(0, 16)
  )
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Created Success Modal with WhatsApp link
  const [createdAppointment, setCreatedAppointment] = useState<AppointmentItem | null>(null)
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false)
  const [copiedLink, setCopiedLink] = useState(false)

  useEffect(() => {
    fetchAppointments()
    fetchDropdowns()
  }, [activeDateTab, customDate, statusFilter])

  const fetchAppointments = async () => {
    setIsLoading(true)
    try {
      const dateParam = activeDateTab === "custom" ? customDate : activeDateTab
      const res = await fetch(`/api/procurement/logistics?date=${dateParam}&status=${statusFilter}`)
      if (res.ok) {
        const data = await res.json()
        setAppointments(Array.isArray(data) ? data : [])
      }
    } catch (err) {
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchDropdowns = async () => {
    try {
      const [prRes, compRes, usersRes] = await Promise.all([
        fetch("/api/procurement/purchase-requests"),
        fetch("/api/admin/companies"),
        fetch("/api/admin/users"),
      ])
      if (prRes.ok) {
        const prData = await prRes.json()
        setPurchaseRequests(Array.isArray(prData) ? prData : [])
        if (prData.length > 0) setFormPRId(prData[0].id)
      }
      if (compRes.ok) {
        const compData = await compRes.json()
        setCompanies(Array.isArray(compData) ? compData : [])
        if (compData.length > 0) setFormSupplierId(compData[0].id)
      }
      if (usersRes.ok) {
        const usersData = await usersRes.json()
        const userList = Array.isArray(usersData?.users)
          ? usersData.users
          : Array.isArray(usersData)
          ? usersData
          : []
        const drivers = userList.filter((u: any) => u.role === "DRIVER")
        setInternalDrivers(drivers)
      }
    } catch (err) {
      console.error(err)
    }
  }

  const handleStatusUpdate = async (id: string, newStatus: string) => {
    try {
      const res = await fetch("/api/procurement/logistics", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: newStatus }),
      })
      if (res.ok) {
        setToastMsg(`Sevkiyat durumu güncellendi: ${newStatus}`)
        setTimeout(() => setToastMsg(null), 3500)
        await fetchAppointments()
      }
    } catch (err) {
      console.error(err)
    }
  }

  const handleCreateAppointment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formPRId || !formSupplierId || !formPlate || !formDateTime || !formDriverPhone.trim()) {
      alert("Lütfen zorunlu alanları doldurun (Araç plakası, randevu tarihi, sürücü telefon numarası zorunludur).")
      return
    }

    setIsSubmitting(true)
    try {
      const res = await fetch("/api/procurement/logistics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          purchaseRequestId: formPRId,
          supplierId: formSupplierId,
          vehiclePlate: formPlate,
          driverName: formDriver,
          driverPhone: formDriverPhone.trim(),
          isInternalDriver,
          driverUserId: isInternalDriver && formDriverUserId ? formDriverUserId : null,
          scheduledDate: formDateTime,
          status: "BEKLİYOR",
        }),
      })

      if (res.ok) {
        const createdData = await res.json()
        setIsModalOpen(false)
        setFormPlate("")
        setFormDriver("")
        setFormDriverPhone("")
        setIsInternalDriver(false)
        setFormDriverUserId("")
        setToastMsg("Yeni araç randevusu kapı güvenlik sistemine işlendi!")
        setTimeout(() => setToastMsg(null), 3500)
        
        // Show success modal with WhatsApp button
        setCreatedAppointment(createdData)
        setIsSuccessModalOpen(true)
        
        await fetchAppointments()
      } else {
        const err = await res.json()
        alert(err.error || "Randevu oluşturulamadı.")
      }
    } catch (error) {
      console.error(error)
      alert("Hata oluştu.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const getWhatsAppShareUrl = (phone?: string | null, name?: string | null, url?: string | null) => {
    let clean = (phone || "").replace(/[^0-9]/g, "")
    if (clean.startsWith("0")) clean = "9" + clean
    else if (!clean.startsWith("90") && clean.length === 10) clean = "90" + clean
    const driverName = name || "Sürücü"
    const tracking = url || "https://nxerp.com.tr"
    // Specified prompt format:
    // https://wa.me/${driverPhone}?text=Sayin ${driverName}, teslimat randevunuz olusturuldu. Canli konum takibi ve irsaliye icin linke tiklayin: ${trackingUrl}
    const message = `Sayin ${driverName}, teslimat randevunuz olusturuldu. Canli konum takibi ve irsaliye icin linke tiklayin: ${tracking}`
    return `https://wa.me/${clean}?text=${encodeURIComponent(message)}`
  }

  // Statistics
  const stats = useMemo(() => {
    let arrived = 0
    let unloaded = 0
    let scheduled = 0
    let inside = 0
    let rejected = 0

    appointments.forEach((a) => {
      if (a.status === "ARRIVED" || a.status === "KAPIDA") arrived++
      else if (a.status === "UNLOADED" || a.status === "BOŞALTILDI") unloaded++
      else if (a.status === "SCHEDULED" || a.status === "BEKLİYOR") scheduled++
      else if (a.status === "İÇERİDE") inside++
      else if (a.status === "REJECTED" || a.status === "İPTAL") rejected++
    })

    return { total: appointments.length, arrived, unloaded, scheduled, inside, rejected }
  }, [appointments])

  // Filtered List based on Search Query
  const filteredAppointments = useMemo(() => {
    if (!searchQuery.trim()) return appointments
    const q = searchQuery.toLowerCase()
    return appointments.filter((a) => {
      const matchPlate = (a.vehiclePlate || a.plateNumber || "").toLowerCase().includes(q)
      const matchDriver = (a.driverName || "").toLowerCase().includes(q)
      const matchPhone = (a.driverPhone || "").toLowerCase().includes(q)
      const matchMaterial = (a.purchaseRequest?.materialName || "").toLowerCase().includes(q)
      const matchSupplier = (a.supplier?.name || "").toLowerCase().includes(q)
      return matchPlate || matchDriver || matchPhone || matchMaterial || matchSupplier
    })
  }, [appointments, searchQuery])

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "BEKLİYOR":
      case "SCHEDULED":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/30">
            <Clock className="w-3.5 h-3.5" />
            Randevulu (Bekliyor)
          </span>
        )
      case "KAPIDA":
      case "ARRIVED":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-500/20 text-blue-400 border border-blue-500/40 animate-pulse">
            <Truck className="w-3.5 h-3.5" />
            Kapıda (Giriş Yaptı)
          </span>
        )
      case "İÇERİDE":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
            <MapPin className="w-3.5 h-3.5" />
            Şantiye Sahasında (İçeride)
          </span>
        )
      case "BOŞALTILDI":
      case "UNLOADED":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Boşaltıldı (Kabul Edildi)
          </span>
        )
      case "İPTAL":
      case "REJECTED":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-500/20 text-rose-400 border border-rose-500/40">
            <XCircle className="w-3.5 h-3.5" />
            Reddedildi / İptal
          </span>
        )
      default:
        return <span className="text-xs text-slate-400">{status}</span>
    }
  }

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto min-h-screen text-slate-100 bg-slate-950">
      {/* Toast Alert */}
      {toastMsg && (
        <div className="fixed top-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-xl bg-emerald-500 text-white shadow-2xl animate-bounce">
          <CheckCircle2 className="w-5 h-5" />
          <span className="font-bold text-sm">{toastMsg}</span>
        </div>
      )}

      {/* Security Role Mode Notice */}
      {isSecurity && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-900/40 via-indigo-900/30 to-slate-900 border border-blue-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-600/30 border border-blue-400/40 text-blue-300">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-white text-sm">Şantiye Kapı Güvenlik Terminali</h3>
              <p className="text-xs text-blue-200/80">
                Gelen araçların plakasını teyit ediniz. Kapıya ulaşan araçların yanındaki <strong>&quot;Kapıya Geldi&quot;</strong> butonuna basınız.
              </p>
            </div>
          </div>
          <span className="self-start sm:self-auto px-3 py-1 rounded-full text-xs font-bold bg-blue-500/20 text-blue-400 border border-blue-500/40 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
            KAPI GÖREVLİSİ AKTİF
          </span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-xl shadow-blue-950/40">
            <Truck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight text-white">
                Şantiye Kapı Güvenlik & Lojistik Takvimi
              </h1>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/30 font-bold">
                Trafik & Güvenlik
              </span>
            </div>
            <p className="text-sm text-slate-400 mt-0.5">
              Şantiyeye giriş yapacak sevkiyat tırlarının randevu, kapı güvenlik kabul ve WhatsApp canlı takip kontrolü
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/admin/procurement/receipts/new"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 hover:border-slate-500 text-slate-200 hover:text-white font-semibold text-xs transition-all shadow-sm"
          >
            <FileText className="w-4 h-4 text-emerald-400" />
            Ambar Mal Kabul Formu (İrsaliye)
          </Link>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition-all shadow-lg shadow-blue-950"
          >
            <Plus className="w-4 h-4" />
            Yeni Kapı Randevusu
          </button>
        </div>
      </div>

      {/* KPI Status Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Scheduled */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 backdrop-blur-xl">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Beklenen Araçlar</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-3xl font-black text-amber-400 tracking-tight">
            {stats.scheduled} Tır / Kamyon
          </div>
          <p className="text-xs text-slate-400 mt-2">Şantiyeye gelişi beklenen araçlar</p>
        </div>

        {/* Arrived */}
        <div className="p-5 rounded-2xl bg-gradient-to-b from-blue-950/40 to-slate-900 border border-blue-900/60 backdrop-blur-xl">
          <div className="flex items-center justify-between text-blue-300 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-ping" />
              Kapıda (Giriş Yaptı)
            </span>
            <Truck className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-3xl font-black text-blue-400 tracking-tight">
            {stats.arrived} Araç
          </div>
          <p className="text-xs text-blue-300/80 mt-2">Kapıda kontrol bekleyen veya giriş yapan</p>
        </div>

        {/* Unloaded */}
        <div className="p-5 rounded-2xl bg-gradient-to-b from-emerald-950/40 to-slate-900 border border-emerald-900/60 backdrop-blur-xl">
          <div className="flex items-center justify-between text-emerald-300 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Boşaltıldı & Teslim</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-3xl font-black text-emerald-400 tracking-tight">
            {stats.unloaded} Araç
          </div>
          <p className="text-xs text-emerald-400/80 mt-2">Ambara kabulü tamamlanmış yükler</p>
        </div>

        {/* Total */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 backdrop-blur-xl">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Toplam Takvim Kaydı</span>
            <Calendar className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-3xl font-black text-white tracking-tight">
            {stats.total} Sefer
          </div>
          <p className="text-xs text-slate-400 mt-2">Kayıtlı randevu & lojistik trafiği</p>
        </div>
      </div>

      {/* Date & Filter Tabs */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-xl">
        {/* Date Tabs */}
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => setActiveDateTab("today")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeDateTab === "today"
                ? "bg-blue-600 text-white shadow-lg shadow-blue-950"
                : "bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700"
            }`}
          >
            Bugün Beklenenler
          </button>
          <button
            onClick={() => setActiveDateTab("tomorrow")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeDateTab === "tomorrow"
                ? "bg-blue-600 text-white shadow-lg shadow-blue-950"
                : "bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700"
            }`}
          >
            Yarın
          </button>
          <button
            onClick={() => setActiveDateTab("week")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeDateTab === "week"
                ? "bg-blue-600 text-white shadow-lg shadow-blue-950"
                : "bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700"
            }`}
          >
            Bu Hafta (7 Gün)
          </button>
          <button
            onClick={() => setActiveDateTab("all")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeDateTab === "all"
                ? "bg-blue-600 text-white shadow-lg shadow-blue-950"
                : "bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700"
            }`}
          >
            Tümü
          </button>
        </div>

        {/* Search & Custom Date */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Plaka, Şoför, Malzeme veya Tel ara..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 text-xs rounded-xl bg-slate-950 border border-slate-800 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 w-56 sm:w-64"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">Tarih Seç:</span>
            <input
              type="date"
              value={customDate}
              onChange={(e) => {
                setCustomDate(e.target.value)
                setActiveDateTab("custom")
              }}
              className="px-3 py-1.5 text-xs rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-blue-500 font-mono"
            />
          </div>

          <button
            onClick={() => fetchAppointments()}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all"
            title="Yenile"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Main Table */}
      <div className="rounded-2xl bg-slate-900/80 border border-slate-800 overflow-hidden backdrop-blur-xl shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/70 text-slate-400 font-semibold uppercase tracking-wider">
                <th className="py-4 px-4 text-center">Randevu Saati</th>
                <th className="py-4 px-4">Araç Plakası</th>
                <th className="py-4 px-4">Sürücü & İletişim</th>
                <th className="py-4 px-4">Malzeme / Talep</th>
                <th className="py-4 px-4">Tedarikçi Firma</th>
                <th className="py-4 px-4">Durum</th>
                <th className="py-4 px-4 text-center">Kapı & WhatsApp İşlemleri</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-500" />
                    Lojistik takvim yükleniyor...
                  </td>
                </tr>
              ) : filteredAppointments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <Truck className="w-10 h-10 mx-auto mb-2 text-slate-600" />
                    Seçili tarih ve filtreye ait araç randevusu bulunamadı.
                  </td>
                </tr>
              ) : (
                filteredAppointments.map((app) => {
                  const dateVal = app.appointmentDate || app.scheduledDate
                  const dateObj = new Date(dateVal)
                  const timeStr = dateObj.toLocaleTimeString("tr-TR", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                  const dateStr = dateObj.toLocaleDateString("tr-TR")
                  const plate = app.plateNumber || app.vehiclePlate

                  const isWaiting = app.status === "BEKLİYOR" || app.status === "SCHEDULED"
                  const isArrived = app.status === "KAPIDA" || app.status === "ARRIVED"
                  const isInside = app.status === "İÇERİDE"
                  const isUnloaded = app.status === "BOŞALTILDI" || app.status === "UNLOADED"
                  const isRejected = app.status === "İPTAL" || app.status === "REJECTED"

                  return (
                    <tr
                      key={app.id}
                      className={`transition-colors hover:bg-slate-800/40 ${
                        isArrived ? "bg-blue-950/20" : isInside ? "bg-indigo-950/20" : ""
                      }`}
                    >
                      {/* Scheduled Time */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <div className="font-mono font-bold text-white text-base">{timeStr}</div>
                        <div className="text-[11px] text-slate-500">{dateStr}</div>
                      </td>

                      {/* Vehicle Plate (Turkish Plate Styled badge) */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="inline-flex items-center border-2 border-slate-300 rounded-md bg-white text-slate-900 font-mono font-black text-xs px-2 py-1 shadow-md">
                          <span className="bg-blue-700 text-white text-[10px] px-1 py-0.5 rounded-sm mr-1.5 font-bold">
                            TR
                          </span>
                          {plate}
                        </div>
                        {app.isInternalDriver && (
                          <span className="block mt-1 text-[10px] text-emerald-400 font-semibold">
                            ● İç Sistem Şoförü
                          </span>
                        )}
                      </td>

                      {/* Driver & Phone */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-start gap-2">
                          <User className="w-4 h-4 text-slate-500 mt-0.5" />
                          <div>
                            <span className="font-semibold text-white block">
                              {app.driverName || "Belirtilmedi"}
                            </span>
                            {app.driverPhone ? (
                              <span className="text-[11px] font-mono text-slate-400 flex items-center gap-1">
                                <Phone className="w-3 h-3 text-emerald-400" />
                                {app.driverPhone}
                              </span>
                            ) : (
                              <span className="text-[10px] text-slate-500">Tel yok</span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Material & Request */}
                      <td className="py-3.5 px-4">
                        <div>
                          <span className="font-bold text-white block">
                            {app.purchaseRequest?.materialName || (app as any).title || "Malzeme Sevkiyatı"}
                          </span>
                          {app.purchaseRequest?.quantity && (
                            <span className="text-xs text-amber-400 font-semibold block">
                              {app.purchaseRequest.quantity} {app.purchaseRequest.unit}
                            </span>
                          )}
                          <span className="text-[11px] text-slate-400">
                            {app.purchaseRequest?.project?.title || (app as any).project?.title || "Şantiye Sahası"}
                          </span>
                        </div>
                      </td>

                      {/* Supplier */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 text-slate-300">
                          <Building2 className="w-4 h-4 text-slate-500" />
                          <span className="font-medium truncate max-w-[180px]">
                            {app.supplier?.name || "Tedarikçi"}
                          </span>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 whitespace-nowrap">{getStatusBadge(app.status)}</td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-2">
                          {/* Kapıya Geldi (For Bekliyor / Scheduled) - ADIM 4 */}
                          {isWaiting && (
                            <button
                              onClick={() => handleStatusUpdate(app.id, "KAPIDA")}
                              className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all shadow-md shadow-blue-950 flex items-center gap-1"
                              title="Aracın şantiye kapısına ulaştığını onaylar"
                            >
                              <Truck className="w-3.5 h-3.5" />
                              Kapıya Geldi
                            </button>
                          )}

                          {/* Kapıda ise İçeri Al veya Boşaltıldı */}
                          {isArrived && (
                            <>
                              <button
                                onClick={() => handleStatusUpdate(app.id, "İÇERİDE")}
                                className="px-2.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all flex items-center gap-1"
                                title="Şantiye içine giriş izni verildi"
                              >
                                <ArrowRight className="w-3.5 h-3.5" />
                                İçeri Al
                              </button>
                              <button
                                onClick={() => handleStatusUpdate(app.id, "BOŞALTILDI")}
                                className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-md shadow-emerald-950 flex items-center gap-1"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                Boşaltıldı
                              </button>
                              <button
                                onClick={() => handleStatusUpdate(app.id, "İPTAL")}
                                className="px-2 py-1.5 rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 border border-rose-500/30 text-xs font-semibold"
                                title="Giriş İzni Reddedildi"
                              >
                                Reddet
                              </button>
                            </>
                          )}

                          {/* İçeride ise Boşaltıldı buton */}
                          {isInside && (
                            <button
                              onClick={() => handleStatusUpdate(app.id, "BOŞALTILDI")}
                              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-md shadow-emerald-950 flex items-center gap-1"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Boşaltıldı
                            </button>
                          )}

                          {isUnloaded && (
                            <Link
                              href={`/admin/procurement/receipts/new?prId=${app.purchaseRequestId || app.materialId || ""}`}
                              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-emerald-400 text-xs font-bold transition-all flex items-center gap-1"
                            >
                              <FileText className="w-3.5 h-3.5" />
                              İrsaliye Girişi
                            </Link>
                          )}

                          {isRejected && (
                            <button
                              onClick={() => handleStatusUpdate(app.id, "BEKLİYOR")}
                              className="text-xs text-slate-500 hover:text-slate-300"
                            >
                              Yeniden Aç
                            </button>
                          )}

                          {/* WhatsApp ile Şoföre Konum & İrsaliye Linki Gönder */}
                          <button
                            type="button"
                            onClick={() => {
                              const waUrl = getWhatsAppShareUrl(
                                app.driverPhone,
                                app.driverName,
                                app.trackingUrl || `https://nxerp.com.tr/track/${app.trackingToken || app.id}`
                              )
                              window.open(waUrl, "_blank")
                            }}
                            className="p-1 px-2.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 text-xs font-semibold flex items-center gap-1 transition-all"
                            title="Sürücüye WhatsApp ile Konum Linki Gönder"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                            <span>WhatsApp</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Appointment Modal (ADIM 3) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Truck className="w-5 h-5 text-blue-500" />
                Yeni Şantiye Kapı Randevusu
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateAppointment} className="space-y-4 mt-4">
              {/* Şoför Tipi Switch / Checkbox - ADIM 3 */}
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <label className="block text-xs font-semibold text-slate-300 mb-2">
                  Şoför Tipi *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsInternalDriver(false)
                      setFormDriverUserId("")
                    }}
                    className={`p-2.5 rounded-lg text-xs font-bold border transition-all text-center flex items-center justify-center gap-2 ${
                      !isInternalDriver
                        ? "bg-blue-600/20 border-blue-500 text-blue-400 shadow-md"
                        : "bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    <span>[X] Dışarıdan Gelen Şoför (Dış)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsInternalDriver(true)}
                    className={`p-2.5 rounded-lg text-xs font-bold border transition-all text-center flex items-center justify-center gap-2 ${
                      isInternalDriver
                        ? "bg-emerald-600/20 border-emerald-500 text-emerald-400 shadow-md"
                        : "bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    <span>[X] Sistem Kayıtlı Şoför (İç)</span>
                  </button>
                </div>
                <p className="text-[11px] text-slate-400 mt-2">
                  {!isInternalDriver
                    ? "Dış şoförler için kayıt sonrasında WhatsApp canlı GPS takip linki oluşturulacaktır."
                    : "İç sistem şoförleri 'Personel Portalı' üzerinden sefer ve QR kodlarına erişir."}
                </p>
              </div>

              {/* If Internal Driver, choose from system DRIVER accounts */}
              {isInternalDriver && (
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Sistemdeki Sürücü Personeli
                  </label>
                  <select
                    value={formDriverUserId}
                    onChange={(e) => {
                      const uid = e.target.value
                      setFormDriverUserId(uid)
                      const driver = internalDrivers.find((d) => d.id === uid)
                      if (driver) {
                        setFormDriver(driver.name)
                        if (driver.phone) setFormDriverPhone(driver.phone)
                      }
                    }}
                    className="w-full px-3 py-2 text-sm rounded-lg bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-blue-500"
                  >
                    <option value="">-- Sürücü Seçin --</option>
                    {internalDrivers.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name} ({d.email})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Purchase Request Selection */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  İlgili Satınalma Talebi / Malzeme *
                </label>
                <select
                  value={formPRId}
                  onChange={(e) => setFormPRId(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-blue-500"
                  required
                >
                  {purchaseRequests.map((pr) => (
                    <option key={pr.id} value={pr.id}>
                      {pr.materialName} ({pr.quantity} {pr.unit}) - {pr.project?.title || "Şantiye"}
                    </option>
                  ))}
                </select>
              </div>

              {/* Supplier Selection */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Tedarikçi / Lojistik Firması *
                </label>
                <select
                  value={formSupplierId}
                  onChange={(e) => setFormSupplierId(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-blue-500"
                  required
                >
                  {companies.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Vehicle Plate & Driver Name */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Araç Plakası *
                  </label>
                  <input
                    type="text"
                    placeholder="34 VR 8901"
                    value={formPlate}
                    onChange={(e) => setFormPlate(e.target.value.toUpperCase())}
                    className="w-full px-3 py-2 text-sm rounded-lg bg-slate-950 border border-slate-800 text-white font-mono font-bold focus:outline-none focus:border-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Sürücü Adı Soyadı
                  </label>
                  <input
                    type="text"
                    placeholder="Ahmet Yılmaz"
                    value={formDriver}
                    onChange={(e) => setFormDriver(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Sürücü Telefon Numarası (ZORUNLU) - ADIM 3 */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center justify-between">
                  <span>Sürücü Telefon Numarası (WhatsApp için KRİTİK) *</span>
                  <span className="text-[10px] text-emerald-400 font-normal">WhatsApp Linki Gönderilecek</span>
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="tel"
                    placeholder="0532 123 45 67 veya 905321234567"
                    value={formDriverPhone}
                    onChange={(e) => setFormDriverPhone(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-sm rounded-lg bg-slate-950 border border-slate-800 text-white font-mono focus:outline-none focus:border-emerald-500"
                    required
                  />
                </div>
              </div>

              {/* Scheduled Date & Time */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Randevu Tarihi ve Saati *
                </label>
                <input
                  type="datetime-local"
                  value={formDateTime}
                  onChange={(e) => setFormDateTime(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-blue-500 font-mono"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-500 text-white transition-all shadow-lg shadow-blue-950"
                >
                  {isSubmitting ? "Kaydediliyor..." : "Randevuyu Onayla"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Success Modal with WhatsApp Action (ADIM 3) */}
      {isSuccessModalOpen && createdAppointment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl relative text-center space-y-4 animate-in fade-in zoom-in duration-200">
            <div className="w-14 h-14 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div>
              <h3 className="text-lg font-bold text-white">Randevu Başarıyla Oluşturuldu!</h3>
              <p className="text-xs text-slate-400 mt-1">
                {createdAppointment.plateNumber || createdAppointment.vehiclePlate} plakalı araç kapı randevusu sisteme işlendi.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-left text-xs space-y-1.5 font-mono">
              <div className="flex justify-between">
                <span className="text-slate-500">Sürücü:</span>
                <span className="text-white font-bold">{createdAppointment.driverName || "Belirtilmedi"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Telefon:</span>
                <span className="text-emerald-400 font-bold">{createdAppointment.driverPhone}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Şoför Türü:</span>
                <span className="text-blue-400 font-semibold">
                  {createdAppointment.isInternalDriver ? "Sistem Kayıtlı (İç)" : "Dışarıdan Gelen (Dış)"}
                </span>
              </div>
            </div>

            {/* Sürücüye WhatsApp ile Konum Linki Gönder Butonu (ADIM 3) */}
            <div className="space-y-2 pt-2">
              <a
                href={getWhatsAppShareUrl(
                  createdAppointment.driverPhone,
                  createdAppointment.driverName,
                  createdAppointment.trackingUrl
                )}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm transition-all shadow-lg shadow-emerald-950"
              >
                <MessageSquare className="w-5 h-5" />
                Sürücüye WhatsApp ile Konum Linki Gönder
              </a>

              {createdAppointment.trackingUrl && (
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(createdAppointment.trackingUrl!)
                    setCopiedLink(true)
                    setTimeout(() => setCopiedLink(false), 2500)
                  }}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-all border border-slate-700"
                >
                  {copiedLink ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Takip Linki Kopyalandı!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Takip Linkini Kopyala</span>
                    </>
                  )}
                </button>
              )}
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => {
                  setIsSuccessModalOpen(false)
                  setCreatedAppointment(null)
                }}
                className="text-xs text-slate-400 hover:text-white"
              >
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
