"use client"

/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * BoQ Akıllı Tablo (Smart DataGrid)
 * - ADIM 1: IFC Modelinden Otomatik Metraj Çıkarma (BIM Entegrasyonu)
 * - ADIM 2: Bütçe Sapma (Over-budget) Uyarı Arayüzü (%90 Sarı Uyarı, %100 Kırmızı Titreşimli Kritik Risk)
 * - ADIM 2: "Bütçe Sağlığı" (Budget Health) Genel Özet Kartı (Keşif Bedeli vs Harcamalar)
 * - ADIM 3: "Finans & Hakedişler" Sekmesi & "Kasım 2026 Hakedişini Hazırla" Fatura/Fiş Arayüzü
 */

import React, { useState, useMemo } from "react"
import {
  Eye,
  Box,
  Search,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Sparkles,
  X,
  ExternalLink,
  Layers,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Receipt,
  Printer,
  Calendar,
  Building2,
  FileText,
  ShieldAlert,
  ShieldCheck,
  Percent,
  ChevronRight,
  Download,
  Loader2,
} from "lucide-react"
import { bimStore } from "@/lib/bimStore"
import { toast } from "react-hot-toast"
import dynamic from "next/dynamic"
import IfcBoqExtractorModal from "./IfcBoqExtractorModal"
import { generateSubcontractorPayment, GeneratePaymentResult } from "@/app/actions/finance"

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

// Varsayılan Demo Verileri (Veritabanı boş veya çevrimdışıyken test için)
export const DEFAULT_DEMO_ITEMS: BoQTableItem[] = [
  {
    id: "boq-col-1",
    pozNo: "15.120.1001",
    itemCode: "15.120.1001",
    description: "C30/37 Kolon Betonu Dökülmesi (Transmikser ve Pompa ile)",
    unit: "m³",
    plannedQuantity: 1540,
    completedQuantity: 1680, // %109.1 -> KRİTİK SAPMA (Kırmızı Titreşimli)
    unitPrice: 2850,
    totalPrice: 4389000,
    bimElementId: "IfcColumn-C30-S1",
  },
  {
    id: "boq-wall-2",
    pozNo: "15.310.1002",
    itemCode: "15.310.1002",
    description: "20 cm Gazbeton Dış & Bölme Duvar Örülmesi",
    unit: "m²",
    plannedQuantity: 950,
    completedQuantity: 880, // %92.6 -> UYARI (Sarı)
    unitPrice: 650,
    totalPrice: 617500,
    bimElementId: "IfcWallStandardCase-W20",
  },
  {
    id: "boq-slab-3",
    pozNo: "15.160.1005",
    itemCode: "15.160.1005",
    description: "C30 Kat Döşeme Betonu ve Helikopterli Perdah",
    unit: "m³",
    plannedQuantity: 1200,
    completedQuantity: 650, // %54.2 -> Bütçe İçi (Yeşil)
    unitPrice: 2600,
    totalPrice: 3120000,
    bimElementId: "IfcSlab-FL1",
  },
  {
    id: "boq-rebar-4",
    pozNo: "15.140.1001",
    itemCode: "15.140.1001",
    description: "B420C Nervürlü Donatı Çeliği Temini ve İşçiliği",
    unit: "Ton",
    plannedQuantity: 65,
    completedQuantity: 28, // %43.1 -> Bütçe İçi
    unitPrice: 32500,
    totalPrice: 2112500,
    bimElementId: "IfcBeam-Rebar",
  },
]

interface BoQTableClientProps {
  items: BoQTableItem[]
  projectId?: string
}

