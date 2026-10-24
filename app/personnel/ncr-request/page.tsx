"use client"
/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Field Engineer Open Non-Conformance (NCR / DÖF) Request Page
 */

import React, { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import {
  AlertTriangle,
  Building2,
  Calendar,
  Camera,
  Upload,
  ArrowLeft,
  CheckCircle2,
  Send,
  Loader2,
  X,
  MapPin,
  Boxes,
  Users
} from "lucide-react"
import { getNcrFormData, createNcrAction } from "./actions"
import { toast } from "react-hot-toast"

export default function NcrRequestPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const elementIdParam = searchParams.get("elementId")

  const [projects, setProjects] = useState<{ id: string; name: string }[]>([])
  const [subcontractors, setSubcontractors] = useState<{ id: string; name: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  const [projectId, setProjectId] = useState("")
  const [subcontractorId, setSubcontractorId] = useState("")
  const [location, setLocation] = useState(elementIdParam ? `BIM: ${elementIdParam}` : "")
  const [description, setDescription] = useState("")
  const [deadline, setDeadline] = useState(
    new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
  )

  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  useEffect(() => {
    let isActive = true
    const load = async () => {
      try {
        const res = await getNcrFormData()
        if (res.success && isActive) {
          setProjects(res.projects as any)
          setSubcontractors(res.subcontractors as any)
          if (res.projects && res.projects.length > 0) {
            setProjectId(res.projects[0].id)
          }
          if (res.subcontractors && res.subcontractors.length > 0) {
            setSubcontractorId(res.subcontractors[0].id)
          }
        }
      } catch (err) {
        console.error("Load NCR form data error:", err)
      } finally {
        if (isActive) setLoading(false)
      }
    }
    void load()
    return () => { isActive = false }
  }, [])

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!projectId) {
      toast.error("Lütfen şantiye projesini seçiniz.")
      return
    }

    if (!description.trim()) {
      toast.error("Lütfen kusur/uygunsuzluk açıklamasını yazınız.")
      return
    }

    setSubmitting(true)
    try {
      const formData = new FormData()
      formData.append("projectId", projectId)
      formData.append("subcontractorId", subcontractorId)
      formData.append("location", location)
      formData.append("description", description)
      formData.append("deadline", deadline)

      if (selectedFile) {
        formData.append("photo", selectedFile)
      }

      const res = await createNcrAction(formData)
      if (res.success) {
        toast.success(res.message || "Uygunsuzluk (NCR) başarıyla açıldı!")
        setTimeout(() => {
          router.push("/personnel")
        }, 1200)
      } else {
        toast.error(res.error || "Kusur açılamadı.")
      }
    } catch (err) {
      toast.error("İşlem sırasında hata oluştu.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-6 lg:p-8">
      {/* Top Header */}
      <div className="max-w-2xl mx-auto mb-6">
        <button
          onClick={() => router.push("/personnel")}
          className="flex items-center gap-2 text-sm text-orange-400 hover:text-orange-300 mb-3 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Personel Portalı
        </button>
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-red-600 to-amber-600 flex items-center justify-center text-white shadow-lg shadow-red-600/20">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Saha Revizyon & Uygunsuzluk (DÖF) Talebi
            </h1>
            <p className="text-xs sm:text-sm text-slate-400">
              Saha mühendisi tarafından taşerona resmi Düzeltici/Önleyici Faaliyet (NCR) kaydı açma
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Şantiye Projesi *
                </label>
                <select
                  value={projectId}
                  onChange={(e) => setProjectId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-red-500"
                  required
                >
                  <option value="">Proje Seçiniz</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  İlgili Taşeron Firma
                </label>
                <select
                  value={subcontractorId}
                  onChange={(e) => setSubcontractorId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-red-500"
                >
                  <option value="">Taşeron Seçiniz (Opsiyonel)</option>
                  {subcontractors.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Mahal / Kat / Aks Bilgisi
                </label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Örn: A Blok 3. Kat Aks C-4 veya BIM Kolon K-14"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-red-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Son Çözüm Tarihi (Termin) *
                </label>
                <input
                  type="date"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-red-500"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Kusur & Revizyon Açıklaması *
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                required
                placeholder="Örn: Kolon etriye aralığı sıklaştırma bölgesinde 10cm olması gerekirken 20cm olarak bağlanmıştır. Beton dökülmeden önce düzeltilmelidir..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-red-500 resize-none"
              />
            </div>

            {/* Photo upload */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Kusur Kanıt Fotoğrafı
              </label>
              <div className="flex items-center gap-3">
                <label className="flex-1 cursor-pointer border border-dashed border-slate-700 hover:border-red-500 bg-slate-950 rounded-xl p-3 text-center transition flex items-center justify-center gap-2">
                  <Camera className="w-4 h-4 text-red-400" />
                  <span className="text-xs text-slate-400">
                    {selectedFile ? selectedFile.name : "Kamera Aç / Fotoğraf Seç"}
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
                  <div className="relative w-12 h-12 rounded-lg overflow-hidden border border-red-500 shrink-0">
                    <img src={previewUrl} alt="Kusur" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white font-bold text-sm shadow-xl shadow-red-600/30 flex items-center justify-center gap-2 transition disabled:opacity-50"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                NCR Kaydı Açılıyor...
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                DÖF / NCR Talebini Başlat
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  )
}
