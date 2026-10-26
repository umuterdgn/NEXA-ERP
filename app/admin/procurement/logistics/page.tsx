"use client"

/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Nexa ERP - Şantiye Kapı Güvenlik & Lojistik Takvim / Trafik Kontrolü
 */

import React, { useState, useEffect, useMemo } from "react"
import Link from "next/link"
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
} from "lucide-react"

interface AppointmentItem {
  id: string
  purchaseRequestId: string
  supplierId: string
  vehiclePlate: string
  driverName?: string | null
  scheduledDate: string
  status: "SCHEDULED" | "ARRIVED" | "UNLOADED" | "REJECTED" | string
  createdAt: string
  purchaseRequest?: {
    id: string
    materialName: string
    quantity: number
    unit: string
    project?: {
      title: string
      name?: string
      location?: string
    }
  }
  supplier?: {
    id: string
    name: string
    phone?: string
  }
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

export default function LogisticsCalendarPage() {
  const [appointments, setAppointments] = useState<AppointmentItem[]>([])
  const [purchaseRequests, setPurchaseRequests] = useState<PurchaseRequestOption[]>([])
  const [companies, setCompanies] = useState<CompanyOption[]>([])
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
  const [formDateTime, setFormDateTime] = useState(
    new Date(Date.now() + 3600000).toISOString().slice(0, 16)
  )
  const [isSubmitting, setIsSubmitting] = useState(false)

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
      const [prRes, compRes] = await Promise.all([
        fetch("/api/procurement/purchase-requests"),
        fetch("/api/admin/companies"),
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
    if (!formPRId || !formSupplierId || !formPlate || !formDateTime) {
      alert("Lütfen zorunlu alanları doldurun.")
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
          scheduledDate: formDateTime,
        }),
      })