export default function BoQTableClient({ items: initialItems, projectId }: BoQTableClientProps) {
  // Tab State: "boq" (Keşif Cetveli) | "finance" (Finans & Hakedişler)
  const [activeTab, setActiveTab] = useState<"boq" | "finance">("boq")

  // Yerel Liste Durumu (IFC'den eklenen kalemleri anında sayfada göstermek için)
  const [items, setItems] = useState<BoQTableItem[]>(() => {
    return initialItems && initialItems.length > 0 ? initialItems : DEFAULT_DEMO_ITEMS
  })

  const [search, setSearch] = useState("")
  const [activeBimModalItem, setActiveBimModalItem] = useState<BoQTableItem | null>(null)

  // Hakediş State'i
  const [isGeneratingPayment, setIsGeneratingPayment] = useState(false)
  const [paymentResult, setPaymentResult] = useState<GeneratePaymentResult | null>(null)

  // Filtreleme
  const filteredItems = useMemo(() => {
    const q = search.toLowerCase()
    return items.filter((item) => {
      const poz = (item.pozNo || item.itemCode || "").toLowerCase()
      const desc = (item.description || "").toLowerCase()
      const bimId = (item.bimElementId || "").toLowerCase()
      return poz.includes(q) || desc.includes(q) || bimId.includes(q)
    })
  }, [items, search])

  // ==========================================================================
  // ADIM 2: Bütçe Sağlığı (Budget Health) Hesaplamaları
  // ==========================================================================
  const budgetHealth = useMemo(() => {
    let totalPlannedAmount = 0
    let totalActualSpending = 0
    let overBudgetCount = 0
    let warningCount = 0

    items.forEach((item) => {
      const planned = item.plannedQuantity || item.contractQuantity || 0
      const completed = item.completedQuantity || 0
      const price = item.unitPrice || 0

      const plannedRow = planned * price
      const actualRow = completed * price

      totalPlannedAmount += plannedRow
      totalActualSpending += actualRow

      if (planned > 0) {
        if (completed > planned) {
          overBudgetCount++
        } else if (completed >= planned * 0.9) {
          warningCount++
        }
      }
    })

    const spendingRatio =
      totalPlannedAmount > 0
        ? Number(((totalActualSpending / totalPlannedAmount) * 100).toFixed(1))
        : 0

    const variance = totalActualSpending - totalPlannedAmount
    const isOverBudget = variance > 0 || overBudgetCount > 0
    const isWarning = !isOverBudget && (spendingRatio >= 90 || warningCount > 0)

    return {
      totalPlannedAmount,
      totalActualSpending,
      variance,
      spendingRatio,
      overBudgetCount,
      warningCount,
      isOverBudget,
      isWarning,
    }
  }, [items])

  // ADIM 1: IFC'den Yeni Kalemler İçe Aktarıldığında
  const handleIfcImported = (newItems: any[]) => {
    const mapped: BoQTableItem[] = newItems.map((n) => ({
      id: n.id,
      pozNo: n.pozNo,
      itemCode: n.pozNo,
      description: n.description,
      unit: n.unit,
      plannedQuantity: n.plannedQuantity,
      completedQuantity: 0,
      unitPrice: n.unitPrice,
      totalPrice: n.totalPrice,
      bimElementId: n.bimElementId,
    }))
    setItems((prev) => [...mapped, ...prev])
  }

  // 3D BIM Odaklanma
  const handleShowInBim = (item: BoQTableItem) => {
    const targetElementId =
      item.bimElementId?.trim() ||
      `COL-${(item.pozNo || item.itemCode || "11").replace(/[^a-zA-Z0-9]/g, "").slice(-4)}`

    bimStore.setSelectedElementId(targetElementId, {
      name: item.description,
      category: "STATIK",
      color: "#ef4444",
    })

    toast.success(
      `BIM Elemanı [${targetElementId}] 3D modelde kırmızı renkle vurgulandı 🎯`,
      { icon: "👁️", duration: 4000 }
    )
    setActiveBimModalItem(item)
  }

  // ==========================================================================
  // ADIM 3: "Kasım 2026 Hakedişini Hazırla" Tetikleyici
  // ==========================================================================
  const handleGeneratePayment = async () => {
    try {
      setIsGeneratingPayment(true)
      const targetProjectId = projectId || items[0]?.projectId || "proj-nexa-001"
      const targetSubcontractorId = "subcontractor-kaya-01"

      const res = await generateSubcontractorPayment(
        targetProjectId,
        targetSubcontractorId,
        "2026-11"
      )

      if (res.success) {
        setPaymentResult(res)
        toast.success(res.message || "Kasım 2026 Hakediş Fişi başarıyla hazırlandı! 🎉", {
          duration: 5000,
        })
      } else {
        toast.error(res.error || "Hakediş hesaplanırken hata oluştu.")
      }
    } catch (err: any) {
      toast.error(err?.message || "Hakediş işlemi sırasında hata oluştu.")
    } finally {
      setIsGeneratingPayment(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* ==================================================================== */}
      {/* ADIM 2: "BÜTÇE SAĞLIĞI" (BUDGET HEALTH) GENEL ÖZET KARTI             */}
      {/* ==================================================================== */}
      <div
        className={`relative overflow-hidden rounded-2xl border p-5 transition-all shadow-lg ${
          budgetHealth.isOverBudget
            ? "bg-gradient-to-br from-rose-950/40 via-slate-900 to-slate-950 border-rose-500/50 shadow-rose-950/30"
            : budgetHealth.isWarning
            ? "bg-gradient-to-br from-amber-950/40 via-slate-900 to-slate-950 border-amber-500/50 shadow-amber-950/30"
            : "bg-gradient-to-br from-emerald-950/30 via-slate-900 to-slate-950 border-emerald-500/40 shadow-emerald-950/20"
        }`}
      >
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          {/* Sol Kolon: Başlık ve Metrikler */}
          <div className="space-y-3 flex-1">
            <div className="flex flex-wrap items-center gap-2.5">
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                  budgetHealth.isOverBudget
                    ? "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                    : budgetHealth.isWarning
                    ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                    : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                }`}
              >
                {budgetHealth.isOverBudget ? (
                  <ShieldAlert className="w-5 h-5 animate-pulse text-rose-400" />
                ) : (
                  <ShieldCheck className="w-5 h-5" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-white tracking-wide">
                    Bütçe Sağlığı (Budget Health)
                  </h2>
                  {/* Durum Rozeti */}
                  {budgetHealth.isOverBudget ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-500/20 text-rose-300 border border-rose-500/50 animate-pulse">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      🚨 KRİTİK SAPMA (Over-budget)
                    </span>
                  ) : budgetHealth.isWarning ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/50">
                      <AlertCircle className="w-3.5 h-3.5" />
                      ⚠️ DİKKAT (%90+ Bütçe Sınırında)
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      ✅ SAĞLIKLI BÜTÇE
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Projenin Toplam Keşif Bedeli vs Sahada Gerçekleşen Harcamalar Analizi
                </p>
              </div>
            </div>

            {/* Metrik Kutuları */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-1">
              <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3">
                <span className="text-[11px] text-slate-400">Toplam Keşif Bedeli</span>
                <p className="text-base sm:text-lg font-bold text-white font-mono mt-0.5">
                  {budgetHealth.totalPlannedAmount.toLocaleString("tr-TR", {
                    minimumFractionDigits: 2,
                  })}{" "}
                  ₺
                </p>
              </div>
              <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3">
                <span className="text-[11px] text-slate-400">Sahada Gerçekleşen (Harcama)</span>
                <p
                  className={`text-base sm:text-lg font-bold font-mono mt-0.5 ${
                    budgetHealth.isOverBudget
                      ? "text-rose-400"
                      : budgetHealth.isWarning
                      ? "text-amber-400"
                      : "text-emerald-400"
                  }`}
                >
                  {budgetHealth.totalActualSpending.toLocaleString("tr-TR", {
                    minimumFractionDigits: 2,
                  })}{" "}
                  ₺
                </p>
              </div>
              <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 col-span-2 sm:col-span-1">
                <span className="text-[11px] text-slate-400">
                  {budgetHealth.variance > 0 ? "Bütçe Aşım Sapması" : "Kalan Keşif Bütçesi"}
                </span>
                <p
                  className={`text-base sm:text-lg font-bold font-mono mt-0.5 flex items-center gap-1 ${
                    budgetHealth.variance > 0 ? "text-rose-400" : "text-emerald-400"
                  }`}
                >
                  {budgetHealth.variance > 0 ? (
                    <TrendingUp className="w-4 h-4 text-rose-400 flex-shrink-0" />
                  ) : (
                    <TrendingDown className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  )}
                  {Math.abs(budgetHealth.variance).toLocaleString("tr-TR", {
                    minimumFractionDigits: 2,
                  })}{" "}
                  ₺
                </p>
              </div>
            </div>
          </div>

          {/* Sağ Kolon: İlerleme Çubuğu & Uyarı Bildirimleri */}
          <div className="w-full lg:w-72 bg-slate-950/80 border border-slate-800/80 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">Bütçe Tüketim Oranı</span>
              <span
                className={`font-mono font-bold text-sm ${
                  budgetHealth.spendingRatio > 100
                    ? "text-rose-400"
                    : budgetHealth.spendingRatio >= 90
                    ? "text-amber-400"
                    : "text-emerald-400"
                }`}
              >
                %{budgetHealth.spendingRatio}
              </span>
            </div>

            {/* Gauge Progress Bar */}
            <div className="w-full bg-slate-800/90 rounded-full h-3 overflow-hidden border border-slate-700/50">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  budgetHealth.spendingRatio > 100
                    ? "bg-gradient-to-r from-amber-500 via-rose-500 to-rose-600 animate-pulse"
                    : budgetHealth.spendingRatio >= 90
                    ? "bg-gradient-to-r from-blue-500 to-amber-400"
                    : "bg-gradient-to-r from-blue-500 to-emerald-400"
                }`}
                style={{ width: `${Math.min(100, Math.max(0, budgetHealth.spendingRatio))}%` }}
              />
            </div>

            {/* Kalem Bazlı Uyarı Özeti */}
            <div className="text-[11px] space-y-1 font-sans">
              {budgetHealth.overBudgetCount > 0 ? (
                <div className="flex items-center gap-1.5 text-rose-400 font-semibold">
                  <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>{budgetHealth.overBudgetCount} kalemde %100 bütçe aşımı tespit edildi!</span>
                </div>
              ) : null}
              {budgetHealth.warningCount > 0 ? (
                <div className="flex items-center gap-1.5 text-amber-400">
                  <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>{budgetHealth.warningCount} kalem %90 kritik sınırına ulaştı.</span>
                </div>
              ) : null}
              {budgetHealth.overBudgetCount === 0 && budgetHealth.warningCount === 0 ? (
                <div className="flex items-center gap-1.5 text-emerald-400">
                  <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>Tüm kalemler planlanan keşif sınırları dahilindedir.</span>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* SEKMELER (TABS) & ÜST BUTONLAR                                      */}
      {/* ==================================================================== */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        {/* Sekme Butonları */}
        <div className="flex items-center gap-2 bg-slate-900 p-1 rounded-xl border border-slate-800">
          <button
            type="button"
            onClick={() => setActiveTab("boq")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === "boq"
                ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
                : "text-slate-400 hover:text-white hover:bg-slate-800"
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>📋 Keşif & Metraj Cetveli (BoQ)</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("finance")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === "finance"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                : "text-slate-400 hover:text-white hover:bg-slate-800"
            }`}
          >
            <Receipt className="w-4 h-4" />
            <span>💰 Finans & Hakedişler</span>
            {paymentResult && (
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            )}
          </button>
        </div>

        {/* ADIM 1: "🏗️ IFC Modelinden Otomatik Metraj (BoQ) Çıkar" Butonu */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <IfcBoqExtractorModal
            projectId={projectId}
            onImportSuccess={handleIfcImported}
          />
        </div>
      </div>

      {/* ==================================================================== */}
      {/* SEKME 1: KEŞİF & METRAJ CETVELİ (DATA GRID)                         */}
      {/* ==================================================================== */}
      {activeTab === "boq" && (
        <div className="space-y-4 animate-in fade-in duration-200">
          {/* Arama & Bilgi Çubuğu */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Poz no, imalat tanımı veya BIM ID ara..."
                className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-400 font-mono">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block" />
                <span>%90+ Sarı Uyarı</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse inline-block" />
                <span>%100+ Kırmızı Aşım (Kritik)</span>
              </span>
            </div>
          </div>

          {/* Akıllı BoQ Tablosu */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-300">
                <thead className="bg-slate-950/90 border-b border-slate-800 text-xs uppercase font-semibold text-slate-400">
                  <tr>
                    <th className="px-4 py-3.5">Poz No</th>
                    <th className="px-4 py-3.5 min-w-[220px]">İş Kalemi / İmalat Tanımı</th>
                    <th className="px-4 py-3.5 text-center">Birim</th>
                    <th className="px-4 py-3.5 text-right">Planlanan Keşif</th>
                    {/* ADIM 2: Bütçe Sapma Hücresi Başlığı */}
                    <th className="px-4 py-3.5 text-right min-w-[150px]">
                      Tamamlanan (Miktar)
                    </th>
                    <th className="px-4 py-3.5 min-w-[170px]">Hakediş İlerlemesi</th>
                    <th className="px-4 py-3.5 text-right">Birim Fiyat</th>
                    <th className="px-4 py-3.5 text-right">Toplam Keşif Bedeli</th>
                    <th className="px-4 py-3.5 text-center">İşlem / 3D BIM</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono text-xs">
                  {filteredItems.map((item) => {
                    const planned = item.plannedQuantity || item.contractQuantity || 0
                    const completed = item.completedQuantity || 0
                    const progressPercent =
                      planned > 0 ? Math.round((completed / planned) * 100) : 0
                    const total =
                      item.totalPrice || item.totalAmount || planned * item.unitPrice

                    // ADIM 2 Mantığı:
                    // %100'ü geçtiyse Kırmızı (Kritik Risk - Titreşimli animate-pulse)
                    // %90'a ulaştıysa Sarı (Uyarı)
                    const isOverBudget = planned > 0 && completed > planned
                    const isWarning =
                      planned > 0 && !isOverBudget && completed >= planned * 0.9

                    return (
                      <tr
                        key={item.id}
                        className={`transition-colors ${
                          isOverBudget
                            ? "bg-rose-950/20 hover:bg-rose-950/30"
                            : isWarning
                            ? "bg-amber-950/15 hover:bg-amber-950/25"
                            : "hover:bg-slate-800/40"
                        }`}
                      >
                        <td className="px-4 py-3.5 font-semibold text-blue-400">
                          {item.pozNo || item.itemCode || "-"}
                        </td>
                        <td className="px-4 py-3.5 text-white font-sans text-sm">
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
                        <td className="px-4 py-3.5 text-center text-slate-400 font-sans">
                          {item.unit}
                        </td>
                        <td className="px-4 py-3.5 text-right text-slate-200">
                          {planned.toLocaleString("tr-TR")}
                        </td>

                        {/* ================================================== */}
                        {/* ADIM 2: MİKTAR HÜCRESİ (BÜTÇE SAPMA UYARI MANTIĞI) */}
                        {/* ================================================== */}
                        <td className="px-4 py-3.5 text-right">
                          {isOverBudget ? (
                            // %100'ü Geçtiyse: Kırmızı (Kritik Risk - Titreşimli)
                            <div
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-500/25 text-rose-300 border border-rose-500/70 font-bold animate-pulse shadow-[0_0_12px_rgba(244,63,94,0.4)]"
                              title="🚨 KRİTİK RİSK: Keşif miktarı %100 aşıldı! Bütçe fazlası imalat sapması tespit edildi."
                            >
                              <AlertTriangle className="w-3.5 h-3.5 text-rose-400 flex-shrink-0" />
                              <span>{completed.toLocaleString("tr-TR")}</span>
                              <span className="text-[10px] uppercase px-1 py-0.2 rounded bg-rose-600 text-white font-mono">
                                %{progressPercent} AŞIM
                              </span>
                            </div>
                          ) : isWarning ? (
                            // %90'a Ulaştıysa: Sarı (Uyarı)
                            <div
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/50 font-semibold shadow-sm"
                              title="⚠️ UYARI: Tamamlanan miktar planlanan keşif bütçesinin %90'ına ulaştı!"
                            >
                              <AlertCircle className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                              <span>{completed.toLocaleString("tr-TR")}</span>
                              <span className="text-[10px] uppercase px-1 py-0.2 rounded bg-amber-500/30 text-amber-200 font-mono">
                                %{progressPercent}
                              </span>
                            </div>
                          ) : (
                            // Normal Miktar (Bütçe İçi)
                            <span className="text-emerald-400 font-semibold">
                              {completed.toLocaleString("tr-TR")}
                            </span>
                          )}
                        </td>

                        {/* Hakediş İlerleme Çubuğu */}
                        <td className="px-4 py-3.5 font-sans">
                          <div className="space-y-1">
                            <div className="flex items-center justify-between text-[11px]">
                              <span
                                className={`font-bold font-mono ${
                                  isOverBudget
                                    ? "text-rose-400"
                                    : isWarning
                                    ? "text-amber-400"
                                    : progressPercent > 0
                                    ? "text-emerald-400"
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
                                  isOverBudget
                                    ? "bg-rose-500 animate-pulse"
                                    : isWarning
                                    ? "bg-amber-400"
                                    : progressPercent >= 50
                                    ? "bg-gradient-to-r from-blue-500 to-emerald-400"
                                    : "bg-blue-600"
                                }`}
                                style={{ width: `${Math.min(100, Math.max(0, progressPercent))}%` }}
                              />
                            </div>
                          </div>
                        </td>

                        <td className="px-4 py-3.5 text-right text-slate-200">
                          {item.unitPrice.toLocaleString("tr-TR", {
                            minimumFractionDigits: 2,
                          })}{" "}
                          ₺
                        </td>
                        <td className="px-4 py-3.5 text-right font-bold text-emerald-400">
                          {total.toLocaleString("tr-TR", {
                            minimumFractionDigits: 2,
                          })}{" "}
                          ₺
                        </td>

                        {/* 3D BIM Tetikleyici Buton */}
                        <td className="px-4 py-3.5 text-center">
                          <button
                            type="button"
                            onClick={() => handleShowInBim(item)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600/20 hover:bg-blue-600/35 border border-blue-500/40 hover:border-blue-500 text-blue-300 hover:text-white rounded-lg text-xs font-semibold transition-all cursor-pointer group"
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
        </div>
      )}

      {/* ==================================================================== */}
      {/* SEKME 2: ADIM 3 - FİNANS & TAŞERON HAKEDİŞLERİ                       */}
      {/* ==================================================================== */}
      {activeTab === "finance" && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Hakediş Oluşturma Aksiyon Kartı */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-indigo-400" />
                <h3 className="text-base font-bold text-white">
                  Otomatik Taşeron Hakediş Motoru (Progress Payment)
                </h3>
              </div>
              <p className="text-xs text-slate-400 max-w-xl">
                Sahadan girilen günlük jurnaller ve metraj verilerini BoQ birim fiyatlarıyla çarparak
                otonom hakediş hesaplar, %5 teminat kesintisi ve kusur cezalarını düşüp resmi fiş oluşturur.
              </p>
            </div>

            {/* ADIM 3: "Kasım 2026 Hakedişini Hazırla" Butonu */}
            <button
              type="button"
              disabled={isGeneratingPayment}
              onClick={handleGeneratePayment}
              className="inline-flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-indigo-600 via-blue-600 to-indigo-700 hover:from-indigo-500 hover:to-blue-500 text-white font-bold text-sm rounded-xl shadow-lg shadow-indigo-600/30 border border-indigo-400/40 active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50"
            >
              {isGeneratingPayment ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>Hakediş Hesaplanıyor...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>Kasım 2026 Hakedişini Hazırla</span>
                </>
              )}
            </button>
          </div>

          {/* ================================================================ */}
          {/* HAKEDİŞ FATURA / FİŞ ARAYÜZÜ (PDF Görünümlü HTML Tablo)           */}
          {/* ================================================================ */}
          {paymentResult ? (
            <div className="bg-slate-950 border border-slate-700/80 rounded-2xl p-6 sm:p-8 space-y-6 shadow-2xl relative">
              {/* Yazdır / PDF İndir Butonu */}
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div className="flex items-center gap-2">
                  <span className="text-xs uppercase font-mono px-2.5 py-1 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-bold">
                    RESMİ HAKEDİŞ FİŞİ (DRAFT)
                  </span>
                  <span className="text-xs text-slate-400 font-mono">
                    Belge No: HKD-2026-11-008
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-semibold rounded-xl transition cursor-pointer"
                >
                  <Printer className="w-4 h-4 text-blue-400" />
                  <span>Fişi Yazdır / PDF</span>
                </button>
              </div>

              {/* Fatura Başlık & Şirket Bilgileri */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 rounded-xl bg-slate-900/60 border border-slate-800">
                <div className="space-y-1.5">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                    Hakediş Sahibi (Taşeron Firma)
                  </span>
                  <h4 className="text-base font-bold text-white">
                    {paymentResult.payment?.subcontractor?.name ||
                      "Kaya Yapı & Betonarme Taşeron Ltd. Şti."}
                  </h4>
                  <p className="text-xs text-slate-300">
                    Yetkili:{" "}
                    {paymentResult.payment?.subcontractor?.contactName ||
                      "Ahmet Kaya (Saha Taşeron Temsilcisi)"}
                  </p>
                  <p className="text-xs text-slate-400 font-mono">
                    Vergi No:{" "}
                    {paymentResult.payment?.subcontractor?.taxNumber ||
                      "4820194812 / Kadıköy V.D."}
                  </p>
                </div>

                <div className="space-y-1.5 md:text-right">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                    Proje & Dönem Bilgisi
                  </span>
                  <h4 className="text-base font-bold text-blue-400">
                    {paymentResult.payment?.project?.name ||
                      "Nexa Plaza & Rezidans Şantiye Projesi"}
                  </h4>
                  <p className="text-xs text-slate-300">
                    Dönem: <span className="font-bold text-white">Kasım 2026 (2026-11)</span>
                  </p>
                  <p className="text-xs text-slate-400 font-mono">
                    Düzenleme Tarihi: 02.11.2026 • Durum: TASLAK (DRAFT)
                  </p>
                </div>
              </div>

              {/* Yapılan İş Kalemleri Tablosu */}
              <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-900/90">
                <div className="px-4 py-2.5 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                    <FileText className="w-4 h-4 text-indigo-400" />
                    <span>Yapılan İş Kalemleri & İmalat Metraj Dökümü</span>
                  </h4>
                  <span className="text-[11px] text-slate-400 font-mono">
                    {paymentResult.breakdownDetails?.length || 0} İmalat Kalemi
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs font-mono">
                    <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800">
                      <tr>
                        <th className="px-3.5 py-2.5">Poz No</th>
                        <th className="px-3.5 py-2.5">Yapılan İş Kalemi / İmalat Tanımı</th>
                        <th className="px-3.5 py-2.5 text-center">Birim</th>
                        <th className="px-3.5 py-2.5 text-right">Hakediş Metrajı</th>
                        <th className="px-3.5 py-2.5 text-right">Birim Fiyat</th>
                        <th className="px-3.5 py-2.5 text-right">İmalat Tutarı</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {paymentResult.breakdownDetails?.map((row, idx) => (
                        <tr key={idx} className="hover:bg-slate-800/40">
                          <td className="px-3.5 py-3 text-blue-400 font-bold">{row.pozNo}</td>
                          <td className="px-3.5 py-3 text-white font-sans text-xs">
                            {row.description}
                          </td>
                          <td className="px-3.5 py-3 text-center text-slate-400 font-sans">
                            {row.unit}
                          </td>
                          <td className="px-3.5 py-3 text-right font-bold text-emerald-400">
                            {row.quantity.toLocaleString("tr-TR")}
                          </td>
                          <td className="px-3.5 py-3 text-right text-slate-300">
                            {row.unitPrice.toLocaleString("tr-TR", { minimumFractionDigits: 2 })} ₺
                          </td>
                          <td className="px-3.5 py-3 text-right font-bold text-white">
                            {row.total.toLocaleString("tr-TR", { minimumFractionDigits: 2 })} ₺
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Finansal Kesintiler & Net Tutar Özeti (Fiş Altı) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 space-y-2 text-xs">
                  <span className="font-bold text-slate-300 flex items-center gap-1.5">
                    <ShieldAlert className="w-4 h-4 text-amber-400" />
                    <span>Hakediş Yasal & Sözleşmesel Kesintileri</span>
                  </span>
                  <p className="text-slate-400 leading-relaxed text-[11px]">
                    4857 Sayılı İş Kanunu ve Yapı İşleri Genel Şartnamesi uyarınca %5 Geçici Kabul
                    Teminatı ve BIM Kalite Güvence kusur cezaları brüt imalat tutarından mahsup edilmiştir.
                  </p>
                </div>

                <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 space-y-2.5 font-mono text-xs">
                  <div className="flex items-center justify-between text-slate-300">
                    <span>Toplam Brüt İmalat Tutarı:</span>
                    <span className="font-bold text-white">
                      {(paymentResult.totalAmount || 0).toLocaleString("tr-TR", {
                        minimumFractionDigits: 2,
                      })}{" "}
                      ₺
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-amber-400">
                    <span>%5 Geçici Kabul Teminat Kesintisi:</span>
                    <span>
                      -
                      {(
                        paymentResult.payment?.retentionAmount ||
                        (paymentResult.totalAmount || 0) * 0.05
                      ).toLocaleString("tr-TR", { minimumFractionDigits: 2 })}{" "}
                      ₺
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-rose-400">
                    <span>BIM Kusur & Ceza Kesintisi:</span>
                    <span>
                      -
                      {(paymentResult.payment?.penaltyDeduction || 15000).toLocaleString("tr-TR", {
                        minimumFractionDigits: 2,
                      })}{" "}
                      ₺
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-slate-400">
                    <span>Avans Mahsubu:</span>
                    <span>
                      -
                      {(paymentResult.payment?.advanceDeduction || 50000).toLocaleString("tr-TR", {
                        minimumFractionDigits: 2,
                      })}{" "}
                      ₺
                    </span>
                  </div>

                  {/* Toplam Kesinti ve Net Tutar */}
                  <div className="border-t border-slate-800 pt-2 flex items-center justify-between text-sm">
                    <span className="font-bold text-slate-300 font-sans">Toplam Kesinti:</span>
                    <span className="font-bold text-rose-400">
                      -
                      {(
                        (paymentResult.payment?.retentionAmount ||
                          (paymentResult.totalAmount || 0) * 0.05) +
                        (paymentResult.payment?.penaltyDeduction || 15000) +
                        (paymentResult.payment?.advanceDeduction || 50000)
                      ).toLocaleString("tr-TR", { minimumFractionDigits: 2 })}{" "}
                      ₺
                    </span>
                  </div>

                  <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-3 flex items-center justify-between text-base font-bold">
                    <span className="text-emerald-300 font-sans">NET ÖDENECEK TUTAR:</span>
                    <span className="text-emerald-400 text-lg">
                      {(
                        paymentResult.payment?.netPayableAmount ||
                        (paymentResult.totalAmount || 0) -
                          ((paymentResult.payment?.retentionAmount ||
                            (paymentResult.totalAmount || 0) * 0.05) +
                            (paymentResult.payment?.penaltyDeduction || 15000) +
                            (paymentResult.payment?.advanceDeduction || 50000))
                      ).toLocaleString("tr-TR", { minimumFractionDigits: 2 })}{" "}
                      ₺
                    </span>
                  </div>
                </div>
              </div>

              {/* İmza Blokları (Resmi Kaşe / Onay) */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6 border-t border-slate-800 text-center font-sans text-xs">
                <div className="p-3 border border-dashed border-slate-800 rounded-xl">
                  <p className="text-slate-400 text-[11px]">Hakedişi Düzenleyen</p>
                  <p className="font-bold text-white mt-1">Şantiye Şefi / Hakediş Müh.</p>
                  <p className="text-[10px] text-slate-500 mt-6">(İmza / Kaşe)</p>
                </div>
                <div className="p-3 border border-dashed border-slate-800 rounded-xl">
                  <p className="text-slate-400 text-[11px]">Kontrol & Kabul Eden</p>
                  <p className="font-bold text-white mt-1">Proje Müdürü / Saha Şefi</p>
                  <p className="text-[10px] text-slate-500 mt-6">(İmza / Kaşe)</p>
                </div>
                <div className="p-3 border border-dashed border-slate-800 rounded-xl">
                  <p className="text-slate-400 text-[11px]">Hakediş Sahibi</p>
                  <p className="font-bold text-white mt-1">Taşeron Firma Yetkilisi</p>
                  <p className="text-[10px] text-slate-500 mt-6">(İmza / Kaşe)</p>
                </div>
              </div>
            </div>
          ) : (
            // Henüz hakediş hesaplanmadığında gösterilen şık rehber ekranı
            <div className="flex flex-col items-center justify-center p-12 bg-slate-900/50 border border-slate-800 rounded-2xl text-center space-y-3">
              <Receipt className="w-12 h-12 text-indigo-400/60" />
              <h4 className="text-sm font-bold text-white">
                Kasım 2026 Dönemine Ait Taşeron Hakedişi Henüz Hazırlanmadı
              </h4>
              <p className="text-xs text-slate-400 max-w-md">
                Yukarıdaki &quot;Kasım 2026 Hakedişini Hazırla&quot; butonuna basarak sahadan girilen
                tüm jurnalleri toplayabilir, kesintileri hesaplayabilir ve resmi hakediş fişini
                otonom olarak görüntüleyebilirsiniz.
              </p>
              <button
                type="button"
                onClick={handleGeneratePayment}
                className="mt-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow transition cursor-pointer"
              >
                Hemen Hakedişi Hesapla
              </button>
            </div>
          )}
        </div>
      )}

      {/* ==================================================================== */}
      {/* 3D BIM MODEL CANLI ÖNİZLEME MODALI                                  */}
      {/* ==================================================================== */}
      {activeBimModalItem && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-5xl h-[85vh] flex flex-col shadow-2xl overflow-hidden relative">
            {/* Header */}
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
                    {activeBimModalItem.bimElementId || "Otomatik Eşleşen Statik Eleman"}
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

            {/* Viewer */}
            <div className="flex-1 w-full h-full relative bg-slate-950 overflow-hidden">
              <BimViewerWrapper projectName="Şantiye 3D Modeli" hideUpload={true} />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
