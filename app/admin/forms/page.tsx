"use client"
/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Nexa ERP - Admin Dynamic Inspection Forms & Submissions Dashboard
 */

import React, { useState, useEffect } from "react"
import Link from "next/link"
import { 
  FileCheck2, 
  Plus, 
  Search, 
  Filter, 
  Trash2, 
  Edit3, 
  Eye, 
  Calendar, 
  User, 
  Building2, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  Camera, 
  Layers, 
  FileText, 
  Loader2, 
  X, 
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  CheckSquare,
  AlertCircle
} from "lucide-react"
import toast from "react-hot-toast"

interface FormTemplate {
  id: string
  title: string
  description?: string | null
  category?: string | null
  fields: any[]
  createdAt: string
  _count?: {
    submissions: number
  }
}

interface SubmissionRecord {
  id: string
  formId: string
  projectId: string
  userId: string
  answers: Record<string, any>
  status: string
  notes?: string | null
  createdAt: string
  form: {
    id: string
    title: string
    category?: string | null
    fields: any[]
  }
  project?: {
    id: string
    title: string
    city?: string | null
  } | null
  user?: {
    id: string
    name: string
    email?: string | null
    role?: string | null
  } | null
}

const CATEGORIES = [
  "Tümü",
  "Yangın Güvenliği",
  "Kalıp & Donatı",
  "İSG & Saha",
  "Mekanik & Tesisat",
  "Elektrik",
  "GENEL"
]