      if (res.ok) {
        setIsModalOpen(false)
        setFormPlate("")
        setFormDriver("")
        setToastMsg("Yeni araç randevusu kapı güvenlik sistemine işlendi!")
        setTimeout(() => setToastMsg(null), 3500)
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

  // Statistics
  const stats = useMemo(() => {
    let arrived = 0
    let unloaded = 0
    let scheduled = 0
    let rejected = 0

    appointments.forEach((a) => {
      if (a.status === "ARRIVED") arrived++
      else if (a.status === "UNLOADED") unloaded++
      else if (a.status === "SCHEDULED") scheduled++
      else if (a.status === "REJECTED") rejected++
    })

    return { total: appointments.length, arrived, unloaded, scheduled, rejected }
  }, [appointments])

  // Filtered List based on Search Query
  const filteredAppointments = useMemo(() => {
    if (!searchQuery.trim()) return appointments
    const q = searchQuery.toLowerCase()
    return appointments.filter((a) => {
      const matchPlate = a.vehiclePlate.toLowerCase().includes(q)
      const matchDriver = a.driverName?.toLowerCase().includes(q)
      const matchMaterial = a.purchaseRequest?.materialName.toLowerCase().includes(q)
      const matchSupplier = a.supplier?.name.toLowerCase().includes(q)
      return matchPlate || matchDriver || matchMaterial || matchSupplier
    })
  }, [appointments, searchQuery])

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "SCHEDULED":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/30">
            <Clock className="w-3.5 h-3.5" />
            Randevulu (Yolda)
          </span>
        )
      case "ARRIVED":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-500/20 text-blue-400 border border-blue-500/40 animate-pulse">
            <Truck className="w-3.5 h-3.5" />
            Kapıda (Giriş Yaptı)
          </span>
        )
      case "UNLOADED":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Boşaltıldı (Kabul Edildi)
          </span>
        )
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
                Trafik Kontrolü
              </span>
            </div>
            <p className="text-sm text-slate-400 mt-0.5">
              Şantiyeye giriş yapacak sevkiyat tırlarının saatlik randevu, kapı kontrol ve ambar kabul takibi
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
            <span className="text-xs font-bold uppercase tracking-wider">Randevulu Araçlar</span>
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
          <p className="text-xs text-blue-300/80 mt-2">Boşaltma sahasında bekleyenler</p>
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
          <p className="text-xs text-emerald-400/80 mt-2">Ambara başarıyla inen yükler</p>
        </div>

        {/* Total & Rejected */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 backdrop-blur-xl">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Toplam Sevkiyat Trafiği</span>
            <ShieldCheck className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-3xl font-black text-white tracking-tight">
            {stats.total} Toplam
          </div>
          <p className="text-xs text-slate-400 mt-2">
            Reddedilen: <span className="text-rose-400 font-bold">{stats.rejected}</span> araç
          </p>
        </div>
      </div>

      {/* Date Tabs & Search Toolbar */}
      <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Quick Date Tabs */}
        <div className="flex items-center gap-1 p-1 bg-slate-950 rounded-lg border border-slate-800 overflow-x-auto">
          {[
            { id: "today", label: "Bugün" },
            { id: "tomorrow", label: "Yarın" },
            { id: "week", label: "Bu Hafta" },
            { id: "all", label: "Tüm Tarihler" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveDateTab(tab.id)}
              className={`px-3 py-1.5 rounded-md text-xs font-bold whitespace-nowrap transition-all ${
                activeDateTab === tab.id
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Custom Date & Search */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-slate-400" />
            <input
              type="date"
              value={customDate}
              onChange={(e) => {
                setCustomDate(e.target.value)
                setActiveDateTab("custom")
              }}
              className="px-2.5 py-1.5 text-xs rounded-lg bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="relative sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Plaka, şoför, malzeme ara..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg bg-slate-950 border border-slate-800 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 text-xs rounded-lg bg-slate-950 border border-slate-800 text-slate-300 focus:outline-none focus:border-blue-500"
          >
            <option value="ALL">Tüm Durumlar</option>
            <option value="SCHEDULED">Randevulu (Yolda)</option>
            <option value="ARRIVED">Kapıda (Giriş Yaptı)</option>
            <option value="UNLOADED">Boşaltıldı</option>
            <option value="REJECTED">Reddedildi</option>
          </select>
        </div>
      </div>

      {/* Hourly Timeline DataGrid */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden shadow-2xl backdrop-blur-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/80 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                <th className="py-3.5 px-4 text-center">Randevu Saati</th>
                <th className="py-3.5 px-4">Araç Plakası</th>
                <th className="py-3.5 px-4">Şoför / İletişim</th>
                <th className="py-3.5 px-4">Malzeme & Sipariş</th>
                <th className="py-3.5 px-4">Tedarikçi Firma</th>
                <th className="py-3.5 px-4">Durum</th>
                <th className="py-3.5 px-4 text-center">Kapı / Güvenlik İşlemi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-sm">
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
                  const dateObj = new Date(app.scheduledDate)
                  const timeStr = dateObj.toLocaleTimeString("tr-TR", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                  const dateStr = dateObj.toLocaleDateString("tr-TR")

                  return (
                    <tr
                      key={app.id}
                      className={`transition-colors hover:bg-slate-800/40 ${
                        app.status === "ARRIVED" ? "bg-blue-950/20" : ""
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
                          {app.vehiclePlate}
                        </div>
                      </td>

                      {/* Driver */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-slate-500" />
                          <div>
                            <span className="font-semibold text-white block">
                              {app.driverName || "Belirtilmedi"}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Material & Request */}
                      <td className="py-3.5 px-4">
                        <div>
                          <span className="font-bold text-white block">
                            {app.purchaseRequest?.materialName || "Malzeme Sevkiyatı"}
                          </span>
                          <span className="text-xs text-amber-400 font-semibold block">
                            {app.purchaseRequest?.quantity} {app.purchaseRequest?.unit}
                          </span>
                          <span className="text-[11px] text-slate-400">
                            {app.purchaseRequest?.project?.title || "Şantiye Sahası"}
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
                          {app.status === "SCHEDULED" && (
                            <button
                              onClick={() => handleStatusUpdate(app.id, "ARRIVED")}
                              className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all shadow-md shadow-blue-950 flex items-center gap-1"
                            >
                              <Truck className="w-3.5 h-3.5" />
                              Kapı Girişi Yapıldı
                            </button>
                          )}

                          {app.status === "ARRIVED" && (
                            <>
                              <button
                                onClick={() => handleStatusUpdate(app.id, "UNLOADED")}
                                className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-md shadow-emerald-950 flex items-center gap-1"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                Boşaltıldı
                              </button>
                              <button
                                onClick={() => handleStatusUpdate(app.id, "REJECTED")}
                                className="px-2.5 py-1.5 rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 border border-rose-500/30 text-xs font-semibold"
                                title="Giriş İzni Reddedildi"
                              >
                                Reddet
                              </button>
                            </>
                          )}

                          {app.status === "UNLOADED" && (
                            <Link
                              href={`/admin/procurement/receipts/new?prId=${app.purchaseRequestId}`}
                              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-emerald-400 text-xs font-bold transition-all flex items-center gap-1"
                            >
                              <FileText className="w-3.5 h-3.5" />
                              İrsaliye Girişi
                            </Link>
                          )}

                          {app.status === "REJECTED" && (
                            <button
                              onClick={() => handleStatusUpdate(app.id, "SCHEDULED")}
                              className="text-xs text-slate-500 hover:text-slate-300"
                            >
                              Yeniden Aç
                            </button>
                          )}

                          {/* WhatsApp ile Şoföre Canlı Konum Linki Gönder */}
                          <button
                            type="button"
                            onClick={() => {
                              const raw = (app as any).driverPhone || (app as any).driverContact || "05321112233"
                              let clean = raw.replace(/[^0-9]/g, "")
                              if (clean.startsWith("0")) clean = "9" + clean
                              else if (!clean.startsWith("90") && clean.length === 10) clean = "90" + clean
                              const driverName = app.driverName || "Şoför"
                              const project = (app as any).project?.title || (app as any).projectTitle || (app as any).projectName || "Şantiye Sahası"
                              const text = `Nexa ERP: Sayın ${driverName}, ${project} şantiyesine teslimatınız oluşturulmuştur. Teslimat fişini görmek ve canlı konum takibini (GPS) aktifleştirmek için lütfen aşağıdaki linke tıklayın: https://nxerp.com.tr/track/${app.id}`
                              window.open(`https://wa.me/${clean}?text=${encodeURIComponent(text)}`, "_blank")
                            }}
                            className="p-1 px-2 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 text-[11px] font-semibold flex items-center gap-1 transition-all"
                            title="Şoföre WhatsApp Canlı Konum Linki Gönder"
                          >
                            <MessageSquare className="w-3 h-3" />
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

      {/* New Appointment Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl relative">
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

              {/* Vehicle Plate & Driver */}
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
    </div>
  )
}
