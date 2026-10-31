"use client"
/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * This code is the property of NXA Software.
 */

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { signOut } from "next-auth/react"
import { Html5Qrcode } from "html5-qrcode"
import { decryptNfcData } from "@/lib/nfc-crypto"
import WeatherWidget from "@/components/ui/WeatherWidget"
import { 
  User, 
  QrCode, 
  Clock, 
  Wallet, 
  Package, 
  ShieldAlert, 
  Calendar, 
  Bell,
  LogOut,
  X,
  Camera,
  AlertTriangle,
  FileText,
  CheckCircle,
  TrendingUp,
  MapPin,
  Phone,
  Mail,
  Settings,
  ChevronRight,
  ChefHat
} from "lucide-react"

interface PersonnelDashboardProps {
  personnel: {
    id: string
    name: string
    department: string
    currentSite: string
    phone?: string
    email?: string
  }
  summary: {
    estimatedEarnings: number
    totalHours: number
    attendanceCount: number
    equipmentCount: number
    leaveBalance: number
    activeAdvance: number
  }
  recentAttendance: {
    date: string
    checkIn: string
    checkOut: string
    hours: number
  }[]
  equipment: {
    id: number
    name: string
    code: string
    status: string
  }[]
  todayMenu?: {
    items: string
    date: Date
  } | null
}

