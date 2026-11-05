"use client"
/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Nexa ERP - X-Ray Drawer İş Emri Atama Modalı (CreateTaskModal)
 * Açık / Koyu Tema (Light & Dark Mode) Uyumlu
 */

import React, { useState } from "react"
import {
  X,
  ClipboardList,
  AlertTriangle,
  Calendar,
  User,
  Layers,
  Send,
  Building,
  Clock,
  CheckCircle2,
  FileText,
  Flag,
} from "lucide-react"
import toast from "react-hot-toast"

interface ZoneOption {
  id: string
  name: string
  floorNumber?: number
}

interface BlockData {
  id: string
  name: string
  code: string
  projectName?: string
  zones?: ZoneOption[]
}

interface CreateTaskModalProps {
  isOpen: boolean
  onClose: () => void
  block?: BlockData | null
  onSuccess?: (data: any) => void
}

export default function CreateTaskModal({
  isOpen,
  onClose,
  block,
  onSuccess,
}: CreateTaskModalProps) {
  const [title, setTitle] = useState("")
  const [priority, setPriority] = useState<"CRITICAL" | "HIGH" | "NORMAL" | "LOW">("NORMAL")
  const [assignee, setAssignee] = useState("Ahmet Yılmaz (Kalıpçı Ekip Başı)")
  const [targetZone, setTargetZone] = useState("")
  const [dueDate, setDueDate] = useState(() => {
    const d = new Date()
    d.setDate(d.getDate() + 2)
    return d.toISOString().split("T")[0]
  })
  const [taskCategory, setTaskCategory] = useState("KABA_YAPI")
  const [description, setDescription] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (!isOpen) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!title.trim()) {
      toast.error("Lütfen bir görev başlığı girin.")
      return
    }

    setIsSubmitting(true)

    const payload = {
      title,
      priority,
      assignee,
      zone: targetZone || (block?.zones?.[0]?.name ?? "Genel Kat"),
      dueDate,
      category: taskCategory,
      description,
      blockId: block?.id,
      blockName: block?.name,
      createdAt: new Date().toISOString(),
    }

    setTimeout(() => {
      setIsSubmitting(false)
      toast.success(
        `İş emri "${title}" başarıyla oluşturuldu ve ${assignee.split(" ")[0]} personeline iletildi!`
      )
      if (onSuccess) {
        onSuccess(payload)
      }
      // Reset form and close
      setTitle("")
      setDescription("")
      onClose()
    }, 400)
  }

  // Quick preset dates
  const setQuickDate = (daysAhead: number) => {
    const d = new Date()
    d.setDate(d.getDate() + daysAhead)
    setDueDate(d.toISOString().split("T")[0])
  }

  return (
    <div className="fixed inset-0 z-[120] overflow-y-auto flex items-center justify-center p-4 sm:p-6">
      {/* Backdrop with Frosted Blur */}
      <div
        className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Card */}
      <div className="relative w-full max-w-xl bg-white dark:bg-[#111827] rounded-3xl border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white shadow-2xl overflow-hidden z-10 transition-all animate-in fade-in zoom-in-95 duration-200">
        {/* Top Header */}
        <div className="p-5 sm:p-6 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/60 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-600/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-500/20">
              <ClipboardList className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-blue-600 text-white">
                  Saha Görevi
                </span>
                {block && (
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                    {block.name} ({block.code})
                  </span>
                )}
              </div>
              <h2 className="text-lg font-black text-slate-900 dark:text-white mt-0.5">
                Yeni İş Emri Ata
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-200/80 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors"
            title="Kapat"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4">
          {/* Görev Başlığı */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Görev Başlığı / İş Emri Tanımı <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Örn: 3. Kat Kolon Kalıp ve Donatı İmalat Kontrolü"
              required
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            />
          </div>

          {/* Öncelik Düzeyi */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Öncelik Derecesi
            </label>
            <div className="grid grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => setPriority("CRITICAL")}
                className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all text-center flex flex-col items-center gap-1 ${
                  priority === "CRITICAL"
                    ? "bg-rose-600 text-white border-rose-600 shadow-md shadow-rose-600/30"
                    : "bg-slate-50 dark:bg-slate-900 text-rose-700 dark:text-rose-400 border-slate-200 dark:border-slate-800 hover:border-rose-300"
                }`}
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Kritik</span>
              </button>

              <button
                type="button"
                onClick={() => setPriority("HIGH")}
                className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all text-center flex flex-col items-center gap-1 ${
                  priority === "HIGH"
                    ? "bg-amber-600 text-white border-amber-600 shadow-md shadow-amber-600/30"
                    : "bg-slate-50 dark:bg-slate-900 text-amber-700 dark:text-amber-400 border-slate-200 dark:border-slate-800 hover:border-amber-300"
                }`}
              >
                <Flag className="w-3.5 h-3.5" />
                <span>Yüksek</span>
              </button>

              <button
                type="button"
                onClick={() => setPriority("NORMAL")}
                className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all text-center flex flex-col items-center gap-1 ${
                  priority === "NORMAL"
                    ? "bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-600/30"
                    : "bg-slate-50 dark:bg-slate-900 text-blue-700 dark:text-blue-400 border-slate-200 dark:border-slate-800 hover:border-blue-300"
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Normal</span>
              </button>

              <button
                type="button"
                onClick={() => setPriority("LOW")}
                className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all text-center flex flex-col items-center gap-1 ${
                  priority === "LOW"
                    ? "bg-slate-700 text-white border-slate-700 shadow-sm"
                    : "bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:border-slate-300"
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>Düşük</span>
              </button>
            </div>
          </div>

          {/* Atanacak Kişi / Rol & Kat-Mahal Seçimi (Grid 2 cols) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Atanacak Kişi / Rol */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-blue-500" />
                <span>Atanacak Kişi / Rol</span>
              </label>
              <select
                value={assignee}
                onChange={(e) => setAssignee(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              >
                <option value="Ahmet Yılmaz (Kalıpçı Ekip Başı)">Ahmet Yılmaz (Kalıpçı Ustası)</option>
                <option value="Mehmet Kaya (Demirci Taşeronu)">Mehmet Kaya (Demirci Taşeronu)</option>
                <option value="Ali Demir (Beton Şantiye Şefi)">Ali Demir (Beton Şantiye Şefi)</option>
                <option value="Hüseyin Çelik (Mekanik & MEP Şefi)">Hüseyin Çelik (Mekanik & MEP)</option>
                <option value="Emre Yıldız (Elektrik Ekip Başı)">Emre Yıldız (Elektrik Şefi)</option>
                <option value="Murat Ak (İSG & Saha Denetmeni)">Murat Ak (İSG Uzmanı)</option>
                <option value="Burak Öztürk (Harita / Aplikasyon)">Burak Öztürk (Aplikasyon Teknikeri)</option>
                <option value="Genel Saha Ekibi (Havuz)">Genel Saha Ekibi (Açık Görev)</option>
              </select>
            </div>

            {/* İlgili Kat / Mahal */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-cyan-500" />
                <span>İlgili Kat / Mahal</span>
              </label>
              <select
                value={targetZone}
                onChange={(e) => setTargetZone(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              >
                {block?.zones && block.zones.length > 0 ? (
                  block.zones.map((z) => (
                    <option key={z.id} value={z.name}>
                      {z.name}
                    </option>
                  ))
                ) : (
                  <>
                    <option value="Tüm Blok / Genel">Tüm Blok / Genel</option>
                    <option value="Bodrum 2 - Otopark">Bodrum 2 (Otopark & Su Deposu)</option>
                    <option value="Bodrum 1 - Tesisat">Bodrum 1 (Teknik Hacimler)</option>
                    <option value="Zemin Kat">Zemin Kat</option>
                    <option value="1. Kat">1. Kat (Kalıp & Döşeme)</option>
                    <option value="2. Kat">2. Kat</option>
                    <option value="3. Kat">3. Kat</option>
                    <option value="Çatı / Teras">Çatı & Teras İzolasyon</option>
                  </>
                )}
              </select>
            </div>
          </div>

          {/* Son Teslim Tarihi */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-blue-500" />
                <span>Son Teslim Tarihi</span>
              </label>
              <div className="flex items-center gap-1 text-[11px]">
                <button
                  type="button"
                  onClick={() => setQuickDate(0)}
                  className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                >
                  Bugün
                </button>
                <button
                  type="button"
                  onClick={() => setQuickDate(1)}
                  className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                >
                  Yarın
                </button>
                <button
                  type="button"
                  onClick={() => setQuickDate(3)}
                  className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                >
                  +3 Gün
                </button>
              </div>
            </div>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              required
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            />
          </div>

          {/* Açıklama ve Talimatlar */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-slate-500" />
              <span>Açıklama & Saha Talimatları</span>
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ekibin sahada uyması gereken teknik detaylar, malzeme kodları veya İSG tedbirleri..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white text-xs placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all resize-none"
            />
          </div>

          {/* Action Buttons */}
          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-bold transition-colors"
            >
              Vazgeç
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-lg shadow-blue-600/30 transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>İletiliyor...</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>İş Emrini Ata</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
