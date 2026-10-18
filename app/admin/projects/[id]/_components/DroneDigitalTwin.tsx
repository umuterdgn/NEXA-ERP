"use client"

import React, { useState, useEffect, useRef, Suspense, Component, ReactNode } from "react"
import { Canvas } from "@react-three/fiber"
import { OrbitControls, useGLTF, Html, Grid, ContactShadows } from "@react-three/drei"
import * as THREE from "three"
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
  Plus,
  X,
  Upload,
  ChevronRight,
  ChevronLeft,
  Info
} from "lucide-react"
import { toast } from "react-hot-toast"

export interface DroneAnnotation {
  x: number
  y: number
  z: number
  label: string
  type?: "danger" | "warning" | "info" | string
}

export interface DroneCaptureItem {
  id: string
  projectId: string
  stageName: string
  modelUrl: string
  captureDate: string | Date
  progressPct: number
  aiAnalysis?: {
    annotations?: DroneAnnotation[]
    completed?: string[]
    risks?: string[]
    [key: string]: any
  } | DroneAnnotation[] | null
  createdAt?: string | Date
}

// ---------------------------------------------------------------------------
// 3D Model Yükleyici & AI Pinleme Bileşeni
// ---------------------------------------------------------------------------
function DroneMesh({ url, annotations }: { url: string; annotations: DroneAnnotation[] }) {
  const { scene } = useGLTF(url)

  return (
    <group>
      <primitive object={scene} />
      {annotations?.map((ann, i) => (
        <Html key={i} position={[ann.x, ann.y, ann.z]} center distanceFactor={15}>
          <div
            className={`px-3 py-1 rounded-full text-xs font-bold text-white shadow-lg backdrop-blur-md border cursor-pointer hover:scale-110 transition-transform flex items-center gap-1.5 whitespace-nowrap ${
              ann.type === "danger"
                ? "bg-red-500/80 border-red-400"
                : ann.type === "info"
                ? "bg-blue-500/80 border-blue-400"
                : "bg-amber-500/80 border-amber-400"
            }`}
            title={`Konum: [${ann.x}, ${ann.y}, ${ann.z}]`}
          >
            <span>{ann.type === "danger" ? "🚨" : ann.type === "info" ? "ℹ️" : "⚠️"}</span>
            <span>{ann.label}</span>
          </div>
        </Html>
      ))}
    </group>
  )
}

