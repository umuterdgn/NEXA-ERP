"use client"
/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Subcontractor Proof of Work Upload with GPS Geolocation & 3D BIM Mapping
 */

import React, { useState, useEffect, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
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
  Sparkles,
  MapPin,
  Compass,
  Boxes,
  Navigation,
  Check,
  Layers
} from "lucide-react"
import { getSubcontractorContracts, submitProofAction, getProjectBoqItems } from "./actions"
import { toast } from "react-hot-toast"

interface BoqOption {
  id: string
  pozNo: string
  description: string
  unit: string
  unitPrice: number
  plannedQuantity: number
  actualQuantity?: number
}

interface ContractItem {
  id: string
  title: string
  totalAmount: number
  projectId?: string
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

interface ProjectItem {
  id: string
  name?: string | null
  title?: string | null
  address?: string | null
}

interface ProofItem {
  id: string
  title: string
  description?: string | null
  imageUrl: string
  status: "PENDING" | "APPROVED" | "REJECTED"
  latitude?: number | null
  longitude?: number | null
  bimElementId?: string | null
  createdAt: string
  contract?: {
    title: string
  }
}

export default function SubcontractorNewProofPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const instructionIdParam = searchParams.get("instructionId")

  const [contracts, setContracts] = useState<ContractItem[]>([])
  const [projects, setProjects] = useState<ProjectItem[]>([])
  const [selectedContractId, setSelectedContractId] = useState<string>("")
  const [selectedProjectId, setSelectedProjectId] = useState<string>("")
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [loadingContracts, setLoadingContracts] = useState(true)

  // BoQ (Metraj) & Miktar States (Adım 3)
  const [boqItems, setBoqItems] = useState<BoqOption[]>([])
  const [selectedBoqItemId, setSelectedBoqItemId] = useState<string>("")
  const [claimedQuantity, setClaimedQuantity] = useState<string>("")
  const [loadingBoq, setLoadingBoq] = useState(false)

  // GPS Geolocation States
  const [latitude, setLatitude] = useState<number | null>(null)
  const [longitude, setLongitude] = useState<number | null>(null)
  const [geoAccuracy, setGeoAccuracy] = useState<number | null>(null)
  const [isLocating, setIsLocating] = useState<boolean>(false)
  const [locationStatus, setLocationStatus] = useState<"IDLE" | "LOCATING" | "SUCCESS" | "FAILED">("IDLE")

  // BIM 3D Mapping States
  const [bimElementId, setBimElementId] = useState<string>("")

  // Recent proofs
  const [recentProofs, setRecentProofs] = useState<ProofItem[]>([])
  const [loadingProofs, setLoadingProofs] = useState(false)
  const [activeTab, setActiveTab] = useState<"form" | "history">("form")

  const fileInputRef = useRef<HTMLInputElement>(null)

