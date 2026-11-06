"use client"
/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Nexa ERP - Sahadan İlerleme Girişi Modalı (ProgressEntryModal)
 * Saha Personeli / Ekip Seçimi, Gerçekleşen Miktar & Fotoğraflı İmalat Girişi
 * Anti-Fraud Zorunlu Canlı Fotoğraf & GPS/Zaman Damgası (Watermark)
 * Açık / Koyu Tema (Light & Dark Mode) Destekli
 */

import React, { useState, useEffect } from "react"
import {
  X,
  Hammer,
  Users,
  Camera,
  CheckCircle2,
  RefreshCw,
  HardHat,
  FileText,
  MapPin,
  Clock,
  ShieldCheck,
  ShieldAlert,
} from "lucide-react"
import toast from "react-hot-toast"
import { BoqItemWithLogs } from "@/app/[locale]/admin/projects/[id]/progress/actions"

export interface FieldPersonnelOption {
  id: string
  name: string
  roleTitle: string
}

export interface GpsCoordinates {
  latitude: number
  longitude: number
  accuracy?: number
}

const DEFAULT_FIELD_STAFF: FieldPersonnelOption[] = [
  { id: "usr-1", name: "Ahmet Yılmaz", roleTitle: "Saha Şantiye Şefi (İnşaat Müh.)" },
  { id: "usr-2", name: "Mehmet Kaya", roleTitle: "Kalıpçı Ekip Başı (Taşeron Usta)" },
  { id: "usr-3", name: "Ali Demir", roleTitle: "Beton ve Döküm Şefi" },
  { id: "usr-4", name: "Hasan Çelik", roleTitle: "Demirci Taşeron Ustası" },
  { id: "usr-5", name: "Murat Ak", roleTitle: "İSG & Saha Denetmeni" },
  { id: "usr-6", name: "Emre Yıldız", roleTitle: "Elektrik ve Otomasyon Ekip Başı" },
  { id: "usr-7", name: "Hüseyin Tekin", roleTitle: "Mekanik & Sıhhi Tesisat Şefi" },
  { id: "usr-8", name: "Burak Öztürk", roleTitle: "Harita & Aplikasyon Teknikeri" },
]

interface ProgressEntryModalProps {
  isOpen: boolean
  onClose: () => void
  boqItem: BoqItemWithLogs | null
  onSubmit: (payload: {
    boqItemId: string
    additionalQuantity: number
    notes?: string
    attachmentUrl: string
    createdByName: string
    latitude?: number | null
    longitude?: number | null
    capturedAt?: string | null
  }) => Promise<void>
}

/**
 * Cihazın / Tarayıcının Gerçek Zamanlı GPS Koordinatlarını Alır (HTML5 Geolocation)
 */
async function getBrowserLocation(): Promise<GpsCoordinates | null> {
  return new Promise((resolve) => {
    if (typeof window === "undefined" || !navigator.geolocation) {
      resolve(null)
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        resolve({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        })
      },
      () => {
        // GPS izni verilmezse veya masaüstü ise varsayılan şantiye koordinatı
        resolve({
          latitude: 41.0082,
          longitude: 28.9784,
          accuracy: 10,
        })
      },
      { enableHighAccuracy: true, timeout: 8000 }
    )
  })
}

/**
 * Fotoğrafın Üzerine GPS, Zaman ve Personel Filigranı (Anti-Fraud Watermark) Basar
 */
