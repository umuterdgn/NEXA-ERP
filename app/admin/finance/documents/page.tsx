"use client"

/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Nexa ERP - İleri Düzey Finans: Kıymetli Evraklar & Vade Radarı (Çek / Senet / Teminat Mektubu)
 */

import React, { useState, useEffect, useMemo } from "react"
import {
  FileText,
  AlertTriangle,
  Clock,
  CheckCircle2,
  XCircle,
  Plus,
  Search,
  Filter,
  DollarSign,
  Landmark,
  ShieldAlert,
  ArrowUpDown,
  Download,
  Building2,
  Calendar,
  Layers,
  Sparkles,
  RefreshCw,
  ExternalLink,
} from "lucide-react"

interface FinancialDoc {
  id: string
  documentType: "CHECK" | "PROMISSORY_NOTE" | "GUARANTEE_LETTER" | string
  documentNo: string
  amount: number
  currency: string
  issueDate: string
  dueDate: string
  companyId: string
  status: "PORTFOLIO" | "CASHED" | "RETURNED" | "BOUNCED" | string
  createdAt: string
  diffDays?: number
  urgency?: "RED" | "YELLOW" | "NORMAL"
  urgencyText?: string
  company?: {
    id: string
    name: string
    taxNumber?: string
    type?: string
  }
}

interface CompanyItem {
  id: string
  name: string
}