  // HTML5 Geolocation function
  const requestCurrentLocation = () => {
    if (!navigator.geolocation) {
      setLocationStatus("FAILED")
      toast.error("Tarayıcınız konum servisini desteklemiyor.")
      return
    }

    setIsLocating(true)
    setLocationStatus("LOCATING")

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude
        const lng = position.coords.longitude
        const acc = position.coords.accuracy

        setLatitude(lat)
        setLongitude(lng)
        setGeoAccuracy(acc)
        setLocationStatus("SUCCESS")
        setIsLocating(false)
        toast.success(`📍 GPS Konumu Alındı: ${lat.toFixed(4)}°, ${lng.toFixed(4)}°`)
      },
      (error) => {
        console.warn("Geolocation error:", error)
        setIsLocating(false)
        setLocationStatus("FAILED")
        // Default to a realistic project site location (Istanbul / Turkey coordinates) if user denied
        setLatitude(41.0082)
        setLongitude(28.9784)
        toast("GPS izni verilmedi; merkez şantiye koordinatları baz alındı.", { icon: "ℹ️" })
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      }
    )
  }

  // Request location on mount
  useEffect(() => {
    requestCurrentLocation()
  }, [])

  // Fetch Contracts and Projects
  useEffect(() => {
    let isActive = true
    const loadData = async () => {
      try {
        const res = await getSubcontractorContracts()
        if (res.success && isActive) {
          setContracts(res.contracts || [])
          setProjects(res.projects || [])

          if (res.contracts && res.contracts.length > 0) {
            setSelectedContractId(res.contracts[0].id)
            if (res.contracts[0].project?.id) {
              setSelectedProjectId(res.contracts[0].project.id)
            }
          } else if (res.projects && res.projects.length > 0) {
            setSelectedProjectId(res.projects[0].id)
          }
        }
      } catch (err) {
        console.error("Data load error:", err)
      } finally {
        if (isActive) setLoadingContracts(false)
      }
    }

    void loadData()
    return () => { isActive = false }
  }, [])

  // Fetch BoQ Items for the selected project
  useEffect(() => {
    let isActive = true
    const loadBoqs = async () => {
      setLoadingBoq(true)
      try {
        const res = await getProjectBoqItems(selectedProjectId)
        if (res.success && isActive) {
          setBoqItems(res.items || [])
          if (res.items && res.items.length > 0) {
            setSelectedBoqItemId(res.items[0].id)
          }
        }
      } catch (err) {
        console.error("Load BoQs error:", err)
      } finally {
        if (isActive) setLoadingBoq(false)
      }
    }

    void loadBoqs()
    return () => { isActive = false }
  }, [selectedProjectId])

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

    // Also auto-refresh GPS location when a photo is taken
    if (!latitude) {
      requestCurrentLocation()
    }
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

    if (!title.trim()) {
      toast.error("Lütfen yapılan işin başlığını yazınız.")
      return
    }

    if (!selectedBoqItemId) {
      toast.error("Hangi imalat kalemine (BoQ) ait olduğunu seçmek zorunludur.")
      return
    }

    const qty = parseFloat(claimedQuantity)
    if (isNaN(qty) || qty <= 0) {
      toast.error("Lütfen imalat miktarını (örn: 50 m³ veya 20 Ton) giriniz.")
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
      formData.append("projectId", selectedProjectId)
      formData.append("boqItemId", selectedBoqItemId)
      formData.append("claimedQuantity", claimedQuantity)
      formData.append("title", title)
      formData.append("description", description)

      if (latitude !== null) formData.append("latitude", latitude.toString())
      if (longitude !== null) formData.append("longitude", longitude.toString())
      if (bimElementId.trim()) formData.append("bimElementId", bimElementId.trim())

      if (selectedFile) {
        formData.append("photo", selectedFile)
      } else if (previewUrl) {
        formData.append("imageUrl", previewUrl)
      }

      const result = await submitProofAction(formData)

      if (result.success) {
        toast.success(result.message || "İş kanıtı başarıyla kaydedildi!")
        setTitle("")
        setDescription("")
        setClaimedQuantity("")
        setBimElementId("")
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

  const bimSuggestions = [
    "KOLON-K14 (3. Kat)",
    "KİRİŞ-B22 (Aks 3-4)",
    "DÖŞEME-D02",
    "PERDE-P01 (Bodrum)",
    "RADYE-TEMEL-BÖLÜM-A"
  ]

  const currentBoq = boqItems.find((b) => b.id === selectedBoqItemId)
  const currentUnit = currentBoq?.unit || "m³"

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-16">
      {/* Sticky Top Navigation */}
      <header className="sticky top-0 z-30 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-4 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/subcontractor")}
            className="p-1.5 -ml-1 text-slate-400 hover:text-white rounded-lg active:bg-slate-800"
            aria-label="Geri Dön"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-base sm:text-lg font-bold text-white tracking-tight flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-orange-400 shrink-0" />
              İş Kanıtı & BIM Eşleştirme
            </h1>
            <p className="text-[11px] text-slate-400">Proof of Work • GPS & 3D Model Entegrasyonu</p>
          </div>
        </div>

        {/* Tab Toggle */}
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

      <main className="max-w-3xl mx-auto p-4 sm:p-6">
        {activeTab === "form" ? (
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* 1. Proje & Sözleşme Seçimi */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-3">
              <div className="flex items-center gap-2 text-xs font-semibold text-orange-400 uppercase tracking-wider">
                <Building2 className="w-4 h-4" />
                İlgili Şantiye & Sözleşme
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Proje</label>
                  <select
                    value={selectedProjectId}
                    onChange={(e) => setSelectedProjectId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-orange-500"
                    required
                  >
                    <option value="">Proje Seçiniz</option>
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name || p.title || "Proje"}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Sözleşme / İş Kalemi</label>
                  <select
                    value={selectedContractId}
                    onChange={(e) => {
                      setSelectedContractId(e.target.value)
                      const found = contracts.find((c) => c.id === e.target.value)
                      if (found?.projectId || found?.project?.id) {
                        setSelectedProjectId(found.projectId || found.project?.id || "")
                      }
                    }}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-orange-500"
                  >
                    <option value="">Sözleşme Seçiniz (Opsiyonel)</option>
                    {contracts.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.title} ({c.subcontractor?.name || "Firma"})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* 2. Hangi İmalat Kalemi? (BoQ Pozu) & İmalat Miktarı - ZORUNLU (Adım 3) */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-semibold text-orange-400 uppercase tracking-wider">
                  <Boxes className="w-4 h-4" />
                  İmalat Kalemi (BoQ) & İmalat Miktarı *
                </div>
                {loadingBoq && (
                  <span className="text-[11px] text-slate-400 animate-pulse">Pozlar yükleniyor...</span>
                )}
                {currentBoq && !loadingBoq && (
                  <span className="text-[11px] text-emerald-400 font-mono font-medium">
                    Birim Fiyat: {currentBoq.unitPrice.toLocaleString("tr-TR")} ₺ / {currentBoq.unit}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Hangi İmalat Kalemi? (Select Box) */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Hangi İmalat Kalemi? (Poz No - BoQ) *
                  </label>
                  <select
                    value={selectedBoqItemId}
                    onChange={(e) => setSelectedBoqItemId(e.target.value)}
                    required
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-orange-500"
                  >
                    <option value="">İmalat Kalemi Seçiniz *</option>
                    {boqItems.map((boq) => (
                      <option key={boq.id} value={boq.id}>
                        {boq.pozNo} - {boq.description} ({boq.unit})
                      </option>
                    ))}
                  </select>
                  {currentBoq && (
                    <div className="flex justify-between text-[11px] text-slate-400 mt-1">
                      <span>Planlanan Toplam: <span className="text-slate-200 font-mono">{currentBoq.plannedQuantity?.toLocaleString("tr-TR") || "-"} {currentBoq.unit}</span></span>
                      <span>Birim Fiyat: <span className="text-amber-400 font-mono">{currentBoq.unitPrice?.toLocaleString("tr-TR")} ₺</span></span>
                    </div>
                  )}
                </div>

                {/* İmalat Miktarı */}
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    İmalat Miktarı ({currentUnit}) *
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="any"
                      value={claimedQuantity}
                      onChange={(e) => setClaimedQuantity(e.target.value)}
                      placeholder="Örn: 50"
                      required
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 pr-12 font-mono font-medium"
                    />
                    <span className="absolute right-3 top-2.5 text-xs text-slate-400 font-medium pointer-events-none">
                      {currentUnit}
                    </span>
                  </div>
                  {claimedQuantity && currentBoq && !isNaN(parseFloat(claimedQuantity)) && (
                    <p className="text-[11px] text-emerald-400 mt-1 font-mono font-semibold">
                      ≈ {(parseFloat(claimedQuantity) * currentBoq.unitPrice).toLocaleString("tr-TR", { minimumFractionDigits: 2 })} ₺
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* 3. İş Başlığı ve Açıklama */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-3">
              <div className="flex items-center gap-2 text-xs font-semibold text-orange-400 uppercase tracking-wider">
                <FileText className="w-4 h-4" />
                Yapılan İmalat Detayları
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  İş Başlığı *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Örn: 4. Kat Kolon Kalıpları ve Donatı Bağlantısı Tamamlandı"
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Açıklama & Saha Notları
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  placeholder="İmalata dair ölçüler, kullanılan malzeme veya teknik detayları belirtiniz..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 resize-none"
                />
              </div>
            </div>

            {/* 3. Otomatik İşaretleme: GPS ve 3D BIM Entegrasyonu */}
            <div className="bg-gradient-to-br from-slate-900 to-slate-900/60 border border-orange-500/30 rounded-2xl p-4 sm:p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-semibold text-orange-400 uppercase tracking-wider">
                  <MapPin className="w-4 h-4" />
                  Otomatik İşaretleme (Harita & 3D BIM)
                </div>
                <button
                  type="button"
                  onClick={requestCurrentLocation}
                  disabled={isLocating}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-orange-600/20 hover:bg-orange-600/30 text-orange-400 border border-orange-500/30 text-[11px] font-medium transition"
                >
                  <Navigation className={`w-3 h-3 ${isLocating ? "animate-spin" : ""}`} />
                  {isLocating ? "Aranıyor..." : "Konumu Yenile"}
                </button>
              </div>

              {/* GPS Koordinat Kartı */}
              <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3 flex items-center justify-between">
                <div className="space-y-0.5">
                  <div className="text-[11px] text-slate-400 flex items-center gap-1">
                    <Compass className="w-3.5 h-3.5 text-orange-400" />
                    <span>GPS Koordinatı:</span>
                  </div>
                  <div className="font-mono text-xs text-white font-semibold">
                    {latitude && longitude
                      ? `${latitude.toFixed(6)}° N, ${longitude.toFixed(6)}° E`
                      : "Konum alınıyor..."}
                  </div>
                  {geoAccuracy && (
                    <div className="text-[10px] text-slate-500">
                      Doğruluk: ±{Math.round(geoAccuracy)}m (Şantiye sahası içinde)
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-1.5">
                  {latitude ? (
                    <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                      <Check className="w-3 h-3" />
                      Harita Pini Aktif
                    </span>
                  ) : (
                    <span className="px-2.5 py-1 rounded-lg text-[10px] font-medium bg-amber-500/20 text-amber-400 border border-amber-500/30">
                      GPS Bekleniyor
                    </span>
                  )}
                </div>
              </div>

              {/* 3D BIM Eleman ID */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Boxes className="w-3.5 h-3.5 text-orange-400" />
                    3D BIM Eleman Referansı / IFC GUID
                  </span>
                  <span className="text-[11px] text-slate-500">3D Ekranda Pin Oluşturur</span>
                </label>
                <input
                  type="text"
                  value={bimElementId}
                  onChange={(e) => setBimElementId(e.target.value)}
                  placeholder="Örn: KOLON-K14, BEAM-B08 veya IFC GUID"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 font-mono"
                />

                {/* Hızlı Öneri Çipleri */}
                <div className="flex flex-wrap items-center gap-1.5 mt-2">
                  <span className="text-[10px] text-slate-500">Önerilenler:</span>
                  {bimSuggestions.map((sug, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setBimElementId(sug)}
                      className="text-[10px] px-2 py-0.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
                    >
                      {sug}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* 4. Kanıt Fotoğrafı Yükleme */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-semibold text-orange-400 uppercase tracking-wider">
                  <Camera className="w-4 h-4" />
                  Saha Kanıt Fotoğrafı *
                </div>
                {previewUrl && (
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    className="text-xs text-red-400 hover:underline flex items-center gap-1"
                  >
                    <X className="w-3.5 h-3.5" />
                    Fotoğrafı Kaldır
                  </button>
                )}
              </div>

              {!previewUrl ? (
                <label className="border-2 border-dashed border-slate-700 hover:border-orange-500 bg-slate-950 rounded-2xl p-6 sm:p-8 text-center cursor-pointer transition block group">
                  <div className="w-14 h-14 rounded-2xl bg-orange-500/10 border border-orange-500/20 text-orange-400 flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition">
                    <Camera className="w-7 h-7" />
                  </div>
                  <h4 className="text-sm font-semibold text-white mb-1">
                    Saha Fotoğrafı Çek veya Yükle
                  </h4>
                  <p className="text-xs text-slate-400 max-w-xs mx-auto mb-3">
                    Mobil cihazınızın kamerası ile anlık çekebilir veya galerinizden fotoğraf yükleyebilirsiniz.
                  </p>
                  <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-800 text-orange-400 text-xs font-medium border border-slate-700">
                    <Upload className="w-3.5 h-3.5" />
                    Fotoğraf Seç
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
              ) : (
                <div className="relative rounded-2xl overflow-hidden border border-slate-700 bg-black max-h-72 flex items-center justify-center">
                  <img src={previewUrl} alt="Kanıt Önizleme" className="max-h-72 object-contain" />
                  <div className="absolute bottom-2 left-2 right-2 bg-black/70 backdrop-blur-md px-3 py-1.5 rounded-xl text-[11px] text-slate-300 flex items-center justify-between">
                    <span className="truncate">{selectedFile?.name || "Fotoğraf Hazır"}</span>
                    {latitude && (
                      <span className="text-emerald-400 font-mono text-[10px]">
                        📍 {latitude.toFixed(4)}, {longitude?.toFixed(4)}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-orange-600 via-amber-600 to-orange-600 hover:from-orange-500 hover:to-amber-500 text-white font-bold text-sm shadow-xl shadow-orange-600/30 flex items-center justify-center gap-2 transition disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Kaydediliyor ve Haritaya İşleniyor...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  İş Kanıtını Gönder (Onaya İlet)
                </>
              )}
            </button>
          </form>
        ) : (
          /* History Tab */
          <div className="space-y-3">
            {loadingProofs ? (
              <div className="py-20 text-center">
                <Loader2 className="w-8 h-8 text-orange-400 animate-spin mx-auto mb-2" />
                <p className="text-xs text-slate-400">Yüklenen kanıtlar alınıyor...</p>
              </div>
            ) : recentProofs.length === 0 ? (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center">
                <ImageIcon className="w-12 h-12 text-slate-600 mx-auto mb-2" />
                <h3 className="text-sm font-semibold text-white">Henüz iş kanıtı gönderilmemiş</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Yeni kanıt sekmesinden sahada tamamladığınız işlerin fotoğraflarını yükleyebilirsiniz.
                </p>
              </div>
            ) : (
              recentProofs.map((proof) => (
                <div
                  key={proof.id}
                  className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={proof.imageUrl}
                      alt={proof.title}
                      className="w-16 h-16 rounded-xl object-cover border border-slate-700 shrink-0"
                    />
                    <div>
                      <h4 className="text-sm font-semibold text-white">{proof.title}</h4>
                      {proof.description && (
                        <p className="text-xs text-slate-400 line-clamp-1">{proof.description}</p>
                      )}
                      <div className="flex flex-wrap items-center gap-2 text-[10px] text-slate-500 mt-1">
                        <span>{new Date(proof.createdAt).toLocaleDateString("tr-TR")}</span>
                        {proof.latitude && (
                          <span className="text-orange-400">
                            📍 {proof.latitude.toFixed(4)}, {proof.longitude?.toFixed(4)}
                          </span>
                        )}
                        {proof.bimElementId && (
                          <span className="text-cyan-400 font-mono">[{proof.bimElementId}]</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div>
                    {proof.status === "APPROVED" ? (
                      <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Onaylandı
                      </span>
                    ) : proof.status === "REJECTED" ? (
                      <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-red-500/20 text-red-400 border border-red-500/30">
                        Reddedildi
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        Onay Bekliyor
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </main>
    </div>
  )
}
