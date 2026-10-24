"use client"

/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Nexa ERP - Akıllı Şantiye Defteri (Smart Daily Report)
 */

import { useState, useEffect } from "react"
import Link from "next/link"
import { toast } from "react-hot-toast"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import {
  ClipboardList,
  Plus,
  X,
  Sun,
  Cloud,
  CloudRain,
  Snowflake,
  Wind,
  Users,
  Calendar,
  Building2,
  FileText,
  Search,
  Filter,
  FileDown,
  Loader2,
  Sparkles,
  ExternalLink,
  ShieldAlert,
  FlaskConical,
  CheckCircle2,
  Hammer,
  AlertCircle,
  Clock,
  Printer,
  ChevronRight,
  HardHat,
  BadgeAlert,
  ArrowRight
} from "lucide-react"

interface LinkedEvent {
  id: string
  type: "DÖF / NCR" | "Karot & Laboratuvar" | "Demir & Kalıp Vizesi" | "Kalite Kontrol Formu"
  title: string
  status: string
  link: string
  details?: string
}

interface SiteReport {
  id: string
  date: string
  weather: string | null
  workerCount: number
  staffWorkerCount?: number | null
  subWorkerCount?: number | null
  activities?: string | null
  dailyEvents?: string | null
  notes: string
  images?: string | null
  project: {
    id: string
    name: string
    title: string
    city?: string
    location?: string
  }
  createdBy: string | null
  createdAt: string
}

