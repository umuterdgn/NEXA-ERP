"use client"

/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Nexa ERP - Saha Kamerası, Canlı IP Akışı & Timelapse İlerleme Takibi
 */

import React, { useState } from "react"
import {
  Camera,
  Video,
  Play,
  Pause,
  RotateCcw,
  FastForward,
  Calendar,
  Layers,
  Sparkles,
  Download,
  Upload,
  Maximize2,
  Sliders,
  CheckCircle2,
  Clock,
  Eye,
  RefreshCw,
  Sun,
  CloudRain,
  Share2,
} from "lucide-react"

interface SiteCamera {
  id: string
  name: string
  location: string
  status: "ONLINE" | "RECORDING" | "OFFLINE"
  resolution: string
  fps: number
  ipAddress: string
  lastSnapshotTime: string
  totalSnapshots: number
  previewUrl: string
}

interface SnapshotItem {
  id: string
  date: string
  phase: string
  weather: string
  progressPercent: number
  imageUrl: string
  notes: string
}

const SITE_CAMERAS: SiteCamera[] = [
  {
    id: "cam-1",
    name: "Kamera 01 - Kuzey Cephesi 4K Dome",
    location: "A Blok Dış Cephe / İskele Hattı",
    status: "RECORDING",
    resolution: "3840x2160 (4K UHD)",
    fps: 30,
    ipAddress: "192.168.10.41",
    lastSnapshotTime: "5 dk önce",
    totalSnapshots: 1420,
    previewUrl: "https://images.unsplash.com/photo-1541888946425-d0fbb186156a?auto=format&fit=crop&w=1200&q=80",
  },
  {
    id: "cam-2",
    name: "Kamera 02 - Kule Vinç Tepe Geniş Açı",
    location: "Kule Vinç 1 Kabin Altı",
    status: "RECORDING",
    resolution: "2560x1440 (2K QHD)",
    fps: 25,
    ipAddress: "192.168.10.42",
    lastSnapshotTime: "2 dk önce",
    totalSnapshots: 2150,
    previewUrl: "https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=1200&q=80",
  },
  {
    id: "cam-3",
    name: "Kamera 03 - Zemin Kat Beton & Tabliye",
    location: "B Blok Zemin Giriş",
    status: "ONLINE",
    resolution: "1920x1080 (Full HD)",
    fps: 30,
    ipAddress: "192.168.10.43",
    lastSnapshotTime: "12 dk önce",
    totalSnapshots: 840,
    previewUrl: "https://images.unsplash.com/photo-1590486803833-1c5dc8ddd4c8?auto=format&fit=crop&w=1200&q=80",
  },
  {
    id: "cam-4",
    name: "Kamera 04 - Malzeme Kabul & Kapı Güvenlik",
    location: "Şantiye Ana Giriş Kapısı",
    status: "ONLINE",
    resolution: "1920x1080 (Full HD)",
    fps: 30,
    ipAddress: "192.168.10.44",
    lastSnapshotTime: "1 dk önce",
    totalSnapshots: 3600,
    previewUrl: "https://images.unsplash.com/photo-1581094794329-c8112a89af12?auto=format&fit=crop&w=1200&q=80",
  },
]

