/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * This code is the property of NXA Software.
 */

"use client"

import { useState, useEffect, useRef } from "react"
import { Camera, QrCode, CheckCircle, Clock, AlertCircle, RefreshCw } from "lucide-react"
import { Html5Qrcode } from "html5-qrcode"

export default function QRCheckinPage() {
  const [isScanning, setIsScanning] = useState(false)
  const [lastAction, setLastAction] = useState<'check-in' | 'check-out' | null>(null)
  const [lastTime, setLastTime] = useState<string | null>(null)
  const [scanResult, setScanResult] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const html5QrCodeRef = useRef<Html5Qrcode | null>(null)
  const qrCodeElementId = "qr-reader-page"

  const handleCheckIn = async (qrData: string) => {
    try {
      // First, check if GPS is required for this project
      let coordinates = null
      let gpsRequired = false
      
      try {
        // Parse QR data to get projectId
        let projectId = null
        try {
          const parsed = JSON.parse(qrData)
          projectId = parsed.projectId
        } catch {
          // QR is not JSON, might be just personnel ID
        }
        
        if (projectId) {
          // Fetch project settings to check GPS requirement
          const projectResponse = await fetch(`/api/admin/projects/${projectId}`)
          if (projectResponse.ok) {
            const projectData = await projectResponse.json()
            gpsRequired = projectData.gpsRequired || false
            
            // Only get location if GPS is required
            if (gpsRequired && navigator.geolocation) {
              coordinates = await new Promise<GeolocationPosition | null>((resolve) => {
                navigator.geolocation.getCurrentPosition(
                  (position) => resolve(position),
                  (error) => {
                    console.error("GPS error:", error)
                    resolve(null)
                  },
                  { enableHighAccuracy: true, timeout: 10000 }
                )
              })
              
              if (!coordinates) {
                setError("Konum alınamadı. Lütfen GPS'i açın.")
                return false
              }
            }
          }
        }
      } catch (error) {
        console.error("Error checking GPS requirement:", error)
        // Continue without GPS if we can't check the setting
      }

      const response = await fetch('/api/personnel/attendance/scan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          qrData,
          latitude: coordinates?.coords.latitude || null,
          longitude: coordinates?.coords.longitude || null,
          gpsRequired
        }),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        setLastAction(data.action === 'check-in' ? 'check-in' : 'check-out')
        setLastTime(data.time)
        setScanResult(qrData)
        return true
      } else {
        setError(data.error || 'QR okuma başarısız')
        return false
      }
    } catch (err) {
      setError('Bağlantı hatası oluştu')
      return false
    }
  }

  const startCamera = async () => {
    setError(null)
    setIsScanning(true)
    
    try {
      const html5QrCode = new Html5Qrcode(qrCodeElementId)
      html5QrCodeRef.current = html5QrCode

      const config = {
        fps: 10,
        qrbox: { width: 300, height: 300 },
        aspectRatio: 1.0
      }

      await html5QrCode.start(
        { facingMode: "environment" },
        config,
        async (decodedText: string) => {
          // QR kod başarıyla okundu
          console.log('QR Code scanned:', decodedText)
          
          // Kamerayı durdur
          await stopCamera()
          
          // QR verisini parse et
          let qrData = decodedText
          try {
            const parsed = JSON.parse(decodedText)
            qrData = JSON.stringify(parsed)
          } catch {
            // JSON değil, ham metin olarak kullan
            qrData = decodedText
          }
          
          // API'ye gönder
          const success = await handleCheckIn(qrData)
          if (success) {
            setIsScanning(false)
          }
        },
        (errorMessage: string) => {
          // Hata durumunda (QR okunamadı)
          console.log('QR scan error:', errorMessage)
        }
      )
    } catch (error) {
      console.error('Camera start error:', error)
      setError('Kamera başlatılamadı. Lütfen kamera izni verin.')
      setIsScanning(false)
    }
  }

  const stopCamera = async () => {
    if (html5QrCodeRef.current) {
      try {
        await html5QrCodeRef.current.stop()
        html5QrCodeRef.current.clear()
        html5QrCodeRef.current = null
      } catch (error) {
        console.error('Camera stop error:', error)
      }
    }
  }

  const handleScan = () => {
    startCamera()
  }

  // Component unmount olduğunda kamerayı durdur
  useEffect(() => {
    return () => {
      stopCamera()
    }
  }, [])

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">QR Giriş/Çıkış</h1>
        <p className="text-slate-400">QR kod okutarak mesai giriş-çıkış işlemlerinizi yapın</p>
      </div>

      <div className="max-w-2xl mx-auto">
        {/* Status Display */}
        {lastAction && lastTime && (
          <div className={`mb-6 p-6 rounded-2xl border ${
            lastAction === 'check-in' 
              ? 'bg-green-500/10 border-green-500/30' 
              : 'bg-orange-500/10 border-orange-500/30'
          }`}>
            <div className="flex items-center gap-4">
              <div className={`w-16 h-16 rounded-xl flex items-center justify-center ${
                lastAction === 'check-in' ? 'bg-green-500/20' : 'bg-orange-500/20'
              }`}>
                {lastAction === 'check-in' ? (
                  <CheckCircle className="w-8 h-8 text-green-400" />
                ) : (
                  <Clock className="w-8 h-8 text-orange-400" />
                )}
              </div>
              <div className="flex-1">
                <p className="text-white font-bold text-xl mb-1">
                  {lastAction === 'check-in' ? 'Mesaiye Başladınız' : 'Mesaiyi Bitirdiniz'}
                </p>
                <p className="text-slate-300 text-lg">{lastTime}</p>
                {scanResult && (
                  <p className="text-slate-500 text-sm mt-2">QR: {scanResult}</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="mb-6 p-6 rounded-2xl border border-red-500/30 bg-red-500/10">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-xl flex items-center justify-center bg-red-500/20">
                <AlertCircle className="w-8 h-8 text-red-400" />
              </div>
              <div className="flex-1">
                <p className="text-white font-bold text-xl mb-1">Hata</p>
                <p className="text-slate-300">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* QR Scanner Area */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8">
          <div className="mb-6">
            {!isScanning ? (
              <div 
                onClick={handleScan}
                className="relative aspect-square max-w-md mx-auto rounded-2xl border-2 border-dashed border-slate-700 hover:border-blue-500/50 transition-all cursor-pointer flex flex-col items-center justify-center"
              >
                <QrCode className="w-24 h-24 text-slate-600 mb-4" />
                <p className="text-slate-400 font-medium text-lg mb-2">QR Kod Okutmak İçin Tıklayın</p>
                <p className="text-slate-500 text-sm">veya aşağıdaki butonu kullanın</p>
              </div>
            ) : (
              <div className="relative aspect-square max-w-md mx-auto rounded-2xl overflow-hidden">
                <div id={qrCodeElementId} className="w-full h-full" />
                <div className="absolute inset-0 flex items-center justify-center bg-black/30 pointer-events-none">
                  <div className="text-center">
                    <p className="text-blue-400 font-semibold text-lg mb-2">QR Kod Taranıyor...</p>
                    <p className="text-slate-300 text-sm">Lütfen kamerayı QR koda yönlendirin</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <button
            onClick={handleScan}
            disabled={isScanning}
            className={`w-full py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl transition-all font-medium text-lg shadow-lg shadow-blue-500/30 flex items-center justify-center gap-3 ${
              isScanning ? 'opacity-50 cursor-not-allowed' : 'hover:from-blue-500 hover:to-purple-500'
            }`}
          >
            {isScanning ? (
              <>
                <RefreshCw className="w-5 h-5 animate-spin" />
                Taranıyor...
              </>
            ) : (
              <>
                <Camera className="w-5 h-5" />
                Kamerayı Aç
              </>
            )}
          </button>
        </div>

        {/* Instructions */}
        <div className="mt-6 bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
            <Camera className="w-5 h-5 text-blue-400" />
            Nasıl Kullanılır?
          </h3>
          <ol className="space-y-3 text-slate-300">
            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-blue-500/20 rounded-full flex items-center justify-center text-blue-400 text-sm font-medium">1</span>
              <span>QR okuma alanına tıklayın veya "Kamerayı Aç" butonuna basın</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-blue-500/20 rounded-full flex items-center justify-center text-blue-400 text-sm font-medium">2</span>
              <span>Kamera izni verin ve kamerayı QR koda yönlendirin</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-blue-500/20 rounded-full flex items-center justify-center text-blue-400 text-sm font-medium">3</span>
              <span>Sistem otomatik olarak giriş veya çıkış işlemini gerçekleştirir</span>
            </li>
          </ol>
        </div>
      </div>
    </div>
  )
}
