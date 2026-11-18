"use client"
/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Universal Architectural 2D Viewer Modal (DWG / DXF / PDF / PNG / JPG / SVG)
 * - Rendered via React Portal (z-[1100]) above Admin Sidebar (zero overlap!)
 * - Real LibreDWG WASM + DXF + PDF Vector extraction via /api/cad/extract
 * - CORS-free inline streaming via /api/file-proxy
 * - Direct "3D'ye Aktar" integration into live 3D BIM scene
 */

import React, { useState, useEffect } from "react"
import { createPortal } from "react-dom"
import {
  X,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Maximize2,
  Minimize2,
  Download,
  Sparkles,
  Layers,
  FileText,
  CheckCircle2,
  ExternalLink,
  AlertTriangle,
  RefreshCw,
} from "lucide-react"
import Interactive2DCadCanvas from "@/components/bim/Interactive2DCadCanvas"
import type { CadExtractionResult } from "@/lib/cad-metric-extractor"

interface Blueprint2DViewerModalProps {
  isOpen: boolean
  onClose: () => void
  fileName: string
  fileUrl: string
  fileType: string
  discipline: string
  onDisciplineChange?: (discipline: string) => void
  isAnalyzed?: boolean
  elementCount?: number
  onTriggerAiAnalysis?: () => void
  onDirect3DConvert?: () => Promise<void> | void
  isConvertingTo3D?: boolean
  onOpenIn3D: () => void
}

const DISCIPLINE_OPTIONS = ["Mimari", "Statik", "Elektrik", "Mekanik", "Harita"] as const

