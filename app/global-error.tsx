"use client"
/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Root Global Error Boundary for Next.js App Router
 */

import React, { useEffect, useState } from "react"
import { ShieldAlert, RefreshCw, Home, CheckCircle2 } from "lucide-react"

export default function GlobalRootError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const [reported, setReported] = useState(false)

  useEffect(() => {
    fetch("/api/telemetry/error", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        module: "ROOT_LAYOUT_CRASH",
        errorMessage: error?.message || "Kritik kök düzen hatası",
        errorStack: error?.stack || (error?.digest ? `Digest: ${error.digest}` : null),
      }),
    })
      .then(() => setReported(true))
      .catch(() => {})
  }, [error])

  return (
    <html lang="tr" className="dark">
      <body className="bg-slate-950 text-slate-100 min-h-screen flex items-center justify-center p-6 font-sans">
        <div className="w-full max-w-lg p-8 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl text-center space-y-6">
          <div className="mx-auto w-20 h-20 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center">
            <ShieldAlert className="w-10 h-10 text-rose-400 animate-pulse" />
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl font-black text-white">
              Sistem Seviyesinde Hata Oluştu
            </h1>
            <p className="text-sm text-slate-400 leading-relaxed">
              Bir hata oluştu, destek ekibine ve telemetri sunucusuna otonom olarak bildirildi.
            </p>
          </div>

          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-950 border border-slate-800 text-xs font-mono text-slate-400">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>{reported ? "Hata günlüğü kaydedildi" : "Telemetriye bildiriliyor..."}</span>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={() => reset()}
              className="flex-1 py-3 px-4 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-lg shadow-purple-600/30 transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Yeniden Başlat</span>
            </button>

            <button
              onClick={() => {
                if (typeof window !== "undefined") window.location.href = "/"
              }}
              className="flex-1 py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs border border-slate-700 transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <Home className="w-4 h-4" />
              <span>Ana Sayfa</span>
            </button>
          </div>
        </div>
      </body>
    </html>
  )
}
