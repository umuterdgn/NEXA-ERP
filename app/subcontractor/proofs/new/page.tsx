"use client"
/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Mobile-First Subcontractor Proof of Work Upload Page
 */

import React, { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { 
  Camera, 
  Upload, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Building2, 
  FileText, 
  Image as ImageIcon, 
  X, 
  Loader2, 
  ChevronRight,
  ShieldCheck,
  Send,
  ArrowLeft,
  Sparkles
} from "lucide-react"
import { getSubcontractorContracts, submitProofAction } from "./actions"
import { toast } from "react-hot-toast"

interface ContractItem {
  id: string
  title: string
  totalAmount: number
  project?: {
    id: string
    name?: string | null
    title?: string | null
  } | null
  subcontractor?: {
    id: string
    name: string
  } | null
}

interface ProofItem {
  id: string
  title: string
  description?: string | null
  imageUrl: string
  status: "PENDING" | "APPROVED" | "REJECTED"
  createdAt: string
  contract?: {
    title: string
  }
}

export default function SubcontractorNewProofPage() {
  const router = useRouter()
  const [contracts, setContracts] = useState<ContractItem[]>([])
  const [selectedContractId, setSelectedContractId] = useState<string>("")
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [loadingContracts, setLoadingContracts] = useState(true)

  // Recent proofs submitted by subcontractor
  const [recentProofs, setRecentProofs] = useState<ProofItem[]>([])
  const [loadingProofs, setLoadingProofs] = useState(false)
  const [activeTab, setActiveTab] = useState<"form" | "history">("form")

  const fileInputRef = useRef<HTMLInputElement>(null)

  // Fetch Contracts
  useEffect(() => {
    let isActive = true
    const loadContracts = async () => {
      try {
        const res = await getSubcontractorContracts()
        if (res.success && isActive) {
          setContracts(res.contracts || [])
          if (res.contracts && res.contracts.length > 0) {
            setSelectedContractId(res.contracts[0].id)
          }
        }
      } catch (err) {
        console.error("Contracts load error:", err)
      } finally {
        if (isActive) setLoadingContracts(false)
      }
    }

    void loadContracts()
    return () => { isActive = false }
  }, [])

  // Fetch Recent Proofs
  const fetchRecentProofs = async () => {
    setLoadingProofs(true)
    try {
      const res = await fetch("/api/subcontractor/proofs")
      if (res.ok) {
        const data = await res.json()
        setRecentProofs(data.proofs || [])
      }
    } catch (err) {
      console.error("Fetch proofs error:", err)
    } finally {
      setLoadingProofs(false)
    }
  }

  useEffect(() => {
    void fetchRecentProofs()
  }, [])

  // Handle File Selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith("image/")) {
      toast.error("Lütfen bir görsel dosyası seçiniz.")
      return
    }

    setSelectedFile(file)
    const localUrl = URL.createObjectURL(file)
    setPreviewUrl(localUrl)
  }

  const handleRemoveImage = () => {
    setSelectedFile(null)
    if (previewUrl && previewUrl.startsWith("blob:")) {
      URL.revokeObjectURL(previewUrl)
    }
    setPreviewUrl(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  // Handle Form Submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedContractId) {
      toast.error("Lütfen ilgili sözleşmeyi seçiniz.")
      return
    }

    if (!title.trim()) {
      toast.error("Lütfen yapılan işin başlığını yazınız.")
      return
    }

    if (!selectedFile && !previewUrl) {
      toast.error("Lütfen yapılan işe ait bir kanıt fotoğrafı yükleyiniz.")
      return
    }

    setIsSubmitting(true)

    try {
      const formData = new FormData()
      formData.append("contractId", selectedContractId)
      formData.append("title", title)
      formData.append("description", description)

      if (selectedFile) {
        formData.append("photo", selectedFile)
      } else if (previewUrl) {
        formData.append("imageUrl", previewUrl)
      }

      const result = await submitProofAction(formData)

      if (result.success) {
        toast.success("İş bitimi kanıtı başarıyla yüklendi! Şantiye şefinin onayına sunuldu.")
        setTitle("")
        setDescription("")
        handleRemoveImage()
        fetchRecentProofs()
        setActiveTab("history")
      } else {
        toast.error(result.error || "Kanıt kaydedilemedi.")
      }
    } catch (err) {
      console.error("Submit error:", err)
      toast.error("İşlem sırasında beklenmedik bir hata oluştu.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const selectedContract = contracts.find(c => c.id === selectedContractId)

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-16">
      {/* Mobile-Friendly Sticky Top Navigation */}
      <header className="sticky top-0 z-30 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-4 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="p-1.5 -ml-1 text-slate-400 hover:text-white rounded-lg active:bg-slate-800"
            aria-label="Geri Dön"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-base sm:text-lg font-bold text-white tracking-tight flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-orange-400 shrink-0" />
              İş Kanıtı Yükle
            </h1>
            <p className="text-[11px] text-slate-400">Proof of Work • Hakediş Doğrulama</p>
          </div>
        </div>

        {/* Tab Toggle (Form / Geçmiş) */}
        <div className="flex items-center bg-slate-800 p-0.5 rounded-xl border border-slate-700/80 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab("form")}
            className={`px-3 py-1.5 rounded-lg transition ${
              activeTab === "form"
                ? "bg-orange-600 text-white shadow-md shadow-orange-600/30"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Yeni Kanıt
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("history")}
            className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1 ${
              activeTab === "history"
                ? "bg-orange-600 text-white shadow-md shadow-orange-600/30"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <span>Gönderilenler</span>
            {recentProofs.length > 0 && (
              <span className="w-4 h-4 rounded-full bg-slate-900 text-[10px] flex items-center justify-center font-bold">
                {recentProofs.length}
              </span>
            )}
          </button>
        </div>
      </header>

      <main className="max-w-xl mx-auto px-4 pt-5">
        {activeTab === "form" ? (
          /* Mobile-First Upload Form */
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Informational Guidance Banner */}
            <div className="p-3.5 rounded-2xl bg-gradient-to-r from-orange-950/40 via-amber-950/20 to-slate-900 border border-orange-500/25 flex items-start gap-3 text-xs">
              <Sparkles className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />
              <div className="text-slate-300">
                <p className="font-semibold text-white mb-0.5">Şeffaf Hakediş Güvencesi</p>
                <p className="text-slate-400 leading-relaxed">
                  Sahada tamamladığınız imalatın fotoğrafını yükleyin. Şantiye şefi onayladığında hakediş tutarınıza otomatik işlenecektir.
                </p>
              </div>
            </div>

            {/* 1. Sözleşme Seç (Contract Select) */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg">
              <label className="block text-xs font-bold text-slate-300 mb-2 uppercase tracking-wider flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-orange-400" />
                1. İlgili Sözleşme & Şantiye
              </label>

              {loadingContracts ? (
                <div className="py-3 flex items-center gap-2 text-xs text-slate-400">
                  <Loader2 className="w-4 h-4 animate-spin text-orange-400" />
                  Sözleşmeler yükleniyor...
                </div>
              ) : contracts.length === 0 ? (
                <div className="text-xs text-amber-400 bg-amber-500/10 p-3 rounded-xl border border-amber-500/20">
                  Kayıtlı aktif sözleşme bulunamadı. Lütfen ana yüklenici ile iletişime geçiniz.
                </div>
              ) : (
                <div className="space-y-2">
                  <select
                    value={selectedContractId}
                    onChange={(e) => setSelectedContractId(e.target.value)}
                    required
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-3 text-sm font-semibold text-white focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition cursor-pointer"
                  >
                    {contracts.map((c) => (
                      <option key={c.id} value={c.id} className="bg-slate-900 text-white">
                        {c.title} • {c.subcontractor?.name}
                      </option>
                    ))}
                  </select>

                  {selectedContract && (
                    <div className="flex items-center justify-between text-[11px] px-1 text-slate-400">
                      <span>Proje: <strong className="text-slate-200">{selectedContract.project?.title || selectedContract.project?.name || "Şantiye"}</strong></span>
                      <span>Taşeron: <strong className="text-orange-400">{selectedContract.subcontractor?.name}</strong></span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* 2. İş Başlığı (Job Title) */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg">
              <label className="block text-xs font-bold text-slate-300 mb-2 uppercase tracking-wider flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-orange-400" />
                2. Yapılan İşin Başlığı
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Örn: 1. Kat Kolon Kalıpları Döküm Öncesi"
                required
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition"
              />
              <p className="text-[11px] text-slate-500 mt-1.5">
                Şantiye şefinin kolayca ayırt edebileceği kısa ve net bir başlık giriniz.
              </p>
            </div>

            {/* 3. Açıklama (Description) */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg">
              <label className="block text-xs font-bold text-slate-300 mb-2 uppercase tracking-wider">
                3. Detaylı Açıklama (Opsiyonel)
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Örn: A Blok K1-K8 arası kolonların paspayları ve takviyeleri tamamlandı. İmalat projeye uygundur."
                rows={3}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition resize-none"
              />
            </div>

            {/* 4. Fotoğraf Yükle (Image Upload / Camera Trigger) */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg">
              <label className="block text-xs font-bold text-slate-300 mb-2 uppercase tracking-wider flex items-center gap-1.5">
                <Camera className="w-4 h-4 text-orange-400" />
                4. Fotoğraf Kanıtı (Saha Fotoğrafı)
              </label>

              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                capture="environment"
                onChange={handleFileChange}
                className="hidden"
              />

              {!previewUrl ? (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full border-2 border-dashed border-slate-700 hover:border-orange-500/80 bg-slate-800/40 hover:bg-slate-800/70 rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer transition group"
                >
                  <div className="w-14 h-14 rounded-2xl bg-orange-500/10 group-hover:bg-orange-500/20 text-orange-400 flex items-center justify-center mb-3 transition shadow-inner">
                    <Camera className="w-7 h-7" />
                  </div>
                  <span className="text-sm font-semibold text-white mb-1">
                    Fotoğraf Çek veya Galeriden Seç
                  </span>
                  <span className="text-xs text-slate-400 text-center max-w-xs">
                    Akıllı telefonunuzun kamerasını açarak sahadan doğrudan fotoğraf çekebilirsiniz.
                  </span>
                </div>
              ) : (
                <div className="relative rounded-2xl overflow-hidden border border-slate-700 bg-slate-950">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={previewUrl}
                    alt="Kanıt Önizleme"
                    className="w-full max-h-80 object-cover"
                  />
                  <div className="absolute top-3 right-3 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3 py-1.5 bg-black/70 hover:bg-black/90 backdrop-blur-md text-white text-xs font-medium rounded-xl border border-white/20 transition flex items-center gap-1.5"
                    >
                      <Camera className="w-3.5 h-3.5" /> Değiştir
                    </button>
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      className="p-1.5 bg-red-600/80 hover:bg-red-600 text-white rounded-xl backdrop-blur-md transition"
                      title="Kaldır"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="p-2.5 bg-slate-900/90 text-xs text-slate-300 flex items-center justify-between border-t border-slate-800">
                    <span className="truncate max-w-[200px]">
                      {selectedFile ? selectedFile.name : "Görsel Seçildi"}
                    </span>
                    <span className="text-emerald-400 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Hazır
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Submit Action Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting || !selectedContractId || (!selectedFile && !previewUrl)}
                className="w-full py-4 px-6 bg-gradient-to-r from-orange-600 via-amber-600 to-orange-500 hover:from-orange-500 hover:to-amber-500 text-white font-bold rounded-2xl transition shadow-xl shadow-orange-600/25 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-base active:scale-[0.99]"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Kanıt Gönderiliyor...
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    Kanıtı Gönder ve Onaya Sun
                  </>
                )}
              </button>
              <p className="text-[11px] text-center text-slate-500 mt-2">
                Gönderilen kanıtlar Şantiye Şefi tarafından denetlenerek hakedişe onaylanır.
              </p>
            </div>
          </form>
        ) : (
          /* Subcontractor's History Tab */
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                Yüklediğim Kanıtlar ({recentProofs.length})
              </h2>
              <button
                onClick={fetchRecentProofs}
                disabled={loadingProofs}
                className="text-xs text-orange-400 hover:text-orange-300 font-medium"
              >
                {loadingProofs ? "Yenileniyor..." : "Yenile"}
              </button>
            </div>

            {loadingProofs ? (
              <div className="py-12 text-center text-slate-400 flex flex-col items-center justify-center gap-2">
                <Loader2 className="w-6 h-6 animate-spin text-orange-400" />
                <span className="text-xs">Kayıtlar yükleniyor...</span>
              </div>
            ) : recentProofs.length === 0 ? (
              <div className="py-16 text-center text-slate-500 bg-slate-900 border border-slate-800 rounded-2xl p-6">
                <ImageIcon className="w-10 h-10 mx-auto text-slate-600 mb-2" />
                <p className="text-sm font-semibold text-white mb-1">Henüz Kanıt Yüklenmedi</p>
                <p className="text-xs text-slate-400 mb-4 max-w-xs mx-auto">
                  İlk iş bitimi kanıtınızı oluşturmak için "Yeni Kanıt" sekmesine geçiniz.
                </p>
                <button
                  onClick={() => setActiveTab("form")}
                  className="px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded-xl text-xs font-semibold"
                >
                  Yeni Kanıt Yükle
                </button>
              </div>
            ) : (
              recentProofs.map((proof) => {
                const isPending = proof.status === "PENDING"
                const isApproved = proof.status === "APPROVED"
                const isRejected = proof.status === "REJECTED"

                return (
                  <div
                    key={proof.id}
                    className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg flex flex-col sm:flex-row gap-3.5 p-3.5"
                  >
                    {/* Thumbnail Image */}
                    <div className="w-full sm:w-28 h-40 sm:h-28 rounded-xl overflow-hidden bg-slate-950 shrink-0 border border-slate-800">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={proof.imageUrl}
                        alt={proof.title}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    {/* Content */}
                    <div className="flex-1 flex flex-col justify-between">
                      <div>
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <h3 className="font-bold text-white text-sm leading-snug">
                            {proof.title}
                          </h3>
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold shrink-0 flex items-center gap-1 ${
                              isApproved
                                ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                                : isRejected
                                ? "bg-red-500/15 text-red-400 border border-red-500/30"
                                : "bg-amber-500/15 text-amber-400 border border-amber-500/30"
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                isApproved
                                  ? "bg-emerald-400"
                                  : isRejected
                                  ? "bg-red-400"
                                  : "bg-amber-400 animate-pulse"
                              }`}
                            />
                            {isApproved ? "Onaylandı" : isRejected ? "Reddedildi" : "Onay Bekliyor"}
                          </span>
                        </div>

                        {proof.contract && (
                          <p className="text-xs text-orange-400 font-medium mb-1">
                            {proof.contract.title}
                          </p>
                        )}

                        {proof.description && (
                          <p className="text-xs text-slate-400 line-clamp-2 mb-2">
                            {proof.description}
                          </p>
                        )}
                      </div>

                      <div className="text-[11px] text-slate-500 flex items-center gap-1 pt-1 border-t border-slate-800/80">
                        <Clock className="w-3 h-3" />
                        <span>{new Date(proof.createdAt).toLocaleString("tr-TR")}</span>
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        )}
      </main>
    </div>
  )
}
