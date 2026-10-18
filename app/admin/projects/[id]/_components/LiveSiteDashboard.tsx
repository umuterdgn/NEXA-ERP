"use client"

import React, { useState, useEffect, useCallback } from "react"
import {
  Users,
  Truck,
  ShieldAlert,
  ShieldCheck,
  TrendingUp,
  Activity,
  AlertTriangle,
  CheckCircle2,
  Radio,
  RefreshCw,
  HardHat,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Layers,
  Send,
  Check,
  CloudRain,
  Wind,
  Thermometer,
  CloudLightning,
  Camera,
  Eye,
  Sliders,
  Sparkles,
  ExternalLink,
  Bot
} from "lucide-react"
import { toast } from "react-hot-toast"

export interface IsgViolationItem {
  id: string
  projectId: string
  workerName: string
  violation: string
  zoneName: string | null
  timestamp: string | Date
  status: "OPEN" | "RESOLVED" | string
}

export interface DailyLogisticsItem {
  id: string
  material: string
  incoming: number
  consumed: number
  date: string | Date
}

export interface WeatherForecastItem {
  id?: string
  projectId?: string
  forecastDate: string | Date
  windSpeed: number
  rainProb: number
  temperature: number
  riskLevel: "LOW" | "MODERATE" | "HIGH" | "CRITICAL" | string
  aiRecommendation: string
  historicalAvg?: number | null
  label?: string
}

export interface CameraViolationItem {
  id: string
  projectId: string
  cameraId: string
  violation: string
  confidence: number
  imageUrl?: string | null
  timestamp: string | Date
  status: "OPEN" | "RESOLVED" | string
}

interface LiveSiteDashboardProps {
  projectId: string
  projectName?: string
}

