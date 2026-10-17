"use client"
/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * AR (Augmented Reality) Field BIM Viewer
 * Real-world camera feed + 3D BIM model overlay with WebGL R3F, Bounds, Center and Alpha transparency
 */

import React, { useEffect, useRef, useState, useCallback, Suspense } from "react"
import { useRouter } from "next/navigation"
import { Canvas } from "@react-three/fiber"
import { OrbitControls, useGLTF, Center, Bounds } from "@react-three/drei"
import * as THREE from "three"
import { toast } from "react-hot-toast"

interface ARViewerProps {
  project: {
    id: string
    name?: string | null
    title?: string | null
    bimModelUrl?: string | null
    ifcModelUrl?: string | null
  }
  modelUrl: string
}

// 3D Model Renderer with dynamic opacity, scale and elevation
function AR3DModel({
  url,
  scale,
  opacity,
  elevation,
  onLoaded,
}: {
  url: string
  scale: number
  opacity: number
  elevation: number
  onLoaded?: () => void
}) {
  const { scene } = useGLTF(url)

  useEffect(() => {
    if (!scene) return
    scene.traverse((child: any) => {
      if (child.isMesh) {
        child.castShadow = true
        child.receiveShadow = true
        if (child.material) {
          if (!child.userData.isCloned) {
            child.material = child.material.clone()
            child.userData.isCloned = true
          }
          child.material.transparent = opacity < 0.99
          child.material.opacity = opacity
          child.material.depthWrite = true
        }
      }
    })
    onLoaded?.()
  }, [scene, opacity, onLoaded])

  return (
    <group position={[0, elevation, 0]} scale={[scale, scale, scale]}>
      <primitive object={scene} />
    </group>
  )
}

