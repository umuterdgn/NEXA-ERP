"use client"
/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Field Engineer Daily Construction Log (Günlük Şantiye Jurnali)
 * Clean, mobile-friendly card-based data entry form for field engineers
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
  Clock,
  Sparkles
} from "lucide-react"
import { createDailyLog, getJournalInitialData } from "./actions"
import { toast } from "react-hot-toast"

interface HeavyEquipment {
  name: string
  count: number
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
  { value: "Rüzgarlı / Fırtınalı", label: "Rüzgarlı / Fırtınalı", icon: Wind }
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

  // Project selection
  const [projects, setProjects] = useState<Array<{ id: string; name?: string | null; title?: string | null; city?: string | null }>>([])
  const [selectedProjectId, setSelectedProjectId] = useState<string>("")

  // Card 1: Tarih & Hava Durumu
  const [logDate, setLogDate] = useState(() => new Date().toISOString().split("T")[0])
  const [weatherCondition, setWeatherCondition] = useState("Açık")
  const [temperature, setTemperature] = useState<string>("24")

  // Card 2: Personel & Mevcut
  const [staffCount, setStaffCount] = useState<string>("12")
  const [subcontractorCount, setSubcontractorCount] = useState<string>("48")

  // Card 3: Kullanılan Ekipmanlar
  const [equipmentList, setEquipmentList] = useState<HeavyEquipment[]>(DEFAULT_EQUIPMENT)
  const [customMachineName, setCustomMachineName] = useState("")

  // Card 4: Yapılan İmalatlar
  const [completedWorks, setCompletedWorks] = useState(
    "A Blok 3. Kat Kolon betonu döküldü (120 m³).\nB Blok temel su izolasyonu membran serme işlemi tamamlandı.\nC Blok 1. kat elektrik tava montajı ve borulama sürdürüldü."
  )

  // Card 5: İSG, Gecikme ve Ekstra Notlar
  const [safetyAndDelayNotes, setSafetyAndDelayNotes] = useState(
    "Hafif rüzgar sebebiyle kule vinç saat 12:00-13:30 arasında güvenlik amaçlı durduruldu. Herhangi bir ramak kala veya kaza yaşanmadı."
  )

  // Load project list
  const loadInitialData = async () => {
    setLoading(true)
    try {
      const data = await getJournalInitialData()
      if (data.success && data.projects.length > 0) {
        setProjects(data.projects)
        if (!selectedProjectId) {
          setSelectedProjectId(data.selectedProjectId || data.projects[0].id)
        }
      }
    } catch (err) {
      console.error("Initial data load error:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadInitialData()
  }, [])

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

  // Active heavy equipment calculation
  const totalActiveMachinery = equipmentList.reduce((acc, curr) => acc + curr.count, 0)
  const activePersonnelTotal = (parseInt(staffCount, 10) || 0) + (parseInt(subcontractorCount, 10) || 0)

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
    setSafetyAndDelayNotes("")
    setEquipmentList(DEFAULT_EQUIPMENT)
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

          {/* Project Selector & Reload */}
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
          /* Form Content: Mobile flex-col, Desktop md:grid md:grid-cols-2 */
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* KART 1: Tarih & Hava Durumu Kartı */}
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
                  <span className="text-[10px] font-semibold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20 font-mono">
                    Kart 1/5
                  </span>
                </div>

                {/* Tarih Seçimi */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Jurnal Tarihi
                  </label>
                  <div className="relative">
                    <input
                      type="date"
                      value={logDate}
                      onChange={(e) => setLogDate(e.target.value)}
                      required
                      className="w-full bg-slate-950 border border-gray-800 rounded-xl px-3.5 py-2.5 text-xs text-white font-medium focus:outline-none focus:border-orange-500 transition"
                    />
                  </div>
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
              </div>

              {/* KART 2: Personel & Mevcut Kartı */}
              <div className="bg-gray-900 rounded-xl p-5 border border-gray-800 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-gray-800">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center">
                      <Users className="w-4 h-4" />
                    </div>
                    <div>
                      <h2 className="text-sm font-bold text-white">Personel & Mevcut</h2>
                      <p className="text-[11px] text-slate-400">Sahadaki toplam iş gücü puantajı</p>
                    </div>
                  </div>
                  <span className="text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 font-mono">
                    Toplam: {activePersonnelTotal} Kişi
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Kendi Personelimiz
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        value={staffCount}
                        onChange={(e) => setStaffCount(e.target.value)}
                        placeholder="Örn: 12"
                        className="w-full bg-slate-950 border border-gray-800 rounded-xl px-3 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-orange-500"
                      />
                      <span className="absolute right-3 top-2.5 text-[11px] text-slate-400">
                        Kişi
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Taşeron Mevcudu
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        value={subcontractorCount}
                        onChange={(e) => setSubcontractorCount(e.target.value)}
                        placeholder="Örn: 48"
                        className="w-full bg-slate-950 border border-gray-800 rounded-xl px-3 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-orange-500"
                      />
                      <span className="absolute right-3 top-2.5 text-[11px] text-slate-400">
                        Kişi
                      </span>
                    </div>
                  </div>
                </div>

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

              {/* Özel Ekipman Ekleme Formu */}
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

            {/* KART 4: Yapılan İmalatlar (İşler) Kartı */}
            <div className="bg-gray-900 rounded-xl p-5 border border-gray-800 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-gray-800">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 flex items-center justify-center">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-white">Yapılan İmalatlar (İşler)</h2>
                    <p className="text-[11px] text-slate-400">
                      Günün teknik imalat detaylarını ve tamamlanan işleri madde madde belirtiniz
                    </p>
                  </div>
                </div>
                <span className="text-[10px] font-semibold text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
                  Zorunlu Alan
                </span>
              </div>

              <textarea
                value={completedWorks}
                onChange={(e) => setCompletedWorks(e.target.value)}
                required
                rows={5}
                placeholder="Örn:&#10;• A Blok 3. Kat Kolon betonu döküldü (120 m³)&#10;• B Blok temel izolasyon membranı tamamlandı&#10;• 2. Kat iç duvar gazbeton örümü 150 m² yapıldı"
                className="w-full bg-slate-950 border border-gray-800 rounded-xl p-3.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 leading-relaxed font-sans transition resize-y min-h-[120px]"
              />
            </div>

            {/* KART 5: İSG, Gecikme ve Ekstra Notlar Kartı */}
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

            {/* ADIM 3: Aksiyon Butonu - w-full, dikkat çekici & loading state */}
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
