"use client"

/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * BoQ Akıllı Tablo (Smart DataGrid) with Live Progress Bar & 3D BIM Trigger
 */

import React, { useState } from "react"
import { Eye, Box, Search, CheckCircle2, Sparkles, X, ExternalLink, Layers } from "lucide-react"
import { bimStore } from "@/lib/bimStore"
import { toast } from "react-hot-toast"
import dynamic from "next/dynamic"

// Dinamik 3D BIM Modal Önizleme Bileşeni
const BimViewerWrapper = dynamic<any>(() => import("@/components/bim/BimViewerWrapper"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-96 bg-slate-950 rounded-xl flex items-center justify-center text-slate-400 text-xs">
      3D BIM Motoru Yükleniyor...
    </div>
  ),
})

export interface BoQTableItem {
  id: string
  pozNo?: string | null
  itemCode?: string | null
  description: string
  unit: string
  plannedQuantity?: number | null
  contractQuantity?: number | null
  completedQuantity?: number | null
  unitPrice: number
  totalPrice?: number | null
  totalAmount?: number | null
  bimElementId?: string | null
  projectId?: string | null
  createdAt?: any
}

interface BoQTableClientProps {
  items: BoQTableItem[]
}

export default function BoQTableClient({ items }: BoQTableClientProps) {
  const [search, setSearch] = useState("")
  const [activeBimModalItem, setActiveBimModalItem] = useState<BoQTableItem | null>(null)

  const filteredItems = items.filter((item) => {
    const q = search.toLowerCase()
    const poz = (item.pozNo || item.itemCode || "").toLowerCase()
    const desc = (item.description || "").toLowerCase()
    const bimId = (item.bimElementId || "").toLowerCase()
    return poz.includes(q) || desc.includes(q) || bimId.includes(q)
  })

  // ADIM 3: 3D BIM Entegrasyonu (IFC Tetikleyicisi)
  const handleShowInBim = (item: BoQTableItem) => {
    const targetElementId =
      item.bimElementId?.trim() ||
      `COL-${(item.pozNo || item.itemCode || "11").replace(/[^a-zA-Z0-9]/g, "").slice(-4)}`

    // 1. Global BIM State'e selectedElementId olarak gönder (Zustand/Sync Store)
    bimStore.setSelectedElementId(targetElementId, {
      name: item.description,
      category: "STATIK",
      color: "#ef4444", // Kırmızı vurgu
    })

    toast.success(
      `BIM Elemanı [${targetElementId}] seçildi! 3D modelde kırmızı renkle vurgulanıyor 🎯`,
      {
        icon: "👁️",
        duration: 4000,
      }
    )

    // 2. Kullanıcıya hızlı önizleme için 3D modal penceresini aç
    setActiveBimModalItem(item)
  }

  return (
    <div className="space-y-4">
      {/* Arama & Filtreleme Çubuğu */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Poz no, iş tanımı veya BIM ID ile filtrele..."
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
          />
        </div>
        <div className="text-xs text-slate-400 font-mono">
          Gösterilen: <span className="text-white font-bold">{filteredItems.length}</span> / {items.length} Kalem
        </div>
      </div>

      {/* Akıllı BoQ Tablosu */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-950/80 border-b border-slate-800 text-xs uppercase font-semibold text-slate-400">
              <tr>
                <th className="px-4 py-3">Poz No</th>
                <th className="px-4 py-3">İş Kalemi / Tanım</th>
                <th className="px-4 py-3">Birim</th>
                <th className="px-4 py-3 text-right">Planlanan Miktar</th>
                <th className="px-4 py-3 text-right">Tamamlanan</th>
                {/* ADIM 2: Hakediş İlerleme Çubuğu Başlığı */}
                <th className="px-4 py-3 min-w-[160px]">Hakediş İlerlemesi</th>
                <th className="px-4 py-3 text-right">Birim Fiyat</th>
                <th className="px-4 py-3 text-right">Toplam Tutar</th>
                {/* ADIM 3: 3D BIM Tetikleyici Buton Başlığı */}
                <th className="px-4 py-3 text-center">İşlem / 3D BIM</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono text-xs">
              {filteredItems.map((item) => {
                const planned = item.plannedQuantity || item.contractQuantity || 0
                const completed = item.completedQuantity || 0
                // ADIM 2: (completedQuantity / plannedQuantity) * 100
                const progressPercent =
                  planned > 0
                    ? Math.min(100, Math.round((completed / planned) * 100))
                    : 0
                const total =
                  item.totalPrice || item.totalAmount || planned * item.unitPrice

                return (
                  <tr
                    key={item.id}
                    className="hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="px-4 py-3 font-semibold text-blue-400">
                      {item.pozNo || item.itemCode || "-"}
                    </td>
                    <td className="px-4 py-3 text-white font-sans text-sm">
                      <div className="flex items-center gap-2">
                        <span>{item.description}</span>
                        {item.bimElementId && (
                          <span
                            className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 font-mono flex items-center gap-1"
                            title={`BIM Element ID: ${item.bimElementId}`}
                          >
                            <Box className="w-3 h-3" />
                            {item.bimElementId}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-400 font-sans">
                      {item.unit}
                    </td>
                    <td className="px-4 py-3 text-right text-slate-200">
                      {planned.toLocaleString("tr-TR")}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="text-emerald-400 font-semibold">
                        {completed.toLocaleString("tr-TR")}
                      </span>
                    </td>

                    {/* ADIM 2: Hakediş İlerleme Çubuğu (Progress Bar) */}
                    <td className="px-4 py-3 font-sans">
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-[11px]">
                          <span
                            className={`font-bold font-mono ${
                              progressPercent >= 100
                                ? "text-emerald-400"
                                : progressPercent > 0
                                ? "text-blue-400"
                                : "text-slate-500"
                            }`}
                          >
                            %{progressPercent}
                          </span>
                          <span className="text-slate-500 text-[10px]">
                            {completed.toLocaleString("tr-TR")} / {planned.toLocaleString("tr-TR")} {item.unit}
                          </span>
                        </div>
                        <div className="w-full bg-slate-800/90 rounded-full h-2 overflow-hidden border border-slate-700/50">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              progressPercent >= 100
                                ? "bg-gradient-to-r from-emerald-500 to-teal-400"
                                : progressPercent >= 50
                                ? "bg-gradient-to-r from-blue-500 to-emerald-400"
                                : progressPercent > 0
                                ? "bg-gradient-to-r from-blue-600 to-indigo-500"
                                : "bg-slate-700"
                            }`}
                            style={{ width: `${Math.max(progressPercent, 0)}%` }}
                          />
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-3 text-right text-slate-200">
                      {item.unitPrice.toLocaleString("tr-TR", {
                        minimumFractionDigits: 2,
                      })}{" "}
                      ₺
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-emerald-400">
                      {total.toLocaleString("tr-TR", {
                        minimumFractionDigits: 2,
                      })}{" "}
                      ₺
                    </td>

                    {/* ADIM 3: 3D BIM Entegrasyonu Butonu (BIM'de Göster 👁️) */}
                    <td className="px-4 py-3 text-center">
                      <button
                        type="button"
                        onClick={() => handleShowInBim(item)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-blue-600/20 hover:from-blue-600/30 to-indigo-600/20 hover:to-indigo-600/30 border border-blue-500/40 hover:border-blue-500/70 text-blue-300 hover:text-white rounded-lg text-xs font-semibold transition-all shadow-sm cursor-pointer group"
                        title="3D BIM IFC modelinde bu elemanı kırmızıya boya ve odaklan"
                      >
                        <Eye className="w-3.5 h-3.5 text-blue-400 group-hover:scale-110 transition-transform" />
                        <span>BIM&apos;de Göster 👁️</span>
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ADIM 3: 3D BIM Canlı Önizleme Modalı */}
      {activeBimModalItem && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-5xl h-[85vh] flex flex-col shadow-2xl overflow-hidden relative">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-950">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 flex items-center justify-center">
                  <Box className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-white">
                      3D BIM Entegrasyonu: {activeBimModalItem.description}
                    </h3>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-500/20 text-red-300 border border-red-500/30">
                      Kırmızı Vurgulandı 🔴
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 font-mono">
                    Poz: {activeBimModalItem.pozNo || activeBimModalItem.itemCode} • Eleman ID:{" "}
                    {activeBimModalItem.bimElementId || "Otomatik Eşleşen Statik Kolon"}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  bimStore.clearSelection()
                  setActiveBimModalItem(null)
                }}
                className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body - 3D BIM Viewer */}
            <div className="flex-1 w-full h-full relative bg-slate-950 overflow-hidden">
              <BimViewerWrapper
                projectName="Şantiye 3D Modeli"
                hideUpload={true}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
