"use client"
/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Saha Kamerası & İlerleme Ataşmanları (/personnel/camera)
 */

import { useState, useEffect } from "react"
import {
  Camera,
  MapPin,
  Upload,
  CheckCircle2,
  AlertCircle,
  Building2,
  Layers,
  Calendar,
  Image as ImageIcon,
  Loader2,
  RefreshCw,
  Compass,
  Eye,
} from "lucide-react"

interface AttachmentItem {
  id: string
  photoUrl: string
  description: string | null
  latitude: number | null
  longitude: number | null
  createdAt: string
  project: {
    name: string
  }
}

export default function PersonnelCameraPage() {
  const [projects, setProjects] = useState<Array<{ id: string; name: string }>>([])
  const [selectedProjectId, setSelectedProjectId] = useState("")
  const [stageGates, setStageGates] = useState<Array<{ id: string; stageName: string }>>([])
  const [selectedGateId, setSelectedGateId] = useState("")

  const [description, setDescription] = useState("")
  const [previewImage, setPreviewImage] = useState<string | null>(null)
  const [coords, setCoords] = useState<{ lat: number; lng: number; accuracy?: number } | null>(null)
  const [gettingLocation, setGettingLocation] = useState(false)
  const [loading, setLoading] = useState(false)
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; msg: string } | null>(null)

  const [recentAttachments, setRecentAttachments] = useState<AttachmentItem[]>([])
  const [lightboxImg, setLightboxImg] = useState<string | null>(null)

  // Fetch projects
  useEffect(() => {
    fetch("/api/projects")
      .then((res) => res.json())
      .then((data) => {
        if (data.projects) {
          setProjects(data.projects)
          if (data.projects.length > 0) {
            setSelectedProjectId(data.projects[0].id)
          }
        }
      })
      .catch((err) => console.error(err))

    // Acquire GPS position automatically on mount
    acquireGPS()
  }, [])

  // When project changes, fetch its StageGates and recent attachments
  useEffect(() => {
    if (selectedProjectId) {
      fetch(`/api/franchise/stage-gates?projectId=${selectedProjectId}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.stageGates) {
            setStageGates(data.stageGates)
          }
        })
        .catch(() => setStageGates([]))

      fetchAttachments()
    }
  }, [selectedProjectId])

  const fetchAttachments = () => {
    if (!selectedProjectId) return
    fetch(`/api/personnel/camera?projectId=${selectedProjectId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.attachments) {
          setRecentAttachments(data.attachments)
        }
      })
      .catch((err) => console.error(err))
  }

  // HTML5 Geolocation Capture
  const acquireGPS = () => {
    if ("geolocation" in navigator) {
      setGettingLocation(true)
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setCoords({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            accuracy: Math.round(pos.coords.accuracy),
          })
          setGettingLocation(false)
        },
        (err) => {
          console.warn("GPS hatası:", err.message)
          setGettingLocation(false)
        },
        { enableHighAccuracy: true, timeout: 8000 }
      )
    }
  }

  // Handle Camera Capture file input
  const handleCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Re-acquire GPS on capture to get freshest position
    acquireGPS()

    const reader = new FileReader()
    reader.onloadend = () => {
      setPreviewImage(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  // Submit Progress Attachment
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFeedback(null)

    if (!selectedProjectId) {
      setFeedback({ type: "error", msg: "Lütfen bir proje/şantiye seçiniz." })
      return
    }

    if (!previewImage) {
      setFeedback({ type: "error", msg: "Lütfen kameradan veya galeriden bir fotoğraf çekiniz." })
      return
    }

    try {
      setLoading(true)
      const res = await fetch("/api/personnel/camera", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: selectedProjectId,
          photoUrl: previewImage,
          description: description || null,
          latitude: coords?.lat || null,
          longitude: coords?.lng || null,
          stageGateId: selectedGateId || null,
        }),
      })

      const data = await res.json()
      if (res.ok) {
        setFeedback({
          type: "success",
          msg: "İlerleme kanıt fotoğrafı GPS koordinatlarıyla sisteme kaydedildi!",
        })
        setPreviewImage(null)
        setDescription("")
        setSelectedGateId("")
        fetchAttachments()
      } else {
        setFeedback({ type: "error", msg: data.error || "Fotoğraf kaydedilemedi." })
      }
    } catch (err: any) {
      setFeedback({ type: "error", msg: "Bağlantı hatası: Sunucuya ulaşılamadı." })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="border-b border-slate-200 dark:border-slate-800 pb-4">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400 mb-1">
          <Camera className="w-4 h-4" />
          <span>Saha Kanıt Zinciri & Ataşman</span>
        </div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
          Saha İlerleme Kamerası
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Telefonunuzun kamerasını açarak sahadan anlık ilerleme fotoğrafları çekin; GPS koordinatları ve zaman damgasıyla ataşman arşivine ekleyin.
        </p>
      </div>

      {feedback && (
        <div
          className={`p-3.5 rounded-xl border flex items-center gap-2.5 text-xs font-medium animate-in fade-in ${
            feedback.type === "success"
              ? "bg-emerald-50 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300"
              : "bg-red-50 dark:bg-red-950/60 border-red-300 dark:border-red-800 text-red-800 dark:text-red-300"
          }`}
        >
          {feedback.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
          )}
          <span>{feedback.msg}</span>
        </div>
      )}

      {/* Main Camera Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Project & StageGate Selection */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-blue-500" />
                <span>Şantiye / Proje *</span>
              </label>
              <select
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                required
              >
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-amber-500" />
                <span>İlgili Onay Fazı (Opsiyonel Stage-Gate)</span>
              </label>
              <select
                value={selectedGateId}
                onChange={(e) => setSelectedGateId(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
              >
                <option value="">Genel İlerleme Ataşmanı</option>
                {stageGates.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.stageName} (Faz Onayı)
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Camera Capture Area */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
              <span>Saha Fotoğrafı Çekimi *</span>
              {coords ? (
                <span className="flex items-center gap-1 text-[11px] text-emerald-500 font-mono">
                  <MapPin className="w-3.5 h-3.5" />
                  GPS: {coords.lat.toFixed(4)}, {coords.lng.toFixed(4)} (±{coords.accuracy}m)
                </span>
              ) : gettingLocation ? (
                <span className="flex items-center gap-1 text-[11px] text-amber-500">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  GPS alınıyor...
                </span>
              ) : (
                <button
                  type="button"
                  onClick={acquireGPS}
                  className="text-[11px] text-blue-500 hover:underline flex items-center gap-1"
                >
                  <Compass className="w-3 h-3" />
                  GPS Yenile
                </button>
              )}
            </div>

            {previewImage ? (
              <div className="relative rounded-2xl overflow-hidden border border-slate-300 dark:border-slate-700 bg-slate-950 max-h-80 flex items-center justify-center p-2 group">
                <img
                  src={previewImage}
                  alt="Çekilen Saha Fotoğrafı"
                  className="max-h-76 object-contain rounded-xl"
                />

                {/* Live Watermark on Preview */}
                <div className="absolute bottom-4 left-4 bg-black/75 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/20 text-white text-[11px] font-mono space-y-0.5">
                  <div className="flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-red-400" />
                    <span>
                      {coords ? `${coords.lat.toFixed(5)}, ${coords.lng.toFixed(5)}` : "GPS Bekleniyor"}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-300">
                    {new Date().toLocaleString("tr-TR")}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setPreviewImage(null)}
                  className="absolute top-4 right-4 px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-colors"
                >
                  Yeniden Çek
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* HTML5 Direct Camera Capture: <input type="file" accept="image/*" capture="environment" /> */}
                <label className="flex flex-col items-center justify-center gap-3 p-8 border-2 border-dashed border-blue-500/60 hover:border-blue-500 rounded-2xl bg-blue-50/50 dark:bg-blue-950/20 hover:bg-blue-100/50 dark:hover:bg-blue-950/40 cursor-pointer transition-all group text-center">
                  <div className="p-4 rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-600/30 group-hover:scale-110 transition-transform">
                    <Camera className="w-8 h-8" />
                  </div>
                  <div>
                    <span className="text-sm font-bold text-slate-900 dark:text-white block">
                      CANLI SAHA KAMERASINI AÇ
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 block">
                      Arka kamerayı doğrudan tetikler
                    </span>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handleCapture}
                    className="hidden"
                  />
                </label>

                {/* Gallery fallback */}
                <label className="flex flex-col items-center justify-center gap-3 p-8 border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-slate-500 rounded-2xl bg-slate-50 dark:bg-slate-950/50 cursor-pointer transition-all group text-center">
                  <div className="p-4 rounded-2xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 group-hover:scale-110 transition-transform">
                    <Upload className="w-8 h-8" />
                  </div>
                  <div>
                    <span className="text-sm font-bold text-slate-900 dark:text-white block">
                      Galeriden Seç
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 block">
                      Kayıtlı fotoğraf yükle
                    </span>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleCapture}
                    className="hidden"
                  />
                </label>
              </div>
            )}
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Ataşman Açıklaması / İmalat Notu
            </label>
            <input
              type="text"
              placeholder="Örn: A Blok 3. Kat Beton Dökümü Bitti (Kalıp ve Donatı Kontrol Edildi)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Submit */}
          <div className="flex items-center justify-end pt-2">
            <button
              type="submit"
              disabled={loading || !previewImage}
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-md shadow-blue-600/30 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>GPS ve Fotoğraf Kaydediliyor...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Ataşman Olarak Arşive Ekle</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Recent Field Attachments Gallery */}
      <div className="space-y-3 pt-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <ImageIcon className="w-4 h-4 text-blue-500" />
            <span>Şantiyeden Kaydedilen Son İlerleme Kanıtları</span>
          </h2>
          <span className="text-xs text-slate-400">{recentAttachments.length} Ataşman</span>
        </div>

        {recentAttachments.length === 0 ? (
          <div className="p-8 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-400">
            Bu şantiye için henüz kaydedilmiş bir ilerleme fotoğrafı bulunmuyor.
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3.5">
            {recentAttachments.map((att) => (
              <div
                key={att.id}
                onClick={() => setLightboxImg(att.photoUrl)}
                className="group relative rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-950 cursor-pointer shadow-sm hover:border-blue-500 transition-all flex flex-col justify-between"
              >
                <div className="h-32 w-full overflow-hidden bg-slate-900">
                  <img
                    src={att.photoUrl}
                    alt={att.description || "İlerleme kanıtı"}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>

                <div className="p-2.5 bg-white dark:bg-slate-900 space-y-1">
                  <p className="text-[11px] font-semibold text-slate-800 dark:text-slate-200 line-clamp-1">
                    {att.description || "Ataşman Kaydı"}
                  </p>
                  <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                    <span>{new Date(att.createdAt).toLocaleDateString("tr-TR")}</span>
                    {att.latitude && att.longitude && (
                      <span className="flex items-center gap-0.5 text-blue-500">
                        <MapPin className="w-2.5 h-2.5" />
                        <span>GPS</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox Modal */}
      {lightboxImg && (
        <div
          onClick={() => setLightboxImg(null)}
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm cursor-pointer"
        >
          <div className="relative max-w-3xl max-h-[85vh] bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden p-2">
            <img
              src={lightboxImg}
              alt="İlerleme Görseli"
              className="max-w-full max-h-[80vh] object-contain rounded-xl"
            />
          </div>
        </div>
      )}
    </div>
  )
}
