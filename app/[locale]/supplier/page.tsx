"use client"

/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Nexa ERP - Tedarikçi B2B Portalı: Açık İhaleler ve Teklif Verme
 */

import React, { useState, useEffect, useMemo } from "react"
import {
  Package,
  Gavel,
  CheckCircle,
  Clock,
  Send,
  Building,
  DollarSign,
  TrendingUp,
  FileText,
  AlertCircle,
  RefreshCw,
  Search,
  ChevronRight,
  ShieldCheck,
  Truck,
  Check,
} from "lucide-react"

interface PurchaseRequestItem {
  id: string
  projectId: string
  materialName: string
  quantity: number
  unit: string
  status: "OPEN_FOR_BID" | "COMPLETED" | "CANCELLED" | string
  createdAt: string
  project?: {
    id: string
    title: string
    name?: string
    location?: string
  }
  bids?: SupplierBidItem[]
}

interface SupplierBidItem {
  id: string
  purchaseRequestId: string
  supplierId: string
  unitPrice: number
  totalPrice: number
  isWinningBid: boolean
  notes?: string | null
  createdAt: string
  purchaseRequest?: PurchaseRequestItem
  supplier?: {
    id: string
    name: string
    email?: string
  }
}

interface SupplierCompany {
  id: string
  name: string
  taxNumber?: string
}

