"use client"

/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Nexa ERP - Personel Portalı Sürücü (Driver) Özel Dashboard & Canlı GPS Telemetri
 */

import React, { useState, useEffect, useRef } from "react"
import { QRCodeSVG } from "qrcode.react"
import {
  Truck,
  MapPin,
  Clock,
  Radio,
  QrCode,
  CheckCircle2,
  AlertTriangle,
  Play,
  Square,
  Navigation,
  Phone,
  Building2,
  Package,
  ShieldCheck,
  RefreshCw,
  X,
  Activity,
  Layers,
} from "lucide-react"

interface Appointment {
  id: string
  tenantId?: string | null
  materialId?: string | null
  supplierId?: string | null
  title?: string | null
  supplier?: string | null
  type?: string | null
  plateNumber?: string | null
  driverName?: string | null
  driverPhone?: string | null
  isInternalDriver?: boolean
  driverUserId?: string | null
  appointmentDate: string
  status: string
  notes?: string | null
  trackingToken?: string | null
  projectId?: string | null
  project?: {
    id: string
    title?: string | null
    name?: string | null
    location?: string | null
  } | null
}

interface DriverDashboardProps {
  initialAppointments: Appointment[]
  user: {
    id?: string
    name?: string | null
    email?: string | null
    role?: string
  }
}