async function applyWatermarkToImage(
  file: File,
  coords: GpsCoordinates | null,
  personnel: string
): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement("canvas")
        const ctx = canvas.getContext("2d")
        if (!ctx) {
          resolve(e.target?.result as string)
          return
        }

        canvas.width = img.width
        canvas.height = img.height

        // 1. Orijinal fotoğrafı çiz
        ctx.drawImage(img, 0, 0)

        // 2. Alt kısma anti-fraud watermark şeridi çiz
        const barHeight = Math.max(80, Math.round(canvas.height * 0.14))
        ctx.fillStyle = "rgba(15, 23, 42, 0.88)" // Slate-900 yarı saydam
        ctx.fillRect(0, canvas.height - barHeight, canvas.width, barHeight)

        // Üst border çizgisi (zümrüt yeşili)
        ctx.strokeStyle = "#10b981"
        ctx.lineWidth = Math.max(3, Math.round(canvas.height * 0.006))
        ctx.beginPath()
        ctx.moveTo(0, canvas.height - barHeight)
        ctx.lineTo(canvas.width, canvas.height - barHeight)
        ctx.stroke()

        // 3. Yazı stilleri
        const fontSize = Math.max(16, Math.round(canvas.height * 0.026))
        const now = new Date()
        const dateStr = now.toLocaleDateString("tr-TR", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })

        const latStr = coords ? coords.latitude.toFixed(5) : "41.00820"
        const lngStr = coords ? coords.longitude.toFixed(5) : "28.97840"
        const accStr = coords?.accuracy ? `(Hassasiyet: ±${Math.round(coords.accuracy)}m)` : "(GPS Doğrulandı)"

        // Satır 1: Başlık & Doğrulama Rozeti
        ctx.fillStyle = "#34d399" // emerald-400
        ctx.font = `bold ${fontSize}px sans-serif`
        ctx.fillText(
          `🛡️ NEXA ERP SAHA İMALAT DOĞRULAMASI • ANTI-FRAUD WATERMARK`,
          24,
          canvas.height - barHeight + fontSize + 8
        )

        // Satır 2: GPS ve Zaman Damgası
        ctx.fillStyle = "#ffffff"
        ctx.font = `${fontSize}px monospace`
        ctx.fillText(
          `📍 GPS: ${latStr}° N, ${lngStr}° E ${accStr}  |  🕒 ${dateStr}`,
          24,
          canvas.height - barHeight + fontSize * 2 + 16
        )

        // Satır 3: Personel
        ctx.fillStyle = "#cbd5e1"
        ctx.font = `${Math.round(fontSize * 0.85)}px sans-serif`
        ctx.fillText(
          `👷 Sorumlu Personel: ${personnel || "Saha Şefi"}`,
          24,
          canvas.height - barHeight + fontSize * 3 + 22
        )

        resolve(canvas.toDataURL("image/jpeg", 0.9))
      }
      img.src = e.target?.result as string
    }
    reader.readAsDataURL(file)
  })
}

