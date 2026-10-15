"use client"
/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * High-Performance Dual-Engine 3D BIM Viewer (React Three Fiber + Web-IFC Engine)
 */

import React, { useEffect, useRef, useState, Suspense, Component, type ReactNode } from "react"
import { Canvas } from "@react-three/fiber"
import { OrbitControls, useGLTF, Environment, Center, Bounds, Html, useProgress, Grid } from "@react-three/drei"
import { IfcViewerAPI } from "web-ifc-viewer"
import * as THREE from "three"
import { UploadButton } from "@/lib/uploadthing"

interface BimViewerProps {
  url?: string | null
  ifcUrl?: string | null
  bimUrl?: string | null
  projectId?: string
  fileName?: string
}

// React Three Fiber Loading Overlay
function CanvasLoader() {
  const { progress } = useProgress()
  return (
    <Html center>
      <div className="flex flex-col items-center justify-center p-4 bg-slate-900/90 border border-cyan-500/30 rounded-xl backdrop-blur-md shadow-2xl min-w-[200px]">
        <div className="w-10 h-10 border-4 border-cyan-500/20 border-t-cyan-400 rounded-full animate-spin mb-3" />
        <p className="text-cyan-300 font-bold text-sm tracking-wide">3D Model Hazırlanıyor</p>
        <div className="w-full bg-slate-800 rounded-full h-1.5 mt-3 overflow-hidden">
          <div
            className="bg-gradient-to-r from-cyan-400 to-blue-500 h-1.5 rounded-full transition-all duration-300"
            style={{ width: `${Math.min(100, Math.max(5, progress))}%` }}
          />
        </div>
        <p className="text-slate-400 text-xs font-mono mt-1.5">%{progress.toFixed(0)}</p>
      </div>
    </Html>
  )
}

// R3F GLTF Model Primitive
function GltfModel({ url, opacity = 1 }: { url: string; opacity?: number }) {
  const { scene } = useGLTF(url)

  useEffect(() => {
    if (scene) {
      scene.traverse((child: any) => {
        if (child.isMesh && child.material) {
          child.castShadow = true
          child.receiveShadow = true
          if (opacity < 1) {
            child.material.transparent = true
            child.material.opacity = opacity
          } else {
            child.material.transparent = false
            child.material.opacity = 1
          }
        }
      })
    }
  }, [scene, opacity])

  useEffect(() => {
    return () => {
      useGLTF.clear(url)
    }
  }, [url])

  return <primitive object={scene} />
}

// Error Boundary for R3F Canvas
class ModelErrorBoundary extends Component<
  { fallback: (error: Error, reset: () => void) => ReactNode; children: ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: any) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error("3D Model Render Error:", error, errorInfo)
  }

  render() {
    if (this.state.hasError && this.state.error) {
      return this.props.fallback(this.state.error, () => this.setState({ hasError: false, error: null }))
    }
    return this.props.children
  }
}

