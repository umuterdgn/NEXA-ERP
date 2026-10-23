"use client"
/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Global SOS Alarm Dinleyicisi & Kırmızı Acil Durum Barı (Admin Karargah)
 */

import { useState, useEffect } from "react"
import { Siren, MapPin, CheckCircle2, ExternalLink, X, AlertTriangle } from "lucide-react"

interface ActiveSosAlert {
  id: string
  userId: string
  projectId: string | null
  latitude: number | null
  longitude: number | null
  status: string
  createdAt: string
  user: {
    name: string
    email: string
    role: string
  }
}

export default function GlobalSosBanner() {
  const [activeAlerts, setActiveAlerts] = useState<ActiveSosAlert[]>([])
  const [loading, setLoading] = useState(false)
  const [dismissedIds, setDismissedIds] = useState<string[]>([])

  const checkSosAlerts = async () => {
    try {
      const res = await fetch("/api/sos?status=ACTIVE")
      const data = await res.json()
      if (data.alerts) {
        setActiveAlerts(data.alerts)
      }
    } catch (err) {
      // Background poll silently fails if network blips
    }
  }

  useEffect(() => {
    checkSosAlerts()
    const interval = setInterval(checkSosAlerts, 4000) // Poll every 4 seconds
    return () => clearInterval(interval)
  }, [])

  const handleResolve = async (alertId: string) => {
    try {
      setLoading(true)
      const res = await fetch("/api/sos", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ alertId, status: "RESOLVED" }),
      })
      if (res.ok) {
        setActiveAlerts((prev) => prev.filter((a) => a.id !== alertId))
      }
    } catch (err) {
      console.error("Resolve SOS error:", err)
    } finally {
      setLoading(false)
    }
  }

  // Filter out temporarily dismissed alerts in the session
  const visibleAlerts = activeAlerts.filter((a) => !dismissedIds.includes(a.id))

  if (visibleAlerts.length === 0) return null

  const currentAlert = visibleAlerts[0]

  const googleMapsUrl =
    currentAlert.latitude && currentAlert.longitude
      ? `https://www.google.com/maps?q=${currentAlert.latitude},${currentAlert.longitude}`
      : null

  return (
    <div className="w-full bg-gradient-to-r from-red-600 via-rose-700 to-red-600 text-white shadow-2xl border-b-2 border-red-400 z-[99999] sticky top-0 animate-pulse">
      <div className="max-w-7xl mx-auto px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Siren Icon & Details */}
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-white/20 backdrop-blur-sm ring-2 ring-white text-white shrink-0 animate-bounce">
            <Siren className="w-6 h-6" />
          </div>

          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <span className="text-xs font-black uppercase tracking-widest bg-white text-red-700 px-2 py-0.5 rounded">
                ŞANTİYEDE ACİL DURUM (SOS)
              </span>
              <span className="text-xs font-bold underline">
                {currentAlert.user?.name || "Personel"}
              </span>
              <span className="text-[11px] opacity-90">
                ({new Date(currentAlert.createdAt).toLocaleTimeString("tr-TR")})
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-x-4 text-xs font-medium text-white/95">
              <span>Saha acil durum alarmı tetiklendi!</span>
              {currentAlert.latitude && currentAlert.longitude && (
                <span className="flex items-center gap-1 font-mono bg-black/30 px-2 py-0.5 rounded text-[11px]">
                  <MapPin className="w-3 h-3 text-red-300" />
                  Konum: {currentAlert.latitude.toFixed(5)}, {currentAlert.longitude.toFixed(5)}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
          {googleMapsUrl && (
            <a
              href={googleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3.5 py-1.5 rounded-lg bg-white/20 hover:bg-white/30 text-white text-xs font-bold flex items-center gap-1.5 border border-white/40 transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Haritada Göster</span>
            </a>
          )}

          <button
            onClick={() => handleResolve(currentAlert.id)}
            disabled={loading}
            className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black shadow-lg flex items-center gap-1.5 transition-all active:scale-95 disabled:opacity-50"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Müdahale Edildi / Çözüldü</span>
          </button>

          <button
            onClick={() => setDismissedIds((prev) => [...prev, currentAlert.id])}
            className="p-1.5 text-white/70 hover:text-white rounded-lg"
            title="Geçici Olarak Gizle"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
