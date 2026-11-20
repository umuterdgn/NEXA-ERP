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
} from "@/app/actions/project"
import { Sparkles, Eye, Layers } from "lucide-react"
import Blueprint2DViewerModal from "@/components/bim/Blueprint2DViewerModal"
import BIMViewer, {
  type FederatedModelItem,
  isValid3DModelFile,
  isPdfOr2DBlueprintFile,
  isAllowedViewerFile,
} from "@/components/bim/BIMViewer"
import AiBlueprintAnalysisModal from "@/components/bim/AiBlueprintAnalysisModal"
import {
  analyzeBlueprintPdf,
  getProjectAnalyzedPdfs,
  clearProjectAiBlueprintData,
  type Blueprint2DCoordinateElement,
} from "@/actions/ai-blueprint-parser"

const DISCIPLINE_OPTIONS = ["Mimari", "Statik", "Elektrik", "Mekanik", "Harita"] as const

function inferDefaultDiscipline(fileName?: string | null): string {
  const lower = (fileName || "").toLowerCase()
  if (lower.includes("statik") || lower.includes("beton") || lower.includes("kolon")) return "Statik"
  if (lower.includes("elektrik") || lower.includes("kablo") || lower.includes("aydınlatma")) return "Elektrik"
  if (lower.includes("mekanik") || lower.includes("tesisat") || lower.includes("hvac") || lower.includes("sıhhi")) return "Mekanik"
  if (lower.includes("harita") || lower.includes("vaziyet") || lower.includes("kot") || lower.includes("hafriyat")) return "Harita"
  return "Mimari"
}

function extractSafeExt(name?: string | null, url?: string | null, type?: string | null): string {
  if (type && !type.includes("/") && type.length <= 6 && !["blueprint", "other", "specification", "contract"].includes(type.toLowerCase())) {
    return type.toLowerCase().replace(/^\./, "")
  }
  const cleanName = (name || "").split("?")[0].trim()
  if (cleanName.includes(".")) {
    const ext = cleanName.split(".").pop()?.toLowerCase()
    if (ext && ext.length <= 6) return ext
  }
  const lastSeg = ((url || "").split("?")[0].split("/").pop() || "").trim()
  if (lastSeg.includes(".")) {
    const ext = lastSeg.split(".").pop()?.toLowerCase()
    if (ext && ext.length <= 6) return ext
  }
  return "pdf"
}

export interface BimFileItem {
  id: string
  projectId: string
  fileName: string
  fileUrl: string
  fileType?: string | null
  uploadedAt: string | Date
  isActive: boolean
}

export interface ProjectDocItem {
  id: string
  projectId: string
  fileName: string
  fileUrl: string
  fileType?: string | null
  uploadedAt: string | Date
}

interface BimTabComponentProps {
  project: {
    id: string
    name?: string | null
    title?: string | null
    bimModelUrl?: string | null
    ifcModelUrl?: string | null
    bimFiles?: BimFileItem[]
    documents?: any[]
    [key: string]: any
  }
}

