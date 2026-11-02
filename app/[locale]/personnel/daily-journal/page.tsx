"use client"
/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Field Engineer Daily Construction Log (Günlük Şantiye Jurnali)
 * Clean, mobile-friendly card-based data entry form for field engineers
 * Features:
 * 1) Open-Meteo coordinate-based real-time weather integration
 * 2) Mobile rear camera capture ("capture=environment") with thumbnail previews
 * 3) "Dünkü Jurnali Kopyala" (Copy Yesterday's Log) automation
 */

import React, { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
  Calendar,
  CloudSun,
  Users,
  Truck,
  FileText,
  ShieldAlert,
  Send,
  Loader2,
  ArrowLeft,
  CheckCircle2,
  Plus,
  Minus,
  PlusCircle,
  Building2,
  Sun,
  CloudRain,
  Snowflake,
  Wind,
  Check,
  RefreshCw,
  HardHat,
  Camera,
  X,
  Copy,
  Cloud,
  ImageIcon,
  UploadCloud,
  Compass,
  AlertTriangle,
  Layers,
  Trash2
} from "lucide-react"
import { createDailyLog, getJournalInitialData, getProjectBoqItems } from "./actions"
import { getLatestLog, getTodayPersonnelCount } from "@/app/actions/dailyLog"
import { toast } from "react-hot-toast"

export interface BoqItemOption {
  id: string
  pozNo: string
  description: string
  unit: string
  plannedQuantity?: number
  completedQuantity?: number
}

export interface SelectedBoqEntry {
  id: string
  boqId: string
  pozNo: string
  description: string
  unit: string
  quantity: number
}

interface HeavyEquipment {
  name: string
  count: number
}

interface PhotoPreview {
  id: string
  file: File
  url: string
  name: string
  sizeText: string
}

interface ProjectItem {
  id: string
  name?: string | null
  title?: string | null
  city?: string | null
  locationCity?: string | null
  latitude?: number | null
  longitude?: number | null
}

const DEFAULT_EQUIPMENT: HeavyEquipment[] = [
  { name: "Ekskavatör", count: 0 },
  { name: "Kule Vinç", count: 0 },
  { name: "Mobil Vinç", count: 0 },
  { name: "Beko Loder (Kepçe)", count: 0 },
  { name: "Silindir / Kompaktör", count: 0 },
  { name: "Beton Pompası & Mikser", count: 0 }
]

const WEATHER_OPTIONS = [
  { value: "Açık", label: "Açık / Güneşli", icon: Sun },
  { value: "Parçalı Bulutlu", label: "Parçalı Bulutlu", icon: CloudSun },
  { value: "Yağmurlu", label: "Yağmurlu", icon: CloudRain },
  { value: "Karlı", label: "Karlı", icon: Snowflake },
  { value: "Rüzgarlı / Fırtınalı", label: "Rüzgarlı / Fırtınalı", icon: Wind },
  { value: "Sisli", label: "Sisli", icon: Cloud }
]

const QUICK_NOTES = [
  "Rutin imalat, kayda değer aksaklık yok.",
  "Hava muhalefeti sebebiyle duruş yaşandı.",
  "Malzeme sevkiyatında gecikme oldu.",
  "Ramak kala güvenlik olayı raporlandı.",
  "Gece vardiyası / ek mesai yapıldı."
]

export default function DailyLogEntryPage() {
  const router = useRouter()

  // Form states
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [submittedSuccess, setSubmittedSuccess] = useState(false)
  const [copyingYesterday, setCopyingYesterday] = useState(false)
  const [fetchingWeather, setFetchingWeather] = useState(false)

  // Project selection
  const [projects, setProjects] = useState<ProjectItem[]>([])
  const [selectedProjectId, setSelectedProjectId] = useState<string>("")

  // Card 1: Tarih & Hava Durumu
  const [logDate, setLogDate] = useState(() => new Date().toISOString().split("T")[0])
  const [weatherCondition, setWeatherCondition] = useState("Açık")
  const [temperature, setTemperature] = useState<string>("24")
  const [windSpeed, setWindSpeed] = useState<number | null>(null)

  // Card 2: Personel & Mevcut (Canlı Puantaj / Turnike QR Entegrasyonu)
  const [staffCount, setStaffCount] = useState<string>("12")
  const [subcontractorCount, setSubcontractorCount] = useState<string>("48")
  const [syncingPersonnel, setSyncingPersonnel] = useState(false)
  const [isPersonnelSyncedFromHr, setIsPersonnelSyncedFromHr] = useState(false)

  // Card 3: Kullanılan Ekipmanlar
  const [equipmentList, setEquipmentList] = useState<HeavyEquipment[]>(DEFAULT_EQUIPMENT)
  const [customMachineName, setCustomMachineName] = useState("")

  // Card 4: Yapılan İmalatlar & BoQ Keşif Entegrasyonu (ADIM 4)
  const [completedWorks, setCompletedWorks] = useState(
    "A Blok 3. Kat Kolon betonu döküldü (120 m³).\nB Blok temel su izolasyonu membran serme işlemi tamamlandı.\nC Blok 1. kat elektrik tava montajı ve borulama sürdürüldü."
  )
  const [boqList, setBoqList] = useState<BoqItemOption[]>([])
  const [selectedBoqEntries, setSelectedBoqEntries] = useState<SelectedBoqEntry[]>([])
  const [showAddBoqRow, setShowAddBoqRow] = useState(false)
  const [selectedBoqId, setSelectedBoqId] = useState("")
  const [selectedBoqQty, setSelectedBoqQty] = useState("")
  const [loadingBoqs, setLoadingBoqs] = useState(false)

  // Card 5: Saha Fotoğrafları (Mobil Kamera capture=environment)
  const [photos, setPhotos] = useState<PhotoPreview[]>([])

  // Card 6: İSG, Gecikme ve Ekstra Notlar
  const [safetyAndDelayNotes, setSafetyAndDelayNotes] = useState(
    "Hafif rüzgar sebebiyle kule vinç saat 12:00-13:30 arasında güvenlik amaçlı durduruldu. Herhangi bir ramak kala veya kaza yaşanmadı."
  )

  // Load project list & initial BoQ items
  const loadInitialData = async () => {
    setLoading(true)
    try {
      const data = await getJournalInitialData()
      if (data.success && data.projects.length > 0) {
        setProjects(data.projects)
        const targetPid = selectedProjectId || data.selectedProjectId || data.projects[0].id
        if (!selectedProjectId) {
          setSelectedProjectId(targetPid)
        }
        if (data.boqItems && data.boqItems.length > 0) {
          setBoqList(data.boqItems)
        } else if (targetPid) {
          void fetchProjectBoqs(targetPid)
        }
      }
    } catch (err) {
      console.error("Initial data load error:", err)
    } finally {
      setLoading(false)
    }
  }

  const fetchProjectBoqs = async (pId: string) => {
    setLoadingBoqs(true)
    try {
      const res = await getProjectBoqItems(pId)
      if (res.success && res.items) {
        setBoqList(res.items)
      }
    } catch (e) {
      console.error("fetchProjectBoqs error:", e)
    } finally {
      setLoadingBoqs(false)
    }
  }

  useEffect(() => {
    void loadInitialData()
  }, [])

  // Şantiye projesi seçildiğinde veya değiştiğinde canlı puantaj ve BoQ kalemlerini güncelle
  useEffect(() => {
    if (selectedProjectId) {
      void handleSyncPersonnelCount(true)
      void fetchProjectBoqs(selectedProjectId)
    }
  }, [selectedProjectId])

  // Cleanup photo preview object URLs
  useEffect(() => {
    return () => {
      photos.forEach((p) => {
        if (p.url.startsWith("blob:")) URL.revokeObjectURL(p.url)
      })
    }
  }, [photos])

  // =========================================================================
  // ADIM 2: Otomatik Puantaj & Canlı Personel Mevcudu Senkronizasyonu (Turnike / QR)
  // =========================================================================
  const handleSyncPersonnelCount = async (isSilent = false) => {
    if (!selectedProjectId) {
      if (!isSilent) toast.error("Lütfen önce bir şantiye projesi seçiniz.")
      return
    }

    setSyncingPersonnel(true)
    try {
      const res = await getTodayPersonnelCount(selectedProjectId)
      if (res.success) {
        if (res.hasRecords) {
          setStaffCount(String(res.staffCount))
          setSubcontractorCount(String(res.subcontractorCount))
          setIsPersonnelSyncedFromHr(true)
          if (!isSilent) {
            toast.success(
              `Canlı Puantaj: ${res.total} aktif personel çekildi (${res.staffCount} Kendi, ${res.subcontractorCount} Taşeron).`,
              { icon: "👥", duration: 4000 }
            )
          }
        } else {
          setIsPersonnelSyncedFromHr(false)
          if (!isSilent) {
            toast(
              "Bugün için henüz puantaj/giriş kaydı bulunamadı, manuel girebilirsiniz.",
              { icon: "⚠️", duration: 5000 }
            )
          }
        }
      } else {
        if (!isSilent) {
          toast.error(res.error || "Puantaj verileri sorgulanırken hata oluştu.")
        }
      }
    } catch (err: any) {
      console.error("Sync personnel count error:", err)
      if (!isSilent) {
        toast.error("Puantaj verileri alınırken bir hata oluştu.")
      }
    } finally {
      setSyncingPersonnel(false)
    }
  }

  // =========================================================================
  // ADIM 1: "Dünkü Jurnali Kopyala" Otomasyonu
  // =========================================================================
  const handleCopyYesterday = async () => {
    if (!selectedProjectId) {
      toast.error("Lütfen önce bir şantiye projesi seçiniz.")
      return
    }

    setCopyingYesterday(true)
    try {
      const res = await getLatestLog(selectedProjectId)
      if (res.success && res.data) {
        const d = res.data

        if (d.staffCount) setStaffCount(d.staffCount)
        if (d.subcontractorCount) setSubcontractorCount(d.subcontractorCount)
        if (d.temperature) setTemperature(d.temperature)
        if (d.weatherCondition) setWeatherCondition(d.weatherCondition)
        if (d.safetyAndDelayNotes) setSafetyAndDelayNotes(d.safetyAndDelayNotes)
        setIsPersonnelSyncedFromHr(false)

        // Parse equipment counts (e.g. "Ekskavatör: 2, Vinç: 1")
        if (d.equipment) {
          const parts = d.equipment.split(",")
          const newEqList = DEFAULT_EQUIPMENT.map((eq) => ({ ...eq, count: 0 }))

          for (const item of parts) {
            const [rawName, rawCount] = item.split(":")
            if (rawName && rawCount) {
              const nameTrim = rawName.trim()
              const countNum = parseInt(rawCount.trim(), 10) || 0
              const existingIdx = newEqList.findIndex(
                (e) => e.name.toLowerCase() === nameTrim.toLowerCase()
              )
              if (existingIdx !== -1) {
                newEqList[existingIdx].count = countNum
              } else if (countNum > 0) {
                newEqList.push({ name: nameTrim, count: countNum })
              }
            }
          }
          setEquipmentList(newEqList)
        }

        // Sadece 'Yapılan İşler' kısmını boş veya editlenmeye hazır bırakıyoruz
        setCompletedWorks("")

        toast.success(
          "Dünkü veriler başarıyla aktarıldı! (Personel mevcudu, ekipmanlar ve meteoroloji kopyalandı, yapılan işler alanı temizlendi)",
          { icon: "📋", duration: 4000 }
        )
      } else {
        toast.error(res.error || "Bu şantiye için daha önce kaydedilmiş bir jurnal bulunamadı.")
      }
    } catch (err: any) {
      console.error("Copy yesterday error:", err)
      toast.error("Dünkü veriler alınırken bir sorun oluştu.")
    } finally {
      setCopyingYesterday(false)
    }
  }

  // =========================================================================
  // ADIM 2: Otomatik Hava Durumu API Entegrasyonu (Open-Meteo)
  // =========================================================================
  const handleFetchWeather = async () => {
    setFetchingWeather(true)
    try {
      const activeProject = projects.find((p) => p.id === selectedProjectId)
      let lat = activeProject?.latitude
      let lng = activeProject?.longitude

      // Koordinat yoksa Geolocation veya varsayılan merkez şantiye koordinatları
      if (!lat || !lng) {
        if (typeof window !== "undefined" && navigator?.geolocation) {
          try {
            const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
              navigator.geolocation.getCurrentPosition(resolve, reject, {
                timeout: 6000,
                enableHighAccuracy: true
              })
            })
            lat = pos.coords.latitude
            lng = pos.coords.longitude
          } catch {
            // İstanbul Merkez fallback
            lat = 41.0082
            lng = 28.9784
          }
        } else {
          lat = 41.0082
          lng = 28.9784
        }
      }

      // Open-Meteo ücretsiz & api key gerektirmeyen istek
      const res = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current_weather=true`
      )

      if (!res.ok) {
        throw new Error("Open-Meteo hava durumu servisine bağlanılamadı.")
      }

      const weatherData = await res.json()
      const current = weatherData?.current_weather

      if (!current) {
        throw new Error("Hava durumu verisi okunamadı.")
      }

      const tempVal = Math.round(current.temperature).toString()
      const windVal = Math.round(current.windspeed)
      const code = current.weathercode

      setTemperature(tempVal)
      setWindSpeed(windVal)

      // WMO Weather code mapping
      let condition = "Açık"
      if (code === 0) condition = "Açık"
      else if ([1, 2, 3].includes(code)) condition = "Parçalı Bulutlu"
      else if ([71, 73, 75, 77, 85, 86].includes(code)) condition = "Karlı"
      else if ([95, 96, 99].includes(code) || windVal >= 45) condition = "Rüzgarlı / Fırtınalı"
      else if ([51, 53, 55, 61, 63, 65, 80, 81, 82].includes(code)) condition = "Yağmurlu"
      else if ([45, 48].includes(code)) condition = "Sisli"

      setWeatherCondition(condition)

      if (windVal >= 50) {
        toast(
          `Hava Durumu: ${tempVal}°C, ${condition} (⚠️ Rüzgar: ${windVal} km/s - Kule vinç limitinde!)`,
          { icon: "⚠️", duration: 5000 }
        )
      } else {
        toast.success(
          `Şantiye koordinatından çekildi: ${tempVal}°C, ${condition} (Rüzgar: ${windVal} km/s)`,
          { icon: "☁️" }
        )
      }
    } catch (err: any) {
      console.error("Open-Meteo fetch error:", err)
      toast.error(err?.message || "Hava durumu çekilemedi.")
    } finally {
      setFetchingWeather(false)
    }
  }

  // =========================================================================
  // ADIM 3: Mobil Fotoğraf Yükleme & Silme
  // =========================================================================
  const handlePhotoUploadChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return
    const incomingFiles = Array.from(e.target.files)

    const previews: PhotoPreview[] = incomingFiles.map((file) => ({
      id: `${file.name}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      file,
      url: URL.createObjectURL(file),
      name: file.name,
      sizeText: `${(file.size / (1024 * 1024)).toFixed(1)} MB`
    }))

    setPhotos((prev) => [...prev, ...previews])
    toast.success(`${incomingFiles.length} adet saha fotoğrafı eklendi.`, { icon: "📸" })
    e.target.value = ""
  }

  const handleRemovePhoto = (id: string) => {
    setPhotos((prev) => {
      const target = prev.find((p) => p.id === id)
      if (target?.url.startsWith("blob:")) {
        URL.revokeObjectURL(target.url)
      }
      return prev.filter((p) => p.id !== id)
    })
  }

  // Equipment counter handlers
  const handleUpdateCount = (index: number, delta: number) => {
    setEquipmentList((prev) =>
      prev.map((item, idx) => {
        if (idx !== index) return item
        const newCount = Math.max(0, item.count + delta)
        return { ...item, count: newCount }
      })
    )
  }

  const handleSetDirectCount = (index: number, val: number) => {
    const valid = isNaN(val) ? 0 : Math.max(0, val)
    setEquipmentList((prev) =>
      prev.map((item, idx) => (idx === index ? { ...item, count: valid } : item))
    )
  }

  const handleAddCustomMachine = (e: React.FormEvent) => {
    e.preventDefault()
    if (!customMachineName.trim()) return
    const trimmed = customMachineName.trim()
    const exists = equipmentList.find((e) => e.name.toLowerCase() === trimmed.toLowerCase())
    if (exists) {
      toast.error("Bu ekipman listede zaten mevcut.")
      return
    }
    setEquipmentList((prev) => [...prev, { name: trimmed, count: 1 }])
    setCustomMachineName("")
  }

  // Active heavy equipment and personnel calculation
  const totalActiveMachinery = equipmentList.reduce((acc, curr) => acc + curr.count, 0)
  const activePersonnelTotal =
    (parseInt(staffCount, 10) || 0) + (parseInt(subcontractorCount, 10) || 0)

  // Submit handler calling server action createDailyLog
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (!selectedProjectId) {
      toast.error("Lütfen şantiye projesini seçiniz.")
      return
    }

    if (!completedWorks.trim()) {
      toast.error("Lütfen yapılan imalatları (işleri) yazınız.")
      return
    }

    setSubmitting(true)
    try {
      const formData = new FormData()
      formData.set("projectId", selectedProjectId)
      formData.set("date", logDate)
      formData.set("weatherCondition", weatherCondition)
      formData.set("temperature", temperature)
      formData.set("staffCount", staffCount || "0")
      formData.set("subcontractorCount", subcontractorCount || "0")

      // Serialize equipment counts (e.g. "Ekskavatör: 2, Kule Vinç: 1")
      const equipmentSummary = equipmentList
        .filter((item) => item.count > 0)
        .map((item) => `${item.name}: ${item.count}`)
        .join(", ")
      formData.set("equipment", equipmentSummary)

      formData.set("completedWorks", completedWorks.trim())
      formData.set("safetyAndDelayNotes", safetyAndDelayNotes.trim())

      // ADIM 4: Jurnal ile BoQ Senkronizasyonu (boqUpdates payload)
      if (selectedBoqEntries.length > 0) {
        formData.set(
          "boqUpdates",
          JSON.stringify(
            selectedBoqEntries.map((e) => ({
              boqId: e.boqId,
              addedQuantity: e.quantity,
            }))
          )
        )
      }

      // Append photos to FormData for server-side upload
      photos.forEach((photo) => {
        formData.append("photos", photo.file)
      })

      const res = await createDailyLog(formData)

      if (res.success) {
        toast.success(res.message || "Şantiye jurnali başarıyla merkeze gönderildi!", {
          icon: "🏗️",
          duration: 4000
        })
        setSubmittedSuccess(true)
      } else {
        toast.error(res.error || "Jurnal kaydedilemedi.")
      }
    } catch (err: any) {
      console.error("Form submit error:", err)
      toast.error("İşlem sırasında beklenmedik bir hata oluştu.")
    } finally {
      setSubmitting(false)
    }
  }

  const resetForm = () => {
    setSubmittedSuccess(false)
    setCompletedWorks("")
    setSelectedBoqEntries([])
    setSafetyAndDelayNotes("")
    setEquipmentList(DEFAULT_EQUIPMENT)
    setPhotos([])
    setIsPersonnelSyncedFromHr(false)
  }

  // ADIM 4: Keşiften İmalat Ekleme Fonksiyonu
  const handleAddBoqItemToLog = () => {
    if (!selectedBoqId) {
      toast.error("Lütfen bir BoQ (Keşif) kalemi seçiniz.")
      return
    }

    const qty = parseFloat(selectedBoqQty)
    if (!qty || qty <= 0) {
      toast.error("Lütfen geçerli bir tamamlanan miktar giriniz (Örn: 150).")
      return
    }

    const found = boqList.find((b) => b.id === selectedBoqId)
    if (!found) {
      toast.error("Seçilen keşif kalemi bulunamadı.")
      return
    }

    const newEntry: SelectedBoqEntry = {
      id: Math.random().toString(),
      boqId: found.id,
      pozNo: found.pozNo,
      description: found.description,
      unit: found.unit,
      quantity: qty,
    }

    setSelectedBoqEntries((prev) => [...prev, newEntry])

    // Otomatik olarak metin alanına da ekle
    const autoLine = `• [${found.pozNo}] ${found.description}: ${qty} ${found.unit} imalatı tamamlandı.`
    setCompletedWorks((prev) => (prev.trim() ? `${prev.trim()}\n${autoLine}` : autoLine))

    toast.success(`"${found.description}" (${qty} ${found.unit}) jurnale ve hakedişe eklendi! 🏗️`, {
      icon: "✅",
    })

    setSelectedBoqId("")
    setSelectedBoqQty("")
    setShowAddBoqRow(false)
  }

  const handleRemoveBoqEntry = (id: string) => {
    setSelectedBoqEntries((prev) => prev.filter((e) => e.id !== id))
    toast("İmalat kalem güncellemesi çıkarıldı.", { icon: "🗑️" })
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-3 sm:p-5 lg:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-800">
          <div>
            <button
              type="button"
              onClick={() => router.push("/personnel")}
              className="inline-flex items-center gap-1.5 text-xs text-orange-400 hover:text-orange-300 font-medium mb-2 transition"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Personel Portalı
            </button>
            <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
              <span className="p-2 rounded-xl bg-orange-600/20 text-orange-400 border border-orange-500/30">
                <FileText className="w-5 h-5" />
              </span>
              Günlük Şantiye Jurnali
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Saha mühendisleri ve şefler için temiz, mobil uyumlu günlük şantiye veri giriş formu
            </p>
          </div>

          {/* Project Selector & Refresh */}
          <div className="flex items-center gap-2">
            <div className="flex flex-col">
              <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1">
                Şantiye Projesi
              </label>
              <select
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                className="bg-gray-900 border border-gray-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500 font-semibold"
              >
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name || p.title || "Şantiye Projesi"}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={loadInitialData}
              disabled={loading}
              title="Yenile"
              className="mt-4 p-2.5 rounded-xl bg-gray-900 border border-gray-800 text-slate-300 hover:text-white transition disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-orange-400" : ""}`} />
            </button>
          </div>
        </div>

        {submittedSuccess ? (
          /* Success Screen */
          <div className="bg-gray-900 rounded-xl p-8 border border-emerald-500/40 text-center space-y-4 shadow-2xl">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/30">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-white">
                Günün Şantiye Jurnali Başarıyla Kaydedildi!
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 max-w-md mx-auto mt-2 leading-relaxed">
                Tarih: <strong className="text-white font-mono">{logDate}</strong> • Toplam Personel:{" "}
                <strong className="text-emerald-400 font-mono">{activePersonnelTotal} Kişi</strong> • Aktif
                Ekipman: <strong className="text-orange-400 font-mono">{totalActiveMachinery} Adet</strong>
                {photos.length > 0 && (
                  <span>
                    {" "}
                    • Fotoğraf:{" "}
                    <strong className="text-cyan-400 font-mono">{photos.length} Adet</strong>
                  </span>
                )}
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Girilen veriler merkez ofis ve proje yönetimi raporlama paneline anlık olarak iletilmiştir.
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
              <button
                type="button"
                onClick={resetForm}
                className="px-5 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs sm:text-sm transition flex items-center gap-2"
              >
                <PlusCircle className="w-4 h-4" />
                Yeni Jurnal Formu Aç
              </button>
              <button
                type="button"
                onClick={() => router.push("/personnel")}
                className="px-5 py-2.5 rounded-xl bg-gray-800 hover:bg-gray-700 text-slate-200 font-medium text-xs sm:text-sm transition"
              >
                Personel Paneline Dön
              </button>
            </div>
          </div>
        ) : (
          /* Form Content */
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Top Toolbar: ADIM 1 "Dünkü Jurnali Kopyala" & ADIM 2 "Canlı Puantajdan Çek" */}
            <div className="bg-gray-900 rounded-xl p-4 border border-gray-800 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-xs text-slate-300">
                <Compass className="w-4 h-4 text-orange-400" />
                <span>
                  Hızlı Veri Girişi: Puantaj/Turnike mevcudunu canlı çekebilir veya dünkü jurnali kopyalayabilirsiniz.
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => handleSyncPersonnelCount(false)}
                  disabled={syncingPersonnel}
                  className="flex-1 sm:flex-none px-3.5 py-2 bg-gradient-to-r from-emerald-600/90 to-teal-600/90 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-1.5 transition disabled:opacity-50 shrink-0"
                  title="Kapı turnike / QR sisteminden bugünün giriş yapan aktif personel mevcudunu çek"
                >
                  {syncingPersonnel ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Users className="w-3.5 h-3.5" />
                  )}
                  <span>👥 Canlı Puantajdan Çek</span>
                </button>

                <button
                  type="button"
                  onClick={handleCopyYesterday}
                  disabled={copyingYesterday}
                  className="flex-1 sm:flex-none px-3.5 py-2 bg-gradient-to-r from-orange-600/90 to-amber-600/90 hover:from-orange-500 hover:to-amber-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-orange-600/20 flex items-center justify-center gap-1.5 transition disabled:opacity-50 shrink-0"
                >
                  {copyingYesterday ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                  <span>📋 Dünkü Verileri Getir</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* KART 1: Tarih & Hava Durumu Kartı (Open-Meteo Entegrasyonu) */}
              <div className="bg-gray-900 rounded-xl p-5 border border-gray-800 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-gray-800">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center justify-center">
                      <Calendar className="w-4 h-4" />
                    </div>
                    <div>
                      <h2 className="text-sm font-bold text-white">Tarih & Hava Durumu</h2>
                      <p className="text-[11px] text-slate-400">Şantiye tarihi ve meteorolojik koşul</p>
                    </div>
                  </div>

                  {/* ADIM 2: Otomatik Hava Durumu API Butonu */}
                  <button
                    type="button"
                    onClick={handleFetchWeather}
                    disabled={fetchingWeather}
                    className="px-2.5 py-1 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/40 text-blue-300 text-[11px] font-bold rounded-lg flex items-center gap-1.5 transition disabled:opacity-50"
                    title="Şantiye koordinatından canlı hava durumunu çek"
                  >
                    {fetchingWeather ? (
                      <Loader2 className="w-3 h-3 animate-spin text-blue-400" />
                    ) : (
                      <Cloud className="w-3 h-3 text-blue-400" />
                    )}
                    <span>Hava Durumunu Çek ☁️</span>
                  </button>
                </div>

                {/* Tarih Seçimi */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Jurnal Tarihi
                  </label>
                  <input
                    type="date"
                    value={logDate}
                    onChange={(e) => setLogDate(e.target.value)}
                    required
                    className="w-full bg-slate-950 border border-gray-800 rounded-xl px-3.5 py-2.5 text-xs text-white font-medium focus:outline-none focus:border-orange-500 transition"
                  />
                </div>

                {/* Hava Durumu ve Sıcaklık */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Hava Durumu
                    </label>
                    <select
                      value={weatherCondition}
                      onChange={(e) => setWeatherCondition(e.target.value)}
                      className="w-full bg-slate-950 border border-gray-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-orange-500 font-medium"
                    >
                      {WEATHER_OPTIONS.map((w) => (
                        <option key={w.value} value={w.value}>
                          {w.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Sıcaklık (°C)
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        value={temperature}
                        onChange={(e) => setTemperature(e.target.value)}
                        placeholder="Örn: 24"
                        className="w-full bg-slate-950 border border-gray-800 rounded-xl px-3 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-orange-500"
                      />
                      <span className="absolute right-3 top-2.5 text-xs text-slate-400 font-bold">
                        °C
                      </span>
                    </div>
                  </div>
                </div>

                {/* Windspeed Live Display if fetched */}
                {windSpeed !== null && (
                  <div
                    className={`p-2.5 rounded-xl border text-xs flex items-center justify-between ${
                      windSpeed >= 50
                        ? "bg-red-950/40 border-red-500/40 text-red-300"
                        : "bg-slate-950 border-gray-800 text-slate-300"
                    }`}
                  >
                    <span className="flex items-center gap-1.5 font-medium">
                      <Wind className="w-3.5 h-3.5 text-blue-400" />
                      Anlık Rüzgar Hızı (Open-Meteo):
                    </span>
                    <span className="font-bold font-mono">
                      {windSpeed} km/s {windSpeed >= 50 && "⚠️ (Fırtına Eşiği)"}
                    </span>
                  </div>
                )}
              </div>

              {/* KART 2: Personel & Mevcut Kartı (Canlı Turnike / QR Puantaj) */}
              <div className="bg-gray-900 rounded-xl p-5 border border-gray-800 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-gray-800">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center">
                      <Users className="w-4 h-4" />
                    </div>
                    <div>
                      <h2 className="text-sm font-bold text-white">Personel & Mevcut</h2>
                      <p className="text-[11px] text-slate-400">Sahadaki toplam iş gücü puantajı</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleSyncPersonnelCount(false)}
                      disabled={syncingPersonnel}
                      className="px-2.5 py-1 bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-emerald-300 text-[11px] font-bold rounded-lg flex items-center gap-1.5 transition disabled:opacity-50"
                      title="Bugünkü turnike / QR puantaj sisteminden anlık mevcudu çek"
                    >
                      {syncingPersonnel ? (
                        <Loader2 className="w-3 h-3 animate-spin text-emerald-400" />
                      ) : (
                        <Users className="w-3 h-3 text-emerald-400" />
                      )}
                      <span>👥 Canlı Puantajdan Çek</span>
                    </button>

                    <span className="text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 font-mono">
                      Toplam: {activePersonnelTotal} Kişi
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
                      <span>Kendi Personelimiz</span>
                      <span className="text-[10px] text-slate-400 font-normal">🔒 Kilitli (Salt Okunur)</span>
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        readOnly={true}
                        value={staffCount}
                        placeholder="Örn: 12"
                        className="w-full bg-gray-800/50 text-gray-400 border border-gray-700 cursor-not-allowed focus:ring-0 rounded-xl px-3 py-2.5 text-xs font-mono"
                      />
                      <span className="absolute right-3 top-2.5 text-[11px] text-slate-500 font-medium">
                        Kişi
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
                      <span>Taşeron Mevcudu</span>
                      <span className="text-[10px] text-slate-400 font-normal">🔒 Kilitli (Salt Okunur)</span>
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        readOnly={true}
                        value={subcontractorCount}
                        placeholder="Örn: 48"
                        className="w-full bg-gray-800/50 text-gray-400 border border-gray-700 cursor-not-allowed focus:ring-0 rounded-xl px-3 py-2.5 text-xs font-mono"
                      />
                      <span className="absolute right-3 top-2.5 text-[11px] text-slate-500 font-medium">
                        Kişi
                      </span>
                    </div>
                  </div>
                </div>

                {/* ADIM 3: UX Geri Bildirimi */}
                {isPersonnelSyncedFromHr ? (
                  <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-2.5 flex items-center gap-2 text-xs text-emerald-400 font-medium">
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                    <span>(Veriler kapı turnike/QR sisteminden anlık çekilmiştir ✅)</span>
                  </div>
                ) : (
                  <div className="bg-slate-950 border border-gray-800 rounded-xl p-2.5 flex items-center gap-2 text-xs text-slate-400">
                    <span className="text-amber-400">ℹ️</span>
                    <span>(Personel sayıları manuel girişe kapalıdır. Güncel mevcudu almak için yukarıdaki &quot;👥 Canlı Puantajdan Çek&quot; butonuna basınız.)</span>
                  </div>
                )}

                <div className="bg-slate-950/70 border border-gray-800/80 rounded-xl p-3 flex items-center justify-between text-xs">
                  <span className="text-slate-400 flex items-center gap-1.5">
                    <HardHat className="w-3.5 h-3.5 text-orange-400" />
                    Sahada Aktif Çalışan:
                  </span>
                  <span className="font-bold text-white font-mono">
                    {staffCount || 0} Kadrolu + {subcontractorCount || 0} Taşeron
                  </span>
                </div>
              </div>
            </div>

            {/* KART 3: Kullanılan Ekipmanlar Kartı */}
            <div className="bg-gray-900 rounded-xl p-5 border border-gray-800 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-gray-800">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center">
                    <Truck className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-white">Kullanılan Ekipmanlar</h2>
                    <p className="text-[11px] text-slate-400">
                      O gün sahada çalışan ağır iş makineleri ve adetleri
                    </p>
                  </div>
                </div>
                <div className="text-xs font-bold text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/20 font-mono">
                  Aktif Makine: {totalActiveMachinery} Adet
                </div>
              </div>

              {/* Ekipman Listesi Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {equipmentList.map((eq, idx) => (
                  <div
                    key={eq.name}
                    className={`rounded-xl p-3 border transition flex items-center justify-between ${
                      eq.count > 0
                        ? "bg-slate-950 border-amber-500/40 text-white"
                        : "bg-slate-950/60 border-gray-800 text-slate-300"
                    }`}
                  >
                    <span className="text-xs font-semibold truncate pr-2">{eq.name}</span>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleUpdateCount(idx, -1)}
                        className="w-7 h-7 rounded-lg bg-gray-800 hover:bg-gray-700 text-slate-200 flex items-center justify-center transition"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <input
                        type="number"
                        min="0"
                        value={eq.count}
                        onChange={(e) => handleSetDirectCount(idx, parseInt(e.target.value, 10))}
                        className="w-10 text-center bg-gray-900 border border-gray-800 rounded-lg py-1 text-xs font-bold font-mono text-white focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => handleUpdateCount(idx, 1)}
                        className="w-7 h-7 rounded-lg bg-orange-600/80 hover:bg-orange-600 text-white flex items-center justify-center transition"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Özel Ekipman Ekleme */}
              <div className="pt-2 flex flex-col sm:flex-row items-center gap-2">
                <input
                  type="text"
                  placeholder="Başka bir iş makinesi ekle (Örn: Fore Kazık, Dozer, Manlift)..."
                  value={customMachineName}
                  onChange={(e) => setCustomMachineName(e.target.value)}
                  className="flex-1 w-full bg-slate-950 border border-gray-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-orange-500"
                />
                <button
                  type="button"
                  onClick={handleAddCustomMachine}
                  className="w-full sm:w-auto px-4 py-2 bg-gray-800 hover:bg-gray-700 text-orange-400 font-semibold text-xs rounded-xl border border-gray-700 flex items-center justify-center gap-1.5 transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Listeye Ekle
                </button>
              </div>
            </div>

            {/* KART 4: Yapılan İmalatlar (İşler) & BoQ Keşif Entegrasyonu (ADIM 4) */}
            <div className="bg-gray-900 rounded-xl p-5 border border-gray-800 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-gray-800">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 flex items-center justify-center">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-white">Yapılan İmalatlar (İşler)</h2>
                    <p className="text-[11px] text-slate-400">
                      Keşif kalemlerini seçip miktar girerek hakedişi otomatik güncelleyin
                    </p>
                  </div>
                </div>

                {/* ADIM 4: "+ İmalat Ekle" Butonu */}
                <button
                  type="button"
                  onClick={() => setShowAddBoqRow(!showAddBoqRow)}
                  className="px-3.5 py-1.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xs rounded-xl shadow-md shadow-cyan-600/20 flex items-center justify-center gap-1.5 transition shrink-0 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ İmalat Ekle (BoQ)</span>
                </button>
              </div>

              {/* ADIM 4: Açılır BoQ Seçim Menüsü ve Miktar Girişi Panel */}
              {showAddBoqRow && (
                <div className="bg-slate-950 p-4 rounded-xl border border-cyan-500/30 space-y-3 animate-in fade-in duration-150">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-cyan-400 flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5" />
                      Proje Keşif / BoQ Kaleminden İmalat Ekle:
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowAddBoqRow(false)}
                      className="text-slate-400 hover:text-white p-1"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                    {/* Keşif Kalemi Seçimi (<Select>) */}
                    <div className="sm:col-span-7">
                      <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                        Keşif Kalemi (BoQ)
                      </label>
                      <select
                        value={selectedBoqId}
                        onChange={(e) => setSelectedBoqId(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500 font-medium"
                      >
                        <option value="">-- İmalat Seçiniz (Örn: C30 Beton) --</option>
                        {boqList.map((item) => (
                          <option key={item.id} value={item.id}>
                            [{item.pozNo}] {item.description} ({item.unit})
                          </option>
                        ))}
                      </select>
                      {boqList.length === 0 && (
                        <p className="text-[10px] text-amber-400 mt-1">
                          ⚠️ Bu proje için kayıtlı BoQ pozu yüklenemedi veya henüz poz eklenmedi.
                        </p>
                      )}
                    </div>

                    {/* Miktar Girişi (Örn: 150 m3) */}
                    <div className="sm:col-span-3">
                      <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                        Miktar {selectedBoqId && boqList.find((b) => b.id === selectedBoqId)?.unit ? `(${boqList.find((b) => b.id === selectedBoqId)?.unit})` : ""}
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="any"
                        value={selectedBoqQty}
                        onChange={(e) => setSelectedBoqQty(e.target.value)}
                        placeholder="Örn: 150"
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-cyan-500"
                      />
                    </div>

                    {/* Ekle Butonu */}
                    <div className="sm:col-span-2 flex items-end">
                      <button
                        type="button"
                        onClick={handleAddBoqItemToLog}
                        className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Ekle</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Seçilen BoQ İmalatları Listesi (Hakediş Otomasyonu Önizlemesi) */}
              {selectedBoqEntries.length > 0 && (
                <div className="space-y-2">
                  <span className="text-[11px] font-semibold text-slate-400 block">
                    Bu Jurnal İle Otomatik Güncellenecek BoQ Kalemleri ({selectedBoqEntries.length}):
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {selectedBoqEntries.map((entry) => (
                      <div
                        key={entry.id}
                        className="p-2.5 rounded-xl bg-slate-950 border border-emerald-500/30 flex items-center justify-between text-xs"
                      >
                        <div className="min-w-0 pr-2">
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono text-cyan-400 font-bold">
                              [{entry.pozNo}]
                            </span>
                            <span className="text-white font-medium truncate">
                              {entry.description}
                            </span>
                          </div>
                          <div className="text-[11px] text-emerald-400 font-mono font-bold mt-0.5">
                            +{entry.quantity} {entry.unit} (Tamamlanan Miktara Eklenecek ⚡)
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveBoqEntry(entry.id)}
                          className="text-slate-500 hover:text-red-400 p-1 transition"
                          title="Listeden Çıkar"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Serbest Metin İmalat Alanı */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  İmalat Detay Açıklaması / Günlük Özet
                </label>
                <textarea
                  value={completedWorks}
                  onChange={(e) => setCompletedWorks(e.target.value)}
                  required
                  rows={4}
                  placeholder="Örn:&#10;• A Blok 3. Kat Kolon betonu döküldü (120 m³)&#10;• B Blok temel izolasyon membranı tamamlandı&#10;• 2. Kat iç duvar gazbeton örümü 150 m² yapıldı"
                  className="w-full bg-slate-950 border border-gray-800 rounded-xl p-3.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 leading-relaxed font-sans transition resize-y min-h-[100px]"
                />
              </div>
            </div>

            {/* ADIM 3: KART 5: Mobil Uyumlu Fotoğraf Ekleme Alanı (Capture: Environment) */}
            <div className="bg-gray-900 rounded-xl p-5 border border-gray-800 space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-gray-800">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20 flex items-center justify-center">
                    <Camera className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-white">
                      Saha Fotoğrafları (İmalat / DÖF)
                    </h2>
                    <p className="text-[11px] text-slate-400">
                      Mobilde doğrudan arka kamerayı açar, imalat ve kalite kanıtı ekleyin
                    </p>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20 font-mono">
                  {photos.length} Fotoğraf
                </span>
              </div>

              {/* Gizli Kamera Inputu (capture="environment") */}
              <input
                type="file"
                accept="image/*"
                multiple
                capture="environment"
                className="hidden"
                id="photo-upload"
                onChange={handlePhotoUploadChange}
              />

              {/* Özel Dropzone UI */}
              <label
                htmlFor="photo-upload"
                className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-800 hover:border-orange-500/50 rounded-xl bg-slate-950/70 hover:bg-slate-950 cursor-pointer transition group text-center"
              >
                <div className="w-12 h-12 rounded-2xl bg-orange-600/10 text-orange-400 group-hover:scale-110 flex items-center justify-center transition mb-2 border border-orange-500/20">
                  <Camera className="w-6 h-6" />
                </div>
                <span className="text-xs font-bold text-white group-hover:text-orange-400 transition">
                  Kamera ile Fotoğraf Çek veya Dosya Seç
                </span>
                <span className="text-[11px] text-slate-500 mt-1">
                  Mobilde arka kamera doğrudan açılır • Birden fazla fotoğraf seçilebilir
                </span>
              </label>

              {/* Önizleme Thumbnail Grid & Silme Butonları */}
              {photos.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 pt-2">
                  {photos.map((photo) => (
                    <div
                      key={photo.id}
                      className="relative group rounded-xl overflow-hidden border border-gray-800 bg-slate-950 aspect-video"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={photo.url}
                        alt={photo.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-90 p-2 flex flex-col justify-between">
                        <div className="flex justify-end">
                          <button
                            type="button"
                            onClick={() => handleRemovePhoto(photo.id)}
                            className="w-6 h-6 rounded-full bg-red-600/90 hover:bg-red-600 text-white flex items-center justify-center shadow-lg transition"
                            title="Fotoğrafı Kaldır"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <div className="text-[10px] text-slate-200 truncate font-mono">
                          {photo.name} ({photo.sizeText})
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* KART 6: İSG, Gecikme ve Ekstra Notlar Kartı */}
            <div className="bg-gray-900 rounded-xl p-5 border border-gray-800 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-gray-800">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center justify-center">
                    <ShieldAlert className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-white">İSG, Gecikme ve Ekstra Notlar</h2>
                    <p className="text-[11px] text-slate-400">
                      Aksaklıklar, ramak kala durumlar, duruşlar veya malzeme eksiklikleri
                    </p>
                  </div>
                </div>
                <span className="text-[10px] text-slate-400">İsteğe Bağlı</span>
              </div>

              {/* Hızlı Not Butonları */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {QUICK_NOTES.map((note) => (
                  <button
                    key={note}
                    type="button"
                    onClick={() => {
                      setSafetyAndDelayNotes((prev) =>
                        prev ? `${prev}\n• ${note}` : `• ${note}`
                      )
                    }}
                    className="text-[11px] bg-slate-950 hover:bg-slate-800 text-slate-300 hover:text-white px-2.5 py-1 rounded-lg border border-gray-800 transition"
                  >
                    + {note}
                  </button>
                ))}
              </div>

              <textarea
                value={safetyAndDelayNotes}
                onChange={(e) => setSafetyAndDelayNotes(e.target.value)}
                rows={4}
                placeholder="Sahada yaşanan bir aksaklık, ramak kala güvenlik durumu veya malzeme sevkiyat gecikmesi varsa yazınız..."
                className="w-full bg-slate-950 border border-gray-800 rounded-xl p-3.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 leading-relaxed font-sans transition resize-y min-h-[90px]"
              />
            </div>

            {/* Aksiyon Butonu - w-full, dikkat çekici & loading state */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-4 rounded-xl bg-gradient-to-r from-orange-600 via-amber-600 to-orange-600 hover:from-orange-500 hover:to-amber-500 text-white font-extrabold text-sm sm:text-base shadow-xl shadow-orange-600/25 flex items-center justify-center gap-3 transition disabled:opacity-50 group active:scale-[0.99]"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Jurnal Kaydediliyor ve Merkeze Gönderiliyor...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5 group-hover:translate-x-1 transition" />
                    <span>Jurnali Kaydet ve Merkeze Gönder</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
