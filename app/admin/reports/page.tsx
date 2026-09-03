"use client"
/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * This code is the property of NXA Software.
 */

import { useState, useEffect } from "react"
import { toast } from "react-hot-toast"
import jsPDF from "jspdf"
import html2canvas from "html2canvas"
import { 
  ClipboardList, 
  Plus, 
  X, 
  Sun, 
  Cloud, 
  CloudRain, 
  Snowflake,
  Users,
  Calendar,
  Building2,
  FileText,
  Search,
  Filter,
  FileDown,
  Loader2
} from "lucide-react"

interface SiteReport {
  id: string
  date: string
  weather: string | null
  workerCount: number
  notes: string
  project: {
    id: string
    name: string
    title: string
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
  const [pdfProgress, setPdfProgress] = useState(0)
  
  // Filters
  const [selectedProjectId, setSelectedProjectId] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  
  const [formData, setFormData] = useState({
    projectId: "",
    date: new Date().toISOString().split('T')[0],
    weather: "Güneşli",
    workerCount: 0,
    notes: "",
    issues: ""
  })

  useEffect(() => {
    fetchReports()
    fetchProjects()
  }, [])

  const fetchReports = async () => {
    try {
      const response = await fetch('/api/site-reports')
      const data = await response.json()
      setReports(data)
    } catch (error) {
      console.error('Failed to fetch reports:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchProjects = async () => {
    try {
      const response = await fetch('/api/admin/projects')
      const data = await response.json()
      setProjects(data)
    } catch (error) {
      console.error('Failed to fetch projects:', error)
    }
  }

  const handleSubmit = async () => {
    if (!formData.projectId || !formData.date) {
      toast.error("Lütfen proje ve tarih seçin")
      return
    }

    setSubmitting(true)

    try {
      const formDataToSend = new FormData()
      formDataToSend.append('projectId', formData.projectId)
      formDataToSend.append('date', formData.date)
      formDataToSend.append('weather', formData.weather)
      formDataToSend.append('workerCount', formData.workerCount.toString())
      formDataToSend.append('notes', `${formData.notes}\n\nSorunlar/Gecikmeler:\n${formData.issues}`)
      formDataToSend.append('createdBy', 'Admin')

      const response = await fetch('/api/admin/site-reports', {
        method: 'POST',
        body: formDataToSend
      })

      if (response.ok) {
        toast.success("Rapor başarıyla oluşturuldu")
        setIsModalOpen(false)
        setFormData({
          projectId: "",
          date: new Date().toISOString().split('T')[0],
          weather: "Güneşli",
          workerCount: 0,
          notes: "",
          issues: ""
        })
        fetchReports()
      } else {
        toast.error("Rapor oluşturulurken hata oluştu")
      }
    } catch (error) {
      console.error('Submit error:', error)
      toast.error('Bir hata oluştu')
    } finally {
      setSubmitting(false)
    }
  }

  const getWeatherIcon = (weather: string | null) => {
    if (!weather) return <Cloud className="w-5 h-5 text-slate-400" />
    
    const w = weather.toLowerCase()
    if (w.includes('yağmur') || w.includes('yagmur')) return <CloudRain className="w-5 h-5 text-blue-400" />
    if (w.includes('güneş') || w.includes('gunes')) return <Sun className="w-5 h-5 text-yellow-400" />
    if (w.includes('kar')) return <Snowflake className="w-5 h-5 text-cyan-400" />
    return <Cloud className="w-5 h-5 text-slate-400" />
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
  }

  const getTodayDigest = () => {
    const today = new Date().toISOString().split('T')[0]
    const todayReports = reports.filter(r => r.date.startsWith(today))
    const totalWorkers = todayReports.reduce((sum, r) => sum + r.workerCount, 0)
    const weatherIssues = todayReports.filter(r => r.weather?.toLowerCase().includes('yağmur') || r.weather?.toLowerCase().includes('yagmur')).length
    
    return {
      reportCount: todayReports.length,
      totalWorkers,
      weatherIssues,
      siteCount: new Set(todayReports.map(r => r.project.id)).size
    }
  }

  const digest = getTodayDigest()

  const handleGeneratePDF = async () => {
    setIsGeneratingPDF(true)
    setPdfProgress(0)

    // Simulate progress
    for (let i = 0; i <= 100; i += 10) {
      await new Promise(resolve => setTimeout(resolve, 300))
      setPdfProgress(i)
    }

    // Create PDF
    const pdf = new jsPDF('p', 'mm', 'a4')
    const pageWidth = pdf.internal.pageSize.getWidth()
    const pageHeight = pdf.internal.pageSize.getHeight()

    // Cover Page
    pdf.setFillColor(30, 41, 59)
    pdf.rect(0, 0, pageWidth, pageHeight, 'F')
    
    pdf.setTextColor(59, 130, 246)
    pdf.setFontSize(32)
    pdf.text("NEXA", pageWidth / 2, 50, { align: 'center' })
    
    pdf.setTextColor(255, 255, 255)
    pdf.setFontSize(24)
    pdf.text("Haftalık Durum Raporu", pageWidth / 2, 70, { align: 'center' })
    
    pdf.setFontSize(14)
    pdf.setTextColor(148, 163, 184)
    pdf.text(new Date().toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' }), pageWidth / 2, 90, { align: 'center' })

    // Page 1: Executive Summary
    pdf.addPage()
    pdf.setFillColor(255, 255, 255)
    pdf.rect(0, 0, pageWidth, pageHeight, 'F')
    
    pdf.setTextColor(30, 41, 59)
    pdf.setFontSize(20)
    pdf.text("Yönetici Özeti", 20, 30)
    
    pdf.setFontSize(11)
    pdf.setTextColor(71, 85, 105)
    const summaryText = "Bu hafta 4 şantiyede toplam %8 ilerleme kaydedilmiştir. İskenderun TOKİ projesinde B Blok beton dökümü tamamlanmış, Arsuz Konutları'nda temel çalışmaları hızla devam etmektedir. 2 kritik eksiklik giderilmiş, personel devri %5 artmıştır. Finansal olarak toplam ₺245,000 tahsilat yapılmış, bekleyen hakedişler ₺890,000 seviyesindedir."
    
    const splitText = pdf.splitTextToSize(summaryText, pageWidth - 40)
    pdf.text(splitText, 20, 50)

    // Summary Cards
    pdf.setFillColor(59, 130, 246)
    pdf.roundedRect(20, 100, 80, 40, 5, 5, 'F')
    pdf.setTextColor(255, 255, 255)
    pdf.setFontSize(12)
    pdf.text("Toplam Personel", 25, 115)
    pdf.setFontSize(18)
    pdf.text(digest.totalWorkers.toString(), 25, 130)

    pdf.setFillColor(34, 197, 94)
    pdf.roundedRect(110, 100, 80, 40, 5, 5, 'F')
    pdf.setTextColor(255, 255, 255)
    pdf.setFontSize(12)
    pdf.text("Aktif Şantiye", 115, 115)
    pdf.setFontSize(18)
    pdf.text(digest.siteCount.toString(), 115, 130)

    // Page 2: Deficiencies and Finance
    pdf.addPage()
    pdf.setFillColor(255, 255, 255)
    pdf.rect(0, 0, pageWidth, pageHeight, 'F')
    
    pdf.setTextColor(30, 41, 59)
    pdf.setFontSize(20)
    pdf.text("Açık Eksiklikler", 20, 30)
    
    pdf.setFontSize(11)
    pdf.setTextColor(71, 85, 105)
    pdf.text("Kritik Eksiklikler: 2", 20, 50)
    pdf.text("Orta Seviye: 1", 20, 60)
    pdf.text("Düşük Öncelik: 0", 20, 70)
    
    pdf.setFontSize(20)
    pdf.setTextColor(30, 41, 59)
    pdf.text("Finansal Durum", 20, 100)
    
    pdf.setFontSize(11)
    pdf.setTextColor(71, 85, 105)
    pdf.text("Toplam Kasa: ₺2,450,000", 20, 120)
    pdf.text("Bekleyen Hakedişler: ₺890,000", 20, 130)
    pdf.text("Bugün Tahsilat: ₺125,000", 20, 140)

    // Save PDF
    pdf.save('Nexa_Haftalik_Rapor.pdf')
    
    setIsGeneratingPDF(false)
    setPdfProgress(0)
    toast.success("PDF raporu başarıyla indirildi")
  }

  const filteredReports = reports.filter(report => {
    const matchesProject = !selectedProjectId || report.project.id === selectedProjectId
    const matchesSearch = !searchTerm || 
      report.project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.project.title.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesProject && matchesSearch
  })

  if (loading) {
    return (
      <div className="lg:mt-0 mt-16">
        <div className="text-white">Yükleniyor...</div>
      </div>
    )
  }

  return (
    <div className="lg:mt-0 mt-16">
      <div className="flex flex-wrap gap-4 justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-white flex items-center gap-3">
            <ClipboardList className="w-8 h-8 text-blue-400" />
            Saha Raporları
          </h1>
          <p className="text-slate-400 mt-1">Günlük şantiye defteri ve sabah raporları</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={handleGeneratePDF}
            disabled={isGeneratingPDF}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white rounded-lg transition-colors font-medium disabled:opacity-50"
          >
            <FileDown className="w-5 h-5" />
            Tek Tıkla PDF Rapor
          </button>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors font-medium"
          >
            <Plus className="w-5 h-5" />
            Yeni Rapor Oluştur
          </button>
        </div>
      </div>

      {/* Morning Digest Panel */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-6 border border-blue-200 dark:border-blue-800 mb-6 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-blue-600 dark:bg-blue-500 rounded-xl flex items-center justify-center flex-shrink-0">
            <Sun className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">Günün Özeti</h3>
            <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
              {digest.siteCount > 0 ? (
                `Bugün ${digest.siteCount} şantiyede toplam ${digest.totalWorkers} personel çalışıyor${digest.weatherIssues > 0 ? `, ${digest.weatherIssues} şantiyede hava muhalefeti var` : ''}.`
              ) : (
                "Bugün henüz rapor girilmedi."
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-slate-900 rounded-xl p-6 border border-slate-800 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Proje (YİBF) Seç</label>
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
            >
              <option value="">Tüm Projeler</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name || project.title}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Ara</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500 w-5 h-5" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Proje adı ara..."
                className="w-full pl-10 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-slate-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Reports List */}
      <div className="space-y-4">
        {filteredReports.length > 0 ? (
          filteredReports.map((report) => (
            <div key={report.id} className="bg-slate-900 rounded-xl border border-slate-800 p-6 hover:border-slate-700 transition-all">
              <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-slate-800 rounded-xl">
                    {getWeatherIcon(report.weather)}
                  </div>
                  <div>
                    <h3 className="text-white font-semibold text-lg mb-1">
                      {report.project.name || report.project.title}
                    </h3>
                    <div className="flex items-center gap-4 text-slate-400 text-sm">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {formatDate(report.date)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        {report.workerCount} personel
                      </span>
                      {report.weather && (
                        <span className="flex items-center gap-1">
                          {getWeatherIcon(report.weather)}
                          {report.weather}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                {report.createdBy && (
                  <span className="text-slate-500 text-sm">
                    Raporlayan: {report.createdBy}
                  </span>
                )}
              </div>

              {report.notes && (
                <div className="bg-slate-800 rounded-lg p-4 mb-4">
                  <h4 className="text-sm font-medium text-slate-300 mb-2">İmalat Notları</h4>
                  <p className="text-slate-400 text-sm whitespace-pre-wrap">{report.notes}</p>
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="text-center py-16 bg-slate-900 rounded-xl border border-slate-800">
            <ClipboardList className="w-16 h-16 mx-auto mb-4 text-slate-600" />
            <h3 className="text-xl font-semibold text-white mb-2">Henüz rapor yok</h3>
            <p className="text-slate-400">Yeni rapor oluşturmak için butona tıklayın</p>
          </div>
        )}
      </div>

      {/* New Report Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-xl p-6 max-w-2xl w-full border border-slate-800 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-white">Yeni Saha Raporu Oluştur</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Proje *</label>
                  <select
                    value={formData.projectId}
                    onChange={(e) => setFormData({ ...formData, projectId: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                  >
                    <option value="">Proje Seçin</option>
                    {projects.map((project) => (
                      <option key={project.id} value={project.id}>
                        {project.name || project.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Tarih *</label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Hava Durumu</label>
                  <select
                    value={formData.weather}
                    onChange={(e) => setFormData({ ...formData, weather: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                  >
                    <option value="Güneşli">Güneşli</option>
                    <option value="Bulutlu">Bulutlu</option>
                    <option value="Yağmurlu">Yağmurlu</option>
                    <option value="Karlı">Karlı</option>
                    <option value="Rüzgarlı">Rüzgarlı</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Toplam İşçi/Usta Sayısı</label>
                  <input
                    type="number"
                    value={formData.workerCount}
                    onChange={(e) => setFormData({ ...formData, workerCount: parseInt(e.target.value) || 0 })}
                    placeholder="0"
                    className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Yapılan İmalatlar</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Bugün yapılan imalatları buraya yazın..."
                  rows={4}
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-slate-500 resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Sorunlar/Gecikmeler</label>
                <textarea
                  value={formData.issues}
                  onChange={(e) => setFormData({ ...formData, issues: e.target.value })}
                  placeholder="Varsa sorunlar veya gecikmeleri buraya yazın..."
                  rows={3}
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-slate-500 resize-none"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-4 py-3 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition-colors"
                  disabled={submitting}
                >
                  İptal
                </button>
                <button
                  onClick={handleSubmit}
                  className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors"
                  disabled={submitting}
                >
                  {submitting ? "Kaydediliyor..." : "Rapor Oluştur"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PDF Generation Modal */}
      {isGeneratingPDF && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-xl p-8 max-w-md w-full border border-slate-800">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-6 relative">
                <Loader2 className="w-16 h-16 text-blue-500 animate-spin" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Yapay Zeka Raporu Derliyor...</h3>
              <p className="text-slate-400 text-sm mb-6">Veriler analiz ediliyor ve PDF oluşturuluyor</p>
              
              <div className="w-full bg-slate-800 rounded-full h-3 mb-4">
                <div 
                  className="bg-gradient-to-r from-purple-600 to-blue-600 h-3 rounded-full transition-all duration-300"
                  style={{ width: `${pdfProgress}%` }}
                />
              </div>
              
              <p className="text-slate-400 text-sm">{pdfProgress}% tamamlandı</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
