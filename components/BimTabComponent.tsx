"use client"
/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Interactive 3D BIM Tab Component with Persistent Model Archive & AR Integration
 */

import React, { useState, useEffect, Suspense } from "react"
import dynamic from "next/dynamic"
import { useRouter } from "next/navigation"
import { toast } from "react-hot-toast"
import { QRCodeSVG } from "qrcode.react"
import { UploadDropzone } from "@/lib/uploadthing"
import {
  addBimFile,
  setActiveBimFile,
  deleteBimFile,
  getProjectBimFiles,
} from "@/app/admin/projects/[id]/actions"

// Dynamically import BimViewer with SSR disabled
const BimViewer = dynamic(
  () => import("@/app/admin/projects/[id]/_components/BimViewer"),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-[600px] bg-slate-950 rounded-xl border border-slate-800 flex flex-col items-center justify-center shadow-2xl">
        <div className="w-12 h-12 border-4 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin mb-3"></div>
        <p className="text-cyan-400 text-sm font-semibold tracking-wide">3D BIM Görüntüleyici Hazırlanıyor...</p>
        <p className="text-slate-500 text-xs mt-1">WebGL 3D motoru başlatılıyor</p>
      </div>
    ),
  }
)

export interface BimFileItem {
  id: string
  projectId: string
  fileName: string
  fileUrl: string
  fileType?: string | null
  uploadedAt: string | Date
  isActive: boolean
}

interface BimTabComponentProps {
  project: {
    id: string
    name?: string | null
    title?: string | null
    bimModelUrl?: string | null
    ifcModelUrl?: string | null
    bimFiles?: BimFileItem[]
    [key: string]: any
  }
}

