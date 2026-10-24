"use client"
/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Field Engineer Daily Construction Journal (Şantiye Jurnali) Page
 */

import React, { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
  BookOpen,
  Building2,
  Calendar,
  CloudSun,
  Users,
  Percent,
  Camera,
  Upload,
  ArrowLeft,
  CheckCircle2,
  Send,
  Loader2,
  X,
  Layers,
  FileText
} from "lucide-react"
import { getJournalInitialData, submitJournalEntryAction } from "./actions"
import { toast } from "react-hot-toast"

interface ProjectItem {
  id: string
  name?: string | null
  title?: string | null
  city?: string | null
}

interface BoqItem {
  id: string
  pozNo: string
  description: string
  unit: string
  plannedQuantity: number
  actualQuantity: number
  unitPrice: number
}

export default function DailyJournalPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  const [projects, setProjects] = useState<ProjectItem[]>([])
  const [boqItems, setBoqItems] = useState<BoqItem[]>([])
  const [selectedProjectId, setSelectedProjectId] = useState<string>("")
  const [selectedBoqItemId, setSelectedBoqItemId] = useState<string>("")

  const [progressPercent, setProgressPercent] = useState<number>(15)
  const [workforceCount, setWorkforceCount] = useState<number>(12)
  const [weather, setWeather] = useState("Açık, 22°C (Rüzgar: 8 km/s)")
  const [notes, setNotes] = useState("")

  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  // Load Initial Data
  useEffect(() => {
    let isActive = true
    const load = async () => {
      try {
        const res = await getJournalInitialData()
        if (res.success && isActive) {
          setProjects(res.projects || [])
          if (res.selectedProjectId) {
            setSelectedProjectId(res.selectedProjectId)
            setBoqItems(res.boqItems || [])
            if (res.boqItems && res.boqItems.length > 0) {
              setSelectedBoqItemId(res.boqItems[0].id)
            }
          }
        }
      } catch (err) {
        console.error("Journal load error:", err)
      } finally {
        if (isActive) setLoading(false)
      }
    }
    void load()
    return () => { isActive = false }
  }, [])

  // Switch project
  const handleProjectChange = async (newProjectId: string) => {
    setSelectedProjectId(newProjectId)
    setSelectedBoqItemId("")
    try {
      const res = await getJournalInitialData(newProjectId)
      if (res.success) {
        setBoqItems(res.boqItems || [])
        if (res.boqItems && res.boqItems.length > 0) {
          setSelectedBoqItemId(res.boqItems[0].id)
        }
      }
    } catch (err) {
      console.error("Change project error:", err)
    }
  }

  // Handle Photo File
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith("image/")) {
      toast.error("Lütfen bir görsel seçiniz.")
      return
    }
    setSelectedFile(file)
    setPreviewUrl(URL.createObjectURL(file))
  }

  const handleRemovePhoto = () => {
    setSelectedFile(null)
    if (previewUrl && previewUrl.startsWith("blob:")) {
      URL.revokeObjectURL(previewUrl)
    }
    setPreviewUrl(null)
  }

  const selectedBoq = boqItems.find((b) => b.id === selectedBoqItemId)
  const estimatedAddedQty = selectedBoq
    ? ((selectedBoq.plannedQuantity * progressPercent) / 100).toFixed(1)
    : 0

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedProjectId) {
      toast.error("Lütfen bir şantiye projesi seçiniz.")
      return
    }

    if (!notes.trim()) {
      toast.error("Lütfen günlük jurnali ve imalat notlarını giriniz.")
      return
    }

    setSubmitting(true)

    try {
      const formData = new FormData()
      formData.append("projectId", selectedProjectId)
      formData.append("boqItemId", selectedBoqItemId)
      formData.append("progressPercent", progressPercent.toString())
      formData.append("workforceCount", workforceCount.toString())
      formData.append("weather", weather)
      formData.append("notes", notes)

      if (selectedFile) {
        formData.append("photo", selectedFile)
      }

      const res = await submitJournalEntryAction(formData)

      if (res.success) {
        toast.success(res.message || "Günlük şantiye jurnali başarıyla kaydedildi!")
        setNotes("")
        handleRemovePhoto()
        setTimeout(() => {
          router.push("/personnel")
        }, 1200)
      } else {
        toast.error(res.error || "Jurnal kaydedilemedi.")
      }
    } catch (err) {
      console.error("Submit journal error:", err)
      toast.error("Kayıt sırasında bir hata oluştu.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-6 lg:p-8">
      {/* Top Header */}
      <div className="max-w-3xl mx-auto mb-6">
        <button
          onClick={() => router.push("/personnel")}
          className="flex items-center gap-2 text-sm text-orange-400 hover:text-orange-300 mb-3 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Personel Portalı
        </button>
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-blue-600/20">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Günlük Şantiye Jurnali & Metraj Girişi
            </h1>
            <p className="text-xs sm:text-sm text-slate-400">
              Saha mühendisinin günlük teknik imalat, hava durumu ve BoQ ilerleme kaydı
            </p>
          </div>
        </div>
      </div>

      {/* Main Journal Form */}
      <div className="max-w-3xl mx-auto">
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* 1. Proje & BoQ İmalat Seçimi */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
            <div className="flex items-center gap-2 text-xs font-semibold text-orange-400 uppercase tracking-wider">
              <Building2 className="w-4 h-4" />
              Şantiye Projesi ve İmalat Kalemi
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Proje Seçimi *
                </label>
                <select
                  value={selectedProjectId}
                  onChange={(e) => handleProjectChange(e.target.value)}
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
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  İmalat Pozu (BoQ Kalemi)
                </label>
                <select
                  value={selectedBoqItemId}
                  onChange={(e) => setSelectedBoqItemId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-orange-500"
                >
                  <option value="">Genel İmalat / Poz Yok</option>
                  {boqItems.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.pozNo} - {b.description} ({b.plannedQuantity} {b.unit})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* BoQ Info Pill */}
            {selectedBoq && (
              <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3 flex flex-wrap items-center justify-between gap-2 text-xs">
                <div>
                  <span className="text-slate-400">Planlanan Metraj: </span>
                  <strong className="text-white">
                    {selectedBoq.plannedQuantity.toLocaleString("tr-TR")} {selectedBoq.unit}
                  </strong>
                </div>
                <div>
                  <span className="text-slate-400">Mevcut İlerleme: </span>
                  <strong className="text-emerald-400">
                    {selectedBoq.actualQuantity.toLocaleString("tr-TR")} {selectedBoq.unit}
                  </strong>
                </div>
                <div>
                  <span className="text-slate-400">Bugün Eklenen: </span>
                  <strong className="text-orange-400 font-mono font-bold">
                    +{estimatedAddedQty} {selectedBoq.unit}
                  </strong>
                </div>
              </div>
            )}
          </div>

          {/* 2. İlerleme Yüzdesi, Hava Durumu & Personel Sayısı */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-semibold text-orange-400 uppercase tracking-wider">
                <Percent className="w-4 h-4" />
                Günün İlerleme Yüzdesi (progressPercent)
              </div>
              <div className="font-mono text-base font-bold text-orange-400 bg-orange-500/10 px-3 py-1 rounded-xl border border-orange-500/20">
                %{progressPercent}
              </div>
            </div>

            <div>
              <input
                type="range"
                min="1"
                max="100"
                step="1"
                value={progressPercent}
                onChange={(e) => setProgressPercent(parseInt(e.target.value, 10))}
                className="w-full h-2.5 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-orange-500 border border-slate-800"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-800">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1 flex items-center gap-1.5">
                  <CloudSun className="w-3.5 h-3.5 text-amber-400" />
                  Günün Hava Durumu
                </label>
                <input
                  type="text"
                  value={weather}
                  onChange={(e) => setWeather(e.target.value)}
                  placeholder="Örn: Açık, 24°C"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1 flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-blue-400" />
                  Sahadaki Toplam Personel
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setWorkforceCount(Math.max(1, workforceCount - 1))}
                    className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-bold flex items-center justify-center text-sm"
                  >
                    -
                  </button>
                  <span className="font-mono text-sm font-bold text-white w-10 text-center">
                    {workforceCount}
                  </span>
                  <button
                    type="button"
                    onClick={() => setWorkforceCount(workforceCount + 1)}
                    className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-bold flex items-center justify-center text-sm"
                  >
                    +
                  </button>
                  <span className="text-xs text-slate-400 ml-1">Kişi (Puantaj)</span>
                </div>
              </div>
            </div>
          </div>

          {/* 3. Teknik İmalat Notları */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
            <label className="block text-xs font-semibold text-orange-400 uppercase tracking-wider">
              Şantiye Jurnali Teknik Notları *
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={5}
              required
              placeholder="Günün özeti: A Blok 3. kat döşeme donatısı bağlandı, şakül ve paspayı kontrolleri yapıldı, 14:00 itibarıyla C35/45 beton dökümü sorunsuz başlatıldı..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 resize-none transition"
            />
          </div>

          {/* 4. Saha Fotoğrafı */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-semibold text-orange-400 uppercase tracking-wider">
                <Camera className="w-4 h-4" />
                Saha İmalat Fotoğrafı
              </div>
              {previewUrl && (
                <button
                  type="button"
                  onClick={handleRemovePhoto}
                  className="text-xs text-red-400 hover:underline flex items-center gap-1"
                >
                  <X className="w-3.5 h-3.5" />
                  Kaldır
                </button>
              )}
            </div>

            {!previewUrl ? (
              <label className="border border-dashed border-slate-700 hover:border-orange-500 bg-slate-950 rounded-xl p-4 text-center cursor-pointer transition flex items-center justify-center gap-3">
                <Camera className="w-5 h-5 text-orange-400" />
                <span className="text-xs text-slate-400">
                  {selectedFile ? selectedFile.name : "Fotoğraf Çek veya Galeriden Seç"}
                </span>
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
            ) : (
              <div className="relative rounded-xl overflow-hidden border border-slate-700 bg-black max-h-48 flex items-center justify-center">
                <img src={previewUrl} alt="Jurnal Fotoğrafı" className="max-h-48 object-contain" />
              </div>
            )}
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-sm shadow-xl shadow-blue-600/30 flex items-center justify-center gap-2 transition disabled:opacity-50"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Şantiye Jurnali Kaydediliyor...
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                Şantiye Jurnalini Onaylı Olarak Kaydet
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  )
}