const TIMELAPSE_SNAPSHOTS: SnapshotItem[] = [
  {
    id: "snap-1",
    date: "10 Ocak 2026",
    phase: "Hafriyat & Temel Kazısı",
    weather: "Güneşli, 12°C",
    progressPercent: 12,
    imageUrl: "https://images.unsplash.com/photo-1578575437130-527eed3abbec?auto=format&fit=crop&w=1200&q=80",
    notes: "Temel altı grobeton dökümü ve drenaj hatları tamamlandı.",
  },
  {
    id: "snap-2",
    date: "15 Şubat 2026",
    phase: "Radye Temel & Bodrum Perdeleri",
    weather: "Bulutlu, 8°C",
    progressPercent: 28,
    imageUrl: "https://images.unsplash.com/photo-1541888946425-d0fbb186156a?auto=format&fit=crop&w=1200&q=80",
    notes: "Radye temel 2.400 m³ C35 beton dökümü 18 saatte başarıyla bitirildi.",
  },
  {
    id: "snap-3",
    date: "25 Mart 2026",
    phase: "1. ve 2. Kat Tabliye İlerlemesi",
    weather: "Açık, 18°C",
    progressPercent: 46,
    imageUrl: "https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=1200&q=80",
    notes: "Kolon ve perde donatı montajı devam ediyor, kule vinç aktif devrede.",
  },
  {
    id: "snap-4",
    date: "05 Mayıs 2026 (Bugün)",
    phase: "5. Kat Kaba Yapı & Dış Cephe İskelesi",
    weather: "Parçalı Bulutlu, 22°C",
    progressPercent: 68,
    imageUrl: "https://images.unsplash.com/photo-1590486803833-1c5dc8ddd4c8?auto=format&fit=crop&w=1200&q=80",
    notes: "5. kat tabliyesi kalıp montajı tamamlandı, demir donatı denetimi yapılıyor.",
  },
]