export function BimTabComponent({ project }: BimTabComponentProps) {
  const router = useRouter()

  // Determine initial active model URL
  const initialActiveUrl =
    project.bimFiles?.find((f) => f.isActive)?.fileUrl ||
    project.bimModelUrl ||
    project.ifcModelUrl ||
    null

  const [bimUrl, setBimUrl] = useState<string | null>(initialActiveUrl)
  const [bimFiles, setBimFiles] = useState<BimFileItem[]>(project.bimFiles || [])
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [showARModal, setShowARModal] = useState(false)
  const [showUploader, setShowUploader] = useState(false)
  const [isSwitchingModel, setIsSwitchingModel] = useState<string | null>(null)
  const [isDeletingModel, setIsDeletingModel] = useState<string | null>(null)

  // Sync state if project prop updates
  useEffect(() => {
    if (project.bimFiles && project.bimFiles.length > 0) {
      setBimFiles(project.bimFiles)
      const active = project.bimFiles.find((f) => f.isActive)
      if (active) {
        setBimUrl(active.fileUrl)
      } else if (project.bimModelUrl || project.ifcModelUrl) {
        setBimUrl(project.bimModelUrl || project.ifcModelUrl || null)
      }
    } else if (project.bimModelUrl || project.ifcModelUrl) {
      setBimUrl(project.bimModelUrl || project.ifcModelUrl || null)
    }
  }, [project.bimFiles, project.bimModelUrl, project.ifcModelUrl])

  // Component yüklendiğinde veritabanından en güncel modelleri çek
  useEffect(() => {
    refreshBimFiles()
  }, [project.id])

  // Helper to re-fetch BIM models from server
  const refreshBimFiles = async () => {
    try {
      const res = await getProjectBimFiles(project.id)
      if (res.success && res.files) {
        setBimFiles(res.files as BimFileItem[])
        const active = res.files.find((f: any) => f.isActive)
        if (active) {
          setBimUrl(active.fileUrl)
        }
      }
    } catch (err) {
      console.error("Failed to refresh BIM files:", err)
    }
  }

  // Handle switching active model
  const handleSetActive = async (file: BimFileItem) => {
    // 3D Canvas'ı anında aç ve yükleme ekranını gizle
    setBimUrl(file.fileUrl)
    setShowUploader(false)
    setIsSwitchingModel(file.id)

    try {
      const res = await setActiveBimFile(project.id, file.id)
      if (res.success && res.url) {
        setBimFiles((prev) =>
          prev.map((f) => ({
            ...f,
            isActive: f.id === file.id,
          }))
        )
        toast.success(`"${file.fileName}" açıldı!`)
        router.refresh()
      } else {
        toast.error(res.error || "Model açılırken hata oluştu.")
      }
    } catch (err) {
      console.error("Error setting active BIM file:", err)
      toast.error("Model değiştirilemedi.")
    } finally {
      setIsSwitchingModel(null)
    }
  }

  // Handle deleting a model
  const handleDelete = async (file: BimFileItem) => {
    const confirmed = window.confirm(`"${file.fileName}" modelini arşivden silmek istediğinize emin misiniz?`)
    if (!confirmed) return

    setIsDeletingModel(file.id)
    try {
      const res = await deleteBimFile(project.id, file.id)
      if (res.success) {
        toast.success("Model arşivden silindi.")
        const remaining = bimFiles.filter((f) => f.id !== file.id)
        setBimFiles(remaining)

        if (file.fileUrl === bimUrl || file.isActive) {
          const nextActive = remaining[0]?.fileUrl || null
          setBimUrl(nextActive)
        }
        router.refresh()
      } else {
        toast.error(res.error || "Model silinemedi.")
      }
    } catch (err) {
      console.error("Error deleting BIM file:", err)
      toast.error("Silme işlemi başarısız.")
    } finally {
      setIsDeletingModel(null)
    }
  }

  const isMobileDevice = () => {
    if (typeof window === "undefined") return false
    return (
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
      window.innerWidth < 768
    )
  }

  const getARUrl = () => {
    const query = bimUrl ? `?url=${encodeURIComponent(bimUrl)}` : ""
    if (typeof window !== "undefined") {
      return `${window.location.origin}/ar/${project.id}${query}`
    }
    return `/ar/${project.id}${query}`
  }

  const handleOpenAR = () => {
    if (isMobileDevice()) {
      window.location.href = getARUrl()
    } else {
      setShowARModal(true)
    }
  }

  // Active file info
  const activeBimFile = bimFiles.find((f) => f.fileUrl === bimUrl || f.isActive)

  return (
    <div className="w-full space-y-6">
      {/* Tab Header with Title & Action Buttons */}
      <div className="flex flex-wrap justify-between items-center gap-3 bg-slate-900/60 p-4 rounded-xl border border-slate-800 backdrop-blur-sm">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-bold text-white tracking-wide">3D BIM Modeli & Dijital İkiz</h3>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
              WebGL 3D
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Projenin 3D Yapı Bilgi Modellemesi, kalıcı model arşivi ve saha AR denetimi
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Quick Test / Bypass Actions */}
          <button
            type="button"
            onClick={() => {
              setBimUrl("https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/Box/glTF-Binary/Box.glb")
              setShowUploader(false)
              toast.success("🏢 3D Test Modeli (GLB) yüklendi!")
            }}
            className="px-3 py-1.5 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 rounded-lg text-xs font-semibold border border-cyan-500/30 transition-all flex items-center gap-1.5 shadow-[0_0_10px_rgba(6,182,212,0.15)] active:scale-95"
            title="Public GLB Yapı Modeli ile test edin"
          >
            <span>🏢 3D Bina (GLB)</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setBimUrl("https://raw.githubusercontent.com/IFCjs/test-datasets/main/ifc/small/small_test_1.ifc")
              setShowUploader(false)
              toast.success("🏛️ Örnek IFC Modeli yüklendi!")
            }}
            className="px-3 py-1.5 bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 rounded-lg text-xs font-semibold border border-amber-500/40 transition-all flex items-center gap-1.5 shadow-[0_0_10px_rgba(245,158,11,0.15)] active:scale-95"
            title="Örnek IFC formatı ile test edin"
          >
            <span>🏛️ Örnek IFC</span>
          </button>

          {/* AR Button */}
          {bimUrl && (
            <button
              type="button"
              onClick={handleOpenAR}
              className="relative group overflow-hidden px-4 py-2 bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white rounded-lg font-bold text-xs shadow-[0_0_20px_rgba(6,182,212,0.5)] hover:shadow-[0_0_30px_rgba(6,182,212,0.8)] border border-cyan-300/40 transition-all flex items-center gap-2 transform hover:scale-[1.02] active:scale-[0.98]"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-300 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-400 shadow-[0_0_8px_#22d3ee]"></span>
              </span>
              <svg className="w-4 h-4 text-cyan-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              <span>AR ile Sahada Gör</span>
            </button>
          )}

          {/* Upload Button: Directly sets showUploader to true */}
          <button
            type="button"
            onClick={() => setShowUploader(true)}
            className="px-3 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white rounded-lg text-xs font-semibold shadow-md transition-all flex items-center gap-1.5 active:scale-95"
            title="Yeni bir IFC / GLTF model yükleyin"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            <span>+ Yeni Model Yükle</span>
          </button>
        </div>
      </div>

      {/* Upload Dropzone: Displayed when showUploader is true */}
      {showUploader && (
        <div className="bg-slate-900/95 rounded-2xl border border-cyan-500/40 p-6 sm:p-8 shadow-2xl backdrop-blur-md relative animate-in fade-in zoom-in-95 duration-200">
          <div className="flex items-center justify-between pb-4 mb-6 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 shadow-sm">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
              </div>
              <div>
                <h4 className="text-white font-bold text-base">3D BIM / IFC / GLTF Modeli Yükleyin</h4>
                <p className="text-slate-400 text-xs">
                  Yüklenen model kalıcı model arşivinize kaydedilecek ve 3D Canvas&apos;ta anında açılacaktır.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowUploader(false)}
              className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg text-xs font-semibold border border-slate-700 transition-colors flex items-center gap-1.5 shadow-md"
            >
              <span>✕ İptal</span>
            </button>
          </div>

          <div className="w-full">
            <UploadDropzone
              endpoint="bimModelUploader"
              onUploadBegin={(fileName) => {
                console.log("🔥 UPLOAD BAŞLADI. Dosya:", fileName);
                setIsUploading(true);
              }}
              onUploadProgress={(progress) => {
                console.log("⏳ UPLOAD İLERLEME:", progress);
                setUploadProgress(progress);
              }}
              onClientUploadComplete={(res) => {
                setIsUploading(false);

                if (!res || res.length === 0) {
                  toast.error("Yükleme tamamlandı ancak sunucudan yanıt alınamadı.");
                  return;
                }

                // 1. URL'yi güvenli şekilde al (ufsUrl öncelikli)
                const resolvedUrl = (res[0] as any).serverData?.url || (res[0] as any).ufsUrl || res[0].url || (res[0] as any).fileUrl;
                const originalName = res[0].name || (res[0] as any).serverData?.name || (res[0] as any).fileName || "Yeni-Model.ifc";

                if (resolvedUrl) {
                  console.log("FRONTEND: URL başarıyla alındı:", resolvedUrl);

                  // 2. OPTIMISTIC UI: Beklemeden KUTUYU KAPAT ve MODELİ AÇ!
                  setBimUrl(resolvedUrl);
                  setShowUploader(false);

                  const tempFile: BimFileItem = {
                    id: Math.random().toString(36).substr(2, 9),
                    projectId: project.id,
                    fileName: originalName,
                    fileUrl: resolvedUrl,
                    isActive: true,
                    uploadedAt: new Date(),
                  };

                  setBimFiles((prev) => [tempFile, ...prev.map((f) => ({ ...f, isActive: false }))]);
                  toast.success("Model yüklendi! 3D ortam hazırlanıyor...");

                  // 3. Arka planda DB'ye kaydet (Hata verirse UI'ı bozmasın)
                  addBimFile(project.id, resolvedUrl, originalName)
                    .then(() => router.refresh())
                    .catch((err) => console.error("DB Kayıt Hatası (Önemsiz):", err));
                } else {
                  toast.error("Dosya yüklendi fakat geçerli bir URL döndürülemedi.");
                }
              }}
              onUploadError={(error: Error) => {
                console.error("❌ UPLOAD HATASI:", error);
                setIsUploading(false);
                toast.error(`Yükleme hatası: ${error.message}`);
              }}
            />
          </div>

          {isUploading && (
            <div className="mt-4 flex items-center justify-center gap-2 text-cyan-400 text-sm font-medium animate-pulse">
              <div className="w-4 h-4 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
              <span>Yükleniyor (%{uploadProgress}), lütfen bekleyin...</span>
            </div>
          )}
        </div>
      )}

      {/* Main 3D Viewport: Displayed when bimUrl exists */}
      {!showUploader && bimUrl && (
        <div className="relative w-full h-[620px] rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 shadow-2xl">
          {/* Active Model Indicator Header Tag */}
          <div className="absolute top-4 right-4 z-40 flex items-center gap-2">
            <div className="bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-700 shadow-xl flex items-center gap-2 text-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-slate-300 font-medium">Açık Model:</span>
              <span className="text-white font-bold truncate max-w-[180px]">
                {activeBimFile?.fileName || bimUrl.split("/").pop() || "3D Model"}
              </span>
            </div>

            <button
              type="button"
              onClick={() => setShowUploader(true)}
              className="px-3 py-1.5 bg-blue-600/90 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold border border-blue-400/40 transition-colors flex items-center gap-1 shadow-lg backdrop-blur-md active:scale-95"
            >
              <span>+ Model Değiştir</span>
            </button>
          </div>

          {/* 3D BIM Viewer Engine wrapped in Suspense */}
          <Suspense
            fallback={
              <div className="w-full h-full min-h-[620px] bg-slate-950 rounded-2xl border border-slate-800 flex flex-col items-center justify-center shadow-2xl">
                <div className="w-12 h-12 border-4 border-cyan-500/20 border-t-cyan-400 rounded-full animate-spin mb-3"></div>
                <p className="text-cyan-400 text-sm font-semibold tracking-wide">3D BIM Modeli Çözümleniyor...</p>
                <p className="text-slate-500 text-xs mt-1">WebAssembly IFC motoru ve 3D geometri yükleniyor</p>
              </div>
            }
          >
            <BimViewer
              bimUrl={bimUrl}
              url={bimUrl}
              ifcUrl={bimUrl}
              projectId={project.id}
              fileName={activeBimFile?.fileName}
            />
          </Suspense>
        </div>
      )}

      {/* Empty State: Displayed when neither uploader nor bimUrl is open */}
      {!showUploader && !bimUrl && (
        <div className="bg-slate-900/80 rounded-2xl border border-slate-800 p-8 shadow-2xl text-center">
          <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 mb-4 mx-auto shadow-lg shadow-cyan-500/10">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
          <h4 className="text-white text-lg font-bold mb-1">Henüz Aktif Model Seçilmedi</h4>
          <p className="text-slate-400 text-xs mb-6 max-w-md mx-auto leading-relaxed">
            Aşağıdaki arşivden kayıtlı bir model açabilir, test modellerini inceleyebilir veya yeni bir IFC / GLTF model yükleyebilirsiniz.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => setShowUploader(true)}
              className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white rounded-xl text-xs font-bold shadow-lg transition-all active:scale-95 flex items-center gap-2"
            >
              <span>+ İlk Modeli Yükle</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setBimUrl("/models/bina.glb")
                setShowUploader(false)
                toast.success("🏢 3D Dijital İkiz Modeli yüklendi!")
              }}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold border border-slate-700 transition-colors flex items-center gap-1.5"
            >
              <span>🏢 3D Bina (GLB) Test Et</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setBimUrl("/sample.ifc")
                setShowUploader(false)
                toast.success("🏛️ Örnek IFC Modeli yüklendi!")
              }}
              className="px-4 py-2.5 bg-purple-900/40 hover:bg-purple-800/50 text-purple-200 rounded-xl text-xs font-semibold border border-purple-500/40 transition-colors flex items-center gap-1.5"
            >
              <span>🏛️ Örnek IFC Test Et</span>
            </button>
          </div>
        </div>
      )}

      {/* Persistent BIM Archive List ("Kayıtlı BIM Modelleri" Listesi) */}
      <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-6 shadow-xl backdrop-blur-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-5 border-b border-slate-800/80 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-blue-500/30 flex items-center justify-center text-blue-400 shadow-sm">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 7v10c0 2 1.5 3 3.5 3h9c2 0 3.5-1 3.5-3V7M4 7c0-2 1.5-3 3.5-3h9c2 0 3.5 1 3.5 3M4 7h16" />
              </svg>
            </div>
            <div>
              <h4 className="text-white font-bold text-sm tracking-wide">
                Kayıtlı BIM Modelleri Arşivi
              </h4>
              <p className="text-slate-400 text-xs">
                Bu projeye yüklenmiş tüm 3D yapı modelleri ve versiyonları
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-800 text-slate-300 border border-slate-700">
              {bimFiles.length} Model Kayıtlı
            </span>

            <button
              type="button"
              onClick={refreshBimFiles}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors border border-slate-700"
              title="Listeyi Yenile"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>
        </div>

        {/* Models List */}
        {bimFiles.length === 0 ? (
          <div className="text-center py-10 px-4 border border-dashed border-slate-800 rounded-xl bg-slate-950/40">
            <div className="w-12 h-12 rounded-full bg-slate-800/80 flex items-center justify-center text-slate-400 mx-auto mb-3">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <p className="text-slate-300 text-sm font-medium mb-1">Henüz Kayıtlı Model Bulunmuyor</p>
            <p className="text-slate-500 text-xs max-w-sm mx-auto mb-4">
              Yukarıdaki alandan bir .ifc veya .glb dosyası yükleyerek bu projenin dijital ikiz arşivini oluşturabilirsiniz.
            </p>
            <button
              type="button"
              onClick={() => setShowUploader(true)}
              className="px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white rounded-lg text-xs font-semibold shadow-md transition-all active:scale-95"
            >
              + İlk Modeli Yükle
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {bimFiles.map((file) => {
              const isCurrentlyActive = file.fileUrl === bimUrl || (file.isActive && bimUrl === null)
              const fileExt = (file.fileType || file.fileName.split(".").pop() || "ifc").toUpperCase()

              return (
                <div
                  key={file.id}
                  className={`group relative rounded-xl p-4 transition-all border ${
                    isCurrentlyActive
                      ? "bg-slate-800/90 border-cyan-500/60 shadow-[0_0_20px_rgba(6,182,212,0.15)] ring-1 ring-cyan-500/40"
                      : "bg-slate-800/50 border-slate-700/60 hover:bg-slate-800 hover:border-slate-600"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 shadow-inner ${
                          fileExt === "IFC"
                            ? "bg-purple-500/20 text-purple-300 border border-purple-500/40"
                            : "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"
                        }`}
                      >
                        {fileExt}
                      </div>

                      <div className="min-w-0">
                        <h5
                          className="text-white text-sm font-semibold truncate group-hover:text-cyan-300 transition-colors"
                          title={file.fileName}
                        >
                          {file.fileName}
                        </h5>
                        <p className="text-slate-400 text-[11px] mt-0.5">
                          {new Date(file.uploadedAt).toLocaleDateString("tr-TR", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </div>

                    {isCurrentlyActive ? (
                      <span className="shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        Aktif
                      </span>
                    ) : null}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2 pt-2 border-t border-slate-700/60">
                    <button
                      type="button"
                      onClick={() => {
                        setBimUrl(file.fileUrl)
                        setShowUploader(false)
                        handleSetActive(file)
                      }}
                      disabled={isCurrentlyActive || isSwitchingModel === file.id}
                      className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
                        isCurrentlyActive
                          ? "bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 cursor-default"
                          : "bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white shadow-md active:scale-95"
                      }`}
                    >
                      {isSwitchingModel === file.id ? (
                        <>
                          <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span>Açılıyor...</span>
                        </>
                      ) : isCurrentlyActive ? (
                        <>
                          <span>✓ Şu An Açık</span>
                        </>
                      ) : (
                        <>
                          <span>👁️ Aç / Göster</span>
                        </>
                      )}
                    </button>

                    <a
                      href={file.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 rounded-lg bg-slate-700/60 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                      title="Dosyayı Yeni Sekmede Aç / İndir"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>

                    <button
                      type="button"
                      onClick={() => handleDelete(file)}
                      disabled={isDeletingModel === file.id}
                      className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 transition-colors border border-red-500/20"
                      title="Modeli Arşivden Sil"
                    >
                      {isDeletingModel === file.id ? (
                        <div className="w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* AR QR Code Modal for Desktop */}
      {showARModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="relative bg-slate-900 border border-cyan-500/30 rounded-2xl p-6 sm:p-8 max-w-md w-full shadow-[0_0_50px_rgba(6,182,212,0.25)] text-center animate-in fade-in zoom-in-95 duration-200">
            <button
              type="button"
              onClick={() => setShowARModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800 transition-colors"
            >
              ✕
            </button>

            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-bold tracking-wider uppercase mb-3">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
              Artırılmış Gerçeklik (AR)
            </div>

            <h3 className="text-xl font-bold text-white mb-1">
              AR ile Sahada Canlandır
            </h3>
            <p className="text-xs text-slate-400 mb-6 max-w-xs mx-auto">
              {project.name || project.title} projesinin 3D BIM modelini şantiye sahasında 1:1 ölçekte kameranızla görüntüleyin.
            </p>

            <div className="relative group p-4 bg-white rounded-2xl shadow-2xl mx-auto w-fit mb-5 border-4 border-cyan-400/40">
              <QRCodeSVG
                value={getARUrl()}
                size={220}
                level="H"
                includeMargin={false}
              />
            </div>

            <div className="bg-slate-800/80 rounded-xl p-3 border border-slate-700/60 mb-5">
              <p className="text-xs font-medium text-cyan-300 flex items-center justify-center gap-1.5 mb-1">
                <span>📷</span> Cihazınızın kamerasıyla okutarak modeli sahada canlandırın.
              </p>
              <p className="text-[11px] text-slate-400">
                iOS veya Android telefonunuzun kamerasını yukarıdaki QR koda doğrultun.
              </p>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(getARUrl())
                  toast.success("AR bağlantısı panoya kopyalandı!")
                }}
                className="flex-1 py-2.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-medium border border-slate-700 transition-colors flex items-center justify-center gap-1.5"
              >
                <span>🔗</span> Bağlantıyı Kopyala
              </button>

              <button
                type="button"
                onClick={() => {
                  window.open(getARUrl(), "_blank")
                }}
                className="flex-1 py-2.5 px-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-cyan-600/30 transition-all flex items-center justify-center gap-1.5"
              >
                <span>🚀</span> Yeni Sekmede Aç
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default BimTabComponent