export function BimTabComponent({ project }: BimTabComponentProps) {
  const router = useRouter()
  const viewportContainerRef = React.useRef<HTMLDivElement>(null)

  const initial3DFiles = (project.bimFiles || []).filter((f) =>
    isValid3DModelFile(f.fileUrl, f.fileName, f.fileType)
  )

  const initialDocFiles: ProjectDocItem[] = [
    ...((project as any).documentFiles || []).map((d: any) => ({
      ...d,
      fileType: extractSafeExt(d.fileName, d.fileUrl, d.fileType),
    })),
    ...(project.bimFiles || [])
      .filter((f) => !isValid3DModelFile(f.fileUrl, f.fileName, f.fileType))
      .map((f) => ({
        id: f.id,
        projectId: f.projectId,
        fileName: f.fileName,
        fileUrl: f.fileUrl,
        fileType: extractSafeExt(f.fileName, f.fileUrl, f.fileType),
        uploadedAt: f.uploadedAt,
      })),
    ...(project.documents || [])
      .filter((d: any) => !isValid3DModelFile(d.fileUrl, d.title, d.type))
      .map((d: any) => ({
        id: d.id,
        projectId: d.projectId || project.id,
        fileName: d.title || "Proje Paftası",
        fileUrl: d.fileUrl,
        fileType: extractSafeExt(d.title, d.fileUrl, d.type),
        uploadedAt: d.createdAt || new Date(),
      })),
  ].filter((doc, index, self) => doc.fileUrl && self.findIndex((t) => t.fileUrl === doc.fileUrl) === index)

  // Determine initial active model URL (prefer valid 3D model, fallback to PDF/2D extrusion blueprint)
  const initialActiveUrl =
    initial3DFiles.find((f) => f.isActive)?.fileUrl ||
    initial3DFiles[0]?.fileUrl ||
    (project.bimFiles || []).find((f) => f.isActive)?.fileUrl ||
    project.bimModelUrl ||
    project.ifcModelUrl ||
    initialDocFiles[0]?.fileUrl ||
    null

  const [viewMode, setViewMode] = useState<"MODEL_3D" | "EXTRUSION_2D_TO_3D">(() => {
    if (initial3DFiles.length > 0 && initialActiveUrl && isValid3DModelFile(initialActiveUrl)) {
      return "MODEL_3D"
    }
    return "EXTRUSION_2D_TO_3D"
  })
  const [isResettingAiData, setIsResettingAiData] = useState(false)
  const [bimUrl, setBimUrl] = useState<string | null>(initialActiveUrl)
  const [activeFileName, setActiveFileName] = useState<string | undefined>(undefined)
  const [bimFiles, setBimFiles] = useState<BimFileItem[]>(initial3DFiles)
  const [documentFiles, setDocumentFiles] = useState<ProjectDocItem[]>(initialDocFiles)
  const [docDisciplines, setDocDisciplines] = useState<Record<string, string>>(() => {
    const map: Record<string, string> = {}
    initialDocFiles.forEach((d) => {
      map[d.fileUrl] = inferDefaultDiscipline(d.fileName)
    })
    return map
  })
  const [selectedDiscipline, setSelectedDiscipline] = useState<string>("Mimari")
  const [analyzedPdfsMap, setAnalyzedPdfsMap] = useState<
    Record<string, { discipline: string; elements: Blueprint2DCoordinateElement[] }>
  >({})
  const [selected2DModalDoc, setSelected2DModalDoc] = useState<ProjectDocItem | null>(null)
  const [isFederatedMode, setIsFederatedMode] = useState<boolean>(true)
  const [isAiModalOpen, setIsAiModalOpen] = useState(false)
  const [selectedAiDoc, setSelectedAiDoc] = useState<{ title: string; url: string; discipline: string } | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [showARModal, setShowARModal] = useState(false)
  const [showUploader, setShowUploader] = useState(false)
  const [isSwitchingModel, setIsSwitchingModel] = useState<string | null>(null)
  const [isDeletingModel, setIsDeletingModel] = useState<string | null>(null)
  const [isConvertingTo3DDocUrl, setIsConvertingTo3DDocUrl] = useState<string | null>(null)

  // AI 3D Analiz Verilerini Sıfırlama: Eski mock ve pafta analizlerini temizler
  const handleResetAiData = async () => {
    const confirmed = window.confirm(
      "Bu projeye ait tüm AI pafta analiz kayıtları ve eski 3D ekstrüzyon verileri veritabanından kalıcı olarak temizlenecektir. Devam etmek istiyor musunuz?"
    )
    if (!confirmed) return

    setIsResettingAiData(true)
    const toastId = toast.loading("AI 3D verileri temizleniyor...")
    try {
      const res = await clearProjectAiBlueprintData(project.id)
      if (res.success) {
        setAnalyzedPdfsMap({})
        if (viewMode === "EXTRUSION_2D_TO_3D") {
          if (bimFiles.length > 0) {
            setViewMode("MODEL_3D")
            setBimUrl(bimFiles[0].fileUrl)
            setActiveFileName(bimFiles[0].fileName)
          } else {
            setBimUrl(null)
          }
        }
        toast.success(res.message || "AI 3D analiz verileri sıfırlandı.", { id: toastId })
        router.refresh()
      } else {
        toast.error(res.error || "Sıfırlama işlemi başarısız.", { id: toastId })
      }
    } catch (err: any) {
      toast.error(err?.message || "Veriler sıfırlanırken hata oluştu.", { id: toastId })
    } finally {
      setIsResettingAiData(false)
    }
  }

  // Doğrudan "3D'ye Aktar" Motoru: Bekletme veya demo olmadan anında AI analizi yapıp 3D BIM sahnesine ekler
  const handleDirect3DConversion = async (doc: ProjectDocItem, overrideDiscipline?: string) => {
    const targetDiscipline =
      overrideDiscipline ||
      docDisciplines[doc.fileUrl] ||
      analyzedPdfsMap[doc.fileUrl]?.discipline ||
      inferDefaultDiscipline(doc.fileName)

    setIsConvertingTo3DDocUrl(doc.fileUrl)
    const toastId = toast.loading(
      `"${doc.fileName}" (${targetDiscipline}) 3D BIM geometrisine aktarılıyor...`
    )

    try {
      const res = await analyzeBlueprintPdf(doc.fileUrl, project.id, targetDiscipline)
      if (res.success && res.elements2D && res.elements2D.length > 0) {
        setAnalyzedPdfsMap((prev) => ({
          ...prev,
          [doc.fileUrl]: {
            discipline: res.selectedDiscipline || targetDiscipline,
            elements: res.elements2D!,
          },
        }))
        setDocDisciplines((prev) => ({
          ...prev,
          [doc.fileUrl]: res.selectedDiscipline || targetDiscipline,
        }))
        setViewMode("EXTRUSION_2D_TO_3D")
        setBimUrl(doc.fileUrl)
        setActiveFileName(doc.fileName)
        setSelectedDiscipline(res.selectedDiscipline || targetDiscipline)
        setIsFederatedMode(true)
        setShowUploader(false)
        setSelected2DModalDoc(null)

        toast.success(
          `✨ "${doc.fileName}" (${res.elements2D.length} Yapısal Eleman) başarıyla 3D BIM sahnesine eklendi!`,
          { id: toastId }
        )

        setTimeout(() => {
          viewportContainerRef.current?.scrollIntoView({
            behavior: "smooth",
            block: "start",
          })
        }, 150)
      } else {
        toast.error(res.error || "3D geometri çıkarılamadı.", { id: toastId })
      }
    } catch (err: any) {
      console.error("3D Dönüştürme Hatası:", err)
      toast.error(err?.message || "3D geometriye aktarılırken hata oluştu.", {
        id: toastId,
      })
    } finally {
      setIsConvertingTo3DDocUrl(null)
    }
  }

  // Bütünleşik Model (Tüm Katmanlar Birlikte): Tüm analiz edilmiş paftalardaki koordinatları birleştir
  const federatedElements = React.useMemo(() => {
    const list: Blueprint2DCoordinateElement[] = []
    Object.entries(analyzedPdfsMap).forEach(([docUrl, item]) => {
      if (item?.elements && Array.isArray(item.elements)) {
        item.elements.forEach((el) => {
          list.push({
            ...el,
            disiplin: el.disiplin || item.discipline || inferDefaultDiscipline(docUrl),
          })
        })
      }
    })
    return list
  }, [analyzedPdfsMap])

  const federatedCounts = React.useMemo(() => {
    const counts = { mimari: 0, statik: 0, elektrik: 0, mekanik: 0 }
    federatedElements.forEach((el) => {
      const d = (el.disiplin || "").toLowerCase()
      if (d.includes("statik")) counts.statik++
      else if (d.includes("elektrik")) counts.elektrik++
      else if (d.includes("mekanik") || d.includes("tesisat") || d.includes("hvac")) counts.mekanik++
      else counts.mimari++
    })
    return counts
  }, [federatedElements])

  // Sync state if project prop updates
  useEffect(() => {
    if (project.bimFiles && project.bimFiles.length > 0) {
      const valid3D = project.bimFiles.filter((f) =>
        isValid3DModelFile(f.fileUrl, f.fileName, f.fileType)
      )
      setBimFiles(valid3D)
      const active = valid3D.find((f) => f.isActive) || valid3D[0]
      const activeAny = project.bimFiles.find((f) => f.isActive)
      if (active) {
        setBimUrl((prev) => prev || active.fileUrl)
      } else if (activeAny) {
        setBimUrl((prev) => prev || activeAny.fileUrl)
        setActiveFileName(activeAny.fileName)
      } else if (project.bimModelUrl) {
        setBimUrl((prev) => prev || project.bimModelUrl || null)
      } else if (project.ifcModelUrl) {
        setBimUrl((prev) => prev || project.ifcModelUrl || null)
      }
    } else if (project.bimModelUrl) {
      setBimUrl((prev) => prev || project.bimModelUrl || null)
    } else if (project.ifcModelUrl) {
      setBimUrl((prev) => prev || project.ifcModelUrl || null)
    }
  }, [project.bimFiles, project.bimModelUrl, project.ifcModelUrl])

  // Component yüklendiğinde veritabanından en güncel modelleri ve analiz edilmiş PDF'leri çek
  useEffect(() => {
    refreshBimFiles()
    getProjectAnalyzedPdfs(project.id)
      .then((res) => {
        if (res.success && res.analyzedMap) {
          setAnalyzedPdfsMap(res.analyzedMap)
          setDocDisciplines((prev) => {
            const next = { ...prev }
            Object.entries(res.analyzedMap).forEach(([url, info]) => {
              if (info.discipline) next[url] = info.discipline
            })
            return next
          })
        }
      })
      .catch(() => {})
  }, [project.id])

  // Helper to re-fetch BIM models from server (Sadece .ifc, .gltf, .glb modeller bimFiles'a düşer)
  const refreshBimFiles = async () => {
    try {
      const res = await getProjectBimFiles(project.id)
      if (res.success && res.files) {
        const valid3D = (res.files as BimFileItem[]).filter((f) =>
          isValid3DModelFile(f.fileUrl, f.fileName, f.fileType)
        )
        setBimFiles(valid3D)
        const docs = ((res as any).documents || []) as ProjectDocItem[]
        if ((res as any).documents) {
          setDocumentFiles(docs)
        }
        const active = valid3D.find((f: any) => f.isActive) || valid3D[0]
        if (active) {
          setBimUrl((prev) => prev || active.fileUrl)
        } else {
          const pdfDoc = docs.find((d) => isPdfOr2DBlueprintFile(d.fileUrl, d.fileName, d.fileType))
          if (pdfDoc) {
            setBimUrl((prev) => prev || pdfDoc.fileUrl)
            setActiveFileName((prev) => prev || pdfDoc.fileName)
          }
        }
      }
    } catch (err) {
      console.error("Failed to refresh BIM files:", err)
    }
  }

  // Handle switching active model
  const handleSetActive = async (file: BimFileItem) => {
    // 3D Canvas'ı anında aç, viewMode'u MODEL_3D yap ve yükleme ekranını gizle
    setViewMode("MODEL_3D")
    setBimUrl(file.fileUrl)
    setActiveFileName(file.fileName)
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
    let rawUrl = bimUrl || project.bimFiles?.find((f) => f.isActive)?.fileUrl || project.bimModelUrl || project.ifcModelUrl || ""
    if (rawUrl.startsWith("blob:")) {
      rawUrl = project.bimFiles?.find((f) => f.isActive && !f.fileUrl.startsWith("blob:"))?.fileUrl || project.bimModelUrl || project.ifcModelUrl || "/models/bina.glb"
    }
    const query = rawUrl ? `?url=${encodeURIComponent(rawUrl)}` : ""
    if (typeof window !== "undefined") {
      return `${window.location.origin}/tr/ar/${project.id}${query}`
    }
    return `/tr/ar/${project.id}${query}`
  }

  const handleOpenAR = () => {
    if (isMobileDevice()) {
      window.location.href = getARUrl()
    } else {
      setShowARModal(true)
    }
  }

  // Active file info
  const activeBimFile = bimFiles.find((f) => f.fileUrl === bimUrl) || bimFiles.find((f) => f.isActive)
  const activeDocFile = documentFiles.find((d) => d.fileUrl === bimUrl)
  const resolvedActiveFileName =
    (activeBimFile?.fileUrl === bimUrl ? activeBimFile?.fileName : undefined) ||
    activeDocFile?.fileName ||
    activeFileName ||
    activeBimFile?.fileName
  const resolvedActiveFileType =
    (activeBimFile?.fileUrl === bimUrl ? activeBimFile?.fileType : undefined) ||
    activeDocFile?.fileType ||
    activeBimFile?.fileType

  return (
    <div className="w-full space-y-6">
      {/* Tab Header with Title & Action Buttons - Clean, Zero Wrapping Collision */}
      <div className="flex flex-wrap justify-between items-center gap-3 bg-slate-900/80 p-4 rounded-xl border border-slate-800 backdrop-blur-sm">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-base sm:text-lg font-bold text-white tracking-wide truncate">
              3D BIM Modeli &amp; Dijital İkiz
            </h3>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 whitespace-nowrap shrink-0">
              Gerçek Metrik CAD + BIM
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Projenize yüklenen DWG, DXF, PDF, IFC ve GLB çizimlerinden gerçek metrik 2D/3D inceleme ve saha AR denetimi
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {/* AR Button */}
          {(bimUrl || project.bimFiles?.length || project.bimModelUrl || project.ifcModelUrl) && (
            <button
              type="button"
              onClick={handleOpenAR}
              className="px-3.5 py-2 bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white rounded-lg font-bold text-xs shadow-md border border-cyan-400/40 transition-all flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer active:scale-95"
            >
              <span className="relative flex h-2 w-2 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-300 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-400"></span>
              </span>
              <span>📱 AR ile Sahada Gör</span>
            </button>
          )}

          {/* Upload Button: Directly sets showUploader to true */}
          <button
            type="button"
            onClick={() => setShowUploader(true)}
            className="px-3.5 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white rounded-lg text-xs font-semibold shadow-md transition-all flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer active:scale-95"
            title="Yeni DWG, DXF, PDF, IFC veya GLB dosya yükleyin"
          >
            <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            <span>+ Dosya / Model Yükle</span>
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
                const resolvedUrl = (res[0] as any).serverData?.url || (res[0] as any).ufsUrl || res[0].url;
                const originalName = res[0].name || (res[0] as any).serverData?.name || "Yeni-Model.ifc";

                if (resolvedUrl) {
                  console.log("FRONTEND: URL başarıyla alındı:", resolvedUrl);

                  // ADIM 1: Dosya uzantısı kontrolü (.pdf, .dwg, .dxf ise hata fırlatma, AI 2D-to-3D Extrusion motorunu devreye sok)
                  if (isPdfOr2DBlueprintFile(resolvedUrl, originalName)) {
                    const inferredDisc = inferDefaultDiscipline(originalName);
                    setBimUrl(resolvedUrl);
                    setActiveFileName(originalName);
                    setSelectedDiscipline(inferredDisc);
                    setDocDisciplines((prev) => ({ ...prev, [resolvedUrl]: inferredDisc }));
                    setShowUploader(false);

                    const newDoc: ProjectDocItem = {
                      id: Math.random().toString(36).substring(2, 11),
                      projectId: project.id,
                      fileName: originalName,
                      fileUrl: resolvedUrl,
                      fileType: extractSafeExt(originalName, resolvedUrl),
                      uploadedAt: new Date(),
                    };
                    setDocumentFiles((prev) => [newDoc, ...prev]);
                    toast.success("PDF pafta seçildi! AI verileriyle R3F 2D→3D Extrusion modeli hazırlanıyor...");

                    addBimFile(project.id, resolvedUrl, originalName)
                      .then(() => router.refresh())
                      .catch((err) => console.error("Doküman Kayıt Hatası:", err));

                    analyzeBlueprintPdf(resolvedUrl, project.id, inferredDisc)
                      .then((aiRes) => {
                        if (aiRes.success && aiRes.elements2D && aiRes.elements2D.length > 0) {
                          setAnalyzedPdfsMap((prev) => ({
                            ...prev,
                            [resolvedUrl]: {
                              discipline: aiRes.selectedDiscipline || inferredDisc,
                              elements: aiRes.elements2D!,
                            },
                          }));
                        }
                        router.refresh();
                      })
                      .catch((err) => console.warn("AI 2D→3D Analiz uyarısı:", err));
                    return;
                  }

                  if (!isAllowedViewerFile(resolvedUrl, originalName)) {
                    setShowUploader(false);
                    toast.error("Desteklenmeyen dosya formatı. Lütfen .ifc, .gltf, .glb veya .pdf uzantılı bir dosya seçin.");
                    const newDoc: ProjectDocItem = {
                      id: Math.random().toString(36).substring(2, 11),
                      projectId: project.id,
                      fileName: originalName,
                      fileUrl: resolvedUrl,
                      fileType: extractSafeExt(originalName, resolvedUrl),
                      uploadedAt: new Date(),
                    };
                    setDocumentFiles((prev) => [newDoc, ...prev]);
                    addBimFile(project.id, resolvedUrl, originalName)
                      .then(() => router.refresh())
                      .catch((err) => console.error("Doküman Kayıt Hatası:", err));
                    return;
                  }
                  
                  // 2. OPTIMISTIC UI: Beklemeden KUTUYU KAPAT ve MODELİ AÇ!
                  setBimUrl(resolvedUrl);
                  setActiveFileName(originalName);
                  setShowUploader(false);
                  
                  const tempFile = {
                    id: Math.random().toString(36).substring(2, 11),
                    projectId: project.id,
                    fileName: originalName,
                    fileUrl: resolvedUrl,
                    isActive: true,
                    uploadedAt: new Date()
                  };
                  
                  setBimFiles(prev => [tempFile, ...prev.map(f => ({ ...f, isActive: false }))]);
                  toast.success("Model yüklendi! 3D ortam hazırlanıyor...");

                  // 3. Arka planda DB'ye kaydet (Hata verirse UI'ı bozmasın)
                  addBimFile(project.id, resolvedUrl, originalName)
                    .then(() => router.refresh())
                    .catch(err => console.error("DB Kayıt Hatası (Önemsiz):", err));
                    
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
        <div ref={viewportContainerRef} className="w-full space-y-3">
          {/* Active Model Indicator Header Bar (Normal Flow above 3D Canvas) */}
          <div className="flex flex-wrap items-center justify-between gap-2.5 px-4 py-2.5 bg-slate-900/90 rounded-xl border border-slate-800 backdrop-blur-md shadow-lg">
            <div className="flex items-center gap-2 text-xs flex-wrap">
              {viewMode === "MODEL_3D" ? (
                <>
                  <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-cyan-500/15 text-cyan-300 border border-cyan-500/40 flex items-center gap-1.5 shrink-0">
                    <span>🏛️</span>
                    <span>3D BIM Modeli</span>
                  </span>

                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-slate-400 font-medium">Açık:</span>
                    <span className="text-white font-bold truncate max-w-[200px] sm:max-w-sm">
                      {resolvedActiveFileName || bimUrl.split("/").pop() || "3D Model"}
                    </span>
                  </div>

                  {federatedElements.length > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        setViewMode("EXTRUSION_2D_TO_3D")
                        toast.success("📐 2D→3D Ekstrüzyon görünümüne geçildi.")
                      }}
                      className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 transition-all flex items-center gap-1 cursor-pointer"
                    >
                      <span>📐 2D→3D Ekstrüzyona Geç ({federatedElements.length} Eleman)</span>
                    </button>
                  )}
                </>
              ) : (
                <>
                  {/* Bütünleşik Model vs Tekil Model Toggle */}
                  <button
                    type="button"
                    onClick={() => {
                      const next = !isFederatedMode
                      setIsFederatedMode(next)
                      if (next) {
                        toast.success("🌐 Bütünleşik 3D Model: Tüm analiz edilmiş katmanlar (Mimari, Statik, MEP) birleştirildi!")
                      } else {
                        toast("📄 Tekil Pafta görünümüne geçildi.")
                      }
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 ${
                      isFederatedMode
                        ? "bg-gradient-to-r from-blue-600 to-cyan-600 text-white border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.4)]"
                        : "bg-slate-800/80 hover:bg-slate-800 text-slate-300 border-slate-700"
                    }`}
                    title="Tüm pafta ve modelleri tek bir 3D sahnede birleşik göster"
                  >
                    <span>🌐</span>
                    <span>{isFederatedMode ? "Bütünleşik Model" : "Tekil Pafta Modu"}</span>
                  </button>

                  <div className="h-4 w-px bg-slate-800 hidden sm:block" />

                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                    <span className="text-slate-400 font-medium">Açık:</span>
                    <span className="text-white font-bold truncate max-w-[160px] sm:max-w-xs">
                      {isFederatedMode
                        ? `Bütünleşik Model (${federatedElements.length > 0 ? federatedElements.length : (analyzedPdfsMap[bimUrl]?.elements?.length || 0)} Yapısal Eleman)`
                        : (resolvedActiveFileName || bimUrl.split("/").pop() || "Pafta")}
                    </span>
                  </div>

                  {bimFiles.length > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        setViewMode("MODEL_3D")
                        if (bimFiles[0]) {
                          setBimUrl(bimFiles[0].fileUrl)
                          setActiveFileName(bimFiles[0].fileName)
                        }
                        toast.success("🏛️ 3D BIM Modeline geçildi.")
                      }}
                      className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 transition-all flex items-center gap-1 cursor-pointer"
                    >
                      <span>🏛️ 3D Modele Geç ({bimFiles.length})</span>
                    </button>
                  )}

                  {/* Katman İstatistik Rozetleri */}
                  {isFederatedMode && federatedElements.length > 0 && (
                    <div className="hidden xl:flex items-center gap-1 text-[10px]">
                      <span className="px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-300 border border-blue-500/30 font-mono">
                        Statik: {federatedCounts.statik}
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 font-mono">
                        Mimari: {federatedCounts.mimari}
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 font-mono">
                        Mekanik: {federatedCounts.mekanik}
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-yellow-500/15 text-yellow-300 border border-yellow-500/30 font-mono">
                        Elektrik: {federatedCounts.elektrik}
                      </span>
                    </div>
                  )}
                </>
              )}
            </div>

            <button
              type="button"
              onClick={() => setShowUploader(true)}
              className="px-3 py-1.5 bg-blue-600/90 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold border border-blue-400/40 transition-colors flex items-center gap-1 shadow-md active:scale-95"
            >
              <span>+ Model Yükle</span>
            </button>
          </div>

          <div className="relative w-full h-[680px] lg:h-[740px] rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 shadow-2xl">
            {/* 3D BIMViewer / GeometryEngine2Dto3D render ediliyor */}
            <Suspense
              fallback={
                <div className="w-full h-full min-h-[620px] bg-slate-950 rounded-2xl border border-slate-800 flex flex-col items-center justify-center shadow-2xl">
                  <div className="w-12 h-12 border-4 border-cyan-500/20 border-t-cyan-400 rounded-full animate-spin mb-3"></div>
                  <p className="text-cyan-400 text-sm font-semibold tracking-wide">3D BIM Modeli Çözümleniyor...</p>
                  <p className="text-slate-500 text-xs mt-1">WebAssembly IFC motoru ve 3D geometri yükleniyor</p>
                </div>
              }
            >
              <BIMViewer
                bimUrl={bimUrl}
                url={bimUrl}
                ifcUrl={bimUrl}
                projectId={project.id}
                fileName={resolvedActiveFileName}
                viewMode={viewMode}
                onViewModeChange={setViewMode}
                aiData={
                  viewMode === "MODEL_3D"
                    ? undefined
                    : isFederatedMode && federatedElements.length > 0
                    ? federatedElements
                    : analyzedPdfsMap[bimUrl]?.elements
                }
                discipline={
                  isFederatedMode && federatedElements.length > 0
                    ? "Bütünleşik"
                    : analyzedPdfsMap[bimUrl]?.discipline ||
                      docDisciplines[bimUrl] ||
                      selectedDiscipline
                }
                hasAiAnalysis={
                  viewMode === "MODEL_3D"
                    ? false
                    : (isFederatedMode && federatedElements.length > 0) ||
                      Boolean(analyzedPdfsMap[bimUrl])
                }
                onTriggerAiAnalysis={() => {
                  const targetDoc = documentFiles.find((d) => d.fileUrl === bimUrl) || {
                    id: "active-doc",
                    projectId: project.id,
                    fileName: resolvedActiveFileName || "Proje-Paftasi.pdf",
                    fileUrl: bimUrl,
                    fileType: resolvedActiveFileType || "pdf",
                    uploadedAt: new Date(),
                  }
                  handleDirect3DConversion(targetDoc, selectedDiscipline)
                }}
                onOpen2DViewer={() => {
                  const targetDoc = documentFiles.find((d) => d.fileUrl === bimUrl) || {
                    id: "active-doc",
                    projectId: project.id,
                    fileName: resolvedActiveFileName || "Proje-Paftasi.pdf",
                    fileUrl: bimUrl,
                    fileType: resolvedActiveFileType || "pdf",
                    uploadedAt: new Date(),
                  }
                  setSelected2DModalDoc(targetDoc)
                }}
                models={bimFiles.map((f, i) => {
                  const lower = (f.fileName || "").toLowerCase()
                  const cat = lower.includes("statik")
                    ? "statik"
                    : lower.includes("elektrik")
                    ? "elektrik"
                    : lower.includes("mekanik")
                    ? "mekanik"
                    : lower.includes("akustik")
                    ? "akustik"
                    : "mimari"
                  const col =
                    cat === "statik"
                      ? "#3b82f6"
                      : cat === "elektrik"
                      ? "#eab308"
                      : cat === "mekanik"
                      ? "#06b6d4"
                      : cat === "akustik"
                      ? "#a855f7"
                      : "#f97316"
                  return {
                    id: f.id || `file-${i}`,
                    name: f.fileName,
                    url: f.fileUrl,
                    category: cat,
                    color: col,
                    visible: f.isActive ?? true,
                  }
                })}
              />
            </Suspense>
          </div>
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
            Aşağıdaki arşivden yüklediğiniz bir DWG, DXF, PDF, IFC veya GLB dosyasını seçip 2D görüntüleyebilir, 3D&apos;ye aktarabilir veya yeni bir proje dosyası yükleyebilirsiniz.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => setShowUploader(true)}
              className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white rounded-xl text-xs font-bold shadow-lg transition-all active:scale-95 flex items-center gap-2 cursor-pointer whitespace-nowrap"
            >
              <span>+ İlk Proje Dosyasını / Modeli Yükle</span>
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
                Bu projeye yüklenmiş tüm 3D yapı modelleri (.ifc, .gltf, .glb) ve versiyonları
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

                    <button
                      type="button"
                      onClick={() => {
                        const targetArUrl = `/ar/${project.id}?url=${encodeURIComponent(file.fileUrl)}`
                        window.open(targetArUrl, "_blank")
                      }}
                      className="p-1.5 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 hover:text-cyan-300 transition-colors border border-cyan-500/30"
                      title="Bu Modeli AR'da Görüntüle"
                    >
                      <svg className="w-4 h-4 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
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

      {/* ADIM 2: Ayrı "Proje Evrakları ve Paftalar" Bölümü (PDF, DOCX, XLSX ve AI Analiz Listesi) */}
      <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-6 shadow-xl backdrop-blur-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-5 border-b border-slate-800/80 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-sm">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <h4 className="text-white font-bold text-sm tracking-wide">
                Proje Evrakları ve Paftalar
              </h4>
              <p className="text-slate-400 text-xs">
                PDF paftalar, 2B çizimler ve teknik dokümanlar (.pdf, .docx, .xlsx) — AI Blueprint OCR ile analiz edilebilir
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={handleResetAiData}
              disabled={isResettingAiData}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer disabled:opacity-50 shrink-0"
              title="Bu projedeki tüm AI pafta analizlerini ve eski 3D verilerini veritabanından kalıcı siler ve temiz bir sahne açar"
            >
              {isResettingAiData ? (
                <>
                  <div className="w-3 h-3 border-2 border-rose-400 border-t-transparent rounded-full animate-spin shrink-0" />
                  <span>Sıfırlanıyor...</span>
                </>
              ) : (
                <>
                  <span>🗑️</span>
                  <span>AI 3D Verilerini Sıfırla</span>
                </>
              )}
            </button>

            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-300 border border-amber-500/30 shrink-0">
              {documentFiles.length} Evrak / Pafta
            </span>
          </div>
        </div>

        {documentFiles.length === 0 ? (
          <div className="text-center py-8 px-4 border border-dashed border-slate-800 rounded-xl bg-slate-950/40">
            <p className="text-slate-400 text-xs">
              Henüz yüklenmiş PDF pafta veya proje evrakı bulunmuyor.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            {documentFiles.map((doc) => {
              const ext = extractSafeExt(doc.fileName, doc.fileUrl, doc.fileType).toUpperCase()
              const currentDiscipline =
                docDisciplines[doc.fileUrl] ||
                analyzedPdfsMap[doc.fileUrl]?.discipline ||
                inferDefaultDiscipline(doc.fileName)
              const isAnalyzed = Boolean(analyzedPdfsMap[doc.fileUrl])

              return (
                <div
                  key={doc.id}
                  className="rounded-xl p-4 bg-slate-800/50 border border-slate-700/60 hover:bg-slate-800 hover:border-amber-500/40 transition-all flex flex-col justify-between gap-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-amber-500/15 text-amber-300 border border-amber-500/30 flex items-center justify-center font-bold text-xs shrink-0">
                        {ext}
                      </div>
                      <div className="min-w-0">
                        <h5 className="text-white text-sm font-semibold truncate" title={doc.fileName}>
                          {doc.fileName}
                        </h5>
                        <p className="text-slate-400 text-[11px] mt-0.5">
                          {new Date(doc.uploadedAt).toLocaleDateString("tr-TR", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </p>
                      </div>
                    </div>

                    {isAnalyzed && (
                      <span className="shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                        ✓ AI Analizli ({analyzedPdfsMap[doc.fileUrl]?.discipline})
                      </span>
                    )}
                  </div>

                  {/* Temiz 2 Satırlı Aksiyon Gridi (Kayma / Üst Üste Binme Yok) */}
                  <div className="space-y-2 pt-3 border-t border-slate-700/60">
                    {/* Satır 1: Disiplin Seçici + 2D Görüntüle */}
                    <div className="flex items-center gap-2">
                      <select
                        value={currentDiscipline}
                        onChange={(e) => {
                          const val = e.target.value
                          setDocDisciplines((prev) => ({ ...prev, [doc.fileUrl]: val }))
                          if (bimUrl === doc.fileUrl) {
                            setSelectedDiscipline(val)
                          }
                        }}
                        className="flex-1 min-w-0 px-2.5 py-1.5 rounded-lg bg-slate-900 border border-amber-500/40 text-amber-300 text-xs font-bold focus:outline-none focus:border-cyan-400 cursor-pointer"
                        title="Pafta Disiplinini Seçin (Mimari, Statik, Elektrik, Mekanik, Harita)"
                      >
                        {DISCIPLINE_OPTIONS.map((disc) => (
                          <option key={disc} value={disc} className="bg-slate-900 text-white">
                            {disc}
                          </option>
                        ))}
                      </select>

                      <button
                        type="button"
                        onClick={() => setSelected2DModalDoc(doc)}
                        className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 hover:border-amber-400/50 text-xs font-semibold transition-all flex items-center justify-center gap-1.5 shrink-0 whitespace-nowrap active:scale-95 cursor-pointer"
                        title="2D Paftayı ve CAD Çizimini Yüksek Çözünürlükte İncele (DWG, DXF, PDF, Görsel)"
                      >
                        <Eye className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        <span>2D Görüntüle</span>
                      </button>
                    </div>

                    {/* Satır 2: Doğrudan 3D'ye Aktar + 3D Aç */}
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleDirect3DConversion(doc, currentDiscipline)}
                        disabled={isConvertingTo3DDocUrl === doc.fileUrl}
                        className={`flex-1 min-w-0 py-1.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-sm whitespace-nowrap cursor-pointer active:scale-95 ${
                          isConvertingTo3DDocUrl === doc.fileUrl
                            ? "bg-cyan-500/30 text-cyan-200 border border-cyan-400/50 cursor-wait"
                            : isAnalyzed
                            ? "bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300"
                            : "bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white shadow-md shadow-cyan-600/20"
                        }`}
                        title="2D Çizimdeki Gerçek Metrik Verileri 3D Geometriye Çevir ve Mevcut 3D BIM Modeline Ekle"
                      >
                        {isConvertingTo3DDocUrl === doc.fileUrl ? (
                          <>
                            <div className="w-3.5 h-3.5 border-2 border-cyan-300 border-t-transparent rounded-full animate-spin shrink-0" />
                            <span className="truncate">Aktarılıyor...</span>
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-3.5 h-3.5 text-cyan-300 shrink-0" />
                            <span className="truncate">{isAnalyzed ? "Yeniden 3D'ye Aktar" : "3D'ye Aktar"}</span>
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setViewMode("EXTRUSION_2D_TO_3D")
                          setBimUrl(doc.fileUrl)
                          setActiveFileName(doc.fileName)
                          setSelectedDiscipline(currentDiscipline)
                          setShowUploader(false)
                          viewportContainerRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
                          if (isAnalyzed) {
                            toast.success(`"${doc.fileName}" (${currentDiscipline}) 3D sahnede odaklandı!`)
                          } else {
                            toast(`"${doc.fileName}" seçildi. Gerçek metrik 3D oluşturmak için "3D'ye Aktar" butonuna tıklayın.`)
                          }
                        }}
                        className="px-3 py-1.5 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 text-xs font-semibold transition-colors shrink-0 whitespace-nowrap flex items-center justify-center gap-1 cursor-pointer"
                        title="3D Canvas'ta Aç"
                      >
                        <span>3D Aç</span>
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* AI Blueprint Vision Modal */}
      {selectedAiDoc && (
        <AiBlueprintAnalysisModal
          isOpen={isAiModalOpen}
          onClose={() => setIsAiModalOpen(false)}
          documentTitle={selectedAiDoc.title}
          documentUrl={selectedAiDoc.url}
          projectId={project.id}
          selectedDiscipline={selectedAiDoc.discipline}
          onSuccessTransfer={(result) => {
            if (result?.elements2D && result.elements2D.length > 0) {
              setAnalyzedPdfsMap((prev) => ({
                ...prev,
                [selectedAiDoc.url]: {
                  discipline: result.selectedDiscipline || selectedAiDoc.discipline,
                  elements: result.elements2D!,
                },
              }))
            }
            setBimUrl(selectedAiDoc.url)
            setActiveFileName(selectedAiDoc.title)
            setSelectedDiscipline(selectedAiDoc.discipline)
            setShowUploader(false)
            viewportContainerRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
            router.refresh()
          }}
        />
      )}

      {/* 2D Pafta & Blueprint Detaylı Önizleme Modal'ı */}
      {selected2DModalDoc && (
        <Blueprint2DViewerModal
          isOpen={Boolean(selected2DModalDoc)}
          onClose={() => setSelected2DModalDoc(null)}
          fileName={selected2DModalDoc.fileName}
          fileUrl={selected2DModalDoc.fileUrl}
          fileType={selected2DModalDoc.fileType || "pdf"}
          projectId={project.id}
          discipline={
            docDisciplines[selected2DModalDoc.fileUrl] ||
            analyzedPdfsMap[selected2DModalDoc.fileUrl]?.discipline ||
            inferDefaultDiscipline(selected2DModalDoc.fileName)
          }
          onDisciplineChange={(newDisc) => {
            setDocDisciplines((prev) => ({
              ...prev,
              [selected2DModalDoc.fileUrl]: newDisc,
            }))
          }}
          isAnalyzed={Boolean(analyzedPdfsMap[selected2DModalDoc.fileUrl])}
          elementCount={
            analyzedPdfsMap[selected2DModalDoc.fileUrl]?.elements?.length || 0
          }
          isConvertingTo3D={isConvertingTo3DDocUrl === selected2DModalDoc.fileUrl}
          onDirect3DConvert={() => handleDirect3DConversion(selected2DModalDoc)}
          onTriggerAiAnalysis={() => handleDirect3DConversion(selected2DModalDoc)}
          onOpenIn3D={() => {
            const currentDisc =
              docDisciplines[selected2DModalDoc.fileUrl] ||
              inferDefaultDiscipline(selected2DModalDoc.fileName)
            setViewMode("EXTRUSION_2D_TO_3D")
            setBimUrl(selected2DModalDoc.fileUrl)
            setActiveFileName(selected2DModalDoc.fileName)
            setSelectedDiscipline(currentDisc)
            setShowUploader(false)
            viewportContainerRef.current?.scrollIntoView({
              behavior: "smooth",
              block: "start",
            })
            toast.success(
              `"${selected2DModalDoc.fileName}" 3D ortama yüklendi!`
            )
          }}
        />
      )}

      {/* AR QR Code Modal for Desktop */}
      {showARModal && (
        <div className="fixed inset-0 z-[1100] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
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
