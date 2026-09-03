"use client"
/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * This code is the property of NXA Software.
 */


import { useState, useEffect, useCallback } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import dynamic from 'next/dynamic'
import ProjectFiles from "@/components/ProjectFiles"
import ProjectReminders from "@/components/ProjectReminders"
import ProjectDailyLogs from "@/components/ProjectDailyLogs"
import GeofencedCheckIn from "@/components/GeofencedCheckIn"
import StructureTree from "@/components/StructureTree"
import { toast } from "react-hot-toast"
import { jsPDF } from "jspdf"
import * as htmlToImage from 'html-to-image'
import { UploadDropzone } from "@uploadthing/react"
import type { OurFileRouter } from "@/app/api/uploadthing/core"
import { updateProjectBimModel } from "@/app/actions/project"

// Leaflet SSR'da hata verdiği için dynamic import kullanıyoruz
const MapLocationPicker = dynamic(() => import('@/components/MapLocationPicker'), { ssr: false })
const SiteMasterPlan = dynamic(() => import('@/components/SiteMasterPlan'), { ssr: false })
// IFC Viewer SSR'da hata verdiği için dynamic import kullanıyoruz
const BimViewer = dynamic(() => import('@/app/admin/projects/[id]/_components/BimViewer'), { ssr: false })
// Gantt Chart SSR'da hata verdiği için dynamic import kullanıyoruz
const GanttChart = dynamic(() => import('@/app/admin/projects/[id]/_components/GanttChart'), { ssr: false })
// Project Documents SSR'da hata verdiği için dynamic import kullanıyoruz
const ProjectDocuments = dynamic(() => import('@/app/admin/projects/[id]/_components/ProjectDocuments'), { ssr: false })

interface Project {
  id: string
  name: string | null
  title: string | null
  city: string | null
  district: string | null
  mintika: string | null
  ada: string | null
  parsel: string | null
  clientName: string | null
  siteManager: string | null
  engineer: string | null
  architect: string | null
  status: string | null
  startDate: string
  endDate: string | null
  mapUrl: string | null
  company: { name: string } | null
  shiftStart: string | null
  shiftEnd: string | null
  latitude: number | null
  longitude: number | null
  geofenceRadius: number | null
  ifcModelUrl?: string | null
}

type InspectionReport = {
  id: string
  title?: string | null
  description?: string | null
  createdAt?: string | null
  findings?: string | null
  markedBlueprintUrl?: string | null
  markedPhotoUrl?: string | null
  imageUrl?: string | null
  dxfUrl?: string | null
}

interface ProjectDetailTabsProps {
  project: Project
}

