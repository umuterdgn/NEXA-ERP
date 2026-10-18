"use client"

import React, { useState, useEffect, useRef, Suspense, Component, ReactNode } from "react"
import { Canvas } from "@react-three/fiber"
import { OrbitControls, useGLTF, Html, Grid, ContactShadows, Center } from "@react-three/drei"
import {
  Play,
  Pause,
  RotateCcw,
  Maximize2,
  Minimize2,
  CheckCircle2,
  AlertTriangle,
  Bot,
  Calendar,
  Layers,
  Sparkles,
  ChevronRight,
  ChevronLeft
} from "lucide-react"

// ---------------------------------------------------------------------------
// Adım 1: Gerçekçi Mock Veri (4D Timeline & AI Saha Analizi)
// ---------------------------------------------------------------------------
export interface MockDroneRisk {
  x: number
  y: number
  z: number
  label: string
  type: "danger" | "warning" | string
}

export interface MockDroneStage {
  id: string
  stageName: string
  captureDate: string
  progressPct: number
  modelUrl: string
  aiAnalysis: {
    summary: string
    detected: string[]
    completed: string[]
    risks: MockDroneRisk[]
  }
}

export const mockDroneData: MockDroneStage[] = [
  {
    id: "stage-1",
    stageName: "Zemin Kazısı ve Hafriyat",
    captureDate: "12 Eki 2026",
    progressPct: 15,
    modelUrl: "https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/DamagedHelmet/glTF-Binary/DamagedHelmet.glb", // Test amaçlı CDN GLB
    aiAnalysis: {
      summary: "Hafriyatın %85'i tamamlandı.",
      detected: ["2 Adet Ekskavatör", "4 Adet Kamyon"],
      completed: ["Kuzey cephe kazısı"],
      risks: [{ x: 1, y: 1, z: 1, label: "Açık Kazı (Bariyer Eksik)", type: "danger" }]
    }
  },
  {
    id: "stage-2",
    stageName: "Temel Donatı",
    captureDate: "28 Eki 2026",
    progressPct: 28,
    modelUrl: "https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/FlightHelmet/glTF-Binary/FlightHelmet.glb",
    aiAnalysis: {
      summary: "Temel demir bağlama işlemi tamamlandı.",
      detected: ["15 Adet Personel", "Mobil Vinç"],
      completed: ["Bohçalama Yalıtımı"],
      risks: [{ x: 0, y: 1.5, z: 0.5, label: "Vinç Yükü Altında Çalışma", type: "danger" }]
    }
  }
]

// ---------------------------------------------------------------------------
// 3D Model Yükleyici & AI Pinleme Bileşeni
// ---------------------------------------------------------------------------
function DroneMesh({ url, annotations }: { url: string; annotations: MockDroneRisk[] }) {
  // FlightHelmet Khronos reposunda çoklu dosya (gltf) olarak saklandığından,
  // 404 hatasını önlemek ve aşama değişiminde gerçek farklı bir 3D model render etmek için dahili GLB modeline bağlanır.
  const resolvedUrl = url.includes("FlightHelmet") ? "/models/bina.glb" : url
  const { scene } = useGLTF(resolvedUrl)

  return (
    <group>
      <Center>
        <primitive object={scene} />
      </Center>

      {/* 3D Alanda Pinler (HTML Badges) */}
      {annotations?.map((ann, i) => (
        <Html key={i} position={[ann.x, ann.y, ann.z]} center distanceFactor={15}>
          <div
            className={`px-3 py-1 rounded-full text-xs font-bold text-white shadow-lg backdrop-blur-md border cursor-pointer hover:scale-110 transition-transform flex items-center gap-1.5 whitespace-nowrap select-none ${
              ann.type === "danger"
                ? "bg-red-500/80 border-red-400"
                : "bg-amber-500/80 border-amber-400"
            }`}
          >
            <span>{ann.type === "danger" ? "🚨" : "⚠️"}</span>
            <span>{ann.label}</span>
          </div>
        </Html>
      ))}
    </group>
  )
}

