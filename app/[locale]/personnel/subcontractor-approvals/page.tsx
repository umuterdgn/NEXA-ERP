"use client"
/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Field Engineer Subcontractor Proof of Work Approvals Page
 */

import React, { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
  CheckSquare,
  ShieldCheck,
  Clock,
  CheckCircle2,
  AlertCircle,
  Building2,
  Calendar,
  Camera,
  MapPin,
  Boxes,
  ArrowLeft,
  RefreshCw,
  Search,
  Eye,
  X,
  Send,
  ThumbsUp,
  ThumbsDown,
  Loader2,
  FileCheck2
} from "lucide-react"
import { getProofsForApproval, approveProofAction, rejectProofAction } from "./actions"
import { toast } from "react-hot-toast"

interface ProofItem {
  id: string
  title: string
  description?: string | null
  imageUrl: string
  status: string
  engineerStatus: string
  managerStatus: string
  latitude?: number | null
  longitude?: number | null
  bimElementId?: string | null
  createdAt: string | Date
  contract?: {
    id: string
    title: string
    project?: { id: string; name?: string | null; title?: string | null } | null
    subcontractor?: { id: string; name: string } | null
  } | null
  subcontractor?: {
    id: string
    name: string
    contactName?: string | null
    phone?: string | null
  } | null
}