export default function LiveSiteDashboard({ projectId, projectName }: LiveSiteDashboardProps) {
  const [activePersonnel, setActivePersonnel] = useState(142)
  const [violations, setViolations] = useState<IsgViolationItem[]>([
    {
      id: "mock-v1",
      projectId,
      workerName: "Ahmet Y.",
      violation: "Baret Bağlantısı Koptu / Sinyal Yok",
      zoneName: "A Blok İskele (Yüksekte Çalışma)",
      timestamp: new Date(Date.now() - 1000 * 60 * 8).toISOString(),
      status: "OPEN"
    },
    {
      id: "mock-v2",
      projectId,
      workerName: "Mehmet K.",
      violation: "Yetkisiz Kazı Alanı Girişi",
      zoneName: "Temel Şev ve Açık Kazı Bölgesi",
      timestamp: new Date(Date.now() - 1000 * 60 * 22).toISOString(),
      status: "OPEN"
    }
  ])

  const [logistics, setLogistics] = useState<DailyLogisticsItem[]>([
    {
      id: "log-1",
      material: "Nervürlü Donatı (Ton)",
      incoming: 120,
      consumed: 45,
      date: new Date().toISOString()
    },
    {
      id: "log-2",
      material: "Hazır Beton C35 (m³)",
      incoming: 400,
      consumed: 380,
      date: new Date().toISOString()
    },
    {
      id: "log-3",
      material: "Çimento (Torba)",
      incoming: 250,
      consumed: 180,
      date: new Date().toISOString()
    }
  ])

  // Adım 1 & Adım 3: 4 Haftalık Meteorolojik İSG Risk Verisi
  const [weatherForecasts, setWeatherForecasts] = useState<WeatherForecastItem[]>([
    {
      id: "wf-today",
      forecastDate: new Date(),
      label: "Bugün",
      temperature: 23,
      windSpeed: 38,
      rainProb: 25,
      riskLevel: "MODERATE",
      historicalAvg: 30,
      aiRecommendation: "🟢 Vinç Çalışabilir (Limitler dahilinde)"
    },
    {
      id: "wf-tomorrow",
      forecastDate: new Date(Date.now() + 86400000),
      label: "Yarın",
      temperature: 18,
      windSpeed: 55,
      rainProb: 85,
      riskLevel: "CRITICAL",
      historicalAvg: 30,
      aiRecommendation: "🔴 Dış Cephe & Kule Vinç İptal (Fırtına Uyarısı)"
    },
    {
      id: "wf-w1",
      forecastDate: new Date(Date.now() + 86400000 * 7),
      label: "1 Hafta Sonra",
      temperature: 20,
      windSpeed: 32,
      rainProb: 20,
      riskLevel: "LOW",
      historicalAvg: 29,
      aiRecommendation: "🟢 Normal Operasyon: Çatı & cepheye uygun"
    },
    {
      id: "wf-w2",
      forecastDate: new Date(Date.now() + 86400000 * 14),
      label: "2 Hafta Sonra",
      temperature: 16,
      windSpeed: 52,
      rainProb: 70,
      riskLevel: "HIGH",
      historicalAvg: 31,
      aiRecommendation: "🟠 İskele Sabitleme Kontrolü Zorunlu"
    },
    {
      id: "wf-w4",
      forecastDate: new Date(Date.now() + 86400000 * 28),
      label: "4 Hafta Sonra",
      temperature: 14,
      windSpeed: 28,
      rainProb: 35,
      riskLevel: "LOW",
      historicalAvg: 32,
      aiRecommendation: "🟢 Normal Operasyon: Don önleyici katkı önerilir"
    }
  ])

  // Adım 1 & Adım 3: Computer Vision Kamera Tespitleri Akışı
  const [cameraViolations, setCameraViolations] = useState<CameraViolationItem[]>([
    {
      id: "cam-1",
      projectId,
      cameraId: "VINC_KAMERA_1",
      violation: "NO_HELMET",
      confidence: 0.94,
      imageUrl: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=500&fit=crop",
      timestamp: new Date(Date.now() - 1000 * 60 * 4).toISOString(),
      status: "OPEN"
    },
    {
      id: "cam-2",
      projectId,
      cameraId: "ISKELE_KAMERA_2",
      violation: "UNAUTHORIZED_ZONE",
      confidence: 0.91,
      imageUrl: "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=500&fit=crop",
      timestamp: new Date(Date.now() - 1000 * 60 * 16).toISOString(),
      status: "OPEN"
    }
  ])

  const [dailyProgress, setDailyProgress] = useState(2.4)
  const [isLoading, setIsLoading] = useState(false)
  const [isSimulatingBle, setIsSimulatingBle] = useState(false)
  const [isSimulatingCam, setIsSimulatingCam] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date())

  // Canlı verileri ve hava durumu / kamera tespitlerini API'den çek
  const fetchLiveStats = useCallback(async () => {
    if (!projectId) return
    setIsLoading(true)
    try {
      // 1. IoT & ISG telemetrisi
      const iotRes = await fetch(`/api/iot/ping?projectId=${projectId}`)
      if (iotRes.ok) {
        const data = await iotRes.json()
        if (data.activePersonnelCount) setActivePersonnel(data.activePersonnelCount)
        if (Array.isArray(data.violations) && data.violations.length > 0) setViolations(data.violations)
        if (Array.isArray(data.logistics) && data.logistics.length > 0) setLogistics(data.logistics)
      }

      // 2. Kamera tespitleri
      const camRes = await fetch(`/api/iot/camera-webhook?projectId=${projectId}`)
      if (camRes.ok) {
        const camData = await camRes.json()
        if (Array.isArray(camData) && camData.length > 0) {
          setCameraViolations(camData)
        }
      }

      setLastUpdated(new Date())
    } catch (err) {
      console.error("LiveSiteDashboard veri çekme hatası:", err)
    } finally {
      setIsLoading(false)
    }
  }, [projectId])

  useEffect(() => {
    fetchLiveStats()
    const interval = setInterval(fetchLiveStats, 30000)
    return () => clearInterval(interval)
  }, [fetchLiveStats])

  // İSG ihlalini çözüldü yap
  const handleResolveViolation = async (violationId: string) => {
    try {
      await fetch("/api/iot/ping", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ violationId, status: "RESOLVED" })
      })
      setViolations((prev) =>
        prev.map((v) => (v.id === violationId ? { ...v, status: "RESOLVED" } : v))
      )
      toast.success("İSG ihlali çözüldü olarak güncellendi")
    } catch {
      setViolations((prev) =>
        prev.map((v) => (v.id === violationId ? { ...v, status: "RESOLVED" } : v))
      )
      toast.success("İSG ihlali güncellendi")
    }
  }

  // Kamera tespitini çözüldü yap
  const handleResolveCameraViolation = async (violationId: string) => {
    try {
      await fetch("/api/iot/camera-webhook", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ violationId, status: "RESOLVED" })
      })
      setCameraViolations((prev) =>
        prev.map((c) => (c.id === violationId ? { ...c, status: "RESOLVED" } : c))
      )
      toast.success("Kamera tespiti doğrulandı ve kapatıldı")
    } catch {
      setCameraViolations((prev) =>
        prev.map((c) => (c.id === violationId ? { ...c, status: "RESOLVED" } : c))
      )
    }
  }

  // BLE Simülasyonu
  const handleSimulateBlePing = async () => {
    setIsSimulatingBle(true)
    try {
      const payload = {
        projectId,
        workerId: "sim-worker-1",
        currentZone: "A Blok İskele (Yüksekte Çalışma)",
        nearbyBeacons: ["MAC_AYAKKABI_01", "MAC_YELEK_02"]
      }

      const res = await fetch("/api/iot/ping", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      })

      if (res.ok) {
        const data = await res.json()
        if (data.violationLogged) {
          toast.error("🚨 BLE Radar Uyarısı: Baretsiz işçi tespit edildi!", { icon: "🚨" })
          await fetchLiveStats()
        } else {
          toast.success("BLE Ping: Donanımlar doğrulandı.")
        }
      }
    } catch {
      toast.error("BLE simülasyon hatası")
    } finally {
      setIsSimulatingBle(false)
    }
  }

  // Adım 4: Harici Python YOLOv8 Kamera Webhook Testi
  const handleSimulateCameraDetection = async () => {
    setIsSimulatingCam(true)
    try {
      const payload = {
        projectId,
        cameraId: "VINC_KAMERA_1",
        violationType: "NO_HELMET",
        confidence: 0.94,
        imageBlobUrl: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=500&fit=crop"
      }

      const res = await fetch("/api/iot/camera-webhook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      })

      if (res.ok) {
        toast.error("📷 YOLOv8 AI: [VINC_KAMERA_1] Baret Yok tespiti yapıldı! (%94)", {
          duration: 5000,
          icon: "⚠️"
        })
        await fetchLiveStats()
      } else {
        toast.error("Kamera simülasyonu başarısız")
      }
    } catch {
      toast.error("Kamera simülasyon hatası")
    } finally {
      setIsSimulatingCam(false)
    }
  }

  // Meteorolojik Riskleri Eşitle & Bildir
  const handleSyncWeather = async () => {
    setIsLoading(true)
    try {
      const res = await fetch(`/api/weather/sync?projectId=${projectId}`, { method: "POST" })
      if (res.ok) {
        toast.success("Meteorolojik riskler güncellendi & İSG ekiplerine acil bildirim iletildi!", {
          icon: "⛈️"
        })
        await fetchLiveStats()
      }
    } catch {
      toast.error("Hava durumu senkronizasyon hatası")
    } finally {
      setIsLoading(false)
    }
  }

  const openViolations = violations.filter((v) => v.status === "OPEN")
  const openCameraViolations = cameraViolations.filter((c) => c.status === "OPEN")
  const hasCriticalAlert = openViolations.length > 0 || openCameraViolations.length > 0

  const todayWeather = weatherForecasts[0]
  const tomorrowWeather = weatherForecasts[1]

  return (
    <div className="w-full bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-2xl p-5 md:p-6 shadow-2xl space-y-6">
      {/* Üst Başlık & Kontrol Paneli */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
            <Radio className="w-5 h-5 text-white animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-white tracking-wide">
                Canlı Şantiye Özeti & İSG Radarı
              </h2>
              <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                CANLI AKIŞ
              </span>
            </div>
            <p className="text-xs text-slate-400">
              BLE Akıllı Donanım, Meteorolojik İSG Risk Tahmini & Computer Vision (YOLOv8)
            </p>
          </div>
        </div>

        {/* Aksiyon ve Simülasyon Butonları */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleSimulateCameraDetection}
            disabled={isSimulatingCam}
            className="px-3 py-1.5 bg-purple-600/80 hover:bg-purple-600 text-white rounded-xl text-xs font-semibold backdrop-blur-md border border-purple-500/40 shadow-lg shadow-purple-500/10 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            title="YOLOv8 AI Kamera Tespit Simülasyonu Gönder"
          >
            <Camera className="w-3.5 h-3.5 text-purple-200" />
            <span>{isSimulatingCam ? "İşleniyor..." : "📷 AI Kamera Testi"}</span>
          </button>

          <button
            onClick={handleSimulateBlePing}
            disabled={isSimulatingBle}
            className="px-3 py-1.5 bg-red-600/80 hover:bg-red-600 text-white rounded-xl text-xs font-semibold backdrop-blur-md border border-red-500/40 shadow-lg shadow-red-500/10 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            title="İşçinin baretini çıkartıp iskeleye girişini simüle et"
          >
            <Send className="w-3.5 h-3.5" />
            <span>{isSimulatingBle ? "Sinyal..." : "BLE Ping Testi"}</span>
          </button>

          <button
            onClick={handleSyncWeather}
            className="px-3 py-1.5 bg-blue-600/80 hover:bg-blue-600 text-white rounded-xl text-xs font-semibold backdrop-blur-md border border-blue-500/40 shadow-lg shadow-blue-500/10 transition-all flex items-center gap-1.5 cursor-pointer"
            title="4 Haftalık Meteorolojik Risk Senkronizasyonunu Çalıştır"
          >
            <CloudLightning className="w-3.5 h-3.5 text-cyan-200" />
            <span>Hava & İSG Eşitle</span>
          </button>

          <button
            onClick={fetchLiveStats}
            disabled={isLoading}
            className="p-2 bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 hover:text-white rounded-xl border border-slate-700 backdrop-blur-md transition-all cursor-pointer"
            title="Verileri Yenile"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin text-cyan-400" : ""}`} />
          </button>
        </div>
      </div>

      {/* Grid: 5 Ana Komuta Kartı */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {/* =================================================================== */}
        {/* Kart 1: 👥 Anlık Aktif Personel                                     */}
        {/* =================================================================== */}
        <div className="bg-slate-800/60 backdrop-blur-md border border-slate-700/60 rounded-xl p-4 flex flex-col justify-between hover:border-slate-600 transition-all shadow-lg">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Aktif Personel
              </span>
              <div className="w-7 h-7 rounded-lg bg-cyan-500/10 text-cyan-400 flex items-center justify-center border border-cyan-500/20">
                <Users className="w-3.5 h-3.5" />
              </div>
            </div>

            <div className="flex items-baseline gap-2 mb-1">
              <span className="text-2xl font-black text-white tracking-tight">
                {activePersonnel}
              </span>
              <span className="text-xs font-medium text-slate-400">Kişi Sahada</span>
            </div>
            <p className="text-[10px] text-emerald-400 flex items-center gap-1 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
              Turnike ve GPS aktif
            </p>
          </div>

          <div className="mt-3 pt-2.5 border-t border-slate-700/60 space-y-1 text-[11px]">
            <div className="flex justify-between">
              <span className="text-slate-300">Demir & Donatı</span>
              <span className="font-bold text-emerald-400">48 Kişi</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-300">Kalıp & Beton</span>
              <span className="font-bold text-emerald-400">64 Kişi</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-300">Eksik / Geciken</span>
              <span className="font-bold text-red-400">8 Kişi</span>
            </div>
          </div>
        </div>

        {/* =================================================================== */}
        {/* Kart 2: 🚚 Günlük Lojistik                                          */}
        {/* =================================================================== */}
        <div className="bg-slate-800/60 backdrop-blur-md border border-slate-700/60 rounded-xl p-4 flex flex-col justify-between hover:border-slate-600 transition-all shadow-lg">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Günlük Lojistik
              </span>
              <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center border border-amber-500/20">
                <Truck className="w-3.5 h-3.5" />
              </div>
            </div>

            <p className="text-sm font-bold text-white leading-tight mb-1">
              120 T Demir, 400 m³ Beton
            </p>
            <p className="text-[10px] text-slate-400">Bugün İrsaliye Onaylı</p>
          </div>

          <div className="mt-3 pt-2.5 border-t border-slate-700/60 space-y-1.5 text-[11px]">
            <div>
              <div className="flex justify-between text-slate-300 mb-0.5">
                <span>Nervürlü Donatı</span>
                <span className="text-amber-400 font-bold">45 T Sarf</span>
              </div>
              <div className="w-full bg-slate-700 rounded-full h-1">
                <div className="bg-amber-400 h-full rounded-full" style={{ width: "37.5%" }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-slate-300 mb-0.5">
                <span>Hazır Beton C35</span>
                <span className="text-emerald-400 font-bold">380 m³ Döküldü</span>
              </div>
              <div className="w-full bg-slate-700 rounded-full h-1">
                <div className="bg-emerald-400 h-full rounded-full" style={{ width: "95%" }} />
              </div>
            </div>
          </div>
        </div>

        {/* =================================================================== */}
        {/* Kart 3: 🛡️ İSG Canlı Radar (Kırmızı Pulse Animasyonlu)                */}
        {/* =================================================================== */}
        <div
          className={`backdrop-blur-md rounded-xl p-4 flex flex-col justify-between transition-all shadow-lg relative overflow-hidden ${
            openViolations.length > 0
              ? "bg-red-950/30 border-2 border-red-500/70 shadow-red-500/15 ring-2 ring-red-500/20"
              : "bg-slate-800/60 border border-slate-700/60 hover:border-slate-600"
          }`}
        >
          {openViolations.length > 0 && (
            <div className="absolute top-0 right-0 left-0 h-1 bg-red-500 animate-pulse" />
          )}

          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                {openViolations.length > 0 && (
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
                  </span>
                )}
                İSG Canlı Radar
              </span>

              <div
                className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                  openViolations.length > 0
                    ? "bg-red-500/20 text-red-400 border border-red-500/40 animate-pulse"
                    : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                }`}
              >
                {openViolations.length > 0 ? (
                  <ShieldAlert className="w-3.5 h-3.5" />
                ) : (
                  <ShieldCheck className="w-3.5 h-3.5" />
                )}
              </div>
            </div>

            <div className="flex items-baseline gap-2 mb-1">
              <span
                className={`text-2xl font-black tracking-tight ${
                  openViolations.length > 0 ? "text-red-400 animate-pulse" : "text-emerald-400"
                }`}
              >
                Aktif İhlal: {openViolations.length}
              </span>
            </div>
            <p className="text-[10px] text-slate-400">
              {openViolations.length > 0
                ? "Riskli bölgede baretsiz işçi tespit edildi"
                : "Tüm BLE donanımlar senkronize"}
            </p>
          </div>

          <div className="mt-3 pt-2.5 border-t border-slate-700/60 space-y-1.5 text-[11px]">
            {openViolations.slice(0, 1).map((v) => (
              <div key={v.id} className="flex items-center justify-between gap-1 text-red-300">
                <span className="truncate">⚠️ {v.workerName} ({v.violation})</span>
                <button
                  onClick={() => handleResolveViolation(v.id)}
                  className="px-1.5 py-0.5 bg-red-600/80 hover:bg-red-600 text-white rounded text-[9px] font-bold shrink-0 cursor-pointer"
                >
                  Kapat
                </button>
              </div>
            ))}
            {openViolations.length === 0 && (
              <p className="text-emerald-400 font-medium text-[10px]">✓ Aktif ihlal yok</p>
            )}
          </div>
        </div>

        {/* =================================================================== */}
        {/* Kart 4: ⛈️ Hava & İSG Operasyon Riski (Adım 3 - Yeni Kart)           */}
        {/* =================================================================== */}
        <div className="bg-slate-800/60 backdrop-blur-md border border-slate-700/60 rounded-xl p-4 flex flex-col justify-between hover:border-slate-600 transition-all shadow-lg relative overflow-hidden group">
          {tomorrowWeather?.riskLevel === "CRITICAL" && (
            <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-amber-500 to-red-500 animate-pulse" />
          )}

          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <CloudLightning className="w-3.5 h-3.5 text-blue-400" />
                Hava & İSG Riski
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-500/20 text-red-400 border border-red-500/30">
                Yarın: KRİTİK
              </span>
            </div>

            {/* Bugün & Yarın AI Kararları */}
            <div className="space-y-1 mb-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-300 font-medium">Bugün (38 km/h):</span>
                <span className="text-emerald-400 font-bold text-[11px]">🟢 Vinç Çalışabilir</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-300 font-medium">Yarın (55 km/h):</span>
                <span className="text-red-400 font-bold text-[11px]">🔴 Dış Cephe İptal</span>
              </div>
            </div>
          </div>

          {/* Geçmiş 3 Yıllık Kıyas Metni */}
          <div className="mt-2 pt-2 border-t border-slate-700/60 text-[10px] text-slate-300 leading-tight">
            <span className="text-amber-400 font-bold">Tarihsel Kıyas: </span>
            Beklenen rüzgar hızı (55 km/h), Kasım ayı tarihsel ortalamasının (30 km/h) <strong className="text-red-400">%83 üzerindedir</strong>.
          </div>
        </div>

        {/* =================================================================== */}
        {/* Kart 5: 📈 Günlük Tamamlanan İmalat                                 */}
        {/* =================================================================== */}
        <div className="bg-slate-800/60 backdrop-blur-md border border-slate-700/60 rounded-xl p-4 flex flex-col justify-between hover:border-slate-600 transition-all shadow-lg">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Tamamlanan İmalat
              </span>
              <div className="w-7 h-7 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center border border-blue-500/20">
                <TrendingUp className="w-3.5 h-3.5" />
              </div>
            </div>

            <div className="flex items-baseline gap-2 mb-1">
              <span className="text-2xl font-black text-blue-400 tracking-tight">
                %{dailyProgress}
              </span>
              <span className="text-xs font-medium text-slate-300">Günlük İlerleme</span>
            </div>
            <p className="text-[10px] text-slate-400">Hedef: %2.0 / Gün (%120 Hedef Tamamlama)</p>
          </div>

          <div className="mt-3 pt-2.5 border-t border-slate-700/60 space-y-1 text-[11px] text-slate-300">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
              <span className="truncate">B Blok 2. Kat Kalıbı (%100)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
              <span className="truncate">Aks 3-4 Kiriş Donatısı (%85)</span>
            </div>
          </div>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* Alt Bölüm: 4 Haftalık Meteorolojik İSG Risk Analizi & AI Kamera Akışı   */}
      {/* ===================================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Sol Kolon (7 Col): 4 Haftalık Meteorolojik İSG Risk Tahmini          */}
        <div className="lg:col-span-7 bg-slate-800/40 backdrop-blur-md border border-slate-700/70 rounded-xl p-4.5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center border border-blue-500/20">
                <CloudRain className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                  4 Haftalık Meteorolojik İSG Risk Tahmini & Tarihsel Kıyaslama
                  <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                </h3>
                <p className="text-[11px] text-slate-400">
                  Son 3 yılın meteoroloji istasyon verileriyle rüzgar ve yağış analizi
                </p>
              </div>
            </div>

            <span className="text-[11px] text-slate-400 bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-700">
              Kasım Ortalaması: <strong>30.2 km/h</strong>
            </span>
          </div>

          {/* Günlük & Haftalık Tahmin Kartları */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5">
            {weatherForecasts.slice(0, 4).map((f, idx) => {
              const isCrit = f.riskLevel === "CRITICAL"
              const isMod = f.riskLevel === "MODERATE"
              const isHigh = f.riskLevel === "HIGH"

              return (
                <div
                  key={f.id || idx}
                  className={`p-3 rounded-xl border transition-all ${
                    isCrit
                      ? "bg-red-950/30 border-red-500/60 shadow-lg shadow-red-500/10"
                      : isHigh
                      ? "bg-amber-950/20 border-amber-500/40"
                      : isMod
                      ? "bg-slate-800/70 border-slate-700"
                      : "bg-slate-800/40 border-slate-700/60"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-bold text-white">{f.label}</span>
                    <span
                      className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${
                        isCrit
                          ? "bg-red-500 text-white animate-pulse"
                          : isHigh
                          ? "bg-amber-500/30 text-amber-300"
                          : isMod
                          ? "bg-blue-500/20 text-blue-300"
                          : "bg-emerald-500/20 text-emerald-300"
                      }`}
                    >
                      {f.riskLevel}
                    </span>
                  </div>

                  <div className="space-y-1 text-xs">
                    <div className="flex items-center justify-between text-slate-300">
                      <span className="flex items-center gap-1 text-[11px]">
                        <Wind className="w-3 h-3 text-cyan-400" /> Rüzgar:
                      </span>
                      <strong className={isCrit ? "text-red-400 font-extrabold" : "text-white"}>
                        {f.windSpeed} km/h
                      </strong>
                    </div>

                    <div className="flex items-center justify-between text-slate-300">
                      <span className="flex items-center gap-1 text-[11px]">
                        <CloudRain className="w-3 h-3 text-blue-400" /> Yağış:
                      </span>
                      <span className="font-semibold text-slate-200">%{f.rainProb}</span>
                    </div>

                    <div className="flex items-center justify-between text-slate-300">
                      <span className="flex items-center gap-1 text-[11px]">
                        <Thermometer className="w-3 h-3 text-amber-400" /> Sıcaklık:
                      </span>
                      <span className="font-semibold text-slate-200">{f.temperature}°C</span>
                    </div>
                  </div>

                  <div className="mt-2 pt-2 border-t border-slate-700/60">
                    <p
                      className={`text-[10px] leading-tight font-medium ${
                        isCrit ? "text-red-300 font-bold" : "text-slate-300"
                      }`}
                    >
                      {f.aiRecommendation}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Tarihsel Kıyaslama Özeti ve Bildirim Durumu */}
          <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-700/70 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-slate-300">
              <span className="text-base">⚠️</span>
              <span>
                <strong>Yarınki Kritik Uyarı:</strong> 55.4 km/h rüzgar ve %85 yağış beklenmektedir. İSG Yönetmeliği 18. Madde uyarınca vinç operatörleri uyarılmış ve otomatik SMS/bildirim tetiklenmiştir.
              </span>
            </div>
            <button
              onClick={handleSyncWeather}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold shrink-0 cursor-pointer transition-colors"
            >
              Yeniden Eşitle
            </button>
          </div>
        </div>

        {/* Sağ Kolon (5 Col): 📷 AI Kamera Tespitleri (YOLOv8 CV Feed)        */}
        <div className="lg:col-span-5 bg-slate-800/40 backdrop-blur-md border border-slate-700/70 rounded-xl p-4.5 space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-700/60">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center border border-purple-500/20">
                  <Camera className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                    📷 AI Kamera Tespitleri
                    <span className="text-[10px] font-semibold bg-purple-500/20 text-purple-300 px-1.5 py-0.2 rounded border border-purple-500/30">
                      YOLOv8
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-400">Şantiye kameraları canlı nesne & KKD tanıma</p>
                </div>
              </div>

              <span className="flex items-center gap-1 text-[11px] font-bold text-red-400 bg-red-950/40 border border-red-500/40 px-2 py-0.5 rounded-full animate-pulse">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
                {openCameraViolations.length} Aktif Uyarı
              </span>
            </div>

            {/* Kamera Tespit Akışı (Feed) */}
            <div className="mt-3 space-y-2.5 max-h-[220px] overflow-y-auto pr-1">
              {openCameraViolations.map((cam) => {
                const confPercent = Math.round(cam.confidence * 100)
                const violationTitle =
                  cam.violation === "NO_HELMET"
                    ? "Baret Yok"
                    : cam.violation === "UNAUTHORIZED_ZONE"
                    ? "Yetkisiz Bölge Girişi"
                    : cam.violation

                return (
                  <div
                    key={cam.id}
                    className="p-2.5 rounded-xl bg-red-950/25 border border-red-500/40 flex items-center justify-between gap-3 text-xs hover:border-red-400 transition-all shadow-sm"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      {cam.imageUrl ? (
                        <img
                          src={cam.imageUrl}
                          alt="Kanıt Fotoğrafı"
                          className="w-12 h-12 object-cover rounded-lg border border-red-500/40 shrink-0"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-lg bg-red-900/40 flex items-center justify-center shrink-0 border border-red-500/40">
                          <Camera className="w-5 h-5 text-red-300" />
                        </div>
                      )}

                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="px-1.5 py-0.2 bg-slate-800 text-slate-300 rounded text-[9px] font-mono border border-slate-700">
                            {cam.cameraId}
                          </span>
                          <span className="font-bold text-red-300 truncate">
                            {violationTitle}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] text-emerald-400 font-semibold">
                            %{confPercent} Doğruluk
                          </span>
                          <span className="text-[10px] text-slate-400">•</span>
                          <span className="text-[10px] text-slate-400">
                            {new Date(cam.timestamp).toLocaleTimeString("tr-TR", {
                              hour: "2-digit",
                              minute: "2-digit"
                            })}
                          </span>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => handleResolveCameraViolation(cam.id)}
                      className="px-2.5 py-1 bg-red-600/80 hover:bg-red-600 text-white rounded-lg text-[10px] font-bold shrink-0 transition-colors cursor-pointer flex items-center gap-1"
                      title="İhlali onayla ve kapat"
                    >
                      <Check className="w-3 h-3" />
                      Kapat
                    </button>
                  </div>
                )
              })}

              {openCameraViolations.length === 0 && (
                <div className="text-center py-6 text-slate-400 text-xs flex flex-col items-center justify-center gap-2">
                  <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                  <span>Kameralarda aktif kural ihlali tespit edilmedi.</span>
                </div>
              )}
            </div>
          </div>

          {/* Alt Webhook & Simülasyon Bilgisi */}
          <div className="pt-2 border-t border-slate-700/60 flex items-center justify-between text-[11px] text-slate-400">
            <span>Webhook Ucu: <code className="text-purple-300">/api/iot/camera-webhook</code></span>
            <button
              onClick={handleSimulateCameraDetection}
              className="text-purple-400 hover:text-purple-300 font-semibold cursor-pointer underline"
            >
              + Yeni Tespit Simüle Et
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
