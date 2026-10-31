"use client"
/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Subcontractor Daily Field Report & BoQ Progress Submission Page
 */

import React, { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
  FileText,
  Camera,
  Upload,
  ArrowLeft,
  CheckCircle2,
  Building2,
  Layers,
  Users,
  Send,
  Loader2,
  Percent,
  X,
  AlertCircle
} from "lucide-react"
import { getProjectsAndBoqItems, submitDailyReportAction } from "./actions"
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

export default function SubcontractorDailyReportPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  const [projects, setProjects] = useState<ProjectItem[]>([])
  const [boqItems, setBoqItems] = useState<BoqItem[]>([])
  const [selectedProjectId, setSelectedProjectId] = useState<string>("")
  const [selectedBoqItemId, setSelectedBoqItemId] = useState<string>("")

  const [description, setDescription] = useState("")
  const [progressPercent, setProgressPercent] = useState<number>(10)
  const [workforceCount, setWorkforceCount] = useState<number>(6)

  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  // Fetch projects and initial BoQ items
  useEffect(() => {
    let isActive = true
    const load = async () => {
      try {
        const res = await getProjectsAndBoqItems()
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
        console.error("Load projects error:", err)
      } finally {
        if (isActive) setLoading(false)
      }
    }
    void load()
    return () => { isActive = false }
  }, [])

  // On project change, reload BoqItems
  const handleProjectChange = async (newProjectId: string) => {
    setSelectedProjectId(newProjectId)
    setSelectedBoqItemId("")
    try {
      const res = await getProjectsAndBoqItems(newProjectId)
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

  // Handle Photo
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

  // Calculate estimated added quantity based on plannedQuantity * percent
  const estimatedAddedQty = selectedBoq
    ? ((selectedBoq.plannedQuantity * progressPercent) / 100).toFixed(1)
    : 0

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedProjectId) {
      toast.error("Lütfen bir proje seçiniz.")
      return
    }

    if (!description.trim()) {
      toast.error("Lütfen yapılan işe dair açıklama giriniz.")
      return
    }

    setSubmitting(true)

    try {
      const formData = new FormData()
      formData.append("projectId", selectedProjectId)
      formData.append("boqItemId", selectedBoqItemId)
      formData.append("progressPercent", progressPercent.toString())
      formData.append("workforceCount", workforceCount.toString())
      formData.append("description", description)

      if (selectedFile) {
        formData.append("photo", selectedFile)
      }

      const res = await submitDailyReportAction(formData)

      if (res.success) {
        toast.success(res.message || "Günlük rapor başarıyla kaydedildi!")
        setDescription("")
        handleRemovePhoto()
        setTimeout(() => {
          router.push("/subcontractor")
        }, 1200)
      } else {
        toast.error(res.error || "Rapor kaydedilemedi.")
      }
    } catch (err) {
      console.error("Submit daily report error:", err)
      toast.error("Rapor kaydedilirken bir hata oluştu.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="max-w-3xl mx-auto mb-6">
        <button
          onClick={() => router.push("/subcontractor")}
          className="flex items-center gap-2 text-sm text-orange-400 hover:text-orange-300 mb-3 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Portala Dön
        </button>
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center text-white shadow-lg shadow-orange-500/20">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Günlük Saha İlerleme Raporu
            </h1>
            <p className="text-xs sm:text-sm text-slate-400">
              Bugün sahada tamamlanan metrajı ve imalatları şantiye şefinin onayına iletin
            </p>
          </div>
        </div>
      </div>

      {/* Main Form */}
      <div className="max-w-3xl mx-auto">
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* 1. Proje & İmalat / Poz Seçimi */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
            <div className="flex items-center gap-2 text-xs font-semibold text-orange-400 uppercase tracking-wider">
              <Building2 className="w-4 h-4" />
              Proje ve İmalat Kalemi (Keşif / Metraj)
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Şantiye Projesi *
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
                      {p.name || p.title || "Şantiye Projesi"}
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
                  <option value="">Genel İlerleme / Poz Seçilmedi</option>
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
                  <span className="text-slate-400">Toplam Planlanan: </span>
                  <strong className="text-white">
                    {selectedBoq.plannedQuantity.toLocaleString("tr-TR")} {selectedBoq.unit}
                  </strong>
                </div>
                <div>
                  <span className="text-slate-400">Şu Ana Kadar Onaylanan: </span>
                  <strong className="text-emerald-400">
                    {selectedBoq.actualQuantity.toLocaleString("tr-TR")} {selectedBoq.unit}
                  </strong>
                </div>
                <div>
                  <span className="text-slate-400">Bugün Eklenecek (Tahmini): </span>
                  <strong className="text-orange-400 font-mono font-bold">
                    +{estimatedAddedQty} {selectedBoq.unit}
                  </strong>
                </div>
              </div>
            )}
          </div>

          {/* 2. Günlük İlerleme Yüzdesi & Personel */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-semibold text-orange-400 uppercase tracking-wider">
                <Percent className="w-4 h-4" />
                Bugünkü İlerleme Yüzdesi (progressPercent)
              </div>
              <div className="flex items-center gap-1.5 font-mono text-base font-bold text-orange-400 bg-orange-500/10 px-3 py-1 rounded-xl border border-orange-500/20">
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
              <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                <span>%1</span>
                <span>%25</span>
                <span>%50</span>
                <span>%75</span>
                <span>%100</span>
              </div>
            </div>

            {/* Çalışan Usta / İşçi Sayısı */}
            <div className="pt-2 border-t border-slate-800 flex items-center justify-between gap-4">
              <div className="flex items-center gap-2 text-xs text-slate-300">
                <Users className="w-4 h-4 text-orange-400" />
                <span>Bugün Sahada Çalışan Personel (Puantaj)</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setWorkforceCount(Math.max(1, workforceCount - 1))}
                  className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-bold flex items-center justify-center text-sm"
                >
                  -
                </button>
                <span className="font-mono text-sm font-bold text-white w-8 text-center">
                  {workforceCount}
                </span>
                <button
                  type="button"
                  onClick={() => setWorkforceCount(workforceCount + 1)}
                  className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-bold flex items-center justify-center text-sm"
                >
                  +
                </button>
                <span className="text-xs text-slate-400 ml-1">Kişi</span>
              </div>
            </div>
          </div>

          {/* 3. Yapılan İmalatlar Açıklaması */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
            <label className="block text-xs font-semibold text-orange-400 uppercase tracking-wider">
              Bugün Sahada Yapılan İmalatlar *
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              required
              placeholder="Örn: 3. Kat A Blok kolon kalıpları bağlandı, paspayları yerleştirildi ve 50 m3 C35/45 hazır beton dökümü tamamlandı..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 resize-none transition"
            />
          </div>

          {/* 4. Saha Fotoğrafı (Opsiyonel / Ataşman) */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-semibold text-orange-400 uppercase tracking-wider">
                <Camera className="w-4 h-4" />
                Günlük İmalat Fotoğrafı
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
                  {selectedFile ? selectedFile.name : "Kamerayı Aç veya Fotoğraf Seç"}
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
                <img src={previewUrl} alt="Rapor Fotoğrafı" className="max-h-48 object-contain" />
              </div>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-orange-600 via-amber-600 to-orange-600 hover:from-orange-500 hover:to-amber-500 text-white font-bold text-sm shadow-xl shadow-orange-600/30 flex items-center justify-center gap-2 transition disabled:opacity-50"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Günlük Rapor Kaydediliyor...
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                Günlük Raporu Kaydet ve Şefe İlet
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  )
}
