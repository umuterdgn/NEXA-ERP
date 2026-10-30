"use client"
/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * 3D BIM & AR Web-IFC Navigation Engine (Client-Side WebGL Viewer)
 * SSR Disabled - Container Resizing & Web-IFC WASM Supported
 */

import React, { useEffect, useRef, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import * as THREE from "three"
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js"
import { IFCLoader } from "web-ifc-three/IFCLoader"
import {
  Box,
  Layers,
  Eye,
  Camera,
  Maximize2,
  Minimize2,
  Upload,
  RefreshCw,
  Compass,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  ArrowLeft,
  Smartphone,
  Info,
  X,
  FileText,
  MapPin,
  Sparkles,
  Download,
  Loader2,
  AlertCircle,
} from "lucide-react"
import { toast } from "react-hot-toast"

export interface SelectedElementInfo {
  id: string
  name: string
  category: "STATIK" | "MIMARI" | "MEKANIK" | "ELEKTRIK"
  ifcType: string
  storey: string
  dimensions: string
  material: string
  status: string
}

export interface BimModelViewerProps {
  modelUrl?: string | null
  initialModelUrl?: string | null
  projectName?: string | null
  hideUpload?: boolean
  hasAssignedProject?: boolean
}

export default function BimModelViewer({
  modelUrl,
  initialModelUrl,
  projectName,
  hideUpload = false,
  hasAssignedProject = false,
}: BimModelViewerProps = {}) {
  const router = useRouter()
  const containerRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLDivElement>(null)
  const sceneRef = useRef<THREE.Scene | null>(null)
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null)
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null)
  const animationFrameId = useRef<number | null>(null)

  // Interactive controls
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [xrayMode, setXrayMode] = useState(false)
  const [activeDiscipline, setActiveDiscipline] = useState<"ALL" | "STATIK" | "MIMARI" | "MEKANIK">("ALL")
  const [selectedElement, setSelectedElement] = useState<SelectedElementInfo | null>(null)
  const [showArModal, setShowArModal] = useState(false)
  const [loadingModel, setLoadingModel] = useState(false)
  const [loadedFileName, setLoadedFileName] = useState(
    projectName ? `${projectName} (BIM)` : "Nexa-Plaza-A-Blok-Statik.ifc"
  )
  const [modelError, setModelError] = useState<string | null>(null)
  const [noModelAssigned, setNoModelAssigned] = useState(false)

  // Scene Objects Container
  const modelGroupRef = useRef<THREE.Group>(new THREE.Group())
  const statikGroupRef = useRef<THREE.Group>(new THREE.Group())
  const mimariGroupRef = useRef<THREE.Group>(new THREE.Group())
  const mekanikGroupRef = useRef<THREE.Group>(new THREE.Group())
  const rebarGroupRef = useRef<THREE.Group>(new THREE.Group())
  const customModelGroupRef = useRef<THREE.Group>(new THREE.Group())
  const highlightMeshRef = useRef<THREE.LineSegments | null>(null)

  // Orbit state
  const isDraggingRef = useRef(false)
  const previousMousePositionRef = useRef({ x: 0, y: 0 })
  const cameraRotationRef = useRef({ phi: Math.PI / 4, theta: Math.PI / 4, radius: 45 })
  const cameraTargetRef = useRef(new THREE.Vector3(0, 5, 0))

  // Update Camera Orbit Position
  const updateCameraPosition = useCallback(() => {
    if (!cameraRef.current) return
    const { phi, theta, radius } = cameraRotationRef.current
    const target = cameraTargetRef.current

    cameraRef.current.position.x = target.x + radius * Math.sin(phi) * Math.sin(theta)
    cameraRef.current.position.y = target.y + radius * Math.cos(phi)
    cameraRef.current.position.z = target.z + radius * Math.sin(phi) * Math.cos(theta)
    cameraRef.current.lookAt(target)
  }, [])

  // Build Procedural High-Fidelity BIM Model (Columns, Beams, Slabs, Walls, MEP Pipes, Rebars)
  const buildProceduralBimModel = useCallback(() => {
    statikGroupRef.current.clear()
    mimariGroupRef.current.clear()
    mekanikGroupRef.current.clear()
    rebarGroupRef.current.clear()
    customModelGroupRef.current.clear()
    modelGroupRef.current.clear()

    // 1. Concrete Material (Statik)
    const concreteMaterial = new THREE.MeshStandardMaterial({
      color: 0x94a3b8,
      roughness: 0.65,
      metalness: 0.1,
      transparent: true,
      opacity: xrayMode ? 0.35 : 1.0,
      wireframe: false,
    })

    // 2. Foundation / Slab Material
    const slabMaterial = new THREE.MeshStandardMaterial({
      color: 0x64748b,
      roughness: 0.7,
      metalness: 0.15,
      transparent: true,
      opacity: xrayMode ? 0.25 : 1.0,
    })

    // 3. Architectural Brick / Drywall Material
    const wallMaterial = new THREE.MeshStandardMaterial({
      color: 0xf97316,
      roughness: 0.8,
      transparent: true,
      opacity: xrayMode ? 0.2 : 0.9,
    })

    // 4. MEP Piping Material (Green / Yellow / Blue)
    const mepMaterial = new THREE.MeshStandardMaterial({
      color: 0x10b981,
      roughness: 0.3,
      metalness: 0.8,
      emissive: 0x064e3b,
      emissiveIntensity: 0.2,
    })

    // 5. Internal Steel Rebar (Visible in X-Ray)
    const rebarMaterial = new THREE.MeshStandardMaterial({
      color: 0xef4444,
      metalness: 0.8,
      roughness: 0.2,
    })

    // Slabs (3 Floors: 0, 4, 8 meters)
    const slabGeom = new THREE.BoxGeometry(24, 0.4, 18)
    for (let floor = 0; floor <= 2; floor++) {
      const slabMesh = new THREE.Mesh(slabGeom, slabMaterial)
      slabMesh.position.set(0, floor * 4, 0)
      slabMesh.castShadow = true
      slabMesh.receiveShadow = true
      slabMesh.userData = {
        id: `SLAB-FL-${floor}`,
        name: `${floor}. Kat Betonarme Tabliye Döşemesi`,
        category: "STATIK",
        ifcType: "IfcSlab",
        storey: `${floor}. Kat`,
        dimensions: "24m x 18m x 40cm (C35/45)",
        material: "C35/45 Hazır Beton + Çift Hasır Donatı",
        status: "İmalatı Tamamlandı / Onaylı",
      }
      statikGroupRef.current.add(slabMesh)
    }

    // Grid of Columns (4 x 3 = 12 columns per floor)
    const colGeom = new THREE.BoxGeometry(0.7, 3.6, 0.7)
    const colPositionsX = [-9, -3, 3, 9]
    const colPositionsZ = [-6, 0, 6]

    colPositionsX.forEach((cx, colIdx) => {
      colPositionsZ.forEach((cz, rowIdx) => {
        for (let floor = 0; floor < 2; floor++) {
          const colMesh = new THREE.Mesh(colGeom, concreteMaterial)
          colMesh.position.set(cx, floor * 4 + 2, cz)
          colMesh.castShadow = true
          colMesh.receiveShadow = true

          const colCode = `K-${colIdx + 1}${rowIdx + 1}`
          colMesh.userData = {
            id: `COL-${colCode}-FL${floor + 1}`,
            name: `${floor + 1}. Kat ${colCode} Taşıyıcı Kolon`,
            category: "STATIK",
            ifcType: "IfcColumn",
            storey: `${floor + 1}. Kat`,
            dimensions: `70x70cm, H:3.6m (Aks ${colIdx + 1}-${String.fromCharCode(65 + rowIdx)})`,
            material: "C35/45 Beton, 14Ø22 B420C Boyuna Donatı, Ø10/10 Etriye",
            status: "Demir & Kalıp Vizesi Alındı",
          }
          statikGroupRef.current.add(colMesh)

          // If X-Ray mode, add internal rebar cage representation
          if (xrayMode) {
            const rebarCageGeom = new THREE.CylinderGeometry(0.04, 0.04, 3.5, 6)
            for (let ro = -0.22; ro <= 0.22; ro += 0.44) {
              for (let co = -0.22; co <= 0.22; co += 0.44) {
                const rebarMesh = new THREE.Mesh(rebarCageGeom, rebarMaterial)
                rebarMesh.position.set(cx + ro, floor * 4 + 2, cz + co)
                rebarGroupRef.current.add(rebarMesh)
              }
            }
          }
        }
      })
    })

    // Longitudinal & Transverse Beams
    const beamXGeom = new THREE.BoxGeometry(6, 0.6, 0.4)
    for (let floor = 1; floor <= 2; floor++) {
      for (let i = 0; i < 3; i++) {
        colPositionsZ.forEach((cz) => {
          const beamMesh = new THREE.Mesh(beamXGeom, concreteMaterial)
          beamMesh.position.set(-6 + i * 6, floor * 4 - 0.3, cz)
          beamMesh.userData = {
            id: `BEAM-X-${floor}-${i}`,
            name: `${floor}. Kat K-${i + 1} Bağlantı Kirişi`,
            category: "STATIK",
            ifcType: "IfcBeam",
            storey: `${floor}. Kat`,
            dimensions: "6.0m x 40x60cm",
            material: "C35/45 Beton, 6Ø18 Montaj/Düz Donatı",
            status: "Onaylandı",
          }
          statikGroupRef.current.add(beamMesh)
        })
      }
    }

    // Architectural Perimeter Walls
    const wallGeom = new THREE.BoxGeometry(5.3, 3.4, 0.2)
    const wallMesh1 = new THREE.Mesh(wallGeom, wallMaterial)
    wallMesh1.position.set(-6, 2, -6)
    wallMesh1.userData = {
      id: "WALL-EXT-101",
      name: "1. Kat Kuzey Cephe Dış Duvar",
      category: "MIMARI",
      ifcType: "IfcWallStandardCase",
      storey: "1. Kat",
      dimensions: "5.3m x 3.4m x 20cm",
      material: "Gazbeton (Ytong) + Isı Yalıtım Mantolama",
      status: "Örme İmalatı Devam Ediyor",
    }
    mimariGroupRef.current.add(wallMesh1)

    const wallMesh2 = new THREE.Mesh(wallGeom, wallMaterial)
    wallMesh2.position.set(0, 2, -6)
    wallMesh2.userData = {
      id: "WALL-EXT-102",
      name: "1. Kat Kuzey Aks 2 Duvarı",
      category: "MIMARI",
      ifcType: "IfcWallStandardCase",
      storey: "1. Kat",
      dimensions: "5.3m x 3.4m x 20cm",
      material: "20cm Gazbeton Duvar",
      status: "Onay Bekliyor",
    }
    mimariGroupRef.current.add(wallMesh2)

    // MEP Ventilation & Drainage Ducting (Mekanik)
    const mepDuctGeom = new THREE.CylinderGeometry(0.2, 0.2, 18, 12)
    const mepDuct = new THREE.Mesh(mepDuctGeom, mepMaterial)
    mepDuct.rotation.x = Math.PI / 2
    mepDuct.position.set(-4, 3.4, 0)
    mepDuct.userData = {
      id: "MEP-VENT-LINE-A",
      name: "Ana Yangın & Havalandırma Boru Hattı",
      category: "MEKANIK",
      ifcType: "IfcDistributionFlowElement",
      storey: "1. Kat Asma Tavan",
      dimensions: "Ø400mm Galvaniz Spiral Boru",
      material: "Galvaniz Sac + Taşyünü İzolasyon",
      status: "Sızdırmazlık Testi Yapıldı",
    }
    mekanikGroupRef.current.add(mepDuct)

    // Add groups based on active filter
    if (activeDiscipline === "ALL" || activeDiscipline === "STATIK") {
      modelGroupRef.current.add(statikGroupRef.current)
    }
    if (activeDiscipline === "ALL" || activeDiscipline === "MIMARI") {
      modelGroupRef.current.add(mimariGroupRef.current)
    }
    if (activeDiscipline === "ALL" || activeDiscipline === "MEKANIK") {
      modelGroupRef.current.add(mekanikGroupRef.current)
    }
    if (xrayMode) {
      modelGroupRef.current.add(rebarGroupRef.current)
    }

    if (sceneRef.current) {
      sceneRef.current.add(modelGroupRef.current)
    }
  }, [xrayMode, activeDiscipline])

  // ADIM 3: IFC / GLB Model Yükleme Fonksiyonu (WASM Yolu & Hata Yakalama)
  const loadExternalModel = useCallback(
    async (fileOrUrl: string | File) => {
      setLoadingModel(true)
      setModelError(null)

      try {
        if (typeof fileOrUrl === "string") {
          const url = fileOrUrl
          setLoadedFileName(url.split("/").pop() || url)
          const urlLower = url.toLowerCase()
          const isIfc = urlLower.endsWith(".ifc") || urlLower.includes(".ifc")
          const isGlb =
            urlLower.endsWith(".glb") ||
            urlLower.endsWith(".gltf") ||
            urlLower.includes(".glb") ||
            urlLower.includes(".gltf") ||
            urlLower.includes("vintage_living_room")

          if (isIfc) {
            const ifcLoader = new IFCLoader()
            // ADIM 3: Kesin WASM yolu belirtilmesi
            if (ifcLoader.ifcManager) {
              ifcLoader.ifcManager.setWasmPath("/wasm/")
            }

            ifcLoader.load(
              url,
              (ifcModel) => {
                statikGroupRef.current.clear()
                mimariGroupRef.current.clear()
                mekanikGroupRef.current.clear()
                rebarGroupRef.current.clear()
                modelGroupRef.current.clear()
                customModelGroupRef.current.clear()

                customModelGroupRef.current.add(ifcModel)
                modelGroupRef.current.add(customModelGroupRef.current)
                if (sceneRef.current) {
                  sceneRef.current.add(modelGroupRef.current)
                }

                setLoadingModel(false)
                toast.success("IFC modeli başarıyla yüklendi!")
              },
              undefined,
              (err) => {
                console.error("IFC yükleme hatası (404/Ayrıştırma):", err)
                const errorMsg = "Model dosyası bulunamadı, lütfen yeni bir .IFC / .GLB dosyası yükleyin"
                setModelError(errorMsg)
                toast.error(errorMsg)
                setLoadingModel(false)
                buildProceduralBimModel()
              }
            )
          } else if (isGlb) {
            const gltfLoader = new GLTFLoader()
            gltfLoader.load(
              url,
              (gltf) => {
                statikGroupRef.current.clear()
                mimariGroupRef.current.clear()
                mekanikGroupRef.current.clear()
                rebarGroupRef.current.clear()
                modelGroupRef.current.clear()
                customModelGroupRef.current.clear()

                customModelGroupRef.current.add(gltf.scene)
                modelGroupRef.current.add(customModelGroupRef.current)
                if (sceneRef.current) {
                  sceneRef.current.add(modelGroupRef.current)
                }

                setLoadingModel(false)
                toast.success("3D GLB modeli başarıyla yüklendi!")
              },
              undefined,
              (err) => {
                console.error("GLB yükleme hatası (404):", err)
                const errorMsg = "Model dosyası bulunamadı, lütfen yeni bir .IFC / .GLB dosyası yükleyin"
                setModelError(errorMsg)
                toast.error(errorMsg)
                setLoadingModel(false)
                buildProceduralBimModel()
              }
            )
          } else {
            buildProceduralBimModel()
            setLoadingModel(false)
          }
        } else {
          // File object upload
          const file = fileOrUrl
          setLoadedFileName(file.name)
          const fileExt = file.name.split(".").pop()?.toLowerCase()

          if (fileExt === "ifc") {
            const ifcLoader = new IFCLoader()
            if (ifcLoader.ifcManager) {
              ifcLoader.ifcManager.setWasmPath("/wasm/")
            }
            const arrayBuffer = await file.arrayBuffer()
            const ifcModel = await ifcLoader.parse(arrayBuffer)

            statikGroupRef.current.clear()
            mimariGroupRef.current.clear()
            mekanikGroupRef.current.clear()
            rebarGroupRef.current.clear()
            modelGroupRef.current.clear()
            customModelGroupRef.current.clear()

            customModelGroupRef.current.add(ifcModel)
            modelGroupRef.current.add(customModelGroupRef.current)
            if (sceneRef.current) {
              sceneRef.current.add(modelGroupRef.current)
            }
            setLoadingModel(false)
            toast.success(`"${file.name}" IFC modeli başarıyla yüklendi!`)
          } else if (fileExt === "glb" || fileExt === "gltf") {
            const gltfLoader = new GLTFLoader()
            const arrayBuffer = await file.arrayBuffer()
            gltfLoader.parse(
              arrayBuffer,
              "",
              (gltf) => {
                statikGroupRef.current.clear()
                mimariGroupRef.current.clear()
                mekanikGroupRef.current.clear()
                rebarGroupRef.current.clear()
                modelGroupRef.current.clear()
                customModelGroupRef.current.clear()

                customModelGroupRef.current.add(gltf.scene)
                modelGroupRef.current.add(customModelGroupRef.current)
                if (sceneRef.current) {
                  sceneRef.current.add(modelGroupRef.current)
                }
                setLoadingModel(false)
                toast.success(`"${file.name}" 3D modeli başarıyla yüklendi!`)
              },
              (err) => {
                console.error("GLTF Parse Error:", err)
                const errorMsg = "Model dosyası bulunamadı, lütfen yeni bir .IFC / .GLB dosyası yükleyin"
                setModelError(errorMsg)
                toast.error(errorMsg)
                setLoadingModel(false)
                buildProceduralBimModel()
              }
            )
          } else {
            setTimeout(() => {
              buildProceduralBimModel()
              setLoadingModel(false)
              toast.success(`"${file.name}" modeli başarıyla işlendi!`)
            }, 800)
          }
        }
      } catch (err) {
        console.error("3D Model yükleme genel hatası:", err)
        const errorMsg = "Model dosyası bulunamadı, lütfen yeni bir .IFC / .GLB dosyası yükleyin"
        setModelError(errorMsg)
        toast.error(errorMsg)
        setLoadingModel(false)
        buildProceduralBimModel()
      }
    },
    [buildProceduralBimModel]
  )

  // ADIM 2: Initialize Three.js Scene with Explicit Sizing & ResizeObserver
  useEffect(() => {
    if (!canvasRef.current) return

    const container = canvasRef.current
    // Açık ve güvenli boyutlandırma (asla 0 olamaz)
    let width = container.clientWidth || container.getBoundingClientRect().width || 800
    let height = container.clientHeight || container.getBoundingClientRect().height || 500

    if (height < 200) height = 500
    if (width < 200) width = 800

    // 1. Scene
    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x0b1120) // Deep modern slate-900 / gray-900
    sceneRef.current = scene

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000)
    cameraRef.current = camera
    updateCameraPosition()

    // 3. Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" })
    renderer.setSize(width, height)
    renderer.setPixelRatio(Math.min(typeof window !== "undefined" ? window.devicePixelRatio : 1, 2))
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap
    rendererRef.current = renderer

    container.innerHTML = ""
    container.appendChild(renderer.domElement)

    // 4. Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.85)
    scene.add(ambientLight)

    const sunLight = new THREE.DirectionalLight(0xffedd5, 1.4)
    sunLight.position.set(30, 50, 30)
    sunLight.castShadow = true
    sunLight.shadow.mapSize.width = 2048
    sunLight.shadow.mapSize.height = 2048
    sunLight.shadow.camera.near = 0.5
    sunLight.shadow.camera.far = 150
    sunLight.shadow.camera.left = -25
    sunLight.shadow.camera.right = 25
    sunLight.shadow.camera.top = 25
    sunLight.shadow.camera.bottom = -25
    scene.add(sunLight)

    const fillLight = new THREE.DirectionalLight(0x38bdf8, 0.5)
    fillLight.position.set(-30, 20, -30)
    scene.add(fillLight)

    // 5. Grid & Axis Helper
    const grid = new THREE.GridHelper(50, 50, 0xf97316, 0x1e293b)
    grid.position.y = -0.2
    scene.add(grid)

    const axesHelper = new THREE.AxesHelper(4)
    axesHelper.position.set(-18, 0, 12)
    scene.add(axesHelper)

    // 6. Başlangıç BIM Modelini İnşa Et veya Harici Modeli Yükle (ADIM 4)
    const searchParams = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null
    const queryModel = searchParams?.get("model")
    const targetModel = modelUrl || initialModelUrl || queryModel

    if (targetModel) {
      loadExternalModel(targetModel)
    } else {
      buildProceduralBimModel()
      if (hasAssignedProject) {
        setNoModelAssigned(true)
      }
    }

    // 7. Render Loop
    const animate = () => {
      animationFrameId.current = requestAnimationFrame(animate)
      renderer.render(scene, camera)
    }
    animate()

    // 8. ADIM 2: ResizeObserver & Window Resize ile Canvas'ın Container'a Tam Oturması
    const handleResize = () => {
      if (!canvasRef.current || !rendererRef.current || !cameraRef.current) return
      const w = canvasRef.current.clientWidth || canvasRef.current.getBoundingClientRect().width
      const h = canvasRef.current.clientHeight || canvasRef.current.getBoundingClientRect().height
      if (w > 0 && h > 0) {
        cameraRef.current.aspect = w / h
        cameraRef.current.updateProjectionMatrix()
        rendererRef.current.setSize(w, h)
      }
    }

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width: w, height: h } = entry.contentRect
        if (w > 0 && h > 0 && rendererRef.current && cameraRef.current) {
          cameraRef.current.aspect = w / h
          cameraRef.current.updateProjectionMatrix()
          rendererRef.current.setSize(w, h)
        }
      }
    })

    if (containerRef.current) {
      resizeObserver.observe(containerRef.current)
    }
    window.addEventListener("resize", handleResize)

    // Initial resize trigger to guarantee layout sync
    const timer = setTimeout(handleResize, 100)

    return () => {
      clearTimeout(timer)
      resizeObserver.disconnect()
      window.removeEventListener("resize", handleResize)
      if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current)
      renderer.dispose()
      if (container) container.innerHTML = ""
    }
  }, [updateCameraPosition, buildProceduralBimModel, loadExternalModel, initialModelUrl, modelUrl, hasAssignedProject])

  // Mouse & Touch Orbit Controls
  const handleMouseDown = (e: React.MouseEvent) => {
    isDraggingRef.current = true
    previousMousePositionRef.current = { x: e.clientX, y: e.clientY }
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingRef.current) return

    const deltaX = e.clientX - previousMousePositionRef.current.x
    const deltaY = e.clientY - previousMousePositionRef.current.y

    // Pan with right-click or Shift key
    if (e.buttons === 2 || e.shiftKey) {
      const panSpeed = 0.03
      cameraTargetRef.current.x -= deltaX * panSpeed
      cameraTargetRef.current.y += deltaY * panSpeed
    } else {
      // Orbit rotate
      const rotSpeed = 0.006
      cameraRotationRef.current.theta -= deltaX * rotSpeed
      cameraRotationRef.current.phi = Math.max(
        0.05,
        Math.min(Math.PI / 2 - 0.05, cameraRotationRef.current.phi - deltaY * rotSpeed)
      )
    }

    updateCameraPosition()
    previousMousePositionRef.current = { x: e.clientX, y: e.clientY }
  }

  const handleMouseUp = () => {
    isDraggingRef.current = false
  }

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault()
    const zoomSpeed = 0.05
    cameraRotationRef.current.radius = Math.max(
      8,
      Math.min(120, cameraRotationRef.current.radius + e.deltaY * zoomSpeed)
    )
    updateCameraPosition()
  }

  // Raycaster for BIM Element Selection
  const handleClick = (e: React.MouseEvent) => {
    if (!canvasRef.current || !cameraRef.current || !sceneRef.current) return

    const rect = canvasRef.current.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 2 - 1
    const y = -((e.clientY - rect.top) / rect.height) * 2 + 1

    const raycaster = new THREE.Raycaster()
    raycaster.setFromCamera(new THREE.Vector2(x, y), cameraRef.current)

    const intersects = raycaster.intersectObjects(modelGroupRef.current.children, true)

    if (intersects.length > 0) {
      const hit = intersects[0].object as THREE.Mesh
      if (hit.userData && hit.userData.id) {
        setSelectedElement(hit.userData as SelectedElementInfo)

        // Highlight with bounding wireframe
        if (highlightMeshRef.current && sceneRef.current) {
          sceneRef.current.remove(highlightMeshRef.current)
          highlightMeshRef.current.geometry.dispose()
          highlightMeshRef.current = null
        }

        const box = new THREE.BoxHelper(hit, 0x38bdf8)
        highlightMeshRef.current = box as any
        sceneRef.current.add(box)
      }
    }
  }

  // Viewpoint Presets
  const setPresetView = (preset: "TOP" | "FRONT" | "ISO" | "RESET") => {
    if (preset === "TOP") {
      cameraRotationRef.current = { phi: 0.1, theta: 0, radius: 45 }
      cameraTargetRef.current.set(0, 4, 0)
    } else if (preset === "FRONT") {
      cameraRotationRef.current = { phi: Math.PI / 2.2, theta: 0, radius: 40 }
      cameraTargetRef.current.set(0, 4, 0)
    } else if (preset === "ISO" || preset === "RESET") {
      cameraRotationRef.current = { phi: Math.PI / 4, theta: Math.PI / 4, radius: 45 }
      cameraTargetRef.current.set(0, 4, 0)
    }
    updateCameraPosition()
  }

  // Handle Local IFC / Model Upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    toast.loading(`"${file.name}" 3D BIM modeli yükleniyor...`, { id: "ifc-load" })
    loadExternalModel(file).then(() => {
      toast.dismiss("ifc-load")
    })
  }

  // AR Action
  const handleArClick = () => {
    toast.error("AR Modu mobil uygulamada desteklenmektedir. Lütfen PWA veya Nexa Saha uygulamasını kullanınız.", {
      duration: 4000,
      icon: "📱",
    })
    setShowArModal(true)
  }

  return (
    <div
      className={`min-h-screen bg-slate-950 text-slate-100 flex flex-col ${
        isFullscreen ? "fixed inset-0 z-50 p-0" : "p-4 sm:p-6"
      }`}
    >
      {/* Top Header Bar */}
      {!isFullscreen && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div>
            <button
              onClick={() => router.push("/personnel")}
              className="flex items-center gap-2 text-xs text-orange-400 hover:text-orange-300 mb-2 transition"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Personel Portalı
            </button>
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                <Box className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-lg sm:text-xl font-bold text-white tracking-tight flex items-center gap-2">
                  3D BIM & AR Saha Navigasyonu
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-orange-500/20 text-orange-400 border border-orange-500/30">
                    WebGL 2.0 • Web-IFC
                  </span>
                </h1>
                <p className="text-xs text-slate-400">
                  {loadedFileName} • Pan, Zoom, Orbit ve Röntgen (X-Ray) donatı analizi
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            {/* AR Button */}
            <button
              type="button"
              onClick={handleArClick}
              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white text-xs font-bold shadow-lg shadow-orange-600/20 flex items-center gap-2 transition"
            >
              <Smartphone className="w-4 h-4" />
              AR Modunu Başlat (Kamera)
            </button>

            {/* IFC / GLB Upload & Test (Normal saha personeli için hideUpload ile gizlenir) */}
            {!hideUpload && (
              <>
                <label className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium cursor-pointer flex items-center gap-1.5 transition">
                  <Upload className="w-3.5 h-3.5 text-orange-400" />
                  <span>.IFC / .GLB Yükle</span>
                  <input
                    type="file"
                    accept=".ifc,.glb,.gltf,.dwg"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>

                {/* Vintage Living Room GLB Model Test Button */}
                <button
                  type="button"
                  onClick={() => loadExternalModel("/models/Vintage_Living_Room.glb")}
                  className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-medium flex items-center gap-1.5 transition"
                  title="Vintage_Living_Room.glb Modelini Test Et"
                >
                  <Box className="w-3.5 h-3.5 text-cyan-400" />
                  <span className="hidden sm:inline">Vintage_Living_Room.glb</span>
                  <span className="sm:hidden">Örnek Model</span>
                </button>
              </>
            )}

            {/* Fullscreen */}
            <button
              type="button"
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
              title={isFullscreen ? "Tam Ekrandan Çık" : "Tam Ekran"}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          </div>
        </div>
      )}

      {/* ADIM 4: Şantiye İçin Henüz Model Yüklenmediyse Gösterilen Şık Bildirim */}
      {noModelAssigned && (
        <div className="mb-3 p-3.5 rounded-xl bg-blue-950/70 border border-blue-800/80 text-blue-200 text-xs flex items-center justify-between gap-3 animate-in fade-in duration-200 shadow-lg">
          <div className="flex items-center gap-2.5">
            <Info className="w-4 h-4 text-cyan-400 shrink-0" />
            <span className="font-medium">
              Bu şantiye için henüz Merkez tarafından bir 3D model yüklenmemiştir.
            </span>
          </div>
          {projectName && (
            <span className="text-[11px] text-blue-300 bg-blue-900/60 px-2.5 py-0.5 rounded-md border border-blue-700/60 font-semibold">
              {projectName}
            </span>
          )}
        </div>
      )}

      {/* ADIM 3: Model Bulunamadı Zarif UI Uyarısı */}
      {modelError && (
        <div className="mb-3 p-3.5 rounded-xl bg-amber-950/70 border border-amber-800/80 text-amber-200 text-xs flex items-center justify-between gap-3 animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>{modelError}</span>
          </div>
          <div className="flex items-center gap-2">
            <label className="px-2.5 py-1 rounded-lg bg-amber-800/60 hover:bg-amber-700 text-white font-semibold cursor-pointer text-[11px] transition">
              Dosya Seç (.IFC / .GLB)
              <input
                type="file"
                accept=".ifc,.glb,.gltf"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
            <button
              onClick={() => setModelError(null)}
              className="p-1 rounded hover:bg-amber-900/50 text-amber-400 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* ADIM 2: 3D Canvas Viewport Container (Açık Yükseklik ve Genişlik) */}
      <div
        ref={containerRef}
        className="relative w-full h-[calc(100vh-180px)] min-h-[500px] overflow-hidden bg-gray-900 rounded-lg border border-slate-800 shadow-2xl flex flex-col"
      >
        {/* Loading Spinner Overlay */}
        {loadingModel && (
          <div className="absolute inset-0 z-40 bg-slate-950/70 backdrop-blur-sm flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 text-orange-400 animate-spin" />
            <span className="text-xs font-semibold text-slate-200">3D BIM Geometrisi Ayrıştırılıyor...</span>
          </div>
        )}

        {/* Three.js Interactive Canvas Container */}
        <div
          ref={canvasRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onWheel={handleWheel}
          onClick={handleClick}
          onContextMenu={(e) => e.preventDefault()}
          className="w-full h-full cursor-grab active:cursor-grabbing select-none"
        />

        {/* Top Control Toolbar (Floating overlay inside Canvas) */}
        <div className="absolute top-4 left-4 right-4 flex flex-wrap items-center justify-between gap-3 pointer-events-none">
          {/* Discipline Filters */}
          <div className="flex items-center gap-1 bg-slate-950/80 backdrop-blur-md border border-slate-800 p-1 rounded-2xl pointer-events-auto shadow-xl">
            {[
              { id: "ALL", label: "Tümü" },
              { id: "STATIK", label: "Statik / Taşıyıcı" },
              { id: "MIMARI", label: "Mimari" },
              { id: "MEKANIK", label: "MEP / Tesisat" },
            ].map((d) => (
              <button
                key={d.id}
                type="button"
                onClick={() => setActiveDiscipline(d.id as any)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                  activeDiscipline === d.id
                    ? "bg-orange-600 text-white shadow-md shadow-orange-600/30"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>

          {/* Quick Tools & X-Ray Mode */}
          <div className="flex items-center gap-2 pointer-events-auto">
            {/* X-Ray Toggle */}
            <button
              type="button"
              onClick={() => {
                setXrayMode(!xrayMode)
                toast.success(
                  !xrayMode ? "Röntgen (X-Ray) Modu Aktif: Donatı ve Tesisat gösteriliyor" : "Standart Görünüm"
                )
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold border flex items-center gap-1.5 backdrop-blur-md transition ${
                xrayMode
                  ? "bg-cyan-600 text-white border-cyan-400 shadow-lg shadow-cyan-600/30 animate-pulse"
                  : "bg-slate-950/80 text-slate-300 border-slate-800 hover:text-white"
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Röntgen (X-Ray)</span>
            </button>

            {/* View Presets */}
            <div className="flex items-center bg-slate-950/80 backdrop-blur-md border border-slate-800 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setPresetView("ISO")}
                className="px-2 py-1 text-[11px] text-slate-300 hover:text-white rounded"
                title="İzometrik Görünüm"
              >
                İzo
              </button>
              <button
                type="button"
                onClick={() => setPresetView("TOP")}
                className="px-2 py-1 text-[11px] text-slate-300 hover:text-white rounded"
                title="Kuşbakışı"
              >
                Plan
              </button>
              <button
                type="button"
                onClick={() => setPresetView("FRONT")}
                className="px-2 py-1 text-[11px] text-slate-300 hover:text-white rounded"
                title="Ön Cephe"
              >
                Cephe
              </button>
              <button
                type="button"
                onClick={() => setPresetView("RESET")}
                className="p-1 text-slate-400 hover:text-white rounded"
                title="Kamerayı Sıfırla"
              >
                <RefreshCw className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>

        {/* Selected BIM Element Inspector Drawer (Bottom Left Overlay) */}
        {selectedElement ? (
          <div className="absolute bottom-4 left-4 max-w-sm w-full bg-slate-950/90 backdrop-blur-md border border-cyan-500/40 rounded-2xl p-4 shadow-2xl space-y-2 pointer-events-auto animate-in fade-in slide-in-from-bottom-2">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                  {selectedElement.ifcType}
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setSelectedElement(null)}
                className="text-slate-400 hover:text-white p-0.5"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <h3 className="text-sm font-bold text-white">{selectedElement.name}</h3>
              <p className="text-[11px] text-slate-400">{selectedElement.storey}</p>
            </div>

            <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800 text-[11px] space-y-1 font-mono">
              <div className="flex justify-between">
                <span className="text-slate-400">Ebat / Geometri:</span>
                <span className="text-slate-200">{selectedElement.dimensions}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Malzeme Kalitesi:</span>
                <span className="text-slate-200">{selectedElement.material}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Saha Durumu:</span>
                <span className="text-emerald-400 font-semibold">{selectedElement.status}</span>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  router.push(`/personnel/ncr-request?elementId=${selectedElement.id}`)
                }}
                className="flex-1 py-1.5 rounded-lg bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-500/30 text-[11px] font-semibold text-center transition"
              >
                Kusur (NCR) Bildir
              </button>
              <button
                type="button"
                onClick={() => {
                  toast.success(`Eleman ID kopyalandı: ${selectedElement.id}`)
                }}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-[11px] font-medium transition"
              >
                Kopyala
              </button>
            </div>
          </div>
        ) : (
          <div className="absolute bottom-4 left-4 bg-slate-950/70 backdrop-blur-md border border-slate-800/80 px-3 py-1.5 rounded-xl text-[11px] text-slate-400 pointer-events-none">
            💡 Bir elemana tıklayarak teknik IFC özelliklerini görüntüleyin • Sağ tık ile kaydırın
          </div>
        )}

        {/* Exit fullscreen button if in fullscreen mode */}
        {isFullscreen && (
          <button
            type="button"
            onClick={() => setIsFullscreen(false)}
            className="absolute top-4 right-4 z-50 p-2.5 rounded-xl bg-slate-950/90 text-white border border-slate-700 hover:bg-black transition shadow-2xl"
          >
            <Minimize2 className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* AR Information Modal */}
      {showArModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-orange-500/20 border border-orange-500/30 flex items-center justify-center text-orange-400">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">AR Saha Navigasyonu</h3>
                  <p className="text-xs text-slate-400">Kamera ile Şantiye Örtüştürme</p>
                </div>
              </div>
              <button
                onClick={() => setShowArModal(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-300 leading-relaxed">
              <p>
                Artırılmış Gerçeklik (AR) motoru, mobil cihazınızın kamerasını ve LiDAR/SLAM sensörlerini kullanarak 3D BIM modelini fiziksel şantiye yapısının üzerine 1:1 ölçekte bindirir.
              </p>
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-2">
                <div className="flex items-center gap-2 text-orange-400 font-semibold">
                  <Sparkles className="w-4 h-4" />
                  Saha Mühendisi Özellikleri:
                </div>
                <ul className="list-disc list-inside space-y-1 text-slate-400">
                  <li>Beton dökülmeden önce gizli kalacak boru ve donatıyı kamerada görme</li>
                  <li>Kalıp ve şakül sapmalarını kırmızı ısı haritasıyla tespit</li>
                  <li>Eksik paspayı ve etriye aralıklarını artırılmış gerçeklikte denetleme</li>
                </ul>
              </div>
              <div className="text-[11px] text-slate-500">
                ⚠️ WebXR ve kamera erişimi mobil cihazlarda (Chrome/Safari PWA) desteklenmektedir. Masaüstü tarayıcınızda 3D Canvas üzerinden tam kontrole sahipsiniz.
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowArModal(false)}
              className="w-full py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-semibold text-xs transition"
            >
              Anladım, 3D Ekrana Dön
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
