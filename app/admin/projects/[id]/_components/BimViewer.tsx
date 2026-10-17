"use client"
/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * High-Performance Dual-Engine 3D BIM Viewer (React Three Fiber + Web-IFC Engine)
 * Features: X-Ray (Röntgen) Mode, Multi-Discipline Layer Filtering, Snagging, AR
 */

import React, { useEffect, useRef, useState, Suspense, Component, type ReactNode } from "react"
import { Canvas, useLoader } from "@react-three/fiber"
import { OrbitControls, useGLTF, Environment, Center, Bounds, Html, useProgress, Grid, Line } from "@react-three/drei"
import { IfcViewerAPI } from "web-ifc-viewer"
import { IFCLoader } from "web-ifc-three/IFCLoader"
import * as THREE from "three"
import * as WebIFC from "web-ifc"
import { UploadButton } from "@/lib/uploadthing"
import { toast } from "react-hot-toast"

// Ensure IFCLoader prototype has setWasmPath method directly for R3F useLoader callback
if (typeof (IFCLoader as any).prototype?.setWasmPath !== "function") {
  ;(IFCLoader as any).prototype.setWasmPath = function (path: string) {
    if (this.ifcManager?.setWasmPath) {
      this.ifcManager.setWasmPath(path)
    }
    if (this.ifcManager?.state?.api?.SetWasmPath) {
      this.ifcManager.state.api.SetWasmPath(path)
    }
  }
}

// --- CATEGORY TYPES & DEFINITIONS ---

export type BimCategoryKey = "statik" | "mimari" | "elektrik" | "mekanik"

export interface BimCategoryConfig {
  key: BimCategoryKey
  label: string
  icon: string
  subLabel: string
  elementsDesc: string
  color: string
  textColor: string
  activeBg: string
  badgeBg: string
  borderActive: string
  glowColorHex: string
  isStructuralOrArchitectural: boolean // true = drops opacity with X-Ray slider; false = stays 100% opaque
  ifcTypes: number[]
  nameKeywords: string[]
}

export const BIM_CATEGORIES: BimCategoryConfig[] = [
  {
    key: "statik",
    label: "Statik",
    icon: "🏗️",
    subLabel: "Taşıyıcı Sistem",
    elementsDesc: "Kolon, Kiriş, Döşeme (IfcColumn, IfcBeam, IfcSlab)",
    color: "#3b82f6",
    textColor: "text-blue-400",
    activeBg: "bg-blue-600",
    badgeBg: "bg-blue-500/15 text-blue-300 border-blue-500/30",
    borderActive: "border-blue-500/50",
    glowColorHex: "#3b82f6",
    isStructuralOrArchitectural: true,
    ifcTypes: [
      WebIFC.IFCCOLUMN,
      WebIFC.IFCCOLUMNSTANDARDCASE,
      WebIFC.IFCBEAM,
      WebIFC.IFCBEAMSTANDARDCASE,
      WebIFC.IFCSLAB,
      WebIFC.IFCSLABELEMENTEDCASE,
      WebIFC.IFCSLABSTANDARDCASE,
      WebIFC.IFCFOOTING,
      WebIFC.IFCMEMBER,
      WebIFC.IFCMEMBERSTANDARDCASE,
      WebIFC.IFCPLATE,
      WebIFC.IFCPLATESTANDARDCASE,
      WebIFC.IFCREINFORCINGBAR,
    ].filter(Boolean),
    nameKeywords: ["column", "kolon", "beam", "kiris", "kiriş", "slab", "doseme", "döşeme", "footing", "temel", "structure", "statik", "beton", "concrete", "rebar", "hasir", "hasır", "frame"],
  },
  {
    key: "mimari",
    label: "Mimari",
    icon: "🧱",
    subLabel: "Kabin & Bölücüler",
    elementsDesc: "Duvar, Kapı, Pencere (IfcWall, IfcDoor, IfcWindow)",
    color: "#f97316",
    textColor: "text-orange-400",
    activeBg: "bg-orange-500",
    badgeBg: "bg-orange-500/15 text-orange-300 border-orange-500/30",
    borderActive: "border-orange-500/50",
    glowColorHex: "#f97316",
    isStructuralOrArchitectural: true,
    ifcTypes: [
      WebIFC.IFCWALL,
      WebIFC.IFCWALLSTANDARDCASE,
      WebIFC.IFCWALLELEMENTEDCASE,
      WebIFC.IFCDOOR,
      WebIFC.IFCDOORSTANDARDCASE,
      WebIFC.IFCWINDOW,
      WebIFC.IFCWINDOWSTANDARDCASE,
      WebIFC.IFCROOF,
      WebIFC.IFCSTAIR,
      WebIFC.IFCSTAIRFLIGHT,
      WebIFC.IFCRAILING,
      WebIFC.IFCCURTAINWALL,
      WebIFC.IFCCOVERING,
      WebIFC.IFCFURNISHINGELEMENT,
      WebIFC.IFCSPACE,
    ].filter(Boolean),
    nameKeywords: ["wall", "duvar", "door", "kapi", "kapı", "window", "pencere", "roof", "cati", "çatı", "stair", "merdiven", "railing", "korkuluk", "facade", "cephe", "mimari", "arch", "partition", "bolme", "bölme", "floor", "zemin", "tavan"],
  },
  {
    key: "elektrik",
    label: "Elektrik",
    icon: "⚡",
    subLabel: "Kuvvetli & Zayıf Akım",
    elementsDesc: "Kablolar, Tavalar (IfcCableSegment, IfcCableCarrierSegment)",
    color: "#eab308",
    textColor: "text-amber-400",
    activeBg: "bg-amber-500",
    badgeBg: "bg-amber-500/15 text-amber-300 border-amber-500/30",
    borderActive: "border-amber-500/50",
    glowColorHex: "#facc15",
    isStructuralOrArchitectural: false,
    ifcTypes: [
      WebIFC.IFCCABLESEGMENT,
      WebIFC.IFCCABLECARRIERSEGMENT,
      WebIFC.IFCCABLECARRIERFITTING,
      WebIFC.IFCCABLEFITTING,
      WebIFC.IFCELECTRICDISTRIBUTIONBOARD,
      WebIFC.IFCELECTRICFLOWSTORAGEDEVICE,
      WebIFC.IFCLIGHTFIXTURE,
      WebIFC.IFCJUNCTIONBOX,
      WebIFC.IFCOUTLET,
      WebIFC.IFCELECTRICAPPLIANCE,
      WebIFC.IFCELECTRICMOTOR,
      WebIFC.IFCELECTRICALELEMENT,
    ].filter(Boolean),
    nameKeywords: ["electric", "elektrik", "cable", "kablo", "tray", "tava", "conduit", "wire", "light", "aydinlatma", "aydınlatma", "panel", "pano", "switch", "priz", "junction", "armatur", "armatür", "ups", "trafo"],
  },
  {
    key: "mekanik",
    label: "Mekanik/Tesisat",
    icon: "💧",
    subLabel: "Sıhhi & Havalandırma",
    elementsDesc: "Borular, Kanallar (IfcPipeSegment, IfcDuctSegment)",
    color: "#06b6d4",
    textColor: "text-cyan-400",
    activeBg: "bg-cyan-500",
    badgeBg: "bg-cyan-500/15 text-cyan-300 border-cyan-500/30",
    borderActive: "border-cyan-500/50",
    glowColorHex: "#06b6d4",
    isStructuralOrArchitectural: false,
    ifcTypes: [
      WebIFC.IFCPIPESEGMENT,
      WebIFC.IFCPIPEFITTING,
      WebIFC.IFCDUCTSEGMENT,
      WebIFC.IFCDUCTFITTING,
      WebIFC.IFCFLOWTERMINAL,
      WebIFC.IFCVALVE,
      WebIFC.IFCPUMP,
      WebIFC.IFCBOILER,
      WebIFC.IFCAIRTERMINAL,
      WebIFC.IFCDUCTSILENCER,
      WebIFC.IFCFLOWCONTROLLER,
      WebIFC.IFCFLOWMETER,
      WebIFC.IFCFLOWMOVINGDEVICE,
      WebIFC.IFCFLOWSTORAGEDEVICE,
      WebIFC.IFCFLOWTREATMENTDEVICE,
      WebIFC.IFCSANITARYTERMINAL,
      WebIFC.IFCWASTETERMINAL,
    ].filter(Boolean),
    nameKeywords: ["pipe", "boru", "duct", "kanal", "hvac", "mekanik", "plumbing", "tesisat", "valve", "vana", "pump", "pompa", "air", "havalandirma", "havalandırma", "chiller", "boiler", "klima", "sanitary", "gider", "kombi", "flange", "drain"],
  },
]

