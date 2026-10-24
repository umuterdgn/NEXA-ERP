"use client"
/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Subcontractor Audit Deficiencies & NCR Quality Page
 */

import React, { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  ShieldAlert,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Search,
  ArrowLeft,
  RefreshCw,
  Building2,
  Calendar,
  Camera,
  X,
  Send,
  ExternalLink,
  Eye,
  FileCheck2,
  AlertCircle
} from "lucide-react"
import { getSubcontractorAudits, submitDefectCorrection } from "./actions"
import { toast } from "react-hot-toast"

interface AuditItem {
  id: string
  reportNo?: string
  location?: string
  issueType?: string
  description: string
  status: string
  deadline?: string | Date | null
  dueDate?: string | Date | null
  photos?: string[]
  photoUrl?: string | null
  createdAt: string | Date
  project?: {
    id: string
    name?: string | null
    title?: string | null
  } | null
  creator?: {
    id: string
    name: string
    email: string
  } | null
}

export default function SubcontractorAuditsPage() {
  const router = useRouter()
  const [audits, setAudits] = useState<AuditItem[]>([])
  const [loading, setLoading] = useState(true)
  const [activeFilter, setActiveFilter] = useState<string>("ALL")
  const [searchQuery, setSearchQuery] = useState<string>("")

  // Modal states for defect correction
  const [selectedAudit, setSelectedAudit] = useState<AuditItem | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [resolutionNote, setResolutionNote] = useState("")
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  // Photo preview modal
  const [viewPhotoUrl, setViewPhotoUrl] = useState<string | null>(null)

  const loadAudits = async () => {
    setLoading(true)
    try {
      const res = await getSubcontractorAudits()
      if (res.success) {
        // Merge nonConformances and ncrReports
        const combined: AuditItem[] = [
          ...(res.nonConformances || []).map((nc: any) => ({
            ...nc,
            reportNo: nc.reportNo || "NCR",
            photos: nc.photos || []
          })),
          ...(res.ncrReports || []).map((nr: any) => ({
            ...nr,
            reportNo: `NCR-${nr.id.slice(-4).toUpperCase()}`,
            deadline: nr.dueDate,
            photos: nr.photoUrl ? [nr.photoUrl] : []
          }))
        ]
        setAudits(combined)
      } else {
        toast.error("Denetim kayıtları alınamadı.")
      }
    } catch (err) {
      console.error("Audits load error:", err)
      toast.error("Denetimler yüklenemedi.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadAudits()
  }, [])

  // Open correction modal
  const handleOpenCorrection = (audit: AuditItem) => {
    setSelectedAudit(audit)
    setResolutionNote("")
    setSelectedFile(null)
    setPreviewUrl(null)
    setIsModalOpen(true)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      setPreviewUrl(URL.createObjectURL(file))
    }
  }

  const handleSubmitCorrection = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedAudit) return

    if (!resolutionNote.trim()) {
      toast.error("Lütfen yapılan düzeltme hakkında açıklama yazınız.")
      return
    }

    setSubmitting(true)
    try {
      const formData = new FormData()
      formData.append("id", selectedAudit.id)
      formData.append("resolutionNote", resolutionNote)
      if (selectedFile) {
        formData.append("photo", selectedFile)
      }

      const res = await submitDefectCorrection(formData)
      if (res.success) {
        toast.success("Düzeltme kanıtı başarıyla kaydedildi! Şantiye şefinin kontrolüne sunuldu.")
        setIsModalOpen(false)
        loadAudits()
      } else {
        toast.error(res.error || "Düzeltme gönderilemedi.")
      }
    } catch (err) {
      toast.error("İşlem sırasında hata oluştu.")
    } finally {
      setSubmitting(false)
    }
  }

  // Filter audits
  const filteredAudits = audits.filter((audit) => {
    const status = (audit.status || "").toUpperCase()
    const matchesFilter =
      activeFilter === "ALL" ||
      (activeFilter === "OPEN" && (status === "OPEN" || status === "AÇIK")) ||
      (activeFilter === "RESOLVED" && (status === "RESOLVED" || status === "ÇÖZÜLDÜ" || status === "VERIFIED"))

    const matchesSearch =
      (audit.reportNo || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      audit.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (audit.project?.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (audit.location || "").toLowerCase().includes(searchQuery.toLowerCase())

    return matchesFilter && matchesSearch
  })

  // KPI calculations
  const totalCount = audits.length
  const openCount = audits.filter(
    (a) => a.status.toUpperCase() === "OPEN" || a.status === "Açık"
  ).length
  const resolvedCount = audits.filter(
    (a) => a.status.toUpperCase() === "RESOLVED" || a.status === "Çözüldü" || a.status.toUpperCase() === "VERIFIED"
  ).length

  // Check overdue
  const overdueCount = audits.filter((a) => {
    const d = a.deadline || a.dueDate
    if (!d) return false
    const isPast = new Date(d).getTime() < Date.now()
    const isOpen = a.status.toUpperCase() === "OPEN" || a.status === "Açık"
    return isPast && isOpen
  }).length

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-6 lg:p-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <button
            onClick={() => router.push("/subcontractor")}
            className="flex items-center gap-2 text-sm text-orange-400 hover:text-orange-300 mb-2 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            Portala Dön
          </button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-500/20 border border-red-500/30 flex items-center justify-center text-red-400">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                Denetim Sonuçlarım & Saha Kusur Kayıtları
              </h1>
              <p className="text-xs sm:text-sm text-slate-400">
                Yapı denetim ve şantiye şefliği tarafından tespit edilen uygunsuzluklar (NCR) ve DÖF takibi
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadAudits}
            disabled={loading}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 flex items-center gap-2 transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-orange-400" : ""}`} />
            Yenile
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
            <span>Toplam Denetim Kaydı</span>
            <FileCheck2 className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-bold text-white">{totalCount}</div>
          <p className="text-[11px] text-slate-500 mt-1">Açılan tüm kusur raporları</p>
        </div>

        <div className="bg-amber-950/20 border border-amber-900/40 rounded-2xl p-4">
          <div className="flex items-center justify-between text-amber-400 text-xs mb-2">
            <span>Açık Uygunsuzluk (DÖF)</span>
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-amber-400">{openCount}</div>
          <p className="text-[11px] text-amber-300/70 mt-1">Düzeltme bekleyen imalatlar</p>
        </div>

        <div className="bg-red-950/20 border border-red-900/40 rounded-2xl p-4">
          <div className="flex items-center justify-between text-red-400 text-xs mb-2">
            <span>Termin Geçen / Kritik</span>
            <Clock className="w-4 h-4 text-red-400" />
          </div>
          <div className="text-2xl font-bold text-red-400">{overdueCount}</div>
          <p className="text-[11px] text-red-300/70 mt-1">Geciken düzeltmeler</p>
        </div>

        <div className="bg-emerald-950/20 border border-emerald-900/40 rounded-2xl p-4">
          <div className="flex items-center justify-between text-emerald-400 text-xs mb-2">
            <span>Giderilen / Onaylanan</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-emerald-400">{resolvedCount}</div>
          <p className="text-[11px] text-emerald-300/70 mt-1">Kapatılan uygunsuzluklar</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 mb-6 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="NCR No, kusur tanımı, mahal veya proje ara..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 transition"
          />
        </div>

        {/* Status Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          {[
            { id: "ALL", label: "Tümü" },
            { id: "OPEN", label: "Açık / Düzeltme Bekleyen" },
            { id: "RESOLVED", label: "Giderildi / Kapalı" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveFilter(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition ${
                activeFilter === tab.id
                  ? "bg-red-600 text-white shadow-md shadow-red-600/30"
                  : "bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-800"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Audits List */}
      {loading ? (
        <div className="py-20 text-center">
          <RefreshCw className="w-8 h-8 text-orange-400 animate-spin mx-auto mb-3" />
          <p className="text-slate-400 text-sm">Denetim sonuçları inceleniyor...</p>
        </div>
      ) : filteredAudits.length === 0 ? (
        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-12 text-center">
          <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-white mb-1">
            Harika! Açık bir kusur kaydı bulunmuyor
          </h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            İmalatlarınız yapı denetim ve şantiye şefliği tarafından onaylıdır. Yeni bir uygunsuzluk açıldığında burada listelenecektir.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredAudits.map((audit) => {
            const isOverdue =
              (audit.deadline || audit.dueDate) &&
              new Date(audit.deadline || audit.dueDate!).getTime() < Date.now() &&
              (audit.status.toUpperCase() === "OPEN" || audit.status === "Açık")

            const isOpen = audit.status.toUpperCase() === "OPEN" || audit.status === "Açık"

            return (
              <div
                key={audit.id}
                className={`bg-slate-900/80 hover:bg-slate-900 border rounded-2xl p-4 sm:p-5 transition group ${
                  isOverdue
                    ? "border-red-900/60 bg-red-950/10"
                    : isOpen
                    ? "border-amber-900/40"
                    : "border-slate-800"
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                  <div className="flex-1 space-y-2">
                    {/* Header line */}
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-md bg-slate-800 text-orange-400 border border-slate-700">
                        {audit.reportNo || "NCR"}
                      </span>

                      {isOpen ? (
                        <span className="px-2.5 py-0.5 rounded-lg text-xs font-semibold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                          Açık / Düzeltme Bekliyor
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-lg text-xs font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                          Düzeltildi / İnceleniyor
                        </span>
                      )}

                      {isOverdue && (
                        <span className="px-2 py-0.5 rounded-lg text-xs font-bold bg-red-600 text-white animate-pulse">
                          Termin Geçti!
                        </span>
                      )}

                      <span className="text-xs text-slate-400 flex items-center gap-1.5 ml-1">
                        <Building2 className="w-3.5 h-3.5 text-slate-500" />
                        {audit.project?.name || audit.project?.title || "Merkez Şantiye"}
                      </span>

                      {audit.location && (
                        <span className="text-xs text-slate-400 bg-slate-800/60 px-2 py-0.5 rounded">
                          📍 {audit.location}
                        </span>
                      )}
                    </div>

                    {/* Defect Description */}
                    <p className="text-xs sm:text-sm text-slate-200 leading-relaxed max-w-3xl whitespace-pre-line">
                      {audit.description}
                    </p>

                    {/* Deadline and Creator Info */}
                    <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 pt-1">
                      {(audit.deadline || audit.dueDate) && (
                        <span className="flex items-center gap-1.5 text-slate-300">
                          <Calendar className="w-3.5 h-3.5 text-orange-400" />
                          Son Çözüm Tarihi:{" "}
                          <strong className={isOverdue ? "text-red-400 font-bold" : "text-white"}>
                            {new Date(audit.deadline || audit.dueDate!).toLocaleDateString("tr-TR", {
                              day: "numeric",
                              month: "long",
                              year: "numeric"
                            })}
                          </strong>
                        </span>
                      )}

                      {audit.creator && (
                        <span className="text-slate-400">
                          Denetleyen: <span className="text-slate-300 font-medium">{audit.creator.name}</span>
                        </span>
                      )}
                    </div>

                    {/* Defect Photos Gallery */}
                    {audit.photos && audit.photos.length > 0 && (
                      <div className="pt-2 flex items-center gap-2">
                        <span className="text-[11px] text-slate-400">Kanıt Fotoğrafları:</span>
                        <div className="flex items-center gap-2">
                          {audit.photos.map((photo, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => setViewPhotoUrl(photo)}
                              className="relative group/photo w-12 h-12 rounded-lg overflow-hidden border border-slate-700 bg-slate-800 hover:border-orange-500 transition"
                            >
                              <img
                                src={photo}
                                alt="Kusur"
                                className="w-full h-full object-cover group-hover/photo:scale-110 transition"
                              />
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/photo:opacity-100 flex items-center justify-center transition">
                                <Eye className="w-3.5 h-3.5 text-white" />
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="pt-2 lg:pt-0 shrink-0">
                    {isOpen ? (
                      <button
                        onClick={() => handleOpenCorrection(audit)}
                        className="px-4 py-2 rounded-xl bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 text-white text-xs font-semibold shadow-md shadow-orange-600/20 flex items-center gap-2 transition"
                      >
                        <Camera className="w-3.5 h-3.5" />
                        Düzeltme Bildir / Kanıt Yükle
                      </button>
                    ) : (
                      <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-semibold bg-emerald-500/10 px-3 py-1.5 rounded-xl border border-emerald-500/20">
                        <CheckCircle2 className="w-4 h-4" />
                        Düzeltme İletildi
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Defect Correction Modal */}
      {isModalOpen && selectedAudit && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-orange-500/20 text-orange-400 flex items-center justify-center font-bold text-xs">
                  NCR
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    Kusur Düzeltme Bildirimi
                  </h3>
                  <p className="text-xs text-slate-400">{selectedAudit.reportNo}</p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitCorrection} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Yapılan Düzeltme İmalatı ve Açıklama *
                </label>
                <textarea
                  value={resolutionNote}
                  onChange={(e) => setResolutionNote(e.target.value)}
                  rows={4}
                  required
                  placeholder="Sahada hangi düzeltmeler yapıldı? (Örn: Paspayları yerleştirildi, etriyeler 10cm projeye uygun sıklaştırıldı...)"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 resize-none transition"
                />
              </div>

              {/* Photo Upload */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Düzeltilmiş Halinin Fotoğrafı (Saha Kanıtı)
                </label>
                <div className="flex items-center gap-3">
                  <label className="flex-1 cursor-pointer border border-dashed border-slate-700 hover:border-orange-500 bg-slate-950 rounded-xl p-3 text-center transition flex items-center justify-center gap-2">
                    <Camera className="w-4 h-4 text-orange-400" />
                    <span className="text-xs text-slate-400">
                      {selectedFile ? selectedFile.name : "Kamera / Galeri'den Fotoğraf Seç"}
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>
                  {previewUrl && (
                    <div className="relative w-12 h-12 rounded-lg overflow-hidden border border-orange-500 shrink-0">
                      <img src={previewUrl} alt="Önizleme" className="w-full h-full object-cover" />
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white transition"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white text-xs font-semibold flex items-center gap-2 transition"
                >
                  <Send className="w-3.5 h-3.5" />
                  {submitting ? "Kaydediliyor..." : "Düzeltmeyi Şefe İlet"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Lightbox for defect photo view */}
      {viewPhotoUrl && (
        <div
          onClick={() => setViewPhotoUrl(null)}
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 cursor-zoom-out"
        >
          <div className="relative max-w-2xl max-h-[90vh]">
            <img
              src={viewPhotoUrl}
              alt="Kusur Detayı"
              className="max-w-full max-h-[85vh] rounded-2xl object-contain shadow-2xl"
            />
            <button
              onClick={() => setViewPhotoUrl(null)}
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
