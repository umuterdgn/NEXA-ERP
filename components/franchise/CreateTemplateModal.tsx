"use client"
/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Franchise Konsept Şablonları (Tip Mağaza) Detaylı Tanımlama Modalı
 */

import { useState, useTransition } from "react"
import {
  Box,
  X,
  Loader2,
  Plus,
  DollarSign,
  Maximize2,
  Layers,
  FileCode,
  FileText,
  Check,
  UploadCloud,
  CheckCircle2,
  AlertCircle
} from "lucide-react"
import { createConceptTemplate } from "@/app/actions/franchise"
import { toast } from "react-hot-toast"

interface CreateTemplateModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

const CONCEPT_TYPES = [
  { value: "MALL", label: "AVM İçi Mağaza (Food Court / Mağaza Katı)" },
  { value: "STREET", label: "Cadde Mağazası (Geniş Vitrinli Bağımsız)" },
  { value: "KIOSK", label: "Kiosk / Stand (Merkezi Ada Ünitesi)" },
  { value: "DRIVE_THRU", label: "Drive-Thru Konsepti (Oto Servisli)" },
  { value: "EXPRESS", label: "Express / Mini Şube (Kompakt 'Al & Çık')" },
  { value: "POPUP", label: "Pop-Up & Etkinlik Konsepti" },
]

const EQUIPMENT_OPTIONS = [
  "Endüstriyel Espresso Makinesi & Değirmen",
  "Merkezi POS & Kasa Terminali (Dokunmatik)",
  "LOD-300 Modüler Banko & Servis Hattı",
  "Soğutucu Pasta & İçecek Teşhir Dolabı",
  "Derin Dondurucu & Soğuk Hava Deposu",
  "Merkezi HVAC & Taze Hava Havalandırması",
  "Yangın Sprinkler & Otomatik Gazlı Söndürme",
  "IP Kamera (CCTV) & Güvenlik Alarm Sistemi",
  "Otomatik Motorlu Sarmal Kepenk",
  "Akustik Arka Plan Müzik ve Ses Sistemi",
  "Dijital LED Menü Board & Tanıtım Ekranı",
  "Su Arıtma & Yumuşatma Filtrasyon Sistemi",
]