export default function Blueprint2DViewerModal({
  isOpen,
  onClose,
  fileName,
  fileUrl,
  fileType,
  discipline,
  onDisciplineChange,
  isAnalyzed = false,
  elementCount = 0,
  onTriggerAiAnalysis,
  onDirect3DConvert,
  isConvertingTo3D = false,
  onOpenIn3D,
}: Blueprint2DViewerModalProps) {
  const [mounted, setMounted] = useState(false)
  const [zoom, setZoom] = useState(100)
  const [rotation, setRotation] = useState(0)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [pdfViewMode, setPdfViewMode] = useState<"native" | "vector">("native")

  // Real CAD / Vector extraction state
  const [cadLoading, setCadLoading] = useState(false)
  const [cadError, setCadError] = useState<string | null>(null)
  const [cadData, setCadData] = useState<CadExtractionResult | null>(null)
  const [useProxyForImg, setUseProxyForImg] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const lowerType = (fileType || "").toLowerCase()
  const lowerUrl = (fileUrl || "").toLowerCase()
  const lowerName = (fileName || "").toLowerCase()

  const isDwgOrDxf =
    lowerType.includes("dwg") ||
    lowerType.includes("dxf") ||
    lowerUrl.includes(".dwg") ||
    lowerUrl.includes(".dxf") ||
    lowerName.endsWith(".dwg") ||
    lowerName.endsWith(".dxf")

  const isPdf =
    !isDwgOrDxf &&
    (lowerType === "pdf" || lowerUrl.includes(".pdf") || lowerName.endsWith(".pdf"))

  const isImage =
    !isDwgOrDxf &&
    !isPdf &&
    (["png", "jpg", "jpeg", "webp", "svg", "bmp"].includes(lowerType) ||
      [".png", ".jpg", ".jpeg", ".webp", ".svg", ".bmp"].some(
        (ext) => lowerUrl.includes(ext) || lowerName.endsWith(ext)
      ))

  const proxiedUrl = fileUrl ? `/api/file-proxy?url=${encodeURIComponent(fileUrl)}` : ""

  const fetchCadVectors = async () => {
    if (!fileUrl) return
    setCadLoading(true)
    setCadError(null)
    try {
      const res = await fetch("/api/cad/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileUrl, fileName, fileType, discipline }),
      })
      const json: CadExtractionResult = await res.json()
      if (!res.ok || !json.success) {
        setCadError(json.error || "CAD/PDF vektörleri çözümlenemedi.")
        setCadData(null)
      } else {
        setCadData(json)
      }
    } catch (err: any) {
      setCadError(err?.message || "CAD servisine ulaşılamadı.")
      setCadData(null)
    } finally {
      setCadLoading(false)
    }
  }

  // Reset & auto-load CAD vectors for DWG/DXF (or PDF when vector mode is chosen)
  useEffect(() => {
    if (!isOpen) return
    setZoom(100)
    setRotation(0)
    setCadData(null)
    setCadError(null)
    setUseProxyForImg(false)
    setPdfViewMode("native")

    if (isDwgOrDxf) {
      fetchCadVectors()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, fileUrl])

  useEffect(() => {
    if (isOpen && isPdf && pdfViewMode === "vector" && !cadData && !cadLoading) {
      fetchCadVectors()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pdfViewMode, isOpen, isPdf])

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [isOpen, onClose])

  if (!isOpen || !mounted) return null

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 25, 400))
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 25, 30))
  const handleResetZoom = () => {
    setZoom(100)
    setRotation(0)
  }
  const handleRotate = () => setRotation((prev) => (prev + 90) % 360)

  const handleConvertClick = () => {
    if (onDirect3DConvert) {
      onDirect3DConvert()
    } else if (onTriggerAiAnalysis) {
      onClose()
      onTriggerAiAnalysis()
    }
  }

  const modalContent = (
    <div className="fixed inset-0 z-[1100] bg-black/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4">
      <div
        className={`relative bg-slate-900 border border-slate-700/80 shadow-2xl flex flex-col overflow-hidden transition-all duration-200 ${
          isFullscreen
            ? "w-full h-full rounded-none border-0"
            : "w-full max-w-7xl h-[92vh] rounded-2xl"
        }`}
      >
        {/* Top Header Bar - Zero wrapping collision */}
        <div className="px-4 py-3 bg-slate-950 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div
              className={`w-10 h-10 rounded-xl border flex items-center justify-center font-bold text-xs shrink-0 ${
                isDwgOrDxf
                  ? "bg-purple-500/15 border-purple-500/30 text-purple-300"
                  : isPdf
                  ? "bg-red-500/15 border-red-500/30 text-red-300"
                  : "bg-amber-500/15 border-amber-500/30 text-amber-300"
              }`}
            >
              {isDwgOrDxf
                ? lowerName.endsWith(".dxf")
                  ? "DXF"
                  : "DWG"
                : (fileType || "2D").toUpperCase().slice(0, 4)}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-white text-sm font-bold truncate max-w-[240px] sm:max-w-md" title={fileName}>
                  {fileName}
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-amber-300 border border-amber-500/30 whitespace-nowrap">
                  {isDwgOrDxf ? "📐 CAD Vektör Motoru" : isPdf ? "📄 PDF Pafta" : "🖼️ Çizim Görseli"}
                </span>
                {isAnalyzed && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 flex items-center gap-1 whitespace-nowrap">
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                    3D&apos;ye Aktarıldı ({elementCount > 0 ? `${elementCount} Eleman` : discipline})
                  </span>
                )}
              </div>
              <p className="text-slate-400 text-xs mt-0.5 truncate">
                {cadData?.success
                  ? `Gerçek Metrik Ölçü: ${cadData.metrics.widthM}m × ${cadData.metrics.heightM}m (${cadData.metrics.footprintAreaM2} m²) • ${cadData.metrics.totalEntities} CAD Objesi • ${cadData.layers.length} Katman`
                  : "Yüksek çözünürlüklü 2B mimari/statik teknik çizim görüntüleyici"}
              </p>
            </div>
          </div>

          {/* Right Controls */}
          <div className="flex items-center gap-2 flex-wrap shrink-0">
            {/* Discipline Selector */}
            <div className="flex items-center gap-1.5 bg-slate-800/90 px-2.5 py-1.5 rounded-xl border border-slate-700 shrink-0">
              <span className="text-[11px] text-slate-400 whitespace-nowrap">Disiplin:</span>
              <select
                value={discipline}
                onChange={(e) => onDisciplineChange?.(e.target.value)}
                className="bg-transparent text-amber-300 text-xs font-bold focus:outline-none cursor-pointer"
              >
                {DISCIPLINE_OPTIONS.map((d) => (
                  <option key={d} value={d} className="bg-slate-900 text-white">
                    {d}
                  </option>
                ))}
              </select>
            </div>

            {/* Direct "3D'ye Aktar" Button */}
            <button
              type="button"
              onClick={handleConvertClick}
              disabled={isConvertingTo3D}
              className={`px-3.5 py-1.5 rounded-xl font-bold text-xs shadow-md transition-all flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer active:scale-95 ${
                isConvertingTo3D
                  ? "bg-slate-800 text-slate-400 border border-slate-700 cursor-wait"
                  : "bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white shadow-cyan-500/20"
              }`}
            >
              {isConvertingTo3D ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
                  <span>3D&apos;ye Aktarılıyor...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5 text-cyan-200" />
                  <span>{isAnalyzed ? "Yeniden 3D'ye Aktar" : "3D'ye Aktar"}</span>
                </>
              )}
            </button>

            {/* Open in 3D Canvas */}
            <button
              type="button"
              onClick={() => {
                onClose()
                onOpenIn3D()
              }}
              className="px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer active:scale-95"
            >
              <Layers className="w-3.5 h-3.5 text-amber-400" />
              <span>3D Sahneye Git</span>
            </button>

            {/* Download / New Tab / Fullscreen / Close */}
            <a
              href={proxiedUrl || fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors"
              title="Yeni Sekmede Aç"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
            <a
              href={proxiedUrl || fileUrl}
              download={fileName}
              className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors"
              title="İndir"
            >
              <Download className="w-4 h-4" />
            </a>
            <button
              type="button"
              onClick={() => setIsFullscreen((v) => !v)}
              className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors cursor-pointer"
              title={isFullscreen ? "Tam Ekrandan Çık" : "Tam Ekran"}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl bg-red-500/15 hover:bg-red-500/30 text-red-300 hover:text-white border border-red-500/30 transition-colors cursor-pointer"
              title="Kapat (ESC)"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Sub-Toolbar for PDF & Image controls (CAD Canvas has its own integrated CAD toolbar) */}
        {!isDwgOrDxf && (
          <div className="px-4 py-2 bg-slate-900/90 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-300 shrink-0">
            <div className="flex items-center gap-2 flex-wrap">
              {isPdf && (
                <div className="flex items-center bg-slate-950 p-0.5 rounded-lg border border-slate-800">
                  <button
                    type="button"
                    onClick={() => setPdfViewMode("native")}
                    className={`px-3 py-1 rounded-md text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer ${
                      pdfViewMode === "native"
                        ? "bg-blue-600 text-white"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    📄 Orijinal PDF Pafta
                  </button>
                  <button
                    type="button"
                    onClick={() => setPdfViewMode("vector")}
                    className={`px-3 py-1 rounded-md text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer ${
                      pdfViewMode === "vector"
                        ? "bg-cyan-600 text-white"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    📐 Vektör &amp; Metrik Plan (CAD)
                  </button>
                </div>
              )}

              {(isImage || (isPdf && pdfViewMode === "native")) && (
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={handleZoomOut}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 cursor-pointer"
                    title="Uzaklaş"
                  >
                    <ZoomOut className="w-3.5 h-3.5" />
                  </button>
                  <span className="font-mono font-semibold text-slate-200 min-w-[46px] text-center">
                    %{zoom}
                  </span>
                  <button
                    type="button"
                    onClick={handleZoomIn}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 cursor-pointer"
                    title="Yakınlaş"
                  >
                    <ZoomIn className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={handleResetZoom}
                    className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] cursor-pointer"
                  >
                    Sıfırla
                  </button>
                  <button
                    type="button"
                    onClick={handleRotate}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center gap-1 cursor-pointer"
                    title="90° Döndür"
                  >
                    <RotateCw className="w-3.5 h-3.5" />
                    <span className="text-[11px] font-mono">{rotation}°</span>
                  </button>
                </div>
              )}
            </div>

            <span className="text-[11px] text-slate-400">
              {discipline} Paftası
            </span>
          </div>
        )}

        {/* Main 2D Viewport Area */}
        <div className="flex-1 min-h-0 w-full bg-slate-950 relative overflow-hidden flex flex-col">
          {isDwgOrDxf || (isPdf && pdfViewMode === "vector") ? (
            cadLoading ? (
              <div className="flex-1 flex flex-col items-center justify-center gap-3 p-6 text-center">
                <div className="w-12 h-12 border-4 border-cyan-500/20 border-t-cyan-400 rounded-full animate-spin" />
                <p className="text-white font-bold text-sm">
                  {isDwgOrDxf
                    ? "AutoCAD DWG/DXF Geometri ve Katmanları Çözümleniyor..."
                    : "PDF Vektör Çizgileri ve Metrik Ölçek Çözümleniyor..."}
                </p>
                <p className="text-slate-400 text-xs font-mono">
                  LibreDWG WASM &amp; Metrik Vektör Motoru
                </p>
              </div>
            ) : cadError || !cadData ? (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                <div className="w-14 h-14 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-3">
                  <AlertTriangle className="w-7 h-7" />
                </div>
                <h4 className="text-white font-bold text-base mb-1">
                  Vektör Çizim Açılamadı
                </h4>
                <p className="text-slate-400 text-xs max-w-md mb-4">
                  {cadError || "Bu dosyada doğrudan okunabilir CAD vektör verisi bulunamadı."}
                </p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={fetchCadVectors}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Tekrar Dene</span>
                  </button>
                  {isPdf && (
                    <button
                      type="button"
                      onClick={() => setPdfViewMode("native")}
                      className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold cursor-pointer"
                    >
                      Orijinal PDF&apos;e Dön
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <Interactive2DCadCanvas data={cadData} />
            )
          ) : isPdf ? (
            /* Native Inline PDF Viewer via CORS-free /api/file-proxy (NEVER black or blocked!) */
            <div className="flex-1 w-full h-full overflow-auto bg-slate-900 p-2">
              <div
                style={{
                  transform: zoom !== 100 || rotation !== 0 ? `scale(${zoom / 100}) rotate(${rotation}deg)` : undefined,
                  transformOrigin: "top center",
                  transition: "transform 0.15s ease",
                }}
                className="w-full h-full min-h-[540px]"
              >
                <object
                  data={`${proxiedUrl}#view=FitH&toolbar=1&navpanes=0`}
                  type="application/pdf"
                  className="w-full h-full min-h-[540px] rounded-xl bg-white border border-slate-700 shadow-2xl"
                >
                  <iframe
                    src={`${proxiedUrl}#view=FitH&toolbar=1`}
                    title={fileName}
                    className="w-full h-full min-h-[540px] rounded-xl bg-white border border-slate-700"
                  />
                </object>
              </div>
            </div>
          ) : isImage ? (
            /* High-Resolution Image Blueprint Viewer */
            <div className="flex-1 w-full h-full overflow-auto flex items-center justify-center p-4 bg-slate-950">
              <img
                src={useProxyForImg ? proxiedUrl : fileUrl}
                alt={fileName}
                onError={() => {
                  if (!useProxyForImg) setUseProxyForImg(true)
                }}
                style={{
                  transform: `scale(${zoom / 100}) rotate(${rotation}deg)`,
                  transformOrigin: "center center",
                  transition: "transform 0.15s ease",
                }}
                className="max-w-full max-h-[78vh] object-contain rounded-xl shadow-2xl border border-slate-800 bg-slate-900"
              />
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center p-8">
              <div className="text-center p-8 bg-slate-900/90 rounded-2xl border border-slate-800 max-w-md">
                <FileText className="w-12 h-12 text-amber-400 mx-auto mb-3" />
                <h4 className="text-white font-bold text-base mb-1">{fileName}</h4>
                <p className="text-slate-400 text-xs mb-4">
                  Bu dosya formatı için önizleme indirilebilir veya doğrudan 3D BIM geometri motoruna aktarılabilir.
                </p>
                <div className="flex items-center justify-center gap-2">
                  <a
                    href={proxiedUrl || fileUrl}
                    download={fileName}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold"
                  >
                    Dosyayı İndir
                  </a>
                  <button
                    type="button"
                    onClick={handleConvertClick}
                    className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-bold cursor-pointer"
                  >
                    ✨ 3D&apos;ye Aktar
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )

  return createPortal(modalContent, document.body)
}
