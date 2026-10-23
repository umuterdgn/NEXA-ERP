"use client"
/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Kırmızı Acil Durum (SOS) Floating Action Button (Fixed FAB)
 */

import { useState } from "react"
import { AlertOctagon, Siren, MapPin, CheckCircle2, Loader2, X } from "lucide-react"

export default function SosEmergencyFab() {
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [successData, setSuccessData] = useState<{
    lat?: number
    lng?: number
    message?: string
  } | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const triggerSos = () => {
    setLoading(true)
    setErrorMsg(null)
    setSuccessData(null)

    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const lat = position.coords.latitude
          const lng = position.coords.longitude
          await sendSosAlert(lat, lng)
        },
        async (error) => {
          console.warn("Geolocation alınamadı, konumsuz gönderiliyor:", error.message)
          // Konum izni verilmemiş olsa dahi alarmı mutlaka ilet
          await sendSosAlert(null, null)
        },
        { enableHighAccuracy: true, timeout: 8000 }
      )
    } else {
      sendSosAlert(null, null)
    }
  }

  const sendSosAlert = async (lat: number | null, lng: number | null) => {
    try {
      const res = await fetch("/api/sos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          latitude: lat,
          longitude: lng,
        }),
      })

      const data = await res.json()
      if (res.ok) {
        setSuccessData({
          lat: lat || undefined,
          lng: lng || undefined,
          message: "ACİL DURUM ALARMI MERKEZ OFİSE VE İSG EKİBİNE İLETİLDİ!",
        })
      } else {
        setErrorMsg(data.error || "SOS alarmı gönderilemedi.")
      }
    } catch (err: any) {
      setErrorMsg("Bağlantı hatası: Alarm iletilemedi.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {/* Fixed Floating Action Button (FAB) at Bottom-Right */}
      <div className="fixed bottom-6 right-6 z-50">
        <button
          onClick={() => setIsOpen(true)}
          className="group relative flex items-center gap-2 px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-full shadow-2xl shadow-red-600/60 ring-4 ring-red-500/30 font-bold text-xs uppercase tracking-wider transition-all duration-300 hover:scale-105 active:scale-95 animate-pulse"
          title="Şantiyede Acil Durum / Kaza / Yangın Alarmı Ver"
        >
          <Siren className="w-5 h-5 text-white animate-bounce" />
          <span className="hidden sm:inline">ACİL DURUM (SOS)</span>
          <span className="sm:hidden font-black">SOS</span>
          <span className="absolute -top-1 -right-1 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
          </span>
        </button>
      </div>

      {/* SOS Modal Dialog */}
      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="bg-slate-900 border-2 border-red-600 rounded-2xl w-full max-w-md p-6 space-y-5 shadow-2xl relative">
            <button
              onClick={() => {
                setIsOpen(false)
                setSuccessData(null)
                setErrorMsg(null)
              }}
              className="absolute top-4 right-4 p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Header */}
            <div className="text-center space-y-2">
              <div className="inline-flex p-3 rounded-full bg-red-950/80 border border-red-700 text-red-500 ring-4 ring-red-500/20">
                <AlertOctagon className="w-10 h-10 animate-pulse" />
              </div>
              <h2 className="text-xl font-black text-white uppercase tracking-tight">
                Şantiye Acil Durum (SOS)
              </h2>
              <p className="text-xs text-slate-300 leading-relaxed">
                İş kazası, yangın, göçük veya acil sağlık durumunda GPS konumunuzla birlikte merkez ofise kırmızı alarm iletilir.
              </p>
            </div>

            {/* Feedback states */}
            {successData ? (
              <div className="p-4 bg-red-950/60 border border-red-700 rounded-xl space-y-2 text-center text-xs">
                <div className="flex items-center justify-center gap-1.5 text-emerald-400 font-bold text-sm">
                  <CheckCircle2 className="w-5 h-5" />
                  <span>ALARM AKTİF!</span>
                </div>
                <p className="text-white font-medium">{successData.message}</p>
                {successData.lat && successData.lng && (
                  <div className="flex items-center justify-center gap-1 text-[11px] text-slate-300 font-mono pt-1">
                    <MapPin className="w-3.5 h-3.5 text-red-400" />
                    <span>
                      GPS: {successData.lat.toFixed(5)}, {successData.lng.toFixed(5)}
                    </span>
                  </div>
                )}
                <p className="text-[10px] text-slate-400 pt-1">
                  Yöneticiler ve İSG uzmanları bilgilendirildi. Lütfen güvenli bir alana geçin.
                </p>
              </div>
            ) : errorMsg ? (
              <div className="p-3 bg-red-950/50 border border-red-800 rounded-xl text-center text-xs text-red-300 font-medium">
                {errorMsg}
              </div>
            ) : null}

            {/* Actions */}
            {!successData && (
              <div className="space-y-3 pt-2">
                <button
                  onClick={triggerSos}
                  disabled={loading}
                  className="w-full py-4 rounded-xl bg-red-600 hover:bg-red-700 text-white font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-xl shadow-red-600/40 transition-transform active:scale-95 disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Konum Alınıyor ve Alarm Veriliyor...</span>
                    </>
                  ) : (
                    <>
                      <Siren className="w-5 h-5" />
                      <span>HEMEN ACİL DURUM ALARMI GÖNDER</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
                >
                  Vazgeç (Geri Dön)
                </button>
              </div>
            )}

            {successData && (
              <button
                onClick={() => setIsOpen(false)}
                className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold"
              >
                Kapat
              </button>
            )}
          </div>
        </div>
      )}
    </>
  )
}