export default function FinancialDocumentsPage() {
  const [documents, setDocuments] = useState<FinancialDoc[]>([])
  const [companies, setCompanies] = useState<CompanyItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeTypeTab, setActiveTypeTab] = useState<string>("ALL")
  const [statusFilter, setStatusFilter] = useState<string>("ALL")
  const [urgencyFilter, setUrgencyFilter] = useState<string>("ALL")
  const [searchQuery, setSearchQuery] = useState<string>("")
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Form State
  const [formData, setFormData] = useState({
    documentType: "CHECK",
    documentNo: "",
    amount: "",
    currency: "TRY",
    issueDate: new Date().toISOString().split("T")[0],
    dueDate: new Date(Date.now() + 14 * 86400000).toISOString().split("T")[0],
    companyId: "",
    status: "PORTFOLIO",
  })

  useEffect(() => {
    fetchDocuments()
    fetchCompanies()
  }, [])

  const fetchDocuments = async () => {
    setIsLoading(true)
    try {
      const res = await fetch("/api/finance/documents")
      if (res.ok) {
        const data = await res.json()
        setDocuments(data)
      }
    } catch (err) {
      console.error("Belgeler alınamadı:", err)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchCompanies = async () => {
    try {
      const res = await fetch("/api/admin/companies")
      if (res.ok) {
        const data = await res.json()
        setCompanies(Array.isArray(data) ? data : [])
      } else {
        // Fallback: fetch general companies
        const res2 = await fetch("/api/companies")
        if (res2.ok) {
          const data2 = await res2.json()
          setCompanies(Array.isArray(data2) ? data2 : [])
        }
      }
    } catch (err) {
      console.log("Firmalar yüklenemedi:", err)
    }
  }

  const handleCreateDocument = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.companyId || !formData.documentNo || !formData.amount) {
      alert("Lütfen tüm zorunlu alanları doldurun.")
      return
    }

    setIsSubmitting(true)
    try {
      const res = await fetch("/api/finance/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      if (res.ok) {
        setIsAddModalOpen(false)
        setFormData({
          documentType: "CHECK",
          documentNo: "",
          amount: "",
          currency: "TRY",
          issueDate: new Date().toISOString().split("T")[0],
          dueDate: new Date(Date.now() + 14 * 86400000).toISOString().split("T")[0],
          companyId: companies[0]?.id || "",
          status: "PORTFOLIO",
        })
        await fetchDocuments()
      } else {
        const errData = await res.json()
        alert(errData.error || "Evrak eklenirken hata oluştu")
      }
    } catch (error) {
      console.error(error)
      alert("Evrak ekleme hatası")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleStatusUpdate = async (id: string, newStatus: string) => {
    try {
      const res = await fetch("/api/finance/documents", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: newStatus }),
      })
      if (res.ok) {
        await fetchDocuments()
      }
    } catch (err) {
      console.error(err)
    }
  }

  // Filtered Documents
  const filteredDocuments = useMemo(() => {
    return documents.filter((doc) => {
      // Type Tab
      if (activeTypeTab !== "ALL" && doc.documentType !== activeTypeTab) return false
      // Status Filter
      if (statusFilter !== "ALL" && doc.status !== statusFilter) return false
      // Urgency Filter
      if (urgencyFilter === "RED" && doc.urgency !== "RED") return false
      if (urgencyFilter === "YELLOW" && doc.urgency !== "YELLOW") return false
      if (urgencyFilter === "URGENT" && doc.urgency === "NORMAL") return false

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        const matchNo = doc.documentNo.toLowerCase().includes(q)
        const matchComp = doc.company?.name?.toLowerCase().includes(q)
        if (!matchNo && !matchComp) return false
      }
      return true
    })
  }, [documents, activeTypeTab, statusFilter, urgencyFilter, searchQuery])

  // Statistics
  const stats = useMemo(() => {
    let totalPortfolio = 0
    let checksSum = 0
    let notesSum = 0
    let guaranteesSum = 0
    let redCount = 0
    let yellowCount = 0

    documents.forEach((d) => {
      if (d.status === "PORTFOLIO") {
        totalPortfolio += d.amount
        if (d.documentType === "CHECK") checksSum += d.amount
        if (d.documentType === "PROMISSORY_NOTE") notesSum += d.amount
        if (d.documentType === "GUARANTEE_LETTER") guaranteesSum += d.amount
      }
      if (d.urgency === "RED") redCount++
      if (d.urgency === "YELLOW") yellowCount++
    })

    return { totalPortfolio, checksSum, notesSum, guaranteesSum, redCount, yellowCount }
  }, [documents])

  const formatCurrency = (val: number, cur: string = "TRY") => {
    return new Intl.NumberFormat("tr-TR", {
      style: "currency",
      currency: cur === "TRY" ? "TRY" : cur,
      maximumFractionDigits: 0,
    }).format(val)
  }

  const getTypeBadge = (type: string) => {
    switch (type) {
      case "CHECK":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <CreditCardIcon className="w-3.5 h-3.5" />
            Çek
          </span>
        )
      case "PROMISSORY_NOTE":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-purple-500/10 text-purple-400 border border-purple-500/20">
            <FileText className="w-3.5 h-3.5" />
            Senet
          </span>
        )
      case "GUARANTEE_LETTER":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Landmark className="w-3.5 h-3.5" />
            Teminat Mektubu
          </span>
        )
      default:
        return <span className="text-xs text-slate-400">{type}</span>
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PORTFOLIO":
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-900/30 text-blue-300 border border-blue-800">
            Portföyde
          </span>
        )
      case "CASHED":
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-900/30 text-emerald-300 border border-emerald-800">
            Tahsil Edildi
          </span>
        )
      case "RETURNED":
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-800 text-slate-300 border border-slate-700">
            İade Edildi
          </span>
        )
      case "BOUNCED":
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-rose-950 text-rose-300 border border-rose-800">
            Karşılıksız / Protestolu
          </span>
        )
      default:
        return <span className="text-xs text-slate-400">{status}</span>
    }
  }

  function CreditCardIcon(props: any) {
    return (
      <svg {...props} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <rect width="20" height="14" x="2" y="5" rx="2" />
        <line x1="2" x2="22" y1="10" y2="10" />
      </svg>
    )
  }

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto min-h-screen text-slate-100">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-800/80">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500/20 to-emerald-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-lg shadow-amber-500/5">
              <Landmark className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                Kıymetli Evrak Portföyü & Vade Radarı
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-medium">
                  Canlı Takip
                </span>
              </h1>
              <p className="text-sm text-slate-400">
                Çek, Senet ve Teminat Mektuplarının vade, teminat ve tahsilat takibi
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchDocuments}
            className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white transition-all shadow-sm"
            title="Yenile"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
          </button>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-medium text-sm transition-all shadow-lg shadow-emerald-900/30"
          >
            <Plus className="w-4 h-4" />
            Yeni Evrak Ekle
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Portfolio */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 backdrop-blur-xl relative overflow-hidden group hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Portföy Toplamı</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-white tracking-tight">
            {formatCurrency(stats.totalPortfolio)}
          </div>
          <p className="text-xs text-slate-400 mt-2 flex items-center gap-1">
            <span className="text-emerald-400 font-medium">Aktif Portföy</span> • {documents.length} toplam evrak
          </p>
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl group-hover:bg-emerald-500/10 transition-all" />
        </div>

        {/* Critical Alerts (Red) */}
        <div
          onClick={() => setUrgencyFilter(urgencyFilter === "RED" ? "ALL" : "RED")}
          className={`p-5 rounded-2xl bg-gradient-to-b from-rose-950/40 to-slate-900/90 border cursor-pointer backdrop-blur-xl relative overflow-hidden transition-all ${
            urgencyFilter === "RED"
              ? "border-rose-500 shadow-lg shadow-rose-950/50"
              : "border-rose-900/50 hover:border-rose-700/80"
          }`}
        >
          <div className="flex items-center justify-between text-rose-300 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
              Kritik Vade Alarmları
            </span>
            <ShieldAlert className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl font-bold text-rose-400 tracking-tight flex items-baseline gap-2">
            {stats.redCount} Evrak
            <span className="text-xs font-normal text-rose-300">(&lt; 7 gün veya geçmiş)</span>
          </div>
          <p className="text-xs text-rose-400/80 mt-2">
            Acil işlem veya karşılık teyidi gerekiyor
          </p>
        </div>

        {/* Impending Alerts (Yellow) */}
        <div
          onClick={() => setUrgencyFilter(urgencyFilter === "YELLOW" ? "ALL" : "YELLOW")}
          className={`p-5 rounded-2xl bg-gradient-to-b from-amber-950/40 to-slate-900/90 border cursor-pointer backdrop-blur-xl relative overflow-hidden transition-all ${
            urgencyFilter === "YELLOW"
              ? "border-amber-500 shadow-lg shadow-amber-950/50"
              : "border-amber-900/50 hover:border-amber-700/80"
          }`}
        >
          <div className="flex items-center justify-between text-amber-300 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              Yaklaşan Vadeler
            </span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-amber-400 tracking-tight flex items-baseline gap-2">
            {stats.yellowCount} Evrak
            <span className="text-xs font-normal text-amber-300">(8-15 gün içinde)</span>
          </div>
          <p className="text-xs text-amber-400/80 mt-2">
            Tahsilat / Banka takas hazırlığı
          </p>
        </div>

        {/* Guarantees & Notes Breakdown */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 backdrop-blur-xl relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Teminat Mektupları</span>
            <Landmark className="w-4 h-4 text-teal-400" />
          </div>
          <div className="text-2xl font-bold text-white tracking-tight">
            {formatCurrency(stats.guaranteesSum)}
          </div>
          <p className="text-xs text-slate-400 mt-2 flex items-center gap-1">
            Çek: <span className="text-blue-400">{formatCurrency(stats.checksSum)}</span> • Senet:{" "}
            <span className="text-purple-400">{formatCurrency(stats.notesSum)}</span>
          </p>
        </div>
      </div>

      {/* Filter and Controls Toolbar */}
      <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Document Type Tabs */}
        <div className="flex items-center gap-1 p-1 bg-slate-950 rounded-lg border border-slate-800 overflow-x-auto">
          {[
            { id: "ALL", label: "Tümü" },
            { id: "CHECK", label: "Çekler" },
            { id: "PROMISSORY_NOTE", label: "Senetler" },
            { id: "GUARANTEE_LETTER", label: "Teminat Mektupları" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTypeTab(tab.id)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-all ${
                activeTypeTab === tab.id
                  ? "bg-slate-800 text-white shadow-sm font-semibold"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Status & Search */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Search Box */}
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Evrak no, firma ara..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-lg bg-slate-950 border border-slate-800 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-all"
            />
          </div>

          {/* Status Select */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-xs rounded-lg bg-slate-950 border border-slate-800 text-slate-300 focus:outline-none focus:border-emerald-500"
          >
            <option value="ALL">Tüm Durumlar</option>
            <option value="PORTFOLIO">Portföyde</option>
            <option value="CASHED">Tahsil Edildi</option>
            <option value="RETURNED">İade Edildi</option>
            <option value="BOUNCED">Karşılıksız / Protestolu</option>
          </select>

          {/* Urgency Reset / Active indicator */}
          {urgencyFilter !== "ALL" && (
            <button
              onClick={() => setUrgencyFilter("ALL")}
              className="px-2.5 py-1.5 text-xs rounded-lg bg-rose-500/10 text-rose-300 border border-rose-500/30 flex items-center gap-1 hover:bg-rose-500/20"
            >
              Filtreyi Temizle ({urgencyFilter})
              <XCircle className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Modern DataGrid Table */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden shadow-xl backdrop-blur-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/80 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                <th className="py-3.5 px-4">Evrak Türü</th>
                <th className="py-3.5 px-4">Belge / Seri No</th>
                <th className="py-3.5 px-4">Muhatap Firma</th>
                <th className="py-3.5 px-4 text-right">Tutar</th>
                <th className="py-3.5 px-4">Keşide Tarihi</th>
                <th className="py-3.5 px-4">Vade / Bitiş (Radar)</th>
                <th className="py-3.5 px-4">Durum</th>
                <th className="py-3.5 px-4 text-center">İşlem</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-sm">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-emerald-500" />
                    Kıymetli evraklar yükleniyor...
                  </td>
                </tr>
              ) : filteredDocuments.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <div className="w-12 h-12 rounded-full bg-slate-800/50 flex items-center justify-center mx-auto mb-3 text-slate-500">
                      <FileText className="w-6 h-6" />
                    </div>
                    Kayıtlı evrak bulunamadı veya arama kriterine uymuyor.
                  </td>
                </tr>
              ) : (
                filteredDocuments.map((doc) => {
                  const isRed = doc.urgency === "RED"
                  const isYellow = doc.urgency === "YELLOW"

                  return (
                    <tr
                      key={doc.id}
                      className={`transition-colors hover:bg-slate-800/40 ${
                        isRed
                          ? "bg-rose-950/20"
                          : isYellow
                          ? "bg-amber-950/15"
                          : ""
                      }`}
                    >
                      {/* Document Type */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {getTypeBadge(doc.documentType)}
                      </td>

                      {/* Document No */}
                      <td className="py-3.5 px-4 font-mono font-medium text-slate-200">
                        {doc.documentNo}
                      </td>

                      {/* Company */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <Building2 className="w-4 h-4 text-slate-500 flex-shrink-0" />
                          <span className="font-medium text-slate-200 truncate max-w-[200px]">
                            {doc.company?.name || "Bilinmeyen Firma"}
                          </span>
                        </div>
                      </td>

                      {/* Amount */}
                      <td className="py-3.5 px-4 text-right font-bold text-white whitespace-nowrap">
                        {formatCurrency(doc.amount, doc.currency)}
                      </td>

                      {/* Issue Date */}
                      <td className="py-3.5 px-4 text-xs text-slate-400 whitespace-nowrap">
                        {new Date(doc.issueDate).toLocaleDateString("tr-TR")}
                      </td>

                      {/* Due Date & Urgency Indicator */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          {isRed ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-sm animate-pulse">
                              <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                              {new Date(doc.dueDate).toLocaleDateString("tr-TR")}
                              <span className="text-[11px] font-semibold opacity-90">
                                ({doc.urgencyText})
                              </span>
                            </span>
                          ) : isYellow ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm">
                              <Clock className="w-3.5 h-3.5 text-amber-400" />
                              {new Date(doc.dueDate).toLocaleDateString("tr-TR")}
                              <span className="text-[11px] font-medium opacity-90">
                                ({doc.urgencyText})
                              </span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs text-slate-300">
                              <Calendar className="w-3.5 h-3.5 text-slate-500" />
                              {new Date(doc.dueDate).toLocaleDateString("tr-TR")}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {getStatusBadge(doc.status)}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5">
                          {doc.status === "PORTFOLIO" && (
                            <>
                              <button
                                onClick={() => handleStatusUpdate(doc.id, "CASHED")}
                                title="Tahsil Edildi Olarak İşaretle"
                                className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20 transition-all"
                              >
                                <CheckCircle2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleStatusUpdate(doc.id, "RETURNED")}
                                title="İade Edildi"
                                className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white transition-all"
                              >
                                <XCircle className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleStatusUpdate(doc.id, "BOUNCED")}
                                title="Karşılıksız / Protestolu İşaretle"
                                className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 border border-rose-500/20 transition-all"
                              >
                                <AlertTriangle className="w-4 h-4" />
                              </button>
                            </>
                          )}
                          {doc.status !== "PORTFOLIO" && (
                            <button
                              onClick={() => handleStatusUpdate(doc.id, "PORTFOLIO")}
                              className="text-xs px-2.5 py-1 rounded bg-slate-800 text-slate-300 hover:bg-slate-700"
                            >
                              Geri Al
                            </button>
                          )}
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

      {/* Add Document Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl p-6 shadow-2xl relative">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Plus className="w-5 h-5 text-emerald-500" />
                Yeni Kıymetli Evrak Girişi
              </h2>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateDocument} className="space-y-4 mt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Document Type */}
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">
                    Evrak Türü *
                  </label>
                  <select
                    value={formData.documentType}
                    onChange={(e) => setFormData({ ...formData, documentType: e.target.value })}
                    className="w-full px-3 py-2 text-sm rounded-lg bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-emerald-500"
                    required
                  >
                    <option value="CHECK">Çek (CHECK)</option>
                    <option value="PROMISSORY_NOTE">Senet (PROMISSORY_NOTE)</option>
                    <option value="GUARANTEE_LETTER">Teminat Mektubu (GUARANTEE_LETTER)</option>
                  </select>
                </div>

                {/* Document No */}
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">
                    Evrak / Seri No *
                  </label>
                  <input
                    type="text"
                    placeholder="Örn: CK-2026-9901"
                    value={formData.documentNo}
                    onChange={(e) => setFormData({ ...formData, documentNo: e.target.value })}
                    className="w-full px-3 py-2 text-sm rounded-lg bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-emerald-500 font-mono"
                    required
                  />
                </div>

                {/* Amount */}
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">
                    Tutar *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    className="w-full px-3 py-2 text-sm rounded-lg bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-emerald-500"
                    required
                  />
                </div>

                {/* Currency */}
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">
                    Para Birimi
                  </label>
                  <select
                    value={formData.currency}
                    onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                    className="w-full px-3 py-2 text-sm rounded-lg bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-emerald-500"
                  >
                    <option value="TRY">TRY (₺)</option>
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                  </select>
                </div>

                {/* Issue Date */}
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">
                    Keşide Tarihi *
                  </label>
                  <input
                    type="date"
                    value={formData.issueDate}
                    onChange={(e) => setFormData({ ...formData, issueDate: e.target.value })}
                    className="w-full px-3 py-2 text-sm rounded-lg bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-emerald-500"
                    required
                  />
                </div>

                {/* Due Date */}
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">
                    Vade / Bitiş Tarihi *
                  </label>
                  <input
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                    className="w-full px-3 py-2 text-sm rounded-lg bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-emerald-500"
                    required
                  />
                </div>

                {/* Company Selection */}
                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-slate-400 mb-1">
                    Muhatap / Keşideci Firma *
                  </label>
                  <select
                    value={formData.companyId}
                    onChange={(e) => setFormData({ ...formData, companyId: e.target.value })}
                    className="w-full px-3 py-2 text-sm rounded-lg bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-emerald-500"
                    required
                  >
                    <option value="">Firma Seçiniz...</option>
                    {companies.map((comp) => (
                      <option key={comp.id} value={comp.id}>
                        {comp.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 text-xs font-bold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition-all shadow-md shadow-emerald-950"
                >
                  {isSubmitting ? "Kaydediliyor..." : "Evrakı Kaydet"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