export default function SupplierPortalPage() {
  const [requests, setRequests] = useState<PurchaseRequestItem[]>([])
  const [myBids, setMyBids] = useState<SupplierBidItem[]>([])
  const [suppliers, setSuppliers] = useState<SupplierCompany[]>([])
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>("")
  const [activeTab, setActiveTab] = useState<"OPEN_REQUESTS" | "MY_BIDS">("OPEN_REQUESTS")
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")

  // Bid Modal State
  const [selectedRequest, setSelectedRequest] = useState<PurchaseRequestItem | null>(null)
  const [unitPriceInput, setUnitPriceInput] = useState<string>("")
  const [notesInput, setNotesInput] = useState<string>("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  useEffect(() => {
    initPortal()
  }, [])

  useEffect(() => {
    if (selectedSupplierId) {
      fetchMyBids(selectedSupplierId)
    }
  }, [selectedSupplierId])

  const initPortal = async () => {
    setIsLoading(true)
    try {
      // 1. Fetch Companies to find suppliers
      const compRes = await fetch("/api/admin/companies")
      let supplierList: SupplierCompany[] = []
      if (compRes.ok) {
        const compData = await compRes.json()
        if (Array.isArray(compData)) {
          supplierList = compData.filter(
            (c: any) => c.type === "SUPPLIER" || c.type === "SUBCONTRACTOR"
          )
          if (supplierList.length === 0 && compData.length > 0) {
            supplierList = compData
          }
        }
      }

      setSuppliers(supplierList)
      if (supplierList.length > 0) {
        setSelectedSupplierId(supplierList[0].id)
      }

      // 2. Fetch Purchase Requests
      await fetchRequests()
    } catch (err) {
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchRequests = async () => {
    try {
      const res = await fetch("/api/procurement/purchase-requests")
      if (res.ok) {
        const data = await res.json()
        setRequests(Array.isArray(data) ? data : [])
      }
    } catch (err) {
      console.error(err)
    }
  }

  const fetchMyBids = async (supplierId: string) => {
    try {
      const res = await fetch(`/api/procurement/bids?supplierId=${supplierId}`)
      if (res.ok) {
        const data = await res.json()
        setMyBids(Array.isArray(data) ? data : [])
      }
    } catch (err) {
      console.error(err)
    }
  }

  const openBidModal = (reqItem: PurchaseRequestItem) => {
    setSelectedRequest(reqItem)
    // Check if supplier already bid
    const existing = reqItem.bids?.find((b) => b.supplierId === selectedSupplierId)
    if (existing) {
      setUnitPriceInput(existing.unitPrice.toString())
      setNotesInput(existing.notes || "")
    } else {
      setUnitPriceInput("")
      setNotesInput("")
    }
  }

  const handleBidSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedRequest || !selectedSupplierId || !unitPriceInput) {
      alert("Lütfen birim fiyat giriniz")
      return
    }

    setIsSubmitting(true)
    try {
      const res = await fetch("/api/procurement/bids", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          purchaseRequestId: selectedRequest.id,
          supplierId: selectedSupplierId,
          unitPrice: parseFloat(unitPriceInput),
          notes: notesInput,
        }),
      })

      if (res.ok) {
        setSelectedRequest(null)
        setUnitPriceInput("")
        setNotesInput("")
        setToastMessage("Teklifiniz başarıyla iletildi!")
        setTimeout(() => setToastMessage(null), 4000)
        await fetchRequests()
        await fetchMyBids(selectedSupplierId)
      } else {
        const err = await res.json()
        alert(err.error || "Teklif gönderilemedi")
      }
    } catch (error) {
      console.error(error)
      alert("Hata oluştu")
    } finally {
      setIsSubmitting(false)
    }
  }

  // Calculated dynamic total
  const calculatedTotal = useMemo(() => {
    if (!selectedRequest || !unitPriceInput) return 0
    const price = parseFloat(unitPriceInput)
    if (isNaN(price)) return 0
    return price * selectedRequest.quantity
  }, [selectedRequest, unitPriceInput])

  // Stats
  const stats = useMemo(() => {
    const openCount = requests.filter((r) => r.status === "OPEN_FOR_BID").length
    const totalBidsCount = myBids.length
    const winningBidsCount = myBids.filter((b) => b.isWinningBid).length
    const totalBidVolume = myBids.reduce((sum, b) => sum + (b.totalPrice || 0), 0)

    return { openCount, totalBidsCount, winningBidsCount, totalBidVolume }
  }, [requests, myBids])

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("tr-TR", {
      style: "currency",
      currency: "TRY",
      maximumFractionDigits: 0,
    }).format(val)
  }

  const filteredRequests = useMemo(() => {
    return requests.filter((r) => {
      if (r.status !== "OPEN_FOR_BID" && activeTab === "OPEN_REQUESTS") return false
      if (!searchQuery.trim()) return true
      const q = searchQuery.toLowerCase()
      return (
        r.materialName.toLowerCase().includes(q) ||
        r.project?.title?.toLowerCase().includes(q) ||
        r.project?.name?.toLowerCase().includes(q)
      )
    })
  }, [requests, searchQuery, activeTab])

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-8">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-xl bg-emerald-500 text-white shadow-xl shadow-emerald-950 animate-bounce">
          <CheckCircle className="w-5 h-5" />
          <span className="font-semibold text-sm">{toastMessage}</span>
        </div>
      )}

      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900/90 to-blue-950/40 border border-slate-800 shadow-2xl">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
              <Gavel className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold tracking-tight text-white">
                  Nexa B2B Tedarikçi & İhale Portalı
                </h1>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/30 font-medium">
                  B2B Bidding v2.6
                </span>
              </div>
              <p className="text-sm text-slate-400 mt-0.5">
                Şantiye satınalma taleplerini inceleyin, anlık birim fiyat verin ve ihaleleri kazanın
              </p>
            </div>
          </div>

          {/* Supplier Session Selector */}
          <div className="flex items-center gap-3">
            <div className="flex flex-col text-right">
              <span className="text-xs text-slate-400">Giriş Yapılan Tedarikçi Firma:</span>
              <select
                value={selectedSupplierId}
                onChange={(e) => setSelectedSupplierId(e.target.value)}
                className="mt-1 px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-slate-200 text-xs font-semibold focus:outline-none focus:border-blue-500"
              >
                {suppliers.length === 0 ? (
                  <option value="">Tedarikçi Bulunamadı</option>
                ) : (
                  suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))
                )}
              </select>
            </div>

            <button
              onClick={() => {
                fetchRequests()
                if (selectedSupplierId) fetchMyBids(selectedSupplierId)
              }}
              className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white transition-all shadow-sm"
              title="Yenile"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>

        {/* KPI Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 backdrop-blur-xl">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Açık İhaleler</span>
              <Package className="w-4 h-4 text-blue-400" />
            </div>
            <div className="text-3xl font-bold text-white tracking-tight">
              {stats.openCount} Talep
            </div>
            <p className="text-xs text-slate-400 mt-2">Teklif vermeye açık malzeme talepleri</p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 backdrop-blur-xl">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Verdiğim Teklifler</span>
              <Send className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="text-3xl font-bold text-white tracking-tight">
              {stats.totalBidsCount} Teklif
            </div>
            <p className="text-xs text-slate-400 mt-2">Toplam sunulan teklif adedi</p>
          </div>

          <div className="p-5 rounded-2xl bg-gradient-to-b from-emerald-950/40 to-slate-900/90 border border-emerald-900/50 backdrop-blur-xl">
            <div className="flex items-center justify-between text-emerald-300 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Kazanılan İhaleler</span>
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-3xl font-bold text-emerald-400 tracking-tight">
              {stats.winningBidsCount} İhale
            </div>
            <p className="text-xs text-emerald-400/80 mt-2">Sipariş aşamasına geçen anlaşmalar</p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 backdrop-blur-xl">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Teklif Hacmim</span>
              <DollarSign className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-2xl font-bold text-white tracking-tight">
              {formatCurrency(stats.totalBidVolume)}
            </div>
            <p className="text-xs text-slate-400 mt-2">Aktif portföydeki teklif büyüklüğü</p>
          </div>
        </div>

        {/* Navigation Tabs & Search */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 p-2 rounded-xl bg-slate-900/90 border border-slate-800">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab("OPEN_REQUESTS")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                activeTab === "OPEN_REQUESTS"
                  ? "bg-blue-600 text-white shadow-md shadow-blue-900/40"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Package className="w-4 h-4" />
              Açık Satınalma Talepleri ({stats.openCount})
            </button>
            <button
              onClick={() => setActiveTab("MY_BIDS")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                activeTab === "MY_BIDS"
                  ? "bg-blue-600 text-white shadow-md shadow-blue-900/40"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Send className="w-4 h-4" />
              Verdiğim Teklifler ({stats.totalBidsCount})
            </button>
          </div>

          <div className="relative sm:w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Malzeme veya proje ara..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg bg-slate-950 border border-slate-800 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>

        {/* Content Section */}
        {activeTab === "OPEN_REQUESTS" ? (
          /* Open Purchase Requests Grid */
          <div className="space-y-4">
            {isLoading ? (
              <div className="py-20 text-center text-slate-400">
                <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-3 text-blue-500" />
                Satınalma talepleri taranıyor...
              </div>
            ) : filteredRequests.length === 0 ? (
              <div className="p-12 text-center rounded-2xl border border-slate-800 bg-slate-900/40 text-slate-400">
                <Package className="w-10 h-10 mx-auto mb-3 text-slate-600" />
                Şu an açık satınalma talebi bulunmuyor.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredRequests.map((reqItem) => {
                  const existingBid = reqItem.bids?.find(
                    (b) => b.supplierId === selectedSupplierId
                  )

                  return (
                    <div
                      key={reqItem.id}
                      className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between shadow-lg relative group overflow-hidden"
                    >
                      <div className="space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <span className="text-xs px-2.5 py-1 rounded-md bg-blue-500/10 text-blue-400 border border-blue-500/20 font-semibold">
                            {reqItem.project?.title || reqItem.project?.name || "Şantiye Projesi"}
                          </span>
                          <span className="text-[11px] text-slate-500 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {new Date(reqItem.createdAt).toLocaleDateString("tr-TR")}
                          </span>
                        </div>

                        <div>
                          <h3 className="text-base font-bold text-white group-hover:text-blue-400 transition-colors">
                            {reqItem.materialName}
                          </h3>
                          <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                            <Building className="w-3.5 h-3.5 text-slate-500" />
                            Lokasyon: {reqItem.project?.location || "Merkez Şantiye Sahası"}
                          </p>
                        </div>

                        {/* Quantity Badge */}
                        <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-between">
                          <span className="text-xs text-slate-400">İhale Miktarı:</span>
                          <span className="text-base font-extrabold text-amber-400">
                            {reqItem.quantity.toLocaleString("tr-TR")} {reqItem.unit}
                          </span>
                        </div>

                        {/* Existing Bid Info if any */}
                        {existingBid && (
                          <div className="p-2.5 rounded-lg bg-indigo-950/40 border border-indigo-900/60 text-xs text-indigo-300 flex items-center justify-between">
                            <span>Verdiğiniz Teklif:</span>
                            <span className="font-bold">
                              {formatCurrency(existingBid.unitPrice)} / {reqItem.unit}
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="pt-4 mt-4 border-t border-slate-800/80 flex items-center justify-between gap-3">
                        <span className="text-[11px] text-slate-500">
                          {reqItem.bids?.length || 0} Tedarikçi Teklif Verdi
                        </span>
                        <button
                          onClick={() => openBidModal(reqItem)}
                          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-md ${
                            existingBid
                              ? "bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-950"
                              : "bg-blue-600 hover:bg-blue-500 text-white shadow-blue-950"
                          }`}
                        >
                          <Send className="w-3.5 h-3.5" />
                          {existingBid ? "Teklifi Güncelle" : "Teklif Ver"}
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        ) : (
          /* My Bids Table */
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden shadow-xl backdrop-blur-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-950/80 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    <th className="py-3.5 px-4">Proje / Şantiye</th>
                    <th className="py-3.5 px-4">Talep Edilen Malzeme</th>
                    <th className="py-3.5 px-4">Miktar</th>
                    <th className="py-3.5 px-4 text-right">Birim Fiyat</th>
                    <th className="py-3.5 px-4 text-right">Toplam Tutar</th>
                    <th className="py-3.5 px-4">Tarih</th>
                    <th className="py-3.5 px-4 text-center">İhale Durumu</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-sm">
                  {myBids.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400">
                        Bu firma adına verilmiş henüz bir teklif yok.
                      </td>
                    </tr>
                  ) : (
                    myBids.map((bid) => (
                      <tr key={bid.id} className="hover:bg-slate-800/30 transition-colors">
                        <td className="py-3.5 px-4 font-medium text-slate-200">
                          {bid.purchaseRequest?.project?.title ||
                            bid.purchaseRequest?.project?.name ||
                            "Şantiye"}
                        </td>
                        <td className="py-3.5 px-4 text-white font-semibold">
                          {bid.purchaseRequest?.materialName}
                        </td>
                        <td className="py-3.5 px-4 text-slate-300">
                          {bid.purchaseRequest?.quantity} {bid.purchaseRequest?.unit}
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono font-medium text-slate-200">
                          {formatCurrency(bid.unitPrice)}
                        </td>
                        <td className="py-3.5 px-4 text-right font-bold text-emerald-400">
                          {formatCurrency(bid.totalPrice)}
                        </td>
                        <td className="py-3.5 px-4 text-xs text-slate-400">
                          {new Date(bid.createdAt).toLocaleDateString("tr-TR")}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          {bid.isWinningBid ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                              <ShieldCheck className="w-3.5 h-3.5" />
                              KAZANDINIZ (Siparişleşti)
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20">
                              <Clock className="w-3.5 h-3.5" />
                              Değerlendirmede
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Bid Modal */}
      {selectedRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl relative">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Gavel className="w-5 h-5 text-blue-500" />
                  İhaleye Teklif Ver
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  {selectedRequest.project?.title || "Şantiye Projesi"}
                </p>
              </div>
              <button
                onClick={() => setSelectedRequest(null)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleBidSubmit} className="space-y-4 mt-4">
              {/* Material Info Box */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>Talep Edilen Malzeme:</span>
                  <span className="font-bold text-white text-sm">
                    {selectedRequest.materialName}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>Talep Miktarı:</span>
                  <span className="font-bold text-amber-400">
                    {selectedRequest.quantity} {selectedRequest.unit}
                  </span>
                </div>
              </div>

              {/* Unit Price Input */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Birim Fiyat (₺ / {selectedRequest.unit}) *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">
                    ₺
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={unitPriceInput}
                    onChange={(e) => setUnitPriceInput(e.target.value)}
                    className="w-full pl-8 pr-3 py-2.5 text-sm rounded-lg bg-slate-950 border border-slate-800 text-white font-mono font-bold focus:outline-none focus:border-blue-500"
                    required
                  />
                </div>
              </div>

              {/* Total Calculation Display */}
              <div className="p-3.5 rounded-xl bg-blue-950/30 border border-blue-900/50 flex items-center justify-between">
                <span className="text-xs text-blue-300 font-medium">Toplam Teklif Bedeli:</span>
                <span className="text-lg font-extrabold text-blue-400">
                  {formatCurrency(calculatedTotal)}
                </span>
              </div>

              {/* Supplier Notes */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Teklif Notları & Teslimat Şartları (Opsiyonel)
                </label>
                <textarea
                  rows={3}
                  placeholder="Örn: Nakliye şantiye sahasına dahildir. Vade: 30 gün çek. Teslimat süresi: 3 iş günü."
                  value={notesInput}
                  onChange={(e) => setNotesInput(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg bg-slate-950 border border-slate-800 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setSelectedRequest(null)}
                  className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white"
                >
                  Vazgeç
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-500 text-white transition-all shadow-lg shadow-blue-950 flex items-center gap-2"
                >
                  <Send className="w-3.5 h-3.5" />
                  {isSubmitting ? "Gönderiliyor..." : "Teklifi Onayla ve Gönder"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