// Model yüklenemediğinde veya offline durumda fallback render edilecek şantiye geometrisi
function FallbackProceduralMesh({ annotations }: { annotations: MockDroneRisk[] }) {
  return (
    <group>
      {/* Şantiye zemin ve temel kafesi */}
      <mesh position={[0, -0.05, 0]} receiveShadow>
        <boxGeometry args={[10, 0.1, 10]} />
        <meshStandardMaterial color="#1e293b" roughness={0.8} metalness={0.2} />
      </mesh>

      {/* Temsili temel hatılları */}
      <mesh position={[0, 0.4, 0]}>
        <boxGeometry args={[6, 0.8, 6]} />
        <meshStandardMaterial color="#0284c7" wireframe opacity={0.6} transparent />
      </mesh>

      {/* Kolon temsilleri */}
      {[-2, 2].map((x) =>
        [-2, 2].map((z) => (
          <mesh key={`${x}-${z}`} position={[x, 1.2, z]} castShadow>
            <boxGeometry args={[0.5, 2.4, 0.5]} />
            <meshStandardMaterial color="#38bdf8" roughness={0.3} metalness={0.4} />
          </mesh>
        ))
      )}

      {/* AI Pinleri */}
      {annotations?.map((ann, i) => (
        <Html key={i} position={[ann.x, ann.y, ann.z]} center distanceFactor={15}>
          <div
            className={`px-3 py-1 rounded-full text-xs font-bold text-white shadow-lg backdrop-blur-md border cursor-pointer hover:scale-110 transition-transform flex items-center gap-1.5 whitespace-nowrap ${
              ann.type === "danger"
                ? "bg-red-500/80 border-red-400"
                : "bg-amber-500/80 border-amber-400"
            }`}
          >
            <span>{ann.type === "danger" ? "🚨" : "⚠️"}</span>
            <span>{ann.label}</span>
          </div>
        </Html>
      ))}
    </group>
  )
}

// Three.js Canvas GLTF hata yakalayıcı (Error Boundary)
interface ErrorBoundaryProps {
  fallback: ReactNode
  children: ReactNode
  resetKey?: any
}

interface ErrorBoundaryState {
  hasError: boolean
}

class ModelErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error: any) {
    console.warn("DroneDigitalTwin 3D Model uyarısı (Fallback mesh devreye girdi):", error)
  }

  componentDidUpdate(prevProps: ErrorBoundaryProps) {
    if (prevProps.resetKey !== this.props.resetKey && this.state.hasError) {
      this.setState({ hasError: false })
    }
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback
    }
    return this.props.children
  }
}

// ---------------------------------------------------------------------------
// DroneDigitalTwin Ana Bileşeni
// ---------------------------------------------------------------------------
interface DroneDigitalTwinProps {
  projectId?: string
  projectName?: string
}

