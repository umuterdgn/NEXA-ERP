"use client"
/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * 3D IFC / BIM Viewer Component powered by web-ifc-viewer & Three.js
 */

import { useEffect, useRef, useState, useCallback } from "react"
import { IfcViewerAPI } from "web-ifc-viewer"
import * as THREE from "three"

interface BimViewerProps {
  url?: string | null
  ifcUrl?: string | null
  projectId?: string
  className?: string
  height?: string
}

export default function BimViewer({
  url,
  ifcUrl,
  projectId,
  className = "",
  height = "h-[650px]",
}: BimViewerProps) {
  const effectiveUrl = url || ifcUrl

  const containerRef = useRef<HTMLDivElement>(null)
  const viewerRef = useRef<IfcViewerAPI | null>(null)

  const [loading, setLoading] = useState(false)
  const [loadingProgress, setLoadingProgress] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [selectedObject, setSelectedObject] = useState<any>(null)
  const [modelOpacity, setModelOpacity] = useState(1.0)
  const [showGrid, setShowGrid] = useState(true)
  const [showAxes, setShowAxes] = useState(true)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const outerWrapperRef = useRef<HTMLDivElement>(null)

  const loadIfcFile = useCallback(async (viewer: IfcViewerAPI, fileUrl: string) => {
    setLoading(true)
    setError(null)
    setLoadingProgress("BIM Modeli indiriliyor ve işleniyor...")

    try {
      // 1. setWasmPath ensures web-ifc.wasm is loaded from the public root
      await viewer.IFC.setWasmPath("/")

      // 2. Try direct load first
      try {
        await viewer.IFC.loadIfcUrl(fileUrl, true)
      } catch (directErr) {
        console.warn("Direct loadIfcUrl failed, falling back to blob fetch:", directErr)
        setLoadingProgress("Model verisi dönüştürülüyor...")
        
        const res = await fetch(fileUrl)
        if (!res.ok) {
          throw new Error(`Dosya indirilemedi (HTTP ${res.status})`)
        }
        const blob = await res.blob()
        const ifcFile = new File([blob], "model.ifc", { type: "application/octet-stream" })
        await viewer.IFC.loadIfc(ifcFile, true)
      }

      setLoadingProgress(null)
    } catch (err: any) {
      console.error("Failed to load IFC model:", err)
      setError(err?.message || "3D IFC modeli yüklenirken bir hata oluştu.")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!containerRef.current) return

    // Clean any residual children in the container
    containerRef.current.innerHTML = ""

    const viewer = new IfcViewerAPI({
      container: containerRef.current,
      backgroundColor: new THREE.Color(0x0f172a), // slate-900
    })

    viewerRef.current = viewer

    // Setup helper visuals
    viewer.axes.setAxes()
    viewer.grid.setGrid()

    // Object picking / inspection
    const handlePick = async () => {
      try {
        const result = await viewer.IFC.selector.pickIfcItem(true)
        if (result && result.modelID !== undefined && result.id !== undefined) {
          const props = await viewer.IFC.getProperties(result.modelID, result.id, true)
          setSelectedObject(props)
        } else {
          setSelectedObject(null)
        }
      } catch {
        // Ignored if clicked empty space
      }
    }

    const containerEl = containerRef.current
    containerEl.addEventListener("dblclick", handlePick)

    // Load initial model if URL is supplied
    if (effectiveUrl) {
      void loadIfcFile(viewer, effectiveUrl)
    }

    return () => {
      containerEl.removeEventListener("dblclick", handlePick)
      try {
        viewer.dispose()
      } catch (e) {
        console.warn("Error disposing IFC viewer:", e)
      }
      viewerRef.current = null
    }
  }, [effectiveUrl, loadIfcFile])

  // Update opacity dynamically
  useEffect(() => {
    if (!viewerRef.current) return
    const scene = viewerRef.current.context.getScene()
    scene.traverse((child: any) => {
      if (child.isMesh) {
        child.material.transparent = modelOpacity < 1.0
        child.material.opacity = modelOpacity
      }
    })
  }, [modelOpacity])

  // Toggle Grid
  const toggleGrid = () => {
    if (!viewerRef.current) return
    const grid = viewerRef.current.grid
    if (showGrid) {
      grid.grid?.parent?.remove(grid.grid)
    } else {
      viewerRef.current.grid.setGrid()
    }
    setShowGrid(!showGrid)
  }

  // Toggle Axes
  const toggleAxes = () => {
    if (!viewerRef.current) return
    const axes = viewerRef.current.axes
    if (showAxes) {
      axes.axes?.parent?.remove(axes.axes)
    } else {
      viewerRef.current.axes.setAxes()
    }
    setShowAxes(!showAxes)
  }

  // Reset Camera
  const resetCamera = () => {
    if (!viewerRef.current) return
    try {
      viewerRef.current.context.ifcCamera.cameraControls.reset(true)
    } catch (e) {
      console.warn("Could not reset camera controls:", e)
    }
  }

  // Toggle Fullscreen
  const toggleFullscreen = () => {
    if (!outerWrapperRef.current) return
    if (!document.fullscreenElement) {
      outerWrapperRef.current.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {})
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {})
    }
  }

  return (
    <div
      ref={outerWrapperRef}
      className={`relative w-full ${isFullscreen ? "h-screen bg-slate-950" : height} ${className} rounded-xl overflow-hidden border border-slate-700 bg-slate-900 shadow-2xl flex flex-col`}
    >
      {/* Top Controls Bar */}
      <div className="absolute top-3 left-3 right-3 z-20 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
        {/* Left Toolbar */}
        <div className="flex items-center gap-1.5 bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-700 shadow-lg pointer-events-auto">
          <div className="flex items-center gap-2 pr-2 border-r border-slate-700">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-semibold text-slate-200">3D BIM / IFC</span>
          </div>

          <button
            onClick={resetCamera}
            title="Kamerayı Sıfırla"
            className="px-2.5 py-1 text-xs text-slate-300 hover:text-white hover:bg-slate-800 rounded transition-colors flex items-center gap-1"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Sıfırla
          </button>

          <button
            onClick={toggleGrid}
            className={`px-2.5 py-1 text-xs rounded transition-colors ${showGrid ? "text-blue-400 bg-blue-500/10" : "text-slate-400 hover:text-white"}`}
          >
            Izgara
          </button>

          <button
            onClick={toggleAxes}
            className={`px-2.5 py-1 text-xs rounded transition-colors ${showAxes ? "text-purple-400 bg-purple-500/10" : "text-slate-400 hover:text-white"}`}
          >
            Eksen
          </button>

          {/* Opacity Slider */}
          <div className="flex items-center gap-2 pl-2 border-l border-slate-700">
            <span className="text-[10px] text-slate-400">Şeffaflık:</span>
            <input
              type="range"
              min="0.2"
              max="1.0"
              step="0.05"
              value={modelOpacity}
              onChange={(e) => setModelOpacity(parseFloat(e.target.value))}
              className="w-16 h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
            />
          </div>
        </div>

        {/* Right Toolbar */}
        <div className="flex items-center gap-2 pointer-events-auto">
          <button
            onClick={toggleFullscreen}
            title="Tam Ekran"
            className="p-2 bg-slate-900/90 backdrop-blur-md text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-700 rounded-lg shadow-lg transition-colors"
          >
            {isFullscreen ? (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* 3D WebGL Canvas Container */}
      <div
        ref={containerRef}
        className="w-full h-full flex-1 outline-none"
        style={{ minHeight: "500px" }}
      />

      {/* Bottom Hint */}
      <div className="absolute bottom-3 left-3 z-10 pointer-events-none">
        <div className="bg-slate-900/85 backdrop-blur-sm border border-slate-700/80 rounded-lg px-3 py-1.5 text-[11px] text-slate-400 flex items-center gap-3">
          <span>🖱️ Sol Tık: <b>Döndür</b></span>
          <span>🖱️ Sağ Tık: <b>Kaydır</b></span>
          <span>🔍 Tekerlek: <b>Yakınlaş</b></span>
          <span>🎯 Çift Tık: <b>Eleman İncele</b></span>
        </div>
      </div>

      {/* Loading Overlay */}
      {loading && (
        <div className="absolute inset-0 z-30 bg-slate-950/80 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center">
          <div className="relative mb-4">
            <div className="w-14 h-14 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center text-blue-400">
              <svg className="w-6 h-6 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
          </div>
          <h4 className="text-white font-medium text-base mb-1">3D BIM Modeli Açılıyor</h4>
          <p className="text-slate-400 text-xs max-w-sm">
            {loadingProgress || "IFC geometrisi oluşturuluyor, lütfen bekleyin..."}
          </p>
        </div>
      )}

      {/* Error Overlay */}
      {error && !loading && (
        <div className="absolute inset-0 z-30 bg-slate-950/85 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center">
          <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400 mb-3">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h4 className="text-white font-medium text-sm mb-1">Model Yüklenemedi</h4>
          <p className="text-slate-400 text-xs mb-4 max-w-md">{error}</p>
          {effectiveUrl && viewerRef.current && (
            <button
              onClick={() => viewerRef.current && void loadIfcFile(viewerRef.current, effectiveUrl)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5 shadow-lg"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Yeniden Dene
            </button>
          )}
        </div>
      )}

      {/* Object Properties Inspector Panel */}
      {selectedObject && (
        <div className="absolute top-16 right-3 z-20 w-80 max-h-[70%] bg-slate-900/95 backdrop-blur-md rounded-xl border border-slate-700 shadow-2xl p-4 overflow-y-auto">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-500" />
              <h4 className="text-xs font-semibold text-white uppercase tracking-wider">Eleman Özellikleri</h4>
            </div>
            <button
              onClick={() => setSelectedObject(null)}
              className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800"
            >
              ✕
            </button>
          </div>

          <div className="space-y-2.5 text-xs">
            {selectedObject.Name?.value && (
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-mono">İsim</span>
                <p className="text-slate-200 font-medium">{selectedObject.Name.value}</p>
              </div>
            )}

            {selectedObject.ObjectType?.value && (
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-mono">Obje Tipi</span>
                <p className="text-slate-200">{selectedObject.ObjectType.value}</p>
              </div>
            )}

            {selectedObject.GlobalId?.value && (
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-mono">Global ID</span>
                <p className="text-slate-300 font-mono text-[11px] truncate">{selectedObject.GlobalId.value}</p>
              </div>
            )}

            {/* Psets / Properties */}
            {selectedObject.psets && selectedObject.psets.length > 0 && (
              <div className="pt-2 border-t border-slate-800 space-y-2">
                <span className="text-[10px] font-semibold text-blue-400 uppercase">Özellik Setleri (Psets)</span>
                {selectedObject.psets.map((pset: any, idx: number) => (
                  <div key={idx} className="bg-slate-800/60 rounded p-2 border border-slate-700/60">
                    <p className="text-[11px] font-medium text-emerald-400 mb-1">{pset.Name?.value || "Pset"}</p>
                    <div className="space-y-1">
                      {pset.HasProperties?.map((prop: any, pIdx: number) => (
                        <div key={pIdx} className="flex justify-between text-[11px] text-slate-300">
                          <span className="text-slate-500">{prop.Name?.value}:</span>
                          <span className="font-mono text-slate-200">{String(prop.NominalValue?.value ?? "-")}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
