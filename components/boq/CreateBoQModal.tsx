"use client"

/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Keşif & Metraj (BoQ) Yeni Kalem Ekleme Modalı
 */

import React, { useState } from "react"
import { Plus, X, Calculator, FileSpreadsheet } from "lucide-react"
import toast from "react-hot-toast"
import { createBoQAction } from "@/app/actions/boq"

interface CreateBoQModalProps {
  buttonText?: string
  className?: string
  projectId?: string
  onSuccess?: () => void
}

export default function CreateBoQModal({
  buttonText = "+ Yeni Keşif Ekle",
  className = "",
  projectId,
  onSuccess,
}: CreateBoQModalProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const [formData, setFormData] = useState({
    pozNo: "",
    description: "",
    unit: "m²",
    contractQuantity: "",
    unitPrice: "",
    bimElementId: "",
  })

  // ADIM 2: Anlık JS Matematiği (Miktar * Fiyat)
  const quantityNum = parseFloat(formData.contractQuantity) || 0
  const unitPriceNum = parseFloat(formData.unitPrice) || 0
  const calculatedTotal = quantityNum * unitPriceNum

  const handleReset = () => {
    setFormData({
      pozNo: "",
      description: "",
      unit: "m²",
      contractQuantity: "",
      unitPrice: "",
      bimElementId: "",
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    // ADIM 4: Form gönderildiğinde console.log(formData) yap
    console.log("BoQ Form Data (onSubmit):", formData)

    if (!formData.pozNo.trim() || !formData.description.trim()) {
      toast.error("Lütfen Poz No ve İş Kalemi / Tanım alanlarını doldurunuz.")
      return
    }

    setSubmitting(true)
    try {
      // ADIM 4: BoQItem tablosuna createBoQAction server action'ı ile kaydet
      const res = await createBoQAction({
        pozNo: formData.pozNo.trim(),
        description: formData.description.trim(),
        unit: formData.unit,
        contractQuantity: parseFloat(formData.contractQuantity) || 0,
        unitPrice: parseFloat(formData.unitPrice) || 0,
        bimElementId: formData.bimElementId.trim() || undefined,
        projectId,
      })

      if (res.success) {
        toast.success("Keşif kalemi başarıyla eklendi!")
        handleReset()
        setIsOpen(false)
        onSuccess?.()
      } else {
        toast.error(res.error || "Keşif kalemi eklenirken hata oluştu.")
      }
    } catch (error) {
      console.error("createBoQAction hatası:", error)
      toast.error("İşlem sırasında bir hata oluştu.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      {/* UI: Eski sayfadaki statik butonun yerine tetikleyici buton */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className={
          className ||
          "px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2 font-medium transition-colors shadow-sm cursor-pointer"
        }
      >
        <Plus className="w-4 h-4" />
        <span>{buttonText}</span>
      </button>

      {/* Modal Dialog */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[99999] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-slate-900 rounded-2xl border border-slate-700/80 w-full max-w-lg max-h-[90vh] overflow-y-auto flex flex-col relative shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-slate-800 sticky top-0 bg-slate-900 z-20">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center">
                  <Calculator className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">
                    Yeni Keşif Kalemi Ekle
                  </h3>
                  <p className="text-xs text-slate-400">
                    BoQ metraj cetveline yeni imalat pozu tanımlayın
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body Form */}
            <form onSubmit={handleSubmit} className="flex-1 flex flex-col justify-between p-5">
              <div className="space-y-4">
                {/* 1. Poz No */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Poz No <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.pozNo}
                    onChange={(e) =>
                      setFormData({ ...formData, pozNo: e.target.value })
                    }
                    placeholder="Örn: 15.100.1001"
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-blue-500 transition-colors font-mono"
                    required
                  />
                </div>

                {/* 2. İş Kalemi / Tanım */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    İş Kalemi / Tanım <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    placeholder="Örn: C30 Hazır Beton Dökülmesi"
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-blue-500 transition-colors"
                    required
                  />
                </div>

                {/* 3. Birim (Select) */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Birim <span className="text-rose-400">*</span>
                  </label>
                  <select
                    value={formData.unit}
                    onChange={(e) =>
                      setFormData({ ...formData, unit: e.target.value })
                    }
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-blue-500 transition-colors font-medium cursor-pointer"
                    required
                  >
                    <option value="m²">m² (Metrekare)</option>
                    <option value="m³">m³ (Metreküp)</option>
                    <option value="kg">kg (Kilogram)</option>
                    <option value="Ton">Ton</option>
                    <option value="Adet">Adet</option>
                    <option value="mt">mt (Metretül)</option>
                    <option value="Takım">Takım</option>
                    <option value="Saat">Saat</option>
                    <option value="Gün">Gün</option>
                  </select>
                </div>

                {/* 4 & 5. Sözleşme Miktarı ve Birim Fiyat (2 Sütun) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Sözleşme Miktarı <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      value={formData.contractQuantity}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          contractQuantity: e.target.value,
                        })
                      }
                      placeholder="Örn: 1500"
                      className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-blue-500 transition-colors font-mono"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Birim Fiyat (₺) <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      value={formData.unitPrice}
                      onChange={(e) =>
                        setFormData({ ...formData, unitPrice: e.target.value })
                      }
                      placeholder="Örn: 2500"
                      className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-blue-500 transition-colors font-mono"
                      required
                    />
                  </div>
                </div>

                {/* Toplam Tutar Otomatik Hesaplama Önizleme Kartı (ADIM 2) */}
                <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 rounded-xl p-4 border border-emerald-500/30 flex items-center justify-between shadow-lg">
                  <div className="flex items-center gap-2.5 text-slate-300 text-xs">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
                      <FileSpreadsheet className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="font-semibold text-white block">Hesaplanan Toplam Maliyet:</span>
                      <span className="text-[11px] text-slate-400">
                        {quantityNum > 0 && unitPriceNum > 0
                          ? `${quantityNum.toLocaleString("tr-TR")} ${formData.unit} × ${unitPriceNum.toLocaleString("tr-TR")} ₺`
                          : "Miktar ve birim fiyat giriniz"}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-base font-black text-emerald-400 font-mono tracking-tight">
                      {calculatedTotal.toLocaleString("tr-TR", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}{" "}
                      ₺
                    </div>
                    <span className="text-[10px] text-emerald-500 font-semibold uppercase">Anlık Otomatik Hesaplama</span>
                  </div>
                </div>

                {/* 6. 3D BIM Eleman Eşleştirmesi (ADIM 3) */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
                    <span>3D BIM / IFC Eleman Eşleştirmesi (Opsiyonel)</span>
                    <span className="text-[10px] text-blue-400">IfcGuid / Model ID</span>
                  </label>
                  <input
                    type="text"
                    value={formData.bimElementId}
                    onChange={(e) =>
                      setFormData({ ...formData, bimElementId: e.target.value })
                    }
                    placeholder="Örn: COL-K-11-FL1 veya IfcWallStandardCase GUID"
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-blue-500 transition-colors font-mono text-xs"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">
                    Bu poz 3D BIM modelindeki bir kolon, kiriş veya duvara bağlanır ve modelde kırmızı renkle vurgulanır.
                  </p>
                </div>
              </div>

              {/* Alt Kısım: İptal ve Kaydet (Submit) Butonları */}
              <div className="sticky bottom-0 bg-slate-900/95 backdrop-blur-md pt-4 mt-6 border-t border-slate-800 flex gap-3 z-20">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="flex-1 px-4 py-2.5 bg-slate-800 text-slate-300 font-medium rounded-xl hover:bg-slate-700 hover:text-white transition-colors text-sm"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-4 py-2.5 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-blue-900/30 text-sm"
                >
                  {submitting ? "Kaydediliyor..." : "Kaydet"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