// Helper function to identify category from Three.js mesh in GLTF mode
function identifyCategory(mesh: any): BimCategoryKey {
  const name = (mesh.name || "").toLowerCase()
  const parentName = (mesh.parent?.name || "").toLowerCase()
  const matName = (mesh.material?.name || "").toLowerCase()
  const fullText = `${name} ${parentName} ${matName}`

  for (const cat of BIM_CATEGORIES) {
    if (cat.nameKeywords.some((kw) => fullText.includes(kw))) {
      return cat.key
    }
  }

  // Fallback heuristics: based on mesh position or geometry proportions
  if (mesh.geometry) {
    mesh.geometry.computeBoundingBox?.()
    const bbox = mesh.geometry.boundingBox
    if (bbox) {
      const sizeX = Math.abs(bbox.max.x - bbox.min.x)
      const sizeY = Math.abs(bbox.max.y - bbox.min.y)
      const sizeZ = Math.abs(bbox.max.z - bbox.min.z)

      // Slender vertical column/pipe
      if (sizeY > sizeX * 2 && sizeY > sizeZ * 2) {
        return "statik"
      }
      // Thin flat slab
      if (sizeY < sizeX * 0.2 && sizeY < sizeZ * 0.2) {
        return "statik"
      }
    }
  }

  // Default fallback to mimari
  return "mimari"
}

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

// R3F GLTF Model Primitive with Category Filtering & X-Ray Shader Controls
function GltfModel({
  url,
  layerVisibility,
  xRayOpacity,
  onElementCounts,
  onClick,
  onPointerDown,
}: {
  url: string
  layerVisibility: Record<BimCategoryKey, boolean>
  xRayOpacity: number
  onElementCounts?: (counts: Record<BimCategoryKey, number>) => void
  onClick?: (e: any) => void
  onPointerDown?: (e: any) => void
}) {
  // URL boşsa veya hatalıysa render'ı iptal et
  if (!url || url.trim() === "") return null

  const { scene } = useGLTF(url)

  // 1. Element counts calculated once when scene loads
  useEffect(() => {
    if (!scene || !onElementCounts) return
    const counts: Record<BimCategoryKey, number> = { statik: 0, mimari: 0, elektrik: 0, mekanik: 0 }
    scene.traverse((child: any) => {
      if (child.isMesh) {
        const catKey = identifyCategory(child)
        counts[catKey] = (counts[catKey] || 0) + 1
      }
    })
    onElementCounts(counts)
  }, [scene])

  // 2. High-performance material opacity & layer visibility update (Zero redundant needsUpdate)
  useEffect(() => {
    if (!scene) return

    const alpha = xRayOpacity / 100
    const newTransparent = alpha < 0.99
    const newDepthWrite = alpha > 0.4
    const clampedOpacity = Math.max(0.04, alpha)
    const isXRayActive = xRayOpacity < 70

    scene.traverse((child: any) => {
      if (child.isMesh) {
        child.castShadow = true
        child.receiveShadow = true

        const catKey = identifyCategory(child)

        // 1. Layer Visibility Toggle
        const shouldBeVisible = layerVisibility[catKey] ?? true
        if (child.visible !== shouldBeVisible) {
          child.visible = shouldBeVisible
        }

        // 2. Material Opacity & X-Ray Management
        if (child.material) {
          // Clone material once if shared to avoid side-effects across meshes
          if (!child.userData.isClonedForBim) {
            child.material = child.material.clone()
            child.userData.isClonedForBim = true
            child.userData.originalColor = child.material.color?.clone?.()
          }

          const isStructuralOrArch = catKey === "statik" || catKey === "mimari"

          if (isStructuralOrArch) {
            // Drop opacity according to the X-Ray slider
            if (child.material.transparent !== newTransparent) {
              child.material.transparent = newTransparent
              child.material.needsUpdate = true
            }
            if (child.material.opacity !== clampedOpacity) {
              child.material.opacity = clampedOpacity
            }
            if (child.material.depthWrite !== newDepthWrite) {
              child.material.depthWrite = newDepthWrite
            }
          } else {
            // MEP (Elektrik & Mekanik): Always 100% opaque!
            if (child.material.transparent !== false) {
              child.material.transparent = false
              child.material.needsUpdate = true
            }
            if (child.material.opacity !== 1.0) {
              child.material.opacity = 1.0
            }
            if (child.material.depthWrite !== true) {
              child.material.depthWrite = true
            }

            // Glowing emissive effect when X-Ray is turned on so pipes shine through walls!
            if (isXRayActive) {
              const glowColor = catKey === "elektrik" ? new THREE.Color(0xfacc15) : new THREE.Color(0x06b6d4)
              child.material.emissive = glowColor
              child.material.emissiveIntensity = 0.4
            } else {
              child.material.emissive = new THREE.Color(0x000000)
              child.material.emissiveIntensity = 0
            }
          }
        }
      }
    })
  }, [scene, layerVisibility, xRayOpacity])

  useEffect(() => {
    return () => {
      useGLTF.clear(url)
    }
  }, [url])

  return <primitive object={scene} onClick={onClick} onPointerDown={onPointerDown} />
}

// Helper to determine if a URL or filename represents an IFC model
function isIfcUrlOrFile(url: string, name?: string): boolean {
  const u = (url || "").toLowerCase()
  const n = (name || "").toLowerCase()
  if (u.endsWith(".ifc") || u.includes(".ifc?") || n.endsWith(".ifc") || n.includes(".ifc")) {
    return true
  }
  if (
    u.endsWith(".glb") ||
    u.endsWith(".gltf") ||
    u.includes(".glb?") ||
    u.includes(".gltf?") ||
    n.endsWith(".glb") ||
    n.endsWith(".gltf")
  ) {
    return false
  }
  // Default to true for BIM viewer uploads unless explicitly GLB/GLTF
  return true
}

// R3F IFC Model Loader with WebAssembly (WASM) Path configuration
// BU BİLEŞEN VE WASM AYARI HAYATİDİR - 3D Canvas içinde IFC modelinin WebAssembly ile hatasız okunmasını sağlar
function IfcCanvasModel({
  url,
  layerVisibility,
  xRayOpacity,
  onClick,
  onPointerDown,
}: {
  url: string
  layerVisibility: Record<BimCategoryKey, boolean>
  xRayOpacity: number
  onClick?: (e: any) => void
  onPointerDown?: (e: any) => void
}) {
  // URL boşsa veya hatalıysa render'ı iptal et
  if (!url || url.trim() === "") return null

  // BU SATIR KRİTİKTİR, WASM OLMADAN TARAYICI IFC OKUYAMAZ VE SESSİZCE ÇÖKER:
  const ifcModel = useLoader(IFCLoader, url, (loader: any) => {
    const wasmPath = "https://cdn.jsdelivr.net/npm/web-ifc@0.0.36/" // STABİL JSDELIVR CDN
    loader.setWasmPath(wasmPath)
    if (loader.ifcManager?.setWasmPath) {
      loader.ifcManager.setWasmPath(wasmPath)
    }
    if (loader.ifcManager?.state?.api?.SetWasmPath) {
      loader.ifcManager.state.api.SetWasmPath(wasmPath)
    }
  }) as any

  useEffect(() => {
    if (!ifcModel) return

    const alpha = xRayOpacity / 100
    const newTransparent = alpha < 0.99
    const newDepthWrite = alpha > 0.4
    const clampedOpacity = Math.max(0.04, alpha)
    const isXRayActive = xRayOpacity < 70

    ifcModel.traverse((child: any) => {
      if (child.isMesh && child.material) {
        child.castShadow = true
        child.receiveShadow = true

        const catKey = identifyCategory(child)
        const shouldBeVisible = layerVisibility[catKey] ?? true
        if (child.visible !== shouldBeVisible) {
          child.visible = shouldBeVisible
        }

        const isArchOrStructural = catKey === "statik" || catKey === "mimari"

        const applyMat = (mat: any) => {
          if (isArchOrStructural) {
            if (mat.transparent !== newTransparent) {
              mat.transparent = newTransparent
              mat.needsUpdate = true
            }
            if (mat.opacity !== clampedOpacity) {
              mat.opacity = clampedOpacity
            }
            if (mat.depthWrite !== newDepthWrite) {
              mat.depthWrite = newDepthWrite
            }
          } else {
            if (mat.transparent !== false) {
              mat.transparent = false
              mat.needsUpdate = true
            }
            if (mat.opacity !== 1.0) {
              mat.opacity = 1.0
            }
            if (mat.depthWrite !== true) {
              mat.depthWrite = true
            }
            if (isXRayActive) {
              mat.emissive = new THREE.Color(catKey === "elektrik" ? 0xfacc15 : 0x06b6d4)
              mat.emissiveIntensity = 0.4
            } else {
              mat.emissive = new THREE.Color(0x000000)
              mat.emissiveIntensity = 0
            }
          }
        }

        if (Array.isArray(child.material)) {
          child.material.forEach(applyMat)
        } else {
          applyMat(child.material)
        }
      }
    })
  }, [ifcModel, layerVisibility, xRayOpacity])

  return <primitive object={ifcModel as any} onClick={onClick} onPointerDown={onPointerDown} />
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

// Outer Error Boundary for the entire BimViewer component (catches all React tree errors)
class BimViewerErrorBoundary extends Component<
  { children: ReactNode },
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
    console.error("[BimViewer] Outer Error Boundary caught:", error, errorInfo)
  }

  render() {
    if (this.state.hasError && this.state.error) {
      return (
        <div className="w-full h-full min-h-[650px] bg-slate-950 rounded-2xl border border-red-500/30 flex flex-col items-center justify-center p-6 text-center shadow-2xl">
          <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 mb-4">
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h4 className="text-white font-bold text-base mb-2">3D Görüntüleyici Hatası</h4>
          <p className="text-slate-400 text-xs max-w-sm mb-2 leading-relaxed">
            {this.state.error.message || "Beklenmeyen bir render hatası oluştu."}
          </p>
          <p className="text-slate-500 text-xs max-w-sm mb-5">
            Model formatını kontrol edin veya farklı bir model deneyin.
          </p>
          <button
            type="button"
            onClick={() => this.setState({ hasError: false, error: null })}
            className="px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-lg text-xs font-semibold shadow-lg transition-all"
          >
            🔄 Görüntüleyiciyi Yeniden Başlat
          </button>
        </div>
      )
    }
    return this.props.children
  }
}

