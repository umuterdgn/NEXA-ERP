"use client"

/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Mobil QR & Barkod Kamera Okuyucu Bileşeni (MobileQRScanner)
 * - html5-qrcode Entegrasyonu
 * - Arka kamera (environment facingMode) desteği
 * - Web Audio API ile Onay Bip Sesi (Beep)
 * - decodedText'i parent bileşene state olarak iletme
 */

import React, { useEffect, useRef, useState, useCallback } from "react"
import { Html5Qrcode, Html5QrcodeSupportedFormats } from "html5-qrcode"
import {
  Camera,
  X,
  Volume2,
  AlertCircle,
  Sparkles,
  RefreshCw,
  Scan,
  CheckCircle2,
  Keyboard,
  Flashlight,
} from "lucide-react"
import { toast } from "react-hot-toast"

interface MobileQRScannerProps {
  isOpen: boolean
  onClose: () => void
  onScanSuccess: (decodedText: string) => void
  title?: string
  description?: string
}

export default function MobileQRScanner({
  isOpen,
  onClose,
  onScanSuccess,
  title = "Mobil QR / İrsaliye Barkod Okuyucu",
  description = "Malzeme etiketini veya irsaliye barkodunu kamera çerçevesine hizalayın",
}: MobileQRScannerProps) {
  const [cameraError, setCameraError] = useState<string | null>(null)
  const [isScanning, setIsScanning] = useState(false)
  const [manualCode, setManualCode] = useState("")
  const [facingMode, setFacingMode] = useState<"environment" | "user">("environment")
  const scannerRef = useRef<Html5Qrcode | null>(null)
  const readerElementId = useRef(`nexa-qr-reader-${Math.random().toString(36).substring(7)}`)

  // 1. Web Audio API ile Temiz Bip Sesi (Beep)
  const playBeep = useCallback(() => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext
      if (!AudioCtx) return
      const ctx = new AudioCtx()
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()

      osc.type = "sine"
      osc.frequency.setValueAtTime(880, ctx.currentTime) // 880Hz (A5)
      gain.gain.setValueAtTime(0.3, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18)

      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start()
      osc.stop(ctx.currentTime + 0.18)
    } catch (e) {
      console.warn("AudioContext beep çalınamadı:", e)
    }
  }, [])

  // 2. Kamerayı Başlatma & html5-qrcode
  const startCamera = useCallback(async () => {
    setCameraError(null)
    const elementId = readerElementId.current

    try {
      // Önceki tarayıcı varsa durdur
      if (scannerRef.current) {
        try {
          if (scannerRef.current.isScanning) {
            await scannerRef.current.stop()
          }
          await scannerRef.current.clear()
        } catch {
          // ignore
        }
      }

      const qrScanner = new Html5Qrcode(elementId, {
        formatsToSupport: [
          Html5QrcodeSupportedFormats.QR_CODE,
          Html5QrcodeSupportedFormats.CODE_128,
          Html5QrcodeSupportedFormats.CODE_39,
          Html5QrcodeSupportedFormats.EAN_13,
          Html5QrcodeSupportedFormats.DATA_MATRIX,
        ],
        verbose: false,
      })

      scannerRef.current = qrScanner

      await qrScanner.start(
        { facingMode },
        {
          fps: 12,
          qrbox: { width: 260, height: 260 },
          aspectRatio: 1.0,
        },
        (decodedText) => {
          // Kod başarıyla okundu!
          playBeep()
          qrScanner
            .stop()
            .catch(() => {})
            .finally(() => {
              setIsScanning(false)
              onScanSuccess(decodedText)
              onClose()
            })
        },
        () => {
          // Tarama devam ediyor (hata frame'lerini yut)
        }
      )

      setIsScanning(true)
    } catch (err: any) {
      console.warn("Kamera başlatma uyarısı:", err)
      setCameraError(
        err?.message ||
          "Kamera başlatılamadı. Lütfen kamera erişim izinlerini kontrol edin veya aşağıdaki örnek test kodlarını kullanın."
      )
      setIsScanning(false)
    }
  }, [facingMode, onClose, onScanSuccess, playBeep])

  // Kamera açılıp kapanma döngüsü
  useEffect(() => {
    if (isOpen) {
      // DOM elementinin mount olmasını bekle
      const timer = setTimeout(() => {
        startCamera()
      }, 300)
      return () => {
        clearTimeout(timer)
        if (scannerRef.current) {
          try {
            if (scannerRef.current.isScanning) {
              scannerRef.current.stop().catch(() => {})
            }
            scannerRef.current.clear()
          } catch {
            // ignore
          }
          scannerRef.current = null
        }
      }
    }
  }, [isOpen, startCamera])

  // Manuel Kod Girişi
  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!manualCode.trim()) return
    playBeep()
    if (scannerRef.current && scannerRef.current.isScanning) {
      scannerRef.current.stop().catch(() => {})
    }
    onScanSuccess(manualCode.trim())
    onClose()
  }

  // Örnek Test Kodu Simülatörü
  const handleTriggerMockCode = (code: string) => {
    playBeep()
    if (scannerRef.current && scannerRef.current.isScanning) {
      scannerRef.current.stop().catch(() => {})
    }
    toast.success(`QR Kod Okundu: ${code} 🎯`, { icon: "🔊" })
    onScanSuccess(code)
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col relative">
        {/* Modal Başlığı */}
        <div className="p-4 sm:p-5 border-b border-slate-800 bg-slate-950 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shadow-lg shadow-emerald-500/10">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                <span>{title}</span>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  CANLI
                </span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">{description}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Kamera & Tarayıcı Görüntüleme Alanı */}
        <div className="p-5 space-y-4">
          <div className="relative aspect-square w-full max-w-sm mx-auto bg-slate-950 rounded-2xl overflow-hidden border-2 border-slate-800 shadow-inner flex items-center justify-center">
            {/* html5-qrcode video container */}
            <div
              id={readerElementId.current}
              className="w-full h-full [&>video]:w-full [&>video]:h-full [&>video]:object-cover"
            />

            {/* Şık Lazer Hedef Çerçevesi (Viewfinder UI) */}
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <div className="relative w-64 h-64 border-2 border-dashed border-emerald-400/80 rounded-2xl flex items-center justify-center shadow-[0_0_20px_rgba(52,211,153,0.2)]">
                {/* Köşe Vurguları */}
                <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-emerald-400 rounded-tl-lg" />
                <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-emerald-400 rounded-tr-lg" />
                <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-emerald-400 rounded-bl-lg" />
                <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-emerald-400 rounded-br-lg" />

                {/* Kayan Kırmızı/Yeşil Lazer Çizgisi */}
                <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_8px_#34d399] animate-pulse" />
              </div>
            </div>

            {/* Kamera Hatası veya İzin Uyarısı */}
            {cameraError && (
              <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-sm p-6 flex flex-col items-center justify-center text-center space-y-3 z-20">
                <AlertCircle className="w-10 h-10 text-amber-400" />
                <p className="text-xs font-semibold text-slate-200">{cameraError}</p>
                <button
                  type="button"
                  onClick={startCamera}
                  className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Tekrar Dene</span>
                </button>
              </div>
            )}
          </div>

          {/* Kamera Yönü Değiştirme Butonu */}
          <div className="flex items-center justify-between text-xs text-slate-400 px-1">
            <span className="flex items-center gap-1.5">
              <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Okutma onayında sesli bip çalınır</span>
            </span>
            <button
              type="button"
              onClick={() =>
                setFacingMode((prev) => (prev === "environment" ? "user" : "environment"))
              }
              className="text-blue-400 hover:text-blue-300 font-semibold flex items-center gap-1 transition"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Kamerayı Çevir ({facingMode === "environment" ? "Arka" : "Ön"})</span>
            </button>
          </div>

          {/* Masaüstü & Hızlı Test Örnek QR Butonları */}
          <div className="pt-2 border-t border-slate-800/80 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Hızlı Test Simülatörü (Tek Tıkla Okut)</span>
              </span>
              <span className="text-[10px] text-slate-500 font-mono">Geliştirici Modu</span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleTriggerMockCode("QR-CIM-500")}
                className="px-3 py-2 bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-emerald-500/50 rounded-xl text-left transition cursor-pointer group"
              >
                <p className="text-xs font-bold text-white group-hover:text-emerald-300">
                  500 Torba Çimento
                </p>
                <p className="text-[10px] text-slate-500 font-mono">Kod: QR-CIM-500</p>
              </button>

              <button
                type="button"
                onClick={() => handleTriggerMockCode("QR-DEMIR-C30")}
                className="px-3 py-2 bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-blue-500/50 rounded-xl text-left transition cursor-pointer group"
              >
                <p className="text-xs font-bold text-white group-hover:text-blue-300">
                  Nervürlü Donatı Çeliği
                </p>
                <p className="text-[10px] text-slate-500 font-mono">Kod: QR-DEMIR-C30</p>
              </button>

              <button
                type="button"
                onClick={() => handleTriggerMockCode("QR-KALIP-PLY")}
                className="px-3 py-2 bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-indigo-500/50 rounded-xl text-left transition cursor-pointer group"
              >
                <p className="text-xs font-bold text-white group-hover:text-indigo-300">
                  18mm Plywood Kalıp
                </p>
                <p className="text-[10px] text-slate-500 font-mono">Kod: QR-KALIP-PLY</p>
              </button>

              <button
                type="button"
                onClick={() => handleTriggerMockCode("QR-UNKNOWN-999")}
                className="px-3 py-2 bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-amber-500/50 rounded-xl text-left transition cursor-pointer group"
              >
                <p className="text-xs font-bold text-amber-300">
                  ❓ Bilinmeyen Ürün
                </p>
                <p className="text-[10px] text-slate-500 font-mono">Kod: QR-UNKNOWN-999</p>
              </button>
            </div>
          </div>

          {/* Manuel Kod Girişi */}
          <form onSubmit={handleManualSubmit} className="pt-2 flex items-center gap-2">
            <div className="relative flex-1">
              <Keyboard className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                placeholder="Veya barkod/QR kodunu manuel yazın..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-mono"
              />
            </div>
            <button
              type="submit"
              disabled={!manualCode.trim()}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition cursor-pointer"
            >
              Okut
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
