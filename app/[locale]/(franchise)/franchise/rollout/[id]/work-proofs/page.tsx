"use client"
/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Franchise Çift Kademeli İş Kanıtı (Work Proof) Paneli
 * Taşeron -> Bölge Müdürü Onayı -> Genel Merkez (HQ) Onayı (Hakedişe Hazır)
 */

import { useState, useEffect, use } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import {
  ShieldCheck,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  Upload,
  Camera,
  Image as ImageIcon,
  Building2,
  Check,
  X,
  RefreshCw,
  Plus,
  Loader2,
  FileText,
  UserCheck,
  UserPlus,
  Layers,
  Sparkles,
  Building,
  Briefcase,
} from "lucide-react"
import {
  getRolloutProjectById,
  getRolloutWorkProofs,
  createRolloutWorkProof,
  approveRegionalWorkProof,
  approveHqWorkProof,
  rejectWorkProof,
  getFranchisePersonnelAndSubcontractors,
} from "@/app/actions/franchise"

interface WorkProofItem {
  id: string
  rolloutProjectId: string
  subcontractorId: string
  title: string
  photoUrl?: string | null
  status: "PENDING" | "REGIONAL_APPROVED" | "HQ_APPROVED" | "REJECTED" | string
  regionalNotes?: string | null
  hqNotes?: string | null
  createdAt: string | Date
}

