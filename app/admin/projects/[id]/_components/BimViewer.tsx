"use client"
/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * High-Performance Dual-Engine 3D BIM Viewer (React Three Fiber + Web-IFC Engine)
 * Features: X-Ray (Röntgen) Mode, Multi-Discipline Layer Filtering, Snagging, AR
 */

import React, { useEffect, useRef, useState, Suspense, Component, type ReactNode } from "react"
import { Canvas, useLoader } from "@react-three/fiber"
import { OrbitControls, useGLTF, Environment, Center, Bounds, Html, useProgress, Grid } from "@react-three/drei"
import { IfcViewerAPI } from "web-ifc-viewer"
import { IFCLoader } from "web-ifc-three/IFCLoader"
import * as THREE from "three"
import * as WebIFC from "web-ifc"
import { UploadButton } from "@/lib/uploadthing"

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
}: {
  url: string
  layerVisibility: Record<BimCategoryKey, boolean>
  xRayOpacity: number
  onElementCounts?: (counts: Record<BimCategoryKey, number>) => void
}) {
  const { scene } = useGLTF(url)

  useEffect(() => {
    if (!scene) return

    const counts: Record<BimCategoryKey, number> = { statik: 0, mimari: 0, elektrik: 0, mekanik: 0 }

    scene.traverse((child: any) => {
      if (child.isMesh) {
        child.castShadow = true
        child.receiveShadow = true

        const catKey = identifyCategory(child)
        counts[catKey] = (counts[catKey] || 0) + 1

        // 1. Layer Visibility Toggle
        child.visible = layerVisibility[catKey] ?? true

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
            const alpha = xRayOpacity / 100
            child.material.transparent = alpha < 0.99
            child.material.opacity = Math.max(0.04, alpha)
            child.material.depthWrite = alpha > 0.4
          } else {
            // MEP (Elektrik & Mekanik): Always 100% opaque!
            child.material.transparent = false
            child.material.opacity = 1.0
            child.material.depthWrite = true

            // Glowing emissive effect when X-Ray is turned on so pipes shine through walls!
            if (xRayOpacity < 70) {
              const glowColor = catKey === "elektrik" ? new THREE.Color(0xfacc15) : new THREE.Color(0x06b6d4)
              child.material.emissive = glowColor
              child.material.emissiveIntensity = 0.4
            } else {
              child.material.emissive = new THREE.Color(0x000000)
              child.material.emissiveIntensity = 0
            }
          }

          child.material.needsUpdate = true
        }
      }
    })

    if (onElementCounts) {
      onElementCounts(counts)
    }
  }, [scene, layerVisibility, xRayOpacity, onElementCounts])

  useEffect(() => {
    return () => {
      useGLTF.clear(url)
    }
  }, [url])

  return <primitive object={scene} />
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
}: {
  url: string
  layerVisibility: Record<BimCategoryKey, boolean>
  xRayOpacity: number
}) {
  // BU SATIR KRİTİKTİR, WASM OLMADAN TARAYICI IFC OKUYAMAZ VE SESSİZCE ÇÖKER:
  // WASM local /wasm/ klasöründen okunur (CORS sorunu yok, CDN bağımlılığı yok)
  const ifcModel = useLoader(IFCLoader, url, (loader: any) => {
    const wasmPath = "/wasm/" // public/wasm/ klasöründen local olarak okunur
    loader.setWasmPath(wasmPath)
    if (loader.ifcManager?.setWasmPath) {
      loader.ifcManager.setWasmPath(wasmPath)
    }
    if (loader.ifcManager?.state?.api?.SetWasmPath) {
      loader.ifcManager.state.api.SetWasmPath(wasmPath)
    }
  }) as any

  useEffect(() => {
    if (ifcModel) {
      ifcModel.traverse((child: any) => {
        if (child.isMesh && child.material) {
          child.castShadow = true
          child.receiveShadow = true

          const catKey = identifyCategory(child)
          child.visible = layerVisibility[catKey] ?? true

          const alpha = xRayOpacity / 100
          const isArchOrStructural = catKey === "statik" || catKey === "mimari"

          const applyMat = (mat: any) => {
            if (isArchOrStructural) {
              mat.transparent = alpha < 0.99
              mat.opacity = Math.max(0.04, alpha)
              mat.depthWrite = alpha > 0.4
            } else {
              mat.transparent = false
              mat.opacity = 1.0
              mat.depthWrite = true
              if (xRayOpacity < 70) {
                mat.emissive = new THREE.Color(catKey === "elektrik" ? 0xfacc15 : 0x06b6d4)
                mat.emissiveIntensity = 0.4
              } else {
                mat.emissive = new THREE.Color(0x000000)
                mat.emissiveIntensity = 0
              }
            }
            mat.needsUpdate = true
          }

          if (Array.isArray(child.material)) {
            child.material.forEach(applyMat)
          } else {
            applyMat(child.material)
          }
        }
      })
    }
  }, [ifcModel, layerVisibility, xRayOpacity])

  return <primitive object={ifcModel as any} />
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

  // --- X-RAY & LAYER FILTERING STATES ---
  const [xRayOpacity, setXRayOpacity] = useState(100) // 0 to 100 range slider
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

  // Snagging (Kusur İşaretleme) states
  const [isSnaggingMode, setIsSnaggingMode] = useState(false)
  const [showIssueForm, setShowIssueForm] = useState(false)
  const [selectedPinPosition, setSelectedPinPosition] = useState<THREE.Vector3 | null>(null)
  const [issueForm, setIssueForm] = useState({ title: "", description: "", imageUrl: "" })
  const [, setPins] = useState<any[]>([])

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

  // Update IFC Subsets / Meshes for Visibility and Opacity
  const applyIfcSubsetsState = (
    subsets: Record<string, any>,
    visibility: Record<BimCategoryKey, boolean>,
    opacityValue: number
  ) => {
    const scene = ifcViewerRef.current?.context?.getScene()

    BIM_CATEGORIES.forEach((cat) => {
      const subset = subsets[cat.key]
      if (!subset) return

      const isVisible = visibility[cat.key] ?? true
      subset.visible = isVisible

      if (subset.material) {
        if (cat.isStructuralOrArchitectural) {
          // Drop opacity for Statik & Mimari
          const alpha = opacityValue / 100
          subset.material.transparent = alpha < 0.99
          subset.material.opacity = Math.max(0.04, alpha)
          subset.material.depthWrite = alpha > 0.4
          subset.material.needsUpdate = true
        } else {
          // MEP (Elektrik & Mekanik): Always 100% opaque!
          subset.material.transparent = false
          subset.material.opacity = 1.0
          subset.material.depthWrite = true

          // Emissive glow highlight when X-Ray is active
          if (opacityValue < 70) {
            subset.material.emissive = new THREE.Color(cat.color)
            subset.material.emissiveIntensity = 0.5
          } else {
            subset.material.emissive = new THREE.Color(0x000000)
            subset.material.emissiveIntensity = 0
          }
          subset.material.needsUpdate = true
        }
      }
    })

    // Other / remainder subset
    const otherSubset = subsets["other"]
    if (otherSubset && otherSubset.material) {
      const alpha = opacityValue / 100
      otherSubset.material.transparent = alpha < 0.99
      otherSubset.material.opacity = Math.max(0.04, alpha)
      otherSubset.material.needsUpdate = true
    }

    // Fallback: If no subsets exist, directly apply to composite model
    if (Object.keys(subsets).length === 0 && scene) {
      scene.traverse((child: any) => {
        if (child.isMesh && child.material) {
          const alpha = opacityValue / 100
          child.material.transparent = alpha < 0.99
          child.material.opacity = Math.max(0.05, alpha)
          child.material.needsUpdate = true
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
          await viewer.IFC.setWasmPath("https://unpkg.com/web-ifc@0.0.36/")
        } catch (wasmErr) {
          console.warn("WASM 0.0.36 path error, trying fallback:", wasmErr)
          try {
            await viewer.IFC.setWasmPath("https://unpkg.com/web-ifc@0.0.77/")
          } catch {
            await viewer.IFC.setWasmPath("/")
          }
        }

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

          loadedIfcModelRef.current = loadedModel

          // Fit camera to model
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
      if (viewer) {
        try {
          viewer.dispose()
        } catch (e) {
          console.warn("IFC dispose:", e)
        }
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
    setXRayOpacity(100)
  }

  return (
    <BimViewerErrorBoundary>
    <div className="relative w-full h-full min-h-[650px] bg-slate-950 rounded-2xl overflow-hidden select-none border border-slate-800 shadow-2xl">
      {/* Top Left: Engine Switcher & Auto Rotate Toolbar */}
      <div className="absolute top-4 left-4 z-40 flex items-center gap-2 bg-slate-900/90 backdrop-blur-md p-1.5 rounded-xl border border-slate-700/80 shadow-2xl">
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
      <div className="absolute top-4 right-4 z-40 flex flex-col items-end">
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
              %{xRayOpacity}
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
                      xRayOpacity < 30
                        ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/50 shadow-[0_0_10px_rgba(6,182,212,0.4)]"
                        : xRayOpacity < 80
                        ? "bg-blue-500/20 text-blue-300 border-blue-500/40"
                        : "bg-slate-800 text-slate-300 border-slate-700"
                    }`}
                  >
                    %{xRayOpacity}
                  </span>
                </div>

                {/* Range Slider (0 to 100) */}
                <div className="relative py-1">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="1"
                    value={xRayOpacity}
                    onChange={(e) => setXRayOpacity(parseInt(e.target.value, 10))}
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
                    onClick={() => setXRayOpacity(15)}
                    className={`py-1 px-1.5 rounded text-[10px] font-semibold transition-all text-center border ${
                      xRayOpacity === 15
                        ? "bg-cyan-500/30 text-cyan-200 border-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.3)]"
                        : "bg-slate-850 hover:bg-slate-800 text-slate-400 border-slate-700"
                    }`}
                  >
                    💎 %15 Röntgen
                  </button>
                  <button
                    type="button"
                    onClick={() => setXRayOpacity(40)}
                    className={`py-1 px-1.5 rounded text-[10px] font-semibold transition-all text-center border ${
                      xRayOpacity === 40
                        ? "bg-blue-500/30 text-blue-200 border-blue-400 shadow-[0_0_8px_rgba(59,130,246,0.3)]"
                        : "bg-slate-850 hover:bg-slate-800 text-slate-400 border-slate-700"
                    }`}
                  >
                    🌫️ %40 Yarı
                  </button>
                  <button
                    type="button"
                    onClick={() => setXRayOpacity(100)}
                    className={`py-1 px-1.5 rounded text-[10px] font-semibold transition-all text-center border ${
                      xRayOpacity === 100
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
        <div className="w-full h-full min-h-[650px] cursor-grab active:cursor-grabbing bg-slate-950">
          <ModelErrorBoundary
            fallback={(err, reset) => (
              <div className="w-full h-full min-h-[650px] flex flex-col items-center justify-center p-6 text-center bg-slate-900/90 backdrop-blur-md">
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
                    {isIfcUrlOrFile(activeModelUrl, fileName) ? (
                      <IfcCanvasModel
                        url={activeModelUrl}
                        layerVisibility={layerVisibility}
                        xRayOpacity={xRayOpacity}
                      />
                    ) : (
                      <GltfModel
                        url={activeModelUrl}
                        layerVisibility={layerVisibility}
                        xRayOpacity={xRayOpacity}
                        onElementCounts={(counts) => setCategoryCounts(counts)}
                      />
                    )}
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
        <div className="relative w-full h-full min-h-[650px]">
          {/* Web-IFC Viewer Container */}
          <div ref={ifcContainerRef} className="w-full h-full min-h-[650px] bg-slate-950" />

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

      {/* Floating Bottom Toolbar (Snagging & AR Buttons) */}
      <div className="absolute bottom-4 right-4 z-40 flex items-center gap-2.5">
        {/* Snagging Toggle */}
        <button
          type="button"
          onClick={() => setIsSnaggingMode(!isSnaggingMode)}
          className={`px-3 py-2 rounded-xl text-xs font-semibold shadow-lg border transition-all flex items-center gap-1.5 backdrop-blur-md ${
            isSnaggingMode
              ? "bg-red-600/90 text-white border-red-500/50 shadow-red-500/20"
              : "bg-slate-900/90 text-slate-300 hover:text-white border-slate-700/80 hover:bg-slate-800"
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
            className="px-3.5 py-2 bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white rounded-xl text-xs font-bold shadow-[0_0_20px_rgba(6,182,212,0.6)] border border-cyan-300/40 transition-all flex items-center gap-1.5 transform hover:scale-105 active:scale-95"
          >
            <span className="w-2 h-2 rounded-full bg-cyan-300 animate-ping" />
            <span>📱 AR Sahada Gör</span>
          </button>
        )}
      </div>

      {/* Floating Instructions Banner */}
      <div className="absolute bottom-4 left-4 z-40 bg-slate-900/90 backdrop-blur-md rounded-xl border border-slate-700/80 px-3.5 py-2 shadow-xl hidden sm:flex items-center gap-2 text-xs text-slate-300">
        <span className="text-cyan-400">💡</span>
        <span>
          Döndürmek için <strong>sol tıkla sürükleyin</strong>, yakınlaşmak için <strong>tekerleği kaydırın</strong>.
          X-Ray ile duvarın arkasındaki tesisatı keşfedin.
        </span>
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
                  placeholder="Örn: 2. Kat Döşeme Çatlağı / Mekanik Boru Çakışması"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Açıklama</label>
                <textarea
                  rows={3}
                  value={issueForm.description}
                  onChange={(e) => setIssueForm({ ...issueForm, description: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-cyan-500 resize-none"
                  placeholder="Tespit edilen kusur veya çakışma detayı..."
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
    </BimViewerErrorBoundary>
  )
}