export default function DroneDigitalTwin({
  projectId,
  projectName = "Şantiye 4D İkizi"
}: DroneDigitalTwinProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [activeStageIndex, setActiveStageIndex] = useState(0)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isPlaying4D, setIsPlaying4D] = useState(false)

  // Adım 2: activeStageIndex kullanarak seçili aşamanın verisi
  const currentData = mockDroneData[activeStageIndex] || mockDroneData[0]

  // Otomatik 4D Zaman Akışı (Play / Pause simülasyonu)
  useEffect(() => {
    if (!isPlaying4D) return

    const interval = setInterval(() => {
      setActiveStageIndex((prev) => (prev + 1) % mockDroneData.length)
    }, 4500)

    return () => clearInterval(interval)
  }, [isPlaying4D])

  // Tam ekran geçişi
  const toggleFullscreen = () => {
    if (!containerRef.current) return
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {})
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {})
    }
  }

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-[650px] md:h-[720px] bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 rounded-2xl overflow-hidden border border-slate-800 shadow-2xl flex flex-col ${
        isFullscreen ? "h-screen rounded-none" : ""
      }`}
    >
      {/* Sol Üst Başlık & Kontroller */}
      <div className="absolute top-4 left-4 z-40 flex items-center gap-2.5">
        <div className="flex items-center gap-2.5 px-4 py-2 bg-slate-900/80 backdrop-blur-xl border border-slate-700/70 rounded-xl shadow-lg">
          <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
          <span className="text-xs md:text-sm font-bold text-white tracking-wide">
            4D Fotogrametri & Dijital İkiz
          </span>
          <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
            Aşama {activeStageIndex + 1}/{mockDroneData.length}
          </span>
        </div>

        <button
          onClick={() => setIsPlaying4D(!isPlaying4D)}
          className={`px-3 py-2 rounded-xl text-xs font-semibold backdrop-blur-xl border shadow-lg transition-all flex items-center gap-1.5 ${
            isPlaying4D
              ? "bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500/30"
              : "bg-slate-900/80 text-slate-200 border-slate-700 hover:bg-slate-800 hover:text-white"
          }`}
          title={isPlaying4D ? "Simülasyonu Duraklat" : "4D Zaman Akışını Oynat"}
        >
          {isPlaying4D ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
          <span className="hidden sm:inline">{isPlaying4D ? "Duraklat" : "4D Oynat"}</span>
        </button>

        <button
          onClick={toggleFullscreen}
          className="p-2 bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white rounded-xl border border-slate-700/70 backdrop-blur-xl shadow-lg transition-all"
          title={isFullscreen ? "Tam Ekrandan Çık" : "Tam Ekran Yap"}
        >
          {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
        </button>
      </div>

      {/* 3D WebGL Canvas Görünümü */}
      <div className="w-full h-full relative cursor-grab active:cursor-grabbing">
        <Canvas
          camera={{ position: [3, 2.5, 3.5], fov: 45 }}
          shadows
          gl={{ antialias: true, alpha: true }}
        >
          <ambientLight intensity={0.8} />
          <directionalLight
            position={[10, 15, 10]}
            intensity={1.5}
            castShadow
            shadow-mapSize={[2048, 2048]}
          />
          <directionalLight position={[-10, 8, -10]} intensity={0.5} />

          {/* Izgara Taban */}
          <Grid
            infiniteGrid
            cellSize={0.8}
            cellThickness={0.5}
            cellColor="#334155"
            sectionSize={4}
            sectionThickness={1.2}
            sectionColor="#475569"
            fadeDistance={25}
            fadeStrength={1.5}
          />

          <ContactShadows
            position={[0, -0.01, 0]}
            opacity={0.6}
            scale={15}
            blur={2}
            far={4}
          />

          {/* 3D Model ve AI Pinleri */}
          <Suspense
            fallback={
              <Html center>
                <div className="flex items-center gap-2.5 px-4 py-2 bg-slate-900/90 text-white rounded-xl backdrop-blur-md border border-cyan-500/30 text-xs shadow-2xl">
                  <div className="w-4 h-4 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
                  <span>3D Model Yükleniyor...</span>
                </div>
              </Html>
            }
          >
            <ModelErrorBoundary
              resetKey={currentData.modelUrl}
              fallback={<FallbackProceduralMesh annotations={currentData.aiAnalysis.risks} />}
            >
              <DroneMesh
                key={currentData.id}
                url={currentData.modelUrl}
                annotations={currentData.aiAnalysis.risks}
              />
            </ModelErrorBoundary>
          </Suspense>

          <OrbitControls
            makeDefault
            enableDamping
            dampingFactor={0.05}
            minDistance={1.5}
            maxDistance={25}
            maxPolarAngle={Math.PI / 2 - 0.05}
          />
        </Canvas>

        {/* 3D Navigasyon İpucu */}
        <div className="absolute bottom-24 left-6 z-20 hidden md:flex items-center gap-2 px-3 py-1.5 bg-slate-900/60 backdrop-blur-md rounded-lg border border-slate-800 text-[11px] text-slate-400 pointer-events-none">
          <span>🖱️ Sol Tık: Döndür</span>
          <span>•</span>
          <span>Sağ Tık: Kaydır</span>
          <span>•</span>
          <span>Tekerlek: Yakınlaş</span>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* Adım 2: AI Saha Analizi Paneli (Sağ Panel UI Tasarımı)                */}
      {/* absolute top-20 right-4 w-80 z-40 Glassmorphism                       */}
      {/* ===================================================================== */}
      <div className="absolute top-20 right-4 w-80 z-40 max-h-[calc(100%-160px)] overflow-y-auto backdrop-blur-xl bg-slate-900/80 border border-slate-700/60 rounded-2xl p-5 shadow-2xl text-white transition-all animate-in fade-in slide-in-from-right-4 duration-300">
        {/* Başlık: 🤖 AI Saha Analizi ve Yanında Tarih */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <span>🤖</span>
            <span>AI Saha Analizi</span>
          </h3>
          <span className="text-xs text-slate-400 font-medium">
            {currentData.captureDate}
          </span>
        </div>

        {/* İlerleme: % Progress bar (cyan/yeşil renkli) */}
        <div className="mt-4">
          <div className="flex items-center justify-between text-xs mb-1.5 font-medium">
            <span className="text-slate-300">İlerleme</span>
            <span className="text-cyan-400 font-bold">%{currentData.progressPct}</span>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden p-0.5 border border-slate-700">
            <div
              className="bg-gradient-to-r from-cyan-500 to-emerald-400 h-full rounded-full transition-all duration-500 ease-out shadow-sm"
              style={{ width: `${Math.min(100, Math.max(0, currentData.progressPct))}%` }}
            />
          </div>
        </div>

        {/* Özet: Açıklama metni */}
        <div className="mt-4 p-3 bg-slate-800/60 border border-slate-700/50 rounded-xl">
          <p className="text-xs text-slate-300 leading-relaxed">
            {currentData.aiAnalysis.summary}
          </p>
        </div>

        {/* Tespit Edilenler (Nesne Tanıma): Küçük gri tag'ler/chipler */}
        <div className="mt-4">
          <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
            Tespit Edilenler (Nesne Tanıma)
          </h4>
          <div className="flex flex-wrap gap-1.5">
            {currentData.aiAnalysis.detected.map((item, idx) => (
              <span
                key={idx}
                className="px-2.5 py-1 bg-slate-800/90 text-slate-300 border border-slate-700 rounded-lg text-xs font-medium"
              >
                {item}
              </span>
            ))}
          </div>
        </div>

        {/* Yeşil Check Listesi: completed array'i yeşil onay ikonlarıyla alt alta */}
        <div className="mt-4">
          <h4 className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            Tamamlanan İmalatlar
          </h4>
          <div className="space-y-1.5">
            {currentData.aiAnalysis.completed.map((comp, idx) => (
              <div
                key={idx}
                className="flex items-center gap-2 p-2 bg-emerald-950/20 border border-emerald-900/30 rounded-lg text-xs text-slate-200"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span className="leading-relaxed">{comp}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Güvenlik Riskleri & Pinler Listesi */}
        {currentData.aiAnalysis.risks && currentData.aiAnalysis.risks.length > 0 && (
          <div className="mt-4 pt-3 border-t border-slate-800">
            <h4 className="text-[11px] font-bold text-amber-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
              Saha Güvenlik Riskleri ({currentData.aiAnalysis.risks.length})
            </h4>
            <div className="space-y-1.5">
              {currentData.aiAnalysis.risks.map((risk, idx) => (
                <div
                  key={idx}
                  className={`flex items-center gap-2 p-2 rounded-lg text-xs border ${
                    risk.type === "danger"
                      ? "bg-red-950/20 text-red-300 border-red-900/30"
                      : "bg-amber-950/20 text-amber-300 border-amber-900/30"
                  }`}
                >
                  <span>{risk.type === "danger" ? "🚨" : "⚠️"}</span>
                  <span className="font-medium">{risk.label}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ===================================================================== */}
      {/* Adım 3: 4D Zaman Çizelgesi (Timeline) Alt Bar Tasarımı                 */}
      {/* absolute bottom-4 left-1/2 -translate-x-1/2 z-40                      */}
      {/* Seçili: parlak bg-cyan-500 text-white, Diğerleri: koyu gri bg-slate-800 */}
      {/* ===================================================================== */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-40 backdrop-blur-xl bg-slate-900/85 border border-slate-700/70 rounded-2xl p-2.5 shadow-2xl flex items-center gap-3 max-w-[95%] overflow-x-auto">
        <div className="flex items-center gap-2 pl-2 pr-1 text-slate-400 text-xs font-semibold">
          <Calendar className="w-4 h-4 text-cyan-400" />
          <span className="hidden sm:inline">4D Çizelge:</span>
        </div>
        {mockDroneData.map((stage, index) => {
          const isSelected = index === activeStageIndex
          // "12 Eki" veya "28 Eki" buton etiketi
          const buttonDateLabel = stage.captureDate.replace(" 2026", "")

          return (
            <button
              key={stage.id}
              id={`timeline-btn-${stage.id}`}
              onClick={() => {
                setActiveStageIndex(index)
                setIsPlaying4D(false)
              }}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all border flex items-center gap-2.5 whitespace-nowrap cursor-pointer ${
                isSelected
                  ? "bg-cyan-500 text-white shadow-lg shadow-cyan-500/30 border-cyan-400 scale-105"
                  : "bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700 hover:text-white"
              }`}
            >
              <span className="font-bold text-sm tracking-wide">{buttonDateLabel}</span>
              <span className="opacity-90 hidden sm:inline">• {stage.stageName}</span>
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                  isSelected ? "bg-white/20 text-white" : "bg-slate-700/80 text-slate-400"
                }`}
              >
                %{stage.progressPct}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
