"use client"
/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Aktif DRIVER (Şoför) Kapasite Analizi Bileşeni
 */

import React from "react"
import { Truck, CheckCircle2, AlertTriangle, Users } from "lucide-react"

export interface DriverCapacityItem {
  id: string
  name: string
  deliveryCount: number
  capacityPercent: number
  capacityText: string
  currentSite?: string | null
}

interface DriverCapacityWidgetProps {
  drivers: DriverCapacityItem[]
}

export default function DriverCapacityWidget({ drivers }: DriverCapacityWidgetProps) {
  if (!drivers || drivers.length === 0) {
    return (
      <div className="p-6 rounded-xl bg-slate-900 border border-slate-800 text-center text-slate-400">
        <Truck className="w-8 h-8 mx-auto mb-2 text-slate-600" />
        <p className="text-sm font-medium">Sistemde kayıtlı aktif şoför (DRIVER) bulunmuyor.</p>
        <p className="text-xs text-slate-500 mt-1">Personel listesinden "Şoför" rolü atandığında günlük kapasiteleri burada listelenir.</p>
      </div>
    )
  }

  return (
    <div className="bg-slate-900 rounded-xl border border-slate-800 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center">
            <Truck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Aktif Şoför (DRIVER) Kapasite Analizi</h3>
            <p className="text-xs text-slate-400">Bugüne ait atanan sevkiyat ve doluluk oranları</p>
          </div>
        </div>
        <span className="text-xs px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
          {drivers.length} Şoför
        </span>
      </div>

      <div className="space-y-4">
        {drivers.map((driver) => {
          const isHigh = driver.capacityPercent >= 80
          const isMedium = driver.capacityPercent >= 40 && driver.capacityPercent < 80
          const barColor = isHigh
            ? "bg-rose-500"
            : isMedium
            ? "bg-amber-500"
            : "bg-emerald-500"

          const statusBadge = isHigh ? (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-500/20 text-rose-400 border border-rose-500/30">
              Yoğun
            </span>
          ) : isMedium ? (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">
              Dengeli
            </span>
          ) : (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              Müsait
            </span>
          )

          return (
            <div key={driver.id} className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-white text-sm">{driver.name}</span>
                  {statusBadge}
                </div>
                <span className="font-bold text-xs text-slate-200">
                  {driver.deliveryCount} Teslimat (%{driver.capacityPercent} Dolu)
                </span>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${barColor}`}
                  style={{ width: `${Math.max(5, driver.capacityPercent)}%` }}
                />
              </div>

              {driver.currentSite && (
                <div className="mt-2 text-[11px] text-slate-500 flex items-center justify-between">
                  <span>Mevcut Konum: {driver.currentSite}</span>
                  <span>Günlük Hedef: 5 Teslimat</span>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