export default function CreateTemplateModal({
  isOpen,
  onClose,
  onSuccess,
}: CreateTemplateModalProps) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    name: "",
    conceptType: "MALL",
    minArea: "120",
    maxArea: "250",
    sqmCost: "16500",
    bimModelUrl: "",
    bimFileName: "",
    manualPdfName: "",
    selectedEquipments: [
      "Endüstriyel Espresso Makinesi & Değirmen",
      "Merkezi POS & Kasa Terminali (Dokunmatik)",
      "LOD-300 Modüler Banko & Servis Hattı",
      "Merkezi HVAC & Taze Hava Havalandırması",
    ] as string[],
  })

  if (!isOpen) return null

  // Calculate estimated budget
  const avgArea = ((parseFloat(formData.minArea) || 100) + (parseFloat(formData.maxArea) || 200)) / 2
  const sqmCostNum = parseFloat(formData.sqmCost) || 15000
  const calculatedBudget = Math.round(avgArea * sqmCostNum)

  const toggleEquipment = (eq: string) => {
    setFormData((prev) => {
      const exists = prev.selectedEquipments.includes(eq)
      return {
        ...prev,
        selectedEquipments: exists
          ? prev.selectedEquipments.filter((item) => item !== eq)
          : [...prev.selectedEquipments, eq],
      }
    })
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)

    if (!formData.name.trim()) {
      setError("Lütfen konsept şablonu adını belirtin.")
      return
    }

    startTransition(async () => {
      try {
        const phasesJson = {
          conceptType: formData.conceptType,
          minArea: Number(formData.minArea) || 100,
          maxArea: Number(formData.maxArea) || 200,
          sqmCost: Number(formData.sqmCost) || 15000,
          bimModelUrl: formData.bimModelUrl || `https://storage.nxerp.com.tr/bim/templates/${encodeURIComponent(formData.name.toLowerCase().replace(/\\s+/g, "-"))}.ifc`,
          bimFileName: formData.bimFileName || `${formData.name}_LOD300.ifc`,
          equipmentList: formData.selectedEquipments,
          manualPdfName: formData.manualPdfName || `${formData.name}_Kurulum_Kilavuzu_2026.pdf`,
          phases: [
            { name: "Kiralama & Alan Teslimi", days: 10, weight: 15 },
            { name: "AVM & Mimari Proje Onayı", days: 12, weight: 20 },
            { name: "Kaba & İnce İnşaat Montajı", days: 22, weight: 40 },
            { name: "Punch List & Kalite Denetimi", days: 6, weight: 15 },
            { name: "İtfaiye Ruhsatı & Açılış İzni", days: 4, weight: 10 },
          ],
        }

        const payload = new FormData()
        payload.append("name", formData.name.trim())
        payload.append("baseBudget", calculatedBudget.toString())
        payload.append("phasesJson", JSON.stringify(phasesJson))

        const res = await createConceptTemplate(payload)
        if (!res.success) {
          setError(res.error || "Şablon oluşturulamadı.")
          return
        }

        toast.success(`"${formData.name}" konsept şablonu başarıyla tanımlandı!`)
        onClose()
        if (onSuccess) onSuccess()
      } catch (err: any) {
        setError(err.message || "Beklenmeyen bir hata oluştu.")
      }
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Box className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Yeni Konsept Şablonu (Tip Mağaza) Ekle</h3>
              <p className="text-xs text-slate-400">Zincir şubeler için standart mimari, m² maliyet ve demirbaş kural seti</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className="text-slate-400 hover:text-white p-1.5 rounded-xl hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {error && (
            <div className="p-3.5 rounded-xl bg-red-950/60 border border-red-800 text-xs text-red-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
              <span>{error}</span>
            </div>
          )}

          {/* Şablon Adı & Tipi */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Şablon Adı <span className="text-amber-400">*</span>
              </label>
              <input
                type="text"
                placeholder="Örn: AVM İçi 180m² Restoran Konsepti"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3.5 py-2.5 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-colors"
                required
                disabled={isPending}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Konsept / Mağaza Tipi <span className="text-amber-400">*</span>
              </label>
              <select
                value={formData.conceptType}
                onChange={(e) => setFormData({ ...formData, conceptType: e.target.value })}
                className="w-full px-3.5 py-2.5 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-amber-500 transition-colors"
                disabled={isPending}
              >
                {CONCEPT_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Gerekli Alan (Min-Max m²) & m² Kurulum Maliyeti */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Maximize2 className="w-3.5 h-3.5 text-blue-400" />
                <span>Min. Alan (m²)</span>
              </label>
              <input
                type="number"
                min="10"
                max="5000"
                placeholder="Örn: 100"
                value={formData.minArea}
                onChange={(e) => setFormData({ ...formData, minArea: e.target.value })}
                className="w-full px-3.5 py-2.5 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-amber-500 transition-colors"
                required
                disabled={isPending}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Maximize2 className="w-3.5 h-3.5 text-blue-400" />
                <span>Maks. Alan (m²)</span>
              </label>
              <input
                type="number"
                min="10"
                max="5000"
                placeholder="Örn: 250"
                value={formData.maxArea}
                onChange={(e) => setFormData({ ...formData, maxArea: e.target.value })}
                className="w-full px-3.5 py-2.5 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-amber-500 transition-colors"
                required
                disabled={isPending}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                <span>m² Kurulum Maliyeti (₺)</span>
              </label>
              <input
                type="number"
                min="1000"
                placeholder="Örn: 16500"
                value={formData.sqmCost}
                onChange={(e) => setFormData({ ...formData, sqmCost: e.target.value })}
                className="w-full px-3.5 py-2.5 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-amber-500 transition-colors"
                required
                disabled={isPending}
              />
            </div>
          </div>

          {/* Otomatik Hesaplanmış Taban Bütçe Özeti */}
          <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-xs">
                ₺
              </div>
              <div>
                <span className="text-[10px] text-amber-300/80 uppercase font-semibold">Ortalama Proje Taban Kurulum Bütçesi</span>
                <div className="text-sm font-black text-white font-mono">
                  {calculatedBudget.toLocaleString("tr-TR")} ₺
                  <span className="text-xs text-slate-400 font-normal ml-2">({Math.round(avgArea)} m² ortalama baz alınarak)</span>
                </div>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-400 text-[11px] font-bold border border-emerald-500/30">
              Otomatik Hesaplanır
            </span>
          </div>

          {/* BIM / 3D Model Dosyası & URL */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <FileCode className="w-3.5 h-3.5 text-amber-400" />
              <span>BIM / 3D Model Bağlantısı (.ifc, .rvt)</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                type="text"
                placeholder="Model URL (Örn: https://storage.../model.ifc)"
                value={formData.bimModelUrl}
                onChange={(e) => setFormData({ ...formData, bimModelUrl: e.target.value })}
                className="px-3.5 py-2 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-amber-500 transition-colors"
                disabled={isPending}
              />
              <label className="flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl bg-slate-950 border border-dashed border-slate-700 hover:border-amber-500 cursor-pointer text-xs text-slate-400 hover:text-white transition-all">
                <UploadCloud className="w-4 h-4 text-amber-400" />
                <span className="truncate">{formData.bimFileName || "IFC/RVT Modeli Seç (.ifc)"}</span>
                <input
                  type="file"
                  accept=".ifc,.rvt,.dwg"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) setFormData({ ...formData, bimFileName: file.name })
                  }}
                />
              </label>
            </div>
          </div>

          {/* Kılavuz (PDF) Dosyası */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-rose-400" />
              <span>Standart Fit-Out & Mimari Uygulama Kılavuzu (PDF)</span>
            </label>
            <label className="flex items-center justify-between px-4 py-2.5 rounded-xl bg-slate-950 border border-dashed border-slate-700 hover:border-rose-500 cursor-pointer text-xs text-slate-400 hover:text-white transition-all">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-rose-400" />
                <span>{formData.manualPdfName || "Şube Açılış ve Mimari Konsept El Kitabı (PDF Yükle)"}</span>
              </div>
              <span className="text-[11px] font-semibold text-rose-400 bg-rose-500/10 px-2.5 py-0.5 rounded-md border border-rose-500/20">
                PDF Seç
              </span>
              <input
                type="file"
                accept=".pdf"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) setFormData({ ...formData, manualPdfName: file.name })
                }}
              />
            </label>
          </div>

          {/* Zorunlu Demirbaş/Ekipman Listesi (Çoklu Seçim) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-amber-400" />
                <span>Zorunlu Demirbaş & Ekipman Kriterleri ({formData.selectedEquipments.length} seçili)</span>
              </label>
              <button
                type="button"
                onClick={() =>
                  setFormData({
                    ...formData,
                    selectedEquipments:
                      formData.selectedEquipments.length === EQUIPMENT_OPTIONS.length
                        ? []
                        : [...EQUIPMENT_OPTIONS],
                  })
                }
                className="text-[11px] text-amber-400 hover:text-amber-300 font-semibold"
              >
                {formData.selectedEquipments.length === EQUIPMENT_OPTIONS.length ? "Temizle" : "Tümünü Seç"}
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-44 overflow-y-auto p-1">
              {EQUIPMENT_OPTIONS.map((eq) => {
                const isSelected = formData.selectedEquipments.includes(eq)
                return (
                  <button
                    key={eq}
                    type="button"
                    onClick={() => toggleEquipment(eq)}
                    className={`flex items-center gap-2 p-2.5 rounded-xl border text-left transition-all text-xs ${
                      isSelected
                        ? "bg-amber-950/40 border-amber-600/70 text-amber-200 shadow-sm"
                        : "bg-slate-950/70 border-slate-800 text-slate-400 hover:border-slate-700"
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded-md border flex items-center justify-center shrink-0 ${
                        isSelected
                          ? "bg-amber-500 border-amber-400 text-slate-950"
                          : "border-slate-700 bg-slate-900"
                      }`}
                    >
                      {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>
                    <span className="truncate">{eq}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Form Actions Footer */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={isPending}
              className="px-4 py-2.5 text-xs text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
            >
              Vazgeç
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white text-xs font-bold shadow-lg shadow-amber-500/20 disabled:opacity-50 transition-all cursor-pointer"
            >
              {isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Şablon Kaydediliyor...</span>
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  <span>Konsept Şablonunu Oluştur</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
