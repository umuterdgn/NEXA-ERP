"use client"
/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Interactive 2D Blueprint & Pafta Viewer Modal (PDF / DWG / DXF / Image)
 * Features:
 * - High-resolution 2D pafta examination with zoom (25% - 400%), rotate, and pan
 * - Direct "AI ile 3D Modele Dönüştür" (Extrusion) trigger
 * - Direct "3D Sahnede Görüntüle" and "Bütünleşik Modele Ekle" integration
 * - Discipline tagging (Mimari, Statik, Elektrik, Mekanik, Harita)
 */

import React, { useState } from "react"
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
} from "lucide-react"

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
  onTriggerAiAnalysis: () => void
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
  onOpenIn3D,
}: Blueprint2DViewerModalProps) {
  const [zoom, setZoom] = useState(100)
  const [rotation, setRotation] = useState(0)
  const [isFullscreen, setIsFullscreen] = useState(false)

  if (!isOpen) return null

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 25, 400))
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 25, 30))
  const handleResetZoom = () => {
    setZoom(100)
    setRotation(0)
  }
  const handleRotate = () => setRotation((prev) => (prev + 90) % 360)

  const isPdf =
    fileType.toLowerCase() === "pdf" ||
    fileUrl.toLowerCase().includes(".pdf") ||
    fileName.toLowerCase().endsWith(".pdf")

  const isImage = ["png", "jpg", "jpeg", "webp", "svg"].includes(
    fileType.toLowerCase()
  )

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-200">
      <div
        className={`relative bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl flex flex-col overflow-hidden transition-all duration-300 ${
          isFullscreen
            ? "w-full h-full rounded-none border-0"
            : "w-full max-w-6xl h-[92vh]"
        }`}
      >
        {/* Top Header Bar */}
        <div className="px-4 py-3 bg-slate-950/95 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-300 font-bold text-xs shrink-0">
              {fileType.toUpperCase() || "2D"}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-white text-sm font-bold truncate max-w-xs sm:max-w-md">
                  {fileName}
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-amber-300 border border-amber-500/30">
                  2D Pafta
                </span>
                {isAnalyzed && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                    3D Modeline Aktarıldı ({elementCount > 0 ? `${elementCount} Eleman` : discipline})
                  </span>
                )}
              </div>
              <p className="text-slate-400 text-xs mt-0.5">
                Yüksek çözünürlüklü 2B mimari/statik teknik çizim önizlemesi
              </p>
            </div>
          </div>

          {/* Action & Discipline Controls */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Discipline Selector */}
            <div className="flex items-center gap-1.5 bg-slate-800/80 px-2.5 py-1 rounded-xl border border-slate-700">
              <span className="text-[11px] text-slate-400">Disiplin:</span>
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

            {/* AI 3D Conversion Button */}
            <button
              type="button"
              onClick={() => {
                onClose()
                onTriggerAiAnalysis()
              }}
              className="px-3.5 py-1.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-1.5 active:scale-95"
              title="Yapay zeka ile duvar, kolon ve tesisatları 3D modellere dönüştür"
            >
              <Sparkles className="w-3.5 h-3.5 text-cyan-300" />
              <span>{isAnalyzed ? "✨ Yeniden AI Analiz Et" : "✨ 3D'ye Dönüştür"}</span>
            </button>

            {/* Open in 3D Canvas */}
            <button
              type="button"
              onClick={() => {
                onClose()
                onOpenIn3D()
              }}
              className="px-3.5 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 active:scale-95"
              title="3D Canvas'ta Extrusion modelini görüntüle"
            >
              <Layers className="w-3.5 h-3.5 text-amber-400" />
              <span>3D Sahnede Gör</span>
            </button>

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors border border-slate-700"
              title="Kapat"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Toolbar: Zoom, Rotate, Fullscreen */}
        <div className="px-4 py-2 bg-slate-950/80 border-b border-slate-800/80 flex items-center justify-between text-xs text-slate-400 shrink-0">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleZoomOut}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
              title="Uzaklaş (-)"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="font-mono font-semibold text-slate-200 px-2 min-w-[50px] text-center">
              %{zoom}
            </span>
            <button
              type="button"
              onClick={handleZoomIn}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
              title="Yakınlaş (+)"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleResetZoom}
              className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-medium transition-colors"
              title="Ölçeği Sıfırla"
            >
              Sıfırla
            </button>
            <div className="h-4 w-px bg-slate-800 mx-1" />
            <button
              type="button"
              onClick={handleRotate}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors flex items-center gap-1"
              title="90° Döndür"
            >
              <RotateCw className="w-4 h-4" />
              <span className="text-[11px] font-mono">{rotation}°</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <a
              href={fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors flex items-center gap-1 text-[11px]"
              title="Orijinal Dosyayı Yeni Sekmede Aç"
            >
              <ExternalLink className="w-4 h-4" />
              <span>Yeni Sekme</span>
            </a>

            <a
              href={fileUrl}
              download={fileName}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors flex items-center gap-1 text-[11px]"
              title="İndir"
            >
              <Download className="w-4 h-4" />
              <span>İndir</span>
            </a>

            <button
              type="button"
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
              title={isFullscreen ? "Tam Ekrandan Çık" : "Tam Ekran Yap"}
            >
              {isFullscreen ? (
                <Minimize2 className="w-4 h-4" />
              ) : (
                <Maximize2 className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>

        {/* Drawing Viewport Container */}
        <div className="flex-1 w-full bg-slate-950 overflow-auto flex items-center justify-center p-4 relative">
          {isPdf ? (
            <div
              style={{
                transform: `scale(${zoom / 100}) rotate(${rotation}deg)`,
                transformOrigin: "center center",
                transition: "transform 0.15s ease",
              }}
              className="w-full h-full min-h-[500px] flex items-center justify-center"
            >
              <iframe
                src={`${fileUrl}#toolbar=0&navpanes=0&scrollbar=1`}
                title={fileName}
                className="w-full h-full min-h-[550px] rounded-xl border border-slate-800 bg-white shadow-2xl"
              />
            </div>
          ) : isImage ? (
            <div
              style={{
                transform: `scale(${zoom / 100}) rotate(${rotation}deg)`,
                transformOrigin: "center center",
                transition: "transform 0.15s ease",
              }}
              className="flex items-center justify-center"
            >
              <img
                src={fileUrl}
                alt={fileName}
                className="max-w-full max-h-[80vh] object-contain rounded-xl shadow-2xl border border-slate-800 bg-slate-900"
              />
            </div>
          ) : (
            <div className="text-center p-8 bg-slate-900/90 rounded-2xl border border-slate-800 max-w-md">
              <FileText className="w-12 h-12 text-amber-400 mx-auto mb-3" />
              <h4 className="text-white font-bold text-base mb-1">{fileName}</h4>
              <p className="text-slate-400 text-xs mb-4">
                Bu çizim dosyası (.dwg / .dxf veya teknik format) tarayıcı içi doğrudan önizleme gerektiriyorsa indirebilir veya doğrudan AI ile 3D geometriye dönüştürebilirsiniz.
              </p>
              <div className="flex items-center justify-center gap-2">
                <a
                  href={fileUrl}
                  download={fileName}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold"
                >
                  Dosyayı İndir
                </a>
                <button
                  type="button"
                  onClick={() => {
                    onClose()
                    onTriggerAiAnalysis()
                  }}
                  className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-bold"
                >
                  ✨ AI ile 3D'ye Çevir
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Status Bar */}
        <div className="px-4 py-2 bg-slate-950 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500 shrink-0">
          <div className="flex items-center gap-2">
            <span>Ölçek: %{zoom}</span>
            <span>•</span>
            <span>Açı: {rotation}°</span>
            <span>•</span>
            <span className="text-amber-400 font-semibold">{discipline} Paftası</span>
          </div>

          <div className="text-slate-400">
            💡 <span className="text-slate-300">İpucu:</span> Bu paftayı analiz ettiğinizde, Bütünleşik 3D Modelde diğer tüm katmanlarla (Statik, Elektrik, Mekanik) iç içe görüntülenecektir.
          </div>
        </div>
      </div>
    </div>
  )
}

