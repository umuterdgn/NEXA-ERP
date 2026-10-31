"use client"

/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Nexa ERP - İK Süreli Evrak Radarı & İSG Alarm Masası (Acil Aksiyon)
 */

import React, { useState, useEffect, useMemo } from "react"
import {
  ShieldAlert,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Bell,
  Send,
  User,
  HeartPulse,
  Truck,
  HardHat,
  Search,
  Filter,
  Plus,
  RefreshCw,
  Calendar,
  AlertOctagon,
  FileCheck,
  ChevronRight,
  XCircle,
} from "lucide-react"

interface PersonnelDocItem {
  id: string
  userId: string
  docType: "MYK" | "HEAVY_MACHINE_LICENSE" | "HEALTH_REPORT" | string
  issueDate: string
  expiryDate: string
  isAlertSent: boolean
  diffDays: number
  alertLevel: "EXPIRED" | "CRITICAL" | "WARNING" | "SAFE"
  badgeColor: "red" | "orange" | "yellow" | "green"
  urgencyText: string
  user: {
    id: string
    name: string
    email: string
    role: string
    company?: {
      name: string
    }
  }
}

interface UserOption {
  id: string
  name: string
  email: string
  role: string
}

export default function PersonnelAlertsPage() {
  const [documents, setDocuments] = useState<PersonnelDocItem[]>([])
  const [users, setUsers] = useState<UserOption[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [docTypeFilter, setDocTypeFilter] = useState<string>("ALL")
  const [levelFilter, setLevelFilter] = useState<string>("ALL")
  const [searchQuery, setSearchQuery] = useState<string>("")
  const [toastMsg, setToastMsg] = useState<string | null>(null)

  // Renew / Add Modal State
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingDoc, setEditingDoc] = useState<PersonnelDocItem | null>(null)
  const [formUserId, setFormUserId] = useState("")
  const [formDocType, setFormDocType] = useState("MYK")
  const [formIssueDate, setFormIssueDate] = useState(
    new Date(Date.now() - 365 * 86400000).toISOString().split("T")[0]
  )
  const [formExpiryDate, setFormExpiryDate] = useState(
    new Date(Date.now() + 10 * 86400000).toISOString().split("T")[0]
  )
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    fetchAlertDocuments()
    fetchUsers()
  }, [])

  const fetchAlertDocuments = async () => {
    setIsLoading(true)
    try {
      // Fetch urgent documents (expiry <= 15 days)
      const res = await fetch("/api/personnel/documents?urgentOnly=true")
      if (res.ok) {
        const data = await res.json()
        setDocuments(Array.isArray(data) ? data : [])
      }
    } catch (err) {
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchUsers = async () => {
    try {
      const res = await fetch("/api/users")
      if (res.ok) {
        const data = await res.json()
        setUsers(Array.isArray(data) ? data : [])
      } else {
        const res2 = await fetch("/api/admin/users")
        if (res2.ok) {
          const data2 = await res2.json()
          setUsers(Array.isArray(data2) ? data2 : [])
        }
      }
    } catch (err) {
      console.error(err)
    }
  }

  const handleSendAlert = async (docId: string, userName: string) => {
    try {
      const res = await fetch("/api/personnel/documents", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: docId, isAlertSent: true }),
      })
      if (res.ok) {
        setToastMsg(`${userName} personeline İSG acil evrak uyarısı (SMS & E-Posta) iletildi!`)
        setTimeout(() => setToastMsg(null), 4000)
        await fetchAlertDocuments()
      }
    } catch (err) {
      console.error(err)
    }
  }

  const handleOpenRenewModal = (doc: PersonnelDocItem) => {
    setEditingDoc(doc)
    setFormUserId(doc.userId)
    setFormDocType(doc.docType)
    setFormIssueDate(new Date().toISOString().split("T")[0])
    setFormExpiryDate(new Date(Date.now() + 365 * 86400000).toISOString().split("T")[0])
    setIsModalOpen(true)
  }

  const handleOpenAddModal = () => {
    setEditingDoc(null)
    setFormUserId(users[0]?.id || "")
    setFormDocType("MYK")
    setFormIssueDate(new Date().toISOString().split("T")[0])
    setFormExpiryDate(new Date(Date.now() + 10 * 86400000).toISOString().split("T")[0])
    setIsModalOpen(true)
  }

  const handleSaveDocument = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formUserId || !formExpiryDate) {
      alert("Lütfen personel ve bitiş tarihini seçin")
      return
    }

    setIsSubmitting(true)
    try {
      if (editingDoc) {
        // Renew
        const res = await fetch("/api/personnel/documents", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: editingDoc.id,
            expiryDate: formExpiryDate,
            isAlertSent: false,
          }),
        })
        if (res.ok) {
          setIsModalOpen(false)
          setToastMsg("Belge süresi başarıyla uzatıldı!")
          setTimeout(() => setToastMsg(null), 4000)
          await fetchAlertDocuments()
        }
      } else {
        // Add new
        const res = await fetch("/api/personnel/documents", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: formUserId,
            docType: formDocType,
            issueDate: formIssueDate,
            expiryDate: formExpiryDate,
          }),
        })
        if (res.ok) {
          setIsModalOpen(false)
          setToastMsg("Yeni süreli belge kaydedildi!")
          setTimeout(() => setToastMsg(null), 4000)
          await fetchAlertDocuments()
        }
      }
    } catch (err) {
      console.error(err)
      alert("Kaydetme hatası")
    } finally {
      setIsSubmitting(false)
    }
  }

  // Summary Metrics
  const metrics = useMemo(() => {
    let expiredCount = 0
    let criticalCount = 0
    let warningCount = 0

    documents.forEach((d) => {
      if (d.diffDays < 0) expiredCount++
      else if (d.diffDays <= 7) criticalCount++
      else if (d.diffDays <= 15) warningCount++
    })

    return {
      totalUrgent: documents.length,
      expiredCount,
      criticalCount,
      warningCount,
    }
  }, [documents])

  // Filtered List
  const filteredDocs = useMemo(() => {
    return documents.filter((d) => {
      if (docTypeFilter !== "ALL" && d.docType !== docTypeFilter) return false
      if (levelFilter === "EXPIRED" && d.diffDays >= 0) return false
      if (levelFilter === "CRITICAL" && (d.diffDays < 0 || d.diffDays > 7)) return false
      if (levelFilter === "WARNING" && (d.diffDays <= 7 || d.diffDays > 15)) return false

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        const matchName = d.user?.name?.toLowerCase().includes(q)
        const matchEmail = d.user?.email?.toLowerCase().includes(q)
        const matchType = d.docType.toLowerCase().includes(q)
        if (!matchName && !matchEmail && !matchType) return false
      }
      return true
    })
  }, [documents, docTypeFilter, levelFilter, searchQuery])

  const getDocTypeBadge = (type: string) => {
    switch (type) {
      case "MYK":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <HardHat className="w-3.5 h-3.5" />
            Mesleki Yeterlilik (MYK)
          </span>
        )
      case "HEAVY_MACHINE_LICENSE":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <Truck className="w-3.5 h-3.5" />
            Ağır Vasıta / Operatörlük
          </span>
        )
      case "HEALTH_REPORT":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <HeartPulse className="w-3.5 h-3.5" />
            İSG Sağlık Raporu
          </span>
        )
      default:
        return <span className="text-xs text-slate-300">{type}</span>
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
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-rose-600 to-amber-600 flex items-center justify-center text-white shadow-xl shadow-rose-950/40">
            <ShieldAlert className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight text-white">
                İK Süreli Evrak & İSG Alarm Radarı
              </h1>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/40 font-bold">
                Acil Aksiyon Masası
              </span>
            </div>
            <p className="text-sm text-slate-400 mt-0.5">
              Bitişine 15 günden az kalmış veya süresi dolmuş İSG, MYK ve Ehliyet evrakları
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchAlertDocuments}
            className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white transition-all shadow-sm"
            title="Yenile"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
          </button>
          <button
            onClick={handleOpenAddModal}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs transition-all shadow-lg shadow-rose-950"
          >
            <Plus className="w-4 h-4" />
            Yeni Süreli Evrak Tanımla
          </button>
        </div>
      </div>

      {/* KPI Visual Warning Counters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Expired (< 0 days) */}
        <div
          onClick={() => setLevelFilter(levelFilter === "EXPIRED" ? "ALL" : "EXPIRED")}
          className={`p-5 rounded-2xl bg-gradient-to-b from-rose-950/70 to-slate-900 border-2 cursor-pointer backdrop-blur-xl relative overflow-hidden transition-all ${
            levelFilter === "EXPIRED"
              ? "border-rose-500 shadow-xl shadow-rose-950"
              : "border-rose-800/60 hover:border-rose-600"
          }`}
        >
          <div className="flex items-center justify-between text-rose-300 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
              Süresi Dolmuş Evraklar
            </span>
            <AlertOctagon className="w-5 h-5 text-rose-400" />
          </div>
          <div className="text-3xl font-black text-rose-400 tracking-tight">
            {metrics.expiredCount} Belge
          </div>
          <p className="text-xs text-rose-300/80 mt-2 font-medium">
            Kritik İSG Riski: Şantiyeye girişi durdurulmalı!
          </p>
        </div>

        {/* Critical (1-7 days) */}
        <div
          onClick={() => setLevelFilter(levelFilter === "CRITICAL" ? "ALL" : "CRITICAL")}
          className={`p-5 rounded-2xl bg-gradient-to-b from-amber-950/50 to-slate-900 border-2 cursor-pointer backdrop-blur-xl relative overflow-hidden transition-all ${
            levelFilter === "CRITICAL"
              ? "border-amber-500 shadow-xl shadow-amber-950"
              : "border-amber-900/60 hover:border-amber-700"
          }`}
        >
          <div className="flex items-center justify-between text-amber-300 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              1 - 7 Gün Kalanlar
            </span>
            <AlertTriangle className="w-5 h-5 text-amber-400" />
          </div>
          <div className="text-3xl font-black text-amber-400 tracking-tight">
            {metrics.criticalCount} Belge
          </div>
          <p className="text-xs text-amber-300/80 mt-2 font-medium">
            Acil Yenileme: Muayene / Sınav randevusu alınmalı
          </p>
        </div>

        {/* Warning (8-15 days) */}
        <div
          onClick={() => setLevelFilter(levelFilter === "WARNING" ? "ALL" : "WARNING")}
          className={`p-5 rounded-2xl bg-gradient-to-b from-yellow-950/30 to-slate-900 border cursor-pointer backdrop-blur-xl relative overflow-hidden transition-all ${
            levelFilter === "WARNING"
              ? "border-yellow-500 shadow-xl shadow-yellow-950"
              : "border-yellow-900/50 hover:border-yellow-700"
          }`}
        >
          <div className="flex items-center justify-between text-yellow-300 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-yellow-400" />
              8 - 15 Gün Kalanlar
            </span>
          </div>
          <div className="text-3xl font-black text-yellow-300 tracking-tight">
            {metrics.warningCount} Belge
          </div>
          <p className="text-xs text-yellow-300/70 mt-2 font-medium">
            Planlı Yenileme: İK bildirim sürecinde
          </p>
        </div>

        {/* Total Urgent */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 backdrop-blur-xl">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">
              Toplam Riskli Evrak
            </span>
            <ShieldAlert className="w-5 h-5 text-slate-400" />
          </div>
          <div className="text-3xl font-black text-white tracking-tight">
            {metrics.totalUrgent} Personel Belgesi
          </div>
          <p className="text-xs text-slate-400 mt-2">15 gün radarına giren tüm belgeler</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Document Type Tabs */}
        <div className="flex items-center gap-1 p-1 bg-slate-950 rounded-lg border border-slate-800 overflow-x-auto">
          {[
            { id: "ALL", label: "Tüm Evraklar" },
            { id: "MYK", label: "MYK Belgeleri" },
            { id: "HEAVY_MACHINE_LICENSE", label: "Operatörlük / Ehliyet" },
            { id: "HEALTH_REPORT", label: "İSG Sağlık Raporları" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setDocTypeFilter(tab.id)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-all ${
                docTypeFilter === tab.id
                  ? "bg-slate-800 text-white font-bold"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          {/* Search */}
          <div className="relative sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Personel veya belge ara..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg bg-slate-950 border border-slate-800 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-rose-500"
            />
          </div>

          {levelFilter !== "ALL" && (
            <button
              onClick={() => setLevelFilter("ALL")}
              className="px-2.5 py-1.5 text-xs rounded-lg bg-rose-500/10 text-rose-300 border border-rose-500/30 flex items-center gap-1 hover:bg-rose-500/20"
            >
              Filtreyi Temizle
              <XCircle className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Radar Emergency Table */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden shadow-2xl backdrop-blur-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/80 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                <th className="py-3.5 px-4">Personel Bilgisi</th>
                <th className="py-3.5 px-4">Belge Türü</th>
                <th className="py-3.5 px-4">Tanzim Tarihi</th>
                <th className="py-3.5 px-4">Bitiş Tarihi</th>
                <th className="py-3.5 px-4">Kalan Süre (Radar)</th>
                <th className="py-3.5 px-4">İSG Risk Seviyesi</th>
                <th className="py-3.5 px-4 text-center">Uyarı Durumu</th>
                <th className="py-3.5 px-4 text-center">Acil Aksiyon</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-sm">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-rose-500" />
                    Süreli evrak radarı taranıyor...
                  </td>
                </tr>
              ) : filteredDocs.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <CheckCircle2 className="w-10 h-10 mx-auto mb-2 text-emerald-500" />
                    15 günden az kalmış acil riskli evrak bulunmuyor. Tüm belgeler güvenli.
                  </td>
                </tr>
              ) : (
                filteredDocs.map((doc) => {
                  const isExpired = doc.diffDays < 0
                  const isCritical = doc.diffDays >= 0 && doc.diffDays <= 7
                  const isWarning = doc.diffDays > 7 && doc.diffDays <= 15

                  return (
                    <tr
                      key={doc.id}
                      className={`transition-colors ${
                        isExpired
                          ? "bg-rose-950/30 hover:bg-rose-950/40 border-l-4 border-l-rose-500"
                          : isCritical
                          ? "bg-amber-950/20 hover:bg-amber-950/30 border-l-4 border-l-amber-500"
                          : "hover:bg-slate-800/30"
                      }`}
                    >
                      {/* Personnel */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 font-bold text-xs flex-shrink-0">
                            {doc.user?.name?.substring(0, 2).toUpperCase() || "P"}
                          </div>
                          <div>
                            <span className="font-bold text-white block">
                              {doc.user?.name || "İsimsiz Personel"}
                            </span>
                            <span className="text-xs text-slate-400 block">
                              {doc.user?.role} • {doc.user?.company?.name || "Nexa ERP"}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Document Type */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {getDocTypeBadge(doc.docType)}
                      </td>

                      {/* Issue Date */}
                      <td className="py-3.5 px-4 text-xs text-slate-400 whitespace-nowrap">
                        {new Date(doc.issueDate).toLocaleDateString("tr-TR")}
                      </td>

                      {/* Expiry Date */}
                      <td className="py-3.5 px-4 font-bold text-white whitespace-nowrap font-mono">
                        {new Date(doc.expiryDate).toLocaleDateString("tr-TR")}
                      </td>

                      {/* Countdown badge */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {isExpired ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-sm animate-pulse">
                            <AlertOctagon className="w-3.5 h-3.5 text-rose-400" />
                            {doc.urgencyText}
                          </span>
                        ) : isCritical ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm">
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                            {doc.urgencyText}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-yellow-500/10 text-yellow-300 border border-yellow-500/30">
                            <Clock className="w-3.5 h-3.5 text-yellow-400" />
                            {doc.urgencyText}
                          </span>
                        )}
                      </td>

                      {/* ISG Risk Level */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {isExpired ? (
                          <span className="text-xs font-bold text-rose-400 flex items-center gap-1">
                            <ShieldAlert className="w-4 h-4 text-rose-500" />
                            YÜKSEK RİSK (Çalışamaz)
                          </span>
                        ) : isCritical ? (
                          <span className="text-xs font-semibold text-amber-400 flex items-center gap-1">
                            <AlertTriangle className="w-4 h-4 text-amber-500" />
                            KRİTİK RİSK (Acil Yenile)
                          </span>
                        ) : (
                          <span className="text-xs font-medium text-yellow-300 flex items-center gap-1">
                            <Clock className="w-4 h-4 text-yellow-500" />
                            ORTA RİSK (Takipte)
                          </span>
                        )}
                      </td>

                      {/* Alert Sent Status */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        {doc.isAlertSent ? (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-400">
                            <CheckCircle2 className="w-4 h-4" />
                            Uyarı İletildi
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs text-slate-500">
                            <Clock className="w-3.5 h-3.5" />
                            Bekliyor
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleSendAlert(doc.id, doc.user.name)}
                            title="Personel ve Şefe Acil Uyarı Bildirimi Gönder"
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 text-xs font-semibold transition-all"
                          >
                            <Bell className="w-3.5 h-3.5" />
                            Uyarı Gönder
                          </button>
                          <button
                            onClick={() => handleOpenRenewModal(doc)}
                            title="Belgeyi Yenile / Süre Uzat"
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-all"
                          >
                            <FileCheck className="w-3.5 h-3.5" />
                            Yenile
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

      {/* Add / Renew Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl relative">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-rose-500" />
                {editingDoc ? "Belge Süresini Yenile" : "Yeni Süreli Evrak Tanımla"}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveDocument} className="space-y-4 mt-4">
              {/* Personnel Selection */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  İlgili Personel *
                </label>
                {editingDoc ? (
                  <div className="px-3 py-2 text-sm rounded-lg bg-slate-950 border border-slate-800 text-slate-300 font-bold">
                    {editingDoc.user?.name}
                  </div>
                ) : (
                  <select
                    value={formUserId}
                    onChange={(e) => setFormUserId(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-rose-500"
                    required
                  >
                    <option value="">Personel Seçiniz...</option>
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name} ({u.role})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Document Type */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Belge Türü *
                </label>
                <select
                  value={formDocType}
                  onChange={(e) => setFormDocType(e.target.value)}
                  disabled={!!editingDoc}
                  className="w-full px-3 py-2 text-sm rounded-lg bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-rose-500"
                  required
                >
                  <option value="MYK">Mesleki Yeterlilik Belgesi (MYK)</option>
                  <option value="HEAVY_MACHINE_LICENSE">
                    İş Makinesi / Ağır Vasıta Ehliyeti (G Sınıfı)
                  </option>
                  <option value="HEALTH_REPORT">İSG İşe Giriş / Periyodik Sağlık Raporu</option>
                </select>
              </div>

              {/* Issue Date */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Tanzim / Düzenleme Tarihi *
                </label>
                <input
                  type="date"
                  value={formIssueDate}
                  onChange={(e) => setFormIssueDate(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-rose-500"
                  required
                />
              </div>

              {/* Expiry Date */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Yeni Bitiş Tarihi (Geçerlilik Sonu) *
                </label>
                <input
                  type="date"
                  value={formExpiryDate}
                  onChange={(e) => setFormExpiryDate(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-rose-500"
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
                  className="px-5 py-2.5 text-xs font-bold rounded-xl bg-rose-600 hover:bg-rose-500 text-white transition-all shadow-lg shadow-rose-950"
                >
                  {isSubmitting ? "Kaydediliyor..." : "Kaydet ve Radarı Güncelle"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