export default function ARViewer({ project, modelUrl }: ARViewerProps) {
  const router = useRouter()
  const videoRef = useRef<HTMLVideoElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Camera stream state
  const [cameraActive, setCameraActive] = useState(false)
  const [cameraError, setCameraError] = useState<string | null>(null)
  const [facingMode, setFacingMode] = useState<"environment" | "user">("environment")
  const [stream, setStream] = useState<MediaStream | null>(null)

  // 3D & AR state
  const [loadingModel, setLoadingModel] = useState(true)
  const [scale, setScale] = useState(1.0)
  const [opacity, setOpacity] = useState(0.85)
  const [elevation, setElevation] = useState(0)
  const [showControls, setShowControls] = useState(true)

  // Determine effective model URL (falls back to /models/bina.glb if blob or ifc)
  const effectiveModelUrl = React.useMemo(() => {
    if (
      !modelUrl ||
      modelUrl.startsWith("blob:") ||
      modelUrl.toLowerCase().endsWith(".ifc") ||
      modelUrl.toLowerCase().includes(".ifc?")
    ) {
      return "/models/bina.glb"
    }
    return modelUrl
  }, [modelUrl])

  // 1. Initialize Real-world Camera Stream
  const startCamera = useCallback(async (mode: "environment" | "user") => {
    try {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop())
      }

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Tarayıcınız kamera erişimini desteklemiyor.")
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: mode },
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      })

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream
        await videoRef.current.play().catch(() => {})
      }

      setStream(mediaStream)
      setCameraActive(true)
      setCameraError(null)
    } catch (err: any) {
      console.warn("Camera access error:", err)
      setCameraError(err.message || "Kamera başlatılamadı. Lütfen kamera izinlerini kontrol edin.")
      setCameraActive(false)
    }
  }, [stream])

  useEffect(() => {
    startCamera(facingMode)

    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop())
      }
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Switch between front & back camera
  const toggleCamera = () => {
    const nextMode = facingMode === "environment" ? "user" : "environment"
    setFacingMode(nextMode)
    startCamera(nextMode)
  }

  // Snap photo (combines camera video + 3D WebGL canvas)
  const takeSnapshot = () => {
    if (!videoRef.current || !containerRef.current) return

    const canvas = document.createElement("canvas")
    const video = videoRef.current
    canvas.width = video.videoWidth || window.innerWidth
    canvas.height = video.videoHeight || window.innerHeight

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // 1. Draw camera frame
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

    // 2. Draw 3D WebGL canvas over it
    const webglCanvas = containerRef.current.querySelector("canvas")
    if (webglCanvas) {
      ctx.drawImage(webglCanvas, 0, 0, canvas.width, canvas.height)
    }

    // 3. Add timestamp & project watermark
    ctx.fillStyle = "rgba(15, 23, 42, 0.75)"
    ctx.fillRect(20, canvas.height - 70, 360, 50)
    ctx.fillStyle = "#38bdf8"
    ctx.font = "bold 16px sans-serif"
    ctx.fillText(`NEXA ERP - AR Saha Denetimi`, 30, canvas.height - 45)
    ctx.fillStyle = "#e2e8f0"
    ctx.font = "12px sans-serif"
    ctx.fillText(`${project.name || project.title || "Proje"} | ${new Date().toLocaleString("tr-TR")}`, 30, canvas.height - 25)

    // Download
    const dataUrl = canvas.toDataURL("image/png")
    const a = document.createElement("a")
    a.href = dataUrl
    a.download = `ar-sahada-${project.id}-${Date.now()}.png`
    a.click()

    toast.success("📸 AR Saha fotoğrafı kaydedildi!", {
      style: {
        background: "#0f172a",
        color: "#f8fafc",
        border: "1px solid rgba(6, 182, 212, 0.4)",
        borderRadius: "12px",
      },
      iconTheme: { primary: "#06b6d4", secondary: "#0f172a" },
    })
  }

  // Reset Model to center
  const resetModelPlacement = () => {
    setScale(1.0)
    setElevation(0)
    toast.success("Model konumu ve ölçeği sıfırlandı.")
  }

  return (
    <div className="fixed inset-0 w-full h-full bg-black overflow-hidden select-none touch-none z-50 flex flex-col">
      {/* 1. Real-World Camera Stream */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="absolute inset-0 w-full h-full object-cover z-0"
      />

      {/* Fallback if camera is denied or loading */}
      {!cameraActive && (
        <div className="absolute inset-0 z-0 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 flex flex-col items-center justify-center p-6 text-center">
          <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mb-4 animate-pulse">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </div>
          <h3 className="text-white font-semibold text-lg mb-1">Kamera Başlatılıyor</h3>
          <p className="text-slate-400 text-xs max-w-sm mb-4">
            {cameraError || "Gerçek dünya görüntüsü için lütfen tarayıcınızın kamera iznini onaylayın."}
          </p>
          <button
            onClick={() => startCamera(facingMode)}
            className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-medium transition-colors shadow-lg shadow-cyan-600/30"
          >
            Kamerayı Yeniden Başlat
          </button>
        </div>
      )}

      {/* 2. Transparent 3D WebGL Canvas Layer (React Three Fiber) */}
      <div
        ref={containerRef}
        className="absolute inset-0 w-full h-full z-10 pointer-events-auto"
      >
        <Canvas
          camera={{ position: [0, 8, 22], fov: 45 }}
          gl={{
            alpha: true,
            antialias: true,
            preserveDrawingBuffer: true,
            powerPreference: "high-performance",
          }}
        >
          <ambientLight intensity={1.6} />
          <directionalLight position={[15, 30, 20]} intensity={2.2} castShadow />
          <pointLight position={[-15, 15, -15]} intensity={1.2} />

          <Suspense fallback={null}>
            <Bounds fit observe margin={1.2}>
              <Center>
                <AR3DModel
                  url={effectiveModelUrl}
                  scale={scale}
                  opacity={opacity}
                  elevation={elevation}
                  onLoaded={() => setLoadingModel(false)}
                />
              </Center>
            </Bounds>
          </Suspense>

          <OrbitControls
            enableDamping
            dampingFactor={0.05}
            enablePan={true}
            enableZoom={true}
            makeDefault
          />
        </Canvas>
      </div>

      {/* 3. Top Header Overlay */}
      <div className="absolute top-0 left-0 right-0 z-30 p-4 bg-gradient-to-b from-slate-950/90 via-slate-950/60 to-transparent flex items-center justify-between pointer-events-auto">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push(`/admin/projects/${project.id}`)}
            className="p-2.5 bg-slate-900/80 backdrop-blur-md hover:bg-slate-800 text-white rounded-xl border border-slate-700/80 shadow-lg transition-all"
            title="Projeye Dön"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>

          <div>
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500 shadow-[0_0_8px_#10b981]"></span>
              </span>
              <span className="text-[10px] font-bold tracking-widest uppercase bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">
                CANLI AR SAHA MODU
              </span>
            </div>
            <h2 className="text-white font-semibold text-sm truncate max-w-[200px] sm:max-w-xs">
              {project.name || project.title || "Proje Sahası"}
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Flip camera */}
          <button
            onClick={toggleCamera}
            className="p-2.5 bg-slate-900/80 backdrop-blur-md hover:bg-slate-800 text-slate-200 hover:text-white rounded-xl border border-slate-700/80 shadow-lg transition-all"
            title="Kamerayı Çevir"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>

          {/* Toggle controls */}
          <button
            onClick={() => setShowControls(!showControls)}
            className={`p-2.5 rounded-xl border backdrop-blur-md shadow-lg transition-all ${
              showControls
                ? "bg-cyan-500/20 border-cyan-500/50 text-cyan-400"
                : "bg-slate-900/80 border-slate-700/80 text-slate-300"
            }`}
            title="Kontrolleri Gizle / Göster"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
            </svg>
          </button>
        </div>
      </div>

      {/* Model Loading State */}
      {loadingModel && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm pointer-events-none">
          <div className="w-14 h-14 border-4 border-cyan-500/20 border-t-cyan-400 rounded-full animate-spin mb-4 shadow-[0_0_20px_rgba(6,182,212,0.5)]" />
          <h4 className="text-white font-semibold text-base mb-1">3D BIM Modeli Sahaya Yerleştiriliyor</h4>
          <p className="text-cyan-300 text-xs">WebGL sahnesi hazırlanıyor, lütfen bekleyin...</p>
        </div>
      )}

      {/* 4. Bottom Floating AR Controls Dock */}
      {showControls && (
        <div className="absolute bottom-6 left-3 right-3 z-30 max-w-xl mx-auto flex flex-col gap-3 pointer-events-auto">
          {/* Gesture guide toast */}
          <div className="bg-slate-950/80 backdrop-blur-md border border-slate-800 text-[11px] text-slate-300 px-3.5 py-1.5 rounded-full flex items-center justify-between mx-auto shadow-xl">
            <span className="flex items-center gap-1.5">
              <span>👆 <b>Döndür</b></span>
              <span className="text-slate-600">•</span>
              <span>✌️ <b>Yakınlaş</b></span>
            </span>
            <span className="ml-3 font-mono text-cyan-400 font-bold">Ölçek: {(scale * 100).toFixed(0)}%</span>
          </div>

          {/* Quick Scale Presets */}
          <div className="bg-slate-900/90 backdrop-blur-xl border border-slate-700/80 p-3 rounded-2xl shadow-2xl space-y-3">
            <div className="flex items-center justify-between gap-1.5">
              <button
                onClick={() => setScale(0.3)}
                className={`flex-1 py-1.5 px-2 rounded-lg text-[11px] font-medium transition-all ${
                  scale < 0.5
                    ? "bg-cyan-500 text-slate-950 font-bold shadow-[0_0_12px_rgba(6,182,212,0.6)]"
                    : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                }`}
              >
                1:100 Masa
              </button>

              <button
                onClick={() => setScale(0.7)}
                className={`flex-1 py-1.5 px-2 rounded-lg text-[11px] font-medium transition-all ${
                  scale >= 0.5 && scale < 0.9
                    ? "bg-cyan-500 text-slate-950 font-bold shadow-[0_0_12px_rgba(6,182,212,0.6)]"
                    : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                }`}
              >
                1:20 Oda
              </button>

              <button
                onClick={() => setScale(1.0)}
                className={`flex-1 py-1.5 px-2 rounded-lg text-[11px] font-medium transition-all ${
                  scale >= 0.9
                    ? "bg-gradient-to-r from-emerald-500 to-cyan-500 text-slate-950 font-bold shadow-[0_0_15px_rgba(16,185,129,0.7)]"
                    : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                }`}
              >
                1:1 Şantiye (Gerçek)
              </button>

              <button
                onClick={resetModelPlacement}
                className="py-1.5 px-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-[11px] transition-all"
                title="Konumu Ortala"
              >
                🔄 Ortala
              </button>
            </div>

            {/* Sliders: Elevation & Opacity */}
            <div className="grid grid-cols-2 gap-3 pt-1 border-t border-slate-800">
              {/* Elevation */}
              <div>
                <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                  <span>Yükseklik:</span>
                  <span className="font-mono text-cyan-400">{elevation.toFixed(1)}m</span>
                </div>
                <input
                  type="range"
                  min="-10"
                  max="10"
                  step="0.5"
                  value={elevation}
                  onChange={(e) => setElevation(parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                />
              </div>

              {/* Opacity */}
              <div>
                <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                  <span>Şeffaflık:</span>
                  <span className="font-mono text-cyan-400">{Math.round(opacity * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0.2"
                  max="1.0"
                  step="0.05"
                  value={opacity}
                  onChange={(e) => setOpacity(parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                />
              </div>
            </div>

            {/* Main Action Bar */}
            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={takeSnapshot}
                className="w-full py-2.5 px-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-xl font-semibold text-xs transition-all shadow-[0_0_20px_rgba(6,182,212,0.4)] flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span>AR Saha Fotoğrafı Çek</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
