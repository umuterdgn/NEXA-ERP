"use client"
/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * This code is the property of NXA Software.
 */


import { useState, use, useEffect } from "react"
import { useRouter } from "next/navigation"
import { toast } from "react-hot-toast"
import dynamic from "next/dynamic"
import PhotoAnnotator from "@/components/PhotoAnnotator"
import { useNetworkState } from 'react-use';
import { db } from '@/lib/offline-db';

const AnnotatableFloorPlanViewer = dynamic(
  () => import("@/components/AnnotatableFloorPlanViewer"),
  { ssr: false, loading: () => <div className="w-full h-[600px] bg-slate-900 animate-pulse rounded-xl flex items-center justify-center">CAD Yükleniyor...</div> }
)

export default function EditMarkupPage({ params }: { params: Promise<{ id: string; reportId: string }> }) {
  const unwrappedParams = use(params)
  const router = useRouter()
  
  const [activeTab, setActiveTab] = useState<"blueprint" | "photo">("blueprint")
  const [reportTitle, setReportTitle] = useState("")
  const [reportDescription, setReportDescription] = useState("")
  const [reportFindings, setReportFindings] = useState("")
  const [isSaving, setIsSaving] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  
  // DWG file URL for CAD viewer
  const [dwgFileUrl, setDwgFileUrl] = useState<string | null>(null)
  const [dwgFile, setDwgFile] = useState<File | null>(null)
  
  // Store annotation data
  const [markedBlueprintBase64, setMarkedBlueprintBase64] = useState<string>("")
  const [markedPhotoBase64, setMarkedPhotoBase64] = useState<string>("")
  const [uploadedPhoto, setUploadedPhoto] = useState<string>("")
  const [dxfBase64, setDxfBase64] = useState<string>("")

  // Network state for offline support
  const { online } = useNetworkState();

  // Fetch existing report data
  useEffect(() => {
    const fetchReport = async () => {
      try {
        const response = await fetch(`/api/admin/inspection-reports/${unwrappedParams.reportId}`)
        if (response.ok) {
          const report = await response.json()
          setReportTitle(report.title || "")
          setReportDescription(report.description || "")
          setReportFindings(report.findings || "")
          
          // Set existing image URLs if available
          if (report.markedBlueprintUrl) {
            setMarkedBlueprintBase64(report.markedBlueprintUrl)
          }
          if (report.markedPhotoUrl) {
            setUploadedPhoto(report.markedPhotoUrl)
            setMarkedPhotoBase64(report.markedPhotoUrl)
          }
          if (report.dxfUrl) {
            setDxfBase64(report.dxfUrl)
          }
        } else {
          toast.error("Rapor yüklenirken hata oluştu")
          router.push(`/admin/projects/${unwrappedParams.id}`)
        }
      } catch (error) {
        console.error("Error fetching report:", error)
        toast.error("Rapor yüklenirken hata oluştu")
        router.push(`/admin/projects/${unwrappedParams.id}`)
      } finally {
        setIsLoading(false)
      }
    }

    fetchReport()
  }, [unwrappedParams.reportId, unwrappedParams.id, router])

  const handleDwgFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setDwgFile(file)
    const url = URL.createObjectURL(file)
    setDwgFileUrl(url)
  }

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf']
    if (!validTypes.includes(file.type)) {
      toast.error("Lütfen JPG, PNG veya PDF dosyası yükleyin")
      return
    }

    const reader = new FileReader()
    reader.onload = (event) => {
      setUploadedPhoto(event.target?.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleUpdateReport = async () => {
    if (!reportTitle.trim()) {
      toast.error("Lütfen bir rapor başlığı girin")
      return
    }

    if (!reportDescription.trim()) {
      toast.error("Lütfen bir açıklama girin")
      return
    }

    setIsSaving(true)
    try {
      // 🔴 --- OFFLINE (İNTERNETSİZ) DURUM ---
      if (!online) {
        await db.offlineReports.add({
          projectId: unwrappedParams.id,
          reportId: unwrappedParams.reportId,
          title: reportTitle,
          description: reportDescription,
          findings: reportFindings,
          markedBlueprintBase64: markedBlueprintBase64 || undefined,
          markedPhotoBase64: markedPhotoBase64 || undefined,
          dxfBase64: dxfBase64 || undefined,
          createdAt: new Date().toISOString(),
          syncStatus: 'pending',
          operation: 'update'
        });

        toast.success("İnternet yok! 📴 Rapor cihazınıza kaydedildi, bağlantı geldiğinde buluta aktarılacak.");
        router.push(`/admin/projects/${unwrappedParams.id}`);
        return;
      }

      // 🟢 --- ONLINE (İNTERNET VAR) DURUM ---
      // Upload annotation images to Cloudinary
      const uploadPromises = []
      
      if (markedBlueprintBase64 && !markedBlueprintBase64.startsWith('http')) {
        const blueprintBlob = await (await fetch(markedBlueprintBase64)).blob()
        const blueprintFormData = new FormData()
        blueprintFormData.append("file", blueprintBlob, "blueprint-annotation.png")
        
        uploadPromises.push(
          fetch("/api/upload", {
            method: "POST",
            body: blueprintFormData
          }).then(res => res.json())
        )
      }
      
      if (markedPhotoBase64 && !markedPhotoBase64.startsWith('http')) {
        const photoBlob = await (await fetch(markedPhotoBase64)).blob()
        const photoFormData = new FormData()
        photoFormData.append("file", photoBlob, "photo-annotation.png")
        
        uploadPromises.push(
          fetch("/api/upload", {
            method: "POST",
            body: photoFormData
          }).then(res => res.json())
        )
      }

      if (dxfBase64 && !dxfBase64.startsWith('http')) {
        const dxfBlob = new Blob([dxfBase64], { type: 'application/dxf' });
        const dxfFormData = new FormData();
        dxfFormData.append("file", dxfBlob, "rapor-cizimi.dxf");
        uploadPromises.push(
          fetch("/api/upload", { method: "POST", body: dxfFormData }).then(res => res.json())
        );
      }

      const uploadResults = await Promise.all(uploadPromises)
      
      const markedBlueprintUrl = uploadResults[0]?.url || (markedBlueprintBase64?.startsWith('http') ? markedBlueprintBase64 : null)
      const markedPhotoUrl = uploadResults[1]?.url || (markedPhotoBase64?.startsWith('http') ? markedPhotoBase64 : null)
      const dxfUrl = uploadResults[2]?.url || (dxfBase64?.startsWith('http') ? dxfBase64 : null)

      // Update inspection report
      const reportResponse = await fetch(`/api/admin/inspection-reports/${unwrappedParams.reportId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: reportTitle,
          description: reportDescription,
          findings: reportFindings,
          markedBlueprintUrl,
          markedPhotoUrl,
          dxfUrl
        })
      })

      if (reportResponse.ok) {
        toast.success("Rapor başarıyla güncellendi")
        router.push(`/admin/projects/${unwrappedParams.id}`)
      } else {
        throw new Error("Failed to update report")
      }
    } catch (error) {
      console.error("Error updating report:", error)
      toast.error("Rapor güncellenirken hata oluştu")
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-white">Rapor yükleniyor...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Header */}
      <div className="bg-slate-900 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push(`/admin/projects/${unwrappedParams.id}`)}
                className="text-slate-400 hover:text-white text-sm"
              >
                ← Projeye Dön
              </button>
              <h1 className="text-xl md:text-2xl font-bold text-white">Rapor Düzenleme</h1>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-col md:flex-row h-[calc(100vh-73px)]">
        {/* Canvas Area */}
        <div className="flex-1 bg-slate-800 p-4 md:p-6">
          {/* Sekme Kapsayıcısı - Relative zorunlu */}
          <div className="flex-1 relative min-h-[600px] bg-slate-900 rounded-xl border border-slate-700 overflow-hidden">
              
              {/* Plan Çizim Alanı (Opacity & Z-index ile gizle/göster) */}
              <div className={`absolute inset-0 w-full h-full transition-opacity duration-300 ${activeTab === 'blueprint' ? 'opacity-100 z-10' : 'opacity-0 -z-10 pointer-events-none'}`}>
                  {dwgFileUrl ? (
                    <AnnotatableFloorPlanViewer 
                      fileUrl={dwgFileUrl} 
                      onSaveAnnotation={(dataUrl: any, dxf: any) => {
                        setMarkedBlueprintBase64(dataUrl)
                        if(dxf) setDxfBase64(dxf)
                        toast.success("Çizim hafızaya alındı, Raporu Güncelle'ye basabilirsiniz.")
                      }}
                    />
                  ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500">
                      <span className="text-6xl mb-4">📐</span>
                      <p>Planı görüntülemek için sağ taraftan bir DWG/DXF dosyası yükleyin</p>
                    </div>
                  )}
              </div>

              {/* Fotoğraf Alanı */}
              <div className={`absolute inset-0 w-full h-full transition-opacity duration-300 ${activeTab === 'photo' ? 'opacity-100 z-10' : 'opacity-0 -z-10 pointer-events-none'}`}>
                  <PhotoAnnotator 
                    imageUrl={uploadedPhoto}
                    onSaveAnnotation={(dataUrl: any) => setMarkedPhotoBase64(dataUrl)} 
                  />
              </div>
              
          </div>
        </div>

        {/* Sidebar Controls */}
        <div className="w-full md:w-96 bg-slate-900 border-l border-slate-800 p-4 md:p-6 overflow-y-auto">
          <div className="space-y-6">
            {/* Rapor Başlığı */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Rapor Başlığı *</label>
              <input
                type="text"
                value={reportTitle}
                onChange={(e) => setReportTitle(e.target.value)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Örn: 3. Kat Kolon Donatı Kontrolü"
              />
            </div>

            {/* Bulgular */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Bulgular</label>
              <textarea
                value={reportFindings}
                onChange={(e) => setReportFindings(e.target.value)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[100px]"
                placeholder="Örn: Paspayı yetersiz, korozyon başlangıcı var..."
              />
            </div>

            {/* Detaylı Açıklama */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Detaylı Açıklama</label>
              <textarea
                value={reportDescription}
                onChange={(e) => setReportDescription(e.target.value)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[100px]"
                placeholder="Hasar tespiti açıklamasını girin..."
              />
            </div>

            {/* Tab Switcher */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">İşaretleme Türü</label>
              <div className="flex gap-2">
                <button
                  onClick={() => setActiveTab("blueprint")}
                  className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                    activeTab === "blueprint"
                      ? "bg-blue-600 text-white"
                      : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                  }`}
                >
                  Plan Çizimi
                </button>
                <button
                  onClick={() => setActiveTab("photo")}
                  className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                    activeTab === "photo"
                      ? "bg-blue-600 text-white"
                      : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                  }`}
                >
                  Fotoğraf
                </button>
              </div>
            </div>

            {/* File Uploads */}
            {activeTab === "blueprint" && (
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">DWG/DXF Dosyası</label>
                <input
                  type="file"
                  accept=".dwg,.dxf"
                  onChange={handleDwgFileChange}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}

            {activeTab === "photo" && (
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Fotoğraf Yükle</label>
                <input
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,application/pdf"
                  onChange={handlePhotoUpload}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}

            {/* Save Button */}
            <button
              onClick={handleUpdateReport}
              disabled={isSaving}
              className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? "Güncelleniyor..." : "Raporu Güncelle"}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}