export default function DriverDashboard({ initialAppointments, user }: DriverDashboardProps) {
  const [appointments, setAppointments] = useState<Appointment[]>(initialAppointments)
  const [activeTrip, setActiveTrip] = useState<Appointment | null>(
    initialAppointments.find((a) => a.status === "BEKLİYOR" || a.status === "SCHEDULED" || a.status === "KAPIDA") ||
      initialAppointments[0] ||
      null
  )

  // Live GPS Telemetry State (ADIM 5)
  const [isBroadcasting, setIsBroadcasting] = useState(false)
  const [lastCoords, setLastCoords] = useState<{ lat: number; lng: number; speed: number | null } | null>(null)
  const [pingsSent, setPingsSent] = useState(0)
  const [gpsError, setGpsError] = useState<string | null>(null)
  const telemetryIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // QR Modal State (ADIM 5)
  const [selectedQrTrip, setSelectedQrTrip] = useState<Appointment | null>(null)

  // Cleanup interval on unmount
  useEffect(() => {
    return () => {
      if (telemetryIntervalRef.current) {
        clearInterval(telemetryIntervalRef.current)
      }
    }
  }, [])

  // Start / Stop Live GPS Broadcast (Once per second) - ADIM 5
  const toggleGpsBroadcast = (trip?: Appointment) => {
    if (isBroadcasting) {
      // STOP
      if (telemetryIntervalRef.current) {
        clearInterval(telemetryIntervalRef.current)
        telemetryIntervalRef.current = null
      }
      setIsBroadcasting(false)
      return
    }

    // START
    if (!navigator.geolocation) {
      setGpsError("Cihazınızda GPS / Geolocation desteği bulunamadı.")
      return
    }

    const targetTrip = trip || activeTrip
    if (!targetTrip) {
      alert("Lütfen yayın başlatmak için bir sefer seçiniz.")
      return
    }

    setActiveTrip(targetTrip)
    setGpsError(null)
    setIsBroadcasting(true)

    const sendTelemetry = () => {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude, speed, heading, accuracy } = position.coords
          setLastCoords({
            lat: latitude,
            lng: longitude,
            speed: speed ? Math.round(speed * 3.6) : 0, // km/h
          })

          try {
            await fetch("/api/logistics/telemetry", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                appointmentId: targetTrip.id,
                trackingToken: targetTrip.trackingToken,
                latitude,
                longitude,
                speed,
                heading,
                accuracy,
              }),
            })
            setPingsSent((prev) => prev + 1)
          } catch (err) {
            console.warn("Telemetry transmission error:", err)
          }
        },
        (error) => {
          console.error("GPS Error:", error)
          setGpsError(`GPS Hatası: ${error.message} (Lütfen konum izni verin)`)
        },
        {
          enableHighAccuracy: true,
          timeout: 4000,
          maximumAge: 0,
        }
      )
    }

    // Trigger immediately
    sendTelemetry()

    // Interval every 1 second (1000ms) - ADIM 5 requirement
    telemetryIntervalRef.current = setInterval(sendTelemetry, 1000)
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "BEKLİYOR":
      case "SCHEDULED":
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            Bekliyor / Yolda
          </span>
        )
      case "KAPIDA":
      case "ARRIVED":
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center gap-1 animate-pulse">
            <ShieldCheck className="w-3.5 h-3.5" />
            Şantiye Kapısında
          </span>
        )
      case "İÇERİDE":
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5" />
            Şantiye Sahasında
          </span>
        )
      case "BOŞALTILDI":
      case "UNLOADED":
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Teslim Edildi / Boşaltıldı
          </span>
        )
      default:
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-800 text-slate-300">
            {status}
          </span>
        )
    }
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Driver Welcome & Telemetry Broadcaster Card */}
      <div className="p-6 rounded-3xl bg-gradient-to-br from-slate-900 via-blue-950/40 to-slate-900 border border-blue-800/40 shadow-2xl relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-3 py-1 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30 text-xs font-black tracking-wider uppercase flex items-center gap-1.5">
                <Truck className="w-3.5 h-3.5" />
                Lojistik Sürücü Portalı
              </span>
              {isBroadcasting && (
                <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-xs font-bold flex items-center gap-1.5 animate-pulse">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  CANLI GPS YAYINDA (1s)
                </span>
              )}
            </div>

            <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">
              Hoş Geldiniz, {user.name || "Sürücü"}
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Bugünkü teslimat rotalarınız, anlık şantiye GPS yayını ve depocu için dijital QR irsaliyeniz.
            </p>
          </div>

          {/* Master Live Telemetry Control Button - ADIM 5 */}
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <button
              onClick={() => toggleGpsBroadcast()}
              className={`w-full sm:w-auto px-6 py-3.5 rounded-2xl font-black text-sm flex items-center justify-center gap-2.5 transition-all shadow-xl ${
                isBroadcasting
                  ? "bg-rose-600 hover:bg-rose-500 text-white shadow-rose-950 animate-pulse"
                  : "bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-950 hover:scale-105"
              }`}
            >
              {isBroadcasting ? (
                <>
                  <Square className="w-5 h-5 fill-current" />
                  <span>Yayını Durdur (Seferi Bitir)</span>
                </>
              ) : (
                <>
                  <Radio className="w-5 h-5 animate-spin" />
                  <span>Seferi Başlat (Canlı Konum Yayınla)</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Live Broadcast Telemetry HUD Display */}
        {isBroadcasting && (
          <div className="mt-6 pt-6 border-t border-blue-900/40 grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-xl bg-slate-950/70 border border-blue-900/40">
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Enlem (Lat)</span>
              <span className="text-sm font-mono font-bold text-white">
                {lastCoords ? lastCoords.lat.toFixed(6) : "GPS Bekleniyor..."}
              </span>
            </div>
            <div className="p-3 rounded-xl bg-slate-950/70 border border-blue-900/40">
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Boylam (Lng)</span>
              <span className="text-sm font-mono font-bold text-white">
                {lastCoords ? lastCoords.lng.toFixed(6) : "GPS Bekleniyor..."}
              </span>
            </div>
            <div className="p-3 rounded-xl bg-slate-950/70 border border-blue-900/40">
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Hız</span>
              <span className="text-sm font-mono font-bold text-emerald-400">
                {lastCoords ? `${lastCoords.speed} km/s` : "0 km/s"}
              </span>
            </div>
            <div className="p-3 rounded-xl bg-slate-950/70 border border-blue-900/40">
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Gönderilen Ping</span>
              <span className="text-sm font-mono font-bold text-blue-400 flex items-center gap-1">
                <Activity className="w-3.5 h-3.5" />
                {pingsSent} paket (1 Hz)
              </span>
            </div>
          </div>
        )}

        {gpsError && (
          <div className="mt-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{gpsError}</span>
          </div>
        )}
      </div>

      {/* Bugünün Atanan Seferleri (Kamyon İkonlu Kartlar) - ADIM 5 */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Truck className="w-5 h-5 text-blue-400" />
            <h2 className="text-lg font-bold text-white">Bugünün Atanan Seferleri</h2>
            <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 text-xs font-bold">
              {appointments.length} Sefer
            </span>
          </div>
        </div>

        {appointments.length === 0 ? (
          <div className="p-12 text-center rounded-2xl bg-slate-900/60 border border-slate-800">
            <Truck className="w-12 h-12 mx-auto mb-3 text-slate-600" />
            <p className="text-slate-300 font-semibold">Bugün için adınıza atanmış lojistik sefer bulunmuyor.</p>
            <p className="text-xs text-slate-500 mt-1">
              Merkez ofis veya şantiye şefliği yeni bir kapı randevusu açtığında burada görünecektir.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {appointments.map((trip) => {
              const isSelected = activeTrip?.id === trip.id
              const dateObj = new Date(trip.appointmentDate)
              const timeStr = dateObj.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })
              const dateStr = dateObj.toLocaleDateString("tr-TR")

              return (
                <div
                  key={trip.id}
                  className={`p-5 rounded-2xl border transition-all relative overflow-hidden backdrop-blur-xl ${
                    isSelected
                      ? "bg-slate-900 border-blue-500 shadow-xl shadow-blue-950/30 ring-1 ring-blue-500"
                      : "bg-slate-900/80 border-slate-800 hover:border-slate-700"
                  }`}
                >
                  {/* Top Bar: Plate badge & Status */}
                  <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-800">
                    <div className="inline-flex items-center border-2 border-slate-300 rounded-md bg-white text-slate-900 font-mono font-black text-xs px-2 py-0.5 shadow-sm">
                      <span className="bg-blue-700 text-white text-[9px] px-1 py-0.5 rounded-sm mr-1.5 font-bold">
                        TR
                      </span>
                      {trip.plateNumber || "PLAKA YOK"}
                    </div>
                    {getStatusBadge(trip.status)}
                  </div>

                  {/* Destination & Material Info */}
                  <div className="py-3 space-y-2">
                    <div className="flex items-start gap-2">
                      <Building2 className="w-4 h-4 text-blue-400 mt-0.5 shrink-0" />
                      <div>
                        <span className="text-xs text-slate-400 block font-medium">Teslimat Noktası:</span>
                        <span className="text-sm font-bold text-white block">
                          {trip.project?.title || trip.project?.name || "Merkez Şantiye Projesi"}
                        </span>
                        {trip.project?.location && (
                          <span className="text-xs text-slate-400 block">{trip.project.location}</span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-start gap-2">
                      <Package className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
                      <div>
                        <span className="text-xs text-slate-400 block font-medium">Yük / Malzeme:</span>
                        <span className="text-sm font-semibold text-white">
                          {trip.title || "Şantiye Malzemesi Sevkiyatı"}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-xs text-slate-400 pt-1">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-slate-500" />
                        <span>Saat: <strong className="text-white">{timeStr}</strong> ({dateStr})</span>
                      </div>
                      {trip.supplier && (
                        <div className="truncate max-w-[150px]">
                          Firma: <span className="text-slate-300 font-medium">{trip.supplier}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons: Live GPS & QR İrsaliye - ADIM 5 */}
                  <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
                    {/* Live Broadcast Button */}
                    <button
                      onClick={() => toggleGpsBroadcast(trip)}
                      className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                        isBroadcasting && activeTrip?.id === trip.id
                          ? "bg-rose-600 hover:bg-rose-500 text-white shadow-md animate-pulse"
                          : "bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-950"
                      }`}
                    >
                      {isBroadcasting && activeTrip?.id === trip.id ? (
                        <>
                          <Square className="w-3.5 h-3.5 fill-current" />
                          <span>GPS Durdur</span>
                        </>
                      ) : (
                        <>
                          <Radio className="w-3.5 h-3.5" />
                          <span>Seferi Başlat (GPS)</span>
                        </>
                      )}
                    </button>

                    {/* QR İrsaliye Button (Depocu için okutulacak QR) - ADIM 5 */}
                    <button
                      onClick={() => setSelectedQrTrip(trip)}
                      className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-emerald-500/30 text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm"
                    >
                      <QrCode className="w-3.5 h-3.5" />
                      <span>QR İrsaliye</span>
                    </button>

                    {/* Navigation Shortcut */}
                    {trip.project?.location && (
                      <a
                        href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
                          trip.project.location
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all"
                        title="Google Maps ile Rota Başlat"
                      >
                        <Navigation className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* QR İrsaliye Modalı (Şantiyedeki Depocuya Okutulacak QR Kod) - ADIM 5 */}
      {selectedQrTrip && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-sm p-6 shadow-2xl relative text-center space-y-4 animate-in fade-in zoom-in duration-200">
            <button
              onClick={() => setSelectedQrTrip(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <div className="inline-flex p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 mb-2">
                <QrCode className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-bold text-white">Dijital Kapı & İrsaliye QR Kodu</h3>
              <p className="text-xs text-slate-400 mt-1">
                Şantiye kapısına ulaştığınızda güvenlik görevlisi veya ambar sorumlusuna okutunuz.
              </p>
            </div>

            {/* High Contrast QR Code Canvas / SVG */}
            <div className="p-4 bg-white rounded-2xl inline-block shadow-xl mx-auto border-4 border-slate-200">
              <QRCodeSVG
                value={JSON.stringify({
                  app: "NEXA_ERP",
                  type: "DELIVERY_APPOINTMENT",
                  id: selectedQrTrip.id,
                  token: selectedQrTrip.trackingToken || selectedQrTrip.id,
                  plate: selectedQrTrip.plateNumber,
                  driver: selectedQrTrip.driverName,
                  date: selectedQrTrip.appointmentDate,
                })}
                size={200}
                level="H"
                includeMargin={false}
              />
            </div>

            {/* Trip details inside modal */}
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-left text-xs space-y-1.5 font-mono">
              <div className="flex justify-between">
                <span className="text-slate-500">Araç Plakası:</span>
                <span className="text-white font-bold">{selectedQrTrip.plateNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Sürücü:</span>
                <span className="text-slate-200">{selectedQrTrip.driverName || user.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Şantiye:</span>
                <span className="text-blue-400 font-semibold truncate max-w-[180px]">
                  {selectedQrTrip.project?.title || "Şantiye Sahası"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Randevu Saati:</span>
                <span className="text-amber-400">
                  {new Date(selectedQrTrip.appointmentDate).toLocaleTimeString("tr-TR", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
            </div>

            <button
              onClick={() => setSelectedQrTrip(null)}
              className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs transition-all"
            >
              Kapat
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
