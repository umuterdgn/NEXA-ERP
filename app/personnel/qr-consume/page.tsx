"use client"
/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Malzeme Tüketimi (QR / Karekod ile Şantiyede Tüketildi Girişi) (/personnel/qr-consume)
 */

import { useState, useEffect, useRef } from "react"
import {
  QrCode,
  CheckCircle2,
  AlertTriangle,
  Building2,
  Layers,
  PackageCheck,
  Search,
  ScanLine,
  RefreshCw,
  Camera,
  History,
  X,
  Loader2,
  Box,
} from "lucide-react"

interface ConsumedItem {
  id: string
  qrCode: string
  materialName: string
  quantity: number
  unit: string | null
  currentZone: string
  status: string
  consumedAt: string
}

export default function PersonnelQrConsumePage() {
  const [targetZone, setTargetZone] = useState("A_BLOK_KAT_3")
  const [qrCodeInput, setQrCodeInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [lastConsumed, setLastConsumed] = useState<ConsumedItem | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [history, setHistory] = useState<ConsumedItem[]>([])

  // Quick preset zones
  const PRESET_ZONES = [
    "A_BLOK_KAT_3",
    "A_BLOK_KAT_2",
    "A_BLOK_ZEMIN",
    "B_BLOK_KAT_1",
    "BODRUM_OTOPARK",
    "KAZAN_DAIRESI",
    "DIS_CEPHE_ISKELE",
  ]

  const handleConsume = async (codeToSubmit?: string) => {
    const code = codeToSubmit || qrCodeInput
    if (!code.trim()) {
      setErrorMsg("Lütfen taranan karekod veya malzeme barkodunu giriniz.")
      return
    }

    try {
      setLoading(true)
      setErrorMsg(null)

      const res = await fetch("/api/inventory/consume", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          qrCode: code.trim(),
          targetZone,
        }),
      })

      const data = await res.json()

      if (res.ok && data.item) {
        setLastConsumed(data.item)
        setHistory((prev) => [data.item, ...prev.filter((x) => x.id !== data.item.id)])
        setQrCodeInput("")
      } else {
        setErrorMsg(data.error || "Tüketim işlemi başarısız oldu.")
      }
    } catch (err: any) {
      setErrorMsg("Bağlantı hatası: Malzeme sunucuya iletilemedi.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="border-b border-slate-200 dark:border-slate-800 pb-4">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400 mb-1">
          <QrCode className="w-4 h-4" />
          <span>Şantiye Ambar & Sarfiyat Yönetimi</span>
        </div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
          Malzeme Tüketimi (QR / Karekod)
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Karekod okutarak şantiyede kullanılan çimento, demir, kablo veya tesisat malzemelerini anında "CONSUMED" olarak işaretleyin ve imalatın yapıldığı kat/blok konumunu kaydedin.
        </p>
      </div>

      {/* Target Zone Config Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-3 shadow-md">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
            <Building2 className="w-4 h-4 text-blue-500" />
            <span>Tüketilen Kat / Blok Konumu (currentZone) *</span>
          </label>
          <span className="text-[11px] text-slate-400 font-mono">Hedef Bölge</span>
        </div>

        <input
          type="text"
          value={targetZone}
          onChange={(e) => setTargetZone(e.target.value)}
          placeholder="Örn: A_BLOK_KAT_3"
          className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white font-mono font-bold focus:outline-none focus:border-blue-500"
        />

        {/* Quick Zone Presets */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          <span className="text-[10px] text-slate-400">Hızlı Seçim:</span>
          {PRESET_ZONES.map((z) => (
            <button
              key={z}
              type="button"
              onClick={() => setTargetZone(z)}
              className={`px-2 py-1 rounded-lg text-[10px] font-mono transition-colors ${
                targetZone === z
                  ? "bg-blue-600 text-white font-bold"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
              }`}
            >
              {z}
            </button>
          ))}
        </div>
      </div>

      {/* Scanner & Code Input Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
        <div className="space-y-2">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <ScanLine className="w-4 h-4 text-blue-500" />
            <span>QR Kod Okut / Giriş Yap</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Karekod okuyucunuzu barkoda tutun veya malzeme etiketindeki kodu doğrudan yazın.
          </p>
        </div>

        <div className="flex gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="QR Kod (Örn: QR-MAT-001 veya UUID)"
              value={qrCodeInput}
              onChange={(e) => setQrCodeInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault()
                  handleConsume()
                }
              }}
              className="w-full pl-9 pr-4 py-3 text-sm bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white font-mono placeholder-slate-400 focus:outline-none focus:border-blue-500"
            />
            <QrCode className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
          </div>

          <button
            onClick={() => handleConsume()}
            disabled={loading || !qrCodeInput.trim()}
            className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition-all shadow-md shadow-blue-600/30 flex items-center gap-2 disabled:opacity-50 shrink-0"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <PackageCheck className="w-4 h-4" />}
            <span>Tüketildi Olarak İşle</span>
          </button>
        </div>

        {/* Quick Demo Test Buttons */}
        <div className="p-3 bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 rounded-xl space-y-2">
          <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
            Hızlı Test / Örnek Ambar Kodları:
          </span>
          <div className="flex flex-wrap gap-2 text-xs font-mono">
            {["QR-CEM-50KG", "QR-REBAR-16MM", "QR-CERAMIC-60x120", "QR-CABLE-3x25"].map((testCode) => (
              <button
                key={testCode}
                type="button"
                onClick={() => {
                  setQrCodeInput(testCode)
                  handleConsume(testCode)
                }}
                className="px-2.5 py-1 rounded bg-slate-200 dark:bg-slate-800 hover:bg-blue-600 hover:text-white text-slate-700 dark:text-slate-300 text-[11px] transition-colors"
              >
                {testCode}
              </button>
            ))}
          </div>
        </div>

        {errorMsg && (
          <div className="p-3.5 bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800 rounded-xl flex items-center gap-2.5 text-xs text-red-700 dark:text-red-300">
            <AlertTriangle className="w-4 h-4 shrink-0 text-red-500" />
            <span>{errorMsg}</span>
          </div>
        )}
      </div>

      {/* Success Banner: Last Consumed Item */}
      {lastConsumed && (
        <div className="p-5 bg-emerald-50 dark:bg-emerald-950/40 border-2 border-emerald-500/60 rounded-2xl space-y-3 animate-in fade-in">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-xs font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider">
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
              <span>MALZEME BAŞARIYLA TÜKETİLDİ!</span>
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-600 text-white">
              CONSUMED
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-white/60 dark:bg-slate-900/80 p-3.5 rounded-xl border border-emerald-200 dark:border-emerald-800/60">
            <div>
              <span className="text-slate-500 dark:text-slate-400">Malzeme Adı:</span>
              <div className="font-bold text-slate-900 dark:text-white text-sm">
                {lastConsumed.materialName}
              </div>
            </div>

            <div>
              <span className="text-slate-500 dark:text-slate-400">Karekod / Barkod:</span>
              <div className="font-mono font-bold text-slate-900 dark:text-white">
                {lastConsumed.qrCode}
              </div>
            </div>

            <div>
              <span className="text-slate-500 dark:text-slate-400">Tüketilen Konum (currentZone):</span>
              <div className="font-bold text-blue-600 dark:text-blue-400 font-mono">
                {lastConsumed.currentZone}
              </div>
            </div>

            <div>
              <span className="text-slate-500 dark:text-slate-400">Miktar / Birim:</span>
              <div className="font-bold text-slate-900 dark:text-white font-mono">
                {lastConsumed.quantity} {lastConsumed.unit || "Adet"}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Consumption History Table */}
      {history.length > 0 && (
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
              <History className="w-4 h-4" />
              <span>Bu Oturumda Tüketilenler</span>
            </h3>
            <span className="text-[11px] text-slate-400">{history.length} Malzeme</span>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden divide-y divide-slate-100 dark:divide-slate-800 text-xs">
            {history.map((item) => (
              <div key={item.id} className="p-3 flex items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <div className="font-bold text-slate-900 dark:text-white">
                    {item.materialName}
                  </div>
                  <div className="text-[11px] text-slate-400 font-mono flex items-center gap-2">
                    <span>{item.qrCode}</span>
                    <span>•</span>
                    <span className="text-blue-500 font-semibold">{item.currentZone}</span>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950/70 border border-emerald-800 text-emerald-300">
                    {item.quantity} {item.unit || "Adet"} Tüketildi
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