export default function TimelapsePage() {
  const [selectedCamera, setSelectedCamera] = useState<SiteCamera>(SITE_CAMERAS[0])
  const [isPlayingTimelapse, setIsPlayingTimelapse] = useState(false)
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(5)
  const [activeSnapshotIndex, setActiveSnapshotIndex] = useState(3)
  const [splitSliderPos, setSplitSliderPos] = useState(50)
  const [isSplitMode, setIsSplitMode] = useState(false)
  const [isAIAnalyzing, setIsAIAnalyzing] = useState(false)
  const [aiReport, setAiReport] = useState<string | null>(null)

  const activeSnapshot = TIMELAPSE_SNAPSHOTS[activeSnapshotIndex] || TIMELAPSE_SNAPSHOTS[0]
  const beforeSnapshot = TIMELAPSE_SNAPSHOTS[0]

  const handleTriggerAI = () => {
    setIsAIAnalyzing(true)
    setAiReport(null)
    setTimeout(() => {
      setIsAIAnalyzing(false)
      setAiReport(
        "AI Görüntü Analizi: 5. Kat tabliye kalıp montajı %98 tamamlandı. Güvenlik ağları nizami kurulu. Hedef takvimin 2 gün önünde ilerleniyor."
      )
    }, 2000)
  }

  return (
    <div className="space-y-6">
      {/* Üst Başlık & Kamera Durumu */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950 border border-slate-800 shadow-xl">
        <div className="flex items-center gap-3.5">
          <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl text-indigo-400">
            <Camera className="w-8 h-8 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-white tracking-tight">
                Saha Kameraları & Timelapse İlerleme Takibi
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                4 CANLI IP KAMERA BAĞLI
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              4K IP kameralardan ve mobil denetim fotoğraflarından otomatik oluşturulan şantiye timelapse arşivi.
            </p>
          </div>
        </div>

        {/* Aksiyon Butonları */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleTriggerAI}
            disabled={isAIAnalyzing}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/40 text-purple-300 font-bold text-xs transition-all shadow-md shadow-purple-950"
          >
            <Sparkles className={`w-4 h-4 text-purple-400 ${isAIAnalyzing ? "animate-spin" : ""}`} />
            <span>{isAIAnalyzing ? "AI Analiz Yapıyor..." : "AI İlerleme Analizi"}</span>
          </button>
          <button
            onClick={() => alert("Saha kamerasından yüksek çözünürlüklü anlık görüntü indirildi.")}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-all"
          >
            <Download className="w-4 h-4" />
            <span>Anlık İndir</span>
          </button>
        </div>
      </div>

      {/* AI Sonuç Bildirimi */}
      {aiReport && (
        <div className="p-4 rounded-2xl bg-purple-950/40 border border-purple-500/30 flex items-center justify-between gap-3 text-xs text-purple-200 animate-in fade-in duration-300">
          <div className="flex items-center gap-2.5">
            <Sparkles className="w-5 h-5 text-purple-400 shrink-0" />
            <span>{aiReport}</span>
          </div>
          <button
            onClick={() => setAiReport(null)}
            className="text-purple-400 hover:text-white font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {/* ANA VİDEO / TIMELAPSE OYNATICI ALANI */}
      <div className="p-4 sm:p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl space-y-4">
        {/* Canlı Yayın Başlığı & Kamera Bilgisi */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
              <h2 className="text-base font-bold text-white">{selectedCamera.name}</h2>
              <span className="text-xs text-slate-400 font-mono">({selectedCamera.resolution})</span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">{selectedCamera.location}</p>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <button
              onClick={() => setIsSplitMode(!isSplitMode)}
              className={`px-3 py-1.5 rounded-xl border transition-all flex items-center gap-1.5 ${
                isSplitMode
                  ? "bg-blue-600/20 border-blue-500 text-blue-400 font-bold"
                  : "bg-slate-800/80 border-slate-700 text-slate-300 hover:text-white"
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>{isSplitMode ? "Önce / Sonra Açık" : "Önce / Sonra Karşılaştır"}</span>
            </button>
          </div>
        </div>

        {/* Video / Fotoğraf Sahnesi */}
        <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-black border border-slate-800 shadow-inner group">
          {!isSplitMode ? (
            <img
              src={activeSnapshot.imageUrl}
              alt={activeSnapshot.phase}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
          ) : (
            /* Önce & Sonra Split Slider */
            <div className="relative w-full h-full overflow-hidden select-none">
              <img
                src={activeSnapshot.imageUrl}
                alt="Şimdiki Durum"
                className="absolute inset-0 w-full h-full object-cover"
              />
              <div
                className="absolute inset-0 overflow-hidden"
                style={{ width: `${splitSliderPos}%` }}
              >
                <img
                  src={beforeSnapshot.imageUrl}
                  alt="Önceki Durum"
                  className="w-full h-full object-cover max-w-none"
                  style={{ width: "100%", height: "100%" }}
                />
              </div>

              {/* Bölücü Çizgi ve Tutamaç */}
              <div
                className="absolute top-0 bottom-0 w-1 bg-white shadow-2xl cursor-ew-resize flex items-center justify-center"
                style={{ left: `${splitSliderPos}%` }}
              >
                <div className="w-8 h-8 rounded-full bg-blue-600 text-white border-2 border-white flex items-center justify-center text-xs font-black shadow-xl -ml-0.5">
                  ↔
                </div>
              </div>

              {/* Slider Input */}
              <input
                type="range"
                min="0"
                max="100"
                value={splitSliderPos}
                onChange={(e) => setSplitSliderPos(Number(e.target.value))}
                className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize"
              />

              <div className="absolute top-4 left-4 px-2.5 py-1 rounded-lg bg-black/75 backdrop-blur-md text-white text-[11px] font-bold">
                ÖNCE: {beforeSnapshot.date}
              </div>
              <div className="absolute top-4 right-4 px-2.5 py-1 rounded-lg bg-blue-600/80 backdrop-blur-md text-white text-[11px] font-bold">
                ŞİMDİ: {activeSnapshot.date}
              </div>
            </div>
          )}

          {/* Sol Üst Bilgi Kartı (Overlay) */}
          <div className="absolute top-4 left-4 z-10 flex flex-col gap-1.5 pointer-events-none">
            <span className="px-3 py-1 rounded-lg bg-black/75 backdrop-blur-md text-white text-xs font-bold flex items-center gap-2">
              <Calendar className="w-3.5 h-3.5 text-blue-400" />
              {activeSnapshot.date} — {activeSnapshot.phase}
            </span>
            <span className="px-3 py-0.5 rounded-lg bg-black/60 backdrop-blur-md text-emerald-400 text-[11px] font-mono">
              Fiziki İlerleme: %{activeSnapshot.progressPercent} • {activeSnapshot.weather}
            </span>
          </div>

          {/* Sağ Alt Canlı Yayın / REC Rozeti */}
          <div className="absolute bottom-4 right-4 z-10 flex items-center gap-2 pointer-events-none">
            <span className="px-2.5 py-1 rounded-lg bg-red-600/90 text-white font-mono font-bold text-xs flex items-center gap-1.5 shadow-lg">
              <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
              REC • 30 FPS
            </span>
          </div>
        </div>

        {/* TIMELAPSE KONTROL ÇUBUĞU (SCRUBBER & PLAYER) */}
        <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsPlayingTimelapse(!isPlayingTimelapse)}
                className="p-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold transition-all shadow-md shadow-blue-950"
              >
                {isPlayingTimelapse ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              </button>
              <button
                onClick={() => setActiveSnapshotIndex(0)}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all"
                title="Başa Sar"
              >
                <RotateCcw className="w-4 h-4" />
              </button>

              <span className="text-white font-bold font-mono ml-2">
                {activeSnapshot.date}
              </span>
            </div>

            {/* Oynatma Hızı */}
            <div className="flex items-center gap-1">
              {[1, 5, 10, 30].map((spd) => (
                <button
                  key={spd}
                  onClick={() => setPlaybackSpeed(spd)}
                  className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold transition-all ${
                    playbackSpeed === spd
                      ? "bg-blue-600 text-white"
                      : "bg-slate-800/80 text-slate-400 hover:text-white"
                  }`}
                >
                  {spd}x
                </button>
              ))}
            </div>
          </div>

          {/* Timeline Slider */}
          <div className="relative">
            <input
              type="range"
              min="0"
              max={TIMELAPSE_SNAPSHOTS.length - 1}
              value={activeSnapshotIndex}
              onChange={(e) => setActiveSnapshotIndex(Number(e.target.value))}
              className="w-full accent-blue-500 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-1">
              {TIMELAPSE_SNAPSHOTS.map((s, idx) => (
                <span
                  key={s.id}
                  onClick={() => setActiveSnapshotIndex(idx)}
                  className={`cursor-pointer transition-colors ${
                    activeSnapshotIndex === idx ? "text-blue-400 font-bold" : "hover:text-slate-300"
                  }`}
                >
                  {s.date.split(" ")[0]} {s.date.split(" ")[1]?.substring(0, 3)}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ALT: ŞANTİYE KAMERALARI SEÇİCİ & ANLIK GÖRÜNTÜ GALERİSİ */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {SITE_CAMERAS.map((cam) => {
          const isSelected = selectedCamera.id === cam.id
          return (
            <div
              key={cam.id}
              onClick={() => setSelectedCamera(cam)}
              className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex flex-col gap-2.5 ${
                isSelected
                  ? "bg-slate-900 border-blue-500 shadow-xl shadow-blue-500/10"
                  : "bg-slate-900/60 hover:bg-slate-900 border-slate-800"
              }`}
            >
              <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-black">
                <img src={cam.previewUrl} alt={cam.name} className="w-full h-full object-cover" />
                <span className="absolute top-2 left-2 px-2 py-0.5 rounded bg-black/75 text-[10px] font-bold text-white flex items-center gap-1 font-mono">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  {cam.status}
                </span>
                <span className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded bg-black/60 text-[9px] font-mono text-slate-300">
                  {cam.lastSnapshotTime}
                </span>
              </div>

              <div>
                <h3 className="text-xs font-bold text-white truncate">{cam.name}</h3>
                <p className="text-[11px] text-slate-400 truncate">{cam.location}</p>
              </div>

              <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono pt-1.5 border-t border-slate-800">
                <span>{cam.resolution.split(" ")[0]}</span>
                <span>{cam.totalSnapshots} Kare Arşiv</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

