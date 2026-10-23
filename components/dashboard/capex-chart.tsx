"use client"
/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * CAPEX m² Analitiği Widget'ı (Cost Per Sqm Finans Grafiği)
 */

import { useState } from "react"
import {
  TrendingUp,
  DollarSign,
  Building2,
  Calculator,
  ArrowUpRight,
  Info,
  Maximize2,
  BarChart3,
} from "lucide-react"

export interface CapexProjectItem {
  id: string
  name: string
  city: string | null
  grossAreaSqm?: number | null
  totalCapex?: number | null
  storeTemplate?: {
    name: string
  } | null
}

export default function CapexChartWidget({ projects }: { projects: CapexProjectItem[] }) {
  const [activeGroupBy, setActiveGroupBy] = useState<"TEMPLATE" | "CITY">("TEMPLATE")

  // Calculate project metrics: cost per sqm = totalCapex / grossAreaSqm
  const validProjects = projects.filter(
    (p) => (p.grossAreaSqm || 0) > 0 && (p.totalCapex || 0) > 0
  )

  const totalPortfolioCapex = validProjects.reduce((sum, p) => sum + (p.totalCapex || 0), 0)
  const totalPortfolioSqm = validProjects.reduce((sum, p) => sum + (p.grossAreaSqm || 0), 0)
  const averageCostPerSqm =
    totalPortfolioSqm > 0 ? Math.round(totalPortfolioCapex / totalPortfolioSqm) : 0

  // Group by template or city
  const groupedData: Record<string, { label: string; totalCapex: number; totalSqm: number; storeCount: number }> = {}

  validProjects.forEach((p) => {
    let key = "Standart Konsept"
    if (activeGroupBy === "TEMPLATE") {
      key = p.storeTemplate?.name ? p.storeTemplate.name.split("-")[0].trim() : "Genel Konsept"
    } else {
      key = p.city || "Diğer Şehirler"
    }

    if (!groupedData[key]) {
      groupedData[key] = { label: key, totalCapex: 0, totalSqm: 0, storeCount: 0 }
    }
    groupedData[key].totalCapex += p.totalCapex || 0
    groupedData[key].totalSqm += p.grossAreaSqm || 0
    groupedData[key].storeCount += 1
  })

  const chartItems = Object.values(groupedData).map((g) => {
    const costPerSqm = g.totalSqm > 0 ? Math.round(g.totalCapex / g.totalSqm) : 0
    return {
      ...g,
      costPerSqm,
    }
  })

  // Max value for bar scaling
  const maxCostPerSqm = Math.max(...chartItems.map((c) => c.costPerSqm), 25000)
  const targetBenchmark = 15000 // 15.000 TL/m2 kurumsal hedef

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-5">
      {/* Widget Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-emerald-400 mb-0.5">
            <Calculator className="w-4 h-4" />
            <span>CAPEX & m² Maliyet Analitiği</span>
          </div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            m² Başına Ortalama Kurulum Maliyeti (Cost per Sqm)
          </h3>
          <p className="text-xs text-slate-400">
            Gerçekleşen toplam hakediş ödemeleri ile mağaza metrekarelerinin analitik korelasyonu.
          </p>
        </div>

        {/* Grouping Switcher */}
        <div className="flex items-center p-1 bg-slate-950 border border-slate-800 rounded-lg text-xs self-start sm:self-center">
          <button
            onClick={() => setActiveGroupBy("TEMPLATE")}
            className={`px-3 py-1 rounded-md font-medium transition-colors ${
              activeGroupBy === "TEMPLATE" ? "bg-blue-600 text-white" : "text-slate-400 hover:text-white"
            }`}
          >
            Konsept Bazında
          </button>
          <button
            onClick={() => setActiveGroupBy("CITY")}
            className={`px-3 py-1 rounded-md font-medium transition-colors ${
              activeGroupBy === "CITY" ? "bg-blue-600 text-white" : "text-slate-400 hover:text-white"
            }`}
          >
            Şehir Bazında
          </button>
        </div>
      </div>

      {/* Top Portfolio Summary Numbers */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
        <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl">
          <span className="text-slate-400">Ortalama Portföy Maliyeti</span>
          <div className="text-lg font-bold text-emerald-400 mt-1 font-mono">
            {averageCostPerSqm.toLocaleString("tr-TR")} ₺ / m²
          </div>
          <span className="text-[10px] text-slate-500 mt-0.5 block">Hedef: 15.000 ₺/m²</span>
        </div>

        <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl">
          <span className="text-slate-400">Toplam Yatırım (Total CAPEX)</span>
          <div className="text-lg font-bold text-white mt-1 font-mono">
            {totalPortfolioCapex.toLocaleString("tr-TR")} ₺
          </div>
          <span className="text-[10px] text-slate-500 mt-0.5 block">{validProjects.length} Aktif Mağaza</span>
        </div>

        <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl">
          <span className="text-slate-400">Toplam Kurulum Alanı</span>
          <div className="text-lg font-bold text-blue-400 mt-1 font-mono">
            {totalPortfolioSqm.toLocaleString("tr-TR")} m²
          </div>
          <span className="text-[10px] text-slate-500 mt-0.5 block">Brüt Mağaza Alanı</span>
        </div>
      </div>

      {/* Interactive Bar Chart */}
      <div className="space-y-3.5 pt-2">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span className="font-semibold uppercase tracking-wider text-[11px]">
            {activeGroupBy === "TEMPLATE" ? "Tip Mağaza Konsepti" : "Lokasyon / Şehir"}
          </span>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 text-blue-400 text-[11px]">
              <span className="w-2.5 h-2.5 rounded bg-blue-500"></span> m² Kurulum Maliyeti (₺)
            </span>
            <span className="flex items-center gap-1.5 text-emerald-400 text-[11px]">
              <span className="w-2 h-0.5 bg-emerald-400"></span> Benchmark Hedefi (15k ₺)
            </span>
          </div>
        </div>

        <div className="space-y-3">
          {chartItems.map((item) => {
            const barWidthPercent = Math.min(100, Math.round((item.costPerSqm / maxCostPerSqm) * 100))
            const isAboveBenchmark = item.costPerSqm > targetBenchmark

            return (
              <div key={item.label} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white">{item.label}</span>
                    <span className="text-[10px] text-slate-400">
                      ({item.storeCount} Mağaza • {item.totalSqm} m²)
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-slate-200">
                      {item.costPerSqm.toLocaleString("tr-TR")} ₺/m²
                    </span>
                    {isAboveBenchmark ? (
                      <span className="text-[10px] text-amber-400 font-medium">
                        (+{Math.round(((item.costPerSqm - targetBenchmark) / targetBenchmark) * 100)}%)
                      </span>
                    ) : (
                      <span className="text-[10px] text-emerald-400 font-medium">Hedef İçi</span>
                    )}
                  </div>
                </div>

                {/* Bar Track */}
                <div className="h-4 w-full bg-slate-950 rounded-lg overflow-hidden border border-slate-800 relative flex items-center">
                  {/* Benchmark Indicator Line */}
                  <div
                    className="absolute top-0 bottom-0 w-0.5 bg-emerald-500/70 z-10"
                    style={{ left: `${Math.round((targetBenchmark / maxCostPerSqm) * 100)}%` }}
                    title="Kurumsal Hedef: 15.000 ₺/m²"
                  ></div>

                  {/* Dynamic Progress Bar */}
                  <div
                    className={`h-full rounded-lg transition-all duration-700 ${
                      isAboveBenchmark
                        ? "bg-gradient-to-r from-blue-600 to-indigo-500"
                        : "bg-gradient-to-r from-emerald-600 to-blue-500"
                    }`}
                    style={{ width: `${barWidthPercent}%` }}
                  ></div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