export default function WorkProofsPage() {
  const params = useParams()
  const projectId = (params?.id || "") as string

  const [project, setProject] = useState<any | null>(null)
  const [proofs, setProofs] = useState<WorkProofItem[]>([])
  const [subcontractorsList, setSubcontractorsList] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // Perspektif Filtresi: ALL, SUBCONTRACTOR, REGIONAL, HQ
  const [activeRoleView, setActiveRoleView] = useState<"ALL" | "SUBCONTRACTOR" | "REGIONAL" | "HQ">("ALL")

  // Modal 1: Yeni İş Paketi & Taşeron Ata (ADIM 3)
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false)
  const [isAssignSubmitting, setIsAssignSubmitting] = useState(false)
  const [assignFormError, setAssignFormError] = useState<string | null>(null)
  const [assignFormData, setAssignFormData] = useState({
    title: "",
    subcontractorId: "",
    photoUrl: "",
  })

  // Modal 2: Taşeron Fotoğraf / Kanıt Yükleme Formu
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    title: "",
    subcontractorId: "",
    photoUrl: "https://images.unsplash.com/photo-1541888946425-d0fbb186c5f7?q=80&w=800&auto=format&fit=crop",
  })

  // Action loading states
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null)

  const fetchData = async () => {
    if (!projectId) return
    try {
      setLoading(true)
      const projRes = await getRolloutProjectById(projectId)
      if (projRes.success && projRes.project) {
        setProject(projRes.project)
      }

      const proofRes = await getRolloutWorkProofs(projectId)
      if (proofRes.success && proofRes.workProofs) {
        setProofs(proofRes.workProofs)
      }

      // Taşeron firmaları ve kullanıcıları çek
      const staffRes = await getFranchisePersonnelAndSubcontractors()
      if (staffRes.success && staffRes.subcontractors) {
        setSubcontractorsList(staffRes.subcontractors)
        if (staffRes.subcontractors.length > 0) {
          setAssignFormData((prev) => ({
            ...prev,
            subcontractorId: prev.subcontractorId || staffRes.subcontractors[0].id,
          }))
          setFormData((prev) => ({
            ...prev,
            subcontractorId: prev.subcontractorId || staffRes.subcontractors[0].id,
          }))
        }
      }
    } catch (err) {
      console.error("İş kanıtları yüklenemedi", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [projectId])

  // ADIM 3: Yeni İş Paketi & Taşeron Ata
  const handleAssignSubcontractor = async (e: React.FormEvent) => {
    e.preventDefault()
    setAssignFormError(null)

    if (!assignFormData.title.trim()) {
      setAssignFormError("Lütfen iş paketi başlığını giriniz.")
      return
    }

    const selectedSub = assignFormData.subcontractorId || (subcontractorsList[0]?.id || "SUB_DEFAULT")

    try {
      setIsAssignSubmitting(true)
      const res = await createRolloutWorkProof({
        rolloutProjectId: projectId,
        subcontractorId: selectedSub,
        title: assignFormData.title.trim(),
        photoUrl: assignFormData.photoUrl?.trim() || "",
      })

      if (!res.success) {
        setAssignFormError(res.error || "İş paketi atanamadı.")
        return
      }

      setIsAssignModalOpen(false)
      setAssignFormData({
        title: "",
        subcontractorId: subcontractorsList[0]?.id || "",
        photoUrl: "",
      })
      await fetchData()
    } catch (err: any) {
      setAssignFormError(err.message || "Hata oluştu.")
    } finally {
      setIsAssignSubmitting(false)
    }
  }

  // Yeni Kanıt Yükleme (Taşeron Fotoğrafı)
  const handleUploadProof = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)

    if (!formData.title.trim()) {
      setFormError("Lütfen yapılan işin başlığını giriniz.")
      return
    }
    if (!formData.photoUrl.trim()) {
      setFormError("Lütfen imalat kanıt fotoğrafı URL'sini giriniz.")
      return
    }

    try {
      setIsSubmitting(true)
      const res = await createRolloutWorkProof({
        rolloutProjectId: projectId,
        subcontractorId: formData.subcontractorId || (subcontractorsList[0]?.id || "SUB_DEFAULT"),
        title: formData.title.trim(),
        photoUrl: formData.photoUrl.trim(),
      })

      if (!res.success) {
        setFormError(res.error || "İş kanıtı yüklenemedi.")
        return
      }

      setIsUploadModalOpen(false)
      setFormData({
        title: "",
        subcontractorId: subcontractorsList[0]?.id || "",
        photoUrl: "https://images.unsplash.com/photo-1541888946425-d0fbb186c5f7?q=80&w=800&auto=format&fit=crop",
      })
      await fetchData()
    } catch (err: any) {
      setFormError(err.message || "Hata oluştu.")
    } finally {
      setIsSubmitting(false)
    }
  }

  // Bölge Müdürü Onayı
  const handleRegionalApprove = async (id: string) => {
    try {
      setActionLoadingId(id)
      await approveRegionalWorkProof(id, "Bölge Müdürü sahada inceledi. İmalat onaylandı.")
      await fetchData()
    } finally {
      setActionLoadingId(null)
    }
  }

  // Genel Merkez (HQ) Onayı
  const handleHqApprove = async (id: string) => {
    try {
      setActionLoadingId(id)
      await approveHqWorkProof(id, "Genel Merkez (HQ) teknik şartnameye uygunluğu teyit etti. Hakedişe hazır.")
      await fetchData()
    } finally {
      setActionLoadingId(null)
    }
  }

  // Reddetme
  const handleReject = async (id: string) => {
    try {
      setActionLoadingId(id)
      await rejectWorkProof(id, "İmalat fotoğrafları kalite şartnamesine uygun görülmedi. Revizyon talep edildi.")
      await fetchData()
    } finally {
      setActionLoadingId(null)
    }
  }

  // Rol Filtresine göre gösterim
  const displayedProofs = proofs.filter((proof) => {
    if (activeRoleView === "SUBCONTRACTOR") return true
    if (activeRoleView === "REGIONAL") return proof.status === "PENDING"
    if (activeRoleView === "HQ") return proof.status === "REGIONAL_APPROVED"
    return true
  })

  return (
    <div className="w-full space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 mb-1">
            <Link href="/franchise/rollout" className="hover:text-amber-400 transition-colors flex items-center gap-1">
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Rollout Listesine Dön</span>
            </Link>
            <span>•</span>
            <span className="text-amber-400">{project?.name || "Şube Projesi"}</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            Çift Kademeli Taşeron İş Kanıtı Onayı
          </h1>
          <p className="text-sm text-slate-400">
            Taşeron fotoğraflı iş kanıtı sunar; önce Bölge Müdürü, ardından Genel Merkez (HQ) onaylayarak hakedişe aktarır.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchData}
            disabled={loading}
            className="p-2 rounded-lg bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 transition-colors"
            title="Yenile"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>

          {/* ADIM 3: Yeni İş Paketi & Taşeron Ata Butonu */}
          <button
            onClick={() => {
              if (subcontractorsList.length > 0 && !assignFormData.subcontractorId) {
                setAssignFormData((prev) => ({ ...prev, subcontractorId: subcontractorsList[0].id }))
              }
              setIsAssignModalOpen(true)
            }}
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md shadow-emerald-600/20 transition-all"
          >
            <UserPlus className="w-4 h-4" />
            <span>Yeni İş Paketi & Taşeron Ata</span>
          </button>

          <button
            onClick={() => setIsUploadModalOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold shadow-md shadow-amber-600/20 transition-all"
          >
            <Camera className="w-4 h-4" />
            <span>Fotoğraf / Kanıt Yükle</span>
          </button>
        </div>
      </div>

      {/* Role Perspective Switcher Tabs */}
      <div className="flex flex-wrap items-center gap-2 p-1.5 bg-slate-900/90 border border-slate-800 rounded-xl">
        <button
          onClick={() => setActiveRoleView("ALL")}
          className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
            activeRoleView === "ALL"
              ? "bg-amber-600 text-white shadow-sm"
              : "text-slate-400 hover:text-white"
          }`}
        >
          Tüm Akış ({proofs.length})
        </button>

        <button
          onClick={() => setActiveRoleView("SUBCONTRACTOR")}
          className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
            activeRoleView === "SUBCONTRACTOR"
              ? "bg-blue-600 text-white shadow-sm"
              : "text-slate-400 hover:text-white"
          }`}
        >
          Taşeron Görünümü (Form & Yüklemeler)
        </button>

        <button
          onClick={() => setActiveRoleView("REGIONAL")}
          className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
            activeRoleView === "REGIONAL"
              ? "bg-purple-600 text-white shadow-sm"
              : "text-slate-400 hover:text-white"
          }`}
        >
          <span>Bölge Müdürü Onay Havuzu</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-800 text-amber-400 font-bold">
            {proofs.filter((p) => p.status === "PENDING").length}
          </span>
        </button>

        <button
          onClick={() => setActiveRoleView("HQ")}
          className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
            activeRoleView === "HQ"
              ? "bg-emerald-600 text-white shadow-sm"
              : "text-slate-400 hover:text-white"
          }`}
        >
          <span>Genel Merkez (HQ) Nihai Onay</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-800 text-emerald-400 font-bold">
            {proofs.filter((p) => p.status === "REGIONAL_APPROVED").length}
          </span>
        </button>
      </div>

      {/* Empty State */}
      {!loading && proofs.length === 0 && (
        <div className="bg-slate-900/60 rounded-2xl border border-dashed border-slate-800 p-12 text-center max-w-xl mx-auto space-y-4 shadow-xl my-6">
          <div className="w-16 h-16 rounded-2xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-center mx-auto text-slate-400 shadow-inner">
            <Camera className="w-8 h-8 text-amber-400" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-white">Henüz İş Kanıtı Yüklenmedi</h3>
            <p className="text-sm text-slate-400">
              Bu şantiye için taşeronlar tarafından sisteme henüz imalat fotoğrafı veya iş teslim kanıtı yüklenmemiştir.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              onClick={() => {
                if (subcontractorsList.length > 0 && !assignFormData.subcontractorId) {
                  setAssignFormData((prev) => ({ ...prev, subcontractorId: subcontractorsList[0].id }))
                }
                setIsAssignModalOpen(true)
              }}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors text-xs font-semibold shadow-lg shadow-emerald-600/20"
            >
              <UserPlus className="w-4 h-4" />
              <span>Yeni İş Paketi & Taşeron Ata</span>
            </button>
            <button
              onClick={() => setIsUploadModalOpen(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors text-xs font-semibold border border-slate-700"
            >
              <Upload className="w-4 h-4" />
              <span>İlk Fotoğrafı Yükle</span>
            </button>
          </div>
        </div>
      )}

      {/* Work Proofs Cards List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {displayedProofs.map((proof) => {
          const isPending = proof.status === "PENDING"
          const isRegionalApproved = proof.status === "REGIONAL_APPROVED"
          const isHqApproved = proof.status === "HQ_APPROVED"
          const isRejected = proof.status === "REJECTED"

          const subMatch = subcontractorsList.find(
            (s) => s.id === proof.subcontractorId || s.name === proof.subcontractorId
          )
          const subDisplayName = subMatch?.name || proof.subcontractorId

          const dateStr = new Date(proof.createdAt).toLocaleDateString("tr-TR", {
            day: "numeric",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })

          return (
            <div
              key={proof.id}
              className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-xl space-y-4 p-5 flex flex-col justify-between"
            >
              <div className="space-y-4">
                {/* Header & Status */}
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1">
                      <Briefcase className="w-3 h-3" />
                      <span>{subDisplayName}</span>
                    </span>
                    <h3 className="text-base font-bold text-white mt-0.5">{proof.title}</h3>
                    <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>{dateStr}</span>
                    </div>
                  </div>

                  {/* Status Badge */}
                  <div>
                    {isPending && (
                      <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-950/70 border border-amber-800/80 text-amber-300 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>Bölge Onayı Bekliyor</span>
                      </span>
                    )}
                    {isRegionalApproved && (
                      <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-purple-950/70 border border-purple-800/80 text-purple-300 flex items-center gap-1">
                        <UserCheck className="w-3 h-3" />
                        <span>HQ Onayı Bekliyor</span>
                      </span>
                    )}
                    {isHqApproved && (
                      <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-950/70 border border-emerald-800/80 text-emerald-300 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Hakedişe Hazır</span>
                      </span>
                    )}
                    {isRejected && (
                      <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-red-950/70 border border-red-800/80 text-red-300 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" />
                        <span>Revizyon İsteniyor</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Proof Image Box or Placeholder */}
                {proof.photoUrl ? (
                  <div className="relative w-full h-52 rounded-xl overflow-hidden bg-slate-950 border border-slate-800 group">
                    <img
                      src={proof.photoUrl}
                      alt={proof.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent opacity-60"></div>
                    <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-center justify-between text-xs text-slate-300">
                      <span className="bg-slate-900/90 px-2 py-0.5 rounded border border-slate-800 text-[10px] font-mono">
                        Fotoğraflı Saha Kanıtı
                      </span>
                      <a
                        href={proof.photoUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1 rounded bg-slate-900/90 border border-slate-800 hover:text-white"
                        title="Büyük Görsel"
                      >
                        <ImageIcon className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>
                ) : (
                  <div className="w-full h-40 rounded-xl border border-dashed border-slate-800 bg-slate-950/60 flex flex-col items-center justify-center p-4 text-center space-y-2">
                    <div className="w-10 h-10 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-amber-400">
                      <Camera className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-xs font-semibold text-slate-300 block">
                        Taşeron İmalat Görseli Bekleniyor
                      </span>
                      <span className="text-[11px] text-slate-500">
                        İş paketi atandı. Taşeron sahada imalatı tamamlayıp fotoğraf yükleyecektir.
                      </span>
                    </div>
                    <button
                      onClick={() => {
                        setFormData((prev) => ({
                          ...prev,
                          title: proof.title,
                          subcontractorId: proof.subcontractorId,
                        }))
                        setIsUploadModalOpen(true)
                      }}
                      className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-amber-400 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>Fotoğraf Yükle</span>
                    </button>
                  </div>
                )}

                {/* STEPPER: Çift Kademeli Akış Çubuğu */}
                <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 space-y-2">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Onay ve Hakediş Kademesi (Workflow Stepper)
                  </div>

                  <div className="flex items-center justify-between text-xs relative">
                    {/* Step 1: Taşeron */}
                    <div className="flex flex-col items-center z-10">
                      <div className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-[11px] shadow-md shadow-blue-500/20">
                        <Check className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-[10px] font-medium text-slate-300 mt-1">Taşeron</span>
                      <span className="text-[9px] text-blue-400">Yüklendi</span>
                    </div>

                    <div
                      className={`flex-1 h-0.5 mx-2 ${
                        isRegionalApproved || isHqApproved ? "bg-purple-500" : "bg-slate-800"
                      }`}
                    ></div>

                    {/* Step 2: Bölge Müdürü */}
                    <div className="flex flex-col items-center z-10">
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-[11px] ${
                          isRegionalApproved || isHqApproved
                            ? "bg-purple-600 text-white shadow-md shadow-purple-500/20"
                            : isRejected
                            ? "bg-red-600 text-white"
                            : "bg-slate-800 text-slate-500"
                        }`}
                      >
                        {isRegionalApproved || isHqApproved ? (
                          <Check className="w-3.5 h-3.5" />
                        ) : isRejected ? (
                          <X className="w-3.5 h-3.5" />
                        ) : (
                          "2"
                        )}
                      </div>
                      <span className="text-[10px] font-medium text-slate-300 mt-1">Bölge Müdürü</span>
                      <span
                        className={`text-[9px] ${
                          isRegionalApproved || isHqApproved
                            ? "text-purple-400 font-semibold"
                            : isRejected
                            ? "text-red-400"
                            : "text-slate-500"
                        }`}
                      >
                        {isRegionalApproved || isHqApproved ? "Onayladı" : isRejected ? "Reddetti" : "Bekliyor"}
                      </span>
                    </div>

                    <div
                      className={`flex-1 h-0.5 mx-2 ${isHqApproved ? "bg-emerald-500" : "bg-slate-800"}`}
                    ></div>

                    {/* Step 3: HQ */}
                    <div className="flex flex-col items-center z-10">
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-[11px] ${
                          isHqApproved
                            ? "bg-emerald-600 text-white shadow-md shadow-emerald-500/20"
                            : "bg-slate-800 text-slate-500"
                        }`}
                      >
                        {isHqApproved ? <Check className="w-3.5 h-3.5" /> : "3"}
                      </div>
                      <span className="text-[10px] font-medium text-slate-300 mt-1">Genel Merkez</span>
                      <span
                        className={`text-[9px] ${
                          isHqApproved ? "text-emerald-400 font-semibold" : "text-slate-500"
                        }`}
                      >
                        {isHqApproved ? "Hakedişe Hazır" : "Sırada"}
                      </span>
                    </div>
                  </div>

                  {/* Notes Callout */}
                  {(proof.regionalNotes || proof.hqNotes) && (
                    <div className="pt-2 border-t border-slate-900 text-[11px] space-y-1">
                      {proof.regionalNotes && (
                        <div className="text-purple-300/90 bg-purple-950/30 p-2 rounded border border-purple-900/40">
                          <strong>Bölge Notu:</strong> {proof.regionalNotes}
                        </div>
                      )}
                      {proof.hqNotes && (
                        <div className="text-emerald-300/90 bg-emerald-950/30 p-2 rounded border border-emerald-900/40">
                          <strong>HQ Onay Notu:</strong> {proof.hqNotes}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons depending on Stage */}
              <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
                {/* Bölge Müdürü Onaylama Butonu */}
                {isPending && (
                  <div className="flex items-center gap-2 w-full">
                    <button
                      onClick={() => handleRegionalApprove(proof.id)}
                      disabled={actionLoadingId === proof.id}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow-md shadow-purple-600/20 transition-all"
                    >
                      {actionLoadingId === proof.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Check className="w-3.5 h-3.5" />
                      )}
                      <span>Bölge Müdürü Olarak Onayla</span>
                    </button>
                    <button
                      onClick={() => handleReject(proof.id)}
                      disabled={actionLoadingId === proof.id}
                      className="py-2 px-3 rounded-lg bg-slate-800 hover:bg-red-950 hover:text-red-300 text-slate-400 text-xs font-semibold border border-slate-700 hover:border-red-800 transition-all"
                    >
                      Reddet
                    </button>
                  </div>
                )}

                {/* HQ Onaylama Butonu */}
                {isRegionalApproved && (
                  <div className="flex items-center gap-2 w-full">
                    <button
                      onClick={() => handleHqApprove(proof.id)}
                      disabled={actionLoadingId === proof.id}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md shadow-emerald-600/20 transition-all"
                    >
                      {actionLoadingId === proof.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      )}
                      <span>Genel Merkez Onayı Ver (Hakedişe Hazır)</span>
                    </button>
                    <button
                      onClick={() => handleReject(proof.id)}
                      disabled={actionLoadingId === proof.id}
                      className="py-2 px-3 rounded-lg bg-slate-800 hover:bg-red-950 hover:text-red-300 text-slate-400 text-xs font-semibold border border-slate-700 hover:border-red-800 transition-all"
                    >
                      Revizyon İste
                    </button>
                  </div>
                )}

                {/* Tamamlandı Statüsü */}
                {isHqApproved && (
                  <div className="w-full flex items-center justify-between text-xs text-emerald-400 bg-emerald-950/40 p-2.5 rounded-lg border border-emerald-800/60 font-semibold">
                    <span className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4" />
                      Hakediş Tahakkukuna Hazırlandı
                    </span>
                    <span className="text-[10px] text-slate-400">Çift Onay Tamam</span>
                  </div>
                )}

                {isRejected && (
                  <div className="w-full flex items-center justify-between text-xs text-red-400 bg-red-950/40 p-2.5 rounded-lg border border-red-800/60 font-semibold">
                    <span className="flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4" />
                      Revizyon Talep Edildi
                    </span>
                    <button
                      onClick={() => handleUploadProof}
                      className="text-[11px] underline text-slate-300 hover:text-white"
                    >
                      Yeniden Yükle
                    </button>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* MODAL: Taşeron Fotoğraf & İş Kanıtı Yükleme Formu */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Camera className="w-5 h-5 text-amber-500" />
                <h3 className="text-base font-bold text-white">Taşeron İş Kanıtı Sunumu</h3>
              </div>
              <button
                onClick={() => setIsUploadModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded-lg bg-red-950/50 border border-red-800 text-xs text-red-300">
                {formError}
              </div>
            )}

            <form onSubmit={handleUploadProof} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Taşeron Firma Bilgisi
                </label>
                <input
                  type="text"
                  value={formData.subcontractorId}
                  onChange={(e) => setFormData({ ...formData, subcontractorId: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Yapılan İmalat / İş Başlığı <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Örn: Alçıpan Tavan Montajı & Ray Aydınlatma Hatları"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Kanıt Fotoğrafı URL'si <span className="text-rose-500">*</span>
                </label>
                <input
                  type="url"
                  placeholder="https://..."
                  value={formData.photoUrl}
                  onChange={(e) => setFormData({ ...formData, photoUrl: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                  required
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Şantiye sahasından çekilen güncel imalat görseli linki.
                </p>
              </div>

              {formData.photoUrl && (
                <div className="w-full h-36 rounded-lg overflow-hidden border border-slate-800 bg-slate-950">
                  <img
                    src={formData.photoUrl}
                    alt="Önizleme"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      ;(e.target as any).src =
                        "https://images.unsplash.com/photo-1541888946425-d0fbb186c5f7?q=80&w=800&auto=format&fit=crop"
                    }}
                  />
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsUploadModalOpen(false)}
                  className="px-4 py-2 text-xs text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
                >
                  Vazgeç
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold shadow-md shadow-amber-600/20 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Kaydediliyor...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-3.5 h-3.5" />
                      <span>Kanıtı İncelemeye Gönder</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 1: Yeni İş Paketi & Taşeron Ata (ADIM 3) */}
      {isAssignModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-emerald-400" />
                <h3 className="text-base font-bold text-white">Yeni İş Paketi & Taşeron Ata</h3>
              </div>
              <button
                onClick={() => setIsAssignModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {assignFormError && (
              <div className="p-3 rounded-lg bg-red-950/50 border border-red-800 text-xs text-red-300">
                {assignFormError}
              </div>
            )}

            <form onSubmit={handleAssignSubcontractor} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  İş Paketi / İmalat Başlığı <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Örn: Zemin Seramik Döşemesi"
                  value={assignFormData.title}
                  onChange={(e) => setAssignFormData({ ...assignFormData, title: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  required
                />

                {/* Hızlı Şablon Butonları */}
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {[
                    "Zemin Seramik Döşemesi",
                    "Alçıpan Asma Tavan & Boya",
                    "3 Fazlı Pano & Aydınlatma",
                    "VRF Havalandırma & İklimlendirme",
                    "Mağaza Vitrin & Alüminyum Doğrama",
                  ].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setAssignFormData({ ...assignFormData, title: preset })}
                      className="px-2 py-0.5 rounded text-[10px] bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white transition-colors"
                    >
                      + {preset}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Taşeron Seç <span className="text-rose-500">*</span>
                </label>
                <select
                  value={assignFormData.subcontractorId}
                  onChange={(e) =>
                    setAssignFormData({ ...assignFormData, subcontractorId: e.target.value })
                  }
                  className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                  required
                >
                  {subcontractorsList.length === 0 ? (
                    <option value="">Kayıtlı taşeron bulunamadı</option>
                  ) : (
                    subcontractorsList.map((sub) => (
                      <option key={sub.id} value={sub.id}>
                        {sub.name} — {sub.phone !== "-" ? sub.phone : sub.email}
                      </option>
                    ))
                  )}
                </select>
                <p className="text-[11px] text-slate-500 mt-1">
                  Sistemdeki rolü SUBCONTRACTOR olan kullanıcılar ve taşeron firmalar listelenir.
                </p>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Teknik Çizim / Örnek Görsel Linki (Opsiyonel)
                </label>
                <input
                  type="url"
                  placeholder="https://... (Taşeron sahada fotoğraf yükleyecektir)"
                  value={assignFormData.photoUrl}
                  onChange={(e) => setAssignFormData({ ...assignFormData, photoUrl: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-900/40 text-[11px] text-emerald-300/90 space-y-1">
                <strong>İş Akışı Bilgisi:</strong> İş paketi oluşturulduğunda <strong>PENDING</strong> statüsünde açılır ve atanan taşeronun ekranına düşer. Taşeron işi tamamlayıp fotoğraf yüklediğinde Bölge Müdürü onayına sunulur.
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAssignModalOpen(false)}
                  className="px-4 py-2 text-xs text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
                >
                  Vazgeç
                </button>
                <button
                  type="submit"
                  disabled={isAssignSubmitting}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md shadow-emerald-600/20 disabled:opacity-50"
                >
                  {isAssignSubmitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Kaydediliyor...</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-3.5 h-3.5" />
                      <span>İş Paketini Başlat & Taşeronu Görevlendir</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
