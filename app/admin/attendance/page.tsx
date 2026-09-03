"use client"
/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * This code is the property of NXA Software.
 */


import { useState, useEffect, useRef } from "react"
import { toast } from "react-hot-toast"
import { QRCodeSVG } from "qrcode.react"
import * as XLSX from "xlsx"
import GeofencedCheckIn from "@/components/GeofencedCheckIn"
import { processNfcAttendance } from "./actions"
import { decryptNfcData } from "@/lib/nfc-crypto"

export default function AttendancePage() {
  const [projects, setProjects] = useState<any[]>([])
  const [personnel, setPersonnel] = useState<any[]>([])
  const [attendanceRecords, setAttendanceRecords] = useState<any[]>([])
  const [visitorRecords, setVisitorRecords] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedTeamFilter, setSelectedTeamFilter] = useState("Tüm Takımlar")
  const [selectedProjectFilter, setSelectedProjectFilter] = useState("")
  const [dateFilter, setDateFilter] = useState({ startDate: "", endDate: "" })

  // QR Code state
  const [selectedProjectForQR, setSelectedProjectForQR] = useState("")
  const [showQRModal, setShowQRModal] = useState(false)

  // GPS Settings state
  const [gpsSettings, setGpsSettings] = useState({
    gpsRequired: false,
    latitude: "",
    longitude: "",
    gpsRadius: "100"
  })

  // Manual attendance form state
  const [isManualAttendanceOpen, setIsManualAttendanceOpen] = useState(false)
  const [manualAttendanceForm, setManualAttendanceForm] = useState({
    personelId: "",
    projectId: "",
    checkInTime: "",
    checkOutTime: "",
    dayMultiplier: 1, // Default to full day
    overtimeHours: 0 // Mesai saati (opsiyonel)
  })
  const [personelSearchTerm, setPersonelSearchTerm] = useState("")
  const [isPersonelDropdownOpen, setIsPersonelDropdownOpen] = useState(false)

  // NFC Terminal state
  const [isNfcModalOpen, setIsNfcModalOpen] = useState(false)
  const [nfcInput, setNfcInput] = useState("")
  const [selectedProjectForNfc, setSelectedProjectForNfc] = useState("")
  const [isWebNfcScanning, setIsWebNfcScanning] = useState(false)
  const nfcInputRef = useRef<HTMLInputElement>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  // Turkish character normalization function
  const normalizeTurkishChars = (text: string) => {
    return text
      .toLowerCase()
      .replace(/ı/g, 'i')
      .replace(/ğ/g, 'g')
      .replace(/ü/g, 'u')
      .replace(/ş/g, 's')
      .replace(/ö/g, 'o')
      .replace(/ç/g, 'c')
  }

  useEffect(() => {
    fetchProjects()
    fetchPersonnel()
    fetchAttendanceRecords()
    fetchVisitorRecords()
  }, [])

  const fetchProjects = async () => {
    try {
      const response = await fetch("/api/admin/projects")
      if (response.ok) {
        const data = await response.json()
        setProjects(Array.isArray(data) ? data : (data?.projects || []))
      }
    } catch (error) {
      console.error("Failed to fetch projects:", error)
    }
  }

  const fetchPersonnel = async () => {
    try {
      const response = await fetch("/api/admin/personnel")
      if (response.ok) {
        const data = await response.json()
        setPersonnel(Array.isArray(data) ? data : [])
      }
    } catch (error) {
      console.error("Failed to fetch personnel:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchAttendanceRecords = async () => {
    try {
      const response = await fetch("/api/admin/attendance-records")
      if (response.ok) {
        const data = await response.json()
        setAttendanceRecords(Array.isArray(data) ? data : [])
      }
    } catch (error) {
      console.error("Failed to fetch attendance records:", error)
    }
  }

  const fetchVisitorRecords = async () => {
    try {
      const response = await fetch("/api/attendance/visitor")
      if (response.ok) {
        const data = await response.json()
        setVisitorRecords(Array.isArray(data) ? data : [])
      }
    } catch (error) {
      console.error("Failed to fetch visitor records:", error)
    }
  }

  const handleManualAttendanceSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!manualAttendanceForm.personelId || !manualAttendanceForm.projectId) {
      toast.error("Personel ve proje seçiniz")
      return
    }

    try {
      const today = new Date().toISOString().split('T')[0]
      const response = await fetch("/api/admin/attendance-records", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          personelId: manualAttendanceForm.personelId,
          projectId: manualAttendanceForm.projectId,
          date: today,
          checkIn: manualAttendanceForm.checkInTime ? `${today}T${manualAttendanceForm.checkInTime}` : null,
          checkOut: manualAttendanceForm.checkOutTime ? `${today}T${manualAttendanceForm.checkOutTime}` : null,
          dayMultiplier: manualAttendanceForm.dayMultiplier,
          overtimeHours: manualAttendanceForm.overtimeHours
        })
      })

      if (response.ok) {
        toast.success("Yoklama başarıyla eklendi")
        fetchAttendanceRecords()
        setIsManualAttendanceOpen(false)
        setManualAttendanceForm({
          personelId: "",
          projectId: "",
          checkInTime: "",
          checkOutTime: "",
          dayMultiplier: 1,
          overtimeHours: 0
        })
        setPersonelSearchTerm("")
      } else {
        toast.error("Yoklama eklenirken hata oluştu")
      }
    } catch (error) {
      toast.error("Yoklama eklenirken hata oluştu")
    }
  }

  const exportAttendanceToExcel = () => {
    const filteredRecords = attendanceRecords.filter(record => {
      const recordDate = new Date(record.date)
      const startDate = dateFilter.startDate ? new Date(dateFilter.startDate) : null
      const endDate = dateFilter.endDate ? new Date(dateFilter.endDate) : null
      
      if (startDate && recordDate < startDate) return false
      if (endDate && recordDate > endDate) return false
      if (selectedProjectFilter && record.projectId !== selectedProjectFilter) return false
      
      return true
    })

    const data = filteredRecords.map(record => ({
      "İşçi Adı": `${record.worker?.firstName} ${record.worker?.lastName}`,
      "Kullanıcı Adı": record.worker?.username,
      "Takım": record.worker?.team,
      "Tarih": new Date(record.date).toLocaleDateString("tr-TR"),
      "Giriş Saati": record.checkIn ? new Date(record.checkIn).toLocaleTimeString("tr-TR") : "-",
      "Çıkış Saati": record.checkOut ? new Date(record.checkOut).toLocaleTimeString("tr-TR") : "-",
      "Proje": record.project?.name || record.project?.title
    }))

    const ws = XLSX.utils.json_to_sheet(data)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "Yoklamalar")
    XLSX.writeFile(wb, "personel_yoklamalari.xlsx")
    toast.success("Excel dosyası indirildi")
  }

  const exportVisitorsToExcel = () => {
    const filteredRecords = visitorRecords.filter(record => {
      const recordDate = new Date(record.checkIn)
      const startDate = dateFilter.startDate ? new Date(dateFilter.startDate) : null
      const endDate = dateFilter.endDate ? new Date(dateFilter.endDate) : null
      
      if (startDate && recordDate < startDate) return false
      if (endDate && recordDate > endDate) return false
      if (selectedProjectFilter && record.projectId !== selectedProjectFilter) return false
      
      return true
    })

    const data = filteredRecords.map(record => ({
      "Ad Soyad": record.fullName,
      "Firma": record.company || "-",
      "Ziyaret Sebebi": record.reason || "-",
      "Giriş Zamanı": new Date(record.checkIn).toLocaleString("tr-TR"),
      "Çıkış Zamanı": record.checkOut ? new Date(record.checkOut).toLocaleString("tr-TR") : "-",
      "Proje": record.project?.name || record.project?.title
    }))

    const ws = XLSX.utils.json_to_sheet(data)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "Ziyaretçiler")
    XLSX.writeFile(wb, "ziyaretci_kayitlari.xlsx")
    toast.success("Excel dosyası indirildi")
  }

  const handleGenerateQR = () => {
    if (!selectedProjectForQR) {
      toast.error("Lütfen bir proje seçin")
      return
    }
    setShowQRModal(true)
  }

  const handleProjectChange = (projectId: string) => {
    setSelectedProjectForQR(projectId)
    // Load GPS settings for selected project
    const project = projects.find(p => p.id === projectId)
    if (project) {
      setGpsSettings({
        gpsRequired: project.gpsRequired || false,
        latitude: project.latitude?.toString() || "",
        longitude: project.longitude?.toString() || "",
        gpsRadius: project.gpsRadius?.toString() || "100"
      })
    }
  }

  const handleNfcSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!nfcInput.trim()) {
      toast.error("Kart UID boş")
      return
    }

    if (!selectedProjectForNfc) {
      toast.error("Lütfen bir proje seçin")
      return
    }

    const result = await processNfcAttendance(nfcInput.trim(), selectedProjectForNfc)

    if (result.success) {
      const actionText = result.action === "checkin" ? "Giriş" : "Çıkış"
      toast.success(`${result.personelName} - ${actionText} Başarılı (${result.time})`)
      setNfcInput("")
      fetchAttendanceRecords()
      // Re-focus input for next scan
      setTimeout(() => {
        nfcInputRef.current?.focus()
      }, 100)
    } else {
      toast.error(result.error || "İşlem başarısız")
      setNfcInput("")
      setTimeout(() => {
        nfcInputRef.current?.focus()
      }, 100)
    }
  }

  const handleNfcKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleNfcSubmit(e)
    }
  }

  const startWebNfcScan = async () => {
    if (!('NDEFReader' in window)) {
      toast.error("Tarayıcınız Web NFC özelliğini desteklemiyor (iOS veya desteklenmeyen tarayıcı).")
      return
    }

    if (!selectedProjectForNfc) {
      toast.error("Lütfen önce bir proje seçin")
      return
    }

    try {
      setIsWebNfcScanning(true)
      const abortController = new AbortController()
      abortControllerRef.current = abortController
      const ndef = new (window as any).NDEFReader()
      await ndef.scan({ signal: abortController.signal })
      toast.success("NFC okuma başlatıldı. Kartı okutun...")

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
            setNfcInput(decryptedData.id)
            const result = await processNfcAttendance(decryptedData.id, selectedProjectForNfc)
            if (result.success) {
              const actionText = result.action === "checkin" ? "Giriş" : "Çıkış"
              toast.success(`${result.personelName} - ${actionText} Başarılı (${result.time})`)
              setNfcInput("")
              fetchAttendanceRecords()
            } else {
              toast.error(result.error || "İşlem başarısız")
              setNfcInput("")
            }
          } else {
            // 4. Şifre çözülemediyse, eski/standart kart ID'sini (serialNumber) fallback olarak dene
            const serialNumber = event.serialNumber
            if (serialNumber) {
              setNfcInput(serialNumber)
              const result = await processNfcAttendance(serialNumber, selectedProjectForNfc)
              if (result.success) {
                const actionText = result.action === "checkin" ? "Giriş" : "Çıkış"
                toast.success(`${result.personelName} - ${actionText} Başarılı (${result.time})`)
                setNfcInput("")
                fetchAttendanceRecords()
              } else {
                toast.error(result.error || "İşlem başarısız")
                setNfcInput("")
              }
            } else {
              toast.error("Tanımsız Kart: Geçersiz veri formatı.")
            }
          }
        } catch (error) {
          console.error("NFC Okuma Hatası:", error)
          toast.error("Kart okunamadı, tekrar deneyin.")
        }
      }

      ndef.onreadingerror = () => {
        // Silent error - don't show toast, just log
        console.log("NFC reading error")
        setIsWebNfcScanning(false)
      }
    } catch (error) {
      console.error("Web NFC error:", error)
      toast.error("NFC başlatılamadı")
      setIsWebNfcScanning(false)
    }
  }

  const handleSaveGpsSettings = async () => {
    if (!selectedProjectForQR) {
      toast.error("Lütfen bir proje seçin")
      return
    }

    try {
      const response = await fetch(`/api/admin/projects/${selectedProjectForQR}/gps-settings`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gpsRequired: gpsSettings.gpsRequired,
          latitude: gpsSettings.latitude ? parseFloat(gpsSettings.latitude) : null,
          longitude: gpsSettings.longitude ? parseFloat(gpsSettings.longitude) : null,
          gpsRadius: gpsSettings.gpsRadius ? parseInt(gpsSettings.gpsRadius) : 100
        })
      })

      if (response.ok) {
        toast.success("GPS ayarları kaydedildi")
        fetchProjects()
      } else {
        toast.error("GPS ayarları kaydedilemedi")
      }
    } catch (error) {
      toast.error("GPS ayarları kaydedilemedi")
    }
  }

  const handleVisitorCheckout = async (visitorId: string) => {
    try {
      const response = await fetch(`/api/attendance/visitor/${visitorId}`, {
        method: "PATCH"
      })

      if (response.ok) {
        toast.success("Ziyaretçi çıkışı yapıldı")
        fetchVisitorRecords()
      } else {
        toast.error("Çıkış yapılırken hata oluştu")
      }
    } catch (error) {
      toast.error("Çıkış yapılırken hata oluştu")
    }
  }

  const getCheckInURL = (projectId: string) => {
    const project = projects.find(p => p.id === projectId)
    const shiftStart = project?.shiftStart || "08:00"
    const shiftEnd = project?.shiftEnd || "17:00"
    
    // Create a JSON object with project info
    const qrData = JSON.stringify({
      projectId,
      shiftStart,
      shiftEnd,
      projectName: project?.name || project?.title || "Proje"
    })
    
    // Encode to Base64 to handle Turkish characters properly
    const base64Data = btoa(unescape(encodeURIComponent(qrData)))
    
    if (typeof window !== 'undefined') {
      return `${window.location.origin}/check-in/${projectId}?data=${encodeURIComponent(base64Data)}`
    }
    return `/check-in/${projectId}?data=${encodeURIComponent(base64Data)}`
  }

  if (isLoading) {
    return (
      <div className="lg:mt-0 mt-16">
        <div className="text-white">Yükleniyor...</div>
      </div>
    )
  }

  return (
    <div className="lg:mt-0 mt-16 p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <h1 className="text-2xl lg:text-3xl font-bold text-white">
          Puantaj & Personel
        </h1>
      </div>

      {/* QR Code Generator & GPS Settings Section */}
      <div className="bg-slate-900 rounded-xl p-6 border border-slate-800 mb-6">
        <h2 className="text-xl font-semibold text-white mb-4">� Şantiye Giriş ve Güvenlik Ayarları</h2>
        <div className="flex gap-4 mb-6">
          <select
            value={selectedProjectForQR}
            onChange={(e) => handleProjectChange(e.target.value)}
            className="flex-1 px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
          >
            <option value="">Proje Seçin</option>
            {(projects || []).map((project) => (
              <option key={project.id} value={project.id}>
                {project.name || project.title}
              </option>
            ))}
          </select>
          <button
            onClick={handleGenerateQR}
            disabled={!selectedProjectForQR}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            QR Kod Üret
          </button>
        </div>

        {selectedProjectForQR && (
          <div className="border-t border-slate-700 pt-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-white">Girişlerde GPS Doğrulaması Zorunlu Kıl</h3>
              <button
                onClick={() => setGpsSettings(prev => ({ ...prev, gpsRequired: !prev.gpsRequired }))}
                className={`relative w-14 h-7 rounded-full transition-colors ${gpsSettings.gpsRequired ? 'bg-blue-600' : 'bg-slate-700'}`}
              >
                <div className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-transform ${gpsSettings.gpsRequired ? 'translate-x-7' : 'translate-x-1'}`} />
              </button>
            </div>

            {gpsSettings.gpsRequired && (
              <div className="grid md:grid-cols-3 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Enlem (Latitude)</label>
                  <input
                    type="number"
                    step="any"
                    value={gpsSettings.latitude}
                    onChange={(e) => setGpsSettings(prev => ({ ...prev, latitude: e.target.value }))}
                    className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                    placeholder="Örn: 41.0082"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Boylam (Longitude)</label>
                  <input
                    type="number"
                    step="any"
                    value={gpsSettings.longitude}
                    onChange={(e) => setGpsSettings(prev => ({ ...prev, longitude: e.target.value }))}
                    className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                    placeholder="Örn: 28.9784"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Yarıçap (metre)</label>
                  <input
                    type="number"
                    value={gpsSettings.gpsRadius}
                    onChange={(e) => setGpsSettings(prev => ({ ...prev, gpsRadius: e.target.value }))}
                    className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                    placeholder="Örn: 100"
                  />
                </div>
              </div>
            )}

            <button
              onClick={handleSaveGpsSettings}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-500 transition-colors"
            >
              Ayarları Kaydet
            </button>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <button
          onClick={() => setIsManualAttendanceOpen(true)}
          className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors font-medium whitespace-nowrap"
        >
          📝 Manuel Yoklama Girişi
        </button>
        <button
          onClick={() => setIsNfcModalOpen(true)}
          className="w-full px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-500 transition-colors font-medium whitespace-nowrap"
        >
          📡 NFC ile Hızlı Yoklama
        </button>
        <div className="flex flex-col md:flex-row gap-2">
          <button
            onClick={exportAttendanceToExcel}
            className="flex-1 px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-500 transition-colors font-medium whitespace-nowrap"
          >
            📊 Yoklamaları İndir
          </button>
          <button
            onClick={exportVisitorsToExcel}
            className="flex-1 px-4 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-500 transition-colors font-medium whitespace-nowrap"
          >
            📊 Ziyaretçileri İndir
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-slate-900 rounded-xl p-4 border border-slate-800 mb-6">
        <h3 className="text-lg font-semibold text-white mb-4">Filtreler</h3>
        <div className="grid md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Başlangıç Tarihi</label>
            <input
              type="date"
              value={dateFilter.startDate}
              onChange={(e) => setDateFilter(prev => ({ ...prev, startDate: e.target.value }))}
              className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Bitiş Tarihi</label>
            <input
              type="date"
              value={dateFilter.endDate}
              onChange={(e) => setDateFilter(prev => ({ ...prev, endDate: e.target.value }))}
              className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Proje</label>
            <select
              value={selectedProjectFilter}
              onChange={(e) => setSelectedProjectFilter(e.target.value)}
              className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
            >
              <option value="">Tüm Projeler</option>
              {(Array.isArray(projects) ? projects : []).map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name || project.title}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={() => {
                setDateFilter({ startDate: "", endDate: "" })
                setSelectedProjectFilter("")
              }}
              className="w-full px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors"
            >
              Filtreleri Temizle
            </button>
          </div>
        </div>
      </div>

      {/* Attendance Records Table */}
      <div className="bg-slate-900 rounded-xl p-6 border border-slate-800 mb-6">
        <h2 className="text-xl font-semibold text-white mb-4">📋 Personel Yoklamaları</h2>
        <div className="w-full overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
          <table className="w-full min-w-max">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="text-left py-3 px-4 text-slate-300 font-medium">Personel</th>
                <th className="text-left py-3 px-4 text-slate-300 font-medium">Tarih</th>
                <th className="text-left py-3 px-4 text-slate-300 font-medium">Giriş</th>
                <th className="text-left py-3 px-4 text-slate-300 font-medium">Çıkış</th>
              </tr>
            </thead>
            <tbody>
              {attendanceRecords.filter(record => {
                const recordDate = new Date(record.date)
                const startDate = dateFilter.startDate ? new Date(dateFilter.startDate) : null
                const endDate = dateFilter.endDate ? new Date(dateFilter.endDate) : null

                if (startDate && recordDate < startDate) return false
                if (endDate && recordDate > endDate) return false
                if (selectedProjectFilter && record.projectId !== selectedProjectFilter) return false

                return true
              }).length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center py-8 text-slate-400">
                    Henüz yoklama kaydı yok
                  </td>
                </tr>
              ) : (
                attendanceRecords.filter(record => {
                  const recordDate = new Date(record.date)
                  const startDate = dateFilter.startDate ? new Date(dateFilter.startDate) : null
                  const endDate = dateFilter.endDate ? new Date(dateFilter.endDate) : null

                  if (startDate && recordDate < startDate) return false
                  if (endDate && recordDate > endDate) return false
                  if (selectedProjectFilter && record.projectId !== selectedProjectFilter) return false

                  return true
                }).slice(0, 10).map((record) => (
                  <tr key={record.id} className="border-b border-slate-800">
                    <td className="py-3 px-4 text-white">
                      {record.personel?.name}
                    </td>
                    <td className="py-3 px-4 text-slate-300">
                      {new Date(record.date).toLocaleDateString("tr-TR")}
                    </td>
                    <td className="py-3 px-4 text-green-400">
                      {record.checkIn ? new Date(record.checkIn).toLocaleTimeString("tr-TR") : "-"}
                    </td>
                    <td className="py-3 px-4 text-red-400">
                      {record.checkOut ? new Date(record.checkOut).toLocaleTimeString("tr-TR") : "-"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Visitor Records Table */}
      <div className="bg-slate-900 rounded-xl p-6 border border-slate-800">
        <h2 className="text-xl font-semibold text-white mb-4">👤 Ziyaretçi Kayıtları</h2>
        <div className="w-full overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
          <table className="w-full min-w-max">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="text-left py-3 px-4 text-slate-300 font-medium">Ad Soyad</th>
                <th className="text-left py-3 px-4 text-slate-300 font-medium">Firma</th>
                <th className="text-left py-3 px-4 text-slate-300 font-medium">Sebep</th>
                <th className="text-left py-3 px-4 text-slate-300 font-medium">Giriş</th>
                <th className="text-left py-3 px-4 text-slate-300 font-medium">Çıkış</th>
              </tr>
            </thead>
            <tbody>
              {visitorRecords.filter(record => {
                const recordDate = new Date(record.checkIn)
                const startDate = dateFilter.startDate ? new Date(dateFilter.startDate) : null
                const endDate = dateFilter.endDate ? new Date(dateFilter.endDate) : null
                
                if (startDate && recordDate < startDate) return false
                if (endDate && recordDate > endDate) return false
                if (selectedProjectFilter && record.projectId !== selectedProjectFilter) return false
                
                return true
              }).length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-slate-400">
                    Henüz ziyaretçi kaydı yok
                  </td>
                </tr>
              ) : (
                visitorRecords.filter(record => {
                  const recordDate = new Date(record.checkIn)
                  const startDate = dateFilter.startDate ? new Date(dateFilter.startDate) : null
                  const endDate = dateFilter.endDate ? new Date(dateFilter.endDate) : null
                  
                  if (startDate && recordDate < startDate) return false
                  if (endDate && recordDate > endDate) return false
                  if (selectedProjectFilter && record.projectId !== selectedProjectFilter) return false
                  
                  return true
                }).slice(0, 10).map((record) => (
                  <tr key={record.id} className="border-b border-slate-800">
                    <td className="py-3 px-4 text-white">{record.fullName}</td>
                    <td className="py-3 px-4 text-slate-300">{record.company || "-"}</td>
                    <td className="py-3 px-4 text-slate-300">{record.reason || "-"}</td>
                    <td className="py-3 px-4 text-green-400">
                      {new Date(record.checkIn).toLocaleString("tr-TR")}
                    </td>
                    <td className="py-3 px-4 text-red-400">
                      {record.checkOut ? (
                        new Date(record.checkOut).toLocaleString("tr-TR")
                      ) : (
                        <button
                          onClick={() => handleVisitorCheckout(record.id)}
                          className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-500 text-sm"
                        >
                          Çıkış Yap
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Manual Attendance Modal */}
      {isManualAttendanceOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-slate-900 rounded-xl p-6 border border-slate-800 w-full max-w-lg mx-4 shadow-2xl">
            <h3 className="text-xl font-semibold text-white mb-6">Manuel Yoklama Girişi</h3>
            
            <form onSubmit={handleManualAttendanceSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Personel Ara/Seç *</label>
                <div className="relative">
                  <input
                    type="text"
                    value={personelSearchTerm}
                    onChange={(e) => {
                      setPersonelSearchTerm(e.target.value)
                      setIsPersonelDropdownOpen(true)
                    }}
                    onFocus={() => setIsPersonelDropdownOpen(true)}
                    onBlur={() => setTimeout(() => setIsPersonelDropdownOpen(false), 200)}
                    className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                    placeholder="İsim veya departman ara..."
                    required
                  />
                  {isPersonelDropdownOpen && (
                    <div className="absolute z-10 w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg max-h-60 overflow-y-auto shadow-xl">
                      {personnel
                        .filter(p => {
                          if (personelSearchTerm === "") return true
                          const searchTerm = normalizeTurkishChars(personelSearchTerm)
                          const name = normalizeTurkishChars(p.name)
                          const department = normalizeTurkishChars(p.department)
                          const takim = normalizeTurkishChars(p.takim || "")
                          return name.includes(searchTerm) ||
                                 department.includes(searchTerm) ||
                                 takim.includes(searchTerm)
                        })
                        .map((person) => (
                        <div
                          key={person.id}
                          onClick={() => {
                            setManualAttendanceForm(prev => ({ ...prev, personelId: person.id }))
                            setPersonelSearchTerm(`${person.name} - ${person.department}`)
                            setIsPersonelDropdownOpen(false)
                          }}
                          className="px-4 py-2 hover:bg-slate-700 cursor-pointer text-white text-sm"
                        >
                          {person.name} - {person.department}
                        </div>
                      ))}
                      {personnel.filter(p => {
                        if (personelSearchTerm === "") return true
                        const searchTerm = normalizeTurkishChars(personelSearchTerm)
                        const name = normalizeTurkishChars(p.name)
                        const department = normalizeTurkishChars(p.department)
                        const takim = normalizeTurkishChars(p.takim || "")
                        return name.includes(searchTerm) ||
                               department.includes(searchTerm) ||
                               takim.includes(searchTerm)
                      }).length === 0 && (
                        <div className="px-4 py-2 text-slate-500 text-sm">
                          Sonuç bulunamadı
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Proje *</label>
                <select
                  value={manualAttendanceForm.projectId}
                  onChange={(e) => setManualAttendanceForm(prev => ({ ...prev, projectId: e.target.value }))}
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                  required
                >
                  <option value="">Proje Seçin</option>
                  {(Array.isArray(projects) ? projects : []).map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.name || project.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Gün Çarpanı</label>
                <select
                  value={manualAttendanceForm.dayMultiplier}
                  onChange={(e) => setManualAttendanceForm(prev => ({ ...prev, dayMultiplier: parseFloat(e.target.value) }))}
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                >
                  <option value={1}>Tam Gün (1.0)</option>
                  <option value={0.5}>Yarım Gün (0.5)</option>
                  <option value={0}>Çalışma Yok (0.0)</option>
                  <option value={1.5}>1.5 Gün</option>
                  <option value={2}>2 Gün</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Mesai Saati (Opsiyonel)</label>
                <input
                  type="number"
                  value={manualAttendanceForm.overtimeHours}
                  onChange={(e) => setManualAttendanceForm(prev => ({ ...prev, overtimeHours: parseFloat(e.target.value) || 0 }))}
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                  placeholder="0"
                  min="0"
                  step="0.5"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Giriş Saati</label>
                  <input
                    type="time"
                    value={manualAttendanceForm.checkInTime}
                    onChange={(e) => setManualAttendanceForm(prev => ({ ...prev, checkInTime: e.target.value }))}
                    className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Çıkış Saati</label>
                  <input
                    type="time"
                    value={manualAttendanceForm.checkOutTime}
                    onChange={(e) => setManualAttendanceForm(prev => ({ ...prev, checkOutTime: e.target.value }))}
                    className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsManualAttendanceOpen(false)}
                  className="flex-1 px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors"
                >
                  Kaydet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QR Modal */}
      {showQRModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-slate-900 rounded-xl p-6 border border-slate-800 w-full max-w-md mx-4 shadow-2xl">
            <h3 className="text-xl font-semibold text-white mb-6 text-center">Şantiye QR'ı</h3>
            
            <div className="flex justify-center mb-6">
              <QRCodeSVG
                value={getCheckInURL(selectedProjectForQR)}
                size={256}
                level="H"
                includeMargin={true}
              />
            </div>

            <button
              onClick={() => {
                navigator.clipboard.writeText(getCheckInURL(selectedProjectForQR))
                toast.success("Bağlantı kopyalandı!")
              }}
              className="w-full px-4 py-3 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition-colors font-medium mb-4 flex items-center justify-center gap-2"
            >
              🔗 Bağlantıyı Kopyala
            </button>

            <div className="flex gap-3">
              <button
                onClick={() => setShowQRModal(false)}
                className="flex-1 px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors"
              >
                Kapat
              </button>
              <button
                onClick={() => window.print()}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors"
              >
                Yazdır
              </button>
            </div>
          </div>
        </div>
      )}

      {/* NFC Terminal Modal */}
      {isNfcModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-slate-900 rounded-xl p-6 border border-slate-800 w-full max-w-md mx-4 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold text-white">📡 NFC Terminal</h3>
              <button
                onClick={() => setIsNfcModalOpen(false)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={handleNfcSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Proje *</label>
                <select
                  value={selectedProjectForNfc}
                  onChange={(e) => setSelectedProjectForNfc(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                  required
                >
                  <option value="">Proje Seçin</option>
                  {(Array.isArray(projects) ? projects : []).map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.name || project.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">NFC Kart Okutun</label>
                <input
                  ref={nfcInputRef}
                  type="text"
                  value={nfcInput}
                  onChange={(e) => setNfcInput(e.target.value)}
                  onKeyDown={handleNfcKeyDown}
                  autoFocus
                  placeholder="Kartı okutun..."
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-white"
                />
                <p className="text-xs text-slate-500 mt-2">
                  USB NFC okuyucuyu bağlayın ve kartı okutun. Otomatik olarak işlenecektir.
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={startWebNfcScan}
                  disabled={isWebNfcScanning}
                  className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-500 disabled:bg-purple-700 disabled:cursor-not-allowed transition-colors font-medium"
                >
                  {isWebNfcScanning ? "Okunuyor..." : "📱 Mobilden Okut"}
                </button>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsNfcModalOpen(false)}
                  className="flex-1 px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors"
                >
                  Kapat
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-500 transition-colors"
                >
                  İşle
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}