export default function BimViewer({ url, ifcUrl, bimUrl, projectId, fileName }: BimViewerProps) {
  const effectiveUrl = (bimUrl || url || ifcUrl || "").trim()

  // Determine if file is an IFC file
  const isIfcFile = isIfcUrlOrFile(effectiveUrl, fileName)

  // Engine Mode: Default to 'canvas' (@react-three/fiber) for fast WebGL rendering of both IFC and GLTF
  const [engineMode, setEngineMode] = useState<"canvas" | "ifc">("canvas")
  const [autoRotate, setAutoRotate] = useState(false)
  const [activeModelUrl, setActiveModelUrl] = useState(effectiveUrl)
  const [safeUrl, setSafeUrl] = useState<string | null>(null)
  const [isFullscreen, setIsFullscreen] = useState(false)

  // Trigger resize event so Canvas and IFC viewer instantly adapt to fullscreen toggle
  useEffect(() => {
    const timer = setTimeout(() => {
      window.dispatchEvent(new Event("resize"))
      // TypeScript 'private' hatasını engellemek için any olarak cast ediyoruz:
      const context = ifcViewerRef.current?.context as any
      if (context && typeof context.resize === "function") {
        try {
          context.resize()
        } catch (e) {
          console.warn("IFC Context resize hatası:", e)
        }
      }
    }, 100)
    return () => clearTimeout(timer)
  }, [isFullscreen])

  useEffect(() => {
    if (!activeModelUrl) {
      setSafeUrl(null)
      return
    }

    let currentBlobUrl: string | null = null

    // Sadece dış bağlantılarda (utfs.io vb) CORS aşımı için Blob kullan
    if (activeModelUrl.startsWith("http")) {
      fetch(activeModelUrl)
        .then((res) => res.blob())
        .then((blob) => {
          const blobUrl = URL.createObjectURL(blob)
          currentBlobUrl = blobUrl
          setSafeUrl(blobUrl)
        })
        .catch((err) => {
          console.error("CORS Blob Fetch Error:", err)
          setSafeUrl(activeModelUrl) // Fallback
        })
    } else {
      setSafeUrl(activeModelUrl)
    }

    return () => {
      if (currentBlobUrl && currentBlobUrl.startsWith("blob:")) {
        URL.revokeObjectURL(currentBlobUrl)
      }
    }
  }, [activeModelUrl])

  // --- X-RAY & LAYER FILTERING STATES ---
  const [uiOpacity, setUiOpacity] = useState(100) // Sadece Slider UI için (Hafif)
  const [xRayOpacity, setXRayOpacity] = useState(100) // 3D Render için (Ağır)
  const [layerVisibility, setLayerVisibility] = useState<Record<BimCategoryKey, boolean>>({
    statik: true,
    mimari: true,
    elektrik: true,
    mekanik: true,
  })
  const [categoryCounts, setCategoryCounts] = useState<Record<BimCategoryKey, number>>({
    statik: 0,
    mimari: 0,
    elektrik: 0,
    mekanik: 0,
  })
  const [isLayerPanelOpen, setIsLayerPanelOpen] = useState(true)

  // IFC Viewer refs & states
  const ifcContainerRef = useRef<HTMLDivElement>(null)
  const ifcViewerRef = useRef<IfcViewerAPI | null>(null)
  const loadedIfcModelRef = useRef<any>(null)
  const ifcSubsetsRef = useRef<Record<string, any>>({})
  const [ifcLoading, setIfcLoading] = useState(false)
  const [ifcError, setIfcError] = useState<string | null>(null)

  // Measurement (3D Lazer Metre) states
  const [isMeasureMode, setIsMeasureMode] = useState(false)
  const [measurePoints, setMeasurePoints] = useState<THREE.Vector3[]>([])
  const [measuredDistance, setMeasuredDistance] = useState<number | null>(null)
  const [selectedElementMetrics, setSelectedElementMetrics] = useState<{
    name: string
    category: string
    width: string
    height: string
    depth: string
    volume: string
  } | null>(null)

  // Snagging (Kusur İşaretleme) states
  const [isSnaggingMode, setIsSnaggingMode] = useState(false)
  const [showIssueForm, setShowIssueForm] = useState(false)
  const [selectedPinPosition, setSelectedPinPosition] = useState<THREE.Vector3 | null>(null)
  const [issueForm, setIssueForm] = useState({
    title: "",
    description: "",
    imageUrl: "",
    subcontractorName: "Kaba Yapı & Betonarme Taşeronu",
    severity: "CRITICAL",
    blockPayment: true,
    penaltyAmount: "",
  })
  const [pins, setPins] = useState<any[]>([])

  const pointerDownPosRef = useRef<{ x: number; y: number } | null>(null)
  const highlightedMeshRef = useRef<{
    mesh: THREE.Mesh
    origEmissive: THREE.Color
    origIntensity: number
  } | null>(null)

  const restorePreviousHighlight = () => {
    if (highlightedMeshRef.current) {
      const { mesh, origEmissive, origIntensity } = highlightedMeshRef.current
      if (mesh && mesh.material) {
        const applyRestore = (mat: any) => {
          if (mat.emissive) mat.emissive.copy(origEmissive)
          if (mat.emissiveIntensity !== undefined) mat.emissiveIntensity = origIntensity
        }
        if (Array.isArray(mesh.material)) {
          mesh.material.forEach(applyRestore)
        } else {
          applyRestore(mesh.material)
        }
      }
      highlightedMeshRef.current = null
    }
  }

  // 3D Model tıklama (Raycaster) dinleyicisi - Kusur İşaretleme & Lazer Metre
  const handleModelClick = (e: any) => {
    // Mobilde kamera döndürme (drag) ile tıklamayı (tap) ayırmak için mesafe kontrolü (< 5px)
    if (pointerDownPosRef.current) {
      const clientX = e.clientX ?? (e.nativeEvent as any)?.clientX ?? 0
      const clientY = e.clientY ?? (e.nativeEvent as any)?.clientY ?? 0
      const distance = Math.hypot(clientX - pointerDownPosRef.current.x, clientY - pointerDownPosRef.current.y)
      if (distance >= 5) {
        return // Kamera döndürülüyordu, seçimi tetikleme
      }
    }

    // 1. ÖLÇÜM (MEASUREMENT) MODU
    if (isMeasureMode) {
      e.stopPropagation()
      const point = e.point as THREE.Vector3

      // Tıklanan objenin gerçek boyutlarını ve yaklaşık hacmini hesapla
      if (e.object) {
        try {
          const bbox = new THREE.Box3().setFromObject(e.object)
          const size = new THREE.Vector3()
          bbox.getSize(size)
          const width = size.x.toFixed(2)
          const height = size.y.toFixed(2)
          const depth = size.z.toFixed(2)
          const volume = (size.x * size.y * size.z).toFixed(3)
          const catKey = identifyCategory(e.object)
          const categoryLabel =
            catKey === "statik"
              ? "Statik / Taşıyıcı"
              : catKey === "mimari"
              ? "Mimari"
              : catKey === "elektrik"
              ? "Elektrik"
              : "Mekanik"

          setSelectedElementMetrics({
            name: e.object.name || "BIM Elemanı",
            category: categoryLabel,
            width: `${width} m`,
            height: `${height} m`,
            depth: `${depth} m`,
            volume: `${volume} m³`,
          })
        } catch (err) {
          console.warn("Could not calculate element bbox:", err)
        }
      }

      // Nokta ekleme ve mesafe hesaplama
      setMeasurePoints((prev) => {
        if (prev.length === 0) {
          setMeasuredDistance(null)
          return [point]
        } else if (prev.length === 1) {
          const dist = prev[0].distanceTo(point)
          setMeasuredDistance(dist)
          return [prev[0], point]
        } else {
          // 3. tıklamada yeni ölçüm için noktaları sıfırla
          setMeasuredDistance(null)
          return [point]
        }
      })
      return
    }

    // 2. KUSUR İŞARETLEME (SNAGGING) MODU
    if (!isSnaggingMode) return
    e.stopPropagation()
    const point = e.point
    setSelectedPinPosition(point)

    // Tıklanan 3D elemanı algıla, parlak kırmızı (0xef4444 emissive glow) yap
    const clickedMesh = (e.object?.isMesh ? e.object : null) as THREE.Mesh | null
    if (clickedMesh && clickedMesh.material) {
      restorePreviousHighlight()
      if (!clickedMesh.userData?.isClonedForHighlight) {
        if (Array.isArray(clickedMesh.material)) {
          clickedMesh.material = clickedMesh.material.map((m) => m.clone())
        } else {
          clickedMesh.material = clickedMesh.material.clone()
        }
        clickedMesh.userData.isClonedForHighlight = true
      }
      const targetMat = (Array.isArray(clickedMesh.material) ? clickedMesh.material[0] : clickedMesh.material) as any
      const origEmissive = targetMat.emissive ? targetMat.emissive.clone() : new THREE.Color(0x000000)
      const origIntensity = targetMat.emissiveIntensity ?? 0
      highlightedMeshRef.current = {
        mesh: clickedMesh,
        origEmissive,
        origIntensity,
      }

      const applyHighlight = (m: any) => {
        m.emissive = new THREE.Color(0xef4444)
        m.emissiveIntensity = 0.9
      }
      if (Array.isArray(clickedMesh.material)) {
        clickedMesh.material.forEach(applyHighlight)
      } else {
        applyHighlight(clickedMesh.material)
      }
    }

    // Eleman kategorisi ve taşeron önerisi
    const catKey = identifyCategory(e.object)
    let categoryName = "Statik Eleman"
    let subDesc = "Kolon/Döşeme Kusuru"
    let defaultSubcontractor = "Kaba Yapı & Betonarme Taşeronu"
    const name = (e.object?.name || "").toLowerCase()
    if (catKey === "statik") {
      categoryName = "Statik Eleman"
      defaultSubcontractor = "Kaba Yapı & Betonarme Taşeronu"
      if (name.includes("column") || name.includes("kolon")) subDesc = "Kolon Kusuru"
      else if (name.includes("beam") || name.includes("kiriş") || name.includes("kiris")) subDesc = "Kiriş Kusuru"
      else if (name.includes("slab") || name.includes("döşeme") || name.includes("doseme")) subDesc = "Döşeme Kusuru"
      else subDesc = "Kolon/Döşeme Kusuru"
    } else if (catKey === "mimari") {
      categoryName = "Mimari Eleman"
      subDesc = "Duvar/Yüzey Kusuru"
      defaultSubcontractor = "İnce İşler & Duvar Taşeronu"
    } else if (catKey === "elektrik") {
      categoryName = "Elektrik Donatısı"
      subDesc = "Kablo Kanalı/Pano Kusuru"
      defaultSubcontractor = "Elektrik Taşeronu"
    } else if (catKey === "mekanik") {
      categoryName = "Mekanik Tesisat"
      subDesc = "Boru/Kanal/Vana Kusuru"
      defaultSubcontractor = "Mekanik Tesisat Taşeronu"
    }

    setIssueForm({
      title: `[${categoryName}] - ${subDesc}`,
      description: "",
      imageUrl: "",
      subcontractorName: defaultSubcontractor,
      severity: "CRITICAL",
      blockPayment: true,
      penaltyAmount: "",
    })

    setShowIssueForm(true)
    setIsSnaggingMode(false)
  }

  // Sync activeModelUrl and default to canvas engine when props change
  useEffect(() => {
    if (effectiveUrl) {
      setActiveModelUrl(effectiveUrl)
      setEngineMode("canvas")
    }
  }, [effectiveUrl, fileName])

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

  // Update IFC Subsets / Meshes for Visibility and Opacity (Zero redundant needsUpdate)
  const applyIfcSubsetsState = (
    subsets: Record<string, any>,
    visibility: Record<BimCategoryKey, boolean>,
    opacityValue: number
  ) => {
    const scene = ifcViewerRef.current?.context?.getScene()
    const alpha = opacityValue / 100
    const newTransparent = alpha < 0.99
    const newDepthWrite = alpha > 0.4
    const clampedOpacity = Math.max(0.04, alpha)
    const isXRayActive = opacityValue < 70

    BIM_CATEGORIES.forEach((cat) => {
      const subset = subsets[cat.key]
      if (!subset) return

      const isVisible = visibility[cat.key] ?? true
      if (subset.visible !== isVisible) {
        subset.visible = isVisible
      }

      if (subset.material) {
        if (cat.isStructuralOrArchitectural) {
          // Drop opacity for Statik & Mimari
          if (subset.material.transparent !== newTransparent) {
            subset.material.transparent = newTransparent
            subset.material.needsUpdate = true
          }
          if (subset.material.opacity !== clampedOpacity) {
            subset.material.opacity = clampedOpacity
          }
          if (subset.material.depthWrite !== newDepthWrite) {
            subset.material.depthWrite = newDepthWrite
          }
        } else {
          // MEP (Elektrik & Mekanik): Always 100% opaque!
          if (subset.material.transparent !== false) {
            subset.material.transparent = false
            subset.material.needsUpdate = true
          }
          if (subset.material.opacity !== 1.0) {
            subset.material.opacity = 1.0
          }
          if (subset.material.depthWrite !== true) {
            subset.material.depthWrite = true
          }

          // Emissive glow highlight when X-Ray is active
          if (isXRayActive) {
            subset.material.emissive = new THREE.Color(cat.color)
            subset.material.emissiveIntensity = 0.5
          } else {
            subset.material.emissive = new THREE.Color(0x000000)
            subset.material.emissiveIntensity = 0
          }
        }
      }
    })

    // Other / remainder subset
    const otherSubset = subsets["other"]
    if (otherSubset && otherSubset.material) {
      if (otherSubset.material.transparent !== newTransparent) {
        otherSubset.material.transparent = newTransparent
        otherSubset.material.needsUpdate = true
      }
      otherSubset.material.opacity = clampedOpacity
    }

    // Fallback: If no subsets exist, directly apply to composite model
    if (Object.keys(subsets).length === 0 && scene) {
      scene.traverse((child: any) => {
        if (child.isMesh && child.material) {
          if (child.material.transparent !== newTransparent) {
            child.material.transparent = newTransparent
            child.material.needsUpdate = true
          }
          child.material.opacity = Math.max(0.05, alpha)
        }
      })
    }
  }

  // IFC Engine Initialization and Model Loading with Category Extraction
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
          backgroundColor: new THREE.Color(0x0a0f1d), // ultra dark sleek slate
        })
        ifcViewerRef.current = viewer

        viewer.axes.setAxes()
        viewer.grid.setGrid()

        // BU SATIR HAYATİDİR: Browser WebAssembly (WASM) dosyasını doğrudan ve hatasız indirir
        try {
          await viewer.IFC.setWasmPath("https://cdn.jsdelivr.net/npm/web-ifc@0.0.36/")
        } catch (wasmErr) {
          console.warn("WASM path error:", wasmErr)
        }

        if (activeModelUrl) {
          try {
            console.log("IFC İndiriliyor (Blob Fetch)... URL:", activeModelUrl)

            // 12 saniye sonra yüklenmezse iptal et ve hata ver (Sonsuz yükleme kırıcısı)
            const timeoutPromise = new Promise((_, reject) => {
              setTimeout(
                () => reject(new Error("IFC modeli yükleme süresi doldu (12s). 3D Canvas motoruna geçebilirsiniz.")),
                12000
              )
            })

            const loadPromise = (async () => {
              // 1. ZORUNLU İNDİRME (CORS Aşımı)
              const res = await fetch(activeModelUrl)
              if (!res.ok) throw new Error("Dosya indirilemedi (HTTP " + res.status + ")")

              const blob = await res.blob()

              // 2. Blob'u fiziksel File objesine çevir
              const ifcFile = new File([blob], fileName || "model.ifc", { type: "application/octet-stream" })

              console.log("IFC File oluşturuldu, Parse ediliyor...")
              // 3. URL yerine doğrudan File okut!
              return await viewer.IFC.loadIfc(ifcFile, true)
            })()

            const loadedModel: any = await Promise.race([loadPromise, timeoutPromise])
            loadedIfcModelRef.current = loadedModel

            if (loadedModel && viewer?.context?.ifcCamera?.cameraControls) {
              await viewer.context.ifcCamera.cameraControls.fitToBox(loadedModel, true)
            }

            // --- EXTRACT CATEGORIES & CREATE GEOMETRIC SUBSETS ---
            if (loadedModel && !isDisposed) {
              const modelID = loadedModel.modelID ?? 0
              const scene = viewer.context.getScene()
              const createdSubsets: Record<string, any> = {}
              const counts: Record<BimCategoryKey, number> = { statik: 0, mimari: 0, elektrik: 0, mekanik: 0 }
              const categorizedIds = new Set<number>()

              for (const cat of BIM_CATEGORIES) {
                const ids: number[] = []
                for (const type of cat.ifcTypes) {
                  try {
                    const items = await viewer.IFC.loader.ifcManager.getAllItemsOfType(modelID, type, false)
                    if (items && Array.isArray(items)) {
                      ids.push(...items)
                    }
                  } catch {
                    // Type not defined in schema
                  }
                }

                const uniqueIds = Array.from(new Set(ids))
                counts[cat.key] = uniqueIds.length
                uniqueIds.forEach((id) => categorizedIds.add(id))

                if (uniqueIds.length > 0) {
                  try {
                    // Dedicated high-quality material for each category
                    const mat = new THREE.MeshStandardMaterial({
                      color: new THREE.Color(cat.color),
                      roughness: cat.isStructuralOrArchitectural ? 0.6 : 0.25,
                      metalness: cat.isStructuralOrArchitectural ? 0.1 : 0.6,
                      side: THREE.DoubleSide,
                    })

                    const subset = viewer.IFC.loader.ifcManager.createSubset({
                      modelID,
                      scene,
                      ids: uniqueIds,
                      removePrevious: true,
                      customID: cat.key,
                      material: mat,
                    })

                    if (subset) {
                      createdSubsets[cat.key] = subset
                    }
                  } catch (subsetErr) {
                    console.warn(`Failed to create subset for category ${cat.key}:`, subsetErr)
                  }
                }
              }

              // If we successfully generated subsets for categories:
              if (Object.keys(createdSubsets).length > 0) {
                // Hide base composite mesh so only clean subsets are rendered
                loadedModel.visible = false

                // Handle remaining uncategorized items (e.g. site, spaces, fixtures)
                try {
                  if (loadedModel.geometry?.attributes?.expressID) {
                    const allIds = Array.from(
                      new Set(Array.from(loadedModel.geometry.attributes.expressID.array as number[]))
                    )
                    const otherIds = allIds.filter((id) => !categorizedIds.has(id))
                    if (otherIds.length > 0) {
                      const otherMat = new THREE.MeshStandardMaterial({
                        color: new THREE.Color(0x94a3b8),
                        roughness: 0.5,
                        metalness: 0.1,
                        side: THREE.DoubleSide,
                      })
                      const otherSubset = viewer.IFC.loader.ifcManager.createSubset({
                        modelID,
                        scene,
                        ids: otherIds,
                        removePrevious: true,
                        customID: "other",
                        material: otherMat,
                      })
                      if (otherSubset) createdSubsets["other"] = otherSubset
                    }
                  }
                } catch (otherErr) {
                  console.warn("Uncategorized items subset handling:", otherErr)
                }
              } else {
                // Fallback to displaying composite model
                loadedModel.visible = true
              }

              ifcSubsetsRef.current = createdSubsets
              setCategoryCounts(counts)

              // Apply active layer visibility & X-ray opacity
              applyIfcSubsetsState(createdSubsets, layerVisibility, xRayOpacity)
            }
          } catch (err: any) {
            console.error("IFC Blob Fetch veya Parse Hatası:", err)
            if (!isDisposed) {
              setIfcError("IFC modeli indirilemedi veya okunamadı: " + err.message)
            }
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
      ifcSubsetsRef.current = {}
      const activeViewer = viewer || ifcViewerRef.current
      if (activeViewer) {
        try {
          activeViewer.dispose()
        } catch (e) {
          console.warn("IFC dispose error:", e)
        }
        ifcViewerRef.current = null
      }
      loadedIfcModelRef.current = null
      if (ifcContainerRef.current) {
        ifcContainerRef.current.innerHTML = ""
      }
    }
  }, [engineMode, activeModelUrl, fileName])

  // Sync IFC Subsets whenever visibility or X-Ray opacity changes
  useEffect(() => {
    if (engineMode === "ifc") {
      applyIfcSubsetsState(ifcSubsetsRef.current, layerVisibility, xRayOpacity)
    }
  }, [engineMode, layerVisibility, xRayOpacity])

  // Toggle single category visibility
  const toggleCategory = (key: BimCategoryKey) => {
    setLayerVisibility((prev) => ({
      ...prev,
      [key]: !prev[key],
    }))
  }

  // Quick Actions: All On / All Off / Only MEP (Tesisat)
  const setAllLayers = (visible: boolean) => {
    setLayerVisibility({
      statik: visible,
      mimari: visible,
      elektrik: visible,
      mekanik: visible,
    })
  }

  const isolateMepLayers = () => {
    setLayerVisibility({
      statik: false,
      mimari: false,
      elektrik: true,
      mekanik: true,
    })
    setUiOpacity(100)
    setXRayOpacity(100)
  }

  return (
    <BimViewerErrorBoundary>
    <div className={
      isFullscreen 
        ? "fixed inset-0 z-[100] bg-slate-950 w-screen h-screen flex flex-col" 
        : "relative w-full h-full min-h-[650px] bg-slate-950 rounded-2xl overflow-hidden select-none border border-slate-800 shadow-2xl"
    }>
      {/* Top Left: Engine Switcher & Auto Rotate Toolbar */}
      <div className="absolute top-3 left-3 right-3 sm:right-auto z-30 flex flex-wrap items-center justify-between sm:justify-start gap-1.5 bg-slate-900/90 backdrop-blur-md p-1.5 rounded-xl border border-slate-700/80 shadow-2xl">
        <button
          type="button"
          onClick={() => {
            setEngineMode("canvas")
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
        <button
          type="button"
          onClick={() => setIsFullscreen(!isFullscreen)}
          className="px-2.5 py-1.5 rounded-lg text-xs font-bold transition-colors bg-slate-800 text-white hover:bg-slate-700 border border-slate-600"
        >
          {isFullscreen ? "↙️ Küçült" : "🔲 Tam Ekran"}
        </button>

        <div className="h-4 w-[1px] bg-slate-700 mx-1" />

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

      {/* --- GLASSMORPHISM KATMANLAR & X-RAY KONTROL PANELİ (TOP RIGHT) --- */}
      <div className="absolute top-16 right-3 sm:top-4 sm:right-4 z-40 flex flex-col items-end">
        {!isLayerPanelOpen ? (
          // Collapsed Floating Button
          <button
            type="button"
            onClick={() => setIsLayerPanelOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2.5 bg-slate-900/90 hover:bg-slate-850 backdrop-blur-xl border border-cyan-500/40 rounded-xl shadow-[0_8px_30px_rgba(6,182,212,0.25)] text-white text-xs font-semibold transition-all transform hover:scale-105"
          >
            <span className="text-base animate-pulse">🩻</span>
            <span>Katmanlar & X-Ray</span>
            <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
              %{uiOpacity}
            </span>
            <div className="flex items-center gap-1 ml-1">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
              <span className="w-1.5 h-1.5 rounded-full bg-orange-400" />
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
            </div>
          </button>
        ) : (
          // Expanded Glassmorphism Control Panel
          <div className="w-80 sm:w-88 bg-slate-900/85 backdrop-blur-xl border border-slate-700/80 rounded-2xl shadow-[0_12px_45px_rgba(0,0,0,0.65)] overflow-hidden transition-all animate-in fade-in zoom-in-95 duration-200">
            {/* Panel Header */}
            <div className="p-3.5 px-4 bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 border-b border-slate-700/80 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400 text-base shadow-inner">
                  🩻
                </div>
                <div>
                  <h3 className="text-xs font-bold text-white tracking-wide flex items-center gap-1.5">
                    Katmanlar & X-Ray
                    <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  </h3>
                  <p className="text-[10px] text-slate-400 font-medium">BIM Röntgen & Disiplin Kontrolü</p>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setIsLayerPanelOpen(false)}
                  className="w-7 h-7 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors text-sm"
                  title="Paneli Küçült"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="p-4 space-y-4 max-h-[calc(100vh-260px)] min-h-[300px] overflow-y-auto custom-scrollbar">
              {/* --- ADIM 2: GLOBAL ŞEFFAFLIK (X-RAY MODU) SLIDER'I --- */}
              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/90 shadow-inner">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    <span className="text-cyan-400 text-sm">🩻</span>
                    <span className="text-xs font-semibold text-slate-200">Global Şeffaflık (X-Ray)</span>
                  </div>
                  <span
                    className={`text-xs font-mono font-bold px-2 py-0.5 rounded-md border ${
                      uiOpacity < 30
                        ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/50 shadow-[0_0_10px_rgba(6,182,212,0.4)]"
                        : uiOpacity < 80
                        ? "bg-blue-500/20 text-blue-300 border-blue-500/40"
                        : "bg-slate-800 text-slate-300 border-slate-700"
                    }`}
                  >
                    %{uiOpacity}
                  </span>
                </div>

                {/* Range Slider (0 to 100) */}
                <div className="relative py-1">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="1"
                    value={uiOpacity}
                    onChange={(e) => setUiOpacity(parseInt(e.target.value, 10))} // Sadece UI değişir, sahne renderlanmaz
                    onPointerUp={() => setXRayOpacity(uiOpacity)} // ZORUNLU: Fare/Parmağı çekince 3D model TEK SEFERDE güncellenir!
                    onTouchEnd={() => setXRayOpacity(uiOpacity)}
                    className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400 hover:accent-cyan-300 transition-all"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-1">
                    <span>%0 (Saydam)</span>
                    <span className="text-cyan-400/80 font-medium">Röntgen</span>
                    <span>%100 (Katı)</span>
                  </div>
                </div>

                {/* Micro Description */}
                <p className="text-[10.5px] text-slate-400 leading-relaxed mt-2 bg-slate-900/70 p-2 rounded-lg border border-slate-800">
                  💡 <strong className="text-cyan-300 font-medium">X-Ray Mantığı:</strong> Duvarlar (Mimari) ve Statik
                  şeffaflaşır; içindeki Mekanik borular ve Elektrik tavaları %100 opak parlayarak görünür hale gelir.
                </p>

                {/* Quick Presets */}
                <div className="grid grid-cols-4 gap-1.5 mt-2.5">
                  <button
                    type="button"
                    onClick={() => {
                      setUiOpacity(15)
                      setXRayOpacity(15)
                    }}
                    className={`py-1 px-1.5 rounded text-[10px] font-semibold transition-all text-center border ${
                      uiOpacity === 15
                        ? "bg-cyan-500/30 text-cyan-200 border-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.3)]"
                        : "bg-slate-850 hover:bg-slate-800 text-slate-400 border-slate-700"
                    }`}
                  >
                    💎 %15 Röntgen
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setUiOpacity(40)
                      setXRayOpacity(40)
                    }}
                    className={`py-1 px-1.5 rounded text-[10px] font-semibold transition-all text-center border ${
                      uiOpacity === 40
                        ? "bg-blue-500/30 text-blue-200 border-blue-400 shadow-[0_0_8px_rgba(59,130,246,0.3)]"
                        : "bg-slate-850 hover:bg-slate-800 text-slate-400 border-slate-700"
                    }`}
                  >
                    🌫️ %40 Yarı
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setUiOpacity(100)
                      setXRayOpacity(100)
                    }}
                    className={`py-1 px-1.5 rounded text-[10px] font-semibold transition-all text-center border ${
                      uiOpacity === 100
                        ? "bg-emerald-500/30 text-emerald-200 border-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.3)]"
                        : "bg-slate-850 hover:bg-slate-800 text-slate-400 border-slate-700"
                    }`}
                  >
                    🏢 %100 Katı
                  </button>
                  <button
                    type="button"
                    onClick={isolateMepLayers}
                    className="py-1 px-1.5 rounded text-[10px] font-semibold transition-all text-center bg-purple-500/20 hover:bg-purple-500/30 text-purple-200 border border-purple-500/40"
                    title="Statik ve Mimariyi gizle, sadece tesisatı göster"
                  >
                    ⚡ MEP Yalnız
                  </button>
                </div>
              </div>

              {/* --- ADIM 1: KATMAN (LAYER) FİLTRELEME CHECKBOX / TOGGLE BUTONLARI --- */}
              <div className="space-y-2">
                <div className="flex items-center justify-between px-1">
                  <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                    Disiplin Katmanları
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">
                    {Object.values(layerVisibility).filter(Boolean).length}/4 Açık
                  </span>
                </div>

                <div className="space-y-2">
                  {BIM_CATEGORIES.map((cat) => {
                    const isVisible = layerVisibility[cat.key]
                    const count = categoryCounts[cat.key]

                    return (
                      <div
                        key={cat.key}
                        className={`p-2.5 rounded-xl border transition-all duration-200 flex items-center justify-between ${
                          isVisible
                            ? `bg-slate-850/80 ${cat.borderActive} shadow-sm`
                            : "bg-slate-900/40 border-slate-800/80 opacity-60"
                        }`}
                      >
                        {/* Category Info */}
                        <div className="flex items-start gap-2.5 min-w-0 pr-2">
                          <span className="text-xl select-none mt-0.5">{cat.icon}</span>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span
                                className={`text-xs font-bold ${
                                  isVisible ? "text-white" : "text-slate-400"
                                } truncate`}
                              >
                                {cat.label}
                              </span>
                              {count > 0 && (
                                <span
                                  className={`text-[9.5px] px-1.5 py-0.2 rounded font-mono font-semibold border ${cat.badgeBg}`}
                                >
                                  {count} eleman
                                </span>
                              )}
                              {!cat.isStructuralOrArchitectural && (
                                <span className="text-[9px] px-1 rounded bg-cyan-950 text-cyan-300 border border-cyan-800/50 font-semibold">
                                  MEP
                                </span>
                              )}
                            </div>
                            <p className="text-[10.5px] text-slate-400 truncate mt-0.5">{cat.elementsDesc}</p>
                          </div>
                        </div>

                        {/* Interactive Toggle Switch */}
                        <button
                          type="button"
                          onClick={() => toggleCategory(cat.key)}
                          className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                            isVisible ? cat.activeBg : "bg-slate-700"
                          }`}
                          role="switch"
                          aria-checked={isVisible}
                          title={`${cat.label} Katmanını ${isVisible ? "Kapat" : "Aç"}`}
                        >
                          <span
                            aria-hidden="true"
                            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                              isVisible ? "translate-x-5" : "translate-x-0"
                            }`}
                          />
                        </button>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Panel Quick Actions Footer */}
              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => setAllLayers(true)}
                  className="flex-1 py-1.5 px-2 bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white rounded-lg text-[10.5px] font-semibold border border-slate-700/60 transition-colors"
                >
                  ✓ Tümünü Aç
                </button>
                <button
                  type="button"
                  onClick={() => setAllLayers(false)}
                  className="flex-1 py-1.5 px-2 bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white rounded-lg text-[10.5px] font-semibold border border-slate-700/60 transition-colors"
                >
                  ✕ Tümünü Gizle
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Main 3D Viewport */}
      {engineMode === "canvas" ? (
        <div className={`w-full ${isFullscreen ? "h-screen" : "h-full min-h-[650px]"} ${isSnaggingMode ? "cursor-crosshair" : "cursor-grab active:cursor-grabbing"} bg-slate-950`}>
          {/* Snagging Active Banner Hint */}
          {isSnaggingMode && (
            <div className="absolute top-16 left-1/2 -translate-x-1/2 z-40 bg-red-600/90 text-white px-4 py-1.5 rounded-full text-xs font-bold shadow-2xl backdrop-blur-md border border-red-400 flex items-center gap-2 animate-bounce pointer-events-none">
              <span>📍</span> Model üzerinde kusur noktasını seçmek için tıklayın!
            </div>
          )}
          <ModelErrorBoundary
            fallback={(err, reset) => (
              <div className={`w-full ${isFullscreen ? "h-screen" : "h-full min-h-[650px]"} flex flex-col items-center justify-center p-6 text-center bg-slate-900/90 backdrop-blur-md`}>
                <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mb-4">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                  </svg>
                </div>
                <h4 className="text-white font-semibold text-base mb-2">Model Formatı Uyarısı</h4>
                <p className="text-slate-400 text-xs max-w-md mb-5 leading-relaxed">
                  Seçili dosya GLTF/GLB olarak çözümlenemedi ({err.message.slice(0, 100)}). IFC dosyanızı IFC motorunda
                  açabilir veya örnek 3D yapıyı inceleyebilirsiniz.
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
              key={safeUrl || activeModelUrl}
              camera={{ far: 20000, near: 0.1, fov: 45, position: [35, 30, 35] }}
              gl={{ preserveDrawingBuffer: true, powerPreference: "high-performance", antialias: true }}
              onPointerDown={(e) => {
                pointerDownPosRef.current = { x: e.clientX, y: e.clientY }
              }}
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
                    {!safeUrl || safeUrl.trim() === "" ? null : isIfcUrlOrFile(activeModelUrl, fileName) ? (
                      <IfcCanvasModel
                        url={safeUrl}
                        layerVisibility={layerVisibility}
                        xRayOpacity={xRayOpacity}
                        onClick={handleModelClick}
                        onPointerDown={(e: any) => {
                          const x = e.clientX ?? (e.nativeEvent as any)?.clientX ?? 0
                          const y = e.clientY ?? (e.nativeEvent as any)?.clientY ?? 0
                          pointerDownPosRef.current = { x, y }
                        }}
                      />
                    ) : (
                      <GltfModel
                        url={safeUrl}
                        layerVisibility={layerVisibility}
                        xRayOpacity={xRayOpacity}
                        onElementCounts={(counts) => setCategoryCounts(counts)}
                        onClick={handleModelClick}
                        onPointerDown={(e: any) => {
                          const x = e.clientX ?? (e.nativeEvent as any)?.clientX ?? 0
                          const y = e.clientY ?? (e.nativeEvent as any)?.clientY ?? 0
                          pointerDownPosRef.current = { x, y }
                        }}
                      />
                    )}
                  </Center>

                  {/* 3D Lazer Metre (Interactive Measurement) Line & Html Distance Badge */}
                  {measurePoints.length === 1 && (
                    <group>
                      <mesh position={[measurePoints[0].x, measurePoints[0].y, measurePoints[0].z]}>
                        <sphereGeometry args={[0.25, 16, 16]} />
                        <meshStandardMaterial color="#06b6d4" emissive="#06b6d4" emissiveIntensity={0.8} />
                      </mesh>
                      <Html position={[measurePoints[0].x, measurePoints[0].y + 0.4, measurePoints[0].z]} center distanceFactor={15}>
                        <div className="bg-cyan-950/90 text-cyan-300 text-[10px] px-2 py-0.5 rounded-full border border-cyan-500/50 shadow-lg font-mono whitespace-nowrap">
                          Nokta A (B noktasını seçin)
                        </div>
                      </Html>
                    </group>
                  )}

                  {measurePoints.length >= 2 && (
                    <group>
                      {/* Point A Marker */}
                      <mesh position={[measurePoints[0].x, measurePoints[0].y, measurePoints[0].z]}>
                        <sphereGeometry args={[0.25, 16, 16]} />
                        <meshStandardMaterial color="#06b6d4" emissive="#06b6d4" emissiveIntensity={0.9} />
                      </mesh>

                      {/* Point B Marker */}
                      <mesh position={[measurePoints[1].x, measurePoints[1].y, measurePoints[1].z]}>
                        <sphereGeometry args={[0.25, 16, 16]} />
                        <meshStandardMaterial color="#facc15" emissive="#facc15" emissiveIntensity={0.9} />
                      </mesh>

                      {/* Neon Laser Line between Points */}
                      <Line
                        points={[
                          [measurePoints[0].x, measurePoints[0].y, measurePoints[0].z],
                          [measurePoints[1].x, measurePoints[1].y, measurePoints[1].z],
                        ]}
                        color="#06b6d4"
                        lineWidth={3}
                      />

                      {/* Distance Label placed exactly at midpoint (lerp 0.5) */}
                      <Html
                        position={[
                          (measurePoints[0].x + measurePoints[1].x) / 2,
                          (measurePoints[0].y + measurePoints[1].y) / 2 + 0.35,
                          (measurePoints[0].z + measurePoints[1].z) / 2,
                        ]}
                        center
                        distanceFactor={15}
                      >
                        <div className="bg-slate-900/95 backdrop-blur-md px-3 py-1.5 rounded-xl border border-cyan-400 shadow-[0_0_25px_rgba(6,182,212,0.7)] text-white text-xs font-bold whitespace-nowrap flex items-center gap-1.5 animate-in fade-in zoom-in-95 pointer-events-none">
                          <span className="text-cyan-400">📏</span>
                          <span>
                            {(measurePoints[0].distanceTo(measurePoints[1])).toFixed(2)} m (
                            {Math.round(measurePoints[0].distanceTo(measurePoints[1]) * 100)} cm)
                          </span>
                        </div>
                      </Html>
                    </group>
                  )}

                  {/* Pin Markers on 3D Model with Subcontractor & Payment Block Badge */}
                  {pins.map((pin) => (
                    <mesh key={pin.id} position={[pin.positionX, pin.positionY, pin.positionZ]}>
                      <sphereGeometry args={[0.3, 16, 16]} />
                      <meshStandardMaterial color="#ef4444" emissive="#ef4444" emissiveIntensity={0.6} />
                      <Html distanceFactor={15}>
                        <div className="bg-slate-900/95 backdrop-blur-md text-white text-[10px] px-2.5 py-1 rounded-xl shadow-2xl border border-red-500/50 pointer-events-none whitespace-nowrap font-bold flex items-center gap-1.5">
                          <span className="text-red-400 animate-pulse">📍</span>
                          <span>{pin.title}</span>
                          {pin.subcontractorName && (
                            <span className="bg-slate-800 px-1.5 py-0.5 rounded text-amber-300 font-medium border border-slate-700">
                              👷 {pin.subcontractorName}
                            </span>
                          )}
                          {pin.blockPayment && (
                            <span className="bg-red-500/20 text-red-300 border border-red-500/40 px-1.5 py-0.5 rounded text-[9px] font-bold">
                              🔒 Hakediş Blokeli
                            </span>
                          )}
                        </div>
                      </Html>
                    </mesh>
                  ))}
                  {selectedPinPosition && (
                    <mesh position={[selectedPinPosition.x, selectedPinPosition.y, selectedPinPosition.z]}>
                      <sphereGeometry args={[0.35, 16, 16]} />
                      <meshStandardMaterial color="#f59e0b" emissive="#f59e0b" emissiveIntensity={0.8} />
                    </mesh>
                  )}
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
        <div className={`relative w-full ${isFullscreen ? "h-screen" : "h-full min-h-[650px]"}`}>
          {/* Web-IFC Viewer Container */}
          <div ref={ifcContainerRef} className={`w-full ${isFullscreen ? "h-screen" : "h-full min-h-[650px]"} bg-slate-950`} />

          {ifcLoading && (
            <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm flex flex-col items-center justify-center z-30">
              <div className="w-12 h-12 border-4 border-purple-500/20 border-t-purple-400 rounded-full animate-spin mb-3" />
              <p className="text-purple-300 font-semibold text-sm">IFC Modeli ve Geometri Çözümleniyor...</p>
              <p className="text-slate-400 text-xs mt-1">Mimari, Statik ve MEP katmanları taranıyor</p>
            </div>
          )}

          {ifcError && (
            <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center z-30">
              <div className="w-12 h-12 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 mb-3">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
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

      {/* Floating Bottom Toolbar (Snagging, Measurement & AR Buttons) */}
      <div className="absolute bottom-4 left-4 right-20 sm:left-auto sm:right-20 z-30 flex items-center justify-center sm:justify-end gap-2">
        {/* Snagging Toggle */}
        <button
          type="button"
          onClick={() => {
            setIsSnaggingMode(!isSnaggingMode)
            setIsMeasureMode(false)
          }}
          className={`px-3 py-2 rounded-xl text-xs font-semibold shadow-lg border transition-all flex items-center gap-1.5 backdrop-blur-md ${
            isSnaggingMode
              ? "bg-red-600/90 text-white border-red-500/50 shadow-red-500/20"
              : "bg-slate-900/90 text-slate-300 hover:text-white border-slate-700/80 hover:bg-slate-800"
          }`}
        >
          <span>📍 {isSnaggingMode ? "Kusur Modu Açık" : "Kusur İşaretle"}</span>
        </button>

        {/* Measurement Toggle */}
        <button
          type="button"
          onClick={() => {
            const nextMode = !isMeasureMode
            setIsMeasureMode(nextMode)
            setIsSnaggingMode(false)
            if (nextMode) {
              setMeasurePoints([])
              setMeasuredDistance(null)
              setSelectedElementMetrics(null)
            }
          }}
          className={`px-3 py-2 rounded-xl text-xs font-semibold shadow-lg border transition-all flex items-center gap-1.5 backdrop-blur-md ${
            isMeasureMode
              ? "bg-cyan-600/90 text-white border-cyan-400/60 shadow-[0_0_15px_rgba(6,182,212,0.5)]"
              : "bg-slate-900/90 text-slate-300 hover:text-white border-slate-700/80 hover:bg-slate-800"
          }`}
        >
          <span>📏 {isMeasureMode ? "Ölçüm Modu Açık" : "Ölçüm Yap"}</span>
        </button>

        {/* AR Button */}
        {projectId && (
          <button
            type="button"
            onClick={() => {
              let currentModel = activeModelUrl || effectiveUrl || bimUrl || url || ifcUrl || ""
              if (currentModel.startsWith("blob:")) {
                currentModel = effectiveUrl && !effectiveUrl.startsWith("blob:")
                  ? effectiveUrl
                  : (bimUrl && !bimUrl.startsWith("blob:") ? bimUrl : "/models/bina.glb")
              }
              const targetUrl = currentModel
                ? `/ar/${projectId}?url=${encodeURIComponent(currentModel)}`
                : `/ar/${projectId}`
              window.location.href = targetUrl
            }}
            className="px-3.5 py-2 bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white rounded-xl text-xs font-bold shadow-[0_0_20px_rgba(6,182,212,0.6)] border border-cyan-300/40 transition-all flex items-center gap-1.5 transform hover:scale-105 active:scale-95"
          >
            <span className="w-2 h-2 rounded-full bg-cyan-300 animate-ping" />
            <span>📱 AR Sahada Gör</span>
          </button>
        )}
      </div>

      {/* 2D Measurement & Element Quantity Metric Card (Left Bottom) */}
      {isMeasureMode && (
        <div className="absolute bottom-16 sm:bottom-4 left-3 sm:left-4 z-40 w-[calc(100%-24px)] sm:w-80 bg-slate-900/95 backdrop-blur-xl border border-cyan-500/40 rounded-2xl p-3.5 shadow-2xl shadow-cyan-950/60 space-y-2.5 animate-in slide-in-from-bottom duration-200">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center text-xs font-bold border border-cyan-500/30">
                📏
              </div>
              <div>
                <h4 className="text-xs font-bold text-white leading-tight">3D Lazer Metre</h4>
                <p className="text-[10px] text-cyan-300">
                  {measurePoints.length === 0
                    ? "1. Başlangıç (A) noktasını seçin"
                    : measurePoints.length === 1
                    ? "2. Bitiş (B) noktasını seçin"
                    : "Mesafe hesaplandı"}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                setMeasurePoints([])
                setMeasuredDistance(null)
                setSelectedElementMetrics(null)
              }}
              className="text-[11px] px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg border border-slate-700 transition font-medium"
            >
              Ölçümü Sıfırla
            </button>
          </div>

          {measuredDistance !== null && (
            <div className="bg-cyan-950/70 border border-cyan-500/30 rounded-xl p-2.5 flex items-center justify-between shadow-inner">
              <span className="text-xs text-slate-300 font-medium">Lazer Mesafe:</span>
              <span className="text-sm font-extrabold text-cyan-300 font-mono">
                {measuredDistance.toFixed(2)} m ({Math.round(measuredDistance * 100)} cm)
              </span>
            </div>
          )}

          {selectedElementMetrics && (
            <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-2.5 space-y-2 text-xs">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-400">Seçilen Eleman:</span>
                <span className="text-white font-semibold truncate max-w-[150px]">{selectedElementMetrics.name}</span>
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-400">Disiplin:</span>
                <span className="text-cyan-400 font-medium">{selectedElementMetrics.category}</span>
              </div>
              <div className="grid grid-cols-3 gap-1 pt-1 border-t border-slate-800/80 text-center text-[10px]">
                <div className="bg-slate-900/90 p-1 rounded-lg border border-slate-800">
                  <span className="text-slate-400 block text-[9px]">En (X)</span>
                  <span className="text-white font-mono font-bold">{selectedElementMetrics.width}</span>
                </div>
                <div className="bg-slate-900/90 p-1 rounded-lg border border-slate-800">
                  <span className="text-slate-400 block text-[9px]">Boy (Y)</span>
                  <span className="text-white font-mono font-bold">{selectedElementMetrics.height}</span>
                </div>
                <div className="bg-slate-900/90 p-1 rounded-lg border border-slate-800">
                  <span className="text-slate-400 block text-[9px]">Derinlik (Z)</span>
                  <span className="text-white font-mono font-bold">{selectedElementMetrics.depth}</span>
                </div>
              </div>
              <div className="flex items-center justify-between pt-1 border-t border-slate-800/80 text-[11px]">
                <span className="text-slate-400">Yaklaşık Hacim:</span>
                <span className="text-amber-400 font-mono font-bold">{selectedElementMetrics.volume}</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Floating Instructions Banner */}
      <div className={`absolute bottom-4 left-4 z-30 bg-slate-900/90 backdrop-blur-md rounded-xl border border-slate-700/80 px-3.5 py-2 shadow-xl ${isMeasureMode ? "hidden" : "hidden sm:flex"} items-center gap-2 text-xs text-slate-300`}>
        <span className="text-cyan-400">💡</span>
        <span>
          Döndürmek için <strong>sol tıkla sürükleyin</strong>, yakınlaşmak için <strong>tekerleği kaydırın</strong>.
          X-Ray ile duvarın arkasındaki tesisatı keşfedin.
        </span>
      </div>

      {/* Issue Form Modal for Snagging with Subcontractor & Payment Block Integration */}
      {showIssueForm && (
        <div className="absolute inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700/80 rounded-2xl p-5 sm:p-6 w-full max-w-md shadow-2xl space-y-4 my-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <span className="text-lg">📍</span>
                <h3 className="text-sm sm:text-base font-bold text-white">3D Model Üzerinde Kusur Bildirimi</h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  restorePreviousHighlight()
                  setShowIssueForm(false)
                  setSelectedPinPosition(null)
                }}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Kusur Başlığı</label>
                <input
                  type="text"
                  value={issueForm.title}
                  onChange={(e) => setIssueForm({ ...issueForm, title: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs sm:text-sm focus:outline-none focus:border-cyan-500"
                  placeholder="Örn: [Statik Eleman] - Kolon Kusuru"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Açıklama</label>
                <textarea
                  rows={2}
                  value={issueForm.description}
                  onChange={(e) => setIssueForm({ ...issueForm, description: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs sm:text-sm focus:outline-none focus:border-cyan-500 resize-none"
                  placeholder="Tespit edilen kusur veya çakışma detayı..."
                />
              </div>

              {/* Sorumlu Taşeron Seçimi */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Sorumlu Taşeron</label>
                <select
                  value={issueForm.subcontractorName}
                  onChange={(e) => setIssueForm({ ...issueForm, subcontractorName: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs sm:text-sm focus:outline-none focus:border-cyan-500"
                >
                  <option value="Kaba Yapı & Betonarme Taşeronu">Kaba Yapı & Betonarme Taşeronu</option>
                  <option value="İnce İşler & Duvar Taşeronu">İnce İşler & Duvar Taşeronu</option>
                  <option value="Mekanik Tesisat Taşeronu">Mekanik Tesisat Taşeronu</option>
                  <option value="Elektrik Taşeronu">Elektrik Taşeronu</option>
                  <option value="Çelik Konstrüksiyon & Çatı Taşeronu">Çelik Konstrüksiyon & Çatı Taşeronu</option>
                  <option value="Yalıtım & Cephe Taşeronu">Yalıtım & Cephe Taşeronu</option>
                  <option value="Diğer Saha Ekibi">Diğer Saha Ekibi</option>
                </select>
              </div>

              {/* Hakediş Blokesi Toggle */}
              <div className="bg-red-950/40 border border-red-500/30 rounded-xl p-3 flex items-start gap-2.5">
                <input
                  type="checkbox"
                  id="blockPayment"
                  checked={issueForm.blockPayment}
                  onChange={(e) => setIssueForm({ ...issueForm, blockPayment: e.target.checked })}
                  className="mt-0.5 w-4 h-4 rounded border-slate-700 text-red-600 focus:ring-red-500 accent-red-600 cursor-pointer"
                />
                <label htmlFor="blockPayment" className="text-xs text-red-200 cursor-pointer leading-tight">
                  <span className="font-bold block">⚠️ Taşeron Hakedişini Bloke Et</span>
                  <span className="text-[11px] text-red-300/80 block mt-0.5">Bu kusur giderilip onaylanana kadar ilgili taşeronun hakediş ödemesini durdur.</span>
                </label>
              </div>

              {/* Kesinti / Ceza Bedeli */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Tahmini Kesinti / Ceza Tutarı (₺) <span className="text-slate-500 font-normal">(Opsiyonel)</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-xs text-slate-400">₺</span>
                  <input
                    type="number"
                    value={issueForm.penaltyAmount}
                    onChange={(e) => setIssueForm({ ...issueForm, penaltyAmount: e.target.value })}
                    className="w-full pl-7 pr-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs sm:text-sm focus:outline-none focus:border-cyan-500 font-mono"
                    placeholder="Örn: 25000"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Fotoğraf Ekle</label>
                <UploadButton
                  endpoint="dailyReportImage"
                  onClientUploadComplete={(res) => {
                    if (res && res.length > 0) {
                      setIssueForm({ ...issueForm, imageUrl: res[0].url })
                    }
                  }}
                  onUploadError={(err) => {
                    toast.error(`Yükleme hatası: ${err.message}`, {
                      style: {
                        background: "#0f172a",
                        color: "#f8fafc",
                        border: "1px solid rgba(239, 68, 68, 0.4)",
                        borderRadius: "12px",
                      },
                      iconTheme: { primary: "#ef4444", secondary: "#0f172a" },
                    })
                  }}
                />
              </div>

              <div className="flex gap-2.5 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    restorePreviousHighlight()
                    setShowIssueForm(false)
                    setSelectedPinPosition(null)
                  }}
                  className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition"
                >
                  İptal
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    if (!selectedPinPosition || !projectId) return
                    try {
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
                          subcontractorName: issueForm.subcontractorName,
                          severity: issueForm.severity,
                          blockPayment: issueForm.blockPayment,
                          penaltyAmount: issueForm.penaltyAmount,
                        }),
                      })
                      if (res.ok) {
                        const newIssue = await res.json()
                        setPins((prev) => [...prev, newIssue])
                        setShowIssueForm(false)
                        setSelectedPinPosition(null)
                        setIssueForm({
                          title: "",
                          description: "",
                          imageUrl: "",
                          subcontractorName: "Kaba Yapı & Betonarme Taşeronu",
                          severity: "CRITICAL",
                          blockPayment: true,
                          penaltyAmount: "",
                        })
                        toast.success("Kusur başarıyla 3D modele işlendi!", {
                          style: {
                            background: "#0f172a",
                            color: "#f8fafc",
                            border: "1px solid rgba(6, 182, 212, 0.4)",
                            borderRadius: "12px",
                            boxShadow: "0 10px 30px rgba(6, 182, 212, 0.2)",
                          },
                          iconTheme: { primary: "#06b6d4", secondary: "#0f172a" },
                        })
                      } else {
                        toast.error("Kusur kaydedilirken bir hata oluştu.", {
                          style: {
                            background: "#0f172a",
                            color: "#f8fafc",
                            border: "1px solid rgba(239, 68, 68, 0.4)",
                            borderRadius: "12px",
                          },
                          iconTheme: { primary: "#ef4444", secondary: "#0f172a" },
                        })
                      }
                    } catch (err: any) {
                      toast.error(`Kayıt hatası: ${err.message}`, {
                        style: {
                          background: "#0f172a",
                          color: "#f8fafc",
                          border: "1px solid rgba(239, 68, 68, 0.4)",
                          borderRadius: "12px",
                        },
                        iconTheme: { primary: "#ef4444", secondary: "#0f172a" },
                      })
                    }
                  }}
                  disabled={!issueForm.title}
                  className="flex-1 py-2.5 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-lg transition"
                >
                  Kusuru Kaydet
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
    </BimViewerErrorBoundary>
  )
}