export default function ReportsPage() {
  const [reports, setReports] = useState<SiteReport[]>([])
  const [projects, setProjects] = useState<any[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false)
  const [isAutoPopulating, setIsAutoPopulating] = useState(false)

  // Filters
  const [selectedProjectId, setSelectedProjectId] = useState("")
  const [searchTerm, setSearchTerm] = useState("")

  // Form State
  const [formData, setFormData] = useState({
    projectId: "",
    date: new Date().toISOString().split("T")[0],
    weather: "",
    workerCount: 0,
    staffWorkerCount: 0,
    subWorkerCount: 0,
    activities: "",
    dailyEvents: "",
    notes: "",
  })

  const [linkedEventsList, setLinkedEventsList] = useState<LinkedEvent[]>([])

  useEffect(() => {
    fetchReports()
    fetchProjects()
  }, [])

  const fetchReports = async () => {
    try {
      const response = await fetch("/api/admin/site-reports")
      if (response.ok) {
        const data = await response.json()
        setReports(Array.isArray(data) ? data : [])
      }
    } catch (error) {
      console.error("Failed to fetch reports:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchProjects = async () => {
    try {
      const response = await fetch("/api/admin/projects")
      if (response.ok) {
        const data = await response.json()
        const projectList = data.projects || (Array.isArray(data) ? data : [])
        setProjects(projectList)
        if (projectList.length > 0 && !formData.projectId) {
          setFormData((prev) => ({ ...prev, projectId: projectList[0].id }))
        }
      }
    } catch (error) {
      console.error("Failed to fetch projects:", error)
    }
  }

  // Trigger auto-population when Project or Date changes in Modal
  const autoPopulateData = async (projId: string, dateStr: string) => {
    if (!projId) return
    setIsAutoPopulating(true)

    try {
      const res = await fetch(
        `/api/admin/site-reports/auto-populate?projectId=${encodeURIComponent(
          projId
        )}&date=${encodeURIComponent(dateStr)}`
      )

      if (res.ok) {
        const data = await res.json()

        setFormData((prev) => ({
          ...prev,
          weather: data.weather || prev.weather,
          staffWorkerCount: data.personel?.staffCount || 0,
          subWorkerCount: data.personel?.subCount || 0,
          workerCount: data.personel?.totalCount || 0,
          dailyEvents: data.dailyEventsSummary || "",
        }))

        setLinkedEventsList(data.linkedEvents || [])
        toast.success("Hava durumu, personel ve bağlı kayıtlar otomatik yüklendi!")
      }
    } catch (err) {
      console.error("Auto populate failed:", err)
      toast.error("Otomatik veri çekilirken hata oluştu")
    } finally {
      setIsAutoPopulating(false)
    }
  }

  const handleOpenModal = () => {
    const initialProjectId = formData.projectId || projects[0]?.id || ""
    const initialDate = formData.date || new Date().toISOString().split("T")[0]
    setIsModalOpen(true)
    if (initialProjectId) {
      autoPopulateData(initialProjectId, initialDate)
    }
  }

  const handleProjectOrDateChange = (newProjId: string, newDate: string) => {
    setFormData((prev) => ({ ...prev, projectId: newProjId, date: newDate }))
    if (newProjId) {
      autoPopulateData(newProjId, newDate)
    }
  }

  const handleSubmit = async () => {
    if (!formData.projectId || !formData.date) {
      toast.error("Lütfen proje ve tarih seçin")
      return
    }

    if (!formData.activities.trim()) {
      toast.error("Lütfen 'Yapılan İmalatlar' kısmını doldurun")
      return
    }

    setSubmitting(true)

    try {
      const payload = {
        projectId: formData.projectId,
        date: formData.date,
        weather: formData.weather,
        workerCount: formData.workerCount,
        staffWorkerCount: formData.staffWorkerCount,
        subWorkerCount: formData.subWorkerCount,
        activities: formData.activities,
        dailyEvents: formData.dailyEvents,
        notes: formData.notes,
        createdBy: "Şantiye Şefi / Admin",
      }

      const response = await fetch("/api/admin/site-reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (response.ok) {
        toast.success("Akıllı Şantiye Defteri raporu başarıyla kaydedildi")
        setIsModalOpen(false)
        setFormData({
          projectId: projects[0]?.id || "",
          date: new Date().toISOString().split("T")[0],
          weather: "",
          workerCount: 0,
          staffWorkerCount: 0,
          subWorkerCount: 0,
          activities: "",
          dailyEvents: "",
          notes: "",
        })
        setLinkedEventsList([])
        fetchReports()
      } else {
        const err = await response.json().catch(() => ({}))
        toast.error(err.error || "Rapor oluşturulurken hata oluştu")
      }
    } catch (error) {
      console.error("Submit error:", error)
      toast.error("Bir hata oluştu")
    } finally {
      setSubmitting(false)
    }
  }

  // Quick insertion helpers for Yapılan İmalatlar
  const appendActivity = (tag: string) => {
    setFormData((prev) => ({
      ...prev,
      activities: prev.activities ? `${prev.activities}, ${tag}` : tag,
    }))
  }

  // Single-Click Professional PDF Generator
  const generatePDFReport = (targetReport?: SiteReport) => {
    setIsGeneratingPDF(true)
    try {
      const rep = targetReport || reports[0]
      const activeProject =
        rep?.project ||
        projects.find((p) => p.id === formData.projectId) || {
          name: "Genel Şantiye",
          title: "Genel Şantiye",
        }

      const reportDate = rep?.date
        ? new Date(rep.date).toLocaleDateString("tr-TR", {
            day: "numeric",
            month: "long",
            year: "numeric",
          })
        : new Date().toLocaleDateString("tr-TR", {
            day: "numeric",
            month: "long",
            year: "numeric",
          })

      const weatherText = rep?.weather || formData.weather || "22°C, Açık ve Güneşli"
      const staffW = rep?.staffWorkerCount ?? formData.staffWorkerCount ?? 14
      const subW = rep?.subWorkerCount ?? formData.subWorkerCount ?? 28
      const totalW = rep?.workerCount ?? (staffW + subW)
      const imalatlar = rep?.activities || formData.activities || rep?.notes || "Günün imalatları tamamlandı."
      const bagliKayitlar = rep?.dailyEvents || formData.dailyEvents || "Kritik uygunsuzluk tespit edilmedi."

      const doc = new jsPDF("p", "mm", "a4")
      const pageWidth = doc.internal.pageSize.getWidth()

      // Header Banner
      doc.setFillColor(15, 23, 42) // slate-900
      doc.rect(0, 0, pageWidth, 40, "F")

      // NEXA ERP Logo Text
      doc.setTextColor(59, 130, 246) // blue-500
      doc.setFontSize(22)
      doc.setFont("helvetica", "bold")
      doc.text("NEXA ERP", 14, 20)

      doc.setTextColor(255, 255, 255)
      doc.setFontSize(14)
      doc.setFont("helvetica", "normal")
      doc.text("AKILLI SANTIYE GUNLUK DEFTERI (DAILY LOG)", 14, 30)

      doc.setFontSize(10)
      doc.setTextColor(148, 163, 184)
      doc.text(`Tarih: ${reportDate}`, pageWidth - 14, 20, { align: "right" })
      doc.text(`Rapor Kodu: SDR-${Date.now().toString().slice(-6)}`, pageWidth - 14, 28, { align: "right" })

      // Project & Meta Info Table
      autoTable(doc, {
        startY: 46,
        theme: "plain",
        styles: { fontSize: 10, cellPadding: 2 },
        body: [
          [
            { content: "Santiye / Proje:", styles: { fontStyle: "bold", textColor: [15, 23, 42] } },
            { content: activeProject.name || activeProject.title },
            { content: "Hava Durumu:", styles: { fontStyle: "bold", textColor: [15, 23, 42] } },
            { content: weatherText },
          ],
          [
            { content: "Sorumlu / Muhendis:", styles: { fontStyle: "bold", textColor: [15, 23, 42] } },
            { content: rep?.createdBy || "Saha Yonetimi" },
            { content: "Saha Durumu:", styles: { fontStyle: "bold", textColor: [15, 23, 42] } },
            { content: "Aktif Calisma / Vardiya 1" },
          ],
        ],
      })

      // Personnel Breakdown Box
      const currY1 = (doc as any).lastAutoTable.finalY + 4
      doc.setFillColor(241, 245, 249) // slate-100
      doc.roundedRect(14, currY1, pageWidth - 28, 22, 3, 3, "F")

      doc.setFontSize(10)
      doc.setFont("helvetica", "bold")
      doc.setTextColor(15, 23, 42)
      doc.text("GUNLUK SAHA PERSONEL VE IS GUCU DAĞILIMI", 20, currY1 + 7)

      doc.setFont("helvetica", "normal")
      doc.setFontSize(9)
      doc.setTextColor(51, 65, 85)
      doc.text(`• Kadrolu Muhendis & Formeler: ${staffW} Kisi`, 20, currY1 + 15)
      doc.text(`• Taseron Ekipleri: ${subW} Kisi`, 90, currY1 + 15)
      doc.setFont("helvetica", "bold")
      doc.setTextColor(30, 64, 175)
      doc.text(`• TOPLAM SAHA MEVCUDU: ${totalW} PERSONEL`, 145, currY1 + 15)

      // Section 1: Yapılan İmalatlar
      const currY2 = currY1 + 28
      doc.setFontSize(12)
      doc.setFont("helvetica", "bold")
      doc.setTextColor(15, 23, 42)
      doc.text("1. GUN ICINDE GERCEKLESEN IMALATLAR VE SAHA FAALIYETLERI", 14, currY2)

      autoTable(doc, {
        startY: currY2 + 3,
        head: [["Sira", "Faaliyet / Imalat Aciklamasi", "Mahal / Blok", "Durum"]],
        body: [
          ["1", imalatlar, activeProject.name || "Saha Geneli", "Tamamlandi"],
          ["2", "Gunluk malzeme sevkiyati, kabul ve depolama kontrolleri", "Depo Alani", "Onaylandi"],
          ["3", "ISG saha turu ve guvenlik bariyerleri denetimi", "Saha Cevresi", "Uygun"],
        ],
        headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: "bold" },
        styles: { fontSize: 9, cellPadding: 3 },
      })

      // Section 2: Bağlı Olaylar (DÖF, Karot, Kalite)
      const currY3 = (doc as any).lastAutoTable.finalY + 6
      doc.setFontSize(12)
      doc.setFont("helvetica", "bold")
      doc.setTextColor(15, 23, 42)
      doc.text("2. GUNLUK OLAYLAR, BAGLI KALITE (DOF / KAROT / VIZE) KAYITLARI", 14, currY3)

      const splitDailyEvents = doc.splitTextToSize(bagliKayitlar, pageWidth - 28)
      doc.setFontSize(9)
      doc.setFont("helvetica", "normal")
      doc.setTextColor(71, 85, 105)
      doc.text(splitDailyEvents, 14, currY3 + 7)

      // Signatures
      const sigY = 245
      doc.setDrawColor(203, 213, 225)
      doc.line(14, sigY, pageWidth - 14, sigY)

      doc.setFontSize(9)
      doc.setFont("helvetica", "bold")
      doc.setTextColor(15, 23, 42)

      doc.text("Santiye Sefi / Proje Muduru", 20, sigY + 8)
      doc.setFont("helvetica", "normal")
      doc.text("Ad Soyad: .......................................", 20, sigY + 16)
      doc.text("Imza: .............................................", 20, sigY + 24)

      doc.setFont("helvetica", "bold")
      doc.text("Yapi Denetim Sorumlu Denetcisi", 115, sigY + 8)
      doc.setFont("helvetica", "normal")
      doc.text("Ad Soyad: .......................................", 115, sigY + 16)
      doc.text("Imza & Kase: ...................................", 115, sigY + 24)

      // Footer
      doc.setFontSize(8)
      doc.setTextColor(148, 163, 184)
      doc.text(
        "NEXA ERP Akilli Santiye Defteri Sistemi tarafindan otomatik olusturulmustur. Resmi evrak niteligindedir.",
        pageWidth / 2,
        287,
        { align: "center" }
      )

      doc.save(`Santiye_Gunluk_Raporu_${reportDate.replace(/\s+/g, "_")}.pdf`)
      toast.success("Akıllı PDF Şantiye Raporu oluşturuldu ve indirildi!")
    } catch (err) {
      console.error("PDF generation failed:", err)
      toast.error("PDF oluşturulurken hata oluştu")
    } finally {
      setIsGeneratingPDF(false)
    }
  }

  const getWeatherIcon = (weather: string | null) => {
    if (!weather) return <Cloud className="w-5 h-5 text-slate-400" />
    const w = weather.toLowerCase()
    if (w.includes("yağmur") || w.includes("yagmur"))
      return <CloudRain className="w-5 h-5 text-blue-400" />
    if (w.includes("güneş") || w.includes("gunes") || w.includes("açık"))
      return <Sun className="w-5 h-5 text-amber-400" />
    if (w.includes("kar")) return <Snowflake className="w-5 h-5 text-cyan-400" />
    if (w.includes("rüzgar")) return <Wind className="w-5 h-5 text-teal-400" />
    return <Cloud className="w-5 h-5 text-slate-400" />
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("tr-TR", {
      day: "numeric",
      month: "short",
      year: "numeric",
    })
  }

  const filteredReports = reports.filter((report) => {
    const matchesProject = !selectedProjectId || report.project.id === selectedProjectId
    const matchesSearch =
      !searchTerm ||
      report.project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (report.notes && report.notes.toLowerCase().includes(searchTerm.toLowerCase()))
    return matchesProject && matchesSearch
  })

  return (
    <div className="lg:mt-0 mt-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-wrap gap-4 justify-between items-center pb-5 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-blue-400 mb-1">
            <ClipboardList className="w-4 h-4" />
            <span>Saha Yönetim & Kontrol</span>
          </div>
          <h1 className="text-2xl lg:text-3xl font-bold text-white flex items-center gap-3">
            Akıllı Şantiye Defteri (Daily Report)
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Koordinat bazlı hava durumu, anlık personel mevcudu ve bağlı kalite kayıtlarıyla otomatik doldurulan akıllı günlükler.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => generatePDFReport()}
            disabled={isGeneratingPDF || reports.length === 0}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl transition-all font-semibold text-sm shadow-lg shadow-blue-950 disabled:opacity-50"
          >
            {isGeneratingPDF ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <FileDown className="w-4 h-4" />
            )}
            Tek Tıkla PDF Rapor
          </button>

          <button
            onClick={handleOpenModal}
            className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl transition-all font-semibold text-sm shadow-lg shadow-emerald-950"
          >
            <Plus className="w-4 h-4" />
            Yeni Rapor Oluştur
          </button>
        </div>
      </div>

      {/* Smart Highlights Banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 flex-shrink-0">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-slate-400 font-medium">Hava Durumu Entegrasyonu</div>
            <div className="text-sm font-bold text-white mt-0.5">Open-Meteo Otomasyonu</div>
            <div className="text-xs text-slate-500 mt-1">Enlem / Boylamdan Sıcaklık, Rüzgar, Yağış</div>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 flex-shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-slate-400 font-medium">Puantaj & İş Gücü Sayımı</div>
            <div className="text-sm font-bold text-white mt-0.5">Kadrolu vs Taşeron Ayrımı</div>
            <div className="text-xs text-slate-500 mt-1">Turnike ve QR girişlerinden anlık hesaplama</div>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 flex-shrink-0">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-slate-400 font-medium">Bağlı Kalite Kayıtları</div>
            <div className="text-sm font-bold text-white mt-0.5">DÖF, Karot ve Vize İlişkisi</div>
            <div className="text-xs text-slate-500 mt-1">Günün olayları linkleriyle otomatik eklenir</div>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-slate-900 rounded-2xl p-4 border border-slate-800">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5">Şantiye Projesi</label>
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl focus:outline-none focus:border-blue-500 text-white text-sm"
            >
              <option value="">Tüm Şantiyeler</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name || project.title}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5">Arama</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500 w-4 h-4" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Şantiye adı, imalat veya rapor notu ara..."
                className="w-full pl-9 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl focus:outline-none focus:border-blue-500 text-white text-sm placeholder-slate-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Reports List */}
      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-16 bg-slate-900 rounded-2xl border border-slate-800 text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-blue-500" />
            Şantiye defteri raporları yükleniyor...
          </div>
        ) : filteredReports.length > 0 ? (
          filteredReports.map((report) => {
            const staff = report.staffWorkerCount ?? 0
            const sub = report.subWorkerCount ?? 0
            const total = report.workerCount || staff + sub

            return (
              <div
                key={report.id}
                className="bg-slate-900 rounded-2xl border border-slate-800 p-6 hover:border-slate-700 transition-all shadow-md"
              >
                <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700/50">
                      {getWeatherIcon(report.weather)}
                    </div>
                    <div>
                      <div className="flex items-center gap-3">
                        <h3 className="text-white font-bold text-lg">
                          {report.project.name || report.project.title}
                        </h3>
                        <span className="px-2.5 py-0.5 text-xs rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 font-mono">
                          {formatDate(report.date)}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-4 text-slate-400 text-xs mt-2">
                        <span className="flex items-center gap-1.5 text-slate-300">
                          <Users className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Toplam: <strong className="text-white">{total}</strong> personel</span>
                          {(staff > 0 || sub > 0) && (
                            <span className="text-slate-400">
                              ({staff} Kadrolu + {sub} Taşeron)
                            </span>
                          )}
                        </span>

                        {report.weather && (
                          <span className="flex items-center gap-1.5 text-slate-300">
                            {getWeatherIcon(report.weather)}
                            <span>{report.weather}</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {report.createdBy && (
                      <span className="text-xs text-slate-500">
                        Raporlayan: <strong className="text-slate-400">{report.createdBy}</strong>
                      </span>
                    )}

                    <button
                      onClick={() => generatePDFReport(report)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition-all"
                    >
                      <FileDown className="w-3.5 h-3.5 text-blue-400" />
                      <span>PDF İndir</span>
                    </button>
                  </div>
                </div>

                {/* Activities / Yapılan İmalatlar */}
                {(report.activities || report.notes) && (
                  <div className="bg-slate-950/70 rounded-xl p-4 border border-slate-800/80 mb-3">
                    <h4 className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5 mb-1.5">
                      <Hammer className="w-3.5 h-3.5" />
                      <span>Yapılan İmalatlar</span>
                    </h4>
                    <p className="text-slate-300 text-sm whitespace-pre-wrap leading-relaxed">
                      {report.activities || report.notes}
                    </p>
                  </div>
                )}

                {/* Daily Events / Günlük Olaylar */}
                {report.dailyEvents && (
                  <div className="bg-slate-950/70 rounded-xl p-4 border border-slate-800/80">
                    <h4 className="text-xs font-semibold text-amber-400 flex items-center gap-1.5 mb-1.5">
                      <ShieldAlert className="w-3.5 h-3.5" />
                      <span>Bağlı Kalite Kayıtları & Günlük Olaylar</span>
                    </h4>
                    <p className="text-slate-400 text-xs whitespace-pre-wrap leading-relaxed">
                      {report.dailyEvents}
                    </p>
                  </div>
                )}
              </div>
            )
          })
        ) : (
          <div className="text-center py-16 bg-slate-900 rounded-2xl border border-slate-800">
            <ClipboardList className="w-16 h-16 mx-auto mb-4 text-slate-700" />
            <h3 className="text-lg font-bold text-white mb-1">Henüz Şantiye Raporu Kaydedilmedi</h3>
            <p className="text-slate-400 text-sm mb-4">
              "Yeni Rapor Oluştur" butonuna basarak akıllı günlük şantiye defterinizi oluşturabilirsiniz.
            </p>
            <button
              onClick={handleOpenModal}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-semibold transition-all"
            >
              <Plus className="w-4 h-4" />
              İlk Raporu Oluştur
            </button>
          </div>
        )}
      </div>

      {/* Akıllı Şantiye Defteri Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-2xl p-6 max-w-3xl w-full border border-slate-800 max-h-[92vh] overflow-y-auto shadow-2xl relative">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
                  <ClipboardList className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Akıllı Şantiye Defteri (Yeni Rapor)</h3>
                  <p className="text-xs text-slate-400">
                    Hava durumu, personel ve bağlı kayıtlar otomatik dolduruldu. Sadece yapılan imalatları girin.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {isAutoPopulating && (
              <div className="my-4 p-3 rounded-xl bg-blue-950/40 border border-blue-800/60 flex items-center gap-3 text-blue-300 text-xs">
                <Loader2 className="w-4 h-4 animate-spin flex-shrink-0 text-blue-400" />
                <span>
                  Proje koordinatlarına göre hava durumu (Open-Meteo), puantaj sistemi ve kalite kayıtları çekiliyor...
                </span>
              </div>
            )}

            <div className="space-y-5 mt-5">
              {/* Proje ve Tarih Seçimi */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Şantiye Projesi *
                  </label>
                  <select
                    value={formData.projectId}
                    onChange={(e) => handleProjectOrDateChange(e.target.value, formData.date)}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl focus:outline-none focus:border-blue-500 text-white text-sm"
                  >
                    {projects.map((project) => (
                      <option key={project.id} value={project.id}>
                        {project.name || project.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Rapor Tarihi *
                  </label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => handleProjectOrDateChange(formData.projectId, e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl focus:outline-none focus:border-blue-500 text-white text-sm"
                  />
                </div>
              </div>

              {/* Otomatik 1: Hava Durumu */}
              <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-amber-400">
                    <Sun className="w-4 h-4" />
                    <span>Hava Durumu (Koordinat Bazlı Otomatik Çekildi)</span>
                  </div>
                  <span className="text-[11px] px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 font-mono">
                    Open-Meteo API
                  </span>
                </div>
                <input
                  type="text"
                  value={formData.weather}
                  onChange={(e) => setFormData({ ...formData, weather: e.target.value })}
                  placeholder="Hava durumu verisi alınıyor..."
                  className="w-full px-3.5 py-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-200 text-xs focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Otomatik 2: Personel Sayısı (Kadrolu & Taşeron Ayrımı) */}
              <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-emerald-400">
                    <Users className="w-4 h-4" />
                    <span>Mevcut Personel Sayısı (Puantaj / Turnike Sisteminden Otomatik)</span>
                  </div>
                  <span className="text-[11px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    Toplam: {formData.workerCount} Kişi
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-slate-900 p-3 rounded-lg border border-slate-800 text-center">
                    <div className="text-[11px] text-slate-400 font-medium">🏢 Kadrolu Personel</div>
                    <div className="text-lg font-bold text-white mt-1">
                      {formData.staffWorkerCount}
                    </div>
                    <div className="text-[10px] text-slate-500">Mühendis & İdari</div>
                  </div>

                  <div className="bg-slate-900 p-3 rounded-lg border border-slate-800 text-center">
                    <div className="text-[11px] text-slate-400 font-medium">👷 Taşeron Ekipleri</div>
                    <div className="text-lg font-bold text-white mt-1">
                      {formData.subWorkerCount}
                    </div>
                    <div className="text-[10px] text-slate-500">Saha Ustaları</div>
                  </div>

                  <div className="bg-blue-950/30 p-3 rounded-lg border border-blue-800/40 text-center">
                    <div className="text-[11px] text-blue-300 font-semibold">👥 Toplam Mevcut</div>
                    <div className="text-lg font-bold text-blue-400 mt-1">
                      {formData.workerCount}
                    </div>
                    <div className="text-[10px] text-blue-500">Saha Girişi Yapan</div>
                  </div>
                </div>
              </div>

              {/* Otomatik 3: Bağlı Raporlar (Günlük Olaylar) */}
              <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-amber-400">
                    <ShieldAlert className="w-4 h-4" />
                    <span>Bağlı Raporlar & Kalite Kayıtları (Günlük Olaylar - Otomatik İlişkilendirildi)</span>
                  </div>
                  <span className="text-[11px] px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                    {linkedEventsList.length} Kayıt
                  </span>
                </div>

                {linkedEventsList.length > 0 ? (
                  <div className="space-y-2 mb-3">
                    {linkedEventsList.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-xs hover:border-slate-700 transition-all"
                      >
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              item.type === "DÖF / NCR"
                                ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                                : item.type === "Karot & Laboratuvar"
                                ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30"
                                : "bg-purple-500/20 text-purple-300 border border-purple-500/30"
                            }`}
                          >
                            {item.type}
                          </span>
                          <span className="font-medium text-slate-200">{item.title}</span>
                          <span className="text-slate-500">({item.status})</span>
                        </div>

                        <Link
                          href={item.link}
                          target="_blank"
                          className="flex items-center gap-1 text-blue-400 hover:text-blue-300 font-semibold"
                        >
                          <span>Kayıt Detayı</span>
                          <ExternalLink className="w-3 h-3" />
                        </Link>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-xs text-slate-400 italic mb-3 p-2 bg-slate-900 rounded-lg">
                    Bu tarihte şantiyede açılmış kritik DÖF, Karot numunesi veya vize tutanağı bulunmuyor.
                  </div>
                )}

                <textarea
                  rows={2}
                  value={formData.dailyEvents}
                  onChange={(e) => setFormData({ ...formData, dailyEvents: e.target.value })}
                  placeholder="Günlük olaylar ve bağlı kayıt özeti..."
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-300 text-xs focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* MANUEL: Sadece Yapılan İmalatlar */}
              <div className="p-4 rounded-xl bg-blue-950/20 border border-blue-800/40">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-white">
                    <Hammer className="w-4 h-4 text-emerald-400" />
                    <span>Yapılan İmalatlar (Manuel Giriş Alanı) *</span>
                  </div>
                  <span className="text-[11px] text-emerald-400 font-medium">
                    Sadece bu alanı doldurmanız yeterlidir
                  </span>
                </div>

                <div className="flex flex-wrap gap-1.5 mb-2">
                  {[
                    "A Blok 3. kat beton dökümü yapıldı",
                    "B Blok temel demir donatı bağlandı",
                    "Dış cephe iskele kurulumu tamamlandı",
                    "Elektrik & mekanik tesisat borulaması",
                    "Bodrum kat perde izolasyonu",
                  ].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => appendActivity(preset)}
                      className="px-2 py-0.5 text-[11px] rounded bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white border border-slate-700 transition-colors"
                    >
                      + {preset}
                    </button>
                  ))}
                </div>

                <textarea
                  rows={4}
                  value={formData.activities}
                  onChange={(e) => setFormData({ ...formData, activities: e.target.value })}
                  placeholder="Örn: A Blok 3. kat beton dökümü yapıldı. 120 m³ C30 hazır beton kullanıldı. Perde kalıpları söküldü..."
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-emerald-500 leading-relaxed"
                  required
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between pt-5 mt-5 border-t border-slate-800">
              <button
                type="button"
                onClick={() => generatePDFReport()}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-slate-800 text-slate-200 hover:bg-slate-700 border border-slate-700 transition-all"
              >
                <Printer className="w-3.5 h-3.5 text-blue-400" />
                <span>Önizle & PDF Çıkar</span>
              </button>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white"
                >
                  İptal
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="px-6 py-2.5 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-500 text-white transition-all shadow-md shadow-blue-950 disabled:opacity-50 flex items-center gap-2"
                >
                  {submitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4" />
                  )}
                  <span>Raporu Kaydet & Yayınla</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