export default function SubcontractorApprovalsPage() {
  const router = useRouter()
  const [proofs, setProofs] = useState<ProofItem[]>([])
  const [loading, setLoading] = useState(true)
  const [activeFilter, setActiveFilter] = useState<string>("PENDING")
  const [searchQuery, setSearchQuery] = useState("")

  // Action states
  const [approvingId, setApprovingId] = useState<string | null>(null)
  const [rejectingItem, setRejectingItem] = useState<ProofItem | null>(null)
  const [rejectionReason, setRejectionReason] = useState("")
  const [isRejecting, setIsRejecting] = useState(false)

  // Lightbox
  const [previewPhoto, setPreviewPhoto] = useState<string | null>(null)

  const loadProofs = async () => {
    setLoading(true)
    try {
      const res = await getProofsForApproval()
      if (res.success && res.proofs) {
        setProofs(res.proofs as any)
      } else {
        toast.error("İş kanıtları yüklenemedi.")
      }
    } catch (err) {
      console.error("Load proofs error:", err)
      toast.error("Kayıtlar alınırken bir hata oluştu.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadProofs()
  }, [])

  // Approve Handler
  const handleApprove = async (proofId: string) => {
    setApprovingId(proofId)
    try {
      const res = await approveProofAction(proofId)
      if (res.success) {
        toast.success(res.message || "İş kanıtı teknik kabule alındı!")
        setProofs((prev) =>
          prev.map((p) =>
            p.id === proofId ? { ...p, engineerStatus: "APPROVED", status: "APPROVED" } : p
          )
        )
      } else {
        toast.error(res.error || "Onaylama başarısız.")
      }
    } catch (err) {
      toast.error("İşlem sırasında hata oluştu.")
    } finally {
      setApprovingId(null)
    }
  }

  // Reject Submit Handler
  const handleRejectSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!rejectingItem) return

    if (!rejectionReason.trim()) {
      toast.error("Lütfen ret/düzeltme gerekçesini yazınız.")
      return
    }

    setIsRejecting(true)
    try {
      const res = await rejectProofAction(rejectingItem.id, rejectionReason)
      if (res.success) {
        toast.success(res.message || "İş kanıtı reddedildi.")
        setRejectingItem(null)
        setRejectionReason("")
        loadProofs()
      } else {
        toast.error(res.error || "İşlem başarısız.")
      }
    } catch (err) {
      toast.error("Hata oluştu.")
    } finally {
      setIsRejecting(false)
    }
  }

  // Filtered Proofs
  const filteredProofs = proofs.filter((p) => {
    const engStatus = (p.engineerStatus || "PENDING").toUpperCase()
    const matchesFilter =
      activeFilter === "ALL" ||
      (activeFilter === "PENDING" && engStatus === "PENDING") ||
      (activeFilter === "APPROVED" && engStatus === "APPROVED") ||
      (activeFilter === "REJECTED" && engStatus === "REJECTED")

    const searchLower = searchQuery.toLowerCase()
    const matchesSearch =
      p.title.toLowerCase().includes(searchLower) ||
      (p.description || "").toLowerCase().includes(searchLower) ||
      (p.contract?.subcontractor?.name || p.subcontractor?.name || "").toLowerCase().includes(searchLower) ||
      (p.bimElementId || "").toLowerCase().includes(searchLower)

    return matchesFilter && matchesSearch
  })

  // KPI Calculations
  const totalCount = proofs.length
  const pendingCount = proofs.filter((p) => (p.engineerStatus || "PENDING") === "PENDING").length
  const approvedCount = proofs.filter((p) => p.engineerStatus === "APPROVED").length
  const rejectedCount = proofs.filter((p) => p.engineerStatus === "REJECTED").length

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-6 lg:p-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <button
            onClick={() => router.push("/personnel")}
            className="flex items-center gap-2 text-sm text-orange-400 hover:text-orange-300 mb-2 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            Personel Portalı
          </button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-500/20 border border-orange-500/30 flex items-center justify-center text-orange-400">
              <CheckSquare className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                Taşeron İş Kabulleri & Saha Onayları
              </h1>
              <p className="text-xs sm:text-sm text-slate-400">
                Saha mühendisi 1. Kademe teknik kabul ve imalat uygunluk denetimi
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadProofs}
            disabled={loading}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 flex items-center gap-2 transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-orange-400" : ""}`} />
            Yenile
          </button>
        </div>
      </div>

      {/* 4 KPI Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
            <span>Toplam Kanıt Kaydı</span>
            <FileCheck2 className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-bold text-white font-mono">{totalCount}</div>
          <p className="text-[11px] text-slate-500 mt-1">Yüklenen imalat kanıtları</p>
        </div>

        <div className="bg-amber-950/20 border border-amber-900/40 rounded-2xl p-4">
          <div className="flex items-center justify-between text-amber-400 text-xs mb-2">
            <span>Mühendis Onayı Bekleyen</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-amber-400 font-mono">{pendingCount}</div>
          <p className="text-[11px] text-amber-300/70 mt-1">Saha kabulü bekleyen işler</p>
        </div>

        <div className="bg-emerald-950/20 border border-emerald-900/40 rounded-2xl p-4">
          <div className="flex items-center justify-between text-emerald-400 text-xs mb-2">
            <span>Onaylanan (Teknik Kabul)</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-emerald-400 font-mono">{approvedCount}</div>
          <p className="text-[11px] text-emerald-300/70 mt-1">Hakedişe aktarılanlar</p>
        </div>

        <div className="bg-red-950/20 border border-red-900/40 rounded-2xl p-4">
          <div className="flex items-center justify-between text-red-400 text-xs mb-2">
            <span>Düzeltme İstenen / Red</span>
            <AlertCircle className="w-4 h-4 text-red-400" />
          </div>
          <div className="text-2xl font-bold text-red-400 font-mono">{rejectedCount}</div>
          <p className="text-[11px] text-red-300/70 mt-1">Revizyon talep edilenler</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 mb-6 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="İş başlığı, taşeron firma veya BIM elemanı ara..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 transition"
          />
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          {[
            { id: "PENDING", label: "Onay Bekleyenler" },
            { id: "APPROVED", label: "Onaylananlar" },
            { id: "REJECTED", label: "Reddedilenler" },
            { id: "ALL", label: "Tümü" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveFilter(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition ${
                activeFilter === tab.id
                  ? "bg-orange-600 text-white shadow-md shadow-orange-600/30"
                  : "bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-800"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* DataGrid & Cards List */}
      {loading ? (
        <div className="py-20 text-center">
          <RefreshCw className="w-8 h-8 text-orange-400 animate-spin mx-auto mb-3" />
          <p className="text-slate-400 text-sm">İş kanıtları yükleniyor...</p>
        </div>
      ) : filteredProofs.length === 0 ? (
        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-12 text-center">
          <CheckSquare className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-white mb-1">
            {searchQuery || activeFilter !== "ALL"
              ? "Kriterlere uygun iş kanıtı bulunamadı"
              : "Onay bekleyen iş kanıtı bulunmuyor"}
          </h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Taşeronlar sahada imalat tamamlayıp iş kanıtı fotoğrafı yüklediklerinde burada listelenir.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredProofs.map((proof) => {
            const subName =
              proof.contract?.subcontractor?.name || proof.subcontractor?.name || "Taşeron Firma"
            const projName =
              proof.contract?.project?.name || proof.contract?.project?.title || "Merkez Şantiye"

            const isPending = (proof.engineerStatus || "PENDING") === "PENDING"
            const isApproved = proof.engineerStatus === "APPROVED"
            const isRejected = proof.engineerStatus === "REJECTED"

            return (
              <div
                key={proof.id}
                className="bg-slate-900/80 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-4 sm:p-5 transition"
              >
                <div className="flex flex-col lg:flex-row gap-5 items-start">
                  {/* Photo Thumbnail */}
                  <div className="relative w-full sm:w-44 h-36 rounded-xl overflow-hidden border border-slate-700 bg-black shrink-0 group">
                    <img
                      src={proof.imageUrl}
                      alt={proof.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition"
                    />
                    <button
                      type="button"
                      onClick={() => setPreviewPhoto(proof.imageUrl)}
                      className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition text-white text-xs font-semibold gap-1.5"
                    >
                      <Eye className="w-4 h-4" />
                      Fotoğrafı Büyüt
                    </button>
                  </div>

                  {/* Proof Info */}
                  <div className="flex-1 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-bold px-2.5 py-0.5 rounded-lg bg-slate-800 text-orange-400 border border-slate-700">
                        {subName}
                      </span>

                      <span className="text-xs text-slate-400 flex items-center gap-1">
                        <Building2 className="w-3.5 h-3.5 text-slate-500" />
                        {projName}
                      </span>

                      <span className="text-slate-600">•</span>

                      <span className="text-xs text-slate-400 flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-500" />
                        {new Date(proof.createdAt).toLocaleDateString("tr-TR", {
                          day: "numeric",
                          month: "long",
                          year: "numeric"
                        })}
                      </span>

                      {/* GPS Badge */}
                      {proof.latitude && proof.longitude && (
                        <span className="text-[11px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          GPS: {proof.latitude.toFixed(4)}, {proof.longitude.toFixed(4)}
                        </span>
                      )}

                      {/* BIM Element Badge */}
                      {proof.bimElementId && (
                        <span className="text-[11px] font-mono text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20 flex items-center gap-1">
                          <Boxes className="w-3 h-3" />
                          BIM: {proof.bimElementId}
                        </span>
                      )}
                    </div>

                    <h3 className="text-base font-bold text-white">{proof.title}</h3>

                    {proof.description && (
                      <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-2xl">
                        {proof.description}
                      </p>
                    )}

                    {proof.contract?.title && (
                      <div className="text-[11px] text-slate-500">
                        Sözleşme: {proof.contract.title}
                      </div>
                    )}

                    {/* Status Pill */}
                    <div className="pt-1 flex items-center gap-2">
                      <span className="text-[11px] text-slate-400">Teknik Kabul:</span>
                      {isApproved ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Mühendis Onayladı
                        </span>
                      ) : isRejected ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-500/20 text-red-400 border border-red-500/30">
                          <AlertCircle className="w-3.5 h-3.5" />
                          Reddedildi / Düzeltme İstendi
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                          <Clock className="w-3.5 h-3.5" />
                          Mühendis Onayı Bekliyor
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions for Field Engineer */}
                  <div className="w-full lg:w-auto flex flex-row lg:flex-col gap-2 pt-2 lg:pt-0 shrink-0">
                    {isPending ? (
                      <>
                        <button
                          type="button"
                          onClick={() => handleApprove(proof.id)}
                          disabled={approvingId === proof.id}
                          className="flex-1 lg:flex-initial px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-md shadow-emerald-600/20 flex items-center justify-center gap-1.5 transition"
                        >
                          {approvingId === proof.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <ThumbsUp className="w-4 h-4" />
                          )}
                          <span>Teknik Kabulü Onayla</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setRejectingItem(proof)}
                          className="flex-1 lg:flex-initial px-4 py-2 rounded-xl bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-500/30 font-semibold text-xs flex items-center justify-center gap-1.5 transition"
                        >
                          <ThumbsDown className="w-3.5 h-3.5" />
                          <span>Düzeltme İste / Reddet</span>
                        </button>
                      </>
                    ) : (
                      <div className="text-xs text-slate-500 italic">
                        İşlem tamamlandı
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Reject Modal */}
      {rejectingItem && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white">İş Kanıtı Ret / Düzeltme Talebi</h3>
              <button
                onClick={() => setRejectingItem(null)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRejectSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Taşerona İletilecek Ret Gerekçesi / Düzeltme Notu *
                </label>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  rows={4}
                  required
                  placeholder="Örn: Kolon paspayları fotoğrafta yetersiz görünmektedir, şantiye şefliği ile sahada yeniden ölçüm yapılmalıdır..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-red-500 resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setRejectingItem(null)}
                  className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={isRejecting}
                  className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-semibold flex items-center gap-2"
                >
                  <Send className="w-3.5 h-3.5" />
                  {isRejecting ? "Gönderiliyor..." : "Reddet & Bildir"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Lightbox Modal */}
      {previewPhoto && (
        <div
          onClick={() => setPreviewPhoto(null)}
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 cursor-zoom-out"
        >
          <div className="relative max-w-2xl max-h-[90vh]">
            <img
              src={previewPhoto}
              alt="Kanıt Önizleme"
              className="max-w-full max-h-[85vh] rounded-2xl object-contain shadow-2xl"
            />
            <button
              onClick={() => setPreviewPhoto(null)}
              className="absolute top-3 right-3 p-2 bg-black/60 text-white rounded-full hover:bg-black"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
