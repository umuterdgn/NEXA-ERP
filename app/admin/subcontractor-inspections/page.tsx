"use client"
/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Admin Subcontractor Inspections Page (Proof of Work Verification)
 */

import React, { useState, useEffect, useCallback, useMemo } from "react"
import { 
  ShieldCheck, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Search, 
  Building2, 
  Filter, 
  Eye, 
  X, 
  Loader2, 
  AlertTriangle, 
  Sparkles, 
  FileText, 
  ChevronRight, 
  ExternalLink,
  Layers,
  Check,
  RefreshCw,
  Wallet
} from "lucide-react"
import { toast } from "react-hot-toast"

interface WorkProofItem {
  id: string
  title: string
  description?: string | null
  imageUrl: string
  status: "PENDING" | "APPROVED" | "REJECTED"
  createdAt: string
  contract: {
    id: string
    title: string
    totalAmount: number
    projectId?: string | null
    project?: {
      id: string
      name?: string | null
      title?: string | null
    } | null
  }
  subcontractor: {
    id: string
    name: string
    contactName?: string | null
    phone?: string | null
  }
}

interface StatsSummary {
  total: number
  pending: number
  approved: number
  rejected: number
}

export default function SubcontractorInspectionsPage() {
  const [proofs, setProofs] = useState<WorkProofItem[]>([])
  const [stats, setStats] = useState<StatsSummary>({ total: 0, pending: 0, approved: 0, rejected: 0 })
  const [loading, setLoading] = useState(true)
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  // Filters
  const [selectedStatus, setSelectedStatus] = useState<"ALL" | "PENDING" | "APPROVED" | "REJECTED">("ALL")
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedProjectId, setSelectedProjectId] = useState<string>("ALL")
  const [projects, setProjects] = useState<Array<{ id: string; name?: string | null; title?: string | null }>>([])

  // Lightbox Modal
  const [activeModalProof, setActiveModalProof] = useState<WorkProofItem | null>(null)

  // Fetch Inspections Data
  const fetchInspections = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/admin/subcontractor-inspections")
      if (res.ok) {
        const data = await res.json()
        setProofs(data.proofs || [])
        if (data.stats) setStats(data.stats)
      }
    } catch (err) {
      console.error("Fetch inspections error:", err)
      toast.error("Kanıtlar yüklenirken hata oluştu.")
    } finally {
      setLoading(false)
    }
  }, [])

  // Fetch Projects List for Filtering
  useEffect(() => {
    let isActive = true
    const loadProjects = async () => {
      try {
        const res = await fetch("/api/admin/projects")
        if (res.ok && isActive) {
          const data = await res.json()
          setProjects(data)
        }
      } catch (err) {
        console.error("Projects load error:", err)
      }
    }
    void loadProjects()
    void fetchInspections()
    return () => { isActive = false }
  }, [fetchInspections])

  // Update Status Action (APPROVED or REJECTED)
  const handleUpdateStatus = async (proofId: string, newStatus: "APPROVED" | "REJECTED") => {
    setUpdatingId(proofId)
    try {
      const res = await fetch(`/api/admin/subcontractor-inspections/${proofId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus })
      })

      if (res.ok) {
        if (newStatus === "APPROVED") {
          toast.success("İş kanıtı onaylandı! Hakediş hesaplamalarında baz alınacaktır.")
        } else {
          toast.error("İş kanıtı reddedildi.")
        }

        // Update local state smoothly
        setProofs(prev => prev.map(p => p.id === proofId ? { ...p, status: newStatus } : p))

        // Update stats
        setStats(prev => {
          const oldProof = proofs.find(p => p.id === proofId)
          if (!oldProof) return prev
          const oldStatus = oldProof.status
          if (oldStatus === newStatus) return prev

          return {
            ...prev,
            pending: oldStatus === "PENDING" ? Math.max(0, prev.pending - 1) : prev.pending,
            approved: newStatus === "APPROVED" ? prev.approved + 1 : (oldStatus === "APPROVED" ? Math.max(0, prev.approved - 1) : prev.approved),
            rejected: newStatus === "REJECTED" ? prev.rejected + 1 : (oldStatus === "REJECTED" ? Math.max(0, prev.rejected - 1) : prev.rejected)
          }
        })

        if (activeModalProof?.id === proofId) {
          setActiveModalProof(prev => prev ? { ...prev, status: newStatus } : null)
        }
      } else {
        const err = await res.json()
        toast.error(err.error || "Güncelleme başarısız.")
      }
    } catch (err) {
      console.error("Update error:", err)
      toast.error("İşlem sırasında hata oluştu.")
    } finally {
      setUpdatingId(null)
    }
  }

  // Filtered List
  const filteredProofs = useMemo(() => {
    return proofs.filter(p => {
      // Status Filter
      if (selectedStatus !== "ALL" && p.status !== selectedStatus) {
        return false
      }

      // Project Filter
      if (selectedProjectId !== "ALL" && p.contract?.projectId !== selectedProjectId) {
        return false
      }

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        const matchTitle = p.title.toLowerCase().includes(q)
        const matchSub = p.subcontractor.name.toLowerCase().includes(q)
        const matchContract = p.contract.title.toLowerCase().includes(q)
        const matchDesc = p.description?.toLowerCase().includes(q) || false
        if (!matchTitle && !matchSub && !matchContract && !matchDesc) {
          return false
        }
      }

      return true
    })
  }, [proofs, selectedStatus, selectedProjectId, searchQuery])

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Taşeron Denetimleri & İş Kanıtları
            </h1>
            <p className="text-xs sm:text-sm text-slate-400">
              Proof of Work • Sahadan gelen fotoğraflı imalat kanıtlarını onaylayın ve hakedişe bağlayın
            </p>
          </div>
        </div>

        {/* Refresh Button */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchInspections}
            disabled={loading}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-emerald-400" : ""}`} />
            Yenile
          </button>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div 
          onClick={() => setSelectedStatus("ALL")}
          className={`p-4 rounded-2xl border transition cursor-pointer ${
            selectedStatus === "ALL"
              ? "bg-slate-800 border-slate-600 shadow-lg"
              : "bg-slate-900 border-slate-800 hover:border-slate-700"
          }`}
        >
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Toplam Kanıt</span>
            <Layers className="w-4 h-4 text-slate-500" />
          </div>
          <div className="text-2xl font-bold text-white">{stats.total}</div>
        </div>

        <div 
          onClick={() => setSelectedStatus("PENDING")}
          className={`p-4 rounded-2xl border transition cursor-pointer ${
            selectedStatus === "PENDING"
              ? "bg-amber-950/30 border-amber-500/60 shadow-lg shadow-amber-950/40"
              : "bg-slate-900 border-slate-800 hover:border-slate-700"
          }`}
        >
          <div className="flex items-center justify-between text-xs text-amber-400 mb-1">
            <span className="flex items-center gap-1.5 font-medium">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              Onay Bekleyen
            </span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-amber-400">{stats.pending}</div>
        </div>

        <div 
          onClick={() => setSelectedStatus("APPROVED")}
          className={`p-4 rounded-2xl border transition cursor-pointer ${
            selectedStatus === "APPROVED"
              ? "bg-emerald-950/30 border-emerald-500/60 shadow-lg shadow-emerald-950/40"
              : "bg-slate-900 border-slate-800 hover:border-slate-700"
          }`}
        >
          <div className="flex items-center justify-between text-xs text-emerald-400 mb-1">
            <span className="font-medium">Onaylanan (Hakedişe Hazır)</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-emerald-400">{stats.approved}</div>
        </div>

        <div 
          onClick={() => setSelectedStatus("REJECTED")}
          className={`p-4 rounded-2xl border transition cursor-pointer ${
            selectedStatus === "REJECTED"
              ? "bg-red-950/30 border-red-500/60 shadow-lg shadow-red-950/40"
              : "bg-slate-900 border-slate-800 hover:border-slate-700"
          }`}
        >
          <div className="flex items-center justify-between text-xs text-red-400 mb-1">
            <span className="font-medium">Reddedilen</span>
            <XCircle className="w-4 h-4 text-red-400" />
          </div>
          <div className="text-2xl font-bold text-red-400">{stats.rejected}</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 shadow-lg">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="İş başlığı, taşeron adı veya sözleşme ara..."
            className="w-full bg-slate-950 text-sm text-white placeholder-slate-500 rounded-xl pl-9 pr-8 py-2.5 border border-slate-800 focus:border-emerald-500 focus:outline-none transition"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Project Filter */}
        <div className="flex items-center gap-2">
          <div className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 flex items-center gap-2 text-xs">
            <Building2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="bg-transparent text-white font-medium focus:outline-none cursor-pointer appearance-none pr-4"
            >
              <option value="ALL" className="bg-slate-900 text-white">Tüm Şantiyeler</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id} className="bg-slate-900 text-white">
                  {p.title || p.name}
                </option>
              ))}
            </select>
          </div>

          {/* Status Tabs */}
          <div className="flex items-center bg-slate-950 border border-slate-800 p-1 rounded-xl text-xs font-semibold">
            <button
              onClick={() => setSelectedStatus("ALL")}
              className={`px-3 py-1.5 rounded-lg transition ${
                selectedStatus === "ALL" ? "bg-slate-800 text-white" : "text-slate-400 hover:text-white"
              }`}
            >
              Tümü
            </button>
            <button
              onClick={() => setSelectedStatus("PENDING")}
              className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1 ${
                selectedStatus === "PENDING" ? "bg-amber-500/20 text-amber-400 font-bold border border-amber-500/30" : "text-slate-400 hover:text-amber-400"
              }`}
            >
              Bekleyen
            </button>
            <button
              onClick={() => setSelectedStatus("APPROVED")}
              className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1 ${
                selectedStatus === "APPROVED" ? "bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30" : "text-slate-400 hover:text-emerald-400"
              }`}
            >
              Onaylı
            </button>
            <button
              onClick={() => setSelectedStatus("REJECTED")}
              className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1 ${
                selectedStatus === "REJECTED" ? "bg-red-500/20 text-red-400 font-bold border border-red-500/30" : "text-slate-400 hover:text-red-400"
              }`}
            >
              Red
            </button>
          </div>
        </div>
      </div>

      {/* Main Inspections Cards Grid */}
      {loading ? (
        <div className="py-24 flex flex-col items-center justify-center text-slate-400">
          <Loader2 className="w-10 h-10 animate-spin text-emerald-400 mb-3" />
          <p className="text-sm">İş kanıtları yükleniyor...</p>
        </div>
      ) : filteredProofs.length === 0 ? (
        <div className="py-20 text-center bg-slate-900 border border-slate-800 rounded-3xl p-8">
          <ShieldCheck className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-white mb-1">Kayıtlı İş Kanıtı Bulunamadı</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            {searchQuery || selectedStatus !== "ALL" || selectedProjectId !== "ALL"
              ? "Arama ve filtre kriterlerinize uygun kanıt bulunamadı."
              : "Taşeronlar mobil portaldan iş bitimi kanıtı yüklediğinde burada listelenecektir."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredProofs.map((proof) => {
            const isPending = proof.status === "PENDING"
            const isApproved = proof.status === "APPROVED"
            const isRejected = proof.status === "REJECTED"
            const isUpdating = updatingId === proof.id

            return (
              <div
                key={proof.id}
                className="bg-slate-900 border border-slate-800 hover:border-slate-700/80 rounded-2xl overflow-hidden shadow-xl flex flex-col transition-all group"
              >
                {/* Photo Preview with Lightbox Trigger */}
                <div 
                  onClick={() => setActiveModalProof(proof)}
                  className="relative h-52 w-full bg-slate-950 overflow-hidden cursor-pointer group-hover:opacity-95 transition"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={proof.imageUrl}
                    alt={proof.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  
                  {/* Status Overlay Badge */}
                  <div className="absolute top-3 right-3">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold shadow-lg backdrop-blur-md flex items-center gap-1.5 ${
                        isApproved
                          ? "bg-emerald-500/90 text-white border border-emerald-400"
                          : isRejected
                          ? "bg-red-500/90 text-white border border-red-400"
                          : "bg-amber-500/90 text-slate-950 border border-amber-300 animate-pulse"
                      }`}
                    >
                      {isApproved && <CheckCircle2 className="w-3.5 h-3.5" />}
                      {isRejected && <XCircle className="w-3.5 h-3.5" />}
                      {isPending && <Clock className="w-3.5 h-3.5" />}
                      {isApproved ? "ONAYLANDI" : isRejected ? "REDDEDİLDİ" : "ONAY BEKLİYOR"}
                    </span>
                  </div>

                  {/* Magnifier Hover Button */}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="px-3.5 py-1.5 rounded-xl bg-black/70 backdrop-blur-md text-white text-xs font-semibold flex items-center gap-1.5 border border-white/20">
                      <Eye className="w-4 h-4" /> Fotoğrafı İncele
                    </span>
                  </div>
                </div>

                {/* Card Content Body */}
                <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    {/* Subcontractor & Contract Badges */}
                    <div className="flex flex-wrap items-center gap-1.5 mb-2">
                      <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-orange-500/15 text-orange-400 border border-orange-500/30">
                        {proof.subcontractor.name}
                      </span>
                      {proof.contract.project?.name && (
                        <span className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-800 text-slate-300 border border-slate-700/60">
                          {proof.contract.project.name}
                        </span>
                      )}
                    </div>

                    {/* Job Title */}
                    <h3 className="text-base font-bold text-white leading-snug mb-1">
                      {proof.title}
                    </h3>

                    {/* Contract Title */}
                    <p className="text-xs text-emerald-400 font-medium mb-2 truncate">
                      {proof.contract.title}
                    </p>

                    {/* Description */}
                    {proof.description && (
                      <p className="text-xs text-slate-400 line-clamp-3 leading-relaxed mb-3">
                        {proof.description}
                      </p>
                    )}
                  </div>

                  {/* Submission Time & Metadata */}
                  <div className="pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {new Date(proof.createdAt).toLocaleString("tr-TR", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit"
                      })}
                    </span>
                    {isApproved && (
                      <span className="text-emerald-400 font-semibold flex items-center gap-1">
                        <Wallet className="w-3.5 h-3.5" /> Hakedişe Eklendi
                      </span>
                    )}
                  </div>

                  {/* Action Buttons (Yeşil Onayla / Kırmızı Reddet) */}
                  <div className="pt-3 border-t border-slate-800 flex items-center gap-2">
                    <button
                      onClick={() => handleUpdateStatus(proof.id, "APPROVED")}
                      disabled={isUpdating}
                      className={`flex-1 py-2.5 px-3 rounded-xl font-bold text-xs transition flex items-center justify-center gap-1.5 shadow-md ${
                        isApproved
                          ? "bg-emerald-600/30 text-emerald-300 border border-emerald-500/50 cursor-default"
                          : "bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/20 active:scale-95"
                      }`}
                    >
                      {isUpdating ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <Check className="w-4 h-4 stroke-[2.5]" />
                          Onayla (APPROVED)
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => handleUpdateStatus(proof.id, "REJECTED")}
                      disabled={isUpdating}
                      className={`flex-1 py-2.5 px-3 rounded-xl font-bold text-xs transition flex items-center justify-center gap-1.5 ${
                        isRejected
                          ? "bg-red-600/30 text-red-300 border border-red-500/50 cursor-default"
                          : "bg-red-600/20 hover:bg-red-600/30 text-red-300 border border-red-500/30 hover:border-red-500/50 active:scale-95"
                      }`}
                    >
                      {isUpdating ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <X className="w-4 h-4 stroke-[2.5]" />
                          Reddet (REJECTED)
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Lightbox / High-Res Verification Modal */}
      {activeModalProof && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150">
          <div className="relative w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            {/* Modal Close Button */}
            <button
              onClick={() => setActiveModalProof(null)}
              className="absolute top-4 right-4 z-20 p-2 rounded-full bg-black/60 hover:bg-black/90 text-white backdrop-blur-md transition"
              aria-label="Kapat"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Modal Image Box */}
            <div className="relative h-80 sm:h-96 w-full bg-slate-950 flex items-center justify-center overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={activeModalProof.imageUrl}
                alt={activeModalProof.title}
                className="w-full h-full object-contain"
              />
            </div>

            {/* Modal Details & Action Bar */}
            <div className="p-5 sm:p-6 space-y-4 overflow-y-auto">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2.5 py-0.5 rounded-md text-xs font-bold bg-orange-500/15 text-orange-400 border border-orange-500/30">
                      {activeModalProof.subcontractor.name}
                    </span>
                    <span className="text-xs text-slate-400">
                      Sözleşme: <strong className="text-white">{activeModalProof.contract.title}</strong>
                    </span>
                  </div>
                  <h2 className="text-lg sm:text-xl font-bold text-white">
                    {activeModalProof.title}
                  </h2>
                </div>

                {/* Status Badge */}
                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold ${
                    activeModalProof.status === "APPROVED"
                      ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                      : activeModalProof.status === "REJECTED"
                      ? "bg-red-500/20 text-red-400 border border-red-500/30"
                      : "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                  }`}
                >
                  {activeModalProof.status === "APPROVED"
                    ? "ONAYLANDI (HAKEDİŞE HAZIR)"
                    : activeModalProof.status === "REJECTED"
                    ? "REDDEDİLDİ"
                    : "ONAY BEKLİYOR"}
                </span>
              </div>

              {activeModalProof.description && (
                <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 text-xs sm:text-sm text-slate-300 leading-relaxed">
                  {activeModalProof.description}
                </div>
              )}

              <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800">
                <span>Gönderim Tarihi: {new Date(activeModalProof.createdAt).toLocaleString("tr-TR")}</span>
                <span>İrtibat: {activeModalProof.subcontractor.contactName} ({activeModalProof.subcontractor.phone || "Telefon yok"})</span>
              </div>

              {/* Action Buttons in Modal */}
              <div className="flex items-center gap-3 pt-3">
                <button
                  onClick={() => handleUpdateStatus(activeModalProof.id, "APPROVED")}
                  disabled={updatingId === activeModalProof.id}
                  className="flex-1 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm transition flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/25"
                >
                  <Check className="w-5 h-5" />
                  İş Kanıtını Onayla (APPROVED)
                </button>
                <button
                  onClick={() => handleUpdateStatus(activeModalProof.id, "REJECTED")}
                  disabled={updatingId === activeModalProof.id}
                  className="flex-1 py-3 px-4 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-sm transition flex items-center justify-center gap-2 shadow-lg shadow-red-600/25"
                >
                  <X className="w-5 h-5" />
                  Kanıtı Reddet (REJECTED)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
