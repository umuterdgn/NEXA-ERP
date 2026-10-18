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
  Check
} from "lucide-react"
import { toast } from "react-hot-toast"

interface IsgViolationItem {
  id: string
  projectId: string
  workerName: string
  violation: string
  zoneName: string | null
  timestamp: string | Date
  status: "OPEN" | "RESOLVED" | string
}

interface DailyLogisticsItem {
  id: string
  material: string
  incoming: number
  consumed: number
  date: string | Date
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

  const [dailyProgress, setDailyProgress] = useState(2.4)
  const [isLoading, setIsLoading] = useState(false)
  const [isSimulating, setIsSimulating] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date())

  // Canlı verileri API'den getir
  const fetchLiveStats = useCallback(async () => {
    if (!projectId) return
    setIsLoading(true)
    try {
      const res = await fetch(`/api/iot/ping?projectId=${projectId}`)
      if (res.ok) {
        const data = await res.json()
        if (data.activePersonnelCount) {
          setActivePersonnel(data.activePersonnelCount)
        }
        if (Array.isArray(data.violations) && data.violations.length > 0) {
          setViolations(data.violations)
        }
        if (Array.isArray(data.logistics) && data.logistics.length > 0) {
          setLogistics(data.logistics)
        }
        setLastUpdated(new Date())
      }
    } catch (err) {
      console.error("LiveSiteDashboard veri çekme hatası:", err)
    } finally {
      setIsLoading(false)
    }
  }, [projectId])

  useEffect(() => {
    fetchLiveStats()
    // 30 saniyede bir otomatik canli polling
    const interval = setInterval(fetchLiveStats, 30000)
    return () => clearInterval(interval)
  }, [fetchLiveStats])

  // İhlali çözüldü olarak işaretle
  const handleResolveViolation = async (violationId: string) => {
    try {
      const res = await fetch("/api/iot/ping", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ violationId, status: "RESOLVED" })
      })

      if (res.ok) {
        toast.success("İhlal çözüldü olarak işaretlendi")
      }
      // Yerel state'i güncelle
      setViolations((prev) =>
        prev.map((v) => (v.id === violationId ? { ...v, status: "RESOLVED" } : v))
      )
    } catch {
      setViolations((prev) =>
        prev.map((v) => (v.id === violationId ? { ...v, status: "RESOLVED" } : v))
      )
      toast.success("İhlal çözüldü olarak güncellendi")
    }
  }

  // Mobil Uygulama BLE Simülatörü (Test Ping Gönderimi)
  const handleSimulateBlePing = async () => {
    setIsSimulating(true)
    try {
      // Simülasyon: Ali Rıza işçisi iskele bölgesine baret olmadan girdi
      const payload = {
        projectId,
        workerId: "sim-worker-1",
        currentZone: "A Blok İskele (Yüksekte Çalışma)",
        nearbyBeacons: ["MAC_AYAKKABI_01", "MAC_YELEK_02"] // Baret eksik!
      }

      const res = await fetch("/api/iot/ping", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      })

      if (res.ok) {
        const data = await res.json()
        if (data.violationLogged) {
          toast.error("🚨 BLE Radar Uyarısı: Riskli bölgede baretsiz işçi tespit edildi!", {
            duration: 5000,
            icon: "🚨"
          })
          await fetchLiveStats()
        } else {
          toast.success("BLE Ping gönderildi: Tüm donanımlar mevcut.")
        }
      } else {
        toast.error("Simülasyon isteği başarısız oldu.")
      }
    } catch {
      toast.error("Simülasyon sırasında hata oluştu")
    } finally {
      setIsSimulating(false)
    }
  }

  // Açık aktif ihlaller
  const openViolations = violations.filter((v) => v.status === "OPEN")
  const hasCriticalAlert = openViolations.length > 0

  return (
    <div className="w-full bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-2xl p-5 md:p-6 shadow-2xl space-y-5">
      {/* Üst Başlık & Canlı Durum Barı */}
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
              BLE Akıllı Donanım & Gerçek Zamanlı Saha Telemetrisi
            </p>
          </div>
        </div>

        {/* Aksiyon Butonları */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={handleSimulateBlePing}
            disabled={isSimulating}
            className="px-3.5 py-2 bg-gradient-to-r from-red-600/80 to-amber-600/80 hover:from-red-600 hover:to-amber-600 text-white rounded-xl text-xs font-semibold backdrop-blur-md border border-red-500/40 shadow-lg shadow-red-500/10 transition-all flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
            title="Mobil uygulamanın telemetri paketini simüle et"
          >
            <Send className="w-3.5 h-3.5" />
            <span>{isSimulating ? "Sinyal Gönderiliyor..." : "BLE Ping Testi"}</span>
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

      {/* Grid: 4 Ana Canlı Kart */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
        {/* =================================================================== */}
        {/* Kart 1: 👥 Anlık Aktif Personel                                     */}
        {/* =================================================================== */}
        <div className="bg-slate-800/60 backdrop-blur-md border border-slate-700/60 rounded-xl p-4.5 flex flex-col justify-between hover:border-slate-600 transition-all shadow-lg group">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Anlık Aktif Personel
              </span>
              <div className="w-8 h-8 rounded-lg bg-cyan-500/10 text-cyan-400 flex items-center justify-center border border-cyan-500/20">
                <Users className="w-4 h-4" />
              </div>
            </div>

            <div className="flex items-baseline gap-2 mb-1">
              <span className="text-3xl font-extrabold text-white tracking-tight">
                {activePersonnel}
              </span>
              <span className="text-xs font-medium text-slate-400">Kişi Sahada</span>
            </div>
            <p className="text-[11px] text-emerald-400 flex items-center gap-1 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
              Tüm giriş kapıları & turnikeler aktif
            </p>
          </div>

          {/* Taşeron Kırılımı (Yeşil / Kırmızı) */}
          <div className="mt-4 pt-3 border-t border-slate-700/60 space-y-1.5">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-300 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                Demir & Donatı Taşeronu
              </span>
              <span className="font-bold text-emerald-400">48 Kişi</span>
            </div>
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-300 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                Kalıp & Beton Ekibi
              </span>
              <span className="font-bold text-emerald-400">64 Kişi</span>
            </div>
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-300 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-cyan-400" />
                Mekanik & Elektrik Ekibi
              </span>
              <span className="font-bold text-cyan-400">22 Kişi</span>
            </div>
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-300 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-red-400" />
                Eksik / Geciken Vardiya
              </span>
              <span className="font-bold text-red-400">8 Kişi</span>
            </div>
          </div>
        </div>

        {/* =================================================================== */}
        {/* Kart 2: 🚚 Günlük Lojistik (Giren / Çıkan)                           */}
        {/* =================================================================== */}
        <div className="bg-slate-800/60 backdrop-blur-md border border-slate-700/60 rounded-xl p-4.5 flex flex-col justify-between hover:border-slate-600 transition-all shadow-lg group">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Günlük Lojistik
              </span>
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center border border-amber-500/20">
                <Truck className="w-4 h-4" />
              </div>
            </div>

            <div className="mb-2">
              <p className="text-base font-bold text-white leading-tight">
                Bugün Gelen: 120 Ton Demir, 400 m³ Beton
              </p>
              <p className="text-[11px] text-slate-400 mt-1">İrsaliye ve Tartı Onaylı</p>
            </div>
          </div>

          {/* Malzeme Döküm ve Sarf Barları */}
          <div className="mt-3 pt-3 border-t border-slate-700/60 space-y-2">
            <div>
              <div className="flex justify-between text-[11px] text-slate-300 mb-0.5">
                <span>Nervürlü Donatı (120 Ton)</span>
                <span className="text-amber-400 font-bold">45 T Sarf Edildi</span>
              </div>
              <div className="w-full bg-slate-700 rounded-full h-1.5 overflow-hidden">
                <div className="bg-amber-400 h-full rounded-full" style={{ width: "37.5%" }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-[11px] text-slate-300 mb-0.5">
                <span>Hazır Beton C35 (400 m³)</span>
                <span className="text-emerald-400 font-bold">380 m³ Döküldü</span>
              </div>
              <div className="w-full bg-slate-700 rounded-full h-1.5 overflow-hidden">
                <div className="bg-emerald-400 h-full rounded-full" style={{ width: "95%" }} />
              </div>
            </div>

            <div className="flex items-center justify-between text-[11px] pt-0.5">
              <span className="text-slate-400">Çimento (250 Torba)</span>
              <span className="text-slate-300 font-semibold">180 Torba Kullanıldı</span>
            </div>
          </div>
        </div>

        {/* =================================================================== */}
        {/* Kart 3: 🛡️ İSG Canlı Radar (Kırmızı Pulse Animasyonlu)                */}
        {/* =================================================================== */}
        <div
          className={`backdrop-blur-md rounded-xl p-4.5 flex flex-col justify-between transition-all shadow-lg relative overflow-hidden ${
            hasCriticalAlert
              ? "bg-red-950/30 border-2 border-red-500/70 shadow-red-500/15 ring-2 ring-red-500/20"
              : "bg-slate-800/60 border border-slate-700/60 hover:border-slate-600"
          }`}
        >
          {/* Kırmızı Yanıp Sönen (Pulse Animation) UI Efekti */}
          {hasCriticalAlert && (
            <div className="absolute top-0 right-0 left-0 h-1 bg-red-500 animate-pulse" />
          )}

          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                {hasCriticalAlert ? (
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500" />
                  </span>
                ) : (
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                )}
                İSG Canlı Radar
              </span>

              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                  hasCriticalAlert
                    ? "bg-red-500/20 text-red-400 border border-red-500/40 animate-pulse"
                    : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                }`}
              >
                {hasCriticalAlert ? (
                  <ShieldAlert className="w-4 h-4" />
                ) : (
                  <ShieldCheck className="w-4 h-4" />
                )}
              </div>
            </div>

            <div className="flex items-baseline gap-2 mb-1">
              <span
                className={`text-2xl font-black tracking-tight ${
                  hasCriticalAlert ? "text-red-400 animate-pulse" : "text-emerald-400"
                }`}
              >
                Aktif İhlal: {openViolations.length}
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              {hasCriticalAlert
                ? "Derhal müdahale gerektiren riskli saha ihlali"
                : "Tüm BLE donanımlar senkronize"}
            </p>
          </div>

          {/* İhlal Listesi ve Müdahale */}
          <div className="mt-3 pt-3 border-t border-slate-700/60 space-y-2">
            {openViolations.slice(0, 2).map((v) => (
              <div
                key={v.id}
                className="bg-red-950/40 border border-red-500/30 rounded-lg p-2 text-xs flex items-start justify-between gap-2"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 text-red-300 font-bold">
                    <AlertTriangle className="w-3 h-3 shrink-0 text-red-400" />
                    <span className="truncate">{v.workerName}</span>
                  </div>
                  <p className="text-[11px] text-slate-300 leading-tight mt-0.5">
                    {v.violation}
                  </p>
                  {v.zoneName && (
                    <p className="text-[10px] text-slate-400 truncate mt-0.5">
                      📍 {v.zoneName}
                    </p>
                  )}
                </div>

                <button
                  onClick={() => handleResolveViolation(v.id)}
                  className="px-2 py-1 bg-red-600/70 hover:bg-red-600 text-white rounded text-[10px] font-semibold shrink-0 transition-colors flex items-center gap-1 cursor-pointer"
                  title="İhlali çözüldü olarak kapat"
                >
                  <Check className="w-3 h-3" />
                  Kapat
                </button>
              </div>
            ))}

            {openViolations.length === 0 && (
              <div className="text-center py-2 text-xs text-emerald-400 font-medium flex items-center justify-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                Aktif ihlal bulunmuyor.
              </div>
            )}
          </div>
        </div>

        {/* =================================================================== */}
        {/* Kart 4: 📈 Günlük Tamamlanan İmalat                                 */}
        {/* =================================================================== */}
        <div className="bg-slate-800/60 backdrop-blur-md border border-slate-700/60 rounded-xl p-4.5 flex flex-col justify-between hover:border-slate-600 transition-all shadow-lg group">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Tamamlanan İmalat
              </span>
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center border border-blue-500/20">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>

            <div className="flex items-baseline gap-2 mb-1">
              <span className="text-3xl font-extrabold text-blue-400 tracking-tight">
                %{dailyProgress}
              </span>
              <span className="text-xs font-medium text-slate-300">Günlük İlerleme</span>
            </div>
            <p className="text-[11px] text-slate-400">Hedef: %2.0 / Gün (Hedefin üzerinde)</p>
          </div>

          {/* Günlük İmalat İlerleme Çubuğu & Maddeleri */}
          <div className="mt-3 pt-3 border-t border-slate-700/60 space-y-2">
            <div>
              <div className="flex justify-between text-[11px] text-slate-300 mb-1">
                <span>Günlük Hedef Tamamlanma</span>
                <span className="font-bold text-blue-400">%120</span>
              </div>
              <div className="w-full bg-slate-700 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-blue-500 to-cyan-400 h-full rounded-full"
                  style={{ width: "100%" }}
                />
              </div>
            </div>

            <div className="space-y-1 text-[11px] text-slate-300">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                <span className="truncate">B Blok 2. Kat Döşeme Kalıbı (%100)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                <span className="truncate">Aks 3-4 Kiriş Donatı Kontrolü (%85)</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