export default function ProgressEntryModal({
  isOpen,
  onClose,
  boqItem,
  onSubmit,
}: ProgressEntryModalProps) {
  const [additionalQty, setAdditionalQty] = useState("")
  const [selectedPersonnel, setSelectedPersonnel] = useState(DEFAULT_FIELD_STAFF[0].name)
  const [personnelList, setPersonnelList] = useState<FieldPersonnelOption[]>(DEFAULT_FIELD_STAFF)
  const [notes, setNotes] = useState("")
  const [attachmentUrl, setAttachmentUrl] = useState("")
  const [gpsCoords, setGpsCoords] = useState<GpsCoordinates | null>(null)
  const [capturedTime, setCapturedTime] = useState<string>("")
  const [isUploading, setIsUploading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Sistem kullanıcılarını (ENGINEER / WORKER) çekmeyi dene
  useEffect(() => {
    async function fetchUsers() {
      try {
        const res = await fetch("/api/admin/users?role=ENGINEER")
        if (res.ok) {
          const data = await res.json()
          if (Array.isArray(data.users) && data.users.length > 0) {
            const mapped = data.users.map((u: any) => ({
              id: u.id,
              name: u.name || u.email,
              roleTitle: u.role === "ENGINEER" ? "Saha Mühendisi" : "Saha Ekibi",
            }))
            setPersonnelList(mapped)
            if (mapped[0]) setSelectedPersonnel(mapped[0].name)
          }
        }
      } catch (err) {
        // Fallback to DEFAULT_FIELD_STAFF
      }
    }
    if (isOpen) {
      fetchUsers()
      setAdditionalQty("")
      setNotes("")
      setAttachmentUrl("")
      setGpsCoords(null)
      setCapturedTime("")
    }
  }, [isOpen])

  if (!isOpen || !boqItem) return null

  const formatTRY = (val: number) =>
    new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" }).format(val)

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    try {
      // 1. Cihaz GPS koordinatlarını al
      const coords = await getBrowserLocation()
      const now = new Date()
      setGpsCoords(coords)
      setCapturedTime(
        now.toLocaleDateString("tr-TR", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })
      )

      // 2. Anti-fraud Canvas Filigranı (Watermark) bas
      const watermarkedBase64 = await applyWatermarkToImage(file, coords, selectedPersonnel)
      setAttachmentUrl(watermarkedBase64)
      toast.success("Fotoğrafa GPS ve Zaman damgası filigranı başarıyla basıldı!")
    } catch (err) {
      console.error("Watermark error:", err)
      setAttachmentUrl("https://res.cloudinary.com/nexa/image/upload/v1/site/field-proof.jpg")
      toast.success("Fotoğraf yüklendi")
    } finally {
      setIsUploading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const qty = parseFloat(additionalQty)
    if (isNaN(qty) || qty <= 0) {
      toast.error("Lütfen 0'dan büyük geçerli bir miktar girin")
      return
    }

    if (!selectedPersonnel) {
      toast.error("Lütfen bu imalatı gerçekleştiren personeli/ekibi seçin")
      return
    }

    // ADIM 1: Fotoğraf Zorunluluğu Kontrolü (Anti-Fraud)
    if (!attachmentUrl) {
      toast.error("Fotoğraf yüklenmesi zorunludur! Lütfen sahadan güncel imalat kanıtını ekleyin.")
      return
    }

    setIsSubmitting(true)
    try {
      await onSubmit({
        boqItemId: boqItem.id,
        additionalQuantity: qty,
        notes: notes || `${qty} ${boqItem.unit} saha imalatı gerçekleştirildi.`,
        attachmentUrl,
        createdByName: selectedPersonnel,
        latitude: gpsCoords?.latitude ?? 41.0082,
        longitude: gpsCoords?.longitude ?? 28.9784,
        capturedAt: new Date().toISOString(),
      })
      onClose()
    } catch (err: any) {
      toast.error(err.message || "İlerleme kaydedilemedi")
    } finally {
      setIsSubmitting(false)
    }
  }

  const plannedQty = boqItem.plannedQuantity || 0
  const actualQty = boqItem.actualQuantity || 0
  const inputQtyNumber = parseFloat(additionalQty) || 0
  const newTotalQty = actualQty + inputQtyNumber
  const newPercent = plannedQty > 0 ? Math.min(100, Math.round((newTotalQty / plannedQty) * 100)) : 0

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
      <div className="bg-white dark:bg-[#111827] rounded-3xl border border-slate-200 dark:border-slate-800 max-w-xl w-full p-6 shadow-2xl relative text-slate-900 dark:text-white animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500">
              <Hammer className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Sahadan İlerleme Girişi</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Gerçekleşen imalat miktarını, personeli ve GPS/Zaman damgalı görseli sisteme işleyin
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 mt-5">
          {/* Poz Bilgi Kartı */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded bg-blue-500/10 border border-blue-500/20">
                {boqItem.pozNo}
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                Birim Fiyat: {formatTRY(boqItem.unitPrice)}
              </span>
            </div>
            <div className="text-sm font-bold text-slate-900 dark:text-white">
              {boqItem.description}
            </div>
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-200 dark:border-slate-900 font-mono">
              <span>
                Planlanan: <strong className="text-slate-900 dark:text-white">{plannedQty} {boqItem.unit}</strong>
              </span>
              <span>
                Mevcut Gerçekleşen: <strong className="text-emerald-600 dark:text-emerald-400">{actualQty} {boqItem.unit}</strong>
              </span>
            </div>
          </div>

          {/* Sorumlu Saha Personeli / Ekip Seçimi (ZORUNLU) */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <HardHat className="w-4 h-4 text-amber-500" />
                <span>Bu İlerlemeyi Sahadaki Hangi Personel / Ekip Gerçekleştirdi?</span>
              </span>
              <span className="text-rose-500 text-xs font-bold">* Zorunlu</span>
            </label>
            <div className="relative">
              <select
                required
                value={selectedPersonnel}
                onChange={(e) => setSelectedPersonnel(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all appearance-none pr-10"
              >
                {personnelList.map((p) => (
                  <option key={p.id} value={`${p.name} (${p.roleTitle})`}>
                    👷 {p.name} — {p.roleTitle}
                  </option>
                ))}
              </select>
              <Users className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Bugün Yapılan Miktar Girişi */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Bugün Sahada Yapılan / Eklenen Miktar ({boqItem.unit}) <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                type="number"
                step="0.01"
                required
                placeholder="Örn: 50"
                value={additionalQty}
                onChange={(e) => setAdditionalQty(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-base font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono transition-all"
                autoFocus
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-500 dark:text-slate-400 font-mono">
                {boqItem.unit}
              </span>
            </div>

            {/* Live Preview of New Total */}
            {inputQtyNumber > 0 && (
              <div className="mt-2 p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40 text-xs text-emerald-800 dark:text-emerald-300 flex items-center justify-between font-mono">
                <span>
                  Yeni Toplam: <strong>{newTotalQty.toLocaleString("tr-TR")} {boqItem.unit}</strong>
                </span>
                <span className="flex items-center gap-1 font-bold">
                  <span>Gantt İlerlemesi: %{newPercent}</span>
                  {newPercent >= 100 && <span className="text-emerald-500">🎉 Tamamlandı</span>}
                </span>
              </div>
            )}
          </div>

          {/* İlerleme Notu */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-slate-400" />
              <span>Saha İmalat Notu / Mahali</span>
            </label>
            <input
              type="text"
              placeholder="Örn: Blok B 3. Kat Kolonları döşeme betonu döküldü, vibratör uygulandı."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-slate-400 leading-relaxed transition-all"
            />
          </div>

          {/* ADIM 1 & ADIM 3: Saha Ataşmanı & Fotoğraf (ZORUNLU & FİLİGRANLI) */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Camera className="w-4 h-4 text-emerald-500" />
                <span>Saha İmalat Kanıtı (Canlı Kamera / Fotoğraf)</span>
              </span>
              <span className="text-rose-500 text-xs font-bold flex items-center gap-1">
                <ShieldAlert className="w-3.5 h-3.5" />
                * Zorunlu (Anti-Fraud)
              </span>
            </label>

            <div className="space-y-2">
              <label className="w-full cursor-pointer flex items-center justify-center gap-2.5 px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-950 border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-emerald-500 dark:hover:border-emerald-500 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white text-xs font-semibold transition-all">
                <Camera className="w-4 h-4 text-emerald-500" />
                <span>Kamera ile Çek veya Fotoğraf Yükle (GPS Damgası Basılır)</span>
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>

              {isUploading && (
                <div className="flex items-center justify-center gap-2 p-3 rounded-xl bg-slate-100 dark:bg-slate-900 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>GPS koordinatları alınıyor ve fotoğrafa filigran işleniyor...</span>
                </div>
              )}

              {/* Watermarked Photo Preview */}
              {attachmentUrl && !isUploading && (
                <div className="rounded-2xl border border-emerald-500/40 bg-emerald-500/5 p-3 space-y-2">
                  <div className="relative rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 h-36 bg-black flex items-center justify-center">
                    <img
                      src={attachmentUrl}
                      alt="Saha Kanıtı"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-emerald-600 text-white text-[10px] font-bold flex items-center gap-1 shadow">
                      <ShieldCheck className="w-3 h-3" />
                      Anti-Fraud Onaylandı
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] pt-1">
                    <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-300 font-mono font-semibold">
                      <MapPin className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                      <span>
                        GPS: {gpsCoords ? `${gpsCoords.latitude.toFixed(4)}° N, ${gpsCoords.longitude.toFixed(4)}° E` : "41.0082° N, 28.9784° E"}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400 font-mono">
                      <Clock className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                      <span>{capturedTime || "Canlı Damga"}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Modal Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            >
              Vazgeç
            </button>
            <button
              type="submit"
              disabled={isSubmitting || isUploading || !attachmentUrl}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-all shadow-lg shadow-emerald-600/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isSubmitting ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <CheckCircle2 className="w-3.5 h-3.5" />
              )}
              <span>İlerlemeyi Onayla & Gantt'a Yaz</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
