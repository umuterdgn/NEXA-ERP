"use client"
/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Global Application Error Boundary & Autonomous Telemetry Reporter
 */

import React, { useEffect, useState } from "react"
import Link from "next/link"
import { ShieldAlert, RefreshCw, Home, LifeBuoy, CheckCircle2, ArrowRight } from "lucide-react"

export default function GlobalErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const [reported, setReported] = useState(false)

  useEffect(() => {
    // Arka planda otonom olarak SystemErrorLog tablosuna telemetri gönder
    const reportCrash = async () => {
      try {
        const path = typeof window !== "undefined" ? window.location.pathname : "UNKNOWN"
        let detectedModule = "GLOBAL_APP"
        if (path.includes("/inspection/ocr")) detectedModule = "INSPECTION_OCR"
        else if (path.includes("/inspection")) detectedModule = "INSPECTION_PORTAL"
        else if (path.includes("/admin/bim")) detectedModule = "BIM_VIEWER"
        else if (path.includes("/admin/finance")) detectedModule = "FINANCE"
        else if (path.includes("/admin")) detectedModule = "ADMIN_PORTAL"

        await fetch("/api/telemetry/error", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            module: detectedModule,
            errorMessage: error?.message || "Bilinmeyen çalışma zamanı hatası",
            errorStack: error?.stack || (error?.digest ? `Digest: ${error.digest}` : null),
          }),
        })
        setReported(true)
      } catch (e) {
        console.warn("Crash telemetrisi gönderilemedi:", e)
      }
    }

    reportCrash()
  }, [error])

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6 selection:bg-purple-500 selection:text-white">
      <div className="w-full max-w-lg p-8 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl relative overflow-hidden text-center space-y-6">
        {/* Dekoratif Işıklandırma */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* İkon */}
        <div className="relative mx-auto w-20 h-20 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center">
          <ShieldAlert className="w-10 h-10 text-rose-400 animate-pulse" />
        </div>

        {/* Başlık & Açıklama */}
        <div className="space-y-2">
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            Bir Hata Oluştu
          </h1>
          <p className="text-sm text-slate-400 leading-relaxed">
            Sistemde beklenmeyen bir çalışma hatası algılandı. Durum destek ekibine ve telemetri merkezimize otomatik olarak bildirildi.
          </p>
        </div>

        {/* Telemetri Bildirim Rozeti */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-950 border border-slate-800 text-xs font-mono text-slate-400">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          <span>{reported ? "Hata günlüğü başarıyla kaydedildi" : "Hata günlüğü sunucuya iletiliyor..."}</span>
        </div>

        {/* Teknik Referans (Digest) */}
        {error?.digest && (
          <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/80 font-mono text-[11px] text-slate-500 break-all">
            Hata Referansı: <span className="text-slate-300">{error.digest}</span>
          </div>
        )}

        {/* Aksiyon Butonları */}
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <button
            onClick={() => reset()}
            className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-blue-500/20 transition flex items-center justify-center gap-2 cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Sayfayı Yeniden Dene</span>
          </button>

          <button
            onClick={() => {
              if (typeof window !== "undefined") {
                const isInspection = window.location.pathname.startsWith("/inspection")
                window.location.href = isInspection ? "/inspection/dashboard" : "/admin"
              }
            }}
            className="flex-1 py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs border border-slate-700 transition flex items-center justify-center gap-2 cursor-pointer"
          >
            <Home className="w-4 h-4" />
            <span>Panele Dön</span>
          </button>
        </div>
      </div>
    </div>
  )
}
