"use client"
/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Nexa ERP - Field Personnel / Auditor Dynamic Form Submission Module (/personnel/forms)
 */

import React, { useState, useEffect, useRef } from "react"
import { 
  FileCheck2, 
  Building2, 
  Camera, 
  CheckCircle2, 
  AlertCircle, 
  Upload, 
  Check, 
  X, 
  Loader2, 
  Clock, 
  ChevronRight, 
  Calendar, 
  Eye, 
  RefreshCw, 
  Plus, 
  Layers, 
  ClipboardCheck,
  CheckSquare,
  ShieldCheck,
  AlertTriangle
} from "lucide-react"
import toast from "react-hot-toast"

interface ProjectItem {
  id: string
  title: string
  status?: string | null
  city?: string | null
  district?: string | null
}

interface FormTemplate {
  id: string
  title: string
  description?: string | null
  category?: string | null
  fields: any[]
}

interface MySubmission {
  id: string
  formId: string
  projectId: string
  answers: Record<string, any>
  status: string
  notes?: string | null
  createdAt: string
  form?: {
    id: string
    title: string
    category?: string | null
    fields: any[]
  }
  project?: {
    id: string
    title: string
  }
}

export default function PersonnelFormsPage() {
  const [activeTab, setActiveTab] = useState<"fill" | "history">("fill")
  const [projects, setProjects] = useState<ProjectItem[]>([])
  const [forms, setForms] = useState<FormTemplate[]>([])
  const [mySubmissions, setMySubmissions] = useState<MySubmission[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  // Form Filling State
  const [selectedProjectId, setSelectedProjectId] = useState<string>("")
  const [selectedFormId, setSelectedFormId] = useState<string>("")
  const [answers, setAnswers] = useState<Record<string, any>>({})
  const [notes, setNotes] = useState<string>("")
  const [uploadingFieldId, setUploadingFieldId] = useState<string | null>(null)

  // Modals
  const [viewSubmission, setViewSubmission] = useState<MySubmission | null>(null)
  const [lightboxImage, setLightboxImage] = useState<string | null>(null)

  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({})

  const loadData = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/personnel/forms")
      const data = await res.json()

      if (data.projects) {
        setProjects(data.projects)
        if (data.projects.length > 0 && !selectedProjectId) {
          setSelectedProjectId(data.projects[0].id)
        }
      }

      if (data.forms) {
        setForms(data.forms)
        if (data.forms.length > 0 && !selectedFormId) {
          setSelectedFormId(data.forms[0].id)
        }
      }

      if (data.mySubmissions) {
        setMySubmissions(data.mySubmissions)
      }
    } catch (err) {
      console.error(err)
      toast.error("Form ve proje verileri yüklenemedi.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const selectedForm = forms.find(f => f.id === selectedFormId)

  // Handle answer change
  const handleAnswerChange = (fieldId: string, value: any) => {
    setAnswers(prev => ({ ...prev, [fieldId]: value }))
  }

  // Handle photo upload for a specific field
  const handlePhotoUpload = async (fieldId: string, file: File) => {
    if (!file) return

    setUploadingFieldId(fieldId)
    const formData = new FormData()
    formData.append("file", file)
    formData.append("customName", `denetim-kanit-${Date.now()}`)

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData
      })

      const data = await res.json()
      if (!res.ok || !data.url) {
        throw new Error(data.error || "Fotoğraf yüklenemedi")
      }

      handleAnswerChange(fieldId, data.url)
      toast.success("Fotoğraf yüklendi!")
    } catch (err: any) {
      toast.error(err.message || "Görsel yüklenirken bir hata oluştu.")
    } finally {
      setUploadingFieldId(null)
    }
  }

  // Handle submit form
  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedProjectId) {
      toast.error("Lütfen bir şantiye / proje seçin.")
      return
    }

    if (!selectedFormId || !selectedForm) {
      toast.error("Lütfen doldurulacak denetim formunu seçin.")
      return
    }

    // Validate required fields
    if (Array.isArray(selectedForm.fields)) {
      for (const f of selectedForm.fields) {
        if (f.required) {
          const val = answers[f.id]
          if (val === undefined || val === null || val === "") {
            toast.error(`Zorunlu alan eksik: "${f.label}"`)
            return
          }
        }
      }
    }

    setSubmitting(true)
    try {
      const res = await fetch("/api/personnel/forms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          formId: selectedFormId,
          projectId: selectedProjectId,
          answers,
          notes: notes.trim() || null,
          status: "COMPLETED"
        })
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || "Kayıt kaydedilemedi.")
      }

      toast.success("Denetim formu başarıyla kaydedildi!")
      setAnswers({})
      setNotes("")
      setActiveTab("history")
      loadData()
    } catch (err: any) {
      toast.error(err.message || "Denetim formu kaydedilemedi.")
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="flex items-center gap-3 text-slate-300">
          <Loader2 className="w-6 h-6 animate-spin text-cyan-400" />
          <span>Denetim formları yükleniyor...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-20">
      {/* Mobile Top Header */}
      <div className="sticky top-0 z-30 bg-slate-900/90 backdrop-blur border-b border-slate-800 px-4 py-3 sm:px-6">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
              <ClipboardCheck className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-bold text-white">
                Saha Denetim Formları
              </h1>
              <p className="text-[11px] text-slate-400">
                Yapı Denetim ve Kalite Kontrol Modülü
              </p>
            </div>
          </div>

          <button
            onClick={loadData}
            title="Yenile"
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-5 sm:px-6 space-y-5">
        {/* Tab Switcher */}
        <div className="grid grid-cols-2 gap-2 p-1 bg-slate-900 border border-slate-800 rounded-2xl">
          <button
            type="button"
            onClick={() => setActiveTab("fill")}
            className={`py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 ${
              activeTab === "fill"
                ? "bg-cyan-600 text-white shadow-lg shadow-cyan-600/30"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Plus className="w-4 h-4" />
            <span>Yeni Denetim Doldur</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("history")}
            className={`py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 ${
              activeTab === "history"
                ? "bg-cyan-600 text-white shadow-lg shadow-cyan-600/30"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>Geçmiş Denetimlerim ({mySubmissions.length})</span>
          </button>
        </div>

        {/* TAB 1: FORM FILLING */}
        {activeTab === "fill" && (
          <form onSubmit={handleSubmitForm} className="space-y-5">
            {/* Project & Form Selectors */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm space-y-4">
              <h2 className="text-xs font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
                <Building2 className="w-4 h-4" />
                1. Şantiye ve Form Seçimi
              </h2>

              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">
                    Denetlenen Proje / Şantiye <span className="text-rose-400">*</span>
                  </label>
                  <select
                    value={selectedProjectId}
                    onChange={(e) => setSelectedProjectId(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-cyan-500"
                  >
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.title} {p.city ? `(${p.city})` : ""}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">
                    Denetim Formu Şablonu <span className="text-rose-400">*</span>
                  </label>
                  <select
                    value={selectedFormId}
                    onChange={(e) => {
                      setSelectedFormId(e.target.value)
                      setAnswers({})
                    }}
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-cyan-500"
                  >
                    {forms.map((f) => (
                      <option key={f.id} value={f.id}>
                        [{f.category || "GENEL"}] {f.title} ({Array.isArray(f.fields) ? f.fields.length : 0} Madde)
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {selectedForm?.description && (
                <div className="p-3 bg-slate-950 border border-slate-850 rounded-xl text-xs text-slate-300 leading-relaxed">
                  <span className="font-semibold text-cyan-400">Denetim Notu: </span>
                  {selectedForm.description}
                </div>
              )}
            </div>

            {/* Checklist Fields */}
            {selectedForm && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <CheckSquare className="w-4 h-4 text-emerald-400" />
                    2. Denetim Maddeleri ({Array.isArray(selectedForm.fields) ? selectedForm.fields.length : 0})
                  </h2>
                  <span className="text-[11px] text-slate-500">* Zorunlu alanlar</span>
                </div>

                {Array.isArray(selectedForm.fields) && selectedForm.fields.map((field: any, idx: number) => {
                  const currentValue = answers[field.id]

                  return (
                    <div
                      key={field.id}
                      className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm space-y-3"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-sm font-semibold text-white leading-relaxed">
                          {idx + 1}. {field.label}
                          {field.required && <span className="text-rose-400 ml-1">*</span>}
                        </span>
                      </div>

                      {/* CHECKBOX TYPE (Large Touch Friendly Buttons) */}
                      {field.type === "checkbox" && (
                        <div className="grid grid-cols-2 gap-3 pt-1">
                          <button
                            type="button"
                            onClick={() => handleAnswerChange(field.id, true)}
                            className={`py-3 px-4 rounded-xl text-xs sm:text-sm font-bold border transition-all flex items-center justify-center gap-2 ${
                              currentValue === true
                                ? "bg-emerald-600 text-white border-emerald-500 shadow-lg shadow-emerald-600/30 scale-[1.01]"
                                : "bg-slate-950 text-slate-400 border-slate-800 hover:text-white hover:border-slate-700"
                            }`}
                          >
                            <CheckCircle2 className="w-4 h-4" />
                            <span>UYGUN</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleAnswerChange(field.id, false)}
                            className={`py-3 px-4 rounded-xl text-xs sm:text-sm font-bold border transition-all flex items-center justify-center gap-2 ${
                              currentValue === false
                                ? "bg-rose-600 text-white border-rose-500 shadow-lg shadow-rose-600/30 scale-[1.01]"
                                : "bg-slate-950 text-slate-400 border-slate-800 hover:text-white hover:border-slate-700"
                            }`}
                          >
                            <AlertCircle className="w-4 h-4" />
                            <span>UYGUN DEĞİL</span>
                          </button>
                        </div>
                      )}

                      {/* TEXT TYPE */}
                      {field.type === "text" && (
                        <input
                          type="text"
                          value={currentValue || ""}
                          onChange={(e) => handleAnswerChange(field.id, e.target.value)}
                          placeholder={field.placeholder || "Cevabınızı yazın..."}
                          className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-cyan-500"
                        />
                      )}

                      {/* NUMBER TYPE */}
                      {field.type === "number" && (
                        <input
                          type="number"
                          step="any"
                          value={currentValue || ""}
                          onChange={(e) => handleAnswerChange(field.id, e.target.value)}
                          placeholder={field.placeholder || "Ölçüm değeri..."}
                          className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-cyan-500"
                        />
                      )}

                      {/* TEXTAREA TYPE */}
                      {field.type === "textarea" && (
                        <textarea
                          rows={3}
                          value={currentValue || ""}
                          onChange={(e) => handleAnswerChange(field.id, e.target.value)}
                          placeholder={field.placeholder || "Detaylı açıklama ve tespitlerinizi yazın..."}
                          className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-cyan-500 resize-none"
                        />
                      )}

                      {/* SELECT TYPE */}
                      {field.type === "select" && (
                        <select
                          value={currentValue || ""}
                          onChange={(e) => handleAnswerChange(field.id, e.target.value)}
                          className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-cyan-500"
                        >
                          <option value="">Seçiniz...</option>
                          {(field.options || ["Uygun", "Uygun Değil"]).map((opt: string, oIdx: number) => (
                            <option key={oIdx} value={opt}>{opt}</option>
                          ))}
                        </select>
                      )}

                      {/* PHOTO UPLOAD TYPE */}
                      {field.type === "photo" && (
                        <div className="space-y-3 pt-1">
                          <input
                            type="file"
                            accept="image/*"
                            capture="environment"
                            ref={(el) => { fileInputRefs.current[field.id] = el }}
                            onChange={(e) => {
                              const file = e.target.files?.[0]
                              if (file) handlePhotoUpload(field.id, file)
                            }}
                            className="hidden"
                          />

                          {currentValue ? (
                            <div className="relative inline-block rounded-2xl overflow-hidden border border-slate-700 w-full sm:w-64 h-40 bg-slate-950">
                              <img
                                src={currentValue}
                                alt="Kanıt Görseli"
                                className="w-full h-full object-cover"
                              />
                              <button
                                type="button"
                                onClick={() => handleAnswerChange(field.id, null)}
                                className="absolute top-2 right-2 p-1.5 bg-rose-600 text-white rounded-lg hover:bg-rose-500 shadow-md"
                                title="Fotoğrafı Kaldır"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => fileInputRefs.current[field.id]?.click()}
                              disabled={uploadingFieldId === field.id}
                              className="w-full py-4 border-2 border-dashed border-slate-700 hover:border-cyan-500 rounded-2xl bg-slate-950/60 flex flex-col items-center justify-center gap-2 text-slate-400 hover:text-white transition-all disabled:opacity-50"
                            >
                              {uploadingFieldId === field.id ? (
                                <>
                                  <Loader2 className="w-6 h-6 animate-spin text-cyan-400" />
                                  <span className="text-xs font-semibold text-cyan-400">Görsel Yükleniyor...</span>
                                </>
                              ) : (
                                <>
                                  <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-cyan-400">
                                    <Camera className="w-5 h-5" />
                                  </div>
                                  <span className="text-xs font-bold text-white">📸 Fotoğraf Çek / Kanıt Yükle</span>
                                  <span className="text-[11px] text-slate-500">Kamera veya galeriden görsel seçin</span>
                                </>
                              )}
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}

                {/* Additional Inspector Notes */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm space-y-2">
                  <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                    3. Denetçi Genel Görüşü ve Şantiye Tutanak Notu (Opsiyonel)
                  </label>
                  <textarea
                    rows={3}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Denetime dair genel gözlemlerinizi, hava durumunu veya şantiye şefine iletilen uyarıları yazınız..."
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-cyan-500 resize-none"
                  />
                </div>

                {/* Submit Button */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white font-bold text-sm uppercase tracking-wider shadow-xl shadow-emerald-500/20 disabled:opacity-50 flex items-center justify-center gap-2 transition-all active:scale-[0.99]"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>Denetim Raporu Kaydediliyor...</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-5 h-5" />
                        <span>Formu Tamamla ve Gönder</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </form>
        )}

        {/* TAB 2: MY PAST SUBMISSIONS */}
        {activeTab === "history" && (
          <div className="space-y-4">
            {mySubmissions.length === 0 ? (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-10 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center mx-auto text-slate-500">
                  <FileCheck2 className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-bold text-white">Geçmiş Denetim Kaydınız Bulunmuyor</h3>
                <p className="text-xs text-slate-400 max-w-xs mx-auto">
                  Saha denetimi gerçekleştirdikçe doldurduğunuz formlar burada listelenecektir.
                </p>
                <button
                  onClick={() => setActiveTab("fill")}
                  className="px-4 py-2 rounded-xl bg-cyan-600 text-white text-xs font-semibold"
                >
                  İlk Denetimi Başlat
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {mySubmissions.map((sub) => (
                  <div
                    key={sub.id}
                    className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-4 sm:p-5 shadow-sm space-y-3 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 uppercase">
                          {sub.form?.category || "GENEL"}
                        </span>
                        <h3 className="text-sm sm:text-base font-bold text-white mt-1">
                          {sub.form?.title || "Denetim Formu"}
                        </h3>
                      </div>

                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Tamamlandı
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 pt-1">
                      <span className="flex items-center gap-1 text-slate-300 font-medium">
                        <Building2 className="w-3.5 h-3.5 text-blue-400" />
                        {sub.project?.title || "Proje Bilgisi Yok"}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-slate-500" />
                        {new Date(sub.createdAt).toLocaleString("tr-TR", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit"
                        })}
                      </span>
                    </div>

                    <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
                      <span className="text-[11px] text-slate-500">
                        {Object.keys(sub.answers || {}).length} madde cevaplandı
                      </span>
                      <button
                        type="button"
                        onClick={() => setViewSubmission(sub)}
                        className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-400 text-xs font-semibold flex items-center gap-1 transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Detayları İncele</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* VIEW SUBMISSION MODAL */}
      {viewSubmission && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-xl w-full p-5 sm:p-6 shadow-2xl max-h-[90vh] overflow-y-auto space-y-4">
            <div className="flex items-start justify-between border-b border-slate-800 pb-3">
              <div>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 uppercase">
                  {viewSubmission.form?.category || "GENEL"}
                </span>
                <h3 className="text-base sm:text-lg font-bold text-white mt-1">
                  {viewSubmission.form?.title}
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  {viewSubmission.project?.title} • {new Date(viewSubmission.createdAt).toLocaleString("tr-TR")}
                </p>
              </div>
              <button
                onClick={() => setViewSubmission(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Answers List */}
            <div className="space-y-3">
              {Array.isArray(viewSubmission.form?.fields) && viewSubmission.form.fields.map((field: any, idx: number) => {
                const answer = viewSubmission.answers?.[field.id]
                return (
                  <div key={field.id || idx} className="bg-slate-950 border border-slate-850 rounded-xl p-3 space-y-1.5">
                    <p className="text-xs font-semibold text-slate-300">
                      {idx + 1}. {field.label}
                    </p>

                    <div>
                      {field.type === "checkbox" && (
                        <div>
                          {answer === true ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              UYGUN
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-xs font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                              <AlertCircle className="w-3.5 h-3.5" />
                              UYGUN DEĞİL
                            </span>
                          )}
                        </div>
                      )}

                      {(field.type === "text" || field.type === "textarea" || field.type === "select" || field.type === "number") && (
                        <p className="text-xs text-white bg-slate-900 border border-slate-800 rounded-lg p-2 font-medium">
                          {answer ? String(answer) : <span className="text-slate-500 italic">Belirtilmedi</span>}
                        </p>
                      )}

                      {field.type === "photo" && (
                        <div>
                          {answer ? (
                            <img
                              src={String(answer)}
                              alt="Kanıt Fotoğrafı"
                              onClick={() => setLightboxImage(String(answer))}
                              className="w-32 h-24 object-cover rounded-lg border border-slate-700 cursor-pointer hover:opacity-90"
                            />
                          ) : (
                            <span className="text-xs text-slate-500 italic">Fotoğraf yok</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}

              {viewSubmission.notes && (
                <div className="bg-slate-950 border border-slate-850 rounded-xl p-3 space-y-1">
                  <span className="text-xs font-semibold text-slate-400">Denetçi Ek Notları:</span>
                  <p className="text-xs text-slate-200 leading-relaxed whitespace-pre-wrap">
                    {viewSubmission.notes}
                  </p>
                </div>
              )}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setViewSubmission(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold"
              >
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FULLSCREEN IMAGE LIGHTBOX */}
      {lightboxImage && (
        <div 
          onClick={() => setLightboxImage(null)}
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4 cursor-pointer"
        >
          <div className="relative max-w-xl max-h-[90vh]">
            <img
              src={lightboxImage}
              alt="Büyük Boy Kanıt Fotoğrafı"
              className="max-w-full max-h-[85vh] object-contain rounded-xl shadow-2xl"
            />
            <button
              onClick={() => setLightboxImage(null)}
              className="absolute top-2 right-2 p-2 bg-slate-900/80 text-white rounded-full hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