export default function AdminFormsPage() {
  const [activeTab, setActiveTab] = useState<"templates" | "submissions">("templates")
  const [forms, setForms] = useState<FormTemplate[]>([])
  const [submissions, setSubmissions] = useState<SubmissionRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("Tümü")

  // Modals
  const [previewForm, setPreviewForm] = useState<FormTemplate | null>(null)
  const [viewSubmission, setViewSubmission] = useState<SubmissionRecord | null>(null)
  const [lightboxImage, setLightboxImage] = useState<string | null>(null)

  const loadData = async () => {
    setLoading(true)
    try {
      const [formsRes, subsRes] = await Promise.all([
        fetch("/api/admin/forms"),
        fetch("/api/admin/forms/submissions")
      ])

      const formsData = await formsRes.json()
      const subsData = await subsRes.json()

      if (formsData.forms) setForms(formsData.forms)
      if (subsData.submissions) setSubmissions(subsData.submissions)
    } catch (err) {
      console.error(err)
      toast.error("Veriler yüklenirken hata oluştu.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleDeleteForm = async (id: string, title: string) => {
    if (!confirm(`"${title}" form şablonunu ve bağlı denetim kayıtlarını silmek istediğinize emin misiniz?`)) {
      return
    }

    try {
      const res = await fetch(`/api/admin/forms?id=${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Silme işlemi başarısız")

      toast.success("Form şablonu silindi.")
      setForms(prev => prev.filter(f => f.id !== id))
    } catch (err: any) {
      toast.error(err.message || "Silinemedi.")
    }
  }

  // Filter templates
  const filteredForms = forms.filter(f => {
    const matchesSearch = f.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (f.description && f.description.toLowerCase().includes(searchQuery.toLowerCase()))
    const matchesCategory = selectedCategory === "Tümü" || f.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  // Filter submissions
  const filteredSubmissions = submissions.filter(s => {
    const query = searchQuery.toLowerCase()
    return s.form?.title?.toLowerCase().includes(query) ||
      s.project?.title?.toLowerCase().includes(query) ||
      s.user?.name?.toLowerCase().includes(query)
  })

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
              <FileCheck2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                Dinamik Denetim Formu Oluşturucu
              </h1>
              <p className="text-xs sm:text-sm text-slate-400">
                Saha personeli ve yapı denetimciler için kontrol listeleri ve fotoğraf kanıtlı denetim kayıtları
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/admin/forms/builder"
            className="px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white shadow-lg shadow-cyan-500/20 transition-all flex items-center gap-2 shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Yeni Form Şablonu Yarat</span>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400 font-medium">Toplam Form Şablonu</p>
            <h3 className="text-2xl font-bold text-white mt-1">{forms.length}</h3>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
            <Layers className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400 font-medium">Tamamlanan Saha Denetimleri</p>
            <h3 className="text-2xl font-bold text-emerald-400 mt-1">{submissions.length}</h3>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400 font-medium">Aktif Denetim Kategorisi</p>
            <h3 className="text-2xl font-bold text-cyan-400 mt-1">
              {new Set(forms.map(f => f.category || "GENEL")).size}
            </h3>
          </div>
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
            <ShieldCheck className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800">
        <button
          onClick={() => setActiveTab("templates")}
          className={`px-4 py-2.5 text-xs sm:text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === "templates"
              ? "border-cyan-500 text-cyan-400"
              : "border-transparent text-slate-400 hover:text-white"
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Form Şablonları ({forms.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("submissions")}
          className={`px-4 py-2.5 text-xs sm:text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === "submissions"
              ? "border-cyan-500 text-cyan-400"
              : "border-transparent text-slate-400 hover:text-white"
          }`}
        >
          <CheckSquare className="w-4 h-4" />
          <span>Saha Denetim Kayıtları ({submissions.length})</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={activeTab === "templates" ? "Form şablonlarında ara..." : "Denetimlerde, proje veya personelde ara..."}
            className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </div>

        {activeTab === "templates" && (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-colors border ${
                  selectedCategory === cat
                    ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/30"
                    : "bg-slate-900 text-slate-400 border-slate-800 hover:text-white"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* TAB 1: FORM TEMPLATES */}
      {activeTab === "templates" && (
        <>
          {loading ? (
            <div className="py-20 flex items-center justify-center gap-3 text-slate-400">
              <Loader2 className="w-6 h-6 animate-spin text-cyan-400" />
              <span>Form şablonları yükleniyor...</span>
            </div>
          ) : filteredForms.length === 0 ? (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center mx-auto text-slate-500">
                <FileCheck2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Henüz Form Şablonu Bulunmuyor</h3>
                <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                  Saha denetçilerinizin mobil cihazlarından doldurabileceği yangın, kalıp veya İSG formlarını oluşturun.
                </p>
              </div>
              <Link
                href="/admin/forms/builder"
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl"
              >
                <Plus className="w-4 h-4" />
                İlk Form Şablonunu Yarat
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredForms.map((form) => (
                <div
                  key={form.id}
                  className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 shadow-sm space-y-4 flex flex-col justify-between transition-all group"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                        {form.category || "GENEL"}
                      </span>
                      <span className="text-[11px] text-slate-500 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(form.createdAt).toLocaleDateString("tr-TR")}
                      </span>
                    </div>

                    <div>
                      <h3 className="text-base font-bold text-white group-hover:text-cyan-300 transition-colors">
                        {form.title}
                      </h3>
                      {form.description && (
                        <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                          {form.description}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-4 text-xs text-slate-400 pt-2 border-t border-slate-800/60">
                      <span className="flex items-center gap-1.5 font-medium text-slate-300">
                        <CheckSquare className="w-3.5 h-3.5 text-blue-400" />
                        {Array.isArray(form.fields) ? form.fields.length : 0} Kontrol Maddesi
                      </span>
                      <span className="flex items-center gap-1.5 font-medium text-slate-300">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        {form._count?.submissions ?? 0} Denetim
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-3 border-t border-slate-800/80">
                    <button
                      onClick={() => setPreviewForm(form)}
                      className="flex-1 py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 hover:text-white transition-colors flex items-center justify-center gap-1.5"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Önizle</span>
                    </button>

                    <Link
                      href={`/admin/forms/builder?id=${form.id}`}
                      className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                      title="Düzenle"
                    >
                      <Edit3 className="w-4 h-4" />
                    </Link>

                    <button
                      onClick={() => handleDeleteForm(form.id, form.title)}
                      className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition-colors"
                      title="Sil"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* TAB 2: INSPECTION SUBMISSIONS */}
      {activeTab === "submissions" && (
        <>
          {loading ? (
            <div className="py-20 flex items-center justify-center gap-3 text-slate-400">
              <Loader2 className="w-6 h-6 animate-spin text-cyan-400" />
              <span>Saha denetimleri yükleniyor...</span>
            </div>
          ) : filteredSubmissions.length === 0 ? (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center mx-auto text-slate-500">
                <CheckSquare className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-white">Kayıtlı Saha Denetimi Yok</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Saha personeli mobil panelden (/personnel/forms) form doldurduğunda kayıtlar burada görüntülenecektir.
              </p>
            </div>
          ) : (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead className="bg-slate-950/80 border-b border-slate-800 text-[11px] uppercase tracking-wider text-slate-400">
                    <tr>
                      <th className="py-3 px-4">Form Şablonu</th>
                      <th className="py-3 px-4">Proje</th>
                      <th className="py-3 px-4">Denetçi / Personel</th>
                      <th className="py-3 px-4">Tarih</th>
                      <th className="py-3 px-4">Durum</th>
                      <th className="py-3 px-4 text-right">İşlem</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80">
                    {filteredSubmissions.map((sub) => (
                      <tr key={sub.id} className="hover:bg-slate-850/60 transition-colors">
                        <td className="py-3.5 px-4 font-semibold text-white">
                          <div>
                            <span>{sub.form?.title || "Silinmiş Form"}</span>
                            <span className="block text-[11px] text-cyan-400 font-normal">
                              {sub.form?.category || "GENEL"}
                            </span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-slate-300 font-medium">
                          <span className="flex items-center gap-1.5">
                            <Building2 className="w-3.5 h-3.5 text-slate-500" />
                            {sub.project?.title || "Bilinmiyor"}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-slate-300">
                          <span className="flex items-center gap-1.5">
                            <User className="w-3.5 h-3.5 text-slate-500" />
                            {sub.user?.name || "Saha Sorumlusu"}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-slate-400 text-xs">
                          {new Date(sub.createdAt).toLocaleString("tr-TR", {
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit"
                          })}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            <CheckCircle2 className="w-3 h-3" />
                            {sub.status === "COMPLETED" ? "Tamamlandı" : sub.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={() => setViewSubmission(sub)}
                            className="px-3 py-1.5 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 text-xs font-semibold transition-colors inline-flex items-center gap-1"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>İncele</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* PREVIEW FORM TEMPLATE MODAL */}
      {previewForm && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-xl w-full p-6 shadow-2xl max-h-[85vh] overflow-y-auto space-y-5">
            <div className="flex items-start justify-between border-b border-slate-800 pb-4">
              <div>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 uppercase">
                  {previewForm.category || "GENEL"}
                </span>
                <h3 className="text-lg font-bold text-white mt-1">{previewForm.title}</h3>
                {previewForm.description && (
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">{previewForm.description}</p>
                )}
              </div>
              <button
                onClick={() => setPreviewForm(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Form Alanları ({Array.isArray(previewForm.fields) ? previewForm.fields.length : 0})
              </h4>
              <div className="space-y-2.5">
                {Array.isArray(previewForm.fields) && previewForm.fields.map((field: any, i: number) => (
                  <div key={i} className="p-3 bg-slate-950 border border-slate-850 rounded-xl space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-white">
                        {i + 1}. {field.label}
                        {field.required && <span className="text-rose-400 ml-1">*</span>}
                      </span>
                      <span className="text-[10px] uppercase font-bold text-slate-500">
                        {field.type}
                      </span>
                    </div>
                    {field.placeholder && (
                      <p className="text-[11px] text-slate-500">İpucu: {field.placeholder}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setPreviewForm(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold"
              >
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}

      {/* VIEW SUBMISSION DETAIL MODAL */}
      {viewSubmission && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto space-y-5">
            <div className="flex items-start justify-between border-b border-slate-800 pb-4">
              <div>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 uppercase">
                  {viewSubmission.form?.category || "GENEL"}
                </span>
                <h3 className="text-lg font-bold text-white mt-1">{viewSubmission.form?.title}</h3>
                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 mt-2">
                  <span className="flex items-center gap-1">
                    <Building2 className="w-3.5 h-3.5 text-blue-400" />
                    {viewSubmission.project?.title || "Proje Bilgisi Yok"}
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <User className="w-3.5 h-3.5 text-purple-400" />
                    {viewSubmission.user?.name || "Personel"}
                  </span>
                  <span>•</span>
                  <span>
                    {new Date(viewSubmission.createdAt).toLocaleString("tr-TR")}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setViewSubmission(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Answers Breakdown */}
            <div className="space-y-4">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <CheckSquare className="w-4 h-4 text-emerald-400" />
                Cevaplanan Denetim Maddeleri
              </h4>

              <div className="space-y-3">
                {Array.isArray(viewSubmission.form?.fields) && viewSubmission.form.fields.map((field: any, idx: number) => {
                  const answer = viewSubmission.answers?.[field.id]
                  return (
                    <div key={field.id || idx} className="bg-slate-950 border border-slate-800/80 rounded-2xl p-4 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-xs sm:text-sm font-semibold text-slate-200">
                          {idx + 1}. {field.label}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400 uppercase">
                          {field.type}
                        </span>
                      </div>

                      {/* Display Answer based on type */}
                      <div className="pt-1">
                        {field.type === "checkbox" && (
                          <div>
                            {answer === true || answer === "true" || answer === "UYGUN" ? (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                <CheckCircle2 className="w-4 h-4" />
                                Uygun / Sağlandı
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                                <AlertCircle className="w-4 h-4" />
                                Uygun Değil / Eksik
                              </span>
                            )}
                          </div>
                        )}

                        {(field.type === "text" || field.type === "textarea" || field.type === "select" || field.type === "number") && (
                          <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs sm:text-sm text-white font-medium">
                            {answer ? String(answer) : <span className="text-slate-500 italic">Belirtilmedi</span>}
                          </div>
                        )}

                        {field.type === "photo" && (
                          <div>
                            {answer ? (
                              <div className="space-y-2">
                                <div 
                                  onClick={() => setLightboxImage(String(answer))}
                                  className="relative group cursor-pointer inline-block rounded-xl overflow-hidden border border-slate-700 w-44 h-32 bg-slate-900"
                                >
                                  <img
                                    src={String(answer)}
                                    alt="Saha Kanıtı"
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                  />
                                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1 text-white text-xs font-semibold">
                                    <Eye className="w-4 h-4" />
                                    <span>Büyüt</span>
                                  </div>
                                </div>
                                <p className="text-[11px] text-slate-400">Resme tıklayarak büyütebilirsiniz.</p>
                              </div>
                            ) : (
                              <span className="text-xs text-slate-500 italic">Fotoğraf yüklenmedi</span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* General Notes */}
              {viewSubmission.notes && (
                <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-1">
                  <span className="text-xs font-semibold text-slate-400">Denetçi Ek Notları:</span>
                  <p className="text-xs sm:text-sm text-slate-200 leading-relaxed whitespace-pre-wrap">
                    {viewSubmission.notes}
                  </p>
                </div>
              )}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setViewSubmission(null)}
                className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold transition-colors"
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
          <div className="relative max-w-4xl max-h-[90vh]">
            <img
              src={lightboxImage}
              alt="Büyük Boy Kanıt Fotoğrafı"
              className="max-w-full max-h-[85vh] object-contain rounded-xl shadow-2xl"
            />
            <button
              onClick={() => setLightboxImage(null)}
              className="absolute top-2 right-2 p-2 bg-slate-900/80 text-white rounded-full hover:bg-slate-800"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