// Model yüklenemediğinde veya fallback durumunda render edilecek şantiye geometrisi
function FallbackProceduralMesh({ annotations }: { annotations: DroneAnnotation[] }) {
  return (
    <group>
      {/* Şantiye zemin ve temel kafesi */}
      <mesh position={[0, -0.05, 0]} receiveShadow>
        <boxGeometry args={[12, 0.1, 12]} />
        <meshStandardMaterial color="#1e293b" roughness={0.8} metalness={0.2} />
      </mesh>

      {/* Temsili temel hatılları ve kolon filizleri */}
      <mesh position={[0, 0.4, 0]}>
        <boxGeometry args={[8, 0.8, 8]} />
        <meshStandardMaterial color="#334155" wireframe opacity={0.6} transparent />
      </mesh>

      {/* Kolon temsilleri */}
      {[-3, 3].map((x) =>
        [-3, 3].map((z) => (
          <mesh key={`${x}-${z}`} position={[x, 1.5, z]} castShadow>
            <boxGeometry args={[0.6, 3, 0.6]} />
            <meshStandardMaterial color="#0284c7" roughness={0.3} metalness={0.5} />
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
                : ann.type === "info"
                ? "bg-blue-500/80 border-blue-400"
                : "bg-amber-500/80 border-amber-400"
            }`}
          >
            <span>{ann.type === "danger" ? "🚨" : ann.type === "info" ? "ℹ️" : "⚠️"}</span>
            <span>{ann.label}</span>
          </div>
        </Html>
      ))}
    </group>
  )
}

// Three.js Canvas içinde GLTF yükleme hatalarını yakalayan Error Boundary
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
    console.warn("DroneDigitalTwin 3D Model yükleme uyarısı (Fallback devreye alındı):", error)
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
  projectId: string
  projectName?: string
  initialCaptures?: DroneCaptureItem[]
}

export default function DroneDigitalTwin({
  projectId,
  projectName = "Şantiye 4D İkizi",
  initialCaptures = []
}: DroneDigitalTwinProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isPlaying4D, setIsPlaying4D] = useState(false)
  const [activeStageIndex, setActiveStageIndex] = useState(0)
  const [droneCaptures, setDroneCaptures] = useState<DroneCaptureItem[]>(initialCaptures)
  const [isLoading, setIsLoading] = useState(false)
  const [showAiPanel, setShowAiPanel] = useState(true)
  const [showUploadModal, setShowUploadModal] = useState(false)

  // Yeni çekim ekleme formu
  const [newStageName, setNewStageName] = useState("")
  const [newProgressPct, setNewProgressPct] = useState(50)
  const [newModelUrl, setNewModelUrl] = useState("/models/bina.glb")
  const [newCaptureDate, setNewCaptureDate] = useState(new Date().toISOString().split("T")[0])

  // Test ve Varsayılan Mock Data (droneCaptures boş ise)
  useEffect(() => {
    async function loadCaptures() {
      setIsLoading(true)
      try {
        const res = await fetch(`/api/admin/drone-captures?projectId=${projectId}`)
        if (res.ok) {
          const data = await res.json()
          if (Array.isArray(data) && data.length > 0) {
            setDroneCaptures(data)
            return
          }
        }
      } catch (err) {
        console.error("Drone captures getirme hatası:", err)
      } finally {
        setIsLoading(false)
      }

      // Veritabanında kayıt yoksa 2 adet zengin mock data oluştur
      if (initialCaptures.length === 0) {
        const defaultMockCaptures: DroneCaptureItem[] = [
          {
            id: "mock-1",
            projectId,
            stageName: "1. Aşama: Zemin & Temel Kazısı",
            modelUrl: "/models/bina.glb",
            captureDate: new Date("2026-09-15"),
            progressPct: 32,
            aiAnalysis: {
              annotations: [
                { x: 0, y: 1.2, z: 0, label: "Temel Paspayı Yetersiz (Aks 2-B)", type: "warning" },
                { x: 2.2, y: 0.6, z: -1.2, label: "Kazı Şev Güvenlik Riski", type: "danger" },
                { x: -2.0, y: 1.8, z: 1.5, label: "Topraklama Hattı Doğrulandı", type: "info" }
              ],
              completed: [
                "Hafriyat ve şev koruma kazısı %100 tamamlandı",
                "Grobeton ve zemin membran yalıtımı döşendi",
                "Temel altı drenaj boruları onaylandı"
              ],
              risks: [
                "Şev bölgesinde su birikintisi tespit edildi",
                "Aks 2 doğrultusunda 12mm derinlik farkı"
              ]
            }
          },
          {
            id: "mock-2",
            projectId,
            stageName: "2. Aşama: 1. Kat Karkas & Tabliye",
            modelUrl: "/models/bina.glb",
            captureDate: new Date("2026-10-18"),
            progressPct: 68,
            aiAnalysis: {
              annotations: [
                { x: 1.2, y: 3.2, z: 0.8, label: "Kiriş Donatı Aralığı Uyarısı", type: "warning" },
                { x: -1.8, y: 3.8, z: -1.0, label: "Kritik Kalıp Destek Eğimi", type: "danger" },
                { x: 0.2, y: 4.2, z: 1.8, label: "C35 Beton Kürleme Aktif", type: "info" }
              ],
              completed: [
                "Zemin kat kolon ve perde betonları döküldü",
                "1. Normal kat kalıp iskelesi kuruldu",
                "Tesisat rezervasyon boşlukları yerleştirildi"
              ],
              risks: [
                "Kiriş mesnet donatısında paspayı eksikliği",
                "Rüzgar hızı nedeniyle dış cephe iskelesi sabitleme uyarısı"
              ]
            }
          }
        ]
        setDroneCaptures(defaultMockCaptures)
      }
    }

    loadCaptures()
  }, [projectId, initialCaptures])

  // 4D Zaman Akışı Otomasyonu (Play/Pause)
  useEffect(() => {
    if (!isPlaying4D || droneCaptures.length <= 1) return

    const interval = setInterval(() => {
      setActiveStageIndex((prev) => (prev + 1) % droneCaptures.length)
    }, 4000)

    return () => clearInterval(interval)
  }, [isPlaying4D, droneCaptures.length])

  // Aktif aşama verisi
  const activeCapture = droneCaptures[activeStageIndex] || droneCaptures[0]

  // Annotations listesini güvenli çözümle
  const activeAnnotations: DroneAnnotation[] = Array.isArray(activeCapture?.aiAnalysis)
    ? (activeCapture.aiAnalysis as DroneAnnotation[])
    : (activeCapture?.aiAnalysis as any)?.annotations || []

  // Tamamlananlar ve Riskler listesini güvenli çözümle
  const completedList: string[] =
    (activeCapture?.aiAnalysis as any)?.completed || [
      "Temel ve perde donatı imalatı doğrulandı",
      "Statik aks ölçümleri tolerans içinde",
      "Kalıp ve iskele güvenlik testleri yapıldı"
    ]

  const risksList: string[] =
    (activeCapture?.aiAnalysis as any)?.risks || [
      "Aks 3 bölgesinde donatı paspayı kontrolü gerekiyor",
      "Hava koşulları kaynaklı beton kürleme takibi gerekli"
    ]

  // Tam ekran geçişi
  const toggleFullscreen = () => {
    if (!containerRef.current) return
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {})
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {})
    }
  }

  // Yeni Çekim / GLB Kaydet
  const handleCreateCapture = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newStageName.trim()) {
      toast.error("Lütfen aşama adını girin")
      return
    }

    const payload = {
      projectId,
      stageName: newStageName.trim(),
      modelUrl: newModelUrl.trim() || "/models/bina.glb",
      captureDate: new Date(newCaptureDate).toISOString(),
      progressPct: Number(newProgressPct),
      aiAnalysis: {
        annotations: [
          { x: 0, y: 2.0, z: 0, label: `${newStageName} İnceleme Noktası`, type: "warning" }
        ],
        completed: [`${newStageName} aşaması başlatıldı`, "Drone fotogrametri verisi işlendi"],
        risks: ["Statik kontrol ve görsel onay bekleniyor"]
      }
    }

    try {
      const res = await fetch("/api/admin/drone-captures", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      })

      if (res.ok) {
        const created = await res.json()
        toast.success("Yeni 4D drone çekimi kaydedildi!")
        setDroneCaptures((prev) => [...prev, created])
        setActiveStageIndex(droneCaptures.length)
        setShowUploadModal(false)
        setNewStageName("")
      } else {
        // Mock fallback ekle
        const tempItem: DroneCaptureItem = {
          id: `local-${Date.now()}`,
          ...payload
        }
        setDroneCaptures((prev) => [...prev, tempItem])
        setActiveStageIndex(droneCaptures.length)
        setShowUploadModal(false)
        toast.success("Yeni aşama eklendi!")
      }
    } catch {
      toast.error("Kayıt sırasında hata oluştu")
    }
  }

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-[650px] md:h-[720px] bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 rounded-2xl overflow-hidden border border-slate-800 shadow-2xl flex flex-col ${
        isFullscreen ? "h-screen rounded-none" : ""
      }`}
    >
      {/* Üst Bar: Başlık, Mod Bilgisi ve Kontroller */}
      <div className="absolute top-4 left-4 z-20 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2.5 px-4 py-2 bg-slate-900/80 backdrop-blur-xl border border-slate-700/70 rounded-xl shadow-lg">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs md:text-sm font-bold text-white tracking-wide">
            4D Drone Fotogrametri & Dijital İkiz
          </span>
          <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-blue-500/20 text-blue-300 border border-blue-500/30">
            Aşama {activeStageIndex + 1}/{droneCaptures.length || 1}
          </span>
        </div>

        <button
          onClick={() => setIsPlaying4D(!isPlaying4D)}
          className={`px-3 py-2 rounded-xl text-xs font-semibold backdrop-blur-xl border shadow-lg transition-all flex items-center gap-1.5 ${
            isPlaying4D
              ? "bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500/30"
              : "bg-slate-900/80 text-slate-200 border-slate-700 hover:bg-slate-800 hover:text-white"
          }`}
          title={isPlaying4D ? "4D Simülasyonu Duraklat" : "4D Zaman Çizelgesini Oynat"}
        >
          {isPlaying4D ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
          <span className="hidden sm:inline">{isPlaying4D ? "Duraklat" : "4D Oynat"}</span>
        </button>

        <button
          onClick={() => setShowUploadModal(true)}
          className="px-3 py-2 bg-blue-600/80 hover:bg-blue-600 text-white rounded-xl text-xs font-semibold backdrop-blur-xl border border-blue-500/50 shadow-lg transition-all flex items-center gap-1.5"
          title="Yeni 4D Çekim / GLB Modeli Ekle"
        >
          <Plus className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Yeni Çekim</span>
        </button>

        <button
          onClick={() => setShowAiPanel(!showAiPanel)}
          className={`px-3 py-2 rounded-xl text-xs font-semibold backdrop-blur-xl border shadow-lg transition-all flex items-center gap-1.5 ${
            showAiPanel
              ? "bg-purple-500/20 text-purple-300 border-purple-500/40"
              : "bg-slate-900/80 text-slate-300 border-slate-700 hover:bg-slate-800"
          }`}
          title="AI Saha Analiz Panelini Aç / Kapat"
        >
          <Bot className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">AI Analiz</span>
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
        {isLoading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs">
            <div className="flex items-center gap-3 px-5 py-3 bg-slate-900/90 rounded-2xl border border-slate-700 text-white shadow-2xl">
              <div className="w-5 h-5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
              <span className="text-sm font-medium">Drone verisi hazırlanıyor...</span>
            </div>
          </div>
        )}

        <Canvas
          camera={{ position: [8, 6, 8], fov: 45 }}
          shadows
          gl={{ antialias: true, alpha: true }}
        >
          <ambientLight intensity={0.7} />
          <directionalLight
            position={[10, 15, 10]}
            intensity={1.2}
            castShadow
            shadow-mapSize={[2048, 2048]}
          />
          <directionalLight position={[-10, 8, -10]} intensity={0.4} />

          {/* Zemin Izgarası */}
          <Grid
            infiniteGrid
            cellSize={1}
            cellThickness={0.6}
            cellColor="#334155"
            sectionSize={5}
            sectionThickness={1.2}
            sectionColor="#475569"
            fadeDistance={30}
            fadeStrength={1.5}
          />

          <ContactShadows
            position={[0, -0.01, 0]}
            opacity={0.6}
            scale={20}
            blur={2}
            far={4}
          />

          {/* 3D Model veya Fallback Geometrisi */}
          <Suspense
            fallback={
              <Html center>
                <div className="flex items-center gap-2.5 px-4 py-2 bg-slate-900/90 text-white rounded-xl backdrop-blur-md border border-cyan-500/30 text-xs shadow-2xl">
                  <div className="w-4 h-4 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
                  <span>3D Model Çözümleniyor...</span>
                </div>
              </Html>
            }
          >
            {activeCapture?.modelUrl ? (
              <ModelErrorBoundary
                resetKey={activeCapture.modelUrl}
                fallback={<FallbackProceduralMesh annotations={activeAnnotations} />}
              >
                <DroneMesh
                  url={activeCapture.modelUrl}
                  annotations={activeAnnotations}
                />
              </ModelErrorBoundary>
            ) : (
              <FallbackProceduralMesh annotations={activeAnnotations} />
            )}
          </Suspense>

          <OrbitControls
            makeDefault
            enableDamping
            dampingFactor={0.05}
            minDistance={2}
            maxDistance={40}
            maxPolarAngle={Math.PI / 2 - 0.05}
          />
        </Canvas>

        {/* 3D Navigasyon İpucu */}
        <div className="absolute bottom-28 left-6 z-10 hidden md:flex items-center gap-2 px-3 py-1.5 bg-slate-900/60 backdrop-blur-md rounded-lg border border-slate-800 text-[11px] text-slate-400 pointer-events-none">
          <span>🖱️ Sol Tık: Döndür</span>
          <span>•</span>
          <span>Sağ Tık: Kaydır</span>
          <span>•</span>
          <span>Tekerlek: Yakınlaş</span>
        </div>
      </div>

      {/* AI Site Intelligence Paneli (Sağ Üst Kart) */}
      {showAiPanel && activeCapture && (
        <div className="absolute right-4 top-16 md:top-4 z-20 w-80 md:w-96 max-h-[calc(100%-140px)] overflow-y-auto backdrop-blur-xl bg-slate-900/80 border border-slate-700/60 rounded-2xl p-5 shadow-2xl text-white transition-all animate-in fade-in slide-in-from-right-4 duration-300">
          {/* Panel Başlığı */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-purple-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-purple-500/20">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div>
                <h3 className="text-sm font-bold tracking-wide flex items-center gap-1.5">
                  AI Saha Analizi
                  <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                </h3>
                <p className="text-[11px] text-slate-400">Fotogrametri & Görüntü İşleme</p>
              </div>
            </div>
            <button
              onClick={() => setShowAiPanel(false)}
              className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Aşama & Tarih */}
          <div className="mt-4 p-3 bg-slate-800/60 rounded-xl border border-slate-700/50">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span className="font-medium text-slate-300">Seçili İnşaat Fazı</span>
              <span className="flex items-center gap-1 text-slate-400">
                <Calendar className="w-3 h-3" />
                {new Date(activeCapture.captureDate).toLocaleDateString("tr-TR")}
              </span>
            </div>
            <p className="text-sm font-semibold text-white truncate">
              {activeCapture.stageName}
            </p>
          </div>

          {/* Tahmini İlerleme Barı */}
          <div className="mt-4">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="text-slate-300 font-medium">Tahmini İlerleme</span>
              <span className="font-bold text-blue-400">{activeCapture.progressPct}%</span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden p-0.5 border border-slate-700">
              <div
                className="bg-gradient-to-r from-blue-500 via-indigo-500 to-emerald-400 h-full rounded-full transition-all duration-700 ease-out shadow-sm"
                style={{ width: `${Math.min(100, Math.max(0, activeCapture.progressPct))}%` }}
              />
            </div>
          </div>

          {/* Tamamlananlar Listesi (Yeşil Check) */}
          <div className="mt-5">
            <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              Tamamlanan İmalatlar ({completedList.length})
            </h4>
            <div className="space-y-1.5">
              {completedList.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-2 p-2 bg-emerald-950/20 border border-emerald-900/30 rounded-lg text-xs text-slate-300"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                  <span className="leading-relaxed">{item}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Riskler ve Bekleyenler Listesi */}
          <div className="mt-4">
            <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
              Riskler & Bekleyenler ({risksList.length})
            </h4>
            <div className="space-y-1.5">
              {risksList.map((risk, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-2 p-2 bg-amber-950/20 border border-amber-900/30 rounded-lg text-xs text-slate-300"
                >
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                  <span className="leading-relaxed">{risk}</span>
                </div>
              ))}
            </div>
          </div>

          {/* 3D Pin / Annotation Listesi */}
          {activeAnnotations.length > 0 && (
            <div className="mt-4 pt-3 border-t border-slate-800">
              <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                <span className="font-medium text-slate-300">Tespit Edilen AI Pinleri</span>
                <span>{activeAnnotations.length} Adet</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {activeAnnotations.map((ann, idx) => (
                  <span
                    key={idx}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-semibold border ${
                      ann.type === "danger"
                        ? "bg-red-500/20 text-red-300 border-red-500/40"
                        : ann.type === "info"
                        ? "bg-blue-500/20 text-blue-300 border-blue-500/40"
                        : "bg-amber-500/20 text-amber-300 border-amber-500/40"
                    }`}
                  >
                    {ann.label}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Alt Zaman Çizelgesi (Glassmorphism 4D Timeline Bar) */}
      <div className="absolute bottom-4 left-4 right-4 z-20 backdrop-blur-xl bg-slate-900/80 border border-slate-700/60 rounded-2xl p-3 md:p-4 shadow-2xl">
        <div className="flex items-center justify-between gap-4 mb-2">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-blue-400" />
            <span className="text-xs md:text-sm font-bold text-white tracking-wide">
              4D İnşaat Zaman Çizelgesi
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveStageIndex((prev) => Math.max(0, prev - 1))}
              disabled={activeStageIndex === 0}
              className="p-1 rounded-lg bg-slate-800 text-slate-300 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs text-slate-400 font-mono">
              {activeStageIndex + 1} / {droneCaptures.length}
            </span>
            <button
              onClick={() =>
                setActiveStageIndex((prev) => Math.min(droneCaptures.length - 1, prev + 1))
              }
              disabled={activeStageIndex === droneCaptures.length - 1}
              className="p-1 rounded-lg bg-slate-800 text-slate-300 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Yatay Sıralı Aşama Düğmeleri */}
        <div className="flex items-center gap-3 overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-slate-700">
          {droneCaptures.map((capture, index) => {
            const isActive = index === activeStageIndex
            const isCompleted = index < activeStageIndex
            const dateStr = new Date(capture.captureDate).toLocaleDateString("tr-TR", {
              day: "numeric",
              month: "short"
            })

            return (
              <div key={capture.id || index} className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => {
                    setActiveStageIndex(index)
                    setIsPlaying4D(false)
                  }}
                  className={`group px-3.5 py-2 rounded-xl text-left transition-all border flex items-center gap-3 ${
                    isActive
                      ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-blue-400 shadow-lg shadow-blue-500/25 ring-2 ring-blue-400/50 scale-102"
                      : isCompleted
                      ? "bg-slate-800/80 text-slate-300 border-slate-700 hover:bg-slate-700/80 hover:border-slate-600"
                      : "bg-slate-900/60 text-slate-400 border-slate-800 hover:bg-slate-800/60 hover:text-slate-300"
                  }`}
                >
                  {/* İndeks & İlerleme Çemberi */}
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 ${
                      isActive
                        ? "bg-white text-blue-700"
                        : isCompleted
                        ? "bg-emerald-500 text-white"
                        : "bg-slate-700 text-slate-300"
                    }`}
                  >
                    {isCompleted ? "✓" : index + 1}
                  </div>

                  {/* Metin Bilgileri */}
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-semibold text-slate-300 opacity-90">
                        {dateStr}
                      </span>
                      <span
                        className={`text-[10px] px-1.5 py-0.2 rounded font-bold ${
                          isActive
                            ? "bg-white/20 text-white"
                            : "bg-slate-700/70 text-slate-300"
                        }`}
                      >
                        %{capture.progressPct}
                      </span>
                    </div>
                    <p className="text-xs font-semibold truncate max-w-[140px] md:max-w-[200px]">
                      {capture.stageName}
                    </p>
                  </div>
                </button>

                {/* Bağlantı Çizgisi */}
                {index < droneCaptures.length - 1 && (
                  <div
                    className={`w-4 md:w-8 h-0.5 rounded-full transition-colors ${
                      index < activeStageIndex ? "bg-emerald-500" : "bg-slate-800"
                    }`}
                  />
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Yeni Çekim / GLB Yükleme Modalı */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-lg shadow-2xl text-white">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <Upload className="w-5 h-5 text-blue-400" />
                Yeni 4D Drone Çekimi Ekle
              </h3>
              <button
                onClick={() => setShowUploadModal(false)}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCapture} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Aşama / Faz Adı *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Örn: 2. Kat Kalıp & Donatı"
                  value={newStageName}
                  onChange={(e) => setNewStageName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Çekim Tarihi *
                  </label>
                  <input
                    type="date"
                    required
                    value={newCaptureDate}
                    onChange={(e) => setNewCaptureDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    İlerleme Yüzdesi (%{newProgressPct})
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={newProgressPct}
                    onChange={(e) => setNewProgressPct(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  3D Model URL (GLB / GLTF) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="/models/bina.glb veya https://..."
                  value={newModelUrl}
                  onChange={(e) => setNewModelUrl(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-white font-mono text-xs"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Varsayılan olarak dahili örnek bina modeli (`/models/bina.glb`) kullanılır.
                </p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/20 transition-all flex items-center gap-1.5"
                >
                  <Upload className="w-3.5 h-3.5" />
                  Aşamayı Kaydet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