export default function ProjectDetailTabs({ project }: ProjectDetailTabsProps) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState("kunya")
  const [isEditing, setIsEditing] = useState(false)
  const [isTkgmModalOpen, setIsTkgmModalOpen] = useState(false)
  const [selectedReport, setSelectedReport] = useState<InspectionReport | null>(null)
  const [isReportModalOpen, setIsReportModalOpen] = useState(false)
  const [inspectionReports, setInspectionReports] = useState<InspectionReport[]>([])
  const [loadingReports, setLoadingReports] = useState(false)
  const [deleteReportId, setDeleteReportId] = useState<string | null>(null)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [isUploadingBim, setIsUploadingBim] = useState(false)
  const [isUploadingFile, setIsUploadingFile] = useState(false)
  const [droneMedia, setDroneMedia] = useState<any[]>([])
  const [editForm, setEditForm] = useState({
    city: project.city || "",
    district: project.district || "",
    mintika: project.mintika || "",
    ada: project.ada || "",
    parsel: project.parsel || "",
    clientName: project.clientName || "",
    siteManager: project.siteManager || "",
    engineer: project.engineer || "",
    architect: project.architect || "",
    mapUrl: project.mapUrl || "",
    shiftStart: project.shiftStart || "",
    shiftEnd: project.shiftEnd || "",
    latitude: project.latitude || null,
    longitude: project.longitude || null,
    geofenceRadius: project.geofenceRadius || 100
  })

  const tabs = [
    { id: "kunya", label: "Proje Künyesi" },
    { id: "arsiv", label: "Arşiv ve Evraklar" },
    { id: "gunluk", label: "Şantiye Günlüğü" },
    { id: "vaziyet", label: "🗺️ Vaziyet Planı" },
    { id: "bim", label: "3D BIM Modeli" },
    { id: "drone", label: "🚁 Drone Analizi" },
    { id: "gantt", label: "📅 İş Programı (Gantt)" },
    { id: "dokumanlar", label: "📁 Dokümanlar & Revizyonlar" },
    { id: "denetim", label: "Yapı Denetim Arşivi" },
    { id: "yapi-agaci", label: "🏗️ Yapı Ağacı (Dijital İkiz)" },
    { id: "hatirlatici", label: "Hatırlatıcılar" }
  ]

  const handleSave = async () => {
    try {
      const response = await fetch(`/api/admin/projects/${project.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm)
      })

      if (response.ok) {
        toast.success("Proje bilgileri güncellendi")
        setIsEditing(false)
        window.location.reload()
      } else {
        toast.error("Güncellenirken hata oluştu")
      }
    } catch {
      toast.error("Güncellenirken hata oluştu")
    }
  }

  const fetchInspectionReports = useCallback(async () => {
    setLoadingReports(true)
    try {
      const response = await fetch(`/api/admin/inspection-reports?projectId=${project.id}`)
      if (response.ok) {
        const data = await response.json()
        setInspectionReports(data)
      }
    } catch (error) {
      console.error("Failed to fetch inspection reports:", error)
    } finally {
      setLoadingReports(false)
    }
  }, [project.id])

  useEffect(() => {
    if (activeTab !== "denetim") return

    const timeoutId = setTimeout(() => {
      void fetchInspectionReports()
    }, 0)

    return () => clearTimeout(timeoutId)
  }, [activeTab, fetchInspectionReports])

  const formatReportDate = (value?: string | null) => {
    if (!value) return "Tarih yok"

    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return "Tarih yok"

    return date.toLocaleDateString('tr-TR')
  }

  const handleDeleteReport = async (reportId: string) => {
    setDeleteReportId(reportId);
    setIsDeleteModalOpen(true);
  };

  const confirmDeleteReport = async () => {
    if (!deleteReportId) return;
    
    try {
      const res = await fetch(`/api/inspection/reports/${deleteReportId}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success("Rapor silindi.");
        setInspectionReports(prev => prev.filter(r => r.id !== deleteReportId));
        setIsDeleteModalOpen(false);
        setDeleteReportId(null);
      } else {
        toast.error("Rapor silinemedi.");
      }
    } catch (_error) {
      console.error(_error);
      toast.error("Rapor silinirken hata oluştu.");
    }
  };

  const reportDateLabel = formatReportDate(selectedReport?.createdAt)

  const fetchDroneMedia = useCallback(async () => {
    try {
      const response = await fetch(`/api/admin/drone-media?projectId=${project.id}`)
      if (response.ok) {
        const data = await response.json()
        setDroneMedia(data)
      }
    } catch (error) {
      console.error("Failed to fetch drone media:", error)
    }
  }, [project.id])

  useEffect(() => {
    if (activeTab === "drone") {
      fetchDroneMedia()
    }
  }, [activeTab, fetchDroneMedia])

  const handleFileUpload = async (file: File) => {
    setIsUploadingFile(true)
    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      if (response.ok) {
        const data = await response.json()
        console.log('File uploaded successfully:', data.url)

        // Save to database
        const mediaResponse = await fetch('/api/admin/drone-media', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: data.filename || file.name,
            url: data.url,
            mediaType: file.type.startsWith('image/') ? 'IMAGE' : 'VIDEO',
            date: new Date().toISOString(),
            projectId: project.id,
            description: ''
          })
        })

        if (mediaResponse.ok) {
          toast.success('Dosya başarıyla yüklendi ve kaydedildi!')
          await fetchDroneMedia()
        } else {
          toast.error('Dosya yüklendi ancak veritabanına kaydedilemedi')
        }
      } else {
        toast.error('Dosya yüklenirken hata oluştu')
      }
    } catch (error) {
      console.error('Upload error:', error)
      toast.error('Dosya yüklenirken hata oluştu')
    } finally {
      setIsUploadingFile(false)
    }
  }

  const handleDownloadPDF = async (reportId: string) => {
    const element = document.getElementById(`pdf-template-${reportId}`);
    if (!element) {
      toast.error("PDF içeriği bulunamadı!");
      return;
    }

    try {
      // html2canvas yerine htmlToImage.toPng kullanıyoruz (Modern CSS'i kusursuz okur)
      const dataUrl = await htmlToImage.toPng(element, {
        quality: 1.0,
        pixelRatio: 2, // Yüksek çözünürlük
        backgroundColor: '#ffffff' // Beyaz arka plan
      });
      
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      // Orantıyı koruyarak PDF yüksekliğini hesapla
      const pdfHeight = (element.offsetHeight * pdfWidth) / element.offsetWidth;
      
      pdf.addImage(dataUrl, 'PNG', 0, 0, pdfWidth, pdfHeight);
      
      // DOĞRUDAN İNDİRME YERİNE ÖNİZLEME (YENİ SEKME) İÇİN:
      const pdfBlob = pdf.output('blob');
      const pdfUrl = URL.createObjectURL(pdfBlob);
      window.open(pdfUrl, '_blank');
      
      toast.success("PDF önizlemesi yeni sekmede açıldı!");
    } catch (error) {
      console.error("PDF oluşturma hatası:", error);
      toast.error("PDF oluşturulurken bir hata oluştu.");
    }
  };

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="flex gap-2 border-b border-slate-800 overflow-x-auto no-scrollbar snap-x">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-3 text-sm font-medium transition-colors border-b-2 whitespace-nowrap snap-start ${
              activeTab === tab.id
                ? "border-blue-500 text-blue-400"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="min-h-100">
        {activeTab === "kunya" && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-white">Proje Künyesi</h3>
              {!isEditing && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors text-sm"
                >
                  Projeyi Düzenle
                </button>
              )}
            </div>

            {isEditing ? (
              <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">İl</label>
                    <input
                      type="text"
                      value={editForm.city}
                      onChange={(e) => setEditForm({ ...editForm, city: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">İlçe</label>
                    <input
                      type="text"
                      value={editForm.district}
                      onChange={(e) => setEditForm({ ...editForm, district: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Mıntıka</label>
                    <input
                      type="text"
                      value={editForm.mintika}
                      onChange={(e) => setEditForm({ ...editForm, mintika: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Ada</label>
                    <input
                      type="text"
                      value={editForm.ada}
                      onChange={(e) => setEditForm({ ...editForm, ada: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Parsel</label>
                    <input
                      type="text"
                      value={editForm.parsel}
                      onChange={(e) => setEditForm({ ...editForm, parsel: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Müşteri Adı</label>
                    <input
                      type="text"
                      value={editForm.clientName}
                      onChange={(e) => setEditForm({ ...editForm, clientName: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Şantiye Şefi</label>
                    <input
                      type="text"
                      value={editForm.siteManager}
                      onChange={(e) => setEditForm({ ...editForm, siteManager: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Sorumlu Mühendis</label>
                    <input
                      type="text"
                      value={editForm.engineer}
                      onChange={(e) => setEditForm({ ...editForm, engineer: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-slate-300 mb-2">Mimar</label>
                    <input
                      type="text"
                      value={editForm.architect}
                      onChange={(e) => setEditForm({ ...editForm, architect: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-slate-300 mb-2">Google Maps URL</label>
                    <input
                      type="text"
                      value={editForm.mapUrl}
                      onChange={(e) => setEditForm({ ...editForm, mapUrl: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                      placeholder="https://maps.google.com/..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Merkez Enlem (Latitude)</label>
                    <input
                      type="number" step="any"
                      value={editForm.latitude || ""}
                      onChange={(e) => setEditForm({ ...editForm, latitude: e.target.value ? parseFloat(e.target.value) : null })}
                      className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
                      placeholder="Örn: 36.5871"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Merkez Boylam (Longitude)</label>
                    <input
                      type="number" step="any"
                      value={editForm.longitude || ""}
                      onChange={(e) => setEditForm({ ...editForm, longitude: e.target.value ? parseFloat(e.target.value) : null })}
                      className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
                      placeholder="Örn: 36.1735"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Mesai Başlangıç</label>
                    <input
                      type="time"
                      value={editForm.shiftStart}
                      onChange={(e) => setEditForm({ ...editForm, shiftStart: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Mesai Bitiş</label>
                    <input
                      type="time"
                      value={editForm.shiftEnd}
                      onChange={(e) => setEditForm({ ...editForm, shiftEnd: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-slate-300 mb-2">Geofence Yarıçapı (Metre)</label>
                    <input
                      type="number"
                      value={editForm.geofenceRadius || 100}
                      onChange={(e) => setEditForm({ ...editForm, geofenceRadius: e.target.value ? parseInt(e.target.value) : 100 })}
                      className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                      placeholder="100"
                    />
                    <p className="text-xs text-slate-500 mt-1">Personelin bu mesafe içinde olmalıdır (örn: 100 metre)</p>
                  </div>
                </div>
                
                {/* Geofence (Sanal Çit) Harita Seçici */}
                <div className="col-span-1 md:col-span-2 mt-4">
                  <label className="block text-sm font-medium text-slate-300 mb-2">Şantiye Konumu ve Sanal Çit (Geofence)</label>
                  <MapLocationPicker 
                    latitude={editForm.latitude} 
                    longitude={editForm.longitude} 
                    radius={editForm.geofenceRadius || 100} 
                    onChange={(lat, lng, rad) => setEditForm({ ...editForm, latitude: lat, longitude: lng, geofenceRadius: rad })}
                  />
                </div>
                
                <div className="flex gap-2 pt-4">
                  <button
                    onClick={() => setIsEditing(false)}
                    className="flex-1 px-3 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-500 transition-colors"
                  >
                    İptal
                  </button>
                  <button
                    onClick={handleSave}
                    className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors"
                  >
                    Kaydet
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Location Card */}
                <div className="bg-linear-to-br from-slate-800 to-slate-900 rounded-xl p-6 border border-slate-700">
                  <div className="flex items-center gap-2 mb-4">
                    <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <h4 className="text-lg font-semibold text-white">Konum Bilgileri</h4>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                    {project.city && (
                      <div>
                        <label className="block text-xs text-slate-400 mb-1">İl</label>
                        <p className="text-white font-medium">{project.city}</p>
                      </div>
                    )}
                    {project.district && (
                      <div>
                        <label className="block text-xs text-slate-400 mb-1">İlçe</label>
                        <p className="text-white font-medium">{project.district}</p>
                      </div>
                    )}
                    {project.mintika && (
                      <div>
                        <label className="block text-xs text-slate-400 mb-1">Mıntıka</label>
                        <p className="text-white font-medium">{project.mintika}</p>
                      </div>
                    )}
                    {project.ada && (
                      <div>
                        <label className="block text-xs text-slate-400 mb-1">Ada</label>
                        <p className="text-white font-medium">{project.ada}</p>
                      </div>
                    )}
                    {project.parsel && (
                      <div>
                        <label className="block text-xs text-slate-400 mb-1">Parsel</label>
                        <p className="text-white font-medium">{project.parsel}</p>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-3">
                    {project.mapUrl && (
                      <a
                        href={project.mapUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-2 flex-1 bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-lg font-medium transition-colors"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        Google Maps Aç
                      </a>
                    )}
                    <button
                      onClick={() => setIsTkgmModalOpen(true)}
                      className="flex items-center justify-center gap-2 flex-1 bg-emerald-600 hover:bg-emerald-500 text-white py-3 rounded-lg font-medium transition-colors"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                      </svg>
                      TKGM Parsel Sorgula
                    </button>
                  </div>
                </div>

                {/* Other Project Info */}
                <div className="grid md:grid-cols-2 gap-4">
                  {project.clientName && (
                    <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
                      <label className="block text-sm font-medium text-slate-400 mb-1">Müşteri</label>
                      <p className="text-white font-medium">{project.clientName}</p>
                    </div>
                  )}
                  {project.siteManager && (
                    <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
                      <label className="block text-sm font-medium text-slate-400 mb-1">Şantiye Şefi</label>
                      <p className="text-white font-medium">{project.siteManager}</p>
                    </div>
                  )}
                  {project.engineer && (
                    <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
                      <label className="block text-sm font-medium text-slate-400 mb-1">Sorumlu Mühendis</label>
                      <p className="text-white font-medium">{project.engineer}</p>
                    </div>
                  )}
                  {project.architect && (
                    <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
                      <label className="block text-sm font-medium text-slate-400 mb-1">Mimar</label>
                      <p className="text-white font-medium">{project.architect}</p>
                    </div>
                  )}
                  {project.company && (
                    <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
                      <label className="block text-sm font-medium text-slate-400 mb-1">Firma</label>
                      <p className="text-white font-medium">{project.company.name}</p>
                    </div>
                  )}
                  <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
                    <label className="block text-sm font-medium text-slate-400 mb-1">Başlangıç Tarihi</label>
                    <p className="text-white font-medium">{new Date(project.startDate).toLocaleDateString("tr-TR")}</p>
                  </div>
                  {project.endDate && (
                    <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
                      <label className="block text-sm font-medium text-slate-400 mb-1">Bitiş Tarihi</label>
                      <p className="text-white font-medium">{new Date(project.endDate).toLocaleDateString("tr-TR")}</p>
                    </div>
                  )}
                  {(project.shiftStart || project.shiftEnd) && (
                    <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
                      <label className="block text-sm font-medium text-slate-400 mb-1">Mesai Saatleri</label>
                      <p className="text-white font-medium">
                        {project.shiftStart || "--:--"} - {project.shiftEnd || "--:--"}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === "arsiv" && (
          <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
            <ProjectFiles projectId={project.id} />
          </div>
        )}

        {activeTab === "gunluk" && (
          <div className="space-y-4">
            <div className="bg-red-900/20 border-2 border-red-600 rounded-xl p-6">
              <button
                onClick={() => router.push(`/admin/projects/${project.id}/markup`)}
                className="w-full flex items-center justify-center gap-3 bg-red-600 hover:bg-red-500 text-white py-4 rounded-lg font-bold text-lg transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
                Yapı Denetim / Hasar Tespit Çizimi Yap
              </button>
            </div>
            <GeofencedCheckIn 
              projectId={project.id}
              projectLat={project.latitude}
              projectLng={project.longitude}
              radius={project.geofenceRadius}
            />
            <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
              <ProjectDailyLogs projectId={project.id} />
            </div>
          </div>
        )}

        {activeTab === "vaziyet" && (
          <SiteMasterPlan
            projectLat={project.latitude || 36.1735}
            projectLng={project.longitude || 36.5871}
            projectId={project.id}
          />
        )}

        {activeTab === "bim" && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-white">3D BIM Modeli</h3>
              <button
                onClick={() => router.push(`/admin/projects/${project.id}/edit`)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                IFC Yükle
              </button>
            </div>

            <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
              {project.ifcModelUrl ? (
                <div className="h-150">
                  <BimViewer ifcUrl={project.ifcModelUrl} />
                </div>
              ) : (
                <div className="p-6">
                  {isUploadingBim ? (
                    <div className="flex flex-col items-center justify-center py-20">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
                      <p className="text-slate-400">IFC Modeli yükleniyor...</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-20">
                      <svg className="w-16 h-16 text-slate-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                      </svg>
                      <p className="text-slate-400 text-lg mb-2">IFC Modeli Yüklenmemiş</p>
                      <p className="text-slate-500 text-sm mb-6">Bu proje için henüz 3D BIM modeli eklenmemiş.</p>
                      
                      <UploadDropzone<OurFileRouter, "bimModelUploader">
                        endpoint="bimModelUploader"
                        config={{ mode: "auto" }}
                        onClientUploadComplete={async (res) => {
                          if (res && res.length > 0) {
                            setIsUploadingBim(true)
                            const result = await updateProjectBimModel(project.id, res[0].url)
                            if (result.success) {
                              toast.success("BIM modeli başarıyla yüklendi!")
                              router.refresh()
                            } else {
                              toast.error("BIM modeli kaydedilirken hata oluştu")
                            }
                            setIsUploadingBim(false)
                          }
                        }}
                        onUploadError={(error: Error) => {
                          toast.error(`Yükleme hatası: ${error.message}`)
                        }}
                      />
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Element Selection Info */}
            <div className="bg-linear-to-r from-purple-900/20 to-blue-900/20 rounded-xl p-4 border border-purple-500/30">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
                  </svg>
                </div>
                <div>
                  <h4 className="text-white font-medium">C12 Kolonu Seçildi</h4>
                  <p className="text-slate-400 text-sm">3 Kontrol, 1 Eksiklik</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "drone" && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-white">Drone Analizi</h3>
              <label className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors flex items-center gap-2 cursor-pointer">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                {isUploadingFile ? 'Yükleniyor...' : 'Yeni Tarama'}
                <input 
                  type="file" 
                  className="hidden" 
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) handleFileUpload(file)
                  }}
                  disabled={isUploadingFile}
                />
              </label>
            </div>

            <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
              <h4 className="text-white font-medium mb-4">Tarama Geçmişi</h4>
              <div className="space-y-3">
                {droneMedia.length > 0 ? (
                  droneMedia.map((media) => (
                    <div key={media.id} className="flex items-center justify-between p-4 bg-slate-700/50 rounded-lg border border-slate-600">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                          {media.mediaType === 'IMAGE' ? (
                            <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          ) : (
                            <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                          )}
                        </div>
                        <div>
                          <p className="text-white font-medium">{media.title}</p>
                          <p className="text-slate-400 text-sm">{new Date(media.date).toLocaleDateString('tr-TR')}</p>
                        </div>
                      </div>
                      <a
                        href={media.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors text-sm flex items-center gap-2"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                        </svg>
                        İndir
                      </a>
                    </div>
                  ))
                ) : (
                  <p className="text-slate-400 text-sm">Henüz tarama kaydı bulunmuyor.</p>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === "gantt" && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-white">İş Programı (Gantt Şeması)</h3>
            </div>
            <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
              <GanttChart projectId={project.id} />
            </div>
          </div>
        )}

        {activeTab === "dokumanlar" && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-white">Dokümanlar & Revizyonlar</h3>
            </div>
            <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
              <ProjectDocuments projectId={project.id} />
            </div>
          </div>
        )}

        {activeTab === "denetim" && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-white">Yapı Denetim Raporları</h3>
              <button
                onClick={() => router.push(`/admin/projects/${project.id}/markup`)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Yeni Rapor Oluştur
              </button>
            </div>

            {loadingReports ? (
              <div className="text-center text-slate-400 py-8">Yükleniyor...</div>
            ) : inspectionReports.length === 0 ? (
              <div className="text-center text-slate-500 py-8 bg-slate-800 rounded-xl border border-slate-700">
                Henüz yapı denetim raporu yok
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {inspectionReports.map((report) => (
                  <div 
                    key={report.id} 
                    className="relative bg-slate-800 rounded-xl border border-slate-700 overflow-hidden flex flex-col h-72 hover:border-blue-500 transition-colors cursor-pointer"
                    onClick={() => {
                      setSelectedReport(report)
                      setIsReportModalOpen(true)
                    }}
                  >
                    {/* Düzenle / Sil Butonları */}
                    <div className="absolute top-3 right-3 flex gap-2 z-20">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/admin/projects/${project.id}/markup/${report.id}`);
                        }}
                        className="p-2 bg-blue-600/80 hover:bg-blue-500 rounded text-white backdrop-blur"
                        title="Düzenle"
                      >
                        ✏️
                      </button>
                      
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteReport(report.id);
                        }}
                        className="p-2 bg-red-600/80 hover:bg-red-500 rounded text-white backdrop-blur"
                        title="Sil"
                      >
                        🗑️
                      </button>
                    </div>

                    {/* Resim Alanı - DİKKAT: object-cover YERİNE object-contain KULLANILIYOR */}
                    <div className="relative w-full h-48 bg-slate-950 border-b border-slate-700 p-2">
                      {report.markedBlueprintUrl || report.markedPhotoUrl ? (
                        <Image 
                          src={report.markedBlueprintUrl || report.markedPhotoUrl || ""} 
                          alt={report.title || "Rapor"} 
                          className="w-full h-full object-contain object-center"
                          unoptimized
                          width={600}
                          height={400}
                        />
                      ) : report.imageUrl ? (
                        <Image 
                          src={report.imageUrl} 
                          alt="Denetim Raporu" 
                          className="w-full h-full object-contain object-center"
                          unoptimized
                          width={600}
                          height={400}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-500 text-sm">
                          Görsel Yok
                        </div>
                      )}
                    </div>

                    {/* Alt Bilgi Alanı */}
                    <div className="p-4 flex-1 flex flex-col justify-center bg-slate-800">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-xs text-slate-400">
                          {formatReportDate(report.createdAt)}
                        </span>
                        <span className="text-xs font-semibold px-2 py-1 rounded bg-blue-900/50 text-blue-300">
                          {report.markedBlueprintUrl ? 'Plan' : 'Fotoğraf'}
                        </span>
                      </div>
                      <h3 className="text-sm font-semibold text-slate-200 truncate" title={report.title || ""}>
                        {report.title || report.description || "Rapor"}
                      </h3>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "yapi-agaci" && (
          <div className="space-y-4">
            <StructureTree projectId={project.id} />
          </div>
        )}

        {activeTab === "hatirlatici" && (
          <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
            <ProjectReminders projectId={project.id} />
          </div>
        )}
      </div>

      {/* Report Detail Modal */}
      {isReportModalOpen && selectedReport && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 rounded-xl w-full max-w-4xl shadow-2xl border border-slate-800 overflow-hidden max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center p-4 border-b border-slate-800">
              <h3 className="text-xl font-semibold text-white flex items-center gap-2">
                <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Yapı Denetim Raporu Detayı
              </h3>
              <button
                onClick={() => setIsReportModalOpen(false)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div id={`pdf-report-${selectedReport.id}`} className="p-4 overflow-y-auto flex-1">
              <div className="mb-4">
                <span className="text-sm text-slate-400">
                  {new Date(String(selectedReport.createdAt || Date.now())).toLocaleDateString("tr-TR")}
                </span>
              </div>
              <div className="mb-6">
                {selectedReport.markedBlueprintUrl || selectedReport.markedPhotoUrl ? (
                  <div className="grid grid-cols-2 gap-4">
                    {selectedReport.markedBlueprintUrl && (
                      <div>
                        <Image
                          src={selectedReport.markedBlueprintUrl}
                          alt="İşaretlenmiş Plan"
                          className="w-full rounded-lg"
                          unoptimized
                          width={1200}
                          height={800}
                        />
                        <p className="text-sm text-slate-400 mt-2 text-center">İşaretlenmiş Plan</p>
                      </div>
                    )}
                    {selectedReport.markedPhotoUrl && (
                      <div>
                        <Image
                          src={selectedReport.markedPhotoUrl}
                          alt="İşaretlenmiş Fotoğraf"
                          className="w-full rounded-lg"
                          unoptimized
                          width={1200}
                          height={800}
                        />
                        <p className="text-sm text-slate-400 mt-2 text-center">İşaretlenmiş Fotoğraf</p>
                      </div>
                    )}
                  </div>
                ) : selectedReport.imageUrl ? (
                  <Image
                    src={selectedReport.imageUrl}
                    alt="Denetim Raporu"
                    className="w-full rounded-lg"
                    unoptimized
                    width={1200}
                    height={800}
                  />
                ) : (
                  <div className="flex items-center justify-center h-64 bg-slate-800 rounded-lg text-slate-500">
                    Görsel yok
                  </div>
                )}
              </div>
              
              {/* Rapor Metin Detayları - YENİ DÜZEN */}
              <div className="flex flex-col gap-4 mt-6">
                
                {/* Başlık Kutusu */}
                <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700/50">
                  <h4 className="text-xs font-semibold text-slate-400 mb-1 uppercase tracking-wider">Rapor Başlığı</h4>
                  <p className="text-white font-medium text-base">
                    {selectedReport.title || "Belirtilmedi"}
                  </p>
                </div>

                {/* Bulgular Kutusu (Eğer varsa göster) */}
                {selectedReport.findings && (
                  <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700/50">
                    <h4 className="text-xs font-semibold text-slate-400 mb-1 uppercase tracking-wider">Bulgular</h4>
                    <p className="text-white text-sm whitespace-pre-wrap">
                      {selectedReport.findings}
                    </p>
                  </div>
                )}

                {/* Açıklama Kutusu */}
                <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700/50">
                  <h4 className="text-xs font-semibold text-slate-400 mb-1 uppercase tracking-wider">Detaylı Açıklama</h4>
                  <p className="text-white text-sm whitespace-pre-wrap">
                    {selectedReport.description || "Belirtilmedi"}
                  </p>
                </div>

              </div>
            </div>
            <div className="p-4 border-t border-slate-800 flex justify-end gap-3">
              <button
                onClick={() => handleDownloadPDF(selectedReport.id)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                PDF Olarak İndir
              </button>
              <button
                onClick={() => router.push(`/admin/projects/${project.id}/markup/${selectedReport.id}`)}
                className="px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-400 transition-colors flex items-center gap-2 font-medium"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
                Düzenle
              </button>
              {selectedReport.dxfUrl && (
                <a 
                  href={selectedReport.dxfUrl} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-500 transition-colors flex items-center gap-2 shadow-lg"
                >
                  📐 DXF İndir
                </a>
              )}
              <button
                onClick={() => setIsReportModalOpen(false)}
                className="px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors"
              >
                Kapat
              </button>
            </div>
          </div>

          {/* --- PDF İÇİN ÖZEL GİZLİ ŞABLON (Ekranda görünmez, sadece baskıya gider) --- */}
          <div className="absolute top-0 left-0 z-[-1] opacity-0 pointer-events-none">
            <div 
              id={`pdf-template-${selectedReport.id}`} 
              className="bg-white text-black p-10 flex flex-col" 
              style={{ width: '794px', minHeight: '1123px' }} // 96 DPI A4 Boyutu
            >
              {/* Antet / Başlık */}
              <div className="border-b-4 border-slate-800 pb-6 mb-8 flex justify-between items-end">
                <div>
                  <h1 className="text-3xl font-black text-slate-900 uppercase mb-2">{selectedReport.title || "Yapı Denetim Raporu"}</h1>
                  <p className="text-slate-600 font-medium">Tarih: {reportDateLabel}</p>
                </div>
                <div className="text-right">
                  <h2 className="text-xl font-bold text-blue-900">MAHİR BAKAY MÜHENDİSLİK</h2>
                </div>
              </div>

              {/* Görsel Alanı */}
              <div className="w-full mb-8 border-2 border-slate-200 p-2 rounded bg-slate-50">
                <Image 
                  src={selectedReport.markedBlueprintUrl || selectedReport.markedPhotoUrl || selectedReport.imageUrl || ""} 
                  alt="Denetim Görseli" 
                  className="w-full object-contain max-h-125"
                  crossOrigin="anonymous"
                  unoptimized
                  width={1200}
                  height={800}
                />
              </div>

              {/* Bulgular */}
              {selectedReport.findings && (
                <div className="flex-1 mb-6">
                  <h3 className="text-lg font-bold mb-3 border-b border-slate-300 pb-2 text-slate-800">Bulgular:</h3>
                  <p className="text-slate-700 whitespace-pre-wrap text-base leading-relaxed">
                    {selectedReport.findings}
                  </p>
                </div>
              )}

              {/* Açıklama */}
              <div className="flex-1 mb-8">
                <h3 className="text-lg font-bold mb-3 border-b border-slate-300 pb-2 text-slate-800">Detaylı Açıklama:</h3>
                <p className="text-slate-700 whitespace-pre-wrap text-base leading-relaxed">
                  {selectedReport.description}
                </p>
              </div>
              
              {/* İmza Alanı */}
              <div className="mt-auto pt-10 flex justify-end">
                <div className="text-center w-64">
                  <p className="font-bold text-slate-800 mb-12">Denetçi Mühendis</p>
                  <div className="border-t-2 border-slate-800 pt-2 mx-auto">İmza / Kaşe</div>
                </div>
              </div>
            </div>
          </div>
          {/* ------------------------------------------------------------------------ */}
        </div>
      )}

      {/* TKGM Modal */}
      {isTkgmModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 rounded-xl w-full max-w-6xl shadow-2xl border border-slate-800 overflow-hidden">
            <div className="flex justify-between items-center p-4 border-b border-slate-800">
              <h3 className="text-xl font-semibold text-white flex items-center gap-2">
                <svg className="w-6 h-6 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
                TKGM Parsel Sorgu
              </h3>
              <button
                onClick={() => setIsTkgmModalOpen(false)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-4 bg-emerald-900/20 border-b border-emerald-800">
              <p className="text-emerald-400 font-bold text-lg text-center">
                {project.city?.toUpperCase() || ""}, {project.district?.toUpperCase() || ""} - ADA: {project.ada?.toUpperCase() || ""}, PARSEL: {project.parsel?.toUpperCase() || ""}
              </p>
            </div>
            <div className="p-4 w-full max-w-full overflow-hidden">
              <iframe
                src="https://parselsorgu.tkgm.gov.tr/"
                className="w-full h-[75vh] rounded-lg border-0"
                width="100%"
                title="TKGM Parsel Sorgu"
              />
            </div>
            <div className="p-4 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setIsTkgmModalOpen(false)}
                className="px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors"
              >
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-slate-900 rounded-xl border border-slate-700 p-6 max-w-md w-full mx-4 shadow-2xl">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">Raporu Sil</h3>
                <p className="text-slate-400 text-sm">Bu işlem geri alınamaz</p>
              </div>
            </div>
            <p className="text-slate-300 mb-6">
              Bu raporu silmek istediğinize emin misiniz? Bu işlem geri alınamaz.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setIsDeleteModalOpen(false);
                  setDeleteReportId(null);
                }}
                className="px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors"
              >
                İptal
              </button>
              <button
                onClick={confirmDeleteReport}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-500 transition-colors"
              >
                Evet, Sil
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