export default function BimViewer({ url, ifcUrl, bimUrl, projectId, fileName }: BimViewerProps) {
  const effectiveUrl = (bimUrl || url || ifcUrl || "").trim()

  // Determine if file is likely an IFC file
  const isIfcFile =
    effectiveUrl.toLowerCase().endsWith(".ifc") ||
    effectiveUrl.toLowerCase().includes(".ifc?") ||
    (fileName && fileName.toLowerCase().endsWith(".ifc"))

  // Engine Mode: 'canvas' (@react-three/fiber) or 'ifc' (web-ifc-viewer)
  const [engineMode, setEngineMode] = useState<"canvas" | "ifc">(isIfcFile ? "ifc" : "canvas")
  const [modelOpacity, setModelOpacity] = useState(1.0)
  const [autoRotate, setAutoRotate] = useState(false)
  const [activeModelUrl, setActiveModelUrl] = useState(effectiveUrl)

  // IFC Viewer refs & states
  const ifcContainerRef = useRef<HTMLDivElement>(null)
  const ifcViewerRef = useRef<IfcViewerAPI | null>(null)
  const [ifcLoading, setIfcLoading] = useState(false)
  const [ifcError, setIfcError] = useState<string | null>(null)

  // Snagging (Kusur İşaretleme) states
  const [isSnaggingMode, setIsSnaggingMode] = useState(false)
  const [showIssueForm, setShowIssueForm] = useState(false)
  const [selectedPinPosition, setSelectedPinPosition] = useState<THREE.Vector3 | null>(null)
  const [issueForm, setIssueForm] = useState({ title: "", description: "", imageUrl: "" })
  const [pins, setPins] = useState<any[]>([])
  const [selectedIssue, setSelectedIssue] = useState<any>(null)

  // Sync activeModelUrl when props change
  useEffect(() => {
    if (effectiveUrl) {
      setActiveModelUrl(effectiveUrl)
      if (effectiveUrl.toLowerCase().endsWith(".ifc") || effectiveUrl.toLowerCase().includes(".ifc?")) {
        setEngineMode("ifc")
      } else {
        setEngineMode("canvas")
      }
    }
  }, [effectiveUrl])

  // Load existing BIM issues
  useEffect(() => {
    if (!projectId) return
    const loadIssues = async () => {
      try {
        const response = await fetch(`/api/bim-issues?projectId=${projectId}`)
        if (response.ok) {
          const issues = await response.json()
          setPins(issues)
        }
      } catch (err) {
        console.error("Failed to load BIM issues:", err)
      }
    }
    loadIssues()
  }, [projectId])

  // IFC Engine Initialization and Model Loading
  useEffect(() => {
    if (engineMode !== "ifc" || !ifcContainerRef.current) return

    let isDisposed = false
    let viewer: IfcViewerAPI | null = null

    const initIfc = async () => {
      try {
        setIfcLoading(true)
        setIfcError(null)

        if (!ifcContainerRef.current) return

        viewer = new IfcViewerAPI({
          container: ifcContainerRef.current,
          backgroundColor: new THREE.Color(0x0f172a), // slate-950
        })
        ifcViewerRef.current = viewer

        viewer.axes.setAxes()
        viewer.grid.setGrid()
        await viewer.IFC.setWasmPath("/")

        if (activeModelUrl) {
          let loadedModel: any = null
          try {
            // First try direct URL
            loadedModel = await viewer.IFC.loadIfcUrl(activeModelUrl, true)
          } catch (directErr) {
            console.warn("Direct loadIfcUrl failed, trying blob fetch fallback:", directErr)
            const res = await fetch(activeModelUrl)
            if (!res.ok) throw new Error(`HTTP ${res.status}`)
            const blob = await res.blob()
            const ifcFile = new File([blob], fileName || "model.ifc", { type: "application/octet-stream" })
            loadedModel = await viewer.IFC.loadIfc(ifcFile, true)
          }

          // KESİN FIT: Kamera modeli kadraja sığdırır
          if (loadedModel && viewer?.context?.ifcCamera?.cameraControls) {
            await viewer.context.ifcCamera.cameraControls.fitToBox(loadedModel, true)
          }
        }
      } catch (err: any) {
        console.error("IFC Engine Load Error:", err)
        if (!isDisposed) {
          setIfcError(err?.message || "IFC dosyası yüklenemedi. 3D Canvas motoruna geçebilirsiniz.")
        }
      } finally {
        if (!isDisposed) {
          setIfcLoading(false)
        }
      }
    }

    initIfc()

    return () => {
      isDisposed = true
      if (viewer) {
        try {
          viewer.dispose()
        } catch (e) {
          console.warn("IFC dispose:", e)
        }
      }
    }
  }, [engineMode, activeModelUrl, fileName])

  // Update IFC opacity
  useEffect(() => {
    if (engineMode === "ifc" && ifcViewerRef.current) {
      try {
        const scene = ifcViewerRef.current.context.getScene()
        scene.traverse((child: any) => {
          if (child.isMesh && child.material) {
            child.material.transparent = modelOpacity < 1
            child.material.opacity = modelOpacity
          }
        })
      } catch (e) {
        console.warn("IFC Opacity update:", e)
      }
    }
  }, [engineMode, modelOpacity])

  return (
    <div className="relative w-full h-full min-h-[600px] bg-slate-950 rounded-xl overflow-hidden select-none">
      {/* Engine Switcher & Top Toolbar */}
      <div className="absolute top-4 left-4 z-40 flex items-center gap-2 bg-slate-900/90 backdrop-blur-md p-1.5 rounded-xl border border-slate-700/80 shadow-2xl">
        <button
          type="button"
          onClick={() => {
            setEngineMode("canvas")
            // If currently on an IFC url that can't be rendered by GLTF, fallback to bina.glb
            if (activeModelUrl.toLowerCase().endsWith(".ifc") || activeModelUrl.toLowerCase().includes(".ifc?")) {
              setActiveModelUrl("/models/bina.glb")
            }
          }}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
            engineMode === "canvas"
              ? "bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-md shadow-blue-500/20"
              : "text-slate-400 hover:text-white hover:bg-slate-800"
          }`}
        >
          <span>⚡ 3D Canvas (R3F)</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setEngineMode("ifc")
            if (effectiveUrl.toLowerCase().endsWith(".ifc") || effectiveUrl.toLowerCase().includes(".ifc?")) {
              setActiveModelUrl(effectiveUrl)
            } else {
              setActiveModelUrl("/sample.ifc")
            }
          }}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
            engineMode === "ifc"
              ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-500/20"
              : "text-slate-400 hover:text-white hover:bg-slate-800"
          }`}
        >
          <span>🏛️ IFC Motoru</span>
        </button>

        <div className="h-4 w-[1px] bg-slate-700 mx-1" />

        {/* Auto Rotate Toggle */}
        <button
          type="button"
          onClick={() => setAutoRotate(!autoRotate)}
          className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
            autoRotate ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40" : "text-slate-400 hover:text-white"
          }`}
          title="Otomatik Dönüş"
        >
          🔄 {autoRotate ? "Dönüş Açık" : "Döndür"}
        </button>
      </div>

      {/* Main 3D Viewport */}
      {engineMode === "canvas" ? (
        <div className="w-full h-full min-h-[600px] cursor-grab active:cursor-grabbing bg-slate-950">
          <ModelErrorBoundary
            fallback={(err, reset) => (
              <div className="w-full h-full min-h-[600px] flex flex-col items-center justify-center p-6 text-center bg-slate-900/90 backdrop-blur-md">
                <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mb-4">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <h4 className="text-white font-semibold text-base mb-2">Model Formatı Uyarısı</h4>
                <p className="text-slate-400 text-xs max-w-md mb-5 leading-relaxed">
                  Seçili dosya GLTF/GLB olarak çözümlenemedi ({err.message.slice(0, 100)}).
                  IFC dosyanızı IFC motorunda açabilir veya örnek 3D yapıyı inceleyebilirsiniz.
                </p>
                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setEngineMode("ifc")
                      setActiveModelUrl(effectiveUrl || "/sample.ifc")
                    }}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-semibold shadow-lg transition-colors flex items-center gap-1.5"
                  >
                    🏛️ IFC Motorunda Aç
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveModelUrl("/models/bina.glb")
                      reset()
                    }}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold shadow-lg transition-colors flex items-center gap-1.5"
                  >
                    🏢 3D Dijital İkiz Örneğini Aç (/bina.glb)
                  </button>
                </div>
              </div>
            )}
          >
            <Canvas
              key={activeModelUrl}
              camera={{ far: 20000, near: 0.1, fov: 45, position: [35, 30, 35] }}
              gl={{ preserveDrawingBuffer: true, powerPreference: "high-performance", antialias: true }}
            >
              <ambientLight intensity={1.5} />
              <directionalLight position={[25, 35, 20]} intensity={2.5} castShadow />
              <pointLight position={[-25, 25, -20]} intensity={1.2} />
              <Environment preset="city" />

              <Grid
                renderOrder={-1}
                position={[0, -0.01, 0]}
                infiniteGrid
                cellSize={1}
                sectionSize={5}
                sectionColor="#3b82f6"
                cellColor="#1e293b"
                fadeDistance={100}
              />

              <Suspense fallback={<CanvasLoader />}>
                <Bounds clip fit margin={1.2} observe>
                  <Center>
                    <GltfModel
                      url={
                        activeModelUrl.toLowerCase().endsWith(".ifc") || activeModelUrl.toLowerCase().includes(".ifc?")
                          ? "/models/bina.glb"
                          : activeModelUrl
                      }
                      opacity={modelOpacity}
                    />
                  </Center>
                </Bounds>
              </Suspense>

              <OrbitControls
                autoRotate={autoRotate}
                autoRotateSpeed={1.0}
                dampingFactor={0.05}
                enableDamping
                enablePan={true}
                enableZoom={true}
                makeDefault
              />
            </Canvas>
          </ModelErrorBoundary>
        </div>
      ) : (
        <div className="relative w-full h-full min-h-[600px]">
          {/* Web-IFC Viewer Container */}
          <div ref={ifcContainerRef} className="w-full h-full min-h-[600px] bg-slate-950" />

          {ifcLoading && (
            <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm flex flex-col items-center justify-center z-30">
              <div className="w-12 h-12 border-4 border-purple-500/20 border-t-purple-400 rounded-full animate-spin mb-3" />
              <p className="text-purple-300 font-semibold text-sm">IFC Modeli ve Geometri Çözümleniyor...</p>
              <p className="text-slate-400 text-xs mt-1">Lütfen bekleyin</p>
            </div>
          )}

          {ifcError && (
            <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center z-30">
              <div className="w-12 h-12 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 mb-3">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h4 className="text-white font-semibold text-sm mb-1">IFC Çözümleme Hatası</h4>
              <p className="text-slate-400 text-xs max-w-sm mb-4">{ifcError}</p>
              <button
                type="button"
                onClick={() => {
                  setEngineMode("canvas")
                  setActiveModelUrl("/models/bina.glb")
                }}
                className="px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-lg text-xs font-semibold shadow-lg transition-all"
              >
                ⚡ 3D Canvas Motoruna Geç (/bina.glb)
              </button>
            </div>
          )}
        </div>
      )}

      {/* Floating Bottom Toolbar */}
      <div className="absolute bottom-4 right-4 z-40 flex flex-col items-end gap-2.5">
        {/* Opacity Slider */}
        <div className="bg-slate-900/95 backdrop-blur-md rounded-xl border border-slate-700/80 p-2.5 px-3.5 shadow-2xl w-48">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] text-slate-300 font-medium">Model Şeffaflığı</span>
            <span className="text-[11px] text-cyan-400 font-mono font-bold">{Math.round(modelOpacity * 100)}%</span>
          </div>
          <input
            type="range"
            min="0.1"
            max="1.0"
            step="0.05"
            value={modelOpacity}
            onChange={(e) => setModelOpacity(parseFloat(e.target.value))}
            className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
          />
        </div>

        <div className="flex items-center gap-2">
          {/* Snagging Toggle */}
          <button
            type="button"
            onClick={() => setIsSnaggingMode(!isSnaggingMode)}
            className={`px-3 py-2 rounded-lg text-xs font-semibold shadow-lg border transition-all flex items-center gap-1.5 ${
              isSnaggingMode
                ? "bg-red-600/90 text-white border-red-500/50 shadow-red-500/20"
                : "bg-slate-900/90 text-slate-300 hover:text-white border-slate-700 hover:bg-slate-800"
            }`}
          >
            <span>📍 {isSnaggingMode ? "Kusur Modu Açık" : "Kusur İşaretle"}</span>
          </button>

          {/* AR Button */}
          {projectId && (
            <button
              type="button"
              onClick={() => {
                const targetUrl = effectiveUrl
                  ? `/ar/${projectId}?url=${encodeURIComponent(effectiveUrl)}`
                  : `/ar/${projectId}`
                window.open(targetUrl, "_blank")
              }}
              className="px-3.5 py-2 bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white rounded-lg text-xs font-bold shadow-[0_0_15px_rgba(6,182,212,0.6)] border border-cyan-300/40 transition-all flex items-center gap-1.5 transform hover:scale-105 active:scale-95"
            >
              <span className="w-2 h-2 rounded-full bg-cyan-300 animate-ping" />
              <span>📱 AR Sahada Gör</span>
            </button>
          )}
        </div>
      </div>

      {/* Floating Instructions Banner */}
      <div className="absolute bottom-4 left-4 z-40 bg-slate-900/90 backdrop-blur-md rounded-lg border border-slate-700/80 px-3 py-1.5 shadow-xl hidden sm:flex items-center gap-2 text-xs text-slate-300">
        <span className="text-cyan-400">💡</span>
        <span>Döndürmek için sol tıkla sürükleyin, yakınlaşmak için tekerleği kaydırın</span>
      </div>

      {/* Issue Form Modal for Snagging */}
      {showIssueForm && (
        <div className="absolute inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-white">📍 3D Model Üzerinde Kusur Bildirimi</h3>
              <button
                type="button"
                onClick={() => {
                  setShowIssueForm(false)
                  setSelectedPinPosition(null)
                }}
                className="text-slate-400 hover:text-white p-1"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Başlık</label>
                <input
                  type="text"
                  value={issueForm.title}
                  onChange={(e) => setIssueForm({ ...issueForm, title: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-cyan-500"
                  placeholder="Örn: 2. Kat Döşeme Çatlağı"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Açıklama</label>
                <textarea
                  rows={3}
                  value={issueForm.description}
                  onChange={(e) => setIssueForm({ ...issueForm, description: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-cyan-500 resize-none"
                  placeholder="Tespit edilen kusur veya eksiklik..."
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Fotoğraf Ekle</label>
                <UploadButton
                  endpoint="dailyReportImage"
                  onClientUploadComplete={(res) => {
                    if (res && res.length > 0) {
                      setIssueForm({ ...issueForm, imageUrl: res[0].url })
                    }
                  }}
                  onUploadError={(err) => alert(`Yükleme hatası: ${err.message}`)}
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowIssueForm(false)
                    setSelectedPinPosition(null)
                  }}
                  className="flex-1 py-2 bg-slate-800 text-slate-300 rounded-lg text-xs font-medium hover:bg-slate-700"
                >
                  İptal
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    if (!selectedPinPosition || !projectId) return
                    const res = await fetch("/api/bim-issues", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        projectId,
                        title: issueForm.title,
                        description: issueForm.description,
                        imageUrl: issueForm.imageUrl,
                        positionX: selectedPinPosition.x,
                        positionY: selectedPinPosition.y,
                        positionZ: selectedPinPosition.z,
                        status: "OPEN",
                      }),
                    })
                    if (res.ok) {
                      const newIssue = await res.json()
                      setPins((prev) => [...prev, newIssue])
                      setShowIssueForm(false)
                      setSelectedPinPosition(null)
                      setIssueForm({ title: "", description: "", imageUrl: "" })
                      alert("Kusur başarıyla kaydedildi!")
                    }
                  }}
                  disabled={!issueForm.title || !issueForm.description}
                  className="flex-1 py-2 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white rounded-lg text-xs font-semibold shadow-lg"
                >
                  Kaydet
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