export function PersonnelDashboard({ personnel, summary, recentAttendance, equipment, todayMenu }: PersonnelDashboardProps) {
  const router = useRouter()
  const [showQRModal, setShowQRModal] = useState(false)
  const [showLeaveModal, setShowLeaveModal] = useState(false)
  const [showAdvanceModal, setShowAdvanceModal] = useState(false)
  const [showISGModal, setShowISGModal] = useState(false)
  const [lastCheckInAction, setLastCheckInAction] = useState<'check-in' | 'check-out' | null>(null)
  const [lastCheckInTime, setLastCheckInTime] = useState<string | null>(null)
  const [isScanning, setIsScanning] = useState(false)
  const [scanResult, setScanResult] = useState<string | null>(null)
  const [cameraError, setCameraError] = useState<string | null>(null)
  const [isWebNfcScanning, setIsWebNfcScanning] = useState(false)
  const html5QrCodeRef = useRef<Html5Qrcode | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)
  const qrCodeElementId = "qr-reader"

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
                setCameraError("Konum alınamadı. Lütfen GPS'i açın.")
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
        const timeString = data.time
        const newAction = data.action === 'check-in' ? 'check-in' : 'check-out'
        setLastCheckInAction(newAction)
        setLastCheckInTime(timeString)
        setScanResult(qrData)
        console.log('Check-in successful:', data)
        return true
      } else {
        console.error('Check-in failed:', data.error || 'Unknown error')
        setCameraError(data.error || 'QR okuma başarısız')
        return false
      }
    } catch (error) {
      console.error('Check-in error:', error)
      setCameraError('Bağlantı hatası oluştu')
      return false
    }
  }

  const startCamera = async () => {
    setCameraError(null)
    setIsScanning(true)
    
    // Wait for DOM to be ready
    await new Promise(resolve => setTimeout(resolve, 100))
    
    try {
      const html5QrCode = new Html5Qrcode(qrCodeElementId)
      html5QrCodeRef.current = html5QrCode

      const config = {
        fps: 10,
        qrbox: { width: 250, height: 250 },
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
      setCameraError('Kamera başlatılamadı. Lütfen tarayıcınızın adres çubuğundaki kilit simgesine (veya site ayarlarına) tıklayarak kamera iznini manuel olarak verin.')
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

  const handleCameraClick = () => {
    startCamera()
  }

  const startWebNfcScan = async () => {
    if (!('NDEFReader' in window)) {
      setCameraError("Tarayıcınız Web NFC özelliğini desteklemiyor (iOS veya desteklenmeyen tarayıcı).")
      return
    }

    try {
      setIsWebNfcScanning(true)
      setCameraError(null)
      const abortController = new AbortController()
      abortControllerRef.current = abortController
      const ndef = new (window as any).NDEFReader()
      await ndef.scan({ signal: abortController.signal })
      
      ndef.onreading = async (event: any) => {
        // HIZLI YAKALAMA: Okunduğu an önce okuyucuyu durdur ki Android araya girmesin
        abortController.abort()
        setIsWebNfcScanning(false)

        try {
          const record = event.message.records[0]
          
          console.log("1. NFC Okundu, format:", record.recordType)
          
          // MIME tipinden gelen veriyi decode et
          const textDecoder = new TextDecoder()
          const rawData = textDecoder.decode(record.data)

          console.log("2. Şifreli Metin (Raw):", rawData)

          // 2. Gelen rawData (şifreli metin) deşifre edilmeye çalışılır
          const decryptedData = decryptNfcData(rawData)

          console.log("3. Çözülen Data:", decryptedData)

          if (decryptedData && decryptedData.id) {
            // 3. ŞİFRE BAŞARIYLA ÇÖZÜLDÜ, GİRİŞ YAP!
            const success = await handleCheckIn(decryptedData.id)
            if (success) {
              setIsScanning(false)
            } else {
              setCameraError("Giriş başarısız")
            }
          } else {
            // 4. Şifre çözülemediyse, eski/standart kart ID'sini (serialNumber) fallback olarak dene
            const serialNumber = event.serialNumber
            if (serialNumber) {
              const success = await handleCheckIn(serialNumber)
              if (success) {
                setIsScanning(false)
              } else {
                setCameraError("Giriş başarısız")
              }
            } else {
              setCameraError("Tanımsız Kart: Geçersiz veri formatı.")
            }
          }
        } catch (error) {
          console.error("NFC Okuma Hatası:", error)
          setCameraError("Kart okunamadı, tekrar deneyin.")
        }
      }

      ndef.onreadingerror = () => {
        // Silent error - don't show toast, just log
        console.log("NFC reading error")
        setIsWebNfcScanning(false)
      }
    } catch (error) {
      console.error("Web NFC error:", error)
      setCameraError("NFC başlatılamadı")
      setIsWebNfcScanning(false)
    }
  }

  // Modal kapatıldığında kamerayı durdur
  useEffect(() => {
    return () => {
      stopCamera()
    }
  }, [])

  const handleQRModalClose = () => {
    stopCamera()
    setShowQRModal(false)
    setCameraError(null)
  }

  const upcomingAnnouncements = [
    { id: 1, title: "İSG Denetimi", date: "Yarın 09:00", type: "warning" },
    { id: 2, title: "Beton Dökümü", date: "Bugün 14:00", type: "info" },
  ]

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY'
    }).format(amount)
  }

  return (
    <div className="min-h-screen bg-slate-950 p-4 lg:p-8">
      {/* Hero Section with Profile */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl p-6 lg:p-8 mb-6 border border-slate-700 shadow-2xl">
        <div className="flex flex-col lg:flex-row items-start lg:items-center gap-6">
          {/* Profile Photo */}
          <div className="relative">
            <div className="w-20 h-20 lg:w-24 lg:h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/30">
              <span className="text-white font-bold text-3xl lg:text-4xl">
                {personnel.name.split(' ').map(n => n[0]).join('')}
              </span>
            </div>
            <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-green-500 rounded-full border-4 border-slate-900 flex items-center justify-center">
              <CheckCircle className="w-4 h-4 text-white" />
            </div>
          </div>

          {/* Profile Info */}
          <div className="flex-1">
            <h1 className="text-2xl lg:text-3xl font-bold text-white mb-2">
              Hoş Geldin, {personnel.name} 👋
            </h1>
            <div className="flex flex-wrap items-center gap-4 text-slate-400">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                <span>{personnel.department}</span>
              </div>
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                <span>{personnel.currentSite}</span>
              </div>
              {personnel.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  <span>{personnel.phone}</span>
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex gap-3">
            <button 
              onClick={() => router.push('/personnel/profile')}
              className="p-3 bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors border border-slate-700"
            >
              <Settings className="w-5 h-5 text-slate-400" />
            </button>
            <button 
              onClick={() => signOut({ callbackUrl: '/login' })}
              className="p-3 bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors border border-slate-700"
            >
              <LogOut className="w-5 h-5 text-red-400" />
            </button>
          </div>
        </div>
      </div>

      {/* Quick Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Weather Widget */}
        <WeatherWidget city={personnel.currentSite || "İskenderun"} />

        {/* QR Check-in - Large Action Button */}
        <button
          onClick={() => router.push('/personnel/qr-checkin')}
          className="col-span-1 md:col-span-2 lg:col-span-1 bg-gradient-to-br from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 rounded-2xl p-6 transition-all shadow-lg shadow-blue-500/30 group"
        >
          <div className="flex flex-col items-center text-center gap-4">
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <QrCode className="w-8 h-8 text-white" />
            </div>
            <div>
              <h3 className="text-white font-bold text-lg">QR ile Mesai Başla/Bitir</h3>
              <p className="text-blue-100 text-sm">Hızlı giriş/çıkış</p>
            </div>
          </div>
        </button>

        {/* Leave Balance */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 hover:border-emerald-500/50 transition-colors">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-emerald-500/20 rounded-xl flex items-center justify-center">
              <Calendar className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <p className="text-slate-400 text-sm">Kalan İzin</p>
              <p className="text-2xl font-bold text-white">{summary.leaveBalance} gün</p>
            </div>
          </div>
          <button
            onClick={() => setShowLeaveModal(true)}
            className="w-full py-2 bg-emerald-600/20 text-emerald-400 rounded-lg hover:bg-emerald-600 hover:text-white transition-colors text-sm font-medium flex items-center justify-center gap-2"
          >
            <FileText className="w-4 h-4" />
            İzin Talep Et
          </button>
        </div>

        {/* Advance Status */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 hover:border-amber-500/50 transition-colors">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-amber-500/20 rounded-xl flex items-center justify-center">
              <Wallet className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <p className="text-slate-400 text-sm">Aktif Avans</p>
              <p className="text-2xl font-bold text-white">{formatCurrency(summary.activeAdvance)}</p>
            </div>
          </div>
          <button
            onClick={() => setShowAdvanceModal(true)}
            className="w-full py-2 bg-amber-600/20 text-amber-400 rounded-lg hover:bg-amber-600 hover:text-white transition-colors text-sm font-medium flex items-center justify-center gap-2"
          >
            <Wallet className="w-4 h-4" />
            Avans Talep Et
          </button>
        </div>
      </div>

      {/* Today's Menu Card */}
      <div className="bg-gradient-to-br from-orange-600/10 to-red-600/10 border border-orange-500/30 rounded-2xl p-6 mb-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-orange-500/20 rounded-xl flex items-center justify-center">
            <ChefHat className="w-5 h-5 text-orange-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Günün Menüsü</h3>
            <p className="text-slate-400 text-sm">
              {todayMenu 
                ? new Date(todayMenu.date).toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' })
                : new Date().toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' })
              }
            </p>
          </div>
        </div>
        {todayMenu ? (
          <div className="space-y-2">
            {todayMenu.items.split(',').map((item, index) => (
              <div key={index} className="flex items-center gap-2 text-slate-300">
                <div className="w-2 h-2 bg-orange-400 rounded-full" />
                <span>{item.trim()}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-slate-400 text-sm">Bugün için menü bilgisi girilmedi.</p>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Estimated Earnings */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-green-500/20 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-green-400" />
            </div>
            <p className="text-slate-400 text-sm">Bu Ay Tahmini Kazanç</p>
          </div>
          <p className="text-2xl font-bold text-white">{formatCurrency(summary.estimatedEarnings)}</p>
        </div>

        {/* Total Hours */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-blue-500/20 rounded-xl flex items-center justify-center">
              <Clock className="w-5 h-5 text-blue-400" />
            </div>
            <p className="text-slate-400 text-sm">Toplam Mesai Saati</p>
          </div>
          <p className="text-2xl font-bold text-white">{summary.totalHours} saat</p>
        </div>

        {/* Attendance Count */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-purple-500/20 rounded-xl flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-purple-400" />
            </div>
            <p className="text-slate-400 text-sm">Bu Ay Mesai</p>
          </div>
          <p className="text-2xl font-bold text-white">{summary.attendanceCount} gün</p>
        </div>

        {/* Equipment Count */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-orange-500/20 rounded-xl flex items-center justify-center">
              <Package className="w-5 h-5 text-orange-400" />
            </div>
            <p className="text-slate-400 text-sm">Zimmetli Ekipman</p>
          </div>
          <p className="text-2xl font-bold text-white">{summary.equipmentCount} adet</p>
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Recent Attendance */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-400" />
              Son Mesai Kayıtları
            </h3>
            <button 
              onClick={() => router.push('/personnel/attendance')}
              className="text-blue-400 text-sm hover:text-blue-300 transition-colors"
            >
              Tümünü Gör
            </button>
          </div>
          <div className="space-y-3">
            {recentAttendance.map((record, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-4 bg-slate-800/50 rounded-xl border border-slate-700"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                    <Clock className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <p className="text-white font-medium">{record.date}</p>
                    <p className="text-slate-400 text-sm">
                      {record.checkIn} - {record.checkOut}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-green-400 font-semibold">{record.hours} saat</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Equipment */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <Package className="w-5 h-5 text-orange-400" />
              Zimmetli Ekipmanlar
            </h3>
            <button 
              onClick={() => router.push('/personnel/equipment')}
              className="text-blue-400 text-sm hover:text-blue-300 transition-colors"
            >
              Tümünü Gör
            </button>
          </div>
          <div className="space-y-3">
            {equipment.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-4 bg-slate-800/50 rounded-xl border border-slate-700"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-orange-500/20 rounded-lg flex items-center justify-center">
                    <Package className="w-5 h-5 text-orange-400" />
                  </div>
                  <div>
                    <p className="text-white font-medium">{item.name}</p>
                    <p className="text-slate-400 text-sm">{item.code}</p>
                  </div>
                </div>
                <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-xs font-medium">
                  Aktif
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Announcements & ISG Quick Action */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Announcements */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <Bell className="w-5 h-5 text-amber-400" />
              Duyurular
            </h3>
            <button 
              onClick={() => router.push('/personnel/announcements')}
              className="text-blue-400 text-sm hover:text-blue-300 transition-colors"
            >
              Tümünü Gör
            </button>
          </div>
          <div className="space-y-3">
            {upcomingAnnouncements.map((announcement) => (
              <div
                key={announcement.id}
                className={`p-4 rounded-xl border ${
                  announcement.type === 'warning'
                    ? 'bg-amber-500/10 border-amber-500/30'
                    : 'bg-blue-500/10 border-blue-500/30'
                }`}
              >
                <div className="flex items-start gap-3">
                  <AlertTriangle className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
                    announcement.type === 'warning' ? 'text-amber-400' : 'text-blue-400'
                  }`} />
                  <div className="flex-1">
                    <p className="text-white font-medium">{announcement.title}</p>
                    <p className="text-slate-400 text-sm mt-1">{announcement.date}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* İSG Quick Action */}
        <button
          onClick={() => setShowISGModal(true)}
          className="bg-gradient-to-br from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 rounded-2xl p-6 transition-all shadow-lg shadow-red-500/30 group"
        >
          <div className="flex flex-col items-center text-center gap-4 h-full justify-center">
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <ShieldAlert className="w-8 h-8 text-white" />
            </div>
            <div>
              <h3 className="text-white font-bold text-lg">İSG Bildir</h3>
              <p className="text-red-100 text-sm">Tehlike/Kaza bildirimi</p>
            </div>
          </div>
        </button>
      </div>

      {/* QR Modal */}
      {showQRModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-2xl p-8 max-w-lg w-full border border-slate-800">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-white">QR ile Mesai Takibi</h3>
              <button
                onClick={handleQRModalClose}
                className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            
            {/* Status Display */}
            {lastCheckInAction && (
              <div className={`mb-6 p-4 rounded-xl border ${
                lastCheckInAction === 'check-in' 
                  ? 'bg-green-500/10 border-green-500/30' 
                  : 'bg-orange-500/10 border-orange-500/30'
              }`}>
                <div className="flex items-center gap-3">
                  {lastCheckInAction === 'check-in' ? (
                    <CheckCircle className="w-5 h-5 text-green-400" />
                  ) : (
                    <Clock className="w-5 h-5 text-orange-400" />
                  )}
                  <div>
                    <p className="text-white font-medium">
                      {lastCheckInAction === 'check-in' ? 'Giriş Yapıldı' : 'Çıkış Yapıldı'}
                    </p>
                    <p className="text-slate-400 text-sm">
                      {lastCheckInAction === 'check-in' 
                        ? 'Çıkış için QR kodu okutun' 
                        : 'Yarın tekrar giriş yapın'}
                    </p>
                    {lastCheckInTime && (
                      <p className="text-slate-500 text-xs mt-1">{lastCheckInTime}</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Camera Error Display */}
            {cameraError && (
              <div className="mb-6 p-4 rounded-xl border border-red-500/30 bg-red-500/10">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="w-5 h-5 text-red-400" />
                  <p className="text-white font-medium text-sm">{cameraError}</p>
                </div>
              </div>
            )}

            {/* QR Scanner */}
            <div className="mb-6">
              {!isScanning ? (
                <div 
                  onClick={handleCameraClick}
                  className="text-center py-10 border-2 border-dashed rounded-xl cursor-pointer hover:border-blue-500/50 transition-colors"
                >
                  <Camera className="w-20 h-20 mx-auto mb-4 text-blue-400" />
                  <p className="text-slate-300 font-medium mb-2">QR Kodu Okutmak İçin Tıklayın</p>
                  <p className="text-slate-500 text-sm">
                    {lastCheckInAction === 'check-in' 
                      ? 'Çıkış yapmak için kamerayı QR koda yönlendirin' 
                      : 'Giriş yapmak için kamerayı QR koda yönlendirin'}
                  </p>
                </div>
              ) : (
                <div className="relative">
                  <div id={qrCodeElementId} className="rounded-xl overflow-hidden" />
                  <div className="mt-4 text-center">
                    <p className="text-blue-400 font-medium mb-2">QR Kodu Taranıyor...</p>
                    <p className="text-slate-500 text-sm">Lütfen kamerayı QR koda yönlendirin</p>
                  </div>
                </div>
              )}
            </div>

            {scanResult && !isScanning && (
              <div className="mb-4 p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
                <p className="text-green-400 text-sm">QR Kodu Okundu</p>
              </div>
            )}

            <div className="flex gap-3">
              <button 
                onClick={handleCameraClick}
                disabled={isScanning}
                className={`flex-1 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl transition-all font-medium text-lg shadow-lg shadow-blue-500/30 ${
                  isScanning ? 'opacity-50 cursor-not-allowed' : 'hover:from-blue-500 hover:to-purple-500'
                }`}
              >
                {isScanning ? 'Taranıyor...' : '📷 QR ile Okut'}
              </button>
              <button 
                onClick={startWebNfcScan}
                disabled={isWebNfcScanning}
                className={`flex-1 py-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl transition-all font-medium text-lg shadow-lg shadow-green-500/30 ${
                  isWebNfcScanning ? 'opacity-50 cursor-not-allowed' : 'hover:from-green-500 hover:to-emerald-500'
                }`}
              >
                {isWebNfcScanning ? 'Okunuyor...' : '📱 NFC ile Okut'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Leave Request Modal */}
      {showLeaveModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-2xl p-6 max-w-md w-full border border-slate-800">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-white">İzin Talep Et</h3>
              <button
                onClick={() => setShowLeaveModal(false)}
                className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-slate-400 mb-2">İzin Tipi</label>
                <select className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-emerald-500">
                  <option>Yıllık İzin</option>
                  <option>Mazeret İzni</option>
                  <option>Hastalık İzni</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-slate-400 mb-2">Başlangıç</label>
                  <input type="date" className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-emerald-500" />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-2">Bitiş</label>
                  <input type="date" className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-emerald-500" />
                </div>
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-2">Açıklama</label>
                <textarea className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-emerald-500 resize-none" rows={3} placeholder="Açıklama girin..." />
              </div>
              <button 
                onClick={() => { console.log('İzin Talep Gönder triggered'); setShowLeaveModal(false); }}
                className="w-full py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-500 transition-colors"
              >
                Talep Gönder
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Advance Request Modal */}
      {showAdvanceModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-2xl p-6 max-w-md w-full border border-slate-800">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-white">Avans Talep Et</h3>
              <button
                onClick={() => setShowAdvanceModal(false)}
                className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-slate-400 mb-2">Tutar (₺)</label>
                <input type="number" placeholder="5000" className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-amber-500" />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-2">Açıklama</label>
                <textarea className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-amber-500 resize-none" rows={3} placeholder="Açıklama girin..." />
              </div>
              <button 
                onClick={() => { console.log('Avans Talep Gönder triggered'); setShowAdvanceModal(false); }}
                className="w-full py-3 bg-amber-600 text-white rounded-xl hover:bg-amber-500 transition-colors"
              >
                Talep Gönder
              </button>
            </div>
          </div>
        </div>
      )}

      {/* İSG Report Modal */}
      {showISGModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-2xl p-6 max-w-md w-full border border-slate-800">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-white">İSG Tehlike Bildir</h3>
              <button
                onClick={() => setShowISGModal(false)}
                className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-slate-400 mb-2">Bildirim Tipi</label>
                <select className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-red-500">
                  <option>Tehlike</option>
                  <option>Kaza Tutanak</option>
                  <option>Eksik Döküm</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-2">Konum</label>
                <input type="text" placeholder="Örn: Bina A - 3. Kat" className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-red-500" />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-2">Açıklama</label>
                <textarea className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-red-500 resize-none" rows={3} placeholder="Detaylı açıklama..." />
              </div>
              <div className="border-2 border-dashed border-slate-700 rounded-xl p-6 text-center">
                <Camera className="w-8 h-8 mx-auto mb-2 text-slate-400" />
                <p className="text-slate-400 text-sm">Fotoğraf eklemek için tıklayın</p>
              </div>
              <button 
                onClick={() => { console.log('İSG Bildir triggered'); setShowISGModal(false); }}
                className="w-full py-3 bg-red-600 text-white rounded-xl hover:bg-red-500 transition-colors"
              >
                Bildir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
