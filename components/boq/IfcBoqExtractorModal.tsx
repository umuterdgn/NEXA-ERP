"use client"

/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * IFC Modelinden Otomatik Metraj (BoQ) Çıkarma Modalı
 * - Web-IFC & Algoritmik ISO-10303 Geometri Çözücü
 * - IfcColumn, IfcWallStandardCase, IfcSlab, IfcBeam Otomatik Hacim & Alan Hesabı
 * - BoQItem Tablosuna Otomatik Kayıt (Server Action)
 */

import React, { useState, useRef } from "react"
import {
  Box,
  Layers,
  Upload,
  FileCode,
  CheckCircle2,
  AlertCircle,
  Loader2,
  X,
  Sparkles,
  ArrowRight,
  Database,
  Building2,
  ExternalLink,
} from "lucide-react"
import { parseIfcFileToBoQ, IfcParseResult, ExtractedBoQItem } from "@/lib/ifcBoqParser"
import { importBoQFromIfcAction } from "@/app/actions/boq"
import { toast } from "react-hot-toast"
import { useRouter } from "next/navigation"

interface IfcBoqExtractorModalProps {
  projectId?: string
  onImportSuccess?: (items: ExtractedBoQItem[]) => void
  buttonClassName?: string
}

export default function IfcBoqExtractorModal({
  projectId,
  onImportSuccess,
  buttonClassName,
}: IfcBoqExtractorModalProps) {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [isParsing, setIsParsing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [parseStep, setParseStep] = useState<string>("")
  const [parseResult, setParseResult] = useState<IfcParseResult | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // IFC Dosyasını İşleme Fonksiyonu
  const handleProcessFile = async (file: File) => {
    try {
      setIsParsing(true)
      setParseResult(null)
      setParseStep("1/4: IFC dosyası okunuyor ve ISO-10303 başlığı taranıyor...")

      await new Promise((r) => setTimeout(r, 400))
      setParseStep("2/4: 3D Geometri ayrıştırılıyor (IfcColumn, IfcWallStandardCase, IfcSlab)...")

      await new Promise((r) => setTimeout(r, 600))
      setParseStep("3/4: Kesit profilleri ve ekstrüzyon hacimleri (m³, m²) hesaplanıyor...")

      const result = await parseIfcFileToBoQ(file)

      await new Promise((r) => setTimeout(r, 400))
      setParseStep("4/4: Keşif pozları standart inşaat normlarına göre gruplanıyor...")

      setParseResult(result)
      toast.success(
        `IFC başarıyla tarandı! ${result.items.length} adet metraj grubu çıkarıldı 🎯`,
        { duration: 4000 }
      )
    } catch (err: any) {
      console.error("IFC parsing error:", err)
      toast.error(err?.message || "IFC dosyası ayrıştırılırken hata oluştu.")
    } finally {
      setIsParsing(false)
      setParseStep("")
    }
  }

  // Örnek Şantiye Modelini Yükle (/sample.ifc)
  const handleLoadSampleIfc = async () => {
    try {
      setIsParsing(true)
      setParseStep("Örnek IFC modeli sunucudan alınıyor (/sample.ifc)...")
      const res = await fetch("/sample.ifc")
      if (!res.ok) throw new Error("Örnek IFC dosyası yüklenemedi.")
      const blob = await res.blob()
      const sampleFile = new File([blob], "Nexa-Plaza-A-Blok-Statik.ifc", {
        type: "application/x-step",
      })
      await handleProcessFile(sampleFile)
    } catch (error: any) {
      toast.error("Örnek dosya yüklenirken hata oluştu: " + error.message)
      setIsParsing(false)
    }
  }

  // Dosya Seçim Girişi
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (!file.name.toLowerCase().endsWith(".ifc")) {
        toast.error("Lütfen geçerli bir .ifc uzantılı dosya seçiniz.")
        return
      }
      handleProcessFile(file)
    }
  }

  // Sürükle Bırak
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files?.[0]
    if (file) {
      if (!file.name.toLowerCase().endsWith(".ifc")) {
        toast.error("Lütfen geçerli bir .ifc uzantılı dosya seçiniz.")
        return
      }
      handleProcessFile(file)
    }
  }

  // Çıkarılan Metrajları BoQItem Tablosuna Kaydet (Server Action)
  const handleSaveToBoq = async () => {
    if (!parseResult || parseResult.items.length === 0) return

    try {
      setIsSaving(true)
      const payload = parseResult.items.map((item) => ({
        pozNo: item.pozNo,
        description: item.description,
        unit: item.unit,
        plannedQuantity: item.plannedQuantity,
        unitPrice: item.unitPrice,
        bimElementId: item.bimElementId,
      }))

      const res = await importBoQFromIfcAction(payload, projectId)

      if (res.success) {
        toast.success(
          `🎉 ${res.count} adet iş kalemi BoQ tablosuna otonom kaydedildi!`,
          { duration: 5000 }
        )
        onImportSuccess?.(parseResult.items)
        setIsOpen(false)
        setParseResult(null)
        router.refresh()
      } else {
        toast.error(res.error || "BoQ kayıt işlemi başarısız oldu.")
      }
    } catch (err: any) {
      toast.error(err?.message || "Beklenmedik bir hata oluştu.")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <>
      {/* ADIM 1: Şık IFC Otomatik Metraj Çıkarma Butonu */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className={
          buttonClassName ||
          "inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-semibold text-sm rounded-xl shadow-md shadow-blue-500/25 hover:shadow-blue-500/40 border border-blue-400/40 active:scale-[0.98] transition-all cursor-pointer group"
        }
        title="BIM 3D IFC dosyasından kolon, duvar ve döşeme metrajlarını otomatik çıkar"
      >
        <span className="text-base group-hover:scale-110 transition-transform">🏗️</span>
        <span className="font-bold">IFC Modelinden Otomatik Metraj (BoQ) Çıkar</span>
      </button>

      {/* IFC Çıkarıcı Dialog Modalı */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden relative">
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-950">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/20 to-indigo-500/20 border border-blue-500/30 text-blue-400 flex items-center justify-center">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                    <span>🏗️ BIM IFC Modelinden Otomatik Metraj & BoQ Çıkarıcı</span>
                    <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                      web-ifc AI
                    </span>
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    3D IFC dosyasındaki IfcColumn, IfcWallStandardCase ve IfcSlab geometrilerini tarayarak hacim (m³) ve alan (m²) cetveli oluşturun.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false)
                  setParseResult(null)
                }}
                className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              {/* Yükleme / Sürükle Bırak Alanı */}
              <div
                onDragOver={(e) => {
                  e.preventDefault()
                  setDragOver(true)
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all ${
                  dragOver
                    ? "border-blue-500 bg-blue-500/10 scale-[1.01]"
                    : "border-slate-700/80 bg-slate-950/60 hover:border-slate-600"
                }`}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept=".ifc"
                  className="hidden"
                />

                <div className="max-w-md mx-auto space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-blue-600/10 border border-blue-500/20 text-blue-400 mx-auto flex items-center justify-center">
                    <Upload className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-white">
                      IFC (.ifc) Dosyasını Buraya Sürükleyin veya Seçin
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">
                      Desteklenen: IFC2X3, IFC4, IFC4X3 (Statik, Mimari, Tesisat Modelleri)
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                    <button
                      type="button"
                      disabled={isParsing}
                      onClick={() => fileInputRef.current?.click()}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-semibold rounded-xl shadow transition cursor-pointer"
                    >
                      📁 Bilgisayardan .IFC Seç
                    </button>
                    <button
                      type="button"
                      disabled={isParsing}
                      onClick={handleLoadSampleIfc}
                      className="px-4 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-cyan-300 border border-cyan-500/30 text-xs font-semibold rounded-xl transition cursor-pointer flex items-center gap-1.5"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                      <span>⚡ Örnek Şantiye Modelini Tara (sample.ifc)</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Parsing Progress Indicator */}
              {isParsing && (
                <div className="bg-slate-950 border border-blue-500/30 rounded-xl p-4 flex items-center gap-3 animate-pulse">
                  <Loader2 className="w-5 h-5 text-blue-400 animate-spin flex-shrink-0" />
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-blue-300">
                      IFC Modeli Algoritmik Olarak Taranıyor...
                    </p>
                    <p className="text-[11px] text-slate-400 font-mono">{parseStep}</p>
                  </div>
                </div>
              )}

              {/* Parsed Result Display */}
              {parseResult && (
                <div className="space-y-4 animate-in fade-in duration-300">
                  {/* Summary Bar */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3">
                      <span className="text-[11px] text-slate-400">Ayrıştırılan Dosya</span>
                      <p className="text-xs font-bold text-white font-mono truncate mt-0.5">
                        {parseResult.fileName} ({parseResult.schema})
                      </p>
                    </div>
                    <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3">
                      <span className="text-[11px] text-slate-400">Çıkarılan Keşif Grubu</span>
                      <p className="text-sm font-bold text-cyan-300 mt-0.5">
                        {parseResult.totalItems} Poz Kalemi
                      </p>
                    </div>
                    <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3">
                      <span className="text-[11px] text-slate-400">Tahmini Keşif Bedeli</span>
                      <p className="text-sm font-bold text-emerald-400 font-mono mt-0.5">
                        {parseResult.totalEstimatedCost.toLocaleString("tr-TR", {
                          minimumFractionDigits: 2,
                        })}{" "}
                        ₺
                      </p>
                    </div>
                  </div>

                  {/* Extracted Items Table */}
                  <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950/90">
                    <div className="px-4 py-2.5 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
                      <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                        <Layers className="w-3.5 h-3.5 text-blue-400" />
                        <span>Otomatik Gruplanan Keşif & Metraj Cetveli (BoQ)</span>
                      </h4>
                      <span className="text-[10px] text-slate-500 font-mono">
                        Standart Çevre ve Şehircilik Bakanlığı Pozları ile Eşlendi
                      </span>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs font-mono">
                        <thead className="bg-slate-900/60 text-slate-400 border-b border-slate-800/80">
                          <tr>
                            <th className="px-3 py-2">Poz No</th>
                            <th className="px-3 py-2">İş Kalemi & Grup Tanımı</th>
                            <th className="px-3 py-2 text-center">Birim</th>
                            <th className="px-3 py-2 text-right">Hesaplanan Miktar</th>
                            <th className="px-3 py-2 text-right">Birim Fiyat</th>
                            <th className="px-3 py-2 text-right">Toplam Tutar</th>
                            <th className="px-3 py-2">3D GUID</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/60">
                          {parseResult.items.map((item) => (
                            <tr key={item.id} className="hover:bg-slate-800/40">
                              <td className="px-3 py-2.5 text-blue-400 font-semibold">
                                {item.pozNo}
                              </td>
                              <td className="px-3 py-2.5 text-slate-200 font-sans font-medium">
                                <div className="flex items-center gap-2">
                                  <span>{item.description}</span>
                                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 border border-slate-700">
                                    {item.elementCount} Adet
                                  </span>
                                </div>
                              </td>
                              <td className="px-3 py-2.5 text-center text-slate-400">
                                {item.unit}
                              </td>
                              <td className="px-3 py-2.5 text-right font-bold text-white">
                                {item.plannedQuantity.toLocaleString("tr-TR")}
                              </td>
                              <td className="px-3 py-2.5 text-right text-slate-300">
                                {item.unitPrice.toLocaleString("tr-TR")} ₺
                              </td>
                              <td className="px-3 py-2.5 text-right font-bold text-emerald-400">
                                {item.totalPrice.toLocaleString("tr-TR")} ₺
                              </td>
                              <td className="px-3 py-2.5 text-slate-500 text-[10px] truncate max-w-[120px]">
                                {item.bimElementId}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-800 bg-slate-950 flex items-center justify-between">
              <p className="text-xs text-slate-500">
                {parseResult
                  ? `Hazır: ${parseResult.items.length} kalem BoQItem tablosuna kaydedilecek.`
                  : "IFC dosyasını seçip metrajı çıkarın."}
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(false)
                    setParseResult(null)
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
                >
                  İptal
                </button>
                {parseResult && (
                  <button
                    type="button"
                    disabled={isSaving}
                    onClick={handleSaveToBoq}
                    className="px-5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/30 flex items-center gap-2 disabled:opacity-50 transition cursor-pointer"
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>BoQ Tablosuna Kaydediliyor...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-emerald-200" />
                        <span>BoQ Tablosuna Aktar ve Kaydet 🚀</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
