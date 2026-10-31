"use client"
/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Site Manager / Field Personnel Material Acceptance & Delivery Confirmation Portal
 */

import React, { useState, useEffect, useRef } from "react"
import { 
  Truck, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  MapPin, 
  Phone, 
  Camera, 
  Upload, 
  X, 
  Image as ImageIcon, 
  Loader2, 
  Calendar, 
  RefreshCw, 
  Building2, 
  FileText,
  AlertCircle,
  Eye,
  Check,
  ChevronRight
} from "lucide-react"
import { getPersonnelDeliveriesAction, confirmDeliveryAction, reportDeliveryIssueAction } from "./actions"
import toast from "react-hot-toast"

interface DeliveryItem {
  id: string
  title: string
  type: string
  location: string
  supplierName?: string | null
  driverContact?: string | null
  status: "PLANNED" | "IN_TRANSIT" | "DELIVERED" | "ISSUE_REPORTED" | string
  scheduledAt: string
  completedAt?: string | null
  notes?: string | null
  deliveryProofImageUrl?: string | null
  deliveryNotes?: string | null
  receivedById?: string | null
  receivedBy?: {
    id: string
    name: string
  } | null
  project?: {
    id: string
    name?: string | null
    title?: string | null
  } | null
}

export default function PersonnelDeliveriesPage() {
  const [deliveries, setDeliveries] = useState<DeliveryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<"ACTIVE" | "DELIVERED" | "ISSUE_REPORTED" | "ALL">("ACTIVE")
  
  // Action states
  const [confirmingId, setConfirmingId] = useState<string | null>(null)
  
  // Issue Modal state
  const [selectedDelivery, setSelectedDelivery] = useState<DeliveryItem | null>(null)
  const [issueNotes, setIssueNotes] = useState("")
  const [issuePhotoFile, setIssuePhotoFile] = useState<File | null>(null)
  const [issuePhotoPreview, setIssuePhotoPreview] = useState<string | null>(null)
  const [isSubmittingIssue, setIsSubmittingIssue] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Photo viewer lightbox
  const [previewPhotoUrl, setPreviewPhotoUrl] = useState<string | null>(null)

  useEffect(() => {
    loadDeliveries()
  }, [])

  const loadDeliveries = async () => {
    setLoading(true)
    try {
      const res = await getPersonnelDeliveriesAction()
      if (res.success && res.deliveries) {
        setDeliveries(res.deliveries as DeliveryItem[])
      } else {
        toast.error(res.error || "Teslimatlar yüklenemedi")
      }
    } catch (err) {
      console.error(err)
      toast.error("Bağlantı hatası oluştu")
    } finally {
      setLoading(false)
    }
  }

  // Handle instant "Teslim Alındı" confirmation
  const handleConfirmDelivery = async (delivery: DeliveryItem) => {
    setConfirmingId(delivery.id)
    try {
      const res = await confirmDeliveryAction(delivery.id)
      if (res.success) {
        toast.success(`"${delivery.title}" başarıyla teslim alındı olarak onaylandı.`)
        // Optimistic update
        setDeliveries(prev => prev.map(d => d.id === delivery.id ? { ...d, status: "DELIVERED", completedAt: new Date().toISOString() } : d))
      } else {
        toast.error(res.error || "İşlem başarısız oldu.")
      }
    } catch (err) {
      console.error(err)
      toast.error("Bağlantı hatası")
    } finally {
      setConfirmingId(null)
    }
  }

  // Open Issue Report Modal
  const openIssueModal = (delivery: DeliveryItem) => {
    setSelectedDelivery(delivery)
    setIssueNotes("")
    setIssuePhotoFile(null)
    setIssuePhotoPreview(null)
  }

  const closeIssueModal = () => {
    setSelectedDelivery(null)
    setIssueNotes("")
    setIssuePhotoFile(null)
    setIssuePhotoPreview(null)
  }

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 15 * 1024 * 1024) {
        toast.error("Fotoğraf boyutu 15MB'dan küçük olmalıdır.")
        return
      }
      setIssuePhotoFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setIssuePhotoPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  // Submit Issue Report
  const handleSubmitIssue = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedDelivery) return

    if (!issueNotes.trim()) {
      toast.error("Lütfen hasar veya eksik ile ilgili tutanak notu giriniz.")
      return
    }

    setIsSubmittingIssue(true)
    try {
      const formData = new FormData()
      formData.append("id", selectedDelivery.id)
      formData.append("deliveryNotes", issueNotes.trim())
      if (issuePhotoFile) {
        formData.append("photo", issuePhotoFile)
      } else if (issuePhotoPreview) {
        formData.append("imageUrl", issuePhotoPreview)
      }

      const res = await reportDeliveryIssueAction(formData)
      if (res.success) {
        toast.success("Sorun bildirimi ve kanıt başarıyla kaydedildi.")
        closeIssueModal()
        // Reload deliveries to reflect latest DB state
        loadDeliveries()
      } else {
        toast.error(res.error || "Sorun bildirilirken hata oluştu.")
      }
    } catch (err) {
      console.error(err)
      toast.error("İşlem sırasında hata meydana geldi.")
    } finally {
      setIsSubmittingIssue(false)
    }
  }

  // Filter deliveries based on selected tab
  const activeDeliveries = deliveries.filter(d => d.status === "IN_TRANSIT" || d.status === "PLANNED" || d.status === "Planlandı" || d.status === "Yolda")
  const deliveredDeliveries = deliveries.filter(d => d.status === "DELIVERED" || d.status === "Tamamlandı")
  const issueDeliveries = deliveries.filter(d => d.status === "ISSUE_REPORTED" || d.status === "İptal")

  const displayedDeliveries = (() => {
    switch (activeTab) {
      case "ACTIVE":
        return activeDeliveries
      case "DELIVERED":
        return deliveredDeliveries
      case "ISSUE_REPORTED":
        return issueDeliveries
      case "ALL":
      default:
        return deliveries
    }
  })()

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PLANNED":
      case "Planlandı":
        return "bg-slate-500/20 text-slate-300 border-slate-500/40"
      case "IN_TRANSIT":
      case "Yolda":
        return "bg-blue-500/20 text-blue-400 border-blue-500/40 animate-pulse"
      case "DELIVERED":
      case "Tamamlandı":
        return "bg-emerald-500/20 text-emerald-400 border-emerald-500/40"
      case "ISSUE_REPORTED":
      case "İptal":
        return "bg-red-500/20 text-red-400 border-red-500/40"
      default:
        return "bg-slate-500/20 text-slate-300 border-slate-500/40"
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "PLANNED":
      case "Planlandı":
        return "Planlandı"
      case "IN_TRANSIT":
      case "Yolda":
        return "Yolda / Geliyor"
      case "DELIVERED":
      case "Tamamlandı":
        return "Teslim Alındı"
      case "ISSUE_REPORTED":
      case "İptal":
        return "Sorunlu / Eksik"
      default:
        return status
    }
  }

  const getTypeBadge = (type: string) => {
    switch (type) {
      case "BETON":
        return "bg-blue-600/20 text-blue-300 border-blue-500/40"
      case "MALZEME_TESLİMAT":
        return "bg-purple-600/20 text-purple-300 border-purple-500/40"
      case "DENETİM":
        return "bg-amber-600/20 text-amber-300 border-amber-500/40"
      default:
        return "bg-slate-600/20 text-slate-300 border-slate-500/40"
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white pb-16">
      {/* Top Header */}
      <div className="bg-slate-900/90 border-b border-slate-800 p-4 lg:p-6 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-600/30 flex-shrink-0">
              <Truck className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                Şantiye Malzeme Kabul & Teslimat
              </h1>
              <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
                Gelen sevkiyatları kontrol edin, teslim alın veya hasar/eksik tutanağı tutun.
              </p>
            </div>
          </div>

          <button
            onClick={loadDeliveries}
            disabled={loading}
            className="self-end sm:self-auto flex items-center gap-2 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-blue-400" : ""}`} />
            Yenile
          </button>
        </div>

        {/* Tab Filters */}
        <div className="max-w-5xl mx-auto mt-5 flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <button
            onClick={() => setActiveTab("ACTIVE")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap border ${
              activeTab === "ACTIVE"
                ? "bg-blue-600 text-white border-blue-500 shadow-lg shadow-blue-600/30"
                : "bg-slate-800/80 text-slate-300 border-slate-700 hover:bg-slate-700"
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            Gelen / Bekleyenler
            <span className="ml-1 px-1.5 py-0.2 rounded-full bg-black/30 text-[11px] font-mono">
              {activeDeliveries.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("DELIVERED")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap border ${
              activeTab === "DELIVERED"
                ? "bg-emerald-600 text-white border-emerald-500 shadow-lg shadow-emerald-600/30"
                : "bg-slate-800/80 text-slate-300 border-slate-700 hover:bg-slate-700"
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            Teslim Alınanlar
            <span className="ml-1 px-1.5 py-0.2 rounded-full bg-black/30 text-[11px] font-mono">
              {deliveredDeliveries.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("ISSUE_REPORTED")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap border ${
              activeTab === "ISSUE_REPORTED"
                ? "bg-red-600 text-white border-red-500 shadow-lg shadow-red-600/30"
                : "bg-slate-800/80 text-slate-300 border-slate-700 hover:bg-slate-700"
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            Sorun Bildirilenler
            <span className="ml-1 px-1.5 py-0.2 rounded-full bg-black/30 text-[11px] font-mono">
              {issueDeliveries.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("ALL")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap border ${
              activeTab === "ALL"
                ? "bg-slate-700 text-white border-slate-500"
                : "bg-slate-800/50 text-slate-400 border-slate-800 hover:bg-slate-800"
            }`}
          >
            Tüm Sevkiyatlar ({deliveries.length})
          </button>
        </div>
      </div>

      {/* Main Delivery Cards List */}
      <div className="max-w-5xl mx-auto px-4 py-6">
        {loading ? (
          <div className="py-24 text-center">
            <Loader2 className="w-8 h-8 text-blue-500 animate-spin mx-auto mb-3" />
            <p className="text-sm text-slate-400">Şantiye sevkiyatları yükleniyor...</p>
          </div>
        ) : displayedDeliveries.length === 0 ? (
          <div className="py-20 text-center bg-slate-900/60 rounded-3xl border border-slate-800 p-8">
            <div className="w-16 h-16 rounded-2xl bg-slate-800 flex items-center justify-center mx-auto mb-4 text-slate-500">
              <Truck className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-200">Kayıtlı Teslimat Bulunamadı</h3>
            <p className="text-sm text-slate-400 max-w-md mx-auto mt-1">
              {activeTab === "ACTIVE" 
                ? "Şu an şantiyenize doğru yola çıkmış bekleyen sevkiyat bulunmuyor."
                : "Seçilen filtreye ait herhangi bir kayıt bulunamadı."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {displayedDeliveries.map((item) => {
              const isPendingAction = item.status === "PLANNED" || item.status === "IN_TRANSIT" || item.status === "Planlandı" || item.status === "Yolda"
              const isDelivered = item.status === "DELIVERED" || item.status === "Tamamlandı"
              const isIssue = item.status === "ISSUE_REPORTED" || item.status === "İptal"

              return (
                <div
                  key={item.id}
                  className={`bg-slate-900/90 rounded-2xl border transition-all p-5 shadow-xl ${
                    isPendingAction 
                      ? "border-slate-800 hover:border-slate-700" 
                      : isIssue 
                        ? "border-red-500/40 bg-gradient-to-b from-red-950/20 to-slate-900/90" 
                        : "border-emerald-500/30 bg-gradient-to-b from-emerald-950/10 to-slate-900/90"
                  }`}
                >
                  {/* Card Header: Type Badge, Scheduled Date, Status */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-3 mb-3 border-b border-slate-800/80">
                    <div className="flex items-center gap-2">
                      <span className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${getTypeBadge(item.type)}`}>
                        {item.type.replace("_", " ")}
                      </span>
                      {item.project && (
                        <span className="text-xs font-medium text-slate-400 flex items-center gap-1">
                          <Building2 className="w-3.5 h-3.5 text-slate-500" />
                          {item.project.name || item.project.title}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${getStatusBadge(item.status)}`}>
                        {isIssue ? <AlertTriangle className="w-3.5 h-3.5 text-red-400" /> : isDelivered ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Clock className="w-3.5 h-3.5 text-blue-400" />}
                        {getStatusLabel(item.status)}
                      </span>
                    </div>
                  </div>

                  {/* Card Title & Main Details */}
                  <div className="mb-4">
                    <h3 className="text-lg font-bold text-white mb-2 leading-snug">
                      {item.title}
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-y-2 gap-x-4 text-xs text-slate-300">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                        <span className="truncate"><strong className="text-slate-400">Konum:</strong> {item.location}</span>
                      </div>

                      {item.supplierName && (
                        <div className="flex items-center gap-2">
                          <Truck className="w-4 h-4 text-indigo-400 flex-shrink-0" />
                          <span className="truncate"><strong className="text-slate-400">Tedarikçi:</strong> {item.supplierName}</span>
                        </div>
                      )}

                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-amber-400 flex-shrink-0" />
                        <span>
                          <strong className="text-slate-400">Varış:</strong>{" "}
                          {new Date(item.scheduledAt).toLocaleDateString("tr-TR")}{" "}
                          {new Date(item.scheduledAt).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>

                      {item.driverContact && (
                        <div className="flex items-center gap-2 sm:col-span-2 md:col-span-1">
                          <Phone className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                          <span><strong className="text-slate-400">Şoför Tel:</strong> </span>
                          <a 
                            href={`tel:${item.driverContact}`} 
                            className="text-emerald-400 hover:underline font-mono font-semibold"
                          >
                            {item.driverContact}
                          </a>
                        </div>
                      )}
                    </div>

                    {item.notes && (
                      <div className="mt-3 p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 text-xs text-slate-400">
                        <span className="font-semibold text-slate-300">Sevkiyat Notu:</span> {item.notes}
                      </div>
                    )}
                  </div>

                  {/* If Already Confirmed: Delivered Banner */}
                  {isDelivered && (
                    <div className="mt-3 p-3 bg-emerald-950/40 border border-emerald-500/40 rounded-xl flex items-center justify-between text-xs text-emerald-300">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        <span>Malzeme eksiksiz teslim alınmıştır.</span>
                      </div>
                      {item.completedAt && (
                        <span className="text-[11px] text-emerald-400/80 font-mono">
                          {new Date(item.completedAt).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      )}
                    </div>
                  )}

                  {/* If Issue Reported: Issue Banner with Thumbnail */}
                  {isIssue && (
                    <div className="mt-3 p-3.5 bg-red-950/50 border border-red-500/50 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-md shadow-red-950">
                      <div className="flex items-start gap-2.5 min-w-0">
                        <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-xs font-bold text-red-300 uppercase tracking-wide">
                            Hasarlı / Eksik Bildirimi Yapıldı
                          </p>
                          <p className="text-xs text-red-100 mt-1 font-medium">
                            <span className="text-red-300 font-semibold">Tutanak Notu: </span>
                            {item.deliveryNotes || "Açıklama girilmedi."}
                          </p>
                        </div>
                      </div>

                      {item.deliveryProofImageUrl && (
                        <button
                          type="button"
                          onClick={() => setPreviewPhotoUrl(item.deliveryProofImageUrl || null)}
                          className="relative group w-14 h-14 rounded-lg overflow-hidden border-2 border-red-400 shadow-md shadow-red-950 hover:scale-105 transition-transform flex-shrink-0 self-end sm:self-auto"
                          title="Kanıt Fotoğrafını Görüntüle"
                        >
                          <img
                            src={item.deliveryProofImageUrl}
                            alt="Kanıt"
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-black/40 group-hover:bg-transparent transition-colors flex items-center justify-center">
                            <Eye className="w-4 h-4 text-white" />
                          </div>
                        </button>
                      )}
                    </div>
                  )}

                  {/* Primary Site Actions (When Pending / In-Transit) */}
                  {isPendingAction && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-slate-800">
                      {/* Green "Teslim Alındı" Button */}
                      <button
                        onClick={() => handleConfirmDelivery(item)}
                        disabled={confirmingId === item.id}
                        className="w-full py-3 px-4 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/40 active:scale-[0.98] transition disabled:opacity-50"
                      >
                        {confirmingId === item.id ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Onaylanıyor...
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="w-5 h-5 text-white" />
                            Teslim Alındı (Sorunsuz)
                          </>
                        )}
                      </button>

                      {/* Red "Sorun Bildir (Eksik/Hasarlı)" Button */}
                      <button
                        onClick={() => openIssueModal(item)}
                        className="w-full py-3 px-4 bg-red-600/20 hover:bg-red-600/30 text-red-300 hover:text-white border border-red-500/50 rounded-xl font-bold text-sm flex items-center justify-center gap-2 active:scale-[0.98] transition"
                      >
                        <AlertTriangle className="w-5 h-5 text-red-400" />
                        Sorun Bildir (Eksik / Hasarlı)
                      </button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* ISSUE REPORT MODAL */}
      {selectedDelivery && (
        <div 
          className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={closeIssueModal}
        >
          <div 
            className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-4 sm:p-5 bg-red-950/40 border-b border-red-500/30 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-600/20 border border-red-500/40 flex items-center justify-center text-red-400">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-white">
                    Teslimat Sorun Tutanağı
                  </h3>
                  <p className="text-xs text-red-300">
                    Hasarlı veya eksik teslimat tespiti yapıyorsunuz
                  </p>
                </div>
              </div>
              <button
                onClick={closeIssueModal}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmitIssue} className="p-4 sm:p-6 overflow-y-auto space-y-4">
              {/* Delivery Info Box */}
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs">
                <p className="font-bold text-white text-sm mb-1">{selectedDelivery.title}</p>
                <p className="text-slate-400">
                  Tedarikçi: <span className="text-slate-200">{selectedDelivery.supplierName || "Belirtilmedi"}</span> | Konum: <span className="text-slate-200">{selectedDelivery.location}</span>
                </p>
              </div>

              {/* Photo Proof Upload */}
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                  📸 Fotoğraflı Kanıt (Hasar / İrsaliye / Eksik Malzeme)
                </label>

                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  ref={fileInputRef}
                  onChange={handlePhotoSelect}
                  className="hidden"
                />

                {issuePhotoPreview ? (
                  <div className="relative rounded-2xl overflow-hidden border border-red-500/40 bg-black/40 group max-h-56 flex items-center justify-center">
                    <img
                      src={issuePhotoPreview}
                      alt="Sorun Önizleme"
                      className="max-h-56 w-auto object-contain"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setIssuePhotoFile(null)
                        setIssuePhotoPreview(null)
                      }}
                      className="absolute top-2 right-2 p-1.5 bg-red-600 text-white rounded-full hover:bg-red-500 shadow-lg"
                      title="Fotoğrafı Kaldır"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full py-6 px-4 border-2 border-dashed border-slate-700 hover:border-red-500/70 rounded-2xl flex flex-col items-center justify-center gap-2 bg-slate-950/60 hover:bg-red-950/10 transition-colors cursor-pointer group"
                  >
                    <div className="w-12 h-12 rounded-2xl bg-red-500/10 group-hover:bg-red-500/20 text-red-400 flex items-center justify-center transition-transform group-hover:scale-110">
                      <Camera className="w-6 h-6" />
                    </div>
                    <span className="text-xs font-bold text-slate-200">
                      Kamera ile Fotoğraf Çek veya Dosya Yükle
                    </span>
                    <span className="text-[11px] text-slate-500">
                      (Şantiyede hasarlı ürünü veya şerh düşülen irsaliyeyi çekiniz)
                    </span>
                  </button>
                )}
              </div>

              {/* Delivery Notes / Incident Description */}
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                  📝 Şef Tutanak Notu / Açıklama *
                </label>
                <textarea
                  value={issueNotes}
                  onChange={(e) => setIssueNotes(e.target.value)}
                  placeholder="Örn: 20 paket çimentonun 6 adedi patlak ve ıslanmış olarak geldi. İrsaliye şerh düşüldü, tedarikçi firmaya bildirildi..."
                  rows={4}
                  required
                  className="w-full p-3 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs sm:text-sm placeholder-slate-500 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 pt-3">
                <button
                  type="button"
                  onClick={closeIssueModal}
                  className="flex-1 py-3 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs sm:text-sm font-semibold transition"
                >
                  Vazgeç
                </button>

                <button
                  type="submit"
                  disabled={isSubmittingIssue || !issueNotes.trim()}
                  className="flex-1 py-3 px-4 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-lg shadow-red-900/50 disabled:opacity-50 transition"
                >
                  {isSubmittingIssue ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Kaydediliyor...
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="w-4 h-4" />
                      Sorunu Bildir ve Kaydet
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* FULL PHOTO LIGHTBOX */}
      {previewPhotoUrl && (
        <div 
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4 animate-in fade-in"
          onClick={() => setPreviewPhotoUrl(null)}
        >
          <div 
            className="relative max-w-4xl max-h-[90vh] flex flex-col bg-slate-900 rounded-2xl overflow-hidden border border-slate-700"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-3 bg-slate-950 border-b border-slate-800 flex items-center justify-between text-white text-xs font-bold">
              <span>Teslimat Sorun Kanıt Fotoğrafı</span>
              <button
                onClick={() => setPreviewPhotoUrl(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-2 flex items-center justify-center bg-black">
              <img
                src={previewPhotoUrl}
                alt="Büyük Fotoğraf"
                className="max-h-[75vh] w-auto object-contain rounded-lg"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
